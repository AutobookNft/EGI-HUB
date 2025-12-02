<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\Superadmin;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;

/**
 * Promotions API Controller
 * 
 * Manages platform promotions and discounts.
 * 
 * @package FlorenceEgi\Hub
 * @author Fabio Cherici
 * @version 1.0.0
 * @date 2025-12-01
 */
class PromotionsController extends Controller
{
    /**
     * List all promotions.
     */
    public function index(Request $request): JsonResponse
    {
        $promotions = [];

        try {
            $promotionModel = config('egi-hub.models.promotion', 'App\\Models\\Promotion');
            
            if (class_exists($promotionModel)) {
                $query = $promotionModel::query()->orderBy('start_date', 'desc');

                // Filter by status
                if ($request->filled('status')) {
                    switch ($request->status) {
                        case 'active':
                            $query->where('start_date', '<=', now())
                                  ->where('end_date', '>=', now())
                                  ->where('enabled', true);
                            break;
                        case 'scheduled':
                            $query->where('start_date', '>', now());
                            break;
                        case 'expired':
                            $query->where('end_date', '<', now());
                            break;
                    }
                }

                $promotions = $query->get()->map(function ($promo) {
                    return [
                        'id' => $promo->id,
                        'name' => $promo->name,
                        'code' => $promo->code,
                        'description' => $promo->description,
                        'discount_type' => $promo->discount_type, // percentage, fixed
                        'discount_value' => $promo->discount_value,
                        'start_date' => $promo->start_date?->toISOString(),
                        'end_date' => $promo->end_date?->toISOString(),
                        'usage_limit' => $promo->usage_limit,
                        'usage_count' => $promo->usage_count ?? 0,
                        'enabled' => $promo->enabled ?? true,
                        'status' => $this->getPromotionStatus($promo),
                    ];
                })->toArray();
            }
        } catch (\Exception $e) {
            logger()->warning('PromotionsController: ' . $e->getMessage());
        }

        // Return defaults if empty
        if (empty($promotions)) {
            $promotions = $this->getDefaultPromotions();
        }

        return response()->json([
            'success' => true,
            'data' => $promotions,
        ]);
    }

    /**
     * Create a new promotion.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'code' => 'required|string|max:50|unique:promotions,code',
            'description' => 'nullable|string',
            'discount_type' => 'required|in:percentage,fixed',
            'discount_value' => 'required|numeric|min:0',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after:start_date',
            'usage_limit' => 'nullable|integer|min:1',
            'enabled' => 'sometimes|boolean',
        ]);

        try {
            $promotionModel = config('egi-hub.models.promotion', 'App\\Models\\Promotion');
            
            if (class_exists($promotionModel)) {
                $promotion = $promotionModel::create($validated);

                return response()->json([
                    'success' => true,
                    'data' => $promotion,
                    'message' => 'Promotion created successfully',
                ], 201);
            }
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to create promotion: ' . $e->getMessage(),
            ], 500);
        }

        return response()->json([
            'success' => false,
            'message' => 'Promotion model not configured',
        ], 500);
    }

    /**
     * Update a promotion.
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'description' => 'nullable|string',
            'discount_value' => 'sometimes|numeric|min:0',
            'end_date' => 'sometimes|date',
            'usage_limit' => 'nullable|integer|min:1',
            'enabled' => 'sometimes|boolean',
        ]);

        try {
            $promotionModel = config('egi-hub.models.promotion', 'App\\Models\\Promotion');
            
            if (class_exists($promotionModel)) {
                $promotion = $promotionModel::findOrFail($id);
                $promotion->update($validated);

                return response()->json([
                    'success' => true,
                    'data' => $promotion->fresh(),
                    'message' => 'Promotion updated successfully',
                ]);
            }
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Update failed: ' . $e->getMessage(),
            ], 500);
        }

        return response()->json([
            'success' => false,
            'message' => 'Promotion model not configured',
        ], 500);
    }

    /**
     * Delete a promotion.
     */
    public function destroy(int $id): JsonResponse
    {
        try {
            $promotionModel = config('egi-hub.models.promotion', 'App\\Models\\Promotion');
            
            if (class_exists($promotionModel)) {
                $promotion = $promotionModel::findOrFail($id);
                $promotion->delete();

                return response()->json([
                    'success' => true,
                    'message' => 'Promotion deleted successfully',
                ]);
            }
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Delete failed: ' . $e->getMessage(),
            ], 500);
        }

        return response()->json([
            'success' => false,
            'message' => 'Promotion model not configured',
        ], 500);
    }

    /**
     * Get promotion status.
     */
    protected function getPromotionStatus($promo): string
    {
        if (!$promo->enabled) {
            return 'disabled';
        }

        $now = now();
        if ($promo->start_date > $now) {
            return 'scheduled';
        }
        if ($promo->end_date < $now) {
            return 'expired';
        }
        if ($promo->usage_limit && $promo->usage_count >= $promo->usage_limit) {
            return 'exhausted';
        }

        return 'active';
    }

    /**
     * Get default promotions.
     */
    protected function getDefaultPromotions(): array
    {
        return [
            [
                'id' => 1,
                'name' => 'Early Adopter',
                'code' => 'EARLYADOPT',
                'description' => 'Sconto per i primi utenti della piattaforma',
                'discount_type' => 'percentage',
                'discount_value' => 20,
                'start_date' => now()->subMonth()->toISOString(),
                'end_date' => now()->addMonths(2)->toISOString(),
                'usage_limit' => 100,
                'usage_count' => 23,
                'enabled' => true,
                'status' => 'active',
            ],
        ];
    }
}
