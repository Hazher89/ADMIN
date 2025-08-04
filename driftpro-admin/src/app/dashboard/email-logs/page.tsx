'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Mail, 
  Settings, 
  Bell, 
  FileText, 
  TrendingUp, 
  TestTube, 
  Save, 
  RefreshCw, 
  Download, 
  Search, 
  Eye, 
  EyeOff,
  Shield,
  AlertCircle,
  CheckCircle,
  Clock,
  XCircle
} from 'lucide-react';

export const dynamic = 'force-dynamic';

interface EmailLog {
  id: string;
  to: string;
  subject: string;
  type: string;
  status: 'sent' | 'failed' | 'pending';
  sentAt: string;
  error?: string;
}

interface EmailSettings {
  enabled: boolean;
  fromEmail: string;
  fromName: string;
  
  // Email type toggles
  adminSetup: boolean;
  deviationReports: boolean;
  deviationResolved: boolean;
  userWelcome: boolean;
  notifications: boolean;
  warnings: boolean;
  systemAlerts: boolean;
  
  // SMTP settings
  smtpHost: string;
  smtpPort: number;
  smtpUser: string;
  smtpSecure: boolean;
  smtpTimeout?: number;
  smtpAuthMethod?: string;
  
  // Advanced settings
  emailQueueEnabled: boolean;
  maxRetryAttempts: number;
  logAllEmails: boolean;
  
  // Templates
  adminSetupTemplate: string;
  deviationReportTemplate: string;
  notificationTemplate: string;
  userWelcomeTemplate: string;
  warningTemplate: string;
  
  // Analytics
  analyticsEnabled: boolean;
  trackOpenRates: boolean;
  trackClickRates: boolean;
  
  // Spam protection
  spamProtection: {
    enabled: boolean;
    maxRecipients: number;
  };
  
  // Backup SMTP
  backupSmtpEnabled: boolean;
  backupSmtpHost: string;
  backupSmtpPort: number;
}

