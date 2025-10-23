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

    // Store setup token in Firestore
    await addDoc(collection(db, 'setupTokens'), {
      email: email,
      token: setupToken,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      createdAt: serverTimestamp(),
      used: false,
      type: 'employee_welcome'
    });

    console.log('📧 Sending welcome email via Microsoft Graph');

    // Create welcome email HTML
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Velkommen til ${companyName || 'Bedriften'}!</h2>
        <p>Hei ${displayName},</p>
        <p>Velkommen til ${companyName || 'Bedriften'}! Vi er glade for å ha deg med på laget.</p>
        <p>Du kan nå logge inn på DriftPro-systemet med din e-postadresse.</p>
        <p>Hvis du har spørsmål, ikke nøl med å ta kontakt.</p>
        <br>
        <p>Med vennlig hilsen,<br>${companyName || 'Bedriften'}-teamet</p>
      </div>
    `;

    // Send email via Microsoft Graph API
    const response = await fetch('https://graph.microsoft.com/v1.0/me/sendMail', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: {
          subject: `Velkommen til ${companyName || 'Bedriften'}!`,
          body: {
            contentType: 'HTML',
            content: html
          },
          toRecipients: [
            {
              emailAddress: {
                address: email
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
