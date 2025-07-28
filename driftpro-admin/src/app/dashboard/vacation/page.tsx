'use client';

import React, { useState, useEffect } from 'react';
import { 
  Calendar,
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  Eye,
  Save,
  X,
  Check,
  X as XIcon,
  Clock,
  User,
  Building,
  AlertTriangle,
  CheckCircle,
  XCircle,
  CalendarDays,
  Users,
  BarChart3,
  Download,
  Upload,
  Settings,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  MoreHorizontal
} from 'lucide-react';
import { collection, addDoc, updateDoc, deleteDoc, doc, getDocs, query, where, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import VacationCalendar from '@/components/VacationCalendar';
import EmployeeVacationManager from '@/components/EmployeeVacationManager';

interface VacationRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  department: string;
  startDate: string;
  endDate: string;
  days: number;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: string;
  reviewedBy?: string;
  reviewedAt?: string;
  comments?: string;
  type: 'vacation' | 'sick_leave' | 'other';
}

interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  department: string;
  role: string;
  vacationDays: {
    total: number;
    used: number;
    remaining: number;
    carriedOver: number;
  };
}

interface VacationDay {
  date: string;
  employeeId: string;
  employeeName: string;
  type: 'vacation' | 'sick_leave' | 'other';
  status: 'approved' | 'pending';
}

