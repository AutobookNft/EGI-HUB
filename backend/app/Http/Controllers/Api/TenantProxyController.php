<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Tenant;
use App\Services\TenantService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * TenantProxyController
 * 
 * Gestisce il proxying delle richieste verso i tenant.
 * Permette a EGI-HUB di fare da intermediario tra il frontend e le API dei tenant.
 */
class TenantProxyController extends Controller
{
    public function __construct(
        protected TenantService $tenantService
    ) {}

    /**
     * Proxy una richiesta GET verso un tenant
     */
    public function get(Request $request, string $tenantSlug, string $path = ''): JsonResponse
    {
        return $this->proxyRequest($request, $tenantSlug, $path, 'GET');
    }

    /**
     * Proxy una richiesta POST verso un tenant
     */
    public function post(Request $request, string $tenantSlug, string $path = ''): JsonResponse
    {
        return $this->proxyRequest($request, $tenantSlug, $path, 'POST');
    }

    /**
     * Proxy una richiesta PUT verso un tenant
     */
    public function put(Request $request, string $tenantSlug, string $path = ''): JsonResponse
    {
        return $this->proxyRequest($request, $tenantSlug, $path, 'PUT');
    }

    /**
     * Proxy una richiesta PATCH verso un tenant
     */
    public function patch(Request $request, string $tenantSlug, string $path = ''): JsonResponse
    {
        return $this->proxyRequest($request, $tenantSlug, $path, 'PATCH');
    }

    /**
     * Proxy una richiesta DELETE verso un tenant
     */
    public function delete(Request $request, string $tenantSlug, string $path = ''): JsonResponse
    {
        return $this->proxyRequest($request, $tenantSlug, $path, 'DELETE');
    }

    /**
     * Esegue il proxy della richiesta
     */
    protected function proxyRequest(Request $request, string $tenantSlug, string $path, string $method): JsonResponse
    {
        // Trova il tenant
        $tenant = Tenant::where('slug', $tenantSlug)->first();

        if (!$tenant) {
            return response()->json([
                'success' => false,
                'error' => 'Tenant non trovato',
                'code' => 'TENANT_NOT_FOUND',
            ], 404);
        }

        // Verifica che il tenant sia attivo
        if (!$tenant->isActive()) {
            return response()->json([
                'success' => false,
                'error' => 'Tenant non disponibile',
                'code' => 'TENANT_UNAVAILABLE',
                'status' => $tenant->status,
            ], 503);
        }

        // Esegui la richiesta al tenant
        try {
            $result = $this->tenantService->proxyRequest(
                tenant: $tenant,
                method: $method,
                path: $path,
                data: $request->all(),
                headers: $this->extractForwardHeaders($request)
            );

            return response()->json([
                'success' => true,
                'tenant' => $tenant->slug,
                'data' => $result['data'],
            ], $result['status']);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => 'Errore nella comunicazione con il tenant',
                'code' => 'PROXY_ERROR',
                'message' => $e->getMessage(),
            ], 502);
        }
    }

    /**
     * Estrae gli header da inoltrare al tenant
     */
    protected function extractForwardHeaders(Request $request): array
    {
        $forwardHeaders = [];
        
        // Header da inoltrare
        $headerNames = [
            'Authorization',
            'X-Request-ID',
            'X-Correlation-ID',
            'Accept-Language',
        ];

        foreach ($headerNames as $name) {
            if ($request->hasHeader($name)) {
                $forwardHeaders[$name] = $request->header($name);
            }
        }

        return $forwardHeaders;
    }

    /**
     * Ottiene informazioni aggregate da tutti i tenant attivi
     */
    public function aggregate(Request $request): JsonResponse
    {
        $endpoint = $request->get('endpoint', '');
        $tenants = Tenant::active()->healthy()->get();
        
        $results = [];
        $errors = [];

        foreach ($tenants as $tenant) {
            try {
                $result = $this->tenantService->proxyRequest(
                    tenant: $tenant,
                    method: 'GET',
                    path: $endpoint,
                    data: $request->except('endpoint')
                );

                $results[$tenant->slug] = [
                    'success' => true,
                    'data' => $result['data'],
                ];
            } catch (\Exception $e) {
                $errors[$tenant->slug] = [
                    'success' => false,
                    'error' => $e->getMessage(),
                ];
            }
        }

        return response()->json([
            'success' => true,
            'data' => [
                'results' => $results,
                'errors' => $errors,
                'summary' => [
                    'total' => count($tenants),
                    'successful' => count($results),
                    'failed' => count($errors),
                ],
            ],
        ]);
    }
}
