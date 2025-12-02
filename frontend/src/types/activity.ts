/**
 * Tenant Activity Types
 */

export type ActivityStatus = 'success' | 'warning' | 'error' | 'info';
export type ActivityType = 'health_check' | 'api_call' | 'proxy' | 'sync' | 'config' | 'error' | 'auth';

export interface TenantActivity {
  id: number;
  tenant_id: number;
  tenant: {
    id: number;
    name: string;
    slug: string;
  };
  type: string;
  action: string;
  description: string | null;
  status: ActivityStatus;
  endpoint: string | null;
  method: string | null;
  response_code: number | null;
  response_time_ms: number | null;
  metadata: Record<string, any> | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
  updated_at: string;
}

export interface ActivityStats {
  period_hours: number;
  total: number;
  by_status: {
    success: number;
    warning: number;
    error: number;
    info: number;
  };
  by_type: Record<string, number>;
  by_tenant: Array<{
    name: string;
    slug: string;
    count: number;
  }>;
  avg_response_time_ms: number;
  errors_rate: number;
}

export interface TimelineItem {
  hour: string;
  success: number;
  warning: number;
  error: number;
  info: number;
  total: number;
}
