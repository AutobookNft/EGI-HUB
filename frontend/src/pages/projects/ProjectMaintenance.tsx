/**
 * @package frontend/pages/projects
 * @author Padmin D. Curtis (AI Partner OS3.0) for Fabio Cherici
 * @version 2.0.0 (EGI-HUB — ProjectMaintenance danger-zone UI)
 * @date 2026-03-11
 * @purpose Pagina operazioni distruttive — layout professionale danger-zone
 */

import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  AlertTriangle,
  Trash2,
  FlaskConical,
  Terminal,
  ShieldX,
  CheckCircle2,
  XCircle,
  Loader2,
  Database,
  HardDrive,
  CloudOff,
  Layers,
  ChevronRight,
} from 'lucide-react';
import { getProjects, egiPurgeDryRun, egiPurgeExecute } from '../../services/projectApi';
import { useToast } from '../../contexts/ToastContext';
import type { Project } from '../../types/project';

/* ─── genera token hex casuale monouso (es: a3f7-9c2b-e841-5d03) ─── */
function generateToken(): string {
  const hex = () => Math.floor(Math.random() * 0xffff).toString(16).padStart(4, '0');
  return `${hex()}-${hex()}-${hex()}-${hex()}`;
}

/* ─── helper: estrae numeri dal dry-run output ─── */
function parseStats(output: string) {
  // Match "EGI records (hard delete): 22" (DB summary line — most reliable)
  // Fallback: "Found 22 EGIs to process." / "Found <comment>22</comment> EGIs"
  const egi = output.match(/EGI records \(hard delete\)[^\d]*(\d+)/i)?.[1]
           ?? output.match(/Found[^\d<]*(?:<[^>]+>)?(\d+)[^<]*EGIs/i)?.[1]
           ?? '—';
  // Match "Files to attempt delete: 110" / "Files to attempt delete: <comment>110</comment>"
  const s3  = output.match(/Files to attempt delete[^\d<]*(?:<[^>]+>)?(\d+)/i)?.[1] ?? '—';
  // Match "Unique CIDs to unpin: 18" / with optional <comment> tag
  const cid = output.match(/Unique CIDs to unpin[^\d<]*(?:<[^>]+>)?(\d+)/i)?.[1]   ?? '—';
  return { egi, s3, cid };
}

