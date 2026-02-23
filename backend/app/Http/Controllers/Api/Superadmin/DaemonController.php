<?php

namespace App\Http\Controllers\Api\Superadmin;

use App\Http\Controllers\Controller;
use App\Models\DaemonProcess;
use App\Services\DaemonService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Log;

/**
 * DaemonController
 *
 * Gestione completa dei daemon supervisor tramite EGI-HUB.
 * Sostituisce la funzionalità "Background Processes" di Laravel Forge.
 */
class DaemonController extends Controller
{
    public function __construct(
        protected DaemonService $daemonService,
    ) {}

    /**
     * GET /api/superadmin/daemons
     * Lista tutti i daemon con status aggiornato da supervisor.
     */
    public function index(): JsonResponse
    {
        try {
            $this->daemonService->refreshAllStatuses();

            $daemons = DaemonProcess::with('project:id,name,slug')
                ->orderBy('name')
                ->get();

            return response()->json([
                'success' => true,
                'data'    => $daemons,
                'stats'   => [
                    'total'   => $daemons->count(),
                    'running' => $daemons->where('status', DaemonProcess::STATUS_RUNNING)->count(),
                    'stopped' => $daemons->where('status', DaemonProcess::STATUS_STOPPED)->count(),
                    'error'   => $daemons->where('status', DaemonProcess::STATUS_ERROR)->count(),
                ],
            ]);
        } catch (\Exception $e) {
            Log::error('DaemonController@index failed', ['error' => $e->getMessage()]);
            return response()->json([
                'success' => false,
                'message' => 'Errore nel recupero dei daemon: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * GET /api/superadmin/daemons/stats
     */
    public function stats(): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data'    => [
                'total'   => DaemonProcess::count(),
                'running' => DaemonProcess::where('status', DaemonProcess::STATUS_RUNNING)->count(),
                'stopped' => DaemonProcess::where('status', DaemonProcess::STATUS_STOPPED)->count(),
                'error'   => DaemonProcess::where('status', DaemonProcess::STATUS_ERROR)->count(),
            ],
        ]);
    }

    /**
     * GET /api/superadmin/daemons/{daemon}
     */
    public function show(DaemonProcess $daemon): JsonResponse
    {
        $daemon->load('project:id,name,slug');

        return response()->json([
            'success' => true,
            'data'    => $daemon,
        ]);
    }

