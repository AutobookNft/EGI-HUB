<?php

namespace App\Services;

use App\Models\DaemonProcess;
use App\Models\ProjectActivity;
use Illuminate\Support\Facades\Log;

/**
 * DaemonService
 *
 * Gestisce l'interazione con Supervisor per start/stop/restart daemon,
 * scrittura/rimozione dei file .conf, e lettura dei log.
 */
class DaemonService
{
    /**
     * Esegue un comando supervisorctl e restituisce l'output strutturato.
     */
    protected function supervisorctl(string $subcommand, string $args = ''): array
    {
        $cmd = trim("sudo supervisorctl {$subcommand} {$args}") . ' 2>&1';
        $output = [];
        $returnCode = 0;

        exec($cmd, $output, $returnCode);

        $outputStr = implode("\n", $output);

        return [
            'output'      => $outputStr,
            'lines'       => $output,
            'return_code' => $returnCode,
            'success'     => $returnCode === 0,
        ];
    }

    /**
     * Ottiene lo status in tempo reale di tutti i processi supervisor.
     * Restituisce un array associativo program_name => status_info.
     */
    public function getAllStatuses(): array
    {
        $result = $this->supervisorctl('status');
        $statuses = [];

        foreach ($result['lines'] as $line) {
            $parsed = $this->parseStatusLine($line);
            if ($parsed) {
                $statuses[$parsed['program']] = $parsed;
            }
        }

        return $statuses;
    }

    /**
     * Aggiorna lo status di tutti i daemon nel DB dal supervisorctl reale.
     */
    public function refreshAllStatuses(): void
    {
        $statuses = $this->getAllStatuses();
        $daemons = DaemonProcess::all();

        foreach ($daemons as $daemon) {
            $programKey = $this->findProgramStatus($daemon->supervisor_program, $statuses);

            if ($programKey !== null) {
                $info = $statuses[$programKey];
                $daemon->update([
                    'status' => $this->mapSupervisorStatus($info['status']),
                    'metadata' => array_merge($daemon->metadata ?? [], [
                        'pid' => $info['pid'] ?? null,
                        'uptime' => $info['uptime'] ?? null,
                    ]),
                    'last_status_check' => now(),
                ]);
            } else {
                $daemon->update([
                    'status' => DaemonProcess::STATUS_UNKNOWN,
                    'last_status_check' => now(),
                ]);
            }
        }
    }

    /**
     * Avvia un daemon.
     */
    public function start(DaemonProcess $daemon): array
    {
        $program = $this->sanitizeProgram($daemon->supervisor_program);
        $result = $this->supervisorctl('start', "{$program}:*");

        $success = $result['success'] || str_contains($result['output'], 'ALREADY_STARTED');

        $daemon->update([
            'status' => $success ? DaemonProcess::STATUS_RUNNING : DaemonProcess::STATUS_ERROR,
            'last_status_check' => now(),
        ]);

        $this->logActivity($daemon, 'daemon_start', $success, $result['output']);

        Log::info("Daemon start: {$daemon->name}", [
            'program' => $program,
            'success' => $success,
            'output'  => $result['output'],
        ]);

        return [
            'success' => $success,
            'message' => $success
                ? "Daemon {$daemon->name} avviato"
                : "Errore avvio {$daemon->name}: {$result['output']}",
            'output'  => $result['output'],
        ];
    }

    /**
     * Ferma un daemon.
     */
    public function stop(DaemonProcess $daemon): array
    {
        $program = $this->sanitizeProgram($daemon->supervisor_program);
        $result = $this->supervisorctl('stop', "{$program}:*");

        $success = $result['success'] || str_contains($result['output'], 'NOT_RUNNING');

        $daemon->update([
            'status' => $success ? DaemonProcess::STATUS_STOPPED : DaemonProcess::STATUS_ERROR,
            'last_status_check' => now(),
        ]);

        $this->logActivity($daemon, 'daemon_stop', $success, $result['output']);

        return [
            'success' => $success,
            'message' => $success
                ? "Daemon {$daemon->name} fermato"
                : "Errore stop {$daemon->name}: {$result['output']}",
            'output'  => $result['output'],
        ];
    }

    /**
     * Riavvia un daemon.
     */
    public function restart(DaemonProcess $daemon): array
    {
        $program = $this->sanitizeProgram($daemon->supervisor_program);
        $result = $this->supervisorctl('restart', "{$program}:*");

        $success = $result['success'];

        $daemon->update([
            'status' => $success ? DaemonProcess::STATUS_RUNNING : DaemonProcess::STATUS_ERROR,
            'last_status_check' => now(),
        ]);

        $this->logActivity($daemon, 'daemon_restart', $success, $result['output']);

        return [
            'success' => $success,
            'message' => $success
                ? "Daemon {$daemon->name} riavviato"
                : "Errore restart {$daemon->name}: {$result['output']}",
            'output'  => $result['output'],
        ];
    }

    /**
     * Scrive il file .conf di supervisor per un daemon,
     * poi esegue reread + update.
     */
    public function writeConfig(DaemonProcess $daemon): array
    {
        $confContent = $daemon->getSupervisorConfContent();
        $confPath = "/etc/supervisor/conf.d/{$daemon->slug}.conf";

        // Scrivi il file via sudo tee
        $tmpFile = tempnam(sys_get_temp_dir(), 'daemon_conf_');
        file_put_contents($tmpFile, $confContent);

        $output = [];
        $returnCode = 0;
        exec("sudo cp " . escapeshellarg($tmpFile) . " " . escapeshellarg($confPath) . " 2>&1", $output, $returnCode);
        unlink($tmpFile);

        if ($returnCode !== 0) {
            return [
                'success' => false,
                'message' => "Errore scrittura config: " . implode("\n", $output),
            ];
        }

        // Reread + update
        $reread = $this->supervisorctl('reread');
        $update = $this->supervisorctl('update');

        $success = $reread['success'] && $update['success'];

        $this->logActivity($daemon, 'daemon_config_write', $success, "reread: {$reread['output']}, update: {$update['output']}");

        return [
            'success' => $success,
            'message' => $success
                ? "Configurazione {$daemon->name} scritta e applicata"
                : "Errore applicazione config: reread={$reread['output']}, update={$update['output']}",
        ];
    }

