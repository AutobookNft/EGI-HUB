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
  ProjectWithHealth
} from '../types/project';

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
};
