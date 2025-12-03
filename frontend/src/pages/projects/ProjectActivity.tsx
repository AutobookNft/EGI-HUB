import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { checkAllProjectsHealth, startProject, stopProject } from '@/services/projectApi';
import {
  AlertTriangle,
  CheckCircle,
  HelpCircle,
  Info,
  Loader2,
  Play,
  RefreshCw,
  Server,
  Square,
  WifiOff,
  XCircle,
  Zap,
  FolderKanban
} from 'lucide-react';

/**
 * ProjectActivity
 * 
 * Monitoraggio connessioni e attività dei Projects (applicazioni SaaS).
 * 
 * NOTE: In EGI-HUB, "Projects" sono le applicazioni SaaS (NATAN_LOC, EGI, etc.)
 * mentre "Tenants" sono i clienti finali di ogni progetto.
 */

interface ProjectHealthResult {
  project: {
    id: number;
    name: string;
    slug: string;
    url: string;
  };
  health: {
    healthy: boolean;
    status_code?: number;
    response_time_ms?: number;
    error?: string;
  };
}

export default function ProjectActivity() {
  const queryClient = useQueryClient();

  // ============================================
  // STATO LIVE DEI PROJECTS (polling ogni 30 sec)
  // ============================================
  const { 
    data: liveHealth, 
    isLoading: loadingHealth,
    isFetching: fetchingHealth,
    refetch: refetchHealth 
  } = useQuery({
    queryKey: ['projects-live-health'],
    queryFn: checkAllProjectsHealth,
    refetchInterval: 30000,
    staleTime: 10000,
  });

  // Mutation per forzare health check
  const healthCheckMutation = useMutation({
    mutationFn: checkAllProjectsHealth,
    onSuccess: (data) => {
      queryClient.setQueryData(['projects-live-health'], data);
    }
  });

  // Handler per Start project
  const handleStartProject = async (projectId: number, _projectName: string) => {
    try {
      const result = await startProject(projectId);
      if (result.success) {
        // Ricarica health check dopo 3 secondi per dare tempo al servizio di avviarsi
        setTimeout(() => {
          healthCheckMutation.mutate();
        }, 3000);
      } else {
        alert(result.message || 'Errore avvio progetto');
      }
    } catch (error) {
      console.error('Errore start project:', error);
      alert('Errore di connessione');
    }
  };

  // Handler per Stop project
  const handleStopProject = async (projectId: number, projectName: string) => {
    if (!confirm(`Sei sicuro di voler fermare ${projectName}?`)) return;
    try {
      const result = await stopProject(projectId);
      if (result.success) {
        // Ricarica health check dopo 2 secondi
        setTimeout(() => {
          healthCheckMutation.mutate();
        }, 2000);
      } else {
        alert(result.message || 'Errore arresto progetto');
      }
    } catch (error) {
      console.error('Errore stop project:', error);
      alert('Errore di connessione');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header con spiegazione */}
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-base-content flex items-center gap-2">
            <FolderKanban className="w-7 h-7 text-primary" />
            Monitoraggio Projects
          </h1>
          <p className="text-base-content/70 mt-1 max-w-2xl">
            Questa pagina mostra lo <strong>stato delle connessioni</strong> tra EGI-HUB 
            e i progetti SaaS registrati (NATAN_LOC, FlorenceArtEGI, etc.).
          </p>
        </div>
        <div className="flex gap-2">
          <button 
            className="btn btn-primary gap-2"
            onClick={() => healthCheckMutation.mutate()}
            disabled={healthCheckMutation.isPending}
          >
            {healthCheckMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Zap className="w-4 h-4" />
            )}
            Verifica Ora
          </button>
          <button 
            className="btn btn-ghost gap-2"
            onClick={() => refetchHealth()}
          >
            <RefreshCw className={`w-4 h-4 ${fetchingHealth ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Box informativo */}
      <div className="alert bg-base-200 border-l-4 border-primary">
        <HelpCircle className="w-6 h-6 text-primary shrink-0" />
        <div>
          <h3 className="font-bold">Cosa sono i Projects?</h3>
          <ul className="text-sm mt-1 space-y-1">
            <li>• <strong>Projects</strong>: Applicazioni SaaS gestite da EGI-HUB (es. NATAN_LOC, FlorenceArtEGI)</li>
            <li>• <strong>Health Check</strong>: Verifica periodica che il progetto sia raggiungibile</li>
            <li>• <strong>Start/Stop</strong>: Avvia o ferma i servizi del progetto</li>
          </ul>
        </div>
      </div>

      {/* ============================================ */}
      {/* STATO LIVE DEI PROJECTS */}
      {/* ============================================ */}
      <div className="bg-base-100 rounded-box shadow p-4 border-2 border-primary/20">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Server className="w-5 h-5 text-primary" />
            Stato Attuale Projects (LIVE)
          </h2>
          {fetchingHealth && (
            <span className="text-sm text-base-content/50 flex items-center gap-1">
              <Loader2 className="w-3 h-3 animate-spin" />
              Verifica in corso...
            </span>
          )}
        </div>

        {loadingHealth ? (
          <div className="flex justify-center py-8">
            <span className="loading loading-spinner loading-lg"></span>
          </div>
        ) : !liveHealth?.results || Object.keys(liveHealth.results).length === 0 ? (
          <div className="text-center py-8 text-base-content/60">
            <WifiOff className="w-12 h-12 mx-auto mb-2 opacity-30" />
            <p>Nessun progetto registrato</p>
            <p className="text-sm mt-2">Vai su "Nuovo Project" per registrare un'applicazione SaaS</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.values(liveHealth.results).map((result: ProjectHealthResult) => (
              <div 
                key={result.project.id}
                className={`p-4 rounded-lg border-2 ${
                  result.health.healthy 
                    ? 'border-success/30 bg-success/5' 
                    : 'border-error/30 bg-error/5'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold">{result.project.name}</h3>
                    <p className="text-xs text-base-content/50 truncate max-w-[180px]">
                      {result.project.url}
                    </p>
                  </div>
                  {result.health.healthy ? (
                    <CheckCircle className="w-6 h-6 text-success" />
                  ) : (
                    <XCircle className="w-6 h-6 text-error" />
                  )}
                </div>
                
                <div className="mt-3 space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-base-content/60">Stato:</span>
                    <span className={`font-bold ${result.health.healthy ? 'text-success' : 'text-error'}`}>
                      {result.health.healthy ? 'ONLINE' : 'OFFLINE'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-base-content/60">HTTP:</span>
                    <span className={`font-mono ${
                      (result.health.status_code || 0) >= 200 && (result.health.status_code || 0) < 400 
                        ? 'text-success' 
                        : 'text-error'
                    }`}>
                      {result.health.status_code || 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-base-content/60">Risposta:</span>
                    <span className="font-mono">
                      {result.health.response_time_ms ? `${Math.round(result.health.response_time_ms)}ms` : 'N/A'}
                    </span>
                  </div>
                  {result.health.error && (
                    <div className="mt-2 text-xs text-error bg-error/10 p-2 rounded">
                      {result.health.error}
                    </div>
                  )}
                </div>

                {/* Bottoni Start/Stop */}
                <div className="mt-4 pt-3 border-t border-base-300 flex gap-2">
                  <button 
                    className="btn btn-success btn-sm flex-1 gap-1"
                    onClick={() => handleStartProject(result.project.id, result.project.name)}
                    disabled={result.health.healthy}
                  >
                    <Play className="w-3 h-3" />
                    Start
                  </button>
                  <button 
                    className="btn btn-error btn-sm flex-1 gap-1"
                    onClick={() => handleStopProject(result.project.id, result.project.name)}
                    disabled={!result.health.healthy}
                  >
                    <Square className="w-3 h-3" />
                    Stop
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {liveHealth?.summary && (
          <div className="mt-4 pt-4 border-t border-base-200 flex items-center justify-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-success" />
              <span className="text-success font-bold">{liveHealth.summary.healthy} Online</span>
            </div>
            <div className="flex items-center gap-2">
              <XCircle className="w-4 h-4 text-error" />
              <span className="text-error font-bold">{liveHealth.summary.unhealthy} Offline</span>
            </div>
          </div>
        )}

        <div className="mt-3 text-xs text-center text-base-content/40">
          ⟳ Aggiornamento automatico ogni 30 secondi
        </div>
      </div>

      {/* Legenda Stati */}
      <div className="bg-base-100 rounded-box shadow p-4">
        <h3 className="font-semibold mb-3 flex items-center gap-2">
          <Info className="w-5 h-5" />
          Legenda Stati
        </h3>
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-success" />
            <span className="text-sm"><strong>Online</strong> - Progetto raggiungibile e funzionante</span>
          </div>
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-warning" />
            <span className="text-sm"><strong>Attenzione</strong> - Risponde ma con problemi</span>
          </div>
          <div className="flex items-center gap-2">
            <XCircle className="w-5 h-5 text-error" />
            <span className="text-sm"><strong>Offline</strong> - Non raggiungibile o non risponde</span>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="stat bg-base-100 rounded-box shadow">
          <div className="stat-figure text-primary">
            <FolderKanban className="w-8 h-8" />
          </div>
          <div className="stat-title">Projects Totali</div>
          <div className="stat-value text-primary">
            {liveHealth?.summary?.total || 0}
          </div>
          <div className="stat-desc">Applicazioni SaaS registrate</div>
        </div>

        <div className="stat bg-base-100 rounded-box shadow">
          <div className="stat-figure text-success">
            <CheckCircle className="w-8 h-8" />
          </div>
          <div className="stat-title">Online</div>
          <div className="stat-value text-success">
            {liveHealth?.summary?.healthy || 0}
          </div>
          <div className="stat-desc">Progetti attivi</div>
        </div>

        <div className="stat bg-base-100 rounded-box shadow">
          <div className="stat-figure text-error">
            <XCircle className="w-8 h-8" />
          </div>
          <div className="stat-title">Offline</div>
          <div className="stat-value text-error">
            {liveHealth?.summary?.unhealthy || 0}
          </div>
          <div className="stat-desc">Progetti non raggiungibili</div>
        </div>
      </div>
    </div>
  );
}
