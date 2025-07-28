'use client';

import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  User, 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  Edit, 
  Eye, 
  Bell, 
  Archive, 
  FileSpreadsheet, 
  PieChart,
  Check,
  X,
  Download
} from 'lucide-react';
import { collection, addDoc, updateDoc, doc, writeBatch, query, orderBy, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import SelfDeclarationForm from '@/components/SelfDeclarationForm';

interface AbsenceRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  department: string;
  startDate: string;
  endDate: string;
  days: number;
  reason: string;
  type: 'sick_leave' | 'personal_leave' | 'other' | 'self_declaration';
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: string;
  reviewedBy?: string;
  reviewedAt?: string;
  comments?: string;
  attachments?: string[];
  isSelfDeclaration: boolean;
  doctorNote?: string;
  emergencyContact?: {
    name: string;
    phone: string;
    relationship: string;
  };
}

interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  department: string;
  role: string;
  email: string;
  phone: string;
}

export default function AbsencePage() {
  const [absenceRequests, setAbsenceRequests] = useState<AbsenceRequest[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<AbsenceRequest[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  
  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showSelfDeclarationModal, setShowSelfDeclarationModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showAnalyticsModal, setShowAnalyticsModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<AbsenceRequest | null>(null);
  const [selectedRequests, setSelectedRequests] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    employeeId: '',
    startDate: '',
    endDate: '',
    reason: '',
    type: 'sick_leave' as 'sick_leave' | 'personal_leave' | 'other' | 'self_declaration',
    isSelfDeclaration: false,
    doctorNote: '',
    emergencyContact: {
      name: '',
      phone: '',
      relationship: ''
    },
    comments: ''
  });
  
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterRequests();
  }, [absenceRequests, searchTerm, statusFilter, departmentFilter, typeFilter, dateFilter]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load absence requests from Firebase
      if (db) {
        const requestsQuery = query(
          collection(db, 'absenceRequests'),
          orderBy('submittedAt', 'desc')
        );
        const requestsSnapshot = await getDocs(requestsQuery);
        const requests = requestsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as AbsenceRequest[];
        setAbsenceRequests(requests);
      }
      
      // Load employees from Firebase
      if (db) {
        const employeesQuery = query(collection(db, 'employees'));
        const employeesSnapshot = await getDocs(employeesQuery);
        const employeesData = employeesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Employee[];
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
    const mockRequests: AbsenceRequest[] = [
      {
        id: '1',
        employeeId: 'emp1',
        employeeName: 'Ola Nordmann',
        department: 'IT',
        startDate: '2024-07-25',
        endDate: '2024-07-26',
        days: 2,
        reason: 'Sykdom - influensa',
        type: 'sick_leave',
        status: 'pending',
        submittedAt: '2024-07-24T10:00:00Z',
        isSelfDeclaration: true,
        doctorNote: 'Sykemelding fra lege',
        emergencyContact: {
          name: 'Kari Nordmann',
          phone: '+47 123 45 678',
          relationship: 'Ektefelle'
        }
      },
      {
        id: '2',
        employeeId: 'emp2',
        employeeName: 'Kari Hansen',
        department: 'HR',
        startDate: '2024-07-30',
        endDate: '2024-07-30',
        days: 1,
        reason: 'Personlig fravær - legetime',
        type: 'personal_leave',
        status: 'approved',
        submittedAt: '2024-07-23T14:30:00Z',
        reviewedBy: 'Admin',
        reviewedAt: '2024-07-24T09:00:00Z',
        isSelfDeclaration: false,
        emergencyContact: {
          name: 'Per Hansen',
          phone: '+47 987 65 432',
          relationship: 'Ektefelle'
        }
      }
    ];
    
    const mockEmployees: Employee[] = [
      {
        id: 'emp1',
        firstName: 'Ola',
        lastName: 'Nordmann',
        department: 'IT',
        role: 'employee',
        email: 'ola.nordmann@driftpro.no',
        phone: '+47 123 45 678'
      },
      {
        id: 'emp2',
        firstName: 'Kari',
        lastName: 'Hansen',
        department: 'HR',
        role: 'department_leader',
        email: 'kari.hansen@driftpro.no',
        phone: '+47 987 65 432'
      }
    ];
    
    setAbsenceRequests(mockRequests);
    setEmployees(mockEmployees);
  };

  const filterRequests = () => {
    let filtered = absenceRequests;
    
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
    
    if (typeFilter) {
      filtered = filtered.filter(request => request.type === typeFilter);
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
      
      const newRequest: Omit<AbsenceRequest, 'id'> = {
        employeeId: formData.employeeId,
        employeeName: `${employee.firstName} ${employee.lastName}`,
        department: employee.department,
        startDate: formData.startDate,
        endDate: formData.endDate,
        days,
        reason: formData.reason,
        type: formData.type,
        status: 'pending',
        submittedAt: new Date().toISOString(),
        isSelfDeclaration: formData.isSelfDeclaration,
        doctorNote: formData.doctorNote,
        emergencyContact: formData.emergencyContact
      };
      
      if (db) {
        const docRef = await addDoc(collection(db, 'absenceRequests'), newRequest);
        setAbsenceRequests(prev => [...prev, { ...newRequest, id: docRef.id }]);
      } else {
        // Fallback to local state
        const mockId = Date.now().toString();
        setAbsenceRequests(prev => [...prev, { ...newRequest, id: mockId }]);
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
        await updateDoc(doc(db, 'absenceRequests', requestId), {
          status,
          reviewedBy: 'Admin', // TODO: Get current user
          reviewedAt: new Date().toISOString(),
          comments
        });
      }
      
      setAbsenceRequests(prev =>
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

  const handleSelfDeclarationSubmit = async (data: {
    employeeId: string;
    startDate: string;
    endDate: string;
    reason: string;
    symptoms: string[];
    hasSeenDoctor: boolean;
    doctorInfo: {
      name: string;
      clinic?: string;
      phone?: string;
      date?: string;
    };
    emergencyContact: {
      name: string;
      phone: string;
      relationship: string;
      address: string;
    };
    additionalInfo: string;
    attachments: File[];
  }) => {
    try {
      setSaving(true);
      
      const employee = employees.find(emp => emp.id === data.employeeId);
      if (!employee) return;
      
      const startDate = new Date(data.startDate);
      const endDate = new Date(data.endDate);
      const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      
      const newRequest: Omit<AbsenceRequest, 'id'> = {
        employeeId: data.employeeId,
        employeeName: `${employee.firstName} ${employee.lastName}`,
        department: employee.department,
        startDate: data.startDate,
        endDate: data.endDate,
        days,
        reason: data.reason,
        type: 'self_declaration',
        status: 'pending',
        submittedAt: new Date().toISOString(),
        isSelfDeclaration: true,
        doctorNote: data.doctorInfo?.name ? `Lege: ${data.doctorInfo.name}${data.doctorInfo.clinic ? `, Klinikk: ${data.doctorInfo.clinic}` : ''}` : undefined,
        emergencyContact: data.emergencyContact
      };
      
      if (db) {
        const docRef = await addDoc(collection(db, 'absenceRequests'), newRequest);
        setAbsenceRequests(prev => [...prev, { ...newRequest, id: docRef.id }]);
      } else {
        // Fallback to local state
        const mockId = Date.now().toString();
        setAbsenceRequests(prev => [...prev, { ...newRequest, id: mockId }]);
      }
      
      setShowSelfDeclarationModal(false);
    } catch (error) {
      console.error('Error submitting self declaration:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleBulkAction = async (action: 'approve' | 'reject', requestIds: string[]) => {
    try {
      setSaving(true);
      
      if (!db) {
        for (const id of requestIds) {
          await handleReview(id, action === 'approve' ? 'approved' : 'rejected');
        }
        return;
      }
      
      const batch = writeBatch(db);
      requestIds.forEach(id => {
        if (db) {
          const docRef = doc(db, 'absenceRequests', id);
          batch.update(docRef, {
            status: action === 'approve' ? 'approved' : 'rejected',
            reviewedBy: 'Admin',
            reviewedAt: new Date().toISOString()
          });
        }
      });
      await batch.commit();
      
      setAbsenceRequests(prev =>
        prev.map(request =>
          requestIds.includes(request.id)
            ? {
                ...request,
                status: action === 'approve' ? 'approved' : 'rejected',
                reviewedBy: 'Admin',
                reviewedAt: new Date().toISOString()
              }
            : request
        )
      );
      
      setSelectedRequests([]);
    } catch (error) {
      console.error('Error performing bulk action:', error);
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setFormData({
      employeeId: '',
      startDate: '',
      endDate: '',
      reason: '',
      type: 'sick_leave',
      isSelfDeclaration: false,
      doctorNote: '',
      emergencyContact: {
        name: '',
        phone: '',
        relationship: ''
      },
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

  const getTypeText = (type: string) => {
    switch (type) {
      case 'sick_leave': return 'Sykemelding';
      case 'personal_leave': return 'Personlig fravær';
      case 'other': return 'Annet';
      case 'self_declaration': return 'Egenmelding';
      default: return type;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'sick_leave': return 'bg-red-100 text-red-800';
      case 'personal_leave': return 'bg-blue-100 text-blue-800';
      case 'other': return 'bg-gray-100 text-gray-800';
      case 'self_declaration': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
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
          <h1 className="text-2xl font-bold text-gray-900">Fraværsadministrasjon</h1>
          <p className="text-gray-600">Administrer fraværsmeldinger og egenmeldinger</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => setShowAnalyticsModal(true)}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center space-x-2"
          >
            <PieChart className="h-4 w-4" />
            <span>Analyser</span>
          </button>
          <button
            onClick={() => setShowExportModal(true)}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center space-x-2"
          >
            <FileSpreadsheet className="h-4 w-4" />
            <span>Eksporter</span>
          </button>
          <button
            onClick={() => setShowSelfDeclarationModal(true)}
            className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 flex items-center space-x-2"
          >
            <AlertTriangle className="h-4 w-4" />
            <span>Egenmelding</span>
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2"
          >
            <Plus className="h-4 w-4" />
            <span>Ny fraværsmelding</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">TOTALT FRAVÆR</p>
              <p className="text-3xl font-bold text-gray-900">{absenceRequests.length}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <User className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-yellow-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">VENTENDE</p>
              <p className="text-3xl font-bold text-gray-900">
                {absenceRequests.filter(r => r.status === 'pending').length}
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
                {absenceRequests.filter(r => r.status === 'approved').length}
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
              <p className="text-sm font-medium text-gray-600">EGENMELDINGER</p>
              <p className="text-3xl font-bold text-gray-900">
                {absenceRequests.filter(r => r.isSelfDeclaration).length}
              </p>
            </div>
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
              <AlertTriangle className="h-6 w-6 text-red-600" />
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
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
          >
            <option value="">Alle typer</option>
            <option value="sick_leave">Sykemelding</option>
            <option value="personal_leave">Personlig fravær</option>
            <option value="self_declaration">Egenmelding</option>
            <option value="other">Annet</option>
          </select>
          
          <select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
          >
            <option value="">Alle avdelinger</option>
            {Array.from(new Set(absenceRequests.map(r => r.department))).map(dept => (
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

      {/* Bulk Actions */}
      {selectedRequests.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <span className="text-sm font-medium text-blue-900">
                {selectedRequests.length} melding(er) valgt
              </span>
              <button
                onClick={() => setSelectedRequests([])}
                className="text-blue-600 hover:text-blue-800 text-sm"
              >
                Fjern valg
              </button>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => handleBulkAction('approve', selectedRequests)}
                disabled={saving}
                className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 flex items-center space-x-1 disabled:opacity-50"
              >
                <Check className="h-3 w-3" />
                <span>{saving ? 'Prosesserer...' : 'Godkjenn alle'}</span>
              </button>
              <button
                onClick={() => handleBulkAction('reject', selectedRequests)}
                disabled={saving}
                className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 flex items-center space-x-1 disabled:opacity-50"
              >
                <X className="h-3 w-3" />
                <span>{saving ? 'Prosesserer...' : 'Avvis alle'}</span>
              </button>
              <button
                onClick={() => setShowExportModal(true)}
                className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 flex items-center space-x-1"
              >
                <Download className="h-3 w-3" />
                <span>Eksporter valgte</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Absence Requests Table */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <input
                    type="checkbox"
                    checked={selectedRequests.length === filteredRequests.length && filteredRequests.length > 0}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedRequests(filteredRequests.map(r => r.id));
                      } else {
                        setSelectedRequests([]);
                      }
                    }}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ansatt
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fraværsperiode
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
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
                    <input
                      type="checkbox"
                      checked={selectedRequests.includes(request.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedRequests(prev => [...prev, request.id]);
                        } else {
                          setSelectedRequests(prev => prev.filter(id => id !== request.id));
                        }
                      }}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                  </td>
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
                        {request.isSelfDeclaration && (
                          <div className="text-xs text-orange-600 font-medium">⚠️ Egenmelding</div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {new Date(request.startDate).toLocaleDateString('nb-NO')} - {new Date(request.endDate).toLocaleDateString('nb-NO')}
                    </div>
                    <div className="text-sm text-gray-500">{request.days} dager</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getTypeColor(request.type)}`}>
                      {getTypeText(request.type)}
                    </span>
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
                          // setShowEditModal(true); // This state was removed
                        }}
                        className="text-blue-600 hover:text-blue-900"
                        title="Rediger"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => {
                          setSelectedRequest(request);
                          // setShowDetailsModal(true); // This state was removed
                        }}
                        className="text-gray-600 hover:text-gray-900"
                        title="Se detaljer"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      {request.isSelfDeclaration && (
                        <button
                          onClick={() => {
                            // TODO: Send notification to employee
                            console.log('Send notification to:', request.employeeName);
                          }}
                          className="text-purple-600 hover:text-purple-900"
                          title="Send varsel"
                        >
                          <Bell className="h-4 w-4" />
                        </button>
                      )}
                      <button
                        onClick={() => {
                          // TODO: Archive request
                          console.log('Archive request:', request.id);
                        }}
                        className="text-gray-400 hover:text-gray-600"
                        title="Arkiver"
                      >
                        <Archive className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Absence Request Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 modal">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto modal-content">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">Ny fraværsmelding</h2>
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
                    Type fravær *
                  </label>
                  <select
                    required
                    value={formData.type}
                    onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as 'sick_leave' | 'personal_leave' | 'other' | 'self_declaration' }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                  >
                    <option value="sick_leave">Sykemelding</option>
                    <option value="personal_leave">Personlig fravær</option>
                    <option value="self_declaration">Egenmelding</option>
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
                  Grunn til fravær *
                </label>
                <textarea
                  required
                  value={formData.reason}
                  onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                  placeholder="Beskriv grunnen til fraværet..."
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.isSelfDeclaration}
                      onChange={(e) => setFormData(prev => ({ ...prev, isSelfDeclaration: e.target.checked }))}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">Egenmelding</span>
                  </label>
                </div>
                
                {formData.type === 'sick_leave' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Legeerklæring (valgfritt)
                    </label>
                    <textarea
                      value={formData.doctorNote}
                      onChange={(e) => setFormData(prev => ({ ...prev, doctorNote: e.target.value }))}
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                      placeholder="Informasjon fra lege..."
                    />
                  </div>
                )}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Pårørende navn
                  </label>
                  <input
                    type="text"
                    value={formData.emergencyContact.name}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      emergencyContact: { ...prev.emergencyContact, name: e.target.value }
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                    placeholder="Navn på pårørende"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Pårørende telefon
                  </label>
                  <input
                    type="tel"
                    value={formData.emergencyContact.phone}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      emergencyContact: { ...prev.emergencyContact, phone: e.target.value }
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                    placeholder="Telefonnummer"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Forhold til pårørende
                  </label>
                  <input
                    type="text"
                    value={formData.emergencyContact.relationship}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      emergencyContact: { ...prev.emergencyContact, relationship: e.target.value }
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                    placeholder="f.eks. Ektefelle, Forelder"
                  />
                </div>
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
                  {saving ? 'Lagrer...' : 'Send melding'}
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
              <h3 className="text-lg font-bold">Gjennomgå fraværsmelding</h3>
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
                  Fraværsperiode
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

      {/* Details Modal */}
      {/* This state was removed */}
      {/* {showDetailsModal && selectedRequest && ( */}
      {/*   <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 modal"> */}
      {/*     <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto modal-content"> */}
      {/*       <div className="flex justify-between items-center mb-6"> */}
      {/*         <h3 className="text-lg font-bold">Detaljer - Fraværsmelding</h3> */}
      {/*         <button */}
      {/*           onClick={() => setShowDetailsModal(false)} */}
      {/*           className="text-gray-400 hover:text-gray-600" */}
      {/*         > */}
      {/*           <X className="h-6 w-6" /> */}
      {/*         </button> */}
      {/*       </div> */}
            
      {/*       <div className="space-y-6"> */}
      {/*         <div className="grid grid-cols-1 md:grid-cols-2 gap-6"> */}
      {/*           <div> */}
      {/*             <h4 className="font-medium text-gray-900 mb-2">Ansattinformasjon</h4> */}
      {/*             <div className="space-y-2 text-sm"> */}
      {/*               <p><span className="font-medium">Navn:</span> {selectedRequest.employeeName}</p> */}
      {/*               <p><span className="font-medium">Avdeling:</span> {selectedRequest.department}</p> */}
      {/*               <p><span className="font-medium">Type:</span> {getTypeText(selectedRequest.type)}</p> */}
      {/*               {selectedRequest.isSelfDeclaration && ( */}
      {/*                 <p className="text-orange-600 font-medium">⚠️ Egenmelding</p> */}
      {/*               )} */}
      {/*             </div> */}
      {/*           </div> */}
            
      {/*           <div> */}
      {/*             <h4 className="font-medium text-gray-900 mb-2">Fraværsperiode</h4> */}
      {/*             <div className="space-y-2 text-sm"> */}
      {/*               <p><span className="font-medium">Start:</span> {new Date(selectedRequest.startDate).toLocaleDateString('nb-NO')}</p> */}
      {/*               <p><span className="font-medium">Slutt:</span> {new Date(selectedRequest.endDate).toLocaleDateString('nb-NO')}</p> */}
      {/*               <p><span className="font-medium">Dager:</span> {selectedRequest.days}</p> */}
      {/*               <p><span className="font-medium">Status:</span>  */}
      {/*                 <span className={`ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedRequest.status)}`}> */}
      {/*                   {getStatusText(selectedRequest.status)} */}
      {/*                 </span> */}
      {/*               </p> */}
      {/*             </div> */}
      {/*           </div> */}
      {/*         </div> */}
            
      {/*         <div> */}
      {/*           <h4 className="font-medium text-gray-900 mb-2">Grunn til fravær</h4> */}
      {/*           <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg"> */}
      {/*             {selectedRequest.reason} */}
      {/*           </p> */}
      {/*         </div> */}
            
      {/*         {selectedRequest.doctorNote && ( */}
      {/*           <div> */}
      {/*             <h4 className="font-medium text-gray-900 mb-2">Legeerklæring</h4> */}
      {/*             <p className="text-sm text-gray-700 bg-blue-50 p-3 rounded-lg"> */}
      {/*               {selectedRequest.doctorNote} */}
      {/*             </p> */}
      {/*           </div> */}
      {/*         )} */}
            
      {/*         {selectedRequest.emergencyContact && ( */}
      {/*           <div> */}
      {/*             <h4 className="font-medium text-gray-900 mb-2">Pårørende</h4> */}
      {/*             <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm"> */}
      {/*               <p><span className="font-medium">Navn:</span> {selectedRequest.emergencyContact.name}</p> */}
      {/*               <p><span className="font-medium">Telefon:</span> {selectedRequest.emergencyContact.phone}</p> */}
      {/*               <p><span className="font-medium">Forhold:</span> {selectedRequest.emergencyContact.relationship}</p> */}
      {/*             </div> */}
      {/*           </div> */}
      {/*         )} */}
            
      {/*         <div className="grid grid-cols-1 md:grid-cols-2 gap-6"> */}
      {/*           <div> */}
      {/*             <h4 className="font-medium text-gray-900 mb-2">Tidsstempler</h4> */}
      {/*             <div className="space-y-2 text-sm"> */}
      {/*               <p><span className="font-medium">Innsendt:</span> {new Date(selectedRequest.submittedAt).toLocaleString('nb-NO')}</p> */}
      {/*               {selectedRequest.reviewedAt && ( */}
      {/*                 <p><span className="font-medium">Gjennomgått:</span> {new Date(selectedRequest.reviewedAt).toLocaleString('nb-NO')}</p> */}
      {/*               )} */}
      {/*               {selectedRequest.reviewedBy && ( */}
      {/*                 <p><span className="font-medium">Gjennomgått av:</span> {selectedRequest.reviewedBy}</p> */}
      {/*               )} */}
      {/*             </div> */}
      {/*           </div> */}
            
      {/*           {selectedRequest.comments && ( */}
      {/*             <div> */}
      {/*               <h4 className="font-medium text-gray-900 mb-2">Kommentarer</h4> */}
      {/*               <p className="text-sm text-gray-700 bg-yellow-50 p-3 rounded-lg"> */}
      {/*                 {selectedRequest.comments} */}
      {/*               </p> */}
      {/*             </div> */}
      {/*           )} */}
      {/*         </div> */}
      {/*       </div> */}
      {/*     </div> */}
      {/*   </div> */}
      {/* )} */}

      {/* Self Declaration Modal */}
      {showSelfDeclarationModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 modal">
          <div className="w-full max-w-6xl max-h-[95vh] overflow-y-auto modal-content">
            <SelfDeclarationForm
              onSubmit={handleSelfDeclarationSubmit}
              onCancel={() => setShowSelfDeclarationModal(false)}
              employee={employees[0]} // TODO: Get current user
            />
          </div>
        </div>
      )}

      {/* Analytics Modal */}
      {showAnalyticsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 modal">
          <div className="bg-white rounded-lg p-6 w-full max-w-6xl max-h-[90vh] overflow-y-auto modal-content">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold">Fraværsanalyse</h3>
              <button
                onClick={() => setShowAnalyticsModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-600">Total fravær</p>
                    <p className="text-2xl font-bold text-blue-900">{absenceRequests.length}</p>
                  </div>
                  <User className="h-8 w-8 text-blue-600" />
                </div>
              </div>
              
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-green-600">Godkjente</p>
                    <p className="text-2xl font-bold text-green-900">
                      {absenceRequests.filter(r => r.status === 'approved').length}
                    </p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
              </div>
              
              <div className="bg-yellow-50 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-yellow-600">Ventende</p>
                    <p className="text-2xl font-bold text-yellow-900">
                      {absenceRequests.filter(r => r.status === 'pending').length}
                    </p>
                  </div>
                  <Clock className="h-8 w-8 text-yellow-600" />
                </div>
              </div>
              
              <div className="bg-red-50 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-red-600">Egenmeldinger</p>
                    <p className="text-2xl font-bold text-red-900">
                      {absenceRequests.filter(r => r.isSelfDeclaration).length}
                    </p>
                  </div>
                  <AlertTriangle className="h-8 w-8 text-red-600" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-white border rounded-lg p-6">
                <h4 className="font-medium text-gray-900 mb-4">Fravær per avdeling</h4>
                <div className="space-y-3">
                  {Array.from(new Set(absenceRequests.map(r => r.department))).map(dept => {
                    const deptRequests = absenceRequests.filter(r => r.department === dept);
                    return (
                      <div key={dept} className="flex items-center justify-between">
                        <span className="text-sm text-gray-700">{dept}</span>
                        <div className="flex items-center space-x-2">
                          <div className="w-24 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full" 
                              style={{ width: `${(deptRequests.length / absenceRequests.length) * 100}%` }}
                            ></div>
                          </div>
                          <span className="text-sm font-medium text-gray-900">{deptRequests.length}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              
              <div className="bg-white border rounded-lg p-6">
                <h4 className="font-medium text-gray-900 mb-4">Fraværstype fordeling</h4>
                <div className="space-y-3">
                  {['sick_leave', 'personal_leave', 'self_declaration', 'other'].map(type => {
                    const typeRequests = absenceRequests.filter(r => r.type === type);
                    return (
                      <div key={type} className="flex items-center justify-between">
                        <span className="text-sm text-gray-700">{getTypeText(type)}</span>
                        <div className="flex items-center space-x-2">
                          <div className="w-24 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-green-600 h-2 rounded-full" 
                              style={{ width: `${(typeRequests.length / absenceRequests.length) * 100}%` }}
                            ></div>
                          </div>
                          <span className="text-sm font-medium text-gray-900">{typeRequests.length}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Export Modal */}
      {showExportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 modal">
          <div className="bg-white rounded-lg p-6 w-full max-w-md modal-content">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold">Eksporter fraværsdata</h3>
              <button
                onClick={() => setShowExportModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tidsperiode
                </label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900">
                  <option value="all">Alle perioder</option>
                  <option value="current_month">Denne måneden</option>
                  <option value="last_month">Forrige måned</option>
                  <option value="current_year">Dette året</option>
                  <option value="custom">Egendefinert periode</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Avdeling
                </label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900">
                  <option value="all">Alle avdelinger</option>
                  {Array.from(new Set(absenceRequests.map(r => r.department))).map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900">
                  <option value="all">Alle statuser</option>
                  <option value="pending">Venter</option>
                  <option value="approved">Godkjent</option>
                  <option value="rejected">Avvist</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Filformat
                </label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900">
                  <option value="csv">CSV</option>
                  <option value="excel">Excel</option>
                  <option value="pdf">PDF</option>
                </select>
              </div>
            </div>
            
            <div className="flex justify-end space-x-4 mt-6">
              <button
                onClick={() => setShowExportModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Avbryt
              </button>
              <button
                onClick={() => {
                  // TODO: Implement export functionality
                  console.log('Exporting data...');
                  setShowExportModal(false);
                }}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center space-x-2"
              >
                <Download className="h-4 w-4" />
                <span>Eksporter</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 