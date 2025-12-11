import { NextRequest, NextResponse } from 'next/server';

// Server-side app-only Microsoft Graph email sender
// Uses client credentials to obtain a token and sends mail as a fixed sender.

async function getAppOnlyToken() {
  const tenantId = process.env.GRAPH_TENANT_ID;
  const clientId = process.env.GRAPH_CLIENT_ID;
  const clientSecret = process.env.GRAPH_CLIENT_SECRET;

  if (!tenantId || !clientId || !clientSecret) {
    throw new Error('GRAPH_TENANT_ID, GRAPH_CLIENT_ID eller GRAPH_CLIENT_SECRET mangler i miljøvariabler.');
  }

  const tokenUrl = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`;
  const body = new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: clientId,
    client_secret: clientSecret,
    scope: 'https://graph.microsoft.com/.default',
  });

  const res = await fetch(tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    throw new Error(`Kunne ikke hente app-only token: ${res.status} ${res.statusText} ${errText}`);
  }

  const data = await res.json();
  return data.access_token as string;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { to, subject, html, text, fromEmail } = body;

    // Use fromEmail if provided, otherwise fall back to environment variable
    const senderUpn = fromEmail || process.env.GRAPH_SENDER_UPN || process.env.NEXT_PUBLIC_GRAPH_SENDER_EMAIL;
    if (!senderUpn) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Fast avsender er ikke konfigurert. Sett GRAPH_SENDER_UPN, NEXT_PUBLIC_GRAPH_SENDER_EMAIL, eller send fromEmail i request body.' 
        },
        { status: 500 }
      );
    }

    if (!to || !subject || (!html && !text)) {
      return NextResponse.json(
        { error: 'Feltene to, subject og html/tekst er påkrevd.' },
        { status: 400 }
      );
    }

    const accessToken = await getAppOnlyToken();

    const recipients: Array<{ emailAddress: { address: string } }> = [];
    if (Array.isArray(to)) {
      for (const addr of to) recipients.push({ emailAddress: { address: addr } });
    } else {
      recipients.push({ emailAddress: { address: to } });
    }

    const message = {
      subject,
      body: {
        contentType: html ? 'HTML' : 'Text',
        content: html || text,
      },
      toRecipients: recipients,
      // replyTo can be set to senderUpn implicitly by mailbox settings; explicit replyTo optional
    };

    const graphUrl = `https://graph.microsoft.com/v1.0/users/${encodeURIComponent(senderUpn)}/sendMail`;
    const sendRes = await fetch(graphUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message, saveToSentItems: true }),
    });

    if (!sendRes.ok) {
      const err = await sendRes.json().catch(() => ({}));
      throw new Error(`Graph sendMail-feil: ${sendRes.status} ${sendRes.statusText} - ${err.error?.message || 'Ukjent feil'}`);
    }

    return NextResponse.json({ 
      success: true, 
      provider: 'microsoft_graph_app_only',
      messageId: `msg_${Date.now()}`,
      sender: senderUpn
    });
  } catch (error) {
    console.error('❌ E-post sending feilet:', error);
    const errorMessage = error instanceof Error ? error.message : 'Ukjent feil';
    
    // Provide more detailed error information
    const errorDetails: any = {
      error: errorMessage,
      timestamp: new Date().toISOString(),
    };

    // Check if it's a configuration error
    if (errorMessage.includes('mangler') || errorMessage.includes('ikke konfigurert')) {
      errorDetails.configurationError = true;
      errorDetails.missingVars = {
        hasTenantId: !!process.env.GRAPH_TENANT_ID,
        hasClientId: !!process.env.GRAPH_CLIENT_ID,
        hasClientSecret: !!process.env.GRAPH_CLIENT_SECRET,
        hasSenderUpn: !!process.env.GRAPH_SENDER_UPN,
      };
    }

    // Check if it's an authentication error
    if (errorMessage.includes('token') || errorMessage.includes('401') || errorMessage.includes('403')) {
      errorDetails.authenticationError = true;
      errorDetails.suggestion = 'Sjekk at admin consent er gitt i Azure Portal og at permissions er riktig satt.';
    }

    return NextResponse.json(
      { success: false, ...errorDetails },
      { status: 500 }
    );
  }
}
