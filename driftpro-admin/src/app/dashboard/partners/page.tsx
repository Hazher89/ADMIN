'use client';

// GDPR COMPLIANCE: This page only shows partners for the current company
// All data is filtered by userProfile.companyId to prevent cross-company data access

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { firebaseService } from '@/lib/firebase-services';
import { 
  Handshake, 
  Plus, 
  Search, 
  Building,
  Phone,
  Mail,
  MapPin,
  Globe,
  Users,
  BarChart3,
  Eye,
  Edit,
  Trash2,
  MoreHorizontal,
  CheckCircle,
  Clock,
  AlertTriangle,
  ExternalLink,
  Star
} from 'lucide-react';

interface Partner {
  id: string;
  name: string;
  description: string;
  type: 'supplier' | 'customer' | 'vendor' | 'consultant';
  status: 'active' | 'inactive' | 'pending';
  contactPerson: string;
  email: string;
  phone: string;
  address: string;
  website?: string;
  rating: number;
  projects: number;
  revenue: number;
  createdAt: string;
  updatedAt: string;
}

export default function PartnersPage() {
  const { userProfile } = useAuth();
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const loadPartners = async () => {
      // GDPR: Only load partners for the current company
      if (!userProfile?.companyId) {
        console.log('No company ID found, cannot load partners');
        setLoading(false);
        return;
      }

      try {
        console.log('Loading partners for company:', userProfile.companyId);
        
        // Load partners from Firebase
        const partnersData = await firebaseService.getPartners(userProfile.companyId);
        setPartners(partnersData);
      } catch (error) {
        console.error('Error loading partners:', error);
        setPartners([]);
      } finally {
        setLoading(false);
      }
    };

    loadPartners();
  }, [userProfile?.companyId]);

  const filteredPartners = partners.filter(partner => {
    const matchesSearch = partner.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         partner.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         partner.contactPerson.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         partner.type.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'supplier':
        return '#3b82f6';
      case 'customer':
        return '#10b981';
      case 'vendor':
        return '#f59e0b';
      case 'consultant':
        return '#8b5cf6';
      default:
        return '#6b7280';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return '#10b981';
      case 'inactive':
        return '#6b7280';
      case 'pending':
        return '#f59e0b';
      default:
        return '#6b7280';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('no-NO', {
      style: 'currency',
      currency: 'NOK',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const stats = {
    total: partners.length,
    active: partners.filter(p => p.status === 'active').length,
    customers: partners.filter(p => p.type === 'customer').length,
    suppliers: partners.filter(p => p.type === 'supplier').length,
    totalRevenue: partners.reduce((sum, p) => sum + p.revenue, 0)
  };

  if (loading) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
        <div className="loading" style={{ margin: '0 auto 1rem' }}></div>
        <p style={{ color: '#666' }}>Laster samarbeidspartnere...</p>
      </div>
    );
  }

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
          <div className="card-icon">
            <Handshake />
          </div>
          <div>
            <h1 className="page-title">🤝 Samarbeidspartnere</h1>
            <p className="page-subtitle">
              Administrer leverandører, kunder og samarbeidspartnere
            </p>
          </div>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <span className="badge badge-primary">
            {partners.length} partnere
          </span>
          <span className="badge badge-secondary">
            {formatCurrency(stats.totalRevenue)} omsetning
          </span>
          <button className="btn btn-primary">
            <Plus style={{ width: '16px', height: '16px' }} />
            Ny partner
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-number">{stats.total}</div>
          <div className="stat-label">Totalt partnere</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{stats.active}</div>
          <div className="stat-label">Aktive</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{stats.customers}</div>
          <div className="stat-label">Kunder</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{stats.suppliers}</div>
          <div className="stat-label">Leverandører</div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <div className="search-container" style={{ flex: '1', minWidth: '300px' }}>
            <Search className="search-icon" />
            <input
              type="text"
              placeholder="Søk i samarbeidspartnere..."
              className="search-input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Partners Grid */}
      {filteredPartners.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <div style={{ marginBottom: '1rem' }}>
            <Handshake style={{ width: '48px', height: '48px', color: '#ccc', margin: '0 auto' }} />
          </div>
          <h3 style={{ color: '#666', marginBottom: '0.5rem' }}>Ingen samarbeidspartnere</h3>
          <p style={{ color: '#999', marginBottom: '1.5rem' }}>
            Du har ikke lagt til noen samarbeidspartnere ennå. Klikk på "Ny partner" for å komme i gang.
          </p>
          <button className="btn btn-primary">
            <Plus style={{ width: '16px', height: '16px' }} />
            Legg til første partner
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-3">
          {filteredPartners.map((partner) => (
          <div key={partner.id} className="card">
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', marginBottom: '1rem' }}>
              <div className="card-icon">
                <Building />
              </div>
              <div style={{ flex: '1' }}>
                <h3 style={{ 
                  fontWeight: '600', 
                  color: '#333',
                  fontSize: '1.1rem',
                  marginBottom: '0.25rem'
                }}>
                  {partner.name}
                </h3>
                <p style={{ color: '#666', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                  {partner.description}
                </p>
              </div>
              <button className="btn btn-secondary" style={{ padding: '0.5rem' }}>
                <MoreHorizontal style={{ width: '16px', height: '16px' }} />
              </button>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <Users style={{ width: '14px', height: '14px', color: '#666' }} />
                <span style={{ fontSize: '0.875rem', color: '#666' }}>
                  <strong>Kontakt:</strong> {partner.contactPerson}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <Mail style={{ width: '14px', height: '14px', color: '#666' }} />
                <span style={{ fontSize: '0.875rem', color: '#666' }}>
                  {partner.email}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <Phone style={{ width: '14px', height: '14px', color: '#666' }} />
                <span style={{ fontSize: '0.875rem', color: '#666' }}>
                  {partner.phone}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <MapPin style={{ width: '14px', height: '14px', color: '#666' }} />
                <span style={{ fontSize: '0.875rem', color: '#666' }}>
                  {partner.address}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <BarChart3 style={{ width: '14px', height: '14px', color: '#666' }} />
                <span style={{ fontSize: '0.875rem', color: '#666' }}>
                  <strong>Omsetning:</strong> {formatCurrency(partner.revenue)}
                </span>
              </div>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <div style={{ fontSize: '0.75rem', color: '#666' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                  <Star style={{ width: '12px', height: '12px', color: '#f59e0b' }} />
                  <span>Rating: {partner.rating}/5.0</span>
                </div>
                <div>Prosjekter: {partner.projects}</div>
                <div>Opprettet: {new Date(partner.createdAt).toLocaleDateString('no-NO')}</div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button className="btn btn-secondary" style={{ fontSize: '0.75rem', padding: '0.25rem 0.75rem' }}>
                <Eye style={{ width: '14px', height: '14px' }} />
                Se
              </button>
              <button className="btn btn-secondary" style={{ fontSize: '0.75rem', padding: '0.25rem 0.75rem' }}>
                <Edit style={{ width: '14px', height: '14px' }} />
                Rediger
              </button>
              {partner.website && (
                <button className="btn btn-secondary" style={{ fontSize: '0.75rem', padding: '0.25rem 0.75rem' }}>
                  <ExternalLink style={{ width: '14px', height: '14px' }} />
                  Nettside
                </button>
              )}
              <button className="btn btn-secondary" style={{ fontSize: '0.75rem', padding: '0.25rem 0.75rem' }}>
                <BarChart3 style={{ width: '14px', height: '14px' }} />
                Rapporter
              </button>
              <button className="btn btn-secondary" style={{ 
                fontSize: '0.75rem', 
                padding: '0.25rem 0.5rem',
                color: '#ef4444',
                borderColor: '#ef4444'
              }}>
                <Trash2 style={{ width: '14px', height: '14px' }} />
              </button>
            </div>
          </div>
        ))}
        </div>
      )}
    </div>
  );
} 