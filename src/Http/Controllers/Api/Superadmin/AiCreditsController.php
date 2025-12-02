<?php

declare(strict_types=1);

namespace FlorenceEgi\Hub\Http\Controllers\Api\Superadmin;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;

/**
 * AI Credits API Controller
 * 
 * Manages AI credits for users.
 * 
 * @package FlorenceEgi\Hub
 * @author Fabio Cherici
 * @version 1.0.0
 * @date 2025-12-01
 */
class AiCreditsController extends Controller
{
    /**
     * List AI credits by user.
     */
    public function index(Request $request): JsonResponse
    {
        $users = [];
        $stats = [
            'total_credits_issued' => 0,
            'total_credits_used' => 0,
            'total_credits_remaining' => 0,
            'users_with_credits' => 0,
        ];

        try {
            $userModel = config('auth.providers.users.model', 'App\\Models\\User');
            
            if (class_exists($userModel)) {
                $query = $userModel::query()
                    ->select(['id', 'name', 'email', 'ai_credits', 'ai_credits_used', 'created_at'])
                    ->orderBy('ai_credits', 'desc');

                if ($request->filled('search')) {
                    $query->where(function ($q) use ($request) {
                        $q->where('name', 'like', "%{$request->search}%")
                          ->orWhere('email', 'like', "%{$request->search}%");
                    });
                }

                $paginated = $query->paginate($request->per_page ?? 20);

                $users = $paginated->map(function ($user) {
                    return [
                        'id' => $user->id,
                        'name' => $user->name,
                        'email' => $user->email,
                        'credits_total' => $user->ai_credits ?? 0,
                        'credits_used' => $user->ai_credits_used ?? 0,
                        'credits_remaining' => ($user->ai_credits ?? 0) - ($user->ai_credits_used ?? 0),
                        'created_at' => $user->created_at?->toISOString(),
                    ];
                })->toArray();

                // Calculate stats
                $allUsers = $userModel::query()
                    ->selectRaw('SUM(COALESCE(ai_credits, 0)) as total_credits')
                    ->selectRaw('SUM(COALESCE(ai_credits_used, 0)) as total_used')
                    ->selectRaw('COUNT(CASE WHEN ai_credits > 0 THEN 1 END) as users_with_credits')
                    ->first();

                if ($allUsers) {
                    $stats['total_credits_issued'] = (int) $allUsers->total_credits;
                    $stats['total_credits_used'] = (int) $allUsers->total_used;
                    $stats['total_credits_remaining'] = $stats['total_credits_issued'] - $stats['total_credits_used'];
                    $stats['users_with_credits'] = (int) $allUsers->users_with_credits;
                }
            }
        } catch (\Exception $e) {
            // Columns might not exist on users table
            logger()->warning('AiCreditsController: ' . $e->getMessage());
        }

        return response()->json([
            'success' => true,
            'data' => $users,
            'stats' => $stats,
        ]);
    }

    /**
     * Add credits to a user.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'user_id' => 'required|integer',
            'credits' => 'required|integer|min:1',
            'reason' => 'nullable|string|max:255',
        ]);

        try {
            $userModel = config('auth.providers.users.model', 'App\\Models\\User');
            $user = $userModel::findOrFail($validated['user_id']);

            $currentCredits = $user->ai_credits ?? 0;
            $user->ai_credits = $currentCredits + $validated['credits'];
            $user->save();

            return response()->json([
                'success' => true,
                'data' => [
                    'user_id' => $user->id,
                    'previous_credits' => $currentCredits,
                    'added_credits' => $validated['credits'],
                    'new_total' => $user->ai_credits,
                ],
                'message' => "Added {$validated['credits']} credits to user {$user->name}",
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to add credits: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Reset credits for a user.
     */
    public function reset(Request $request, int $userId): JsonResponse
    {
        try {
            $userModel = config('auth.providers.users.model', 'App\\Models\\User');
            $user = $userModel::findOrFail($userId);

            $user->ai_credits_used = 0;
            $user->save();

            return response()->json([
                'success' => true,
                'message' => "Reset usage credits for user {$user->name}",
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to reset credits: ' . $e->getMessage(),
            ], 500);
        }
    }
}
