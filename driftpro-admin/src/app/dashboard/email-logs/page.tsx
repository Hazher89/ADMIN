'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { emailService, EmailLog } from '@/lib/email-service';
import { 
  Search, Filter, Mail, Clock, CheckCircle, AlertTriangle, XCircle,
  Eye, Download, RefreshCw, Send, User, Calendar, FileText
} from 'lucide-react';

export default function EmailLogsPage() {
  const { userProfile } = useAuth();
  const [emailLogs, setEmailLogs] = useState<EmailLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedType, setSelectedType] = useState('all');

  useEffect(() => {
    if (userProfile?.companyId) {
      loadEmailLogs();
    }
  }, [userProfile?.companyId]);

  const loadEmailLogs = async () => {
    if (!userProfile?.companyId) return;

    try {
      setLoading(true);
      
      // Load email logs from Firebase
      const logs = await emailService.getEmailLogs(userProfile.companyId);
      setEmailLogs(logs);
    } catch (error) {
      console.error('Error loading email logs:', error);
      setEmailLogs([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredEmailLogs = emailLogs.filter(log => {
    const matchesSearch = log.to.some(email => email.toLowerCase().includes(searchTerm.toLowerCase())) ||
                         log.subject.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = selectedStatus === 'all' || log.status === selectedStatus;
    const matchesType = selectedType === 'all' || log.eventType === selectedType;
    return matchesSearch && matchesStatus && matchesType;
  });

  const statuses = ['all', ...Array.from(new Set(emailLogs.map(log => log.status)))];
  const types = ['all', ...Array.from(new Set(emailLogs.map(log => log.eventType)))];

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
    return new Date(dateString).toLocaleDateString('no-NO');
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('no-NO', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const resendEmail = async (emailLog: EmailLog) => {
    try {
      const success = await emailService.resendEmail(emailLog);
      if (success) {
        alert('E-post sendt på nytt!');
        loadEmailLogs(); // Reload to show updated status
      } else {
        alert('Kunne ikke sende e-post på nytt. Sjekk e-postinnstillingene.');
      }
    } catch (error) {
      console.error('Error resending email:', error);
      alert('Feil ved sending av e-post på nytt.');
    }
  };

  const exportLogs = async () => {
    if (!userProfile?.companyId) return;

    try {
      const csvContent = await emailService.exportEmailLogs(userProfile.companyId);
      
      // Create and download CSV file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `email-logs-${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      alert('E-post logger eksportert!');
    } catch (error) {
      console.error('Error exporting logs:', error);
      alert('Feil ved eksport av logger.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <h1 className="page-title">📧 E-post logger</h1>
        <p className="page-subtitle">
          Oversikt over alle sendte e-poster og deres status
        </p>
      </div>

      {/* Filters and Search */}
      <div className="filters-section">
        <div className="search-filter">
          <Search style={{ width: '20px', height: '20px', color: '#6b7280' }} />
          <input
            type="text"
            placeholder="Søk i e-post logger..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="filter-controls">
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="filter-select"
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
            className="filter-select"
          >
            {types.map(type => (
              <option key={type} value={type}>
                {type === 'all' ? 'Alle typer' : getTypeLabel(type)}
              </option>
            ))}
          </select>

          <button onClick={exportLogs} className="btn btn-secondary">
            <Download style={{ width: '16px', height: '16px' }} />
            Eksporter
          </button>

          <button onClick={loadEmailLogs} className="btn btn-secondary">
            <RefreshCw style={{ width: '16px', height: '16px' }} />
            Oppdater
          </button>
        </div>
      </div>

      {/* Email Logs Grid */}
      <div className="email-logs-grid">
        {emailLogs.length === 0 ? (
          <div className="empty-state">
            <Mail style={{ width: '64px', height: '64px', color: '#9ca3af' }} />
            <h3>Ingen e-post logger funnet</h3>
            <p>E-post loggfunksjonalitet er under utvikling.</p>
            <div className="feature-info">
              <h4>Planlagte funksjoner:</h4>
              <ul>
                <li>Oversikt over alle sendte e-poster</li>
                <li>Status tracking og leveringsbekreftelse</li>
                <li>E-post maler og automatisering</li>
                <li>Feilanalyse og ny sending</li>
                <li>Eksport av logger og rapporter</li>
              </ul>
            </div>
          </div>
        ) : (
          filteredEmailLogs.map((log) => (
            <div key={log.id} className="email-log-card">
              <div className="email-log-header">
                <div className="email-log-status">
                  {getStatusIcon(log.status)}
                  <span
                    className="status-badge"
                    style={{ backgroundColor: getStatusColor(log.status) }}
                  >
                    {getStatusLabel(log.status)}
                  </span>
                </div>
                <div className="email-log-actions">
                  <button className="action-btn" title="Se detaljer">
                    <Eye style={{ width: '16px', height: '16px' }} />
                  </button>
                  {log.status === 'failed' && (
                    <button
                      onClick={() => resendEmail(log)}
                      className="action-btn"
                      title="Send på nytt"
                    >
                      <Send style={{ width: '16px', height: '16px' }} />
                    </button>
                  )}
                </div>
              </div>

              <div className="email-log-content">
                <h3 className="email-subject">{log.subject}</h3>
                
                <div className="email-details">
                  <div className="detail-item">
                    <User style={{ width: '16px', height: '16px', color: '#6b7280' }} />
                    <span>Mottaker: {log.to.join(', ')}</span>
                  </div>
                  <div className="detail-item">
                    <FileText style={{ width: '16px', height: '16px', color: '#6b7280' }} />
                    <span>Type: {getTypeLabel(log.eventType)}</span>
                  </div>
                  <div className="detail-item">
                    <Calendar style={{ width: '16px', height: '16px', color: '#6b7280' }} />
                    <span>Sendt: {formatDate(log.sentAt)} {formatTime(log.sentAt)}</span>
                  </div>
                </div>

                {log.error && (
                  <div className="email-error">
                    <AlertTriangle style={{ width: '16px', height: '16px', color: '#ef4444' }} />
                    <span>Feil: {log.error}</span>
                  </div>
                )}

                {log.metadata && Object.keys(log.metadata).length > 0 && (
                  <div className="email-metadata">
                    <h4>Metadata:</h4>
                    <div className="metadata-grid">
                      {Object.entries(log.metadata).map(([key, value]) => (
                        <div key={key} className="metadata-item">
                          <span className="metadata-key">{key}:</span>
                          <span className="metadata-value">{String(value)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Stats */}
      <div className="stats-section">
        <div className="stat-card">
          <div className="stat-number">{emailLogs.length}</div>
          <div className="stat-label">Totalt e-poster</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{emailLogs.filter(log => log.status === 'sent').length}</div>
          <div className="stat-label">Sendt</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{emailLogs.filter(log => log.status === 'failed').length}</div>
          <div className="stat-label">Feilet</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">
            {emailLogs.length > 0 
              ? Math.round((emailLogs.filter(log => log.status === 'sent').length / emailLogs.length) * 100)
              : 0}%
          </div>
          <div className="stat-label">Suksessrate</div>
        </div>
      </div>
    </div>
  );
}