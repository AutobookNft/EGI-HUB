/**
 * Tenant API Service
 * 
 * API calls for managing tenants in EGI-HUB.
 * All calls go through the EGI-HUB backend which handles
 * proxying to individual tenant APIs.
 */

import api from './api';
import type { 
  Tenant, 
  TenantStats, 
  TenantHealthCheck,
  CreateTenantData, 
  UpdateTenantData,
  ApiResponse,
  TenantWithHealth
} from '../types/tenant';

/**
 * Get all tenants
 */
export async function getTenants(params?: {
  status?: string;
  healthy?: boolean;
  search?: string;
}): Promise<Tenant[]> {
  const response = await api.get<ApiResponse<Tenant[]>>('/tenants', { params });
  return response.data.data;
}

/**
 * Get tenant by ID
 */
export async function getTenant(id: number): Promise<Tenant> {
  const response = await api.get<ApiResponse<Tenant>>(`/tenants/${id}`);
  return response.data.data;
}

/**
 * Get tenant statistics
 */
export async function getTenantStats(): Promise<TenantStats> {
  const response = await api.get<ApiResponse<TenantStats>>('/tenants/stats');
  return response.data.data;
}

/**
 * Create a new tenant
 */
export async function createTenant(data: CreateTenantData): Promise<Tenant> {
  const response = await api.post<ApiResponse<Tenant>>('/tenants', data);
  return response.data.data;
}

/**
 * Update a tenant
 */
export async function updateTenant(id: number, data: UpdateTenantData): Promise<Tenant> {
  const response = await api.put<ApiResponse<Tenant>>(`/tenants/${id}`, data);
  return response.data.data;
}

/**
 * Delete a tenant
 */
export async function deleteTenant(id: number): Promise<void> {
  await api.delete(`/tenants/${id}`);
}

/**
 * Check health of a specific tenant
 */
export async function checkTenantHealth(id: number): Promise<TenantWithHealth> {
  const response = await api.get<ApiResponse<TenantWithHealth>>(`/tenants/${id}/health`);
  return response.data.data;
}

/**
 * Check health of all tenants
 */
export async function checkAllTenantsHealth(): Promise<{
  results: Record<string, { tenant: Tenant; health: TenantHealthCheck }>;
  summary: { total: number; healthy: number; unhealthy: number };
  checked_at: string;
}> {
  const response = await api.post('/tenants/health-check-all');
  return response.data.data;
}

/**
 * Proxy request to a tenant
 */
export async function proxyToTenant<T = unknown>(
  tenantSlug: string,
  path: string,
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' = 'GET',
  data?: unknown
): Promise<T> {
  const url = `/proxy/${tenantSlug}/${path}`;
  
  const response = await api.request<ApiResponse<T>>({
    method,
    url,
    data: method !== 'GET' ? data : undefined,
    params: method === 'GET' ? data : undefined,
  });
  
  return response.data.data;
}

/**
 * Get aggregated data from all tenants
 */
export async function getAggregatedData<T = unknown>(endpoint: string): Promise<{
  results: Record<string, { success: boolean; data?: T; error?: string }>;
  errors: Record<string, { success: false; error: string }>;
  summary: { total: number; successful: number; failed: number };
}> {
  const response = await api.get('/proxy/aggregate', { params: { endpoint } });
  return response.data.data;
}

export default {
  getTenants,
  getTenant,
  getTenantStats,
  createTenant,
  updateTenant,
  deleteTenant,
  checkTenantHealth,
  checkAllTenantsHealth,
  proxyToTenant,
  getAggregatedData,
};

// Named export for component usage
export const tenantApi = {
  getAll: () => getTenants().then(data => ({ data })),
  getById: getTenant,
  getStats: getTenantStats,
  create: createTenant,
  update: updateTenant,
  delete: deleteTenant,
  checkHealth: checkTenantHealth,
  checkAllHealth: checkAllTenantsHealth,
};
