import { useState, useEffect, useCallback } from 'react';
import {
  Server,
  Plus,
  RefreshCw,
  Play,
  Square,
  RotateCcw,
  MoreVertical,
  FileText,
  Pencil,
  Trash2,
  X,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Terminal,
} from 'lucide-react';
import {
  getDaemons,
  createDaemon,
  updateDaemon,
  deleteDaemon,
  startDaemon,
  stopDaemon,
  restartDaemon,
  getDaemonLogs,
} from '@/services/daemonApi';
import type {
  DaemonProcess,
  DaemonStats,
  CreateDaemonData,
  DaemonLogData,
} from '@/types/daemon';

const emptyForm: CreateDaemonData = {
  name: '',
  command: '',
  directory: '',
  user: 'forge',
  numprocs: 1,
  autostart: true,
  autorestart: true,
  startsecs: 1,
  startretries: 3,
  stopwaitsecs: 10,
  stopsignal: 'TERM',
  stdout_logfile: '',
  stderr_logfile: '',
  project_id: null,
  environment: '',
  auto_start_now: false,
};

export default function SystemDaemons() {
  const [daemons, setDaemons] = useState<DaemonProcess[]>([]);
  const [stats, setStats] = useState<DaemonStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  // Form modal
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingDaemon, setEditingDaemon] = useState<DaemonProcess | null>(null);
  const [formData, setFormData] = useState<CreateDaemonData>(emptyForm);
  const [formSaving, setFormSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Log modal
  const [showLogModal, setShowLogModal] = useState(false);
  const [logDaemon, setLogDaemon] = useState<DaemonProcess | null>(null);
  const [logData, setLogData] = useState<DaemonLogData | null>(null);
  const [logType, setLogType] = useState<'stdout' | 'stderr'>('stdout');
  const [logLoading, setLogLoading] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setError(null);
      const result = await getDaemons();
      setDaemons(result.daemons);
      setStats(result.stats);
    } catch (err) {
      console.error('Error fetching daemons:', err);
      setError('Errore nel caricamento dei daemon');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  // ---- Actions ----

  const handleStart = async (daemon: DaemonProcess) => {
    setActionLoading(daemon.id);
    try {
      const result = await startDaemon(daemon.id);
      if (!result.success) {
        alert(`Errore: ${result.message}`);
      }
      await fetchData();
    } catch {
      alert('Errore avvio daemon');
    } finally {
      setActionLoading(null);
    }
  };

  const handleStop = async (daemon: DaemonProcess) => {
    if (!confirm(`Fermare "${daemon.name}"?`)) return;
    setActionLoading(daemon.id);
    try {
      const result = await stopDaemon(daemon.id);
      if (!result.success) {
        alert(`Errore: ${result.message}`);
      }
      await fetchData();
    } catch {
      alert('Errore arresto daemon');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRestart = async (daemon: DaemonProcess) => {
    setActionLoading(daemon.id);
    try {
      const result = await restartDaemon(daemon.id);
      if (!result.success) {
        alert(`Errore: ${result.message}`);
      }
      await fetchData();
    } catch {
      alert('Errore restart daemon');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (daemon: DaemonProcess) => {
    if (!confirm(`Eliminare "${daemon.name}"? Il processo verrà fermato e la configurazione rimossa.`)) return;
    setActionLoading(daemon.id);
    try {
      await deleteDaemon(daemon.id);
      await fetchData();
    } catch {
      alert('Errore eliminazione daemon');
    } finally {
      setActionLoading(null);
    }
  };

  // ---- Form Modal ----

  const openCreateModal = () => {
    setEditingDaemon(null);
    setFormData(emptyForm);
    setFormError(null);
    setShowFormModal(true);
  };

  const openEditModal = (daemon: DaemonProcess) => {
    setEditingDaemon(daemon);
    setFormData({
      name: daemon.name,
      command: daemon.command,
      directory: daemon.directory || '',
      user: daemon.user,
      numprocs: daemon.numprocs,
      autostart: daemon.autostart,
      autorestart: daemon.autorestart,
      startsecs: daemon.startsecs,
      startretries: daemon.startretries,
      stopwaitsecs: daemon.stopwaitsecs,
      stopsignal: daemon.stopsignal,
      stdout_logfile: daemon.stdout_logfile || '',
      stderr_logfile: daemon.stderr_logfile || '',
      project_id: daemon.project_id,
      environment: daemon.environment || '',
    });
    setFormError(null);
    setShowFormModal(true);
  };

  const handleFormSubmit = async () => {
    if (!formData.name.trim() || !formData.command.trim()) {
      setFormError('Nome e comando sono obbligatori');
      return;
    }
    setFormSaving(true);
    setFormError(null);
    try {
      if (editingDaemon) {
        await updateDaemon(editingDaemon.id, formData);
      } else {
        await createDaemon(formData);
      }
      setShowFormModal(false);
      await fetchData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Errore salvataggio';
      setFormError(msg);
    } finally {
      setFormSaving(false);
    }
  };

  // ---- Log Modal ----

  const openLogModal = async (daemon: DaemonProcess, type: 'stdout' | 'stderr' = 'stdout') => {
    setLogDaemon(daemon);
    setLogType(type);
    setShowLogModal(true);
    setLogLoading(true);
    setLogData(null);
    try {
      const data = await getDaemonLogs(daemon.id, type);
      setLogData(data);
    } catch {
      setLogData({ success: false, content: '', file: '', lines: 0, error: 'Errore lettura log' });
    } finally {
      setLogLoading(false);
    }
  };

  const refreshLogs = async () => {
    if (!logDaemon) return;
    setLogLoading(true);
    try {
      const data = await getDaemonLogs(logDaemon.id, logType);
      setLogData(data);
    } catch {
      setLogData({ success: false, content: '', file: '', lines: 0, error: 'Errore lettura log' });
    } finally {
      setLogLoading(false);
    }
  };

  const switchLogType = (type: 'stdout' | 'stderr') => {
    setLogType(type);
    if (logDaemon) {
      openLogModal(logDaemon, type);
    }
  };

  // ---- Helpers ----

  const getStatusBadge = (status: DaemonProcess['status']) => {
    switch (status) {
      case 'running':
        return <span className="badge badge-success gap-1"><CheckCircle className="w-3 h-3" />Running</span>;
      case 'stopped':
        return <span className="badge badge-warning gap-1"><Square className="w-3 h-3" />Stopped</span>;
      case 'starting':
        return <span className="badge badge-info gap-1"><Clock className="w-3 h-3" />Starting</span>;
      case 'error':
        return <span className="badge badge-error gap-1"><XCircle className="w-3 h-3" />Error</span>;
      default:
        return <span className="badge badge-ghost gap-1"><Clock className="w-3 h-3" />Unknown</span>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <span className="loading loading-spinner loading-lg text-primary"></span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3">
            <Server className="w-8 h-8 text-primary" />
            Gestione Daemon
          </h1>
          <p className="text-base-content/60 mt-1">
            Processi supervisor in esecuzione sul server di produzione
          </p>
        </div>
        <div className="flex gap-2">
          <button
            className="btn btn-ghost gap-2"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            Aggiorna
          </button>
          <button className="btn btn-primary gap-2" onClick={openCreateModal}>
            <Plus className="w-5 h-5" />
            Nuovo Daemon
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="alert alert-error">
          <AlertTriangle className="w-5 h-5" />
          <span>{error}</span>
        </div>
      )}

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="stat bg-base-100 rounded-box shadow-sm">
            <div className="stat-title">Totale</div>
            <div className="stat-value text-primary">{stats.total}</div>
          </div>
          <div className="stat bg-base-100 rounded-box shadow-sm">
            <div className="stat-title">Running</div>
            <div className="stat-value text-success">{stats.running}</div>
          </div>
          <div className="stat bg-base-100 rounded-box shadow-sm">
            <div className="stat-title">Stopped</div>
            <div className="stat-value text-warning">{stats.stopped}</div>
          </div>
          <div className="stat bg-base-100 rounded-box shadow-sm">
            <div className="stat-title">Errore</div>
            <div className="stat-value text-error">{stats.error}</div>
          </div>
        </div>
      )}

      {/* Daemons Table */}
      <div className="card bg-base-100 shadow-sm">
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Daemon</th>
                <th>Comando</th>
                <th>Stato</th>
                <th>Progetto</th>
                <th>Azioni</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {daemons.map((daemon) => (
                <tr key={daemon.id} className="hover">
                  <td>
                    <div className="flex items-center gap-3">
                      <div className={`rounded-lg w-10 h-10 flex items-center justify-center ${
                        daemon.status === 'running' ? 'bg-success/10 text-success' :
                        daemon.status === 'error' ? 'bg-error/10 text-error' :
                        'bg-base-200 text-base-content/40'
                      }`}>
                        <Terminal className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="font-bold">{daemon.name}</div>
                        <div className="text-sm text-base-content/60 font-mono">{daemon.supervisor_program}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <code className="text-xs bg-base-200 px-2 py-1 rounded max-w-xs truncate block">
                      {daemon.command}
                    </code>
                  </td>
                  <td>{getStatusBadge(daemon.status)}</td>
                  <td>
                    {daemon.project ? (
                      <span className="badge badge-outline badge-sm">{daemon.project.name}</span>
                    ) : (
                      <span className="text-base-content/40 text-sm">-</span>
                    )}
                  </td>
                  <td>
                    <div className="flex gap-1">
                      <button
                        className="btn btn-ghost btn-xs btn-square"
                        onClick={() => handleStart(daemon)}
                        disabled={actionLoading === daemon.id || daemon.status === 'running'}
                        title="Avvia"
                      >
                        {actionLoading === daemon.id ? (
                          <span className="loading loading-spinner loading-xs"></span>
                        ) : (
                          <Play className="w-4 h-4 text-success" />
                        )}
                      </button>
                      <button
                        className="btn btn-ghost btn-xs btn-square"
                        onClick={() => handleStop(daemon)}
                        disabled={actionLoading === daemon.id || daemon.status === 'stopped'}
                        title="Ferma"
                      >
                        <Square className="w-4 h-4 text-error" />
                      </button>
                      <button
                        className="btn btn-ghost btn-xs btn-square"
                        onClick={() => handleRestart(daemon)}
                        disabled={actionLoading === daemon.id}
                        title="Restart"
                      >
                        <RotateCcw className="w-4 h-4 text-info" />
                      </button>
                    </div>
                  </td>
                  <td>
                    <div className="dropdown dropdown-end">
                      <label tabIndex={0} className="btn btn-ghost btn-sm btn-square">
                        <MoreVertical className="w-4 h-4" />
                      </label>
                      <ul tabIndex={0} className="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-52">
                        <li>
                          <a onClick={() => openEditModal(daemon)}>
                            <Pencil className="w-4 h-4" />
                            Modifica
                          </a>
                        </li>
                        <li>
                          <a onClick={() => openLogModal(daemon, 'stdout')}>
                            <FileText className="w-4 h-4" />
                            Visualizza Log
                          </a>
                        </li>
                        <li className="text-error">
                          <a onClick={() => handleDelete(daemon)}>
                            <Trash2 className="w-4 h-4" />
                            Elimina
                          </a>
                        </li>
                      </ul>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {daemons.length === 0 && (
          <div className="text-center py-12">
            <Server className="w-12 h-12 mx-auto text-base-content/20" />
            <p className="mt-4 text-base-content/60">Nessun daemon configurato</p>
            <button className="btn btn-primary btn-sm mt-4 gap-2" onClick={openCreateModal}>
              <Plus className="w-4 h-4" />
              Aggiungi il primo daemon
            </button>
          </div>
        )}
      </div>

      {/* ====== CREATE / EDIT MODAL ====== */}
      {showFormModal && (
        <dialog className="modal modal-open">
          <div className="modal-box max-w-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg">
                {editingDaemon ? `Modifica: ${editingDaemon.name}` : 'Nuovo Daemon'}
              </h3>
              <button className="btn btn-ghost btn-sm btn-square" onClick={() => setShowFormModal(false)}>
                <X className="w-4 h-4" />
              </button>
            </div>

            {formError && (
              <div className="alert alert-error mb-4">
                <AlertTriangle className="w-4 h-4" />
                <span>{formError}</span>
              </div>
            )}

            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
              {/* Name + Command */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="form-control">
                  <label className="label"><span className="label-text font-medium">Nome *</span></label>
                  <input
                    type="text"
                    className="input input-bordered"
                    placeholder="es. blockchain-minting-worker"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                <div className="form-control">
                  <label className="label"><span className="label-text font-medium">User</span></label>
                  <input
                    type="text"
                    className="input input-bordered"
                    value={formData.user || 'forge'}
                    onChange={(e) => setFormData(prev => ({ ...prev, user: e.target.value }))}
                  />
                </div>
              </div>

              <div className="form-control">
                <label className="label"><span className="label-text font-medium">Comando *</span></label>
                <input
                  type="text"
                  className="input input-bordered font-mono text-sm"
                  placeholder="es. php artisan queue:work --queue=blockchain"
                  value={formData.command}
                  onChange={(e) => setFormData(prev => ({ ...prev, command: e.target.value }))}
                />
              </div>

              <div className="form-control">
                <label className="label"><span className="label-text font-medium">Directory</span></label>
                <input
                  type="text"
                  className="input input-bordered font-mono text-sm"
                  placeholder="es. /home/forge/art.florenceegi.com"
                  value={formData.directory || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, directory: e.target.value }))}
                />
              </div>

              <div className="form-control">
                <label className="label"><span className="label-text font-medium">Environment</span></label>
                <input
                  type="text"
                  className="input input-bordered font-mono text-sm"
                  placeholder='es. APP_ENV="production",LOG_CHANNEL="stderr"'
                  value={formData.environment || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, environment: e.target.value }))}
                />
              </div>

              {/* Supervisor settings */}
              <div className="divider text-sm text-base-content/40">Configurazione Supervisor</div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="form-control">
                  <label className="label"><span className="label-text text-sm">Num Procs</span></label>
                  <input
                    type="number"
                    className="input input-bordered input-sm"
                    min={1}
                    value={formData.numprocs || 1}
                    onChange={(e) => setFormData(prev => ({ ...prev, numprocs: parseInt(e.target.value) || 1 }))}
                  />
                </div>
                <div className="form-control">
                  <label className="label"><span className="label-text text-sm">Start Secs</span></label>
                  <input
                    type="number"
                    className="input input-bordered input-sm"
                    min={0}
                    value={formData.startsecs || 1}
                    onChange={(e) => setFormData(prev => ({ ...prev, startsecs: parseInt(e.target.value) || 1 }))}
                  />
                </div>
                <div className="form-control">
                  <label className="label"><span className="label-text text-sm">Start Retries</span></label>
                  <input
                    type="number"
                    className="input input-bordered input-sm"
                    min={0}
                    value={formData.startretries || 3}
                    onChange={(e) => setFormData(prev => ({ ...prev, startretries: parseInt(e.target.value) || 3 }))}
                  />
                </div>
                <div className="form-control">
                  <label className="label"><span className="label-text text-sm">Stop Wait Secs</span></label>
                  <input
                    type="number"
                    className="input input-bordered input-sm"
                    min={1}
                    value={formData.stopwaitsecs || 10}
                    onChange={(e) => setFormData(prev => ({ ...prev, stopwaitsecs: parseInt(e.target.value) || 10 }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="form-control">
                  <label className="label"><span className="label-text text-sm">Stop Signal</span></label>
                  <select
                    className="select select-bordered select-sm"
                    value={formData.stopsignal || 'TERM'}
                    onChange={(e) => setFormData(prev => ({ ...prev, stopsignal: e.target.value }))}
                  >
                    <option value="TERM">TERM</option>
                    <option value="HUP">HUP</option>
                    <option value="INT">INT</option>
                    <option value="QUIT">QUIT</option>
                    <option value="KILL">KILL</option>
                    <option value="USR1">USR1</option>
                    <option value="USR2">USR2</option>
                  </select>
                </div>
                <div className="form-control justify-end">
                  <label className="label cursor-pointer justify-start gap-3">
                    <input
                      type="checkbox"
                      className="toggle toggle-success toggle-sm"
                      checked={formData.autostart ?? true}
                      onChange={(e) => setFormData(prev => ({ ...prev, autostart: e.target.checked }))}
                    />
                    <span className="label-text text-sm">Autostart</span>
                  </label>
                  <label className="label cursor-pointer justify-start gap-3">
                    <input
                      type="checkbox"
                      className="toggle toggle-success toggle-sm"
                      checked={formData.autorestart ?? true}
                      onChange={(e) => setFormData(prev => ({ ...prev, autorestart: e.target.checked }))}
                    />
                    <span className="label-text text-sm">Autorestart</span>
                  </label>
                </div>
              </div>

              {/* Log paths */}
              <div className="divider text-sm text-base-content/40">Log Files</div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="form-control">
                  <label className="label"><span className="label-text text-sm">Stdout Log</span></label>
                  <input
                    type="text"
                    className="input input-bordered input-sm font-mono text-xs"
                    placeholder="Auto-generato se vuoto"
                    value={formData.stdout_logfile || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, stdout_logfile: e.target.value }))}
                  />
                </div>
                <div className="form-control">
                  <label className="label"><span className="label-text text-sm">Stderr Log</span></label>
                  <input
                    type="text"
                    className="input input-bordered input-sm font-mono text-xs"
                    placeholder="Auto-generato se vuoto"
                    value={formData.stderr_logfile || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, stderr_logfile: e.target.value }))}
                  />
                </div>
              </div>

              {/* Auto start now (only for create) */}
              {!editingDaemon && (
                <label className="label cursor-pointer justify-start gap-3 mt-2">
                  <input
                    type="checkbox"
                    className="checkbox checkbox-primary checkbox-sm"
                    checked={formData.auto_start_now ?? false}
                    onChange={(e) => setFormData(prev => ({ ...prev, auto_start_now: e.target.checked }))}
                  />
                  <span className="label-text">Avvia subito dopo la creazione</span>
                </label>
              )}
            </div>

            <div className="modal-action">
              <button className="btn btn-ghost" onClick={() => setShowFormModal(false)}>
                Annulla
              </button>
              <button className="btn btn-primary gap-2" onClick={handleFormSubmit} disabled={formSaving}>
                {formSaving ? (
                  <span className="loading loading-spinner loading-sm"></span>
                ) : editingDaemon ? (
                  'Salva Modifiche'
                ) : (
                  'Crea Daemon'
                )}
              </button>
            </div>
          </div>
          <form method="dialog" className="modal-backdrop">
            <button onClick={() => setShowFormModal(false)}>close</button>
          </form>
        </dialog>
      )}

      {/* ====== LOG MODAL ====== */}
      {showLogModal && logDaemon && (
        <dialog className="modal modal-open">
          <div className="modal-box max-w-4xl h-[80vh] flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Log: {logDaemon.name}
              </h3>
              <button className="btn btn-ghost btn-sm btn-square" onClick={() => setShowLogModal(false)}>
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Tab + Refresh */}
            <div className="flex items-center justify-between mb-3">
              <div className="tabs tabs-boxed">
                <a
                  className={`tab ${logType === 'stdout' ? 'tab-active' : ''}`}
                  onClick={() => switchLogType('stdout')}
                >
                  stdout
                </a>
                <a
                  className={`tab ${logType === 'stderr' ? 'tab-active' : ''}`}
                  onClick={() => switchLogType('stderr')}
                >
                  stderr
                </a>
              </div>
              <div className="flex items-center gap-2">
                {logData?.file && (
                  <span className="text-xs text-base-content/40 font-mono">{logData.file}</span>
                )}
                <button className="btn btn-ghost btn-sm gap-1" onClick={refreshLogs} disabled={logLoading}>
                  <RefreshCw className={`w-3 h-3 ${logLoading ? 'animate-spin' : ''}`} />
                  Refresh
                </button>
              </div>
            </div>

            {/* Log content */}
            <div className="flex-1 overflow-auto bg-base-300 rounded-lg p-4">
              {logLoading ? (
                <div className="flex items-center justify-center h-full">
                  <span className="loading loading-spinner loading-md"></span>
                </div>
              ) : logData?.error ? (
                <div className="text-error text-sm">{logData.error}</div>
              ) : logData?.content ? (
                <pre className="text-xs font-mono whitespace-pre-wrap break-all text-base-content/80">
                  {logData.content}
                </pre>
              ) : (
                <div className="text-base-content/40 text-sm text-center mt-8">
                  Nessun contenuto nel log
                </div>
              )}
            </div>
          </div>
          <form method="dialog" className="modal-backdrop">
            <button onClick={() => setShowLogModal(false)}>close</button>
          </form>
        </dialog>
      )}
    </div>
  );
}