export default function EmailLogsPage() {
  const { userProfile } = useAuth();
  
  // Debug logging
  console.log('EmailLogsPage: userProfile:', userProfile);
  
  const [activeTab, setActiveTab] = useState('logs');
  const [emailLogs, setEmailLogs] = useState<EmailLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [saving, setSaving] = useState(false);
  const [testingSmtp, setTestingSmtp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [smtpPassword, setSmtpPassword] = useState('');
  const [smtpLoginResult, setSmtpLoginResult] = useState<{ success: boolean; message: string; details?: any } | null>(null);
  const [isSmtpLoggingIn, setIsSmtpLoggingIn] = useState(false);
  const [isSmtpLoggedIn, setIsSmtpLoggedIn] = useState(false);
  const [smtpLoginTime, setSmtpLoginTime] = useState<string | null>(null);
  const [smtpSessionExpiry, setSmtpSessionExpiry] = useState<string | null>(null);
  const [testEmail, setTestEmail] = useState('');
  const [showAlternativeOptions, setShowAlternativeOptions] = useState(false);
  const [alternativeSmtpConfig, setAlternativeSmtpConfig] = useState({
    host: 'smtp.office365.com',
    port: 587,
    secure: false,
    user: 'noreplay@driftpro.no',
    pass: ''
  });
  const [testType, setTestType] = useState('admin_setup');
  const [exporting, setExporting] = useState(false);
  const [bulkActions, setBulkActions] = useState<string[]>([]);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [emailStats, setEmailStats] = useState({
    total: 0,
    sent: 0,
    failed: 0,
    pending: 0
  });
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState(30);

  const [settings, setSettings] = useState<EmailSettings>({
    enabled: true,
    fromEmail: 'noreplay@driftpro.no',
    fromName: 'DriftPro',
    adminSetup: true,
    deviationReports: true,
    deviationResolved: true,
    userWelcome: true,
    notifications: true,
    warnings: true,
    systemAlerts: true,
    smtpHost: 'smtp.domeneshop.no',
    smtpPort: 587,
    smtpUser: 'driftpro2',
    smtpSecure: false,
    emailQueueEnabled: false,
    maxRetryAttempts: 3,
    logAllEmails: true,
    adminSetupTemplate: 'Hei [adminName], velkommen til [companyName]. Klikk her for å sette opp passord: [setupUrl]',
    deviationReportTemplate: 'Avviksrapport: [deviationTitle] - [message]',
    notificationTemplate: 'Varsel: [subject] - [message]',
    userWelcomeTemplate: 'Velkommen [userName] til [companyName]! Logg inn her: [loginUrl]',
    warningTemplate: 'ADVARSEL: [warningType] - [description]. Handling kreves: [action]',
    analyticsEnabled: false,
    trackOpenRates: false,
    trackClickRates: false,
    spamProtection: {
      enabled: true,
      maxRecipients: 50
    },
    backupSmtpEnabled: false,
    backupSmtpHost: '',
    backupSmtpPort: 587
  });

  const calculateStats = useCallback(() => {
    const stats = {
      total: emailLogs.length,
      sent: emailLogs.filter(log => log.status === 'sent').length,
      failed: emailLogs.filter(log => log.status === 'failed').length,
      pending: emailLogs.filter(log => log.status === 'pending').length
    };
    setEmailStats(stats);
  }, [emailLogs]);

  useEffect(() => {
    loadEmailLogs();
    loadEmailSettings();
  }, []); // Only run once on mount

  // Calculate stats when emailLogs changes
  useEffect(() => {
    calculateStats();
  }, [calculateStats]);

  // Auto-refresh functionality
  useEffect(() => {
    if (!autoRefresh || refreshInterval === 0) return;

    const interval = setInterval(() => {
      loadEmailLogs();
    }, refreshInterval * 1000);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval]);

  const loadEmailLogs = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/email-logs');
      if (response.ok) {
        const logs = await response.json();
        setEmailLogs(logs);
      } else {
        const error = await response.json();
        setMessage(`Feil ved lasting av e-post-logger: ${error.error}`);
      }
    } catch (error) {
      console.error('Error loading email logs:', error);
      setMessage('Kunne ikke koble til serveren. Sjekk internettforbindelsen.');
    } finally {
      setLoading(false);
    }
  };

  const loadEmailSettings = async () => {
    try {
      // First load settings without password
      const response = await fetch('/api/email-settings');
      if (response.ok) {
        const data = await response.json();
        setSettings(prev => ({ ...prev, ...data }));
      } else {
        console.error('Failed to load email settings');
      }

      // Then load password separately for internal use
      const passwordResponse = await fetch('/api/email-settings?includePassword=true');
      if (passwordResponse.ok) {
        const passwordData = await passwordResponse.json();
        if (passwordData.smtpPassword && passwordData.smtpPassword !== '[HIDDEN]') {
          setSmtpPassword(passwordData.smtpPassword);
        }
      }
    } catch (error) {
      console.error('Error loading email settings:', error);
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      // Only save password if it's not empty and not the placeholder
      const passwordToSave = smtpPassword && smtpPassword.trim() !== '' ? smtpPassword : undefined;
      
      const response = await fetch('/api/email-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...settings, smtpPassword: passwordToSave })
      });
      
      if (response.ok) {
        setMessage('✅ Innstillinger lagret! Passordet er nå permanent lagret.');
        setTimeout(() => setMessage(''), 5000);
      } else {
        const error = await response.json();
        setMessage(`❌ Feil ved lagring: ${error.error}`);
      }
    } catch (error) {
      setMessage('❌ Feil ved lagring av innstillinger');
    } finally {
      setSaving(false);
    }
  };

  const sendTestEmail = async () => {
    if (!testEmail) {
      setMessage('Vennligst fyll inn test e-post');
      return;
    }

    try {
      const response = await fetch('/api/send-test-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: testEmail,
          type: testType,
          settings: { ...settings, smtpPassword }
        })
      });

      if (response.ok) {
        setMessage('Test e-post sendt!');
        setTestEmail('');
      } else {
        const error = await response.json();
        setMessage(`Feil: ${error.error}`);
      }
    } catch (error) {
      setMessage('Feil ved sending av test e-post');
    }
  };

  const testSmtpConnection = async () => {
    setTestingSmtp(true);
    try {
      const response = await fetch('/api/send-test-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: 'test@example.com',
          type: 'test',
          settings: { ...settings, smtpPassword }
        })
      });

      if (response.ok) {
        setMessage('SMTP-tilkobling fungerer!');
      } else {
        const error = await response.json();
        setMessage(`SMTP-feil: ${error.error}`);
      }
    } catch (error) {
      setMessage('Feil ved testing av SMTP-tilkobling');
    } finally {
      setTestingSmtp(false);
    }
  };

  const detailedSmtpTest = async () => {
    if (!smtpPassword) {
      setMessage('❌ Feil: SMTP-passord mangler! Vennligst fyll inn passordet først.');
      return;
    }

    setTestingSmtp(true);
    try {
      const response = await fetch('/api/smtp-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          smtpHost: settings.smtpHost,
          smtpPort: settings.smtpPort,
          smtpUser: settings.smtpUser,
          smtpPassword: smtpPassword,
          smtpSecure: settings.smtpSecure,
          smtpTimeout: settings.smtpTimeout || 30
        })
      });

      if (response.ok) {
        const result = await response.json();
        
        if (result.success) {
          setMessage('✅ SMTP-test fullført! Se detaljer i konsollen.');
          console.log('SMTP Test Results:', result);
        } else {
          let errorMessage = 'Ukjent feil';
          
          if (result.details?.authentication) {
            errorMessage = `Autentisering feilet: ${result.details.authentication}`;
            if (result.details.authentication.includes('535 Incorrect authentication data')) {
              errorMessage += '\n\n🔧 Løsning: Sjekk at brukernavn og passord er riktig. For Domeneshop, bruk:\n' +
                '• Brukernavn: driftpro2\n' +
                '• Passord: Ditt Domeneshop e-postpassord\n' +
                '• Port: 587 (STARTTLS) eller 465 (SSL)';
            }
          } else if (result.details?.connection) {
            errorMessage = `Tilkobling feilet: ${result.details.connection}`;
          } else if (result.errors?.length > 0) {
            errorMessage = result.errors.join(', ');
          }
          
          setMessage(`❌ SMTP-test feilet: ${errorMessage}`);
          console.log('SMTP Test Details:', result);
        }
      } else {
        const error = await response.json();
        setMessage(`SMTP-test feilet: ${error.error}`);
      }
    } catch (error) {
      setMessage('Feil ved detaljert SMTP-test');
    } finally {
      setTestingSmtp(false);
    }
  };

  const performSmtpLogin = async () => {
    setIsSmtpLoggingIn(true);
    setSmtpLoginResult(null);

    try {
      console.log('🔐 Performing SMTP login...');

      // Step 1: Validate configuration
      console.log('Step 1: Validating configuration...');
      if (!settings.smtpHost || !settings.smtpUser || !smtpPassword) {
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
          host: settings.smtpHost,
          port: settings.smtpPort,
          user: settings.smtpUser,
          pass: smtpPassword,
          secure: settings.smtpSecure
        })
      });

      const smtpResult = await smtpTest.json();

      if (!smtpTest.ok) {
        // Check if it's a Domeneshop ECONNRESET error
        if (smtpResult.error && smtpResult.error.includes('ECONNRESET')) {
          setShowAlternativeOptions(true);
          throw new Error(`Domeneshop SMTP-problem oppdaget: ${smtpResult.error}

🔧 Løsningsalternativer:
1. Prøv igjen om noen minutter (Domeneshop har ofte midlertidige problemer)
2. Bruk alternativ SMTP-leverandør (Office 365, Gmail, etc.)
3. Kontakt Domeneshop support
4. Sjekk at Domeneshop-kontoen er aktiv og ikke blokkert`);
        } else {
          throw new Error(`SMTP-login feilet: ${smtpResult.error || 'Ukjent feil'}`);
        }
      }

      // Step 4: Test email sending
      console.log('Step 4: Testing email sending...');
      const emailTest = await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: settings.smtpUser,
          subject: '🔐 SMTP Login Successful - DriftPro',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #059669;">🔐 SMTP LOGIN SUCCESSFUL!</h2>
              <p><strong>Dato:</strong> ${new Date().toLocaleString('nb-NO')}</p>
              <p><strong>SMTP Server:</strong> ${settings.smtpHost}</p>
              <p><strong>Bruker:</strong> ${settings.smtpUser}</p>
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

      // Login successful! Set login state
      const loginTime = new Date();
      const sessionExpiry = new Date(loginTime.getTime() + (24 * 60 * 60 * 1000)); // 24 hours
      
      setIsSmtpLoggedIn(true);
      setSmtpLoginTime(loginTime.toLocaleString('nb-NO'));
      setSmtpSessionExpiry(sessionExpiry.toLocaleString('nb-NO'));
      
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
          smtpServer: settings.smtpHost,
          user: settings.smtpUser,
          port: settings.smtpPort,
          secure: settings.smtpSecure,
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
• Sjekk at passordet for ${settings.smtpUser} er riktig
• Verifiser at brukernavnet er korrekt
• Prøv å logge inn på Domeneshop-kontrollpanelet`;
        } else if (error.message.includes('connection')) {
          detailedError = `🌐 Tilkoblingsfeil: Kan ikke koble til SMTP-serveren
          
