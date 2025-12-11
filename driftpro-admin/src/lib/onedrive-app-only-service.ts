/**
 * OneDrive App-Only Service (Frontend Wrapper)
 * 
 * This service provides permanent access to OneDrive without requiring user login.
 * Uses backend API routes that handle app-only authentication.
 */

export interface OneDriveFile {
  id: string;
  name: string;
  size?: number;
  webUrl: string;
  downloadUrl?: string;
  createdDateTime?: string;
  lastModifiedDateTime?: string;
}

export interface OneDriveUploadResult {
  success: boolean;
  fileId?: string;
  fileName?: string;
  webUrl?: string;
  downloadUrl?: string;
  size?: number;
  error?: string;
}

class OneDriveAppOnlyService {
  private baseUrl: string;

  constructor() {
    this.baseUrl =
      typeof window !== 'undefined'
        ? window.location.origin
        : 'http://localhost:3000';
  }

  /**
   * Upload file to OneDrive
   * @param file File to upload
   * @param folderPath Path in OneDrive (e.g., "DriftPro/documents")
   * @param fileName Optional custom file name
   * @param userUpn Optional user UPN (defaults to configured sender)
   */
  async uploadFile(
    file: File,
    folderPath: string = 'DriftPro',
    fileName?: string,
    userUpn?: string
  ): Promise<OneDriveUploadResult> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folderPath', folderPath);
      if (fileName) {
        formData.append('fileName', fileName);
      }
      if (userUpn) {
        formData.append('userUpn', userUpn);
      }

      const response = await fetch(`${this.baseUrl}/api/onedrive/upload`, {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        console.log('✅ Fil lastet opp til OneDrive:', result.fileName);
        return {
          success: true,
          fileId: result.fileId,
          fileName: result.fileName,
          webUrl: result.webUrl,
          downloadUrl: result.downloadUrl,
          size: result.size,
        };
      } else {
        return {
          success: false,
          error: result.error || 'Ukjent feil ved opplasting',
        };
      }
    } catch (error) {
      console.error('❌ Feil ved opplasting til OneDrive:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Ukjent feil',
      };
    }
  }

  /**
   * List files in OneDrive folder
   * @param folderPath Path in OneDrive (e.g., "DriftPro/documents")
   * @param userUpn Optional user UPN (defaults to configured sender)
   */
  async listFiles(
    folderPath: string = 'root',
    userUpn?: string
  ): Promise<{ success: boolean; files?: OneDriveFile[]; error?: string }> {
    try {
      const params = new URLSearchParams();
      params.append('folderPath', folderPath);
      if (userUpn) {
        params.append('userUpn', userUpn);
      }

      const response = await fetch(
        `${this.baseUrl}/api/onedrive/list?${params.toString()}`
      );

      const result = await response.json();

      if (result.success) {
        return {
          success: true,
          files: result.files || [],
        };
      } else {
        return {
          success: false,
          error: result.error || 'Ukjent feil ved listing',
        };
      }
    } catch (error) {
      console.error('❌ Feil ved listing av OneDrive-filer:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Ukjent feil',
      };
    }
  }

  /**
   * Delete file from OneDrive
   * @param itemId OneDrive item ID
   * @param userUpn Optional user UPN (defaults to configured sender)
   */
  async deleteFile(
    itemId: string,
    userUpn?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/api/onedrive/delete`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemId,
          userUpn,
        }),
      });

      const result = await response.json();

      if (result.success) {
        console.log('✅ Fil slettet fra OneDrive:', itemId);
        return { success: true };
      } else {
        return {
          success: false,
          error: result.error || 'Ukjent feil ved sletting',
        };
      }
    } catch (error) {
      console.error('❌ Feil ved sletting fra OneDrive:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Ukjent feil',
      };
    }
  }

  /**
   * Check if OneDrive service is available
   */
  async isAvailable(): Promise<boolean> {
    try {
      const result = await this.listFiles('root');
      return result.success;
    } catch {
      return false;
    }
  }
}

// Export singleton instance
export const oneDriveAppOnlyService = new OneDriveAppOnlyService();
