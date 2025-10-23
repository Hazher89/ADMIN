import { NextRequest, NextResponse } from 'next/server';
import { globalEmailService } from '@/lib/global-email-service';

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

    console.log('📧 Sending email via Microsoft Graph:', {
      to,
      subject,
      type: type || 'system',
      provider: 'microsoft_graph'
    });

    // Use Microsoft Graph to send the email
    const result = await globalEmailService.sendEmail({
      to,
      subject,
      html,
      text
    });

    if (result.success) {
      console.log('✅ Email sent successfully via Microsoft Graph');
      return NextResponse.json({
        success: true,
        message: 'Email sent successfully via Microsoft Graph',
        messageId: result.messageId,
        provider: 'microsoft_graph'
      });
    } else {
      console.error('❌ Email sending failed:', result.error);
      return NextResponse.json(
        { 
          error: 'Failed to send email',
          details: result.error,
          provider: 'microsoft_graph'
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
        provider: 'microsoft_graph'
      },
      { status: 500 }
    );
  }
} 