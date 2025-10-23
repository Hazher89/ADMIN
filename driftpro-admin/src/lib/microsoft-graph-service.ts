import { Configuration, PublicClientApplication, AccountInfo, AuthenticationResult } from '@azure/msal-browser';

export interface MicrosoftGraphConfig {
  clientId: string;
  tenantId: string;
  redirectUri: string;
  scopes: string[];
}

export interface EmailMessage {
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

export interface EmailAddress {
  name?: string;
  address: string;
}

export interface EmailBody {
  contentType: 'text' | 'html';
  content: string;
}

export interface EmailAttachment {
  id: string;
  name: string;
  contentType: string;
  size: number;
  contentBytes?: string;
}

export interface MailFolder {
  id: string;
  displayName: string;
  totalItemCount: number;
  unreadItemCount: number;
  childFolders?: MailFolder[];
}

export interface ComposeEmailRequest {
  toRecipients: string[];
  ccRecipients?: string[];
  bccRecipients?: string[];
  subject: string;
  body: string;
  bodyType: 'text' | 'html';
  importance?: 'low' | 'normal' | 'high';
  saveToSentItems?: boolean;
}

export interface MicrosoftGraphError {
  code: string;
  message: string;
  details?: unknown;
}

class MicrosoftGraphService {
  private msalInstance: PublicClientApplication | null = null;
  private config: MicrosoftGraphConfig;
  private isInitialized = false;
  private initializationPromise: Promise<void> | null = null;

  constructor(config: MicrosoftGraphConfig) {
    this.config = config;
  }

  async initializeMSAL(): Promise<void> {
    if (this.isInitialized) return;
    
    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    this.initializationPromise = this._initializeMSAL();
    return this.initializationPromise;
  }

  private async _initializeMSAL(): Promise<void> {
    try {
      // Dynamic import to avoid SSR issues
      const { PublicClientApplication } = await import('@azure/msal-browser');
      
      const msalConfig: Configuration = {
        auth: {
          clientId: this.config.clientId,
          authority: `https://login.microsoftonline.com/${this.config.tenantId}`,
          redirectUri: this.config.redirectUri,
          postLogoutRedirectUri: this.config.redirectUri,
        },
        cache: {
          cacheLocation: 'localStorage',
          storeAuthStateInCookie: false,
        },
        system: {
          loggerOptions: {
            loggerCallback: (level, message, containsPii) => {
              if (containsPii) {
                return;
              }
              switch (level) {
                case 0: // Error
                  console.error('MSAL Error:', message);
                  break;
                case 1: // Warning
                  console.warn('MSAL Warning:', message);
                  break;
                case 2: // Info
                  console.info('MSAL Info:', message);
                  break;
                case 3: // Verbose
                  console.debug('MSAL Verbose:', message);
                  break;
              }
            },
            logLevel: process.env.NODE_ENV === 'production' ? 0 : 3,
          },
        },
      };

      this.msalInstance = new PublicClientApplication(msalConfig);
      await this.msalInstance.initialize();
      
      // Handle redirect promise on initialization
      await this.msalInstance.handleRedirectPromise();
      
      this.isInitialized = true;
      console.log('MSAL initialized successfully');
    } catch (error) {
      console.error('Failed to initialize MSAL:', error);
      this.isInitialized = false;
      throw error;
    }
  }

  isMSALInitialized(): boolean {
    return this.isInitialized && this.msalInstance !== null;
  }

  getInitializationStatus(): { hasCredentials: boolean; isReady: boolean } {
    const hasCredentials = !!(this.config.clientId && this.config.tenantId && this.config.redirectUri);
    return {
      hasCredentials,
      isReady: hasCredentials && this.isInitialized
    };
  }

  async signIn(): Promise<AccountInfo | null> {
    if (!this.msalInstance) {
      await this.initializeMSAL();
    }

    if (!this.msalInstance) {
      throw new Error('MSAL not initialized');
    }

    try {
      const loginRequest = {
        scopes: this.config.scopes,
        prompt: 'select_account',
      };

      const response = await this.msalInstance.loginPopup(loginRequest);
      return response.account;
    } catch (error) {
      console.error('Sign in failed:', error);
      throw error;
    }
  }

