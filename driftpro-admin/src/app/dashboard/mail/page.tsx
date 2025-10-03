'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Mail, 
  Search, 
  Plus, 
  Trash2, 
  Reply, 
  Forward, 
  Paperclip,
  Send,
  Save,
  RefreshCw,
  Download,
  FileText,
  FileImage,
  FileVideo,
  FileArchive,
  FileCode,
  File,
  Inbox,
  FileText as Drafts,
  AlertTriangle as Spam,
  X,
  ChevronUp,
  ChevronDown,
  List,
  Globe,
  Info,
  AlertTriangle,
  Menu,
  User,
  LogOut,
  Send as SendIcon,
  Trash,
  FolderOpen,
  Star
} from 'lucide-react';
import { microsoftGraphService } from '@/lib/microsoft-graph-service';
import { firebaseService } from '@/lib/firebase-services';
import type { AccountInfo } from '@azure/msal-browser';

// Use the service interfaces for consistency
interface EmailMessage {
  id: string;
  subject: string;
  from: EmailAddress;
  toRecipients: EmailAddress[];
  ccRecipients?: EmailAddress[];
  bccRecipients?: EmailAddress[];
  body: EmailBody;
  receivedDateTime: string;
  isRead: boolean;
  hasAttachments: boolean;
  importance: 'low' | 'normal' | 'high';
  categories: string[];
  attachments?: EmailAttachment[];
}

interface EmailAddress {
  name?: string;
  address: string;
}

interface EmailBody {
  contentType: 'text' | 'html';
  content: string;
}

interface EmailAttachment {
  id: string;
  name: string;
  contentType: string;
  size: number;
  contentBytes?: string;
}

interface EmailFolder {
  id: string;
  displayName: string;
  totalItemCount: number;
  unreadItemCount: number;
}

