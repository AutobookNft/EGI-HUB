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
      <div className="bg-gradient-to-r from-blue-900 to-blue-700 rounded-xl text-white p-8 text-center">
        <h1 className="text-4xl font-bold mb-2">🏛️ EGI-HUB SuperAdmin</h1>
        <p className="text-blue-100">Centro di controllo della piattaforma FlorenceEGI</p>
      </div>

      {/* Tenant Status Overview */}
      <div className="card">
        <div className="flex items-center justify-between mb-4 pb-4 border-b border-slate-200">
          <h2 className="text-xl font-semibold text-slate-900 flex items-center gap-2">
            <Building2 className="w-6 h-6 text-blue-600" />
            Stato Tenant
          </h2>
          <Link to="/tenants" className="btn btn-ghost text-sm px-2 py-1">
            Vedi tutti →
          </Link>
        </div>
        
        {/* Tenant Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-slate-100 rounded-lg p-4">
            <div className="text-xs text-slate-600 font-medium mb-1">Totale</div>
            <div className="text-2xl font-bold text-blue-600">{tenantStats?.total ?? 0}</div>
          </div>
          <div className="bg-emerald-50 rounded-lg p-4">
            <div className="text-xs text-emerald-600 font-medium mb-1">Attivi</div>
            <div className="text-2xl font-bold text-emerald-600">{tenantStats?.active ?? 0}</div>
          </div>
          <div className="bg-slate-100 rounded-lg p-4">
            <div className="text-xs text-slate-600 font-medium mb-1">Inattivi</div>
            <div className="text-2xl font-bold text-slate-500">{tenantStats?.inactive ?? 0}</div>
          </div>
          <div className="bg-red-50 rounded-lg p-4">
            <div className="text-xs text-red-600 font-medium mb-1">In Errore</div>
            <div className="text-2xl font-bold text-red-600">{tenantStats?.error ?? 0}</div>
          </div>
        </div>

        {/* Tenant List */}
        <div className="space-y-2">
            {tenants?.slice(0, 5).map((tenant) => {
              // Determina stato e colore
              const isActive = tenant.status === 'active';
              const isOnline = isActive && tenant.is_healthy;
              const statusColor = isOnline ? 'bg-emerald-500' : 
                                  tenant.status === 'inactive' ? 'bg-slate-400' :
                                  tenant.status === 'maintenance' ? 'bg-amber-500' : 'bg-red-500';
              const statusLabel = isOnline ? 'Online' :
                                  tenant.status === 'inactive' ? 'Inattivo' :
                                  tenant.status === 'maintenance' ? 'Manutenzione' : 
                                  !tenant.is_healthy ? 'Offline' : 'Errore';
              const badgeClass = isOnline ? 'badge-success' :
                                 tenant.status === 'inactive' ? 'badge-secondary' :
                                 tenant.status === 'maintenance' ? 'badge-warning' : 'badge-danger';
              
              return (
                <div key={tenant.id} className="flex items-center justify-between p-3 bg-slate-100 rounded-lg hover:bg-slate-150 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${statusColor} ${isOnline ? 'animate-pulse' : ''}`}></div>
                    <div>
                      <div className="font-medium text-slate-900">{tenant.name}</div>
                      <div className="text-xs text-slate-600">{tenant.url}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`badge ${badgeClass} gap-1 text-xs`}>
                      {isOnline ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                      {statusLabel}
                    </span>
                    <Activity className="w-4 h-4 text-slate-400" />
                  </div>
                </div>
              );
            })}
            {(!tenants || tenants.length === 0) && (
              <div className="text-center py-8 text-slate-600">
                <Building2 className="w-12 h-12 mx-auto mb-2 opacity-20" />
                <p>Nessun tenant registrato</p>
                <Link to="/tenants/create" className="btn btn-primary btn-sm mt-2">
                  Aggiungi Tenant
                </Link>
              </div>
            )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* AI Consultations */}
        <div className="card bg-gradient-to-br from-purple-50 to-purple-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600 font-medium">AI Consultazioni</p>
              <p className="text-3xl font-bold text-purple-600 mt-2">{data?.stats.ai_consultations ?? 0}</p>
            </div>
            <div className="rounded-full bg-purple-200 p-3">
              <Brain className="w-8 h-8 text-purple-600" />
            </div>
          </div>
        </div>

        {/* Total EGIs */}
        <div className="card bg-gradient-to-br from-blue-50 to-blue-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600 font-medium">EGI Totali</p>
              <p className="text-3xl font-bold text-blue-600 mt-2">{data?.stats.total_egis ?? 0}</p>
            </div>
            <div className="rounded-full bg-blue-200 p-3">
              <Palette className="w-8 h-8 text-blue-600" />
            </div>
          </div>
        </div>

        {/* Active Users */}
        <div className="card bg-gradient-to-br from-emerald-50 to-emerald-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600 font-medium">Utenti Attivi</p>
              <p className="text-3xl font-bold text-emerald-600 mt-2">{data?.stats.active_users ?? 0}</p>
            </div>
            <div className="rounded-full bg-emerald-200 p-3">
              <Users className="w-8 h-8 text-emerald-600" />
            </div>
          </div>
        </div>

        {/* Traits Created */}
        <div className="card bg-gradient-to-br from-amber-50 to-amber-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600 font-medium">Traits Creati</p>
              <p className="text-3xl font-bold text-amber-600 mt-2">{data?.stats.traits_created ?? 0}</p>
            </div>
            <div className="rounded-full bg-amber-200 p-3">
              <Sparkles className="w-8 h-8 text-amber-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card">
        <div className="text-xl font-semibold text-slate-900 mb-4 pb-4 border-b border-slate-200">
          ⚡ Azioni Rapide
        </div>
        <div className="flex flex-wrap gap-3">
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

      {/* Recent Activity */}
      <div className="card">
        <div className="text-xl font-semibold text-slate-900 mb-4 pb-4 border-b border-slate-200">
          📊 Attività Recente
        </div>
        <div className="overflow-x-auto">
          <table>
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
                    <td><span className="badge">{activity.type}</span></td>
                    <td className="text-slate-700">{activity.description}</td>
                    <td className="text-slate-600 text-sm">{new Date(activity.created_at).toLocaleString('it-IT')}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={3} className="text-center text-slate-600 py-4">
                    Nessuna attività recente
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
