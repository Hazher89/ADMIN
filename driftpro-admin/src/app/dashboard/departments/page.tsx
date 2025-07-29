'use client';

import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Users,
  Building,
  Save,
  X
} from 'lucide-react';
import { collection, doc, getDocs, addDoc, updateDoc, deleteDoc, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  department: string;
  role: 'admin' | 'department_leader' | 'employee';
  status: 'active' | 'inactive';
}

interface Department {
  id: string;
  name: string;
  description: string;
  leaders: string[]; // Array of employee IDs who are leaders
  employeeCount: number;
  location: string;
  phone: string;
  email: string;
  status: 'active' | 'inactive';
  createdAt: string;
}

interface DepartmentWithEmployees extends Department {
  employees: Employee[];
}

export default function DepartmentsPage() {
  const [departments, setDepartments] = useState<DepartmentWithEmployees[]>([]);
  const [filteredDepartments, setFilteredDepartments] = useState<DepartmentWithEmployees[]>([]);
  const [allEmployees, setAllEmployees] = useState<Employee[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDepartmentDetailModal, setShowDepartmentDetailModal] = useState(false);
  const [showMoveEmployeeModal, setShowMoveEmployeeModal] = useState(false);
  const [showManageLeadersModal, setShowManageLeadersModal] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState<DepartmentWithEmployees | null>(null);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState<DepartmentWithEmployees | null>(null);
  const [showEmployeeDetailModal, setShowEmployeeDetailModal] = useState(false);
  const [selectedEmployeeForDetail, setSelectedEmployeeForDetail] = useState<Employee | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingDepartment, setDeletingDepartment] = useState<DepartmentWithEmployees | null>(null);

  // Form data for adding/editing departments
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    location: '',
    phone: '',
    email: '',
    status: 'active' as 'active' | 'inactive'
  });

  // Form data for moving employees
  const [moveFormData, setMoveFormData] = useState({
    targetDepartment: ''
  });

  // Form data for managing leaders
  const [leadersFormData, setLeadersFormData] = useState({
    selectedLeaders: [] as string[]
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterDepartments();
  }, [departments, searchTerm]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load employees from Firebase
      if (db) {
        try {
          const employeesSnapshot = await getDocs(collection(db, 'employees'));
          const employeesData = employeesSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as Employee[];
          setAllEmployees(employeesData);
          
          // Load departments from Firebase
          const departmentsSnapshot = await getDocs(collection(db, 'departments'));
          const departmentsData = departmentsSnapshot.docs.map(doc => {
            const data = doc.data();
            return {
              id: doc.id,
              name: data.name || 'Ukjent avdeling',
              description: data.description || '',
              leaders: data.leaders || [],
              employeeCount: data.employeeCount || 0,
              location: data.location || '',
              phone: data.phone || '',
              email: data.email || '',
              status: data.status || 'active',
              createdAt: data.createdAt || new Date().toISOString(),
              employees: [] // Initialize empty employees array
            } as Department;
          });
          
          // Combine departments with their employees
          const departmentsWithEmployees = departmentsData.map(dept => ({
            ...dept,
            employees: employeesData.filter(emp => emp.department === dept.name) || []
          }));
          
          setDepartments(departmentsWithEmployees);
          console.log('Data loaded from Firebase successfully');
        } catch (firebaseError) {
          console.error('Firebase error, falling back to mock data:', firebaseError);
          loadMockData();
        }
      } else {
        console.log('Firebase not available, using mock data');
        loadMockData();
      }
    } catch (error) {
      console.error('Error loading data:', error);
      loadMockData();
    } finally {
      setLoading(false);
    }
  };

  const loadMockData = () => {
    const mockEmployees: Employee[] = [
      { id: '1', firstName: 'Ola', lastName: 'Nordmann', email: 'ola@driftpro.no', department: 'IT', role: 'employee', status: 'active' },
      { id: '2', firstName: 'Kari', lastName: 'Hansen', email: 'kari@driftpro.no', department: 'HR', role: 'department_leader', status: 'active' },
      { id: '3', firstName: 'Admin', lastName: 'Bruker', email: 'admin@driftpro.no', department: 'Administrasjon', role: 'admin', status: 'active' },
      { id: '4', firstName: 'Per', lastName: 'Olsen', email: 'per@driftpro.no', department: 'IT', role: 'department_leader', status: 'active' },
      { id: '5', firstName: 'Anne', lastName: 'Berg', email: 'anne@driftpro.no', department: 'HR', role: 'employee', status: 'active' },
    ];

    const mockDepartments: DepartmentWithEmployees[] = [
      {
        id: '1',
        name: 'IT',
        description: 'Informasjonsteknologi og systemutvikling',
        leaders: ['4'], // Per Olsen
        employeeCount: 2,
        location: '2. etasje, kontor 201-215',
        phone: '+47 123 45 678',
        email: 'it@driftpro.no',
        status: 'active',
        createdAt: '2024-01-01T00:00:00Z',
        employees: mockEmployees.filter(emp => emp.department === 'IT')
      },
      {
        id: '2',
        name: 'HR',
        description: 'Menneskelige ressurser og personaladministrasjon',
        leaders: ['2'], // Kari Hansen
        employeeCount: 2,
        location: '1. etasje, kontor 101-108',
        phone: '+47 234 56 789',
        email: 'hr@driftpro.no',
        status: 'active',
        createdAt: '2024-01-01T00:00:00Z',
        employees: mockEmployees.filter(emp => emp.department === 'HR')
      },
      {
        id: '3',
        name: 'Administrasjon',
        description: 'Administrasjon og ledelse',
        leaders: ['3'], // Admin Bruker
        employeeCount: 1,
        location: '3. etasje, kontor 301',
        phone: '+47 345 67 890',
        email: 'admin@driftpro.no',
        status: 'active',
        createdAt: '2024-01-01T00:00:00Z',
        employees: mockEmployees.filter(emp => emp.department === 'Administrasjon')
      }
    ];

    setAllEmployees(mockEmployees);
    setDepartments(mockDepartments);
  };

  const filterDepartments = () => {
    let filtered = departments;

    if (searchTerm) {
      filtered = filtered.filter(dept =>
        dept.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        dept.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        dept.leaders.some(leaderId => {
          const leader = allEmployees.find(emp => emp.id === leaderId);
          return leader && `${leader.firstName} ${leader.lastName}`.toLowerCase().includes(searchTerm.toLowerCase());
        })
      );
    }

    setFilteredDepartments(filtered);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      
      if (db) {
        try {
          const newDepartment = {
            ...formData,
            leaders: [],
            employeeCount: 0,
            createdAt: new Date().toISOString()
          };
          
          await addDoc(collection(db, 'departments'), newDepartment);
          console.log('Department added to Firebase successfully');
        } catch (firebaseError) {
          console.error('Firebase error adding department:', firebaseError);
          // Still close modal and reset form even if Firebase fails
        }
      } else {
        console.log('Firebase not available, department not saved');
      }
      
      setShowAddModal(false);
      resetForm();
      loadData();
    } catch (error) {
      console.error('Error adding department:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleMoveEmployee = async () => {
    if (!selectedEmployee || !moveFormData.targetDepartment) return;
    
    try {
      setSaving(true);
      
      if (db) {
        try {
          await updateDoc(doc(db, 'employees', selectedEmployee.id), {
            department: moveFormData.targetDepartment
          });
          console.log('Employee moved in Firebase successfully');
        } catch (firebaseError) {
          console.error('Firebase error moving employee:', firebaseError);
          // Still close modal even if Firebase fails
        }
      } else {
        console.log('Firebase not available, employee not moved');
      }
      
      setShowMoveEmployeeModal(false);
      setSelectedEmployee(null);
      setMoveFormData({ targetDepartment: '' });
      loadData();
    } catch (error) {
      console.error('Error moving employee:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleManageLeaders = async () => {
    if (!selectedDepartment) return;
    
    try {
      setSaving(true);
      
      if (db) {
        try {
          await updateDoc(doc(db, 'departments', selectedDepartment.id), {
            leaders: leadersFormData.selectedLeaders
          });
          console.log('Leaders updated in Firebase successfully');
        } catch (firebaseError) {
          console.error('Firebase error updating leaders:', firebaseError);
          // Still close modal even if Firebase fails
        }
      } else {
        console.log('Firebase not available, leaders not updated');
      }
      
      setShowManageLeadersModal(false);
      setSelectedDepartment(null);
      setLeadersFormData({ selectedLeaders: [] });
      loadData();
    } catch (error) {
      console.error('Error updating leaders:', error);
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      location: '',
      phone: '',
      email: '',
      status: 'active'
    });
  };

  const openDepartmentDetail = (department: DepartmentWithEmployees) => {
    setSelectedDepartment(department);
    setShowDepartmentDetailModal(true);
  };

  const openMoveEmployeeModal = (employee: Employee) => {
    setSelectedEmployee(employee);
    setShowMoveEmployeeModal(true);
  };

  const openManageLeadersModal = (department: DepartmentWithEmployees) => {
    setSelectedDepartment(department);
    setLeadersFormData({ selectedLeaders: department.leaders });
    setShowManageLeadersModal(true);
  };

  const openEditDepartment = (department: DepartmentWithEmployees) => {
    setEditingDepartment(department);
    setFormData({
      name: department.name,
      description: department.description,
      location: department.location,
      phone: department.phone,
      email: department.email,
      status: department.status
    });
    setShowEditModal(true);
  };

  const openEmployeeDetail = (employee: Employee) => {
    setSelectedEmployeeForDetail(employee);
    setShowEmployeeDetailModal(true);
  };

  const handleEditDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDepartment || !db) return;

    try {
      setSaving(true);
      const departmentRef = doc(db, 'departments', editingDepartment.id);
      await updateDoc(departmentRef, {
        name: formData.name,
        description: formData.description,
        location: formData.location,
        phone: formData.phone,
        email: formData.email,
        status: formData.status,
        updatedAt: new Date().toISOString()
      });

      // Update local state
      setDepartments(prev => prev.map(dept => 
        dept.id === editingDepartment.id 
          ? { ...dept, ...formData }
          : dept
      ));

      setShowEditModal(false);
      setEditingDepartment(null);
      resetForm();
    } catch (error) {
      console.error('Error updating department:', error);
    } finally {
      setSaving(false);
    }
  };

  const getLeaderNames = (leaderIds: string[] | undefined) => {
    if (!leaderIds || !Array.isArray(leaderIds)) {
      return 'Ingen leder';
    }
    return leaderIds.map(id => {
      const leader = allEmployees.find(emp => emp.id === id);
      return leader ? `${leader.firstName} ${leader.lastName}` : 'Ukjent';
    }).join(', ') || 'Ingen leder';
  };

  const openDeleteDepartment = (department: DepartmentWithEmployees) => {
    setDeletingDepartment(department);
    setShowDeleteModal(true);
  };

  const handleDeleteDepartment = async () => {
    if (!deletingDepartment || !db) return;

    try {
      setSaving(true);
      
      // Check if department has employees
      if (deletingDepartment.employees.length > 0) {
        alert('Kan ikke slette avdeling med ansatte. Flytt alle ansatte først.');
        return;
      }

      // Delete from Firebase
      const departmentRef = doc(db, 'departments', deletingDepartment.id);
      await deleteDoc(departmentRef);

      // Update local state
      setDepartments(prev => prev.filter(dept => dept.id !== deletingDepartment.id));

      setShowDeleteModal(false);
      setDeletingDepartment(null);
    } catch (error) {
      console.error('Error deleting department:', error);
      alert('Feil ved sletting av avdeling. Prøv igjen.');
    } finally {
      setSaving(false);
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
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Avdelinger</h1>
            <p className="text-gray-600">Administrer bedriftens avdelinger og ledere</p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
          >
            <Plus className="h-4 w-4" />
            <span>Legg til avdeling</span>
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Søk etter avdeling, leder..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      {/* Departments Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredDepartments.map((department) => (
          <div key={department.id} className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-lg transition-all duration-200 cursor-pointer group">
            <div className="p-6">
              {/* Header with actions */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Building className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">{department.name}</h3>
                    <p className="text-sm text-gray-500">{department.employees?.length || 0} ansatte</p>
                  </div>
                </div>
                <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={(e) => { e.stopPropagation(); openDepartmentDetail(department); }}
                    className="text-blue-600 hover:text-blue-900 p-2 rounded-lg hover:bg-blue-50 transition-colors" 
                    title="Se detaljer"
                  >
                    {/* <Eye className="h-4 w-4" /> */}
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); openEditDepartment(department); }}
                    className="text-green-600 hover:text-green-900 p-2 rounded-lg hover:bg-green-50 transition-colors" 
                    title="Rediger avdeling"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); openManageLeadersModal(department); }}
                    className="text-yellow-600 hover:text-yellow-900 p-2 rounded-lg hover:bg-yellow-50 transition-colors" 
                    title="Administrer ledere"
                  >
                    {/* <Crown className="h-4 w-4" /> */}
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); openDeleteDepartment(department); }}
                    className="text-red-600 hover:text-red-900 p-2 rounded-lg hover:bg-red-50 transition-colors" 
                    title="Slett avdeling"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <p className="text-gray-600 mb-4 line-clamp-2">{department.description}</p>

              {/* Quick info */}
              <div className="space-y-2 mb-4">
                <div className="flex items-center space-x-2">
                  {/* <Crown className="h-4 w-4 text-yellow-600" /> */}
                  <span className="text-sm text-gray-900">
                    Leder: {getLeaderNames(department.leaders) || 'Ingen leder'}
                  </span>
                </div>

                <div className="flex items-center space-x-2">
                  {/* <MapPin className="h-4 w-4 text-gray-400" /> */}
                  <span className="text-sm text-gray-600 truncate">{department.location}</span>
                </div>
              </div>

              {/* Employee preview */}
              {department.employees && department.employees.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Ansatte:</h4>
                  <div className="flex flex-wrap gap-1">
                    {department.employees.slice(0, 3).map((employee) => (
                      <div 
                        key={employee.id}
                        onClick={(e) => { e.stopPropagation(); openEmployeeDetail(employee); }}
                        className="flex items-center space-x-1 bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded-full text-xs cursor-pointer transition-colors"
                        title={`${employee.firstName} ${employee.lastName} - ${employee.role}`}
                      >
                        <div className="w-4 h-4 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                          <span className="text-white font-medium text-xs">
                            {employee.firstName.charAt(0)}
                          </span>
                        </div>
                        <span className="text-gray-700">{employee.firstName}</span>
                        <span className={`w-2 h-2 rounded-full ${
                          employee.role === 'admin' ? 'bg-red-500' :
                          employee.role === 'department_leader' ? 'bg-yellow-500' :
                          'bg-blue-500'
                        }`}></span>
                      </div>
                    ))}
                    {department.employees.length > 3 && (
                      <div className="bg-gray-100 px-2 py-1 rounded-full text-xs text-gray-600">
                        +{department.employees.length - 3} flere
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Status and contact */}
              <div className="pt-4 border-t border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-500">Status</span>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    department.status === 'active' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {department.status === 'active' ? 'Aktiv' : 'Inaktiv'}
                  </span>
                </div>
                <div className="flex items-center space-x-2 text-xs text-gray-500">
                  {/* <Phone className="h-3 w-3" /> */}
                  <span className="truncate">{department.phone}</span>
                </div>
              </div>

              {/* Click to view details */}
              <div className="mt-4 pt-3 border-t border-gray-100">
                <button
                  onClick={() => openDepartmentDetail(department)}
                  className="w-full text-center text-sm text-blue-600 hover:text-blue-700 font-medium py-2 rounded-lg hover:bg-blue-50 transition-colors"
                >
                  Se alle detaljer →
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add Department Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">Legg til ny avdeling</h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Avdelingsnavn *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Beskrivelse</label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Lokasjon</label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Telefon</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">E-post</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as 'active' | 'inactive' }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="active">Aktiv</option>
                  <option value="inactive">Inaktiv</option>
                </select>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 transition-colors"
                >
                  Avbryt
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
                >
                  {saving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Lagrer...</span>
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4" />
                      <span>Legg til</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Department Modal */}
      {showEditModal && editingDepartment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">Rediger avdeling</h2>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleEditDepartment} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Avdelingsnavn *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Beskrivelse</label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Lokasjon</label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Telefon</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">E-post</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as 'active' | 'inactive' }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="active">Aktiv</option>
                  <option value="inactive">Inaktiv</option>
                </select>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 transition-colors"
                >
                  Avbryt
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
                >
                  {saving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Lagrer...</span>
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      <span>Lagre endringer</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Department Detail Modal */}
      {showDepartmentDetailModal && selectedDepartment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900">{selectedDepartment.name}</h2>
              <button
                onClick={() => setShowDepartmentDetailModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Department Info */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900">Avdelingsinformasjon</h3>
                
                <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                  <div>
                    <span className="text-sm font-medium text-gray-700">Beskrivelse:</span>
                    <p className="text-sm text-gray-600 mt-1">{selectedDepartment.description}</p>
                  </div>
                  
                  <div>
                    <span className="text-sm font-medium text-gray-700">Lokasjon:</span>
                    <p className="text-sm text-gray-600 mt-1">{selectedDepartment.location}</p>
                  </div>
                  
                  <div>
                    <span className="text-sm font-medium text-gray-700">Telefon:</span>
                    <p className="text-sm text-gray-600 mt-1">{selectedDepartment.phone}</p>
                  </div>
                  
                  <div>
                    <span className="text-sm font-medium text-gray-700">E-post:</span>
                    <p className="text-sm text-gray-600 mt-1">{selectedDepartment.email}</p>
                  </div>
                  
                  <div>
                    <span className="text-sm font-medium text-gray-700">Status:</span>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ml-2 ${
                      selectedDepartment.status === 'active' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {selectedDepartment.status === 'active' ? 'Aktiv' : 'Inaktiv'}
                    </span>
                  </div>
                </div>

                <div className="flex space-x-3">
                  <button
                    onClick={() => openManageLeadersModal(selectedDepartment)}
                    className="flex-1 bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 transition-colors flex items-center justify-center space-x-2"
                  >
                    {/* <Crown className="h-4 w-4" /> */}
                    <span>Administrer ledere</span>
                  </button>
                  <button
                    onClick={() => openDeleteDepartment(selectedDepartment)}
                    className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center space-x-2"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span>Slett avdeling</span>
                  </button>
                </div>
              </div>

              {/* Employees List */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-gray-900">Ansatte ({selectedDepartment.employees.length})</h3>
                </div>

                <div className="space-y-3">
                  {selectedDepartment.employees.length > 0 ? (
                    selectedDepartment.employees.map((employee) => (
                      <div key={employee.id} className="bg-gray-50 p-4 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                              <span className="text-white font-medium text-sm">
                                {employee.firstName.charAt(0)}{employee.lastName.charAt(0)}
                              </span>
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">
                                {employee.firstName} {employee.lastName}
                              </p>
                              <p className="text-sm text-gray-600">{employee.email}</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              employee.role === 'admin' ? 'bg-red-100 text-red-800' :
                              employee.role === 'department_leader' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-blue-100 text-blue-800'
                            }`}>
                              {employee.role === 'admin' ? 'Admin' :
                               employee.role === 'department_leader' ? 'Leder' : 'Ansatt'}
                            </span>
                            <button
                              onClick={() => openMoveEmployeeModal(employee)}
                              className="text-blue-600 hover:text-blue-900 p-1"
                              title="Flytt til annen avdeling"
                            >
                              {/* <ArrowRight className="h-4 w-4" /> */}
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p>Ingen ansatte i denne avdelingen</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Move Employee Modal */}
      {showMoveEmployeeModal && selectedEmployee && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">Flytt ansatt</h2>
              <button
                onClick={() => setShowMoveEmployeeModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="mb-4">
              <p className="text-gray-600">
                Flytt <strong>{selectedEmployee.firstName} {selectedEmployee.lastName}</strong> til en annen avdeling
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Velg avdeling</label>
                <select
                  value={moveFormData.targetDepartment}
                  onChange={(e) => setMoveFormData(prev => ({ ...prev, targetDepartment: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Velg avdeling...</option>
                  {departments
                    .filter(dept => dept.name !== selectedEmployee.department)
                    .map(dept => (
                      <option key={dept.id} value={dept.name}>{dept.name}</option>
                    ))
                  }
                </select>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowMoveEmployeeModal(false)}
                  className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 transition-colors"
                >
                  Avbryt
                </button>
                <button
                  onClick={handleMoveEmployee}
                  disabled={!moveFormData.targetDepartment || saving}
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
                >
                  {saving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Flytter...</span>
                    </>
                  ) : (
                    <>
                      {/* <ArrowRight className="h-4 w-4" /> */}
                      <span>Flytt ansatt</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Manage Leaders Modal */}
      {showManageLeadersModal && selectedDepartment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900">Administrer ledere for {selectedDepartment.name}</h2>
              <button
                onClick={() => setShowManageLeadersModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-4">
              <p className="text-gray-600">
                Velg ansatte som skal være ledere for denne avdelingen. Du kan velge flere ledere.
              </p>

              <div className="space-y-3">
                {allEmployees.length > 0 ? (
                  allEmployees.map((employee) => (
                    <div key={employee.id} className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg">
                      <input
                        type="checkbox"
                        checked={leadersFormData.selectedLeaders.includes(employee.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setLeadersFormData(prev => ({
                              ...prev,
                              selectedLeaders: [...prev.selectedLeaders, employee.id]
                            }));
                          } else {
                            setLeadersFormData(prev => ({
                              ...prev,
                              selectedLeaders: prev.selectedLeaders.filter(id => id !== employee.id)
                            }));
                          }
                        }}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                          <span className="text-white font-medium text-xs">
                            {employee.firstName.charAt(0)}{employee.lastName.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {employee.firstName} {employee.lastName}
                          </p>
                          <p className="text-sm text-gray-600">{employee.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          employee.role === 'admin' ? 'bg-red-100 text-red-800' :
                          employee.role === 'department_leader' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {employee.role === 'admin' ? 'Admin' :
                           employee.role === 'department_leader' ? 'Leder' : 'Ansatt'}
                        </span>
                        <span className="text-xs text-gray-500">
                          {employee.department}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>Ingen ansatte tilgjengelig</p>
                    <p className="text-sm">Legg til ansatte først for å kunne velge ledere</p>
                  </div>
                )}
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowManageLeadersModal(false)}
                  className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 transition-colors"
                >
                  Avbryt
                </button>
                <button
                  onClick={handleManageLeaders}
                  disabled={saving}
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
                >
                  {saving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Lagrer...</span>
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      <span>Lagre ledere</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Employee Detail Modal */}
      {showEmployeeDetailModal && selectedEmployeeForDetail && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900">Ansatt detaljer</h2>
              <button
                onClick={() => setShowEmployeeDetailModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Employee Info */}
              <div className="lg:col-span-2 space-y-6">
                {/* Basic Info */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center space-x-4 mb-4">
                    <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                      <span className="text-white font-bold text-lg">
                        {selectedEmployeeForDetail.firstName.charAt(0)}{selectedEmployeeForDetail.lastName.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">
                        {selectedEmployeeForDetail.firstName} {selectedEmployeeForDetail.lastName}
                      </h3>
                      <p className="text-gray-600">{selectedEmployeeForDetail.email}</p>
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium mt-2 ${
                        selectedEmployeeForDetail.role === 'admin' ? 'bg-red-100 text-red-800' :
                        selectedEmployeeForDetail.role === 'department_leader' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {selectedEmployeeForDetail.role === 'admin' ? 'Administrator' :
                         selectedEmployeeForDetail.role === 'department_leader' ? 'Avdelingsleder' : 'Ansatt'}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-sm font-medium text-gray-700">Avdeling:</span>
                      <p className="text-sm text-gray-900">{selectedEmployeeForDetail.department}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-700">Status:</span>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        selectedEmployeeForDetail.status === 'active' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {selectedEmployeeForDetail.status === 'active' ? 'Aktiv' : 'Inaktiv'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Contact Info */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="text-lg font-medium text-gray-900 mb-3">Kontaktinformasjon</h4>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-3">
                      {/* <Mail className="h-4 w-4 text-gray-400" /> */}
                      <span className="text-sm text-gray-600">{selectedEmployeeForDetail.email}</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      {/* <Building className="h-4 w-4 text-gray-400" /> */}
                      <span className="text-sm text-gray-600">{selectedEmployeeForDetail.department}</span>
                    </div>
                  </div>
                </div>

                {/* Permissions */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="text-lg font-medium text-gray-900 mb-3">Tilganger og rettigheter</h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Avdelingsadministrasjon</span>
                      <span className={`w-3 h-3 rounded-full ${
                        selectedEmployeeForDetail.role === 'department_leader' || selectedEmployeeForDetail.role === 'admin' 
                          ? 'bg-green-500' : 'bg-gray-300'
                      }`}></span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Ansattadministrasjon</span>
                      <span className={`w-3 h-3 rounded-full ${
                        selectedEmployeeForDetail.role === 'admin' ? 'bg-green-500' : 'bg-gray-300'
                      }`}></span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Systemadministrasjon</span>
                      <span className={`w-3 h-3 rounded-full ${
                        selectedEmployeeForDetail.role === 'admin' ? 'bg-green-500' : 'bg-gray-300'
                      }`}></span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="space-y-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="text-lg font-medium text-gray-900 mb-3">Handlinger</h4>
                  <div className="space-y-2">
                    <button
                      onClick={() => {
                        setShowEmployeeDetailModal(false);
                        openMoveEmployeeModal(selectedEmployeeForDetail);
                      }}
                      className="w-full bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2 text-sm"
                    >
                      {/* <ArrowRight className="h-4 w-4" /> */}
                      <span>Flytt til annen avdeling</span>
                    </button>
                    
                    <button
                      onClick={() => {
                        setShowEmployeeDetailModal(false);
                        // TODO: Open edit employee modal
                      }}
                      className="w-full bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center space-x-2 text-sm"
                    >
                      <Edit className="h-4 w-4" />
                      <span>Rediger ansatt</span>
                    </button>
                    
                    <button
                      onClick={() => {
                        setShowEmployeeDetailModal(false);
                        // TODO: Open permissions modal
                      }}
                      className="w-full bg-yellow-600 text-white px-3 py-2 rounded-lg hover:bg-yellow-700 transition-colors flex items-center justify-center space-x-2 text-sm"
                    >
                      {/* <Shield className="h-4 w-4" /> */}
                      <span>Administrer tilganger</span>
                    </button>
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="text-lg font-medium text-gray-900 mb-3">Statistikk</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Tid i avdeling:</span>
                      <span className="text-sm font-medium text-gray-900">2 år 3 måneder</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Aktive prosjekter:</span>
                      <span className="text-sm font-medium text-gray-900">3</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Fullførte oppgaver:</span>
                      <span className="text-sm font-medium text-gray-900">47</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Department Modal */}
      {showDeleteModal && deletingDepartment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">Slett avdeling</h2>
              <button
                onClick={() => setShowDeleteModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="mb-4">
              <p className="text-gray-600">
                Er du sikker på at du vil slette avdelingen <strong>{deletingDepartment.name}</strong>?
                Denne handlingen kan ikke angres.
              </p>
            </div>

            <div className="flex space-x-3">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 transition-colors"
              >
                Avbryt
              </button>
              <button
                onClick={handleDeleteDepartment}
                disabled={saving}
                className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Sletter...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4" />
                    <span>Slett avdeling</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 