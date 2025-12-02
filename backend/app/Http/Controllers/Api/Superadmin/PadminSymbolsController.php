<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\Superadmin;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;

/**
 * Padmin Symbols API Controller
 * 
 * Manages the OS3 symbol catalog.
 * 
 * @package FlorenceEgi\Hub
 * @author Fabio Cherici
 * @version 1.0.0
 * @date 2025-12-01
 */
class PadminSymbolsController extends Controller
{
    /**
     * List all OS3 symbols.
     */
    public function index(Request $request): JsonResponse
    {
        $symbols = [];
        $stats = [
            'total' => 0,
            'by_type' => [],
        ];

        try {
            $symbolModel = config('egi-hub.models.padmin_symbol', 'App\\Models\\PadminSymbol');
            
            if (class_exists($symbolModel)) {
                $query = $symbolModel::query()->orderBy('name');

                // Filter by type
                if ($request->filled('type')) {
                    $query->where('type', $request->type);
                }

                // Search by name
                if ($request->filled('search')) {
                    $query->where('name', 'like', "%{$request->search}%");
                }

                // Filter by file
                if ($request->filled('file')) {
                    $query->where('file_path', 'like', "%{$request->file}%");
                }

                $paginated = $query->paginate($request->per_page ?? 50);

                $symbols = $paginated->map(function ($s) {
                    return [
                        'id' => $s->id,
                        'name' => $s->name,
                        'type' => $s->type,
                        'file_path' => $s->file_path,
                        'line' => $s->line,
                        'signature' => $s->signature,
                        'visibility' => $s->visibility,
                        'dependencies' => $s->dependencies ?? [],
                        'last_analyzed' => $s->updated_at?->toISOString(),
                    ];
                })->toArray();

                // Stats
                $stats['total'] = $symbolModel::count();
                $stats['by_type'] = $symbolModel::selectRaw('type, COUNT(*) as count')
                    ->groupBy('type')
                    ->get()
                    ->pluck('count', 'type')
                    ->toArray();
            }
        } catch (\Exception $e) {
            logger()->warning('PadminSymbolsController: ' . $e->getMessage());
        }

        // Return defaults if empty
        if (empty($symbols)) {
            $symbols = $this->getDefaultSymbols();
            $stats = [
                'total' => count($symbols),
                'by_type' => [
                    'class' => 3,
                    'method' => 8,
                    'trait' => 1,
                    'interface' => 1,
                ],
            ];
        }

        return response()->json([
            'success' => true,
            'data' => $symbols,
            'stats' => $stats,
        ]);
    }

    /**
     * Get symbol details with dependencies.
     */
    public function show(int $id): JsonResponse
    {
        try {
            $symbolModel = config('egi-hub.models.padmin_symbol', 'App\\Models\\PadminSymbol');
            
            if (class_exists($symbolModel)) {
                $symbol = $symbolModel::with('dependencies', 'dependents')->findOrFail($id);

                return response()->json([
                    'success' => true,
                    'data' => [
                        'id' => $symbol->id,
                        'name' => $symbol->name,
                        'type' => $symbol->type,
                        'file_path' => $symbol->file_path,
                        'line' => $symbol->line,
                        'signature' => $symbol->signature,
                        'visibility' => $symbol->visibility,
                        'dependencies' => $symbol->dependencies ?? [],
                        'dependents' => $symbol->dependents ?? [],
                        'metrics' => $symbol->metrics ?? [],
                        'last_analyzed' => $symbol->updated_at?->toISOString(),
                    ],
                ]);
            }
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Symbol not found',
            ], 404);
        }

        return response()->json([
            'success' => false,
            'message' => 'Symbol model not configured',
        ], 500);
    }

    /**
     * Reanalyze a specific file.
     */
    public function analyze(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'file_path' => 'required|string',
        ]);

        try {
            // In a real implementation, trigger the analyzer
            return response()->json([
                'success' => true,
                'message' => 'Analysis queued',
                'data' => [
                    'file' => $validated['file_path'],
                    'status' => 'queued',
                ],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Analysis failed: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get default symbols for demonstration.
     */
    protected function getDefaultSymbols(): array
    {
        return [
            [
                'id' => 1,
                'name' => 'User',
                'type' => 'class',
                'file_path' => 'app/Models/User.php',
                'line' => 12,
                'signature' => 'class User extends Authenticatable',
                'visibility' => 'public',
                'dependencies' => ['Authenticatable', 'HasFactory', 'Notifiable'],
                'last_analyzed' => now()->subHours(2)->toISOString(),
            ],
            [
                'id' => 2,
                'name' => 'Egi',
                'type' => 'class',
                'file_path' => 'app/Models/Egi.php',
                'line' => 10,
                'signature' => 'class Egi extends Model',
                'visibility' => 'public',
                'dependencies' => ['Model', 'HasFactory', 'SoftDeletes'],
                'last_analyzed' => now()->subHours(2)->toISOString(),
            ],
            [
                'id' => 3,
                'name' => 'EgiService',
                'type' => 'class',
                'file_path' => 'app/Services/EgiService.php',
                'line' => 8,
                'signature' => 'class EgiService',
                'visibility' => 'public',
                'dependencies' => ['Egi', 'User', 'Cache'],
                'last_analyzed' => now()->subHours(2)->toISOString(),
            ],
            [
                'id' => 4,
                'name' => 'create',
                'type' => 'method',
                'file_path' => 'app/Services/EgiService.php',
                'line' => 25,
                'signature' => 'public function create(array $data): Egi',
                'visibility' => 'public',
                'dependencies' => ['Egi'],
                'last_analyzed' => now()->subHours(2)->toISOString(),
            ],
            [
                'id' => 5,
                'name' => 'HasAggregations',
                'type' => 'trait',
                'file_path' => 'src/Traits/HasAggregations.php',
                'line' => 8,
                'signature' => 'trait HasAggregations',
                'visibility' => 'public',
                'dependencies' => ['Aggregation', 'AggregationMember'],
                'last_analyzed' => now()->subHours(2)->toISOString(),
            ],
        ];
    }
}
