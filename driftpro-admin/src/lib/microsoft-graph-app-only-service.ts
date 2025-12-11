/**
 * Microsoft Graph App-Only Service
 * 
 * This service provides permanent access to Microsoft Graph API (Email & OneDrive)
 * without requiring user login. Uses client credentials flow (app-only authentication).
 * 
 * Setup required:
 * 1. Register app in Azure AD with Application permissions (not Delegated)
 * 2. Grant admin consent for permissions
 * 3. Create client secret
 * 4. Set environment variables: GRAPH_TENANT_ID, GRAPH_CLIENT_ID, GRAPH_CLIENT_SECRET
 */

interface TokenCache {
  token: string;
  expiresAt: number;
}

class MicrosoftGraphAppOnlyService {
  private tokenCache: TokenCache | null = null;
  private readonly TOKEN_BUFFER_TIME = 5 * 60 * 1000; // Refresh 5 minutes before expiry

  /**
   * Get app-only access token using client credentials flow
   * Tokens are cached and automatically refreshed
   */
  async getAccessToken(): Promise<string> {
    // Check if we have a valid cached token
    if (this.tokenCache && Date.now() < this.tokenCache.expiresAt - this.TOKEN_BUFFER_TIME) {
      return this.tokenCache.token;
    }

    // Fetch new token
    const tenantId = process.env.GRAPH_TENANT_ID;
    const clientId = process.env.GRAPH_CLIENT_ID;
    const clientSecret = process.env.GRAPH_CLIENT_SECRET;

    if (!tenantId || !clientId || !clientSecret) {
      throw new Error(
        'Microsoft Graph app-only credentials mangler. ' +
        'Sett GRAPH_TENANT_ID, GRAPH_CLIENT_ID og GRAPH_CLIENT_SECRET i miljøvariabler.'
      );
    }

    const tokenUrl = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`;
    const body = new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: clientId,
      client_secret: clientSecret,
      scope: 'https://graph.microsoft.com/.default',
    });

    try {
      const response = await fetch(tokenUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body,
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => '');
        throw new Error(
          `Kunne ikke hente app-only token: ${response.status} ${response.statusText}. ${errorText}`
        );
      }

      const data = await response.json();
      const expiresIn = (data.expires_in || 3600) * 1000; // Convert to milliseconds
      
      // Cache the token
      this.tokenCache = {
        token: data.access_token,
        expiresAt: Date.now() + expiresIn,
      };

      return data.access_token;
    } catch (error) {
      console.error('Error fetching app-only token:', error);
      throw error;
    }
  }

  /**
   * Check if service is configured
   */
  isConfigured(): boolean {
    return !!(
      process.env.GRAPH_TENANT_ID &&
      process.env.GRAPH_CLIENT_ID &&
      process.env.GRAPH_CLIENT_SECRET
    );
  }

  /**
   * Make authenticated request to Microsoft Graph API
   */
  async makeGraphRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const token = await this.getAccessToken();
    const url = endpoint.startsWith('https://')
      ? endpoint
      : `https://graph.microsoft.com/v1.0${endpoint}`;

    const response = await fetch(url, {
      ...options,
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        `Graph API error: ${response.status} ${response.statusText} - ${
          errorData.error?.message || 'Unknown error'
        }`
      );
    }

    return response.json();
  }

