'use client';

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
  Star,
  Upload,
  Download,
  FileText,
  Calendar,
  Tag,
  User,
  Hash,
  Briefcase,
  Target,
  TrendingUp,
  Filter,
  SortAsc,
  SortDesc,
  Grid,
  List,
  CheckCircle2,
  XCircle,
  Info,
  Database,
  RefreshCw,
  Save,
  Loader2,
  X,
  Link
} from 'lucide-react';

interface Partner {
  id: string;
  name: string;
  description: string;
  type: 'supplier' | 'customer' | 'vendor' | 'consultant';
  status: 'active' | 'inactive' | 'pending';
  orgNumber?: string;
  vatNumber?: string;
  industry?: string;
  companySize?: 'micro' | 'small' | 'medium' | 'large';
  foundedYear?: number;
  address: {
    street: string;
    city: string;
    postalCode: string;
    country: string;
  };
  contactPerson: {
    name: string;
    email: string;
    phone: string;
    position: string;
    department?: string;
    mobile?: string;
  };
  website?: string;
  rating: number;
  projects: number;
  revenue: number;
  notes?: string;
  tags?: string[];
  lastContact?: string;
  nextFollowUp?: string;
  contractStart?: string;
  contractEnd?: string;
  paymentTerms?: string;
  creditLimit?: number;
  createdAt: string;
  updatedAt: string;
}

interface PartnerAssignment {
  id: string;
  partnerId: string;
  partnerName: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  location: string;
  status: 'pending' | 'accepted' | 'declined' | 'completed' | 'cancelled';
  assignedBy: string;
  assignedTo: string;
  hourlyRate?: number;
  totalHours?: number;
  notes?: string;
  attachments?: string[];
  emailSent: boolean;
  emailSentAt?: string;
  createdAt: string;
  updatedAt: string;
}

