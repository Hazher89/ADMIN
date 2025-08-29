export interface SMSMessage {
  to: string;
  message: string;
  from?: string;
  priority?: 'low' | 'normal' | 'high';
}

export interface SMSResponse {
  success: boolean;
  messageId?: string;
  error?: string;
  cost?: number;
}

export class SveveSMSService {
  private apiKey: string;
  private apiUrl: string;
  private defaultFrom: string;

  constructor(apiKey: string, defaultFrom?: string) {
    this.apiKey = apiKey;
    this.apiUrl = 'https://sveve.no/SMS/SendMessage'; // Sveve's real API endpoint
    this.defaultFrom = defaultFrom || 'DriftPro';
  }

  /**
   * Send SMS message
   */
  async sendSMS(message: SMSMessage): Promise<SMSResponse> {
    try {
      console.log('📱 Sending SMS via Sveve:', {
        to: message.to,
        message: message.message.substring(0, 50) + '...',
        from: message.from || this.defaultFrom,
        apiUrl: this.apiUrl,
        apiKey: this.apiKey ? '***' + this.apiKey.slice(-4) : 'Missing'
      });

      // Testing Sveve API now that webhooks are configured
      console.log('🔑 Testing Sveve API with webhooks configured...');
      
      // Sveve's real API endpoint
      const params = new URLSearchParams({
        user: 'MAVI',
        passwd: 'Mavimeldinger2025',
        to: message.to,
        msg: message.message,
        f: 'json',
        from: 'DriftPro'
      });
      
      const response = await fetch(`${this.apiUrl}?${params.toString()}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      console.log('📱 Sveve API response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('📱 Sveve API error response:', errorText);
        throw new Error(`SMS API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log('📱 Sveve API success response:', data);
      
      return {
        success: true,
        messageId: data.response?.ids?.[0] || data.id,
        cost: (data.response?.stdSMSCount || 1) * 0.15
      };
      
    } catch (error) {
      console.error('📱 SMS sending error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Send bulk SMS to multiple recipients
   */
  async sendBulkSMS(messages: SMSMessage[]): Promise<SMSResponse[]> {
    const results: SMSResponse[] = [];
    
    for (const message of messages) {
      const result = await this.sendSMS(message);
      results.push(result);
      
      // Rate limiting - wait 100ms between messages
      if (messages.length > 1) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    return results;
  }

  /**
   * Send password reset SMS
   */
  async sendPasswordReset(phoneNumber: string, resetCode: string, userName: string): Promise<SMSResponse> {
    const message = `Hei ${userName}! Din tilbakestillingskode for DriftPro er: ${resetCode}. Koden er gyldig i 15 minutter.`;
    
    return this.sendSMS({
      to: phoneNumber,
      message,
      priority: 'high'
    });
  }

  /**
   * Send new assignment notification
   */
  async sendNewAssignment(phoneNumber: string, partnerName: string, assignmentTitle: string, startTime: string): Promise<SMSResponse> {
    const message = `Nytt oppdrag for ${partnerName}: ${assignmentTitle}. Start: ${startTime}. Logg inn på DriftPro for detaljer.`;
    
    return this.sendSMS({
      to: phoneNumber,
      message,
      priority: 'high'
    });
  }

  /**
   * Send employee welcome message
   */
  async sendEmployeeWelcome(phoneNumber: string, employeeName: string, companyName: string, loginUrl: string): Promise<SMSResponse> {
    const message = `Velkommen til DriftPro, ${employeeName}! Du er nå registrert hos ${companyName}. Logg inn på: ${loginUrl}`;
    
    return this.sendSMS({
      to: phoneNumber,
      message,
      priority: 'normal'
    });
  }

  /**
   * Send company welcome message
   */
  async sendCompanyWelcome(phoneNumber: string, companyName: string, adminName: string, loginUrl: string): Promise<SMSResponse> {
    const message = `Velkommen til DriftPro, ${companyName}! Administratoren ${adminName} har opprettet din bedriftskonto. Logg inn på: ${loginUrl}`;
    
    return this.sendSMS({
      to: phoneNumber,
      message,
      priority: 'normal'
    });
  }

  /**
   * Send password reset code
   */
  async sendPasswordResetCode(phoneNumber: string, userName: string, resetCode: string): Promise<SMSResponse> {
    const message = `Hei ${userName}! Din tilbakestillingskode for DriftPro er: ${resetCode}. Koden er gyldig i 15 minutter.`;
    
    return this.sendSMS({
      to: phoneNumber,
      message,
      priority: 'high'
    });
  }

  /**
   * Send password changed confirmation
   */
  async sendPasswordChanged(phoneNumber: string, userName: string): Promise<SMSResponse> {
    const message = `Hei ${userName}! Ditt passord i DriftPro er endret. Hvis du ikke gjorde dette, kontakt administrator umiddelbart.`;
    
    return this.sendSMS({
      to: phoneNumber,
      message,
      priority: 'high'
    });
  }

  /**
   * Send account locked notification
   */
  async sendAccountLocked(phoneNumber: string, userName: string, reason: string): Promise<SMSResponse> {
    const message = `🚨 ${userName}, din DriftPro-konto er låst. Årsak: ${reason}. Kontakt administrator for hjelp.`;
    
    return this.sendSMS({
      to: phoneNumber,
      message,
      priority: 'high'
    });
  }

  /**
   * Send account unlocked notification
   */
  async sendAccountUnlocked(phoneNumber: string, userName: string): Promise<SMSResponse> {
    const message = `✅ ${userName}, din DriftPro-konto er låst opp igjen. Du kan nå logge inn som vanlig.`;
    
    return this.sendSMS({
      to: phoneNumber,
      message,
      priority: 'normal'
    });
  }

  /**
   * Send new employee notification to admin
   */
  async sendNewEmployeeNotification(phoneNumber: string, adminName: string, employeeName: string, position: string): Promise<SMSResponse> {
    const message = `👤 Ny ansatt registrert: ${employeeName} som ${position}. Logg inn på DriftPro for å godkjenne.`;
    
    return this.sendSMS({
      to: phoneNumber,
      message,
      priority: 'normal'
    });
  }

  /**
   * Send new company notification to super admin
   */
  async sendNewCompanyNotification(phoneNumber: string, adminName: string, companyName: string, industry: string): Promise<SMSResponse> {
    const message = `🏢 Ny bedrift registrert: ${companyName} (${industry}). Logg inn på DriftPro for å godkjenne.`;
    
    return this.sendSMS({
      to: phoneNumber,
      message,
      priority: 'normal'
    });
  }

  /**
   * Send shift reminder
   */
  async sendShiftReminder(phoneNumber: string, employeeName: string, shiftName: string, startTime: string, date: string): Promise<SMSResponse> {
    const message = `⏰ Påminnelse: ${shiftName} starter ${date} kl. ${startTime}. Ha en god vakt!`;
    
    return this.sendSMS({
      to: phoneNumber,
      message,
      priority: 'normal'
    });
  }

  /**
   * Send overtime approval request
   */
  async sendOvertimeRequest(phoneNumber: string, managerName: string, employeeName: string, hours: number, date: string): Promise<SMSResponse> {
    const message = `⏰ Overtidsforespørsel fra ${employeeName}: ${hours} timer ${date}. Logg inn på DriftPro for å godkjenne.`;
    
    return this.sendSMS({
      to: phoneNumber,
      message,
      priority: 'normal'
    });
  }

  /**
   * Send overtime approved/rejected
   */
  async sendOvertimeResponse(phoneNumber: string, employeeName: string, approved: boolean, hours: number, date: string): Promise<SMSResponse> {
    const status = approved ? 'godkjent' : 'avvist';
    const message = `⏰ Din overtidsforespørsel ${hours} timer ${date} er ${status}. Logg inn på DriftPro for detaljer.`;
    
    return this.sendSMS({
      to: phoneNumber,
      message,
      priority: 'normal'
    });
  }

  /**
   * Send document shared notification
   */
  async sendDocumentShared(phoneNumber: string, userName: string, documentName: string, sharedBy: string): Promise<SMSResponse> {
    const message = `📎 Nytt dokument delt med deg: ${documentName} fra ${sharedBy}. Logg inn på DriftPro.`;
    
    return this.sendSMS({
      to: phoneNumber,
      message,
      priority: 'normal'
    });
  }

  /**
   * Send report ready notification
   */
  async sendReportReady(phoneNumber: string, userName: string, reportName: string, reportUrl: string): Promise<SMSResponse> {
    const message = `📊 Rapport klar: ${reportName} er tilgjengelig. Logg inn på DriftPro for å se den.`;
    
    return this.sendSMS({
      to: phoneNumber,
      message,
      priority: 'low'
    });
  }

  /**
   * Send system maintenance notification
   */
  async sendSystemMaintenance(phoneNumber: string, userName: string, maintenanceType: string, startTime: string, duration: string): Promise<SMSResponse> {
    const message = `🔧 Vedlikehold: ${maintenanceType} starter ${startTime}. Forventet varighet: ${duration}.`;
    
    return this.sendSMS({
      to: phoneNumber,
      message,
      priority: 'normal'
    });
  }

  /**
   * Send security alert
   */
  async sendSecurityAlert(phoneNumber: string, userName: string, alertType: string, description: string): Promise<SMSResponse> {
    const message = `🚨 SIKKERHETSVARSEL: ${alertType}. ${description}. Logg inn på DriftPro umiddelbart.`;
    
    return this.sendSMS({
      to: phoneNumber,
      message,
      priority: 'high'
    });
  }

  /**
   * Send birthday reminder
   */
  async sendBirthdayReminder(phoneNumber: string, managerName: string, employeeName: string, birthDate: string): Promise<SMSResponse> {
    const message = `🎂 Påminnelse: ${employeeName} har bursdag ${birthDate}. Husk å gratulere!`;
    
    return this.sendSMS({
      to: phoneNumber,
      message,
      priority: 'low'
    });
  }

  /**
   * Send contract expiry reminder
   */
  async sendContractExpiryReminder(phoneNumber: string, userName: string, contractType: string, expiryDate: string): Promise<SMSResponse> {
    const message = `📋 Kontrakt utløper snart: ${contractType} utløper ${expiryDate}. Logg inn på DriftPro for å fornye.`;
    
    return this.sendSMS({
      to: phoneNumber,
      message,
      priority: 'normal'
    });
  }

  /**
   * Send vacation request notification
   */
  async sendVacationRequest(phoneNumber: string, employeeName: string, startDate: string, endDate: string): Promise<SMSResponse> {
    const message = `Ferie-søknad fra ${employeeName}: ${startDate} til ${endDate}. Logg inn på DriftPro for å godkjenne.`;
    
    return this.sendSMS({
      to: phoneNumber,
      message,
      priority: 'normal'
    });
  }

  /**
   * Send vacation approval/rejection
   */
  async sendVacationResponse(phoneNumber: string, employeeName: string, approved: boolean, startDate: string, endDate: string): Promise<SMSResponse> {
    const status = approved ? 'godkjent' : 'avvist';
    const message = `Din ferie-søknad ${startDate} til ${endDate} er ${status}. Logg inn på DriftPro for detaljer.`;
    
    return this.sendSMS({
      to: phoneNumber,
      message,
      priority: 'normal'
    });
  }

  /**
   * Send absence notification
   */
  async sendAbsenceNotification(phoneNumber: string, employeeName: string, date: string, reason: string): Promise<SMSResponse> {
    const message = `Fravær registrert: ${employeeName} ${date}. Årsak: ${reason}. Logg inn på DriftPro.`;
    
    return this.sendSMS({
      to: phoneNumber,
      message,
      priority: 'high'
    });
  }

  /**
   * Send shift change notification
   */
  async sendShiftChange(phoneNumber: string, employeeName: string, oldShift: string, newShift: string, date: string): Promise<SMSResponse> {
    const message = `Vakt endret for ${employeeName} ${date}: ${oldShift} → ${newShift}. Logg inn på DriftPro.`;
    
    return this.sendSMS({
      to: phoneNumber,
      message,
      priority: 'high'
    });
  }

  /**
   * Send shift cancellation
   */
  async sendShiftCancellation(phoneNumber: string, employeeName: string, shift: string, date: string): Promise<SMSResponse> {
    const message = `Vakt avlyst: ${employeeName} ${date} ${shift}. Logg inn på DriftPro for ny tildeling.`;
    
    return this.sendSMS({
      to: phoneNumber,
      message,
      priority: 'high'
    });
  }

  /**
   * Send new user welcome
   */
  async sendWelcomeMessage(phoneNumber: string, userName: string, loginUrl: string): Promise<SMSResponse> {
    const message = `Velkommen til DriftPro, ${userName}! Logg inn på: ${loginUrl}. Ditt passord er sendt på e-post.`;
    
    return this.sendSMS({
      to: phoneNumber,
      message,
      priority: 'normal'
    });
  }

  /**
   * Send critical alert
   */
  async sendCriticalAlert(phoneNumber: string, alertType: string, description: string): Promise<SMSResponse> {
    const message = `🚨 KRITISK VARSEL: ${alertType}. ${description}. Logg inn på DriftPro umiddelbart.`;
    
    return this.sendSMS({
      to: phoneNumber,
      message,
      priority: 'high'
    });
  }

  /**
   * Send system maintenance notification
   */
  async sendMaintenanceNotification(phoneNumber: string, maintenanceType: string, startTime: string, duration: string): Promise<SMSResponse> {
    const message = `🔧 Vedlikehold: ${maintenanceType} starter ${startTime}. Forventet varighet: ${duration}.`;
    
    return this.sendSMS({
      to: phoneNumber,
      message,
      priority: 'normal'
    });
  }

  /**
   * Send report ready notification
   */
  async sendReportReady(phoneNumber: string, reportName: string, reportUrl: string): Promise<SMSResponse> {
    const message = `📊 Rapport klar: ${reportName} er tilgjengelig. Logg inn på DriftPro for å se den.`;
    
    return this.sendSMS({
      to: phoneNumber,
      message,
      priority: 'low'
    });
  }

  /**
   * Send partner document shared notification
   */
  async sendDocumentShared(phoneNumber: string, partnerName: string, documentName: string): Promise<SMSResponse> {
    const message = `📎 Nytt dokument delt med ${partnerName}: ${documentName}. Logg inn på DriftPro.`;
    
    return this.sendSMS({
      to: phoneNumber,
      message,
      priority: 'normal'
    });
  }

  /**
   * Send partner assignment response notification
   */
  async sendAssignmentResponse(phoneNumber: string, partnerName: string, assignmentTitle: string, response: string): Promise<SMSResponse> {
    const message = `📋 ${partnerName} har svart på oppdrag "${assignmentTitle}": ${response}. Logg inn på DriftPro.`;
    
    return this.sendSMS({
      to: phoneNumber,
      message,
      priority: 'normal'
    });
  }

  /**
   * Validate phone number format
   */
  validatePhoneNumber(phoneNumber: string): boolean {
    // Norwegian phone number validation - simplified and flexible
    const cleaned = phoneNumber.replace(/\s/g, '');
    
    // Simple validation: must start with 4 or 9 and be 8 digits, or have +47/47/0047 prefix
    if (cleaned.startsWith('+47') && cleaned.length === 11) {
      return /^\+47[49]\d{7}$/.test(cleaned);
    }
    if (cleaned.startsWith('47') && cleaned.length === 10) {
      return /^47[49]\d{7}$/.test(cleaned);
    }
    if (cleaned.startsWith('0047') && cleaned.length === 12) {
      return /^0047[49]\d{7}$/.test(cleaned);
    }
    if (cleaned.startsWith('4') && cleaned.length === 8) {
      return /^4\d{7}$/.test(cleaned);
    }
    if (cleaned.startsWith('9') && cleaned.length === 8) {
      return /^9\d{7}$/.test(cleaned);
    }
    
    console.log(`🔍 Phone validation: ${phoneNumber} → ${cleaned} → ❌ Invalid format`);
    return false;
  }

  /**
   * Format phone number for SMS
   */
  formatPhoneNumber(phoneNumber: string): string {
    // Remove spaces and ensure +47 prefix
    const cleaned = phoneNumber.replace(/\s/g, '');
    
    // Handle different input formats
    if (cleaned.startsWith('0047') && cleaned.length === 12) {
      return `+${cleaned.substring(2)}`; // 0047XXXXXXXX → +47XXXXXXXX
    }
    if (cleaned.startsWith('47') && cleaned.length === 10) {
      return `+${cleaned}`; // 47XXXXXXXX → +47XXXXXXXX
    }
    if (cleaned.startsWith('+47')) {
      return cleaned; // +47XXXXXXXX → +47XXXXXXXX
    }
    if (cleaned.startsWith('4') || cleaned.startsWith('9')) {
      return `+47${cleaned}`; // 4XXXXXXXX → +474XXXXXXXX
    }
    
    return cleaned; // Return as-is if no pattern matches
  }

  /**
   * Get SMS cost estimate
   */
  getSMSCostEstimate(messageLength: number, recipientCount: number): number {
    // Approximate cost per SMS (adjust based on actual Sveve pricing)
    const costPerSMS = 0.15; // NOK per SMS
    const smsCount = Math.ceil(messageLength / 160) * recipientCount; // 160 chars per SMS
    return smsCount * costPerSMS;
  }
}

// Export singleton instance
export const sveveSMS = new SveveSMSService(
  process.env.SVEVE_API_KEY || '',
  process.env.SVEVE_DEFAULT_FROM || 'DriftPro'
);
