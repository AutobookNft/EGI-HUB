/**
 * Project API Service
 * 
 * API calls for managing projects (SaaS applications) in EGI-HUB.
 * 
 * NOTE: In EGI-HUB, "Projects" are SaaS applications (NATAN_LOC, EGI, etc.)
 * while "Tenants" are the end customers of each project.
 */

import api from './api';
import type {
  Project,
  ProjectStats,
  ProjectHealthCheck,
  CreateProjectData,
  UpdateProjectData,
  ApiResponse,
  ProjectWithHealth,
  ProjectAdmin,
  ProjectAdminsMeta,
  CreateProjectAdminData,
  UpdateProjectAdminData,
  MyProject,
  ProjectUser,
  ProjectUsersMeta,
  PendingBootstrap,
} from '../types/project';

export interface ProjectTenant {
  id: number;
  system_project_id: number;
  name: string;
  slug: string;
  description: string | null;
  url: string | null;
  subdomain: string | null;
  status: 'active' | 'inactive' | 'suspended' | 'trial';
  plan: string | null;
  contact_name: string | null;
  contact_email: string | null;
  is_healthy: boolean;
  last_health_check: string | null;
  created_at: string;
}

/**
 * Get all projects
 */
export async function getProjects(params?: {
  status?: string;
  healthy?: boolean;
  search?: string;
}): Promise<Project[]> {
  const response = await api.get<ApiResponse<Project[]>>('/projects', { params });
  return response.data.data;
}

/**
 * Get project by ID
 */
export async function getProject(id: number): Promise<Project> {
  const response = await api.get<ApiResponse<Project>>(`/projects/${id}`);
  return response.data.data;
}

/**
 * Get project statistics
 */
export async function getProjectStats(): Promise<ProjectStats> {
  const response = await api.get<ApiResponse<ProjectStats>>('/projects/stats');
  return response.data.data;
}

/**
 * Create a new project
 */
export async function createProject(data: CreateProjectData): Promise<Project> {
  const response = await api.post<ApiResponse<Project>>('/projects', data);
  return response.data.data;
}

/**
 * Update a project
 */
export async function updateProject(id: number, data: UpdateProjectData): Promise<Project> {
  const response = await api.put<ApiResponse<Project>>(`/projects/${id}`, data);
  return response.data.data;
}

/**
 * Delete a project
 */
export async function deleteProject(id: number): Promise<void> {
  await api.delete(`/projects/${id}`);
}

/**
 * Check health of a specific project
 */
export async function checkProjectHealth(id: number): Promise<ProjectWithHealth> {
  const response = await api.get<ApiResponse<ProjectWithHealth>>(`/projects/${id}/health`);
  return response.data.data;
}

/**
 * Check health of all projects
 */
export async function checkAllProjectsHealth(): Promise<{
  results: Record<string, { project: Project; health: ProjectHealthCheck }>;
  summary: { total: number; healthy: number; unhealthy: number };
  checked_at: string;
}> {
  const response = await api.post('/projects/health-check-all');
  return response.data.data;
}

/**
 * Start a project's services
 */
export async function startProject(id: number): Promise<{
  success: boolean;
  message: string;
  method: 'script' | 'supervisor';
}> {
  const response = await api.post(`/projects/${id}/start`);
  return response.data.data;
}

/**
 * Stop a project's services
 */
export async function stopProject(id: number): Promise<{
  success: boolean;
  message: string;
  method: 'script' | 'supervisor';
}> {
  const response = await api.post(`/projects/${id}/stop`);
  return response.data.data;
}

/**
 * Proxy request to a project
 */
export async function proxyToProject<T = unknown>(
  projectSlug: string,
  path: string,
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' = 'GET',
  data?: unknown
): Promise<T> {
  const url = `/proxy/${projectSlug}/${path}`;

  const response = await api.request<ApiResponse<T>>({
    method,
    url,
    data: method !== 'GET' ? data : undefined,
    params: method === 'GET' ? data : undefined,
  });

  return response.data.data;
}

