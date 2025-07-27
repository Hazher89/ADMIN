'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { 
  Home,
  Users,
  Building,
  Calendar,
  Clock,
  FileText,
  AlertTriangle,
  MessageSquare,
  Settings,
  HelpCircle,
  User,
  LogOut,
  Menu,
  X,
  Bell,
  Search,
  ChevronDown,
  Zap,
  TrendingUp,
  Activity,
  Shield,
  Database,
  Globe,
  Palette,
  Download,
  Crown,
  Star,
  Target,
  Award
} from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userProfile, isAdmin, isDepartmentLeader, logout } = useAuth();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifications, setNotifications] = useState([
    { id: 1, message: 'Nytt avvik rapportert', time: '2 min siden', type: 'deviation' },
    { id: 2, message: 'Feriesøknad godkjent', time: '1 time siden', type: 'vacation' },
    { id: 3, message: 'System oppdatering', time: '3 timer siden', type: 'system' }
  ]);

  const navigationItems = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: Home,
      description: 'Oversikt og statistikk',
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-700'
    },
    {
      name: 'Ansatte',
      href: '/employees',
      icon: Users,
      description: 'Brukermanagement',
      color: 'from-green-500 to-green-600',
      bgColor: 'bg-green-50',
      textColor: 'text-green-700',
      adminOnly: true
    },
    {
      name: 'Avdelinger',
      href: '/departments',
      icon: Building,
      description: 'Avdelingsadministrasjon',
      color: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-700',
      adminOnly: true
    },
    {
      name: 'Fravær',
      href: '/absence',
      icon: Calendar,
      description: 'Fraværsadministrasjon',
      color: 'from-orange-500 to-orange-600',
      bgColor: 'bg-orange-50',
      textColor: 'text-orange-700'
    },
    {
      name: 'Ferie',
      href: '/vacation',
      icon: Calendar,
      description: 'Ferieadministrasjon',
      color: 'from-teal-500 to-teal-600',
      bgColor: 'bg-teal-50',
      textColor: 'text-teal-700'
    },
    {
      name: 'Stemple',
      href: '/timeclock',
      icon: Clock,
      description: 'Tidsregistrering',
      color: 'from-indigo-500 to-indigo-600',
      bgColor: 'bg-indigo-50',
      textColor: 'text-indigo-700'
    },
    {
      name: 'Skiftplan',
      href: '/shifts',
      icon: Calendar,
      description: 'Skiftplanlegging',
      color: 'from-pink-500 to-pink-600',
      bgColor: 'bg-pink-50',
      textColor: 'text-pink-700'
    },
    {
      name: 'Avvik',
      href: '/deviations',
      icon: AlertTriangle,
      description: 'Avvikshåndtering',
      color: 'from-red-500 to-red-600',
      bgColor: 'bg-red-50',
      textColor: 'text-red-700'
    },
    {
      name: 'Dokumenter',
      href: '/documents',
      icon: FileText,
      description: 'Dokumentadministrasjon',
      color: 'from-yellow-500 to-yellow-600',
      bgColor: 'bg-yellow-50',
      textColor: 'text-yellow-700'
    },
    {
      name: 'Chat',
      href: '/chat',
      icon: MessageSquare,
      description: 'Kommunikasjon',
      color: 'from-emerald-500 to-emerald-600',
      bgColor: 'bg-emerald-50',
      textColor: 'text-emerald-700'
    },
    {
      name: 'Rapporter',
      href: '/reports',
      icon: TrendingUp,
      description: 'Analyser og rapporter',
      color: 'from-cyan-500 to-cyan-600',
      bgColor: 'bg-cyan-50',
      textColor: 'text-cyan-700'
    },
    {
      name: 'Hjelp',
      href: '/help',
      icon: HelpCircle,
      description: 'Support og dokumentasjon',
      color: 'from-gray-500 to-gray-600',
      bgColor: 'bg-gray-50',
      textColor: 'text-gray-700'
    },
    {
      name: 'Innstillinger',
      href: '/settings',
      icon: Settings,
      description: 'Systemkonfigurasjon',
      color: 'from-slate-500 to-slate-600',
      bgColor: 'bg-slate-50',
      textColor: 'text-slate-700',
      adminOnly: true
    }
  ];

  const filteredNavigation = navigationItems.filter(item => {
    if (item.adminOnly && !isAdmin) return false;
    if (item.name === 'Avdelinger' && !isAdmin && !isDepartmentLeader) return false;
    return true;
  });

  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Logget ut');
    } catch (error) {
      toast.error('Kunne ikke logge ut');
    }
  };

  const getRoleBadge = () => {
    if (isAdmin) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
          <Crown className="h-3 w-3 mr-1" />
          Administrator
        </span>
      );
    } else if (isDepartmentLeader) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          <Star className="h-3 w-3 mr-1" />
          Avdelingsleder
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          <User className="h-3 w-3 mr-1" />
          Ansatt
        </span>
      );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-80 bg-white shadow-2xl transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                <Zap className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">DriftPro</h1>
                <p className="text-sm text-gray-500">Admin Panel</p>
              </div>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-2 rounded-lg hover:bg-gray-100"
            >
              <X className="h-5 w-5 text-gray-500" />
            </button>
          </div>

          {/* User Profile */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                <User className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {userProfile?.displayName || 'Bruker'}
                </p>
                <p className="text-sm text-gray-500 truncate">
                  {userProfile?.email || 'email@example.com'}
                </p>
                <div className="mt-1">
                  {getRoleBadge()}
                </div>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
            {filteredNavigation.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`group relative flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${
                    isActive
                      ? `bg-gradient-to-r ${item.color} text-white shadow-lg transform scale-105`
                      : `text-gray-700 hover:bg-gradient-to-r ${item.color} hover:text-white hover:shadow-md hover:transform hover:scale-105 ${item.bgColor}`
                  }`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <Icon className={`mr-3 h-5 w-5 transition-colors ${
                    isActive ? 'text-white' : item.textColor
                  }`} />
                  <div className="flex-1">
                    <span>{item.name}</span>
                    <p className={`text-xs mt-0.5 ${
                      isActive ? 'text-blue-100' : 'text-gray-500'
                    }`}>
                      {item.description}
                    </p>
                  </div>
                  {isActive && (
                    <div className="absolute right-2 w-2 h-2 bg-white rounded-full"></div>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-gray-200">
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Logg ut
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-80">
        {/* Top bar */}
        <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-lg border-b border-gray-200">
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 rounded-lg hover:bg-gray-100"
              >
                <Menu className="h-5 w-5 text-gray-500" />
              </button>
              
              <div className="hidden md:flex items-center space-x-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Søk..."
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {/* Notifications */}
              <div className="relative">
                <button className="p-2 rounded-lg hover:bg-gray-100 relative">
                  <Bell className="h-5 w-5 text-gray-500" />
                  {notifications.length > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                      {notifications.length}
                    </span>
                  )}
                </button>
              </div>

              {/* Quick Actions */}
              <div className="hidden md:flex items-center space-x-2">
                <button className="p-2 rounded-lg hover:bg-gray-100">
                  <Activity className="h-5 w-5 text-gray-500" />
                </button>
                <button className="p-2 rounded-lg hover:bg-gray-100">
                  <Target className="h-5 w-5 text-gray-500" />
                </button>
                <button className="p-2 rounded-lg hover:bg-gray-100">
                  <Award className="h-5 w-5 text-gray-500" />
                </button>
              </div>

              {/* Breadcrumb */}
              <div className="hidden lg:flex items-center space-x-2 text-sm text-gray-500">
                <span>Dashboard</span>
                <ChevronDown className="h-4 w-4" />
                <span className="text-gray-900 font-medium">
                  {filteredNavigation.find(item => item.href === pathname)?.name || 'Side'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="p-6">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
} 