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

export class EmailService {
  private baseUrl: string;

  constructor() {
    // Use Netlify domain for emails
    this.baseUrl = 'https://admin.driftpro.no';
    console.log('📧 EMAIL SERVICE: Base URL set to:', this.baseUrl);
  }

  private async getEmailSettings() {
    try {
      const emailSettingsRef = doc(db, 'systemSettings', 'email');
      const emailSettingsDoc = await getDoc(emailSettingsRef);
      
      if (emailSettingsDoc.exists()) {
        const data = emailSettingsDoc.data();
        console.log('📧 Found email settings in Firestore:', {
          smtpHost: data.smtpHost,
          smtpUser: data.smtpUser,
          fromEmail: data.fromEmail,
          provider: 'domeneshop_smtp'
        });
        
        return {
        smtpHost: data.smtpHost || 'smtp-mail.outlook.com',
        smtpPort: data.smtpPort || 587,
        smtpUser: data.smtpUser || 'driftpro@mavilogistikk.no',
        smtpPassword: data.smtpPassword || 'HazGada1989',
        smtpSecure: data.smtpSecure || false,
        fromEmail: data.fromEmail || 'driftpro@mavilogistikk.no',
          fromName: data.fromName || 'DriftPro System',
          tls: data.tls || { rejectUnauthorized: false },
          connectionTimeout: data.connectionTimeout || 60000,
          greetingTimeout: data.greetingTimeout || 30000,
          socketTimeout: data.socketTimeout || 60000
        };
      }
      
      console.log('📧 Using default Office 365 SMTP settings');
      // Return default Office 365 SMTP settings
      return {
        smtpHost: 'smtp-mail.outlook.com',
        smtpPort: 587,
        smtpUser: 'driftpro@mavilogistikk.no',
        smtpPassword: 'HazGada1989',
        smtpSecure: false,
        fromEmail: 'driftpro@mavilogistikk.no',
        fromName: 'DriftPro System',
        tls: { rejectUnauthorized: false },
        connectionTimeout: 60000,
        greetingTimeout: 30000,
        socketTimeout: 60000
      };
    } catch (error) {
      console.error('❌ Error getting email settings:', error);
      // Return default Office 365 SMTP settings
      return {
        smtpHost: 'smtp-mail.outlook.com',
        smtpPort: 587,
        smtpUser: 'driftpro@mavilogistikk.no',
        smtpPassword: 'HazGada1989',
        smtpSecure: false,
        fromEmail: 'driftpro@mavilogistikk.no',
        fromName: 'DriftPro System',
        tls: { rejectUnauthorized: false },
        connectionTimeout: 60000,
        greetingTimeout: 30000,
        socketTimeout: 60000
      };
    }
  }

