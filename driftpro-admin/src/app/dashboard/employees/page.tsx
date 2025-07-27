'use client';

import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Plus, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  Eye, 
  Save, 
  X, 
  ChevronDown,
  Building,
  Shield,
  UserCheck,
  UserX,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Clock,
  FileText,
  AlertTriangle,
  MessageSquare,
  BarChart3,
  Settings,
  Check,
  X as XIcon
} from 'lucide-react';
import { collection, addDoc, updateDoc, deleteDoc, doc, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  department: string;
  position: string;
  role: 'admin' | 'department_leader' | 'employee';
  emergencyContact: {
    name: string;
    phone: string;
    relationship: string;
  };
  address: {
    street: string;
    city: string;
    postalCode: string;
  };
  permissions: {
    // Basic permissions that can be manually controlled
    fullAccess: boolean;
    manageOwnDepartment: boolean;
    approveVacation: boolean;
    approveAbsence: boolean;
    manageShifts: boolean;
    handleDeviations: boolean;
    submitDeviations: boolean;
    submitAbsence: boolean;
    submitVacation: boolean;
    useChat: boolean;
    readDocuments: boolean;
    editOwnRequests: boolean;
  };
  startDate: string;
  status: 'active' | 'inactive';
  createdAt: string;
}

interface Department {
  id: string;
  name: string;
  leader?: string | null;
}

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [filteredEmployees, setFilteredEmployees] = useState<Employee[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPermissionsModal, setShowPermissionsModal] = useState(false);
  const [showDepartmentModal, setShowDepartmentModal] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    department: '',
    position: '',
    role: 'employee' as 'admin' | 'department_leader' | 'employee',
    emergencyContact: {
      name: '',
      phone: '',
      relationship: ''
    },
    address: {
      street: '',
      city: '',
      postalCode: ''
    },
    startDate: '',
    permissions: {
      fullAccess: false,
      manageOwnDepartment: false,
      approveVacation: false,
      approveAbsence: false,
      manageShifts: false,
      handleDeviations: false,
      submitDeviations: true,
      submitAbsence: true,
      submitVacation: true,
      useChat: true,
      readDocuments: true,
      editOwnRequests: true,
    }
  });

  useEffect(() => {
    loadEmployees();
    loadDepartments();
  }, []);

  useEffect(() => {
    filterEmployees();
  }, [employees, searchTerm, departmentFilter, roleFilter]);

  // Handle click outside dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (selectedEmployee && !(event.target as Element).closest('.dropdown-container')) {
        setSelectedEmployee(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [selectedEmployee]);

  const loadEmployees = async () => {
    try {
      setLoading(true);
      // Mock data for now - replace with Firebase query
      const mockEmployees: Employee[] = [
        {
          id: '1',
          firstName: 'Ola',
          lastName: 'Nordmann',
          email: 'ola.nordmann@driftpro.no',
          phone: '+47 123 45 678',
          department: 'IT',
          position: 'Systemutvikler',
          role: 'employee',
          emergencyContact: {
            name: 'Kari Nordmann',
            phone: '+47 987 65 432',
            relationship: 'Ektefelle'
          },
          address: {
            street: 'Osloveien 123',
            city: 'Oslo',
            postalCode: '0123'
          },
          permissions: {
            fullAccess: false,
            manageOwnDepartment: false,
            approveVacation: false,
            approveAbsence: false,
            manageShifts: false,
            handleDeviations: false,
            submitDeviations: true,
            submitAbsence: true,
            submitVacation: true,
            useChat: true,
            readDocuments: true,
            editOwnRequests: true
          },
          startDate: '2024-01-15',
          status: 'active',
          createdAt: '2024-01-15T10:00:00Z'
        },
        {
          id: '2',
          firstName: 'Kari',
          lastName: 'Hansen',
          email: 'kari.hansen@driftpro.no',
          phone: '+47 234 56 789',
          department: 'HR',
          position: 'HR-leder',
          role: 'department_leader',
          emergencyContact: {
            name: 'Per Hansen',
            phone: '+47 876 54 321',
            relationship: 'Ektefelle'
          },
          address: {
            street: 'Bergensgaten 456',
            city: 'Bergen',
            postalCode: '5000'
          },
          permissions: {
            fullAccess: false,
            manageOwnDepartment: true,
            approveVacation: true,
            approveAbsence: true,
            manageShifts: true,
            handleDeviations: true,
            submitDeviations: true,
            submitAbsence: true,
            submitVacation: true,
            useChat: true,
            readDocuments: true,
            editOwnRequests: true
          },
          startDate: '2023-06-01',
          status: 'active',
          createdAt: '2023-06-01T09:00:00Z'
        },
        {
          id: '3',
          firstName: 'Admin',
          lastName: 'Bruker',
          email: 'admin@driftpro.no',
          phone: '+47 999 99 999',
          department: 'Administrasjon',
          position: 'Systemadministrator',
          role: 'admin',
          emergencyContact: {
            name: 'Admin Kontakt',
            phone: '+47 888 88 888',
            relationship: 'Kollega'
          },
          address: {
            street: 'Adminveien 1',
            city: 'Oslo',
            postalCode: '0001'
          },
          permissions: {
            fullAccess: true,
            manageOwnDepartment: true,
            approveVacation: true,
            approveAbsence: true,
            manageShifts: true,
            handleDeviations: true,
            submitDeviations: true,
            submitAbsence: true,
            submitVacation: true,
            useChat: true,
            readDocuments: true,
            editOwnRequests: true
          },
          startDate: '2023-01-01',
          status: 'active',
          createdAt: '2023-01-01T08:00:00Z'
        }
      ];
      setEmployees(mockEmployees);
    } catch (error) {
      console.error('Error loading employees:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadDepartments = async () => {
    try {
      // Mock departments - replace with Firebase query
      const mockDepartments: Department[] = [
        { id: '1', name: 'IT', leader: '2' },
        { id: '2', name: 'HR', leader: '2' },
        { id: '3', name: 'Markedsføring', leader: null },
        { id: '4', name: 'Økonomi', leader: null },
        { id: '5', name: 'Produksjon', leader: null }
      ];
      setDepartments(mockDepartments);
    } catch (error) {
      console.error('Error loading departments:', error);
    }
  };

  const filterEmployees = () => {
    let filtered = employees;

    if (searchTerm) {
      filtered = filtered.filter(emp => 
        emp.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.position.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (departmentFilter) {
      filtered = filtered.filter(emp => emp.department === departmentFilter);
    }

    if (roleFilter) {
      filtered = filtered.filter(emp => emp.role === roleFilter);
    }

    setFilteredEmployees(filtered);
  };

  const handleRoleChange = (role: 'admin' | 'department_leader' | 'employee') => {
    setFormData(prev => ({
      ...prev,
      role,
      permissions: getDefaultPermissions(role)
    }));
  };

  const getDefaultPermissions = (role: 'admin' | 'department_leader' | 'employee') => {
    switch (role) {
      case 'admin':
        return {
          fullAccess: true,
          manageOwnDepartment: true,
          approveVacation: true,
          approveAbsence: true,
          manageShifts: true,
          handleDeviations: true,
          submitDeviations: true,
          submitAbsence: true,
          submitVacation: true,
          useChat: true,
          readDocuments: true,
          editOwnRequests: true,
        };
      case 'department_leader':
        return {
          fullAccess: false,
          manageOwnDepartment: true,
          approveVacation: true,
          approveAbsence: true,
          manageShifts: true,
          handleDeviations: true,
          submitDeviations: true,
          submitAbsence: true,
          submitVacation: true,
          useChat: true,
          readDocuments: true,
          editOwnRequests: true,
        };
      case 'employee':
        return {
          fullAccess: false,
          manageOwnDepartment: false,
          approveVacation: false,
          approveAbsence: false,
          manageShifts: false,
          handleDeviations: false,
          submitDeviations: true,
          submitAbsence: true,
          submitVacation: true,
          useChat: true,
          readDocuments: true,
          editOwnRequests: true,
        };
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const employeeData = {
        ...formData,
        status: 'active' as const,
        createdAt: new Date().toISOString()
      };

      // Add to Firebase
      if (!db) throw new Error('Firebase not initialized');
      const docRef = await addDoc(collection(db, 'employees'), employeeData);
      
      const newEmployee = { id: docRef.id, ...employeeData };
      setEmployees(prev => [...prev, newEmployee]);
      
      setShowAddModal(false);
      resetForm();
    } catch (error) {
      console.error('Error adding employee:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmployee) return;

    setSaving(true);
    try {
      // Update in Firebase
      if (!db) throw new Error('Firebase not initialized');
      await updateDoc(doc(db, 'employees', selectedEmployee.id), formData);
      
      setEmployees(prev => 
        prev.map(emp => 
          emp.id === selectedEmployee.id 
            ? { ...emp, ...formData }
            : emp
        )
      );
      
      setShowEditModal(false);
      setSelectedEmployee(null);
      resetForm();
    } catch (error) {
      console.error('Error updating employee:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (employeeId: string) => {
    if (!confirm('Er du sikker på at du vil slette denne ansatten?')) return;

    try {
      if (!db) throw new Error('Firebase not initialized');
      await deleteDoc(doc(db, 'employees', employeeId));
      setEmployees(prev => prev.filter(emp => emp.id !== employeeId));
    } catch (error) {
      console.error('Error deleting employee:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      department: '',
      position: '',
      role: 'employee',
      emergencyContact: {
        name: '',
        phone: '',
        relationship: ''
      },
      address: {
        street: '',
        city: '',
        postalCode: ''
      },
      startDate: '',
      permissions: getDefaultPermissions('employee')
    });
  };

  const openEditModal = (employee: Employee) => {
    setSelectedEmployee(employee);
    setFormData({
      firstName: employee.firstName,
      lastName: employee.lastName,
      email: employee.email,
      phone: employee.phone,
      department: employee.department,
      position: employee.position,
      role: employee.role,
      emergencyContact: employee.emergencyContact,
      address: employee.address,
      startDate: employee.startDate,
      permissions: employee.permissions
    });
    setShowEditModal(true);
  };

  const openPermissionsModal = (employee: Employee) => {
    setSelectedEmployee(employee);
    setFormData(prev => ({
      ...prev,
      permissions: employee.permissions
    }));
    setShowPermissionsModal(true);
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
          <h1 className="text-2xl font-bold text-gray-900">Ansatte</h1>
          <p className="text-gray-600">Administrer ansatte og deres tilganger</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
        >
          <Plus className="h-5 w-5" />
          <span>Legg til ansatt</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Søk etter ansatte..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Alle avdelinger</option>
            {departments.map(dept => (
              <option key={dept.id} value={dept.name}>{dept.name}</option>
            ))}
          </select>
          
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Alle roller</option>
            <option value="admin">Administrator</option>
            <option value="department_leader">Avdelingsleder</option>
            <option value="employee">Ansatt</option>
          </select>
          
          <div className="text-sm text-gray-500 flex items-center">
            {filteredEmployees.length} av {employees.length} ansatte
          </div>
        </div>
      </div>

      {/* Employees Table */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ansatt
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Avdeling
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rolle
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Startdato
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Handlinger
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredEmployees.map((employee) => (
                <tr key={employee.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                        <span className="text-white font-medium text-sm">
                          {employee.firstName.charAt(0)}{employee.lastName.charAt(0)}
                        </span>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {employee.firstName} {employee.lastName}
                        </div>
                        <div className="text-sm text-gray-500">{employee.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{employee.department}</div>
                    <div className="text-sm text-gray-500">{employee.position}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      employee.role === 'admin' 
                        ? 'bg-red-100 text-red-800'
                        : employee.role === 'department_leader'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {employee.role === 'admin' && 'Administrator'}
                      {employee.role === 'department_leader' && 'Avdelingsleder'}
                      {employee.role === 'employee' && 'Ansatt'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      employee.status === 'active' 
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {employee.status === 'active' ? 'Aktiv' : 'Inaktiv'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(employee.startDate).toLocaleDateString('nb-NO')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      {/* Dropdown Menu */}
                      <div className="relative dropdown-container">
                        <button
                          onClick={() => setSelectedEmployee(employee)}
                          className="text-gray-600 hover:text-gray-900 p-1 rounded-lg hover:bg-gray-100"
                          title="Flere handlinger"
                        >
                          <ChevronDown className="h-4 w-4" />
                        </button>
                        
                        {/* Dropdown Content */}
                        {selectedEmployee?.id === employee.id && (
                          <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
                            <div className="py-1">
                              <button
                                onClick={() => {
                                  setSelectedEmployee(employee);
                                  setShowDepartmentModal(true);
                                }}
                                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                              >
                                <Building className="h-4 w-4" />
                                <span>Endre avdeling</span>
                              </button>
                              
                              <button
                                onClick={() => {
                                  setSelectedEmployee(employee);
                                  setShowRoleModal(true);
                                }}
                                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                              >
                                <Shield className="h-4 w-4" />
                                <span>Endre rolle</span>
                              </button>
                              
                              <button
                                onClick={() => {
                                  setSelectedEmployee(employee);
                                  setShowStatusModal(true);
                                }}
                                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                              >
                                <UserCheck className="h-4 w-4" />
                                <span>Endre status</span>
                              </button>
                              
                              <hr className="my-1" />
                              
                              <button
                                onClick={() => openPermissionsModal(employee)}
                                className="w-full text-left px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 flex items-center space-x-2"
                              >
                                <Shield className="h-4 w-4" />
                                <span>Tilganger</span>
                              </button>
                              
                              <button
                                onClick={() => openEditModal(employee)}
                                className="w-full text-left px-4 py-2 text-sm text-indigo-600 hover:bg-indigo-50 flex items-center space-x-2"
                              >
                                <Edit className="h-4 w-4" />
                                <span>Rediger</span>
                              </button>
                              
                              <hr className="my-1" />
                              
                              <button
                                onClick={() => handleDelete(employee.id)}
                                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2"
                              >
                                <Trash2 className="h-4 w-4" />
                                <span>Slett</span>
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                      
                      {/* Quick Actions */}
                      <button
                        onClick={() => openPermissionsModal(employee)}
                        className="text-blue-600 hover:text-blue-900 p-1"
                        title="Tilganger"
                      >
                        <Shield className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => openEditModal(employee)}
                        className="text-indigo-600 hover:text-indigo-900 p-1"
                        title="Rediger"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Employee Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">Legg til ny ansatt</h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fornavn *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.firstName}
                    onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Etternavn *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.lastName}
                    onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    E-post *
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Telefon *
                  </label>
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Avdeling *
                  </label>
                  <select
                    required
                    value={formData.department}
                    onChange={(e) => setFormData(prev => ({ ...prev, department: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Velg avdeling</option>
                    {departments.map(dept => (
                      <option key={dept.id} value={dept.name}>{dept.name}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Stilling *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.position}
                    onChange={(e) => setFormData(prev => ({ ...prev, position: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Rolle *
                  </label>
                  <select
                    required
                    value={formData.role}
                    onChange={(e) => handleRoleChange(e.target.value as 'admin' | 'department_leader' | 'employee')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="employee">Ansatt</option>
                    <option value="department_leader">Avdelingsleder</option>
                    <option value="admin">Administrator</option>
                  </select>
                </div>
              </div>

              {/* Emergency Contact */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Nødkontakt</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Navn
                    </label>
                    <input
                      type="text"
                      value={formData.emergencyContact.name}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        emergencyContact: { ...prev.emergencyContact, name: e.target.value }
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Telefon
                    </label>
                    <input
                      type="tel"
                      value={formData.emergencyContact.phone}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        emergencyContact: { ...prev.emergencyContact, phone: e.target.value }
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Forhold
                    </label>
                    <input
                      type="text"
                      value={formData.emergencyContact.relationship}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        emergencyContact: { ...prev.emergencyContact, relationship: e.target.value }
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Address */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Adresse</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Gateadresse
                    </label>
                    <input
                      type="text"
                      value={formData.address.street}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        address: { ...prev.address, street: e.target.value }
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      By
                    </label>
                    <input
                      type="text"
                      value={formData.address.city}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        address: { ...prev.address, city: e.target.value }
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Postnummer
                    </label>
                    <input
                      type="text"
                      value={formData.address.postalCode}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        address: { ...prev.address, postalCode: e.target.value }
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Permissions Preview */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Tilganger</h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Object.entries(formData.permissions).map(([key, value]) => (
                      <div key={key} className="flex items-center space-x-2">
                        {value ? (
                          <Check className="h-4 w-4 text-green-600" />
                        ) : (
                          <XIcon className="h-4 w-4 text-red-600" />
                        )}
                        <span className="text-sm text-gray-700">
                          {key === 'fullAccess' && 'Full tilgang'}
                          {key === 'manageOwnDepartment' && 'Administrer egen avdeling'}
                          {key === 'approveVacation' && 'Godkjenn ferie'}
                          {key === 'approveAbsence' && 'Godkjenn fravær'}
                          {key === 'manageShifts' && 'Administrer skift'}
                          {key === 'handleDeviations' && 'Håndter avvik'}
                          {key === 'submitDeviations' && 'Send avvik'}
                          {key === 'submitAbsence' && 'Send fravær'}
                          {key === 'submitVacation' && 'Send ferie'}
                          {key === 'useChat' && 'Bruk chat'}
                          {key === 'readDocuments' && 'Les dokumenter'}
                          {key === 'editOwnRequests' && 'Rediger egne forespørsler'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end space-x-4 pt-6 border-t">
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
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center space-x-2"
                >
                  {saving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Lagrer...</span>
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      <span>Lagre ansatt</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Employee Modal */}
      {showEditModal && selectedEmployee && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">Rediger ansatt</h2>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <form onSubmit={handleUpdate} className="space-y-6">
              {/* Same form fields as Add Modal */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fornavn *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.firstName}
                    onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Etternavn *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.lastName}
                    onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    E-post *
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Telefon *
                  </label>
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Avdeling *
                  </label>
                  <select
                    required
                    value={formData.department}
                    onChange={(e) => setFormData(prev => ({ ...prev, department: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Velg avdeling</option>
                    {departments.map(dept => (
                      <option key={dept.id} value={dept.name}>{dept.name}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Stilling *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.position}
                    onChange={(e) => setFormData(prev => ({ ...prev, position: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Rolle *
                  </label>
                  <select
                    required
                    value={formData.role}
                    onChange={(e) => handleRoleChange(e.target.value as 'admin' | 'department_leader' | 'employee')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="employee">Ansatt</option>
                    <option value="department_leader">Avdelingsleder</option>
                    <option value="admin">Administrator</option>
                  </select>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end space-x-4 pt-6 border-t">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Avbryt
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center space-x-2"
                >
                  {saving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Lagrer...</span>
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      <span>Oppdater ansatt</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Permissions Modal */}
      {showPermissionsModal && selectedEmployee && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">Tilganger for {selectedEmployee.firstName} {selectedEmployee.lastName}</h2>
              <button
                onClick={() => setShowPermissionsModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="space-y-6">
              {/* Quick Actions */}
              <div className="flex space-x-4">
                <button
                  onClick={() => {
                    const allTrue = Object.keys(formData.permissions).reduce((acc, key) => {
                      acc[key as keyof typeof formData.permissions] = true;
                      return acc;
                    }, {} as typeof formData.permissions);
                    setFormData(prev => ({ ...prev, permissions: allTrue }));
                  }}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
                >
                  Aktiver alle
                </button>
                <button
                  onClick={() => {
                    const allFalse = Object.keys(formData.permissions).reduce((acc, key) => {
                      acc[key as keyof typeof formData.permissions] = false;
                      return acc;
                    }, {} as typeof formData.permissions);
                    setFormData(prev => ({ ...prev, permissions: allFalse }));
                  }}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"
                >
                  Deaktiver alle
                </button>
                <button
                  onClick={() => {
                    const defaultPerms = getDefaultPermissions(selectedEmployee.role);
                    setFormData(prev => ({ ...prev, permissions: defaultPerms }));
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                >
                  Standard for rolle
                </button>
              </div>

              {/* Permissions List */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Tilganger</h3>
                <div className="space-y-3">
                  {Object.entries(formData.permissions).map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                      <div className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          checked={value}
                          onChange={(e) => {
                            setFormData(prev => ({
                              ...prev,
                              permissions: { ...prev.permissions, [key]: e.target.checked }
                            }));
                          }}
                          className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <span className="text-sm font-medium text-gray-700">
                          {key === 'fullAccess' && 'Full tilgang til alt'}
                          {key === 'manageOwnDepartment' && 'Administrer egen avdeling'}
                          {key === 'approveVacation' && 'Godkjenn ferieforespørsler'}
                          {key === 'approveAbsence' && 'Godkjenn fraværsforespørsler'}
                          {key === 'manageShifts' && 'Administrer skiftplaner'}
                          {key === 'handleDeviations' && 'Håndter avviksrapporter'}
                          {key === 'submitDeviations' && 'Send avviksrapporter'}
                          {key === 'submitAbsence' && 'Send fraværsforespørsler'}
                          {key === 'submitVacation' && 'Send ferieforespørsler'}
                          {key === 'useChat' && 'Bruk chat-system'}
                          {key === 'readDocuments' && 'Les delte dokumenter'}
                          {key === 'editOwnRequests' && 'Rediger egne forespørsler'}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500">
                        {value ? '✅ Aktiv' : '❌ Inaktiv'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Summary */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">Sammendrag</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Aktive tilganger:</span>
                    <span className="ml-2 font-medium text-green-600">
                      {Object.values(formData.permissions).filter(Boolean).length}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Totalt tilganger:</span>
                    <span className="ml-2 font-medium text-gray-900">
                      {Object.keys(formData.permissions).length}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Nåværende rolle:</span>
                    <span className="ml-2 font-medium text-blue-600">
                      {selectedEmployee.role === 'admin' && 'Administrator'}
                      {selectedEmployee.role === 'department_leader' && 'Avdelingsleder'}
                      {selectedEmployee.role === 'employee' && 'Ansatt'}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Status:</span>
                    <span className={`ml-2 font-medium ${
                      selectedEmployee.status === 'active' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {selectedEmployee.status === 'active' ? 'Aktiv' : 'Inaktiv'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-4 pt-6 border-t mt-6">
              <button
                type="button"
                onClick={() => setShowPermissionsModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Avbryt
              </button>
              <button
                onClick={async () => {
                  try {
                    if (!db) throw new Error('Firebase not initialized');
                    await updateDoc(doc(db, 'employees', selectedEmployee.id), {
                      permissions: formData.permissions
                    });
                    setEmployees(prev => 
                      prev.map(emp => 
                        emp.id === selectedEmployee.id 
                          ? { ...emp, permissions: formData.permissions }
                          : emp
                      )
                    );
                    setShowPermissionsModal(false);
                  } catch (error) {
                    console.error('Error updating permissions:', error);
                  }
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2"
              >
                <Save className="h-4 w-4" />
                <span>Lagre tilganger</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Department Change Modal */}
      {showDepartmentModal && selectedEmployee && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">Endre avdeling</h2>
              <button
                onClick={() => setShowDepartmentModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ansatt
                </label>
                <p className="text-sm text-gray-900">
                  {selectedEmployee.firstName} {selectedEmployee.lastName}
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nåværende avdeling
                </label>
                <p className="text-sm text-gray-900">{selectedEmployee.department}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ny avdeling *
                </label>
                <select
                  value={formData.department}
                  onChange={(e) => setFormData(prev => ({ ...prev, department: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Velg avdeling</option>
                  {departments.map(dept => (
                    <option key={dept.id} value={dept.name}>{dept.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end space-x-4 mt-6">
              <button
                onClick={() => setShowDepartmentModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Avbryt
              </button>
              <button
                onClick={async () => {
                  try {
                    if (!db) throw new Error('Firebase not initialized');
                    await updateDoc(doc(db, 'employees', selectedEmployee.id), {
                      department: formData.department
                    });
                    setEmployees(prev => 
                      prev.map(emp => 
                        emp.id === selectedEmployee.id 
                          ? { ...emp, department: formData.department }
                          : emp
                      )
                    );
                    setShowDepartmentModal(false);
                  } catch (error) {
                    console.error('Error updating department:', error);
                  }
                }}
                disabled={!formData.department}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                Oppdater avdeling
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Role Change Modal */}
      {showRoleModal && selectedEmployee && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">Endre rolle</h2>
              <button
                onClick={() => setShowRoleModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ansatt
                </label>
                <p className="text-sm text-gray-900">
                  {selectedEmployee.firstName} {selectedEmployee.lastName}
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nåværende rolle
                </label>
                <p className="text-sm text-gray-900">
                  {selectedEmployee.role === 'admin' && 'Administrator'}
                  {selectedEmployee.role === 'department_leader' && 'Avdelingsleder'}
                  {selectedEmployee.role === 'employee' && 'Ansatt'}
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ny rolle *
                </label>
                <select
                  value={formData.role}
                  onChange={(e) => handleRoleChange(e.target.value as 'admin' | 'department_leader' | 'employee')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="employee">Ansatt</option>
                  <option value="department_leader">Avdelingsleder</option>
                  <option value="admin">Administrator</option>
                </select>
              </div>
              
              <div className="bg-yellow-50 p-4 rounded-lg">
                <p className="text-sm text-yellow-800">
                  <strong>Advarsel:</strong> Endring av rolle vil oppdatere alle tilganger automatisk.
                </p>
              </div>
            </div>

            <div className="flex justify-end space-x-4 mt-6">
              <button
                onClick={() => setShowRoleModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Avbryt
              </button>
              <button
                onClick={async () => {
                  try {
                    if (!db) throw new Error('Firebase not initialized');
                    await updateDoc(doc(db, 'employees', selectedEmployee.id), {
                      role: formData.role,
                      permissions: formData.permissions
                    });
                    setEmployees(prev => 
                      prev.map(emp => 
                        emp.id === selectedEmployee.id 
                          ? { ...emp, role: formData.role, permissions: formData.permissions }
                          : emp
                      )
                    );
                    setShowRoleModal(false);
                  } catch (error) {
                    console.error('Error updating role:', error);
                  }
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Oppdater rolle
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Status Change Modal */}
      {showStatusModal && selectedEmployee && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">Endre status</h2>
              <button
                onClick={() => setShowStatusModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ansatt
                </label>
                <p className="text-sm text-gray-900">
                  {selectedEmployee.firstName} {selectedEmployee.lastName}
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nåværende status
                </label>
                <p className="text-sm text-gray-900">
                  {selectedEmployee.status === 'active' ? 'Aktiv' : 'Inaktiv'}
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ny status *
                </label>
                <select
                  value={selectedEmployee.status === 'active' ? 'inactive' : 'active'}
                  onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as 'active' | 'inactive' }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="active">Aktiv</option>
                  <option value="inactive">Inaktiv</option>
                </select>
              </div>
              
              {selectedEmployee.status === 'active' && (
                <div className="bg-red-50 p-4 rounded-lg">
                  <p className="text-sm text-red-800">
                    <strong>Advarsel:</strong> Inaktive ansatte vil ikke ha tilgang til systemet.
                  </p>
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-4 mt-6">
              <button
                onClick={() => setShowStatusModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Avbryt
              </button>
              <button
                onClick={async () => {
                  try {
                    if (!db) throw new Error('Firebase not initialized');
                    const newStatus = selectedEmployee.status === 'active' ? 'inactive' : 'active';
                    await updateDoc(doc(db, 'employees', selectedEmployee.id), {
                      status: newStatus
                    });
                    setEmployees(prev => 
                      prev.map(emp => 
                        emp.id === selectedEmployee.id 
                          ? { ...emp, status: newStatus }
                          : emp
                      )
                    );
                    setShowStatusModal(false);
                  } catch (error) {
                    console.error('Error updating status:', error);
                  }
                }}
                className={`px-4 py-2 text-white rounded-lg ${
                  selectedEmployee.status === 'active' 
                    ? 'bg-red-600 hover:bg-red-700' 
                    : 'bg-green-600 hover:bg-green-700'
                }`}
              >
                {selectedEmployee.status === 'active' ? 'Deaktiver' : 'Aktiver'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 