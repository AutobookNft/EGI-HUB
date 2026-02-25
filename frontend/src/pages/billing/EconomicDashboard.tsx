/**
 * @package frontend/src/pages/billing
 * @author Padmin D. Curtis (AI Partner OS3.0) for Fabio Cherici
 * @version 1.0.0 (EGI-HUB - BILLING FASE 5.4)
 * @date 2026-02-25
 * @purpose Dashboard Economica Aggregata — Revenue, Consumo Feature, Egili
 */

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import { TrendingUp, Zap, Coins, RefreshCw, Calendar } from 'lucide-react'
import api from '../../services/api'

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

type Tab = 'revenue' | 'consumption' | 'egili'
type Group = 'monthly' | 'yearly'

interface PeriodEntry {
  period: string
  [key: string]: string | number
}

interface RevenueData {
  period: { months: number; group: string; since: string }
  orders: {
    summary: {
      total_orders: number
      completed_orders: number
      total_revenue_eur: number
      avg_order_eur: number
    }
    by_period: PeriodEntry[]
    by_payment_type: { payment_type: string; count: number; revenue_eur: number }[]
    by_status: { status: string; count: number; total_eur: number }[]
  }
  invoices: {
    summary: {
      total_invoices: number
      paid_invoices: number
      total_invoiced_eur: number
    }
    by_period: PeriodEntry[]
  }
}

interface ConsumptionData {
  period: { months: number; group: string; since: string }
  feature_consumption: {
    summary: {
      total_events: number
      unique_users: number
      total_units: number
      total_cost_egili: number
      distinct_features: number
    }
    by_feature: { feature_code: string; events: number; total_units: number; total_cost_egili: number; unique_users: number }[]
    by_period: PeriodEntry[]
  }
  ai_credits: {
    summary: {
      total_transactions: number
      total_purchased: number
      total_consumed: number
      total_expired: number
      total_tokens: number
    }
    by_type: { transaction_type: string; count: number; total_amount: number; total_tokens: number }[]
    by_feature: { feature_used: string; count: number; total_amount: number; total_tokens: number }[]
  }
}

interface EgiliData {
  period: { months: number; group: string; since: string }
  circulation: { current_total: number }
  summary: {
    total_transactions: number
    active_wallets: number
    total_in: number
    total_out: number
    net_flow: number
    total_expired: number
    expired_count: number
  }
  by_type: { transaction_type: string; count: number; total_amount: number; wallets_involved: number }[]
  by_category: { category: string; count: number; total_amount: number }[]
  by_period: PeriodEntry[]
}

