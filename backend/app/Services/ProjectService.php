<?php

namespace App\Services;

use App\Models\Project;
use App\Models\ProjectActivity;
use Illuminate\Support\Facades\Http;
use Ultra\UltraLogManager\UltraLogManager;
use Ultra\ErrorManager\Interfaces\ErrorManagerInterface;

/**
 * ProjectService
 * 
 * Servizio per la gestione delle operazioni sui progetti SaaS.
 * Gestisce health check, proxy delle richieste e aggregazione dati.
 * 
 * NOTA: I "Projects" in EGI-HUB sono le applicazioni SaaS (NATAN_LOC, EGI, etc.)
 * mentre i "Tenants" sono i clienti finali di ogni progetto.
 */
class ProjectService
{
    public function __construct(
        protected UltraLogManager $logger,
        protected ErrorManagerInterface $errorManager
    ) {}
    /**
     * Timeout per le richieste HTTP (in secondi)
     */
    protected int $timeout = 10;

    /**
     * Timeout per gli health check (in secondi)
     */
    protected int $healthCheckTimeout = 5;

    /**
     * Esegue una richiesta proxy verso un progetto
     */
    public function proxyRequest(
        Project $project,
        string $method,
        string $path,
        array $data = [],
        array $headers = []
    ): array {
        $url = $project->getApiUrl($path);
        $allHeaders = array_merge($project->getAuthHeaders(), $headers);

        $this->logger->debug("Proxy request to project", [
            'project' => $project->slug,
            'method' => $method,
            'url' => $url,
            'log_category' => 'PROJECT_PROXY_DEBUG'
        ]);

        $request = Http::timeout($this->timeout)
                       ->withHeaders($allHeaders);

        $response = match (strtoupper($method)) {
            'GET' => $request->get($url, $data),
            'POST' => $request->post($url, $data),
            'PUT' => $request->put($url, $data),
            'PATCH' => $request->patch($url, $data),
            'DELETE' => $request->delete($url, $data),
            default => throw new \InvalidArgumentException("Unsupported HTTP method: {$method}"),
        };

        if ($response->failed()) {
            $this->logger->warning("Project request failed", [
                'project' => $project->slug,
                'status' => $response->status(),
                'body' => $response->body(),
                'log_category' => 'PROJECT_PROXY_WARNING'
            ]);

            throw new \RuntimeException(
                "Request to project failed with status {$response->status()}"
            );
        }

        return [
            'status' => $response->status(),
            'data' => $response->json() ?? $response->body(),
            'headers' => $response->headers(),
        ];
    }

    /**
     * Verifica lo stato di salute di un progetto
     * Prova prima /api/health, poi la root URL
     */
    public function checkHealth(Project $project): array
    {
        $startTime = microtime(true);
        
        try {
            // Prima prova /api/health
            $response = Http::timeout($this->healthCheckTimeout)
                           ->withHeaders($project->getAuthHeaders())
                           ->get($project->getApiUrl('api/health'));

            // Se 404, prova la root URL
            if ($response->status() === 404) {
                $response = Http::timeout($this->healthCheckTimeout)
                               ->withHeaders($project->getAuthHeaders())
                               ->get($project->getApiUrl(''));
            }

            $endTime = microtime(true);
            $responseTime = round(($endTime - $startTime) * 1000, 2);

            // Il progetto è healthy se risponde con status 2xx o 3xx (redirect)
            $statusCode = $response->status();
            $isHealthy = $statusCode >= 200 && $statusCode < 400;
            
            $project->updateHealthStatus($isHealthy);

            // Log activity
            ProjectActivity::logHealthCheck($project, $isHealthy, $response->status(), $responseTime);

            return [
                'healthy' => $isHealthy,
                'status_code' => $response->status(),
                'response_time_ms' => $responseTime,
                'checked_at' => now()->toIso8601String(),
                'data' => $response->json(),
            ];

        } catch (\Exception $e) {
            $endTime = microtime(true);
            $responseTime = round(($endTime - $startTime) * 1000, 2);

            $this->logger->warning("Health check failed for project", [
                'project' => $project->slug,
                'error' => $e->getMessage(),
                'log_category' => 'PROJECT_HEALTH_CHECK_WARNING'
            ]);

            $project->updateHealthStatus(false);

            // Log error activity
            ProjectActivity::logError($project, 'Health Check Failed', $e->getMessage());

            // Throw exception for Controller UEM
            throw $e;
        }
    }

