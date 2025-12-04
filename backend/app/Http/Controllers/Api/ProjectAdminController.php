<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Project;
use App\Models\ProjectAdmin;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

/**
 * Controller per gestione Project Admins
 * 
 * Gestisce l'assegnazione di utenti ai progetti con ruoli specifici.
 * 
 * Permessi richiesti:
 * - Lettura lista admins: qualsiasi ruolo
 * - Aggiunta/modifica/rimozione admins: solo owner o super admin
 */
class ProjectAdminController extends Controller
{
    /**
     * Lista tutti gli admin di un progetto
     * 
     * GET /api/projects/{slug}/admins
     */
    public function index(Request $request, string $slug): JsonResponse
    {
        $project = Project::where('slug', $slug)->firstOrFail();

        $admins = $project->adminRecords()
            ->with(['user:id,name,email', 'assignedBy:id,name'])
            ->orderBy('role')
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($admin) {
                return [
                    'id' => $admin->id,
                    'user' => [
                        'id' => $admin->user->id,
                        'name' => $admin->user->name,
                        'email' => $admin->user->email,
                    ],
                    'role' => $admin->role,
                    'role_label' => $admin->role_label,
                    'role_badge_color' => $admin->role_badge_color,
                    'permissions' => $admin->getEffectivePermissions(),
                    'is_active' => $admin->is_active,
                    'is_valid' => $admin->isValid(),
                    'assigned_by' => $admin->assignedBy ? [
                        'id' => $admin->assignedBy->id,
                        'name' => $admin->assignedBy->name,
                    ] : null,
                    'assigned_at' => $admin->assigned_at?->toISOString(),
                    'expires_at' => $admin->expires_at?->toISOString(),
                    'notes' => $admin->notes,
                    'created_at' => $admin->created_at->toISOString(),
                ];
            });

