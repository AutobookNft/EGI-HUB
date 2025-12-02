import { useQuery } from '@tanstack/react-query';
import { TrendingUp, Loader2, AlertCircle, BarChart3, PieChart, Calendar } from 'lucide-react';
import api from '../../services/api';

interface PadminStatisticsData {
  overview: {
    total_files_scanned: number;
    total_violations: number;
    compliance_rate: number;
    avg_fix_time: number;
  };
  trends: {
    date: string;
    violations: number;
    fixes: number;
  }[];
  by_rule: {
    rule: string;
    count: number;
    percentage: number;
  }[];
  by_severity: {
    severity: string;
    count: number;
    percentage: number;
  }[];
}

export default function Statistics() {
  const { data, isLoading, error } = useQuery<PadminStatisticsData>({
    queryKey: ['padmin-statistics'],
    queryFn: () => api.get('/superadmin/padmin/statistics').then(res => res.data),
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
        <h1 className="text-2xl font-bold text-base-content">OS3 Statistics</h1>
        <p className="text-base-content/60">Statistiche dettagliate sulla compliance OS3</p>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="stat bg-base-100 rounded-box shadow">
          <div className="stat-figure text-primary">
            <BarChart3 className="w-8 h-8" />
          </div>
          <div className="stat-title">File Analizzati</div>
          <div className="stat-value text-primary">{data?.overview.total_files_scanned?.toLocaleString() ?? 0}</div>
        </div>
        <div className="stat bg-base-100 rounded-box shadow">
          <div className="stat-figure text-warning">
            <TrendingUp className="w-8 h-8" />
          </div>
          <div className="stat-title">Violazioni Totali</div>
          <div className="stat-value text-warning">{data?.overview.total_violations ?? 0}</div>
        </div>
        <div className="stat bg-base-100 rounded-box shadow">
          <div className="stat-figure text-success">
            <PieChart className="w-8 h-8" />
          </div>
          <div className="stat-title">Compliance Rate</div>
          <div className="stat-value text-success">{data?.overview.compliance_rate?.toFixed(1) ?? 0}%</div>
        </div>
        <div className="stat bg-base-100 rounded-box shadow">
          <div className="stat-figure text-info">
            <Calendar className="w-8 h-8" />
          </div>
          <div className="stat-title">Tempo Medio Fix</div>
          <div className="stat-value text-info">{data?.overview.avg_fix_time ?? 0}h</div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Violations by Rule */}
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h2 className="card-title">Violazioni per Regola</h2>
            <div className="space-y-3">
              {data?.by_rule?.length ? (
                data.by_rule.map((item, idx) => (
                  <div key={idx}>
                    <div className="flex justify-between text-sm mb-1">
                      <span>{item.rule}</span>
                      <span className="font-semibold">{item.count} ({item.percentage.toFixed(1)}%)</span>
                    </div>
                    <progress 
                      className="progress progress-warning" 
                      value={item.percentage} 
                      max="100"
                    />
                  </div>
                ))
              ) : (
                <p className="text-center text-base-content/60 py-8">Nessun dato disponibile</p>
              )}
            </div>
          </div>
        </div>

        {/* Violations by Severity */}
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h2 className="card-title">Violazioni per Severità</h2>
            <div className="space-y-3">
              {data?.by_severity?.length ? (
                data.by_severity.map((item, idx) => (
                  <div key={idx}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="capitalize">{item.severity}</span>
                      <span className="font-semibold">{item.count} ({item.percentage.toFixed(1)}%)</span>
                    </div>
                    <progress 
                      className={`progress ${
                        item.severity === 'critical' ? 'progress-error' :
                        item.severity === 'warning' ? 'progress-warning' : 'progress-info'
                      }`}
                      value={item.percentage} 
                      max="100"
                    />
                  </div>
                ))
              ) : (
                <p className="text-center text-base-content/60 py-8">Nessun dato disponibile</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Trends */}
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <h2 className="card-title">Trend Temporale</h2>
          <div className="h-64 flex items-center justify-center text-base-content/40">
            <BarChart3 className="w-16 h-16" />
            <span className="ml-4">Grafico trend in arrivo</span>
          </div>
        </div>
      </div>
    </div>
  );
}
