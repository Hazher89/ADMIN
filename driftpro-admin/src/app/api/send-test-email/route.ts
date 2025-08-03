import { NextRequest, NextResponse } from 'next/server';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import nodemailer from 'nodemailer';

export const dynamic = 'force-dynamic';

/**
 * Get Firebase database instance with fallback
 */
function getDb() {
  try {
    const { getFirestore } = require('firebase/firestore');
    return getFirestore();
  } catch (error) {
    console.error('Error getting Firestore instance:', error);
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const firestoreDb = getDb();
    if (!firestoreDb) {
      return NextResponse.json({ error: 'Database not available' }, { status: 500 });
    }

    const body = await request.json();
    const { to, type, settings } = body;

    if (!to || !type) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Get email settings from Firebase
    const settingsDoc = await getDoc(doc(firestoreDb, 'system', 'emailSettings'));
    if (!settingsDoc.exists()) {
      return NextResponse.json({ error: 'Email settings not configured' }, { status: 400 });
    }

    const emailSettings = settingsDoc.data();
    const smtpPassword = emailSettings.smtpPassword || process.env.DRIFTPRO_EMAIL_PASSWORD;

    if (!smtpPassword) {
      return NextResponse.json({ error: 'SMTP password not configured' }, { status: 400 });
    }

    // Create transporter
    const transporter = nodemailer.createTransporter({
      host: emailSettings.smtpHost || 'smtp.office365.com',
      port: emailSettings.smtpPort || 587,
      secure: emailSettings.smtpSecure || false,
      auth: {
        user: emailSettings.smtpUser || 'noreply@driftpro.no',
        pass: smtpPassword
      }
    });

    // Generate test email content based on type
    let subject = '';
    let html = '';
    let text = '';

    switch (type) {
      case 'admin_setup':
        subject = 'Test: Admin-oppsett e-post';
        html = `
          <h1>Test: Admin-oppsett e-post</h1>
          <p>Dette er en test-e-post for admin-oppsett.</p>
          <p>Hei Test Admin,</p>
          <p>Du har blitt utnevnt som administrator for Test Company.</p>
          <p>Klikk på lenken nedenfor for å sette opp passordet ditt:</p>
          <a href="https://example.com/setup-password?token=test&email=test@example.com">Sett opp passord</a>
          <p>Lenken utløper om 24 timer.</p>
          <p>Med vennlig hilsen,<br>DriftPro Team</p>
        `;
        text = `Test: Admin-oppsett e-post\n\nDette er en test-e-post for admin-oppsett.\n\nHei Test Admin,\nDu har blitt utnevnt som administrator for Test Company.\nKlikk på lenken nedenfor for å sette opp passordet ditt:\nhttps://example.com/setup-password?token=test&email=test@example.com\n\nLenken utløper om 24 timer.\n\nMed vennlig hilsen,\nDriftPro Team`;
        break;

      case 'deviation_report':
        subject = 'Test: Ny avviksrapport';
        html = `
          <h1>Test: Ny avviksrapport</h1>
          <p>Dette er en test-e-post for avviksrapport.</p>
          <p>Et nytt avvik har blitt rapportert:</p>
          <ul>
            <li><strong>Avvik:</strong> Test avvik</li>
            <li><strong>Beskrivelse:</strong> Dette er en test-beskrivelse</li>
            <li><strong>Rapportert av:</strong> Test Bruker</li>
            <li><strong>Dato:</strong> ${new Date().toLocaleDateString('nb-NO')}</li>
            <li><strong>Prioritet:</strong> Høy</li>
          </ul>
          <p>Klikk <a href="https://example.com/deviations/123">her</a> for å se detaljer.</p>
        `;
        text = `Test: Ny avviksrapport\n\nDette er en test-e-post for avviksrapport.\n\nEt nytt avvik har blitt rapportert:\n- Avvik: Test avvik\n- Beskrivelse: Dette er en test-beskrivelse\n- Rapportert av: Test Bruker\n- Dato: ${new Date().toLocaleDateString('nb-NO')}\n- Prioritet: Høy\n\nKlikk her for å se detaljer: https://example.com/deviations/123`;
        break;

      case 'notification':
        subject = 'Test: Varsel fra DriftPro';
        html = `
          <h1>Test: Varsel fra DriftPro</h1>
          <p>Dette er en test-varsel fra DriftPro-systemet.</p>
          <p>Test-melding: Dette er en test av varsel-systemet.</p>
          <p>Med vennlig hilsen,<br>DriftPro Team</p>
        `;
        text = `Test: Varsel fra DriftPro\n\nDette er en test-varsel fra DriftPro-systemet.\n\nTest-melding: Dette er en test av varsel-systemet.\n\nMed vennlig hilsen,\nDriftPro Team`;
        break;

      case 'warning':
        subject = 'Test: Advarsel fra DriftPro';
        html = `
          <h1>Test: Advarsel fra DriftPro</h1>
          <p>Dette er en test-advarsel fra DriftPro-systemet.</p>
          <p>Test-advarsel: Dette er en test av advarsel-systemet.</p>
          <p>Dette er en automatisk advarsel fra DriftPro-systemet.</p>
        `;
        text = `Test: Advarsel fra DriftPro\n\nDette er en test-advarsel fra DriftPro-systemet.\n\nTest-advarsel: Dette er en test av advarsel-systemet.\n\nDette er en automatisk advarsel fra DriftPro-systemet.`;
        break;

      case 'welcome':
        subject = 'Test: Velkommen til DriftPro';
        html = `
          <h1>Test: Velkommen til DriftPro</h1>
          <p>Dette er en test-velkomstmelding.</p>
          <p>Hei Test Bruker,</p>
          <p>Velkommen til Test Company på DriftPro!</p>
          <p>Din konto er nå aktiv og du kan logge inn på systemet.</p>
          <p>Med vennlig hilsen,<br>DriftPro Team</p>
        `;
        text = `Test: Velkommen til DriftPro\n\nDette er en test-velkomstmelding.\n\nHei Test Bruker,\nVelkommen til Test Company på DriftPro!\nDin konto er nå aktiv og du kan logge inn på systemet.\n\nMed vennlig hilsen,\nDriftPro Team`;
        break;

      default:
        return NextResponse.json({ error: 'Invalid email type' }, { status: 400 });
    }

    // Send email
    const mailOptions = {
      from: `"${emailSettings.fromName || 'DriftPro System'}" <${emailSettings.fromEmail || 'noreply@driftpro.no'}>`,
      to: to,
      subject: subject,
      html: html,
      text: text
    };

    const result = await transporter.sendMail(mailOptions);

    // Log the email
    await logEmail(firestoreDb, {
      to: [to],
      subject: subject,
      type: `test_${type}`,
      status: 'sent',
      sentAt: new Date().toISOString(),
      messageId: result.messageId,
      metadata: {
        testType: type,
        smtpHost: emailSettings.smtpHost,
        smtpUser: emailSettings.smtpUser
      }
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Test email sent successfully',
      messageId: result.messageId
    });

  } catch (error) {
    console.error('Error sending test email:', error);
    
    // Log the error
    try {
      const firestoreDb = getDb();
      if (firestoreDb) {
        await logEmail(firestoreDb, {
          to: [body?.to || 'unknown'],
          subject: 'Test email failed',
          type: 'test_failed',
          status: 'failed',
          sentAt: new Date().toISOString(),
          error: error instanceof Error ? error.message : 'Unknown error',
          metadata: {
            testType: body?.type || 'unknown'
          }
        });
      }
    } catch (logError) {
      console.error('Error logging email failure:', logError);
    }

    return NextResponse.json({ 
      error: 'Failed to send test email',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

async function logEmail(firestoreDb: any, emailData: any) {
  try {
    const { addDoc, collection } = require('firebase/firestore');
    await addDoc(collection(firestoreDb, 'emailLogs'), emailData);
  } catch (error) {
    console.error('Error logging email:', error);
  }
} 