    /**
     * POST /api/superadmin/daemons
     * Crea un nuovo daemon, scrive il file .conf e opzionalmente lo avvia.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name'             => 'required|string|max:255',
            'command'          => 'required|string|max:1000',
            'directory'        => 'nullable|string|max:500',
            'user'             => 'nullable|string|max:100',
            'numprocs'         => 'nullable|integer|min:1|max:20',
            'autostart'        => 'nullable|boolean',
            'autorestart'      => 'nullable|boolean',
            'startsecs'        => 'nullable|integer|min:0|max:600',
            'startretries'     => 'nullable|integer|min:0|max:100',
            'stopwaitsecs'     => 'nullable|integer|min:0|max:3600',
            'stopsignal'       => 'nullable|in:TERM,HUP,INT,QUIT,KILL',
            'stdout_logfile'   => 'nullable|string|max:500',
            'stderr_logfile'   => 'nullable|string|max:500',
            'project_id'       => 'nullable|exists:system_projects,id',
            'environment'      => 'nullable|string|max:2000',
            'auto_start_now'   => 'nullable|boolean',
        ]);

        try {
            $slug = Str::slug($validated['name']);

            // Verifica unicità
            if (DaemonProcess::where('slug', $slug)->exists()) {
                return response()->json([
                    'success' => false,
                    'message' => "Un daemon con slug '{$slug}' esiste già.",
                ], 422);
            }

            $daemon = DaemonProcess::create(array_merge($validated, [
                'slug'               => $slug,
                'supervisor_program' => $slug,
            ]));

            // Scrivi il file .conf di supervisor
            $configResult = $this->daemonService->writeConfig($daemon);

            if (!$configResult['success']) {
                return response()->json([
                    'success' => false,
                    'message' => "Daemon creato ma errore nella configurazione supervisor: {$configResult['message']}",
                    'data'    => $daemon,
                ], 500);
            }

            // Avvia se richiesto
            if ($request->boolean('auto_start_now', false)) {
                $this->daemonService->start($daemon);
                $daemon->refresh();
            }

            return response()->json([
                'success' => true,
                'message' => "Daemon {$daemon->name} creato con successo",
                'data'    => $daemon,
            ], 201);
        } catch (\Exception $e) {
            Log::error('DaemonController@store failed', ['error' => $e->getMessage()]);
            return response()->json([
                'success' => false,
                'message' => 'Errore creazione daemon: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * PUT /api/superadmin/daemons/{daemon}
     * Aggiorna configurazione di un daemon e riscrive il file .conf.
     */
    public function update(Request $request, DaemonProcess $daemon): JsonResponse
    {
        $validated = $request->validate([
            'name'             => 'sometimes|string|max:255',
            'command'          => 'sometimes|string|max:1000',
            'directory'        => 'nullable|string|max:500',
            'user'             => 'nullable|string|max:100',
            'numprocs'         => 'nullable|integer|min:1|max:20',
            'autostart'        => 'nullable|boolean',
            'autorestart'      => 'nullable|boolean',
            'startsecs'        => 'nullable|integer|min:0|max:600',
            'startretries'     => 'nullable|integer|min:0|max:100',
            'stopwaitsecs'     => 'nullable|integer|min:0|max:3600',
            'stopsignal'       => 'nullable|in:TERM,HUP,INT,QUIT,KILL',
            'stdout_logfile'   => 'nullable|string|max:500',
            'stderr_logfile'   => 'nullable|string|max:500',
            'project_id'       => 'nullable|exists:system_projects,id',
            'environment'      => 'nullable|string|max:2000',
        ]);

        try {
            $daemon->update($validated);

            // Riscrive il file .conf
            $configResult = $this->daemonService->writeConfig($daemon);

            // Restart per applicare la nuova config
            if ($daemon->isRunning()) {
                $this->daemonService->restart($daemon);
                $daemon->refresh();
            }

            return response()->json([
                'success' => true,
                'message' => "Daemon {$daemon->name} aggiornato" . ($configResult['success'] ? '' : ' (warning: config non applicata)'),
                'data'    => $daemon,
            ]);
        } catch (\Exception $e) {
            Log::error('DaemonController@update failed', ['error' => $e->getMessage()]);
            return response()->json([
                'success' => false,
                'message' => 'Errore aggiornamento daemon: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * DELETE /api/superadmin/daemons/{daemon}
     * Ferma il daemon, rimuove il file .conf, soft-delete del record.
     */
    public function destroy(DaemonProcess $daemon): JsonResponse
    {
        try {
            $this->daemonService->removeConfig($daemon);
            $daemon->delete();

            return response()->json([
                'success' => true,
                'message' => "Daemon {$daemon->name} eliminato",
            ]);
        } catch (\Exception $e) {
            Log::error('DaemonController@destroy failed', ['error' => $e->getMessage()]);
            return response()->json([
                'success' => false,
                'message' => 'Errore eliminazione daemon: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * POST /api/superadmin/daemons/{daemon}/start
     */
    public function start(DaemonProcess $daemon): JsonResponse
    {
        $result = $this->daemonService->start($daemon);
        return response()->json($result, $result['success'] ? 200 : 500);
    }

    /**
     * POST /api/superadmin/daemons/{daemon}/stop
     */
    public function stop(DaemonProcess $daemon): JsonResponse
    {
        $result = $this->daemonService->stop($daemon);
        return response()->json($result, $result['success'] ? 200 : 500);
    }

    /**
     * POST /api/superadmin/daemons/{daemon}/restart
     */
    public function restart(DaemonProcess $daemon): JsonResponse
    {
        $result = $this->daemonService->restart($daemon);
        return response()->json($result, $result['success'] ? 200 : 500);
    }

    /**
     * GET /api/superadmin/daemons/{daemon}/logs?type=stdout|stderr&lines=100
     */
    public function logs(Request $request, DaemonProcess $daemon): JsonResponse
    {
        $type = $request->query('type', 'stdout');
        $lines = min((int)$request->query('lines', 100), 1000);

        if (!in_array($type, ['stdout', 'stderr'])) {
            $type = 'stdout';
        }

        $result = $this->daemonService->readLog($daemon, $type, $lines);

        return response()->json([
            'success' => $result['success'],
            'data'    => $result,
        ], $result['success'] ? 200 : 404);
    }
}
