<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Middleware ProjectPermission
 * 
 * Verifica che l'utente abbia un permesso specifico sul progetto.
 * Deve essere usato DOPO il middleware ProjectAccess.
 * 
 * Utilizzo nelle routes:
 * - Route::middleware(['project.access', 'project.permission:can_manage_tenants'])
 * - Route::middleware(['project.access', 'project.permission:can_export'])
 * 
 * Permessi disponibili:
 * - can_manage_tenants: gestire tenant del progetto
 * - can_manage_settings: modificare configurazioni
 * - can_manage_admins: assegnare/rimuovere admin (solo owner)
 * - can_view_logs: visualizzare logs e attività
 * - can_export: esportare dati
 * - can_delete: eliminare risorse
 */
class ProjectPermission
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     * @param  string  $permission  Il permesso richiesto
     */
    public function handle(Request $request, Closure $next, string $permission): Response
    {
        $user = $request->user();

        // Super Admin ha sempre tutti i permessi
        if ($user && $user->isSuperAdmin()) {
            return $next($request);
        }

        // Recupera il ProjectAdmin dalla request (impostato da ProjectAccess middleware)
        $projectAdmin = $request->attributes->get('projectAdmin');

        if (!$projectAdmin) {
            return response()->json([
                'success' => false,
                'message' => 'Middleware ProjectAccess deve essere eseguito prima di ProjectPermission',
                'error' => 'middleware_order_error',
            ], 500);
        }

        // Verifica il permesso
        if (!$projectAdmin->hasPermission($permission)) {
            return response()->json([
                'success' => false,
                'message' => "Non hai il permesso '{$permission}' per questo progetto",
                'error' => 'permission_denied',
                'required_permission' => $permission,
                'your_role' => $projectAdmin->role,
            ], 403);
        }

        return $next($request);
    }
}
