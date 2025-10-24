'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { firebaseService, Employee, Department, Shift, TimeClock } from '@/lib/firebase-services';
import { 
  Users, User, Clock, Calendar, DollarSign, 
  Plus, Search, Filter, Download, Eye, Edit, Trash2,
  CheckCircle, XCircle, AlertTriangle, TrendingUp,
  Building, Mail, Phone, MapPin, Briefcase, Heart,
  Play, Pause, StopCircle, MoreHorizontal, Settings,
  BarChart3, UserPlus, UserX, UserCheck, Key, Plane,
  Home, Briefcase as BriefcaseIcon, Clock as ClockIcon,
  CalendarDays, Hash, Target, Info, Database, RefreshCw,
  Save, Loader2, X, Link, SortAsc, SortDesc, Grid, List,
  ExternalLink, Star, Upload, FileText, CheckCircle2
} from 'lucide-react';

// Interfaces
interface Absence {
  id: string;
  employeeId: string;
  employeeName: string;
  type: 'sick' | 'personal' | 'other';
  startDate: string;
  endDate: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  approvedBy?: string;
  approvedAt?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

interface Vacation {
  id: string;
  employeeId: string;
  employeeName: string;
  type: 'vacation' | 'sick' | 'personal' | 'other';
  startDate: string;
  endDate: string;
  days: number;
  status: 'pending' | 'approved' | 'rejected';
  approvedBy?: string;
  approvedAt?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export default function HRPage() {
  const { userProfile } = useAuth();
  const [activeTab, setActiveTab] = useState('employees');
  const [isMobile, setIsMobile] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Data states
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [timeEntries, setTimeEntries] = useState<TimeClock[]>([]);
  const [absences, setAbsences] = useState<Absence[]>([]);
  const [vacations, setVacations] = useState<Vacation[]>([]);
  
  // Search and filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  
  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  
  // Form states
  const [newEmployee, setNewEmployee] = useState({
    displayName: '',
    email: '',
    phone: '',
    departmentId: '',
    position: '',
    role: 'employee' as 'admin' | 'department_leader' | 'employee',
    status: 'active' as 'active' | 'inactive' | 'on_leave',
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
    avatar: '',
    permissions: {
      dashboard: true,
      employees: false,
      departments: false,
      projects: false,
      tasks: false,
      inventory: false,
      suppliers: false,
      finance: false,
      invoicing: false,
      payments: false,
      hr: false,
      crm: false,
      delivery: false,
      settings: false,
      mail: false,
      reports: false,
      analytics: false,
      notifications: true,
      calendar: true,
      documents: false,
      training: false,
      compliance: false,
      maintenance: false,
      quality: false,
      safety: false,
      procurement: false,
      logistics: false,
      production: false,
      sales: false,
      marketing: false,
      customerService: false,
      it: false,
      legal: false,
      audit: false,
    },
    vacationAccess: {
      canRequestVacation: true,
      canApproveVacation: false,
      canViewAllVacations: false,
      vacationDaysPerYear: 25,
      managerApprovalRequired: true,
    },
    leadership: {
      isManager: false,
      managesDepartments: [] as string[],
      managesEmployees: [] as string[],
      reportsTo: '',
      canApproveExpenses: false,
      canApprovePurchases: false,
      budgetLimit: 0,
    },
  });

  const [newShift, setNewShift] = useState({
    title: '',
    description: '',
    startTime: '',
    endTime: '',
    location: '',
    notes: ''
  });

  const [newDepartment, setNewDepartment] = useState({
    name: '',
    description: '',
    location: '',
    budget: 0,
    managerId: ''
  });

  const [newAbsence, setNewAbsence] = useState({
    employeeId: '',
    employeeName: '',
    type: 'sick' as 'sick' | 'personal' | 'other',
    startDate: '',
    endDate: '',
    reason: '',
    notes: ''
  });

  const [newVacation, setNewVacation] = useState({
    employeeId: '',
    employeeName: '',
    type: 'vacation' as 'vacation' | 'sick' | 'personal' | 'other',
    startDate: '',
    endDate: '',
    days: 1,
    notes: ''
  });

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (userProfile?.companyId) {
      loadAllData();
    }
  }, [userProfile?.companyId]);

