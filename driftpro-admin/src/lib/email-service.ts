import { addDoc, collection, getFirestore, doc, getDoc } from 'firebase/firestore';
import { getApps, initializeApp } from 'firebase/app';

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
    tls?: {
      rejectUnauthorized: boolean;
    };
    connectionTimeout?: number;
    greetingTimeout?: number;
    socketTimeout?: number;
  };

  constructor() {
    // Always use production URL for emails - never localhost
    this.baseUrl = 'https://driftpro-admin.netlify.app'; // Use Netlify domain for emails
    
    console.log('📧 EMAIL SERVICE: Base URL set to:', this.baseUrl);
    
    console.log('📧 EMAIL SERVICE: Base URL set to:', this.baseUrl);
    
    // Default SMTP configuration - will be overridden by settings from Firebase
    this.smtpConfig = {
      host: 'smtp.sendgrid.net',
      port: 587,
      user: 'apikey',
      pass: 'SG.your-sendgrid-api-key', // Replace with actual SendGrid API key
      secure: false,
      // Add additional options to handle AWS IP restrictions
      tls: {
        rejectUnauthorized: false
      },
      // Add connection timeout
      connectionTimeout: 60000,
      greetingTimeout: 30000,
      socketTimeout: 60000
    };
  }

  /**
   * Get Firebase database instance with fallback
   */
  private getDb() {
    try {
      // Check if Firebase is already initialized
      let apps = getApps();
      
      // If no apps exist, initialize Firebase
      if (apps.length === 0) {
        console.log('Initializing Firebase in email-service...');
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
          console.log('Firebase initialized successfully in email-service');
        } catch (initError) {
          console.error('Error initializing Firebase in email-service:', initError);
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
      
      console.log('Firestore instance obtained successfully in email-service');
      return firestoreDb;
    } catch (error) {
      console.error('Error getting Firestore instance in email-service:', error);
      return null;
    }
  }

  /**
   * Send email using internal SMTP server
   */
  async sendEmail(emailData: EmailData): Promise<boolean> {
    try {
      // Always get fresh email settings from Firebase for maximum control
      const settings = await this.getEmailSettings();
      
      // Ensure password is available
      if (!settings.smtpPassword) {
        throw new Error('SMTP password not configured. Please set up email settings first.');
      }
      
      // Use settings from Firebase with full control
      const smtpConfig = {
        host: settings.smtpHost || this.smtpConfig.host,
        port: settings.smtpPort || this.smtpConfig.port,
        user: settings.smtpUser || this.smtpConfig.user,
        pass: settings.smtpPassword || this.smtpConfig.pass,
        secure: settings.smtpSecure || this.smtpConfig.secure
      };

      console.log('Using email settings from Firebase:', {
        host: smtpConfig.host,
        port: smtpConfig.port,
        user: smtpConfig.user,
        secure: smtpConfig.secure,
        passwordProvided: !!smtpConfig.pass
      });

      // Log email attempt
      const emailLogId = await this.logEmailAttempt(emailData, 'pending');

      // Send email directly using nodemailer instead of calling API
      const nodemailer = require('nodemailer');
      
      const transporter = nodemailer.createTransport({
        host: smtpConfig.host,
        port: smtpConfig.port,
        secure: smtpConfig.secure,
        auth: {
          user: smtpConfig.user,
          pass: smtpConfig.pass
        },
        // Add options to handle AWS IP restrictions
        tls: {
          rejectUnauthorized: settings.smtpTlsRejectUnauthorized !== undefined ? settings.smtpTlsRejectUnauthorized : false
        },
        connectionTimeout: settings.smtpConnectionTimeout || 60000,
        greetingTimeout: settings.smtpGreetingTimeout || 30000,
        socketTimeout: settings.smtpSocketTimeout || 60000
      });

      const mailOptions = {
        from: `"DriftPro System" <${smtpConfig.user.includes('@') ? smtpConfig.user : 'noreply@driftpro.no'}>`,
        to: emailData.to,
        subject: emailData.subject,
        html: emailData.html,
        text: emailData.text
      };

      const result = await transporter.sendMail(mailOptions);
      console.log('Email sent successfully:', result.messageId);
      
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
        <title>Velkommen til DriftPro - Sett opp passord</title>
        <style>
          body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; 
            line-height: 1.6; 
            color: #333; 
            margin: 0; 
            padding: 0; 
            background-color: #f5f5f5;
          }
          .container { 
            max-width: 600px; 
            margin: 20px auto; 
            background: white; 
            border-radius: 12px; 
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); 
            overflow: hidden;
          }
          .header { 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
            color: white; 
            padding: 40px 30px; 
            text-align: center; 
          }
          .header h1 { 
            margin: 0; 
            font-size: 28px; 
            font-weight: 600;
          }
          .header .subtitle {
            margin: 10px 0 0 0;
            font-size: 16px;
            opacity: 0.9;
          }
          .content { 
            padding: 40px 30px; 
          }
          .welcome-text {
            font-size: 18px;
            margin-bottom: 25px;
            color: #2c3e50;
          }
          .company-info {
            background: #f8f9fa;
            border-left: 4px solid #667eea;
            padding: 20px;
            margin: 25px 0;
            border-radius: 0 8px 8px 0;
          }
          .button-container {
            text-align: center;
            margin: 35px 0;
          }
          .button { 
            display: inline-block; 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
            color: white; 
            padding: 18px 36px; 
            text-decoration: none; 
            border-radius: 8px; 
            font-weight: 600;
            font-size: 16px;
            box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
            transition: all 0.3s ease;
          }
          .button:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 16px rgba(102, 126, 234, 0.4);
          }
          .warning { 
            background: #fff3cd; 
            border: 1px solid #ffeaa7; 
            padding: 20px; 
            border-radius: 8px; 
            margin: 25px 0;
            border-left: 4px solid #ffc107;
          }
          .warning strong {
            color: #856404;
          }
          .footer { 
            text-align: center; 
            margin-top: 40px; 
            padding-top: 30px;
            border-top: 1px solid #eee;
            color: #666; 
            font-size: 14px; 
          }
          .footer .logo {
            font-size: 20px;
            font-weight: bold;
            color: #667eea;
            margin-bottom: 10px;
          }
          .security-note {
            background: #e8f5e8;
            border: 1px solid #c3e6c3;
            padding: 15px;
            border-radius: 8px;
            margin: 20px 0;
            font-size: 14px;
            color: #2d5a2d;
          }
          .manual-link {
            margin-top: 20px;
            padding: 15px;
            background: #f8f9fa;
            border-radius: 8px;
            font-size: 14px;
            word-break: break-all;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🚀 Velkommen til DriftPro</h1>
            <p class="subtitle">Din bedriftsadministrasjonsplattform</p>
          </div>
          <div class="content">
            <div class="welcome-text">
              <strong>Hei ${adminName}!</strong>
            </div>
            
            <p>Du har blitt utnevnt som <strong>administrator</strong> for bedriften din på DriftPro.</p>
            
            <div class="company-info">
              <strong>Bedrift:</strong> ${companyName}<br>
              <strong>Rolle:</strong> Administrator<br>
              <strong>E-post:</strong> ${email}
            </div>
            
            <p>For å komme i gang med å administrere bedriften din, må du først sette opp et sikkert passord:</p>
            
            <div class="button-container">
              <a href="${setupUrl}" class="button">🔐 Sett opp passord nå</a>
            </div>
            
            <div class="warning">
              <strong>⚠️ Viktig:</strong> Denne lenken utløper om <strong>24 timer</strong> av sikkerhetsgrunner.
            </div>
            
            <div class="security-note">
              <strong>🔒 Sikkerhet:</strong> Passordet ditt vil bli kryptert og lagret sikkert i vårt system.
            </div>
            
            <div class="manual-link">
              <strong>Hvis knappen ikke fungerer,</strong> kopier og lim inn denne lenken i nettleseren din:<br>
              <a href="${setupUrl}" style="color: #667eea;">${setupUrl}</a>
            </div>
            
            <p style="margin-top: 30px; color: #666;">
              Hvis du ikke forventet denne e-posten eller har spørsmål, kan du trygt ignorere den eller kontakte vår support.
            </p>
            
            <div class="footer">
              <div class="logo">DriftPro</div>
              <p>Din bedriftsadministrasjonsplattform</p>
              <p style="font-size: 12px; color: #999; margin-top: 20px;">
                Dette er en automatisk e-post. Vennligst ikke svar på denne meldingen.<br>
                © 2025 DriftPro. Alle rettigheter forbeholdt.
              </p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    // Replace template variables - handle all syntax formats
    html = html.replace(/\$\{adminName\}/g, adminName);
    html = html.replace(/\$\{companyName\}/g, companyName);
    html = html.replace(/\$\{email\}/g, email);
    html = html.replace(/\$\{setupUrl\}/g, setupUrl);
    html = html.replace(/\{\{adminName\}\}/g, adminName);
    html = html.replace(/\{\{companyName\}\}/g, companyName);
    html = html.replace(/\{\{setupUrl\}\}/g, setupUrl);
    html = html.replace(/\[adminName\]/g, adminName);
    html = html.replace(/\[companyName\]/g, companyName);
    html = html.replace(/\[email\]/g, email);
    html = html.replace(/\[setupUrl\]/g, setupUrl);

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
   * Send password reset email
   */
  async sendPasswordResetEmail(
    email: string,
    resetUrl: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Check if password reset emails are enabled
      const settings = await this.getEmailSettings();
      if (!settings.enabled || !settings.notifications) {
        console.log('Password reset emails are disabled');
        return { success: false, error: 'Password reset emails are disabled' };
      }
    
    const emailData: EmailData = {
      to: email,
      subject: 'Tilbakestill passord - DriftPro',
      type: 'notification',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Tilbakestill passord - DriftPro</title>
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
              <h1>🔐 Tilbakestill passord</h1>
            </div>
            <div class="content">
              <h2>Hei!</h2>
              <p>Du har bedt om å tilbakestille passordet ditt for DriftPro.</p>
              <p>Klikk på knappen nedenfor for å sette et nytt passord:</p>
              <div style="text-align: center;">
                <a href="${resetUrl}" class="button">Tilbakestill passord</a>
              </div>
              <div class="warning">
                <strong>⚠️ Viktig:</strong> Denne lenken utløper om 1 time av sikkerhetsgrunner.
              </div>
              <p>Hvis du ikke ba om å tilbakestille passordet, kan du trygt ignorere denne e-posten.</p>
              <div class="footer">
                <p>Med vennlig hilsen,<br>DriftPro Team</p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
        Tilbakestill passord - DriftPro

        Hei!

        Du har bedt om å tilbakestille passordet ditt for DriftPro.

        Klikk på lenken nedenfor for å sette et nytt passord:
        ${resetUrl}

        ⚠️ Viktig: Denne lenken utløper om 1 time av sikkerhetsgrunner.

        Hvis du ikke ba om å tilbakestille passordet, kan du trygt ignorere denne e-posten.

        Med vennlig hilsen,
        DriftPro Team
      `
    };

    const result = await this.sendEmail(emailData);
    return { success: result };
  } catch (error) {
    console.error('Error sending password reset email:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
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
          textVersion: emailData.text || null
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

      const settingsDoc = await getDoc(doc(firestoreDb, 'system', 'emailSettings'));
      
      if (settingsDoc.exists()) {
        const data = settingsDoc.data();
        // Include SMTP password for internal use
        return {
          ...data,
          smtpPassword: data.smtpPassword || ''
        };
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
          systemAlerts: true,
                  smtpHost: 'smtp.sendgrid.net',
        smtpPort: 587,
        smtpUser: 'apikey',
        smtpSecure: false,
        smtpPassword: 'SG.your-sendgrid-api-key',
          // Add AWS-compatible settings
          smtpTlsRejectUnauthorized: false,
          smtpConnectionTimeout: 60000,
          smtpGreetingTimeout: 30000,
          smtpSocketTimeout: 60000
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
        systemAlerts: true,
        smtpHost: 'smtp.sendgrid.net',
        smtpPort: 587,
        smtpUser: 'apikey',
        smtpSecure: false,
        smtpPassword: 'SG.your-sendgrid-api-key',
        // Add AWS-compatible settings
        smtpTlsRejectUnauthorized: false,
        smtpConnectionTimeout: 60000,
        smtpGreetingTimeout: 30000,
        smtpSocketTimeout: 60000
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