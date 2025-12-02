<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\Superadmin;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;

/**
 * Roles Management API Controller
 * 
 * Manages platform roles and permissions using Spatie Laravel Permission.
 * 
 * @package FlorenceEgi\Hub
 * @author Fabio Cherici
 * @version 1.0.0
 * @date 2025-12-01
 */
class RolesController extends Controller
{
    /**
     * List all roles with user counts.
     */
    public function index(Request $request): JsonResponse
    {
        $roles = [];

        try {
            // Try Spatie roles
            $roleModel = config('permission.models.role', 'Spatie\\Permission\\Models\\Role');
            
            if (class_exists($roleModel)) {
                $roles = $roleModel::withCount(['users', 'permissions'])
                    ->orderBy('name')
                    ->get()
                    ->map(function ($role) {
                        return [
                            'id' => $role->id,
                            'name' => $role->name,
                            'slug' => \Str::slug($role->name),
                            'description' => $role->description ?? $this->getRoleDescription($role->name),
                            'users_count' => $role->users_count,
                            'permissions_count' => $role->permissions_count,
                            'created_at' => $role->created_at?->toISOString(),
                        ];
                    })
                    ->toArray();
            }
        } catch (\Exception $e) {
            logger()->warning('RolesController: ' . $e->getMessage());
            // Return default roles
            $roles = $this->getDefaultRoles();
        }

        // If no roles found, return defaults
        if (empty($roles)) {
            $roles = $this->getDefaultRoles();
        }

        return response()->json([
            'success' => true,
            'roles' => $roles,
        ]);
    }

    /**
     * Create a new role.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:roles,name',
            'description' => 'nullable|string',
            'permissions' => 'nullable|array',
        ]);

        try {
            $roleModel = config('permission.models.role', 'Spatie\\Permission\\Models\\Role');
            
            if (class_exists($roleModel)) {
                $role = $roleModel::create([
                    'name' => $validated['name'],
                    'description' => $validated['description'] ?? null,
                    'guard_name' => 'web',
                ]);

                if (!empty($validated['permissions'])) {
                    $role->syncPermissions($validated['permissions']);
                }

                return response()->json([
                    'success' => true,
                    'data' => $role->load('permissions'),
                    'message' => 'Role created successfully',
                ], 201);
            }
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to create role: ' . $e->getMessage(),
            ], 500);
        }

        return response()->json([
            'success' => false,
            'message' => 'Role model not configured',
        ], 500);
    }

    /**
     * Delete a role.
     */
    public function destroy(int $id): JsonResponse
    {
        try {
            $roleModel = config('permission.models.role', 'Spatie\\Permission\\Models\\Role');
            
            if (class_exists($roleModel)) {
                $role = $roleModel::findOrFail($id);
                
                // Prevent deleting system roles
                if (in_array($role->name, ['super-admin', 'admin'])) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Cannot delete system roles',
                    ], 422);
                }

                $role->delete();

                return response()->json([
                    'success' => true,
                    'message' => 'Role deleted successfully',
                ]);
            }
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete role: ' . $e->getMessage(),
            ], 500);
        }

        return response()->json([
            'success' => false,
            'message' => 'Role model not configured',
        ], 500);
    }

    /**
     * Get role description based on name.
     */
    protected function getRoleDescription(string $name): string
    {
        $descriptions = [
            'super-admin' => 'Full platform access with all permissions',
            'admin' => 'Administrative access to manage users and content',
            'moderator' => 'Can moderate content and manage reports',
            'user' => 'Standard user with basic permissions',
            'guest' => 'Limited read-only access',
        ];

        return $descriptions[\Str::slug($name)] ?? 'No description available';
    }

    /**
     * Get default roles when database not available.
     */
    protected function getDefaultRoles(): array
    {
        return [
            [
                'id' => 1,
                'name' => 'Super Admin',
                'slug' => 'super-admin',
                'description' => 'Full platform access with all permissions',
                'users_count' => 1,
                'permissions_count' => 50,
                'created_at' => now()->toISOString(),
            ],
            [
                'id' => 2,
                'name' => 'Admin',
                'slug' => 'admin',
                'description' => 'Administrative access to manage users and content',
                'users_count' => 0,
                'permissions_count' => 30,
                'created_at' => now()->toISOString(),
            ],
            [
                'id' => 3,
                'name' => 'User',
                'slug' => 'user',
                'description' => 'Standard user with basic permissions',
                'users_count' => 0,
                'permissions_count' => 10,
                'created_at' => now()->toISOString(),
            ],
        ];
    }
}
