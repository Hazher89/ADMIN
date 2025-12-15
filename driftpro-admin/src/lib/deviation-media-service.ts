import { storage } from './firebase';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { DeviationMedia } from './firebase-services';

export class DeviationMediaService {
  /**
   * Upload media file (image, video, document) for a deviation
   */
  static async uploadMedia(
    file: File,
    deviationId: string,
    companyId: string,
    uploadedBy: string,
    description?: string
  ): Promise<DeviationMedia> {
    if (!storage) {
      throw new Error('Firebase Storage is not initialized');
    }

    try {
      // Determine file type
      const fileType = file.type.startsWith('image/') ? 'image' :
                      file.type.startsWith('video/') ? 'video' :
                      file.type.startsWith('audio/') ? 'audio' :
                      'document';

      // Generate unique filename
      const timestamp = Date.now();
      const fileName = `${timestamp}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
      const filePath = `deviations/${companyId}/${deviationId}/${fileName}`;
      
      // Upload file
      const storageRef = ref(storage, filePath);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);

      // Generate thumbnail for images and videos
      let thumbnailUrl: string | undefined;
      if (fileType === 'image') {
        thumbnailUrl = url; // Use same URL for images
      } else if (fileType === 'video') {
        // For videos, we could generate a thumbnail, but for now use a placeholder
        // In production, you might want to use a video processing service
        thumbnailUrl = undefined;
      }

      const media: DeviationMedia = {
        id: `media_${timestamp}`,
        url,
        type: fileType,
        fileName: file.name,
        fileSize: file.size,
        thumbnailUrl,
        uploadedBy,
        uploadedAt: new Date().toISOString(),
        description: description || ''
      };

      return media;
    } catch (error) {
      console.error('Error uploading deviation media:', error);
      throw new Error('Kunne ikke laste opp fil. Prøv igjen.');
    }
  }

  /**
   * Upload multiple media files
   */
  static async uploadMultipleMedia(
    files: File[],
    deviationId: string,
    companyId: string,
    uploadedBy: string,
    onProgress?: (progress: number) => void
  ): Promise<DeviationMedia[]> {
    const uploadedMedia: DeviationMedia[] = [];
    const totalFiles = files.length;

    for (let i = 0; i < files.length; i++) {
      try {
        const media = await this.uploadMedia(
          files[i],
          deviationId,
          companyId,
          uploadedBy
        );
        uploadedMedia.push(media);
        
        // Update progress
        if (onProgress) {
          const progress = Math.round(((i + 1) / totalFiles) * 100);
          onProgress(progress);
        }
      } catch (error) {
        console.error(`Error uploading file ${files[i].name}:`, error);
        // Continue with other files even if one fails
      }
    }

    return uploadedMedia;
  }

  /**
   * Delete media file
   */
  static async deleteMedia(
    mediaUrl: string,
    companyId: string,
    deviationId: string
  ): Promise<void> {
    if (!storage) {
      throw new Error('Firebase Storage is not initialized');
    }

    try {
      // Extract file path from URL
      const urlParts = mediaUrl.split('/');
      const fileName = urlParts[urlParts.length - 1].split('?')[0];
      const filePath = `deviations/${companyId}/${deviationId}/${fileName}`;
      
      const storageRef = ref(storage, filePath);
      await deleteObject(storageRef);
    } catch (error) {
      console.error('Error deleting deviation media:', error);
      throw new Error('Kunne ikke slette fil.');
    }
  }

  /**
   * Validate file before upload
   */
  static validateFile(file: File): { valid: boolean; error?: string } {
    const maxSize = 50 * 1024 * 1024; // 50MB
    const allowedImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    const allowedVideoTypes = ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime'];
    const allowedDocumentTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain'
    ];

    if (file.size > maxSize) {
      return { valid: false, error: 'Filen er for stor. Maksimal størrelse er 50MB.' };
    }

    const isImage = allowedImageTypes.includes(file.type);
    const isVideo = allowedVideoTypes.includes(file.type);
    const isDocument = allowedDocumentTypes.includes(file.type);

    if (!isImage && !isVideo && !isDocument) {
      return { valid: false, error: 'Filtype ikke støttet. Kun bilder, videoer og dokumenter er tillatt.' };
    }

    return { valid: true };
  }
}

