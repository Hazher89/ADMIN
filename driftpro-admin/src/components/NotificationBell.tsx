'use client';

import React, { useState, useEffect } from 'react';
import { Bell, X, Check, Archive, Trash2, ExternalLink } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { notificationService, Notification } from '@/lib/notification-service';

export default function NotificationBell() {
  const { user } = useAuth();
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);

  // Load notifications
  useEffect(() => {
    if (!user?.uid) return;

    const unsubscribe = notificationService.loadNotifications(user.uid, (notifications) => {
      const unread = notifications.filter(n => n.status === 'unread');
      setNotifications(unread.slice(0, 5)); // Show only 5 most recent unread
      setUnreadCount(unread.length);
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [user]);

  // Handle notification click
  const handleNotificationClick = async (notification: Notification) => {
    // Mark as read
    await notificationService.markAsRead(notification.id);
    
    // Navigate to related page
    if (notification.actionUrl) {
      router.push(notification.actionUrl);
    }
    
    setShowDropdown(false);
  };

  // Mark all as read
  const handleMarkAllAsRead = async () => {
    if (!user?.uid) return;
    setLoading(true);
    await notificationService.markAllAsRead(user.uid);
    setLoading(false);
    setShowDropdown(false);
  };

  // Archive notification
  const handleArchive = async (notificationId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await notificationService.archiveNotification(notificationId);
  };

  // Delete notification
  const handleDelete = async (notificationId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await notificationService.deleteNotification(notificationId);
  };

  return (
    <div className="relative">
      {/* Notification Bell */}
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
      >
        <Bell className="h-6 w-6" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {showDropdown && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
          {/* Header */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Varsler</h3>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  disabled={loading}
                  className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                >
                  {loading ? 'Merker...' : 'Merk alle som lest'}
                </button>
              )}
            </div>
          </div>

          {/* Notifications List */}
          <div className="max-h-96 overflow-y-auto">
            {notifications.length > 0 ? (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className="p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <div className="flex items-start space-x-3">
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-gray-900 truncate">
                        {notification.title}
                      </h4>
                      <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                        {notification.message}
                      </p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs text-gray-500">
                          {notification.createdAt?.toDate().toLocaleString('no-NO', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                        <div className="flex items-center space-x-1">
                          <button
                            onClick={(e) => handleArchive(notification.id, e)}
                            className="p-1 text-gray-400 hover:text-gray-600"
                            title="Arkiver"
                          >
                            <Archive className="h-3 w-3" />
                          </button>
                          <button
                            onClick={(e) => handleDelete(notification.id, e)}
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
              ))
            ) : (
              <div className="p-8 text-center">
                <Bell className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                <p className="text-sm text-gray-600">Ingen nye varsler</p>
              </div>
            )}
          </div>

          {/* Footer */}
          {unreadCount > 5 && (
            <div className="p-4 border-t border-gray-200">
              <button
                onClick={() => {
                  setShowDropdown(false);
                  router.push('/dashboard/notifications');
                }}
                className="w-full text-center text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                Se alle varsler ({unreadCount})
              </button>
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