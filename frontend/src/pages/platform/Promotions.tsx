import { useQuery } from '@tanstack/react-query';
import { Megaphone, Loader2, AlertCircle, Plus, Edit, Trash2, Calendar } from 'lucide-react';
import api from '../../services/api';

interface Promotion {
  id: number;
  name: string;
  code: string;
  discount_percent: number;
  discount_egili: number;
  valid_from: string;
  valid_until: string;
  usage_count: number;
  max_usage: number | null;
  is_active: boolean;
}

interface PromotionsResponse {
  promotions: Promotion[];
}

export default function Promotions() {
  const { data, isLoading, error } = useQuery<PromotionsResponse>({
    queryKey: ['platform-promotions'],
    queryFn: () => api.get('/superadmin/platform/promotions').then(res => res.data),
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
        <span>Errore nel caricamento delle promozioni. Assicurati che il backend EGI sia attivo.</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-base-content">Promozioni</h1>
          <p className="text-base-content/60">Gestione delle promozioni e codici sconto</p>
        </div>
        <button className="btn btn-primary gap-2">
          <Plus className="w-4 h-4" />
          Nuova Promozione
        </button>
      </div>

      {/* Promotions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {data?.promotions?.length ? (
          data.promotions.map((promo) => (
            <div key={promo.id} className={`card bg-base-100 shadow-xl ${!promo.is_active ? 'opacity-60' : ''}`}>
              <div className="card-body">
                <div className="flex items-center justify-between">
                  <h3 className="card-title">{promo.name}</h3>
                  <span className={`badge ${promo.is_active ? 'badge-success' : 'badge-error'}`}>
                    {promo.is_active ? 'Attiva' : 'Inattiva'}
                  </span>
                </div>
                <code className="bg-primary/10 text-primary px-3 py-2 rounded-lg text-center font-mono text-lg">
                  {promo.code}
                </code>
                <div className="flex justify-between text-sm mt-2">
                  {promo.discount_percent > 0 && (
                    <span className="text-success font-semibold">-{promo.discount_percent}%</span>
                  )}
                  {promo.discount_egili > 0 && (
                    <span className="text-yellow-600 font-semibold">+{promo.discount_egili} EGILI</span>
                  )}
                </div>
                <div className="flex items-center gap-2 text-sm text-base-content/60 mt-2">
                  <Calendar className="w-4 h-4" />
                  <span>{new Date(promo.valid_from).toLocaleDateString('it-IT')} - {new Date(promo.valid_until).toLocaleDateString('it-IT')}</span>
                </div>
                <div className="text-sm text-base-content/60">
                  Utilizzi: {promo.usage_count}{promo.max_usage ? ` / ${promo.max_usage}` : ' (illimitati)'}
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
            <Megaphone className="w-12 h-12 mx-auto text-base-content/30 mb-4" />
            <p className="text-base-content/60">Nessuna promozione configurata</p>
          </div>
        )}
      </div>
    </div>
  );
}
