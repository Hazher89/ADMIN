'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Clock, 
  Plus, 
  Search, 
  Calendar, 
  Users, 
  Settings,
  Edit,
  Trash2,
  MoreHorizontal,
  CheckCircle,
  AlertTriangle,
  Eye,
  Copy,
  Download,
  Filter
} from 'lucide-react';

interface Shift {
  id: string;
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  employees: string[];
  department: string;
  status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled';
  notes?: string;
  createdBy: string;
  createdAt: string;
}

export default function ShiftsPage() {
  const { userProfile } = useAuth();
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    loadShifts();
  }, []);

  const loadShifts = async () => {
    try {
      // Mock data for demonstration
      const mockShifts: Shift[] = [
        {
          id: '1',
          title: 'Morgenskift',
          date: '2024-07-28',
          startTime: '06:00',
          endTime: '14:00',
          employees: ['John Doe', 'Jane Smith', 'Mike Johnson'],
          department: 'Produksjon',
          status: 'scheduled',
          notes: 'Vanlig morgenskift med fokus på kvalitetskontroll',
          createdBy: 'Shift Manager',
          createdAt: '2024-07-25T10:00:00Z'
        },
        {
          id: '2',
          title: 'Kveldsvakt',
          date: '2024-07-28',
          startTime: '14:00',
          endTime: '22:00',
          employees: ['Sarah Wilson', 'Tom Brown', 'Lisa Davis'],
          department: 'Produksjon',
          status: 'scheduled',
          notes: 'Kveldsvakt med vedlikeholdsarbeid',
          createdBy: 'Shift Manager',
          createdAt: '2024-07-25T10:00:00Z'
        },
        {
          id: '3',
          title: 'Natteskift',
          date: '2024-07-28',
          startTime: '22:00',
          endTime: '06:00',
          employees: ['Alex Turner', 'Emma White'],
          department: 'Sikkerhet',
          status: 'in-progress',
          notes: 'Natteskift med sikkerhetsoppgaver',
          createdBy: 'Security Manager',
          createdAt: '2024-07-25T10:00:00Z'
        },
        {
          id: '4',
          title: 'Weekend Vakt',
          date: '2024-07-27',
          startTime: '08:00',
          endTime: '16:00',
          employees: ['David Lee', 'Anna Garcia'],
          department: 'Kundeservice',
          status: 'completed',
          notes: 'Weekend vakt for kundeservice',
          createdBy: 'HR Manager',
          createdAt: '2024-07-24T10:00:00Z'
        },
        {
          id: '5',
          title: 'Holiday Cover',
          date: '2024-07-29',
          startTime: '10:00',
          endTime: '18:00',
          employees: ['Chris Martin', 'Rachel Green'],
          department: 'IT',
          status: 'scheduled',
          notes: 'Holiday cover for IT support',
          createdBy: 'IT Manager',
          createdAt: '2024-07-25T10:00:00Z'
        }
      ];

      setShifts(mockShifts);
    } catch (error) {
      console.error('Error loading shifts:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredShifts = shifts.filter(shift => {
    const matchesSearch = shift.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         shift.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         shift.employees.some(emp => emp.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = selectedStatus === 'all' || shift.status === selectedStatus;
    const matchesDepartment = selectedDepartment === 'all' || shift.department === selectedDepartment;
    return matchesSearch && matchesStatus && matchesDepartment;
  });

  const statuses = ['all', ...Array.from(new Set(shifts.map(shift => shift.status)))];
  const departments = ['all', ...Array.from(new Set(shifts.map(shift => shift.department)))];

  const getStatusColor = (status: Shift['status']) => {
    switch (status) {
      case 'scheduled': return '#3b82f6';
      case 'in-progress': return '#f59e0b';
      case 'completed': return '#10b981';
      case 'cancelled': return '#ef4444';
    }
  };

  const getStatusIcon = (status: Shift['status']) => {
    switch (status) {
      case 'scheduled': return <Clock style={{ width: '16px', height: '16px', color: '#3b82f6' }} />;
      case 'in-progress': return <AlertTriangle style={{ width: '16px', height: '16px', color: '#f59e0b' }} />;
      case 'completed': return <CheckCircle style={{ width: '16px', height: '16px', color: '#10b981' }} />;
      case 'cancelled': return <AlertTriangle style={{ width: '16px', height: '16px', color: '#ef4444' }} />;
    }
  };

  const getShiftDuration = (startTime: string, endTime: string) => {
    const start = new Date(`2000-01-01T${startTime}:00`);
    const end = new Date(`2000-01-01T${endTime}:00`);
    const diffMs = end.getTime() - start.getTime();
    const diffHours = Math.round(diffMs / (1000 * 60 * 60));
    return `${diffHours} timer`;
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
            <h1 className="page-title">⏰ Skiftplan</h1>
            <p className="page-subtitle">
              Administrer skiftplaner og arbeidstider
            </p>
          </div>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <span className="badge badge-primary">
            {shifts.length} skift
          </span>
          <button className="btn btn-secondary" onClick={() => setShowSettings(true)}>
            <Settings style={{ width: '16px', height: '16px' }} />
            Innstillinger
          </button>
          <button className="btn btn-primary">
            <Plus style={{ width: '16px', height: '16px' }} />
            Opprett skift
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <div className="search-container" style={{ flex: '1', minWidth: '300px' }}>
            <Search className="search-icon" />
            <input
              type="text"
              placeholder="Søk i skift..."
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
                 status === 'scheduled' ? 'Planlagt' :
                 status === 'in-progress' ? 'Pågår' :
                 status === 'completed' ? 'Fullført' : 'Kansellert'}
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

      {/* Shifts Grid */}
      <div className="grid grid-cols-3">
        {filteredShifts.map((shift) => (
          <div key={shift.id} className="card">
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', marginBottom: '1rem' }}>
              <div className="card-icon">
                <Clock />
              </div>
              <div style={{ flex: '1' }}>
                <h3 style={{ 
                  fontWeight: '600', 
                  color: '#333',
                  fontSize: '1.1rem',
                  marginBottom: '0.25rem'
                }}>
                  {shift.title}
                </h3>
                <p style={{ color: '#666', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                  {shift.department}
                </p>
              </div>
              <button className="btn btn-secondary" style={{ padding: '0.5rem' }}>
                <MoreHorizontal style={{ width: '16px', height: '16px' }} />
              </button>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <Calendar style={{ width: '14px', height: '14px', color: '#666' }} />
                <span style={{ fontSize: '0.875rem', color: '#666' }}>
                  {new Date(shift.date).toLocaleDateString('no-NO')}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <Clock style={{ width: '14px', height: '14px', color: '#666' }} />
                <span style={{ fontSize: '0.875rem', color: '#666' }}>
                  {shift.startTime} - {shift.endTime} ({getShiftDuration(shift.startTime, shift.endTime)})
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Users style={{ width: '14px', height: '14px', color: '#666' }} />
                <span style={{ fontSize: '0.875rem', color: '#666' }}>
                  {shift.employees.length} ansatte
                </span>
              </div>
            </div>

            {shift.notes && (
              <div style={{ marginBottom: '1rem' }}>
                <p style={{ color: '#666', fontSize: '0.875rem', lineHeight: '1.4' }}>
                  {shift.notes}
                </p>
              </div>
            )}

            <div style={{ marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                {getStatusIcon(shift.status)}
                <span style={{ 
                  fontSize: '0.75rem', 
                  fontWeight: '600',
                  color: getStatusColor(shift.status)
                }}>
                  {shift.status === 'scheduled' ? 'Planlagt' : 
                   shift.status === 'in-progress' ? 'Pågår' :
                   shift.status === 'completed' ? 'Fullført' : 'Kansellert'}
                </span>
              </div>
              <div style={{ fontSize: '0.75rem', color: '#666' }}>
                Opprettet av: {shift.createdBy}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button className="btn btn-secondary" style={{ fontSize: '0.75rem', padding: '0.25rem 0.75rem' }}>
                <Eye style={{ width: '14px', height: '14px' }} />
                Se
              </button>
              <button className="btn btn-secondary" style={{ fontSize: '0.75rem', padding: '0.25rem 0.75rem' }}>
                <Edit style={{ width: '14px', height: '14px' }} />
                Rediger
              </button>
              <button className="btn btn-secondary" style={{ fontSize: '0.75rem', padding: '0.25rem 0.75rem' }}>
                <Copy style={{ width: '14px', height: '14px' }} />
                Kopier
              </button>
              <button className="btn btn-secondary" style={{ 
                fontSize: '0.75rem', 
                padding: '0.25rem 0.5rem',
                color: '#ef4444',
                borderColor: '#ef4444'
              }}>
                <Trash2 style={{ width: '14px', height: '14px' }} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredShifts.length === 0 && !loading && (
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <Clock style={{ width: '64px', height: '64px', color: '#ccc', margin: '0 auto 1rem' }} />
          <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#333', marginBottom: '0.5rem' }}>
            Ingen skift funnet
          </h3>
          <p style={{ color: '#666', marginBottom: '1.5rem' }}>
            {searchTerm || selectedStatus !== 'all' || selectedDepartment !== 'all' 
              ? 'Prøv å endre søkekriteriene' 
              : 'Du har ingen skift planlagt ennå'}
          </p>
          <button className="btn btn-primary">
            <Plus style={{ width: '16px', height: '16px' }} />
            Opprett ditt første skift
          </button>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <div className="loading" style={{ margin: '0 auto 1rem' }}></div>
          <p style={{ color: '#666' }}>Laster skift...</p>
        </div>
      )}

      {/* Settings Modal */}
      {showSettings && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div className="card" style={{ 
            maxWidth: '500px', 
            width: '90%', 
            maxHeight: '80vh',
            overflow: 'auto'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: '600', color: '#333' }}>
                Skiftplan Innstillinger
              </h2>
              <button 
                className="btn btn-secondary" 
                onClick={() => setShowSettings(false)}
                style={{ padding: '0.5rem' }}
              >
                ✕
              </button>
            </div>
            
            <div style={{ marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: '600', color: '#333', marginBottom: '1rem' }}>
                Generelle Innstillinger
              </h3>
              
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#333' }}>
                  Standard skifttid
                </label>
                <select className="form-input" style={{ width: '100%' }}>
                  <option>8 timer</option>
                  <option>10 timer</option>
                  <option>12 timer</option>
                </select>
              </div>
              
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#333' }}>
                  Pause mellom skift
                </label>
                <select className="form-input" style={{ width: '100%' }}>
                  <option>11 timer</option>
                  <option>12 timer</option>
                  <option>14 timer</option>
                </select>
              </div>
              
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#333' }}>
                  Varsling før skift
                </label>
                <select className="form-input" style={{ width: '100%' }}>
                  <option>1 time</option>
                  <option>2 timer</option>
                  <option>4 timer</option>
                </select>
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" onClick={() => setShowSettings(false)}>
                Avbryt
              </button>
              <button className="btn btn-primary">
                Lagre innstillinger
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 