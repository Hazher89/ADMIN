import { addDoc, collection, getFirestore } from 'firebase/firestore';
import { db } from './firebase';

export interface EmailData {
  to: string;
  subject: string;
  html: string;
  text?: string;
  type?: 'admin_setup' | 'notification' | 'warning' | 'system' | 'welcome' | 'deviation_report' | 'deviation_resolved';
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
    // Check if admin setup emails are enabled
    const settings = await this.getEmailSettings();
    if (!settings.enabled || !settings.adminSetup) {
      console.log('Admin setup emails are disabled');
      return false;
    }

    const setupUrl = `${this.baseUrl}/setup-password?token=${setupToken}&email=${encodeURIComponent(email)}`;
    
    // Use custom template if available
    let html = settings.adminSetupTemplate || `
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
          </div>
          <div class="content">
            <h2>Hei ${adminName}!</h2>
            <p>Du har blitt utnevnt som administrator for <strong>${companyName}</strong> på DriftPro.</p>
            <p>For å komme i gang, må du sette opp passordet ditt:</p>
            <div style="text-align: center;">
              <a href="${setupUrl}" class="button">🔐 Sett opp passord</a>
            </div>
            <div class="warning">
              <strong>⚠️ Viktig:</strong> Denne lenken utløper om 24 timer av sikkerhetsgrunner.
            </div>
            <p>Hvis du ikke forventet denne e-posten, kan du trygt ignorere den.</p>
            <div class="footer">
              <p>Med vennlig hilsen,<br><strong>DriftPro Team</strong></p>
              <p style="font-size: 12px; color: #999;">
                Dette er en automatisk e-post. Vennligst ikke svar på denne meldingen.
              </p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    // Replace template variables
    html = html.replace(/\{\{adminName\}\}/g, adminName);
    html = html.replace(/\{\{companyName\}\}/g, companyName);
    html = html.replace(/\{\{setupUrl\}\}/g, setupUrl);

    const emailData: EmailData = {
      to: email,
      subject: `Velkommen til DriftPro - Sett opp passord`,
      type: 'admin_setup',
      html: html
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
    // Check if notification emails are enabled
    const settings = await this.getEmailSettings();
    if (!settings.enabled || !settings.notifications) {
      console.log('Notification emails are disabled');
      return false;
    }

    // Use custom template if available
    let html = settings.notificationTemplate || `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${subject}</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: ${this.getTypeColor(type)}; color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; border-left: 4px solid ${this.getTypeBorderColor(type)}; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>${this.getTypeIcon(type)} ${subject}</h1>
          </div>
          <div class="content">
            <div style="white-space: pre-wrap;">${message}</div>
            <div class="footer">
              <p>Med vennlig hilsen,<br><strong>DriftPro Team</strong></p>
              <p style="font-size: 12px; color: #999;">
                Dette er en automatisk e-post. Vennligst ikke svar på denne meldingen.
              </p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    // Replace template variables
    html = html.replace(/\{\{subject\}\}/g, subject);
    html = html.replace(/\{\{message\}\}/g, message);

