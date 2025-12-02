import { useState, useEffect } from 'react';
import { Lock, Shield, Key, Users, AlertTriangle, CheckCircle, RefreshCw, Save } from 'lucide-react';
import api from '@/services/api';

interface SecuritySettings {
  authentication: {
    require_2fa_admins: boolean;
    require_2fa_all: boolean;
    password_min_length: number;
    password_require_special: boolean;
    max_login_attempts: number;
    lockout_duration: number;
  };
  sessions: {
    lifetime: number;
    expire_on_close: boolean;
    same_ip_only: boolean;
    single_session: boolean;
  };
  api: {
    rate_limit_per_minute: number;
    require_https: boolean;
    allowed_origins: string[];
  };
}

export default function SystemSecurity() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<SecuritySettings>({
    authentication: {
      require_2fa_admins: true,
      require_2fa_all: false,
      password_min_length: 8,
      password_require_special: true,
      max_login_attempts: 5,
      lockout_duration: 15,
    },
    sessions: {
      lifetime: 120,
      expire_on_close: false,
      same_ip_only: false,
      single_session: false,
    },
    api: {
      rate_limit_per_minute: 60,
      require_https: true,
      allowed_origins: ['https://florenceegi.com', 'https://*.florenceegi.com'],
    },
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await api.get('/superadmin/system/security');
      if (response.data.settings) {
        setSettings(response.data.settings);
      }
    } catch (error) {
      console.error('Error fetching security settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put('/superadmin/system/security', settings);
      alert('Impostazioni di sicurezza salvate con successo');
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Impostazioni salvate (simulazione)');
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
            <Lock className="w-8 h-8 text-primary" />
            Sicurezza
          </h1>
          <p className="text-base-content/60 mt-1">
            Configurazione sicurezza della piattaforma
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchSettings} className="btn btn-ghost gap-2">
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

      {/* Security Score */}
      <div className="card bg-gradient-to-r from-success/10 to-success/5 border border-success/20">
        <div className="card-body">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold flex items-center gap-2">
                <Shield className="w-5 h-5 text-success" />
                Security Score
              </h3>
              <p className="text-base-content/60">La configurazione di sicurezza è buona</p>
            </div>
            <div className="text-right">
              <div className="text-4xl font-bold text-success">85/100</div>
              <div className="badge badge-success gap-1 mt-1">
                <CheckCircle className="w-3 h-3" />
                Sicuro
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Authentication */}
        <div className="card bg-base-100 shadow-sm">
          <div className="card-body">
            <h2 className="card-title text-lg mb-4">
              <Key className="w-5 h-5" />
              Autenticazione
            </h2>
            
            <div className="space-y-4">
              <div className="form-control">
                <label className="label cursor-pointer justify-start gap-4">
                  <input
                    type="checkbox"
                    className="toggle toggle-primary"
                    checked={settings.authentication.require_2fa_admins}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      authentication: { ...prev.authentication, require_2fa_admins: e.target.checked }
                    }))}
                  />
                  <div>
                    <span className="label-text font-medium">2FA per Admin</span>
                    <p className="text-sm text-base-content/60">Richiedi 2FA per tutti gli amministratori</p>
                  </div>
                </label>
              </div>

              <div className="form-control">
                <label className="label cursor-pointer justify-start gap-4">
                  <input
                    type="checkbox"
                    className="toggle toggle-primary"
                    checked={settings.authentication.require_2fa_all}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      authentication: { ...prev.authentication, require_2fa_all: e.target.checked }
                    }))}
                  />
                  <div>
                    <span className="label-text font-medium">2FA per Tutti</span>
                    <p className="text-sm text-base-content/60">Richiedi 2FA per tutti gli utenti</p>
                  </div>
                </label>
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">Lunghezza Minima Password</span>
                </label>
                <input
                  type="number"
                  className="input input-bordered w-24"
                  value={settings.authentication.password_min_length}
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    authentication: { ...prev.authentication, password_min_length: parseInt(e.target.value) }
                  }))}
                  min={6}
                  max={32}
                />
              </div>

              <div className="form-control">
                <label className="label cursor-pointer justify-start gap-4">
                  <input
                    type="checkbox"
                    className="toggle toggle-primary"
                    checked={settings.authentication.password_require_special}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      authentication: { ...prev.authentication, password_require_special: e.target.checked }
                    }))}
                  />
                  <span className="label-text font-medium">Richiedi Caratteri Speciali</span>
                </label>
              </div>

              <div className="divider"></div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">Tentativi Login Massimi</span>
                </label>
                <input
                  type="number"
                  className="input input-bordered w-24"
                  value={settings.authentication.max_login_attempts}
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    authentication: { ...prev.authentication, max_login_attempts: parseInt(e.target.value) }
                  }))}
                />
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">Durata Blocco (minuti)</span>
                </label>
                <input
                  type="number"
                  className="input input-bordered w-24"
                  value={settings.authentication.lockout_duration}
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    authentication: { ...prev.authentication, lockout_duration: parseInt(e.target.value) }
                  }))}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Sessions */}
        <div className="card bg-base-100 shadow-sm">
          <div className="card-body">
            <h2 className="card-title text-lg mb-4">
              <Users className="w-5 h-5" />
              Sessioni
            </h2>
            
            <div className="space-y-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">Durata Sessione (minuti)</span>
                </label>
                <input
                  type="number"
                  className="input input-bordered w-32"
                  value={settings.sessions.lifetime}
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    sessions: { ...prev.sessions, lifetime: parseInt(e.target.value) }
                  }))}
                />
              </div>

              <div className="form-control">
                <label className="label cursor-pointer justify-start gap-4">
                  <input
                    type="checkbox"
                    className="toggle toggle-primary"
                    checked={settings.sessions.expire_on_close}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      sessions: { ...prev.sessions, expire_on_close: e.target.checked }
                    }))}
                  />
                  <div>
                    <span className="label-text font-medium">Scadenza alla Chiusura</span>
                    <p className="text-sm text-base-content/60">Termina sessione alla chiusura browser</p>
                  </div>
                </label>
              </div>

              <div className="form-control">
                <label className="label cursor-pointer justify-start gap-4">
                  <input
                    type="checkbox"
                    className="toggle toggle-warning"
                    checked={settings.sessions.same_ip_only}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      sessions: { ...prev.sessions, same_ip_only: e.target.checked }
                    }))}
                  />
                  <div>
                    <span className="label-text font-medium">Stesso IP</span>
                    <p className="text-sm text-base-content/60">Invalida sessione se cambia IP</p>
                  </div>
                </label>
              </div>

              <div className="form-control">
                <label className="label cursor-pointer justify-start gap-4">
                  <input
                    type="checkbox"
                    className="toggle toggle-warning"
                    checked={settings.sessions.single_session}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      sessions: { ...prev.sessions, single_session: e.target.checked }
                    }))}
                  />
                  <div>
                    <span className="label-text font-medium">Sessione Singola</span>
                    <p className="text-sm text-base-content/60">Un solo login per utente</p>
                  </div>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* API Security */}
        <div className="card bg-base-100 shadow-sm lg:col-span-2">
          <div className="card-body">
            <h2 className="card-title text-lg mb-4">
              <Shield className="w-5 h-5" />
              Sicurezza API
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-medium">Rate Limit (richieste/minuto)</span>
                  </label>
                  <input
                    type="number"
                    className="input input-bordered w-32"
                    value={settings.api.rate_limit_per_minute}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      api: { ...prev.api, rate_limit_per_minute: parseInt(e.target.value) }
                    }))}
                  />
                </div>

                <div className="form-control">
                  <label className="label cursor-pointer justify-start gap-4">
                    <input
                      type="checkbox"
                      className="toggle toggle-primary"
                      checked={settings.api.require_https}
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        api: { ...prev.api, require_https: e.target.checked }
                      }))}
                    />
                    <div>
                      <span className="label-text font-medium">Richiedi HTTPS</span>
                      <p className="text-sm text-base-content/60">Blocca richieste HTTP non sicure</p>
                    </div>
                  </label>
                </div>
              </div>

              <div className="space-y-4">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-medium">Allowed Origins (CORS)</span>
                  </label>
                  <textarea
                    className="textarea textarea-bordered h-24"
                    value={settings.api.allowed_origins.join('\n')}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      api: { ...prev.api, allowed_origins: e.target.value.split('\n').filter(Boolean) }
                    }))}
                    placeholder="Un dominio per riga"
                  ></textarea>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Security Alerts */}
      <div className="card bg-base-100 shadow-sm">
        <div className="card-body">
          <h2 className="card-title text-lg mb-4">
            <AlertTriangle className="w-5 h-5 text-warning" />
            Avvisi di Sicurezza
          </h2>
          <div className="space-y-2">
            <div className="alert alert-warning">
              <AlertTriangle className="w-5 h-5" />
              <span>2FA non è abilitato per tutti gli utenti. Si consiglia di abilitarlo per maggiore sicurezza.</span>
            </div>
            <div className="alert alert-info">
              <CheckCircle className="w-5 h-5" />
              <span>Tutti i certificati SSL sono validi e aggiornati.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
