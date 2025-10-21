'use client';

import React, { useState, useEffect } from 'react';
import { 
  Mail, 
  Settings, 
  LogIn, 
  LogOut, 
  RefreshCw, 
  AlertCircle, 
  CheckCircle,
  Info,
  Globe,
  Shield,
  Key,
  Send,
  Eye,
  EyeOff,
  TestTube,
  FileText,
  Clock,
  User,
  Building,
  Zap,
  Lock,
  Unlock,
  AlertTriangle,
  X
} from 'lucide-react';

interface EmailSettings {
  smtpHost: string;
  smtpPort: number;
  smtpUser: string;
  smtpPassword: string;
  fromName: string;
  fromEmail: string;
  secure: boolean;
}

interface EmailLog {
  id: string;
  to: string;
  subject: string;
  status: 'sent' | 'failed' | 'pending';
  timestamp: string;
  error?: string;
}

export default function EmailSettingsPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [activeAccount, setActiveAccount] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Login states
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginStatus, setLoginStatus] = useState<'not_logged_in' | 'logging_in' | 'logged_in' | 'error'>('not_logged_in');
  const [loginMessage, setLoginMessage] = useState('');
  
  // Email settings states
  const [emailSettings, setEmailSettings] = useState<EmailSettings>({
    smtpHost: 'smtp.office365.com',
    smtpPort: 587,
    smtpUser: '',
    smtpPassword: '',
    fromName: 'DriftPro System',
    fromEmail: '',
    secure: false
  });
  
  // Test email states
  const [testEmailAddress, setTestEmailAddress] = useState('');
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [testMessage, setTestMessage] = useState('');
  
  // Email logs states
  const [emailLogs, setEmailLogs] = useState<EmailLog[]>([]);
  const [showEmailLogs, setShowEmailLogs] = useState(false);

  useEffect(() => {
    const checkLoginStatus = async () => {
      setIsLoading(true);
      try {
        // Check localStorage for existing login
        const savedStatus = localStorage.getItem('office365_email_login_status');
        const savedCredentials = localStorage.getItem('office365_email_credentials');
        
        if (savedStatus === 'logged_in' && savedCredentials) {
          const credentials = JSON.parse(savedCredentials);
          const now = new Date().getTime();
          const loginTime = new Date(credentials.loginTime).getTime();
          const expiresIn = credentials.expiresIn || (7 * 24 * 60 * 60 * 1000); // Default 7 days
          
          if (now - loginTime < expiresIn) {
            setIsLoggedIn(true);
            setActiveAccount({
              email: credentials.email,
              name: credentials.email.split('@')[0]
            });
            setEmailSettings(prev => ({
              ...prev,
              smtpUser: credentials.email,
              smtpPassword: credentials.password,
              fromEmail: credentials.email
            }));
            setLoginStatus('logged_in');
            console.log('✅ Office 365 email session restored from localStorage');
          } else {
            // Session expired, clear it
            localStorage.removeItem('office365_email_login_status');
            localStorage.removeItem('office365_email_credentials');
            console.log('ℹ️ Office 365 email session expired');
          }
        } else {
          console.log('ℹ️ No Office 365 email session found');
        }
      } catch (error) {
        console.error('Error checking login status:', error);
      } finally {
        setIsLoading(false);
      }
    };
    checkLoginStatus();
  }, []);

  const handleLogin = async () => {
    if (!loginEmail || !loginPassword) {
      setLoginMessage('Vennligst skriv inn e-post og passord');
      setLoginStatus('error');
      return;
    }

    setIsLoading(true);
    setLoginStatus('logging_in');
    setLoginMessage('Logger inn til Office 365...');

    try {
      // Test Office 365 connection
      const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
      const response = await fetch(`${baseUrl}/api/smtp-test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          host: 'smtp.office365.com',
          port: 587,
          user: loginEmail,
          pass: loginPassword,
          secure: false,
          testEmail: loginEmail
        })
      });

      const result = await response.json();

      if (result.success) {
        setIsLoggedIn(true);
        setActiveAccount({
          email: loginEmail,
          name: loginEmail.split('@')[0]
        });
        setEmailSettings(prev => ({
          ...prev,
          smtpUser: loginEmail,
          smtpPassword: loginPassword,
          fromEmail: loginEmail
        }));
        setLoginStatus('logged_in');
        setLoginMessage(`✅ Innlogging vellykket! Logget inn som ${loginEmail}`);
        
        // Save login state to localStorage
        localStorage.setItem('office365_email_login_status', 'logged_in');
        localStorage.setItem('office365_email_credentials', JSON.stringify({ 
          email: loginEmail, 
          password: loginPassword,
          loginTime: new Date().toISOString(),
          expiresIn: 7 * 24 * 60 * 60 * 1000 // 7 days
        }));
        
        console.log('✅ Office 365 email login successful');
      } else {
        setLoginStatus('error');
        setLoginMessage(result.error || 'Innlogging feilet');
      }
    } catch (error) {
      setLoginStatus('error');
      setLoginMessage('Feil ved innlogging til Office 365');
      console.error('Login failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    const confirmLogout = window.confirm('Er du sikker på at du vil logge ut av Office 365?');
    if (!confirmLogout) return;

    setIsLoggedIn(false);
    setActiveAccount(null);
    setLoginStatus('not_logged_in');
    setLoginMessage('');
    setEmailSettings(prev => ({
      ...prev,
      smtpUser: '',
      smtpPassword: '',
      fromEmail: ''
    }));
    
    // Clear localStorage
    localStorage.removeItem('office365_email_login_status');
    localStorage.removeItem('office365_email_credentials');
    
    console.log('✅ Office 365 email logout successful');
  };

  const testEmailConnection = async () => {
    if (!testEmailAddress) {
      setTestMessage('Vennligst skriv inn en e-postadresse for testing');
      setTestStatus('error');
      return;
    }

    if (!isLoggedIn) {
      setTestMessage('⚠️ Du må logge inn til Office 365 først!');
      setTestStatus('error');
      return;
    }

    setTestStatus('testing');
    setTestMessage('Tester e-posttilkobling...');

    try {
      const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
      const response = await fetch(`${baseUrl}/api/send-test-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: testEmailAddress,
          subject: 'DriftPro E-post Test',
          message: 'Dette er en test-e-post fra DriftPro systemet.',
          smtpConfig: {
            host: emailSettings.smtpHost,
            port: emailSettings.smtpPort,
            user: emailSettings.smtpUser,
            pass: emailSettings.smtpPassword,
            secure: emailSettings.secure
          }
        })
      });

      const result = await response.json();

      if (result.success) {
        setTestStatus('success');
        setTestMessage(`✅ E-posttest vellykket! Test-e-post sendt til ${testEmailAddress}`);
      } else {
        setTestStatus('error');
        setTestMessage(result.error || 'E-posttest feilet');
      }
    } catch (error) {
      setTestStatus('error');
      setTestMessage('Feil ved testing av e-posttilkobling');
    }
  };

  const loadEmailLogs = async () => {
    if (!isLoggedIn) {
      setError('Du må logge inn til Office 365 først!');
      return;
    }

    try {
      const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
      const response = await fetch(`${baseUrl}/api/email-logs`);
      const logs = await response.json();
      setEmailLogs(logs);
      setShowEmailLogs(true);
    } catch (error) {
      console.error('Error loading email logs:', error);
      setError('Kunne ikke laste e-postlogger');
    }
  };

  const saveEmailSettings = async () => {
    if (!isLoggedIn) {
      setError('Du må logge inn til Office 365 først!');
      return;
    }

    try {
      const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
      const response = await fetch(`${baseUrl}/api/email-settings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(emailSettings)
      });

      const result = await response.json();

      if (result.success) {
        alert('✅ E-postinnstillinger lagret!');
      } else {
        alert(`❌ Feil ved lagring: ${result.error}`);
      }
    } catch (error) {
      console.error('Error saving email settings:', error);
      alert('❌ Feil ved lagring av e-postinnstillinger');
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-lg w-full">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <Mail className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-3">Office 365 E-post</h1>
            <p className="text-gray-600 text-lg">Din sikre e-postkonfigurasjon</p>
          </div>

          {/* Office 365 Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
            <div className="flex items-start space-x-3">
              <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">Hva er Office 365 E-post?</p>
                <p>Office 365 SMTP lar DriftPro sende e-poster på vegne av bedriften din.</p>
                <p className="mt-1"><strong>Fordeler:</strong></p>
                <ul className="list-disc list-inside mt-1 space-y-1">
                  <li>📧 Automatisk sending av velkomst-e-poster til ansatte</li>
                  <li>🔔 E-postvarsler for viktige hendelser</li>
                  <li>📋 Passord-reset og glemt passord funksjonalitet</li>
                  <li>🛡️ Sikker e-posthåndtering via Microsoft</li>
                  <li>📊 E-postlogger og statistikk</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Login Form */}
          <div className="space-y-4 mb-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Office 365 E-postadresse
              </label>
              <input
                id="email"
                type="email"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="din@bedrift.no"
                disabled={isLoading}
              />
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Passord
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Ditt Office 365 passord"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  disabled={isLoading}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Login Status */}
          {loginMessage && (
            <div className={`mb-6 p-4 rounded-lg ${
              loginStatus === 'success' || loginStatus === 'logged_in' 
                ? 'bg-green-50 border border-green-200 text-green-800'
                : loginStatus === 'error'
                ? 'bg-red-50 border border-red-200 text-red-800'
                : 'bg-blue-50 border border-blue-200 text-blue-800'
            }`}>
              <div className="flex items-center">
                {loginStatus === 'success' || loginStatus === 'logged_in' ? (
                  <CheckCircle className="w-5 h-5 mr-2" />
                ) : loginStatus === 'error' ? (
                  <AlertCircle className="w-5 h-5 mr-2" />
                ) : (
                  <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                )}
                <span className="text-sm">{loginMessage}</span>
              </div>
            </div>
          )}
          
          <button
            onClick={handleLogin}
            disabled={isLoading || !loginEmail || !loginPassword}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 disabled:opacity-50 text-white font-medium py-3 px-4 rounded-xl transition-all duration-200 flex items-center justify-center"
          >
            {isLoading ? (
              <>
                <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                Logger inn...
              </>
            ) : (
              <>
                <Globe className="w-5 h-5 mr-2" />
                Logg inn til Office 365
              </>
            )}
          </button>
        </div>
      </div>
    );
  }

  // Main email settings application UI
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Page Header */}
      <div className="page-header">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="page-title">📧 Office 365 E-post Innstillinger</h1>
            <p className="page-subtitle">
              {activeAccount?.email || 'Microsoft-konto'} • Administrer e-postkonfigurasjon
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={loadEmailLogs}
              className="btn btn-secondary"
              title="E-postlogger"
            >
              <FileText className="w-4 h-4 mr-2" />
              E-postlogger
            </button>
            
            <div className="relative">
              <button className="btn btn-secondary">
                <User className="w-4 h-4 mr-2" />
                {activeAccount?.name || 'Konto'}
              </button>
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Logg ut</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="stats-section">
        <div className="stat-item">
          <div className="stat-number">{emailLogs.length}</div>
          <div className="stat-label">Totalt e-poster sendt</div>
        </div>
        <div className="stat-item">
          <div className="stat-number">{emailLogs.filter(log => log.status === 'sent').length}</div>
          <div className="stat-label">Vellykkede</div>
        </div>
        <div className="stat-item">
          <div className="stat-number">{emailLogs.filter(log => log.status === 'failed').length}</div>
          <div className="stat-label">Feilet</div>
        </div>
        <div className="stat-item">
          <div className="stat-number">{emailLogs.filter(log => log.status === 'pending').length}</div>
          <div className="stat-label">Venter</div>
        </div>
      </div>

      {/* Email Settings */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* SMTP Configuration */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">SMTP Konfigurasjon</h3>
            <p className="card-subtitle">Office 365 SMTP innstillinger</p>
          </div>
          <div className="card-content">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  SMTP Server
                </label>
                <input
                  type="text"
                  value={emailSettings.smtpHost}
                  onChange={(e) => setEmailSettings(prev => ({ ...prev, smtpHost: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Port
                </label>
                <input
                  type="number"
                  value={emailSettings.smtpPort}
                  onChange={(e) => setEmailSettings(prev => ({ ...prev, smtpPort: parseInt(e.target.value) }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Brukernavn (E-post)
                </label>
                <input
                  type="email"
                  value={emailSettings.smtpUser}
                  onChange={(e) => setEmailSettings(prev => ({ ...prev, smtpUser: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Passord
                </label>
                <input
                  type="password"
                  value={emailSettings.smtpPassword}
                  onChange={(e) => setEmailSettings(prev => ({ ...prev, smtpPassword: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="secure"
                  checked={emailSettings.secure}
                  onChange={(e) => setEmailSettings(prev => ({ ...prev, secure: e.target.checked }))}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="secure" className="ml-2 block text-sm text-gray-700">
                  Bruk SSL/TLS
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Sender Configuration */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Avsender Konfigurasjon</h3>
            <p className="card-subtitle">Hvordan e-poster vises</p>
          </div>
          <div className="card-content">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Avsender Navn
                </label>
                <input
                  type="text"
                  value={emailSettings.fromName}
                  onChange={(e) => setEmailSettings(prev => ({ ...prev, fromName: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Avsender E-post
                </label>
                <input
                  type="email"
                  value={emailSettings.fromEmail}
                  onChange={(e) => setEmailSettings(prev => ({ ...prev, fromEmail: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <button
                onClick={saveEmailSettings}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
              >
                <Save className="w-4 h-4 mr-2" />
                Lagre Innstillinger
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Email Test */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">E-post Test</h3>
          <p className="card-subtitle">Test e-posttilkoblingen</p>
        </div>
        <div className="card-content">
          <div className="flex items-end space-x-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Test E-postadresse
              </label>
              <input
                type="email"
                value={testEmailAddress}
                onChange={(e) => setTestEmailAddress(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="test@example.com"
              />
            </div>
            <button
              onClick={testEmailConnection}
              disabled={testStatus === 'testing' || !testEmailAddress}
              className="bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors flex items-center"
            >
              {testStatus === 'testing' ? (
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <TestTube className="w-4 h-4 mr-2" />
              )}
              Test E-post
            </button>
          </div>
          
          {testMessage && (
            <div className={`mt-4 p-4 rounded-lg ${
              testStatus === 'success' 
                ? 'bg-green-50 border border-green-200 text-green-800'
                : testStatus === 'error'
                ? 'bg-red-50 border border-red-200 text-red-800'
                : 'bg-blue-50 border border-blue-200 text-blue-800'
            }`}>
              <div className="flex items-center">
                {testStatus === 'success' ? (
                  <CheckCircle className="w-5 h-5 mr-2" />
                ) : testStatus === 'error' ? (
                  <AlertCircle className="w-5 h-5 mr-2" />
                ) : (
                  <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                )}
                <span className="text-sm">{testMessage}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Email Logs Modal */}
      {showEmailLogs && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[80vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b">
              <h3 className="text-lg font-semibold">E-postlogger</h3>
              <button
                onClick={() => setShowEmailLogs(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              {emailLogs.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>Ingen e-postlogger funnet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {emailLogs.map((log) => (
                    <div key={log.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            log.status === 'sent' ? 'bg-green-100 text-green-800' :
                            log.status === 'failed' ? 'bg-red-100 text-red-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {log.status === 'sent' ? 'Sendt' : log.status === 'failed' ? 'Feilet' : 'Venter'}
                          </span>
                          <span className="text-sm font-medium">{log.to}</span>
                        </div>
                        <span className="text-sm text-gray-500">{log.timestamp}</span>
                      </div>
                      <p className="text-sm text-gray-700 mb-1">{log.subject}</p>
                      {log.error && (
                        <p className="text-sm text-red-600">{log.error}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
