<?php

declare(strict_types=1);

namespace FlorenceEgi\Hub\Http\Controllers\Api\Superadmin;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;

/**
 * Equilibrium Index API Controller
 * 
 * Manages the EGI Equilibrium system for balanced tokenomics.
 * 
 * @package FlorenceEgi\Hub
 * @author Fabio Cherici
 * @version 1.0.0
 * @date 2025-12-01
 */
class EquilibriumController extends Controller
{
    /**
     * Get equilibrium index data.
     */
    public function index(Request $request): JsonResponse
    {
        $data = [
            'current_index' => 1.0,
            'trend' => 'stable',
            'components' => [
                'supply_factor' => 1.0,
                'demand_factor' => 1.0,
                'velocity_factor' => 1.0,
                'engagement_factor' => 1.0,
            ],
            'history' => [],
            'last_calculation' => now()->toISOString(),
        ];

        try {
            $equilibriumModel = config('egi-hub.models.equilibrium_entry', 'App\\Models\\EquilibriumEntry');
            
            if (class_exists($equilibriumModel)) {
                // Get latest entry
                $latest = $equilibriumModel::orderBy('created_at', 'desc')->first();
                
                if ($latest) {
                    $data['current_index'] = $latest->index_value ?? 1.0;
                    $data['components'] = $latest->components ?? $data['components'];
                    $data['last_calculation'] = $latest->created_at?->toISOString();
                    
                    // Determine trend
                    $previous = $equilibriumModel::orderBy('created_at', 'desc')->skip(1)->first();
                    if ($previous) {
                        $diff = $latest->index_value - $previous->index_value;
                        $data['trend'] = $diff > 0.05 ? 'up' : ($diff < -0.05 ? 'down' : 'stable');
                    }
                }

                // Get history (last 30 days)
                $data['history'] = $equilibriumModel::query()
                    ->where('created_at', '>=', now()->subDays(30))
                    ->orderBy('created_at')
                    ->get()
                    ->map(fn ($entry) => [
                        'date' => $entry->created_at?->toDateString(),
                        'index' => $entry->index_value,
                    ])
                    ->toArray();
            } else {
                // Calculate from available data
                $data = $this->calculateEquilibriumFromData($data);
            }
        } catch (\Exception $e) {
            logger()->warning('EquilibriumController: ' . $e->getMessage());
            // Return calculated values based on available metrics
            $data = $this->calculateEquilibriumFromData($data);
        }

        return response()->json([
            'success' => true,
            'data' => $data,
        ]);
    }

    /**
     * Force recalculation of equilibrium index.
     */
    public function recalculate(Request $request): JsonResponse
    {
        try {
            $equilibriumModel = config('egi-hub.models.equilibrium_entry', 'App\\Models\\EquilibriumEntry');
            
            $calculated = $this->calculateEquilibriumFromData([
                'components' => [
                    'supply_factor' => 1.0,
                    'demand_factor' => 1.0,
                    'velocity_factor' => 1.0,
                    'engagement_factor' => 1.0,
                ],
            ]);

            if (class_exists($equilibriumModel)) {
                $entry = $equilibriumModel::create([
                    'index_value' => $calculated['current_index'],
                    'components' => $calculated['components'],
                    'calculated_at' => now(),
                ]);

                return response()->json([
                    'success' => true,
                    'data' => $calculated,
                    'message' => 'Equilibrium index recalculated',
                ]);
            }

            return response()->json([
                'success' => true,
                'data' => $calculated,
                'message' => 'Equilibrium calculated (not persisted - model not configured)',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Recalculation failed: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Calculate equilibrium from available platform data.
     */
    protected function calculateEquilibriumFromData(array $data): array
    {
        $components = $data['components'];

        try {
            // Supply factor: based on Egili tokens
            $userModel = config('auth.providers.users.model', 'App\\Models\\User');
            if (class_exists($userModel)) {
                $totalUsers = $userModel::count();
                $activeUsers = $userModel::where('updated_at', '>=', now()->subDays(30))->count();
                $components['engagement_factor'] = $totalUsers > 0 ? min(2.0, $activeUsers / max($totalUsers * 0.5, 1)) : 1.0;
            }

            // Demand factor: based on AI usage
            $aiTraitModel = config('egi-hub.models.ai_trait_generation', 'App\\Models\\AiTraitGeneration');
            if (class_exists($aiTraitModel)) {
                $monthlyRequests = $aiTraitModel::where('created_at', '>=', now()->subDays(30))->count();
                $components['demand_factor'] = min(2.0, max(0.5, $monthlyRequests / 100));
            }

            // EGI factor: based on total EGIs created
            $egiModel = config('egi-hub.models.egi', 'App\\Models\\Egi');
            if (class_exists($egiModel)) {
                $totalEgis = $egiModel::count();
                $components['supply_factor'] = min(2.0, max(0.5, $totalEgis / 50));
            }

            // Velocity: based on recent transactions
            $egiliTransactionModel = config('egi-hub.models.egili_transaction', 'App\\Models\\EgiliTransaction');
            if (class_exists($egiliTransactionModel)) {
                $recentTransactions = $egiliTransactionModel::where('created_at', '>=', now()->subDays(7))->count();
                $components['velocity_factor'] = min(2.0, max(0.5, $recentTransactions / 20));
            }
        } catch (\Exception $e) {
            // Keep default values
            logger()->warning('Equilibrium calculation partial: ' . $e->getMessage());
        }

        // Calculate composite index
        $index = (
            $components['supply_factor'] * 0.25 +
            $components['demand_factor'] * 0.25 +
            $components['velocity_factor'] * 0.25 +
            $components['engagement_factor'] * 0.25
        );

        return [
            'current_index' => round($index, 3),
            'trend' => $index > 1.05 ? 'up' : ($index < 0.95 ? 'down' : 'stable'),
            'components' => $components,
            'history' => $data['history'] ?? [],
            'last_calculation' => now()->toISOString(),
        ];
    }
}
