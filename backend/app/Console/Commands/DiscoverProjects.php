<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Models\Project;
use Aws\Route53\Route53Client;
use Aws\Exception\AwsException;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;

/**
 * @package App\Console\Commands
 * @author Padmin D. Curtis (AI Partner OS3.0) for Fabio Cherici
 * @version 1.0.0 (FlorenceEGI - EGI-HUB Projects Discovery)
 * @date 2025-07-22
 * @purpose Interroga Route 53 per scoprire i sottodomini di florenceegi.com
 *          e fa upsert nella tabella system_projects con health check HTTP.
 */
class DiscoverProjects extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'projects:discover
                            {--zone-id=Z05052791PPWNJ3NKL131 : Hosted Zone ID Route 53}
                            {--domain=florenceegi.com : Dominio base}
                            {--no-health : Salta il health check HTTP}
                            {--dry-run : Mostra solo cosa farebbe senza scrivere nel DB}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Scopre i progetti dell\'ecosistema leggendo i sottodomini da AWS Route 53';

    /**
     * Nomi "leggibili" per slug noti.
     */
    private array $knownNames = [
        'art'       => 'FlorenceEGI Art Marketplace',
        'natan-loc' => 'NATAN PA (AI Cognitivo)',
        'info'      => 'EGI-INFO (Sito Informativo)',
        'api'       => 'EGI API Gateway',
        'app'       => 'FlorenceEGI App',
    ];

    /**
     * Record da escludere dall'upsert (tecnici/infrastruttura/interni).
     */
    private array $excludedSlugs = [
        // Infrastruttura EGI-HUB stessa
        'hub',
        // CDN / asset
        'media',
        // Marketing/redirect
        'www',
        // Mail
        'mail', 'smtp', 'pop', 'imap',
        // Accesso remoto
        'ftp', 'sftp', 'vpn',
        // DNS tecnici
        'ns1', 'ns2', 'ns3', 'ns4',
        '_domainkey', '_dmarc',
        'autoconfig', 'autodiscover',
    ];

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $zoneId  = $this->option('zone-id');
        $domain  = rtrim((string) $this->option('domain'), '.');
        $noHealth = (bool) $this->option('no-health');
        $dryRun  = (bool) $this->option('dry-run');

        $this->info("🔍 Connessione a Route 53 — Hosted Zone: {$zoneId}");

        // ─── 1. Fetch record da Route 53 ─────────────────────────────────────
        try {
            $client = new Route53Client([
                'version' => 'latest',
                'region'  => 'us-east-1',
                // Nessuna chiave: usa automaticamente l'EC2 Instance IAM Role
            ]);

            $records = [];
            $params  = [
                'HostedZoneId' => $zoneId,
                'MaxItems'     => '300',
            ];

            // Paginazione Route 53
            do {
                $result   = $client->listResourceRecordSets($params);
                $records  = array_merge($records, $result['ResourceRecordSets'] ?? []);
                $isTrunc  = $result['IsTruncated'] ?? false;

                if ($isTrunc) {
                    $params['StartRecordName'] = $result['NextRecordName'];
                    $params['StartRecordType'] = $result['NextRecordType'];
                }
            } while ($isTrunc);

        } catch (AwsException $e) {
            $this->error('❌ Route 53 error: ' . $e->getAwsErrorMessage());
            return self::FAILURE;
        } catch (\Throwable $e) {
            $this->error('❌ Errore generico: ' . $e->getMessage());
            return self::FAILURE;
        }

        $this->info('📋 Record DNS totali trovati: ' . count($records));

        // ─── 2. Filtra sottodomini validi ─────────────────────────────────────
        $subdomains = [];

        foreach ($records as $record) {
            $name = rtrim((string) ($record['Name'] ?? ''), '.');
            $type = (string) ($record['Type'] ?? '');

            // Solo A e CNAME
            if (!in_array($type, ['A', 'CNAME'], true)) {
                continue;
            }

            // Deve essere un sottodominio di florenceegi.com (non l'apex)
            if ($name === $domain) {
                continue;
            }

            if (!str_ends_with($name, '.' . $domain)) {
                continue;
            }

            // Estrai slug (es. "hub" da "hub.florenceegi.com")
            $slug = Str::before($name, '.' . $domain);

            // Escludi sotto-sottodomini (es. "staging.hub") — opzionale
            if (str_contains($slug, '.')) {
                $this->line("  ⤷ Skipping multi-level: {$name}");
                continue;
            }

            // Escludi record che iniziano con _ (validazione certificati, DKIM, ecc.)
            if (str_starts_with($slug, '_')) {
                $this->line("  ⤷ Skipping validation record: {$name}");
                continue;
            }

            // Escludi record tecnici
            if (in_array(strtolower($slug), $this->excludedSlugs, true)) {
                $this->line("  ⤷ Skipping tecnico: {$name}");
                continue;
            }

            $subdomains[] = [
                'slug'           => $slug,
                'name'           => $this->knownNames[$slug] ?? Str::title(str_replace('-', ' ', $slug)),
                'production_url' => "https://{$name}",
                'url'            => "https://{$name}",
                'dns_type'       => $type,
                'dns_name'       => $name,
            ];
        }

        if (empty($subdomains)) {
            $this->warn('⚠️  Nessun sottodominio trovato. Verifica lo Hosted Zone ID o i permessi IAM.');
            return self::SUCCESS;
        }

        $this->info('🌐 Sottodomini trovati: ' . count($subdomains));

        // ─── 3. Upsert DB + Health check ──────────────────────────────────────
        $results = [];

        foreach ($subdomains as $sub) {
            $this->line("\n  📦 {$sub['dns_name']} ({$sub['dns_type']})");

            $isHealthy = null;

            if (!$noHealth) {
                $isHealthy = $this->checkHealth($sub['production_url']);
                $status    = $isHealthy ? '✅ online' : '❌ offline';
                $this->line("     Health: {$status}");
            }

            if (!$dryRun) {
                // Carica existing per preservare metadata
                $existing = Project::where('slug', $sub['slug'])->first();
                $existingMeta = $existing?->metadata ?? [];

                /** @var Project $project */
                $project = Project::updateOrCreate(
                    ['slug' => $sub['slug']],
                    [
                        'name'              => $sub['name'],
                        'url'               => $sub['url'],
                        'production_url'    => $sub['production_url'],
                        'status'            => ($isHealthy === false)
                            ? Project::STATUS_ERROR
                            : Project::STATUS_ACTIVE,
                        'is_healthy'        => $isHealthy,
                        'last_health_check' => now(),
                        'metadata'          => array_merge(
                            $existingMeta,
                            ['dns_type' => $sub['dns_type'], 'discovered_at' => now()->toISOString()]
                        ),
                    ]
                );

                $action = $project->wasRecentlyCreated ? 'CREATO' : 'AGGIORNATO';
                $this->line("     DB: {$action} (id={$project->id})");
            } else {
                $this->line("     [DRY RUN] upsert slug={$sub['slug']}");
            }

            $results[] = [
                $sub['dns_name'],
                $sub['dns_type'],
                $isHealthy === null ? 'skipped' : ($isHealthy ? '✅' : '❌'),
                $dryRun ? 'dry-run' : 'ok',
            ];
        }

        // ─── 4. Cleanup progetti stale ────────────────────────────────────────
        // Rimuove progetti il cui URL punta a florenceegi.com ma che non
        // fanno più parte dei sottodomini scoperti (es. slug rinominati).
        if (!$dryRun) {
            $discoveredSlugs = array_column($subdomains, 'slug');
            $stale = Project::where('url', 'like', "%{$domain}%")
                ->whereNotIn('slug', $discoveredSlugs)
                ->get();

            foreach ($stale as $staleProject) {
                $this->line("  🗑️  Rimozione progetto stale: {$staleProject->slug} ({$staleProject->url})");
                $staleProject->delete();
            }
        }

        // ─── 5. Tabella riepilogo ──────────────────────────────────────────────
        $this->newLine();
        $this->table(
            ['Dominio', 'Tipo', 'Health', 'DB'],
            $results
        );

        $this->info("\n✅ Discovery completata. " . count($subdomains) . ' sottodomini elaborati.');

        return self::SUCCESS;
    }

    /**
     * Fa un GET HTTP sul production_url e restituisce true/false.
     */
    private function checkHealth(string $url): bool
    {
        try {
            $response = Http::timeout(5)
                ->withoutVerifying()
                ->get($url);

            return $response->successful() || in_array($response->status(), [301, 302, 401, 403], true);
        } catch (\Throwable) {
            return false;
        }
    }
}
