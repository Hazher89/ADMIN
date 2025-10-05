import { Client } from '@microsoft/microsoft-graph-client';
import { AuthenticationProvider } from '@microsoft/microsoft-graph-client';
import { PublicClientApplication, AccountInfo } from '@azure/msal-browser';
import { msalInstance, graphScopes, ONEDRIVE_FOLDERS, FOLDER_STRUCTURE, msalConfig } from './onedrive-config';

// Custom authentication provider for MS Graph
class MsalAuthenticationProvider implements AuthenticationProvider {
  constructor(private msalInstance: PublicClientApplication) {}

  async getAccessToken(): Promise<string> {
    try {
      const account = this.msalInstance.getActiveAccount();
      if (!account) {
        throw new Error('No active account found');
      }

      const response = await this.msalInstance.acquireTokenSilent({
        scopes: graphScopes,
        account: account,
      });

      return response.accessToken;
    } catch (error) {
      console.error('Error getting access token:', error);
      throw error;
    }
  }
}

// OneDrive service class
export class OneDriveService {
  private graphClient: Client;
  private authProvider: MsalAuthenticationProvider;
  private initialized: boolean = false;

  constructor() {
    this.authProvider = new MsalAuthenticationProvider(msalInstance);
    this.graphClient = Client.initWithMiddleware({
      authProvider: this.authProvider,
    });
  }

  // Initialize MSAL
  private async initialize(): Promise<void> {
    if (!this.initialized) {
      await msalInstance.initialize();
      this.initialized = true;
    }
  }

  // Autentisering med 2FA
  async loginWith2FA(): Promise<AccountInfo | null> {
    try {
      await this.initialize();
      
      // Sjekk om Client ID er konfigurert
      if (msalConfig.auth.clientId === 'your-client-id-here' || !msalConfig.auth.clientId) {
        throw new Error('Microsoft Client ID er ikke konfigurert. Sjekk at NEXT_PUBLIC_MICROSOFT_CLIENT_ID er satt i miljøvariablene.');
      }

      const loginResponse = await msalInstance.loginPopup({
        scopes: graphScopes,
        prompt: 'consent', // Force consent prompt to allow user to grant permissions
      });

      return loginResponse.account;
    } catch (error) {
      console.error('Login failed:', error);
      throw error; // Re-throw så UI kan vise feilen
    }
  }

  // Logout
  async logout(): Promise<void> {
    await this.initialize();
    const account = msalInstance.getActiveAccount();
    if (account) {
      await msalInstance.logoutPopup({
        account: account,
      });
    }
  }

  // Sjekk om bruker er logget inn
  isLoggedIn(): boolean {
    try {
      return msalInstance.getActiveAccount() !== null;
    } catch (error) {
      return false;
    }
  }

  // Hent aktiv bruker
  getActiveAccount(): AccountInfo | null {
    try {
      return msalInstance.getActiveAccount();
    } catch (error) {
      return null;
    }
  }

  // Opprett mappestruktur
  async createFolderStructure(): Promise<void> {
    try {
      await this.initialize();
      
      // Opprett hovedmapper
      for (const [folderName, config] of Object.entries(FOLDER_STRUCTURE)) {
        await this.createFolder(folderName);
        
        // Opprett undermapper
        for (const subfolder of config.subfolders) {
          await this.createFolder(`${folderName}/${subfolder}`);
        }
      }
    } catch (error) {
      console.error('Error creating folder structure:', error);
    }
  }

  // Opprett mappe
  async createFolder(folderPath: string): Promise<any> {
    try {
      await this.initialize();
      
      const folderName = folderPath.split('/').pop();
      const parentPath = folderPath.split('/').slice(0, -1).join('/');
      
      const folderData = {
        name: folderName,
        folder: {},
        '@microsoft.graph.conflictBehavior': 'rename'
      };

      if (parentPath) {
        // Opprett i undermappe
        const parentFolder = await this.getFolderByPath(parentPath);
        if (parentFolder) {
          return await this.graphClient
            .api(`/me/drive/items/${parentFolder.id}/children`)
            .post(folderData);
        }
      } else {
        // Opprett i root
        return await this.graphClient
          .api('/me/drive/root/children')
          .post(folderData);
      }
    } catch (error) {
      console.error(`Error creating folder ${folderPath}:`, error);
    }
  }

