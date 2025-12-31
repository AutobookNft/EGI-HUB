import { useQuery } from '@tanstack/react-query';
import { Loader2, AlertCircle, MessageSquare, Calendar, User, Eye } from 'lucide-react';
import { getAiConsultations, type AiStats, type Consultation } from '../../services/aiApi';

export default function Consultations() {
  const { data, isLoading, error } = useQuery<AiStats>({
    queryKey: ['ai-consultations'],
    queryFn: () => getAiConsultations(),
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
        <span>Errore nel caricamento delle consultazioni. Assicurati che il backend EGI sia attivo.</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-base-content">AI Consultazioni</h1>
          <p className="text-base-content/60">Monitoraggio delle consultazioni AI della piattaforma</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="stat bg-base-100 rounded-box shadow">
          <div className="stat-figure text-primary">
            <MessageSquare className="w-8 h-8" />
          </div>
          <div className="stat-title">Totale Consultazioni</div>
          <div className="stat-value text-primary">{data?.meta.total ?? 0}</div>
        </div>
        <div className="stat bg-base-100 rounded-box shadow">
          <div className="stat-figure text-secondary">
            <Calendar className="w-8 h-8" />
          </div>
          <div className="stat-title">Oggi</div>
          <div className="stat-value text-secondary">{data?.meta.today ?? 0}</div>
        </div>
        <div className="stat bg-base-100 rounded-box shadow">
          <div className="stat-figure text-accent">
            <Calendar className="w-8 h-8" />
          </div>
          <div className="stat-title">Questa Settimana</div>
          <div className="stat-value text-accent">{data?.meta.week ?? 0}</div>
        </div>
      </div>

      {/* Consultations Table */}
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <h2 className="card-title">Ultime Consultazioni</h2>
          <div className="overflow-x-auto">
            <table className="table table-zebra">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Utente</th>
                  <th>EGI</th>
                  <th>Modello</th>
                  <th>Token</th>
                  <th>Data</th>
                  <th>Azioni</th>
                </tr>
              </thead>
              <tbody>
                {data?.data?.length ? (
                  data.data.map((consultation: Consultation) => (
                    <tr key={consultation.id}>
                      <td>{consultation.id}</td>
                      <td>
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4" />
                          {consultation.user_name}
                        </div>
                      </td>
                      <td>{consultation.egi_name}</td>
                      <td><span className="badge badge-ghost">{consultation.model}</span></td>
                      <td>{consultation.tokens_used}</td>
                      <td>{new Date(consultation.created_at).toLocaleDateString('it-IT')}</td>
                      <td>
                        <button className="btn btn-ghost btn-xs">
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="text-center text-base-content/60">
                      Nessuna consultazione trovata
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