        return response()->json([
            'success' => true,
            'data' => $admins,
            'meta' => [
                'total' => $admins->count(),
                'owners' => $admins->where('role', 'owner')->count(),
                'admins' => $admins->where('role', 'admin')->count(),
                'viewers' => $admins->where('role', 'viewer')->count(),
            ],
        ]);
    }

    /**
     * Visualizza dettagli di un singolo project admin
     * 
     * GET /api/projects/{slug}/admins/{adminId}
     */
    public function show(Request $request, string $slug, int $adminId): JsonResponse
    {
        $project = Project::where('slug', $slug)->firstOrFail();
        
        $admin = $project->adminRecords()
            ->with(['user:id,name,email', 'assignedBy:id,name'])
            ->findOrFail($adminId);

        return response()->json([
            'success' => true,
            'data' => [
                'id' => $admin->id,
                'user' => [
                    'id' => $admin->user->id,
                    'name' => $admin->user->name,
                    'email' => $admin->user->email,
                ],
                'role' => $admin->role,
                'role_label' => $admin->role_label,
                'permissions' => $admin->getEffectivePermissions(),
                'custom_permissions' => $admin->permissions,
                'is_active' => $admin->is_active,
                'is_valid' => $admin->isValid(),
                'assigned_by' => $admin->assignedBy ? [
                    'id' => $admin->assignedBy->id,
                    'name' => $admin->assignedBy->name,
                ] : null,
                'assigned_at' => $admin->assigned_at?->toISOString(),
                'expires_at' => $admin->expires_at?->toISOString(),
                'notes' => $admin->notes,
                'created_at' => $admin->created_at->toISOString(),
                'updated_at' => $admin->updated_at->toISOString(),
            ],
        ]);
    }

    /**
     * Assegna un nuovo admin al progetto
     * 
     * POST /api/projects/{slug}/admins
     * 
     * Body:
     * - user_id: int (required)
     * - role: string (optional, default: viewer)
     * - permissions: array (optional)
     * - expires_at: datetime (optional)
     * - notes: string (optional)
     */
    public function store(Request $request, string $slug): JsonResponse
    {
        $project = Project::where('slug', $slug)->firstOrFail();

        // Verifica permesso (solo owner può aggiungere admin)
        $currentUser = $request->user();
        if (!$currentUser->isSuperAdmin() && !$currentUser->isOwnerOf($project)) {
            return response()->json([
                'success' => false,
                'message' => 'Solo il Project Owner può assegnare nuovi admin',
                'error' => 'permission_denied',
            ], 403);
        }

        $validator = Validator::make($request->all(), [
            'user_id' => 'required|exists:users,id',
            'role' => 'sometimes|in:owner,admin,viewer',
            'permissions' => 'sometimes|array',
            'expires_at' => 'sometimes|nullable|date|after:now',
            'notes' => 'sometimes|nullable|string|max:1000',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validazione fallita',
                'errors' => $validator->errors(),
            ], 422);
        }

        $userId = $request->input('user_id');

        // Verifica che l'utente non sia già admin
        $existing = $project->adminRecords()->where('user_id', $userId)->first();
        if ($existing) {
            return response()->json([
                'success' => false,
                'message' => 'Questo utente è già assegnato al progetto',
                'error' => 'user_already_assigned',
                'existing_admin_id' => $existing->id,
            ], 409);
        }

        $user = User::findOrFail($userId);

        $admin = ProjectAdmin::create([
            'project_id' => $project->id,
            'user_id' => $userId,
            'role' => $request->input('role', ProjectAdmin::ROLE_VIEWER),
            'permissions' => $request->input('permissions'),
            'assigned_by' => $currentUser->id,
            'expires_at' => $request->input('expires_at'),
            'notes' => $request->input('notes'),
            'is_active' => true,
        ]);

        return response()->json([
            'success' => true,
            'message' => "Utente {$user->name} assegnato al progetto come {$admin->role_label}",
            'data' => [
                'id' => $admin->id,
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                ],
                'role' => $admin->role,
                'role_label' => $admin->role_label,
            ],
        ], 201);
    }

    /**
     * Aggiorna ruolo/permessi di un admin
     * 
     * PUT /api/projects/{slug}/admins/{adminId}
     */
    public function update(Request $request, string $slug, int $adminId): JsonResponse
    {
        $project = Project::where('slug', $slug)->firstOrFail();

        // Verifica permesso
        $currentUser = $request->user();
        if (!$currentUser->isSuperAdmin() && !$currentUser->isOwnerOf($project)) {
            return response()->json([
                'success' => false,
                'message' => 'Solo il Project Owner può modificare gli admin',
                'error' => 'permission_denied',
            ], 403);
        }

        $admin = $project->adminRecords()->findOrFail($adminId);

        // Non si può modificare se stessi (evita auto-downgrade)
        if ($admin->user_id === $currentUser->id && !$currentUser->isSuperAdmin()) {
            return response()->json([
                'success' => false,
                'message' => 'Non puoi modificare il tuo stesso accesso',
                'error' => 'cannot_modify_self',
            ], 403);
        }

        $validator = Validator::make($request->all(), [
            'role' => 'sometimes|in:owner,admin,viewer',
            'permissions' => 'sometimes|nullable|array',
            'is_active' => 'sometimes|boolean',
            'expires_at' => 'sometimes|nullable|date|after:now',
            'notes' => 'sometimes|nullable|string|max:1000',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validazione fallita',
                'errors' => $validator->errors(),
            ], 422);
        }

        $admin->update($request->only([
            'role',
            'permissions',
            'is_active',
            'expires_at',
            'notes',
        ]));

        return response()->json([
            'success' => true,
            'message' => 'Admin aggiornato con successo',
            'data' => [
                'id' => $admin->id,
                'user' => [
                    'id' => $admin->user->id,
                    'name' => $admin->user->name,
                ],
                'role' => $admin->role,
                'role_label' => $admin->role_label,
                'is_active' => $admin->is_active,
            ],
        ]);
    }

    /**
     * Rimuovi un admin dal progetto
     * 
     * DELETE /api/projects/{slug}/admins/{adminId}
     */
    public function destroy(Request $request, string $slug, int $adminId): JsonResponse
    {
        $project = Project::where('slug', $slug)->firstOrFail();

        // Verifica permesso
        $currentUser = $request->user();
        if (!$currentUser->isSuperAdmin() && !$currentUser->isOwnerOf($project)) {
            return response()->json([
                'success' => false,
                'message' => 'Solo il Project Owner può rimuovere admin',
                'error' => 'permission_denied',
            ], 403);
        }

        $admin = $project->adminRecords()->findOrFail($adminId);

        // Non si può rimuovere se stessi
        if ($admin->user_id === $currentUser->id && !$currentUser->isSuperAdmin()) {
            return response()->json([
                'success' => false,
                'message' => 'Non puoi rimuovere te stesso dal progetto',
                'error' => 'cannot_remove_self',
            ], 403);
        }

        // Verifica che rimanga almeno un owner
        if ($admin->isOwner()) {
            $otherOwners = $project->adminRecords()
                ->where('id', '!=', $adminId)
                ->withRole(ProjectAdmin::ROLE_OWNER)
                ->active()
                ->count();

            if ($otherOwners === 0) {
                return response()->json([
                    'success' => false,
                    'message' => 'Impossibile rimuovere l\'ultimo owner del progetto',
                    'error' => 'last_owner',
                ], 400);
            }
        }

        $userName = $admin->user->name;
        $admin->delete();

        return response()->json([
            'success' => true,
            'message' => "Accesso di {$userName} rimosso dal progetto",
        ]);
    }

    /**
     * Lista tutti i progetti accessibili all'utente corrente
     * 
     * GET /api/my-projects
     */
    public function myProjects(Request $request): JsonResponse
    {
        $user = $request->user();

        // Super Admin vede tutti i progetti
        if ($user->isSuperAdmin()) {
            $projects = Project::with(['adminRecords' => function ($query) use ($user) {
                $query->where('user_id', $user->id);
            }])->get();

            return response()->json([
                'success' => true,
                'data' => $projects->map(fn($p) => $this->formatProjectAccess($p, null, true)),
                'is_super_admin' => true,
            ]);
        }

        // Utente normale vede solo i progetti a cui ha accesso
        $projectAdmins = $user->projectAdminRecords()
            ->active()
            ->with('project')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $projectAdmins->map(fn($pa) => $this->formatProjectAccess($pa->project, $pa)),
            'is_super_admin' => false,
        ]);
    }

    /**
     * Formatta i dati di accesso a un progetto
     */
    protected function formatProjectAccess(Project $project, ?ProjectAdmin $projectAdmin = null, bool $isSuperAdmin = false): array
    {
        return [
            'id' => $project->id,
            'name' => $project->name,
            'slug' => $project->slug,
            'description' => $project->description,
            'url' => $project->url,
            'status' => $project->status,
            'is_healthy' => $project->is_healthy,
            'access' => $isSuperAdmin ? [
                'role' => 'super_admin',
                'role_label' => 'Super Admin EGI',
                'permissions' => ProjectAdmin::DEFAULT_PERMISSIONS[ProjectAdmin::ROLE_OWNER],
            ] : ($projectAdmin ? [
                'role' => $projectAdmin->role,
                'role_label' => $projectAdmin->role_label,
                'permissions' => $projectAdmin->getEffectivePermissions(),
                'expires_at' => $projectAdmin->expires_at?->toISOString(),
            ] : null),
        ];
    }

    /**
     * Sospendi temporaneamente un admin
     * 
     * POST /api/projects/{slug}/admins/{adminId}/suspend
     */
    public function suspend(Request $request, string $slug, int $adminId): JsonResponse
    {
        $project = Project::where('slug', $slug)->firstOrFail();

        $currentUser = $request->user();
        if (!$currentUser->isSuperAdmin() && !$currentUser->isOwnerOf($project)) {
            return response()->json([
                'success' => false,
                'message' => 'Solo il Project Owner può sospendere admin',
                'error' => 'permission_denied',
            ], 403);
        }

        $admin = $project->adminRecords()->findOrFail($adminId);

        if ($admin->user_id === $currentUser->id && !$currentUser->isSuperAdmin()) {
            return response()->json([
                'success' => false,
                'message' => 'Non puoi sospendere te stesso',
                'error' => 'cannot_suspend_self',
            ], 403);
        }

        $reason = $request->input('reason');
        $admin->suspend($reason);

        return response()->json([
            'success' => true,
            'message' => "Accesso di {$admin->user->name} sospeso",
        ]);
    }

    /**
     * Riattiva un admin sospeso
     * 
     * POST /api/projects/{slug}/admins/{adminId}/reactivate
     */
    public function reactivate(Request $request, string $slug, int $adminId): JsonResponse
    {
        $project = Project::where('slug', $slug)->firstOrFail();

        $currentUser = $request->user();
        if (!$currentUser->isSuperAdmin() && !$currentUser->isOwnerOf($project)) {
            return response()->json([
                'success' => false,
                'message' => 'Solo il Project Owner può riattivare admin',
                'error' => 'permission_denied',
            ], 403);
        }

        $admin = $project->adminRecords()->findOrFail($adminId);
        $admin->reactivate();

        return response()->json([
            'success' => true,
            'message' => "Accesso di {$admin->user->name} riattivato",
        ]);
    }
}
