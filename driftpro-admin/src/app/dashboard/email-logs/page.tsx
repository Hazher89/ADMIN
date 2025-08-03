'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { emailService, EmailLog } from '@/lib/email-service';
import { 
  Search, Filter, Mail, Clock, CheckCircle, AlertTriangle, XCircle,
  Eye, Download, RefreshCw, Send, User, Calendar, FileText,
  Settings, Bell, UserPlus, Save, TestTube, EyeOff, TrendingUp
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
  const [testingSmtp, setTestingSmtp] = useState(false);

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
        
        // Don't update smtpPassword from server for security
        // The password field should remain empty until user types something
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
        
        // Reload settings to get the latest data
        await loadEmailSettings();
        
        // Clear the password field after successful save
        setSmtpPassword('');
        
        // Show success message for 3 seconds
        setTimeout(() => setMessage(''), 3000);
      } else {
        const errorData = await response.json().catch(() => ({}));
        setMessage(`Feil ved lagring av innstillinger: ${errorData.error || 'Ukjent feil'}`);
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

  const testSmtpConnection = async () => {
    if (!settings.smtpHost || !settings.smtpPort || !settings.smtpUser || !smtpPassword) {
      setMessage('Vennligst fyll ut alle SMTP-feltene først');
      return;
    }

    try {
      setTestingSmtp(true);
      const response = await fetch('/api/send-test-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: settings.smtpUser, // Send to self
          type: 'notification',
          settings: {
            ...settings,
            smtpPassword: smtpPassword
          }
        })
      });
      
      if (response.ok) {
        setMessage('SMTP-tilkobling testet! Sjekk innboksen din for test-e-post.');
      } else {
        const error = await response.json();
        setMessage(`SMTP-test feilet: ${error.error}`);
      }
    } catch (error) {
      console.error('Error testing SMTP:', error);
      setMessage('Feil ved testing av SMTP-tilkobling');
    } finally {
      setTestingSmtp(false);
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
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
          <div className="card-icon">
            <Mail />
          </div>
          <div>
            <h1 className="page-title">📧 E-post</h1>
            <p className="page-subtitle">
              Administrer e-post-innstillinger og se logger
            </p>
          </div>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <span className={`badge ${settings.enabled ? 'badge-success' : 'badge-secondary'}`}>
            {settings.enabled ? "Aktiv" : "Inaktiv"}
          </span>
          <button
            className="btn btn-secondary"
            onClick={loadEmailLogs}
          >
            <RefreshCw style={{ width: '16px', height: '16px' }} />
            Oppdater
          </button>
        </div>
      </div>

      {message && (
        <div className={`alert ${message.includes('Feil') ? 'alert-error' : 'alert-success'}`}>
          <div className="flex items-center">
            {message.includes('Feil') ? (
              <XCircle style={{ width: '16px', height: '16px' }} />
            ) : (
              <CheckCircle style={{ width: '16px', height: '16px' }} />
            )}
            <span>{message}</span>
          </div>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
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
              className={`btn ${activeTab === tab.id ? 'btn-primary' : 'btn-secondary'}`}
            >
              <tab.icon style={{ width: '16px', height: '16px' }} />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Email Logs Tab */}
      {activeTab === 'logs' && (
        <>
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
                className="form-input"
                style={{ width: '150px' }}
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
              >
                {statuses.map(status => (
                  <option key={status} value={status}>
                    {status === 'all' ? 'Alle statuser' : getStatusLabel(status as EmailLog['status'])}
                  </option>
                ))}
              </select>
              
              <select
                className="form-input"
                style={{ width: '150px' }}
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
              >
                {types.map(type => (
                  <option key={type} value={type}>
                    {type === 'all' ? 'Alle typer' : getTypeLabel(type)}
                  </option>
                ))}
              </select>
              
              <button
                onClick={exportLogs}
                className="btn btn-secondary"
              >
                <Download style={{ width: '16px', height: '16px' }} />
                Eksporter
              </button>
            </div>
          </div>

          {/* Email Logs Grid */}
          {loading ? (
            <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
              <div className="loading-spinner"></div>
              <p style={{ marginTop: '1rem', color: '#666' }}>Laster e-post-logger...</p>
            </div>
          ) : emailLogs.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
              <Mail style={{ width: '64px', height: '64px', color: '#9ca3af', margin: '0 auto 1rem' }} />
              <h3 style={{ marginBottom: '0.5rem', color: '#374151' }}>Ingen e-post-logger</h3>
              <p style={{ color: '#6b7280' }}>Ingen e-poster har blitt sendt ennå.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1">
              {filteredEmailLogs.map((log) => (
                <div key={log.id} className="card">
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', marginBottom: '1rem' }}>
                    <div className="card-icon">
                      {getStatusIcon(log.status)}
                    </div>
                    <div style={{ flex: '1' }}>
                      <h3 style={{ 
                        fontWeight: '600', 
                        color: '#333',
                        fontSize: '1.1rem',
                        marginBottom: '0.25rem'
                      }}>
                        {log.subject}
                      </h3>
                      <p style={{ color: '#666', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                        Til: {log.to.join(', ')} • {getTypeLabel(log.type || 'unknown')}
                      </p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                        <span className="badge" style={{ backgroundColor: getStatusColor(log.status) }}>
                          {getStatusLabel(log.status)}
                        </span>
                        <span style={{ color: '#666', fontSize: '0.875rem' }}>
                          {formatDate(log.sentAt)} {formatTime(log.sentAt)}
                        </span>
                      </div>
                      
                      {log.error && (
                        <div style={{ 
                          marginTop: '1rem', 
                          padding: '0.75rem', 
                          backgroundColor: '#fef2f2', 
                          border: '1px solid #fecaca', 
                          borderRadius: '0.375rem',
                          color: '#dc2626'
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <AlertTriangle style={{ width: '16px', height: '16px' }} />
                            <span>Feil: {log.error}</span>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        onClick={() => resendEmail(log)}
                        className="btn btn-secondary"
                        title="Send på nytt"
                      >
                        <Send style={{ width: '16px', height: '16px' }} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Stats */}
          {emailLogs.length > 0 && (
            <div className="grid grid-cols-4" style={{ marginTop: '2rem' }}>
              <div className="card">
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div className="card-icon">
                    <Mail />
                  </div>
                  <div>
                    <div style={{ fontSize: '1.5rem', fontWeight: '600', color: '#333' }}>
                      {emailLogs.length}
                    </div>
                    <div style={{ color: '#666', fontSize: '0.875rem' }}>Totalt</div>
                  </div>
                </div>
              </div>
              
              <div className="card">
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div className="card-icon">
                    <CheckCircle />
                  </div>
                  <div>
                    <div style={{ fontSize: '1.5rem', fontWeight: '600', color: '#333' }}>
                      {emailLogs.filter(log => log.status === 'sent').length}
                    </div>
                    <div style={{ color: '#666', fontSize: '0.875rem' }}>Sendt</div>
                  </div>
                </div>
              </div>
              
              <div className="card">
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div className="card-icon">
                    <XCircle />
                  </div>
                  <div>
                    <div style={{ fontSize: '1.5rem', fontWeight: '600', color: '#333' }}>
                      {emailLogs.filter(log => log.status === 'failed').length}
                    </div>
                    <div style={{ color: '#666', fontSize: '0.875rem' }}>Feilet</div>
                  </div>
                </div>
              </div>
              
              <div className="card">
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div className="card-icon">
                    <TrendingUp />
                  </div>
                  <div>
                    <div style={{ fontSize: '1.5rem', fontWeight: '600', color: '#333' }}>
                      {emailLogs.length > 0
                        ? Math.round((emailLogs.filter(log => log.status === 'sent').length / emailLogs.length) * 100)
                        : 0}%
                    </div>
                    <div style={{ color: '#666', fontSize: '0.875rem' }}>Suksessrate</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Settings Tab */}
      {activeTab === 'settings' && canAccessEmailControl && (
        <div className="space-y-6">
          <div className="card">
            <h2 className="card-title">
              <Settings style={{ width: '20px', height: '20px' }} />
              Generelle innstillinger
            </h2>
            <div className="space-y-4">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <label className="form-label">Aktiver e-post-system</label>
                  <p className="form-help">Slå av/på hele e-post-systemet</p>
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
                    placeholder="noreply@driftpro.no"
                  />
                </div>
                <div>
                  <label className="form-label">Avsender navn</label>
                  <input
                    type="text"
                    value={settings.fromName}
                    onChange={(e) => setSettings(prev => ({ ...prev, fromName: e.target.value }))}
                    className="form-input"
                    placeholder="DriftPro System"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <h2 className="card-title">
              <Bell style={{ width: '20px', height: '20px' }} />
              E-post-typer
            </h2>
            <div className="grid grid-cols-2 gap-4">
              {[
                { key: 'adminSetup', label: 'Admin-oppsett', description: 'E-post til nye administratorer', icon: UserPlus, color: 'blue' },
                { key: 'deviationReports', label: 'Avviksrapporter', description: 'Nye avviksrapporter', icon: AlertTriangle, color: 'red' },
                { key: 'deviationResolved', label: 'Avvik løst', description: 'Når avvik blir løst', icon: CheckCircle, color: 'green' },
                { key: 'userWelcome', label: 'Velkomstmeldinger', description: 'Velkomst til nye brukere', icon: Mail, color: 'purple' },
                { key: 'notifications', label: 'Varsler', description: 'Generelle varsler', icon: Bell, color: 'orange' },
                { key: 'warnings', label: 'Advarsler', description: 'Systemadvarsler', icon: AlertTriangle, color: 'yellow' }
              ].map((item) => (
                <div key={item.key} className="card">
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <div className="card-icon">
                        <item.icon />
                      </div>
                      <div>
                        <label className="form-label">{item.label}</label>
                        <p className="form-help">{item.description}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => toggleEmailType(item.key as keyof EmailSettings)}
                      className={`toggle-switch ${settings[item.key as keyof EmailSettings] ? 'active' : ''}`}
                    >
                      <span className="toggle-slider"></span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button
              onClick={saveSettings}
              disabled={saving}
              className="btn btn-primary"
            >
              <Save style={{ width: '16px', height: '16px' }} />
              {saving ? 'Lagrer...' : 'Lagre innstillinger'}
            </button>
          </div>
        </div>
      )}

      {/* Templates Tab */}
      {activeTab === 'templates' && canAccessEmailControl && (
        <div className="card">
          <h2 className="card-title">E-post-maler</h2>
          <div className="space-y-4">
            <div>
              <label className="form-label">Admin-oppsett mal</label>
              <textarea
                value={settings.adminSetupTemplate}
                onChange={(e) => updateTemplate('adminSetupTemplate', e.target.value)}
                rows={10}
                className="form-input"
                placeholder="HTML-mal for admin-oppsett e-post..."
              />
            </div>

            <div>
              <label className="form-label">Avviksrapport mal</label>
              <textarea
                value={settings.deviationReportTemplate}
                onChange={(e) => updateTemplate('deviationReportTemplate', e.target.value)}
                rows={10}
                className="form-input"
                placeholder="HTML-mal for avviksrapport e-post..."
              />
            </div>

            <div>
              <label className="form-label">Varsel mal</label>
              <textarea
                value={settings.notificationTemplate}
                onChange={(e) => updateTemplate('notificationTemplate', e.target.value)}
                rows={8}
                className="form-input"
                placeholder="HTML-mal for varsel e-post..."
              />
            </div>
          </div>
        </div>
      )}

      {/* SMTP Tab */}
      {activeTab === 'smtp' && canAccessEmailControl && (
        <div className="card">
          <h2 className="card-title">SMTP-innstillinger</h2>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="form-label">SMTP-server</label>
                <input
                  type="text"
                  value={settings.smtpHost}
                  onChange={(e) => setSettings(prev => ({ ...prev, smtpHost: e.target.value }))}
                  className="form-input"
                  placeholder="smtp.office365.com"
                />
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
                  placeholder="noreply@driftpro.no"
                />
              </div>
              <div>
                <label className="form-label">Passord</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={smtpPassword}
                    onChange={(e) => setSmtpPassword(e.target.value)}
                    className="form-input"
                    style={{ paddingRight: '2.5rem' }}
                    placeholder="••••••••"
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
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem' }}>
              <button
                onClick={testSmtpConnection}
                disabled={testingSmtp || !settings.smtpHost || !settings.smtpPort || !settings.smtpUser || !smtpPassword}
                className="btn btn-secondary"
              >
                <TestTube style={{ width: '16px', height: '16px' }} />
                {testingSmtp ? 'Tester...' : 'Test SMTP'}
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
          </div>
        </div>
      )}

      {/* Test Tab */}
      {activeTab === 'test' && canAccessEmailControl && (
        <div className="card">
          <h2 className="card-title">
            <TestTube style={{ width: '20px', height: '20px' }} />
            Test e-post
          </h2>
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

            <button
              onClick={sendTestEmail}
              disabled={testing || !testEmail}
              className="btn btn-primary"
            >
              <Send style={{ width: '16px', height: '16px' }} />
              {testing ? 'Sender...' : 'Send test-e-post'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}