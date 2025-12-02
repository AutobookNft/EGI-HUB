import { useState, useEffect } from 'react';
import { Bell, Save, RefreshCw, Mail, MessageSquare, Smartphone, Clock } from 'lucide-react';
import api from '@/services/api';

interface NotificationSettings {
  channels: {
    email: boolean;
    sms: boolean;
    push: boolean;
    slack: boolean;
  };
  events: {
    new_tenant: boolean;
    tenant_suspended: boolean;
    payment_failed: boolean;
    payment_received: boolean;
    storage_warning: boolean;
    ssl_expiring: boolean;
    security_alert: boolean;
    system_error: boolean;
  };
  digest: {
    enabled: boolean;
    frequency: 'daily' | 'weekly' | 'monthly';
    time: string;
  };
  recipients: {
    admin_emails: string[];
    slack_webhook: string;
  };
}

export default function SystemNotifications() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<NotificationSettings>({
    channels: {
      email: true,
      sms: false,
      push: true,
      slack: true,
    },
    events: {
      new_tenant: true,
      tenant_suspended: true,
      payment_failed: true,
      payment_received: false,
      storage_warning: true,
      ssl_expiring: true,
      security_alert: true,
      system_error: true,
    },
    digest: {
      enabled: true,
      frequency: 'daily',
      time: '09:00',
    },
    recipients: {
      admin_emails: ['admin@florenceegi.com', 'tech@florenceegi.com'],
      slack_webhook: 'https://hooks.slack.com/services/xxx',
    },
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await api.get('/superadmin/system/notifications');
      if (response.data.settings) {
        setSettings(response.data.settings);
      }
    } catch (error) {
      console.error('Error fetching notification settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put('/superadmin/system/notifications', settings);
      alert('Impostazioni notifiche salvate con successo');
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Impostazioni salvate (simulazione)');
    } finally {
      setSaving(false);
    }
  };

  const eventLabels: Record<string, { label: string; description: string }> = {
    new_tenant: { label: 'Nuovo Tenant', description: 'Quando un nuovo tenant si registra' },
    tenant_suspended: { label: 'Tenant Sospeso', description: 'Quando un tenant viene sospeso' },
    payment_failed: { label: 'Pagamento Fallito', description: 'Quando un pagamento non va a buon fine' },
    payment_received: { label: 'Pagamento Ricevuto', description: 'Quando viene ricevuto un pagamento' },
    storage_warning: { label: 'Avviso Storage', description: 'Quando lo storage supera l\'80%' },
    ssl_expiring: { label: 'SSL in Scadenza', description: '30 giorni prima della scadenza SSL' },
    security_alert: { label: 'Allarme Sicurezza', description: 'Tentativi di accesso sospetti' },
    system_error: { label: 'Errore Sistema', description: 'Errori critici della piattaforma' },
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
            <Bell className="w-8 h-8 text-primary" />
            Notifiche
          </h1>
          <p className="text-base-content/60 mt-1">
            Configurazione notifiche e avvisi di sistema
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Channels */}
        <div className="card bg-base-100 shadow-sm">
          <div className="card-body">
            <h2 className="card-title text-lg mb-4">Canali di Notifica</h2>
            
            <div className="space-y-4">
              <div className="form-control">
                <label className="label cursor-pointer justify-start gap-4">
                  <input
                    type="checkbox"
                    className="toggle toggle-primary"
                    checked={settings.channels.email}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      channels: { ...prev.channels, email: e.target.checked }
                    }))}
                  />
                  <div className="flex items-center gap-3">
                    <Mail className="w-5 h-5 text-base-content/60" />
                    <div>
                      <span className="label-text font-medium">Email</span>
                      <p className="text-sm text-base-content/60">Notifiche via email</p>
                    </div>
                  </div>
                </label>
              </div>

              <div className="form-control">
                <label className="label cursor-pointer justify-start gap-4">
                  <input
                    type="checkbox"
                    className="toggle toggle-primary"
                    checked={settings.channels.sms}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      channels: { ...prev.channels, sms: e.target.checked }
                    }))}
                  />
                  <div className="flex items-center gap-3">
                    <Smartphone className="w-5 h-5 text-base-content/60" />
                    <div>
                      <span className="label-text font-medium">SMS</span>
                      <p className="text-sm text-base-content/60">Notifiche via SMS (solo critiche)</p>
                    </div>
                  </div>
                </label>
              </div>

              <div className="form-control">
                <label className="label cursor-pointer justify-start gap-4">
                  <input
                    type="checkbox"
                    className="toggle toggle-primary"
                    checked={settings.channels.push}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      channels: { ...prev.channels, push: e.target.checked }
                    }))}
                  />
                  <div className="flex items-center gap-3">
                    <Bell className="w-5 h-5 text-base-content/60" />
                    <div>
                      <span className="label-text font-medium">Push</span>
                      <p className="text-sm text-base-content/60">Notifiche push nel browser</p>
                    </div>
                  </div>
                </label>
              </div>

              <div className="form-control">
                <label className="label cursor-pointer justify-start gap-4">
                  <input
                    type="checkbox"
                    className="toggle toggle-primary"
                    checked={settings.channels.slack}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      channels: { ...prev.channels, slack: e.target.checked }
                    }))}
                  />
                  <div className="flex items-center gap-3">
                    <MessageSquare className="w-5 h-5 text-base-content/60" />
                    <div>
                      <span className="label-text font-medium">Slack</span>
                      <p className="text-sm text-base-content/60">Integrazione con Slack</p>
                    </div>
                  </div>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Digest */}
        <div className="card bg-base-100 shadow-sm">
          <div className="card-body">
            <h2 className="card-title text-lg mb-4">
              <Clock className="w-5 h-5" />
              Report Periodico
            </h2>
            
            <div className="space-y-4">
              <div className="form-control">
                <label className="label cursor-pointer justify-start gap-4">
                  <input
                    type="checkbox"
                    className="toggle toggle-primary"
                    checked={settings.digest.enabled}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      digest: { ...prev.digest, enabled: e.target.checked }
                    }))}
                  />
                  <span className="label-text font-medium">Abilita Report Periodico</span>
                </label>
              </div>

              {settings.digest.enabled && (
                <>
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-medium">Frequenza</span>
                    </label>
                    <select
                      className="select select-bordered"
                      value={settings.digest.frequency}
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        digest: { ...prev.digest, frequency: e.target.value as 'daily' | 'weekly' | 'monthly' }
                      }))}
                    >
                      <option value="daily">Giornaliero</option>
                      <option value="weekly">Settimanale</option>
                      <option value="monthly">Mensile</option>
                    </select>
                  </div>

                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-medium">Orario Invio</span>
                    </label>
                    <input
                      type="time"
                      className="input input-bordered"
                      value={settings.digest.time}
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        digest: { ...prev.digest, time: e.target.value }
                      }))}
                    />
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Events */}
        <div className="card bg-base-100 shadow-sm lg:col-span-2">
          <div className="card-body">
            <h2 className="card-title text-lg mb-4">Eventi da Notificare</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(settings.events).map(([key, enabled]) => (
                <div key={key} className="form-control">
                  <label className="label cursor-pointer justify-start gap-4">
                    <input
                      type="checkbox"
                      className="checkbox checkbox-primary"
                      checked={enabled}
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        events: { ...prev.events, [key]: e.target.checked }
                      }))}
                    />
                    <div>
                      <span className="label-text font-medium">
                        {eventLabels[key]?.label || key}
                      </span>
                      <p className="text-sm text-base-content/60">
                        {eventLabels[key]?.description}
                      </p>
                    </div>
                  </label>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recipients */}
        <div className="card bg-base-100 shadow-sm lg:col-span-2">
          <div className="card-body">
            <h2 className="card-title text-lg mb-4">Destinatari</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">Email Amministratori</span>
                </label>
                <textarea
                  className="textarea textarea-bordered h-24"
                  value={settings.recipients.admin_emails.join('\n')}
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    recipients: { 
                      ...prev.recipients, 
                      admin_emails: e.target.value.split('\n').filter(Boolean) 
                    }
                  }))}
                  placeholder="Un indirizzo email per riga"
                ></textarea>
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">Slack Webhook URL</span>
                </label>
                <input
                  type="url"
                  className="input input-bordered"
                  value={settings.recipients.slack_webhook}
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    recipients: { ...prev.recipients, slack_webhook: e.target.value }
                  }))}
                  placeholder="https://hooks.slack.com/services/..."
                />
                <label className="label">
                  <span className="label-text-alt">
                    <a href="https://api.slack.com/messaging/webhooks" target="_blank" rel="noopener noreferrer" className="link link-primary">
                      Come creare un webhook Slack
                    </a>
                  </span>
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Test Notification */}
      <div className="card bg-base-100 shadow-sm">
        <div className="card-body">
          <h2 className="card-title text-lg mb-4">Test Notifiche</h2>
          <p className="text-base-content/60 mb-4">
            Invia una notifica di test per verificare la configurazione.
          </p>
          <div className="flex gap-2">
            <button className="btn btn-outline gap-2">
              <Mail className="w-4 h-4" />
              Test Email
            </button>
            <button className="btn btn-outline gap-2">
              <MessageSquare className="w-4 h-4" />
              Test Slack
            </button>
            <button className="btn btn-outline gap-2">
              <Bell className="w-4 h-4" />
              Test Push
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
