<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use FlorenceEgi\Hub\Models\Aggregation;
use FlorenceEgi\Hub\Models\AggregationMember;

/**
 * Aggregation API Controller
 * 
 * CRUD operations for aggregations and member management.
 * 
 * @package FlorenceEgi\Hub
 * @author Fabio Cherici
 * @version 1.0.0
 * @date 2025-12-01
 */
class AggregationController extends Controller
{
    /**
     * List all aggregations.
     */
    public function index(Request $request): JsonResponse
    {
        $aggregations = Aggregation::with(['members' => function ($query) {
            $query->where('status', 'accepted');
        }])
        ->when($request->status, fn($q, $status) => $q->where('status', $status))
        ->orderBy('created_at', 'desc')
        ->paginate($request->per_page ?? 15);

        return response()->json([
            'success' => true,
            'data' => $aggregations,
        ]);
    }

    /**
     * Create a new aggregation.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'settings' => 'nullable|array',
            'creator_tenant_id' => 'required|integer',
        ]);

        $aggregation = Aggregation::create([
            'name' => $validated['name'],
            'description' => $validated['description'] ?? null,
            'settings' => $validated['settings'] ?? [],
            'status' => 'active',
        ]);

        // Add creator as admin member
        $aggregation->members()->create([
            'tenant_id' => $validated['creator_tenant_id'],
            'role' => 'admin',
            'status' => 'accepted',
            'joined_at' => now(),
        ]);

        return response()->json([
            'success' => true,
            'data' => $aggregation->load('members'),
            'message' => 'Aggregation created successfully',
        ], 201);
    }

    /**
     * Get a specific aggregation.
     */
    public function show(Aggregation $aggregation): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => $aggregation->load('members'),
        ]);
    }

    /**
     * Update an aggregation.
     */
    public function update(Request $request, Aggregation $aggregation): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'description' => 'nullable|string',
            'settings' => 'nullable|array',
            'status' => 'sometimes|in:active,inactive,archived',
        ]);

        $aggregation->update($validated);

        return response()->json([
            'success' => true,
            'data' => $aggregation->fresh(),
            'message' => 'Aggregation updated successfully',
        ]);
    }

    /**
     * Delete an aggregation.
     */
    public function destroy(Aggregation $aggregation): JsonResponse
    {
        $aggregation->members()->delete();
        $aggregation->delete();

        return response()->json([
            'success' => true,
            'message' => 'Aggregation deleted successfully',
        ]);
    }

    /**
     * Invite a tenant to join the aggregation.
     */
    public function invite(Request $request, Aggregation $aggregation): JsonResponse
    {
        $validated = $request->validate([
            'tenant_id' => 'required|integer',
            'role' => 'sometimes|in:admin,member,readonly',
            'invited_by' => 'required|integer',
        ]);

        // Check if already a member
        $existing = $aggregation->members()
            ->where('tenant_id', $validated['tenant_id'])
            ->whereIn('status', ['pending', 'accepted'])
            ->first();

        if ($existing) {
            return response()->json([
                'success' => false,
                'message' => 'Tenant is already a member or has a pending invite',
            ], 422);
        }

        $member = $aggregation->members()->create([
            'tenant_id' => $validated['tenant_id'],
            'role' => $validated['role'] ?? 'member',
            'status' => 'pending',
            'invited_by' => $validated['invited_by'],
            'invited_at' => now(),
            'expires_at' => now()->addDays(config('egi-hub.aggregations.invitation_expiry_days', 30)),
        ]);

        return response()->json([
            'success' => true,
            'data' => $member,
            'message' => 'Invitation sent successfully',
        ], 201);
    }

    /**
     * List members of an aggregation.
     */
    public function members(Request $request, Aggregation $aggregation): JsonResponse
    {
        $members = $aggregation->members()
            ->when($request->status, fn($q, $status) => $q->where('status', $status))
            ->orderBy('joined_at', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $members,
        ]);
    }
}
