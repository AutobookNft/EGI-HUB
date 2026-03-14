/**
 * Contract Types — EGI-HUB
 * Contratti tra FlorenceEGI e i tenant dei progetti SaaS.
 */

export type ContractStatus = 'draft' | 'active' | 'expired' | 'terminated' | 'renewed';
export type ContractType   = 'saas' | 'pilot' | 'trial' | 'custom';
export type BillingPeriod  = 'monthly' | 'annual' | 'one_time' | 'custom';

export const CONTRACT_STATUS_LABELS: Record<ContractStatus, string> = {
  draft:      'Bozza',
  active:     'Attivo',
  expired:    'Scaduto',
  terminated: 'Terminato',
  renewed:    'Rinnovato',
};

export const CONTRACT_STATUS_COLORS: Record<ContractStatus, string> = {
  draft:      'badge-ghost',
  active:     'badge-success',
  expired:    'badge-warning',
  terminated: 'badge-error',
  renewed:    'badge-info',
};

export const CONTRACT_TYPE_LABELS: Record<ContractType, string> = {
  saas:   'SaaS',
  pilot:  'Pilota',
  trial:  'Trial',
  custom: 'Personalizzato',
};

export const BILLING_PERIOD_LABELS: Record<BillingPeriod, string> = {
  monthly:  'Mensile',
  annual:   'Annuale',
  one_time: 'Una tantum',
  custom:   'Personalizzata',
};

export interface ContractRef {
  id: number;
  contract_number: string;
  status?: ContractStatus;
}

export interface ContractAdminBootstrap {
  id: number;
  name: string;
  email: string;
  status: string;
}

export interface Contract {
  id: number;
  contract_number: string;
  contract_type: ContractType | null;
  contract_type_label: string | null;
  status: ContractStatus;
  status_label: string;
  status_color: string;

  // Firmatario
  signatory_name: string;
  signatory_email: string;
  signatory_role: string | null;
  signatory_is_admin: boolean;
  signed_at: string | null;

  // Economico
  value: string | null;
  currency: string;
  billing_period: BillingPeriod | null;
  billing_period_label: string | null;

  // Date
  start_date: string;
  end_date: string | null;
  is_perpetual: boolean;
  is_expired: boolean;

  // Lifecycle flags
  can_be_renewed: boolean;
  can_be_activated: boolean;
  parent_contract_id: number | null;

  created_at: string;
  created_by: { id: number; name: string; email: string } | null;

  // Solo in dettaglio (detailed=true)
  tenant?: { id: number; name: string; slug: string };
  project?: { id: number; name: string; slug: string };
  parent_contract?: ContractRef | null;
  renewals?: ContractRef[];
  admin_bootstraps?: ContractAdminBootstrap[];
  document_url?: string | null;
  notes?: string | null;
}

export interface CreateContractData {
  system_project_id: number;
  contract_type: ContractType;
  signatory_name: string;
  signatory_email: string;
  signatory_role?: string;
  signatory_is_admin?: boolean;
  signed_at?: string;
  value?: number;
  currency?: string;
  billing_period?: BillingPeriod;
  start_date: string;
  end_date?: string;
  document_url?: string;
  notes?: string;
}

export interface RenewContractData {
  end_date?: string;
  value?: number;
  billing_period?: BillingPeriod;
  notes?: string;
}
