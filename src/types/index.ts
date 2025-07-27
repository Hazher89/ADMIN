// User and Authentication Types
export interface User {
  id: string;
  email: string;
  displayName: string;
  photoURL?: string;
  phoneNumber?: string;
  role: UserRole;
  departmentId?: string;
  departmentName?: string;
  permissions: Permission[];
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
  emergencyContact?: {
    name: string;
    phone: string;
    relationship: string;
  };
}

export enum UserRole {
  ADMIN = 'admin',
  DEPARTMENT_LEADER = 'department_leader',
  EMPLOYEE = 'employee'
}

export interface Permission {
  id: string;
  name: string;
  description: string;
  category: PermissionCategory;
}

export enum PermissionCategory {
  ABSENCE = 'absence',
  VACATION = 'vacation',
  DEVIATION = 'deviation',
  DOCUMENT = 'document',
  SHIFT = 'shift',
  EMPLOYEE = 'employee',
  DEPARTMENT = 'department',
  REPORT = 'report'
}

// Department Types
export interface Department {
  id: string;
  name: string;
  description?: string;
  leaderIds: string[];
  employeeIds: string[];
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
}

// Absence Types
export interface Absence {
  id: string;
  employeeId: string;
  employeeName: string;
  departmentId: string;
  departmentName: string;
  type: AbsenceType;
  startDate: Date;
  endDate: Date;
  reason: string;
  status: RequestStatus;
  approvedBy?: string;
  approvedAt?: Date;
  rejectedBy?: string;
  rejectedAt?: Date;
  rejectionReason?: string;
  comments: Comment[];
  attachments?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export enum AbsenceType {
  SICK_LEAVE = 'sick_leave',
  PERSONAL_LEAVE = 'personal_leave',
  OTHER = 'other'
}

// Vacation Types
export interface Vacation {
  id: string;
  employeeId: string;
  employeeName: string;
  departmentId: string;
  departmentName: string;
  startDate: Date;
  endDate: Date;
  daysRequested: number;
  daysAvailable: number;
  daysUsed: number;
  year: number;
  status: RequestStatus;
  approvedBy?: string;
  approvedAt?: Date;
  rejectedBy?: string;
  rejectedAt?: Date;
  rejectionReason?: string;
  comments: Comment[];
  attachments?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface VacationBalance {
  id: string;
  employeeId: string;
  year: number;
  totalDays: number;
  usedDays: number;
  remainingDays: number;
  carriedOverDays: number;
  updatedAt: Date;
}

// Deviation Types
export interface Deviation {
  id: string;
  uniqueId: string;
  employeeId: string;
  employeeName: string;
  departmentId: string;
  departmentName: string;
  title: string;
  description: string;
  category: DeviationCategory;
  priority: Priority;
  status: DeviationStatus;
  assignedTo?: string;
  assignedAt?: Date;
  resolvedBy?: string;
  resolvedAt?: Date;
  resolution?: string;
  comments: Comment[];
  attachments?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export enum DeviationCategory {
  SAFETY = 'safety',
  QUALITY = 'quality',
  EQUIPMENT = 'equipment',
  PROCESS = 'process',
  OTHER = 'other'
}

export enum Priority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export enum DeviationStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  RESOLVED = 'resolved',
  REJECTED = 'rejected'
}

// Chat Types
export interface Chat {
  id: string;
  type: ChatType;
  name?: string;
  participants: string[];
  lastMessage?: Message;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
}

export enum ChatType {
  PRIVATE = 'private',
  GROUP = 'group'
}

export interface Message {
  id: string;
  chatId: string;
  senderId: string;
  senderName: string;
  content: string;
  type: MessageType;
  attachments?: Attachment[];
  readBy: string[];
  createdAt: Date;
  updatedAt: Date;
}

export enum MessageType {
  TEXT = 'text',
  IMAGE = 'image',
  FILE = 'file',
  VIDEO = 'video',
  AUDIO = 'audio'
}

export interface Attachment {
  id: string;
  name: string;
  url: string;
  type: string;
  size: number;
}

// Document Types
export interface Document {
  id: string;
  title: string;
  description?: string;
  fileName: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
  uploadedBy: string;
  uploadedByName: string;
  sharedWith: DocumentShare[];
  permissions: DocumentPermission[];
  createdAt: Date;
  updatedAt: Date;
}

export interface DocumentShare {
  type: 'department' | 'employee';
  id: string;
  name: string;
  canEdit: boolean;
  canDelete: boolean;
}

export interface DocumentPermission {
  userId: string;
  canView: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canShare: boolean;
}

// Shift Types
export interface Shift {
  id: string;
  employeeId: string;
  employeeName: string;
  departmentId: string;
  departmentName: string;
  startTime: Date;
  endTime: Date;
  breakTime: number; // minutes
  status: ShiftStatus;
  approvedBy?: string;
  approvedAt?: Date;
  rejectedBy?: string;
  rejectedAt?: Date;
  rejectionReason?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export enum ShiftStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  COMPLETED = 'completed'
}

export interface ShiftPlan {
  id: string;
  departmentId: string;
  departmentName: string;
  period: ShiftPeriod;
  startDate: Date;
  endDate: Date;
  shifts: Shift[];
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export enum ShiftPeriod {
  DAY = 'day',
  WEEK = 'week',
  MONTH = 'month',
  YEAR = 'year'
}

// Time Tracking Types
export interface TimeEntry {
  id: string;
  employeeId: string;
  employeeName: string;
  departmentId: string;
  departmentName: string;
  clockIn: Date;
  clockOut?: Date;
  totalHours?: number;
  breakTime: number; // minutes
  location?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Report Types
export interface Report {
  id: string;
  title: string;
  type: ReportType;
  filters: ReportFilter;
  data: any;
  generatedBy: string;
  generatedAt: Date;
  expiresAt?: Date;
}

export enum ReportType {
  ABSENCE = 'absence',
  VACATION = 'vacation',
  DEVIATION = 'deviation',
  SHIFT = 'shift',
  TIME_TRACKING = 'time_tracking',
  COMPLIANCE = 'compliance'
}

export interface ReportFilter {
  startDate?: Date;
  endDate?: Date;
  departmentIds?: string[];
  employeeIds?: string[];
  status?: string[];
}

// Notification Types
export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  data?: any;
  read: boolean;
  createdAt: Date;
}

export enum NotificationType {
  ABSENCE_REQUEST = 'absence_request',
  VACATION_REQUEST = 'vacation_request',
  DEVIATION_REPORT = 'deviation_report',
  SHIFT_ASSIGNMENT = 'shift_assignment',
  DOCUMENT_SHARED = 'document_shared',
  CHAT_MESSAGE = 'chat_message',
  SYSTEM = 'system'
}

// Common Types
export enum RequestStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected'
}

export interface Comment {
  id: string;
  userId: string;
  userName: string;
  content: string;
  createdAt: Date;
}

// GDPR and Compliance Types
export interface DataConsent {
  id: string;
  userId: string;
  consentType: ConsentType;
  granted: boolean;
  grantedAt: Date;
  revokedAt?: Date;
  ipAddress?: string;
  userAgent?: string;
}

export enum ConsentType {
  DATA_PROCESSING = 'data_processing',
  MARKETING = 'marketing',
  THIRD_PARTY = 'third_party'
}

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  resource: string;
  resourceId: string;
  details?: any;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
} 