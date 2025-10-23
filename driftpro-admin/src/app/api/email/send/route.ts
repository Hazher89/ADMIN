import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { to, subject, html, text, accessToken, fromEmail } = await request.json();

    if (!to || !subject) {
      return NextResponse.json({
        success: false,
        error: 'Mangler påkrevde e-postdata'
      }, { status: 400 });
    }

    // Require Microsoft Graph authentication
    if (!accessToken || !fromEmail) {
      return NextResponse.json({
        success: false,
        error: 'Microsoft Graph autentisering påkrevd. Logg inn med Microsoft Graph først.'
      }, { status: 400 });
    }

    return await sendViaMicrosoftGraph(to, subject, html, text, accessToken, fromEmail);

  } catch (error: any) {
    console.error('Email send error:', error);
    
    return NextResponse.json({
      success: false,
      error: error.message || 'Ukjent feil ved e-postsending'
    }, { status: 500 });
  }
}

async function sendViaMicrosoftGraph(to: string, subject: string, html: string, text: string, accessToken: string, fromEmail: string) {
  try {
    const response = await fetch('https://graph.microsoft.com/v1.0/me/sendMail', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: {
          subject: subject,
          body: {
            contentType: 'HTML',
            content: html
          },
          toRecipients: [
            {
              emailAddress: {
                address: to
              }
            }
          ],
          from: {
            emailAddress: {
              address: fromEmail
            }
          }
        },
        saveToSentItems: true
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Microsoft Graph API error: ${response.status} ${response.statusText} - ${errorData.error?.message || 'Unknown error'}`);
    }

    return NextResponse.json({
      success: true,
      message: 'E-post sendt via Microsoft Graph',
      method: 'microsoft_graph'
    });

  } catch (error: any) {
    console.error('Microsoft Graph send error:', error);
    
    return NextResponse.json({
      success: false,
      error: `Microsoft Graph feil: ${error.message}`
    }, { status: 500 });
  }
}
