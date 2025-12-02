<?php

namespace App\Services;

use App\Models\Tenant;
use App\Models\TenantActivity;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * TenantService
 * 
 * Servizio per la gestione delle operazioni sui tenant.
 * Gestisce health check, proxy delle richieste e aggregazione dati.
 */
class TenantService
{
    /**
     * Timeout per le richieste HTTP (in secondi)
     */
    protected int $timeout = 10;

    /**
     * Timeout per gli health check (in secondi)
     */
    protected int $healthCheckTimeout = 5;

    /**
     * Esegue una richiesta proxy verso un tenant
     */
    public function proxyRequest(
        Tenant $tenant,
        string $method,
        string $path,
        array $data = [],
        array $headers = []
    ): array {
        $url = $tenant->getApiUrl($path);
        $allHeaders = array_merge($tenant->getAuthHeaders(), $headers);

        Log::debug("Proxy request to tenant", [
            'tenant' => $tenant->slug,
            'method' => $method,
            'url' => $url,
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
            Log::warning("Tenant request failed", [
                'tenant' => $tenant->slug,
                'status' => $response->status(),
                'body' => $response->body(),
            ]);

            throw new \RuntimeException(
                "Request to tenant failed with status {$response->status()}"
            );
        }

        return [
            'status' => $response->status(),
            'data' => $response->json() ?? $response->body(),
            'headers' => $response->headers(),
        ];
    }

    /**
     * Verifica lo stato di salute di un tenant
     * Prova prima /api/health, poi la root URL
     */
    public function checkHealth(Tenant $tenant): array
    {
        $startTime = microtime(true);
        
        try {
            // Prima prova /api/health
            $response = Http::timeout($this->healthCheckTimeout)
                           ->withHeaders($tenant->getAuthHeaders())
                           ->get($tenant->getApiUrl('api/health'));

            // Se 404, prova la root URL
            if ($response->status() === 404) {
                $response = Http::timeout($this->healthCheckTimeout)
                               ->withHeaders($tenant->getAuthHeaders())
                               ->get($tenant->getApiUrl(''));
            }

            $endTime = microtime(true);
            $responseTime = round(($endTime - $startTime) * 1000, 2);

            // Il tenant è healthy se risponde con status 2xx o 3xx (redirect)
            // 4xx = client error (incluso 404 Not Found) = NON healthy
            // 5xx = server error = NON healthy
            $statusCode = $response->status();
            $isHealthy = $statusCode >= 200 && $statusCode < 400;
            
            $tenant->updateHealthStatus($isHealthy);

            // Log activity
            TenantActivity::logHealthCheck($tenant, $isHealthy, $response->status(), $responseTime);

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

            Log::error("Health check failed for tenant", [
                'tenant' => $tenant->slug,
                'error' => $e->getMessage(),
            ]);

            $tenant->updateHealthStatus(false);

            // Log error activity
            TenantActivity::logError($tenant, 'Health Check Failed', $e->getMessage());

            return [
                'healthy' => false,
                'error' => $e->getMessage(),
                'response_time_ms' => $responseTime,
                'checked_at' => now()->toIso8601String(),
            ];
        }
    }

    /**
     * Verifica lo stato di salute di tutti i tenant
     */
    public function checkAllHealth(): array
    {
        $tenants = Tenant::all();
        $results = [];

        foreach ($tenants as $tenant) {
            $results[$tenant->slug] = [
                'tenant' => [
                    'id' => $tenant->id,
                    'name' => $tenant->name,
                    'url' => $tenant->url,
                ],
                'health' => $this->checkHealth($tenant),
            ];
        }

        return [
            'results' => $results,
            'summary' => [
                'total' => count($tenants),
                'healthy' => collect($results)->where('health.healthy', true)->count(),
                'unhealthy' => collect($results)->where('health.healthy', false)->count(),
            ],
            'checked_at' => now()->toIso8601String(),
        ];
    }

    /**
     * Ottiene statistiche aggregate da tutti i tenant
     */
    public function getAggregatedStats(): array
    {
        $tenants = Tenant::active()->healthy()->get();
        $stats = [];

        foreach ($tenants as $tenant) {
            try {
                $result = $this->proxyRequest($tenant, 'GET', 'api/stats');
                $stats[$tenant->slug] = [
                    'success' => true,
                    'data' => $result['data'],
                ];
            } catch (\Exception $e) {
                $stats[$tenant->slug] = [
                    'success' => false,
                    'error' => $e->getMessage(),
                ];
            }
        }

        return $stats;
    }

    /**
     * Registra un nuovo tenant con validazione URL
     */
    public function registerTenant(array $data): Tenant
    {
        // Crea il tenant
        $tenant = Tenant::create($data);

        // Verifica la connettività
        $health = $this->checkHealth($tenant);

        Log::info("New tenant registered", [
            'tenant' => $tenant->slug,
            'healthy' => $health['healthy'],
        ]);

        return $tenant;
    }

    /**
     * Sincronizza i dati da un tenant specifico
     */
    public function syncFromTenant(Tenant $tenant, string $resource): array
    {
        if (!$tenant->isActive()) {
            throw new \RuntimeException("Cannot sync from inactive tenant");
        }

        try {
            $result = $this->proxyRequest($tenant, 'GET', "api/{$resource}");
            
            Log::info("Synced data from tenant", [
                'tenant' => $tenant->slug,
                'resource' => $resource,
                'count' => is_array($result['data']) ? count($result['data']) : 1,
            ]);

            return $result['data'];

        } catch (\Exception $e) {
            Log::error("Sync failed from tenant", [
                'tenant' => $tenant->slug,
                'resource' => $resource,
                'error' => $e->getMessage(),
            ]);

            throw $e;
        }
    }

    /**
     * Avvia i servizi di un tenant
     * Usa script locale in dev, Supervisor in produzione
     */
    public function startTenant(Tenant $tenant): array
    {
        $environment = config('app.env');
        
        Log::info("Starting tenant services", [
            'tenant' => $tenant->slug,
            'environment' => $environment,
        ]);

        // Produzione/Staging: usa Supervisor
        if (in_array($environment, ['production', 'staging'])) {
            return $this->startTenantWithSupervisor($tenant);
        }

        // Dev locale: usa script
        return $this->startTenantWithScript($tenant);
    }

    /**
     * Avvia tenant usando script locale
     */
    protected function startTenantWithScript(Tenant $tenant): array
    {
        $script = $tenant->local_start_script;

        if (!$script || !file_exists($script)) {
            Log::warning("Start script not found for tenant", ['tenant' => $tenant->slug, 'script' => $script]);
            return [
                'success' => false,
                'message' => "Script di avvio non trovato per {$tenant->name}. Configura local_start_script nel database.",
            ];
        }

        try {
            // Esegui lo script in background
            $logFile = "/tmp/tenant_start_{$tenant->slug}.log";
            exec("bash {$script} > {$logFile} 2>&1 &", $output, $returnCode);

            Log::info("Started tenant services via script", ['tenant' => $tenant->slug, 'script' => $script]);
            
            TenantActivity::create([
                'tenant_id' => $tenant->id,
                'type' => 'config',
                'action' => 'service_start',
                'status' => 'success',
                'description' => "Servizi avviati via script: {$script}",
            ]);

            return [
                'success' => true,
                'message' => "Avvio servizi {$tenant->name} in corso...",
                'method' => 'script',
            ];

        } catch (\Exception $e) {
            Log::error("Failed to start tenant via script", ['tenant' => $tenant->slug, 'error' => $e->getMessage()]);
            return [
                'success' => false,
                'message' => "Errore avvio: {$e->getMessage()}",
            ];
        }
    }

    /**
     * Avvia tenant usando Supervisor (produzione/staging su Forge)
     */
    protected function startTenantWithSupervisor(Tenant $tenant): array
    {
        $program = $tenant->supervisor_program;

        if (!$program) {
            Log::warning("Supervisor program not configured for tenant", ['tenant' => $tenant->slug]);
            return [
                'success' => false,
                'message' => "Programma Supervisor non configurato per {$tenant->name}. Configura supervisor_program nel database.",
            ];
        }

        try {
            // Esegui supervisorctl
            $output = [];
            $returnCode = 0;
            exec("sudo supervisorctl start {$program}:* 2>&1", $output, $returnCode);

            $outputStr = implode("\n", $output);
            $success = $returnCode === 0 || str_contains($outputStr, 'ALREADY_STARTED');

            Log::info("Started tenant services via Supervisor", [
                'tenant' => $tenant->slug, 
                'program' => $program,
                'output' => $outputStr,
                'return_code' => $returnCode,
            ]);
            
            TenantActivity::create([
                'tenant_id' => $tenant->id,
                'type' => 'config',
                'action' => 'service_start',
                'status' => $success ? 'success' : 'error',
                'description' => "Servizi avviati via Supervisor: {$program}",
                'metadata' => ['output' => $outputStr],
            ]);

            return [
                'success' => $success,
                'message' => $success 
                    ? "Servizi {$tenant->name} avviati"
                    : "Errore Supervisor: {$outputStr}",
                'method' => 'supervisor',
            ];

        } catch (\Exception $e) {
            Log::error("Failed to start tenant via Supervisor", ['tenant' => $tenant->slug, 'error' => $e->getMessage()]);
            return [
                'success' => false,
                'message' => "Errore Supervisor: {$e->getMessage()}",
            ];
        }
    }

    /**
     * Ferma i servizi di un tenant
     * Usa script locale in dev, Supervisor in produzione
     */
    public function stopTenant(Tenant $tenant): array
    {
        $environment = config('app.env');
        
        Log::info("Stopping tenant services", [
            'tenant' => $tenant->slug,
            'environment' => $environment,
        ]);

        // Produzione/Staging: usa Supervisor
        if (in_array($environment, ['production', 'staging'])) {
            return $this->stopTenantWithSupervisor($tenant);
        }

        // Dev locale: usa script
        return $this->stopTenantWithScript($tenant);
    }

    /**
     * Ferma tenant usando script locale
     */
    protected function stopTenantWithScript(Tenant $tenant): array
    {
        $script = $tenant->local_stop_script;

        if (!$script || !file_exists($script)) {
            Log::warning("Stop script not found for tenant", ['tenant' => $tenant->slug, 'script' => $script]);
            return [
                'success' => false,
                'message' => "Script di arresto non trovato per {$tenant->name}. Configura local_stop_script nel database.",
            ];
        }

        try {
            // Esegui lo script
            $logFile = "/tmp/tenant_stop_{$tenant->slug}.log";
            exec("bash {$script} > {$logFile} 2>&1", $output, $returnCode);

            Log::info("Stopped tenant services via script", ['tenant' => $tenant->slug, 'script' => $script]);
            
            $tenant->updateHealthStatus(false);
            
            TenantActivity::create([
                'tenant_id' => $tenant->id,
                'type' => 'config',
                'action' => 'service_stop',
                'status' => 'success',
                'description' => "Servizi fermati via script: {$script}",
            ]);

            return [
                'success' => true,
                'message' => "Servizi {$tenant->name} fermati",
                'method' => 'script',
            ];

        } catch (\Exception $e) {
            Log::error("Failed to stop tenant via script", ['tenant' => $tenant->slug, 'error' => $e->getMessage()]);
            return [
                'success' => false,
                'message' => "Errore arresto: {$e->getMessage()}",
            ];
        }
    }

    /**
     * Ferma tenant usando Supervisor (produzione/staging su Forge)
     */
    protected function stopTenantWithSupervisor(Tenant $tenant): array
    {
        $program = $tenant->supervisor_program;

        if (!$program) {
            Log::warning("Supervisor program not configured for tenant", ['tenant' => $tenant->slug]);
            return [
                'success' => false,
                'message' => "Programma Supervisor non configurato per {$tenant->name}. Configura supervisor_program nel database.",
            ];
        }

        try {
            // Esegui supervisorctl
            $output = [];
            $returnCode = 0;
            exec("sudo supervisorctl stop {$program}:* 2>&1", $output, $returnCode);

            $outputStr = implode("\n", $output);
            $success = $returnCode === 0 || str_contains($outputStr, 'NOT_RUNNING');

            Log::info("Stopped tenant services via Supervisor", [
                'tenant' => $tenant->slug, 
                'program' => $program,
                'output' => $outputStr,
                'return_code' => $returnCode,
            ]);
            
            $tenant->updateHealthStatus(false);
            
            TenantActivity::create([
                'tenant_id' => $tenant->id,
                'type' => 'config',
                'action' => 'service_stop',
                'status' => $success ? 'success' : 'error',
                'description' => "Servizi fermati via Supervisor: {$program}",
                'metadata' => ['output' => $outputStr],
            ]);

            return [
                'success' => $success,
                'message' => $success 
                    ? "Servizi {$tenant->name} fermati"
                    : "Errore Supervisor: {$outputStr}",
                'method' => 'supervisor',
            ];

        } catch (\Exception $e) {
            Log::error("Failed to stop tenant via Supervisor", ['tenant' => $tenant->slug, 'error' => $e->getMessage()]);
            return [
                'success' => false,
                'message' => "Errore Supervisor: {$e->getMessage()}",
            ];
        }
    }
}
