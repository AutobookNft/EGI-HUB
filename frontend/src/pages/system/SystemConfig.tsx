import { useState, useEffect } from 'react';
import { Settings, Save, RefreshCw, Globe, Mail, Cloud, Cpu } from 'lucide-react';
import api from '@/services/api';

export default function SystemConfig() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState({
    app: {
      name: 'FlorenceEGI',
      url: 'https://florenceegi.com',
      debug: false,
      timezone: 'Europe/Rome',
      locale: 'it',
    },
    mail: {
      driver: 'smtp',
      host: 'smtp.mailgun.org',
      port: 587,
      from_name: 'FlorenceEGI',
      from_address: 'noreply@florenceegi.com',
    },
    cache: {
      driver: 'redis',
      ttl: 3600,
    },
    queue: {
      driver: 'redis',
      default: 'default',
    },
  });

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const response = await api.get('/superadmin/system/config');
      if (response.data.config) {
        setConfig(response.data.config);
      }
    } catch (error) {
      console.error('Error fetching config:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put('/superadmin/system/config', config);
      alert('Configurazione salvata con successo');
    } catch (error) {
      console.error('Error saving config:', error);
      alert('Configurazione salvata (simulazione)');
    } finally {
      setSaving(false);
    }
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
            <Settings className="w-8 h-8 text-primary" />
            Configurazione Globale
          </h1>
          <p className="text-base-content/60 mt-1">
            Impostazioni di sistema della piattaforma
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchConfig} className="btn btn-ghost gap-2">
            <RefreshCw className="w-4 h-4" />
            Ricarica
          </button>
          <button onClick={handleSave} className="btn btn-primary gap-2" disabled={saving}>
            {saving ? (
              <span className="loading loading-spinner loading-sm"></span>
            ) : (
              <Save className="w-4 h-4" />
            )}
            Salva Modifiche
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* App Settings */}
        <div className="card bg-base-100 shadow-sm">
          <div className="card-body">
            <h2 className="card-title text-lg mb-4">
              <Globe className="w-5 h-5" />
              Applicazione
            </h2>
            
            <div className="space-y-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">Nome Applicazione</span>
                </label>
                <input
                  type="text"
                  className="input input-bordered"
                  value={config.app.name}
                  onChange={(e) => setConfig(prev => ({
                    ...prev,
                    app: { ...prev.app, name: e.target.value }
                  }))}
                />
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">URL Base</span>
                </label>
                <input
                  type="url"
                  className="input input-bordered"
                  value={config.app.url}
                  onChange={(e) => setConfig(prev => ({
                    ...prev,
                    app: { ...prev.app, url: e.target.value }
                  }))}
                />
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">Timezone</span>
                </label>
                <select
                  className="select select-bordered"
                  value={config.app.timezone}
                  onChange={(e) => setConfig(prev => ({
                    ...prev,
                    app: { ...prev.app, timezone: e.target.value }
                  }))}
                >
                  <option value="Europe/Rome">Europe/Rome</option>
                  <option value="Europe/London">Europe/London</option>
                  <option value="America/New_York">America/New_York</option>
                  <option value="UTC">UTC</option>
                </select>
              </div>

              <div className="form-control">
                <label className="label cursor-pointer justify-start gap-4">
                  <input
                    type="checkbox"
                    className="toggle toggle-warning"
                    checked={config.app.debug}
                    onChange={(e) => setConfig(prev => ({
                      ...prev,
                      app: { ...prev.app, debug: e.target.checked }
                    }))}
                  />
                  <div>
                    <span className="label-text font-medium">Modalità Debug</span>
                    <p className="text-sm text-base-content/60">⚠️ Disabilitare in produzione</p>
                  </div>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Mail Settings */}
        <div className="card bg-base-100 shadow-sm">
          <div className="card-body">
            <h2 className="card-title text-lg mb-4">
              <Mail className="w-5 h-5" />
              Email
            </h2>
            
            <div className="space-y-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">Driver</span>
                </label>
                <select
                  className="select select-bordered"
                  value={config.mail.driver}
                  onChange={(e) => setConfig(prev => ({
                    ...prev,
                    mail: { ...prev.mail, driver: e.target.value }
                  }))}
                >
                  <option value="smtp">SMTP</option>
                  <option value="mailgun">Mailgun</option>
                  <option value="ses">Amazon SES</option>
                  <option value="postmark">Postmark</option>
                </select>
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">Host SMTP</span>
                </label>
                <input
                  type="text"
                  className="input input-bordered"
                  value={config.mail.host}
                  onChange={(e) => setConfig(prev => ({
                    ...prev,
                    mail: { ...prev.mail, host: e.target.value }
                  }))}
                />
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">Porta</span>
                </label>
                <input
                  type="number"
                  className="input input-bordered"
                  value={config.mail.port}
                  onChange={(e) => setConfig(prev => ({
                    ...prev,
                    mail: { ...prev.mail, port: parseInt(e.target.value) }
                  }))}
                />
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">Email Mittente</span>
                </label>
                <input
                  type="email"
                  className="input input-bordered"
                  value={config.mail.from_address}
                  onChange={(e) => setConfig(prev => ({
                    ...prev,
                    mail: { ...prev.mail, from_address: e.target.value }
                  }))}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Cache Settings */}
        <div className="card bg-base-100 shadow-sm">
          <div className="card-body">
            <h2 className="card-title text-lg mb-4">
              <Cloud className="w-5 h-5" />
              Cache
            </h2>
            
            <div className="space-y-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">Driver Cache</span>
                </label>
                <select
                  className="select select-bordered"
                  value={config.cache.driver}
                  onChange={(e) => setConfig(prev => ({
                    ...prev,
                    cache: { ...prev.cache, driver: e.target.value }
                  }))}
                >
                  <option value="redis">Redis</option>
                  <option value="memcached">Memcached</option>
                  <option value="file">File</option>
                  <option value="database">Database</option>
                </select>
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">TTL Default (secondi)</span>
                </label>
                <input
                  type="number"
                  className="input input-bordered"
                  value={config.cache.ttl}
                  onChange={(e) => setConfig(prev => ({
                    ...prev,
                    cache: { ...prev.cache, ttl: parseInt(e.target.value) }
                  }))}
                />
              </div>

              <button className="btn btn-outline btn-error w-full mt-4">
                Svuota Cache
              </button>
            </div>
          </div>
        </div>

        {/* Queue Settings */}
        <div className="card bg-base-100 shadow-sm">
          <div className="card-body">
            <h2 className="card-title text-lg mb-4">
              <Cpu className="w-5 h-5" />
              Code
            </h2>
            
            <div className="space-y-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">Driver Code</span>
                </label>
                <select
                  className="select select-bordered"
                  value={config.queue.driver}
                  onChange={(e) => setConfig(prev => ({
                    ...prev,
                    queue: { ...prev.queue, driver: e.target.value }
                  }))}
                >
                  <option value="redis">Redis</option>
                  <option value="database">Database</option>
                  <option value="sqs">Amazon SQS</option>
                  <option value="sync">Sync</option>
                </select>
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">Coda Default</span>
                </label>
                <input
                  type="text"
                  className="input input-bordered"
                  value={config.queue.default}
                  onChange={(e) => setConfig(prev => ({
                    ...prev,
                    queue: { ...prev.queue, default: e.target.value }
                  }))}
                />
              </div>

              <div className="stats bg-base-200 w-full mt-4">
                <div className="stat">
                  <div className="stat-title">Jobs in Coda</div>
                  <div className="stat-value text-lg">12</div>
                </div>
                <div className="stat">
                  <div className="stat-title">Falliti</div>
                  <div className="stat-value text-lg text-error">2</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
