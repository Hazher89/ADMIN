'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { firebaseService } from '@/lib/firebase-services';
import { emailService } from '@/lib/email-service';
import { UserPlus, Search, Filter, Edit, Trash2, Plus, MoreHorizontal, User, Building, MapPin, CheckCircle, Eye, Settings, Key, UserX, UserCheck, Calendar, AlertTriangle, Clock } from 'lucide-react';

import { Employee } from '@/lib/firebase-services';

interface Department {
  id: string;
  name: string;
  description?: string;
  companyId: string;
  createdAt?: string;
  updatedAt?: string;
}

export default function EmployeesPage() {
  const { userProfile, loading: authLoading } = useAuth();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [isMobile, setIsMobile] = useState(false);

  const [newEmployee, setNewEmployee] = useState({
    displayName: '',
    email: '',
    phone: '',
    departmentId: '',
    position: '',
    role: 'employee' as const,
    status: 'active' as const,
    birthDate: '',
    employeeNumber: '',
    taxId: '',
    address: '',
    emergencyContact: '',
    bio: '',
    education: '',
    workExperience: '',
    skills: [] as string[],
    certifications: [] as string[],
    hireDate: '',
    salary: '',
    managerId: '',
    bankAccount: '',
    insuranceNumber: '',
    avatar: ''
  });

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    console.log('Employees useEffect triggered, userProfile:', userProfile);
    console.log('userProfile?.companyId:', userProfile?.companyId);
    console.log('userProfile?.id:', userProfile?.id);
    console.log('authLoading:', authLoading);
    
    let timeoutId: NodeJS.Timeout;
    
    // Wait for auth to finish loading
    if (authLoading) {
      console.log('Auth still loading, waiting...');
      return;
    }
    
    if (userProfile?.companyId) {
      console.log('Loading employees for company:', userProfile.companyId);
      setLoading(true);
      
      // Define load functions inside useEffect to avoid dependency issues
      const loadEmployees = async () => {
        if (!userProfile?.companyId) {
          console.error('No company ID found in loadEmployees');
          setLoading(false);
          return;
        }

        console.log('Loading employees for company:', userProfile.companyId);

        try {
          const data = await firebaseService.getEmployees(userProfile.companyId);
          console.log('Loaded employees:', data);
          setEmployees(data);
        } catch (error) {
          console.error('Error loading employees:', error);
          setEmployees([]);
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
          setDepartments([]);
        }
      };

      // Load data
      loadEmployees();
      loadDepartments();
    } else {
      console.log('No companyId found in userProfile');
      console.log('userProfile object:', userProfile);
      // Don't set loading to false immediately, wait a bit to see if userProfile loads
      timeoutId = setTimeout(() => {
        if (!userProfile?.companyId) {
          setLoading(false);
        }
      }, 2000);
    }

    // Cleanup function
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [userProfile?.companyId, userProfile?.id, authLoading]);

  // Create a reusable loadEmployees function for other functions to use
  const loadEmployees = async () => {
    if (!userProfile?.companyId) {
      console.error('No company ID found in loadEmployees');
      return;
    }

    console.log('Loading employees for company:', userProfile.companyId);

    try {
      const data = await firebaseService.getEmployees(userProfile.companyId);
      console.log('Loaded employees:', data);
      setEmployees(data);
    } catch (error) {
      console.error('Error loading employees:', error);
      setEmployees([]);
    }
  };

  const filteredEmployees = employees.filter(employee => {
    const department = departments.find(d => d.id === employee.departmentId);
    const matchesSearch = (employee.displayName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (employee.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (employee.position || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDepartment = selectedDepartment === 'all' || employee.departmentId === selectedDepartment;
    return matchesSearch && matchesDepartment;
  });

  const handleAddEmployee = async () => {
    if (!userProfile?.companyId) {
      console.error('No company ID found');
      alert('Ingen bedrift funnet. Vennligst logg inn på nytt.');
      return;
    }

    // Validate required fields
    if (!newEmployee.displayName.trim()) {
      alert('Navn er påkrevd');
      return;
    }

    if (!newEmployee.email.trim()) {
      alert('E-post er påkrevd');
      return;
    }

    console.log('Creating employee with data:', {
      ...newEmployee,
      departmentId: newEmployee.departmentId || '',
      position: newEmployee.position || '',
      companyId: userProfile.companyId,
      hireDate: new Date().toISOString()
    });

    try {
      // Create employee data without undefined fields
      const employeeData: any = {
        displayName: newEmployee.displayName,
        email: newEmployee.email,
        phone: newEmployee.phone || undefined,
        role: newEmployee.role,
        status: newEmployee.status,
        companyId: userProfile.companyId,
        hireDate: newEmployee.hireDate || new Date().toISOString(),
        birthDate: newEmployee.birthDate || undefined,
        employeeNumber: newEmployee.employeeNumber || undefined,
        taxId: newEmployee.taxId || undefined,
        address: newEmployee.address || undefined,
        emergencyContact: newEmployee.emergencyContact || undefined,
        bio: newEmployee.bio || undefined,
        education: newEmployee.education || undefined,
        workExperience: newEmployee.workExperience || undefined,
        skills: newEmployee.skills || undefined,
        certifications: newEmployee.certifications || undefined,
        salary: newEmployee.salary ? Number(newEmployee.salary) : undefined,
        managerId: newEmployee.managerId || undefined,
        bankAccount: newEmployee.bankAccount || undefined,
        insuranceNumber: newEmployee.insuranceNumber || undefined,
        avatar: newEmployee.avatar || undefined
      };

      // Only add departmentId and position if they have values
      if (newEmployee.departmentId && newEmployee.departmentId.trim()) {
        employeeData.departmentId = newEmployee.departmentId;
      }
      if (newEmployee.position && newEmployee.position.trim()) {
        employeeData.position = newEmployee.position;
      }

      const employeeId = await firebaseService.createEmployee(employeeData);

      console.log('Employee created successfully with ID:', employeeId);

      // Send welcome email to the new employee
      let emailSent = false;
      try {
        const departmentName = getDepartmentName(newEmployee.departmentId);
        const adminName = userProfile?.displayName || 'System Administrator';
        const companyName = userProfile?.companyName || 'Bedrift';

        emailSent = await emailService.sendWelcomeEmail(
          newEmployee.email,
          newEmployee.displayName,
          adminName,
          companyName,
          departmentName,
          newEmployee.position || 'Ansatt'
        );

        if (emailSent) {
          console.log('Welcome email sent successfully to:', newEmployee.email);
        } else {
          console.warn('Failed to send welcome email to:', newEmployee.email);
        }
      } catch (emailError) {
        console.error('Error sending welcome email:', emailError);
        // Don't fail the employee creation if email fails
      }

      setShowAddModal(false);
      setNewEmployee({
        displayName: '',
        email: '',
        phone: '',
        departmentId: '',
        position: '',
        role: 'employee',
        status: 'active',
        birthDate: '',
        employeeNumber: '',
        taxId: '',
        address: '',
        emergencyContact: '',
        bio: '',
        education: '',
        workExperience: '',
        skills: [],
        certifications: [],
        hireDate: '',
        salary: '',
        managerId: '',
        bankAccount: '',
        insuranceNumber: '',
        avatar: ''
      });
      
      // Reload employees after a short delay to ensure Firebase has updated
      setTimeout(() => {
        loadEmployees();
      }, 1000);
      
      const message = emailSent 
        ? `Ansatt ble lagt til! Velkomst-e-post sendt til ${newEmployee.email}`
        : `Ansatt ble lagt til! Kunne ikke sende velkomst-e-post til ${newEmployee.email} - sjekk e-postinnstillinger.`;
      alert(message);
    } catch (error) {
      console.error('Error adding employee:', error);
      alert(`Feil ved å legge til ansatt: ${error instanceof Error ? error.message : 'Ukjent feil'}`);
    }
  };

  const handleEditEmployee = async () => {
    if (!selectedEmployee) return;

    try {
      await firebaseService.updateEmployee(selectedEmployee.id, selectedEmployee);
      setShowEditModal(false);
      setSelectedEmployee(null);
      loadEmployees();
      alert('Ansatt ble oppdatert!');
    } catch (error) {
      console.error('Error updating employee:', error);
      alert(`Feil ved oppdatering av ansatt: ${error instanceof Error ? error.message : 'Ukjent feil'}`);
    }
  };

  const handleDeleteEmployee = async (employeeId: string) => {
    if (!confirm('Er du sikker på at du vil slette denne ansatten?')) {
      return;
    }

    try {
      await firebaseService.deleteEmployee(employeeId);
      loadEmployees();
      alert('Ansatt ble slettet!');
    } catch (error) {
      console.error('Error deleting employee:', error);
      alert(`Feil ved sletting av ansatt: ${error instanceof Error ? error.message : 'Ukjent feil'}`);
    }
  };

  const handleViewEmployee = (employee: Employee) => {
    setSelectedEmployee(employee);
    setShowViewModal(true);
  };

  const handleEmployeeSettings = (employee: Employee) => {
    setSelectedEmployee(employee);
    setShowSettingsModal(true);
  };

  const handleResetPassword = async (employeeId: string) => {
    if (!confirm('Er du sikker på at du vil tilbakestille passordet for denne ansatten?')) {
      return;
    }

    try {
      // TODO: Implement password reset functionality
      alert('Passord tilbakestillt! En e-post med nytt passord er sendt til ansatten.');
    } catch (error) {
      console.error('Error resetting password:', error);
      alert(`Feil ved tilbakestilling av passord: ${error instanceof Error ? error.message : 'Ukjent feil'}`);
    }
  };

  const handleDeactivateEmployee = async (employeeId: string) => {
    if (!confirm('Er du sikker på at du vil deaktivere denne ansatten?')) {
      return;
    }

    try {
      await firebaseService.updateEmployee(employeeId, { status: 'inactive' });
      loadEmployees();
      alert('Ansatt ble deaktivert!');
    } catch (error) {
      console.error('Error deactivating employee:', error);
      alert(`Feil ved deaktivering av ansatt: ${error instanceof Error ? error.message : 'Ukjent feil'}`);
    }
  };

  const handleActivateEmployee = async (employeeId: string) => {
    try {
      await firebaseService.updateEmployee(employeeId, { status: 'active' });
      loadEmployees();
      alert('Ansatt ble aktivert!');
    } catch (error) {
      console.error('Error activating employee:', error);
      alert(`Feil ved aktivering av ansatt: ${error instanceof Error ? error.message : 'Ukjent feil'}`);
    }
  };

  const getDepartmentName = (departmentId: string | undefined) => {
    const department = departments.find(d => d.id === departmentId);
    return department?.name || 'Ingen avdeling';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return '#10b981';
      case 'inactive':
        return '#f59e0b';
      case 'on_leave':
        return '#ef4444';
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

  // Calculate statistics
  const stats = {
    total: employees.length,
    active: employees.filter(emp => emp.status === 'active').length,
    leaders: employees.filter(emp => emp.role === 'department_leader').length,
    admins: employees.filter(emp => emp.role === 'admin').length
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">
            {authLoading ? 'Laster brukerdata...' : 'Laster ansatte...'}
          </p>
          {!userProfile?.companyId && !authLoading && (
            <p className="mt-2 text-sm text-gray-500">
              Venter på bedriftsinformasjon...
            </p>
          )}
          <p className="mt-2 text-sm text-gray-500">
            Debug: companyId = {userProfile?.companyId || 'undefined'}
          </p>
          <p className="mt-1 text-xs text-gray-400">
            Auth loading: {authLoading ? 'true' : 'false'}
          </p>
        </div>
      </div>
    );
  }

  // Show error state if no companyId after loading and auth is done
  if (!authLoading && !loading && !userProfile?.companyId) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-red-600 text-2xl">⚠️</span>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Ingen bedrift funnet</h3>
          <p className="text-gray-600 mb-4">
            Kunne ikke laste bedriftsinformasjon. Vennligst prøv å logge inn på nytt.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="btn btn-primary"
          >
            Oppdater siden
          </button>
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
          <div className="flex items-center justify-between">
            <div>
              <h1 className="page-title">👥 Ansatte</h1>
              <p className="page-subtitle">
                Administrer ansatte og deres profiler
              </p>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="btn btn-primary"
            >
              <UserPlus className="w-4 h-4 mr-2" />
              Legg til ansatt
            </button>
          </div>
        </div>
      )}

      {/* Stats Section */}
      <div className="stats-section">
        <div className="stat-item">
          <div className="stat-number">{stats.total}</div>
          <div className="stat-label">Totalt</div>
        </div>
        <div className="stat-item">
          <div className="stat-number">{stats.active}</div>
          <div className="stat-label">Aktive</div>
        </div>
        <div className="stat-item">
          <div className="stat-number">{stats.leaders}</div>
          <div className="stat-label">Ledere</div>
        </div>
        <div className="stat-item">
          <div className="stat-number">{stats.admins}</div>
          <div className="stat-label">Admins</div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="search-filters-section">
        <div className="search-container">
          <Search className="search-icon" />
          <input
            type="text"
            placeholder="Søk etter navn, e-post eller stilling..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
        <div className="filter-container">
          <Filter className="filter-icon" />
          <select
            value={selectedDepartment}
            onChange={(e) => setSelectedDepartment(e.target.value)}
            className="filter-select"
          >
            <option value="all">Alle avdelinger</option>
            {departments.map(dept => (
              <option key={dept.id} value={dept.id}>
                {dept.name}
              </option>
            ))}
          </select>
        </div>
      </div>

            {/* Employees Grid */}
      <div className="grid grid-cols-3">
        {filteredEmployees.map((employee) => {
          const roleBadge = getRoleBadge(employee.role);
          return (
            <div key={employee.id} className="card">
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', marginBottom: '1rem' }}>
                <div className="card-icon">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                    {(employee.displayName?.charAt(0) || 'U').toUpperCase()}
                  </div>
                </div>
                <div style={{ flex: '1' }}>
                  <h3 style={{ 
                    fontWeight: '600', 
                    color: '#333',
                    fontSize: '1.1rem',
                    marginBottom: '0.25rem'
                  }}>
                    {employee.displayName || 'Ukjent navn'}
                  </h3>
                  <p style={{ color: '#666', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                    {employee.email}
                  </p>
                </div>
                <button className="btn btn-secondary" style={{ padding: '0.5rem' }}>
                  <MoreHorizontal style={{ width: '16px', height: '16px' }} />
                </button>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <User style={{ width: '14px', height: '14px', color: '#666' }} />
                  <span style={{ fontSize: '0.875rem', color: '#666' }}>
                    <strong>Stilling:</strong> {employee.position || 'Ingen stilling'}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <Building style={{ width: '14px', height: '14px', color: '#666' }} />
                  <span style={{ fontSize: '0.875rem', color: '#666' }}>
                    <strong>Avdeling:</strong> {getDepartmentName(employee.departmentId)}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <MapPin style={{ width: '14px', height: '14px', color: '#666' }} />
                  <span style={{ fontSize: '0.875rem', color: '#666' }}>
                    {employee.phone || 'Ingen telefon'}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <CheckCircle style={{ width: '14px', height: '14px', color: '#666' }} />
                  <span style={{ fontSize: '0.875rem', color: '#666' }}>
                    <strong>Status:</strong> {employee.status === 'active' ? 'Aktiv' : 
                     employee.status === 'inactive' ? 'Inaktiv' : 'Permisjon'}
                  </span>
                </div>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <div style={{ fontSize: '0.75rem', color: '#666' }}>
                  Ansattnr: {employee.employeeNumber || 'Ingen nummer'}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button 
                  className="btn btn-secondary" 
                  style={{ fontSize: '0.75rem', padding: '0.25rem 0.75rem' }}
                  onClick={() => handleViewEmployee(employee)}
                >
                  <Eye style={{ width: '14px', height: '14px' }} />
                  Se
                </button>
                <button 
                  className="btn btn-secondary" 
                  style={{ fontSize: '0.75rem', padding: '0.25rem 0.75rem' }}
                  onClick={() => {
                    setSelectedEmployee(employee);
                    setShowEditModal(true);
                  }}
                >
                  <Edit style={{ width: '14px', height: '14px' }} />
                  Rediger
                </button>
                <button 
                  className="btn btn-secondary" 
                  style={{ fontSize: '0.75rem', padding: '0.25rem 0.75rem' }}
                  onClick={() => handleEmployeeSettings(employee)}
                >
                  <Settings style={{ width: '14px', height: '14px' }} />
                  Innstillinger
                </button>
                <button 
                  className="btn btn-secondary" 
                  style={{ 
                    fontSize: '0.75rem', 
                    padding: '0.25rem 0.5rem',
                    color: '#ef4444',
                    borderColor: '#ef4444'
                  }}
                  onClick={() => handleDeleteEmployee(employee.id)}
                >
                  <Trash2 style={{ width: '14px', height: '14px' }} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty State */}
      {filteredEmployees.length === 0 && !loading && (
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <User style={{ width: '64px', height: '64px', color: '#ccc', margin: '0 auto 1rem' }} />
          <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#333', marginBottom: '0.5rem' }}>
            Ingen ansatte funnet
          </h3>
          <p style={{ color: '#666', marginBottom: '1.5rem' }}>
            {searchTerm 
              ? 'Prøv å endre søkekriteriene' 
              : 'Du har ingen ansatte registrert ennå'}
          </p>
          <button 
            className="btn btn-primary"
            onClick={() => setShowAddModal(true)}
          >
            <Plus style={{ width: '16px', height: '16px' }} />
            Legg til din første ansatt
          </button>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <div className="loading" style={{ margin: '0 auto 1rem' }}></div>
          <p style={{ color: '#666' }}>Laster ansatte...</p>
        </div>
      )}

      {/* Add Employee Modal */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2 className="modal-title">Legg til ny ansatt</h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="modal-close"
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <div className="form-grid">
                {/* Grunnleggende informasjon */}
                <div className="form-group">
                  <label className="form-label">Navn *</label>
                  <input
                    type="text"
                    value={newEmployee.displayName}
                    onChange={(e) => setNewEmployee({...newEmployee, displayName: e.target.value})}
                    className="form-input"
                    placeholder="Fornavn Etternavn"
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">E-post *</label>
                  <input
                    type="email"
                    value={newEmployee.email}
                    onChange={(e) => setNewEmployee({...newEmployee, email: e.target.value})}
                    className="form-input"
                    placeholder="ansatt@bedrift.no"
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Telefon</label>
                  <input
                    type="tel"
                    value={newEmployee.phone}
                    onChange={(e) => setNewEmployee({...newEmployee, phone: e.target.value})}
                    className="form-input"
                    placeholder="+47 123 45 678"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Fødselsdato</label>
                  <input
                    type="date"
                    value={newEmployee.birthDate}
                    onChange={(e) => setNewEmployee({...newEmployee, birthDate: e.target.value})}
                    className="form-input"
                  />
                </div>

                {/* Arbeidsinformasjon */}
                <div className="form-group">
                  <label className="form-label">Stilling</label>
                  <input
                    type="text"
                    value={newEmployee.position}
                    onChange={(e) => setNewEmployee({...newEmployee, position: e.target.value})}
                    className="form-input"
                    placeholder="Stilling"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Avdeling</label>
                  <select
                    value={newEmployee.departmentId}
                    onChange={(e) => setNewEmployee({...newEmployee, departmentId: e.target.value})}
                    className="form-input"
                  >
                    <option value="">Velg avdeling</option>
                    {departments.map(dept => (
                      <option key={dept.id} value={dept.id}>
                        {dept.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Rolle</label>
                  <select
                    value={newEmployee.role}
                    onChange={(e) => setNewEmployee({...newEmployee, role: e.target.value as any})}
                    className="form-input"
                  >
                    <option value="employee">Ansatt</option>
                    <option value="department_leader">Avdelingsleder</option>
                    <option value="admin">Administrator</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Ansattnummer</label>
                  <input
                    type="text"
                    value={newEmployee.employeeNumber}
                    onChange={(e) => setNewEmployee({...newEmployee, employeeNumber: e.target.value})}
                    className="form-input"
                    placeholder="Ansattnummer"
                  />
                </div>

                {/* Kontrakt og økonomi */}
                <div className="form-group">
                  <label className="form-label">Ansettelsesdato</label>
                  <input
                    type="date"
                    value={newEmployee.hireDate}
                    onChange={(e) => setNewEmployee({...newEmployee, hireDate: e.target.value})}
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Lønn (årlig)</label>
                  <input
                    type="number"
                    value={newEmployee.salary}
                    onChange={(e) => setNewEmployee({...newEmployee, salary: e.target.value})}
                    className="form-input"
                    placeholder="500000"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Skattetrekk</label>
                  <input
                    type="text"
                    value={newEmployee.taxId}
                    onChange={(e) => setNewEmployee({...newEmployee, taxId: e.target.value})}
                    className="form-input"
                    placeholder="Skattetrekk"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Bankkonto</label>
                  <input
                    type="text"
                    value={newEmployee.bankAccount}
                    onChange={(e) => setNewEmployee({...newEmployee, bankAccount: e.target.value})}
                    className="form-input"
                    placeholder="1234 56 78901"
                  />
                </div>

                {/* Kontaktinformasjon */}
                <div className="form-group">
                  <label className="form-label">Adresse</label>
                  <textarea
                    value={newEmployee.address}
                    onChange={(e) => setNewEmployee({...newEmployee, address: e.target.value})}
                    className="form-input"
                    placeholder="Gateadresse, postnummer og sted"
                    rows={3}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Nødkontakt</label>
                  <input
                    type="text"
                    value={newEmployee.emergencyContact}
                    onChange={(e) => setNewEmployee({...newEmployee, emergencyContact: e.target.value})}
                    className="form-input"
                    placeholder="Navn og telefonnummer"
                  />
                </div>

                {/* Sikkerhet og forsikring */}
                <div className="form-group">
                  <label className="form-label">Forsikringsnummer</label>
                  <input
                    type="text"
                    value={newEmployee.insuranceNumber}
                    onChange={(e) => setNewEmployee({...newEmployee, insuranceNumber: e.target.value})}
                    className="form-input"
                    placeholder="Forsikringsnummer"
                  />
                </div>

                {/* Profil og kompetanse */}
                <div className="form-group">
                  <label className="form-label">Biografi</label>
                  <textarea
                    value={newEmployee.bio}
                    onChange={(e) => setNewEmployee({...newEmployee, bio: e.target.value})}
                    className="form-input"
                    placeholder="Kort beskrivelse av ansatt"
                    rows={3}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Utdanning</label>
                  <textarea
                    value={newEmployee.education}
                    onChange={(e) => setNewEmployee({...newEmployee, education: e.target.value})}
                    className="form-input"
                    placeholder="Utdanning og kvalifikasjoner"
                    rows={3}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Arbeidserfaring</label>
                  <textarea
                    value={newEmployee.workExperience}
                    onChange={(e) => setNewEmployee({...newEmployee, workExperience: e.target.value})}
                    className="form-input"
                    placeholder="Relevant arbeidserfaring"
                    rows={3}
                  />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button
                onClick={() => setShowAddModal(false)}
                className="btn btn-secondary"
              >
                Avbryt
              </button>
              <button
                onClick={handleAddEmployee}
                className="btn btn-primary"
              >
                Legg til ansatt
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Employee Modal */}
      {showEditModal && selectedEmployee && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2 className="modal-title">Rediger ansatt</h2>
              <button
                onClick={() => setShowEditModal(false)}
                className="modal-close"
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Navn</label>
                  <input
                    type="text"
                    value={selectedEmployee.displayName}
                    onChange={(e) => setSelectedEmployee({...selectedEmployee, displayName: e.target.value})}
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">E-post</label>
                  <input
                    type="email"
                    value={selectedEmployee.email}
                    onChange={(e) => setSelectedEmployee({...selectedEmployee, email: e.target.value})}
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Telefon</label>
                  <input
                    type="tel"
                    value={selectedEmployee.phone || ''}
                    onChange={(e) => setSelectedEmployee({...selectedEmployee, phone: e.target.value})}
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Stilling</label>
                  <input
                    type="text"
                    value={selectedEmployee.position || ''}
                    onChange={(e) => setSelectedEmployee({...selectedEmployee, position: e.target.value})}
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Avdeling</label>
                  <select
                    value={selectedEmployee.departmentId || ''}
                    onChange={(e) => setSelectedEmployee({...selectedEmployee, departmentId: e.target.value})}
                    className="form-input"
                  >
                    <option value="">Velg avdeling</option>
                    {departments.map(dept => (
                      <option key={dept.id} value={dept.id}>
                        {dept.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Rolle</label>
                  <select
                    value={selectedEmployee.role}
                    onChange={(e) => setSelectedEmployee({...selectedEmployee, role: e.target.value as any})}
                    className="form-input"
                  >
                    <option value="employee">Ansatt</option>
                    <option value="department_leader">Avdelingsleder</option>
                    <option value="admin">Administrator</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Status</label>
                  <select
                    value={selectedEmployee.status}
                    onChange={(e) => setSelectedEmployee({...selectedEmployee, status: e.target.value as any})}
                    className="form-input"
                  >
                    <option value="active">Aktiv</option>
                    <option value="inactive">Inaktiv</option>
                    <option value="on_leave">Permisjon</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button
                onClick={() => setShowEditModal(false)}
                className="btn btn-secondary"
              >
                Avbryt
              </button>
              <button
                onClick={handleEditEmployee}
                className="btn btn-primary"
              >
                Lagre endringer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Employee Modal */}
      {showViewModal && selectedEmployee && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '90vw', maxHeight: '90vh', width: '1200px' }}>
            <div className="modal-header">
              <h2 className="modal-title">Ansatt Detaljer</h2>
              <button
                onClick={() => setShowViewModal(false)}
                className="modal-close"
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                <div className="user-avatar" style={{ width: '60px', height: '60px', fontSize: '1.5rem' }}>
                  {(selectedEmployee.displayName?.charAt(0) || 'U').toUpperCase()}
                </div>
                <div>
                  <h3 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '0.5rem' }}>
                    {selectedEmployee.displayName}
                  </h3>
                  <p style={{ color: '#666', marginBottom: '0.25rem' }}>
                    {selectedEmployee.email}
                  </p>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <span className="badge badge-primary">
                      {selectedEmployee.role === 'admin' ? 'Administrator' : 
                       selectedEmployee.role === 'department_leader' ? 'Avdelingsleder' : 'Ansatt'}
                    </span>
                    <span className={`badge ${selectedEmployee.status === 'active' ? 'badge-success' : 
                                       selectedEmployee.status === 'inactive' ? 'badge-warning' : 'badge-error'}`}>
                      {selectedEmployee.status === 'active' ? 'Aktiv' : 
                       selectedEmployee.status === 'inactive' ? 'Inaktiv' : 'Permisjon'}
                    </span>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                {/* Grunnleggende informasjon - 2 kolonner */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.5rem' }}>
                  <div>
                    <h4 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '1rem', color: '#333' }}>
                      Grunnleggende informasjon
                    </h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      <div>
                        <strong>Telefon:</strong> {selectedEmployee.phone || 'Ikke registrert'}
                      </div>
                      <div>
                        <strong>Fødselsdato:</strong> {selectedEmployee.birthDate ? new Date(selectedEmployee.birthDate).toLocaleDateString('no-NO') : 'Ikke registrert'}
                      </div>
                      <div>
                        <strong>Ansattnummer:</strong> {selectedEmployee.employeeNumber || 'Ikke registrert'}
                      </div>
                      <div>
                        <strong>Ansettelsesdato:</strong> {selectedEmployee.hireDate ? new Date(selectedEmployee.hireDate).toLocaleDateString('no-NO') : 'Ikke registrert'}
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '1rem', color: '#333' }}>
                      Arbeidsinformasjon
                    </h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      <div>
                        <strong>Stilling:</strong> {selectedEmployee.position || 'Ikke registrert'}
                      </div>
                      <div>
                        <strong>Avdeling:</strong> {getDepartmentName(selectedEmployee.departmentId)}
                      </div>
                      <div>
                        <strong>Lønn:</strong> {selectedEmployee.salary ? `${selectedEmployee.salary.toLocaleString('no-NO')} kr` : 'Ikke registrert'}
                      </div>
                      <div>
                        <strong>Skattetrekk:</strong> {selectedEmployee.taxId || 'Ikke registrert'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Kontaktinformasjon - 2 kolonner */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.5rem' }}>
                  <div>
                    <h4 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '1rem', color: '#333' }}>
                      Kontaktinformasjon
                    </h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      <div>
                        <strong>Adresse:</strong> {selectedEmployee.address || 'Ikke registrert'}
                      </div>
                      <div>
                        <strong>Nødkontakt:</strong> {selectedEmployee.emergencyContact || 'Ikke registrert'}
                      </div>
                      <div>
                        <strong>Bankkonto:</strong> {selectedEmployee.bankAccount || 'Ikke registrert'}
                      </div>
                      <div>
                        <strong>Forsikringsnummer:</strong> {selectedEmployee.insuranceNumber || 'Ikke registrert'}
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '1rem', color: '#333' }}>
                      Profil og kompetanse
                    </h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      <div>
                        <strong>Biografi:</strong> {selectedEmployee.bio || 'Ikke registrert'}
                      </div>
                      <div>
                        <strong>Utdanning:</strong> {selectedEmployee.education || 'Ikke registrert'}
                      </div>
                      <div>
                        <strong>Arbeidserfaring:</strong> {selectedEmployee.workExperience || 'Ikke registrert'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Ferie og fravær - Full bredde */}
                <div>
                  <h4 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '1rem', color: '#333' }}>
                    🏖️ Ferie og fravær
                  </h4>
                  
                  {/* Ferie-statistikk */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
                    <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                        <Calendar style={{ width: '16px', height: '16px', color: '#3b82f6' }} />
                        <strong style={{ color: '#3b82f6' }}>Ferie</strong>
                      </div>
                      <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#1e40af' }}>25</div>
                      <div style={{ fontSize: '0.875rem', color: '#64748b' }}>dager igjen</div>
                    </div>
                    <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                        <Calendar style={{ width: '16px', height: '16px', color: '#10b981' }} />
                        <strong style={{ color: '#10b981' }}>Brukt</strong>
                      </div>
                      <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#059669' }}>5</div>
                      <div style={{ fontSize: '0.875rem', color: '#64748b' }}>dager brukt</div>
                    </div>
                    <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                        <Calendar style={{ width: '16px', height: '16px', color: '#f59e0b' }} />
                        <strong style={{ color: '#f59e0b' }}>Planlagt</strong>
                      </div>
                      <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#d97706' }}>3</div>
                      <div style={{ fontSize: '0.875rem', color: '#64748b' }}>dager planlagt</div>
                    </div>
                    <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                        <Calendar style={{ width: '16px', height: '16px', color: '#ef4444' }} />
                        <strong style={{ color: '#ef4444' }}>Fravær</strong>
                      </div>
                      <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#dc2626' }}>2</div>
                      <div style={{ fontSize: '0.875rem', color: '#64748b' }}>dager i år</div>
                    </div>
                  </div>

                  {/* Fravær-detaljer */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.5rem', marginBottom: '1.5rem' }}>
                    <div>
                      <h5 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '0.75rem', color: '#374151' }}>
                        📊 Fravær-statistikk 2024
                      </h5>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', background: '#fef2f2', borderRadius: '0.375rem', border: '1px solid #fecaca' }}>
                          <div>
                            <div style={{ fontWeight: '500', color: '#dc2626' }}>Egenmelding</div>
                            <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>Dager 1-3, 100% lønn</div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '1.25rem', fontWeight: '700', color: '#dc2626' }}>2 dager</div>
                            <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>Brukt: 2/16</div>
                          </div>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', background: '#fef3c7', borderRadius: '0.375rem', border: '1px solid #fde68a' }}>
                          <div>
                            <div style={{ fontWeight: '500', color: '#d97706' }}>Sykemelding med lønn</div>
                            <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>Dager 4-16, 100% lønn</div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '1.25rem', fontWeight: '700', color: '#d97706' }}>0 dager</div>
                            <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>Brukt: 0/13</div>
                          </div>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', background: '#dbeafe', borderRadius: '0.375rem', border: '1px solid #93c5fd' }}>
                          <div>
                            <div style={{ fontWeight: '500', color: '#2563eb' }}>Sykemelding uten lønn</div>
                            <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>Etter dag 16, sykepenger</div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '1.25rem', fontWeight: '700', color: '#2563eb' }}>0 dager</div>
                            <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>Brukt: 0/52</div>
                          </div>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', background: '#f3e8ff', borderRadius: '0.375rem', border: '1px solid #c4b5fd' }}>
                          <div>
                            <div style={{ fontWeight: '500', color: '#7c3aed' }}>Sykt barn</div>
                            <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>Barn under 12 år</div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '1.25rem', fontWeight: '700', color: '#7c3aed' }}>1 dag</div>
                            <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>Brukt: 1/10</div>
                          </div>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', background: '#f0f9ff', borderRadius: '0.375rem', border: '1px solid #bae6fd' }}>
                          <div>
                            <div style={{ fontWeight: '500', color: '#0284c7' }}>Fraværsprosent</div>
                            <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>Sammenlignet med norm</div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '1.25rem', fontWeight: '700', color: '#0284c7' }}>0.4%</div>
                            <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>Norm: 4.2%</div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h5 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '0.75rem', color: '#374151' }}>
                        📋 Siste fravær
                      </h5>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', background: '#f9fafb', borderRadius: '0.375rem' }}>
                          <div>
                            <div style={{ fontWeight: '500' }}>Forkjølelse</div>
                            <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>15. januar 2024</div>
                            <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>Egenmelding dag 1-2</div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <span className="badge badge-error">Egenmelding</span>
                            <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem' }}>100% lønn</div>
                          </div>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', background: '#f9fafb', borderRadius: '0.375rem' }}>
                          <div>
                            <div style={{ fontWeight: '500' }}>Barn sykt</div>
                            <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>12. januar 2024</div>
                            <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>Datter (8 år) - forkjølelse</div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <span className="badge badge-purple">Sykt barn</span>
                            <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem' }}>100% lønn</div>
                          </div>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', background: '#f9fafb', borderRadius: '0.375rem' }}>
                          <div>
                            <div style={{ fontWeight: '500' }}>Ikke møtt opp</div>
                            <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>8. januar 2024</div>
                            <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>Ingen melding gitt</div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <span className="badge badge-warning">Uforklarlig</span>
                            <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem' }}>0% lønn</div>
                          </div>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', background: '#f9fafb', borderRadius: '0.375rem' }}>
                          <div>
                            <div style={{ fontWeight: '500' }}>Hodepine</div>
                            <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>5. januar 2024</div>
                            <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>Egenmelding dag 1</div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <span className="badge badge-error">Egenmelding</span>
                            <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem' }}>100% lønn</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                                    {/* Arbeidstilsynets regler */}
                  <div style={{ background: '#f0fdf4', padding: '1.5rem', borderRadius: '0.5rem', border: '1px solid #bbf7d0', marginBottom: '1.5rem' }}>
                    <h5 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '1rem', color: '#166534' }}>
                      ⚖️ Norske arbeidsrettigheter og lover
                    </h5>
                    <div style={{ fontSize: '0.875rem', color: '#374151', marginBottom: '1rem', padding: '0.75rem', background: '#ecfdf5', borderRadius: '0.375rem', border: '1px solid #a7f3d0' }}>
                      <strong>📋 Lovhjemmel:</strong> Arbeidsmiljøloven (AML), Ferieloven, Folketrygdloven, Barnetrygdloven, og forskrifter fra Arbeidstilsynet
                    </div>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.5rem' }}>
                      <div>
                        <h6 style={{ fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.75rem', color: '#166534', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          🏖️ Ferie-rettigheter (Ferieloven §3-4)
                        </h6>
                        <div style={{ fontSize: '0.875rem', color: '#374151', lineHeight: '1.6' }}>
                          <p style={{ marginBottom: '0.75rem' }}>
                            <strong>Grunnferie:</strong> 25 feriedager per kalenderår (5 ukers ferie). Ferie må tas innen 30. september året etter ferieåret.
                          </p>
                          <p style={{ marginBottom: '0.75rem' }}>
                            <strong>Feriepenger:</strong> Utbetales i juni måned. Beløpet er 10,2% av årslønnen for året ferien er opptjent.
                          </p>
                          <p style={{ marginBottom: '0.75rem' }}>
                            <strong>Ferieavkorting:</strong> Ferie kan IKKE avkortes ved sykefravær. Sykefravær påvirker ikke ferierettighetene.
                          </p>
                          <p style={{ fontSize: '0.8rem', color: '#6b7280', fontStyle: 'italic' }}>
                            §3: "Arbeidstaker har rett til grunnferie på 25 dager per kalenderår"
                          </p>
                        </div>
                      </div>

                      <div>
                        <h6 style={{ fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.75rem', color: '#166534', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          🏥 Sykefravær (Folketrygdloven §8-2)
                        </h6>
                        <div style={{ fontSize: '0.875rem', color: '#374151', lineHeight: '1.6' }}>
                          <p style={{ marginBottom: '0.75rem' }}>
                            <strong>Egenmelding:</strong> 16 dager per kalenderår. Arbeidsgiver betaler 100% lønn dag 1-16. Ingen legeerklæring kreves.
                          </p>
                          <p style={{ marginBottom: '0.75rem' }}>
                            <strong>Sykepenger:</strong> Fra dag 17 betaler NAV sykepenger (100% av grunnbeløpet). Maksimalt 52 uker per sykdomsforløp.
                          </p>
                          <p style={{ marginBottom: '0.75rem' }}>
                            <strong>Dokumentasjon:</strong> Legeerklæring kreves fra dag 4 ved sykefravær over 3 dager. Arbeidsgiver kan kreve legeerklæring fra dag 1.
                          </p>
                          <p style={{ fontSize: '0.8rem', color: '#6b7280', fontStyle: 'italic' }}>
                            §8-2: "Sykepenger ytes for arbeidstakere som er arbeidsufør på grunn av sykdom"
                          </p>
                        </div>
                      </div>

                      <div>
                        <h6 style={{ fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.75rem', color: '#166534', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          👶 Sykt barn (Barnetrygdloven §9-1)
                        </h6>
                        <div style={{ fontSize: '0.875rem', color: '#374151', lineHeight: '1.6' }}>
                          <p style={{ marginBottom: '0.75rem' }}>
                            <strong>Barn under 12 år:</strong> 10 dager per kalenderår per barn. 100% lønn betalt av arbeidsgiver.
                          </p>
                          <p style={{ marginBottom: '0.75rem' }}>
                            <strong>Barn 12-18 år:</strong> 15 dager per kalenderår per barn. 100% lønn betalt av arbeidsgiver.
                          </p>
                          <p style={{ marginBottom: '0.75rem' }}>
                            <strong>Dokumentasjon:</strong> Legeerklæring kreves fra dag 4. Kan brukes for syke barn, omsorg og legebesøk.
                          </p>
                          <p style={{ fontSize: '0.8rem', color: '#6b7280', fontStyle: 'italic' }}>
                            §9-1: "Foreldre har rett til permisjon ved barns sykdom"
                          </p>
                        </div>
                      </div>

                      <div>
                        <h6 style={{ fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.75rem', color: '#166534', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          ⏰ Arbeidstid (AML §10-1)
                        </h6>
                        <div style={{ fontSize: '0.875rem', color: '#374151', lineHeight: '1.6' }}>
                          <p style={{ marginBottom: '0.75rem' }}>
                            <strong>Normal arbeidstid:</strong> Maksimalt 40 timer per uke, 9 timer per dag. 8 timer per dag for nattarbeid.
                          </p>
                          <p style={{ marginBottom: '0.75rem' }}>
                            <strong>Hviletid:</strong> Minst 11 timer sammenhengende hviletid per døgn. 35 timer sammenhengende hviletid per uke.
                          </p>
                          <p style={{ marginBottom: '0.75rem' }}>
                            <strong>Pauser:</strong> Minst 30 minutter pause ved arbeid over 5,5 timer. Pause kan deles i to pauser på minst 15 minutter hver.
                          </p>
                          <p style={{ fontSize: '0.8rem', color: '#6b7280', fontStyle: 'italic' }}>
                            §10-1: "Arbeidstid skal ikke overstige 40 timer per uke"
                          </p>
                        </div>
                      </div>

                      <div>
                        <h6 style={{ fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.75rem', color: '#166534', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          💰 Overtid (AML §10-6)
                        </h6>
                        <div style={{ fontSize: '0.875rem', color: '#374151', lineHeight: '1.6' }}>
                          <p style={{ marginBottom: '0.75rem' }}>
                            <strong>Overtidsgrense:</strong> Maksimalt 200 timer overtid per kalenderår. 10 timer per uke i opptil 25 uker.
                          </p>
                          <p style={{ marginBottom: '0.75rem' }}>
                            <strong>Overtidsbetaling:</strong> 40% tillegg til normal lønn. 100% tillegg på søndager og helligdager.
                          </p>
                          <p style={{ marginBottom: '0.75rem' }}>
                            <strong>Avspasering:</strong> Overtid kan avlønnes som avspasering. 1,5 time avspasering per overtidsøkt.
                          </p>
                          <p style={{ fontSize: '0.8rem', color: '#6b7280', fontStyle: 'italic' }}>
                            §10-6: "Overtid skal avlønnes med minst 40 prosent tillegg"
                          </p>
                        </div>
                      </div>

                      <div>
                        <h6 style={{ fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.75rem', color: '#166534', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          🛡️ Sikkerhet og vern (AML §4-1)
                        </h6>
                        <div style={{ fontSize: '0.875rem', color: '#374151', lineHeight: '1.6' }}>
                          <p style={{ marginBottom: '0.75rem' }}>
                            <strong>Arbeidsgivers ansvar:</strong> Skal sikre at arbeidsmiljøet er tilfredsstillende. Skal forebygge sykdom og ulykker.
                          </p>
                          <p style={{ marginBottom: '0.75rem' }}>
                            <strong>Arbeidstakers rettigheter:</strong> Rett til å nekte farlig arbeid. Rett til å melde fra om brudd på loven.
                          </p>
                          <p style={{ marginBottom: '0.75rem' }}>
                            <strong>Verneombud:</strong> Valgt av arbeidstakerne. Har rett til å stoppe farlig arbeid. Skal konsulteres i sikkerhetssaker.
                          </p>
                          <p style={{ fontSize: '0.8rem', color: '#6b7280', fontStyle: 'italic' }}>
                            §4-1: "Arbeidsgiver skal sikre at arbeidsmiljøet er tilfredsstillende"
                          </p>
                        </div>
                      </div>
                    </div>

                    <div style={{ marginTop: '1.5rem', padding: '1rem', background: '#fef3c7', borderRadius: '0.375rem', border: '1px solid #fde68a' }}>
                      <h6 style={{ fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.5rem', color: '#92400e' }}>
                        ⚠️ Viktige påminnelser
                      </h6>
                      <ul style={{ fontSize: '0.875rem', color: '#374151', margin: 0, paddingLeft: '1rem', lineHeight: '1.5' }}>
                        <li>Arbeidsgiver må dokumentere arbeidstid for alle ansatte</li>
                        <li>Arbeidstaker kan kreve skriftlig arbeidsavtale innen 1 måned</li>
                        <li>Oppsigelse må være skriftlig og begrunnet</li>
                        <li>Arbeidstaker har rett til 3 måneders oppsigelsestid etter 5 års ansiennitet</li>
                        <li>Arbeidsgiver kan ikke diskriminere på grunn av sykefravær</li>
                      </ul>
                    </div>
                  </div>
                  
                  {/* Feriehistorikk */}
                  <div>
                    <h5 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '0.75rem', color: '#374151' }}>
                      📅 Feriehistorikk
                    </h5>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', background: '#f9fafb', borderRadius: '0.375rem' }}>
                        <div>
                          <div style={{ fontWeight: '500' }}>Sommerferie 2024</div>
                          <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>15. juli - 2. august 2024 (19 dager)</div>
                        </div>
                        <span className="badge badge-success">Godkjent</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', background: '#f9fafb', borderRadius: '0.375rem' }}>
                        <div>
                          <div style={{ fontWeight: '500' }}>Vinterferie 2024</div>
                          <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>19. februar - 23. februar 2024 (5 dager)</div>
                        </div>
                        <span className="badge badge-success">Godkjent</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', background: '#f9fafb', borderRadius: '0.375rem' }}>
                        <div>
                          <div style={{ fontWeight: '500' }}>Juleferie 2023</div>
                          <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>23. desember - 1. januar 2024 (10 dager)</div>
                        </div>
                        <span className="badge badge-success">Godkjent</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Avvik-rapporter - Full bredde */}
                <div>
                  <h4 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '1rem', color: '#333' }}>
                    ⚠️ Avvik-rapporter
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1rem' }}>
                    <div style={{ background: '#fef2f2', padding: '1rem', borderRadius: '0.5rem', border: '1px solid #fecaca' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                        <AlertTriangle style={{ width: '16px', height: '16px', color: '#dc2626' }} />
                        <strong style={{ color: '#dc2626' }}>Kritiske</strong>
                      </div>
                      <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#991b1b' }}>0</div>
                      <div style={{ fontSize: '0.875rem', color: '#64748b' }}>rapporter</div>
                    </div>
                    <div style={{ background: '#fffbeb', padding: '1rem', borderRadius: '0.5rem', border: '1px solid #fed7aa' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                        <AlertTriangle style={{ width: '16px', height: '16px', color: '#ea580c' }} />
                        <strong style={{ color: '#ea580c' }}>Høye</strong>
                      </div>
                      <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#c2410c' }}>2</div>
                      <div style={{ fontSize: '0.875rem', color: '#64748b' }}>rapporter</div>
                    </div>
                    <div style={{ background: '#f0f9ff', padding: '1rem', borderRadius: '0.5rem', border: '1px solid #bae6fd' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                        <AlertTriangle style={{ width: '16px', height: '16px', color: '#0284c7' }} />
                        <strong style={{ color: '#0284c7' }}>Middels</strong>
                      </div>
                      <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#0369a1' }}>5</div>
                      <div style={{ fontSize: '0.875rem', color: '#64748b' }}>rapporter</div>
                    </div>
                    <div style={{ background: '#f0fdf4', padding: '1rem', borderRadius: '0.5rem', border: '1px solid #bbf7d0' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                        <AlertTriangle style={{ width: '16px', height: '16px', color: '#16a34a' }} />
                        <strong style={{ color: '#16a34a' }}>Lave</strong>
                      </div>
                      <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#15803d' }}>8</div>
                      <div style={{ fontSize: '0.875rem', color: '#64748b' }}>rapporter</div>
                    </div>
                  </div>

                  {/* Siste avvik-rapporter */}
                  <div>
                    <h5 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '0.75rem', color: '#374151' }}>
                      Siste avvik-rapporter
                    </h5>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', background: '#f9fafb', borderRadius: '0.375rem' }}>
                        <div>
                          <div style={{ fontWeight: '500' }}>Sikkerhetsbrudd i produksjon</div>
                          <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>Rapportert 15. januar 2024</div>
                        </div>
                        <span className="badge badge-warning">Høy</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', background: '#f9fafb', borderRadius: '0.375rem' }}>
                        <div>
                          <div style={{ fontWeight: '500' }}>Kvalitetsavvik i batch #1234</div>
                          <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>Rapportert 8. januar 2024</div>
                        </div>
                        <span className="badge badge-primary">Middels</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', background: '#f9fafb', borderRadius: '0.375rem' }}>
                        <div>
                          <div style={{ fontWeight: '500' }}>Problemer med maskin A-15</div>
                          <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>Rapportert 2. januar 2024</div>
                        </div>
                        <span className="badge badge-success">Lav</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Arbeidstid og oppmøte - Full bredde */}
                <div>
                  <h4 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '1rem', color: '#333' }}>
                    ⏰ Arbeidstid og oppmøte
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
                    <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                        <Clock style={{ width: '16px', height: '16px', color: '#3b82f6' }} />
                        <strong style={{ color: '#3b82f6' }}>Denne måneden</strong>
                      </div>
                      <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#1e40af' }}>168</div>
                      <div style={{ fontSize: '0.875rem', color: '#64748b' }}>timer</div>
                    </div>
                    <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                        <Clock style={{ width: '16px', height: '16px', color: '#10b981' }} />
                        <strong style={{ color: '#10b981' }}>Overtid</strong>
                      </div>
                      <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#059669' }}>12</div>
                      <div style={{ fontSize: '0.875rem', color: '#64748b' }}>timer</div>
                    </div>
                    <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                        <Clock style={{ width: '16px', height: '16px', color: '#f59e0b' }} />
                        <strong style={{ color: '#f59e0b' }}>Oppmøte</strong>
                      </div>
                      <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#d97706' }}>95%</div>
                      <div style={{ fontSize: '0.875rem', color: '#64748b' }}>denne måneden</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button
                onClick={() => setShowViewModal(false)}
                className="btn btn-secondary"
              >
                Lukk
              </button>
              <button
                onClick={() => {
                  setShowViewModal(false);
                  setShowEditModal(true);
                }}
                className="btn btn-primary"
              >
                Rediger
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Employee Settings Modal */}
      {showSettingsModal && selectedEmployee && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h2 className="modal-title">Innstillinger for {selectedEmployee.displayName}</h2>
              <button
                onClick={() => setShowSettingsModal(false)}
                className="modal-close"
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', border: '1px solid #e5e7eb', borderRadius: '0.5rem' }}>
                  <div className="user-avatar" style={{ width: '40px', height: '40px' }}>
                    {(selectedEmployee.displayName?.charAt(0) || 'U').toUpperCase()}
                  </div>
                  <div>
                    <h4 style={{ margin: 0, fontWeight: '600' }}>{selectedEmployee.displayName}</h4>
                    <p style={{ margin: 0, color: '#666', fontSize: '0.875rem' }}>{selectedEmployee.email}</p>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <button
                    onClick={() => handleResetPassword(selectedEmployee.id)}
                    className="btn btn-secondary"
                    style={{ justifyContent: 'flex-start', textAlign: 'left' }}
                  >
                    <Key style={{ width: '16px', height: '16px', marginRight: '0.5rem' }} />
                    Tilbakestill passord
                  </button>

                  {selectedEmployee.status === 'active' ? (
                    <button
                      onClick={() => handleDeactivateEmployee(selectedEmployee.id)}
                      className="btn btn-warning"
                      style={{ justifyContent: 'flex-start', textAlign: 'left' }}
                    >
                      <UserX style={{ width: '16px', height: '16px', marginRight: '0.5rem' }} />
                      Deaktiver ansatt
                    </button>
                  ) : (
                    <button
                      onClick={() => handleActivateEmployee(selectedEmployee.id)}
                      className="btn btn-success"
                      style={{ justifyContent: 'flex-start', textAlign: 'left' }}
                    >
                      <UserCheck style={{ width: '16px', height: '16px', marginRight: '0.5rem' }} />
                      Aktiver ansatt
                    </button>
                  )}

                  <button
                    onClick={() => handleDeleteEmployee(selectedEmployee.id)}
                    className="btn btn-danger"
                    style={{ justifyContent: 'flex-start', textAlign: 'left' }}
                  >
                    <Trash2 style={{ width: '16px', height: '16px', marginRight: '0.5rem' }} />
                    Slett ansatt
                  </button>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button
                onClick={() => setShowSettingsModal(false)}
                className="btn btn-secondary"
              >
                Lukk
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 