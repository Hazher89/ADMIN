import { NextRequest, NextResponse } from 'next/server';
// NOTE: This route ONLY sends a welcome email. It does NOT create users.
// User creation happens elsewhere (e.g., /api/create-user or firebaseService.createEmployee).

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, displayName, adminName, companyName, departmentName, position, resetLink } = body;

    if (!email || !displayName) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: email, displayName' },
        { status: 400 }
      );
    }

    console.log('📧 Sending welcome email to:', email);

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://admin.driftpro.no';
    const loginUrl = `${appUrl}/login`;
    
    // resetLink MUST be provided - it should be a /setup-password?token=... link
    // If not provided, we cannot send the welcome email properly
    if (!resetLink) {
      console.error('❌ No resetLink provided - cannot send welcome email without setup password link');
      return NextResponse.json(
        { success: false, error: 'resetLink is required - must be a /setup-password?token=... URL' },
        { status: 400 }
      );
    }

    // The resetLink should point directly to /setup-password?token=...
    const setupPasswordUrl = resetLink;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #2563eb;">Velkommen til ${companyName || 'Mavi Logistikk'}!</h2>
        <p>Hei ${displayName},</p>
        <p>Vi er glade for å informere deg om at du nå har blitt registrert i DriftPro-systemet.</p>
        ${position ? `<p><strong>Stilling:</strong> ${position}</p>` : ''}
        ${departmentName ? `<p><strong>Avdeling:</strong> ${departmentName}</p>` : ''}
        <p>Du kan nå logge inn på systemet med din e-postadresse: <strong>${email}</strong></p>

        <div style="margin: 24px 0; text-align: center;">
          <a href="${setupPasswordUrl}" style="display: inline-block; background-color: #2563eb; color: #ffffff; padding: 12px 20px; border-radius: 6px; text-decoration: none; font-weight: 600;">
            Sett opp passord
          </a>
        </div>

        <p>Hvis knappen ikke fungerer, kopier denne lenken og lim den inn i nettleseren din:</p>
        <p style="word-break: break-all;"><a href="${setupPasswordUrl}">${setupPasswordUrl}</a></p>

        <p><strong>Viktig:</strong> Du må sette opp passordet ditt før du kan logge inn første gang.</p>
        <p>Hvis du har spørsmål eller trenger hjelp, ikke nøl med å ta kontakt med ${adminName || 'systemadministratoren'}.</p>
        <br>
        <p>Med vennlig hilsen,<br>${companyName || 'Mavi Logistikk'}-teamet</p>
      </div>
    `;

    const text = `
Velkommen til ${companyName || 'Mavi Logistikk'}!

Hei ${displayName},

Vi er glade for å informere deg om at du nå har blitt registrert i DriftPro-systemet.
${position ? `Stilling: ${position}` : ''}
${departmentName ? `Avdeling: ${departmentName}` : ''}

Du kan nå logge inn på systemet med din e-postadresse: ${email}

FOR Å SETTE OPP PASSORDET DITT:
Klikk på denne lenken for å sette opp passordet ditt med en gang:
${setupPasswordUrl}

Etter at du har satt opp passordet, kan du logge inn på ${loginUrl} med din e-post og det nye passordet.

VIKTIG: Du må sette opp passordet ditt før du kan logge inn første gang.

Hvis du har spørsmål eller trenger hjelp, ikke nøl med å ta kontakt med ${adminName || 'systemadministratoren'}.

Med vennlig hilsen,
${companyName || 'Mavi Logistikk'}-teamet
    `;

    // Send email via internal email API using absolute URL (works on Netlify functions)
    try {
      const emailResponse = await fetch(`${appUrl}/api/email/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: email,
          subject: `Velkommen til ${companyName || 'Mavi Logistikk'} - Sett opp passordet ditt`,
          html,
          text
        })
      });

      const emailResult = await emailResponse.json().catch(() => ({}));

      if (emailResponse.ok && emailResult.success) {
        console.log('✅ Welcome email sent successfully to:', email);
        return NextResponse.json({
          success: true,
          message: 'Welcome email sent successfully',
          messageId: emailResult.messageId
        });
      }

      console.error('❌ Failed to send welcome email via API:', emailResult.error || emailResult);
      return NextResponse.json(
        { success: false, error: emailResult.error || 'Failed to send welcome email' },
        { status: 500 }
      );
    } catch (sendError) {
      console.error('❌ Error sending welcome email:', sendError);
      return NextResponse.json(
        { success: false, error: 'Failed to send welcome email', details: sendError instanceof Error ? sendError.message : 'Unknown error' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('❌ Error in send-welcome-email API:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}


