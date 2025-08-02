'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { firebaseService, Vacation } from '@/lib/firebase-services';
import { 
  AlertTriangle, 
  Plus, 
  Search, 
  Calendar, 
  User, 
  Trash2,
  CheckCircle,
  Clock,
  AlertCircle
} from 'lucide-react';

export default function AbsencePage() {
  const { userProfile } = useAuth();
  const [absences, setAbsences] = useState<Vacation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedAbsence, setSelectedAbsence] = useState<Vacation | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [newAbsence, setNewAbsence] = useState({
    type: 'sick' as 'sick' | 'personal' | 'other',
    startDate: '',
    endDate: '',
    reason: '',
    notes: ''
  });

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (userProfile?.companyId) {
      loadData();
    }
  }, [userProfile?.companyId]);

  const loadData = useCallback(async () => {
    if (!userProfile?.companyId) return;

    try {
      setLoading(true);
      const data = await firebaseService.getVacations(userProfile.companyId);
      setAbsences(data);
    } catch (error) {
      console.error('Error loading absences:', error);
    } finally {
      setLoading(false);
    }
  }, [userProfile?.companyId]);

  const handleAddAbsence = async () => {
    if (!userProfile?.companyId) return;

    try {
      const absenceData = {
        ...newAbsence,
        employeeId: userProfile.id,
        companyId: userProfile.companyId,
        status: 'pending' as const,
        requestedBy: userProfile.id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await firebaseService.createVacation(absenceData);
      setShowAddModal(false);
      setNewAbsence({
        type: 'sick',
        startDate: '',
        endDate: '',
        reason: '',
        notes: ''
      });
      loadData();
    } catch (error) {
      console.error('Error adding absence:', error);
    }
  };

  const handleUpdateAbsence = async (absenceId: string, status: 'approved' | 'rejected') => {
    try {
      await firebaseService.updateVacation(absenceId, { 
        status,
        approvedBy: userProfile?.id,
        updatedAt: new Date().toISOString()
      });
      loadData();
    } catch (error) {
      console.error('Error updating absence:', error);
    }
  };

  const handleDeleteAbsence = async (absenceId: string) => {
    if (!confirm('Er du sikker på at du vil slette denne fraværsmeldingen?')) return;

    try {
      await firebaseService.updateVacation(absenceId, { status: 'rejected' });
      loadData();
    } catch (error) {
      console.error('Error deleting absence:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'badge-warning';
      case 'approved': return 'badge-success';
      case 'rejected': return 'badge-danger';
      default: return 'badge-secondary';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'sick': return 'badge-danger';
      case 'personal': return 'badge-info';
      case 'other': return 'badge-secondary';
      default: return 'badge-secondary';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('nb-NO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const filteredAbsences = absences.filter(absence => {
    const matchesSearch = absence.notes?.toLowerCase().includes(searchTerm.toLowerCase()) || false;
    const matchesStatus = selectedStatus === 'all' || absence.status === selectedStatus;
    const matchesType = selectedType === 'all' || absence.type === selectedType;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  const getEmployeeName = (employeeId: string) => {
    return `Ansatt ${employeeId.slice(0, 8)}`;
  };

  const stats = {
    total: absences.length,
    pending: absences.filter(a => a.status === 'pending').length,
    approved: absences.filter(a => a.status === 'approved').length,
    rejected: absences.filter(a => a.status === 'rejected').length
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--gray-50)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ 
            width: '48px', 
            height: '48px', 
            border: '2px solid var(--blue-600)', 
            borderTop: '2px solid transparent', 
            borderRadius: '50%', 
            animation: 'spin 1s linear infinite',
            margin: '0 auto'
          }}></div>
          <p style={{ marginTop: '1rem', color: 'var(--gray-600)' }}>Laster fraværsmeldinger...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--gray-50)' }}>
      {/* Header */}
      <div style={{ background: 'var(--white)', boxShadow: 'var(--shadow-sm)', borderBottom: '1px solid var(--gray-200)', padding: '1.5rem 2rem' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1 style={{ fontSize: 'var(--font-size-2xl)', fontWeight: '700', color: 'var(--gray-900)' }}>Fraværsmeldinger</h1>
            <p style={{ color: 'var(--gray-600)', marginTop: '0.25rem' }}>Administrer fraværsmeldinger i bedriften</p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="btn btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <Plus style={{ width: '16px', height: '16px' }} />
            Ny fraværsmelding
          </button>
        </div>
      </div>

      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '2rem 1rem' }}>
        {/* Stats Overview */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <div style={{ padding: '0.75rem', background: 'var(--blue-100)', borderRadius: 'var(--radius-lg)' }}>
                <AlertTriangle style={{ width: '24px', height: '24px', color: 'var(--blue-600)' }} />
              </div>
              <div style={{ marginLeft: '1rem' }}>
                <p style={{ fontSize: 'var(--font-size-sm)', fontWeight: '500', color: 'var(--gray-600)' }}>Totalt</p>
                <p style={{ fontSize: 'var(--font-size-2xl)', fontWeight: '600', color: 'var(--gray-900)' }}>{stats.total}</p>
              </div>
            </div>
          </div>
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <div style={{ padding: '0.75rem', background: 'var(--yellow-100)', borderRadius: 'var(--radius-lg)' }}>
                <Clock style={{ width: '24px', height: '24px', color: 'var(--yellow-600)' }} />
              </div>
              <div style={{ marginLeft: '1rem' }}>
                <p style={{ fontSize: 'var(--font-size-sm)', fontWeight: '500', color: 'var(--gray-600)' }}>Venter</p>
                <p style={{ fontSize: 'var(--font-size-2xl)', fontWeight: '600', color: 'var(--gray-900)' }}>{stats.pending}</p>
              </div>
            </div>
          </div>
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <div style={{ padding: '0.75rem', background: 'var(--green-100)', borderRadius: 'var(--radius-lg)' }}>
                <CheckCircle style={{ width: '24px', height: '24px', color: 'var(--green-600)' }} />
              </div>
              <div style={{ marginLeft: '1rem' }}>
                <p style={{ fontSize: 'var(--font-size-sm)', fontWeight: '500', color: 'var(--gray-600)' }}>Godkjent</p>
                <p style={{ fontSize: 'var(--font-size-2xl)', fontWeight: '600', color: 'var(--gray-900)' }}>{stats.approved}</p>
              </div>
            </div>
          </div>
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <div style={{ padding: '0.75rem', background: 'var(--red-100)', borderRadius: 'var(--radius-lg)' }}>
                <AlertCircle style={{ width: '24px', height: '24px', color: 'var(--red-600)' }} />
              </div>
              <div style={{ marginLeft: '1rem' }}>
                <p style={{ fontSize: 'var(--font-size-sm)', fontWeight: '500', color: 'var(--gray-600)' }}>Avvist</p>
                <p style={{ fontSize: 'var(--font-size-2xl)', fontWeight: '600', color: 'var(--gray-900)' }}>{stats.rejected}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="card" style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: '1rem' }}>
            <div style={{ flex: '1' }}>
              <div style={{ position: 'relative' }}>
                <Search style={{ 
                  position: 'absolute', 
                  left: '12px', 
                  top: '50%', 
                  transform: 'translateY(-50%)', 
                  color: 'var(--gray-400)', 
                  width: '16px', 
                  height: '16px' 
                }} />
                <input
                  type="text"
                  placeholder="Søk i fraværsmeldinger..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{ 
                    width: '100%', 
                    padding: '0.75rem 0.75rem 0.75rem 2.5rem', 
                    border: '1px solid var(--gray-300)', 
                    borderRadius: 'var(--radius-lg)', 
                    outline: 'none'
                  }}
                />
              </div>
            </div>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              style={{ 
                padding: '0.75rem', 
                border: '1px solid var(--gray-300)', 
                borderRadius: 'var(--radius-lg)', 
                outline: 'none',
                minWidth: isMobile ? '100%' : '150px'
              }}
            >
              <option value="all">Alle statuser</option>
              <option value="pending">Venter</option>
              <option value="approved">Godkjent</option>
              <option value="rejected">Avvist</option>
            </select>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              style={{ 
                padding: '0.75rem', 
                border: '1px solid var(--gray-300)', 
                borderRadius: 'var(--radius-lg)', 
                outline: 'none',
                minWidth: isMobile ? '100%' : '150px'
              }}
            >
              <option value="all">Alle typer</option>
              <option value="sick">Sykefravær</option>
              <option value="personal">Personlig fravær</option>
              <option value="other">Annet</option>
            </select>
          </div>
        </div>

        {/* Absence List */}
        <div className="card">
          {filteredAbsences.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center' }}>
              <AlertTriangle style={{ width: '48px', height: '48px', color: 'var(--gray-400)', margin: '0 auto 1rem' }} />
              <h3 style={{ fontSize: 'var(--font-size-lg)', fontWeight: '600', color: 'var(--gray-900)', marginBottom: '0.5rem' }}>
                Ingen fraværsmeldinger
              </h3>
              <p style={{ color: 'var(--gray-600)' }}>
                Det er ingen fraværsmeldinger som matcher søkekriteriene dine.
              </p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead style={{ background: 'var(--gray-50)' }}>
                  <tr>
                    <th style={{ padding: '1rem', textAlign: 'left', fontSize: 'var(--font-size-xs)', fontWeight: '500', color: 'var(--gray-500)', textTransform: 'uppercase' }}>
                      Ansatt
                    </th>
                    <th style={{ padding: '1rem', textAlign: 'left', fontSize: 'var(--font-size-xs)', fontWeight: '500', color: 'var(--gray-500)', textTransform: 'uppercase' }}>
                      Type
                    </th>
                    <th style={{ padding: '1rem', textAlign: 'left', fontSize: 'var(--font-size-xs)', fontWeight: '500', color: 'var(--gray-500)', textTransform: 'uppercase' }}>
                      Periode
                    </th>
                    <th style={{ padding: '1rem', textAlign: 'left', fontSize: 'var(--font-size-xs)', fontWeight: '500', color: 'var(--gray-500)', textTransform: 'uppercase' }}>
                      Status
                    </th>
                    <th style={{ padding: '1rem', textAlign: 'left', fontSize: 'var(--font-size-xs)', fontWeight: '500', color: 'var(--gray-500)', textTransform: 'uppercase' }}>
                      Notater
                    </th>
                    <th style={{ padding: '1rem', textAlign: 'left', fontSize: 'var(--font-size-xs)', fontWeight: '500', color: 'var(--gray-500)', textTransform: 'uppercase' }}>
                      Handlinger
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAbsences.map((absence) => (
                    <tr key={absence.id} style={{ borderBottom: '1px solid var(--gray-200)', cursor: 'pointer' }} 
                        onMouseEnter={(e) => e.currentTarget.style.background = 'var(--gray-50)'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'var(--white)'}>
                      <td style={{ padding: '1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                          <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--gray-300)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <User style={{ width: '20px', height: '20px', color: 'var(--gray-600)' }} />
                          </div>
                          <div style={{ marginLeft: '1rem' }}>
                            <div style={{ fontSize: 'var(--font-size-sm)', fontWeight: '500', color: 'var(--gray-900)' }}>
                              {getEmployeeName(absence.employeeId)}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <span className={`badge ${getTypeColor(absence.type)}`}>
                          {absence.type === 'sick' ? 'Sykefravær' : 
                           absence.type === 'personal' ? 'Personlig fravær' : 'Annet'}
                        </span>
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', fontSize: 'var(--font-size-sm)', color: 'var(--gray-900)' }}>
                          <Calendar style={{ width: '16px', height: '16px', color: 'var(--gray-400)', marginRight: '0.5rem' }} />
                          {formatDate(absence.startDate)} - {formatDate(absence.endDate)}
                        </div>
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <span className={`badge ${getStatusColor(absence.status)}`}>
                          {absence.status === 'pending' ? 'Venter' : 
                           absence.status === 'approved' ? 'Godkjent' : 'Avvist'}
                        </span>
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <div style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 'var(--font-size-sm)', color: 'var(--gray-900)' }}>
                          {absence.notes || 'Ingen notater'}
                        </div>
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          {absence.status === 'pending' && (
                            <>
                              <button
                                onClick={() => handleUpdateAbsence(absence.id, 'approved')}
                                style={{ color: 'var(--green-600)', padding: '0.25rem' }}
                                title="Godkjenn"
                              >
                                <CheckCircle style={{ width: '16px', height: '16px' }} />
                              </button>
                              <button
                                onClick={() => handleUpdateAbsence(absence.id, 'rejected')}
                                style={{ color: 'var(--red-600)', padding: '0.25rem' }}
                                title="Avvis"
                              >
                                <AlertCircle style={{ width: '16px', height: '16px' }} />
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => handleDeleteAbsence(absence.id)}
                            style={{ color: 'var(--red-600)', padding: '0.25rem' }}
                            title="Slett"
                          >
                            <Trash2 style={{ width: '16px', height: '16px' }} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Add Absence Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Ny fraværsmelding</h2>
              <button className="modal-close" onClick={() => setShowAddModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="modal-form-grid">
                <div className="form-field">
                  <label className="form-label">Type fravær</label>
                  <select
                    value={newAbsence.type}
                    onChange={(e) => setNewAbsence({...newAbsence, type: e.target.value as 'sick' | 'personal' | 'other'})}
                    className="form-select-modal"
                    required
                  >
                    <option value="sick">Sykefravær</option>
                    <option value="personal">Personlig fravær</option>
                    <option value="other">Annet</option>
                  </select>
                </div>
                <div className="form-field">
                  <label className="form-label">Startdato</label>
                  <input
                    type="date"
                    value={newAbsence.startDate}
                    onChange={(e) => setNewAbsence({...newAbsence, startDate: e.target.value})}
                    className="form-input-modal"
                    required
                  />
                </div>
                <div className="form-field">
                  <label className="form-label">Sluttdato</label>
                  <input
                    type="date"
                    value={newAbsence.endDate}
                    onChange={(e) => setNewAbsence({...newAbsence, endDate: e.target.value})}
                    className="form-input-modal"
                    required
                  />
                </div>
                <div className="form-field">
                  <label className="form-label">Årsak</label>
                  <input
                    type="text"
                    value={newAbsence.reason}
                    onChange={(e) => setNewAbsence({...newAbsence, reason: e.target.value})}
                    className="form-input-modal"
                    placeholder="Oppgi årsak til fravær"
                    required
                  />
                </div>
                <div className="form-field" style={{ gridColumn: '1 / -1' }}>
                  <label className="form-label">Notater</label>
                  <textarea
                    value={newAbsence.notes}
                    onChange={(e) => setNewAbsence({...newAbsence, notes: e.target.value})}
                    className="form-textarea-modal"
                    rows={3}
                    placeholder="Eventuelle notater"
                  />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button
                onClick={() => setShowAddModal(false)}
                style={{ 
                  padding: '0.75rem 1.5rem', 
                  background: 'var(--gray-300)', 
                  color: 'var(--gray-700)', 
                  border: 'none', 
                  borderRadius: 'var(--radius-lg)', 
                  cursor: 'pointer' 
                }}
              >
                Avbryt
              </button>
              <button
                onClick={handleAddAbsence}
                style={{ 
                  padding: '0.75rem 1.5rem', 
                  background: 'var(--blue-600)', 
                  color: 'var(--white)', 
                  border: 'none', 
                  borderRadius: 'var(--radius-lg)', 
                  cursor: 'pointer' 
                }}
              >
                Send fraværsmelding
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 