import { NextRequest, NextResponse } from 'next/server';
import { emailService } from '@/lib/email-service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { host, port, user, pass, secure } = body;

    console.log('🔐 Testing Cloudflare Email Routing login:', {
      host,
      port,
      user,
      passwordProvided: !!pass,
      secure,
      provider: 'cloudflare_email_routing'
    });

    // Test email sending via Cloudflare Email Routing
    const testResult = await emailService.sendEmail(
      user || 'test@example.com',
      '🔐 Cloudflare Email Routing Login Test',
      `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f9fafb; padding: 20px;">
          <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
            <h1 style="color: #059669; text-align: center; margin-bottom: 30px;">🔐 Cloudflare Email Routing Login Test</h1>
            <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
              Dette er en test e-post for å verifisere Cloudflare Email Routing login.
            </p>
            <div style="background-color: #d1fae5; border: 1px solid #10b981; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
              <h2 style="color: #065f46; margin-top: 0;">✅ Login konfigurasjon:</h2>
              <ul style="color: #065f46; margin-bottom: 0;">
                <li><strong>Host:</strong> ${host}</li>
                <li><strong>Port:</strong> ${port}</li>
                <li><strong>User:</strong> ${user}</li>
                <li><strong>Secure:</strong> ${secure ? 'Ja' : 'Nei'}</li>
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
      console.log('✅ Cloudflare Email Routing login test successful');
      return NextResponse.json({
        success: true,
        message: 'Cloudflare Email Routing login test successful',
        messageId: testResult.messageId,
        provider: 'cloudflare_email_routing',
        details: {
          host,
          port,
          user,
          secure,
          provider: 'cloudflare_email_routing'
        }
      });
    } else {
      console.error('❌ Cloudflare Email Routing login test failed:', testResult.error);
      return NextResponse.json({
        success: false,
        error: 'Cloudflare Email Routing login test failed',
        details: testResult.error,
        provider: 'cloudflare_email_routing'
      }, { status: 500 });
    }

  } catch (error) {
    console.error('❌ Error in SMTP login test:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error',
      provider: 'cloudflare_email_routing'
    }, { status: 500 });
  }
} 