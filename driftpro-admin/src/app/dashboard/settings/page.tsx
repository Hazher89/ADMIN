'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import ErrorBoundary from '@/components/ErrorBoundary';
import { microsoftGraphService } from '@/lib/microsoft-graph-service';
import { globalEmailService } from '@/lib/global-email-service';
import type { AccountInfo } from '@azure/msal-browser';
import { 
  Settings, 
  Users, 
  Building, 
  Bell, 
  Shield, 
  Database, 
  Globe, 
  Palette, 
  Key, 
  BarChart3,
  Plus,
  Search,
  MoreHorizontal,
  CheckCircle,
  Clock,
  Eye,
  Edit,
  Trash2,
  Save,
  X,
  ChevronDown,
  ChevronRight,
  ToggleLeft,
  ToggleRight,
  Mail,
  Phone,
  MapPin,
  Calendar,
  FileText,
  Lock,
  Unlock,
  AlertTriangle,
  Info,
  Zap,
  Monitor,
  Smartphone,
  Tablet,
  Sun,
  Moon,
  Languages,
  Shield as ShieldIcon,
  Activity,
  TrendingUp,
  Users as UsersIcon,
  Briefcase,
  Home,
  Settings as SettingsIcon,
  ChevronUp,
  RotateCcw,
  LogOut
} from 'lucide-react';

interface SystemSetting {
  id: string;
  category: string;
  name: string;
  description: string;
  type: 'toggle' | 'text' | 'number' | 'select' | 'textarea' | 'color' | 'file';
  value: string | number | boolean | null;
  defaultValue: string | number | boolean | null;
  options?: string[];
  required?: boolean;
  validation?: string;
  updatedAt: string;
}

