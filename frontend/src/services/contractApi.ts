/**
 * Contract API Service — EGI-HUB
 * CRUD contratti + lifecycle actions (activate, terminate, renew)
 */

import api from './api';
import type { Contract, CreateContractData, RenewContractData } from '../types/contract';

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export async function getContractsByTenant(tenantId: number): Promise<{
  data: Contract[];
  tenant: { id: number; name: string };
}> {
  const res = await api.get<{ success: boolean; data: Contract[]; tenant: { id: number; name: string } }>(
    `/tenants/${tenantId}/contracts`
  );
  return { data: res.data.data, tenant: res.data.tenant };
}

export async function getContract(id: number): Promise<Contract> {
  const res = await api.get<ApiResponse<Contract>>(`/contracts/${id}`);
  return res.data.data;
}

export async function createContract(tenantId: number, data: CreateContractData): Promise<Contract> {
  const res = await api.post<ApiResponse<Contract>>(`/tenants/${tenantId}/contracts`, data);
  return res.data.data;
}

export async function updateContract(id: number, data: Partial<CreateContractData>): Promise<Contract> {
  const res = await api.put<ApiResponse<Contract>>(`/contracts/${id}`, data);
  return res.data.data;
}

export async function activateContract(id: number): Promise<Contract> {
  const res = await api.post<ApiResponse<Contract>>(`/contracts/${id}/activate`);
  return res.data.data;
}

export async function terminateContract(id: number): Promise<Contract> {
  const res = await api.post<ApiResponse<Contract>>(`/contracts/${id}/terminate`);
  return res.data.data;
}

export async function renewContract(id: number, data?: RenewContractData): Promise<Contract> {
  const res = await api.post<ApiResponse<Contract>>(`/contracts/${id}/renew`, data ?? {});
  return res.data.data;
}

export async function deleteContract(id: number): Promise<void> {
  await api.delete(`/contracts/${id}`);
}

export const contractApi = {
  list:       getContractsByTenant,
  get:        getContract,
  create:     createContract,
  update:     updateContract,
  activate:   activateContract,
  terminate:  terminateContract,
  renew:      renewContract,
  delete:     deleteContract,
};
