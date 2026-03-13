/**
 * Project Users List
 *
 * Mostra gli utenti del progetto dalla tabella users condivisa,
 * filtrati per system_project_id e raggruppati per tenant.
 */

import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Users,
  ShieldCheck,
  Building2,
  AlertCircle,
  CheckCircle,
  Crown,
  User,
} from 'lucide-react';
import { getProjectUsers } from '../../services/projectApi';
import type { ProjectUser, ProjectUsersMeta } from '../../types/project';

const usertypeLabel: Record<string, string> = {
  pa_entity_admin: 'Admin PA',
  pa_entity:       'Utente PA',
  creator:         'Creator',
  admin:           'Admin',
  user:            'Utente',
};

const usertypeBadge: Record<string, string> = {
  pa_entity_admin: 'bg-blue-100 text-blue-800',
  pa_entity:       'bg-gray-100 text-gray-700',
  creator:         'bg-purple-100 text-purple-800',
  admin:           'bg-green-100 text-green-800',
  user:            'bg-gray-100 text-gray-600',
};

function UserTypeIcon({ usertype }: { usertype: string | null }) {
  if (usertype === 'pa_entity_admin' || usertype === 'admin') {
    return <Crown className="w-4 h-4 inline mr-1" />;
  }
  if (usertype === 'creator') {
    return <ShieldCheck className="w-4 h-4 inline mr-1" />;
  }
  return <User className="w-4 h-4 inline mr-1" />;
}

export default function ProjectAdminsList() {
  const { slug } = useParams<{ slug: string }>();

  const [users, setUsers] = useState<ProjectUser[]>([]);
  const [meta, setMeta] = useState<ProjectUsersMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (slug) loadUsers();
  }, [slug]);

  const loadUsers = async () => {
    if (!slug) return;
    try {
      setLoading(true);
      const response = await getProjectUsers(slug);
      setUsers(response.data);
      setMeta(response.meta);
      setError(null);
    } catch (err) {
      setError('Impossibile caricare gli utenti del progetto');
      console.error('Error loading project users:', err);
    } finally {
      setLoading(false);
    }
  };

  // Raggruppa per tenant
  const byTenant = users.reduce<Record<string, { tenantName: string; tenantSlug: string; entityType: string | null; users: ProjectUser[] }>>(
    (acc, u) => {
      const key = u.tenant ? String(u.tenant.id) : 'no_tenant';
      if (!acc[key]) {
        acc[key] = {
          tenantName: u.tenant?.name ?? 'Senza tenant',
          tenantSlug: u.tenant?.slug ?? '',
          entityType: u.tenant?.entity_type ?? null,
          users: [],
        };
      }
      acc[key].users.push(u);
      return acc;
    },
    {}
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <span className="loading loading-spinner loading-lg text-primary"></span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm breadcrumbs">
        <Link to="/my-projects" className="link link-hover">I Miei Progetti</Link>
        <span>/</span>
        <Link to={`/project/${slug}`} className="link link-hover">{slug}</Link>
        <span>/</span>
        <span className="font-medium">Utenti</span>
      </div>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Users className="w-7 h-7" />
            Utenti del Progetto
          </h1>
          <p className="text-base-content/70 mt-1">
            Utenti registrati su questo progetto, raggruppati per tenant
          </p>
        </div>
      </div>

      {/* Stats */}
      {meta && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl shadow p-4 text-center border border-gray-100">
            <div className="text-sm text-gray-500 mb-1">Totale utenti</div>
            <div className="text-3xl font-bold text-gray-800">{meta.total}</div>
          </div>
          <div className="bg-white rounded-xl shadow p-4 text-center border border-gray-100">
            <div className="text-sm text-gray-500 mb-1">Admin</div>
            <div className="text-3xl font-bold text-blue-600">{meta.admins}</div>
          </div>
          <div className="bg-white rounded-xl shadow p-4 text-center border border-gray-100">
            <div className="text-sm text-gray-500 mb-1">Tenant</div>
            <div className="text-3xl font-bold text-green-600">{Object.keys(byTenant).length}</div>
          </div>
          <div className="bg-white rounded-xl shadow p-4 text-center border border-gray-100">
            <div className="text-sm text-gray-500 mb-1">Tipi utente</div>
            <div className="text-3xl font-bold text-purple-600">{Object.keys(meta.by_usertype).length}</div>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="alert alert-error">
          <AlertCircle className="w-6 h-6" />
          <span>{error}</span>
          <button className="btn btn-sm" onClick={loadUsers}>Riprova</button>
        </div>
      )}

      {/* Utenti per tenant */}
      {Object.keys(byTenant).length === 0 ? (
        <div className="bg-white rounded-xl shadow p-8 text-center text-gray-400 border border-gray-100">
          Nessun utente trovato per questo progetto
        </div>
      ) : (
        Object.entries(byTenant).map(([key, group]) => (
          <div key={key} className="bg-white rounded-xl shadow border border-gray-100 overflow-hidden">
            {/* Tenant header */}
            <div className="flex items-center gap-3 px-5 py-3 bg-gray-50 border-b border-gray-100">
              <Building2 className="w-5 h-5 text-gray-400" />
              <div>
                <span className="font-semibold text-gray-800">{group.tenantName}</span>
                {group.entityType && (
                  <span className="ml-2 text-xs text-gray-500 uppercase tracking-wide">{group.entityType}</span>
                )}
              </div>
              <span className="ml-auto text-sm text-gray-400">{group.users.length} utenti</span>
            </div>

            {/* Tabella utenti */}
            <div className="overflow-x-auto">
              <table className="table table-zebra w-full">
                <thead>
                  <tr>
                    <th>Nome</th>
                    <th>Email</th>
                    <th>Tipo</th>
                    <th>Ruolo piattaforma</th>
                    <th>Stato</th>
                    <th>Ultima attività</th>
                  </tr>
                </thead>
                <tbody>
                  {group.users.map((u) => (
                    <tr key={u.id}>
                      <td>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{u.name || '—'}</span>
                          {u.is_super_admin && (
                            <span className="badge badge-warning badge-sm">Super Admin</span>
                          )}
                        </div>
                      </td>
                      <td className="text-sm text-gray-600">{u.email}</td>
                      <td>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${usertypeBadge[u.usertype ?? ''] ?? 'bg-gray-100 text-gray-600'}`}>
                          <UserTypeIcon usertype={u.usertype} />
                          {usertypeLabel[u.usertype ?? ''] ?? u.usertype ?? '—'}
                        </span>
                      </td>
                      <td>
                        {u.platform_role ? (
                          <span className="badge badge-outline badge-sm">{u.platform_role}</span>
                        ) : (
                          <span className="text-gray-300">—</span>
                        )}
                      </td>
                      <td>
                        {u.status === 'active' || u.status === null ? (
                          <span className="flex items-center gap-1 text-green-600 text-sm">
                            <CheckCircle className="w-3.5 h-3.5" /> Attivo
                          </span>
                        ) : (
                          <span className="badge badge-error badge-sm">{u.status}</span>
                        )}
                      </td>
                      <td className="text-sm text-gray-400">
                        {u.last_active_at
                          ? new Date(u.last_active_at).toLocaleDateString('it-IT')
                          : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
