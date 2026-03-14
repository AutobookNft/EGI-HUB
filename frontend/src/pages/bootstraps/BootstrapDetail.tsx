/**
 * BootstrapDetail — EGI-HUB Frontend
 * @author Padmin D. Curtis (AI Partner OS3.0) for Fabio Cherici
 * @version 1.0.0
 * @purpose Pagina dettaglio Tenant Admin Bootstrap con azioni e storico stato
 */

import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Users,
  Building2,
  FileText,
  Clock,
  Info,
  Send,
  PauseCircle,
  XCircle,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';
import {
  getBootstrap,
  resendInvitation,
  suspendBootstrap,
  revokeBootstrap,
} from '@/services/bootstrapApi';
import type { TenantAdminBootstrap } from '@/types/bootstrap';
import BootstrapStatusBadge from './BootstrapStatusBadge';

// --- ConfirmModal (inline, piccolo) ---

interface ConfirmModalProps {
  title: string;
  message: string;
  confirmLabel: string;
  confirmClass: string;
  onConfirm: () => void;
  onCancel: () => void;
}

function ConfirmModal({
  title,
  message,
  confirmLabel,
  confirmClass,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  return (
    <div className="modal modal-open" role="dialog" aria-modal="true" aria-labelledby="detail-modal-title">
      <div className="modal-box">
        <h3 id="detail-modal-title" className="font-bold text-lg">{title}</h3>
        <p className="py-4 text-base-content/70">{message}</p>
        <div className="modal-action">
          <button className="btn btn-ghost" onClick={onCancel}>Annulla</button>
          <button className={`btn ${confirmClass}`} onClick={onConfirm}>{confirmLabel}</button>
        </div>
      </div>
      <div className="modal-backdrop" onClick={onCancel} />
    </div>
  );
}

// --- InfoRow helper ---

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-4 py-2 border-b border-base-200 last:border-0">
      <span className="text-sm font-medium text-base-content/60 sm:w-40 shrink-0">{label}</span>
      <span className="text-sm">{value ?? <span className="text-base-content/30">—</span>}</span>
    </div>
  );
}

