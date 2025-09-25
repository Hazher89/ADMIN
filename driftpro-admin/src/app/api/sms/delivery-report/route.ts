import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Extract delivery report parameters from Sveve
    const messageId = searchParams.get('message_id');
    const status = searchParams.get('status');
    const recipient = searchParams.get('recipient');
    const timestamp = searchParams.get('timestamp');
    const cost = searchParams.get('cost');
    
    console.log('📱 SMS Delivery Report received:', {
      messageId,
      status,
      recipient,
      timestamp,
      cost
    });
    
    // TODO: Update database with delivery status
    // This will be implemented when we have the database structure
    
    return NextResponse.json({ 
      success: true, 
      message: 'Delivery report received',
      data: { messageId, status, recipient, timestamp, cost }
    });
    
  } catch (error) {
    console.error('❌ Error processing SMS delivery report:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    console.log('📱 SMS Delivery Report POST received:', body);
    
    // TODO: Update database with delivery status
    // This will be implemented when we have the database structure
    
    return NextResponse.json({ 
      success: true, 
      message: 'Delivery report received via POST',
      data: body
    });
    
  } catch (error) {
    console.error('❌ Error processing SMS delivery report POST:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}


