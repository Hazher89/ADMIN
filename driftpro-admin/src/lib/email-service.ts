import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  serverTimestamp
} from 'firebase/firestore';
import { db } from './firebase';
import nodemailer from 'nodemailer';

export interface EmailTemplate {
  subject: string;
  body: string;
  variables: string[];
}

export type EmailType =
  | 'deviation_reported'
  | 'deviation_assigned'
  | 'deviation_resolved'
  | 'vacation_requested'
  | 'vacation_approved'
  | 'vacation_rejected'
  | 'absence_requested'
  | 'absence_approved'
  | 'absence_rejected'
  | 'shift_assigned'
  | 'shift_updated'
  | 'shift_cancelled'
  | 'document_shared'
  | 'chat_message'
  | 'employee_added'
  | 'employee_updated'
  | 'employee_removed'
  | 'password_reset'
  | 'welcome_email'
  | 'system_maintenance'
  | 'security_alert'
  | 'test_email';

export interface EmailData {
  to: string | string[];
  subject: string;
  body: string;
  metadata?: {
    eventType?: EmailType;
    userId?: string;
    companyId?: string;
    itemId?: string;
    [key: string]: unknown;
  };
}

export interface EmailLog {
  id: string;
  to: string[];
  subject: string;
  content: string;
  eventType: EmailType;
  metadata: Record<string, unknown>;
  status: 'sent' | 'failed';
  error?: string;
  sentAt: string;
}

export interface EmailConfig {
  senderEmail: string;
  senderName: string;
  smtpHost: string;
  smtpPort: number;
  smtpUser: string;
  smtpPass: string;
}

const defaultConfig: EmailConfig = {
  senderEmail: 'driftpro.system@gmail.com',
  senderName: 'DriftPro',
  smtpHost: 'smtp.gmail.com',
  smtpPort: 587,
  smtpUser: 'driftpro.system@gmail.com',
  smtpPass: 'your-app-password-here' // Gmail App Password
};

class EmailService {
  private async getConfig() {
    try {
      // Try to get config from Firebase first
      if (db) {
        const configDoc = doc(db, 'systemConfig', 'emailSettings');
        const configSnapshot = await getDoc(configDoc);
        
        if (configSnapshot.exists()) {
          const config = configSnapshot.data();
          return {
            senderEmail: config.senderEmail || 'driftpro.system@gmail.com',
            senderName: config.senderName || 'DriftPro',
            smtpHost: config.smtpHost || 'smtp.gmail.com',
            smtpPort: config.smtpPort || 587,
            smtpUser: config.smtpUser || 'driftpro.system@gmail.com',
            smtpPass: config.smtpPass || 'your-app-password-here' // Gmail App Password
          };
        }
      }
    } catch (error) {
      console.error('Error loading email config from Firebase:', error);
    }
    
    // Fallback to localStorage if Firebase fails
    try {
      const savedConfig = localStorage.getItem('emailConfig');
      if (savedConfig) {
        const config = JSON.parse(savedConfig);
        return {
          senderEmail: config.senderEmail || 'driftpro.system@gmail.com',
          senderName: config.senderName || 'DriftPro',
          smtpHost: config.smtpHost || 'smtp.gmail.com',
          smtpPort: config.smtpPort || 587,
          smtpUser: config.smtpUser || 'driftpro.system@gmail.com',
          smtpPass: config.smtpPass || 'your-app-password-here' // Gmail App Password
        };
      }
    } catch (error) {
      console.error('Error parsing email config from localStorage:', error);
    }
    
    // Default configuration - Using Gmail SMTP for better reliability
    return {
      senderEmail: 'driftpro.system@gmail.com',
      senderName: 'DriftPro',
      smtpHost: 'smtp.gmail.com',
      smtpPort: 587,
      smtpUser: 'driftpro.system@gmail.com',
      smtpPass: 'your-app-password-here' // Gmail App Password
    };
  }

  private get smtpConfig() {
    // This needs to be handled differently since getConfig is now async
    // For now, return a default config and handle async loading in sendEmail
    return {
      host: 'smtp.domeneshop.no',
      port: 587,
      secure: false,
      auth: {
        user: 'noreply@driftpro.no',
        pass: 'HazGada1989!'
      }
    };
  }

  private get senderEmail() {
    return 'noreply@driftpro.no';
  }

  private get senderName() {
    return 'DriftPro';
  }

