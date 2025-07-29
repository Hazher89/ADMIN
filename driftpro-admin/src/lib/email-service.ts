import { db } from './firebase';
import { collection, addDoc, updateDoc, doc, getDoc, getDocs, query, where } from 'firebase/firestore';

export interface EmailTemplate {
  id: string;
  type: EmailType;
  subject: string;
  body: string;
  variables: string[];
}

export type EmailType = 
  | 'employee_added'
  | 'deviation_reported'
  | 'deviation_updated'
  | 'vacation_request'
  | 'vacation_approved'
  | 'vacation_rejected'
  | 'absence_request'
  | 'absence_approved'
  | 'absence_rejected'
  | 'shift_assigned'
  | 'shift_updated'
  | 'password_reset'
  | 'welcome_message'
  | 'chat_message';

export interface EmailData {
  to: string | string[];
  cc?: string | string[];
  bcc?: string | string[];
  subject: string;
  body: string;
  attachments?: Array<{
    filename: string;
    content: string;
    contentType: string;
  }>;
  metadata?: {
    companyId?: string;
    userId?: string;
    eventType: EmailType;
    timestamp: string;
  };
}

class EmailService {
  private readonly senderEmail = 'driftpro@driftpro.no';
  private readonly senderName = 'DriftPro System';
  private readonly smtpConfig = {
    host: 'smtp.domeneshop.no',
    port: 587,
    secure: false,
    auth: {
      user: 'driftpro@driftpro.no',
      pass: 'HazGada1989!'
    }
  };