    /**
     * Verifica lo stato di salute di tutti i progetti
     */
    public function checkAllHealth(): array
    {
        $projects = Project::all();
        $results = [];

        foreach ($projects as $project) {
            try {
                $results[$project->slug] = [
                    'project' => [
                        'id' => $project->id,
                        'name' => $project->name,
                        'url' => $project->url,
                    ],
                    'health' => $this->checkHealth($project),
                ];
            } catch (\Exception $e) {
                 // UEM Handle for bulk ops
                 $this->errorManager->handle('PROJECT_LIST_ERROR', [
                     'project' => $project->slug,
                     'log_category' => 'PROJECT_LIST_CHECK_FAILURE'
                 ], $e);

                 $results[$project->slug] = [
                     'healthy' => false, 
                     'error' => $e->getMessage()
                 ];
            }
        }

        return [
            'results' => $results,
            'summary' => [
                'total' => count($projects),
                'healthy' => collect($results)->where('health.healthy', true)->count(),
                'unhealthy' => collect($results)->where('health.healthy', false)->count(),
            ],
            'checked_at' => now()->toIso8601String(),
        ];
    }

    /**
     * Ottiene statistiche aggregate da tutti i progetti
     */
    public function getAggregatedStats(): array
    {
        $projects = Project::active()->healthy()->get();
        $stats = [];

        foreach ($projects as $project) {
            try {
                $result = $this->proxyRequest($project, 'GET', 'api/stats');
                $stats[$project->slug] = [
                    'success' => true,
                    'data' => $result['data'],
                ];
            } catch (\Exception $e) {
                $stats[$project->slug] = [
                    'success' => false,
                    'error' => $e->getMessage(),
                ];
            }
        }

        return $stats;
    }

    /**
     * Registra un nuovo progetto con validazione URL
     */
    public function registerProject(array $data): Project
    {
        // Crea il progetto
        $project = Project::create($data);

        // Verifica la connettività
        $health = $this->checkHealth($project);

        $this->logger->info("New project registered", [
            'project' => $project->slug,
            'healthy' => $health['healthy'],
            'log_category' => 'PROJECT_REGISTERED'
        ]);

        return $project;
    }

    /**
     * Sincronizza i dati da un progetto specifico
     */
    public function syncFromProject(Project $project, string $resource): array
    {
        if (!$project->isActive()) {
            throw new \RuntimeException("Cannot sync from inactive project");
        }

        try {
            $result = $this->proxyRequest($project, 'GET', "api/{$resource}");
            
            $this->logger->info("Synced data from project", [
                'project' => $project->slug,
                'resource' => $resource,
                'count' => is_array($result['data']) ? count($result['data']) : 1,
                'log_category' => 'PROJECT_SYNC_SUCCESS'
            ]);

            return $result['data'];

        } catch (\Exception $e) {
            $this->logger->warning("Sync failed from project", [
                'project' => $project->slug,
                'resource' => $resource,
                'error' => $e->getMessage(),
                'log_category' => 'PROJECT_SYNC_WARNING'
            ]);

            throw $e;
        }
    }

    /**
     * Avvia i servizi di un progetto
     * Usa script locale in dev, Supervisor in produzione
     */
    public function startProject(Project $project): array
    {
        $environment = config('app.env');
        
        Log::info("Starting project services", [
            'project' => $project->slug,
            'environment' => $environment,
        ]);

        // Produzione/Staging: usa Supervisor
        if (in_array($environment, ['production', 'staging'])) {
            return $this->startProjectWithSupervisor($project);
        }

        // Dev locale: usa script
        return $this->startProjectWithScript($project);
    }

    /**
     * Avvia progetto usando script locale
     */
    protected function startProjectWithScript(Project $project): array
    {
        $script = $project->local_start_script;

        if (!$script || !file_exists($script)) {
            Log::warning("Start script not found for project", ['project' => $project->slug, 'script' => $script]);
            return [
                'success' => false,
                'message' => "Script di avvio non trovato per {$project->name}. Configura local_start_script nel database.",
            ];
        }

        try {
            // Esegui lo script in background
            $logFile = "/tmp/project_start_{$project->slug}.log";
            exec("bash {$script} > {$logFile} 2>&1 &", $output, $returnCode);

            Log::info("Started project services via script", ['project' => $project->slug, 'script' => $script]);
            
            ProjectActivity::create([
                'project_id' => $project->id,
                'type' => 'config',
                'action' => 'service_start',
                'status' => 'success',
                'description' => "Servizi avviati via script: {$script}",
            ]);

            return [
                'success' => true,
                'message' => "Avvio servizi {$project->name} in corso...",
                'method' => 'script',
            ];

        } catch (\Exception $e) {
            $this->logger->warning("Failed to start project via script", [
                'project' => $project->slug, 
                'error' => $e->getMessage(),
                'log_category' => 'PROJECT_START_SCRIPT_WARNING'
            ]);
            
            throw $e;
        }
    }

