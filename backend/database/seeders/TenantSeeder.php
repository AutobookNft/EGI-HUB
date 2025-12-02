<?php

namespace Database\Seeders;

use App\Models\Tenant;
use Illuminate\Database\Seeder;

class TenantSeeder extends Seeder
{
    /**
     * Seed dei tenant per FlorenceEGI ecosystem.
     * 
     * Configurazioni:
     * - local_start_script / local_stop_script: usati in APP_ENV=local
     * - supervisor_program: usato in APP_ENV=staging/production (Forge)
     * - staging_url: URL sslip.io per staging
     * - production_url: URL finale con dominio florenceegi.com
     */
    public function run(): void
    {
        // NATAN_LOC
        Tenant::updateOrCreate(
            ['slug' => 'natan'],
            [
                'name' => 'NATAN LOC',
                'url' => $this->getEnvironmentUrl('natan'),
                'local_start_script' => '/home/fabio/dev/NATAN_LOC/start_services.sh',
                'local_stop_script' => '/home/fabio/dev/NATAN_LOC/stop_services.sh',
                'supervisor_program' => 'tenant-natan',
                'staging_url' => 'https://natan_loc.13.48.57.194.sslip.io',
                'production_url' => 'https://natan.florenceegi.com',
                'status' => Tenant::STATUS_ACTIVE,
            ]
        );

        // FlorenceArtEGI (main app)
        Tenant::updateOrCreate(
            ['slug' => 'egi'],
            [
                'name' => 'FlorenceArtEGI',
                'url' => $this->getEnvironmentUrl('egi'),
                'local_start_script' => '/home/fabio/dev/EGI/start_services.sh',
                'local_stop_script' => '/home/fabio/dev/EGI/stop_services.sh',
                'supervisor_program' => 'tenant-egi',
                'staging_url' => 'https://app.13.48.57.194.sslip.io',
                'production_url' => 'https://florenceegi.com',
                'status' => Tenant::STATUS_ACTIVE,
            ]
        );

        // Aggiungi qui altri tenant quando necessario
        // Esempio:
        // Tenant::updateOrCreate(
        //     ['slug' => 'art'],
        //     [
        //         'name' => 'Florence Art Gallery',
        //         'url' => $this->getEnvironmentUrl('art'),
        //         'supervisor_program' => 'tenant-art',
        //         'staging_url' => 'https://art.13.48.57.194.sslip.io',
        //         'production_url' => 'https://art.florenceegi.com',
        //         'status' => Tenant::STATUS_ACTIVE,
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
                'staging' => 'https://natan_loc.13.48.57.194.sslip.io',
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
