import { addDoc, collection, doc, setDoc, getDoc, updateDoc, getDocs } from 'firebase/firestore';
import { db } from './firebase';

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
  private baseUrl: string;

  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
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
   * Mark a setup token as used
   */
  async markTokenAsUsed(tokenId: string): Promise<void> {
    if (!db) {
      throw new Error('Database not available');
    }

    await updateDoc(doc(db, 'adminSetupTokens', tokenId), {
      used: true
    });
  }

  /**
   * Send password setup email to new admin
   */
  async sendPasswordSetupEmail(
    email: string, 
    adminName: string, 
    companyName: string, 
    setupToken: string
  ): Promise<boolean> {
    try {
      const setupUrl = `${this.baseUrl}/setup-password?token=${setupToken}&email=${encodeURIComponent(email)}`;
      
      const emailData = {
        to: email,
        subject: `Velkommen til DriftPro - Sett opp passord`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Velkommen til DriftPro</title>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
              .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
              .button { display: inline-block; background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
              .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
              .warning { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>🚀 Velkommen til DriftPro</h1>
                <p>Du har blitt utnevnt som administrator</p>
              </div>
              <div class="content">
                <h2>Hei ${adminName}!</h2>
                <p>Du har blitt utnevnt som administrator for <strong>${companyName}</strong> i DriftPro-systemet.</p>
                
                <p>For å komme i gang må du sette opp ditt passord:</p>
                
                <div style="text-align: center;">
                  <a href="${setupUrl}" class="button">Sett opp passord</a>
                </div>
                
                <div class="warning">
                  <strong>⚠️ Viktig:</strong> Denne lenken er gyldig i 24 timer. Hvis lenken utløper, kontakt systemadministrator.
                </div>
                
                <p>Hvis knappen ikke fungerer, kan du kopiere og lime inn denne lenken i nettleseren:</p>
                <p style="word-break: break-all; background: #f0f0f0; padding: 10px; border-radius: 5px; font-size: 12px;">
                  ${setupUrl}
                </p>
                
                <h3>Hva kan du gjøre som administrator?</h3>
                <ul>
                  <li>Administrere brukere og tillatelser</li>
                  <li>Håndtere dokumenter og avvik</li>
                  <li>Generere rapporter og analyser</li>
                  <li>Konfigurere systeminnstillinger</li>
                </ul>
                
                <p>Hvis du har spørsmål, ikke nøl med å kontakte oss.</p>
                
                <p>Med vennlig hilsen,<br>
                <strong>DriftPro-teamet</strong></p>
              </div>
              <div class="footer">
                <p>Denne e-posten ble sendt fra noreply@driftpro.no</p>
                <p>© 2024 DriftPro. Alle rettigheter forbeholdt.</p>
              </div>
            </div>
          </body>
          </html>
        `,
        text: `
          Velkommen til DriftPro - Sett opp passord

          Hei ${adminName}!

          Du har blitt utnevnt som administrator for ${companyName} i DriftPro-systemet.

          For å komme i gang må du sette opp ditt passord ved å besøke denne lenken:
          ${setupUrl}

          Viktig: Denne lenken er gyldig i 24 timer.

          Hva kan du gjøre som administrator?
          - Administrere brukere og tillatelser
          - Håndtere dokumenter og avvik
          - Generere rapporter og analyser
          - Konfigurere systeminnstillinger

          Hvis du har spørsmål, ikke nøl med å kontakte oss.

          Med vennlig hilsen,
          DriftPro-teamet

          Denne e-posten ble sendt fra noreply@driftpro.no
        `
      };

      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(emailData),
      });

      if (!response.ok) {
        throw new Error(`Failed to send email: ${response.status}`);
      }

      return true;
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

      return { success: true };
    } catch (error) {
      console.error('Error setting up admin password:', error);
      return { success: false, error: 'Feil ved oppsett av passord' };
    }
  }
}

export const adminEmailService = new AdminEmailService(); 