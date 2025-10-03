import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, serverTimestamp, doc, getDoc } from 'firebase/firestore';
import { EmailTemplates } from './email-templates';

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyCyE4S4B5q2JLdtaTtr8kVVvg8y-3Zm7ZE",
  authDomain: "driftpro-40ccd.firebaseapp.com",
  projectId: "driftpro-40ccd",
  storageBucket: "driftpro-40ccd.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef123456"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export class DynamicEmailService {
  private baseUrl: string;
  private userEmail: string;
  private userPassword: string;

  constructor(userEmail: string, userPassword: string) {
    this.baseUrl = 'https://admin.driftpro.no';
    this.userEmail = userEmail;
    this.userPassword = userPassword;
    console.log('📧 DYNAMIC EMAIL SERVICE: Initialized for user:', userEmail);
  }

  async sendEmail(to: string | string[], subject: string, html: string, text?: string) {
    try {
      console.log('📧 Attempting to send email via user SMTP:', {
        to: Array.isArray(to) ? to : [to],
        subject,
        userEmail: this.userEmail,
        provider: 'user_smtp'
      });
      
      // Use Netlify function for email sending with user's credentials
      const response = await fetch(`${this.baseUrl}/.netlify/functions/send-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          emailData: {
            to: Array.isArray(to) ? to : [to],
            subject: subject,
            body: html
          },
          config: {
            smtpHost: 'smtp-mail.outlook.com',
            smtpPort: 587,
            smtpUser: this.userEmail,
            smtpPass: this.userPassword,
            senderName: 'DriftPro System',
            senderEmail: this.userEmail
          }
        })
      });

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Email sending failed');
      }
      
      const info = { messageId: result.messageId || 'unknown' };

      // Log email to Firestore
      try {
        await addDoc(collection(db, 'emailLogs'), {
          to: Array.isArray(to) ? to : [to],
          subject: subject,
          from: this.userEmail,
          provider: 'user_smtp',
          messageId: info.messageId,
          status: 'sent',
          timestamp: serverTimestamp(),
          userAgent: 'DriftPro Mail System'
        });
        console.log('📝 Email logged to Firestore');
      } catch (logError) {
        console.warn('⚠️ Could not log email to Firestore:', logError);
      }

      return { success: true, messageId: info.messageId || 'unknown' };
    } catch (error) {
      console.error('❌ Error sending email:', error);
      
      // Log error to Firestore
      try {
        await addDoc(collection(db, 'emailLogs'), {
          to: Array.isArray(to) ? to : [to],
          subject: subject,
          from: this.userEmail,
          provider: 'user_smtp',
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: serverTimestamp(),
          userAgent: 'DriftPro Mail System'
        });
      } catch (logError) {
        console.warn('⚠️ Could not log error to Firestore:', logError);
      }
      
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async sendPasswordResetEmail(email: string, resetToken: string) {
    const resetUrl = `${this.baseUrl}/reset-password?token=${resetToken}`;
    const html = EmailTemplates.passwordReset(resetUrl);
    const text = `Du har bedt om å tilbakestille passordet ditt. Klikk på denne lenken for å tilbakestille passordet: ${resetUrl}`;
    
    return this.sendEmail(email, 'Tilbakestill passord - DriftPro', html, text);
  }

  async sendWelcomeEmail(email: string, name: string, companyName: string) {
    const html = EmailTemplates.welcome(name, companyName);
    const text = `Velkommen til DriftPro, ${name}! Du er nå registrert hos ${companyName}.`;
    
    return this.sendEmail(email, 'Velkommen til DriftPro!', html, text);
  }

  async sendPasswordSetupEmail(email: string, setupToken: string) {
    const setupUrl = `${this.baseUrl}/setup-password?token=${setupToken}`;
    const html = EmailTemplates.passwordSetup(setupUrl);
    const text = `Du har blitt invitert til DriftPro. Klikk på denne lenken for å sette opp passordet ditt: ${setupUrl}`;
    
    return this.sendEmail(email, 'Sett opp passord - DriftPro', html, text);
  }
}




