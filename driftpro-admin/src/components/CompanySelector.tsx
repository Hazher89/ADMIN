'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { FirebaseService, Company } from '../lib/firebase-service';

export default function CompanySelector() {
  const { setSelectedCompany } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = useCallback(async () => {
    if (!searchTerm.trim()) {
      setCompanies([]);
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const results = await FirebaseService.searchCompanies(searchTerm);
      setCompanies(results);
    } catch (err) {
      console.error('Error searching companies:', err);
      setError('Kunne ikke søke etter bedrifter. Prøv igjen.');
    } finally {
      setLoading(false);
    }
  }, [searchTerm]);

  const handleCompanySelect = async (company: Company) => {
    setLoading(true);
    try {
      // Get full company data from Firebase
      const fullCompany = await FirebaseService.getCompanyById(company.id);
      if (fullCompany) {
        setSelectedCompany(fullCompany);
      } else {
        setError('Kunne ikke hente bedriftsdata. Prøv igjen.');
      }
    } catch (err) {
      console.error('Error selecting company:', err);
      setError('Kunne ikke velge bedrift. Prøv igjen.');
    } finally {
      setLoading(false);
    }
  };

  // Search when user types (with debounce)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchTerm.trim()) {
        handleSearch();
      } else {
        setCompanies([]);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchTerm, handleSearch]);

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: '20px' }}>
      <div style={{ textAlign: 'center', marginBottom: '30px' }}>
        <h1 style={{ 
          fontSize: '32px', 
          fontWeight: '700', 
          color: '#3c8dbc',
          marginBottom: '10px'
        }}>
          DriftPro Admin Panel
        </h1>
        <p style={{ 
          fontSize: '16px', 
          color: '#6c757d',
          marginBottom: '30px'
        }}>
          Søk etter din bedrift for å komme i gang
        </p>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <div style={{ position: 'relative' }}>
          <i className="fas fa-search" style={{
            position: 'absolute',
            left: '12px',
            top: '50%',
            transform: 'translateY(-50%)',
            color: '#6c757d',
            fontSize: '16px'
          }}></i>
          <input
            type="text"
            placeholder="Søk etter bedriftsnavn eller bransje..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '15px 15px 15px 45px',
              border: '2px solid #dee2e6',
              borderRadius: '8px',
              fontSize: '16px',
              outline: 'none',
              transition: 'border-color 0.3s',
              backgroundColor: 'white'
            }}
            onFocus={(e) => e.target.style.borderColor = '#3c8dbc'}
            onBlur={(e) => e.target.style.borderColor = '#dee2e6'}
          />
        </div>
      </div>

      {error && (
        <div style={{ 
          padding: '12px', 
          backgroundColor: '#f8d7da', 
          color: '#721c24', 
          borderRadius: '6px', 
          marginBottom: '20px',
          border: '1px solid #f5c6cb'
        }}>
          <i className="fas fa-exclamation-triangle" style={{ marginRight: '8px' }}></i>
          {error}
        </div>
      )}

      {loading && (
        <div style={{ 
          textAlign: 'center', 
          padding: '20px',
          color: '#3c8dbc'
        }}>
          <i className="fas fa-spinner fa-spin" style={{ fontSize: '24px', marginBottom: '10px' }}></i>
          <p>Søker etter bedrifter...</p>
        </div>
      )}

      {!loading && companies.length > 0 && (
        <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
          {companies.map((company) => (
            <div
              key={company.id}
              onClick={() => handleCompanySelect(company)}
              style={{
                padding: '20px',
                border: '1px solid #dee2e6',
                borderRadius: '8px',
                marginBottom: '15px',
                cursor: 'pointer',
                transition: 'all 0.3s',
                background: 'white',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#3c8dbc';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(60, 141, 188, 0.2)';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#dee2e6';
                e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                <div style={{
                  width: '60px',
                  height: '60px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #3c8dbc, #5bc0de)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontWeight: '700',
                  fontSize: '24px',
                  boxShadow: '0 4px 8px rgba(60, 141, 188, 0.3)'
                }}>
                  {company.name.charAt(0).toUpperCase()}
                </div>
                <div style={{ flex: 1 }}>
                  <h3 style={{ 
                    margin: '0 0 8px 0', 
                    fontSize: '18px', 
                    fontWeight: '600',
                    color: '#333'
                  }}>
                    {company.name}
                  </h3>
                  <p style={{ 
                    margin: '0 0 6px 0', 
                    fontSize: '14px', 
                    color: '#6c757d'
                  }}>
                    <i className="fas fa-industry" style={{ marginRight: '6px' }}></i>
                    {company.industry}
                  </p>
                  <p style={{ 
                    margin: '0', 
                    fontSize: '13px', 
                    color: '#17a2b8',
                    fontWeight: '500'
                  }}>
                    <i className="fas fa-users" style={{ marginRight: '6px' }}></i>
                    {company.employees} ansatte
                  </p>
                </div>
                <i className="fas fa-chevron-right" style={{ 
                  color: '#6c757d',
                  fontSize: '16px',
                  transition: 'transform 0.3s'
                }}></i>
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && searchTerm && companies.length === 0 && (
        <div style={{ 
          textAlign: 'center', 
          padding: '40px 20px',
          color: '#6c757d'
        }}>
          <i className="fas fa-search" style={{ fontSize: '48px', marginBottom: '15px', opacity: '0.5' }}></i>
          <h3 style={{ margin: '0 0 10px 0', fontSize: '18px' }}>Ingen bedrifter funnet</h3>
          <p style={{ margin: '0', fontSize: '14px' }}>
            Prøv å søke med et annet navn eller bransje
          </p>
        </div>
      )}

      {!searchTerm && !loading && (
        <div style={{ 
          textAlign: 'center', 
          padding: '40px 20px',
          color: '#6c757d'
        }}>
          <i className="fas fa-building" style={{ fontSize: '48px', marginBottom: '15px', opacity: '0.5' }}></i>
          <h3 style={{ margin: '0 0 10px 0', fontSize: '18px' }}>Søk etter din bedrift</h3>
          <p style={{ margin: '0', fontSize: '14px' }}>
            Skriv bedriftsnavn eller bransje i søkefeltet ovenfor
          </p>
        </div>
      )}
    </div>
  );
} 