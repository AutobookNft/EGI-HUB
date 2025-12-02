import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Building2, Plus, Search, Filter, MoreVertical, Users, Database, Calendar, CheckCircle, XCircle, Clock } from 'lucide-react';
import api from '@/services/api';

interface Tenant {
  id: string;
  name: string;
  domain: string;
  plan: string;
  status: 'active' | 'suspended' | 'pending' | 'trial';
  users_count: number;
  storage_used: number;
  storage_limit: number;
  created_at: string;
  last_activity: string;
}

export default function TenantsList() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    fetchTenants();
  }, []);

  const fetchTenants = async () => {
    try {
      const response = await api.get('/superadmin/tenants');
      setTenants(response.data.tenants || []);
    } catch (error) {
      console.error('Error fetching tenants:', error);
      // Demo data for development
      setTenants([
        {
          id: '1',
          name: 'Galleria Moderna',
          domain: 'galleria-moderna.florenceegi.com',
          plan: 'Professional',
          status: 'active',
          users_count: 12,
          storage_used: 2.4,
          storage_limit: 10,
          created_at: '2024-06-15',
          last_activity: '2025-12-01',
        },
        {
          id: '2',
          name: 'Arte Contemporanea',
          domain: 'arte-contemporanea.florenceegi.com',
          plan: 'Enterprise',
          status: 'active',
          users_count: 45,
          storage_used: 18.7,
          storage_limit: 50,
          created_at: '2024-03-22',
          last_activity: '2025-12-01',
        },
        {
          id: '3',
          name: 'Museo Digitale',
          domain: 'museo-digitale.florenceegi.com',
          plan: 'Starter',
          status: 'trial',
          users_count: 3,
          storage_used: 0.5,
          storage_limit: 2,
          created_at: '2025-11-20',
          last_activity: '2025-11-30',
        },
        {
          id: '4',
          name: 'Collezione Privata',
          domain: 'collezione-privata.florenceegi.com',
          plan: 'Professional',
          status: 'suspended',
          users_count: 8,
          storage_used: 5.2,
          storage_limit: 10,
          created_at: '2024-09-10',
          last_activity: '2025-10-15',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: Tenant['status']) => {
    const badges = {
      active: <span className="badge badge-success gap-1"><CheckCircle className="w-3 h-3" />Attivo</span>,
      suspended: <span className="badge badge-error gap-1"><XCircle className="w-3 h-3" />Sospeso</span>,
      pending: <span className="badge badge-warning gap-1"><Clock className="w-3 h-3" />In Attesa</span>,
      trial: <span className="badge badge-info gap-1"><Clock className="w-3 h-3" />Trial</span>,
    };
    return badges[status];
  };

  const getPlanBadge = (plan: string) => {
    const colors: Record<string, string> = {
      Starter: 'badge-ghost',
      Professional: 'badge-primary',
      Enterprise: 'badge-secondary',
    };
    return <span className={`badge ${colors[plan] || 'badge-ghost'}`}>{plan}</span>;
  };

  const filteredTenants = tenants.filter(tenant => {
    const matchesSearch = tenant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          tenant.domain.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || tenant.status === statusFilter;
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
            <Building2 className="w-8 h-8 text-primary" />
            Gestione Tenant
          </h1>
          <p className="text-base-content/60 mt-1">
            {tenants.length} tenant registrati sulla piattaforma
          </p>
        </div>
        <Link to="/tenants/create" className="btn btn-primary gap-2">
          <Plus className="w-5 h-5" />
          Nuovo Tenant
        </Link>
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
                  placeholder="Cerca tenant per nome o dominio..."
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
                <option value="trial">Trial</option>
                <option value="suspended">Sospesi</option>
                <option value="pending">In Attesa</option>
              </select>
              <button className="btn btn-ghost gap-2">
                <Filter className="w-4 h-4" />
                Filtri
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tenants Table */}
      <div className="card bg-base-100 shadow-sm">
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Tenant</th>
                <th>Piano</th>
                <th>Stato</th>
                <th>Utenti</th>
                <th>Storage</th>
                <th>Ultima Attività</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filteredTenants.map((tenant) => (
                <tr key={tenant.id} className="hover">
                  <td>
                    <div className="flex items-center gap-3">
                      <div className="avatar placeholder">
                        <div className="bg-primary/10 text-primary rounded-lg w-10 h-10">
                          <Building2 className="w-5 h-5" />
                        </div>
                      </div>
                      <div>
                        <div className="font-bold">{tenant.name}</div>
                        <div className="text-sm text-base-content/60">{tenant.domain}</div>
                      </div>
                    </div>
                  </td>
                  <td>{getPlanBadge(tenant.plan)}</td>
                  <td>{getStatusBadge(tenant.status)}</td>
                  <td>
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-base-content/40" />
                      {tenant.users_count}
                    </div>
                  </td>
                  <td>
                    <div className="flex items-center gap-2">
                      <Database className="w-4 h-4 text-base-content/40" />
                      <div className="flex flex-col">
                        <span>{tenant.storage_used} / {tenant.storage_limit} GB</span>
                        <progress 
                          className="progress progress-primary w-20 h-1" 
                          value={tenant.storage_used} 
                          max={tenant.storage_limit}
                        ></progress>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="flex items-center gap-2 text-sm text-base-content/60">
                      <Calendar className="w-4 h-4" />
                      {new Date(tenant.last_activity).toLocaleDateString('it-IT')}
                    </div>
                  </td>
                  <td>
                    <div className="dropdown dropdown-end">
                      <label tabIndex={0} className="btn btn-ghost btn-sm btn-square">
                        <MoreVertical className="w-4 h-4" />
                      </label>
                      <ul tabIndex={0} className="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-52">
                        <li><Link to={`/tenants/${tenant.id}`}>Visualizza Dettagli</Link></li>
                        <li><Link to={`/tenants/${tenant.id}/edit`}>Modifica</Link></li>
                        <li><a>Gestisci Utenti</a></li>
                        <li><a>Visualizza Logs</a></li>
                        <li className="text-error"><a>Sospendi Tenant</a></li>
                      </ul>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredTenants.length === 0 && (
          <div className="text-center py-12">
            <Building2 className="w-12 h-12 mx-auto text-base-content/20" />
            <p className="mt-4 text-base-content/60">Nessun tenant trovato</p>
          </div>
        )}
      </div>
    </div>
  );
}
