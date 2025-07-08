// 用户类型定义
export interface User {
  id: number;
  username: string;
  realName?: string;
  roleId?: number;
  roleName?: string;
  phone?: string;
  email?: string;
  companyId?: number;
  companyName?: string;
  avatar?: string;
  isUse?: number;
  createTime?: Date;
  lastLoginTime?: Date;
}

// 打卡记录类型
export interface ClockRecord {
  id: string;
  userId: string;
  type: 'clock_in' | 'clock_out'; // 上班打卡或下班打卡
  timestamp: Date;
  location: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  photo?: string; // 打卡照片
  notes?: string; // 备注
  projectId?: string; // 项目ID
  approved: boolean; // 是否已审批
  approvedBy?: string; // 审批人ID
  approvedAt?: Date; // 审批时间
}

// 工作记录类型
export interface WorkRecord {
  id: string;
  userId: string;
  projectId: string;
  date: Date;
  startTime: Date;
  endTime?: Date;
  workType: string; // 工作类型
  description: string; // 工作描述
  photos?: string[]; // 工作照片
  materials?: Material[]; // 使用的材料
  equipment?: Equipment[]; // 使用的设备
  progress: number; // 进度百分比
  quality: 'excellent' | 'good' | 'fair' | 'poor'; // 质量评级
  approved: boolean;
  approvedBy?: string;
  approvedAt?: Date;
}

// 项目类型
export interface Project {
  id: string;
  name: string;
  description: string;
  address: string;
  startDate: Date;
  endDate?: Date;
  status: 'planning' | 'active' | 'completed' | 'cancelled';
  supervisorId: string; // 项目负责人
  workers: string[]; // 工人ID列表
  budget?: number;
  createdAt: Date;
  updatedAt: Date;
}

// 材料类型
export interface Material {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  cost?: number;
}

// 设备类型
export interface Equipment {
  id: string;
  name: string;
  type: string;
  condition: 'excellent' | 'good' | 'fair' | 'poor';
  lastMaintenance?: Date;
}

// 登录凭证类型
export interface LoginCredentials {
  username: string;
  password: string;
  cid?: string;
}

// 登录响应类型
export interface LoginResponse {
  success: boolean;
  token?: string;
  refreshToken?: string;
  message?: string;
  userInfo?: User;
}

// 刷新令牌请求类型
export interface RefreshTokenRequest {
  refreshToken: string;
}

// 修改密码请求类型
export interface ChangePasswordRequest {
  newPassword: string;
}

// 项目类型
export interface Estimate {
  id: number;
  companyId?: number;
  adminId?: number;
  clientId?: number;
  refNO?: string;
  description?: string;
  createTime: Date;
  updateTime?: Date;
  status?: number;
  lat?: number;
  lng?: number;
  address?: string;
}

// 考勤记录类型
export interface AdminAttendance {
  id: number;
  adminId: number;
  estimateId?: number;
  attendanceType: number; // 0: Clock in, 1: Clock out
  attendanceTime: Date;
  attendanceLat: number;
  attendanceLng: number;
  isIn?: number; // Whether within range
}

// 考勤记录响应类型（包含项目信息）
export interface AttendanceRecordResponse {
  id: number;
  adminId: number;
  estimateId?: number;
  attendanceType: number; // 0: Clock in, 1: Clock out
  attendanceTime: Date;
  attendanceLat: number;
  attendanceLng: number;
  isIn?: number; // Whether within range
  estimateInfo?: EstimateInfo;
}

// 项目信息类型
export interface EstimateInfo {
  id: number;
  refNO?: string;
  description?: string;
  address?: string;
  lat?: number;
  lng?: number;
}

// 打卡请求类型
export interface ClockAttendanceRequest {
  attendanceType: number; // 0: Clock in, 1: Clock out
  attendanceLat: number;
  attendanceLng: number;
}

// 工作分类响应类型
export interface JobCategoryResponse {
  categoryId?: number;
  categoryName?: string;
  categoryDescription?: string;
  items?: JobItemResponse[];
}