/**
 * Get aggregated data from all projects
 */
export async function getAggregatedData<T = unknown>(endpoint: string): Promise<{
  results: Record<string, { success: boolean; data?: T; error?: string }>;
  errors: Record<string, { success: false; error: string }>;
  summary: { total: number; successful: number; failed: number };
}> {
  const response = await api.get('/proxy/aggregate', { params: { endpoint } });
  return response.data.data;
}

/**
 * Detect the tech stack of a project (artisan/composer/npm) via SSM.
 * Result is cached in project metadata for 1 hour.
 */
export async function detectProjectStack(id: number): Promise<{
  has_artisan: boolean;
  has_composer: boolean;
  has_npm: boolean;
}> {
  const response = await api.post<{ success: boolean; data: { has_artisan: boolean; has_composer: boolean; has_npm: boolean } }>(
    `/projects/${id}/detect-stack`
  );
  return response.data.data;
}

/**
 * Run a remote command on the project's EC2 instance via AWS SSM
 */
export async function runRemoteCommand(
  id: number,
  payload: { command_key?: string; custom_command?: string }
): Promise<{ success: boolean; output: string; status?: string }> {
  const response = await api.post(`/projects/${id}/remote-command`, payload);
  return response.data;
}

/**
 * Discover projects from Route 53 and upsert in the DB
 */
export async function discoverProjects(options?: {
  dry_run?: boolean;
  no_health?: boolean;
}): Promise<{
  success: boolean;
  message: string;
  output: string;
  projects_count: number;
}> {
  const response = await api.post('/projects/discover', options ?? {});
  return response.data;
}

// ── Maintenance API ───────────────────────────────────────────────────────────

export interface MaintenanceResult {
  success: boolean;
  output: string;
  status?: string;
  dry_run: boolean;
}

/**
 * Esegue un dry-run della EGI Asset Purge sul progetto remoto.
 * Non modifica nulla — mostra solo cosa verrebbe eliminato.
 */
export async function egiPurgeDryRun(id: number): Promise<MaintenanceResult> {
  const response = await api.post(`/projects/${id}/maintenance/egi-purge/dry-run`);
  return response.data;
}

/**
 * Esegue la EGI Asset Purge reale sul progetto remoto.
 * Richiede confirmToken === "PURGE ALL EGI".
 */
export async function egiPurgeExecute(
  id: number,
  confirmToken: string
): Promise<MaintenanceResult> {
  const response = await api.post(`/projects/${id}/maintenance/egi-purge/execute`, {
    confirm_token: confirmToken,
  });
  return response.data;
}

export default {
  getProjects,
  getProject,
  getProjectStats,
  createProject,
  updateProject,
  deleteProject,
  checkProjectHealth,
  checkAllProjectsHealth,
  startProject,
  stopProject,
  proxyToProject,
  getAggregatedData,
  discoverProjects,
  runRemoteCommand,
  egiPurgeDryRun,
  egiPurgeExecute,
};

// Named export for component usage
export const projectApi = {
  getAll: () => getProjects().then(data => ({ data })),
  getById: getProject,
  getStats: getProjectStats,
  create: createProject,
  update: updateProject,
  delete: deleteProject,
  checkHealth: checkProjectHealth,
  checkAllHealth: checkAllProjectsHealth,
  start: startProject,
  stop: stopProject,
  discover: discoverProjects,
};

// ==========================================
// Project Admin API Functions
// ==========================================

/**
 * Get my accessible projects
 */
export async function getMyProjects(): Promise<{ data: MyProject[]; is_super_admin: boolean }> {
  const response = await api.get<ApiResponse<MyProject[]> & { is_super_admin: boolean }>('/my-projects');
  return {
    data: response.data.data,
    is_super_admin: response.data.is_super_admin,
  };
}

/**
 * Get users of a project (from shared users table, filtered by system_project_id)
 * Also returns pending_invites (TenantAdminBootstrap records with status pending/invited)
 */
