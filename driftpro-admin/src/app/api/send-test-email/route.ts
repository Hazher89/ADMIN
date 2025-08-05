import { NextRequest, NextResponse } from 'next/server';
import { emailService } from '@/lib/email-service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { to, type, settings } = body;

    if (!to) {
      return NextResponse.json(
        { error: 'Missing required field: to' },
        { status: 400 }
      );
    }

    console.log('📧 Sending test email via Cloudflare Email Routing:', {
      to,
      type: type || 'test',
      provider: 'cloudflare_email_routing'
    });

    // Create test email content based on type
    let subject = 'Test Email - DriftPro';
    let html = '';

    switch (type) {
      case 'admin_setup':
        subject = 'Test Admin Setup Email - DriftPro';
        html = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f9fafb; padding: 20px;">
            <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
              <h1 style="color: #1f2937; text-align: center; margin-bottom: 30px;">🧪 Test Admin Setup Email</h1>
              <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
                Dette er en test av admin setup e-post-funksjonen via Cloudflare Email Routing.
              </p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="#" 
                   style="background-color: #3b82f6; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
                  🔐 Test Setup Link
                </a>
              </div>
              <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center;">
                <p style="color: #6b7280; font-size: 14px; margin: 0;">
                  Med vennlig hilsen,<br>
                  DriftPro Team<br>
                  noreplay@driftpro.no
                </p>
              </div>
            </div>
          </div>
        `;
        break;
      
      case 'deviation_report':
        subject = 'Test Avviksrapport - DriftPro';
        html = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f9fafb; padding: 20px;">
            <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
              <h1 style="color: #dc2626; text-align: center; margin-bottom: 30px;">🧪 Test Avviksrapport</h1>
              <div style="background-color: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
                <h2 style="color: #991b1b; margin-top: 0;">Test Avvik</h2>
                <p style="color: #7f1d1d; font-size: 16px; line-height: 1.6; margin-bottom: 0;">
                  Dette er en test av avviksrapport e-post-funksjonen via Cloudflare Email Routing.
                </p>
              </div>
              <p style="color: #6b7280; font-size: 14px; margin-top: 20px;">
                <strong>Rapportert av:</strong> Test Bruker
              </p>
              <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center;">
                <p style="color: #6b7280; font-size: 14px; margin: 0;">
                  Med vennlig hilsen,<br>
                  DriftPro System<br>
                  noreplay@driftpro.no
                </p>
              </div>
            </div>
          </div>
        `;
        break;
      
      case 'notification':
        subject = 'Test Varsel - DriftPro';
        html = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f9fafb; padding: 20px;">
            <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
              <h1 style="color: #3b82f6; text-align: center; margin-bottom: 30px;">🧪 Test Varsel</h1>
              <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
                <p style="color: #334155; font-size: 16px; line-height: 1.6; margin: 0;">
                  Dette er en test av varsel e-post-funksjonen via Cloudflare Email Routing.
                </p>
              </div>
              <p style="color: #6b7280; font-size: 14px; margin-top: 20px;">
                <strong>Prioritet:</strong> Normal
              </p>
              <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center;">
                <p style="color: #6b7280; font-size: 14px; margin: 0;">
                  Med vennlig hilsen,<br>
                  DriftPro System<br>
                  noreplay@driftpro.no
                </p>
              </div>
            </div>
          </div>
        `;
        break;
      
      case 'welcome':
        subject = 'Test Velkomst - DriftPro';
        html = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f9fafb; padding: 20px;">
            <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
              <h1 style="color: #059669; text-align: center; margin-bottom: 30px;">🧪 Test Velkomst</h1>
              <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
                Dette er en test av velkomst e-post-funksjonen via Cloudflare Email Routing.
              </p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="#" 
                   style="background-color: #059669; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
                  🚀 Test Login Link
                </a>
              </div>
              <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center;">
                <p style="color: #6b7280; font-size: 14px; margin: 0;">
                  Med vennlig hilsen,<br>
                  DriftPro Team<br>
                  noreplay@driftpro.no
                </p>
              </div>
            </div>
          </div>
        `;
        break;
      
      default:
        subject = 'Test Email - Cloudflare Email Routing - DriftPro';
        html = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f9fafb; padding: 20px;">
            <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
              <h1 style="color: #3b82f6; text-align: center; margin-bottom: 30px;">🧪 Test Email - Cloudflare Email Routing</h1>
              <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
                Dette er en test e-post sendt via Cloudflare Email Routing.
              </p>
              <div style="background-color: #eff6ff; border: 1px solid #3b82f6; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
                <h2 style="color: #1e40af; margin-top: 0;">✅ E-post-funksjonen fungerer!</h2>
                <p style="color: #1e40af; font-size: 16px; line-height: 1.6; margin-bottom: 0;">
                  Cloudflare Email Routing er konfigurert og fungerer perfekt.
                </p>
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
        `;
    }

    // Use the email service to send the test email
    const result = await emailService.sendEmail(to, subject, html);

    if (result.success) {
      console.log('✅ Test email sent successfully via Cloudflare Email Routing');
      return NextResponse.json({
        success: true,
        message: 'Test email sent successfully via Cloudflare Email Routing',
        messageId: result.messageId,
        provider: 'cloudflare_email_routing'
      });
    } else {
      console.error('❌ Test email sending failed:', result.error);
      return NextResponse.json(
        { 
          error: 'Failed to send test email',
          details: result.error,
          provider: 'cloudflare_email_routing'
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('❌ Error in send-test-email API:', error);
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