  const loadAllData = async () => {
    if (!userProfile?.companyId) return;

    try {
      setLoading(true);
      const [
        employeesData,
        departmentsData,
        shiftsData,
        timeEntriesData,
        absencesData,
        vacationsData
      ] = await Promise.all([
        firebaseService.getEmployees(userProfile.companyId),
        firebaseService.getDepartments(userProfile.companyId),
        firebaseService.getShifts(userProfile.companyId),
        firebaseService.getTimeClocks(userProfile.companyId),
        firebaseService.getAbsences(userProfile.companyId),
        firebaseService.getVacations(userProfile.companyId)
      ]);

      setEmployees(employeesData);
      setDepartments(departmentsData);
      setShifts(shiftsData);
      setTimeEntries(timeEntriesData);
      setAbsences(absencesData);
      setVacations(vacationsData);
    } catch (error) {
      console.error('Error loading HR data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter functions
  const getFilteredEmployees = () => {
    return employees.filter(employee => {
      const matchesSearch = employee.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           employee.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           employee.position?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesDepartment = selectedDepartment === 'all' || employee.departmentId === selectedDepartment;
      const matchesStatus = selectedStatus === 'all' || employee.status === selectedStatus;
      return matchesSearch && matchesDepartment && matchesStatus;
    });
  };

  const getFilteredShifts = () => {
    return shifts.filter(shift => {
      const matchesSearch = shift.notes?.toLowerCase().includes(searchTerm.toLowerCase()) || false;
      const matchesStatus = selectedStatus === 'all' || shift.status === selectedStatus;
      return matchesSearch && matchesStatus;
    });
  };

  const getFilteredTimeEntries = () => {
    return timeEntries.filter(entry => {
      const employee = employees.find(emp => emp.id === entry.employeeId);
      const department = departments.find(dept => dept.id === employee?.departmentId);
      
      const matchesSearch = employee?.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           employee?.employeeNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           department?.name?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = selectedStatus === 'all' || getEntryStatus(entry) === selectedStatus;
      const matchesDepartment = selectedDepartment === 'all' || employee?.departmentId === selectedDepartment;
      return matchesSearch && matchesStatus && matchesDepartment;
    });
  };

  const getFilteredDepartments = () => {
    return departments.filter(department => {
      const matchesSearch = department.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (department.description?.toLowerCase().includes(searchTerm.toLowerCase()) || false);
      return matchesSearch;
    });
  };

  const getFilteredAbsences = () => {
    return absences.filter(absence => {
      const matchesSearch = absence.employeeName.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = selectedStatus === 'all' || absence.status === selectedStatus;
      return matchesSearch && matchesStatus;
    });
  };

  const getFilteredVacations = () => {
    return vacations.filter(vacation => {
      const matchesSearch = vacation.employeeName.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = selectedStatus === 'all' || vacation.status === selectedStatus;
      return matchesSearch && matchesStatus;
    });
  };

  // Helper functions
  const getEntryStatus = (entry: TimeClock): 'active' | 'completed' | 'overtime' | 'late' => {
    if (!entry.clockOutTime) return 'active';
    if (entry.totalHours && entry.totalHours > 8) return 'overtime';
    const clockInTime = new Date(entry.clockInTime);
    const expectedStart = new Date(clockInTime);
    expectedStart.setHours(8, 0, 0, 0);
    if (clockInTime > expectedStart) return 'late';
    return 'completed';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return '#10b981';
      case 'completed': return '#3b82f6';
      case 'overtime': return '#f59e0b';
      case 'late': return '#ef4444';
      case 'scheduled': return '#3b82f6';
      case 'in-progress': return '#f59e0b';
      case 'approved': return '#10b981';
      case 'rejected': return '#ef4444';
      case 'pending': return '#f59e0b';
      default: return '#6b7280';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <Play style={{ width: '16px', height: '16px', color: '#10b981' }} />;
      case 'completed': return <CheckCircle style={{ width: '16px', height: '16px', color: '#3b82f6' }} />;
      case 'overtime': return <AlertTriangle style={{ width: '16px', height: '16px', color: '#f59e0b' }} />;
      case 'late': return <AlertTriangle style={{ width: '16px', height: '16px', color: '#ef4444' }} />;
      case 'scheduled': return <Clock style={{ width: '16px', height: '16px', color: '#3b82f6' }} />;
      case 'in-progress': return <Play style={{ width: '16px', height: '16px', color: '#f59e0b' }} />;
      case 'approved': return <CheckCircle style={{ width: '16px', height: '16px', color: '#10b981' }} />;
      case 'rejected': return <XCircle style={{ width: '16px', height: '16px', color: '#ef4444' }} />;
      case 'pending': return <Clock style={{ width: '16px', height: '16px', color: '#f59e0b' }} />;
      default: return <AlertTriangle style={{ width: '16px', height: '16px', color: '#6b7280' }} />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('nb-NO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('no-NO', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('nb-NO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getEmployeeName = (employeeId: string) => {
    const employee = employees.find(emp => emp.id === employeeId);
    return employee?.displayName || 'Ukjent ansatt';
  };

  const getDepartmentName = (departmentId: string) => {
    const department = departments.find(dept => dept.id === departmentId);
    return department?.name || 'Ukjent avdeling';
  };

  const getManagerName = (managerId: string) => {
    const manager = employees.find(emp => emp.id === managerId);
    return manager ? manager.displayName : 'Ikke tildelt';
  };

  // Statistics
  const getStats = () => {
    const activeEmployees = employees.filter(emp => emp.status === 'active').length;
    const activeShifts = shifts.filter(s => s.status === 'in_progress').length;
    const activeTimeEntries = timeEntries.filter(entry => !entry.clockOutTime).length;
    const pendingAbsences = absences.filter(a => a.status === 'pending').length;
    const pendingVacations = vacations.filter(v => v.status === 'pending').length;
    const totalDepartments = departments.length;

    return {
      totalEmployees: employees.length,
      activeEmployees,
      activeShifts,
      activeTimeEntries,
      pendingAbsences,
      pendingVacations,
      totalDepartments
    };
  };

  const stats = getStats();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Laster HR...</span>
      </div>
    );
  }

  return (
    <div style={{ background: 'var(--background-color)', minHeight: '100vh', padding: 'var(--space-6)' }}>
      {/* Header */}
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
          <div className="card-icon">
            <Users />
          </div>
          <div>
            <h1 className="page-title">HR & Personal</h1>
            <p className="page-subtitle">Administrer ansatte, vakter, fravær, ferie og avdelinger</p>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 'var(--space-4)', marginBottom: 'var(--space-6)' }}>
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <p style={{ color: 'var(--gray-600)', fontSize: 'var(--font-size-sm)', marginBottom: '0.5rem' }}>Totalt Ansatte</p>
              <p style={{ fontSize: 'var(--font-size-2xl)', fontWeight: '600', color: 'var(--blue-600)' }}>{stats.totalEmployees}</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.5rem' }}>
                <TrendingUp className="w-4 h-4 text-green-600" />
                <span style={{ color: 'var(--green-600)', fontSize: 'var(--font-size-sm)' }}>{stats.activeEmployees} aktive</span>
              </div>
            </div>
            <div className="card-icon" style={{ background: 'var(--blue-100)' }}>
              <Users className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <p style={{ color: 'var(--gray-600)', fontSize: 'var(--font-size-sm)', marginBottom: '0.5rem' }}>Aktive Vakter</p>
              <p style={{ fontSize: 'var(--font-size-2xl)', fontWeight: '600', color: 'var(--green-600)' }}>{stats.activeShifts}</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.5rem' }}>
                <Clock className="w-4 h-4 text-green-600" />
                <span style={{ color: 'var(--green-600)', fontSize: 'var(--font-size-sm)' }}>Pågående</span>
              </div>
            </div>
            <div className="card-icon" style={{ background: 'var(--green-100)' }}>
              <Clock className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <p style={{ color: 'var(--gray-600)', fontSize: 'var(--font-size-sm)', marginBottom: '0.5rem' }}>Aktive Stemplinger</p>
              <p style={{ fontSize: 'var(--font-size-2xl)', fontWeight: '600', color: 'var(--purple-600)' }}>{stats.activeTimeEntries}</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.5rem' }}>
                <Clock className="w-4 h-4 text-purple-600" />
                <span style={{ color: 'var(--purple-600)', fontSize: 'var(--font-size-sm)' }}>Innstemplte</span>
              </div>
            </div>
            <div className="card-icon" style={{ background: 'var(--purple-100)' }}>
              <Clock className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <p style={{ color: 'var(--gray-600)', fontSize: 'var(--font-size-sm)', marginBottom: '0.5rem' }}>Ventende Forespørsler</p>
              <p style={{ fontSize: 'var(--font-size-2xl)', fontWeight: '600', color: 'var(--orange-600)' }}>{stats.pendingAbsences + stats.pendingVacations}</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.5rem' }}>
                <AlertTriangle className="w-4 h-4 text-orange-600" />
                <span style={{ color: 'var(--orange-600)', fontSize: 'var(--font-size-sm)' }}>Krever handling</span>
              </div>
            </div>
            <div className="card-icon" style={{ background: 'var(--orange-100)' }}>
              <Calendar className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', borderBottom: '1px solid var(--gray-200)', overflowX: 'auto' }}>
          {[
            { id: 'employees', name: 'Ansatte', icon: Users },
            { id: 'shifts', name: 'Vakter', icon: Calendar },
            { id: 'absence-vacation', name: 'Fravær & Ferie', icon: Heart },
            { id: 'timeclock', name: 'Timeregistrering', icon: Clock },
            { id: 'departments', name: 'Avdelinger', icon: Building },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`btn ${activeTab === tab.id ? 'btn-primary' : 'btn-secondary'}`}
              style={{ 
                borderRadius: 0, 
                borderBottom: activeTab === tab.id ? '2px solid var(--blue-600)' : '2px solid transparent',
                whiteSpace: 'nowrap',
                minWidth: isMobile ? '120px' : '150px'
              }}
            >
              <tab.icon size={16} />
              {tab.name}
            </button>
          ))}
        </div>

