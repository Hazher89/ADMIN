'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { companyService, type Protocol, type ManagementReview, type Compliance, type JSA, type Equipment, type WorkProcess, type OrgChart } from '@/lib/company-service';
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
  const [protocols, setProtocols] = useState<Protocol[]>([]);
  const [managementReviews, setManagementReviews] = useState<ManagementReview[]>([]);
  const [compliance, setCompliance] = useState<Compliance[]>([]);
  const [jsa, setJsa] = useState<JSA[]>([]);
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [workProcesses, setWorkProcesses] = useState<WorkProcess[]>([]);
  const [orgChart, setOrgChart] = useState<OrgChart[]>([]);
  const [dashboardStats, setDashboardStats] = useState<any>(null);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);

  // Modal states
  const [showProtocolModal, setShowProtocolModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showComplianceModal, setShowComplianceModal] = useState(false);
  const [showJSAModal, setShowJSAModal] = useState(false);
  const [showEquipmentModal, setShowEquipmentModal] = useState(false);
  const [showProcessModal, setShowProcessModal] = useState(false);
  const [showOrgChartModal, setShowOrgChartModal] = useState(false);

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

  const service = userProfile?.companyId ? companyService(userProfile.companyId) : null;

  const loadCompanyData = async () => {
    if (!service) return;
    
    try {
      setLoading(true);
      
      // Load all data in parallel
      const [protocolsData, reviewsData, complianceData, jsaData, equipmentData, processesData, orgChartData, statsData, activityData] = await Promise.all([
        service.getProtocols(),
        service.getManagementReviews(),
        service.getCompliance(),
        service.getJSAs(),
        service.getEquipment(),
        service.getWorkProcesses(),
        service.getOrgChart(),
        service.getDashboardStats(),
        service.getRecentActivity()
      ]);

      setProtocols(protocolsData);
      setManagementReviews(reviewsData);
      setCompliance(complianceData);
      setJsa(jsaData);
      setEquipment(equipmentData);
      setWorkProcesses(processesData);
      setOrgChart(orgChartData);
      setDashboardStats(statsData);
      setRecentActivity(activityData);
    } catch (error) {
      console.error('Error loading company data:', error);
    } finally {
      setLoading(false);
    }
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

  const formatDate = (dateString: string | Date) => {
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    return date.toLocaleDateString('nb-NO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Create functions
  const handleCreateProtocol = async (protocolData: any) => {
    if (!service || !userProfile) return;
    
    try {
      await service.createProtocol({
        ...protocolData,
        companyId: userProfile.companyId,
        createdBy: userProfile.email || userProfile.displayName || 'Unknown'
      });
      await loadCompanyData();
      setShowProtocolModal(false);
    } catch (error) {
      console.error('Error creating protocol:', error);
    }
  };

  const handleCreateReview = async (reviewData: any) => {
    if (!service || !userProfile) return;
    
    try {
      await service.createManagementReview({
        ...reviewData,
        companyId: userProfile.companyId,
        createdBy: userProfile.email || userProfile.displayName || 'Unknown'
      });
      await loadCompanyData();
      setShowReviewModal(false);
    } catch (error) {
      console.error('Error creating review:', error);
    }
  };

  const handleCreateCompliance = async (complianceData: any) => {
    if (!service || !userProfile) return;
    
    try {
      await service.createCompliance({
        ...complianceData,
        companyId: userProfile.companyId,
        createdBy: userProfile.email || userProfile.displayName || 'Unknown'
      });
      await loadCompanyData();
      setShowComplianceModal(false);
    } catch (error) {
      console.error('Error creating compliance:', error);
    }
  };

  const handleCreateJSA = async (jsaData: any) => {
    if (!service || !userProfile) return;
    
    try {
      await service.createJSA({
        ...jsaData,
        companyId: userProfile.companyId,
        createdBy: userProfile.email || userProfile.displayName || 'Unknown'
      });
      await loadCompanyData();
      setShowJSAModal(false);
    } catch (error) {
      console.error('Error creating JSA:', error);
    }
  };

  const handleCreateEquipment = async (equipmentData: any) => {
    if (!service || !userProfile) return;
    
    try {
      await service.createEquipment({
        ...equipmentData,
        companyId: userProfile.companyId,
        createdBy: userProfile.email || userProfile.displayName || 'Unknown'
      });
      await loadCompanyData();
      setShowEquipmentModal(false);
    } catch (error) {
      console.error('Error creating equipment:', error);
    }
  };

  const handleCreateProcess = async (processData: any) => {
    if (!service || !userProfile) return;
    
    try {
      await service.createWorkProcess({
        ...processData,
        companyId: userProfile.companyId,
        createdBy: userProfile.email || userProfile.displayName || 'Unknown'
      });
      await loadCompanyData();
      setShowProcessModal(false);
    } catch (error) {
      console.error('Error creating process:', error);
    }
  };

  const handleCreateOrgChartEntry = async (entryData: any) => {
    if (!service || !userProfile) return;
    
    try {
      await service.createOrgChartEntry({
        ...entryData,
        companyId: userProfile.companyId,
        createdBy: userProfile.email || userProfile.displayName || 'Unknown'
      });
      await loadCompanyData();
      setShowOrgChartModal(false);
    } catch (error) {
      console.error('Error creating org chart entry:', error);
    }
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
                    <p style={{ fontSize: 'var(--font-size-3xl)', fontWeight: '700', color: 'var(--gray-900)' }}>
                      {dashboardStats?.protocols?.active || 0}
                    </p>
                    <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--gray-500)' }}>
                      {dashboardStats?.protocols?.overdue || 0} forfaller snart
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
                    <p style={{ fontSize: 'var(--font-size-sm)', fontWeight: '500', color: 'var(--gray-600)', marginBottom: '0.5rem' }}>Samsvar status</p>
                    <p style={{ fontSize: 'var(--font-size-3xl)', fontWeight: '700', color: 'var(--green-600)' }}>
                      {dashboardStats?.compliance?.compliant || 0}
                    </p>
                    <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--gray-500)' }}>
                      {dashboardStats?.compliance?.dueSoon || 0} sjekker snart
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
                    <p style={{ fontSize: 'var(--font-size-sm)', fontWeight: '500', color: 'var(--gray-600)', marginBottom: '0.5rem' }}>Aktivt utstyr</p>
                    <p style={{ fontSize: 'var(--font-size-3xl)', fontWeight: '700', color: 'var(--orange-600)' }}>
                      {dashboardStats?.equipment?.operational || 0}
                    </p>
                    <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--gray-500)' }}>
                      {dashboardStats?.equipment?.inspectionDue || 0} inspeksjoner forfaller
                    </p>
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
                    <p style={{ fontSize: 'var(--font-size-3xl)', fontWeight: '700', color: 'var(--purple-600)' }}>
                      {dashboardStats?.processes?.active || 0}
                    </p>
                    <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--gray-500)' }}>
                      {dashboardStats?.processes?.overdue || 0} gjennomganger forfaller
                    </p>
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
                  {recentActivity.length > 0 ? (
                    recentActivity.map((activity, index) => (
                      <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.75rem', border: '1px solid var(--gray-200)', borderRadius: 'var(--radius-lg)' }}>
                        <div style={{ 
                          background: activity.type === 'protocol' ? 'var(--blue-100)' : 
                                    activity.type === 'compliance' ? 'var(--green-100)' : 
                                    activity.type === 'equipment' ? 'var(--orange-100)' : 'var(--gray-100)', 
                          padding: '0.5rem', 
                          borderRadius: 'var(--radius-lg)' 
                        }}>
                          <Activity style={{ 
                            width: '16px', 
                            height: '16px', 
                            color: activity.type === 'protocol' ? 'var(--blue-600)' : 
                                   activity.type === 'compliance' ? 'var(--green-600)' : 
                                   activity.type === 'equipment' ? 'var(--orange-600)' : 'var(--gray-600)' 
                          }} />
                        </div>
                        <div style={{ flex: '1' }}>
                          <p style={{ fontSize: 'var(--font-size-sm)', fontWeight: '500', color: 'var(--gray-900)' }}>
                            {activity.action} {activity.item}
                          </p>
                          <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--gray-500)' }}>
                            av {activity.user} • {formatDate(activity.time)}
                          </p>
                        </div>
                        <span className={`badge ${getStatusColor(activity.status)}`}>
                          {activity.status === 'active' ? 'Aktiv' : 
                           activity.status === 'completed' ? 'Fullført' : 
                           activity.status === 'compliant' ? 'Samsvar' : 'Status'}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--gray-500)' }}>
                      <Activity style={{ width: '48px', height: '48px', margin: '0 auto 1rem', opacity: '0.5' }} />
                      <p>Ingen aktivitet ennå</p>
                    </div>
                  )}
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
                          <button className="btn btn-primary" onClick={() => setShowProtocolModal(true)}>
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
                          <button className="btn btn-primary" onClick={() => setShowReviewModal(true)}>
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
                          <button className="btn btn-primary" onClick={() => setShowComplianceModal(true)}>
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
                          <button className="btn btn-primary" onClick={() => setShowJSAModal(true)}>
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
                          <button className="btn btn-primary" onClick={() => setShowEquipmentModal(true)}>
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
                          <button className="btn btn-primary" onClick={() => setShowProcessModal(true)}>
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
                          <button className="btn btn-primary" onClick={() => setShowOrgChartModal(true)}>
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