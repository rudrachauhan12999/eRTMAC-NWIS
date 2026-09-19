/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { UserProfile } from '../types/auth.ts';
import { apiFetch, setStoredToken } from './apiConfig.ts';

export class AuthApiError extends Error {}

interface LoginResponse {
  token: string;
  user: UserProfile;
}

export async function login(email: string, password: string): Promise<UserProfile> {
  const res = await apiFetch('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new AuthApiError(body.detail || 'Invalid email or password');
  }
  const data: LoginResponse = await res.json();
  setStoredToken(data.token);
  return data.user;
}

export async function register(
  name: string,
  email: string,
  password: string,
  role: string,
  department: string
): Promise<UserProfile> {
  const res = await apiFetch('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({ name, email, password, role, department }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new AuthApiError(body.detail || 'Registration failed');
  }
  const data: LoginResponse = await res.json();
  setStoredToken(data.token);
  return data.user;
}
