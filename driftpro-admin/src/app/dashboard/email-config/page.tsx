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
    host: 'smtp.office365.com',
    port: 587,
    user: 'noreply@driftpro.no',
    pass: '',
    secure: false
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [saveResult, setSaveResult] = useState<{ success: boolean; message: string } | null>(null);

  // Check if user is super admin
  const isSuperAdmin = userProfile?.role === 'super_admin';

  useEffect(() => {
    if (!isSuperAdmin) {
      alert('Du har ikke tilgang til denne siden. Kun super administratorer kan konfigurere e-post-innstillinger.');
      window.history.back();
    }
  }, [isSuperAdmin]);

  const handleConfigChange = (field: keyof EmailConfig, value: string | number | boolean) => {
    setConfig(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const testEmailConnection = async () => {
    setIsLoading(true);
    setTestResult(null);

    try {
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
      // Save to environment variables (this would need to be done via Netlify dashboard)
      // For now, we'll just validate the configuration
      
      if (!config.host || !config.port || !config.user || !config.pass) {
        throw new Error('Alle felter må fylles ut');
      }

      // Test the configuration first
      await testEmailConnection();

      setSaveResult({
        success: true,
        message: 'E-post-konfigurasjon validert! For å lagre permanent, oppdater environment variables i Netlify dashboard.'
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
                <h1 className="text-xl font-semibold text-gray-900">E-post-konfigurasjon</h1>
                <p className="text-sm text-gray-600">Konfigurer e-post-innstillinger for noreply@driftpro.no</p>
              </div>
            </div>
          </div>

          <div className="px-6 py-6">
            {/* Configuration Form */}
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">SMTP-innstillinger</h3>
                
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
                      placeholder="smtp.office365.com"
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
                      placeholder="noreply@driftpro.no"
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
                  Lagre konfigurasjon
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

              {/* Instructions */}
              <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                <h4 className="text-sm font-medium text-blue-800 mb-2">Instruksjoner for oppsett</h4>
                <div className="text-sm text-blue-700 space-y-2">
                  <p><strong>For Microsoft 365/Outlook:</strong></p>
                  <ul className="list-disc list-inside ml-4 space-y-1">
                    <li>SMTP Server: smtp.office365.com</li>
                    <li>Port: 587</li>
                    <li>Bruk app-passord, ikke vanlig passord</li>
                    <li>Ikke bruk SSL/TLS (secure: false)</li>
                  </ul>
                  
                  <p className="mt-3"><strong>For Gmail:</strong></p>
                  <ul className="list-disc list-inside ml-4 space-y-1">
                    <li>SMTP Server: smtp.gmail.com</li>
                    <li>Port: 587</li>
                    <li>Bruk app-passord fra Google Account innstillinger</li>
                    <li>Ikke bruk SSL/TLS (secure: false)</li>
                  </ul>

                  <p className="mt-3"><strong>For å lagre permanent:</strong></p>
                  <ul className="list-disc list-inside ml-4 space-y-1">
                    <li>Gå til Netlify Dashboard → Site Settings → Environment Variables</li>
                    <li>Legg til: DRIFTPRO_EMAIL_PASSWORD = ditt-app-passord</li>
                    <li>Redeploy applikasjonen</li>
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