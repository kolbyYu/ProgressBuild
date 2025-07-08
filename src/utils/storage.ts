import AsyncStorage from "@react-native-async-storage/async-storage";
import { User } from '../types';

// Storage key constants
const STORAGE_KEYS = {
  AUTH_TOKEN: 'auth_token',
  REFRESH_TOKEN: 'refresh_token',
  USER_INFO: 'user_info',
  LOGIN_TIME: 'login_time',
  TOKEN_EXPIRY: 'token_expiry',
} as const;

// User login information interface
export interface StoredAuthInfo {
  token: string;
  refreshToken?: string;
  userInfo: User;
  loginTime: number;
  tokenExpiry?: number;
}

class StorageService {
  // Save complete login information
  async saveAuthInfo(authInfo: StoredAuthInfo): Promise<void> {
    try {
      await Promise.all([
        AsyncStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, authInfo.token),
        AsyncStorage.setItem(STORAGE_KEYS.USER_INFO, JSON.stringify(authInfo.userInfo)),
        AsyncStorage.setItem(STORAGE_KEYS.LOGIN_TIME, authInfo.loginTime.toString()),
      ]);

      if (authInfo.refreshToken) {
        await AsyncStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, authInfo.refreshToken);
      }

      if (authInfo.tokenExpiry) {
        await AsyncStorage.setItem(STORAGE_KEYS.TOKEN_EXPIRY, authInfo.tokenExpiry.toString());
      }

      console.log('✅ Auth info saved successfully');
    } catch (error) {
      console.error('❌ Failed to save auth info:', error);
      throw error;
    }
  }

  // Get complete login information
  async getAuthInfo(): Promise<StoredAuthInfo | null> {
    try {
      const [token, userInfoStr, loginTimeStr, refreshToken, tokenExpiryStr] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.AUTH_TOKEN),
        AsyncStorage.getItem(STORAGE_KEYS.USER_INFO),
        AsyncStorage.getItem(STORAGE_KEYS.LOGIN_TIME),
        AsyncStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN),
        AsyncStorage.getItem(STORAGE_KEYS.TOKEN_EXPIRY),
      ]);

      if (!token || !userInfoStr || !loginTimeStr) {
        return null;
      }

      const userInfo: User = JSON.parse(userInfoStr);
      const loginTime = parseInt(loginTimeStr, 10);
      const tokenExpiry = tokenExpiryStr ? parseInt(tokenExpiryStr, 10) : undefined;

      return {
        token,
        refreshToken: refreshToken || undefined,
        userInfo,
        loginTime,
        tokenExpiry,
      };
    } catch (error) {
      console.error('❌ Failed to get auth info:', error);
      return null;
    }
  }

  // Update token
  async updateToken(token: string, refreshToken?: string, tokenExpiry?: number): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
      
      if (refreshToken) {
        await AsyncStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
      }

      if (tokenExpiry) {
        await AsyncStorage.setItem(STORAGE_KEYS.TOKEN_EXPIRY, tokenExpiry.toString());
      }

      console.log('✅ Token updated successfully');
    } catch (error) {
      console.error('❌ Failed to update token:', error);
      throw error;
    }
  }

  // Get token
  async getToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    } catch (error) {
      console.error('❌ Failed to get token:', error);
      return null;
    }
  }

  // Get refresh token
  async getRefreshToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
    } catch (error) {
      console.error('❌ Failed to get refresh token:', error);
      return null;
    }
  }

  // Get user information
  async getUserInfo(): Promise<User | null> {
    try {
      const userInfoStr = await AsyncStorage.getItem(STORAGE_KEYS.USER_INFO);
      return userInfoStr ? JSON.parse(userInfoStr) : null;
    } catch (error) {
      console.error('❌ Failed to get user info:', error);
      return null;
    }
  }

  // Check if token is expired
  async isTokenExpired(): Promise<boolean> {
    try {
      const tokenExpiryStr = await AsyncStorage.getItem(STORAGE_KEYS.TOKEN_EXPIRY);
      if (!tokenExpiryStr) {
        return false; // If no expiry time is set, assume not expired
      }

      const tokenExpiry = parseInt(tokenExpiryStr, 10);
      const now = Date.now();
      
      // Consider token expired 5 minutes early to allow refresh time
      return now >= (tokenExpiry - 5 * 60 * 1000);
    } catch (error) {
      console.error('❌ Failed to check token expiry:', error);
      return true; // Consider expired on error
    }
  }

  // Clear all login information
  async clearAuthInfo(): Promise<void> {
    try {
      await Promise.all([
        AsyncStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN),
        AsyncStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN),
        AsyncStorage.removeItem(STORAGE_KEYS.USER_INFO),
        AsyncStorage.removeItem(STORAGE_KEYS.LOGIN_TIME),
        AsyncStorage.removeItem(STORAGE_KEYS.TOKEN_EXPIRY),
      ]);

      console.log('✅ Auth info cleared successfully');
    } catch (error) {
      console.error('❌ Failed to clear auth info:', error);
      throw error;
    }
  }

  // Check if there's valid login information
  async hasValidAuth(): Promise<boolean> {
    try {
      const authInfo = await this.getAuthInfo();
      if (!authInfo) {
        return false;
      }

      // Check if token is expired
      const isExpired = await this.isTokenExpired();
      return !isExpired;
    } catch (error) {
      console.error('❌ Failed to check valid auth:', error);
      return false;
    }
  }
}

export const storageService = new StorageService();
export default storageService;
 