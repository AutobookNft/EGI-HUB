/**
 * Project Admin Dashboard
 *
 * Main dashboard for a Project Admin after entering a specific project.
 * Shows project stats, tenant management, quick actions, and remote deploy commands.
 * Commands are filtered based on the detected tech stack (artisan/composer/npm).
 */

import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Users,
  Settings,
  BarChart3,
  FileText,
  ShieldCheck,
  Server,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Terminal,
  GitPullRequest,
  Package,
  Package2,
  Hammer,
  Trash2,
  Settings2,
  Database,
  RefreshCcw,
  Rocket,
  Play,
  Layers,
} from 'lucide-react';
import { getProjects, checkProjectHealth, runRemoteCommand, detectProjectStack } from '../../services/projectApi';
import { useToast } from '../../contexts/ToastContext';
import type { Project } from '../../types/project';

interface DashboardCard {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
  link?: string;
}

interface ProjectStack {
  has_artisan: boolean;
  has_composer: boolean;
  has_npm: boolean;
}

type StackRequirement = 'artisan' | 'composer' | 'npm';

interface PredefinedCommand {
  key: string;
  label: string;
  icon: React.ReactNode;
  variant: string;
  /** Se vuoto, il comando è sempre visibile */
  requires: StackRequirement[];
}

const PREDEFINED_COMMANDS: PredefinedCommand[] = [
  { key: 'git_pull',         label: 'Git Pull',         icon: <GitPullRequest className="w-4 h-4" />, variant: 'btn-ghost',   requires: [] },
  { key: 'composer_install', label: 'Composer Install', icon: <Package className="w-4 h-4" />,        variant: 'btn-ghost',   requires: ['composer'] },
  { key: 'npm_install',      label: 'NPM Install',      icon: <Package2 className="w-4 h-4" />,       variant: 'btn-ghost',   requires: ['npm'] },
  { key: 'npm_build',        label: 'NPM Build',        icon: <Hammer className="w-4 h-4" />,         variant: 'btn-ghost',   requires: ['npm'] },
  { key: 'cache_clear',      label: 'Cache Clear',      icon: <Trash2 className="w-4 h-4" />,         variant: 'btn-ghost',   requires: ['artisan'] },
  { key: 'config_cache',     label: 'Config Cache',     icon: <Settings2 className="w-4 h-4" />,      variant: 'btn-ghost',   requires: ['artisan'] },
  { key: 'migrate',          label: 'DB Migrate',       icon: <Database className="w-4 h-4" />,       variant: 'btn-ghost',   requires: ['artisan'] },
  { key: 'queue_restart',    label: 'Queue Restart',    icon: <RefreshCcw className="w-4 h-4" />,     variant: 'btn-ghost',   requires: ['artisan'] },
  { key: 'deploy_full',      label: 'Deploy Completo',  icon: <Rocket className="w-4 h-4" />,         variant: 'btn-primary', requires: [] },
];