  /**
   * Send email using app-only authentication
   * @param senderUpn User Principal Name of the sender (e.g., noreply@company.com)
   */
  async sendEmail(
    senderUpn: string,
    to: string | string[],
    subject: string,
    body: string,
    bodyType: 'html' | 'text' = 'html',
    cc?: string[],
    bcc?: string[],
    attachments?: Array<{ name: string; content: string; contentType: string }>
  ): Promise<void> {
    const recipients = Array.isArray(to)
      ? to.map((email) => ({ emailAddress: { address: email } }))
      : [{ emailAddress: { address: to } }];

    const message: any = {
      subject,
      body: {
        contentType: bodyType === 'html' ? 'HTML' : 'Text',
        content: body,
      },
      toRecipients: recipients,
    };

    if (cc && cc.length > 0) {
      message.ccRecipients = cc.map((email) => ({
        emailAddress: { address: email },
      }));
    }

    if (bcc && bcc.length > 0) {
      message.bccRecipients = bcc.map((email) => ({
        emailAddress: { address: email },
      }));
    }

    // If attachments, create draft first, add attachments, then send
    if (attachments && attachments.length > 0) {
      // Create draft
      const draftResponse = await this.makeGraphRequest<{ id: string }>(
        `/users/${encodeURIComponent(senderUpn)}/messages`,
        {
          method: 'POST',
          body: JSON.stringify(message),
        }
      );

      // Add attachments
      for (const attachment of attachments) {
        await this.makeGraphRequest(
          `/users/${encodeURIComponent(senderUpn)}/messages/${draftResponse.id}/attachments`,
          {
            method: 'POST',
            body: JSON.stringify({
              '@odata.type': '#microsoft.graph.fileAttachment',
              name: attachment.name,
              contentType: attachment.contentType,
              contentBytes: attachment.content,
            }),
          }
        );
      }

      // Send draft
      await this.makeGraphRequest(
        `/users/${encodeURIComponent(senderUpn)}/messages/${draftResponse.id}/send`,
        {
          method: 'POST',
        }
      );
    } else {
      // Send directly
      await this.makeGraphRequest(
        `/users/${encodeURIComponent(senderUpn)}/sendMail`,
        {
          method: 'POST',
          body: JSON.stringify({
            message,
            saveToSentItems: true,
          }),
        }
      );
    }
  }

