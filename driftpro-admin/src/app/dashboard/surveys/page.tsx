'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { 
  ClipboardList, 
  Plus, 
  Search, 
  Users, 
  Calendar, 
  BarChart3,
  Edit,
  Trash2,
  MoreHorizontal,
  CheckCircle,
  Clock,
  AlertTriangle,
  Eye,
  Share2,
  Download,
  Archive
} from 'lucide-react';

interface Survey {
  id: string;
  title: string;
  description: string;
  status: 'draft' | 'active' | 'completed' | 'archived';
  questions: number;
  responses: number;
  createdBy: string;
  createdAt: string;
  endDate?: string;
  targetAudience: string;
  category: string;
}

export default function SurveysPage() {
  const { userProfile } = useAuth();
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');

  useEffect(() => {
    loadSurveys();
  }, []);

  const loadSurveys = async () => {
    try {
      // Mock data for demonstration
      const mockSurveys: Survey[] = [
        {
          id: '1',
          title: 'Ansattes tilfredshet 2024',
          description: 'Årlig undersøkelse av ansattes tilfredshet og arbeidsmiljø',
          status: 'active',
          questions: 25,
          responses: 89,
          createdBy: 'HR-avdelingen',
          createdAt: '2024-07-01T10:00:00Z',
          endDate: '2024-08-31T23:59:59Z',
          targetAudience: 'Alle ansatte',
          category: 'Tilfredshet'
        },
        {
          id: '2',
          title: 'Sikkerhetskultur',
          description: 'Undersøkelse av sikkerhetskultur og sikkerhetsrutiner',
          status: 'completed',
          questions: 15,
          responses: 156,
          createdBy: 'Sikkerhetsavdelingen',
          createdAt: '2024-06-15T09:00:00Z',
          endDate: '2024-07-15T23:59:59Z',
          targetAudience: 'Produksjonsansatte',
          category: 'Sikkerhet'
        },
        {
          id: '3',
          title: 'Digital transformasjon',
          description: 'Feedback på nye digitale verktøy og systemer',
          status: 'draft',
          questions: 12,
          responses: 0,
          createdBy: 'IT-avdelingen',
          createdAt: '2024-07-25T14:30:00Z',
          targetAudience: 'Alle ansatte',
          category: 'Teknologi'
        },
        {
          id: '4',
          title: 'Ledelse og kommunikasjon',
          description: 'Evaluering av ledelse og intern kommunikasjon',
          status: 'archived',
          questions: 20,
          responses: 234,
          createdBy: 'HR-avdelingen',
          createdAt: '2023-12-01T08:00:00Z',
          endDate: '2024-01-31T23:59:59Z',
          targetAudience: 'Alle ansatte',
          category: 'Ledelse'
        },
        {
          id: '5',
          title: 'Kompetanseutvikling',
          description: 'Behov for opplæring og kompetanseutvikling',
          status: 'active',
          questions: 18,
          responses: 67,
          createdBy: 'HR-avdelingen',
          createdAt: '2024-07-20T11:00:00Z',
          endDate: '2024-09-20T23:59:59Z',
          targetAudience: 'Alle ansatte',
          category: 'Kompetanse'
        }
      ];

      setSurveys(mockSurveys);
    } catch (error) {
      console.error('Error loading surveys:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredSurveys = surveys.filter(survey => {
    const matchesSearch = survey.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         survey.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         survey.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = selectedStatus === 'all' || survey.status === selectedStatus;
    const matchesCategory = selectedCategory === 'all' || survey.category === selectedCategory;
    return matchesSearch && matchesStatus && matchesCategory;
  });

  const statuses = ['all', ...Array.from(new Set(surveys.map(survey => survey.status)))];
  const categories = ['all', ...Array.from(new Set(surveys.map(survey => survey.category)))];

  const getStatusColor = (status: Survey['status']) => {
    switch (status) {
      case 'active': return '#10b981';
      case 'completed': return '#3b82f6';
      case 'draft': return '#f59e0b';
      case 'archived': return '#6b7280';
    }
  };

  const getStatusIcon = (status: Survey['status']) => {
    switch (status) {
      case 'active': return <CheckCircle style={{ width: '16px', height: '16px', color: '#10b981' }} />;
      case 'completed': return <BarChart3 style={{ width: '16px', height: '16px', color: '#3b82f6' }} />;
      case 'draft': return <Clock style={{ width: '16px', height: '16px', color: '#f59e0b' }} />;
      case 'archived': return <Archive style={{ width: '16px', height: '16px', color: '#6b7280' }} />;
    }
  };

  const getResponseRate = (responses: number, targetAudience: string) => {
    // Mock calculation based on target audience
    const targetCount = targetAudience === 'Alle ansatte' ? 200 : 100;
    return Math.round((responses / targetCount) * 100);
  };

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
          <div className="card-icon">
            <ClipboardList />
          </div>
          <div>
            <h1 className="page-title">📊 Undersøkelser</h1>
            <p className="page-subtitle">
              Opprett og administrer undersøkelser og spørreskjemaer
            </p>
          </div>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <span className="badge badge-primary">
            {surveys.length} undersøkelser
          </span>
          <button className="btn btn-primary">
            <Plus style={{ width: '16px', height: '16px' }} />
            Opprett undersøkelse
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <div className="search-container" style={{ flex: '1', minWidth: '300px' }}>
            <Search className="search-icon" />
            <input
              type="text"
              placeholder="Søk i undersøkelser..."
              className="search-input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <select
            className="form-input"
            style={{ width: '150px' }}
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
          >
            {statuses.map(status => (
              <option key={status} value={status}>
                {status === 'all' ? 'Alle statuser' : 
                 status === 'active' ? 'Aktive' :
                 status === 'completed' ? 'Fullført' :
                 status === 'draft' ? 'Kladd' : 'Arkivert'}
              </option>
            ))}
          </select>

          <select
            className="form-input"
            style={{ width: '150px' }}
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            {categories.map(category => (
              <option key={category} value={category}>
                {category === 'all' ? 'Alle kategorier' : category}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Surveys Grid */}
      <div className="grid grid-cols-3">
        {filteredSurveys.map((survey) => (
          <div key={survey.id} className="card">
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', marginBottom: '1rem' }}>
              <div className="card-icon">
                <ClipboardList />
              </div>
              <div style={{ flex: '1' }}>
                <h3 style={{ 
                  fontWeight: '600', 
                  color: '#333',
                  fontSize: '1.1rem',
                  marginBottom: '0.25rem'
                }}>
                  {survey.title}
                </h3>
                <p style={{ color: '#666', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                  {survey.description}
                </p>
              </div>
              <button className="btn btn-secondary" style={{ padding: '0.5rem' }}>
                <MoreHorizontal style={{ width: '16px', height: '16px' }} />
              </button>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <Users style={{ width: '14px', height: '14px', color: '#666' }} />
                <span style={{ fontSize: '0.875rem', color: '#666' }}>{survey.targetAudience}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <Calendar style={{ width: '14px', height: '14px', color: '#666' }} />
                <span style={{ fontSize: '0.875rem', color: '#666' }}>
                  Opprettet: {new Date(survey.createdAt).toLocaleDateString('no-NO')}
                </span>
              </div>
              {survey.endDate && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <Clock style={{ width: '14px', height: '14px', color: '#666' }} />
                  <span style={{ fontSize: '0.875rem', color: '#666' }}>
                    Slutter: {new Date(survey.endDate).toLocaleDateString('no-NO')}
                  </span>
                </div>
              )}
            </div>

                          <div style={{ marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.875rem', color: '#666' }}>
                    {survey.questions} spørsmål
                  </span>
                  <span style={{ fontSize: '0.875rem', color: '#666' }}>
                    {survey.responses} svar
                  </span>
                </div>
                
                {(survey.status === 'active' || survey.status === 'completed') && (
                  <>
                    <div style={{ 
                      width: '100%', 
                      height: '8px', 
                      backgroundColor: 'rgba(0,0,0,0.1)', 
                      borderRadius: '4px',
                      overflow: 'hidden'
                    }}>
                      <div style={{ 
                        width: `${getResponseRate(survey.responses, survey.targetAudience)}%`,
                        height: '100%',
                        backgroundColor: getStatusColor(survey.status),
                        borderRadius: '4px'
                      }} />
                    </div>
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      fontSize: '0.75rem', 
                      color: '#666',
                      marginTop: '0.25rem'
                    }}>
                      <span>Responsrate</span>
                      <span>{getResponseRate(survey.responses, survey.targetAudience)}%</span>
                    </div>
                  </>
                )}
              </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                {getStatusIcon(survey.status)}
                <span style={{ 
                  fontSize: '0.75rem', 
                  fontWeight: '600',
                  color: getStatusColor(survey.status)
                }}>
                  {survey.status === 'active' ? 'Aktiv' : 
                   survey.status === 'completed' ? 'Fullført' :
                   survey.status === 'draft' ? 'Kladd' : 'Arkivert'}
                </span>
              </div>
              <span className="badge badge-secondary" style={{ fontSize: '0.625rem' }}>
                {survey.category}
              </span>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button className="btn btn-secondary" style={{ fontSize: '0.75rem', padding: '0.25rem 0.75rem' }}>
                <Eye style={{ width: '14px', height: '14px' }} />
                Se
              </button>
              <button className="btn btn-secondary" style={{ fontSize: '0.75rem', padding: '0.25rem 0.75rem' }}>
                <Share2 style={{ width: '14px', height: '14px' }} />
                Del
              </button>
              <button className="btn btn-secondary" style={{ fontSize: '0.75rem', padding: '0.25rem 0.75rem' }}>
                <Download style={{ width: '14px', height: '14px' }} />
                Eksporter
              </button>
              <button className="btn btn-secondary" style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}>
                <Edit style={{ width: '14px', height: '14px' }} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredSurveys.length === 0 && !loading && (
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <ClipboardList style={{ width: '64px', height: '64px', color: '#ccc', margin: '0 auto 1rem' }} />
          <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#333', marginBottom: '0.5rem' }}>
            Ingen undersøkelser funnet
          </h3>
          <p style={{ color: '#666', marginBottom: '1.5rem' }}>
            {searchTerm || selectedStatus !== 'all' || selectedCategory !== 'all' 
              ? 'Prøv å endre søkekriteriene' 
              : 'Du har ingen undersøkelser ennå'}
          </p>
          <button className="btn btn-primary">
            <Plus style={{ width: '16px', height: '16px' }} />
            Opprett din første undersøkelse
          </button>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <div className="loading" style={{ margin: '0 auto 1rem' }}></div>
          <p style={{ color: '#666' }}>Laster undersøkelser...</p>
        </div>
      )}
    </div>
  );
} 