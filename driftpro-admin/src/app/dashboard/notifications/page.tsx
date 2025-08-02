'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { firebaseService, Activity } from '@/lib/firebase-services';
import { 
  Bell, 
  Search, 
  Filter,
  Eye,
  Trash2,
  AlertTriangle,
  CheckCircle,
  Clock,
  User,
  Calendar,
  FileText,
  Settings,
  Activity as ActivityIcon,
  Archive
} from 'lucide-react';

export default function NotificationsPage() {
  const { userProfile } = useAuth();
  const [notifications, setNotifications] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (userProfile?.companyId) {
      loadData();
    }
  }, [userProfile?.companyId]);

  const loadData = async () => {
    if (!userProfile?.companyId) return;

    try {
      setLoading(true);
      const data = await firebaseService.getActivities(userProfile.companyId, 50);
      setNotifications(data);
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'employee_added': return <User style={{ width: '20px', height: '20px', color: 'var(--blue-600)' }} />;
      case 'shift_created': return <Calendar style={{ width: '20px', height: '20px', color: 'var(--green-600)' }} />;
      case 'deviation_reported': return <AlertTriangle style={{ width: '20px', height: '20px', color: 'var(--red-600)' }} />;
      case 'document_uploaded': return <FileText style={{ width: '20px', height: '20px', color: 'var(--purple-600)' }} />;
      case 'timeclock_event': return <Clock style={{ width: '20px', height: '20px', color: 'var(--orange-600)' }} />;
      case 'ai_tool_executed': return <Settings style={{ width: '20px', height: '20px', color: 'var(--indigo-600)' }} />;
      case 'recommendation_applied': return <CheckCircle style={{ width: '20px', height: '20px', color: 'var(--green-600)' }} />;
      default: return <ActivityIcon style={{ width: '20px', height: '20px', color: 'var(--gray-600)' }} />;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'employee_added': return 'var(--blue-100)';
      case 'shift_created': return 'var(--green-100)';
      case 'deviation_reported': return 'var(--red-100)';
      case 'document_uploaded': return 'var(--purple-100)';
      case 'timeclock_event': return 'var(--orange-100)';
      case 'ai_tool_executed': return 'var(--indigo-100)';
      case 'recommendation_applied': return 'var(--green-100)';
      default: return 'var(--gray-100)';
    }
  };

  const getActivityLabel = (type: string) => {
    switch (type) {
      case 'employee_added': return 'Ansatt lagt til';
      case 'shift_created': return 'Vakt opprettet';
      case 'deviation_reported': return 'Avvik rapportert';
      case 'document_uploaded': return 'Dokument lastet opp';
      case 'timeclock_event': return 'Tidsregistrering';
      case 'ai_tool_executed': return 'AI-verktøy kjørt';
      case 'recommendation_applied': return 'Anbefaling brukt';
      default: return type;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      return 'Nå';
    } else if (diffInHours < 24) {
      return `${diffInHours}t siden`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays}d siden`;
    }
  };

  const filteredNotifications = notifications.filter(notification => {
    const matchesSearch = (notification.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (notification.description || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (notification.userName || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = selectedType === 'all' || notification.type === selectedType;
    return matchesSearch && matchesType;
  });

  const stats = {
    total: notifications.length,
    today: notifications.filter(n => {
      const notifDate = new Date(n.createdAt);
      const today = new Date();
      return notifDate.toDateString() === today.toDateString();
    }).length,
    unread: notifications.filter(n => !n.metadata?.read).length,
    recent: notifications.filter(n => {
      const notifDate = new Date(n.createdAt);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return notifDate > weekAgo;
    }).length
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--gray-50)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ 
            width: '48px', 
            height: '48px', 
            border: '2px solid var(--blue-600)', 
            borderTop: '2px solid transparent', 
            borderRadius: '50%', 
            animation: 'spin 1s linear infinite',
            margin: '0 auto'
          }}></div>
          <p style={{ marginTop: '1rem', color: 'var(--gray-600)' }}>Laster varsler...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--gray-50)' }}>
      {/* Header */}
      <div style={{ background: 'var(--white)', boxShadow: 'var(--shadow-sm)', borderBottom: '1px solid var(--gray-200)', padding: '1.5rem 2rem' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1 style={{ fontSize: 'var(--font-size-2xl)', fontWeight: '700', color: 'var(--gray-900)' }}>Varsler</h1>
            <p style={{ color: 'var(--gray-600)', marginTop: '0.25rem' }}>Oversikt over alle systemvarsler og aktiviteter</p>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '2rem 1rem' }}>
        {/* Stats Overview */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <div style={{ padding: '0.75rem', background: 'var(--blue-100)', borderRadius: 'var(--radius-lg)' }}>
                <Bell style={{ width: '24px', height: '24px', color: 'var(--blue-600)' }} />
              </div>
              <div style={{ marginLeft: '1rem' }}>
                <p style={{ fontSize: 'var(--font-size-sm)', fontWeight: '500', color: 'var(--gray-600)' }}>Totalt</p>
                <p style={{ fontSize: 'var(--font-size-2xl)', fontWeight: '600', color: 'var(--gray-900)' }}>{stats.total}</p>
              </div>
            </div>
          </div>
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <div style={{ padding: '0.75rem', background: 'var(--green-100)', borderRadius: 'var(--radius-lg)' }}>
                <Calendar style={{ width: '24px', height: '24px', color: 'var(--green-600)' }} />
              </div>
              <div style={{ marginLeft: '1rem' }}>
                <p style={{ fontSize: 'var(--font-size-sm)', fontWeight: '500', color: 'var(--gray-600)' }}>I dag</p>
                <p style={{ fontSize: 'var(--font-size-2xl)', fontWeight: '600', color: 'var(--gray-900)' }}>{stats.today}</p>
              </div>
            </div>
          </div>
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <div style={{ padding: '0.75rem', background: 'var(--yellow-100)', borderRadius: 'var(--radius-lg)' }}>
                <AlertTriangle style={{ width: '24px', height: '24px', color: 'var(--yellow-600)' }} />
              </div>
              <div style={{ marginLeft: '1rem' }}>
                <p style={{ fontSize: 'var(--font-size-sm)', fontWeight: '500', color: 'var(--gray-600)' }}>Uleste</p>
                <p style={{ fontSize: 'var(--font-size-2xl)', fontWeight: '600', color: 'var(--gray-900)' }}>{stats.unread}</p>
              </div>
            </div>
          </div>
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <div style={{ padding: '0.75rem', background: 'var(--purple-100)', borderRadius: 'var(--radius-lg)' }}>
                <Archive style={{ width: '24px', height: '24px', color: 'var(--purple-600)' }} />
              </div>
              <div style={{ marginLeft: '1rem' }}>
                <p style={{ fontSize: 'var(--font-size-sm)', fontWeight: '500', color: 'var(--gray-600)' }}>Nylig</p>
                <p style={{ fontSize: 'var(--font-size-2xl)', fontWeight: '600', color: 'var(--gray-900)' }}>{stats.recent}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="card" style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: '1rem' }}>
            <div style={{ flex: '1' }}>
              <div style={{ position: 'relative' }}>
                <Search style={{ 
                  position: 'absolute', 
                  left: '12px', 
                  top: '50%', 
                  transform: 'translateY(-50%)', 
                  color: 'var(--gray-400)', 
                  width: '16px', 
                  height: '16px' 
                }} />
                <input
                  type="text"
                  placeholder="Søk i varsler..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{ 
                    width: '100%', 
                    padding: '0.75rem 0.75rem 0.75rem 2.5rem', 
                    border: '1px solid var(--gray-300)', 
                    borderRadius: 'var(--radius-lg)', 
                    outline: 'none'
                  }}
                />
              </div>
            </div>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              style={{ 
                padding: '0.75rem', 
                border: '1px solid var(--gray-300)', 
                borderRadius: 'var(--radius-lg)', 
                outline: 'none',
                minWidth: isMobile ? '100%' : '150px'
              }}
            >
              <option value="all">Alle typer</option>
              <option value="employee_added">Ansatt lagt til</option>
              <option value="shift_created">Vakt opprettet</option>
              <option value="deviation_reported">Avvik rapportert</option>
              <option value="document_uploaded">Dokument lastet opp</option>
              <option value="timeclock_event">Tidsregistrering</option>
              <option value="ai_tool_executed">AI-verktøy</option>
              <option value="recommendation_applied">Anbefaling</option>
            </select>
          </div>
        </div>

        {/* Notifications List */}
        <div className="card">
          {filteredNotifications.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center' }}>
              <Bell style={{ width: '48px', height: '48px', color: 'var(--gray-400)', margin: '0 auto 1rem' }} />
              <h3 style={{ fontSize: 'var(--font-size-lg)', fontWeight: '600', color: 'var(--gray-900)', marginBottom: '0.5rem' }}>
                Ingen varsler
              </h3>
              <p style={{ color: 'var(--gray-600)' }}>
                Det er ingen varsler som matcher søkekriteriene dine.
              </p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead style={{ background: 'var(--gray-50)' }}>
                  <tr>
                    <th style={{ padding: '1rem', textAlign: 'left', fontSize: 'var(--font-size-xs)', fontWeight: '500', color: 'var(--gray-500)', textTransform: 'uppercase' }}>
                      Type
                    </th>
                    <th style={{ padding: '1rem', textAlign: 'left', fontSize: 'var(--font-size-xs)', fontWeight: '500', color: 'var(--gray-500)', textTransform: 'uppercase' }}>
                      Tittel
                    </th>
                    <th style={{ padding: '1rem', textAlign: 'left', fontSize: 'var(--font-size-xs)', fontWeight: '500', color: 'var(--gray-500)', textTransform: 'uppercase' }}>
                      Beskrivelse
                    </th>
                    <th style={{ padding: '1rem', textAlign: 'left', fontSize: 'var(--font-size-xs)', fontWeight: '500', color: 'var(--gray-500)', textTransform: 'uppercase' }}>
                      Bruker
                    </th>
                    <th style={{ padding: '1rem', textAlign: 'left', fontSize: 'var(--font-size-xs)', fontWeight: '500', color: 'var(--gray-500)', textTransform: 'uppercase' }}>
                      Tidspunkt
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredNotifications.map((notification) => (
                    <tr key={notification.id} style={{ borderBottom: '1px solid var(--gray-100)' }}>
                      <td style={{ padding: '1rem' }}>
                        <div style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: '0.5rem',
                          padding: '0.5rem',
                          borderRadius: 'var(--radius-md)',
                          background: getActivityColor(notification.type),
                          width: 'fit-content'
                        }}>
                          {getActivityIcon(notification.type)}
                          <span style={{ 
                            fontSize: 'var(--font-size-sm)', 
                            fontWeight: '500', 
                            color: 'var(--gray-700)'
                          }}>
                            {getActivityLabel(notification.type)}
                          </span>
                        </div>
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <p style={{ fontWeight: '500', color: 'var(--gray-900)' }}>{notification.title}</p>
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <p style={{ color: 'var(--gray-700)', fontSize: 'var(--font-size-sm)' }}>{notification.description}</p>
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <User style={{ width: '16px', height: '16px', color: 'var(--gray-500)' }} />
                          <span style={{ color: 'var(--gray-700)', fontSize: 'var(--font-size-sm)' }}>
                            {notification.userName}
                          </span>
                        </div>
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <Clock style={{ width: '16px', height: '16px', color: 'var(--gray-500)' }} />
                          <span style={{ color: 'var(--gray-700)', fontSize: 'var(--font-size-sm)' }}>
                            {formatDate(notification.createdAt)}
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}