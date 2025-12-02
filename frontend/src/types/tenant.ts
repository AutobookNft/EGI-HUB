/**
 * Tenant Types
 * 
 * TypeScript interfaces for the Tenant system.
 */

export type TenantStatus = 'active' | 'inactive' | 'maintenance' | 'error';

export interface Tenant {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  url: string;
  status: TenantStatus;
  is_healthy: boolean;
  last_health_check: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface TenantStats {
  total: number;
  active: number;
  inactive: number;
  maintenance: number;
  error: number;
  healthy: number;
  unhealthy: number;
}

export interface TenantHealthCheck {
  healthy: boolean;
  status_code?: number;
  response_time_ms: number;
  checked_at: string;
  data?: unknown;
  error?: string;
}

export interface CreateTenantData {
  name: string;
  slug: string;
  description?: string;
  url: string;
  api_key?: string;
  api_secret?: string;
  status?: TenantStatus;
  metadata?: Record<string, unknown>;
}

export interface UpdateTenantData extends Partial<CreateTenantData> {}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface TenantWithHealth {
  tenant: Tenant;
  health: TenantHealthCheck;
}
