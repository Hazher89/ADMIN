'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { emailService, EmailLog } from '@/lib/email-service';
import { 
  Search, Filter, Mail, Clock, CheckCircle, AlertTriangle, XCircle,
  Eye, Download, RefreshCw, Send, User, Calendar, FileText,
  Settings, Bell, UserPlus, Save, TestTube, EyeOff
} from 'lucide-react';

interface EmailSettings {
  // General settings
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
  
  // Templates
  adminSetupTemplate: string;
  deviationReportTemplate: string;
  deviationResolvedTemplate: string;
  userWelcomeTemplate: string;
  notificationTemplate: string;
  warningTemplate: string;
  systemAlertTemplate: string;
  
  // SMTP settings
  smtpHost: string;
  smtpPort: number;
  smtpUser: string;
  smtpSecure: boolean;
  
  // Advanced settings
  retryAttempts: number;
  retryDelay: number;
  maxEmailsPerHour: number;
  logAllEmails: boolean;
}

export default function EmailLogsPage() {
  const { userProfile } = useAuth();
  const [emailLogs, setEmailLogs] = useState<EmailLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [activeTab, setActiveTab] = useState('logs');
  
  // Email control states
  const [settings, setSettings] = useState<EmailSettings>({
    enabled: true,
    fromEmail: 'noreply@driftpro.no',
    fromName: 'DriftPro System',
    adminSetup: true,
    deviationReports: true,
    deviationResolved: true,
    userWelcome: true,
    notifications: true,
    warnings: true,
    systemAlerts: true,
    adminSetupTemplate: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Velkommen til DriftPro</title>
</head>
<body>
  <h1>Velkommen til DriftPro</h1>
  <p>Hei {{adminName}},</p>
  <p>Du har blitt utnevnt som administrator for {{companyName}}.</p>
  <p>Klikk på lenken nedenfor for å sette opp passordet ditt:</p>
  <a href="{{setupUrl}}">Sett opp passord</a>
  <p>Lenken utløper om 24 timer.</p>
  <p>Med vennlig hilsen,<br>DriftPro Team</p>
</body>
</html>`,
    deviationReportTemplate: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Ny avviksrapport</title>
</head>
<body>
  <h1>Ny avviksrapport</h1>
  <p>Et nytt avvik har blitt rapportert:</p>
  <ul>
    <li><strong>Avvik:</strong> {{deviationTitle}}</li>
    <li><strong>Beskrivelse:</strong> {{deviationDescription}}</li>
    <li><strong>Rapportert av:</strong> {{reportedBy}}</li>
    <li><strong>Dato:</strong> {{reportedDate}}</li>
    <li><strong>Prioritet:</strong> {{priority}}</li>
  </ul>
  <p>Klikk <a href="{{deviationUrl}}">her</a> for å se detaljer.</p>
</body>
</html>`,
    deviationResolvedTemplate: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Avvik løst</title>
</head>
<body>
  <h1>Avvik løst</h1>
  <p>Følgende avvik har blitt løst:</p>
  <ul>
    <li><strong>Avvik:</strong> {{deviationTitle}}</li>
    <li><strong>Løst av:</strong> {{resolvedBy}}</li>
    <li><strong>Dato:</strong> {{resolvedDate}}</li>
    <li><strong>Løsning:</strong> {{resolution}}</li>
  </ul>
</body>
</html>`,
    userWelcomeTemplate: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Velkommen til DriftPro</title>
</head>
<body>
  <h1>Velkommen til DriftPro</h1>
  <p>Hei {{userName}},</p>
  <p>Velkommen til {{companyName}} på DriftPro!</p>
  <p>Din konto er nå aktiv og du kan logge inn på systemet.</p>
  <p>Med vennlig hilsen,<br>DriftPro Team</p>
</body>
</html>`,
    notificationTemplate: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>{{subject}}</title>
</head>
<body>
  <h1>{{subject}}</h1>
  <p>{{message}}</p>
  <p>Med vennlig hilsen,<br>DriftPro Team</p>
</body>
</html>`,
    warningTemplate: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Advarsel - {{subject}}</title>
</head>
<body>
  <h1>Advarsel</h1>
  <p>{{message}}</p>
  <p>Dette er en automatisk advarsel fra DriftPro-systemet.</p>
</body>
</html>`,
    systemAlertTemplate: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Systemadvarsel</title>
</head>
<body>
  <h1>Systemadvarsel</h1>
  <p>{{message}}</p>
  <p>Dette er en systemadvarsel fra DriftPro.</p>
</body>
</html>`,
    smtpHost: 'smtp.office365.com',
    smtpPort: 587,
    smtpUser: 'noreply@driftpro.no',
    smtpSecure: false,
    retryAttempts: 3,
    retryDelay: 5000,
    maxEmailsPerHour: 100,
    logAllEmails: true
  });
  
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testEmail, setTestEmail] = useState('');
  const [testType, setTestType] = useState('notification');
  const [message, setMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [smtpPassword, setSmtpPassword] = useState('');

  useEffect(() => {
    if (userProfile?.companyId) {
      loadEmailLogs();
    }
    if (userProfile?.role === 'admin') {
      loadEmailSettings();
    }
  }, [userProfile?.companyId, userProfile?.role]);

  const loadEmailLogs = async () => {
    if (!userProfile?.companyId) return;

    try {
      setLoading(true);
      
      // Load email logs from API
      const response = await fetch('/api/email-logs');
      if (response.ok) {
        const logs = await response.json();
        setEmailLogs(logs);
      } else {
        setEmailLogs([]);
      }
    } catch (error) {
      console.error('Error loading email logs:', error);
      setEmailLogs([]);
    } finally {
      setLoading(false);
    }
  };

  const loadEmailSettings = async () => {
    try {
      const response = await fetch('/api/email-settings');
      if (response.ok) {
        const data = await response.json();
        setSettings(prev => ({ ...prev, ...data }));
      }
    } catch (error) {
      console.error('Error loading email settings:', error);
    }
  };

  const saveSettings = async () => {
    try {
      setSaving(true);
      const response = await fetch('/api/email-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...settings,
          smtpPassword: smtpPassword || undefined
        })
      });
      
      if (response.ok) {
        setMessage('Innstillinger lagret!');
        setTimeout(() => setMessage(''), 3000);
      } else {
        setMessage('Feil ved lagring av innstillinger');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      setMessage('Feil ved lagring av innstillinger');
    } finally {
      setSaving(false);
    }
  };

  const sendTestEmail = async () => {
    if (!testEmail || !testType) {
      setMessage('Vennligst fyll ut e-post og velg type');
      return;
    }

    try {
      setTesting(true);
      const response = await fetch('/api/send-test-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: testEmail,
          type: testType,
          settings
        })
      });
      
      if (response.ok) {
        setMessage('Test-e-post sendt!');
        setTestEmail('');
      } else {
        const error = await response.json();
        setMessage(`Feil: ${error.error}`);
      }
    } catch (error) {
      console.error('Error sending test email:', error);
      setMessage('Feil ved sending av test-e-post');
    } finally {
      setTesting(false);
    }
  };

  const toggleEmailType = (type: keyof EmailSettings) => {
    setSettings(prev => ({
      ...prev,
      [type]: !prev[type]
    }));
  };

  const updateTemplate = (templateKey: keyof EmailSettings, value: string) => {
    setSettings(prev => ({
      ...prev,
      [templateKey]: value
    }));
  };

  const filteredEmailLogs = emailLogs.filter(log => {
    const matchesSearch = log.to.some(email => email.toLowerCase().includes(searchTerm.toLowerCase())) ||
                         log.subject.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = selectedStatus === 'all' || log.status === selectedStatus;
    const matchesType = selectedType === 'all' || log.type === selectedType;
    return matchesSearch && matchesStatus && matchesType;
  });

  const statuses = ['all', ...Array.from(new Set(emailLogs.map(log => log.status)))];
  const types = ['all', ...Array.from(new Set(emailLogs.map(log => log.type)))];

  const getStatusColor = (status: EmailLog['status']) => {
    switch (status) {
      case 'sent': return '#10b981';
      case 'failed': return '#ef4444';
    }
  };

  const getStatusIcon = (status: EmailLog['status']) => {
    switch (status) {
      case 'sent': return <CheckCircle style={{ width: '16px', height: '16px', color: '#10b981' }} />;
      case 'failed': return <XCircle style={{ width: '16px', height: '16px', color: '#ef4444' }} />;
    }
  };

  const getStatusLabel = (status: EmailLog['status']) => {
    switch (status) {
      case 'sent': return 'Sendt';
      case 'failed': return 'Feilet';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'deviation_reported': return 'Avvik rapportert';
      case 'deviation_assigned': return 'Avvik tildelt';
      case 'deviation_resolved': return 'Avvik løst';
      case 'vacation_requested': return 'Ferie forespurt';
      case 'vacation_approved': return 'Ferie godkjent';
      case 'vacation_rejected': return 'Ferie avvist';
      case 'absence_requested': return 'Fravær forespurt';
      case 'absence_approved': return 'Fravær godkjent';
      case 'absence_rejected': return 'Fravær avvist';
      case 'shift_assigned': return 'Skift tildelt';
      case 'shift_updated': return 'Skift oppdatert';
      case 'shift_cancelled': return 'Skift kansellert';
      case 'document_shared': return 'Dokument delt';
      case 'chat_message': return 'Chat melding';
      case 'employee_added': return 'Ansatt lagt til';
      case 'employee_updated': return 'Ansatt oppdatert';
      case 'employee_removed': return 'Ansatt fjernet';
      case 'password_reset': return 'Passord tilbakestilling';
      case 'welcome_email': return 'Velkomst e-post';
      case 'system_maintenance': return 'System vedlikehold';
      case 'security_alert': return 'Sikkerhetsvarsel';
      case 'test_email': return 'Test e-post';
      default: return type;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('nb-NO');
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('nb-NO', { hour: '2-digit', minute: '2-digit' });
  };

  const resendEmail = async (emailLog: EmailLog) => {
    try {
      // For now, just show a message that resend is not implemented
      alert('Funksjon for å sende e-post på nytt er ikke implementert ennå');
    } catch (error) {
      console.error('Error resending email:', error);
      alert('Feil ved sending av e-post på nytt');
    }
  };

  const exportLogs = async () => {
    try {
      if (!userProfile?.companyId) return;
      
      // Create simple CSV export
      const csvContent = [
        'Dato,Tid,Status,Type,Emne,Mottaker,Feil',
        ...emailLogs.map(log => [
          new Date(log.sentAt).toLocaleDateString('nb-NO'),
          new Date(log.sentAt).toLocaleTimeString('nb-NO'),
          log.status,
          log.type || 'unknown',
          `"${log.subject}"`,
          `"${log.to.join(', ')}"`,
          log.error ? `"${log.error}"` : ''
        ].join(','))
      ].join('\n');
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `email-logs-${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error exporting logs:', error);
      alert('Feil ved eksport av logger');
    }
  };

  // Check if user has access to email control
  const canAccessEmailControl = userProfile?.role === 'admin';

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">E-post</h1>
              <p className="text-gray-600">Administrer e-post-innstillinger og se logger</p>
            </div>
            <div className="flex items-center space-x-2">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                settings.enabled ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
              }`}>
                {settings.enabled ? "Aktiv" : "Inaktiv"}
              </span>
              <button
                onClick={loadEmailLogs}
                className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50 flex items-center"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Oppdater
              </button>
            </div>
          </div>
        </div>

        {message && (
          <div className={`p-4 rounded-lg mb-6 ${
            message.includes('Feil') ? 'bg-red-50 border border-red-200' : 'bg-green-50 border border-green-200'
          }`}>
            <div className="flex items-center">
              {message.includes('Feil') ? (
                <XCircle className="h-5 w-5 text-red-500 mr-2" />
              ) : (
                <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
              )}
              <p className={message.includes('Feil') ? 'text-red-700' : 'text-green-700'}>{message}</p>
            </div>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'logs', label: 'E-post-logger', icon: Mail },
              ...(canAccessEmailControl ? [
                { id: 'settings', label: 'Innstillinger', icon: Settings },
                { id: 'templates', label: 'Maler', icon: FileText },
                { id: 'smtp', label: 'SMTP', icon: Settings },
                { id: 'test', label: 'Test', icon: TestTube }
              ] : [])
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon className="h-4 w-4 mr-2" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Email Logs Tab */}
        {activeTab === 'logs' && (
          <div className="bg-white shadow rounded-lg">
            {/* Filters */}
            <div className="p-6 border-b border-gray-200">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <input
                      type="text"
                      placeholder="Søk i e-post-logger..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {statuses.map(status => (
                      <option key={status} value={status}>
                        {status === 'all' ? 'Alle statuser' : getStatusLabel(status as EmailLog['status'])}
                      </option>
                    ))}
                  </select>
                  
                  <select
                    value={selectedType}
                    onChange={(e) => setSelectedType(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {types.map(type => (
                      <option key={type} value={type}>
                        {type === 'all' ? 'Alle typer' : getTypeLabel(type)}
                      </option>
                    ))}
                  </select>
                  
                  <button
                    onClick={exportLogs}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Eksporter
                  </button>
                </div>
              </div>
            </div>

            {/* Email Logs Grid */}
            <div className="p-6">
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-2 text-gray-600">Laster e-post-logger...</p>
                </div>
              ) : emailLogs.length === 0 ? (
                <div className="text-center py-8">
                  <Mail className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">Ingen e-post-logger</h3>
                  <p className="mt-1 text-sm text-gray-500">Ingen e-poster har blitt sendt ennå.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredEmailLogs.map((log) => (
                    <div key={log.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          {getStatusIcon(log.status)}
                          <div>
                            <h3 className="text-sm font-medium text-gray-900">{log.subject}</h3>
                                                         <p className="text-sm text-gray-500">
                               Til: {log.to.join(', ')} • {getTypeLabel(log.type || 'unknown')}
                             </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-gray-500">
                            {formatDate(log.sentAt)} {formatTime(log.sentAt)}
                          </span>
                          
                          <button
                            onClick={() => resendEmail(log)}
                            className="p-1 text-gray-400 hover:text-gray-600"
                            title="Send på nytt"
                          >
                            <Send className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                      
                      {log.error && (
                        <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                          Feil: {log.error}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && canAccessEmailControl && (
          <div className="space-y-6">
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center">
                <Settings className="h-5 w-5 mr-2" />
                Generelle innstillinger
              </h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="font-medium">Aktiver e-post-system</label>
                    <p className="text-sm text-gray-600">
                      Slå av/på hele e-post-systemet
                    </p>
                  </div>
                  <button
                    onClick={() => setSettings(prev => ({ ...prev, enabled: !prev.enabled }))}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      settings.enabled ? 'bg-blue-600' : 'bg-gray-200'
                    }`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.enabled ? 'translate-x-6' : 'translate-x-1'
                    }`} />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Avsender e-post
                    </label>
                    <input
                      type="email"
                      value={settings.fromEmail}
                      onChange={(e) => setSettings(prev => ({ ...prev, fromEmail: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="noreply@driftpro.no"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Avsender navn
                    </label>
                    <input
                      type="text"
                      value={settings.fromName}
                      onChange={(e) => setSettings(prev => ({ ...prev, fromName: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="DriftPro System"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center">
                <Bell className="h-5 w-5 mr-2" />
                E-post-typer
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { key: 'adminSetup', label: 'Admin-oppsett', description: 'E-post til nye administratorer', icon: UserPlus, color: 'blue' },
                  { key: 'deviationReports', label: 'Avviksrapporter', description: 'Nye avviksrapporter', icon: AlertTriangle, color: 'red' },
                  { key: 'deviationResolved', label: 'Avvik løst', description: 'Når avvik blir løst', icon: CheckCircle, color: 'green' },
                  { key: 'userWelcome', label: 'Velkomstmeldinger', description: 'Velkomst til nye brukere', icon: Mail, color: 'purple' },
                  { key: 'notifications', label: 'Varsler', description: 'Generelle varsler', icon: Bell, color: 'orange' },
                  { key: 'warnings', label: 'Advarsler', description: 'Systemadvarsler', icon: AlertTriangle, color: 'yellow' }
                ].map((item) => (
                  <div key={item.key} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <item.icon className={`h-5 w-5 text-${item.color}-500`} />
                      <div>
                        <label className="font-medium">{item.label}</label>
                        <p className="text-sm text-gray-600">{item.description}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => toggleEmailType(item.key as keyof EmailSettings)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        settings[item.key as keyof EmailSettings] ? 'bg-blue-600' : 'bg-gray-200'
                      }`}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        settings[item.key as keyof EmailSettings] ? 'translate-x-6' : 'translate-x-1'
                      }`} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={saveSettings}
                disabled={saving}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center"
              >
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Lagrer...' : 'Lagre innstillinger'}
              </button>
            </div>
          </div>
        )}

        {/* Templates Tab */}
        {activeTab === 'templates' && canAccessEmailControl && (
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-semibold mb-4">E-post-maler</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Admin-oppsett mal
                </label>
                <textarea
                  value={settings.adminSetupTemplate}
                  onChange={(e) => updateTemplate('adminSetupTemplate', e.target.value)}
                  rows={10}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="HTML-mal for admin-oppsett e-post..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Avviksrapport mal
                </label>
                <textarea
                  value={settings.deviationReportTemplate}
                  onChange={(e) => updateTemplate('deviationReportTemplate', e.target.value)}
                  rows={10}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="HTML-mal for avviksrapport e-post..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Varsel mal
                </label>
                <textarea
                  value={settings.notificationTemplate}
                  onChange={(e) => updateTemplate('notificationTemplate', e.target.value)}
                  rows={8}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="HTML-mal for varsel e-post..."
                />
              </div>
            </div>
          </div>
        )}

        {/* SMTP Tab */}
        {activeTab === 'smtp' && canAccessEmailControl && (
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-semibold mb-4">SMTP-innstillinger</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    SMTP-server
                  </label>
                  <input
                    type="text"
                    value={settings.smtpHost}
                    onChange={(e) => setSettings(prev => ({ ...prev, smtpHost: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="smtp.office365.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Port
                  </label>
                  <input
                    type="number"
                    value={settings.smtpPort}
                    onChange={(e) => setSettings(prev => ({ ...prev, smtpPort: parseInt(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="587"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Brukernavn
                  </label>
                  <input
                    type="text"
                    value={settings.smtpUser}
                    onChange={(e) => setSettings(prev => ({ ...prev, smtpUser: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="noreply@driftpro.no"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Passord
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={smtpPassword}
                      onChange={(e) => setSmtpPassword(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-0 top-0 h-full px-3 text-gray-500 hover:text-gray-700"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setSettings(prev => ({ ...prev, smtpSecure: !prev.smtpSecure }))}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.smtpSecure ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.smtpSecure ? 'translate-x-6' : 'translate-x-1'
                  }`} />
                </button>
                <label className="text-sm font-medium text-gray-700">Bruk SSL/TLS</label>
              </div>
            </div>
          </div>
        )}

        {/* Test Tab */}
        {activeTab === 'test' && canAccessEmailControl && (
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center">
              <TestTube className="h-5 w-5 mr-2" />
              Test e-post
            </h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mottaker e-post
                  </label>
                  <input
                    type="email"
                    value={testEmail}
                    onChange={(e) => setTestEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="test@example.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    E-post-type
                  </label>
                  <select
                    value={testType}
                    onChange={(e) => setTestType(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="admin_setup">Admin-oppsett</option>
                    <option value="deviation_report">Avviksrapport</option>
                    <option value="notification">Varsel</option>
                    <option value="warning">Advarsel</option>
                    <option value="welcome">Velkomst</option>
                  </select>
                </div>
              </div>

              <button
                onClick={sendTestEmail}
                disabled={testing || !testEmail}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center"
              >
                <Send className="h-4 w-4 mr-2" />
                {testing ? 'Sender...' : 'Send test-e-post'}
              </button>
            </div>
          </div>
        )}

        {/* Stats */}
        {activeTab === 'logs' && emailLogs.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
            <div className="bg-white p-4 rounded-lg shadow">
              <div className="flex items-center">
                <Mail className="h-8 w-8 text-blue-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-500">Totalt</p>
                  <div className="text-2xl font-semibold text-gray-900">{emailLogs.length}</div>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-4 rounded-lg shadow">
              <div className="flex items-center">
                <CheckCircle className="h-8 w-8 text-green-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-500">Sendt</p>
                  <div className="text-2xl font-semibold text-gray-900">
                    {emailLogs.filter(log => log.status === 'sent').length}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-4 rounded-lg shadow">
              <div className="flex items-center">
                <XCircle className="h-8 w-8 text-red-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-500">Feilet</p>
                  <div className="text-2xl font-semibold text-gray-900">
                    {emailLogs.filter(log => log.status === 'failed').length}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-4 rounded-lg shadow">
              <div className="flex items-center">
                <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium text-blue-600">%</span>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-500">Suksessrate</p>
                  <div className="text-2xl font-semibold text-gray-900">
                    {emailLogs.length > 0
                      ? Math.round((emailLogs.filter(log => log.status === 'sent').length / emailLogs.length) * 100)
                      : 0}%
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}