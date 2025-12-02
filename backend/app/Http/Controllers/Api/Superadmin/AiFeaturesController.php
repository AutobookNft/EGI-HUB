<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\Superadmin;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;

/**
 * AI Features API Controller
 * 
 * Manages available AI features and their configuration.
 * 
 * @package FlorenceEgi\Hub
 * @author Fabio Cherici
 * @version 1.0.0
 * @date 2025-12-01
 */
class AiFeaturesController extends Controller
{
    /**
     * List all AI features.
     */
    public function index(): JsonResponse
    {
        // AI features are defined in configuration or database
        $features = config('egi-hub.ai_features', $this->getDefaultFeatures());

        // Try to load from database if model exists
        try {
            $aiFeatureModel = config('egi-hub.models.ai_feature', null);
            
            if ($aiFeatureModel && class_exists($aiFeatureModel)) {
                $dbFeatures = $aiFeatureModel::orderBy('name')->get()->map(function ($feature) {
                    return [
                        'id' => $feature->id,
                        'name' => $feature->name,
                        'slug' => $feature->slug,
                        'description' => $feature->description,
                        'enabled' => $feature->enabled ?? true,
                        'credits_cost' => $feature->credits_cost ?? 1,
                        'model' => $feature->model ?? 'gpt-4',
                        'max_tokens' => $feature->max_tokens ?? 2000,
                        'settings' => $feature->settings ?? [],
                    ];
                })->toArray();

                if (!empty($dbFeatures)) {
                    $features = $dbFeatures;
                }
            }
        } catch (\Exception $e) {
            // Use default features
            logger()->warning('AiFeaturesController: ' . $e->getMessage());
        }

        return response()->json([
            'success' => true,
            'data' => $features,
        ]);
    }

    /**
     * Toggle feature enabled/disabled.
     */
    public function toggle(Request $request, string $slug): JsonResponse
    {
        try {
            $aiFeatureModel = config('egi-hub.models.ai_feature', null);
            
            if ($aiFeatureModel && class_exists($aiFeatureModel)) {
                $feature = $aiFeatureModel::where('slug', $slug)->firstOrFail();
                $feature->enabled = !$feature->enabled;
                $feature->save();

                return response()->json([
                    'success' => true,
                    'data' => [
                        'slug' => $feature->slug,
                        'enabled' => $feature->enabled,
                    ],
                    'message' => $feature->enabled ? 'Feature enabled' : 'Feature disabled',
                ]);
            }
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to toggle feature: ' . $e->getMessage(),
            ], 500);
        }

        return response()->json([
            'success' => false,
            'message' => 'AI Feature model not configured',
        ], 500);
    }

    /**
     * Update feature settings.
     */
    public function update(Request $request, string $slug): JsonResponse
    {
        $validated = $request->validate([
            'credits_cost' => 'sometimes|integer|min:0',
            'model' => 'sometimes|string',
            'max_tokens' => 'sometimes|integer|min:100',
            'enabled' => 'sometimes|boolean',
            'settings' => 'sometimes|array',
        ]);

        try {
            $aiFeatureModel = config('egi-hub.models.ai_feature', null);
            
            if ($aiFeatureModel && class_exists($aiFeatureModel)) {
                $feature = $aiFeatureModel::where('slug', $slug)->firstOrFail();
                $feature->update($validated);

                return response()->json([
                    'success' => true,
                    'data' => $feature->fresh(),
                    'message' => 'Feature updated successfully',
                ]);
            }
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update feature: ' . $e->getMessage(),
            ], 500);
        }

        return response()->json([
            'success' => false,
            'message' => 'AI Feature model not configured',
        ], 500);
    }

    /**
     * Get default AI features when database not available.
     */
    protected function getDefaultFeatures(): array
    {
        return [
            [
                'id' => 1,
                'name' => 'Trait Generation',
                'slug' => 'trait-generation',
                'description' => 'Generate AI-powered traits for EGI digital identities',
                'enabled' => true,
                'credits_cost' => 1,
                'model' => 'gpt-4',
                'max_tokens' => 2000,
            ],
            [
                'id' => 2,
                'name' => 'Style Transfer',
                'slug' => 'style-transfer',
                'description' => 'Apply artistic styles to EGI visual representations',
                'enabled' => true,
                'credits_cost' => 2,
                'model' => 'dall-e-3',
                'max_tokens' => 1000,
            ],
            [
                'id' => 3,
                'name' => 'Biography Writer',
                'slug' => 'biography-writer',
                'description' => 'Generate compelling biographies for EGI entities',
                'enabled' => true,
                'credits_cost' => 1,
                'model' => 'gpt-4',
                'max_tokens' => 1500,
            ],
            [
                'id' => 4,
                'name' => 'Voice Synthesis',
                'slug' => 'voice-synthesis',
                'description' => 'Generate voice profiles for EGI entities',
                'enabled' => false,
                'credits_cost' => 5,
                'model' => 'eleven-labs',
                'max_tokens' => 0,
            ],
            [
                'id' => 5,
                'name' => 'N.A.T.A.N. Chat',
                'slug' => 'natan-chat',
                'description' => 'Interactive AI assistant powered by N.A.T.A.N.',
                'enabled' => true,
                'credits_cost' => 1,
                'model' => 'gpt-4-turbo',
                'max_tokens' => 4000,
            ],
        ];
    }
}
