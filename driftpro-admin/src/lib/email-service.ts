import {
  collection,
  addDoc,
  query,
  where,
  getDocs
} from 'firebase/firestore';
import { db } from './firebase';

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
  | 'security_alert';

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

class EmailService {
  private senderEmail = 'driftpro@driftpro.no';
  private senderName = 'DriftPro';
  private smtpConfig = {
    host: 'smtp.domeneshop.no',
    port: 587,
    secure: false,
    auth: {
      user: 'driftpro@driftpro.no',
      pass: 'HazGada1989!'
    }
  };

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
      subject: 'Tilbakestilling av passord - DriftPro',
      body: `
        <h2>Tilbakestilling av passord</h2>
        <p>Du har bedt om å tilbakestille passordet ditt.</p>
        <p>Klikk <a href="{resetUrl}">her</a> for å tilbakestille passordet.</p>
        <p>Denne lenken utløper om 1 time.</p>
        <p>Hvis du ikke ba om dette, kan du ignorere denne e-posten.</p>
      `,
      variables: ['resetUrl']
    },
    welcome_email: {
      subject: 'Velkommen til DriftPro - {employeeName}',
      body: `
        <h2>Velkommen til DriftPro!</h2>
        <p>Hei {employeeName},</p>
        <p>Velkommen til DriftPro! Din konto har blitt opprettet av {adminName}.</p>
        <p><strong>Bedrift:</strong> {companyName}</p>
        <p><strong>Avdeling:</strong> {department}</p>
        <p><strong>Stilling:</strong> {position}</p>
        <p>Du kan nå logge inn på <a href="{loginUrl}">DriftPro</a> med din e-post.</p>
        <p>Hvis du har spørsmål, ikke nøl med å kontakte oss.</p>
      `,
      variables: ['employeeName', 'adminName', 'companyName', 'department', 'position', 'loginUrl']
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
        <p>Vi har oppdaget en sikkerhetshendelse på kontoen din.</p>
        <p><strong>Hendelse:</strong> {event}</p>
        <p><strong>Dato:</strong> {date}</p>
        <p><strong>IP-adresse:</strong> {ipAddress}</p>
        <p>Hvis dette ikke var deg, vennligst endre passordet ditt umiddelbart.</p>
        <p>Klikk <a href="{securityUrl}">her</a> for å se sikkerhetsinnstillinger.</p>
      `,
      variables: ['event', 'date', 'ipAddress', 'securityUrl']
    }
  };

  async sendEmail(emailData: EmailData): Promise<boolean> {
    try {
      // Log email to Firebase for tracking
      await this.logEmailToFirebase({
        to: Array.isArray(emailData.to) ? emailData.to : [emailData.to],
        subject: emailData.subject,
        content: emailData.body,
        eventType: emailData.metadata?.eventType as EmailType || 'system_maintenance',
        metadata: emailData.metadata || {},
        status: 'sent'
      });

      // In production, this would use a real SMTP service
      // For now, we'll simulate the email sending
      console.log('Sending email:', {
        from: `${this.senderName} <${this.senderEmail}>`,
        to: emailData.to,
        subject: emailData.subject,
        body: emailData.body,
        metadata: emailData.metadata
      });

      // Simulate email sending delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      return true;
    } catch (error) {
      console.error('Error sending email:', error);
      await this.logEmailToFirebase({
        to: Array.isArray(emailData.to) ? emailData.to : [emailData.to],
        subject: emailData.subject,
        content: emailData.body,
        eventType: emailData.metadata?.eventType as EmailType || 'system_maintenance',
        metadata: emailData.metadata || {},
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
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
      resetUrl
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
    const loginUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://driftpro.no';

    return this.sendNotificationEmail('welcome_email', [employeeEmail], {
      employeeName,
      adminName,
      companyName,
      department,
      position,
      loginUrl
    });
  }
}

export const emailService = new EmailService();