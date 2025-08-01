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
    <div className="deviations-page">
      {/* Mobile Header */}
      {isMobile && (
        <div className="mobile-header bg-white shadow-sm border-b px-4 py-3">
          <div className="flex items-center justify-between">
            <h1 className="text-lg font-semibold text-gray-900">Avvik</h1>
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-blue-600 text-white p-2 rounded-lg"
            >
              <Plus className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}

      {/* Desktop Header */}
      {!isMobile && (
        <div className="page-header">
          <h1 className="page-title">Avvik</h1>
          <button
            onClick={() => setShowAddModal(true)}
            className="btn btn-primary"
          >
            <Plus className="h-4 w-4 mr-2" />
            Rapporter avvik
          </button>
        </div>
      )}

      <div className="px-4 py-6 max-w-7xl mx-auto">
        {/* Stats Overview */}
        <div className="stats-grid" style={{ marginBottom: '2rem' }}>
          <div className="stat-card">
            <div className="stat-number">{getTotalDeviations()}</div>
            <div className="stat-label">Totalt avvik</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{getOpenDeviations()}</div>
            <div className="stat-label">Åpne avvik</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{getResolvedDeviations()}</div>
            <div className="stat-label">Løste avvik</div>
          </div>
        </div>

        {/* Mobile Controls */}
        {isMobile && (
          <div className="mobile-controls mb-4">
            <div className="flex gap-2 mb-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Søk i avvik..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="p-2 border border-gray-300 rounded-lg"
              >
                <Filter className="h-4 w-4" />
              </button>
            </div>
            
            {showFilters && (
              <div className="filter-section bg-gray-50 p-3 rounded-lg space-y-3">
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded"
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
                  className="w-full p-2 border border-gray-300 rounded"
                >
                  <option value="all">Alle typer</option>
                  <option value="safety">Sikkerhet</option>
                  <option value="quality">Kvalitet</option>
                  <option value="maintenance">Vedlikehold</option>
                  <option value="environmental">Miljø</option>
                  <option value="other">Annet</option>
                </select>
                <select
                  value={selectedSeverity}
                  onChange={(e) => setSelectedSeverity(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded"
                >
                  <option value="all">Alle alvorlighetsgrader</option>
                  <option value="low">Lav</option>
                  <option value="medium">Medium</option>
                  <option value="high">Høy</option>
                  <option value="critical">Kritisk</option>
                </select>
              </div>
            )}
          </div>
        )}

        {/* Desktop Controls */}
        {!isMobile && (
          <div className="controls-section">
            <div className="search-filter-row">
              <div className="search-box">
                <Search className="search-icon" />
                <input
                  type="text"
                  placeholder="Søk i avvik..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="filter-controls">
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
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
                >
                  <option value="all">Alle typer</option>
                  <option value="safety">Sikkerhet</option>
                  <option value="quality">Kvalitet</option>
                  <option value="maintenance">Vedlikehold</option>
                  <option value="environmental">Miljø</option>
                  <option value="other">Annet</option>
                </select>
                <select
                  value={selectedSeverity}
                  onChange={(e) => setSelectedSeverity(e.target.value)}
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
        <div className="deviations-list">
          {filteredDeviations.length === 0 ? (
            <div className="empty-state">
              <AlertTriangle className="empty-icon" />
              <h3>Ingen avvik funnet</h3>
              <p>Det er ingen avvik som matcher søkekriteriene dine.</p>
            </div>
          ) : (
            filteredDeviations.map(deviation => (
              <div key={deviation.id} className="deviation-card">
                <div className="deviation-header">
                  <div className="deviation-title">
                    <h3>{deviation.title}</h3>
                    <div className="deviation-badges">
                      <span className={`badge ${getStatusColor(deviation.status)}`}>
                        {getStatusIcon(deviation.status)}
                        {deviation.status}
                      </span>
                      <span className={`badge ${getTypeColor(deviation.type)}`}>
                        {deviation.type}
                      </span>
                      <span className={`badge ${getSeverityColor(deviation.severity)}`}>
                        {deviation.severity}
                      </span>
                    </div>
                  </div>
                  <div className="deviation-actions">
                    <button
                      onClick={() => {
                        setSelectedDeviation(deviation);
                        setShowEditModal(true);
                      }}
                      className="action-btn"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteDeviation(deviation.id)}
                      className="action-btn delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <div className="deviation-content">
                  <p>{deviation.description}</p>
                  <div className="deviation-meta">
                    <div className="meta-item">
                      <User className="h-4 w-4" />
                                             <span>Rapportert av: {getReporterName(deviation.reportedBy)}</span>
                    </div>
                    {deviation.assignedTo && (
                      <div className="meta-item">
                        <User className="h-4 w-4" />
                        <span>Tildelt til: {getAssignedName(deviation.assignedTo)}</span>
                      </div>
                    )}
                    <div className="meta-item">
                      <MapPin className="h-4 w-4" />
                      <span>Avdeling: {getDepartmentName(deviation.departmentId)}</span>
                    </div>
                    {deviation.location && (
                      <div className="meta-item">
                        <MapPin className="h-4 w-4" />
                        <span>Lokasjon: {deviation.location}</span>
                      </div>
                    )}
                    <div className="meta-item">
                      <Calendar className="h-4 w-4" />
                      <span>Rapportert: {formatDate(deviation.createdAt)}</span>
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
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Tittel</label>
                  <input
                    type="text"
                    value={newDeviation.title}
                    onChange={(e) => setNewDeviation({ ...newDeviation, title: e.target.value })}
                    style={{ width: '100%', padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '8px' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Beskrivelse</label>
                  <textarea
                    value={newDeviation.description}
                    onChange={(e) => setNewDeviation({ ...newDeviation, description: e.target.value })}
                    rows={4}
                    style={{ width: '100%', padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '8px', resize: 'vertical' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Type</label>
                  <select
                    value={newDeviation.type}
                    onChange={(e) => setNewDeviation({ ...newDeviation, type: e.target.value as 'safety' | 'quality' | 'security' | 'process' | 'other' })}
                    style={{ width: '100%', padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '8px' }}
                  >
                    <option value="safety">Sikkerhet</option>
                    <option value="quality">Kvalitet</option>
                    <option value="security">Sikkerhet</option>
                    <option value="process">Prosess</option>
                    <option value="other">Annet</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Alvorlighetsgrad</label>
                  <select
                    value={newDeviation.severity}
                    onChange={(e) => setNewDeviation({ ...newDeviation, severity: e.target.value as 'low' | 'medium' | 'high' | 'critical' })}
                    style={{ width: '100%', padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '8px' }}
                  >
                    <option value="low">Lav</option>
                    <option value="medium">Medium</option>
                    <option value="high">Høy</option>
                    <option value="critical">Kritisk</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Avdeling</label>
                  <select
                    value={newDeviation.departmentId}
                    onChange={(e) => setNewDeviation({ ...newDeviation, departmentId: e.target.value })}
                    style={{ width: '100%', padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '8px' }}
                  >
                    <option value="">Velg avdeling</option>
                    {departments.map(dept => (
                      <option key={dept.id} value={dept.id}>{dept.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Lokasjon</label>
                  <input
                    type="text"
                    value={newDeviation.location}
                    onChange={(e) => setNewDeviation({ ...newDeviation, location: e.target.value })}
                    style={{ width: '100%', padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '8px' }}
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
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Tittel</label>
                  <input
                    type="text"
                    value={selectedDeviation.title}
                    onChange={(e) => setSelectedDeviation({ ...selectedDeviation, title: e.target.value })}
                    style={{ width: '100%', padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '8px' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Beskrivelse</label>
                  <textarea
                    value={selectedDeviation.description}
                    onChange={(e) => setSelectedDeviation({ ...selectedDeviation, description: e.target.value })}
                    rows={4}
                    style={{ width: '100%', padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '8px', resize: 'vertical' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Status</label>
                  <select
                    value={selectedDeviation.status}
                    onChange={(e) => setSelectedDeviation({ ...selectedDeviation, status: e.target.value as 'reported' | 'investigating' | 'resolved' | 'closed' })}
                    style={{ width: '100%', padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '8px' }}
                  >
                    <option value="reported">Rapportert</option>
                    <option value="investigating">Undersøkes</option>
                    <option value="resolved">Løst</option>
                    <option value="closed">Lukket</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Tildelt til</label>
                  <select
                    value={selectedDeviation.assignedTo || ''}
                    onChange={(e) => setSelectedDeviation({ ...selectedDeviation, assignedTo: e.target.value || undefined })}
                    style={{ width: '100%', padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '8px' }}
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
