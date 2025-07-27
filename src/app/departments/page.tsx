'use client';

import React, { useState, useEffect } from 'react';
import { 
  Building,
  Users,
  UserPlus,
  Edit,
  Trash2,
  Plus,
  Search,
  Filter,
  MoreVertical,
  Crown,
  Star,
  MapPin,
  Phone,
  Mail,
  Calendar,
  Clock,
  TrendingUp,
  TrendingDown,
  BarChart3,
  PieChart,
  Eye,
  Settings,
  Download,
  Upload,
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Info,
  ChevronDown,
  ChevronRight,
  ArrowRight,
  ArrowLeft,
  Home,
  Briefcase,
  Target,
  Award,
  Zap,
  Shield,
  Key,
  Lock,
  Unlock,
  Wifi,
  Battery,
  Signal
} from 'lucide-react';

export default function DepartmentsPage() {
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState<any>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Mock departments data
  const mockDepartments = [
    {
      id: 'dept-1',
      name: 'Produksjon',
      description: 'Hovedproduksjonsavdeling for alle produkter',
      leader: {
        id: 'user-1',
        name: 'Ola Nordmann',
        email: 'ola.nordmann@bedrift.no',
        phone: '+47 123 45 678',
        avatar: null
      },
      employees: [
        { id: 'user-2', name: 'Kari Hansen', role: 'Ansatt', email: 'kari.hansen@bedrift.no' },
        { id: 'user-3', name: 'Per Olsen', role: 'Ansatt', email: 'per.olsen@bedrift.no' },
        { id: 'user-4', name: 'Nina Berg', role: 'Ansatt', email: 'nina.berg@bedrift.no' }
      ],
      totalEmployees: 15,
      activeEmployees: 14,
      location: 'Bygg A, 2. etasje',
      phone: '+47 123 45 679',
      email: 'produksjon@bedrift.no',
      budget: 2500000,
      projects: 8,
      createdAt: '2023-01-15T10:00:00Z',
      status: 'active'
    },
    {
      id: 'dept-2',
      name: 'Kvalitet',
      description: 'Kvalitetskontroll og testing av produkter',
      leader: {
        id: 'user-5',
        name: 'Eva Johansen',
        email: 'eva.johansen@bedrift.no',
        phone: '+47 123 45 680',
        avatar: null
      },
      employees: [
        { id: 'user-6', name: 'Tom Andersen', role: 'Ansatt', email: 'tom.andersen@bedrift.no' },
        { id: 'user-7', name: 'Lisa Sorensen', role: 'Ansatt', email: 'lisa.sorensen@bedrift.no' }
      ],
      totalEmployees: 8,
      activeEmployees: 8,
      location: 'Bygg B, 1. etasje',
      phone: '+47 123 45 681',
      email: 'kvalitet@bedrift.no',
      budget: 1200000,
      projects: 4,
      createdAt: '2023-02-20T10:00:00Z',
      status: 'active'
    },
    {
      id: 'dept-3',
      name: 'Logistikk',
      description: 'Lager og transportadministrasjon',
      leader: {
        id: 'user-8',
        name: 'Morten Larsen',
        email: 'morten.larsen@bedrift.no',
        phone: '+47 123 45 682',
        avatar: null
      },
      employees: [
        { id: 'user-9', name: 'Sofia Karlsen', role: 'Ansatt', email: 'sofia.karlsen@bedrift.no' },
        { id: 'user-10', name: 'Anders Nilsen', role: 'Ansatt', email: 'anders.nilsen@bedrift.no' },
        { id: 'user-11', name: 'Maria Pedersen', role: 'Ansatt', email: 'maria.pedersen@bedrift.no' }
      ],
      totalEmployees: 12,
      activeEmployees: 11,
      location: 'Lagerbygget',
      phone: '+47 123 45 683',
      email: 'logistikk@bedrift.no',
      budget: 1800000,
      projects: 6,
      createdAt: '2023-03-10T10:00:00Z',
      status: 'active'
    },
    {
      id: 'dept-4',
      name: 'IT & Systemer',
      description: 'IT-støtte og systemadministrasjon',
      leader: {
        id: 'user-12',
        name: 'Johan Berg',
        email: 'johan.berg@bedrift.no',
        phone: '+47 123 45 684',
        avatar: null
      },
      employees: [
        { id: 'user-13', name: 'Emma Vik', role: 'Ansatt', email: 'emma.vik@bedrift.no' },
        { id: 'user-14', name: 'Daniel Moen', role: 'Ansatt', email: 'daniel.moen@bedrift.no' }
      ],
      totalEmployees: 6,
      activeEmployees: 6,
      location: 'Hovedkontor, 3. etasje',
      phone: '+47 123 45 685',
      email: 'it@bedrift.no',
      budget: 900000,
      projects: 3,
      createdAt: '2023-04-05T10:00:00Z',
      status: 'active'
    }
  ];

  useEffect(() => {
    // Simulate loading
    setTimeout(() => {
      setDepartments(mockDepartments);
      setLoading(false);
    }, 1000);
  }, []);

  const filteredDepartments = departments.filter(dept =>
    dept.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    dept.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    dept.leader.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getDepartmentStats = () => {
    return {
      totalDepartments: departments.length,
      totalEmployees: departments.reduce((sum, dept) => sum + dept.totalEmployees, 0),
      activeEmployees: departments.reduce((sum, dept) => sum + dept.activeEmployees, 0),
      totalBudget: departments.reduce((sum, dept) => sum + dept.budget, 0)
    };
  };

  const stats = getDepartmentStats();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Avdelinger</h1>
          <p className="mt-1 text-sm text-gray-500">
            Administrer avdelinger og avdelingsledere
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
            className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            {viewMode === 'grid' ? (
              <>
                <BarChart3 className="h-4 w-4 mr-2" />
                Liste
              </>
            ) : (
              <>
                <Building className="h-4 w-4 mr-2" />
                Grid
              </>
            )}
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Plus className="h-4 w-4 mr-2" />
            Ny avdeling
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-600">Totale avdelinger</p>
              <p className="text-2xl font-bold text-blue-900">{stats.totalDepartments}</p>
            </div>
            <Building className="h-8 w-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-600">Totale ansatte</p>
              <p className="text-2xl font-bold text-green-900">{stats.totalEmployees}</p>
            </div>
            <Users className="h-8 w-8 text-green-600" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-purple-600">Aktive ansatte</p>
              <p className="text-2xl font-bold text-purple-900">{stats.activeEmployees}</p>
            </div>
            <CheckCircle className="h-8 w-8 text-purple-600" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-orange-600">Total budsjett</p>
              <p className="text-2xl font-bold text-orange-900">
                {new Intl.NumberFormat('no-NO', { style: 'currency', currency: 'NOK', minimumFractionDigits: 0 }).format(stats.totalBudget)}
              </p>
            </div>
            <TrendingUp className="h-8 w-8 text-orange-600" />
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white shadow-lg rounded-xl border border-gray-100 p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Søk etter avdeling, beskrivelse eller leder..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <button className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
              <Filter className="h-4 w-4 mr-2" />
              Filter
            </button>
            <button className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
              <Download className="h-4 w-4 mr-2" />
              Eksporter
            </button>
          </div>
        </div>
      </div>

      {/* Departments Grid/List */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDepartments.map((department) => (
            <div key={department.id} className="bg-white shadow-lg rounded-xl border border-gray-100 hover:shadow-xl transition-shadow duration-200">
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                      <Building className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{department.name}</h3>
                      <p className="text-sm text-gray-500">{department.location}</p>
                    </div>
                  </div>
                  <button className="text-gray-400 hover:text-gray-600">
                    <MoreVertical className="h-4 w-4" />
                  </button>
                </div>

                <p className="text-sm text-gray-600 mb-4">{department.description}</p>

                <div className="space-y-3 mb-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Avdelingsleder</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                        <Crown className="h-3 w-3 text-blue-600" />
                      </div>
                      <span className="text-sm font-medium text-gray-900">{department.leader.name}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Ansatte</span>
                    <span className="text-sm font-medium text-gray-900">
                      {department.activeEmployees}/{department.totalEmployees}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Prosjekter</span>
                    <span className="text-sm font-medium text-gray-900">{department.projects}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                  <div className="flex items-center space-x-4">
                    <button
                      onClick={() => {
                        setSelectedDepartment(department);
                        setShowEditModal(true);
                      }}
                      className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                    >
                      <Edit className="h-4 w-4 inline mr-1" />
                      Rediger
                    </button>
                    <button className="text-gray-600 hover:text-gray-700 text-sm font-medium">
                      <Eye className="h-4 w-4 inline mr-1" />
                      Se detaljer
                    </button>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      department.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {department.status === 'active' ? 'Aktiv' : 'Inaktiv'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white shadow-lg rounded-xl border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Avdeling
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Leder
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ansatte
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Prosjekter
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Handlinger
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredDepartments.map((department) => (
                  <tr key={department.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                          <Building className="h-5 w-5 text-white" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{department.name}</div>
                          <div className="text-sm text-gray-500">{department.location}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <Crown className="h-4 w-4 text-blue-600" />
                        </div>
                        <div className="ml-3">
                          <div className="text-sm font-medium text-gray-900">{department.leader.name}</div>
                          <div className="text-sm text-gray-500">{department.leader.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{department.activeEmployees}/{department.totalEmployees}</div>
                      <div className="text-sm text-gray-500">Aktive/Total</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{department.projects}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        department.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {department.status === 'active' ? 'Aktiv' : 'Inaktiv'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => {
                            setSelectedDepartment(department);
                            setShowEditModal(true);
                          }}
                          className="text-blue-600 hover:text-blue-700"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button className="text-gray-600 hover:text-gray-700">
                          <Eye className="h-4 w-4" />
                        </button>
                        <button className="text-red-600 hover:text-red-700">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add/Edit Modals would go here */}
      {/* These are placeholders for modal components */}
    </div>
  );
} 