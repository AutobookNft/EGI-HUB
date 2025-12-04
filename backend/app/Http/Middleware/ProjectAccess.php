<?php

namespace App\Http\Middleware;

use App\Models\Project;
use App\Models\ProjectAdmin;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Middleware ProjectAccess
 * 
 * Verifica che l'utente autenticato abbia accesso al progetto specificato.
 * Può essere configurato per richiedere un ruolo minimo.
 * 
 * Utilizzo nelle routes:
 * - Route::middleware('project.access') - qualsiasi ruolo (owner, admin, viewer)
 * - Route::middleware('project.access:admin') - almeno admin
 * - Route::middleware('project.access:owner') - solo owner
 * 
 * NOTA: I Super Admin EGI hanno sempre accesso a tutto.
 */
class ProjectAccess
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     * @param  string|null  $minimumRole  Il ruolo minimo richiesto: 'viewer', 'admin', 'owner'
     */
    public function handle(Request $request, Closure $next, ?string $minimumRole = null): Response
    {
        $user = $request->user();

        // Utente non autenticato
        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Autenticazione richiesta',
                'error' => 'unauthenticated',
            ], 401);
        }

        // Super Admin EGI ha sempre accesso
        if ($user->isSuperAdmin()) {
            return $next($request);
        }

        // Recupera il progetto dalla route (cerca slug o id)
        $project = $this->resolveProject($request);

        if (!$project) {
            return response()->json([
                'success' => false,
                'message' => 'Progetto non trovato',
                'error' => 'project_not_found',
            ], 404);
        }

        // Verifica accesso base al progetto
        $projectAdmin = $user->getProjectAdminRecord($project);

        if (!$projectAdmin) {
            return response()->json([
                'success' => false,
                'message' => 'Non hai accesso a questo progetto',
                'error' => 'access_denied',
            ], 403);
        }

        // Verifica che l'accesso sia valido (attivo e non scaduto)
        if (!$projectAdmin->isValid()) {
            return response()->json([
                'success' => false,
                'message' => 'Il tuo accesso a questo progetto è scaduto o sospeso',
                'error' => 'access_expired',
            ], 403);
        }

        // Verifica il ruolo minimo richiesto
        if ($minimumRole && !$this->hasMinimumRole($projectAdmin, $minimumRole)) {
            return response()->json([
                'success' => false,
                'message' => "Questo endpoint richiede ruolo '{$minimumRole}' o superiore",
                'error' => 'insufficient_role',
                'required_role' => $minimumRole,
                'your_role' => $projectAdmin->role,
            ], 403);
        }

        // Aggiungi progetto e record admin alla request per uso nei controller
        $request->merge([
            'current_project' => $project,
            'current_project_admin' => $projectAdmin,
        ]);

        // Aggiungi anche come attributi per accesso più pulito
        $request->attributes->set('project', $project);
        $request->attributes->set('projectAdmin', $projectAdmin);

        return $next($request);
    }

    /**
     * Risolvi il progetto dalla route parameter
     */
    protected function resolveProject(Request $request): ?Project
    {
        // Cerca prima per slug
        $slug = $request->route('slug') ?? $request->route('project');
        
        if ($slug) {
            // Se è un numero, cerca per ID
            if (is_numeric($slug)) {
                return Project::find($slug);
            }
            // Altrimenti cerca per slug
            return Project::where('slug', $slug)->first();
        }

        // Cerca nell'URL path
        $path = $request->path();
        if (preg_match('/projects\/([^\/]+)/', $path, $matches)) {
            $identifier = $matches[1];
            if (is_numeric($identifier)) {
                return Project::find($identifier);
            }
            return Project::where('slug', $identifier)->first();
        }

        return null;
    }

    /**
     * Verifica se il ProjectAdmin ha almeno il ruolo specificato
     */
    protected function hasMinimumRole(ProjectAdmin $projectAdmin, string $minimumRole): bool
    {
        $roleHierarchy = [
            ProjectAdmin::ROLE_VIEWER => 1,
            ProjectAdmin::ROLE_ADMIN => 2,
            ProjectAdmin::ROLE_OWNER => 3,
        ];

        $currentLevel = $roleHierarchy[$projectAdmin->role] ?? 0;
        $requiredLevel = $roleHierarchy[$minimumRole] ?? 999;

        return $currentLevel >= $requiredLevel;
    }
}
