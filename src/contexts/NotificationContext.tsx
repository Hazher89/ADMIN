'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { onSnapshot, query, where, orderBy, limit, collection } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { notificationService } from '@/lib/firebase-services';
import { Notification, NotificationType } from '@/types';
import { useAuth } from './AuthContext';
import { toast } from 'react-hot-toast';

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  handleNotificationClick: (notification: Notification) => void;
  clearNotifications: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const { currentUser } = useAuth();

  useEffect(() => {
    if (!currentUser) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', currentUser.uid),
      orderBy('createdAt', 'desc'),
      limit(50)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const newNotifications = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Notification[];

      setNotifications(newNotifications);
      setUnreadCount(newNotifications.filter(n => !n.read).length);

      // Show toast for new notifications
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const notification = { id: change.doc.id, ...change.doc.data() } as Notification;
          if (!notification.read) {
            showNotificationToast(notification);
          }
        }
      });
    });

    return unsubscribe;
  }, [currentUser]);

  const showNotificationToast = (notification: Notification) => {
    const getIcon = (type: NotificationType) => {
      switch (type) {
        case NotificationType.ABSENCE_REQUEST:
          return '🏥';
        case NotificationType.VACATION_REQUEST:
          return '🏖️';
        case NotificationType.DEVIATION_REPORT:
          return '⚠️';
        case NotificationType.SHIFT_ASSIGNMENT:
          return '⏰';
        case NotificationType.DOCUMENT_SHARED:
          return '📄';
        case NotificationType.CHAT_MESSAGE:
          return '💬';
        default:
          return '🔔';
      }
    };

    const icon = getIcon(notification.type);
    toast(
      <div className="flex items-center space-x-2">
        <span>{icon}</span>
        <div>
          <div className="font-semibold">{notification.title}</div>
          <div className="text-sm text-gray-600">{notification.message}</div>
        </div>
      </div>,
      {
        duration: 5000,
        position: 'top-right',
        onClick: () => handleNotificationClick(notification)
      }
    );
  };

  const markAsRead = async (notificationId: string) => {
    try {
      await notificationService.markAsRead(notificationId);
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
      toast.error('Kunne ikke markere som lest');
    }
  };

  const markAllAsRead = async () => {
    if (!currentUser) return;

    try {
      await notificationService.markAllAsRead(currentUser.uid);
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
      toast.success('Alle varsler markert som lest');
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      toast.error('Kunne ikke markere alle som lest');
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    // Mark as read first
    markAsRead(notification.id);

    // Handle navigation based on notification type and data
    if (notification.data) {
      switch (notification.type) {
        case NotificationType.ABSENCE_REQUEST:
          // Navigate to absence details
          window.location.href = `/absence/${notification.data.absenceId}`;
          break;
        case NotificationType.VACATION_REQUEST:
          // Navigate to vacation details
          window.location.href = `/vacation/${notification.data.vacationId}`;
          break;
        case NotificationType.DEVIATION_REPORT:
          // Navigate to deviation details
          window.location.href = `/deviations/${notification.data.deviationId}`;
          break;
        case NotificationType.SHIFT_ASSIGNMENT:
          // Navigate to shift details
          window.location.href = `/shifts/${notification.data.shiftId}`;
          break;
        case NotificationType.DOCUMENT_SHARED:
          // Navigate to documents
          window.location.href = `/documents`;
          break;
        case NotificationType.CHAT_MESSAGE:
          // Navigate to chat
          window.location.href = `/chat/${notification.data.chatId}`;
          break;
        default:
          // Default navigation or no action
          break;
      }
    }
  };

  const clearNotifications = () => {
    setNotifications([]);
    setUnreadCount(0);
  };

  const value: NotificationContextType = {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    handleNotificationClick,
    clearNotifications
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}; 