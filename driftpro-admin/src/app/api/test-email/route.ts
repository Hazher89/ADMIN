import { NextRequest, NextResponse } from 'next/server';
import { emailService } from '@/lib/email-service';
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc } from 'firebase/firestore';

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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { testEmail } = body;

    if (!testEmail) {
      return NextResponse.json(
        { error: 'Test email address is required' },
        { status: 400 }
      );
    }

    console.log('🧪 Testing email configuration via Cloudflare Email Routing:', {
      testEmail,
      provider: 'cloudflare_email_routing'
    });

    // Get current email settings
    const emailSettingsRef = doc(db, 'systemSettings', 'email');
    const emailSettingsDoc = await getDoc(emailSettingsRef);
    
    let currentSettings = null;
    if (emailSettingsDoc.exists()) {
      currentSettings = emailSettingsDoc.data();
      console.log('📧 Current email settings found:', {
        smtpHost: currentSettings.smtpHost,
        smtpUser: currentSettings.smtpUser,
        fromEmail: currentSettings.fromEmail,
        hasPassword: !!currentSettings.smtpPassword,
        provider: 'cloudflare_email_routing'
      });
    } else {
      console.log('📧 No email settings found in Firestore, using defaults');
    }

    // Send test email
    const testHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f9fafb; padding: 20px;">
        <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <h1 style="color: #1f2937; text-align: center; margin-bottom: 30px;">🧪 E-post Test</h1>
          
          <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
            Dette er en test-e-post fra DriftPro-systemet for å verifisere at e-post-konfigurasjonen fungerer korrekt.
          </p>
          
          <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #1f2937; margin-bottom: 15px;">📧 E-post-konfigurasjon:</h3>
            <p style="color: #4b5563; font-size: 14px; margin: 5px 0;">
              <strong>SMTP Host:</strong> ${currentSettings?.smtpHost || 'smtp.cloudflare.com'}
            </p>
            <p style="color: #4b5563; font-size: 14px; margin: 5px 0;">
              <strong>From Email:</strong> ${currentSettings?.fromEmail || 'noreplay@driftpro.no'}
            </p>
            <p style="color: #4b5563; font-size: 14px; margin: 5px 0;">
              <strong>Provider:</strong> Cloudflare Email Routing
            </p>
            <p style="color: #4b5563; font-size: 14px; margin: 5px 0;">
              <strong>Timestamp:</strong> ${new Date().toLocaleString('nb-NO')}
            </p>
          </div>
          
          <p style="color: #6b7280; font-size: 14px; margin-top: 30px; text-align: center;">
            Hvis du mottar denne e-posten, betyr det at e-post-konfigurasjonen fungerer korrekt! 🎉
          </p>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center;">
            <p style="color: #6b7280; font-size: 14px; margin: 0;">
              DriftPro System - Cloudflare Email Routing Test
            </p>
          </div>
        </div>
      </div>
    `;

    const result = await emailService.sendEmail(
      testEmail,
      '🧪 DriftPro E-post Test - Cloudflare Email Routing',
      testHtml
    );

    if (result.success) {
      console.log('✅ Test email sent successfully via Cloudflare Email Routing');
      return NextResponse.json({
        success: true,
        message: 'Test email sent successfully via Cloudflare Email Routing',
        messageId: result.messageId,
        provider: 'cloudflare_email_routing',
        settings: {
          smtpHost: currentSettings?.smtpHost || 'smtp.cloudflare.com',
          fromEmail: currentSettings?.fromEmail || 'noreplay@driftpro.no',
          hasPassword: !!currentSettings?.smtpPassword
        }
      });
    } else {
      console.error('❌ Test email sending failed:', result.error);
      return NextResponse.json(
        { 
          error: 'Failed to send test email',
          details: result.error,
          provider: 'cloudflare_email_routing',
          settings: {
            smtpHost: currentSettings?.smtpHost || 'smtp.cloudflare.com',
            fromEmail: currentSettings?.fromEmail || 'noreplay@driftpro.no',
            hasPassword: !!currentSettings?.smtpPassword
          }
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('❌ Error in test-email API:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
        provider: 'cloudflare_email_routing'
      },
      { status: 500 }
    );
  }
} 