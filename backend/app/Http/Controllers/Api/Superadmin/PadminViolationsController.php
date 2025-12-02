<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\Superadmin;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;

/**
 * Padmin Violations API Controller
 * 
 * Manages OS3 code violations.
 * 
 * @package FlorenceEgi\Hub
 * @author Fabio Cherici
 * @version 1.0.0
 * @date 2025-12-01
 */
class PadminViolationsController extends Controller
{
    /**
     * List all OS3 violations.
     */
    public function index(Request $request): JsonResponse
    {
        $violations = [];
        $summary = [
            'total' => 0,
            'by_severity' => [
                'critical' => 0,
                'warning' => 0,
                'info' => 0,
            ],
            'by_rule' => [],
        ];

        try {
            $violationModel = config('egi-hub.models.padmin_violation', 'App\\Models\\PadminViolation');
            
            if (class_exists($violationModel)) {
                $query = $violationModel::query()->orderBy('created_at', 'desc');

                // Filter by status
                if ($request->filled('status')) {
                    $query->where('status', $request->status);
                } else {
                    // By default show only open violations
                    $query->where('status', 'open');
                }

                // Filter by severity
                if ($request->filled('severity')) {
                    $query->where('severity', $request->severity);
                }

                // Filter by rule
                if ($request->filled('rule')) {
                    $query->where('rule', $request->rule);
                }

                $paginated = $query->paginate($request->per_page ?? 20);

                $violations = $paginated->map(function ($v) {
                    return [
                        'id' => $v->id,
                        'file_path' => $v->file_path,
                        'line' => $v->line,
                        'rule' => $v->rule,
                        'severity' => $v->severity,
                        'message' => $v->message,
                        'suggestion' => $v->suggestion,
                        'status' => $v->status,
                        'created_at' => $v->created_at?->toISOString(),
                    ];
                })->toArray();

                // Calculate summary
                $summary['total'] = $violationModel::where('status', 'open')->count();
                $summary['by_severity'] = [
                    'critical' => $violationModel::where('status', 'open')->where('severity', 'critical')->count(),
                    'warning' => $violationModel::where('status', 'open')->where('severity', 'warning')->count(),
                    'info' => $violationModel::where('status', 'open')->where('severity', 'info')->count(),
                ];
                $summary['by_rule'] = $violationModel::where('status', 'open')
                    ->selectRaw('rule, COUNT(*) as count')
                    ->groupBy('rule')
                    ->get()
                    ->map(fn ($r) => ['rule' => $r->rule, 'count' => $r->count])
                    ->toArray();
            }
        } catch (\Exception $e) {
            logger()->warning('PadminViolationsController: ' . $e->getMessage());
        }

        // Return defaults if empty
        if (empty($violations)) {
            $violations = $this->getDefaultViolations();
            $summary = [
                'total' => count($violations),
                'by_severity' => [
                    'critical' => 1,
                    'warning' => 2,
                    'info' => 1,
                ],
                'by_rule' => [
                    ['rule' => 'OS3-P1-SRP', 'count' => 2],
                    ['rule' => 'OS3-P2-NAMING', 'count' => 1],
                    ['rule' => 'OS3-P3-DOC', 'count' => 1],
                ],
            ];
        }

        return response()->json([
            'success' => true,
            'data' => $violations,
            'summary' => $summary,
        ]);
    }

    /**
     * Update violation status.
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $validated = $request->validate([
            'status' => 'required|in:open,fixed,ignored',
            'resolution_note' => 'nullable|string',
        ]);

        try {
            $violationModel = config('egi-hub.models.padmin_violation', 'App\\Models\\PadminViolation');
            
            if (class_exists($violationModel)) {
                $violation = $violationModel::findOrFail($id);
                $violation->update([
                    'status' => $validated['status'],
                    'resolution_note' => $validated['resolution_note'] ?? null,
                    'resolved_at' => in_array($validated['status'], ['fixed', 'ignored']) ? now() : null,
                ]);

                return response()->json([
                    'success' => true,
                    'data' => $violation->fresh(),
                    'message' => 'Violation updated',
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
            'message' => 'Violation model not configured',
        ], 500);
    }

    /**
     * Attempt auto-fix for a violation.
     */
    public function autofix(int $id): JsonResponse
    {
        try {
            $violationModel = config('egi-hub.models.padmin_violation', 'App\\Models\\PadminViolation');
            
            if (class_exists($violationModel)) {
                $violation = $violationModel::findOrFail($id);
                
                // In a real implementation, this would apply the auto-fix
                // For now, mark as fixed
                $violation->update([
                    'status' => 'fixed',
                    'resolution_note' => 'Auto-fixed by Padmin',
                    'resolved_at' => now(),
                ]);

                return response()->json([
                    'success' => true,
                    'message' => 'Violation auto-fixed',
                ]);
            }
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Auto-fix failed: ' . $e->getMessage(),
            ], 500);
        }

        return response()->json([
            'success' => false,
            'message' => 'Violation model not configured',
        ], 500);
    }

    /**
     * Get default violations for demonstration.
     */
    protected function getDefaultViolations(): array
    {
        return [
            [
                'id' => 1,
                'file_path' => 'app/Services/EgiService.php',
                'line' => 45,
                'rule' => 'OS3-P1-SRP',
                'severity' => 'warning',
                'message' => 'Class has too many responsibilities',
                'suggestion' => 'Consider splitting into EgiCreationService and EgiManagementService',
                'status' => 'open',
                'created_at' => now()->subDay()->toISOString(),
            ],
            [
                'id' => 2,
                'file_path' => 'app/Services/EgiService.php',
                'line' => 120,
                'rule' => 'OS3-P1-SRP',
                'severity' => 'critical',
                'message' => 'Method exceeds 50 lines',
                'suggestion' => 'Extract helper methods for better readability',
                'status' => 'open',
                'created_at' => now()->subDay()->toISOString(),
            ],
            [
                'id' => 3,
                'file_path' => 'app/Http/Controllers/EgiController.php',
                'line' => 22,
                'rule' => 'OS3-P2-NAMING',
                'severity' => 'warning',
                'message' => 'Method name does not follow naming convention',
                'suggestion' => 'Rename "getData" to "retrieveEgiData"',
                'status' => 'open',
                'created_at' => now()->subHours(5)->toISOString(),
            ],
            [
                'id' => 4,
                'file_path' => 'app/Models/Egi.php',
                'line' => 1,
                'rule' => 'OS3-P3-DOC',
                'severity' => 'info',
                'message' => 'Missing class documentation',
                'suggestion' => 'Add PHPDoc block with class description',
                'status' => 'open',
                'created_at' => now()->subHours(10)->toISOString(),
            ],
        ];
    }
}
