<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Tenant;
use App\Models\TenantActivity;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

use Ultra\UltraLogManager\UltraLogManager;
use Ultra\ErrorManager\Interfaces\ErrorManagerInterface;

/**
 * TenantActivityController
 * 
 * Gestisce le attività dei tenant.
 */
class TenantActivityController extends Controller
{
    public function __construct(
        protected UltraLogManager $logger,
        protected ErrorManagerInterface $errorManager
    ) {}

    /**
     * Lista tutte le attività (con filtri)
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $query = TenantActivity::with('tenant:id,name,slug')
                ->orderBy('created_at', 'desc');

            // Filtro per tenant
            if ($request->has('tenant_id')) {
                $query->where('tenant_id', $request->tenant_id);
            }

            // Filtro per tipo
            if ($request->has('type')) {
                $query->where('type', $request->type);
            }

            // Filtro per status
            if ($request->has('status')) {
                $query->where('status', $request->status);
            }

            // Filtro per periodo
            if ($request->has('hours')) {
                $query->where('created_at', '>=', now()->subHours($request->integer('hours')));
            }

            // Paginazione
            $perPage = $request->integer('per_page', 50);
            $activities = $query->paginate($perPage);

            return response()->json([
                'success' => true,
                'data' => $activities,
            ]);
        } catch (\Exception $e) {
            return $this->errorManager->handle('TENANT_ACTIVITY_LIST_ERROR', [
                'action' => 'list_activities',
                'filters' => $request->all(),
                'log_category' => 'TENANT_ACTIVITY_LIST_ERROR'
            ], $e);
        }
    }

    /**
     * Attività di un singolo tenant
     */
    public function forTenant(Request $request, Tenant $tenant): JsonResponse
    {
        try {
            $query = TenantActivity::where('tenant_id', $tenant->id)
                ->orderBy('created_at', 'desc');

            // Filtro per tipo
            if ($request->has('type')) {
                $query->where('type', $request->type);
            }

            // Filtro per status
            if ($request->has('status')) {
                $query->where('status', $request->status);
            }

            // Limite
            $limit = $request->integer('limit', 100);
            $activities = $query->limit($limit)->get();

            return response()->json([
                'success' => true,
                'data' => [
                    'tenant' => $tenant->only(['id', 'name', 'slug', 'status', 'is_healthy']),
                    'activities' => $activities,
                ],
            ]);
        } catch (\Exception $e) {
            return $this->errorManager->handle('TENANT_ACTIVITY_LIST_ERROR', [
                'tenant' => $tenant->slug,
                'action' => 'list_tenant_activities',
                'log_category' => 'TENANT_ACTIVITY_ERROR'
            ], $e);
        }
    }

    /**
     * Statistiche attività
     */
    public function stats(Request $request): JsonResponse
    {
        try {
            $hours = $request->integer('hours', 24);
            $since = now()->subHours($hours);

            // Stats generali
            $stats = [
                'period_hours' => $hours,
                'total' => TenantActivity::where('created_at', '>=', $since)->count(),
                'by_status' => [
                    'success' => TenantActivity::where('created_at', '>=', $since)
                        ->where('status', 'success')->count(),
                    'warning' => TenantActivity::where('created_at', '>=', $since)
                        ->where('status', 'warning')->count(),
                    'error' => TenantActivity::where('created_at', '>=', $since)
                        ->where('status', 'error')->count(),
                    'info' => TenantActivity::where('created_at', '>=', $since)
                        ->where('status', 'info')->count(),
                ],
                'by_type' => TenantActivity::where('created_at', '>=', $since)
                    ->selectRaw('type, count(*) as count')
                    ->groupBy('type')
                    ->pluck('count', 'type'),
                'by_tenant' => TenantActivity::where('tenant_activities.created_at', '>=', $since)
                    ->join('tenants', 'tenant_activities.tenant_id', '=', 'tenants.id')
                    ->selectRaw('tenants.name, tenants.slug, count(*) as count')
                    ->groupBy('tenants.id', 'tenants.name', 'tenants.slug')
                    ->get(),
                'avg_response_time_ms' => (int) TenantActivity::where('created_at', '>=', $since)
                    ->whereNotNull('response_time_ms')
                    ->avg('response_time_ms'),
                'errors_rate' => $this->calculateErrorRate($since),
            ];

            return response()->json([
                'success' => true,
                'data' => $stats,
            ]);
        } catch (\Exception $e) {
            return $this->errorManager->handle('TENANT_STATS_ERROR', [
                'action' => 'activity_stats',
                'log_category' => 'TENANT_STATS_CALC_ERROR'
            ], $e);
        }
    }

    /**
     * Attività recenti per la dashboard
     */
    public function recent(Request $request): JsonResponse
    {
        try {
            $limit = $request->integer('limit', 20);
            
            $activities = TenantActivity::with('tenant:id,name,slug')
                ->orderBy('created_at', 'desc')
                ->limit($limit)
                ->get()
                ->map(function ($activity) {
                    return [
                        'id' => $activity->id,
                        'tenant' => $activity->tenant->name ?? 'Unknown',
                        'tenant_slug' => $activity->tenant->slug ?? null,
                        'type' => $activity->type,
                        'action' => $activity->action,
                        'description' => $activity->description,
                        'status' => $activity->status,
                        'status_color' => $activity->getStatusColor(),
                        'response_time_ms' => $activity->response_time_ms,
                        'created_at' => $activity->created_at->toIso8601String(),
                        'time_ago' => $activity->created_at->diffForHumans(),
                    ];
                });

            return response()->json([
                'success' => true,
                'data' => $activities,
            ]);
        } catch (\Exception $e) {
            return $this->errorManager->handle('TENANT_ACTIVITY_LIST_ERROR', [
                'action' => 'recent_activities',
                'log_category' => 'TENANT_RECENT_ACTIVITY_ERROR'
            ], $e);
        }
    }

    /**
     * Timeline attività (raggruppata per ora)
     */
    public function timeline(Request $request): JsonResponse
    {
        try {
            $hours = $request->integer('hours', 24);
            $tenantId = $request->input('tenant_id');

            $query = TenantActivity::where('created_at', '>=', now()->subHours($hours))
                ->selectRaw("DATE_FORMAT(created_at, '%Y-%m-%d %H:00:00') as hour, status, count(*) as count")
                ->groupBy('hour', 'status')
                ->orderBy('hour');

            if ($tenantId) {
                $query->where('tenant_id', $tenantId);
            }

            $timeline = $query->get()
                ->groupBy('hour')
                ->map(function ($items, $hour) {
                    return [
                        'hour' => $hour,
                        'success' => $items->where('status', 'success')->sum('count'),
                        'warning' => $items->where('status', 'warning')->sum('count'),
                        'error' => $items->where('status', 'error')->sum('count'),
                        'info' => $items->where('status', 'info')->sum('count'),
                        'total' => $items->sum('count'),
                    ];
                })
                ->values();

            return response()->json([
                'success' => true,
                'data' => $timeline,
            ]);
        } catch (\Exception $e) {
            return $this->errorManager->handle('TENANT_STATS_ERROR', [
                'action' => 'activity_timeline',
                'log_category' => 'TENANT_TIMELINE_ERROR'
            ], $e);
        }
    }

    /**
     * Calcola il tasso di errore
     */
    protected function calculateErrorRate($since): float
    {
        $total = TenantActivity::where('created_at', '>=', $since)->count();
        if ($total === 0) return 0;

        $errors = TenantActivity::where('created_at', '>=', $since)
            ->where('status', 'error')
            ->count();

        return round(($errors / $total) * 100, 2);
    }
}
