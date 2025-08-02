'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { firebaseService, Department, Employee } from '@/lib/firebase-services';
import { 
  Building, 
  Plus, 
  Search, 
  Users, 
  User, 
  MapPin,
  Edit,
  Trash2,
  MoreHorizontal,
  CheckCircle,
  Clock,
  AlertTriangle,
  Eye,
  Settings,
  BarChart3,
  TrendingUp
} from 'lucide-react';



export default function DepartmentsPage() {
  const { userProfile } = useAuth();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newDepartment, setNewDepartment] = useState({
    name: '',
    description: '',
    location: '',
    budget: 0,
    managerId: ''
  });
  const [employees, setEmployees] = useState<Employee[]>([]);

  useEffect(() => {
    if (userProfile?.companyId) {
      loadDepartments();
      loadEmployees();
    }
  }, [userProfile?.companyId]);

  const loadDepartments = async () => {
    if (!userProfile?.companyId) return;

    try {
      setLoading(true);
      const data = await firebaseService.getDepartments(userProfile.companyId);
      setDepartments(data);
    } catch (error) {
      console.error('Error loading departments:', error);
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

  const filteredDepartments = departments.filter(department => {
    const matchesSearch = department.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (department.description?.toLowerCase().includes(searchTerm.toLowerCase()) || false);
    return matchesSearch;
  });

  const getTotalEmployees = () => {
    return departments.reduce((sum, dept) => sum + (dept.employeeCount || 0), 0);
  };

  const getTotalBudget = () => {
    return departments.reduce((sum, dept) => sum + (dept.budget || 0), 0);
  };

  const getManagerName = (managerId: string) => {
    const manager = employees.find(emp => emp.id === managerId);
    return manager ? manager.displayName : 'Ikke tildelt';
  };

  const handleAddDepartment = async () => {
    if (!userProfile?.companyId) return;

    try {
      await firebaseService.createDepartment({
        name: newDepartment.name,
        description: newDepartment.description,
        location: newDepartment.location,
        budget: newDepartment.budget,
        managerId: newDepartment.managerId || undefined,
        companyId: userProfile.companyId
      });

      setShowAddModal(false);
      setNewDepartment({
        name: '',
        description: '',
        location: '',
        budget: 0,
        managerId: ''
      });
      loadDepartments();
    } catch (error) {
      console.error('Error adding department:', error);
      alert('Failed to add department');
    }
  };

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
          <div className="card-icon">
            <Building />
          </div>
          <div>
            <h1 className="page-title">🏢 Avdelinger</h1>
            <p className="page-subtitle">
              Administrer bedriftens avdelinger og organisasjonsstruktur
            </p>
          </div>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <span className="badge badge-primary">
            {departments.length} avdelinger
          </span>
          <span className="badge badge-secondary">
            {getTotalEmployees()} ansatte
          </span>
          <button 
            className="btn btn-primary"
            onClick={() => setShowAddModal(true)}
          >
            <Plus style={{ width: '16px', height: '16px' }} />
            Opprett avdeling
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-number">{departments.length}</div>
          <div className="stat-label">Totalt avdelinger</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{getTotalEmployees()}</div>
          <div className="stat-label">Totalt ansatte</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">
            {departments.length}
          </div>
          <div className="stat-label">Aktive avdelinger</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">
            {getTotalBudget().toLocaleString()} kr
          </div>
          <div className="stat-label">Total budsjett</div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <div className="search-container" style={{ flex: '1', minWidth: '300px' }}>
            <Search className="search-icon" />
            <input
              type="text"
              placeholder="Søk i avdelinger..."
              className="search-input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          

        </div>
      </div>

      {/* Departments Grid */}
      <div className="grid grid-cols-3">
        {filteredDepartments.map((department) => (
          <div key={department.id} className="card">
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', marginBottom: '1rem' }}>
              <div className="card-icon">
                <Building />
              </div>
              <div style={{ flex: '1' }}>
                <h3 style={{ 
                  fontWeight: '600', 
                  color: '#333',
                  fontSize: '1.1rem',
                  marginBottom: '0.25rem'
                }}>
                  {department.name}
                </h3>
                <p style={{ color: '#666', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                  {department.description}
                </p>
              </div>
              <button className="btn btn-secondary" style={{ padding: '0.5rem' }}>
                <MoreHorizontal style={{ width: '16px', height: '16px' }} />
              </button>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <Users style={{ width: '14px', height: '14px', color: '#666' }} />
                <span style={{ fontSize: '0.875rem', color: '#666' }}>
                  {department.employeeCount || 0} ansatte
                </span>
              </div>
              {department.managerId && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <User style={{ width: '14px', height: '14px', color: '#666' }} />
                  <span style={{ fontSize: '0.875rem', color: '#666' }}>
                    <strong>Leder:</strong> {getManagerName(department.managerId)}
                  </span>
                </div>
              )}
              {department.location && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <MapPin style={{ width: '14px', height: '14px', color: '#666' }} />
                  <span style={{ fontSize: '0.875rem', color: '#666' }}>
                    {department.location}
                  </span>
                </div>
              )}
              {department.budget && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <BarChart3 style={{ width: '14px', height: '14px', color: '#666' }} />
                  <span style={{ fontSize: '0.875rem', color: '#666' }}>
                    {department.budget.toLocaleString()} kr budsjett
                  </span>
                </div>
              )}
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <div style={{ fontSize: '0.75rem', color: '#666' }}>
                Opprettet: {new Date(department.createdAt).toLocaleDateString('no-NO')}
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
                <Users style={{ width: '14px', height: '14px' }} />
                Ansatte
              </button>
              <button className="btn btn-secondary" style={{ fontSize: '0.75rem', padding: '0.25rem 0.75rem' }}>
                <Settings style={{ width: '14px', height: '14px' }} />
                Innstillinger
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
      {filteredDepartments.length === 0 && !loading && (
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <Building style={{ width: '64px', height: '64px', color: '#ccc', margin: '0 auto 1rem' }} />
          <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#333', marginBottom: '0.5rem' }}>
            Ingen avdelinger funnet
          </h3>
          <p style={{ color: '#666', marginBottom: '1.5rem' }}>
            {searchTerm 
              ? 'Prøv å endre søkekriteriene' 
              : 'Du har ingen avdelinger registrert ennå'}
          </p>
          <button 
            className="btn btn-primary"
            onClick={() => setShowAddModal(true)}
          >
            <Plus style={{ width: '16px', height: '16px' }} />
            Opprett din første avdeling
          </button>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <div className="loading" style={{ margin: '0 auto 1rem' }}></div>
          <p style={{ color: '#666' }}>Laster avdelinger...</p>
        </div>
      )}

      {/* Add Department Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Opprett ny avdeling</h2>
              <button className="modal-close" onClick={() => setShowAddModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="modal-form-grid">
                <div className="form-field">
                  <label className="form-label">Navn *</label>
                  <input
                    type="text"
                    value={newDepartment.name}
                    onChange={(e) => setNewDepartment({ ...newDepartment, name: e.target.value })}
                    className="form-input-modal"
                    placeholder="Avdelingsnavn"
                    required
                  />
                </div>
                <div className="form-field" style={{ gridColumn: '1 / -1' }}>
                  <label className="form-label">Beskrivelse</label>
                  <textarea
                    value={newDepartment.description}
                    onChange={(e) => setNewDepartment({ ...newDepartment, description: e.target.value })}
                    className="form-textarea-modal"
                    placeholder="Beskrivelse av avdelingen"
                    rows={3}
                  />
                </div>
                <div className="form-field">
                  <label className="form-label">Lokasjon</label>
                  <input
                    type="text"
                    value={newDepartment.location}
                    onChange={(e) => setNewDepartment({ ...newDepartment, location: e.target.value })}
                    className="form-input-modal"
                    placeholder="F.eks. 2. etasje, bygg A"
                  />
                </div>
                <div className="form-field">
                  <label className="form-label">Budsjett (kr)</label>
                  <input
                    type="number"
                    value={newDepartment.budget}
                    onChange={(e) => setNewDepartment({ ...newDepartment, budget: Number(e.target.value) })}
                    className="form-input-modal"
                    placeholder="0"
                    min="0"
                  />
                </div>
                <div className="form-field">
                  <label className="form-label">Avdelingsleder</label>
                  <select
                    value={newDepartment.managerId}
                    onChange={(e) => setNewDepartment({ ...newDepartment, managerId: e.target.value })}
                    className="form-select-modal"
                  >
                    <option value="">Velg avdelingsleder (valgfritt)</option>
                    {employees.map(employee => (
                      <option key={employee.id} value={employee.id}>
                        {employee.displayName} - {employee.position || 'Ingen stilling'}
                      </option>
                    ))}
                  </select>
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
                onClick={handleAddDepartment}
                style={{ 
                  padding: '0.75rem 1.5rem', 
                  background: 'var(--blue-600)', 
                  color: 'var(--white)', 
                  border: 'none', 
                  borderRadius: 'var(--radius-lg)', 
                  cursor: 'pointer' 
                }}
              >
                Opprett avdeling
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 