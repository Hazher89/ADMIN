export interface SMSMessage {
  to: string;
  message: string;
  from?: string;
}

export interface SMSResponse {
  success: boolean;
  messageId?: string;
  error?: string;
  cost?: number;
}

export class TwilioSMSService {
  private accountSid: string;
  private authToken: string;
  private fromNumber: string;

  constructor(accountSid: string, authToken: string, fromNumber?: string) {
    this.accountSid = accountSid;
    this.authToken = authToken;
    this.fromNumber = fromNumber || '+1234567890'; // Default Twilio number
  }

  /**
   * Send SMS message via Twilio
   */
  async sendSMS(message: SMSMessage): Promise<SMSResponse> {
    try {
      console.log('📱 Sending SMS via Twilio:', {
        to: message.to,
        message: message.message.substring(0, 50) + '...',
        from: message.from || this.fromNumber
      });

      // Twilio API endpoint
      const url = `https://api.twilio.com/2010-04-01/Accounts/${this.accountSid}/Messages.json`;
      
      // Create form data
      const formData = new URLSearchParams();
      formData.append('To', message.to);
      formData.append('From', message.from || this.fromNumber);
      formData.append('Body', message.message);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${btoa(`${this.accountSid}:${this.authToken}`)}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: formData
      });

      console.log('📱 Twilio API response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('📱 Twilio API error response:', errorText);
        throw new Error(`Twilio API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log('📱 Twilio API success response:', data);
      
      return {
        success: true,
        messageId: data.sid,
        cost: data.price ? parseFloat(data.price) * 100 : undefined // Convert to cents
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
   * Validate phone number format
   */
  validatePhoneNumber(phoneNumber: string): boolean {
    // International phone number validation
    const internationalPhoneRegex = /^\+[1-9]\d{1,14}$/;
    return internationalPhoneRegex.test(phoneNumber.replace(/\s/g, ''));
  }

  /**
   * Format phone number for international use
   */
  formatPhoneNumber(phoneNumber: string): string {
    const cleaned = phoneNumber.replace(/\s/g, '');
    
    // If already international format, return as-is
    if (cleaned.startsWith('+')) {
      return cleaned;
    }
    
    // If Norwegian number without country code, add +47
    if (cleaned.startsWith('47') && cleaned.length === 10) {
      return `+${cleaned}`;
    }
    if (cleaned.startsWith('4') || cleaned.startsWith('9')) {
      return `+47${cleaned}`;
    }
    
    return cleaned;
  }

  /**
   * Get SMS cost estimate
   */
  getSMSCostEstimate(messageLength: number, recipientCount: number): number {
    // Twilio pricing: $0.0079 per SMS to Norway
    const costPerSMS = 0.0079;
    const smsCount = Math.ceil(messageLength / 160) * recipientCount; // 160 chars per SMS
    return smsCount * costPerSMS;
  }
}

// Export singleton instance
export const twilioSMS = new TwilioSMSService(
  process.env.TWILIO_ACCOUNT_SID || '',
  process.env.TWILIO_AUTH_TOKEN || '',
  process.env.TWILIO_FROM_NUMBER || ''
);


