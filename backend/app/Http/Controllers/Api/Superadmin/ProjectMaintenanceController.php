<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\Superadmin;

use App\Services\EgiPurgeService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Ultra\UltraLogManager\UltraLogManager;

/**
 * @package App\Http\Controllers\Api\Superadmin
 * @author Padmin D. Curtis (AI Partner OS3.0) for Fabio Cherici
 * @version 2.0.0 (EGI-HUB - Project Maintenance)
 * @date 2026-03-15
 * @purpose Operazioni di manutenzione distruttive su asset EGI.
 *          La purge viene eseguita DIRETTAMENTE da EGI-HUB (stesso DB condiviso,
 *          stesse credenziali S3/Pinata) — nessuna dipendenza da SSM / comandi remoti.
 *          Protezioni: solo SuperAdmin + 2FA (middleware route) +
 *                      token di conferma obbligatorio nel body.
 */
class ProjectMaintenanceController extends Controller
{
    public function __construct(
        private readonly UltraLogManager  $logger,
        private readonly EgiPurgeService  $purgeService,
    ) {}

    // ─────────────────────────────────────────────────────────────────────────
    // EGI Asset Purge
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Dry-run: simula la purge e restituisce le statistiche senza modificare nulla.
     *
     * POST /api/projects/{project}/maintenance/egi-purge/dry-run
     */
    public function egiPurgeDryRun(Request $request): JsonResponse
    {
        $this->logger->info('MAINTENANCE.EGI_PURGE_DRYRUN: started', [
            'admin_id' => $request->user()?->id,
        ]);

        $result = $this->purgeService->run(dryRun: true);

        $this->logger->info('MAINTENANCE.EGI_PURGE_DRYRUN: completed', [
            'success' => $result['success'],
        ]);

        return response()->json([
            'success' => $result['success'],
            'output'  => $result['output'],
            'dry_run' => true,
        ]);
    }

    /**
     * Esegue la purge reale — IRREVERSIBILE.
     *
     * Richiede nel body:
     *   - confirm_token: string non vuota (min:10) — speed-bump UX
     *
     * POST /api/projects/{project}/maintenance/egi-purge/execute
     */
    public function egiPurgeExecute(Request $request): JsonResponse
    {
        $request->validate([
            'confirm_token' => 'required|string|min:10',
        ]);

        $this->logger->warning('MAINTENANCE.EGI_PURGE_EXECUTE: initiated — IRREVERSIBLE', [
            'admin_id'    => $request->user()?->id,
            'admin_email' => $request->user()?->email,
            'ip'          => $request->ip(),
            'user_agent'  => $request->userAgent(),
        ]);

        $result = $this->purgeService->run(dryRun: false);

        $this->logger->warning('MAINTENANCE.EGI_PURGE_EXECUTE: completed', [
            'success'        => $result['success'],
            'output_preview' => mb_substr($result['output'] ?? '', 0, 500),
        ]);

        return response()->json([
            'success' => $result['success'],
            'output'  => $result['output'],
            'dry_run' => false,
        ]);
    }
}

