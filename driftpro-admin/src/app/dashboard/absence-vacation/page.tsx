'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { firebaseService } from '@/lib/firebase-services';
import { 
  Calendar, 
  Plus, 
  Search, 
  Filter,
  SortAsc,
  SortDesc,
  Grid,
  List,
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
  User,
  Hash,
  Briefcase,
  Target,
  TrendingUp,
  CheckCircle2,
  XCircle,
  Info,
  Database,
  RefreshCw,
  Save,
  Loader2,
  X,
  Link,
  Plane,
  Home,
  Heart,
  Briefcase as BriefcaseIcon,
  Clock as ClockIcon,
  CalendarDays,
  Users,
  BarChart3
} from 'lucide-react';

interface Absence {
  id: string;
  employeeId: string;
  employeeName: string;
  type: 'sick' | 'personal' | 'other';
  startDate: string;
  endDate: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  approvedBy?: string;
  approvedAt?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

interface Vacation {
  id: string;
  employeeId: string;
  employeeName: string;
  type: 'vacation' | 'sick' | 'personal' | 'other';
  startDate: string;
  endDate: string;
  days: number;
  status: 'pending' | 'approved' | 'rejected';
  approvedBy?: string;
  approvedAt?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export default function AbsenceVacationPage() {
  const { userProfile } = useAuth();
  const [activeTab, setActiveTab] = useState<'absence' | 'vacation'>('absence');
  const [absences, setAbsences] = useState<Absence[]>([]);
  const [vacations, setVacations] = useState<Vacation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [sortBy, setSortBy] = useState<'name' | 'date' | 'status'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Absence | Vacation | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const [newAbsence, setNewAbsence] = useState({
    employeeId: '',
    employeeName: '',
    type: 'sick' as 'sick' | 'personal' | 'other',
    startDate: '',
    endDate: '',
    reason: '',
    notes: ''
  });

  const [newVacation, setNewVacation] = useState({
    employeeId: '',
    employeeName: '',
    type: 'vacation' as 'vacation' | 'sick' | 'personal' | 'other',
    startDate: '',
    endDate: '',
    days: 1,
    notes: ''
  });

  const loadData = async () => {
    if (!userProfile?.companyId) {
      setLoading(false);
      return;
    }

    try {
      setError(null);
      
      // Load absences and vacations from Firebase
      const absencesData = await firebaseService.getAbsences(userProfile.companyId);
      const vacationsData = await firebaseService.getVacations(userProfile.companyId);
      
      setAbsences(absencesData);
      setVacations(vacationsData);
    } catch (error) {
      console.error('Error loading data:', error);
      setError('Feil ved lasting av data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [userProfile?.companyId]);

  const handleCreateAbsence = async () => {
    if (!userProfile?.companyId) return;

    try {
      setError(null);
      const absenceData = {
        ...newAbsence,
        companyId: userProfile.companyId,
        createdBy: userProfile.id,
        status: 'pending' as const
      };

      await firebaseService.createAbsence(absenceData);
      setSuccess('Fravær registrert');
      setShowAddModal(false);
      loadData();
    } catch (error) {
      console.error('Error creating absence:', error);
      setError('Feil ved registrering av fravær');
    }
  };

  const handleCreateVacation = async () => {
    if (!userProfile?.companyId) return;

    try {
      setError(null);
      const vacationData = {
        ...newVacation,
        companyId: userProfile.companyId,
        createdBy: userProfile.id,
        status: 'pending' as const
      };

      await firebaseService.createVacation(vacationData);
      setSuccess('Ferie registrert');
      setShowAddModal(false);
      loadData();
    } catch (error) {
      console.error('Error creating vacation:', error);
      setError('Feil ved registrering av ferie');
    }
  };

  const handleViewItem = (item: Absence | Vacation) => {
    setSelectedItem(item);
    setShowDetailModal(true);
  };

  const handleEditItem = (item: Absence | Vacation) => {
    setSelectedItem(item);
    if (activeTab === 'absence') {
      setNewAbsence({
        employeeId: item.employeeId,
        employeeName: item.employeeName,
        type: (item as Absence).type,
        startDate: item.startDate,
        endDate: item.endDate,
        reason: (item as Absence).reason,
        notes: item.notes || ''
      });
    } else {
      setNewVacation({
        employeeId: item.employeeId,
        employeeName: item.employeeName,
        type: (item as Vacation).type,
        startDate: item.startDate,
        endDate: item.endDate,
        days: (item as Vacation).days,
        notes: item.notes || ''
      });
    }
    setShowAddModal(true);
  };

  const handleDeleteItem = async (item: Absence | Vacation) => {
    if (!confirm('Er du sikker på at du vil slette denne registreringen?')) return;

    try {
      if (activeTab === 'absence') {
        await firebaseService.deleteAbsence(item.id);
        setSuccess('Fravær slettet');
      } else {
        await firebaseService.deleteVacation(item.id);
        setSuccess('Ferie slettet');
      }
      loadData();
    } catch (error) {
      console.error('Error deleting item:', error);
      setError('Feil ved sletting');
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'sick':
        return <Heart style={{ width: '16px', height: '16px', color: '#ef4444' }} />;
      case 'vacation':
        return <Plane style={{ width: '16px', height: '16px', color: '#3b82f6' }} />;
      case 'personal':
        return <Home style={{ width: '16px', height: '16px', color: '#10b981' }} />;
      default:
        return <BriefcaseIcon style={{ width: '16px', height: '16px', color: '#6b7280' }} />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return { bg: 'var(--green-100)', color: 'var(--green-700)' };
      case 'rejected':
        return { bg: 'var(--red-100)', color: 'var(--red-700)' };
      case 'pending':
        return { bg: 'var(--yellow-100)', color: 'var(--yellow-700)' };
      default:
        return { bg: 'var(--gray-100)', color: 'var(--gray-700)' };
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('nb-NO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const currentData = activeTab === 'absence' ? absences : vacations;
  const filteredData = currentData.filter(item => {
    const matchesSearch = item.employeeName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = selectedType === 'all' || item.type === selectedType;
    const matchesStatus = selectedStatus === 'all' || item.status === selectedStatus;
    return matchesSearch && matchesType && matchesStatus;
  }).sort((a, b) => {
    let comparison = 0;
    switch (sortBy) {
      case 'name':
        comparison = a.employeeName.localeCompare(b.employeeName);
        break;
      case 'status':
        comparison = a.status.localeCompare(b.status);
        break;
      case 'date':
      default:
        comparison = new Date(b.startDate).getTime() - new Date(a.startDate).getTime();
        break;
    }
    return sortOrder === 'asc' ? comparison : -comparison;
  });

  const stats = {
    totalAbsences: absences.length,
    pendingAbsences: absences.filter(a => a.status === 'pending').length,
    approvedAbsences: absences.filter(a => a.status === 'approved').length,
    totalVacations: vacations.length,
    pendingVacations: vacations.filter(v => v.status === 'pending').length,
    approvedVacations: vacations.filter(v => v.status === 'approved').length,
  };

  if (loading) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
        <div className="loading" style={{ margin: '0 auto 1rem' }}></div>
        <p style={{ color: '#666' }}>Laster data...</p>
      </div>
    );
  }

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
          <div className="card-icon">
            <CalendarDays />
          </div>
          <div>
            <h1 className="page-title">📅 Fravær og ferie</h1>
            <p className="page-subtitle">
              Administrer fravær og ferie for ansatte
            </p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'flex', borderBottom: '2px solid var(--gray-200)', gap: '0' }}>
            <button
              onClick={() => setActiveTab('absence')}
              style={{
                padding: '1rem 2rem',
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                borderBottom: activeTab === 'absence' ? '2px solid var(--primary)' : '2px solid transparent',
                color: activeTab === 'absence' ? 'var(--primary)' : 'var(--gray-600)',
                fontWeight: activeTab === 'absence' ? '600' : '500',
                fontSize: 'var(--font-size-base)'
              }}
            >
              <Heart style={{ width: '16px', height: '16px', marginRight: '0.5rem', display: 'inline' }} />
              Fravær
            </button>
            <button
              onClick={() => setActiveTab('vacation')}
              style={{
                padding: '1rem 2rem',
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                borderBottom: activeTab === 'vacation' ? '2px solid var(--primary)' : '2px solid transparent',
                color: activeTab === 'vacation' ? 'var(--primary)' : 'var(--gray-600)',
                fontWeight: activeTab === 'vacation' ? '600' : '500',
                fontSize: 'var(--font-size-base)'
              }}
            >
              <Plane style={{ width: '16px', height: '16px', marginRight: '0.5rem', display: 'inline' }} />
              Ferie
            </button>
          </div>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <span className="badge badge-primary">
            {activeTab === 'absence' ? stats.totalAbsences : stats.totalVacations} totalt
          </span>
          <span className="badge badge-secondary">
            {activeTab === 'absence' ? stats.pendingAbsences : stats.pendingVacations} venter
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
            Registrer {activeTab === 'absence' ? 'fravær' : 'ferie'}
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

      {/* Stats Grid */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-number">{activeTab === 'absence' ? stats.totalAbsences : stats.totalVacations}</div>
          <div className="stat-label">Totalt {activeTab === 'absence' ? 'fravær' : 'ferie'}</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{activeTab === 'absence' ? stats.pendingAbsences : stats.pendingVacations}</div>
          <div className="stat-label">Venter godkjenning</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{activeTab === 'absence' ? stats.approvedAbsences : stats.approvedVacations}</div>
          <div className="stat-label">Godkjent</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">
            {activeTab === 'absence' 
              ? absences.filter(a => a.status === 'rejected').length
              : vacations.filter(v => v.status === 'rejected').length
            }
          </div>
          <div className="stat-label">Avvist</div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <div className="search-container" style={{ flex: '1', minWidth: '300px' }}>
            <Search className="search-icon" />
            <input
              type="text"
              placeholder="Søk etter ansatt..."
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
            {activeTab === 'absence' ? (
              <>
                <option value="sick">Sykdom</option>
                <option value="personal">Personlig</option>
                <option value="other">Annet</option>
              </>
            ) : (
              <>
                <option value="vacation">Ferie</option>
                <option value="sick">Sykdom</option>
                <option value="personal">Personlig</option>
                <option value="other">Annet</option>
              </>
            )}
          </select>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="form-select"
            style={{ minWidth: '120px' }}
          >
            <option value="all">Alle status</option>
            <option value="pending">Venter</option>
            <option value="approved">Godkjent</option>
            <option value="rejected">Avvist</option>
          </select>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'name' | 'date' | 'status')}
            className="form-select"
            style={{ minWidth: '120px' }}
          >
            <option value="date">Dato</option>
            <option value="name">Navn</option>
            <option value="status">Status</option>
          </select>
          <button
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            className="btn btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}
          >
            {sortOrder === 'asc' ? <SortDesc style={{ width: '16px', height: '16px' }} /> : <SortAsc style={{ width: '16px', height: '16px' }} />}
          </button>
        </div>
      </div>

      {/* Main Content */}
      {filteredData.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <CalendarDays style={{ width: '64px', height: '64px', color: '#ccc', margin: '0 auto 1rem' }} />
          <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#333', marginBottom: '0.5rem' }}>
            Ingen {activeTab === 'absence' ? 'fravær' : 'ferie'} funnet
          </h3>
          <p style={{ color: '#666', marginBottom: '1.5rem' }}>
            Du har ingen {activeTab === 'absence' ? 'fravær' : 'ferie'} registrert ennå
          </p>
          <button 
            className="btn btn-primary"
            onClick={() => setShowAddModal(true)}
          >
            <Plus style={{ width: '16px', height: '16px' }} />
            Registrer første {activeTab === 'absence' ? 'fravær' : 'ferie'}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1">
          {filteredData.map((item) => (
            <div key={item.id} className="card">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: '1' }}>
                  <div className="card-icon">
                    {getTypeIcon(item.type)}
                  </div>
                  <div style={{ flex: '1' }}>
                    <h3 style={{ 
                      fontWeight: '600', 
                      color: '#333',
                      fontSize: '1.1rem',
                      marginBottom: '0.25rem'
                    }}>
                      {item.employeeName}
                    </h3>
                    <p style={{ color: '#666', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                      {formatDate(item.startDate)} - {formatDate(item.endDate)}
                      {activeTab === 'vacation' && ` (${(item as Vacation).days} dager)`}
                    </p>
                    {activeTab === 'absence' && (item as Absence).reason && (
                      <p style={{ color: '#666', fontSize: '0.875rem' }}>
                        Årsak: {(item as Absence).reason}
                      </p>
                    )}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ 
                    padding: '0.25rem 0.75rem', 
                    borderRadius: 'var(--radius-sm)', 
                    fontSize: 'var(--font-size-xs)', 
                    fontWeight: '500',
                    ...getStatusColor(item.status)
                  }}>
                    {item.status === 'pending' ? 'Venter' : 
                     item.status === 'approved' ? 'Godkjent' : 'Avvist'}
                  </span>
                  <button className="btn btn-secondary" style={{ padding: '0.5rem' }}>
                    <MoreHorizontal style={{ width: '16px', height: '16px' }} />
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                <button 
                  onClick={() => handleViewItem(item)}
                  className="btn btn-secondary" 
                  style={{ fontSize: '0.75rem', padding: '0.25rem 0.75rem' }}
                >
                  <Eye style={{ width: '14px', height: '14px' }} />
                  Se
                </button>
                <button 
                  onClick={() => handleEditItem(item)}
                  className="btn btn-secondary" 
                  style={{ fontSize: '0.75rem', padding: '0.25rem 0.75rem' }}
                >
                  <Edit style={{ width: '14px', height: '14px' }} />
                  Rediger
                </button>
                <button 
                  onClick={() => handleDeleteItem(item)}
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

      {/* Add Modal */}
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
                {selectedItem ? 'Rediger' : 'Registrer'} {activeTab === 'absence' ? 'fravær' : 'ferie'}
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
                  Ansatt navn
                </label>
                <input
                  type="text"
                  value={activeTab === 'absence' ? newAbsence.employeeName : newVacation.employeeName}
                  onChange={(e) => {
                    if (activeTab === 'absence') {
                      setNewAbsence({...newAbsence, employeeName: e.target.value});
                    } else {
                      setNewVacation({...newVacation, employeeName: e.target.value});
                    }
                  }}
                  style={{ 
                    width: '100%', 
                    padding: '0.75rem', 
                    border: '1px solid var(--gray-300)', 
                    borderRadius: 'var(--radius-lg)', 
                    outline: 'none'
                  }}
                  placeholder="Ansatt navn"
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: 'var(--gray-700)' }}>
                  Type
                </label>
                <select
                  value={activeTab === 'absence' ? newAbsence.type : newVacation.type}
                  onChange={(e) => {
                    if (activeTab === 'absence') {
                      setNewAbsence({...newAbsence, type: e.target.value as any});
                    } else {
                      setNewVacation({...newVacation, type: e.target.value as any});
                    }
                  }}
                  style={{ 
                    width: '100%', 
                    padding: '0.75rem', 
                    border: '1px solid var(--gray-300)', 
                    borderRadius: 'var(--radius-lg)', 
                    outline: 'none'
                  }}
                >
                  {activeTab === 'absence' ? (
                    <>
                      <option value="sick">Sykdom</option>
                      <option value="personal">Personlig</option>
                      <option value="other">Annet</option>
                    </>
                  ) : (
                    <>
                      <option value="vacation">Ferie</option>
                      <option value="sick">Sykdom</option>
                      <option value="personal">Personlig</option>
                      <option value="other">Annet</option>
                    </>
                  )}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: 'var(--gray-700)' }}>
                    Startdato
                  </label>
                  <input
                    type="date"
                    value={activeTab === 'absence' ? newAbsence.startDate : newVacation.startDate}
                    onChange={(e) => {
                      if (activeTab === 'absence') {
                        setNewAbsence({...newAbsence, startDate: e.target.value});
                      } else {
                        setNewVacation({...newVacation, startDate: e.target.value});
                      }
                    }}
                    style={{ 
                      width: '100%', 
                      padding: '0.75rem', 
                      border: '1px solid var(--gray-300)', 
                      borderRadius: 'var(--radius-lg)', 
                      outline: 'none'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: 'var(--gray-700)' }}>
                    Sluttdato
                  </label>
                  <input
                    type="date"
                    value={activeTab === 'absence' ? newAbsence.endDate : newVacation.endDate}
                    onChange={(e) => {
                      if (activeTab === 'absence') {
                        setNewAbsence({...newAbsence, endDate: e.target.value});
                      } else {
                        setNewVacation({...newVacation, endDate: e.target.value});
                      }
                    }}
                    style={{ 
                      width: '100%', 
                      padding: '0.75rem', 
                      border: '1px solid var(--gray-300)', 
                      borderRadius: 'var(--radius-lg)', 
                      outline: 'none'
                    }}
                  />
                </div>
              </div>