  // Email templates
  private templates: Record<EmailType, EmailTemplate> = {
    employee_added: {
      id: 'employee_added',
      type: 'employee_added',
      subject: 'Ny ansatt tilføyd: {employeeName}',
      body: `
        <h2>Ny ansatt tilføyd</h2>
        <p>En ny ansatt har blitt tilføyd til {companyName}:</p>
        <ul>
          <li><strong>Navn:</strong> {employeeName}</li>
          <li><strong>E-post:</strong> {employeeEmail}</li>
          <li><strong>Telefon:</strong> {employeePhone}</li>
          <li><strong>Avdeling:</strong> {department}</li>
          <li><strong>Rolle:</strong> {role}</li>
          <li><strong>Tilføyd av:</strong> {addedBy}</li>
        </ul>
        <p>Den nye ansatte vil motta en velkomstmelding med innloggingsinformasjon.</p>
      `,
      variables: ['employeeName', 'employeeEmail', 'employeePhone', 'department', 'role', 'companyName', 'addedBy']
    },

    deviation_reported: {
      id: 'deviation_reported',
      type: 'deviation_reported',
      subject: 'Nytt avvik rapportert: {deviationId}',
      body: `
        <h2>Nytt avvik rapportert</h2>
        <p>Et nytt avvik har blitt rapportert:</p>
        <ul>
          <li><strong>Avvik ID:</strong> {deviationId}</li>
          <li><strong>Rapportert av:</strong> {reportedBy}</li>
          <li><strong>Kategori:</strong> {category}</li>
          <li><strong>Prioritet:</strong> {priority}</li>
          <li><strong>Beskrivelse:</strong> {description}</li>
          <li><strong>Lokasjon:</strong> {location}</li>
          <li><strong>Dato:</strong> {reportedAt}</li>
        </ul>
        <p>Klikk <a href="https://admin.driftpro.no/deviations/{deviationId}">her</a> for å se detaljer og håndtere avviket.</p>
      `,
      variables: ['deviationId', 'reportedBy', 'category', 'priority', 'description', 'location', 'reportedAt']
    },

    deviation_updated: {
      id: 'deviation_updated',
      type: 'deviation_updated',
      subject: 'Avvik oppdatert: {deviationId}',
      body: `
        <h2>Avvik oppdatert</h2>
        <p>Et avvik har blitt oppdatert:</p>
        <ul>
          <li><strong>Avvik ID:</strong> {deviationId}</li>
          <li><strong>Ny status:</strong> {newStatus}</li>
          <li><strong>Oppdatert av:</strong> {updatedBy}</li>
          <li><strong>Kommentar:</strong> {comment}</li>
          <li><strong>Dato:</strong> {updatedAt}</li>
        </ul>
        <p>Klikk <a href="https://admin.driftpro.no/deviations/{deviationId}">her</a> for å se alle detaljer.</p>
      `,
      variables: ['deviationId', 'newStatus', 'updatedBy', 'comment', 'updatedAt']
    },

    vacation_request: {
      id: 'vacation_request',
      type: 'vacation_request',
      subject: 'Ferieforespørsel: {employeeName}',
      body: `
        <h2>Ny ferieforespørsel</h2>
        <p>En ny ferieforespørsel har blitt sendt inn:</p>
        <ul>
          <li><strong>Ansatt:</strong> {employeeName}</li>
          <li><strong>Fra dato:</strong> {fromDate}</li>
          <li><strong>Til dato:</strong> {toDate}</li>
          <li><strong>Antall dager:</strong> {days}</li>
          <li><strong>Type:</strong> {vacationType}</li>
          <li><strong>Begrunnelse:</strong> {reason}</li>
        </ul>
        <p>Klikk <a href="https://admin.driftpro.no/vacation">her</a> for å godkjenne eller avvise forespørselen.</p>
      `,
      variables: ['employeeName', 'fromDate', 'toDate', 'days', 'vacationType', 'reason']
    },

    vacation_approved: {
      id: 'vacation_approved',
      type: 'vacation_approved',
      subject: 'Ferieforespørsel godkjent',
      body: `
        <h2>Ferieforespørsel godkjent</h2>
        <p>Din ferieforespørsel har blitt godkjent:</p>
        <ul>
          <li><strong>Fra dato:</strong> {fromDate}</li>
          <li><strong>Til dato:</strong> {toDate}</li>
          <li><strong>Antall dager:</strong> {days}</li>
          <li><strong>Godkjent av:</strong> {approvedBy}</li>
          <li><strong>Kommentar:</strong> {comment}</li>
        </ul>
        <p>God ferie!</p>
      `,
      variables: ['fromDate', 'toDate', 'days', 'approvedBy', 'comment']
    },

    vacation_rejected: {
      id: 'vacation_rejected',
      type: 'vacation_rejected',
      subject: 'Ferieforespørsel avvist',
      body: `
        <h2>Ferieforespørsel avvist</h2>
        <p>Din ferieforespørsel har blitt avvist:</p>
        <ul>
          <li><strong>Fra dato:</strong> {fromDate}</li>
          <li><strong>Til dato:</strong> {toDate}</li>
          <li><strong>Avvist av:</strong> {rejectedBy}</li>
          <li><strong>Begrunnelse:</strong> {reason}</li>
        </ul>
        <p>Kontakt din leder for mer informasjon.</p>
      `,
      variables: ['fromDate', 'toDate', 'rejectedBy', 'reason']
    },

    absence_request: {
      id: 'absence_request',
      type: 'absence_request',
      subject: 'Fraværsmelding: {employeeName}',
      body: `
        <h2>Ny fraværsmelding</h2>
        <p>En ny fraværsmelding har blitt sendt inn:</p>
        <ul>
          <li><strong>Ansatt:</strong> {employeeName}</li>
          <li><strong>Dato:</strong> {date}</li>
          <li><strong>Type:</strong> {absenceType}</li>
          <li><strong>Begrunnelse:</strong> {reason}</li>
          <li><strong>Dokumentasjon:</strong> {hasDocumentation ? 'Ja' : 'Nei'}</li>
        </ul>
        <p>Klikk <a href="https://admin.driftpro.no/absence">her</a> for å håndtere meldingen.</p>
      `,
      variables: ['employeeName', 'date', 'absenceType', 'reason', 'hasDocumentation']
    },

    absence_approved: {
      id: 'absence_approved',
      type: 'absence_approved',
      subject: 'Fraværsmelding godkjent',
      body: `
        <h2>Fraværsmelding godkjent</h2>
        <p>Din fraværsmelding har blitt godkjent:</p>
        <ul>
          <li><strong>Dato:</strong> {date}</li>
          <li><strong>Type:</strong> {absenceType}</li>
          <li><strong>Godkjent av:</strong> {approvedBy}</li>
          <li><strong>Kommentar:</strong> {comment}</li>
        </ul>
      `,
      variables: ['date', 'absenceType', 'approvedBy', 'comment']
    },

    absence_rejected: {
      id: 'absence_rejected',
      type: 'absence_rejected',
      subject: 'Fraværsmelding avvist',
      body: `
        <h2>Fraværsmelding avvist</h2>
        <p>Din fraværsmelding har blitt avvist:</p>
        <ul>
          <li><strong>Dato:</strong> {date}</li>
          <li><strong>Type:</strong> {absenceType}</li>
          <li><strong>Avvist av:</strong> {rejectedBy}</li>
          <li><strong>Begrunnelse:</strong> {reason}</li>
        </ul>
        <p>Kontakt din leder for mer informasjon.</p>
      `,
      variables: ['date', 'absenceType', 'rejectedBy', 'reason']
    },

    shift_assigned: {
      id: 'shift_assigned',
      type: 'shift_assigned',
      subject: 'Vakt tildelt: {employeeName}',
      body: `
        <h2>Ny vakt tildelt</h2>
        <p>Du har blitt tildelt en ny vakt:</p>
        <ul>
          <li><strong>Dato:</strong> {date}</li>
          <li><strong>Starttid:</strong> {startTime}</li>
          <li><strong>Sluttid:</strong> {endTime}</li>
          <li><strong>Avdeling:</strong> {department}</li>
          <li><strong>Beskrivelse:</strong> {description}</li>
          <li><strong>Tildelt av:</strong> {assignedBy}</li>
        </ul>
        <p>Klikk <a href="https://admin.driftpro.no/shifts">her</a> for å godkjenne eller avvise vakten.</p>
      `,
      variables: ['date', 'startTime', 'endTime', 'department', 'description', 'assignedBy']
    },

    shift_updated: {
      id: 'shift_updated',
      type: 'shift_updated',
      subject: 'Vakt oppdatert: {employeeName}',
      body: `
        <h2>Vakt oppdatert</h2>
        <p>En vakt har blitt oppdatert:</p>
        <ul>
          <li><strong>Dato:</strong> {date}</li>
          <li><strong>Starttid:</strong> {startTime}</li>
          <li><strong>Sluttid:</strong> {endTime}</li>
          <li><strong>Endring:</strong> {change}</li>
          <li><strong>Oppdatert av:</strong> {updatedBy}</li>
        </ul>
      `,
      variables: ['date', 'startTime', 'endTime', 'change', 'updatedBy']
    },

    password_reset: {
      id: 'password_reset',
      type: 'password_reset',
      subject: 'Tilbakestill passord - DriftPro',
      body: `
        <h2>Tilbakestill passord</h2>
        <p>Du har bedt om å tilbakestille passordet ditt for DriftPro.</p>
        <p>Klikk på lenken nedenfor for å tilbakestille passordet:</p>
        <p><a href="{resetLink}" style="background-color: #3B82F6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Tilbakestill passord</a></p>
        <p>Denne lenken utløper om 1 time.</p>
        <p>Hvis du ikke ba om å tilbakestille passordet, kan du ignorere denne e-posten.</p>
      `,
      variables: ['resetLink']
    },

    welcome_message: {
      id: 'welcome_message',
      type: 'welcome_message',
      subject: 'Velkommen til DriftPro - {employeeName}',
      body: `
        <h2>Velkommen til DriftPro!</h2>
        <p>Hei {employeeName},</p>
        <p>Du har blitt registrert i DriftPro-systemet for {companyName}.</p>
        <p>Din innloggingsinformasjon:</p>
        <ul>
          <li><strong>E-post:</strong> {email}</li>
          <li><strong>Passord:</strong> {password}</li>
        </ul>
        <p>Du kan logge inn på:</p>
        <ul>
          <li><strong>Web Admin:</strong> <a href="https://admin.driftpro.no">admin.driftpro.no</a></li>
          <li><strong>Mobile App:</strong> Last ned DriftPro-appen</li>
        </ul>
        <p>Vennligst endre passordet ditt ved første innlogging.</p>
        <p>Velkommen!</p>
      `,
      variables: ['employeeName', 'companyName', 'email', 'password']
    },

    chat_message: {
      id: 'chat_message',
      type: 'chat_message',
      subject: 'Ny melding i chat: {chatName}',
      body: `
        <h2>Ny melding i chat</h2>
        <p>Du har mottatt en ny melding i {chatName}:</p>
        <ul>
          <li><strong>Fra:</strong> {senderName}</li>
          <li><strong>Melding:</strong> {message}</li>
          <li><strong>Tid:</strong> {timestamp}</li>
        </ul>
        <p>Klikk <a href="https://admin.driftpro.no/chat">her</a> for å svare.</p>
      `,
      variables: ['chatName', 'senderName', 'message', 'timestamp']
    }
  };