  async signOut(): Promise<void> {
    if (!this.msalInstance) {
      throw new Error('MSAL not initialized');
    }

    try {
      const account = this.getCurrentAccount();
      if (account) {
        await this.msalInstance.logoutPopup({
          account: account,
          postLogoutRedirectUri: this.config.redirectUri,
        });
      }
    } catch (error) {
      console.error('Sign out failed:', error);
      throw error;
    }
  }

  getCurrentAccount(): AccountInfo | null {
    if (!this.msalInstance) return null;
    
    const accounts = this.msalInstance.getAllAccounts();
    return accounts.length > 0 ? accounts[0] : null;
  }

  isAuthenticated(): boolean {
    return this.getCurrentAccount() !== null;
  }

  async getAccessToken(): Promise<string> {
    return await this.acquireTokenSilent();
  }

  private async acquireTokenSilent(): Promise<string> {
    if (!this.msalInstance) {
      throw new Error('MSAL not initialized');
    }

    const account = this.getCurrentAccount();
    if (!account) {
      throw new Error('No active account found');
    }

    try {
      const response = await this.msalInstance.acquireTokenSilent({
        scopes: this.config.scopes,
        account: account,
      });
      return response.accessToken;
    } catch (error) {
      console.error('Failed to acquire token silently:', error);
      throw error;
    }
  }

  private async makeGraphRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = await this.acquireTokenSilent();
    
