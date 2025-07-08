import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, LoginCredentials, LoginResponse } from '../types';
import { apiService } from '../services/api';
import { storageService } from '../utils/storage';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<boolean>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  checkAuthStatus: () => Promise<void>;
  updateUser: (updatedUser: User) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is already logged in
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      setIsLoading(true);
      
      // Check if there's valid login information
      const hasValidAuth = await storageService.hasValidAuth();
      
      if (hasValidAuth) {
        // Get user information
        const userInfo = await storageService.getUserInfo();
        if (userInfo) {
          setUser(userInfo);
          console.log('✅ Auto login successful');
        } else {
          // User info doesn't exist, clear login status
          await storageService.clearAuthInfo();
          console.log('❌ User info not found, clearing auth');
        }
      } else {
        // No valid login information, clear status
        setUser(null);
        console.log('❌ No valid auth found');
      }
    } catch (error) {
      console.error('❌ Auth check failed:', error);
      // Clear login info on error
      await storageService.clearAuthInfo();
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const updateUser = async (updatedUser: User) => {
    try {
      setUser(updatedUser);
      await storageService.saveUserInfo(updatedUser);
      console.log('✅ User updated successfully');
    } catch (error) {
      console.error('❌ Update user failed:', error);
    }
  };

  const login = async (credentials: LoginCredentials): Promise<boolean> => {
    try {
      setIsLoading(true);
      const response = await apiService.login(credentials);
      
      if (response.success && response.userInfo) {
        setUser(response.userInfo);
        console.log('✅ Login successful');
        return true;
      } else {
        console.error('❌ Login failed:', response.message);
        return false;
      }
    } catch (error) {
      console.error('❌ Login error:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      setIsLoading(true);
      // Call logout API
      await apiService.logout();
    } catch (error) {
      console.error('❌ Logout API error:', error);
    } finally {
      // Clear local state regardless of API call success
      setUser(null);
      await storageService.clearAuthInfo();
      setIsLoading(false);
      console.log('✅ Logout completed');
    }
  };

  const value: AuthContextType = {
    user,
    isLoading,
    login,
    logout,
    isAuthenticated: !!user,
    checkAuthStatus,
    updateUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 