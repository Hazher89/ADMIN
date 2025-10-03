'use client';

import React, { useState } from 'react';
import { 
  CreditCard, 
  Plus, 
  Edit, 
  Trash2, 
  Download, 
  Eye,
  Search,
  Filter,
  MoreHorizontal,
  X,
  Check,
  Clock,
  AlertCircle,
  DollarSign,
  TrendingUp,
  TrendingDown
} from 'lucide-react';

export default function PaymentsPage() {
  const [payments, setPayments] = useState([
    {
      id: 'PAY-2024-001',
      invoiceId: 'INV-2024-002',
      customer: 'Tech Solutions AS',
      amount: 15000,
      status: 'completed',
      method: 'bank_transfer',
      transactionId: 'TXN-789123',
      paidDate: '2024-01-25',
      processedDate: '2024-01-25'
    },
    {
      id: 'PAY-2024-002',
      invoiceId: 'INV-2024-001',
      customer: 'Acme Corporation',
      amount: 25000,
      status: 'pending',
      method: 'credit_card',
      transactionId: 'TXN-456789',
      paidDate: '2024-01-20',
      processedDate: null
    },
    {
      id: 'PAY-2024-003',
      invoiceId: 'INV-2024-003',
      customer: 'Nordic Industries',
      amount: 45000,
      status: 'failed',
      method: 'bank_transfer',
      transactionId: 'TXN-123456',
      paidDate: '2024-01-15',
      processedDate: null
    },
    {
      id: 'PAY-2024-004',
      invoiceId: 'INV-2024-004',
      customer: 'Startup Hub',
      amount: 8000,
      status: 'processing',
      method: 'paypal',
      transactionId: 'TXN-987654',
      paidDate: '2024-01-22',
      processedDate: null
    }
  ]);

  const [showAddModal, setShowAddModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  const filteredPayments = payments.filter(payment => {
    const matchesSearch = payment.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         payment.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         payment.invoiceId.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || payment.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-50';
      case 'pending': return 'text-yellow-600 bg-yellow-50';
      case 'processing': return 'text-blue-600 bg-blue-50';
      case 'failed': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed': return 'Fullført';
      case 'pending': return 'Venter';
      case 'processing': return 'Behandler';
      case 'failed': return 'Feilet';
      default: return status;
    }
  };

  const getMethodText = (method: string) => {
    switch (method) {
      case 'credit_card': return 'Kredittkort';
      case 'bank_transfer': return 'Bankoverføring';
      case 'paypal': return 'PayPal';
      case 'cash': return 'Kontant';
      default: return method;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('nb-NO', {
      style: 'currency',
      currency: 'NOK'
    }).format(amount);
  };

  const totalAmount = payments.reduce((sum, payment) => sum + payment.amount, 0);
  const completedAmount = payments
    .filter(payment => payment.status === 'completed')
    .reduce((sum, payment) => sum + payment.amount, 0);
  const pendingAmount = payments
    .filter(payment => payment.status === 'pending' || payment.status === 'processing')
    .reduce((sum, payment) => sum + payment.amount, 0);
  const failedAmount = payments
    .filter(payment => payment.status === 'failed')
    .reduce((sum, payment) => sum + payment.amount, 0);

  return (
    <div className="page-header">
      <div className="flex items-center space-x-3">
        <div className="card-icon">
          <CreditCard className="w-6 h-6" />
        </div>
        <div>
          <h1 className="page-title">Betalinger</h1>
          <p className="page-subtitle">Administrer betalinger og transaksjoner</p>
        </div>
      </div>

      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <Search className="w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="Søk betalinger..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div className="flex items-center space-x-2">
          <Filter className="w-4 h-4 text-gray-500" />
          <select 
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">Alle status</option>
            <option value="completed">Fullført</option>
            <option value="pending">Venter</option>
            <option value="processing">Behandler</option>
            <option value="failed">Feilet</option>
          </select>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="btn btn-primary"
        >
          <Plus className="w-4 h-4" />
          Ny betaling
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-6">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Totalt beløp</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalAmount)}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <DollarSign className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Fullført</p>
              <p className="text-2xl font-bold text-green-600">{formatCurrency(completedAmount)}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <Check className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Venter</p>
              <p className="text-2xl font-bold text-yellow-600">{formatCurrency(pendingAmount)}</p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-lg">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Feilet</p>
              <p className="text-2xl font-bold text-red-600">{formatCurrency(failedAmount)}</p>
            </div>
            <div className="p-3 bg-red-100 rounded-lg">
              <AlertCircle className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>
      </div>

      <div className="card mt-6">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-medium text-gray-900">Betalings-ID</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Faktura</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Kunde</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Beløp</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Metode</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Status</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Betalt</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Handlinger</th>
              </tr>
            </thead>
            <tbody>
              {filteredPayments.map((payment) => (
                <tr key={payment.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <span className="font-medium text-blue-600">{payment.id}</span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="font-medium text-gray-900">{payment.invoiceId}</span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-gray-900">{payment.customer}</span>
                  </td>
                  <td className="py-3 px-4 font-medium text-gray-900">
                    {formatCurrency(payment.amount)}
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-sm text-gray-600">
                      {getMethodText(payment.method)}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(payment.status)}`}>
                      {getStatusText(payment.status)}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-600">
                    {new Date(payment.paidDate).toLocaleDateString('nb-NO')}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center space-x-2">
                      <button className="p-1 hover:bg-gray-100 rounded" title="Vis">
                        <Eye className="w-4 h-4 text-gray-500" />
                      </button>
                      <button className="p-1 hover:bg-gray-100 rounded" title="Rediger">
                        <Edit className="w-4 h-4 text-gray-500" />
                      </button>
                      <button className="p-1 hover:bg-gray-100 rounded" title="Last ned">
                        <Download className="w-4 h-4 text-gray-500" />
                      </button>
                      <button className="p-1 hover:bg-gray-100 rounded" title="Mer">
                        <MoreHorizontal className="w-4 h-4 text-gray-500" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Payment Modal */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-content max-w-lg">
            <div className="modal-header">
              <h2 className="modal-title">Ny betaling</h2>
              <button 
                onClick={() => setShowAddModal(false)}
                className="modal-close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="modal-body">
              <form className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Faktura</label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                    <option>Velg faktura</option>
                    <option value="INV-2024-001">INV-2024-001 - Acme Corporation</option>
                    <option value="INV-2024-002">INV-2024-002 - Tech Solutions AS</option>
                    <option value="INV-2024-003">INV-2024-003 - Nordic Industries</option>
                    <option value="INV-2024-004">INV-2024-004 - Startup Hub</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Betaling</label>
                  <input 
                    type="number" 
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Beløp"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Betalingsmetode</label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                    <option value="credit_card">Kredittkort</option>
                    <option value="bank_transfer">Bankoverføring</option>
                    <option value="paypal">PayPal</option>
                    <option value="cash">Kontant</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Transaksjons-ID</label>
                  <input 
                    type="text" 
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="TXN-123456"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Betalingsdato</label>
                  <input 
                    type="date" 
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div className="flex items-center justify-end space-x-3 pt-4">
                  <button 
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="btn btn-secondary"
                  >
                    Avbryt
                  </button>
                  <button 
                    type="submit"
                    className="btn btn-primary"
                  >
                    <Plus className="w-4 h-4" />
                    Registrer betaling
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}



