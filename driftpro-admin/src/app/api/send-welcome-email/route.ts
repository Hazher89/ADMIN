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
    // If a specific resetLink is provided, use it; otherwise fall back to forgot-password page
    const forgotPasswordUrl = resetLink || `${appUrl}/forgot-password`;

    // Create welcome email HTML with a single "Sett passord" button
    const primaryLink = forgotPasswordUrl; // until we have a dedicated setup token
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #2563eb;">Velkommen til ${companyName || 'Mavi Logistikk'}!</h2>
        <p>Hei ${displayName},</p>
        <p>Vi er glade for å informere deg om at du nå har blitt registrert i DriftPro-systemet.</p>
        ${position ? `<p><strong>Stilling:</strong> ${position}</p>` : ''}
        ${departmentName ? `<p><strong>Avdeling:</strong> ${departmentName}</p>` : ''}
        <p>Du kan nå logge inn på systemet med din e-postadresse: <strong>${email}</strong></p>

        <div style="margin: 24px 0; text-align: center;">
          <a href="${primaryLink}" style="display: inline-block; background-color: #2563eb; color: #ffffff; padding: 12px 20px; border-radius: 6px; text-decoration: none; font-weight: 600;">
            Sett opp passord
          </a>
        </div>

        <p>Hvis knappen ikke fungerer, kopier denne lenken og lim den inn i nettleseren din:</p>
        <p style="word-break: break-all;"><a href="${primaryLink}">${primaryLink}</a></p>

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

SLIK SETTER DU OPP PASSORDET DITT:
1. Gå til innloggingssiden: ${loginUrl}
2. Klikk på "Glemt passord?" eller bruk denne direkte lenken: ${forgotPasswordUrl}
3. Skriv inn din e-postadresse: ${email}
4. Du vil motta en e-post med en lenke for å sette opp passordet ditt
5. Klikk på lenken i e-posten og sett opp ditt nye passord
6. Etter at du har satt opp passordet, kan du logge inn med din e-post og det nye passordet

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
