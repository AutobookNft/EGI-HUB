/**
 * TenantContracts — EGI-HUB
 * Lista e gestione contratti di un tenant con form creazione e azioni lifecycle.
 */

import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  FileText, Plus, CheckCircle, XCircle, RefreshCw,
  AlertCircle, ChevronRight, Infinity, Calendar,
} from 'lucide-react';
import {
  getContractsByTenant,
  createContract,
  activateContract,
  terminateContract,
  renewContract,
  deleteContract,
} from '../../services/contractApi';
import type { Contract, CreateContractData, ContractType, BillingPeriod } from '../../types/contract';
import {
  CONTRACT_STATUS_LABELS,
  CONTRACT_STATUS_COLORS,
  CONTRACT_TYPE_LABELS,
  BILLING_PERIOD_LABELS,
} from '../../types/contract';

const EMPTY_FORM: CreateContractData = {
  system_project_id: 0,
  contract_type: 'saas',
  signatory_name: '',
  signatory_email: '',
  signatory_role: '',
  signatory_is_admin: false,
  start_date: new Date().toISOString().split('T')[0],
  end_date: '',
  value: undefined,
  currency: 'EUR',
  billing_period: undefined,
  notes: '',
};

export default function TenantContracts() {
  const { tenantId } = useParams<{ tenantId: string }>();
  const tid = Number(tenantId);

  const [contracts, setContracts] = useState<Contract[]>([]);
  const [tenantName, setTenantName] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  // Form stato
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<CreateContractData>(EMPTY_FORM);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => { load(); }, [tid]);

  const load = async () => {
    try {
      setLoading(true);
      const res = await getContractsByTenant(tid);
      setContracts(res.data);
      setTenantName(res.tenant.name);
      setError(null);
    } catch {
      setError('Impossibile caricare i contratti');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setFormLoading(true);
      setFormError(null);
      await createContract(tid, {
        ...form,
        end_date: form.end_date || undefined,
        value: form.value || undefined,
        billing_period: form.billing_period || undefined,
        signatory_role: form.signatory_role || undefined,
        notes: form.notes || undefined,
      });
      setShowForm(false);
      setForm(EMPTY_FORM);
      await load();
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Errore durante la creazione');
    } finally {
      setFormLoading(false);
    }
  };

  const handleActivate = async (c: Contract) => {
    try {
      setActionLoading(c.id);
      await activateContract(c.id);
      await load();
    } finally {
      setActionLoading(null);
    }
  };

  const handleTerminate = async (c: Contract) => {
    if (!confirm(`Terminare il contratto ${c.contract_number}?`)) return;
    try {
      setActionLoading(c.id);
      await terminateContract(c.id);
      await load();
    } finally {
      setActionLoading(null);
    }
  };

  const handleRenew = async (c: Contract) => {
    try {
      setActionLoading(c.id);
      await renewContract(c.id);
      await load();
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (c: Contract) => {
    if (!confirm(`Eliminare la bozza ${c.contract_number}?`)) return;
    try {
      setActionLoading(c.id);
      await deleteContract(c.id);
      await load();
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <span className="loading loading-spinner loading-lg text-primary" />
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm breadcrumbs">
        <Link to="/tenants" className="link link-hover">Tenant</Link>
        <span>/</span>
        <span className="font-medium">{tenantName}</span>
        <span>/</span>
        <span className="font-medium">Contratti</span>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FileText className="w-7 h-7" />
            Contratti
          </h1>
          <p className="text-base-content/70 mt-1">{tenantName}</p>
        </div>
        <button className="btn btn-primary gap-2" onClick={() => setShowForm(true)}>
          <Plus className="w-4 h-4" />
          Nuovo contratto
        </button>
      </div>

      {/* Errore */}
      {error && (
        <div className="alert alert-error">
          <AlertCircle className="w-5 h-5" />
          <span>{error}</span>
          <button className="btn btn-sm" onClick={load}>Riprova</button>
        </div>
      )}

      {/* Lista contratti */}
      {contracts.length === 0 ? (
        <div className="bg-white rounded-xl shadow p-10 text-center border border-gray-100">
          <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-400">Nessun contratto per questo tenant.</p>
          <button className="btn btn-primary btn-sm mt-4 gap-2" onClick={() => setShowForm(true)}>
            <Plus className="w-4 h-4" /> Crea il primo contratto
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {contracts.map(c => (
            <div key={c.id} className="bg-white rounded-xl shadow border border-gray-100 p-5">
              <div className="flex items-start justify-between gap-4">
                {/* Info principale */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="font-mono font-semibold text-gray-800">{c.contract_number}</span>
                    <span className={`badge badge-sm ${CONTRACT_STATUS_COLORS[c.status]}`}>
                      {CONTRACT_STATUS_LABELS[c.status]}
                    </span>
                    {c.contract_type && (
                      <span className="badge badge-ghost badge-sm">
                        {CONTRACT_TYPE_LABELS[c.contract_type]}
                      </span>
                    )}
                    {c.parent_contract_id && (
                      <span className="badge badge-outline badge-sm text-blue-600">Rinnovo</span>
                    )}
                  </div>

                  <div className="mt-2 flex flex-wrap gap-x-6 gap-y-1 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {c.start_date}
                      {' → '}
                      {c.is_perpetual ? (
                        <span className="flex items-center gap-0.5"><Infinity className="w-3.5 h-3.5" /> Perpetuo</span>
                      ) : c.end_date}
                    </span>
                    {c.value && (
                      <span>
                        {parseFloat(c.value).toLocaleString('it-IT', { style: 'currency', currency: c.currency })}
                        {c.billing_period && ` / ${BILLING_PERIOD_LABELS[c.billing_period]}`}
                      </span>
                    )}
                    <span>{c.signatory_name} {c.signatory_role && `— ${c.signatory_role}`}</span>
                  </div>
                </div>

                {/* Azioni */}
                <div className="flex items-center gap-2 shrink-0">
                  {c.can_be_activated && (
                    <button
                      className="btn btn-success btn-xs gap-1"
                      onClick={() => handleActivate(c)}
                      disabled={actionLoading === c.id}
                    >
                      <CheckCircle className="w-3.5 h-3.5" /> Attiva
                    </button>
                  )}
                  {c.can_be_renewed && (
                    <button
                      className="btn btn-info btn-xs gap-1"
                      onClick={() => handleRenew(c)}
                      disabled={actionLoading === c.id}
                    >
                      <RefreshCw className="w-3.5 h-3.5" /> Rinnova
                    </button>
                  )}
                  {(c.status === 'draft' || c.status === 'active') && (
                    <button
                      className="btn btn-error btn-xs gap-1"
                      onClick={() => c.status === 'draft' ? handleDelete(c) : handleTerminate(c)}
                      disabled={actionLoading === c.id}
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      {c.status === 'draft' ? 'Elimina' : 'Termina'}
                    </button>
                  )}
                  <Link to={`/contracts/${c.id}`} className="btn btn-ghost btn-xs">
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                  {actionLoading === c.id && (
                    <span className="loading loading-spinner loading-xs" />
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Form creazione */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60" onClick={() => setShowForm(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto z-10">
            <div className="sticky top-0 bg-white px-6 pt-6 pb-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                Nuovo Contratto
              </h2>
              <button className="btn btn-ghost btn-sm btn-circle" onClick={() => setShowForm(false)}>✕</button>
            </div>

            <form onSubmit={handleCreate} className="p-6 space-y-5">
              {/* Tipo e date */}
              <div className="grid grid-cols-2 gap-4">
                <div className="form-control">
                  <label className="label pb-1"><span className="label-text font-medium">Tipo *</span></label>
                  <select
                    className="select select-bordered w-full"
                    value={form.contract_type}
                    onChange={e => setForm(f => ({ ...f, contract_type: e.target.value as ContractType }))}
                    required
                  >
                    <option value="saas">SaaS</option>
                    <option value="pilot">Pilota</option>
                    <option value="trial">Trial</option>
                    <option value="custom">Personalizzato</option>
                  </select>
                </div>
                <div className="form-control">
                  <label className="label pb-1"><span className="label-text font-medium">ID Progetto *</span></label>
                  <input
                    type="number"
                    className="input input-bordered w-full"
                    placeholder="system_project_id"
                    value={form.system_project_id || ''}
                    onChange={e => setForm(f => ({ ...f, system_project_id: Number(e.target.value) }))}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="form-control">
                  <label className="label pb-1"><span className="label-text font-medium">Data inizio *</span></label>
                  <input
                    type="date"
                    className="input input-bordered w-full"
                    value={form.start_date}
                    onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))}
                    required
                  />
                </div>
                <div className="form-control">
                  <label className="label pb-1">
                    <span className="label-text font-medium">Data fine</span>
                    <span className="label-text-alt text-gray-400">vuoto = perpetuo</span>
                  </label>
                  <input
                    type="date"
                    className="input input-bordered w-full"
                    value={form.end_date ?? ''}
                    onChange={e => setForm(f => ({ ...f, end_date: e.target.value }))}
                  />
                </div>
              </div>

              {/* Firmatario */}
              <div className="divider text-sm text-gray-400">Firmatario</div>

              <div className="grid grid-cols-2 gap-4">
                <div className="form-control">
                  <label className="label pb-1"><span className="label-text font-medium">Nome *</span></label>
                  <input
                    type="text"
                    className="input input-bordered w-full"
                    value={form.signatory_name}
                    onChange={e => setForm(f => ({ ...f, signatory_name: e.target.value }))}
                    required
                  />
                </div>
                <div className="form-control">
                  <label className="label pb-1"><span className="label-text font-medium">Email *</span></label>
                  <input
                    type="email"
                    className="input input-bordered w-full"
                    value={form.signatory_email}
                    onChange={e => setForm(f => ({ ...f, signatory_email: e.target.value }))}
                    required
                  />
                </div>
              </div>

              <div className="form-control">
                <label className="label pb-1"><span className="label-text font-medium">Ruolo/Qualifica</span></label>
                <input
                  type="text"
                  className="input input-bordered w-full"
                  placeholder="es. Dirigente Servizi Digitali"
                  value={form.signatory_role ?? ''}
                  onChange={e => setForm(f => ({ ...f, signatory_role: e.target.value }))}
                />
              </div>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  className="checkbox checkbox-primary"
                  checked={form.signatory_is_admin}
                  onChange={e => setForm(f => ({ ...f, signatory_is_admin: e.target.checked }))}
                />
                <span className="text-sm">Il firmatario è anche il primo admin del tenant</span>
              </label>

              {/* Economico */}
              <div className="divider text-sm text-gray-400">Dati economici (opzionali)</div>

              <div className="grid grid-cols-3 gap-4">
                <div className="form-control">
                  <label className="label pb-1"><span className="label-text font-medium">Valore</span></label>
                  <input
                    type="number"
                    className="input input-bordered w-full"
                    min="0"
                    step="0.01"
                    value={form.value ?? ''}
                    onChange={e => setForm(f => ({ ...f, value: e.target.value ? Number(e.target.value) : undefined }))}
                  />
                </div>
                <div className="form-control">
                  <label className="label pb-1"><span className="label-text font-medium">Valuta</span></label>
                  <input
                    type="text"
                    className="input input-bordered w-full"
                    maxLength={3}
                    value={form.currency ?? 'EUR'}
                    onChange={e => setForm(f => ({ ...f, currency: e.target.value.toUpperCase() }))}
                  />
                </div>
                <div className="form-control">
                  <label className="label pb-1"><span className="label-text font-medium">Periodicità</span></label>
                  <select
                    className="select select-bordered w-full"
                    value={form.billing_period ?? ''}
                    onChange={e => setForm(f => ({ ...f, billing_period: (e.target.value as BillingPeriod) || undefined }))}
                  >
                    <option value="">—</option>
                    <option value="monthly">Mensile</option>
                    <option value="annual">Annuale</option>
                    <option value="one_time">Una tantum</option>
                    <option value="custom">Personalizzata</option>
                  </select>
                </div>
              </div>

              <div className="form-control">
                <label className="label pb-1"><span className="label-text font-medium">Note</span></label>
                <textarea
                  className="textarea textarea-bordered w-full"
                  rows={2}
                  value={form.notes ?? ''}
                  onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                />
              </div>

              {formError && (
                <div className="alert alert-error py-2 text-sm">
                  <AlertCircle className="w-4 h-4" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" className="btn btn-ghost" onClick={() => setShowForm(false)} disabled={formLoading}>
                  Annulla
                </button>
                <button type="submit" className="btn btn-primary gap-2" disabled={formLoading}>
                  {formLoading
                    ? <span className="loading loading-spinner loading-sm" />
                    : <Plus className="w-4 h-4" />}
                  Crea contratto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