  // Hent mappe etter sti
  async getFolderByPath(folderPath: string): Promise<any> {
    try {
      await this.initialize();
      
      const pathSegments = folderPath.split('/');
      let currentFolder = null;

      for (const segment of pathSegments) {
        if (!currentFolder) {
          // Start fra root
          const response = await this.graphClient
            .api('/me/drive/root/children')
            .filter(`name eq '${segment}'`)
            .get();
          
          if (response.value && response.value.length > 0) {
            currentFolder = response.value[0];
          } else {
            return null;
          }
        } else {
          // Gå dypere i mappestrukturen
          const response = await this.graphClient
            .api(`/me/drive/items/${currentFolder.id}/children`)
            .filter(`name eq '${segment}'`)
            .get();
          
          if (response.value && response.value.length > 0) {
            currentFolder = response.value[0];
          } else {
            return null;
          }
        }
      }

      return currentFolder;
    } catch (error) {
      console.error(`Error getting folder ${folderPath}:`, error);
      return null;
    }
  }

  // Last opp fil til OneDrive
  async uploadFile(file: File, folderPath: string, fileName?: string): Promise<any> {
    try {
      await this.initialize();
      
      const folder = await this.getFolderByPath(folderPath);
      if (!folder) {
        throw new Error(`Folder ${folderPath} not found`);
      }

      const uploadFileName = fileName || file.name;
      
      // Konverter fil til ArrayBuffer
      const arrayBuffer = await file.arrayBuffer();
      
      return await this.graphClient
        .api(`/me/drive/items/${folder.id}:/${uploadFileName}:/content`)
        .put(arrayBuffer);
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error;
    }
  }

  // Last opp PDF til kjøreliste-mappe
  async uploadRoutePDF(pdfBuffer: ArrayBuffer, routeId: string, date: string, partnerName: string): Promise<string> {
    try {
      await this.initialize();
      
      const folderPath = `${ONEDRIVE_FOLDERS.KJORELISTER}/${date.split('-')[0]}/${date}`;
      const fileName = `Kjøreliste_${routeId}_${partnerName}_${date}.pdf`;
      
      // Opprett mappe hvis den ikke eksisterer
      await this.createFolder(folderPath);
      
      const folder = await this.getFolderByPath(folderPath);
      if (!folder) {
        throw new Error(`Could not create folder ${folderPath}`);
      }

      const uploadResult = await this.graphClient
        .api(`/me/drive/items/${folder.id}:/${fileName}:/content`)
        .put(pdfBuffer);

      return uploadResult.webUrl;
    } catch (error) {
      console.error('Error uploading route PDF:', error);
      throw error;
    }
  }

  // Last opp skannelapp
  async uploadProductLabel(pdfBuffer: ArrayBuffer, orderId: string, productName: string, customerName: string): Promise<string> {
    try {
      await this.initialize();
      
      const folderPath = `${ONEDRIVE_FOLDERS.SKANNELAPPER}/Ordre/${orderId}`;
      const fileName = `Skannelapp_${productName}_${customerName}.pdf`;
      
      // Opprett mappe hvis den ikke eksisterer
      await this.createFolder(folderPath);
      
      const folder = await this.getFolderByPath(folderPath);
      if (!folder) {
        throw new Error(`Could not create folder ${folderPath}`);
      }

      const uploadResult = await this.graphClient
        .api(`/me/drive/items/${folder.id}:/${fileName}:/content`)
        .put(pdfBuffer);

      return uploadResult.webUrl;
    } catch (error) {
      console.error('Error uploading product label:', error);
      throw error;
    }
  }

  // Søk i OneDrive
  async searchFiles(query: string): Promise<any[]> {
    try {
      await this.initialize();
      
      const response = await this.graphClient
        .api('/me/drive/root/search')
        .query({ q: query })
        .get();

      return response.value || [];
    } catch (error) {
      console.error('Error searching files:', error);
      return [];
    }
  }

  // Hent alle filer i en mappe
  async getFilesInFolder(folderPath: string): Promise<any[]> {
    try {
      await this.initialize();
      
      const folder = await this.getFolderByPath(folderPath);
      if (!folder) {
        return [];
      }

      const response = await this.graphClient
        .api(`/me/drive/items/${folder.id}/children`)
        .get();

      return response.value || [];
    } catch (error) {
      console.error(`Error getting files in folder ${folderPath}:`, error);
      return [];
    }
  }

  // Hent fil-URL for visning
  async getFileUrl(fileId: string): Promise<string> {
    try {
      await this.initialize();
      
      const response = await this.graphClient
        .api(`/me/drive/items/${fileId}`)
        .get();

      return response.webUrl;
    } catch (error) {
      console.error('Error getting file URL:', error);
      throw error;
    }
  }

  // Last ned fil
  async downloadFile(fileId: string): Promise<Blob> {
    try {
      await this.initialize();
      
      const response = await this.graphClient
        .api(`/me/drive/items/${fileId}/content`)
        .get();

      return response;
    } catch (error) {
      console.error('Error downloading file:', error);
      throw error;
    }
  }
}

// Eksporter singleton instance
export const oneDriveService = new OneDriveService();
