import { useQuery } from '@tanstack/react-query';
import { Loader2, AlertCircle, Plus, CreditCard, TrendingUp, Users, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { getAiCredits, type CreditsResponse, type CreditTransaction } from '../../services/aiApi';

export default function Credits() {
  const { data, isLoading, error } = useQuery<CreditsResponse>({
    queryKey: ['ai-credits'],
    queryFn: () => getAiCredits(),
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
        <span>Errore nel caricamento dei crediti. Assicurati che il backend EGI sia attivo.</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-base-content">Gestione Crediti AI</h1>
          <p className="text-base-content/60">Assegna e monitora i crediti AI degli utenti</p>
        </div>
        <button className="btn btn-primary gap-2">
          <Plus className="w-4 h-4" />
          Assegna Crediti
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="stat bg-base-100 rounded-box shadow">
          <div className="stat-figure text-primary">
            <CreditCard className="w-8 h-8" />
          </div>
          <div className="stat-title">Crediti Emessi</div>
          <div className="stat-value text-primary">{data?.stats.total_credits_issued ?? 0}</div>
        </div>
        <div className="stat bg-base-100 rounded-box shadow">
          <div className="stat-figure text-secondary">
            <TrendingUp className="w-8 h-8" />
          </div>
          <div className="stat-title">Crediti Utilizzati</div>
          <div className="stat-value text-secondary">{data?.stats.total_credits_used ?? 0}</div>
        </div>
        <div className="stat bg-base-100 rounded-box shadow">
          <div className="stat-figure text-success">
            <CreditCard className="w-8 h-8" />
          </div>
          <div className="stat-title">Crediti Disponibili</div>
          <div className="stat-value text-success">{data?.stats.total_credits_available ?? 0}</div>
        </div>
        <div className="stat bg-base-100 rounded-box shadow">
          <div className="stat-figure text-info">
            <Users className="w-8 h-8" />
          </div>
          <div className="stat-title">Utenti con Crediti</div>
          <div className="stat-value text-info">{data?.stats.users_with_credits ?? 0}</div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <h2 className="card-title">Ultime Transazioni</h2>
          <div className="overflow-x-auto">
            <table className="table table-zebra">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Utente</th>
                  <th>Tipo</th>
                  <th>Importo</th>
                  <th>Motivo</th>
                  <th>Data</th>
                </tr>
              </thead>
              <tbody>
                {data?.transactions?.length ? (
                  data.transactions.map((tx: CreditTransaction) => (
                    <tr key={tx.id}>
                      <td>{tx.id}</td>
                      <td>{tx.user_name}</td>
                      <td>
                        <span className={`badge ${tx.type === 'assigned' ? 'badge-success' :
                          tx.type === 'used' ? 'badge-warning' :
                            'badge-error'
                          }`}>
                          {tx.type === 'assigned' ? <ArrowUpRight className="w-3 h-3 mr-1" /> :
                            tx.type === 'used' ? <ArrowDownRight className="w-3 h-3 mr-1" /> : null}
                          {tx.type}
                        </span>
                      </td>
                      <td className={tx.type === 'assigned' ? 'text-success' : 'text-error'}>
                        {tx.type === 'assigned' ? '+' : '-'}{tx.amount}
                      </td>
                      <td>{tx.reason}</td>
                      <td>{new Date(tx.created_at).toLocaleDateString('it-IT')}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="text-center text-base-content/60">
                      Nessuna transazione trovata
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
