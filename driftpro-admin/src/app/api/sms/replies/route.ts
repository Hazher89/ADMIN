import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Extract reply parameters from Sveve
    const messageId = searchParams.get('message_id');
    const sender = searchParams.get('sender');
    const message = searchParams.get('message');
    const timestamp = searchParams.get('timestamp');
    const keyword = searchParams.get('keyword');
    
    console.log('📱 SMS Reply received:', {
      messageId,
      sender,
      message,
      timestamp,
      keyword
    });
    
    // TODO: Process SMS reply based on content
    // This could be:
    // - Accepting/rejecting assignments
    // - Confirming attendance
    // - Responding to surveys
    // - etc.
    
    return NextResponse.json({ 
      success: true, 
      message: 'SMS reply received',
      data: { messageId, sender, message, timestamp, keyword }
    });
    
  } catch (error) {
    console.error('❌ Error processing SMS reply:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    console.log('📱 SMS Reply POST received:', body);
    
    // TODO: Process SMS reply based on content
    // This will be implemented when we have the database structure
    
    return NextResponse.json({ 
      success: true, 
      message: 'SMS reply received via POST',
      data: body
    });
    
  } catch (error) {
    console.error('❌ Error processing SMS reply POST:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

