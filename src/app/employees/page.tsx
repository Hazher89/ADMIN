'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { userService, departmentService } from '@/lib/firebase-services';
import { User, Department, UserRole } from '@/types';
import {
  Users,
  Plus,
  Search,
  Filter,
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  Mail,
  Phone,
  Building,
  Calendar,
  Clock,
  Star,
  Crown,
  User as UserIcon,
  MapPin,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle,
  XCircle,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Activity,
  Target,
  Award,
  Zap,
  BarChart3,
  PieChart,
  LineChart,
  Download,
  RefreshCw,
  Bell,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  ThumbsUp,
  ThumbsDown,
  Send,
  Settings,
  Shield,
  Database,
  Globe,
  Palette,
  Upload,
  Save,
  Camera,
  EyeOff,
  Key,
  Lock,
  Unlock,
  Wifi,
  Battery,
  Signal,
  FileText,
  MessageSquare,
  HelpCircle,
  LogOut,
  Menu,
  X,
  ChevronDown as ChevronDownIcon,
  Star as StarIcon,
  ThumbsUp as ThumbsUpIcon,
  ThumbsDown as ThumbsDownIcon,
  Send as SendIcon,
  Clock as ClockIcon,
  Shield as ShieldIcon,
  Calendar as CalendarIcon,
  AlertTriangle as AlertTriangleIcon,
  CheckCircle as CheckCircleIcon,
  Info,
  Zap as ZapIcon,
  Target as TargetIcon,
  Award as AwardIcon,
  Users as UsersIcon,
  Building as BuildingIcon,
  Search as SearchIcon,
  Download as DownloadIcon,
  Play,
  Book,
  Video,
  MessageCircle,
  ChevronRight as ChevronRightIcon,
  ExternalLink as ExternalLinkIcon,
  Star as StarIcon2,
  ThumbsUp as ThumbsUpIcon2,
  ThumbsDown as ThumbsDownIcon2,
  Send as SendIcon2,
  User as UserIcon2,
  Settings as SettingsIcon,
  Shield as ShieldIcon2,
  Calendar as CalendarIcon2,
  AlertTriangle as AlertTriangleIcon2,
  CheckCircle as CheckCircleIcon2,
  Info as InfoIcon,
  Zap as ZapIcon2,
  Target as TargetIcon2,
  Award as AwardIcon2,
  Users as UsersIcon2,
  Building as BuildingIcon2,
  XCircle as XCircleIcon,
  Search as SearchIcon2,
  Bell as BellIcon,
  Menu as MenuIcon,
  X as XIcon,
  LogOut as LogOutIcon,
  ChevronDown as ChevronDownIcon2,
  Activity as ActivityIcon,
  BarChart3 as BarChart3Icon,
  PieChart as PieChartIcon,
  LineChart as LineChartIcon,
  Eye as EyeIcon,
  Plus as PlusIcon,
  Filter as FilterIcon,
  Search as SearchIcon3,
  Download as DownloadIcon2,
  RefreshCw as RefreshCwIcon,
  Bell as BellIcon2,
  Star as StarIcon3,
  Crown as CrownIcon,
  User as UserIcon3,
  MapPin as MapPinIcon,
  Phone as PhoneIcon,
  Mail as MailIcon,
  ArrowUpRight as ArrowUpRightIcon,
  ArrowDownRight as ArrowDownRightIcon,
  Minus,
  DollarSign,
  CalendarDays,
  FileText as FileTextIcon,
  MessageSquare as MessageSquareIcon,
  Settings as SettingsIcon2,
  HelpCircle as HelpCircleIcon,
  Shield as ShieldIcon3,
  Database as DatabaseIcon,
  Globe as GlobeIcon,
  Palette as PaletteIcon,
  Download as DownloadIcon3,
  Upload as UploadIcon,
  Trash2 as Trash2Icon,
  Edit as EditIcon,
  Save as SaveIcon,
  Camera as CameraIcon,
  Eye as EyeIcon2,
  EyeOff as EyeOffIcon,
  Key as KeyIcon,
  Lock as LockIcon,
  Unlock as UnlockIcon,
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

export default function EmployeesPage() {
  const { userProfile, isAdmin, isDepartmentLeader } = useAuth();
  const [employees, setEmployees] = useState<User[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [selectedRole, setSelectedRole] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const deps = await departmentService.getAllDepartments();
      setDepartments(deps);

      let users: User[] = [];
      if (isAdmin) {
        users = await userService.getUsersByRole(UserRole.EMPLOYEE);
        const leaders = await userService.getUsersByRole(UserRole.DEPARTMENT_LEADER);
        const admins = await userService.getUsersByRole(UserRole.ADMIN);
        users = [...users, ...leaders, ...admins];
      } else if (isDepartmentLeader && userProfile?.departmentId) {
        users = await userService.getUsersByDepartment(userProfile.departmentId);
      }
      setEmployees(users);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Kunne ikke laste data');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEmployee = async (employeeId: string) => {
    if (!confirm('Er du sikker på at du vil deaktivere denne brukeren?')) {
      return;
    }

    try {
      await userService.deactivateUser(employeeId);
      setEmployees(employees.filter(emp => emp.id !== employeeId));
      toast.success('Bruker deaktivert');
    } catch (error) {
      console.error('Error deactivating user:', error);
      toast.error('Kunne ikke deaktivere bruker');
    }
  };

  const getFilteredEmployees = () => {
    return employees.filter(employee => {
      const matchesSearch = employee.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           employee.email?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesDepartment = selectedDepartment === 'all' || employee.departmentId === selectedDepartment;
      const matchesRole = selectedRole === 'all' || employee.role === selectedRole;
      const matchesStatus = selectedStatus === 'all' || employee.status === selectedStatus;

      return matchesSearch && matchesDepartment && matchesRole && matchesStatus;
    });
  };

  const getRoleBadge = (role: string) => {
    const badges = {
      [UserRole.ADMIN]: { color: 'bg-red-100 text-red-800', icon: Crown, text: 'Administrator' },
      [UserRole.DEPARTMENT_LEADER]: { color: 'bg-blue-100 text-blue-800', icon: Star, text: 'Avdelingsleder' },
      [UserRole.EMPLOYEE]: { color: 'bg-green-100 text-green-800', icon: UserIcon, text: 'Ansatt' }
    };
    const badge = badges[role as UserRole] || badges[UserRole.EMPLOYEE];
    const Icon = badge.icon;
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badge.color}`}>
        <Icon className="h-3 w-3 mr-1" />
        {badge.text}
      </span>
    );
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      'active': { color: 'bg-green-100 text-green-800', icon: CheckCircle, text: 'Aktiv' },
      'inactive': { color: 'bg-red-100 text-red-800', icon: XCircle, text: 'Inaktiv' },
      'pending': { color: 'bg-yellow-100 text-yellow-800', icon: AlertTriangle, text: 'Venter' }
    };
    const badge = badges[status as keyof typeof badges] || badges.active;
    const Icon = badge.icon;
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badge.color}`}>
        <Icon className="h-3 w-3 mr-1" />
        {badge.text}
      </span>
    );
  };

  const getDepartmentName = (departmentId: string) => {
    const department = departments.find(d => d.id === departmentId);
    return department?.name || 'Ukjent avdeling';
  };

  const getStats = () => {
    const totalEmployees = employees.length;
    const activeEmployees = employees.filter(emp => emp.status === 'active').length;
    const departmentLeaders = employees.filter(emp => emp.role === UserRole.DEPARTMENT_LEADER).length;
    const admins = employees.filter(emp => emp.role === UserRole.ADMIN).length;

    return {
      totalEmployees,
      activeEmployees,
      departmentLeaders,
      admins,
      inactiveEmployees: totalEmployees - activeEmployees
    };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const stats = getStats();
  const filteredEmployees = getFilteredEmployees();

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Ansatte</h1>
          <p className="mt-2 text-lg text-gray-600">
            Administrer ansatte og deres roller i systemet
          </p>
        </div>
        <div className="mt-4 lg:mt-0 flex items-center space-x-4">
          <button
            onClick={loadData}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Oppdater
          </button>
          {(isAdmin || isDepartmentLeader) && (
            <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 transform hover:scale-105">
              <Plus className="h-4 w-4 mr-2" />
              Legg til ansatt
            </button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white shadow-xl transform hover:scale-105 transition-all duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm font-medium">Totale ansatte</p>
              <p className="text-3xl font-bold">{stats.totalEmployees}</p>
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
            </div>
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <CheckCircle className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-6 text-white shadow-xl transform hover:scale-105 transition-all duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm font-medium">Avdelingsledere</p>
              <p className="text-3xl font-bold">{stats.departmentLeaders}</p>
            </div>
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <Star className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-2xl p-6 text-white shadow-xl transform hover:scale-105 transition-all duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-red-100 text-sm font-medium">Administratorer</p>
              <p className="text-3xl font-bold">{stats.admins}</p>
            </div>
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <Crown className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl p-6 text-white shadow-xl transform hover:scale-105 transition-all duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100 text-sm font-medium">Inaktive</p>
              <p className="text-3xl font-bold">{stats.inactiveEmployees}</p>
            </div>
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <XCircle className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Søk etter navn eller e-post..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm transition-all duration-200"
            />
          </div>

          <select
            value={selectedDepartment}
            onChange={(e) => setSelectedDepartment(e.target.value)}
            className="block w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
          >
            <option value="all">Alle avdelinger</option>
            {departments.map(dept => (
              <option key={dept.id} value={dept.id}>{dept.name}</option>
            ))}
          </select>

          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            className="block w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
          >
            <option value="all">Alle roller</option>
            <option value={UserRole.ADMIN}>Administrator</option>
            <option value={UserRole.DEPARTMENT_LEADER}>Avdelingsleder</option>
            <option value={UserRole.EMPLOYEE}>Ansatt</option>
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="block w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
          >
            <option value="all">Alle statuser</option>
            <option value="active">Aktiv</option>
            <option value="inactive">Inaktiv</option>
            <option value="pending">Venter</option>
          </select>
        </div>
      </div>

      {/* Employees Table */}
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ansatt
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rolle
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Avdeling
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Kontakt
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Handlinger
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredEmployees.map((employee) => (
                <tr key={employee.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                        <UserIcon className="h-5 w-5 text-white" />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {employee.displayName}
                        </div>
                        <div className="text-sm text-gray-500">
                          {employee.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getRoleBadge(employee.role)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {getDepartmentName(employee.departmentId || '')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(employee.status || 'active')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex items-center space-x-2">
                      <button className="text-blue-600 hover:text-blue-900 transition-colors">
                        <Mail className="h-4 w-4" />
                      </button>
                      <button className="text-green-600 hover:text-green-900 transition-colors">
                        <Phone className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        className="text-blue-600 hover:text-blue-900 transition-colors"
                        title="Se detaljer"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        className="text-indigo-600 hover:text-indigo-900 transition-colors"
                        title="Rediger"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      {(isAdmin || employee.role !== UserRole.ADMIN) && (
                        <button
                          onClick={() => handleDeleteEmployee(employee.id)}
                          className="text-red-600 hover:text-red-900 transition-colors"
                          title="Deaktiver"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredEmployees.length === 0 && (
          <div className="text-center py-12">
            <Users className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Ingen ansatte funnet</h3>
            <p className="mt-1 text-sm text-gray-500">
              Prøv å endre søkekriteriene eller legg til en ny ansatt.
            </p>
          </div>
        )}
      </div>
    </div>
  );
} 