'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { firebaseService, Deviation as FirestoreDeviation, Employee, Department } from '@/lib/firebase-services';
import { 
  AlertTriangle, 
  Plus, 
  Search, 
  Calendar, 
  User, 
  MapPin,
  Edit,
  Trash2,
  MoreHorizontal,
  CheckCircle,
  Clock,
  AlertCircle,
  Eye,
  Download,
  Filter,
  TrendingUp,
  TrendingDown,
  FileText,
  MessageSquare
} from 'lucide-react';

export default function DeviationsPage() {
  const { userProfile } = useAuth();
  const [deviations, setDeviations] = useState<FirestoreDeviation[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedSeverity, setSelectedSeverity] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedDeviation, setSelectedDeviation] = useState<FirestoreDeviation | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [newDeviation, setNewDeviation] = useState({
    title: '',
    description: '',
    type: 'safety' as 'safety' | 'quality' | 'security' | 'process' | 'other',
    severity: 'medium' as 'low' | 'medium' | 'high' | 'critical',
    departmentId: '',
    location: ''
  });

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (userProfile?.companyId) {
      loadDeviations();
      loadEmployees();
      loadDepartments();
    }
  }, [userProfile?.companyId]);

  const loadDeviations = async () => {
    if (!userProfile?.companyId) return;

    try {
      const data = await firebaseService.getDeviations(userProfile.companyId);
      setDeviations(data);
    } catch (error) {
      console.error('Error loading deviations:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadEmployees = async () => {
    if (!userProfile?.companyId) return;

    try {
      const data = await firebaseService.getEmployees(userProfile.companyId);
      setEmployees(data);
    } catch (error) {
      console.error('Error loading employees:', error);
    }
  };

  const loadDepartments = async () => {
    if (!userProfile?.companyId) return;

    try {
      const data = await firebaseService.getDepartments(userProfile.companyId);
      setDepartments(data);
    } catch (error) {
      console.error('Error loading departments:', error);
    }
  };

  const handleAddDeviation = async () => {
    if (!userProfile?.companyId) return;

    try {
      const deviationData = {
        ...newDeviation,
        companyId: userProfile.companyId,
        reportedBy: userProfile.id,
        status: 'reported' as const,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await firebaseService.createDeviation(deviationData);
      setShowAddModal(false);
      setNewDeviation({
        title: '',
        description: '',
        type: 'safety',
        severity: 'medium',
        departmentId: '',
        location: ''
      });
      loadDeviations();
    } catch (error) {
      console.error('Error adding deviation:', error);
    }
  };

  const handleEditDeviation = async () => {
    if (!selectedDeviation) return;

    try {
      await firebaseService.updateDeviation(selectedDeviation.id, {
        ...selectedDeviation,
        updatedAt: new Date().toISOString()
      });
      setShowEditModal(false);
      setSelectedDeviation(null);
      loadDeviations();
    } catch (error) {
      console.error('Error updating deviation:', error);
    }
  };

  const handleDeleteDeviation = async (deviationId: string) => {
    if (!confirm('Er du sikker på at du vil slette dette avviket?')) return;

    try {
      await firebaseService.updateDeviation(deviationId, { status: 'closed' });
      loadDeviations();
    } catch (error) {
      console.error('Error deleting deviation:', error);
    }
  };

  const getDepartmentName = (departmentId: string) => {
    const dept = departments.find(d => d.id === departmentId);
    return dept?.name || 'Ukjent avdeling';
  };

  const getReporterName = (reporterId: string) => {
    const emp = employees.find(e => e.id === reporterId);
    return emp?.displayName || 'Ukjent bruker';
  };

  const getAssignedName = (assignedId?: string) => {
    if (!assignedId) return 'Ikke tildelt';
    const emp = employees.find(e => e.id === assignedId);
    return emp?.displayName || 'Ukjent bruker';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'reported': return 'bg-yellow-100 text-yellow-800';
      case 'investigating': return 'bg-blue-100 text-blue-800';
      case 'resolved': return 'bg-green-100 text-green-800';
      case 'closed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'reported': return <AlertCircle className="h-4 w-4" />;
      case 'investigating': return <Clock className="h-4 w-4" />;
      case 'resolved': return <CheckCircle className="h-4 w-4" />;
      case 'closed': return <CheckCircle className="h-4 w-4" />;
      default: return <AlertCircle className="h-4 w-4" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'low': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-red-100 text-red-800';
      case 'critical': return 'bg-red-200 text-red-900';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'safety': return 'bg-red-100 text-red-800';
      case 'quality': return 'bg-blue-100 text-blue-800';
      case 'maintenance': return 'bg-purple-100 text-purple-800';
      case 'environmental': return 'bg-green-100 text-green-800';
      case 'other': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTotalDeviations = () => deviations.length;
  const getOpenDeviations = () => deviations.filter(d => d.status === 'reported' || d.status === 'investigating').length;
  const getResolvedDeviations = () => deviations.filter(d => d.status === 'resolved').length;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('nb-NO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filteredDeviations = deviations.filter(deviation => {
    const matchesSearch = deviation.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         deviation.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = selectedStatus === 'all' || deviation.status === selectedStatus;
    const matchesType = selectedType === 'all' || deviation.type === selectedType;
    const matchesSeverity = selectedSeverity === 'all' || deviation.severity === selectedSeverity;
    
    return matchesSearch && matchesStatus && matchesType && matchesSeverity;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Laster avvik...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--gray-50)' }}>
      {/* Mobile Header */}
      {isMobile && (
        <div style={{ background: 'var(--white)', boxShadow: 'var(--shadow-sm)', borderBottom: '1px solid var(--gray-200)', padding: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h1 style={{ fontSize: 'var(--font-size-lg)', fontWeight: '600', color: 'var(--gray-900)' }}>Avvik</h1>
            <button
              onClick={() => setShowAddModal(true)}
              style={{ background: 'var(--primary)', color: 'var(--white)', padding: '0.5rem', borderRadius: 'var(--radius-lg)', border: 'none', cursor: 'pointer' }}
            >
              <Plus style={{ width: '20px', height: '20px' }} />
            </button>
          </div>
        </div>
      )}

      {/* Desktop Header */}
      {!isMobile && (
        <div style={{ background: 'var(--white)', boxShadow: 'var(--shadow-sm)', borderBottom: '1px solid var(--gray-200)', padding: '1.5rem 2rem' }}>
          <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h1 style={{ fontSize: 'var(--font-size-2xl)', fontWeight: '700', color: 'var(--gray-900)' }}>Avvik</h1>
            <button
              onClick={() => setShowAddModal(true)}
              className="btn btn-primary"
            >
              <Plus style={{ width: '16px', height: '16px', marginRight: '0.5rem' }} />
              Rapporter avvik
            </button>
          </div>
        </div>
      )}

      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '2rem 1rem' }}>
        {/* Stats Overview */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <p style={{ fontSize: 'var(--font-size-sm)', fontWeight: '500', color: 'var(--gray-600)', marginBottom: '0.5rem' }}>Totalt avvik</p>
                <p style={{ fontSize: 'var(--font-size-3xl)', fontWeight: '700', color: 'var(--gray-900)' }}>{getTotalDeviations()}</p>
              </div>
              <div style={{ background: 'var(--blue-100)', padding: '0.75rem', borderRadius: 'var(--radius-lg)' }}>
                <AlertTriangle style={{ width: '24px', height: '24px', color: 'var(--blue-600)' }} />
              </div>
            </div>
          </div>
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <p style={{ fontSize: 'var(--font-size-sm)', fontWeight: '500', color: 'var(--gray-600)', marginBottom: '0.5rem' }}>Åpne avvik</p>
                <p style={{ fontSize: 'var(--font-size-3xl)', fontWeight: '700', color: 'var(--orange-600)' }}>{getOpenDeviations()}</p>
              </div>
              <div style={{ background: 'var(--orange-100)', padding: '0.75rem', borderRadius: 'var(--radius-lg)' }}>
                <Clock style={{ width: '24px', height: '24px', color: 'var(--orange-600)' }} />
              </div>
            </div>
          </div>
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <p style={{ fontSize: 'var(--font-size-sm)', fontWeight: '500', color: 'var(--gray-600)', marginBottom: '0.5rem' }}>Løste avvik</p>
                <p style={{ fontSize: 'var(--font-size-3xl)', fontWeight: '700', color: 'var(--green-600)' }}>{getResolvedDeviations()}</p>
              </div>
              <div style={{ background: 'var(--green-100)', padding: '0.75rem', borderRadius: 'var(--radius-lg)' }}>
                <CheckCircle style={{ width: '24px', height: '24px', color: 'var(--green-600)' }} />
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Controls */}
        {isMobile && (
          <div style={{ marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
              <div style={{ flex: '1', position: 'relative' }}>
                <Search style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', width: '16px', height: '16px', color: 'var(--gray-400)' }} />
                <input
                  type="text"
                  placeholder="Søk i avvik..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{ width: '100%', padding: '0.75rem 0.75rem 0.75rem 2.5rem', border: '1px solid var(--gray-300)', borderRadius: 'var(--radius-lg)', fontSize: 'var(--font-size-base)' }}
                />
              </div>
              <button
                onClick={() => setShowFilters(!showFilters)}
                style={{ padding: '0.75rem', border: '1px solid var(--gray-300)', borderRadius: 'var(--radius-lg)', background: 'var(--white)', cursor: 'pointer' }}
              >
                <Filter style={{ width: '16px', height: '16px' }} />
              </button>
            </div>
            
            {showFilters && (
              <div style={{ background: 'var(--white)', padding: '1rem', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--gray-200)' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    style={{ width: '100%', padding: '0.75rem', border: '1px solid var(--gray-300)', borderRadius: 'var(--radius-lg)', fontSize: 'var(--font-size-base)' }}
                  >
                    <option value="all">Alle statuser</option>
                    <option value="reported">Rapportert</option>
                    <option value="investigating">Undersøkes</option>
                    <option value="resolved">Løst</option>
                    <option value="closed">Lukket</option>
                  </select>
                  <select
                    value={selectedType}
                    onChange={(e) => setSelectedType(e.target.value)}
                    style={{ width: '100%', padding: '0.75rem', border: '1px solid var(--gray-300)', borderRadius: 'var(--radius-lg)', fontSize: 'var(--font-size-base)' }}
                  >
                    <option value="all">Alle typer</option>
                    <option value="safety">Sikkerhet</option>
                    <option value="quality">Kvalitet</option>
                    <option value="security">Sikkerhet</option>
                    <option value="process">Prosess</option>
                    <option value="other">Annet</option>
                  </select>
                  <select
                    value={selectedSeverity}
                    onChange={(e) => setSelectedSeverity(e.target.value)}
                    style={{ width: '100%', padding: '0.75rem', border: '1px solid var(--gray-300)', borderRadius: 'var(--radius-lg)', fontSize: 'var(--font-size-base)' }}
                  >
                    <option value="all">Alle alvorlighetsgrader</option>
                    <option value="low">Lav</option>
                    <option value="medium">Medium</option>
                    <option value="high">Høy</option>
                    <option value="critical">Kritisk</option>
                  </select>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Desktop Controls */}
        {!isMobile && (
          <div className="card" style={{ marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ position: 'relative', flex: '1' }}>
                <Search style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', width: '20px', height: '20px', color: 'var(--gray-400)' }} />
                <input
                  type="text"
                  placeholder="Søk i avvik..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{ width: '100%', padding: '0.75rem 0.75rem 0.75rem 2.5rem', border: '1px solid var(--gray-300)', borderRadius: 'var(--radius-lg)', fontSize: 'var(--font-size-base)' }}
                />
              </div>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  style={{ padding: '0.75rem 1rem', border: '1px solid var(--gray-300)', borderRadius: 'var(--radius-lg)', fontSize: 'var(--font-size-base)', minWidth: '150px' }}
                >
                  <option value="all">Alle statuser</option>
                  <option value="reported">Rapportert</option>
                  <option value="investigating">Undersøkes</option>
                  <option value="resolved">Løst</option>
                  <option value="closed">Lukket</option>
                </select>
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  style={{ padding: '0.75rem 1rem', border: '1px solid var(--gray-300)', borderRadius: 'var(--radius-lg)', fontSize: 'var(--font-size-base)', minWidth: '150px' }}
                >
                  <option value="all">Alle typer</option>
                  <option value="safety">Sikkerhet</option>
                  <option value="quality">Kvalitet</option>
                  <option value="security">Sikkerhet</option>
                  <option value="process">Prosess</option>
                  <option value="other">Annet</option>
                </select>
                <select
                  value={selectedSeverity}
                  onChange={(e) => setSelectedSeverity(e.target.value)}
                  style={{ padding: '0.75rem 1rem', border: '1px solid var(--gray-300)', borderRadius: 'var(--radius-lg)', fontSize: 'var(--font-size-base)', minWidth: '150px' }}
                >
                  <option value="all">Alle alvorlighetsgrader</option>
                  <option value="low">Lav</option>
                  <option value="medium">Medium</option>
                  <option value="high">Høy</option>
                  <option value="critical">Kritisk</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Deviations List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {filteredDeviations.length === 0 ? (
            <div className="card" style={{ padding: '3rem', textAlign: 'center' }}>
              <AlertTriangle style={{ width: '48px', height: '48px', color: 'var(--gray-400)', margin: '0 auto 1rem' }} />
              <h3 style={{ fontSize: 'var(--font-size-lg)', fontWeight: '600', color: 'var(--gray-900)', marginBottom: '0.5rem' }}>Ingen avvik funnet</h3>
              <p style={{ color: 'var(--gray-600)' }}>Det er ingen avvik som matcher søkekriteriene dine.</p>
            </div>
          ) : (
            filteredDeviations.map(deviation => (
              <div key={deviation.id} className="card" style={{ cursor: 'pointer' }}>
                <div style={{ padding: '1.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1rem' }}>
                    <div style={{ flex: '1' }}>
                      <h3 style={{ fontSize: 'var(--font-size-lg)', fontWeight: '600', color: 'var(--gray-900)', marginBottom: '0.5rem' }}>{deviation.title}</h3>
                      <p style={{ color: 'var(--gray-600)', marginBottom: '0.75rem' }}>{deviation.description}</p>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.75rem' }}>
                        <span className={`badge ${getStatusColor(deviation.status)}`}>
                          {getStatusIcon(deviation.status)}
                          <span style={{ marginLeft: '0.25rem' }}>{deviation.status}</span>
                        </span>
                        <span className={`badge ${getTypeColor(deviation.type)}`}>
                          {deviation.type}
                        </span>
                        <span className={`badge ${getSeverityColor(deviation.severity)}`}>
                          {deviation.severity}
                        </span>
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', fontSize: 'var(--font-size-sm)', color: 'var(--gray-500)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <User style={{ width: '16px', height: '16px' }} />
                          <span>Rapportert av: {getReporterName(deviation.reportedBy)}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <Calendar style={{ width: '16px', height: '16px' }} />
                          <span>{formatDate(deviation.createdAt)}</span>
                        </div>
                        {deviation.departmentId && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                            <MapPin style={{ width: '16px', height: '16px' }} />
                            <span>{getDepartmentName(deviation.departmentId)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', marginLeft: '1rem' }}>
                      <button
                        onClick={() => {
                          setSelectedDeviation(deviation);
                          setShowEditModal(true);
                        }}
                        style={{ padding: '0.5rem', color: 'var(--gray-400)', background: 'none', border: 'none', cursor: 'pointer', borderRadius: 'var(--radius-md)' }}
                        title="Rediger"
                      >
                        <Edit style={{ width: '16px', height: '16px' }} />
                      </button>
                      <button
                        onClick={() => handleDeleteDeviation(deviation.id)}
                        style={{ padding: '0.5rem', color: 'var(--gray-400)', background: 'none', border: 'none', cursor: 'pointer', borderRadius: 'var(--radius-md)' }}
                        title="Slett"
                      >
                        <Trash2 style={{ width: '16px', height: '16px' }} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Add Deviation Modal */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2 className="modal-title">Rapporter nytt avvik</h2>
              <button onClick={() => setShowAddModal(false)} className="modal-close">×</button>
            </div>
            <div className="modal-body">
              <div className="modal-form-grid">
                <div className="form-field">
                  <label className="form-label">Tittel</label>
                  <input
                    type="text"
                    value={newDeviation.title}
                    onChange={(e) => setNewDeviation({ ...newDeviation, title: e.target.value })}
                    className="form-input-modal"
                    placeholder="Beskriv avviket kort"
                  />
                </div>
                <div className="form-field">
                  <label className="form-label">Beskrivelse</label>
                  <textarea
                    value={newDeviation.description}
                    onChange={(e) => setNewDeviation({ ...newDeviation, description: e.target.value })}
                    rows={4}
                    className="form-textarea-modal"
                    placeholder="Detaljert beskrivelse av avviket"
                  />
                </div>
                <div className="form-field">
                  <label className="form-label">Type</label>
                  <select
                    value={newDeviation.type}
                    onChange={(e) => setNewDeviation({ ...newDeviation, type: e.target.value as 'safety' | 'quality' | 'security' | 'process' | 'other' })}
                    className="form-select-modal"
                  >
                    <option value="safety">Sikkerhet</option>
                    <option value="quality">Kvalitet</option>
                    <option value="security">Sikkerhet</option>
                    <option value="process">Prosess</option>
                    <option value="other">Annet</option>
                  </select>
                </div>
                <div className="form-field">
                  <label className="form-label">Alvorlighetsgrad</label>
                  <select
                    value={newDeviation.severity}
                    onChange={(e) => setNewDeviation({ ...newDeviation, severity: e.target.value as 'low' | 'medium' | 'high' | 'critical' })}
                    className="form-select-modal"
                  >
                    <option value="low">Lav</option>
                    <option value="medium">Medium</option>
                    <option value="high">Høy</option>
                    <option value="critical">Kritisk</option>
                  </select>
                </div>
                <div className="form-field">
                  <label className="form-label">Avdeling</label>
                  <select
                    value={newDeviation.departmentId}
                    onChange={(e) => setNewDeviation({ ...newDeviation, departmentId: e.target.value })}
                    className="form-select-modal"
                  >
                    <option value="">Velg avdeling</option>
                    {departments.map(dept => (
                      <option key={dept.id} value={dept.id}>{dept.name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-field">
                  <label className="form-label">Lokasjon</label>
                  <input
                    type="text"
                    value={newDeviation.location}
                    onChange={(e) => setNewDeviation({ ...newDeviation, location: e.target.value })}
                    className="form-input-modal"
                    placeholder="Hvor skjedde avviket?"
                  />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button onClick={() => setShowAddModal(false)} className="btn btn-secondary">Avbryt</button>
              <button onClick={handleAddDeviation} className="btn btn-primary">Rapporter avvik</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Deviation Modal */}
      {showEditModal && selectedDeviation && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2 className="modal-title">Rediger avvik</h2>
              <button onClick={() => setShowEditModal(false)} className="modal-close">×</button>
            </div>
            <div className="modal-body">
              <div className="modal-form-grid">
                <div className="form-field">
                  <label className="form-label">Tittel</label>
                  <input
                    type="text"
                    value={selectedDeviation.title}
                    onChange={(e) => setSelectedDeviation({ ...selectedDeviation, title: e.target.value })}
                    className="form-input-modal"
                  />
                </div>
                <div className="form-field">
                  <label className="form-label">Beskrivelse</label>
                  <textarea
                    value={selectedDeviation.description}
                    onChange={(e) => setSelectedDeviation({ ...selectedDeviation, description: e.target.value })}
                    rows={4}
                    className="form-textarea-modal"
                  />
                </div>
                <div className="form-field">
                  <label className="form-label">Status</label>
                  <select
                    value={selectedDeviation.status}
                    onChange={(e) => setSelectedDeviation({ ...selectedDeviation, status: e.target.value as 'reported' | 'investigating' | 'resolved' | 'closed' })}
                    className="form-select-modal"
                  >
                    <option value="reported">Rapportert</option>
                    <option value="investigating">Undersøkes</option>
                    <option value="resolved">Løst</option>
                    <option value="closed">Lukket</option>
                  </select>
                </div>
                <div className="form-field">
                  <label className="form-label">Tildelt til</label>
                  <select
                    value={selectedDeviation.assignedTo || ''}
                    onChange={(e) => setSelectedDeviation({ ...selectedDeviation, assignedTo: e.target.value || undefined })}
                    className="form-select-modal"
                  >
                    <option value="">Ikke tildelt</option>
                    {employees.map(emp => (
                      <option key={emp.id} value={emp.id}>{emp.displayName}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button onClick={() => setShowEditModal(false)} className="btn btn-secondary">Avbryt</button>
              <button onClick={handleEditDeviation} className="btn btn-primary">Lagre endringer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
