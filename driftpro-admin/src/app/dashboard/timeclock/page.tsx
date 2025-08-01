'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Clock, 
  Search, 
  Calendar, 
  Users, 
  BarChart3,
  Download,
  Filter,
  Play,
  Pause,
  CheckCircle,
  AlertTriangle,
  Eye,
  Edit,
  MoreHorizontal,
  TrendingUp,
  TrendingDown
} from 'lucide-react';

interface TimeEntry {
  id: string;
  employeeName: string;
  employeeId: string;
  date: string;
  clockIn: string;
  clockOut?: string;
  totalHours?: number;
  status: 'active' | 'completed' | 'overtime' | 'late';
  department: string;
  location: string;
  notes?: string;
}

export default function TimeclockPage() {
  const { userProfile } = useAuth();
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedDepartment, setSelectedDepartment] = useState('all');

  useEffect(() => {
    loadTimeEntries();
  }, []);

  const loadTimeEntries = async () => {
    try {
      // Mock data for demonstration
      const mockTimeEntries: TimeEntry[] = [
        {
          id: '1',
          employeeName: 'John Doe',
          employeeId: 'EMP001',
          date: '2024-07-28',
          clockIn: '08:00',
          clockOut: '16:00',
          totalHours: 8,
          status: 'completed',
          department: 'Produksjon',
          location: 'Hovedfabrikk',
          notes: 'Vanlig arbeidsdag'
        },
        {
          id: '2',
          employeeName: 'Jane Smith',
          employeeId: 'EMP002',
          date: '2024-07-28',
          clockIn: '07:45',
          clockOut: '16:30',
          totalHours: 8.75,
          status: 'overtime',
          department: 'Kvalitetskontroll',
          location: 'Kontrollrom',
          notes: 'Ekstra tid for kvalitetskontroll'
        },
        {
          id: '3',
          employeeName: 'Mike Johnson',
          employeeId: 'EMP003',
          date: '2024-07-28',
          clockIn: '08:30',
          status: 'active',
          department: 'IT',
          location: 'Kontor',
          notes: 'På jobb'
        },
        {
          id: '4',
          employeeName: 'Sarah Wilson',
          employeeId: 'EMP004',
          date: '2024-07-28',
          clockIn: '08:15',
          clockOut: '17:00',
          totalHours: 8.75,
          status: 'late',
          department: 'HR',
          location: 'Kontor',
          notes: 'Forsinket på grunn av trafikk'
        },
        {
          id: '5',
          employeeName: 'Tom Brown',
          employeeId: 'EMP005',
          date: '2024-07-28',
          clockIn: '06:00',
          clockOut: '14:00',
          totalHours: 8,
          status: 'completed',
          department: 'Vedlikehold',
          location: 'Maskinrom',
          notes: 'Morgenskift'
        }
      ];

      setTimeEntries(mockTimeEntries);
    } catch (error) {
      console.error('Error loading time entries:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredTimeEntries = timeEntries.filter(entry => {
    const matchesSearch = entry.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         entry.employeeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         entry.department.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = selectedStatus === 'all' || entry.status === selectedStatus;
    const matchesDepartment = selectedDepartment === 'all' || entry.department === selectedDepartment;
    return matchesSearch && matchesStatus && matchesDepartment;
  });

  const statuses = ['all', ...Array.from(new Set(timeEntries.map(entry => entry.status)))];
  const departments = ['all', ...Array.from(new Set(timeEntries.map(entry => entry.department)))];

  const getStatusColor = (status: TimeEntry['status']) => {
    switch (status) {
      case 'active': return '#10b981';
      case 'completed': return '#3b82f6';
      case 'overtime': return '#f59e0b';
      case 'late': return '#ef4444';
    }
  };

  const getStatusIcon = (status: TimeEntry['status']) => {
    switch (status) {
      case 'active': return <Play style={{ width: '16px', height: '16px', color: '#10b981' }} />;
      case 'completed': return <CheckCircle style={{ width: '16px', height: '16px', color: '#3b82f6' }} />;
      case 'overtime': return <TrendingUp style={{ width: '16px', height: '16px', color: '#f59e0b' }} />;
      case 'late': return <AlertTriangle style={{ width: '16px', height: '16px', color: '#ef4444' }} />;
    }
  };

  const getActiveEmployees = () => {
    return timeEntries.filter(entry => entry.status === 'active').length;
  };

  const getTotalHoursToday = () => {
    return timeEntries
      .filter(entry => entry.totalHours)
      .reduce((sum, entry) => sum + (entry.totalHours || 0), 0);
  };

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
          <div className="card-icon">
            <Clock />
          </div>
          <div>
            <h1 className="page-title">⏰ Stempleklokke</h1>
            <p className="page-subtitle">
              Oversikt over ansattes arbeidstider og stempletider
            </p>
          </div>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <span className="badge badge-primary">
            {getActiveEmployees()} aktive
          </span>
          <span className="badge badge-secondary">
            {getTotalHoursToday().toFixed(1)} timer i dag
          </span>
          <button className="btn btn-secondary">
            <Download style={{ width: '16px', height: '16px' }} />
            Eksporter
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-number">{timeEntries.length}</div>
          <div className="stat-label">Totalt i dag</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{getActiveEmployees()}</div>
          <div className="stat-label">Aktive nå</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{getTotalHoursToday().toFixed(1)}</div>
          <div className="stat-label">Timer i dag</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">
            {timeEntries.filter(entry => entry.status === 'overtime').length}
          </div>
          <div className="stat-label">Overtid</div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <div className="search-container" style={{ flex: '1', minWidth: '300px' }}>
            <Search className="search-icon" />
            <input
              type="text"
              placeholder="Søk i stempletider..."
              className="search-input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <select
            className="form-input"
            style={{ width: '150px' }}
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
          >
            {statuses.map(status => (
              <option key={status} value={status}>
                {status === 'all' ? 'Alle statuser' : 
                 status === 'active' ? 'Aktive' :
                 status === 'completed' ? 'Fullført' :
                 status === 'overtime' ? 'Overtid' : 'Forsinket'}
              </option>
            ))}
          </select>

          <select
            className="form-input"
            style={{ width: '150px' }}
            value={selectedDepartment}
            onChange={(e) => setSelectedDepartment(e.target.value)}
          >
            {departments.map(department => (
              <option key={department} value={department}>
                {department === 'all' ? 'Alle avdelinger' : department}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Time Entries List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {filteredTimeEntries.map((entry) => (
          <div key={entry.id} className="card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ marginTop: '0.25rem' }}>
                {getStatusIcon(entry.status)}
              </div>
              
              <div style={{ flex: '1' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
                  <h3 style={{ 
                    fontWeight: '600', 
                    color: '#333',
                    fontSize: '1rem'
                  }}>
                    {entry.employeeName}
                  </h3>
                  
                  <span className="badge badge-secondary" style={{ fontSize: '0.625rem' }}>
                    {entry.employeeId}
                  </span>
                  
                  <span className="badge badge-secondary" style={{ fontSize: '0.625rem' }}>
                    {entry.department}
                  </span>
                </div>
                
                <div style={{ marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <Calendar style={{ width: '14px', height: '14px', color: '#666' }} />
                    <span style={{ fontSize: '0.875rem', color: '#666' }}>
                      {new Date(entry.date).toLocaleDateString('no-NO')}
                    </span>
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <Clock style={{ width: '14px', height: '14px', color: '#666' }} />
                    <span style={{ fontSize: '0.875rem', color: '#666' }}>
                      <strong>Inn:</strong> {entry.clockIn}
                      {entry.clockOut && (
                        <> • <strong>Ut:</strong> {entry.clockOut}</>
                      )}
                    </span>
                  </div>
                  
                  {entry.totalHours && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                      <BarChart3 style={{ width: '14px', height: '14px', color: '#666' }} />
                      <span style={{ fontSize: '0.875rem', color: '#666' }}>
                        <strong>Totalt:</strong> {entry.totalHours} timer
                      </span>
                    </div>
                  )}
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Users style={{ width: '14px', height: '14px', color: '#666' }} />
                    <span style={{ fontSize: '0.875rem', color: '#666' }}>
                      {entry.location}
                    </span>
                  </div>
                </div>
                
                {entry.notes && (
                  <div style={{ marginBottom: '1rem' }}>
                    <p style={{ color: '#666', fontSize: '0.875rem', lineHeight: '1.4' }}>
                      {entry.notes}
                    </p>
                  </div>
                )}
              </div>
              
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button className="btn btn-secondary" style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}>
                  <Eye style={{ width: '14px', height: '14px' }} />
                </button>
                <button className="btn btn-secondary" style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}>
                  <Edit style={{ width: '14px', height: '14px' }} />
                </button>
                <button className="btn btn-secondary" style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}>
                  <MoreHorizontal style={{ width: '14px', height: '14px' }} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredTimeEntries.length === 0 && !loading && (
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <Clock style={{ width: '64px', height: '64px', color: '#ccc', margin: '0 auto 1rem' }} />
          <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#333', marginBottom: '0.5rem' }}>
            Ingen stempletider funnet
          </h3>
          <p style={{ color: '#666' }}>
            {searchTerm || selectedStatus !== 'all' || selectedDepartment !== 'all' 
              ? 'Prøv å endre søkekriteriene' 
              : 'Ingen stempletider registrert i dag'}
          </p>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <div className="loading" style={{ margin: '0 auto 1rem' }}></div>
          <p style={{ color: '#666' }}>Laster stempletider...</p>
        </div>
      )}
    </div>
  );
} 