              {activeTab === 'absence' && (
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: 'var(--gray-700)' }}>
                    Årsak
                  </label>
                  <input
                    type="text"
                    value={newAbsence.reason}
                    onChange={(e) => setNewAbsence({...newAbsence, reason: e.target.value})}
                    style={{ 
                      width: '100%', 
                      padding: '0.75rem', 
                      border: '1px solid var(--gray-300)', 
                      borderRadius: 'var(--radius-lg)', 
                      outline: 'none'
                    }}
                    placeholder="Årsak til fravær"
                  />
                </div>
              )}

              {activeTab === 'vacation' && (
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: 'var(--gray-700)' }}>
                    Antall dager
                  </label>
                  <input
                    type="number"
                    value={newVacation.days}
                    onChange={(e) => setNewVacation({...newVacation, days: parseInt(e.target.value) || 1})}
                    style={{ 
                      width: '100%', 
                      padding: '0.75rem', 
                      border: '1px solid var(--gray-300)', 
                      borderRadius: 'var(--radius-lg)', 
                      outline: 'none'
                    }}
                    placeholder="1"
                  />
                </div>
              )}

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: 'var(--gray-700)' }}>
                  Notater
                </label>
                <textarea
                  value={activeTab === 'absence' ? newAbsence.notes : newVacation.notes}
                  onChange={(e) => {
                    if (activeTab === 'absence') {
                      setNewAbsence({...newAbsence, notes: e.target.value});
                    } else {
                      setNewVacation({...newVacation, notes: e.target.value});
                    }
                  }}
                  style={{ 
                    width: '100%', 
                    padding: '0.75rem', 
                    border: '1px solid var(--gray-300)', 
                    borderRadius: 'var(--radius-lg)', 
                    outline: 'none',
                    minHeight: '80px',
                    resize: 'vertical'
                  }}
                  placeholder="Ekstra notater..."
                />
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
                onClick={activeTab === 'absence' ? handleCreateAbsence : handleCreateVacation}
                className="btn btn-primary"
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
              >
                <Save style={{ width: '16px', height: '16px' }} />
                {selectedItem ? 'Oppdater' : 'Registrer'} {activeTab === 'absence' ? 'fravær' : 'ferie'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedItem && (
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
            maxWidth: '600px',
            width: '95%',
            maxHeight: '95vh',
            overflow: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
              <div>
                <h2 style={{ fontSize: 'var(--font-size-xl)', fontWeight: '600', color: 'var(--gray-900)' }}>
                  {getTypeIcon(selectedItem.type)}
                  {selectedItem.employeeName}
                </h2>
                <p style={{ color: 'var(--gray-600)', fontSize: 'var(--font-size-sm)' }}>
                  {activeTab === 'absence' ? 'Fravær' : 'Ferie'} detaljer
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

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <strong>Ansatt:</strong> {selectedItem.employeeName}
              </div>
              <div>
                <strong>Type:</strong> {selectedItem.type}
              </div>
              <div>
                <strong>Periode:</strong> {formatDate(selectedItem.startDate)} - {formatDate(selectedItem.endDate)}
                {activeTab === 'vacation' && ` (${(selectedItem as Vacation).days} dager)`}
              </div>
              <div>
                <strong>Status:</strong> 
                <span style={{ 
                  marginLeft: '0.5rem',
                  padding: '0.25rem 0.75rem', 
                  borderRadius: 'var(--radius-sm)', 
                  fontSize: 'var(--font-size-xs)', 
                  fontWeight: '500',
                  ...getStatusColor(selectedItem.status)
                }}>
                  {selectedItem.status === 'pending' ? 'Venter' : 
                   selectedItem.status === 'approved' ? 'Godkjent' : 'Avvist'}
                </span>
              </div>
              {activeTab === 'absence' && (selectedItem as Absence).reason && (
                <div>
                  <strong>Årsak:</strong> {(selectedItem as Absence).reason}
                </div>
              )}
              {selectedItem.notes && (
                <div>
                  <strong>Notater:</strong> {selectedItem.notes}
                </div>
              )}
              {selectedItem.approvedBy && (
                <div>
                  <strong>Godkjent av:</strong> {selectedItem.approvedBy}
                </div>
              )}
              {selectedItem.approvedAt && (
                <div>
                  <strong>Godkjent:</strong> {formatDate(selectedItem.approvedAt)}
                </div>
              )}
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
                  handleEditItem(selectedItem);
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