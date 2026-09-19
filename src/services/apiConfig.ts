/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// FastAPI backend base URL. Hardcoded for local dev (CORS on the backend
// already allows http://localhost:3000/5173) — becomes an env-driven value
// when deployment targets are wired up (see docs/BACKEND_API_CONTRACT.md).
export const API_BASE_URL = 'http://localhost:8000';

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
