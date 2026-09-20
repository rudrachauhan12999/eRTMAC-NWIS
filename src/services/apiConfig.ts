/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// FastAPI backend base URL. VITE_API_BASE_URL is set at build time (see
// vercel.json / the Vercel project's Environment Variables) to the deployed
// Railway backend URL; falls back to localhost for local dev, where the
// backend's CORS_ORIGINS already allows http://localhost:3000/5173 (see
// docs/BACKEND_API_CONTRACT.md).
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export const TOKEN_STORAGE_KEY = 'ertmac_token';

export function getStoredToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function setStoredToken(token: string): void {
  try {
    localStorage.setItem(TOKEN_STORAGE_KEY, token);
  } catch {
    // localStorage unavailable — session simply won't persist across reloads
  }
}

export function clearStoredToken(): void {
  try {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
  } catch {
    // no-op
  }
}

export async function apiFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const token = getStoredToken();
  const headers = new Headers(options.headers);
  headers.set('Content-Type', 'application/json');
  if (token) headers.set('Authorization', `Bearer ${token}`);
  return fetch(`${API_BASE_URL}${path}`, { ...options, headers });
}
