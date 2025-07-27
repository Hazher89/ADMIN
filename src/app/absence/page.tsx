'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  Calendar,
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  User,
  Building,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  BarChart3,
  PieChart,
  LineChart,
  Bell,
  RefreshCw,
  Download,
  Upload,
  Settings,
  HelpCircle,
  LogOut,
  ChevronRight,
  Star,
  Award,
  Target,
  Zap,
  Database,
  Globe,
  Palette,
  Crown,
  DollarSign,
  Minus,
  ArrowUp,
  ArrowDown,
  Circle,
  Square,
  Triangle,
  ChevronDown,
  ChevronUp,
  SortAsc,
  SortDesc,
  FileText,
  MessageSquare
} from 'lucide-react';

export default function AbsencePage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');

  // Mock data
  const absences = [
    {
      id: 1,
      employeeName: 'Ola Nordmann',
      employeeEmail: 'ola.nordmann@driftpro.no',
      department: 'IT',
      type: 'Sykdom',
      startDate: '2024-01-25',
      endDate: '2024-01-27',
      days: 3,
      status: 'pending',
      reason: 'Forkjølelse og feber',
      createdAt: '2024-01-24 14:30',
      approvedBy: null,
      approvedAt: null
    },
    {
      id: 2,
      employeeName: 'Kari Hansen',
      employeeEmail: 'kari.hansen@driftpro.no',
      department: 'HR',
      type: 'Egenmelding',
      startDate: '2024-01-26',
      endDate: '2024-01-26',
      days: 1,
      status: 'approved',
      reason: 'Hodepine og kvalme',
      createdAt: '2024-01-25 09:15',
      approvedBy: 'Lisa Berg',
      approvedAt: '2024-01-25 10:30'
    },
    {
      id: 3,
      employeeName: 'Per Olsen',
      employeeEmail: 'per.olsen@driftpro.no',
      department: 'Produksjon',
      type: 'Sykdom',
      startDate: '2024-01-23',
      endDate: '2024-01-25',
      days: 3,
      status: 'rejected',
      reason: 'Ryggsmerter',
      createdAt: '2024-01-22 16:45',
      approvedBy: 'Tom Jensen',
      approvedAt: '2024-01-23 08:20'
    },
    {
      id: 4,
      employeeName: 'Lisa Berg',
      employeeEmail: 'lisa.berg@driftpro.no',
      department: 'Logistikk',
      type: 'Egenmelding',
      startDate: '2024-01-28',
      endDate: '2024-01-28',
      days: 1,
      status: 'pending',
      reason: 'Magesmerter',
      createdAt: '2024-01-27 11:20',
      approvedBy: null,
      approvedAt: null
    },
    {
      id: 5,
      employeeName: 'Tom Jensen',
      employeeEmail: 'tom.jensen@driftpro.no',
      department: 'Økonomi',
      type: 'Sykdom',
      startDate: '2024-01-20',
      endDate: '2024-01-22',
      days: 3,
      status: 'approved',
      reason: 'Influensa',
      createdAt: '2024-01-19 13:10',
      approvedBy: 'Kari Hansen',
      approvedAt: '2024-01-19 15:45'
    }
  ];

  const departments = ['IT', 'HR', 'Produksjon', 'Logistikk', 'Økonomi'];
  const types = ['Sykdom', 'Egenmelding', 'Permisjon', 'Andre'];
  const statuses = ['pending', 'approved', 'rejected'];

  const stats = [
    {
      title: 'Totale fravær',
      value: absences.length.toString(),
      change: '+2',
      changeType: 'positive',
      icon: Calendar,
      color: 'blue'
    },
    {
      title: 'Ventende søknader',
      value: absences.filter(abs => abs.status === 'pending').length.toString(),
      change: '+1',
      changeType: 'positive',
      icon: Clock,
      color: 'yellow'
    },
    {
      title: 'Godkjente søknader',
      value: absences.filter(abs => abs.status === 'approved').length.toString(),
      change: '+3',
      changeType: 'positive',
      icon: CheckCircle,
      color: 'green'
    },
    {
      title: 'Avviste søknader',
      value: absences.filter(abs => abs.status === 'rejected').length.toString(),
      change: '-1',
      changeType: 'negative',
      icon: XCircle,
      color: 'red'
    }
  ];

  const filteredAbsences = absences.filter(absence => {
    const matchesSearch = absence.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         absence.employeeEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         absence.reason.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = selectedStatus === 'all' || absence.status === selectedStatus;
    const matchesDepartment = selectedDepartment === 'all' || absence.department === selectedDepartment;
    const matchesType = selectedType === 'all' || absence.type === selectedType;
    
    return matchesSearch && matchesStatus && matchesDepartment && matchesType;
  });

  const sortedAbsences = [...filteredAbsences].sort((a, b) => {
    let aValue = a[sortBy as keyof typeof a];
    let bValue = b[sortBy as keyof typeof b];
    
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      aValue = aValue.toLowerCase();
      bValue = bValue.toLowerCase();
    }
    
    if (sortOrder === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
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
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'Sykdom':
        return 'bg-red-100 text-red-800';
      case 'Egenmelding':
        return 'bg-blue-100 text-blue-800';
      case 'Permisjon':
        return 'bg-purple-100 text-purple-800';
      case 'Andre':
        return 'bg-gray-100 text-gray-800';
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
                <Calendar className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Fravær</h1>
                <p className="text-sm text-gray-500">Administrer fraværsøknader</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <button className="p-2 text-gray-600 hover:text-gray-900 transition-colors">
                <RefreshCw className="h-5 w-5" />
              </button>
              <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition-colors">
                <Plus className="h-4 w-4 mr-2" />
                Ny fraværsøknad
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => {
            const IconComponent = stat.icon;
            return (
              <div key={index} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
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
                      <span className="text-sm text-gray-500 ml-1">fra forrige uke</span>
                    </div>
                  </div>
                  <div className={`w-12 h-12 bg-gradient-to-r from-${stat.color}-500 to-${stat.color}-600 rounded-xl flex items-center justify-center`}>
                    <IconComponent className="h-6 w-6 text-white" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Søk etter ansatt, årsak..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            
            <div className="flex flex-wrap gap-4">
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">Alle statuser</option>
                {statuses.map(status => (
                  <option key={status} value={status}>
                    {status === 'pending' ? 'Venter' : status === 'approved' ? 'Godkjent' : 'Avvist'}
                  </option>
                ))}
              </select>
              
              <select
                value={selectedDepartment}
                onChange={(e) => setSelectedDepartment(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">Alle avdelinger</option>
                {departments.map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
              
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">Alle typer</option>
                {types.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Absences Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => handleSort('employeeName')}>
                    <div className="flex items-center space-x-1">
                      <span>Ansatt</span>
                      {sortBy === 'employeeName' && (
                        sortOrder === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
                      )}
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => handleSort('type')}>
                    <div className="flex items-center space-x-1">
                      <span>Type</span>
                      {sortBy === 'type' && (
                        sortOrder === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
                      )}
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => handleSort('startDate')}>
                    <div className="flex items-center space-x-1">
                      <span>Periode</span>
                      {sortBy === 'startDate' && (
                        sortOrder === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
                      )}
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => handleSort('days')}>
                    <div className="flex items-center space-x-1">
                      <span>Dager</span>
                      {sortBy === 'days' && (
                        sortOrder === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
                      )}
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => handleSort('status')}>
                    <div className="flex items-center space-x-1">
                      <span>Status</span>
                      {sortBy === 'status' && (
                        sortOrder === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
                      )}
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Årsak
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => handleSort('createdAt')}>
                    <div className="flex items-center space-x-1">
                      <span>Søknadsdato</span>
                      {sortBy === 'createdAt' && (
                        sortOrder === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
                      )}
                    </div>
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Handlinger
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sortedAbsences.map((absence) => (
                  <tr key={absence.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center text-white font-medium">
                          {absence.employeeName.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{absence.employeeName}</div>
                          <div className="text-sm text-gray-500">{absence.employeeEmail}</div>
                          <div className="text-sm text-gray-500">{absence.department}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTypeColor(absence.type)}`}>
                        {absence.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div>
                        <div>{absence.startDate}</div>
                        <div className="text-gray-500">til {absence.endDate}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {absence.days} dager
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(absence.status)}`}>
                        {absence.status === 'pending' ? 'Venter' : absence.status === 'approved' ? 'Godkjent' : 'Avvist'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                      {absence.reason}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {absence.createdAt}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button className="text-blue-600 hover:text-blue-900 transition-colors">
                          <Eye className="h-4 w-4" />
                        </button>
                        <button className="text-gray-600 hover:text-gray-900 transition-colors">
                          <Edit className="h-4 w-4" />
                        </button>
                        <button className="text-red-600 hover:text-red-900 transition-colors">
                          <Trash2 className="h-4 w-4" />
                        </button>
                        <button className="text-gray-600 hover:text-gray-900 transition-colors">
                          <MoreHorizontal className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mt-8">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Viser <span className="font-medium">{sortedAbsences.length}</span> av <span className="font-medium">{absences.length}</span> fraværsøknader
            </div>
            <div className="flex items-center space-x-2">
              <button className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                Forrige
              </button>
              <button className="px-3 py-2 text-sm font-medium text-white bg-blue-600 border border-blue-600 rounded-lg">
                1
              </button>
              <button className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                Neste
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 