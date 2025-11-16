'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { firebaseService, Shift } from '@/lib/firebase-services';
import { 
  Calendar, 
  Plus, 
  Search, 
  Clock, 
  User, 
  Trash2,
  CheckCircle,
  AlertCircle,
  Filter,
  Download,
  Eye,
  Edit,
  MoreHorizontal,
  Play,
  Pause,
  StopCircle
} from 'lucide-react';

export default function ShiftsPage() {
  const { userProfile } = useAuth();
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedShift, setSelectedShift] = useState<Shift | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [newShift, setNewShift] = useState({
    employeeId: '',
    departmentId: '',
    startTime: '',
    endTime: '',
    type: 'regular' as 'regular' | 'overtime' | 'night' | 'weekend',
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

  const loadData = async () => {
    if (!userProfile?.companyId) return;

    try {
      setLoading(true);
      const data = await firebaseService.getShifts(userProfile.companyId);
      setShifts(data);
    } catch (error) {
      console.error('Error loading shifts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddShift = async () => {
    if (!userProfile?.companyId) return;

    try {
      const shiftData = {
        ...newShift,
        companyId: userProfile.companyId,
        status: 'scheduled' as const,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await firebaseService.createShift(shiftData);
      setShowAddModal(false);
      setNewShift({
        employeeId: '',
        departmentId: '',
        startTime: '',
        endTime: '',
        type: 'regular',
        notes: ''
      });
      loadData();
    } catch (error) {
      console.error('Error adding shift:', error);
    }
  };

  const handleUpdateShift = async (shiftId: string, status: 'scheduled' | 'in_progress' | 'completed') => {
    try {
      await firebaseService.updateShift(shiftId, { 
        status, 
        updatedAt: new Date().toISOString() 
      });
      loadData();
    } catch (error) {
      console.error('Error updating shift:', error);
    }
  };

  const handleDeleteShift = async (shiftId: string) => {
    if (confirm('Er du sikker på at du vil slette denne vakten?')) {
      try {
        await firebaseService.updateShift(shiftId, { status: 'cancelled' });
        loadData();
      } catch (error) {
        console.error('Error deleting shift:', error);
      }
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'var(--blue-600)';
      case 'in-progress': return 'var(--yellow-600)';
      case 'completed': return 'var(--green-600)';
      default: return 'var(--gray-600)';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'scheduled': return <Clock style={{ width: '16px', height: '16px' }} />;
      case 'in-progress': return <Play style={{ width: '16px', height: '16px' }} />;
      case 'completed': return <CheckCircle style={{ width: '16px', height: '16px' }} />;
      default: return <AlertCircle style={{ width: '16px', height: '16px' }} />;
    }
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('nb-NO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filteredShifts = shifts.filter(shift => {
    const matchesSearch = (shift.employeeId || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (shift.notes || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = selectedStatus === 'all' || shift.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: shifts.length,
    scheduled: shifts.filter(s => s.status === 'scheduled').length,
    inProgress: shifts.filter(s => s.status === 'in_progress').length,
    completed: shifts.filter(s => s.status === 'completed').length
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
          <p style={{ marginTop: '1rem', color: 'var(--gray-600)' }}>Laster vakter...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'var(--background-color)',
      width: '100%',
      overflowX: 'hidden',
      padding: isMobile ? '0' : undefined
    }}>
      {/* Mobile Header */}
      {isMobile && (
        <div style={{
          padding: '0.625rem 0.75rem 0.5rem',
          marginBottom: '0.5rem',
          borderBottom: '0.5px solid var(--border-color)',
          background: 'var(--card-background)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <h1 style={{
                fontSize: '1.125rem',
                fontWeight: 600,
                color: 'var(--text-color)',
                margin: 0,
                lineHeight: '1.3'
              }}>
                Vakter
              </h1>
              <p style={{
                fontSize: '0.8125rem',
                color: 'var(--gray-500)',
                margin: 0
              }}>
                {shifts.length} vakter
              </p>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              style={{
                padding: '0.625rem',
                borderRadius: '0.625rem',
                background: 'var(--primary)',
                color: 'white',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minWidth: '44px',
                minHeight: '44px'
              }}
            >
              <Plus size={20} />
            </button>
          </div>
        </div>
      )}

      {/* Desktop Header */}
      {!isMobile && (
        <div style={{ background: 'var(--white)', boxShadow: 'var(--shadow-sm)', borderBottom: '1px solid var(--gray-200)', padding: '1.5rem 2rem' }}>
          <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <h1 style={{ fontSize: 'var(--font-size-2xl)', fontWeight: '700', color: 'var(--gray-900)' }}>Vakter</h1>
              <p style={{ color: 'var(--gray-600)', marginTop: '0.25rem' }}>Administrer vakter og arbeidstider</p>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="btn btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              <Plus style={{ width: '16px', height: '16px' }} />
              Ny vakt
            </button>
          </div>
        </div>
      )}

      <div style={{ 
        maxWidth: '1280px', 
        margin: '0 auto', 
        padding: isMobile ? '0.5rem 0.75rem' : '2rem 1rem',
        width: '100%'
      }}>
        {/* Stats Overview */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(auto-fit, minmax(200px, 1fr))', 
          gap: isMobile ? '0.625rem' : '1rem', 
          marginBottom: isMobile ? '0.75rem' : '2rem' 
        }}>
          <div style={{
            borderRadius: '0.875rem',
            padding: isMobile ? '0.875rem' : '1rem',
            background: 'var(--card-background)',
            border: '1px solid var(--border-color)',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
            display: 'flex',
            alignItems: 'center',
            gap: isMobile ? '0.75rem' : '1rem'
          }}>
            <div style={{ 
              padding: isMobile ? '0.625rem' : '0.75rem', 
              background: 'rgba(59, 130, 246, 0.1)', 
              borderRadius: '0.625rem',
              flexShrink: 0
            }}>
              <Calendar size={isMobile ? 20 : 24} style={{ color: '#3b82f6' }} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ 
                fontSize: isMobile ? '0.75rem' : 'var(--font-size-sm)', 
                fontWeight: 500, 
                color: 'var(--gray-500)',
                margin: 0,
                marginBottom: '0.25rem'
              }}>Totalt</p>
              <p style={{ 
                fontSize: isMobile ? '1.5rem' : 'var(--font-size-2xl)', 
                fontWeight: 600, 
                color: 'var(--text-color)',
                margin: 0
              }}>{stats.total}</p>
            </div>
          </div>
          <div style={{
            borderRadius: '0.875rem',
            padding: isMobile ? '0.875rem' : '1rem',
            background: 'var(--card-background)',
            border: '1px solid var(--border-color)',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
            display: 'flex',
            alignItems: 'center',
            gap: isMobile ? '0.75rem' : '1rem'
          }}>
            <div style={{ 
              padding: isMobile ? '0.625rem' : '0.75rem', 
              background: 'rgba(59, 130, 246, 0.1)', 
              borderRadius: '0.625rem',
              flexShrink: 0
            }}>
              <Clock size={isMobile ? 20 : 24} style={{ color: '#3b82f6' }} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ 
                fontSize: isMobile ? '0.75rem' : 'var(--font-size-sm)', 
                fontWeight: 500, 
                color: 'var(--gray-500)',
                margin: 0,
                marginBottom: '0.25rem'
              }}>Planlagt</p>
              <p style={{ 
                fontSize: isMobile ? '1.5rem' : 'var(--font-size-2xl)', 
                fontWeight: 600, 
                color: 'var(--text-color)',
                margin: 0
              }}>{stats.scheduled}</p>
            </div>
          </div>
          <div style={{
            borderRadius: '0.875rem',
            padding: isMobile ? '0.875rem' : '1rem',
            background: 'var(--card-background)',
            border: '1px solid var(--border-color)',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
            display: 'flex',
            alignItems: 'center',
            gap: isMobile ? '0.75rem' : '1rem'
          }}>
            <div style={{ 
              padding: isMobile ? '0.625rem' : '0.75rem', 
              background: 'rgba(245, 158, 11, 0.1)', 
              borderRadius: '0.625rem',
              flexShrink: 0
            }}>
              <Play size={isMobile ? 20 : 24} style={{ color: '#f59e0b' }} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ 
                fontSize: isMobile ? '0.75rem' : 'var(--font-size-sm)', 
                fontWeight: 500, 
                color: 'var(--gray-500)',
                margin: 0,
                marginBottom: '0.25rem'
              }}>Pågår</p>
              <p style={{ 
                fontSize: isMobile ? '1.5rem' : 'var(--font-size-2xl)', 
                fontWeight: 600, 
                color: 'var(--text-color)',
                margin: 0
              }}>{stats.inProgress}</p>
            </div>
          </div>
          <div style={{
            borderRadius: '0.875rem',
            padding: isMobile ? '0.875rem' : '1rem',
            background: 'var(--card-background)',
            border: '1px solid var(--border-color)',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
            display: 'flex',
            alignItems: 'center',
            gap: isMobile ? '0.75rem' : '1rem'
          }}>
            <div style={{ 
              padding: isMobile ? '0.625rem' : '0.75rem', 
              background: 'rgba(34, 197, 94, 0.1)', 
              borderRadius: '0.625rem',
              flexShrink: 0
            }}>
              <CheckCircle size={isMobile ? 20 : 24} style={{ color: '#22c55e' }} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ 
                fontSize: isMobile ? '0.75rem' : 'var(--font-size-sm)', 
                fontWeight: 500, 
                color: 'var(--gray-500)',
                margin: 0,
                marginBottom: '0.25rem'
              }}>Fullført</p>
              <p style={{ 
                fontSize: isMobile ? '1.5rem' : 'var(--font-size-2xl)', 
                fontWeight: 600, 
                color: 'var(--text-color)',
                margin: 0
              }}>{stats.completed}</p>
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
                  placeholder="Søk i vakter..."
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
              <option value="scheduled">Planlagt</option>
              <option value="in-progress">Pågår</option>
              <option value="completed">Fullført</option>
            </select>
          </div>
        </div>

        {/* Shifts List */}
        <div className="card">
          {filteredShifts.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center' }}>
              <Calendar style={{ width: '48px', height: '48px', color: 'var(--gray-400)', margin: '0 auto 1rem' }} />
              <h3 style={{ fontSize: 'var(--font-size-lg)', fontWeight: '600', color: 'var(--gray-900)', marginBottom: '0.5rem' }}>
                Ingen vakter
              </h3>
              <p style={{ color: 'var(--gray-600)' }}>
                Det er ingen vakter som matcher søkekriteriene dine.
              </p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead style={{ background: 'var(--gray-50)' }}>
                  <tr>
                    <th style={{ padding: '1rem', textAlign: 'left', fontSize: 'var(--font-size-xs)', fontWeight: '500', color: 'var(--gray-500)', textTransform: 'uppercase' }}>
                      Tittel
                    </th>
                    <th style={{ padding: '1rem', textAlign: 'left', fontSize: 'var(--font-size-xs)', fontWeight: '500', color: 'var(--gray-500)', textTransform: 'uppercase' }}>
                      Start
                    </th>
                    <th style={{ padding: '1rem', textAlign: 'left', fontSize: 'var(--font-size-xs)', fontWeight: '500', color: 'var(--gray-500)', textTransform: 'uppercase' }}>
                      Slutt
                    </th>
                    <th style={{ padding: '1rem', textAlign: 'left', fontSize: 'var(--font-size-xs)', fontWeight: '500', color: 'var(--gray-500)', textTransform: 'uppercase' }}>
                      Status
                    </th>
                    <th style={{ padding: '1rem', textAlign: 'left', fontSize: 'var(--font-size-xs)', fontWeight: '500', color: 'var(--gray-500)', textTransform: 'uppercase' }}>
                      Lokasjon
                    </th>
                    <th style={{ padding: '1rem', textAlign: 'left', fontSize: 'var(--font-size-xs)', fontWeight: '500', color: 'var(--gray-500)', textTransform: 'uppercase' }}>
                      Handlinger
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredShifts.map((shift) => (
                    <tr key={shift.id} style={{ borderBottom: '1px solid var(--gray-100)' }}>
                      <td style={{ padding: '1rem' }}>
                        <div>
                          <p style={{ fontWeight: '500', color: 'var(--gray-900)' }}>{shift.title}</p>
                          {shift.description && (
                            <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--gray-600)', marginTop: '0.25rem' }}>
                              {shift.description}
                            </p>
                          )}
                        </div>
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <p style={{ color: 'var(--gray-900)' }}>{formatDateTime(shift.startTime)}</p>
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <p style={{ color: 'var(--gray-900)' }}>{formatDateTime(shift.endTime)}</p>
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <div style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: '0.5rem',
                          padding: '0.25rem 0.75rem',
                          borderRadius: 'var(--radius-full)',
                          background: 'var(--gray-100)',
                          width: 'fit-content'
                        }}>
                          {getStatusIcon(shift.status)}
                          <span style={{ 
                            fontSize: 'var(--font-size-sm)', 
                            fontWeight: '500', 
                            color: getStatusColor(shift.status) 
                          }}>
                            {shift.status === 'scheduled' ? 'Planlagt' : 
                             shift.status === 'in-progress' ? 'Pågår' : 
                             shift.status === 'completed' ? 'Fullført' : shift.status}
                          </span>
                        </div>
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <p style={{ color: 'var(--gray-900)' }}>{shift.location || '-'}</p>
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button
                            onClick={() => {
                              setSelectedShift(shift);
                              setShowEditModal(true);
                            }}
                            style={{ 
                              padding: '0.5rem', 
                              borderRadius: 'var(--radius-md)', 
                              border: '1px solid var(--gray-300)',
                              background: 'var(--white)',
                              cursor: 'pointer'
                            }}
                          >
                            <Edit style={{ width: '16px', height: '16px', color: 'var(--gray-600)' }} />
                          </button>
                          <button
                            onClick={() => handleDeleteShift(shift.id)}
                            style={{ 
                              padding: '0.5rem', 
                              borderRadius: 'var(--radius-md)', 
                              border: '1px solid var(--red-300)',
                              background: 'var(--white)',
                              cursor: 'pointer'
                            }}
                          >
                            <Trash2 style={{ width: '16px', height: '16px', color: 'var(--red-600)' }} />
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
          <div className="card" style={{ width: '90%', maxWidth: '500px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: 'var(--font-size-xl)', fontWeight: '600', color: 'var(--gray-900)' }}>Ny vakt</h2>
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
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: 'var(--gray-700)' }}>
                  Tittel *
                </label>
                <input
                  type="text"
                  value={newShift.title}
                  onChange={(e) => setNewShift({...newShift, title: e.target.value})}
                  style={{ 
                    width: '100%', 
                    padding: '0.75rem', 
                    border: '1px solid var(--gray-300)', 
                    borderRadius: 'var(--radius-lg)', 
                    outline: 'none'
                  }}
                  placeholder="Vakt tittel"
                />
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: 'var(--gray-700)' }}>
                  Beskrivelse
                </label>
                <textarea
                  value={newShift.description}
                  onChange={(e) => setNewShift({...newShift, description: e.target.value})}
                  style={{ 
                    width: '100%', 
                    padding: '0.75rem', 
                    border: '1px solid var(--gray-300)', 
                    borderRadius: 'var(--radius-lg)', 
                    outline: 'none',
                    minHeight: '100px',
                    resize: 'vertical'
                  }}
                  placeholder="Beskrivelse av vakten"
                />
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: 'var(--gray-700)' }}>
                    Start tid *
                  </label>
                  <input
                    type="datetime-local"
                    value={newShift.startTime}
                    onChange={(e) => setNewShift({...newShift, startTime: e.target.value})}
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
                    Slutt tid *
                  </label>
                  <input
                    type="datetime-local"
                    value={newShift.endTime}
                    onChange={(e) => setNewShift({...newShift, endTime: e.target.value})}
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
              
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: 'var(--gray-700)' }}>
                  Lokasjon
                </label>
                <input
                  type="text"
                  value={newShift.location}
                  onChange={(e) => setNewShift({...newShift, location: e.target.value})}
                  style={{ 
                    width: '100%', 
                    padding: '0.75rem', 
                    border: '1px solid var(--gray-300)', 
                    borderRadius: 'var(--radius-lg)', 
                    outline: 'none'
                  }}
                  placeholder="Arbeidslokasjon"
                />
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: 'var(--gray-700)' }}>
                  Notater
                </label>
                <textarea
                  value={newShift.notes}
                  onChange={(e) => setNewShift({...newShift, notes: e.target.value})}
                  style={{ 
                    width: '100%', 
                    padding: '0.75rem', 
                    border: '1px solid var(--gray-300)', 
                    borderRadius: 'var(--radius-lg)', 
                    outline: 'none',
                    minHeight: '80px',
                    resize: 'vertical'
                  }}
                  placeholder="Ekstra notater"
                />
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
              <button
                onClick={() => setShowAddModal(false)}
                style={{ 
                  flex: '1',
                  padding: '0.75rem', 
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
                onClick={handleAddShift}
                disabled={!newShift.title || !newShift.startTime || !newShift.endTime}
                className="btn btn-primary"
                style={{ flex: '1' }}
              >
                Opprett vakt
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 