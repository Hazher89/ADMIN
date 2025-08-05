import { NextRequest, NextResponse } from 'next/server';
import { emailService } from '@/lib/email-service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { smtpHost, smtpPort, smtpUser, smtpPassword, smtpSecure, smtpTimeout } = body;

    console.log('🧪 Testing Cloudflare Email Routing configuration:', {
      smtpHost,
      smtpPort,
      smtpUser,
      passwordProvided: !!smtpPassword,
      smtpSecure,
      provider: 'cloudflare_email_routing'
    });

    // Test email sending via Cloudflare Email Routing
    const testResult = await emailService.sendEmail(
      smtpUser || 'test@example.com',
      '🧪 Cloudflare Email Routing Test',
      `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f9fafb; padding: 20px;">
          <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
            <h1 style="color: #3b82f6; text-align: center; margin-bottom: 30px;">🧪 Cloudflare Email Routing Test</h1>
            <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
              Dette er en test e-post sendt via Cloudflare Email Routing.
            </p>
            <div style="background-color: #eff6ff; border: 1px solid #3b82f6; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
              <h2 style="color: #1e40af; margin-top: 0;">✅ Test konfigurasjon:</h2>
              <ul style="color: #1e40af; margin-bottom: 0;">
                <li><strong>SMTP Host:</strong> ${smtpHost}</li>
                <li><strong>SMTP Port:</strong> ${smtpPort}</li>
                <li><strong>SMTP User:</strong> ${smtpUser}</li>
                <li><strong>SMTP Secure:</strong> ${smtpSecure ? 'Ja' : 'Nei'}</li>
                <li><strong>Provider:</strong> Cloudflare Email Routing</li>
              </ul>
            </div>
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center;">
              <p style="color: #6b7280; font-size: 14px; margin: 0;">
                Med vennlig hilsen,<br>
                DriftPro System<br>
                noreplay@driftpro.no
              </p>
            </div>
          </div>
        </div>
      `
    );

    if (testResult.success) {
      console.log('✅ Cloudflare Email Routing test successful');
      return NextResponse.json({
        success: true,
        message: 'Cloudflare Email Routing test successful',
        messageId: testResult.messageId,
        provider: 'cloudflare_email_routing',
        details: {
          smtpHost,
          smtpPort,
          smtpUser,
          smtpSecure,
          provider: 'cloudflare_email_routing'
        }
      });
    } else {
      console.error('❌ Cloudflare Email Routing test failed:', testResult.error);
      return NextResponse.json({
        success: false,
        error: 'Cloudflare Email Routing test failed',
        details: testResult.error,
        provider: 'cloudflare_email_routing'
      }, { status: 500 });
    }

  } catch (error) {
    console.error('❌ Error in SMTP test:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error',
      provider: 'cloudflare_email_routing'
    }, { status: 500 });
  }
} 