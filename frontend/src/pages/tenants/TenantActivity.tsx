import { useState, useEffect } from 'react';
import { Activity, Filter, Search, Building2, User, Calendar, Clock, ArrowUpRight, ArrowDownRight, RefreshCw } from 'lucide-react';
import api from '@/services/api';

interface ActivityLog {
  id: string;
  tenant_id: string;
  tenant_name: string;
  user_name: string;
  action: string;
  description: string;
  ip_address: string;
  created_at: string;
  type: 'login' | 'create' | 'update' | 'delete' | 'billing' | 'system';
}

export default function TenantActivity() {
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  useEffect(() => {
    fetchActivities();
  }, []);

  const fetchActivities = async () => {
    try {
      const response = await api.get('/superadmin/tenants/activity');
      setActivities(response.data.activities || []);
    } catch (error) {
      console.error('Error fetching activities:', error);
      // Demo data
      setActivities([
        {
          id: '1',
          tenant_id: '1',
          tenant_name: 'Galleria Moderna',
          user_name: 'Mario Rossi',
          action: 'user.login',
          description: 'Login effettuato con successo',
          ip_address: '192.168.1.100',
          created_at: '2025-12-01T21:30:00',
          type: 'login',
        },
        {
          id: '2',
          tenant_id: '2',
          tenant_name: 'Arte Contemporanea',
          user_name: 'Admin',
          action: 'egi.create',
          description: 'Creato nuovo EGI "Opera Moderna #125"',
          ip_address: '10.0.0.50',
          created_at: '2025-12-01T21:15:00',
          type: 'create',
        },
        {
          id: '3',
          tenant_id: '1',
          tenant_name: 'Galleria Moderna',
          user_name: 'Sistema',
          action: 'billing.charge',
          description: 'Addebito mensile €79.00 - Piano Professional',
          ip_address: '-',
          created_at: '2025-12-01T00:00:00',
          type: 'billing',
        },
        {
          id: '4',
          tenant_id: '3',
          tenant_name: 'Museo Digitale',
          user_name: 'Luca Bianchi',
          action: 'settings.update',
          description: 'Aggiornate impostazioni notifiche',
          ip_address: '192.168.1.150',
          created_at: '2025-11-30T18:45:00',
          type: 'update',
        },
        {
          id: '5',
          tenant_id: '2',
          tenant_name: 'Arte Contemporanea',
          user_name: 'Admin',
          action: 'user.delete',
          description: 'Rimosso utente "guest@example.com"',
          ip_address: '10.0.0.50',
          created_at: '2025-11-30T16:30:00',
          type: 'delete',
        },
        {
          id: '6',
          tenant_id: '4',
          tenant_name: 'Collezione Privata',
          user_name: 'Sistema',
          action: 'system.suspend',
          description: 'Tenant sospeso per mancato pagamento',
          ip_address: '-',
          created_at: '2025-11-28T09:00:00',
          type: 'system',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const getTypeIcon = (type: ActivityLog['type']) => {
    const icons = {
      login: <User className="w-4 h-4" />,
      create: <ArrowUpRight className="w-4 h-4 text-success" />,
      update: <RefreshCw className="w-4 h-4 text-info" />,
      delete: <ArrowDownRight className="w-4 h-4 text-error" />,
      billing: <Calendar className="w-4 h-4 text-warning" />,
      system: <Activity className="w-4 h-4 text-secondary" />,
    };
    return icons[type];
  };

  const getTypeBadge = (type: ActivityLog['type']) => {
    const badges = {
      login: 'badge-ghost',
      create: 'badge-success',
      update: 'badge-info',
      delete: 'badge-error',
      billing: 'badge-warning',
      system: 'badge-secondary',
    };
    const labels = {
      login: 'Login',
      create: 'Creazione',
      update: 'Modifica',
      delete: 'Eliminazione',
      billing: 'Billing',
      system: 'Sistema',
    };
    return <span className={`badge badge-sm ${badges[type]}`}>{labels[type]}</span>;
  };

  const filteredActivities = activities.filter(activity => {
    const matchesSearch = 
      activity.tenant_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      activity.user_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      activity.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === 'all' || activity.type === typeFilter;
    return matchesSearch && matchesType;
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
            <Activity className="w-8 h-8 text-primary" />
            Attività Tenant
          </h1>
          <p className="text-base-content/60 mt-1">
            Log delle attività su tutti i tenant
          </p>
        </div>
        <button onClick={fetchActivities} className="btn btn-ghost gap-2">
          <RefreshCw className="w-4 h-4" />
          Aggiorna
        </button>
      </div>

      {/* Filters */}
      <div className="card bg-base-100 shadow-sm">
        <div className="card-body p-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-base-content/40" />
                <input
                  type="text"
                  placeholder="Cerca per tenant, utente o descrizione..."
                  className="input input-bordered w-full pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            <div className="flex gap-2">
              <select
                className="select select-bordered"
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
              >
                <option value="all">Tutti i tipi</option>
                <option value="login">Login</option>
                <option value="create">Creazione</option>
                <option value="update">Modifica</option>
                <option value="delete">Eliminazione</option>
                <option value="billing">Billing</option>
                <option value="system">Sistema</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Activity Log */}
      <div className="card bg-base-100 shadow-sm">
        <div className="card-body p-0">
          <div className="divide-y divide-base-200">
            {filteredActivities.map((activity) => (
              <div key={activity.id} className="p-4 hover:bg-base-200/50 transition-colors">
                <div className="flex items-start gap-4">
                  <div className="avatar placeholder">
                    <div className="bg-base-200 rounded-full w-10 h-10 flex items-center justify-center">
                      {getTypeIcon(activity.type)}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold">{activity.user_name}</span>
                      <span className="text-base-content/40">•</span>
                      <span className="text-sm text-base-content/60 flex items-center gap-1">
                        <Building2 className="w-3 h-3" />
                        {activity.tenant_name}
                      </span>
                      {getTypeBadge(activity.type)}
                    </div>
                    <p className="text-sm mt-1">{activity.description}</p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-base-content/40">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(activity.created_at).toLocaleString('it-IT')}
                      </span>
                      <span className="font-mono">{activity.action}</span>
                      {activity.ip_address !== '-' && (
                        <span>IP: {activity.ip_address}</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredActivities.length === 0 && (
            <div className="text-center py-12">
              <Activity className="w-12 h-12 mx-auto text-base-content/20" />
              <p className="mt-4 text-base-content/60">Nessuna attività trovata</p>
            </div>
          )}
        </div>
      </div>

      {/* Load More */}
      {filteredActivities.length > 0 && (
        <div className="text-center">
          <button className="btn btn-ghost">Carica altre attività</button>
        </div>
      )}
    </div>
  );
}
