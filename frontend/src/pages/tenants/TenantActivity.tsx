import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { activityApi, type TenantActivity } from '@/services/activityApi';
import { checkAllTenantsHealth } from '@/services/tenantApi';
import {
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  Filter,
  HelpCircle,
  Info,
  Loader2,
  Play,
  RefreshCw,
  Search,
  Server,
  Square,
  Wifi,
  WifiOff,
  XCircle,
  Zap
} from 'lucide-react';

interface ActivityStats {
  total: number;
  period_hours: number;
  by_type: Record<string, number>;
  by_tenant: Array<{ name: string; slug: string; count: number }>;
  by_status: Record<string, number>;
  avg_response_time_ms: number;
  errors_rate: number;
}

interface TimelineItem {
  hour: string;
  total: number;
  success: number;
  warning: number;
  error: number;
  info: number;
}

interface PaginatedResponse<T> {
  data: T[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

// Mappa tipi tecnici → etichette comprensibili
const EVENT_LABELS: Record<string, { label: string; description: string; icon: string }> = {
  'health_check': {
    label: 'Verifica Connessione',
    description: 'EGI-HUB controlla periodicamente se il tenant è raggiungibile',
    icon: 'wifi'
  },
  'api_call': {
    label: 'Chiamata API',
    description: 'Una richiesta API è stata inoltrata al tenant',
    icon: 'zap'
  },
  'proxy': {
    label: 'Richiesta Proxy',
    description: 'EGI-HUB ha fatto da intermediario per una richiesta',
    icon: 'arrow-right'
  },
  'sync': {
    label: 'Sincronizzazione',
    description: 'Dati sincronizzati tra EGI-HUB e il tenant',
    icon: 'refresh'
  },
  'config': {
    label: 'Configurazione',
    description: 'Modifica alle impostazioni del tenant',
    icon: 'settings'
  },
  'error': {
    label: 'Errore',
    description: 'Si è verificato un problema',
    icon: 'alert'
  },
  'auth': {
    label: 'Autenticazione',
    description: 'Evento di login/logout o verifica credenziali',
    icon: 'lock'
  }
};

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  'success': { label: 'OK', color: 'badge-success' },
  'warning': { label: 'Attenzione', color: 'badge-warning' },
  'error': { label: 'Errore', color: 'badge-error' },
  'info': { label: 'Info', color: 'badge-info' }
};

export default function TenantActivity() {
  const [page, setPage] = useState(1);
  const [typeFilter, setTypeFilter] = useState('');
  const [tenantFilter, setTenantFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const queryClient = useQueryClient();

  // ============================================
  // STATO LIVE DEI TENANT (polling ogni 30 sec)
  // ============================================
  const { 
    data: liveHealth, 
    isLoading: loadingHealth,
    isFetching: fetchingHealth,
    refetch: refetchHealth 
  } = useQuery({
    queryKey: ['tenants-live-health'],
    queryFn: async () => {
      const result = await checkAllTenantsHealth();
      return result;
    },
    refetchInterval: 30000, // Polling ogni 30 secondi
    staleTime: 10000,
  });

  // Mutation per forzare health check
  const healthCheckMutation = useMutation({
    mutationFn: checkAllTenantsHealth,
    onSuccess: (data) => {
      queryClient.setQueryData(['tenants-live-health'], data);
      queryClient.invalidateQueries({ queryKey: ['activities'] });
      queryClient.invalidateQueries({ queryKey: ['activity-stats'] });
    }
  });

  // Handler per Start tenant
  const handleStartTenant = async (tenantId: number, _tenantName: string) => {
    try {
      const response = await fetch(`/api/tenants/${tenantId}/start`, { method: 'POST' });
      const data = await response.json();
      if (data.success) {
        // Ricarica health check dopo 3 secondi per dare tempo al servizio di avviarsi
        setTimeout(() => {
          healthCheckMutation.mutate();
        }, 3000);
      } else {
        alert(data.message || 'Errore avvio tenant');
      }
    } catch (error) {
      console.error('Errore start tenant:', error);
      alert('Errore di connessione');
    }
  };

  // Handler per Stop tenant
  const handleStopTenant = async (tenantId: number, tenantName: string) => {
    if (!confirm(`Sei sicuro di voler fermare ${tenantName}?`)) return;
    try {
      const response = await fetch(`/api/tenants/${tenantId}/stop`, { method: 'POST' });
      const data = await response.json();
      if (data.success) {
        // Ricarica health check dopo 2 secondi
        setTimeout(() => {
          healthCheckMutation.mutate();
        }, 2000);
      } else {
        alert(data.message || 'Errore arresto tenant');
      }
    } catch (error) {
      console.error('Errore stop tenant:', error);
      alert('Errore di connessione');
    }
  };

  // Query activities
  const { data: activitiesData, isLoading: loadingActivities, refetch } = useQuery({
    queryKey: ['activities', page, typeFilter, tenantFilter],
    queryFn: async () => {
      const params: Record<string, string | number> = { page, per_page: 20 };
      if (typeFilter) params.type = typeFilter;
      if (tenantFilter) params.tenant_id = tenantFilter;
      const result = await activityApi.getAll(params);
      return result as PaginatedResponse<TenantActivity>;
    },
    staleTime: 30000,
  });

  // Query stats
  const { data: stats, isLoading: loadingStats } = useQuery({
    queryKey: ['activity-stats'],
    queryFn: async () => {
      const result = await activityApi.getStats();
      return result as ActivityStats;
    },
    staleTime: 60000,
  });

  // Query timeline
  const { data: timeline } = useQuery({
    queryKey: ['activity-timeline'],
    queryFn: async () => {
      const result = await activityApi.getTimeline(24);
      return result as TimelineItem[];
    },
    staleTime: 60000,
  });

  const activities = activitiesData?.data || [];
  const totalPages = activitiesData?.last_page || 1;

  // Filter activities by search
  const filteredActivities = useMemo(() => {
    if (!searchQuery) return activities;
    const query = searchQuery.toLowerCase();
    return activities.filter((activity) =>
      (activity.tenant?.name || '').toLowerCase().includes(query) ||
      activity.action.toLowerCase().includes(query) ||
      (activity.description || '').toLowerCase().includes(query)
    );
  }, [activities, searchQuery]);

  const getStatusBadge = (status: string) => {
    const info = STATUS_LABELS[status] || { label: status, color: 'badge-neutral' };
    return info;
  };

  const getEventLabel = (type: string) => {
    return EVENT_LABELS[type]?.label || type;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return <CheckCircle className="w-4 h-4 text-success" />;
      case 'warning': return <AlertTriangle className="w-4 h-4 text-warning" />;
      case 'error': return <XCircle className="w-4 h-4 text-error" />;
      default: return <Info className="w-4 h-4 text-info" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Get unique types for filter
  const uniqueTypes = useMemo(() => {
    const types = new Set(activities.map(a => a.type));
    return Array.from(types);
  }, [activities]);

  // Get unique tenants for filter
  const uniqueTenants = useMemo(() => {
    const tenantMap = new Map<number, { id: number; name: string }>();
    activities.forEach(a => {
      if (a.tenant?.id) {
        tenantMap.set(a.tenant.id, { id: a.tenant.id, name: a.tenant.name });
      }
    });
    return Array.from(tenantMap.values());
  }, [activities]);

  return (
    <div className="space-y-6">
      {/* Header con spiegazione */}
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-base-content flex items-center gap-2">
            <Wifi className="w-7 h-7 text-primary" />
            Monitoraggio Connessioni
          </h1>
          <p className="text-base-content/70 mt-1 max-w-2xl">
            Questa pagina mostra lo <strong>storico delle verifiche di connessione</strong> tra EGI-HUB 
            e i tenant registrati. Ogni volta che EGI-HUB controlla se un tenant è raggiungibile, 
            l'esito viene registrato qui.
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
            onClick={() => { refetch(); refetchHealth(); }}
          >
            <RefreshCw className={`w-4 h-4 ${fetchingHealth ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* ============================================ */}
      {/* STATO LIVE DEI TENANT - LA VERITÀ */}
      {/* ============================================ */}
      <div className="bg-base-100 rounded-box shadow p-4 border-2 border-primary/20">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Server className="w-5 h-5 text-primary" />
            Stato Attuale Tenant (LIVE)
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
            <p>Nessun tenant registrato</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.values(liveHealth.results).map((result) => (
              <div 
                key={result.tenant.id}
                className={`p-4 rounded-lg border-2 ${
                  result.health.healthy 
                    ? 'border-success/30 bg-success/5' 
                    : 'border-error/30 bg-error/5'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold">{result.tenant.name}</h3>
                    <p className="text-xs text-base-content/50 truncate max-w-[180px]">
                      {result.tenant.url}
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
                    onClick={() => handleStartTenant(result.tenant.id, result.tenant.name)}
                    disabled={result.health.healthy}
                  >
                    <Play className="w-3 h-3" />
                    Start
                  </button>
                  <button 
                    className="btn btn-error btn-sm flex-1 gap-1"
                    onClick={() => handleStopTenant(result.tenant.id, result.tenant.name)}
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

      {/* Box informativo - Cosa viene monitorato */}
      <div className="alert bg-base-200 border-l-4 border-primary">
        <HelpCircle className="w-6 h-6 text-primary shrink-0" />
        <div>
          <h3 className="font-bold">Cosa viene registrato?</h3>
          <ul className="text-sm mt-1 space-y-1">
            <li>• <strong>Verifica Connessione</strong>: EGI-HUB controlla periodicamente se ogni tenant risponde</li>
            <li>• <strong>Tempo di risposta</strong>: Quanto tempo impiega il tenant a rispondere (in millisecondi)</li>
            <li>• <strong>Esito</strong>: <span className="text-success">OK</span> se raggiungibile, <span className="text-error">Errore</span> se non risponde</li>
          </ul>
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
            <span className="text-sm"><strong>OK</strong> - Tenant raggiungibile e funzionante</span>
          </div>
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-warning" />
            <span className="text-sm"><strong>Attenzione</strong> - Risponde ma con problemi</span>
          </div>
          <div className="flex items-center gap-2">
            <XCircle className="w-5 h-5 text-error" />
            <span className="text-sm"><strong>Errore</strong> - Non raggiungibile o non risponde</span>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="stat bg-base-100 rounded-box shadow">
          <div className="stat-figure text-primary">
            <Activity className="w-8 h-8" />
          </div>
          <div className="stat-title">Verifiche Totali</div>
          <div className="stat-value text-primary">
            {loadingStats ? '...' : stats?.total || 0}
          </div>
          <div className="stat-desc">Ultime 24 ore</div>
        </div>

        <div className="stat bg-base-100 rounded-box shadow">
          <div className="stat-figure text-success">
            <CheckCircle className="w-8 h-8" />
          </div>
          <div className="stat-title">Successi</div>
          <div className="stat-value text-success">
            {loadingStats ? '...' : stats?.by_status?.success || 0}
          </div>
          <div className="stat-desc">Connessioni OK</div>
        </div>

        <div className="stat bg-base-100 rounded-box shadow">
          <div className="stat-figure text-error">
            <XCircle className="w-8 h-8" />
          </div>
          <div className="stat-title">Errori</div>
          <div className="stat-value text-error">
            {loadingStats ? '...' : stats?.by_status?.error || 0}
          </div>
          <div className="stat-desc">Connessioni fallite</div>
        </div>

        <div className="stat bg-base-100 rounded-box shadow">
          <div className="stat-figure text-info">
            <Clock className="w-8 h-8" />
          </div>
          <div className="stat-title">Tempo Medio</div>
          <div className="stat-value text-info text-2xl">
            {loadingStats ? '...' : `${stats?.avg_response_time_ms || 0}ms`}
          </div>
          <div className="stat-desc">Risposta tenant</div>
        </div>
      </div>

      {/* Timeline Chart Preview */}
      {timeline && timeline.length > 0 && (
        <div className="bg-base-100 rounded-box shadow p-4">
          <h3 className="font-semibold mb-3">Attività Ultime 24 Ore</h3>
          <div className="flex items-end gap-1 h-20">
            {timeline.map((item, idx) => {
              const maxCount = Math.max(...timeline.map(t => t.total), 1);
              const height = (item.total / maxCount) * 100;
              return (
                <div
                  key={idx}
                  className="flex-1 bg-primary/30 hover:bg-primary/50 transition-colors rounded-t tooltip"
                  data-tip={`${item.hour}: ${item.total}`}
                  style={{ height: `${Math.max(height, 5)}%` }}
                />
              );
            })}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-base-100 rounded-box shadow p-4">
        <div className="flex flex-wrap gap-4">
          <div className="form-control flex-1 min-w-[200px]">
            <div className="input-group">
              <span><Search className="w-4 h-4" /></span>
              <input
                type="text"
                placeholder="Cerca attività..."
                className="input input-bordered flex-1"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <select
            className="select select-bordered"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            <option value="">Tutti i tipi</option>
            {uniqueTypes.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>

          <select
            className="select select-bordered"
            value={tenantFilter}
            onChange={(e) => setTenantFilter(e.target.value)}
          >
            <option value="">Tutti i tenant</option>
            {uniqueTenants.map(t => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Storico Verifiche */}
      <div className="bg-base-100 rounded-box shadow overflow-x-auto">
        <div className="p-4 border-b border-base-200">
          <h3 className="font-semibold">Storico Verifiche Connessione</h3>
          <p className="text-sm text-base-content/60">Elenco cronologico di tutte le verifiche effettuate</p>
        </div>
        <table className="table">
          <thead>
            <tr>
              <th>Tenant</th>
              <th>Evento</th>
              <th>Esito</th>
              <th>Dettagli</th>
              <th>Tempo Risposta</th>
              <th>Data/Ora</th>
            </tr>
          </thead>
          <tbody>
            {loadingActivities ? (
              <tr>
                <td colSpan={6} className="text-center py-8">
                  <span className="loading loading-spinner loading-lg"></span>
                </td>
              </tr>
            ) : filteredActivities.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-8 text-base-content/60">
                  <WifiOff className="w-12 h-12 mx-auto mb-2 opacity-30" />
                  <p>Nessuna verifica registrata</p>
                  <p className="text-sm">Le verifiche appariranno qui quando EGI-HUB controllerà i tenant</p>
                </td>
              </tr>
            ) : (
              filteredActivities.map((activity) => (
                <tr key={activity.id} className="hover">
                  <td className="font-medium">{activity.tenant?.name || 'N/A'}</td>
                  <td>
                    <div className="flex items-center gap-2">
                      <Wifi className="w-4 h-4 text-primary" />
                      <span>{getEventLabel(activity.type)}</span>
                    </div>
                  </td>
                  <td>
                    <div className="flex items-center gap-1">
                      {getStatusIcon(activity.status)}
                      <span className={`badge badge-sm ${getStatusBadge(activity.status).color}`}>
                        {getStatusBadge(activity.status).label}
                      </span>
                    </div>
                  </td>
                  <td className="max-w-xs text-sm text-base-content/70">
                    {activity.description || '-'}
                  </td>
                  <td className="font-mono text-sm">
                    {activity.response_time_ms ? `${activity.response_time_ms}ms` : '-'}
                  </td>
                  <td className="text-base-content/60 text-sm">
                    {formatDate(activity.created_at)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center p-4">
            <div className="join">
              <button
                className="join-item btn btn-sm"
                disabled={page <= 1}
                onClick={() => setPage(p => p - 1)}
              >
                «
              </button>
              <button className="join-item btn btn-sm">
                Pagina {page} di {totalPages}
              </button>
              <button
                className="join-item btn btn-sm"
                disabled={page >= totalPages}
                onClick={() => setPage(p => p + 1)}
              >
                »
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Riepilogo per Tenant */}
      {stats && (stats.by_tenant?.length > 0 || Object.keys(stats.by_type || {}).length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Verifiche per Tenant */}
          <div className="bg-base-100 rounded-box shadow p-4">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Verifiche per Tenant
            </h3>
            <p className="text-sm text-base-content/60 mb-3">
              Quante volte è stato controllato ogni tenant nelle ultime 24 ore
            </p>
            <div className="space-y-2">
              {(stats.by_tenant || []).map((item) => (
                <div key={item.slug} className="flex justify-between items-center p-2 bg-base-200 rounded">
                  <span className="font-medium">{item.name}</span>
                  <span className="badge badge-primary">{item.count} verifiche</span>
                </div>
              ))}
              {(!stats.by_tenant || stats.by_tenant.length === 0) && (
                <p className="text-base-content/50 text-sm">Nessun dato disponibile</p>
              )}
            </div>
          </div>

          {/* Tipi di Evento */}
          <div className="bg-base-100 rounded-box shadow p-4">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Tipi di Evento
            </h3>
            <p className="text-sm text-base-content/60 mb-3">
              Suddivisione per tipo di verifica effettuata
            </p>
            <div className="space-y-2">
              {Object.entries(stats.by_type || {}).map(([type, count]) => (
                <div key={type} className="flex justify-between items-center p-2 bg-base-200 rounded">
                  <div className="flex items-center gap-2">
                    <Wifi className="w-4 h-4 text-primary" />
                    <span>{getEventLabel(type)}</span>
                  </div>
                  <span className="badge badge-neutral">{count}</span>
                </div>
              ))}
              {Object.keys(stats.by_type || {}).length === 0 && (
                <p className="text-base-content/50 text-sm">Nessun dato disponibile</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
