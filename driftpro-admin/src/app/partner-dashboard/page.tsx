'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  Building, 
  Calendar, 
  FileText, 
  Download, 
  Eye, 
  LogOut, 
  User, 
  Clock, 
  MapPin, 
  Tag,
  CheckCircle,
  Clock as ClockIcon,
  AlertTriangle,
  Info,
  Search,
  Filter,
  SortAsc,
  SortDesc,
  Truck,
  Wrench,
  Settings,
  ToolCase,
  MessageSquare,
  X
} from 'lucide-react';

import { PartnerAssignment, PartnerDocument, firebaseService } from '@/lib/firebase-services';

interface SharedDocument extends Omit<PartnerDocument, 'id' | 'partnerId' | 'partnerName' | 'companyId' | 'uploadedBy' | 'sharedWith' | 'accessLevel' | 'tags' | 'createdAt' | 'updatedAt'> {
  id: string;
  sharedAt: string;
  sharedBy: string;
  category: 'assignment' | 'contract' | 'invoice' | 'manual' | 'other';
}

export default function PartnerDashboardPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const companyName = searchParams.get('company');
  
  const [partnerSession, setPartnerSession] = useState<any>(null);
  const [assignments, setAssignments] = useState<PartnerAssignment[]>([]);
  const [sharedDocuments, setSharedDocuments] = useState<SharedDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'assignments' | 'documents'>('assignments');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [sortBy, setSortBy] = useState<'date' | 'title' | 'status'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Check authentication on mount
  useEffect(() => {
    const session = localStorage.getItem('partnerSession');
    if (!session) {
      router.push('/partner-login');
      return;
    }

    try {
      const parsedSession = JSON.parse(session);
      setPartnerSession(parsedSession);
      
      // Load partner data from Firebase
      loadPartnerData();
    } catch (error) {
      console.error('Error parsing session:', error);
      router.push('/partner-login');
    }
  }, [router]);

  const loadPartnerData = async () => {
    if (!partnerSession?.partnerId || !partnerSession?.companyId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    
    try {
      // Load assignments and documents from Firebase
      const [assignmentsData, documentsData] = await Promise.all([
        firebaseService.getPartnerAssignments(partnerSession.companyId, partnerSession.partnerId),
        firebaseService.getPartnerDocuments(partnerSession.companyId, partnerSession.partnerId)
      ]);

      setAssignments(assignmentsData);
      
      // Convert PartnerDocument to SharedDocument format
      const sharedDocs: SharedDocument[] = documentsData.map(doc => ({
        id: doc.id,
        title: doc.title,
        description: doc.description || '',
        fileName: doc.fileName,
        fileSize: `${Math.round(doc.fileSize / 1024)} KB`,
        fileType: doc.type.toUpperCase(),
        sharedAt: doc.createdAt,
        sharedBy: 'DriftPro Admin',
        category: 'assignment' as const,
        downloadUrl: doc.fileUrl
      }));

      setSharedDocuments(sharedDocs);
    } catch (error) {
      console.error('Error loading partner data:', error);
      // Fallback to mock data if Firebase fails
      loadMockData();
    } finally {
      setLoading(false);
    }
  };

  const loadMockData = async () => {
    setLoading(true);
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Mock assignments data
    const mockAssignments: PartnerAssignment[] = [
      {
        id: '1',
        partnerId: 'mock-1',
        partnerName: 'Mock Partner',
        companyId: 'mock-company',
        title: 'Levering av vaskemaskin',
        description: 'Levering og installasjon av vaskemaskin til kunde i Oslo',
        startDate: '2025-01-15',
        endDate: '2025-01-15',
        startTime: '09:00',
        endTime: '12:00',
        status: 'accepted',
        priority: 'medium',
        assignedBy: 'DriftPro Admin',
        assignedTo: 'Partner Team',
        departmentId: 'delivery',
        location: 'Oslo, Norge',
        requirements: ['Vaskemaskin', 'Installasjonsverktøy'],
        documents: [],
        pdfFiles: ['leveringsordre.pdf', 'installasjonsmanual.pdf'],
        budget: 1500,
        notes: 'Kunde ønsker levering mellom 09:00-12:00',
        createdAt: '2025-01-10T10:00:00Z',
        updatedAt: '2025-01-10T10:00:00Z'
      },
      {
        id: '2',
        partnerId: 'mock-2',
        partnerName: 'Mock Partner',
        companyId: 'mock-company',
        title: 'Service på tørketrommel',
        description: 'Rutinemessig service og vedlikehold av tørketrommel',
        startDate: '2025-01-20',
        endDate: '2025-01-20',
        startTime: '14:00',
        endTime: '16:00',
        status: 'pending',
        priority: 'low',
        assignedBy: 'DriftPro Admin',
        assignedTo: 'Partner Team',
        departmentId: 'service',
        location: 'Drammen, Norge',
        requirements: ['Serviceverktøy', 'Reservedeler'],
        documents: [],
        pdfFiles: ['serviceordre.pdf'],
        budget: 900,
        notes: 'Kunde har meldt om uvanlig støy',
        createdAt: '2025-01-12T14:30:00Z',
        updatedAt: '2025-01-12T14:30:00Z'
      }
    ];

    // Mock shared documents data
    const mockDocuments: SharedDocument[] = [
      {
        id: '1',
        title: 'Leveringsordre - Vaskemaskin',
        description: 'Detaljert leveringsordre for vaskemaskin-prosjektet',
        fileName: 'leveringsordre_vaskemaskin.pdf',
        fileSize: '245 KB',
        fileType: 'PDF',
        sharedAt: '2025-01-10T10:00:00Z',
        sharedBy: 'DriftPro Admin',
        category: 'assignment',
        downloadUrl: '#'
      },
      {
        id: '2',
        title: 'Installasjonsmanual',
        description: 'Komplett installasjonsguide for vaskemaskin',
        fileName: 'installasjonsmanual_vaskemaskin.pdf',
        fileSize: '1.2 MB',
        fileType: 'PDF',
        sharedAt: '2025-01-10T10:00:00Z',
        sharedBy: 'DriftPro Admin',
        category: 'manual',
        downloadUrl: '#'
      },
      {
        id: '3',
        title: 'Servicekontrakt 2025',
        description: 'Årlig servicekontrakt for 2025',
        fileName: 'servicekontrakt_2025.pdf',
        fileSize: '890 KB',
        fileType: 'PDF',
        sharedAt: '2025-01-08T09:00:00Z',
        sharedBy: 'DriftPro Admin',
        category: 'contract',
        downloadUrl: '#'
      }
    ];

    setAssignments(mockAssignments);
    setSharedDocuments(mockDocuments);
    setLoading(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('partnerSession');
    router.push('/partner-login');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return '#16a34a';
      case 'accepted': return '#2563eb';
      case 'pending': return '#f59e0b';
      case 'declined': return '#dc2626';
      case 'cancelled': return '#6b7280';
      default: return '#6b7280';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle style={{ width: '16px', height: '16px' }} />;
      case 'accepted': return <CheckCircle style={{ width: '16px', height: '16px' }} />;
      case 'pending': return <ClockIcon style={{ width: '16px', height: '16px' }} />;
      case 'declined': return <AlertTriangle style={{ width: '16px', height: '16px' }} />;
      case 'cancelled': return <X style={{ width: '16px', height: '16px' }} />;
      default: return <Info style={{ width: '16px', height: '16px' }} />;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'delivery': return <Truck style={{ width: '16px', height: '16px' }} />;
      case 'installation': return <Wrench style={{ width: '16px', height: '16px' }} />;
      case 'service': return <Settings style={{ width: '16px', height: '16px' }} />;
      case 'maintenance': return <Tool style={{ width: '16px', height: '16px' }} />;
      case 'consultation': return <MessageSquare style={{ width: '16px', height: '16px' }} />;
      default: return <Info style={{ width: '16px', height: '16px' }} />;
    }
  };

  const filteredAssignments = assignments.filter(assignment => {
    const matchesSearch = assignment.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         assignment.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || assignment.status === statusFilter;
    const matchesType = typeFilter === 'all' || assignment.type === typeFilter;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  const filteredDocuments = sharedDocuments.filter(doc => {
    return doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
           doc.description.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const sortedAssignments = [...filteredAssignments].sort((a, b) => {
    let aValue: any, bValue: any;
    
    switch (sortBy) {
      case 'date':
        aValue = new Date(a.startDate);
        bValue = new Date(b.startDate);
        break;
      case 'title':
        aValue = a.title.toLowerCase();
        bValue = b.title.toLowerCase();
        break;
      case 'status':
        aValue = a.status;
        bValue = b.status;
        break;
      default:
        aValue = new Date(a.createdAt);
        bValue = new Date(b.createdAt);
    }
    
    if (sortOrder === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f8fafc'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '48px',
            height: '48px',
            border: '4px solid #e2e8f0',
            borderTop: '4px solid #3b82f6',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 1rem'
          }} />
          <p style={{ color: '#64748b' }}>Laster partner dashboard...</p>
        </div>
      </div>
    );
  }

  if (!partnerSession) {
    return null;
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
      {/* Header */}
      <div style={{
        background: 'white',
        borderBottom: '1px solid #e2e8f0',
        padding: '1rem 1.5rem'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          maxWidth: '1200px',
          margin: '0 auto'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{
              width: '40px',
              height: '40px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Building style={{ width: '20px', height: '20px', color: 'white' }} />
            </div>
            <div>
              <h1 style={{
                fontSize: '1.25rem',
                fontWeight: '600',
                color: '#1e293b',
                margin: '0'
              }}>
                {companyName || 'Partner Dashboard'}
              </h1>
              <p style={{
                fontSize: '0.875rem',
                color: '#64748b',
                margin: '0'
              }}>
                Velkommen tilbake, {partnerSession.email}
              </p>
            </div>
          </div>
          
          <button
            onClick={handleLogout}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.5rem 1rem',
              background: '#f1f5f9',
              border: '1px solid #e2e8f0',
              borderRadius: '0.5rem',
              color: '#64748b',
              cursor: 'pointer',
              fontSize: '0.875rem',
              transition: 'all 0.15s ease-in-out'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#e2e8f0';
              e.currentTarget.style.borderColor = '#cbd5e1';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#f1f5f9';
              e.currentTarget.style.borderColor = '#e2e8f0';
            }}
          >
            <LogOut style={{ width: '16px', height: '16px' }} />
            Logg ut
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '1.5rem' }}>
        {/* Tab Navigation */}
        <div style={{
          display: 'flex',
          background: 'white',
          borderRadius: '0.5rem',
          padding: '0.25rem',
          marginBottom: '1.5rem',
          border: '1px solid #e2e8f0'
        }}>
          <button
            onClick={() => setActiveTab('assignments')}
            style={{
              flex: 1,
              padding: '0.75rem 1rem',
              background: activeTab === 'assignments' ? '#3b82f6' : 'transparent',
              color: activeTab === 'assignments' ? 'white' : '#64748b',
              border: 'none',
              borderRadius: '0.375rem',
              cursor: 'pointer',
              fontWeight: '500',
              transition: 'all 0.15s ease-in-out'
            }}
          >
            <Calendar style={{ width: '16px', height: '16px', marginRight: '0.5rem', display: 'inline' }} />
            Oppdrag ({assignments.length})
          </button>
          <button
            onClick={() => setActiveTab('documents')}
            style={{
              flex: 1,
              padding: '0.75rem 1rem',
              background: activeTab === 'documents' ? '#3b82f6' : 'transparent',
              color: activeTab === 'documents' ? 'white' : '#64748b',
              border: 'none',
              borderRadius: '0.375rem',
              cursor: 'pointer',
              fontWeight: '500',
              transition: 'all 0.15s ease-in-out'
            }}
          >
            <FileText style={{ width: '16px', height: '16px', marginRight: '0.5rem', display: 'inline' }} />
            Dokumenter ({sharedDocuments.length})
          </button>
        </div>

        {/* Search and Filters */}
        <div style={{
          background: 'white',
          borderRadius: '0.5rem',
          padding: '1rem',
          marginBottom: '1.5rem',
          border: '1px solid #e2e8f0'
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr auto auto auto',
            gap: '1rem',
            alignItems: 'end'
          }}>
            {/* Search */}
            <div>
              <label style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: '500',
                color: '#374151',
                marginBottom: '0.5rem'
              }}>
                Søk
              </label>
              <div style={{ position: 'relative' }}>
                <Search style={{
                  position: 'absolute',
                  left: '0.75rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#9ca3af',
                  width: '16px',
                  height: '16px'
                }} />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Søk etter oppdrag eller dokumenter..."
                  style={{
                    width: '100%',
                    padding: '0.5rem 0.75rem 0.5rem 2.5rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.375rem',
                    fontSize: '0.875rem',
                    outline: 'none'
                  }}
                />
              </div>
            </div>

            {/* Status Filter */}
            {activeTab === 'assignments' && (
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  color: '#374151',
                  marginBottom: '0.5rem'
                }}>
                  Status
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  style={{
                    padding: '0.5rem 0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.375rem',
                    fontSize: '0.875rem',
                    background: 'white'
                  }}
                >
                  <option value="all">Alle statuser</option>
                  <option value="pending">Ventende</option>
                  <option value="accepted">Godkjent</option>
                  <option value="completed">Fullført</option>
                  <option value="declined">Avvist</option>
                  <option value="cancelled">Kansellert</option>
                </select>
              </div>
            )}

            {/* Type Filter */}
            {activeTab === 'assignments' && (
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  color: '#374151',
                  marginBottom: '0.5rem'
                }}>
                  Type
                </label>
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  style={{
                    padding: '0.5rem 0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.375rem',
                    fontSize: '0.875rem',
                    background: 'white'
                  }}
                >
                  <option value="all">Alle typer</option>
                  <option value="delivery">Levering</option>
                  <option value="installation">Installasjon</option>
                  <option value="service">Service</option>
                  <option value="maintenance">Vedlikehold</option>
                  <option value="consultation">Konsultasjon</option>
                </select>
              </div>
            )}

            {/* Sort */}
            <div>
              <label style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: '500',
                color: '#374151',
                marginBottom: '0.5rem'
              }}>
                Sorter
              </label>
              <div style={{ display: 'flex', border: '1px solid #d1d5db', borderRadius: '0.375rem', overflow: 'hidden' }}>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  style={{
                    padding: '0.5rem 0.75rem',
                    border: 'none',
                    fontSize: '0.875rem',
                    background: 'white',
                    outline: 'none'
                  }}
                >
                  <option value="date">Dato</option>
                  <option value="title">Tittel</option>
                  <option value="status">Status</option>
                </select>
                <button
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                  style={{
                    padding: '0.5rem',
                    border: 'none',
                    background: '#f3f4f6',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  {sortOrder === 'asc' ? (
                    <SortAsc style={{ width: '16px', height: '16px' }} />
                  ) : (
                    <SortDesc style={{ width: '16px', height: '16px' }} />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        {activeTab === 'assignments' ? (
          <div>
            {sortedAssignments.length === 0 ? (
              <div style={{
                background: 'white',
                borderRadius: '0.5rem',
                padding: '3rem',
                textAlign: 'center',
                border: '1px solid #e2e8f0'
              }}>
                <Calendar style={{
                  width: '48px',
                  height: '48px',
                  color: '#9ca3af',
                  margin: '0 auto 1rem'
                }} />
                <h3 style={{
                  fontSize: '1.125rem',
                  fontWeight: '600',
                  color: '#374151',
                  marginBottom: '0.5rem'
                }}>
                  Ingen oppdrag funnet
                </h3>
                <p style={{ color: '#6b7280' }}>
                  {searchTerm || statusFilter !== 'all' || typeFilter !== 'all' 
                    ? 'Prøv å endre søkekriteriene dine'
                    : 'Du har ingen aktive oppdrag for øyeblikket'
                  }
                </p>
              </div>
            ) : (
              <div style={{ display: 'grid', gap: '1rem' }}>
                {sortedAssignments.map((assignment) => (
                  <div
                    key={assignment.id}
                    style={{
                      background: 'white',
                      borderRadius: '0.5rem',
                      padding: '1.5rem',
                      border: '1px solid #e2e8f0',
                      transition: 'all 0.15s ease-in-out'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
                      e.currentTarget.style.transform = 'translateY(-1px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.boxShadow = 'none';
                      e.currentTarget.style.transform = 'translateY(0)';
                    }}
                  >
                    <div style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      justifyContent: 'space-between',
                      marginBottom: '1rem'
                    }}>
                      <div style={{ flex: 1 }}>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          marginBottom: '0.5rem'
                        }}>
                          {getTypeIcon(assignment.type)}
                          <h3 style={{
                            fontSize: '1.125rem',
                            fontWeight: '600',
                            color: '#1e293b',
                            margin: '0'
                          }}>
                            {assignment.title}
                          </h3>
                        </div>
                        <p style={{
                          color: '#64748b',
                          margin: '0 0 1rem 0',
                          lineHeight: '1.5'
                        }}>
                          {assignment.description}
                        </p>
                      </div>
                      
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.5rem 0.75rem',
                        background: getStatusColor(assignment.status) + '15',
                        color: getStatusColor(assignment.status),
                        borderRadius: '0.375rem',
                        fontSize: '0.875rem',
                        fontWeight: '500'
                      }}>
                        {getStatusIcon(assignment.status)}
                        {assignment.status === 'pending' && 'Ventende'}
                        {assignment.status === 'accepted' && 'Godkjent'}
                        {assignment.status === 'completed' && 'Fullført'}
                        {assignment.status === 'declined' && 'Avvist'}
                        {assignment.status === 'cancelled' && 'Kansellert'}
                      </div>
                    </div>

                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                      gap: '1rem',
                      marginBottom: '1rem'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Calendar style={{ width: '16px', height: '16px', color: '#6b7280' }} />
                        <span style={{ fontSize: '0.875rem', color: '#374151' }}>
                          {new Date(assignment.startDate).toLocaleDateString('nb-NO')}
                        </span>
                      </div>
                      
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Clock style={{ width: '16px', height: '16px', color: '#6b7280' }} />
                        <span style={{ fontSize: '0.875rem', color: '#374151' }}>
                          {assignment.startTime} - {assignment.endTime}
                        </span>
                      </div>
                      
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <MapPin style={{ width: '16px', height: '16px', color: '#6b7280' }} />
                        <span style={{ fontSize: '0.875rem', color: '#374151' }}>
                          {assignment.location}
                        </span>
                      </div>
                      
                      {assignment.hourlyRate && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <Tag style={{ width: '16px', height: '16px', color: '#6b7280' }} />
                          <span style={{ fontSize: '0.875rem', color: '#374151' }}>
                            {assignment.hourlyRate} kr/time
                          </span>
                        </div>
                      )}
                    </div>

                    {assignment.notes && (
                      <div style={{
                        background: '#f8fafc',
                        padding: '0.75rem',
                        borderRadius: '0.375rem',
                        marginBottom: '1rem'
                      }}>
                        <p style={{
                          fontSize: '0.875rem',
                          color: '#374151',
                          margin: '0',
                          fontStyle: 'italic'
                        }}>
                          <strong>Notater:</strong> {assignment.notes}
                        </p>
                      </div>
                    )}

                    {assignment.pdfFiles && assignment.pdfFiles.length > 0 && (
                      <div>
                        <h4 style={{
                          fontSize: '0.875rem',
                          fontWeight: '500',
                          color: '#374151',
                          marginBottom: '0.5rem'
                        }}>
                          Vedlegg ({assignment.pdfFiles.length})
                        </h4>
                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                          {assignment.pdfFiles.map((file, index) => (
                            <div
                              key={index}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                padding: '0.5rem 0.75rem',
                                background: '#f1f5f9',
                                borderRadius: '0.375rem',
                                fontSize: '0.875rem',
                                color: '#374151'
                              }}
                            >
                              <FileText style={{ width: '16px', height: '16px' }} />
                              {file}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div>
            {filteredDocuments.length === 0 ? (
              <div style={{
                background: 'white',
                borderRadius: '0.5rem',
                padding: '3rem',
                textAlign: 'center',
                border: '1px solid #e2e8f0'
              }}>
                <FileText style={{
                  width: '48px',
                  height: '48px',
                  color: '#9ca3af',
                  margin: '0 auto 1rem'
                }} />
                <h3 style={{
                  fontSize: '1.125rem',
                  fontWeight: '600',
                  color: '#374151',
                  marginBottom: '0.5rem'
                }}>
                  Ingen dokumenter funnet
                </h3>
                <p style={{ color: '#6b7280' }}>
                  {searchTerm 
                    ? 'Prøv å endre søkekriteriene dine'
                    : 'Du har ingen delte dokumenter for øyeblikket'
                  }
                </p>
              </div>
            ) : (
              <div style={{ display: 'grid', gap: '1rem' }}>
                {filteredDocuments.map((document) => (
                  <div
                    key={document.id}
                    style={{
                      background: 'white',
                      borderRadius: '0.5rem',
                      padding: '1.5rem',
                      border: '1px solid #e2e8f0',
                      transition: 'all 0.15s ease-in-out'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
                      e.currentTarget.style.transform = 'translateY(-1px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.boxShadow = 'none';
                      e.currentTarget.style.transform = 'translateY(0)';
                    }}
                  >
                    <div style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      justifyContent: 'space-between',
                      marginBottom: '1rem'
                    }}>
                      <div style={{ flex: 1 }}>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          marginBottom: '0.5rem'
                        }}>
                          <FileText style={{ width: '16px', height: '16px', color: '#6b7280' }} />
                          <h3 style={{
                            fontSize: '1.125rem',
                            fontWeight: '600',
                            color: '#1e293b',
                            margin: '0'
                          }}>
                            {document.title}
                          </h3>
                        </div>
                        <p style={{
                          color: '#64748b',
                          margin: '0 0 1rem 0',
                          lineHeight: '1.5'
                        }}>
                          {document.description}
                        </p>
                      </div>
                      
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                      }}>
                        <button
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            padding: '0.5rem 0.75rem',
                            background: '#3b82f6',
                            color: 'white',
                            border: 'none',
                            borderRadius: '0.375rem',
                            cursor: 'pointer',
                            fontSize: '0.875rem',
                            fontWeight: '500',
                            transition: 'all 0.15s ease-in-out'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = '#2563eb';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = '#3b82f6';
                          }}
                        >
                          <Download style={{ width: '16px', height: '16px' }} />
                          Last ned
                        </button>
                      </div>
                    </div>

                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                      gap: '1rem',
                      marginBottom: '1rem'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <FileText style={{ width: '16px', height: '16px', color: '#6b7280' }} />
                        <span style={{ fontSize: '0.875rem', color: '#374151' }}>
                          {document.fileName}
                        </span>
                      </div>
                      
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Tag style={{ width: '16px', height: '16px', color: '#6b7280' }} />
                        <span style={{ fontSize: '0.875rem', color: '#374151' }}>
                          {document.fileSize}
                        </span>
                      </div>
                      
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Calendar style={{ width: '16px', height: '16px', color: '#6b7280' }} />
                        <span style={{ fontSize: '0.875rem', color: '#374151' }}>
                          {new Date(document.sharedAt).toLocaleDateString('nb-NO')}
                        </span>
                      </div>
                      
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <User style={{ width: '16px', height: '16px', color: '#6b7280' }} />
                        <span style={{ fontSize: '0.875rem', color: '#374151' }}>
                          {document.sharedBy}
                        </span>
                      </div>
                    </div>

                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}>
                      <span style={{
                        padding: '0.25rem 0.5rem',
                        background: '#f1f5f9',
                        borderRadius: '0.25rem',
                        fontSize: '0.75rem',
                        color: '#374151',
                        fontWeight: '500'
                      }}>
                        {document.category === 'assignment' && 'Oppdrag'}
                        {document.category === 'contract' && 'Kontrakt'}
                        {document.category === 'invoice' && 'Faktura'}
                        {document.category === 'manual' && 'Manual'}
                        {document.category === 'other' && 'Annet'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
