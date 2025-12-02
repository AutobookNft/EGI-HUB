<?php

declare(strict_types=1);

namespace FlorenceEgi\Hub\Http\Controllers\Api\Superadmin;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;

/**
 * Feature Pricing API Controller
 * 
 * Manages pricing for platform features.
 * 
 * @package FlorenceEgi\Hub
 * @author Fabio Cherici
 * @version 1.0.0
 * @date 2025-12-01
 */
class FeaturePricingController extends Controller
{
    /**
     * List all feature pricing.
     */
    public function index(Request $request): JsonResponse
    {
        $pricing = [];

        try {
            $pricingModel = config('egi-hub.models.feature_pricing', 'App\\Models\\FeaturePricing');
            
            if (class_exists($pricingModel)) {
                $pricing = $pricingModel::query()
                    ->orderBy('category')
                    ->orderBy('name')
                    ->get()
                    ->map(function ($item) {
                        return [
                            'id' => $item->id,
                            'name' => $item->name,
                            'slug' => $item->slug,
                            'description' => $item->description,
                            'category' => $item->category,
                            'price_credits' => $item->price_credits ?? 0,
                            'price_egili' => $item->price_egili ?? 0,
                            'price_eur' => $item->price_eur ?? 0,
                            'enabled' => $item->enabled ?? true,
                            'created_at' => $item->created_at?->toISOString(),
                        ];
                    })
                    ->toArray();
            }
        } catch (\Exception $e) {
            logger()->warning('FeaturePricingController: ' . $e->getMessage());
        }

        // Return defaults if empty
        if (empty($pricing)) {
            $pricing = $this->getDefaultPricing();
        }

        return response()->json([
            'success' => true,
            'data' => $pricing,
        ]);
    }

    /**
     * Update feature pricing.
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $validated = $request->validate([
            'price_credits' => 'sometimes|integer|min:0',
            'price_egili' => 'sometimes|integer|min:0',
            'price_eur' => 'sometimes|numeric|min:0',
            'enabled' => 'sometimes|boolean',
        ]);

        try {
            $pricingModel = config('egi-hub.models.feature_pricing', 'App\\Models\\FeaturePricing');
            
            if (class_exists($pricingModel)) {
                $pricing = $pricingModel::findOrFail($id);
                $pricing->update($validated);

                return response()->json([
                    'success' => true,
                    'data' => $pricing->fresh(),
                    'message' => 'Pricing updated successfully',
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
            'message' => 'Feature pricing model not configured',
        ], 500);
    }

    /**
     * Get default pricing structure.
     */
    protected function getDefaultPricing(): array
    {
        return [
            [
                'id' => 1,
                'name' => 'AI Trait Generation',
                'slug' => 'ai-trait-generation',
                'description' => 'Generate AI-powered traits for EGI',
                'category' => 'ai',
                'price_credits' => 1,
                'price_egili' => 10,
                'price_eur' => 0.50,
                'enabled' => true,
            ],
            [
                'id' => 2,
                'name' => 'Premium EGI Slot',
                'slug' => 'premium-egi-slot',
                'description' => 'Additional slot for creating EGI',
                'category' => 'egi',
                'price_credits' => 5,
                'price_egili' => 50,
                'price_eur' => 2.99,
                'enabled' => true,
            ],
            [
                'id' => 3,
                'name' => 'Featured Listing',
                'slug' => 'featured-listing',
                'description' => 'Feature EGI in discover section',
                'category' => 'visibility',
                'price_credits' => 10,
                'price_egili' => 100,
                'price_eur' => 4.99,
                'enabled' => true,
            ],
            [
                'id' => 4,
                'name' => 'Voice Synthesis',
                'slug' => 'voice-synthesis',
                'description' => 'Generate voice for EGI',
                'category' => 'ai',
                'price_credits' => 5,
                'price_egili' => 50,
                'price_eur' => 2.50,
                'enabled' => false,
            ],
        ];
    }
}