    const response = await fetch(`https://graph.microsoft.com/v1.0${endpoint}`, {
      ...options,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Graph API error: ${response.status} ${response.statusText} - ${errorData.error?.message || 'Unknown error'}`);
    }

    return response.json();
  }

  async getMailFolders(): Promise<MailFolder[]> {
    try {
      const response = await this.makeGraphRequest<{ value: MailFolder[] }>('/me/mailFolders?$top=50');
      return response.value;
    } catch (error) {
      console.error('Failed to get mail folders:', error);
      throw error;
    }
  }

  async getEmails(folderId: string = 'inbox', top: number = 50, skip: number = 0): Promise<EmailMessage[]> {
    try {
      const endpoint = folderId === 'inbox' 
        ? `/me/messages?$top=${top}&$skip=${skip}&$orderby=receivedDateTime desc&$select=id,subject,from,toRecipients,ccRecipients,bccRecipients,body,receivedDateTime,isRead,hasAttachments,importance,categories,attachments`
        : `/me/mailFolders/${folderId}/messages?$top=${top}&$skip=${skip}&$orderby=receivedDateTime desc&$select=id,subject,from,toRecipients,ccRecipients,bccRecipients,body,receivedDateTime,isRead,hasAttachments,importance,categories,attachments`;
      
      const response = await this.makeGraphRequest<{ value: EmailMessage[] }>(endpoint);
      return response.value;
    } catch (error) {
      console.error('Failed to get emails:', error);
      throw error;
    }
  }

  async getEmail(emailId: string): Promise<EmailMessage> {
    try {
      const response = await this.makeGraphRequest<EmailMessage>(`/me/messages/${emailId}?$select=id,subject,from,toRecipients,ccRecipients,bccRecipients,body,receivedDateTime,isRead,hasAttachments,importance,categories,attachments`);
      return response;
    } catch (error) {
      console.error('Failed to get email:', error);
      throw error;
    }
  }

  async sendEmail(request: ComposeEmailRequest): Promise<void> {
    try {
      const emailData = {
        message: {
          subject: request.subject,
          body: {
            contentType: request.bodyType,
            content: request.body,
          },
          toRecipients: request.toRecipients.map(email => ({ emailAddress: { address: email } })),
          ccRecipients: request.ccRecipients?.map(email => ({ emailAddress: { address: email } })),
          bccRecipients: request.bccRecipients?.map(email => ({ emailAddress: { address: email } })),
          importance: request.importance || 'normal',
        },
        saveToSentItems: request.saveToSentItems !== false,
      };

      await this.makeGraphRequest('/me/sendMail', {
        method: 'POST',
        body: JSON.stringify(emailData),
      });
    } catch (error) {
      console.error('Failed to send email:', error);
      throw error;
    }
  }

  async updateEmailReadStatus(emailId: string, isRead: boolean): Promise<void> {
    try {
      await this.makeGraphRequest(`/me/messages/${emailId}`, {
        method: 'PATCH',
        body: JSON.stringify({
          isRead: isRead,
        }),
      });
    } catch (error) {
      console.error('Failed to update email read status:', error);
      throw error;
    }
  }

  async deleteEmail(emailId: string): Promise<void> {
    try {
      await this.makeGraphRequest(`/me/messages/${emailId}`, {
        method: 'DELETE',
      });
    } catch (error) {
      console.error('Failed to delete email:', error);
      throw error;
    }
  }

  async moveEmail(emailId: string, destinationFolderId: string): Promise<void> {
    try {
      await this.makeGraphRequest(`/me/messages/${emailId}/move`, {
        method: 'POST',
        body: JSON.stringify({
          destinationId: destinationFolderId,
        }),
      });
    } catch (error) {
      console.error('Failed to move email:', error);
      throw error;
    }
  }

  async searchEmails(query: string, folderId?: string): Promise<EmailMessage[]> {
    try {
      const endpoint = folderId 
        ? `/me/mailFolders/${folderId}/messages?$search="${encodeURIComponent(query)}"&$select=id,subject,from,toRecipients,ccRecipients,bccRecipients,body,receivedDateTime,isRead,hasAttachments,importance,categories,attachments`
        : `/me/messages?$search="${encodeURIComponent(query)}"&$select=id,subject,from,toRecipients,ccRecipients,bccRecipients,body,receivedDateTime,isRead,hasAttachments,importance,categories,attachments`;
      
      const response = await this.makeGraphRequest<{ value: EmailMessage[] }>(endpoint);
      return response.value;
    } catch (error) {
      console.error('Failed to search emails:', error);
      throw error;
    }
  }

  async getEmailAttachments(emailId: string): Promise<EmailAttachment[]> {
    try {
      const response = await this.makeGraphRequest<{ value: EmailAttachment[] }>(`/me/messages/${emailId}/attachments`);
      return response.value;
    } catch (error) {
      console.error('Failed to get email attachments:', error);
      throw error;
    }
  }

  async getUserProfile(): Promise<Record<string, unknown>> {
    try {
      const response = await this.makeGraphRequest<Record<string, unknown>>('/me?$select=id,displayName,mail,userPrincipalName,officeLocation,jobTitle,department');
      return response;
    } catch (error) {
      console.error('Failed to get user profile:', error);
      throw error;
    }
  }

  async getCalendarEvents(startDate: string, endDate: string): Promise<Record<string, unknown>[]> {
    try {
      const response = await this.makeGraphRequest<{ value: Record<string, unknown>[] }>(`/me/calendarView?startDateTime=${startDate}&endDateTime=${endDate}`);
      return response.value;
    } catch (error) {
      console.error('Failed to get calendar events:', error);
      throw error;
    }
  }
}

// Default configuration
const defaultConfig: MicrosoftGraphConfig = {
  clientId: process.env.NEXT_PUBLIC_MICROSOFT_CLIENT_ID || '',
  tenantId: process.env.NEXT_PUBLIC_MICROSOFT_TENANT_ID || '',
  redirectUri: process.env.NEXT_PUBLIC_MICROSOFT_REDIRECT_URI || 'http://localhost:3000/dashboard/mail',
  scopes: [
    'User.Read',
    'offline_access',
    'openid',
    'profile',
    'email'
  ],
};

export const microsoftGraphService = new MicrosoftGraphService(defaultConfig);
