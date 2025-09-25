import { addDoc, collection, doc, setDoc, getDoc, updateDoc, getDocs, getFirestore } from 'firebase/firestore';
import { getApps, initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';

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
    try {
      // Check if Firebase is already initialized
      let apps = getApps();
      
      // If no apps exist, initialize Firebase
      if (apps.length === 0) {
        console.log('Initializing Firebase in admin-email-service...');
        const firebaseConfig = {
          apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyCyE4S4B5q2JLdtaTtr8kVVvg8y-3Zm7ZE",
          authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "driftpro-40ccd.firebaseapp.com",
          projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "driftpro-40ccd",
          storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "driftpro-40ccd.appspot.com",
          messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "123456789",
          appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:123456789:web:abcdef123456"
        };
        
        try {
          initializeApp(firebaseConfig);
          console.log('Firebase initialized successfully in admin-email-service');
        } catch (initError) {
          console.error('Error initializing Firebase in admin-email-service:', initError);
          // If initialization fails, try to get existing app
          apps = getApps();
          if (apps.length === 0) {
            throw new Error('Failed to initialize Firebase and no existing apps found');
          }
        }
      }
      
      // Get Firestore instance
      const firestoreDb = getFirestore();
      if (!firestoreDb) {
        throw new Error('Failed to get Firestore instance');
      }
      
      console.log('Firestore instance obtained successfully in admin-email-service');
      return firestoreDb;
    } catch (error) {
      console.error('Error getting Firestore instance in admin-email-service:', error);
      return null;
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
      if (!firestoreDb) {
        throw new Error('Firebase database not available. Please check Firebase configuration.');
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
      if (!firestoreDb) {
        throw new Error('Firebase database not available. Please check Firebase configuration.');
      }

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
      if (!firestoreDb) {
        throw new Error('Firebase database not available. Please check Firebase configuration.');
      }

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
      
      // Use API endpoint for email sending
      const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
      const response = await fetch(`${baseUrl}/api/email/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: email,
          subject: `Velkommen til ${companyName} - Sett opp passord`,
          html: this.getPasswordSetupEmailHTML(adminName, companyName, setupToken),
          text: this.getPasswordSetupEmailText(adminName, companyName, setupToken),
          credentials: {
            email: 'driftpro@mavilogistikk.no',
            password: 'HazGada1989'
          }
        })
      });

      const result = await response.json();
      
      if (result.success) {
        console.log('Password setup email sent successfully:', result);
        return true;
      } else {
        throw new Error(result.error || 'Email sending failed');
      }
    } catch (error) {
      console.error('Error sending password setup email:', error);
      throw new Error(`Failed to send password setup email: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private getPasswordSetupEmailHTML(adminName: string, companyName: string, setupToken: string): string {
    const setupUrl = `https://driftpro-admin.netlify.app/setup-password/${setupToken}`;
    
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f9fafb; padding: 20px;">
        <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <h1 style="color: #1f2937; text-align: center; margin-bottom: 30px;">Velkommen til ${companyName}!</h1>
          
          <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
            Hei ${adminName},
          </p>
          
          <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
            Du har blitt utnevnt som administrator for ${companyName} i DriftPro-systemet. 
            For å komme i gang, må du sette opp ditt passord.
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${setupUrl}" 
               style="background-color: #3b82f6; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
              🔐 Sett opp passord
            </a>
          </div>
          
          <p style="color: #6b7280; font-size: 14px; margin-top: 30px; text-align: center;">
            Hvis knappen ikke fungerer, kan du kopiere og lime inn denne lenken i nettleseren din:
          </p>
          <p style="color: #3b82f6; font-size: 14px; text-align: center; word-break: break-all;">
            ${setupUrl}
          </p>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center;">
            <p style="color: #6b7280; font-size: 14px; margin: 0;">
              Med vennlig hilsen,<br>
              DriftPro Team<br>
              driftpro@mavilogistikk.no
            </p>
          </div>
        </div>
      </div>
    `;
  }

  private getPasswordSetupEmailText(adminName: string, companyName: string, setupToken: string): string {
    const setupUrl = `https://driftpro-admin.netlify.app/setup-password/${setupToken}`;
    
    return `
      Velkommen til ${companyName}!
      
      Hei ${adminName},
      
      Du har blitt utnevnt som administrator for ${companyName} i DriftPro-systemet. 
      For å komme i gang, må du sette opp ditt passord.
      
      Sett opp passord: ${setupUrl}
      
      Med vennlig hilsen,
      DriftPro Team
      driftpro@mavilogistikk.no
    `;
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
      if (!firestoreDb) {
        throw new Error('Firebase database not available. Please check Firebase configuration.');
      }

      // Get Firebase Auth instance
      const auth = getAuth();
      if (!auth) {
        throw new Error('Firebase Auth not available. Please check Firebase configuration.');
      }

      // Find existing user in Firestore
      const usersQuery = collection(firestoreDb, 'users');
      const userDocs = await getDocs(usersQuery);
      const userDoc = userDocs.docs.find(doc => 
        doc.data().email === tokenData.email && 
        doc.data().companyId === tokenData.companyId
      );

      console.log('🔍 SETUP DEBUG: Looking for user with:', {
        email: tokenData.email,
        companyId: tokenData.companyId
      });
      console.log('🔍 SETUP DEBUG: Found users:', userDocs.docs.map(doc => ({
        email: doc.data().email,
        companyId: doc.data().companyId,
        status: doc.data().status,
        hasId: !!doc.data().id
      })));

      if (!userDoc) {
        console.error('User not found for setup:', {
          email: tokenData.email,
          companyId: tokenData.companyId,
          availableUsers: userDocs.docs.map(doc => ({
            email: doc.data().email,
            companyId: doc.data().companyId
          }))
        });
        return { success: false, error: 'Bruker ikke funnet' };
      }

      console.log('Found user for setup:', {
        userId: userDoc.id,
        email: userDoc.data().email,
        companyId: userDoc.data().companyId,
        status: userDoc.data().status
      });

      // Create user in Firebase Authentication
      console.log('Creating user in Firebase Authentication:', tokenData.email);
      const userCredential = await createUserWithEmailAndPassword(auth, tokenData.email, password);
      const firebaseUser = userCredential.user;

      // Update display name in Firebase Auth
      await updateProfile(firebaseUser, {
        displayName: tokenData.adminName
      });

      // Update user in Firestore with Firebase UID and mark as active
      const updateData = {
        id: firebaseUser.uid, // Update with Firebase UID
        companyId: tokenData.companyId, // Ensure companyId is set correctly
        status: 'active',
        passwordSetAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      console.log('🔧 SETUP DEBUG: Updating user with:', updateData);
      
      await updateDoc(doc(firestoreDb, 'users', userDoc.id), updateData);

      // Mark token as used
      await this.markTokenAsUsed(tokenData.id);

      // Send welcome email
      try {
        await emailService.sendWelcomeEmail(tokenData.email, tokenData.adminName, tokenData.companyName);
      } catch (emailError) {
        console.error('Error sending welcome email:', emailError);
        // Don't fail the setup process if welcome email fails
      }

      console.log('Admin setup completed successfully for:', tokenData.email);
      return { success: true };
    } catch (error) {
      console.error('Error setting up admin password:', error);
      
      // Check if it's a Firebase Auth error
      if (error instanceof Error && error.message.includes('auth/email-already-in-use')) {
        return { success: false, error: 'Brukeren eksisterer allerede i systemet. Prøv å logge inn i stedet.' };
      }
      
      return { success: false, error: `Feil ved oppsett av passord: ${error instanceof Error ? error.message : 'Unknown error'}` };
    }
  }
}

export const adminEmailService = new AdminEmailService(); 