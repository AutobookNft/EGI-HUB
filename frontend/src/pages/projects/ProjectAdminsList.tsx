/**
 * Project Admins List
 * 
 * Manage users who have access to a specific project.
 * Only Project Owners can add/modify/remove admins.
 */

import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  ArrowLeftIcon,
  UserPlusIcon,
  ShieldCheckIcon,
  StarIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  PauseIcon,
  PlayIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationCircleIcon
} from '@heroicons/react/24/outline';
import { 
  getProjectAdmins, 
  deleteProjectAdmin, 
  suspendProjectAdmin, 
  reactivateProjectAdmin 
} from '../../services/projectApi';
import type { ProjectAdmin, ProjectAdminRole, ProjectAdminsMeta } from '../../types/project';

const roleIcons: Record<ProjectAdminRole, React.ReactNode> = {
  owner: <StarIcon className="w-4 h-4" />,
  admin: <ShieldCheckIcon className="w-4 h-4" />,
  viewer: <EyeIcon className="w-4 h-4" />,
};

const roleBadgeColors: Record<ProjectAdminRole, string> = {
  owner: 'badge-primary',
  admin: 'badge-success',
  viewer: 'badge-info',
};

export default function ProjectAdminsList() {
  const { slug } = useParams<{ slug: string }>();
  
  const [admins, setAdmins] = useState<ProjectAdmin[]>([]);
  const [meta, setMeta] = useState<ProjectAdminsMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  useEffect(() => {
    if (slug) {
      loadAdmins();
    }
  }, [slug]);

  const loadAdmins = async () => {
    if (!slug) return;
    
    try {
      setLoading(true);
      const response = await getProjectAdmins(slug);
      setAdmins(response.data);
      setMeta(response.meta);
      setError(null);
    } catch (err) {
      setError('Impossibile caricare gli admin del progetto');
      console.error('Error loading project admins:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSuspend = async (admin: ProjectAdmin) => {
    if (!slug) return;
    
    const reason = prompt('Motivo della sospensione (opzionale):');
    if (reason === null) return; // Cancelled
    
    try {
      setActionLoading(admin.id);
      await suspendProjectAdmin(slug, admin.id, reason || undefined);
      await loadAdmins();
    } catch (err) {
      console.error('Error suspending admin:', err);
      alert('Impossibile sospendere l\'admin');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReactivate = async (admin: ProjectAdmin) => {
    if (!slug) return;
    
    try {
      setActionLoading(admin.id);
      await reactivateProjectAdmin(slug, admin.id);
      await loadAdmins();
    } catch (err) {
      console.error('Error reactivating admin:', err);
      alert('Impossibile riattivare l\'admin');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (admin: ProjectAdmin) => {
    if (!slug) return;
    
    if (!confirm(`Sei sicuro di voler rimuovere ${admin.user.name} dal progetto?`)) {
      return;
    }
    
    try {
      setActionLoading(admin.id);
      await deleteProjectAdmin(slug, admin.id);
      await loadAdmins();
    } catch (err: any) {
      console.error('Error deleting admin:', err);
      alert(err.response?.data?.message || 'Impossibile rimuovere l\'admin');
    } finally {
      setActionLoading(null);
    }
  };

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
        <Link to={`/projects/${slug}/dashboard`} className="link link-hover">{slug}</Link>
        <span>/</span>
        <span className="font-medium">Admins</span>
      </div>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ShieldCheckIcon className="w-7 h-7" />
            Project Admins
          </h1>
          <p className="text-base-content/70 mt-1">
            Gestisci chi ha accesso a questo progetto
          </p>
        </div>

        <Link 
          to={`/projects/${slug}/admins/new`}
          className="btn btn-primary gap-2"
        >
          <UserPlusIcon className="w-5 h-5" />
          Aggiungi Admin
        </Link>
      </div>

      {/* Stats */}
      {meta && (
        <div className="stats shadow bg-base-100">
          <div className="stat">
            <div className="stat-title">Totale</div>
            <div className="stat-value text-2xl">{meta.total}</div>
          </div>
          <div className="stat">
            <div className="stat-title">Owner</div>
            <div className="stat-value text-2xl text-primary">{meta.owners}</div>
          </div>
          <div className="stat">
            <div className="stat-title">Admin</div>
            <div className="stat-value text-2xl text-success">{meta.admins}</div>
          </div>
          <div className="stat">
            <div className="stat-title">Viewer</div>
            <div className="stat-value text-2xl text-info">{meta.viewers}</div>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="alert alert-error">
          <ExclamationCircleIcon className="w-6 h-6" />
          <span>{error}</span>
          <button className="btn btn-sm" onClick={loadAdmins}>Riprova</button>
        </div>
      )}

      {/* Admins Table */}
      <div className="card bg-base-100 shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table table-zebra">
            <thead>
              <tr>
                <th>Utente</th>
                <th>Ruolo</th>
                <th>Stato</th>
                <th>Assegnato da</th>
                <th>Scadenza</th>
                <th>Azioni</th>
              </tr>
            </thead>
            <tbody>
              {admins.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-base-content/60">
                    Nessun admin assegnato a questo progetto
                  </td>
                </tr>
              ) : (
                admins.map((admin) => (
                  <tr key={admin.id} className={!admin.is_valid ? 'opacity-50' : ''}>
                    {/* User */}
                    <td>
                      <div>
                        <div className="font-medium">{admin.user.name}</div>
                        <div className="text-sm text-base-content/60">{admin.user.email}</div>
                      </div>
                    </td>
                    
                    {/* Role */}
                    <td>
                      <div className={`badge ${roleBadgeColors[admin.role]} gap-1`}>
                        {roleIcons[admin.role]}
                        {admin.role_label}
                      </div>
                    </td>
                    
                    {/* Status */}
                    <td>
                      {admin.is_valid ? (
                        <div className="badge badge-success gap-1">
                          <CheckCircleIcon className="w-3 h-3" />
                          Attivo
                        </div>
                      ) : admin.is_active ? (
                        <div className="badge badge-warning gap-1">
                          <ClockIcon className="w-3 h-3" />
                          Scaduto
                        </div>
                      ) : (
                        <div className="badge badge-error gap-1">
                          <PauseIcon className="w-3 h-3" />
                          Sospeso
                        </div>
                      )}
                    </td>
                    
                    {/* Assigned by */}
                    <td>
                      {admin.assigned_by ? (
                        <div className="text-sm">
                          {admin.assigned_by.name}
                          <br />
                          <span className="text-base-content/60">
                            {admin.assigned_at && new Date(admin.assigned_at).toLocaleDateString()}
                          </span>
                        </div>
                      ) : (
                        <span className="text-base-content/40">—</span>
                      )}
                    </td>
                    
                    {/* Expiration */}
                    <td>
                      {admin.expires_at ? (
                        <div className="text-sm">
                          <div className={new Date(admin.expires_at) < new Date() ? 'text-error' : ''}>
                            {new Date(admin.expires_at).toLocaleDateString()}
                          </div>
                        </div>
                      ) : (
                        <span className="badge badge-ghost">Mai</span>
                      )}
                    </td>
                    
                    {/* Actions */}
                    <td>
                      <div className="flex gap-1">
                        {/* Edit */}
                        <Link 
                          to={`/projects/${slug}/admins/${admin.id}/edit`}
                          className="btn btn-ghost btn-xs"
                          title="Modifica"
                        >
                          <PencilIcon className="w-4 h-4" />
                        </Link>
                        
                        {/* Suspend/Reactivate */}
                        {admin.is_active ? (
                          <button 
                            className="btn btn-ghost btn-xs text-warning"
                            onClick={() => handleSuspend(admin)}
                            disabled={actionLoading === admin.id}
                            title="Sospendi"
                          >
                            {actionLoading === admin.id ? (
                              <span className="loading loading-spinner loading-xs"></span>
                            ) : (
                              <PauseIcon className="w-4 h-4" />
                            )}
                          </button>
                        ) : (
                          <button 
                            className="btn btn-ghost btn-xs text-success"
                            onClick={() => handleReactivate(admin)}
                            disabled={actionLoading === admin.id}
                            title="Riattiva"
                          >
                            {actionLoading === admin.id ? (
                              <span className="loading loading-spinner loading-xs"></span>
                            ) : (
                              <PlayIcon className="w-4 h-4" />
                            )}
                          </button>
                        )}
                        
                        {/* Delete */}
                        <button 
                          className="btn btn-ghost btn-xs text-error"
                          onClick={() => handleDelete(admin)}
                          disabled={actionLoading === admin.id}
                          title="Rimuovi"
                        >
                          {actionLoading === admin.id ? (
                            <span className="loading loading-spinner loading-xs"></span>
                          ) : (
                            <TrashIcon className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Info */}
      <div className="alert alert-info">
        <ShieldCheckIcon className="w-6 h-6" />
        <div>
          <h4 className="font-bold">Gerarchia dei Ruoli</h4>
          <ul className="text-sm mt-1 space-y-1">
            <li><strong>Owner:</strong> Accesso completo, può gestire altri admin</li>
            <li><strong>Admin:</strong> Può gestire tenant e configurazioni</li>
            <li><strong>Viewer:</strong> Solo visualizzazione</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
