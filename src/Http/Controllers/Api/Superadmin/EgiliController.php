<?php

declare(strict_types=1);

namespace FlorenceEgi\Hub\Http\Controllers\Api\Superadmin;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;

/**
 * Egili Token Management API Controller
 * 
 * Manages the Egili token system.
 * 
 * @package FlorenceEgi\Hub
 * @author Fabio Cherici
 * @version 1.0.0
 * @date 2025-12-01
 */
class EgiliController extends Controller
{
    /**
     * Get Egili token statistics and recent transactions.
     */
    public function index(Request $request): JsonResponse
    {
        $stats = [
            'total_supply' => 0,
            'circulating_supply' => 0,
            'total_burned' => 0,
            'total_minted' => 0,
        ];
        $transactions = [];

        try {
            $egiliTransactionModel = config('egi-hub.models.egili_transaction', 'App\\Models\\EgiliTransaction');
            
            if (class_exists($egiliTransactionModel)) {
                // Calculate stats from transactions
                $mintedSum = $egiliTransactionModel::where('type', 'mint')->sum('amount');
                $burnedSum = $egiliTransactionModel::where('type', 'burn')->sum('amount');
                
                $stats['total_minted'] = (int) $mintedSum;
                $stats['total_burned'] = (int) $burnedSum;
                $stats['total_supply'] = $stats['total_minted'];
                $stats['circulating_supply'] = $stats['total_minted'] - $stats['total_burned'];

                // Get recent transactions
                $transactions = $egiliTransactionModel::query()
                    ->with(['fromUser:id,name', 'toUser:id,name'])
                    ->orderBy('created_at', 'desc')
                    ->limit($request->input('limit', 20))
                    ->get()
                    ->map(function ($tx) {
                        return [
                            'id' => $tx->id,
                            'type' => $tx->type,
                            'amount' => $tx->amount,
                            'from_user' => $tx->fromUser?->name,
                            'to_user' => $tx->toUser?->name,
                            'reason' => $tx->reason ?? '',
                            'created_at' => $tx->created_at?->toISOString(),
                        ];
                    })
                    ->toArray();
            } else {
                // Try with User model's egili balance
                $userModel = config('auth.providers.users.model', 'App\\Models\\User');
                
                if (class_exists($userModel) && \Schema::hasColumn('users', 'egili_balance')) {
                    $totalBalance = $userModel::sum('egili_balance');
                    $stats['circulating_supply'] = (int) $totalBalance;
                    $stats['total_supply'] = (int) $totalBalance;
                }
            }
        } catch (\Exception $e) {
            logger()->warning('EgiliController: ' . $e->getMessage());
        }

        return response()->json([
            'success' => true,
            'stats' => $stats,
            'transactions' => $transactions,
        ]);
    }

    /**
     * Mint new Egili tokens.
     */
    public function mint(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'user_id' => 'required|integer',
            'amount' => 'required|integer|min:1',
            'reason' => 'nullable|string|max:255',
        ]);

        try {
            $egiliTransactionModel = config('egi-hub.models.egili_transaction', 'App\\Models\\EgiliTransaction');
            $userModel = config('auth.providers.users.model', 'App\\Models\\User');
            
            $user = $userModel::findOrFail($validated['user_id']);

            // Create transaction record if model exists
            if (class_exists($egiliTransactionModel)) {
                $egiliTransactionModel::create([
                    'type' => 'mint',
                    'amount' => $validated['amount'],
                    'to_user_id' => $validated['user_id'],
                    'reason' => $validated['reason'] ?? 'Manual mint by superadmin',
                ]);
            }

            // Update user balance if column exists
            if (\Schema::hasColumn('users', 'egili_balance')) {
                $user->increment('egili_balance', $validated['amount']);
            }

            return response()->json([
                'success' => true,
                'message' => "Minted {$validated['amount']} EGILI to {$user->name}",
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Mint failed: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Burn Egili tokens.
     */
    public function burn(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'user_id' => 'required|integer',
            'amount' => 'required|integer|min:1',
            'reason' => 'nullable|string|max:255',
        ]);

        try {
            $egiliTransactionModel = config('egi-hub.models.egili_transaction', 'App\\Models\\EgiliTransaction');
            $userModel = config('auth.providers.users.model', 'App\\Models\\User');
            
            $user = $userModel::findOrFail($validated['user_id']);

            // Check balance if column exists
            if (\Schema::hasColumn('users', 'egili_balance')) {
                $currentBalance = $user->egili_balance ?? 0;
                if ($currentBalance < $validated['amount']) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Insufficient balance',
                    ], 422);
                }
            }

            // Create transaction record if model exists
            if (class_exists($egiliTransactionModel)) {
                $egiliTransactionModel::create([
                    'type' => 'burn',
                    'amount' => $validated['amount'],
                    'from_user_id' => $validated['user_id'],
                    'reason' => $validated['reason'] ?? 'Manual burn by superadmin',
                ]);
            }

            // Update user balance if column exists
            if (\Schema::hasColumn('users', 'egili_balance')) {
                $user->decrement('egili_balance', $validated['amount']);
            }

            return response()->json([
                'success' => true,
                'message' => "Burned {$validated['amount']} EGILI from {$user->name}",
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Burn failed: ' . $e->getMessage(),
            ], 500);
        }
    }
}
