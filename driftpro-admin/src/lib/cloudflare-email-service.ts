// Cloudflare Email Service using Gmail SMTP with Cloudflare domain
export interface CloudflareEmailConfig {
  gmailUser: string;
  gmailAppPassword: string;
  fromEmail: string;
  fromName: string;
}

export interface CloudflareEmailContent {
  to: string[];
  subject: string;
  html: string;
  text?: string;
}

class CloudflareEmailService {
  private config: CloudflareEmailConfig | null = null;
  private isConfigured = false;

  constructor() {
    this.initializeConfig();
  }

  private initializeConfig() {
    const gmailUser = process.env.GMAIL_USER;
    const gmailAppPassword = process.env.GMAIL_APP_PASSWORD;
    const fromEmail = process.env.CLOUDFLARE_FROM_EMAIL || 'noreplay@driftpro.no';
    const fromName = process.env.CLOUDFLARE_FROM_NAME || 'DriftPro System';

    if (gmailUser && gmailAppPassword) {
      this.config = {
        gmailUser,
        gmailAppPassword,
        fromEmail,
        fromName
      };
      this.isConfigured = true;
      console.log('✅ Cloudflare Email Service configured with Gmail SMTP');
    } else {
      console.warn('⚠️ Cloudflare Email Service not configured - missing Gmail credentials');
      console.log('Required: GMAIL_USER, GMAIL_APP_PASSWORD');
    }
  }

  async sendEmail(emailContent: CloudflareEmailContent): Promise<boolean> {
    if (!this.isConfigured || !this.config) {
      console.warn('⚠️ Cloudflare Email Service not configured, cannot send email');
      return false;
    }

    try {
      // Use Gmail SMTP to send emails from your Cloudflare domain
      const transporter = await this.createTransporter();
      
      const mailOptions = {
        from: `${this.config.fromName} <${this.config.fromEmail}>`,
        to: emailContent.to.join(', '),
        subject: emailContent.subject,
        html: emailContent.html,
        text: emailContent.text || this.htmlToText(emailContent.html)
      };

      const info = await transporter.sendMail(mailOptions);
      console.log('✅ Email sent successfully via Cloudflare Email Service:', info.messageId);
      return true;

    } catch (error) {
      console.error('❌ Failed to send email via Cloudflare Email Service:', error);
      return false;
    }
  }

  private async createTransporter() {
    // Dynamic import to avoid SSR issues
    const nodemailer = await import('nodemailer');
    
    return nodemailer.default.createTransport({
      service: 'gmail',
      auth: {
        user: this.config!.gmailUser,
        pass: this.config!.gmailAppPassword
      }
    });
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

  async sendWelcomeEmail(to: string, name: string, companyName: string, setupToken: string): Promise<boolean> {
    const subject = `Velkommen til DriftPro - ${companyName}`;
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Velkommen til DriftPro</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #2563eb;">Velkommen til DriftPro!</h1>
          </div>
          
          <p>Hei ${name},</p>
          
          <p>Velkommen til DriftPro! Du har blitt lagt til som administrator for bedriften <strong>${companyName}</strong>.</p>
          
          <div style="background-color: #f8fafc; border-left: 4px solid #2563eb; padding: 15px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #2563eb;">Neste steg:</h3>
            <p>For å komme i gang, må du sette opp passordet ditt:</p>
            <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/setup-password?token=${setupToken}" 
               style="display: inline-block; background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 10px;">
              Sett opp passord
            </a>
          </div>
          
          <p>Hvis lenken ikke fungerer, kan du kopiere denne adressen til nettleseren:</p>
          <p style="background-color: #f1f5f9; padding: 10px; border-radius: 4px; font-family: monospace; word-break: break-all;">
            ${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/setup-password?token=${setupToken}
          </p>
          
          <p>Hvis du har spørsmål, ikke nøl med å ta kontakt.</p>
          
          <p>Med vennlig hilsen,<br>
          <strong>DriftPro Team</strong></p>
        </div>
      </body>
      </html>
    `;

    return this.sendEmail({ to: [to], subject, html });
  }

  async sendPasswordResetEmail(to: string, resetToken: string): Promise<boolean> {
    const subject = 'Tilbakestill passord - DriftPro';
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Tilbakestill passord</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #dc2626;">Tilbakestill passord</h1>
          </div>
          
          <p>Du har bedt om å tilbakestille passordet ditt for DriftPro.</p>
          
          <div style="background-color: #fef2f2; border-left: 4px solid #dc2626; padding: 15px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #dc2626;">Klikk her for å tilbakestille passordet:</h3>
            <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}" 
               style="display: inline-block; background-color: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 10px;">
              Tilbakestill passord
            </a>
          </div>
          
          <p>Hvis lenken ikke fungerer, kan du kopiere denne adressen til nettleseren:</p>
          <p style="background-color: #f1f5f9; padding: 10px; border-radius: 4px; font-family: monospace; word-break: break-all;">
            ${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}
          </p>
          
          <p>Denne lenken er gyldig i 1 time.</p>
          
          <p>Hvis du ikke ba om å tilbakestille passordet, kan du ignorere denne e-posten.</p>
          
          <p>Med vennlig hilsen,<br>
          <strong>DriftPro Team</strong></p>
        </div>
      </body>
      </html>
    `;

    return this.sendEmail({ to: [to], subject, html });
  }
}

export const cloudflareEmailService = new CloudflareEmailService();
export default cloudflareEmailService;
