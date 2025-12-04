/**
 * My Projects Page
 * 
 * Shows projects that the current user has access to.
 * For Super Admins, shows all projects.
 * For Project Admins, shows only assigned projects.
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FolderOpen, 
  Star, 
  ShieldCheck,
  Eye,
  ArrowRight,
  CheckCircle,
  AlertCircle,
  Clock
} from 'lucide-react';
import { getMyProjects } from '../../services/projectApi';
import type { MyProject, ProjectAdminRole } from '../../types/project';

const roleIcons: Record<ProjectAdminRole | 'super_admin', React.ReactNode> = {
  super_admin: <Star className="w-4 h-4" />,
  owner: <ShieldCheck className="w-4 h-4" />,
  admin: <FolderOpen className="w-4 h-4" />,
  viewer: <Eye className="w-4 h-4" />,
};

const roleBadgeColors: Record<ProjectAdminRole | 'super_admin', string> = {
  super_admin: 'badge-warning',
  owner: 'badge-primary',
  admin: 'badge-success',
  viewer: 'badge-info',
};

export default function MyProjects() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<MyProject[]>([]);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      setLoading(true);
      const response = await getMyProjects();
      setProjects(response.data);
      setIsSuperAdmin(response.is_super_admin);
      setError(null);
    } catch (err) {
      setError('Impossibile caricare i progetti');
      console.error('Error loading my projects:', err);
    } finally {
      setLoading(false);
    }
  };

  const enterProject = (project: MyProject) => {
    navigate(`/projects/${project.slug}/dashboard`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <span className="loading loading-spinner loading-lg text-primary"></span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-error">
        <AlertCircle className="w-6 h-6" />
        <span>{error}</span>
        <button className="btn btn-sm" onClick={loadProjects}>
          Riprova
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">I Miei Progetti</h1>
          <p className="text-base-content/70 mt-1">
            {isSuperAdmin 
              ? 'Hai accesso Super Admin a tutti i progetti' 
              : `Hai accesso a ${projects.length} progett${projects.length === 1 ? 'o' : 'i'}`
            }
          </p>
        </div>
        
        {isSuperAdmin && (
          <div className="badge badge-warning gap-2">
            <Star className="w-4 h-4" />
            Super Admin EGI
          </div>
        )}
      </div>

      {/* Projects Grid */}
      {projects.length === 0 ? (
        <div className="card bg-base-200 p-12 text-center">
          <FolderOpen className="w-16 h-16 mx-auto text-base-content/30" />
          <h3 className="mt-4 text-lg font-semibold">Nessun progetto accessibile</h3>
          <p className="text-base-content/70 mt-2">
            Non hai ancora accesso a nessun progetto.
            <br />
            Contatta un Super Admin per richiedere l'accesso.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <div 
              key={project.id} 
              className="card bg-base-100 shadow-lg hover:shadow-xl transition-shadow cursor-pointer"
              onClick={() => enterProject(project)}
            >
              <div className="card-body">
                {/* Header */}
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="card-title text-lg">
                      {project.name}
                    </h2>
                    <p className="text-sm text-base-content/60">{project.slug}</p>
                  </div>
                  
                  {/* Health Status */}
                  <div className={`badge ${project.is_healthy ? 'badge-success' : 'badge-error'} gap-1`}>
                    {project.is_healthy 
                      ? <CheckCircle className="w-3 h-3" />
                      : <AlertCircle className="w-3 h-3" />
                    }
                    {project.is_healthy ? 'Online' : 'Offline'}
                  </div>
                </div>

                {/* Description */}
                {project.description && (
                  <p className="text-sm text-base-content/70 line-clamp-2 mt-2">
                    {project.description}
                  </p>
                )}

                {/* Access Role Badge */}
                {project.access && (
                  <div className="flex items-center gap-2 mt-3">
                    <div className={`badge ${roleBadgeColors[project.access.role]} gap-1`}>
                      {roleIcons[project.access.role]}
                      {project.access.role_label}
                    </div>
                    
                    {project.access.expires_at && (
                      <div className="badge badge-ghost gap-1">
                        <Clock className="w-3 h-3" />
                        Scade: {new Date(project.access.expires_at).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                )}

                {/* Permissions Summary */}
                {project.access && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {project.access.permissions.can_manage_tenants && (
                      <span className="badge badge-xs badge-outline">Tenant</span>
                    )}
                    {project.access.permissions.can_manage_settings && (
                      <span className="badge badge-xs badge-outline">Settings</span>
                    )}
                    {project.access.permissions.can_manage_admins && (
                      <span className="badge badge-xs badge-outline">Admin</span>
                    )}
                    {project.access.permissions.can_export && (
                      <span className="badge badge-xs badge-outline">Export</span>
                    )}
                  </div>
                )}

                {/* Actions */}
                <div className="card-actions justify-end mt-4">
                  <button className="btn btn-primary btn-sm gap-1">
                    Entra
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Info Card for Regular Users */}
      {!isSuperAdmin && projects.length > 0 && (
        <div className="alert alert-info">
          <ShieldCheck className="w-6 h-6" />
          <div>
            <h4 className="font-bold">Gestione Accessi</h4>
            <p className="text-sm">
              I tuoi accessi sono gestiti dai Project Owner.
              Contatta il responsabile del progetto per modifiche ai permessi.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