  async sendEmail(to: string | string[], subject: string, html: string, text?: string) {
    try {
      const emailSettings = await this.getEmailSettings();
      
      console.log('📧 Attempting to send email via Office 365 SMTP:', {
        to: Array.isArray(to) ? to : [to],
        subject,
        smtpHost: emailSettings.smtpHost,
        smtpUser: emailSettings.smtpUser,
        fromEmail: emailSettings.fromEmail,
        provider: 'office365_smtp'
      });
      
      // Use nodemailer directly instead of fetch request
      const nodemailer = await import('nodemailer');
      
      const transporter = nodemailer.default.createTransporter({
        host: emailSettings.smtpHost,
        port: emailSettings.smtpPort,
        secure: emailSettings.smtpSecure,
        auth: {
          user: emailSettings.smtpUser,
          pass: emailSettings.smtpPassword
        },
        tls: emailSettings.tls,
        connectionTimeout: emailSettings.connectionTimeout,
        greetingTimeout: emailSettings.greetingTimeout,
        socketTimeout: emailSettings.socketTimeout
      });

      const mailOptions = {
        from: `${emailSettings.fromName} <${emailSettings.fromEmail}>`,
        to: Array.isArray(to) ? to.join(', ') : to,
        subject: subject,
        html: html,
        text: text || this.htmlToText(html)
      };

      const info = await transporter.sendMail(mailOptions);

      // Log email to Firestore
      await addDoc(collection(db, 'emailLogs'), {
        to: Array.isArray(to) ? to : [to],
        subject: subject,
        content: html,
        type: 'system',
        status: 'sent',
        sentAt: serverTimestamp(),
        messageId: info.messageId || 'unknown',
        metadata: {
          provider: 'office365_smtp',
          timestamp: new Date().toISOString(),
          smtpHost: emailSettings.smtpHost,
          fromEmail: emailSettings.fromEmail
        }
      });

      console.log('✅ Email sent successfully via Office 365 SMTP:', {
        messageId: info.messageId,
        to: Array.isArray(to) ? to : [to],
        subject,
        provider: 'office365_smtp'
      });
      
      return { success: true, messageId: info.messageId || 'unknown' };
    } catch (error) {
      console.error('❌ Email sending failed:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        to: Array.isArray(to) ? to : [to],
        subject,
        provider: 'office365_smtp'
      });
      
      // Log error to Firestore
      await addDoc(collection(db, 'emailLogs'), {
        to: Array.isArray(to) ? to : [to],
        subject: subject,
        content: html,
        type: 'system',
        status: 'failed',
        sentAt: serverTimestamp(),
        error: error instanceof Error ? error.message : 'Unknown error',
        metadata: {
          provider: 'office365_smtp',
          timestamp: new Date().toISOString(),
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      });

      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  private htmlToText(html: string): string {
    // Simple HTML to text conversion
    return html
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .replace(/&nbsp;/g, ' ') // Replace &nbsp; with space
      .replace(/&amp;/g, '&') // Replace &amp; with &
      .replace(/&lt;/g, '<') // Replace &lt; with <
      .replace(/&gt;/g, '>') // Replace &gt; with >
      .replace(/\s+/g, ' ') // Replace multiple spaces with single space
      .trim();
  }

  async sendAdminSetupEmail(adminEmail: string, adminName: string, companyName: string, setupToken: string) {
    const setupUrl = `${this.baseUrl}/setup-password/${setupToken}`;
    
    const html = `
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

    return this.sendEmail(adminEmail, `Velkommen til ${companyName} - Sett opp passord`, html);
  }

  async sendPasswordResetEmail(email: string, resetToken: string) {
    const resetUrl = `${this.baseUrl}/reset-password?token=${resetToken}`;
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f9fafb; padding: 20px;">
        <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <h1 style="color: #1f2937; text-align: center; margin-bottom: 30px;">Tilbakestill passord</h1>
          
          <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
            Du har bedt om å tilbakestille passordet ditt for DriftPro-kontoen din.
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" 
               style="background-color: #dc2626; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
              🔑 Tilbakestill passord
            </a>
          </div>
          
          <p style="color: #6b7280; font-size: 14px; margin-top: 30px; text-align: center;">
            Hvis knappen ikke fungerer, kan du kopiere og lime inn denne lenken i nettleseren din:
          </p>
          <p style="color: #3b82f6; font-size: 14px; text-align: center; word-break: break-all;">
            ${resetUrl}
          </p>
          
          <p style="color: #6b7280; font-size: 14px; margin-top: 20px;">
            Hvis du ikke ba om å tilbakestille passordet, kan du trygt ignorere denne e-posten.
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

    return this.sendEmail(email, 'Tilbakestill passord - DriftPro', html);
  }

  async sendDeviationReportEmail(to: string[], deviationTitle: string, message: string, reporterName: string) {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f9fafb; padding: 20px;">
        <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <h1 style="color: #dc2626; text-align: center; margin-bottom: 30px;">⚠️ Avviksrapport</h1>
          
          <div style="background-color: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
            <h2 style="color: #991b1b; margin-top: 0;">${deviationTitle}</h2>
            <p style="color: #7f1d1d; font-size: 16px; line-height: 1.6; margin-bottom: 0;">
              ${message}
            </p>
          </div>
          
          <p style="color: #6b7280; font-size: 14px; margin-top: 20px;">
            <strong>Rapportert av:</strong> ${reporterName}
          </p>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center;">
            <p style="color: #6b7280; font-size: 14px; margin: 0;">
              Med vennlig hilsen,<br>
              DriftPro System<br>
              driftpro@mavilogistikk.no
            </p>
          </div>
        </div>
      </div>
    `;

    return this.sendEmail(to, `Avviksrapport: ${deviationTitle}`, html);
  }

  async sendNotificationEmail(to: string[], subject: string, message: string, priority: string = 'normal') {
    const priorityColors = {
      low: '#059669',
      normal: '#3b82f6',
      high: '#dc2626',
      urgent: '#7c2d12'
    };

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f9fafb; padding: 20px;">
        <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <h1 style="color: ${priorityColors[priority as keyof typeof priorityColors] || '#3b82f6'}; text-align: center; margin-bottom: 30px;">
            📢 ${subject}
          </h1>
          
          <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
            <p style="color: #334155; font-size: 16px; line-height: 1.6; margin: 0;">
              ${message}
            </p>
          </div>
          
          <p style="color: #6b7280; font-size: 14px; margin-top: 20px;">
            <strong>Prioritet:</strong> ${priority.charAt(0).toUpperCase() + priority.slice(1)}
          </p>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center;">
            <p style="color: #6b7280; font-size: 14px; margin: 0;">
              Med vennlig hilsen,<br>
              DriftPro System<br>
              driftpro@mavilogistikk.no
            </p>
          </div>
        </div>
      </div>
    `;

    return this.sendEmail(to, `Varsel: ${subject}`, html);
  }

  async sendWelcomeEmail(userEmail: string, userName: string, companyName: string) {
    const loginUrl = `${this.baseUrl}/login`;
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f9fafb; padding: 20px;">
        <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <h1 style="color: #059669; text-align: center; margin-bottom: 30px;">🎉 Velkommen til ${companyName}!</h1>
          
          <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
            Hei ${userName},
          </p>
          
          <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
            Velkommen til DriftPro-systemet! Din konto er nå opprettet og klar til bruk.
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${loginUrl}" 
               style="background-color: #059669; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
              🚀 Logg inn nå
            </a>
          </div>
          
          <p style="color: #6b7280; font-size: 14px; margin-top: 30px; text-align: center;">
            Hvis knappen ikke fungerer, kan du kopiere og lime inn denne lenken i nettleseren din:
          </p>
          <p style="color: #3b82f6; font-size: 14px; text-align: center; word-break: break-all;">
            ${loginUrl}
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

    return this.sendEmail(userEmail, `Velkommen til ${companyName} - DriftPro`, html);
  }

  // New notification methods using professional templates
  async sendNewCompanyNotification(adminEmail: string, companyName: string, adminName: string) {
    const template = EmailTemplates.getNewCompanyNotificationTemplate(adminEmail, companyName, adminName);
    return this.sendEmail(adminEmail, template.subject, template.html);
  }

  async sendVacationRequestNotification(adminEmail: string, employeeName: string, startDate: string, endDate: string, days: number) {
    const template = EmailTemplates.getVacationRequestTemplate(adminEmail, employeeName, startDate, endDate, days);
    return this.sendEmail(adminEmail, template.subject, template.html);
  }

  async sendDeviationReportNotification(adminEmail: string, reporterName: string, deviationTitle: string, description: string, severity: string) {
    const template = EmailTemplates.getDeviationReportTemplate(adminEmail, reporterName, deviationTitle, description, severity);
    return this.sendEmail(adminEmail, template.subject, template.html);
  }

  async sendPartnerAssignmentNotification(partnerEmail: string, partnerName: string, routeName: string, assignmentDate: string) {
    const template = EmailTemplates.getPartnerAssignmentTemplate(partnerEmail, partnerName, routeName, assignmentDate);
    return this.sendEmail(partnerEmail, template.subject, template.html);
  }

  async sendNewUserNotification(adminEmail: string, userName: string, companyName: string, role: string) {
    const template = EmailTemplates.getNewUserTemplate(adminEmail, userName, companyName, role);
    return this.sendEmail(adminEmail, template.subject, template.html);
  }

  async sendAuditNotification(adminEmail: string, auditType: string, findings: string, severity: string) {
    const template = EmailTemplates.getAuditNotificationTemplate(adminEmail, auditType, findings, severity);
    return this.sendEmail(adminEmail, template.subject, template.html);
  }
}

// Export singleton instance

export const emailService = new EmailService();
export default emailService;

