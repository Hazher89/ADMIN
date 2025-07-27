'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
  TrendingUp,
  Activity,
  Bell,
  Settings,
  LogOut,
  User,
  Home,
  BarChart3,
  PieChart,
  LineChart,
  Eye,
  Plus,
  Filter,
  RefreshCw,
  Upload,
  Trash2,
  Edit,
  Save,
  Camera,
  Key,
  Unlock,
  Wifi,
  Battery,
  Signal,
  ChevronRight,
  ChevronDown,
  ExternalLink,
  ThumbsUp,
  ThumbsDown,
  Send,
  Info,
  XCircle,
  Search,
  Menu,
  X,
  Crown,
  Star,
  Target,
  Award,
  Play,
  Book,
  Video,
  MessageCircle,
  Phone,
  Mail,
  Globe,
  Palette,
  Download,
  Database,
  Shield
} from 'lucide-react';

interface DashboardStats {
  totalEmployees: number;
  activeShifts: number;
  pendingRequests: number;
  recentDeviations: number;
  departmentCount: number;
  documentsShared: number;
}

interface RecentActivity {
  id: string;
  type: 'shift' | 'deviation' | 'vacation' | 'absence' | 'document' | 'chat';
  title: string;
  description: string;
  timestamp: string;
  user: string;
  status?: 'pending' | 'approved' | 'rejected' | 'resolved';
}

