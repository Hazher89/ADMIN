'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Bell, 
  Check, 
  X, 
  Archive, 
  Trash2, 
  Filter, 
  Search, 
  Settings, 
  AlertTriangle, 
  Calendar, 
  User, 
  FileText, 
  MessageCircle, 
  Clock, 
  Star,
  Eye,
  EyeOff,
  Mail,
  Smartphone,
  Volume2,
  VolumeX,
  Clock as ClockIcon,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  RefreshCw
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { notificationService, Notification, NotificationSettings } from '@/lib/notification-service';

export default function NotificationsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filteredNotifications, setFilteredNotifications] = useState<Notification[]>([]);
  const [settings, setSettings] = useState<NotificationSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'unread' | 'read' | 'archived'>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [showSettings, setShowSettings] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Load notifications
  useEffect(() => {
    if (!user?.uid) return;

    const unsubscribe = notificationService.loadNotifications(user.uid, (notifications) => {
      setNotifications(notifications);
      setFilteredNotifications(notifications);
      setUnreadCount(notifications.filter(n => n.status === 'unread').length);
      setLoading(false);
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [user]);

  // Load settings
  useEffect(() => {
    if (!user?.uid) return;

    const loadSettings = async () => {
      const userSettings = await notificationService.getNotificationSettings(user.uid);
      setSettings(userSettings);
    };

    loadSettings();
  }, [user]);

  // Filter notifications
  useEffect(() => {
    let filtered = notifications;

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(n => n.status === statusFilter);
    }

    // Type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter(n => n.type === typeFilter);
    }

    // Priority filter
    if (priorityFilter !== 'all') {
      filtered = filtered.filter(n => n.priority === priorityFilter);
    }

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(n => 
        n.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        n.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
        n.senderName?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredNotifications(filtered);
  }, [notifications, statusFilter, typeFilter, priorityFilter, searchTerm]);

  // Handle notification click
  const handleNotificationClick = async (notification: Notification) => {
    // Mark as read
    if (notification.status === 'unread') {
      await notificationService.markAsRead(notification.id);
    }

    // Navigate to related page
    if (notification.actionUrl) {
      router.push(notification.actionUrl);
    }
  };

  // Mark all as read
  const handleMarkAllAsRead = async () => {
    if (!user?.uid) return;
    await notificationService.markAllAsRead(user.uid);
  };

  // Archive notification
  const handleArchive = async (notificationId: string) => {
    await notificationService.archiveNotification(notificationId);
  };

  // Delete notification
  const handleDelete = async (notificationId: string) => {
    await notificationService.deleteNotification(notificationId);
  };

  // Update settings
  const handleSettingsUpdate = async (newSettings: Partial<NotificationSettings>) => {
    if (!user?.uid || !settings) return;

    const updatedSettings = { ...settings, ...newSettings };
    await notificationService.updateNotificationSettings(user.uid, updatedSettings);
    setSettings(updatedSettings);
  };

  // Get notification icon
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
        return <MessageCircle className="h-5 w-5 text-indigo-500" />;
      case 'employee':
        return <User className="h-5 w-5 text-teal-500" />;
      case 'system':
        return <Bell className="h-5 w-5 text-gray-500" />;
      default:
        return <Bell className="h-5 w-5 text-gray-500" />;
    }
  };

  // Get priority color
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Get type label
  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'deviation':
        return 'Avvik';
      case 'vacation':
        return 'Ferie';
      case 'absence':
        return 'Fravær';
      case 'shift':
        return 'Vakt';
      case 'document':
        return 'Dokument';
      case 'chat':
        return 'Chat';
      case 'employee':
        return 'Ansatt';
      case 'system':
        return 'System';
      default:
        return type;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Varsler</h1>
            <p className="text-gray-600">Administrer dine systemvarsler</p>
          </div>
          <div className="flex items-center space-x-3">
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
              >
                <Check className="h-4 w-4" />
                <span>Merk alle som lest</span>
              </button>
            )}
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors flex items-center space-x-2"
            >
              <Settings className="h-4 w-4" />
              <span>Innstillinger</span>
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Filtrer varsler</h2>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
          >
            <Filter className="h-4 w-4" />
            <span>Filtrer</span>
            {showFilters ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
        </div>

        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Søk</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Søk i varsler..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">Alle</option>
                <option value="unread">Uleste</option>
                <option value="read">Leste</option>
                <option value="archived">Arkiverte</option>
              </select>
            </div>

            {/* Type Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">Alle typer</option>
                <option value="deviation">Avvik</option>
                <option value="vacation">Ferie</option>
                <option value="absence">Fravær</option>
                <option value="shift">Vakt</option>
                <option value="document">Dokument</option>
                <option value="chat">Chat</option>
                <option value="employee">Ansatt</option>
                <option value="system">System</option>
              </select>
            </div>

            {/* Priority Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Prioritet</label>
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">Alle</option>
                <option value="urgent">Kritisk</option>
                <option value="high">Høy</option>
                <option value="medium">Medium</option>
                <option value="low">Lav</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Notification Settings */}
      {showSettings && settings && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Varslingsinnstillinger</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Notification Channels */}
            <div>
              <h3 className="text-md font-medium text-gray-900 mb-3">Varslingskanaler</h3>
              <div className="space-y-3">
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={settings.email}
                    onChange={(e) => handleSettingsUpdate({ email: e.target.checked })}
                    className="rounded"
                  />
                  <Mail className="h-4 w-4 text-gray-600" />
                  <span>E-post</span>
                </label>
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={settings.push}
                    onChange={(e) => handleSettingsUpdate({ push: e.target.checked })}
                    className="rounded"
                  />
                  <Smartphone className="h-4 w-4 text-gray-600" />
                  <span>Push-varsler</span>
                </label>
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={settings.inApp}
                    onChange={(e) => handleSettingsUpdate({ inApp: e.target.checked })}
                    className="rounded"
                  />
                  <Bell className="h-4 w-4 text-gray-600" />
                  <span>In-app varsler</span>
                </label>
              </div>
            </div>

            {/* Notification Types */}
            <div>
              <h3 className="text-md font-medium text-gray-900 mb-3">Varslingstyper</h3>
              <div className="space-y-2">
                {Object.entries(settings.types).map(([type, enabled]) => (
                  <label key={type} className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={enabled}
                      onChange={(e) => handleSettingsUpdate({
                        types: { ...settings.types, [type]: e.target.checked }
                      })}
                      className="rounded"
                    />
                    <span className="capitalize">{getTypeLabel(type)}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Quiet Hours */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <h3 className="text-md font-medium text-gray-900 mb-3">Stille timer</h3>
            <div className="flex items-center space-x-4">
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={settings.quietHours.enabled}
                  onChange={(e) => handleSettingsUpdate({
                    quietHours: { ...settings.quietHours, enabled: e.target.checked }
                  })}
                  className="rounded"
                />
                <span>Aktiver stille timer</span>
              </label>
              {settings.quietHours.enabled && (
                <div className="flex items-center space-x-2">
                  <input
                    type="time"
                    value={settings.quietHours.start}
                    onChange={(e) => handleSettingsUpdate({
                      quietHours: { ...settings.quietHours, start: e.target.value }
                    })}
                    className="p-2 border border-gray-300 rounded-lg"
                  />
                  <span>til</span>
                  <input
                    type="time"
                    value={settings.quietHours.end}
                    onChange={(e) => handleSettingsUpdate({
                      quietHours: { ...settings.quietHours, end: e.target.value }
                    })}
                    className="p-2 border border-gray-300 rounded-lg"
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Notifications List */}
      <div className="bg-white rounded-lg shadow-sm">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">
              Varsler ({filteredNotifications.length})
            </h2>
            {unreadCount > 0 && (
              <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                {unreadCount} uleste
              </span>
            )}
          </div>
        </div>

        <div className="divide-y divide-gray-200">
          {filteredNotifications.length > 0 ? (
            filteredNotifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-6 hover:bg-gray-50 transition-colors cursor-pointer ${
                  notification.status === 'unread' ? 'bg-blue-50' : ''
                }`}
                onClick={() => handleNotificationClick(notification)}
              >
                <div className="flex items-start space-x-4">
                  {/* Icon */}
                  <div className="flex-shrink-0">
                    {getNotificationIcon(notification.type)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-medium text-gray-900">
                        {notification.title}
                      </h3>
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getPriorityColor(notification.priority)}`}>
                          {notification.priority}
                        </span>
                        <span className="text-xs text-gray-500">
                          {notification.createdAt?.toDate().toLocaleString('no-NO')}
                        </span>
                      </div>
                    </div>
                    
                    <p className="text-sm text-gray-600 mt-1">
                      {notification.message}
                    </p>
                    
                    {notification.senderName && (
                      <p className="text-xs text-gray-500 mt-1">
                        Fra: {notification.senderName}
                      </p>
                    )}

                    {/* Action Button */}
                    {notification.actionUrl && notification.actionText && (
                      <div className="mt-3">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(notification.actionUrl!);
                          }}
                          className="inline-flex items-center space-x-1 text-blue-600 hover:text-blue-800 text-sm font-medium"
                        >
                          <span>{notification.actionText}</span>
                          <ExternalLink className="h-3 w-3" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center space-x-2">
                    {notification.status === 'unread' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          notificationService.markAsRead(notification.id);
                        }}
                        className="p-1 text-gray-400 hover:text-gray-600"
                        title="Merk som lest"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                    )}
                    
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleArchive(notification.id);
                      }}
                      className="p-1 text-gray-400 hover:text-gray-600"
                      title="Arkiver"
                    >
                      <Archive className="h-4 w-4" />
                    </button>
                    
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(notification.id);
                      }}
                      className="p-1 text-gray-400 hover:text-red-600"
                      title="Slett"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="p-12 text-center">
              <Bell className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Ingen varsler</h3>
              <p className="text-gray-600">
                {searchTerm || statusFilter !== 'all' || typeFilter !== 'all' || priorityFilter !== 'all'
                  ? 'Ingen varsler matcher dine filtre'
                  : 'Du har ingen varsler ennå'
                }
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}