  private templates: Record<EmailType, EmailTemplate> = {
    deviation_reported: {
      subject: 'Nytt avvik rapportert - {deviationTitle}',
      body: `
        <h2>Nytt avvik rapportert</h2>
        <p>Et nytt avvik har blitt rapportert av {reporterName}.</p>
        <p><strong>Avvik:</strong> {deviationTitle}</p>
        <p><strong>Beskrivelse:</strong> {deviationDescription}</p>
        <p><strong>Prioritet:</strong> {priority}</p>
        <p><strong>Lokasjon:</strong> {location}</p>
        <p><strong>Dato:</strong> {date}</p>
        <p>Klikk <a href="{deviationUrl}">her</a> for å se detaljer.</p>
      `,
      variables: ['reporterName', 'deviationTitle', 'deviationDescription', 'priority', 'location', 'date', 'deviationUrl']
    },
    deviation_assigned: {
      subject: 'Avvik tildelt til deg - {deviationTitle}',
      body: `
        <h2>Avvik tildelt</h2>
        <p>Du har blitt tildelt et avvik av {assignerName}.</p>
        <p><strong>Avvik:</strong> {deviationTitle}</p>
        <p><strong>Beskrivelse:</strong> {deviationDescription}</p>
        <p><strong>Prioritet:</strong> {priority}</p>
        <p><strong>Frist:</strong> {deadline}</p>
        <p>Klikk <a href="{deviationUrl}">her</a> for å se detaljer.</p>
      `,
      variables: ['assignerName', 'deviationTitle', 'deviationDescription', 'priority', 'deadline', 'deviationUrl']
    },
    deviation_resolved: {
      subject: 'Avvik løst - {deviationTitle}',
      body: `
        <h2>Avvik løst</h2>
        <p>Avviket "{deviationTitle}" har blitt løst av {resolverName}.</p>
        <p><strong>Løsning:</strong> {resolution}</p>
        <p><strong>Løst dato:</strong> {resolvedDate}</p>
        <p>Klikk <a href="{deviationUrl}">her</a> for å se detaljer.</p>
      `,
      variables: ['deviationTitle', 'resolverName', 'resolution', 'resolvedDate', 'deviationUrl']
    },
    vacation_requested: {
      subject: 'Forespørsel om ferie - {employeeName}',
      body: `
        <h2>Forespørsel om ferie</h2>
        <p>{employeeName} har sendt inn en forespørsel om ferie.</p>
        <p><strong>Periode:</strong> {startDate} - {endDate}</p>
        <p><strong>Antall dager:</strong> {days}</p>
        <p><strong>Årsak:</strong> {reason}</p>
        <p>Klikk <a href="{requestUrl}">her</a> for å godkjenne eller avvise.</p>
      `,
      variables: ['employeeName', 'startDate', 'endDate', 'days', 'reason', 'requestUrl']
    },
    vacation_approved: {
      subject: 'Ferie godkjent - {employeeName}',
      body: `
        <h2>Ferie godkjent</h2>
        <p>Din forespørsel om ferie har blitt godkjent av {approverName}.</p>
        <p><strong>Periode:</strong> {startDate} - {endDate}</p>
        <p><strong>Antall dager:</strong> {days}</p>
        <p>Klikk <a href="{requestUrl}">her</a> for å se detaljer.</p>
      `,
      variables: ['approverName', 'startDate', 'endDate', 'days', 'requestUrl']
    },
    vacation_rejected: {
      subject: 'Ferie avvist - {employeeName}',
      body: `
        <h2>Ferie avvist</h2>
        <p>Din forespørsel om ferie har blitt avvist av {rejecterName}.</p>
        <p><strong>Periode:</strong> {startDate} - {endDate}</p>
        <p><strong>Årsak:</strong> {reason}</p>
        <p>Klikk <a href="{requestUrl}">her</a> for å se detaljer.</p>
      `,
      variables: ['rejecterName', 'startDate', 'endDate', 'reason', 'requestUrl']
    },
    absence_requested: {
      subject: 'Forespørsel om fravær - {employeeName}',
      body: `
        <h2>Forespørsel om fravær</h2>
        <p>{employeeName} har sendt inn en forespørsel om fravær.</p>
        <p><strong>Dato:</strong> {date}</p>
        <p><strong>Årsak:</strong> {reason}</p>
        <p><strong>Type:</strong> {type}</p>
        <p>Klikk <a href="{requestUrl}">her</a> for å godkjenne eller avvise.</p>
      `,
      variables: ['employeeName', 'date', 'reason', 'type', 'requestUrl']
    },
    absence_approved: {
      subject: 'Fravær godkjent - {employeeName}',
      body: `
        <h2>Fravær godkjent</h2>
        <p>Din forespørsel om fravær har blitt godkjent av {approverName}.</p>
        <p><strong>Dato:</strong> {date}</p>
        <p><strong>Type:</strong> {type}</p>
        <p>Klikk <a href="{requestUrl}">her</a> for å se detaljer.</p>
      `,
      variables: ['approverName', 'date', 'type', 'requestUrl']
    },
    absence_rejected: {
      subject: 'Fravær avvist - {employeeName}',
      body: `
        <h2>Fravær avvist</h2>
        <p>Din forespørsel om fravær har blitt avvist av {rejecterName}.</p>
        <p><strong>Dato:</strong> {date}</p>
        <p><strong>Årsak:</strong> {reason}</p>
        <p>Klikk <a href="{requestUrl}">her</a> for å se detaljer.</p>
      `,
      variables: ['rejecterName', 'date', 'reason', 'requestUrl']
    },
    shift_assigned: {
      subject: 'Skift tildelt - {employeeName}',
      body: `
        <h2>Skift tildelt</h2>
        <p>Du har blitt tildelt et nytt skift av {assignerName}.</p>
        <p><strong>Dato:</strong> {date}</p>
        <p><strong>Start:</strong> {startTime}</p>
        <p><strong>Slutt:</strong> {endTime}</p>
        <p><strong>Avdeling:</strong> {department}</p>
        <p>Klikk <a href="{shiftUrl}">her</a> for å se detaljer.</p>
      `,
      variables: ['assignerName', 'date', 'startTime', 'endTime', 'department', 'shiftUrl']
    },
    shift_updated: {
      subject: 'Skift oppdatert - {employeeName}',
      body: `
        <h2>Skift oppdatert</h2>
        <p>Ditt skift har blitt oppdatert av {updaterName}.</p>
        <p><strong>Dato:</strong> {date}</p>
        <p><strong>Start:</strong> {startTime}</p>
        <p><strong>Slutt:</strong> {endTime}</p>
        <p><strong>Endring:</strong> {change}</p>
        <p>Klikk <a href="{shiftUrl}">her</a> for å se detaljer.</p>
      `,
      variables: ['updaterName', 'date', 'startTime', 'endTime', 'change', 'shiftUrl']
    },
    shift_cancelled: {
      subject: 'Skift kansellert - {employeeName}',
      body: `
        <h2>Skift kansellert</h2>
        <p>Ditt skift har blitt kansellert av {cancellerName}.</p>
        <p><strong>Dato:</strong> {date}</p>
        <p><strong>Årsak:</strong> {reason}</p>
        <p>Klikk <a href="{shiftUrl}">her</a> for å se detaljer.</p>
      `,
      variables: ['cancellerName', 'date', 'reason', 'shiftUrl']
    },
    document_shared: {
      subject: 'Dokument delt - {documentName}',
      body: `
        <h2>Dokument delt</h2>
        <p>{sharerName} har delt et dokument med deg.</p>
        <p><strong>Dokument:</strong> {documentName}</p>
        <p><strong>Beskrivelse:</strong> {description}</p>
        <p><strong>Dato:</strong> {date}</p>
        <p>Klikk <a href="{documentUrl}">her</a> for å se dokumentet.</p>
      `,
      variables: ['sharerName', 'documentName', 'description', 'date', 'documentUrl']
    },
    chat_message: {
      subject: 'Ny melding i chat - {chatName}',
      body: `
        <h2>Ny melding</h2>
        <p>Du har mottatt en ny melding i {chatName} fra {senderName}.</p>
        <p><strong>Melding:</strong> {message}</p>
        <p><strong>Tid:</strong> {time}</p>
        <p>Klikk <a href="{chatUrl}">her</a> for å svare.</p>
      `,
      variables: ['chatName', 'senderName', 'message', 'time', 'chatUrl']
    },
    employee_added: {
      subject: 'Ny ansatt lagt til - {employeeName}',
      body: `
        <h2>Ny ansatt</h2>
        <p>En ny ansatt har blitt lagt til av {adderName}.</p>
        <p><strong>Navn:</strong> {employeeName}</p>
        <p><strong>E-post:</strong> {email}</p>
        <p><strong>Avdeling:</strong> {department}</p>
        <p><strong>Stilling:</strong> {position}</p>
        <p>Klikk <a href="{employeeUrl}">her</a> for å se profil.</p>
      `,
      variables: ['adderName', 'employeeName', 'email', 'department', 'position', 'employeeUrl']
    },
    employee_updated: {
      subject: 'Ansatt oppdatert - {employeeName}',
      body: `
        <h2>Ansatt oppdatert</h2>
        <p>Profilen til {employeeName} har blitt oppdatert av {updaterName}.</p>
        <p><strong>Endringer:</strong> {changes}</p>
        <p><strong>Dato:</strong> {date}</p>
        <p>Klikk <a href="{employeeUrl}">her</a> for å se profil.</p>
      `,
      variables: ['employeeName', 'updaterName', 'changes', 'date', 'employeeUrl']
    },
    employee_removed: {
      subject: 'Ansatt fjernet - {employeeName}',
      body: `
        <h2>Ansatt fjernet</h2>
        <p>{employeeName} har blitt fjernet fra systemet av {removerName}.</p>
        <p><strong>Årsak:</strong> {reason}</p>
        <p><strong>Dato:</strong> {date}</p>
      `,
      variables: ['employeeName', 'removerName', 'reason', 'date']
    },
    password_reset: {
      subject: 'Tilbakestill passord - DriftPro',
      body: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #3B82F6; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1 style="margin: 0; font-size: 24px;">Tilbakestill passord</h1>
          </div>
          
          <div style="background-color: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px;">
            <p>Hei,</p>
            
            <p>Du har bedt om å tilbakestille passordet ditt for DriftPro-kontoen din.</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="{resetUrl}" style="background-color: #3B82F6; color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
                🔐 Tilbakestill passord
              </a>
            </div>
            
            <p style="font-size: 14px; color: #6b7280;">
              <strong>Viktig:</strong> Hvis knappen ikke fungerer, kopier denne adressen til nettleseren din:
            </p>
            <div style="background-color: #f3f4f6; padding: 12px; border-radius: 6px; font-family: monospace; font-size: 12px; word-break: break-all; margin: 10px 0;">
              {resetUrl}
            </div>
            
            <p style="font-size: 14px; color: #6b7280;">
              <strong>Denne lenken utløper om 1 time.</strong>
            </p>
            
            <p>Hvis du ikke ba om å tilbakestille passordet ditt, kan du trygt ignorere denne e-posten.</p>
            
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
            
            <p style="font-size: 14px; color: #6b7280;">
              Hvis du har spørsmål, ikke nøl med å kontakte oss.
            </p>
            
            <p style="margin-bottom: 0;">
              Med vennlig hilsen,<br>
              <strong>DriftPro-teamet</strong>
            </p>
          </div>
        </div>
      `,
      variables: ['email', 'resetUrl', 'resetToken']
    },
    welcome_email: {
      subject: 'Velkommen til DriftPro - Sett opp passordet ditt',
      body: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #3B82F6; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1 style="margin: 0; font-size: 24px;">Velkommen til DriftPro!</h1>
          </div>
          
          <div style="background-color: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px;">
            <p>Hei <strong>{employeeName}</strong>,</p>
            
            <p>Din konto har blitt opprettet av <strong>{adminName}</strong>.</p>
            
            <div style="background-color: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #3B82F6;">
              <h3 style="margin-top: 0; color: #374151;">Kontoinformasjon:</h3>
              <p><strong>Bedrift:</strong> {companyName}</p>
              <p><strong>Avdeling:</strong> {department}</p>
              <p><strong>Stilling:</strong> {position}</p>
              <p><strong>E-post:</strong> {employeeEmail}</p>
            </div>
            
            <p>For å komme i gang må du først sette opp passordet ditt:</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="{passwordSetupUrl}" style="background-color: #3B82F6; color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
                🔐 Sett opp passord
              </a>
            </div>
            
            <p style="font-size: 14px; color: #6b7280;">
              <strong>Viktig:</strong> Hvis knappen ikke fungerer, kopier denne adressen til nettleseren din:
            </p>
            <div style="background-color: #f3f4f6; padding: 12px; border-radius: 6px; font-family: monospace; font-size: 12px; word-break: break-all; margin: 10px 0;">
              {passwordSetupUrl}
            </div>
            
            <p>Etter at du har satt opp passordet kan du logge inn på <a href="{loginUrl}" style="color: #3B82F6;">DriftPro</a>.</p>
            
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
            
            <p style="font-size: 14px; color: #6b7280;">
              Hvis du har spørsmål, ikke nøl med å kontakte oss.
            </p>
            
            <p style="margin-bottom: 0;">
              Med vennlig hilsen,<br>
              <strong>DriftPro-teamet</strong>
            </p>
          </div>
        </div>
      `,
      variables: ['employeeName', 'adminName', 'companyName', 'department', 'position', 'employeeEmail', 'loginUrl', 'passwordSetupUrl']
    },
    system_maintenance: {
      subject: 'Systemvedlikehold - DriftPro',
      body: `
        <h2>Systemvedlikehold</h2>
        <p>DriftPro vil være nede for vedlikehold.</p>
        <p><strong>Dato:</strong> {date}</p>
        <p><strong>Tid:</strong> {time}</p>
        <p><strong>Varighet:</strong> {duration}</p>
        <p><strong>Årsak:</strong> {reason}</p>
        <p>Vi beklager ulempen og takker for din forståelse.</p>
      `,
      variables: ['date', 'time', 'duration', 'reason']
    },
    security_alert: {
      subject: 'Sikkerhetsvarsel - DriftPro',
      body: `
        <h2>Sikkerhetsvarsel</h2>
        <p>Et sikkerhetsvarsel har blitt utløst.</p>
        <p><strong>Type:</strong> {alertType}</p>
        <p><strong>Beskrivelse:</strong> {description}</p>
        <p><strong>Tid:</strong> {time}</p>
        <p>Kontakt systemadministrator umiddelbart.</p>
      `,
      variables: ['alertType', 'description', 'time']
    },
    test_email: {
      subject: 'Test e-post fra DriftPro',
      body: `
        <h2>Test e-post fra DriftPro</h2>
        <p>Dette er en test e-post for å verifisere at e-postinnstillingene fungerer.</p>
        <p><strong>Avsender:</strong> {senderEmail}</p>
        <p><strong>SMTP Server:</strong> {smtpHost}:{smtpPort}</p>
        <p><strong>Sendt:</strong> {sentTime}</p>
        <p>Hvis du mottar denne e-posten, fungerer e-postinnstillingene korrekt.</p>
      `,
      variables: ['senderEmail', 'smtpHost', 'smtpPort', 'sentTime']
    }
  };

