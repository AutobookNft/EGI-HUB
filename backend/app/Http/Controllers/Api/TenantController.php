<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Tenant;
use App\Services\TenantService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

/**
 * TenantController
 * 
 * Gestisce le operazioni CRUD sui tenant.
 * Permette al SuperAdmin di registrare, modificare e rimuovere tenant.
 */
class TenantController extends Controller
{
    protected string $modelClass;

    public function __construct(
        protected TenantService $tenantService
    ) {
        $this->modelClass = config('egi-hub.tenants.model', \App\Models\Tenant::class);
    }

    /**
     * Lista tutti i tenant
     */
    public function index(Request $request): JsonResponse
    {
        $query = $this->modelClass::query();

        // Filtri opzionali
        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        if ($request->has('healthy')) {
            $query->where('is_healthy', $request->boolean('healthy'));
        }

        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('slug', 'like', "%{$search}%")
                  ->orWhere('url', 'like', "%{$search}%");
            });
        }

        // Ordinamento
        $sortBy = $request->get('sort_by', 'name');
        $sortDir = $request->get('sort_dir', 'asc');
        $query->orderBy($sortBy, $sortDir);

        // Paginazione opzionale
        if ($request->has('per_page')) {
            $tenants = $query->paginate($request->integer('per_page', 15));
        } else {
            $tenants = $query->get();
        }

        return response()->json([
            'success' => true,
            'data' => $tenants,
        ]);
    }

    /**
     * Mostra un singolo tenant
     */
    public function show(Tenant $tenant): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => $tenant,
        ]);
    }

    /**
     * Crea un nuovo tenant
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'slug' => 'required|string|max:255|unique:tenants,slug|alpha_dash',
            'description' => 'nullable|string',
            'url' => 'required|url',
            'api_key' => 'nullable|string|max:255',
            'api_secret' => 'nullable|string|max:255',
            'status' => ['nullable', Rule::in(['active', 'inactive', 'maintenance'])],
            'metadata' => 'nullable|array',
        ]);

        $tenant = $this->modelClass::create($validated);

        // Health check iniziale
        $this->tenantService->checkHealth($tenant);

        return response()->json([
            'success' => true,
            'message' => 'Tenant creato con successo',
            'data' => $tenant->fresh(),
        ], 201);
    }

    /**
     * Aggiorna un tenant esistente
     */
    public function update(Request $request, Tenant $tenant): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'slug' => ['sometimes', 'string', 'max:255', 'alpha_dash', Rule::unique('tenants')->ignore($tenant->id)],
            'description' => 'nullable|string',
            'url' => 'sometimes|url',
            'api_key' => 'nullable|string|max:255',
            'api_secret' => 'nullable|string|max:255',
            'status' => ['nullable', Rule::in(['active', 'inactive', 'maintenance'])],
            'metadata' => 'nullable|array',
        ]);

        $tenant->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Tenant aggiornato con successo',
            'data' => $tenant->fresh(),
        ]);
    }

    /**
     * Elimina un tenant (soft delete)
     */
    public function destroy(Tenant $tenant): JsonResponse
    {
        $tenant->delete();

        return response()->json([
            'success' => true,
            'message' => 'Tenant eliminato con successo',
        ]);
    }

    /**
     * Verifica lo stato di salute di un tenant
     */
    public function healthCheck(Tenant $tenant): JsonResponse
    {
        $result = $this->tenantService->checkHealth($tenant);

        return response()->json([
            'success' => true,
            'data' => [
                'tenant' => $tenant->fresh(),
                'health' => $result,
            ],
        ]);
    }

    /**
     * Verifica lo stato di salute di tutti i tenant
     */
    public function healthCheckAll(): JsonResponse
    {
        $results = $this->tenantService->checkAllHealth();

        return response()->json([
            'success' => true,
            'data' => $results,
        ]);
    }

    /**
     * Ottiene statistiche aggregate sui tenant
     */
    public function stats(): JsonResponse
    {
        $stats = [
            'total' => $this->modelClass::count(),
            'active' => $this->modelClass::where('status', 'active')->count(),
            'inactive' => $this->modelClass::where('status', 'inactive')->count(),
            'maintenance' => $this->modelClass::where('status', 'maintenance')->count(),
            'error' => $this->modelClass::where('status', 'error')->count(),
            'healthy' => $this->modelClass::where('is_healthy', true)->count(),
            'unhealthy' => $this->modelClass::where('is_healthy', false)->count(),
        ];

        return response()->json([
            'success' => true,
            'data' => $stats,
        ]);
    }

    /**
     * Avvia un tenant (esegue lo script start)
     */
    public function start(Tenant $tenant): JsonResponse
    {
        $result = $this->tenantService->startTenant($tenant);

        return response()->json([
            'success' => $result['success'],
            'message' => $result['message'],
            'data' => $result,
        ], $result['success'] ? 200 : 500);
    }

    /**
     * Ferma un tenant (esegue lo script stop)
     */
    public function stop(Tenant $tenant): JsonResponse
    {
        $result = $this->tenantService->stopTenant($tenant);

        return response()->json([
            'success' => $result['success'],
            'message' => $result['message'],
            'data' => $result,
        ], $result['success'] ? 200 : 500);
    }
}
