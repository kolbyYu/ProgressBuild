import { Platform } from 'react-native';

// 调试工具函数

// 格式化JSON输出
export const formatJSON = (obj: any): string => {
  try {
    return JSON.stringify(obj, null, 2);
  } catch (error) {
    return String(obj);
  }
};

// 记录API请求
export const logAPIRequest = (url: string, method: string, body?: any) => {
  if (__DEV__) {
    console.group(`🌐 ${method} ${url}`);
    console.log('URL:', url);
    console.log('Method:', method);
    if (body) {
      console.log('Request Body:', formatJSON(body));
    }
    console.groupEnd();
  }
};

// 记录API响应
export const logAPIResponse = (url: string, status: number, data: any, duration: number) => {
  if (__DEV__) {
    console.group(`📡 ${status} ${url} (${duration}ms)`);
    console.log('Status:', status);
    console.log('Duration:', `${duration}ms`);
    console.log('Response:', formatJSON(data));
    console.groupEnd();
  }
};

// 记录API错误
export const logAPIError = (url: string, error: any) => {
  if (__DEV__) {
    console.group(`❌ Error ${url}`);
    console.error('Error:', error);
    console.groupEnd();
  }
};

// 网络状态检查
export const checkNetworkStatus = async (): Promise<boolean> => {
  try {
    const response = await fetch('https://www.google.com', { 
      method: 'HEAD',
      mode: 'no-cors'
    });
    return true;
  } catch (error) {
    return false;
  }
};

// 获取设备信息
export const getDeviceInfo = () => {
  if (__DEV__) {
    console.group('📱 Device Info');
    console.log('Platform:', Platform.OS);
    console.log('Version:', Platform.Version);
    console.log('Is Development:', __DEV__);
    console.groupEnd();
  }
};

// 性能监控
export const measurePerformance = (name: string, fn: () => void) => {
  if (__DEV__) {
    const start = performance.now();
    fn();
    const end = performance.now();
    console.log(`⏱️ ${name}: ${(end - start).toFixed(2)}ms`);
  } else {
    fn();
  }
}; 