  async sendEmail(emailData: EmailData): Promise<boolean> {
    try {
      // Get current email configuration
      const config = await this.getConfig();
      
      // Determine the correct endpoint based on environment
      const isDevelopment = process.env.NODE_ENV === 'development';
      const endpoint = isDevelopment 
        ? '/api/send-email' 
        : '/.netlify/functions/send-email';
      
      console.log('Sending email via endpoint:', endpoint);
      console.log('Email data:', { to: emailData.to, subject: emailData.subject });
      
      // Send email via API route or Netlify function
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          emailData,
          config
        })
      });

      console.log('Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('HTTP error:', response.status, errorText);
        return false;
      }

      const result = await response.json();
      
      if (result.success) {
        console.log('Email sent successfully via', isDevelopment ? 'API' : 'Netlify function');
        return true;
      } else {
        console.error('Failed to send email:', result.error);
        return false;
      }
    } catch (error) {
      console.error('Error sending email:', error);
      return false;
    }
  }

  async logEmailToFirebase(emailLog: Omit<EmailLog, 'id' | 'sentAt'>): Promise<void> {
    if (!db) return;

    try {
      await addDoc(collection(db, 'emailLogs'), {
        ...emailLog,
        sentAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error logging email to Firebase:', error);
    }
  }

  getTemplate(type: EmailType): EmailTemplate {
    return this.templates[type];
  }

  replaceVariables(template: EmailTemplate, variables: Record<string, string>): { subject: string; body: string } {
    let subject = template.subject;
    let body = template.body;

    template.variables.forEach(variable => {
      const value = variables[variable] || `{${variable}}`;
      const regex = new RegExp(`{${variable}}`, 'g');
      subject = subject.replace(regex, value);
      body = body.replace(regex, value);
    });

    return { subject, body };
  }

  async sendNotificationEmail(
    type: EmailType,
    recipients: string[],
    variables: Record<string, string>
  ): Promise<boolean> {
    const template = this.getTemplate(type);
    const { subject, body } = this.replaceVariables(template, variables);

    return this.sendEmail({
      to: recipients,
      subject,
      body,
      metadata: {
        eventType: type,
        ...variables
      }
    });
  }

  async getCompanyAdmins(companyId: string): Promise<string[]> {
    if (!db) return [];

    try {
      const usersQuery = query(
        collection(db, 'users'),
        where('companyId', '==', companyId),
        where('role', '==', 'admin')
      );

      const snapshot = await getDocs(usersQuery);
      return snapshot.docs.map(doc => doc.data().email).filter(Boolean);
    } catch (error) {
      console.error('Error getting company admins:', error);
      return [];
    }
  }

  async getDepartmentLeaders(companyId: string, department?: string): Promise<string[]> {
    if (!db) return [];

    try {
      let usersQuery = query(
        collection(db, 'users'),
        where('companyId', '==', companyId),
        where('role', '==', 'department_leader')
      );

      if (department) {
        usersQuery = query(usersQuery, where('department', '==', department));
      }

      const snapshot = await getDocs(usersQuery);
      return snapshot.docs.map(doc => doc.data().email).filter(Boolean);
    } catch (error) {
      console.error('Error getting department leaders:', error);
      return [];
    }
  }

  async sendPasswordResetEmail(email: string, resetToken: string): Promise<boolean> {
    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${resetToken}`;

    return this.sendNotificationEmail('password_reset', [email], {
      email,
      resetUrl,
      resetToken
    });
  }

  async sendWelcomeEmail(
    employeeEmail: string,
    employeeName: string,
    adminName: string,
    companyName: string,
    department: string,
    position: string
  ): Promise<boolean> {
    // Use a more reliable URL structure
    const baseUrl = process.env.NODE_ENV === 'development' 
      ? 'http://localhost:3001' 
      : 'https://admin.driftpro.no'; // Use the admin subdomain
    
    const passwordSetupUrl = `${baseUrl}/setup-password?email=${encodeURIComponent(employeeEmail)}&company=${encodeURIComponent(companyName)}`;
    
    return this.sendNotificationEmail('welcome_email', [employeeEmail], {
      employeeName,
      adminName,
      companyName,
      department,
      position,
      employeeEmail,
      loginUrl: baseUrl,
      passwordSetupUrl
    });
  }

  // Get current email settings
  async getSettings() {
    return this.getConfig();
  }

  // Get email logs for a company
  async getEmailLogs(companyId: string): Promise<EmailLog[]> {
    if (!db) return [];

    try {
      const logsQuery = query(
        collection(db, 'emailLogs'),
        where('metadata.companyId', '==', companyId)
      );
      
      const snapshot = await getDocs(logsQuery);
      const logs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as EmailLog[];

      // Sort by sentAt (newest first) in memory
      return logs.sort((a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime());
    } catch (error) {
      console.error('Error getting email logs:', error);
      return [];
    }
  }

  // Resend email
  async resendEmail(emailLog: EmailLog): Promise<boolean> {
    try {
      // Recreate the email data from the log
      const emailData: EmailData = {
        to: emailLog.to,
        subject: emailLog.subject,
        body: emailLog.content,
        metadata: {
          eventType: emailLog.eventType,
          ...emailLog.metadata
        }
      };

      const success = await this.sendEmail(emailData);
      
      if (success) {
        // Update the log with new timestamp
        await updateDoc(doc(db!, 'emailLogs', emailLog.id), {
          sentAt: new Date().toISOString(),
          status: 'sent',
          error: null
        });
      }

      return success;
    } catch (error) {
      console.error('Error resending email:', error);
      return false;
    }
  }

  // Export email logs to CSV
  async exportEmailLogs(companyId: string): Promise<string> {
    const logs = await this.getEmailLogs(companyId);
    
    const csvHeaders = [
      'ID',
      'To',
      'Subject',
      'Event Type',
      'Status',
      'Sent At',
      'Error'
    ];

    const csvRows = logs.map(log => [
      log.id,
      log.to.join(', '),
      log.subject,
      log.eventType,
      log.status,
      log.sentAt,
      log.error || ''
    ]);

    const csvContent = [csvHeaders, ...csvRows]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    return csvContent;
  }

  // Update email settings and save to localStorage
  async updateSettings(newSettings: {
    senderEmail: string;
    senderName: string;
    smtpHost: string;
    smtpPort: number;
    smtpUser: string;
    smtpPass: string;
  }) {
    if (!db) {
      console.error('Firebase is not initialized, cannot update settings.');
      return;
    }

    try {
      await setDoc(doc(db, 'systemConfig', 'emailSettings'), newSettings);
      console.log('Email settings updated and saved to Firebase');
    } catch (error) {
      console.error('Error saving email settings to Firebase:', error);
    }
  }
}

export const emailService = new EmailService();