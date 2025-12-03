/**
 * Project Types
 * 
 * TypeScript interfaces for the Project system.
 * 
 * NOTE: In EGI-HUB, "Projects" are SaaS applications (NATAN_LOC, EGI, etc.)
 * while "Tenants" are the end customers of each project.
 */

export type ProjectStatus = 'active' | 'inactive' | 'maintenance' | 'error';

export interface Project {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  url: string;
  production_url: string | null;
  staging_url: string | null;
  status: ProjectStatus;
  is_healthy: boolean;
  last_health_check: string | null;
  metadata: Record<string, unknown> | null;
  local_start_script: string | null;
  local_stop_script: string | null;
  supervisor_program: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface ProjectStats {
  total: number;
  active: number;
  inactive: number;
  maintenance: number;
  error: number;
  healthy: number;
  unhealthy: number;
}

export interface ProjectHealthCheck {
  healthy: boolean;
  status_code?: number;
  response_time_ms: number;
  checked_at: string;
  data?: unknown;
  error?: string;
}

export interface CreateProjectData {
  name: string;
  slug: string;
  description?: string;
  url: string;
  production_url?: string;
  staging_url?: string;
  api_key?: string;
  api_secret?: string;
  status?: ProjectStatus;
  metadata?: Record<string, unknown>;
  local_start_script?: string;
  local_stop_script?: string;
  supervisor_program?: string;
}

export interface UpdateProjectData extends Partial<CreateProjectData> {}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface ProjectWithHealth {
  project: Project;
  health: ProjectHealthCheck;
}
