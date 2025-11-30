import { microsoftGraphService } from './microsoft-graph-service';

export interface EmailContent {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  fromEmail?: string;
}

export class GlobalEmailService {
  private static instance: GlobalEmailService;
  private isAuthenticated: boolean = false;
  private currentAccount: any = null;

  private constructor() {
    this.checkAuthenticationStatus();
  }

  public static getInstance(): GlobalEmailService {
    if (!GlobalEmailService.instance) {
      GlobalEmailService.instance = new GlobalEmailService();
    }
    return GlobalEmailService.instance;
  }

  public async checkAuthenticationStatus() {
    try {
      // Initialize MSAL first to restore any existing session
      await microsoftGraphService.initializeMSAL();
      
      const account = microsoftGraphService.getCurrentAccount();
      if (account) {
        this.isAuthenticated = true;
        this.currentAccount = account;
        console.log('✅ Global Email Service: Microsoft Graph authentication found');
      } else {
        this.isAuthenticated = false;
        this.currentAccount = null;
        console.log('ℹ️ Global Email Service: No Microsoft Graph authentication found');
      }
    } catch (error) {
      console.error('Error checking Microsoft Graph auth:', error);
      this.isAuthenticated = false;
      this.currentAccount = null;
    }
  }

  public async sendEmail(emailContent: EmailContent): Promise<{ success: boolean; error?: string; messageId?: string }> {
    try {
      // Prefer server-side app-only API (fast avsender) — no login required
      const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
      const response = await fetch(`${baseUrl}/api/email/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: emailContent.to,
          subject: emailContent.subject,
          html: emailContent.html,
          text: emailContent.text,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          console.log('✅ E-post sendt via server API (fast avsender):', emailContent.subject);
          return { success: true, messageId: result.messageId || `msg_${Date.now()}` };
        }
      }

      // Fallback: bruk interaktiv MSAL hvis server API ikke er konfigurert
      try {
        await this.checkAuthenticationStatus();
        if (!this.isAuthenticated || !this.currentAccount) {
          throw new Error('Server API feilet og ingen Microsoft Graph-innlogging er aktiv.');
        }

        const accessToken = await microsoftGraphService.getAccessToken();
        const fallbackResponse = await fetch(`${baseUrl}/api/send-welcome-email`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: Array.isArray(emailContent.to) ? emailContent.to[0] : emailContent.to,
            displayName: '',
            adminName: '',
            companyName: 'DriftPro',
            departmentName: '',
            position: '',
            accessToken,
            fromEmail: emailContent.fromEmail || this.currentAccount.username,
            setupUrl: undefined,
            password: undefined,
            passwordSet: false,
          }),
        });

        if (!fallbackResponse.ok) {
          const errorData = await fallbackResponse.json().catch(() => ({}));
          throw new Error(`Fallback e-post API feil: ${fallbackResponse.status} ${fallbackResponse.statusText} - ${errorData.error || 'Ukjent feil'}`);
        }

        const result = await fallbackResponse.json();
        return { success: !!result.success };
      } catch (fallbackErr) {
        console.error('Microsoft Graph fallback feilet:', fallbackErr);
        return { success: false, error: fallbackErr instanceof Error ? fallbackErr.message : 'Ukjent feil' };
      }
    } catch (error: any) {
      console.error('❌ Feil ved sending av e-post:', error);
      return { success: false, error: error.message || 'Ukjent feil' };
    }
  }

  // Convenience methods for common email types
  public async sendWelcomeEmail(to: string, employeeName: string, companyName: string): Promise<{ success: boolean; error?: string }> {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Velkommen til ${companyName}!</h2>
        <p>Hei ${employeeName},</p>
        <p>Velkommen til ${companyName}! Vi er glade for å ha deg med på laget.</p>
        <p>Du kan nå logge inn på DriftPro-systemet med din e-postadresse.</p>
        <p>Hvis du har spørsmål, ikke nøl med å ta kontakt.</p>
        <br>
        <p>Med vennlig hilsen,<br>${companyName}-teamet</p>
      </div>
    `;

    const result = await this.sendEmail({
      to,
      subject: `Velkommen til ${companyName}!`,
      html
    });

    return result;
  }

  public async sendPasswordResetEmail(to: string, resetLink: string, companyName: string): Promise<{ success: boolean; error?: string }> {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Tilbakestill passord</h2>
        <p>Du har bedt om å tilbakestille passordet ditt for ${companyName}.</p>
        <p>Klikk på lenken under for å tilbakestille passordet:</p>
        <p><a href="${resetLink}" style="background-color: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Tilbakestill passord</a></p>
        <p>Hvis du ikke ba om denne e-posten, kan du ignorere den.</p>
        <br>
        <p>Med vennlig hilsen,<br>${companyName}-teamet</p>
      </div>
    `;

    const result = await this.sendEmail({
      to,
      subject: `Tilbakestill passord - ${companyName}`,
      html
    });

    return result;
  }

  public async sendVacationRequestEmail(to: string[], employeeName: string, startDate: string, endDate: string, companyName: string): Promise<{ success: boolean; error?: string }> {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Ny ferieforespørsel</h2>
        <p>${employeeName} har sendt inn en ferieforespørsel:</p>
        <ul>
          <li><strong>Fra:</strong> ${startDate}</li>
          <li><strong>Til:</strong> ${endDate}</li>
        </ul>
        <p>Vennligst logg inn på DriftPro-systemet for å godkjenne eller avslå forespørselen.</p>
        <br>
        <p>Med vennlig hilsen,<br>DriftPro-systemet</p>
      </div>
    `;

    const result = await this.sendEmail({
      to,
      subject: `Ferieforespørsel fra ${employeeName} - ${companyName}`,
      html
    });

    return result;
  }

  public async sendAbsenceReportEmail(to: string[], employeeName: string, absenceType: string, date: string, companyName: string): Promise<{ success: boolean; error?: string }> {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #dc2626;">Fraværsrapport</h2>
        <p>${employeeName} har rapportert fravær:</p>
        <ul>
          <li><strong>Type:</strong> ${absenceType}</li>
          <li><strong>Dato:</strong> ${date}</li>
        </ul>
        <p>Vennligst logg inn på DriftPro-systemet for å se mer informasjon.</p>
        <br>
        <p>Med vennlig hilsen,<br>DriftPro-systemet</p>
      </div>
    `;

    const result = await this.sendEmail({
      to,
      subject: `Fraværsrapport fra ${employeeName} - ${companyName}`,
      html
    });

    return result;
  }

  public async sendSystemAlertEmail(to: string[], alertMessage: string, companyName: string): Promise<{ success: boolean; error?: string }> {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #dc2626;">Systemvarsel</h2>
        <p>${alertMessage}</p>
        <p>Vennligst logg inn på DriftPro-systemet for mer informasjon.</p>
        <br>
        <p>Med vennlig hilsen,<br>DriftPro-systemet</p>
      </div>
    `;

    const result = await this.sendEmail({
      to,
      subject: `Systemvarsel - ${companyName}`,
      html
    });

    return result;
  }

  public isEmailServiceAvailable(): boolean {
    return this.isAuthenticated && this.currentAccount !== null;
  }

  public getCurrentUserEmail(): string | null {
    return this.currentAccount?.username || null;
  }
}

// Export singleton instance
export const globalEmailService = GlobalEmailService.getInstance();
