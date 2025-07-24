export interface Company {
  id: string;
  name: string;
  domain: string;
  logo?: string;
  address: string;
  phone: string;
  email: string;
  createdAt: Date;
  isActive: boolean;
  subscription: {
    plan: 'basic' | 'premium' | 'enterprise';
    expiresAt: Date;
    features: string[];
  };
}

export interface Department {
  id: string;
  name: string;
  companyId: string;
  description?: string;
  managerId?: string;
  createdAt: Date;
  isActive: boolean;
  color: string;
  permissions: string[];
}

export interface User {
  id: string;
  email: string;
  name: string;
  companyId: string;
  departmentId?: string;
  role: 'admin' | 'manager' | 'employee' | 'super_admin';
  avatar?: string;
  phone?: string;
  isActive: boolean;
  createdAt: Date;
  lastLoginAt?: Date;
  permissions: string[];
  settings: {
    notifications: boolean;
    emailNotifications: boolean;
    language: 'no' | 'en';
  };
}

export interface Permission {
  id: string;
  name: string;
  description: string;
  category: 'users' | 'departments' | 'companies' | 'system' | 'reports';
  code: string;
}

export interface Chat {
  id: string;
  name?: string;
  type: 'individual' | 'group' | 'department' | 'company';
  participants: string[];
  companyId: string;
  createdAt: Date;
  lastMessageAt?: Date;
  lastMessage?: string;
  lastMessageSender?: string;
  lastMessageStatus?: 'sent' | 'delivered' | 'read';
  unreadCount: number;
  isActive: boolean;
  adminIds: string[];
  avatar?: string;
  isPinned: boolean;
  isMuted: boolean;
  typingUsers: string[];
}

export interface ChatMessage {
  id: string;
  text: string;
  senderId: string;
  senderName: string;
  chatId: string;
  companyId: string;
  createdAt: Date;
  mediaURLs: string[];
  messageType: 'text' | 'image' | 'video' | 'document' | 'audio' | 'location' | 'contact' | 'system' | 'reply' | 'forward';
  isEdited: boolean;
  editedAt?: Date;
  replyToMessageId?: string;
  forwardedFrom?: string;
  forwardedFromName?: string;
  status: 'sent' | 'delivered' | 'read' | 'failed';
  readBy: string[];
  deliveredTo: string[];
  location?: {
    latitude: number;
    longitude: number;
    address?: string;
    name?: string;
  };
  contact?: {
    name: string;
    phone: string;
    email?: string;
    avatar?: string;
  };
  audioDuration?: number;
  fileSize?: number;
  fileName?: string;
}

export interface Deviation {
  id: string;
  title: string;
  description: string;
  companyId: string;
  departmentId?: string;
  reportedBy: string;
  assignedTo?: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'critical';
  category: string;
  location?: string;
  createdAt: Date;
  updatedAt: Date;
  resolvedAt?: Date;
  attachments: string[];
  comments: {
    id: string;
    text: string;
    authorId: string;
    authorName: string;
    createdAt: Date;
  }[];
}

export interface Document {
  id: string;
  title: string;
  description?: string;
  companyId: string;
  departmentId?: string;
  uploadedBy: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  fileUrl: string;
  category: string;
  tags: string[];
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
  downloads: number;
  version: number;
}

export interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  totalCompanies: number;
  activeCompanies: number;
  totalDepartments: number;
  totalChats: number;
  totalMessages: number;
  totalDeviations: number;
  totalDocuments: number;
  recentActivity: {
    type: 'user_login' | 'message_sent' | 'deviation_created' | 'document_uploaded';
    userId: string;
    userName: string;
    timestamp: Date;
    details?: any;
  }[];
} 