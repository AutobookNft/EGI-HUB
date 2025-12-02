import { useQuery } from '@tanstack/react-query';
import { Brain, Users, Palette, Sparkles, MessageSquare, CreditCard, Coins, Loader2, AlertCircle, Building2, Activity, CheckCircle, XCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { getTenants, getTenantStats } from '../services/tenantApi';
import type { TenantStats, Tenant } from '../types/tenant';

interface DashboardStats {
  ai_consultations: number;
  total_egis: number;
  active_users: number;
  traits_created: number;
}

interface DashboardResponse {
  stats: DashboardStats;
  recent_activity: {
    id: number;
    type: string;
    description: string;
    created_at: string;
  }[];
}

export default function Dashboard() {
  const { data, isLoading, error } = useQuery<DashboardResponse>({
    queryKey: ['dashboard'],
    queryFn: () => api.get('/superadmin/dashboard').then(res => res.data),
  });

  // Fetch tenant stats
  const { data: tenantStats, isLoading: tenantsLoading } = useQuery<TenantStats>({
    queryKey: ['tenantStats'],
    queryFn: () => getTenantStats(),
  });

  // Fetch tenants list
  const { data: tenants } = useQuery<Tenant[]>({
    queryKey: ['tenants'],
    queryFn: () => getTenants(),
  });

  if (isLoading || tenantsLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-error">
        <AlertCircle className="w-6 h-6" />
        <div>
          <h3 className="font-bold">Connessione al backend non riuscita</h3>
          <div className="text-sm">Assicurati che il backend EGI-HUB sia attivo su localhost:8001</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="hero bg-gradient-to-r from-[#0B1F3A] to-[#123C7A] rounded-xl text-white">
        <div className="hero-content text-center py-8">
          <div>
            <h1 className="text-3xl font-bold">🏛️ EGI-HUB SuperAdmin</h1>
            <p className="py-4 text-white/80">
              Centro di controllo della piattaforma FlorenceEGI
            </p>
          </div>
        </div>
      </div>

      {/* Tenant Status Overview */}
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <div className="flex items-center justify-between mb-4">
            <h2 className="card-title flex items-center gap-2">
              <Building2 className="w-6 h-6 text-primary" />
              Stato Tenant
            </h2>
            <Link to="/tenants" className="btn btn-ghost btn-sm">
              Vedi tutti →
            </Link>
          </div>
          
          {/* Tenant Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="stat bg-base-200 rounded-box p-4">
              <div className="stat-title text-xs">Totale</div>
              <div className="stat-value text-2xl text-primary">{tenantStats?.total ?? 0}</div>
            </div>
            <div className="stat bg-success/10 rounded-box p-4">
              <div className="stat-title text-xs">Attivi</div>
              <div className="stat-value text-2xl text-success">{tenantStats?.active ?? 0}</div>
            </div>
            <div className="stat bg-base-300 rounded-box p-4">
              <div className="stat-title text-xs">Inattivi</div>
              <div className="stat-value text-2xl text-base-content/50">{tenantStats?.inactive ?? 0}</div>
            </div>
            <div className="stat bg-error/10 rounded-box p-4">
              <div className="stat-title text-xs">In Errore</div>
              <div className="stat-value text-2xl text-error">{tenantStats?.error ?? 0}</div>
            </div>
          </div>

          {/* Tenant List */}
          <div className="space-y-2">
            {tenants?.slice(0, 5).map((tenant) => {
              // Determina stato e colore
              const isActive = tenant.status === 'active';
              const isOnline = isActive && tenant.is_healthy;
              const statusColor = isOnline ? 'bg-success' : 
                                  tenant.status === 'inactive' ? 'bg-base-content/30' :
                                  tenant.status === 'maintenance' ? 'bg-warning' : 'bg-error';
              const statusLabel = isOnline ? 'Online' :
                                  tenant.status === 'inactive' ? 'Inattivo' :
                                  tenant.status === 'maintenance' ? 'Manutenzione' : 
                                  !tenant.is_healthy ? 'Offline' : 'Errore';
              const badgeClass = isOnline ? 'badge-success' :
                                 tenant.status === 'inactive' ? 'badge-ghost' :
                                 tenant.status === 'maintenance' ? 'badge-warning' : 'badge-error';
              
              return (
                <div key={tenant.id} className="flex items-center justify-between p-3 bg-base-200 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${statusColor} ${isOnline ? 'animate-pulse' : ''}`}></div>
                    <div>
                      <div className="font-medium">{tenant.name}</div>
                      <div className="text-xs text-base-content/60">{tenant.url}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`badge ${badgeClass} gap-1 badge-sm`}>
                      {isOnline ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                      {statusLabel}
                    </span>
                    <Activity className="w-4 h-4 text-base-content/40" />
                  </div>
                </div>
              );
            })}
            {(!tenants || tenants.length === 0) && (
              <div className="text-center py-8 text-base-content/60">
                <Building2 className="w-12 h-12 mx-auto mb-2 opacity-20" />
                <p>Nessun tenant registrato</p>
                <Link to="/tenants/create" className="btn btn-primary btn-sm mt-2">
                  Aggiungi Tenant
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Stats Cards - Replica esatta di EGI dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* AI Consultations */}
        <div className="card bg-gradient-to-br from-purple-500/10 to-purple-600/10 shadow-xl">
          <div className="card-body">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-base-content/60">AI Consultazioni</p>
                <p className="text-3xl font-bold text-purple-600">{data?.stats.ai_consultations ?? 0}</p>
              </div>
              <div className="rounded-full bg-purple-500/20 p-3">
                <Brain className="w-8 h-8 text-purple-500" />
              </div>
            </div>
          </div>
        </div>

        {/* Total EGIs */}
        <div className="card bg-gradient-to-br from-blue-500/10 to-blue-600/10 shadow-xl">
          <div className="card-body">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-base-content/60">EGI Totali</p>
                <p className="text-3xl font-bold text-blue-600">{data?.stats.total_egis ?? 0}</p>
              </div>
              <div className="rounded-full bg-blue-500/20 p-3">
                <Palette className="w-8 h-8 text-blue-500" />
              </div>
            </div>
          </div>
        </div>

        {/* Active Users */}
        <div className="card bg-gradient-to-br from-green-500/10 to-green-600/10 shadow-xl">
          <div className="card-body">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-base-content/60">Utenti Attivi</p>
                <p className="text-3xl font-bold text-green-600">{data?.stats.active_users ?? 0}</p>
              </div>
              <div className="rounded-full bg-green-500/20 p-3">
                <Users className="w-8 h-8 text-green-500" />
              </div>
            </div>
          </div>
        </div>

        {/* Traits Created */}
        <div className="card bg-gradient-to-br from-orange-500/10 to-orange-600/10 shadow-xl">
          <div className="card-body">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-base-content/60">Traits Creati</p>
                <p className="text-3xl font-bold text-orange-600">{data?.stats.traits_created ?? 0}</p>
              </div>
              <div className="rounded-full bg-orange-500/20 p-3">
                <Sparkles className="w-8 h-8 text-orange-500" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <h2 className="card-title">⚡ Azioni Rapide</h2>
          <div className="flex flex-wrap gap-3 mt-4">
            <Link to="/ai/consultations" className="btn btn-primary gap-2">
              <MessageSquare className="w-4 h-4" />
              Consultazioni AI
            </Link>
            <Link to="/ai/credits" className="btn btn-secondary gap-2">
              <CreditCard className="w-4 h-4" />
              Gestisci Crediti
            </Link>
            <Link to="/tokenomics/egili" className="btn btn-warning gap-2">
              <Coins className="w-4 h-4" />
              Egili Management
            </Link>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <h2 className="card-title">📊 Attività Recente</h2>
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Tipo</th>
                  <th>Descrizione</th>
                  <th>Data</th>
                </tr>
              </thead>
              <tbody>
                {data?.recent_activity?.length ? (
                  data.recent_activity.map((activity) => (
                    <tr key={activity.id}>
                      <td><span className="badge badge-ghost">{activity.type}</span></td>
                      <td>{activity.description}</td>
                      <td>{new Date(activity.created_at).toLocaleString('it-IT')}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={3} className="text-center text-base-content/60">
                      Nessuna attività recente
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
