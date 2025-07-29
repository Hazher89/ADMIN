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
  Bell,
  Code,
  Search 
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
    },
    {
      name: 'Utvikling',
      href: '/dashboard/development',
      icon: <Code className="h-5 w-5" />,
      badge: 'Admin',
      badgeColor: 'bg-purple-500'
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
    <div className="flex h-screen bg-gray-100">
      {/* Fixed Sidebar */}
      <div className="fixed left-0 top-0 h-full w-64 bg-blue-900 text-white flex flex-col z-50">
        {/* Logo */}
        <div className="p-6 border-b border-blue-800">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-white rounded flex items-center justify-center">
              <span className="text-blue-900 font-bold text-lg">D</span>
            </div>
            <span className="text-xl font-bold">DriftPro</span>
          </div>
        </div>

        {/* User Profile */}
        <div className="p-4 border-b border-blue-800">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-700 rounded-full flex items-center justify-center">
              <span className="text-white font-medium">
                {user?.email?.charAt(0).toUpperCase() || 'U'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user?.email}</p>
              <p className="text-xs text-blue-300">Administrator</p>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-300 h-4 w-4" />
            <input
              type="text"
              placeholder="Søk..."
              className="w-full pl-10 pr-4 py-2 bg-blue-800 border border-blue-700 rounded-lg text-white placeholder-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto">
          <ul className="space-y-1 p-4">
            {sidebarItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors relative ${
                      isActive
                        ? 'bg-blue-700 text-white'
                        : 'text-blue-200 hover:bg-blue-800 hover:text-white'
                    }`}
                  >
                    {item.icon}
                    <span className="flex-1">{item.name}</span>
                    {item.badge && (
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${item.badgeColor}`}>
                        {item.badge}
                      </span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Logout */}
        <div className="p-4 border-t border-blue-800">
          <button
            onClick={handleLogout}
            className="flex items-center space-x-3 w-full px-3 py-2 text-blue-200 hover:bg-blue-800 hover:text-white rounded-lg transition-colors"
          >
            <LogOut className="h-5 w-5" />
            <span>Logg ut</span>
          </button>
        </div>
      </div>

      {/* Main Content - with left margin to account for fixed sidebar */}
      <div className="flex-1 ml-64 bg-white">
        {/* Top Header */}
        <header className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600">Velkommen tilbake</p>
          </div>
          <div className="flex items-center space-x-4">
            <button className="relative p-2 text-gray-600 hover:text-gray-900">
              <Bell className="h-6 w-6" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </button>
            <button
              onClick={handleLogout}
              className="p-2 text-gray-600 hover:text-gray-900"
            >
              <LogOut className="h-6 w-6" />
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="bg-white">
          {children}
        </main>
      </div>
    </div>
  );
} 