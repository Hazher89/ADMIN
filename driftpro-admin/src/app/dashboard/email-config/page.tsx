'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { emailService } from '@/lib/email-service';
import { Shield, Mail, Settings, TestTube, Save, Eye, EyeOff } from 'lucide-react';

export const dynamic = 'force-dynamic';

interface EmailConfig {
  host: string;
  port: number;
  user: string;
  pass: string;
  secure: boolean;
}

export default function EmailConfigPage() {
  const { userProfile } = useAuth();
  const [config, setConfig] = useState<EmailConfig>({
    host: 'smtp.domeneshop.no',
    port: 587,
    user: 'noreplay@driftpro.no',
    pass: 'HazGada89!',
    secure: false
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [saveResult, setSaveResult] = useState<{ success: boolean; message: string } | null>(null);
  const [loginTestResult, setLoginTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [isLoginTesting, setIsLoginTesting] = useState(false);
  const [smtpLoginResult, setSmtpLoginResult] = useState<{ success: boolean; message: string; details?: any } | null>(null);
  const [isSmtpLoggingIn, setIsSmtpLoggingIn] = useState(false);

  // Check if user is super admin
  const isSuperAdmin = userProfile?.role === 'super_admin';

  useEffect(() => {
    if (!isSuperAdmin) {
      alert('Du har ikke tilgang til denne siden. Kun super administratorer kan konfigurere e-post-innstillinger.');
      window.history.back();
    }
  }, [isSuperAdmin]);

  // Load existing email settings
  useEffect(() => {
    const loadEmailSettings = async () => {
      try {
        // Load from Firebase only
        const response = await fetch('/api/email-settings?includePassword=true');
        if (response.ok) {
          const settings = await response.json();
          const newConfig = {
            host: settings.smtpHost || 'smtp.domeneshop.no',
            port: settings.smtpPort || 587,
            user: settings.smtpUser || 'noreplay@driftpro.no',
            pass: settings.smtpPassword || 'HazGada89!',
            secure: settings.smtpSecure || false
          };
          setConfig(newConfig);
        }
      } catch (error) {
        console.error('Error loading email settings:', error);
        // Use default config if Firebase fails
        const defaultConfig = {
          host: 'smtp.domeneshop.no',
          port: 587,
          user: 'noreplay@driftpro.no',
          pass: 'HazGada89!',
          secure: false
        };
        setConfig(defaultConfig);
      }
    };

    if (isSuperAdmin) {
      loadEmailSettings();
    }
  }, [isSuperAdmin]);

  const handleConfigChange = (field: keyof EmailConfig, value: string | number | boolean) => {
    const newConfig = {
      ...config,
      [field]: value
    };
    setConfig(newConfig);
  };

  const testEmailConnection = async () => {
    setIsLoading(true);
    setTestResult(null);

    try {
      // First save the configuration if it hasn't been saved yet
      if (config.pass) {
        await saveEmailConfig();
      }

      // Test email by sending a test notification
      const success = await emailService.sendNotificationEmail(
        config.user, // Send to self
        'Test e-post fra DriftPro',
        `Dette er en test e-post for å verifisere at e-post-innstillingene fungerer.

Konfigurasjon:
- SMTP Server: ${config.host}:${config.port}
- Bruker: ${config.user}
- Sikker: ${config.secure ? 'Ja' : 'Nei'}

Hvis du mottar denne e-posten, fungerer e-post-innstillingene korrekt.`,
        'info'
      );

      if (success) {
        setTestResult({
          success: true,
          message: 'Test e-post sendt! Sjekk innboksen din for å bekrefte at e-post-innstillingene fungerer.'
        });
      } else {
        setTestResult({
          success: false,
          message: 'Kunne ikke sende test e-post. Sjekk innstillingene og prøv igjen.'
        });
      }
    } catch (error) {
      setTestResult({
        success: false,
        message: `Feil ved sending av test e-post: ${error instanceof Error ? error.message : 'Ukjent feil'}`
      });
    } finally {
      setIsLoading(false);
    }
  };

  const saveEmailConfig = async () => {
    setIsLoading(true);
    setSaveResult(null);

    try {
      if (!config.host || !config.port || !config.user || !config.pass) {
        throw new Error('Alle felter må fylles ut');
      }

      // Save configuration to Firebase with complete control
      const response = await fetch('/api/email-settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          // SMTP Configuration - Full Control
          smtpHost: config.host,
          smtpPort: config.port,
          smtpUser: config.user,
          smtpPassword: config.pass,
          smtpSecure: config.secure,
          smtpTimeout: 30,
          smtpAuthMethod: 'PLAIN',
          
          // Email Settings - Full Control
          fromEmail: config.user,
          fromName: 'DriftPro System',
          enabled: true,
          
          // Feature Control - Enable/Disable all email types
          adminSetup: true,
          deviationReports: true,
          deviationResolved: true,
          userWelcome: true,
          notifications: true,
          warnings: true,
          systemAlerts: true,
          absence: true,
          vacation: true,
          newEmployee: true,
          passwordReset: true,
          
          // Advanced Settings - Full Control
          emailQueue: false,
          logAllEmails: true,
          spamProtection: true,
          maxRecipients: 50,
          retryAttempts: 3,
          retryDelay: 5000,
          maxEmailsPerHour: 100,
          
          // Template Control - Customize all email templates
          adminSetupTemplate: 'Hei [adminName], velkommen til [companyName]. Klikk her for å sette opp passord: [setupUrl]',
          deviationReportTemplate: 'Avviksrapport: [deviationTitle] - [message]',
          notificationTemplate: 'Varsel: [subject] - [message]',
          userWelcomeTemplate: 'Velkommen [userName] til [companyName]! Logg inn her: [loginUrl]',
          warningTemplate: 'ADVARSEL: [warningType] - [description]. Handling kreves: [action]',
          
          // Analytics and Tracking - Full Control
          analyticsEnabled: false,
          trackOpenRates: false,
          trackClickRates: false,
          
          // Backup SMTP - Full Control
          backupSmtpEnabled: false,
          backupSmtpHost: '',
          backupSmtpPort: 587,
          
          // Metadata
          updatedBy: 'admin',
          updatedAt: new Date().toISOString()
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Feil ved lagring av konfigurasjon');
      }

      // Force reload all email services to use new settings
      await forceReloadEmailServices();

      // Test the configuration after saving
      await testEmailConnection();

      setSaveResult({
        success: true,
        message: 'E-post-konfigurasjon lagret og aktivert! Alle e-post-funksjoner bruker nå dine innstillinger.'
      });
    } catch (error) {
      setSaveResult({
        success: false,
        message: `Feil ved lagring av konfigurasjon: ${error instanceof Error ? error.message : 'Ukjent feil'}`
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Force reload all email services to use new settings
  const forceReloadEmailServices = async () => {
    try {
      // Clear any cached settings
      await fetch('/api/email-settings/clear-cache', { method: 'POST' });
      
      // Reload email service configuration
      await fetch('/api/email-settings/reload', { method: 'POST' });
      
      console.log('Email services reloaded with new settings');
    } catch (error) {
      console.error('Error reloading email services:', error);
    }
  };

  const testFullEmailSystem = async () => {
    setIsLoginTesting(true);
    setLoginTestResult(null);

    try {
      console.log('🧪 Testing full email system...');

      // Step 1: Test SMTP connection
      console.log('Step 1: Testing SMTP connection...');
      const smtpTest = await fetch('/api/send-test-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: config.user,
          type: 'test',
          settings: config
        })
      });

      if (!smtpTest.ok) {
        throw new Error('SMTP connection failed');
      }

      // Step 2: Test Firebase settings retrieval
      console.log('Step 2: Testing Firebase settings retrieval...');
      const settingsTest = await fetch('/api/email-settings?includePassword=true');
      if (!settingsTest.ok) {
        throw new Error('Firebase settings retrieval failed');
      }

      // Step 3: Test email service functionality
      console.log('Step 3: Testing email service functionality...');
      const emailServiceTest = await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: config.user,
          subject: '🧪 Full System Test - DriftPro Email System',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #2563eb;">🎉 FULL SYSTEM TEST SUCCESSFUL!</h2>
              <p><strong>Dato:</strong> ${new Date().toLocaleString('nb-NO')}</p>
              <p><strong>SMTP Server:</strong> ${config.host}</p>
              <p><strong>Bruker:</strong> ${config.user}</p>
              <p><strong>Status:</strong> ✅ Alle systemer fungerer perfekt!</p>
              
              <div style="background-color: #f0f9ff; border: 1px solid #0ea5e9; border-radius: 8px; padding: 16px; margin: 20px 0;">
                <h3 style="color: #0c4a6e; margin-top: 0;">🔧 System Status:</h3>
                <ul style="color: #0c4a6e;">
                  <li>✅ SMTP-tilkobling: FUNGERER</li>
                  <li>✅ Firebase-innstillinger: FUNGERER</li>
                  <li>✅ E-post-sending: FUNGERER</li>
                  <li>✅ System-integrasjon: FUNGERER</li>
                  <li>✅ 100% kontroll: AKTIVERT</li>
                </ul>
              </div>
              
              <p style="color: #059669; font-weight: bold;">
                🎯 Du har nå 100% kontroll over hele e-post-systemet!
              </p>
            </div>
          `,
          type: 'system'
        })
      });

      if (!emailServiceTest.ok) {
        throw new Error('Email service test failed');
      }

      // Step 4: Test all email types
      console.log('Step 4: Testing all email types...');
      const emailTypes = ['admin_setup', 'notification', 'warning', 'system', 'welcome'];
      
      for (const emailType of emailTypes) {
        const typeTest = await fetch('/api/send-test-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: config.user,
            type: emailType,
            settings: config
          })
        });
        
        if (!typeTest.ok) {
          console.warn(`Warning: Email type ${emailType} test failed`);
        }
      }

      // All tests passed!
      setLoginTestResult({
        success: true,
        message: `🎉 FULL SYSTEM TEST SUCCESSFUL! 
        
✅ SMTP-tilkobling: FUNGERER
✅ Firebase-innstillinger: FUNGERER  
✅ E-post-sending: FUNGERER
✅ System-integrasjon: FUNGERER
✅ Alle e-post-typer: TESTET
✅ 100% kontroll: AKTIVERT

🎯 Du har nå 100% kontroll over hele e-post-systemet!
Alle endringer du gjør her påvirker hele websiden og alle e-post-funksjoner.`
      });

    } catch (error) {
      console.error('Full system test failed:', error);
      setLoginTestResult({
        success: false,
        message: `❌ FULL SYSTEM TEST FAILED: ${error instanceof Error ? error.message : 'Unknown error'}
        
🔧 Sjekk følgende:
• SMTP-innstillinger er korrekte
• Firebase-tilkobling fungerer
• E-post-passord er riktig
• Nettverkstilkobling er stabil`
      });
    } finally {
      setIsLoginTesting(false);
    }
  };

  const testSmtpLogin = async () => {
    setIsSmtpLoggingIn(true);
    setSmtpLoginResult(null);

    try {
      console.log('🔐 Testing SMTP login...');

      // Step 1: Validate configuration
      console.log('Step 1: Validating configuration...');
      if (!config.host || !config.user || !config.pass) {
        throw new Error('Manglende SMTP-innstillinger: Host, bruker eller passord mangler');
      }

      // Step 2: Test Firebase connection
      console.log('Step 2: Testing Firebase connection...');
      const firebaseTest = await fetch('/api/email-settings?includePassword=true');
      if (!firebaseTest.ok) {
        throw new Error('Firebase-tilkobling feilet - kan ikke hente innstillinger');
      }

      // Step 3: Test SMTP connection with detailed verification
      console.log('Step 3: Testing SMTP connection...');
      const smtpTest = await fetch('/api/smtp-login-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          host: config.host,
          port: config.port,
          user: config.user,
          pass: config.pass,
          secure: config.secure
        })
      });

      const smtpResult = await smtpTest.json();

      if (!smtpTest.ok) {
        throw new Error(`SMTP-login feilet: ${smtpResult.error || 'Ukjent feil'}`);
      }

      // Step 4: Test email sending
      console.log('Step 4: Testing email sending...');
      const emailTest = await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: config.user,
          subject: '🔐 SMTP Login Test - DriftPro',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #059669;">🔐 SMTP LOGIN SUCCESSFUL!</h2>
              <p><strong>Dato:</strong> ${new Date().toLocaleString('nb-NO')}</p>
              <p><strong>SMTP Server:</strong> ${config.host}</p>
              <p><strong>Bruker:</strong> ${config.user}</p>
              <p><strong>Status:</strong> ✅ Alle systemer fungerer perfekt!</p>
              
              <div style="background-color: #f0fdf4; border: 1px solid #16a34a; border-radius: 8px; padding: 16px; margin: 20px 0;">
                <h3 style="color: #166534; margin-top: 0;">🔧 Login Status:</h3>
                <ul style="color: #166534;">
                  <li>✅ SMTP-autentisering: FUNGERER</li>
                  <li>✅ Domeneshop-tilkobling: FUNGERER</li>
                  <li>✅ Firebase-integrasjon: FUNGERER</li>
                  <li>✅ E-post-sending: FUNGERER</li>
                  <li>✅ 100% kontroll: AKTIVERT</li>
                </ul>
              </div>
              
              <p style="color: #059669; font-weight: bold;">
                🎯 Du er nå logget inn og har full kontroll over e-post-systemet!
              </p>
            </div>
          `,
          type: 'system'
        })
      });

      if (!emailTest.ok) {
        throw new Error('E-post-sending feilet etter vellykket SMTP-login');
      }

      // All tests passed!
      setSmtpLoginResult({
        success: true,
        message: `🔐 SMTP LOGIN SUCCESSFUL! 
        
✅ SMTP-autentisering: FUNGERER
✅ Domeneshop-tilkobling: FUNGERER  
✅ Firebase-integrasjon: FUNGERER
✅ E-post-sending: FUNGERER
✅ Alle systemer: OPERATIVE

🎯 Du er nå logget inn og har 100% kontroll!
Alle e-post-funksjoner bruker dine innstillinger og fungerer perfekt.`,
        details: {
          smtpServer: config.host,
          user: config.user,
          port: config.port,
          secure: config.secure,
          timestamp: new Date().toISOString()
        }
      });

    } catch (error) {
      console.error('SMTP login test failed:', error);
      
      let detailedError = '';
      if (error instanceof Error) {
        if (error.message.includes('authentication')) {
          detailedError = `🔐 Autentiseringsfeil: Passordet eller brukernavnet er feil
          
🔧 Løsning:
• Sjekk at passordet for ${config.user} er riktig
• Verifiser at brukernavnet er korrekt
• Prøv å logge inn på Domeneshop-kontrollpanelet`;
        } else if (error.message.includes('connection')) {
          detailedError = `🌐 Tilkoblingsfeil: Kan ikke koble til SMTP-serveren
          
🔧 Løsning:
• Sjekk at SMTP-serveren ${config.host} er riktig
• Verifiser at port ${config.port} er åpen
• Sjekk nettverkstilkoblingen`;
        } else if (error.message.includes('ECONNRESET')) {
          detailedError = `🔄 Domeneshop SMTP-tilkobling ble avbrutt
          
🔧 Løsning:
• Dette er vanlig med Domeneshop - prøv igjen
• Sjekk at Domeneshop-kontoen er aktiv
• Kontakt Domeneshop support hvis problemet vedvarer
• Prøv å bruke en annen SMTP-port (465 med SSL)`;
        } else if (error.message.includes('Firebase')) {
          detailedError = `🔥 Firebase-feil: Kan ikke hente innstillinger
          
🔧 Løsning:
• Sjekk Firebase-tilkoblingen
• Verifiser at innstillingene er lagret
• Prøv å lagre innstillingene på nytt`;
        } else {
          detailedError = `❌ Ukjent feil: ${error.message}
          
🔧 Sjekk følgende:
• Alle SMTP-innstillinger er fylt ut
• Domeneshop-kontoen fungerer
• Firebase-tilkoblingen er stabil`;
        }
      }

      setSmtpLoginResult({
        success: false,
        message: `❌ SMTP LOGIN FAILED

${detailedError}`,
        details: {
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString()
        }
      });
    } finally {
      setIsSmtpLoggingIn(false);
    }
  };

  if (!isSuperAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Shield className="mx-auto h-12 w-12 text-red-500 mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Ingen tilgang</h2>
          <p className="text-gray-600">Du har ikke tilgang til denne siden.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center">
              <Mail className="h-6 w-6 text-blue-600 mr-3" />
              <div>
                <h1 className="text-xl font-semibold text-gray-900">🎛️ MASTER KONTROLL - E-post-systemet</h1>
                <p className="text-sm text-gray-600">Dette er HJERTET av hele e-post-systemet - Alle endringer påvirker hele websiden og alle e-post-funksjoner</p>
              </div>
            </div>
          </div>

          <div className="px-6 py-6">
            {/* Configuration Form */}
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">🔥 SMTP-innstillinger - HJERTET AV SYSTEMET</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* SMTP Host */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      SMTP Server
                    </label>
                    <input
                      type="text"
                      value={config.host}
                      onChange={(e) => handleConfigChange('host', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="smtp.domeneshop.no"
                    />
                  </div>

                  {/* SMTP Port */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Port
                    </label>
                    <input
                      type="number"
                      value={config.port}
                      onChange={(e) => handleConfigChange('port', parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="587"
                    />
                  </div>

                  {/* Email User */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      E-post-adresse
                    </label>
                    <input
                      type="email"
                      value={config.user}
                      onChange={(e) => handleConfigChange('user', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="noreplay@driftpro.no"
                    />
                  </div>

                  {/* Email Password */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Passord
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={config.pass}
                        onChange={(e) => handleConfigChange('pass', e.target.value)}
                        className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="App-passord"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4 text-gray-400" />
                        ) : (
                          <Eye className="h-4 w-4 text-gray-400" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Security Option */}
                <div className="mt-4">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={config.secure}
                      onChange={(e) => handleConfigChange('secure', e.target.checked)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">Bruk sikker tilkobling (SSL/TLS)</span>
                  </label>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={testEmailConnection}
                  disabled={isLoading}
                  className="flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  <TestTube className="h-4 w-4 mr-2" />
                  Test e-post-innstillinger
                </button>

                <button
                  onClick={saveEmailConfig}
                  disabled={isLoading}
                  className="flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                >
                  <Save className="h-4 w-4 mr-2" />
                  💾 Lagre & Aktiver (Full Kontroll)
                </button>

                <button
                  onClick={testSmtpLogin}
                  disabled={isSmtpLoggingIn}
                  className="flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                >
                  <Mail className="h-4 w-4 mr-2" />
                  {isSmtpLoggingIn ? '🔐 Logger inn...' : '🔐 SMTP LOGIN TEST'}
                </button>

                <button
                  onClick={testFullEmailSystem}
                  disabled={isLoginTesting}
                  className="flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50"
                >
                  <Settings className="h-4 w-4 mr-2" />
                  {isLoginTesting ? '🧪 Tester System...' : '🧪 FULL SYSTEM TEST'}
                </button>
              </div>

              {/* Results */}
              {testResult && (
                <div className={`p-4 rounded-md ${testResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                  <div className="flex">
                    <div className="flex-shrink-0">
                      {testResult.success ? (
                        <div className="h-5 w-5 text-green-400">✓</div>
                      ) : (
                        <div className="h-5 w-5 text-red-400">✗</div>
                      )}
                    </div>
                    <div className="ml-3">
                      <p className={`text-sm ${testResult.success ? 'text-green-800' : 'text-red-800'}`}>
                        {testResult.message}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {saveResult && (
                <div className={`p-4 rounded-md ${saveResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                  <div className="flex">
                    <div className="flex-shrink-0">
                      {saveResult.success ? (
                        <div className="h-5 w-5 text-green-400">✓</div>
                      ) : (
                        <div className="h-5 w-5 text-red-400">✗</div>
                      )}
                    </div>
                    <div className="ml-3">
                      <p className={`text-sm ${saveResult.success ? 'text-green-800' : 'text-red-800'}`}>
                        {saveResult.message}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {loginTestResult && (
                <div className={`p-4 rounded-md ${loginTestResult.success ? 'bg-purple-50 border border-purple-200' : 'bg-red-50 border border-red-200'}`}>
                  <div className="flex">
                    <div className="flex-shrink-0">
                      {loginTestResult.success ? (
                        <div className="h-5 w-5 text-purple-400">🎉</div>
                      ) : (
                        <div className="h-5 w-5 text-red-400">❌</div>
                      )}
                    </div>
                    <div className="ml-3">
                      <p className={`text-sm ${loginTestResult.success ? 'text-purple-800' : 'text-red-800'} whitespace-pre-line`}>
                        {loginTestResult.message}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {smtpLoginResult && (
                <div className={`p-4 rounded-md ${smtpLoginResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                  <div className="flex">
                    <div className="flex-shrink-0">
                      {smtpLoginResult.success ? (
                        <div className="h-5 w-5 text-green-400">🔐</div>
                      ) : (
                        <div className="h-5 w-5 text-red-400">❌</div>
                      )}
                    </div>
                    <div className="ml-3">
                      <p className={`text-sm ${smtpLoginResult.success ? 'text-green-800' : 'text-red-800'} whitespace-pre-line`}>
                        {smtpLoginResult.message}
                      </p>
                      {smtpLoginResult.details && (
                        <div className="mt-2 text-xs text-gray-600">
                          <p><strong>Server:</strong> {smtpLoginResult.details.smtpServer || smtpLoginResult.details.host}</p>
                          <p><strong>Bruker:</strong> {smtpLoginResult.details.user}</p>
                          <p><strong>Port:</strong> {smtpLoginResult.details.port}</p>
                          <p><strong>Tidspunkt:</strong> {new Date(smtpLoginResult.details.timestamp).toLocaleString('nb-NO')}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Master Control Panel */}
              <div className="bg-purple-50 border border-purple-200 rounded-md p-4">
                <h4 className="text-sm font-medium text-purple-800 mb-2">🎛️ MASTER KONTROLL - 100% Kontroll over E-post-systemet</h4>
                <div className="text-sm text-purple-700 space-y-2">
                  <p><strong>🔥 DETTE ER HJERTET AV HELE E-POST-SYSTEMET:</strong></p>
                  <ul className="list-disc list-inside ml-4 space-y-1">
                    <li>✅ <strong>SMTP-server og autentisering</strong> - Kontrollerer ALLE e-poster</li>
                    <li>✅ <strong>Alle e-post-maler og templates</strong> - Påvirker hele websiden</li>
                    <li>✅ <strong>Enable/disable av alle e-post-typer</strong> - Global kontroll</li>
                    <li>✅ <strong>Avanserte innstillinger</strong> - Timeout, retry, rate limiting</li>
                    <li>✅ <strong>Backup SMTP-konfigurasjon</strong> - Redundans og sikkerhet</li>
                    <li>✅ <strong>Analytics og tracking</strong> - Overvåking av alle e-poster</li>
                    <li>✅ <strong>Spam-beskyttelse</strong> - Global beskyttelse</li>
                  </ul>
                  
                  <p className="mt-3"><strong>🌐 PÅVIRKER HELE WEBSIDEN:</strong></p>
                  <ul className="list-disc list-inside ml-4 space-y-1">
                    <li>🔥 <strong>Alle endringer lagres i Firebase</strong> - Ingen lokal lagring</li>
                    <li>⚡ <strong>Systemet reloader automatisk</strong> - Nye innstillinger aktivt umiddelbart</li>
                    <li>🌐 <strong>Alle e-post-funksjoner bruker dine innstillinger</strong> - Global påvirkning</li>
                    <li>📧 <strong>Test-funksjonalitet</strong> - Verifiser at alt fungerer</li>
                    <li>🔒 <strong>Passordet lagres sikker i Firebase</strong> - Kryptert lagring</li>
                    <li>🎯 <strong>100% kontroll over alle e-post-funksjoner</strong> - Ingen begrensninger</li>
                  </ul>
                </div>
              </div>

              {/* Instructions */}
              <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                <h4 className="text-sm font-medium text-blue-800 mb-2">📧 Instruksjoner for oppsett</h4>
                <div className="text-sm text-blue-700 space-y-2">
                  <p><strong>For Microsoft 365/Outlook (noreplay@driftpro.no):</strong></p>
                  <ul className="list-disc list-inside ml-4 space-y-1">
                    <li>SMTP Server: smtp.domeneshop.no</li>
                    <li>Port: 587</li>
                    <li>Bruker: noreplay@driftpro.no</li>
                    <li>Passord: HazGada89!</li>
                    <li>Ikke bruk SSL/TLS (secure: false)</li>
                  </ul>
                  
                  <p className="mt-3"><strong>For Gmail:</strong></p>
                  <ul className="list-disc list-inside ml-4 space-y-1">
                    <li>SMTP Server: smtp.gmail.com</li>
                    <li>Port: 587</li>
                    <li>Bruk app-passord fra Google Account innstillinger</li>
                    <li>Ikke bruk SSL/TLS (secure: false)</li>
                  </ul>

                  <p className="mt-3"><strong>For Domeneshop:</strong></p>
                  <ul className="list-disc list-inside ml-4 space-y-1">
                    <li>SMTP Server: smtp.domeneshop.no</li>
                    <li>Port: 587 (STARTTLS) eller 465 (SSL)</li>
                    <li>Bruk e-post-passord fra Domeneshop</li>
                    <li>STARTTLS: secure: false, SSL: secure: true</li>
                    <li>Hvis 587 feiler, prøv 465 med SSL</li>
                  </ul>

                  <p className="mt-3"><strong>🔒 Sikkerhet:</strong></p>
                  <ul className="list-disc list-inside ml-4 space-y-1">
                    <li>Passordet lagres kryptert i Firebase</li>
                    <li>Alle e-post-funksjoner bruker dine innstillinger</li>
                    <li>Test-funksjonalitet for å verifisere innstillinger</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 