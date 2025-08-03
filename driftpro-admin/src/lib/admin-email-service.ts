import { addDoc, collection, doc, setDoc, getDoc, updateDoc, getDocs, getFirestore } from 'firebase/firestore';
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
   * Get Firebase database instance with fallback
   */
  private getDb() {
    if (db) {
      return db;
    }
    
    // Try to get Firestore directly if db is not available
    try {
      const { getApps, initializeApp } = require('firebase/app');
      const apps = getApps();
      
      if (apps.length === 0) {
        // Initialize Firebase if not already done
        const firebaseConfig = {
          apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyCyE4S4B5q2JLdtaTtr8kVVvg8y-3Zm7ZE",
          authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "driftpro-40ccd.firebaseapp.com",
          projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "driftpro-40ccd",
          storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "driftpro-40ccd.appspot.com",
          messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "123456789",
          appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:123456789:web:abcdef123456"
        };
        initializeApp(firebaseConfig);
      }
      
      return getFirestore();
    } catch (error) {
      console.error('Error getting Firestore instance:', error);
      throw new Error('Firebase database not available. Please check Firebase configuration.');
    }
  }

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
    try {
      const firestoreDb = this.getDb();

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

      const docRef = await addDoc(collection(firestoreDb, 'adminSetupTokens'), setupToken);
      console.log('Setup token created successfully:', docRef.id);
      return token;
    } catch (error) {
      console.error('Error creating setup token:', error);
      throw new Error(`Failed to create setup token: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Validate a setup token
   */
  async validateSetupToken(token: string): Promise<AdminSetupToken | null> {
    try {
      const firestoreDb = this.getDb();

      const tokensQuery = collection(firestoreDb, 'adminSetupTokens');
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
    try {
      const firestoreDb = this.getDb();

      await updateDoc(doc(firestoreDb, 'adminSetupTokens', tokenId), {
        used: true,
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error marking token as used:', error);
      throw new Error(`Failed to mark token as used: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
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
      console.log('Sending password setup email to:', email);
      const result = await emailService.sendAdminSetupEmail(email, adminName, companyName, setupToken);
      console.log('Password setup email sent successfully:', result);
      return result;
    } catch (error) {
      console.error('Error sending password setup email:', error);
      throw new Error(`Failed to send password setup email: ${error instanceof Error ? error.message : 'Unknown error'}`);
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

      const firestoreDb = this.getDb();

      // Update user with password
      const usersQuery = collection(firestoreDb, 'users');
      const userDocs = await getDocs(usersQuery);
      const userDoc = userDocs.docs.find(doc => 
        doc.data().email === tokenData.email && 
        doc.data().companyId === tokenData.companyId
      );

      if (!userDoc) {
        return { success: false, error: 'Bruker ikke funnet' };
      }

      // Update user with password and mark as active
      await updateDoc(doc(firestoreDb, 'users', userDoc.id), {
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
      return { success: false, error: `Feil ved oppsett av passord: ${error instanceof Error ? error.message : 'Unknown error'}` };
    }
  }
}

export const adminEmailService = new AdminEmailService(); 