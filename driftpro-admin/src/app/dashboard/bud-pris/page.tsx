'use client';

import { useState, useEffect } from 'react';
import { Search, MapPin, Package, Clock, DollarSign, Truck, ArrowLeft } from 'lucide-react';

interface PostcodeData {
  postcode: string;
  city: string;
  county: string;
  region: string;
}

interface BudPrisData {
  id: string;
  postcode: string;
  city: string;
  basePrice: number;
  distancePrice: number;
  weightPrice: number;
  timePrice: number;
  totalPrice: number;
  estimatedTime: string;
  serviceType: string;
}

export default function BudPrisPage() {
  const [postcode, setPostcode] = useState('');
  const [postcodeResults, setPostcodeResults] = useState<PostcodeData[]>([]);
  const [showPostcodeSearch, setShowPostcodeSearch] = useState(false);
  const [searchingPostcode, setSearchingPostcode] = useState(false);
  const [selectedPostcode, setSelectedPostcode] = useState<PostcodeData | null>(null);
  const [budPrisData, setBudPrisData] = useState<BudPrisData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Mock postcode data - replace with real API
  const mockPostcodeData: PostcodeData[] = [
    { postcode: '0100', city: 'Oslo', county: 'Oslo', region: 'Østlandet' },
    { postcode: '0150', city: 'Oslo', county: 'Oslo', region: 'Østlandet' },
    { postcode: '0160', city: 'Oslo', county: 'Oslo', region: 'Østlandet' },
    { postcode: '0201', city: 'Oslo', county: 'Oslo', region: 'Østlandet' },
    { postcode: '5003', city: 'Bergen', county: 'Vestland', region: 'Vestlandet' },
    { postcode: '5004', city: 'Bergen', county: 'Vestland', region: 'Vestlandet' },
    { postcode: '5005', city: 'Bergen', county: 'Vestland', region: 'Vestlandet' },
    { postcode: '5006', city: 'Bergen', county: 'Vestland', region: 'Vestlandet' },
    { postcode: '7001', city: 'Trondheim', county: 'Trøndelag', region: 'Trøndelag' },
    { postcode: '7002', city: 'Trondheim', county: 'Trøndelag', region: 'Trøndelag' },
    { postcode: '7003', city: 'Trondheim', county: 'Trøndelag', region: 'Trøndelag' },
    { postcode: '7004', city: 'Trondheim', county: 'Trøndelag', region: 'Trøndelag' },
    { postcode: '4001', city: 'Stavanger', county: 'Rogaland', region: 'Vestlandet' },
    { postcode: '4002', city: 'Stavanger', county: 'Rogaland', region: 'Vestlandet' },
    { postcode: '4003', city: 'Stavanger', county: 'Rogaland', region: 'Vestlandet' },
    { postcode: '4004', city: 'Stavanger', county: 'Rogaland', region: 'Vestlandet' },
  ];

  // Search postcode function
  const searchPostcode = async (query: string) => {
    console.log('🔍 Searching postcode:', query);
    
    if (!query.trim()) {
      setPostcodeResults([]);
      return;
    }

    setSearchingPostcode(true);
    try {
      // Filter mock data based on query
      const filteredResults = mockPostcodeData.filter(data => 
        data.postcode.includes(query) ||
        data.city.toLowerCase().includes(query.toLowerCase())
      );
      
      console.log('✅ Postcode results:', filteredResults);
      setPostcodeResults(filteredResults);
    } catch (error) {
      console.error('❌ Error searching postcode:', error);
      setError('Feil ved søk i postkoder');
    } finally {
      setSearchingPostcode(false);
    }
  };

  // Select postcode
  const selectPostcode = (data: PostcodeData) => {
    setSelectedPostcode(data);
    setPostcode(data.postcode);
    setShowPostcodeSearch(false);
    setPostcodeResults([]);
    loadBudPrisData(data.postcode);
  };

  // Load bud pris data based on postcode
  const loadBudPrisData = async (postcode: string) => {
    setLoading(true);
    try {
      // Mock bud pris data - replace with real API
      const mockBudPrisData: BudPrisData[] = [
        {
          id: '1',
          postcode: postcode,
          city: selectedPostcode?.city || 'Ukjent',
          basePrice: 150,
          distancePrice: 25,
          weightPrice: 10,
          timePrice: 5,
          totalPrice: 190,
          estimatedTime: '2-4 timer',
          serviceType: 'Standard levering'
        },
        {
          id: '2',
          postcode: postcode,
          city: selectedPostcode?.city || 'Ukjent',
          basePrice: 200,
          distancePrice: 35,
          weightPrice: 15,
          timePrice: 10,
          totalPrice: 260,
          estimatedTime: '1-2 timer',
          serviceType: 'Express levering'
        },
        {
          id: '3',
          postcode: postcode,
          city: selectedPostcode?.city || 'Ukjent',
          basePrice: 300,
          distancePrice: 50,
          weightPrice: 25,
          timePrice: 15,
          totalPrice: 390,
          estimatedTime: '30-60 minutter',
          serviceType: 'Same-day levering'
        }
      ];
      
      setBudPrisData(mockBudPrisData);
    } catch (error) {
      console.error('Error loading bud pris data:', error);
      setError('Feil ved lasting av bud pris data');
    } finally {
      setLoading(false);
    }
  };

  // Close postcode search when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showPostcodeSearch) {
        const target = event.target as HTMLElement;
        if (!target.closest('[data-postcode-search]')) {
          setShowPostcodeSearch(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showPostcodeSearch]);

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
          <button
            onClick={() => window.history.back()}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.5rem',
              border: '1px solid #d1d5db',
              borderRadius: '8px',
              background: 'white',
              cursor: 'pointer',
              fontSize: '0.875rem'
            }}
          >
            <ArrowLeft style={{ width: '16px', height: '16px' }} />
            Tilbake
          </button>
          <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#1f2937', margin: 0 }}>
            Bud Pris
          </h1>
        </div>
        <p style={{ color: '#6b7280', fontSize: '1.1rem' }}>
          Søk opp postkode for å se tilgjengelige bud priser og leveringstider
        </p>
      </div>

      {/* Postcode Search */}
      <div style={{ marginBottom: '2rem' }}>
        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#374151' }}>
          Postkode
        </label>
        <div style={{ position: 'relative' }} data-postcode-search>
          <input
            type="text"
            placeholder="Skriv postkode eller bynavn..."
            value={postcode}
            onChange={(e) => {
              const value = e.target.value;
              setPostcode(value);
              if (value.length >= 2) {
                searchPostcode(value);
                setShowPostcodeSearch(true);
              } else {
                setShowPostcodeSearch(false);
              }
            }}
            onFocus={() => {
              if (postcode.length >= 2) {
                setShowPostcodeSearch(true);
              }
            }}
            style={{
              width: '100%',
              padding: '0.75rem',
              border: '1px solid #d1d5db',
              borderRadius: '8px',
              fontSize: '1rem',
              paddingRight: '3rem'
            }}
          />
          <button
            type="button"
            onClick={() => {
              if (postcode.length >= 2) {
                searchPostcode(postcode);
                setShowPostcodeSearch(true);
              }
            }}
            style={{
              position: 'absolute',
              right: '0.75rem',
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Search style={{ width: '20px', height: '20px', color: '#6b7280' }} />
          </button>
        </div>

        {/* Postcode Search Results */}
        {showPostcodeSearch && (
          <div style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            background: 'white',
            border: '1px solid #d1d5db',
            borderRadius: '8px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            zIndex: 1000,
            maxHeight: '200px',
            overflowY: 'auto',
            marginTop: '0.25rem'
          }}>
            {postcodeResults.length > 0 ? (
              postcodeResults.map((data) => (
                <div
                  key={`${data.postcode}-${data.city}`}
                  onClick={() => selectPostcode(data)}
                  style={{
                    padding: '0.75rem',
                    cursor: 'pointer',
                    borderBottom: '1px solid #f3f4f6',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#f9fafb';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'white';
                  }}
                >
                  <div>
                    <div style={{ fontWeight: '500', color: '#1f2937' }}>
                      {data.postcode} - {data.city}
                    </div>
                    <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                      {data.county} • {data.region}
                    </div>
                  </div>
                  <MapPin style={{ width: '16px', height: '16px', color: '#6b7280' }} />
                </div>
              ))
            ) : (
              <div style={{ padding: '1rem', textAlign: 'center', color: '#6b7280' }}>
                {searchingPostcode ? 'Søker...' : 'Ingen resultater funnet'}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Selected Postcode Info */}
      {selectedPostcode && (
        <div style={{
          background: '#f0f9ff',
          border: '1px solid #0ea5e9',
          borderRadius: '8px',
          padding: '1rem',
          marginBottom: '2rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <MapPin style={{ width: '20px', height: '20px', color: '#0ea5e9' }} />
            <h3 style={{ margin: 0, color: '#0c4a6e', fontSize: '1.1rem' }}>
              Valgt område: {selectedPostcode.postcode} - {selectedPostcode.city}
            </h3>
          </div>
          <p style={{ margin: 0, color: '#0c4a6e', fontSize: '0.9rem' }}>
            {selectedPostcode.county} • {selectedPostcode.region}
          </p>
        </div>
      )}

      {/* Bud Pris Results */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <div style={{ fontSize: '1.1rem', color: '#6b7280' }}>Laster bud pris data...</div>
        </div>
      ) : budPrisData.length > 0 ? (
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1f2937', marginBottom: '1rem' }}>
            Tilgjengelige Bud Priser
          </h2>
          <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
            {budPrisData.map((bud) => (
              <div
                key={bud.id}
                style={{
                  background: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '12px',
                  padding: '1.5rem',
                  boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                  <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '600', color: '#1f2937' }}>
                    {bud.serviceType}
                  </h3>
                  <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#059669' }}>
                    {bud.totalPrice} kr
                  </div>
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <Clock style={{ width: '16px', height: '16px', color: '#6b7280' }} />
                    <span style={{ fontSize: '0.9rem', color: '#6b7280' }}>
                      Estimat: {bud.estimatedTime}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <MapPin style={{ width: '16px', height: '16px', color: '#6b7280' }} />
                    <span style={{ fontSize: '0.9rem', color: '#6b7280' }}>
                      {bud.postcode} - {bud.city}
                    </span>
                  </div>
                </div>

                <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '1rem' }}>
                  <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '1rem', fontWeight: '500', color: '#374151' }}>
                    Prisdetaljer:
                  </h4>
                  <div style={{ display: 'grid', gap: '0.25rem', fontSize: '0.875rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#6b7280' }}>Grunnpris:</span>
                      <span style={{ color: '#374151' }}>{bud.basePrice} kr</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#6b7280' }}>Avstand:</span>
                      <span style={{ color: '#374151' }}>{bud.distancePrice} kr</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#6b7280' }}>Vekt:</span>
                      <span style={{ color: '#374151' }}>{bud.weightPrice} kr</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#6b7280' }}>Tid:</span>
                      <span style={{ color: '#374151' }}>{bud.timePrice} kr</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #e5e7eb', paddingTop: '0.25rem', fontWeight: '600' }}>
                      <span style={{ color: '#1f2937' }}>Total:</span>
                      <span style={{ color: '#059669' }}>{bud.totalPrice} kr</span>
                    </div>
                  </div>
                </div>

                <button
                  style={{
                    width: '100%',
                    marginTop: '1rem',
                    padding: '0.75rem',
                    background: '#3b82f6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '1rem',
                    fontWeight: '500',
                    cursor: 'pointer'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#2563eb';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = '#3b82f6';
                  }}
                >
                  Velg denne prisen
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : selectedPostcode ? (
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <Package style={{ width: '48px', height: '48px', color: '#6b7280', margin: '0 auto 1rem' }} />
          <h3 style={{ color: '#6b7280', marginBottom: '0.5rem' }}>Ingen bud priser tilgjengelig</h3>
          <p style={{ color: '#9ca3af' }}>Det er ingen bud priser tilgjengelig for dette området.</p>
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <Search style={{ width: '48px', height: '48px', color: '#6b7280', margin: '0 auto 1rem' }} />
          <h3 style={{ color: '#6b7280', marginBottom: '0.5rem' }}>Søk etter postkode</h3>
          <p style={{ color: '#9ca3af' }}>Skriv inn en postkode eller bynavn for å se tilgjengelige bud priser.</p>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div style={{
          background: '#fef2f2',
          border: '1px solid #fecaca',
          borderRadius: '8px',
          padding: '1rem',
          marginTop: '1rem',
          color: '#dc2626'
        }}>
          {error}
        </div>
      )}
    </div>
  );
}
