import { useQuery } from '@tanstack/react-query';
import { BookOpen, Loader2, AlertCircle, Download, Filter, Calendar } from 'lucide-react';
import api from '../../services/api';

interface ConsumptionEntry {
  id: number;
  user_id: number;
  user_name: string;
  feature: string;
  amount_egili: number;
  amount_eur: number;
  description: string;
  created_at: string;
}

interface ConsumptionStats {
  total_egili: number;
  total_eur: number;
  entries_count: number;
  period: string;
}

interface ConsumptionLedgerResponse {
  stats: ConsumptionStats;
  entries: ConsumptionEntry[];
}

export default function ConsumptionLedger() {
  const { data, isLoading, error } = useQuery<ConsumptionLedgerResponse>({
    queryKey: ['platform-consumption-ledger'],
    queryFn: () => api.get('/superadmin/platform/consumption-ledger').then(res => res.data),
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
        <span>Errore nel caricamento del ledger. Assicurati che il backend EGI sia attivo.</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-base-content">Consumption Ledger</h1>
          <p className="text-base-content/60">Registro dei consumi della piattaforma</p>
        </div>
        <div className="flex gap-2">
          <button className="btn btn-ghost gap-2">
            <Filter className="w-4 h-4" />
            Filtra
          </button>
          <button className="btn btn-primary gap-2">
            <Download className="w-4 h-4" />
            Esporta
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="stat bg-base-100 rounded-box shadow">
          <div className="stat-figure text-yellow-500">
            <BookOpen className="w-8 h-8" />
          </div>
          <div className="stat-title">Totale Egili Consumati</div>
          <div className="stat-value text-yellow-600">{data?.stats.total_egili?.toLocaleString() ?? 0}</div>
          <div className="stat-desc">{data?.stats.period}</div>
        </div>
        <div className="stat bg-base-100 rounded-box shadow">
          <div className="stat-figure text-success">
            <Calendar className="w-8 h-8" />
          </div>
          <div className="stat-title">Totale EUR</div>
          <div className="stat-value text-success">€{data?.stats.total_eur?.toFixed(2) ?? '0.00'}</div>
        </div>
        <div className="stat bg-base-100 rounded-box shadow">
          <div className="stat-figure text-info">
            <BookOpen className="w-8 h-8" />
          </div>
          <div className="stat-title">Transazioni</div>
          <div className="stat-value text-info">{data?.stats.entries_count ?? 0}</div>
        </div>
      </div>

      {/* Ledger Table */}
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <h2 className="card-title">Registro Consumi</h2>
          <div className="overflow-x-auto">
            <table className="table table-zebra">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Utente</th>
                  <th>Feature</th>
                  <th>Egili</th>
                  <th>EUR</th>
                  <th>Descrizione</th>
                  <th>Data</th>
                </tr>
              </thead>
              <tbody>
                {data?.entries?.length ? (
                  data.entries.map((entry) => (
                    <tr key={entry.id}>
                      <td>{entry.id}</td>
                      <td>{entry.user_name}</td>
                      <td><span className="badge badge-ghost">{entry.feature}</span></td>
                      <td className="text-yellow-600 font-semibold">{entry.amount_egili}</td>
                      <td>€{entry.amount_eur.toFixed(2)}</td>
                      <td className="max-w-xs truncate">{entry.description}</td>
                      <td>{new Date(entry.created_at).toLocaleString('it-IT')}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="text-center text-base-content/60">
                      Nessun consumo registrato
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
