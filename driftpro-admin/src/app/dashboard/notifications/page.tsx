'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Bell, 
  AlertTriangle, 
  CheckCircle, 
  Info, 
  X,
  Filter,
  Search,
  Clock,
  User
} from 'lucide-react';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error';
  timestamp: string;
  read: boolean;
  sender: string;
  priority: 'low' | 'medium' | 'high';
}

export default function NotificationsPage() {
  const { userProfile } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      // Mock data for demonstration
      const mockNotifications: Notification[] = [
        {
          id: '1',
          title: 'Ny ferieforespørsel',
          message: 'John Doe har sendt inn en ferieforespørsel for 15.-22. august',
          type: 'info',
          timestamp: '2024-07-27T10:30:00Z',
          read: false,
          sender: 'John Doe',
          priority: 'medium'
        },
        {
          id: '2',
          title: 'Avvik rapportert',
          message: 'Sikkerhetsavvik rapportert i produksjonsavdelingen',
          type: 'warning',
          timestamp: '2024-07-27T09:15:00Z',
          read: false,
          sender: 'Sarah Wilson',
          priority: 'high'
        },
        {
          id: '3',
          title: 'Skiftplan oppdatert',
          message: 'Skiftplan for uke 32 er publisert',
          type: 'success',
          timestamp: '2024-07-27T08:45:00Z',
          read: true,
          sender: 'HR-avdelingen',
          priority: 'low'
        },
        {
          id: '4',
          title: 'System vedlikehold',
          message: 'Planlagt systemvedlikehold i morgen kl. 02:00-04:00',
          type: 'info',
          timestamp: '2024-07-27T08:00:00Z',
          read: true,
          sender: 'IT-avdelingen',
          priority: 'medium'
        },
        {
          id: '5',
          title: 'Fraværsmelding',
          message: 'Jane Smith har meldt fravær for i dag',
          type: 'warning',
          timestamp: '2024-07-27T07:30:00Z',
          read: false,
          sender: 'Jane Smith',
          priority: 'medium'
        }
      ];

      setNotifications(mockNotifications);
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredNotifications = notifications.filter(notification => {
    const matchesSearch = notification.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         notification.message.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || notification.type === filterType;
    const matchesPriority = filterPriority === 'all' || notification.priority === filterPriority;
    return matchesSearch && matchesType && matchesPriority;
  });

  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === id ? { ...notif, read: true } : notif
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notif => ({ ...notif, read: true }))
    );
  };

  const deleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(notif => notif.id !== id));
  };

  const getTypeIcon = (type: Notification['type']) => {
    switch (type) {
      case 'info': return <Info style={{ width: '20px', height: '20px', color: '#667eea' }} />;
      case 'warning': return <AlertTriangle style={{ width: '20px', height: '20px', color: '#f59e0b' }} />;
      case 'success': return <CheckCircle style={{ width: '20px', height: '20px', color: '#10b981' }} />;
      case 'error': return <AlertTriangle style={{ width: '20px', height: '20px', color: '#ef4444' }} />;
    }
  };

  const getPriorityColor = (priority: Notification['priority']) => {
    switch (priority) {
      case 'low': return '#10b981';
      case 'medium': return '#f59e0b';
      case 'high': return '#ef4444';
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
          <div className="card-icon">
            <Bell />
          </div>
          <div>
            <h1 className="page-title">🔔 Varsler</h1>
            <p className="page-subtitle">
              Administrer og se alle varsler og meldinger
            </p>
          </div>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <span className="badge badge-primary">
            {unreadCount} uleste
          </span>
          {unreadCount > 0 && (
            <button 
              onClick={markAllAsRead}
              className="btn btn-secondary"
              style={{ fontSize: '0.75rem' }}
            >
              Marker alle som lest
            </button>
          )}
        </div>
      </div>

      {/* Search and Filters */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <div className="search-container" style={{ flex: '1', minWidth: '300px' }}>
            <Search className="search-icon" />
            <input
              type="text"
              placeholder="Søk i varsler..."
              className="search-input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <select
            className="form-input"
            style={{ width: '150px' }}
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
          >
            <option value="all">Alle typer</option>
            <option value="info">Info</option>
            <option value="warning">Advarsel</option>
            <option value="success">Suksess</option>
            <option value="error">Feil</option>
          </select>

          <select
            className="form-input"
            style={{ width: '150px' }}
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
          >
            <option value="all">Alle prioriteter</option>
            <option value="low">Lav</option>
            <option value="medium">Medium</option>
            <option value="high">Høy</option>
          </select>
        </div>
      </div>

      {/* Notifications List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {filteredNotifications.map((notification) => (
          <div 
            key={notification.id} 
            className="card"
            style={{ 
              opacity: notification.read ? 0.7 : 1,
              borderLeft: `4px solid ${getPriorityColor(notification.priority)}`
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
              <div style={{ marginTop: '0.25rem' }}>
                {getTypeIcon(notification.type)}
              </div>
              
              <div style={{ flex: '1' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
                  <h3 style={{ 
                    fontWeight: '600', 
                    color: '#333',
                    fontSize: '1.1rem'
                  }}>
                    {notification.title}
                  </h3>
                  
                  <span 
                    className="badge"
                    style={{ 
                      backgroundColor: getPriorityColor(notification.priority),
                      fontSize: '0.625rem',
                      padding: '0.125rem 0.5rem'
                    }}
                  >
                    {notification.priority}
                  </span>
                  
                  {!notification.read && (
                    <div style={{ 
                      width: '8px', 
                      height: '8px', 
                      backgroundColor: '#667eea', 
                      borderRadius: '50%' 
                    }} />
                  )}
                </div>
                
                <p style={{ color: '#666', marginBottom: '1rem', lineHeight: '1.5' }}>
                  {notification.message}
                </p>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.875rem', color: '#666' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <User style={{ width: '14px', height: '14px' }} />
                    <span>{notification.sender}</span>
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <Clock style={{ width: '14px', height: '14px' }} />
                    <span>{new Date(notification.timestamp).toLocaleString('no-NO')}</span>
                  </div>
                </div>
              </div>
              
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                {!notification.read && (
                  <button 
                    onClick={() => markAsRead(notification.id)}
                    className="btn btn-secondary"
                    style={{ fontSize: '0.75rem', padding: '0.25rem 0.75rem' }}
                  >
                    Marker som lest
                  </button>
                )}
                
                <button 
                  onClick={() => deleteNotification(notification.id)}
                  className="btn btn-secondary"
                  style={{ 
                    fontSize: '0.75rem', 
                    padding: '0.25rem 0.5rem',
                    color: '#ef4444',
                    borderColor: '#ef4444'
                  }}
                >
                  <X style={{ width: '14px', height: '14px' }} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredNotifications.length === 0 && !loading && (
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <Bell style={{ width: '64px', height: '64px', color: '#ccc', margin: '0 auto 1rem' }} />
          <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#333', marginBottom: '0.5rem' }}>
            Ingen varsler funnet
          </h3>
          <p style={{ color: '#666' }}>
            {searchTerm || filterType !== 'all' || filterPriority !== 'all' 
              ? 'Prøv å endre søkekriteriene' 
              : 'Du har ingen varsler for øyeblikket'}
          </p>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <div className="loading" style={{ margin: '0 auto 1rem' }}></div>
          <p style={{ color: '#666' }}>Laster varsler...</p>
        </div>
      )}
    </div>
  );
}