export default function ProjectDashboard() {
  const { slug } = useParams<{ slug: string }>();
  const { success: toastSuccess, error: toastError } = useToast();

  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [healthLoading, setHealthLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Stack detection
  const [stack, setStack] = useState<ProjectStack | null>(null);
  const [stackLoading, setStackLoading] = useState(false);

  // Deploy state
  const [cmdLoading, setCmdLoading] = useState(false);
  const [cmdOutput, setCmdOutput] = useState<string | null>(null);
  const [cmdSuccess, setCmdSuccess] = useState<boolean | null>(null);
  const [cmdLabel, setCmdLabel] = useState<string>('');
  const [customCommand, setCustomCommand] = useState('');

  useEffect(() => {
    if (slug) {
      loadProject();
    }
  }, [slug]);

  const loadProject = async () => {
    try {
      setLoading(true);
      const projects = await getProjects();
      const found = projects.find(p => p.slug === slug);

      if (found) {
        setProject(found);
        setError(null);

        // Usa stack da metadata se disponibile e recente (< 1h)
        const cachedStack = (found.metadata as Record<string, unknown>)?.stack as ProjectStack | undefined;
        const cachedAt = (found.metadata as Record<string, unknown>)?.stack_detected_at as string | undefined;
        const isFresh = cachedAt && (Date.now() - new Date(cachedAt).getTime()) < 3600_000;

        if (cachedStack && isFresh) {
          setStack(cachedStack);
        } else {
          // Rileva stack in background
          loadStack(found.id);
        }
      } else {
        setError('Progetto non trovato');
      }
    } catch (err) {
      setError('Impossibile caricare il progetto');
      console.error('Error loading project:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadStack = async (projectId: number) => {
    setStackLoading(true);
    try {
      const detected = await detectProjectStack(projectId);
      setStack(detected);
    } catch {
      // Se fallisce, mostriamo tutti i comandi (fallback permissivo)
      setStack({ has_artisan: true, has_composer: true, has_npm: true });
    } finally {
      setStackLoading(false);
    }
  };

  const refreshHealth = async () => {
    if (!project) return;
    try {
      setHealthLoading(true);
      const response = await checkProjectHealth(project.id);
      setProject(response.project);
    } catch (err) {
      console.error('Error checking health:', err);
    } finally {
      setHealthLoading(false);
    }
  };

  const handleCommand = async (commandKey?: string) => {
    if (!project) return;

    const label = commandKey
      ? (PREDEFINED_COMMANDS.find(c => c.key === commandKey)?.label ?? commandKey)
      : customCommand;

    setCmdLoading(true);
    setCmdOutput(null);
    setCmdSuccess(null);
    setCmdLabel(label);

    try {
      const payload = commandKey
        ? { command_key: commandKey }
        : { custom_command: customCommand };

      const result = await runRemoteCommand(project.id, payload);
      setCmdOutput(result.output ?? '(nessun output)');
      setCmdSuccess(result.success);

      if (result.success) {
        toastSuccess(`${label}: completato`);
      } else {
        toastError(`${label}: terminato con errore`);
      }
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { output?: string; message?: string } } };
      const serverMsg = axiosError.response?.data?.output
        ?? axiosError.response?.data?.message
        ?? 'Errore di connessione con il server.';
      setCmdOutput(serverMsg);
      setCmdSuccess(false);
      toastError(`Impossibile eseguire: ${label}`);
    } finally {
      setCmdLoading(false);
    }
  };

  /** Comandi visibili in base allo stack rilevato */
  const visibleCommands = PREDEFINED_COMMANDS.filter(cmd => {
    if (!cmd.requires.length) return true;
    if (!stack) return true; // mostra tutto mentre rileva
    return cmd.requires.every(req => stack[`has_${req}` as keyof ProjectStack]);
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <span className="loading loading-spinner loading-lg text-primary"></span>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="alert alert-error">
        <AlertCircle className="w-6 h-6" />
        <span>{error || 'Progetto non trovato'}</span>
        <Link to="/my-projects" className="btn btn-sm">
          Torna ai miei progetti
        </Link>
      </div>
    );
  }

  const dashboardCards: DashboardCard[] = [
    { title: 'Tenant Attivi',  value: '—', icon: <Users className="w-8 h-8" />,    color: 'text-primary',   link: `/projects/${slug}/tenants` },
    { title: 'Utenti Totali',  value: '—', icon: <Users className="w-8 h-8" />,    color: 'text-secondary', link: `/projects/${slug}/users` },
    { title: 'API Calls (24h)',value: '—', icon: <BarChart3 className="w-8 h-8" />, color: 'text-accent',   link: `/projects/${slug}/analytics` },
    { title: 'Logs',           value: 'Vedi', icon: <FileText className="w-8 h-8" />, color: 'text-info',   link: `/projects/${slug}/logs` },
  ];

  /** Badge stack rilevato */
  const stackBadges = stack ? (
    <div className="flex flex-wrap gap-1 mt-1">
      {stack.has_artisan  && <span className="badge badge-sm badge-outline">Laravel/Artisan</span>}
      {stack.has_composer && <span className="badge badge-sm badge-outline">Composer</span>}
      {stack.has_npm      && <span className="badge badge-sm badge-outline">Node/NPM</span>}
    </div>
  ) : null;

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm breadcrumbs">
        <Link to="/my-projects" className="link link-hover flex items-center gap-1">
          <ArrowLeft className="w-4 h-4" />
          I Miei Progetti
        </Link>
        <span>/</span>
        <span className="font-medium">{project.name}</span>
      </div>

      {/* Project Header */}
      <div className="card bg-base-100 shadow-lg">
        <div className="card-body">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-lg ${project.is_healthy ? 'bg-success/10' : 'bg-error/10'}`}>
                <Server className={`w-8 h-8 ${project.is_healthy ? 'text-success' : 'text-error'}`} />
              </div>
              <div>
                <h1 className="text-2xl font-bold">{project.name}</h1>
                <p className="text-base-content/60">{project.url}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className={`badge ${project.is_healthy ? 'badge-success' : 'badge-error'} gap-1 badge-lg`}>
                {project.is_healthy
                  ? <CheckCircle className="w-4 h-4" />
                  : <AlertCircle className="w-4 h-4" />}
                {project.is_healthy ? 'Online' : 'Offline'}
              </div>
              <button
                className={`btn btn-sm btn-ghost ${healthLoading ? 'loading' : ''}`}
                onClick={refreshHealth}
                disabled={healthLoading}
              >
                <RefreshCw className={`w-4 h-4 ${healthLoading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>
          </div>

          {project.description && (
            <p className="mt-4 text-base-content/70">{project.description}</p>
          )}
          {project.last_health_check && (
            <p className="text-xs text-base-content/50 mt-2">
              Ultimo controllo: {new Date(project.last_health_check).toLocaleString()}
            </p>
          )}
        </div>
      </div>

      {/* Quick Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {dashboardCards.map((card, index) => (
          <Link
            key={index}
            to={card.link || '#'}
            className="card bg-base-100 shadow hover:shadow-lg transition-shadow"
          >
            <div className="card-body">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-base-content/60 text-sm">{card.title}</p>
                  <p className="text-2xl font-bold mt-1">{card.value}</p>
                </div>
                <div className={card.color}>{card.icon}</div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card bg-base-100 shadow-lg">
          <div className="card-body">
            <h2 className="card-title"><Users className="w-5 h-5" />Gestione Tenant</h2>
            <p className="text-base-content/70">Gestisci i tenant (clienti) di questo progetto.</p>
            <div className="card-actions justify-end mt-4">
              <Link to={`/projects/${slug}/tenants`} className="btn btn-primary btn-sm">Vai ai Tenant</Link>
            </div>
          </div>
        </div>
        <div className="card bg-base-100 shadow-lg">
          <div className="card-body">
            <h2 className="card-title"><Settings className="w-5 h-5" />Configurazione</h2>
            <p className="text-base-content/70">Modifica le impostazioni e configurazioni del progetto.</p>
            <div className="card-actions justify-end mt-4">
              <Link to={`/projects/${slug}/settings`} className="btn btn-outline btn-sm">Impostazioni</Link>
            </div>
          </div>
        </div>
        <div className="card bg-base-100 shadow-lg">
          <div className="card-body">
            <h2 className="card-title"><ShieldCheck className="w-5 h-5" />Project Admins</h2>
            <p className="text-base-content/70">Gestisci chi ha accesso a questo progetto e con quali permessi.</p>
            <div className="card-actions justify-end mt-4">
              <Link to={`/projects/${slug}/admins`} className="btn btn-outline btn-sm">Gestisci Admins</Link>
            </div>
          </div>
        </div>
        <div className="card bg-base-100 shadow-lg">
          <div className="card-body">
            <h2 className="card-title"><BarChart3 className="w-5 h-5" />Analytics</h2>
            <p className="text-base-content/70">Visualizza statistiche e metriche del progetto.</p>
            <div className="card-actions justify-end mt-4">
              <Link to={`/projects/${slug}/analytics`} className="btn btn-outline btn-sm">Vedi Analytics</Link>
            </div>
          </div>
        </div>
      </div>

      {/* Deploy & Remote Commands */}
      <div className="card bg-base-100 shadow-lg">
        <div className="card-body">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h2 className="card-title">
                <Terminal className="w-5 h-5" />
                Deploy &amp; Comandi Remoti
              </h2>
              <p className="text-base-content/70 text-sm mt-1">
                Esegui comandi sull'EC2 nella directory del progetto.
              </p>
              {/* Stack badges */}
              {stackLoading && (
                <div className="flex items-center gap-2 mt-1 text-xs text-base-content/50">
                  <span className="loading loading-spinner loading-xs"></span>
                  Rilevamento stack…
                </div>
              )}
              {!stackLoading && stackBadges}
            </div>
            {/* Refresh stack button */}
            {stack && !stackLoading && (
              <button
                className="btn btn-ghost btn-xs gap-1"
                onClick={() => project && loadStack(project.id)}
                title="Ririleva stack"
              >
                <Layers className="w-3 h-3" />
                Ririleva stack
              </button>
            )}
          </div>

          {/* Predefined command buttons */}
          <div className="flex flex-wrap gap-2 mt-4">
            {visibleCommands.map(cmd => (
              <button
                key={cmd.key}
                className={`btn btn-sm gap-1 ${cmd.variant}`}
                onClick={() => handleCommand(cmd.key)}
                disabled={cmdLoading || stackLoading}
              >
                {cmdLoading && cmdLabel === cmd.label
                  ? <span className="loading loading-spinner loading-xs"></span>
                  : cmd.icon}
                {cmd.label}
              </button>
            ))}
          </div>

          {/* Custom command */}
          <div className="mt-4 space-y-2">
            <label className="label">
              <span className="label-text font-medium">Comando personalizzato</span>
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40 font-mono text-sm">$</span>
                <input
                  type="text"
                  className="input input-bordered w-full pl-7 font-mono text-sm"
                  placeholder="es. php artisan tinker"
                  value={customCommand}
                  onChange={e => setCustomCommand(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && customCommand.trim() && !cmdLoading) {
                      handleCommand();
                    }
                  }}
                  disabled={cmdLoading}
                />
              </div>
              <button
                className="btn btn-warning gap-1"
                onClick={() => handleCommand()}
                disabled={cmdLoading || !customCommand.trim()}
              >
                {cmdLoading && !PREDEFINED_COMMANDS.some(c => c.label === cmdLabel)
                  ? <span className="loading loading-spinner loading-xs"></span>
                  : <Play className="w-4 h-4" />}
                Esegui
              </button>
            </div>
          </div>

          {/* Loading indicator */}
          {cmdLoading && (
            <div className="mt-4 flex items-center gap-3 text-base-content/60 text-sm">
              <span className="loading loading-spinner loading-sm"></span>
              <span>Esecuzione in corso: <span className="font-mono">{cmdLabel}</span> …</span>
            </div>
          )}

          {/* Output box */}
          {!cmdLoading && cmdOutput !== null && (
            <div className="mt-4">
              <div className="flex items-center gap-2 mb-1">
                <span className={`badge badge-sm ${cmdSuccess ? 'badge-success' : 'badge-error'}`}>
                  {cmdSuccess ? 'Success' : 'Failed'}
                </span>
                <span className="text-sm text-base-content/60 font-mono">{cmdLabel}</span>
              </div>
              <pre className="font-mono text-sm bg-neutral text-neutral-content rounded-lg p-4 overflow-auto max-h-64 whitespace-pre-wrap">
                {cmdOutput || '(nessun output)'}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
