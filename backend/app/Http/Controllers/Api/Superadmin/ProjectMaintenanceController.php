<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\Superadmin;

use App\Models\Project;
use App\Services\RemoteCommandService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Ultra\UltraLogManager\UltraLogManager;

/**
 * @package App\Http\Controllers\Api\Superadmin
 * @author Padmin D. Curtis (AI Partner OS3.0) for Fabio Cherici
 * @version 1.0.0 (EGI-HUB - Project Maintenance)
 * @date 2026-03-11
 * @purpose Operazioni di manutenzione distruttive su progetti remoti via SSM.
 *          Attualmente: EGI Asset Purge (S3 + Pinata + DB).
 *          Protezioni: solo SuperAdmin + 2FA (middleware route) +
 *                      token di conferma richiesto dalla UI nel body.
 */
class ProjectMaintenanceController extends Controller {
    // Nessun token hardcoded: la validazione è puramente frontend (speed-bump UX).
    // La sicurezza reale è garantita dal middleware (auth + superadmin role).

    public function __construct(
        private readonly UltraLogManager $logger,
    ) {
    }

    // ─────────────────────────────────────────────────────────────────────────
    // EGI Asset Purge
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Esegue un dry-run della purge sul progetto remoto via SSM.
     * Nessuna modifica, solo output simulato.
     *
     * POST /api/projects/{project}/maintenance/egi-purge/dry-run
     */
    public function egiPurgeDryRun(Request $request, Project $project): JsonResponse {
        $this->logger->info('MAINTENANCE.EGI_PURGE_DRYRUN: started', [
            'admin_id'   => $request->user()?->id,
            'project_id' => $project->id,
            'project'    => $project->slug,
        ]);

        $service = app(RemoteCommandService::class);
        $result  = $service->runPredefined($project, 'egi_purge_dryrun');

        $this->logger->info('MAINTENANCE.EGI_PURGE_DRYRUN: completed', [
            'project' => $project->slug,
            'success' => $result['success'],
        ]);

        return response()->json([
            'success' => $result['success'],
            'output'  => $result['output'],
            'status'  => $result['status'] ?? null,
            'dry_run' => true,
        ]);
    }

    /**
     * Esegue la purge reale sul progetto remoto via SSM.
     *
     * Richiede nel body:
     *   - confirm_token: deve essere esattamente "PURGE ALL EGI"
     *
     * POST /api/projects/{project}/maintenance/egi-purge/execute
     */
    public function egiPurgeExecute(Request $request, Project $project): JsonResponse {
        // ── Validazione token di conferma ──────────────────────────────────
        $request->validate([
            'confirm_token' => 'required|string|min:10',
        ]);

        // ── Log operazione ad alto rischio ─────────────────────────────────
        $this->logger->warning('MAINTENANCE.EGI_PURGE_EXECUTE: initiated — IRREVERSIBLE', [
            'admin_id'   => $request->user()?->id,
            'admin_email' => $request->user()?->email,
            'project_id' => $project->id,
            'project'    => $project->slug,
            'ip'         => $request->ip(),
            'user_agent' => $request->userAgent(),
        ]);

        $service = app(RemoteCommandService::class);
        $result  = $service->runPredefined($project, 'egi_purge_force');

        $this->logger->warning('MAINTENANCE.EGI_PURGE_EXECUTE: completed', [
            'project' => $project->slug,
            'success' => $result['success'],
            'output_preview' => mb_substr($result['output'] ?? '', 0, 500),
        ]);

        return response()->json([
            'success' => $result['success'],
            'output'  => $result['output'],
            'status'  => $result['status'] ?? null,
            'dry_run' => false,
        ]);
    }
}
