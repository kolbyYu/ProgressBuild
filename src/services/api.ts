import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  ApiResponse, 
  PagedResponse,
  LoginCredentials, 
  LoginResponse, 
  User, 
  RefreshTokenRequest,
  ChangePasswordRequest,
  Estimate,
  AdminAttendance,
  AttendanceRecordResponse,
  ClockAttendanceRequest,
  JobCategoryResponse,
  JobDetailResponse,
  UpdateJobProgressRequest,
  SaveJobRecordRequest,
  JobRecord,
  JobWithHours,
  JobSummaryResponse,
  DailyWorkSummaryResponse,
  VersionCheckResponse,
  NotificationMessage,
  NotificationResponse,
  MarkNotificationReadRequest
} from '../types';
import { storageService } from '../utils/storage';

// API base configuration
// const API_BASE_URL = 'http://localhost:5000/api/app'; // Modify according to actual backend address
const API_BASE_URL = 'https://api.progressbuild.co.nz/api/app'; // Production API URL
const API_TIMEOUT = 10000; // 10 second timeout

class ApiService {
  private baseUrl: string;
  private token: string | null = null;
  private isRefreshing = false;
  private refreshSubscribers: Array<(token: string) => void> = [];

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
    this.loadToken();
  }

  // Load token from local storage
  private async loadToken(): Promise<void> {
    try {
      this.token = await storageService.getToken();
    } catch (error) {
      console.error('Failed to load token:', error);
    }
  }

  // Save token to local storage
  private async saveToken(token: string): Promise<void> {
    try {
      this.token = token;
      await storageService.updateToken(token);
    } catch (error) {
      console.error('Failed to save token:', error);
    }
  }

  // Clear token
  private async clearToken(): Promise<void> {
    try {
      this.token = null;
      await storageService.clearAuthInfo();
    } catch (error) {
      console.error('Failed to clear token:', error);
    }
  }

  // Refresh token
  private async refreshTokenInternal(): Promise<string | null> {
    try {
      const refreshToken = await storageService.getRefreshToken();
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await fetch(`${this.baseUrl}/refreshToken`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.token}`,
        },
        body: JSON.stringify({ refreshToken }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Token refresh failed');
      }

      if (data.token) {
        await this.saveToken(data.token);
        return data.token;
      }

      return null;
    } catch (error) {
      console.error('Token refresh failed:', error);
      await this.clearToken();
      return null;
    }
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
      const newToken = await this.refreshTokenInternal();
      
      // Notify all waiting requests
      this.refreshSubscribers.forEach((callback) => {
        callback(newToken || '');
      });
      this.refreshSubscribers = [];

      return newToken;
    } finally {
      this.isRefreshing = false;
    }
  }

  // Generic request method
  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    requireAuth: boolean = true
  ): Promise<ApiResponse<T>> {
    try {
      const url = `${this.baseUrl}${endpoint}`;
      const config: RequestInit = {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      };

      // Add authentication header for all requests except login
      if (requireAuth && this.token) {
        config.headers = {
          ...config.headers,
          'Authorization': `Bearer ${this.token}`,
        };
      } else if (requireAuth && !this.token) {
        // If authentication is required but no token is available, try to load it
        await this.loadToken();
        if (this.token) {
          config.headers = {
            ...config.headers,
            'Authorization': `Bearer ${this.token}`,
          };
        }
      }

      // Debug log: request information
      console.log('🌐 API Request:', {
        url,
        method: config.method || 'GET',
        headers: config.headers,
        body: config.body ? JSON.parse(config.body as string) : undefined,
      });

      // Use AbortController for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);
      config.signal = controller.signal;

      const startTime = Date.now();
      const response = await fetch(url, config);
      const endTime = Date.now();
      clearTimeout(timeoutId);

      // Debug log: response information
      console.log('📡 API Response:', {
        url,
        status: response.status,
        statusText: response.statusText,
        duration: `${endTime - startTime}ms`,
        headers: Object.fromEntries(response.headers.entries()),
      });

      const data = await response.json();

      // Debug log: response data
      console.log('📦 Response Data:', {
        url,
        success: data.success,
        message: data.message,
        data: data.data,
        error: data.error,
      });

      // Check if token is expired
      if (response.status === 401 || (data.message && data.message.includes('token'))) {
        console.log('🔄 Token expired, attempting refresh...');
        
        const newToken = await this.handleTokenRefresh();
        
        if (newToken) {
          // Retry request with new token
          console.log('🔄 Retrying request with new token...');
          config.headers = {
            ...config.headers,
            'Authorization': `Bearer ${newToken}`,
          };
          
          const retryResponse = await fetch(url, config);
          const retryData = await retryResponse.json();
          
          if (!retryResponse.ok) {
            throw new Error(retryData.message || 'Request failed after token refresh');
          }
          
          return retryData;
        } else {
          // Refresh failed, clear login information
          await this.clearToken();
          throw new Error('Token refresh failed, please login again');
        }
      }

      if (!response.ok) {
        throw new Error(data.message || 'Request failed');
      }

      return data;
    } catch (error) {
      // Debug log: error information
      console.error('❌ API Error:', {
        url: `${this.baseUrl}${endpoint}`,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // User authentication related
  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    try {
      const response = await this.request<any>('/login', {
        method: 'POST',
        body: JSON.stringify(credentials),
      }, false); // Don't require authentication for login

      // The server returns AppLoginResponse: { Success, Token, RefreshToken, Message, UserInfo }
      // But the request method processes it and may change the structure
      // Cast response to any to access the actual properties
      const loginResponse = response as any;
      
      if (loginResponse.success) {
        // Check if we have the required login data
        // The server response properties might be at different levels
        const token = loginResponse.token || loginResponse.Token;
        const userInfo = loginResponse.userInfo || loginResponse.UserInfo;
        const refreshToken = loginResponse.refreshToken || loginResponse.RefreshToken;
        const message = loginResponse.message || loginResponse.Message;
        
        if (token && userInfo) {
          await storageService.saveAuthInfo({
            token: token,
            refreshToken: refreshToken,
            userInfo: userInfo,
            loginTime: Date.now(),
          });
          this.token = token;
          
          return {
            success: true,
            message: message || 'Login successful',
            userInfo: userInfo,
            token: token,
            refreshToken: refreshToken,
          };
        } else {
          // Login response doesn't have required data
          console.log('❌ Missing login data:', { token: !!token, userInfo: !!userInfo });
          return {
            success: false,
            message: message || 'Login failed - missing user data',
          };
        }
      }

      return {
        success: false,
        message: loginResponse.message || loginResponse.error || 'Login failed',
      };
    } catch (error) {
      console.error('❌ Login Error:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async refreshToken(refreshToken: string): Promise<LoginResponse> {
    try {
      const response = await this.request<LoginResponse>('/refreshToken', {
        method: 'POST',
        body: JSON.stringify({ refreshToken }),
      }, true); // Require authentication

      // Save token if refresh is successful
      if (response.success && response.data?.token) {
        await storageService.updateToken(response.data.token, response.data.refreshToken);
        this.token = response.data.token;
      }

      return response.data || {
        success: false,
        message: response.error || 'Unknown error',
      };
    } catch (error) {
      console.error('❌ Refresh Token Error:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async logout(): Promise<ApiResponse<void>> {
    const response = await this.request<void>('/logout', {
      method: 'GET',
    });

    await this.clearToken();
    return response;
  }

  async changePassword(newPassword: string): Promise<ApiResponse<void>> {
    return this.request<void>('/changePassword', {
      method: 'POST',
      body: JSON.stringify({ newPassword }),
    });
  }

  // Project related
  async getEstimates(): Promise<ApiResponse<Estimate[]>> {
    return this.request<Estimate[]>('/estimates');
  }

  async searchEstimates(description?: string): Promise<ApiResponse<Estimate[]>> {
    const endpoint = description 
      ? `/estimates/search?description=${encodeURIComponent(description)}`
      : '/estimates/search';
    return this.request<Estimate[]>(endpoint);
  }

  // Attendance related
  async getAttendanceRecords(): Promise<ApiResponse<AttendanceRecordResponse[]>> {
    return this.request<AttendanceRecordResponse[]>('/attendance/records');
  }

  async clockAttendance(request: ClockAttendanceRequest): Promise<ApiResponse<AdminAttendance>> {
    return this.request<AdminAttendance>('/attendance/clock', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  // Job related
  async getJobsByEstimate(estimateId: number): Promise<ApiResponse<JobCategoryResponse[]>> {
    return this.request<JobCategoryResponse[]>(`/jobs?estimateId=${estimateId}`);
  }

  // Get jobs with hours and summary statistics by estimate ID
  async getJobsWithHours(estimateId: number, page: number = 1, pageSize: number = 10): Promise<ApiResponse<JobSummaryResponse>> {
    return this.request<JobSummaryResponse>(`/jobs/hours?estimateId=${estimateId}&page=${page}&pageSize=${pageSize}`);
  }

  async getJobDetail(jobId: number): Promise<ApiResponse<JobDetailResponse>> {
    return this.request<JobDetailResponse>(`/job/detail?id=${jobId}`);
  }

  async updateJobProgress(request: UpdateJobProgressRequest): Promise<ApiResponse<any>> {
    return this.request<any>('/job/progress', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async saveJobRecord(request: SaveJobRecordRequest): Promise<ApiResponse<JobRecord>> {
    // Format Date objects to YYYY-MM-DD HH:mm:ss format for the server
    const formatDateTime = (date: Date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      const seconds = String(date.getSeconds()).padStart(2, '0');
      return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    };

    // Convert Date objects to formatted strings
    const formattedRequest = {
      ...request,
      beginTime: formatDateTime(request.beginTime),
      endTime: formatDateTime(request.endTime),
    };

    console.log('🔄 API Service: Converting time format:', {
      originalBeginTime: request.beginTime.toISOString(),
      originalEndTime: request.endTime.toISOString(),
      formattedBeginTime: formattedRequest.beginTime,
      formattedEndTime: formattedRequest.endTime,
    });

    return this.request<JobRecord>('/job/record', {
      method: 'POST',
      body: JSON.stringify(formattedRequest),
    });
  }

  async getJobRecord(recordId: number): Promise<ApiResponse<any>> {
    return this.request<any>(`/job/record/${recordId}`);
  }

  async deleteJobRecord(recordId: number): Promise<ApiResponse<void>> {
    return this.request<void>(`/job/record/${recordId}`, {
      method: 'DELETE',
    });
  }

  // Get job records by job ID with pagination
  async getJobRecordsByJobId(jobId: number, page: number = 1, pageSize: number = 10): Promise<PagedResponse<any>> {
    try {
      const url = `${this.baseUrl}/job/${jobId}/records?page=${page}&pageSize=${pageSize}`;
      
      // Ensure we have a token
      if (!this.token) {
        await this.loadToken();
      }
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      // Debug log to understand the actual response structure
      console.log('🔍 Job Records Response:', data);
      
      // The server returns PagedResponse directly
      if (data.success !== false) {
        return {
          success: data.success || true,
          data: data.data || [],
          total: data.total || (data.data ? data.data.length : 0),
          page: data.page || page,
          pageSize: data.pageSize || pageSize,
          message: data.message
        };
      }
      
      return {
        success: false,
        data: [],
        total: 0,
        page: page,
        pageSize: pageSize,
        message: data.message || 'Failed to fetch job records'
      };
    } catch (error) {
      console.error('❌ Job Records Fetch Error:', error);
      return {
        success: false,
        data: [],
        total: 0,
        page: page,
        pageSize: pageSize,
        message: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Get user's own job records
  async getUserJobRecords(page: number = 1, pageSize: number = 10): Promise<PagedResponse<any>> {
    try {
      const url = `${this.baseUrl}/user/job-records?page=${page}&pageSize=${pageSize}`;
      
      // Ensure we have a token
      if (!this.token) {
        await this.loadToken();
      }
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      // Debug log to understand the actual response structure
      console.log('🔍 User Job Records Response:', data);
      
      // The server returns PagedResponse directly
      if (data.success !== false) {
        return {
          success: data.success || true,
          data: data.data || [],
          total: data.total || (data.data ? data.data.length : 0),
          page: data.page || page,
          pageSize: data.pageSize || pageSize,
          message: data.message
        };
      }
      
      return {
        success: false,
        data: [],
        total: 0,
        page: page,
        pageSize: pageSize,
        message: data.message || 'Failed to fetch user job records'
      };
    } catch (error) {
      console.error('❌ User Job Records Fetch Error:', error);
      return {
        success: false,
        data: [],
        total: 0,
        page: page,
        pageSize: pageSize,
        message: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Get daily work summary
  async getDailySummary(): Promise<ApiResponse<DailyWorkSummaryResponse>> {
    try {
      const url = `${this.baseUrl}/user/daily-summary`;
      
      // Ensure we have a token
      if (!this.token) {
        await this.loadToken();
      }
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      // Debug log to understand the actual response structure
      console.log('🔍 Daily Summary Response:', data);
      
      return {
        success: data.success || true,
        data: data.data,
        message: data.message,
        error: data.error
      };
    } catch (error) {
      console.error('❌ Daily Summary Fetch Error:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Check app version
  async checkVersion(currentVersion: string): Promise<ApiResponse<VersionCheckResponse>> {
    try {
      const url = `${this.baseUrl}/version/check`;
      
      // Debug log: request information
      console.log('🌐 Version Check Request:', {
        url,
        currentVersion,
      });

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ currentVersion }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      // Debug log: response data
      console.log('📦 Version Check Response:', data);
      
      return {
        success: data.success || true,
        data: data.data,
        message: data.message,
        error: data.error
      };
    } catch (error) {
      console.error('❌ Version Check Error:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // File upload
  async uploadImage(imageUri: string): Promise<ApiResponse<{ url: string }>> {
    try {
      const url = `${this.baseUrl}/job/photo`;
      const formData = new FormData();
      formData.append('file', {
        uri: imageUri,
        type: 'image/jpeg',
        name: 'image.jpg',
      } as any);

      // Debug log: request information
      console.log('🌐 Upload Request:', {
        url,
        method: 'POST',
        token: !!this.token,
      });

      const config: RequestInit = {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.token}`,
          // Don't set Content-Type for FormData - let the browser set it with boundary
        },
        body: formData,
      };

      const startTime = Date.now();
      const response = await fetch(url, config);
      const endTime = Date.now();

      // Debug log: response information
      console.log('📡 Upload Response:', {
        url,
        status: response.status,
        statusText: response.statusText,
        duration: `${endTime - startTime}ms`,
        headers: Object.fromEntries(response.headers.entries()),
      });

      const data = await response.json();

      // Debug log: response data
      console.log('📦 Upload Data:', {
        url,
        success: data.success || data.Success,
        message: data.message || data.Message,
        data: data.data || data.Data,
        error: data.error,
      });

      if (!response.ok) {
        throw new Error(data.message || data.Message || 'Upload failed');
      }

      // Handle both camelCase and PascalCase responses
      return {
        success: data.success || data.Success || false,
        message: data.message || data.Message,
        data: data.data || data.Data,
        error: data.error,
      };
    } catch (error) {
      console.error('❌ Upload Error:', {
        url: `${this.baseUrl}/job/photo`,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // Upload user avatar
  async uploadUserAvatar(imageUri: string): Promise<ApiResponse<{ url: string }>> {
    try {
      const url = `${this.baseUrl}/user/avatar`;
      const formData = new FormData();
      formData.append('file', {
        uri: imageUri,
        type: 'image/jpeg',
        name: 'avatar.jpg',
      } as any);

      // Debug log: request information
      console.log('🌐 Upload Avatar Request:', {
        url,
        method: 'POST',
        token: !!this.token,
      });

      const config: RequestInit = {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.token}`,
          // Don't set Content-Type for FormData - let the browser set it with boundary
        },
        body: formData,
      };

      const startTime = Date.now();
      const response = await fetch(url, config);
      const endTime = Date.now();

      // Debug log: response information
      console.log('📡 Upload Avatar Response:', {
        url,
        status: response.status,
        statusText: response.statusText,
        duration: `${endTime - startTime}ms`,
        headers: Object.fromEntries(response.headers.entries()),
      });

      const data = await response.json();

      // Debug log: response data
      console.log('📦 Upload Avatar Data:', {
        url,
        success: data.success || data.Success,
        message: data.message || data.Message,
        data: data.data || data.Data,
        error: data.error,
      });

      if (!response.ok) {
        throw new Error(data.message || data.Message || 'Avatar upload failed');
      }

      // Handle both camelCase and PascalCase responses
      return {
        success: data.success || data.Success || false,
        message: data.message || data.Message,
        data: data.data || data.Data,
        error: data.error,
      };
    } catch (error) {
      console.error('❌ Upload Avatar Error:', {
        url: `${this.baseUrl}/user/avatar`,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // 获取通知列表
  async getNotifications(page: number = 1, pageSize: number = 20): Promise<ApiResponse<NotificationResponse>> {
    try {
      const response = await this.request<NotificationResponse>(
        `/notifications?page=${page}&pageSize=${pageSize}`,
        {
          method: 'GET',
        }
      );
      return response;
    } catch (error) {
      console.error('Get notifications failed:', error);
      throw error;
    }
  }

  // 标记通知为已读
  async markNotificationAsRead(notificationId: number): Promise<ApiResponse<void>> {
    try {
      const response = await this.request<void>(
        `/notifications/${notificationId}/read`,
        {
          method: 'PUT',
        }
      );
      return response;
    } catch (error) {
      console.error('Mark notification as read failed:', error);
      throw error;
    }
  }

  // 标记所有通知为已读
  async markAllNotificationsAsRead(): Promise<ApiResponse<void>> {
    try {
      const response = await this.request<void>(
        '/notifications/read-all',
        {
          method: 'PUT',
        }
      );
      return response;
    } catch (error) {
      console.error('Mark all notifications as read failed:', error);
      throw error;
    }
  }

  // 获取未读通知数量
  async getUnreadNotificationCount(): Promise<ApiResponse<{ count: number }>> {
    try {
      const response = await this.request<{ count: number }>(
        '/notifications/unread-count',
        {
          method: 'GET',
        }
      );
      return response;
    } catch (error) {
      console.error('Get unread notification count failed:', error);
      throw error;
    }
  }

  // 删除通知
  async deleteNotification(notificationId: number): Promise<ApiResponse<void>> {
    try {
      const response = await this.request<void>(
        `/notifications/${notificationId}`,
        {
          method: 'DELETE',
        }
      );
      return response;
    } catch (error) {
      console.error('Delete notification failed:', error);
      throw error;
    }
  }
}

export const apiService = new ApiService();
export default apiService;
