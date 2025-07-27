'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { userService, departmentService, absenceService, deviationService } from '@/lib/firebase-services';
import { User, Department, Absence, Deviation } from '@/types';
import {
  Users,
  Building,
  Calendar,
  Clock,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock as ClockIcon,
  Activity,
  Target,
  Award,
  Zap,
  BarChart3,
  PieChart,
  LineChart,
  Eye,
  Plus,
  Filter,
  Search,
  Download,
  RefreshCw,
  Bell,
  Star,
  Crown,
  User as UserIcon,
  MapPin,
  Phone,
  Mail,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  DollarSign,
  CalendarDays,
  FileText,
  MessageSquare,
  Settings,
  HelpCircle,
  Shield,
  Database,
  Globe,
  Palette,
  Download as DownloadIcon,
  Upload,
  Trash2,
  Edit,
  Save,
  Camera,
  Eye as EyeIcon,
  EyeOff,
  Key,
  Lock,
  Unlock,
  Wifi,
  Battery,
  Signal,
  Wifi as WifiIcon,
  Battery as BatteryIcon,
  Signal as SignalIcon,
  Wifi as WifiIcon2,
  Battery as BatteryIcon2,
  Signal as SignalIcon2,
  Wifi as WifiIcon3,
  Battery as BatteryIcon3,
  Signal as SignalIcon3,
  Wifi as WifiIcon4,
  Battery as BatteryIcon4,
  Signal as SignalIcon4,
  Wifi as WifiIcon5,
  Battery as BatteryIcon5,
  Signal as SignalIcon5,
  Wifi as WifiIcon6,
  Battery as BatteryIcon6,
  Signal as SignalIcon6,
  Wifi as WifiIcon7,
  Battery as BatteryIcon7,
  Signal as SignalIcon7,
  Wifi as WifiIcon8,
  Battery as BatteryIcon8,
  Signal as SignalIcon8,
  Wifi as WifiIcon9,
  Battery as BatteryIcon9,
  Signal as SignalIcon9,
  Wifi as WifiIcon10,
  Battery as BatteryIcon10,
  Signal as SignalIcon10
} from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function DashboardPage() {
  const { userProfile, isAdmin, isDepartmentLeader } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [absences, setAbsences] = useState<Absence[]>([]);
  const [deviations, setDeviations] = useState<Deviation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<'today' | 'week' | 'month'>('week');
  const [selectedDepartment, setSelectedDepartment] = useState('all');

  useEffect(() => {
    loadData();
  }, [selectedPeriod, selectedDepartment]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [usersData, depsData, absencesData, deviationsData] = await Promise.all([
        userService.getAllUsers(),
        departmentService.getAllDepartments(),
        absenceService.getAllAbsences(),
        deviationService.getAllDeviations()
      ]);

      setUsers(usersData);
      setDepartments(depsData);
      setAbsences(absencesData);
      setDeviations(deviationsData);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      toast.error('Kunne ikke laste dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const getFilteredData = () => {
    let filteredUsers = users;
    let filteredAbsences = absences;
    let filteredDeviations = deviations;

    if (selectedDepartment !== 'all') {
      filteredUsers = users.filter(user => user.departmentId === selectedDepartment);
      filteredAbsences = absences.filter(absence => {
        const user = users.find(u => u.id === absence.userId);
        return user?.departmentId === selectedDepartment;
      });
      filteredDeviations = deviations.filter(deviation => {
        const user = users.find(u => u.id === deviation.userId);
        return user?.departmentId === selectedDepartment;
      });
    }

    return { filteredUsers, filteredAbsences, filteredDeviations };
  };

  const getStats = () => {
    const { filteredUsers, filteredAbsences, filteredDeviations } = getFilteredData();
    
    const totalEmployees = filteredUsers.length;
    const activeEmployees = filteredUsers.filter(user => user.status === 'active').length;
    const pendingAbsences = filteredAbsences.filter(absence => absence.status === 'pending').length;
    const activeDeviations = filteredDeviations.filter(deviation => deviation.status === 'open').length;
    
    const totalDepartments = departments.length;
    const totalAbsences = filteredAbsences.length;
    const totalDeviations = filteredDeviations.length;

    // Calculate trends (mock data for demonstration)
    const employeeTrend = 5.2; // +5.2%
    const absenceTrend = -2.1; // -2.1%
    const deviationTrend = 12.5; // +12.5%
    const efficiencyTrend = 8.7; // +8.7%

    return {
      totalEmployees,
      activeEmployees,
      pendingAbsences,
      activeDeviations,
      totalDepartments,
      totalAbsences,
      totalDeviations,
      employeeTrend,
      absenceTrend,
      deviationTrend,
      efficiencyTrend
    };
  };

  const getRecentActivity = () => {
    const { filteredUsers, filteredAbsences, filteredDeviations } = getFilteredData();
    
    const activities = [
      ...filteredAbsences.slice(0, 3).map(absence => ({
        id: `absence-${absence.id}`,
        type: 'absence',
        title: 'Fraværsøknad',
        description: `${users.find(u => u.id === absence.userId)?.displayName || 'Ukjent'} søkte om fravær`,
        time: new Date(absence.createdAt).toLocaleDateString('no-NO'),
        status: absence.status,
        user: users.find(u => u.id === absence.userId)
      })),
      ...filteredDeviations.slice(0, 3).map(deviation => ({
        id: `deviation-${deviation.id}`,
        type: 'deviation',
        title: 'Avvik rapportert',
        description: `${users.find(u => u.id === deviation.userId)?.displayName || 'Ukjent'} rapporterte et avvik`,
        time: new Date(deviation.createdAt).toLocaleDateString('no-NO'),
        status: deviation.status,
        user: users.find(u => u.id === deviation.userId)
      }))
    ];

    return activities.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()).slice(0, 6);
  };

  const getTopPerformers = () => {
    const { filteredUsers } = getFilteredData();
    
    // Mock performance data
    return filteredUsers.slice(0, 5).map((user, index) => ({
      ...user,
      performance: 95 - (index * 5),
      efficiency: 92 - (index * 3),
      attendance: 98 - (index * 1),
      completedTasks: 150 - (index * 10)
    }));
  };

  const getDepartmentStats = () => {
    return departments.map(dept => {
      const deptUsers = users.filter(user => user.departmentId === dept.id);
      const deptAbsences = absences.filter(absence => {
        const user = users.find(u => u.id === absence.userId);
        return user?.departmentId === dept.id;
      });
      const deptDeviations = deviations.filter(deviation => {
        const user = users.find(u => u.id === deviation.userId);
        return user?.departmentId === dept.id;
      });

      return {
        ...dept,
        employeeCount: deptUsers.length,
        activeEmployees: deptUsers.filter(user => user.status === 'active').length,
        pendingAbsences: deptAbsences.filter(absence => absence.status === 'pending').length,
        openDeviations: deptDeviations.filter(deviation => deviation.status === 'open').length,
        efficiency: Math.floor(Math.random() * 20) + 80 // Mock efficiency score
      };
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const stats = getStats();
  const recentActivity = getRecentActivity();
  const topPerformers = getTopPerformers();
  const departmentStats = getDepartmentStats();

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="mt-2 text-lg text-gray-600">
            Velkommen tilbake, {userProfile?.displayName}! Her er oversikten over systemet.
          </p>
        </div>
        <div className="mt-4 lg:mt-0 flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value as any)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="today">I dag</option>
              <option value="week">Denne uken</option>
              <option value="month">Denne måneden</option>
            </select>
            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">Alle avdelinger</option>
              {departments.map(dept => (
                <option key={dept.id} value={dept.id}>{dept.name}</option>
              ))}
            </select>
          </div>
          <button
            onClick={loadData}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Oppdater
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white shadow-xl transform hover:scale-105 transition-all duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm font-medium">Totale ansatte</p>
              <p className="text-3xl font-bold">{stats.totalEmployees}</p>
              <div className="flex items-center mt-2">
                {stats.employeeTrend > 0 ? (
                  <ArrowUpRight className="h-4 w-4 text-green-300 mr-1" />
                ) : (
                  <ArrowDownRight className="h-4 w-4 text-red-300 mr-1" />
                )}
                <span className={`text-sm ${stats.employeeTrend > 0 ? 'text-green-300' : 'text-red-300'}`}>
                  {Math.abs(stats.employeeTrend)}%
                </span>
                <span className="text-blue-200 text-sm ml-1">fra forrige periode</span>
              </div>
            </div>
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <Users className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-6 text-white shadow-xl transform hover:scale-105 transition-all duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm font-medium">Aktive ansatte</p>
              <p className="text-3xl font-bold">{stats.activeEmployees}</p>
              <div className="flex items-center mt-2">
                <CheckCircle className="h-4 w-4 text-green-300 mr-1" />
                <span className="text-green-300 text-sm">
                  {Math.round((stats.activeEmployees / stats.totalEmployees) * 100)}% oppmøte
                </span>
              </div>
            </div>
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <Activity className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl p-6 text-white shadow-xl transform hover:scale-105 transition-all duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100 text-sm font-medium">Ventende søknader</p>
              <p className="text-3xl font-bold">{stats.pendingAbsences}</p>
              <div className="flex items-center mt-2">
                {stats.absenceTrend > 0 ? (
                  <ArrowUpRight className="h-4 w-4 text-orange-300 mr-1" />
                ) : (
                  <ArrowDownRight className="h-4 w-4 text-green-300 mr-1" />
                )}
                <span className={`text-sm ${stats.absenceTrend > 0 ? 'text-orange-300' : 'text-green-300'}`}>
                  {Math.abs(stats.absenceTrend)}%
                </span>
                <span className="text-orange-200 text-sm ml-1">fra forrige periode</span>
              </div>
            </div>
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <Calendar className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-2xl p-6 text-white shadow-xl transform hover:scale-105 transition-all duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-red-100 text-sm font-medium">Åpne avvik</p>
              <p className="text-3xl font-bold">{stats.activeDeviations}</p>
              <div className="flex items-center mt-2">
                {stats.deviationTrend > 0 ? (
                  <ArrowUpRight className="h-4 w-4 text-red-300 mr-1" />
                ) : (
                  <ArrowDownRight className="h-4 w-4 text-green-300 mr-1" />
                )}
                <span className={`text-sm ${stats.deviationTrend > 0 ? 'text-red-300' : 'text-green-300'}`}>
                  {Math.abs(stats.deviationTrend)}%
                </span>
                <span className="text-red-200 text-sm ml-1">fra forrige periode</span>
              </div>
            </div>
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <AlertTriangle className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Charts and Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Department Performance */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Avdelingsytelse</h3>
            <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
              Se alle
            </button>
          </div>
          <div className="space-y-4">
            {departmentStats.slice(0, 5).map((dept) => (
              <div key={dept.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                    <Building className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{dept.name}</p>
                    <p className="text-sm text-gray-500">{dept.employeeCount} ansatte</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900">{dept.efficiency}%</p>
                  <p className="text-sm text-gray-500">Effektivitet</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Siste aktivitet</h3>
            <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
              Se alle
            </button>
          </div>
          <div className="space-y-4">
            {recentActivity.map((activity) => (
              <div key={activity.id} className="flex items-start space-x-3 p-3 hover:bg-gray-50 rounded-lg transition-colors">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  activity.type === 'absence' ? 'bg-orange-100' : 'bg-red-100'
                }`}>
                  {activity.type === 'absence' ? (
                    <Calendar className="h-4 w-4 text-orange-600" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                  <p className="text-sm text-gray-500">{activity.description}</p>
                  <p className="text-xs text-gray-400 mt-1">{activity.time}</p>
                </div>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  activity.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                  activity.status === 'approved' ? 'bg-green-100 text-green-800' :
                  activity.status === 'rejected' ? 'bg-red-100 text-red-800' :
                  activity.status === 'open' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  {activity.status === 'pending' ? 'Venter' :
                   activity.status === 'approved' ? 'Godkjent' :
                   activity.status === 'rejected' ? 'Avvist' :
                   activity.status === 'open' ? 'Åpen' : activity.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Performers */}
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Topp ytere</h3>
          <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
            Se alle
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {topPerformers.map((performer, index) => (
            <div key={performer.id} className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6 border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                    <UserIcon className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{performer.displayName}</p>
                    <p className="text-sm text-gray-500">{departments.find(d => d.id === performer.departmentId)?.name}</p>
                  </div>
                </div>
                {index === 0 && (
                  <div className="w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center">
                    <Star className="h-4 w-4 text-white" />
                  </div>
                )}
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Ytelse</span>
                  <span className="font-semibold text-gray-900">{performer.performance}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${performer.performance}%` }}
                  ></div>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">Effektivitet</p>
                    <p className="font-medium text-gray-900">{performer.efficiency}%</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Oppmøte</p>
                    <p className="font-medium text-gray-900">{performer.attendance}%</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white text-center hover:transform hover:scale-105 transition-all duration-200 cursor-pointer">
          <Users className="h-8 w-8 mx-auto mb-3" />
          <h4 className="font-semibold mb-1">Legg til ansatt</h4>
          <p className="text-blue-100 text-sm">Registrer ny bruker</p>
        </div>
        
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white text-center hover:transform hover:scale-105 transition-all duration-200 cursor-pointer">
          <Calendar className="h-8 w-8 mx-auto mb-3" />
          <h4 className="font-semibold mb-1">Planlegg skift</h4>
          <p className="text-green-100 text-sm">Opprett ny skiftplan</p>
        </div>
        
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white text-center hover:transform hover:scale-105 transition-all duration-200 cursor-pointer">
          <FileText className="h-8 w-8 mx-auto mb-3" />
          <h4 className="font-semibold mb-1">Last opp dokument</h4>
          <p className="text-purple-100 text-sm">Del nytt dokument</p>
        </div>
        
        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-6 text-white text-center hover:transform hover:scale-105 transition-all duration-200 cursor-pointer">
          <BarChart3 className="h-8 w-8 mx-auto mb-3" />
          <h4 className="font-semibold mb-1">Generer rapport</h4>
          <p className="text-orange-100 text-sm">Opprett ny rapport</p>
        </div>
      </div>
    </div>
  );
} 