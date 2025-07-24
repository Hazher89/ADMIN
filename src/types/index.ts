export interface Company {
  id: string;
  name: string;
  email?: string;
  logoURL?: string | null;
  primaryColor?: string;
  secondaryColor?: string;
  address?: string;
  phoneNumber?: string;
  website?: string;
  description?: string;
  adminUserId?: string;
  isActive: boolean;
  subscriptionPlan?: 'basic' | 'premium' | 'enterprise';
  createdAt: Date;
  updatedAt: Date;
}

export interface Department {
  id: string;
  name: string;
  companyId: string;
  managerId?: string;
  description?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'admin' | 'manager' | 'employee' | 'super_admin';
  companyId: string;
  departmentId?: string;
  isActive: boolean;
  permissions: string[];
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date;
  profileImageURL?: string | null;
  phoneNumber?: string;
  position?: string;
}

export interface Permission {
  id: string;
  name: string;
  description: string;
  category: string;
}

export interface Chat {
  id: string;
  participants: string[];
  lastMessage?: ChatMessage;
  lastMessageAt?: Date;
  isGroup: boolean;
  groupName?: string;
  groupImageURL?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ChatMessage {
  id: string;
  chatId: string;
  senderId: string;
  content: string;
  messageType: 'text' | 'image' | 'file' | 'audio' | 'location' | 'contact';
  timestamp: Date;
  isRead: boolean;
  readBy: string[];
  deliveredTo: string[];
  status: 'sent' | 'delivered' | 'read';
  location?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  contact?: {
    name: string;
    phoneNumber: string;
    email?: string;
  };
  audioDuration?: number;
  fileSize?: number;
  fileName?: string;
  replyToMessageId?: string;
  forwardedFrom?: string;
  forwardedFromName?: string;
}

export interface Deviation {
  id: string;
  title: string;
  description: string;
  category: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  reportedBy: string;
  assignedTo?: string;
  companyId: string;
  departmentId?: string;
  location?: string;
  images?: string[];
  createdAt: Date;
  updatedAt: Date;
  resolvedAt?: Date;
  estimatedResolutionTime?: Date;
}

export interface Document {
  id: string;
  title: string;
  description?: string;
  category: string;
  fileURL: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  uploadedBy: string;
  companyId: string;
  departmentId?: string;
  isPublic: boolean;
  tags?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Shift {
  id: string;
  title: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  assignedTo: string[];
  companyId: string;
  departmentId?: string;
  location?: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  createdAt: Date;
  updatedAt: Date;
}

export interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  totalDepartments: number;
  totalDeviations: number;
  openDeviations: number;
  totalDocuments: number;
  totalShifts: number;
  upcomingShifts: number;
  chatMessages: number;
  activeChats: number;
} 