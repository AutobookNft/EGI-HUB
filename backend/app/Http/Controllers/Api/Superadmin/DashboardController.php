<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\Superadmin;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use FlorenceEgi\Hub\Models\Aggregation;

/**
 * Superadmin Dashboard API Controller
 * 
 * Returns JSON data for the React Superadmin dashboard.
 * 
 * @package FlorenceEgi\Hub
 * @author Fabio Cherici
 * @version 1.0.0
 * @date 2025-12-01
 */
class DashboardController extends Controller
{
    /**
     * Get dashboard overview data.
     * 
     * Returns format expected by React Dashboard.tsx:
     * - stats: {ai_consultations, total_egis, active_users, traits_created}
     * - recent_activity: [{id, type, description, created_at}]
     */
    public function index(Request $request): JsonResponse
    {
        $stats = [
            'ai_consultations' => $this->getAiConsultationsCount(),
            'total_egis' => $this->getEgiCount(),
            'active_users' => $this->getActiveUserCount(),
            'traits_created' => $this->getTraitsCreatedCount(),
        ];

        $recentActivity = $this->getRecentActivity();

        return response()->json([
            'stats' => $stats,
            'recent_activity' => $recentActivity,
        ]);
    }

    /**
     * Get detailed statistics.
     */
    public function stats(Request $request): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => [
                'ai_consultations' => $this->getAiConsultationsCount(),
                'total_egis' => $this->getEgiCount(),
                'active_users' => $this->getActiveUserCount(),
                'traits_created' => $this->getTraitsCreatedCount(),
                'total_tenants' => $this->getTenantCount(),
                'active_aggregations' => $this->getAggregationCount(),
                'pending_invites' => $this->getPendingInvitesCount(),
            ],
            'system' => $this->getSystemInfo(),
        ]);
    }

    /**
     * Get system information.
     */
    protected function getSystemInfo(): array
    {
        return [
            'php_version' => PHP_VERSION,
            'laravel_version' => app()->version(),
            'hub_version' => '1.1.0',
            'environment' => config('app.env', 'production'),
        ];
    }

    /**
     * Get AI consultations count.
     */
    protected function getAiConsultationsCount(): int
    {
        try {
            $aiTraitModel = config('egi-hub.models.ai_trait_generation', 'App\\Models\\AiTraitGeneration');
            if (class_exists($aiTraitModel)) {
                return $aiTraitModel::count();
            }
        } catch (\Exception $e) {
            // Table might not exist
        }
        return 0;
    }

    /**
     * Get EGI count.
     */
    protected function getEgiCount(): int
    {
        try {
            $egiModel = config('egi-hub.models.egi', 'App\\Models\\Egi');
            if (class_exists($egiModel)) {
                return $egiModel::count();
            }
        } catch (\Exception $e) {
            // Table might not exist
        }
        return 0;
    }

    /**
     * Get active users count (last 30 days).
     */
    protected function getActiveUserCount(): int
    {
        try {
            $userModel = config('auth.providers.users.model', 'App\\Models\\User');
            if (class_exists($userModel)) {
                return $userModel::where('updated_at', '>=', now()->subDays(30))->count();
            }
        } catch (\Exception $e) {
            // Table might not exist
        }
        return 0;
    }

    /**
     * Get traits created count.
     */
    protected function getTraitsCreatedCount(): int
    {
        try {
            // Try dedicated traits table first
            $traitModel = config('egi-hub.models.egi_trait', 'App\\Models\\EgiTrait');
            if (class_exists($traitModel)) {
                return $traitModel::count();
            }
            
            // Fall back to AI trait generations
            $aiTraitModel = config('egi-hub.models.ai_trait_generation', 'App\\Models\\AiTraitGeneration');
            if (class_exists($aiTraitModel)) {
                return $aiTraitModel::where('type', 'trait')->count();
            }
        } catch (\Exception $e) {
            // Table might not exist
        }
        return 0;
    }

    /**
     * Get tenant count.
     */
    protected function getTenantCount(): int
    {
        try {
            $tenantModel = config('egi-hub.tenants.model');
            if ($tenantModel && class_exists($tenantModel)) {
                return $tenantModel::count();
            }
        } catch (\Exception $e) {
            // Table might not exist
        }
        return 0;
    }

    /**
     * Get active aggregations count.
     */
    protected function getAggregationCount(): int
    {
        try {
            return Aggregation::where('status', 'active')->count();
        } catch (\Exception $e) {
            // Table might not exist
        }
        return 0;
    }

    /**
     * Get pending invites count.
     */
    protected function getPendingInvitesCount(): int
    {
        try {
            return \FlorenceEgi\Hub\Models\AggregationMember::where('status', 'pending')->count();
        } catch (\Exception $e) {
            // Table might not exist
        }
        return 0;
    }

    /**
     * Get recent activity across the platform.
     */
    protected function getRecentActivity(): array
    {
        $activities = [];

        try {
            // AI consultations
            $aiTraitModel = config('egi-hub.models.ai_trait_generation', 'App\\Models\\AiTraitGeneration');
            if (class_exists($aiTraitModel)) {
                $aiActivities = $aiTraitModel::with('user:id,name')
                    ->orderBy('created_at', 'desc')
                    ->limit(5)
                    ->get()
                    ->map(function ($item) {
                        return [
                            'id' => 'ai_' . $item->id,
                            'type' => 'AI Consultation',
                            'description' => "AI trait generated" . ($item->user ? " by {$item->user->name}" : ''),
                            'created_at' => $item->created_at?->toISOString(),
                        ];
                    })
                    ->toArray();
                
                $activities = array_merge($activities, $aiActivities);
            }

            // EGI creations
            $egiModel = config('egi-hub.models.egi', 'App\\Models\\Egi');
            if (class_exists($egiModel)) {
                $egiActivities = $egiModel::with('user:id,name')
                    ->orderBy('created_at', 'desc')
                    ->limit(5)
                    ->get()
                    ->map(function ($item) {
                        return [
                            'id' => 'egi_' . $item->id,
                            'type' => 'EGI Created',
                            'description' => "EGI '{$item->name}' created" . ($item->user ? " by {$item->user->name}" : ''),
                            'created_at' => $item->created_at?->toISOString(),
                        ];
                    })
                    ->toArray();
                
                $activities = array_merge($activities, $egiActivities);
            }

            // User registrations
            $userModel = config('auth.providers.users.model', 'App\\Models\\User');
            if (class_exists($userModel)) {
                $userActivities = $userModel::orderBy('created_at', 'desc')
                    ->limit(3)
                    ->get()
                    ->map(function ($item) {
                        return [
                            'id' => 'user_' . $item->id,
                            'type' => 'User Registration',
                            'description' => "New user registered: {$item->name}",
                            'created_at' => $item->created_at?->toISOString(),
                        ];
                    })
                    ->toArray();
                
                $activities = array_merge($activities, $userActivities);
            }

        } catch (\Exception $e) {
            logger()->warning('DashboardController::getRecentActivity: ' . $e->getMessage());
        }

        // Sort by date and limit
        usort($activities, function ($a, $b) {
            return strtotime($b['created_at'] ?? '1970-01-01') - strtotime($a['created_at'] ?? '1970-01-01');
        });

        return array_slice($activities, 0, 10);
    }
}
