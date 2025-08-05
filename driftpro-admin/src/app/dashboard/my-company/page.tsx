'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Building, 
  FileText, 
  Users, 
  Settings, 
  Shield, 
  Wrench, 
  BarChart3,
  Plus,
  Search,
  Filter,
  Grid,
  List,
  Download
} from 'lucide-react';

export default function MyCompanyPage() {
  const { userProfile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [isMobile, setIsMobile] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Simple state for data
  const [protocols, setProtocols] = useState<any[]>([]);
  const [managementReviews, setManagementReviews] = useState<any[]>([]);
  const [compliance, setCompliance] = useState<any[]>([]);
  const [jsa, setJsa] = useState<any[]>([]);
  const [equipment, setEquipment] = useState<any[]>([]);
  const [workProcesses, setWorkProcesses] = useState<any[]>([]);
  const [orgChart, setOrgChart] = useState<any[]>([]);

  // Simple state for UI
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (userProfile?.companyId) {
      loadCompanyData();
    } else {
      setLoading(false);
    }
  }, [userProfile?.companyId]);

  const loadCompanyData = async () => {
    if (!userProfile?.companyId) {
      console.log('No companyId available, skipping data load');
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      console.log('Loading company data...');
      
      // Simulate data loading with mock data
      setTimeout(() => {
        setProtocols([
          { id: '1', name: 'Sikkerhetsprotokoll', category: 'Sikkerhet', status: 'active', version: '1.0' },
          { id: '2', name: 'Miljøprotokoll', category: 'Miljø', status: 'active', version: '2.1' }
        ]);
        setManagementReviews([
          { id: '1', title: 'Kvartalsgjennomgang Q1', type: 'quarterly', status: 'completed' },
          { id: '2', title: 'Årsgjennomgang 2024', type: 'annual', status: 'planned' }
        ]);
        setCompliance([
          { id: '1', title: 'HMS-samsvar', type: 'regulatory', status: 'compliant' },
          { id: '2', title: 'ISO 9001', type: 'certification', status: 'compliant' }
        ]);
        setJsa([
          { id: '1', title: 'SJA - Arbeid på høyde', jobType: 'Høydearbeid', status: 'approved' },
          { id: '2', title: 'SJA - Elektrisk arbeid', jobType: 'Elektrisk', status: 'review' }
        ]);
        setEquipment([
          { id: '1', name: 'Truck', type: 'vehicle', status: 'operational' },
          { id: '2', name: 'Verktøy sett', type: 'tool', status: 'operational' }
        ]);
        setWorkProcesses([
          { id: '1', name: 'Produksjonsprosess', category: 'operational', status: 'active' },
          { id: '2', name: 'Kvalitetskontroll', category: 'quality', status: 'active' }
        ]);
        setOrgChart([
          { id: '1', name: 'John Doe', position: 'CEO', department: 'Ledelse' },
          { id: '2', name: 'Jane Smith', position: 'Produksjonsleder', department: 'Produksjon' }
        ]);
        
        console.log('✅ Company data loaded successfully!');
        setLoading(false);
      }, 1000);
      
    } catch (error) {
      console.error('❌ Error loading company data:', error);
      setError('Kunne ikke laste bedriftsdata. Vennligst prøv igjen senere.');
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--gray-50)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ 
            width: '80px', 
            height: '80px', 
            border: '4px solid var(--blue-600)', 
            borderTop: '4px solid transparent', 
            borderRadius: '50%', 
            animation: 'spin 1s linear infinite',
            margin: '0 auto'
          }}></div>
          <h2 style={{ marginTop: '1.5rem', color: 'var(--blue-800)', fontSize: '2rem', fontWeight: '700' }}>
            🚀 Min Bedrift
          </h2>
          <p style={{ marginTop: '0.5rem', color: 'var(--gray-600)', fontSize: '1.1rem' }}>
            Laster bedriftsdata...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--gray-50)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', maxWidth: '500px', padding: '2rem' }}>
          <div style={{ 
            width: '80px', 
            height: '80px', 
            background: 'var(--red-100)', 
            borderRadius: '50%', 
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.5rem'
          }}>
            <Shield style={{ width: '40px', height: '40px', color: 'var(--red-600)' }} />
          </div>
          <h2 style={{ color: 'var(--red-800)', fontSize: '1.5rem', fontWeight: '700', marginBottom: '1rem' }}>
            Oops! Noe gikk galt
          </h2>
          <p style={{ color: 'var(--gray-600)', fontSize: '1rem', marginBottom: '1.5rem' }}>
            {error}
          </p>
          <button 
            onClick={() => {
              setError(null);
              loadCompanyData();
            }}
            style={{
              background: 'var(--blue-600)',
              color: 'white',
              border: 'none',
              padding: '0.75rem 1.5rem',
              borderRadius: 'var(--radius-lg)',
              fontSize: '1rem',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            Prøv igjen
          </button>
        </div>
      </div>
    );
  }

  if (!userProfile) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--gray-50)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', maxWidth: '500px', padding: '2rem' }}>
          <div style={{ 
            width: '80px', 
            height: '80px', 
            background: 'var(--yellow-100)', 
            borderRadius: '50%', 
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.5rem'
          }}>
            <Users style={{ width: '40px', height: '40px', color: 'var(--yellow-600)' }} />
          </div>
          <h2 style={{ color: 'var(--yellow-800)', fontSize: '1.5rem', fontWeight: '700', marginBottom: '1rem' }}>
            Ingen brukerinformasjon
          </h2>
          <p style={{ color: 'var(--gray-600)', fontSize: '1rem' }}>
            Vennligst logg inn på nytt for å få tilgang til Min Bedrift.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--gray-50)' }}>
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, var(--blue-600) 0%, var(--purple-600) 100%)', boxShadow: 'var(--shadow-lg)', borderBottom: '1px solid var(--gray-200)', padding: '2rem' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ background: 'rgba(255,255,255,0.2)', padding: '0.75rem', borderRadius: 'var(--radius-lg)' }}>
                <Building style={{ width: '32px', height: '32px', color: 'white' }} />
              </div>
              <div>
                <h1 style={{ fontSize: '2.5rem', fontWeight: '800', color: 'white', margin: '0' }}>
                  🚀 Min Bedrift
                </h1>
                <p style={{ color: 'rgba(255,255,255,0.9)', fontSize: '1.1rem', margin: '0.25rem 0 0 0' }}>
                  Enterprise Management Platform
                </p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button 
                className="btn btn-outline" 
                style={{ 
                  background: 'rgba(255,255,255,0.1)', 
                  border: '1px solid rgba(255,255,255,0.3)', 
                  color: 'white',
                  padding: '0.75rem 1.5rem'
                }}
                onClick={() => loadCompanyData()}
              >
                <Settings style={{ width: '18px', height: '18px', marginRight: '0.5rem' }} />
                Oppdater Data
              </button>
              <button 
                className="btn btn-primary" 
                style={{ 
                  background: 'var(--green-600)', 
                  border: 'none', 
                  color: 'white',
                  padding: '0.75rem 1.5rem'
                }}
              >
                <Plus style={{ width: '18px', height: '18px', marginRight: '0.5rem' }} />
                Ny Modul
              </button>
            </div>
          </div>
          
          {/* Status Indicators */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            <div style={{ background: 'rgba(255,255,255,0.1)', padding: '1rem', borderRadius: 'var(--radius-lg)', border: '1px solid rgba(255,255,255,0.2)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <FileText style={{ width: '16px', height: '16px', color: 'white' }} />
                <span style={{ color: 'white', fontSize: '0.875rem', fontWeight: '600' }}>
                  {protocols.length} protokoller
                </span>
              </div>
              <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.75rem', margin: '0' }}>
                {compliance.length} samsvarskrav
              </p>
            </div>
            
            <div style={{ background: 'rgba(255,255,255,0.1)', padding: '1rem', borderRadius: 'var(--radius-lg)', border: '1px solid rgba(255,255,255,0.2)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <Users style={{ width: '16px', height: '16px', color: 'white' }} />
                <span style={{ color: 'white', fontSize: '0.875rem', fontWeight: '600' }}>
                  {managementReviews.length} gjennomganger
                </span>
              </div>
              <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.75rem', margin: '0' }}>
                {jsa.length} SJA analyser
              </p>
            </div>
            
            <div style={{ background: 'rgba(255,255,255,0.1)', padding: '1rem', borderRadius: 'var(--radius-lg)', border: '1px solid rgba(255,255,255,0.2)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <Wrench style={{ width: '16px', height: '16px', color: 'white' }} />
                <span style={{ color: 'white', fontSize: '0.875rem', fontWeight: '600' }}>
                  {equipment.length} utstyr
                </span>
              </div>
              <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.75rem', margin: '0' }}>
                {workProcesses.length} prosesser
              </p>
            </div>
            
            <div style={{ background: 'rgba(255,255,255,0.1)', padding: '1rem', borderRadius: 'var(--radius-lg)', border: '1px solid rgba(255,255,255,0.2)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <BarChart3 style={{ width: '16px', height: '16px', color: 'white' }} />
                <span style={{ color: 'white', fontSize: '0.875rem', fontWeight: '600' }}>
                  {orgChart.length} ansatte
                </span>
              </div>
              <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.75rem', margin: '0' }}>
                Organisasjonskart
              </p>
            </div>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '2rem 1rem' }}>
        {/* Tab Navigation */}
        <div style={{ marginBottom: '2rem', background: 'var(--white)', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-md)', padding: '1rem' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {[
              { id: 'overview', label: '🚀 Oversikt', icon: Building, count: protocols.length + compliance.length + managementReviews.length, color: 'var(--blue-600)' },
              { id: 'protocols', label: '📋 Protokoller', icon: FileText, count: protocols.length, color: 'var(--green-600)' },
              { id: 'management', label: '👥 Ledelsesgjennomgang', icon: Users, count: managementReviews.length, color: 'var(--purple-600)' },
              { id: 'compliance', label: '🛡️ Samsvar', icon: Shield, count: compliance.length, color: 'var(--orange-600)' },
              { id: 'jsa', label: '⚠️ SJA', icon: Shield, count: jsa.length, color: 'var(--red-600)' },
              { id: 'equipment', label: '🔧 Utstyr & FDV', icon: Wrench, count: equipment.length, color: 'var(--indigo-600)' },
              { id: 'processes', label: '⚙️ Arbeidsprosesser', icon: Settings, count: workProcesses.length, color: 'var(--pink-600)' },
              { id: 'orgchart', label: '📊 Org. Kart', icon: BarChart3, count: orgChart.length, color: 'var(--teal-600)' }
            ].map((tab) => {
              const IconComponent = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    padding: '1rem 1.5rem',
                    border: 'none',
                    background: activeTab === tab.id ? tab.color : 'var(--gray-50)',
                    cursor: 'pointer',
                    borderRadius: 'var(--radius-lg)',
                    color: activeTab === tab.id ? 'white' : 'var(--gray-700)',
                    fontWeight: activeTab === tab.id ? '700' : '600',
                    fontSize: 'var(--font-size-sm)',
                    whiteSpace: 'nowrap',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    transition: 'all 0.2s ease',
                    boxShadow: activeTab === tab.id ? '0 4px 12px rgba(0,0,0,0.15)' : 'none',
                    transform: activeTab === tab.id ? 'translateY(-2px)' : 'none'
                  }}
                >
                  <IconComponent style={{ width: '18px', height: '18px' }} />
                  <span>{tab.label}</span>
                  <div style={{ 
                    background: activeTab === tab.id ? 'rgba(255,255,255,0.2)' : 'var(--gray-200)', 
                    color: activeTab === tab.id ? 'white' : 'var(--gray-600)',
                    padding: '0.25rem 0.5rem', 
                    borderRadius: 'var(--radius-full)', 
                    fontSize: '0.75rem', 
                    fontWeight: '700',
                    minWidth: '20px',
                    textAlign: 'center'
                  }}>
                    {tab.count}
                  </div>
                </button>
              );
            })}
          </div>
          
          {/* Search and Filters */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--gray-200)' }}>
            <div style={{ position: 'relative', flex: '1' }}>
              <Search style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', width: '18px', height: '18px', color: 'var(--gray-400)' }} />
              <input
                type="text"
                placeholder="🔍 Søk i alle moduler..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem 0.75rem 2.5rem',
                  border: '1px solid var(--gray-300)',
                  borderRadius: 'var(--radius-lg)',
                  fontSize: 'var(--font-size-sm)',
                  background: 'var(--white)'
                }}
              />
            </div>
            
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              style={{
                padding: '0.75rem 1rem',
                border: '1px solid var(--gray-300)',
                borderRadius: 'var(--radius-lg)',
                fontSize: 'var(--font-size-sm)',
                background: 'var(--white)',
                minWidth: '150px'
              }}
            >
              <option value="all">📂 Alle kategorier</option>
              <option value="Sikkerhet">🛡️ Sikkerhet</option>
              <option value="Miljø">🌱 Miljø</option>
              <option value="Kvalitet">✅ Kvalitet</option>
              <option value="HMS">⚡ HMS</option>
              <option value="Prosess">⚙️ Prosess</option>
            </select>
            
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              style={{
                padding: '0.75rem 1rem',
                border: '1px solid var(--gray-300)',
                borderRadius: 'var(--radius-lg)',
                fontSize: 'var(--font-size-sm)',
                background: 'var(--white)',
                minWidth: '150px'
              }}
            >
              <option value="all">📊 Alle statuser</option>
              <option value="active">✅ Aktiv</option>
              <option value="draft">📝 Kladd</option>
              <option value="review">👀 Under gjennomgang</option>
              <option value="approved">✅ Godkjent</option>
              <option value="archived">📦 Arkivert</option>
            </select>
            
            <button
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              style={{
                padding: '0.75rem 1rem',
                border: '1px solid var(--gray-300)',
                borderRadius: 'var(--radius-lg)',
                fontSize: 'var(--font-size-sm)',
                background: showAdvancedFilters ? 'var(--blue-50)' : 'var(--white)',
                color: showAdvancedFilters ? 'var(--blue-700)' : 'var(--gray-700)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              <Filter style={{ width: '16px', height: '16px' }} />
              Avanserte filtre
            </button>
            
            <button
              onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
              style={{
                padding: '0.75rem 1rem',
                border: '1px solid var(--gray-300)',
                borderRadius: 'var(--radius-lg)',
                fontSize: 'var(--font-size-sm)',
                background: 'var(--white)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              {viewMode === 'grid' ? <List style={{ width: '16px', height: '16px' }} /> : <Grid style={{ width: '16px', height: '16px' }} />}
              {viewMode === 'grid' ? 'Liste' : 'Grid'}
            </button>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div>
            <h2 style={{ fontSize: 'var(--font-size-xl)', fontWeight: '600', color: 'var(--gray-900)', marginBottom: '1.5rem' }}>
              Bedriftsoversikt
            </h2>
            
            {/* Statistics Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
              <div className="card">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <p style={{ fontSize: 'var(--font-size-sm)', fontWeight: '500', color: 'var(--gray-600)', marginBottom: '0.5rem' }}>Aktive protokoller</p>
                    <p style={{ fontSize: 'var(--font-size-3xl)', fontWeight: '700', color: 'var(--gray-900)' }}>
                      {protocols.length}
                    </p>
                    <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--gray-500)' }}>
                      {protocols.filter(p => p.status === 'active').length} aktive
                    </p>
                  </div>
                  <div style={{ background: 'var(--blue-100)', padding: '0.75rem', borderRadius: 'var(--radius-lg)' }}>
                    <FileText style={{ width: '24px', height: '24px', color: 'var(--blue-600)' }} />
                  </div>
                </div>
              </div>

              <div className="card">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <p style={{ fontSize: 'var(--font-size-sm)', fontWeight: '500', color: 'var(--gray-600)', marginBottom: '0.5rem' }}>Samsvarskrav</p>
                    <p style={{ fontSize: 'var(--font-size-3xl)', fontWeight: '700', color: 'var(--gray-900)' }}>
                      {compliance.length}
                    </p>
                    <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--gray-500)' }}>
                      {compliance.filter(c => c.status === 'compliant').length} compliant
                    </p>
                  </div>
                  <div style={{ background: 'var(--green-100)', padding: '0.75rem', borderRadius: 'var(--radius-lg)' }}>
                    <Shield style={{ width: '24px', height: '24px', color: 'var(--green-600)' }} />
                  </div>
                </div>
              </div>

              <div className="card">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <p style={{ fontSize: 'var(--font-size-sm)', fontWeight: '500', color: 'var(--gray-600)', marginBottom: '0.5rem' }}>Ledelsesgjennomganger</p>
                    <p style={{ fontSize: 'var(--font-size-3xl)', fontWeight: '700', color: 'var(--gray-900)' }}>
                      {managementReviews.length}
                    </p>
                    <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--gray-500)' }}>
                      {managementReviews.filter(r => r.status === 'completed').length} fullført
                    </p>
                  </div>
                  <div style={{ background: 'var(--purple-100)', padding: '0.75rem', borderRadius: 'var(--radius-lg)' }}>
                    <Users style={{ width: '24px', height: '24px', color: 'var(--purple-600)' }} />
                  </div>
                </div>
              </div>

              <div className="card">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <p style={{ fontSize: 'var(--font-size-sm)', fontWeight: '500', color: 'var(--gray-600)', marginBottom: '0.5rem' }}>SJA analyser</p>
                    <p style={{ fontSize: 'var(--font-size-3xl)', fontWeight: '700', color: 'var(--gray-900)' }}>
                      {jsa.length}
                    </p>
                    <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--gray-500)' }}>
                      {jsa.filter(j => j.status === 'approved').length} godkjent
                    </p>
                  </div>
                  <div style={{ background: 'var(--orange-100)', padding: '0.75rem', borderRadius: 'var(--radius-lg)' }}>
                    <Shield style={{ width: '24px', height: '24px', color: 'var(--orange-600)' }} />
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="card">
              <div style={{ padding: '1.5rem' }}>
                <h3 style={{ fontSize: 'var(--font-size-lg)', fontWeight: '600', color: 'var(--gray-900)', marginBottom: '1rem' }}>
                  Siste aktivitet
                </h3>
                <div style={{ display: 'grid', gap: '1rem' }}>
                  {protocols.slice(0, 3).map((protocol) => (
                    <div key={protocol.id} style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '1rem',
                      padding: '1rem',
                      background: 'var(--gray-50)',
                      borderRadius: 'var(--radius-lg)'
                    }}>
                      <div style={{ background: 'var(--blue-100)', padding: '0.5rem', borderRadius: 'var(--radius-lg)' }}>
                        <FileText style={{ width: '16px', height: '16px', color: 'var(--blue-600)' }} />
                      </div>
                      <div style={{ flex: '1' }}>
                        <p style={{ fontWeight: '600', color: 'var(--gray-900)', marginBottom: '0.25rem' }}>
                          {protocol.name}
                        </p>
                        <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--gray-600)' }}>
                          {protocol.category} • {protocol.status}
                        </p>
                      </div>
                      <div style={{ 
                        padding: '0.25rem 0.5rem', 
                        background: protocol.status === 'active' ? 'var(--green-100)' : 'var(--yellow-100)',
                        color: protocol.status === 'active' ? 'var(--green-700)' : 'var(--yellow-700)',
                        borderRadius: 'var(--radius-full)',
                        fontSize: 'var(--font-size-xs)',
                        fontWeight: '600'
                      }}>
                        {protocol.status}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Protocols Tab */}
        {activeTab === 'protocols' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: 'var(--font-size-xl)', fontWeight: '600', color: 'var(--gray-900)' }}>
                Protokoller
              </h2>
              <button className="btn btn-primary">
                <Plus style={{ width: '16px', height: '16px', marginRight: '0.5rem' }} />
                Ny protokoll
              </button>
            </div>

            <div className="card">
              <div style={{ padding: '1.5rem' }}>
                <div style={{ display: 'grid', gap: '1rem' }}>
                  {protocols.map((protocol) => (
                    <div key={protocol.id} style={{ 
                      border: '1px solid var(--gray-200)', 
                      borderRadius: 'var(--radius-lg)', 
                      padding: '1.5rem',
                      background: 'var(--white)'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                        <div style={{ flex: '1' }}>
                          <h3 style={{ fontSize: 'var(--font-size-lg)', fontWeight: '600', color: 'var(--gray-900)', marginBottom: '0.5rem' }}>
                            {protocol.name}
                          </h3>
                          <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                            <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--gray-600)' }}>
                              {protocol.category}
                            </span>
                            <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--gray-600)' }}>
                              Versjon {protocol.version}
                            </span>
                            <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--gray-600)' }}>
                              {protocol.status}
                            </span>
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button className="btn btn-sm btn-outline">
                            <FileText style={{ width: '16px', height: '16px' }} />
                          </button>
                          <button className="btn btn-sm btn-outline">
                            <Settings style={{ width: '16px', height: '16px' }} />
                          </button>
                          <button className="btn btn-sm btn-outline">
                            <Download style={{ width: '16px', height: '16px' }} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Other tabs can be added similarly */}
        {activeTab !== 'overview' && activeTab !== 'protocols' && (
          <div>
            <h2 style={{ fontSize: 'var(--font-size-xl)', fontWeight: '600', color: 'var(--gray-900)', marginBottom: '1.5rem' }}>
              {activeTab === 'management' && 'Ledelsesgjennomgang'}
              {activeTab === 'compliance' && 'Samsvar'}
              {activeTab === 'jsa' && 'SJA'}
              {activeTab === 'equipment' && 'Utstyr & FDV'}
              {activeTab === 'processes' && 'Arbeidsprosesser'}
              {activeTab === 'orgchart' && 'Organisasjonskart'}
            </h2>
            <div className="card">
              <div style={{ padding: '1.5rem', textAlign: 'center' }}>
                <p style={{ color: 'var(--gray-600)' }}>
                  Denne funksjonen er under utvikling. Kom tilbake senere!
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 