'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  Users,
  Calendar,
  Clock,
  FileText,
  AlertTriangle,
  MessageSquare,
  Building,
  TrendingUp,
  Activity,
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
  Shield,
  Settings,
  LogOut,
  User,
  Home,
  Bell
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
  const { userProfile } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalEmployees: 156,
    activeShifts: 23,
    pendingRequests: 8,
    recentDeviations: 3,
    departmentCount: 12,
    documentsShared: 45
  });
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    // Mock data for demonstration - in real app this would come from Firebase
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

    setRecentActivities(mockActivities);
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

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Velkommen tilbake, {userProfile?.displayName || 'Bruker'}!
        </h2>
        <p className="text-gray-600">
          Her er oversikten over din bedrift for i dag
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">TOTALT ANSATTE</p>
              <p className="text-3xl font-bold text-gray-900">{stats.totalEmployees}</p>
              <p className="text-sm text-green-600">+12% denne måneden</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">AKTIVE SKIFT</p>
              <p className="text-3xl font-bold text-gray-900">{stats.activeShifts}</p>
              <p className="text-sm text-green-600">+5% denne uken</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <Clock className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-yellow-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">VENTENDE FORESPØRSLER</p>
              <p className="text-3xl font-bold text-gray-900">{stats.pendingRequests}</p>
              <p className="text-sm text-yellow-600">Krever handling</p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <AlertTriangle className="h-6 w-6 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-purple-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">AVDELINGER</p>
              <p className="text-3xl font-bold text-gray-900">{stats.departmentCount}</p>
              <p className="text-sm text-purple-600">Aktive avdelinger</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <Building className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Charts and Statistics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Activity Chart */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Månedlig aktivitet</h3>
            <div className="flex items-center space-x-2">
              <button className="text-sm text-blue-600 hover:text-blue-700">Se alle</button>
            </div>
          </div>
          
          {/* Mock Chart Area */}
          <div className="h-64 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg flex items-center justify-center">
            <div className="text-center">
              <BarChart3 className="h-12 w-12 text-blue-400 mx-auto mb-4" />
              <p className="text-gray-600">Interaktivt diagram kommer snart</p>
              <p className="text-sm text-gray-500">Visning av månedlig aktivitet og trender</p>
            </div>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-3 gap-4 mt-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">+17%</p>
              <p className="text-sm text-gray-600">Totalt aktivitet</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">+8%</p>
              <p className="text-sm text-gray-600">Nye ansatte</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-600">+23%</p>
              <p className="text-sm text-gray-600">Skiftplaner</p>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Rask statistikk</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                    <FileText className="h-4 w-4 text-orange-600" />
                  </div>
                  <span className="text-sm font-medium text-gray-900">Dokumenter</span>
                </div>
                <span className="text-lg font-bold text-gray-900">{stats.documentsShared}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                    <MessageSquare className="h-4 w-4 text-green-600" />
                  </div>
                  <span className="text-sm font-medium text-gray-900">Chat meldinger</span>
                </div>
                <span className="text-lg font-bold text-gray-900">1,247</span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                  </div>
                  <span className="text-sm font-medium text-gray-900">Avvik</span>
                </div>
                <span className="text-lg font-bold text-gray-900">{stats.recentDeviations}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Calendar className="h-4 w-4 text-blue-600" />
                  </div>
                  <span className="text-sm font-medium text-gray-900">Ferieplaner</span>
                </div>
                <span className="text-lg font-bold text-gray-900">89</span>
              </div>
            </div>
          </div>

          {/* Browser Usage Chart */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">System bruk</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Mobil app</span>
                <div className="flex items-center space-x-2">
                  <div className="w-20 bg-gray-200 rounded-full h-2">
                    <div className="bg-blue-600 h-2 rounded-full" style={{ width: '70%' }}></div>
                  </div>
                  <span className="text-sm font-medium text-gray-900">70%</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Web admin</span>
                <div className="flex items-center space-x-2">
                  <div className="w-20 bg-gray-200 rounded-full h-2">
                    <div className="bg-green-600 h-2 rounded-full" style={{ width: '85%' }}></div>
                  </div>
                  <span className="text-sm font-medium text-gray-900">85%</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Desktop app</span>
                <div className="flex items-center space-x-2">
                  <div className="w-20 bg-gray-200 rounded-full h-2">
                    <div className="bg-purple-600 h-2 rounded-full" style={{ width: '45%' }}></div>
                  </div>
                  <span className="text-sm font-medium text-gray-900">45%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activities */}
      <div className="bg-white rounded-lg shadow-sm">
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
                  <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <button className="bg-white rounded-lg shadow-sm p-6 border border-gray-200 hover:shadow-md transition-shadow text-left">
          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
            <Users className="h-6 w-6 text-blue-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Administrer ansatte</h3>
          <p className="text-sm text-gray-600">Legg til, rediger eller fjern ansatte</p>
        </button>

        <button className="bg-white rounded-lg shadow-sm p-6 border border-gray-200 hover:shadow-md transition-shadow text-left">
          <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
            <Calendar className="h-6 w-6 text-green-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Skiftplanlegging</h3>
          <p className="text-sm text-gray-600">Opprett og administrer skiftplaner</p>
        </button>

        <button className="bg-white rounded-lg shadow-sm p-6 border border-gray-200 hover:shadow-md transition-shadow text-left">
          <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center mb-4">
            <FileText className="h-6 w-6 text-yellow-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Dokumenter</h3>
          <p className="text-sm text-gray-600">Del og administrer dokumenter</p>
        </button>

        <button className="bg-white rounded-lg shadow-sm p-6 border border-gray-200 hover:shadow-md transition-shadow text-left">
          <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
            <BarChart3 className="h-6 w-6 text-purple-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Rapporter</h3>
          <p className="text-sm text-gray-600">Se statistikk og rapporter</p>
        </button>
      </div>
    </div>
  );
} 