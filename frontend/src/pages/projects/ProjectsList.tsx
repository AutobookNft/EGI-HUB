import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FolderKanban, Plus, Search, Filter, MoreVertical, RefreshCw, CheckCircle, XCircle, Clock, AlertTriangle, Activity, ExternalLink, Play, Square } from 'lucide-react';
import { getProjects, getProjectStats, checkProjectHealth, startProject, stopProject } from '@/services/projectApi';
import type { Project, ProjectStats } from '@/types/project';

/**
 * ProjectsList
 * 
 * Lista e gestione dei progetti SaaS nell'ecosistema EGI-HUB.
 * 
 * NOTE: I "Projects" in EGI-HUB sono le applicazioni SaaS (NATAN_LOC, EGI, etc.)
 * mentre i "Tenants" sono i clienti finali di ogni progetto.
 */
export default function ProjectsList() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [stats, setStats] = useState<ProjectStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setError(null);
      const [projectsData, statsData] = await Promise.all([
        getProjects(),
        getProjectStats()
      ]);
      setProjects(projectsData);
      setStats(statsData);
    } catch (err) {
      console.error('Error fetching projects:', err);
      setError('Errore nel caricamento dei progetti');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const handleHealthCheck = async (id: number) => {
    try {
      await checkProjectHealth(id);
      await fetchData();
    } catch (err) {
      console.error('Health check failed:', err);
    }
  };

  const handleStart = async (id: number, name: string) => {
    if (!confirm(`Avviare i servizi di ${name}?`)) return;
    
    setActionLoading(id);
    try {
      const result = await startProject(id);
      alert(result.message);
      await fetchData();
    } catch (err) {
      console.error('Start failed:', err);
      alert('Errore avvio servizi');
    } finally {
      setActionLoading(null);
    }
  };

  const handleStop = async (id: number, name: string) => {
    if (!confirm(`Fermare i servizi di ${name}?`)) return;
    
    setActionLoading(id);
    try {
      const result = await stopProject(id);
      alert(result.message);
      await fetchData();
    } catch (err) {
      console.error('Stop failed:', err);
      alert('Errore arresto servizi');
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusBadge = (status: Project['status'], isHealthy: boolean) => {
    if (status === 'active' && isHealthy) {
      return <span className="badge badge-success gap-1"><CheckCircle className="w-3 h-3" />Online</span>;
    }
    if (status === 'active' && !isHealthy) {
      return <span className="badge badge-warning gap-1"><AlertTriangle className="w-3 h-3" />Degradato</span>;
    }
    if (status === 'error') {
      return <span className="badge badge-error gap-1"><XCircle className="w-3 h-3" />Errore</span>;
    }
    if (status === 'maintenance') {
      return <span className="badge badge-info gap-1"><Clock className="w-3 h-3" />Manutenzione</span>;
    }
    return <span className="badge badge-ghost gap-1"><Clock className="w-3 h-3" />Inattivo</span>;
  };

  const getHealthIndicator = (isHealthy: boolean) => {
    return isHealthy 
      ? <span className="w-2 h-2 rounded-full bg-success animate-pulse"></span>
      : <span className="w-2 h-2 rounded-full bg-error"></span>;
  };

  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          project.slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          project.url.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || project.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

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
            <FolderKanban className="w-8 h-8 text-primary" />
            Gestione Progetti SaaS
          </h1>
          <p className="text-base-content/60 mt-1">
            {projects.length} progetti registrati • {stats?.healthy || 0} online • {stats?.unhealthy || 0} offline
          </p>
        </div>
        <div className="flex gap-2">
          <button 
            className={`btn btn-ghost gap-2 ${refreshing ? 'loading' : ''}`}
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            Aggiorna
          </button>
          <Link to="/projects/create" className="btn btn-primary gap-2">
            <Plus className="w-5 h-5" />
            Nuovo Progetto
          </Link>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="alert alert-error">
          <AlertTriangle className="w-5 h-5" />
          <span>{error}</span>
        </div>
      )}

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="stat bg-base-100 rounded-box shadow-sm">
            <div className="stat-title">Totale</div>
            <div className="stat-value text-primary">{stats.total}</div>
          </div>
          <div className="stat bg-base-100 rounded-box shadow-sm">
            <div className="stat-title">Attivi</div>
            <div className="stat-value text-success">{stats.active}</div>
          </div>
          <div className="stat bg-base-100 rounded-box shadow-sm">
            <div className="stat-title">In Errore</div>
            <div className="stat-value text-error">{stats.error}</div>
          </div>
          <div className="stat bg-base-100 rounded-box shadow-sm">
            <div className="stat-title">Manutenzione</div>
            <div className="stat-value text-warning">{stats.maintenance}</div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="card bg-base-100 shadow-sm">
        <div className="card-body p-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-base-content/40" />
                <input
                  type="text"
                  placeholder="Cerca progetto per nome, slug o URL..."
                  className="input input-bordered w-full pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            <div className="flex gap-2">
              <select
                className="select select-bordered"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">Tutti gli stati</option>
                <option value="active">Attivi</option>
                <option value="error">In Errore</option>
                <option value="maintenance">Manutenzione</option>
                <option value="inactive">Inattivi</option>
              </select>
              <button className="btn btn-ghost gap-2">
                <Filter className="w-4 h-4" />
                Filtri
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Projects Table */}
      <div className="card bg-base-100 shadow-sm">
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Progetto</th>
                <th>URL</th>
                <th>Stato</th>
                <th>Health</th>
                <th>Ultimo Check</th>
                <th>Azioni</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filteredProjects.map((project) => (
                <tr key={project.id} className="hover">
                  <td>
                    <div className="flex items-center gap-3">
                      <div className="avatar placeholder">
                        <div className={`rounded-lg w-10 h-10 flex items-center justify-center ${project.is_healthy ? 'bg-success/10 text-success' : 'bg-error/10 text-error'}`}>
                          <FolderKanban className="w-5 h-5" />
                        </div>
                      </div>
                      <div>
                        <div className="font-bold">{project.name}</div>
                        <div className="text-sm text-base-content/60 font-mono">{project.slug}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <a 
                      href={project.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="link link-hover flex items-center gap-1 text-sm"
                    >
                      {project.url}
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </td>
                  <td>{getStatusBadge(project.status, project.is_healthy)}</td>
                  <td>
                    <div className="flex items-center gap-2">
                      {getHealthIndicator(project.is_healthy)}
                      <span className={project.is_healthy ? 'text-success' : 'text-error'}>
                        {project.is_healthy ? 'Online' : 'Offline'}
                      </span>
                    </div>
                  </td>
                  <td>
                    <div className="flex items-center gap-2 text-sm text-base-content/60">
                      <Activity className="w-4 h-4" />
                      {project.last_health_check 
                        ? new Date(project.last_health_check).toLocaleString('it-IT')
                        : 'Mai verificato'}
                    </div>
                  </td>
                  <td>
                    <div className="flex gap-1">
                      <button 
                        className="btn btn-ghost btn-xs btn-square"
                        onClick={() => handleStart(project.id, project.name)}
                        disabled={actionLoading === project.id}
                        title="Avvia servizi"
                      >
                        {actionLoading === project.id ? (
                          <span className="loading loading-spinner loading-xs"></span>
                        ) : (
                          <Play className="w-4 h-4 text-success" />
                        )}
                      </button>
                      <button 
                        className="btn btn-ghost btn-xs btn-square"
                        onClick={() => handleStop(project.id, project.name)}
                        disabled={actionLoading === project.id}
                        title="Ferma servizi"
                      >
                        <Square className="w-4 h-4 text-error" />
                      </button>
                    </div>
                  </td>
                  <td>
                    <div className="dropdown dropdown-end">
                      <label tabIndex={0} className="btn btn-ghost btn-sm btn-square">
                        <MoreVertical className="w-4 h-4" />
                      </label>
                      <ul tabIndex={0} className="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-52">
                        <li><Link to={`/projects/${project.id}`}>Visualizza Dettagli</Link></li>
                        <li><a onClick={() => handleHealthCheck(project.id)}>Verifica Health</a></li>
                        <li><a href={project.url} target="_blank" rel="noopener noreferrer">Apri Progetto</a></li>
                        <li><Link to={`/projects/${project.id}/edit`}>Modifica</Link></li>
                        <li className="text-error"><a>Elimina Progetto</a></li>
                      </ul>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredProjects.length === 0 && (
          <div className="text-center py-12">
            <FolderKanban className="w-12 h-12 mx-auto text-base-content/20" />
            <p className="mt-4 text-base-content/60">Nessun progetto trovato</p>
            {projects.length === 0 && (
              <Link to="/projects/create" className="btn btn-primary btn-sm mt-4">
                <Plus className="w-4 h-4" />
                Aggiungi il primo progetto
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