function formatDate(dateStr: string | null | undefined): string | null {
  if (!dateStr) return null;
  return new Date(dateStr).toLocaleString('it-IT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// --- Main Component ---

type PendingAction = 'suspend' | 'revoke';

export default function BootstrapDetail() {
  const { id, slug } = useParams<{ id: string; slug: string }>();
  const navigate = useNavigate();
  const backPath = slug ? `/project/${slug}/admins` : '/projects';

  const [bootstrap, setBootstrap] = useState<TenantAdminBootstrap | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);

  const fetchData = useCallback(async () => {
    if (!id) return;
    try {
      setError(null);
      const data = await getBootstrap(parseInt(id, 10));
      setBootstrap(data);
    } catch {
      setError('Bootstrap non trovato o errore di caricamento');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleResend = async () => {
    if (!bootstrap) return;
    setActionLoading(true);
    setActionError(null);
    setActionSuccess(null);
    try {
      await resendInvitation(bootstrap.id);
      setActionSuccess('Invito reinviato con successo');
    } catch {
      setActionError('Errore durante il reinvio dell\'invito');
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirmAction = async () => {
    if (!bootstrap || !pendingAction) return;
    setActionLoading(true);
    setActionError(null);
    setActionSuccess(null);
    const action = pendingAction;
    setPendingAction(null);
    try {
      if (action === 'suspend') {
        const updated = await suspendBootstrap(bootstrap.id);
        setBootstrap(updated);
        setActionSuccess('Bootstrap sospeso');
      } else {
        const updated = await revokeBootstrap(bootstrap.id);
        setBootstrap(updated);
        setActionSuccess('Bootstrap revocato');
      }
    } catch {
      setActionError('Errore durante l\'operazione');
    } finally {
      setActionLoading(false);
    }
  };

  const canResend = bootstrap?.status === 'invited' || bootstrap?.status === 'pending';
  const canSuspend = bootstrap?.status === 'activated';
  const canRevoke = bootstrap && bootstrap.status !== 'revoked';

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <span className="loading loading-spinner loading-lg text-primary" aria-label="Caricamento in corso" />
      </div>
    );
  }

  if (error || !bootstrap) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => navigate(backPath)}
            className="btn btn-ghost btn-square"
            aria-label="Torna alla lista"
          >
            <ArrowLeft className="w-5 h-5" aria-hidden="true" />
          </button>
          <h1 className="text-2xl font-bold">Dettaglio Bootstrap</h1>
        </div>
        <div className="alert alert-error" role="alert">
          <AlertTriangle className="w-5 h-5" aria-hidden="true" />
          <span>{error ?? 'Bootstrap non trovato'}</span>
        </div>
        <Link to={backPath} className="btn btn-ghost gap-2">
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          Torna alla lista
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Confirm Modal */}
      {pendingAction && (
        <ConfirmModal
          title={pendingAction === 'suspend' ? 'Sospendi Bootstrap' : 'Revoca Bootstrap'}
          message={
            pendingAction === 'suspend'
              ? 'Vuoi sospendere questo bootstrap? L\'admin non potrà più accedere.'
              : 'Vuoi revocare definitivamente questo bootstrap? L\'operazione non è reversibile.'
          }
          confirmLabel={pendingAction === 'suspend' ? 'Sospendi' : 'Revoca'}
          confirmClass={pendingAction === 'suspend' ? 'btn-warning' : 'btn-error'}
          onConfirm={handleConfirmAction}
          onCancel={() => setPendingAction(null)}
        />
      )}

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => navigate(backPath)}
            className="btn btn-ghost btn-square"
            aria-label="Torna alla lista"
          >
            <ArrowLeft className="w-5 h-5" aria-hidden="true" />
          </button>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-3">
              <Users className="w-8 h-8 text-primary" aria-hidden="true" />
              Bootstrap #{bootstrap.id}
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <BootstrapStatusBadge status={bootstrap.status} />
              {bootstrap.contract_id && (
                <span className="text-base-content/60 text-sm font-mono">Contratto #{bootstrap.contract_id}</span>
              )}
            </div>
          </div>
        </div>

        {/* Header actions */}
        <div className="flex gap-2 flex-wrap">
          {canResend && (
            <button
              type="button"
              className="btn btn-outline btn-info gap-2"
              onClick={handleResend}
              disabled={actionLoading}
              aria-label="Reinvia invito"
            >
              {actionLoading ? (
                <span className="loading loading-spinner loading-sm" />
              ) : (
                <Send className="w-4 h-4" aria-hidden="true" />
              )}
              Reinvia invito
            </button>
          )}
          {canSuspend && (
            <button
              type="button"
              className="btn btn-outline btn-warning gap-2"
              onClick={() => setPendingAction('suspend')}
              disabled={actionLoading}
              aria-label="Sospendi bootstrap"
            >
              <PauseCircle className="w-4 h-4" aria-hidden="true" />
              Sospendi
            </button>
          )}
          {canRevoke && (
            <button
              type="button"
              className="btn btn-outline btn-error gap-2"
              onClick={() => setPendingAction('revoke')}
              disabled={actionLoading}
              aria-label="Revoca bootstrap"
            >
              <XCircle className="w-4 h-4" aria-hidden="true" />
              Revoca
            </button>
          )}
          <button
            type="button"
            className="btn btn-ghost btn-square"
            onClick={fetchData}
            aria-label="Ricarica dati"
          >
            <RefreshCw className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* Action feedback */}
      {actionError && (
        <div className="alert alert-error" role="alert">
          <AlertTriangle className="w-5 h-5" aria-hidden="true" />
          <span>{actionError}</span>
        </div>
      )}
      {actionSuccess && (
        <div className="alert alert-success" role="status" aria-live="polite">
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Cards grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Progetto e Tenant */}
        <div className="card bg-base-100 shadow-sm">
          <div className="card-body">
            <h2 className="card-title text-base mb-2">
              <Building2 className="w-5 h-5" aria-hidden="true" />
              Progetto e Tenant
            </h2>
            <InfoRow
              label="Progetto"
              value={bootstrap.project?.name}
            />
            <InfoRow
              label="Slug progetto"
              value={bootstrap.project?.slug
                ? <span className="font-mono text-xs">{bootstrap.project.slug}</span>
                : null}
            />
            <InfoRow
              label="Tenant"
              value={bootstrap.tenant?.name}
            />
            <InfoRow
              label="Slug tenant"
              value={bootstrap.tenant?.slug
                ? <span className="font-mono text-xs">{bootstrap.tenant.slug}</span>
                : null}
            />
            <InfoRow label="Contratto ID" value={bootstrap.contract_id ? `#${bootstrap.contract_id}` : null} />
          </div>
        </div>

        {/* Amministratore */}
        <div className="card bg-base-100 shadow-sm">
          <div className="card-body">
            <h2 className="card-title text-base mb-2">
              <Users className="w-5 h-5" aria-hidden="true" />
              Amministratore
            </h2>
            <InfoRow
              label="Nome"
              value={`${bootstrap.first_name_snapshot} ${bootstrap.last_name_snapshot}`}
            />
            <InfoRow label="Email" value={bootstrap.email_snapshot} />
            <InfoRow label="Telefono" value={bootstrap.phone_snapshot} />
            <InfoRow label="Ruolo" value={bootstrap.job_title_snapshot} />
            {bootstrap.user && (
              <InfoRow
                label="Account creato"
                value={
                  <span className="text-success font-medium">
                    {bootstrap.user.name} ({bootstrap.user.email})
                  </span>
                }
              />
            )}
          </div>
        </div>

        {/* Stato Invito */}
        <div className="card bg-base-100 shadow-sm">
          <div className="card-body">
            <h2 className="card-title text-base mb-2">
              <Clock className="w-5 h-5" aria-hidden="true" />
              Stato Invito
            </h2>
            <InfoRow
              label="Stato attuale"
              value={<BootstrapStatusBadge status={bootstrap.status} />}
            />
            <InfoRow
              label="Invio invito"
              value={formatDate(bootstrap.invitation_sent_at)}
            />
            <InfoRow
              label="Scadenza invito"
              value={bootstrap.invitation_expires_at
                ? (() => {
                    const isExpired = new Date(bootstrap.invitation_expires_at) < new Date();
                    return (
                      <span className={isExpired ? 'text-error' : ''}>
                        {formatDate(bootstrap.invitation_expires_at)}
                        {isExpired && ' (scaduto)'}
                      </span>
                    );
                  })()
                : null}
            />
            <InfoRow label="Attivato il" value={formatDate(bootstrap.activated_at)} />
            <InfoRow label="Sospeso il" value={formatDate(bootstrap.suspended_at)} />
            <InfoRow label="Revocato il" value={formatDate(bootstrap.revoked_at)} />
          </div>
        </div>

        {/* Metadati */}
        <div className="card bg-base-100 shadow-sm">
          <div className="card-body">
            <h2 className="card-title text-base mb-2">
              <Info className="w-5 h-5" aria-hidden="true" />
              Metadati
            </h2>
            <InfoRow label="Creato il" value={formatDate(bootstrap.created_at)} />
            <InfoRow
              label="Creato da"
              value={bootstrap.created_by_user?.name}
            />
            {bootstrap.notes && (
              <div className="mt-3">
                <p className="text-sm font-medium text-base-content/60 mb-1">Note</p>
                <div className="bg-base-200 rounded-lg p-3 text-sm">
                  <FileText className="w-4 h-4 inline mr-2 text-base-content/40" aria-hidden="true" />
                  {bootstrap.notes}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
