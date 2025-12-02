import { useState, useEffect } from 'react';
import { Database, HardDrive, Server, Trash2, RefreshCw, AlertTriangle, CheckCircle, Building2 } from 'lucide-react';
import api from '@/services/api';

interface TenantStorage {
  id: string;
  tenant_name: string;
  database: {
    size_mb: number;
    tables_count: number;
    last_backup: string;
  };
  files: {
    size_mb: number;
    files_count: number;
    images_count: number;
  };
  total_size_mb: number;
  limit_mb: number;
  status: 'healthy' | 'warning' | 'critical';
}

interface SystemStats {
  total_storage_used_gb: number;
  total_storage_limit_gb: number;
  total_databases: number;
  last_global_backup: string;
  backup_status: 'ok' | 'pending' | 'failed';
}

export default function TenantStorage() {
  const [tenantStorage, setTenantStorage] = useState<TenantStorage[]>([]);
  const [systemStats, setSystemStats] = useState<SystemStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStorageData();
  }, []);

  const fetchStorageData = async () => {
    try {
      const response = await api.get('/superadmin/tenants/storage');
      setTenantStorage(response.data.tenants || []);
      setSystemStats(response.data.system || null);
    } catch (error) {
      console.error('Error fetching storage data:', error);
      // Demo data
      setTenantStorage([
        {
          id: '1',
          tenant_name: 'Galleria Moderna',
          database: { size_mb: 450, tables_count: 45, last_backup: '2025-12-01T03:00:00' },
          files: { size_mb: 1950, files_count: 1250, images_count: 890 },
          total_size_mb: 2400,
          limit_mb: 10240,
          status: 'healthy',
        },
        {
          id: '2',
          tenant_name: 'Arte Contemporanea',
          database: { size_mb: 1200, tables_count: 62, last_backup: '2025-12-01T03:00:00' },
          files: { size_mb: 17500, files_count: 8500, images_count: 6200 },
          total_size_mb: 18700,
          limit_mb: 51200,
          status: 'healthy',
        },
        {
          id: '3',
          tenant_name: 'Museo Digitale',
          database: { size_mb: 85, tables_count: 38, last_backup: '2025-12-01T03:00:00' },
          files: { size_mb: 415, files_count: 180, images_count: 120 },
          total_size_mb: 500,
          limit_mb: 2048,
          status: 'healthy',
        },
        {
          id: '4',
          tenant_name: 'Collezione Privata',
          database: { size_mb: 380, tables_count: 42, last_backup: '2025-11-15T03:00:00' },
          files: { size_mb: 4820, files_count: 2100, images_count: 1800 },
          total_size_mb: 5200,
          limit_mb: 10240,
          status: 'warning',
        },
      ]);
      setSystemStats({
        total_storage_used_gb: 26.5,
        total_storage_limit_gb: 100,
        total_databases: 4,
        last_global_backup: '2025-12-01T03:00:00',
        backup_status: 'ok',
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: TenantStorage['status']) => {
    const badges = {
      healthy: <span className="badge badge-success gap-1"><CheckCircle className="w-3 h-3" />Sano</span>,
      warning: <span className="badge badge-warning gap-1"><AlertTriangle className="w-3 h-3" />Attenzione</span>,
      critical: <span className="badge badge-error gap-1"><AlertTriangle className="w-3 h-3" />Critico</span>,
    };
    return badges[status];
  };

  const formatSize = (mb: number) => {
    if (mb >= 1024) {
      return `${(mb / 1024).toFixed(2)} GB`;
    }
    return `${mb} MB`;
  };

  const getUsagePercentage = (used: number, limit: number) => {
    return Math.round((used / limit) * 100);
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 90) return 'progress-error';
    if (percentage >= 70) return 'progress-warning';
    return 'progress-primary';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <span className="loading loading-spinner loading-lg text-primary"></span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3">
            <Database className="w-8 h-8 text-primary" />
            Database & Storage
          </h1>
          <p className="text-base-content/60 mt-1">
            Monitoraggio risorse di storage per tutti i tenant
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchStorageData} className="btn btn-ghost gap-2">
            <RefreshCw className="w-4 h-4" />
            Aggiorna
          </button>
          <button className="btn btn-primary gap-2">
            <Server className="w-4 h-4" />
            Backup Globale
          </button>
        </div>
      </div>

      {/* System Stats */}
      {systemStats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="stat bg-base-100 rounded-lg shadow-sm">
            <div className="stat-figure text-primary">
              <HardDrive className="w-8 h-8" />
            </div>
            <div className="stat-title">Storage Totale</div>
            <div className="stat-value text-lg">
              {systemStats.total_storage_used_gb} / {systemStats.total_storage_limit_gb} GB
            </div>
            <div className="stat-desc">
              <progress 
                className={`progress w-full ${getProgressColor(getUsagePercentage(systemStats.total_storage_used_gb, systemStats.total_storage_limit_gb))}`}
                value={systemStats.total_storage_used_gb} 
                max={systemStats.total_storage_limit_gb}
              ></progress>
            </div>
          </div>

          <div className="stat bg-base-100 rounded-lg shadow-sm">
            <div className="stat-figure text-secondary">
              <Database className="w-8 h-8" />
            </div>
            <div className="stat-title">Database Attivi</div>
            <div className="stat-value text-lg">{systemStats.total_databases}</div>
            <div className="stat-desc">tenant registrati</div>
          </div>

          <div className="stat bg-base-100 rounded-lg shadow-sm">
            <div className="stat-figure text-info">
              <Server className="w-8 h-8" />
            </div>
            <div className="stat-title">Ultimo Backup</div>
            <div className="stat-value text-lg">
              {new Date(systemStats.last_global_backup).toLocaleDateString('it-IT')}
            </div>
            <div className="stat-desc">
              {new Date(systemStats.last_global_backup).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>

          <div className="stat bg-base-100 rounded-lg shadow-sm">
            <div className={`stat-figure ${systemStats.backup_status === 'ok' ? 'text-success' : 'text-warning'}`}>
              {systemStats.backup_status === 'ok' ? (
                <CheckCircle className="w-8 h-8" />
              ) : (
                <AlertTriangle className="w-8 h-8" />
              )}
            </div>
            <div className="stat-title">Stato Backup</div>
            <div className={`stat-value text-lg ${systemStats.backup_status === 'ok' ? 'text-success' : 'text-warning'}`}>
              {systemStats.backup_status === 'ok' ? 'OK' : 'Attenzione'}
            </div>
            <div className="stat-desc">sistema di backup</div>
          </div>
        </div>
      )}

      {/* Tenant Storage Table */}
      <div className="card bg-base-100 shadow-sm">
        <div className="card-body">
          <h2 className="card-title text-lg mb-4">Storage per Tenant</h2>
          
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Tenant</th>
                  <th>Database</th>
                  <th>Files</th>
                  <th>Totale</th>
                  <th>Stato</th>
                  <th>Azioni</th>
                </tr>
              </thead>
              <tbody>
                {tenantStorage.map((tenant) => {
                  const usagePercent = getUsagePercentage(tenant.total_size_mb, tenant.limit_mb);
                  return (
                    <tr key={tenant.id} className="hover">
                      <td>
                        <div className="flex items-center gap-3">
                          <Building2 className="w-5 h-5 text-base-content/40" />
                          <div>
                            <div className="font-bold">{tenant.tenant_name}</div>
                            <div className="text-sm text-base-content/60">
                              Limite: {formatSize(tenant.limit_mb)}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="text-sm">
                          <div className="font-medium">{formatSize(tenant.database.size_mb)}</div>
                          <div className="text-base-content/60">
                            {tenant.database.tables_count} tabelle
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="text-sm">
                          <div className="font-medium">{formatSize(tenant.files.size_mb)}</div>
                          <div className="text-base-content/60">
                            {tenant.files.files_count} files ({tenant.files.images_count} immagini)
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="w-32">
                          <div className="flex justify-between text-sm mb-1">
                            <span>{formatSize(tenant.total_size_mb)}</span>
                            <span className="text-base-content/60">{usagePercent}%</span>
                          </div>
                          <progress 
                            className={`progress w-full ${getProgressColor(usagePercent)}`}
                            value={tenant.total_size_mb} 
                            max={tenant.limit_mb}
                          ></progress>
                        </div>
                      </td>
                      <td>{getStatusBadge(tenant.status)}</td>
                      <td>
                        <div className="flex gap-1">
                          <button className="btn btn-ghost btn-sm btn-square" title="Backup">
                            <Server className="w-4 h-4" />
                          </button>
                          <button className="btn btn-ghost btn-sm btn-square text-error" title="Pulisci cache">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
