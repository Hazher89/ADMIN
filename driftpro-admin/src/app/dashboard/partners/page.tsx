'use client';

// GDPR COMPLIANCE: This page only shows partners for the current company
// All data is filtered by userProfile.companyId to prevent cross-company data access

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { firebaseService } from '@/lib/firebase-services';
import { brrgService } from '@/lib/brrg-service';
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
  brrgData?: BRRGCompany; // Extended BRRG information
}

interface BRRGCompany {
  organisasjonsnummer: string;
  navn: string;
  organisasjonsform?: {
    kode: string;
    beskrivelse: string;
  };
  registreringsdatoEnhetsregisteret?: string;
  registrertIMvaregisteret?: boolean;
  naeringskode1?: {
    kode: string;
    beskrivelse: string;
  };
  antallAnsatte?: number;
  forretningsadresse?: {
    adresse: string;
    postnummer: string;
    poststed: string;
    land: string;
  };
  kontaktinformasjon?: {
    telefon?: string;
    epost?: string;
  };
  // Extended BRRG information
  stiftelsesdato?: string;
  konkurs?: boolean;
  underAvvikling?: boolean;
  underTvangsavviklingEllerTvangsopplosning?: boolean;
  maalform?: string;
  institusjonellSektorkode?: {
    kode: string;
    beskrivelse: string;
  };
  naeringskode2?: {
    kode: string;
    beskrivelse: string;
  };
  naeringskode3?: {
    kode: string;
    beskrivelse: string;
  };
  hjemmeside?: string;
  ansatte?: {
    interval: string;
    antall: number;
  };
  registreringIMvaregisteret?: {
    registrertIMvaregisteret: boolean;
    varemerkebeskyttelse: string[];
  };
  rolleregister?: {
    enheter?: Array<{
      organisasjonsnummer: string;
      navn: string;
      rolle: string;
    }>;
  };
  registre?: {
    enhetsregisteret?: boolean;
    foretaksregisteret?: boolean;
    mvaregisteret?: boolean;
    frivillighetsregisteret?: boolean;
    stiftelsesregisteret?: boolean;
  };
  tilknyttedeVirksomheter?: Array<{
    organisasjonsnummer: string;
    navn: string;
    organisasjonsform: string;
    rolle: string;
  }>;
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
  const [showAddModal, setShowAddModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showBRRGModal, setShowBRRGModal] = useState(false);
  const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null);
  const [searchingBRRG, setSearchingBRRG] = useState(false);
  const [brrgResults, setBrrgResults] = useState<BRRGCompany[]>([]);
  const [selectedBRRGCompany, setSelectedBRRGCompany] = useState<BRRGCompany | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [bulkOrgNumbers, setBulkOrgNumbers] = useState('');
  const [processingBulk, setProcessingBulk] = useState(false);
  const [brrgSearchQuery, setBrrgSearchQuery] = useState('');
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
    // GDPR: Only load partners for the current company
    if (!userProfile?.companyId) {
      console.log('No company ID found, cannot load partners');
      setLoading(false);
      return;
    }

    try {
      console.log('Loading partners for company:', userProfile.companyId);
      setError(null);
      
      // Load partners from Firebase
      const partnersData = await firebaseService.getPartners(userProfile.companyId);
      console.log('📋 Loaded partners from Firebase:', partnersData);
      console.log('📋 Partner names:', partnersData.map(p => `${p.name} (${p.orgNumber})`));
      setPartners(partnersData);
    } catch (error) {
      console.error('Error loading partners:', error);
      setError('Feil ved lasting av partnere: ' + (error instanceof Error ? error.message : 'Ukjent feil'));
      setPartners([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPartners();
  }, [userProfile?.companyId]);

  const filteredPartners = partners.filter(partner => {
    const matchesSearch = partner.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         partner.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         partner.contactPerson.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         partner.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (partner.orgNumber && partner.orgNumber.includes(searchTerm)) ||
                         (partner.tags && partner.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase())));
    const matchesType = selectedType === 'all' || partner.type === selectedType;
    const matchesStatus = selectedStatus === 'all' || partner.status === selectedStatus;
    return matchesSearch && matchesType && matchesStatus;
  }).sort((a, b) => {
    let comparison = 0;
    switch (sortBy) {
      case 'revenue':
        comparison = (a.revenue || 0) - (b.revenue || 0);
        break;
      case 'rating':
        comparison = (a.rating || 0) - (b.rating || 0);
        break;
      case 'createdAt':
        comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        break;
      case 'name':
      default:
        comparison = (a.name || '').localeCompare(b.name || '');
        break;
    }
    return sortOrder === 'asc' ? comparison : -comparison;
  });

  // BRRG Search Functions
  const searchBRRG = async (query: string) => {
    if (!query.trim()) return;
    
    setSearchingBRRG(true);
    setError(null);
    setBrrgResults([]); // Clear previous results
    setSelectedBRRGCompany(null); // Clear selected company
    
    try {
      const response = await fetch(`/api/brrg/search?query=${encodeURIComponent(query)}`);
      if (!response.ok) {
        throw new Error('Feil ved søk i BRRG');
      }
      
      const data = await response.json();
      setBrrgResults(data.results || []);
    } catch (error) {
      console.error('Error searching BRRG:', error);
      setError('Feil ved søk i BRRG: ' + (error instanceof Error ? error.message : 'Ukjent feil'));
    } finally {
      setSearchingBRRG(false);
    }
  };

  const selectBRRGCompany = (company: BRRGCompany) => {
    setSelectedBRRGCompany(company);
    setNewPartner({
      ...newPartner,
      name: company.navn,
      orgNumber: company.organisasjonsnummer,
      industry: company.naeringskode1?.beskrivelse || '',
      address: {
        street: company.forretningsadresse?.adresse || '',
        city: company.forretningsadresse?.poststed || '',
        postalCode: company.forretningsadresse?.postnummer || '',
        country: company.forretningsadresse?.land || 'Norge'
      },
      contactPerson: {
        ...newPartner.contactPerson,
        email: company.kontaktinformasjon?.epost || '',
        phone: company.kontaktinformasjon?.telefon || ''
      }
    });
  };

  const handleCreatePartner = async () => {
    if (!userProfile?.companyId) {
      setError('Ingen bedrift valgt');
      return;
    }

    // No required fields - allow creation with minimal data
    if (!newPartner.name.trim()) {
      setNewPartner({...newPartner, name: 'Ukjent bedrift'});
    }

    // Check if partner already exists with this org number
    if (newPartner.orgNumber) {
      const existingPartner = partners.find(p => p.orgNumber === newPartner.orgNumber);
      if (existingPartner) {
        setError(`Partner med org.nummer ${newPartner.orgNumber} (${existingPartner.name}) er allerede registrert.`);
        return;
      }
    }

    try {
      setError(null);
      const partnerData = {
        ...newPartner,
        tags: newPartner.tags ? newPartner.tags.split(',').map(tag => tag.trim()) : [],
        companyId: userProfile.companyId,
        createdBy: userProfile.id
      };

      await firebaseService.createPartner(partnerData);
      setSuccess(`Partner "${newPartner.name}" ble opprettet`);
      setShowAddModal(false);
      setNewPartner({
        name: '',
        description: '',
        type: 'supplier',
        status: 'active',
        orgNumber: '',
        vatNumber: '',
        industry: '',
        companySize: 'small',
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
      setSelectedBRRGCompany(null);
      loadPartners();
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      console.error('Error creating partner:', error);
      setError('Feil ved opprettelse av partner: ' + (error instanceof Error ? error.message : 'Ukjent feil'));
    }
  };

  const handleBulkImport = async () => {
    if (!userProfile?.companyId) {
      setError('Ingen bedrift valgt');
      return;
    }

    const orgNumbers = bulkOrgNumbers.split('\n').map(num => num.trim()).filter(num => num.length > 0);
    console.log('Raw bulk input:', bulkOrgNumbers);
    console.log('Org numbers to process:', orgNumbers);
    console.log('Number of org numbers:', orgNumbers.length);
    
    if (orgNumbers.length === 0) {
      setError('Ingen organisasjonsnumre funnet');
      return;
    }

    setProcessingBulk(true);
    setError(null);
    let successCount = 0;
    let errorCount = 0;

    for (const orgNumber of orgNumbers) {
      try {
        console.log(`Processing org number: ${orgNumber}`);
        // Search BRRG for each org number
        console.log(`🔍 Searching BRRG for org number: ${orgNumber}`);
        const response = await fetch(`/api/brrg/search?query=${encodeURIComponent(orgNumber)}`);
        console.log(`📡 BRRG response status: ${response.status}`);
        
        if (response.ok) {
          const data = await response.json();
          const company = data.results?.[0];
          
          console.log(`✅ Found company for ${orgNumber}:`, company);
          console.log(`📋 Company name: ${company?.navn}`);
          console.log(`📋 Company org number: ${company?.organisasjonsnummer}`);
          
          if (company) {
            // Check if partner already exists with this org number
            const existingPartner = partners.find(p => p.orgNumber === orgNumber);
            
            if (existingPartner) {
              console.log(`⚠️ Partner already exists with org number ${orgNumber}: ${existingPartner.name}`);
              errorCount++;
              continue; // Skip this one and continue with next
            }

            const partnerData = {
              name: company.navn,
              description: `${company.navn} - ${company.naeringskode1?.beskrivelse || 'Bedrift'}`,
              type: 'supplier' as const,
              status: 'active' as const,
              orgNumber: orgNumber, // Use the original org number from input
              industry: company.naeringskode1?.beskrivelse || '',
              companySize: 'small' as const,
              foundedYear: new Date().getFullYear(),
              address: {
                street: company.forretningsadresse?.adresse || '',
                city: company.forretningsadresse?.poststed || '',
                postalCode: company.forretningsadresse?.postnummer || '',
                country: company.forretningsadresse?.land || 'Norge'
              },
              contactPerson: {
                name: '',
                email: company.kontaktinformasjon?.epost || '',
                phone: company.kontaktinformasjon?.telefon || '',
                position: '',
                department: '',
                mobile: ''
              },
              website: '',
              rating: 0,
              projects: 0,
              revenue: 0,
              notes: '',
              tags: [],
              lastContact: '',
              nextFollowUp: '',
              contractStart: '',
              contractEnd: '',
              paymentTerms: '',
              creditLimit: 0,
              companyId: userProfile.companyId,
              createdBy: userProfile.id
            };

            console.log(`💾 Creating partner with data:`, partnerData);
            console.log(`🏢 Partner name to be created: ${partnerData.name}`);
            console.log(`🔢 Partner org number to be created: ${partnerData.orgNumber}`);
            
            await firebaseService.createPartner(partnerData);
            console.log(`✅ Successfully created partner for org ${orgNumber}: ${company.navn}`);
            successCount++;
          } else {
            errorCount++;
          }
        } else {
          errorCount++;
        }
      } catch (error) {
        console.error(`Error importing org number ${orgNumber}:`, error);
        errorCount++;
      }
    }

    setProcessingBulk(false);
    setShowBulkModal(false);
    setBulkOrgNumbers('');
    
    if (successCount > 0) {
      const message = `${successCount} partnere importert vellykket`;
      if (errorCount > 0) {
        setSuccess(`${message}, ${errorCount} hoppet over (allerede registrert)`);
      } else {
        setSuccess(message);
      }
      loadPartners();
    } else if (errorCount > 0) {
      setError(`${errorCount} partnere hoppet over - allerede registrert i systemet.`);
    } else {
      setError(`Ingen partnere kunne importeres.`);
    }
    
    setTimeout(() => setSuccess(null), 5000);
  };

  // Partner Action Functions
  const handleViewPartner = async (partner: Partner) => {
    setSelectedPartner(partner);
    setShowDetailModal(true);
    
    // Fetch detailed BRRG information if we have an org number
    if (partner.orgNumber) {
      try {
        console.log('Fetching BRRG data for org number:', partner.orgNumber);
        const brrgData = await brrgService.getCompanyInfo(partner.orgNumber);
        if (brrgData) {
          console.log('BRRG data received:', brrgData);
          setSelectedPartner({ ...partner, brrgData });
        } else {
          console.log('No BRRG data found for org number:', partner.orgNumber);
        }
      } catch (error) {
        console.error('Error fetching BRRG details:', error);
        // Still show the modal even if BRRG data fails
      }
    } else {
      console.log('No org number available for partner:', partner.name);
    }
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

  const handleUpdatePartner = async () => {
    if (!selectedPartner || !userProfile?.companyId) {
      setError('Ingen partner valgt');
      return;
    }

    try {
      setError(null);
      const partnerData = {
        ...newPartner,
        tags: newPartner.tags ? newPartner.tags.split(',').map(tag => tag.trim()) : [],
        updatedAt: new Date().toISOString()
      };

      await firebaseService.updatePartner(selectedPartner.id, partnerData);
      setSuccess(`Partner "${newPartner.name}" ble oppdatert`);
      setShowAddModal(false);
      setSelectedPartner(null);
      loadPartners();
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      console.error('Error updating partner:', error);
      setError('Feil ved oppdatering av partner: ' + (error instanceof Error ? error.message : 'Ukjent feil'));
    }
  };

  const handleDeletePartner = async (partner: Partner) => {
    if (!confirm(`Er du sikker på at du vil slette partner "${partner.name}"?`)) {
      return;
    }

    try {
      setError(null);
      await firebaseService.deletePartner(partner.id);
      setSuccess(`Partner "${partner.name}" ble slettet`);
      loadPartners();
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      console.error('Error deleting partner:', error);
      setError('Feil ved sletting av partner: ' + (error instanceof Error ? error.message : 'Ukjent feil'));
    }
  };

  const handlePartnerReports = (partner: Partner) => {
    // Open reports modal or navigate to reports page
    alert(`Rapporter for ${partner.name} - Funksjon under utvikling`);
  };

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
          <button 
            onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
            className="btn btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            title={viewMode === 'grid' ? 'Listevisning' : 'Rutenettvisning'}
          >
            {viewMode === 'grid' ? <List style={{ width: '16px', height: '16px' }} /> : <Grid style={{ width: '16px', height: '16px' }} />}
          </button>
          <button 
            onClick={() => setShowBulkModal(true)}
            className="btn btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <Upload style={{ width: '16px', height: '16px' }} />
            Mass import
          </button>
          <button 
            onClick={() => setShowBRRGModal(true)}
            className="btn btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <Database style={{ width: '16px', height: '16px' }} />
            Legg til fra BRRG
          </button>
          <button 
            onClick={() => setShowAddModal(true)}
            className="btn btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <Plus style={{ width: '16px', height: '16px' }} />
            Legg til manuelt
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

      {/* Search and Filters */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <div className="search-container" style={{ flex: '1', minWidth: '300px' }}>
            <Search className="search-icon" />
            <input
              type="text"
              placeholder="Søk i navn, org.nr, beskrivelse, tags..."
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
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'name' | 'revenue' | 'rating' | 'createdAt')}
            className="form-select"
            style={{ minWidth: '120px' }}
          >
            <option value="name">Navn</option>
            <option value="revenue">Omsetning</option>
            <option value="rating">Rating</option>
            <option value="createdAt">Dato</option>
          </select>
          <button
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            className="btn btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}
            title={sortOrder === 'asc' ? 'Synkende rekkefølge' : 'Stigende rekkefølge'}
          >
            {sortOrder === 'asc' ? <SortDesc style={{ width: '16px', height: '16px' }} /> : <SortAsc style={{ width: '16px', height: '16px' }} />}
          </button>
        </div>
        {searchTerm && (
          <div style={{ marginTop: '1rem', padding: '0.75rem', background: 'var(--blue-50)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--blue-200)' }}>
            <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--blue-700)' }}>
              {filteredPartners.length} partnere funnet for "{searchTerm}"
            </p>
          </div>
        )}
      </div>

      {/* Partners Grid */}
      {filteredPartners.length === 0 && !loading ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <Handshake style={{ width: '64px', height: '64px', color: '#ccc', margin: '0 auto 1rem' }} />
          <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#333', marginBottom: '0.5rem' }}>
            Ingen samarbeidspartnere funnet
          </h3>
          <p style={{ color: '#666', marginBottom: '1.5rem' }}>
            {searchTerm || selectedType !== 'all' || selectedStatus !== 'all' 
              ? 'Prøv å endre søkekriteriene' 
              : 'Du har ingen samarbeidspartnere registrert ennå'}
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            <button 
              className="btn btn-primary"
              onClick={() => setShowBRRGModal(true)}
            >
              <Database style={{ width: '16px', height: '16px' }} />
              Legg til fra BRRG
            </button>
            <button 
              className="btn btn-secondary"
              onClick={() => setShowAddModal(true)}
            >
              <Plus style={{ width: '16px', height: '16px' }} />
              Legg til manuelt
            </button>
          </div>
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
              {partner.website && (
                <button 
                  onClick={() => window.open(partner.website, '_blank')}
                  className="btn btn-secondary" 
                  style={{ fontSize: '0.75rem', padding: '0.25rem 0.75rem' }}
                >
                  <ExternalLink style={{ width: '14px', height: '14px' }} />
                  Nettside
                </button>
              )}
              <button 
                onClick={() => handlePartnerReports(partner)}
                className="btn btn-secondary" 
                style={{ fontSize: '0.75rem', padding: '0.25rem 0.75rem' }}
              >
                <BarChart3 style={{ width: '14px', height: '14px' }} />
                Rapporter
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
          <div className="card" style={{ width: '90%', maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: 'var(--font-size-xl)', fontWeight: '600', color: 'var(--gray-900)' }}>
                {selectedPartner ? 'Rediger partner' : selectedBRRGCompany ? 'Legg til partner fra BRRG' : 'Legg til partner manuelt'}
              </h2>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setBrrgResults([]);
                  setSelectedBRRGCompany(null);
                  setBrrgSearchQuery('');
                  setError(null);
                  setSuccess(null);
                }}
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

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
              {/* Left Column - Company Info */}
              <div>
                <h3 style={{ fontSize: 'var(--font-size-lg)', fontWeight: '600', color: 'var(--gray-900)', marginBottom: '1rem' }}>
                  Bedriftsinformasjon
                </h3>
                
                {/* Company Details */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
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

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
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
                        MVA-nummer
                      </label>
                      <input
                        type="text"
                        value={newPartner.vatNumber}
                        onChange={(e) => setNewPartner({...newPartner, vatNumber: e.target.value})}
                        style={{ 
                          width: '100%', 
                          padding: '0.75rem', 
                          border: '1px solid var(--gray-300)', 
                          borderRadius: 'var(--radius-lg)', 
                          outline: 'none'
                        }}
                        placeholder="MVA 123456789"
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: 'var(--gray-700)' }}>
                      Bransje
                    </label>
                    <input
                      type="text"
                      value={newPartner.industry}
                      onChange={(e) => setNewPartner({...newPartner, industry: e.target.value})}
                      style={{ 
                        width: '100%', 
                        padding: '0.75rem', 
                        border: '1px solid var(--gray-300)', 
                        borderRadius: 'var(--radius-lg)', 
                        outline: 'none'
                      }}
                      placeholder="F.eks. IT, Bygg, Handel"
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div>
                      <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: 'var(--gray-700)' }}>
                        Bedriftsstørrelse
                      </label>
                      <select
                        value={newPartner.companySize}
                        onChange={(e) => setNewPartner({...newPartner, companySize: e.target.value as any})}
                        style={{ 
                          width: '100%', 
                          padding: '0.75rem', 
                          border: '1px solid var(--gray-300)', 
                          borderRadius: 'var(--radius-lg)', 
                          outline: 'none'
                        }}
                      >
                        <option value="micro">Mikro (1-9 ansatte)</option>
                        <option value="small">Liten (10-49 ansatte)</option>
                        <option value="medium">Medium (50-249 ansatte)</option>
                        <option value="large">Stor (250+ ansatte)</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: 'var(--gray-700)' }}>
                        Etableringsår
                      </label>
                      <input
                        type="number"
                        value={newPartner.foundedYear}
                        onChange={(e) => setNewPartner({...newPartner, foundedYear: parseInt(e.target.value) || new Date().getFullYear()})}
                        style={{ 
                          width: '100%', 
                          padding: '0.75rem', 
                          border: '1px solid var(--gray-300)', 
                          borderRadius: 'var(--radius-lg)', 
                          outline: 'none'
                        }}
                        placeholder="2020"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column - Contact & Address */}
              <div>
                <h3 style={{ fontSize: 'var(--font-size-lg)', fontWeight: '600', color: 'var(--gray-900)', marginBottom: '1rem' }}>
                  Kontaktperson
                </h3>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: 'var(--gray-700)' }}>
                      Navn
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

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div>
                      <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: 'var(--gray-700)' }}>
                        Stilling
                      </label>
                      <input
                        type="text"
                        value={newPartner.contactPerson.position}
                        onChange={(e) => setNewPartner({
                          ...newPartner, 
                          contactPerson: {...newPartner.contactPerson, position: e.target.value}
                        })}
                        style={{ 
                          width: '100%', 
                          padding: '0.75rem', 
                          border: '1px solid var(--gray-300)', 
                          borderRadius: 'var(--radius-lg)', 
                          outline: 'none'
                        }}
                        placeholder="F.eks. CEO, Manager"
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: 'var(--gray-700)' }}>
                        Avdeling
                      </label>
                      <input
                        type="text"
                        value={newPartner.contactPerson.department}
                        onChange={(e) => setNewPartner({
                          ...newPartner, 
                          contactPerson: {...newPartner.contactPerson, department: e.target.value}
                        })}
                        style={{ 
                          width: '100%', 
                          padding: '0.75rem', 
                          border: '1px solid var(--gray-300)', 
                          borderRadius: 'var(--radius-lg)', 
                          outline: 'none'
                        }}
                        placeholder="F.eks. Salg, IT"
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: 'var(--gray-700)' }}>
                      Mobil
                    </label>
                    <input
                      type="tel"
                      value={newPartner.contactPerson.mobile}
                      onChange={(e) => setNewPartner({
                        ...newPartner, 
                        contactPerson: {...newPartner.contactPerson, mobile: e.target.value}
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

                  <h4 style={{ fontSize: 'var(--font-size-base)', fontWeight: '600', color: 'var(--gray-900)', marginTop: '1rem', marginBottom: '0.5rem' }}>
                    Adresse
                  </h4>

                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: 'var(--gray-700)' }}>
                      Gateadresse
                    </label>
                    <input
                      type="text"
                      value={newPartner.address.street}
                      onChange={(e) => setNewPartner({
                        ...newPartner, 
                        address: {...newPartner.address, street: e.target.value}
                      })}
                      style={{ 
                        width: '100%', 
                        padding: '0.75rem', 
                        border: '1px solid var(--gray-300)', 
                        borderRadius: 'var(--radius-lg)', 
                        outline: 'none'
                      }}
                      placeholder="Storgata 1"
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div>
                      <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: 'var(--gray-700)' }}>
                        Postnummer
                      </label>
                      <input
                        type="text"
                        value={newPartner.address.postalCode}
                        onChange={(e) => setNewPartner({
                          ...newPartner, 
                          address: {...newPartner.address, postalCode: e.target.value}
                        })}
                        style={{ 
                          width: '100%', 
                          padding: '0.75rem', 
                          border: '1px solid var(--gray-300)', 
                          borderRadius: 'var(--radius-lg)', 
                          outline: 'none'
                        }}
                        placeholder="0001"
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: 'var(--gray-700)' }}>
                        Poststed
                      </label>
                      <input
                        type="text"
                        value={newPartner.address.city}
                        onChange={(e) => setNewPartner({
                          ...newPartner, 
                          address: {...newPartner.address, city: e.target.value}
                        })}
                        style={{ 
                          width: '100%', 
                          padding: '0.75rem', 
                          border: '1px solid var(--gray-300)', 
                          borderRadius: 'var(--radius-lg)', 
                          outline: 'none'
                        }}
                        placeholder="Oslo"
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: 'var(--gray-700)' }}>
                      Land
                    </label>
                    <input
                      type="text"
                      value={newPartner.address.country}
                      onChange={(e) => setNewPartner({
                        ...newPartner, 
                        address: {...newPartner.address, country: e.target.value}
                      })}
                      style={{ 
                        width: '100%', 
                        padding: '0.75rem', 
                        border: '1px solid var(--gray-300)', 
                        borderRadius: 'var(--radius-lg)', 
                        outline: 'none'
                      }}
                      placeholder="Norge"
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: 'var(--gray-700)' }}>
                      Nettside
                    </label>
                    <input
                      type="url"
                      value={newPartner.website}
                      onChange={(e) => setNewPartner({...newPartner, website: e.target.value})}
                      style={{ 
                        width: '100%', 
                        padding: '0.75rem', 
                        border: '1px solid var(--gray-300)', 
                        borderRadius: 'var(--radius-lg)', 
                        outline: 'none'
                      }}
                      placeholder="https://www.bedrift.no"
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: 'var(--gray-700)' }}>
                      Tags (kommaseparert)
                    </label>
                    <input
                      type="text"
                      value={newPartner.tags}
                      onChange={(e) => setNewPartner({...newPartner, tags: e.target.value})}
                      style={{ 
                        width: '100%', 
                        padding: '0.75rem', 
                        border: '1px solid var(--gray-300)', 
                        borderRadius: 'var(--radius-lg)', 
                        outline: 'none'
                      }}
                      placeholder="viktig, prosjekt, 2024"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem', justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setBrrgResults([]);
                  setSelectedBRRGCompany(null);
                  setBrrgSearchQuery('');
                  setError(null);
                  setSuccess(null);
                }}
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
                onClick={selectedPartner ? handleUpdatePartner : handleCreatePartner}
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

      {/* Bulk Import Modal */}
      {showBulkModal && (
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
              <h2 style={{ fontSize: 'var(--font-size-xl)', fontWeight: '600', color: 'var(--gray-900)' }}>Mass import av partnere</h2>
              <button
                onClick={() => setShowBulkModal(false)}
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

            <div style={{ marginBottom: '1rem' }}>
              <p style={{ color: 'var(--gray-600)', marginBottom: '1rem' }}>
                Lim inn organisasjonsnumre (ett per linje). Systemet vil automatisk hente bedriftsinformasjon fra BRRG og opprette partnere.
              </p>
              <textarea
                value={bulkOrgNumbers}
                onChange={(e) => setBulkOrgNumbers(e.target.value)}
                style={{ 
                  width: '100%', 
                  padding: '0.75rem', 
                  border: '1px solid var(--gray-300)', 
                  borderRadius: 'var(--radius-lg)', 
                  outline: 'none',
                  minHeight: '200px',
                  resize: 'vertical',
                  fontFamily: 'monospace'
                }}
                placeholder="123456789&#10;987654321&#10;456789123"
              />
            </div>

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowBulkModal(false)}
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
                onClick={handleBulkImport}
                disabled={processingBulk}
                className="btn btn-primary"
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
              >
                {processingBulk ? (
                  <>
                    <Loader2 style={{ width: '16px', height: '16px', animation: 'spin 1s linear infinite' }} />
                    Importerer...
                  </>
                ) : (
                  <>
                    <Upload style={{ width: '16px', height: '16px' }} />
                    Start import
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <div className="loading" style={{ margin: '0 auto 1rem' }}></div>
          <p style={{ color: '#666' }}>Laster samarbeidspartnere...</p>
        </div>
      )}

      {/* BRRG Modal */}
      {showBRRGModal && (
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
            width: '90%',
            maxHeight: '90vh',
            overflow: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
              <div>
                <h2 style={{ fontSize: 'var(--font-size-xl)', fontWeight: '600', color: 'var(--gray-900)' }}>
                  <Database style={{ width: '24px', height: '24px', marginRight: '0.5rem' }} />
                  Legg til partner fra BRRG
                </h2>
                <p style={{ color: 'var(--gray-600)', fontSize: 'var(--font-size-sm)' }}>
                  Søk etter bedrifter i Brønnøysundregistrene og legg dem til som samarbeidspartnere
                </p>
              </div>
              <button
                onClick={() => {
                  setShowBRRGModal(false);
                  setBrrgResults([]);
                  setSelectedBRRGCompany(null);
                  setBrrgSearchQuery('');
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '0.5rem'
                }}
              >
                <MoreHorizontal style={{ width: '20px', height: '20px', color: 'var(--gray-400)' }} />
              </button>
            </div>

            {/* BRRG Search */}
            <div style={{ marginBottom: '2rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: 'var(--gray-700)' }}>
                Søk etter bedriftsnavn eller organisasjonsnummer
              </label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input
                  type="text"
                  placeholder="Skriv bedriftsnavn eller org.nr..."
                  value={brrgSearchQuery}
                  onChange={(e) => setBrrgSearchQuery(e.target.value)}
                  style={{
                    flex: 1,
                    padding: '0.75rem',
                    border: '1px solid var(--gray-300)',
                    borderRadius: 'var(--radius-md)',
                    fontSize: 'var(--font-size-base)'
                  }}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      searchBRRG(brrgSearchQuery);
                    }
                  }}
                />
                <button
                  onClick={() => searchBRRG(brrgSearchQuery)}
                  disabled={searchingBRRG || !brrgSearchQuery.trim()}
                  style={{
                    padding: '0.75rem 1rem',
                    background: 'var(--primary)',
                    color: 'var(--white)',
                    border: 'none',
                    borderRadius: 'var(--radius-md)',
                    cursor: searchingBRRG ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}
                >
                  {searchingBRRG ? (
                    <RefreshCw style={{ width: '16px', height: '16px' }} />
                  ) : (
                    <Search style={{ width: '16px', height: '16px' }} />
                  )}
                  Søk
                </button>
              </div>
            </div>

            {/* BRRG Results */}
            {brrgResults.length > 0 && (
              <div>
                <h3 style={{ fontSize: 'var(--font-size-lg)', fontWeight: '600', marginBottom: '1rem' }}>
                  Søkeresultater ({brrgResults.length})
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {brrgResults.map((company, index) => (
                    <div key={company.organisasjonsnummer || `brrg-${index}`} style={{
                      border: '1px solid var(--gray-200)',
                      borderRadius: 'var(--radius-lg)',
                      padding: '1.5rem',
                      background: 'var(--gray-50)'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                        <div>
                          <h4 style={{ fontSize: 'var(--font-size-lg)', fontWeight: '600', marginBottom: '0.5rem' }}>
                            {company.navn}
                          </h4>
                          <p style={{ color: 'var(--gray-600)', fontSize: 'var(--font-size-sm)' }}>
                            Org.nr: {company.organisasjonsnummer}
                          </p>
                        </div>
                        <button
                          onClick={() => {
                            selectBRRGCompany(company);
                            setShowBRRGModal(false);
                            setShowAddModal(true);
                          }}
                          style={{
                            padding: '0.5rem 1rem',
                            background: 'var(--success)',
                            color: 'var(--white)',
                            border: 'none',
                            borderRadius: 'var(--radius-md)',
                            cursor: 'pointer',
                            fontSize: 'var(--font-size-sm)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem'
                          }}
                        >
                          <Plus style={{ width: '16px', height: '16px' }} />
                          Velg
                        </button>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                        <div>
                          <strong>Bransje:</strong> {company.naeringskode1?.beskrivelse || 'Ikke tilgjengelig'}
                        </div>
                        <div>
                          <strong>Ansatte:</strong> {company.antallAnsatte || 'Ikke tilgjengelig'}
                        </div>
                        <div>
                          <strong>Adresse:</strong> {company.forretningsadresse?.adresse || 'Ikke tilgjengelig'}
                        </div>
                        <div>
                          <strong>Telefon:</strong> {company.kontaktinformasjon?.telefon || 'Ikke tilgjengelig'}
                        </div>
                        <div>
                          <strong>E-post:</strong> {company.kontaktinformasjon?.epost || 'Ikke tilgjengelig'}
                        </div>
                        <div>
                          <strong>Organisasjonsform:</strong> {company.organisasjonsform?.beskrivelse || 'Ikke tilgjengelig'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {error && (
              <div style={{
                background: 'var(--danger)',
                color: 'var(--white)',
                padding: '1rem',
                borderRadius: 'var(--radius-md)',
                marginTop: '1rem'
              }}>
                {error}
              </div>
            )}
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
            maxWidth: '1200px',
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
                  Partner detaljer {selectedPartner.brrgData && '• BRRG data tilgjengelig'}
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
              {/* Left Column - Partner Info */}
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
                  {selectedPartner.vatNumber && (
                    <div>
                      <strong>MVA-nummer:</strong> {selectedPartner.vatNumber}
                    </div>
                  )}
                  {selectedPartner.industry && (
                    <div>
                      <strong>Bransje:</strong> {selectedPartner.industry}
                    </div>
                  )}
                  {selectedPartner.companySize && (
                    <div>
                      <strong>Bedriftsstørrelse:</strong> {selectedPartner.companySize}
                    </div>
                  )}
                  {selectedPartner.foundedYear && (
                    <div>
                      <strong>Etableringsår:</strong> {selectedPartner.foundedYear}
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
                  {selectedPartner.tags && selectedPartner.tags.length > 0 && (
                    <div>
                      <strong>Tags:</strong> {selectedPartner.tags.join(', ')}
                    </div>
                  )}
                  {selectedPartner.notes && (
                    <div>
                      <strong>Notater:</strong> {selectedPartner.notes}
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
                  {selectedPartner.contactPerson.department && (
                    <div>
                      <strong>Avdeling:</strong> {selectedPartner.contactPerson.department}
                    </div>
                  )}
                  {selectedPartner.contactPerson.mobile && (
                    <div>
                      <strong>Mobil:</strong> {selectedPartner.contactPerson.mobile}
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column - BRRG Data */}
              <div>
                {selectedPartner.brrgData ? (
                  <>
                    <h3 style={{ fontSize: 'var(--font-size-lg)', fontWeight: '600', color: 'var(--gray-900)', marginBottom: '1rem' }}>
                      <Database style={{ width: '20px', height: '20px', marginRight: '0.5rem' }} />
                      BRRG Virksomhetsopplysninger
                    </h3>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      <div>
                        <strong>Organisasjonsnummer:</strong> {selectedPartner.brrgData.organisasjonsnummer}
                      </div>
                      <div>
                        <strong>Navn:</strong> {selectedPartner.brrgData.navn}
                      </div>
                      <div>
                        <strong>Organisasjonsform:</strong> {selectedPartner.brrgData.organisasjonsform?.beskrivelse}
                      </div>
                      <div>
                        <strong>Registreringsdato:</strong> {selectedPartner.brrgData.registreringsdatoEnhetsregisteret && new Date(selectedPartner.brrgData.registreringsdatoEnhetsregisteret).toLocaleDateString('no-NO')}
                      </div>
                      {selectedPartner.brrgData.stiftelsesdato && (
                        <div>
                          <strong>Stiftelsesdato:</strong> {new Date(selectedPartner.brrgData.stiftelsesdato).toLocaleDateString('no-NO')}
                        </div>
                      )}
                      <div>
                        <strong>Antall ansatte:</strong> {selectedPartner.brrgData.antallAnsatte || 'Ikke oppgitt'}
                      </div>
                      {selectedPartner.brrgData.ansatte && (
                        <div>
                          <strong>Ansatte (intervall):</strong> {selectedPartner.brrgData.ansatte.interval} ({selectedPartner.brrgData.ansatte.antall})
                        </div>
                      )}
                      <div>
                        <strong>Hovednæringskode:</strong> {selectedPartner.brrgData.naeringskode1?.beskrivelse}
                      </div>
                      {selectedPartner.brrgData.naeringskode2 && (
                        <div>
                          <strong>Næringskode 2:</strong> {selectedPartner.brrgData.naeringskode2.beskrivelse}
                        </div>
                      )}
                      {selectedPartner.brrgData.naeringskode3 && (
                        <div>
                          <strong>Næringskode 3:</strong> {selectedPartner.brrgData.naeringskode3.beskrivelse}
                        </div>
                      )}
                      {selectedPartner.brrgData.institusjonellSektorkode && (
                        <div>
                          <strong>Institusjonell sektorkode:</strong> {selectedPartner.brrgData.institusjonellSektorkode.beskrivelse}
                        </div>
                      )}
                      {selectedPartner.brrgData.maalform && (
                        <div>
                          <strong>Målform:</strong> {selectedPartner.brrgData.maalform}
                        </div>
                      )}
                      {selectedPartner.brrgData.hjemmeside && (
                        <div>
                          <strong>Hjemmeside:</strong> 
                          <a href={selectedPartner.brrgData.hjemmeside} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)', marginLeft: '0.5rem' }}>
                            {selectedPartner.brrgData.hjemmeside}
                          </a>
                        </div>
                      )}
                    </div>

                    <h4 style={{ fontSize: 'var(--font-size-base)', fontWeight: '600', color: 'var(--gray-900)', marginTop: '2rem', marginBottom: '1rem' }}>
                      Status & Registre
                    </h4>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      {selectedPartner.brrgData.konkurs && (
                        <div style={{ color: 'var(--red-600)', fontWeight: '600' }}>
                          ⚠️ Bedriften er konkurs
                        </div>
                      )}
                      {selectedPartner.brrgData.underAvvikling && (
                        <div style={{ color: 'var(--orange-600)', fontWeight: '600' }}>
                          ⚠️ Under avvikling
                        </div>
                      )}
                      {selectedPartner.brrgData.underTvangsavviklingEllerTvangsopplosning && (
                        <div style={{ color: 'var(--red-600)', fontWeight: '600' }}>
                          ⚠️ Under tvangsavvikling eller tvangsoppløsning
                        </div>
                      )}
                      <div>
                        <strong>Registrert i MVA-registeret:</strong> {selectedPartner.brrgData.registrertIMvaregisteret ? 'Ja' : 'Nei'}
                      </div>
                      {selectedPartner.brrgData.registre && (
                        <div>
                          <strong>Registre:</strong>
                          <ul style={{ marginLeft: '1rem', marginTop: '0.5rem' }}>
                            {selectedPartner.brrgData.registre.enhetsregisteret && <li>Enhetsregisteret</li>}
                            {selectedPartner.brrgData.registre.foretaksregisteret && <li>Foretaksregisteret</li>}
                            {selectedPartner.brrgData.registre.mvaregisteret && <li>MVA-registeret</li>}
                            {selectedPartner.brrgData.registre.frivillighetsregisteret && <li>Frivillighetsregisteret</li>}
                            {selectedPartner.brrgData.registre.stiftelsesregisteret && <li>Stiftelsesregisteret</li>}
                          </ul>
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--gray-500)' }}>
                    <Database style={{ width: '48px', height: '48px', marginBottom: '1rem' }} />
                    <p>Ingen BRRG data tilgjengelig</p>
                    <p style={{ fontSize: 'var(--font-size-sm)' }}>Klikk "Se" for å laste BRRG informasjon</p>
                  </div>
                )}
              </div>
            </div>

            {/* Additional BRRG Sections */}
            {selectedPartner.brrgData && (
              <div style={{ marginTop: '2rem', borderTop: '1px solid var(--gray-200)', paddingTop: '2rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                  
                  {/* Roller */}
                  {selectedPartner.brrgData.rolleregister?.enheter && selectedPartner.brrgData.rolleregister.enheter.length > 0 && (
                    <div>
                      <h4 style={{ fontSize: 'var(--font-size-base)', fontWeight: '600', color: 'var(--gray-900)', marginBottom: '1rem' }}>
                        <Users style={{ width: '16px', height: '16px', marginRight: '0.5rem' }} />
                        Roller
                      </h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {selectedPartner.brrgData.rolleregister.enheter.map((enhet, index) => (
                          <div key={index} style={{ padding: '0.75rem', background: 'var(--gray-50)', borderRadius: 'var(--radius-md)' }}>
                            <div><strong>{enhet.navn}</strong></div>
                            <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--gray-600)' }}>
                              {enhet.organisasjonsnummer} • {enhet.rolle}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Tilknyttede virksomheter */}
                  {selectedPartner.brrgData.tilknyttedeVirksomheter && selectedPartner.brrgData.tilknyttedeVirksomheter.length > 0 && (
                    <div>
                      <h4 style={{ fontSize: 'var(--font-size-base)', fontWeight: '600', color: 'var(--gray-900)', marginBottom: '1rem' }}>
                        <Link style={{ width: '16px', height: '16px', marginRight: '0.5rem' }} />
                        Tilknyttede virksomheter
                      </h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {selectedPartner.brrgData.tilknyttedeVirksomheter.map((virksomhet, index) => (
                          <div key={index} style={{ padding: '0.75rem', background: 'var(--gray-50)', borderRadius: 'var(--radius-md)' }}>
                            <div><strong>{virksomhet.navn}</strong></div>
                            <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--gray-600)' }}>
                              {virksomhet.organisasjonsnummer} • {virksomhet.organisasjonsform} • {virksomhet.rolle}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

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