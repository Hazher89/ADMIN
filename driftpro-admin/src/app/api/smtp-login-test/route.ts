import { NextRequest, NextResponse } from 'next/server';
import * as nodemailer from 'nodemailer';

export const dynamic = 'force-dynamic';

interface SMTPConfig {
  host: string;
  port: number;
  user: string;
  pass: string;
  secure: boolean;
}

export async function POST(request: NextRequest) {
  try {
    console.log('🔐 Starting SMTP login test...');
    
    const body = await request.json();
    const { host, port, user, pass, secure } = body as SMTPConfig;

    // Validate required fields
    if (!host || !user || !pass) {
      return NextResponse.json({
        error: 'Manglende påkrevde felter: host, user, pass må være fylt ut'
      }, { status: 400 });
    }

    console.log('SMTP Configuration:', {
      host,
      port: port || 587,
      user,
      secure: secure || false,
      passwordProvided: !!pass
    });

    // Domeneshop SMTP configurations to try
    const domeneshopConfigs = [
      {
        name: 'Domeneshop Standard (Port 587)',
        config: {
          host,
          port: 587,
          secure: false,
          auth: { user, pass },
          tls: { rejectUnauthorized: false },
          connectionTimeout: 30000,
          greetingTimeout: 30000,
          socketTimeout: 30000,
          debug: true,
          logger: true
        }
      },
      {
        name: 'Domeneshop SSL (Port 465)',
        config: {
          host,
          port: 465,
          secure: true,
          auth: { user, pass },
          tls: { rejectUnauthorized: false },
          connectionTimeout: 30000,
          greetingTimeout: 30000,
          socketTimeout: 30000,
          debug: true,
          logger: true
        }
      },
      {
        name: 'Domeneshop Alternative (Port 587 + SSL)',
        config: {
          host,
          port: 587,
          secure: true,
          auth: { user, pass },
          tls: { rejectUnauthorized: false },
          connectionTimeout: 30000,
          greetingTimeout: 30000,
          socketTimeout: 30000,
          debug: true,
          logger: true
        }
      },
      {
        name: 'Domeneshop Legacy (Port 25)',
        config: {
          host,
          port: 25,
          secure: false,
          auth: { user, pass },
          tls: { rejectUnauthorized: false },
          connectionTimeout: 30000,
          greetingTimeout: 30000,
          socketTimeout: 30000,
          debug: true,
          logger: true
        }
      }
    ];

    // Try each configuration
    let successfulConfig = null;
    let lastError = null;

    for (const config of domeneshopConfigs) {
      try {
        console.log(`🔍 Testing ${config.name}...`);
        
        const transporter = nodemailer.createTransport(config.config);
        
        // Test connection with retry logic
        let connectionVerified = false;
        for (let attempt = 1; attempt <= 2; attempt++) {
          try {
            console.log(`🔍 Attempt ${attempt}: Testing ${config.name}...`);
            await transporter.verify();
            console.log(`✅ ${config.name} connection verified successfully`);
            connectionVerified = true;
            break;
          } catch (error) {
            console.error(`❌ Attempt ${attempt} failed for ${config.name}:`, error);
            lastError = error;
            
            if (attempt < 2) {
              console.log(`⏳ Waiting 1 second before retry...`);
              await new Promise(resolve => setTimeout(resolve, 1000));
            }
          }
        }
        
        if (connectionVerified) {
          successfulConfig = config;
          break;
        }
        
      } catch (error) {
        console.error(`❌ ${config.name} failed:`, error);
        lastError = error;
      }
    }

    if (!successfulConfig) {
      console.error('❌ All Domeneshop SMTP configurations failed');
      
      let errorMessage = 'Alle Domeneshop SMTP-konfigurasjoner feilet';
      if (lastError instanceof Error) {
        if (lastError.message.includes('authentication')) {
          errorMessage = 'Autentiseringsfeil: Passordet eller brukernavnet er feil';
        } else if (lastError.message.includes('ECONNREFUSED')) {
          errorMessage = 'Tilkobling avvist: Domeneshop SMTP-serveren er ikke tilgjengelig';
        } else if (lastError.message.includes('ENOTFOUND')) {
          errorMessage = 'Domeneshop SMTP-serveren ble ikke funnet: Sjekk serveradressen';
        } else if (lastError.message.includes('timeout')) {
          errorMessage = 'Tilkobling timeout: Domeneshop serveren svarte ikke i tide';
        } else if (lastError.message.includes('ECONNRESET')) {
          errorMessage = 'Domeneshop SMTP-tilkobling ble avbrutt - dette er vanlig med Domeneshop. Prøv igjen eller kontakt Domeneshop support';
        } else {
          errorMessage = `Domeneshop SMTP-feil: ${lastError.message}`;
        }
      }
      
      return NextResponse.json({
        error: errorMessage,
        details: {
          host,
          user,
          timestamp: new Date().toISOString(),
          testedConfigs: domeneshopConfigs.map(c => c.name),
          lastError: lastError instanceof Error ? lastError.message : 'Unknown error'
        }
      }, { status: 500 });
    }

    console.log(`✅ Successfully connected using: ${successfulConfig.name}`);
    const transporter = nodemailer.createTransport(successfulConfig.config);

    // Step 2: Test authentication by trying to send a test email
    console.log('🔐 Testing authentication...');
    try {
                                  const testMailOptions = {
        from: `DriftPro Test <${user.includes('@') ? user : 'noreply@driftpro.no'}>`,
        to: 'test@example.com', // Send to test address
        subject: '🔐 SMTP Login Successful - DriftPro',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #059669;">🔐 SMTP LOGIN SUCCESSFUL!</h2>
            <p><strong>Dato:</strong> ${new Date().toLocaleString('nb-NO')}</p>
            <p><strong>SMTP Server:</strong> ${host}</p>
            <p><strong>Bruker:</strong> ${user}</p>
            <p><strong>Konfigurasjon:</strong> ${successfulConfig.name}</p>
            <p><strong>Status:</strong> ✅ Autentisering fungerer perfekt!</p>
            
            <div style="background-color: #f0fdf4; border: 1px solid #16a34a; border-radius: 8px; padding: 16px; margin: 20px 0;">
              <h3 style="color: #166534; margin-top: 0;">🔧 Login Status:</h3>
              <ul style="color: #166534;">
                <li>✅ SMTP-autentisering: FUNGERER</li>
                <li>✅ Domeneshop-tilkobling: FUNGERER</li>
                <li>✅ E-post-sending: FUNGERER</li>
                <li>✅ 100% kontroll: AKTIVERT</li>
              </ul>
            </div>
            
            <p style="color: #059669; font-weight: bold;">
              🎯 Du er nå logget inn og har full kontroll over e-post-systemet!
            </p>
          </div>
        `
      };

      const info = await transporter.sendMail(testMailOptions);
      console.log('✅ Test email sent successfully:', info.messageId);

    } catch (sendError) {
      console.error('❌ Test email sending failed:', sendError);
      
      let errorMessage = 'E-post-sending feilet';
      if (sendError instanceof Error) {
        if (sendError.message.includes('authentication')) {
          errorMessage = 'Autentiseringsfeil: Passordet eller brukernavnet er feil';
        } else if (sendError.message.includes('quota')) {
          errorMessage = 'E-post-kvote overskredet: Sjekk Domeneshop-kontoen';
        } else if (sendError.message.includes('spam')) {
          errorMessage = 'E-post ble blokkert som spam: Sjekk Domeneshop-innstillinger';
        } else {
          errorMessage = `E-post-sending feilet: ${sendError.message}`;
        }
      }
      
      return NextResponse.json({
        error: errorMessage,
        details: {
          host,
          port: port || 587,
          user,
          secure: secure || false,
          timestamp: new Date().toISOString()
        }
      }, { status: 500 });
    }

    // All tests passed!
    console.log('🎉 SMTP login test completed successfully');
    
    return NextResponse.json({
      success: true,
      message: `SMTP-login vellykket! Alle systemer fungerer perfekt.
      
✅ Brukte konfigurasjon: ${successfulConfig.name}
✅ Domeneshop-tilkobling: FUNGERER
✅ E-post-sending: FUNGERER
✅ 100% kontroll: AKTIVERT`,
      details: {
        host,
        port: successfulConfig.config.port,
        user,
        secure: successfulConfig.config.secure,
        configName: successfulConfig.name,
        timestamp: new Date().toISOString(),
        status: 'authenticated'
      }
    });

  } catch (error) {
    console.error('❌ SMTP login test failed:', error);
    
    return NextResponse.json({
      error: 'Ukjent feil under SMTP-login test',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 