  // Send email using SMTP
  async sendEmail(emailData: EmailData): Promise<boolean> {
    try {
      // Log email to Firebase for tracking
      await this.logEmailToFirebase(emailData);

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
      return false;
    }
  }

  // Log email to Firebase for tracking
  private async logEmailToFirebase(emailData: EmailData): Promise<void> {
    try {
      await addDoc(collection(db, 'emailLogs'), {
        ...emailData,
        sentAt: new Date().toISOString(),
        status: 'sent',
        sender: this.senderEmail
      });
    } catch (error) {
      console.error('Error logging email to Firebase:', error);
    }
  }

  // Get email template
  getTemplate(type: EmailType): EmailTemplate {
    return this.templates[type];
  }

  // Replace variables in template
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

  // Send notification email for specific events
  async sendNotificationEmail(
    type: EmailType,
    variables: Record<string, string>,
    recipients: string | string[],
    metadata?: any
  ): Promise<boolean> {
    const template = this.getTemplate(type);
    const { subject, body } = this.replaceVariables(template, variables);

    const emailData: EmailData = {
      to: recipients,
      subject,
      body,
      metadata: {
        eventType: type,
        timestamp: new Date().toISOString(),
        ...metadata
      }
    };

    return await this.sendEmail(emailData);
  }

