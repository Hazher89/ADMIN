'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
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

interface Department {
  id: string;
  name: string;
  description: string;
  manager: string;
  employees: number;
  location: string;
  status: 'active' | 'inactive' | 'planning';
  budget: number;
  createdAt: string;
  category: string;
  contactEmail: string;
  contactPhone: string;
}

export default function DepartmentsPage() {
  const { userProfile } = useAuth();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');

  useEffect(() => {
    loadDepartments();
  }, []);

  const loadDepartments = async () => {
    try {
      // Mock data for demonstration
      const mockDepartments: Department[] = [
        {
          id: '1',
          name: 'Produksjon',
          description: 'Hovedproduksjonsavdeling for alle produkter',
          manager: 'John Smith',
          employees: 45,
          location: 'Produksjonshall A',
          status: 'active',
          budget: 2500000,
          createdAt: '2023-01-15T10:00:00Z',
          category: 'Produksjon',
          contactEmail: 'produksjon@company.com',
          contactPhone: '+47 123 45 678'
        },
        {
          id: '2',
          name: 'Kvalitetskontroll',
          description: 'Kvalitetskontroll og testing av produkter',
          manager: 'Sarah Johnson',
          employees: 12,
          location: 'Kontrollrom',
          status: 'active',
          budget: 800000,
          createdAt: '2023-02-20T09:00:00Z',
          category: 'Kvalitet',
          contactEmail: 'kvalitet@company.com',
          contactPhone: '+47 123 45 679'
        },
        {
          id: '3',
          name: 'IT og Systemer',
          description: 'IT-støtte og systemadministrasjon',
          manager: 'Mike Davis',
          employees: 8,
          location: 'IT-avdeling',
          status: 'active',
          budget: 1200000,
          createdAt: '2023-03-10T11:00:00Z',
          category: 'IT',
          contactEmail: 'it@company.com',
          contactPhone: '+47 123 45 680'
        },
        {
          id: '4',
          name: 'HR og Personal',
          description: 'Human Resources og personaladministrasjon',
          manager: 'Lisa Wilson',
          employees: 6,
          location: 'Hovedkontor',
          status: 'active',
          budget: 600000,
          createdAt: '2023-01-05T08:00:00Z',
          category: 'Administrasjon',
          contactEmail: 'hr@company.com',
          contactPhone: '+47 123 45 681'
        },
        {
          id: '5',
          name: 'Forskning og Utvikling',
          description: 'R&D avdeling for nye produkter',
          manager: 'Tom Brown',
          employees: 15,
          location: 'R&D Laboratorium',
          status: 'planning',
          budget: 1800000,
          createdAt: '2024-06-01T14:00:00Z',
          category: 'R&D',
          contactEmail: 'rd@company.com',
          contactPhone: '+47 123 45 682'
        }
      ];

      setDepartments(mockDepartments);
    } catch (error) {
      console.error('Error loading departments:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredDepartments = departments.filter(department => {
    const matchesSearch = department.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         department.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         department.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = selectedStatus === 'all' || department.status === selectedStatus;
    const matchesCategory = selectedCategory === 'all' || department.category === selectedCategory;
    return matchesSearch && matchesStatus && matchesCategory;
  });

  const statuses = ['all', ...Array.from(new Set(departments.map(dept => dept.status)))];
  const categories = ['all', ...Array.from(new Set(departments.map(dept => dept.category)))];

  const getStatusColor = (status: Department['status']) => {
    switch (status) {
      case 'active': return '#10b981';
      case 'inactive': return '#ef4444';
      case 'planning': return '#f59e0b';
    }
  };

  const getStatusIcon = (status: Department['status']) => {
    switch (status) {
      case 'active': return <CheckCircle style={{ width: '16px', height: '16px', color: '#10b981' }} />;
      case 'inactive': return <AlertTriangle style={{ width: '16px', height: '16px', color: '#ef4444' }} />;
      case 'planning': return <Clock style={{ width: '16px', height: '16px', color: '#f59e0b' }} />;
    }
  };

  const getTotalEmployees = () => {
    return departments.reduce((sum, dept) => sum + dept.employees, 0);
  };

  const getTotalBudget = () => {
    return departments.reduce((sum, dept) => sum + dept.budget, 0);
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
          <button className="btn btn-primary">
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
            {departments.filter(d => d.status === 'active').length}
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
                 status === 'inactive' ? 'Inaktive' : 'Planlegging'}
              </option>
            ))}
          </select>

          <select
            className="form-input"
            style={{ width: '150px' }}
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            {categories.map(category => (
              <option key={category} value={category}>
                {category === 'all' ? 'Alle kategorier' : category}
              </option>
            ))}
          </select>
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
                <User style={{ width: '14px', height: '14px', color: '#666' }} />
                <span style={{ fontSize: '0.875rem', color: '#666' }}>
                  <strong>Leder:</strong> {department.manager}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <Users style={{ width: '14px', height: '14px', color: '#666' }} />
                <span style={{ fontSize: '0.875rem', color: '#666' }}>
                  {department.employees} ansatte
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <MapPin style={{ width: '14px', height: '14px', color: '#666' }} />
                <span style={{ fontSize: '0.875rem', color: '#666' }}>
                  {department.location}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <BarChart3 style={{ width: '14px', height: '14px', color: '#666' }} />
                <span style={{ fontSize: '0.875rem', color: '#666' }}>
                  {department.budget.toLocaleString()} kr budsjett
                </span>
              </div>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  {getStatusIcon(department.status)}
                  <span style={{ 
                    fontSize: '0.75rem', 
                    fontWeight: '600',
                    color: getStatusColor(department.status)
                  }}>
                    {department.status === 'active' ? 'Aktiv' : 
                     department.status === 'inactive' ? 'Inaktiv' : 'Planlegging'}
                  </span>
                </div>
                <span className="badge badge-secondary" style={{ fontSize: '0.625rem' }}>
                  {department.category}
                </span>
              </div>
              <div style={{ fontSize: '0.75rem', color: '#666' }}>
                Opprettet: {new Date(department.createdAt).toLocaleDateString('no-NO')}
              </div>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <User style={{ width: '14px', height: '14px', color: '#666' }} />
                <span style={{ fontSize: '0.875rem', color: '#666' }}>
                  {department.contactEmail}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <MapPin style={{ width: '14px', height: '14px', color: '#666' }} />
                <span style={{ fontSize: '0.875rem', color: '#666' }}>
                  {department.contactPhone}
                </span>
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
            {searchTerm || selectedStatus !== 'all' || selectedCategory !== 'all' 
              ? 'Prøv å endre søkekriteriene' 
              : 'Du har ingen avdelinger registrert ennå'}
          </p>
          <button className="btn btn-primary">
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
    </div>
  );
} 