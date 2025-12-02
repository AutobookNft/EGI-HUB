import { useQuery } from '@tanstack/react-query';
import { Users, Loader2, AlertCircle, Shield, Edit, Trash2, Plus } from 'lucide-react';
import api from '../../services/api';

interface Role {
  id: number;
  name: string;
  slug: string;
  description: string;
  users_count: number;
  permissions_count: number;
  created_at: string;
}

interface RolesResponse {
  roles: Role[];
}

export default function Roles() {
  const { data, isLoading, error } = useQuery<RolesResponse>({
    queryKey: ['platform-roles'],
    queryFn: () => api.get('/superadmin/platform/roles').then(res => res.data),
  });

  if (isLoading) {
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
        <span>Errore nel caricamento dei ruoli. Assicurati che il backend EGI sia attivo.</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-base-content">Gestione Ruoli</h1>
          <p className="text-base-content/60">Configura ruoli e permessi della piattaforma</p>
        </div>
        <button className="btn btn-primary gap-2">
          <Plus className="w-4 h-4" />
          Nuovo Ruolo
        </button>
      </div>

      {/* Roles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {data?.roles?.length ? (
          data.roles.map((role) => (
            <div key={role.id} className="card bg-base-100 shadow-xl">
              <div className="card-body">
                <div className="flex items-center gap-3">
                  <div className="avatar placeholder">
                    <div className="bg-primary text-primary-content rounded-full w-12">
                      <Shield className="w-6 h-6" />
                    </div>
                  </div>
                  <div>
                    <h3 className="font-bold">{role.name}</h3>
                    <span className="badge badge-ghost text-xs">{role.slug}</span>
                  </div>
                </div>
                <p className="text-sm text-base-content/60 mt-2">{role.description}</p>
                <div className="flex gap-4 mt-4 text-sm">
                  <div>
                    <span className="font-semibold text-primary">{role.users_count}</span>
                    <span className="text-base-content/60 ml-1">utenti</span>
                  </div>
                  <div>
                    <span className="font-semibold text-secondary">{role.permissions_count}</span>
                    <span className="text-base-content/60 ml-1">permessi</span>
                  </div>
                </div>
                <div className="card-actions justify-end mt-4">
                  <button className="btn btn-ghost btn-sm">
                    <Edit className="w-4 h-4" />
                  </button>
                  <button className="btn btn-ghost btn-sm text-error">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full text-center py-12">
            <Users className="w-12 h-12 mx-auto text-base-content/30 mb-4" />
            <p className="text-base-content/60">Nessun ruolo configurato</p>
          </div>
        )}
      </div>
    </div>
  );
}
