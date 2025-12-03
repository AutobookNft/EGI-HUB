<?php

namespace Database\Seeders;

use App\Models\Project;
use Illuminate\Database\Seeder;

class ProjectSeeder extends Seeder
{
    /**
     * Seed dei progetti SaaS per FlorenceEGI ecosystem.
     * 
     * NOTA: I "Projects" sono le applicazioni SaaS (NATAN_LOC, EGI, etc.)
     * mentre i "Tenants" sono i clienti finali di ogni progetto.
     * 
     * Configurazioni:
     * - local_start_script / local_stop_script: usati in APP_ENV=local
     * - supervisor_program: usato in APP_ENV=staging/production (Forge)
     * - staging_url: URL sslip.io per staging
     * - production_url: URL finale con dominio florenceegi.com
     */
    public function run(): void
    {
        // NATAN_LOC - SaaS per PA (Comuni, Enti Pubblici)
        Project::updateOrCreate(
            ['slug' => 'natan'],
            [
                'name' => 'NATAN LOC',
                'description' => 'AI Assistant per Pubbliche Amministrazioni - SaaS multi-tenant per Comuni e Enti',
                'url' => $this->getEnvironmentUrl('natan'),
                'local_start_script' => '/home/fabio/dev/NATAN_LOC/start_services.sh',
                'local_stop_script' => '/home/fabio/dev/NATAN_LOC/stop_services.sh',
                'supervisor_program' => 'tenant-natan',
                'staging_url' => 'https://natan-loc.13.48.57.194.sslip.io',
                'production_url' => 'https://natan.florenceegi.com',
                'status' => Project::STATUS_ACTIVE,
            ]
        );

        // FlorenceArtEGI - SaaS per Arte (Gallerie, Artisti, Musei)
        Project::updateOrCreate(
            ['slug' => 'egi'],
            [
                'name' => 'FlorenceArtEGI',
                'description' => 'Piattaforma NFT e certificazione digitale per opere d\'arte - SaaS multi-tenant per Gallerie e Artisti',
                'url' => $this->getEnvironmentUrl('egi'),
                'local_start_script' => '/home/fabio/dev/EGI/start_services.sh',
                'local_stop_script' => '/home/fabio/dev/EGI/stop_services.sh',
                'supervisor_program' => 'tenant-egi',
                'staging_url' => 'https://app.13.48.57.194.sslip.io',
                'production_url' => 'https://florenceegi.com',
                'status' => Project::STATUS_ACTIVE,
            ]
        );

        // Aggiungi qui altri progetti quando necessario
        // Esempio futuro:
        // Project::updateOrCreate(
        //     ['slug' => 'tourism'],
        //     [
        //         'name' => 'Florence Tourism',
        //         'description' => 'Piattaforma turismo culturale - SaaS multi-tenant per Tour Operator',
        //         'url' => $this->getEnvironmentUrl('tourism'),
        //         'supervisor_program' => 'tenant-tourism',
        //         'staging_url' => 'https://tourism.13.48.57.194.sslip.io',
        //         'production_url' => 'https://tourism.florenceegi.com',
        //         'status' => Project::STATUS_ACTIVE,
        //     ]
        // );
    }

    /**
     * Ritorna l'URL corretto in base all'ambiente
     */
    protected function getEnvironmentUrl(string $slug): string
    {
        $environment = config('app.env');

        $urls = [
            'natan' => [
                'local' => 'http://localhost:7000',
                'staging' => 'https://natan-loc.13.48.57.194.sslip.io',
                'production' => 'https://natan.florenceegi.com',
            ],
            'egi' => [
                'local' => 'http://localhost:8004',
                'staging' => 'https://app.13.48.57.194.sslip.io',
                'production' => 'https://florenceegi.com',
            ],
        ];

        return $urls[$slug][$environment] ?? $urls[$slug]['local'];
    }
}
