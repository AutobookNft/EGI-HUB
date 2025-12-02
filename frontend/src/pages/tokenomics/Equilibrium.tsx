import { useQuery } from '@tanstack/react-query';
import { Scale, Loader2, AlertCircle, TrendingUp, TrendingDown, Activity } from 'lucide-react';
import api from '../../services/api';

interface EquilibriumStats {
  balance_index: number;
  total_credits: number;
  total_debits: number;
  last_adjustment: string;
  trend: 'up' | 'down' | 'stable';
}

interface EquilibriumEntry {
  id: number;
  type: 'credit' | 'debit';
  amount: number;
  category: string;
  description: string;
  created_at: string;
}

interface EquilibriumResponse {
  stats: EquilibriumStats;
  entries: EquilibriumEntry[];
}

export default function Equilibrium() {
  const { data, isLoading, error } = useQuery<EquilibriumResponse>({
    queryKey: ['tokenomics-equilibrium'],
    queryFn: () => api.get('/superadmin/tokenomics/equilibrium').then(res => res.data),
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
        <span>Errore nel caricamento dell'Equilibrium. Assicurati che il backend EGI sia attivo.</span>
      </div>
    );
  }

  const getTrendIcon = () => {
    switch (data?.stats.trend) {
      case 'up': return <TrendingUp className="w-6 h-6 text-success" />;
      case 'down': return <TrendingDown className="w-6 h-6 text-error" />;
      default: return <Activity className="w-6 h-6 text-info" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-base-content">Equilibrium</h1>
        <p className="text-base-content/60">Sistema di bilanciamento economico della piattaforma</p>
      </div>

      {/* Main Balance Card */}
      <div className="card bg-gradient-to-br from-purple-500/20 to-blue-500/20 shadow-xl">
        <div className="card-body items-center text-center">
          <Scale className="w-16 h-16 text-purple-500 mb-4" />
          <h2 className="card-title text-3xl">Indice di Equilibrio</h2>
          <div className="text-6xl font-bold text-purple-600">
            {data?.stats.balance_index?.toFixed(2) ?? '0.00'}
          </div>
          <div className="flex items-center gap-2 mt-2">
            {getTrendIcon()}
            <span className="text-base-content/60">
              Ultimo aggiustamento: {data?.stats.last_adjustment ? new Date(data.stats.last_adjustment).toLocaleString('it-IT') : 'N/A'}
            </span>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="stat bg-base-100 rounded-box shadow">
          <div className="stat-figure text-success">
            <TrendingUp className="w-8 h-8" />
          </div>
          <div className="stat-title">Totale Crediti</div>
          <div className="stat-value text-success">+{data?.stats.total_credits?.toLocaleString() ?? 0}</div>
        </div>
        <div className="stat bg-base-100 rounded-box shadow">
          <div className="stat-figure text-error">
            <TrendingDown className="w-8 h-8" />
          </div>
          <div className="stat-title">Totale Debiti</div>
          <div className="stat-value text-error">-{data?.stats.total_debits?.toLocaleString() ?? 0}</div>
        </div>
      </div>

      {/* Entries Table */}
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <h2 className="card-title">Movimenti Recenti</h2>
          <div className="overflow-x-auto">
            <table className="table table-zebra">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Tipo</th>
                  <th>Importo</th>
                  <th>Categoria</th>
                  <th>Descrizione</th>
                  <th>Data</th>
                </tr>
              </thead>
              <tbody>
                {data?.entries?.length ? (
                  data.entries.map((entry) => (
                    <tr key={entry.id}>
                      <td>{entry.id}</td>
                      <td>
                        <span className={`badge ${entry.type === 'credit' ? 'badge-success' : 'badge-error'}`}>
                          {entry.type}
                        </span>
                      </td>
                      <td className={entry.type === 'credit' ? 'text-success' : 'text-error'}>
                        {entry.type === 'credit' ? '+' : '-'}{entry.amount.toLocaleString()}
                      </td>
                      <td><span className="badge badge-ghost">{entry.category}</span></td>
                      <td>{entry.description}</td>
                      <td>{new Date(entry.created_at).toLocaleDateString('it-IT')}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="text-center text-base-content/60">
                      Nessun movimento trovato
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
