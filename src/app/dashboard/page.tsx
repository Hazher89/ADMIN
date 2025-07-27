'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  Users,
  Clock,
  Calendar,
  FileText,
  AlertTriangle,
  MessageSquare,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  Eye,
  CheckCircle,
  XCircle,
  Clock as ClockIcon,
  User,
  Building,
  Activity,
  BarChart3,
  PieChart,
  LineChart,
  Bell,
  Search,
  Filter,
  RefreshCw,
  Download,
  Upload,
  Edit,
  Trash2,
  Settings,
  HelpCircle,
  LogOut,
  ChevronRight,
  Star,
  Award,
  Target,
  Zap,
  Shield,
  Database,
  Globe,
  Palette,
  Crown,
  MapPin,
  Phone,
  Mail,
  CalendarDays,
  DollarSign,
  Minus,
  ArrowUp,
  ArrowDown,
  Circle,
  Square,
  Triangle
} from 'lucide-react';

export default function DashboardPage() {
  const [selectedPeriod, setSelectedPeriod] = useState('today');

  // Mock data
  const stats = [
    {
      title: 'Aktive ansatte',
      value: '247',
      change: '+12',
      changeType: 'positive',
      icon: Users,
      color: 'blue',
      link: '/employees'
    },
    {
      title: 'Timer denne uken',
      value: '1,847',
      change: '+156',
      changeType: 'positive',
      icon: Clock,
      color: 'green',
      link: '/timeclock'
    },
    {
      title: 'Åpne avvik',
      value: '23',
      change: '-5',
      changeType: 'negative',
      icon: AlertTriangle,
      color: 'red',
      link: '/deviations'
    },
    {
      title: 'Aktive skift',
      value: '89',
      change: '+8',
      changeType: 'positive',
      icon: Calendar,
      color: 'purple',
      link: '/shifts'
    },
    {
      title: 'Dokumenter',
      value: '1,234',
      change: '+45',
      changeType: 'positive',
      icon: FileText,
      color: 'yellow',
      link: '/documents'
    },
    {
      title: 'Meldinger',
      value: '156',
      change: '+23',
      changeType: 'positive',
      icon: MessageSquare,
      color: 'emerald',
      link: '/chat'
    }
  ];

  const recentActivities = [
    {
      id: 1,
      type: 'absence',
      user: 'Ola Nordmann',
      action: 'søkte om fravær',
      time: '2 minutter siden',
      status: 'pending',
      department: 'IT'
    },
    {
      id: 2,
      type: 'vacation',
      user: 'Kari Hansen',
      action: 'godkjente feriesøknad',
      time: '15 minutter siden',
      status: 'approved',
      department: 'HR'
    },
    {
      id: 3,
      type: 'deviation',
      user: 'Per Olsen',
      action: 'rapporterte avvik',
      time: '1 time siden',
      status: 'new',
      department: 'Produksjon'
    },
    {
      id: 4,
      type: 'shift',
      user: 'Lisa Berg',
      action: 'opprettet nytt skift',
      time: '2 timer siden',
      status: 'completed',
      department: 'Logistikk'
    },
    {
      id: 5,
      type: 'document',
      user: 'Tom Jensen',
      action: 'lastet opp dokument',
      time: '3 timer siden',
      status: 'completed',
      department: 'Økonomi'
    }
  ];

  const topPerformers = [
    {
      name: 'Ola Nordmann',
      department: 'IT',
      hours: 42.5,
      efficiency: 98,
      avatar: 'ON'
    },
    {
      name: 'Kari Hansen',
      department: 'HR',
      hours: 40.0,
      efficiency: 95,
      avatar: 'KH'
    },
    {
      name: 'Per Olsen',
      department: 'Produksjon',
      hours: 45.2,
      efficiency: 92,
      avatar: 'PO'
    }
  ];

  const departmentPerformance = [
    { name: 'IT', efficiency: 95, hours: 168, employees: 8 },
    { name: 'HR', efficiency: 88, hours: 160, employees: 5 },
    { name: 'Produksjon', efficiency: 92, hours: 320, employees: 12 },
    { name: 'Logistikk', efficiency: 85, hours: 144, employees: 6 },
    { name: 'Økonomi', efficiency: 90, hours: 120, employees: 4 }
  ];

  const quickActions = [
    { title: 'Legg til ansatt', icon: Plus, link: '/employees', color: 'blue' },
    { title: 'Opprett skift', icon: Calendar, link: '/shifts', color: 'purple' },
    { title: 'Rapporter avvik', icon: AlertTriangle, link: '/deviations', color: 'red' },
    { title: 'Del dokument', icon: Upload, link: '/documents', color: 'yellow' },
    { title: 'Send melding', icon: MessageSquare, link: '/chat', color: 'emerald' },
    { title: 'Generer rapport', icon: BarChart3, link: '/reports', color: 'indigo' }
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <ClockIcon className="h-4 w-4 text-yellow-500" />;
      case 'approved':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'new':
        return <Circle className="h-4 w-4 text-blue-500" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      default:
        return <Circle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'new':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-lg border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                <Zap className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Dashboard</h1>
                <p className="text-sm text-gray-500">DriftPro Administrasjon</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Bell className="h-6 w-6 text-gray-600 cursor-pointer hover:text-gray-900 transition-colors" />
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></div>
              </div>
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                A
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Period Selector */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Oversikt</h2>
            <p className="text-gray-600">Se oversikt over bedriftens aktiviteter</p>
          </div>
          
          <div className="flex items-center space-x-2">
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="today">I dag</option>
              <option value="week">Denne uken</option>
              <option value="month">Denne måneden</option>
              <option value="quarter">Dette kvartalet</option>
            </select>
            <button className="p-2 text-gray-600 hover:text-gray-900 transition-colors">
              <RefreshCw className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {stats.map((stat, index) => {
            const IconComponent = stat.icon;
            return (
              <Link key={index} href={stat.link}>
                <div className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-200 transform hover:scale-105 cursor-pointer border border-gray-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 mb-1">{stat.title}</p>
                      <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                      <div className="flex items-center mt-2">
                        {stat.changeType === 'positive' ? (
                          <ArrowUpRight className="h-4 w-4 text-green-500 mr-1" />
                        ) : (
                          <ArrowDownRight className="h-4 w-4 text-red-500 mr-1" />
                        )}
                        <span className={`text-sm font-medium ${
                          stat.changeType === 'positive' ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {stat.change}
                        </span>
                        <span className="text-sm text-gray-500 ml-1">fra forrige periode</span>
                      </div>
                    </div>
                    <div className={`w-12 h-12 bg-gradient-to-r from-${stat.color}-500 to-${stat.color}-600 rounded-xl flex items-center justify-center`}>
                      <IconComponent className="h-6 w-6 text-white" />
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Activities */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Siste aktiviteter</h3>
                <Link href="/activities" className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                  Se alle
                </Link>
              </div>
              
              <div className="space-y-4">
                {recentActivities.map((activity) => (
                  <div key={activity.id} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                    <div className="flex-shrink-0">
                      {getStatusIcon(activity.status)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">
                        <span className="font-semibold">{activity.user}</span> {activity.action}
                      </p>
                      <p className="text-sm text-gray-500">{activity.department} • {activity.time}</p>
                    </div>
                    <div className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(activity.status)}`}>
                      {activity.status}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Hurtigvalg</h3>
              
              <div className="space-y-3">
                {quickActions.map((action, index) => {
                  const IconComponent = action.icon;
                  return (
                    <Link key={index} href={action.link}>
                      <div className="flex items-center space-x-3 p-3 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer">
                        <div className={`w-10 h-10 bg-gradient-to-r from-${action.color}-500 to-${action.color}-600 rounded-lg flex items-center justify-center`}>
                          <IconComponent className="h-5 w-5 text-white" />
                        </div>
                        <span className="text-sm font-medium text-gray-900">{action.title}</span>
                        <ChevronRight className="h-4 w-4 text-gray-400 ml-auto" />
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
          {/* Top Performers */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Topp prestasjoner</h3>
            
            <div className="space-y-4">
              {topPerformers.map((performer, index) => (
                <div key={index} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-xl">
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center text-white font-medium">
                    {performer.avatar}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{performer.name}</p>
                    <p className="text-sm text-gray-500">{performer.department}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-gray-900">{performer.hours}h</p>
                    <p className="text-sm text-green-600">{performer.efficiency}% effektivitet</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Department Performance */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Avdelingsprestasjoner</h3>
            
            <div className="space-y-4">
              {departmentPerformance.map((dept, index) => (
                <div key={index} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-xl">
                  <div className="w-10 h-10 bg-gradient-to-r from-green-600 to-blue-600 rounded-lg flex items-center justify-center">
                    <Building className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{dept.name}</p>
                    <p className="text-sm text-gray-500">{dept.employees} ansatte</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-gray-900">{dept.efficiency}%</p>
                    <p className="text-sm text-gray-500">{dept.hours}h totalt</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 