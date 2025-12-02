import { useQuery } from '@tanstack/react-query';
import { BarChart3, Loader2, AlertCircle, TrendingUp, DollarSign, Clock, Zap } from 'lucide-react';
import api from '../../services/api';

interface StatisticsData {
  total_requests: number;
  total_tokens: number;
  total_cost: number;
  avg_response_time: number;
  requests_by_day: { date: string; count: number }[];
  requests_by_model: { model: string; count: number; tokens: number }[];
}

export default function Statistics() {
  const { data, isLoading, error } = useQuery<StatisticsData>({
    queryKey: ['ai-statistics'],
    queryFn: () => api.get('/superadmin/ai/statistics').then(res => res.data),
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
        <span>Errore nel caricamento delle statistiche. Assicurati che il backend EGI sia attivo.</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-base-content">Statistiche AI</h1>
        <p className="text-base-content/60">Analisi dettagliata dell'utilizzo AI</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="stat bg-base-100 rounded-box shadow">
          <div className="stat-figure text-primary">
            <TrendingUp className="w-8 h-8" />
          </div>
          <div className="stat-title">Richieste Totali</div>
          <div className="stat-value text-primary">{data?.total_requests?.toLocaleString() ?? 0}</div>
        </div>
        <div className="stat bg-base-100 rounded-box shadow">
          <div className="stat-figure text-secondary">
            <Zap className="w-8 h-8" />
          </div>
          <div className="stat-title">Token Utilizzati</div>
          <div className="stat-value text-secondary">{data?.total_tokens?.toLocaleString() ?? 0}</div>
        </div>
        <div className="stat bg-base-100 rounded-box shadow">
          <div className="stat-figure text-warning">
            <DollarSign className="w-8 h-8" />
          </div>
          <div className="stat-title">Costo Totale</div>
          <div className="stat-value text-warning">€{data?.total_cost?.toFixed(2) ?? '0.00'}</div>
        </div>
        <div className="stat bg-base-100 rounded-box shadow">
          <div className="stat-figure text-info">
            <Clock className="w-8 h-8" />
          </div>
          <div className="stat-title">Tempo Medio Risposta</div>
          <div className="stat-value text-info">{data?.avg_response_time ?? 0}ms</div>
        </div>
      </div>

      {/* Charts placeholder */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h2 className="card-title">Richieste per Giorno</h2>
            <div className="h-64 flex items-center justify-center text-base-content/40">
              <BarChart3 className="w-16 h-16" />
              <span className="ml-4">Grafico in arrivo</span>
            </div>
          </div>
        </div>
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h2 className="card-title">Utilizzo per Modello</h2>
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>Modello</th>
                    <th>Richieste</th>
                    <th>Token</th>
                  </tr>
                </thead>
                <tbody>
                  {data?.requests_by_model?.length ? (
                    data.requests_by_model.map((item, idx) => (
                      <tr key={idx}>
                        <td><span className="badge badge-ghost">{item.model}</span></td>
                        <td>{item.count.toLocaleString()}</td>
                        <td>{item.tokens.toLocaleString()}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={3} className="text-center text-base-content/60">
                        Nessun dato disponibile
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
