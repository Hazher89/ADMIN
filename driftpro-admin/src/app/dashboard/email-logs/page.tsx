'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Search,
  Eye,
  Download,
  Calendar,
  Mail,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle
} from 'lucide-react';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface EmailLog {
  id: string;
  to: string | string[];
  subject: string;
  body: string;
  sentAt: string;
  status: 'sent' | 'failed' | 'pending';
  sender: string;
  metadata?: {
    eventType: string;
    timestamp: string;
    companyId?: string;
    userId?: string;
  };
}

export default function EmailLogsPage() {
  const [emailLogs, setEmailLogs] = useState<EmailLog[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<EmailLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [eventTypeFilter, setEventTypeFilter] = useState<string>('all');
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [selectedEmail, setSelectedEmail] = useState<EmailLog | null>(null);

  const loadEmailLogs = async () => {
    try {
      setLoading(true);
      if (db) {
        const q = query(
          collection(db, 'emailLogs'),
          orderBy('sentAt', 'desc')
        );
        const snapshot = await getDocs(q);
        const logs = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as EmailLog[];
        setEmailLogs(logs);
      }
    } catch (error) {
      console.error('Error loading email logs:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEmailLogs();
  }, []);

  const filterLogs = useCallback(() => {
    let filtered = emailLogs;
    
    if (statusFilter !== 'all') {
      filtered = filtered.filter(log => log.status === statusFilter);
    }
    
    if (eventTypeFilter !== 'all') {
      filtered = filtered.filter(log => log.metadata?.eventType === eventTypeFilter);
    }
    
    if (searchTerm) {
      filtered = filtered.filter(log =>
        log.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (Array.isArray(log.to) ? log.to.join(', ').toLowerCase().includes(searchTerm.toLowerCase()) : log.to.toLowerCase().includes(searchTerm.toLowerCase())) ||
        log.metadata?.eventType?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    setFilteredLogs(filtered);
  }, [emailLogs, statusFilter, eventTypeFilter, searchTerm]);

  useEffect(() => {
    filterLogs();
  }, [filterLogs]);

  const openEmailModal = (email: EmailLog) => {
    setSelectedEmail(email);
    setShowEmailModal(true);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getEventTypeIcon = (eventType: string) => {
    switch (eventType) {
      case 'employee_added':
      case 'welcome_message':
        return <Calendar className="h-4 w-4" />;
      default:
        return <Mail className="h-4 w-4" />;
    }
  };

  const formatEventType = (eventType: string) => {
    const eventTypes: Record<string, string> = {
      'employee_added': 'Ansatt tilføyd',
      'deviation_reported': 'Avvik rapportert',
      'deviation_updated': 'Avvik oppdatert',
      'vacation_request': 'Ferieforespørsel',
      'vacation_approved': 'Ferie godkjent',
      'vacation_rejected': 'Ferie avvist',
      'absence_request': 'Fraværsmelding',
      'absence_approved': 'Fravær godkjent',
      'absence_rejected': 'Fravær avvist',
      'shift_assigned': 'Vakt tildelt',
      'shift_updated': 'Vakt oppdatert',
      'password_reset': 'Passord tilbakestilt',
      'welcome_message': 'Velkomstmelding',
      'chat_message': 'Chat melding'
    };
    return eventTypes[eventType] || eventType;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">E-postlogger</h1>
          <p className="text-gray-600">Oversikt over alle sendte e-poster</p>
        </div>
        
        <div className="flex space-x-2">
          <button
            onClick={loadEmailLogs}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
          >
            <Download className="h-5 w-5" />
            <span>Eksporter</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Søk</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Søk i emne, mottaker eller hendelse..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">Alle statuser</option>
              <option value="sent">Sendt</option>
              <option value="failed">Feilet</option>
              <option value="pending">Venter</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Hendelsestype</label>
            <select
              value={eventTypeFilter}
              onChange={(e) => setEventTypeFilter(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">Alle hendelser</option>
              <option value="employee_added">Ansatt tilføyd</option>
              <option value="deviation_reported">Avvik rapportert</option>
              <option value="vacation_request">Ferieforespørsel</option>
              <option value="absence_request">Fraværsmelding</option>
              <option value="welcome_message">Velkomstmelding</option>
              <option value="password_reset">Passord tilbakestilt</option>
              <option value="chat_message">Chat melding</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('all');
                setEventTypeFilter('all');
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Nullstill filtre
            </button>
          </div>
        </div>
      </div>

      {/* Email Logs Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Hendelse
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Emne
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Mottaker
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Dato
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Handlinger
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      {getEventTypeIcon(log.metadata?.eventType || '')}
                      <span className="text-sm text-gray-900">
                        {formatEventType(log.metadata?.eventType || '')}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900 max-w-xs truncate">
                      {log.subject}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {Array.isArray(log.to) ? log.to.join(', ') : log.to}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(log.status)}
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(log.status)}`}>
                        {log.status === 'sent' ? 'Sendt' : log.status === 'failed' ? 'Feilet' : 'Venter'}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(log.sentAt).toLocaleString('no-NO')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => openEmailModal(log)}
                      className="text-blue-600 hover:text-blue-900 flex items-center space-x-1"
                    >
                      <Eye className="h-4 w-4" />
                      <span>Se detaljer</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredLogs.length === 0 && (
          <div className="text-center py-12">
            <Mail className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Ingen e-poster funnet</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm || statusFilter !== 'all' || eventTypeFilter !== 'all' 
                ? 'Ingen e-poster matcher filtrene dine.' 
                : 'Ingen e-poster er sendt ennå.'}
            </p>
          </div>
        )}
      </div>

      {/* Email Detail Modal */}
      {showEmailModal && selectedEmail && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">E-postdetaljer</h2>
                <button
                  onClick={() => setShowEmailModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-6">
                {/* Email Info */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">E-postinformasjon</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <span className="text-sm font-medium text-gray-700">Fra:</span>
                      <p className="text-sm text-gray-900">{selectedEmail.sender}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-700">Til:</span>
                      <p className="text-sm text-gray-900">
                        {Array.isArray(selectedEmail.to) ? selectedEmail.to.join(', ') : selectedEmail.to}
                      </p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-700">Emne:</span>
                      <p className="text-sm text-gray-900">{selectedEmail.subject}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-700">Sendt:</span>
                      <p className="text-sm text-gray-900">
                        {new Date(selectedEmail.sentAt).toLocaleString('no-NO')}
                      </p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-700">Status:</span>
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(selectedEmail.status)}
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(selectedEmail.status)}`}>
                          {selectedEmail.status === 'sent' ? 'Sendt' : selectedEmail.status === 'failed' ? 'Feilet' : 'Venter'}
                        </span>
                      </div>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-700">Hendelsestype:</span>
                      <p className="text-sm text-gray-900">
                        {formatEventType(selectedEmail.metadata?.eventType || '')}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Email Content */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">E-postinnhold</h3>
                  <div 
                    className="prose max-w-none"
                    dangerouslySetInnerHTML={{ __html: selectedEmail.body }}
                  />
                </div>

                {/* Metadata */}
                {selectedEmail.metadata && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Metadata</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {selectedEmail.metadata.companyId && (
                        <div>
                          <span className="text-sm font-medium text-gray-700">Bedrift ID:</span>
                          <p className="text-sm text-gray-900">{selectedEmail.metadata.companyId}</p>
                        </div>
                      )}
                      {selectedEmail.metadata.userId && (
                        <div>
                          <span className="text-sm font-medium text-gray-700">Bruker ID:</span>
                          <p className="text-sm text-gray-900">{selectedEmail.metadata.userId}</p>
                        </div>
                      )}
                      <div>
                        <span className="text-sm font-medium text-gray-700">Hendelsestidspunkt:</span>
                        <p className="text-sm text-gray-900">
                          {new Date(selectedEmail.metadata.timestamp).toLocaleString('no-NO')}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end pt-6">
                <button
                  onClick={() => setShowEmailModal(false)}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                >
                  Lukk
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}