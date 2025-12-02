import { useQuery } from '@tanstack/react-query';
import { Shield, Loader2, AlertCircle, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import api from '../../services/api';

interface PadminStats {
  total_scans: number;
  violations_found: number;
  auto_fixed: number;
  compliance_rate: number;
  last_scan: string;
}

interface RecentScan {
  id: number;
  file_path: string;
  violations_count: number;
  status: 'clean' | 'violations' | 'error';
  scanned_at: string;
}

interface PadminDashboardResponse {
  stats: PadminStats;
  recent_scans: RecentScan[];
}

export default function Dashboard() {
  const { data, isLoading, error } = useQuery<PadminDashboardResponse>({
    queryKey: ['padmin-dashboard'],
    queryFn: () => api.get('/superadmin/padmin/dashboard').then(res => res.data),
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
        <span>Errore nel caricamento della dashboard Padmin. Assicurati che il backend EGI sia attivo.</span>
      </div>
    );
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'clean': return <CheckCircle className="w-5 h-5 text-success" />;
      case 'violations': return <AlertTriangle className="w-5 h-5 text-warning" />;
      case 'error': return <XCircle className="w-5 h-5 text-error" />;
      default: return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-base-content">Padmin OS3 Dashboard</h1>
        <p className="text-base-content/60">Monitoraggio della compliance OS3 del codebase</p>
      </div>

      {/* Compliance Score */}
      <div className="card bg-gradient-to-br from-green-500/20 to-blue-500/20 shadow-xl">
        <div className="card-body items-center text-center">
          <Shield className="w-16 h-16 text-green-500 mb-4" />
          <h2 className="card-title text-3xl">OS3 Compliance Score</h2>
          <div className="radial-progress text-success text-4xl font-bold" 
               style={{ '--value': data?.stats.compliance_rate ?? 0, '--size': '12rem' } as React.CSSProperties}>
            {data?.stats.compliance_rate?.toFixed(1) ?? 0}%
          </div>
          <p className="text-base-content/60 mt-4">
            Ultimo scan: {data?.stats.last_scan ? new Date(data.stats.last_scan).toLocaleString('it-IT') : 'Mai'}
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="stat bg-base-100 rounded-box shadow">
          <div className="stat-title">Scan Totali</div>
          <div className="stat-value text-primary">{data?.stats.total_scans ?? 0}</div>
        </div>
        <div className="stat bg-base-100 rounded-box shadow">
          <div className="stat-title">Violazioni Trovate</div>
          <div className="stat-value text-warning">{data?.stats.violations_found ?? 0}</div>
        </div>
        <div className="stat bg-base-100 rounded-box shadow">
          <div className="stat-title">Auto-Fix Applicati</div>
          <div className="stat-value text-success">{data?.stats.auto_fixed ?? 0}</div>
        </div>
        <div className="stat bg-base-100 rounded-box shadow">
          <div className="stat-title">Compliance</div>
          <div className="stat-value text-info">{data?.stats.compliance_rate?.toFixed(1) ?? 0}%</div>
        </div>
      </div>

      {/* Recent Scans */}
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <h2 className="card-title">Scan Recenti</h2>
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>File</th>
                  <th>Stato</th>
                  <th>Violazioni</th>
                  <th>Data Scan</th>
                </tr>
              </thead>
              <tbody>
                {data?.recent_scans?.length ? (
                  data.recent_scans.map((scan) => (
                    <tr key={scan.id}>
                      <td><code className="text-sm">{scan.file_path}</code></td>
                      <td>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(scan.status)}
                          <span className="capitalize">{scan.status}</span>
                        </div>
                      </td>
                      <td>
                        <span className={`badge ${scan.violations_count > 0 ? 'badge-warning' : 'badge-success'}`}>
                          {scan.violations_count}
                        </span>
                      </td>
                      <td>{new Date(scan.scanned_at).toLocaleString('it-IT')}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="text-center text-base-content/60">
                      Nessuno scan recente
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
