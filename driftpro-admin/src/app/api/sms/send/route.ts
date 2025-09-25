import { NextRequest, NextResponse } from 'next/server';
import { sveveSMS } from '@/lib/sveve-sms-service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { to, message, priority = 'normal' } = body;

    if (!to || !message) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: to, message' },
        { status: 400 }
      );
    }

    console.log('📱 Server-side SMS request:', { to, message: message.substring(0, 50) + '...' });

    // Send SMS via Sveve
    const result = await sveveSMS.sendSMS({
      to,
      message,
      priority
    });

    console.log('📱 SMS result:', result);

    if (result.success) {
      return NextResponse.json({
        success: true,
        messageId: result.messageId,
        cost: result.cost,
        message: 'SMS sent successfully'
      });
    } else {
      return NextResponse.json(
        { success: false, error: result.error || 'Failed to send SMS' },
        { status: 500 }
      );
    }

  } catch (error: any) {
    console.error('❌ SMS API error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}