        {/* Search and Filters */}
        <div style={{ padding: 'var(--space-4)', borderBottom: '1px solid var(--gray-200)' }}>
          <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ flex: '1', minWidth: '200px' }}>
              <div style={{ position: 'relative' }}>
                <Search style={{ 
                  position: 'absolute', 
                  left: '12px', 
                  top: '50%', 
                  transform: 'translateY(-50%)', 
                  color: 'var(--gray-400)', 
                  width: '16px', 
                  height: '16px' 
                }} />
                <input
                  type="text"
                  placeholder={`Søk i ${activeTab}...`}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{ 
                    width: '100%', 
                    padding: '0.75rem 0.75rem 0.75rem 2.5rem', 
                    border: '1px solid var(--gray-300)', 
                    borderRadius: 'var(--radius-lg)', 
                    outline: 'none'
                  }}
                />
              </div>
            </div>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              style={{ 
                padding: '0.75rem', 
                border: '1px solid var(--gray-300)', 
                borderRadius: 'var(--radius-lg)', 
                outline: 'none',
                minWidth: '150px'
              }}
            >
              <option value="all">Alle statuser</option>
              {activeTab === 'employees' && (
                <>
                  <option value="active">Aktiv</option>
                  <option value="inactive">Inaktiv</option>
                  <option value="on_leave">På permisjon</option>
                </>
              )}
              {activeTab === 'shifts' && (
                <>
                  <option value="scheduled">Planlagt</option>
                  <option value="in-progress">Pågår</option>
                  <option value="completed">Fullført</option>
                </>
              )}
              {activeTab === 'timeclock' && (
                <>
                  <option value="active">Aktiv</option>
                  <option value="completed">Fullført</option>
                  <option value="overtime">Overtid</option>
                  <option value="late">Forsinket</option>
                </>
              )}
              {(activeTab === 'absence-vacation') && (
                <>
                  <option value="pending">Venter</option>
                  <option value="approved">Godkjent</option>
                  <option value="rejected">Avvist</option>
                </>
              )}
            </select>
            {(activeTab === 'employees' || activeTab === 'timeclock') && (
              <select
                value={selectedDepartment}
                onChange={(e) => setSelectedDepartment(e.target.value)}
                style={{ 
                  padding: '0.75rem', 
                  border: '1px solid var(--gray-300)', 
                  borderRadius: 'var(--radius-lg)', 
                  outline: 'none',
                  minWidth: '150px'
                }}
              >
                <option value="all">Alle avdelinger</option>
                {departments.map(dept => (
                  <option key={dept.id} value={dept.id}>{dept.name}</option>
                ))}
              </select>
            )}
            <button 
              onClick={() => setShowAddModal(true)}
              className="btn btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              <Plus size={16} />
              Legg til {activeTab === 'employees' ? 'ansatt' : 
                       activeTab === 'shifts' ? 'vakt' : 
                       activeTab === 'absence-vacation' ? 'registrering' : 
                       activeTab === 'timeclock' ? 'oppføring' : 
                       'avdeling'}
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div style={{ padding: 'var(--space-6)' }}>
          {/* Employees Tab */}
          {activeTab === 'employees' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-6)' }}>
                <h2 style={{ fontSize: 'var(--font-size-xl)', fontWeight: '600', color: 'var(--gray-900)' }}>
                  Ansatte ({getFilteredEmployees().length})
                </h2>
              </div>
              <div className="card" style={{ padding: 0 }}>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ background: 'var(--gray-50)', borderBottom: '1px solid var(--gray-200)' }}>
                        <th style={{ padding: 'var(--space-4)', textAlign: 'left', fontWeight: '600', color: 'var(--gray-900)' }}>Navn</th>
                        <th style={{ padding: 'var(--space-4)', textAlign: 'left', fontWeight: '600', color: 'var(--gray-900)' }}>Stilling</th>
                        <th style={{ padding: 'var(--space-4)', textAlign: 'left', fontWeight: '600', color: 'var(--gray-900)' }}>Avdeling</th>
                        <th style={{ padding: 'var(--space-4)', textAlign: 'left', fontWeight: '600', color: 'var(--gray-900)' }}>E-post</th>
                        <th style={{ padding: 'var(--space-4)', textAlign: 'left', fontWeight: '600', color: 'var(--gray-900)' }}>Status</th>
                        <th style={{ padding: 'var(--space-4)', textAlign: 'left', fontWeight: '600', color: 'var(--gray-900)' }}>Handlinger</th>
                      </tr>
                    </thead>
                    <tbody>
                      {getFilteredEmployees().map((employee) => (
                        <tr key={employee.id} style={{ borderBottom: '1px solid var(--gray-200)' }}>
                          <td style={{ padding: 'var(--space-4)', color: 'var(--gray-900)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                              <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--blue-100)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <User className="w-4 h-4 text-blue-600" />
                              </div>
                              {employee.displayName}
                            </div>
                          </td>
                          <td style={{ padding: 'var(--space-4)', color: 'var(--gray-900)' }}>{employee.position}</td>
                          <td style={{ padding: 'var(--space-4)', color: 'var(--gray-600)' }}>{getDepartmentName(employee.departmentId || '')}</td>
                          <td style={{ padding: 'var(--space-4)', color: 'var(--gray-600)' }}>{employee.email}</td>
                          <td style={{ padding: 'var(--space-4)' }}>
                            <span style={{
                              padding: '0.25rem 0.75rem',
                              borderRadius: 'var(--border-radius)',
                              fontSize: 'var(--font-size-sm)',
                              fontWeight: '500',
                              background: employee.status === 'active' ? 'var(--green-100)' : 
                                         employee.status === 'inactive' ? 'var(--red-100)' : 'var(--orange-100)',
                              color: employee.status === 'active' ? 'var(--green-700)' : 
                                     employee.status === 'inactive' ? 'var(--red-700)' : 'var(--orange-700)'
                            }}>
                              {employee.status === 'active' ? 'Aktiv' : 
                               employee.status === 'inactive' ? 'Inaktiv' : 'På permisjon'}
                            </span>
                          </td>
                          <td style={{ padding: 'var(--space-4)' }}>
                            <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                              <button className="btn btn-sm btn-secondary">
                                <Eye size={14} />
                              </button>
                              <button className="btn btn-sm btn-primary">
                                <Edit size={14} />
                              </button>
                              <button className="btn btn-sm btn-danger">
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Shifts Tab */}
          {activeTab === 'shifts' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-6)' }}>
                <h2 style={{ fontSize: 'var(--font-size-xl)', fontWeight: '600', color: 'var(--gray-900)' }}>
                  Vakter ({getFilteredShifts().length})
                </h2>
              </div>
              <div className="card" style={{ padding: 0 }}>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ background: 'var(--gray-50)', borderBottom: '1px solid var(--gray-200)' }}>
                        <th style={{ padding: 'var(--space-4)', textAlign: 'left', fontWeight: '600', color: 'var(--gray-900)' }}>Ansatt</th>
                        <th style={{ padding: 'var(--space-4)', textAlign: 'left', fontWeight: '600', color: 'var(--gray-900)' }}>Start</th>
                        <th style={{ padding: 'var(--space-4)', textAlign: 'left', fontWeight: '600', color: 'var(--gray-900)' }}>Slutt</th>
                        <th style={{ padding: 'var(--space-4)', textAlign: 'left', fontWeight: '600', color: 'var(--gray-900)' }}>Type</th>
                        <th style={{ padding: 'var(--space-4)', textAlign: 'left', fontWeight: '600', color: 'var(--gray-900)' }}>Status</th>
                        <th style={{ padding: 'var(--space-4)', textAlign: 'left', fontWeight: '600', color: 'var(--gray-900)' }}>Handlinger</th>
                      </tr>
                    </thead>
                    <tbody>
                      {getFilteredShifts().map((shift) => (
                        <tr key={shift.id} style={{ borderBottom: '1px solid var(--gray-200)' }}>
                          <td style={{ padding: 'var(--space-4)', color: 'var(--gray-900)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                              <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--blue-100)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <User className="w-4 h-4 text-blue-600" />
                              </div>
                              {getEmployeeName(shift.employeeId)}
                            </div>
                          </td>
                          <td style={{ padding: 'var(--space-4)', color: 'var(--gray-900)' }}>{formatDateTime(shift.startTime)}</td>
                          <td style={{ padding: 'var(--space-4)', color: 'var(--gray-900)' }}>{formatDateTime(shift.endTime)}</td>
                          <td style={{ padding: 'var(--space-4)', color: 'var(--gray-600)' }}>
                            {shift.type === 'regular' ? 'Vanlig' : 
                             shift.type === 'overtime' ? 'Overtid' : 
                             shift.type === 'night' ? 'Natt' : 'Helg'}
                          </td>
                          <td style={{ padding: 'var(--space-4)' }}>
                            <div style={{ 
                              display: 'flex', 
                              alignItems: 'center', 
                              gap: '0.5rem',
                              padding: '0.25rem 0.75rem',
                              borderRadius: 'var(--radius-full)',
                              background: 'var(--gray-100)',
                              width: 'fit-content'
                            }}>
                              {getStatusIcon(shift.status)}
                              <span style={{ 
                                fontSize: 'var(--font-size-sm)', 
                                fontWeight: '500', 
                                color: getStatusColor(shift.status) 
                              }}>
                                {shift.status === 'scheduled' ? 'Planlagt' : 
                                 shift.status === 'in_progress' ? 'Pågår' : 
                                 shift.status === 'completed' ? 'Fullført' : 'Kansellert'}
                              </span>
                            </div>
                          </td>
                          <td style={{ padding: 'var(--space-4)' }}>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                              <button className="btn btn-sm btn-secondary">
                                <Eye size={14} />
                              </button>
                              <button className="btn btn-sm btn-primary">
                                <Edit size={14} />
                              </button>
                              <button className="btn btn-sm btn-danger">
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Absence & Vacation Tab */}
          {activeTab === 'absence-vacation' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-6)' }}>
                <h2 style={{ fontSize: 'var(--font-size-xl)', fontWeight: '600', color: 'var(--gray-900)' }}>
                  Fravær og Ferie ({getFilteredAbsences().length + getFilteredVacations().length})
                </h2>
              </div>
              
              {/* Absences */}
              <div style={{ marginBottom: 'var(--space-6)' }}>
                <h3 style={{ fontSize: 'var(--font-size-lg)', fontWeight: '600', color: 'var(--gray-900)', marginBottom: 'var(--space-4)' }}>
                  Fravær ({getFilteredAbsences().length})
                </h3>
                <div className="card" style={{ padding: 0 }}>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ background: 'var(--gray-50)', borderBottom: '1px solid var(--gray-200)' }}>
                          <th style={{ padding: 'var(--space-4)', textAlign: 'left', fontWeight: '600', color: 'var(--gray-900)' }}>Ansatt</th>
                          <th style={{ padding: 'var(--space-4)', textAlign: 'left', fontWeight: '600', color: 'var(--gray-900)' }}>Type</th>
                          <th style={{ padding: 'var(--space-4)', textAlign: 'left', fontWeight: '600', color: 'var(--gray-900)' }}>Periode</th>
                          <th style={{ padding: 'var(--space-4)', textAlign: 'left', fontWeight: '600', color: 'var(--gray-900)' }}>Årsak</th>
                          <th style={{ padding: 'var(--space-4)', textAlign: 'left', fontWeight: '600', color: 'var(--gray-900)' }}>Status</th>
                          <th style={{ padding: 'var(--space-4)', textAlign: 'left', fontWeight: '600', color: 'var(--gray-900)' }}>Handlinger</th>
                        </tr>
                      </thead>
                      <tbody>
                        {getFilteredAbsences().map((absence) => (
                          <tr key={absence.id} style={{ borderBottom: '1px solid var(--gray-200)' }}>
                            <td style={{ padding: 'var(--space-4)', color: 'var(--gray-900)' }}>{absence.employeeName}</td>
                            <td style={{ padding: 'var(--space-4)', color: 'var(--gray-600)' }}>
                              {absence.type === 'sick' ? 'Sykdom' : 
                               absence.type === 'personal' ? 'Personlig' : 'Annet'}
                            </td>
                            <td style={{ padding: 'var(--space-4)', color: 'var(--gray-600)' }}>
                              {formatDate(absence.startDate)} - {formatDate(absence.endDate)}
                            </td>
                            <td style={{ padding: 'var(--space-4)', color: 'var(--gray-600)' }}>{absence.reason}</td>
                            <td style={{ padding: 'var(--space-4)' }}>
                              <span style={{
                                padding: '0.25rem 0.75rem',
                                borderRadius: 'var(--border-radius)',
                                fontSize: 'var(--font-size-sm)',
                                fontWeight: '500',
                                background: absence.status === 'approved' ? 'var(--green-100)' : 
                                           absence.status === 'rejected' ? 'var(--red-100)' : 'var(--yellow-100)',
                                color: absence.status === 'approved' ? 'var(--green-700)' : 
                                       absence.status === 'rejected' ? 'var(--red-700)' : 'var(--yellow-700)'
                              }}>
                                {absence.status === 'pending' ? 'Venter' : 
                                 absence.status === 'approved' ? 'Godkjent' : 'Avvist'}
                              </span>
                            </td>
                            <td style={{ padding: 'var(--space-4)' }}>
                              <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <button className="btn btn-sm btn-secondary">
                                  <Eye size={14} />
                                </button>
                                <button className="btn btn-sm btn-primary">
                                  <Edit size={14} />
                                </button>
                                <button className="btn btn-sm btn-danger">
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Vacations */}
              <div>
                <h3 style={{ fontSize: 'var(--font-size-lg)', fontWeight: '600', color: 'var(--gray-900)', marginBottom: 'var(--space-4)' }}>
                  Ferie ({getFilteredVacations().length})
                </h3>
                <div className="card" style={{ padding: 0 }}>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ background: 'var(--gray-50)', borderBottom: '1px solid var(--gray-200)' }}>
                          <th style={{ padding: 'var(--space-4)', textAlign: 'left', fontWeight: '600', color: 'var(--gray-900)' }}>Ansatt</th>
                          <th style={{ padding: 'var(--space-4)', textAlign: 'left', fontWeight: '600', color: 'var(--gray-900)' }}>Type</th>
                          <th style={{ padding: 'var(--space-4)', textAlign: 'left', fontWeight: '600', color: 'var(--gray-900)' }}>Periode</th>
                          <th style={{ padding: 'var(--space-4)', textAlign: 'left', fontWeight: '600', color: 'var(--gray-900)' }}>Dager</th>
                          <th style={{ padding: 'var(--space-4)', textAlign: 'left', fontWeight: '600', color: 'var(--gray-900)' }}>Status</th>
                          <th style={{ padding: 'var(--space-4)', textAlign: 'left', fontWeight: '600', color: 'var(--gray-900)' }}>Handlinger</th>
                        </tr>
                      </thead>
                      <tbody>
                        {getFilteredVacations().map((vacation) => (
                          <tr key={vacation.id} style={{ borderBottom: '1px solid var(--gray-200)' }}>
                            <td style={{ padding: 'var(--space-4)', color: 'var(--gray-900)' }}>{vacation.employeeName}</td>
                            <td style={{ padding: 'var(--space-4)', color: 'var(--gray-600)' }}>
                              {vacation.type === 'vacation' ? 'Ferie' : 
                               vacation.type === 'sick' ? 'Sykdom' : 
                               vacation.type === 'personal' ? 'Personlig' : 'Annet'}
                            </td>
                            <td style={{ padding: 'var(--space-4)', color: 'var(--gray-600)' }}>
                              {formatDate(vacation.startDate)} - {formatDate(vacation.endDate)}
                            </td>
                            <td style={{ padding: 'var(--space-4)', color: 'var(--gray-600)' }}>{vacation.days} dager</td>
                            <td style={{ padding: 'var(--space-4)' }}>
                              <span style={{
                                padding: '0.25rem 0.75rem',
                                borderRadius: 'var(--border-radius)',
                                fontSize: 'var(--font-size-sm)',
                                fontWeight: '500',
                                background: vacation.status === 'approved' ? 'var(--green-100)' : 
                                           vacation.status === 'rejected' ? 'var(--red-100)' : 'var(--yellow-100)',
                                color: vacation.status === 'approved' ? 'var(--green-700)' : 
                                       vacation.status === 'rejected' ? 'var(--red-700)' : 'var(--yellow-700)'
                              }}>
                                {vacation.status === 'pending' ? 'Venter' : 
                                 vacation.status === 'approved' ? 'Godkjent' : 'Avvist'}
                              </span>
                            </td>
                            <td style={{ padding: 'var(--space-4)' }}>
                              <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <button className="btn btn-sm btn-secondary">
                                  <Eye size={14} />
                                </button>
                                <button className="btn btn-sm btn-primary">
                                  <Edit size={14} />
                                </button>
                                <button className="btn btn-sm btn-danger">
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Timeclock Tab */}
          {activeTab === 'timeclock' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-6)' }}>
                <h2 style={{ fontSize: 'var(--font-size-xl)', fontWeight: '600', color: 'var(--gray-900)' }}>
                  Timeregistrering ({getFilteredTimeEntries().length})
                </h2>
              </div>
              <div className="card" style={{ padding: 0 }}>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ background: 'var(--gray-50)', borderBottom: '1px solid var(--gray-200)' }}>
                        <th style={{ padding: 'var(--space-4)', textAlign: 'left', fontWeight: '600', color: 'var(--gray-900)' }}>Ansatt</th>
                        <th style={{ padding: 'var(--space-4)', textAlign: 'left', fontWeight: '600', color: 'var(--gray-900)' }}>Avdeling</th>
                        <th style={{ padding: 'var(--space-4)', textAlign: 'left', fontWeight: '600', color: 'var(--gray-900)' }}>Dato</th>
                        <th style={{ padding: 'var(--space-4)', textAlign: 'left', fontWeight: '600', color: 'var(--gray-900)' }}>Inn/Ut</th>
                        <th style={{ padding: 'var(--space-4)', textAlign: 'left', fontWeight: '600', color: 'var(--gray-900)' }}>Timer</th>
                        <th style={{ padding: 'var(--space-4)', textAlign: 'left', fontWeight: '600', color: 'var(--gray-900)' }}>Status</th>
                        <th style={{ padding: 'var(--space-4)', textAlign: 'left', fontWeight: '600', color: 'var(--gray-900)' }}>Handlinger</th>
                      </tr>
                    </thead>
                    <tbody>
                      {getFilteredTimeEntries().map((entry) => {
                        const status = getEntryStatus(entry);
                        return (
                          <tr key={entry.id} style={{ borderBottom: '1px solid var(--gray-200)' }}>
                            <td style={{ padding: 'var(--space-4)', color: 'var(--gray-900)' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--blue-100)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                  <User className="w-4 h-4 text-blue-600" />
                                </div>
                                {getEmployeeName(entry.employeeId)}
                              </div>
                            </td>
                            <td style={{ padding: 'var(--space-4)', color: 'var(--gray-600)' }}>
                              {getDepartmentName(employees.find(emp => emp.id === entry.employeeId)?.departmentId || '')}
                            </td>
                            <td style={{ padding: 'var(--space-4)', color: 'var(--gray-600)' }}>{formatDate(entry.clockInTime)}</td>
                            <td style={{ padding: 'var(--space-4)', color: 'var(--gray-600)' }}>
                              {formatTime(entry.clockInTime)}
                              {entry.clockOutTime && ` - ${formatTime(entry.clockOutTime)}`}
                            </td>
                            <td style={{ padding: 'var(--space-4)', color: 'var(--gray-600)' }}>
                              {entry.totalHours ? entry.totalHours.toFixed(1) : '0.0'}t
                            </td>
                            <td style={{ padding: 'var(--space-4)' }}>
                              <div style={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: '0.5rem',
                                padding: '0.25rem 0.75rem',
                                borderRadius: 'var(--radius-full)',
                                background: 'var(--gray-100)',
                                width: 'fit-content'
                              }}>
                                {getStatusIcon(status)}
                                <span style={{ 
                                  fontSize: 'var(--font-size-sm)', 
                                  fontWeight: '500', 
                                  color: getStatusColor(status) 
                                }}>
                                  {status === 'active' ? 'Aktiv' : 
                                   status === 'completed' ? 'Fullført' : 
                                   status === 'overtime' ? 'Overtid' : 'Forsinket'}
                                </span>
                              </div>
                            </td>
                            <td style={{ padding: 'var(--space-4)' }}>
                              <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <button className="btn btn-sm btn-secondary">
                                  <Eye size={14} />
                                </button>
                                <button className="btn btn-sm btn-primary">
                                  <Edit size={14} />
                                </button>
                                {!entry.clockOutTime && (
                                  <button className="btn btn-sm btn-danger">
                                    <XCircle size={14} />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Departments Tab */}
          {activeTab === 'departments' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-6)' }}>
                <h2 style={{ fontSize: 'var(--font-size-xl)', fontWeight: '600', color: 'var(--gray-900)' }}>
                  Avdelinger ({getFilteredDepartments().length})
                </h2>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 'var(--space-4)' }}>
                {getFilteredDepartments().map((department) => (
                  <div key={department.id} className="card">
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', marginBottom: '1rem' }}>
                      <div className="card-icon">
                        <Building />
                      </div>
                      <div style={{ flex: '1' }}>
                        <h3 style={{ 
                          fontWeight: '600', 
                          color: '#333',
                          fontSize: '1.1rem',
                          marginBottom: '0.25rem'
                        }}>
                          {department.name}
                        </h3>
                        <p style={{ color: '#666', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                          {department.description}
                        </p>
                      </div>
                      <button className="btn btn-secondary" style={{ padding: '0.5rem' }}>
                        <MoreHorizontal style={{ width: '16px', height: '16px' }} />
                      </button>
                    </div>

                    <div style={{ marginBottom: '1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                        <Users style={{ width: '14px', height: '14px', color: '#666' }} />
                        <span style={{ fontSize: '0.875rem', color: '#666' }}>
                          {department.employeeCount || 0} ansatte
                        </span>
                      </div>
                      {department.managerId && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                          <User style={{ width: '14px', height: '14px', color: '#666' }} />
                          <span style={{ fontSize: '0.875rem', color: '#666' }}>
                            <strong>Leder:</strong> {getManagerName(department.managerId)}
                          </span>
                        </div>
                      )}
                      {department.location && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                          <MapPin style={{ width: '14px', height: '14px', color: '#666' }} />
                          <span style={{ fontSize: '0.875rem', color: '#666' }}>
                            {department.location}
                          </span>
                        </div>
                      )}
                      {department.budget && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <BarChart3 style={{ width: '14px', height: '14px', color: '#666' }} />
                          <span style={{ fontSize: '0.875rem', color: '#666' }}>
                            {department.budget.toLocaleString()} kr budsjett
                          </span>
                        </div>
                      )}
                    </div>

                    <div style={{ marginBottom: '1rem' }}>
                      <div style={{ fontSize: '0.75rem', color: '#666' }}>
                        Opprettet: {new Date(department.createdAt).toLocaleDateString('no-NO')}
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button className="btn btn-secondary" style={{ fontSize: '0.75rem', padding: '0.25rem 0.75rem' }}>
                        <Eye style={{ width: '14px', height: '14px' }} />
                        Se
                      </button>
                      <button className="btn btn-secondary" style={{ fontSize: '0.75rem', padding: '0.25rem 0.75rem' }}>
                        <Edit style={{ width: '14px', height: '14px' }} />
                        Rediger
                      </button>
                      <button className="btn btn-secondary" style={{ fontSize: '0.75rem', padding: '0.25rem 0.75rem' }}>
                        <Users style={{ width: '14px', height: '14px' }} />
                        Ansatte
                      </button>
                      <button className="btn btn-secondary" style={{ fontSize: '0.75rem', padding: '0.25rem 0.75rem' }}>
                        <Settings style={{ width: '14px', height: '14px' }} />
                        Innstillinger
                      </button>
                      <button className="btn btn-secondary" style={{ 
                        fontSize: '0.75rem', 
                        padding: '0.25rem 0.5rem',
                        color: '#ef4444',
                        borderColor: '#ef4444'
                      }}>
                        <Trash2 style={{ width: '14px', height: '14px' }} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}