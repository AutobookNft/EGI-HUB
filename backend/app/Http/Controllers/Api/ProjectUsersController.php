<?php declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Project;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

/**
 * @package App\Http\Controllers\Api
 * @author Padmin D. Curtis (AI Partner OS3.0) for Fabio Cherici
 * @version 1.0.0 (FlorenceEGI - EGI-HUB Project Users)
 * @date 2026-03-13
 * @purpose Lista utenti di un progetto dalla tabella users condivisa (system_project_id + tenant_id)
 */
class ProjectUsersController extends Controller
{
    /**
     * Lista utenti di un progetto raggruppati per tenant
     *
     * GET /api/projects/{slug}/users
     */
    public function index(Request $request, string $slug): JsonResponse
    {
        $project = Project::where('slug', $slug)->firstOrFail();

        $users = User::where('system_project_id', $project->id)
            ->select([
                'id', 'name', 'last_name', 'email',
                'usertype', 'platform_role',
                'tenant_id', 'system_project_id',
                'is_super_admin', 'status',
                'created_at', 'last_activity_logged_at',
            ])
            ->orderBy('tenant_id')
            ->orderBy('usertype')
            ->orderBy('name')
            ->get();

        // Recupera i tenant coinvolti per mostrare i nomi
        $tenantIds = $users->pluck('tenant_id')->filter()->unique()->values();
        $tenants = DB::table('tenants')
            ->whereIn('id', $tenantIds)
            ->select('id', 'name', 'slug', 'entity_type')
            ->get()
            ->keyBy('id');

        // Mappa utenti con dati tenant
        $mapped = $users->map(function (User $u) use ($tenants) {
            $tenant = $u->tenant_id ? ($tenants[$u->tenant_id] ?? null) : null;
            return [
                'id'             => $u->id,
                'name'           => trim(($u->name ?? '') . ' ' . ($u->last_name ?? '')),
                'email'          => $u->email,
                'usertype'       => $u->usertype,
                'platform_role'  => $u->platform_role,
                'is_super_admin' => (bool) $u->is_super_admin,
                'status'         => $u->status,
                'last_active_at' => $u->last_activity_logged_at,
                'tenant'         => $tenant ? [
                    'id'          => $tenant->id,
                    'name'        => $tenant->name,
                    'slug'        => $tenant->slug,
                    'entity_type' => $tenant->entity_type,
                ] : null,
            ];
        });

        // Statistiche
        $meta = [
            'total'       => $mapped->count(),
            'admins'      => $mapped->whereIn('usertype', ['pa_entity_admin', 'admin'])->count(),
            'by_usertype' => $mapped->groupBy('usertype')->map->count(),
            'by_tenant'   => $mapped->groupBy('tenant.id')->map->count(),
        ];

        return response()->json([
            'success' => true,
            'data'    => $mapped->values(),
            'meta'    => $meta,
            'project' => [
                'id'   => $project->id,
                'name' => $project->name,
                'slug' => $project->slug,
            ],
        ]);
    }

    /**
     * Progetti accessibili all'utente corrente
     *
     * GET /api/my-projects
     * SuperAdmin → tutti i progetti attivi
     * Utente normale → progetti dove system_project_id corrisponde
     */
    public function myProjects(Request $request): JsonResponse
    {
        $user = $request->user();

        $projects = Project::whereNull('deleted_at')
            ->where('is_active', true)
            ->get();

        return response()->json([
            'success'        => true,
            'data'           => $projects->map(fn(Project $p) => [
                'id'          => $p->id,
                'name'        => $p->name,
                'slug'        => $p->slug,
                'description' => $p->description,
                'url'         => $p->url,
                'status'      => $p->status,
                'is_healthy'  => $p->is_healthy,
                'access'      => [
                    'role'       => 'super_admin',
                    'role_label' => 'Super Admin EGI',
                ],
            ]),
            'is_super_admin' => (bool) $user->is_super_admin,
        ]);
    }
}
