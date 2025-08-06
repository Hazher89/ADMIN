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
  X 
} from 'lucide-react';

export default function MyCompanyPage() {
  const { userProfile } = useAuth();
  const [activeTab, setActiveTab] = useState('protocols');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Modal states for all tabs
  const [showProtocolModal, setShowProtocolModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showComplianceModal, setShowComplianceModal] = useState(false);
  const [showJSAModal, setShowJSAModal] = useState(false);
  const [showEquipmentModal, setShowEquipmentModal] = useState(false);
  const [showProcessModal, setShowProcessModal] = useState(false);
  const [showOrgChartModal, setShowOrgChartModal] = useState(false);

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
  const [newJSA, setNewJSA] = useState({
    title: '',
    jobType: '',
    description: '',
    responsiblePerson: '',
    department: ''
  });
  const [newEquipment, setNewEquipment] = useState({
    name: '',
    type: 'Maskin',
    description: '',
    responsiblePerson: '',
    department: ''
  });
  const [newProcess, setNewProcess] = useState({
    name: '',
    category: 'Produksjon',
    description: '',
    responsiblePerson: '',
    department: ''
  });
  const [newOrgChart, setNewOrgChart] = useState({
    name: '',
    type: 'Avdeling',
    description: '',
    manager: '',
    parentDepartment: ''
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
    { id: '1', name: 'Produksjonsprosess A', category: 'Produksjon', status: 'Aktiv', lastUpdated: '2024-01-15', responsiblePerson: 'Produksjonsleder' },
    { id: '2', name: 'Kvalitetskontroll B', category: 'Kvalitet', status: 'Under revisjon', lastUpdated: '2024-01-08', responsiblePerson: 'Kvalitetsleder' }
  ]);
  const [orgChart, setOrgChart] = useState([
    { id: '1', name: 'Produksjonsavdeling', type: 'Avdeling', manager: 'Ola Nordmann', employees: 25, status: 'Aktiv' },
    { id: '2', name: 'Kvalitetsavdeling', type: 'Avdeling', manager: 'Kari Hansen', employees: 8, status: 'Aktiv' }
  ]);

  const tabs = [
    { id: 'protocols', name: 'Protokoller', icon: FileText, color: '#2563eb' },
    { id: 'reviews', name: 'Ledelsesgjennomganger', icon: BarChart3, color: '#059669' },
    { id: 'compliance', name: 'Compliance', icon: Shield, color: '#dc2626' },
    { id: 'sja', name: 'SJA', icon: Target, color: '#7c3aed' },
    { id: 'equipment', name: 'Utstyr & FDV', icon: Wrench, color: '#ea580c' },
    { id: 'processes', name: 'Arbeidsprosesser', icon: Activity, color: '#0891b2' },
    { id: 'orgchart', name: 'Organisasjonskart', icon: Users, color: '#be185d' }
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

  const handleCreateJSA = () => {
    if (newJSA.title && newJSA.jobType) {
      const jsaItem = {
        id: Date.now().toString(),
        title: newJSA.title,
        jobType: newJSA.jobType,
        status: 'Under utvikling',
        lastUpdated: new Date().toISOString().split('T')[0],
        responsiblePerson: newJSA.responsiblePerson || 'Ikke tildelt'
      };
      setJsa([...jsa, jsaItem]);
      setNewJSA({ title: '', jobType: '', description: '', responsiblePerson: '', department: '' });
      setShowJSAModal(false);
      setSuccess('SJA opprettet successfully!');
    }
  };

  const handleCreateEquipment = () => {
    if (newEquipment.name && newEquipment.type) {
      const equipmentItem = {
        id: Date.now().toString(),
        name: newEquipment.name,
        type: newEquipment.type,
        status: 'Operativ',
        lastInspection: new Date().toISOString().split('T')[0],
        responsiblePerson: newEquipment.responsiblePerson || 'Ikke tildelt'
      };
      setEquipment([...equipment, equipmentItem]);
      setNewEquipment({ name: '', type: 'Maskin', description: '', responsiblePerson: '', department: '' });
      setShowEquipmentModal(false);
      setSuccess('Utstyr opprettet successfully!');
    }
  };

  const handleCreateProcess = () => {
    if (newProcess.name && newProcess.category) {
      const process = {
        id: Date.now().toString(),
        name: newProcess.name,
        category: newProcess.category,
        status: 'Aktiv',
        lastUpdated: new Date().toISOString().split('T')[0],
        responsiblePerson: newProcess.responsiblePerson || 'Ikke tildelt'
      };
      setProcesses([...processes, process]);
      setNewProcess({ name: '', category: 'Produksjon', description: '', responsiblePerson: '', department: '' });
      setShowProcessModal(false);
      setSuccess('Prosess opprettet successfully!');
    }
  };

  const handleCreateOrgChart = () => {
    if (newOrgChart.name && newOrgChart.type) {
      const orgChartItem = {
        id: Date.now().toString(),
        name: newOrgChart.name,
        type: newOrgChart.type,
        manager: newOrgChart.manager || 'Ikke tildelt',
        employees: 0,
        status: 'Aktiv'
      };
      setOrgChart([...orgChart, orgChartItem]);
      setNewOrgChart({ name: '', type: 'Avdeling', description: '', manager: '', parentDepartment: '' });
      setShowOrgChartModal(false);
      setSuccess('Organisasjonsenhet opprettet successfully!');
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
          display: 'flex', 
          gap: '0.5rem', 
          marginBottom: '2rem',
          borderBottom: '1px solid #e5e7eb',
          paddingBottom: '1rem'
        }}>
          {tabs.map((tab) => {
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
                  transition: 'all 0.15s ease'
                }}
              >
                <IconComponent style={{ width: '16px', height: '16px' }} />
                {tab.name}
              </button>
            );
          })}
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
              <p style={{ color: '#6b7280' }}>Avansert ledelsesgjennomgang kommer snart...</p>
            </div>
          )}

          {activeTab === 'compliance' && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: '600', color: '#111827' }}>Compliance</h2>
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
                  Ny Compliance
                </button>
              </div>
              <p style={{ color: '#6b7280' }}>Avansert compliance-håndtering kommer snart...</p>
            </div>
          )}

          {activeTab === 'sja' && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: '600', color: '#111827' }}>SJA (Sikker Jobb Analyse)</h2>
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
                  Ny SJA
                </button>
              </div>
              <p style={{ color: '#6b7280' }}>Avansert SJA-håndtering kommer snart...</p>
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