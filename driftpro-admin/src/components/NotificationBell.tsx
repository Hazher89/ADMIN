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
import { collection, query, limit, onSnapshot, where, updateDoc, doc, deleteDoc, getDocs } from 'firebase/firestore';
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
  const { user, userProfile } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);

  const loadNotifications = useCallback(async () => {
    try {
      if (!db) {
        console.error('Firebase not initialized');
        return () => {};
      }

      if (!user?.uid || !userProfile?.companyId) {
        // Don't log error if user is not logged in yet
        if (user?.uid && !userProfile?.companyId) {
          console.warn('User logged in but no company ID found in profile');
        }
        setNotifications([]);
        return () => {};
      }

      // Filter notifications by user
      // Note: We filter by department in memory to support department leaders seeing only their department's notifications
      const notificationsQuery = query(
        collection(db, 'notifications'),
        where('userId', '==', user.uid)
      );
      
      const unsubscribe = onSnapshot(notificationsQuery, (snapshot) => {
        const notificationsData: Notification[] = [];
        const userRole = userProfile?.role || 'employee';
        const userDepartmentId = userProfile?.departmentId;
        const userCompanyId = userProfile?.companyId;

        snapshot.forEach((doc) => {
          const data = doc.data();
          
          try {
            // Filter by company
            if (userCompanyId && data.metadata?.companyId && data.metadata.companyId !== userCompanyId) {
              return; // Skip notifications from other companies
            }

            // Filter by department for department leaders
            if (userRole === 'department_leader' && userDepartmentId) {
              // Department leaders should only see notifications from their department
              if (data.metadata?.departmentId && data.metadata.departmentId !== userDepartmentId) {
                return; // Skip notifications from other departments
              }
            }

            // Employees should only see their own notifications (already filtered by userId in query)

            // Handle timestamps
            let createdAt = new Date().toISOString();
            if (data.createdAt?.toDate) {
              createdAt = data.createdAt.toDate().toISOString();
            } else if (data.createdAt instanceof Date) {
              createdAt = data.createdAt.toISOString();
            } else if (typeof data.createdAt === 'string') {
              createdAt = data.createdAt;
            }

            let readAt = '';
            if (data.readAt?.toDate) {
              readAt = data.readAt.toDate().toISOString();
            } else if (data.readAt instanceof Date) {
              readAt = data.readAt.toISOString();
            } else if (typeof data.readAt === 'string') {
              readAt = data.readAt;
            }

            let archivedAt = '';
            if (data.archivedAt?.toDate) {
              archivedAt = data.archivedAt.toDate().toISOString();
            } else if (data.archivedAt instanceof Date) {
              archivedAt = data.archivedAt.toISOString();
            } else if (typeof data.archivedAt === 'string') {
              archivedAt = data.archivedAt;
            }

            const notification: Notification = {
              id: doc.id,
              userId: data.userId || user?.uid || '',
              title: data.title || '',
              message: data.message || '',
              type: data.type || 'info',
              status: data.status || 'unread',
              priority: data.priority || 'normal',
              createdAt,
              readAt,
              archivedAt,
              metadata: data.metadata || {},
            };
            
            notificationsData.push(notification);
          } catch (error) {
            console.error('Error parsing notification data:', error);
          }
        });
        
        setNotifications(notificationsData);
        
        // Update unread count
        const unreadNotifications = notificationsData.filter(n => n.status === 'unread');
        setUnreadCount(unreadNotifications.length);
      }, (error) => {
        console.error('Error loading notifications:', error);
      });

      return unsubscribe;
    } catch (error) {
      console.error('Error setting up notifications listener:', error);
      return () => {};
    }
  }, [user?.uid, userProfile?.companyId, userProfile?.role, userProfile?.departmentId]);

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
    const iconStyle = { width: '16px', height: '16px' };
    switch (type) {
      case 'deviation':
        return <AlertTriangle size={16} style={{ ...iconStyle, color: '#ef4444' }} />;
      case 'vacation':
        return <Calendar size={16} style={{ ...iconStyle, color: '#3b82f6' }} />;
      case 'absence':
        return <User size={16} style={{ ...iconStyle, color: '#f97316' }} />;
      case 'shift':
        return <Clock size={16} style={{ ...iconStyle, color: '#22c55e' }} />;
      case 'document':
        return <FileText size={16} style={{ ...iconStyle, color: '#a855f7' }} />;
      case 'chat':
        return <MessageSquare size={16} style={{ ...iconStyle, color: '#6366f1' }} />;
      case 'employee':
        return <User size={16} style={{ ...iconStyle, color: '#14b8a6' }} />;
      case 'system':
        return <Building size={16} style={{ ...iconStyle, color: 'var(--gray-500)' }} />;
      default:
        return <Bell size={16} style={{ ...iconStyle, color: 'var(--gray-500)' }} />;
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

  const getPriorityColorDark = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return { border: 'rgba(239, 68, 68, 0.3)', bg: 'rgba(239, 68, 68, 0.1)' };
      case 'high':
        return { border: 'rgba(249, 115, 22, 0.3)', bg: 'rgba(249, 115, 22, 0.1)' };
      case 'medium':
        return { border: 'rgba(234, 179, 8, 0.3)', bg: 'rgba(234, 179, 8, 0.1)' };
      case 'low':
        return { border: 'rgba(34, 197, 94, 0.3)', bg: 'rgba(34, 197, 94, 0.1)' };
      default:
        return { border: 'rgba(107, 114, 128, 0.3)', bg: 'rgba(107, 114, 128, 0.1)' };
    }
  };

  const getPriorityBadgeColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return { bg: 'rgba(239, 68, 68, 0.2)', text: '#fca5a5' };
      case 'high':
        return { bg: 'rgba(249, 115, 22, 0.2)', text: '#fdba74' };
      case 'medium':
        return { bg: 'rgba(234, 179, 8, 0.2)', text: '#fde047' };
      case 'low':
        return { bg: 'rgba(34, 197, 94, 0.2)', text: '#86efac' };
      default:
        return { bg: 'rgba(107, 114, 128, 0.2)', text: '#d1d5db' };
    }
  };

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        style={{
          position: 'relative',
          padding: '0.5rem',
          color: 'var(--gray-400)',
          background: 'transparent',
          border: 'none',
          borderRadius: 'var(--radius-lg)',
          cursor: 'pointer',
          transition: 'all var(--transition-normal)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'var(--gray-100)';
          e.currentTarget.style.color = 'var(--text-color)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'transparent';
          e.currentTarget.style.color = 'var(--gray-400)';
        }}
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span style={{
            position: 'absolute',
            top: '-2px',
            right: '-2px',
            background: 'var(--danger)',
            color: 'white',
            fontSize: '0.75rem',
            borderRadius: '50%',
            height: '18px',
            width: '18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: '600',
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)'
          }}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {showDropdown && (
        <>
          {/* Backdrop */}
          <div
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 999,
              background: 'rgba(0, 0, 0, 0.3)',
              backdropFilter: 'blur(2px)'
            }}
            onClick={() => setShowDropdown(false)}
          />
          
          {/* Dropdown */}
          <div style={{
            position: 'absolute',
            right: 0,
            top: 'calc(100% + 0.5rem)',
            width: '380px',
            maxWidth: '90vw',
            background: 'var(--card-background)',
            borderRadius: 'var(--radius-xl)',
            boxShadow: 'var(--shadow-xl)',
            border: '1px solid var(--border-color)',
            zIndex: 1000,
            overflow: 'hidden',
            animation: 'fadeIn 0.2s ease'
          }}>
            {/* Header */}
            <div style={{
              padding: '1rem 1.25rem',
              borderBottom: '1px solid var(--border-color)',
              background: 'var(--gray-50)'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: unreadCount > 0 ? '0.5rem' : '0'
              }}>
                <h3 style={{
                  fontSize: 'var(--font-size-lg)',
                  fontWeight: '600',
                  color: 'var(--text-color)'
                }}>
                  Varsler
                </h3>
              <button
                onClick={() => setShowDropdown(false)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--gray-400)',
                    cursor: 'pointer',
                    padding: '0.25rem',
                    borderRadius: 'var(--radius-md)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'var(--gray-100)';
                    e.currentTarget.style.color = 'var(--text-color)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'none';
                    e.currentTarget.style.color = 'var(--gray-400)';
                  }}
              >
                  <X size={18} />
              </button>
            </div>
            {unreadCount > 0 && (
                <p style={{
                  fontSize: 'var(--font-size-sm)',
                  color: 'var(--gray-500)',
                  margin: 0
                }}>
                  {unreadCount} {unreadCount === 1 ? 'ulest varsel' : 'uleste varsler'}
              </p>
            )}
          </div>

            {/* Notifications List */}
            <div style={{
              maxHeight: '400px',
              overflowY: 'auto',
              overflowX: 'hidden'
            }}>
            {loading ? (
                <div style={{
                  padding: '2rem',
                  textAlign: 'center'
                }}>
                  <div style={{
                    width: '24px',
                    height: '24px',
                    border: '2px solid var(--border-color)',
                    borderTopColor: 'var(--primary)',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite',
                    margin: '0 auto'
                  }}></div>
              </div>
            ) : notifications.length === 0 ? (
                <div style={{
                  padding: '2rem',
                  textAlign: 'center',
                  color: 'var(--gray-500)'
                }}>
                  <Bell size={32} style={{ margin: '0 auto 0.75rem', opacity: 0.5 }} />
                  <p style={{ margin: 0, fontSize: 'var(--font-size-sm)' }}>
                    Ingen varsler
                  </p>
              </div>
            ) : (
                <div>
                  {notifications.map((notification) => {
                    const priorityColors = getPriorityColorDark(notification.priority);
                    const badgeColors = getPriorityBadgeColor(notification.priority);
                    const isUnread = notification.status === 'unread';
                    
                    return (
                  <div
                    key={notification.id}
                        style={{
                          padding: '1rem 1.25rem',
                          borderBottom: '1px solid var(--border-color)',
                          background: isUnread ? priorityColors.bg : 'transparent',
                          borderLeft: `3px solid ${priorityColors.border}`,
                          transition: 'all 0.2s',
                          cursor: 'pointer'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = 'var(--gray-100)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = isUnread ? priorityColors.bg : 'transparent';
                        }}
                  >
                        <div style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: '0.75rem'
                        }}>
                          <div style={{
                            flexShrink: 0,
                            marginTop: '0.125rem'
                          }}>
                      {getNotificationIcon(notification.type)}
                          </div>
                          <div style={{
                            flex: 1,
                            minWidth: 0
                          }}>
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              marginBottom: '0.5rem',
                              gap: '0.5rem'
                            }}>
                              <h4 style={{
                                fontSize: 'var(--font-size-sm)',
                                fontWeight: isUnread ? '600' : '500',
                                color: 'var(--text-color)',
                                margin: 0,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                flex: 1
                              }}>
                            {notification.title}
                          </h4>
                              <span style={{
                                padding: '0.25rem 0.5rem',
                                fontSize: '0.625rem',
                                borderRadius: 'var(--radius-full)',
                                background: badgeColors.bg,
                                color: badgeColors.text,
                                fontWeight: '600',
                                textTransform: 'uppercase',
                                flexShrink: 0
                              }}>
                                {notification.priority === 'urgent' ? 'Høy' :
                                 notification.priority === 'high' ? 'Høy' :
                                 notification.priority === 'medium' ? 'Middels' : 'Lav'}
                          </span>
                        </div>
                            <p style={{
                              fontSize: 'var(--font-size-sm)',
                              color: 'var(--gray-500)',
                              margin: '0 0 0.75rem 0',
                              lineHeight: '1.5',
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden'
                            }}>
                          {notification.message}
                        </p>
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              gap: '0.5rem'
                            }}>
                              <span style={{
                                fontSize: '0.75rem',
                                color: 'var(--gray-500)'
                              }}>
                                {new Date(notification.createdAt).toLocaleString('no-NO', {
                                  day: '2-digit',
                                  month: 'short',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                          </span>
                              <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.25rem'
                              }}>
                                {notification.status === 'unread' && (
                            <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      markAsRead(notification.id);
                                    }}
                                    style={{
                                      padding: '0.375rem',
                                      background: 'none',
                                      border: 'none',
                                      color: 'var(--gray-400)',
                                      cursor: 'pointer',
                                      borderRadius: 'var(--radius-md)',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      transition: 'all 0.2s'
                                    }}
                                    onMouseEnter={(e) => {
                                      e.currentTarget.style.background = 'var(--gray-100)';
                                      e.currentTarget.style.color = '#10b981';
                                    }}
                                    onMouseLeave={(e) => {
                                      e.currentTarget.style.background = 'none';
                                      e.currentTarget.style.color = 'var(--gray-400)';
                                    }}
                              title="Merk som lest"
                            >
                                    <Check size={14} />
                            </button>
                                )}
                            <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    archiveNotification(notification.id);
                                  }}
                                  style={{
                                    padding: '0.375rem',
                                    background: 'none',
                                    border: 'none',
                                    color: 'var(--gray-400)',
                                    cursor: 'pointer',
                                    borderRadius: 'var(--radius-md)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    transition: 'all 0.2s'
                                  }}
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.background = 'var(--gray-100)';
                                    e.currentTarget.style.color = 'var(--text-color)';
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.background = 'none';
                                    e.currentTarget.style.color = 'var(--gray-400)';
                                  }}
                              title="Arkiver"
                            >
                                  <Archive size={14} />
                            </button>
                            <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    deleteNotification(notification.id);
                                  }}
                                  style={{
                                    padding: '0.375rem',
                                    background: 'none',
                                    border: 'none',
                                    color: 'var(--gray-400)',
                                    cursor: 'pointer',
                                    borderRadius: 'var(--radius-md)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    transition: 'all 0.2s'
                                  }}
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.background = 'var(--gray-100)';
                                    e.currentTarget.style.color = 'var(--danger)';
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.background = 'none';
                                    e.currentTarget.style.color = 'var(--gray-400)';
                                  }}
                              title="Slett"
                            >
                                  <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                    );
                  })}
              </div>
            )}
          </div>

            {/* Footer */}
          {notifications.length > 0 && (
              <div style={{
                padding: '1rem 1.25rem',
                borderTop: '1px solid var(--border-color)',
                background: 'var(--gray-50)'
              }}>
              <Link
                href="/dashboard/notifications"
                onClick={() => setShowDropdown(false)}
                  style={{
                    display: 'block',
                    width: '100%',
                    textAlign: 'center',
                    padding: '0.625rem 1rem',
                    background: 'var(--primary)',
                    color: 'white',
                    borderRadius: 'var(--radius-lg)',
                    textDecoration: 'none',
                    fontSize: 'var(--font-size-sm)',
                    fontWeight: '500',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#0891b2';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(6, 182, 212, 0.3)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'var(--primary)';
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
              >
                Se alle varsler
              </Link>
            </div>
          )}
        </div>
        </>
      )}

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
}