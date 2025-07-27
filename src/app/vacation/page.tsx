'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { vacationService, userService, departmentService } from '@/lib/firebase-services';
import { Vacation, RequestStatus, User, Department } from '@/types';
import { 
  Calendar, 
  Search, 
  Filter, 
  Plus, 
  Eye, 
  Edit, 
  CheckCircle,
  XCircle,
  Clock,
  User as UserIcon,
  Building,
  CalendarDays,
  TrendingUp,
  FileText,
  MapPin,
  Sun,
  Plane
} from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function VacationPage() {
  const { userProfile, isAdmin, isDepartmentLeader } = useAuth();
  const [vacations, setVacations] = useState<Vacation[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [showAddModal, setShowAddModal] = useState(false);
  const [showCalendarView, setShowCalendarView] = useState(false);
  const [selectedVacation, setSelectedVacation] = useState<Vacation | null>(null);

  useEffect(() => {
    loadData();
  }, [selectedYear]);

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

      // Load vacations based on role and year
      let vacationData: Vacation[] = [];
      if (isAdmin) {
        vacationData = await vacationService.getVacationsByYear(selectedYear);
      } else if (isDepartmentLeader && userProfile?.departmentId) {
        vacationData = await vacationService.getVacationsByDepartmentAndYear(userProfile.departmentId, selectedYear);
      } else {
        vacationData = await vacationService.getVacationsByEmployeeAndYear(userProfile?.id || '', selectedYear);
      }

      setVacations(vacationData);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Kunne ikke laste data');
    } finally {
      setLoading(false);
    }
  };

  const filteredVacations = vacations.filter(vacation => {
    const matchesSearch = vacation.destination?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         vacation.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         vacation.reason?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = !selectedStatus || vacation.status === selectedStatus;
    const matchesDepartment = !selectedDepartment || 
                             users.find(u => u.id === vacation.employeeId)?.departmentId === selectedDepartment;
    const matchesEmployee = !selectedEmployee || vacation.employeeId === selectedEmployee;
    
    return matchesSearch && matchesStatus && matchesDepartment && matchesEmployee;
  });

  const getStatusBadge = (status: RequestStatus) => {
    const badges = {
      [RequestStatus.PENDING]: { color: 'bg-yellow-100 text-yellow-800', icon: Clock, text: 'Venter' },
      [RequestStatus.APPROVED]: { color: 'bg-green-100 text-green-800', icon: CheckCircle, text: 'Godkjent' },
      [RequestStatus.REJECTED]: { color: 'bg-red-100 text-red-800', icon: XCircle, text: 'Avvist' },
      [RequestStatus.CANCELLED]: { color: 'bg-gray-100 text-gray-800', icon: XCircle, text: 'Kansellert' }
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

  const handleStatusChange = async (vacationId: string, newStatus: RequestStatus, comment?: string) => {
    try {
      await vacationService.updateVacationStatus(vacationId, newStatus, userProfile?.id || '', comment);
      toast.success('Status oppdatert');
      loadData();
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Kunne ikke oppdatere status');
    }
  };

  const getDaysBetween = (startDate: Date, endDate: Date) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays;
  };

  const formatDateRange = (startDate: Date, endDate: Date) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (start.toDateString() === end.toDateString()) {
      return start.toLocaleDateString('no-NO');
    }
    
    return `${start.toLocaleDateString('no-NO')} - ${end.toLocaleDateString('no-NO')}`;
  };

  const getVacationStats = () => {
    const approved = vacations.filter(v => v.status === RequestStatus.APPROVED);
    const pending = vacations.filter(v => v.status === RequestStatus.PENDING);
    const totalDays = approved.reduce((total, vacation) => total + getDaysBetween(vacation.startDate, vacation.endDate), 0);
    
    return {
      approved: approved.length,
      pending: pending.length,
      totalDays
    };
  };

  const generateYearOptions = () => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let i = currentYear - 5; i <= currentYear + 5; i++) {
      years.push(i);
    }
    return years;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const stats = getVacationStats();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Ferie</h1>
          <p className="mt-1 text-sm text-gray-500">
            Håndter ferieforespørsler og ferieplaner
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowCalendarView(!showCalendarView)}
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Calendar className="h-4 w-4 mr-2" />
            {showCalendarView ? 'Listevisning' : 'Kalendervisning'}
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Plus className="h-4 w-4 mr-2" />
            Søk ferie
          </button>
        </div>
      </div>

      {/* Year Selector */}
      <div className="bg-white shadow rounded-lg p-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900">Ferieår {selectedYear}</h3>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setSelectedYear(selectedYear - 1)}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
            >
              ←
            </button>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:ring-blue-500 focus:border-blue-500"
            >
              {generateYearOptions().map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
            <button
              onClick={() => setSelectedYear(selectedYear + 1)}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
            >
              →
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Venter</dt>
                  <dd className="text-lg font-medium text-gray-900">{stats.pending}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Godkjent</dt>
                  <dd className="text-lg font-medium text-gray-900">{stats.approved}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CalendarDays className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Totalt dager</dt>
                  <dd className="text-lg font-medium text-gray-900">{stats.totalDays}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Sun className="h-6 w-6 text-orange-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Gjennomsnitt</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {stats.approved > 0 ? Math.round(stats.totalDays / stats.approved) : 0} dager
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Søk
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Søk etter destinasjon eller navn..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 block w-full border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="block w-full border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            >
              <option value="">Alle statuser</option>
              <option value={RequestStatus.PENDING}>Venter</option>
              <option value={RequestStatus.APPROVED}>Godkjent</option>
              <option value={RequestStatus.REJECTED}>Avvist</option>
              <option value={RequestStatus.CANCELLED}>Kansellert</option>
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
                className="block w-full border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
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
                className="block w-full border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
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
                setSelectedStatus('');
                setSelectedDepartment('');
                setSelectedEmployee('');
              }}
              className="w-full inline-flex justify-center items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Filter className="h-4 w-4 mr-2" />
              Nullstill
            </button>
          </div>
        </div>
      </div>

      {/* Calendar View */}
      {showCalendarView && (
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Kalendervisning</h3>
          <div className="text-center py-12">
            <Calendar className="mx-auto h-16 w-16 text-gray-400 mb-4" />
            <h4 className="text-lg font-medium text-gray-900 mb-2">Kalendervisning kommer snart</h4>
            <p className="text-sm text-gray-500">
              Avansert kalendervisning med ferieplaner for alle ansatte
            </p>
          </div>
        </div>
      )}

      {/* Vacations List */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            Ferieforespørsler ({filteredVacations.length})
          </h3>
        </div>
        
        <div className="divide-y divide-gray-200">
          {filteredVacations.map((vacation) => (
            <div key={vacation.id} className="p-6 hover:bg-gray-50 transition-colors">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    {getStatusBadge(vacation.status)}
                    <span className="text-sm text-gray-500">
                      {getDaysBetween(vacation.startDate, vacation.endDate)} dager
                    </span>
                    {vacation.destination && (
                      <div className="flex items-center">
                        <MapPin className="h-4 w-4 text-gray-400 mr-1" />
                        <span className="text-sm text-gray-600">{vacation.destination}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-6 mb-3">
                    <div className="flex items-center">
                      <UserIcon className="h-4 w-4 text-gray-400 mr-2" />
                      <span className="text-sm font-medium text-gray-900">
                        {vacation.employeeName}
                      </span>
                    </div>
                    
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                      <span className="text-sm text-gray-600">
                        {formatDateRange(vacation.startDate, vacation.endDate)}
                      </span>
                    </div>
                    
                    <div className="flex items-center">
                      <Building className="h-4 w-4 text-gray-400 mr-2" />
                      <span className="text-sm text-gray-600">
                        {departments.find(d => d.id === users.find(u => u.id === vacation.employeeId)?.departmentId)?.name || 'Ukjent'}
                      </span>
                    </div>
                  </div>
                  
                  {vacation.reason && (
                    <p className="text-sm text-gray-600 mb-3">
                      <strong>Grunn:</strong> {vacation.reason}
                    </p>
                  )}
                  
                  {vacation.comments && vacation.comments.length > 0 && (
                    <div className="text-sm text-gray-500">
                      <strong>Kommentarer:</strong> {vacation.comments[vacation.comments.length - 1].content}
                    </div>
                  )}
                </div>
                
                <div className="flex items-center space-x-2 ml-4">
                  <button
                    onClick={() => {
                      setSelectedVacation(vacation);
                      setShowAddModal(true);
                    }}
                    className="text-blue-600 hover:text-blue-900"
                    title="Se detaljer"
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                  
                  {(isAdmin || isDepartmentLeader) && vacation.status === RequestStatus.PENDING && (
                    <>
                      <button
                        onClick={() => handleStatusChange(vacation.id, RequestStatus.APPROVED)}
                        className="text-green-600 hover:text-green-900"
                        title="Godkjenn"
                      >
                        <CheckCircle className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleStatusChange(vacation.id, RequestStatus.REJECTED)}
                        className="text-red-600 hover:text-red-900"
                        title="Avvis"
                      >
                        <XCircle className="h-4 w-4" />
                      </button>
                    </>
                  )}
                  
                  {vacation.employeeId === userProfile?.id && vacation.status === RequestStatus.PENDING && (
                    <button
                      onClick={() => handleStatusChange(vacation.id, RequestStatus.CANCELLED)}
                      className="text-gray-600 hover:text-gray-900"
                      title="Kanseller"
                    >
                      <XCircle className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredVacations.length === 0 && (
          <div className="text-center py-12">
            <Plane className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Ingen ferieforespørsler funnet</h3>
            <p className="mt-1 text-sm text-gray-500">
              Prøv å endre søkekriteriene eller søk om ferie.
            </p>
          </div>
        )}
      </div>

      {/* Add/Edit Vacation Modal would go here */}
      {/* This is a placeholder for the modal component */}
    </div>
  );
} 