import { addDoc, collection, doc, setDoc, getDoc, updateDoc, getDocs } from 'firebase/firestore';
import { db } from './firebase';
import { emailService } from './email-service';

export interface AdminSetupToken {
  id: string;
  email: string;
  adminName: string;
  companyName: string;
  companyId: string;
  token: string;
  expiresAt: string;
  used: boolean;
  createdAt: string;
}

export class AdminEmailService {
  /**
   * Generate a secure token for password setup
   */
  private generateToken(): string {
    // Use a combination of timestamp and random string for uniqueness
    const timestamp = Date.now().toString(36);
    const randomStr = Math.random().toString(36).substring(2, 15);
    return `${timestamp}-${randomStr}`;
  }

  /**
   * Create a setup token for a new admin
   */
  async createSetupToken(
    email: string, 
    adminName: string, 
    companyName: string, 
    companyId: string
  ): Promise<string> {
    if (!db) {
      throw new Error('Database not available');
    }

    const token = this.generateToken();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours from now

    const setupToken: Omit<AdminSetupToken, 'id'> = {
      email: email.toLowerCase().trim(),
      adminName,
      companyName,
      companyId,
      token,
      expiresAt: expiresAt.toISOString(),
      used: false,
      createdAt: new Date().toISOString()
    };

    await addDoc(collection(db, 'adminSetupTokens'), setupToken);
    return token;
  }

  /**
   * Validate a setup token
   */
  async validateSetupToken(token: string): Promise<AdminSetupToken | null> {
    if (!db) {
      return null;
    }

    try {
      const tokensQuery = collection(db, 'adminSetupTokens');
      const tokenDocs = await getDocs(tokensQuery);
      
      const tokenDoc = tokenDocs.docs.find(doc => doc.data().token === token);
      
      if (!tokenDoc) {
        return null;
      }

      const tokenData = tokenDoc.data() as AdminSetupToken;
      
      // Check if token is expired
      if (new Date(tokenData.expiresAt) < new Date()) {
        return null;
      }

      // Check if token is already used
      if (tokenData.used) {
        return null;
      }

      return {
        ...tokenData,
        id: tokenDoc.id
      };
    } catch (error) {
      console.error('Error validating setup token:', error);
      return null;
    }
  }

  /**
   * Mark a token as used
   */
  async markTokenAsUsed(tokenId: string): Promise<void> {
    if (!db) {
      throw new Error('Database not available');
    }

    await updateDoc(doc(db, 'adminSetupTokens', tokenId), {
      used: true,
      updatedAt: new Date().toISOString()
    });
  }

  /**
   * Send password setup email using the main email service
   */
  async sendPasswordSetupEmail(
    email: string, 
    adminName: string, 
    companyName: string, 
    setupToken: string
  ): Promise<boolean> {
    try {
      return await emailService.sendAdminSetupEmail(email, adminName, companyName, setupToken);
    } catch (error) {
      console.error('Error sending password setup email:', error);
      throw error;
    }
  }

  /**
   * Complete admin setup process
   */
  async setupAdminWithPassword(
    token: string, 
    password: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Validate token
      const tokenData = await this.validateSetupToken(token);
      if (!tokenData) {
        return { success: false, error: 'Ugyldig eller utløpt token' };
      }

      if (!db) {
        return { success: false, error: 'Database ikke tilgjengelig' };
      }

      // Update user with password
      const usersQuery = collection(db, 'users');
      const userDocs = await getDocs(usersQuery);
      const userDoc = userDocs.docs.find(doc => 
        doc.data().email === tokenData.email && 
        doc.data().companyId === tokenData.companyId
      );

      if (!userDoc) {
        return { success: false, error: 'Bruker ikke funnet' };
      }

      // Update user with password and mark as active
      await updateDoc(doc(db, 'users', userDoc.id), {
        password: password, // In production, this should be hashed
        status: 'active',
        passwordSetAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });

      // Mark token as used
      await this.markTokenAsUsed(tokenData.id);

      // Send welcome email
      try {
        await emailService.sendWelcomeEmail(tokenData.email, tokenData.adminName, tokenData.companyName);
      } catch (emailError) {
        console.error('Error sending welcome email:', emailError);
        // Don't fail the setup process if welcome email fails
      }

      return { success: true };
    } catch (error) {
      console.error('Error setting up admin password:', error);
      return { success: false, error: 'Feil ved oppsett av passord' };
    }
  }
}

export const adminEmailService = new AdminEmailService(); 