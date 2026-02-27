import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DollarSign, Loader2, AlertCircle, Edit2, Check, X, Trash2, ToggleLeft, ToggleRight } from 'lucide-react';
import api from '../../services/api';

// === TYPES — allineati ai campi reali di ai_feature_pricing ===

interface AiFeaturePricing {
  id: number;
  feature_code: string;
  feature_name: string;
  feature_description: string | null;
  feature_category: string;
  bundle_type: string | null;
  cost_egili: number;
  cost_fiat_eur: string | null;
  is_active: boolean;
  is_free: boolean;
  is_bundle: boolean;
  is_featured: boolean;
  feature_parameters: Record<string, unknown> | null;
  display_order: number;
  total_purchases: number;
  admin_notes: string | null;
  ai_tokens_included: number | null;
  ai_tokens_bonus_percentage: number;
}

interface ApiResponse {
  success: boolean;
  data: AiFeaturePricing[];
  total: number;
}

// === LABEL MAPS ===

const CATEGORY_LABELS: Record<string, string> = {
  ai_services: 'Servizi AI',
  platform_services: 'Servizi Piattaforma',
  premium_visibility: 'Visibilità Premium',
  governance: 'Governance',
};

const BUNDLE_LABELS: Record<string, string> = {
  credit_package: 'Pacchetto Crediti',
  subscription: 'Abbonamento',
  one_time: 'Singolo Acquisto',
};

const labelCategory = (key: string) => CATEGORY_LABELS[key] ?? key;
const labelBundle = (key: string) => BUNDLE_LABELS[key] ?? key;

// === COMPONENT ===