  /**
   * Upload file to OneDrive using app-only authentication
   * @param userUpn User Principal Name whose OneDrive to use (e.g., service@company.com)
   * @param filePath Path in OneDrive (e.g., "DriftPro/documents/file.pdf")
   * @param fileContent File content as ArrayBuffer or Blob
   * @param contentType MIME type of the file
   */
  async uploadToOneDrive(
    userUpn: string,
    filePath: string,
    fileContent: ArrayBuffer | Blob,
    contentType: string = 'application/octet-stream'
  ): Promise<{
    id: string;
    name: string;
    webUrl: string;
    downloadUrl: string;
    size: number;
  }> {
    // Ensure folder structure exists
    const pathParts = filePath.split('/');
    const fileName = pathParts.pop()!;
    const folderPath = pathParts.join('/');

    let folderId = 'root';
    if (folderPath) {
      folderId = await this.ensureOneDriveFolder(userUpn, folderPath);
    }

    // Convert to ArrayBuffer if Blob
    const arrayBuffer =
      fileContent instanceof Blob
        ? await fileContent.arrayBuffer()
        : fileContent;

    // For files larger than 4MB, use upload session
    if (arrayBuffer.byteLength > 4 * 1024 * 1024) {
      return this.uploadLargeFileToOneDrive(
        userUpn,
        folderId,
        fileName,
        arrayBuffer,
        contentType
      );
    }

    // Simple upload for smaller files
    const uploadResponse = await this.makeGraphRequest<{
      id: string;
      name: string;
      webUrl: string;
      size: number;
    }>(
      `/users/${encodeURIComponent(userUpn)}/drive/items/${folderId}:/${fileName}:/content`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': contentType,
        },
        body: arrayBuffer,
      }
    );

    // Get download URL
    const downloadUrl = await this.getOneDriveDownloadUrl(userUpn, uploadResponse.id);

    return {
      ...uploadResponse,
      downloadUrl,
    };
  }

  /**
   * Ensure folder exists in OneDrive, create if it doesn't
   */
  private async ensureOneDriveFolder(
    userUpn: string,
    folderPath: string
  ): Promise<string> {
    const parts = folderPath.split('/').filter((p) => p);
    let currentFolderId = 'root';

    for (const folderName of parts) {
      // Check if folder exists
      const children = await this.makeGraphRequest<{
        value: Array<{ id: string; name: string; folder?: any }>;
      }>(
        `/users/${encodeURIComponent(userUpn)}/drive/items/${currentFolderId}/children?$filter=name eq '${folderName}'`
      );

      const existingFolder = children.value?.find(
        (item) => item.folder && item.name === folderName
      );

      if (existingFolder) {
        currentFolderId = existingFolder.id;
      } else {
        // Create folder
        const newFolder = await this.makeGraphRequest<{ id: string }>(
          currentFolderId === 'root'
            ? `/users/${encodeURIComponent(userUpn)}/drive/root/children`
            : `/users/${encodeURIComponent(userUpn)}/drive/items/${currentFolderId}/children`,
          {
            method: 'POST',
            body: JSON.stringify({
              name: folderName,
              folder: {},
              '@microsoft.graph.conflictBehavior': 'rename',
            }),
          }
        );

        currentFolderId = newFolder.id;
      }
    }

    return currentFolderId;
  }

  /**
   * Upload large file using resumable upload session
   */
  private async uploadLargeFileToOneDrive(
    userUpn: string,
    folderId: string,
    fileName: string,
    fileContent: ArrayBuffer,
    contentType: string
  ): Promise<{
    id: string;
    name: string;
    webUrl: string;
    downloadUrl: string;
    size: number;
  }> {
    // Create upload session
    const sessionResponse = await this.makeGraphRequest<{
      uploadUrl: string;
      expirationDateTime: string;
    }>(
      `/users/${encodeURIComponent(userUpn)}/drive/items/${folderId}:/${fileName}:/createUploadSession`,
      {
        method: 'POST',
        body: JSON.stringify({
          item: {
            '@microsoft.graph.conflictBehavior': 'rename',
            name: fileName,
          },
        }),
      }
    );

    // Upload in chunks
    const chunkSize = 4 * 1024 * 1024; // 4MB chunks
    const totalChunks = Math.ceil(fileContent.byteLength / chunkSize);

    for (let i = 0; i < totalChunks; i++) {
      const start = i * chunkSize;
      const end = Math.min(start + chunkSize, fileContent.byteLength);
      const chunk = fileContent.slice(start, end);

      const rangeStart = start;
      const rangeEnd = end - 1;
      const contentRange = `bytes ${rangeStart}-${rangeEnd}/${fileContent.byteLength}`;

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
    }>(
      `/users/${encodeURIComponent(userUpn)}/drive/items/${folderId}:/${fileName}`
    );

    const downloadUrl = await this.getOneDriveDownloadUrl(userUpn, fileInfo.id);

    return {
      ...fileInfo,
      downloadUrl,
    };
  }

  /**
   * Get download URL for OneDrive file
   */
  private async getOneDriveDownloadUrl(
    userUpn: string,
    itemId: string
  ): Promise<string> {
    const response = await this.makeGraphRequest<{
      '@microsoft.graph.downloadUrl': string;
    }>(
      `/users/${encodeURIComponent(userUpn)}/drive/items/${itemId}?$select=@microsoft.graph.downloadUrl`
    );
    return response['@microsoft.graph.downloadUrl'];
  }

  /**
   * Delete file from OneDrive
   */
  async deleteFromOneDrive(userUpn: string, itemId: string): Promise<void> {
    await this.makeGraphRequest(
      `/users/${encodeURIComponent(userUpn)}/drive/items/${itemId}`,
      {
        method: 'DELETE',
      }
    );
  }

  /**
   * List files in OneDrive folder
   */
  async listOneDriveFiles(
    userUpn: string,
    folderPath: string = 'root'
  ): Promise<Array<{
    id: string;
    name: string;
    size?: number;
    webUrl: string;
    createdDateTime?: string;
    lastModifiedDateTime?: string;
  }>> {
    const folderId =
      folderPath === 'root'
        ? 'root'
        : await this.ensureOneDriveFolder(userUpn, folderPath);

    const response = await this.makeGraphRequest<{
      value: Array<{
        id: string;
        name: string;
        size?: number;
        webUrl: string;
        createdDateTime?: string;
        lastModifiedDateTime?: string;
      }>;
    }>(
      `/users/${encodeURIComponent(userUpn)}/drive/items/${folderId}/children`
    );

    return response.value || [];
  }
}

// Export singleton instance
export const microsoftGraphAppOnlyService = new MicrosoftGraphAppOnlyService();