export default function DashboardPage() {
  const router = useRouter();
  const { user, userProfile, isAuthenticated, loading, logout } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    totalEmployees: 0,
    activeShifts: 0,
    pendingRequests: 0,
    recentDeviations: 0,
    departmentCount: 0,
    documentsShared: 0
  });
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [selectedTimeframe, setSelectedTimeframe] = useState('today');

  useEffect(() => {
    // Check authentication status
    if (!loading) {
      if (!isAuthenticated) {
        router.push('/login');
        return;
      }
      
      // Load dashboard data
      loadDashboardData();
      setIsLoading(false);
    }
  }, [isAuthenticated, loading, router]);

  const loadDashboardData = async () => {
    try {
      // Mock data for demonstration - in real app this would come from Firebase
      const mockStats: DashboardStats = {
        totalEmployees: 156,
        activeShifts: 23,
        pendingRequests: 8,
        recentDeviations: 3,
        departmentCount: 12,
        documentsShared: 45
      };

      const mockActivities: RecentActivity[] = [
        {
          id: '1',
          type: 'shift',
          title: 'Nytt skiftplan publisert',
          description: 'Skiftplan for uke 32 er publisert av HR-avdelingen',
          timestamp: '2024-07-27T10:30:00Z',
          user: 'HR Manager',
          status: 'pending'
        },
        {
          id: '2',
          type: 'deviation',
          title: 'Avvik rapportert',
          description: 'Sikkerhetsavvik rapportert i produksjonsavdelingen',
          timestamp: '2024-07-27T09:15:00Z',
          user: 'Produksjonsleder',
          status: 'pending'
        },
        {
          id: '3',
          type: 'vacation',
          title: 'Ferieforespørsel godkjent',
          description: 'Ferieforespørsel for John Doe er godkjent',
          timestamp: '2024-07-27T08:45:00Z',
          user: 'Department Leader',
          status: 'approved'
        },
        {
          id: '4',
          type: 'document',
          title: 'Nytt dokument delt',
          description: 'Sikkerhetsmanual v2.1 er delt med alle ansatte',
          timestamp: '2024-07-27T08:00:00Z',
          user: 'Admin',
          status: 'resolved'
        },
        {
          id: '5',
          type: 'absence',
          title: 'Fraværsmelding registrert',
          description: 'Sykemelding registrert for Jane Smith',
          timestamp: '2024-07-27T07:30:00Z',
          user: 'Employee',
          status: 'pending'
        }
      ];

      // Simulate loading delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setStats(mockStats);
      setRecentActivities(mockActivities);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/login');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const getActivityIcon = (type: RecentActivity['type']) => {
    switch (type) {
      case 'shift': return <Clock className="h-5 w-5" />;
      case 'deviation': return <AlertTriangle className="h-5 w-5" />;
      case 'vacation': return <Calendar className="h-5 w-5" />;
      case 'absence': return <User className="h-5 w-5" />;
      case 'document': return <FileText className="h-5 w-5" />;
      case 'chat': return <MessageSquare className="h-5 w-5" />;
      default: return <Activity className="h-5 w-5" />;
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'approved': return 'text-green-600 bg-green-100';
      case 'rejected': return 'text-red-600 bg-red-100';
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      case 'resolved': return 'text-blue-600 bg-blue-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  if (loading || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse">
              <Zap className="h-8 w-8 text-white" />
            </div>
            <div className="absolute inset-0 w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-2xl animate-spin mx-auto"></div>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Laster dashboard...</h3>
          <p className="text-gray-600">Henter bedriftsdata og aktiviteter</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                <Zap className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">DriftPro</h1>
                <p className="text-sm text-gray-500">Admin Dashboard</p>
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

              <button
                onClick={handleLogout}
                className="p-2 text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100"
                title="Logg ut"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Velkommen tilbake, {userProfile?.displayName || 'Bruker'}!
          </h2>
          <p className="text-gray-600">
            Her er oversikten over din bedrift for {selectedTimeframe === 'today' ? 'i dag' : 'denne uken'}
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Totalt ansatte</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalEmployees}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Aktive skift</p>
                <p className="text-2xl font-bold text-gray-900">{stats.activeShifts}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <Clock className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Ventende forespørsler</p>
                <p className="text-2xl font-bold text-gray-900">{stats.pendingRequests}</p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                <AlertTriangle className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Nylige avvik</p>
                <p className="text-2xl font-bold text-gray-900">{stats.recentDeviations}</p>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avdelinger</p>
                <p className="text-2xl font-bold text-gray-900">{stats.departmentCount}</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <Building className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Dokumenter delt</p>
                <p className="text-2xl font-bold text-gray-900">{stats.documentsShared}</p>
              </div>
              <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center">
                <FileText className="h-6 w-6 text-indigo-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activities */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Nylige aktiviteter</h3>
              <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                Se alle
              </button>
            </div>
          </div>
          
          <div className="divide-y divide-gray-200">
            {recentActivities.map((activity) => (
              <div key={activity.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
                      {getActivityIcon(activity.type)}
                    </div>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                      {activity.status && (
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(activity.status)}`}>
                          {activity.status === 'approved' && 'Godkjent'}
                          {activity.status === 'rejected' && 'Avvist'}
                          {activity.status === 'pending' && 'Venter'}
                          {activity.status === 'resolved' && 'Løst'}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{activity.description}</p>
                    <div className="flex items-center space-x-4 mt-2">
                      <span className="text-xs text-gray-500">{activity.user}</span>
                      <span className="text-xs text-gray-500">
                        {new Date(activity.timestamp).toLocaleString('no-NO')}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <button className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 hover:shadow-md transition-shadow text-left">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Administrer ansatte</h3>
            <p className="text-sm text-gray-600">Legg til, rediger eller fjern ansatte</p>
          </button>

          <button className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 hover:shadow-md transition-shadow text-left">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-4">
              <Calendar className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Skiftplanlegging</h3>
            <p className="text-sm text-gray-600">Opprett og administrer skiftplaner</p>
          </button>

          <button className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 hover:shadow-md transition-shadow text-left">
            <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center mb-4">
              <FileText className="h-6 w-6 text-yellow-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Dokumenter</h3>
            <p className="text-sm text-gray-600">Del og administrer dokumenter</p>
          </button>

          <button className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 hover:shadow-md transition-shadow text-left">
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-4">
              <BarChart3 className="h-6 w-6 text-purple-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Rapporter</h3>
            <p className="text-sm text-gray-600">Se statistikk og rapporter</p>
          </button>
        </div>
      </div>
    </div>
  );
} 