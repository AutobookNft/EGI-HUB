<?php

declare(strict_types=1);

namespace FlorenceEgi\Hub\Http\Controllers\Api\Superadmin;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;

/**
 * AI Consultations API Controller
 * 
 * Returns JSON data for AI consultations management.
 * Queries the main EGI database for AiTraitGeneration data.
 * 
 * @package FlorenceEgi\Hub
 * @author Fabio Cherici
 * @version 1.0.0
 * @date 2025-12-01
 */
class AiConsultationsController extends Controller
{
    /**
     * List all AI consultations with pagination.
     */
    public function index(Request $request): JsonResponse
    {
        $consultations = [];
        $meta = [
            'total' => 0,
            'today' => 0,
            'week' => 0,
        ];

        try {
            // Try to query from main EGI database
            $aiTraitModel = config('egi-hub.models.ai_trait_generation', 'App\\Models\\AiTraitGeneration');
            
            if (class_exists($aiTraitModel)) {
                $query = $aiTraitModel::with(['user', 'egi'])
                    ->orderBy('created_at', 'desc');

                // Filters
                if ($request->filled('user_id')) {
                    $query->where('user_id', $request->user_id);
                }
                if ($request->filled('egi_id')) {
                    $query->where('egi_id', $request->egi_id);
                }
                if ($request->filled('model')) {
                    $query->where('model', $request->model);
                }

                $paginated = $query->paginate($request->per_page ?? 20);

                $consultations = $paginated->map(function ($item) {
                    return [
                        'id' => $item->id,
                        'user_id' => $item->user_id,
                        'user_name' => $item->user?->name ?? 'Unknown',
                        'egi_id' => $item->egi_id,
                        'egi_name' => $item->egi?->name ?? 'Unknown',
                        'prompt' => $item->prompt ?? '',
                        'response' => $item->response ?? '',
                        'tokens_used' => $item->tokens_used ?? 0,
                        'model' => $item->model ?? 'gpt-4',
                        'created_at' => $item->created_at?->toISOString(),
                    ];
                })->toArray();

                $meta['total'] = $aiTraitModel::count();
                $meta['today'] = $aiTraitModel::whereDate('created_at', today())->count();
                $meta['week'] = $aiTraitModel::where('created_at', '>=', now()->subWeek())->count();
            }
        } catch (\Exception $e) {
            // Table or model might not exist - return empty data
            logger()->warning('AiConsultationsController: ' . $e->getMessage());
        }

        return response()->json([
            'success' => true,
            'data' => $consultations,
            'meta' => $meta,
        ]);
    }

    /**
     * Get a specific consultation.
     */
    public function show(int $id): JsonResponse
    {
        try {
            $aiTraitModel = config('egi-hub.models.ai_trait_generation', 'App\\Models\\AiTraitGeneration');
            
            if (class_exists($aiTraitModel)) {
                $consultation = $aiTraitModel::with(['user', 'egi'])->findOrFail($id);
                
                return response()->json([
                    'success' => true,
                    'data' => [
                        'id' => $consultation->id,
                        'user_id' => $consultation->user_id,
                        'user_name' => $consultation->user?->name ?? 'Unknown',
                        'egi_id' => $consultation->egi_id,
                        'egi_name' => $consultation->egi?->name ?? 'Unknown',
                        'prompt' => $consultation->prompt ?? '',
                        'response' => $consultation->response ?? '',
                        'tokens_used' => $consultation->tokens_used ?? 0,
                        'model' => $consultation->model ?? 'gpt-4',
                        'created_at' => $consultation->created_at?->toISOString(),
                    ],
                ]);
            }
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Consultation not found',
            ], 404);
        }

        return response()->json([
            'success' => false,
            'message' => 'Model not configured',
        ], 500);
    }
}
