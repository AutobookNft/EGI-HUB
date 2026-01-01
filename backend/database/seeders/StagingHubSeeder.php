<?php

namespace Database\Seeders;

use App\Models\Project;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class StagingHubSeeder extends Seeder
{
    /**
     * Run the database seeds.
     *
     * Inizializza solo i dati HUB (MariaDB) per l'ambiente di Staging.
     * NON tocca gli utenti su EGI Core (Postgres).
     */
    public function run(): void
    {
        // 1. Crea il Progetto Principale (Florence EGI)
        $project = Project::firstOrCreate(
            ['slug' => 'florence-egi'],
            [
                'name' => 'Florence EGI',
                'description' => 'Main Project for EGI Ecosystem',
                'url' => 'https://florence.egi.creates.art',
                'status' => 'active',
                'metadata' => [
                    'theme' => 'light',
                    'features' => ['ai_chat', 'blockchain_monitor']
                ],
                'type' => 'hub_core',
            ]
        );

        $this->command->info("✅ Progetto '{$project->name}' (MariaDB) verificato/creato con successo.");

        // 2. Crea altri progetti di test se necessario
        // ...
    }
}
