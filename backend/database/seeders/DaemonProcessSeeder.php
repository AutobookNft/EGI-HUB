<?php

namespace Database\Seeders;

use App\Models\DaemonProcess;
use Illuminate\Database\Seeder;

/**
 * Pre-popola la tabella daemon_processes con i daemon esistenti sul server di produzione.
 * Questi corrispondono ai file .conf in /etc/supervisor/conf.d/ sul server EC2.
 */
class DaemonProcessSeeder extends Seeder
{
    public function run(): void
    {
        $daemons = [
            [
                'name'               => 'NATAN FastAPI',
                'slug'               => 'natan-fastapi',
                'supervisor_program' => 'natan-fastapi',
                'command'            => '/home/forge/natan-loc.florenceegi.com/python_ai_service/.venv/bin/uvicorn app.main:app --host 127.0.0.1 --port 8001',
                'directory'          => '/home/forge/natan-loc.florenceegi.com/python_ai_service',
                'user'               => 'forge',
                'autostart'          => true,
                'autorestart'        => true,
                'stdout_logfile'     => '/var/log/natan-fastapi.out.log',
                'stderr_logfile'     => '/var/log/natan-fastapi.err.log',
                'environment'        => 'PYTHONPATH="/home/forge/natan-loc.florenceegi.com/python_ai_service"',
            ],
            [
                'name'               => 'Algorand Microservice',
                'slug'               => 'algorand-microservice',
                'supervisor_program' => 'algorand-microservice',
                'command'            => 'node server.js',
                'directory'          => '/home/forge/art.florenceegi.com/algokit-microservice',
                'user'               => 'forge',
                'autostart'          => true,
                'autorestart'        => true,
                'stdout_logfile'     => '/var/log/algorand-microservice.out.log',
                'stderr_logfile'     => '/var/log/algorand-microservice.err.log',
                'environment'        => 'NODE_ENV="production"',
            ],
            [
                'name'               => 'Blockchain Minting Worker',
                'slug'               => 'blockchain-minting-worker',
                'supervisor_program' => 'blockchain-minting-worker',
                'command'            => 'php8.3 artisan queue:work --queue=blockchain --tries=3 --timeout=60 --sleep=3',
                'directory'          => '/home/forge/art.florenceegi.com',
                'user'               => 'forge',
                'autostart'          => true,
                'autorestart'        => true,
                'stopwaitsecs'       => 3600,
                'stdout_logfile'     => '/var/log/blockchain-minting-worker.out.log',
                'stderr_logfile'     => '/var/log/blockchain-minting-worker.err.log',
            ],
            [
                'name'               => 'PA Blockchain Worker',
                'slug'               => 'pa-blockchain-worker',
                'supervisor_program' => 'pa-blockchain-worker',
                'command'            => 'php8.3 artisan queue:work --queue=pa_blockchain --tries=3 --timeout=60 --sleep=3',
                'directory'          => '/home/forge/art.florenceegi.com',
                'user'               => 'forge',
                'autostart'          => true,
                'autorestart'        => true,
                'stopwaitsecs'       => 3600,
                'stdout_logfile'     => '/var/log/pa-blockchain-worker.out.log',
                'stderr_logfile'     => '/var/log/pa-blockchain-worker.err.log',
            ],
        ];

        foreach ($daemons as $data) {
            DaemonProcess::firstOrCreate(
                ['slug' => $data['slug']],
                $data
            );
        }
    }
}