export default function ProjectMaintenance() {
  const { slug } = useParams<{ slug: string }>();
  const { success: toastSuccess, error: toastError } = useToast();

  const [project, setProject]               = useState<Project | null>(null);
  const [loadingProject, setLoadingProject]  = useState(true);

  // Dry-run state
  const [dryRunLoading, setDryRunLoading]    = useState(false);
  const [dryRunOutput, setDryRunOutput]      = useState<string | null>(null);
  const [dryRunSuccess, setDryRunSuccess]    = useState<boolean | null>(null);
  const [dryRunDone, setDryRunDone]          = useState(false);

  // Token sicurezza monouso (generato al completamento dry-run)
  const [confirmToken, setConfirmToken]      = useState('');

  // Execute state
  const [confirmInput, setConfirmInput]      = useState('');
  const [executeLoading, setExecuteLoading]  = useState(false);
  const [executeOutput, setExecuteOutput]    = useState<string | null>(null);
  const [executeSuccess, setExecuteSuccess]  = useState<boolean | null>(null);
  const [executeDone, setExecuteDone]        = useState(false);
  const [shakeTrigger, setShakeTrigger]      = useState(false);

  const dryOutputRef  = useRef<HTMLPreElement>(null);
  const execOutputRef = useRef<HTMLPreElement>(null);

  // ── Load project ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!slug) return;
    setLoadingProject(true);
    getProjects()
      .then((projects) => {
        const found = projects.find((p: Project) => p.slug === slug);
        setProject(found ?? null);
      })
      .catch(() => toastError('Impossibile caricare i dati del progetto.'))
      .finally(() => setLoadingProject(false));
  }, [slug]);

  useEffect(() => {
    dryOutputRef.current?.scrollTo({ top: dryOutputRef.current.scrollHeight, behavior: 'smooth' });
  }, [dryRunOutput]);

  useEffect(() => {
    execOutputRef.current?.scrollTo({ top: execOutputRef.current.scrollHeight, behavior: 'smooth' });
  }, [executeOutput]);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleDryRun = async () => {
    if (!project) return;
    setDryRunLoading(true);
    setDryRunOutput(null);
    setDryRunSuccess(null);
    setDryRunDone(false);
    setExecuteOutput(null);
    setExecuteSuccess(null);
    setExecuteDone(false);
    setConfirmInput('');
    setConfirmToken('');
    try {
      const result = await egiPurgeDryRun(project.id);
      setDryRunOutput(result.output);
      setDryRunSuccess(result.success);
      setDryRunDone(true);
      if (result.success) {
        setConfirmToken(generateToken());
        toastSuccess('Dry-run completato. Verifica il piano prima di procedere.');
      } else {
        toastError('Dry-run fallito. Controlla l\'output per i dettagli.');
      }
    } catch {
      setDryRunOutput('Errore di connessione al server.');
      setDryRunSuccess(false);
      toastError('Errore durante il dry-run.');
    } finally {
      setDryRunLoading(false);
    }
  };

  const handleExecute = async () => {
    if (!project || confirmInput !== confirmToken) {
      setShakeTrigger(true);
      setTimeout(() => setShakeTrigger(false), 600);
      return;
    }
    setExecuteLoading(true);
    setExecuteOutput(null);
    setExecuteSuccess(null);
    setExecuteDone(false);
    try {
      const result = await egiPurgeExecute(project.id, confirmInput);
      setExecuteOutput(result.output);
      setExecuteSuccess(result.success);
      setExecuteDone(true);
      if (result.success) {
        toastSuccess('Purge completata. Tutti gli asset EGI sono stati eliminati.');
      } else {
        toastError('Purge fallita parzialmente. Controlla l\'output.');
      }
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
               ?? 'Errore di connessione al server.';
      setExecuteOutput(msg);
      setExecuteSuccess(false);
      toastError(msg);
    } finally {
      setExecuteLoading(false);
    }
  };

  const isConfirmValid = confirmToken !== '' && confirmInput === confirmToken;
  const stats          = dryRunOutput ? parseStats(dryRunOutput) : null;

  // ── Render ────────────────────────────────────────────────────────────────
  if (loadingProject) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="p-6">
        <div className="alert alert-error">Progetto non trovato: <code>{slug}</code></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base-200">

      {/* ▓▓▓ HERO DANGER HEADER ▓▓▓ */}
      <div
        className="relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #1a0a0a 0%, #2d0f0f 40%, #1f1010 100%)',
          borderBottom: '1px solid rgba(255,60,60,0.25)',
        }}
      >
        {/* decorative grid */}
        <div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage:
              'repeating-linear-gradient(0deg,#ff4444 0,#ff4444 1px,transparent 0,transparent 50%),' +
              'repeating-linear-gradient(90deg,#ff4444 0,#ff4444 1px,transparent 0,transparent 50%)',
            backgroundSize: '40px 40px',
          }}
        />

        <div className="relative max-w-5xl mx-auto px-6 py-8">
          <Link
            to={`/project/${slug}`}
            className="inline-flex items-center gap-1.5 text-sm mb-6 transition-colors"
            style={{ color: 'rgba(252,165,165,0.6)' }}
            onMouseEnter={(e) => (e.currentTarget.style.color = 'rgba(252,165,165,0.9)')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(252,165,165,0.6)')}
          >
            <ArrowLeft className="w-4 h-4" />
            Torna a {project.name}
          </Link>

          <div className="flex items-start gap-5">
            <div
              className="shrink-0 w-16 h-16 rounded-2xl flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, rgba(220,38,38,0.3), rgba(153,27,27,0.4))',
                border: '1px solid rgba(220,38,38,0.4)',
                boxShadow: '0 0 30px rgba(220,38,38,0.2)',
              }}
            >
              <ShieldX className="w-8 h-8 text-red-400" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span
                  className="text-xs font-bold uppercase tracking-[0.2em] px-2 py-0.5 rounded"
                  style={{ background: 'rgba(220,38,38,0.2)', color: '#f87171', border: '1px solid rgba(220,38,38,0.3)' }}
                >
                  ZONA DI RISCHIO CRITICO
                </span>
              </div>
              <h1 className="text-3xl font-black text-white tracking-tight">EGI Asset Purge</h1>
              <p className="text-sm max-w-xl mt-1" style={{ color: 'rgba(252,165,165,0.6)' }}>
                Operazione <strong style={{ color: 'rgba(252,165,165,0.85)' }}>irreversibile</strong> — elimina
                definitivamente tutti gli asset EGI: S3, Pinata IPFS, Spatie Media e record database.
                Progetto: <span className="font-semibold text-white/70">{project.name}</span>
              </p>
            </div>
          </div>

          {/* impact pills */}
          <div className="flex flex-wrap gap-3 mt-6">
            {[
              { icon: <HardDrive className="w-3.5 h-3.5" />, label: 'File S3',      sub: 'JPG + 4 varianti WebP' },
              { icon: <CloudOff  className="w-3.5 h-3.5" />, label: 'Pinata IPFS',  sub: 'CID unpinati' },
              { icon: <Layers    className="w-3.5 h-3.5" />, label: 'Spatie Media', sub: 'EgiTrait observer' },
              { icon: <Database  className="w-3.5 h-3.5" />, label: 'DB Records',   sub: 'Hard-delete + FK' },
            ].map((item) => (
              <div
                key={item.label}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#fca5a5' }}
              >
                {item.icon}
                <span className="font-semibold">{item.label}</span>
                <span style={{ color: 'rgba(252,165,165,0.4)' }}>·</span>
                <span style={{ color: 'rgba(252,165,165,0.55)' }}>{item.sub}</span>
              </div>
            ))}
          </div>
        </div>
      </div>


      {/* ▓▓▓ BODY ▓▓▓ */}
      <div className="max-w-5xl mx-auto px-6 py-8 space-y-6">

        {/* ─── STEP INDICATOR BAR ─── */}
        <div className="flex items-center gap-0">
          <div className="flex items-center gap-3">
            <div
              className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm transition-all ${
                dryRunDone
                  ? 'bg-success text-success-content'
                  : dryRunLoading
                  ? 'bg-info text-info-content animate-pulse'
                  : 'bg-base-300 text-base-content/60 border-2 border-base-content/20'
              }`}
            >
              {dryRunDone ? <CheckCircle2 className="w-5 h-5" /> : '1'}
            </div>
            <span className={`text-sm font-medium ${dryRunDone ? 'text-success' : 'text-base-content/60'}`}>
              Dry-Run
            </span>
          </div>
          <div className={`flex-1 h-px mx-4 transition-all ${dryRunDone ? 'bg-success/50' : 'bg-base-300'}`} />
          <div className="flex items-center gap-3">
            <div
              className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm transition-all ${
                executeDone && executeSuccess
                  ? 'bg-success text-success-content'
                  : executeDone && !executeSuccess
                  ? 'bg-error text-error-content'
                  : executeLoading
                  ? 'bg-error text-error-content animate-pulse'
                  : dryRunDone
                  ? 'bg-error/20 text-error border-2 border-error/40'
                  : 'bg-base-300 text-base-content/30 border-2 border-base-content/10'
              }`}
            >
              {executeDone ? (executeSuccess ? <CheckCircle2 className="w-5 h-5" /> : <XCircle className="w-5 h-5" />) : '2'}
            </div>
            <span className={`text-sm font-medium ${dryRunDone ? 'text-error' : 'text-base-content/30'}`}>
              Esecuzione Reale
            </span>
          </div>
        </div>

        {/* ─── CARD STEP 1: DRY-RUN ─── */}
        <div
          className="rounded-2xl overflow-hidden"
          style={{
            border: dryRunDone ? '1px solid rgba(34,197,94,0.3)' : '1px solid rgba(255,255,255,0.08)',
            background: 'hsl(var(--b2))',
          }}
        >
          <div
            className="px-6 py-4 flex items-center gap-4"
            style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
          >
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: 'rgba(96,165,250,0.12)', border: '1px solid rgba(96,165,250,0.2)' }}
            >
              <FlaskConical className="w-5 h-5 text-blue-400" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span
                  className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded"
                  style={{ background: 'rgba(96,165,250,0.15)', color: '#93c5fd' }}
                >
                  STEP 1
                </span>
                <h2 className="font-bold text-base-content">Dry-Run — Analisi Piano</h2>
                <span className="text-xs text-base-content/40 font-medium">(nessuna modifica)</span>
              </div>
              <p className="text-xs text-base-content/50 mt-0.5">
                Mostra esattamente cosa verrebbe eliminato senza toccare nulla.
              </p>
            </div>
            {dryRunDone && dryRunSuccess  && <span className="badge badge-success gap-1 shrink-0"><CheckCircle2 className="w-3 h-3" />Completato</span>}
            {dryRunDone && !dryRunSuccess && <span className="badge badge-error gap-1 shrink-0"><XCircle className="w-3 h-3" />Errore</span>}
          </div>

          <div className="px-6 py-5 space-y-4">
            <div className="flex items-center gap-3">
              <button
                className="btn btn-sm gap-2"
                style={{ background: 'rgba(96,165,250,0.15)', border: '1px solid rgba(96,165,250,0.3)', color: '#93c5fd' }}
                onClick={handleDryRun}
                disabled={dryRunLoading || executeLoading}
              >
                {dryRunLoading
                  ? <><Loader2 className="w-4 h-4 animate-spin" />Analisi in corso...</>
                  : <><FlaskConical className="w-4 h-4" />Esegui Dry-Run</>}
              </button>
              <span className="text-xs text-base-content/40 font-mono">php artisan egi:purge-all</span>
            </div>

            {/* stats bar — after dry-run */}
            {stats && dryRunSuccess && (
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'EGI trovati', value: stats.egi, color: '#fbbf24' },
                  { label: 'File S3',     value: stats.s3,  color: '#f87171' },
                  { label: 'CID Pinata',  value: stats.cid, color: '#c084fc' },
                ].map((s) => (
                  <div
                    key={s.label}
                    className="rounded-xl px-4 py-3 text-center"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
                  >
                    <p className="text-2xl font-black" style={{ color: s.color }}>{s.value}</p>
                    <p className="text-xs text-base-content/50 mt-0.5">{s.label}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Terminal output */}
            {dryRunOutput !== null && (
              <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
                <div
                  className="flex items-center gap-2 px-4 py-2"
                  style={{ background: '#0f0f0f', borderBottom: '1px solid rgba(255,255,255,0.06)' }}
                >
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-500/70" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500/70" />
                    <div className="w-3 h-3 rounded-full bg-green-500/70" />
                  </div>
                  <Terminal className="w-3.5 h-3.5 text-white/30 ml-2" />
                  <span className="text-xs text-white/30 font-mono">dry-run output</span>
                </div>
                <pre
                  ref={dryOutputRef}
                  className="p-4 text-xs font-mono whitespace-pre-wrap overflow-auto max-h-72 leading-relaxed"
                  style={{ background: '#0d0d0d', color: '#86efac' }}
                >
                  {dryRunOutput}
                </pre>
              </div>
            )}
          </div>
        </div>

        {/* ─── CARD STEP 2: ESECUZIONE REALE ─── */}
        <div
          className={`rounded-2xl overflow-hidden transition-all duration-500 ${!dryRunDone ? 'opacity-40 pointer-events-none select-none' : ''}`}
          style={{
            border: executeDone && executeSuccess
              ? '1px solid rgba(34,197,94,0.3)'
              : '1px solid rgba(220,38,38,0.35)',
            background: 'hsl(var(--b2))',
          }}
        >
          <div
            className="px-6 py-4 flex items-center gap-4"
            style={{
              borderBottom: '1px solid rgba(220,38,38,0.2)',
              background: 'linear-gradient(90deg, rgba(220,38,38,0.08) 0%, transparent 100%)',
            }}
          >
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: 'rgba(220,38,38,0.15)', border: '1px solid rgba(220,38,38,0.3)' }}
            >
              <Trash2 className="w-5 h-5 text-red-400" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span
                  className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded"
                  style={{ background: 'rgba(220,38,38,0.2)', color: '#f87171' }}
                >
                  STEP 2
                </span>
                <h2 className="font-bold text-base-content">Esecuzione Reale</h2>
                <span
                  className="text-xs font-bold px-2 py-0.5 rounded"
                  style={{ background: 'rgba(220,38,38,0.15)', color: '#fca5a5' }}
                >
                  IRREVERSIBILE
                </span>
              </div>
              <p className="text-xs text-base-content/50 mt-0.5">
                {dryRunDone ? 'Digita il codice di conferma per sbloccare l\'esecuzione.' : 'Disponibile solo dopo aver eseguito il Dry-Run.'}
              </p>
            </div>
            {!dryRunDone && (
              <div className="flex items-center gap-1.5 text-xs text-base-content/30 shrink-0">
                <ChevronRight className="w-4 h-4" />Prima esegui Step 1
              </div>
            )}
          </div>

          <div className="px-6 py-5 space-y-5">
            {!executeDone && (
              <div
                className="rounded-xl p-5 space-y-4"
                style={{ background: 'rgba(220,38,38,0.05)', border: '1px solid rgba(220,38,38,0.2)' }}
              >
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                  <p className="text-sm" style={{ color: 'rgba(252,165,165,0.8)' }}>
                    Copia e incolla il codice di conferma nel campo qui sotto.
                    Questa azione <strong style={{ color: '#fca5a5' }}>non può essere annullata</strong>.
                  </p>
                </div>

                {/* token sicurezza monouso */}
                <div style={{ background: '#1e1e1e', borderRadius: '8px', overflow: 'hidden', border: '1px solid #3f3f46' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 12px', background: '#2d2d2d', borderBottom: '1px solid #3f3f46' }}>
                    <span style={{ fontSize: '0.7rem', color: '#71717a', fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: '0.08em' }}>token di sicurezza monouso</span>
                    <button
                      type="button"
                      onClick={() => navigator.clipboard.writeText(confirmToken)}
                      style={{ fontSize: '0.7rem', color: '#a1a1aa', background: 'none', border: 'none', cursor: 'pointer', padding: '2px 6px', borderRadius: '4px' }}
                      title="Copia token"
                    >
                      copia
                    </button>
                  </div>
                  <div
                    className="select-all"
                    style={{ padding: '14px 20px', fontFamily: 'monospace', fontSize: '1.1rem', letterSpacing: '0.12em', color: '#e4e4e7', cursor: 'text', userSelect: 'all' }}
                  >
                    {confirmToken}
                  </div>
                </div>
                <p style={{ fontSize: '0.78rem', color: '#6b7280', textAlign: 'center' }}>
                  Copia il token e incollalo esattamente nel campo sottostante per sbloccare l'esecuzione.
                </p>

                {/* input */}
                <div className="relative">
                  <input
                    type="text"
                    className="input input-bordered w-full font-mono text-center text-base tracking-wider transition-all duration-200"
                    style={{
                      background: 'rgba(0,0,0,0.3)',
                      ...(isConfirmValid
                        ? { borderColor: 'rgba(34,197,94,0.6)', boxShadow: '0 0 0 1px rgba(34,197,94,0.3)' }
                        : confirmInput
                        ? { borderColor: 'rgba(220,38,38,0.6)' }
                        : {}),
                    }}
                    placeholder="Digita il codice di conferma..."
                    value={confirmInput}
                    onChange={(e) => setConfirmInput(e.target.value)}
                    disabled={executeLoading}
                    autoComplete="off"
                    spellCheck={false}
                  />
                  {isConfirmValid  && <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-success" />}
                  {confirmInput && !isConfirmValid && <XCircle className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-error" />}
                </div>

                {/* execute button */}
                <button
                  className={`btn w-full gap-3 text-base font-bold transition-all duration-200 ${shakeTrigger ? 'animate-bounce' : ''}`}
                  style={
                    isConfirmValid && !executeLoading
                      ? {
                          background: 'linear-gradient(135deg, #dc2626, #991b1b)',
                          border: '1px solid rgba(220,38,38,0.5)',
                          color: '#fff',
                          boxShadow: '0 4px 24px rgba(220,38,38,0.35)',
                        }
                      : {
                          background: 'rgba(220,38,38,0.1)',
                          border: '1px solid rgba(220,38,38,0.2)',
                          color: 'rgba(252,165,165,0.4)',
                          cursor: isConfirmValid ? 'pointer' : 'not-allowed',
                        }
                  }
                  onClick={handleExecute}
                  disabled={executeLoading}
                >
                  {executeLoading
                    ? <><Loader2 className="w-5 h-5 animate-spin" />Purge in esecuzione... (2–3 minuti)</>
                    : <><Trash2 className="w-5 h-5" />PURGE — Elimina tutti gli EGI</>}
                </button>
              </div>
            )}

            {/* execute terminal output */}
            {executeOutput !== null && (
              <div className="space-y-3">
                <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
                  <div
                    className="flex items-center justify-between px-4 py-2"
                    style={{ background: '#0f0f0f', borderBottom: '1px solid rgba(255,255,255,0.06)' }}
                  >
                    <div className="flex items-center gap-2">
                      <div className="flex gap-1.5">
                        <div className="w-3 h-3 rounded-full bg-red-500/70" />
                        <div className="w-3 h-3 rounded-full bg-yellow-500/70" />
                        <div className="w-3 h-3 rounded-full bg-green-500/70" />
                      </div>
                      <Terminal className="w-3.5 h-3.5 text-white/30 ml-2" />
                      <span className="text-xs text-white/30 font-mono">purge output</span>
                    </div>
                    {executeDone && (
                      <span className={`text-xs font-bold px-2 py-0.5 rounded font-mono ${executeSuccess ? 'text-green-400' : 'text-red-400'}`}>
                        {executeSuccess ? '● EXIT 0' : '● EXIT 1'}
                      </span>
                    )}
                  </div>
                  <pre
                    ref={execOutputRef}
                    className="p-4 text-xs font-mono whitespace-pre-wrap overflow-auto max-h-96 leading-relaxed"
                    style={{ background: '#0d0d0d', color: executeSuccess ? '#86efac' : '#fca5a5' }}
                  >
                    {executeOutput}
                  </pre>
                </div>

                {executeDone && executeSuccess && (
                  <div
                    className="rounded-xl p-4 flex items-center gap-3"
                    style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.25)' }}
                  >
                    <CheckCircle2 className="w-5 h-5 text-green-400 shrink-0" />
                    <div>
                      <p className="text-sm font-bold text-green-400">Purge completata con successo</p>
                      <p className="text-xs mt-0.5" style={{ color: 'rgba(134,239,172,0.6)' }}>
                        Tutti gli asset EGI sono stati eliminati da S3, Pinata IPFS e database.
                      </p>
                    </div>
                  </div>
                )}
                {executeDone && !executeSuccess && (
                  <div
                    className="rounded-xl p-4 flex items-center gap-3"
                    style={{ background: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.25)' }}
                  >
                    <XCircle className="w-5 h-5 text-red-400 shrink-0" />
                    <div>
                      <p className="text-sm font-bold text-red-400">Purge fallita parzialmente</p>
                      <p className="text-xs mt-0.5" style={{ color: 'rgba(252,165,165,0.6)' }}>
                        Alcuni step potrebbero non essere stati completati. Verifica l'output sopra.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
