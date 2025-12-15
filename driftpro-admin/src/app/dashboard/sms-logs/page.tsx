'use client';

import React, { useState, useEffect } from 'react';
import { 
  MessageSquare, 
  Phone, 
  Send, 
  UserPlus, 
  Edit, 
  Trash2, 
  Search,
  Filter,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  PhoneCall,
  User,
  Mail
} from 'lucide-react';

interface SMSLog {
  id: string;
  to: string;
  message: string;
  status: 'sent' | 'delivered' | 'failed';
  timestamp: Date;
  cost?: number;
  messageId?: string;
}

interface Contact {
  id: string;
  name: string;
  phone: string;
  email?: string;
  company?: string;
  notes?: string;
  createdAt: Date;
}

export default function SMSLogsPage() {
  const [isMobile, setIsMobile] = useState(false);
  const [smsLogs, setSmsLogs] = useState<SMSLog[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [activeTab, setActiveTab] = useState<'logs' | 'phonebook' | 'send'>('logs');
  
  // SMS sending state
  const [newSMS, setNewSMS] = useState({
    to: '',
    message: '',
    from: 'DriftPro'
  });
  const [sendingSMS, setSendingSMS] = useState(false);
  
  // Contact management state
  const [newContact, setNewContact] = useState({
    name: '',
    phone: '',
    email: '',
    company: '',
    notes: ''
  });
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [showContactModal, setShowContactModal] = useState(false);
  
  // Search and filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'sent' | 'delivered' | 'failed'>('all');

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    loadSMSLogs();
    loadContacts();
  }, []);

  const loadSMSLogs = async () => {
    try {
      // TODO: Replace with real Firebase data
      const mockLogs: SMSLog[] = [
        {
          id: '1',
          to: '+47 123 45 678',
          message: 'Velkommen til DriftPro!',
          status: 'delivered',
          timestamp: new Date(Date.now() - 3600000),
          cost: 0.15,
          messageId: 'MSG001'
        },
        {
          id: '2',
          to: '+47 987 65 432',
          message: 'Ditt oppdrag er bekreftet',
          status: 'sent',
          timestamp: new Date(Date.now() - 7200000),
          cost: 0.15,
          messageId: 'MSG002'
        }
      ];
      setSmsLogs(mockLogs);
    } catch (error) {
      console.error('Error loading SMS logs:', error);
    }
  };

  const loadContacts = async () => {
    try {
      // TODO: Replace with real Firebase data
      const mockContacts: Contact[] = [
        {
          id: '1',
          name: 'Ola Nordmann',
          phone: '+47 123 45 678',
          email: 'ola@example.com',
          company: 'Nordmann AS',
          notes: 'Hovedkontakt',
          createdAt: new Date()
        },
        {
          id: '2',
          name: 'Kari Hansen',
          phone: '+47 987 65 432',
          email: 'kari@example.com',
          company: 'Hansen Transport',
          notes: 'Transportpartner',
          createdAt: new Date()
        }
      ];
      setContacts(mockContacts);
    } catch (error) {
      console.error('Error loading contacts:', error);
    }
  };

  const sendSMS = async () => {
    if (!newSMS.to || !newSMS.message) return;
    
    setSendingSMS(true);
    try {
      const response = await fetch('/api/sms/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: newSMS.to,
          message: newSMS.message,
          from: newSMS.from
        }),
      });

      if (response.ok) {
        const result = await response.json();
        
        // Add to logs
        const newLog: SMSLog = {
          id: Date.now().toString(),
          to: newSMS.to,
          message: newSMS.message,
          status: 'sent',
          timestamp: new Date(),
          cost: result.cost,
          messageId: result.messageId
        };
        
        setSmsLogs(prev => [newLog, ...prev]);
        setNewSMS({ to: '', message: '', from: 'DriftPro' });
        
        // Switch to logs tab to show the new entry
        setActiveTab('logs');
      }
    } catch (error) {
      console.error('Error sending SMS:', error);
    } finally {
      setSendingSMS(false);
    }
  };

  const addContact = async () => {
    if (!newContact.name || !newContact.phone) return;
    
    const contact: Contact = {
      id: Date.now().toString(),
      name: newContact.name,
      phone: newContact.phone,
      email: newContact.email,
      company: newContact.company,
      notes: newContact.notes,
      createdAt: new Date()
    };
    
    setContacts(prev => [...prev, contact]);
    setNewContact({ name: '', phone: '', email: '', company: '', notes: '' });
    setShowContactModal(false);
  };

  const updateContact = async () => {
    if (!editingContact) return;
    
    setContacts(prev => prev.map(c => 
      c.id === editingContact.id ? editingContact : c
    ));
    setEditingContact(null);
  };

  const deleteContact = async (id: string) => {
    if (confirm('Er du sikker på at du vil slette denne kontakten?')) {
      setContacts(prev => prev.filter(c => c.id !== id));
    }
  };

  const filteredLogs = smsLogs.filter(log => {
    const matchesSearch = log.to.includes(searchTerm) || log.message.includes(searchTerm);
    const matchesStatus = statusFilter === 'all' || log.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const filteredContacts = contacts.filter(contact =>
    contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contact.phone.includes(searchTerm) ||
    contact.company?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'delivered': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'sent': return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'failed': return <XCircle className="w-4 h-4 text-red-500" />;
      default: return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'delivered': return 'Levert';
      case 'sent': return 'Sendt';
      case 'failed': return 'Feilet';
      default: return 'Ukjent';
    }
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'var(--background-color)',
      width: '100%',
      overflowX: 'hidden',
      padding: isMobile ? '0' : undefined
    }}>
      {/* Mobile Header */}
      {isMobile && (
        <>
          <div style={{
            padding: '0.625rem 0.75rem 0.5rem',
            marginBottom: '0.5rem',
            borderBottom: '0.5px solid var(--border-color)',
            background: 'var(--card-background)'
          }}>
            <h1 style={{
              fontSize: '1.125rem',
              fontWeight: 600,
              color: 'var(--text-color)',
              margin: 0,
              lineHeight: '1.3'
            }}>
              SMS Logg
            </h1>
          </div>
          {/* Mobile Tab Navigation */}
          <div style={{ 
            marginBottom: '1rem', 
            overflowX: 'auto', 
            WebkitOverflowScrolling: 'touch',
            padding: '0 0.75rem'
          }}>
            <div style={{ display: 'flex', borderBottom: '2px solid var(--gray-200)', gap: '0' }}>
              <button
                onClick={() => setActiveTab('logs')}
                style={{
                  padding: '1.25rem 1.5rem',
                  border: 'none',
                  background: 'transparent',
                  cursor: 'pointer',
                  borderBottom: activeTab === 'logs' ? '2px solid var(--primary)' : '2px solid transparent',
                  color: activeTab === 'logs' ? 'var(--primary)' : 'var(--gray-600)',
                  fontWeight: activeTab === 'logs' ? '600' : '500',
                  fontSize: '1rem',
                  minHeight: '56px',
                  touchAction: 'manipulation',
                  whiteSpace: 'nowrap'
                }}
              >
                <span style={{ marginRight: '0.5rem' }}>📋</span>
                SMS Logg
              </button>
              <button
                onClick={() => setActiveTab('phonebook')}
                style={{
                  padding: '1.25rem 1.5rem',
                  border: 'none',
                  background: 'transparent',
                  cursor: 'pointer',
                  borderBottom: activeTab === 'phonebook' ? '2px solid var(--primary)' : '2px solid transparent',
                  color: activeTab === 'phonebook' ? 'var(--primary)' : 'var(--gray-600)',
                  fontWeight: activeTab === 'phonebook' ? '600' : '500',
                  fontSize: '1rem',
                  minHeight: '56px',
                  touchAction: 'manipulation',
                  whiteSpace: 'nowrap'
                }}
              >
                <span style={{ marginRight: '0.5rem' }}>👥</span>
                Telefonbok
              </button>
              <button
                onClick={() => setActiveTab('send')}
                style={{
                  padding: '1.25rem 1.5rem',
                  border: 'none',
                  background: 'transparent',
                  cursor: 'pointer',
                  borderBottom: activeTab === 'send' ? '2px solid var(--primary)' : '2px solid transparent',
                  color: activeTab === 'send' ? 'var(--primary)' : 'var(--gray-600)',
                  fontWeight: activeTab === 'send' ? '600' : '500',
                  fontSize: '1rem',
                  minHeight: '56px',
                  touchAction: 'manipulation',
                  whiteSpace: 'nowrap'
                }}
              >
                <span style={{ marginRight: '0.5rem' }}>📤</span>
                Send SMS
              </button>
            </div>
          </div>
        </>
      )}

      {/* Desktop Page Header */}
      {!isMobile && (
      <div className="page-header" style={{ padding: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
          <div className="card-icon">
            <Phone style={{ width: '24px', height: '24px', color: 'var(--primary)' }} />
          </div>
          <div>
            <h1 className="page-title">📱 SMS Logg & Telefonbok</h1>
            <p className="page-subtitle">
              Administrer SMS-utskrifter, kontakter og send meldinger
            </p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div style={{ marginBottom: '1rem', overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
          <div style={{ display: 'flex', borderBottom: '2px solid var(--gray-200)', gap: '0' }}>
            <button
              onClick={() => setActiveTab('logs')}
              style={{
                padding: isMobile ? '1.25rem 1.5rem' : '1rem 2rem',
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                borderBottom: activeTab === 'logs' ? '2px solid var(--primary)' : '2px solid transparent',
                color: activeTab === 'logs' ? 'var(--primary)' : 'var(--gray-600)',
                fontWeight: activeTab === 'logs' ? '600' : '500',
                fontSize: isMobile ? '1rem' : 'var(--font-size-base)',
                minHeight: isMobile ? '56px' : 'auto',
                touchAction: 'manipulation'
              }}
            >
              <span style={{ marginRight: '0.5rem' }}>📋</span>
              SMS Logg
            </button>
            <button
              onClick={() => setActiveTab('phonebook')}
              style={{
                padding: isMobile ? '1.25rem 1.5rem' : '1rem 2rem',
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                borderBottom: activeTab === 'phonebook' ? '2px solid var(--primary)' : '2px solid transparent',
                color: activeTab === 'phonebook' ? 'var(--primary)' : 'var(--gray-600)',
                fontWeight: activeTab === 'phonebook' ? '600' : '500',
                fontSize: isMobile ? '1rem' : 'var(--font-size-base)',
                minHeight: isMobile ? '56px' : 'auto',
                touchAction: 'manipulation'
              }}
            >
              <span style={{ marginRight: '0.5rem' }}>👥</span>
              Telefonbok
            </button>
            <button
              onClick={() => setActiveTab('send')}
              style={{
                padding: isMobile ? '1.25rem 1.5rem' : '1rem 2rem',
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                borderBottom: activeTab === 'send' ? '2px solid var(--primary)' : '2px solid transparent',
                color: activeTab === 'send' ? 'var(--primary)' : 'var(--gray-600)',
                fontWeight: activeTab === 'send' ? '600' : '500',
                fontSize: isMobile ? '1rem' : 'var(--font-size-base)',
                minHeight: isMobile ? '56px' : 'auto',
                touchAction: 'manipulation'
              }}
            >
              <span style={{ marginRight: '0.5rem' }}>📤</span>
              Send SMS
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
          <button
            style={{
              padding: '0.5rem 1rem',
              background: 'var(--primary)',
              color: 'white',
              border: 'none',
              borderRadius: '0.375rem',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            {smsLogs.length} SMS SENDT
          </button>
          <button
            style={{
              padding: '0.5rem 1rem',
              background: '#f1f5f9',
              color: 'var(--gray-600)',
              border: '1px solid var(--gray-200)',
              borderRadius: '0.375rem',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            {contacts.length} KONTAKTER
          </button>
        </div>
      </div>
      )}

      {/* SMS Logs Tab */}
      {activeTab === 'logs' && (
        <div style={{ maxWidth: '1280px', margin: '0 auto', padding: isMobile ? '1rem 0.75rem' : '2rem 1rem' }}>
          {/* Search and Filters */}
          <div className="card" style={{ marginBottom: '2rem' }}>
            <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: '1rem' }}>
              <div style={{ flex: '1' }}>
                <div style={{ position: 'relative' }}>
                  <Search style={{ 
                    position: 'absolute', 
                    left: isMobile ? '16px' : '12px', 
                    top: '50%', 
                    transform: 'translateY(-50%)', 
                    color: '#6b7280',
                    width: isMobile ? '22px' : '20px',
                    height: isMobile ? '22px' : '20px'
                  }} />
                  <input
                    type="text"
                    placeholder="Søk i SMS logg..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{
                      width: '100%',
                      padding: isMobile ? '1rem 1rem 1rem 3.5rem' : '12px 12px 12px 40px',
                      border: '1px solid var(--gray-300)',
                      borderRadius: isMobile ? '12px' : '0.375rem',
                      fontSize: isMobile ? '16px' : 'var(--font-size-base)',
                      minHeight: isMobile ? '56px' : 'auto'
                    }}
                  />
                </div>
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                style={{
                  padding: isMobile ? '1rem 1.25rem' : '12px',
                  border: '1px solid var(--gray-300)',
                  borderRadius: isMobile ? '12px' : '0.375rem',
                  fontSize: isMobile ? '16px' : 'var(--font-size-base)',
                  minWidth: isMobile ? '100%' : '150px',
                  minHeight: isMobile ? '56px' : 'auto'
                }}
              >
                <option value="all">Alle statuser</option>
                <option value="sent">Sendt</option>
                <option value="delivered">Levert</option>
                <option value="failed">Feilet</option>
              </select>
            </div>
          </div>

          {isMobile ? (
            /* Mobile Card Layout */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {filteredLogs.map((log) => (
                <div key={log.id} className="card" style={{ padding: '1.25rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                    {getStatusIcon(log.status)}
                    <span style={{ fontSize: '0.9375rem', fontWeight: '600', color: 'var(--gray-900)' }}>
                      {getStatusText(log.status)}
                    </span>
                  </div>
                  <div style={{ marginBottom: '0.75rem' }}>
                    <div style={{ fontSize: '0.8125rem', color: 'var(--gray-500)', marginBottom: '0.25rem' }}>Til</div>
                    <div style={{ fontSize: '1rem', color: 'var(--gray-900)', fontWeight: '500' }}>{log.to}</div>
                  </div>
                  <div style={{ marginBottom: '0.75rem' }}>
                    <div style={{ fontSize: '0.8125rem', color: 'var(--gray-500)', marginBottom: '0.25rem' }}>Melding</div>
                    <div style={{ fontSize: '0.9375rem', color: 'var(--gray-900)' }}>{log.message}</div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.75rem', borderTop: '1px solid var(--gray-200)' }}>
                    <div>
                      <div style={{ fontSize: '0.8125rem', color: 'var(--gray-500)', marginBottom: '0.25rem' }}>Tidspunkt</div>
                      <div style={{ fontSize: '0.875rem', color: 'var(--gray-700)' }}>
                        {log.timestamp.toLocaleString('nb-NO')}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '0.8125rem', color: 'var(--gray-500)', marginBottom: '0.25rem' }}>Kostnad</div>
                      <div style={{ fontSize: '0.9375rem', fontWeight: '600', color: 'var(--gray-900)' }}>
                        {log.cost ? `kr ${log.cost.toFixed(2)}` : '-'}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* Desktop Table Layout */
            <div className="card" style={{ overflow: 'hidden' }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ minWidth: '100%', borderCollapse: 'collapse' }}>
                  <thead style={{ background: 'var(--gray-50)' }}>
                    <tr>
                      <th style={{ 
                        padding: '12px 24px', 
                        textAlign: 'left', 
                        fontSize: '0.75rem', 
                        fontWeight: '500', 
                        color: 'var(--gray-500)', 
                        textTransform: 'uppercase',
                        borderBottom: '1px solid var(--gray-200)'
                      }}>
                        Status
                      </th>
                      <th style={{ 
                        padding: '12px 24px', 
                        textAlign: 'left', 
                        fontSize: '0.75rem', 
                        fontWeight: '500', 
                        color: 'var(--gray-500)', 
                        textTransform: 'uppercase',
                        borderBottom: '1px solid var(--gray-200)'
                      }}>
                        Til
                      </th>
                      <th style={{ 
                        padding: '12px 24px', 
                        textAlign: 'left', 
                        fontSize: '0.75rem', 
                        fontWeight: '500', 
                        color: 'var(--gray-500)', 
                        textTransform: 'uppercase',
                        borderBottom: '1px solid var(--gray-200)'
                      }}>
                        Melding
                      </th>
                      <th style={{ 
                        padding: '12px 24px', 
                        textAlign: 'left', 
                        fontSize: '0.75rem', 
                        fontWeight: '500', 
                        color: 'var(--gray-500)', 
                        textTransform: 'uppercase',
                        borderBottom: '1px solid var(--gray-200)'
                      }}>
                        Tidspunkt
                      </th>
                      <th style={{ 
                        padding: '12px 24px', 
                        textAlign: 'left', 
                        fontSize: '0.75rem', 
                        fontWeight: '500', 
                        color: 'var(--gray-500)', 
                        textTransform: 'uppercase',
                        borderBottom: '1px solid var(--gray-200)'
                      }}>
                        Kostnad
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLogs.map((log) => (
                      <tr key={log.id} style={{ 
                        borderBottom: '1px solid var(--gray-200)',
                        transition: 'background-color 0.2s'
                      }} onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'var(--gray-50)';
                      }} onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }}>
                        <td style={{ padding: '16px 24px', whiteSpace: 'nowrap' }}>
                          <div style={{ display: 'flex', alignItems: 'center' }}>
                            {getStatusIcon(log.status)}
                            <span style={{ marginLeft: '8px', fontSize: '0.875rem', color: 'var(--gray-900)' }}>
                              {getStatusText(log.status)}
                            </span>
                          </div>
                        </td>
                        <td style={{ padding: '16px 24px', whiteSpace: 'nowrap', fontSize: '0.875rem', color: 'var(--gray-900)' }}>
                          {log.to}
                        </td>
                        <td style={{ padding: '16px 24px', fontSize: '0.875rem', color: 'var(--gray-900)', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {log.message}
                        </td>
                        <td style={{ padding: '16px 24px', whiteSpace: 'nowrap', fontSize: '0.875rem', color: 'var(--gray-500)' }}>
                          {log.timestamp.toLocaleString('nb-NO')}
                        </td>
                        <td style={{ padding: '16px 24px', whiteSpace: 'nowrap', fontSize: '0.875rem', color: 'var(--gray-500)' }}>
                          {log.cost ? `kr ${log.cost.toFixed(2)}` : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Phonebook Tab */}
      {activeTab === 'phonebook' && (
        <div>
          <div className="mb-6 flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Søk i kontakter..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <button
              onClick={() => setShowContactModal(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <UserPlus className="w-4 h-4 mr-2" />
              Legg til kontakt
            </button>
          </div>

          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Navn
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Telefon
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      E-post
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Bedrift
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Handlinger
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredContacts.map((contact) => (
                    <tr key={contact.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                              <User className="w-5 h-5 text-blue-600" />
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {contact.name}
                            </div>
                            {contact.notes && (
                              <div className="text-sm text-gray-500">
                                {contact.notes}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {contact.phone}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {contact.email || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {contact.company || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => setEditingContact(contact)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => deleteContact(contact.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Send SMS Tab */}
      {activeTab === 'send' && (
        <div style={{ maxWidth: '1280px', margin: '0 auto', padding: isMobile ? '1rem 0.75rem' : '2rem 1rem' }}>
          <div className="card" style={{ padding: isMobile ? '1.5rem 1.25rem' : '2rem' }}>
            <h3 style={{ 
              fontSize: isMobile ? '1.25rem' : '1.5rem', 
              fontWeight: '600', 
              color: 'var(--text-color)', 
              marginBottom: '1.5rem' 
            }}>
              Send SMS
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div>
                <label style={{ 
                  display: 'block', 
                  fontSize: isMobile ? '0.9375rem' : '0.875rem', 
                  fontWeight: '600', 
                  color: 'var(--gray-700)', 
                  marginBottom: '0.75rem' 
                }}>
                  Til (telefonnummer)
                </label>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <input
                    type="tel"
                    placeholder="+47 123 45 678"
                    value={newSMS.to}
                    onChange={(e) => setNewSMS({ ...newSMS, to: e.target.value })}
                    style={{
                      flex: 1,
                      padding: isMobile ? '1rem 1.25rem' : '0.75rem 1rem',
                      border: '1px solid var(--gray-300)',
                      borderRadius: isMobile ? '12px' : '0.375rem',
                      fontSize: isMobile ? '16px' : 'var(--font-size-base)',
                      minHeight: isMobile ? '56px' : 'auto',
                      outline: 'none'
                    }}
                  />
                  <button
                    onClick={() => setActiveTab('phonebook')}
                    style={{
                      padding: isMobile ? '1rem 1.25rem' : '0.75rem 1rem',
                      color: 'var(--primary)',
                      border: '1px solid var(--primary)',
                      borderRadius: isMobile ? '12px' : '0.375rem',
                      background: 'transparent',
                      cursor: 'pointer',
                      minHeight: isMobile ? '56px' : 'auto',
                      minWidth: isMobile ? '56px' : 'auto',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      touchAction: 'manipulation'
                    }}
                  >
                    <Phone size={isMobile ? 22 : 20} />
                  </button>
                </div>
              </div>

              <div>
                <label style={{ 
                  display: 'block', 
                  fontSize: isMobile ? '0.9375rem' : '0.875rem', 
                  fontWeight: '600', 
                  color: 'var(--gray-700)', 
                  marginBottom: '0.75rem' 
                }}>
                  Melding
                </label>
                <textarea
                  rows={isMobile ? 6 : 4}
                  placeholder="Skriv din melding her..."
                  value={newSMS.message}
                  onChange={(e) => setNewSMS({ ...newSMS, message: e.target.value })}
                  style={{
                    width: '100%',
                    padding: isMobile ? '1rem 1.25rem' : '0.75rem 1rem',
                    border: '1px solid var(--gray-300)',
                    borderRadius: isMobile ? '12px' : '0.375rem',
                    fontSize: isMobile ? '16px' : 'var(--font-size-base)',
                    minHeight: isMobile ? '140px' : 'auto',
                    outline: 'none',
                    lineHeight: '1.5',
                    fontFamily: 'inherit'
                  }}
                />
                <div style={{ 
                  marginTop: '0.5rem', 
                  fontSize: isMobile ? '0.875rem' : '0.8125rem', 
                  color: 'var(--gray-500)' 
                }}>
                  {newSMS.message.length}/160 tegn
                </div>
              </div>

              <div>
                <label style={{ 
                  display: 'block', 
                  fontSize: isMobile ? '0.9375rem' : '0.875rem', 
                  fontWeight: '600', 
                  color: 'var(--gray-700)', 
                  marginBottom: '0.75rem' 
                }}>
                  Fra (avsender)
                </label>
                <input
                  type="text"
                  value={newSMS.from}
                  onChange={(e) => setNewSMS({ ...newSMS, from: e.target.value })}
                  style={{
                    width: '100%',
                    padding: isMobile ? '1rem 1.25rem' : '0.75rem 1rem',
                    border: '1px solid var(--gray-300)',
                    borderRadius: isMobile ? '12px' : '0.375rem',
                    fontSize: isMobile ? '16px' : 'var(--font-size-base)',
                    minHeight: isMobile ? '56px' : 'auto',
                    outline: 'none'
                  }}
                />
              </div>

              <button
                onClick={sendSMS}
                disabled={sendingSMS || !newSMS.to || !newSMS.message}
                style={{
                  width: '100%',
                  padding: isMobile ? '1.25rem 1.5rem' : '0.875rem 1.25rem',
                  background: (sendingSMS || !newSMS.to || !newSMS.message) ? 'var(--gray-400)' : 'var(--primary)',
                  color: 'white',
                  border: 'none',
                  borderRadius: isMobile ? '12px' : '0.375rem',
                  fontWeight: '600',
                  fontSize: isMobile ? '1.125rem' : '1rem',
                  cursor: (sendingSMS || !newSMS.to || !newSMS.message) ? 'not-allowed' : 'pointer',
                  minHeight: isMobile ? '56px' : 'auto',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  touchAction: 'manipulation'
                }}
              >
                {sendingSMS ? (
                  <>
                    <div style={{ 
                      width: '20px', 
                      height: '20px', 
                      border: '2px solid white', 
                      borderTopColor: 'transparent', 
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite'
                    }}></div>
                    Sender...
                  </>
                ) : (
                  <>
                    <Send size={isMobile ? 22 : 20} />
                    Send SMS
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Contact Modal */}
      {(showContactModal || editingContact) && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {editingContact ? 'Rediger kontakt' : 'Legg til ny kontakt'}
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Navn *
                  </label>
                  <input
                    type="text"
                    value={editingContact ? editingContact.name : newContact.name}
                    onChange={(e) => {
                      if (editingContact) {
                        setEditingContact({ ...editingContact, name: e.target.value });
                      } else {
                        setNewContact({ ...newContact, name: e.target.value });
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Telefon *
                  </label>
                  <input
                    type="tel"
                    value={editingContact ? editingContact.phone : newContact.phone}
                    onChange={(e) => {
                      if (editingContact) {
                        setEditingContact({ ...editingContact, phone: e.target.value });
                      } else {
                        setNewContact({ ...newContact, phone: e.target.value });
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    E-post
                  </label>
                  <input
                    type="email"
                    value={editingContact ? editingContact.email || '' : newContact.email}
                    onChange={(e) => {
                      if (editingContact) {
                        setEditingContact({ ...editingContact, email: e.target.value });
                      } else {
                        setNewContact({ ...newContact, email: e.target.value });
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Bedrift
                  </label>
                  <input
                    type="text"
                    value={editingContact ? editingContact.company || '' : newContact.company}
                    onChange={(e) => {
                      if (editingContact) {
                        setEditingContact({ ...editingContact, company: e.target.value });
                      } else {
                        setNewContact({ ...newContact, company: e.target.value });
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notater
                  </label>
                  <textarea
                    rows={3}
                    value={editingContact ? editingContact.notes || '' : newContact.notes}
                    onChange={(e) => {
                      if (editingContact) {
                        setEditingContact({ ...editingContact, notes: e.target.value });
                      } else {
                        setNewContact({ ...newContact, notes: e.target.value });
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => {
                    setShowContactModal(false);
                    setEditingContact(null);
                    setNewContact({ name: '', phone: '', email: '', company: '', notes: '' });
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                >
                  Avbryt
                </button>
                <button
                  onClick={editingContact ? updateContact : addContact}
                  disabled={!editingContact?.name || !editingContact?.phone}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {editingContact ? 'Oppdater' : 'Legg til'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
