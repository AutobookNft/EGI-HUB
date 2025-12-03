<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Project;
use App\Services\ProjectService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

/**
 * ProjectController
 * 
 * Gestisce le operazioni CRUD sui progetti SaaS.
 * Permette al SuperAdmin di registrare, modificare e rimuovere progetti.
 * 
 * NOTA: I "Projects" in EGI-HUB sono le applicazioni SaaS (NATAN_LOC, EGI, etc.)
 * mentre i "Tenants" sono i clienti finali di ogni progetto.
 */
class ProjectController extends Controller
{
    public function __construct(
        protected ProjectService $projectService
    ) {}

    /**
     * Lista tutti i progetti
     */
    public function index(Request $request): JsonResponse
    {
        $query = Project::query();

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
            $projects = $query->paginate($request->integer('per_page', 15));
        } else {
            $projects = $query->get();
        }

        return response()->json([
            'success' => true,
            'data' => $projects,
        ]);
    }

    /**
     * Mostra un singolo progetto
     */
    public function show(Project $project): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => $project,
        ]);
    }

    /**
     * Crea un nuovo progetto
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'slug' => 'required|string|max:255|unique:projects,slug|alpha_dash',
            'description' => 'nullable|string',
            'url' => 'required|url',
            'production_url' => 'nullable|url',
            'staging_url' => 'nullable|url',
            'api_key' => 'nullable|string|max:255',
            'api_secret' => 'nullable|string|max:255',
            'status' => ['nullable', Rule::in(['active', 'inactive', 'maintenance'])],
            'metadata' => 'nullable|array',
            'local_start_script' => 'nullable|string|max:500',
            'local_stop_script' => 'nullable|string|max:500',
            'supervisor_program' => 'nullable|string|max:255',
        ]);

        $project = Project::create($validated);

        // Health check iniziale
        $this->projectService->checkHealth($project);

        return response()->json([
            'success' => true,
            'message' => 'Progetto creato con successo',
            'data' => $project->fresh(),
        ], 201);
    }

    /**
     * Aggiorna un progetto esistente
     */
    public function update(Request $request, Project $project): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'slug' => ['sometimes', 'string', 'max:255', 'alpha_dash', Rule::unique('projects')->ignore($project->id)],
            'description' => 'nullable|string',
            'url' => 'sometimes|url',
            'production_url' => 'nullable|url',
            'staging_url' => 'nullable|url',
            'api_key' => 'nullable|string|max:255',
            'api_secret' => 'nullable|string|max:255',
            'status' => ['nullable', Rule::in(['active', 'inactive', 'maintenance'])],
            'metadata' => 'nullable|array',
            'local_start_script' => 'nullable|string|max:500',
            'local_stop_script' => 'nullable|string|max:500',
            'supervisor_program' => 'nullable|string|max:255',
        ]);

        $project->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Progetto aggiornato con successo',
            'data' => $project->fresh(),
        ]);
    }

    /**
     * Elimina un progetto (soft delete)
     */
    public function destroy(Project $project): JsonResponse
    {
        $project->delete();

        return response()->json([
            'success' => true,
            'message' => 'Progetto eliminato con successo',
        ]);
    }

    /**
     * Verifica lo stato di salute di un progetto
     */
    public function healthCheck(Project $project): JsonResponse
    {
        $result = $this->projectService->checkHealth($project);

        return response()->json([
            'success' => true,
            'data' => [
                'project' => $project->fresh(),
                'health' => $result,
            ],
        ]);
    }

    /**
     * Verifica lo stato di salute di tutti i progetti
     */
    public function healthCheckAll(): JsonResponse
    {
        $results = $this->projectService->checkAllHealth();

        return response()->json([
            'success' => true,
            'data' => $results,
        ]);
    }

    /**
     * Ottiene statistiche aggregate sui progetti
     */
    public function stats(): JsonResponse
    {
        $stats = [
            'total' => Project::count(),
            'active' => Project::where('status', 'active')->count(),
            'inactive' => Project::where('status', 'inactive')->count(),
            'maintenance' => Project::where('status', 'maintenance')->count(),
            'error' => Project::where('status', 'error')->count(),
            'healthy' => Project::where('is_healthy', true)->count(),
            'unhealthy' => Project::where('is_healthy', false)->count(),
        ];

        return response()->json([
            'success' => true,
            'data' => $stats,
        ]);
    }

    /**
     * Avvia un progetto (esegue lo script start)
     */
    public function start(Project $project): JsonResponse
    {
        $result = $this->projectService->startProject($project);

        return response()->json([
            'success' => $result['success'],
            'message' => $result['message'],
            'data' => $result,
        ], $result['success'] ? 200 : 500);
    }

    /**
     * Ferma un progetto (esegue lo script stop)
     */
    public function stop(Project $project): JsonResponse
    {
        $result = $this->projectService->stopProject($project);

        return response()->json([
            'success' => $result['success'],
            'message' => $result['message'],
            'data' => $result,
        ], $result['success'] ? 200 : 500);
    }
}
