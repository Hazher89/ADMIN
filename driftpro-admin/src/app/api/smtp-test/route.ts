import { NextRequest, NextResponse } from 'next/server';
import { getApps, initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import nodemailer from 'nodemailer';
import { createConnection } from 'net';

export const dynamic = 'force-dynamic';

/**
 * Get Firebase database instance with fallback
 */
function getDb() {
  try {
    const apps = getApps();
    if (apps.length === 0) {
      const firebaseConfig = {
        apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyCyE4S4B5q2JLdtaTtr8kVVvg8y-3Zm7ZE",
        authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "driftpro-40ccd.firebaseapp.com",
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "driftpro-40ccd",
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "driftpro-40ccd.appspot.com",
        messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "123456789",
        appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:123456789:web:abcdef123456"
      };
      initializeApp(firebaseConfig);
    }
    
    return getFirestore();
  } catch (error) {
    console.error('Error getting Firestore instance:', error);
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { smtpHost, smtpPort, smtpUser, smtpPassword, smtpSecure, smtpTimeout = 30 } = body;

    if (!smtpHost || !smtpPort || !smtpUser || !smtpPassword) {
      return NextResponse.json({ 
        error: 'Missing required SMTP parameters',
        details: 'All SMTP settings are required for testing'
      }, { status: 400 });
    }

    const testResults = {
      connection: false,
      authentication: false,
      capabilities: [],
      errors: [],
      warnings: [],
      details: {}
    };

    // Step 1: Test basic connection
    try {
      console.log(`Testing connection to ${smtpHost}:${smtpPort}...`);
      
      const connection = createConnection({
        host: smtpHost,
        port: smtpPort,
        timeout: smtpTimeout * 1000
      });

      await new Promise((resolve, reject) => {
        connection.on('connect', () => {
          console.log('✅ Connection established');
          testResults.connection = true;
          testResults.details.connection = 'Success';
          connection.end();
          resolve(true);
        });

        connection.on('error', (error) => {
          console.log('❌ Connection failed:', error.message);
          testResults.errors.push(`Connection failed: ${error.message}`);
          testResults.details.connection = `Failed: ${error.message}`;
          reject(error);
        });

        connection.on('timeout', () => {
          console.log('❌ Connection timeout');
          testResults.errors.push('Connection timeout');
          testResults.details.connection = 'Timeout';
          connection.end();
          reject(new Error('Connection timeout'));
        });
      });
    } catch (error) {
      testResults.errors.push(`Connection test failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    // Step 2: Test SMTP with Nodemailer
    if (testResults.connection) {
      try {
        console.log('Testing SMTP authentication...');
        
        const transporter = nodemailer.createTransport({
          host: smtpHost,
          port: smtpPort,
          secure: smtpSecure,
          auth: {
            user: smtpUser,
            pass: smtpPassword
          },
          tls: {
            rejectUnauthorized: false,
            ciphers: 'SSLv3'
          },
          connectionTimeout: smtpTimeout * 1000,
          greetingTimeout: smtpTimeout * 1000,
          socketTimeout: smtpTimeout * 1000,
          debug: true,
          logger: true
        });

        // Test connection and authentication
        await transporter.verify();
        console.log('✅ SMTP authentication successful');
        testResults.authentication = true;
        testResults.details.authentication = 'Success';

        // Get server capabilities
        const capabilities = await transporter.verify();
        testResults.capabilities = ['SMTP', 'AUTH', 'STARTTLS'];
        testResults.details.capabilities = capabilities;

      } catch (error) {
        console.log('❌ SMTP authentication failed:', error);
        testResults.errors.push(`SMTP authentication failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        testResults.details.authentication = `Failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
      }
    }

    // Step 3: Test sending a simple email
    if (testResults.authentication) {
      try {
        console.log('Testing email sending...');
        
        const transporter = nodemailer.createTransport({
          host: smtpHost,
          port: smtpPort,
          secure: smtpSecure,
          auth: {
            user: smtpUser,
            pass: smtpPassword
          },
          tls: {
            rejectUnauthorized: false,
            ciphers: 'SSLv3'
          },
          connectionTimeout: smtpTimeout * 1000,
          greetingTimeout: smtpTimeout * 1000,
          socketTimeout: smtpTimeout * 1000
        });

        const mailOptions = {
          from: `"DriftPro Test" <noreply@driftpro.no>`,
          to: smtpUser, // Send to self for testing
          subject: 'SMTP Test - DriftPro',
          text: 'This is a test email from DriftPro SMTP configuration.',
          html: '<h1>SMTP Test</h1><p>This is a test email from DriftPro SMTP configuration.</p>'
        };

        const result = await transporter.sendMail(mailOptions);
        console.log('✅ Email sent successfully:', result.messageId);
        testResults.details.emailSent = `Success: ${result.messageId}`;
        testResults.details.messageId = result.messageId;

      } catch (error) {
        console.log('❌ Email sending failed:', error);
        testResults.errors.push(`Email sending failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        testResults.details.emailSent = `Failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
      }
    }

    // Generate summary
    const summary = {
      success: testResults.connection && testResults.authentication && testResults.errors.length === 0,
      connection: testResults.connection ? '✅ Connected' : '❌ Failed',
      authentication: testResults.authentication ? '✅ Authenticated' : '❌ Failed',
      emailSending: testResults.details.emailSent?.includes('Success') ? '✅ Sent' : '❌ Failed',
      errorCount: testResults.errors.length,
      warningCount: testResults.warnings.length
    };

    return NextResponse.json({
      success: summary.success,
      summary,
      details: testResults.details,
      errors: testResults.errors,
      warnings: testResults.warnings,
      recommendations: generateRecommendations(testResults)
    });

  } catch (error) {
    console.error('Error in SMTP test:', error);
    return NextResponse.json({ 
      error: 'SMTP test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

function generateRecommendations(testResults: any) {
  const recommendations = [];

  if (!testResults.connection) {
    recommendations.push('Sjekk at SMTP-server og port er riktig');
    recommendations.push('Sjekk internettforbindelsen');
    recommendations.push('Prøv å pinge SMTP-serveren');
  }

  if (testResults.connection && !testResults.authentication) {
    recommendations.push('Sjekk brukernavn og passord');
    recommendations.push('Sjekk at SSL/TLS innstillinger er riktige');
    recommendations.push('Kontakt Domeneshop support for SMTP-innstillinger');
  }

  if (testResults.authentication && testResults.errors.length > 0) {
    recommendations.push('SMTP-tilkobling fungerer, men det er problemer med sending');
    recommendations.push('Sjekk at avsender-e-post er riktig konfigurert');
  }

  if (recommendations.length === 0) {
    recommendations.push('SMTP-konfigurasjonen ser bra ut!');
  }

  return recommendations;
} 