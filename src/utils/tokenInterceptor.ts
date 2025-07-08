import { storageService } from './storage';

// Token interceptor configuration
export interface TokenInterceptorConfig {
  baseUrl: string;
  onTokenRefresh?: (newToken: string) => void;
  onTokenExpired?: () => void;
  onRefreshFailed?: () => void;
}

// Request configuration
export interface RequestConfig extends RequestInit {
  skipTokenRefresh?: boolean; // Whether to skip token refresh
  retryCount?: number; // Retry count
}

class TokenInterceptor {
  private config: TokenInterceptorConfig;
  private isRefreshing = false;
  private refreshSubscribers: Array<(token: string) => void> = [];

  constructor(config: TokenInterceptorConfig) {
    this.config = config;
  }

  // Intercept requests
  async intercept<T>(url: string, options: RequestConfig = {}): Promise<T> {
    const { skipTokenRefresh = false, retryCount = 0, ...requestOptions } = options;
    
    try {
      // Add token to request headers
      const token = await storageService.getToken();
      if (token) {
        requestOptions.headers = {
          ...requestOptions.headers,
          'Authorization': `Bearer ${token}`,
        };
      }

      // Send request
      const response = await fetch(url, requestOptions);
      const data = await response.json();

      // Check if token is expired
      if (response.status === 401 || this.isTokenExpiredError(data)) {
        if (skipTokenRefresh) {
          throw new Error('Token expired');
        }

        console.log('🔄 Token expired, attempting refresh...');
        
        // Try to refresh token
        const newToken = await this.handleTokenRefresh();
        
        if (newToken && retryCount < 2) {
          // Retry request with new token
          console.log('🔄 Retrying request with new token...');
          return this.intercept(url, {
            ...options,
            retryCount: retryCount + 1,
          });
        } else {
          // Refresh failed or too many retries
          this.config.onRefreshFailed?.();
          throw new Error('Token refresh failed');
        }
      }

      if (!response.ok) {
        throw new Error(data.message || 'Request failed');
      }

      return data;
    } catch (error) {
      console.error('❌ Request failed:', error);
      throw error;
    }
  }

  // Check if it's a token expiration error
  private isTokenExpiredError(data: any): boolean {
    if (!data || typeof data !== 'object') {
      return false;
    }

    const message = data.message || data.error || '';
    const tokenExpiredKeywords = [
      'token',
      'expired',
      'invalid',
      'unauthorized',
      'authentication',
      'auth',
      'login',
      'session',
      'expired',
      'invalid',
    ];

    return tokenExpiredKeywords.some(keyword => 
      message.toLowerCase().includes(keyword.toLowerCase())
    );
  }

  // Handle token refresh
  private async handleTokenRefresh(): Promise<string | null> {
    if (this.isRefreshing) {
      // If refreshing, wait for completion
      return new Promise((resolve) => {
        this.refreshSubscribers.push((token: string) => {
          resolve(token);
        });
      });
    }

    this.isRefreshing = true;

    try {
      const refreshToken = await storageService.getRefreshToken();
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      // Call refresh token API
      const response = await fetch(`${this.config.baseUrl}/refreshToken`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Token refresh failed');
      }

      if (data.token) {
        // Save new token
        await storageService.updateToken(data.token, data.refreshToken, data.tokenExpiry);
        
        // Notify all waiting requests
        this.refreshSubscribers.forEach((callback) => {
          callback(data.token);
        });
        this.refreshSubscribers = [];

        // Call callback
        this.config.onTokenRefresh?.(data.token);

        return data.token;
      }

      return null;
    } catch (error) {
      console.error('❌ Token refresh failed:', error);
      
      // Clear login information
      await storageService.clearAuthInfo();
      
      // Notify all waiting requests
      this.refreshSubscribers.forEach((callback) => {
        callback('');
      });
      this.refreshSubscribers = [];

      // Call callback
      this.config.onTokenExpired?.();

      return null;
    } finally {
      this.isRefreshing = false;
    }
  }

  // Check if token is expiring soon
  async isTokenExpiringSoon(): Promise<boolean> {
    try {
      return await storageService.isTokenExpired();
    } catch (error) {
      console.error('❌ Failed to check token expiry:', error);
      return true;
    }
  }

  // Proactively refresh token
  async refreshToken(): Promise<boolean> {
    try {
      const newToken = await this.handleTokenRefresh();
      return !!newToken;
    } catch (error) {
      console.error('❌ Active token refresh failed:', error);
      return false;
    }
  }
}

export default TokenInterceptor; 