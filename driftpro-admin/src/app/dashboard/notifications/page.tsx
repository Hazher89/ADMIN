'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Bell, 
  Check, 
  X, 
  Archive, 
  Trash2, 
  Search, 
  Settings,
  ExternalLink,
  AlertTriangle,
  Calendar,
  User,
  FileText,
  Users,
  Clock,
  MessageSquare
} from 'lucide-react';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { notificationService } from '@/lib/notification-service';
import { Notification, NotificationSettings } from '@/lib/notification-service';
import { toast } from 'react-hot-toast';

interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'deviation' | 'vacation' | 'absence' | 'shift' | 'document' | 'chat' | 'employee' | 'system';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'unread' | 'read' | 'archived';
  metadata: Record<string, unknown>;
  createdAt: string;
  readAt?: string;
  archivedAt?: string;
}

interface NotificationSettings {
  email: boolean;
  push: boolean;
  inApp: boolean;
  quietHours: {
    enabled: boolean;
    start: string;
    end: string;
  };
  types: {
    deviation: boolean;
    vacation: boolean;
    absence: boolean;
    shift: boolean;
    document: boolean;
    chat: boolean;
    employee: boolean;
    system: boolean;
  };
}

export default function NotificationsPage() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread' | 'read' | 'archived'>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedNotifications, setSelectedNotifications] = useState<string[]>([]);
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState<NotificationSettings>({
    email: true,
    push: true,
    inApp: true,
    quietHours: {
      enabled: false,
      start: '22:00',
      end: '08:00'
    },
    types: {
      deviation: true,
      vacation: true,
      absence: true,
      shift: true,
      document: true,
      chat: true,
      employee: true,
      system: true
    }
  });

  const loadNotifications = useCallback(async () => {
    if (!user || !db) return;

    try {
      setLoading(true);
      const notificationsQuery = query(
        collection(db, 'notifications'),
        where('userId', '==', user.uid),
        orderBy('createdAt', 'desc')
      );

      const unsubscribe = onSnapshot(notificationsQuery, (snapshot) => {
        const notificationsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Notification[];
        setNotifications(notificationsData);
      });

      return unsubscribe;
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const markAsRead = useCallback(async (notificationId: string) => {
    if (!db) return;

    try {
      await notificationService.updateNotification(notificationId, {
        status: 'read',
        readAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    if (!db || !user) return;

    try {
      const batch = notifications
        .filter(n => n.status === 'unread')
        .map(n => notificationService.updateNotification(n.id, {
          status: 'read',
          readAt: new Date().toISOString()
        }));

      await Promise.all(batch);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  }, [notifications, user]);

  const archiveNotification = useCallback(async (notificationId: string) => {
    if (!db) return;

    try {
      await notificationService.updateNotification(notificationId, {
        status: 'archived',
        archivedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error archiving notification:', error);
    }
  }, []);

  const deleteNotification = useCallback(async (notificationId: string) => {
    if (!db) return;

    try {
      await notificationService.deleteNotification(notificationId);
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  }, []);

  const bulkAction = useCallback(async (action: 'read' | 'archive' | 'delete') => {
    if (!db || selectedNotifications.length === 0) return;

    try {
      const batch = selectedNotifications.map(id => {
        if (action === 'delete') {
          return notificationService.deleteNotification(id);
        } else {
          return notificationService.updateNotification(id, {
            status: action === 'read' ? 'read' : 'archived',
            ...(action === 'read' ? { readAt: new Date().toISOString() } : {}),
            ...(action === 'archive' ? { archivedAt: new Date().toISOString() } : {})
          });
        }
      });

      await Promise.all(batch);
      setSelectedNotifications([]);
    } catch (error) {
      console.error('Error performing bulk action:', error);
    }
  }, [selectedNotifications]);

  const filteredNotifications = notifications.filter(notification => {
    const matchesFilter = filter === 'all' || notification.status === filter;
    const matchesType = typeFilter === 'all' || notification.type === typeFilter;
    const matchesPriority = priorityFilter === 'all' || notification.priority === priorityFilter;
    const matchesSearch = searchTerm === '' || 
      notification.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      notification.message.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesFilter && matchesType && matchesPriority && matchesSearch;
  });

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'deviation':
        return <AlertTriangle className="h-5 w-5 text-red-500" />;
      case 'vacation':
        return <Calendar className="h-5 w-5 text-blue-500" />;
      case 'absence':
        return <User className="h-5 w-5 text-orange-500" />;
      case 'shift':
        return <Clock className="h-5 w-5 text-green-500" />;
      case 'document':
        return <FileText className="h-5 w-5 text-purple-500" />;
      case 'chat':
        return <MessageSquare className="h-5 w-5 text-indigo-500" />;
      case 'employee':
        return <Users className="h-5 w-5 text-teal-500" />;
      case 'system':
        return <Settings className="h-5 w-5 text-gray-500" />;
      default:
        return <Bell className="h-5 w-5 text-gray-500" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'border-red-500 bg-red-50';
      case 'high':
        return 'border-orange-500 bg-orange-50';
      case 'medium':
        return 'border-yellow-500 bg-yellow-50';
      case 'low':
        return 'border-green-500 bg-green-50';
      default:
        return 'border-gray-300 bg-gray-50';
    }
  };

  useEffect(() => {
    const unsubscribe = loadNotifications();
    return () => {
      if (unsubscribe) {
        unsubscribe.then(unsub => unsub());
      }
    };
  }, [loadNotifications]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Varsler</h1>
          <p className="text-gray-600 mt-1">
            {notifications.filter(n => n.status === 'unread').length} uleste varsler
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
          >
            <Settings className="h-5 w-5" />
            <span>Innstillinger</span>
          </button>
          <button
            onClick={markAllAsRead}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Check className="h-5 w-5" />
            <span>Merk alle som lest</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as 'all' | 'unread' | 'read' | 'archived')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">Alle</option>
              <option value="unread">Uleste</option>
              <option value="read">Leste</option>
              <option value="archived">Arkivert</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">Alle typer</option>
              <option value="deviation">Avvik</option>
              <option value="vacation">Ferie</option>
              <option value="absence">Fravær</option>
              <option value="shift">Skift</option>
              <option value="document">Dokument</option>
              <option value="chat">Chat</option>
              <option value="employee">Ansatt</option>
              <option value="system">System</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Prioritet</label>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">Alle</option>
              <option value="urgent">Kritisk</option>
              <option value="high">Høy</option>
              <option value="medium">Medium</option>
              <option value="low">Lav</option>
            </select>
          </div>
          <div className="lg:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Søk</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Søk i varsler..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedNotifications.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <span className="text-blue-800">
              {selectedNotifications.length} varsler valgt
            </span>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => bulkAction('read')}
                className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
              >
                Merk som lest
              </button>
              <button
                onClick={() => bulkAction('archive')}
                className="px-3 py-1 bg-gray-600 text-white text-sm rounded hover:bg-gray-700"
              >
                Arkiver
              </button>
              <button
                onClick={() => bulkAction('delete')}
                className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
              >
                Slett
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notifications List */}
      <div className="space-y-4">
        {filteredNotifications.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border-2 border-dashed border-gray-300">
            <Bell className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p className="text-gray-600 mb-2">Ingen varsler funnet</p>
            <p className="text-sm text-gray-500">Prøv å endre filtrene dine</p>
          </div>
        ) : (
          filteredNotifications.map((notification) => (
            <div
              key={notification.id}
              className={`bg-white rounded-lg border-l-4 p-4 shadow-sm hover:shadow-md transition-shadow ${
                getPriorityColor(notification.priority)
              } ${notification.status === 'unread' ? 'ring-2 ring-blue-200' : ''}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3 flex-1">
                  <input
                    type="checkbox"
                    checked={selectedNotifications.includes(notification.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedNotifications(prev => [...prev, notification.id]);
                      } else {
                        setSelectedNotifications(prev => prev.filter(id => id !== notification.id));
                      }
                    }}
                    className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <div className="flex items-start space-x-3 flex-1">
                    {getNotificationIcon(notification.type)}
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <h3 className="font-semibold text-gray-900">{notification.title}</h3>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          notification.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                          notification.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                          notification.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {notification.priority}
                        </span>
                        {notification.status === 'unread' && (
                          <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
                        )}
                      </div>
                      <p className="text-gray-600 mb-2">{notification.message}</p>
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <span>{new Date(notification.createdAt).toLocaleString('no-NO')}</span>
                        {notification.metadata?.link && (
                          <button
                            onClick={() => window.open(notification.metadata.link as string, '_blank')}
                            className="flex items-center space-x-1 text-blue-600 hover:text-blue-800"
                          >
                            <ExternalLink className="h-4 w-4" />
                            <span>Åpne</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {notification.status === 'unread' && (
                    <button
                      onClick={() => markAsRead(notification.id)}
                      className="p-1 text-gray-400 hover:text-green-600"
                      title="Merk som lest"
                    >
                      <Check className="h-4 w-4" />
                    </button>
                  )}
                  <button
                    onClick={() => archiveNotification(notification.id)}
                    className="p-1 text-gray-400 hover:text-gray-600"
                    title="Arkiver"
                  >
                    <Archive className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => deleteNotification(notification.id)}
                    className="p-1 text-gray-400 hover:text-red-600"
                    title="Slett"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Varslingsinnstillinger</h2>
              <button
                onClick={() => setShowSettings(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Notification Channels */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Varslingskanaler</h3>
                <div className="space-y-3">
                  <label className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={settings.email}
                      onChange={(e) => setSettings(prev => ({ ...prev, email: e.target.checked }))}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="text-gray-700">E-post</span>
                  </label>
                  <label className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={settings.push}
                      onChange={(e) => setSettings(prev => ({ ...prev, push: e.target.checked }))}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="text-gray-700">Push-varsler</span>
                  </label>
                  <label className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={settings.inApp}
                      onChange={(e) => setSettings(prev => ({ ...prev, inApp: e.target.checked }))}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="text-gray-700">In-app varsler</span>
                  </label>
                </div>
              </div>

              {/* Quiet Hours */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Stille timer</h3>
                <div className="space-y-3">
                  <label className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={settings.quietHours.enabled}
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        quietHours: { ...prev.quietHours, enabled: e.target.checked }
                      }))}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="text-gray-700">Aktiver stille timer</span>
                  </label>
                  {settings.quietHours.enabled && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Start</label>
                        <input
                          type="time"
                          value={settings.quietHours.start}
                          onChange={(e) => setSettings(prev => ({
                            ...prev,
                            quietHours: { ...prev.quietHours, start: e.target.value }
                          }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Slutt</label>
                        <input
                          type="time"
                          value={settings.quietHours.end}
                          onChange={(e) => setSettings(prev => ({
                            ...prev,
                            quietHours: { ...prev.quietHours, end: e.target.value }
                          }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Notification Types */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Varslingstyper</h3>
                <div className="grid grid-cols-2 gap-4">
                  {Object.entries(settings.types).map(([type, enabled]) => (
                    <label key={type} className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={enabled}
                        onChange={(e) => setSettings(prev => ({
                          ...prev,
                          types: { ...prev.types, [type]: e.target.checked }
                        }))}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <span className="text-gray-700 capitalize">{type}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 mt-6 pt-6 border-t border-gray-200">
              <button
                onClick={() => setShowSettings(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                Avbryt
              </button>
              <button
                onClick={() => {
                  // Save settings logic here
                  setShowSettings(false);
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Lagre innstillinger
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}