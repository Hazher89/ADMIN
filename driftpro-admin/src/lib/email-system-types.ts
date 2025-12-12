/**
 * Email System Types - Exported interfaces for MAVI Email Case Management System
 */

export interface EmailCase {
  id: string;
  caseId: string; // Unique MAVI case ID
  title: string;
  status: 'open' | 'in_progress' | 'pending' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  caseType: string;
  createdAt: string;
  updatedAt: string;
  lastActivityAt: string;
    assignedTo?: string;
  threadCount: number;
  messageCount: number;
  slaDeadline?: string;
  slaStatus?: 'running' | 'paused' | 'met' | 'breached';
}

export interface EmailCaseLink {
  id: string;
  caseId: string;
  kind: 'order_id' | 'SA' | 'FU' | 'HU' | 'customer' | 'phone' | 'address' | 'postal' | 'attachment_sha' | 'saks_id';
  value: string;
  createdAt: string;
  }

export interface EmailThread {
  id: string;
  caseId: string;
  externalThreadId: string;
  subject: string;
  participants: string[];
  firstAt: string;
  lastAt: string;
  messageCount: number;
  labels: string[];
    createdAt: string;
  updatedAt: string;
}

export interface EmailCaseMessage {
  id: string;
  threadId: string;
  caseId: string;
  externalMessageId: string;
  fromAddr: string;
  toAddrs: string[];
  ccAddrs?: string[];
  bccAddrs?: string[];
  sentAt?: string;
  receivedAt: string;
  subject: string;
  snippet: string;
  bodyPlain: string;
  bodyHtml: string;
  hasAttachments: boolean;
  folder: string;
  labels: string[];
  checksum: string;
    isRead: boolean;
  createdAt: string;
}

export interface EmailEntity {
  id: string;
  messageId: string;
  key: string;
  value: string;
  confidence: number;
  createdAt: string;
}

export interface EmailAttachment {
  id: string;
  messageId: string;
  filename: string;
  mime: string;
  size: number;
  storageUrl?: string;
  sha256: string;
  kind?: string;
  extractedData?: Record<string, any>;
  createdAt: string;
  }

export interface EmailCaseSLA {
  id: string;
  caseId: string;
  policy: string;
  deadlineAt: string;
  status: 'running' | 'paused' | 'met' | 'breached';
  createdAt: string;
  breachedAt?: string;
}

export interface EmailRule {
  id: string;
  name: string;
  priority: number;
  isActive: boolean;
  definitionJson: any;
    createdAt: string;
  updatedAt: string;
}





