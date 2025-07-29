'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Home, 
  Users, 
  Building, 
  FileText, 
  Calendar, 
  MessageSquare, 
  AlertTriangle, 
  LogOut, 
  Menu, 
  X, 
  Mail, 
  Bell 
} from 'lucide-react';
import { notificationService } from '@/lib/notification-service';
import NotificationBell from '@/components/NotificationBell';

interface SidebarItem {
  name: string;
  href: string;
  icon: React.ReactNode;
  badge?: string;
  badgeColor?: string;
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Load unread notification count
  useEffect(() => {
    if (!user?.uid) return;

    const loadUnreadCount = async () => {
      const count = await notificationService.getUnreadCount(user.uid);
      setUnreadCount(count);
    };

    loadUnreadCount();
    
    // Set up real-time listener for unread count
    const setupNotifications = async () => {
      const unsubscribe = await notificationService.loadNotifications(user.uid, (notifications) => {
        const unread = notifications.filter(n => n.status === 'unread').length;
        setUnreadCount(unread);
      });

      return unsubscribe;
    };

    setupNotifications();

    return () => {
      // Cleanup will be handled by the service
    };
  }, [user]);

  const sidebarItems: SidebarItem[] = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: <Home className="h-5 w-5" />
    },
    {
      name: 'Ansatte',
      href: '/dashboard/employees',
      icon: <Users className="h-5 w-5" />
    },
    {
      name: 'Avdelinger',
      href: '/dashboard/departments',
      icon: <Building className="h-5 w-5" />
    },
    {
      name: 'Ferie',
      href: '/dashboard/vacation',
      icon: <Calendar className="h-5 w-5" />
    },
    {
      name: 'Dokumenter',
      href: '/dashboard/documents',
      icon: <FileText className="h-5 w-5" />
    },
    {
      name: 'Chat',
      href: '/dashboard/chat',
      icon: <MessageSquare className="h-5 w-5" />
    },
    {
      name: 'Avvik',
      href: '/dashboard/deviations',
      icon: <AlertTriangle className="h-5 w-5" />
    },
    {
      name: 'Bedrifter',
      href: '/dashboard/companies',
      icon: <Building className="h-5 w-5" />,
      badge: 'Admin',
      badgeColor: 'bg-red-500'
    },
    {
      name: 'Samarbeidspartnere',
      href: '/dashboard/partners',
      icon: <Users className="h-5 w-5" />
    },
    {
      name: 'E-postlogger',
      href: '/dashboard/email-logs',
      icon: <Mail className="h-5 w-5" />
    },
    {
      name: 'Varsler',
      href: '/dashboard/notifications',
      icon: <Bell className="h-5 w-5" />
    }
  ];

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-gray-900 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">D</span>
            </div>
            <span className="text-white font-semibold text-lg">DriftPro</span>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-gray-400 hover:text-white"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* User Profile */}
        <div className="p-6 border-b border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
              <span className="text-white font-medium text-lg">
                {user?.displayName?.charAt(0) || user?.email?.charAt(0) || 'U'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-medium truncate">
                {user?.displayName || user?.email || 'Bruker'}
              </p>
              <p className="text-gray-400 text-sm truncate">
                Administrator
              </p>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="px-4 py-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Søk..."
              className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-4 space-y-2 overflow-y-auto">
          {sidebarItems.map((item) => {
            const isActive = pathname === item.href;

            return (
              <div key={item.name}>
                <Link
                  href={item.href}
                  className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    {item.icon}
                    <span>{item.name}</span>
                  </div>
                  {item.badge && (
                    <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                      {item.badge}
                    </span>
                  )}
                </Link>
              </div>
            );
          })}
        </nav>

        {/* Logout Button */}
        <div className="px-4 py-4 border-t border-gray-700">
          <button
            onClick={handleLogout}
            className="w-full flex items-center space-x-3 px-3 py-2 text-gray-300 hover:bg-gray-800 hover:text-white rounded-lg transition-colors"
          >
            <LogOut className="h-5 w-5" />
            <span>Logg ut</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col lg:ml-64 bg-white">
        {/* Top Header */}
        <div className="sticky top-0 z-40 bg-white border-b border-gray-200">
          <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
            <div className="flex items-center">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
              >
                <Menu className="h-6 w-6" />
              </button>
            </div>
            
            <div className="flex items-center space-x-4">
              <NotificationBell />
              <button
                onClick={handleLogout}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                title="Logg ut"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Page Content */}
        <main className="flex-1 bg-white">
          {children}
        </main>
      </div>
    </div>
  );
} 