export default function VacationPage() {
  const [vacationRequests, setVacationRequests] = useState<VacationRequest[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<VacationRequest[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  
  // Calendar state
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [calendarView, setCalendarView] = useState<'month' | 'year'>('month');
  
  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showEmployeeModal, setShowEmployeeModal] = useState(false);
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<VacationRequest | null>(null);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    employeeId: '',
    startDate: '',
    endDate: '',
    reason: '',
    type: 'vacation' as 'vacation' | 'sick_leave' | 'other',
    comments: ''
  });
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterRequests();
  }, [vacationRequests, searchTerm, statusFilter, departmentFilter, dateFilter]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load vacation requests from Firebase
      if (db) {
        const requestsQuery = query(
          collection(db, 'vacationRequests'),
          orderBy('submittedAt', 'desc')
        );
        const requestsSnapshot = await getDocs(requestsQuery);
        const requests = requestsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as VacationRequest[];
        setVacationRequests(requests);
      }
      
      // Load employees from Firebase
      if (db) {
        const employeesQuery = query(collection(db, 'employees'));
        const employeesSnapshot = await getDocs(employeesQuery);
        const employeesData = employeesSnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            firstName: data.firstName || '',
            lastName: data.lastName || '',
            department: data.department || '',
            role: data.role || '',
            vacationDays: data.vacationDays || {
              total: 25,
              used: 0,
              remaining: 25,
              carriedOver: 0
            }
          };
        }) as Employee[];
        setEmployees(employeesData);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      // Fallback to mock data
      loadMockData();
    } finally {
      setLoading(false);
    }
  };

  const loadMockData = () => {
    const mockRequests: VacationRequest[] = [
      {
        id: '1',
        employeeId: 'emp1',
        employeeName: 'Ola Nordmann',
        department: 'IT',
        startDate: '2024-08-15',
        endDate: '2024-08-23',
        days: 7,
        reason: 'Sommerferie',
        status: 'pending',
        submittedAt: '2024-07-20T10:00:00Z',
        type: 'vacation'
      },
      {
        id: '2',
        employeeId: 'emp2',
        employeeName: 'Kari Hansen',
        department: 'HR',
        startDate: '2024-09-01',
        endDate: '2024-09-05',
        days: 5,
        reason: 'Familieferie',
        status: 'approved',
        submittedAt: '2024-07-15T14:30:00Z',
        reviewedBy: 'Admin',
        reviewedAt: '2024-07-16T09:00:00Z',
        type: 'vacation'
      }
    ];
    
    const mockEmployees: Employee[] = [
      {
        id: 'emp1',
        firstName: 'Ola',
        lastName: 'Nordmann',
        department: 'IT',
        role: 'employee',
        vacationDays: {
          total: 25,
          used: 5,
          remaining: 20,
          carriedOver: 0
        }
      },
      {
        id: 'emp2',
        firstName: 'Kari',
        lastName: 'Hansen',
        department: 'HR',
        role: 'department_leader',
        vacationDays: {
          total: 30,
          used: 10,
          remaining: 20,
          carriedOver: 5
        }
      }
    ];
    
    setVacationRequests(mockRequests);
    setEmployees(mockEmployees);
  };

  const filterRequests = () => {
    let filtered = vacationRequests;
    
    if (searchTerm) {
      filtered = filtered.filter(request =>
        request.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.reason.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (statusFilter) {
      filtered = filtered.filter(request => request.status === statusFilter);
    }
    
    if (departmentFilter) {
      filtered = filtered.filter(request => request.department === departmentFilter);
    }
    
    if (dateFilter) {
      filtered = filtered.filter(request => 
        request.startDate >= dateFilter || request.endDate <= dateFilter
      );
    }
    
    setFilteredRequests(filtered);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      
      const employee = employees.find(emp => emp.id === formData.employeeId);
      if (!employee) return;
      
      const startDate = new Date(formData.startDate);
      const endDate = new Date(formData.endDate);
      const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      
      const newRequest: Omit<VacationRequest, 'id'> = {
        employeeId: formData.employeeId,
        employeeName: `${employee.firstName} ${employee.lastName}`,
        department: employee.department,
        startDate: formData.startDate,
        endDate: formData.endDate,
        days,
        reason: formData.reason,
        status: 'pending',
        submittedAt: new Date().toISOString(),
        type: formData.type
      };
      
      if (db) {
        const docRef = await addDoc(collection(db, 'vacationRequests'), newRequest);
        setVacationRequests(prev => [...prev, { ...newRequest, id: docRef.id }]);
      } else {
        // Fallback to local state
        const mockId = Date.now().toString();
        setVacationRequests(prev => [...prev, { ...newRequest, id: mockId }]);
      }
      
      setShowAddModal(false);
      resetForm();
    } catch (error) {
      console.error('Error submitting request:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleReview = async (requestId: string, status: 'approved' | 'rejected', comments?: string) => {
    try {
      if (db) {
        await updateDoc(doc(db, 'vacationRequests', requestId), {
          status,
          reviewedBy: 'Admin', // TODO: Get current user
          reviewedAt: new Date().toISOString(),
          comments
        });
      }
      
      setVacationRequests(prev =>
        prev.map(request =>
          request.id === requestId
            ? {
                ...request,
                status,
                reviewedBy: 'Admin',
                reviewedAt: new Date().toISOString(),
                comments
              }
            : request
        )
      );
      
      setShowReviewModal(false);
      setSelectedRequest(null);
    } catch (error) {
      console.error('Error reviewing request:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      employeeId: '',
      startDate: '',
      endDate: '',
      reason: '',
      type: 'vacation',
      comments: ''
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'approved': return 'Godkjent';
      case 'rejected': return 'Avvist';
      case 'pending': return 'Venter';
      default: return status;
    }
  };

  const handleDateClick = (date: Date, requests: VacationRequest[]) => {
    console.log('Date clicked:', date, 'Requests:', requests);
    // You can implement additional functionality here, like showing a detailed view
  };

  const handleEmployeeUpdate = (employeeId: string, vacationDays: { total: number; used: number; remaining: number; carriedOver: number }) => {
    setEmployees(prev =>
      prev.map(emp =>
        emp.id === employeeId
          ? { ...emp, vacationDays }
          : emp
      )
    );
  };

  const handleCalendarClose = () => {
    setShowCalendarModal(false);
  };

  const handleEmployeeManagerClose = () => {
    setShowEmployeeModal(false);
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
          <h1 className="text-2xl font-bold text-gray-900">Ferieadministrasjon</h1>
          <p className="text-gray-600">Administrer ferieforespørsler og ferieplaner</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => setShowCalendarModal(true)}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center space-x-2"
          >
            <CalendarDays className="h-4 w-4" />
            <span>Kalender</span>
          </button>
          <button
            onClick={() => setShowEmployeeModal(true)}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center space-x-2"
          >
            <Users className="h-4 w-4" />
            <span>Ansatte</span>
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2"
          >
            <Plus className="h-4 w-4" />
            <span>Ny forespørsel</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">TOTALT FORESPØRSLER</p>
              <p className="text-3xl font-bold text-gray-900">{vacationRequests.length}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Calendar className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-yellow-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">VENTENDE</p>
              <p className="text-3xl font-bold text-gray-900">
                {vacationRequests.filter(r => r.status === 'pending').length}
              </p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Clock className="h-6 w-6 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">GODKJENTE</p>
              <p className="text-3xl font-bold text-gray-900">
                {vacationRequests.filter(r => r.status === 'approved').length}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-red-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">AVVISTE</p>
              <p className="text-3xl font-bold text-gray-900">
                {vacationRequests.filter(r => r.status === 'rejected').length}
              </p>
            </div>
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
              <XCircle className="h-6 w-6 text-red-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Søk etter ansatt eller grunn..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
              />
            </div>
          </div>
          
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
          >
            <option value="">Alle statuser</option>
            <option value="pending">Venter</option>
            <option value="approved">Godkjent</option>
            <option value="rejected">Avvist</option>
          </select>
          
          <select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
          >
            <option value="">Alle avdelinger</option>
            {Array.from(new Set(vacationRequests.map(r => r.department))).map(dept => (
              <option key={dept} value={dept}>{dept}</option>
            ))}
          </select>
          
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
          />
        </div>
      </div>

      {/* Vacation Requests Table */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ansatt
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ferieperiode
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Dager
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Grunn
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Innsendt
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Handlinger
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredRequests.map((request) => (
                <tr key={request.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                        <span className="text-white font-medium text-sm">
                          {request.employeeName.split(' ').map(n => n[0]).join('')}
                        </span>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {request.employeeName}
                        </div>
                        <div className="text-sm text-gray-500">{request.department}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {new Date(request.startDate).toLocaleDateString('nb-NO')} - {new Date(request.endDate).toLocaleDateString('nb-NO')}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-900">{request.days} dager</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900 max-w-xs truncate">
                      {request.reason}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(request.status)}`}>
                      {getStatusText(request.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(request.submittedAt).toLocaleDateString('nb-NO')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      {request.status === 'pending' && (
                        <>
                          <button
                            onClick={() => {
                              setSelectedRequest(request);
                              setShowReviewModal(true);
                            }}
                            className="text-green-600 hover:text-green-900"
                            title="Godkjenn"
                          >
                            <Check className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleReview(request.id, 'rejected')}
                            className="text-red-600 hover:text-red-900"
                            title="Avvis"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => {
                          setSelectedRequest(request);
                          setShowEditModal(true);
                        }}
                        className="text-blue-600 hover:text-blue-900"
                        title="Rediger"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => {
                          setSelectedRequest(request);
                        }}
                        className="text-gray-600 hover:text-gray-900"
                        title="Se detaljer"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Vacation Request Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 modal">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto modal-content">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">Ny ferieforespørsel</h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ansatt *
                  </label>
                  <select
                    required
                    value={formData.employeeId}
                    onChange={(e) => setFormData(prev => ({ ...prev, employeeId: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                  >
                    <option value="">Velg ansatt</option>
                    {employees.map(emp => (
                      <option key={emp.id} value={emp.id}>
                        {emp.firstName} {emp.lastName} ({emp.department})
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Type *
                  </label>
                  <select
                    required
                    value={formData.type}
                    onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as 'vacation' | 'sick_leave' | 'other' }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                  >
                    <option value="vacation">Ferie</option>
                    <option value="sick_leave">Sykemelding</option>
                    <option value="other">Annet</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Startdato *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.startDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Sluttdato *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.endDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Grunn *
                </label>
                <textarea
                  required
                  value={formData.reason}
                  onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                  placeholder="Beskriv grunnen til ferieforespørselen..."
                />
              </div>
              
              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Avbryt
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {saving ? 'Lagrer...' : 'Send forespørsel'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Review Modal */}
      {showReviewModal && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 modal">
          <div className="bg-white rounded-lg p-6 w-full max-w-md modal-content">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">Gjennomgå forespørsel</h2>
              <button
                onClick={() => setShowReviewModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ansatt
                </label>
                <p className="text-sm text-gray-900">{selectedRequest.employeeName}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ferieperiode
                </label>
                <p className="text-sm text-gray-900">
                  {new Date(selectedRequest.startDate).toLocaleDateString('nb-NO')} - {new Date(selectedRequest.endDate).toLocaleDateString('nb-NO')}
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Grunn
                </label>
                <p className="text-sm text-gray-900">{selectedRequest.reason}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Kommentar (valgfritt)
                </label>
                <textarea
                  value={formData.comments}
                  onChange={(e) => setFormData(prev => ({ ...prev, comments: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                  placeholder="Legg til kommentar..."
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setShowReviewModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Avbryt
              </button>
              <button
                onClick={() => handleReview(selectedRequest.id, 'rejected', formData.comments)}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Avvis
              </button>
              <button
                onClick={() => handleReview(selectedRequest.id, 'approved', formData.comments)}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Godkjenn
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Calendar Modal */}
      {showCalendarModal && (
        <VacationCalendar
          vacationRequests={vacationRequests}
          onDateClick={handleDateClick}
          onClose={handleCalendarClose}
        />
      )}

      {/* Employee Manager Modal */}
      {showEmployeeModal && (
        <EmployeeVacationManager
          employees={employees}
          onClose={handleEmployeeManagerClose}
          onUpdate={handleEmployeeUpdate}
        />
      )}
    </div>
  );
} 