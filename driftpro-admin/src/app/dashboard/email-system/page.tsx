'use client';

/**
 * MAVI Smart Email Handling System (Outlook / Microsoft 365)
 * 
 * Komplett e-posthandlingssystem basert på spec.md
 * - Klassifisering og ruting av e-poster
 * - Entitetsuttrekk (ordrenr., SA, FU, HU, postnr, etc.)
 * - Sakstyper med unik saks-ID
 * - Bilag/vedlegg-gjenkjenning
 * - Regler og anbefalinger
 * - Svarmaler
 * - SLA og eskalering
 * - Søk og filtrering
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { microsoftGraphService } from '@/lib/microsoft-graph-service';
import { firebaseService } from '@/lib/firebase-services';
import { EmailSystemService, RESPONSE_TEMPLATES, DEFAULT_RULES, SLA_POLICIES, CASE_TYPE_KEYWORDS } from '@/lib/email-system-service';
import type { CaseType } from '@/lib/email-system-service';
import type { EmailMessage, EmailAttachment } from '@/lib/microsoft-graph-service';
import type { EmailCase, EmailCaseMessage, EmailEntity, EmailAttachment as EmailAttachmentType, EmailRule } from '@/lib/email-system-types';
import {
  Mail, Search, Filter, Plus, RefreshCw, Clock, AlertTriangle, CheckCircle, X,
  FileText, Paperclip, User, Phone, MapPin, Calendar, Hash, Tag, Link as LinkIcon,
  Send, Reply, Forward, Trash2, Star, Archive, Flag, Eye, EyeOff, Download,
  Settings, BarChart3, Zap, TrendingUp, MessageSquare, FileCheck, Timer,
  ChevronRight, ChevronDown, Copy, Check, XCircle, AlertCircle, Info,
  Building, Package, Truck, Users, PhoneCall, Mail as MailIcon, CalendarDays,
  Route, Map, Hash as HashIcon, Tag as TagIcon, FileSearch, Layers, Sparkles,
  Inbox, Send as SendIcon, Folder, FolderOpen, ReplyAll
} from 'lucide-react';
import type { Contact, CalendarEvent, OneDriveItem } from '@/lib/microsoft-graph-service';
import OutlookLayout from './OutlookLayout';
import OutlookCompose from './OutlookCompose';
import EmailSettingsView from './EmailSettingsView';

// ============================================================================
// INTERFACES & TYPES
// ============================================================================

// Use EmailCase from types
type Case = EmailCase;

// CaseType imported from email-system-service

interface EmailThread {
  id: string;
  caseId: string;
  externalThreadId: string;
  subject: string;
  participants: string[];
  firstAt: string;
  lastAt: string;
  messageCount: number;
  labels: string[];
  }

// Use EmailCaseMessage from types
type Message = EmailCaseMessage;

// Use EmailEntity from types
type ExtractedEntity = EmailEntity;

// Use EmailAttachment from types
type Attachment = EmailAttachmentType;

interface CaseLink {
  id: string;
  caseId: string;
  kind: 'order_id' | 'SA' | 'FU' | 'HU' | 'customer' | 'phone' | 'address' | 'postal' | 'attachment_sha' | 'saks_id';
  value: string;
}

// Use EmailRule from types
type Rule = EmailRule;

interface Template {
  id: string;
  name: string;
  subject: string;
  body: string;
  caseTypes: CaseType[];
  variables: string[];
}

interface SLA {
  id: string;
  caseId: string;
  policy: string;
  deadlineAt: string;
  status: 'running' | 'paused' | 'met' | 'breached';
  createdAt: string;
}

// Entity extraction patterns
const ENTITY_PATTERNS = {
  SA: /\bSA[-\s:]?\d{4,}\b/gi,
  FU: /\bFU[-\s:]?\d{4,}\b/gi,
  HU: /\bHU[-\s:]?\d{4,}\b/gi,
  Returnstore: /\b(3900\d{2})\b/g,
  OrderId: /\b(\d{6,12})\b/g,
  Phone: /\b(\+?47[-\s]?)?\d{8}\b/g,
  PostalCode: /\b\d{4}\b/g,
  DeliveryWindow: /\b([01]?\d|2[0-3])[:.]?\d{0,2}\s?[-–]\s?([01]?\d|2[0-3])[:.]?\d{0,2}\b/g,
};

// CASE_TYPE_KEYWORDS imported from email-system-service

// Templates and SLA policies are imported from email-system-service

export default function EmailSystemPage() {
  const { user, userProfile } = useAuth();
  
  // Authentication state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  
  // Data state
  const [cases, setCases] = useState<Case[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [graphMessages, setGraphMessages] = useState<EmailMessage[]>([]); // Messages from Microsoft Graph
  const [folders, setFolders] = useState<any[]>([]);
  const [contacts, setContacts] = useState<any[]>([]);
  const [calendarEvents, setCalendarEvents] = useState<any[]>([]);
  const [oneDriveItems, setOneDriveItems] = useState<any[]>([]);
  const [selectedCase, setSelectedCase] = useState<Case | null>(null);
  const [selectedMessage, setSelectedMessage] = useState<Message | EmailMessage | null>(null);
  const [selectedGraphMessage, setSelectedGraphMessage] = useState<EmailMessage | null>(null);
  const [relatedCases, setRelatedCases] = useState<Case[]>([]);
  const [relatedMessages, setRelatedMessages] = useState<Message[]>([]);
  const [selectedContacts, setSelectedContacts] = useState<Set<string>>(new Set());
  const [selectedEmails, setSelectedEmails] = useState<Set<string>>(new Set());
  
  // UI state
  const [activeView, setActiveView] = useState<'outlook' | 'contacts' | 'calendar' | 'onedrive' | 'cases' | 'rules' | 'templates' | 'analytics' | 'settings'>('outlook');
  const [selectedFolder, setSelectedFolder] = useState<string>('inbox');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    status: 'all' as 'all' | 'open' | 'in_progress' | 'pending' | 'resolved' | 'closed',
    caseType: 'all' as 'all' | CaseType,
    priority: 'all' as 'all' | 'low' | 'medium' | 'high' | 'urgent',
    slaStatus: 'all' as 'all' | 'running' | 'breached',
    unreadOnly: false,
    hasAttachments: false,
    importance: 'all' as 'all' | 'low' | 'normal' | 'high'
  });
  
  // Compose state
  const [showCompose, setShowCompose] = useState(false);
  const [composeData, setComposeData] = useState({
    to: '',
    cc: '',
    bcc: '',
    subject: '',
    body: '',
    templateId: '',
    caseId: ''
  });
  
  // Modal states
  const [showCaseModal, setShowCaseModal] = useState(false);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  
  // Rules state
  const [rules, setRules] = useState<Rule[]>([]);
  const [selectedRule, setSelectedRule] = useState<Rule | null>(null);
  const [showRuleModal, setShowRuleModal] = useState(false);
  const [ruleEditor, setRuleEditor] = useState<string>('');
  
  // Entities and attachments state
  const [entities, setEntities] = useState<Record<string, ExtractedEntity[]>>({});
  const [attachments, setAttachments] = useState<Record<string, Attachment[]>>({});
  const [suggestedTemplate, setSuggestedTemplate] = useState<Template | null>(null);
  const [ruleResults, setRuleResults] = useState<any[]>([]);
  
  // SLA timers state
  const [slaTimers, setSlaTimers] = useState<Record<string, { deadline: string; status: string; timeRemaining: number }>>({});
  
  // Extract entities using EmailSystemService
  const extractEntities = useCallback((text: string, messageId: string): ExtractedEntity[] => {
    const extracted = EmailSystemService.extractEntities(text, messageId);
    // Convert to ExtractedEntity format with id
    return extracted.map((e, idx) => ({
      id: `${messageId}-${e.key}-${idx}-${Date.now()}`,
      messageId,
      key: e.key,
      value: e.value,
      confidence: e.confidence,
      createdAt: new Date().toISOString()
    }));
  }, []);
  
  // Classify case type using EmailSystemService
  const classifyCaseType = useCallback((text: string): CaseType => {
    return EmailSystemService.classifyCaseType(text);
  }, []);
  
  // Generate unique case ID using EmailSystemService
  const generateCaseId = useCallback((subject: string, orderId: string, sender: string, timestamp: string): string => {
    return EmailSystemService.generateCaseId(subject, orderId, sender, timestamp);
  }, []);
  
  // Find or create case with Firebase integration
  const findOrCreateCase = useCallback(async (message: EmailMessage, entities: ExtractedEntity[]): Promise<Case> => {
    if (!userProfile) throw new Error('No company ID');
    
    // Extract entities for linking
    const orderId = entities.find(e => ['sa', 'fu', 'hu', 'orderid'].includes(e.key))?.value || '';
    const phone = entities.find(e => e.key === 'phone')?.value || '';
    const postal = entities.find(e => e.key === 'postal_code')?.value || '';
    const customerName = EmailSystemService.extractCustomerName(message.from.address, message.body.content || '');
    
    // Try to find existing case by links
    const kinds = ['order_id', 'SA', 'FU', 'HU', 'phone', 'postal'];
    const values = [orderId, orderId, orderId, orderId, phone, postal];
    const existingCase = await firebaseService.findEmailCaseByLinks(kinds, values, userProfile.companyId);
    
    if (existingCase) {
      // Update existing case
      await firebaseService.updateEmailCase(existingCase.id, {
        lastActivityAt: message.receivedDateTime,
        messageCount: existingCase.messageCount + 1
      });
      return existingCase;
    }
    
    // Create new case
    const caseType = classifyCaseType(message.subject + ' ' + message.body.content);
    const caseId = generateCaseId(message.subject, orderId, message.from.address, message.receivedDateTime);
    
    const newCaseData: Omit<EmailCase, 'id' | 'createdAt' | 'updatedAt'> = {
      caseId,
      title: message.subject || 'Uten emne',
      status: 'open',
      priority: message.importance === 'high' ? 'high' : 'medium',
      caseType,
      lastActivityAt: message.receivedDateTime,
            threadCount: 1,
      messageCount: 1,
      slaDeadline: new Date(Date.now() + SLA_POLICIES[caseType]).toISOString(),
      slaStatus: 'running'
    };
    
    const caseId_db = await firebaseService.createEmailCase(newCaseData);
    
    // Create case links
    if (orderId) {
      await firebaseService.addEmailCaseLink(caseId_db, 'order_id', orderId, userProfile.companyId);
      if (orderId.match(/^SA/i)) await firebaseService.addEmailCaseLink(caseId_db, 'SA', orderId, userProfile.companyId);
      if (orderId.match(/^FU/i)) await firebaseService.addEmailCaseLink(caseId_db, 'FU', orderId, userProfile.companyId);
      if (orderId.match(/^HU/i)) await firebaseService.addEmailCaseLink(caseId_db, 'HU', orderId, userProfile.companyId);
    }
    if (phone) await firebaseService.addEmailCaseLink(caseId_db, 'phone', phone, userProfile.companyId);
    if (postal) await firebaseService.addEmailCaseLink(caseId_db, 'postal', postal, userProfile.companyId);
    if (customerName) await firebaseService.addEmailCaseLink(caseId_db, 'customer', customerName, userProfile.companyId);
    await firebaseService.addEmailCaseLink(caseId_db, 'saks_id', caseId, userProfile.companyId);
    
    // Create SLA
    await firebaseService.createEmailCaseSLA({
      caseId: caseId_db,
      policy: caseType,
      deadlineAt: newCaseData.slaDeadline!,
      status: 'running'
    });
    
    return { 
      id: caseId_db, 
      ...newCaseData,
      createdAt: message.receivedDateTime,
      updatedAt: message.receivedDateTime
    };
  }, [userProfile, classifyCaseType, generateCaseId]);
  
  // Process attachments and calculate SHA256
  const processAttachments = useCallback(async (emailId: string, attachments: EmailAttachment[]): Promise<Attachment[]> => {
    const processedAttachments: Attachment[] = [];
    
    for (const att of attachments) {
      try {
        // Download attachment to calculate SHA256
        let sha256 = '';
        if (att.contentBytes) {
          const binaryString = atob(att.contentBytes);
          const bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }
          sha256 = await EmailSystemService.calculateSHA256(bytes.buffer);
        }
        
        // Classify attachment kind
        let kind: string = 'other';
        const filename = att.name.toLowerCase();
        if (filename.includes('faktura') || filename.includes('invoice')) kind = 'faktura';
        else if (filename.includes('retur') || filename.includes('return')) kind = 'returskjema';
        else if (filename.match(/\.(jpg|jpeg|png|gif)$/i)) {
          if (filename.includes('bomtur')) kind = 'bomtur-bilde';
          else if (filename.includes('hms')) kind = 'HMS-bilde';
        }
        else if (filename.includes('p&p') || filename.includes('pick')) kind = 'p&p';
        else if (filename.includes('kjoreliste')) kind = 'kjoreliste';
        
        const attachmentData: Omit<EmailAttachmentType, 'id' | 'createdAt'> = {
          messageId: emailId,
          filename: att.name,
          mime: att.contentType,
          size: att.size,
          sha256: sha256 || att.id, // Fallback to ID if SHA256 fails
          kind,
                  };
        
        // Save to Firebase
        const attachmentId = await firebaseService.createEmailAttachment(attachmentData);
        processedAttachments.push({ id: attachmentId, ...attachmentData, createdAt: new Date().toISOString() });
        
        // Check for related attachments (same SHA256)
        if (sha256) {
          const relatedAttachments = await firebaseService.findEmailAttachmentsBySHA256(sha256,  '');
          if (relatedAttachments.length > 1) {
            console.log(`Found ${relatedAttachments.length} related attachments with same SHA256`);
          }
        }
      } catch (error) {
        console.error('Error processing attachment:', error);
      }
    }
    
    return processedAttachments;
  }, [userProfile]);
  
  // Process rules against message
  const processRules = useCallback(async (subject: string, body: string): Promise<any[]> => {
    if (!userProfile) return [];
    
    // Get active rules
    const activeRules = await firebaseService.getEmailRules(userProfile.companyId);
    const ruleDefinitions = activeRules
      .filter(r => r.isActive)
      .map(r => r.definitionJson)
      .concat(DEFAULT_RULES);
    
    // Process rules
    const results = EmailSystemService.processRules(subject, body, ruleDefinitions);
    
    // Store rule results
    setRuleResults(results);
    
    // Find suggested template
    const templateAction = results.find(r => r.actions.some((a: string) => a.startsWith('suggest_template:')));
    if (templateAction) {
      const templateId = templateAction.actions.find((a: string) => a.startsWith('suggest_template:'))?.split(':')[1];
      const template = RESPONSE_TEMPLATES.find(t => t.id === templateId?.toLowerCase() || t.name.toUpperCase().includes(templateId || ''));
      if (template) setSuggestedTemplate(template);
    }
    
    return results;
  }, [userProfile]);
  
  // Load cases from Firebase
  const loadCases = useCallback(async () => {
    if (!userProfile) return;
    
    try {
      const loadedCases = await firebaseService.getEmailCases(userProfile.companyId, {
        status: filters.status !== 'all' ? filters.status : undefined,
        caseType: filters.caseType !== 'all' ? filters.caseType : undefined,
        priority: filters.priority !== 'all' ? filters.priority : undefined
      });
      setCases(loadedCases);
      
      // Load SLA timers
      const timers: Record<string, { deadline: string; status: string; timeRemaining: number }> = {};
      for (const case_ of loadedCases) {
        if (case_.slaDeadline) {
          const deadline = new Date(case_.slaDeadline);
          const now = new Date();
          const timeRemaining = deadline.getTime() - now.getTime();
          timers[case_.id] = {
            deadline: case_.slaDeadline,
            status: case_.slaStatus || 'running',
            timeRemaining: Math.max(0, timeRemaining)
          };
        }
      }
      setSlaTimers(timers);
    } catch (error) {
      console.error('Error loading cases:', error);
    }
  }, [userProfile, filters]);
  
  // Load messages for case
  const loadCaseMessages = useCallback(async (caseId: string) => {
    if (!userProfile) return;
    
    try {
      const loadedMessages = await firebaseService.getEmailCaseMessages(caseId, userProfile.companyId);
      setMessages(loadedMessages);
      
      // Load entities for each message
      const entitiesMap: Record<string, ExtractedEntity[]> = {};
      for (const msg of loadedMessages) {
        const msgEntities = await firebaseService.getEmailEntities(msg.id);
        entitiesMap[msg.id] = msgEntities;
      }
      setEntities(entitiesMap);
    } catch (error) {
      console.error('Error loading case messages:', error);
    }
  }, [userProfile]);
  
  // Find related cases/messages
  const findRelatedCases = useCallback(async (case_: Case) => {
    if (!userProfile) return;
    
    try {
      // Find cases with same order_id, phone, postal, etc.
      const allCases = await firebaseService.getEmailCases(userProfile.companyId);
      const related = allCases.filter(c => 
        c.id !== case_.id && 
        (c.caseType === case_.caseType || c.title.toLowerCase().includes(case_.title.toLowerCase().substring(0, 10)))
      );
      setRelatedCases(related.slice(0, 10)); // Limit to 10
    } catch (error) {
      console.error('Error finding related cases:', error);
    }
  }, [userProfile]);
  
  // Load folders from Microsoft Graph - RECURSIVELY get ALL folders
  const loadFolders = useCallback(async () => {
    if (!isAuthenticated) return;
    
    try {
      const loadedFolders = await microsoftGraphService.getMailFolders();
      
      // Flatten folder structure for easier display
      const flattenFolders = (folders: any[], parentPath: string = ''): any[] => {
        const result: any[] = [];
        folders.forEach(folder => {
          const folderPath = parentPath ? `${parentPath} > ${folder.displayName}` : folder.displayName;
          result.push({
            ...folder,
            name: folder.displayName,
            path: folderPath,
            unread: folder.unreadItemCount || 0,
            total: folder.totalItemCount || 0
          });
          if (folder.childFolders && folder.childFolders.length > 0) {
            result.push(...flattenFolders(folder.childFolders, folderPath));
          }
        });
        return result;
      };
      
      const flattened = flattenFolders(loadedFolders);
      setFolders(flattened);
    } catch (error) {
      console.error('Error loading folders:', error);
    }
  }, [isAuthenticated]);
  
  // Load emails from Microsoft Graph with full processing - LOAD ALL EMAILS
  const loadEmails = useCallback(async (folderId: string = 'inbox') => {
    if (!isAuthenticated || !userProfile?.companyId) return;
    
    try {
      setIsLoading(true);
      
      // Load ALL emails with pagination
      let allEmails: EmailMessage[] = [];
      let skip = 0;
      const batchSize = 100;
      let hasMore = true;
      
      while (hasMore) {
        const batch = await microsoftGraphService.getEmails(folderId, batchSize, skip);
        allEmails = [...allEmails, ...batch];
        
        if (batch.length < batchSize) {
          hasMore = false;
        } else {
          skip += batchSize;
        }
        
        // Safety limit - max 10,000 emails per folder
        if (allEmails.length >= 10000) {
          hasMore = false;
        }
      }
      
      // Store Graph messages for Outlook view
      setGraphMessages(allEmails);
      
      // Process each email for case management
      const processedMessages: Message[] = [];
      
      for (const email of allEmails) {
        try {
          // Extract entities
          const text = email.body.content || email.subject || '';
          const extractedEntities = extractEntities(text, email.id);
          
          // Process rules
          const ruleResults = await processRules(email.subject || '', text);
          
          // Find or create case
          const case_ = await findOrCreateCase(email, extractedEntities);
          
          // Get attachments
          let processedAttachments: Attachment[] = [];
          if (email.hasAttachments && email.attachments) {
            processedAttachments = await processAttachments(email.id, email.attachments);
          }
          
          // Create message object
          const messageData: Omit<EmailCaseMessage, 'id' | 'createdAt'> = {
            threadId: email.id,
            caseId: case_.caseId,
            externalMessageId: email.id,
            fromAddr: email.from?.emailAddress?.address || email.from?.address || '',
            toAddrs: email.toRecipients.map((r: any) => {
              const recipient = r.emailAddress || r;
              return recipient.address || recipient;
            }),
            ccAddrs: email.ccRecipients?.map((r: any) => {
              const recipient = r.emailAddress || r;
              return recipient.address || recipient;
            }) || [],
            bccAddrs: email.bccRecipients?.map((r: any) => {
              const recipient = r.emailAddress || r;
              return recipient.address || recipient;
            }) || [],
            sentAt: undefined,
            receivedAt: email.receivedDateTime,
            subject: email.subject || 'Uten emne',
            snippet: (email.body.content || '').substring(0, 200) || '',
            bodyPlain: email.body.contentType === 'text' ? email.body.content : '',
            bodyHtml: email.body.contentType === 'html' ? email.body.content : '',
            hasAttachments: email.hasAttachments,
            folder: folderId,
            labels: email.categories || [],
            checksum: email.id,
                        isRead: email.isRead
          };
          
          // Save message to Firebase
          const messageId = await firebaseService.createEmailCaseMessage(messageData);
          
          // Save entities to Firebase
          for (const entity of extractedEntities) {
            await firebaseService.createEmailEntity({
              messageId,
              key: entity.key,
              value: entity.value,
              confidence: entity.confidence
            });
          }
          
          processedMessages.push({ id: messageId, ...messageData, createdAt: new Date().toISOString() });
          
          // Store entities and attachments
          setEntities(prev => ({ ...prev, [messageId]: extractedEntities }));
          setAttachments(prev => ({ ...prev, [messageId]: processedAttachments }));
        } catch (error) {
          console.error('Error processing email:', error);
        }
      }
      
      setMessages(processedMessages);
      
      // Reload cases to get updated counts
      await loadCases();
    } catch (error) {
      console.error('Error loading emails:', error);
      setAuthError('Kunne ikke laste e-poster');
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, userProfile, extractEntities, findOrCreateCase, processAttachments, processRules, loadCases]);
  
  // Load rules
  const loadRules = useCallback(async () => {
    if (!userProfile) return;
    
    try {
      const loadedRules = await firebaseService.getEmailRules(userProfile.companyId);
      setRules(loadedRules);
      
      // If no rules exist, create default rules
      if (loadedRules.length === 0) {
        for (const ruleDef of DEFAULT_RULES) {
          await firebaseService.saveEmailRule({
            name: ruleDef.name,
            priority: ruleDef.priority,
            isActive: true,
            definitionJson: ruleDef,
                      });
        }
        // Reload
        const updatedRules = await firebaseService.getEmailRules(userProfile.companyId);
        setRules(updatedRules);
      }
    } catch (error) {
      console.error('Error loading rules:', error);
    }
  }, [userProfile]);
  
  // Update SLA timers in real-time
  useEffect(() => {
    const interval = setInterval(() => {
      setSlaTimers(prev => {
        const updated: typeof prev = {};
        for (const [caseId, timer] of Object.entries(prev)) {
          if (timer.status === 'running') {
            const deadline = new Date(timer.deadline);
            const now = new Date();
            const timeRemaining = deadline.getTime() - now.getTime();
            const newStatus = timeRemaining <= 0 ? 'breached' : timer.status;
            updated[caseId] = {
              ...timer,
              timeRemaining: Math.max(0, timeRemaining),
              status: newStatus
            };
            
            // Update case SLA status if breached
            if (newStatus === 'breached' && timer.status === 'running') {
              const case_ = cases.find(c => c.id === caseId);
              if (case_) {
                firebaseService.updateEmailCase(caseId, { slaStatus: 'breached' });
              }
            }
          } else {
            updated[caseId] = timer;
          }
        }
        return updated;
      });
    }, 1000); // Update every second
    
    return () => clearInterval(interval);
  }, [cases]);
  
  // Initialize authentication and load data
  useEffect(() => {
    const checkAuth = async () => {
      try {
        await microsoftGraphService.initializeMSAL();
        
        // Handle redirect response after authentication
        const account = microsoftGraphService.getCurrentAccount();
        if (account) {
          setIsAuthenticated(true);
          // Load data after successful authentication
          if (userProfile) {
            await loadCases();
            await loadRules();
          }
        }
      } catch (error) {
        console.error('Error checking auth:', error);
      }
    };
    
    checkAuth();
  }, [userProfile?.companyId, loadCases, loadRules]);
  
  // Load ALL data from Microsoft Graph when authenticated
  const loadAllData = useCallback(async () => {
    if (!isAuthenticated || !userProfile?.companyId) return;
    
    try {
      setIsLoading(true);
      
      // Load all data in parallel
      await Promise.all([
        loadFolders(),
        loadCases(),
        loadRules(),
        loadEmails(selectedFolder),
        loadAllContacts(),
        loadAllCalendarEvents(),
        loadAllOneDriveItems()
      ]);
    } catch (error) {
      console.error('Error loading all data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, userProfile?.companyId, selectedFolder, loadFolders, loadCases, loadRules, loadEmails]);
  
  // Load all contacts
  const loadAllContacts = useCallback(async () => {
    if (!isAuthenticated) return;
    
    try {
      let allContacts: any[] = [];
      let skip = 0;
      const batchSize = 100;
      let hasMore = true;
      
      while (hasMore) {
        const batch = await microsoftGraphService.getContacts(batchSize, skip);
        allContacts = [...allContacts, ...batch];
        
        if (batch.length < batchSize) {
          hasMore = false;
        } else {
          skip += batchSize;
        }
      }
      
      setContacts(allContacts);
    } catch (error) {
      console.error('Error loading contacts:', error);
    }
  }, [isAuthenticated]);
  
  // Load all calendar events (next 90 days)
  const loadAllCalendarEvents = useCallback(async () => {
    if (!isAuthenticated) return;
    
    try {
      const startDate = new Date().toISOString();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 90);
      const endDateISO = endDate.toISOString();
      
      const events = await microsoftGraphService.getCalendarEvents(startDate, endDateISO);
      setCalendarEvents(events);
    } catch (error) {
      console.error('Error loading calendar events:', error);
    }
  }, [isAuthenticated]);
  
  // Load all OneDrive items
  const loadAllOneDriveItems = useCallback(async () => {
    if (!isAuthenticated) return;
    
    try {
      const items = await microsoftGraphService.getOneDriveItems('root', 500);
      setOneDriveItems(items);
    } catch (error) {
      console.error('Error loading OneDrive items:', error);
    }
  }, [isAuthenticated]);
  
  // Load folders, cases and rules when authenticated
  useEffect(() => {
    if (isAuthenticated && userProfile?.companyId) {
      loadAllData();
    }
  }, [isAuthenticated, userProfile?.companyId, loadAllData]);
  
  // Auto-refresh data every 30 seconds
  useEffect(() => {
    if (!isAuthenticated || !userProfile?.companyId) return;
    
    const refreshInterval = setInterval(() => {
      // Refresh folders and emails silently (don't show loading state)
      loadFolders();
      loadEmails(selectedFolder);
    }, 30000); // 30 seconds
    
    return () => clearInterval(refreshInterval);
  }, [isAuthenticated, userProfile?.companyId, selectedFolder, loadFolders, loadEmails]);
  
  // Load emails when folder changes
  useEffect(() => {
    if (isAuthenticated && selectedFolder) {
      loadEmails(selectedFolder);
    }
  }, [isAuthenticated, selectedFolder, loadEmails]);
  
  // Reload cases when filters change
  useEffect(() => {
    if (isAuthenticated && userProfile?.companyId) {
      loadCases();
    }
  }, [filters, isAuthenticated, userProfile?.companyId, loadCases]);
  
  // Load case messages when case is selected
  useEffect(() => {
    if (selectedCase) {
      loadCaseMessages(selectedCase.id);
      findRelatedCases(selectedCase);
    }
  }, [selectedCase, loadCaseMessages, findRelatedCases]);
  
  // Handle sign in
  const handleSignIn = async () => {
    try {
      setIsAuthenticating(true);
      setAuthError(null);
      
      // signIn with redirect will navigate away, so we don't need to wait
      await microsoftGraphService.signIn();
      
      // If we get here, redirect didn't happen (shouldn't happen)
      // After redirect, the page will reload and checkAuth will run
    } catch (error: any) {
      console.error('Error signing in:', error);
      
      // Provide helpful error message
      if (error.message?.includes('AADSTS9002326')) {
        setAuthError('Appen må være konfigurert som "Web" platform type i Azure Portal, ikke "SPA". Redirect URI: http://localhost:3000/dashboard/email-system');
      } else {
        setAuthError(error.message || 'Innlogging mislyktes');
      }
      setIsAuthenticating(false);
    }
  };
  
  // Handle sign out
  const handleSignOut = async () => {
    try {
      await microsoftGraphService.signOut();
      setIsAuthenticated(false);
      setCases([]);
      setMessages([]);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };
  
  // Filter cases
  const filteredCases = cases.filter(case_ => {
    if (filters.status !== 'all' && case_.status !== filters.status) return false;
    if (filters.caseType !== 'all' && case_.caseType !== filters.caseType) return false;
    if (filters.priority !== 'all' && case_.priority !== filters.priority) return false;
    if (filters.slaStatus !== 'all' && case_.slaStatus !== filters.slaStatus) return false;
    if (searchQuery && !case_.title.toLowerCase().includes(searchQuery.toLowerCase()) && 
        !case_.caseId.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });
  
  // Filter messages
  const filteredMessages = messages.filter(msg => {
    if (selectedCase && msg.caseId !== selectedCase.caseId) return false;
    if (searchQuery && !msg.subject.toLowerCase().includes(searchQuery.toLowerCase()) && 
        !msg.snippet.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });
  
  // Get case type label
  const getCaseTypeLabel = (type: CaseType): string => {
    const labels: Record<CaseType, string> = {
      leveringsstatus: 'Leveringsstatus',
      endring_kundeinfo: 'Endring kundeinfo',
      retur: 'Retur',
      montering: 'Montering',
      firemann: '4-mann oppdrag',
      kansellering: 'Kansellering',
      butikkhenting_pp: 'Butikkhenting/P&P',
      utlevering: 'Utlevering',
      nextday: 'NextDay',
      hub_ruter: 'HUB/Ruter',
      utenfor_sortiment: 'Utenfor sortiment',
      skade_avvik: 'Skade/Avvik',
      other: 'Annet'
    };
    return labels[type] || 'Annet';
  };
  
  // Get priority color
  const getPriorityColor = (priority: string): string => {
    const colors: Record<string, string> = {
      low: 'var(--gray-500)',
      medium: 'var(--blue-500)',
      high: 'var(--orange-500)',
      urgent: 'var(--red-500)'
    };
    return colors[priority] || 'var(--gray-500)';
  };
  
  // Get status color
  const getStatusColor = (status: string): string => {
    const colors: Record<string, string> = {
      open: 'var(--blue-500)',
      in_progress: 'var(--orange-500)',
      pending: 'var(--yellow-500)',
      resolved: 'var(--green-500)',
      closed: 'var(--gray-500)'
    };
    return colors[status] || 'var(--gray-500)';
  };
  
  if (!isAuthenticated) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--background-color)',
        padding: '2rem'
      }}>
        <div className="card" style={{ maxWidth: '500px', width: '100%', padding: '2rem', textAlign: 'center' }}>
          <Mail size={48} style={{ color: 'var(--primary)', marginBottom: '1rem' }} />
          <h1 style={{ fontSize: 'var(--font-size-2xl)', fontWeight: '700', color: 'var(--text-color)', marginBottom: '0.5rem' }}>
            MAVI Smart E-post System
          </h1>
          <p style={{ color: 'var(--gray-500)', marginBottom: '2rem' }}>
            Logg inn med Microsoft 365 for å få tilgang til e-postsystemet
          </p>
          {authError && (
            <div style={{
              padding: '1rem',
              background: 'var(--red-50)',
              border: '1px solid var(--red-200)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--red-700)',
              marginBottom: '1rem'
            }}>
              {authError}
            </div>
          )}
          <button
            onClick={handleSignIn}
            disabled={isAuthenticating}
            className="btn btn-primary"
            style={{ width: '100%' }}
          >
            {isAuthenticating ? 'Logger inn...' : 'Logg inn med Microsoft 365'}
          </button>
        </div>
      </div>
    );
  }
  
  // Filter messages based on search and filters
  const filteredGraphMessages = graphMessages.filter(msg => {
    if (filters.unreadOnly && msg.isRead) return false;
    if (filters.hasAttachments && !msg.hasAttachments) return false;
    if (filters.importance !== 'all' && msg.importance !== filters.importance) return false;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesSubject = msg.subject?.toLowerCase().includes(query);
      const matchesFrom = msg.from?.name?.toLowerCase().includes(query) || msg.from?.address?.toLowerCase().includes(query);
      const matchesBody = msg.body?.content?.toLowerCase().includes(query);
      if (!matchesSubject && !matchesFrom && !matchesBody) return false;
    }
    return true;
  });
  
  // Handle message selection
  const handleMessageSelect = async (message: any) => {
    // Hent full e-post med attachments
    try {
      const fullMessage = await microsoftGraphService.getEmail(message.id);
      setSelectedGraphMessage(fullMessage);
      setSelectedMessage(fullMessage);
      
      // Mark as read (if setting is enabled)
      const settings = JSON.parse(localStorage.getItem('emailSettings') || '{}');
      if (!fullMessage.isRead && settings.autoMarkAsRead !== false) {
        await microsoftGraphService.markAsRead(message.id, true);
        // Update local state
        setGraphMessages(prev => prev.map(m => 
          m.id === message.id ? { ...m, isRead: true } : m
        ));
      }
    } catch (error) {
      console.error('Error loading full email:', error);
      // Fallback to basic message
      setSelectedGraphMessage(message);
      setSelectedMessage(message);
    }
  };
  
  // Handle compose send
  const handleComposeSend = async (emailData: {
    to: string[];
    cc?: string[];
    bcc?: string[];
    subject: string;
    body: string;
    bodyType: 'text' | 'html';
    attachments?: File[];
    importance?: 'low' | 'normal' | 'high';
  }) => {
    try {
      await microsoftGraphService.sendEmail({
        toRecipients: emailData.to,
        ccRecipients: emailData.cc,
        bccRecipients: emailData.bcc,
        subject: emailData.subject,
        body: emailData.body,
        bodyType: emailData.bodyType,
        importance: emailData.importance,
        attachments: emailData.attachments
      });
      
      // Reload sent folder or current folder
      if (selectedFolder === 'sent') {
        await loadEmails('sent');
      } else {
        await loadEmails(selectedFolder);
      }
      
      alert('E-post sendt!');
    } catch (error) {
      console.error('Error sending email:', error);
      alert('Kunne ikke sende e-post. Prøv igjen.');
      throw error;
    }
  };
  
  // Email actions
  const handleArchiveEmail = async (emailId: string) => {
    try {
      await microsoftGraphService.archiveEmail(emailId);
      await loadEmails(selectedFolder);
      if (selectedGraphMessage?.id === emailId) {
        setSelectedGraphMessage(null);
      }
    } catch (error) {
      console.error('Error archiving email:', error);
      alert('Kunne ikke arkivere e-post');
    }
  };
  
  const handleDeleteEmail = async (emailId: string) => {
    if (!confirm('Er du sikker på at du vil slette denne e-posten?')) return;
    
    try {
      await microsoftGraphService.deleteEmail(emailId);
      await loadEmails(selectedFolder);
      if (selectedGraphMessage?.id === emailId) {
        setSelectedGraphMessage(null);
      }
    } catch (error) {
      console.error('Error deleting email:', error);
      alert('Kunne ikke slette e-post');
    }
  };
  
  const handleMoveEmail = async (emailId: string, destinationFolderId: string) => {
    try {
      await microsoftGraphService.moveEmail(emailId, destinationFolderId);
      await loadEmails(selectedFolder);
      if (selectedGraphMessage?.id === emailId) {
        setSelectedGraphMessage(null);
      }
    } catch (error) {
      console.error('Error moving email:', error);
      alert('Kunne ikke flytte e-post');
    }
  };
  
  const handleCategorizeEmail = async (emailId: string, categories: string[]) => {
    try {
      await microsoftGraphService.categorizeEmail(emailId, categories);
      await loadEmails(selectedFolder);
    } catch (error) {
      console.error('Error categorizing email:', error);
      alert('Kunne ikke kategorisere e-post');
    }
  };
  
  const handleFlagEmail = async (emailId: string, flagStatus: 'flagged' | 'complete' | 'notFlagged') => {
    try {
      await microsoftGraphService.flagEmail(emailId, { flagStatus });
      await loadEmails(selectedFolder);
    } catch (error) {
      console.error('Error flagging email:', error);
      alert('Kunne ikke flagge e-post');
    }
  };
  
  const handleStarEmail = async (emailId: string, isStarred: boolean) => {
    try {
      await microsoftGraphService.starEmail(emailId, isStarred);
      await loadEmails(selectedFolder);
    } catch (error) {
      console.error('Error starring email:', error);
      alert('Kunne ikke markere e-post');
    }
  };
  
  const handleBatchAction = async (action: 'delete' | 'archive' | 'markRead' | 'markUnread', emailIds: string[]) => {
    try {
      if (action === 'delete') {
        await Promise.all(emailIds.map(id => microsoftGraphService.deleteEmail(id)));
      } else if (action === 'archive') {
        await Promise.all(emailIds.map(id => microsoftGraphService.archiveEmail(id)));
      } else if (action === 'markRead') {
        await microsoftGraphService.batchUpdateEmails(emailIds, { isRead: true });
      } else if (action === 'markUnread') {
        await microsoftGraphService.batchUpdateEmails(emailIds, { isRead: false });
      }
      await loadEmails(selectedFolder);
      setSelectedEmails(new Set());
    } catch (error) {
      console.error('Error performing batch action:', error);
      alert('Kunne ikke utføre handling');
    }
  };
  
  return (
    <div style={{
      height: 'calc(100vh - 64px)', // Full height minus topbar
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* View Toggle - Outlook vs Cases */}
      <div style={{
        padding: '0.5rem 1rem',
        background: 'var(--card-background)',
        borderBottom: '1px solid var(--border-color)',
        display: 'flex',
        gap: '0.5rem',
        alignItems: 'center'
      }}>
        <button
          onClick={() => setActiveView('outlook')}
          style={{
            padding: '0.5rem 1rem',
            background: activeView === 'outlook' ? 'var(--primary)' : 'transparent',
            color: activeView === 'outlook' ? 'white' : 'var(--text-color)',
            border: 'none',
            borderRadius: 'var(--radius-md)',
            cursor: 'pointer',
            fontSize: 'var(--font-size-sm)',
            fontWeight: '500'
          }}
        >
          <Mail size={16} style={{ marginRight: '0.5rem', display: 'inline' }} />
          Outlook ({graphMessages.length})
        </button>
        <button
          onClick={() => setActiveView('contacts')}
          style={{
            padding: '0.5rem 1rem',
            background: activeView === 'contacts' ? 'var(--primary)' : 'transparent',
            color: activeView === 'contacts' ? 'white' : 'var(--text-color)',
            border: 'none',
            borderRadius: 'var(--radius-md)',
            cursor: 'pointer',
            fontSize: 'var(--font-size-sm)',
            fontWeight: '500'
          }}
        >
          <Users size={16} style={{ marginRight: '0.5rem', display: 'inline' }} />
          Kontakter ({contacts.length})
        </button>
        <button
          onClick={() => setActiveView('calendar')}
          style={{
            padding: '0.5rem 1rem',
            background: activeView === 'calendar' ? 'var(--primary)' : 'transparent',
            color: activeView === 'calendar' ? 'white' : 'var(--text-color)',
            border: 'none',
            borderRadius: 'var(--radius-md)',
            cursor: 'pointer',
            fontSize: 'var(--font-size-sm)',
            fontWeight: '500'
          }}
        >
          <Calendar size={16} style={{ marginRight: '0.5rem', display: 'inline' }} />
          Kalender ({calendarEvents.length})
        </button>
        <button
          onClick={() => setActiveView('onedrive')}
          style={{
            padding: '0.5rem 1rem',
            background: activeView === 'onedrive' ? 'var(--primary)' : 'transparent',
            color: activeView === 'onedrive' ? 'white' : 'var(--text-color)',
            border: 'none',
            borderRadius: 'var(--radius-md)',
            cursor: 'pointer',
            fontSize: 'var(--font-size-sm)',
            fontWeight: '500'
          }}
        >
          <Folder size={16} style={{ marginRight: '0.5rem', display: 'inline' }} />
          OneDrive ({oneDriveItems.length})
        </button>
        <button
          onClick={() => setActiveView('cases')}
          style={{
            padding: '0.5rem 1rem',
            background: activeView === 'cases' ? 'var(--primary)' : 'transparent',
            color: activeView === 'cases' ? 'white' : 'var(--text-color)',
            border: 'none',
            borderRadius: 'var(--radius-md)',
            cursor: 'pointer',
            fontSize: 'var(--font-size-sm)',
            fontWeight: '500'
          }}
        >
          <FileText size={16} style={{ marginRight: '0.5rem', display: 'inline' }} />
          Saker ({cases.length})
        </button>
        <button
          onClick={() => setActiveView('rules')}
          style={{
            padding: '0.5rem 1rem',
            background: activeView === 'rules' ? 'var(--primary)' : 'transparent',
            color: activeView === 'rules' ? 'white' : 'var(--text-color)',
            border: 'none',
            borderRadius: 'var(--radius-md)',
            cursor: 'pointer',
            fontSize: 'var(--font-size-sm)',
            fontWeight: '500'
          }}
        >
          <Settings size={16} style={{ marginRight: '0.5rem', display: 'inline' }} />
          Regler
        </button>
        <button
          onClick={() => setActiveView('templates')}
          style={{
            padding: '0.5rem 1rem',
            background: activeView === 'templates' ? 'var(--primary)' : 'transparent',
            color: activeView === 'templates' ? 'white' : 'var(--text-color)',
            border: 'none',
            borderRadius: 'var(--radius-md)',
            cursor: 'pointer',
            fontSize: 'var(--font-size-sm)',
            fontWeight: '500'
          }}
        >
          <FileText size={16} style={{ marginRight: '0.5rem', display: 'inline' }} />
          Maler
        </button>
        <button
          onClick={() => setActiveView('analytics')}
          style={{
            padding: '0.5rem 1rem',
            background: activeView === 'analytics' ? 'var(--primary)' : 'transparent',
            color: activeView === 'analytics' ? 'white' : 'var(--text-color)',
            border: 'none',
            borderRadius: 'var(--radius-md)',
            cursor: 'pointer',
            fontSize: 'var(--font-size-sm)',
            fontWeight: '500'
          }}
        >
          <BarChart3 size={16} style={{ marginRight: '0.5rem', display: 'inline' }} />
          Analytikk
        </button>
        <button
          onClick={() => setActiveView('settings')}
          style={{
            padding: '0.5rem 1rem',
            background: activeView === 'settings' ? 'var(--primary)' : 'transparent',
            color: activeView === 'settings' ? 'white' : 'var(--text-color)',
            border: 'none',
            borderRadius: 'var(--radius-md)',
            cursor: 'pointer',
            fontSize: 'var(--font-size-sm)',
            fontWeight: '500'
          }}
        >
          <Settings size={16} style={{ marginRight: '0.5rem', display: 'inline' }} />
          Innstillinger
        </button>
        
        <div style={{ flex: 1 }} />
        
        <button
          onClick={handleSignOut}
          className="btn btn-secondary"
          style={{ fontSize: 'var(--font-size-sm)', padding: '0.5rem 1rem' }}
        >
          Logg ut
        </button>
      </div>
      
      {/* Outlook View */}
      {activeView === 'outlook' && (
        <OutlookLayout
          folders={folders}
          selectedFolder={selectedFolder}
          onFolderSelect={(folderId) => {
            setSelectedFolder(folderId);
            setSelectedGraphMessage(null);
          }}
          messages={filteredGraphMessages}
          selectedMessage={selectedGraphMessage}
          onMessageSelect={handleMessageSelect}
          onCompose={() => {
            setComposeData({
              to: '',
              cc: '',
              bcc: '',
              subject: '',
              body: '',
              templateId: '',
              caseId: selectedCase?.caseId || ''
            });
            setShowCompose(true);
          }}
          onRefresh={() => loadAllData()}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          isLoading={isLoading}
          onArchive={handleArchiveEmail}
          onDelete={handleDeleteEmail}
          onMove={handleMoveEmail}
          onCategorize={handleCategorizeEmail}
          onFlag={handleFlagEmail}
          onStar={handleStarEmail}
          onBatchAction={(action, emailIds) => handleBatchAction(action as 'delete' | 'archive' | 'markRead' | 'markUnread', emailIds)}
          selectedEmails={selectedEmails}
          onEmailSelect={(emailId, selected) => {
            const newSelected = new Set(selectedEmails);
            if (selected) {
              newSelected.add(emailId);
            } else {
              newSelected.delete(emailId);
            }
            setSelectedEmails(newSelected);
          }}
        />
      )}
      
      {/* Contacts View */}
      {activeView === 'contacts' && (
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          background: 'var(--background-color)',
          overflow: 'hidden'
        }}>
          {/* Toolbar */}
          <div style={{
            padding: '1rem 1.5rem',
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            flexWrap: 'wrap'
          }}>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Search size={18} style={{ color: 'var(--gray-400)' }} />
              <input
                type="text"
                placeholder="Søk i kontakter..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  flex: 1,
                  padding: '0.5rem',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--surface-color)',
                  color: 'var(--text-color)',
                  fontSize: 'var(--font-size-sm)'
                }}
              />
            </div>
            <button
              onClick={() => {
                // TODO: Add new contact
              }}
              className="btn btn-primary"
              style={{ fontSize: 'var(--font-size-sm)', padding: '0.5rem 1rem' }}
            >
              <Plus size={16} style={{ marginRight: '0.5rem', display: 'inline' }} />
              Ny kontakt
            </button>
            <button
              onClick={() => loadAllContacts()}
              disabled={isLoading}
              style={{
                padding: '0.5rem',
                background: 'transparent',
                border: 'none',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                color: 'var(--text-color)',
                borderRadius: 'var(--radius-md)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              title="Oppdater"
            >
              <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />
            </button>
          </div>
          
          {/* Contacts List */}
          <div style={{
            flex: 1,
            overflow: 'auto',
            padding: '1rem'
          }}>
            {isLoading ? (
              <div style={{ textAlign: 'center', padding: '3rem' }}>
                <RefreshCw size={32} className="animate-spin" style={{ color: 'var(--primary)', marginBottom: '1rem' }} />
                <p style={{ color: 'var(--gray-500)' }}>Laster kontakter...</p>
              </div>
            ) : contacts.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem' }}>
                <Users size={48} style={{ color: 'var(--gray-400)', marginBottom: '1rem' }} />
                <p style={{ color: 'var(--gray-500)' }}>Ingen kontakter funnet</p>
              </div>
            ) : (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                gap: '1rem'
              }}>
                {contacts
                  .filter(contact => {
                    if (!searchQuery) return true;
                    const query = searchQuery.toLowerCase();
                    return (
                      contact.displayName?.toLowerCase().includes(query) ||
                      contact.emailAddresses?.some((e: any) => e.address?.toLowerCase().includes(query)) ||
                      contact.businessPhones?.some((p: any) => p?.includes(query)) ||
                      contact.mobilePhone?.toLowerCase().includes(query)
                    );
                  })
                  .map(contact => (
                    <div
                      key={contact.id}
                      className="card"
                      style={{
                        padding: '1rem',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        border: selectedContacts.has(contact.id) ? '2px solid var(--primary)' : '1px solid var(--border-color)'
                      }}
                      onClick={() => {
                        const newSelected = new Set(selectedContacts);
                        if (newSelected.has(contact.id)) {
                          newSelected.delete(contact.id);
                        } else {
                          newSelected.add(contact.id);
                        }
                        setSelectedContacts(newSelected);
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                        <div style={{
                          width: '48px',
                          height: '48px',
                          borderRadius: '50%',
                          background: 'var(--primary)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'white',
                          fontSize: 'var(--font-size-lg)',
                          fontWeight: '600',
                          flexShrink: 0
                        }}>
                          {contact.displayName?.charAt(0)?.toUpperCase() || '?'}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <h3 style={{
                            fontSize: 'var(--font-size-base)',
                            fontWeight: '600',
                            color: 'var(--text-color)',
                            marginBottom: '0.25rem',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}>
                            {contact.displayName || 'Uten navn'}
                          </h3>
                          {contact.emailAddresses && contact.emailAddresses.length > 0 && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                              <Mail size={14} style={{ color: 'var(--gray-400)', flexShrink: 0 }} />
                              <span style={{
                                fontSize: 'var(--font-size-sm)',
                                color: 'var(--gray-600)',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap'
                              }}>
                                {contact.emailAddresses[0].address}
                              </span>
                            </div>
                          )}
                          {(contact.businessPhones && contact.businessPhones.length > 0) || contact.mobilePhone ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <Phone size={14} style={{ color: 'var(--gray-400)', flexShrink: 0 }} />
                              <span style={{
                                fontSize: 'var(--font-size-sm)',
                                color: 'var(--gray-600)'
                              }}>
                                {contact.mobilePhone || contact.businessPhones?.[0] || ''}
                              </span>
                            </div>
                          ) : null}
                          {contact.companyName && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
                              <Building size={14} style={{ color: 'var(--gray-400)', flexShrink: 0 }} />
                              <span style={{
                                fontSize: 'var(--font-size-sm)',
                                color: 'var(--gray-600)'
                              }}>
                                {contact.companyName}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Calendar View */}
      {activeView === 'calendar' && (
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          background: 'var(--background-color)',
          overflow: 'hidden'
        }}>
          {/* Toolbar */}
          <div style={{
            padding: '1rem 1.5rem',
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            flexWrap: 'wrap'
          }}>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Search size={18} style={{ color: 'var(--gray-400)' }} />
              <input
                type="text"
                placeholder="Søk i kalender..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  flex: 1,
                  padding: '0.5rem',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--surface-color)',
                  color: 'var(--text-color)',
                  fontSize: 'var(--font-size-sm)'
                }}
              />
            </div>
            <button
              onClick={() => {
                // TODO: Add new event
              }}
              className="btn btn-primary"
              style={{ fontSize: 'var(--font-size-sm)', padding: '0.5rem 1rem' }}
            >
              <Plus size={16} style={{ marginRight: '0.5rem', display: 'inline' }} />
              Ny hendelse
            </button>
            <button
              onClick={() => loadAllCalendarEvents()}
              disabled={isLoading}
              style={{
                padding: '0.5rem',
                background: 'transparent',
                border: 'none',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                color: 'var(--text-color)',
                borderRadius: 'var(--radius-md)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              title="Oppdater"
            >
              <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />
            </button>
          </div>
          
          {/* Calendar Events List */}
          <div style={{
            flex: 1,
            overflow: 'auto',
            padding: '1rem'
          }}>
            {isLoading ? (
              <div style={{ textAlign: 'center', padding: '3rem' }}>
                <RefreshCw size={32} className="animate-spin" style={{ color: 'var(--primary)', marginBottom: '1rem' }} />
                <p style={{ color: 'var(--gray-500)' }}>Laster kalender...</p>
              </div>
            ) : calendarEvents.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem' }}>
                <Calendar size={48} style={{ color: 'var(--gray-400)', marginBottom: '1rem' }} />
                <p style={{ color: 'var(--gray-500)' }}>Ingen hendelser funnet</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {calendarEvents
                  .filter(event => {
                    if (!searchQuery) return true;
                    const query = searchQuery.toLowerCase();
                    return (
                      event.subject?.toLowerCase().includes(query) ||
                      event.body?.content?.toLowerCase().includes(query) ||
                      event.location?.displayName?.toLowerCase().includes(query) ||
                      event.attendees?.some((a: any) => a.emailAddress?.address?.toLowerCase().includes(query))
                    );
                  })
                  .sort((a, b) => {
                    const aStart = a.start?.dateTime ? new Date(a.start.dateTime).getTime() : 0;
                    const bStart = b.start?.dateTime ? new Date(b.start.dateTime).getTime() : 0;
                    return aStart - bStart;
                  })
                  .map(event => (
                    <div
                      key={event.id}
                      className="card"
                      style={{
                        padding: '1rem',
                        borderLeft: '4px solid var(--primary)',
                        transition: 'all 0.2s'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                        <div style={{
                          padding: '0.5rem',
                          background: 'var(--primary)20',
                          borderRadius: 'var(--radius-md)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0
                        }}>
                          <Calendar size={20} style={{ color: 'var(--primary)' }} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <h3 style={{
                            fontSize: 'var(--font-size-base)',
                            fontWeight: '600',
                            color: 'var(--text-color)',
                            marginBottom: '0.5rem'
                          }}>
                            {event.subject || 'Uten emne'}
                          </h3>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: 'var(--font-size-sm)', color: 'var(--gray-600)' }}>
                            {event.start?.dateTime && (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <Clock size={14} style={{ color: 'var(--gray-400)', flexShrink: 0 }} />
                                <span>
                                  {new Date(event.start.dateTime).toLocaleString('no-NO', {
                                    weekday: 'long',
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                  {event.end?.dateTime && (
                                    <> - {new Date(event.end.dateTime).toLocaleTimeString('no-NO', { hour: '2-digit', minute: '2-digit' })}</>
                                  )}
                                </span>
                              </div>
                            )}
                            {event.location?.displayName && (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <MapPin size={14} style={{ color: 'var(--gray-400)', flexShrink: 0 }} />
                                <span>{event.location.displayName}</span>
                              </div>
                            )}
                            {event.attendees && event.attendees.length > 0 && (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <Users size={14} style={{ color: 'var(--gray-400)', flexShrink: 0 }} />
                                <span>
                                  {event.attendees.length} {event.attendees.length === 1 ? 'deltaker' : 'deltakere'}
                                </span>
                              </div>
                            )}
                            {event.bodyPreview && (
                              <p style={{ marginTop: '0.5rem', color: 'var(--gray-500)' }}>
                                {event.bodyPreview.substring(0, 200)}
                                {event.bodyPreview.length > 200 ? '...' : ''}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* OneDrive View */}
      {activeView === 'onedrive' && (
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          background: 'var(--background-color)',
          overflow: 'hidden'
        }}>
          {/* Toolbar */}
          <div style={{
            padding: '1rem 1.5rem',
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            flexWrap: 'wrap'
          }}>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Search size={18} style={{ color: 'var(--gray-400)' }} />
              <input
                type="text"
                placeholder="Søk i OneDrive..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  flex: 1,
                  padding: '0.5rem',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--surface-color)',
                  color: 'var(--text-color)',
                  fontSize: 'var(--font-size-sm)'
                }}
              />
            </div>
            <button
              onClick={() => loadAllOneDriveItems()}
              disabled={isLoading}
              style={{
                padding: '0.5rem',
                background: 'transparent',
                border: 'none',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                color: 'var(--text-color)',
                borderRadius: 'var(--radius-md)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              title="Oppdater"
            >
              <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />
            </button>
          </div>
          
          {/* OneDrive Items List */}
          <div style={{
            flex: 1,
            overflow: 'auto',
            padding: '1rem'
          }}>
            {isLoading ? (
              <div style={{ textAlign: 'center', padding: '3rem' }}>
                <RefreshCw size={32} className="animate-spin" style={{ color: 'var(--primary)', marginBottom: '1rem' }} />
                <p style={{ color: 'var(--gray-500)' }}>Laster OneDrive...</p>
              </div>
            ) : oneDriveItems.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem' }}>
                <Folder size={48} style={{ color: 'var(--gray-400)', marginBottom: '1rem' }} />
                <p style={{ color: 'var(--gray-500)' }}>Ingen filer eller mapper funnet</p>
              </div>
            ) : (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                gap: '1rem'
              }}>
                {oneDriveItems
                  .filter(item => {
                    if (!searchQuery) return true;
                    const query = searchQuery.toLowerCase();
                    return (
                      item.name?.toLowerCase().includes(query) ||
                      item.webUrl?.toLowerCase().includes(query)
                    );
                  })
                  .map(item => (
                    <div
                      key={item.id}
                      className="card"
                      style={{
                        padding: '1rem',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        textAlign: 'center'
                      }}
                      onClick={() => {
                        if (item.webUrl) {
                          window.open(item.webUrl, '_blank');
                        }
                      }}
                    >
                      <div style={{
                        fontSize: '48px',
                        marginBottom: '0.5rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        {item.folder ? (
                          <FolderOpen size={48} style={{ color: 'var(--primary)' }} />
                        ) : (
                          <FileText size={48} style={{ color: 'var(--gray-400)' }} />
                        )}
                      </div>
                      <h3 style={{
                        fontSize: 'var(--font-size-sm)',
                        fontWeight: '600',
                        color: 'var(--text-color)',
                        marginBottom: '0.25rem',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        {item.name || 'Uten navn'}
                      </h3>
                      {item.size && (
                        <p style={{
                          fontSize: 'var(--font-size-xs)',
                          color: 'var(--gray-500)'
                        }}>
                          {(item.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      )}
                      {item.lastModifiedDateTime && (
                        <p style={{
                          fontSize: 'var(--font-size-xs)',
                          color: 'var(--gray-500)'
                        }}>
                          {new Date(item.lastModifiedDateTime).toLocaleDateString('no-NO')}
                        </p>
                      )}
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Cases View */}
      {activeView === 'cases' && (
        <div style={{
          flex: 1,
          overflow: 'auto',
          padding: '1.5rem',
          background: 'var(--background-color)'
        }}>
          <div>
              {isLoading ? (
                <div style={{ textAlign: 'center', padding: '3rem' }}>
                  <RefreshCw size={32} className="animate-spin" style={{ color: 'var(--primary)', marginBottom: '1rem' }} />
                  <p style={{ color: 'var(--gray-500)' }}>Laster saker...</p>
                </div>
              ) : filteredCases.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem' }}>
                  <FileText size={48} style={{ color: 'var(--gray-400)', marginBottom: '1rem' }} />
                  <p style={{ color: 'var(--gray-500)' }}>Ingen saker funnet</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {filteredCases.map(case_ => (
                    <div
                      key={case_.id}
                      className="card"
                      style={{
                        padding: '1.5rem',
                        cursor: 'pointer',
                        border: selectedCase?.id === case_.id ? '2px solid var(--primary)' : '1px solid var(--border-color)',
                        transition: 'all 0.2s'
                      }}
                      onClick={() => {
                        setSelectedCase(case_);
                        setShowCaseModal(true);
                      }}
                      onDoubleClick={() => {
                        setSelectedCase(case_);
                        setShowCaseModal(true);
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
                            <h3 style={{
                              fontSize: 'var(--font-size-lg)',
                              fontWeight: '600',
                              color: 'var(--text-color)'
                            }}>
                              {case_.title}
                            </h3>
                            <span style={{
                              padding: '0.25rem 0.75rem',
                              background: 'var(--gray-100)',
                              borderRadius: 'var(--radius-full)',
                              fontSize: 'var(--font-size-xs)',
                              fontFamily: 'monospace',
                              color: 'var(--gray-700)'
                            }}>
                              {case_.caseId}
                            </span>
                          </div>
                          
                          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
                            <span style={{
                              padding: '0.25rem 0.75rem',
                              background: `${getStatusColor(case_.status)}20`,
                              color: getStatusColor(case_.status),
                              borderRadius: 'var(--radius-full)',
                              fontSize: 'var(--font-size-xs)',
                              fontWeight: '500'
                            }}>
                              {case_.status === 'open' ? 'Åpen' : 
                               case_.status === 'in_progress' ? 'Pågår' :
                               case_.status === 'pending' ? 'Venter' :
                               case_.status === 'resolved' ? 'Løst' : 'Lukket'}
                            </span>
                            
                            <span style={{
                              padding: '0.25rem 0.75rem',
                              background: `${getPriorityColor(case_.priority)}20`,
                              color: getPriorityColor(case_.priority),
                              borderRadius: 'var(--radius-full)',
                              fontSize: 'var(--font-size-xs)',
                              fontWeight: '500'
                            }}>
                              {case_.priority === 'low' ? 'Lav' :
                               case_.priority === 'medium' ? 'Middels' :
                               case_.priority === 'high' ? 'Høy' : 'Haster'}
                            </span>
                            
                            <span style={{
                              padding: '0.25rem 0.75rem',
                              background: 'var(--blue-100)',
                              color: 'var(--blue-700)',
                              borderRadius: 'var(--radius-full)',
                              fontSize: 'var(--font-size-xs)',
                              fontWeight: '500'
                            }}>
                              {getCaseTypeLabel(case_.caseType as CaseType)}
                            </span>
                            
                            {case_.slaStatus === 'breached' && (
                              <span style={{
                                padding: '0.25rem 0.75rem',
                                background: 'var(--red-100)',
                                color: 'var(--red-700)',
                                borderRadius: 'var(--radius-full)',
                                fontSize: 'var(--font-size-xs)',
                                fontWeight: '500',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.25rem'
                              }}>
                                <AlertTriangle size={12} />
                                SLA-brudd
                              </span>
                            )}
                          </div>
                          
                          <div style={{ display: 'flex', gap: '2rem', fontSize: 'var(--font-size-sm)', color: 'var(--gray-500)' }}>
                            <span>{case_.messageCount} meldinger</span>
                            <span>{case_.threadCount} tråder</span>
                            <span>Opprettet: {new Date(case_.createdAt).toLocaleDateString('no-NO')}</span>
                            {case_.slaDeadline && (
                              <span>
                                SLA: {new Date(case_.slaDeadline).toLocaleString('no-NO')}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
          </div>
        </div>
      )}
      
      {/* Settings View */}
      {activeView === 'settings' && (
        <EmailSettingsView 
          userProfile={userProfile}
          onSave={(settings) => {
            localStorage.setItem('emailSettings', JSON.stringify(settings));
            alert('Innstillinger lagret!');
          }}
        />
      )}
      
      {/* Rules, Templates, Analytics views - placeholder for now */}
      {(activeView === 'rules' || activeView === 'templates' || activeView === 'analytics') && (
        <div style={{
          flex: 1,
          overflow: 'auto',
          padding: '1.5rem',
          background: 'var(--background-color)'
        }}>
          <h2 style={{
            fontSize: 'var(--font-size-2xl)',
            fontWeight: '700',
            color: 'var(--text-color)',
            marginBottom: '1rem'
          }}>
            {activeView === 'rules' ? 'Regler' : activeView === 'templates' ? 'Maler' : 'Analytikk'}
          </h2>
          <p style={{ color: 'var(--gray-500)' }}>
            Funksjonalitet kommer snart...
          </p>
        </div>
      )}
      
      {/* Compose Window */}
      <OutlookCompose
        isOpen={showCompose}
        onClose={() => setShowCompose(false)}
        onSend={handleComposeSend}
        initialData={{
          to: composeData.to,
          cc: composeData.cc,
          bcc: composeData.bcc,
          subject: composeData.subject,
          body: composeData.body,
          caseId: composeData.caseId
        }}
        templates={[]}
        relatedCases={relatedCases}
      />
      
    </div>
  );
}
