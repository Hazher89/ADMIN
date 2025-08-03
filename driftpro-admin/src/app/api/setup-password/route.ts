import { NextRequest, NextResponse } from 'next/server';
import { adminEmailService } from '@/lib/admin-email-service';

// POST /api/setup-password - Set up password for new admin
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, password } = body;

    if (!token || !password) {
      return NextResponse.json(
        { error: 'Token og passord er påkrevd' }, 
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Passordet må være minst 8 tegn langt' }, 
        { status: 400 }
      );
    }

    // Setup admin with password
    const result = await adminEmailService.setupAdminWithPassword(token, password);

    if (result.success) {
      return NextResponse.json({ 
        success: true, 
        message: 'Passord satt opp! Du kan nå logge inn.' 
      });
    } else {
      return NextResponse.json(
        { error: result.error || 'Feil ved oppsett av passord' }, 
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error setting up password:', error);
    return NextResponse.json(
      { error: 'Feil ved oppsett av passord' }, 
      { status: 500 }
    );
  }
}

// GET /api/setup-password - Validate setup token
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json(
        { error: 'Token er påkrevd' }, 
        { status: 400 }
      );
    }

    // Validate token
    const tokenData = await adminEmailService.validateSetupToken(token);

    if (!tokenData) {
      return NextResponse.json(
        { error: 'Ugyldig eller utløpt token' }, 
        { status: 400 }
      );
    }

    return NextResponse.json({
      valid: true,
      email: tokenData.email,
      adminName: tokenData.adminName,
      companyName: tokenData.companyName
    });
  } catch (error) {
    console.error('Error validating setup token:', error);
    return NextResponse.json(
      { error: 'Feil ved validering av token' }, 
      { status: 500 }
    );
  }
} 