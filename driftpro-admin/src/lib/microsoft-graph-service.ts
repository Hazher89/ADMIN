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
  emailAddress?: {
    name?: string;
    address: string;
  };
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
  attachments?: File[];
}

export interface Contact {
  id: string;
  displayName: string;
  givenName?: string;
  surname?: string;
  emailAddresses?: Array<{ address: string; name?: string }>;
  businessPhones?: string[];
  mobilePhone?: string;
  jobTitle?: string;
  companyName?: string;
  officeLocation?: string;
  birthday?: string;
  createdDateTime?: string;
  lastModifiedDateTime?: string;
}

export interface CalendarEvent {
  id: string;
  subject: string;
  start: { dateTime: string; timeZone: string };
  end: { dateTime: string; timeZone: string };
  location?: { displayName: string };
  attendees?: Array<{ emailAddress: { address: string; name?: string }; type: string }>;
  organizer?: { emailAddress: { address: string; name?: string } };
  body?: { contentType: string; content: string };
  isAllDay?: boolean;
  showAs?: string;
  importance?: string;
  sensitivity?: string;
  categories?: string[];
}

export interface OneDriveItem {
  id: string;
  name: string;
  size?: number;
  webUrl?: string;
  createdDateTime?: string;
  lastModifiedDateTime?: string;
  folder?: { childCount: number };
  file?: { mimeType: string; hashes?: { sha256Hash: string } };
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

    // Validate configuration before attempting login
    if (!this.config.clientId) {
      throw new Error('Microsoft Client ID is not configured. Please set NEXT_PUBLIC_MICROSOFT_CLIENT_ID in your .env.local file.');
    }

