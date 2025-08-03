'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Search, 
  Building, 
  Users, 
  MapPin,
  Phone,
  Mail,
  ArrowRight
} from 'lucide-react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';

// Prevent pre-rendering since this page uses useRouter and Firebase
export const dynamic = 'force-dynamic';

interface Company {
  id: string;
  name: string;
  orgNumber: string;
  phone: string;
  email: string;
  adminEmail: string;
  address: string;
  industry: string;
  employeeCount: number;
  status: 'active' | 'inactive' | 'pending';
  createdAt: string;
  updatedAt: string;
  subscriptionPlan: 'basic' | 'premium' | 'enterprise';
  contactPerson: {
    name: string;
    phone: string;
    email: string;
  };
}

export default function CompaniesPage() {
  const router = useRouter();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredCompanies, setFilteredCompanies] = useState<Company[]>([]);

  const loadCompanies = async () => {
    try {
      setLoading(true);
      if (db) {
        const companiesQuery = collection(db, 'companies');
        const snapshot = await getDocs(companiesQuery);
        const companiesData = snapshot.docs.map(doc => ({
          id: doc.id,
          name: doc.data().name || '',
          orgNumber: doc.data().orgNumber || '',
          phone: doc.data().phone || '',
          email: doc.data().email || '',
          adminEmail: doc.data().adminEmail || '',
          address: doc.data().address || '',
          industry: doc.data().industry || '',
          employeeCount: doc.data().employeeCount || 0,
          status: doc.data().status || 'active',
          createdAt: doc.data().createdAt || new Date().toISOString(),
          updatedAt: doc.data().updatedAt || new Date().toISOString(),
          subscriptionPlan: doc.data().subscriptionPlan || 'basic',
          contactPerson: {
            name: doc.data().contactPerson?.name || '',
            phone: doc.data().contactPerson?.phone || '',
            email: doc.data().contactPerson?.email || ''
          }
        })) as Company[];
        
        setCompanies(companiesData);
        setFilteredCompanies(companiesData);
      } else {
        setCompanies([]);
        setFilteredCompanies([]);
      }
    } catch (error) {
      console.error('Error loading companies:', error);
      setCompanies([]);
      setFilteredCompanies([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCompanies();
  }, []);

  // Filter companies based on search term
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredCompanies(companies);
    } else {
      const filtered = companies.filter(company =>
        company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        company.orgNumber.includes(searchTerm) ||
        company.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredCompanies(filtered);
    }
  }, [searchTerm, companies]);

  const handleCompanySelect = (company: Company) => {
    // Store selected company in localStorage for login page
    localStorage.setItem('selectedCompany', JSON.stringify(company));
    // Redirect to login page
    router.push('/login');
  };

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'var(--gray-50)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div className="loading" style={{ margin: '0 auto 2rem' }}></div>
          <h3 style={{ 
            fontSize: 'var(--font-size-xl)', 
            fontWeight: '600', 
            color: 'var(--gray-900)', 
            marginBottom: '0.5rem' 
          }}>
            Laster bedrifter...
          </h3>
          <p style={{ 
            color: 'var(--gray-600)',
            fontSize: 'var(--font-size-base)'
          }}>
            Henter bedriftsinformasjon fra databasen
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--gray-50)'
    }}>
      {/* Navigation */}
      <nav style={{
        background: 'var(--white)',
        borderBottom: '1px solid var(--gray-200)',
        position: 'sticky',
        top: 0,
        zIndex: 50,
        boxShadow: 'var(--shadow-sm)'
      }}>
        <div style={{
          maxWidth: '1280px',
          margin: '0 auto',
          padding: '0 var(--space-6)'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            height: '4rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{
                width: '40px',
                height: '40px',
                background: 'var(--gradient-primary)',
                borderRadius: 'var(--radius-lg)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Building style={{ width: '20px', height: '20px', color: 'var(--white)' }} />
              </div>
              <div>
                <h1 style={{ 
                  fontSize: 'var(--font-size-xl)', 
                  fontWeight: '700', 
                  color: 'var(--gray-900)'
                }}>
                  DriftPro
                </h1>
                <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--gray-600)' }}>
                  Admin Panel
                </p>
              </div>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <Link
                href="/"
                style={{
                  color: 'var(--gray-600)',
                  padding: 'var(--space-2) var(--space-4)',
                  borderRadius: 'var(--radius-md)',
                  fontSize: 'var(--font-size-sm)',
                  fontWeight: '500',
                  textDecoration: 'none',
                  transition: 'all var(--transition-normal)'
                }}
              >
                Hjem
              </Link>
              <Link
                href="/help"
                style={{
                  color: 'var(--gray-600)',
                  padding: 'var(--space-2) var(--space-4)',
                  borderRadius: 'var(--radius-md)',
                  fontSize: 'var(--font-size-sm)',
                  fontWeight: '500',
                  textDecoration: 'none',
                  transition: 'all var(--transition-normal)'
                }}
              >
                Hjelp
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div style={{
        maxWidth: '1280px',
        margin: '0 auto',
        padding: '3rem 1.5rem'
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <h1 style={{
            fontSize: 'var(--font-size-5xl)',
            fontWeight: '700',
            color: 'var(--gray-900)',
            marginBottom: '1rem',
            lineHeight: '1.2'
          }}>
            Velkommen til DriftPro
          </h1>
          <p style={{
            fontSize: 'var(--font-size-xl)',
            color: 'var(--gray-600)',
            maxWidth: '600px',
            margin: '0 auto',
            lineHeight: '1.6'
          }}>
            Velg din bedrift for å få tilgang til DriftPro Admin-panelet
          </p>
        </div>

        {/* Search Section */}
        <div style={{
          maxWidth: '600px',
          margin: '0 auto 3rem',
          background: 'var(--white)',
          borderRadius: 'var(--radius-lg)',
          padding: '2rem',
          boxShadow: 'var(--shadow-sm)',
          border: '1px solid var(--gray-200)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <Search style={{ width: '20px', height: '20px', color: 'var(--gray-400)' }} />
            <input
              type="text"
              placeholder="Søk etter bedrift..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                flex: 1,
                padding: '0.75rem',
                border: '1px solid var(--gray-300)',
                borderRadius: 'var(--radius-md)',
                fontSize: 'var(--font-size-base)',
                outline: 'none'
              }}
            />
          </div>
          {searchTerm && (
            <p style={{
              fontSize: 'var(--font-size-sm)',
              color: 'var(--gray-600)',
              marginTop: '0.5rem'
            }}>
              {filteredCompanies.length} bedrift{filteredCompanies.length !== 1 ? 'er' : ''} funnet
            </p>
          )}
        </div>

        {/* Companies List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {filteredCompanies.map((company) => (
            <div
              key={company.id}
              className="card"
              style={{ 
                transition: 'all var(--transition-normal)',
                cursor: 'pointer'
              }}
              onClick={() => handleCompanySelect(company)}
            >
              {/* Company Header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                <div className="card-icon">
                  <Building />
                </div>
                <div style={{ flex: '1' }}>
                  <h3 style={{
                    fontSize: 'var(--font-size-lg)',
                    fontWeight: '600',
                    color: 'var(--gray-900)',
                    marginBottom: '0.25rem'
                  }}>
                    {company.name}
                  </h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--gray-600)' }}>
                      Org.nr: {company.orgNumber}
                    </span>
                    <span className={`badge ${
                      company.status === 'active' ? 'badge-success' :
                      company.status === 'inactive' ? 'badge-danger' :
                      'badge-warning'
                    }`}>
                      {company.status === 'active' ? 'Aktiv' :
                       company.status === 'inactive' ? 'Inaktiv' : 'Venter'}
                    </span>
                  </div>
                </div>
                <div style={{
                  padding: '0.75rem',
                  background: '#10b981',
                  border: 'none',
                  borderRadius: '8px',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s ease'
                }}>
                  <ArrowRight style={{ width: '20px', height: '20px' }} />
                </div>
              </div>

              {/* Company Details */}
              <div style={{ marginBottom: '1rem' }}>
                {company.address && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <MapPin style={{ width: '16px', height: '16px', color: 'var(--gray-400)' }} />
                    <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--gray-600)' }}>
                      {company.address}
                    </span>
                  </div>
                )}
                {company.employeeCount && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <Users style={{ width: '16px', height: '16px', color: 'var(--gray-400)' }} />
                    <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--gray-600)' }}>
                      {company.employeeCount} ansatte
                    </span>
                  </div>
                )}
                {company.industry && (
                  <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--gray-600)', marginBottom: '0.5rem' }}>
                    {company.industry}
                  </div>
                )}
              </div>

              {/* Contact Info */}
              <div style={{ 
                marginBottom: '1rem',
                padding: '1rem',
                background: 'var(--gray-50)',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--gray-200)'
              }}>
                {company.phone && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <Phone style={{ width: '16px', height: '16px', color: 'var(--primary)' }} />
                    <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--gray-700)', fontWeight: '500' }}>
                      {company.phone}
                    </span>
                  </div>
                )}
                {company.email && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <Mail style={{ width: '16px', height: '16px', color: 'var(--primary)' }} />
                    <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--gray-700)', fontWeight: '500' }}>
                      {company.email}
                    </span>
                  </div>
                )}
                {company.contactPerson?.name && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Users style={{ width: '16px', height: '16px', color: 'var(--primary)' }} />
                    <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--gray-700)', fontWeight: '500' }}>
                      Kontakt: {company.contactPerson.name}
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}

          {filteredCompanies.length === 0 && (
            <div style={{
              textAlign: 'center',
              padding: '3rem',
              background: 'var(--white)',
              border: '1px solid var(--gray-200)',
              borderRadius: 'var(--radius-lg)'
            }}>
              <Building style={{ 
                width: '64px', 
                height: '64px', 
                color: 'var(--gray-300)', 
                margin: '0 auto 1rem' 
              }} />
              <h3 style={{ 
                fontSize: 'var(--font-size-lg)', 
                fontWeight: '600', 
                color: 'var(--gray-900)', 
                marginBottom: '0.5rem' 
              }}>
                {searchTerm ? 'Ingen bedrifter funnet' : 'Ingen bedrifter'}
              </h3>
              <p style={{ 
                color: 'var(--gray-600)',
                fontSize: 'var(--font-size-base)'
              }}>
                {searchTerm 
                  ? 'Prøv å søke med et annet navn eller organisasjonsnummer'
                  : 'Kontakt systemadministrator for å få tilgang til DriftPro.'
                }
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ 
          textAlign: 'center', 
          marginTop: '3rem', 
          paddingTop: '2rem', 
          borderTop: '1px solid var(--gray-200)' 
        }}>
          <p style={{ 
            fontSize: 'var(--font-size-base)', 
            color: 'var(--gray-600)',
            marginBottom: '1rem'
          }}>
            Trenger du hjelp?
          </p>
          <a href="/contact" style={{
            color: 'var(--primary)',
            fontWeight: '600',
            textDecoration: 'none',
            padding: 'var(--space-3) var(--space-6)',
            background: 'var(--white)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--gray-300)',
            transition: 'all var(--transition-normal)',
            display: 'inline-block'
          }}>
            Kontakt oss
          </a>
        </div>
      </div>
    </div>
  );
} 