<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\Superadmin;

use App\Models\AiFeaturePricing;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Validation\Rule;

/**
 * Feature Pricing API Controller — EGI-HUB
 *
 * Gestione CRUD del catalogo prezzi AI tramite tabella `ai_feature_pricing`
 * del DB condiviso (PostgreSQL AWS RDS). Unico punto di controllo per
 * attivazione, prezzatura e configurazione pacchetti AI dell'ecosistema.
 *
 * @package App\Http\Controllers\Api\Superadmin
 * @author Padmin D. Curtis (AI Partner OS3.0) for Fabio Cherici
 * @version 2.0.0 (FlorenceEGI - EGI-HUB Billing FASE 1)
 * @date 2026-02-25
 * @purpose Sostituisce stub hardcoded con CRUD reale su AiFeaturePricing model
 */
class FeaturePricingController extends Controller
{
    /**
     * Elenco feature pricing con filtri opzionali.
     *
     * Query params: category, bundle_type, is_active (1/0), is_bundle (1/0)
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $query = AiFeaturePricing::query()->orderBy('display_order')->orderBy('feature_category');

            if ($request->filled('category')) {
                $query->where('feature_category', $request->input('category'));
            }

            if ($request->filled('bundle_type')) {
                $query->where('bundle_type', $request->input('bundle_type'));
            }

            if ($request->has('is_active')) {
                $query->where('is_active', (bool) $request->input('is_active'));
            }

            if ($request->has('is_bundle')) {
                $query->where('is_bundle', (bool) $request->input('is_bundle'));
            }

            $items = $query->get();

            return response()->json([
                'success' => true,
                'data'    => $items,
                'total'   => $items->count(),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Errore nel recupero pricing: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Dettaglio singola feature pricing.
     */
    public function show(int $id): JsonResponse
    {
        try {
            $item = AiFeaturePricing::findOrFail($id);

            return response()->json([
                'success' => true,
                'data'    => $item,
            ]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Feature pricing non trovato.',
            ], 404);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Errore: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Crea nuova feature pricing.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'feature_code'        => 'required|string|max:100|unique:ai_feature_pricing,feature_code',
            'feature_name'        => 'required|string|max:255',
            'feature_description' => 'nullable|string',
            'feature_category'    => 'required|string|max:100',
            'cost_egili'          => 'required|integer|min:0',
            'cost_fiat_eur'       => 'nullable|numeric|min:0',
            'is_free'             => 'boolean',
            'is_bundle'           => 'boolean',
            'bundle_type'         => 'nullable|string|max:100',
            'is_active'           => 'boolean',
            'is_featured'         => 'boolean',
            'display_order'       => 'integer|min:0',
            'feature_parameters'  => 'nullable|array',
            'benefits'            => 'nullable|array',
            'icon_name'           => 'nullable|string|max:100',
            'badge_color'         => 'nullable|string|max:50',
            'admin_notes'         => 'nullable|string',
        ]);

        try {
            $item = AiFeaturePricing::create($validated);

            return response()->json([
                'success' => true,
                'data'    => $item->fresh(),
                'message' => 'Feature pricing creata.',
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Errore creazione: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Aggiorna feature pricing esistente — supporta aggiornamento parziale.
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $validated = $request->validate([
            'feature_name'        => 'sometimes|string|max:255',
            'feature_description' => 'sometimes|nullable|string',
            'feature_category'    => 'sometimes|string|max:100',
            'cost_egili'          => 'sometimes|integer|min:0',
            'cost_fiat_eur'       => 'sometimes|nullable|numeric|min:0',
            'is_free'             => 'sometimes|boolean',
            'is_bundle'           => 'sometimes|boolean',
            'bundle_type'         => 'sometimes|nullable|string|max:100',
            'is_active'           => 'sometimes|boolean',
            'is_featured'         => 'sometimes|boolean',
            'display_order'       => 'sometimes|integer|min:0',
            'feature_parameters'  => 'sometimes|nullable|array',
            'benefits'            => 'sometimes|nullable|array',
            'tier_pricing'        => 'sometimes|nullable|array',
            'monthly_quota'       => 'sometimes|nullable|integer|min:0',
            'free_monthly_limit'  => 'sometimes|nullable|integer|min:0',
            'icon_name'           => 'sometimes|nullable|string|max:100',
            'badge_color'         => 'sometimes|nullable|string|max:50',
            'admin_notes'         => 'sometimes|nullable|string',
        ]);

        try {
            $item = AiFeaturePricing::findOrFail($id);
            $item->update($validated);

            return response()->json([
                'success' => true,
                'data'    => $item->fresh(),
                'message' => 'Feature pricing aggiornata.',
            ]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Feature pricing non trovata.',
            ], 404);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Errore aggiornamento: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Soft-delete feature pricing.
     */
    public function destroy(int $id): JsonResponse
    {
        try {
            $item = AiFeaturePricing::findOrFail($id);
            $item->delete();

            return response()->json([
                'success' => true,
                'message' => 'Feature pricing eliminata.',
            ]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Feature pricing non trovata.',
            ], 404);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Errore eliminazione: ' . $e->getMessage(),
            ], 500);
        }
    }
}
