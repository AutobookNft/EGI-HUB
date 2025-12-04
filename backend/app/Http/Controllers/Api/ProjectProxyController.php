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
class ProjectProxyController extends Controller
{
    /**
     * Proxy di una richiesta verso un progetto specifico
     * 
     * ANY /api/proxy/{project}/{path}
     */
    public function proxy(Request $request, string $projectSlug, string $path = ''): JsonResponse
    {
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

        try {
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

            return response()->json([
                'success' => $response->successful(),
                'data' => $response->json(),
                'status' => $response->status(),
            ], $response->status());
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Errore nella comunicazione con il progetto: ' . $e->getMessage(),
            ], 502);
        }
    }

    /**
     * Esegue una chiamata aggregata verso tutti i progetti
     * 
     * GET /api/proxy/aggregate
     */
    public function aggregate(Request $request): JsonResponse
    {
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