    /**
     * Avvia progetto usando Supervisor (produzione/staging su Forge)
     */
    protected function startProjectWithSupervisor(Project $project): array
    {
        $program = $project->supervisor_program;

        if (!$program) {
            Log::warning("Supervisor program not configured for project", ['project' => $project->slug]);
            return [
                'success' => false,
                'message' => "Programma Supervisor non configurato per {$project->name}. Configura supervisor_program nel database.",
            ];
        }

        try {
            // Esegui supervisorctl
            $output = [];
            $returnCode = 0;
            exec("sudo supervisorctl start {$program}:* 2>&1", $output, $returnCode);

            $outputStr = implode("\n", $output);
            $success = $returnCode === 0 || str_contains($outputStr, 'ALREADY_STARTED');

            Log::info("Started project services via Supervisor", [
                'project' => $project->slug, 
                'program' => $program,
                'output' => $outputStr,
                'return_code' => $returnCode,
            ]);
            
            ProjectActivity::create([
                'project_id' => $project->id,
                'type' => 'config',
                'action' => 'service_start',
                'status' => $success ? 'success' : 'error',
                'description' => "Servizi avviati via Supervisor: {$program}",
                'metadata' => ['output' => $outputStr],
            ]);

            return [
                'success' => $success,
                'message' => $success 
                    ? "Servizi {$project->name} avviati"
                    : "Errore Supervisor: {$outputStr}",
                'method' => 'supervisor',
            ];

        } catch (\Exception $e) {
            $this->logger->warning("Failed to start project via Supervisor", [
                'project' => $project->slug, 
                'error' => $e->getMessage(),
                'log_category' => 'PROJECT_START_SUPERVISOR_WARNING'
            ]);
            
            throw $e;
        }
    }

    /**
     * Ferma i servizi di un progetto
     * Usa script locale in dev, Supervisor in produzione
     */
    public function stopProject(Project $project): array
    {
        $environment = config('app.env');
        
        Log::info("Stopping project services", [
            'project' => $project->slug,
            'environment' => $environment,
        ]);

        // Produzione/Staging: usa Supervisor
        if (in_array($environment, ['production', 'staging'])) {
            return $this->stopProjectWithSupervisor($project);
        }

        // Dev locale: usa script
        return $this->stopProjectWithScript($project);
    }

    /**
     * Ferma progetto usando script locale
     */
    protected function stopProjectWithScript(Project $project): array
    {
        $script = $project->local_stop_script;

        if (!$script || !file_exists($script)) {
            Log::warning("Stop script not found for project", ['project' => $project->slug, 'script' => $script]);
            return [
                'success' => false,
                'message' => "Script di arresto non trovato per {$project->name}. Configura local_stop_script nel database.",
            ];
        }

        try {
            // Esegui lo script
            $logFile = "/tmp/project_stop_{$project->slug}.log";
            exec("bash {$script} > {$logFile} 2>&1", $output, $returnCode);

            Log::info("Stopped project services via script", ['project' => $project->slug, 'script' => $script]);
            
            $project->updateHealthStatus(false);
            
            ProjectActivity::create([
                'project_id' => $project->id,
                'type' => 'config',
                'action' => 'service_stop',
                'status' => 'success',
                'description' => "Servizi fermati via script: {$script}",
            ]);

            return [
                'success' => true,
                'message' => "Servizi {$project->name} fermati",
                'method' => 'script',
            ];

        } catch (\Exception $e) {
            $this->logger->warning("Failed to stop project via script", [
                'project' => $project->slug, 
                'error' => $e->getMessage(),
                'log_category' => 'PROJECT_STOP_SCRIPT_WARNING'
            ]);
            
            throw $e;
        }
    }

    /**
     * Ferma progetto usando Supervisor (produzione/staging su Forge)
     */
    protected function stopProjectWithSupervisor(Project $project): array
    {
        $program = $project->supervisor_program;

        if (!$program) {
            Log::warning("Supervisor program not configured for project", ['project' => $project->slug]);
            return [
                'success' => false,
                'message' => "Programma Supervisor non configurato per {$project->name}. Configura supervisor_program nel database.",
            ];
        }

        try {
            // Esegui supervisorctl
            $output = [];
            $returnCode = 0;
            exec("sudo supervisorctl stop {$program}:* 2>&1", $output, $returnCode);

            $outputStr = implode("\n", $output);
            $success = $returnCode === 0 || str_contains($outputStr, 'NOT_RUNNING');

            Log::info("Stopped project services via Supervisor", [
                'project' => $project->slug, 
                'program' => $program,
                'output' => $outputStr,
                'return_code' => $returnCode,
            ]);
            
            $project->updateHealthStatus(false);
            
            ProjectActivity::create([
                'project_id' => $project->id,
                'type' => 'config',
                'action' => 'service_stop',
                'status' => $success ? 'success' : 'error',
                'description' => "Servizi fermati via Supervisor: {$program}",
                'metadata' => ['output' => $outputStr],
            ]);

            return [
                'success' => $success,
                'message' => $success 
                    ? "Servizi {$project->name} fermati"
                    : "Errore Supervisor: {$outputStr}",
                'method' => 'supervisor',
            ];

        } catch (\Exception $e) {
            $this->logger->warning("Failed to stop project via Supervisor", [
                'project' => $project->slug, 
                'error' => $e->getMessage(),
                'log_category' => 'PROJECT_STOP_SUPERVISOR_WARNING'
            ]);
            
            throw $e;
        }
    }
}