export default function MailPage() {
  // Authentication state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [userProfile, setUserProfile] = useState<AccountInfo | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  
  // SMTP Authentication state
  const [smtpEmail, setSmtpEmail] = useState('');
  const [smtpPassword, setSmtpPassword] = useState('');
  const [isSmtpAuthenticating, setIsSmtpAuthenticating] = useState(false);
  const [smtpAuthError, setSmtpAuthError] = useState<string | null>(null);
  const [showSmtpLogin, setShowSmtpLogin] = useState(false);
  const [userSmtpPassword, setUserSmtpPassword] = useState(''); // Store user's password for sending emails
  
  // Email data
  const [emails, setEmails] = useState<EmailMessage[]>([]);
  const [folders, setFolders] = useState<EmailFolder[]>([]);
  const [selectedFolder, setSelectedFolder] = useState<string>('inbox');
  const [selectedEmails, setSelectedEmails] = useState<Set<string>>(new Set());
  
  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'compact'>('list');
  const [sortBy, setSortBy] = useState<'date' | 'subject' | 'from' | 'importance'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showCompose, setShowCompose] = useState(false);
  const [showEmailView, setShowEmailView] = useState(false);
  const [selectedEmail, setSelectedEmail] = useState<EmailMessage | null>(null);
  const [composeEmail, setComposeEmail] = useState({
    to: '',
    cc: '',
    bcc: '',
    subject: '',
    body: { contentType: 'text' as const, content: '' },
    importance: 'normal' as 'low' | 'normal' | 'high',
    attachments: [] as EmailAttachment[]
  });
  const [filters, setFilters] = useState({
    unreadOnly: false,
    importance: 'all' as 'all' | 'low' | 'normal' | 'high',
    hasAttachments: false
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Check authentication status on component mount
  useEffect(() => {
    checkAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handle window resize for responsive design
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setSidebarOpen(false);
      } else {
        setSidebarOpen(true);
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const checkAuth = async () => {
    try {
      setAuthError(null);
      const msalStatus = microsoftGraphService.getInitializationStatus();
      
      if (msalStatus.hasCredentials && microsoftGraphService.isAuthenticated()) {
        const account = microsoftGraphService.getCurrentAccount();
        if (account) {
          setIsAuthenticated(true);
          setUserProfile(account);
          await loadFolders();
          await loadEmails();
        }
      }
    } catch (error) {
      console.error('Error checking authentication:', error);
      setAuthError('Kunne ikke sjekke autentisering');
    }
  };

  const loadFolders = async () => {
    try {
      // Check if user is authenticated via SMTP
      if (userProfile?.environment === 'smtp') {
        // For SMTP users, we can't load folders from Microsoft Graph
        // So we'll use the basic folders we set during authentication
        setFolders([
          { id: 'inbox', displayName: 'Innboks', totalItemCount: 0, unreadItemCount: 0 },
          { id: 'sent', displayName: 'Sendt', totalItemCount: 0, unreadItemCount: 0 }
        ]);
      } else {
        // For Microsoft Graph users, use the existing method
        const foldersData = await microsoftGraphService.getMailFolders();
        setFolders(foldersData);
      }
    } catch (error) {
      console.error('Error loading folders:', error);
      setAuthError('Kunne ikke laste mapper');
    }
  };

  const loadEmails = async () => {
    try {
      setIsLoading(true);
      
      // Check if user is authenticated via SMTP
      if (userProfile?.environment === 'smtp') {
        // For SMTP users, we can't load emails from Microsoft Graph
        // So we'll show a message that email reading is not available
        setEmails([]);
        setAuthError('E-postlesing er ikke tilgjengelig med SMTP-autentisering. Du kan sende e-poster.');
      } else {
        // For Microsoft Graph users, use the existing method
        const emailsData = await microsoftGraphService.getEmails(selectedFolder);
        setEmails(emailsData);
      }
    } catch (error) {
      console.error('Error loading emails:', error);
      setAuthError('Kunne ikke laste e-poster');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignIn = async () => {
    try {
      setIsAuthenticating(true);
      setAuthError(null);
      
      await microsoftGraphService.signIn();
      const account = microsoftGraphService.getCurrentAccount();
      if (account) {
        setIsAuthenticated(true);
        setUserProfile(account);
        await loadFolders();
        await loadEmails();
      }
    } catch (error) {
      console.error('Error signing in:', error);
      setAuthError('Innlogging mislyktes. Prøv igjen.');
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await microsoftGraphService.signOut();
      setIsAuthenticated(false);
      setUserProfile(null);
      setEmails([]);
      setFolders([]);
      setAuthError(null);
      setSmtpAuthError(null);
      setShowSmtpLogin(false);
      setUserSmtpPassword(''); // Clear stored password
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const handleSmtpSignIn = async () => {
    try {
      setIsSmtpAuthenticating(true);
      setSmtpAuthError(null);
      
      const response = await fetch('/api/smtp-auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: smtpEmail,
          password: smtpPassword,
        }),
      });
      
      const result = await response.json();
      
      if (result.success && result.user) {
        setIsAuthenticated(true);
        setUserProfile({
          name: result.user.name,
          username: result.user.email,
          localAccountId: result.user.email,
          homeAccountId: result.user.email,
          environment: 'smtp',
          tenantId: 'smtp',
          idTokenClaims: {},
          nativeAccountId: result.user.email
        } as AccountInfo);
        
        // Store user's password for sending emails
        setUserSmtpPassword(smtpPassword);
        
        // For SMTP auth, we'll show a simplified email interface
        // since we can't access Microsoft Graph API
        setEmails([]);
        setFolders([
          { id: 'inbox', displayName: 'Innboks', totalItemCount: 0, unreadItemCount: 0 },
          { id: 'sent', displayName: 'Sendt', totalItemCount: 0, unreadItemCount: 0 }
        ]);
        
        setShowSmtpLogin(false);
        setSmtpEmail('');
        setSmtpPassword('');
      } else {
        setSmtpAuthError(result.error || 'SMTP-autentisering mislyktes');
      }
    } catch (error) {
      console.error('Error with SMTP sign in:', error);
      setSmtpAuthError('En feil oppstod under SMTP-autentisering');
    } finally {
      setIsSmtpAuthenticating(false);
    }
  };

  const sendEmail = async () => {
    try {
      // Check if user is authenticated via SMTP
      if (userProfile?.environment === 'smtp') {
        // For SMTP users, use the dynamic email service with their credentials
        const { DynamicEmailService } = await import('@/lib/dynamic-email-service');
        const emailService = new DynamicEmailService(userProfile.username || '', userSmtpPassword);
        
        await emailService.sendEmail(
          composeEmail.to.split(',').map(email => email.trim()),
          composeEmail.subject,
          composeEmail.body.content,
          composeEmail.body.content
        );
      } else {
        // For Microsoft Graph users, use the existing method
        await microsoftGraphService.sendEmail({
          toRecipients: composeEmail.to.split(',').map(email => email.trim()),
          ccRecipients: composeEmail.cc ? composeEmail.cc.split(',').map(email => email.trim()) : undefined,
          bccRecipients: composeEmail.bcc ? composeEmail.bcc.split(',').map(email => email.trim()) : undefined,
          subject: composeEmail.subject,
          body: composeEmail.body.content,
          bodyType: composeEmail.body.contentType
        });
      }

      setShowCompose(false);
      setComposeEmail({
        to: '',
        cc: '',
        bcc: '',
        subject: '',
        body: { contentType: 'text', content: '' },
        importance: 'normal',
        attachments: []
      });
      
      // Refresh emails to show the sent email
      await loadEmails();
    } catch (error) {
      console.error('Error sending email:', error);
      setAuthError('Kunne ikke sende e-post');
    }
  };

  const toggleReadStatus = async (emailId: string, isRead: boolean) => {
    try {
      await microsoftGraphService.updateEmailReadStatus(emailId, !isRead);
      setEmails(prev => prev.map(email => 
        email.id === emailId ? { ...email, isRead: !isRead } : email
      ));
    } catch (error) {
      console.error('Error updating email read status:', error);
    }
  };

  const deleteEmails = async () => {
    try {
      for (const emailId of selectedEmails) {
        await microsoftGraphService.deleteEmail(emailId);
      }
      setEmails(prev => prev.filter(email => !selectedEmails.has(email.id)));
      setSelectedEmails(new Set());
    } catch (error) {
      console.error('Error deleting emails:', error);
      setAuthError('Kunne ikke slette e-poster');
    }
  };

  const replyToEmail = (email: EmailMessage) => {
    setComposeEmail(prev => ({
      ...prev,
      to: email.from.address,
      subject: `Re: ${email.subject}`,
      body: { contentType: 'text', content: `\n\n--- Original melding ---\nFra: ${email.from.name || email.from.address}\nEmne: ${email.subject}\n\n${email.body.content}` }
    }));
    setShowCompose(true);
    setShowEmailView(false);
  };

  const forwardEmail = (email: EmailMessage) => {
    setComposeEmail(prev => ({
      ...prev,
      to: '',
      subject: `Videresend: ${email.subject}`,
      body: { contentType: 'text', content: `\n\n--- Videresendt melding ---\nFra: ${email.from.name || email.from.address}\nEmne: ${email.subject}\n\n${email.body.content}` }
    }));
    setShowCompose(true);
    setShowEmailView(false);
  };

  const handleFileAttachment = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      const newAttachments = Array.from(files).map(file => ({
        id: Date.now().toString() + Math.random(),
        name: file.name,
        contentType: file.type,
        size: file.size,
        file: file
      }));
      setComposeEmail(prev => ({
        ...prev,
        attachments: [...prev.attachments, ...newAttachments]
      }));
    }
  };

  const removeAttachment = (index: number) => {
    setComposeEmail(prev => ({
      ...prev,
      attachments: prev.attachments.filter((_, i) => i !== index)
    }));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (contentType: string) => {
    const type = contentType.toLowerCase();
    
    if (type.includes('pdf')) return <FileText className="w-5 h-5 text-red-500" />;
    if (type.includes('image')) return <FileImage className="w-5 h-5 text-green-500" />;
    if (type.includes('video')) return <FileVideo className="w-5 h-5 text-purple-500" />;
    if (type.includes('zip') || type.includes('rar')) return <FileArchive className="w-5 h-5 text-orange-500" />;
    if (type.includes('code') || type.includes('json') || type.includes('xml')) return <FileCode className="w-5 h-5 text-blue-500" />;
    if (type.includes('audio')) return <File className="w-5 h-5 text-green-500" />;
    
    return <File className="w-5 h-5 text-gray-500" />;
  };

  // Sort emails based on current sort settings
  const sortedEmails = [...emails].sort((a, b) => {
    let comparison = 0;
    
    switch (sortBy) {
      case 'date':
        comparison = new Date(a.receivedDateTime).getTime() - new Date(b.receivedDateTime).getTime();
        break;
      case 'subject':
        comparison = a.subject.localeCompare(b.subject);
        break;
      case 'from':
        comparison = a.from.address.localeCompare(b.from.address);
        break;
      case 'importance':
        const importanceOrder = { high: 3, normal: 2, low: 1 };
        comparison = (importanceOrder[a.importance] || 2) - (importanceOrder[b.importance] || 2);
        break;
      default:
        comparison = 0;
    }

    return sortOrder === 'asc' ? comparison : -comparison;
  });

  // Check MSAL status
  const msalStatus = microsoftGraphService.getInitializationStatus();

  // If not authenticated, show login screen
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-lg w-full">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <Mail className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-3">DriftPro Mail</h1>
            <p className="text-gray-600 text-lg">Din profesjonelle e-post-løsning</p>
          </div>

          {/* Configuration Check */}
          {!msalStatus.hasCredentials && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
              <div className="flex items-start space-x-3">
                <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-red-800">
                  <p className="font-medium mb-1">Mangler konfigurasjon</p>
                  <p>Microsoft Graph API er ikke konfigurert. Kontakt administrator.</p>
                </div>
              </div>
            </div>
          )}

          {/* MSAL Status */}
          {!msalStatus.isReady && msalStatus.hasCredentials && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6">
              <div className="flex items-start space-x-3">
                <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-yellow-800">
                  <p className="font-medium mb-1">Initialiserer tjeneste</p>
                  <p>Venter på at Microsoft Graph-tjenesten skal starte...</p>
                </div>
              </div>
            </div>
          )}

          {/* Login Options */}
          <div className="space-y-4">
            {/* Microsoft Login */}
            {msalStatus.hasCredentials && msalStatus.isReady && (
              <button
                onClick={handleSignIn}
                disabled={isAuthenticating}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 disabled:opacity-50 text-white font-medium py-3 px-4 rounded-xl transition-all duration-200 flex items-center justify-center"
              >
                {isAuthenticating ? (
                  <>
                    <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                    Logger inn...
                  </>
                ) : (
                  <>
                    <Globe className="w-5 h-5 mr-2" />
                    Logg inn med Microsoft
                  </>
                )}
              </button>
            )}

            {/* SMTP Login */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">eller</span>
              </div>
            </div>

            <button
              onClick={() => setShowSmtpLogin(true)}
              className="w-full bg-gradient-to-r from-green-600 to-emerald-700 hover:from-green-700 hover:to-emerald-800 text-white font-medium py-3 px-4 rounded-xl transition-all duration-200 flex items-center justify-center"
            >
              <Mail className="w-5 h-5 mr-2" />
              Logg inn med SMTP-passord
            </button>

            {/* Microsoft Login Info */}
            {msalStatus.hasCredentials && msalStatus.isReady && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <div className="flex items-start space-x-3">
                  <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-blue-800">
                    <p className="font-medium mb-1">Sikker autentisering</p>
                    <p>Du vil bli omdirigert til Microsoft for sikker innlogging med din Outlook-konto.</p>
                  </div>
                </div>
              </div>
            )}

            {/* SMTP Login Info */}
            <div className="bg-green-50 border border-green-200 rounded-xl p-4">
              <div className="flex items-start space-x-3">
                <Info className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-green-800">
                  <p className="font-medium mb-1">SMTP-autentisering</p>
                  <p>Logg inn med din e-postadresse og SMTP-passord for direkte tilgang til e-postfunksjoner.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Error Display */}
          {(authError || smtpAuthError) && (
            <div className="mt-6 bg-red-50 border border-red-200 rounded-xl p-4">
              <div className="flex items-start space-x-3">
                <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-red-800">
                  <p className="font-medium mb-1">Feil oppstod</p>
                  <p>{authError || smtpAuthError}</p>
                </div>
              </div>
            </div>
          )}

          {/* Configuration Status */}
          <div className="mt-6 p-4 bg-gray-50 rounded-xl">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Konfigurasjonsstatus</span>
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${msalStatus.isReady ? 'bg-green-400' : 'bg-yellow-400'}`}></div>
                <span className="text-xs text-gray-500">
                  {msalStatus.isReady ? 'Klar' : 'Konfigurerer...'}
                </span>
              </div>
            </div>
            <p className="text-xs text-gray-600">
              {msalStatus.hasCredentials 
                ? 'Microsoft Graph API er konfigurert og klar til bruk.'
                : 'Microsoft Graph API krever konfigurasjon av miljøvariabler.'
              }
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Main mail application UI
  return (
    <div className="h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-lg hover:bg-gray-100 lg:hidden"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                <Mail className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">DriftPro Mail</h1>
                <p className="text-sm text-gray-500">
                  {userProfile?.name || userProfile?.username || 'Microsoft-konto'}
                  {userProfile?.environment === 'smtp' && ' (SMTP)'}
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowCompose(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Ny e-post</span>
            </button>
            
            <div className="relative">
              <button
                onClick={() => setShowCompose(false)}
                className="p-2 rounded-lg hover:bg-gray-100"
              >
                <User className="w-5 h-5" />
              </button>
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                <button
                  onClick={handleSignOut}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Logg ut</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <aside className={`${sidebarOpen ? 'w-64' : 'w-0'} bg-white border-r border-gray-200 transition-all duration-300 overflow-hidden lg:block`}>
          <div className="p-4">
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">Mapper</h3>
              <nav className="space-y-1">
                {folders.map((folder) => (
                  <button
                    key={folder.id}
                    onClick={() => {
                      setSelectedFolder(folder.id);
                      loadEmails();
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
                      selectedFolder === folder.id
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      {folder.id === 'inbox' && <Inbox className="w-4 h-4" />}
                      {folder.id === 'sent' && <SendIcon className="w-4 h-4" />}
                      {folder.id === 'drafts' && <Drafts className="w-4 h-4" />}
                      {folder.id === 'junk' && <Spam className="w-4 h-4" />}
                      {folder.id === 'deleted' && <Trash className="w-4 h-4" />}
                      {!['inbox', 'sent', 'drafts', 'junk', 'deleted'].includes(folder.id) && (
                        <FolderOpen className="w-4 h-4" />
                      )}
                      <span>{folder.displayName}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      {folder.unreadItemCount > 0 && (
                        <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                          {folder.unreadItemCount}
                        </span>
                      )}
                      <span className="text-gray-400 text-xs">{folder.totalItemCount}</span>
                    </div>
                  </button>
                ))}
              </nav>
            </div>

            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">Filtre</h3>
              <div className="space-y-2">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={filters.unreadOnly}
                    onChange={(e) => setFilters(prev => ({ ...prev, unreadOnly: e.target.checked }))}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">Kun uleste</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={filters.hasAttachments}
                    onChange={(e) => setFilters(prev => ({ ...prev, hasAttachments: e.target.checked }))}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">Med vedlegg</span>
                </label>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">Sortering</h3>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'date' | 'subject' | 'from' | 'importance')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="date">Dato</option>
                <option value="subject">Emne</option>
                <option value="from">Fra</option>
                <option value="importance">Viktighet</option>
              </select>
              <button
                onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                className="mt-2 w-full px-3 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 flex items-center justify-center space-x-2"
              >
                {sortOrder === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                <span>{sortOrder === 'asc' ? 'Stigende' : 'Synkende'}</span>
              </button>
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {/* Toolbar */}
          <div className="bg-white border-b border-gray-200 px-6 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Søk i e-post..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-80"
                  />
                </div>
                
                <button
                  onClick={() => setViewMode(prev => prev === 'list' ? 'compact' : 'list')}
                  className="p-2 rounded-lg hover:bg-gray-100"
                  title={viewMode === 'list' ? 'Kompakt visning' : 'Liste visning'}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>

              <div className="flex items-center space-x-2">
                {selectedEmails.size > 0 && (
                  <>
                    <button
                      onClick={() => setSelectedEmails(new Set())}
                      className="text-sm text-gray-600 hover:text-gray-800"
                    >
                      Avbryt
                    </button>
                    <button
                      onClick={deleteEmails}
                      className="text-red-600 hover:text-red-800 p-2 rounded-lg hover:bg-red-50"
                      title="Slett valgte e-poster"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </>
                )}
                
                <button
                  onClick={loadEmails}
                  disabled={isLoading}
                  className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50"
                  title="Oppdater"
                >
                  <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>
          </div>

          {/* Email List */}
          <div className="flex-1 overflow-hidden">
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
              </div>
            ) : (
              <div className="h-full overflow-y-auto">
                {sortedEmails.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-gray-500">
                    <div className="text-center">
                      <Mail className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                      <p className="text-lg font-medium">
                        {userProfile?.environment === 'smtp' ? 'SMTP-autentisering' : 'Ingen e-poster'}
                      </p>
                      <p className="text-sm">
                        {userProfile?.environment === 'smtp' 
                          ? 'E-postlesing er ikke tilgjengelig med SMTP-autentisering. Du kan sende e-poster ved å klikke på "Ny e-post".'
                          : 'Ingen e-poster funnet i denne mappen.'
                        }
                      </p>
                    </div>
                  </div>
                ) : (
                  sortedEmails.map((email) => (
                    <div
                      key={email.id}
                      className={`border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors ${
                        !email.isRead ? 'bg-blue-50' : ''
                      }`}
                      onClick={() => {
                        setSelectedEmail(email);
                        setShowEmailView(true);
                        if (!email.isRead) {
                          toggleReadStatus(email.id, email.isRead);
                        }
                      }}
                    >
                      <div className="px-6 py-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3 flex-1 min-w-0">
                            <input
                              type="checkbox"
                              checked={selectedEmails.has(email.id)}
                              onChange={(e) => {
                                e.stopPropagation();
                                const newSelected = new Set(selectedEmails);
                                if (e.target.checked) {
                                  newSelected.add(email.id);
                                } else {
                                  newSelected.delete(email.id);
                                }
                                setSelectedEmails(newSelected);
                              }}
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            
                            <div className="flex items-center space-x-2 min-w-0 flex-1">
                              <span className={`font-medium ${!email.isRead ? 'text-gray-900' : 'text-gray-700'}`}>
                                {email.from.name || email.from.address}
                              </span>
                              {email.hasAttachments && (
                                <Paperclip className="w-4 h-4 text-gray-400 flex-shrink-0" />
                              )}
                              {email.importance === 'high' && (
                                <Star className="w-4 h-4 text-yellow-500 flex-shrink-0" />
                              )}
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-2 text-sm text-gray-500 flex-shrink-0">
                            <span>{new Date(email.receivedDateTime).toLocaleDateString('nb-NO')}</span>
                            <span>{new Date(email.receivedDateTime).toLocaleTimeString('nb-NO', { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                        </div>
                        
                        <div className="mt-2">
                          <h3 className={`font-medium ${!email.isRead ? 'text-gray-900' : 'text-gray-700'} mb-1`}>
                            {email.subject}
                          </h3>
                          <p className={`text-sm ${!email.isRead ? 'text-gray-700' : 'text-gray-500'} line-clamp-2`}>
                            {email.body.content.replace(/<[^>]*>/g, '')}
                          </p>
                        </div>
                        
                        {email.categories.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {email.categories.map((category, index) => (
                              <span
                                key={index}
                                className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                              >
                                {category}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Email Viewer Modal */}
      {showEmailView && selectedEmail && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">{selectedEmail.subject}</h2>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => replyToEmail(selectedEmail)}
                  className="p-2 rounded-lg hover:bg-gray-100"
                  title="Svar"
                >
                  <Reply className="w-4 h-4" />
                </button>
                <button
                  onClick={() => forwardEmail(selectedEmail)}
                  className="p-2 rounded-lg hover:bg-gray-100"
                  title="Videresend"
                >
                  <Forward className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setShowEmailView(false)}
                  className="p-2 rounded-lg hover:bg-gray-100"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                      <User className="w-5 h-5 text-gray-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{selectedEmail.from.name || selectedEmail.from.address}</p>
                      <p className="text-sm text-gray-500">
                        {new Date(selectedEmail.receivedDateTime).toLocaleString('nb-NO')}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {selectedEmail.importance === 'high' && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        <Star className="w-3 h-3 mr-1" />
                        Høy prioritet
                      </span>
                    )}
                    {selectedEmail.hasAttachments && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        <Paperclip className="w-3 h-3 mr-1" />
                        Vedlegg
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="mb-4">
                  <p className="text-sm text-gray-600 mb-2">
                    <span className="font-medium">Til:</span> {selectedEmail.toRecipients.map(r => r.name || r.address).join(', ')}
                  </p>
                  {selectedEmail.ccRecipients && selectedEmail.ccRecipients.length > 0 && (
                    <p className="text-sm text-gray-600 mb-2">
                      <span className="font-medium">Kopi:</span> {selectedEmail.ccRecipients.map(r => r.name || r.address).join(', ')}
                    </p>
                  )}
                  {selectedEmail.bccRecipients && selectedEmail.bccRecipients.length > 0 && (
                    <p className="text-sm text-gray-600 mb-2">
                      <span className="font-medium">Blindkopi:</span> {selectedEmail.bccRecipients.map(r => r.name || r.address).join(', ')}
                    </p>
                  )}
                </div>
              </div>
              
              <div className="prose max-w-none">
                <div dangerouslySetInnerHTML={{ __html: selectedEmail.body.content }} />
              </div>
              
              {selectedEmail.attachments && selectedEmail.attachments.length > 0 && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Vedlegg</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {selectedEmail.attachments.map((attachment) => (
                      <div
                        key={attachment.id}
                        className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
                      >
                        {getFileIcon(attachment.contentType)}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{attachment.name}</p>
                          <p className="text-xs text-gray-500">{formatFileSize(attachment.size)}</p>
                        </div>
                        <button className="p-1 rounded hover:bg-gray-200">
                          <Download className="w-4 h-4 text-gray-600" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Compose Email Modal */}
      {showCompose && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Ny e-post</h2>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setShowCompose(false)}
                  className="p-2 rounded-lg hover:bg-gray-100"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Til *</label>
                    <input
                      type="text"
                      value={composeEmail.to}
                      onChange={(e) => setComposeEmail(prev => ({ ...prev, to: e.target.value }))}
                      placeholder="e-post@eksempel.no"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Kopi</label>
                    <input
                      type="text"
                      value={composeEmail.cc}
                      onChange={(e) => setComposeEmail(prev => ({ ...prev, cc: e.target.value }))}
                      placeholder="e-post@eksempel.no"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Blindkopi</label>
                    <input
                      type="text"
                      value={composeEmail.bcc}
                      onChange={(e) => setComposeEmail(prev => ({ ...prev, bcc: e.target.value }))}
                      placeholder="e-post@eksempel.no"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Emne *</label>
                  <input
                    type="text"
                    value={composeEmail.subject}
                    onChange={(e) => setComposeEmail(prev => ({ ...prev, subject: e.target.value }))}
                    placeholder="Emne på e-posten"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div className="flex items-center space-x-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Viktighet</label>
                    <select
                      value={composeEmail.importance}
                      onChange={(e) => setComposeEmail(prev => ({ ...prev, importance: e.target.value as 'low' | 'normal' | 'high' }))}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="low">Lav</option>
                      <option value="normal">Normal</option>
                      <option value="high">Høy</option>
                    </select>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      onChange={handleFileAttachment}
                      className="hidden"
                    />
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                      <Paperclip className="w-4 h-4" />
                      <span>Legg til vedlegg</span>
                    </button>
                  </div>
                </div>
                
                {composeEmail.attachments.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Vedlegg</label>
                    <div className="space-y-2">
                      {composeEmail.attachments.map((attachment, index) => (
                        <div key={attachment.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center space-x-3">
                            {getFileIcon(attachment.contentType)}
                            <div>
                              <p className="text-sm font-medium text-gray-900">{attachment.name}</p>
                              <p className="text-xs text-gray-500">{formatFileSize(attachment.size)}</p>
                            </div>
                          </div>
                          <button
                            onClick={() => removeAttachment(index)}
                            className="p-1 rounded hover:bg-gray-200"
                          >
                            <X className="w-4 h-4 text-gray-600" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Innhold *</label>
                  <textarea
                    value={composeEmail.body.content}
                    onChange={(e) => setComposeEmail(prev => ({ ...prev, body: { contentType: 'text', content: e.target.value } }))}
                    placeholder="Skriv e-post-innholdet her..."
                    rows={12}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono"
                  />
                </div>
              </div>
            </div>
            
            <div className="flex items-center justify-between p-6 border-t border-gray-200">
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setShowCompose(false)}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Avbryt
                </button>
                <button
                  onClick={() => setShowCompose(false)}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center space-x-2"
                >
                  <Save className="w-4 h-4" />
                  <span>Lagre som kladd</span>
                </button>
              </div>
              
              <button
                onClick={sendEmail}
                disabled={!composeEmail.to || !composeEmail.subject || !composeEmail.body.content}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-6 py-2 rounded-lg flex items-center space-x-2 transition-colors"
              >
                <Send className="w-4 h-4" />
                <span>Send</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SMTP Login Modal */}
      {showSmtpLogin && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">SMTP-innlogging</h2>
              <button
                onClick={() => {
                  setShowSmtpLogin(false);
                  setSmtpAuthError(null);
                  setSmtpEmail('');
                  setSmtpPassword('');
                }}
                className="p-2 rounded-lg hover:bg-gray-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">E-postadresse</label>
                  <input
                    type="email"
                    value={smtpEmail}
                    onChange={(e) => setSmtpEmail(e.target.value)}
                    placeholder="Skriv inn e-postadressen som har App Password"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">App Password</label>
                  <input
                    type="password"
                    value={smtpPassword}
                    onChange={(e) => setSmtpPassword(e.target.value)}
                    placeholder="Skriv inn App Password (ikke vanlig passord)"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                </div>

                {smtpAuthError && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <div className="flex items-start space-x-2">
                      <AlertTriangle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-red-800">{smtpAuthError}</p>
                    </div>
                  </div>
                )}

                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <div className="flex items-start space-x-2">
                    <Info className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-green-800">
                      <p className="font-medium mb-1">SMTP-autentisering med App Password</p>
                      <p>Skriv inn e-postadressen som har App Password og App Password-et selv. Dette fungerer selv med Security Defaults aktivert.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex items-center justify-end p-6 border-t border-gray-200 space-x-3">
              <button
                onClick={() => {
                  setShowSmtpLogin(false);
                  setSmtpAuthError(null);
                  setSmtpEmail('');
                  setSmtpPassword('');
                }}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Avbryt
              </button>
              <button
                onClick={handleSmtpSignIn}
                disabled={!smtpEmail || !smtpPassword || isSmtpAuthenticating}
                className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-6 py-2 rounded-lg flex items-center space-x-2 transition-colors"
              >
                {isSmtpAuthenticating ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Logger inn...</span>
                  </>
                ) : (
                  <>
                    <Mail className="w-4 h-4" />
                    <span>Logg inn</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
