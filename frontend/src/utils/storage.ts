/**
 * Secure Token Storage Utilities
 *
 * All token reads and writes go through localStorage for persistence
 * across tabs and browser restarts. Previous versions used sessionStorage
 * which caused unexpected logouts when opening a new tab.
 */

const STORAGE_KEY_ACCESS = 'access_token';
const STORAGE_KEY_REFRESH = 'refresh_token';

function migrateFromSessionStorage(): void {
  try {
    const accessInSession = sessionStorage.getItem(STORAGE_KEY_ACCESS);
    const refreshInSession = sessionStorage.getItem(STORAGE_KEY_REFRESH);
    if (accessInSession && !localStorage.getItem(STORAGE_KEY_ACCESS)) {
      localStorage.setItem(STORAGE_KEY_ACCESS, accessInSession);
    }
    if (refreshInSession && !localStorage.getItem(STORAGE_KEY_REFRESH)) {
      localStorage.setItem(STORAGE_KEY_REFRESH, refreshInSession);
    }
    sessionStorage.removeItem(STORAGE_KEY_ACCESS);
    sessionStorage.removeItem(STORAGE_KEY_REFRESH);
  } catch {
    // Silently ignore — storage may be unavailable in certain contexts
  }
}

migrateFromSessionStorage();

export const tokenStorage = {
  getAccessToken: (): string | null => {
    try {
      return localStorage.getItem(STORAGE_KEY_ACCESS);
    } catch {
      return null;
    }
  },

  setAccessToken: (token: string): void => {
    try {
      localStorage.setItem(STORAGE_KEY_ACCESS, token);
    } catch {
      // Storage full or unavailable
    }
  },

  getRefreshToken: (): string | null => {
    try {
      return localStorage.getItem(STORAGE_KEY_REFRESH);
    } catch {
      return null;
    }
  },

  setRefreshToken: (token: string): void => {
    try {
      localStorage.setItem(STORAGE_KEY_REFRESH, token);
    } catch {
      // Storage full or unavailable
    }
  },

  clearTokens: (): void => {
    try {
      localStorage.removeItem(STORAGE_KEY_ACCESS);
      localStorage.removeItem(STORAGE_KEY_REFRESH);
      sessionStorage.removeItem(STORAGE_KEY_ACCESS);
      sessionStorage.removeItem(STORAGE_KEY_REFRESH);
    } catch {
      // Ignore
    }
  },

  hasTokens: (): boolean => {
    return !!(tokenStorage.getAccessToken() && tokenStorage.getRefreshToken());
  },
};
