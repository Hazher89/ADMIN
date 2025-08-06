'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Building, 
  FileText, 
  Users, 
  Shield, 
  Wrench, 
  Settings, 
  BarChart3, 
  Plus, 
  Search, 
  Filter, 
  Grid, 
  List, 
  Download, 
  Eye, 
  Edit, 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  Star, 
  Target, 
  TrendingUp, 
  Activity, 
  X,
  ChevronDown
} from 'lucide-react';

export default function MyCompanyPage() {
  const { userProfile } = useAuth();
  const [activeTab, setActiveTab] = useState('protocols');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  
  // Modal states for all tabs
  const [showProtocolModal, setShowProtocolModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showComplianceModal, setShowComplianceModal] = useState(false);
  const [showDocumentModal, setShowDocumentModal] = useState(false);
  const [showProcessModal, setShowProcessModal] = useState(false);
  const [showAuditModal, setShowAuditModal] = useState(false);
  const [showQualityModal, setShowQualityModal] = useState(false);
  const [showChecklistModal, setShowChecklistModal] = useState(false);
  const [showCompetenceModal, setShowCompetenceModal] = useState(false);
  const [showIntegrationModal, setShowIntegrationModal] = useState(false);

  // Form states
  const [newProtocol, setNewProtocol] = useState({
    name: '',
    category: 'Sikkerhet',
    description: '',
    responsiblePerson: '',
    department: ''
  });
  const [newReview, setNewReview] = useState({
    title: '',
    type: 'Månedlig',
    description: '',
    responsiblePerson: '',
    department: ''
  });
  const [newCompliance, setNewCompliance] = useState({
    title: '',
    regulation: '',
    description: '',
    responsiblePerson: '',
    department: ''
  });
  const [newDocument, setNewDocument] = useState({
    title: '',
    category: 'Policy',
    description: '',
    responsiblePerson: '',
    department: '',
    version: '1.0'
  });
  const [newProcess, setNewProcess] = useState({
    name: '',
    category: 'Kjerne',
    description: '',
    responsiblePerson: '',
    department: '',
    pdcaPhase: 'Plan'
  });
  const [newAudit, setNewAudit] = useState({
    title: '',
    type: 'Intern',
    scope: '',
    responsiblePerson: '',
    department: '',
    plannedDate: ''
  });
  const [newQuality, setNewQuality] = useState({
    title: '',
    category: 'KPI',
    description: '',
    responsiblePerson: '',
    department: '',
    target: ''
  });
  const [newChecklist, setNewChecklist] = useState({
    title: '',
    category: 'Kontroll',
    description: '',
    responsiblePerson: '',
    department: '',
    frequency: 'Månedlig'
  });
  const [newCompetence, setNewCompetence] = useState({
    title: '',
    category: 'Kurs',
    description: '',
    responsiblePerson: '',
    department: '',
    duration: ''
  });
  const [newIntegration, setNewIntegration] = useState({
    name: '',
    type: 'API',
    description: '',
    responsiblePerson: '',
    department: '',
    status: 'Planlagt'
  });

  // Mock data for demonstration
  const [protocols, setProtocols] = useState([
    { id: '1', name: 'Sikkerhetsprotokoll A', category: 'Sikkerhet', status: 'Aktiv', version: '2.1', lastUpdated: '2024-01-15', responsiblePerson: 'Ola Nordmann' },
    { id: '2', name: 'Kvalitetsprotokoll B', category: 'Kvalitet', status: 'Under revisjon', version: '1.5', lastUpdated: '2024-01-10', responsiblePerson: 'Kari Hansen' }
  ]);
  const [reviews, setReviews] = useState([
    { id: '1', title: 'Månedlig ledelsesgjennomgang', type: 'Månedlig', status: 'Planlagt', date: '2024-02-01', responsiblePerson: 'Leder Team' },
    { id: '2', title: 'Kvartalsgjennomgang Q4', type: 'Kvartal', status: 'Fullført', date: '2024-01-15', responsiblePerson: 'Styret' }
  ]);
  const [compliance, setCompliance] = useState([
    { id: '1', title: 'ISO 9001 Compliance', regulation: 'ISO 9001:2015', status: 'Komplett', nextAssessment: '2024-06-01', responsiblePerson: 'Kvalitetsleder' },
    { id: '2', title: 'Miljølovgivning', regulation: 'Miljølov', status: 'Under vurdering', nextAssessment: '2024-03-15', responsiblePerson: 'Miljøkoordinator' }
  ]);
  const [jsa, setJsa] = useState([
    { id: '1', title: 'SJA for Kranoperasjoner', jobType: 'Kranoperasjon', status: 'Aktiv', lastUpdated: '2024-01-20', responsiblePerson: 'Sikkerhetsleder' },
    { id: '2', title: 'SJA for Høydearbeid', jobType: 'Høydearbeid', status: 'Under utvikling', lastUpdated: '2024-01-18', responsiblePerson: 'Arbeidsleder' }
  ]);
  const [equipment, setEquipment] = useState([
    { id: '1', name: 'Kran Type A', type: 'Maskin', status: 'Operativ', lastInspection: '2024-01-10', responsiblePerson: 'Teknisk leder' },
    { id: '2', name: 'FDV System B', type: 'FDV', status: 'Under vedlikehold', lastInspection: '2024-01-12', responsiblePerson: 'Vedlikeholdsleder' }
  ]);
  const [processes, setProcesses] = useState([
    { id: '1', name: 'Produksjonsprosess A', category: 'Kjerne', status: 'Aktiv', pdcaPhase: 'Do', lastUpdated: '2024-01-15', responsiblePerson: 'Produksjonsleder' },
    { id: '2', name: 'Kvalitetskontroll B', category: 'Støtte', status: 'Under utvikling', pdcaPhase: 'Plan', lastUpdated: '2024-01-08', responsiblePerson: 'Kvalitetsleder' }
  ]);
  const [documents, setDocuments] = useState([
    { id: '1', title: 'Kvalitetspolicy', category: 'Policy', status: 'Aktiv', version: '2.1', lastUpdated: '2024-01-15', responsiblePerson: 'Kvalitetsleder' },
    { id: '2', title: 'Prosedyre A', category: 'Prosedyre', status: 'Under revisjon', version: '1.5', lastUpdated: '2024-01-10', responsiblePerson: 'Prosessleder' }
  ]);
  const [audits, setAudits] = useState([
    { id: '1', title: 'Internrevisjon Q1', type: 'Intern', status: 'Planlagt', plannedDate: '2024-02-15', responsiblePerson: 'Internrevisor', scope: 'Alle kjerneprosesser', department: 'Kvalitet' },
    { id: '2', title: 'Eksternrevisjon ISO', type: 'Ekstern', status: 'Fullført', plannedDate: '2024-01-20', responsiblePerson: 'Kvalitetsleder', scope: 'Hovedleverandører', department: 'Innkjøp' }
  ]);
  const [qualityMetrics, setQualityMetrics] = useState([
    { id: '1', title: 'Kundetilfredshet', category: 'KPI', status: 'Oppnådd', target: '95%', lastUpdated: '2024-01-15', responsiblePerson: 'Kvalitetsleder', description: 'Måling av kundetilfredshet', department: 'Kundeservice' },
    { id: '2', title: 'Produktkvalitet', category: 'Mål', status: 'Under oppfølging', target: '99%', lastUpdated: '2024-01-10', responsiblePerson: 'Produksjonsleder', description: 'Kvalitetskontroll av produkter', department: 'Produksjon' }
  ]);
  const [checklists, setChecklists] = useState([
    { id: '1', title: 'Månedlig kontroll', category: 'Kontroll', status: 'Aktiv', frequency: 'Månedlig', lastUpdated: '2024-01-15', responsiblePerson: 'Kontrollør', description: 'Månedlig kvalitetskontroll', department: 'Kvalitet' },
    { id: '2', title: 'Kvartalsrevisjon', category: 'Revisjon', status: 'Under utvikling', frequency: 'Kvartal', lastUpdated: '2024-01-10', responsiblePerson: 'Revisor', description: 'Kvartalsvis revisjon av prosesser', department: 'Revisjon' }
  ]);
  const [competenceTraining, setCompetenceTraining] = useState([
    { id: '1', title: 'ISO 9001 opplæring', category: 'Kurs', status: 'Fullført', duration: '2 dager', lastUpdated: '2024-01-15', responsiblePerson: 'Opplæringsleder', description: 'Opplæring i kvalitetsstyringssystem', department: 'Kvalitet' },
    { id: '2', title: 'Internrevisjon kurs', category: 'Kurs', status: 'Pågående', duration: '1 dag', lastUpdated: '2024-01-10', responsiblePerson: 'Kursholder', description: 'Kurs i internrevisjon', department: 'HR' }
  ]);
  const [integrations, setIntegrations] = useState([
    { id: '1', name: 'Microsoft 365', type: 'API', status: 'Aktiv', lastUpdated: '2024-01-15', responsiblePerson: 'IT-leder' },
    { id: '2', name: 'PowerOffice', type: 'API', status: 'Under utvikling', lastUpdated: '2024-01-10', responsiblePerson: 'Systemadministrator' }
  ]);

  const tabs = [
    { id: 'protocols', name: 'Protokoller', icon: FileText, color: '#2563eb' },
    { id: 'reviews', name: 'Ledelsesgjennomganger', icon: BarChart3, color: '#059669' },
    { id: 'compliance', name: 'Samsvar (Compliance)', icon: Shield, color: '#dc2626' },
    { id: 'documents', name: 'Dokumenthåndtering', icon: FileText, color: '#0891b2' },
    { id: 'processes', name: 'Prosesshåndtering', icon: Activity, color: '#7c3aed' },
    { id: 'audits', name: 'Internrevisjon', icon: CheckCircle, color: '#ea580c' },
    { id: 'quality', name: 'Kvalitetsstyring', icon: Star, color: '#be185d' },
    { id: 'checklists', name: 'Sjekklister', icon: List, color: '#059669' },
    { id: 'competence', name: 'Kompetanse', icon: Users, color: '#2563eb' },
    { id: 'integrations', name: 'Integrasjoner', icon: Settings, color: '#6b7280' }
  ];

  useEffect(() => {
    if (userProfile) {
      setLoading(false);
    }
  }, [userProfile]);

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        setSuccess(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  // Handle functions for creating new items
  const handleCreateProtocol = () => {
    if (newProtocol.name && newProtocol.description) {
      const protocol = {
        id: Date.now().toString(),
        name: newProtocol.name,
        category: newProtocol.category,
        status: 'Aktiv',
        version: '1.0',
        lastUpdated: new Date().toISOString().split('T')[0],
        responsiblePerson: newProtocol.responsiblePerson || 'Ikke tildelt'
      };
      setProtocols([...protocols, protocol]);
      setNewProtocol({ name: '', category: 'Sikkerhet', description: '', responsiblePerson: '', department: '' });
      setShowProtocolModal(false);
      setSuccess('Protokoll opprettet successfully!');
    }
  };

  const handleCreateReview = () => {
    if (newReview.title && newReview.description) {
      const review = {
        id: Date.now().toString(),
        title: newReview.title,
        type: newReview.type,
        status: 'Planlagt',
        date: new Date().toISOString().split('T')[0],
        responsiblePerson: newReview.responsiblePerson || 'Ikke tildelt'
      };
      setReviews([...reviews, review]);
      setNewReview({ title: '', type: 'Månedlig', description: '', responsiblePerson: '', department: '' });
      setShowReviewModal(false);
      setSuccess('Ledelsesgjennomgang opprettet successfully!');
    }
  };

  const handleCreateCompliance = () => {
    if (newCompliance.title && newCompliance.regulation) {
      const complianceItem = {
        id: Date.now().toString(),
        title: newCompliance.title,
        regulation: newCompliance.regulation,
        status: 'Under vurdering',
        nextAssessment: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        responsiblePerson: newCompliance.responsiblePerson || 'Ikke tildelt'
      };
      setCompliance([...compliance, complianceItem]);
      setNewCompliance({ title: '', regulation: '', description: '', responsiblePerson: '', department: '' });
      setShowComplianceModal(false);
      setSuccess('Compliance opprettet successfully!');
    }
  };

  const handleCreateDocument = () => {
    if (newDocument.title && newDocument.category) {
      const documentItem = {
        id: Date.now().toString(),
        title: newDocument.title,
        category: newDocument.category,
        status: 'Aktiv',
        version: newDocument.version,
        lastUpdated: new Date().toISOString().split('T')[0],
        responsiblePerson: newDocument.responsiblePerson || 'Ikke tildelt'
      };
      setDocuments([...documents, documentItem]);
      setNewDocument({ title: '', category: 'Policy', description: '', responsiblePerson: '', department: '', version: '1.0' });
      setShowDocumentModal(false);
      setSuccess('Dokument opprettet successfully!');
    }
  };

  const handleCreateAudit = () => {
    if (newAudit.title && newAudit.type) {
      const auditItem = {
        id: Date.now().toString(),
        title: newAudit.title,
        type: newAudit.type,
        status: 'Planlagt',
        plannedDate: newAudit.plannedDate,
        responsiblePerson: newAudit.responsiblePerson || 'Ikke tildelt'
      };
      setAudits([...audits, auditItem]);
      setNewAudit({ title: '', type: 'Intern', scope: '', responsiblePerson: '', department: '', plannedDate: '' });
      setShowAuditModal(false);
      setSuccess('Internrevisjon opprettet successfully!');
    }
  };

  const handleCreateProcess = () => {
    if (newProcess.name && newProcess.category) {
      const processItem = {
        id: Date.now().toString(),
        name: newProcess.name,
        category: newProcess.category,
        status: 'Aktiv',
        pdcaPhase: newProcess.pdcaPhase,
        lastUpdated: new Date().toISOString().split('T')[0],
        responsiblePerson: newProcess.responsiblePerson || 'Ikke tildelt'
      };
      setProcesses([...processes, processItem]);
      setNewProcess({ name: '', category: 'Kjerne', description: '', responsiblePerson: '', department: '', pdcaPhase: 'Plan' });
      setShowProcessModal(false);
      setSuccess('Prosess opprettet successfully!');
    }
  };

  const handleCreateQuality = () => {
    if (newQuality.title && newQuality.category) {
      const qualityItem = {
        id: Date.now().toString(),
        title: newQuality.title,
        category: newQuality.category,
        status: 'Under oppfølging',
        target: newQuality.target,
        lastUpdated: new Date().toISOString().split('T')[0],
        responsiblePerson: newQuality.responsiblePerson || 'Ikke tildelt',
        description: newQuality.description || '',
        department: newQuality.department || ''
      };
      setQualityMetrics([...qualityMetrics, qualityItem]);
      setNewQuality({ title: '', category: 'KPI', description: '', responsiblePerson: '', department: '', target: '' });
      setShowQualityModal(false);
      setSuccess('Kvalitetsmål opprettet successfully!');
    }
  };

  const handleCreateChecklist = () => {
    if (newChecklist.title && newChecklist.category) {
      const checklistItem = {
        id: Date.now().toString(),
        title: newChecklist.title,
        category: newChecklist.category,
        status: 'Aktiv',
        frequency: newChecklist.frequency,
        lastUpdated: new Date().toISOString().split('T')[0],
        responsiblePerson: newChecklist.responsiblePerson || 'Ikke tildelt',
        description: newChecklist.description || '',
        department: newChecklist.department || ''
      };
      setChecklists([...checklists, checklistItem]);
      setNewChecklist({ title: '', category: 'Kontroll', description: '', responsiblePerson: '', department: '', frequency: 'Månedlig' });
      setShowChecklistModal(false);
      setSuccess('Sjekkliste opprettet successfully!');
    }
  };

  const handleCreateCompetence = () => {
    if (newCompetence.title && newCompetence.category) {
      const competenceItem = {
        id: Date.now().toString(),
        title: newCompetence.title,
        category: newCompetence.category,
        status: 'Pågående',
        duration: newCompetence.duration,
        lastUpdated: new Date().toISOString().split('T')[0],
        responsiblePerson: newCompetence.responsiblePerson || 'Ikke tildelt',
        description: newCompetence.description || '',
        department: newCompetence.department || ''
      };
      setCompetenceTraining([...competenceTraining, competenceItem]);
      setNewCompetence({ title: '', category: 'Kurs', description: '', responsiblePerson: '', department: '', duration: '' });
      setShowCompetenceModal(false);
      setSuccess('Kompetanseopplæring opprettet successfully!');
    }
  };

  const handleCreateIntegration = () => {
    if (newIntegration.name && newIntegration.type) {
      const integrationItem = {
        id: Date.now().toString(),
        name: newIntegration.name,
        type: newIntegration.type,
        status: newIntegration.status,
        lastUpdated: new Date().toISOString().split('T')[0],
        responsiblePerson: newIntegration.responsiblePerson || 'Ikke tildelt'
      };
      setIntegrations([...integrations, integrationItem]);
      setNewIntegration({ name: '', type: 'API', description: '', responsiblePerson: '', department: '', status: 'Planlagt' });
      setShowIntegrationModal(false);
      setSuccess('Integrasjon opprettet successfully!');
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#f9fafb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ 
            width: '48px', 
            height: '48px', 
            border: '2px solid #2563eb', 
            borderTop: '2px solid transparent', 
            borderRadius: '50%', 
            animation: 'spin 1s linear infinite',
            margin: '0 auto'
          }}></div>
          <p style={{ marginTop: '1rem', color: '#6b7280' }}>Laster Min Bedrift...</p>
        </div>
      </div>
    );
  }

  if (!userProfile) {
    return (
      <div style={{ minHeight: '100vh', background: '#f9fafb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ background: '#fef2f2', padding: '2rem', borderRadius: '8px', border: '1px solid #fecaca' }}>
            <AlertCircle style={{ width: '48px', height: '48px', color: '#dc2626', margin: '0 auto 1rem' }} />
            <h2 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#991b1b', marginBottom: '0.5rem' }}>
              Ingen brukerinformasjon
            </h2>
            <p style={{ color: '#b91c1c' }}>
              Vennligst logg inn på nytt for å få tilgang til Min Bedrift.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb' }}>
      {/* Header */}
      <div style={{ background: '#ffffff', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)', borderBottom: '1px solid #e5e7eb', padding: '1.5rem 2rem' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1 style={{ fontSize: '1.875rem', fontWeight: '700', color: '#111827' }}>Min Bedrift</h1>
            <p style={{ color: '#6b7280', marginTop: '0.25rem' }}>
              Enterprise Management Platform
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button
              style={{ 
                background: '#2563eb',
                color: 'white',
                border: 'none',
                padding: '0.75rem 1.5rem',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                transition: 'all 0.15s ease',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
              }}
            >
              <Plus style={{ width: '16px', height: '16px' }} />
              Oppdater Data
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '2rem' }}>
        {/* Tab Navigation */}
        <div style={{ 
          marginBottom: '2rem',
          borderBottom: '1px solid #e5e7eb',
          paddingBottom: '1rem'
        }}>
          {/* Responsive Navigation */}
          <div style={{ 
            display: 'flex', 
            gap: '0.5rem', 
            flexWrap: 'wrap',
            alignItems: 'center'
          }}>
            {/* First 5 tabs always visible */}
            {tabs.slice(0, 5).map((tab) => {
              const IconComponent = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.75rem 1rem',
                    borderRadius: '8px',
                    border: 'none',
                    background: activeTab === tab.id ? tab.color : '#f3f4f6',
                    color: activeTab === tab.id ? 'white' : '#374151',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '500',
                    transition: 'all 0.15s ease',
                    whiteSpace: 'nowrap',
                    minWidth: 'fit-content'
                  }}
                >
                  <IconComponent style={{ width: '16px', height: '16px' }} />
                  {tab.name}
                </button>
              );
            })}
            
            {/* Dropdown for remaining tabs */}
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setShowMobileMenu(!showMobileMenu)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.75rem 1rem',
                  borderRadius: '8px',
                  border: '1px solid #d1d5db',
                  background: '#ffffff',
                  color: '#374151',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500',
                  whiteSpace: 'nowrap'
                }}
              >
                <span>Mer</span>
                <ChevronDown style={{ width: '16px', height: '16px' }} />
              </button>
              
              {showMobileMenu && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  right: '0',
                  background: '#ffffff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                  zIndex: 1000,
                  minWidth: '200px',
                  marginTop: '0.5rem'
                }}>
                  {tabs.slice(5).map((tab) => {
                    const IconComponent = tab.icon;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => {
                          setActiveTab(tab.id);
                          setShowMobileMenu(false);
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          padding: '0.75rem 1rem',
                          border: 'none',
                          background: 'transparent',
                          color: activeTab === tab.id ? tab.color : '#374151',
                          cursor: 'pointer',
                          fontSize: '14px',
                          fontWeight: activeTab === tab.id ? '600' : '500',
                          width: '100%',
                          textAlign: 'left',
                          borderBottom: '1px solid #f3f4f6'
                        }}
                      >
                        <IconComponent style={{ width: '16px', height: '16px' }} />
                        {tab.name}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

          </div>
        </div>

        {/* Tab Content */}
        <div style={{ background: '#ffffff', borderRadius: '12px', padding: '2rem', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)' }}>
          {activeTab === 'protocols' && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: '600', color: '#111827' }}>Protokoller</h2>
                <button
                  onClick={() => setShowProtocolModal(true)}
                  style={{ 
                    background: '#2563eb',
                    color: 'white',
                    border: 'none',
                    padding: '0.75rem 1.5rem',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    transition: 'all 0.15s ease',
                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
                  }}
                >
                  <Plus style={{ width: '16px', height: '16px' }} />
                  Ny Protokoll
                </button>
              </div>
              
              {/* Statistics */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                <div style={{ background: '#f0f9ff', padding: '1.5rem', borderRadius: '8px', border: '1px solid #bae6fd' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <CheckCircle style={{ width: '20px', height: '20px', color: '#059669' }} />
                    <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>Aktive</span>
                  </div>
                  <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#111827' }}>
                    {protocols.filter(p => p.status === 'Aktiv').length}
                  </div>
                </div>
                <div style={{ background: '#fef3c7', padding: '1.5rem', borderRadius: '8px', border: '1px solid #fcd34d' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <Clock style={{ width: '20px', height: '20px', color: '#d97706' }} />
                    <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>Under Revisjon</span>
                  </div>
                  <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#111827' }}>
                    {protocols.filter(p => p.status === 'Under revisjon').length}
                  </div>
                </div>
                <div style={{ background: '#f3f4f6', padding: '1.5rem', borderRadius: '8px', border: '1px solid #d1d5db' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <FileText style={{ width: '20px', height: '20px', color: '#6b7280' }} />
                    <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>Totalt</span>
                  </div>
                  <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#111827' }}>
                    {protocols.length}
                  </div>
                </div>
              </div>

              {/* Protocol List */}
              <div style={{ background: '#ffffff', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                <div style={{ padding: '1rem', borderBottom: '1px solid #e5e7eb' }}>
                  <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#111827' }}>Alle Protokoller</h3>
                </div>
                <div>
                  {protocols.map((protocol) => (
                    <div key={protocol.id} style={{ 
                      padding: '1rem', 
                      borderBottom: '1px solid #f3f4f6',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}>
                      <div style={{ flex: '1' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                          <h4 style={{ fontSize: '1rem', fontWeight: '600', color: '#111827' }}>{protocol.name}</h4>
                          <span style={{ 
                            padding: '0.25rem 0.5rem', 
                            borderRadius: '4px', 
                            fontSize: '0.75rem', 
                            fontWeight: '500',
                            background: protocol.status === 'Aktiv' ? '#dcfce7' : '#fef3c7',
                            color: protocol.status === 'Aktiv' ? '#166534' : '#d97706'
                          }}>
                            {protocol.status}
                          </span>
                        </div>
                        <div style={{ display: 'flex', gap: '1rem', fontSize: '0.875rem', color: '#6b7280' }}>
                          <span>Kategori: {protocol.category}</span>
                          <span>Versjon: {protocol.version}</span>
                          <span>Ansvarlig: {protocol.responsiblePerson}</span>
                          <span>Sist oppdatert: {protocol.lastUpdated}</span>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button style={{
                          padding: '0.5rem',
                          border: '1px solid #d1d5db',
                          background: '#ffffff',
                          color: '#374151',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'all 0.15s ease'
                        }}>
                          <Eye style={{ width: '16px', height: '16px' }} />
                        </button>
                        <button style={{
                          padding: '0.5rem',
                          border: '1px solid #d1d5db',
                          background: '#ffffff',
                          color: '#374151',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'all 0.15s ease'
                        }}>
                          <Edit style={{ width: '16px', height: '16px' }} />
                        </button>
                        <button style={{
                          padding: '0.5rem',
                          border: '1px solid #d1d5db',
                          background: '#ffffff',
                          color: '#374151',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'all 0.15s ease'
                        }}>
                          <Download style={{ width: '16px', height: '16px' }} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'reviews' && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: '600', color: '#111827' }}>Ledelsesgjennomganger</h2>
                <button
                  onClick={() => setShowReviewModal(true)}
                  style={{ 
                    background: '#2563eb',
                    color: 'white',
                    border: 'none',
                    padding: '0.75rem 1.5rem',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    transition: 'all 0.15s ease',
                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
                  }}
                >
                  <Plus style={{ width: '16px', height: '16px' }} />
                  Ny Gjennomgang
                </button>
              </div>
              
              {/* Statistics */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                <div style={{ background: '#f0f9ff', padding: '1.5rem', borderRadius: '8px', border: '1px solid #bae6fd' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <BarChart3 style={{ width: '20px', height: '20px', color: '#059669' }} />
                    <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>Planlagt</span>
                  </div>
                  <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#111827' }}>
                    {reviews.filter(r => r.status === 'Planlagt').length}
                  </div>
                </div>
                <div style={{ background: '#fef3c7', padding: '1.5rem', borderRadius: '8px', border: '1px solid #fcd34d' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <CheckCircle style={{ width: '20px', height: '20px', color: '#d97706' }} />
                    <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>Fullført</span>
                  </div>
                  <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#111827' }}>
                    {reviews.filter(r => r.status === 'Fullført').length}
                  </div>
                </div>
                <div style={{ background: '#f3f4f6', padding: '1.5rem', borderRadius: '8px', border: '1px solid #d1d5db' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <TrendingUp style={{ width: '20px', height: '20px', color: '#6b7280' }} />
                    <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>Totalt</span>
                  </div>
                  <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#111827' }}>
                    {reviews.length}
                  </div>
                </div>
              </div>

              {/* Reviews List */}
              <div style={{ background: '#ffffff', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                <div style={{ padding: '1rem', borderBottom: '1px solid #e5e7eb' }}>
                  <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#111827' }}>Alle Ledelsesgjennomganger</h3>
                </div>
                <div>
                  {reviews.map((review) => (
                    <div key={review.id} style={{ 
                      padding: '1rem', 
                      borderBottom: '1px solid #f3f4f6',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}>
                      <div style={{ flex: '1' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                          <h4 style={{ fontSize: '1rem', fontWeight: '600', color: '#111827' }}>{review.title}</h4>
                          <span style={{ 
                            padding: '0.25rem 0.5rem', 
                            borderRadius: '4px', 
                            fontSize: '0.75rem', 
                            fontWeight: '500',
                            background: review.status === 'Fullført' ? '#dcfce7' : review.status === 'Planlagt' ? '#fef3c7' : '#f3f4f6',
                            color: review.status === 'Fullført' ? '#166534' : review.status === 'Planlagt' ? '#d97706' : '#6b7280'
                          }}>
                            {review.status}
                          </span>
                        </div>
                        <div style={{ display: 'flex', gap: '1rem', fontSize: '0.875rem', color: '#6b7280' }}>
                          <span>Type: {review.type}</span>
                          <span>Dato: {review.date}</span>
                          <span>Ansvarlig: {review.responsiblePerson}</span>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button style={{
                          padding: '0.5rem',
                          border: '1px solid #d1d5db',
                          background: '#ffffff',
                          color: '#374151',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'all 0.15s ease'
                        }}>
                          <Eye style={{ width: '16px', height: '16px' }} />
                        </button>
                        <button style={{
                          padding: '0.5rem',
                          border: '1px solid #d1d5db',
                          background: '#ffffff',
                          color: '#374151',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'all 0.15s ease'
                        }}>
                          <Edit style={{ width: '16px', height: '16px' }} />
                        </button>
                        <button style={{
                          padding: '0.5rem',
                          border: '1px solid #d1d5db',
                          background: '#ffffff',
                          color: '#374151',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'all 0.15s ease'
                        }}>
                          <Download style={{ width: '16px', height: '16px' }} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'compliance' && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: '600', color: '#111827' }}>Samsvar (Compliance)</h2>
                <button
                  onClick={() => setShowComplianceModal(true)}
                  style={{ 
                    background: '#2563eb',
                    color: 'white',
                    border: 'none',
                    padding: '0.75rem 1.5rem',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    transition: 'all 0.15s ease',
                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
                  }}
                >
                  <Plus style={{ width: '16px', height: '16px' }} />
                  Ny Samsvar
                </button>
              </div>
              
              {/* Statistics */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                <div style={{ background: '#dcfce7', padding: '1.5rem', borderRadius: '8px', border: '1px solid #bbf7d0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <CheckCircle style={{ width: '20px', height: '20px', color: '#059669' }} />
                    <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>Komplett</span>
                  </div>
                  <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#111827' }}>
                    {compliance.filter(c => c.status === 'Komplett').length}
                  </div>
                </div>
                <div style={{ background: '#fef3c7', padding: '1.5rem', borderRadius: '8px', border: '1px solid #fcd34d' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <Clock style={{ width: '20px', height: '20px', color: '#d97706' }} />
                    <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>Under Vurdering</span>
                  </div>
                  <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#111827' }}>
                    {compliance.filter(c => c.status === 'Under vurdering').length}
                  </div>
                </div>
                <div style={{ background: '#f3f4f6', padding: '1.5rem', borderRadius: '8px', border: '1px solid #d1d5db' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <Shield style={{ width: '20px', height: '20px', color: '#6b7280' }} />
                    <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>Totalt</span>
                  </div>
                  <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#111827' }}>
                    {compliance.length}
                  </div>
                </div>
              </div>

              {/* Compliance List */}
              <div style={{ background: '#ffffff', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                <div style={{ padding: '1rem', borderBottom: '1px solid #e5e7eb' }}>
                  <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#111827' }}>Alle Samsvarskrav</h3>
                </div>
                <div>
                  {compliance.map((item) => (
                    <div key={item.id} style={{ 
                      padding: '1rem', 
                      borderBottom: '1px solid #f3f4f6',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}>
                      <div style={{ flex: '1' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                          <h4 style={{ fontSize: '1rem', fontWeight: '600', color: '#111827' }}>{item.title}</h4>
                          <span style={{ 
                            padding: '0.25rem 0.5rem', 
                            borderRadius: '4px', 
                            fontSize: '0.75rem', 
                            fontWeight: '500',
                            background: item.status === 'Komplett' ? '#dcfce7' : '#fef3c7',
                            color: item.status === 'Komplett' ? '#166534' : '#d97706'
                          }}>
                            {item.status}
                          </span>
                        </div>
                        <div style={{ display: 'flex', gap: '1rem', fontSize: '0.875rem', color: '#6b7280' }}>
                          <span>Regelverk: {item.regulation}</span>
                          <span>Neste vurdering: {item.nextAssessment}</span>
                          <span>Ansvarlig: {item.responsiblePerson}</span>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button style={{
                          padding: '0.5rem',
                          border: '1px solid #d1d5db',
                          background: '#ffffff',
                          color: '#374151',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'all 0.15s ease'
                        }}>
                          <Eye style={{ width: '16px', height: '16px' }} />
                        </button>
                        <button style={{
                          padding: '0.5rem',
                          border: '1px solid #d1d5db',
                          background: '#ffffff',
                          color: '#374151',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'all 0.15s ease'
                        }}>
                          <Edit style={{ width: '16px', height: '16px' }} />
                        </button>
                        <button style={{
                          padding: '0.5rem',
                          border: '1px solid #d1d5db',
                          background: '#ffffff',
                          color: '#374151',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'all 0.15s ease'
                        }}>
                          <Download style={{ width: '16px', height: '16px' }} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'documents' && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: '600', color: '#111827' }}>Dokumenthåndtering</h2>
                <button
                  onClick={() => setShowDocumentModal(true)}
                  style={{ 
                    background: '#2563eb',
                    color: 'white',
                    border: 'none',
                    padding: '0.75rem 1.5rem',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    transition: 'all 0.15s ease',
                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
                  }}
                >
                  <Plus style={{ width: '16px', height: '16px' }} />
                  Nytt Dokument
                </button>
              </div>
              
              {/* Statistics */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                <div style={{ background: '#dcfce7', padding: '1.5rem', borderRadius: '8px', border: '1px solid #bbf7d0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <CheckCircle style={{ width: '20px', height: '20px', color: '#059669' }} />
                    <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>Aktive</span>
                  </div>
                  <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#111827' }}>
                    {documents.filter(d => d.status === 'Aktiv').length}
                  </div>
                </div>
                <div style={{ background: '#fef3c7', padding: '1.5rem', borderRadius: '8px', border: '1px solid #fcd34d' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <Clock style={{ width: '20px', height: '20px', color: '#d97706' }} />
                    <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>Under Revisjon</span>
                  </div>
                  <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#111827' }}>
                    {documents.filter(d => d.status === 'Under revisjon').length}
                  </div>
                </div>
                <div style={{ background: '#f3f4f6', padding: '1.5rem', borderRadius: '8px', border: '1px solid #d1d5db' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <FileText style={{ width: '20px', height: '20px', color: '#6b7280' }} />
                    <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>Totalt</span>
                  </div>
                  <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#111827' }}>
                    {documents.length}
                  </div>
                </div>
              </div>

              {/* Documents List */}
              <div style={{ background: '#ffffff', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                <div style={{ padding: '1rem', borderBottom: '1px solid #e5e7eb' }}>
                  <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#111827' }}>Alle Dokumenter</h3>
                </div>
                <div>
                  {documents.map((doc) => (
                    <div key={doc.id} style={{ 
                      padding: '1rem', 
                      borderBottom: '1px solid #f3f4f6',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}>
                      <div style={{ flex: '1' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                          <h4 style={{ fontSize: '1rem', fontWeight: '600', color: '#111827' }}>{doc.title}</h4>
                          <span style={{ 
                            padding: '0.25rem 0.5rem', 
                            borderRadius: '4px', 
                            fontSize: '0.75rem', 
                            fontWeight: '500',
                            background: doc.status === 'Aktiv' ? '#dcfce7' : '#fef3c7',
                            color: doc.status === 'Aktiv' ? '#166534' : '#d97706'
                          }}>
                            {doc.status}
                          </span>
                        </div>
                        <div style={{ display: 'flex', gap: '1rem', fontSize: '0.875rem', color: '#6b7280' }}>
                          <span>Kategori: {doc.category}</span>
                          <span>Versjon: {doc.version}</span>
                          <span>Sist oppdatert: {doc.lastUpdated}</span>
                          <span>Ansvarlig: {doc.responsiblePerson}</span>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button style={{
                          padding: '0.5rem',
                          border: '1px solid #d1d5db',
                          background: '#ffffff',
                          color: '#374151',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'all 0.15s ease'
                        }}>
                          <Eye style={{ width: '16px', height: '16px' }} />
                        </button>
                        <button style={{
                          padding: '0.5rem',
                          border: '1px solid #d1d5db',
                          background: '#ffffff',
                          color: '#374151',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'all 0.15s ease'
                        }}>
                          <Edit style={{ width: '16px', height: '16px' }} />
                        </button>
                        <button style={{
                          padding: '0.5rem',
                          border: '1px solid #d1d5db',
                          background: '#ffffff',
                          color: '#374151',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'all 0.15s ease'
                        }}>
                          <Download style={{ width: '16px', height: '16px' }} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'equipment' && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: '600', color: '#111827' }}>Utstyr & FDV</h2>
                <button
                  style={{ 
                    background: '#2563eb',
                    color: 'white',
                    border: 'none',
                    padding: '0.75rem 1.5rem',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    transition: 'all 0.15s ease',
                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
                  }}
                >
                  <Plus style={{ width: '16px', height: '16px' }} />
                  Nytt Utstyr
                </button>
              </div>
              <p style={{ color: '#6b7280' }}>Avansert utstyrs- og FDV-håndtering kommer snart...</p>
            </div>
          )}

          {activeTab === 'processes' && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: '600', color: '#111827' }}>Arbeidsprosesser</h2>
                <button
                  style={{ 
                    background: '#2563eb',
                    color: 'white',
                    border: 'none',
                    padding: '0.75rem 1.5rem',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    transition: 'all 0.15s ease',
                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
                  }}
                >
                  <Plus style={{ width: '16px', height: '16px' }} />
                  Ny Prosess
                </button>
              </div>
              <p style={{ color: '#6b7280' }}>Avansert prosesshåndtering kommer snart...</p>
            </div>
          )}

          {activeTab === 'orgchart' && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: '600', color: '#111827' }}>Organisasjonskart</h2>
                <button
                  style={{ 
                    background: '#2563eb',
                    color: 'white',
                    border: 'none',
                    padding: '0.75rem 1.5rem',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    transition: 'all 0.15s ease',
                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
                  }}
                >
                  <Plus style={{ width: '16px', height: '16px' }} />
                  Ny Avdeling
                </button>
              </div>
              <p style={{ color: '#6b7280' }}>Avansert organisasjonskart kommer snart...</p>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {showProtocolModal && (
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
            background: '#ffffff',
            borderRadius: '12px',
            padding: '2rem',
            width: '90%',
            maxWidth: '600px',
            maxHeight: '90vh',
            overflow: 'auto'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: '600', color: '#111827' }}>Ny Protokoll</h2>
              <button
                onClick={() => setShowProtocolModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '0.5rem'
                }}
              >
                <X style={{ width: '24px', height: '24px', color: '#6b7280' }} />
              </button>
            </div>
            
            <div style={{ display: 'grid', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#374151' }}>
                  Navn på protokoll
                </label>
                <input
                  type="text"
                  value={newProtocol.name}
                  onChange={(e) => setNewProtocol({...newProtocol, name: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                  placeholder="Skriv navn på protokollen"
                />
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#374151' }}>
                  Kategori
                </label>
                <select
                  value={newProtocol.category}
                  onChange={(e) => setNewProtocol({...newProtocol, category: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                >
                  <option value="Sikkerhet">Sikkerhet</option>
                  <option value="Kvalitet">Kvalitet</option>
                  <option value="Miljø">Miljø</option>
                  <option value="HMS">HMS</option>
                  <option value="Prosess">Prosess</option>
                </select>
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#374151' }}>
                  Beskrivelse
                </label>
                <textarea
                  value={newProtocol.description}
                  onChange={(e) => setNewProtocol({...newProtocol, description: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px',
                    minHeight: '100px',
                    resize: 'vertical'
                  }}
                  placeholder="Beskriv protokollen"
                />
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#374151' }}>
                  Ansvarlig person
                </label>
                <input
                  type="text"
                  value={newProtocol.responsiblePerson}
                  onChange={(e) => setNewProtocol({...newProtocol, responsiblePerson: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                  placeholder="Navn på ansvarlig person"
                />
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#374151' }}>
                  Avdeling
                </label>
                <input
                  type="text"
                  value={newProtocol.department}
                  onChange={(e) => setNewProtocol({...newProtocol, department: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                  placeholder="Avdeling"
                />
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
              <button
                onClick={handleCreateProtocol}
                style={{
                  background: '#2563eb',
                  color: 'white',
                  border: 'none',
                  padding: '0.75rem 1.5rem',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  flex: '1'
                }}
              >
                Opprett Protokoll
              </button>
              <button
                onClick={() => setShowProtocolModal(false)}
                style={{
                  background: '#6b7280',
                  color: 'white',
                  border: 'none',
                  padding: '0.75rem 1.5rem',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  flex: '1'
                }}
              >
                Avbryt
              </button>
            </div>
          </div>
        </div>
                )}

      {/* Review Modal */}
      {showReviewModal && (
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
            background: '#ffffff',
            borderRadius: '12px',
            padding: '2rem',
            width: '90%',
            maxWidth: '600px',
            maxHeight: '90vh',
            overflow: 'auto'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: '600', color: '#111827' }}>Ny Ledelsesgjennomgang</h2>
              <button
                onClick={() => setShowReviewModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '0.5rem'
                }}
              >
                <X style={{ width: '24px', height: '24px', color: '#6b7280' }} />
              </button>
            </div>
            
            <div style={{ display: 'grid', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#374151' }}>
                  Tittel
                </label>
                <input
                  type="text"
                  value={newReview.title}
                  onChange={(e) => setNewReview({...newReview, title: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                  placeholder="Skriv tittel på gjennomgangen"
                />
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#374151' }}>
                  Type
                </label>
                <select
                  value={newReview.type}
                  onChange={(e) => setNewReview({...newReview, type: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                >
                  <option value="Månedlig">Månedlig</option>
                  <option value="Kvartal">Kvartal</option>
                  <option value="Årlig">Årlig</option>
                </select>
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#374151' }}>
                  Beskrivelse
                </label>
                <textarea
                  value={newReview.description}
                  onChange={(e) => setNewReview({...newReview, description: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px',
                    minHeight: '100px',
                    resize: 'vertical'
                  }}
                  placeholder="Beskriv gjennomgangen"
                />
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#374151' }}>
                  Ansvarlig person
                </label>
                <input
                  type="text"
                  value={newReview.responsiblePerson}
                  onChange={(e) => setNewReview({...newReview, responsiblePerson: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                  placeholder="Navn på ansvarlig person"
                />
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#374151' }}>
                  Avdeling
                </label>
                <input
                  type="text"
                  value={newReview.department}
                  onChange={(e) => setNewReview({...newReview, department: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                  placeholder="Avdeling"
                />
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
              <button
                onClick={handleCreateReview}
                style={{
                  background: '#2563eb',
                  color: 'white',
                  border: 'none',
                  padding: '0.75rem 1.5rem',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  flex: '1'
                }}
              >
                Opprett Gjennomgang
              </button>
              <button
                onClick={() => setShowReviewModal(false)}
                style={{
                  background: '#6b7280',
                  color: 'white',
                  border: 'none',
                  padding: '0.75rem 1.5rem',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  flex: '1'
                }}
              >
                Avbryt
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Compliance Modal */}
      {showComplianceModal && (
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
            background: '#ffffff',
            borderRadius: '12px',
            padding: '2rem',
            width: '90%',
            maxWidth: '600px',
            maxHeight: '90vh',
            overflow: 'auto'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: '600', color: '#111827' }}>Nytt Samsvarskrav</h2>
              <button
                onClick={() => setShowComplianceModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '0.5rem'
                }}
              >
                <X style={{ width: '24px', height: '24px', color: '#6b7280' }} />
              </button>
            </div>
            
            <div style={{ display: 'grid', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#374151' }}>
                  Tittel
                </label>
                <input
                  type="text"
                  value={newCompliance.title}
                  onChange={(e) => setNewCompliance({...newCompliance, title: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                  placeholder="Skriv tittel på samsvarskravet"
                />
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#374151' }}>
                  Regelverk
                </label>
                <input
                  type="text"
                  value={newCompliance.regulation}
                  onChange={(e) => setNewCompliance({...newCompliance, regulation: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                  placeholder="F.eks. ISO 9001, lovverk, etc."
                />
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#374151' }}>
                  Beskrivelse
                </label>
                <textarea
                  value={newCompliance.description}
                  onChange={(e) => setNewCompliance({...newCompliance, description: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px',
                    minHeight: '100px',
                    resize: 'vertical'
                  }}
                  placeholder="Beskriv samsvarskravet"
                />
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#374151' }}>
                  Ansvarlig person
                </label>
                <input
                  type="text"
                  value={newCompliance.responsiblePerson}
                  onChange={(e) => setNewCompliance({...newCompliance, responsiblePerson: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                  placeholder="Navn på ansvarlig person"
                />
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#374151' }}>
                  Avdeling
                </label>
                <input
                  type="text"
                  value={newCompliance.department}
                  onChange={(e) => setNewCompliance({...newCompliance, department: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                  placeholder="Avdeling"
                />
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
              <button
                onClick={handleCreateCompliance}
                style={{
                  background: '#2563eb',
                  color: 'white',
                  border: 'none',
                  padding: '0.75rem 1.5rem',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  flex: '1'
                }}
              >
                Opprett Samsvarskrav
              </button>
              <button
                onClick={() => setShowComplianceModal(false)}
                style={{
                  background: '#6b7280',
                  color: 'white',
                  border: 'none',
                  padding: '0.75rem 1.5rem',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  flex: '1'
                }}
              >
                Avbryt
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Document Modal */}
      {showDocumentModal && (
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
            background: '#ffffff',
            borderRadius: '12px',
            padding: '2rem',
            width: '90%',
            maxWidth: '600px',
            maxHeight: '90vh',
            overflow: 'auto'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: '600', color: '#111827' }}>Nytt Dokument</h2>
              <button
                onClick={() => setShowDocumentModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '0.5rem'
                }}
              >
                <X style={{ width: '24px', height: '24px', color: '#6b7280' }} />
              </button>
            </div>
            
            <div style={{ display: 'grid', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#374151' }}>
                  Tittel
                </label>
                <input
                  type="text"
                  value={newDocument.title}
                  onChange={(e) => setNewDocument({...newDocument, title: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                  placeholder="Skriv tittel på dokumentet"
                />
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#374151' }}>
                  Kategori
                </label>
                <select
                  value={newDocument.category}
                  onChange={(e) => setNewDocument({...newDocument, category: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                >
                  <option value="Policy">Policy</option>
                  <option value="Prosedyre">Prosedyre</option>
                  <option value="Instruks">Instruks</option>
                  <option value="Skjema">Skjema</option>
                </select>
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#374151' }}>
                  Versjon
                </label>
                <input
                  type="text"
                  value={newDocument.version}
                  onChange={(e) => setNewDocument({...newDocument, version: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                  placeholder="F.eks. 1.0"
                />
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#374151' }}>
                  Beskrivelse
                </label>
                <textarea
                  value={newDocument.description}
                  onChange={(e) => setNewDocument({...newDocument, description: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px',
                    minHeight: '100px',
                    resize: 'vertical'
                  }}
                  placeholder="Beskriv dokumentet"
                />
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#374151' }}>
                  Ansvarlig person
                </label>
                <input
                  type="text"
                  value={newDocument.responsiblePerson}
                  onChange={(e) => setNewDocument({...newDocument, responsiblePerson: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                  placeholder="Navn på ansvarlig person"
                />
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#374151' }}>
                  Avdeling
                </label>
                <input
                  type="text"
                  value={newDocument.department}
                  onChange={(e) => setNewDocument({...newDocument, department: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                  placeholder="Avdeling"
                />
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
              <button
                onClick={handleCreateDocument}
                style={{
                  background: '#2563eb',
                  color: 'white',
                  border: 'none',
                  padding: '0.75rem 1.5rem',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  flex: '1'
                }}
              >
                Opprett Dokument
              </button>
              <button
                onClick={() => setShowDocumentModal(false)}
                style={{
                  background: '#6b7280',
                  color: 'white',
                  border: 'none',
                  padding: '0.75rem 1.5rem',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  flex: '1'
                }}
              >
                Avbryt
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Process Modal */}
      {showProcessModal && (
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
            background: '#ffffff',
            borderRadius: '12px',
            padding: '2rem',
            width: '90%',
            maxWidth: '600px',
            maxHeight: '90vh',
            overflow: 'auto'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: '600', color: '#111827' }}>Ny Prosess</h2>
              <button
                onClick={() => setShowProcessModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '0.5rem'
                }}
              >
                <X style={{ width: '24px', height: '24px', color: '#6b7280' }} />
              </button>
            </div>
            
            <div style={{ display: 'grid', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#374151' }}>
                  Navn på prosess
                </label>
                <input
                  type="text"
                  value={newProcess.name}
                  onChange={(e) => setNewProcess({...newProcess, name: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                  placeholder="Skriv navn på prosessen"
                />
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#374151' }}>
                  Kategori
                </label>
                <select
                  value={newProcess.category}
                  onChange={(e) => setNewProcess({...newProcess, category: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                >
                  <option value="Kjerne">Kjerne</option>
                  <option value="Støtte">Støtte</option>
                  <option value="Ledelse">Ledelse</option>
                </select>
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#374151' }}>
                  PDCA-fase
                </label>
                <select
                  value={newProcess.pdcaPhase}
                  onChange={(e) => setNewProcess({...newProcess, pdcaPhase: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                >
                  <option value="Plan">Plan</option>
                  <option value="Do">Do</option>
                  <option value="Check">Check</option>
                  <option value="Act">Act</option>
                </select>
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#374151' }}>
                  Beskrivelse
                </label>
                <textarea
                  value={newProcess.description}
                  onChange={(e) => setNewProcess({...newProcess, description: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px',
                    minHeight: '100px',
                    resize: 'vertical'
                  }}
                  placeholder="Beskriv prosessen"
                />
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#374151' }}>
                  Ansvarlig person
                </label>
                <input
                  type="text"
                  value={newProcess.responsiblePerson}
                  onChange={(e) => setNewProcess({...newProcess, responsiblePerson: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                  placeholder="Navn på ansvarlig person"
                />
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#374151' }}>
                  Avdeling
                </label>
                <input
                  type="text"
                  value={newProcess.department}
                  onChange={(e) => setNewProcess({...newProcess, department: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                  placeholder="Avdeling"
                />
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
              <button
                onClick={handleCreateProcess}
                style={{
                  background: '#2563eb',
                  color: 'white',
                  border: 'none',
                  padding: '0.75rem 1.5rem',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  flex: '1'
                }}
              >
                Opprett Prosess
              </button>
              <button
                onClick={() => setShowProcessModal(false)}
                style={{
                  background: '#6b7280',
                  color: 'white',
                  border: 'none',
                  padding: '0.75rem 1.5rem',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  flex: '1'
                }}
              >
                Avbryt
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Audit Modal */}
      {showAuditModal && (
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
            background: '#ffffff',
            borderRadius: '12px',
            padding: '2rem',
            width: '90%',
            maxWidth: '600px',
            maxHeight: '90vh',
            overflow: 'auto'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: '600', color: '#111827' }}>Ny Internrevisjon</h2>
              <button
                onClick={() => setShowAuditModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '0.5rem'
                }}
              >
                <X style={{ width: '24px', height: '24px', color: '#6b7280' }} />
              </button>
            </div>
            
            <div style={{ display: 'grid', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#374151' }}>
                  Tittel
                </label>
                <input
                  type="text"
                  value={newAudit.title}
                  onChange={(e) => setNewAudit({...newAudit, title: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                  placeholder="Skriv tittel på internrevisjonen"
                />
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#374151' }}>
                  Type
                </label>
                <select
                  value={newAudit.type}
                  onChange={(e) => setNewAudit({...newAudit, type: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                >
                  <option value="Intern">Intern</option>
                  <option value="Ekstern">Ekstern</option>
                  <option value="Leverandør">Leverandør</option>
                </select>
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#374151' }}>
                  Omfang
                </label>
                <input
                  type="text"
                  value={newAudit.scope}
                  onChange={(e) => setNewAudit({...newAudit, scope: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                  placeholder="Beskriv omfanget"
                />
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#374151' }}>
                  Planlagt dato
                </label>
                <input
                  type="date"
                  value={newAudit.plannedDate}
                  onChange={(e) => setNewAudit({...newAudit, plannedDate: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                />
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#374151' }}>
                  Ansvarlig person
                </label>
                <input
                  type="text"
                  value={newAudit.responsiblePerson}
                  onChange={(e) => setNewAudit({...newAudit, responsiblePerson: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                  placeholder="Navn på ansvarlig person"
                />
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#374151' }}>
                  Avdeling
                </label>
                <input
                  type="text"
                  value={newAudit.department}
                  onChange={(e) => setNewAudit({...newAudit, department: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                  placeholder="Avdeling"
                />
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
              <button
                onClick={handleCreateAudit}
                style={{
                  background: '#2563eb',
                  color: 'white',
                  border: 'none',
                  padding: '0.75rem 1.5rem',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  flex: '1'
                }}
              >
                Opprett Internrevisjon
              </button>
              <button
                onClick={() => setShowAuditModal(false)}
                style={{
                  background: '#6b7280',
                  color: 'white',
                  border: 'none',
                  padding: '0.75rem 1.5rem',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  flex: '1'
                }}
              >
                Avbryt
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quality Modal */}
      {showQualityModal && (
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
            background: '#ffffff',
            borderRadius: '12px',
            padding: '2rem',
            width: '90%',
            maxWidth: '600px',
            maxHeight: '90vh',
            overflow: 'auto'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: '600', color: '#111827' }}>Nytt Kvalitetsmål</h2>
              <button
                onClick={() => setShowQualityModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '0.5rem'
                }}
              >
                <X style={{ width: '24px', height: '24px', color: '#6b7280' }} />
              </button>
            </div>
            
            <div style={{ display: 'grid', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#374151' }}>
                  Tittel
                </label>
                <input
                  type="text"
                  value={newQuality.title}
                  onChange={(e) => setNewQuality({...newQuality, title: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                  placeholder="Skriv tittel på kvalitetsmålet"
                />
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#374151' }}>
                  Kategori
                </label>
                <select
                  value={newQuality.category}
                  onChange={(e) => setNewQuality({...newQuality, category: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                >
                  <option value="KPI">KPI</option>
                  <option value="Mål">Mål</option>
                  <option value="Indikator">Indikator</option>
                </select>
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#374151' }}>
                  Mål
                </label>
                <input
                  type="text"
                  value={newQuality.target}
                  onChange={(e) => setNewQuality({...newQuality, target: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                  placeholder="F.eks. 95%"
                />
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#374151' }}>
                  Beskrivelse
                </label>
                <textarea
                  value={newQuality.description}
                  onChange={(e) => setNewQuality({...newQuality, description: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px',
                    minHeight: '100px',
                    resize: 'vertical'
                  }}
                  placeholder="Beskriv kvalitetsmålet"
                />
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#374151' }}>
                  Ansvarlig person
                </label>
                <input
                  type="text"
                  value={newQuality.responsiblePerson}
                  onChange={(e) => setNewQuality({...newQuality, responsiblePerson: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                  placeholder="Navn på ansvarlig person"
                />
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#374151' }}>
                  Avdeling
                </label>
                <input
                  type="text"
                  value={newQuality.department}
                  onChange={(e) => setNewQuality({...newQuality, department: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                  placeholder="Avdeling"
                />
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
              <button
                onClick={handleCreateQuality}
                style={{
                  background: '#2563eb',
                  color: 'white',
                  border: 'none',
                  padding: '0.75rem 1.5rem',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  flex: '1'
                }}
              >
                Opprett Kvalitetsmål
              </button>
              <button
                onClick={() => setShowQualityModal(false)}
                style={{
                  background: '#6b7280',
                  color: 'white',
                  border: 'none',
                  padding: '0.75rem 1.5rem',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  flex: '1'
                }}
              >
                Avbryt
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Checklist Modal */}
      {showChecklistModal && (
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
            background: '#ffffff',
            borderRadius: '12px',
            padding: '2rem',
            width: '90%',
            maxWidth: '600px',
            maxHeight: '90vh',
            overflow: 'auto'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: '600', color: '#111827' }}>Ny Sjekkliste</h2>
              <button
                onClick={() => setShowChecklistModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '0.5rem'
                }}
              >
                <X style={{ width: '24px', height: '24px', color: '#6b7280' }} />
              </button>
            </div>
            
            <div style={{ display: 'grid', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#374151' }}>
                  Tittel
                </label>
                <input
                  type="text"
                  value={newChecklist.title}
                  onChange={(e) => setNewChecklist({...newChecklist, title: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                  placeholder="Skriv tittel på sjekklisten"
                />
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#374151' }}>
                  Kategori
                </label>
                <select
                  value={newChecklist.category}
                  onChange={(e) => setNewChecklist({...newChecklist, category: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                >
                  <option value="Kontroll">Kontroll</option>
                  <option value="Revisjon">Revisjon</option>
                  <option value="Inspeksjon">Inspeksjon</option>
                </select>
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#374151' }}>
                  Frekvens
                </label>
                <select
                  value={newChecklist.frequency}
                  onChange={(e) => setNewChecklist({...newChecklist, frequency: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                >
                  <option value="Månedlig">Månedlig</option>
                  <option value="Kvartal">Kvartal</option>
                  <option value="Årlig">Årlig</option>
                  <option value="Ved behov">Ved behov</option>
                </select>
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#374151' }}>
                  Beskrivelse
                </label>
                <textarea
                  value={newChecklist.description}
                  onChange={(e) => setNewChecklist({...newChecklist, description: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px',
                    minHeight: '100px',
                    resize: 'vertical'
                  }}
                  placeholder="Beskriv sjekklisten"
                />
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#374151' }}>
                  Ansvarlig person
                </label>
                <input
                  type="text"
                  value={newChecklist.responsiblePerson}
                  onChange={(e) => setNewChecklist({...newChecklist, responsiblePerson: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                  placeholder="Navn på ansvarlig person"
                />
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#374151' }}>
                  Avdeling
                </label>
                <input
                  type="text"
                  value={newChecklist.department}
                  onChange={(e) => setNewChecklist({...newChecklist, department: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                  placeholder="Avdeling"
                />
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
              <button
                onClick={handleCreateChecklist}
                style={{
                  background: '#2563eb',
                  color: 'white',
                  border: 'none',
                  padding: '0.75rem 1.5rem',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  flex: '1'
                }}
              >
                Opprett Sjekkliste
              </button>
              <button
                onClick={() => setShowChecklistModal(false)}
                style={{
                  background: '#6b7280',
                  color: 'white',
                  border: 'none',
                  padding: '0.75rem 1.5rem',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  flex: '1'
                }}
              >
                Avbryt
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Competence Modal */}
      {showCompetenceModal && (
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
            background: '#ffffff',
            borderRadius: '12px',
            padding: '2rem',
            width: '90%',
            maxWidth: '600px',
            maxHeight: '90vh',
            overflow: 'auto'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: '600', color: '#111827' }}>Ny Kompetanseopplæring</h2>
              <button
                onClick={() => setShowCompetenceModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '0.5rem'
                }}
              >
                <X style={{ width: '24px', height: '24px', color: '#6b7280' }} />
              </button>
            </div>
            
            <div style={{ display: 'grid', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#374151' }}>
                  Tittel
                </label>
                <input
                  type="text"
                  value={newCompetence.title}
                  onChange={(e) => setNewCompetence({...newCompetence, title: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                  placeholder="Skriv tittel på opplæringen"
                />
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#374151' }}>
                  Kategori
                </label>
                <select
                  value={newCompetence.category}
                  onChange={(e) => setNewCompetence({...newCompetence, category: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                >
                  <option value="Kurs">Kurs</option>
                  <option value="Opplæring">Opplæring</option>
                  <option value="Sertifisering">Sertifisering</option>
                </select>
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#374151' }}>
                  Varighet
                </label>
                <input
                  type="text"
                  value={newCompetence.duration}
                  onChange={(e) => setNewCompetence({...newCompetence, duration: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                  placeholder="F.eks. 2 dager"
                />
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#374151' }}>
                  Beskrivelse
                </label>
                <textarea
                  value={newCompetence.description}
                  onChange={(e) => setNewCompetence({...newCompetence, description: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px',
                    minHeight: '100px',
                    resize: 'vertical'
                  }}
                  placeholder="Beskriv opplæringen"
                />
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#374151' }}>
                  Ansvarlig person
                </label>
                <input
                  type="text"
                  value={newCompetence.responsiblePerson}
                  onChange={(e) => setNewCompetence({...newCompetence, responsiblePerson: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                  placeholder="Navn på ansvarlig person"
                />
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#374151' }}>
                  Avdeling
                </label>
                <input
                  type="text"
                  value={newCompetence.department}
                  onChange={(e) => setNewCompetence({...newCompetence, department: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                  placeholder="Avdeling"
                />
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
              <button
                onClick={handleCreateCompetence}
                style={{
                  background: '#2563eb',
                  color: 'white',
                  border: 'none',
                  padding: '0.75rem 1.5rem',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  flex: '1'
                }}
              >
                Opprett Kompetanseopplæring
              </button>
              <button
                onClick={() => setShowCompetenceModal(false)}
                style={{
                  background: '#6b7280',
                  color: 'white',
                  border: 'none',
                  padding: '0.75rem 1.5rem',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  flex: '1'
                }}
              >
                Avbryt
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Integration Modal */}
      {showIntegrationModal && (
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
            background: '#ffffff',
            borderRadius: '12px',
            padding: '2rem',
            width: '90%',
            maxWidth: '600px',
            maxHeight: '90vh',
            overflow: 'auto'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: '600', color: '#111827' }}>Ny Integrasjon</h2>
              <button
                onClick={() => setShowIntegrationModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '0.5rem'
                }}
              >
                <X style={{ width: '24px', height: '24px', color: '#6b7280' }} />
              </button>
            </div>
            
            <div style={{ display: 'grid', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#374151' }}>
                  Navn
                </label>
                <input
                  type="text"
                  value={newIntegration.name}
                  onChange={(e) => setNewIntegration({...newIntegration, name: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                  placeholder="Skriv navn på integrasjonen"
                />
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#374151' }}>
                  Type
                </label>
                <select
                  value={newIntegration.type}
                  onChange={(e) => setNewIntegration({...newIntegration, type: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                >
                  <option value="API">API</option>
                  <option value="Plug-in">Plug-in</option>
                  <option value="Webhook">Webhook</option>
                </select>
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#374151' }}>
                  Status
                </label>
                <select
                  value={newIntegration.status}
                  onChange={(e) => setNewIntegration({...newIntegration, status: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                >
                  <option value="Planlagt">Planlagt</option>
                  <option value="Under utvikling">Under utvikling</option>
                  <option value="Aktiv">Aktiv</option>
                </select>
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#374151' }}>
                  Beskrivelse
                </label>
                <textarea
                  value={newIntegration.description}
                  onChange={(e) => setNewIntegration({...newIntegration, description: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px',
                    minHeight: '100px',
                    resize: 'vertical'
                  }}
                  placeholder="Beskriv integrasjonen"
                />
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#374151' }}>
                  Ansvarlig person
                </label>
                <input
                  type="text"
                  value={newIntegration.responsiblePerson}
                  onChange={(e) => setNewIntegration({...newIntegration, responsiblePerson: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                  placeholder="Navn på ansvarlig person"
                />
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#374151' }}>
                  Avdeling
                </label>
                <input
                  type="text"
                  value={newIntegration.department}
                  onChange={(e) => setNewIntegration({...newIntegration, department: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                  placeholder="Avdeling"
                />
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
              <button
                onClick={handleCreateIntegration}
                style={{
                  background: '#2563eb',
                  color: 'white',
                  border: 'none',
                  padding: '0.75rem 1.5rem',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  flex: '1'
                }}
              >
                Opprett Integrasjon
              </button>
              <button
                onClick={() => setShowIntegrationModal(false)}
                style={{
                  background: '#6b7280',
                  color: 'white',
                  border: 'none',
                  padding: '0.75rem 1.5rem',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  flex: '1'
                }}
              >
                Avbryt
              </button>
            </div>
          </div>
        </div>
      )}

          {activeTab === 'processes' && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: '600', color: '#111827' }}>Prosesshåndtering</h2>
                <button
                  onClick={() => setShowProcessModal(true)}
                  style={{ 
                    background: '#2563eb',
                    color: 'white',
                    border: 'none',
                    padding: '0.75rem 1.5rem',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    transition: 'all 0.15s ease',
                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
                  }}
                >
                  <Plus style={{ width: '16px', height: '16px' }} />
                  Ny Prosess
                </button>
              </div>
              
              {/* Statistics */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                <div style={{ background: '#dcfce7', padding: '1.5rem', borderRadius: '8px', border: '1px solid #bbf7d0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <CheckCircle style={{ width: '20px', height: '20px', color: '#059669' }} />
                    <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>Aktive</span>
                  </div>
                  <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#111827' }}>
                    {processes.filter(p => p.status === 'Aktiv').length}
                  </div>
                </div>
                <div style={{ background: '#fef3c7', padding: '1.5rem', borderRadius: '8px', border: '1px solid #fcd34d' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <Activity style={{ width: '20px', height: '20px', color: '#d97706' }} />
                    <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>Under Utvikling</span>
                  </div>
                  <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#111827' }}>
                    {processes.filter(p => p.status === 'Under utvikling').length}
                  </div>
                </div>
                <div style={{ background: '#f3f4f6', padding: '1.5rem', borderRadius: '8px', border: '1px solid #d1d5db' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <TrendingUp style={{ width: '20px', height: '20px', color: '#6b7280' }} />
                    <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>Totalt</span>
                  </div>
                  <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#111827' }}>
                    {processes.length}
                  </div>
                </div>
              </div>

              {/* Processes List */}
              <div style={{ background: '#ffffff', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                <div style={{ padding: '1rem', borderBottom: '1px solid #e5e7eb' }}>
                  <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#111827' }}>Alle Prosesser</h3>
                </div>
                <div>
                  {processes.map((process) => (
                    <div key={process.id} style={{ 
                      padding: '1rem', 
                      borderBottom: '1px solid #f3f4f6',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}>
                      <div style={{ flex: '1' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                          <h4 style={{ fontSize: '1rem', fontWeight: '600', color: '#111827' }}>{process.name}</h4>
                          <span style={{ 
                            padding: '0.25rem 0.5rem', 
                            borderRadius: '4px', 
                            fontSize: '0.75rem', 
                            fontWeight: '500',
                            background: process.status === 'Aktiv' ? '#dcfce7' : '#fef3c7',
                            color: process.status === 'Aktiv' ? '#166534' : '#d97706'
                          }}>
                            {process.status}
                          </span>
                        </div>
                        <div style={{ display: 'flex', gap: '1rem', fontSize: '0.875rem', color: '#6b7280' }}>
                          <span>Kategori: {process.category}</span>
                          <span>PDCA: {process.pdcaPhase}</span>
                          <span>Sist oppdatert: {process.lastUpdated}</span>
                          <span>Ansvarlig: {process.responsiblePerson}</span>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button style={{
                          padding: '0.5rem',
                          border: '1px solid #d1d5db',
                          background: '#ffffff',
                          color: '#374151',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'all 0.15s ease'
                        }}>
                          <Eye style={{ width: '16px', height: '16px' }} />
                        </button>
                        <button style={{
                          padding: '0.5rem',
                          border: '1px solid #d1d5db',
                          background: '#ffffff',
                          color: '#374151',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'all 0.15s ease'
                        }}>
                          <Edit style={{ width: '16px', height: '16px' }} />
                        </button>
                        <button style={{
                          padding: '0.5rem',
                          border: '1px solid #d1d5db',
                          background: '#ffffff',
                          color: '#374151',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'all 0.15s ease'
                        }}>
                          <Download style={{ width: '16px', height: '16px' }} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'audits' && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: '600', color: '#111827' }}>Internrevisjon</h2>
                <button
                  onClick={() => setShowAuditModal(true)}
                  style={{ 
                    background: '#2563eb',
                    color: 'white',
                    border: 'none',
                    padding: '0.75rem 1.5rem',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    transition: 'all 0.15s ease',
                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
                  }}
                >
                  <Plus style={{ width: '16px', height: '16px' }} />
                  Ny Internrevisjon
                </button>
              </div>
              
              {/* Statistics */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                <div style={{ background: '#f0f9ff', padding: '1.5rem', borderRadius: '8px', border: '1px solid #bae6fd' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <CheckCircle style={{ width: '20px', height: '20px', color: '#059669' }} />
                    <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>Planlagt</span>
                  </div>
                  <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#111827' }}>
                    {audits.filter(a => a.status === 'Planlagt').length}
                  </div>
                </div>
                <div style={{ background: '#dcfce7', padding: '1.5rem', borderRadius: '8px', border: '1px solid #bbf7d0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <CheckCircle style={{ width: '20px', height: '20px', color: '#059669' }} />
                    <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>Fullført</span>
                  </div>
                  <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#111827' }}>
                    {audits.filter(a => a.status === 'Fullført').length}
                  </div>
                </div>
                <div style={{ background: '#f3f4f6', padding: '1.5rem', borderRadius: '8px', border: '1px solid #d1d5db' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <CheckCircle style={{ width: '20px', height: '20px', color: '#6b7280' }} />
                    <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>Totalt</span>
                  </div>
                  <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#111827' }}>
                    {audits.length}
                  </div>
                </div>
              </div>

              {/* Audits List */}
              <div style={{ background: '#ffffff', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                <div style={{ padding: '1rem', borderBottom: '1px solid #e5e7eb' }}>
                  <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#111827' }}>Alle Internrevisjoner</h3>
                </div>
                <div>
                  {audits.map((audit) => (
                    <div key={audit.id} style={{ 
                      padding: '1rem', 
                      borderBottom: '1px solid #f3f4f6',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}>
                      <div style={{ flex: '1' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                          <h4 style={{ fontSize: '1rem', fontWeight: '600', color: '#111827' }}>{audit.title}</h4>
                          <span style={{ 
                            padding: '0.25rem 0.5rem', 
                            borderRadius: '4px', 
                            fontSize: '0.75rem', 
                            fontWeight: '500',
                            background: audit.status === 'Fullført' ? '#dcfce7' : '#f0f9ff',
                            color: audit.status === 'Fullført' ? '#166534' : '#059669'
                          }}>
                            {audit.status}
                          </span>
                        </div>
                        <div style={{ display: 'flex', gap: '1rem', fontSize: '0.875rem', color: '#6b7280' }}>
                          <span>Type: {audit.type}</span>
                          <span>Planlagt dato: {audit.plannedDate}</span>
                          <span>Ansvarlig: {audit.responsiblePerson}</span>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button style={{
                          padding: '0.5rem',
                          border: '1px solid #d1d5db',
                          background: '#ffffff',
                          color: '#374151',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'all 0.15s ease'
                        }}>
                          <Eye style={{ width: '16px', height: '16px' }} />
                        </button>
                        <button style={{
                          padding: '0.5rem',
                          border: '1px solid #d1d5db',
                          background: '#ffffff',
                          color: '#374151',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'all 0.15s ease'
                        }}>
                          <Edit style={{ width: '16px', height: '16px' }} />
                        </button>
                        <button style={{
                          padding: '0.5rem',
                          border: '1px solid #d1d5db',
                          background: '#ffffff',
                          color: '#374151',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'all 0.15s ease'
                        }}>
                          <Download style={{ width: '16px', height: '16px' }} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'quality' && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: '600', color: '#111827' }}>Kvalitetsstyring</h2>
                <button
                  onClick={() => setShowQualityModal(true)}
                  style={{ 
                    background: '#2563eb',
                    color: 'white',
                    border: 'none',
                    padding: '0.75rem 1.5rem',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    transition: 'all 0.15s ease',
                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
                  }}
                >
                  <Plus style={{ width: '16px', height: '16px' }} />
                  Nytt Kvalitetsmål
                </button>
              </div>
              
              {/* Statistics */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                <div style={{ background: '#dcfce7', padding: '1.5rem', borderRadius: '8px', border: '1px solid #bbf7d0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <Star style={{ width: '20px', height: '20px', color: '#059669' }} />
                    <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>Aktive</span>
                  </div>
                  <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#111827' }}>
                    {qualityMetrics.filter(q => q.status === 'Oppnådd').length}
                  </div>
                </div>
                <div style={{ background: '#fef3c7', padding: '1.5rem', borderRadius: '8px', border: '1px solid #fcd34d' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <Target style={{ width: '20px', height: '20px', color: '#d97706' }} />
                    <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>Under oppfølging</span>
                  </div>
                  <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#111827' }}>
                    {qualityMetrics.filter(q => q.status === 'Under oppfølging').length}
                  </div>
                </div>
                <div style={{ background: '#f3f4f6', padding: '1.5rem', borderRadius: '8px', border: '1px solid #d1d5db' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <TrendingUp style={{ width: '20px', height: '20px', color: '#6b7280' }} />
                    <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>Totalt</span>
                  </div>
                  <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#111827' }}>
                    {qualityMetrics.length}
                  </div>
                </div>
              </div>

              {/* Quality List */}
              <div style={{ background: '#ffffff', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                <div style={{ padding: '1rem', borderBottom: '1px solid #e5e7eb' }}>
                  <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#111827' }}>Alle Kvalitetsmål</h3>
                </div>
                <div>
                  {qualityMetrics.map((item) => (
                    <div key={item.id} style={{ 
                      padding: '1rem', 
                      borderBottom: '1px solid #f3f4f6',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}>
                      <div style={{ flex: '1' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                          <h4 style={{ fontSize: '1rem', fontWeight: '600', color: '#111827' }}>{item.title}</h4>
                          <span style={{ 
                            padding: '0.25rem 0.5rem', 
                            borderRadius: '4px', 
                            fontSize: '0.75rem', 
                            fontWeight: '500',
                            background: '#dcfce7',
                            color: '#166534'
                          }}>
                            {item.status}
                          </span>
                        </div>
                        <div style={{ display: 'flex', gap: '1rem', fontSize: '0.875rem', color: '#6b7280' }}>
                          <span>Kategori: {item.category}</span>
                          <span>Mål: {item.target}</span>
                          <span>Sist oppdatert: {item.lastUpdated}</span>
                          <span>Ansvarlig: {item.responsiblePerson}</span>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button style={{
                          padding: '0.5rem',
                          border: '1px solid #d1d5db',
                          background: '#ffffff',
                          color: '#374151',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'all 0.15s ease'
                        }}>
                          <Eye style={{ width: '16px', height: '16px' }} />
                        </button>
                        <button style={{
                          padding: '0.5rem',
                          border: '1px solid #d1d5db',
                          background: '#ffffff',
                          color: '#374151',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'all 0.15s ease'
                        }}>
                          <Edit style={{ width: '16px', height: '16px' }} />
                        </button>
                        <button style={{
                          padding: '0.5rem',
                          border: '1px solid #d1d5db',
                          background: '#ffffff',
                          color: '#374151',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'all 0.15s ease'
                        }}>
                          <Download style={{ width: '16px', height: '16px' }} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'checklists' && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: '600', color: '#111827' }}>Sjekklister</h2>
                <button
                  onClick={() => setShowChecklistModal(true)}
                  style={{ 
                    background: '#2563eb',
                    color: 'white',
                    border: 'none',
                    padding: '0.75rem 1.5rem',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    transition: 'all 0.15s ease',
                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
                  }}
                >
                  <Plus style={{ width: '16px', height: '16px' }} />
                  Ny Sjekkliste
                </button>
              </div>
              
              {/* Statistics */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                <div style={{ background: '#dcfce7', padding: '1.5rem', borderRadius: '8px', border: '1px solid #bbf7d0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <CheckCircle style={{ width: '20px', height: '20px', color: '#059669' }} />
                    <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>Aktive</span>
                  </div>
                  <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#111827' }}>
                    {checklists.filter(c => c.status === 'Aktiv').length}
                  </div>
                </div>
                <div style={{ background: '#f0f9ff', padding: '1.5rem', borderRadius: '8px', border: '1px solid #bae6fd' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <Clock style={{ width: '20px', height: '20px', color: '#059669' }} />
                    <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>Planlagt</span>
                  </div>
                  <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#111827' }}>
                    {checklists.filter(c => c.status === 'Planlagt').length}
                  </div>
                </div>
                <div style={{ background: '#f3f4f6', padding: '1.5rem', borderRadius: '8px', border: '1px solid #d1d5db' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <List style={{ width: '20px', height: '20px', color: '#6b7280' }} />
                    <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>Totalt</span>
                  </div>
                  <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#111827' }}>
                    {checklists.length}
                  </div>
                </div>
              </div>

              {/* Checklists List */}
              <div style={{ background: '#ffffff', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                <div style={{ padding: '1rem', borderBottom: '1px solid #e5e7eb' }}>
                  <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#111827' }}>Alle Sjekklister</h3>
                </div>
                <div>
                  {checklists.map((checklist) => (
                    <div key={checklist.id} style={{ 
                      padding: '1rem', 
                      borderBottom: '1px solid #f3f4f6',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}>
                      <div style={{ flex: '1' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                          <h4 style={{ fontSize: '1rem', fontWeight: '600', color: '#111827' }}>{checklist.title}</h4>
                          <span style={{ 
                            padding: '0.25rem 0.5rem', 
                            borderRadius: '4px', 
                            fontSize: '0.75rem', 
                            fontWeight: '500',
                            background: checklist.status === 'Aktiv' ? '#dcfce7' : '#f0f9ff',
                            color: checklist.status === 'Aktiv' ? '#166534' : '#059669'
                          }}>
                            {checklist.status}
                          </span>
                        </div>
                        <div style={{ display: 'flex', gap: '1rem', fontSize: '0.875rem', color: '#6b7280' }}>
                          <span>Kategori: {checklist.category}</span>
                          <span>Frekvens: {checklist.frequency}</span>
                          <span>Sist oppdatert: {checklist.lastUpdated}</span>
                          <span>Ansvarlig: {checklist.responsiblePerson}</span>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button style={{
                          padding: '0.5rem',
                          border: '1px solid #d1d5db',
                          background: '#ffffff',
                          color: '#374151',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'all 0.15s ease'
                        }}>
                          <Eye style={{ width: '16px', height: '16px' }} />
                        </button>
                        <button style={{
                          padding: '0.5rem',
                          border: '1px solid #d1d5db',
                          background: '#ffffff',
                          color: '#374151',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'all 0.15s ease'
                        }}>
                          <Edit style={{ width: '16px', height: '16px' }} />
                        </button>
                        <button style={{
                          padding: '0.5rem',
                          border: '1px solid #d1d5db',
                          background: '#ffffff',
                          color: '#374151',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'all 0.15s ease'
                        }}>
                          <Download style={{ width: '16px', height: '16px' }} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'competence' && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: '600', color: '#111827' }}>Kompetanse</h2>
                <button
                  onClick={() => setShowCompetenceModal(true)}
                  style={{ 
                    background: '#2563eb',
                    color: 'white',
                    border: 'none',
                    padding: '0.75rem 1.5rem',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    transition: 'all 0.15s ease',
                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
                  }}
                >
                  <Plus style={{ width: '16px', height: '16px' }} />
                  Ny Kompetanseopplæring
                </button>
              </div>
              
              {/* Statistics */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                <div style={{ background: '#dcfce7', padding: '1.5rem', borderRadius: '8px', border: '1px solid #bbf7d0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <CheckCircle style={{ width: '20px', height: '20px', color: '#059669' }} />
                    <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>Aktive</span>
                  </div>
                  <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#111827' }}>
                    {competenceTraining.filter(c => c.status === 'Fullført').length}
                  </div>
                </div>
                <div style={{ background: '#f0f9ff', padding: '1.5rem', borderRadius: '8px', border: '1px solid #bae6fd' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <Clock style={{ width: '20px', height: '20px', color: '#059669' }} />
                    <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>Pågående</span>
                  </div>
                  <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#111827' }}>
                    {competenceTraining.filter(c => c.status === 'Pågående').length}
                  </div>
                </div>
                <div style={{ background: '#f3f4f6', padding: '1.5rem', borderRadius: '8px', border: '1px solid #d1d5db' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <Users style={{ width: '20px', height: '20px', color: '#6b7280' }} />
                    <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>Totalt</span>
                  </div>
                  <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#111827' }}>
                    {competenceTraining.length}
                  </div>
                </div>
              </div>

              {/* Competence List */}
              <div style={{ background: '#ffffff', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                <div style={{ padding: '1rem', borderBottom: '1px solid #e5e7eb' }}>
                  <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#111827' }}>Alle Kompetanseopplæringer</h3>
                </div>
                <div>
                  {competenceTraining.map((item) => (
                    <div key={item.id} style={{ 
                      padding: '1rem', 
                      borderBottom: '1px solid #f3f4f6',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}>
                      <div style={{ flex: '1' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                          <h4 style={{ fontSize: '1rem', fontWeight: '600', color: '#111827' }}>{item.title}</h4>
                          <span style={{ 
                            padding: '0.25rem 0.5rem', 
                            borderRadius: '4px', 
                            fontSize: '0.75rem', 
                            fontWeight: '500',
                            background: item.status === 'Aktiv' ? '#dcfce7' : '#f0f9ff',
                            color: item.status === 'Aktiv' ? '#166534' : '#059669'
                          }}>
                            {item.status}
                          </span>
                        </div>
                        <div style={{ display: 'flex', gap: '1rem', fontSize: '0.875rem', color: '#6b7280' }}>
                          <span>Kategori: {item.category}</span>
                          <span>Varighet: {item.duration}</span>
                          <span>Sist oppdatert: {item.lastUpdated}</span>
                          <span>Ansvarlig: {item.responsiblePerson}</span>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button style={{
                          padding: '0.5rem',
                          border: '1px solid #d1d5db',
                          background: '#ffffff',
                          color: '#374151',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'all 0.15s ease'
                        }}>
                          <Eye style={{ width: '16px', height: '16px' }} />
                        </button>
                        <button style={{
                          padding: '0.5rem',
                          border: '1px solid #d1d5db',
                          background: '#ffffff',
                          color: '#374151',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'all 0.15s ease'
                        }}>
                          <Edit style={{ width: '16px', height: '16px' }} />
                        </button>
                        <button style={{
                          padding: '0.5rem',
                          border: '1px solid #d1d5db',
                          background: '#ffffff',
                          color: '#374151',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'all 0.15s ease'
                        }}>
                          <Download style={{ width: '16px', height: '16px' }} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'integrations' && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: '600', color: '#111827' }}>Integrasjoner</h2>
                <button
                  onClick={() => setShowIntegrationModal(true)}
                  style={{ 
                    background: '#2563eb',
                    color: 'white',
                    border: 'none',
                    padding: '0.75rem 1.5rem',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    transition: 'all 0.15s ease',
                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
                  }}
                >
                  <Plus style={{ width: '16px', height: '16px' }} />
                  Ny Integrasjon
                </button>
              </div>
              
              {/* Statistics */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                <div style={{ background: '#dcfce7', padding: '1.5rem', borderRadius: '8px', border: '1px solid #bbf7d0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <CheckCircle style={{ width: '20px', height: '20px', color: '#059669' }} />
                    <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>Aktive</span>
                  </div>
                  <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#111827' }}>
                    {integrations.filter(i => i.status === 'Aktiv').length}
                  </div>
                </div>
                <div style={{ background: '#fef3c7', padding: '1.5rem', borderRadius: '8px', border: '1px solid #fcd34d' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <Clock style={{ width: '20px', height: '20px', color: '#d97706' }} />
                    <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>Under Utvikling</span>
                  </div>
                  <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#111827' }}>
                    {integrations.filter(i => i.status === 'Under utvikling').length}
                  </div>
                </div>
                <div style={{ background: '#f3f4f6', padding: '1.5rem', borderRadius: '8px', border: '1px solid #d1d5db' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <Settings style={{ width: '20px', height: '20px', color: '#6b7280' }} />
                    <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>Totalt</span>
                  </div>
                  <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#111827' }}>
                    {integrations.length}
                  </div>
                </div>
              </div>

              {/* Integrations List */}
              <div style={{ background: '#ffffff', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                <div style={{ padding: '1rem', borderBottom: '1px solid #e5e7eb' }}>
                  <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#111827' }}>Alle Integrasjoner</h3>
                </div>
                <div>
                  {integrations.map((integration) => (
                    <div key={integration.id} style={{ 
                      padding: '1rem', 
                      borderBottom: '1px solid #f3f4f6',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}>
                      <div style={{ flex: '1' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                          <h4 style={{ fontSize: '1rem', fontWeight: '600', color: '#111827' }}>{integration.name}</h4>
                          <span style={{ 
                            padding: '0.25rem 0.5rem', 
                            borderRadius: '4px', 
                            fontSize: '0.75rem', 
                            fontWeight: '500',
                            background: integration.status === 'Aktiv' ? '#dcfce7' : '#fef3c7',
                            color: integration.status === 'Aktiv' ? '#166534' : '#d97706'
                          }}>
                            {integration.status}
                          </span>
                        </div>
                        <div style={{ display: 'flex', gap: '1rem', fontSize: '0.875rem', color: '#6b7280' }}>
                          <span>Type: {integration.type}</span>
                          <span>Sist oppdatert: {integration.lastUpdated}</span>
                          <span>Ansvarlig: {integration.responsiblePerson}</span>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button style={{
                          padding: '0.5rem',
                          border: '1px solid #d1d5db',
                          background: '#ffffff',
                          color: '#374151',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'all 0.15s ease'
                        }}>
                          <Eye style={{ width: '16px', height: '16px' }} />
                        </button>
                        <button style={{
                          padding: '0.5rem',
                          border: '1px solid #d1d5db',
                          background: '#ffffff',
                          color: '#374151',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'all 0.15s ease'
                        }}>
                          <Edit style={{ width: '16px', height: '16px' }} />
                        </button>
                        <button style={{
                          padding: '0.5rem',
                          border: '1px solid #d1d5db',
                          background: '#ffffff',
                          color: '#374151',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'all 0.15s ease'
                        }}>
                          <Download style={{ width: '16px', height: '16px' }} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'audits' && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: '600', color: '#111827' }}>Internrevisjoner</h2>
                <button
                  onClick={() => setShowAuditModal(true)}
                  style={{ 
                    background: '#2563eb',
                    color: 'white',
                    border: 'none',
                    padding: '0.75rem 1.5rem',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    transition: 'all 0.15s ease',
                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
                  }}
                >
                  <Plus style={{ width: '16px', height: '16px' }} />
                  Ny Internrevisjon
                </button>
              </div>
              
              {/* Statistics */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                <div style={{ background: '#dcfce7', padding: '1.5rem', borderRadius: '8px', border: '1px solid #bbf7d0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <CheckCircle style={{ width: '20px', height: '20px', color: '#059669' }} />
                    <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>Fullførte</span>
                  </div>
                  <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#111827' }}>
                    {audits.filter(a => a.status === 'Fullført').length}
                  </div>
                </div>
                <div style={{ background: '#fef3c7', padding: '1.5rem', borderRadius: '8px', border: '1px solid #fcd34d' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <Activity style={{ width: '20px', height: '20px', color: '#d97706' }} />
                    <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>Planlagt</span>
                  </div>
                  <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#111827' }}>
                    {audits.filter(a => a.status === 'Planlagt').length}
                  </div>
                </div>
                <div style={{ background: '#f3f4f6', padding: '1.5rem', borderRadius: '8px', border: '1px solid #d1d5db' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <TrendingUp style={{ width: '20px', height: '20px', color: '#6b7280' }} />
                    <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>Totalt</span>
                  </div>
                  <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#111827' }}>
                    {audits.length}
                  </div>
                </div>
              </div>

              {/* Audits List */}
              <div style={{ background: '#ffffff', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                <div style={{ padding: '1rem', borderBottom: '1px solid #e5e7eb' }}>
                  <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#111827' }}>Alle Internrevisjoner</h3>
                </div>
                <div>
                  {audits.map((audit) => (
                    <div key={audit.id} style={{ 
                      padding: '1rem', 
                      borderBottom: '1px solid #f3f4f6',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}>
                      <div style={{ flex: '1' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                          <h4 style={{ fontSize: '1rem', fontWeight: '600', color: '#111827' }}>{audit.title}</h4>
                          <span style={{ 
                            padding: '0.25rem 0.5rem', 
                            borderRadius: '4px', 
                            fontSize: '0.75rem', 
                            fontWeight: '500',
                            background: audit.status === 'Fullført' ? '#dcfce7' : '#fef3c7',
                            color: audit.status === 'Fullført' ? '#166534' : '#d97706'
                          }}>
                            {audit.status}
                          </span>
                        </div>
                        <div style={{ display: 'flex', gap: '1rem', fontSize: '0.875rem', color: '#6b7280' }}>
                          <span>Type: {audit.type}</span>
                          <span>Omfang: {audit.scope}</span>
                          <span>Planlagt: {audit.plannedDate}</span>
                          <span>Ansvarlig: {audit.responsiblePerson}</span>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button style={{
                          padding: '0.5rem',
                          border: '1px solid #d1d5db',
                          background: '#ffffff',
                          color: '#374151',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'all 0.15s ease'
                        }}>
                          <Eye style={{ width: '16px', height: '16px' }} />
                        </button>
                        <button style={{
                          padding: '0.5rem',
                          border: '1px solid #d1d5db',
                          background: '#ffffff',
                          color: '#374151',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'all 0.15s ease'
                        }}>
                          <Edit style={{ width: '16px', height: '16px' }} />
                        </button>
                        <button style={{
                          padding: '0.5rem',
                          border: '1px solid #d1d5db',
                          background: '#ffffff',
                          color: '#374151',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'all 0.15s ease'
                        }}>
                          <Download style={{ width: '16px', height: '16px' }} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'quality' && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: '600', color: '#111827' }}>Kvalitetsmål</h2>
                <button
                  onClick={() => setShowQualityModal(true)}
                  style={{ 
                    background: '#2563eb',
                    color: 'white',
                    border: 'none',
                    padding: '0.75rem 1.5rem',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    transition: 'all 0.15s ease',
                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
                  }}
                >
                  <Plus style={{ width: '16px', height: '16px' }} />
                  Nytt Kvalitetsmål
                </button>
              </div>
              
              {/* Statistics */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                <div style={{ background: '#dcfce7', padding: '1.5rem', borderRadius: '8px', border: '1px solid #bbf7d0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <CheckCircle style={{ width: '20px', height: '20px', color: '#059669' }} />
                    <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>Oppnådde</span>
                  </div>
                  <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#111827' }}>
                    {qualityMetrics.filter(q => q.status === 'Oppnådd').length}
                  </div>
                </div>
                <div style={{ background: '#fef3c7', padding: '1.5rem', borderRadius: '8px', border: '1px solid #fcd34d' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <Activity style={{ width: '20px', height: '20px', color: '#d97706' }} />
                    <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>Under oppfølging</span>
                  </div>
                  <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#111827' }}>
                    {qualityMetrics.filter(q => q.status === 'Under oppfølging').length}
                  </div>
                </div>
                <div style={{ background: '#f3f4f6', padding: '1.5rem', borderRadius: '8px', border: '1px solid #d1d5db' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <TrendingUp style={{ width: '20px', height: '20px', color: '#6b7280' }} />
                    <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>Totalt</span>
                  </div>
                  <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#111827' }}>
                    {qualityMetrics.length}
                  </div>
                </div>
              </div>

              {/* Quality Metrics List */}
              <div style={{ background: '#ffffff', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                <div style={{ padding: '1rem', borderBottom: '1px solid #e5e7eb' }}>
                  <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#111827' }}>Alle Kvalitetsmål</h3>
                </div>
                <div>
                  {qualityMetrics.map((metric) => (
                    <div key={metric.id} style={{ 
                      padding: '1rem', 
                      borderBottom: '1px solid #f3f4f6',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}>
                      <div style={{ flex: '1' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                          <h4 style={{ fontSize: '1rem', fontWeight: '600', color: '#111827' }}>{metric.title}</h4>
                          <span style={{ 
                            padding: '0.25rem 0.5rem', 
                            borderRadius: '4px', 
                            fontSize: '0.75rem', 
                            fontWeight: '500',
                            background: metric.status === 'Oppnådd' ? '#dcfce7' : '#fef3c7',
                            color: metric.status === 'Oppnådd' ? '#166534' : '#d97706'
                          }}>
                            {metric.status}
                          </span>
                        </div>
                        <div style={{ display: 'flex', gap: '1rem', fontSize: '0.875rem', color: '#6b7280' }}>
                          <span>Kategori: {metric.category}</span>
                          <span>Mål: {metric.target}</span>
                          <span>Sist oppdatert: {metric.lastUpdated}</span>
                          <span>Ansvarlig: {metric.responsiblePerson}</span>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button style={{
                          padding: '0.5rem',
                          border: '1px solid #d1d5db',
                          background: '#ffffff',
                          color: '#374151',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'all 0.15s ease'
                        }}>
                          <Eye style={{ width: '16px', height: '16px' }} />
                        </button>
                        <button style={{
                          padding: '0.5rem',
                          border: '1px solid #d1d5db',
                          background: '#ffffff',
                          color: '#374151',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'all 0.15s ease'
                        }}>
                          <Edit style={{ width: '16px', height: '16px' }} />
                        </button>
                        <button style={{
                          padding: '0.5rem',
                          border: '1px solid #d1d5db',
                          background: '#ffffff',
                          color: '#374151',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'all 0.15s ease'
                        }}>
                          <Download style={{ width: '16px', height: '16px' }} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'checklists' && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: '600', color: '#111827' }}>Sjekklister</h2>
                <button
                  onClick={() => setShowChecklistModal(true)}
                  style={{ 
                    background: '#2563eb',
                    color: 'white',
                    border: 'none',
                    padding: '0.75rem 1.5rem',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    transition: 'all 0.15s ease',
                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
                  }}
                >
                  <Plus style={{ width: '16px', height: '16px' }} />
                  Ny Sjekkliste
                </button>
              </div>
              
              {/* Statistics */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                <div style={{ background: '#dcfce7', padding: '1.5rem', borderRadius: '8px', border: '1px solid #bbf7d0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <CheckCircle style={{ width: '20px', height: '20px', color: '#059669' }} />
                    <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>Aktive</span>
                  </div>
                  <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#111827' }}>
                    {checklists.filter(c => c.status === 'Aktiv').length}
                  </div>
                </div>
                <div style={{ background: '#fef3c7', padding: '1.5rem', borderRadius: '8px', border: '1px solid #fcd34d' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <Activity style={{ width: '20px', height: '20px', color: '#d97706' }} />
                    <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>Under utvikling</span>
                  </div>
                  <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#111827' }}>
                    {checklists.filter(c => c.status === 'Under utvikling').length}
                  </div>
                </div>
                <div style={{ background: '#f3f4f6', padding: '1.5rem', borderRadius: '8px', border: '1px solid #d1d5db' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <TrendingUp style={{ width: '20px', height: '20px', color: '#6b7280' }} />
                    <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>Totalt</span>
                  </div>
                  <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#111827' }}>
                    {checklists.length}
                  </div>
                </div>
              </div>

              {/* Checklists List */}
              <div style={{ background: '#ffffff', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                <div style={{ padding: '1rem', borderBottom: '1px solid #e5e7eb' }}>
                  <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#111827' }}>Alle Sjekklister</h3>
                </div>
                <div>
                  {checklists.map((checklist) => (
                    <div key={checklist.id} style={{ 
                      padding: '1rem', 
                      borderBottom: '1px solid #f3f4f6',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}>
                      <div style={{ flex: '1' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                          <h4 style={{ fontSize: '1rem', fontWeight: '600', color: '#111827' }}>{checklist.title}</h4>
                          <span style={{ 
                            padding: '0.25rem 0.5rem', 
                            borderRadius: '4px', 
                            fontSize: '0.75rem', 
                            fontWeight: '500',
                            background: checklist.status === 'Aktiv' ? '#dcfce7' : '#fef3c7',
                            color: checklist.status === 'Aktiv' ? '#166534' : '#d97706'
                          }}>
                            {checklist.status}
                          </span>
                        </div>
                        <div style={{ display: 'flex', gap: '1rem', fontSize: '0.875rem', color: '#6b7280' }}>
                          <span>Kategori: {checklist.category}</span>
                          <span>Frekvens: {checklist.frequency}</span>
                          <span>Sist oppdatert: {checklist.lastUpdated}</span>
                          <span>Ansvarlig: {checklist.responsiblePerson}</span>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button style={{
                          padding: '0.5rem',
                          border: '1px solid #d1d5db',
                          background: '#ffffff',
                          color: '#374151',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'all 0.15s ease'
                        }}>
                          <Eye style={{ width: '16px', height: '16px' }} />
                        </button>
                        <button style={{
                          padding: '0.5rem',
                          border: '1px solid #d1d5db',
                          background: '#ffffff',
                          color: '#374151',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'all 0.15s ease'
                        }}>
                          <Edit style={{ width: '16px', height: '16px' }} />
                        </button>
                        <button style={{
                          padding: '0.5rem',
                          border: '1px solid #d1d5db',
                          background: '#ffffff',
                          color: '#374151',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'all 0.15s ease'
                        }}>
                          <Download style={{ width: '16px', height: '16px' }} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'competence' && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: '600', color: '#111827' }}>Kompetanseopplæring</h2>
                <button
                  onClick={() => setShowCompetenceModal(true)}
                  style={{ 
                    background: '#2563eb',
                    color: 'white',
                    border: 'none',
                    padding: '0.75rem 1.5rem',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    transition: 'all 0.15s ease',
                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
                  }}
                >
                  <Plus style={{ width: '16px', height: '16px' }} />
                  Ny Kompetanseopplæring
                </button>
              </div>
              
              {/* Statistics */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                <div style={{ background: '#dcfce7', padding: '1.5rem', borderRadius: '8px', border: '1px solid #bbf7d0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <CheckCircle style={{ width: '20px', height: '20px', color: '#059669' }} />
                    <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>Fullførte</span>
                  </div>
                  <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#111827' }}>
                    {competenceTraining.filter(c => c.status === 'Fullført').length}
                  </div>
                </div>
                <div style={{ background: '#fef3c7', padding: '1.5rem', borderRadius: '8px', border: '1px solid #fcd34d' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <Activity style={{ width: '20px', height: '20px', color: '#d97706' }} />
                    <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>Pågående</span>
                  </div>
                  <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#111827' }}>
                    {competenceTraining.filter(c => c.status === 'Pågående').length}
                  </div>
                </div>
                <div style={{ background: '#f3f4f6', padding: '1.5rem', borderRadius: '8px', border: '1px solid #d1d5db' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <TrendingUp style={{ width: '20px', height: '20px', color: '#6b7280' }} />
                    <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>Totalt</span>
                  </div>
                  <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#111827' }}>
                    {competenceTraining.length}
                  </div>
                </div>
              </div>

              {/* Competence Training List */}
              <div style={{ background: '#ffffff', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                <div style={{ padding: '1rem', borderBottom: '1px solid #e5e7eb' }}>
                  <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#111827' }}>Alle Kompetanseopplæringer</h3>
                </div>
                <div>
                  {competenceTraining.map((training) => (
                    <div key={training.id} style={{ 
                      padding: '1rem', 
                      borderBottom: '1px solid #f3f4f6',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}>
                      <div style={{ flex: '1' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                          <h4 style={{ fontSize: '1rem', fontWeight: '600', color: '#111827' }}>{training.title}</h4>
                          <span style={{ 
                            padding: '0.25rem 0.5rem', 
                            borderRadius: '4px', 
                            fontSize: '0.75rem', 
                            fontWeight: '500',
                            background: training.status === 'Fullført' ? '#dcfce7' : '#fef3c7',
                            color: training.status === 'Fullført' ? '#166534' : '#d97706'
                          }}>
                            {training.status}
                          </span>
                        </div>
                        <div style={{ display: 'flex', gap: '1rem', fontSize: '0.875rem', color: '#6b7280' }}>
                          <span>Kategori: {training.category}</span>
                          <span>Varighet: {training.duration}</span>
                          <span>Sist oppdatert: {training.lastUpdated}</span>
                          <span>Ansvarlig: {training.responsiblePerson}</span>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button style={{
                          padding: '0.5rem',
                          border: '1px solid #d1d5db',
                          background: '#ffffff',
                          color: '#374151',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'all 0.15s ease'
                        }}>
                          <Eye style={{ width: '16px', height: '16px' }} />
                        </button>
                        <button style={{
                          padding: '0.5rem',
                          border: '1px solid #d1d5db',
                          background: '#ffffff',
                          color: '#374151',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'all 0.15s ease'
                        }}>
                          <Edit style={{ width: '16px', height: '16px' }} />
                        </button>
                        <button style={{
                          padding: '0.5rem',
                          border: '1px solid #d1d5db',
                          background: '#ffffff',
                          color: '#374151',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'all 0.15s ease'
                        }}>
                          <Download style={{ width: '16px', height: '16px' }} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'integrations' && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: '600', color: '#111827' }}>Integrasjoner</h2>
                <button
                  onClick={() => setShowIntegrationModal(true)}
                  style={{ 
                    background: '#2563eb',
                    color: 'white',
                    border: 'none',
                    padding: '0.75rem 1.5rem',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    transition: 'all 0.15s ease',
                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
                  }}
                >
                  <Plus style={{ width: '16px', height: '16px' }} />
                  Ny Integrasjon
                </button>
              </div>
              
              {/* Statistics */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                <div style={{ background: '#dcfce7', padding: '1.5rem', borderRadius: '8px', border: '1px solid #bbf7d0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <CheckCircle style={{ width: '20px', height: '20px', color: '#059669' }} />
                    <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>Aktive</span>
                  </div>
                  <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#111827' }}>
                    {integrations.filter(i => i.status === 'Aktiv').length}
                  </div>
                </div>
                <div style={{ background: '#fef3c7', padding: '1.5rem', borderRadius: '8px', border: '1px solid #fcd34d' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <Activity style={{ width: '20px', height: '20px', color: '#d97706' }} />
                    <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>Under utvikling</span>
                  </div>
                  <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#111827' }}>
                    {integrations.filter(i => i.status === 'Under utvikling').length}
                  </div>
                </div>
                <div style={{ background: '#f3f4f6', padding: '1.5rem', borderRadius: '8px', border: '1px solid #d1d5db' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <TrendingUp style={{ width: '20px', height: '20px', color: '#6b7280' }} />
                    <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>Totalt</span>
                  </div>
                  <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#111827' }}>
                    {integrations.length}
                  </div>
                </div>
              </div>

              {/* Integrations List */}
              <div style={{ background: '#ffffff', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                <div style={{ padding: '1rem', borderBottom: '1px solid #e5e7eb' }}>
                  <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#111827' }}>Alle Integrasjoner</h3>
                </div>
                <div>
                  {integrations.map((integration) => (
                    <div key={integration.id} style={{ 
                      padding: '1rem', 
                      borderBottom: '1px solid #f3f4f6',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}>
                      <div style={{ flex: '1' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                          <h4 style={{ fontSize: '1rem', fontWeight: '600', color: '#111827' }}>{integration.name}</h4>
                          <span style={{ 
                            padding: '0.25rem 0.5rem', 
                            borderRadius: '4px', 
                            fontSize: '0.75rem', 
                            fontWeight: '500',
                            background: integration.status === 'Aktiv' ? '#dcfce7' : '#fef3c7',
                            color: integration.status === 'Aktiv' ? '#166534' : '#d97706'
                          }}>
                            {integration.status}
                          </span>
                        </div>
                        <div style={{ display: 'flex', gap: '1rem', fontSize: '0.875rem', color: '#6b7280' }}>
                          <span>Type: {integration.type}</span>
                          <span>Sist oppdatert: {integration.lastUpdated}</span>
                          <span>Ansvarlig: {integration.responsiblePerson}</span>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button style={{
                          padding: '0.5rem',
                          border: '1px solid #d1d5db',
                          background: '#ffffff',
                          color: '#374151',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'all 0.15s ease'
                        }}>
                          <Eye style={{ width: '16px', height: '16px' }} />
                        </button>
                        <button style={{
                          padding: '0.5rem',
                          border: '1px solid #d1d5db',
                          background: '#ffffff',
                          color: '#374151',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'all 0.15s ease'
                        }}>
                          <Edit style={{ width: '16px', height: '16px' }} />
                        </button>
                        <button style={{
                          padding: '0.5rem',
                          border: '1px solid #d1d5db',
                          background: '#ffffff',
                          color: '#374151',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'all 0.15s ease'
                        }}>
                          <Download style={{ width: '16px', height: '16px' }} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Success Message */}
      {success && (
        <div style={{
          position: 'fixed',
          top: '2rem',
          right: '2rem',
          background: '#dcfce7',
          color: '#166534',
          padding: '1rem 1.5rem',
          borderRadius: '8px',
          border: '1px solid #bbf7d0',
          zIndex: 1001,
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <CheckCircle style={{ width: '20px', height: '20px' }} />
          {success}
        </div>
      )}
    </div>
  );
} 