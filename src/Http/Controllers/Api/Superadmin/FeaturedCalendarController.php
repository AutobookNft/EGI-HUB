<?php

declare(strict_types=1);

namespace FlorenceEgi\Hub\Http\Controllers\Api\Superadmin;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;

/**
 * Featured Calendar API Controller
 * 
 * Manages the featured EGI calendar/schedule.
 * 
 * @package FlorenceEgi\Hub
 * @author Fabio Cherici
 * @version 1.0.0
 * @date 2025-12-01
 */
class FeaturedCalendarController extends Controller
{
    /**
     * Get featured EGI calendar.
     */
    public function index(Request $request): JsonResponse
    {
        $calendar = [];

        try {
            $featuredModel = config('egi-hub.models.featured_egi', 'App\\Models\\FeaturedEgi');
            
            if (class_exists($featuredModel)) {
                $query = $featuredModel::with('egi:id,name,slug,avatar')
                    ->orderBy('featured_date');

                // Filter by date range
                if ($request->filled('start_date')) {
                    $query->where('featured_date', '>=', $request->start_date);
                }
                if ($request->filled('end_date')) {
                    $query->where('featured_date', '<=', $request->end_date);
                }

                // Default: show next 30 days
                if (!$request->filled('start_date') && !$request->filled('end_date')) {
                    $query->where('featured_date', '>=', now()->subDay())
                          ->where('featured_date', '<=', now()->addDays(30));
                }

                $calendar = $query->get()->map(function ($item) {
                    return [
                        'id' => $item->id,
                        'egi_id' => $item->egi_id,
                        'egi_name' => $item->egi?->name ?? 'Unknown',
                        'egi_avatar' => $item->egi?->avatar,
                        'featured_date' => $item->featured_date?->toDateString(),
                        'position' => $item->position ?? 1,
                        'reason' => $item->reason,
                        'created_at' => $item->created_at?->toISOString(),
                    ];
                })->toArray();
            }
        } catch (\Exception $e) {
            logger()->warning('FeaturedCalendarController: ' . $e->getMessage());
        }

        // Group by date for calendar view
        $groupedCalendar = collect($calendar)->groupBy('featured_date')->map(function ($items) {
            return $items->values()->toArray();
        })->toArray();

        return response()->json([
            'success' => true,
            'data' => $calendar,
            'calendar' => $groupedCalendar,
        ]);
    }

    /**
     * Schedule an EGI to be featured.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'egi_id' => 'required|integer',
            'featured_date' => 'required|date|after_or_equal:today',
            'position' => 'sometimes|integer|min:1|max:10',
            'reason' => 'nullable|string|max:255',
        ]);

        try {
            $featuredModel = config('egi-hub.models.featured_egi', 'App\\Models\\FeaturedEgi');
            
            if (class_exists($featuredModel)) {
                // Check if slot is available
                $existingCount = $featuredModel::where('featured_date', $validated['featured_date'])->count();
                $maxPerDay = config('egi-hub.featured.max_per_day', 5);
                
                if ($existingCount >= $maxPerDay) {
                    return response()->json([
                        'success' => false,
                        'message' => "Maximum {$maxPerDay} featured EGIs per day",
                    ], 422);
                }

                $featured = $featuredModel::create([
                    'egi_id' => $validated['egi_id'],
                    'featured_date' => $validated['featured_date'],
                    'position' => $validated['position'] ?? $existingCount + 1,
                    'reason' => $validated['reason'],
                ]);

                return response()->json([
                    'success' => true,
                    'data' => $featured->load('egi:id,name'),
                    'message' => 'EGI scheduled for featuring',
                ], 201);
            }
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to schedule: ' . $e->getMessage(),
            ], 500);
        }

        return response()->json([
            'success' => false,
            'message' => 'Featured EGI model not configured',
        ], 500);
    }

    /**
     * Remove an EGI from featured schedule.
     */
    public function destroy(int $id): JsonResponse
    {
        try {
            $featuredModel = config('egi-hub.models.featured_egi', 'App\\Models\\FeaturedEgi');
            
            if (class_exists($featuredModel)) {
                $featured = $featuredModel::findOrFail($id);
                $featured->delete();

                return response()->json([
                    'success' => true,
                    'message' => 'Featured slot removed',
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
            'message' => 'Featured EGI model not configured',
        ], 500);
    }
}
