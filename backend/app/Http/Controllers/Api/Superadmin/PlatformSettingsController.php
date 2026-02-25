<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\Superadmin;

use App\Models\PlatformSetting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;

/**
 * Platform Settings API Controller — EGI-HUB
 *
 * Gestione read-write dei parametri tecnici globali della piattaforma
 * tramite tabella `platform_settings` del DB condiviso.
 *
 * @package App\Http\Controllers\Api\Superadmin
 * @author Padmin D. Curtis (AI Partner OS3.0) for Fabio Cherici
 * @version 1.0.0 (FlorenceEGI - EGI-HUB Billing FASE 2)
 * @date 2026-02-25
 * @purpose Espone API JSON per lettura e aggiornamento bulk dei platform settings
 */
class PlatformSettingsController extends Controller
{
    /**
     * Lista tutti i setting raggruppati per group.
     *
     * Response: { success, data: { group: [ { id, group, key, value, value_type, label, description, is_editable } ] } }
     */
    public function index(): JsonResponse
    {
        try {
            $grouped = PlatformSetting::allGrouped();

            return response()->json([
                'success' => true,
                'data'    => $grouped,
                'groups'  => $grouped->keys()->values(),
                'total'   => PlatformSetting::count(),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Errore nel recupero dei settings: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Aggiornamento bulk di tutti i setting di un gruppo.
     *
     * Body: { settings: { "<id>": "<value>", ... } }
     * Solo i setting con is_editable=true vengono aggiornati.
     */
    public function updateGroup(Request $request, string $group): JsonResponse
    {
        $request->validate([
            'settings'   => 'required|array',
            'settings.*' => 'nullable|string|max:1000',
        ]);

        try {
            $updated = 0;

            foreach ($request->settings as $id => $value) {
                $setting = PlatformSetting::find((int) $id);

                if ($setting && $setting->group === $group && $setting->is_editable) {
                    $setting->update(['value' => (string) $value]);
                    $updated++;
                }
            }

            PlatformSetting::invalidateCache();

            return response()->json([
                'success' => true,
                'updated' => $updated,
                'message' => "{$updated} setting del gruppo [{$group}] aggiornati.",
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Errore aggiornamento gruppo: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Aggiornamento singolo setting per ID.
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $request->validate([
            'value' => 'required|string|max:1000',
        ]);

        try {
            $setting = PlatformSetting::findOrFail($id);

            if (! $setting->is_editable) {
                return response()->json([
                    'success' => false,
                    'message' => 'Questo setting non è modificabile.',
                ], 403);
            }

            $setting->update(['value' => $request->value]);
            PlatformSetting::invalidateCache();

            return response()->json([
                'success' => true,
                'data'    => $setting->fresh(),
                'message' => "Setting [{$setting->group}.{$setting->key}] aggiornato.",
            ]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Setting non trovato.',
            ], 404);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Errore aggiornamento: ' . $e->getMessage(),
            ], 500);
        }
    }
}
