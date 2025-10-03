'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { 
  FolderOpen, CheckSquare, Users, BarChart, Flag,
  Plus, Search, Filter, Download, Eye, Edit, Trash2,
  CheckCircle, XCircle, AlertTriangle, TrendingUp,
  Calendar, Clock, Target, Zap
} from 'lucide-react';

export default function ProjectsPage() {
  const { user, userProfile } = useAuth();
  const [activeTab, setActiveTab] = useState('projects');
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [resources, setResources] = useState([]);
  const [milestones, setMilestones] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate loading data
    setTimeout(() => {
      setIsLoading(false);
    }, 1000);
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Laster prosjekter...</span>
      </div>
    );
  }

  return (
    <div style={{ background: 'var(--background-color)', minHeight: '100vh', padding: 'var(--space-6)' }}>
      {/* Header */}
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
          <div className="card-icon">
            <FolderOpen />
          </div>
          <div>
            <h1 className="page-title">Prosjektstyring</h1>
            <p className="page-subtitle">Administrer prosjekter, oppgaver og ressurser</p>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 'var(--space-4)', marginBottom: 'var(--space-6)' }}>
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <p style={{ color: 'var(--gray-600)', fontSize: 'var(--font-size-sm)', marginBottom: '0.5rem' }}>Aktive Prosjekter</p>
              <p style={{ fontSize: 'var(--font-size-2xl)', fontWeight: '600', color: 'var(--blue-600)' }}>12</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.5rem' }}>
                <TrendingUp className="w-4 h-4 text-green-600" />
                <span style={{ color: 'var(--green-600)', fontSize: 'var(--font-size-sm)' }}>+2 denne måneden</span>
              </div>
            </div>
            <div className="card-icon" style={{ background: 'var(--blue-100)' }}>
              <FolderOpen className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <p style={{ color: 'var(--gray-600)', fontSize: 'var(--font-size-sm)', marginBottom: '0.5rem' }}>Åpne Oppgaver</p>
              <p style={{ fontSize: 'var(--font-size-2xl)', fontWeight: '600', color: 'var(--orange-600)' }}>89</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.5rem' }}>
                <CheckSquare className="w-4 h-4 text-orange-600" />
                <span style={{ color: 'var(--orange-600)', fontSize: 'var(--font-size-sm)' }}>Høy prioritet: 15</span>
              </div>
            </div>
            <div className="card-icon" style={{ background: 'var(--orange-100)' }}>
              <CheckSquare className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>

        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <p style={{ color: 'var(--gray-600)', fontSize: 'var(--font-size-sm)', marginBottom: '0.5rem' }}>Team Medlemmer</p>
              <p style={{ fontSize: 'var(--font-size-2xl)', fontWeight: '600', color: 'var(--green-600)' }}>47</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.5rem' }}>
                <Users className="w-4 h-4 text-green-600" />
                <span style={{ color: 'var(--green-600)', fontSize: 'var(--font-size-sm)' }}>Aktive: 42</span>
              </div>
            </div>
            <div className="card-icon" style={{ background: 'var(--green-100)' }}>
              <Users className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <p style={{ color: 'var(--gray-600)', fontSize: 'var(--font-size-sm)', marginBottom: '0.5rem' }}>Milepæler</p>
              <p style={{ fontSize: 'var(--font-size-2xl)', fontWeight: '600', color: 'var(--purple-600)' }}>23</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.5rem' }}>
                <Flag className="w-4 h-4 text-purple-600" />
                <span style={{ color: 'var(--purple-600)', fontSize: 'var(--font-size-sm)' }}>Denne måneden: 5</span>
              </div>
            </div>
            <div className="card-icon" style={{ background: 'var(--purple-100)' }}>
              <Flag className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', borderBottom: '1px solid var(--gray-200)' }}>
          {[
            { id: 'projects', name: 'Prosjekter', icon: FolderOpen },
            { id: 'tasks', name: 'Oppgaver', icon: CheckSquare },
            { id: 'resources', name: 'Ressurser', icon: Users },
            { id: 'gantt', name: 'Gantt', icon: BarChart },
            { id: 'milestones', name: 'Milepæler', icon: Flag },
            { id: 'reports', name: 'Rapporter', icon: Download },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`btn ${activeTab === tab.id ? 'btn-primary' : 'btn-secondary'}`}
              style={{ borderRadius: 0, borderBottom: activeTab === tab.id ? '2px solid var(--blue-600)' : '2px solid transparent' }}
            >
              <tab.icon size={16} />
              {tab.name}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div style={{ padding: 'var(--space-6)' }}>
          {activeTab === 'projects' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-6)' }}>
                <h2 style={{ fontSize: 'var(--font-size-xl)', fontWeight: '600', color: 'var(--gray-900)' }}>
                  Prosjekter
                </h2>
                <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
                  <button className="btn btn-secondary">
                    <Search size={16} />
                    Søk
                  </button>
                  <button className="btn btn-secondary">
                    <Filter size={16} />
                    Filter
                  </button>
                  <button className="btn btn-success">
                    <Plus size={16} />
                    Nytt prosjekt
                  </button>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 'var(--space-4)' }}>
                {[
                  { 
                    name: 'DriftPro Web App', 
                    description: 'Utvikling av ny web-applikasjon', 
                    status: 'active', 
                    progress: 75, 
                    startDate: '2024-01-01', 
                    endDate: '2024-06-30',
                    team: 8,
                    budget: '2.5M kr'
                  },
                  { 
                    name: 'Mobile App', 
                    description: 'Native mobilapp for iOS og Android', 
                    status: 'planning', 
                    progress: 25, 
                    startDate: '2024-03-01', 
                    endDate: '2024-12-31',
                    team: 5,
                    budget: '1.8M kr'
                  },
                  { 
                    name: 'API Integration', 
                    description: 'Integrasjon med tredjeparts APIer', 
                    status: 'active', 
                    progress: 60, 
                    startDate: '2024-02-15', 
                    endDate: '2024-05-15',
                    team: 3,
                    budget: '800k kr'
                  },
                  { 
                    name: 'Database Migration', 
                    description: 'Migrering til ny database', 
                    status: 'completed', 
                    progress: 100, 
                    startDate: '2023-11-01', 
                    endDate: '2024-01-31',
                    team: 4,
                    budget: '600k kr'
                  },
                ].map((project, index) => (
                  <div key={index} className="card" style={{ padding: 'var(--space-6)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-4)' }}>
                      <div>
                        <h3 style={{ fontSize: 'var(--font-size-lg)', fontWeight: '600', color: 'var(--gray-900)', marginBottom: '0.5rem' }}>
                          {project.name}
                        </h3>
                        <p style={{ color: 'var(--gray-600)', fontSize: 'var(--font-size-sm)', marginBottom: 'var(--space-3)' }}>
                          {project.description}
                        </p>
                      </div>
                      <span style={{
                        padding: '0.25rem 0.75rem',
                        borderRadius: 'var(--border-radius)',
                        fontSize: 'var(--font-size-sm)',
                        fontWeight: '500',
                        background: project.status === 'active' ? 'var(--green-100)' : project.status === 'planning' ? 'var(--blue-100)' : 'var(--gray-100)',
                        color: project.status === 'active' ? 'var(--green-700)' : project.status === 'planning' ? 'var(--blue-700)' : 'var(--gray-700)'
                      }}>
                        {project.status === 'active' ? 'Aktiv' : project.status === 'planning' ? 'Planlegging' : 'Fullført'}
                      </span>
                    </div>
                    
                    <div style={{ marginBottom: 'var(--space-4)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                        <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--gray-600)' }}>Fremdrift</span>
                        <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: '600', color: 'var(--gray-900)' }}>{project.progress}%</span>
                      </div>
                      <div style={{ width: '100%', height: '8px', background: 'var(--gray-200)', borderRadius: 'var(--border-radius)', overflow: 'hidden' }}>
                        <div style={{ 
                          width: `${project.progress}%`, 
                          height: '100%', 
                          background: project.status === 'completed' ? 'var(--green-500)' : 'var(--blue-500)',
                          transition: 'width 0.3s ease'
                        }}></div>
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)', marginBottom: 'var(--space-4)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                        <Calendar className="w-4 h-4 text-gray-500" />
                        <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--gray-600)' }}>{project.startDate}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                        <Target className="w-4 h-4 text-gray-500" />
                        <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--gray-600)' }}>{project.endDate}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                        <Users className="w-4 h-4 text-gray-500" />
                        <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--gray-600)' }}>{project.team} medlemmer</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                        <Zap className="w-4 h-4 text-gray-500" />
                        <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--gray-600)' }}>{project.budget}</span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                      <button className="btn btn-sm btn-secondary">
                        <Eye size={14} />
                      </button>
                      <button className="btn btn-sm btn-primary">
                        <Edit size={14} />
                      </button>
                      <button className="btn btn-sm btn-danger">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'tasks' && (
            <div>
              <h2 style={{ fontSize: 'var(--font-size-xl)', fontWeight: '600', color: 'var(--gray-900)', marginBottom: 'var(--space-6)' }}>
                Oppgaver
              </h2>
              <div className="card" style={{ padding: 'var(--space-6)' }}>
                <p style={{ color: 'var(--gray-600)' }}>Oppgaver funksjonalitet kommer snart!</p>
              </div>
            </div>
          )}

          {activeTab === 'resources' && (
            <div>
              <h2 style={{ fontSize: 'var(--font-size-xl)', fontWeight: '600', color: 'var(--gray-900)', marginBottom: 'var(--space-6)' }}>
                Ressurser
              </h2>
              <div className="card" style={{ padding: 'var(--space-6)' }}>
                <p style={{ color: 'var(--gray-600)' }}>Ressurser funksjonalitet kommer snart!</p>
              </div>
            </div>
          )}

          {activeTab === 'gantt' && (
            <div>
              <h2 style={{ fontSize: 'var(--font-size-xl)', fontWeight: '600', color: 'var(--gray-900)', marginBottom: 'var(--space-6)' }}>
                Gantt Diagram
              </h2>
              <div className="card" style={{ padding: 'var(--space-6)' }}>
                <p style={{ color: 'var(--gray-600)' }}>Gantt diagram funksjonalitet kommer snart!</p>
              </div>
            </div>
          )}

          {activeTab === 'milestones' && (
            <div>
              <h2 style={{ fontSize: 'var(--font-size-xl)', fontWeight: '600', color: 'var(--gray-900)', marginBottom: 'var(--space-6)' }}>
                Milepæler
              </h2>
              <div className="card" style={{ padding: 'var(--space-6)' }}>
                <p style={{ color: 'var(--gray-600)' }}>Milepæler funksjonalitet kommer snart!</p>
              </div>
            </div>
          )}

          {activeTab === 'reports' && (
            <div>
              <h2 style={{ fontSize: 'var(--font-size-xl)', fontWeight: '600', color: 'var(--gray-900)', marginBottom: 'var(--space-6)' }}>
                Rapporter
              </h2>
              <div className="card" style={{ padding: 'var(--space-6)' }}>
                <p style={{ color: 'var(--gray-600)' }}>Rapport funksjonalitet kommer snart!</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}



