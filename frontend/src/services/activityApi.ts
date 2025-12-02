/**
 * Activity API Service
 * 
 * API calls for tenant activities monitoring.
 */

import api from './api';
import type { 
  TenantActivity, 
  ActivityStats, 
  TimelineItem 
} from '../types/activity';

// Re-export types for convenience
export type { TenantActivity, ActivityStats, TimelineItem };

// Alias types used in components
export type TenantActivityResponse = TenantActivity;
export type TimelineData = TimelineItem;

interface ApiResponse<T> {
  success: boolean;
  data: T;
}

/**
 * Get all activities with optional filters (paginated)
 */
export async function getActivities(params?: {
  tenant_id?: number;
  type?: string;
  status?: string;
  hours?: number;
  per_page?: number;
  page?: number;
}): Promise<{
  data: TenantActivity[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}> {
  const response = await api.get<ApiResponse<{
    data: TenantActivity[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  }>>('/activities', { params });
  return response.data.data;
}

/**
 * Get recent activities for dashboard
 */
export async function getRecentActivities(limit: number = 20): Promise<TenantActivity[]> {
  const response = await api.get<ApiResponse<TenantActivity[]>>('/activities/recent', { 
    params: { limit } 
  });
  return response.data.data;
}

/**
 * Get activity statistics
 */
export async function getActivityStats(hours: number = 24): Promise<ActivityStats> {
  const response = await api.get<ApiResponse<ActivityStats>>('/activities/stats', { 
    params: { hours } 
  });
  return response.data.data;
}

/**
 * Get activity timeline
 */
export async function getActivityTimeline(params?: {
  hours?: number;
  tenant_id?: number;
}): Promise<TimelineItem[]> {
  const response = await api.get<ApiResponse<TimelineItem[]>>('/activities/timeline', { params });
  return response.data.data;
}

/**
 * Get activities for a specific tenant
 */
export async function getTenantActivities(
  tenantId: number,
  params?: {
    type?: string;
    status?: string;
    limit?: number;
  }
): Promise<{ tenant: any; activities: TenantActivity[] }> {
  const response = await api.get(`/tenants/${tenantId}/activities`, { params });
  return response.data.data;
}

export default {
  getActivities,
  getRecentActivities,
  getActivityStats,
  getActivityTimeline,
  getTenantActivities,
};

// Named export object for component usage
export const activityApi = {
  getAll: (params?: {
    tenant_id?: number | string;
    type?: string;
    status?: string;
    hours?: number;
    per_page?: number;
    page?: number;
  }) => getActivities(params as any),
  
  getStats: (_tenantId?: number) => 
    getActivityStats(24),
  
  getTimeline: (hours?: number) => 
    getActivityTimeline({ hours }),
  
  getRecent: (limit?: number) => 
    getRecentActivities(limit),
};