export default function FeaturePricing() {
  const queryClient = useQueryClient();

  // Filtri
  const [filterCategory, setFilterCategory] = useState('');
  const [filterBundleType, setFilterBundleType] = useState('');
  const [filterActive, setFilterActive] = useState<'' | '1' | '0'>('');

  // Edit inline
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editValues, setEditValues] = useState<{ cost_egili: string; cost_fiat_eur: string; ai_tokens_included: string; ai_tokens_bonus_percentage: string }>({
    cost_egili: '',
    cost_fiat_eur: '',
    ai_tokens_included: '',
    ai_tokens_bonus_percentage: '0',
  });

  // === QUERY ===
  const { data, isLoading, error } = useQuery<ApiResponse>({
    queryKey: ['platform-pricing', filterCategory, filterBundleType, filterActive],
    queryFn: () => {
      const params = new URLSearchParams();
      if (filterCategory) params.set('category', filterCategory);
      if (filterBundleType) params.set('bundle_type', filterBundleType);
      if (filterActive !== '') params.set('is_active', filterActive);
      return api.get('/superadmin/platform/pricing?' + params.toString()).then(res => res.data);
    },
  });

  // === MUTATION: toggle is_active ===
  const toggleMutation = useMutation({
    mutationFn: ({ id, is_active }: { id: number; is_active: boolean }) =>
      api.put('/superadmin/platform/pricing/' + id, { is_active }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['platform-pricing'] }),
  });

  // === MUTATION: update prezzi ===
  const updateMutation = useMutation({
    mutationFn: ({ id, cost_egili, cost_fiat_eur, ai_tokens_included, ai_tokens_bonus_percentage }: { id: number; cost_egili: number; cost_fiat_eur: number | null; ai_tokens_included: number | null; ai_tokens_bonus_percentage: number }) =>
      api.put('/superadmin/platform/pricing/' + id, { cost_egili, cost_fiat_eur, ai_tokens_included, ai_tokens_bonus_percentage }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['platform-pricing'] });
      setEditingId(null);
    },
  });

  // === MUTATION: delete ===
  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete('/superadmin/platform/pricing/' + id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['platform-pricing'] }),
  });

  // === HANDLERS ===
  const startEdit = (item: AiFeaturePricing) => {
    setEditingId(item.id);
    setEditValues({
      cost_egili: String(item.cost_egili ?? 0),
      cost_fiat_eur: item.cost_fiat_eur ?? '',
      ai_tokens_included: item.ai_tokens_included != null ? String(item.ai_tokens_included) : '',
      ai_tokens_bonus_percentage: String(item.ai_tokens_bonus_percentage ?? 0),
    });
  };

  const cancelEdit = () => setEditingId(null);

  const saveEdit = (id: number) => {
    const egili = parseInt(editValues.cost_egili, 10);
    const eur = editValues.cost_fiat_eur !== '' ? parseFloat(editValues.cost_fiat_eur) : null;
    const tokens = editValues.ai_tokens_included !== '' ? parseInt(editValues.ai_tokens_included, 10) : null;
    const bonus = parseInt(editValues.ai_tokens_bonus_percentage, 10);
    if (isNaN(egili) || egili < 0) return;
    if (tokens !== null && isNaN(tokens)) return;
    updateMutation.mutate({ id, cost_egili: egili, cost_fiat_eur: eur, ai_tokens_included: tokens, ai_tokens_bonus_percentage: isNaN(bonus) ? 0 : bonus });
  };

  const handleDelete = (item: AiFeaturePricing) => {
    if (!window.confirm('Eliminare "' + item.feature_name + '"?\nQuesta operazione è irreversibile (soft delete).')) return;
    deleteMutation.mutate(item.id);
  };

  // Categorie e bundle disponibili dai dati
  const categories = Array.from(new Set((data?.data ?? []).map(i => i.feature_category))).sort();
  const bundleTypes = Array.from(new Set((data?.data ?? []).map(i => i.bundle_type).filter(Boolean))).sort() as string[];

  // === RENDER ===
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
        <span>Errore nel caricamento dei prezzi. Assicurati che il backend EGI-HUB sia attivo.</span>
      </div>
    );
  }

  const items = data?.data ?? [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-base-content">Feature Pricing</h1>
          <p className="text-base-content/60">
            Prezzi e attivazione pacchetti AI — {data?.total ?? 0} record totali
          </p>
        </div>
      </div>

      {/* Filtri */}
      <div className="flex flex-wrap gap-3">
        <select
          className="select select-bordered select-sm"
          value={filterCategory}
          onChange={e => setFilterCategory(e.target.value)}
        >
          <option value="">Tutte le categorie</option>
          {categories.map(c => <option key={c} value={c}>{labelCategory(c)}</option>)}
        </select>

        <select
          className="select select-bordered select-sm"
          value={filterBundleType}
          onChange={e => setFilterBundleType(e.target.value)}
        >
          <option value="">Tutti i bundle</option>
          {bundleTypes.map(b => <option key={b} value={b}>{labelBundle(b)}</option>)}
        </select>

        <select
          className="select select-bordered select-sm"
          value={filterActive}
          onChange={e => setFilterActive(e.target.value as '' | '1' | '0')}
        >
          <option value="">Tutti gli stati</option>
          <option value="1">Attivi</option>
          <option value="0">Inattivi</option>
        </select>

        {(filterCategory || filterBundleType || filterActive !== '') && (
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => { setFilterCategory(''); setFilterBundleType(''); setFilterActive(''); }}
          >
            <X className="w-4 h-4" /> Reset
          </button>
        )}
      </div>

      {/* Tabella */}
      <div className="shadow-xl card bg-base-100">
        <div className="p-0 card-body">
          <div className="overflow-x-auto">
            <table className="table table-zebra">
              <thead>
                <tr>
                  <th>Feature</th>
                  <th>Categoria</th>
                  <th>AI Token</th>
                  <th>Bonus %</th>
                  <th>Egili costo</th>
                  <th>EUR</th>
                  <th>Attivo</th>
                  <th>Acquisti</th>
                  <th className="text-right">Azioni</th>
                </tr>
              </thead>
              <tbody>
                {items.length ? items.map((item) => (
                  <tr key={item.id} className={!item.is_active ? 'opacity-50' : ''}>

                    {/* Feature */}
                    <td>
                      <div className="font-semibold">{item.feature_name}</div>
                      {item.feature_description && (
                        <div className="text-xs text-base-content/50 mt-0.5">{item.feature_description}</div>
                      )}
                      {item.bundle_type && (
                        <span className="mt-1 badge badge-outline badge-xs">{labelBundle(item.bundle_type)}</span>
                      )}
                    </td>

                    {/* Categoria */}
                    <td>
                      <span className="badge badge-ghost badge-sm">{labelCategory(item.feature_category)}</span>
                    </td>

                    {/* AI Token inclusi — edit inline */}
                    <td>
                      {editingId === item.id ? (
                        <input
                          type="number"
                          min="0"
                          className="w-28 input input-bordered input-xs"
                          value={editValues.ai_tokens_included}
                          placeholder="—"
                          onChange={e => setEditValues(v => ({ ...v, ai_tokens_included: e.target.value }))}
                        />
                      ) : (
                        item.ai_tokens_included != null ? (
                          <span className="font-semibold text-blue-500">
                            {item.ai_tokens_included.toLocaleString('it-IT')}
                          </span>
                        ) : (
                          <span className="badge badge-warning badge-xs">Da conf.</span>
                        )
                      )}
                    </td>

                    {/* Bonus % — edit inline */}
                    <td>
                      {editingId === item.id ? (
                        <input
                          type="number"
                          min="0"
                          max="100"
                          className="w-16 input input-bordered input-xs"
                          value={editValues.ai_tokens_bonus_percentage}
                          onChange={e => setEditValues(v => ({ ...v, ai_tokens_bonus_percentage: e.target.value }))}
                        />
                      ) : (
                        item.ai_tokens_bonus_percentage > 0 ? (
                          <span className="text-green-500 font-semibold">+{item.ai_tokens_bonus_percentage}%</span>
                        ) : (
                          <span className="text-base-content/30">—</span>
                        )
                      )}
                    </td>

                    {/* Egili costo — edit inline */}
                    <td>
                      {editingId === item.id ? (
                        <input
                          type="number"
                          min="0"
                          className="w-24 input input-bordered input-xs"
                          value={editValues.cost_egili}
                          onChange={e => setEditValues(v => ({ ...v, cost_egili: e.target.value }))}
                        />
                      ) : (
                        <span className="font-semibold text-yellow-600">
                          {item.cost_egili ?? '—'}
                        </span>
                      )}
                    </td>

                    {/* EUR — edit inline */}
                    <td>
                      {editingId === item.id ? (
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          className="w-24 input input-bordered input-xs"
                          value={editValues.cost_fiat_eur}
                          placeholder="—"
                          onChange={e => setEditValues(v => ({ ...v, cost_fiat_eur: e.target.value }))}
                        />
                      ) : (
                        <span className="font-semibold">
                          {item.cost_fiat_eur ? '€' + parseFloat(item.cost_fiat_eur).toFixed(2) : '—'}
                        </span>
                      )}
                    </td>

                    {/* Toggle is_active inline */}
                    <td>
                      <button
                        className="gap-1 btn btn-ghost btn-xs"
                        disabled={toggleMutation.isPending}
                        onClick={() => toggleMutation.mutate({ id: item.id, is_active: !item.is_active })}
                        title={item.is_active ? 'Disattiva' : 'Attiva'}
                      >
                        {item.is_active
                          ? <ToggleRight className="w-5 h-5 text-success" />
                          : <ToggleLeft className="w-5 h-5 text-error" />
                        }
                        <span className="text-xs">{item.is_active ? 'Attivo' : 'Off'}</span>
                      </button>
                    </td>

                    {/* Acquisti totali */}
                    <td>
                      <span className="text-sm text-base-content/60">{item.total_purchases ?? 0}</span>
                    </td>

                    {/* Azioni */}
                    <td className="text-right">
                      {editingId === item.id ? (
                        <div className="flex justify-end gap-1">
                          <button
                            className="btn btn-success btn-xs"
                            disabled={updateMutation.isPending}
                            onClick={() => saveEdit(item.id)}
                          >
                            <Check className="w-3 h-3" />
                          </button>
                          <button className="btn btn-ghost btn-xs" onClick={cancelEdit}>
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex justify-end gap-1">
                          <button
                            className="btn btn-ghost btn-xs"
                            onClick={() => startEdit(item)}
                            title="Modifica prezzi"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                          <button
                            className="btn btn-ghost btn-xs text-error"
                            disabled={deleteMutation.isPending}
                            onClick={() => handleDelete(item)}
                            title="Elimina"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                    </td>

                  </tr>
                )) : (
                  <tr>
                    <td colSpan={7} className="py-12 text-center">
                      <DollarSign className="w-12 h-12 mx-auto mb-4 text-base-content/30" />
                      <p className="text-base-content/60">Nessuna feature trovata con i filtri selezionati</p>
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
