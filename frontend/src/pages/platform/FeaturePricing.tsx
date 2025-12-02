import { useQuery } from '@tanstack/react-query';
import { DollarSign, Loader2, AlertCircle, Edit, Plus } from 'lucide-react';
import api from '../../services/api';

interface FeaturePrice {
  id: number;
  feature_key: string;
  feature_name: string;
  price_egili: number;
  price_eur: number;
  is_active: boolean;
  description: string;
}

interface FeaturePricingResponse {
  features: FeaturePrice[];
}

export default function FeaturePricing() {
  const { data, isLoading, error } = useQuery<FeaturePricingResponse>({
    queryKey: ['platform-pricing'],
    queryFn: () => api.get('/superadmin/platform/pricing').then(res => res.data),
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
        <span>Errore nel caricamento dei prezzi. Assicurati che il backend EGI sia attivo.</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-base-content">Feature Pricing</h1>
          <p className="text-base-content/60">Configura i prezzi delle funzionalità della piattaforma</p>
        </div>
        <button className="btn btn-primary gap-2">
          <Plus className="w-4 h-4" />
          Nuova Feature
        </button>
      </div>

      {/* Pricing Table */}
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Feature</th>
                  <th>Chiave</th>
                  <th>Prezzo Egili</th>
                  <th>Prezzo EUR</th>
                  <th>Stato</th>
                  <th>Azioni</th>
                </tr>
              </thead>
              <tbody>
                {data?.features?.length ? (
                  data.features.map((feature) => (
                    <tr key={feature.id}>
                      <td>
                        <div>
                          <div className="font-bold">{feature.feature_name}</div>
                          <div className="text-sm text-base-content/60">{feature.description}</div>
                        </div>
                      </td>
                      <td><code className="text-xs bg-base-200 px-2 py-1 rounded">{feature.feature_key}</code></td>
                      <td>
                        <span className="font-semibold text-yellow-600">{feature.price_egili}</span>
                        <span className="text-xs text-base-content/60 ml-1">EGILI</span>
                      </td>
                      <td>
                        <span className="font-semibold">€{feature.price_eur.toFixed(2)}</span>
                      </td>
                      <td>
                        <span className={`badge ${feature.is_active ? 'badge-success' : 'badge-error'}`}>
                          {feature.is_active ? 'Attivo' : 'Disattivo'}
                        </span>
                      </td>
                      <td>
                        <button className="btn btn-ghost btn-sm">
                          <Edit className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="text-center py-12">
                      <DollarSign className="w-12 h-12 mx-auto text-base-content/30 mb-4" />
                      <p className="text-base-content/60">Nessuna feature configurata</p>
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
