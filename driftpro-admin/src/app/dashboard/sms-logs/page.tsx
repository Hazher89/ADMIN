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
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">SMS Logg & Telefonbok</h1>
        <p className="text-gray-600">Administrer SMS-utskrifter og kontakter</p>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('logs')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'logs'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <MessageSquare className="w-4 h-4 inline mr-2" />
            SMS Logg
          </button>
          <button
            onClick={() => setActiveTab('phonebook')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'phonebook'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Phone className="w-4 h-4 inline mr-2" />
            Telefonbok
          </button>
          <button
            onClick={() => setActiveTab('send')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'send'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Send className="w-4 h-4 inline mr-2" />
            Send SMS
          </button>
        </nav>
      </div>

      {/* SMS Logs Tab */}
      {activeTab === 'logs' && (
        <div>
          <div className="mb-6 flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Søk i SMS logg..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Alle statuser</option>
              <option value="sent">Sendt</option>
              <option value="delivered">Levert</option>
              <option value="failed">Feilet</option>
            </select>
          </div>

          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Til
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Melding
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tidspunkt
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Kostnad
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {getStatusIcon(log.status)}
                          <span className="ml-2 text-sm text-gray-900">
                            {getStatusText(log.status)}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {log.to}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                        {log.message}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {log.timestamp.toLocaleString('nb-NO')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {log.cost ? `kr ${log.cost.toFixed(2)}` : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
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
        <div className="max-w-2xl">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Send SMS</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Til (telefonnummer)
                </label>
                <div className="flex space-x-2">
                  <input
                    type="tel"
                    placeholder="+47 123 45 678"
                    value={newSMS.to}
                    onChange={(e) => setNewSMS({ ...newSMS, to: e.target.value })}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <button
                    onClick={() => setActiveTab('phonebook')}
                    className="px-3 py-2 text-sm text-blue-600 hover:text-blue-700 border border-blue-300 rounded-md hover:bg-blue-50"
                  >
                    <Phone className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Melding
                </label>
                <textarea
                  rows={4}
                  placeholder="Skriv din melding her..."
                  value={newSMS.message}
                  onChange={(e) => setNewSMS({ ...newSMS, message: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <div className="mt-1 text-sm text-gray-500">
                  {newSMS.message.length}/160 tegn
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fra (avsender)
                </label>
                <input
                  type="text"
                  value={newSMS.from}
                  onChange={(e) => setNewSMS({ ...newSMS, from: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <button
                onClick={sendSMS}
                disabled={sendingSMS || !newSMS.to || !newSMS.message}
                className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {sendingSMS ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Sender...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
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