// 工作项响应类型
export interface JobItemResponse {
  itemId?: number;
  itemDescription?: string;
  quantity?: number;
  progressRate?: number;
  beginDate: Date;
  endDate: Date;
}

// 工作详情响应类型
export interface JobDetailResponse {
  job?: JobItemResponse;
  records?: JobRecord[];
  photos?: JobRecordPhoto[];
}

// 工作记录类型
export interface JobRecord {
  id: number;
  adminId?: number;
  jobId: number;
  beginTime: Date;
  endTime: Date;
  recordDescription: string;
  createTime: Date;
  updateTime: Date;
}

// 工作记录照片类型
export interface JobRecordPhoto {
  id: number;
  jobRecordId: number;
  url: string;
  createTime: Date;
}

// 每日工作汇总响应类型
export interface DailyWorkSummaryResponse {
  totalWorkHours: number;
  totalJobCount: number;
  date: Date;
  formattedWorkHours: string;
}

// 版本检测响应类型
export interface VersionCheckResponse {
  currentVersion: string;
  latestVersion: string;
  isLatest: boolean;
  updateRequired: boolean;
  updateUrl?: string;
  updateMessage?: string;
  releaseNotes?: string;
}

// 更新工作进度请求类型
export interface UpdateJobProgressRequest {
  jobId: number;
  progressRate: number;
}

// 保存工作记录请求类型
export interface SaveJobRecordRequest {
  jobId: number;
  jobRecordId?: number;
  recordDescription?: string;
  beginTime: Date;
  endTime: Date;
  photos?: string[];
}

// 带工作时间统计的工作类型
export interface JobWithHours {
  jobId: number;
  estimateId?: number;
  estimateCategoryItemId?: number;
  jobDescription: string;
  quantity?: number;
  progressRate?: number;
  beginDate: Date;
  endDate: Date;
  totalWorkHours: number;
  recordCount: number;
  createTime: Date;
}

// Job Summary统计信息类型
export interface JobSummaryStatistics {
  totalAllowedHours: number;
  totalActualHours: number;
  isOvertime: boolean;
  overtimeHours: number;
  jobsWithRecordsCount: number;
  totalJobsCount: number;
}

// Job Summary响应类型
export interface JobSummaryResponse {
  jobs: JobWithHours[];
  summary: JobSummaryStatistics;
  total: number;
  page: number;
  pageSize: number;
}

// 工作类型
export interface Job {
  id: number;
  adminId?: number;
  estimateId?: number;
  estimateCategoryItemId?: number;
  createTime: Date;
  progressRate?: number;
  beginDate: Date;
  endDate: Date;
}

// API响应类型
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// 分页响应类型
export interface PagedResponse<T> {
  success: boolean;
  data?: T[];
  message?: string;
  error?: string;
  total?: number;
  page?: number;
  pageSize?: number;
}

// 通知消息类型定义
export interface NotificationMessage {
  id: number;
  userId: number;
  title: string;
  content: string;
  type: 'job_assignment' | 'job_update' | 'system' | 'reminder' | 'announcement';
  isRead: boolean;
  priority: 'low' | 'medium' | 'high';
  createdAt: Date;
  readAt?: Date;
  actionUrl?: string;
  actionData?: any;
}

// 通知消息响应类型
export interface NotificationResponse {
  notifications: NotificationMessage[];
  unreadCount: number;
  total: number;
  page: number;
  pageSize: number;
}

// 标记通知为已读请求类型
export interface MarkNotificationReadRequest {
  notificationId: number;
}

// 导航参数类型
export type RootStackParamList = {
  Login: undefined;
  Main: undefined;
  Home: undefined;
  Job: undefined;
  ClockIn: undefined;
  ClockOut: undefined;
  WorkRecord: undefined;
  WorkRecordDetail: { recordId: string };
  NewRecord: undefined;
  JobRecords: undefined;
  JobRecordDetail: { jobId: number; jobTitle: string };
  UserJobRecords: undefined;
  Profile: undefined;
  Settings: undefined;
  Notifications: undefined;
  HelpSupport: undefined;
  About: undefined;
  ProjectList: undefined;
  ProjectDetail: { projectId: string };
};
