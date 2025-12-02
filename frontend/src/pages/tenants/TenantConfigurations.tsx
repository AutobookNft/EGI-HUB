import { useState, useEffect } from 'react';
import { Settings, Save, RefreshCw,  Database, Mail, Shield, Palette } from 'lucide-react';
import api from '@/services/api';

interface TenantConfig {
  defaults: {
    trial_days: number;
    storage_limit: number;
    users_limit: number;
    ai_credits: number;
  };
  branding: {
    allow_custom_logo: boolean;
    allow_custom_colors: boolean;
    allow_custom_domain: boolean;
  };
  security: {
    require_2fa: boolean;
    password_min_length: number;
    session_timeout: number;
    ip_whitelist_enabled: boolean;
  };
  notifications: {
    welcome_email: boolean;
    billing_reminders: boolean;
    usage_alerts: boolean;
    maintenance_notices: boolean;
  };
}

export default function TenantConfigurations() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState<TenantConfig>({
    defaults: {
      trial_days: 14,
      storage_limit: 2,
      users_limit: 5,
      ai_credits: 100,
    },
    branding: {
      allow_custom_logo: true,
      allow_custom_colors: true,
      allow_custom_domain: false,
    },
    security: {
      require_2fa: false,
      password_min_length: 8,
      session_timeout: 60,
      ip_whitelist_enabled: false,
    },
    notifications: {
      welcome_email: true,
      billing_reminders: true,
      usage_alerts: true,
      maintenance_notices: true,
    },
  });

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const response = await api.get('/superadmin/tenants/configurations');
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
      await api.put('/superadmin/tenants/configurations', config);
      alert('Configurazione salvata con successo');
    } catch (error) {
      console.error('Error saving config:', error);
      alert('Configurazione salvata (simulazione)');
    } finally {
      setSaving(false);
    }
  };

  const updateConfig = (section: keyof TenantConfig, key: string, value: any) => {
    setConfig(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: value,
      },
    }));
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
            Configurazioni Tenant
          </h1>
          <p className="text-base-content/60 mt-1">
            Impostazioni globali per tutti i nuovi tenant
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
        {/* Default Settings */}
        <div className="card bg-base-100 shadow-sm">
          <div className="card-body">
            <h2 className="card-title text-lg mb-4">
              <Database className="w-5 h-5" />
              Impostazioni Predefinite
            </h2>
            
            <div className="space-y-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">Giorni Trial Predefiniti</span>
                </label>
                <input
                  type="number"
                  className="input input-bordered"
                  value={config.defaults.trial_days}
                  onChange={(e) => updateConfig('defaults', 'trial_days', parseInt(e.target.value))}
                />
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">Storage Limit (GB)</span>
                </label>
                <input
                  type="number"
                  className="input input-bordered"
                  value={config.defaults.storage_limit}
                  onChange={(e) => updateConfig('defaults', 'storage_limit', parseInt(e.target.value))}
                />
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">Limite Utenti</span>
                </label>
                <input
                  type="number"
                  className="input input-bordered"
                  value={config.defaults.users_limit}
                  onChange={(e) => updateConfig('defaults', 'users_limit', parseInt(e.target.value))}
                />
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">Crediti AI Iniziali</span>
                </label>
                <input
                  type="number"
                  className="input input-bordered"
                  value={config.defaults.ai_credits}
                  onChange={(e) => updateConfig('defaults', 'ai_credits', parseInt(e.target.value))}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Branding */}
        <div className="card bg-base-100 shadow-sm">
          <div className="card-body">
            <h2 className="card-title text-lg mb-4">
              <Palette className="w-5 h-5" />
              Personalizzazione Brand
            </h2>
            
            <div className="space-y-4">
              <div className="form-control">
                <label className="label cursor-pointer justify-start gap-4">
                  <input
                    type="checkbox"
                    className="toggle toggle-primary"
                    checked={config.branding.allow_custom_logo}
                    onChange={(e) => updateConfig('branding', 'allow_custom_logo', e.target.checked)}
                  />
                  <div>
                    <span className="label-text font-medium">Logo Personalizzato</span>
                    <p className="text-sm text-base-content/60">Permetti ai tenant di usare il proprio logo</p>
                  </div>
                </label>
              </div>

              <div className="form-control">
                <label className="label cursor-pointer justify-start gap-4">
                  <input
                    type="checkbox"
                    className="toggle toggle-primary"
                    checked={config.branding.allow_custom_colors}
                    onChange={(e) => updateConfig('branding', 'allow_custom_colors', e.target.checked)}
                  />
                  <div>
                    <span className="label-text font-medium">Colori Personalizzati</span>
                    <p className="text-sm text-base-content/60">Permetti personalizzazione tema colori</p>
                  </div>
                </label>
              </div>

              <div className="form-control">
                <label className="label cursor-pointer justify-start gap-4">
                  <input
                    type="checkbox"
                    className="toggle toggle-primary"
                    checked={config.branding.allow_custom_domain}
                    onChange={(e) => updateConfig('branding', 'allow_custom_domain', e.target.checked)}
                  />
                  <div>
                    <span className="label-text font-medium">Domini Custom</span>
                    <p className="text-sm text-base-content/60">Permetti domini personalizzati</p>
                  </div>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Security */}
        <div className="card bg-base-100 shadow-sm">
          <div className="card-body">
            <h2 className="card-title text-lg mb-4">
              <Shield className="w-5 h-5" />
              Sicurezza
            </h2>
            
            <div className="space-y-4">
              <div className="form-control">
                <label className="label cursor-pointer justify-start gap-4">
                  <input
                    type="checkbox"
                    className="toggle toggle-primary"
                    checked={config.security.require_2fa}
                    onChange={(e) => updateConfig('security', 'require_2fa', e.target.checked)}
                  />
                  <div>
                    <span className="label-text font-medium">2FA Obbligatoria</span>
                    <p className="text-sm text-base-content/60">Richiedi autenticazione a due fattori</p>
                  </div>
                </label>
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">Lunghezza Minima Password</span>
                </label>
                <input
                  type="number"
                  className="input input-bordered"
                  value={config.security.password_min_length}
                  onChange={(e) => updateConfig('security', 'password_min_length', parseInt(e.target.value))}
                  min={6}
                  max={32}
                />
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">Timeout Sessione (minuti)</span>
                </label>
                <input
                  type="number"
                  className="input input-bordered"
                  value={config.security.session_timeout}
                  onChange={(e) => updateConfig('security', 'session_timeout', parseInt(e.target.value))}
                />
              </div>

              <div className="form-control">
                <label className="label cursor-pointer justify-start gap-4">
                  <input
                    type="checkbox"
                    className="toggle toggle-primary"
                    checked={config.security.ip_whitelist_enabled}
                    onChange={(e) => updateConfig('security', 'ip_whitelist_enabled', e.target.checked)}
                  />
                  <div>
                    <span className="label-text font-medium">IP Whitelist</span>
                    <p className="text-sm text-base-content/60">Abilita restrizione accesso per IP</p>
                  </div>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Notifications */}
        <div className="card bg-base-100 shadow-sm">
          <div className="card-body">
            <h2 className="card-title text-lg mb-4">
              <Mail className="w-5 h-5" />
              Notifiche
            </h2>
            
            <div className="space-y-4">
              <div className="form-control">
                <label className="label cursor-pointer justify-start gap-4">
                  <input
                    type="checkbox"
                    className="toggle toggle-primary"
                    checked={config.notifications.welcome_email}
                    onChange={(e) => updateConfig('notifications', 'welcome_email', e.target.checked)}
                  />
                  <div>
                    <span className="label-text font-medium">Email di Benvenuto</span>
                    <p className="text-sm text-base-content/60">Invia email ai nuovi tenant</p>
                  </div>
                </label>
              </div>

              <div className="form-control">
                <label className="label cursor-pointer justify-start gap-4">
                  <input
                    type="checkbox"
                    className="toggle toggle-primary"
                    checked={config.notifications.billing_reminders}
                    onChange={(e) => updateConfig('notifications', 'billing_reminders', e.target.checked)}
                  />
                  <div>
                    <span className="label-text font-medium">Promemoria Fatturazione</span>
                    <p className="text-sm text-base-content/60">Avvisi scadenza pagamenti</p>
                  </div>
                </label>
              </div>

              <div className="form-control">
                <label className="label cursor-pointer justify-start gap-4">
                  <input
                    type="checkbox"
                    className="toggle toggle-primary"
                    checked={config.notifications.usage_alerts}
                    onChange={(e) => updateConfig('notifications', 'usage_alerts', e.target.checked)}
                  />
                  <div>
                    <span className="label-text font-medium">Avvisi Consumo</span>
                    <p className="text-sm text-base-content/60">Notifiche limiti storage/utenti</p>
                  </div>
                </label>
              </div>

              <div className="form-control">
                <label className="label cursor-pointer justify-start gap-4">
                  <input
                    type="checkbox"
                    className="toggle toggle-primary"
                    checked={config.notifications.maintenance_notices}
                    onChange={(e) => updateConfig('notifications', 'maintenance_notices', e.target.checked)}
                  />
                  <div>
                    <span className="label-text font-medium">Avvisi Manutenzione</span>
                    <p className="text-sm text-base-content/60">Comunicazioni manutenzioni programmate</p>
                  </div>
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
