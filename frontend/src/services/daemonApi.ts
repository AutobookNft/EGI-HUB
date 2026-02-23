import api from './api'
import type { DaemonProcess, DaemonStats, CreateDaemonData, UpdateDaemonData, DaemonLogData } from '../types/daemon'

interface ApiResponse<T> {
  success: boolean
  data: T
  stats?: DaemonStats
  message?: string
}

export async function getDaemons(): Promise<{ daemons: DaemonProcess[]; stats: DaemonStats }> {
  const response = await api.get<ApiResponse<DaemonProcess[]>>('/superadmin/daemons')
  return {
    daemons: response.data.data,
    stats: response.data.stats!,
  }
}

export async function getDaemon(id: number): Promise<DaemonProcess> {
  const response = await api.get<ApiResponse<DaemonProcess>>(`/superadmin/daemons/${id}`)
  return response.data.data
}

export async function getDaemonStats(): Promise<DaemonStats> {
  const response = await api.get<ApiResponse<DaemonStats>>('/superadmin/daemons/stats')
  return response.data.data
}

export async function createDaemon(data: CreateDaemonData): Promise<DaemonProcess> {
  const response = await api.post<ApiResponse<DaemonProcess>>('/superadmin/daemons', data)
  return response.data.data
}

export async function updateDaemon(id: number, data: UpdateDaemonData): Promise<DaemonProcess> {
  const response = await api.put<ApiResponse<DaemonProcess>>(`/superadmin/daemons/${id}`, data)
  return response.data.data
}

export async function deleteDaemon(id: number): Promise<void> {
  await api.delete(`/superadmin/daemons/${id}`)
}

export async function startDaemon(id: number): Promise<{ success: boolean; message: string }> {
  const response = await api.post(`/superadmin/daemons/${id}/start`)
  return response.data
}

export async function stopDaemon(id: number): Promise<{ success: boolean; message: string }> {
  const response = await api.post(`/superadmin/daemons/${id}/stop`)
  return response.data
}

export async function restartDaemon(id: number): Promise<{ success: boolean; message: string }> {
  const response = await api.post(`/superadmin/daemons/${id}/restart`)
  return response.data
}

export async function getDaemonLogs(
  id: number,
  type: 'stdout' | 'stderr' = 'stdout',
  lines: number = 100
): Promise<DaemonLogData> {
  const response = await api.get<ApiResponse<DaemonLogData>>(`/superadmin/daemons/${id}/logs`, {
    params: { type, lines },
  })
  return response.data.data
}
