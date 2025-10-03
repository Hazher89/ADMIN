import { NextRequest, NextResponse } from 'next/server';
import { smtpAuthService } from '@/lib/smtp-auth-service';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email and password are required' },
        { status: 400 }
      );
    }

    const result = await smtpAuthService.authenticate(email, password);
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('SMTP Auth API Error:', error);
    return NextResponse.json(
      { success: false, error: 'Authentication failed' },
      { status: 500 }
    );
  }
}