    /**
     * Rimuove il file .conf di supervisor per un daemon.
     * Ferma il daemon prima, poi rimuove il file e aggiorna supervisor.
     */
    public function removeConfig(DaemonProcess $daemon): array
    {
        // Stop prima
        $this->stop($daemon);

        $confPath = "/etc/supervisor/conf.d/{$daemon->slug}.conf";

        $output = [];
        $returnCode = 0;
        exec("sudo rm -f " . escapeshellarg($confPath) . " 2>&1", $output, $returnCode);

        // Reread + update
        $this->supervisorctl('reread');
        $this->supervisorctl('update');

        $this->logActivity($daemon, 'daemon_config_remove', $returnCode === 0, implode("\n", $output));

        return [
            'success' => $returnCode === 0,
            'message' => $returnCode === 0
                ? "Configurazione {$daemon->name} rimossa"
                : "Errore rimozione config: " . implode("\n", $output),
        ];
    }

    /**
     * Legge le ultime N righe di un log file (stdout o stderr).
     */
    public function readLog(DaemonProcess $daemon, string $type = 'stdout', int $lines = 100): array
    {
        $logFile = $type === 'stderr' ? $daemon->stderr_logfile : $daemon->stdout_logfile;

        if (!$logFile) {
            return ['success' => false, 'content' => '', 'file' => '', 'lines' => 0, 'error' => 'Log file non configurato'];
        }

        $output = [];
        $returnCode = 0;
        exec("sudo tail -n " . intval($lines) . " " . escapeshellarg($logFile) . " 2>&1", $output, $returnCode);

        return [
            'success' => $returnCode === 0,
            'content' => implode("\n", $output),
            'file'    => $logFile,
            'lines'   => count($output),
        ];
    }

    /**
     * Parsa una riga dell'output di `supervisorctl status`.
     * Esempio: "natan-fastapi                    RUNNING   pid 50514, uptime 5:23:01"
     */
    protected function parseStatusLine(string $line): ?array
    {
        $line = trim($line);
        if (empty($line) || str_starts_with($line, 'unix://')) {
            return null;
        }

        // Pattern: program_name   STATUS   extra_info
        if (preg_match('/^(\S+)\s+(RUNNING|STOPPED|STARTING|BACKOFF|STOPPING|EXITED|FATAL|UNKNOWN)\s*(.*)?$/i', $line, $matches)) {
            $extra = trim($matches[3] ?? '');
            $pid = null;
            $uptime = null;

            if (preg_match('/pid\s+(\d+)/', $extra, $pidMatch)) {
                $pid = (int)$pidMatch[1];
            }
            if (preg_match('/uptime\s+([\d:]+)/', $extra, $uptimeMatch)) {
                $uptime = $uptimeMatch[1];
            }

            return [
                'program' => $matches[1],
                'status'  => strtoupper($matches[2]),
                'pid'     => $pid,
                'uptime'  => $uptime,
                'detail'  => $extra,
            ];
        }

        return null;
    }

    /**
     * Cerca il program in un array di status, gestendo il suffisso :program_00
     */
    protected function findProgramStatus(string $supervisorProgram, array $statuses): ?string
    {
        // Match esatto
        if (isset($statuses[$supervisorProgram])) {
            return $supervisorProgram;
        }

        // Match con suffisso (es. "natan-fastapi:natan-fastapi_00")
        foreach ($statuses as $key => $info) {
            $baseName = explode(':', $key)[0];
            if ($baseName === $supervisorProgram) {
                return $key;
            }
        }

        return null;
    }

    /**
     * Mappa lo status di supervisor allo status del model.
     */
    protected function mapSupervisorStatus(string $supervisorStatus): string
    {
        return match (strtoupper($supervisorStatus)) {
            'RUNNING'  => DaemonProcess::STATUS_RUNNING,
            'STOPPED'  => DaemonProcess::STATUS_STOPPED,
            'STARTING' => DaemonProcess::STATUS_STARTING,
            'BACKOFF', 'FATAL', 'EXITED' => DaemonProcess::STATUS_ERROR,
            'STOPPING' => DaemonProcess::STATUS_STOPPED,
            default    => DaemonProcess::STATUS_UNKNOWN,
        };
    }

    /**
     * Sanitizza il nome del programma per prevenire injection.
     */
    protected function sanitizeProgram(string $program): string
    {
        return preg_replace('/[^a-zA-Z0-9_\-]/', '', $program);
    }

    /**
     * Logga un'attività daemon nella tabella project_activities (se il daemon ha un project_id).
     */
    protected function logActivity(DaemonProcess $daemon, string $action, bool $success, string $detail = ''): void
    {
        if (!$daemon->project_id) {
            return;
        }

        try {
            ProjectActivity::create([
                'project_id'  => $daemon->project_id,
                'type'        => 'daemon',
                'action'      => $action,
                'status'      => $success ? 'success' : 'error',
                'description' => "{$action}: {$daemon->name} ({$daemon->supervisor_program})",
                'metadata'    => ['detail' => $detail, 'daemon_id' => $daemon->id],
            ]);
        } catch (\Exception $e) {
            Log::warning("Failed to log daemon activity", ['error' => $e->getMessage()]);
        }
    }
}
