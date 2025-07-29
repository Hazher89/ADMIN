'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Zap, 
  Menu, 
  X, 
  Bell, 
  LogOut,
  Home,
  Users,
  Building,
  Clock,
  User,
  Calendar,
  AlertTriangle,
  MessageSquare,
  FileText,
  BarChart3,
  Settings
} from 'lucide-react';

interface SidebarItem {
  name: string;
  href: string;
  icon: React.ReactNode;
  badge?: string;
  children?: SidebarItem[];
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userProfile, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [expandedItems] = useState<string[]>([]);

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
      name: 'Samarbeidspartnere',
      href: '/dashboard/partners',
      icon: <Users className="h-5 w-5" />
    },
    {
      name: 'Skiftplan',
      href: '/dashboard/shifts',
      icon: <Clock className="h-5 w-5" />
    },
    {
      name: 'Fravær',
      href: '/dashboard/absence',
      icon: <User className="h-5 w-5" />
    },
    {
      name: 'Ferie',
      href: '/dashboard/vacation',
      icon: <Calendar className="h-5 w-5" />
    },
    {
      name: 'Avvik',
      href: '/dashboard/deviations',
      icon: <AlertTriangle className="h-5 w-5" />
    },
    {
      name: 'Chat',
      href: '/dashboard/chat',
      icon: <MessageSquare className="h-5 w-5" />,
      badge: '3'
    },
    {
      name: 'Dokumenter',
      href: '/dashboard/documents',
      icon: <FileText className="h-5 w-5" />
    },
    {
      name: 'Rapporter',
      href: '/dashboard/reports',
      icon: <BarChart3 className="h-5 w-5" />
    },
    {
      name: 'Innstillinger',
      href: '/dashboard/settings',
      icon: <Settings className="h-5 w-5" />
    },
    {
      name: 'Bedrifter',
      href: '/dashboard/companies',
      icon: <Building className="h-5 w-5" />,
      badge: 'Admin'
    }
  ];

  const handleLogout = async () => {
    try {
      await logout();
      // Redirect to login page after successful logout
      router.push('/login');
    } catch (error) {
      console.error('Error logging out:', error);
      // Still redirect even if there's an error
      router.push('/login');
    }
  };

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-gray-900 transform transition-transform duration-300 ease-in-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:relative lg:translate-x-0`}>
        <div className="flex items-center justify-between h-16 px-4 bg-gray-800">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
              <Zap className="h-5 w-5 text-white" />
            </div>
            <span className="text-white font-bold text-lg">DriftPro</span>
          </div>
          <button
            onClick={toggleSidebar}
            className="lg:hidden text-gray-400 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* User Profile */}
        <div className="px-4 py-6 border-b border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
              <span className="text-white font-medium text-lg">
                {userProfile?.displayName?.charAt(0) || 'U'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-medium truncate">
                {userProfile?.displayName || userProfile?.email || 'Bruker'}
              </p>
              <p className="text-gray-400 text-sm truncate">
                {userProfile?.role === 'admin' && 'Administrator'}
                {userProfile?.role === 'department_leader' && 'Avdelingsleder'}
                {userProfile?.role === 'employee' && 'Ansatt'}
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
              className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
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
      <div className="flex-1 flex flex-col lg:ml-0">
        {/* Top Header */}
        <header className="bg-white shadow-sm border-b border-gray-200 lg:hidden">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <Zap className="h-5 w-5 text-white" />
              </div>
              <span className="text-gray-900 font-bold text-lg">DriftPro</span>
            </div>
            <div className="flex items-center space-x-3">
              <button className="text-gray-400 hover:text-gray-600">
                <Bell className="h-5 w-5" />
              </button>
              <button
                onClick={toggleSidebar}
                className="text-gray-400 hover:text-gray-600"
              >
                <Menu className="h-5 w-5" />
              </button>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  );
} 