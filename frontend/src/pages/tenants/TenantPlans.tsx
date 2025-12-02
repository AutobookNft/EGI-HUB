import { useState, useEffect } from 'react';
import { FileText, Plus, Edit2, Trash2, Check, X, Users, Database, Brain, Globe } from 'lucide-react';
import api from '@/services/api';

interface Plan {
  id: string;
  name: string;
  slug: string;
  price_monthly: number;
  price_yearly: number;
  features: {
    users_limit: number;
    storage_gb: number;
    ai_credits: number;
    api_access: boolean;
    custom_domain: boolean;
    marketplace: boolean;
    priority_support: boolean;
  };
  is_active: boolean;
  sort_order: number;
}

export default function TenantPlans() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      const response = await api.get('/superadmin/tenants/plans');
      setPlans(response.data.plans || []);
    } catch (error) {
      console.error('Error fetching plans:', error);
      // Demo data
      setPlans([
        {
          id: '1',
          name: 'Starter',
          slug: 'starter',
          price_monthly: 29,
          price_yearly: 290,
          features: {
            users_limit: 5,
            storage_gb: 2,
            ai_credits: 50,
            api_access: false,
            custom_domain: false,
            marketplace: false,
            priority_support: false,
          },
          is_active: true,
          sort_order: 1,
        },
        {
          id: '2',
          name: 'Professional',
          slug: 'professional',
          price_monthly: 79,
          price_yearly: 790,
          features: {
            users_limit: 25,
            storage_gb: 10,
            ai_credits: 200,
            api_access: true,
            custom_domain: false,
            marketplace: true,
            priority_support: false,
          },
          is_active: true,
          sort_order: 2,
        },
        {
          id: '3',
          name: 'Enterprise',
          slug: 'enterprise',
          price_monthly: 199,
          price_yearly: 1990,
          features: {
            users_limit: 100,
            storage_gb: 50,
            ai_credits: 1000,
            api_access: true,
            custom_domain: true,
            marketplace: true,
            priority_support: true,
          },
          is_active: true,
          sort_order: 3,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (plan: Plan) => {
    try {
      await api.patch(`/superadmin/tenants/plans/${plan.id}`, { is_active: !plan.is_active });
      setPlans(prev => prev.map(p => p.id === plan.id ? { ...p, is_active: !p.is_active } : p));
    } catch (error) {
      setPlans(prev => prev.map(p => p.id === plan.id ? { ...p, is_active: !p.is_active } : p));
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
            <FileText className="w-8 h-8 text-primary" />
            Piani & Limiti
          </h1>
          <p className="text-base-content/60 mt-1">
            Gestisci i piani di abbonamento e i loro limiti
          </p>
        </div>
        <button className="btn btn-primary gap-2">
          <Plus className="w-5 h-5" />
          Nuovo Piano
        </button>
      </div>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {plans.map((plan) => (
          <div 
            key={plan.id} 
            className={`card bg-base-100 shadow-sm border-2 ${
              plan.is_active ? 'border-primary/20' : 'border-base-200 opacity-60'
            }`}
          >
            <div className="card-body">
              {/* Header */}
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="card-title">{plan.name}</h3>
                  <p className="text-sm text-base-content/60">/{plan.slug}</p>
                </div>
                <div className="flex gap-1">
                  <button 
                    className="btn btn-ghost btn-sm btn-square"
                    onClick={() => setEditingPlan(plan)}
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button className="btn btn-ghost btn-sm btn-square text-error">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Pricing */}
              <div className="my-4">
                <div className="text-3xl font-bold text-primary">
                  €{plan.price_monthly}
                  <span className="text-sm font-normal text-base-content/60">/mese</span>
                </div>
                <div className="text-sm text-base-content/60">
                  €{plan.price_yearly}/anno (risparmia {Math.round((1 - plan.price_yearly / (plan.price_monthly * 12)) * 100)}%)
                </div>
              </div>

              {/* Features */}
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Users className="w-4 h-4 text-base-content/40" />
                  <span>{plan.features.users_limit} utenti</span>
                </div>
                <div className="flex items-center gap-3">
                  <Database className="w-4 h-4 text-base-content/40" />
                  <span>{plan.features.storage_gb} GB storage</span>
                </div>
                <div className="flex items-center gap-3">
                  <Brain className="w-4 h-4 text-base-content/40" />
                  <span>{plan.features.ai_credits} crediti AI/mese</span>
                </div>

                <div className="divider my-2"></div>

                <div className="flex items-center gap-3">
                  {plan.features.api_access ? (
                    <Check className="w-4 h-4 text-success" />
                  ) : (
                    <X className="w-4 h-4 text-base-content/20" />
                  )}
                  <span className={!plan.features.api_access ? 'text-base-content/40' : ''}>
                    Accesso API
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  {plan.features.custom_domain ? (
                    <Check className="w-4 h-4 text-success" />
                  ) : (
                    <X className="w-4 h-4 text-base-content/20" />
                  )}
                  <span className={!plan.features.custom_domain ? 'text-base-content/40' : ''}>
                    Dominio Custom
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  {plan.features.marketplace ? (
                    <Check className="w-4 h-4 text-success" />
                  ) : (
                    <X className="w-4 h-4 text-base-content/20" />
                  )}
                  <span className={!plan.features.marketplace ? 'text-base-content/40' : ''}>
                    Marketplace
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  {plan.features.priority_support ? (
                    <Check className="w-4 h-4 text-success" />
                  ) : (
                    <X className="w-4 h-4 text-base-content/20" />
                  )}
                  <span className={!plan.features.priority_support ? 'text-base-content/40' : ''}>
                    Supporto Prioritario
                  </span>
                </div>
              </div>

              {/* Footer */}
              <div className="card-actions mt-4 pt-4 border-t border-base-200">
                <label className="label cursor-pointer gap-3">
                  <span className="label-text">Piano attivo</span>
                  <input
                    type="checkbox"
                    className="toggle toggle-primary"
                    checked={plan.is_active}
                    onChange={() => handleToggleActive(plan)}
                  />
                </label>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Usage Stats */}
      <div className="card bg-base-100 shadow-sm">
        <div className="card-body">
          <h2 className="card-title text-lg mb-4">Distribuzione Tenant per Piano</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {plans.map((plan) => (
              <div key={plan.id} className="stat bg-base-200 rounded-lg">
                <div className="stat-title">{plan.name}</div>
                <div className="stat-value text-primary">
                  {plan.slug === 'starter' ? 12 : plan.slug === 'professional' ? 8 : 3}
                </div>
                <div className="stat-desc">tenant attivi</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
