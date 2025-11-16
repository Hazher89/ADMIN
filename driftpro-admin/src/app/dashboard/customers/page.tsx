'use client';

import React, { useState, useEffect } from 'react';
import { 
  UserCheck, 
  Plus, 
  Edit, 
  Trash2, 
  Eye,
  Search,
  Filter,
  MoreHorizontal,
  X,
  Check,
  Phone,
  Mail,
  MapPin,
  Building,
  Star,
  TrendingUp,
  DollarSign,
  Calendar,
  RefreshCw
} from 'lucide-react';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, where, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';

interface Customer {
  id?: string;
  name: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: string;
  type: 'privat' | 'bedrift';
  status: 'active' | 'inactive' | 'prospect';
  totalOrders: number;
  totalValue: number;
  lastOrder: string;
  customerSince: string;
  rating: number;
  companyId: string;
  orders: string[];
  createdAt?: any;
  updatedAt?: any;
}

export default function CustomersPage() {
  const { userProfile } = useAuth();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Load customers from Firebase
  const loadCustomers = async () => {
    if (!db || !userProfile?.companyId) return;
    
    setLoading(true);
    try {
      const customersQuery = query(
        collection(db, 'customers'),
        where('companyId', '==', userProfile.companyId)
      );
      const customersSnapshot = await getDocs(customersQuery);
      const customersData = customersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Customer[];
      
      setCustomers(customersData);
      console.log(`✅ Lastet ${customersData.length} kunder fra Firebase`);
    } catch (error) {
      console.error('Error loading customers:', error);
    } finally {
      setLoading(false);
    }
  };

  // Load customers on component mount
  useEffect(() => {
    loadCustomers();
  }, [userProfile?.companyId]);

  // Calculate stats
  const stats = {
    total: customers.length,
    active: customers.filter(c => c.status === 'active').length,
    inactive: customers.filter(c => c.status === 'inactive').length,
    prospect: customers.filter(c => c.status === 'prospect').length,
    totalValue: customers.reduce((sum, c) => sum + c.totalValue, 0),
    totalOrders: customers.reduce((sum, c) => sum + c.totalOrders, 0)
  };

  const filteredCustomers = customers.filter(customer => {
    const matchesSearch = customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         customer.contactPerson.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         customer.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || customer.type === filterType;
    const matchesStatus = filterStatus === 'all' || customer.status === filterStatus;
    return matchesSearch && matchesType && matchesStatus;
  });


  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'Aktiv';
      case 'inactive': return 'Inaktiv';
      case 'prospect': return 'Potensiell';
      default: return status;
    }
  };

  const getStatusBadge = (status: string) => {
    const colors = {
      active: 'bg-green-100 text-green-800',
      inactive: 'bg-gray-100 text-gray-800',
      prospect: 'bg-blue-100 text-blue-800'
    };
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[status as keyof typeof colors] || colors.inactive}`}>
        {getStatusText(status)}
      </span>
    );
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('nb-NO', {
      style: 'currency',
      currency: 'NOK'
    }).format(amount);
  };



  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Header */}
      {isMobile && (
        <div className="bg-white shadow-sm border-b border-gray-200 px-4 py-3">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-semibold text-gray-900">Kunder</h1>
              <p className="text-sm text-gray-600">{filteredCustomers.length} kunder</p>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="p-2 rounded-lg bg-blue-600 text-white"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* Desktop Header */}
      {!isMobile && (
        <div className="page-header">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="page-title">👥 Kunder</h1>
              <p className="page-subtitle">
                Administrer kunder og kundeforhold
              </p>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="btn btn-primary"
            >
              <Plus className="w-4 h-4 mr-2" />
              Legg til kunde
            </button>
          </div>
        </div>
      )}

      {/* Stats Section */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
        gap: isMobile ? '0.625rem' : '1rem',
        marginBottom: isMobile ? '0.75rem' : '2rem',
        padding: isMobile ? '0 0.75rem' : undefined
      }}>
        <div style={{
          borderRadius: '0.875rem',
          padding: isMobile ? '0.875rem' : '1rem',
          background: 'var(--card-background)',
          border: '1px solid var(--border-color)',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: isMobile ? '1.5rem' : '1.75rem', fontWeight: 700, color: 'var(--text-color)', marginBottom: '0.25rem' }}>
            {stats.total}
          </div>
          <div style={{ fontSize: isMobile ? '0.75rem' : '0.875rem', color: 'var(--gray-500)', fontWeight: 500 }}>
            Totalt
          </div>
        </div>
        <div style={{
          borderRadius: '0.875rem',
          padding: isMobile ? '0.875rem' : '1rem',
          background: 'var(--card-background)',
          border: '1px solid var(--border-color)',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: isMobile ? '1.5rem' : '1.75rem', fontWeight: 700, color: '#22c55e', marginBottom: '0.25rem' }}>
            {stats.active}
          </div>
          <div style={{ fontSize: isMobile ? '0.75rem' : '0.875rem', color: 'var(--gray-500)', fontWeight: 500 }}>
            Aktive
          </div>
        </div>
        <div style={{
          borderRadius: '0.875rem',
          padding: isMobile ? '0.875rem' : '1rem',
          background: 'var(--card-background)',
          border: '1px solid var(--border-color)',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: isMobile ? '1.5rem' : '1.75rem', fontWeight: 700, color: 'var(--gray-500)', marginBottom: '0.25rem' }}>
            {stats.inactive}
          </div>
          <div style={{ fontSize: isMobile ? '0.75rem' : '0.875rem', color: 'var(--gray-500)', fontWeight: 500 }}>
            Inaktive
          </div>
        </div>
        <div style={{
          borderRadius: '0.875rem',
          padding: isMobile ? '0.875rem' : '1rem',
          background: 'var(--card-background)',
          border: '1px solid var(--border-color)',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: isMobile ? '1.5rem' : '1.75rem', fontWeight: 700, color: '#3b82f6', marginBottom: '0.25rem' }}>
            {stats.prospect}
          </div>
          <div style={{ fontSize: isMobile ? '0.75rem' : '0.875rem', color: 'var(--gray-500)', fontWeight: 500 }}>
            Potensielle
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div style={{
        padding: isMobile ? '0 0.75rem' : undefined,
        marginBottom: isMobile ? '0.75rem' : '2rem'
      }}>
        <div style={{
          borderRadius: '0.875rem',
          padding: isMobile ? '0.75rem' : '1rem',
          background: 'var(--card-background)',
          border: '1px solid var(--border-color)',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          gap: isMobile ? '0.5rem' : '1rem',
          alignItems: isMobile ? 'stretch' : 'center'
        }}>
          <div style={{ position: 'relative', flex: isMobile ? 'none' : 1, width: isMobile ? '100%' : undefined }}>
            <Search style={{
              position: 'absolute',
              left: isMobile ? '0.875rem' : '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--gray-400)',
              width: isMobile ? '18px' : '16px',
              height: isMobile ? '18px' : '16px'
            }} />
            <input
              type="text"
              placeholder="Søk etter navn, e-post eller kontaktperson..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: isMobile ? '0.875rem 0.875rem 0.875rem 2.75rem' : '0.75rem 0.75rem 0.75rem 2.5rem',
                border: '1px solid var(--border-color)',
                borderRadius: isMobile ? '0.5rem' : 'var(--radius-lg)',
                outline: 'none',
                fontSize: isMobile ? '16px' : undefined,
                background: 'var(--card-background)'
              }}
            />
          </div>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            style={{
              width: isMobile ? '100%' : 'auto',
              padding: isMobile ? '0.875rem' : '0.75rem 1rem',
              border: '1px solid var(--border-color)',
              borderRadius: isMobile ? '0.5rem' : 'var(--radius-lg)',
              fontSize: isMobile ? '16px' : undefined,
              background: 'var(--card-background)',
              minHeight: isMobile ? '44px' : undefined
            }}
          >
            <option value="all">Alle typer</option>
            <option value="bedrift">Bedrift</option>
            <option value="privat">Privat</option>
          </select>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            style={{
              width: isMobile ? '100%' : 'auto',
              padding: isMobile ? '0.875rem' : '0.75rem 1rem',
              border: '1px solid var(--border-color)',
              borderRadius: isMobile ? '0.5rem' : 'var(--radius-lg)',
              fontSize: isMobile ? '16px' : undefined,
              background: 'var(--card-background)',
              minHeight: isMobile ? '44px' : undefined
            }}
          >
            <option value="all">Alle statuser</option>
            <option value="active">Aktiv</option>
            <option value="inactive">Inaktiv</option>
            <option value="prospect">Potensiell</option>
          </select>
          {!isMobile && (
            <button
              onClick={loadCustomers}
              disabled={loading}
              className="btn btn-secondary"
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', whiteSpace: 'nowrap' }}
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span>Oppdater</span>
            </button>
          )}
        </div>
        {isMobile && (
          <button
            onClick={loadCustomers}
            disabled={loading}
            className="btn btn-secondary"
            style={{
              width: '100%',
              marginTop: '0.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              minHeight: '44px'
            }}
          >
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
            Oppdater
          </button>
        )}
      </div>

      {/* Customers Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
        gap: isMobile ? '0.625rem' : '1rem',
        padding: isMobile ? '0 0.75rem' : undefined
      }}>
        {filteredCustomers.map((customer) => {
          const statusBadge = getStatusBadge(customer.status);
          return (
            <div key={customer.id} className="card">
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', marginBottom: '1rem' }}>
                <div className="card-icon">
                  <UserCheck className="w-6 h-6" />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <h3 className="card-title">{customer.name}</h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      {statusBadge}
                      <button 
                        className="card-action"
                        onClick={() => {
                          setSelectedCustomer(customer);
                          setShowViewModal(true);
                        }}
                      >
                        <MoreHorizontal className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <Mail className="w-4 h-4 text-gray-400" />
                    <span className="card-text">{customer.email}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <Phone className="w-4 h-4 text-gray-400" />
                    <span className="card-text">{customer.phone}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <MapPin className="w-4 h-4 text-gray-400" />
                    <span className="card-text">{customer.address}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <Building className="w-4 h-4 text-gray-400" />
                    <span className="card-text capitalize">{customer.type}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Star className="w-4 h-4 text-yellow-500" />
                      <span className="card-text">{customer.rating}</span>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div className="card-text font-medium">{formatCurrency(customer.totalValue)}</div>
                      <div className="card-text-sm">{customer.totalOrders} ordre</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Customer Modal */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-content max-w-lg">
            <div className="modal-header">
              <h2 className="modal-title">Ny kunde</h2>
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">Firmanavn</label>
                  <input 
                    type="text" 
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Firmanavn eller navn"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Kontaktperson</label>
                  <input 
                    type="text" 
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Navn på kontaktperson"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">E-post</label>
                    <input 
                      type="email" 
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="epost@firma.no"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Telefon</label>
                    <input 
                      type="tel" 
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="+47 123 45 678"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Adresse</label>
                  <textarea 
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows={2}
                    placeholder="Gateadresse, postnummer og sted"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                    <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                      <option value="bedrift">Bedrift</option>
                      <option value="privat">Privat</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                      <option value="active">Aktiv</option>
                      <option value="inactive">Inaktiv</option>
                      <option value="prospect">Potensiell</option>
                    </select>
                  </div>
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
                    Opprett kunde
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



