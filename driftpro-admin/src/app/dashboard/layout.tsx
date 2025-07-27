'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import {
  Zap,
  Users,
  Calendar,
  Clock,
  FileText,
  AlertTriangle,
  MessageSquare,
  Building,
  BarChart3,
  Settings,
  LogOut,
  User,
  Home,
  Bell,
  Search,
  Menu,
  X,
  ChevronDown,
  ChevronRight,
  Plus,
  Eye,
  Edit,
  Trash2,
  Upload,
  Download,
  Filter,
  RefreshCw,
  Activity,
  TrendingUp,
  PieChart,
  LineChart,
  Target,
  Award,
  Shield,
  Database,
  Globe,
  Mail,
  Phone,
  Camera,
  Key,
  Unlock,
  Wifi,
  Battery,
  Signal,
  Crown,
  Star,
  Play,
  Book,
  Video,
  MessageCircle,
  ExternalLink,
  ThumbsUp,
  ThumbsDown,
  Send,
  Info,
  XCircle
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
  const pathname = usePathname();
  const { userProfile, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [expandedItems, setExpandedItems] = useState<string[]>(['dashboard']);

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
    }
  ];

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-gray-900 transform transition-transform duration-300 ease-in-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 lg:static lg:inset-0`}>
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
                {userProfile?.displayName || 'Bruker'}
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
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
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
            const isExpanded = expandedItems.includes(item.name.toLowerCase());

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

        {/* Logout */}
        <div className="px-4 py-4 border-t border-gray-700">
          <button
            onClick={handleLogout}
            className="flex items-center space-x-3 w-full px-3 py-2 text-gray-300 hover:bg-gray-800 hover:text-white rounded-lg text-sm font-medium transition-colors"
          >
            <LogOut className="h-5 w-5" />
            <span>Logg ut</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="lg:pl-64">
        {/* Top Header */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
            <div className="flex items-center">
              <button
                onClick={toggleSidebar}
                className="lg:hidden p-2 text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100"
              >
                <Menu className="h-5 w-5" />
              </button>
              <div className="ml-4 lg:ml-0">
                <h1 className="text-xl font-semibold text-gray-900">
                  {sidebarItems.find(item => item.href === pathname)?.name || 'Dashboard'}
                </h1>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <button className="relative p-2 text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100">
                <Bell className="h-5 w-5" />
                <span className="absolute top-0 right-0 h-2 w-2 bg-red-500 rounded-full"></span>
              </button>
              
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-medium">
                    {userProfile?.displayName?.charAt(0) || 'U'}
                  </span>
                </div>
                <div className="hidden md:block">
                  <p className="text-sm font-medium text-gray-900">{userProfile?.displayName || 'Bruker'}</p>
                  <p className="text-xs text-gray-500">{userProfile?.role || 'employee'}</p>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={toggleSidebar}
        />
      )}
    </div>
  );
} 