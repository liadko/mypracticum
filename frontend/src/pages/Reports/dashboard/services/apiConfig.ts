/**
 * Practicum API Configuration & Auth Token Storage
 */

const TOKEN_KEY = 'token';

export function getJwtToken(): string {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem(TOKEN_KEY);
    if (stored !== null) return stored;
  }
  return (import.meta.env.VITE_JWT_TOKEN as string) || '';
}

export function setJwtToken(token: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(TOKEN_KEY, token.trim());
  }
}

export function getApiBaseUrl(): string {
  return (import.meta.env.VITE_API_BASE_URL as string) || '/api';
}

