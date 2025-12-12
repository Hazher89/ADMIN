'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { firebaseService, TimeClock, Employee, Department } from '@/lib/firebase-services';
import { 
  Search, Filter, Clock, Users, Building, Calendar, Plus, Edit, Trash2,
  Eye, MoreHorizontal, CheckCircle, AlertTriangle, XCircle, Play, MapPin
} from 'lucide-react';

export default function TimeclockPage() {
  const { userProfile } = useAuth();
  const [timeEntries, setTimeEntries] = useState<TimeClock[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedDepartment, setSelectedDepartment] = useState('all');

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (userProfile) {
      loadData();
    }
  }, [userProfile?.companyId]);

  const loadData = async () => {
    if (!userProfile) return;

    try {
      setLoading(true);
      
      // Load real data from Firebase
      const [timeEntriesData, employeesData, departmentsData] = await Promise.all([
        firebaseService.getTimeClocks(),
        firebaseService.getEmployees(userProfile.companyId),
        firebaseService.getDepartments()
      ]);
      
      setTimeEntries(timeEntriesData);
      setEmployees(employeesData);
      setDepartments(departmentsData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredTimeEntries = timeEntries.filter(entry => {
    const employee = employees.find(emp => emp.id === entry.employeeId);
    const department = departments.find(dept => dept.id === employee?.departmentId);
    
    const matchesSearch = employee?.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         employee?.employeeNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         department?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = selectedStatus === 'all' || getEntryStatus(entry) === selectedStatus;
    const matchesDepartment = selectedDepartment === 'all' || employee?.departmentId === selectedDepartment;
    return matchesSearch && matchesStatus && matchesDepartment;
  });

  const statuses = ['all', ...Array.from(new Set(timeEntries.map(entry => getEntryStatus(entry))))];
  const departmentIds = ['all', ...Array.from(new Set(employees.map(emp => emp.departmentId).filter(Boolean)))];

  const getEntryStatus = (entry: TimeClock): 'active' | 'completed' | 'overtime' | 'late' => {
    if (!entry.clockOutTime) return 'active';
    if (entry.totalHours && entry.totalHours > 8) return 'overtime';
    // Check if clock in was late (after 8:00 AM)
    const clockInTime = new Date(entry.clockInTime);
    const expectedStart = new Date(clockInTime);
    expectedStart.setHours(8, 0, 0, 0);
    if (clockInTime > expectedStart) return 'late';
    return 'completed';
  };

  const getStatusColor = (status: 'active' | 'completed' | 'overtime' | 'late') => {
    switch (status) {
      case 'active': return '#10b981';
      case 'completed': return '#3b82f6';
      case 'overtime': return '#f59e0b';
      case 'late': return '#ef4444';
    }
  };

  const getStatusIcon = (status: 'active' | 'completed' | 'overtime' | 'late') => {
    switch (status) {
      case 'active': return <Play style={{ width: '16px', height: '16px', color: '#10b981' }} />;
      case 'completed': return <CheckCircle style={{ width: '16px', height: '16px', color: '#3b82f6' }} />;
      case 'overtime': return <AlertTriangle style={{ width: '16px', height: '16px', color: '#f59e0b' }} />;
      case 'late': return <AlertTriangle style={{ width: '16px', height: '16px', color: '#ef4444' }} />;
    }
  };

  const getStatusLabel = (status: 'active' | 'completed' | 'overtime' | 'late') => {
    switch (status) {
      case 'active': return 'Aktiv';
      case 'completed': return 'Fullført';
      case 'overtime': return 'Overtid';
      case 'late': return 'Forsinket';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('no-NO');
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('no-NO', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getEmployeeName = (employeeId: string) => {
    const employee = employees.find(emp => emp.id === employeeId);
    return employee?.displayName || 'Ukjent ansatt';
  };

  const getEmployeeNumber = (employeeId: string) => {
    const employee = employees.find(emp => emp.id === employeeId);
    return employee?.employeeNumber || 'N/A';
  };

  const getDepartmentName = (employeeId: string) => {
    const employee = employees.find(emp => emp.id === employeeId);
    const department = departments.find(dept => dept.id === employee?.departmentId);
    return department?.name || 'Ukjent avdeling';
  };

  const getTotalHours = (entry: TimeClock) => {
    if (entry.totalHours) return entry.totalHours.toFixed(1);
    if (entry.clockOutTime) {
      const start = new Date(entry.clockInTime);
      const end = new Date(entry.clockOutTime);
      const diffInHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
      return diffInHours.toFixed(1);
    }
    return '0.0';
  };

  const getActiveEmployees = () => {
    return timeEntries.filter(entry => !entry.clockOutTime).length;
  };

  const getTotalHoursToday = () => {
    const today = new Date().toISOString().split('T')[0];
    const todayEntries = timeEntries.filter(entry => entry.createdAt.split('T')[0] === today);
    return todayEntries.reduce((total, entry) => total + (entry.totalHours || 0), 0);
  };

  // Calculate statistics
  const stats = {
    total: timeEntries.length,
    active: getActiveEmployees(),
    today: timeEntries.filter(entry => entry.createdAt.split('T')[0] === new Date().toISOString().split('T')[0]).length,
    totalHours: getTotalHoursToday()
  };

  const forceClockOut = async (timeClockId: string) => {
    if (!confirm('Er du sikker på at du vil tvinge utstempling?')) return;

    try {
      await firebaseService.clockOut(timeClockId);
      await loadData(); // Reload the data
      alert('Utstempling tvunget');
    } catch (error) {
      console.error('Error forcing clock out:', error);
      alert('Feil ved tvungen utstempling');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Laster stempleklokke...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ 
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
          <h1 style={{
            fontSize: '1.125rem',
            fontWeight: 600,
            color: 'var(--text-color)',
            margin: 0,
            lineHeight: '1.3'
          }}>
            ⏰ Stempleklokke
          </h1>
        </div>
      )}

      {/* Desktop Header */}
      {!isMobile && (
      <div className="page-header">
        <h1 className="page-title">⏰ Stempleklokke</h1>
        <p className="page-subtitle">
          Oversikt over inn- og utstemplinger for alle ansatte
        </p>
        </div>
      )}

      {/* Statistics Section */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
        gap: isMobile ? '0.625rem' : '1rem',
        marginBottom: isMobile ? '0.75rem' : '2rem',
        padding: isMobile ? '0 0.75rem' : undefined
      }}>
        <div style={{
          borderRadius: '0.875rem',
          padding: isMobile ? '0.875rem' : '1rem',
          background: 'var(--card-background)',
          border: '1px solid var(--border-color)',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: isMobile ? '1.5rem' : '1.75rem', fontWeight: 700, color: 'var(--text-color)', marginBottom: '0.25rem' }}>
            {stats.total}
          </div>
          <div style={{ fontSize: isMobile ? '0.75rem' : '0.875rem', color: 'var(--gray-500)', fontWeight: 500 }}>
            TOTALT
          </div>
        </div>
        <div style={{
          borderRadius: '0.875rem',
          padding: isMobile ? '0.875rem' : '1rem',
          background: 'var(--card-background)',
          border: '1px solid var(--border-color)',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: isMobile ? '1.5rem' : '1.75rem', fontWeight: 700, color: '#10b981', marginBottom: '0.25rem' }}>
            {stats.active}
          </div>
          <div style={{ fontSize: isMobile ? '0.75rem' : '0.875rem', color: 'var(--gray-500)', fontWeight: 500 }}>
            AKTIVE
          </div>
        </div>
        <div style={{
          borderRadius: '0.875rem',
          padding: isMobile ? '0.875rem' : '1rem',
          background: 'var(--card-background)',
          border: '1px solid var(--border-color)',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: isMobile ? '1.5rem' : '1.75rem', fontWeight: 700, color: 'var(--text-color)', marginBottom: '0.25rem' }}>
            {stats.today}
          </div>
          <div style={{ fontSize: isMobile ? '0.75rem' : '0.875rem', color: 'var(--gray-500)', fontWeight: 500 }}>
            I DAG
          </div>
        </div>
        <div style={{
          borderRadius: '0.875rem',
          padding: isMobile ? '0.875rem' : '1rem',
          background: 'var(--card-background)',
          border: '1px solid var(--border-color)',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: isMobile ? '1.5rem' : '1.75rem', fontWeight: 700, color: '#3b82f6', marginBottom: '0.25rem' }}>
            {stats.totalHours.toFixed(1)}
          </div>
          <div style={{ fontSize: isMobile ? '0.75rem' : '0.875rem', color: 'var(--gray-500)', fontWeight: 500 }}>
            TIMER
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div style={{
        padding: isMobile ? '0 0.75rem' : undefined,
        marginBottom: isMobile ? '0.75rem' : '2rem'
      }}>
        <div style={{
          borderRadius: '0.875rem',
          padding: isMobile ? '0.75rem' : '1rem',
          background: 'var(--card-background)',
          border: '1px solid var(--border-color)',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          gap: isMobile ? '0.5rem' : '1rem',
          alignItems: isMobile ? 'stretch' : 'center'
        }}>
          <div style={{ position: 'relative', flex: isMobile ? 'none' : 1, width: isMobile ? '100%' : undefined }}>
            <Search style={{
              position: 'absolute',
              left: isMobile ? '0.875rem' : '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--gray-400)',
              width: isMobile ? '18px' : '20px',
              height: isMobile ? '18px' : '20px'
            }} />
          <input
            type="text"
            placeholder="Søk i stempleoppføringer..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: isMobile ? '0.875rem 0.875rem 0.875rem 2.75rem' : '0.75rem 0.75rem 0.75rem 2.5rem',
                border: '1px solid var(--border-color)',
                borderRadius: isMobile ? '0.5rem' : 'var(--radius-lg)',
                outline: 'none',
                fontSize: isMobile ? '16px' : undefined,
                background: 'var(--card-background)'
              }}
          />
        </div>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            style={{
              width: isMobile ? '100%' : 'auto',
              padding: isMobile ? '0.875rem' : '0.75rem 1rem',
              border: '1px solid var(--border-color)',
              borderRadius: isMobile ? '0.5rem' : 'var(--radius-lg)',
              fontSize: isMobile ? '16px' : undefined,
              background: 'var(--card-background)',
              minHeight: isMobile ? '44px' : undefined
            }}
          >
            {statuses.map(status => (
              <option key={status} value={status}>
                {status === 'all' ? 'Alle statuser' : getStatusLabel(status as "active" | "completed" | "overtime" | "late")}
              </option>
            ))}
          </select>

          <select
            value={selectedDepartment}
            onChange={(e) => setSelectedDepartment(e.target.value)}
            style={{
              width: isMobile ? '100%' : 'auto',
              padding: isMobile ? '0.875rem' : '0.75rem 1rem',
              border: '1px solid var(--border-color)',
              borderRadius: isMobile ? '0.5rem' : 'var(--radius-lg)',
              fontSize: isMobile ? '16px' : undefined,
              background: 'var(--card-background)',
              minHeight: isMobile ? '44px' : undefined
            }}
          >
            {departmentIds.map(deptId => (
              <option key={deptId} value={deptId}>
                {deptId === 'all' ? 'Alle avdelinger' : 
                 departments.find(d => d.id === deptId)?.name || 'Ukjent avdeling'}
              </option>
            ))}
          </select>

          {!isMobile && (
            <button className="btn btn-primary" style={{ whiteSpace: 'nowrap' }}>
            <Plus style={{ width: '16px', height: '16px' }} />
              Ny stempleoppføring
            </button>
          )}
        </div>

        {isMobile && (
          <button 
            className="btn btn-primary"
            style={{
              width: '100%',
              marginTop: '0.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              minHeight: '44px'
            }}
          >
            <Plus size={18} />
            Ny stempleoppføring
          </button>
        )}
      </div>

      {/* Time Entries Grid */}
      <div className="time-entries-grid">
        {filteredTimeEntries.length === 0 ? (
          <div className="empty-state">
            <Clock style={{ width: '64px', height: '64px', color: '#9ca3af' }} />
            <h3>Ingen stempleoppføringer funnet</h3>
            <p>Ingen oppføringer matcher søkekriteriene dine.</p>
          </div>
        ) : (
          filteredTimeEntries.map((entry) => {
            const status = getEntryStatus(entry);
            return (
              <div key={entry.id} className="time-entry-card">
                <div className="time-entry-header">
                  <div className="time-entry-status">
                    {getStatusIcon(status)}
                    <span
                      className="status-badge"
                      style={{ backgroundColor: getStatusColor(status) }}
                    >
                      {getStatusLabel(status)}
                    </span>
                  </div>
                  <div className="time-entry-actions">
                    <button className="action-btn" title="Se detaljer">
                      <Eye style={{ width: '16px', height: '16px' }} />
                    </button>
                    <button className="action-btn" title="Rediger">
                      <Edit style={{ width: '16px', height: '16px' }} />
                    </button>
                    {!entry.clockOutTime && (
                      <button
                        onClick={() => forceClockOut(entry.id)}
                        className="action-btn delete"
                        title="Tving utstempling"
                      >
                        <XCircle style={{ width: '16px', height: '16px' }} />
                      </button>
                    )}
                  </div>
                </div>

                <div className="time-entry-content">
                  <div className="time-entry-info">
                    <div className="employee-info">
                      <Users style={{ width: '16px', height: '16px', color: '#6b7280' }} />
                      <span>{getEmployeeName(entry.employeeId)}</span>
                      <span className="employee-number">({getEmployeeNumber(entry.employeeId)})</span>
                    </div>
                    <div className="department-info">
                      <Building style={{ width: '16px', height: '16px', color: '#6b7280' }} />
                      <span>{getDepartmentName(entry.employeeId)}</span>
                    </div>
                  </div>

                  <div className="time-entry-time">
                    <div className="time-item">
                      <Calendar style={{ width: '16px', height: '16px', color: '#6b7280' }} />
                      <span>{formatDate(entry.clockInTime)}</span>
                    </div>
                    <div className="time-item">
                      <Clock style={{ width: '16px', height: '16px', color: '#6b7280' }} />
                      <span>
                        {formatTime(entry.clockInTime)}
                        {entry.clockOutTime && ` - ${formatTime(entry.clockOutTime)}`}
                      </span>
                    </div>
                    <div className="time-item">
                      <span className="total-hours">
                        {getTotalHours(entry)}t
                      </span>
                    </div>
                  </div>

                  {entry.location && (
                    <div className="time-entry-location">
                      <MapPin style={{ width: '16px', height: '16px', color: '#6b7280' }} />
                      <span>{entry.location}</span>
                    </div>
                  )}

                  {entry.notes && (
                    <div className="time-entry-notes">
                      <p>{entry.notes}</p>
                    </div>
                  )}

                  <div className="time-entry-meta">
                    {entry.breakStartTime && entry.breakEndTime && (
                      <span className="break-time">
                        Pause: {formatTime(entry.breakStartTime)} - {formatTime(entry.breakEndTime)}
                      </span>
                    )}
                    <span className="created-at">
                      Opprettet: {formatDate(entry.createdAt)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Stats */}
      <div className="stats-section">
        <div className="stat-card">
          <div className="stat-number">{stats.total}</div>
          <div className="stat-label">Totalt oppføringer</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{stats.active}</div>
          <div className="stat-label">Aktive ansatte</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{stats.today}</div>
          <div className="stat-label">Oppføringer i dag</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{stats.totalHours}</div>
          <div className="stat-label">Timer i dag</div>
        </div>
      </div>
    </div>
  );
} 