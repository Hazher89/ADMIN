'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Search, 
  Building, 
  MapPin, 
  Phone, 
  Mail, 
  Users, 
  Calendar,
  ArrowLeft,
  ExternalLink,
  RefreshCw,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { brrgService, BRRGCompany } from '@/lib/brrg-service';

// Prevent pre-rendering since this page uses useRouter
export const dynamic = 'force-dynamic';

export default function BRRGIntegrationPage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [orgNumber, setOrgNumber] = useState('');
  const [company, setCompany] = useState<BRRGCompany | null>(null);
  const [searchResults, setSearchResults] = useState<BRRGCompany[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearchByOrgNumber = async () => {
    if (!orgNumber.trim()) {
      setError('Vennligst skriv inn et organisasjonsnummer');
      return;
    }

    if (!brrgService.validateOrgNumber(orgNumber)) {
      setError('Ugyldig organisasjonsnummer format');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setCompany(null);

      const companyData = await brrgService.getCompanyInfo(orgNumber);
      
      if (companyData) {
        setCompany(companyData);
      } else {
        setError('Bedrift ikke funnet i BRRG');
      }
    } catch (error) {
      console.error('Error fetching company:', error);
      setError('Feil ved henting av bedriftsinformasjon');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchByName = async () => {
    if (!searchTerm.trim()) {
      setError('Vennligst skriv inn et søkeord');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setSearchResults([]);

      const results = await brrgService.searchCompanies(searchTerm);
      setSearchResults(results);
      
      if (results.length === 0) {
        setError('Ingen bedrifter funnet med det søkeordet');
      }
    } catch (error) {
      console.error('Error searching companies:', error);
      setError('Feil ved søk etter bedrifter');
    } finally {
      setLoading(false);
    }
  };

  const handleSyncCompany = async (companyData: BRRGCompany) => {
    try {
      setLoading(true);
      setError(null);

      // Here you would typically save the company data to your database
      // For now, we'll just show a success message
      alert(`Bedriftsinformasjon for ${companyData.navn} er synkronisert!`);
      
      // You could also redirect to admin management or company details
      // router.push('/admin-management');
    } catch (error) {
      console.error('Error syncing company:', error);
      setError('Feil ved synkronisering av bedriftsinformasjon');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Ikke tilgjengelig';
    try {
      return new Date(dateString).toLocaleDateString('nb-NO');
    } catch {
      return dateString;
    }
  };

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
              <Link href="/companies" style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                color: 'var(--gray-600)',
                textDecoration: 'none',
                fontSize: 'var(--font-size-sm)',
                fontWeight: '500'
              }}>
                <ArrowLeft style={{ width: '16px', height: '16px' }} />
                Tilbake
              </Link>
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
                  BRRG-integrasjon
                </h1>
                <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--gray-600)' }}>
                  Hent bedriftsinformasjon fra Brønnøysundregistrene
                </p>
              </div>
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
          <h2 style={{
            fontSize: 'var(--font-size-3xl)',
            fontWeight: '700',
            color: 'var(--gray-900)',
            marginBottom: '1rem'
          }}>
            BRRG-integrasjon
          </h2>
          <p style={{
            fontSize: 'var(--font-size-lg)',
            color: 'var(--gray-600)',
            maxWidth: '600px',
            margin: '0 auto',
            lineHeight: '1.6'
          }}>
            Søk etter bedrifter i Brønnøysundregistrene og hent oppdatert informasjon
          </p>
        </div>

        {/* Search Sections */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '3rem' }}>
          {/* Search by Organization Number */}
          <div className="card">
            <h3 style={{
              fontSize: 'var(--font-size-lg)',
              fontWeight: '600',
              color: 'var(--gray-900)',
              marginBottom: '1rem'
            }}>
              Søk etter organisasjonsnummer
            </h3>
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
              <input
                type="text"
                value={orgNumber}
                onChange={(e) => setOrgNumber(e.target.value)}
                placeholder="123456789"
                style={{
                  flex: '1',
                  padding: '0.75rem',
                  border: '1px solid var(--gray-300)',
                  borderRadius: 'var(--radius-md)',
                  fontSize: 'var(--font-size-base)'
                }}
              />
              <button
                onClick={handleSearchByOrgNumber}
                disabled={loading}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: 'var(--primary)',
                  color: 'var(--white)',
                  border: 'none',
                  borderRadius: 'var(--radius-md)',
                  fontSize: 'var(--font-size-base)',
                  fontWeight: '500',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.6 : 1
                }}
              >
                {loading ? (
                  <>
                    <RefreshCw style={{ width: '16px', height: '16px', marginRight: '0.5rem' }} />
                    Søker...
                  </>
                ) : (
                  <>
                    <Search style={{ width: '16px', height: '16px', marginRight: '0.5rem' }} />
                    Søk
                  </>
                )}
              </button>
            </div>
            <p style={{
              fontSize: 'var(--font-size-sm)',
              color: 'var(--gray-600)'
            }}>
              Skriv inn et 9-sifret organisasjonsnummer for å finne bedriften
            </p>
          </div>

          {/* Search by Name */}
          <div className="card">
            <h3 style={{
              fontSize: 'var(--font-size-lg)',
              fontWeight: '600',
              color: 'var(--gray-900)',
              marginBottom: '1rem'
            }}>
              Søk etter bedriftsnavn
            </h3>
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Bedriftsnavn..."
                style={{
                  flex: '1',
                  padding: '0.75rem',
                  border: '1px solid var(--gray-300)',
                  borderRadius: 'var(--radius-md)',
                  fontSize: 'var(--font-size-base)'
                }}
              />
              <button
                onClick={handleSearchByName}
                disabled={loading}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: 'var(--primary)',
                  color: 'var(--white)',
                  border: 'none',
                  borderRadius: 'var(--radius-md)',
                  fontSize: 'var(--font-size-base)',
                  fontWeight: '500',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.6 : 1
                }}
              >
                {loading ? (
                  <>
                    <RefreshCw style={{ width: '16px', height: '16px', marginRight: '0.5rem' }} />
                    Søker...
                  </>
                ) : (
                  <>
                    <Search style={{ width: '16px', height: '16px', marginRight: '0.5rem' }} />
                    Søk
                  </>
                )}
              </button>
            </div>
            <p style={{
              fontSize: 'var(--font-size-sm)',
              color: 'var(--gray-600)'
            }}>
              Søk etter bedrifter basert på navn eller deler av navnet
            </p>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div style={{
            background: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: 'var(--radius-lg)',
            padding: '1rem',
            marginBottom: '2rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <AlertCircle style={{ width: '20px', height: '20px', color: '#dc2626' }} />
            <span style={{ color: '#dc2626', fontSize: 'var(--font-size-base)' }}>
              {error}
            </span>
          </div>
        )}

        {/* Company Details */}
        {company && (
          <div className="card" style={{ marginBottom: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{
                fontSize: 'var(--font-size-xl)',
                fontWeight: '600',
                color: 'var(--gray-900)'
              }}>
                Bedriftsinformasjon fra BRRG
              </h3>
              <button
                onClick={() => handleSyncCompany(company)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.75rem 1.5rem',
                  background: '#10b981',
                  color: 'var(--white)',
                  border: 'none',
                  borderRadius: 'var(--radius-lg)',
                  fontSize: 'var(--font-size-base)',
                  fontWeight: '500',
                  cursor: 'pointer'
                }}
              >
                <RefreshCw style={{ width: '16px', height: '16px' }} />
                Synkroniser til systemet
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
              <div>
                <h4 style={{
                  fontSize: 'var(--font-size-lg)',
                  fontWeight: '600',
                  color: 'var(--gray-900)',
                  marginBottom: '1rem'
                }}>
                  Grunnleggende informasjon
                </h4>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div>
                    <label style={{ fontSize: 'var(--font-size-sm)', color: 'var(--gray-600)', fontWeight: '500' }}>
                      Bedriftsnavn
                    </label>
                    <p style={{ fontSize: 'var(--font-size-base)', color: 'var(--gray-900)', fontWeight: '500' }}>
                      {company.navn}
                    </p>
                  </div>

                  <div>
                    <label style={{ fontSize: 'var(--font-size-sm)', color: 'var(--gray-600)', fontWeight: '500' }}>
                      Organisasjonsnummer
                    </label>
                    <p style={{ fontSize: 'var(--font-size-base)', color: 'var(--gray-900)', fontWeight: '500' }}>
                      {company.organisasjonsnummer}
                    </p>
                  </div>

                  <div>
                    <label style={{ fontSize: 'var(--font-size-sm)', color: 'var(--gray-600)', fontWeight: '500' }}>
                      Organisasjonsform
                    </label>
                    <p style={{ fontSize: 'var(--font-size-base)', color: 'var(--gray-900)' }}>
                      {company.organisasjonsform.beskrivelse} ({company.organisasjonsform.kode})
                    </p>
                  </div>

                  <div>
                    <label style={{ fontSize: 'var(--font-size-sm)', color: 'var(--gray-600)', fontWeight: '500' }}>
                      Registreringsdato
                    </label>
                    <p style={{ fontSize: 'var(--font-size-base)', color: 'var(--gray-900)' }}>
                      {formatDate(company.registreringsdatoEnhetsregisteret)}
                    </p>
                  </div>

                  <div>
                    <label style={{ fontSize: 'var(--font-size-sm)', color: 'var(--gray-600)', fontWeight: '500' }}>
                      Antall ansatte
                    </label>
                    <p style={{ fontSize: 'var(--font-size-base)', color: 'var(--gray-900)' }}>
                      {company.antallAnsatte || 'Ikke oppgitt'}
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <h4 style={{
                  fontSize: 'var(--font-size-lg)',
                  fontWeight: '600',
                  color: 'var(--gray-900)',
                  marginBottom: '1rem'
                }}>
                  Kontakt og adresse
                </h4>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div>
                    <label style={{ fontSize: 'var(--font-size-sm)', color: 'var(--gray-600)', fontWeight: '500' }}>
                      Adresse
                    </label>
                    <p style={{ fontSize: 'var(--font-size-base)', color: 'var(--gray-900)' }}>
                      {company.forretningsadresse.adresse}<br />
                      {company.forretningsadresse.postnummer} {company.forretningsadresse.poststed}<br />
                      {company.forretningsadresse.land}
                    </p>
                  </div>

                  {company.kontaktinformasjon?.telefon && (
                    <div>
                      <label style={{ fontSize: 'var(--font-size-sm)', color: 'var(--gray-600)', fontWeight: '500' }}>
                        Telefon
                      </label>
                      <p style={{ fontSize: 'var(--font-size-base)', color: 'var(--gray-900)' }}>
                        {company.kontaktinformasjon.telefon}
                      </p>
                    </div>
                  )}

                  {company.kontaktinformasjon?.epost && (
                    <div>
                      <label style={{ fontSize: 'var(--font-size-sm)', color: 'var(--gray-600)', fontWeight: '500' }}>
                        E-post
                      </label>
                      <p style={{ fontSize: 'var(--font-size-base)', color: 'var(--gray-900)' }}>
                        {company.kontaktinformasjon.epost}
                      </p>
                    </div>
                  )}

                  <div>
                    <label style={{ fontSize: 'var(--font-size-sm)', color: 'var(--gray-600)', fontWeight: '500' }}>
                      Næringskode
                    </label>
                    <p style={{ fontSize: 'var(--font-size-base)', color: 'var(--gray-900)' }}>
                      {company.naeringskode1.beskrivelse} ({company.naeringskode1.kode})
                    </p>
                  </div>

                  <div>
                    <label style={{ fontSize: 'var(--font-size-sm)', color: 'var(--gray-600)', fontWeight: '500' }}>
                      Registrert i MVA-registeret
                    </label>
                    <p style={{ fontSize: 'var(--font-size-base)', color: 'var(--gray-900)' }}>
                      {company.registrertIMvaregisteret ? 'Ja' : 'Nei'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Search Results */}
        {searchResults.length > 0 && (
          <div className="card">
            <h3 style={{
              fontSize: 'var(--font-size-lg)',
              fontWeight: '600',
              color: 'var(--gray-900)',
              marginBottom: '1.5rem'
            }}>
              Søkeresultater ({searchResults.length})
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {searchResults.map((result, index) => (
                <div
                  key={index}
                  style={{
                    border: '1px solid var(--gray-200)',
                    borderRadius: 'var(--radius-lg)',
                    padding: '1.5rem',
                    background: 'var(--white)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ flex: '1' }}>
                      <h4 style={{
                        fontSize: 'var(--font-size-lg)',
                        fontWeight: '600',
                        color: 'var(--gray-900)',
                        marginBottom: '0.5rem'
                      }}>
                        {result.navn}
                      </h4>
                      <p style={{
                        fontSize: 'var(--font-size-sm)',
                        color: 'var(--gray-600)',
                        marginBottom: '0.5rem'
                      }}>
                        Org.nr: {result.organisasjonsnummer}
                      </p>
                      <p style={{
                        fontSize: 'var(--font-size-sm)',
                        color: 'var(--gray-600)',
                        marginBottom: '0.5rem'
                      }}>
                        {result.forretningsadresse.adresse}, {result.forretningsadresse.postnummer} {result.forretningsadresse.poststed}
                      </p>
                      <p style={{
                        fontSize: 'var(--font-size-sm)',
                        color: 'var(--gray-600)'
                      }}>
                        {result.naeringskode1.beskrivelse}
                      </p>
                    </div>
                    <button
                      onClick={() => setCompany(result)}
                      style={{
                        padding: '0.5rem 1rem',
                        background: 'var(--primary)',
                        color: 'var(--white)',
                        border: 'none',
                        borderRadius: 'var(--radius-md)',
                        fontSize: 'var(--font-size-sm)',
                        fontWeight: '500',
                        cursor: 'pointer'
                      }}
                    >
                      Velg
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Info Section */}
        <div style={{
          background: 'var(--white)',
          border: '1px solid var(--gray-200)',
          borderRadius: 'var(--radius-lg)',
          padding: '2rem',
          marginTop: '3rem'
        }}>
          <h3 style={{
            fontSize: 'var(--font-size-lg)',
            fontWeight: '600',
            color: 'var(--gray-900)',
            marginBottom: '1rem'
          }}>
            Om BRRG-integrasjonen
          </h3>
          <p style={{
            fontSize: 'var(--font-size-base)',
            color: 'var(--gray-600)',
            lineHeight: '1.6',
            marginBottom: '1rem'
          }}>
            Denne integrasjonen henter bedriftsinformasjon direkte fra Brønnøysundregistrene (BRRG) 
            via deres offentlige API. Informasjonen inkluderer bedriftsnavn, organisasjonsnummer, 
            adresse, kontaktinformasjon og andre offentlige registreringsdata.
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ExternalLink style={{ width: '16px', height: '16px', color: 'var(--primary)' }} />
            <a
              href="https://data.brreg.no/enhetsregisteret/api/enheter"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                color: 'var(--primary)',
                textDecoration: 'none',
                fontSize: 'var(--font-size-sm)',
                fontWeight: '500'
              }}
            >
              Se BRRG API-dokumentasjon
            </a>
          </div>
        </div>
      </div>
    </div>
  );
} 