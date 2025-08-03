import { addDoc, collection, getFirestore } from 'firebase/firestore';
import { db } from './firebase';

export interface EmailData {
  to: string;
  subject: string;
  html: string;
  text?: string;
  type?: 'admin_setup' | 'notification' | 'warning' | 'system' | 'welcome';
}

export interface EmailLog {
  id: string;
  to: string[];
  subject: string;
  content: string;
  type: string;
  status: 'sent' | 'failed' | 'pending';
  error?: string;
  sentAt: string;
  metadata?: Record<string, any>;
}

export class EmailService {
  private baseUrl: string;
  private smtpConfig: {
    host: string;
    port: number;
    user: string;
    pass: string;
    secure: boolean;
  };

  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    
    // Automatic SMTP configuration for noreply@driftpro.no
    this.smtpConfig = {
      host: 'smtp.office365.com', // Microsoft 365/Outlook
      port: 587,
      user: 'noreply@driftpro.no',
      pass: process.env.DRIFTPRO_EMAIL_PASSWORD || '',
      secure: false
    };
  }

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
          apiKey: "AIzaSyCyE4S4B5q2JLdtaTtr8kVVvg8y-3Zm7ZE",
          authDomain: "driftpro-40ccd.firebaseapp.com",
          projectId: "driftpro-40ccd",
          storageBucket: "driftpro-40ccd.appspot.com",
          messagingSenderId: "123456789",
          appId: "1:123456789:web:abcdef123456"
        };
        initializeApp(firebaseConfig);
      }
      
      return getFirestore();
    } catch (error) {
      console.error('Error getting Firestore instance:', error);
      return null; // Return null instead of throwing to allow graceful fallback
    }
  }

  /**
   * Send email using internal SMTP server
   */
  async sendEmail(emailData: EmailData): Promise<boolean> {
    try {
      // Log email attempt
      const emailLogId = await this.logEmailAttempt(emailData, 'pending');

      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...emailData,
          smtpConfig: this.smtpConfig
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Email API response:', {
          status: response.status,
          statusText: response.statusText,
          errorData
        });
        
        // Update log with error
        await this.updateEmailLog(emailLogId, 'failed', errorData.error || response.statusText);
        throw new Error(`Failed to send email: ${response.status} - ${errorData.error || response.statusText}`);
      }

      const result = await response.json();
      console.log('Email sent successfully:', result);
      
      // Update log with success
      await this.updateEmailLog(emailLogId, 'sent', undefined, result.messageId);
      return true;
    } catch (error) {
      console.error('Error sending email:', error);
      throw error;
    }
  }

  /**
   * Send admin setup email
   */
  async sendAdminSetupEmail(
    email: string,
    adminName: string,
    companyName: string,
    setupToken: string
  ): Promise<boolean> {
    const setupUrl = `${this.baseUrl}/setup-password?token=${setupToken}&email=${encodeURIComponent(email)}`;
    
    const emailData: EmailData = {
      to: email,
      subject: `Velkommen til DriftPro - Sett opp passord`,
      type: 'admin_setup',
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

    return this.sendEmail(emailData);
  }

  /**
   * Send notification email
   */
  async sendNotificationEmail(
    email: string,
    subject: string,
    message: string,
    type: 'info' | 'warning' | 'error' | 'success' = 'info'
  ): Promise<boolean> {
    const emailData: EmailData = {
      to: email,
      subject: `DriftPro - ${subject}`,
      type: 'notification',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>DriftPro Notification</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
            .${type} { background: ${this.getTypeColor(type)}; border: 1px solid ${this.getTypeBorderColor(type)}; padding: 15px; border-radius: 5px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔔 DriftPro Notification</h1>
              <p>${subject}</p>
            </div>
            <div class="content">
              <div class="${type}">
                ${message}
              </div>
              
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
        DriftPro Notification

        ${subject}

        ${message}

        Med vennlig hilsen,
        DriftPro-teamet

        Denne e-posten ble sendt fra noreply@driftpro.no
      `
    };

    return this.sendEmail(emailData);
  }

  /**
   * Send welcome email
   */
  async sendWelcomeEmail(
    email: string,
    userName: string,
    companyName: string
  ): Promise<boolean> {
    const emailData: EmailData = {
      to: email,
      subject: `Velkommen til DriftPro - ${companyName}`,
      type: 'welcome',
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
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 Velkommen til DriftPro</h1>
              <p>Din konto er nå aktiv</p>
            </div>
            <div class="content">
              <h2>Hei ${userName}!</h2>
              <p>Velkommen til <strong>${companyName}</strong> på DriftPro!</p>
              
              <p>Din konto er nå aktiv og du kan logge inn på systemet.</p>
              
              <div style="text-align: center;">
                <a href="${this.baseUrl}/login" class="button">Logg inn på DriftPro</a>
              </div>
              
              <h3>Hva kan du gjøre?</h3>
              <ul>
                <li>Se oversikt over bedriften din</li>
                <li>Håndtere dokumenter og avvik</li>
                <li>Generere rapporter</li>
                <li>Administrere brukere (hvis du er admin)</li>
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
        Velkommen til DriftPro

        Hei ${userName}!

        Velkommen til ${companyName} på DriftPro!

        Din konto er nå aktiv og du kan logge inn på systemet.

        Logg inn her: ${this.baseUrl}/login

        Hva kan du gjøre?
        - Se oversikt over bedriften din
        - Håndtere dokumenter og avvik
        - Generere rapporter
        - Administrere brukere (hvis du er admin)

        Hvis du har spørsmål, ikke nøl med å kontakte oss.

        Med vennlig hilsen,
        DriftPro-teamet

        Denne e-posten ble sendt fra noreply@driftpro.no
      `
    };

    return this.sendEmail(emailData);
  }

  /**
   * Log email attempt to Firebase
   */
  private async logEmailAttempt(emailData: EmailData, status: 'pending' | 'sent' | 'failed'): Promise<string> {
    const firestoreDb = this.getDb();
    if (!firestoreDb) {
      console.warn('Firebase not available, skipping email log');
      return '';
    }

    try {
      const logData = {
        to: [emailData.to],
        subject: emailData.subject,
        content: emailData.html,
        type: emailData.type || 'system',
        status,
        sentAt: new Date().toISOString(),
        metadata: {
          textVersion: emailData.text
        }
      };

      const docRef = await addDoc(collection(firestoreDb, 'emailLogs'), logData);
      return docRef.id;
    } catch (error) {
      console.error('Error logging email attempt:', error);
      return '';
    }
  }

  /**
   * Update email log
   */
  private async updateEmailLog(logId: string, status: 'sent' | 'failed', error?: string, messageId?: string): Promise<void> {
    const firestoreDb = this.getDb();
    if (!firestoreDb || !logId) return;

    try {
      const { updateDoc, doc } = await import('firebase/firestore');
      await updateDoc(doc(firestoreDb, 'emailLogs', logId), {
        status,
        error,
        messageId,
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error updating email log:', error);
    }
  }

  /**
   * Get color for notification type
   */
  private getTypeColor(type: 'info' | 'warning' | 'error' | 'success'): string {
    switch (type) {
      case 'info': return '#d1ecf1';
      case 'warning': return '#fff3cd';
      case 'error': return '#f8d7da';
      case 'success': return '#d4edda';
      default: return '#f8f9fa';
    }
  }

  /**
   * Get border color for notification type
   */
  private getTypeBorderColor(type: 'info' | 'warning' | 'error' | 'success'): string {
    switch (type) {
      case 'info': return '#bee5eb';
      case 'warning': return '#ffeaa7';
      case 'error': return '#f5c6cb';
      case 'success': return '#c3e6cb';
      default: return '#dee2e6';
    }
  }
}

export const emailService = new EmailService();