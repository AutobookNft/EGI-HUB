import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, Loader2, AlertCircle, Wrench, Eye, Filter } from 'lucide-react';
import api from '../../services/api';

interface Violation {
  id: number;
  file_path: string;
  line_number: number;
  rule: string;
  severity: 'critical' | 'warning' | 'info';
  message: string;
  suggestion: string;
  can_auto_fix: boolean;
  created_at: string;
}

interface ViolationsResponse {
  violations: Violation[];
  total: number;
  by_severity: {
    critical: number;
    warning: number;
    info: number;
  };
}

export default function Violations() {
  const { data, isLoading, error } = useQuery<ViolationsResponse>({
    queryKey: ['padmin-violations'],
    queryFn: () => api.get('/superadmin/padmin/violations').then(res => res.data),
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
        <span>Errore nel caricamento delle violazioni. Assicurati che il backend EGI sia attivo.</span>
      </div>
    );
  }

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'critical': return 'badge-error';
      case 'warning': return 'badge-warning';
      case 'info': return 'badge-info';
      default: return 'badge-ghost';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-base-content">OS3 Violations</h1>
          <p className="text-base-content/60">Violazioni delle regole OS3 nel codebase</p>
        </div>
        <button className="btn btn-ghost gap-2">
          <Filter className="w-4 h-4" />
          Filtra
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="stat bg-base-100 rounded-box shadow">
          <div className="stat-title">Totale Violazioni</div>
          <div className="stat-value">{data?.total ?? 0}</div>
        </div>
        <div className="stat bg-base-100 rounded-box shadow">
          <div className="stat-figure text-error">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <div className="stat-title">Critiche</div>
          <div className="stat-value text-error">{data?.by_severity.critical ?? 0}</div>
        </div>
        <div className="stat bg-base-100 rounded-box shadow">
          <div className="stat-figure text-warning">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <div className="stat-title">Warning</div>
          <div className="stat-value text-warning">{data?.by_severity.warning ?? 0}</div>
        </div>
        <div className="stat bg-base-100 rounded-box shadow">
          <div className="stat-figure text-info">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <div className="stat-title">Info</div>
          <div className="stat-value text-info">{data?.by_severity.info ?? 0}</div>
        </div>
      </div>

      {/* Violations Table */}
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Severità</th>
                  <th>File</th>
                  <th>Riga</th>
                  <th>Regola</th>
                  <th>Messaggio</th>
                  <th>Azioni</th>
                </tr>
              </thead>
              <tbody>
                {data?.violations?.length ? (
                  data.violations.map((violation) => (
                    <tr key={violation.id}>
                      <td>
                        <span className={`badge ${getSeverityBadge(violation.severity)}`}>
                          {violation.severity}
                        </span>
                      </td>
                      <td><code className="text-xs">{violation.file_path}</code></td>
                      <td>{violation.line_number}</td>
                      <td><span className="badge badge-ghost">{violation.rule}</span></td>
                      <td className="max-w-md">
                        <div className="text-sm">{violation.message}</div>
                        {violation.suggestion && (
                          <div className="text-xs text-success mt-1">
                            💡 {violation.suggestion}
                          </div>
                        )}
                      </td>
                      <td>
                        <div className="flex gap-1">
                          <button className="btn btn-ghost btn-xs">
                            <Eye className="w-4 h-4" />
                          </button>
                          {violation.can_auto_fix && (
                            <button className="btn btn-success btn-xs">
                              <Wrench className="w-4 h-4" />
                              Fix
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="text-center py-12">
                      <AlertTriangle className="w-12 h-12 mx-auto text-success/30 mb-4" />
                      <p className="text-success font-semibold">Nessuna violazione trovata! 🎉</p>
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