  // Get company admins for notifications
  async getCompanyAdmins(companyId: string): Promise<string[]> {
    try {
      const companyDoc = await getDoc(doc(db, 'companies', companyId));
      if (companyDoc.exists()) {
        const companyData = companyDoc.data();
        return [companyData.adminEmail];
      }
      return [];
    } catch (error) {
      console.error('Error getting company admins:', error);
      return [];
    }
  }

  // Get department leaders for notifications
  async getDepartmentLeaders(departmentId: string): Promise<string[]> {
    try {
      const departmentDoc = await getDoc(doc(db, 'departments', departmentId));
      if (departmentDoc.exists()) {
        const departmentData = departmentDoc.data();
        return departmentData.leaders || [];
      }
      return [];
    } catch (error) {
      console.error('Error getting department leaders:', error);
      return [];
    }
  }

  // Send password reset email
  async sendPasswordResetEmail(email: string, resetToken: string): Promise<boolean> {
    const resetLink = `https://admin.driftpro.no/reset-password?token=${resetToken}`;
    
    return await this.sendNotificationEmail(
      'password_reset',
      { resetLink },
      email
    );
  }

  // Send welcome email to new employee
  async sendWelcomeEmail(employeeData: any, companyData: any): Promise<boolean> {
    const variables = {
      employeeName: employeeData.name,
      companyName: companyData.name,
      email: employeeData.email,
      password: employeeData.temporaryPassword || 'TemporaryPassword123!'
    };

    return await this.sendNotificationEmail(
      'welcome_message',
      variables,
      employeeData.email,
      { companyId: companyData.id, userId: employeeData.id }
    );
  }
}

export const emailService = new EmailService();