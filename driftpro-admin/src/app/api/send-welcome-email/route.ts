import { NextRequest, NextResponse } from 'next/server';
import { getFirebaseDb } from '@/lib/firebase-admin';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, displayName, adminName, companyName, departmentName, position, accessToken, fromEmail } = body;

    if (!email || !displayName) {
      return NextResponse.json(
        { error: 'Email and display name are required' },
        { status: 400 }
      );
    }

    if (!accessToken || !fromEmail) {
      return NextResponse.json(
        { error: 'Microsoft Graph authentication required. Please log in first.' },
        { status: 400 }
      );
    }

    console.log('📧 Processing welcome email request:', {
      email,
      displayName,
      adminName,
      companyName,
      departmentName,
      position,
      provider: 'microsoft_graph'
    });

    // Generate setup token for password setup
    const setupToken = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    const setupUrl = `https://admin.driftpro.no/setup-password?token=${setupToken}&email=${encodeURIComponent(email)}`;

    // Store setup token in Firestore (if available)
    if (db) {
      try {
        await addDoc(collection(db, 'setupTokens'), {
          email: email,
          token: setupToken,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
          createdAt: serverTimestamp(),
          used: false,
          type: 'employee_welcome'
        });
      } catch (error) {
        console.warn('Failed to store setup token:', error);
      }
    }

    // Get Firestore instance
    const db = getFirebaseDb();
    if (!db) {
      console.warn('Firestore not available, skipping token storage');
    }

    console.log('📧 Sending welcome email via app-only authentication');

    // Create welcome email HTML with password setup link
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px; margin-bottom: 20px;">
          <h1 style="color: white; margin: 0; font-size: 28px; text-align: center;">🎉 Velkommen til ${companyName || 'Bedriften'}!</h1>
        </div>
        
        <div style="background: #f8fafc; padding: 25px; border-radius: 8px; margin-bottom: 20px;">
          <h2 style="color: #2d3748; margin-top: 0;">Hei ${displayName}! 👋</h2>
          <p style="color: #4a5568; font-size: 16px; line-height: 1.6;">
            Vi er glade for å ha deg med på laget! Din konto er nå opprettet i DriftPro-systemet.
          </p>
          <p style="color: #4a5568; font-size: 16px; line-height: 1.6;">
            <strong>Din e-postadresse:</strong> ${email}<br>
            <strong>Din stilling:</strong> ${position || 'Ansatt'}<br>
            <strong>Avdeling:</strong> ${departmentName || 'Ikke tildelt'}
          </p>
        </div>

        <div style="background: #e6fffa; padding: 25px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #38b2ac;">
          <h3 style="color: #234e52; margin-top: 0;">🔐 Sett opp ditt passord</h3>
          <p style="color: #2c7a7b; font-size: 16px; line-height: 1.6;">
            For å komme i gang må du først sette opp et passord for din konto. Klikk på knappen under for å fortsette:
          </p>
          <div style="text-align: center; margin: 25px 0;">
            <a href="${setupUrl}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);">
              🚀 Sett opp passord
            </a>
          </div>
          <p style="color: #2c7a7b; font-size: 14px; margin-bottom: 0;">
            <strong>Viktig:</strong> Denne lenken er gyldig i 7 dager. Hvis lenken ikke fungerer, kontakt din administrator.
          </p>
        </div>

        <div style="background: #f7fafc; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <h3 style="color: #2d3748; margin-top: 0;">📱 Hva kan du gjøre i DriftPro?</h3>
          <ul style="color: #4a5568; font-size: 15px; line-height: 1.6;">
            <li>Se din personlige profil og arbeidsinformasjon</li>
            <li>Be om ferie og fravær</li>
            <li>Se bedriftsnyheter og varsler</li>
            <li>Kommunisere med kollegaer</li>
            <li>Se arbeidsplaner og oppgaver</li>
          </ul>
        </div>

        <div style="background: #fff5f5; padding: 20px; border-radius: 8px; border-left: 4px solid #fc8181;">
          <h3 style="color: #742a2a; margin-top: 0;">❓ Trenger du hjelp?</h3>
          <p style="color: #9b2c2c; font-size: 15px; line-height: 1.6; margin-bottom: 0;">
            Hvis du har spørsmål eller trenger hjelp med å komme i gang, ikke nøl med å ta kontakt med din ${adminName || 'administrator'} eller IT-avdelingen.
          </p>
        </div>

        <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
          <p style="color: #718096; font-size: 14px; margin: 0;">
            Med vennlig hilsen,<br>
            <strong>${companyName || 'Bedriften'}-teamet</strong>
          </p>
          <p style="color: #a0aec0; font-size: 12px; margin: 10px 0 0 0;">
            Denne e-posten ble sendt automatisk fra DriftPro-systemet
          </p>
        </div>
      </div>
    `;

    // Create text version of the email
    const text = `
🎉 Velkommen til ${companyName || 'Bedriften'}!

Hei ${displayName}!

Vi er glade for å ha deg med på laget! Din konto er nå opprettet i DriftPro-systemet.

Din informasjon:
- E-postadresse: ${email}
- Stilling: ${position || 'Ansatt'}
- Avdeling: ${departmentName || 'Ikke tildelt'}

🔐 Sett opp ditt passord:
For å komme i gang må du først sette opp et passord for din konto.

Klikk på denne lenken for å sette opp passordet:
${setupUrl}

Viktig: Denne lenken er gyldig i 7 dager. Hvis lenken ikke fungerer, kontakt din administrator.

📱 Hva kan du gjøre i DriftPro?
- Se din personlige profil og arbeidsinformasjon
- Be om ferie og fravær
- Se bedriftsnyheter og varsler
- Kommunisere med kollegaer
- Se arbeidsplaner og oppgaver

❓ Trenger du hjelp?
Hvis du har spørsmål eller trenger hjelp med å komme i gang, ikke nøl med å ta kontakt med din ${adminName || 'administrator'} eller IT-avdelingen.

Med vennlig hilsen,
${companyName || 'Bedriften'}-teamet

---
Denne e-posten ble sendt automatisk fra DriftPro-systemet
    `;

    // Send email via app-only API endpoint
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000');
    const response = await fetch(`${baseUrl}/api/email/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: email,
        subject: `🎉 Velkommen til ${companyName || 'Bedriften'}! Sett opp ditt passord`,
        html: html,
        text: text,
        fromEmail: senderEmail
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`E-post API feil: ${response.status} ${response.statusText} - ${errorData.error || 'Unknown error'}`);
    }

    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'E-post sending feilet');
    }

    console.log('✅ Welcome email sent successfully via app-only authentication');
    return NextResponse.json({
      success: true,
      message: 'Welcome email sent successfully',
      provider: 'microsoft_graph_app_only'
    });

  } catch (error) {
    console.error('❌ Error in send-welcome-email API:', error);
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
