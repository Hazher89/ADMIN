'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Shield, 
  Plus, 
  Search, 
  Filter, 
  Eye, 
  Edit, 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  Calendar,
  FileText,
  Users,
  Target,
  Activity,
  BarChart3,
  Download,
  X,
  ChevronDown,
  TrendingUp,
  AlertTriangle,
  CheckSquare
} from 'lucide-react';

interface Audit {
  id: string;
  title: string;
  type: string;
  scope: string;
  status: string;
  plannedDate: string;
  completedDate?: string;
  responsiblePerson: string;
  department: string;
  findings: string[];
  recommendations: string[];
  priority: 'Høy' | 'Middels' | 'Lav';
  nextReview: string;
}

export default function AuditPage() {
  const { userProfile } = useAuth();
  const [audits, setAudits] = useState<Audit[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedPriority, setSelectedPriority] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedAudit, setSelectedAudit] = useState<Audit | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [activeTab, setActiveTab] = useState('audits');

  // Form state for new audit
  const [newAudit, setNewAudit] = useState({
    title: '',
    type: 'Internrevisjon',
    scope: '',
    plannedDate: '',
    responsiblePerson: '',
    department: '',
    priority: 'Middels' as 'Høy' | 'Middels' | 'Lav',
    nextReview: ''
  });

  // Mock data - replace with real data from Firebase
  useEffect(() => {
    const mockAudits: Audit[] = [
      {
        id: '1',
        title: 'Sikkerhetsrevisjon Q1 2024',
        type: 'Internrevisjon',
        scope: 'Alle avdelinger',
        status: 'Fullført',
        plannedDate: '2024-01-15',
        completedDate: '2024-01-20',
        responsiblePerson: 'Lars Hansen',
        department: 'HMS',
        findings: ['Manglende sikkerhetsopplæring for 3 ansatte', 'Defekte sikkerhetsutstyr i lageret'],
        recommendations: ['Gjennomføre sikkerhetsopplæring', 'Erstatte sikkerhetsutstyr'],
        priority: 'Høy',
        nextReview: '2024-04-15'
      },
      {
        id: '2',
        title: 'Kvalitetsrevisjon - Produksjon',
        type: 'Eksternrevisjon',
        scope: 'Produksjonsavdeling',
        status: 'Pågående',
        plannedDate: '2024-02-01',
        responsiblePerson: 'Anna Olsen',
        department: 'Kvalitet',
        findings: ['Dokumentasjon ikke oppdatert'],
        recommendations: ['Oppdatere prosedyrer'],
        priority: 'Middels',
        nextReview: '2024-05-01'
      },
      {
        id: '3',
        title: 'Finansiell revisjon',
        type: 'Regulatorisk',
        scope: 'Økonomiavdeling',
        status: 'Planlagt',
        plannedDate: '2024-03-15',
        responsiblePerson: 'Erik Johansen',
        department: 'Økonomi',
        findings: [],
        recommendations: [],
        priority: 'Høy',
        nextReview: '2024-06-15'
      }
    ];

    setAudits(mockAudits);
    setLoading(false);
  }, []);

  // Check if mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const filteredAudits = audits.filter(audit => {
    const matchesSearch = audit.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         audit.responsiblePerson.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         audit.department.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = selectedStatus === 'all' || audit.status === selectedStatus;
    const matchesType = selectedType === 'all' || audit.type === selectedType;
    const matchesPriority = selectedPriority === 'all' || audit.priority === selectedPriority;
    
    return matchesSearch && matchesStatus && matchesType && matchesPriority;
  });

  const handleAddAudit = () => {
    if (!newAudit.title || !newAudit.plannedDate || !newAudit.responsiblePerson) {
      alert('Vennligst fyll ut alle påkrevde felt');
      return;
    }

    const audit: Audit = {
      id: Date.now().toString(),
      ...newAudit,
      status: 'Planlagt',
      findings: [],
      recommendations: []
    };

    setAudits([...audits, audit]);
    setNewAudit({
      title: '',
      type: 'Internrevisjon',
      scope: '',
      plannedDate: '',
      responsiblePerson: '',
      department: '',
      priority: 'Middels',
      nextReview: ''
    });
    setShowAddModal(false);
  };

  const handleEditAudit = (audit: Audit) => {
    setSelectedAudit(audit);
    setShowEditModal(true);
  };

  const handleViewAudit = (audit: Audit) => {
    setSelectedAudit(audit);
    setShowDetailModal(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Fullført': return '#dcfce7';
      case 'Pågående': return '#fef3c7';
      case 'Planlagt': return '#dbeafe';
      default: return '#f3f4f6';
    }
  };

  const getStatusTextColor = (status: string) => {
    switch (status) {
      case 'Fullført': return '#166534';
      case 'Pågående': return '#d97706';
      case 'Planlagt': return '#1d4ed8';
      default: return '#6b7280';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Høy': return '#fecaca';
      case 'Middels': return '#fef3c7';
      case 'Lav': return '#d1fae5';
      default: return '#f3f4f6';
    }
  };

  const getPriorityTextColor = (priority: string) => {
    switch (priority) {
      case 'Høy': return '#dc2626';
      case 'Middels': return '#d97706';
      case 'Lav': return '#059669';
      default: return '#6b7280';
    }
  };

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '50vh' 
      }}>
        <div style={{ fontSize: '1.125rem', color: '#6b7280' }}>Laster...</div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ 
        marginBottom: '2rem',
        display: 'flex',
        flexDirection: isMobile ? 'column' : 'row',
        alignItems: isMobile ? 'stretch' : 'center',
        justifyContent: 'space-between',
        gap: '1rem'
      }}>
        <div>
          <h1 style={{ 
            fontSize: '2rem', 
            fontWeight: '700', 
            color: '#111827',
            margin: 0,
            marginBottom: '0.5rem'
          }}>
            Internrevisjon
          </h1>
          <p style={{ 
            color: '#6b7280', 
            fontSize: '1rem',
            margin: 0
          }}>
            Administrer og følg opp interne og eksterne revisjoner
          </p>
        </div>
        
        <button
          onClick={() => setShowAddModal(true)}
          style={{
            background: 'var(--primary)',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            padding: '0.75rem 1.5rem',
            fontSize: '0.875rem',
            fontWeight: '600',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            transition: 'all 0.2s',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
          }}
        >
          <Plus size={20} />
          Ny revisjon
        </button>
      </div>

      {/* Stats Cards */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: isMobile ? '1fr' : 'repeat(4, 1fr)', 
        gap: '1rem', 
        marginBottom: '2rem' 
      }}>
        <div style={{
          background: 'white',
          padding: '1.5rem',
          borderRadius: '12px',
          border: '1px solid #e5e7eb',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <p style={{ color: '#6b7280', fontSize: '0.875rem', margin: 0 }}>Totalt revisjoner</p>
              <p style={{ fontSize: '2rem', fontWeight: '700', color: '#111827', margin: 0 }}>
                {audits.length}
              </p>
            </div>
            <Shield size={32} color="#3b82f6" />
          </div>
        </div>

        <div style={{
          background: 'white',
          padding: '1.5rem',
          borderRadius: '12px',
          border: '1px solid #e5e7eb',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <p style={{ color: '#6b7280', fontSize: '0.875rem', margin: 0 }}>Fullført</p>
              <p style={{ fontSize: '2rem', fontWeight: '700', color: '#059669', margin: 0 }}>
                {audits.filter(a => a.status === 'Fullført').length}
              </p>
            </div>
            <CheckCircle size={32} color="#059669" />
          </div>
        </div>

        <div style={{
          background: 'white',
          padding: '1.5rem',
          borderRadius: '12px',
          border: '1px solid #e5e7eb',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <p style={{ color: '#6b7280', fontSize: '0.875rem', margin: 0 }}>Pågående</p>
              <p style={{ fontSize: '2rem', fontWeight: '700', color: '#d97706', margin: 0 }}>
                {audits.filter(a => a.status === 'Pågående').length}
              </p>
            </div>
            <Clock size={32} color="#d97706" />
          </div>
        </div>

        <div style={{
          background: 'white',
          padding: '1.5rem',
          borderRadius: '12px',
          border: '1px solid #e5e7eb',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <p style={{ color: '#6b7280', fontSize: '0.875rem', margin: 0 }}>Planlagt</p>
              <p style={{ fontSize: '2rem', fontWeight: '700', color: '#1d4ed8', margin: 0 }}>
                {audits.filter(a => a.status === 'Planlagt').length}
              </p>
            </div>
            <Calendar size={32} color="#1d4ed8" />
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div style={{
        background: 'white',
        padding: '1.5rem',
        borderRadius: '12px',
        border: '1px solid #e5e7eb',
        marginBottom: '1.5rem',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
      }}>
        <div style={{ 
          display: 'flex', 
          flexDirection: isMobile ? 'column' : 'row',
          gap: '1rem',
          alignItems: isMobile ? 'stretch' : 'center'
        }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <Search size={20} style={{ 
              position: 'absolute', 
              left: '0.75rem', 
              top: '50%', 
              transform: 'translateY(-50%)', 
              color: '#9ca3af' 
            }} />
            <input
              type="text"
              placeholder="Søk i revisjoner..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem 0.75rem 0.75rem 2.5rem',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '0.875rem',
                background: 'white'
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              style={{
                padding: '0.75rem',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '0.875rem',
                background: 'white',
                minWidth: '120px'
              }}
            >
              <option value="all">Alle statuser</option>
              <option value="Planlagt">Planlagt</option>
              <option value="Pågående">Pågående</option>
              <option value="Fullført">Fullført</option>
            </select>

            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              style={{
                padding: '0.75rem',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '0.875rem',
                background: 'white',
                minWidth: '120px'
              }}
            >
              <option value="all">Alle typer</option>
              <option value="Internrevisjon">Internrevisjon</option>
              <option value="Eksternrevisjon">Eksternrevisjon</option>
              <option value="Regulatorisk">Regulatorisk</option>
            </select>

            <select
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value)}
              style={{
                padding: '0.75rem',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '0.875rem',
                background: 'white',
                minWidth: '120px'
              }}
            >
              <option value="all">Alle prioriteter</option>
              <option value="Høy">Høy</option>
              <option value="Middels">Middels</option>
              <option value="Lav">Lav</option>
            </select>
          </div>
        </div>
      </div>

      {/* Audits List */}
      <div style={{
        background: 'white',
        borderRadius: '12px',
        border: '1px solid #e5e7eb',
        overflow: 'hidden',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
      }}>
        <div style={{ 
          padding: '1.5rem', 
          borderBottom: '1px solid #e5e7eb',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#111827', margin: 0 }}>
            Alle Internrevisjoner ({filteredAudits.length})
          </h3>
        </div>

        <div>
          {filteredAudits.length === 0 ? (
            <div style={{ 
              padding: '3rem', 
              textAlign: 'center', 
              color: '#6b7280' 
            }}>
              <Shield size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
              <p style={{ fontSize: '1rem', margin: 0 }}>Ingen revisjoner funnet</p>
            </div>
          ) : (
            filteredAudits.map((audit) => (
              <div key={audit.id} style={{ 
                padding: '1.5rem', 
                borderBottom: '1px solid #f3f4f6',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                transition: 'background-color 0.2s'
              }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                    <h4 style={{ fontSize: '1rem', fontWeight: '600', color: '#111827', margin: 0 }}>
                      {audit.title}
                    </h4>
                    <span style={{ 
                      padding: '0.25rem 0.5rem', 
                      borderRadius: '4px', 
                      fontSize: '0.75rem', 
                      fontWeight: '500',
                      background: getStatusColor(audit.status),
                      color: getStatusTextColor(audit.status)
                    }}>
                      {audit.status}
                    </span>
                    <span style={{ 
                      padding: '0.25rem 0.5rem', 
                      borderRadius: '4px', 
                      fontSize: '0.75rem', 
                      fontWeight: '500',
                      background: getPriorityColor(audit.priority),
                      color: getPriorityTextColor(audit.priority)
                    }}>
                      {audit.priority}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: '1rem', fontSize: '0.875rem', color: '#6b7280', flexWrap: 'wrap' }}>
                    <span>Type: {audit.type}</span>
                    <span>Omfang: {audit.scope}</span>
                    <span>Planlagt: {audit.plannedDate}</span>
                    <span>Ansvarlig: {audit.responsiblePerson}</span>
                    <span>Avdeling: {audit.department}</span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    onClick={() => handleViewAudit(audit)}
                    style={{
                      padding: '0.5rem',
                      background: '#f3f4f6',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <Eye size={16} color="#6b7280" />
                  </button>
                  <button
                    onClick={() => handleEditAudit(audit)}
                    style={{
                      padding: '0.5rem',
                      background: '#f3f4f6',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <Edit size={16} color="#6b7280" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Add Audit Modal */}
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
          zIndex: 1000,
          padding: '1rem'
        }}>
          <div style={{
            background: 'white',
            borderRadius: '12px',
            width: '100%',
            maxWidth: '500px',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <div style={{
              padding: '1.5rem',
              borderBottom: '1px solid #e5e7eb',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#111827', margin: 0 }}>
                Ny Internrevisjon
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '1.5rem',
                  color: '#6b7280',
                  cursor: 'pointer',
                  padding: '0.25rem'
                }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>
                    Tittel *
                  </label>
                  <input
                    type="text"
                    value={newAudit.title}
                    onChange={(e) => setNewAudit({ ...newAudit, title: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      fontSize: '0.875rem'
                    }}
                    placeholder="F.eks. Sikkerhetsrevisjon Q1 2024"
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>
                      Type
                    </label>
                    <select
                      value={newAudit.type}
                      onChange={(e) => setNewAudit({ ...newAudit, type: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid #d1d5db',
                        borderRadius: '8px',
                        fontSize: '0.875rem'
                      }}
                    >
                      <option value="Internrevisjon">Internrevisjon</option>
                      <option value="Eksternrevisjon">Eksternrevisjon</option>
                      <option value="Regulatorisk">Regulatorisk</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>
                      Prioritet
                    </label>
                    <select
                      value={newAudit.priority}
                      onChange={(e) => setNewAudit({ ...newAudit, priority: e.target.value as 'Høy' | 'Middels' | 'Lav' })}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid #d1d5db',
                        borderRadius: '8px',
                        fontSize: '0.875rem'
                      }}
                    >
                      <option value="Høy">Høy</option>
                      <option value="Middels">Middels</option>
                      <option value="Lav">Lav</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>
                    Omfang
                  </label>
                  <input
                    type="text"
                    value={newAudit.scope}
                    onChange={(e) => setNewAudit({ ...newAudit, scope: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      fontSize: '0.875rem'
                    }}
                    placeholder="F.eks. Alle avdelinger, Produksjonsavdeling"
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>
                      Planlagt dato *
                    </label>
                    <input
                      type="date"
                      value={newAudit.plannedDate}
                      onChange={(e) => setNewAudit({ ...newAudit, plannedDate: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid #d1d5db',
                        borderRadius: '8px',
                        fontSize: '0.875rem'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>
                      Neste gjennomgang
                    </label>
                    <input
                      type="date"
                      value={newAudit.nextReview}
                      onChange={(e) => setNewAudit({ ...newAudit, nextReview: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid #d1d5db',
                        borderRadius: '8px',
                        fontSize: '0.875rem'
                      }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>
                      Ansvarlig person *
                    </label>
                    <input
                      type="text"
                      value={newAudit.responsiblePerson}
                      onChange={(e) => setNewAudit({ ...newAudit, responsiblePerson: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid #d1d5db',
                        borderRadius: '8px',
                        fontSize: '0.875rem'
                      }}
                      placeholder="F.eks. Lars Hansen"
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>
                      Avdeling
                    </label>
                    <input
                      type="text"
                      value={newAudit.department}
                      onChange={(e) => setNewAudit({ ...newAudit, department: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid #d1d5db',
                        borderRadius: '8px',
                        fontSize: '0.875rem'
                      }}
                      placeholder="F.eks. HMS, Kvalitet"
                    />
                  </div>
                </div>
              </div>

              <div style={{ 
                display: 'flex', 
                gap: '1rem', 
                justifyContent: 'flex-end', 
                marginTop: '2rem',
                paddingTop: '1rem',
                borderTop: '1px solid #e5e7eb'
              }}>
                <button
                  onClick={() => setShowAddModal(false)}
                  style={{
                    padding: '0.75rem 1.5rem',
                    background: '#f3f4f6',
                    color: '#374151',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    cursor: 'pointer'
                  }}
                >
                  Avbryt
                </button>
                <button
                  onClick={handleAddAudit}
                  style={{
                    padding: '0.75rem 1.5rem',
                    background: 'var(--primary)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    cursor: 'pointer'
                  }}
                >
                  Opprett revisjon
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Audit Detail Modal */}
      {showDetailModal && selectedAudit && (
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
          zIndex: 1000,
          padding: '1rem'
        }}>
          <div style={{
            background: 'white',
            borderRadius: '12px',
            width: '100%',
            maxWidth: '600px',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <div style={{
              padding: '1.5rem',
              borderBottom: '1px solid #e5e7eb',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#111827', margin: 0 }}>
                {selectedAudit.title}
              </h3>
              <button
                onClick={() => setShowDetailModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '1.5rem',
                  color: '#6b7280',
                  cursor: 'pointer',
                  padding: '0.25rem'
                }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div>
                  <h4 style={{ fontSize: '1rem', fontWeight: '600', color: '#111827', marginBottom: '0.5rem' }}>
                    Grunnleggende informasjon
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', fontSize: '0.875rem' }}>
                    <div>
                      <span style={{ color: '#6b7280' }}>Type:</span>
                      <span style={{ color: '#111827', marginLeft: '0.5rem' }}>{selectedAudit.type}</span>
                    </div>
                    <div>
                      <span style={{ color: '#6b7280' }}>Status:</span>
                      <span style={{ 
                        color: getStatusTextColor(selectedAudit.status), 
                        marginLeft: '0.5rem',
                        padding: '0.25rem 0.5rem',
                        borderRadius: '4px',
                        background: getStatusColor(selectedAudit.status),
                        fontSize: '0.75rem'
                      }}>
                        {selectedAudit.status}
                      </span>
                    </div>
                    <div>
                      <span style={{ color: '#6b7280' }}>Prioritet:</span>
                      <span style={{ 
                        color: getPriorityTextColor(selectedAudit.priority), 
                        marginLeft: '0.5rem',
                        padding: '0.25rem 0.5rem',
                        borderRadius: '4px',
                        background: getPriorityColor(selectedAudit.priority),
                        fontSize: '0.75rem'
                      }}>
                        {selectedAudit.priority}
                      </span>
                    </div>
                    <div>
                      <span style={{ color: '#6b7280' }}>Omfang:</span>
                      <span style={{ color: '#111827', marginLeft: '0.5rem' }}>{selectedAudit.scope}</span>
                    </div>
                    <div>
                      <span style={{ color: '#6b7280' }}>Planlagt:</span>
                      <span style={{ color: '#111827', marginLeft: '0.5rem' }}>{selectedAudit.plannedDate}</span>
                    </div>
                    <div>
                      <span style={{ color: '#6b7280' }}>Ansvarlig:</span>
                      <span style={{ color: '#111827', marginLeft: '0.5rem' }}>{selectedAudit.responsiblePerson}</span>
                    </div>
                    <div>
                      <span style={{ color: '#6b7280' }}>Avdeling:</span>
                      <span style={{ color: '#111827', marginLeft: '0.5rem' }}>{selectedAudit.department}</span>
                    </div>
                    <div>
                      <span style={{ color: '#6b7280' }}>Neste gjennomgang:</span>
                      <span style={{ color: '#111827', marginLeft: '0.5rem' }}>{selectedAudit.nextReview}</span>
                    </div>
                  </div>
                </div>

                {selectedAudit.findings.length > 0 && (
                  <div>
                    <h4 style={{ fontSize: '1rem', fontWeight: '600', color: '#111827', marginBottom: '0.5rem' }}>
                      Funn
                    </h4>
                    <ul style={{ margin: 0, paddingLeft: '1.5rem' }}>
                      {selectedAudit.findings.map((finding, index) => (
                        <li key={index} style={{ color: '#374151', marginBottom: '0.25rem' }}>
                          {finding}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {selectedAudit.recommendations.length > 0 && (
                  <div>
                    <h4 style={{ fontSize: '1rem', fontWeight: '600', color: '#111827', marginBottom: '0.5rem' }}>
                      Anbefalinger
                    </h4>
                    <ul style={{ margin: 0, paddingLeft: '1.5rem' }}>
                      {selectedAudit.recommendations.map((recommendation, index) => (
                        <li key={index} style={{ color: '#374151', marginBottom: '0.25rem' }}>
                          {recommendation}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
