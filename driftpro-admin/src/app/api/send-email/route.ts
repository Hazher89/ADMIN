import { NextRequest, NextResponse } from 'next/server';
import { emailService } from '@/lib/email-service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { to, subject, html, text, type } = body;

    if (!to || !subject || !html) {
      return NextResponse.json(
        { error: 'Missing required fields: to, subject, html' },
        { status: 400 }
      );
    }

    console.log('📧 Sending email via Cloudflare Email Routing:', {
      to,
      subject,
      type: type || 'system',
      provider: 'cloudflare_email_routing'
    });

    // Use the email service to send the email
    const result = await emailService.sendEmail(to, subject, html, text);

    if (result.success) {
      console.log('✅ Email sent successfully via Cloudflare Email Routing');
      return NextResponse.json({
        success: true,
        message: 'Email sent successfully via Cloudflare Email Routing',
        messageId: result.messageId,
        provider: 'cloudflare_email_routing'
      });
    } else {
      console.error('❌ Email sending failed:', result.error);
      return NextResponse.json(
        { 
          error: 'Failed to send email',
          details: result.error,
          provider: 'cloudflare_email_routing'
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('❌ Error in send-email API:', error);
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