<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Project;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

/**
 * Controller per il proxy verso i progetti
 * 
 * Gestisce le richieste proxy verso i singoli progetti SaaS.
 * Permette di inoltrare chiamate API ai progetti sottostanti.
 */
use Ultra\UltraLogManager\UltraLogManager;
use Ultra\ErrorManager\Interfaces\ErrorManagerInterface;

/**
 * Controller per il proxy verso i progetti
 * 
 * Gestisce le richieste proxy verso i singoli progetti SaaS.
 * Permette di inoltrare chiamate API ai progetti sottostanti.
 */
class ProjectProxyController extends Controller
{
    public function __construct(
        protected UltraLogManager $logger,
        protected ErrorManagerInterface $errorManager
    ) {}

    /**
     * Proxy di una richiesta verso un progetto specifico
     * 
     * ANY /api/proxy/{project}/{path}
     */
    public function proxy(Request $request, string $projectSlug, string $path = ''): JsonResponse
    {
        try {
            $project = Project::where('slug', $projectSlug)->first();

            if (!$project) {
                return response()->json([
                    'success' => false,
                    'message' => "Progetto '{$projectSlug}' non trovato",
                ], 404);
            }

            if (!$project->api_url) {
                return response()->json([
                    'success' => false,
                    'message' => "Il progetto '{$project->name}' non ha un API URL configurato",
                ], 422);
            }

            $targetUrl = rtrim($project->api_url, '/') . '/' . ltrim($path, '/');

            $response = Http::timeout(30)
                ->withHeaders([
                    'X-EGI-HUB-Request' => 'true',
                    'X-Original-IP' => $request->ip(),
                    'X-User-ID' => $request->user()?->id,
                    'Accept' => 'application/json',
                ])
                ->send($request->method(), $targetUrl, [
                    'query' => $request->query(),
                    'json' => $request->method() !== 'GET' ? $request->all() : null,
                ]);

            if (!$response->successful()) {
                 $this->logger->warning("Proxy request returned error status", [
                     'project' => $project->slug,
                     'status' => $response->status(),
                     'log_category' => 'PROJECT_PROXY_HTTP_ERROR'
                 ]);
            }

            return response()->json([
                'success' => $response->successful(),
                'data' => $response->json(),
                'status' => $response->status(),
            ], $response->status());

        } catch (\Exception $e) {
            return $this->errorManager->handle('PROJECT_PROXY_ERROR', [
                'project' => $projectSlug,
                'path' => $path,
                'log_category' => 'PROJECT_PROXY_EXCEPTION'
            ], $e);
        }
    }

    /**
     * Esegue una chiamata aggregata verso tutti i progetti
     * 
     * GET /api/proxy/aggregate
     */
    public function aggregate(Request $request): JsonResponse
    {
        // Questo metodo fa loop su progetti, quindi gestiamo errori internamente per non bloccare tutto
        // simile a checkAllHealth
        
        $endpoint = $request->get('endpoint', '');
        $projects = Project::active()->get();

        $results = [];
        $errors = [];
        $successful = 0;

        foreach ($projects as $project) {
            if (!$project->api_url) {
                $errors[$project->slug] = [
                    'success' => false,
                    'error' => 'API URL non configurato',
                ];
                continue;
            }

            try {
                $targetUrl = rtrim($project->api_url, '/') . '/' . ltrim($endpoint, '/');

                $response = Http::timeout(10)
                    ->withHeaders([
                        'X-EGI-HUB-Request' => 'true',
                        'Accept' => 'application/json',
                    ])
                    ->get($targetUrl);

                if ($response->successful()) {
                    $results[$project->slug] = [
                        'success' => true,
                        'data' => $response->json(),
                    ];
                    $successful++;
                } else {
                    $errors[$project->slug] = [
                        'success' => false,
                        'error' => 'HTTP ' . $response->status(),
                    ];
                }
            } catch (\Exception $e) {
                // UEM Handle for individual failure
                $this->errorManager->handle('PROJECT_PROXY_ERROR', [
                    'project' => $project->slug,
                    'endpoint' => $endpoint,
                    'log_category' => 'PROJECT_AGGREGATE_FAILURE'
                ], $e);

                $errors[$project->slug] = [
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
                    'total' => $projects->count(),
                    'successful' => $successful,
                    'failed' => count($errors),
                ],
            ],
        ]);
    }
}
