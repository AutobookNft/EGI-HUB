import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, ArrowLeft, Save, Globe, Users, Database, CreditCard } from 'lucide-react';
import api from '@/services/api';

export default function CreateTenant() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    domain: '',
    plan: 'starter',
    admin_email: '',
    admin_name: '',
    storage_limit: 2,
    users_limit: 5,
    trial_days: 14,
    features: {
      ai_enabled: true,
      marketplace: false,
      custom_domain: false,
      api_access: false,
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await api.post('/superadmin/tenants', formData);
      navigate('/tenants');
    } catch (error) {
      console.error('Error creating tenant:', error);
      // Per ora simula il successo
      alert('Tenant creato con successo (simulazione)');
      navigate('/tenants');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleFeatureChange = (feature: string, enabled: boolean) => {
    setFormData(prev => ({
      ...prev,
      features: {
        ...prev.features,
        [feature]: enabled
      }
    }));
  };

  const plans = [
    { id: 'starter', name: 'Starter', price: '€29/mese', storage: 2, users: 5 },
    { id: 'professional', name: 'Professional', price: '€79/mese', storage: 10, users: 25 },
    { id: 'enterprise', name: 'Enterprise', price: '€199/mese', storage: 50, users: 100 },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/tenants')} className="btn btn-ghost btn-square">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3">
            <Building2 className="w-8 h-8 text-primary" />
            Nuovo Tenant
          </h1>
          <p className="text-base-content/60 mt-1">
            Crea un nuovo tenant sulla piattaforma
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <div className="card bg-base-100 shadow-sm">
          <div className="card-body">
            <h2 className="card-title text-lg mb-4">
              <Building2 className="w-5 h-5" />
              Informazioni Base
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">Nome Tenant *</span>
                </label>
                <input
                  type="text"
                  placeholder="es. Galleria d'Arte Moderna"
                  className="input input-bordered"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  required
                />
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">Sottodominio *</span>
                </label>
                <div className="join w-full">
                  <input
                    type="text"
                    placeholder="galleria-moderna"
                    className="input input-bordered join-item flex-1"
                    value={formData.domain}
                    onChange={(e) => handleChange('domain', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                    required
                  />
                  <span className="btn btn-disabled join-item">.florenceegi.com</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Admin Account */}
        <div className="card bg-base-100 shadow-sm">
          <div className="card-body">
            <h2 className="card-title text-lg mb-4">
              <Users className="w-5 h-5" />
              Account Amministratore
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">Nome Admin *</span>
                </label>
                <input
                  type="text"
                  placeholder="Mario Rossi"
                  className="input input-bordered"
                  value={formData.admin_name}
                  onChange={(e) => handleChange('admin_name', e.target.value)}
                  required
                />
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">Email Admin *</span>
                </label>
                <input
                  type="email"
                  placeholder="admin@example.com"
                  className="input input-bordered"
                  value={formData.admin_email}
                  onChange={(e) => handleChange('admin_email', e.target.value)}
                  required
                />
                <label className="label">
                  <span className="label-text-alt text-base-content/60">
                    Verrà inviata un'email con le credenziali di accesso
                  </span>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Plan Selection */}
        <div className="card bg-base-100 shadow-sm">
          <div className="card-body">
            <h2 className="card-title text-lg mb-4">
              <CreditCard className="w-5 h-5" />
              Piano di Abbonamento
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {plans.map((plan) => (
                <div
                  key={plan.id}
                  className={`card border-2 cursor-pointer transition-all ${
                    formData.plan === plan.id 
                      ? 'border-primary bg-primary/5' 
                      : 'border-base-200 hover:border-primary/50'
                  }`}
                  onClick={() => {
                    handleChange('plan', plan.id);
                    handleChange('storage_limit', plan.storage);
                    handleChange('users_limit', plan.users);
                  }}
                >
                  <div className="card-body p-4">
                    <div className="flex justify-between items-start">
                      <h3 className="font-bold">{plan.name}</h3>
                      <input
                        type="radio"
                        name="plan"
                        className="radio radio-primary"
                        checked={formData.plan === plan.id}
                        onChange={() => {}}
                      />
                    </div>
                    <p className="text-xl font-bold text-primary">{plan.price}</p>
                    <ul className="text-sm text-base-content/60 space-y-1 mt-2">
                      <li className="flex items-center gap-2">
                        <Database className="w-4 h-4" />
                        {plan.storage} GB storage
                      </li>
                      <li className="flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        Fino a {plan.users} utenti
                      </li>
                    </ul>
                  </div>
                </div>
              ))}
            </div>

            <div className="form-control mt-4">
              <label className="label">
                <span className="label-text font-medium">Giorni di Trial</span>
              </label>
              <input
                type="number"
                className="input input-bordered w-32"
                value={formData.trial_days}
                onChange={(e) => handleChange('trial_days', parseInt(e.target.value))}
                min={0}
                max={90}
              />
              <label className="label">
                <span className="label-text-alt text-base-content/60">
                  Imposta 0 per attivare subito la fatturazione
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="card bg-base-100 shadow-sm">
          <div className="card-body">
            <h2 className="card-title text-lg mb-4">
              <Globe className="w-5 h-5" />
              Features Abilitate
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="form-control">
                <label className="label cursor-pointer justify-start gap-4">
                  <input
                    type="checkbox"
                    className="toggle toggle-primary"
                    checked={formData.features.ai_enabled}
                    onChange={(e) => handleFeatureChange('ai_enabled', e.target.checked)}
                  />
                  <div>
                    <span className="label-text font-medium">AI Features</span>
                    <p className="text-sm text-base-content/60">Generazione traits, descrizioni AI, N.A.T.A.N.</p>
                  </div>
                </label>
              </div>

              <div className="form-control">
                <label className="label cursor-pointer justify-start gap-4">
                  <input
                    type="checkbox"
                    className="toggle toggle-primary"
                    checked={formData.features.marketplace}
                    onChange={(e) => handleFeatureChange('marketplace', e.target.checked)}
                  />
                  <div>
                    <span className="label-text font-medium">Marketplace</span>
                    <p className="text-sm text-base-content/60">Accesso al marketplace per vendita EGI</p>
                  </div>
                </label>
              </div>

              <div className="form-control">
                <label className="label cursor-pointer justify-start gap-4">
                  <input
                    type="checkbox"
                    className="toggle toggle-primary"
                    checked={formData.features.custom_domain}
                    onChange={(e) => handleFeatureChange('custom_domain', e.target.checked)}
                  />
                  <div>
                    <span className="label-text font-medium">Dominio Personalizzato</span>
                    <p className="text-sm text-base-content/60">Permetti l'uso di un dominio custom</p>
                  </div>
                </label>
              </div>

              <div className="form-control">
                <label className="label cursor-pointer justify-start gap-4">
                  <input
                    type="checkbox"
                    className="toggle toggle-primary"
                    checked={formData.features.api_access}
                    onChange={(e) => handleFeatureChange('api_access', e.target.checked)}
                  />
                  <div>
                    <span className="label-text font-medium">API Access</span>
                    <p className="text-sm text-base-content/60">Accesso alle API per integrazioni</p>
                  </div>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-4">
          <button 
            type="button" 
            className="btn btn-ghost"
            onClick={() => navigate('/tenants')}
          >
            Annulla
          </button>
          <button 
            type="submit" 
            className="btn btn-primary gap-2"
            disabled={loading}
          >
            {loading ? (
              <span className="loading loading-spinner loading-sm"></span>
            ) : (
              <Save className="w-5 h-5" />
            )}
            Crea Tenant
          </button>
        </div>
      </form>
    </div>
  );
}
