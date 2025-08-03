'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { firebaseService, Company } from '@/lib/firebase-services';
import { brrgService, BRRGCompany } from '@/lib/brrg-service';
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
  AlertTriangle,
  Database,
  ExternalLink,
  RefreshCw
} from 'lucide-react';



export default function CompaniesPage() {
  const { userProfile } = useAuth();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIndustry, setSelectedIndustry] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  
  // BRRG Integration
  const [showBRRGModal, setShowBRRGModal] = useState(false);
  const [brrgSearchTerm, setBrrgSearchTerm] = useState('');
  const [brrgOrgNumber, setBrrgOrgNumber] = useState('');
  const [brrgResults, setBrrgResults] = useState<BRRGCompany[]>([]);
  const [brrgLoading, setBrrgLoading] = useState(false);
  const [brrgError, setBrrgError] = useState<string | null>(null);

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

  // BRRG Search Functions
  const handleBRRGSearchByName = async () => {
    if (!brrgSearchTerm.trim()) {
      setBrrgError('Vennligst skriv inn et søkeord');
      return;
    }

    try {
      setBrrgLoading(true);
      setBrrgError(null);
      setBrrgResults([]);

      const results = await brrgService.searchCompanies(brrgSearchTerm);
      setBrrgResults(results);
      
      if (results.length === 0) {
        setBrrgError('Ingen bedrifter funnet med det søkeordet');
      }
    } catch (error) {
      console.error('Error searching BRRG:', error);
      setBrrgError('Feil ved søk etter bedrifter');
    } finally {
      setBrrgLoading(false);
    }
  };

  const handleBRRGSearchByOrgNumber = async () => {
    if (!brrgOrgNumber.trim()) {
      setBrrgError('Vennligst skriv inn et organisasjonsnummer');
      return;
    }

    if (!brrgService.validateOrgNumber(brrgOrgNumber)) {
      setBrrgError('Ugyldig organisasjonsnummer format');
      return;
    }

    try {
      setBrrgLoading(true);
      setBrrgError(null);
      setBrrgResults([]);

      const companyData = await brrgService.getCompanyInfo(brrgOrgNumber);
      
      if (companyData) {
        setBrrgResults([companyData]);
      } else {
        setBrrgError('Bedrift ikke funnet i BRRG');
      }
    } catch (error) {
      console.error('Error fetching company from BRRG:', error);
      setBrrgError('Feil ved henting av bedriftsinformasjon');
    } finally {
      setBrrgLoading(false);
    }
  };

  const handleAddFromBRRG = async (brrgCompany: BRRGCompany) => {
    try {
      // Transform BRRG data to our company format
      const newCompany: Omit<Company, 'id' | 'createdAt' | 'updatedAt'> = {
        name: brrgCompany.navn,
        industry: brrgCompany.naeringskode1?.beskrivelse || 'Ukjent',
        employees: brrgCompany.antallAnsatte || 0,
        location: brrgCompany.forretningsadresse?.adresse || 'Ukjent',
        phone: brrgCompany.kontaktinformasjon?.telefon || '',
        email: brrgCompany.kontaktinformasjon?.epost || '',
        website: '',
        status: 'active',
        joinedDate: new Date().toISOString(),
        revenue: 'Ikke tilgjengelig',
        description: `${brrgCompany.navn} - ${brrgCompany.organisasjonsform?.beskrivelse || 'Bedrift'}`,
        adminUserId: userProfile?.id || ''
      };

      // Add to Firebase
      const companyId = await firebaseService.createCompany(newCompany);
      const addedCompany = { 
        id: companyId, 
        ...newCompany,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      if (addedCompany) {
        setCompanies([...companies, addedCompany]);
        setShowBRRGModal(false);
        setBrrgResults([]);
        setBrrgSearchTerm('');
        setBrrgOrgNumber('');
        alert(`Bedrift "${brrgCompany.navn}" lagt til fra BRRG!`);
      }
    } catch (error) {
      console.error('Error adding company from BRRG:', error);
      alert('Feil ved å legge til bedrift fra BRRG');
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
          <button 
            className="btn btn-primary"
            onClick={() => setShowBRRGModal(true)}
          >
            <Database style={{ width: '16px', height: '16px' }} />
            Legg til fra BRRG
          </button>
          <button className="btn btn-secondary">
            <Plus style={{ width: '16px', height: '16px' }} />
            Legg til manuelt
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
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            <button 
              className="btn btn-primary"
              onClick={() => setShowBRRGModal(true)}
            >
              <Database style={{ width: '16px', height: '16px' }} />
              Legg til fra BRRG
            </button>
            <button className="btn btn-secondary">
              <Plus style={{ width: '16px', height: '16px' }} />
              Legg til manuelt
            </button>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <div className="loading" style={{ margin: '0 auto 1rem' }}></div>
          <p style={{ color: '#666' }}>Laster bedrifter...</p>
        </div>
      )}

      {/* BRRG Modal */}
      {showBRRGModal && (
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
            maxWidth: '800px',
            width: '90%',
            maxHeight: '90vh',
            overflow: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
              <div>
                <h2 style={{ fontSize: 'var(--font-size-xl)', fontWeight: '600', color: 'var(--gray-900)' }}>
                  <Database style={{ width: '24px', height: '24px', marginRight: '0.5rem' }} />
                  Legg til bedrift fra BRRG
                </h2>
                <p style={{ color: 'var(--gray-600)', fontSize: 'var(--font-size-sm)' }}>
                  Søk etter bedrifter i Brønnøysundregistrene og legg dem til i systemet
                </p>
              </div>
              <button
                onClick={() => setShowBRRGModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '0.5rem'
                }}
              >
                <MoreHorizontal style={{ width: '20px', height: '20px', color: 'var(--gray-400)' }} />
              </button>
            </div>

            {/* BRRG Search Tabs */}
            <div style={{ marginBottom: '2rem' }}>
              <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: 'var(--gray-700)' }}>
                    Søk etter bedriftsnavn
                  </label>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <input
                      type="text"
                      placeholder="Skriv bedriftsnavn..."
                      value={brrgSearchTerm}
                      onChange={(e) => setBrrgSearchTerm(e.target.value)}
                      style={{
                        flex: 1,
                        padding: '0.75rem',
                        border: '1px solid var(--gray-300)',
                        borderRadius: 'var(--radius-md)',
                        fontSize: 'var(--font-size-base)'
                      }}
                    />
                    <button
                      onClick={handleBRRGSearchByName}
                      disabled={brrgLoading}
                      style={{
                        padding: '0.75rem 1rem',
                        background: 'var(--primary)',
                        color: 'var(--white)',
                        border: 'none',
                        borderRadius: 'var(--radius-md)',
                        cursor: brrgLoading ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                      }}
                    >
                      {brrgLoading ? (
                        <RefreshCw style={{ width: '16px', height: '16px' }} />
                      ) : (
                        <Search style={{ width: '16px', height: '16px' }} />
                      )}
                      Søk
                    </button>
                  </div>
                </div>

                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: 'var(--gray-700)' }}>
                    Søk etter organisasjonsnummer
                  </label>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <input
                      type="text"
                      placeholder="123456789"
                      value={brrgOrgNumber}
                      onChange={(e) => setBrrgOrgNumber(e.target.value)}
                      style={{
                        flex: 1,
                        padding: '0.75rem',
                        border: '1px solid var(--gray-300)',
                        borderRadius: 'var(--radius-md)',
                        fontSize: 'var(--font-size-base)'
                      }}
                    />
                    <button
                      onClick={handleBRRGSearchByOrgNumber}
                      disabled={brrgLoading}
                      style={{
                        padding: '0.75rem 1rem',
                        background: 'var(--primary)',
                        color: 'var(--white)',
                        border: 'none',
                        borderRadius: 'var(--radius-md)',
                        cursor: brrgLoading ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                      }}
                    >
                      {brrgLoading ? (
                        <RefreshCw style={{ width: '16px', height: '16px' }} />
                      ) : (
                        <Search style={{ width: '16px', height: '16px' }} />
                      )}
                      Søk
                    </button>
                  </div>
                </div>
              </div>

              {brrgError && (
                <div style={{
                  background: 'var(--danger)',
                  color: 'var(--white)',
                  padding: '1rem',
                  borderRadius: 'var(--radius-md)',
                  marginBottom: '1rem'
                }}>
                  {brrgError}
                </div>
              )}
            </div>

            {/* BRRG Results */}
            {brrgResults.length > 0 && (
              <div>
                <h3 style={{ fontSize: 'var(--font-size-lg)', fontWeight: '600', marginBottom: '1rem' }}>
                  Søkeresultater ({brrgResults.length})
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {brrgResults.map((company, index) => (
                    <div key={index} style={{
                      border: '1px solid var(--gray-200)',
                      borderRadius: 'var(--radius-lg)',
                      padding: '1.5rem',
                      background: 'var(--gray-50)'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                        <div>
                          <h4 style={{ fontSize: 'var(--font-size-lg)', fontWeight: '600', marginBottom: '0.5rem' }}>
                            {company.navn}
                          </h4>
                          <p style={{ color: 'var(--gray-600)', fontSize: 'var(--font-size-sm)' }}>
                            Org.nr: {company.organisasjonsnummer}
                          </p>
                        </div>
                        <button
                          onClick={() => handleAddFromBRRG(company)}
                          style={{
                            padding: '0.5rem 1rem',
                            background: 'var(--success)',
                            color: 'var(--white)',
                            border: 'none',
                            borderRadius: 'var(--radius-md)',
                            cursor: 'pointer',
                            fontSize: 'var(--font-size-sm)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem'
                          }}
                        >
                          <Plus style={{ width: '16px', height: '16px' }} />
                          Legg til
                        </button>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                        <div>
                          <strong>Bransje:</strong> {company.naeringskode1?.beskrivelse || 'Ikke tilgjengelig'}
                        </div>
                        <div>
                          <strong>Ansatte:</strong> {company.antallAnsatte || 'Ikke tilgjengelig'}
                        </div>
                        <div>
                          <strong>Adresse:</strong> {company.forretningsadresse?.adresse || 'Ikke tilgjengelig'}
                        </div>
                        <div>
                          <strong>Telefon:</strong> {company.kontaktinformasjon?.telefon || 'Ikke tilgjengelig'}
                        </div>
                        <div>
                          <strong>E-post:</strong> {company.kontaktinformasjon?.epost || 'Ikke tilgjengelig'}
                        </div>
                        <div>
                          <strong>Registrert:</strong> {new Date(company.registreringsdatoEnhetsregisteret).toLocaleDateString('no-NO')}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Close Button */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '2rem' }}>
              <button
                onClick={() => setShowBRRGModal(false)}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: 'var(--gray-200)',
                  color: 'var(--gray-700)',
                  border: 'none',
                  borderRadius: 'var(--radius-md)',
                  cursor: 'pointer'
                }}
              >
                Lukk
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 