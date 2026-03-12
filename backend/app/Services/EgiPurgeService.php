<?php

declare(strict_types=1);

namespace App\Services;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
use Ultra\ErrorManager\Interfaces\ErrorManagerInterface;
use Ultra\UltraLogManager\UltraLogManager;

/**
 * @package App\Services
 * @author Padmin D. Curtis (AI Partner OS3.0) for Fabio Cherici
 * @version 1.0.0 (EGI-HUB - EGI Asset Purge)
 * @date 2026-03-15
 * @purpose Purge COMPLETA di tutti gli EGI dell'ecosistema direttamente da EGI-HUB:
 *          S3 files (original + 4 WebP variants), Pinata IPFS unpins, DB hard-delete.
 *          Opera sullo stesso DB PostgreSQL condiviso (schema core, tabella egis).
 *          Nessuna dipendenza da SSM / comandi remoti su art.florenceegi.com.
 */
class EgiPurgeService
{
    /** Varianti WebP generate per ogni EGI (da config/image-optimization.php di EGI) */
    private const EGI_VARIANTS = ['thumbnail', 'mobile', 'tablet', 'desktop'];

    /** Buffer per l'output restituito al controller / frontend terminal */
    private array $lines = [];

    public function __construct(
        private readonly UltraLogManager $logger,
        private readonly ErrorManagerInterface $errorManager,
    ) {}