export async function getProjectUsers(slug: string): Promise<{
  data: ProjectUser[];
  pending_invites: PendingBootstrap[];
  meta: ProjectUsersMeta;
}> {
  const response = await api.get<ApiResponse<ProjectUser[]> & {
    meta: ProjectUsersMeta;
    pending_invites: PendingBootstrap[];
  }>(`/projects/${slug}/admins`);
  return {
    data: response.data.data,
    pending_invites: response.data.pending_invites ?? [],
    meta: response.data.meta,
  };
}

/**
 * Reinvia l'email di invito a un bootstrap pendente
 */
export async function resendBootstrapInvite(bootstrapId: number): Promise<{ success: boolean; message: string }> {
  const response = await api.post<{ success: boolean; message: string }>(
    `/admin/bootstraps/${bootstrapId}/resend`
  );
  return response.data;
}

/**
 * Get all admins for a project (legacy — project_admins table)
 * @deprecated Use getProjectUsers instead
 */
export async function getProjectAdmins(slug: string): Promise<{
  data: ProjectAdmin[];
  meta: ProjectAdminsMeta;
}> {
  const response = await api.get<ApiResponse<ProjectAdmin[]> & { meta: ProjectAdminsMeta }>(
    `/projects/${slug}/admins`
  );
  return {
    data: response.data.data,
    meta: response.data.meta,
  };
}

/**
 * Get a specific project admin
 */
export async function getProjectAdmin(slug: string, adminId: number): Promise<ProjectAdmin> {
  const response = await api.get<ApiResponse<ProjectAdmin>>(
    `/projects/${slug}/admins/${adminId}`
  );
  return response.data.data;
}

/**
 * Assign a new admin to a project
 */
export async function createProjectAdmin(
  slug: string,
  data: CreateProjectAdminData
): Promise<ProjectAdmin> {
  const response = await api.post<ApiResponse<ProjectAdmin>>(
    `/projects/${slug}/admins`,
    data
  );
  return response.data.data;
}

/**
 * Update a project admin
 */
export async function updateProjectAdmin(
  slug: string,
  adminId: number,
  data: UpdateProjectAdminData
): Promise<ProjectAdmin> {
  const response = await api.put<ApiResponse<ProjectAdmin>>(
    `/projects/${slug}/admins/${adminId}`,
    data
  );
  return response.data.data;
}

/**
 * Remove an admin from a project
 */
export async function deleteProjectAdmin(slug: string, adminId: number): Promise<void> {
  await api.delete(`/projects/${slug}/admins/${adminId}`);
}

/**
 * Suspend a project admin
 */
export async function suspendProjectAdmin(
  slug: string,
  adminId: number,
  reason?: string
): Promise<{ success: boolean; message: string }> {
  const response = await api.post<ApiResponse<null>>(
    `/projects/${slug}/admins/${adminId}/suspend`,
    { reason }
  );
  return { success: response.data.success, message: response.data.message || 'Sospeso' };
}

/**
 * Reactivate a suspended project admin
 */
export async function reactivateProjectAdmin(
  slug: string,
  adminId: number
): Promise<{ success: boolean; message: string }> {
  const response = await api.post<ApiResponse<null>>(
    `/projects/${slug}/admins/${adminId}/reactivate`
  );
  return { success: response.data.success, message: response.data.message || 'Riattivato' };
}

/**
 * Get tenants for a specific project (by slug)
 */
export async function getProjectTenants(slug: string): Promise<ProjectTenant[]> {
  const response = await api.get<{ success: boolean; data: ProjectTenant[]; project: { id: number; name: string; slug: string } }>(
    `/projects/${slug}/tenants`
  );
  return response.data.data;
}

// Export all admin functions together
export const projectAdminApi = {
  getMyProjects,
  getAdmins: getProjectAdmins,
  getAdmin: getProjectAdmin,
  create: createProjectAdmin,
  update: updateProjectAdmin,
  delete: deleteProjectAdmin,
  suspend: suspendProjectAdmin,
  reactivate: reactivateProjectAdmin,
};
