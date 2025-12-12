import { NextRequest, NextResponse } from 'next/server';
import { globalEmailService } from '@/lib/global-email-service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, displayName, adminName, companyName, departmentName, position } = body;

    if (!email || !displayName) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Missing required fields: email, displayName' 
        },
        { status: 400 }
      );
    }

    console.log('📧 Sending welcome email to:', email);

    // Create welcome email HTML
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #2563eb;">Velkommen til ${companyName || 'DriftPro'}!</h2>
        <p>Hei ${displayName},</p>
        <p>Vi er glade for å informere deg om at du nå har blitt registrert i DriftPro-systemet.</p>
        ${position ? `<p><strong>Stilling:</strong> ${position}</p>` : ''}
        ${departmentName ? `<p><strong>Avdeling:</strong> ${departmentName}</p>` : ''}
        <p>Du kan nå logge inn på systemet med din e-postadresse: <strong>${email}</strong></p>
        <p>For å sette opp passordet ditt, vennligst bruk "Glemt passord"-funksjonen på innloggingssiden.</p>
        <p>Hvis du har spørsmål eller trenger hjelp, ikke nøl med å ta kontakt med ${adminName || 'systemadministratoren'}.</p>
        <br>
        <p>Med vennlig hilsen,<br>${companyName || 'DriftPro'}-teamet</p>
      </div>
    `;

    const text = `
Velkommen til ${companyName || 'DriftPro'}!

Hei ${displayName},

Vi er glade for å informere deg om at du nå har blitt registrert i DriftPro-systemet.
${position ? `Stilling: ${position}` : ''}
${departmentName ? `Avdeling: ${departmentName}` : ''}

Du kan nå logge inn på systemet med din e-postadresse: ${email}

For å sette opp passordet ditt, vennligst bruk "Glemt passord"-funksjonen på innloggingssiden.

Hvis du har spørsmål eller trenger hjelp, ikke nøl med å ta kontakt med ${adminName || 'systemadministratoren'}.

Med vennlig hilsen,
${companyName || 'DriftPro'}-teamet
    `;

    // Send email using global email service
    const result = await globalEmailService.sendEmail({
      to: email,
      subject: `Velkommen til ${companyName || 'DriftPro'}!`,
      html,
      text
    });

    if (result.success) {
      console.log('✅ Welcome email sent successfully to:', email);
      return NextResponse.json({
        success: true,
        message: 'Welcome email sent successfully',
        messageId: result.messageId
      });
    } else {
      console.error('❌ Failed to send welcome email:', result.error);
      return NextResponse.json(
        { 
          success: false,
          error: result.error || 'Failed to send welcome email'
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('❌ Error in send-welcome-email API:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