    // ─────────────────────────────────────────────────────────────────────────
    // Entry point pubblico
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Esegui la purge (o il dry-run).
     *
     * @param  bool  $dryRun   true = nessuna modifica, solo report
     * @param  bool  $skipS3   true = salta cancellazione S3
     * @param  bool  $skipIpfs true = salta unpin Pinata
     * @return array{success: bool, output: string}
     */
    public function run(bool $dryRun = true, bool $skipS3 = false, bool $skipIpfs = false): array
    {
        $this->lines = [];

        try {
            $this->out('');
            if ($dryRun) {
                $this->out('╔══════════════════════════════════════════════════╗');
                $this->out('║           DRY-RUN — NO CHANGES MADE             ║');
                $this->out('║   Run execute to perform actual deletion         ║');
                $this->out('╚══════════════════════════════════════════════════╝');
            } else {
                $this->out('╔══════════════════════════════════════════════════╗');
                $this->out('║        ⚠️  LIVE MODE — IRREVERSIBLE ⚠️            ║');
                $this->out('╚══════════════════════════════════════════════════╝');
            }
            $this->out('');

            // ── 1. Carica TUTTI gli EGI (inclusi soft-deleted) ───────────────
            $egis = DB::table('egis')->get();
            $this->out("Found {$egis->count()} EGIs to process.");
            $this->out('');

            // ── 2. Costruisci lista file S3 e CID IPFS univoci ────────────────
            $s3FilesToDelete = [];
            $ipfsCidsToUnpin = []; // keyed by CID → array di EGI IDs

            foreach ($egis as $egi) {
                // Paths S3
                if (!empty($egi->collection_id) && !empty($egi->user_id) && !empty($egi->key_file)) {
                    $basePath = sprintf(
                        'users_files/collections_%d/creator_%d',
                        $egi->collection_id,
                        $egi->user_id
                    );

                    // File originale (es. 37.jpg)
                    if (!empty($egi->extension)) {
                        $s3FilesToDelete[] = "{$basePath}/{$egi->key_file}.{$egi->extension}";
                    }

                    // Varianti WebP: 37_thumbnail.webp, 37_mobile.webp, ecc.
                    foreach (self::EGI_VARIANTS as $variant) {
                        $s3FilesToDelete[] = "{$basePath}/{$egi->key_file}_{$variant}.webp";
                    }
                }

                // CID IPFS univoci
                if (!empty($egi->ipfs_cid)) {
                    $ipfsCidsToUnpin[$egi->ipfs_cid][] = $egi->id;
                }
                if (!empty($egi->file_IPFS)) {
                    $ipfsCidsToUnpin[$egi->file_IPFS][] = $egi->id;
                }
            }

            // ── 3. Report piano ───────────────────────────────────────────────
            $this->out('── S3 FILES ──────────────────────────────────');
            if ($skipS3) {
                $this->out('  [SKIP] S3 deletion skipped (--skip-s3)');
            } else {
                $this->out("  Files to attempt delete: " . count($s3FilesToDelete));
                foreach ($s3FilesToDelete as $path) {
                    $this->out("  → {$path}");
                }
            }

            $this->out('');
            $this->out('── PINATA IPFS PINS ──────────────────────────');
            $ipfsEnabled = $this->isPinataEnabled();
            if ($skipIpfs) {
                $this->out('  [SKIP] IPFS unpins skipped (--skip-ipfs)');
            } elseif (!$ipfsEnabled) {
                $this->out('  [SKIP] IPFS service disabled (IPFS_ENABLED=false or no JWT)');
            } else {
                $totalShared = collect($ipfsCidsToUnpin)->map(fn($ids) => count($ids))->sum();
                $this->out("  Unique CIDs to unpin: " . count($ipfsCidsToUnpin) . " (from {$totalShared} EGI records)");
                foreach ($ipfsCidsToUnpin as $cid => $cidShareIds) {
                    $shared = count($cidShareIds) > 1 ? " ⚠️  shared by EGI IDs: " . implode(',', $cidShareIds) : '';
                    $this->out("  → {$cid}{$shared}");
                }
            }

            $this->out('');
            $this->out('── DB RECORDS ────────────────────────────────');
            $egiIds     = $egis->pluck('id')->toArray();
            $traitCount = DB::table('egi_traits')->whereIn('egi_id', $egiIds)->count();
            $this->out("  EgiTrait records (+ Spatie media): {$traitCount}");
            $this->out("  EGI records (hard delete):         {$egis->count()}");
            $this->out('');

            // ── DRY-RUN → stop qui ────────────────────────────────────────────
            if ($dryRun) {
                $this->out('DRY-RUN complete. No changes made.');
                $this->out('Invoke execute to apply.');
                return $this->result(true);
            }

            // ── 4. EXECUTE — cancellazione S3 ────────────────────────────────
            if (!$skipS3) {
                $this->out('Deleting S3 files...');
                $disk      = Storage::disk('s3');
                $s3Deleted = 0;
                $s3Missing = 0;
                $s3Errors  = 0;

                foreach ($s3FilesToDelete as $path) {
                    try {
                        if ($disk->exists($path)) {
                            $disk->delete($path);
                            $this->out("  ✓ Deleted: {$path}");
                            $s3Deleted++;
                        } else {
                            $this->out("  – Not found (skip): {$path}");
                            $s3Missing++;
                        }
                    } catch (\Exception $e) {
                        $this->out("  ✗ Error: {$path}: " . $e->getMessage());
                        $s3Errors++;
                    }
                }
                $this->out("  S3 result: deleted={$s3Deleted}, not_found={$s3Missing}, errors={$s3Errors}");
                $this->out('');
            }

            // ── 5. EXECUTE — Pinata IPFS unpin ───────────────────────────────
            if (!$skipIpfs && $ipfsEnabled) {
                $this->out('Unpinning from Pinata...');
                $jwt          = config('services.pinata.jwt', env('PINATA_JWT'));
                $ipfsUnpinned = 0;
                $ipfsErrors   = 0;

                foreach ($ipfsCidsToUnpin as $cid => $cidShareIds) {
                    try {
                        $response = Http::timeout(30)
                            ->withHeaders(['Authorization' => "Bearer {$jwt}"])
                            ->delete("https://api.pinata.cloud/pinning/unpin/{$cid}");

                        if ($response->successful()) {
                            $this->out("  ✓ Unpinned: {$cid}");
                            $ipfsUnpinned++;
                        } else {
                            $this->out("  ? Unpin returned {$response->status()} (already gone?): {$cid}");
                            $ipfsErrors++;
                        }
                    } catch (\Exception $e) {
                        $this->out("  ✗ Unpin error {$cid}: " . $e->getMessage());
                        $ipfsErrors++;
                    }
                }
                $this->out("  IPFS result: unpinned={$ipfsUnpinned}, errors={$ipfsErrors}");
                $this->out('');
            }

            // ── 6. EXECUTE — pulizia DB ──────────────────────────────────────
            $this->out('Cleaning DB records...');
            $this->out("  IDs da eliminare: " . count($egiIds));

            // Forza esplicitamente lo schema corretto per questa connessione
            DB::statement('SET search_path TO core, public');

            $preCount = DB::table('egis')->count();
            $this->out("  Pre-delete count: {$preCount}");

            DB::transaction(function () use ($egiIds, &$traitDeleted, &$egiDeleted) {
                // 6a. EgiTrait — elimina riga per riga per triggerare Spatie
                $traits       = DB::table('egi_traits')->whereIn('egi_id', $egiIds)->get();
                $traitDeleted = 0;
                foreach ($traits as $trait) {
                    DB::table('egi_traits')->where('id', $trait->id)->delete();
                    $traitDeleted++;
                }

                // 6b. EGI hard-delete con schema esplicito per evitare ambiguità search_path
                $egiDeleted = DB::table('core.egis')->whereIn('id', $egiIds)->delete();
            });

            $postCount = DB::table('egis')->count();

            $this->out("  ✓ EgiTrait deleted: {$traitDeleted}");
            $this->out("  ✓ EGI hard deleted: {$egiDeleted}");
            $this->out("  Post-delete count: {$postCount}");
            $this->out('');
            $this->out('════════════════════════════════════════════════');
            $this->out('✅  PURGE COMPLETE');
            $this->out('════════════════════════════════════════════════');

            $this->logger->warning('EGI_PURGE_SERVICE: purge completed', [
                'egi_count'    => $egis->count(),
                's3_files'     => count($s3FilesToDelete),
                'ipfs_cids'    => count($ipfsCidsToUnpin),
                'traits_del'   => $traitDeleted ?? 0,
                'egi_del'      => $egiDeleted ?? 0,
            ]);

            return $this->result(true);

        } catch (\Throwable $e) {
            $this->out('');
            $this->out("✗ FATAL ERROR: " . $e->getMessage());
            $this->errorManager->handle('EGI_PURGE_FATAL', [
                'error'   => $e->getMessage(),
                'dry_run' => $dryRun,
            ], $e);
            return $this->result(false);
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Helper privati
    // ─────────────────────────────────────────────────────────────────────────

    private function out(string $line): void
    {
        $this->lines[] = $line;
    }

    private function result(bool $success): array
    {
        return [
            'success' => $success,
            'output'  => implode("\n", $this->lines),
        ];
    }

    private function isPinataEnabled(): bool
    {
        $enabled = env('IPFS_ENABLED', false);
        $jwt     = env('PINATA_JWT', '');
        return filter_var($enabled, FILTER_VALIDATE_BOOLEAN) && !empty($jwt);
    }
}
