import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, serverTimestamp, doc, getDoc } from 'firebase/firestore';

export interface SMTPAuthConfig {
  host: string;
  port: number;
  user: string;
  pass: string;
  secure: boolean;
  tls?: {
    rejectUnauthorized: boolean;
  };
}

export interface SMTPAuthResult {
  success: boolean;
  error?: string;
  user?: {
    email: string;
    name?: string;
  };
}

class SMTPAuthService {
  private config: SMTPAuthConfig;

  constructor(config: SMTPAuthConfig) {
    this.config = config;
  }

  /**
   * Authenticate user using SMTP credentials
   * This method attempts to connect to the SMTP server with the provided credentials
   * to verify if they are valid
   */
  async authenticate(email: string, password: string): Promise<SMTPAuthResult> {
    try {
      console.log('🔐 Attempting SMTP authentication for:', email);

      // Dynamic import to avoid SSR issues
      const nodemailerModule = await import('nodemailer');
      const nodemailer = nodemailerModule.default || nodemailerModule;

      // Create a test transporter with the provided credentials
      const testTransporter = nodemailer.createTransport({
        host: this.config.host,
        port: this.config.port,
        secure: this.config.secure,
        auth: {
          user: email,
          pass: password
        },
        tls: this.config.tls || { rejectUnauthorized: false },
        connectionTimeout: 10000, // 10 seconds timeout
        greetingTimeout: 5000,   // 5 seconds greeting timeout
        socketTimeout: 10000     // 10 seconds socket timeout
      });

      // Verify the connection and credentials
      await testTransporter.verify();

      console.log('✅ SMTP authentication successful for:', email);

      return {
        success: true,
        user: {
          email: email,
          name: email.split('@')[0] // Use email prefix as name
        }
      };

    } catch (error: any) {
      console.error('❌ SMTP authentication failed for:', email, error.message);

      // Parse common SMTP errors
      let errorMessage = 'Autentisering mislyktes';
      
      if (error.message.includes('Invalid login')) {
        errorMessage = 'Ugyldig e-postadresse eller passord';
      } else if (error.message.includes('Authentication unsuccessful')) {
        errorMessage = 'Autentisering mislyktes. Sjekk dine opplysninger.';
      } else if (error.message.includes('Connection timeout')) {
        errorMessage = 'Tilkobling til e-postserver timeout. Prøv igjen.';
      } else if (error.message.includes('ECONNREFUSED')) {
        errorMessage = 'Kunne ikke koble til e-postserver. Sjekk internettforbindelsen.';
      }

      return {
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * Test SMTP connection with provided credentials
   */
  async testConnection(email: string, password: string): Promise<SMTPAuthResult> {
    try {
      console.log('🧪 Testing SMTP connection...');

      // Dynamic import to avoid SSR issues
      const nodemailerModule = await import('nodemailer');
      const nodemailer = nodemailerModule.default || nodemailerModule;

      const testTransporter = nodemailer.createTransport({
        host: this.config.host,
        port: this.config.port,
        secure: this.config.secure,
        auth: {
          user: email,
          pass: password
        },
        tls: this.config.tls || { rejectUnauthorized: false },
        connectionTimeout: 10000,
        greetingTimeout: 5000,
        socketTimeout: 10000
      });

      await testTransporter.verify();

      console.log('✅ SMTP connection test successful');

      return {
        success: true,
        user: {
          email: email,
          name: email.split('@')[0]
        }
      };

    } catch (error: any) {
      console.error('❌ SMTP connection test failed:', error.message);

      return {
        success: false,
        error: `Tilkoblingstest mislyktes: ${error.message}`
      };
    }
  }
}

// Default Office 365 SMTP configuration (without password - will be provided by user)
const defaultSMTPConfig: SMTPAuthConfig = {
  host: 'smtp-mail.outlook.com',
  port: 587,
  user: 'driftpro@mavilogistikk.no',
  pass: '', // Password will be provided by user during authentication
  secure: false,
  tls: {
    rejectUnauthorized: false
  }
};

export const smtpAuthService = new SMTPAuthService(defaultSMTPConfig);
