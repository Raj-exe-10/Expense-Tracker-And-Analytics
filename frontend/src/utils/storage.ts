/**
 * Secure Token Storage Utilities
 * Provides secure storage for authentication tokens
 */

/**
 * Token storage using sessionStorage (more secure than localStorage)
 * sessionStorage is cleared when the browser tab is closed
 */
export const tokenStorage = {
  /**
   * Get access token from storage
   */
  getAccessToken: (): string | null => {
    try {
      return sessionStorage.getItem('access_token');
    } catch (error) {
      console.error('Error reading access token:', error);
      return null;
    }
  },
  
  /**
   * Set access token in storage
   */
  setAccessToken: (token: string): void => {
    try {
      sessionStorage.setItem('access_token', token);
    } catch (error) {
      console.error('Error storing access token:', error);
    }
  },
  
  /**
   * Get refresh token from storage
   */
  getRefreshToken: (): string | null => {
    try {
      return sessionStorage.getItem('refresh_token');
    } catch (error) {
      console.error('Error reading refresh token:', error);
      return null;
    }
  },
  
  /**
   * Set refresh token in storage
   */
  setRefreshToken: (token: string): void => {
    try {
      sessionStorage.setItem('refresh_token', token);
    } catch (error) {
      console.error('Error storing refresh token:', error);
    }
  },
  
  /**
   * Clear all tokens from storage
   */
  clearTokens: (): void => {
    try {
      sessionStorage.removeItem('access_token');
      sessionStorage.removeItem('refresh_token');
      // Also clear localStorage for backward compatibility
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
    } catch (error) {
      console.error('Error clearing tokens:', error);
    }
  },
  
  /**
   * Check if user has valid tokens
   */
  hasTokens: (): boolean => {
    return !!(tokenStorage.getAccessToken() && tokenStorage.getRefreshToken());
  }
};
