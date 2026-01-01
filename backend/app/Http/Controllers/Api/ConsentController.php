<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\UserConsent;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Ultra\UltraLogManager\UltraLogManager;
use Ultra\ErrorManager\Interfaces\ErrorManagerInterface;

/**
 * Controller per la gestione dei consensi (GDPR)
 */
class ConsentController extends Controller
{
    public function __construct(
        protected UltraLogManager $logger,
        protected ErrorManagerInterface $errorManager
    ) {}

    /**
     * Lista consensi attivi dell'utente
     * 
     * GET /api/consents
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $user = $request->user();
            
            // Recupera l'ultimo consenso per ogni tipo
            $consents = UserConsent::where('user_id', $user->id)
                ->orderBy('created_at', 'desc')
                ->get()
                ->unique('type')
                ->values();

            return response()->json([
                'success' => true,
                'data' => $consents,
            ]);

        } catch (\Exception $e) {
            return $this->errorManager->handle('GENERIC_ERROR', [
                'action' => 'list_consents',
                'log_category' => 'CONSENT_LIST_ERROR'
            ], $e);
        }
    }

    /**
     * Aggiorna un consenso
     * 
     * POST /api/consents
     */
    public function update(Request $request): JsonResponse
    {
        try {
            $request->validate([
                'type' => 'required|string|in:marketing,profiling,third_party',
                'status' => 'required|boolean',
            ]);

            $user = $request->user();

            $consent = UserConsent::create([
                'user_id' => $user->id,
                'type' => $request->type,
                'status' => $request->status ? 'granted' : 'denied',
                'ip_address' => $request->ip(),
                'user_agent' => $request->userAgent(),
                'granted_at' => now(),
            ]);

            $this->logger->info("User consent updated", [
                'user_id' => $user->id,
                'type' => $request->type,
                'status' => $request->status,
                'log_category' => 'CONSENT_UPDATE'
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Consenso aggiornato',
                'data' => $consent,
            ]);

        } catch (\Exception $e) {
            return $this->errorManager->handle('CONSENT_UPDATE_FAILED', [
                'user_id' => $request->user()?->id,
                'type' => $request->type ?? 'unknown',
                'log_category' => 'CONSENT_UPDATE_ERROR'
            ], $e);
        }
    }

    /**
     * Storico dei consensi
     * 
     * GET /api/consents/history
     */
    public function history(Request $request): JsonResponse
    {
        try {
            $user = $request->user();

            $history = UserConsent::where('user_id', $user->id)
                ->orderBy('created_at', 'desc')
                ->paginate(20);

            return response()->json([
                'success' => true,
                'data' => $history,
            ]);

        } catch (\Exception $e) {
            return $this->errorManager->handle('CONSENT_HISTORY_ERROR', [
                'user_id' => $user->id,
                'log_category' => 'CONSENT_HISTORY_ERROR'
            ], $e);
        }
    }
}
