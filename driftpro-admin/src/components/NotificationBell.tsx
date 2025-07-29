'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  Bell,
  Check,
  X,
  Archive,
  Trash2,
  AlertTriangle,
  Calendar,
  User,
  FileText,
  Clock,
  MessageSquare,
  Building
} from 'lucide-react';
import { collection, query, limit, onSnapshot, where, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Link from 'next/link';

interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'deviation' | 'vacation' | 'absence' | 'shift' | 'document' | 'chat' | 'employee' | 'system';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'unread' | 'read' | 'archived';
  metadata: Record<string, string | number | boolean | undefined>;
  createdAt: string;
  readAt?: string;
  archivedAt?: string;
}

export default function NotificationBell() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);

  const loadNotifications = useCallback(async () => {
    if (!user || !db) return;

    try {
      setLoading(true);
      const notificationsQuery = query(
        collection(db, 'notifications'),
        where('userId', '==', user.uid),
        where('status', '==', 'unread'),
        limit(10)
      );

      const unsubscribe = onSnapshot(notificationsQuery, (snapshot) => {
        const notificationsData = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            userId: data.userId || '',
            title: data.title || '',
            message: data.message || '',
            type: data.type || 'system',
            priority: data.priority || 'medium',
            status: data.status || 'unread',
            metadata: data.metadata || {},
            createdAt: data.createdAt || new Date().toISOString(),
            readAt: data.readAt,
            archivedAt: data.archivedAt
          } as Notification;
        });
        // Sort by createdAt in descending order in memory
        notificationsData.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setNotifications(notificationsData);
        setUnreadCount(notificationsData.length);
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
      await updateDoc(doc(db, 'notifications', notificationId), {
        status: 'read',
        readAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }, []);

  const archiveNotification = useCallback(async (notificationId: string) => {
    if (!db) return;

    try {
      await updateDoc(doc(db, 'notifications', notificationId), {
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
      await deleteDoc(doc(db, 'notifications', notificationId));
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  }, []);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'deviation':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'vacation':
        return <Calendar className="h-4 w-4 text-blue-500" />;
      case 'absence':
        return <User className="h-4 w-4 text-orange-500" />;
      case 'shift':
        return <Clock className="h-4 w-4 text-green-500" />;
      case 'document':
        return <FileText className="h-4 w-4 text-purple-500" />;
      case 'chat':
        return <MessageSquare className="h-4 w-4 text-indigo-500" />;
      case 'employee':
        return <User className="h-4 w-4 text-teal-500" />;
      case 'system':
        return <Building className="h-4 w-4 text-gray-500" />;
      default:
        return <Bell className="h-4 w-4 text-gray-500" />;
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
    const setupNotifications = async () => {
      const unsubscribe = await loadNotifications();
      return unsubscribe;
    };

    let unsubscribe: (() => void) | undefined;
    
    setupNotifications().then(unsub => {
      unsubscribe = unsub;
    });

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [loadNotifications]);

  return (
    <div className="relative">
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
      >
        <Bell className="h-6 w-6" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {showDropdown && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Varsler</h3>
              <button
                onClick={() => setShowDropdown(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            {unreadCount > 0 && (
              <p className="text-sm text-gray-600 mt-1">
                {unreadCount} uleste varsler
              </p>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                <Bell className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                <p>Ingen uleste varsler</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 hover:bg-gray-50 transition-colors ${
                      getPriorityColor(notification.priority)
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      {getNotificationIcon(notification.type)}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="text-sm font-medium text-gray-900 truncate">
                            {notification.title}
                          </h4>
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            notification.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                            notification.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                            notification.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {notification.priority}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                          {notification.message}
                        </p>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500">
                            {new Date(notification.createdAt).toLocaleString('no-NO')}
                          </span>
                          <div className="flex items-center space-x-1">
                            <button
                              onClick={() => markAsRead(notification.id)}
                              className="p-1 text-gray-400 hover:text-green-600"
                              title="Merk som lest"
                            >
                              <Check className="h-3 w-3" />
                            </button>
                            <button
                              onClick={() => archiveNotification(notification.id)}
                              className="p-1 text-gray-400 hover:text-gray-600"
                              title="Arkiver"
                            >
                              <Archive className="h-3 w-3" />
                            </button>
                            <button
                              onClick={() => deleteNotification(notification.id)}
                              className="p-1 text-gray-400 hover:text-red-600"
                              title="Slett"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {notifications.length > 0 && (
            <div className="p-4 border-t border-gray-200">
              <Link
                href="/dashboard/notifications"
                className="block w-full text-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                onClick={() => setShowDropdown(false)}
              >
                Se alle varsler
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Backdrop */}
      {showDropdown && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowDropdown(false)}
        />
      )}
    </div>
  );
}