<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\Project;
use Aws\Ssm\SsmClient;
use Aws\Exception\AwsException;

/**
 * @package App\Services
 * @purpose Esegue comandi remoti su EC2 via AWS SSM SendCommand.
 *          Utilizzato per deploy e manutenzione dei progetti EGI dall'HUB.
 */
class RemoteCommandService
{
    /**
     * Comandi predefiniti (chiave → shell command da eseguire nella deploy_path).
     */
    public const PREDEFINED = [
        'git_pull'         => 'git pull',
        'composer_install' => 'composer install --no-dev --optimize-autoloader',
        'npm_install'      => 'npm install',
        'npm_build'        => 'npm run build',
        'cache_clear'      => 'if [ -f artisan ]; then php artisan cache:clear; else echo "Skip: artisan non trovato"; fi',
        'config_cache'     => 'if [ -f artisan ]; then php artisan config:cache && php artisan cache:clear; else echo "Skip: artisan non trovato"; fi',
        'migrate'          => 'if [ -f artisan ]; then php artisan migrate --force; else echo "Skip: artisan non trovato"; fi',
        'queue_restart'    => 'if [ -f artisan ]; then php artisan queue:restart; else echo "Skip: artisan non trovato"; fi',
        'deploy_full'      => 'git pull && ([ -f composer.json ] && composer install --no-dev --optimize-autoloader || true) && ([ -f package.json ] && npm install && npm run build || true) && ([ -f artisan ] && php artisan migrate --force && php artisan config:cache && php artisan cache:clear && php artisan queue:restart || true)',
    ];

    private SsmClient $ssm;

    public function __construct()
    {
        $this->ssm = new SsmClient([
            'version' => 'latest',
            // AWS_EC2_REGION = regione dell'istanza EC2 (eu-north-1)
            // NON usare AWS_DEFAULT_REGION che punta a us-east-1 per Route53
            'region'  => env('AWS_EC2_REGION', 'eu-north-1'),
        ]);
    }

    /**
     * Esegue un comando predefinito per un progetto.
     */
    public function runPredefined(Project $project, string $key): array
    {
        if (!isset(self::PREDEFINED[$key])) {
            return ['success' => false, 'output' => "Comando '{$key}' non riconosciuto.", 'status' => 'Failed'];
        }

        return $this->run($project, self::PREDEFINED[$key]);
    }

    /**
     * Esegue un comando arbitrario su EC2 nella directory del progetto.
     *
     * @return array{success: bool, output: string, status: string}
     */
    public function run(Project $project, string $command): array
    {
        $deployPath = $this->getDeployPath($project);
        $instanceId = $this->getInstanceId($project);

        // Esegui come utente forge nella directory di progetto
        $fullCommand = "sudo -u forge bash -c \"cd {$deployPath} && {$command}\" 2>&1";

        try {
            $result = $this->ssm->sendCommand([
                'DocumentName'   => 'AWS-RunShellScript',
                'InstanceIds'    => [$instanceId],
                'Parameters'     => ['commands' => [$fullCommand]],
                'TimeoutSeconds' => 180,
            ]);

            $commandId = $result['Command']['CommandId'];

            // Poll per risultato (max 90s = 30 tentativi × 3s)
            return $this->pollResult($commandId, $instanceId, 30, 3);

        } catch (AwsException $e) {
            return [
                'success' => false,
                'output'  => 'SSM Error: ' . $e->getAwsErrorMessage(),
                'status'  => 'Failed',
            ];
        } catch (\Throwable $e) {
            return [
                'success' => false,
                'output'  => 'Errore: ' . $e->getMessage(),
                'status'  => 'Failed',
            ];
        }
    }

    /**
     * Esegue il polling su SSM GetCommandInvocation fino a completamento.
     */
    private function pollResult(string $commandId, string $instanceId, int $maxAttempts, int $waitSec): array
    {
        for ($i = 0; $i < $maxAttempts; $i++) {
            sleep($waitSec);

            try {
                $inv    = $this->ssm->getCommandInvocation([
                    'CommandId'  => $commandId,
                    'InstanceId' => $instanceId,
                ]);
                $status = $inv['Status'] ?? '';

                if (in_array($status, ['Success', 'Failed', 'TimedOut', 'Cancelled'], true)) {
                    $stdout = $inv['StandardOutputContent'] ?? '';
                    $stderr = $inv['StandardErrorContent']  ?? '';

                    $output = trim($stdout);
                    if ($stderr !== '') {
                        $output .= ($output !== '' ? "\n" : '') . "[STDERR]\n" . trim($stderr);
                    }

                    return [
                        'success' => $status === 'Success',
                        'status'  => $status,
                        'output'  => $output,
                    ];
                }
            } catch (\Throwable) {
                // InvocationDoesNotExist → il comando non è ancora stato registrato, riprova
            }
        }

        return [
            'success' => false,
            'status'  => 'Timeout',
            'output'  => 'Timeout: il comando non ha risposto entro ' . ($maxAttempts * $waitSec) . ' secondi.',
        ];
    }

    /**
     * Determina il deploy path per un progetto.
     * Priorità: metadata['deploy_path'] → metadata['dns_name'] → slug fallback.
     */
    private function getDeployPath(Project $project): string
    {
        if (!empty($project->metadata['deploy_path'])) {
            return $project->metadata['deploy_path'];
        }

        // Usa dns_name scoperto da Route 53 se disponibile
        $dnsName = $project->metadata['dns_name'] ?? null;
        if ($dnsName) {
            return '/home/forge/' . $dnsName;
        }

        // Fallback: apex domain o sottodominio
        if ($project->slug === 'florenceegi') {
            return '/home/forge/florenceegi.com';
        }

        return '/home/forge/' . $project->slug . '.florenceegi.com';
    }

    /**
     * Determina l'ID dell'istanza EC2 per un progetto.
     * Priorità: metadata['ec2_instance_id'] → env AWS_EC2_INSTANCE_ID → hardcoded default.
     */
    private function getInstanceId(Project $project): string
    {
        return $project->metadata['ec2_instance_id']
            ?? env('AWS_EC2_INSTANCE_ID', 'i-0940cdb7b955d1632');
    }
}
