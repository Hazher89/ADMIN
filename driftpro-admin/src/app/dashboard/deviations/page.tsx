'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { firebaseService, Deviation as FirestoreDeviation, Employee, Department } from '@/lib/firebase-services';
import { 
  AlertTriangle, 
  Plus, 
  Search, 
  Calendar, 
  User, 
  MapPin,
  Edit,
  Trash2,
  MoreHorizontal,
  CheckCircle,
  Clock,
  AlertCircle,
  Eye,
  Download,
  Filter,
  TrendingUp,
  TrendingDown,
  FileText,
  MessageSquare,
  Shield,
  Activity,
  Target,
  BarChart3,
  Save,
  ChevronDown,
  Info
} from 'lucide-react';

export default function HMSPage() {
  const { userProfile } = useAuth();
  const [deviations, setDeviations] = useState<FirestoreDeviation[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedSeverity, setSelectedSeverity] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedDeviation, setSelectedDeviation] = useState<FirestoreDeviation | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [activeTab, setActiveTab] = useState('deviations'); // Changed from 'overview' to 'deviations'
  const [newDeviation, setNewDeviation] = useState({
    title: '',
    description: '',
    type: 'safety' as 'safety' | 'quality' | 'security' | 'process' | 'environmental' | 'health' | 'other',
    severity: 'medium' as 'low' | 'medium' | 'high' | 'critical',
    departmentId: '',
    location: '',
    equipment: '',
    cost: 0,
    riskAssessment: '',
    immediateActions: '',
    rootCause: '',
    correctiveActions: '',
    preventiveActions: '',
    attachments: [] as string[],
    witnesses: [] as string[],
    investigationRequired: false,
    regulatoryReport: false
  });

  // Risk Assessment state
  const [riskAssessments, setRiskAssessments] = useState<any[]>([]);
  const [showAddRiskModal, setShowAddRiskModal] = useState(false);
  const [showEditRiskModal, setShowEditRiskModal] = useState(false);
  const [selectedRisk, setSelectedRisk] = useState<any>(null);
  const [newRiskAssessment, setNewRiskAssessment] = useState({
    title: '',
    description: '',
    departmentId: '',
    location: '',
    activity: '',
    hazard: '',
    riskLevel: 'medium' as 'low' | 'medium' | 'high' | 'critical',
    probability: 'medium' as 'low' | 'medium' | 'high',
    consequence: 'medium' as 'low' | 'medium' | 'high' | 'critical',
    existingControls: '',
    additionalControls: '',
    responsiblePerson: '',
    reviewDate: '',
    attachments: [] as string[],
    // New fields inspired by the images
    incidentDescription: '',
    causeDescription: '',
    existingMeasures: '',
    additionalMeasures: '',
    notes: '',
    // Risk categories
    personRisk: { level: 0, description: 'Ikke aktuelt/Ufarlig' },
    economyRisk: { level: 0, description: 'Ikke aktuelt/Ufarlig' },
    environmentRisk: { level: 0, description: 'Ikke aktuelt/Ufarlig' },
    reputationRisk: { level: 0, description: 'Ikke aktuelt/Ufarlig' },
    deliveryRisk: { level: 0, description: 'Ikke aktuelt/Ufarlig' },
    securityRisk: { level: 0, description: 'Ikke aktuelt/Ufarlig' },
    // Selection fields
    area: '',
    danger: '',
    cause: '',
    processes: '',
    reference2: '',
    reference3: '',
    reference4: ''
  });

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
      loadDeviations();
      loadEmployees();
      loadDepartments();
    }
  }, [userProfile?.companyId]);

  const loadDeviations = async () => {
    if (!userProfile?.companyId) return;

    try {
      const data = await firebaseService.getDeviations(userProfile.companyId);
      setDeviations(data);
    } catch (error) {
      console.error('Error loading deviations:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadEmployees = async () => {
    if (!userProfile?.companyId) return;

    try {
      const data = await firebaseService.getEmployees(userProfile.companyId);
      setEmployees(data);
    } catch (error) {
      console.error('Error loading employees:', error);
    }
  };

  const loadDepartments = async () => {
    if (!userProfile?.companyId) return;

    try {
      const data = await firebaseService.getDepartments(userProfile.companyId);
      setDepartments(data);
    } catch (error) {
      console.error('Error loading departments:', error);
    }
  };

  const handleAddDeviation = async () => {
    if (!userProfile?.companyId) return;

    try {
      const deviationData = {
        ...newDeviation,
        companyId: userProfile.companyId,
        reportedBy: userProfile.id,
        status: 'reported' as const,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await firebaseService.createDeviation(deviationData);
      setShowAddModal(false);
      setNewDeviation({
        title: '',
        description: '',
        type: 'safety',
        severity: 'medium',
        departmentId: '',
        location: '',
        equipment: '',
        cost: 0,
        riskAssessment: '',
        immediateActions: '',
        rootCause: '',
        correctiveActions: '',
        preventiveActions: '',
        attachments: [],
        witnesses: [],
        investigationRequired: false,
        regulatoryReport: false
      });
      loadDeviations();
    } catch (error) {
      console.error('Error adding deviation:', error);
    }
  };

  const handleEditDeviation = async () => {
    if (!selectedDeviation) return;

    try {
      await firebaseService.updateDeviation(selectedDeviation.id, {
        ...selectedDeviation,
        updatedAt: new Date().toISOString()
      });
      setShowEditModal(false);
      setSelectedDeviation(null);
      loadDeviations();
    } catch (error) {
      console.error('Error updating deviation:', error);
    }
  };

  const handleDeleteDeviation = async (deviationId: string) => {
    if (!confirm('Er du sikker på at du vil slette dette avviket?')) return;

    try {
      await firebaseService.updateDeviation(deviationId, { status: 'closed' });
      loadDeviations();
    } catch (error) {
      console.error('Error deleting deviation:', error);
    }
  };

  const getDepartmentName = (departmentId: string) => {
    const dept = departments.find(d => d.id === departmentId);
    return dept?.name || 'Ukjent avdeling';
  };

  const getReporterName = (reporterId: string) => {
    const emp = employees.find(e => e.id === reporterId);
    return emp?.displayName || 'Ukjent bruker';
  };

  const getAssignedName = (assignedId?: string) => {
    if (!assignedId) return 'Ikke tildelt';
    const emp = employees.find(e => e.id === assignedId);
    return emp?.displayName || 'Ukjent bruker';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'reported': return 'bg-yellow-100 text-yellow-800';
      case 'investigating': return 'bg-blue-100 text-blue-800';
      case 'resolved': return 'bg-green-100 text-green-800';
      case 'closed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'reported': return <AlertCircle className="h-4 w-4" />;
      case 'investigating': return <Clock className="h-4 w-4" />;
      case 'resolved': return <CheckCircle className="h-4 w-4" />;
      case 'closed': return <CheckCircle className="h-4 w-4" />;
      default: return <AlertCircle className="h-4 w-4" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'low': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-red-100 text-red-800';
      case 'critical': return 'bg-red-200 text-red-900';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'safety': return 'bg-red-100 text-red-800';
      case 'quality': return 'bg-blue-100 text-blue-800';
      case 'maintenance': return 'bg-purple-100 text-purple-800';
      case 'environmental': return 'bg-green-100 text-green-800';
      case 'other': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRiskLevelColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'low': return { background: 'var(--green-100)', color: 'var(--green-800)' };
      case 'medium': return { background: 'var(--yellow-100)', color: 'var(--yellow-800)' };
      case 'high': return { background: 'var(--orange-100)', color: 'var(--orange-800)' };
      case 'critical': return { background: 'var(--red-100)', color: 'var(--red-800)' };
      default: return { background: 'var(--gray-100)', color: 'var(--gray-800)' };
    }
  };

  const getTotalDeviations = () => deviations.length;
  const getOpenDeviations = () => deviations.filter(d => d.status === 'reported' || d.status === 'investigating').length;
  const getResolvedDeviations = () => deviations.filter(d => d.status === 'resolved').length;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('nb-NO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filteredDeviations = deviations.filter(deviation => {
    const matchesSearch = deviation.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         deviation.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = selectedStatus === 'all' || deviation.status === selectedStatus;
    const matchesType = selectedType === 'all' || deviation.type === selectedType;
    const matchesSeverity = selectedSeverity === 'all' || deviation.severity === selectedSeverity;
    
    return matchesSearch && matchesStatus && matchesType && matchesSeverity;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Laster avvik...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--gray-50)' }}>
      {/* Mobile Header */}
      {isMobile && (
        <div style={{ background: 'var(--white)', boxShadow: 'var(--shadow-sm)', borderBottom: '1px solid var(--gray-200)', padding: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h1 style={{ fontSize: 'var(--font-size-lg)', fontWeight: '600', color: 'var(--gray-900)' }}>HMS</h1>
            <button
              onClick={() => activeTab === 'deviations' ? setShowAddModal(true) : setShowAddRiskModal(true)}
              style={{ background: 'var(--primary)', color: 'var(--white)', padding: '0.5rem', borderRadius: 'var(--radius-lg)', border: 'none', cursor: 'pointer' }}
            >
              <Plus style={{ width: '20px', height: '20px' }} />
            </button>
          </div>
        </div>
      )}

      {/* Desktop Header */}
      {!isMobile && (
        <div style={{ background: 'var(--white)', boxShadow: 'var(--shadow-sm)', borderBottom: '1px solid var(--gray-200)', padding: '1.5rem 2rem' }}>
          <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h1 style={{ fontSize: 'var(--font-size-2xl)', fontWeight: '700', color: 'var(--gray-900)' }}>HMS - Helse, Miljø og Sikkerhet</h1>
            <button
              onClick={() => activeTab === 'deviations' ? setShowAddModal(true) : setShowAddRiskModal(true)}
              className="btn btn-primary"
            >
              <Plus style={{ width: '16px', height: '16px', marginRight: '0.5rem' }} />
              {activeTab === 'deviations' ? 'Rapporter avvik' : 'Ny risikovurdering'}
            </button>
          </div>
        </div>
      )}

      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '2rem 1rem' }}>
        {/* Tab Navigation */}
        <div style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'flex', borderBottom: '2px solid var(--gray-200)', gap: '0' }}>
            <button
              onClick={() => setActiveTab('deviations')}
              style={{
                padding: '1rem 2rem',
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                borderBottom: activeTab === 'deviations' ? '2px solid var(--primary)' : '2px solid transparent',
                color: activeTab === 'deviations' ? 'var(--primary)' : 'var(--gray-600)',
                fontWeight: activeTab === 'deviations' ? '600' : '500',
                fontSize: 'var(--font-size-base)'
              }}
            >
              <AlertTriangle style={{ width: '16px', height: '16px', marginRight: '0.5rem', display: 'inline' }} />
              Avvik
            </button>
            <button
              onClick={() => setActiveTab('risk-assessment')}
              style={{
                padding: '1rem 2rem',
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                borderBottom: activeTab === 'risk-assessment' ? '2px solid var(--primary)' : '2px solid transparent',
                color: activeTab === 'risk-assessment' ? 'var(--primary)' : 'var(--gray-600)',
                fontWeight: activeTab === 'risk-assessment' ? '600' : '500',
                fontSize: 'var(--font-size-base)'
              }}
            >
              <Shield style={{ width: '16px', height: '16px', marginRight: '0.5rem', display: 'inline' }} />
              Risikovurdering
            </button>
          </div>
        </div>

        {/* Deviations Tab Content */}
        {activeTab === 'deviations' && (
          <>
            {/* Stats Overview */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
              <div className="card">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <p style={{ fontSize: 'var(--font-size-sm)', fontWeight: '500', color: 'var(--gray-600)', marginBottom: '0.5rem' }}>Totalt avvik</p>
                    <p style={{ fontSize: 'var(--font-size-3xl)', fontWeight: '700', color: 'var(--gray-900)' }}>{getTotalDeviations()}</p>
                  </div>
                  <div style={{ background: 'var(--blue-100)', padding: '0.75rem', borderRadius: 'var(--radius-lg)' }}>
                    <AlertTriangle style={{ width: '24px', height: '24px', color: 'var(--blue-600)' }} />
                  </div>
                </div>
              </div>
              <div className="card">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <p style={{ fontSize: 'var(--font-size-sm)', fontWeight: '500', color: 'var(--gray-600)', marginBottom: '0.5rem' }}>Åpne avvik</p>
                    <p style={{ fontSize: 'var(--font-size-3xl)', fontWeight: '700', color: 'var(--orange-600)' }}>{getOpenDeviations()}</p>
                  </div>
                  <div style={{ background: 'var(--orange-100)', padding: '0.75rem', borderRadius: 'var(--radius-lg)' }}>
                    <Clock style={{ width: '24px', height: '24px', color: 'var(--orange-600)' }} />
                  </div>
                </div>
              </div>
              <div className="card">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <p style={{ fontSize: 'var(--font-size-sm)', fontWeight: '500', color: 'var(--gray-600)', marginBottom: '0.5rem' }}>Løste avvik</p>
                    <p style={{ fontSize: 'var(--font-size-3xl)', fontWeight: '700', color: 'var(--green-600)' }}>{getResolvedDeviations()}</p>
                  </div>
                  <div style={{ background: 'var(--green-100)', padding: '0.75rem', borderRadius: 'var(--radius-lg)' }}>
                    <CheckCircle style={{ width: '24px', height: '24px', color: 'var(--green-600)' }} />
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Risk Assessment Tab Content */}
        {activeTab === 'risk-assessment' && (
          <>
            {/* Risk Assessment Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
              <div className="card">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <p style={{ fontSize: 'var(--font-size-sm)', fontWeight: '500', color: 'var(--gray-600)', marginBottom: '0.5rem' }}>Totalt risikovurderinger</p>
                    <p style={{ fontSize: 'var(--font-size-3xl)', fontWeight: '700', color: 'var(--gray-900)' }}>{riskAssessments.length}</p>
                  </div>
                  <div style={{ background: 'var(--blue-100)', padding: '0.75rem', borderRadius: 'var(--radius-lg)' }}>
                    <Shield style={{ width: '24px', height: '24px', color: 'var(--blue-600)' }} />
                  </div>
                </div>
              </div>
              <div className="card">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <p style={{ fontSize: 'var(--font-size-sm)', fontWeight: '500', color: 'var(--gray-600)', marginBottom: '0.5rem' }}>Høye risiker</p>
                    <p style={{ fontSize: 'var(--font-size-3xl)', fontWeight: '700', color: 'var(--red-600)' }}>{riskAssessments.filter(r => r.riskLevel === 'high' || r.riskLevel === 'critical').length}</p>
                  </div>
                  <div style={{ background: 'var(--red-100)', padding: '0.75rem', borderRadius: 'var(--radius-lg)' }}>
                    <AlertCircle style={{ width: '24px', height: '24px', color: 'var(--red-600)' }} />
                  </div>
                </div>
              </div>
              <div className="card">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <p style={{ fontSize: 'var(--font-size-sm)', fontWeight: '500', color: 'var(--gray-600)', marginBottom: '0.5rem' }}>Kontrollerte risiker</p>
                    <p style={{ fontSize: 'var(--font-size-3xl)', fontWeight: '700', color: 'var(--green-600)' }}>{riskAssessments.filter(r => r.riskLevel === 'low').length}</p>
                  </div>
                  <div style={{ background: 'var(--green-100)', padding: '0.75rem', borderRadius: 'var(--radius-lg)' }}>
                    <CheckCircle style={{ width: '24px', height: '24px', color: 'var(--green-600)' }} />
                  </div>
                </div>
              </div>
            </div>

            {/* Risk Assessment Form */}
            <div className="card">
              <div style={{ padding: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                  <h3 style={{ fontSize: 'var(--font-size-lg)', fontWeight: '600', color: 'var(--gray-900)' }}>KARTLEGGING AV HENDELSE</h3>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button className="btn btn-secondary">
                      <Save style={{ width: '16px', height: '16px', marginRight: '0.5rem' }} />
                      Lagre
                    </button>
                    <button className="btn btn-primary">
                      <Save style={{ width: '16px', height: '16px', marginRight: '0.5rem' }} />
                      Lagre og lukk
                    </button>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
                  {/* Main Form */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    {/* Basic Information */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: 'var(--font-size-sm)', fontWeight: '500', color: 'var(--gray-700)', marginBottom: '0.5rem' }}>
                          Risikovurdering *
                        </label>
                        <input
                          type="text"
                          value={newRiskAssessment.title}
                          onChange={(e) => setNewRiskAssessment({ ...newRiskAssessment, title: e.target.value })}
                          style={{ width: '100%', padding: '0.75rem', border: '1px solid var(--gray-300)', borderRadius: 'var(--radius-lg)', fontSize: 'var(--font-size-base)' }}
                          placeholder="F.eks. Ulykke på HUB"
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: 'var(--font-size-sm)', fontWeight: '500', color: 'var(--gray-700)', marginBottom: '0.5rem' }}>
                          Ansvarlig
                        </label>
                        <button className="btn btn-outline" style={{ width: '100%', justifyContent: 'space-between' }}>
                          Velg
                          <ChevronDown style={{ width: '16px', height: '16px' }} />
                        </button>
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: 'var(--font-size-sm)', fontWeight: '500', color: 'var(--gray-700)', marginBottom: '0.5rem' }}>
                          Kartlagt dato
                        </label>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <input
                            type="date"
                            value={newRiskAssessment.reviewDate}
                            onChange={(e) => setNewRiskAssessment({ ...newRiskAssessment, reviewDate: e.target.value })}
                            style={{ flex: '1', padding: '0.75rem', border: '1px solid var(--gray-300)', borderRadius: 'var(--radius-lg)', fontSize: 'var(--font-size-base)' }}
                          />
                          <Calendar style={{ width: '20px', height: '20px', color: 'var(--gray-400)' }} />
                        </div>
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: 'var(--font-size-sm)', fontWeight: '500', color: 'var(--gray-700)', marginBottom: '0.5rem' }}>
                          Hva kan skje? *
                        </label>
                        <input
                          type="text"
                          value={newRiskAssessment.hazard}
                          onChange={(e) => setNewRiskAssessment({ ...newRiskAssessment, hazard: e.target.value })}
                          style={{ width: '100%', padding: '0.75rem', border: '1px solid var(--gray-300)', borderRadius: 'var(--radius-lg)', fontSize: 'var(--font-size-base)' }}
                          placeholder="Beskriv hva som kan skje"
                        />
                      </div>
                    </div>

                    {/* Description Fields */}
                    <div>
                      <label style={{ display: 'block', fontSize: 'var(--font-size-sm)', fontWeight: '500', color: 'var(--gray-700)', marginBottom: '0.5rem' }}>
                        Beskrivelse av hendelsen og konsekvens
                      </label>
                      <textarea
                        value={newRiskAssessment.incidentDescription}
                        onChange={(e) => setNewRiskAssessment({ ...newRiskAssessment, incidentDescription: e.target.value })}
                        rows={4}
                        style={{ width: '100%', padding: '0.75rem', border: '1px solid var(--gray-300)', borderRadius: 'var(--radius-lg)', fontSize: 'var(--font-size-base)', resize: 'vertical' }}
                        placeholder="Detaljert beskrivelse av hendelsen og dens konsekvenser"
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: 'var(--font-size-sm)', fontWeight: '500', color: 'var(--gray-700)', marginBottom: '0.5rem' }}>
                        Beskrivelse av årsaken til hendelsen
                      </label>
                      <textarea
                        value={newRiskAssessment.causeDescription}
                        onChange={(e) => setNewRiskAssessment({ ...newRiskAssessment, causeDescription: e.target.value })}
                        rows={4}
                        style={{ width: '100%', padding: '0.75rem', border: '1px solid var(--gray-300)', borderRadius: 'var(--radius-lg)', fontSize: 'var(--font-size-base)', resize: 'vertical' }}
                        placeholder="Hva var årsaken til hendelsen?"
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: 'var(--font-size-sm)', fontWeight: '500', color: 'var(--gray-700)', marginBottom: '0.5rem' }}>
                        Eksisterende tiltak for å redusere sannsynligheten
                      </label>
                      <textarea
                        value={newRiskAssessment.existingMeasures}
                        onChange={(e) => setNewRiskAssessment({ ...newRiskAssessment, existingMeasures: e.target.value })}
                        rows={4}
                        style={{ width: '100%', padding: '0.75rem', border: '1px solid var(--gray-300)', borderRadius: 'var(--radius-lg)', fontSize: 'var(--font-size-base)', resize: 'vertical' }}
                        placeholder="Hvilke tiltak er allerede på plass?"
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: 'var(--font-size-sm)', fontWeight: '500', color: 'var(--gray-700)', marginBottom: '0.5rem' }}>
                        Forslag til ytterligere tiltak
                      </label>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '1rem', alignItems: 'end' }}>
                        <textarea
                          value={newRiskAssessment.additionalMeasures}
                          onChange={(e) => setNewRiskAssessment({ ...newRiskAssessment, additionalMeasures: e.target.value })}
                          rows={4}
                          style={{ width: '100%', padding: '0.75rem', border: '1px solid var(--gray-300)', borderRadius: 'var(--radius-lg)', fontSize: 'var(--font-size-base)', resize: 'vertical' }}
                          placeholder="Hvilke tiltak bør implementeres?"
                        />
                        <input
                          type="text"
                          style={{ padding: '0.75rem', border: '1px solid var(--gray-300)', borderRadius: 'var(--radius-lg)', fontSize: 'var(--font-size-sm)', width: '150px' }}
                          placeholder="Tidsstempel/Signatur"
                        />
                      </div>
                    </div>

                    {/* Probability Assessment */}
                    <div>
                      <h4 style={{ fontSize: 'var(--font-size-base)', fontWeight: '600', color: 'var(--gray-900)', marginBottom: '1rem' }}>SANNSYNLIGHET</h4>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <select
                          value={newRiskAssessment.probability}
                          onChange={(e) => setNewRiskAssessment({ ...newRiskAssessment, probability: e.target.value as 'low' | 'medium' | 'high' })}
                          style={{ padding: '0.75rem', border: '1px solid var(--gray-300)', borderRadius: 'var(--radius-lg)', fontSize: 'var(--font-size-base)', minWidth: '200px' }}
                        >
                          <option value="low">0 Skjer aldri</option>
                          <option value="medium">1 Skjer sjelden</option>
                          <option value="high">2 Skjer av og til</option>
                          <option value="high">3 Skjer ofte</option>
                          <option value="high">4 Skjer svært ofte</option>
                        </select>
                        <Info style={{ width: '20px', height: '20px', color: 'var(--blue-600)' }} />
                      </div>
                    </div>

                    {/* Risk Categories */}
                    <div>
                      <h4 style={{ fontSize: 'var(--font-size-base)', fontWeight: '600', color: 'var(--gray-900)', marginBottom: '1rem' }}>RISIKO</h4>
                      <div style={{ display: 'grid', gap: '1rem' }}>
                        {[
                          { key: 'personRisk', label: 'Person (Safety)', color: 'var(--red-100)' },
                          { key: 'economyRisk', label: 'Økonomi', color: 'var(--blue-100)' },
                          { key: 'environmentRisk', label: 'Ytre Miljø', color: 'var(--green-100)' },
                          { key: 'reputationRisk', label: 'Omdømme', color: 'var(--purple-100)' },
                          { key: 'deliveryRisk', label: 'Leveringsevne', color: 'var(--orange-100)' },
                          { key: 'securityRisk', label: 'Sikkerhet', color: 'var(--gray-100)' }
                        ].map((risk) => (
                          <div key={risk.key} style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <label style={{ minWidth: '150px', fontSize: 'var(--font-size-sm)', fontWeight: '500' }}>
                              {risk.label}
                            </label>
                                                         <select
                               value={(newRiskAssessment[risk.key as keyof typeof newRiskAssessment] as any)?.level || 0}
                               onChange={(e) => {
                                 const level = parseInt(e.target.value);
                                 const descriptions = [
                                   'Ikke aktuelt/Ufarlig',
                                   'Mindre skade',
                                   'Moderat skade',
                                   'Alvorlig skade',
                                   'Kritisk skade'
                                 ];
                                 setNewRiskAssessment({
                                   ...newRiskAssessment,
                                   [risk.key]: { level, description: descriptions[level] }
                                 });
                               }}
                              style={{ padding: '0.75rem', border: '1px solid var(--gray-300)', borderRadius: 'var(--radius-lg)', fontSize: 'var(--font-size-base)', minWidth: '200px' }}
                            >
                              <option value={0}>0 Ikke aktuelt/Ufarlig</option>
                              <option value={1}>1 Mindre skade</option>
                              <option value={2}>2 Moderat skade</option>
                              <option value={3}>3 Alvorlig skade</option>
                              <option value={4}>4 Kritisk skade</option>
                            </select>
                            <div style={{ 
                              padding: '0.5rem 1rem', 
                              borderRadius: 'var(--radius-lg)', 
                              fontSize: 'var(--font-size-sm)', 
                              fontWeight: '500',
                              background: 'var(--green-100)',
                              color: 'var(--green-800)'
                            }}>
                              0 Ingen risiko
                            </div>
                            <Info style={{ width: '20px', height: '20px', color: 'var(--blue-600)' }} />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Selection Panel */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div>
                      <h4 style={{ fontSize: 'var(--font-size-base)', fontWeight: '600', color: 'var(--gray-900)', marginBottom: '1rem' }}>VALG</h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {[
                          { key: 'area', label: 'Område' },
                          { key: 'danger', label: 'Fare' },
                          { key: 'cause', label: 'Årsak' },
                          { key: 'location', label: 'Lokasjon' },
                          { key: 'processes', label: 'Prosesser' },
                          { key: 'reference2', label: 'Referanse 2' },
                          { key: 'reference3', label: 'Referanse 3' },
                          { key: 'reference4', label: 'Referanse 4' }
                        ].map((item) => (
                          <div key={item.key} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: '500', minWidth: '80px' }}>
                              {item.label}
                            </span>
                            <button className="btn btn-outline" style={{ flex: '1', justifyContent: 'space-between' }}>
                              Velg
                              <ChevronDown style={{ width: '16px', height: '16px' }} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 style={{ fontSize: 'var(--font-size-base)', fontWeight: '600', color: 'var(--gray-900)', marginBottom: '1rem' }}>NOTATER</h4>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '1rem', alignItems: 'end' }}>
                        <textarea
                          value={newRiskAssessment.notes}
                          onChange={(e) => setNewRiskAssessment({ ...newRiskAssessment, notes: e.target.value })}
                          rows={6}
                          style={{ width: '100%', padding: '0.75rem', border: '1px solid var(--gray-300)', borderRadius: 'var(--radius-lg)', fontSize: 'var(--font-size-base)', resize: 'vertical' }}
                          placeholder="Legg til notater..."
                        />
                        <input
                          type="text"
                          style={{ padding: '0.75rem', border: '1px solid var(--gray-300)', borderRadius: 'var(--radius-lg)', fontSize: 'var(--font-size-sm)', width: '150px' }}
                          placeholder="Tidsstempel/Signatur"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Mobile Controls - Only show for deviations tab */}
        {isMobile && activeTab === 'deviations' && (
          <div style={{ marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
              <div style={{ flex: '1', position: 'relative' }}>
                <Search style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', width: '16px', height: '16px', color: 'var(--gray-400)' }} />
                <input
                  type="text"
                  placeholder="Søk i avvik..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{ width: '100%', padding: '0.75rem 0.75rem 0.75rem 2.5rem', border: '1px solid var(--gray-300)', borderRadius: 'var(--radius-lg)', fontSize: 'var(--font-size-base)' }}
                />
              </div>
              <button
                onClick={() => setShowFilters(!showFilters)}
                style={{ padding: '0.75rem', border: '1px solid var(--gray-300)', borderRadius: 'var(--radius-lg)', background: 'var(--white)', cursor: 'pointer' }}
              >
                <Filter style={{ width: '16px', height: '16px' }} />
              </button>
            </div>
            
            {showFilters && (
              <div style={{ background: 'var(--white)', padding: '1rem', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--gray-200)' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    style={{ width: '100%', padding: '0.75rem', border: '1px solid var(--gray-300)', borderRadius: 'var(--radius-lg)', fontSize: 'var(--font-size-base)' }}
                  >
                    <option value="all">Alle statuser</option>
                    <option value="reported">Rapportert</option>
                    <option value="investigating">Undersøkes</option>
                    <option value="resolved">Løst</option>
                    <option value="closed">Lukket</option>
                  </select>
                  <select
                    value={selectedType}
                    onChange={(e) => setSelectedType(e.target.value)}
                    style={{ width: '100%', padding: '0.75rem', border: '1px solid var(--gray-300)', borderRadius: 'var(--radius-lg)', fontSize: 'var(--font-size-base)' }}
                  >
                    <option value="all">Alle typer</option>
                    <option value="safety">Sikkerhet</option>
                    <option value="quality">Kvalitet</option>
                    <option value="security">Sikkerhet</option>
                    <option value="process">Prosess</option>
                    <option value="other">Annet</option>
                  </select>
                  <select
                    value={selectedSeverity}
                    onChange={(e) => setSelectedSeverity(e.target.value)}
                    style={{ width: '100%', padding: '0.75rem', border: '1px solid var(--gray-300)', borderRadius: 'var(--radius-lg)', fontSize: 'var(--font-size-base)' }}
                  >
                    <option value="all">Alle alvorlighetsgrader</option>
                    <option value="low">Lav</option>
                    <option value="medium">Medium</option>
                    <option value="high">Høy</option>
                    <option value="critical">Kritisk</option>
                  </select>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Desktop Controls - Only show for deviations tab */}
        {!isMobile && activeTab === 'deviations' && (
          <div className="card" style={{ marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ position: 'relative', flex: '1' }}>
                <Search style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', width: '20px', height: '20px', color: 'var(--gray-400)' }} />
                <input
                  type="text"
                  placeholder="Søk i avvik..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{ width: '100%', padding: '0.75rem 0.75rem 0.75rem 2.5rem', border: '1px solid var(--gray-300)', borderRadius: 'var(--radius-lg)', fontSize: 'var(--font-size-base)' }}
                />
              </div>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  style={{ padding: '0.75rem 1rem', border: '1px solid var(--gray-300)', borderRadius: 'var(--radius-lg)', fontSize: 'var(--font-size-base)', minWidth: '150px' }}
                >
                  <option value="all">Alle statuser</option>
                  <option value="reported">Rapportert</option>
                  <option value="investigating">Undersøkes</option>
                  <option value="resolved">Løst</option>
                  <option value="closed">Lukket</option>
                </select>
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  style={{ padding: '0.75rem 1rem', border: '1px solid var(--gray-300)', borderRadius: 'var(--radius-lg)', fontSize: 'var(--font-size-base)', minWidth: '150px' }}
                >
                  <option value="all">Alle typer</option>
                  <option value="safety">Sikkerhet</option>
                  <option value="quality">Kvalitet</option>
                  <option value="security">Sikkerhet</option>
                  <option value="process">Prosess</option>
                  <option value="other">Annet</option>
                </select>
                <select
                  value={selectedSeverity}
                  onChange={(e) => setSelectedSeverity(e.target.value)}
                  style={{ padding: '0.75rem 1rem', border: '1px solid var(--gray-300)', borderRadius: 'var(--radius-lg)', fontSize: 'var(--font-size-base)', minWidth: '150px' }}
                >
                  <option value="all">Alle alvorlighetsgrader</option>
                  <option value="low">Lav</option>
                  <option value="medium">Medium</option>
                  <option value="high">Høy</option>
                  <option value="critical">Kritisk</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Deviations List - Only show for deviations tab */}
        {activeTab === 'deviations' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {filteredDeviations.length === 0 ? (
              <div className="card" style={{ padding: '3rem', textAlign: 'center' }}>
                <AlertTriangle style={{ width: '48px', height: '48px', color: 'var(--gray-400)', margin: '0 auto 1rem' }} />
                <h3 style={{ fontSize: 'var(--font-size-lg)', fontWeight: '600', color: 'var(--gray-900)', marginBottom: '0.5rem' }}>Ingen avvik funnet</h3>
                <p style={{ color: 'var(--gray-600)' }}>Det er ingen avvik som matcher søkekriteriene dine.</p>
              </div>
            ) : (
              filteredDeviations.map(deviation => (
              <div key={deviation.id} className="card" style={{ cursor: 'pointer' }}>
                <div style={{ padding: '1.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1rem' }}>
                    <div style={{ flex: '1' }}>
                      <h3 style={{ fontSize: 'var(--font-size-lg)', fontWeight: '600', color: 'var(--gray-900)', marginBottom: '0.5rem' }}>{deviation.title}</h3>
                      <p style={{ color: 'var(--gray-600)', marginBottom: '0.75rem' }}>{deviation.description}</p>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.75rem' }}>
                        <span className={`badge ${getStatusColor(deviation.status)}`}>
                          {getStatusIcon(deviation.status)}
                          <span style={{ marginLeft: '0.25rem' }}>{deviation.status}</span>
                        </span>
                        <span className={`badge ${getTypeColor(deviation.type)}`}>
                          {deviation.type}
                        </span>
                        <span className={`badge ${getSeverityColor(deviation.severity)}`}>
                          {deviation.severity}
                        </span>
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', fontSize: 'var(--font-size-sm)', color: 'var(--gray-500)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <User style={{ width: '16px', height: '16px' }} />
                          <span>Rapportert av: {getReporterName(deviation.reportedBy)}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <Calendar style={{ width: '16px', height: '16px' }} />
                          <span>{formatDate(deviation.createdAt)}</span>
                        </div>
                        {deviation.departmentId && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                            <MapPin style={{ width: '16px', height: '16px' }} />
                            <span>{getDepartmentName(deviation.departmentId)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', marginLeft: '1rem' }}>
                      <button
                        onClick={() => {
                          setSelectedDeviation(deviation);
                          setShowDetailModal(true);
                        }}
                        style={{ padding: '0.5rem', color: 'var(--blue-600)', background: 'none', border: 'none', cursor: 'pointer', borderRadius: 'var(--radius-md)' }}
                        title="Se detaljer"
                      >
                        <Eye style={{ width: '16px', height: '16px' }} />
                      </button>
                      <button
                        onClick={() => {
                          setSelectedDeviation(deviation);
                          setShowEditModal(true);
                        }}
                        style={{ padding: '0.5rem', color: 'var(--gray-400)', background: 'none', border: 'none', cursor: 'pointer', borderRadius: 'var(--radius-md)' }}
                        title="Rediger"
                      >
                        <Edit style={{ width: '16px', height: '16px' }} />
                      </button>
                      <button
                        onClick={() => handleDeleteDeviation(deviation.id)}
                        style={{ padding: '0.5rem', color: 'var(--gray-400)', background: 'none', border: 'none', cursor: 'pointer', borderRadius: 'var(--radius-md)' }}
                        title="Slett"
                      >
                        <Trash2 style={{ width: '16px', height: '16px' }} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
        )}

      {/* Add Deviation Modal */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2 className="modal-title">Rapporter nytt avvik</h2>
              <button onClick={() => setShowAddModal(false)} className="modal-close">×</button>
            </div>
            <div className="modal-body">
              <div className="modal-form-grid">
                <div className="form-field">
                  <label className="form-label">Tittel</label>
                  <input
                    type="text"
                    value={newDeviation.title}
                    onChange={(e) => setNewDeviation({ ...newDeviation, title: e.target.value })}
                    className="form-input-modal"
                    placeholder="Beskriv avviket kort"
                  />
                </div>
                <div className="form-field">
                  <label className="form-label">Beskrivelse</label>
                  <textarea
                    value={newDeviation.description}
                    onChange={(e) => setNewDeviation({ ...newDeviation, description: e.target.value })}
                    rows={4}
                    className="form-textarea-modal"
                    placeholder="Detaljert beskrivelse av avviket"
                  />
                </div>
                <div className="form-field">
                  <label className="form-label">Type</label>
                  <select
                    value={newDeviation.type}
                    onChange={(e) => setNewDeviation({ ...newDeviation, type: e.target.value as 'safety' | 'quality' | 'security' | 'process' | 'environmental' | 'health' | 'other' })}
                    className="form-select-modal"
                  >
                    <option value="safety">Sikkerhet</option>
                    <option value="quality">Kvalitet</option>
                    <option value="security">Sikkerhet</option>
                    <option value="process">Prosess</option>
                    <option value="environmental">Miljø</option>
                    <option value="health">Helse</option>
                    <option value="other">Annet</option>
                  </select>
                </div>
                <div className="form-field">
                  <label className="form-label">Alvorlighetsgrad</label>
                  <select
                    value={newDeviation.severity}
                    onChange={(e) => setNewDeviation({ ...newDeviation, severity: e.target.value as 'low' | 'medium' | 'high' | 'critical' })}
                    className="form-select-modal"
                  >
                    <option value="low">Lav</option>
                    <option value="medium">Medium</option>
                    <option value="high">Høy</option>
                    <option value="critical">Kritisk</option>
                  </select>
                </div>
                <div className="form-field">
                  <label className="form-label">Avdeling</label>
                  <select
                    value={newDeviation.departmentId}
                    onChange={(e) => setNewDeviation({ ...newDeviation, departmentId: e.target.value })}
                    className="form-select-modal"
                  >
                    <option value="">Velg avdeling</option>
                    {departments.map(dept => (
                      <option key={dept.id} value={dept.id}>{dept.name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-field">
                  <label className="form-label">Lokasjon</label>
                  <input
                    type="text"
                    value={newDeviation.location}
                    onChange={(e) => setNewDeviation({ ...newDeviation, location: e.target.value })}
                    className="form-input-modal"
                    placeholder="Hvor skjedde avviket?"
                  />
                </div>
                <div className="form-field">
                  <label className="form-label">Utstyr</label>
                  <input
                    type="text"
                    value={newDeviation.equipment}
                    onChange={(e) => setNewDeviation({ ...newDeviation, equipment: e.target.value })}
                    className="form-input-modal"
                    placeholder="Hvilket utstyr var involvert?"
                  />
                </div>
                <div className="form-field">
                  <label className="form-label">Estimert kostnad (kr)</label>
                  <input
                    type="number"
                    value={newDeviation.cost}
                    onChange={(e) => setNewDeviation({ ...newDeviation, cost: parseInt(e.target.value) || 0 })}
                    className="form-input-modal"
                    placeholder="0"
                  />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button onClick={() => setShowAddModal(false)} className="btn btn-secondary">Avbryt</button>
              <button onClick={handleAddDeviation} className="btn btn-primary">Rapporter avvik</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Deviation Modal */}
      {showEditModal && selectedDeviation && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2 className="modal-title">Rediger avvik</h2>
              <button onClick={() => setShowEditModal(false)} className="modal-close">×</button>
            </div>
            <div className="modal-body">
              <div className="modal-form-grid">
                <div className="form-field">
                  <label className="form-label">Tittel</label>
                  <input
                    type="text"
                    value={selectedDeviation.title}
                    onChange={(e) => setSelectedDeviation({ ...selectedDeviation, title: e.target.value })}
                    className="form-input-modal"
                  />
                </div>
                <div className="form-field">
                  <label className="form-label">Beskrivelse</label>
                  <textarea
                    value={selectedDeviation.description}
                    onChange={(e) => setSelectedDeviation({ ...selectedDeviation, description: e.target.value })}
                    rows={4}
                    className="form-textarea-modal"
                  />
                </div>
                <div className="form-field">
                  <label className="form-label">Status</label>
                  <select
                    value={selectedDeviation.status}
                    onChange={(e) => setSelectedDeviation({ ...selectedDeviation, status: e.target.value as 'reported' | 'investigating' | 'resolved' | 'closed' })}
                    className="form-select-modal"
                  >
                    <option value="reported">Rapportert</option>
                    <option value="investigating">Undersøkes</option>
                    <option value="resolved">Løst</option>
                    <option value="closed">Lukket</option>
                  </select>
                </div>
                <div className="form-field">
                  <label className="form-label">Tildelt til</label>
                  <select
                    value={selectedDeviation.assignedTo || ''}
                    onChange={(e) => setSelectedDeviation({ ...selectedDeviation, assignedTo: e.target.value || undefined })}
                    className="form-select-modal"
                  >
                    <option value="">Ikke tildelt</option>
                    {employees.map(emp => (
                      <option key={emp.id} value={emp.id}>{emp.displayName}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button onClick={() => setShowEditModal(false)} className="btn btn-secondary">Avbryt</button>
              <button onClick={handleEditDeviation} className="btn btn-primary">Lagre endringer</button>
            </div>
          </div>
        </div>
      )}

      {/* Detailed Deviation Modal */}
      {showDetailModal && selectedDeviation && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '800px', maxHeight: '90vh', overflow: 'auto' }}>
            <div className="modal-header">
              <h2 className="modal-title">Avvik Detaljer - {selectedDeviation.title}</h2>
              <button onClick={() => setShowDetailModal(false)} className="modal-close">×</button>
            </div>
            <div className="modal-body">
              <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                <button
                  onClick={() => setActiveTab('overview')}
                  className={`tab-button ${activeTab === 'overview' ? 'active' : ''}`}
                >
                  Oversikt
                </button>
                <button
                  onClick={() => setActiveTab('investigation')}
                  className={`tab-button ${activeTab === 'investigation' ? 'active' : ''}`}
                >
                  Undersøkelse
                </button>
                <button
                  onClick={() => setActiveTab('actions')}
                  className={`tab-button ${activeTab === 'actions' ? 'active' : ''}`}
                >
                  Handlinger
                </button>
                <button
                  onClick={() => setActiveTab('attachments')}
                  className={`tab-button ${activeTab === 'attachments' ? 'active' : ''}`}
                >
                  Vedlegg
                </button>
              </div>

              {activeTab === 'overview' && (
                <div className="space-y-4">
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="card">
                      <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '1rem' }}>Grunnleggende Info</h3>
                      <div className="space-y-2">
                        <div><strong>Status:</strong> <span className={getStatusColor(selectedDeviation.status)}>{selectedDeviation.status}</span></div>
                        <div><strong>Type:</strong> <span className={getTypeColor(selectedDeviation.type)}>{selectedDeviation.type}</span></div>
                        <div><strong>Alvorlighetsgrad:</strong> <span className={getSeverityColor(selectedDeviation.severity)}>{selectedDeviation.severity}</span></div>
                        <div><strong>Avdeling:</strong> {getDepartmentName(selectedDeviation.departmentId)}</div>
                        <div><strong>Lokasjon:</strong> {selectedDeviation.location || 'Ikke spesifisert'}</div>
                        <div><strong>Utstyr:</strong> {selectedDeviation.equipment || 'Ikke spesifisert'}</div>
                      </div>
                    </div>
                    <div className="card">
                      <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '1rem' }}>Personell</h3>
                      <div className="space-y-2">
                        <div><strong>Rapportert av:</strong> {getReporterName(selectedDeviation.reportedBy)}</div>
                        <div><strong>Tildelt til:</strong> {getAssignedName(selectedDeviation.assignedTo)}</div>
                        <div><strong>Rapportert:</strong> {formatDate(selectedDeviation.createdAt)}</div>
                        <div><strong>Sist oppdatert:</strong> {formatDate(selectedDeviation.updatedAt)}</div>
                        {selectedDeviation.resolvedAt && (
                          <div><strong>Løst:</strong> {formatDate(selectedDeviation.resolvedAt)}</div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="card">
                    <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '1rem' }}>Beskrivelse</h3>
                    <p style={{ lineHeight: '1.6' }}>{selectedDeviation.description}</p>
                  </div>
                  {selectedDeviation.cost && selectedDeviation.cost > 0 && (
                    <div className="card">
                      <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '1rem' }}>Økonomisk Påvirkning</h3>
                      <div><strong>Estimert kostnad:</strong> {selectedDeviation.cost.toLocaleString('nb-NO')} kr</div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'investigation' && (
                <div className="space-y-4">
                  <div className="card">
                    <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '1rem' }}>Risikovurdering</h3>
                    <textarea
                      value={selectedDeviation.riskAssessment || ''}
                      onChange={(e) => setSelectedDeviation({ ...selectedDeviation, riskAssessment: e.target.value })}
                      rows={4}
                      className="form-textarea-modal"
                      placeholder="Beskriv risikovurderingen..."
                    />
                  </div>
                  <div className="card">
                    <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '1rem' }}>Rårsaksanalyse</h3>
                    <textarea
                      value={selectedDeviation.rootCause || ''}
                      onChange={(e) => setSelectedDeviation({ ...selectedDeviation, rootCause: e.target.value })}
                      rows={4}
                      className="form-textarea-modal"
                      placeholder="Identifiser roten til problemet..."
                    />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="card">
                      <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '1rem' }}>Undersøkelse Påkrevd</h3>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <input
                          type="checkbox"
                          checked={selectedDeviation.investigationRequired || false}
                          onChange={(e) => setSelectedDeviation({ ...selectedDeviation, investigationRequired: e.target.checked })}
                        />
                        Krever formell undersøkelse
                      </label>
                    </div>
                    <div className="card">
                      <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '1rem' }}>Regulatorisk Rapportering</h3>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <input
                          type="checkbox"
                          checked={selectedDeviation.regulatoryReport || false}
                          onChange={(e) => setSelectedDeviation({ ...selectedDeviation, regulatoryReport: e.target.checked })}
                        />
                        Krever regulatorisk rapportering
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'actions' && (
                <div className="space-y-4">
                  <div className="card">
                    <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '1rem' }}>Umiddelbare Handlinger</h3>
                    <textarea
                      value={selectedDeviation.immediateActions || ''}
                      onChange={(e) => setSelectedDeviation({ ...selectedDeviation, immediateActions: e.target.value })}
                      rows={4}
                      className="form-textarea-modal"
                      placeholder="Hvilke umiddelbare handlinger ble tatt?"
                    />
                  </div>
                  <div className="card">
                    <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '1rem' }}>Korrigerende Handlinger</h3>
                    <textarea
                      value={selectedDeviation.correctiveActions || ''}
                      onChange={(e) => setSelectedDeviation({ ...selectedDeviation, correctiveActions: e.target.value })}
                      rows={4}
                      className="form-textarea-modal"
                      placeholder="Hvilke korrigerende handlinger skal implementeres?"
                    />
                  </div>
                  <div className="card">
                    <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '1rem' }}>Forebyggende Handlinger</h3>
                    <textarea
                      value={selectedDeviation.preventiveActions || ''}
                      onChange={(e) => setSelectedDeviation({ ...selectedDeviation, preventiveActions: e.target.value })}
                      rows={4}
                      className="form-textarea-modal"
                      placeholder="Hvilke forebyggende handlinger skal implementeres?"
                    />
                  </div>
                </div>
              )}

              {activeTab === 'attachments' && (
                <div className="space-y-4">
                  <div className="card">
                    <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '1rem' }}>Vedlegg</h3>
                    {selectedDeviation.attachments && selectedDeviation.attachments.length > 0 ? (
                      <div className="space-y-2">
                        {selectedDeviation.attachments.map((attachment, index) => (
                          <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem', border: '1px solid #e5e7eb', borderRadius: '0.5rem' }}>
                            <FileText style={{ width: '16px', height: '16px' }} />
                            <span>{attachment}</span>
                            <button className="btn btn-sm btn-secondary">Last ned</button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p style={{ color: '#6b7280' }}>Ingen vedlegg lastet opp</p>
                    )}
                  </div>
                  <div className="card">
                    <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '1rem' }}>Vitner</h3>
                    {selectedDeviation.witnesses && selectedDeviation.witnesses.length > 0 ? (
                      <div className="space-y-2">
                        {selectedDeviation.witnesses.map((witness, index) => (
                          <div key={index} style={{ padding: '0.5rem', border: '1px solid #e5e7eb', borderRadius: '0.5rem' }}>
                            {witness}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p style={{ color: '#6b7280' }}>Ingen vitner registrert</p>
                    )}
                  </div>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button onClick={() => setShowDetailModal(false)} className="btn btn-secondary">Lukk</button>
              <button onClick={handleEditDeviation} className="btn btn-primary">Lagre endringer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  </div>
  );
}
