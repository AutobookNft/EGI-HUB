<?php

declare(strict_types=1);

namespace FlorenceEgi\Hub\Http\Controllers\Api\Superadmin;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\DB;

/**
 * AI Statistics API Controller
 * 
 * Provides analytics and statistics for AI usage.
 * 
 * @package FlorenceEgi\Hub
 * @author Fabio Cherici
 * @version 1.0.0
 * @date 2025-12-01
 */
class AiStatisticsController extends Controller
{
    /**
     * Get AI usage statistics.
     */
    public function index(Request $request): JsonResponse
    {
        $stats = [
            'requests_by_day' => [],
            'requests_by_model' => [],
            'tokens_by_day' => [],
            'total_tokens' => 0,
            'total_cost_estimate' => 0,
            'average_response_time' => 0,
            'top_users' => [],
            'top_egis' => [],
        ];

        try {
            $aiTraitModel = config('egi-hub.models.ai_trait_generation', 'App\\Models\\AiTraitGeneration');
            
            if (class_exists($aiTraitModel)) {
                $days = $request->input('days', 30);
                $startDate = now()->subDays($days);

                // Requests by day
                $stats['requests_by_day'] = $aiTraitModel::query()
                    ->where('created_at', '>=', $startDate)
                    ->selectRaw('DATE(created_at) as date, COUNT(*) as count')
                    ->groupBy('date')
                    ->orderBy('date')
                    ->get()
                    ->map(fn ($row) => [
                        'date' => $row->date,
                        'count' => $row->count,
                    ])
                    ->toArray();

                // Requests by model
                $stats['requests_by_model'] = $aiTraitModel::query()
                    ->selectRaw('COALESCE(model, "unknown") as model, COUNT(*) as count')
                    ->groupBy('model')
                    ->orderByDesc('count')
                    ->get()
                    ->map(fn ($row) => [
                        'model' => $row->model,
                        'count' => $row->count,
                    ])
                    ->toArray();

                // Tokens by day
                $stats['tokens_by_day'] = $aiTraitModel::query()
                    ->where('created_at', '>=', $startDate)
                    ->selectRaw('DATE(created_at) as date, SUM(COALESCE(tokens_used, 0)) as tokens')
                    ->groupBy('date')
                    ->orderBy('date')
                    ->get()
                    ->map(fn ($row) => [
                        'date' => $row->date,
                        'tokens' => (int) $row->tokens,
                    ])
                    ->toArray();

                // Total tokens
                $stats['total_tokens'] = (int) $aiTraitModel::sum('tokens_used');

                // Estimate cost (rough estimate: $0.01 per 1K tokens for GPT-4)
                $stats['total_cost_estimate'] = round(($stats['total_tokens'] / 1000) * 0.01, 2);

                // Top users by consultations
                $stats['top_users'] = $aiTraitModel::query()
                    ->with('user:id,name')
                    ->selectRaw('user_id, COUNT(*) as consultations, SUM(COALESCE(tokens_used, 0)) as total_tokens')
                    ->groupBy('user_id')
                    ->orderByDesc('consultations')
                    ->limit(10)
                    ->get()
                    ->map(fn ($row) => [
                        'user_id' => $row->user_id,
                        'user_name' => $row->user?->name ?? 'Unknown',
                        'consultations' => $row->consultations,
                        'total_tokens' => (int) $row->total_tokens,
                    ])
                    ->toArray();

                // Top EGIs by consultations
                $stats['top_egis'] = $aiTraitModel::query()
                    ->with('egi:id,name')
                    ->selectRaw('egi_id, COUNT(*) as consultations')
                    ->groupBy('egi_id')
                    ->orderByDesc('consultations')
                    ->limit(10)
                    ->get()
                    ->map(fn ($row) => [
                        'egi_id' => $row->egi_id,
                        'egi_name' => $row->egi?->name ?? 'Unknown',
                        'consultations' => $row->consultations,
                    ])
                    ->toArray();
            }
        } catch (\Exception $e) {
            logger()->warning('AiStatisticsController: ' . $e->getMessage());
        }

        return response()->json([
            'success' => true,
            'data' => $stats,
        ]);
    }
}