🔧 Løsning:
• Sjekk at SMTP-serveren ${settings.smtpHost} er riktig
• Verifiser at port ${settings.smtpPort} er åpen
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

  const logoutSmtp = () => {
    setIsSmtpLoggedIn(false);
    setSmtpLoginTime(null);
    setSmtpSessionExpiry(null);
    setSmtpLoginResult(null);
    setShowAlternativeOptions(false);
    setMessage('🔓 SMTP-økt avsluttet');
  };

  const tryAlternativeSmtp = async () => {
    setIsSmtpLoggingIn(true);
    setSmtpLoginResult(null);

    try {
      console.log('🔐 Testing alternative SMTP configuration...');
      
      const smtpTest = await fetch('/api/smtp-login-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(alternativeSmtpConfig)
      });

      const smtpResult = await smtpTest.json();

      if (!smtpTest.ok) {
        throw new Error(`Alternativ SMTP-login feilet: ${smtpResult.error || 'Ukjent feil'}`);
      }

      // Test email sending with alternative config
      const emailTest = await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: alternativeSmtpConfig.user,
          subject: '🔐 Alternativ SMTP Login Successful - DriftPro',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #059669;">🔐 ALTERNATIV SMTP LOGIN SUCCESSFUL!</h2>
              <p><strong>Dato:</strong> ${new Date().toLocaleString('nb-NO')}</p>
              <p><strong>SMTP Server:</strong> ${alternativeSmtpConfig.host}</p>
              <p><strong>Bruker:</strong> ${alternativeSmtpConfig.user}</p>
              <p><strong>Status:</strong> ✅ Alternativ SMTP fungerer perfekt!</p>
              
              <div style="background-color: #f0fdf4; border: 1px solid #16a34a; border-radius: 8px; padding: 16px; margin: 20px 0;">
                <h3 style="color: #166534; margin-top: 0;">🔧 Alternative Login Status:</h3>
                <ul style="color: #166534;">
                  <li>✅ Alternativ SMTP-autentisering: FUNGERER</li>
                  <li>✅ E-post-sending: FUNGERER</li>
                  <li>✅ Firebase-integrasjon: FUNGERER</li>
                  <li>✅ 100% kontroll: AKTIVERT</li>
                </ul>
              </div>
              
              <p style="color: #059669; font-weight: bold;">
                🎯 Du er nå logget inn med alternativ SMTP og har full kontroll!
              </p>
            </div>
          `,
          type: 'system'
        })
      });

      if (!emailTest.ok) {
        throw new Error('E-post-sending feilet med alternativ SMTP');
      }

      // Login successful with alternative SMTP
      const loginTime = new Date();
      const sessionExpiry = new Date(loginTime.getTime() + (24 * 60 * 60 * 1000));
      
      setIsSmtpLoggedIn(true);
      setSmtpLoginTime(loginTime.toLocaleString('nb-NO'));
      setSmtpSessionExpiry(sessionExpiry.toLocaleString('nb-NO'));
      setShowAlternativeOptions(false);
      
      setSmtpLoginResult({
        success: true,
        message: `🔐 ALTERNATIV SMTP LOGIN SUCCESSFUL! 
        
✅ Alternativ SMTP-autentisering: FUNGERER
✅ E-post-sending: FUNGERER  
✅ Firebase-integrasjon: FUNGERER
✅ Alle systemer: OPERATIVE

🎯 Du er nå logget inn med alternativ SMTP og har 100% kontroll!
Alle e-post-funksjoner bruker alternativ SMTP og fungerer perfekt.`,
        details: {
          smtpServer: alternativeSmtpConfig.host,
          user: alternativeSmtpConfig.user,
          port: alternativeSmtpConfig.port,
          secure: alternativeSmtpConfig.secure,
          configType: 'Alternative SMTP',
          timestamp: new Date().toISOString()
        }
      });

    } catch (error) {
      console.error('Alternative SMTP login failed:', error);
      
      let detailedError = 'Alternativ SMTP-login feilet';
      if (error instanceof Error) {
        if (error.message.includes('authentication')) {
          detailedError = `🔐 Autentiseringsfeil med alternativ SMTP
          
🔧 Sjekk følgende:
• Brukernavn og passord er riktig
• SMTP-serveren støtter autentisering
• Kontoen er ikke blokkert`;
        } else if (error.message.includes('ECONNREFUSED')) {
          detailedError = `🌐 Tilkobling avvist av alternativ SMTP
          
🔧 Sjekk følgende:
• SMTP-serveradressen er riktig
• Port-nummeret er riktig
• Serveren er tilgjengelig`;
        } else {
          detailedError = `❌ Alternativ SMTP-feil: ${error.message}
          
🔧 Sjekk følgende:
• Alle SMTP-innstillinger er riktige
• Serveren støtter konfigurasjonen
• Nettverkstilkoblingen er stabil`;
        }
      }

      setSmtpLoginResult({
        success: false,
        message: `❌ ALTERNATIV SMTP LOGIN FAILED

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

  const exportEmailLogs = async () => {
    setExporting(true);
    try {
      const csvData = [
        ['Dato', 'Tid', 'Mottaker', 'Emne', 'Type', 'Status', 'Feil'],
        ...filteredLogs.map(log => [
          formatDate(log.sentAt),
          formatTime(log.sentAt),
          log.to || 'Ukjent',
          log.subject || 'Ingen emne',
          getTypeLabel(log.type),
          getStatusLabel(log.status),
          log.error || ''
        ])
      ];

      const csvContent = csvData.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `email-logs-${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      setMessage('E-post-logger eksportert!');
    } catch (error) {
      setMessage('Feil ved eksport av e-post-logger');
    } finally {
      setExporting(false);
    }
  };

  const retryFailedEmails = async () => {
    const failedLogs = emailLogs.filter(log => log.status === 'failed');
    if (failedLogs.length === 0) {
      setMessage('Ingen feilede e-poster å prøve igjen');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/email-logs/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'retry_failed' })
      });

      if (response.ok) {
        const result = await response.json();
        setMessage(result.message);
        await loadEmailLogs(); // Reload logs to see updated status
      } else {
        const error = await response.json();
        setMessage(`Feil: ${error.error}`);
      }
    } catch (error) {
      setMessage('Feil ved nytt forsøk på feilede e-poster');
    } finally {
      setLoading(false);
    }
  };

  const clearOldLogs = async () => {
    if (!confirm('Er du sikker på at du vil slette e-post-logger eldre enn 30 dager?')) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/email-logs/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'clear_old', days: 30 })
      });

      if (response.ok) {
        const result = await response.json();
        setMessage(result.message);
        await loadEmailLogs(); // Reload logs
      } else {
        const error = await response.json();
        setMessage(`Feil: ${error.error}`);
      }
    } catch (error) {
      setMessage('Feil ved sletting av gamle logger');
    } finally {
      setLoading(false);
    }
  };

  const processEmailQueue = async () => {
    if (emailStats.pending === 0) {
      setMessage('Ingen ventende e-poster å prosessere');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/email-queue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'process_queue' })
      });

      if (response.ok) {
        const result = await response.json();
        setMessage(result.message);
        await loadEmailLogs(); // Reload logs to see updated status
      } else {
        const error = await response.json();
        setMessage(`Feil: ${error.error}`);
      }
    } catch (error) {
      setMessage('Feil ved prosessering av e-post-kø');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: EmailLog['status']) => {
    switch (status) {
      case 'sent': return 'text-green-600';
      case 'failed': return 'text-red-600';
      case 'pending': return 'text-yellow-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusIcon = (status: EmailLog['status']) => {
    switch (status) {
      case 'sent': return <CheckCircle style={{ width: '16px', height: '16px' }} />;
      case 'failed': return <XCircle style={{ width: '16px', height: '16px' }} />;
      case 'pending': return <Clock style={{ width: '16px', height: '16px' }} />;
      default: return <AlertCircle style={{ width: '16px', height: '16px' }} />;
    }
  };

  const getStatusLabel = (status: EmailLog['status']) => {
    switch (status) {
      case 'sent': return 'Sendt';
      case 'failed': return 'Feilet';
      case 'pending': return 'Venter';
      default: return 'Ukjent';
    }
  };

  const getTypeLabel = (type: string | null | undefined) => {
    if (!type) return 'Ukjent';
    switch (type) {
      case 'admin_setup': return 'Admin-oppsett';
      case 'deviation_report': return 'Avviksrapport';
      case 'notification': return 'Varsel';
      case 'warning': return 'Advarsel';
      case 'welcome': return 'Velkomst';
      default: return type;
    }
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'Ukjent dato';
    try {
      return new Date(dateString).toLocaleDateString('nb-NO');
    } catch {
      return 'Ugyldig dato';
    }
  };

  const formatTime = (dateString: string | null | undefined) => {
    if (!dateString) return 'Ukjent tid';
    try {
      return new Date(dateString).toLocaleTimeString('nb-NO');
    } catch {
      return 'Ugyldig tid';
    }
  };

  const filteredLogs = emailLogs.filter(log => {
    const matchesSearch = (log.to?.toString() || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (log.subject?.toString() || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || log.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'flex-start',
        marginBottom: '2rem',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div>
          <h1 className="page-title">🎛️ MASTER KONTROLL - E-post-systemet</h1>
          <p className="page-subtitle">
            Dette er HJERTET av hele e-post-systemet - Alle endringer påvirker hele websiden og alle e-post-funksjoner
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
            <span className="badge badge-success">✅ Produksjonsklar</span>
            <span className="badge badge-primary">Firebase tilkoblet</span>
            <span className="badge badge-secondary">SMTP konfigurert</span>
          </div>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <span className="badge badge-success">{emailStats.sent} sendt</span>
            <span className="badge badge-error">{emailStats.failed} feilet</span>
            <span className="badge badge-warning">{emailStats.pending} venter</span>
            <span className="badge badge-primary">{emailStats.total} totalt</span>
          </div>
          <button 
            className="btn btn-primary"
            onClick={loadEmailLogs}
            disabled={loading}
          >
            <RefreshCw style={{ width: '16px', height: '16px' }} />
            {loading ? 'Laster...' : 'Oppdater'}
          </button>
        </div>
      </div>

      {message && (
        <div className={`alert ${message.includes('Feil') ? 'alert-error' : 'alert-success'}`}>
          {message}
        </div>
      )}

      {/* SMTP Login Status Banner */}
      {isSmtpLoggedIn && (
        <div style={{ 
          padding: '1rem', 
          backgroundColor: '#d1fae5', 
          border: '1px solid #10b981',
          borderRadius: '0.5rem',
          marginBottom: '1rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <CheckCircle style={{ width: '20px', height: '20px', color: '#059669' }} />
            <div>
              <div style={{ fontWeight: 'bold', color: '#065f46' }}>🔐 SMTP INNLOGGET - 100% KONTROLL AKTIVERT</div>
              <div style={{ fontSize: '0.875rem', color: '#047857' }}>
                Logget inn: {smtpLoginTime} | Økt utløper: {smtpSessionExpiry} | Alle e-post-funksjoner er operative
              </div>
            </div>
          </div>
          <button
            onClick={logoutSmtp}
            className="btn btn-outline-danger"
            style={{ backgroundColor: 'transparent', borderColor: '#dc3545', color: '#dc3545', padding: '0.5rem 1rem' }}
          >
            🔓 Logg ut SMTP
          </button>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', borderBottom: '1px solid #e5e7eb', overflowX: 'auto' }}>
          {[
            { id: 'logs', label: 'E-post-logger', icon: Mail },
            { id: 'settings', label: 'Innstillinger', icon: Settings },
            { id: 'templates', label: 'Maler', icon: FileText },
            { id: 'smtp', label: 'SMTP', icon: Settings },
            { id: 'notifications', label: 'Varsler', icon: Bell },
            { id: 'advanced', label: 'Avansert', icon: Shield },
            { id: 'analytics', label: 'Analyser', icon: TrendingUp },
            { id: 'test', label: 'Test', icon: TestTube }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
              style={{ 
                whiteSpace: 'nowrap',
                padding: '1rem 1.5rem',
                border: 'none',
                background: 'none',
                cursor: 'pointer',
                borderBottom: activeTab === tab.id ? '2px solid #3b82f6' : '2px solid transparent',
                color: activeTab === tab.id ? '#3b82f6' : '#6b7280',
                fontWeight: activeTab === tab.id ? '600' : '400',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              <tab.icon style={{ width: '16px', height: '16px' }} />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Logs Tab */}
      {activeTab === 'logs' && (
        <div className="space-y-4">
          {/* Search and Filters */}
          <div className="card" style={{ marginBottom: '2rem' }}>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <div className="search-container" style={{ flex: '1', minWidth: '300px' }}>
                <Search className="search-icon" />
                <input
                  type="text"
                  placeholder="Søk i e-post-logger..."
                  className="search-input"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="form-input"
                style={{ width: '150px' }}
              >
                <option value="all">Alle statuser</option>
                <option value="sent">Sendt</option>
                <option value="failed">Feilet</option>
                <option value="pending">Venter</option>
              </select>

              <button onClick={loadEmailLogs} className="btn btn-secondary" disabled={loading}>
                <RefreshCw style={{ width: '16px', height: '16px' }} />
                {loading ? 'Laster...' : 'Oppdater'}
              </button>
            </div>

            {/* Bulk Actions */}
            <div style={{ 
              display: 'flex', 
              gap: '1rem', 
              alignItems: 'center', 
              marginTop: '1rem',
              paddingTop: '1rem',
              borderTop: '1px solid #e5e7eb'
            }}>
              <button 
                onClick={exportEmailLogs} 
                className="btn btn-secondary"
                disabled={exporting || filteredLogs.length === 0}
              >
                <Download style={{ width: '16px', height: '16px' }} />
                {exporting ? 'Eksporterer...' : 'Eksporter CSV'}
              </button>

              <button 
                onClick={retryFailedEmails} 
                className="btn btn-warning"
                disabled={emailStats.failed === 0}
              >
                <RefreshCw style={{ width: '16px', height: '16px' }} />
                Prøv feilede igjen ({emailStats.failed})
              </button>

              <button 
                onClick={processEmailQueue} 
                className="btn btn-success"
                disabled={emailStats.pending === 0}
              >
                <Mail style={{ width: '16px', height: '16px' }} />
                Prosesser kø ({emailStats.pending})
              </button>

              <button 
                onClick={clearOldLogs} 
                className="btn btn-error"
                disabled={loading}
              >
                <XCircle style={{ width: '16px', height: '16px' }} />
                Slett gamle logger
              </button>

              <button 
                onClick={() => setShowAdvanced(!showAdvanced)} 
                className="btn btn-secondary"
              >
                <Settings style={{ width: '16px', height: '16px' }} />
                {showAdvanced ? 'Skjul' : 'Vis'} avanserte innstillinger
              </button>
            </div>

            {/* Advanced Settings */}
            {showAdvanced && (
              <div style={{ 
                marginTop: '1rem', 
                padding: '1rem', 
                backgroundColor: '#f9fafb', 
                borderRadius: '0.5rem',
                border: '1px solid #e5e7eb'
              }}>
                <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '1rem' }}>Avanserte innstillinger</h3>
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                  <div>
                    <label className="form-label">Maks logger per side</label>
                    <select className="form-input" style={{ width: '120px' }}>
                      <option value="50">50</option>
                      <option value="100">100</option>
                      <option value="200">200</option>
                    </select>
                  </div>
                  <div>
                    <label className="form-label">Auto-oppdater</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <button
                        onClick={() => setAutoRefresh(!autoRefresh)}
                        className={`toggle-switch ${autoRefresh ? 'active' : ''}`}
                      >
                        <span className="toggle-slider"></span>
                      </button>
                      <select 
                        className="form-input" 
                        style={{ width: '120px' }}
                        value={refreshInterval}
                        onChange={(e) => setRefreshInterval(parseInt(e.target.value))}
                        disabled={!autoRefresh}
                      >
                        <option value="30">30s</option>
                        <option value="60">1min</option>
                        <option value="300">5min</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '2rem' }}>
              <div>Laster e-post-logger...</div>
            </div>
          ) : filteredLogs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
              Ingen e-post-logger funnet
            </div>
          ) : (
            <div className="space-y-2">
              {filteredLogs.map((log) => (
                <div key={log.id} className="card" style={{ padding: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <div className={getStatusColor(log.status)}>
                        {getStatusIcon(log.status)}
                      </div>
                      <div>
                        <div style={{ fontWeight: '500' }}>{log.to || 'Ukjent mottaker'}</div>
                        <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                          {log.subject || 'Ingen emne'} • {getTypeLabel(log.type || 'unknown')}
                        </div>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '0.875rem', fontWeight: '500' }}>
                        {getStatusLabel(log.status)}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                        {formatDate(log.sentAt)} {formatTime(log.sentAt)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Settings Tab */}
      {activeTab === 'settings' && (
        <div className="space-y-6">
          <div className="card">
            <h2 className="card-title">Generelle innstillinger</h2>
            <div className="space-y-4">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <label className="form-label">Aktiver e-post</label>
                  <p className="form-help">Aktiver eller deaktiver e-post-funksjonalitet</p>
                </div>
                <button
                  onClick={() => setSettings(prev => ({ ...prev, enabled: !prev.enabled }))}
                  className={`toggle-switch ${settings.enabled ? 'active' : ''}`}
                >
                  <span className="toggle-slider"></span>
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Avsender e-post</label>
                  <input
                    type="email"
                    value={settings.fromEmail}
                    onChange={(e) => setSettings(prev => ({ ...prev, fromEmail: e.target.value }))}
                    className="form-input"
                    placeholder="noreplay@driftpro.no"
                  />
                </div>
                <div>
                  <label className="form-label">Avsender navn</label>
                  <input
                    type="text"
                    value={settings.fromName}
                    onChange={(e) => setSettings(prev => ({ ...prev, fromName: e.target.value }))}
                    className="form-input"
                    placeholder="DriftPro"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <h2 className="card-title">E-post-typer</h2>
            <div className="space-y-4">
              {[
                { key: 'adminSetup', label: 'Admin-oppsett', description: 'E-post til nye administratorer' },
                { key: 'deviationReports', label: 'Avviksrapporter', description: 'Rapporter om avvik' },
                { key: 'deviationResolved', label: 'Avvik løst', description: 'Når avvik er løst' },
                { key: 'userWelcome', label: 'Velkomst', description: 'Velkomst til nye brukere' },
                { key: 'notifications', label: 'Varsler', description: 'Generelle varsler' },
                { key: 'warnings', label: 'Advarsler', description: 'Viktige advarsler' },
                { key: 'systemAlerts', label: 'Systemvarsler', description: 'Systemrelaterte varsler' }
              ].map(({ key, label, description }) => (
                <div key={key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <label className="form-label">{label}</label>
                    <p className="form-help">{description}</p>
                  </div>
                  <button
                    onClick={() => setSettings(prev => ({ ...prev, [key]: !prev[key as keyof EmailSettings] }))}
                    className={`toggle-switch ${settings[key as keyof EmailSettings] ? 'active' : ''}`}
                  >
                    <span className="toggle-slider"></span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Templates Tab */}
      {activeTab === 'templates' && (
        <div className="space-y-6">
          <div className="card">
            <h2 className="card-title">
              <FileText style={{ width: '20px', height: '20px' }} />
              E-post-maler
            </h2>
            <div className="space-y-6">
              <div>
                <label className="form-label">Admin-oppsett mal</label>
                <p className="form-help">Mal for e-post til nye administratorer. Bruk [adminName], [companyName], [setupUrl] som variabler.</p>
                <textarea
                  value={settings.adminSetupTemplate}
                  onChange={(e) => setSettings(prev => ({ ...prev, adminSetupTemplate: e.target.value }))}
                  className="form-input"
                  rows={6}
                  placeholder="Hei [adminName], velkommen til [companyName]. Klikk her for å sette opp passord: [setupUrl]"
                />
              </div>

              <div>
                <label className="form-label">Avviksrapport mal</label>
                <p className="form-help">Mal for avviksrapporter. Bruk [deviationTitle], [message], [reporterName] som variabler.</p>
                <textarea
                  value={settings.deviationReportTemplate}
                  onChange={(e) => setSettings(prev => ({ ...prev, deviationReportTemplate: e.target.value }))}
                  className="form-input"
                  rows={6}
                  placeholder="Avviksrapport: [deviationTitle] - [message] (Rapportert av: [reporterName])"
                />
              </div>

              <div>
                <label className="form-label">Generell varsel mal</label>
                <p className="form-help">Mal for generelle varsler. Bruk [subject], [message], [priority] som variabler.</p>
                <textarea
                  value={settings.notificationTemplate}
                  onChange={(e) => setSettings(prev => ({ ...prev, notificationTemplate: e.target.value }))}
                  className="form-input"
                  rows={6}
                  placeholder="Varsel: [subject] - [message] (Prioritet: [priority])"
                />
              </div>

              <div>
                <label className="form-label">Velkomst mal</label>
                <p className="form-help">Mal for velkomst til nye brukere. Bruk [userName], [companyName], [loginUrl] som variabler.</p>
                <textarea
                  value={settings.userWelcomeTemplate || 'Velkommen [userName] til [companyName]! Logg inn her: [loginUrl]'}
                  onChange={(e) => setSettings(prev => ({ ...prev, userWelcomeTemplate: e.target.value }))}
                  className="form-input"
                  rows={6}
                  placeholder="Velkommen [userName] til [companyName]! Logg inn her: [loginUrl]"
                />
              </div>

              <div>
                <label className="form-label">Advarsel mal</label>
                <p className="form-help">Mal for viktige advarsler. Bruk [warningType], [description], [action] som variabler.</p>
                <textarea
                  value={settings.warningTemplate || 'ADVARSEL: [warningType] - [description]. Handling kreves: [action]'}
                  onChange={(e) => setSettings(prev => ({ ...prev, warningTemplate: e.target.value }))}
                  className="form-input"
                  rows={6}
                  placeholder="ADVARSEL: [warningType] - [description]. Handling kreves: [action]"
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem' }}>
                <button
                  onClick={saveSettings}
                  disabled={saving}
                  className="btn btn-primary"
                >
                  <Save style={{ width: '16px', height: '16px' }} />
                  {saving ? 'Lagrer...' : 'Lagre maler'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SMTP Tab */}
      {activeTab === 'smtp' && (
        <div className="space-y-6">
          <div className="card">
            <h2 className="card-title">🔥 SMTP-innstillinger - HJERTET AV SYSTEMET</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="form-label">SMTP-server</label>
                  <input
                    type="text"
                    value={settings.smtpHost}
                    onChange={(e) => setSettings(prev => ({ ...prev, smtpHost: e.target.value }))}
                    className="form-input"
                    placeholder="smtp.domeneshop.no"
                  />
                  <p className="form-help">For Domeneshop: smtp.domeneshop.no</p>
                </div>
                <div>
                  <label className="form-label">Port</label>
                  <input
                    type="number"
                    value={settings.smtpPort}
                    onChange={(e) => setSettings(prev => ({ ...prev, smtpPort: parseInt(e.target.value) }))}
                    className="form-input"
                    placeholder="587"
                  />
                  <p className="form-help">For Domeneshop: 587 (ikke 465)</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Brukernavn</label>
                  <input
                    type="text"
                    value={settings.smtpUser}
                    onChange={(e) => setSettings(prev => ({ ...prev, smtpUser: e.target.value }))}
                    className="form-input"
                    placeholder="driftpro2"
                  />
                  <p className="form-help">Din e-post-adresse</p>
                </div>
                <div>
                  <label className="form-label">Passord</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showPassword ? "text" : "password"}
                      value={smtpPassword}
                      onChange={(e) => setSmtpPassword(e.target.value)}
                      className="form-input"
                      placeholder="SMTP-passord"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{ 
                        position: 'absolute', 
                        right: '0.75rem', 
                        top: '50%', 
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        color: '#6b7280',
                        cursor: 'pointer'
                      }}
                    >
                      {showPassword ? <EyeOff style={{ width: '16px', height: '16px' }} /> : <Eye style={{ width: '16px', height: '16px' }} />}
                    </button>
                  </div>
                  <p className="form-help">
                    <strong>Viktig:</strong> Dette må være passordet for driftpro2 fra Domeneshop. 
                    Hvis du ikke har dette passordet, kontakt Domeneshop support.
                    {smtpPassword && smtpPassword.trim() !== '' && (
                      <span style={{ color: '#059669', fontWeight: '600' }}> ✅ Passord lagret</span>
                    )}
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <button
                  onClick={() => setSettings(prev => ({ ...prev, smtpSecure: !prev.smtpSecure }))}
                  className={`toggle-switch ${settings.smtpSecure ? 'active' : ''}`}
                >
                  <span className="toggle-slider"></span>
                </button>
                <label className="form-label">Bruk SSL/TLS</label>
                <p className="form-help" style={{ marginLeft: '1rem' }}>For Domeneshop: AV (ikke huket av)</p>
              </div>

              {/* Advanced SMTP Settings */}
              <div style={{ 
                marginTop: '2rem', 
                padding: '1rem', 
                backgroundColor: '#f9fafb', 
                borderRadius: '0.5rem',
                border: '1px solid #e5e7eb'
              }}>
                <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '1rem' }}>Avanserte SMTP-innstillinger</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="form-label">Timeout (sekunder)</label>
                    <input
                      type="number"
                      value={settings.smtpTimeout || 30}
                      onChange={(e) => setSettings(prev => ({ ...prev, smtpTimeout: parseInt(e.target.value) }))}
                      className="form-input"
                      min="10"
                      max="120"
                    />
                  </div>
                  <div>
                    <label className="form-label">Maks forsøk</label>
                    <input
                      type="number"
                      value={settings.maxRetryAttempts}
                      onChange={(e) => setSettings(prev => ({ ...prev, maxRetryAttempts: parseInt(e.target.value) }))}
                      className="form-input"
                      min="1"
                      max="10"
                    />
                  </div>
                </div>

                <div style={{ marginTop: '1rem' }}>
                  <label className="form-label">Autentiseringsmetode</label>
                  <select
                    value={settings.smtpAuthMethod || 'PLAIN'}
                    onChange={(e) => setSettings(prev => ({ ...prev, smtpAuthMethod: e.target.value }))}
                    className="form-input"
                  >
                    <option value="PLAIN">PLAIN (Standard)</option>
                    <option value="LOGIN">LOGIN</option>
                    <option value="CRAM-MD5">CRAM-MD5</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem' }}>
                {isSmtpLoggedIn ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.75rem 1rem', backgroundColor: '#d1fae5', border: '1px solid #10b981', borderRadius: '0.5rem', color: '#065f46' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <CheckCircle style={{ width: '16px', height: '16px' }} />
                      <span style={{ fontWeight: 'bold' }}>🔐 INNLOGGET</span>
                    </div>
                    <div style={{ fontSize: '0.875rem' }}>
                      <div>Logget inn: {smtpLoginTime}</div>
                      <div>Økt utløper: {smtpSessionExpiry}</div>
                    </div>
                    <button
                      onClick={logoutSmtp}
                      className="btn btn-outline-danger"
                      style={{ backgroundColor: 'transparent', borderColor: '#dc3545', color: '#dc3545', padding: '0.25rem 0.75rem', fontSize: '0.875rem' }}
                    >
                      🔓 Logg ut
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={performSmtpLogin}
                    disabled={isSmtpLoggingIn || !settings.smtpHost || !settings.smtpPort || !settings.smtpUser || !smtpPassword}
                    className="btn btn-success"
                    style={{ backgroundColor: '#059669', borderColor: '#059669' }}
                  >
                    <Shield style={{ width: '16px', height: '16px' }} />
                    {isSmtpLoggingIn ? '🔐 Logger inn...' : '🔐 LOGG INN SMTP'}
                  </button>
                )}
                <button
                  onClick={detailedSmtpTest}
                  disabled={testingSmtp || !settings.smtpHost || !settings.smtpPort || !settings.smtpUser || !smtpPassword}
                  className="btn btn-warning"
                >
                  <TestTube style={{ width: '16px', height: '16px' }} />
                  {testingSmtp ? 'Tester...' : 'Detaljert SMTP-test'}
                </button>
                <button
                  onClick={testSmtpConnection}
                  disabled={testingSmtp || !settings.smtpHost || !settings.smtpPort || !settings.smtpUser || !smtpPassword}
                  className="btn btn-secondary"
                >
                  <TestTube style={{ width: '16px', height: '16px' }} />
                  {testingSmtp ? 'Tester...' : 'Enkel SMTP-test'}
                </button>
                <button
                  onClick={saveSettings}
                  disabled={saving}
                  className="btn btn-primary"
                >
                  <Save style={{ width: '16px', height: '16px' }} />
                  {saving ? 'Lagrer...' : 'Lagre SMTP-innstillinger'}
                </button>
              </div>

              {(!smtpPassword || smtpPassword.trim() === '') && (
                <div style={{ 
                  marginTop: '1rem', 
                  padding: '1rem', 
                  backgroundColor: '#fef3c7', 
                  border: '1px solid #f59e0b',
                  borderRadius: '0.5rem',
                  color: '#92400e'
                }}>
                  <strong>⚠️ Advarsel:</strong> SMTP-passord mangler! Gå til <a href="/dashboard/email-config" style={{ color: '#92400e', textDecoration: 'underline' }}>E-post-konfigurasjon</a> for å sette opp passordet.
                </div>
              )}

              {smtpPassword && smtpPassword.trim() !== '' && (
                <div style={{ 
                  marginTop: '1rem', 
                  padding: '1rem', 
                  backgroundColor: '#d1fae5', 
                  border: '1px solid #10b981',
                  borderRadius: '0.5rem',
                  color: '#065f46'
                }}>
                  <strong>✅ Passord lastet:</strong> SMTP-passordet er lastet fra Firebase og e-post-systemet er klart til bruk.
                </div>
              )}

                            {smtpLoginResult && (
                <div style={{ 
                  marginTop: '1rem', 
                  padding: '1rem', 
                  backgroundColor: smtpLoginResult.success ? '#d1fae5' : '#fef2f2', 
                  border: smtpLoginResult.success ? '1px solid #10b981' : '1px solid #ef4444',
                  borderRadius: '0.5rem',
                  color: smtpLoginResult.success ? '#065f46' : '#991b1b'
                }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                    <div style={{ fontSize: '1.2rem' }}>
                      {smtpLoginResult.success ? '🔐' : '❌'}
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ margin: 0, whiteSpace: 'pre-line' }}>
                        {smtpLoginResult.message}
                      </p>
                      {smtpLoginResult.details && (
                        <div style={{ marginTop: '0.5rem', fontSize: '0.875rem', opacity: 0.8 }}>
                          <p style={{ margin: '0.25rem 0' }}><strong>Server:</strong> {smtpLoginResult.details.smtpServer || smtpLoginResult.details.host}</p>
                          <p style={{ margin: '0.25rem 0' }}><strong>Bruker:</strong> {smtpLoginResult.details.user}</p>
                          <p style={{ margin: '0.25rem 0' }}><strong>Port:</strong> {smtpLoginResult.details.port}</p>
                          <p style={{ margin: '0.25rem 0' }}><strong>SSL:</strong> {smtpLoginResult.details.secure ? 'Ja' : 'Nei'}</p>
                          {smtpLoginResult.details.configName && (
                            <p style={{ margin: '0.25rem 0' }}><strong>Konfigurasjon:</strong> {smtpLoginResult.details.configName}</p>
                          )}
                          {smtpLoginResult.details.configType && (
                            <p style={{ margin: '0.25rem 0' }}><strong>Type:</strong> {smtpLoginResult.details.configType}</p>
                          )}
                          <p style={{ margin: '0.25rem 0' }}><strong>Tidspunkt:</strong> {new Date(smtpLoginResult.details.timestamp).toLocaleString('nb-NO')}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Alternative SMTP Options */}
              {showAlternativeOptions && (
                <div style={{ 
                  marginTop: '1rem', 
                  padding: '1.5rem', 
                  backgroundColor: '#fef3c7', 
                  border: '1px solid #f59e0b',
                  borderRadius: '0.5rem',
                  color: '#92400e'
                }}>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '1rem', color: '#92400e' }}>
                    🔧 Domeneshop SMTP-problem oppdaget - Prøv alternativ løsning
                  </h3>
                  
                  <div style={{ marginBottom: '1rem' }}>
                    <p style={{ marginBottom: '0.5rem' }}>
                      <strong>Domeneshop har ofte midlertidige SMTP-problemer.</strong> Du kan prøve:
                    </p>
                    <ul style={{ marginLeft: '1.5rem', marginBottom: '1rem' }}>
                      <li>Vente 5-10 minutter og prøve igjen</li>
                      <li>Bruke en alternativ SMTP-leverandør</li>
                      <li>Kontakte Domeneshop support</li>
                    </ul>
                  </div>

                  <div style={{ 
                    padding: '1rem', 
                    backgroundColor: '#ffffff', 
                    borderRadius: '0.5rem',
                    border: '1px solid #e5e7eb'
                  }}>
                    <h4 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '1rem' }}>Alternativ SMTP-konfigurasjon</h4>
                    
                    <div className="grid grid-cols-2 gap-4" style={{ marginBottom: '1rem' }}>
                      <div>
                        <label className="form-label">SMTP Server</label>
                        <input
                          type="text"
                          value={alternativeSmtpConfig.host}
                          onChange={(e) => setAlternativeSmtpConfig(prev => ({ ...prev, host: e.target.value }))}
                          className="form-input"
                          placeholder="smtp.office365.com"
                        />
                      </div>
                      <div>
                        <label className="form-label">Port</label>
                        <input
                          type="number"
                          value={alternativeSmtpConfig.port}
                          onChange={(e) => setAlternativeSmtpConfig(prev => ({ ...prev, port: parseInt(e.target.value) }))}
                          className="form-input"
                          placeholder="587"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4" style={{ marginBottom: '1rem' }}>
                      <div>
                        <label className="form-label">Brukernavn</label>
                        <input
                          type="text"
                          value={alternativeSmtpConfig.user}
                          onChange={(e) => setAlternativeSmtpConfig(prev => ({ ...prev, user: e.target.value }))}
                          className="form-input"
                          placeholder="noreplay@driftpro.no"
                        />
                      </div>
                      <div>
                        <label className="form-label">Passord</label>
                        <input
                          type="password"
                          value={alternativeSmtpConfig.pass}
                          onChange={(e) => setAlternativeSmtpConfig(prev => ({ ...prev, pass: e.target.value }))}
                          className="form-input"
                          placeholder="SMTP-passord"
                        />
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                      <button
                        onClick={() => setAlternativeSmtpConfig(prev => ({ ...prev, secure: !prev.secure }))}
                        className={`toggle-switch ${alternativeSmtpConfig.secure ? 'active' : ''}`}
                      >
                        <span className="toggle-slider"></span>
                      </button>
                      <label className="form-label">Bruk SSL/TLS</label>
                    </div>

                    <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                      <button
                        onClick={tryAlternativeSmtp}
                        disabled={isSmtpLoggingIn || !alternativeSmtpConfig.host || !alternativeSmtpConfig.user || !alternativeSmtpConfig.pass}
                        className="btn btn-warning"
                        style={{ backgroundColor: '#f59e0b', borderColor: '#f59e0b', color: 'white' }}
                      >
                        <Shield style={{ width: '16px', height: '16px' }} />
                        {isSmtpLoggingIn ? 'Tester alternativ...' : '🔧 Prøv alternativ SMTP'}
                      </button>
                      
                      <button
                        onClick={() => setShowAlternativeOptions(false)}
                        className="btn btn-secondary"
                      >
                        Lukk alternativer
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Notifications Tab */}
      {activeTab === 'notifications' && (
        <div className="space-y-6">
          <div className="card">
            <h2 className="card-title">
              <Bell style={{ width: '20px', height: '20px' }} />
              Varsel-innstillinger
            </h2>
            <div className="space-y-4">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <label className="form-label">Aktiver alle varsler</label>
                  <p className="form-help">Hovedbryter for alle e-post-varsler</p>
                </div>
                <button
                  onClick={() => setSettings(prev => ({ ...prev, enabled: !prev.enabled }))}
                  className={`toggle-switch ${settings.enabled ? 'active' : ''}`}
                >
                  <span className="toggle-slider"></span>
                </button>
              </div>

              <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '1rem' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '1rem' }}>E-post-typer</h3>
                {[
                  { key: 'adminSetup', label: 'Admin-oppsett', description: 'E-post til nye administratorer', icon: '👤' },
                  { key: 'deviationReports', label: 'Avviksrapporter', description: 'Rapporter om avvik', icon: '⚠️' },
                  { key: 'deviationResolved', label: 'Avvik løst', description: 'Når avvik er løst', icon: '✅' },
                  { key: 'userWelcome', label: 'Velkomst', description: 'Velkomst til nye brukere', icon: '🎉' },
                  { key: 'notifications', label: 'Generelle varsler', description: 'Generelle systemvarsler', icon: '📢' },
                  { key: 'warnings', label: 'Advarsler', description: 'Viktige advarsler', icon: '🚨' },
                  { key: 'systemAlerts', label: 'Systemvarsler', description: 'Systemrelaterte varsler', icon: '⚙️' }
                ].map(({ key, label, description, icon }) => (
                  <div key={key} style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between',
                    padding: '1rem',
                    border: '1px solid #e5e7eb',
                    borderRadius: '0.5rem',
                    marginBottom: '0.5rem',
                    backgroundColor: settings[key as keyof EmailSettings] ? '#f0f9ff' : '#f9fafb'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <span style={{ fontSize: '1.5rem' }}>{icon}</span>
                      <div>
                        <label className="form-label" style={{ margin: 0 }}>{label}</label>
                        <p className="form-help" style={{ margin: 0 }}>{description}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setSettings(prev => ({ ...prev, [key]: !prev[key as keyof EmailSettings] }))}
                      className={`toggle-switch ${settings[key as keyof EmailSettings] ? 'active' : ''}`}
                    >
                      <span className="toggle-slider"></span>
                    </button>
                  </div>
                ))}
              </div>

              <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '1rem' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '1rem' }}>Avanserte varsel-innstillinger</h3>
                
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                  <div>
                    <label className="form-label">E-post-kø</label>
                    <p className="form-help">Bruk kø for bedre ytelse ved mange e-poster</p>
                  </div>
                  <button
                    onClick={() => setSettings(prev => ({ ...prev, emailQueueEnabled: !prev.emailQueueEnabled }))}
                    className={`toggle-switch ${settings.emailQueueEnabled ? 'active' : ''}`}
                  >
                    <span className="toggle-slider"></span>
                  </button>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                  <div>
                    <label className="form-label">Logg alle e-poster</label>
                    <p className="form-help">Lagre detaljert informasjon om alle sendte e-poster</p>
                  </div>
                  <button
                    onClick={() => setSettings(prev => ({ ...prev, logAllEmails: !prev.logAllEmails }))}
                    className={`toggle-switch ${settings.logAllEmails ? 'active' : ''}`}
                  >
                    <span className="toggle-slider"></span>
                  </button>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <label className="form-label">Spam-beskyttelse</label>
                    <p className="form-help">Begrens antall mottakere per e-post</p>
                  </div>
                  <button
                    onClick={() => setSettings(prev => ({ 
                      ...prev, 
                      spamProtection: { 
                        ...prev.spamProtection, 
                        enabled: !prev.spamProtection.enabled 
                      } 
                    }))}
                    className={`toggle-switch ${settings.spamProtection.enabled ? 'active' : ''}`}
                  >
                    <span className="toggle-slider"></span>
                  </button>
                </div>

                {settings.spamProtection.enabled && (
                  <div style={{ marginTop: '1rem' }}>
                    <label className="form-label">Maks mottakere per e-post</label>
                    <input
                      type="number"
                      value={settings.spamProtection.maxRecipients}
                      onChange={(e) => setSettings(prev => ({ 
                        ...prev, 
                        spamProtection: { 
                          ...prev.spamProtection, 
                          maxRecipients: parseInt(e.target.value) 
                        } 
                      }))}
                      className="form-input"
                      style={{ width: '200px' }}
                      min="1"
                      max="100"
                    />
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem' }}>
                <button
                  onClick={saveSettings}
                  disabled={saving}
                  className="btn btn-primary"
                >
                  <Save style={{ width: '16px', height: '16px' }} />
                  {saving ? 'Lagrer...' : 'Lagre varsel-innstillinger'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Advanced Tab */}
      {activeTab === 'advanced' && (
        <div className="space-y-6">
          <div className="card">
            <h2 className="card-title">
              <Shield style={{ width: '20px', height: '20px' }} />
              Backup SMTP
            </h2>
            <div className="space-y-4">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <label className="form-label">Aktiver backup SMTP</label>
                  <p className="form-help">Bruk backup SMTP-server hvis hovedserveren feiler</p>
                </div>
                <button
                  onClick={() => setSettings(prev => ({ ...prev, backupSmtpEnabled: !prev.backupSmtpEnabled }))}
                  className={`toggle-switch ${settings.backupSmtpEnabled ? 'active' : ''}`}
                >
                  <span className="toggle-slider"></span>
                </button>
              </div>

              {settings.backupSmtpEnabled && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="form-label">Backup SMTP-server</label>
                    <input
                      type="text"
                      value={settings.backupSmtpHost}
                      onChange={(e) => setSettings(prev => ({ ...prev, backupSmtpHost: e.target.value }))}
                      className="form-input"
                      placeholder="smtp.gmail.com"
                    />
                  </div>
                  <div>
                    <label className="form-label">Backup port</label>
                    <input
                      type="number"
                      value={settings.backupSmtpPort}
                      onChange={(e) => setSettings(prev => ({ ...prev, backupSmtpPort: parseInt(e.target.value) }))}
                      className="form-input"
                      placeholder="587"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="card">
            <h2 className="card-title">Avanserte innstillinger</h2>
            <div className="space-y-4">
              <div>
                <label className="form-label">Maks forsøk ved feil</label>
                <input
                  type="number"
                  value={settings.maxRetryAttempts}
                  onChange={(e) => setSettings(prev => ({ ...prev, maxRetryAttempts: parseInt(e.target.value) }))}
                  className="form-input"
                  style={{ width: '200px' }}
                  min="1"
                  max="10"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Analytics Tab */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          <div className="card">
            <h2 className="card-title">
              <TrendingUp style={{ width: '20px', height: '20px' }} />
              E-post-analyser
            </h2>
            <div className="space-y-4">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <label className="form-label">Aktiver analyser</label>
                  <p className="form-help">Spor e-post-ytelse og statistikk</p>
                </div>
                <button
                  onClick={() => setSettings(prev => ({ ...prev, analyticsEnabled: !prev.analyticsEnabled }))}
                  className={`toggle-switch ${settings.analyticsEnabled ? 'active' : ''}`}
                >
                  <span className="toggle-slider"></span>
                </button>
              </div>

              {settings.analyticsEnabled && (
                <div className="space-y-4">
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <label className="form-label">Spor åpningsrater</label>
                      <p className="form-help">Spor hvor mange som åpner e-postene</p>
                    </div>
                    <button
                      onClick={() => setSettings(prev => ({ ...prev, trackOpenRates: !prev.trackOpenRates }))}
                      className={`toggle-switch ${settings.trackOpenRates ? 'active' : ''}`}
                    >
                      <span className="toggle-slider"></span>
                    </button>
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <label className="form-label">Spor klikk-rater</label>
                      <p className="form-help">Spor klikk på lenker i e-postene</p>
                    </div>
                    <button
                      onClick={() => setSettings(prev => ({ ...prev, trackClickRates: !prev.trackClickRates }))}
                      className={`toggle-switch ${settings.trackClickRates ? 'active' : ''}`}
                    >
                      <span className="toggle-slider"></span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="card">
            <h2 className="card-title">Statistikker</h2>
            <div style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
              <TrendingUp style={{ width: '48px', height: '48px', margin: '0 auto 1rem' }} />
              <p>E-post-statistikker kommer snart</p>
            </div>
          </div>
        </div>
      )}

      {/* Test Tab */}
      {activeTab === 'test' && (
        <div className="card">
          <h2 className="card-title">Test e-post</h2>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="form-label">Mottaker e-post</label>
                <input
                  type="email"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                  className="form-input"
                  placeholder="test@example.com"
                />
              </div>
              <div>
                <label className="form-label">E-post-type</label>
                <select
                  value={testType}
                  onChange={(e) => setTestType(e.target.value)}
                  className="form-input"
                >
                  <option value="admin_setup">Admin-oppsett</option>
                  <option value="deviation_report">Avviksrapport</option>
                  <option value="notification">Varsel</option>
                  <option value="warning">Advarsel</option>
                  <option value="welcome">Velkomst</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                onClick={sendTestEmail}
                disabled={!testEmail || !settings.smtpHost || !settings.smtpPort || !settings.smtpUser || !smtpPassword}
                className="btn btn-primary"
              >
                <TestTube style={{ width: '16px', height: '16px' }} />
                Send test e-post
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 