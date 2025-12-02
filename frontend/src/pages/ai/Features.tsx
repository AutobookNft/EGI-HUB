import { useQuery } from '@tanstack/react-query';
import { ToggleLeft, Loader2, AlertCircle, Check, X } from 'lucide-react';
import api from '../../services/api';

interface Feature {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  limit: number | null;
  usage: number;
}

interface FeaturesResponse {
  features: Feature[];
}

export default function Features() {
  const { data, isLoading, error } = useQuery<FeaturesResponse>({
    queryKey: ['ai-features'],
    queryFn: () => api.get('/superadmin/ai/features').then(res => res.data),
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
        <span>Errore nel caricamento delle features. Assicurati che il backend EGI sia attivo.</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-base-content">AI Features</h1>
        <p className="text-base-content/60">Gestione delle funzionalità AI della piattaforma</p>
      </div>

      {/* Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {data?.features?.length ? (
          data.features.map((feature) => (
            <div key={feature.id} className="card bg-base-100 shadow-xl">
              <div className="card-body">
                <div className="flex items-center justify-between">
                  <h3 className="card-title text-lg">{feature.name}</h3>
                  <label className="swap">
                    <input type="checkbox" checked={feature.enabled} readOnly />
                    <div className="swap-on">
                      <span className="badge badge-success gap-1">
                        <Check className="w-3 h-3" /> Attivo
                      </span>
                    </div>
                    <div className="swap-off">
                      <span className="badge badge-error gap-1">
                        <X className="w-3 h-3" /> Disattivo
                      </span>
                    </div>
                  </label>
                </div>
                <p className="text-sm text-base-content/60">{feature.description}</p>
                {feature.limit && (
                  <div className="mt-2">
                    <div className="flex justify-between text-sm mb-1">
                      <span>Utilizzo</span>
                      <span>{feature.usage} / {feature.limit}</span>
                    </div>
                    <progress
                      className="progress progress-primary"
                      value={feature.usage}
                      max={feature.limit}
                    />
                  </div>
                )}
                <div className="card-actions justify-end mt-4">
                  <button className="btn btn-sm btn-ghost">Configura</button>
                  <button className="btn btn-sm btn-primary">
                    {feature.enabled ? 'Disabilita' : 'Abilita'}
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full text-center py-12">
            <ToggleLeft className="w-12 h-12 mx-auto text-base-content/30 mb-4" />
            <p className="text-base-content/60">Nessuna feature configurata</p>
          </div>
        )}
      </div>
    </div>
  );
}
