'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { firebaseService } from '@/lib/firebase-services';
import { 
  Building, 
  Plus, 
  Search, 
  Users, 
  MapPin, 
  Phone, 
  Mail, 
  Globe,
  Edit,
  Trash2,
  MoreHorizontal,
  Calendar,
  TrendingUp,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';

interface Company {
  id: string;
  name: string;
  industry: string;
  employees: number;
  location: string;
  phone: string;
  email: string;
  website: string;
  status: 'active' | 'inactive' | 'pending';
  joinedDate: string;
  revenue: string;
  description: string;
}

export default function CompaniesPage() {
  const { userProfile } = useAuth();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIndustry, setSelectedIndustry] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');

  useEffect(() => {
    loadCompanies();
  }, []);

  const loadCompanies = async () => {
    try {
      setLoading(true);
      
      // Load real companies from Firebase
      const companiesData = await firebaseService.getCompanies();
      
      // Companies are already in the correct format
      setCompanies(companiesData);
    } catch (error) {
      console.error('Error loading companies:', error);
      setCompanies([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredCompanies = companies.filter(company => {
    const matchesSearch = company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         company.industry.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         company.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesIndustry = selectedIndustry === 'all' || company.industry === selectedIndustry;
    const matchesStatus = selectedStatus === 'all' || company.status === selectedStatus;
    return matchesSearch && matchesIndustry && matchesStatus;
  });

  const industries = ['all', ...Array.from(new Set(companies.map(comp => comp.industry)))];
  const statuses = ['all', ...Array.from(new Set(companies.map(comp => comp.status)))];

  const getStatusColor = (status: Company['status']) => {
    switch (status) {
      case 'active': return '#10b981';
      case 'inactive': return '#ef4444';
      case 'pending': return '#f59e0b';
    }
  };

  const getStatusIcon = (status: Company['status']) => {
    switch (status) {
      case 'active': return <CheckCircle style={{ width: '16px', height: '16px', color: '#10b981' }} />;
      case 'inactive': return <AlertTriangle style={{ width: '16px', height: '16px', color: '#ef4444' }} />;
      case 'pending': return <AlertTriangle style={{ width: '16px', height: '16px', color: '#f59e0b' }} />;
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
            <h1 className="page-title">🏢 Bedrifter</h1>
            <p className="page-subtitle">
              Administrer og oversikt over alle bedrifter
            </p>
          </div>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <span className="badge badge-primary">
            {companies.length} bedrifter
          </span>
          <button className="btn btn-primary">
            <Plus style={{ width: '16px', height: '16px' }} />
            Legg til bedrift
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
              placeholder="Søk i bedrifter..."
              className="search-input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <select
            className="form-input"
            style={{ width: '150px' }}
            value={selectedIndustry}
            onChange={(e) => setSelectedIndustry(e.target.value)}
          >
            {industries.map(industry => (
              <option key={industry} value={industry}>
                {industry === 'all' ? 'Alle bransjer' : industry}
              </option>
            ))}
          </select>

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
                 status === 'inactive' ? 'Inaktive' : 'Ventende'}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Companies Grid */}
      <div className="grid grid-cols-3">
        {filteredCompanies.map((company) => (
          <div key={company.id} className="card">
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
                  {company.name}
                </h3>
                <p style={{ color: '#666', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                  {company.description}
                </p>
              </div>
              <button className="btn btn-secondary" style={{ padding: '0.5rem' }}>
                <MoreHorizontal style={{ width: '16px', height: '16px' }} />
              </button>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <Building style={{ width: '14px', height: '14px', color: '#666' }} />
                <span style={{ fontSize: '0.875rem', color: '#666' }}>{company.industry}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <MapPin style={{ width: '14px', height: '14px', color: '#666' }} />
                <span style={{ fontSize: '0.875rem', color: '#666' }}>{company.location}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <Users style={{ width: '14px', height: '14px', color: '#666' }} />
                <span style={{ fontSize: '0.875rem', color: '#666' }}>{company.employees} ansatte</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <TrendingUp style={{ width: '14px', height: '14px', color: '#666' }} />
                <span style={{ fontSize: '0.875rem', color: '#666' }}>{company.revenue}</span>
              </div>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <Phone style={{ width: '14px', height: '14px', color: '#666' }} />
                <span style={{ fontSize: '0.875rem', color: '#666' }}>{company.phone}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <Mail style={{ width: '14px', height: '14px', color: '#666' }} />
                <span style={{ fontSize: '0.875rem', color: '#666' }}>{company.email}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Globe style={{ width: '14px', height: '14px', color: '#666' }} />
                <span style={{ fontSize: '0.875rem', color: '#666' }}>{company.website}</span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                {getStatusIcon(company.status)}
                <span style={{ 
                  fontSize: '0.75rem', 
                  fontWeight: '600',
                  color: getStatusColor(company.status)
                }}>
                  {company.status === 'active' ? 'Aktiv' : 
                   company.status === 'inactive' ? 'Inaktiv' : 'Venter'}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Calendar style={{ width: '14px', height: '14px', color: '#666' }} />
                <span style={{ fontSize: '0.75rem', color: '#666' }}>
                  {new Date(company.joinedDate).toLocaleDateString('no-NO')}
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button className="btn btn-secondary" style={{ fontSize: '0.75rem', padding: '0.25rem 0.75rem' }}>
                <Edit style={{ width: '14px', height: '14px' }} />
                Rediger
              </button>
              <button className="btn btn-secondary" style={{ fontSize: '0.75rem', padding: '0.25rem 0.75rem' }}>
                <Users style={{ width: '14px', height: '14px' }} />
                Ansatte
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
      {filteredCompanies.length === 0 && !loading && (
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <Building style={{ width: '64px', height: '64px', color: '#ccc', margin: '0 auto 1rem' }} />
          <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#333', marginBottom: '0.5rem' }}>
            Ingen bedrifter funnet
          </h3>
          <p style={{ color: '#666', marginBottom: '1.5rem' }}>
            {searchTerm || selectedIndustry !== 'all' || selectedStatus !== 'all' 
              ? 'Prøv å endre søkekriteriene' 
              : 'Du har ingen bedrifter registrert ennå'}
          </p>
          <button className="btn btn-primary">
            <Plus style={{ width: '16px', height: '16px' }} />
            Legg til din første bedrift
          </button>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <div className="loading" style={{ margin: '0 auto 1rem' }}></div>
          <p style={{ color: '#666' }}>Laster bedrifter...</p>
        </div>
      )}
    </div>
  );
} 