interface ApiResponse<T> {
  success: boolean
  data: T
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

const CHART_COLORS = [
  '#6366f1', '#22d3ee', '#f59e0b', '#10b981',
  '#f43f5e', '#a78bfa', '#34d399', '#fb923c',
]

function fmt(n: number, decimals = 2): string {
  return n.toLocaleString('it-IT', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
}

function SummaryCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="stat bg-base-200 rounded-xl">
      <div className="stat-title text-xs">{label}</div>
      <div className="stat-value text-lg">{value}</div>
      {sub && <div className="stat-desc">{sub}</div>}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Tab: Revenue
// ─────────────────────────────────────────────────────────────────────────────

function RevenueTab({ months, group }: { months: number; group: Group }) {
  const { data, isLoading, error } = useQuery<ApiResponse<RevenueData>>({
    queryKey: ['analytics-revenue', months, group],
    queryFn: () => api.get(`/superadmin/analytics/revenue?months=${months}&group=${group}`).then(r => r.data),
    staleTime: 5 * 60 * 1000,
  })

  if (isLoading) return <div className="flex justify-center py-12"><span className="loading loading-spinner loading-lg" /></div>
  if (error || !data?.data) return <div className="alert alert-error">Errore caricamento dati revenue.</div>

  const d = data.data
  const ordersByPeriod = d.orders.by_period.map(r => ({
    period: r.period as string,
    revenue_eur: r.revenue_eur as number,
    completati: r.completed_count as number,
    totali: r.total_orders as number,
  }))

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <SummaryCard label="Ordini Totali" value={fmt(d.orders.summary.total_orders, 0)} sub={`${fmt(d.orders.summary.completed_orders, 0)} completati`} />
        <SummaryCard label="Revenue Ordini" value={`€ ${fmt(d.orders.summary.total_revenue_eur)}`} sub={`avg € ${fmt(d.orders.summary.avg_order_eur)}`} />
        <SummaryCard label="Fatture Emesse" value={fmt(d.invoices.summary.total_invoices, 0)} sub={`${fmt(d.invoices.summary.paid_invoices, 0)} pagate`} />
        <SummaryCard label="Fatturato Pagato" value={`€ ${fmt(d.invoices.summary.total_invoiced_eur)}`} />
      </div>

      {/* Revenue per periodo */}
      {ordersByPeriod.length > 0 && (
        <div className="card bg-base-200">
          <div className="card-body">
            <h3 className="card-title text-sm">Revenue Ordini per Periodo</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={ordersByPeriod} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="period" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v: number) => `€${v}`} />
                <Tooltip formatter={(v: number) => [`€ ${fmt(v)}`, 'Revenue']} />
                <Bar dataKey="revenue_eur" fill="#6366f1" name="Revenue €" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Per tipo di pagamento */}
        {d.orders.by_payment_type.length > 0 && (
          <div className="card bg-base-200">
            <div className="card-body">
              <h3 className="card-title text-sm">Per Tipo di Pagamento</h3>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={d.orders.by_payment_type} dataKey="revenue_eur" nameKey="payment_type" cx="50%" cy="50%" outerRadius={70} label={({ payment_type }: { payment_type: string }) => payment_type}>
                    {d.orders.by_payment_type.map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: number) => `€ ${fmt(v)}`} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Per stato */}
        {d.orders.by_status.length > 0 && (
          <div className="card bg-base-200">
            <div className="card-body">
              <h3 className="card-title text-sm">Ordini per Stato</h3>
              <div className="overflow-x-auto">
                <table className="table table-xs">
                  <thead><tr><th>Stato</th><th className="text-right">Qty</th><th className="text-right">Totale €</th></tr></thead>
                  <tbody>
                    {d.orders.by_status.map(r => (
                      <tr key={r.status}>
                        <td><span className="badge badge-sm">{r.status}</span></td>
                        <td className="text-right">{r.count}</td>
                        <td className="text-right">€ {fmt(r.total_eur)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Tab: Consumo Feature
// ─────────────────────────────────────────────────────────────────────────────

function ConsumptionTab({ months, group }: { months: number; group: Group }) {
  const { data, isLoading, error } = useQuery<ApiResponse<ConsumptionData>>({
    queryKey: ['analytics-consumption', months, group],
    queryFn: () => api.get(`/superadmin/analytics/consumption?months=${months}&group=${group}`).then(r => r.data),
    staleTime: 5 * 60 * 1000,
  })

  if (isLoading) return <div className="flex justify-center py-12"><span className="loading loading-spinner loading-lg" /></div>
  if (error || !data?.data) return <div className="alert alert-error">Errore caricamento dati consumo.</div>

  const d = data.data
  const consumptionByPeriod = d.feature_consumption.by_period.map(r => ({
    period: r.period as string,
    total_cost_egili: r.total_cost_egili as number,
    events: r.events as number,
  }))

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <SummaryCard label="Eventi Feature" value={fmt(d.feature_consumption.summary.total_events, 0)} sub={`${d.feature_consumption.summary.distinct_features} feature distinte`} />
        <SummaryCard label="Utenti Unici" value={fmt(d.feature_consumption.summary.unique_users, 0)} />
        <SummaryCard label="Costo Totale Egili" value={fmt(d.feature_consumption.summary.total_cost_egili, 2)} sub="dalla feature consumption" />
        <SummaryCard label="AI Credits Consumati" value={fmt(d.ai_credits.summary.total_consumed, 2)} sub={`${fmt(d.ai_credits.summary.total_tokens, 0)} token`} />
      </div>

      {/* Consumo per periodo */}
      {consumptionByPeriod.length > 0 && (
        <div className="card bg-base-200">
          <div className="card-body">
            <h3 className="card-title text-sm">Consumo Feature per Periodo</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={consumptionByPeriod} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="period" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="total_cost_egili" fill="#22d3ee" name="Costo Egili" radius={[3, 3, 0, 0]} />
                <Bar dataKey="events" fill="#f59e0b" name="N° Eventi" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Top feature */}
        {d.feature_consumption.by_feature.length > 0 && (
          <div className="card bg-base-200">
            <div className="card-body">
              <h3 className="card-title text-sm">Top Feature per Costo Egili</h3>
              <div className="overflow-x-auto">
                <table className="table table-xs">
                  <thead><tr><th>Feature</th><th className="text-right">Utenti</th><th className="text-right">Costo Egili</th></tr></thead>
                  <tbody>
                    {d.feature_consumption.by_feature.slice(0, 10).map(r => (
                      <tr key={r.feature_code}>
                        <td className="font-mono text-xs">{r.feature_code}</td>
                        <td className="text-right">{r.unique_users}</td>
                        <td className="text-right">{fmt(r.total_cost_egili, 4)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* AI Credits per tipo */}
        {d.ai_credits.by_type.length > 0 && (
          <div className="card bg-base-200">
            <div className="card-body">
              <h3 className="card-title text-sm">AI Credits per Tipo Transazione</h3>
              <div className="space-y-2">
                <div className="text-xs text-base-content/60 mb-1">
                  Acquistati: <strong>{fmt(d.ai_credits.summary.total_purchased, 2)}</strong> •
                  Consumati: <strong>{fmt(d.ai_credits.summary.total_consumed, 2)}</strong> •
                  Scaduti: <strong>{fmt(d.ai_credits.summary.total_expired, 2)}</strong>
                </div>
                <div className="overflow-x-auto">
                  <table className="table table-xs">
                    <thead><tr><th>Tipo</th><th className="text-right">N°</th><th className="text-right">Importo</th></tr></thead>
                    <tbody>
                      {d.ai_credits.by_type.map(r => (
                        <tr key={r.transaction_type}>
                          <td><span className="badge badge-sm badge-ghost">{r.transaction_type}</span></td>
                          <td className="text-right">{r.count}</td>
                          <td className="text-right">{fmt(r.total_amount, 4)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Tab: Egili Economics
// ─────────────────────────────────────────────────────────────────────────────

function EgiliTab({ months, group }: { months: number; group: Group }) {
  const { data, isLoading, error } = useQuery<ApiResponse<EgiliData>>({
    queryKey: ['analytics-egili', months, group],
    queryFn: () => api.get(`/superadmin/analytics/egili?months=${months}&group=${group}`).then(r => r.data),
    staleTime: 5 * 60 * 1000,
  })

  if (isLoading) return <div className="flex justify-center py-12"><span className="loading loading-spinner loading-lg" /></div>
  if (error || !data?.data) return <div className="alert alert-error">Errore caricamento dati Egili.</div>

  const d = data.data
  const flowByPeriod = d.by_period.map(r => ({
    period: r.period as string,
    entrata: r.total_in as number,
    uscita: r.total_out as number,
    net_flow: r.net_flow as number,
  }))

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <SummaryCard label="Circolazione Corrente" value={fmt(d.circulation.current_total, 2)} sub="balance totale wallet" />
        <SummaryCard label="Wallet Attivi" value={fmt(d.summary.active_wallets, 0)} sub={`su ${months} mesi`} />
        <SummaryCard label="Flusso Netto" value={fmt(d.summary.net_flow, 2)} sub={`+${fmt(d.summary.total_in, 2)} / -${fmt(d.summary.total_out, 2)}`} />
        <SummaryCard label="Transazioni" value={fmt(d.summary.total_transactions, 0)} sub={`${d.summary.expired_count} scadute`} />
      </div>

      {/* Flussi per periodo */}
      {flowByPeriod.length > 0 && (
        <div className="card bg-base-200">
          <div className="card-body">
            <h3 className="card-title text-sm">Flussi Egili per Periodo</h3>
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={flowByPeriod} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="period" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="entrata" stroke="#10b981" strokeWidth={2} dot={false} name="Entrata" />
                <Line type="monotone" dataKey="uscita" stroke="#f43f5e" strokeWidth={2} dot={false} name="Uscita" />
                <Line type="monotone" dataKey="net_flow" stroke="#6366f1" strokeWidth={2} strokeDasharray="5 5" dot={false} name="Net Flow" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Per tipo */}
        {d.by_type.length > 0 && (
          <div className="card bg-base-200">
            <div className="card-body">
              <h3 className="card-title text-sm">Per Tipo di Transazione</h3>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={d.by_type} dataKey="total_amount" nameKey="transaction_type" cx="50%" cy="50%" outerRadius={70}>
                    {d.by_type.map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: number) => fmt(v, 4)} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Per categoria */}
        {d.by_category.length > 0 && (
          <div className="card bg-base-200">
            <div className="card-body">
              <h3 className="card-title text-sm">Top Categorie</h3>
              <div className="overflow-x-auto">
                <table className="table table-xs">
                  <thead><tr><th>Categoria</th><th className="text-right">N°</th><th className="text-right">Totale</th></tr></thead>
                  <tbody>
                    {d.by_category.slice(0, 10).map(r => (
                      <tr key={r.category}>
                        <td>{r.category}</td>
                        <td className="text-right">{r.count}</td>
                        <td className="text-right">{fmt(r.total_amount, 4)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────────────────────

const TAB_CONFIG: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: 'revenue',     label: 'Revenue',         icon: TrendingUp },
  { id: 'consumption', label: 'Consumo Feature',  icon: Zap },
  { id: 'egili',       label: 'Economia Egili',   icon: Coins },
]

const MONTHS_OPTIONS = [3, 6, 12, 24] as const

export default function EconomicDashboard() {
  const [activeTab, setActiveTab] = useState<Tab>('revenue')
  const [months, setMonths]       = useState<number>(12)
  const [group, setGroup]         = useState<Group>('monthly')

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-primary" />
            Dashboard Economica
          </h1>
          <p className="text-base-content/60 text-sm mt-1">
            Vista aggregata sull'economia dell'ecosistema — solo lettura
          </p>
        </div>

        {/* Filtri periodo */}
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-base-content/50" />
          <select
            className="select select-sm select-bordered"
            value={months}
            onChange={e => setMonths(Number(e.target.value))}
          >
            {MONTHS_OPTIONS.map(m => (
              <option key={m} value={m}>{m} mesi</option>
            ))}
          </select>
          <select
            className="select select-sm select-bordered"
            value={group}
            onChange={e => setGroup(e.target.value as Group)}
          >
            <option value="monthly">Mensile</option>
            <option value="yearly">Annuale</option>
          </select>
          <RefreshCw className="w-4 h-4 text-base-content/40 cursor-default" />
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="tabs tabs-boxed w-fit">
        {TAB_CONFIG.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            className={`tab gap-2 ${activeTab === id ? 'tab-active' : ''}`}
            onClick={() => setActiveTab(id)}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'revenue'     && <RevenueTab     months={months} group={group} />}
      {activeTab === 'consumption' && <ConsumptionTab months={months} group={group} />}
      {activeTab === 'egili'       && <EgiliTab       months={months} group={group} />}
    </div>
  )
}