export default function SettingsPage() {
  const { userProfile, logout } = useAuth();
  const [settings, setSettings] = useState<SystemSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('general');
  const [editingSetting, setEditingSetting] = useState<string | null>(null);
  const [tempValues, setTempValues] = useState<{[key: string]: string | number | boolean | null}>({});
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  // Email-specific states
  const [emailTestStatus, setEmailTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [emailTestMessage, setEmailTestMessage] = useState('');
  const [testEmailAddress, setTestEmailAddress] = useState('');
  const [emailLogs, setEmailLogs] = useState<any[]>([]);
  const [showEmailLogs, setShowEmailLogs] = useState(false);
  const [emailTemplates, setEmailTemplates] = useState<any[]>([]);
  const [notificationSettings, setNotificationSettings] = useState<any[]>([]);
  
  // Office 365 Login states
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginStatus, setLoginStatus] = useState<'not_logged_in' | 'logging_in' | 'logged_in' | 'error'>('not_logged_in');
  const [loginMessage, setLoginMessage] = useState('');
  const [office365Credentials, setOffice365Credentials] = useState<{email: string, password: string} | null>(null);
  
  // Microsoft Graph Authentication states
  const [isMicrosoftAuthenticated, setIsMicrosoftAuthenticated] = useState(false);
  const [microsoftAccount, setMicrosoftAccount] = useState<AccountInfo | null>(null);
  const [isMicrosoftAuthenticating, setIsMicrosoftAuthenticating] = useState(false);
  const [microsoftAuthError, setMicrosoftAuthError] = useState<string | null>(null);
  
  // Two-step process states
  const [currentStep, setCurrentStep] = useState<'login' | 'sender_config'>('login');
  const [senderName, setSenderName] = useState('DriftPro System');
  const [senderEmail, setSenderEmail] = useState('');
  const [showSenderConfig, setShowSenderConfig] = useState(false);

  // Initialize default system settings
  const defaultSettings: SystemSetting[] = [
    // General Settings
    {
      id: 'site_name',
      category: 'general',
      name: 'Nettstedsnavn',
      description: 'Navnet som vises i nettleser og app',
      type: 'text',
      value: 'DriftPro',
      defaultValue: 'DriftPro',
      required: true,
      updatedAt: new Date().toISOString()
    },
    {
      id: 'site_description',
      category: 'general',
      name: 'Nettstedsbeskrivelse',
      description: 'Beskrivelse av nettstedet for søkemotorer',
      type: 'textarea',
      value: 'DriftPro - Ledelsessystem for bedrifter',
      defaultValue: 'DriftPro - Ledelsessystem for bedrifter',
      updatedAt: new Date().toISOString()
    },
    {
      id: 'timezone',
      category: 'general',
      name: 'Tidssone',
      description: 'Standard tidssone for systemet',
      type: 'select',
      value: 'Europe/Oslo',
      defaultValue: 'Europe/Oslo',
      options: ['Europe/Oslo', 'Europe/Stockholm', 'Europe/Copenhagen', 'UTC'],
      updatedAt: new Date().toISOString()
    },
    {
      id: 'language',
      category: 'general',
      name: 'Språk',
      description: 'Standard språk for systemet',
      type: 'select',
      value: 'no',
      defaultValue: 'no',
      options: ['no', 'en', 'sv', 'da'],
      updatedAt: new Date().toISOString()
    },

    // User Management
    {
      id: 'user_registration',
      category: 'users',
      name: 'Brukerregistrering',
      description: 'Tillat nye brukere å registrere seg',
      type: 'toggle',
      value: false,
      defaultValue: false,
      updatedAt: new Date().toISOString()
    },
    {
      id: 'email_verification',
      category: 'users',
      name: 'E-postverifisering',
      description: 'Krev e-postverifisering for nye brukere',
      type: 'toggle',
      value: true,
      defaultValue: true,
      updatedAt: new Date().toISOString()
    },
    {
      id: 'password_min_length',
      category: 'users',
      name: 'Minimum passordlengde',
      description: 'Minimum antall tegn for passord',
      type: 'number',
      value: 8,
      defaultValue: 8,
      validation: 'min:6,max:20',
      updatedAt: new Date().toISOString()
    },
    {
      id: 'session_timeout',
      category: 'users',
      name: 'Økt timeout',
      description: 'Antall minutter før automatisk utlogging',
      type: 'number',
      value: 60,
      defaultValue: 60,
      validation: 'min:15,max:480',
      updatedAt: new Date().toISOString()
    },

    // Company Settings
    {
      id: 'company_logo',
      category: 'company',
      name: 'Bedriftslogo',
      description: 'Logo som vises på alle sider',
      type: 'file',
      value: null,
      defaultValue: null,
      updatedAt: new Date().toISOString()
    },
    {
      id: 'company_address',
      category: 'company',
      name: 'Bedriftsadresse',
      description: 'Offisiell adresse for bedriften',
      type: 'textarea',
      value: '',
      defaultValue: '',
      updatedAt: new Date().toISOString()
    },
    {
      id: 'company_phone',
      category: 'company',
      name: 'Bedriftstelefon',
      description: 'Hovedtelefonnummer',
      type: 'text',
      value: '',
      defaultValue: '',
      updatedAt: new Date().toISOString()
    },
    {
      id: 'company_email',
      category: 'company',
      name: 'Bedriftse-post',
      description: 'Hovede-postadresse',
      type: 'text',
      value: '',
      defaultValue: '',
      updatedAt: new Date().toISOString()
    },

    // Notifications
    {
      id: 'email_notifications',
      category: 'notifications',
      name: 'E-postvarsler',
      description: 'Send varsler via e-post',
      type: 'toggle',
      value: true,
      defaultValue: true,
      updatedAt: new Date().toISOString()
    },
    {
      id: 'push_notifications',
      category: 'notifications',
      name: 'Push-varsler',
      description: 'Send push-varsler til brukere',
      type: 'toggle',
      value: true,
      defaultValue: true,
      updatedAt: new Date().toISOString()
    },
    {
      id: 'notification_sound',
      category: 'notifications',
      name: 'Varsellyd',
      description: 'Spill lyd ved nye varsler',
      type: 'toggle',
      value: true,
      defaultValue: true,
      updatedAt: new Date().toISOString()
    },

    // Security
    {
      id: 'two_factor_auth',
      category: 'security',
      name: 'To-faktor autentisering',
      description: 'Krev 2FA for alle brukere',
      type: 'toggle',
      value: false,
      defaultValue: false,
      updatedAt: new Date().toISOString()
    },
    {
      id: 'login_attempts',
      category: 'security',
      name: 'Maks innloggingsforsøk',
      description: 'Antall forsøk før konto låses',
      type: 'number',
      value: 5,
      defaultValue: 5,
      validation: 'min:3,max:10',
      updatedAt: new Date().toISOString()
    },
    {
      id: 'ip_whitelist',
      category: 'security',
      name: 'IP-whitelist',
      description: 'Tillat kun tilgang fra spesifikke IP-adresser',
      type: 'toggle',
      value: false,
      defaultValue: false,
      updatedAt: new Date().toISOString()
    },

    // Database
    {
      id: 'backup_frequency',
      category: 'database',
      name: 'Backup-frekvens',
      description: 'Hvor ofte database skal sikkerhetskopieres',
      type: 'select',
      value: 'daily',
      defaultValue: 'daily',
      options: ['hourly', 'daily', 'weekly', 'monthly'],
      updatedAt: new Date().toISOString()
    },
    {
      id: 'data_retention',
      category: 'database',
      name: 'Dataoppbevaring',
      description: 'Antall dager å beholde gamle data',
      type: 'number',
      value: 365,
      defaultValue: 365,
      validation: 'min:30,max:2555',
      updatedAt: new Date().toISOString()
    },

    // Appearance
    {
      id: 'theme',
      category: 'appearance',
      name: 'Tema',
      description: 'Farge-tema for systemet',
      type: 'select',
      value: 'light',
      defaultValue: 'light',
      options: ['light', 'dark', 'auto'],
      updatedAt: new Date().toISOString()
    },
    {
      id: 'primary_color',
      category: 'appearance',
      name: 'Primærfarge',
      description: 'Hovedfarge for systemet',
      type: 'color',
      value: '#3b82f6',
      defaultValue: '#3b82f6',
      updatedAt: new Date().toISOString()
    },
    {
      id: 'sidebar_collapsed',
      category: 'appearance',
      name: 'Kollapset sidebar',
      description: 'Start med kollapset sidebar',
      type: 'toggle',
      value: false,
      defaultValue: false,
      updatedAt: new Date().toISOString()
    },

    // Advanced Settings
    {
      id: 'debug_mode',
      category: 'advanced',
      name: 'Debug-modus',
      description: 'Aktiver debug-informasjon (kun for utviklere)',
      type: 'toggle',
      value: false,
      defaultValue: false,
      updatedAt: new Date().toISOString()
    },
    {
      id: 'api_rate_limit',
      category: 'advanced',
      name: 'API rate limit',
      description: 'Maks API-kall per minutt',
      type: 'number',
      value: 1000,
      defaultValue: 1000,
      validation: 'min:100,max:10000',
      updatedAt: new Date().toISOString()
    },
    {
      id: 'cache_duration',
      category: 'advanced',
      name: 'Cache-varighet',
      description: 'Antall minutter å cache data',
      type: 'number',
      value: 15,
      defaultValue: 15,
      validation: 'min:1,max:1440',
      updatedAt: new Date().toISOString()
    },

    // Email Settings - Only basic settings, detailed config after login
    {
      id: 'email_enabled',
      category: 'email',
      name: 'E-post aktivert',
      description: 'Aktiver e-postfunksjonalitet i systemet',
      type: 'toggle',
      value: true,
      defaultValue: true,
      updatedAt: new Date().toISOString()
    },
    // Hidden settings that will be populated after login
    {
      id: 'from_name',
      category: 'email',
      name: 'Avsender navn',
      description: 'Navn som vises som avsender',
      type: 'text',
      value: 'DriftPro System',
      defaultValue: 'DriftPro System',
      updatedAt: new Date().toISOString()
    },
    {
      id: 'from_email',
      category: 'email',
      name: 'Avsender e-post',
      description: 'E-postadresse som vises som avsender',
      type: 'text',
      value: '',
      defaultValue: '',
      updatedAt: new Date().toISOString()
    }
  ];

  // Email functions
  const testEmailConnection = async () => {
    if (!testEmailAddress) {
      setEmailTestMessage('Vennligst skriv inn en e-postadresse for testing');
      setEmailTestStatus('error');
      return;
    }

    // Check if user is logged in - if not, show login modal
    if (loginStatus !== 'logged_in' || !office365Credentials) {
      setEmailTestMessage('⚠️ Du må logge inn til Office 365 først!');
      setEmailTestStatus('error');
      setShowLoginModal(true); // Automatically show login modal
      return;
    }

    setEmailTestStatus('testing');
    setEmailTestMessage('Tester e-posttilkobling...');

    try {
      const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
      const response = await fetch(`${baseUrl}/api/email/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          host: 'smtp-mail.outlook.com',
          port: 587,
          user: office365Credentials.email,
          pass: office365Credentials.password,
          secure: false,
          testEmail: testEmailAddress
        })
      });

      const result = await response.json();

      if (result.success) {
        setEmailTestStatus('success');
        setEmailTestMessage(`✅ E-posttest vellykket! Test-e-post sendt til ${testEmailAddress}`);
      } else {
        setEmailTestStatus('error');
        setEmailTestMessage(result.error || 'E-posttest feilet');
      }
    } catch (error) {
      setEmailTestStatus('error');
      setEmailTestMessage('Feil ved testing av e-posttilkobling');
    }
  };

  const loadEmailLogs = async () => {
    // Check if email service is available
    if (!globalEmailService.isEmailServiceAvailable()) {
      setMicrosoftAuthError('Du må logge inn til Microsoft Graph først!');
      return;
    }

    try {
      const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
      const response = await fetch(`${baseUrl}/api/email/logs`);
      const logs = await response.json();
      setEmailLogs(logs);
    } catch (error) {
      console.error('Error loading email logs:', error);
    }
  };

  const loginToOffice365 = async () => {
    if (!loginEmail || !loginPassword) {
      setLoginMessage('Vennligst skriv inn e-post og passord');
      setLoginStatus('error');
      return;
    }

    setIsLoggingIn(true);
    setLoginStatus('logging_in');
    setLoginMessage('Logger inn til Office 365...');

    try {
      // Test Office 365 connection
      const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
      const response = await fetch(`${baseUrl}/api/email/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          host: 'smtp-mail.outlook.com',
          port: 587,
          user: loginEmail,
          pass: loginPassword,
          secure: false,
          testEmail: loginEmail // Send test to same email
        })
      });

      const result = await response.json();

      if (result.success) {
        setLoginStatus('logged_in');
        setLoginMessage(`✅ PERMANENT INNLOGGING VELLYKKET! Logget inn som ${loginEmail} (gjelder i 10.000 år!)`);
        setOffice365Credentials({ email: loginEmail, password: loginPassword });
        setSenderEmail(loginEmail); // Pre-fill sender email with login email
        setShowLoginModal(false);
        
        // Save login state to localStorage for PERMANENT persistence (10,000 years!)
        try {
          localStorage.setItem('office365_login_status', 'logged_in');
          localStorage.setItem('office365_credentials', JSON.stringify({ 
            email: loginEmail, 
            password: loginPassword,
            loginTime: new Date().toISOString(),
            expiresIn: 10000 * 365 * 24 * 60 * 60 * 1000 // 10,000 years in milliseconds
          }));
        } catch (localStorageError) {
          console.error('Error saving to localStorage:', localStorageError);
          // Continue without saving - login will still work for this session
        }
        
        // Go to next step: sender configuration
        setCurrentStep('sender_config');
        setShowSenderConfig(true);
      } else {
        setLoginStatus('error');
        setLoginMessage(result.error || 'Innlogging feilet');
      }
    } catch (error) {
      setLoginStatus('error');
      setLoginMessage('Feil ved innlogging til Office 365');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const logoutFromOffice365 = () => {
    // Only allow logout if user explicitly clicks logout button
    const confirmLogout = window.confirm('⚠️ ADVARSEL: Dette vil logge deg ut av Office 365 PERMANENT!\n\nEr du HELT sikker på at du vil logge ut?');
    
    if (!confirmLogout) {
      return; // User cancelled - stay logged in forever!
    }
    
    setLoginStatus('not_logged_in');
    setLoginMessage('');
    setOffice365Credentials(null);
    setLoginEmail('');
    setLoginPassword('');
    setCurrentStep('login');
    setShowSenderConfig(false);
    setSenderName('DriftPro System');
    setSenderEmail('');
    
    // Clear localStorage data (only when user explicitly wants to logout)
    try {
      localStorage.removeItem('office365_login_status');
      localStorage.removeItem('office365_credentials');
      localStorage.removeItem('office365_sender_config');
    } catch (localStorageError) {
      console.error('Error clearing localStorage:', localStorageError);
      // Continue - logout will still work
    }
    
    // Clear credentials from settings
    setSettings(prev => prev.map(setting => {
      if (setting.id === 'smtp_password') return { ...setting, value: '' };
      return setting;
    }));
  };

  // Microsoft Graph Authentication functions
  const checkMicrosoftGraphAuth = async () => {
    try {
      // Initialize MSAL first to restore any existing session
      await microsoftGraphService.initializeMSAL();
      
      const account = microsoftGraphService.getCurrentAccount();
      if (account) {
        setIsMicrosoftAuthenticated(true);
        setMicrosoftAccount(account);
        setMicrosoftAuthError(null);
        
        // Update global email service
        await globalEmailService.checkAuthenticationStatus();
        
        console.log('✅ Microsoft Graph authentication found:', account.username);
      } else {
        setIsMicrosoftAuthenticated(false);
        setMicrosoftAccount(null);
        console.log('ℹ️ No Microsoft Graph authentication found');
      }
    } catch (error) {
      console.error('Error checking Microsoft Graph auth:', error);
      setIsMicrosoftAuthenticated(false);
      setMicrosoftAccount(null);
    }
  };

  const handleMicrosoftLogin = async () => {
    try {
      setIsMicrosoftAuthenticating(true);
      setMicrosoftAuthError(null);
      
      await microsoftGraphService.signIn();
      const account = microsoftGraphService.getCurrentAccount();
      
      if (account) {
        setIsMicrosoftAuthenticated(true);
        setMicrosoftAccount(account);
        
        // Update global email service
        await globalEmailService.checkAuthenticationStatus();
        
        // Save to localStorage for persistence
        localStorage.setItem('microsoft_graph_auth', JSON.stringify({
          account: account,
          loginTime: new Date().toISOString(),
          expiresIn: 10000 * 365 * 24 * 60 * 60 * 1000 // 10,000 years
        }));
        
        console.log('✅ Microsoft Graph login successful:', account.username);
      }
    } catch (error) {
      console.error('Microsoft Graph login failed:', error);
      setMicrosoftAuthError('Innlogging til Microsoft Graph mislyktes. Prøv igjen.');
    } finally {
      setIsMicrosoftAuthenticating(false);
    }
  };

  const handleMicrosoftLogout = async () => {
    try {
      await microsoftGraphService.signOut();
      setIsMicrosoftAuthenticated(false);
      setMicrosoftAccount(null);
      setMicrosoftAuthError(null);
      
      // Update global email service
      await globalEmailService.checkAuthenticationStatus();
      
      // Clear localStorage
      localStorage.removeItem('microsoft_graph_auth');
      
      console.log('✅ Microsoft Graph logout successful');
    } catch (error) {
      console.error('Microsoft Graph logout failed:', error);
    }
  };

  const saveSenderConfiguration = () => {
    if (!senderName || !senderEmail) {
      alert('Vennligst fyll ut både avsender navn og e-post');
      return;
    }
    
    // Update settings with sender configuration
    setSettings(prev => prev.map(setting => {
      if (setting.id === 'from_name') return { ...setting, value: senderName };
      if (setting.id === 'from_email') return { ...setting, value: senderEmail };
      return setting;
    }));
    
    // Save sender configuration to localStorage for PERMANENT persistence (10,000 years!)
    try {
      localStorage.setItem('office365_sender_config', JSON.stringify({
        name: senderName,
        email: senderEmail,
        configTime: new Date().toISOString(),
        expiresIn: 10000 * 365 * 24 * 60 * 60 * 1000 // 10,000 years in milliseconds
      }));
    } catch (localStorageError) {
      console.error('Error saving sender config to localStorage:', localStorageError);
      // Continue without saving - config will still work for this session
    }
    
    setShowSenderConfig(false);
    setCurrentStep('login');
    
    // Show success message
    setLoginMessage(`✅ Avsender konfigurert: ${senderName} <${senderEmail}> (permanent!)`);
  };

  const sendTestEmail = async (template: string) => {
    // Alltid spør hvilken e-post som skal brukes
    const targetEmail = window.prompt('Hvilken e-postadresse vil du sende testmeldingen til?', testEmailAddress || '');
    
    if (!targetEmail || !targetEmail.trim()) {
      setEmailTestMessage('Du må skrive inn en e-postadresse for å sende test.');
      setEmailTestStatus('error');
      return;
    }

    // Oppdater feltet slik at brukeren også ser adressen i UI om det brukes senere
    setTestEmailAddress(targetEmail.trim());

    // Check if email service is available
    if (!globalEmailService.isEmailServiceAvailable()) {
      setEmailTestMessage('⚠️ Du må logge inn til Microsoft Graph først!');
      setEmailTestStatus('error');
      return;
    }

    setEmailTestStatus('testing');
    setEmailTestMessage(`Sender ${template} til ${targetEmail.trim()}...`);

    try {
      const result = await globalEmailService.sendEmail({
        to: targetEmail.trim(),
        subject: `DriftPro Test - ${template}`,
        html: `<h1>Test ${template}</h1><p>Dette er en test-e-post fra DriftPro.</p>`
      });

      if (result.success) {
        setEmailTestStatus('success');
        const successMsg = `✅ ${template} sendt til ${targetEmail.trim()}!`;
        setEmailTestMessage(successMsg);
        window.alert(successMsg);
      } else {
        const errorMsg = result.error || 'E-postsending feilet';
        setEmailTestStatus('error');
        setEmailTestMessage(errorMsg);
        window.alert(`❌ ${errorMsg}`);
      }
    } catch (error) {
      const errorMsg = 'Feil ved sending av e-post';
      setEmailTestStatus('error');
      setEmailTestMessage(errorMsg);
      console.error('Email test error:', error);
      window.alert(`❌ ${errorMsg}`);
    }
  };

  useEffect(() => {
    const loadSettings = async () => {
      console.log('🔧 Settings page: Loading settings...');
      
      // Check if we're on the client side
      if (typeof window === 'undefined') {
        console.log('🔧 Settings page: Server-side rendering, skipping localStorage access');
        setLoading(false);
        return;
      }

      if (!userProfile?.companyId) {
        setLoading(false);
        return;
      }

      try {
        // For now, use default settings
        // In production, load from Firebase
        setSettings(defaultSettings);
        
        // Initialize email templates
        setEmailTemplates([
          { id: 'welcome', name: 'Velkommen', description: 'Velkommen til DriftPro' },
          { id: 'password_reset', name: 'Glemt passord', description: 'Tilbakestill passord' },
          { id: 'user_created', name: 'Bruker opprettet', description: 'Ny bruker opprettet' },
          { id: 'vacation_request', name: 'Ferieforespørsel', description: 'Ny ferieforespørsel' },
          { id: 'deviation_report', name: 'HMS-avvik', description: 'Rapportert HMS-avvik' },
          { id: 'system_alert', name: 'Systemvarsel', description: 'Viktig systemvarsel' }
        ]);

        // Initialize notification settings
        setNotificationSettings([
          { id: 'email_welcome', name: 'Velkommen-e-post', enabled: true, recipients: ['admin'] },
          { id: 'email_password_reset', name: 'Glemt passord', enabled: true, recipients: ['user'] },
          { id: 'email_vacation_request', name: 'Ferieforespørsel', enabled: true, recipients: ['manager', 'admin'] },
          { id: 'email_deviation_report', name: 'HMS-avvik', enabled: true, recipients: ['safety_manager', 'admin'] },
          { id: 'email_system_alerts', name: 'Systemvarsler', enabled: true, recipients: ['admin'] },
          { id: 'email_shift_changes', name: 'Vaktendringer', enabled: false, recipients: ['employee', 'manager'] },
          { id: 'email_document_updates', name: 'Dokumentoppdateringer', enabled: false, recipients: ['employee'] }
        ]);

        // Load persistent Office 365 login state - only on client side
        try {
          console.log('🔧 Settings page: Checking localStorage for Office 365 credentials...');
          const savedLoginStatus = localStorage.getItem('office365_login_status');
          const savedCredentials = localStorage.getItem('office365_credentials');
          const savedSenderConfig = localStorage.getItem('office365_sender_config');
          
          // Check Microsoft Graph authentication status
          await checkMicrosoftGraphAuth();

          if (savedLoginStatus === 'logged_in' && savedCredentials) {
            try {
              const credentials = JSON.parse(savedCredentials);
              
              // Check if login is still valid (should be valid for 10,000 years!)
              const loginTime = new Date(credentials.loginTime || new Date());
              const expiresIn = credentials.expiresIn || (10000 * 365 * 24 * 60 * 60 * 1000);
              const now = new Date();
              
              // Login is valid for 10,000 years - basically forever!
              if (now.getTime() - loginTime.getTime() < expiresIn) {
                setLoginStatus('logged_in');
                setOffice365Credentials(credentials);
                setLoginMessage(`✅ PERMANENT INNLOGGING: ${credentials.email} (gjelder i 10.000 år!)`);
                
                if (savedSenderConfig) {
                  const senderConfig = JSON.parse(savedSenderConfig);
                  setSenderName(senderConfig.name);
                  setSenderEmail(senderConfig.email);
                  setCurrentStep('sender_config');
                }
              } else {
                // This should never happen in 10,000 years, but just in case...
                console.log('🕰️ Login expired after 10,000 years - refreshing...');
                // Re-save with new timestamp
                localStorage.setItem('office365_credentials', JSON.stringify({ 
                  ...credentials,
                  loginTime: new Date().toISOString(),
                  expiresIn: 10000 * 365 * 24 * 60 * 60 * 1000
                }));
                setLoginStatus('logged_in');
                setOffice365Credentials(credentials);
                setLoginMessage(`✅ PERMANENT INNLOGGING FORNYET: ${credentials.email}`);
              }
            } catch (parseError) {
              console.error('Error parsing saved Office 365 credentials:', parseError);
              // Clear corrupted data
              localStorage.removeItem('office365_login_status');
              localStorage.removeItem('office365_credentials');
              localStorage.removeItem('office365_sender_config');
            }
          }
        } catch (localStorageError) {
          console.error('Error accessing localStorage:', localStorageError);
          // Continue without loading saved state
        }
      } catch (error) {
        console.error('Error loading settings:', error);
        setSettings(defaultSettings);
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, [userProfile?.companyId]);

  // Separate useEffect for Microsoft Graph authentication check on page load
  useEffect(() => {
    const checkAuthOnLoad = async () => {
      console.log('🔧 Settings page: Checking Microsoft Graph authentication on page load...');
      await checkMicrosoftGraphAuth();
    };
    
    checkAuthOnLoad();
  }, []); // Run only once on component mount

  const categories = [
    { id: 'general', name: 'Generelt', icon: Settings },
    { id: 'users', name: 'Brukere', icon: Users },
    { id: 'company', name: 'Bedrift', icon: Building },
    { id: 'email', name: 'E-postadministrasjon', icon: Mail },
    { id: 'notifications', name: 'Varsler', icon: Bell },
    { id: 'security', name: 'Sikkerhet', icon: Shield },
    { id: 'database', name: 'Database', icon: Database },
    { id: 'appearance', name: 'Utseende', icon: Palette },
    { id: 'advanced', name: 'Avansert', icon: Zap }
  ];

  const filteredSettings = settings.filter(setting => {
    const matchesSearch = setting.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         setting.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         setting.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = activeCategory === 'all' || setting.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const handleEdit = (settingId: string) => {
    setEditingSetting(settingId);
    const setting = settings.find(s => s.id === settingId);
    if (setting) {
      setTempValues({ ...tempValues, [settingId]: setting.value });
    }
  };

  const handleSave = (settingId: string) => {
    const newValue = tempValues[settingId];
    setSettings(prev => prev.map(s => 
      s.id === settingId 
        ? { ...s, value: newValue, updatedAt: new Date().toISOString() }
        : s
    ));
    setEditingSetting(null);
    setTempValues(prev => {
      const newTemp = { ...prev };
      delete newTemp[settingId];
      return newTemp;
    });
  };

  const handleCancel = (settingId: string) => {
    setEditingSetting(null);
    setTempValues(prev => {
      const newTemp = { ...prev };
      delete newTemp[settingId];
      return newTemp;
    });
  };

  const handleReset = (settingId: string) => {
    const setting = settings.find(s => s.id === settingId);
    if (setting) {
      setSettings(prev => prev.map(s => 
        s.id === settingId 
          ? { ...s, value: s.defaultValue, updatedAt: new Date().toISOString() }
          : s
      ));
    }
  };


  const renderSettingValue = (setting: SystemSetting) => {
    if (editingSetting === setting.id) {
      const tempValue = tempValues[setting.id];
      
      switch (setting.type) {
        case 'toggle':
          return (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <button
                className={`btn ${tempValue ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setTempValues({ ...tempValues, [setting.id]: !tempValue })}
                style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
              >
                {tempValue ? <ToggleRight size={14} /> : <ToggleLeft size={14} />}
                {tempValue ? 'Aktiv' : 'Inaktiv'}
              </button>
            </div>
          );
        
        case 'text':
          return (
            <input
              type="text"
              value={String(tempValue || '')}
              onChange={(e) => setTempValues({ ...tempValues, [setting.id]: e.target.value })}
              className="form-input"
              style={{ width: '100%', padding: '0.5rem' }}
            />
          );
        
        case 'number':
          return (
            <input
              type="number"
              value={String(tempValue || '')}
              onChange={(e) => setTempValues({ ...tempValues, [setting.id]: Number(e.target.value) })}
              className="form-input"
              style={{ width: '100%', padding: '0.5rem' }}
            />
          );
        
        case 'select':
          return (
            <select
              value={String(tempValue || '')}
              onChange={(e) => setTempValues({ ...tempValues, [setting.id]: e.target.value })}
              className="form-select"
              style={{ width: '100%', padding: '0.5rem' }}
            >
              {setting.options?.map(option => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          );
        
        case 'textarea':
          return (
            <textarea
              value={String(tempValue || '')}
              onChange={(e) => setTempValues({ ...tempValues, [setting.id]: e.target.value })}
              className="form-textarea"
              style={{ width: '100%', padding: '0.5rem', minHeight: '80px' }}
            />
          );
        
        case 'color':
          return (
            <input
              type="color"
              value={String(tempValue || '#3b82f6')}
              onChange={(e) => setTempValues({ ...tempValues, [setting.id]: e.target.value })}
              style={{ width: '50px', height: '40px', border: 'none', borderRadius: '4px' }}
            />
          );
        
        case 'file':
          return (
            <input
              type="file"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  setTempValues({ ...tempValues, [setting.id]: file.name });
                }
              }}
              className="form-input"
              style={{ width: '100%', padding: '0.5rem' }}
            />
          );
        
        default:
          return null;
      }
    } else {
      // Display mode
      switch (setting.type) {
        case 'toggle':
          return (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div className={`badge ${setting.value ? 'badge-success' : 'badge-secondary'}`}>
                {setting.value ? 'Aktiv' : 'Inaktiv'}
              </div>
            </div>
          );
        
        case 'color':
          return (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div 
                style={{ 
                  width: '20px', 
                  height: '20px', 
                  backgroundColor: setting.value as string || '#ffffff', 
                  borderRadius: '4px',
                  border: '1px solid #ddd'
                }} 
              />
              <span style={{ fontSize: '0.875rem', color: '#666' }}>
                {setting.value}
              </span>
            </div>
          );
        
        case 'file':
          return (
            <span style={{ fontSize: '0.875rem', color: '#666' }}>
              {setting.value ? 'Fil valgt' : 'Ingen fil'}
            </span>
          );
        
        default:
          return (
            <span style={{ fontSize: '0.875rem', color: '#666' }}>
              {String(setting.value || 'Ikke satt')}
            </span>
          );
      }
    }
  };

  const getCategoryIcon = (categoryId: string) => {
    const category = categories.find(c => c.id === categoryId);
    return category?.icon || Settings;
  };

  if (loading) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
        <div className="loading" style={{ margin: '0 auto 1rem' }}></div>
        <p style={{ color: '#666' }}>Laster systeminnstillinger...</p>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div>
      {/* Page Header */}
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
          <div className="card-icon">
            <Settings />
          </div>
          <div>
            <h1 className="page-title">⚙️ Systeminnstillinger</h1>
            <p className="page-subtitle">
              Kontroller alle aspekter av DriftPro-systemet
            </p>
          </div>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <span className="badge badge-primary">
            {settings.length} innstillinger
          </span>
          <span className="badge badge-secondary">
            {categories.length} kategorier
          </span>
          <button 
            className="btn btn-secondary"
            onClick={() => setShowAdvanced(!showAdvanced)}
          >
            {showAdvanced ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            {showAdvanced ? 'Skjul avanserte' : 'Vis avanserte'}
          </button>
          <button 
            className="btn btn-error"
            onClick={async () => {
              if (confirm('Er du sikker på at du vil logge ut?')) {
                try {
                  await logout();
                  // Redirect to login page after successful logout
                  window.location.href = '/login';
                } catch (error) {
                  console.error('Error during logout:', error);
                  alert('Feil ved utlogging. Prøv igjen.');
                }
              }
            }}
            style={{ marginLeft: 'auto' }}
          >
            <LogOut size={16} />
            Logg ut
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-number">{settings.length}</div>
          <div className="stat-label">Totalt innstillinger</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{settings.filter(s => s.value !== s.defaultValue).length}</div>
          <div className="stat-label">Endret</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{categories.length}</div>
          <div className="stat-label">Kategorier</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{new Date().toLocaleDateString('no-NO')}</div>
          <div className="stat-label">Sist oppdatert</div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '2rem', marginTop: '2rem' }}>
        {/* Categories Sidebar */}
        <div style={{ width: '250px', flexShrink: 0 }}>
          <div className="card">
            <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem', fontWeight: '600' }}>
              Kategorier
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <button
                className={`btn ${activeCategory === 'all' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setActiveCategory('all')}
                style={{ justifyContent: 'flex-start', textAlign: 'left' }}
              >
                <Settings size={16} />
                Alle innstillinger
              </button>
              {categories.map(category => {
                const IconComponent = category.icon;
                const isAdvanced = category.id === 'advanced';
                if (isAdvanced && !showAdvanced) return null;
                
                return (
                  <button
                    key={category.id}
                    className={`btn ${activeCategory === category.id ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setActiveCategory(category.id)}
                    style={{ justifyContent: 'flex-start', textAlign: 'left' }}
                  >
                    <IconComponent size={16} />
                    {category.name}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Settings Content */}
        <div style={{ flex: '1' }}>
          {/* Search */}
          <div className="card" style={{ marginBottom: '2rem' }}>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <div className="search-container" style={{ flex: '1', minWidth: '300px' }}>
                <Search className="search-icon" />
                <input
                  type="text"
                  placeholder="Søk i innstillinger..."
                  className="search-input"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </div>


          {/* Settings List */}
          {filteredSettings.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
              <div style={{ marginBottom: '1rem' }}>
                <Settings style={{ width: '48px', height: '48px', color: '#ccc', margin: '0 auto' }} />
              </div>
              <h3 style={{ color: '#666', marginBottom: '0.5rem' }}>Ingen innstillinger funnet</h3>
              <p style={{ color: '#999', marginBottom: '1.5rem' }}>
                {searchTerm 
                  ? 'Prøv å endre søkekriteriene' 
                  : 'Ingen innstillinger i denne kategorien'}
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {filteredSettings.map((setting) => {
                const IconComponent = getCategoryIcon(setting.category);
                const isModified = setting.value !== setting.defaultValue;
                
                return (
                  <div key={setting.id} className="card">
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                      <div className="card-icon">
                        <IconComponent />
                      </div>
                      
                      <div style={{ flex: '1' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                          <h3 style={{ 
                            fontWeight: '600', 
                            color: '#333',
                            fontSize: '1.1rem',
                            margin: 0
                          }}>
                            {setting.name}
                          </h3>
                          {isModified && (
                            <span className="badge badge-warning" style={{ fontSize: '0.75rem' }}>
                              Endret
                            </span>
                          )}
                          {setting.required && (
                            <span className="badge badge-error" style={{ fontSize: '0.75rem' }}>
                              Påkrevd
                            </span>
                          )}
                        </div>
                        
                        <p style={{ color: '#666', fontSize: '0.875rem', marginBottom: '1rem' }}>
                          {setting.description}
                        </p>
                        
                        <div style={{ marginBottom: '1rem' }}>
                          {renderSettingValue(setting)}
                        </div>
                        
                        <div style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: '0.5rem',
                          fontSize: '0.75rem',
                          color: '#999'
                        }}>
                          <Clock size={12} />
                          <span>Oppdatert: {new Date(setting.updatedAt).toLocaleDateString('no-NO')}</span>
                        </div>
                      </div>
                      
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {editingSetting === setting.id ? (
                          <>
                            <button
                              className="btn btn-primary"
                              onClick={() => handleSave(setting.id)}
                              style={{ padding: '0.5rem', fontSize: '0.75rem' }}
                            >
                              <Save size={14} />
                              Lagre
                            </button>
                            <button
                              className="btn btn-secondary"
                              onClick={() => handleCancel(setting.id)}
                              style={{ padding: '0.5rem', fontSize: '0.75rem' }}
                            >
                              <X size={14} />
                              Avbryt
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              className="btn btn-secondary"
                              onClick={() => handleEdit(setting.id)}
                              style={{ padding: '0.5rem', fontSize: '0.75rem' }}
                            >
                              <Edit size={14} />
                              Rediger
                            </button>
                            {isModified && (
                              <button
                                className="btn btn-secondary"
                                onClick={() => handleReset(setting.id)}
                                style={{ padding: '0.5rem', fontSize: '0.75rem' }}
                              >
                                <RotateCcw size={14} />
                                Tilbakestill
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Email Administration Section */}
      {activeCategory === 'email' && (
        <div style={{ marginTop: '2rem' }}>
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
              <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
                <Mail size={20} />
                E-postadministrasjon
              </h2>
              
              {/* Microsoft Graph Authentication Status */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div style={{
                    width: '12px',
                    height: '12px',
                    borderRadius: '50%',
                    background: isMicrosoftAuthenticated ? '#10b981' : '#ef4444'
                  }}></div>
                  <span style={{ 
                    fontSize: '0.875rem', 
                    fontWeight: '500',
                    color: isMicrosoftAuthenticated ? '#10b981' : '#ef4444'
                  }}>
                    {isMicrosoftAuthenticated ? `Microsoft Graph: ${microsoftAccount?.username}` : 'Microsoft Graph: Ikke logget inn'}
                  </span>
                </div>
                
                {isMicrosoftAuthenticated ? (
                  <button
                    className="btn btn-secondary"
                    onClick={handleMicrosoftLogout}
                    style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}
                  >
                    Logg ut Microsoft
                  </button>
                ) : (
                  <button
                    className="btn btn-primary"
                    onClick={handleMicrosoftLogin}
                    disabled={isMicrosoftAuthenticating}
                    style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}
                  >
                    {isMicrosoftAuthenticating ? 'Logger inn...' : 'Logg inn Microsoft'}
                  </button>
                )}
                
                {microsoftAuthError && (
                  <div style={{ color: '#ef4444', fontSize: '0.75rem', marginLeft: '0.5rem' }}>
                    {microsoftAuthError}
                  </div>
                )}
              </div>
            </div>
            
            {/* Login Status Message */}
            {loginMessage && (
              <div style={{
                padding: '1rem',
                borderRadius: '6px',
                background: loginStatus === 'logged_in' ? '#d4edda' : 
                           loginStatus === 'error' ? '#f8d7da' : '#d1ecf1',
                color: loginStatus === 'logged_in' ? '#155724' : 
                       loginStatus === 'error' ? '#721c24' : '#0c5460',
                border: `1px solid ${loginStatus === 'logged_in' ? '#c3e6cb' : 
                                   loginStatus === 'error' ? '#f5c6cb' : '#bee5eb'}`,
                marginBottom: '1.5rem'
              }}>
                {loginMessage}
              </div>
            )}
            
            

            {/* Email Templates Section */}
            <div style={{ marginBottom: '2rem' }}>
              <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <FileText size={16} />
                E-postmaler
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
                {emailTemplates.map((template) => (
                  <div key={template.id} className="card" style={{ padding: '1rem' }}>
                    <h4 style={{ marginBottom: '0.5rem', fontSize: '1rem' }}>{template.name}</h4>
                    <p style={{ color: '#666', fontSize: '0.875rem', marginBottom: '1rem' }}>
                      {template.description}
                    </p>
                    <button
                      className="btn btn-secondary"
                      onClick={() => sendTestEmail(template.name)}
                      disabled={emailTestStatus === 'testing'}
                      style={{ width: '100%', padding: '0.5rem' }}
                    >
                      📧 Send test
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Notification Settings Section */}
            <div style={{ marginBottom: '2rem' }}>
              <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Bell size={16} />
                Varslingsinnstillinger
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {notificationSettings.map((notification) => (
                  <div key={notification.id} className="card" style={{ padding: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div>
                        <h4 style={{ marginBottom: '0.25rem', fontSize: '1rem' }}>{notification.name}</h4>
                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                          {notification.recipients.map((recipient: string) => (
                            <span key={recipient} className="badge badge-secondary" style={{ fontSize: '0.75rem' }}>
                              {recipient}
                            </span>
                          ))}
                        </div>
                      </div>
                      <button
                        className={`btn ${notification.enabled ? 'btn-success' : 'btn-secondary'}`}
                        onClick={() => {
                          setNotificationSettings(prev => 
                            prev.map(n => 
                              n.id === notification.id 
                                ? { ...n, enabled: !n.enabled }
                                : n
                            )
                          );
                        }}
                        style={{ padding: '0.5rem 1rem' }}
                      >
                        {notification.enabled ? 'Aktivert' : 'Deaktivert'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Email Logs Section */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <h3 style={{ fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Activity size={16} />
                  E-postlogg
                </h3>
                <button
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowEmailLogs(!showEmailLogs);
                    if (!showEmailLogs) loadEmailLogs();
                  }}
                  style={{ padding: '0.5rem 1rem' }}
                >
                  {showEmailLogs ? '📋 Skjul logg' : '📋 Vis logg'}
                </button>
              </div>
              
              {showEmailLogs && (
                <div className="card">
                  <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                    {emailLogs.length === 0 ? (
                      <p style={{ color: '#666', textAlign: 'center', padding: '2rem' }}>
                        Ingen e-postlogg tilgjengelig
                      </p>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {emailLogs.map((log) => (
                          <div key={log.id} style={{ 
                            padding: '1rem', 
                            borderBottom: '1px solid #eee',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between'
                          }}>
                            <div>
                              <div style={{ fontWeight: '500', marginBottom: '0.25rem' }}>
                                {log.subject}
                              </div>
                              <div style={{ fontSize: '0.875rem', color: '#666' }}>
                                Til: {log.to} • {log.type}
                              </div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                              <span className={`badge ${log.status === 'sent' ? 'badge-success' : 'badge-error'}`}>
                                {log.status}
                              </span>
                              <div style={{ fontSize: '0.75rem', color: '#999', marginTop: '0.25rem' }}>
                                {new Date(log.timestamp).toLocaleString('no-NO')}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Office 365 Login Modal */}
      {showLoginModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '2rem',
            width: '90%',
            maxWidth: '500px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
              <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '600' }}>
                🔐 Logg inn til Office 365
              </h2>
              <button
                onClick={() => setShowLoginModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '1.5rem',
                  cursor: 'pointer',
                  color: '#6b7280'
                }}
              >
                ×
              </button>
            </div>
            
            <p style={{ color: '#666', marginBottom: '1.5rem' }}>
              Skriv inn dine Office 365-legitimasjoner for å aktivere e-postfunksjonalitet.
            </p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                  E-postadresse:
                </label>
                <input
                  type="email"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="din-epost@dittdomene.no"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    fontSize: '0.875rem'
                  }}
                />
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                  Passord:
                </label>
                <input
                  type="password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="Ditt Office 365 passord"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    fontSize: '0.875rem'
                  }}
                />
              </div>
            </div>
            
            {loginMessage && (
              <div style={{
                padding: '1rem',
                borderRadius: '6px',
                background: loginStatus === 'logged_in' ? '#d4edda' : 
                           loginStatus === 'error' ? '#f8d7da' : '#d1ecf1',
                color: loginStatus === 'logged_in' ? '#155724' : 
                       loginStatus === 'error' ? '#721c24' : '#0c5460',
                border: `1px solid ${loginStatus === 'logged_in' ? '#c3e6cb' : 
                                   loginStatus === 'error' ? '#f5c6cb' : '#bee5eb'}`,
                marginBottom: '1rem'
              }}>
                {loginMessage}
              </div>
            )}
            
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
              <button
                className="btn btn-secondary"
                onClick={() => setShowLoginModal(false)}
                disabled={isLoggingIn}
                style={{ padding: '0.75rem 1.5rem' }}
              >
                Avbryt
              </button>
              <button
                className="btn btn-primary"
                onClick={loginToOffice365}
                disabled={isLoggingIn || !loginEmail || !loginPassword}
                style={{ padding: '0.75rem 1.5rem' }}
              >
                {isLoggingIn ? 'Logger inn...' : 'Logg inn'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sender Configuration Modal */}
      {showSenderConfig && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '2rem',
            width: '90%',
            maxWidth: '500px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
              <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '600' }}>
                ✉️ Konfigurer avsender
              </h2>
              <button
                onClick={() => setShowSenderConfig(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '1.5rem',
                  cursor: 'pointer',
                  color: '#6b7280'
                }}
              >
                ×
              </button>
            </div>
            
            <p style={{ color: '#666', marginBottom: '1.5rem' }}>
              Konfigurer hvordan e-postene fra DriftPro skal vises som avsender.
            </p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                  Avsender navn:
                </label>
                <input
                  type="text"
                  value={senderName}
                  onChange={(e) => setSenderName(e.target.value)}
                  placeholder="DriftPro System"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    fontSize: '0.875rem'
                  }}
                />
                <p style={{ fontSize: '0.75rem', color: '#666', marginTop: '0.25rem' }}>
                  Dette navnet vil vises som avsender i alle e-poster
                </p>
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                  Avsender e-post:
                </label>
                <input
                  type="email"
                  value={senderEmail}
                  onChange={(e) => setSenderEmail(e.target.value)}
                  placeholder="din-epost@dittdomene.no"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    fontSize: '0.875rem'
                  }}
                />
                <p style={{ fontSize: '0.75rem', color: '#666', marginTop: '0.25rem' }}>
                  Denne e-postadressen vil vises som avsender (kan være forskjellig fra innloggings-e-post)
                </p>
              </div>
            </div>
            
            <div style={{ 
              background: '#f8f9fa', 
              padding: '1rem', 
              borderRadius: '6px', 
              marginBottom: '1rem',
              border: '1px solid #e9ecef'
            }}>
              <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.875rem', fontWeight: '600' }}>
                📧 Forhåndsvisning:
              </h4>
              <p style={{ margin: 0, fontSize: '0.875rem', color: '#666' }}>
                Fra: <strong>{senderName || 'DriftPro System'}</strong> &lt;{senderEmail || 'din-epost@dittdomene.no'}&gt;
              </p>
            </div>
            
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
              <button
                className="btn btn-secondary"
                onClick={() => setShowSenderConfig(false)}
                style={{ padding: '0.75rem 1.5rem' }}
              >
                Avbryt
              </button>
              <button
                className="btn btn-primary"
                onClick={saveSenderConfiguration}
                disabled={!senderName || !senderEmail}
                style={{ padding: '0.75rem 1.5rem' }}
              >
                Lagre konfigurasjon
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </ErrorBoundary>
  );
} 