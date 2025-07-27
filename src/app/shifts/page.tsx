'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { shiftService, userService, departmentService } from '@/lib/firebase-services';
import { Shift, ShiftPlan, ShiftStatus, User, Department } from '@/types';
import { 
  Calendar, 
  Search, 
  Filter, 
  Plus, 
  Eye, 
  Edit, 
  Trash2,
  Download,
  Mail,
  Clock,
  Users,
  Building,
  TrendingUp,
  TrendingDown,
  CheckCircle,
  XCircle,
  AlertCircle,
  CalendarDays,
  Clock as ClockIcon,
  MapPin,
  Phone,
  Send,
  Copy,
  Share2,
  Settings,
  BarChart3,
  PieChart,
  Target,
  Award,
  Zap
} from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function ShiftsPage() {
  const { userProfile, isAdmin, isDepartmentLeader } = useAuth();
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [shiftPlans, setShiftPlans] = useState<ShiftPlan[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedShift, setSelectedShift] = useState<Shift | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'calendar' | 'timeline'>('list');
  const [selectedPeriod, setSelectedPeriod] = useState<'day' | 'week' | 'month'>('week');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load departments
      const deps = await departmentService.getAllDepartments();
      setDepartments(deps);

      // Load users based on role
      let allUsers: User[] = [];
      if (isAdmin) {
        const employees = await userService.getUsersByRole('employee');
        const leaders = await userService.getUsersByRole('department_leader');
        allUsers = [...employees, ...leaders];
      } else if (isDepartmentLeader && userProfile?.departmentId) {
        allUsers = await userService.getUsersByDepartment(userProfile.departmentId);
      }
      setUsers(allUsers);

      // Load shifts and shift plans based on role
      let shiftData: Shift[] = [];
      let planData: ShiftPlan[] = [];
      
      if (isAdmin) {
        shiftData = await shiftService.getAllShifts();
        planData = await shiftService.getAllShiftPlans();
      } else if (isDepartmentLeader && userProfile?.departmentId) {
        shiftData = await shiftService.getShiftsByDepartment(userProfile.departmentId);
        planData = await shiftService.getShiftPlansByDepartment(userProfile.departmentId);
      } else {
        shiftData = await shiftService.getShiftsByEmployee(userProfile?.id || '');
        planData = await shiftService.getShiftPlansByEmployee(userProfile?.id || '');
      }

      setShifts(shiftData);
      setShiftPlans(planData);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Kunne ikke laste data');
    } finally {
      setLoading(false);
    }
  };

  const filteredShifts = shifts.filter(shift => {
    const matchesSearch = shift.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         shift.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         shift.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDepartment = !selectedDepartment || 
                             users.find(u => u.id === shift.employeeId)?.departmentId === selectedDepartment;
    const matchesEmployee = !selectedEmployee || shift.employeeId === selectedEmployee;
    const matchesStatus = !selectedStatus || shift.status === selectedStatus;
    const matchesDate = !selectedDate || 
                       new Date(shift.startTime).toISOString().split('T')[0] === selectedDate;
    
    return matchesSearch && matchesDepartment && matchesEmployee && matchesStatus && matchesDate;
  });

  const getShiftStats = () => {
    const today = new Date().toISOString().split('T')[0];
    const todayShifts = shifts.filter(shift => 
      new Date(shift.startTime).toISOString().split('T')[0] === today
    );
    
    const scheduled = todayShifts.filter(shift => shift.status === ShiftStatus.SCHEDULED).length;
    const confirmed = todayShifts.filter(shift => shift.status === ShiftStatus.CONFIRMED).length;
    const rejected = todayShifts.filter(shift => shift.status === ShiftStatus.REJECTED).length;
    const completed = todayShifts.filter(shift => shift.status === ShiftStatus.COMPLETED).length;
    
    return { scheduled, confirmed, rejected, completed };
  };

  const handleStatusChange = async (shiftId: string, newStatus: ShiftStatus, comment?: string) => {
    try {
      await shiftService.updateShiftStatus(shiftId, newStatus, userProfile?.id || '', comment);
      toast.success('Status oppdatert');
      loadData();
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Kunne ikke oppdatere status');
    }
  };

  const handleSendNotification = async (shiftId: string) => {
    try {
      await shiftService.sendShiftNotification(shiftId);
      toast.success('Varsel sendt');
    } catch (error) {
      console.error('Error sending notification:', error);
      toast.error('Kunne ikke sende varsel');
    }
  };

  const handleDeleteShift = async (shiftId: string) => {
    if (!confirm('Er du sikker på at du vil slette denne skiften?')) return;
    
    try {
      await shiftService.deleteShift(shiftId);
      toast.success('Skift slettet');
      loadData();
    } catch (error) {
      console.error('Error deleting shift:', error);
      toast.error('Kunne ikke slette skift');
    }
  };

  const formatShiftTime = (startTime: Date, endTime: Date) => {
    const start = new Date(startTime);
    const end = new Date(endTime);
    
    return `${start.toLocaleTimeString('no-NO', { hour: '2-digit', minute: '2-digit' })} - ${end.toLocaleTimeString('no-NO', { hour: '2-digit', minute: '2-digit' })}`;
  };

  const formatShiftDate = (date: Date) => {
    return new Date(date).toLocaleDateString('no-NO', { 
      weekday: 'short', 
      day: 'numeric', 
      month: 'short' 
    });
  };

  const getShiftDuration = (startTime: Date, endTime: Date) => {
    const duration = new Date(endTime).getTime() - new Date(startTime).getTime();
    const hours = Math.floor(duration / (1000 * 60 * 60));
    const minutes = Math.floor((duration % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}t ${minutes}m`;
  };

  const getStatusBadge = (status: ShiftStatus) => {
    const badges = {
      [ShiftStatus.SCHEDULED]: { color: 'bg-yellow-100 text-yellow-800', icon: Clock, text: 'Planlagt' },
      [ShiftStatus.CONFIRMED]: { color: 'bg-green-100 text-green-800', icon: CheckCircle, text: 'Bekreftet' },
      [ShiftStatus.REJECTED]: { color: 'bg-red-100 text-red-800', icon: XCircle, text: 'Avvist' },
      [ShiftStatus.COMPLETED]: { color: 'bg-blue-100 text-blue-800', icon: CheckCircle, text: 'Fullført' },
      [ShiftStatus.CANCELLED]: { color: 'bg-gray-100 text-gray-800', icon: XCircle, text: 'Kansellert' }
    };
    
    const badge = badges[status];
    const Icon = badge.icon;
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badge.color}`}>
        <Icon className="h-3 w-3 mr-1" />
        {badge.text}
      </span>
    );
  };

  const getPriorityColor = (priority: string) => {
    const colors = {
      low: 'bg-green-100 text-green-800',
      medium: 'bg-yellow-100 text-yellow-800',
      high: 'bg-orange-100 text-orange-800',
      critical: 'bg-red-100 text-red-800'
    };
    return colors[priority as keyof typeof colors] || colors.medium;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const stats = getShiftStats();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Skiftplan</h1>
          <p className="mt-1 text-sm text-gray-500">
            Avansert skiftplanlegging og administrasjon
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2 bg-white border border-gray-300 rounded-lg p-1">
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'list' 
                  ? 'bg-blue-600 text-white' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Liste
            </button>
            <button
              onClick={() => setViewMode('calendar')}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'calendar' 
                  ? 'bg-blue-600 text-white' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Kalender
            </button>
            <button
              onClick={() => setViewMode('timeline')}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'timeline' 
                  ? 'bg-blue-600 text-white' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Tidslinje
            </button>
          </div>
          {(isAdmin || isDepartmentLeader) && (
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Plus className="h-4 w-4 mr-2" />
              Opprett skift
            </button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white overflow-hidden shadow-lg rounded-xl border border-gray-100">
          <div className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <Clock className="h-6 w-6 text-yellow-600" />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Planlagt i dag</p>
                <p className="text-2xl font-bold text-gray-900">{stats.scheduled}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow-lg rounded-xl border border-gray-100">
          <div className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Bekreftet i dag</p>
                <p className="text-2xl font-bold text-gray-900">{stats.confirmed}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow-lg rounded-xl border border-gray-100">
          <div className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                  <XCircle className="h-6 w-6 text-red-600" />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Avvist i dag</p>
                <p className="text-2xl font-bold text-gray-900">{stats.rejected}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow-lg rounded-xl border border-gray-100">
          <div className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Award className="h-6 w-6 text-blue-600" />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Fullført i dag</p>
                <p className="text-2xl font-bold text-gray-900">{stats.completed}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Period Selector */}
      <div className="bg-white shadow-lg rounded-xl border border-gray-100 p-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900">Visningsperiode</h3>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setSelectedPeriod('day')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedPeriod === 'day' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Dag
            </button>
            <button
              onClick={() => setSelectedPeriod('week')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedPeriod === 'week' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Uke
            </button>
            <button
              onClick={() => setSelectedPeriod('month')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedPeriod === 'month' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Måned
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white shadow-lg rounded-xl border border-gray-100 p-6">
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Søk
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Søk etter skift eller ansatt..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 block w-full border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Dato
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="block w-full border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="block w-full border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            >
              <option value="">Alle statuser</option>
              <option value={ShiftStatus.SCHEDULED}>Planlagt</option>
              <option value={ShiftStatus.CONFIRMED}>Bekreftet</option>
              <option value={ShiftStatus.REJECTED}>Avvist</option>
              <option value={ShiftStatus.COMPLETED}>Fullført</option>
              <option value={ShiftStatus.CANCELLED}>Kansellert</option>
            </select>
          </div>

          {(isAdmin || isDepartmentLeader) && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Avdeling
              </label>
              <select
                value={selectedDepartment}
                onChange={(e) => setSelectedDepartment(e.target.value)}
                className="block w-full border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              >
                <option value="">Alle avdelinger</option>
                {departments.map(dept => (
                  <option key={dept.id} value={dept.id}>{dept.name}</option>
                ))}
              </select>
            </div>
          )}

          {(isAdmin || isDepartmentLeader) && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ansatt
              </label>
              <select
                value={selectedEmployee}
                onChange={(e) => setSelectedEmployee(e.target.value)}
                className="block w-full border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              >
                <option value="">Alle ansatte</option>
                {users.map(user => (
                  <option key={user.id} value={user.id}>{user.displayName}</option>
                ))}
              </select>
            </div>
          )}

          <div className="flex items-end">
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedDate(new Date().toISOString().split('T')[0]);
                setSelectedStatus('');
                setSelectedDepartment('');
                setSelectedEmployee('');
              }}
              className="w-full inline-flex justify-center items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Filter className="h-4 w-4 mr-2" />
              Nullstill
            </button>
          </div>
        </div>
      </div>

      {/* Calendar View */}
      {viewMode === 'calendar' && (
        <div className="bg-white shadow-lg rounded-xl border border-gray-100 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Kalendervisning</h3>
          <div className="text-center py-12">
            <Calendar className="mx-auto h-16 w-16 text-gray-400 mb-4" />
            <h4 className="text-lg font-medium text-gray-900 mb-2">Kalendervisning kommer snart</h4>
            <p className="text-sm text-gray-500">
              Avansert kalendervisning med drag-and-drop funksjonalitet
            </p>
          </div>
        </div>
      )}

      {/* Timeline View */}
      {viewMode === 'timeline' && (
        <div className="bg-white shadow-lg rounded-xl border border-gray-100 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Tidslinje</h3>
          <div className="text-center py-12">
            <BarChart3 className="mx-auto h-16 w-16 text-gray-400 mb-4" />
            <h4 className="text-lg font-medium text-gray-900 mb-2">Tidslinje kommer snart</h4>
            <p className="text-sm text-gray-500">
              Interaktiv tidslinje med skiftoversikt
            </p>
          </div>
        </div>
      )}

      {/* List View */}
      {viewMode === 'list' && (
        <div className="bg-white shadow-lg rounded-xl border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                Skift ({filteredShifts.length})
              </h3>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => {/* Export functionality */}}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Eksporter
                </button>
                <button
                  onClick={() => {/* Bulk actions */}}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <Send className="h-4 w-4 mr-2" />
                  Send varsler
                </button>
              </div>
            </div>
          </div>
          
          <div className="divide-y divide-gray-200">
            {filteredShifts.map((shift) => (
              <div key={shift.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      {getStatusBadge(shift.status)}
                      {shift.priority && (
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(shift.priority)}`}>
                          {shift.priority}
                        </span>
                      )}
                    </div>
                    
                    <h4 className="text-lg font-medium text-gray-900 mb-2">
                      {shift.title}
                    </h4>
                    
                    <div className="flex items-center space-x-6 mb-3">
                      <div className="flex items-center">
                        <Users className="h-4 w-4 text-gray-400 mr-2" />
                        <span className="text-sm font-medium text-gray-900">
                          {shift.employeeName}
                        </span>
                      </div>
                      
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                        <span className="text-sm text-gray-600">
                          {formatShiftDate(shift.startTime)}
                        </span>
                      </div>
                      
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 text-gray-400 mr-2" />
                        <span className="text-sm text-gray-600">
                          {formatShiftTime(shift.startTime, shift.endTime)}
                        </span>
                      </div>
                      
                      <div className="flex items-center">
                        <ClockIcon className="h-4 w-4 text-gray-400 mr-2" />
                        <span className="text-sm text-gray-600">
                          {getShiftDuration(shift.startTime, shift.endTime)}
                        </span>
                      </div>
                      
                      <div className="flex items-center">
                        <Building className="h-4 w-4 text-gray-400 mr-2" />
                        <span className="text-sm text-gray-600">
                          {users.find(u => u.id === shift.employeeId)?.departmentName || 'Ukjent avdeling'}
                        </span>
                      </div>
                    </div>
                    
                    {shift.description && (
                      <p className="text-sm text-gray-600 mb-3">
                        {shift.description}
                      </p>
                    )}
                    
                    {shift.location && (
                      <div className="flex items-center text-sm text-gray-500 mb-3">
                        <MapPin className="h-4 w-4 mr-2" />
                        {shift.location}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-2 ml-4">
                    <button
                      onClick={() => {
                        setSelectedShift(shift);
                        setShowAddModal(true);
                      }}
                      className="text-blue-600 hover:text-blue-900"
                      title="Se detaljer"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    
                    <button
                      onClick={() => handleSendNotification(shift.id)}
                      className="text-green-600 hover:text-green-900"
                      title="Send varsel"
                    >
                      <Mail className="h-4 w-4" />
                    </button>
                    
                    {(isAdmin || isDepartmentLeader) && (
                      <>
                        <button
                          onClick={() => {
                            setSelectedShift(shift);
                            setShowAddModal(true);
                          }}
                          className="text-indigo-600 hover:text-indigo-900"
                          title="Rediger"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteShift(shift.id)}
                          className="text-red-600 hover:text-red-900"
                          title="Slett"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </>
                    )}
                    
                    {shift.employeeId === userProfile?.id && shift.status === ShiftStatus.SCHEDULED && (
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => handleStatusChange(shift.id, ShiftStatus.CONFIRMED)}
                          className="text-green-600 hover:text-green-900"
                          title="Bekreft"
                        >
                          <CheckCircle className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleStatusChange(shift.id, ShiftStatus.REJECTED)}
                          className="text-red-600 hover:text-red-900"
                          title="Avvis"
                        >
                          <XCircle className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredShifts.length === 0 && (
            <div className="text-center py-12">
              <Calendar className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">Ingen skift funnet</h3>
              <p className="mt-1 text-sm text-gray-500">
                Prøv å endre søkekriteriene eller opprett et nytt skift.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Add/Edit Shift Modal would go here */}
      {/* This is a placeholder for the modal component */}
    </div>
  );
} 