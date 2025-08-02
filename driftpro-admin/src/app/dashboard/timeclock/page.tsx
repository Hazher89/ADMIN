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
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedDepartment, setSelectedDepartment] = useState('all');

  useEffect(() => {
    if (userProfile?.companyId) {
      loadData();
    }
  }, [userProfile?.companyId]);

  const loadData = async () => {
    if (!userProfile?.companyId) return;

    try {
      setLoading(true);
      
      // Load real data from Firebase
      const [timeEntriesData, employeesData, departmentsData] = await Promise.all([
        firebaseService.getTimeClocks(userProfile.companyId),
        firebaseService.getEmployees(userProfile.companyId),
        firebaseService.getDepartments(userProfile.companyId)
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
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <h1 className="page-title">⏰ Stempleklokke</h1>
        <p className="page-subtitle">
          Oversikt over inn- og utstemplinger for alle ansatte
        </p>
      </div>

      {/* Filters and Search */}
      <div className="filters-section">
        <div className="search-filter">
          <Search style={{ width: '20px', height: '20px', color: '#6b7280' }} />
          <input
            type="text"
            placeholder="Søk i stempleoppføringer..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="filter-controls">
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="filter-select"
          >
            {statuses.map(status => (
              <option key={status} value={status}>
                {status === 'all' ? 'Alle statuser' : getStatusLabel(status as any)}
              </option>
            ))}
          </select>

          <select
            value={selectedDepartment}
            onChange={(e) => setSelectedDepartment(e.target.value)}
            className="filter-select"
          >
            {departmentIds.map(deptId => (
              <option key={deptId} value={deptId}>
                {deptId === 'all' ? 'Alle avdelinger' : 
                 departments.find(d => d.id === deptId)?.name || 'Ukjent avdeling'}
              </option>
            ))}
          </select>

          <button className="btn btn-primary">
            <Plus style={{ width: '16px', height: '16px' }} />
            Ny stempleoppføring
          </button>
        </div>
      </div>

      {/* Statistics Section */}
      <div className="stats-section">
        <div className="stat-item">
          <div className="stat-number">{stats.total}</div>
          <div className="stat-label">TOTALT</div>
        </div>
        <div className="stat-item">
          <div className="stat-number">{stats.active}</div>
          <div className="stat-label">AKTIVE</div>
        </div>
        <div className="stat-item">
          <div className="stat-number">{stats.today}</div>
          <div className="stat-label">I DAG</div>
        </div>
        <div className="stat-item">
          <div className="stat-number">{stats.totalHours.toFixed(1)}</div>
          <div className="stat-label">TIMER</div>
        </div>
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