    const emailData: EmailData = {
      to: email,
      subject: subject,
      type: 'notification',
      html: html
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
    // Check if welcome emails are enabled
    const settings = await this.getEmailSettings();
    if (!settings.enabled || !settings.userWelcome) {
      console.log('Welcome emails are disabled');
      return false;
    }

    // Use custom template if available
    let html = settings.userWelcomeTemplate || `
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
            <h1>🎉 Velkommen til DriftPro!</h1>
          </div>
          <div class="content">
            <h2>Hei ${userName}!</h2>
            <p>Velkommen til <strong>${companyName}</strong> på DriftPro!</p>
            <p>Din konto er nå aktiv og du kan logge inn på systemet.</p>
            <div style="text-align: center;">
              <a href="${this.baseUrl}/login" class="button">🚀 Logg inn på DriftPro</a>
            </div>
            <p>Hvis du har spørsmål eller trenger hjelp, ikke nøl med å kontakte oss.</p>
            <div class="footer">
              <p>Med vennlig hilsen,<br><strong>DriftPro Team</strong></p>
              <p style="font-size: 12px; color: #999;">
                Dette er en automatisk e-post. Vennligst ikke svar på denne meldingen.
              </p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    // Replace template variables
    html = html.replace(/\{\{userName\}\}/g, userName);
    html = html.replace(/\{\{companyName\}\}/g, companyName);

    const emailData: EmailData = {
      to: email,
      subject: `Velkommen til DriftPro - ${companyName}`,
      type: 'welcome',
      html: html
    };

    return this.sendEmail(emailData);
  }

  /**
   * Send deviation report email
   */
  async sendDeviationReportEmail(
    email: string,
    deviationData: {
      title: string;
      description: string;
      reportedBy: string;
      reportedDate: string;
      priority: string;
      deviationUrl: string;
    }
  ): Promise<boolean> {
    // Check if deviation report emails are enabled
    const settings = await this.getEmailSettings();
    if (!settings.enabled || !settings.deviationReports) {
      console.log('Deviation report emails are disabled');
      return false;
    }

    // Use custom template if available
    let html = settings.deviationReportTemplate || `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Ny avviksrapport</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #dc2626; color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; background: #dc2626; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🚨 Ny avviksrapport</h1>
          </div>
          <div class="content">
            <p>Et nytt avvik har blitt rapportert:</p>
            <ul>
              <li><strong>Avvik:</strong> ${deviationData.title}</li>
              <li><strong>Beskrivelse:</strong> ${deviationData.description}</li>
              <li><strong>Rapportert av:</strong> ${deviationData.reportedBy}</li>
              <li><strong>Dato:</strong> ${deviationData.reportedDate}</li>
              <li><strong>Prioritet:</strong> ${deviationData.priority}</li>
            </ul>
            <div style="text-align: center;">
              <a href="${deviationData.deviationUrl}" class="button">👁️ Se detaljer</a>
            </div>
            <div class="footer">
              <p>Med vennlig hilsen,<br><strong>DriftPro Team</strong></p>
              <p style="font-size: 12px; color: #999;">
                Dette er en automatisk e-post. Vennligst ikke svar på denne meldingen.
              </p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    // Replace template variables
    html = html.replace(/\{\{deviationTitle\}\}/g, deviationData.title);
    html = html.replace(/\{\{deviationDescription\}\}/g, deviationData.description);
    html = html.replace(/\{\{reportedBy\}\}/g, deviationData.reportedBy);
    html = html.replace(/\{\{reportedDate\}\}/g, deviationData.reportedDate);
    html = html.replace(/\{\{priority\}\}/g, deviationData.priority);
    html = html.replace(/\{\{deviationUrl\}\}/g, deviationData.deviationUrl);

    const emailData: EmailData = {
      to: email,
      subject: `Ny avviksrapport: ${deviationData.title}`,
      type: 'deviation_report',
      html: html
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

  /**
   * Get email settings from Firebase
   */
  private async getEmailSettings(): Promise<any> {
    try {
      const firestoreDb = this.getDb();
      if (!firestoreDb) {
        return { enabled: true, adminSetup: true, notifications: true, userWelcome: true, deviationReports: true };
      }

      const { doc, getDoc } = require('firebase/firestore');
      const settingsDoc = await getDoc(doc(firestoreDb, 'system', 'emailSettings'));
      
      if (settingsDoc.exists()) {
        return settingsDoc.data();
      } else {
        // Return default settings
        return {
          enabled: true,
          adminSetup: true,
          notifications: true,
          userWelcome: true,
          deviationReports: true,
          deviationResolved: true,
          warnings: true,
          systemAlerts: true
        };
      }
    } catch (error) {
      console.error('Error getting email settings:', error);
      // Return default settings on error
      return {
        enabled: true,
        adminSetup: true,
        notifications: true,
        userWelcome: true,
        deviationReports: true,
        deviationResolved: true,
        warnings: true,
        systemAlerts: true
      };
    }
  }

  /**
   * Get type icon for email templates
   */
  private getTypeIcon(type: 'info' | 'warning' | 'error' | 'success'): string {
    switch (type) {
      case 'info': return 'ℹ️';
      case 'warning': return '⚠️';
      case 'error': return '❌';
      case 'success': return '✅';
      default: return 'ℹ️';
    }
  }
}

export const emailService = new EmailService();