export default function PartnersPage() {
  const { userProfile } = useAuth();
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [sortBy, setSortBy] = useState<'name' | 'revenue' | 'rating' | 'createdAt'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  // New tab state
  const [activeTab, setActiveTab] = useState<'partners' | 'assignments'>('partners');
  
  // Assignment states
  const [assignments, setAssignments] = useState<PartnerAssignment[]>([]);
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  const [newAssignment, setNewAssignment] = useState<Partial<PartnerAssignment>>({
    title: '',
    description: '',
    startDate: '',
    endDate: '',
    startTime: '',
    endTime: '',
    location: '',
    partnerId: '',
    assignedTo: '',
    hourlyRate: 0,
    notes: ''
  });

  const [showAddModal, setShowAddModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [newPartner, setNewPartner] = useState({
    name: '',
    description: '',
    type: 'supplier' as 'supplier' | 'customer' | 'vendor' | 'consultant',
    status: 'active' as 'active' | 'inactive' | 'pending',
    orgNumber: '',
    vatNumber: '',
    industry: '',
    companySize: 'small' as 'micro' | 'small' | 'medium' | 'large',
    foundedYear: new Date().getFullYear(),
    address: {
      street: '',
      city: '',
      postalCode: '',
      country: 'Norge'
    },
    contactPerson: {
      name: '',
      email: '',
      phone: '',
      position: '',
      department: '',
      mobile: ''
    },
    website: '',
    rating: 0,
    projects: 0,
    revenue: 0,
    notes: '',
    tags: '',
    lastContact: '',
    nextFollowUp: '',
    contractStart: '',
    contractEnd: '',
    paymentTerms: '',
    creditLimit: 0
  });

  const loadPartners = async () => {
    if (!userProfile?.companyId) {
      setLoading(false);
      return;
    }

    try {
      setError(null);
      const partnersData = await firebaseService.getPartners(userProfile.companyId);
      setPartners(partnersData);
    } catch (error) {
      console.error('Error loading partners:', error);
      setError('Feil ved lasting av partnere');
      setPartners([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPartners();
  }, [userProfile?.companyId]);

  const filteredPartners = partners.filter(partner => {
    const matchesSearch = partner.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = selectedType === 'all' || partner.type === selectedType;
    const matchesStatus = selectedStatus === 'all' || partner.status === selectedStatus;
    return matchesSearch && matchesType && matchesStatus;
  });

  const handleCreatePartner = async () => {
    if (!userProfile?.companyId) return;

    try {
      setError(null);
      const partnerData = {
        ...newPartner,
        tags: newPartner.tags ? newPartner.tags.split(',').map(tag => tag.trim()) : [],
        companyId: userProfile.companyId,
        createdBy: userProfile.id
      };

      await firebaseService.createPartner(partnerData);
      setSuccess('Partner opprettet');
      setShowAddModal(false);
      loadPartners();
    } catch (error) {
      console.error('Error creating partner:', error);
      setError('Feil ved opprettelse av partner');
    }
  };

  const handleViewPartner = (partner: Partner) => {
    setSelectedPartner(partner);
    setShowDetailModal(true);
  };

  const handleEditPartner = (partner: Partner) => {
    setSelectedPartner(partner);
    setNewPartner({
      name: partner.name,
      description: partner.description,
      type: partner.type,
      status: partner.status,
      orgNumber: partner.orgNumber || '',
      vatNumber: partner.vatNumber || '',
      industry: partner.industry || '',
      companySize: partner.companySize || 'small',
      foundedYear: partner.foundedYear || new Date().getFullYear(),
      address: partner.address,
      contactPerson: partner.contactPerson,
      website: partner.website || '',
      rating: partner.rating,
      projects: partner.projects,
      revenue: partner.revenue,
      notes: partner.notes || '',
      tags: partner.tags ? partner.tags.join(', ') : '',
      lastContact: partner.lastContact || '',
      nextFollowUp: partner.nextFollowUp || '',
      contractStart: partner.contractStart || '',
      contractEnd: partner.contractEnd || '',
      paymentTerms: partner.paymentTerms || '',
      creditLimit: partner.creditLimit || 0
    });
    setShowAddModal(true);
  };

  const handleDeletePartner = async (partner: Partner) => {
    if (!confirm('Er du sikker på at du vil slette denne partneren?')) return;

    try {
      await firebaseService.deletePartner(partner.id);
      setSuccess('Partner slettet');
      loadPartners();
    } catch (error) {
      console.error('Error deleting partner:', error);
      setError('Feil ved sletting av partner');
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

        {/* Tab Navigation */}
        <div style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'flex', borderBottom: '2px solid var(--gray-200)', gap: '0' }}>
            <button
              onClick={() => setActiveTab('partners')}
              style={{
                padding: '1rem 2rem',
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                borderBottom: activeTab === 'partners' ? '2px solid var(--primary)' : '2px solid transparent',
                color: activeTab === 'partners' ? 'var(--primary)' : 'var(--gray-600)',
                fontWeight: activeTab === 'partners' ? '600' : '500',
                fontSize: 'var(--font-size-base)'
              }}
            >
              <Handshake style={{ width: '16px', height: '16px', marginRight: '0.5rem', display: 'inline' }} />
              Samarbeidspartnere
            </button>
            <button
              onClick={() => setActiveTab('assignments')}
              style={{
                padding: '1rem 2rem',
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                borderBottom: activeTab === 'assignments' ? '2px solid var(--primary)' : '2px solid transparent',
                color: activeTab === 'assignments' ? 'var(--primary)' : 'var(--gray-600)',
                fontWeight: activeTab === 'assignments' ? '600' : '500',
                fontSize: 'var(--font-size-base)'
              }}
            >
              <Calendar style={{ width: '16px', height: '16px', marginRight: '0.5rem', display: 'inline' }} />
              Tildelt oppdrag
            </button>
          </div>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <span className="badge badge-primary">
            {partners.length} partnere
          </span>
          <span className="badge badge-secondary">
            {formatCurrency(stats.totalRevenue)} omsetning
          </span>
          <button 
            onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
            className="btn btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            {viewMode === 'grid' ? <List style={{ width: '16px', height: '16px' }} /> : <Grid style={{ width: '16px', height: '16px' }} />}
          </button>
          <button 
            onClick={() => setShowAddModal(true)}
            className="btn btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <Plus style={{ width: '16px', height: '16px' }} />
            Legg til partner
          </button>
        </div>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <div style={{ 
          padding: '1rem', 
          background: 'var(--green-50)', 
          border: '1px solid var(--green-200)', 
          borderRadius: 'var(--radius-lg)', 
          marginBottom: '2rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <CheckCircle style={{ width: '20px', height: '20px', color: 'var(--green-600)' }} />
          <p style={{ color: 'var(--green-700)', fontSize: 'var(--font-size-sm)' }}>{success}</p>
        </div>
      )}

      {error && (
        <div style={{ 
          padding: '1rem', 
          background: 'var(--red-50)', 
          border: '1px solid var(--red-200)', 
          borderRadius: 'var(--radius-lg)', 
          marginBottom: '2rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <AlertTriangle style={{ width: '20px', height: '20px', color: 'var(--red-600)' }} />
          <p style={{ color: 'var(--red-700)', fontSize: 'var(--font-size-sm)' }}>{error}</p>
        </div>
      )}

      {/* Main Content */}
      {activeTab === 'partners' ? (
        <>
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
                  placeholder="Søk i navn, org.nr, beskrivelse..."
                  className="search-input"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="form-select"
                style={{ minWidth: '150px' }}
              >
                <option value="all">Alle typer</option>
                <option value="supplier">Leverandør</option>
                <option value="customer">Kunde</option>
                <option value="vendor">Selger</option>
                <option value="consultant">Konsulent</option>
              </select>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="form-select"
                style={{ minWidth: '120px' }}
              >
                <option value="all">Alle status</option>
                <option value="active">Aktiv</option>
                <option value="inactive">Inaktiv</option>
                <option value="pending">Venter</option>
              </select>
            </div>
          </div>

          {/* Partners Grid */}
          {filteredPartners.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
              <Handshake style={{ width: '64px', height: '64px', color: '#ccc', margin: '0 auto 1rem' }} />
              <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#333', marginBottom: '0.5rem' }}>
                Ingen samarbeidspartnere funnet
              </h3>
              <p style={{ color: '#666', marginBottom: '1.5rem' }}>
                Du har ingen samarbeidspartnere registrert ennå
              </p>
              <button 
                className="btn btn-primary"
                onClick={() => setShowAddModal(true)}
              >
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
                  </div>

                  <div style={{ marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                      <User style={{ width: '14px', height: '14px', color: '#666' }} />
                      <span style={{ fontSize: '0.875rem', color: '#666' }}>
                        <strong>Kontakt:</strong> {partner.contactPerson.name}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                      <Mail style={{ width: '14px', height: '14px', color: '#666' }} />
                      <span style={{ fontSize: '0.875rem', color: '#666' }}>
                        {partner.contactPerson.email}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                      <Phone style={{ width: '14px', height: '14px', color: '#666' }} />
                      <span style={{ fontSize: '0.875rem', color: '#666' }}>
                        {partner.contactPerson.phone}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                      <MapPin style={{ width: '14px', height: '14px', color: '#666' }} />
                      <span style={{ fontSize: '0.875rem', color: '#666' }}>
                        {partner.address.street}, {partner.address.postalCode} {partner.address.city}
                      </span>
                    </div>
                    {partner.orgNumber && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                        <Hash style={{ width: '14px', height: '14px', color: '#666' }} />
                        <span style={{ fontSize: '0.875rem', color: '#666' }}>
                          Org.nr: {partner.orgNumber}
                        </span>
                      </div>
                    )}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <BarChart3 style={{ width: '14px', height: '14px', color: '#666' }} />
                      <span style={{ fontSize: '0.875rem', color: '#666' }}>
                        <strong>Omsetning:</strong> {formatCurrency(partner.revenue)}
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button 
                      onClick={() => handleViewPartner(partner)}
                      className="btn btn-secondary" 
                      style={{ fontSize: '0.75rem', padding: '0.25rem 0.75rem' }}
                    >
                      <Eye style={{ width: '14px', height: '14px' }} />
                      Se
                    </button>
                    <button 
                      onClick={() => handleEditPartner(partner)}
                      className="btn btn-secondary" 
                      style={{ fontSize: '0.75rem', padding: '0.25rem 0.75rem' }}
                    >
                      <Edit style={{ width: '14px', height: '14px' }} />
                      Rediger
                    </button>
                    <button 
                      onClick={() => handleDeletePartner(partner)}
                      className="btn btn-secondary" 
                      style={{ 
                        fontSize: '0.75rem', 
                        padding: '0.25rem 0.5rem',
                        color: '#ef4444',
                        borderColor: '#ef4444'
                      }}
                    >
                      <Trash2 style={{ width: '14px', height: '14px' }} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <Calendar style={{ width: '64px', height: '64px', color: '#ccc', margin: '0 auto 1rem' }} />
          <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#333', marginBottom: '0.5rem' }}>
            Tildelt oppdrag
          </h3>
          <p style={{ color: '#666', marginBottom: '1.5rem' }}>
            Funksjon under utvikling
          </p>
        </div>
      )}

      {/* Add Partner Modal */}
      {showAddModal && (
        <div style={{ 
          position: 'fixed', 
          top: 0, 
          left: 0, 
          right: 0, 
          bottom: 0, 
          background: 'rgba(0, 0, 0, 0.5)', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div className="card" style={{ width: '90%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: 'var(--font-size-xl)', fontWeight: '600', color: 'var(--gray-900)' }}>
                {selectedPartner ? 'Rediger partner' : 'Legg til partner'}
              </h2>
              <button
                onClick={() => setShowAddModal(false)}
                style={{ 
                  padding: '0.5rem', 
                  borderRadius: 'var(--radius-md)', 
                  border: 'none',
                  background: 'var(--gray-100)',
                  cursor: 'pointer'
                }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: 'grid', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: 'var(--gray-700)' }}>
                  Bedriftsnavn
                </label>
                <input
                  type="text"
                  value={newPartner.name}
                  onChange={(e) => setNewPartner({...newPartner, name: e.target.value})}
                  style={{ 
                    width: '100%', 
                    padding: '0.75rem', 
                    border: '1px solid var(--gray-300)', 
                    borderRadius: 'var(--radius-lg)', 
                    outline: 'none'
                  }}
                  placeholder="Bedriftsnavn"
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: 'var(--gray-700)' }}>
                  Beskrivelse
                </label>
                <textarea
                  value={newPartner.description}
                  onChange={(e) => setNewPartner({...newPartner, description: e.target.value})}
                  style={{ 
                    width: '100%', 
                    padding: '0.75rem', 
                    border: '1px solid var(--gray-300)', 
                    borderRadius: 'var(--radius-lg)', 
                    outline: 'none',
                    minHeight: '80px',
                    resize: 'vertical'
                  }}
                  placeholder="Beskrivelse av partneren"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: 'var(--gray-700)' }}>
                    Type
                  </label>
                  <select
                    value={newPartner.type}
                    onChange={(e) => setNewPartner({...newPartner, type: e.target.value as any})}
                    style={{ 
                      width: '100%', 
                      padding: '0.75rem', 
                      border: '1px solid var(--gray-300)', 
                      borderRadius: 'var(--radius-lg)', 
                      outline: 'none'
                    }}
                  >
                    <option value="supplier">Leverandør</option>
                    <option value="customer">Kunde</option>
                    <option value="vendor">Selger</option>
                    <option value="consultant">Konsulent</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: 'var(--gray-700)' }}>
                    Status
                  </label>
                  <select
                    value={newPartner.status}
                    onChange={(e) => setNewPartner({...newPartner, status: e.target.value as any})}
                    style={{ 
                      width: '100%', 
                      padding: '0.75rem', 
                      border: '1px solid var(--gray-300)', 
                      borderRadius: 'var(--radius-lg)', 
                      outline: 'none'
                    }}
                  >
                    <option value="active">Aktiv</option>
                    <option value="inactive">Inaktiv</option>
                    <option value="pending">Venter</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: 'var(--gray-700)' }}>
                  Org.nummer
                </label>
                <input
                  type="text"
                  value={newPartner.orgNumber}
                  onChange={(e) => setNewPartner({...newPartner, orgNumber: e.target.value})}
                  style={{ 
                    width: '100%', 
                    padding: '0.75rem', 
                    border: '1px solid var(--gray-300)', 
                    borderRadius: 'var(--radius-lg)', 
                    outline: 'none'
                  }}
                  placeholder="123456789"
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: 'var(--gray-700)' }}>
                  Kontaktperson navn
                </label>
                <input
                  type="text"
                  value={newPartner.contactPerson.name}
                  onChange={(e) => setNewPartner({
                    ...newPartner, 
                    contactPerson: {...newPartner.contactPerson, name: e.target.value}
                  })}
                  style={{ 
                    width: '100%', 
                    padding: '0.75rem', 
                    border: '1px solid var(--gray-300)', 
                    borderRadius: 'var(--radius-lg)', 
                    outline: 'none'
                  }}
                  placeholder="Kontaktperson navn"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: 'var(--gray-700)' }}>
                    E-post
                  </label>
                  <input
                    type="email"
                    value={newPartner.contactPerson.email}
                    onChange={(e) => setNewPartner({
                      ...newPartner, 
                      contactPerson: {...newPartner.contactPerson, email: e.target.value}
                    })}
                    style={{ 
                      width: '100%', 
                      padding: '0.75rem', 
                      border: '1px solid var(--gray-300)', 
                      borderRadius: 'var(--radius-lg)', 
                      outline: 'none'
                    }}
                    placeholder="kontakt@bedrift.no"
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: 'var(--gray-700)' }}>
                    Telefon
                  </label>
                  <input
                    type="tel"
                    value={newPartner.contactPerson.phone}
                    onChange={(e) => setNewPartner({
                      ...newPartner, 
                      contactPerson: {...newPartner.contactPerson, phone: e.target.value}
                    })}
                    style={{ 
                      width: '100%', 
                      padding: '0.75rem', 
                      border: '1px solid var(--gray-300)', 
                      borderRadius: 'var(--radius-lg)', 
                      outline: 'none'
                    }}
                    placeholder="12345678"
                  />
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowAddModal(false)}
                style={{ 
                  padding: '0.75rem 1.5rem', 
                  border: '1px solid var(--gray-300)', 
                  borderRadius: 'var(--radius-lg)', 
                  background: 'var(--white)',
                  color: 'var(--gray-700)',
                  cursor: 'pointer'
                }}
              >
                Avbryt
              </button>
              <button
                onClick={handleCreatePartner}
                className="btn btn-primary"
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
              >
                <Save style={{ width: '16px', height: '16px' }} />
                {selectedPartner ? 'Oppdater partner' : 'Opprett partner'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Partner Detail Modal */}
      {showDetailModal && selectedPartner && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'var(--white)',
            borderRadius: 'var(--radius-lg)',
            padding: '2rem',
            maxWidth: '800px',
            width: '95%',
            maxHeight: '95vh',
            overflow: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
              <div>
                <h2 style={{ fontSize: 'var(--font-size-xl)', fontWeight: '600', color: 'var(--gray-900)' }}>
                  <Handshake style={{ width: '24px', height: '24px', marginRight: '0.5rem' }} />
                  {selectedPartner.name}
                </h2>
                <p style={{ color: 'var(--gray-600)', fontSize: 'var(--font-size-sm)' }}>
                  Partner detaljer
                </p>
              </div>
              <button
                onClick={() => setShowDetailModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '0.5rem'
                }}
              >
                <X style={{ width: '20px', height: '20px', color: 'var(--gray-400)' }} />
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
              <div>
                <h3 style={{ fontSize: 'var(--font-size-lg)', fontWeight: '600', color: 'var(--gray-900)', marginBottom: '1rem' }}>
                  Partner Informasjon
                </h3>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div>
                    <strong>Bedriftsnavn:</strong> {selectedPartner.name}
                  </div>
                  <div>
                    <strong>Beskrivelse:</strong> {selectedPartner.description || 'Ikke spesifisert'}
                  </div>
                  <div>
                    <strong>Type:</strong> {selectedPartner.type}
                  </div>
                  <div>
                    <strong>Status:</strong> {selectedPartner.status}
                  </div>
                  {selectedPartner.orgNumber && (
                    <div>
                      <strong>Org.nummer:</strong> {selectedPartner.orgNumber}
                    </div>
                  )}
                  {selectedPartner.industry && (
                    <div>
                      <strong>Bransje:</strong> {selectedPartner.industry}
                    </div>
                  )}
                  {selectedPartner.website && (
                    <div>
                      <strong>Nettside:</strong> 
                      <a href={selectedPartner.website} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)', marginLeft: '0.5rem' }}>
                        {selectedPartner.website}
                      </a>
                    </div>
                  )}
                </div>

                <h4 style={{ fontSize: 'var(--font-size-base)', fontWeight: '600', color: 'var(--gray-900)', marginTop: '2rem', marginBottom: '1rem' }}>
                  Kontaktperson
                </h4>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div>
                    <strong>Navn:</strong> {selectedPartner.contactPerson.name || 'Ikke spesifisert'}
                  </div>
                  <div>
                    <strong>E-post:</strong> {selectedPartner.contactPerson.email || 'Ikke spesifisert'}
                  </div>
                  <div>
                    <strong>Telefon:</strong> {selectedPartner.contactPerson.phone || 'Ikke spesifisert'}
                  </div>
                  <div>
                    <strong>Stilling:</strong> {selectedPartner.contactPerson.position || 'Ikke spesifisert'}
                  </div>
                </div>
              </div>

              <div>
                <h3 style={{ fontSize: 'var(--font-size-lg)', fontWeight: '600', color: 'var(--gray-900)', marginBottom: '1rem' }}>
                  Adresse
                </h3>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div>
                    <strong>Gateadresse:</strong> {selectedPartner.address.street}
                  </div>
                  <div>
                    <strong>Postnummer:</strong> {selectedPartner.address.postalCode}
                  </div>
                  <div>
                    <strong>Poststed:</strong> {selectedPartner.address.city}
                  </div>
                  <div>
                    <strong>Land:</strong> {selectedPartner.address.country}
                  </div>
                </div>

                <h4 style={{ fontSize: 'var(--font-size-base)', fontWeight: '600', color: 'var(--gray-900)', marginTop: '2rem', marginBottom: '1rem' }}>
                  Økonomisk informasjon
                </h4>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div>
                    <strong>Omsetning:</strong> {formatCurrency(selectedPartner.revenue)}
                  </div>
                  <div>
                    <strong>Rating:</strong> {selectedPartner.rating}/5.0
                  </div>
                  <div>
                    <strong>Prosjekter:</strong> {selectedPartner.projects}
                  </div>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowDetailModal(false)}
                style={{
                  padding: '0.75rem 1.5rem',
                  border: '1px solid var(--gray-300)',
                  borderRadius: 'var(--radius-lg)',
                  background: 'var(--white)',
                  color: 'var(--gray-700)',
                  cursor: 'pointer'
                }}
              >
                Lukk
              </button>
              <button
                onClick={() => {
                  setShowDetailModal(false);
                  handleEditPartner(selectedPartner);
                }}
                className="btn btn-primary"
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
              >
                <Edit style={{ width: '16px', height: '16px' }} />
                Rediger
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
