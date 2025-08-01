'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { firebaseService, Employee, Department } from '@/lib/firebase-services';
import { 
  Users, 
  Plus, 
  Search, 
  Filter, 
  MoreHorizontal,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Building,
  Edit,
  Trash2,
  Eye,
  UserPlus,
  ChevronLeft,
  ChevronRight,
  X
} from 'lucide-react';

export default function EmployeesPage() {
  const { userProfile } = useAuth();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [newEmployee, setNewEmployee] = useState({
    displayName: '',
    email: '',
    phone: '',
    departmentId: '',
    position: '',
    role: 'employee' as const,
    status: 'active' as const
  });

  useEffect(() => {
    // Check if mobile on mount and resize
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (userProfile?.companyId) {
      loadEmployees();
      loadDepartments();
    }
  }, [userProfile?.companyId]);

  const loadEmployees = async () => {
    if (!userProfile?.companyId) return;

    try {
      const data = await firebaseService.getEmployees(userProfile.companyId);
      setEmployees(data);
    } catch (error) {
      console.error('Error loading employees:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadDepartments = async () => {
    if (!userProfile?.companyId) return;

    try {
      const data = await firebaseService.getDepartments(userProfile.companyId);
      setDepartments(data);
    } catch (error) {
      console.error('Error loading departments:', error);
    }
  };

  const filteredEmployees = employees.filter(employee => {
    const department = departments.find(d => d.id === employee.departmentId);
    const matchesSearch = employee.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         employee.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         employee.position.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDepartment = selectedDepartment === 'all' || employee.departmentId === selectedDepartment;
    return matchesSearch && matchesDepartment;
  });

  const handleAddEmployee = async () => {
    if (!userProfile?.companyId) return;

    try {
      await firebaseService.createEmployee({
        ...newEmployee,
        companyId: userProfile.companyId,
        hireDate: new Date().toISOString()
      });

      setShowAddModal(false);
      setNewEmployee({
        displayName: '',
        email: '',
        phone: '',
        departmentId: '',
        position: '',
        role: 'employee',
        status: 'active'
      });
      loadEmployees();
    } catch (error) {
      console.error('Error adding employee:', error);
      alert('Failed to add employee');
    }
  };

  const handleEditEmployee = async () => {
    if (!selectedEmployee) return;

    try {
      await firebaseService.updateEmployee(selectedEmployee.id, {
        displayName: selectedEmployee.displayName,
        email: selectedEmployee.email,
        phone: selectedEmployee.phone,
        departmentId: selectedEmployee.departmentId,
        position: selectedEmployee.position,
        role: selectedEmployee.role,
        status: selectedEmployee.status
      });

      setShowEditModal(false);
      setSelectedEmployee(null);
      loadEmployees();
    } catch (error) {
      console.error('Error updating employee:', error);
      alert('Failed to update employee');
    }
  };

  const handleDeleteEmployee = async (employeeId: string) => {
    if (!confirm('Are you sure you want to delete this employee?')) return;

    try {
      await firebaseService.deleteEmployee(employeeId);
      loadEmployees();
    } catch (error) {
      console.error('Error deleting employee:', error);
      alert('Failed to delete employee');
    }
  };

  const getDepartmentName = (departmentId: string) => {
    const department = departments.find(d => d.id === departmentId);
    return department?.name || 'Unknown Department';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return '#10b981';
      case 'inactive':
        return '#6b7280';
      case 'on_leave':
        return '#f59e0b';
      default:
        return '#6b7280';
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return { text: 'Admin', color: '#ef4444' };
      case 'department_leader':
        return { text: 'Leader', color: '#3b82f6' };
      case 'employee':
        return { text: 'Employee', color: '#10b981' };
      default:
        return { text: 'Employee', color: '#10b981' };
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Laster ansatte...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Header */}
      {isMobile && (
        <div className="bg-white shadow-sm border-b border-gray-200 px-4 py-3">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-semibold text-gray-900">Ansatte</h1>
              <p className="text-sm text-gray-600">{filteredEmployees.length} ansatte</p>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="p-2 rounded-lg bg-blue-600 text-white"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* Desktop Header */}
      {!isMobile && (
        <div className="page-header">
          <h1 className="page-title">👥 Ansatte</h1>
          <p className="page-subtitle">
            Administrer ansatte og deres profiler
          </p>
        </div>
      )}

      <div className="px-4 py-6 max-w-7xl mx-auto">
        {/* Mobile Search and Filters */}
        {isMobile && (
          <div className="mb-6 space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Søk etter ansatte..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="w-full flex items-center justify-between p-3 bg-white border border-gray-300 rounded-lg"
            >
              <span className="text-sm font-medium text-gray-700">Filtre</span>
              <Filter className="w-4 h-4 text-gray-500" />
            </button>

            {showFilters && (
              <div className="bg-white p-4 rounded-lg border border-gray-300 space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Avdeling</label>
                  <select
                    value={selectedDepartment}
                    onChange={(e) => setSelectedDepartment(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="all">Alle avdelinger</option>
                    {departments.map(dept => (
                      <option key={dept.id} value={dept.id}>{dept.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Desktop Controls */}
        {!isMobile && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <div style={{ position: 'relative' }}>
                <Search style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#6b7280', width: '16px', height: '16px' }} />
                <input
                  type="text"
                  placeholder="Søk etter ansatte..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{
                    padding: '0.75rem 1rem 0.75rem 2.5rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    width: '300px',
                    fontSize: '0.875rem'
                  }}
                />
              </div>
              <select
                value={selectedDepartment}
                onChange={(e) => setSelectedDepartment(e.target.value)}
                style={{
                  padding: '0.75rem 1rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '0.875rem',
                  backgroundColor: 'white'
                }}
              >
                <option value="all">Alle avdelinger</option>
                {departments.map(dept => (
                  <option key={dept.id} value={dept.id}>{dept.name}</option>
                ))}
              </select>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="btn btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              <UserPlus style={{ width: '16px', height: '16px' }} />
              Legg til ansatt
            </button>
          </div>
        )}

        {/* Mobile Employee List */}
        {isMobile ? (
          <div className="space-y-3">
            {filteredEmployees.map((employee) => {
              const roleBadge = getRoleBadge(employee.role);
              return (
                <div key={employee.id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-lg font-semibold text-blue-600">
                          {employee.displayName.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="text-base font-semibold text-gray-900 truncate">
                            {employee.displayName}
                          </h3>
                          <p className="text-sm text-gray-600 mt-1">{employee.position}</p>
                          <p className="text-sm text-gray-500 mt-1">{employee.email}</p>
                          {employee.phone && (
                            <p className="text-sm text-gray-500">{employee.phone}</p>
                          )}
                        </div>
                        <div className="flex items-center space-x-2">
                          <span 
                            className="px-2 py-1 text-xs font-medium rounded-full"
                            style={{ 
                              backgroundColor: `${roleBadge.color}20`,
                              color: roleBadge.color
                            }}
                          >
                            {roleBadge.text}
                          </span>
                          <div 
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: getStatusColor(employee.status) }}
                          />
                        </div>
                      </div>
                      <div className="mt-3 flex items-center justify-between">
                        <p className="text-sm text-gray-600">
                          {getDepartmentName(employee.departmentId)}
                        </p>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => {
                              setSelectedEmployee(employee);
                              setShowEditModal(true);
                            }}
                            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteEmployee(employee.id)}
                            className="p-2 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Desktop Employee Grid */
          <div className="grid grid-cols-3">
            {filteredEmployees.map((employee) => {
              const roleBadge = getRoleBadge(employee.role);
              return (
                <div key={employee.id} className="card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <div style={{ 
                        width: '48px', 
                        height: '48px', 
                        backgroundColor: '#3b82f6', 
                        borderRadius: '50%', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        color: 'white',
                        fontWeight: '600',
                        fontSize: '1.125rem'
                      }}>
                        {employee.displayName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h3 style={{ fontWeight: '600', color: '#333', margin: 0 }}>{employee.displayName}</h3>
                        <p style={{ color: '#666', fontSize: '0.875rem', margin: '0.25rem 0 0 0' }}>{employee.position}</p>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        onClick={() => {
                          setSelectedEmployee(employee);
                          setShowEditModal(true);
                        }}
                        className="btn btn-secondary"
                        style={{ padding: '0.5rem', fontSize: '0.75rem' }}
                      >
                        <Edit style={{ width: '14px', height: '14px' }} />
                      </button>
                      <button
                        onClick={() => handleDeleteEmployee(employee.id)}
                        className="btn btn-danger"
                        style={{ padding: '0.5rem', fontSize: '0.75rem' }}
                      >
                        <Trash2 style={{ width: '14px', height: '14px' }} />
                      </button>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Mail style={{ width: '14px', height: '14px', color: '#6b7280' }} />
                      <span style={{ fontSize: '0.875rem', color: '#666' }}>{employee.email}</span>
                    </div>
                    {employee.phone && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Phone style={{ width: '14px', height: '14px', color: '#6b7280' }} />
                        <span style={{ fontSize: '0.875rem', color: '#666' }}>{employee.phone}</span>
                      </div>
                    )}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Building style={{ width: '14px', height: '14px', color: '#6b7280' }} />
                      <span style={{ fontSize: '0.875rem', color: '#666' }}>{getDepartmentName(employee.departmentId)}</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem' }}>
                    <span style={{ 
                      padding: '0.25rem 0.75rem', 
                      borderRadius: '12px', 
                      fontSize: '0.75rem', 
                      fontWeight: '500',
                      backgroundColor: `${roleBadge.color}20`,
                      color: roleBadge.color
                    }}>
                      {roleBadge.text}
                    </span>
                    <div style={{ 
                      width: '8px', 
                      height: '8px', 
                      borderRadius: '50%', 
                      backgroundColor: getStatusColor(employee.status) 
                    }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Empty State */}
        {filteredEmployees.length === 0 && !loading && (
          <div className="text-center py-12">
            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Ingen ansatte funnet</h3>
            <p className="text-gray-600 mb-6">
              {searchTerm || selectedDepartment !== 'all' 
                ? 'Prøv å endre søkekriteriene' 
                : 'Du har ingen ansatte registrert ennå'}
            </p>
            <button
              onClick={() => setShowAddModal(true)}
              className="btn btn-primary"
            >
              <UserPlus className="w-4 h-4 mr-2" />
              Legg til din første ansatt
            </button>
          </div>
        )}
      </div>

      {/* Add Employee Modal - Mobile */}
      {showAddModal && isMobile && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end">
          <div className="bg-white w-full max-h-[90vh] rounded-t-xl overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Legg til ny ansatt</h2>
              <button 
                onClick={() => setShowAddModal(false)}
                className="p-2 rounded-lg hover:bg-gray-100"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Navn</label>
                <input
                  type="text"
                  value={newEmployee.displayName}
                  onChange={(e) => setNewEmployee({ ...newEmployee, displayName: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Fornavn Etternavn"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">E-post</label>
                <input
                  type="email"
                  value={newEmployee.email}
                  onChange={(e) => setNewEmployee({ ...newEmployee, email: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="ansatt@bedrift.no"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Telefon</label>
                <input
                  type="tel"
                  value={newEmployee.phone}
                  onChange={(e) => setNewEmployee({ ...newEmployee, phone: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="+47 123 45 678"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Avdeling</label>
                <select
                  value={newEmployee.departmentId}
                  onChange={(e) => setNewEmployee({ ...newEmployee, departmentId: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Velg avdeling</option>
                  {departments.map(dept => (
                    <option key={dept.id} value={dept.id}>{dept.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Stilling</label>
                <input
                  type="text"
                  value={newEmployee.position}
                  onChange={(e) => setNewEmployee({ ...newEmployee, position: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Utvikler"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Rolle</label>
                <select
                  value={newEmployee.role}
                  onChange={(e) => setNewEmployee({ ...newEmployee, role: e.target.value as any })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="employee">Ansatt</option>
                  <option value="department_leader">Avdelingsleder</option>
                  <option value="admin">Administrator</option>
                </select>
              </div>
            </div>
            <div className="sticky bottom-0 bg-white border-t border-gray-200 px-4 py-3 flex space-x-3">
              <button 
                onClick={() => setShowAddModal(false)}
                className="flex-1 py-3 px-4 border border-gray-300 rounded-lg text-gray-700 font-medium"
              >
                Avbryt
              </button>
              <button 
                onClick={handleAddEmployee}
                className="flex-1 py-3 px-4 bg-blue-600 text-white rounded-lg font-medium"
              >
                Legg til
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Employee Modal - Desktop */}
      {showAddModal && !isMobile && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2 className="modal-title">Legg til ny ansatt</h2>
              <button onClick={() => setShowAddModal(false)} className="modal-close">×</button>
            </div>
            <div className="modal-body">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Navn</label>
                  <input
                    type="text"
                    value={newEmployee.displayName}
                    onChange={(e) => setNewEmployee({ ...newEmployee, displayName: e.target.value })}
                    style={{ width: '100%', padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '8px' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>E-post</label>
                  <input
                    type="email"
                    value={newEmployee.email}
                    onChange={(e) => setNewEmployee({ ...newEmployee, email: e.target.value })}
                    style={{ width: '100%', padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '8px' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Telefon</label>
                  <input
                    type="tel"
                    value={newEmployee.phone}
                    onChange={(e) => setNewEmployee({ ...newEmployee, phone: e.target.value })}
                    style={{ width: '100%', padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '8px' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Avdeling</label>
                  <select
                    value={newEmployee.departmentId}
                    onChange={(e) => setNewEmployee({ ...newEmployee, departmentId: e.target.value })}
                    style={{ width: '100%', padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '8px' }}
                  >
                    <option value="">Velg avdeling</option>
                    {departments.map(dept => (
                      <option key={dept.id} value={dept.id}>{dept.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Stilling</label>
                  <input
                    type="text"
                    value={newEmployee.position}
                    onChange={(e) => setNewEmployee({ ...newEmployee, position: e.target.value })}
                    style={{ width: '100%', padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '8px' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Rolle</label>
                  <select
                    value={newEmployee.role}
                    onChange={(e) => setNewEmployee({ ...newEmployee, role: e.target.value as any })}
                    style={{ width: '100%', padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '8px' }}
                  >
                    <option value="employee">Ansatt</option>
                    <option value="department_leader">Avdelingsleder</option>
                    <option value="admin">Administrator</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button onClick={() => setShowAddModal(false)} className="btn btn-secondary">Avbryt</button>
              <button onClick={handleAddEmployee} className="btn btn-primary">Legg til</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Employee Modal - Mobile */}
      {showEditModal && selectedEmployee && isMobile && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end">
          <div className="bg-white w-full max-h-[90vh] rounded-t-xl overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Rediger ansatt</h2>
              <button 
                onClick={() => setShowEditModal(false)}
                className="p-2 rounded-lg hover:bg-gray-100"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Navn</label>
                <input
                  type="text"
                  value={selectedEmployee.displayName}
                  onChange={(e) => setSelectedEmployee({ ...selectedEmployee, displayName: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">E-post</label>
                <input
                  type="email"
                  value={selectedEmployee.email}
                  onChange={(e) => setSelectedEmployee({ ...selectedEmployee, email: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Telefon</label>
                <input
                  type="tel"
                  value={selectedEmployee.phone || ''}
                  onChange={(e) => setSelectedEmployee({ ...selectedEmployee, phone: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Avdeling</label>
                <select
                  value={selectedEmployee.departmentId}
                  onChange={(e) => setSelectedEmployee({ ...selectedEmployee, departmentId: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {departments.map(dept => (
                    <option key={dept.id} value={dept.id}>{dept.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Stilling</label>
                <input
                  type="text"
                  value={selectedEmployee.position}
                  onChange={(e) => setSelectedEmployee({ ...selectedEmployee, position: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Rolle</label>
                <select
                  value={selectedEmployee.role}
                  onChange={(e) => setSelectedEmployee({ ...selectedEmployee, role: e.target.value as any })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="employee">Ansatt</option>
                  <option value="department_leader">Avdelingsleder</option>
                  <option value="admin">Administrator</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select
                  value={selectedEmployee.status}
                  onChange={(e) => setSelectedEmployee({ ...selectedEmployee, status: e.target.value as any })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="active">Aktiv</option>
                  <option value="inactive">Inaktiv</option>
                  <option value="on_leave">Permisjon</option>
                </select>
              </div>
            </div>
            <div className="sticky bottom-0 bg-white border-t border-gray-200 px-4 py-3 flex space-x-3">
              <button 
                onClick={() => setShowEditModal(false)}
                className="flex-1 py-3 px-4 border border-gray-300 rounded-lg text-gray-700 font-medium"
              >
                Avbryt
              </button>
              <button 
                onClick={handleEditEmployee}
                className="flex-1 py-3 px-4 bg-blue-600 text-white rounded-lg font-medium"
              >
                Lagre endringer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Employee Modal - Desktop */}
      {showEditModal && selectedEmployee && !isMobile && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2 className="modal-title">Rediger ansatt</h2>
              <button onClick={() => setShowEditModal(false)} className="modal-close">×</button>
            </div>
            <div className="modal-body">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Navn</label>
                  <input
                    type="text"
                    value={selectedEmployee.displayName}
                    onChange={(e) => setSelectedEmployee({ ...selectedEmployee, displayName: e.target.value })}
                    style={{ width: '100%', padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '8px' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>E-post</label>
                  <input
                    type="email"
                    value={selectedEmployee.email}
                    onChange={(e) => setSelectedEmployee({ ...selectedEmployee, email: e.target.value })}
                    style={{ width: '100%', padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '8px' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Telefon</label>
                  <input
                    type="tel"
                    value={selectedEmployee.phone || ''}
                    onChange={(e) => setSelectedEmployee({ ...selectedEmployee, phone: e.target.value })}
                    style={{ width: '100%', padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '8px' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Avdeling</label>
                  <select
                    value={selectedEmployee.departmentId}
                    onChange={(e) => setSelectedEmployee({ ...selectedEmployee, departmentId: e.target.value })}
                    style={{ width: '100%', padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '8px' }}
                  >
                    {departments.map(dept => (
                      <option key={dept.id} value={dept.id}>{dept.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Stilling</label>
                  <input
                    type="text"
                    value={selectedEmployee.position}
                    onChange={(e) => setSelectedEmployee({ ...selectedEmployee, position: e.target.value })}
                    style={{ width: '100%', padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '8px' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Rolle</label>
                  <select
                    value={selectedEmployee.role}
                    onChange={(e) => setSelectedEmployee({ ...selectedEmployee, role: e.target.value as any })}
                    style={{ width: '100%', padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '8px' }}
                  >
                    <option value="employee">Ansatt</option>
                    <option value="department_leader">Avdelingsleder</option>
                    <option value="admin">Administrator</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Status</label>
                  <select
                    value={selectedEmployee.status}
                    onChange={(e) => setSelectedEmployee({ ...selectedEmployee, status: e.target.value as any })}
                    style={{ width: '100%', padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '8px' }}
                  >
                    <option value="active">Aktiv</option>
                    <option value="inactive">Inaktiv</option>
                    <option value="on_leave">Permisjon</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button onClick={() => setShowEditModal(false)} className="btn btn-secondary">Avbryt</button>
              <button onClick={handleEditEmployee} className="btn btn-primary">Lagre endringer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 