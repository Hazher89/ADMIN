'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Mail, 
  Search, 
  Filter,
  Calendar,
  User,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  RefreshCw,
  Download,
  AlertTriangle,
  Send,
  Inbox,
  Archive
} from 'lucide-react';

interface EmailLog {
  id: string;
  recipient: string;
  subject: string;
  status: 'sent' | 'delivered' | 'failed' | 'pending';
  sentAt: string;
  deliveredAt?: string;
  sender: string;
  template: string;
  attachments: number;
  priority: 'low' | 'medium' | 'high';
}

export default function EmailLogsPage() {
  const { userProfile } = useAuth();
  const [emailLogs, setEmailLogs] = useState<EmailLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedPriority, setSelectedPriority] = useState('all');

  useEffect(() => {
    loadEmailLogs();
  }, []);

  const loadEmailLogs = async () => {
    try {
      // Mock data for demonstration
      const mockEmailLogs: EmailLog[] = [
        {
          id: '1',
          recipient: 'john.doe@company.com',
          subject: 'Velkommen til DriftPro',
          status: 'delivered',
          sentAt: '2024-07-27T10:30:00Z',
          deliveredAt: '2024-07-27T10:31:15Z',
          sender: 'system@driftpro.no',
          template: 'welcome_email',
          attachments: 0,
          priority: 'medium'
        },
        {
          id: '2',
          recipient: 'jane.smith@company.com',
          subject: 'Ferieforespørsel godkjent',
          status: 'sent',
          sentAt: '2024-07-27T09:15:00Z',
          sender: 'hr@driftpro.no',
          template: 'vacation_approved',
          attachments: 1,
          priority: 'high'
        },
        {
          id: '3',
          recipient: 'mike.johnson@company.com',
          subject: 'Månedlig rapport',
          status: 'failed',
          sentAt: '2024-07-27T08:45:00Z',
          sender: 'reports@driftpro.no',
          template: 'monthly_report',
          attachments: 2,
          priority: 'low'
        },
        {
          id: '4',
          recipient: 'sarah.wilson@company.com',
          subject: 'Passord tilbakestilling',
          status: 'delivered',
          sentAt: '2024-07-27T08:00:00Z',
          deliveredAt: '2024-07-27T08:00:45Z',
          sender: 'security@driftpro.no',
          template: 'password_reset',
          attachments: 0,
          priority: 'high'
        },
        {
          id: '5',
          recipient: 'admin@company.com',
          subject: 'System vedlikehold',
          status: 'pending',
          sentAt: '2024-07-27T07:30:00Z',
          sender: 'system@driftpro.no',
          template: 'maintenance_notice',
          attachments: 0,
          priority: 'medium'
        }
      ];

      setEmailLogs(mockEmailLogs);
    } catch (error) {
      console.error('Error loading email logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredEmailLogs = emailLogs.filter(log => {
    const matchesSearch = log.recipient.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         log.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         log.sender.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = selectedStatus === 'all' || log.status === selectedStatus;
    const matchesPriority = selectedPriority === 'all' || log.priority === selectedPriority;
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const statuses = ['all', ...Array.from(new Set(emailLogs.map(log => log.status)))];
  const priorities = ['all', ...Array.from(new Set(emailLogs.map(log => log.priority)))];

  const getStatusColor = (status: EmailLog['status']) => {
    switch (status) {
      case 'delivered': return '#10b981';
      case 'sent': return '#3b82f6';
      case 'failed': return '#ef4444';
      case 'pending': return '#f59e0b';
    }
  };

  const getStatusIcon = (status: EmailLog['status']) => {
    switch (status) {
      case 'delivered': return <CheckCircle style={{ width: '16px', height: '16px', color: '#10b981' }} />;
      case 'sent': return <Send style={{ width: '16px', height: '16px', color: '#3b82f6' }} />;
      case 'failed': return <XCircle style={{ width: '16px', height: '16px', color: '#ef4444' }} />;
      case 'pending': return <Clock style={{ width: '16px', height: '16px', color: '#f59e0b' }} />;
    }
  };

  const getPriorityColor = (priority: EmailLog['priority']) => {
    switch (priority) {
      case 'high': return '#ef4444';
      case 'medium': return '#f59e0b';
      case 'low': return '#10b981';
    }
  };

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
          <div className="card-icon">
            <Mail />
          </div>
          <div>
            <h1 className="page-title">📧 E-post Logger</h1>
            <p className="page-subtitle">
              Oversikt over alle sendte e-poster og deres status
            </p>
          </div>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <span className="badge badge-primary">
            {emailLogs.length} e-poster
          </span>
          <button className="btn btn-secondary">
            <RefreshCw style={{ width: '16px', height: '16px' }} />
            Oppdater
          </button>
          <button className="btn btn-secondary">
            <Download style={{ width: '16px', height: '16px' }} />
            Eksporter
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <div className="search-container" style={{ flex: '1', minWidth: '300px' }}>
            <Search className="search-icon" />
            <input
              type="text"
              placeholder="Søk i e-post logger..."
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
                {status === 'all' ? 'Alle statuser' : 
                 status === 'delivered' ? 'Levert' :
                 status === 'sent' ? 'Sendt' :
                 status === 'failed' ? 'Feilet' : 'Venter'}
              </option>
            ))}
          </select>

          <select
            className="form-input"
            style={{ width: '150px' }}
            value={selectedPriority}
            onChange={(e) => setSelectedPriority(e.target.value)}
          >
            {priorities.map(priority => (
              <option key={priority} value={priority}>
                {priority === 'all' ? 'Alle prioriteter' : 
                 priority === 'high' ? 'Høy' :
                 priority === 'medium' ? 'Medium' : 'Lav'}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Email Logs List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {filteredEmailLogs.map((log) => (
          <div key={log.id} className="card">
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
              <div style={{ marginTop: '0.25rem' }}>
                {getStatusIcon(log.status)}
              </div>
              
              <div style={{ flex: '1' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
                  <h3 style={{ 
                    fontWeight: '600', 
                    color: '#333',
                    fontSize: '1rem'
                  }}>
                    {log.subject}
                  </h3>
                  
                  <span 
                    className="badge"
                    style={{ 
                      backgroundColor: getPriorityColor(log.priority),
                      fontSize: '0.625rem',
                      padding: '0.125rem 0.5rem'
                    }}
                  >
                    {log.priority === 'high' ? 'Høy' : 
                     log.priority === 'medium' ? 'Medium' : 'Lav'}
                  </span>
                  
                  {log.attachments > 0 && (
                    <span className="badge badge-secondary" style={{ fontSize: '0.625rem' }}>
                      📎 {log.attachments}
                    </span>
                  )}
                </div>
                
                <div style={{ marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <User style={{ width: '14px', height: '14px', color: '#666' }} />
                    <span style={{ fontSize: '0.875rem', color: '#666' }}>
                      <strong>Til:</strong> {log.recipient}
                    </span>
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <Send style={{ width: '14px', height: '14px', color: '#666' }} />
                    <span style={{ fontSize: '0.875rem', color: '#666' }}>
                      <strong>Fra:</strong> {log.sender}
                    </span>
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Inbox style={{ width: '14px', height: '14px', color: '#666' }} />
                    <span style={{ fontSize: '0.875rem', color: '#666' }}>
                      <strong>Malen:</strong> {log.template}
                    </span>
                  </div>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.875rem', color: '#666' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <Calendar style={{ width: '14px', height: '14px' }} />
                    <span>Sendt: {new Date(log.sentAt).toLocaleString('no-NO')}</span>
                  </div>
                  
                  {log.deliveredAt && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <CheckCircle style={{ width: '14px', height: '14px' }} />
                      <span>Levert: {new Date(log.deliveredAt).toLocaleString('no-NO')}</span>
                    </div>
                  )}
                </div>
              </div>
              
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button className="btn btn-secondary" style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}>
                  <Eye style={{ width: '14px', height: '14px' }} />
                </button>
                <button className="btn btn-secondary" style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}>
                  <Archive style={{ width: '14px', height: '14px' }} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredEmailLogs.length === 0 && !loading && (
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <Mail style={{ width: '64px', height: '64px', color: '#ccc', margin: '0 auto 1rem' }} />
          <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#333', marginBottom: '0.5rem' }}>
            Ingen e-post logger funnet
          </h3>
          <p style={{ color: '#666' }}>
            {searchTerm || selectedStatus !== 'all' || selectedPriority !== 'all' 
              ? 'Prøv å endre søkekriteriene' 
              : 'Du har ingen e-post logger ennå'}
          </p>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <div className="loading" style={{ margin: '0 auto 1rem' }}></div>
          <p style={{ color: '#666' }}>Laster e-post logger...</p>
        </div>
      )}
    </div>
  );
}