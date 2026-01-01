<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\ProjectActivity;
use App\Models\UserConsent;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Ultra\UltraLogManager\UltraLogManager;
use Ultra\ErrorManager\Interfaces\ErrorManagerInterface;

/**
 * Controller per la gestione delle richieste GDPR
 * 
 * Gestisce l'esportazione dei dati personali e la richiesta di cancellazione.
 */
class GdprController extends Controller
{
    public function __construct(
        protected UltraLogManager $logger,
        protected ErrorManagerInterface $errorManager
    ) {}

    /**
     * Esporta tutti i dati personali dell'utente (Right to Access)
     * 
     * GET /api/privacy/export
     */
    public function export(Request $request): JsonResponse
    {
        try {
            $user = $request->user();
            
            // Raccogli tutti i dati
            $data = [
                'profile' => $user->makeVisible(['email', 'created_at', 'updated_at'])->toArray(),
                'consents' => UserConsent::where('user_id', $user->id)->get()->toArray(),
                // Include altre relazioni se necessario (es. memberships, last_activities)
                'projects_admin' => $user->managedProjects()->get()->pluck('name', 'slug')->toArray(),
                'exported_at' => now()->toIso8601String(),
            ];

            $this->logger->info("User requested GDPR data export", [
                'user_id' => $user->id,
                'log_category' => 'GDPR_EXPORT_REQUEST'
            ]);

            return response()->json([
                'success' => true,
                'data' => $data,
                'filename' => 'user_data_export_' . $user->id . '.json'
            ]);

        } catch (\Exception $e) {
            return $this->errorManager->handle('GDPR_DATA_EXPORT_FAILED', [
                'user_id' => $request->user()?->id,
                'log_category' => 'GDPR_EXPORT_ERROR'
            ], $e);
        }
    }

    /**
     * Richiesta di cancellazione account (Right to be Forgotten)
     * 
     * Nota: Esegue una soft-delete o anonimizzazione a seconda delle policy.
     * Qui implementiamo una cancellazione logica ma con anonimizzazione PII se necessario.
     * 
     * DELETE /api/privacy/forget-me
     */
    public function destroy(Request $request): JsonResponse
    {
        try {
            $user = $request->user();
            
            // Verifica passowrd per sicurezza
            $request->validate([
                'password' => 'required|current_password',
            ]);

            DB::beginTransaction();

            // 1. Anonimizzazione Consensi (manteniamo traccia che c'erano ma rimuoviamo IP)
            UserConsent::where('user_id', $user->id)->update([
                'ip_address' => '0.0.0.0',
                'user_agent' => 'ANONYMIZED'
            ]);

            // 2. Log dell'evento PRIMA di cancellare
            $this->logger->warning("User requested account deletion (GDPR)", [
                'user_id' => $user->id,
                'email' => $user->email, // Logghiamo l'email prima di cancellarla per audit
                'log_category' => 'GDPR_ACCOUNT_DELETION'
            ]);

            // 3. Eliminazione User (Soft delete se supportato, altrimenti Delete fisico o Anonymize)
            // In questo caso usiamo delete standard di Laravel che fa soft delete se abilitato sul modello
            $user->delete();

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Account eliminato correttamente.',
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            return $this->errorManager->handle('GDPR_DELETE_ERROR', [
                'user_id' => $request->user()?->id,
                'log_category' => 'GDPR_DELETE_ERROR'
            ], $e);
        }
    }
}
