/**
 * Auth API Service
 * 
 * API calls for authentication in EGI-HUB.
 */

import api from './api';

export interface User {
  id: number;
  name: string;
  email: string;
  is_super_admin: boolean;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data: {
    user: User;
    token: string;
  };
}

/**
 * Login user
 */
export async function login(email: string, password: string): Promise<AuthResponse> {
  const response = await api.post<AuthResponse>('/auth/login', { email, password });
  return response.data;
}

/**
 * Register new user
 */
export async function register(
  name: string,
  email: string,
  password: string,
  password_confirmation: string
): Promise<AuthResponse> {
  const response = await api.post<AuthResponse>('/auth/register', {
    name,
    email,
    password,
    password_confirmation,
  });
  return response.data;
}

/**
 * Logout user
 */
export async function logout(): Promise<void> {
  await api.post('/auth/logout');
}

/**
 * Get current user
 */
export async function getMe(): Promise<User> {
  const response = await api.get<{ success: boolean; data: User }>('/auth/me');
  return response.data.data;
}

/**
 * Update user profile
 */
export async function updateProfile(data: {
  name?: string;
  email?: string;
  current_password?: string;
  new_password?: string;
  new_password_confirmation?: string;
}): Promise<User> {
  const response = await api.put<{ success: boolean; data: User }>('/auth/profile', data);
  return response.data.data;
}

export const authApi = {
  login,
  register,
  logout,
  getMe,
  updateProfile,
};

export default authApi;
