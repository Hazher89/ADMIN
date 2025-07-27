'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { absenceService, userService, departmentService } from '@/lib/firebase-services';
import { Absence, RequestStatus, AbsenceType, User, Department } from '@/types';
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
  AlertCircle,
  TrendingUp,
  CalendarDays,
  FileText
} from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function AbsencePage() {
  const { userProfile, isAdmin, isDepartmentLeader } = useAuth();
  const [absences, setAbsences] = useState<Absence[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedAbsence, setSelectedAbsence] = useState<Absence | null>(null);

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

      // Load absences based on role
      let absenceData: Absence[] = [];
      if (isAdmin) {
        absenceData = await absenceService.getAllAbsences();
      } else if (isDepartmentLeader && userProfile?.departmentId) {
        absenceData = await absenceService.getAbsencesByDepartment(userProfile.departmentId);
      } else {
        absenceData = await absenceService.getAbsencesByEmployee(userProfile?.id || '');
      }

      setAbsences(absenceData);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Kunne ikke laste data');
    } finally {
      setLoading(false);
    }
  };

  const filteredAbsences = absences.filter(absence => {
    const matchesSearch = absence.reason.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         absence.employeeName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = !selectedStatus || absence.status === selectedStatus;
    const matchesType = !selectedType || absence.type === selectedType;
    const matchesDepartment = !selectedDepartment || 
                             users.find(u => u.id === absence.employeeId)?.departmentId === selectedDepartment;
    const matchesEmployee = !selectedEmployee || absence.employeeId === selectedEmployee;
    
    return matchesSearch && matchesStatus && matchesType && matchesDepartment && matchesEmployee;
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

  const getTypeBadge = (type: AbsenceType) => {
    const badges = {
      [AbsenceType.SICK_LEAVE]: { color: 'bg-red-100 text-red-800', text: 'Sykemelding' },
      [AbsenceType.VACATION]: { color: 'bg-blue-100 text-blue-800', text: 'Ferie' },
      [AbsenceType.PERSONAL_LEAVE]: { color: 'bg-purple-100 text-purple-800', text: 'Personlig' },
      [AbsenceType.MATERNITY_LEAVE]: { color: 'bg-pink-100 text-pink-800', text: 'Foreldrepermisjon' },
      [AbsenceType.OTHER]: { color: 'bg-gray-100 text-gray-800', text: 'Annet' }
    };
    
    const badge = badges[type];
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badge.color}`}>
        {badge.text}
      </span>
    );
  };

  const handleStatusChange = async (absenceId: string, newStatus: RequestStatus, comment?: string) => {
    try {
      await absenceService.updateAbsenceStatus(absenceId, newStatus, userProfile?.id || '', comment);
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
          <h1 className="text-2xl font-bold text-gray-900">Fravær</h1>
          <p className="mt-1 text-sm text-gray-500">
            Håndter fraværsforespørsler og godkjenninger
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <Plus className="h-4 w-4 mr-2" />
          Søk fravær
        </button>
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
                  <dd className="text-lg font-medium text-gray-900">
                    {absences.filter(a => a.status === RequestStatus.PENDING).length}
                  </dd>
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
                  <dd className="text-lg font-medium text-gray-900">
                    {absences.filter(a => a.status === RequestStatus.APPROVED).length}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <XCircle className="h-6 w-6 text-red-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Avvist</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {absences.filter(a => a.status === RequestStatus.REJECTED).length}
                  </dd>
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
                  <dd className="text-lg font-medium text-gray-900">
                    {absences
                      .filter(a => a.status === RequestStatus.APPROVED)
                      .reduce((total, absence) => total + getDaysBetween(absence.startDate, absence.endDate), 0)
                    }
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Søk
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Søk etter grunn eller navn..."
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

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Type
            </label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="block w-full border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            >
              <option value="">Alle typer</option>
              <option value={AbsenceType.SICK_LEAVE}>Sykemelding</option>
              <option value={AbsenceType.VACATION}>Ferie</option>
              <option value={AbsenceType.PERSONAL_LEAVE}>Personlig</option>
              <option value={AbsenceType.MATERNITY_LEAVE}>Foreldrepermisjon</option>
              <option value={AbsenceType.OTHER}>Annet</option>
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
                setSelectedType('');
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

      {/* Absences List */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            Fraværsforespørsler ({filteredAbsences.length})
          </h3>
        </div>
        
        <div className="divide-y divide-gray-200">
          {filteredAbsences.map((absence) => (
            <div key={absence.id} className="p-6 hover:bg-gray-50 transition-colors">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    {getStatusBadge(absence.status)}
                    {getTypeBadge(absence.type)}
                    <span className="text-sm text-gray-500">
                      {getDaysBetween(absence.startDate, absence.endDate)} dager
                    </span>
                  </div>
                  
                  <div className="flex items-center space-x-6 mb-3">
                    <div className="flex items-center">
                      <UserIcon className="h-4 w-4 text-gray-400 mr-2" />
                      <span className="text-sm font-medium text-gray-900">
                        {absence.employeeName}
                      </span>
                    </div>
                    
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                      <span className="text-sm text-gray-600">
                        {formatDateRange(absence.startDate, absence.endDate)}
                      </span>
                    </div>
                    
                    <div className="flex items-center">
                      <Building className="h-4 w-4 text-gray-400 mr-2" />
                      <span className="text-sm text-gray-600">
                        {departments.find(d => d.id === users.find(u => u.id === absence.employeeId)?.departmentId)?.name || 'Ukjent'}
                      </span>
                    </div>
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-3">
                    <strong>Grunn:</strong> {absence.reason}
                  </p>
                  
                  {absence.comments && absence.comments.length > 0 && (
                    <div className="text-sm text-gray-500">
                      <strong>Kommentarer:</strong> {absence.comments[absence.comments.length - 1].content}
                    </div>
                  )}
                </div>
                
                <div className="flex items-center space-x-2 ml-4">
                  <button
                    onClick={() => {
                      setSelectedAbsence(absence);
                      setShowAddModal(true);
                    }}
                    className="text-blue-600 hover:text-blue-900"
                    title="Se detaljer"
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                  
                  {(isAdmin || isDepartmentLeader) && absence.status === RequestStatus.PENDING && (
                    <>
                      <button
                        onClick={() => handleStatusChange(absence.id, RequestStatus.APPROVED)}
                        className="text-green-600 hover:text-green-900"
                        title="Godkjenn"
                      >
                        <CheckCircle className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleStatusChange(absence.id, RequestStatus.REJECTED)}
                        className="text-red-600 hover:text-red-900"
                        title="Avvis"
                      >
                        <XCircle className="h-4 w-4" />
                      </button>
                    </>
                  )}
                  
                  {absence.employeeId === userProfile?.id && absence.status === RequestStatus.PENDING && (
                    <button
                      onClick={() => handleStatusChange(absence.id, RequestStatus.CANCELLED)}
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

        {filteredAbsences.length === 0 && (
          <div className="text-center py-12">
            <Calendar className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Ingen fraværsforespørsler funnet</h3>
            <p className="mt-1 text-sm text-gray-500">
              Prøv å endre søkekriteriene eller søk om fravær.
            </p>
          </div>
        )}
      </div>

      {/* Add/Edit Absence Modal would go here */}
      {/* This is a placeholder for the modal component */}
    </div>
  );
} 