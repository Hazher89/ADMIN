'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { firebaseService, DashboardStats, Activity, createUserAccessContext } from '@/lib/firebase-services';
import { 
  Users, 
  Calendar, 
  AlertTriangle, 
  Building, 
  TrendingUp, 
  TrendingDown,
  Clock,
  FileText,
  MessageSquare,
  Bell,
  Plus,
  Eye,
  Menu,
  X
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import RealtimeUpdateListener from '@/components/RealtimeUpdateListener';
import GDPRConsentManager from '@/components/GDPRConsentManager';

export default function DashboardPage() {
  const { userProfile } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats>({
    totalEmployees: 0,
    activeShifts: 0,
    pendingRequests: 0,
    departments: 0,
    totalDeviations: 0,
    openDeviations: 0,
    totalDocuments: 0,
    activeTimeClocks: 0
  });
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Check if mobile on mount and resize
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (!userProfile) {
      setLoading(false);
      return;
    }

    const loadDashboardData = async () => {
      if (!userProfile) return;
      
      try {
        const userContext = createUserAccessContext(userProfile);
        const [dashboardStats, recentActivities] = await Promise.all([
          firebaseService.getDashboardStats(),
          firebaseService.getActivities(userContext || undefined, 5)
        ]);
        // Filter to recent 5 activities
        const filteredActivities = recentActivities.slice(0, 5);
        
        setStats(dashboardStats);
        setActivities(recentActivities);
      } catch (error) {
        console.error('Error loading dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();

    // Set up real-time listeners
    const userContext = createUserAccessContext(userProfile);
    const unsubscribeStats = firebaseService.subscribeToDashboardStats(setStats);
    const unsubscribeActivities = firebaseService.subscribeToActivities(userContext || undefined, setActivities);

    return () => {
      unsubscribeStats();
      unsubscribeActivities();
    };
  }, [userProfile?.companyId]);

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'employee_added':
        return <Users style={{ width: '20px', height: '20px', color: 'var(--text-color)' }} />;
      case 'shift_created':
        return <Clock style={{ width: '20px', height: '20px', color: 'var(--text-color)' }} />;
      case 'deviation_reported':
        return <AlertTriangle style={{ width: '20px', height: '20px', color: 'var(--text-color)' }} />;
      case 'document_uploaded':
        return <FileText style={{ width: '20px', height: '20px', color: 'var(--text-color)' }} />;
      case 'timeclock_event':
        return <Clock style={{ width: '20px', height: '20px', color: 'var(--text-color)' }} />;
      default:
        return <Bell style={{ width: '20px', height: '20px', color: 'var(--text-color)' }} />;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'employee_added':
        return 'var(--success)';
      case 'shift_created':
        return 'var(--primary)';
      case 'deviation_reported':
        return 'var(--warning)';
      case 'document_uploaded':
        return 'var(--primary)';
      case 'timeclock_event':
        return 'var(--primary)';
      default:
        return 'var(--gray-500)';
    }
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const activityTime = new Date(timestamp);
    const diffInMinutes = Math.floor((now.getTime() - activityTime.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Nå';
    if (diffInMinutes < 60) return `${diffInMinutes} minutter siden`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} timer siden`;
    return `${Math.floor(diffInMinutes / 1440)} dager siden`;
  };

  const navigateTo = (path: string) => {
    router.push(path);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4" style={{ color: 'var(--gray-500)' }}>Laster dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <RealtimeUpdateListener autoRefresh={true} />
      <div className="min-h-screen" style={{ background: 'var(--background-color)', width: '100%', overflowX: 'hidden' }}>
      {/* Mobile Header */}
      {isMobile && (
        <div style={{ 
          padding: '0.625rem 0.75rem 0.5rem', 
          marginBottom: '0.5rem',
          borderBottom: '0.5px solid var(--border-color)'
        }}>
          <h1 style={{ 
            fontSize: '1.125rem', 
            fontWeight: '600', 
            color: 'var(--text-color)',
            margin: 0,
            lineHeight: '1.3',
            letterSpacing: '-0.01em'
          }}>
            Velkommen, {userProfile?.displayName?.split(' ')[0] || 'Bruker'}!
          </h1>
        </div>
      )}

      {/* Desktop Header */}
      {!isMobile && (
        <div className="page-header">
          <h1 className="page-title">Velkommen tilbake, {userProfile?.displayName || 'Ny bruker'}!</h1>
          <p className="page-subtitle">
            Her er oversikten over din bedrift for i dag
          </p>
        </div>
      )}

      <div style={{ 
        padding: isMobile ? '0' : '1rem 2rem', 
        maxWidth: isMobile ? '100%' : '1280px', 
        margin: '0 auto',
        width: '100%',
        overflowX: 'hidden'
      }}>
        {/* Stats Grid - Mobile */}
        {isMobile ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem', marginBottom: '0.75rem', padding: '0' }}>
            <div style={{ 
              borderRadius: '0.875rem', 
              padding: '1rem', 
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)', 
              background: 'var(--card-background)', 
              border: '1px solid var(--border-color)',
              transition: 'all 0.2s ease'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ flex: 1 }}>
                  <p style={{ 
                    fontSize: '0.75rem', 
                    fontWeight: '500', 
                    color: 'var(--gray-500)',
                    margin: '0 0 0.375rem 0',
                    letterSpacing: '0.01em'
                  }}>Total Ansatte</p>
                  <p style={{ 
                    fontSize: '1.625rem', 
                    fontWeight: '700', 
                    color: 'var(--text-color)',
                    margin: 0,
                    lineHeight: '1.2'
                  }}>{stats.totalEmployees}</p>
                </div>
                <div style={{ 
                  padding: '0.75rem', 
                  background: 'rgba(59, 130, 246, 0.1)', 
                  borderRadius: '0.625rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <Users size={22} style={{ color: '#3b82f6' }} />
                </div>
              </div>
            </div>

            <div style={{ 
              borderRadius: '0.875rem', 
              padding: '1rem', 
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)', 
              background: 'var(--card-background)', 
              border: '1px solid var(--border-color)',
              transition: 'all 0.2s ease'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ flex: 1 }}>
                  <p style={{ 
                    fontSize: '0.75rem', 
                    fontWeight: '500', 
                    color: 'var(--gray-500)',
                    margin: '0 0 0.375rem 0',
                    letterSpacing: '0.01em'
                  }}>Aktive Skift</p>
                  <p style={{ 
                    fontSize: '1.625rem', 
                    fontWeight: '700', 
                    color: 'var(--text-color)',
                    margin: 0,
                    lineHeight: '1.2'
                  }}>{stats.activeShifts}</p>
                </div>
                <div style={{ 
                  padding: '0.75rem', 
                  background: 'rgba(34, 197, 94, 0.1)', 
                  borderRadius: '0.625rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <Clock size={22} style={{ color: '#22c55e' }} />
                </div>
              </div>
            </div>

            <div style={{ 
              borderRadius: '0.875rem', 
              padding: '1rem', 
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)', 
              background: 'var(--card-background)', 
              border: '1px solid var(--border-color)',
              transition: 'all 0.2s ease'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ flex: 1 }}>
                  <p style={{ 
                    fontSize: '0.75rem', 
                    fontWeight: '500', 
                    color: 'var(--gray-500)',
                    margin: '0 0 0.375rem 0',
                    letterSpacing: '0.01em'
                  }}>Ventende Forespørsler</p>
                  <p style={{ 
                    fontSize: '1.625rem', 
                    fontWeight: '700', 
                    color: 'var(--text-color)',
                    margin: 0,
                    lineHeight: '1.2'
                  }}>{stats.pendingRequests}</p>
                </div>
                <div style={{ 
                  padding: '0.75rem', 
                  background: 'rgba(234, 179, 8, 0.1)', 
                  borderRadius: '0.625rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <AlertTriangle size={22} style={{ color: '#eab308' }} />
                </div>
              </div>
            </div>

            <div style={{ 
              borderRadius: '0.875rem', 
              padding: '1rem', 
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)', 
              background: 'var(--card-background)', 
              border: '1px solid var(--border-color)',
              transition: 'all 0.2s ease'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ flex: 1 }}>
                  <p style={{ 
                    fontSize: '0.75rem', 
                    fontWeight: '500', 
                    color: 'var(--gray-500)',
                    margin: '0 0 0.375rem 0',
                    letterSpacing: '0.01em'
                  }}>Avdelinger</p>
                  <p style={{ 
                    fontSize: '1.625rem', 
                    fontWeight: '700', 
                    color: 'var(--text-color)',
                    margin: 0,
                    lineHeight: '1.2'
                  }}>{stats.departments}</p>
                </div>
                <div style={{ 
                  padding: '0.75rem', 
                  background: 'rgba(168, 85, 247, 0.1)', 
                  borderRadius: '0.625rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <Building size={22} style={{ color: '#a855f7' }} />
                </div>
              </div>
            </div>

            <div style={{ 
              borderRadius: '0.875rem', 
              padding: '1rem', 
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)', 
              background: 'var(--card-background)', 
              border: '1px solid var(--border-color)',
              transition: 'all 0.2s ease'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ flex: 1 }}>
                  <p style={{ 
                    fontSize: '0.75rem', 
                    fontWeight: '500', 
                    color: 'var(--gray-500)',
                    margin: '0 0 0.375rem 0',
                    letterSpacing: '0.01em'
                  }}>Åpne Avvik</p>
                  <p style={{ 
                    fontSize: '1.625rem', 
                    fontWeight: '700', 
                    color: 'var(--text-color)',
                    margin: 0,
                    lineHeight: '1.2'
                  }}>{stats.openDeviations}</p>
                </div>
                <div style={{ 
                  padding: '0.75rem', 
                  background: 'rgba(239, 68, 68, 0.1)', 
                  borderRadius: '0.625rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <AlertTriangle size={22} style={{ color: '#ef4444' }} />
                </div>
              </div>
            </div>

            <div style={{ 
              borderRadius: '0.875rem', 
              padding: '1rem', 
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)', 
              background: 'var(--card-background)', 
              border: '1px solid var(--border-color)',
              transition: 'all 0.2s ease'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ flex: 1 }}>
                  <p style={{ 
                    fontSize: '0.75rem', 
                    fontWeight: '500', 
                    color: 'var(--gray-500)',
                    margin: '0 0 0.375rem 0',
                    letterSpacing: '0.01em'
                  }}>Aktive Stemplinger</p>
                  <p style={{ 
                    fontSize: '1.625rem', 
                    fontWeight: '700', 
                    color: 'var(--text-color)',
                    margin: 0,
                    lineHeight: '1.2'
                  }}>{stats.activeTimeClocks}</p>
                </div>
                <div style={{ 
                  padding: '0.75rem', 
                  background: 'rgba(6, 182, 212, 0.1)', 
                  borderRadius: '0.625rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <Clock size={22} style={{ color: '#06b6d4' }} />
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Stats Grid - Desktop */
          <>
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-number">{stats.totalEmployees}</div>
                <div className="stat-label">Total Ansatte</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
                  <TrendingUp style={{ width: '16px', height: '16px', color: '#10b981' }} />
                  <span style={{ fontSize: '0.875rem', color: '#10b981' }}>Aktive ansatte</span>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-number">{stats.activeShifts}</div>
                <div className="stat-label">Aktive Skiftplan</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
                  <Clock style={{ width: '16px', height: '16px', color: '#3b82f6' }} />
                  <span style={{ fontSize: '0.875rem', color: '#3b82f6' }}>Pågående skift</span>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-number">{stats.pendingRequests}</div>
                <div className="stat-label">Ventende Forespørsler</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
                  <AlertTriangle style={{ width: '16px', height: '16px', color: '#f59e0b' }} />
                  <span style={{ fontSize: '0.875rem', color: '#f59e0b' }}>Krever handling</span>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-number">{stats.departments}</div>
                <div className="stat-label">Avdelinger</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
                  <Building style={{ width: '16px', height: '16px', color: '#667eea' }} />
                  <span style={{ fontSize: '0.875rem', color: '#667eea' }}>avdelinger</span>
                </div>
              </div>
            </div>

            {/* Additional Stats */}
            <div className="stats-grid" style={{ marginTop: '1rem' }}>
              <div className="stat-card">
                <div className="stat-number">{stats.openDeviations}</div>
                <div className="stat-label">Åpne Avvik</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
                  <AlertTriangle style={{ width: '16px', height: '16px', color: '#ef4444' }} />
                  <span style={{ fontSize: '0.875rem', color: '#ef4444' }}>Krever oppfølging</span>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-number">{stats.totalDocuments}</div>
                <div className="stat-label">Dokumenter</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
                  <FileText style={{ width: '16px', height: '16px', color: '#8b5cf6' }} />
                  <span style={{ fontSize: '0.875rem', color: '#8b5cf6' }}>Totalt antall</span>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-number">{stats.activeTimeClocks}</div>
                <div className="stat-label">Aktive Stemplinger</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
                  <Clock style={{ width: '16px', height: '16px', color: '#06b6d4' }} />
                  <span style={{ fontSize: '0.875rem', color: '#06b6d4' }}>Innstemplte</span>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-number">{stats.totalDeviations}</div>
                <div className="stat-label">Totalt Avvik</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
                  <AlertTriangle style={{ width: '16px', height: '16px', color: '#f97316' }} />
                  <span style={{ fontSize: '0.875rem', color: '#f97316' }}>Alle avvik</span>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Quick Actions - Mobile */}
        {isMobile ? (
          <div className="mb-6">
            <h2 className="text-base font-semibold text-gray-900 mb-3">Rask Handling</h2>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => navigateTo('/dashboard/employees')}
                className="bg-white p-3 rounded-lg shadow-sm border border-gray-200 text-left hover:bg-gray-50 transition-colors active:bg-gray-100"
              >
                <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-lg mb-2">
                  <Users className="w-4 h-4 text-blue-600" />
                </div>
                <h3 className="font-medium text-gray-900 text-xs">Ansatte</h3>
                <p className="text-xs text-gray-600 mt-1">Administrer ansatte</p>
              </button>

              <button
                onClick={() => navigateTo('/dashboard/shifts')}
                className="bg-white p-3 rounded-lg shadow-sm border border-gray-200 text-left hover:bg-gray-50 transition-colors active:bg-gray-100"
              >
                <div className="flex items-center justify-center w-8 h-8 bg-green-100 rounded-lg mb-2">
                  <Calendar className="w-4 h-4 text-green-600" />
                </div>
                <h3 className="font-medium text-gray-900 text-xs">Skiftplan</h3>
                <p className="text-xs text-gray-600 mt-1">Planlegg skift</p>
              </button>

              <button
                onClick={() => navigateTo('/dashboard/timeclock')}
                className="bg-white p-3 rounded-lg shadow-sm border border-gray-200 text-left hover:bg-gray-50 transition-colors active:bg-gray-100"
              >
                <div className="flex items-center justify-center w-8 h-8 bg-purple-100 rounded-lg mb-2">
                  <Clock className="w-4 h-4 text-purple-600" />
                </div>
                <h3 className="font-medium text-gray-900 text-xs">Stemple-system</h3>
                <p className="text-xs text-gray-600 mt-1">Inn/utstempling</p>
              </button>

              <button
                onClick={() => navigateTo('/dashboard/documents')}
                className="bg-white p-3 rounded-lg shadow-sm border border-gray-200 text-left hover:bg-gray-50 transition-colors active:bg-gray-100"
              >
                <div className="flex items-center justify-center w-8 h-8 bg-orange-100 rounded-lg mb-2">
                  <FileText className="w-4 h-4 text-orange-600" />
                </div>
                <h3 className="font-medium text-gray-900 text-xs">Dokumenter</h3>
                <p className="text-xs text-gray-600 mt-1">Administrer filer</p>
              </button>
            </div>
          </div>
        ) : (
          /* Quick Actions - Desktop */
          <div style={{ marginTop: '2rem' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '1.5rem', color: '#333' }}>
              Rask Handling
            </h2>
            <div className="grid grid-cols-4">
              <div className="card" style={{ cursor: 'pointer' }} onClick={() => navigateTo('/dashboard/employees')}>
                <div className="card-header">
                  <div className="card-icon">
                    <Users />
                  </div>
                  <h3 className="card-title">Ansatte</h3>
                </div>
                <p className="card-description">Administrer ansatte og deres profiler</p>
                <button className="btn btn-primary">Gå til Ansatte</button>
              </div>

              <div className="card" style={{ cursor: 'pointer' }} onClick={() => navigateTo('/dashboard/shifts')}>
                <div className="card-header">
                  <div className="card-icon">
                    <Calendar />
                  </div>
                  <h3 className="card-title">Skiftplan</h3>
                </div>
                <p className="card-description">Planlegg og administrer skift</p>
                <button className="btn btn-primary">Gå til Skiftplan</button>
              </div>

              <div className="card" style={{ cursor: 'pointer' }} onClick={() => navigateTo('/dashboard/timeclock')}>
                <div className="card-header">
                  <div className="card-icon">
                    <Clock />
                  </div>
                  <h3 className="card-title">Stemple-system</h3>
                </div>
                <p className="card-description">Administrer inn- og utstempling</p>
                <button className="btn btn-primary">Gå til Stemple-system</button>
              </div>

              <div className="card" style={{ cursor: 'pointer' }} onClick={() => navigateTo('/dashboard/documents')}>
                <div className="card-header">
                  <div className="card-icon">
                    <FileText />
                  </div>
                  <h3 className="card-title">Dokumenter</h3>
                </div>
                <p className="card-description">Administrer bedriftsdokumenter</p>
                <button className="btn btn-primary">Gå til Dokumenter</button>
              </div>
            </div>
          </div>
        )}

        {/* Recent Activity - Mobile */}
        {isMobile ? (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-semibold text-gray-900">Siste Aktivitet</h2>
              <button 
                onClick={() => navigateTo('/dashboard/activities')}
                className="text-xs text-blue-600 font-medium"
              >
                Se alle
              </button>
            </div>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              {activities.length === 0 ? (
                <div className="p-4 text-center">
                  <Bell className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-gray-600 font-medium text-sm">Ingen aktivitet ennå</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Aktiviteter vil vises her når de oppstår
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {activities.map((activity) => (
                    <div key={activity.id} className="p-3">
                      <div className="flex items-start space-x-2">
                        <div className="flex-shrink-0">
                          <div 
                            className="w-6 h-6 rounded-full flex items-center justify-center"
                            style={{ backgroundColor: getActivityColor(activity.type) }}
                          >
                            {getActivityIcon(activity.type)}
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-gray-900">{activity.title}</p>
                          <p className="text-xs text-gray-600 mt-1">{activity.description}</p>
                          <p className="text-xs text-gray-500 mt-1">{formatTimeAgo(activity.createdAt)}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Recent Activity - Desktop */
          <div style={{ marginTop: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: '600', color: '#333' }}>
                Siste Aktivitet
              </h2>
              <button 
                className="btn btn-secondary"
                onClick={() => navigateTo('/dashboard/activities')}
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
              >
                <Eye style={{ width: '16px', height: '16px' }} />
                Se alle
              </button>
            </div>
            <div className="card">
              {activities.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
                  <Bell style={{ width: '48px', height: '48px', margin: '0 auto 1rem', opacity: 0.5 }} />
                  <p>Ingen aktivitet ennå</p>
                  <p style={{ fontSize: '0.875rem', marginTop: '0.5rem' }}>
                    Aktiviteter vil vises her når de oppstår
                  </p>
                </div>
              ) : (
                activities.map((activity) => (
                  <div key={activity.id} style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem', padding: '1rem', borderRadius: '8px', backgroundColor: '#f8f9fa' }}>
                    <div style={{ 
                      width: '40px', 
                      height: '40px', 
                      backgroundColor: getActivityColor(activity.type), 
                      borderRadius: '50%', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center' 
                    }}>
                      {getActivityIcon(activity.type)}
                    </div>
                    <div style={{ flex: 1 }}>
                      <h4 style={{ fontWeight: '600', color: '#333', margin: 0 }}>{activity.title}</h4>
                      <p style={{ color: '#666', fontSize: '0.875rem', margin: '0.25rem 0 0 0' }}>
                        {activity.description}
                      </p>
                    </div>
                    <span style={{ fontSize: '0.875rem', color: '#666', whiteSpace: 'nowrap' }}>
                      {formatTimeAgo(activity.createdAt)}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* GDPR Consent (only show for non-admin users) */}
        {userProfile && userProfile.role !== 'super_admin' && userProfile.role !== 'admin' && (
          <div style={{ marginTop: isMobile ? '1rem' : '2rem' }}>
            <div className="card">
              <h2 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '1.5rem', color: '#333' }}>
                Personvern og samtykke
              </h2>
              <GDPRConsentManager readOnly={false} />
            </div>
          </div>
        )}
      </div>
    </div>
    </>
  );
}