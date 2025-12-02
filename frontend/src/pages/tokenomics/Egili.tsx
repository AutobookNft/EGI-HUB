import { useQuery } from '@tanstack/react-query';
import { Coins, Loader2, AlertCircle, ArrowUpRight, ArrowDownRight, Flame, Sparkles } from 'lucide-react';
import api from '../../services/api';

interface EgiliStats {
  total_supply: number;
  circulating_supply: number;
  total_burned: number;
  total_minted: number;
}

interface EgiliTransaction {
  id: number;
  type: 'mint' | 'burn' | 'transfer';
  amount: number;
  from_user: string | null;
  to_user: string | null;
  reason: string;
  created_at: string;
}

interface EgiliResponse {
  stats: EgiliStats;
  transactions: EgiliTransaction[];
}

export default function Egili() {
  const { data, isLoading, error } = useQuery<EgiliResponse>({
    queryKey: ['tokenomics-egili'],
    queryFn: () => api.get('/superadmin/tokenomics/egili').then(res => res.data),
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
        <span>Errore nel caricamento dei dati Egili. Assicurati che il backend EGI sia attivo.</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-base-content">Egili Management</h1>
          <p className="text-base-content/60">Gestione del token Egili della piattaforma</p>
        </div>
        <div className="flex gap-2">
          <button className="btn btn-success gap-2">
            <Sparkles className="w-4 h-4" />
            Mint
          </button>
          <button className="btn btn-error gap-2">
            <Flame className="w-4 h-4" />
            Burn
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="stat bg-gradient-to-br from-yellow-500/20 to-orange-500/20 rounded-box shadow">
          <div className="stat-figure text-yellow-500">
            <Coins className="w-8 h-8" />
          </div>
          <div className="stat-title">Supply Totale</div>
          <div className="stat-value text-yellow-600">{data?.stats.total_supply?.toLocaleString() ?? 0}</div>
          <div className="stat-desc">EGILI</div>
        </div>
        <div className="stat bg-base-100 rounded-box shadow">
          <div className="stat-figure text-primary">
            <Coins className="w-8 h-8" />
          </div>
          <div className="stat-title">In Circolazione</div>
          <div className="stat-value text-primary">{data?.stats.circulating_supply?.toLocaleString() ?? 0}</div>
        </div>
        <div className="stat bg-base-100 rounded-box shadow">
          <div className="stat-figure text-success">
            <Sparkles className="w-8 h-8" />
          </div>
          <div className="stat-title">Totale Minted</div>
          <div className="stat-value text-success">+{data?.stats.total_minted?.toLocaleString() ?? 0}</div>
        </div>
        <div className="stat bg-base-100 rounded-box shadow">
          <div className="stat-figure text-error">
            <Flame className="w-8 h-8" />
          </div>
          <div className="stat-title">Totale Burned</div>
          <div className="stat-value text-error">-{data?.stats.total_burned?.toLocaleString() ?? 0}</div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <h2 className="card-title">Ultime Transazioni Egili</h2>
          <div className="overflow-x-auto">
            <table className="table table-zebra">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Tipo</th>
                  <th>Importo</th>
                  <th>Da</th>
                  <th>A</th>
                  <th>Motivo</th>
                  <th>Data</th>
                </tr>
              </thead>
              <tbody>
                {data?.transactions?.length ? (
                  data.transactions.map((tx) => (
                    <tr key={tx.id}>
                      <td>{tx.id}</td>
                      <td>
                        <span className={`badge gap-1 ${
                          tx.type === 'mint' ? 'badge-success' :
                          tx.type === 'burn' ? 'badge-error' :
                          'badge-info'
                        }`}>
                          {tx.type === 'mint' ? <ArrowUpRight className="w-3 h-3" /> :
                           tx.type === 'burn' ? <ArrowDownRight className="w-3 h-3" /> : null}
                          {tx.type}
                        </span>
                      </td>
                      <td className={
                        tx.type === 'mint' ? 'text-success font-semibold' :
                        tx.type === 'burn' ? 'text-error font-semibold' : ''
                      }>
                        {tx.type === 'mint' ? '+' : tx.type === 'burn' ? '-' : ''}{tx.amount.toLocaleString()}
                      </td>
                      <td>{tx.from_user ?? '-'}</td>
                      <td>{tx.to_user ?? '-'}</td>
                      <td>{tx.reason}</td>
                      <td>{new Date(tx.created_at).toLocaleDateString('it-IT')}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="text-center text-base-content/60">
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
