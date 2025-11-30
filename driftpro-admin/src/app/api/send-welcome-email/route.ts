import { NextRequest, NextResponse } from 'next/server';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, serverTimestamp } from 'firebase/firestore';

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyCyE4S4B5q2JLdtaTtr8kVVvg8y-3Zm7ZE",
  authDomain: "driftpro-40ccd.firebaseapp.com",
  projectId: "driftpro-40ccd",
  storageBucket: "driftpro-40ccd.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef123456"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, displayName, adminName, companyName, departmentName, position, setupUrl, password, passwordSet } = body;

    if (!email || !displayName) {
      return NextResponse.json(
        { error: 'Email and display name are required' },
        { status: 400 }
      );
    }

    // App-only sender configuration
    const tenantId = process.env.GRAPH_TENANT_ID;
    const clientId = process.env.GRAPH_CLIENT_ID;
    const clientSecret = process.env.GRAPH_CLIENT_SECRET;
    const senderUpn = process.env.GRAPH_SENDER_UPN || process.env.NEXT_PUBLIC_GRAPH_SENDER_EMAIL;

    if (!tenantId || !clientId || !clientSecret || !senderUpn) {
      return NextResponse.json(
        { error: 'E-post avsender eller Graph app-only konfigurasjon mangler. Sett GRAPH_TENANT_ID, GRAPH_CLIENT_ID, GRAPH_CLIENT_SECRET og GRAPH_SENDER_UPN.' },
        { status: 500 }
      );
    }

    console.log('📧 Processing welcome email request:', {
      email,
      displayName,
      adminName,
      companyName,
      departmentName,
      position,
      passwordSet: !!passwordSet,
      provider: 'microsoft_graph'
    });

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://admin.driftpro.no';
    const loginUrl = `${appUrl}/login`;
    const forgotPasswordUrl = `${appUrl}/login?forgot=true`;

    let html = '';
    let subject = '';

    // If password is set by admin, send different email
    if (passwordSet && password) {
      subject = `🎉 Velkommen til ${companyName || 'MAVI Logistikk AS'}! Din konto er klar`;
      
      html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px; margin-bottom: 20px;">
          <h1 style="color: white; margin: 0; font-size: 28px; text-align: center;">🎉 Velkommen til ${companyName || 'MAVI Logistikk AS'}!</h1>
        </div>
        
        <div style="background: #f8fafc; padding: 25px; border-radius: 8px; margin-bottom: 20px;">
          <h2 style="color: #2d3748; margin-top: 0;">Hei ${displayName}! 👋</h2>
          <p style="color: #4a5568; font-size: 16px; line-height: 1.6;">
            Vi er glade for å ha deg med på laget! Din konto er nå opprettet i DriftPro-systemet og er klar til bruk.
          </p>
          <p style="color: #4a5568; font-size: 16px; line-height: 1.6;">
            <strong>Din e-postadresse:</strong> ${email}<br>
            <strong>Din stilling:</strong> ${position || 'Ansatt'}<br>
            <strong>Avdeling:</strong> ${departmentName || 'Ikke tildelt'}
          </p>
        </div>

        <div style="background: #e6fffa; padding: 25px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #38b2ac;">
          <h3 style="color: #234e52; margin-top: 0;">🔐 Ditt passord</h3>
          <p style="color: #2c7a7b; font-size: 16px; line-height: 1.6; margin-bottom: 15px;">
            Administrator har satt opp et passord for din konto. Du kan logge inn med følgende:
          </p>
          <div style="background: #ffffff; padding: 15px; border-radius: 6px; border: 2px solid #38b2ac; margin: 15px 0;">
            <p style="margin: 0; color: #234e52; font-size: 14px; font-weight: 600; margin-bottom: 8px;">E-post:</p>
            <p style="margin: 0; color: #2c7a7b; font-size: 16px; font-family: monospace;">${email}</p>
            <p style="margin: 15px 0 0 0; color: #234e52; font-size: 14px; font-weight: 600; margin-bottom: 8px;">Passord:</p>
            <p style="margin: 0; color: #2c7a7b; font-size: 16px; font-family: monospace; letter-spacing: 2px;">${password}</p>
          </div>
          <p style="color: #2c7a7b; font-size: 14px; margin-top: 15px; margin-bottom: 0;">
            <strong>💡 Tips:</strong> Du kan endre passordet ditt når som helst ved å bruke "Glemt passord" på innloggingssiden.
          </p>
        </div>

        <div style="background: #f0f9ff; padding: 25px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #3b82f6;">
          <h3 style="color: #1e3a5f; margin-top: 0;">🚀 Kom i gang</h3>
          <p style="color: #1e40af; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
            Du kan nå logge inn på DriftPro-systemet med passordet over. Klikk på knappene under for å komme i gang:
          </p>
          <div style="text-align: center; margin: 25px 0;">
            <a href="${loginUrl}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4); margin-right: 10px; margin-bottom: 10px;">
              🔑 Logg inn
            </a>
            <a href="${forgotPasswordUrl}" style="display: inline-block; background: #ffffff; color: #667eea; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; border: 2px solid #667eea; margin-bottom: 10px;">
              🔄 Endre passord
            </a>
          </div>
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
            <strong>${companyName || 'MAVI Logistikk AS'}-teamet</strong>
          </p>
          <p style="color: #a0aec0; font-size: 12px; margin: 10px 0 0 0;">
            Denne e-posten ble sendt automatisk fra DriftPro-systemet
          </p>
        </div>
      </div>
    `;
    } else {
      // Password not set - send setup link email
      subject = `🎉 Velkommen til ${companyName || 'MAVI Logistikk AS'}! Sett opp ditt passord`;
      
      // Use provided setupUrl or generate new token
      let finalSetupUrl = setupUrl;
      if (!finalSetupUrl) {
        // Generate setup token for password setup
        const setupToken = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
        finalSetupUrl = `${appUrl}/setup-password?token=${setupToken}&email=${encodeURIComponent(email)}`;

        // Store setup token in Firestore
        await addDoc(collection(db, 'setupTokens'), {
          email: email,
          token: setupToken,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
          createdAt: serverTimestamp(),
          used: false,
          type: 'employee_welcome'
        });
      }

      html = `
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
            <a href="${finalSetupUrl}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);">
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
    }

    console.log('📧 Sender velkomst-epost via Microsoft Graph (app-only)');

    // Get app-only access token
    const tokenUrl = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`;
    const tokenBody = new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: clientId,
      client_secret: clientSecret,
      scope: 'https://graph.microsoft.com/.default',
    });

    const tokenRes = await fetch(tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: tokenBody,
    });
    if (!tokenRes.ok) {
      const errText = await tokenRes.text().catch(() => '');
      throw new Error(`Kunne ikke hente Graph token: ${tokenRes.status} ${tokenRes.statusText} ${errText}`);
    }
    const tokenData = await tokenRes.json();
    const accessToken = tokenData.access_token as string;

    // Send email via Microsoft Graph API as fixed sender (users/{sender}/sendMail)
    const graphUrl = `https://graph.microsoft.com/v1.0/users/${encodeURIComponent(senderUpn)}/sendMail`;
    const response = await fetch(graphUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: {
          subject,
          body: {
            contentType: 'HTML',
            content: html,
          },
          toRecipients: [
            { emailAddress: { address: email } },
          ],
        },
        saveToSentItems: true,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Microsoft Graph API error: ${response.status} ${response.statusText} - ${errorData.error?.message || 'Unknown error'}`);
    }

    console.log('✅ Welcome email sent successfully via Microsoft Graph');
    return NextResponse.json({
      success: true,
      message: 'Welcome email sent successfully',
      provider: 'microsoft_graph'
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
