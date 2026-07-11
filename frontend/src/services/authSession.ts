/**
 * Centralized JWT session refresh (single in-flight request) and session-expired signaling.
 * Avoids full page reloads and duplicate refresh calls under concurrent 401s.
 */
import axios from 'axios';
import { tokenStorage } from '../utils/storage';

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const AUTH_NO_REFRESH_PATHS = [
  '/auth/login/',
  '/auth/register/',
  '/auth/token/refresh/',
  '/auth/password-reset/',
];

export function isAuthNoRefreshUrl(url: string | undefined): boolean {
  if (!url) return false;
  return AUTH_NO_REFRESH_PATHS.some((p) => url.includes(p));
}

let refreshInFlight: Promise<string | null> | null = null;

type SessionExpiredHandler = () => void;
let onSessionExpired: SessionExpiredHandler | null = null;

export function registerSessionExpiredHandler(handler: SessionExpiredHandler | null): void {
  onSessionExpired = handler;
}

export function notifySessionExpired(): void {
  tokenStorage.clearTokens();
  onSessionExpired?.();
}

/**
 * Refresh access token using the stored refresh token (deduplicated).
 * Returns new access token or null if session is invalid.
 */
export async function refreshAccessToken(): Promise<string | null> {
  if (refreshInFlight) {
    return refreshInFlight;
  }

  const refresh = tokenStorage.getRefreshToken();
  if (!refresh) {
    return null;
  }

  refreshInFlight = (async () => {
    try {
      const response = await axios.post(
        `${BASE_URL}/api/auth/token/refresh/`,
        { refresh },
        { headers: { 'Content-Type': 'application/json' } }
      );
      const { access, refresh: newRefresh } = response.data;
      if (!access) {
        return null;
      }
      tokenStorage.setAccessToken(access);
      if (newRefresh) {
        tokenStorage.setRefreshToken(newRefresh);
      }
      return access as string;
    } catch {
      return null;
    } finally {
      refreshInFlight = null;
    }
  })();

  return refreshInFlight;
}
