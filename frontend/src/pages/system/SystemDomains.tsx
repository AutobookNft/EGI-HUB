import { useState, useEffect } from 'react';
import { Globe, Plus, Trash2, CheckCircle, XCircle, RefreshCw, Shield, ExternalLink } from 'lucide-react';
import api from '@/services/api';

interface Domain {
  id: string;
  domain: string;
  tenant_name: string;
  ssl_status: 'active' | 'pending' | 'expired' | 'none';
  ssl_expires: string | null;
  is_primary: boolean;
  is_verified: boolean;
  created_at: string;
}

export default function SystemDomains() {
  const [domains, setDomains] = useState<Domain[]>([]);
  const [loading, setLoading] = useState(true);
  const [_newDomain, _setNewDomain] = useState(''); // TODO: implement add domain

  useEffect(() => {
    fetchDomains();
  }, []);

  const fetchDomains = async () => {
    try {
      const response = await api.get('/superadmin/system/domains');
      setDomains(response.data.domains || []);
    } catch (error) {
      console.error('Error fetching domains:', error);
      // Demo data
      setDomains([
        {
          id: '1',
          domain: 'florenceegi.com',
          tenant_name: 'Platform',
          ssl_status: 'active',
          ssl_expires: '2026-03-15',
          is_primary: true,
          is_verified: true,
          created_at: '2024-01-01',
        },
        {
          id: '2',
          domain: 'galleria-moderna.florenceegi.com',
          tenant_name: 'Galleria Moderna',
          ssl_status: 'active',
          ssl_expires: '2026-03-15',
          is_primary: false,
          is_verified: true,
          created_at: '2024-06-15',
        },
        {
          id: '3',
          domain: 'artecontemporanea.it',
          tenant_name: 'Arte Contemporanea',
          ssl_status: 'active',
          ssl_expires: '2025-12-20',
          is_primary: false,
          is_verified: true,
          created_at: '2024-08-10',
        },
        {
          id: '4',
          domain: 'museo-digitale.example.com',
          tenant_name: 'Museo Digitale',
          ssl_status: 'pending',
          ssl_expires: null,
          is_primary: false,
          is_verified: false,
          created_at: '2025-11-25',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const getSSLBadge = (status: Domain['ssl_status']) => {
    const badges = {
      active: <span className="badge badge-success gap-1"><Shield className="w-3 h-3" />SSL Attivo</span>,
      pending: <span className="badge badge-warning gap-1"><RefreshCw className="w-3 h-3" />In Attesa</span>,
      expired: <span className="badge badge-error gap-1"><XCircle className="w-3 h-3" />Scaduto</span>,
      none: <span className="badge badge-ghost gap-1">Nessun SSL</span>,
    };
    return badges[status];
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
            <Globe className="w-8 h-8 text-primary" />
            Domini & SSL
          </h1>
          <p className="text-base-content/60 mt-1">
            Gestione domini e certificati SSL
          </p>
        </div>
        <button className="btn btn-primary gap-2">
          <Plus className="w-5 h-5" />
          Aggiungi Dominio
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="stat bg-base-100 rounded-lg shadow-sm">
          <div className="stat-title">Domini Totali</div>
          <div className="stat-value text-primary">{domains.length}</div>
        </div>
        <div className="stat bg-base-100 rounded-lg shadow-sm">
          <div className="stat-title">SSL Attivi</div>
          <div className="stat-value text-success">
            {domains.filter(d => d.ssl_status === 'active').length}
          </div>
        </div>
        <div className="stat bg-base-100 rounded-lg shadow-sm">
          <div className="stat-title">In Attesa</div>
          <div className="stat-value text-warning">
            {domains.filter(d => d.ssl_status === 'pending').length}
          </div>
        </div>
        <div className="stat bg-base-100 rounded-lg shadow-sm">
          <div className="stat-title">Scaduti/Mancanti</div>
          <div className="stat-value text-error">
            {domains.filter(d => d.ssl_status === 'expired' || d.ssl_status === 'none').length}
          </div>
        </div>
      </div>

      {/* Domains Table */}
      <div className="card bg-base-100 shadow-sm">
        <div className="card-body">
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Dominio</th>
                  <th>Tenant</th>
                  <th>SSL</th>
                  <th>Scadenza SSL</th>
                  <th>Stato</th>
                  <th>Azioni</th>
                </tr>
              </thead>
              <tbody>
                {domains.map((domain) => (
                  <tr key={domain.id} className="hover">
                    <td>
                      <div className="flex items-center gap-2">
                        <Globe className="w-4 h-4 text-base-content/40" />
                        <div>
                          <a 
                            href={`https://${domain.domain}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="font-medium hover:text-primary flex items-center gap-1"
                          >
                            {domain.domain}
                            <ExternalLink className="w-3 h-3" />
                          </a>
                          {domain.is_primary && (
                            <span className="badge badge-xs badge-primary">Primario</span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td>{domain.tenant_name}</td>
                    <td>{getSSLBadge(domain.ssl_status)}</td>
                    <td>
                      {domain.ssl_expires ? (
                        <span className={
                          new Date(domain.ssl_expires) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
                            ? 'text-warning'
                            : ''
                        }>
                          {new Date(domain.ssl_expires).toLocaleDateString('it-IT')}
                        </span>
                      ) : (
                        <span className="text-base-content/40">-</span>
                      )}
                    </td>
                    <td>
                      {domain.is_verified ? (
                        <span className="badge badge-success gap-1">
                          <CheckCircle className="w-3 h-3" />
                          Verificato
                        </span>
                      ) : (
                        <span className="badge badge-warning gap-1">
                          <RefreshCw className="w-3 h-3" />
                          Da verificare
                        </span>
                      )}
                    </td>
                    <td>
                      <div className="flex gap-1">
                        {!domain.is_verified && (
                          <button className="btn btn-ghost btn-sm" title="Verifica DNS">
                            <RefreshCw className="w-4 h-4" />
                          </button>
                        )}
                        {domain.ssl_status !== 'active' && (
                          <button className="btn btn-ghost btn-sm" title="Rinnova SSL">
                            <Shield className="w-4 h-4" />
                          </button>
                        )}
                        {!domain.is_primary && (
                          <button className="btn btn-ghost btn-sm text-error" title="Rimuovi">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* DNS Instructions */}
      <div className="card bg-base-100 shadow-sm">
        <div className="card-body">
          <h3 className="card-title text-lg">Configurazione DNS</h3>
          <p className="text-base-content/60 mb-4">
            Per aggiungere un dominio personalizzato, configura i seguenti record DNS:
          </p>
          <div className="overflow-x-auto">
            <table className="table table-sm bg-base-200 rounded-lg">
              <thead>
                <tr>
                  <th>Tipo</th>
                  <th>Nome</th>
                  <th>Valore</th>
                  <th>TTL</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><code className="badge badge-ghost">CNAME</code></td>
                  <td><code>@</code> o <code>www</code></td>
                  <td><code>proxy.florenceegi.com</code></td>
                  <td>3600</td>
                </tr>
                <tr>
                  <td><code className="badge badge-ghost">TXT</code></td>
                  <td><code>_egi-verify</code></td>
                  <td><code>egi-verify=xxxxxxxx</code></td>
                  <td>3600</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
