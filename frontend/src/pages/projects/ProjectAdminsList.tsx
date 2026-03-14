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
  Mail,
  Clock,
  RefreshCw,
} from 'lucide-react';
import { getProjectUsers, resendBootstrapInvite } from '../../services/projectApi';
import type { ProjectUser, ProjectUsersMeta, PendingBootstrap } from '../../types/project';

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
  const [pendingInvites, setPendingInvites] = useState<PendingBootstrap[]>([]);
  const [meta, setMeta] = useState<ProjectUsersMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [resendingId, setResendingId] = useState<number | null>(null);
  const [resendMsg, setResendMsg] = useState<{ id: number; ok: boolean; text: string } | null>(null);

  useEffect(() => {
    if (slug) loadUsers();
  }, [slug]);

  const loadUsers = async () => {
    if (!slug) return;
    try {
      setLoading(true);
      const response = await getProjectUsers(slug);
      setUsers(response.data);
      setPendingInvites(response.pending_invites);
      setMeta(response.meta);
      setError(null);
    } catch (err) {
      setError('Impossibile caricare gli utenti del progetto');
      console.error('Error loading project users:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async (bootstrap: PendingBootstrap) => {
    setResendingId(bootstrap.id);
    setResendMsg(null);
    try {
      const res = await resendBootstrapInvite(bootstrap.id);
      setResendMsg({ id: bootstrap.id, ok: res.success, text: res.message ?? 'Invito reinviato.' });
      await loadUsers();
    } catch {
      setResendMsg({ id: bootstrap.id, ok: false, text: 'Errore durante il reinvio.' });
    } finally {
      setResendingId(null);
    }
  };

  // Raggruppa utenti + bootstrap per tenant
  type TenantGroup = {
    tenantName: string;
    tenantSlug: string;
    entityType: string | null;
    users: ProjectUser[];
    bootstraps: PendingBootstrap[];
  };

  const byTenant = users.reduce<Record<string, TenantGroup>>(
    (acc, u) => {
      const key = u.tenant ? String(u.tenant.id) : 'no_tenant';
      if (!acc[key]) {
        acc[key] = {
          tenantName: u.tenant?.name ?? 'Senza tenant',
          tenantSlug: u.tenant?.slug ?? '',
          entityType: u.tenant?.entity_type ?? null,
          users: [],
          bootstraps: [],
        };
      }
      acc[key].users.push(u);
      return acc;
    },
    {}
  );

  // Aggiungi i bootstrap ai rispettivi gruppi (crea il gruppo se non esiste)
  pendingInvites.forEach((b) => {
    const key = b.tenant ? String(b.tenant.id) : 'no_tenant';
    if (!byTenant[key]) {
      byTenant[key] = {
        tenantName: b.tenant?.name ?? 'Senza tenant',
        tenantSlug: b.tenant?.slug ?? '',
        entityType: b.tenant?.entity_type ?? null,
        users: [],
        bootstraps: [],
      };
    }
    byTenant[key].bootstraps.push(b);
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
            <div className="text-sm text-gray-500 mb-1">Inviti pendenti</div>
            <div className="text-3xl font-bold text-amber-500">{pendingInvites.length}</div>
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
              <div className="ml-auto flex items-center gap-3 text-sm text-gray-400">
                {group.bootstraps.length > 0 && (
                  <span className="flex items-center gap-1 text-amber-500 font-medium">
                    <Clock className="w-3.5 h-3.5" />
                    {group.bootstraps.length} in attesa
                  </span>
                )}
                <span>{group.users.length} utenti</span>
              </div>
            </div>

            {/* Inviti pendenti */}
            {group.bootstraps.length > 0 && (
              <div className="border-b border-amber-100 bg-amber-50">
                <div className="px-5 py-2 text-xs font-semibold text-amber-700 uppercase tracking-wide flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5" /> Inviti in attesa di attivazione
                </div>
                <div className="overflow-x-auto">
                  <table className="table w-full text-sm">
                    <thead>
                      <tr className="text-amber-700 bg-amber-50">
                        <th>Nome</th>
                        <th>Email</th>
                        <th>Ruolo</th>
                        <th>Stato</th>
                        <th>Scadenza invito</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {group.bootstraps.map((b) => (
                        <tr key={`bootstrap-${b.id}`} className="bg-amber-50/50">
                          <td className="font-medium text-gray-700">{b.name || '—'}</td>
                          <td className="text-gray-600">{b.email}</td>
                          <td className="text-gray-500">{b.job_title || '—'}</td>
                          <td>
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${
                              b.status === 'invited'
                                ? 'bg-blue-100 text-blue-700'
                                : 'bg-gray-100 text-gray-600'
                            }`}>
                              {b.status === 'invited'
                                ? <><Mail className="w-3 h-3" /> Invitato</>
                                : <><Clock className="w-3 h-3" /> In attesa</>
                              }
                            </span>
                          </td>
                          <td className="text-gray-400 text-xs">
                            {b.invitation_expires_at ? (
                              b.is_expired
                                ? <span className="text-red-500">Scaduto</span>
                                : new Date(b.invitation_expires_at).toLocaleDateString('it-IT')
                            ) : '—'}
                          </td>
                          <td>
                            {b.can_resend && (
                              <button
                                className="btn btn-xs btn-outline btn-warning gap-1"
                                disabled={resendingId === b.id}
                                onClick={() => handleResend(b)}
                              >
                                {resendingId === b.id
                                  ? <span className="loading loading-spinner loading-xs"></span>
                                  : <RefreshCw className="w-3 h-3" />
                                }
                                Reinvia
                              </button>
                            )}
                            {resendMsg?.id === b.id && (
                              <span className={`ml-2 text-xs ${resendMsg.ok ? 'text-green-600' : 'text-red-500'}`}>
                                {resendMsg.text}
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Tabella utenti attivi */}
            {group.users.length > 0 && (
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
            )}
          </div>
        ))
      )}
    </div>
  );
}
