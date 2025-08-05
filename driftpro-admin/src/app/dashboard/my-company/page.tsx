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
  Workflow, 
  BarChart3,
  Plus,
  Search,
  Filter,
  Download,
  Edit,
  Eye,
  Calendar,
  ChevronDown,
  Save,
  RefreshCw,
  Activity,
  Info,
  Clipboard,

} from 'lucide-react';

export default function MyCompanyPage() {
  const { userProfile } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  // State for different modules
  const [protocols, setProtocols] = useState<any[]>([]);
  const [managementReviews, setManagementReviews] = useState<any[]>([]);
  const [compliance, setCompliance] = useState<any[]>([]);
  const [jsa, setJsa] = useState<any[]>([]);
  const [equipment, setEquipment] = useState<any[]>([]);
  const [workProcesses, setWorkProcesses] = useState<any[]>([]);
  const [orgChart, setOrgChart] = useState<any[]>([]);

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
    }
  }, [userProfile?.companyId]);

  const loadCompanyData = async () => {
    try {
      setLoading(true);
      // Load data for all modules
      // This would be replaced with actual API calls
      await Promise.all([
        loadProtocols(),
        loadManagementReviews(),
        loadCompliance(),
        loadJSA(),
        loadEquipment(),
        loadWorkProcesses(),
        loadOrgChart()
      ]);
    } catch (error) {
      console.error('Error loading company data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadProtocols = async () => {
    // Simulate loading protocols
    setProtocols([
      { id: 1, name: 'Sikkerhetsprotokoll', status: 'active', version: '2.1', lastUpdated: '2024-01-15', category: 'Sikkerhet' },
      { id: 2, name: 'Miljøprotokoll', status: 'draft', version: '1.3', lastUpdated: '2024-01-10', category: 'Miljø' },
      { id: 3, name: 'Kvalitetsprotokoll', status: 'active', version: '3.0', lastUpdated: '2024-01-20', category: 'Kvalitet' }
    ]);
  };

  const loadManagementReviews = async () => {
    setManagementReviews([
      { id: 1, title: 'Q1 2024 Ledelsesgjennomgang', date: '2024-03-15', status: 'completed', participants: 8, findings: 12 },
      { id: 2, title: 'Q4 2023 Ledelsesgjennomgang', date: '2023-12-20', status: 'completed', participants: 6, findings: 8 },
      { id: 3, title: 'Q1 2025 Ledelsesgjennomgang', date: '2025-03-15', status: 'scheduled', participants: 0, findings: 0 }
    ]);
  };

  const loadCompliance = async () => {
    setCompliance([
      { id: 1, regulation: 'Arbeidsmiljøloven', status: 'compliant', lastCheck: '2024-01-15', nextCheck: '2024-07-15', risk: 'low' },
      { id: 2, regulation: 'Miljøloven', status: 'review', lastCheck: '2024-01-10', nextCheck: '2024-04-10', risk: 'medium' },
      { id: 3, regulation: 'Sikkerhetsloven', status: 'compliant', lastCheck: '2024-01-20', nextCheck: '2024-07-20', risk: 'low' }
    ]);
  };

  const loadJSA = async () => {
    setJsa([
      { id: 1, activity: 'Høydearbeid', department: 'Produksjon', riskLevel: 'high', lastUpdated: '2024-01-15', status: 'active' },
      { id: 2, activity: 'Kjemisk håndtering', department: 'Laboratorium', riskLevel: 'medium', lastUpdated: '2024-01-10', status: 'active' },
      { id: 3, activity: 'Maskinoperasjon', department: 'Verksted', riskLevel: 'low', lastUpdated: '2024-01-20', status: 'active' }
    ]);
  };

  const loadEquipment = async () => {
    setEquipment([
      { id: 1, name: 'Kran A-101', type: 'Mobilkran', status: 'operational', lastInspection: '2024-01-15', nextInspection: '2024-07-15' },
      { id: 2, name: 'Kompressor B-205', type: 'Luftkompressor', status: 'maintenance', lastInspection: '2024-01-10', nextInspection: '2024-04-10' },
      { id: 3, name: 'Generator C-301', type: 'Nødgenerator', status: 'operational', lastInspection: '2024-01-20', nextInspection: '2024-07-20' }
    ]);
  };

  const loadWorkProcesses = async () => {
    setWorkProcesses([
      { id: 1, name: 'Produksjonsprosess A', department: 'Produksjon', status: 'active', version: '2.1', lastUpdated: '2024-01-15' },
      { id: 2, name: 'Kvalitetskontroll', department: 'Kvalitet', status: 'active', version: '1.5', lastUpdated: '2024-01-10' },
      { id: 3, name: 'Vedlikeholdsprosess', department: 'Vedlikehold', status: 'draft', version: '1.0', lastUpdated: '2024-01-20' }
    ]);
  };

  const loadOrgChart = async () => {
    setOrgChart([
      { id: 1, name: 'John Doe', position: 'CEO', department: 'Ledelse', reportsTo: null, employees: 5 },
      { id: 2, name: 'Jane Smith', position: 'Produksjonsleder', department: 'Produksjon', reportsTo: 1, employees: 3 },
      { id: 3, name: 'Bob Johnson', position: 'Kvalitetsleder', department: 'Kvalitet', reportsTo: 1, employees: 2 }
    ]);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
      case 'completed':
      case 'compliant':
      case 'operational':
        return 'bg-green-100 text-green-800';
      case 'draft':
      case 'scheduled':
      case 'maintenance':
        return 'bg-yellow-100 text-yellow-800';
      case 'review':
        return 'bg-blue-100 text-blue-800';
      case 'inactive':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low':
        return 'bg-green-100 text-green-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'high':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('nb-NO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Laster bedriftsdata...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--gray-50)' }}>
      {/* Header */}
      <div style={{ background: 'var(--white)', boxShadow: 'var(--shadow-sm)', borderBottom: '1px solid var(--gray-200)', padding: '1.5rem 2rem' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h1 style={{ fontSize: 'var(--font-size-2xl)', fontWeight: '700', color: 'var(--gray-900)' }}>Min Bedrift</h1>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button className="btn btn-secondary">
              <RefreshCw style={{ width: '16px', height: '16px', marginRight: '0.5rem' }} />
              Oppdater
            </button>
            <button className="btn btn-primary">
              <Plus style={{ width: '16px', height: '16px', marginRight: '0.5rem' }} />
              Ny modul
            </button>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '2rem 1rem' }}>
        {/* Tab Navigation */}
        <div style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', borderBottom: '2px solid var(--gray-200)', gap: '0' }}>
            {[
              { id: 'overview', label: 'Oversikt', icon: Building },
              { id: 'protocols', label: 'Protokoller', icon: FileText },
              { id: 'management', label: 'Ledelsesgjennomgang', icon: Users },
              { id: 'compliance', label: 'Samsvar', icon: Shield },
              { id: 'jsa', label: 'SJA', icon: Clipboard },
              { id: 'equipment', label: 'Utstyr & FDV', icon: Wrench },
              { id: 'processes', label: 'Arbeidsprosesser', icon: Workflow },
              { id: 'orgchart', label: 'Org. Kart', icon: BarChart3 }
            ].map((tab) => {
              const IconComponent = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    padding: '1rem 1.5rem',
                    border: 'none',
                    background: 'transparent',
                    cursor: 'pointer',
                    borderBottom: activeTab === tab.id ? '2px solid var(--primary)' : '2px solid transparent',
                    color: activeTab === tab.id ? 'var(--primary)' : 'var(--gray-600)',
                    fontWeight: activeTab === tab.id ? '600' : '500',
                    fontSize: 'var(--font-size-sm)',
                    whiteSpace: 'nowrap'
                  }}
                >
                  <IconComponent style={{ width: '16px', height: '16px', marginRight: '0.5rem', display: 'inline' }} />
                  {tab.label}
                </button>
              );
            })}
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
                    <p style={{ fontSize: 'var(--font-size-3xl)', fontWeight: '700', color: 'var(--gray-900)' }}>{protocols.filter(p => p.status === 'active').length}</p>
                  </div>
                  <div style={{ background: 'var(--blue-100)', padding: '0.75rem', borderRadius: 'var(--radius-lg)' }}>
                    <FileText style={{ width: '24px', height: '24px', color: 'var(--blue-600)' }} />
                  </div>
                </div>
              </div>

              <div className="card">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <p style={{ fontSize: 'var(--font-size-sm)', fontWeight: '500', color: 'var(--gray-600)', marginBottom: '0.5rem' }}>Samsvar status</p>
                    <p style={{ fontSize: 'var(--font-size-3xl)', fontWeight: '700', color: 'var(--green-600)' }}>{compliance.filter(c => c.status === 'compliant').length}</p>
                  </div>
                  <div style={{ background: 'var(--green-100)', padding: '0.75rem', borderRadius: 'var(--radius-lg)' }}>
                    <Shield style={{ width: '24px', height: '24px', color: 'var(--green-600)' }} />
                  </div>
                </div>
              </div>

              <div className="card">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <p style={{ fontSize: 'var(--font-size-sm)', fontWeight: '500', color: 'var(--gray-600)', marginBottom: '0.5rem' }}>Aktivt utstyr</p>
                    <p style={{ fontSize: 'var(--font-size-3xl)', fontWeight: '700', color: 'var(--orange-600)' }}>{equipment.filter(e => e.status === 'operational').length}</p>
                  </div>
                                     <div style={{ background: 'var(--orange-100)', padding: '0.75rem', borderRadius: 'var(--radius-lg)' }}>
                     <Wrench style={{ width: '24px', height: '24px', color: 'var(--orange-600)' }} />
                   </div>
                </div>
              </div>

              <div className="card">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <p style={{ fontSize: 'var(--font-size-sm)', fontWeight: '500', color: 'var(--gray-600)', marginBottom: '0.5rem' }}>Arbeidsprosesser</p>
                    <p style={{ fontSize: 'var(--font-size-3xl)', fontWeight: '700', color: 'var(--purple-600)' }}>{workProcesses.filter(w => w.status === 'active').length}</p>
                  </div>
                  <div style={{ background: 'var(--purple-100)', padding: '0.75rem', borderRadius: 'var(--radius-lg)' }}>
                    <Workflow style={{ width: '24px', height: '24px', color: 'var(--purple-600)' }} />
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="card">
              <div style={{ padding: '1.5rem' }}>
                <h3 style={{ fontSize: 'var(--font-size-lg)', fontWeight: '600', color: 'var(--gray-900)', marginBottom: '1rem' }}>Siste aktivitet</h3>
                <div style={{ display: 'grid', gap: '1rem' }}>
                  {[
                    { type: 'protocol', action: 'Oppdatert', item: 'Sikkerhetsprotokoll', time: '2 timer siden', user: 'John Doe' },
                    { type: 'compliance', action: 'Sjekket', item: 'Arbeidsmiljøloven', time: '1 dag siden', user: 'Jane Smith' },
                    { type: 'equipment', action: 'Inspektert', item: 'Kran A-101', time: '2 dager siden', user: 'Bob Johnson' }
                  ].map((activity, index) => (
                    <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.75rem', border: '1px solid var(--gray-200)', borderRadius: 'var(--radius-lg)' }}>
                      <div style={{ background: 'var(--blue-100)', padding: '0.5rem', borderRadius: 'var(--radius-lg)' }}>
                        <Activity style={{ width: '16px', height: '16px', color: 'var(--blue-600)' }} />
                      </div>
                      <div style={{ flex: '1' }}>
                        <p style={{ fontSize: 'var(--font-size-sm)', fontWeight: '500', color: 'var(--gray-900)' }}>
                          {activity.action} {activity.item}
                        </p>
                        <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--gray-500)' }}>
                          av {activity.user} • {activity.time}
                        </p>
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
                            <span className={`badge ${getStatusColor(protocol.status)}`}>
                              {protocol.status === 'active' ? 'Aktiv' : protocol.status === 'draft' ? 'Utkast' : 'Inaktiv'}
                            </span>
                            <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--gray-600)' }}>
                              Versjon {protocol.version}
                            </span>
                            <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--gray-600)' }}>
                              {protocol.category}
                            </span>
                          </div>
                          <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--gray-600)' }}>
                            Sist oppdatert: {formatDate(protocol.lastUpdated)}
                          </p>
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button className="btn btn-sm btn-outline">
                            <Eye style={{ width: '16px', height: '16px' }} />
                          </button>
                          <button className="btn btn-sm btn-outline">
                            <Edit style={{ width: '16px', height: '16px' }} />
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

        {/* Management Reviews Tab */}
        {activeTab === 'management' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: 'var(--font-size-xl)', fontWeight: '600', color: 'var(--gray-900)' }}>
                Ledelsesgjennomgang
              </h2>
              <button className="btn btn-primary">
                <Plus style={{ width: '16px', height: '16px', marginRight: '0.5rem' }} />
                Ny gjennomgang
              </button>
            </div>

            <div className="card">
              <div style={{ padding: '1.5rem' }}>
                <div style={{ display: 'grid', gap: '1rem' }}>
                  {managementReviews.map((review) => (
                    <div key={review.id} style={{ 
                      border: '1px solid var(--gray-200)', 
                      borderRadius: 'var(--radius-lg)', 
                      padding: '1.5rem',
                      background: 'var(--white)'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                        <div style={{ flex: '1' }}>
                          <h3 style={{ fontSize: 'var(--font-size-lg)', fontWeight: '600', color: 'var(--gray-900)', marginBottom: '0.5rem' }}>
                            {review.title}
                          </h3>
                          <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                            <span className={`badge ${getStatusColor(review.status)}`}>
                              {review.status === 'completed' ? 'Fullført' : review.status === 'scheduled' ? 'Planlagt' : 'Pågående'}
                            </span>
                            <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--gray-600)' }}>
                              {review.participants} deltakere
                            </span>
                            <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--gray-600)' }}>
                              {review.findings} funn
                            </span>
                          </div>
                          <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--gray-600)' }}>
                            Dato: {formatDate(review.date)}
                          </p>
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button className="btn btn-sm btn-outline">
                            <Eye style={{ width: '16px', height: '16px' }} />
                          </button>
                          <button className="btn btn-sm btn-outline">
                            <Edit style={{ width: '16px', height: '16px' }} />
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

        {/* Compliance Tab */}
        {activeTab === 'compliance' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: 'var(--font-size-xl)', fontWeight: '600', color: 'var(--gray-900)' }}>
                Samsvar
              </h2>
              <button className="btn btn-primary">
                <Plus style={{ width: '16px', height: '16px', marginRight: '0.5rem' }} />
                Ny samsvarsjekk
              </button>
            </div>

            <div className="card">
              <div style={{ padding: '1.5rem' }}>
                <div style={{ display: 'grid', gap: '1rem' }}>
                  {compliance.map((item) => (
                    <div key={item.id} style={{ 
                      border: '1px solid var(--gray-200)', 
                      borderRadius: 'var(--radius-lg)', 
                      padding: '1.5rem',
                      background: 'var(--white)'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                        <div style={{ flex: '1' }}>
                          <h3 style={{ fontSize: 'var(--font-size-lg)', fontWeight: '600', color: 'var(--gray-900)', marginBottom: '0.5rem' }}>
                            {item.regulation}
                          </h3>
                          <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                            <span className={`badge ${getStatusColor(item.status)}`}>
                              {item.status === 'compliant' ? 'Samsvar' : item.status === 'review' ? 'Gjennomgang' : 'Ikke samsvar'}
                            </span>
                            <span className={`badge ${getRiskColor(item.risk)}`}>
                              {item.risk === 'low' ? 'Lav risiko' : item.risk === 'medium' ? 'Medium risiko' : 'Høy risiko'}
                            </span>
                          </div>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', fontSize: 'var(--font-size-sm)', color: 'var(--gray-600)' }}>
                            <div>
                              <strong>Sist sjekket:</strong> {formatDate(item.lastCheck)}
                            </div>
                            <div>
                              <strong>Neste sjekk:</strong> {formatDate(item.nextCheck)}
                            </div>
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button className="btn btn-sm btn-outline">
                            <Eye style={{ width: '16px', height: '16px' }} />
                          </button>
                          <button className="btn btn-sm btn-outline">
                            <Edit style={{ width: '16px', height: '16px' }} />
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

        {/* JSA Tab */}
        {activeTab === 'jsa' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: 'var(--font-size-xl)', fontWeight: '600', color: 'var(--gray-900)' }}>
                SJA - Sikker Jobb Analyse
              </h2>
              <button className="btn btn-primary">
                <Plus style={{ width: '16px', height: '16px', marginRight: '0.5rem' }} />
                Ny SJA
              </button>
            </div>

            <div className="card">
              <div style={{ padding: '1.5rem' }}>
                <div style={{ display: 'grid', gap: '1rem' }}>
                  {jsa.map((item) => (
                    <div key={item.id} style={{ 
                      border: '1px solid var(--gray-200)', 
                      borderRadius: 'var(--radius-lg)', 
                      padding: '1.5rem',
                      background: 'var(--white)'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                        <div style={{ flex: '1' }}>
                          <h3 style={{ fontSize: 'var(--font-size-lg)', fontWeight: '600', color: 'var(--gray-900)', marginBottom: '0.5rem' }}>
                            {item.activity}
                          </h3>
                          <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                            <span className={`badge ${getRiskColor(item.riskLevel)}`}>
                              {item.riskLevel === 'low' ? 'Lav risiko' : item.riskLevel === 'medium' ? 'Medium risiko' : 'Høy risiko'}
                            </span>
                            <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--gray-600)' }}>
                              {item.department}
                            </span>
                            <span className={`badge ${getStatusColor(item.status)}`}>
                              {item.status === 'active' ? 'Aktiv' : 'Inaktiv'}
                            </span>
                          </div>
                          <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--gray-600)' }}>
                            Sist oppdatert: {formatDate(item.lastUpdated)}
                          </p>
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button className="btn btn-sm btn-outline">
                            <Eye style={{ width: '16px', height: '16px' }} />
                          </button>
                          <button className="btn btn-sm btn-outline">
                            <Edit style={{ width: '16px', height: '16px' }} />
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

        {/* Equipment Tab */}
        {activeTab === 'equipment' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: 'var(--font-size-xl)', fontWeight: '600', color: 'var(--gray-900)' }}>
                Utstyr & FDV
              </h2>
              <button className="btn btn-primary">
                <Plus style={{ width: '16px', height: '16px', marginRight: '0.5rem' }} />
                Nytt utstyr
              </button>
            </div>

            <div className="card">
              <div style={{ padding: '1.5rem' }}>
                <div style={{ display: 'grid', gap: '1rem' }}>
                  {equipment.map((item) => (
                    <div key={item.id} style={{ 
                      border: '1px solid var(--gray-200)', 
                      borderRadius: 'var(--radius-lg)', 
                      padding: '1.5rem',
                      background: 'var(--white)'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                        <div style={{ flex: '1' }}>
                          <h3 style={{ fontSize: 'var(--font-size-lg)', fontWeight: '600', color: 'var(--gray-900)', marginBottom: '0.5rem' }}>
                            {item.name}
                          </h3>
                          <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                            <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--gray-600)' }}>
                              {item.type}
                            </span>
                            <span className={`badge ${getStatusColor(item.status)}`}>
                              {item.status === 'operational' ? 'Operativ' : item.status === 'maintenance' ? 'Vedlikehold' : 'Stoppet'}
                            </span>
                          </div>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', fontSize: 'var(--font-size-sm)', color: 'var(--gray-600)' }}>
                            <div>
                              <strong>Sist inspeksjon:</strong> {formatDate(item.lastInspection)}
                            </div>
                            <div>
                              <strong>Neste inspeksjon:</strong> {formatDate(item.nextInspection)}
                            </div>
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button className="btn btn-sm btn-outline">
                            <Eye style={{ width: '16px', height: '16px' }} />
                          </button>
                          <button className="btn btn-sm btn-outline">
                            <Edit style={{ width: '16px', height: '16px' }} />
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

        {/* Work Processes Tab */}
        {activeTab === 'processes' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: 'var(--font-size-xl)', fontWeight: '600', color: 'var(--gray-900)' }}>
                Arbeidsprosesser
              </h2>
              <button className="btn btn-primary">
                <Plus style={{ width: '16px', height: '16px', marginRight: '0.5rem' }} />
                Ny prosess
              </button>
            </div>

            <div className="card">
              <div style={{ padding: '1.5rem' }}>
                <div style={{ display: 'grid', gap: '1rem' }}>
                  {workProcesses.map((process) => (
                    <div key={process.id} style={{ 
                      border: '1px solid var(--gray-200)', 
                      borderRadius: 'var(--radius-lg)', 
                      padding: '1.5rem',
                      background: 'var(--white)'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                        <div style={{ flex: '1' }}>
                          <h3 style={{ fontSize: 'var(--font-size-lg)', fontWeight: '600', color: 'var(--gray-900)', marginBottom: '0.5rem' }}>
                            {process.name}
                          </h3>
                          <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                            <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--gray-600)' }}>
                              {process.department}
                            </span>
                            <span className={`badge ${getStatusColor(process.status)}`}>
                              {process.status === 'active' ? 'Aktiv' : process.status === 'draft' ? 'Utkast' : 'Inaktiv'}
                            </span>
                            <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--gray-600)' }}>
                              Versjon {process.version}
                            </span>
                          </div>
                          <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--gray-600)' }}>
                            Sist oppdatert: {formatDate(process.lastUpdated)}
                          </p>
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button className="btn btn-sm btn-outline">
                            <Eye style={{ width: '16px', height: '16px' }} />
                          </button>
                          <button className="btn btn-sm btn-outline">
                            <Edit style={{ width: '16px', height: '16px' }} />
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

        {/* Organizational Chart Tab */}
        {activeTab === 'orgchart' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: 'var(--font-size-xl)', fontWeight: '600', color: 'var(--gray-900)' }}>
                Organisasjonskart
              </h2>
              <button className="btn btn-primary">
                <Plus style={{ width: '16px', height: '16px', marginRight: '0.5rem' }} />
                Ny stilling
              </button>
            </div>

            <div className="card">
              <div style={{ padding: '1.5rem' }}>
                <div style={{ display: 'grid', gap: '1rem' }}>
                  {orgChart.map((person) => (
                    <div key={person.id} style={{ 
                      border: '1px solid var(--gray-200)', 
                      borderRadius: 'var(--radius-lg)', 
                      padding: '1.5rem',
                      background: 'var(--white)'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                        <div style={{ flex: '1' }}>
                          <h3 style={{ fontSize: 'var(--font-size-lg)', fontWeight: '600', color: 'var(--gray-900)', marginBottom: '0.5rem' }}>
                            {person.name}
                          </h3>
                          <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                            <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--gray-600)' }}>
                              {person.position}
                            </span>
                            <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--gray-600)' }}>
                              {person.department}
                            </span>
                            <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--gray-600)' }}>
                              {person.employees} ansatte
                            </span>
                          </div>
                          {person.reportsTo && (
                            <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--gray-600)' }}>
                              Rapporterer til: {orgChart.find(p => p.id === person.reportsTo)?.name}
                            </p>
                          )}
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button className="btn btn-sm btn-outline">
                            <Eye style={{ width: '16px', height: '16px' }} />
                          </button>
                          <button className="btn btn-sm btn-outline">
                            <Edit style={{ width: '16px', height: '16px' }} />
                          </button>
                          <button className="btn btn-sm btn-outline">
                            <Users style={{ width: '16px', height: '16px' }} />
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
      </div>
    </div>
  );
} 