    try {
      const loginRequest = {
        scopes: this.config.scopes,
        prompt: 'select_account',
      };

      // Use redirect instead of popup to avoid cross-origin issues
      // Redirect flow works better with Next.js and doesn't require SPA platform type
      await this.msalInstance.loginRedirect(loginRequest);
      // Return null since redirect will navigate away
      return null;
    } catch (error: any) {
      console.error('Sign in failed:', error);
      
      // Provide helpful error messages
      if (error.errorCode === 'AADSTS50194') {
        throw new Error('Application is not configured as multi-tenant. Please set NEXT_PUBLIC_MICROSOFT_TENANT_ID to your specific tenant ID in .env.local. Find it in Azure Portal > Azure Active Directory > Overview.');
      }
      
      if (error.errorCode === 'AADSTS900144') {
        throw new Error('Client ID is missing. Please set NEXT_PUBLIC_MICROSOFT_CLIENT_ID in your .env.local file.');
      }
      
      if (error.errorCode === 'AADSTS9002326') {
        throw new Error('Cross-origin token redemption error. The redirect URI must be configured as "Web" platform type in Azure Portal (not "SPA"). Or use redirect flow instead of popup.');
      }
      
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
        // Use redirect for logout to match login flow
        await this.msalInstance.logoutRedirect({
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
      // Fetch all folders recursively
      const allFolders: MailFolder[] = [];
      
      // Helper function to fetch folders recursively
      const fetchFoldersRecursive = async (parentId?: string): Promise<MailFolder[]> => {
        const endpoint = parentId 
          ? `/me/mailFolders/${parentId}/childFolders?$top=100&$expand=childFolders($top=100)`
          : `/me/mailFolders?$top=100&$expand=childFolders($top=100)`;
        
        try {
          const response = await this.makeGraphRequest<{ value: MailFolder[] }>(endpoint);
          const folders = response.value || [];
          
          // Process each folder recursively
          for (const folder of folders) {
            if (folder.childFolders && folder.childFolders.length > 0) {
              // Fetch deeper levels if needed
              const deeperFolders = await fetchFoldersRecursive(folder.id);
              folder.childFolders = [...(folder.childFolders || []), ...deeperFolders];
            }
            allFolders.push(folder);
          }
          
          return folders;
        } catch (error) {
          console.error(`Failed to fetch folders for ${parentId || 'root'}:`, error);
          return [];
        }
      };
      
      // Start recursive fetch from root
      await fetchFoldersRecursive();
      
      return allFolders;
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
      // Hent full e-post med attachments
      const response = await this.makeGraphRequest<EmailMessage>(`/me/messages/${emailId}?$select=id,subject,from,toRecipients,ccRecipients,bccRecipients,body,receivedDateTime,isRead,hasAttachments,importance,categories&$expand=attachments`);
      
      // Hvis det er attachments, hent dem også
      if (response.hasAttachments) {
        try {
          const attachmentsResponse = await this.makeGraphRequest<{ value: EmailAttachment[] }>(`/me/messages/${emailId}/attachments`);
          response.attachments = attachmentsResponse.value || [];
        } catch (error) {
          console.error('Failed to load attachments:', error);
          response.attachments = [];
        }
      }
      
      return response;
    } catch (error) {
      console.error('Failed to get email:', error);
      throw error;
    }
  }
  
  async getAttachmentDownloadUrl(emailId: string, attachmentId: string): Promise<string> {
    try {
      // Hent attachment content
      const attachment = await this.makeGraphRequest<{ contentBytes: string; name: string; contentType: string }>(`/me/messages/${emailId}/attachments/${attachmentId}`);
      
      // Konverter base64 til blob URL
      if (attachment.contentBytes) {
        const binaryString = atob(attachment.contentBytes);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        const blob = new Blob([bytes], { type: attachment.contentType || 'application/octet-stream' });
        return URL.createObjectURL(blob);
      }
      
      throw new Error('No content bytes in attachment');
    } catch (error) {
      console.error('Failed to get attachment:', error);
      throw error;
    }
  }

  async sendEmail(request: ComposeEmailRequest): Promise<void> {
    try {
      // Hvis det er attachments, må vi først opprette en draft og legge til attachments
      if (request.attachments && request.attachments.length > 0) {
        // Opprett draft først
        const draftData = {
          subject: request.subject,
          body: {
            contentType: request.bodyType,
            content: request.body,
          },
          toRecipients: request.toRecipients.map(email => ({ emailAddress: { address: email } })),
          ccRecipients: request.ccRecipients?.map(email => ({ emailAddress: { address: email } })),
          bccRecipients: request.bccRecipients?.map(email => ({ emailAddress: { address: email } })),
          importance: request.importance || 'normal',
        };

        const draftResponse = await this.makeGraphRequest<{ id: string }>('/me/messages', {
          method: 'POST',
          body: JSON.stringify(draftData),
        });

        const draftId = draftResponse.id;

        // Legg til attachments
        for (const file of request.attachments) {
          const fileContent = await this.fileToBase64(file);
          await this.makeGraphRequest(`/me/messages/${draftId}/attachments`, {
            method: 'POST',
            body: JSON.stringify({
              '@odata.type': '#microsoft.graph.fileAttachment',
              name: file.name,
              contentType: file.type || 'application/octet-stream',
              contentBytes: fileContent,
            }),
          });
        }

        // Send draft
        await this.makeGraphRequest(`/me/messages/${draftId}/send`, {
          method: 'POST',
        });
      } else {
        // Send direkte uten attachments
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
      }
    } catch (error) {
      console.error('Failed to send email:', error);
      throw error;
    }
  }

  // Helper function to convert File to base64
  private async fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        // Remove data URL prefix (data:image/png;base64,)
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = error => reject(error);
    });
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

  async getCalendarEvents(startDate: string, endDate: string): Promise<CalendarEvent[]> {
    try {
      const response = await this.makeGraphRequest<{ value: CalendarEvent[] }>(
        `/me/calendar/calendarView?startDateTime=${startDate}&endDateTime=${endDate}&$select=id,subject,start,end,location,attendees,organizer,body,isAllDay,showAs,importance,sensitivity,categories`
      );
      return response.value;
    } catch (error) {
      console.error('Failed to get calendar events:', error);
      throw error;
    }
  }

  async createCalendarEvent(event: Partial<CalendarEvent>): Promise<CalendarEvent> {
    try {
      const response = await this.makeGraphRequest<CalendarEvent>('/me/calendar/events', {
        method: 'POST',
        body: JSON.stringify(event),
      });
      return response;
    } catch (error) {
      console.error('Failed to create calendar event:', error);
      throw error;
    }
  }

  async updateCalendarEvent(eventId: string, event: Partial<CalendarEvent>): Promise<CalendarEvent> {
    try {
      await this.makeGraphRequest(`/me/calendar/events/${eventId}`, {
        method: 'PATCH',
        body: JSON.stringify(event),
      });
      const response = await this.makeGraphRequest<CalendarEvent>(
        `/me/calendar/events/${eventId}?$select=id,subject,start,end,location,attendees,organizer,body,isAllDay,showAs,importance,sensitivity,categories`
      );
      return response;
    } catch (error) {
      console.error('Failed to update calendar event:', error);
      throw error;
    }
  }

  async deleteCalendarEvent(eventId: string): Promise<void> {
    try {
      await this.makeGraphRequest(`/me/calendar/events/${eventId}`, {
        method: 'DELETE',
      });
    } catch (error) {
      console.error('Failed to delete calendar event:', error);
      throw error;
    }
  }

  // ============================================================================
  // CONTACTS
  // ============================================================================

  async getContacts(top: number = 100, skip: number = 0): Promise<Contact[]> {
    try {
      const response = await this.makeGraphRequest<{ value: Contact[] }>(
        `/me/contacts?$top=${top}&$skip=${skip}&$select=id,displayName,givenName,surname,emailAddresses,businessPhones,mobilePhone,jobTitle,companyName,officeLocation,birthday,createdDateTime,lastModifiedDateTime`
      );
      return response.value;
    } catch (error) {
      console.error('Failed to get contacts:', error);
      throw error;
    }
  }

  async getContact(contactId: string): Promise<Contact> {
    try {
      const response = await this.makeGraphRequest<Contact>(
        `/me/contacts/${contactId}?$select=id,displayName,givenName,surname,emailAddresses,businessPhones,mobilePhone,jobTitle,companyName,officeLocation,birthday,createdDateTime,lastModifiedDateTime`
      );
      return response;
    } catch (error) {
      console.error('Failed to get contact:', error);
      throw error;
    }
  }

  async createContact(contact: Partial<Contact>): Promise<Contact> {
    try {
      const response = await this.makeGraphRequest<Contact>('/me/contacts', {
        method: 'POST',
        body: JSON.stringify(contact),
      });
      return response;
    } catch (error) {
      console.error('Failed to create contact:', error);
      throw error;
    }
  }

  async updateContact(contactId: string, contact: Partial<Contact>): Promise<Contact> {
    try {
      await this.makeGraphRequest(`/me/contacts/${contactId}`, {
        method: 'PATCH',
        body: JSON.stringify(contact),
      });
      return this.getContact(contactId);
    } catch (error) {
      console.error('Failed to update contact:', error);
      throw error;
    }
  }

  async deleteContact(contactId: string): Promise<void> {
    try {
      await this.makeGraphRequest(`/me/contacts/${contactId}`, {
        method: 'DELETE',
      });
    } catch (error) {
      console.error('Failed to delete contact:', error);
      throw error;
    }
  }

  // ============================================================================
  // ONEDRIVE
  // ============================================================================

  async getOneDriveItems(folderId: string = 'root', top: number = 100): Promise<OneDriveItem[]> {
    try {
      const endpoint = folderId === 'root' 
        ? `/me/drive/root/children?$top=${top}&$select=id,name,size,webUrl,createdDateTime,lastModifiedDateTime,folder,file`
        : `/me/drive/items/${folderId}/children?$top=${top}&$select=id,name,size,webUrl,createdDateTime,lastModifiedDateTime,folder,file`;
      const response = await this.makeGraphRequest<{ value: OneDriveItem[] }>(endpoint);
      return response.value;
    } catch (error) {
      console.error('Failed to get OneDrive items:', error);
      throw error;
    }
  }

  /**
   * Upload file to OneDrive
   * @param file File to upload
   * @param folderPath Path in OneDrive (e.g., "DriftPro/documents/company123")
   * @returns Uploaded file information with download URL
   */
  async uploadFileToOneDrive(file: File, folderPath: string = 'DriftPro'): Promise<{
    id: string;
    name: string;
    webUrl: string;
    downloadUrl: string;
    size: number;
    createdDateTime: string;
  }> {
    try {
      // Ensure folder exists and get folder ID
      const folderId = await this.ensureOneDriveFolder(folderPath);
      
      // For files larger than 4MB, use upload session (resumable upload)
      if (file.size > 4 * 1024 * 1024) {
        return await this.uploadLargeFileToOneDrive(file, folderId);
      }

      // For smaller files, use simple upload
      const fileName = `${Date.now()}_${file.name}`;
      const endpoint = `/me/drive/items/${folderId}:/${fileName}:/content`;
      
      // Convert file to ArrayBuffer
      const arrayBuffer = await file.arrayBuffer();
      
      const response = await this.makeGraphRequest<{
        id: string;
        name: string;
        webUrl: string;
        size: number;
        createdDateTime: string;
      }>(endpoint, {
        method: 'PUT',
        headers: {
          'Content-Type': file.type || 'application/octet-stream',
        },
        body: arrayBuffer,
      });

      // Get download URL
      const downloadUrl = await this.getOneDriveDownloadUrl(response.id);

      return {
        ...response,
        downloadUrl,
      };
    } catch (error) {
      console.error('Failed to upload file to OneDrive:', error);
      throw error;
    }
  }

  /**
   * Upload large file (>4MB) using resumable upload session
   */
  private async uploadLargeFileToOneDrive(file: File, folderId: string): Promise<{
    id: string;
    name: string;
    webUrl: string;
    downloadUrl: string;
    size: number;
    createdDateTime: string;
  }> {
    try {
      const fileName = `${Date.now()}_${file.name}`;
      
      // Create upload session
      const sessionResponse = await this.makeGraphRequest<{
        uploadUrl: string;
        expirationDateTime: string;
      }>(`/me/drive/items/${folderId}:/${fileName}:/createUploadSession`, {
        method: 'POST',
        body: JSON.stringify({
          item: {
            '@microsoft.graph.conflictBehavior': 'rename',
            name: fileName,
          },
        }),
      });

      // Upload file in chunks
      const chunkSize = 4 * 1024 * 1024; // 4MB chunks
      const totalChunks = Math.ceil(file.size / chunkSize);
      const arrayBuffer = await file.arrayBuffer();

      for (let i = 0; i < totalChunks; i++) {
        const start = i * chunkSize;
        const end = Math.min(start + chunkSize, file.size);
        const chunk = arrayBuffer.slice(start, end);

        const rangeStart = start;
        const rangeEnd = end - 1;
        const contentRange = `bytes ${rangeStart}-${rangeEnd}/${file.size}`;

        await fetch(sessionResponse.uploadUrl, {
          method: 'PUT',
          headers: {
            'Content-Length': (end - start).toString(),
            'Content-Range': contentRange,
          },
          body: chunk,
        });
      }

      // Get uploaded file info
      const fileInfo = await this.makeGraphRequest<{
        id: string;
        name: string;
        webUrl: string;
        size: number;
        createdDateTime: string;
      }>(`/me/drive/items/${folderId}:/${fileName}`);

      const downloadUrl = await this.getOneDriveDownloadUrl(fileInfo.id);

      return {
        ...fileInfo,
        downloadUrl,
      };
    } catch (error) {
      console.error('Failed to upload large file to OneDrive:', error);
      throw error;
    }
  }

  /**
   * Ensure folder exists in OneDrive, create if it doesn't
   */
  async ensureOneDriveFolder(folderPath: string): Promise<string> {
    try {
      const parts = folderPath.split('/').filter(p => p);
      let currentFolderId = 'root';

      for (const folderName of parts) {
        // Check if folder exists
        const children = await this.getOneDriveItems(currentFolderId, 1000);
        const existingFolder = children.find(
          item => item.folder && item.name === folderName
        );

        if (existingFolder) {
          currentFolderId = existingFolder.id;
        } else {
          // Create folder
          const endpoint = currentFolderId === 'root'
            ? '/me/drive/root/children'
            : `/me/drive/items/${currentFolderId}/children`;
          
          const newFolder = await this.makeGraphRequest<{ id: string }>(endpoint, {
            method: 'POST',
            body: JSON.stringify({
              name: folderName,
              folder: {},
              '@microsoft.graph.conflictBehavior': 'rename',
            }),
          });
          
          currentFolderId = newFolder.id;
        }
      }

      return currentFolderId;
    } catch (error) {
      console.error('Failed to ensure OneDrive folder:', error);
      throw error;
    }
  }

  /**
   * Get download URL for OneDrive file
   */
  async getOneDriveDownloadUrl(itemId: string): Promise<string> {
    try {
      const response = await this.makeGraphRequest<{ '@microsoft.graph.downloadUrl': string }>(
        `/me/drive/items/${itemId}?$select=@microsoft.graph.downloadUrl`
      );
      return response['@microsoft.graph.downloadUrl'];
    } catch (error) {
      console.error('Failed to get OneDrive download URL:', error);
      throw error;
    }
  }

  /**
   * Delete file from OneDrive
   */
  async deleteOneDriveFile(itemId: string): Promise<void> {
    try {
      await this.makeGraphRequest(`/me/drive/items/${itemId}`, {
        method: 'DELETE',
      });
    } catch (error) {
      console.error('Failed to delete OneDrive file:', error);
      throw error;
    }
  }

  /**
   * Get OneDrive storage quota
   */
  async getOneDriveQuota(): Promise<{
    total: number;
    used: number;
    remaining: number;
  }> {
    try {
      const response = await this.makeGraphRequest<{
        quota: {
          total: number;
          used: number;
          remaining: number;
        };
      }>('/me/drive?$select=quota');
      
      return response.quota;
    } catch (error) {
      console.error('Failed to get OneDrive quota:', error);
      throw error;
    }
  }

  // ============================================================================
  // EMAIL ACTIONS (Archive, Delete, Move, Categorize, Flag)
  // ============================================================================

  async archiveEmail(emailId: string): Promise<void> {
    try {
      await this.makeGraphRequest(`/me/messages/${emailId}/move`, {
        method: 'POST',
        body: JSON.stringify({
          destinationId: 'archive',
        }),
      });
    } catch (error) {
      console.error('Failed to archive email:', error);
      throw error;
    }
  }

  async categorizeEmail(emailId: string, categories: string[]): Promise<void> {
    try {
      await this.makeGraphRequest(`/me/messages/${emailId}`, {
        method: 'PATCH',
        body: JSON.stringify({
          categories,
        }),
      });
    } catch (error) {
      console.error('Failed to categorize email:', error);
      throw error;
    }
  }

  async flagEmail(emailId: string, flag: { flagStatus: 'flagged' | 'complete' | 'notFlagged' }): Promise<void> {
    try {
      await this.makeGraphRequest(`/me/messages/${emailId}`, {
        method: 'PATCH',
        body: JSON.stringify({
          flag: flag,
        }),
      });
    } catch (error) {
      console.error('Failed to flag email:', error);
      throw error;
    }
  }

  async starEmail(emailId: string, isStarred: boolean): Promise<void> {
    try {
      // Use importance as a proxy for starring
      await this.makeGraphRequest(`/me/messages/${emailId}`, {
        method: 'PATCH',
        body: JSON.stringify({
          importance: isStarred ? 'high' : 'normal',
        }),
      });
    } catch (error) {
      console.error('Failed to star email:', error);
      throw error;
    }
  }

  async markAsRead(emailId: string, isRead: boolean): Promise<void> {
    try {
      await this.makeGraphRequest(`/me/messages/${emailId}`, {
        method: 'PATCH',
        body: JSON.stringify({
          isRead: isRead,
        }),
      });
    } catch (error) {
      console.error('Failed to mark email as read:', error);
      throw error;
    }
  }

  async batchUpdateEmails(emailIds: string[], updates: { isRead?: boolean; categories?: string[]; importance?: string }): Promise<void> {
    try {
      // Graph API doesn't support true batch for messages, so we'll do sequential
      await Promise.all(
        emailIds.map(emailId =>
          this.makeGraphRequest(`/me/messages/${emailId}`, {
            method: 'PATCH',
            body: JSON.stringify(updates),
          })
        )
      );
    } catch (error) {
      console.error('Failed to batch update emails:', error);
      throw error;
    }
  }

  async createFolder(folderName: string, parentFolderId: string = 'msgfolderroot'): Promise<MailFolder> {
    try {
      const response = await this.makeGraphRequest<MailFolder>(
        `/me/mailFolders/${parentFolderId}/childFolders`,
        {
          method: 'POST',
          body: JSON.stringify({
            displayName: folderName,
          }),
        }
      );
      return response;
    } catch (error) {
      console.error('Failed to create folder:', error);
      throw error;
    }
  }

  async deleteFolder(folderId: string): Promise<void> {
    try {
      await this.makeGraphRequest(`/me/mailFolders/${folderId}`, {
        method: 'DELETE',
      });
    } catch (error) {
      console.error('Failed to delete folder:', error);
      throw error;
    }
  }
}

// Default configuration
// For multi-tenant apps, use 'common' or 'organizations'
// 'common' allows both Microsoft accounts and organizational accounts
// 'organizations' allows only organizational accounts (work/school)
// For single-tenant apps, use the specific tenant ID
const defaultConfig: MicrosoftGraphConfig = {
  clientId: process.env.NEXT_PUBLIC_MICROSOFT_CLIENT_ID || '',
  tenantId: process.env.NEXT_PUBLIC_MICROSOFT_TENANT_ID || 'common',
  redirectUri: process.env.NEXT_PUBLIC_MICROSOFT_REDIRECT_URI || (typeof window !== 'undefined' ? window.location.origin + '/dashboard/email-system' : 'http://localhost:3000/dashboard/email-system'),
  scopes: [
    'User.Read',
    'Mail.Read',
    'Mail.ReadWrite',
    'Mail.Send',
    'Contacts.Read',
    'Contacts.ReadWrite',
    'Calendars.Read',
    'Calendars.ReadWrite',
    'Files.Read',
    'Files.ReadWrite',
    'Files.Read.All',
    'offline_access',
    'openid',
    'profile',
    'email'
  ],
};

export const microsoftGraphService = new MicrosoftGraphService(defaultConfig);
