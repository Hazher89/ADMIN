'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { firebaseService, Employee, Department, Shift, VacationAllocation, createUserAccessContext } from '@/lib/firebase-services';
import { notificationService } from '@/lib/notification-service';
import { AbsenceTab } from './absence-tab';
import VacationCalendar from './vacation-calendar';
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

// Interfaces - Using AbsenceType from firebase-services for consistency
import { Absence as AbsenceType } from '@/lib/firebase-services';

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
  const [absences, setAbsences] = useState<AbsenceType[]>([]);
  const [vacations, setVacations] = useState<Vacation[]>([]);
  
  // Search and filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedDepartmentFilter, setSelectedDepartmentFilter] = useState('all');
  
  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [showDeleteEmployeeConfirm, setShowDeleteEmployeeConfirm] = useState<string | null>(null);
  const [deletingEmployeeId, setDeletingEmployeeId] = useState<string | null>(null);
  
  // Department modal states
  const [showDepartmentViewModal, setShowDepartmentViewModal] = useState(false);
  const [showDepartmentEditModal, setShowDepartmentEditModal] = useState(false);
  const [showDepartmentSettingsModal, setShowDepartmentSettingsModal] = useState(false);
  const [showDepartmentEmployeesModal, setShowDepartmentEmployeesModal] = useState(false);
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [selectedDepartmentItem, setSelectedDepartmentItem] = useState<Department | null>(null);
  const [showDepartmentMenu, setShowDepartmentMenu] = useState<string | null>(null);
  
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
      internkontrollOgSamsvar: false, // Legacy
      internrevisjon: false,
      avvik: false,
      risikovurdering: false,
      oppfølgingstiltak: false,
      kontrollpunkter: false,
      internkontrollRapporter: false,
      // Sidebar sider
      chat: false,
      emailSystem: false,
      smsLogs: false,
      partners: false,
      // Logistikk System faner
      logistikkBudPriser: false,
      logistikkLevering: false,
      logistikkPlanlegging: false,
      logistikkKunder: false,
      logistikkLeverandorer: false,
      logistikkProdukter: false,
      logistikkLager: false,
      logistikkFakturering: false,
      logistikkFinans: false,
      // HR faner
      hrAnsatte: false,
      hrVakter: false,
      hrFravær: false,
      hrFerie: false,
      hrAvdelinger: false,
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

  const [editDepartment, setEditDepartment] = useState({
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
    if (userProfile) {
      loadAllData();
    }
  }, [userProfile]);

  const loadAllData = async () => {
    if (!userProfile) return;

    try {
      setLoading(true);
      const [
        employeesData,
        departmentsData,
        shiftsData,
        absencesData,
        vacationsData
      ] = await Promise.all([
        firebaseService.getEmployees(createUserAccessContext(userProfile) || undefined),
        firebaseService.getDepartments(),
        firebaseService.getShifts(),
        firebaseService.getAbsences(createUserAccessContext(userProfile) || undefined, undefined),
        firebaseService.getVacations(createUserAccessContext(userProfile) || undefined, undefined)
      ]);

      setEmployees(employeesData);
      setDepartments(departmentsData);
      setShifts(shiftsData);
      setAbsences(absencesData);
      setVacations(vacationsData);
    } catch (error) {
      console.error('Error loading HR data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Notification functions
  const sendAbsenceNotification = async (absence: AbsenceType) => {
    if (!userProfile) return;
    
    try {
      // Send notification to HR managers and admins
      const hrUsers = employees.filter(emp => 
        emp.role === 'admin' || emp.role === 'department_leader'
      );
      
      for (const hrUser of hrUsers) {
        await notificationService.createNotification({
          userId: hrUser.id,
          title: 'Ny fraværsmelding',
          message: `${absence.employeeName || 'Ukjent ansatt'} har meldt fravær: ${absence.type} fra ${new Date(absence.startDate).toLocaleDateString('nb-NO')} til ${new Date(absence.endDate).toLocaleDateString('nb-NO')}`,
          type: 'absence',
          priority: absence.type === 'sick' ? 'high' : 'medium',
          actionUrl: '/dashboard/hr?tab=absences',
          actionText: 'Se fraværsmelding',
          metadata: {
            absenceId: absence.id,
            employeeId: absence.employeeId,
            employeeName: absence.employeeName || 'Ukjent ansatt',
            type: absence.type,
            startDate: absence.startDate,
            endDate: absence.endDate
          }
        });
      }
    } catch (error) {
      console.error('Error sending absence notification:', error);
    }
  };

  const sendVacationNotification = async (vacation: Vacation) => {
    if (!userProfile) return;
    
    try {
      // Send notification to HR managers and admins
      const hrUsers = employees.filter(emp => 
        emp.role === 'admin' || emp.role === 'department_leader'
      );
      
      for (const hrUser of hrUsers) {
        await notificationService.createNotification({
          userId: hrUser.id,
          title: 'Ny ferieansøkning',
          message: `${vacation.employeeName} har søkt om ferie: ${vacation.days} dager fra ${new Date(vacation.startDate).toLocaleDateString('nb-NO')} til ${new Date(vacation.endDate).toLocaleDateString('nb-NO')}`,
          type: 'vacation',
          priority: 'medium',
          actionUrl: '/dashboard/hr?tab=vacations',
          actionText: 'Se ferieansøkning',
          metadata: {
            vacationId: vacation.id,
            employeeId: vacation.employeeId,
            employeeName: vacation.employeeName,
            days: vacation.days,
            startDate: vacation.startDate,
            endDate: vacation.endDate
          }
        });
      }
    } catch (error) {
      console.error('Error sending vacation notification:', error);
    }
  };

  const sendDeviationNotification = async (deviation: any) => {
    if (!userProfile) return;
    
    try {
      // Send notification to HR managers and admins
      const hrUsers = employees.filter(emp => 
        emp.role === 'admin' || emp.role === 'department_leader'
      );
      
      for (const hrUser of hrUsers) {
        await notificationService.createNotification({
          userId: hrUser.id,
          title: 'Ny avviksmelding',
          message: `Avvik registrert: ${deviation.type} - ${deviation.description}`,
          type: 'deviation',
          priority: deviation.severity === 'high' ? 'urgent' : 'medium',
          actionUrl: '/dashboard/hr?tab=deviations',
          actionText: 'Se avvik',
          metadata: {
            deviationId: deviation.id,
            type: deviation.type,
            severity: deviation.severity,
            description: deviation.description
          }
        });
      }
    } catch (error) {
      console.error('Error sending deviation notification:', error);
    }
  };

  // Filter functions
  const getFilteredEmployees = () => {
    return employees.filter(employee => {
      const matchesSearch = employee.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           employee.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           employee.position?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesDepartment = selectedDepartmentFilter === 'all' || employee.departmentId === selectedDepartmentFilter;
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


  const getFilteredDepartments = () => {
    return departments.filter(department => {
      const matchesSearch = department.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (department.description?.toLowerCase().includes(searchTerm.toLowerCase()) || false);
      return matchesSearch;
    });
  };

  const getFilteredAbsences = () => {
    return absences.filter(absence => {
      const matchesSearch = (absence.employeeName || '').toLowerCase().includes(searchTerm.toLowerCase());
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
      case 'active': return <Play style={{ width: '16px', height: '16px', color: 'var(--success)' }} />;
      case 'completed': return <CheckCircle style={{ width: '16px', height: '16px', color: 'var(--secondary)' }} />;
      case 'overtime': return <AlertTriangle style={{ width: '16px', height: '16px', color: 'var(--warning)' }} />;
      case 'late': return <AlertTriangle style={{ width: '16px', height: '16px', color: 'var(--danger)' }} />;
      case 'scheduled': return <Clock style={{ width: '16px', height: '16px', color: 'var(--secondary)' }} />;
      case 'in-progress': return <Play style={{ width: '16px', height: '16px', color: 'var(--warning)' }} />;
      case 'approved': return <CheckCircle style={{ width: '16px', height: '16px', color: 'var(--success)' }} />;
      case 'rejected': return <XCircle style={{ width: '16px', height: '16px', color: 'var(--danger)' }} />;
      case 'pending': return <Clock style={{ width: '16px', height: '16px', color: 'var(--warning)' }} />;
      default: return <AlertTriangle style={{ width: '16px', height: '16px', color: 'var(--gray-500)' }} />;
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

  // Employee handlers
  const handleViewEmployee = (employee: Employee) => {
    setSelectedEmployee(employee);
    setShowViewModal(true);
  };

  const handleEditEmployee = (employee: Employee) => {
    setSelectedEmployee(employee);
    setShowEditModal(true);
  };

  const handleDeleteEmployee = async (employeeId: string) => {
    if (!employeeId) {
      alert('Ingen ansatt-ID funnet');
      return;
    }
    setShowDeleteEmployeeConfirm(employeeId);
  };

  const confirmDeleteEmployee = async () => {
    if (!showDeleteEmployeeConfirm) return;

    const employeeId = showDeleteEmployeeConfirm;
    setDeletingEmployeeId(employeeId);
    setShowDeleteEmployeeConfirm(null);

    try {
      console.log('Attempting to delete employee with ID:', employeeId);
      const userContext = createUserAccessContext(userProfile);
      await firebaseService.deleteEmployee(employeeId, userContext || undefined);
      console.log('Employee deleted successfully, reloading list...');
      
      // Reload data after a short delay to ensure Firebase has updated
      setTimeout(() => {
        loadAllData();
        setDeletingEmployeeId(null);
      }, 500);
      
      alert('✅ Ansatt ble slettet!');
    } catch (error) {
      console.error('Error deleting employee:', error);
      const errorMessage = error instanceof Error ? error.message : 'Ukjent feil';
      alert(`❌ Feil ved sletting av ansatt: ${errorMessage}`);
      setDeletingEmployeeId(null);
    }
  };

  const handleUpdateEmployee = async () => {
    if (!selectedEmployee) return;

    if (!userProfile) {
      alert('Ingen bedrift funnet. Vennligst logg inn på nytt.');
      return;
    }

    // Validate required fields
    if (!selectedEmployee.displayName?.trim()) {
      alert('Navn er påkrevd');
      return;
    }

    if (!selectedEmployee.email?.trim()) {
      alert('E-post er påkrevd');
      return;
    }

    try {
      // Prepare update data - only include fields that have values
      const updateData: any = {
        displayName: selectedEmployee.displayName.trim(),
        email: selectedEmployee.email.trim(),
        role: selectedEmployee.role,
        status: selectedEmployee.status,
      };
      
      if (selectedEmployee.phone?.trim()) updateData.phone = selectedEmployee.phone.trim();
      if (selectedEmployee.position?.trim()) updateData.position = selectedEmployee.position.trim();
      if (selectedEmployee.departmentId?.trim()) updateData.departmentId = selectedEmployee.departmentId.trim();
      if ((selectedEmployee as any).birthDate) updateData.birthDate = (selectedEmployee as any).birthDate;
      if ((selectedEmployee as any).employeeNumber?.trim()) updateData.employeeNumber = (selectedEmployee as any).employeeNumber.trim();
      if ((selectedEmployee as any).taxId?.trim()) updateData.taxId = (selectedEmployee as any).taxId.trim();
      if ((selectedEmployee as any).address?.trim()) updateData.address = (selectedEmployee as any).address.trim();
      if ((selectedEmployee as any).emergencyContact?.trim()) updateData.emergencyContact = (selectedEmployee as any).emergencyContact.trim();
      if ((selectedEmployee as any).bio?.trim()) updateData.bio = (selectedEmployee as any).bio.trim();
      if ((selectedEmployee as any).education?.trim()) updateData.education = (selectedEmployee as any).education.trim();
      if ((selectedEmployee as any).workExperience?.trim()) updateData.workExperience = (selectedEmployee as any).workExperience.trim();
      if ((selectedEmployee as any).salary) updateData.salary = Number((selectedEmployee as any).salary);
      if ((selectedEmployee as any).managerId?.trim()) updateData.managerId = (selectedEmployee as any).managerId.trim();
      if ((selectedEmployee as any).bankAccount?.trim()) updateData.bankAccount = (selectedEmployee as any).bankAccount.trim();
      if ((selectedEmployee as any).insuranceNumber?.trim()) updateData.insuranceNumber = (selectedEmployee as any).insuranceNumber.trim();
      
      // Include permissions, vacationAccess, and leadership if they exist
      if ((selectedEmployee as any).permissions) updateData.permissions = (selectedEmployee as any).permissions;
      if ((selectedEmployee as any).vacationAccess) updateData.vacationAccess = (selectedEmployee as any).vacationAccess;
      if ((selectedEmployee as any).leadership) updateData.leadership = (selectedEmployee as any).leadership;

      const userContext = createUserAccessContext(userProfile);
      await firebaseService.updateEmployee(selectedEmployee.id, updateData, userContext || undefined);
      
      setShowEditModal(false);
      setSelectedEmployee(null);
      
      // Reload data
      setTimeout(() => {
        loadAllData();
      }, 500);
      
      alert('✅ Ansatt ble oppdatert!');
    } catch (error) {
      console.error('Error updating employee:', error);
      alert(`Feil ved å oppdatere ansatt: ${error instanceof Error ? error.message : 'Ukjent feil'}`);
    }
  };

  // Department handlers
  // Handler functions for adding employees and departments
  const handleAddEmployee = async () => {

    // Validate required fields
    if (!newEmployee.displayName.trim()) {
      alert('Navn er påkrevd');
      return;
    }

    if (!newEmployee.email.trim()) {
      alert('E-post er påkrevd');
      return;
    }

    try {
      const employeeData: any = {
        displayName: newEmployee.displayName.trim(),
        email: newEmployee.email.trim(),
        role: newEmployee.role as 'admin' | 'department_leader' | 'employee',
        status: newEmployee.status as 'active' | 'inactive' | 'on_leave',
        hireDate: newEmployee.hireDate || new Date().toISOString(),
      };
      
      // Add optional fields only if they have values
      if (newEmployee.phone?.trim()) employeeData.phone = newEmployee.phone.trim();
      if (newEmployee.birthDate) employeeData.birthDate = newEmployee.birthDate;
      if (newEmployee.employeeNumber?.trim()) employeeData.employeeNumber = newEmployee.employeeNumber.trim();
      if (newEmployee.taxId?.trim()) employeeData.taxId = newEmployee.taxId.trim();
      if (newEmployee.address?.trim()) employeeData.address = newEmployee.address.trim();
      if (newEmployee.emergencyContact?.trim()) employeeData.emergencyContact = newEmployee.emergencyContact.trim();
      if (newEmployee.bio?.trim()) employeeData.bio = newEmployee.bio.trim();
      if (newEmployee.education?.trim()) employeeData.education = newEmployee.education.trim();
      if (newEmployee.workExperience?.trim()) employeeData.workExperience = newEmployee.workExperience.trim();
      if (newEmployee.skills && newEmployee.skills.length > 0) employeeData.skills = newEmployee.skills;
      if (newEmployee.certifications && newEmployee.certifications.length > 0) employeeData.certifications = newEmployee.certifications;
      if (newEmployee.salary) employeeData.salary = Number(newEmployee.salary);
      if (newEmployee.managerId?.trim()) employeeData.managerId = newEmployee.managerId.trim();
      if (newEmployee.bankAccount?.trim()) employeeData.bankAccount = newEmployee.bankAccount.trim();
      if (newEmployee.insuranceNumber?.trim()) employeeData.insuranceNumber = newEmployee.insuranceNumber.trim();
      if (newEmployee.avatar?.trim()) employeeData.avatar = newEmployee.avatar.trim();
      if (newEmployee.departmentId?.trim()) employeeData.departmentId = newEmployee.departmentId.trim();
      if (newEmployee.position?.trim()) employeeData.position = newEmployee.position.trim();
      
      // Set default permissions based on role
      const defaultPermissions: any = {
        dashboard: true,
        notifications: true,
        calendar: true,
        internkontrollOgSamsvar: true, // Legacy - kept for backward compatibility
        // Internkontroll og Samsvar faner - alle ansatte får tilgang til alle faner som standard
        internrevisjon: true,
        avvik: true,
        risikovurdering: true,
        oppfølgingstiltak: true,
        kontrollpunkter: true,
        internkontrollRapporter: true,
        // All other permissions default to false
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
      };

      // Set default vacation access based on role
      const defaultVacationAccess: any = {
        canRequestVacation: true, // All employees can request vacation
        canApproveVacation: false,
        canViewAllVacations: false,
        vacationDaysPerYear: 25,
        managerApprovalRequired: true,
      };

      // Department leaders get additional permissions
      if (newEmployee.role === 'department_leader') {
        defaultVacationAccess.canApproveVacation = true;
        defaultVacationAccess.canViewAllVacations = true;
      }

      employeeData.permissions = defaultPermissions;
      employeeData.vacationAccess = defaultVacationAccess;
      employeeData.leadership = newEmployee.leadership || {};

      const userContext = createUserAccessContext(userProfile);
      const employeeId = await firebaseService.createEmployee(employeeData, userContext || undefined);

      console.log('✅ Employee created successfully with ID:', employeeId);

      // Send welcome email to the new employee (optional - don't fail if this fails)
      try {
        const departmentName = departments.find(d => d.id === newEmployee.departmentId)?.name || '';
        const adminName = userProfile?.displayName || 'System Administrator';
        const companyName = userProfile?.companyName || 'Mavi Logistikk';

        console.log('📧 Attempting to send welcome email to:', newEmployee.email);
        
        const response = await fetch('/api/send-welcome-email', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: newEmployee.email,
            displayName: newEmployee.displayName,
            adminName,
            companyName,
            departmentName,
            position: newEmployee.position || 'Ansatt'
          })
        });

        if (response.ok) {
          const result = await response.json();
          if (result.success) {
            console.log('✅ Welcome email sent successfully to:', newEmployee.email);
          } else {
            console.warn('⚠️ Welcome email API returned success=false:', result);
          }
        } else {
          console.warn('⚠️ Failed to send welcome email (non-critical):', response.status);
        }
      } catch (emailError) {
        // Don't fail employee creation if email fails - it's non-critical
        console.warn('⚠️ Failed to send welcome email (non-critical):', emailError);
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
          managesDepartments: [],
          managesEmployees: [],
          reportsTo: '',
          canApproveExpenses: false,
          canApprovePurchases: false,
          budgetLimit: 0,
        },
      });
      
      // Reload data
      setTimeout(() => {
        loadAllData();
      }, 1000);
      
      alert('✅ Ansatt ble lagt til!');
    } catch (error) {
      console.error('Error adding employee:', error);
      alert(`Feil ved å legge til ansatt: ${error instanceof Error ? error.message : 'Ukjent feil'}`);
    }
  };

  const handleAddDepartment = async () => {
    if (!userProfile) {
      alert('Ingen bedrift funnet. Vennligst logg inn på nytt.');
      return;
    }

    if (!newDepartment.name.trim()) {
      alert('Avdelingsnavn er påkrevd');
      return;
    }

    try {
      const userContext = createUserAccessContext(userProfile);
      
      // Build department data, only including fields that have values
      const departmentData: any = {
        name: newDepartment.name.trim(),
              };
      
      if (newDepartment.description?.trim()) {
        departmentData.description = newDepartment.description.trim();
      }
      
      if (newDepartment.location?.trim()) {
        departmentData.location = newDepartment.location.trim();
      }
      
      if (newDepartment.budget && newDepartment.budget > 0) {
        departmentData.budget = newDepartment.budget;
      }
      
      if (newDepartment.managerId?.trim()) {
        departmentData.managerId = newDepartment.managerId.trim();
      }
      
      await firebaseService.createDepartment(departmentData, userContext || undefined);

      setShowAddModal(false);
      setNewDepartment({
        name: '',
        description: '',
        location: '',
        budget: 0,
        managerId: ''
      });
      
      // Reload data
      setTimeout(() => {
        loadAllData();
      }, 1000);
      
      alert('✅ Avdeling ble opprettet!');
    } catch (error) {
      console.error('Error adding department:', error);
      alert(`Feil ved å opprette avdeling: ${error instanceof Error ? error.message : 'Ukjent feil'}`);
    }
  };

  const handleViewDepartment = (department: Department) => {
    setSelectedDepartmentItem(department);
    setShowDepartmentViewModal(true);
  };

  const handleEditDepartment = (department: Department) => {
    setSelectedDepartmentItem(department);
    setEditDepartment({
      name: department.name,
      description: department.description || '',
      location: department.location || '',
      budget: department.budget || 0,
      managerId: department.managerId || ''
    });
    setShowDepartmentEditModal(true);
    setShowDepartmentMenu(null);
  };

  const handleDeleteDepartment = async (department: Department) => {
    if (!userProfile) return;
    
    // Check if department has employees
    const deptEmployees = employees.filter(emp => emp.departmentId === department.id);
    if (deptEmployees.length > 0) {
      alert(`Kan ikke slette avdeling med ${deptEmployees.length} ansatte. Flytt ansatte først.`);
      setShowDeleteConfirmModal(false);
      setShowDepartmentMenu(null);
      return;
    }

    try {
      await firebaseService.deleteDepartment(department.id);
      await loadAllData();
      setShowDeleteConfirmModal(false);
      setSelectedDepartmentItem(null);
      setShowDepartmentMenu(null);
      alert('Avdeling slettet');
    } catch (error) {
      console.error('Error deleting department:', error);
      alert('Feil ved sletting av avdeling');
    }
  };

  const handleUpdateDepartment = async () => {
    if (!selectedDepartmentItem || !userProfile) return;
    if (!editDepartment.name.trim()) {
      alert('Avdelingsnavn er påkrevd');
      return;
    }

    try {
      await firebaseService.updateDepartment(selectedDepartmentItem.id, {
        ...editDepartment,
              });
      await loadAllData();
      setShowDepartmentEditModal(false);
      setSelectedDepartmentItem(null);
      alert('Avdeling oppdatert');
    } catch (error) {
      console.error('Error updating department:', error);
      alert('Feil ved oppdatering av avdeling');
    }
  };

  const handleViewDepartmentEmployees = (department: Department) => {
    setSelectedDepartmentItem(department);
    setShowDepartmentEmployeesModal(true);
    setShowDepartmentMenu(null);
  };

  const handleDepartmentSettings = (department: Department) => {
    setSelectedDepartmentItem(department);
    setShowDepartmentSettingsModal(true);
    setShowDepartmentMenu(null);
  };

  // Statistics
  const getStats = () => {
    const activeEmployees = employees.filter(emp => emp.status === 'active').length;
    const activeShifts = shifts.filter(s => s.status === 'in_progress').length;
    const pendingAbsences = absences.filter(a => a.status === 'pending').length;
    const pendingVacations = vacations.filter(v => v.status === 'pending').length;
    const totalDepartments = departments.length;

    return {
      totalEmployees: employees.length,
      activeEmployees,
      activeShifts,
      pendingAbsences,
      pendingVacations,
      totalDepartments,
      activeTimeEntries: 0 // Placeholder - implement if time entries are tracked
    };
  };
  
  // Get filtered time entries (placeholder implementation)
  const getFilteredTimeEntries = () => {
    // Return empty array if time entries are not implemented
    return [];
  };
  
  // Get entry status (placeholder implementation)
  const getEntryStatus = (entry: any) => {
    return 'active';
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
    <div style={{ 
      background: 'var(--background-color)', 
      minHeight: '100vh', 
      padding: isMobile ? '0' : 'var(--space-6)',
      width: '100%',
      overflowX: 'hidden'
    }}>
      {/* Mobile Header */}
      {isMobile && (
        <div style={{ 
          padding: '0.625rem 0.75rem 0.5rem', 
          marginBottom: '0.5rem',
          borderBottom: '0.5px solid var(--border-color)',
          background: 'var(--card-background)'
        }}>
          <h1 style={{ 
            fontSize: '1.125rem', 
            fontWeight: 600, 
            color: 'var(--text-color)',
            margin: 0,
            lineHeight: '1.3',
            letterSpacing: '-0.01em'
          }}>
            HR & Personal
          </h1>
        </div>
      )}

      {/* Desktop Header */}
      {!isMobile && (
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
      )}

      {/* Quick Stats */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(250px, 1fr))', 
        gap: isMobile ? '0.625rem' : 'var(--space-4)', 
        marginBottom: isMobile ? '0.75rem' : 'var(--space-6)',
        padding: isMobile ? '0 0.75rem' : '0'
      }}>
        <div style={{
          borderRadius: isMobile ? '0.875rem' : undefined,
          padding: isMobile ? '1rem' : undefined,
          boxShadow: isMobile ? '0 1px 3px rgba(0, 0, 0, 0.1)' : undefined,
          background: isMobile ? 'var(--card-background)' : undefined,
          border: isMobile ? '1px solid var(--border-color)' : undefined
        }} className={!isMobile ? "card" : ""}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ flex: 1 }}>
              <p style={{ 
                color: 'var(--gray-500)', 
                fontSize: isMobile ? '0.75rem' : 'var(--font-size-sm)', 
                marginBottom: isMobile ? '0.375rem' : '0.5rem',
                fontWeight: 500
              }}>Totalt Ansatte</p>
              <p style={{ 
                fontSize: isMobile ? '1.625rem' : 'var(--font-size-2xl)', 
                fontWeight: '700', 
                color: 'var(--blue-600)',
                lineHeight: '1.2',
                margin: 0
              }}>{stats.totalEmployees}</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: isMobile ? '0.5rem' : '0.5rem' }}>
                <TrendingUp className={isMobile ? "w-3 h-3" : "w-4 h-4"} style={{ color: '#10b981' }} />
                <span style={{ 
                  color: '#10b981', 
                  fontSize: isMobile ? '0.6875rem' : 'var(--font-size-sm)',
                  fontWeight: 500
                }}>{stats.activeEmployees} aktive</span>
              </div>
            </div>
            <div style={{
              padding: isMobile ? '0.75rem' : undefined,
              background: isMobile ? 'rgba(59, 130, 246, 0.1)' : 'var(--blue-100)',
              borderRadius: isMobile ? '0.625rem' : undefined,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }} className={!isMobile ? "card-icon" : ""}>
              <Users className={isMobile ? "w-5 h-5" : "w-6 h-6"} style={{ color: '#3b82f6' }} />
            </div>
          </div>
        </div>

        <div style={{
          borderRadius: isMobile ? '0.875rem' : undefined,
          padding: isMobile ? '1rem' : undefined,
          boxShadow: isMobile ? '0 1px 3px rgba(0, 0, 0, 0.1)' : undefined,
          background: isMobile ? 'var(--card-background)' : undefined,
          border: isMobile ? '1px solid var(--border-color)' : undefined
        }} className={!isMobile ? "card" : ""}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ flex: 1 }}>
              <p style={{ 
                color: 'var(--gray-500)', 
                fontSize: isMobile ? '0.75rem' : 'var(--font-size-sm)', 
                marginBottom: isMobile ? '0.375rem' : '0.5rem',
                fontWeight: 500
              }}>Aktive Vakter</p>
              <p style={{ 
                fontSize: isMobile ? '1.625rem' : 'var(--font-size-2xl)', 
                fontWeight: '700', 
                color: '#22c55e',
                lineHeight: '1.2',
                margin: 0
              }}>{stats.activeShifts}</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: isMobile ? '0.5rem' : '0.5rem' }}>
                <Clock className={isMobile ? "w-3 h-3" : "w-4 h-4"} style={{ color: '#22c55e' }} />
                <span style={{ 
                  color: '#22c55e', 
                  fontSize: isMobile ? '0.6875rem' : 'var(--font-size-sm)',
                  fontWeight: 500
                }}>Pågående</span>
              </div>
            </div>
            <div style={{
              padding: isMobile ? '0.75rem' : undefined,
              background: isMobile ? 'rgba(34, 197, 94, 0.1)' : 'var(--green-100)',
              borderRadius: isMobile ? '0.625rem' : undefined,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }} className={!isMobile ? "card-icon" : ""}>
              <Clock className={isMobile ? "w-5 h-5" : "w-6 h-6"} style={{ color: '#22c55e' }} />
            </div>
          </div>
        </div>

        <div style={{
          borderRadius: isMobile ? '0.875rem' : undefined,
          padding: isMobile ? '1rem' : undefined,
          boxShadow: isMobile ? '0 1px 3px rgba(0, 0, 0, 0.1)' : undefined,
          background: isMobile ? 'var(--card-background)' : undefined,
          border: isMobile ? '1px solid var(--border-color)' : undefined
        }} className={!isMobile ? "card" : ""}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ flex: 1 }}>
              <p style={{ 
                color: 'var(--gray-500)', 
                fontSize: isMobile ? '0.75rem' : 'var(--font-size-sm)', 
                marginBottom: isMobile ? '0.375rem' : '0.5rem',
                fontWeight: 500
              }}>Aktive Stemplinger</p>
              <p style={{ 
                fontSize: isMobile ? '1.625rem' : 'var(--font-size-2xl)', 
                fontWeight: '700', 
                color: '#a855f7',
                lineHeight: '1.2',
                margin: 0
              }}>{stats.activeTimeEntries}</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: isMobile ? '0.5rem' : '0.5rem' }}>
                <Clock className={isMobile ? "w-3 h-3" : "w-4 h-4"} style={{ color: '#a855f7' }} />
                <span style={{ 
                  color: '#a855f7', 
                  fontSize: isMobile ? '0.6875rem' : 'var(--font-size-sm)',
                  fontWeight: 500
                }}>Innstemplte</span>
              </div>
            </div>
            <div style={{
              padding: isMobile ? '0.75rem' : undefined,
              background: isMobile ? 'rgba(168, 85, 247, 0.1)' : 'var(--purple-100)',
              borderRadius: isMobile ? '0.625rem' : undefined,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }} className={!isMobile ? "card-icon" : ""}>
              <Clock className={isMobile ? "w-5 h-5" : "w-6 h-6"} style={{ color: '#a855f7' }} />
            </div>
          </div>
        </div>

        <div style={{
          borderRadius: isMobile ? '0.875rem' : undefined,
          padding: isMobile ? '1rem' : undefined,
          boxShadow: isMobile ? '0 1px 3px rgba(0, 0, 0, 0.1)' : undefined,
          background: isMobile ? 'var(--card-background)' : undefined,
          border: isMobile ? '1px solid var(--border-color)' : undefined
        }} className={!isMobile ? "card" : ""}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ flex: 1 }}>
              <p style={{ 
                color: 'var(--gray-500)', 
                fontSize: isMobile ? '0.75rem' : 'var(--font-size-sm)', 
                marginBottom: isMobile ? '0.375rem' : '0.5rem',
                fontWeight: 500
              }}>Ventende Forespørsler</p>
              <p style={{ 
                fontSize: isMobile ? '1.625rem' : 'var(--font-size-2xl)', 
                fontWeight: '700', 
                color: '#f59e0b',
                lineHeight: '1.2',
                margin: 0
              }}>{stats.pendingAbsences + stats.pendingVacations}</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: isMobile ? '0.5rem' : '0.5rem' }}>
                <AlertTriangle className={isMobile ? "w-3 h-3" : "w-4 h-4"} style={{ color: '#f59e0b' }} />
                <span style={{ 
                  color: '#f59e0b', 
                  fontSize: isMobile ? '0.6875rem' : 'var(--font-size-sm)',
                  fontWeight: 500
                }}>Krever handling</span>
              </div>
            </div>
            <div style={{
              padding: isMobile ? '0.75rem' : undefined,
              background: isMobile ? 'rgba(245, 158, 11, 0.1)' : 'var(--orange-100)',
              borderRadius: isMobile ? '0.625rem' : undefined,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }} className={!isMobile ? "card-icon" : ""}>
              <Calendar className={isMobile ? "w-5 h-5" : "w-6 h-6"} style={{ color: '#f59e0b' }} />
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{
        borderRadius: isMobile ? '0.875rem' : undefined,
        padding: isMobile ? '0' : undefined,
        boxShadow: isMobile ? '0 1px 3px rgba(0, 0, 0, 0.1)' : undefined,
        background: isMobile ? 'var(--card-background)' : undefined,
        border: isMobile ? '1px solid var(--border-color)' : undefined,
        marginBottom: isMobile ? '0.75rem' : '2rem',
        margin: isMobile ? '0 0.75rem 0.75rem' : undefined
      }} className={!isMobile ? "card" : ""}>
        <div style={{ 
          display: 'flex', 
          borderBottom: '1px solid var(--border-color)', 
          overflowX: 'auto',
          WebkitOverflowScrolling: 'touch',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none'
        }}>
          {[
            { id: 'employees', name: 'Ansatte', icon: Users },
            { id: 'shifts', name: 'Vakter', icon: Calendar },
            { id: 'absence', name: 'Fravær', icon: Heart },
            { id: 'vacations', name: 'Ferie', icon: CalendarDays },
            { id: 'departments', name: 'Avdelinger', icon: Building },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`btn ${activeTab === tab.id ? 'btn-primary' : 'btn-secondary'}`}
              style={{ 
                borderRadius: 0, 
                borderBottom: activeTab === tab.id ? '2px solid var(--primary)' : '2px solid transparent',
                whiteSpace: 'nowrap',
                minWidth: isMobile ? '100px' : '150px',
                padding: isMobile ? '0.75rem 0.5rem' : undefined,
                fontSize: isMobile ? '0.875rem' : undefined,
                flexShrink: 0
              }}
            >
              <tab.icon size={isMobile ? 18 : 16} />
              {tab.name}
            </button>
          ))}
        </div>

        {/* Search and Filters - Hidden for vacations and absence tabs */}
        {activeTab !== 'vacations' && activeTab !== 'absence' && (
        <div style={{ 
          padding: isMobile ? '0.75rem' : 'var(--space-4)', 
          borderBottom: '1px solid var(--border-color)' 
        }}>
          <div style={{ 
            display: 'flex', 
            gap: isMobile ? '0.5rem' : 'var(--space-3)', 
            flexWrap: 'wrap', 
            alignItems: 'center',
            flexDirection: isMobile ? 'column' : 'row'
          }}>
            <div style={{ 
              flex: isMobile ? 'none' : '1', 
              width: isMobile ? '100%' : undefined,
              minWidth: isMobile ? '100%' : '200px' 
            }}>
              <div style={{ position: 'relative' }}>
                <Search style={{ 
                  position: 'absolute', 
                  left: isMobile ? '0.875rem' : '12px', 
                  top: '50%', 
                  transform: 'translateY(-50%)', 
                  color: 'var(--gray-400)', 
                  width: isMobile ? '18px' : '16px', 
                  height: isMobile ? '18px' : '16px' 
                }} />
                <input
                  type="text"
                  placeholder={`Søk i ${activeTab}...`}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{ 
                    width: '100%', 
                    padding: isMobile ? '0.875rem 0.875rem 0.875rem 2.75rem' : '0.75rem 0.75rem 0.75rem 2.5rem', 
                    border: '1px solid var(--border-color)', 
                    borderRadius: isMobile ? '0.5rem' : 'var(--radius-lg)', 
                    outline: 'none',
                    fontSize: isMobile ? '16px' : undefined,
                    background: 'var(--card-background)'
                  }}
                />
              </div>
            </div>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              style={{ 
                width: isMobile ? '100%' : undefined,
                padding: isMobile ? '0.875rem' : '0.75rem', 
                border: '1px solid var(--border-color)', 
                borderRadius: isMobile ? '0.5rem' : 'var(--radius-lg)', 
                outline: 'none',
                minWidth: isMobile ? '100%' : '150px',
                fontSize: isMobile ? '16px' : undefined,
                background: 'var(--card-background)'
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
              {(activeTab === 'absence' || activeTab === 'vacation') && (
                <>
                  <option value="pending">Venter</option>
                  <option value="approved">Godkjent</option>
                  <option value="rejected">Avvist</option>
                </>
              )}
            </select>
            {(activeTab === 'employees') && (
              <select
                  value={selectedDepartmentFilter}
                  onChange={(e) => setSelectedDepartmentFilter(e.target.value)}
                style={{ 
                  width: isMobile ? '100%' : undefined,
                  padding: isMobile ? '0.875rem' : '0.75rem', 
                  border: '1px solid var(--border-color)', 
                  borderRadius: isMobile ? '0.5rem' : 'var(--radius-lg)', 
                  outline: 'none',
                  minWidth: isMobile ? '100%' : '150px',
                  fontSize: isMobile ? '16px' : undefined,
                  background: 'var(--card-background)'
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
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.5rem',
                width: isMobile ? '100%' : undefined,
                justifyContent: isMobile ? 'center' : undefined,
                padding: isMobile ? '0.75rem 1rem' : undefined,
                fontSize: isMobile ? '0.9375rem' : undefined
              }}
            >
              <Plus size={isMobile ? 18 : 16} />
              Legg til {activeTab === 'employees' ? 'ansatt' : 
                       activeTab === 'shifts' ? 'vakt' : 
                       activeTab === 'absence-vacation' ? 'registrering' : 
                       'avdeling'}
            </button>
          </div>
        </div>
        )}

        {/* Tab Content */}
        <div style={{ padding: isMobile ? '0.75rem' : 'var(--space-6)' }}>
          {/* Employees Tab */}
          {activeTab === 'employees' && (
            <div>
              {!isMobile && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-6)' }}>
                <h2 style={{ fontSize: 'var(--font-size-xl)', fontWeight: '600', color: 'var(--gray-900)' }}>
                  Ansatte ({getFilteredEmployees().length})
                </h2>
              </div>
              )}
              {isMobile ? (
                /* Mobile List View */
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                  {getFilteredEmployees().map((employee) => (
                    <div
                      key={employee.id}
                      style={{
                        borderRadius: '0.875rem',
                        padding: '1rem',
                        background: 'var(--card-background)',
                        border: '1px solid var(--border-color)',
                        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
                      }}
                      onClick={() => handleViewEmployee(employee)}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                        <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(59, 130, 246, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <User size={20} style={{ color: '#3b82f6' }} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <h3 style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--text-color)', margin: '0 0 0.25rem 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {employee.displayName}
                          </h3>
                          <p style={{ fontSize: '0.8125rem', color: 'var(--gray-500)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {employee.position}
                          </p>
                        </div>
                        <span style={{
                          padding: '0.25rem 0.625rem',
                          borderRadius: '0.5rem',
                          fontSize: '0.75rem',
                          fontWeight: 500,
                          background: employee.status === 'active' ? 'rgba(34, 197, 94, 0.1)' : 
                                     employee.status === 'inactive' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                          color: employee.status === 'active' ? '#22c55e' : 
                                 employee.status === 'inactive' ? '#ef4444' : '#f59e0b',
                          flexShrink: 0
                        }}>
                          {employee.status === 'active' ? 'Aktiv' : 
                           employee.status === 'inactive' ? 'Inaktiv' : 'På permisjon'}
                        </span>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-color)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8125rem', color: 'var(--gray-600)' }}>
                          <Building size={14} />
                          <span>{getDepartmentName(employee.departmentId || '')}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8125rem', color: 'var(--gray-600)' }}>
                          <Mail size={14} />
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{employee.email}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                /* Desktop Table View */
              <div className="card" style={{ padding: 0 }}>
                  <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
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
                              <button 
                                className="btn btn-sm btn-secondary"
                                onClick={() => handleViewEmployee(employee)}
                                title="Se ansatt"
                              >
                                <Eye size={14} />
                              </button>
                              <button 
                                className="btn btn-sm btn-primary"
                                onClick={() => handleEditEmployee(employee)}
                                title="Rediger ansatt"
                              >
                                <Edit size={14} />
                              </button>
                              <button 
                                className="btn btn-sm btn-danger"
                                onClick={() => handleDeleteEmployee(employee.id)}
                                disabled={deletingEmployeeId === employee.id}
                                title="Slett ansatt"
                                style={{ opacity: deletingEmployeeId === employee.id ? 0.5 : 1 }}
                              >
                                {deletingEmployeeId === employee.id ? (
                                  <Loader2 size={14} className="animate-spin" />
                                ) : (
                                <Trash2 size={14} />
                                )}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              )}
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

          {/* Absence Tab */}
          {activeTab === 'absence' && (
            <AbsenceTab
              employees={employees}
              absences={absences}
              setAbsences={setAbsences}
              userProfile={userProfile}
              firebaseService={firebaseService}
              vacations={vacations}
              onAbsenceChange={async () => {
                // Reload absences from Firebase
                if (userProfile) {
                  try {
                    const absencesData = await firebaseService.getAbsences(createUserAccessContext(userProfile) || undefined);
                    setAbsences(absencesData);
                  } catch (error) {
                    console.error('Error reloading absences:', error);
                  }
                }
              }}
            />
          )}

          {/* Old absence-vacation tab (keeping for backward compatibility) */}
          {activeTab === 'absence-vacation' && (
            <div>
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
                            <td style={{ padding: 'var(--space-4)', color: 'var(--gray-900)' }}>{absence.employeeName || 'Ukjent ansatt'}</td>
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
            </div>
          )}

          {/* Vacation Calendar Tab */}
          {activeTab === 'vacations' && (
            <VacationCalendar employees={employees} absences={absences} />
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
                  <div key={department.id} className="card" style={{ 
                    padding: '1.5rem',
                    borderRadius: '12px',
                    background: 'var(--card-background)',
                    border: '1px solid var(--border-color)',
                    boxShadow: 'var(--shadow-sm)',
                    display: 'flex',
                    flexDirection: 'column',
                    height: '100%'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', marginBottom: '1rem' }}>
                      <div className="card-icon" style={{ flexShrink: 0 }}>
                        <Building />
                      </div>
                      <div style={{ flex: '1', minWidth: 0 }}>
                        <h3 style={{ 
                          fontWeight: '600', 
                          color: 'var(--text-color)',
                          fontSize: '1.1rem',
                          marginBottom: '0.25rem',
                          wordBreak: 'break-word'
                        }}>
                          {department.name}
                        </h3>
                        <p style={{ 
                          color: 'var(--gray-600)', 
                          fontSize: '0.875rem', 
                          marginBottom: '0.5rem',
                          wordBreak: 'break-word',
                          lineHeight: '1.4'
                        }}>
                          {department.description}
                        </p>
                      </div>
                      <div style={{ position: 'relative', flexShrink: 0 }}>
                        <button 
                          onClick={() => setShowDepartmentMenu(showDepartmentMenu === department.id ? null : department.id)}
                          className="btn btn-secondary" 
                          style={{ 
                            padding: '0.5rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'var(--gray-100)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = '';
                          }}
                        >
                        <MoreHorizontal style={{ width: '16px', height: '16px' }} />
                        </button>
                        {showDepartmentMenu === department.id && (
                          <div style={{
                            position: 'absolute',
                            top: '100%',
                            right: 0,
                            marginTop: '0.5rem',
                            background: 'var(--card-background)',
                            border: '1px solid var(--border-color)',
                            borderRadius: '8px',
                            boxShadow: 'var(--shadow-lg)',
                            zIndex: 1000,
                            minWidth: '180px',
                            padding: '0.5rem'
                          }}>
                            <button
                              onClick={() => {
                                handleViewDepartment(department);
                                setShowDepartmentMenu(null);
                              }}
                              style={{
                                width: '100%',
                                padding: '0.5rem 0.75rem',
                                textAlign: 'left',
                                background: 'transparent',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                fontSize: '0.875rem',
                                color: 'var(--text-color)',
                                transition: 'background 0.2s'
                              }}
                              onMouseEnter={(e) => e.currentTarget.style.background = 'var(--gray-100)'}
                              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                            >
                              <Eye size={16} />
                              <span>Se detaljer</span>
                            </button>
                            <button
                              onClick={() => {
                                handleEditDepartment(department);
                                setShowDepartmentMenu(null);
                              }}
                              style={{
                                width: '100%',
                                padding: '0.5rem 0.75rem',
                                textAlign: 'left',
                                background: 'transparent',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                fontSize: '0.875rem',
                                color: 'var(--text-color)',
                                transition: 'background 0.2s'
                              }}
                              onMouseEnter={(e) => e.currentTarget.style.background = 'var(--gray-100)'}
                              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                            >
                              <Edit size={16} />
                              <span>Rediger</span>
                            </button>
                            <button
                              onClick={() => {
                                handleViewDepartmentEmployees(department);
                                setShowDepartmentMenu(null);
                              }}
                              style={{
                                width: '100%',
                                padding: '0.5rem 0.75rem',
                                textAlign: 'left',
                                background: 'transparent',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                fontSize: '0.875rem',
                                color: 'var(--text-color)',
                                transition: 'background 0.2s'
                              }}
                              onMouseEnter={(e) => e.currentTarget.style.background = 'var(--gray-100)'}
                              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                            >
                              <Users size={16} />
                              <span>Se ansatte</span>
                            </button>
                            <button
                              onClick={() => {
                                handleDepartmentSettings(department);
                                setShowDepartmentMenu(null);
                              }}
                              style={{
                                width: '100%',
                                padding: '0.5rem 0.75rem',
                                textAlign: 'left',
                                background: 'transparent',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                fontSize: '0.875rem',
                                color: 'var(--text-color)',
                                transition: 'background 0.2s'
                              }}
                              onMouseEnter={(e) => e.currentTarget.style.background = 'var(--gray-100)'}
                              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                            >
                              <Settings size={16} />
                              <span>Innstillinger</span>
                            </button>
                            <div style={{
                              height: '1px',
                              background: 'var(--border-color)',
                              margin: '0.5rem 0'
                            }} />
                            <button
                              onClick={() => {
                                setSelectedDepartmentItem(department);
                                setShowDeleteConfirmModal(true);
                                setShowDepartmentMenu(null);
                              }}
                              style={{
                                width: '100%',
                                padding: '0.5rem 0.75rem',
                                textAlign: 'left',
                                background: 'transparent',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                fontSize: '0.875rem',
                                color: 'var(--danger)',
                                transition: 'background 0.2s'
                              }}
                              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'}
                              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                            >
                              <Trash2 size={16} />
                              <span>Slett avdeling</span>
                      </button>
                          </div>
                        )}
                      </div>
                    </div>

                    <div style={{ marginBottom: '1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                        <Users style={{ width: '14px', height: '14px', color: 'var(--gray-600)' }} />
                        <span style={{ fontSize: '0.875rem', color: 'var(--gray-600)' }}>
                          {department.employeeCount || 0} ansatte
                        </span>
                      </div>
                      {department.managerId && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                          <User style={{ width: '14px', height: '14px', color: 'var(--gray-600)' }} />
                          <span style={{ fontSize: '0.875rem', color: 'var(--gray-600)' }}>
                            <strong>Leder:</strong> {getManagerName(department.managerId)}
                          </span>
                        </div>
                      )}
                      {department.location && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                          <MapPin style={{ width: '14px', height: '14px', color: 'var(--gray-600)' }} />
                          <span style={{ fontSize: '0.875rem', color: 'var(--gray-600)' }}>
                            {department.location}
                          </span>
                        </div>
                      )}
                      {department.budget && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <BarChart3 style={{ width: '14px', height: '14px', color: 'var(--gray-600)' }} />
                          <span style={{ fontSize: '0.875rem', color: 'var(--gray-600)' }}>
                            {department.budget.toLocaleString()} kr budsjett
                          </span>
                        </div>
                      )}
                    </div>

                    <div style={{ marginBottom: '1rem' }}>
                      <div style={{ fontSize: '0.75rem', color: 'var(--gray-600)' }}>
                        Opprettet: {new Date(department.createdAt).toLocaleDateString('no-NO')}
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <button 
                        onClick={() => handleViewDepartment(department)}
                        className="btn btn-secondary" 
                        style={{ 
                          fontSize: '0.75rem', 
                          padding: '0.5rem 0.75rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.375rem',
                          whiteSpace: 'nowrap',
                          cursor: 'pointer',
                          transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = 'var(--gray-100)';
                          e.currentTarget.style.transform = 'translateY(-1px)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = '';
                          e.currentTarget.style.transform = '';
                        }}
                      >
                        <Eye style={{ width: '14px', height: '14px', flexShrink: 0 }} />
                        <span>Se</span>
                      </button>
                      <button 
                        onClick={() => handleEditDepartment(department)}
                        className="btn btn-secondary" 
                        style={{ 
                          fontSize: '0.75rem', 
                          padding: '0.5rem 0.75rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.375rem',
                          whiteSpace: 'nowrap',
                          cursor: 'pointer',
                          transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = 'var(--gray-100)';
                          e.currentTarget.style.transform = 'translateY(-1px)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = '';
                          e.currentTarget.style.transform = '';
                        }}
                      >
                        <Edit style={{ width: '14px', height: '14px', flexShrink: 0 }} />
                        <span>Rediger</span>
                      </button>
                      <button 
                        onClick={() => handleViewDepartmentEmployees(department)}
                        className="btn btn-secondary" 
                        style={{ 
                          fontSize: '0.75rem', 
                          padding: '0.5rem 0.75rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.375rem',
                          whiteSpace: 'nowrap',
                          cursor: 'pointer',
                          transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = 'var(--gray-100)';
                          e.currentTarget.style.transform = 'translateY(-1px)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = '';
                          e.currentTarget.style.transform = '';
                        }}
                      >
                        <Users style={{ width: '14px', height: '14px', flexShrink: 0 }} />
                        <span>Ansatte</span>
                      </button>
                      <button 
                        onClick={() => handleDepartmentSettings(department)}
                        className="btn btn-secondary" 
                        style={{ 
                          fontSize: '0.75rem', 
                          padding: '0.5rem 0.75rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.375rem',
                          whiteSpace: 'nowrap',
                          cursor: 'pointer',
                          transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = 'var(--gray-100)';
                          e.currentTarget.style.transform = 'translateY(-1px)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = '';
                          e.currentTarget.style.transform = '';
                        }}
                      >
                        <Settings style={{ width: '14px', height: '14px', flexShrink: 0 }} />
                        <span>Innstillinger</span>
                      </button>
                      <button 
                        onClick={() => {
                          setSelectedDepartmentItem(department);
                          setShowDeleteConfirmModal(true);
                          setShowDepartmentMenu(null);
                        }}
                        className="btn btn-secondary" 
                        style={{ 
                          fontSize: '0.75rem', 
                          padding: '0.5rem',
                          color: 'var(--danger)',
                          borderColor: 'var(--danger)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          minWidth: '36px',
                          cursor: 'pointer',
                          transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
                          e.currentTarget.style.transform = 'translateY(-1px)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = '';
                          e.currentTarget.style.transform = '';
                        }}
                      >
                        <Trash2 style={{ width: '14px', height: '14px', flexShrink: 0 }} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Department View Modal */}
      {showDepartmentViewModal && selectedDepartmentItem && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '1rem'
        }}
        onClick={() => setShowDepartmentViewModal(false)}
        >
          <div style={{
            background: 'var(--card-background)',
            borderRadius: '12px',
            maxWidth: '600px',
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto',
            boxShadow: 'var(--shadow-xl)'
          }}
          onClick={(e) => e.stopPropagation()}
          >
            <div style={{
              padding: '1.5rem',
              borderBottom: '1px solid var(--border-color)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: '600', color: 'var(--text-color)', margin: 0 }}>
                {selectedDepartmentItem.name}
              </h2>
              <button
                onClick={() => setShowDepartmentViewModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '0.5rem',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'background 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'var(--gray-100)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              >
                <X size={24} />
              </button>
            </div>
            <div style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div>
                  <label style={{ fontSize: '0.875rem', fontWeight: '500', color: 'var(--gray-600)', marginBottom: '0.5rem', display: 'block' }}>
                    Beskrivelse
                  </label>
                  <p style={{ fontSize: '1rem', color: 'var(--text-color)', margin: 0 }}>
                    {selectedDepartmentItem.description || 'Ingen beskrivelse'}
                  </p>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ fontSize: '0.875rem', fontWeight: '500', color: 'var(--gray-600)', marginBottom: '0.5rem', display: 'block' }}>
                      Antall ansatte
                    </label>
                    <p style={{ fontSize: '1rem', color: 'var(--text-color)', margin: 0 }}>
                      {selectedDepartmentItem.employeeCount || 0}
                    </p>
                  </div>
                  {selectedDepartmentItem.managerId && (
                    <div>
                      <label style={{ fontSize: '0.875rem', fontWeight: '500', color: 'var(--gray-600)', marginBottom: '0.5rem', display: 'block' }}>
                        Leder
                      </label>
                      <p style={{ fontSize: '1rem', color: 'var(--text-color)', margin: 0 }}>
                        {getManagerName(selectedDepartmentItem.managerId)}
                      </p>
                    </div>
                  )}
                  {selectedDepartmentItem.location && (
                    <div>
                      <label style={{ fontSize: '0.875rem', fontWeight: '500', color: 'var(--gray-600)', marginBottom: '0.5rem', display: 'block' }}>
                        Lokasjon
                      </label>
                      <p style={{ fontSize: '1rem', color: 'var(--text-color)', margin: 0 }}>
                        {selectedDepartmentItem.location}
                      </p>
                    </div>
                  )}
                  {selectedDepartmentItem.budget && (
                    <div>
                      <label style={{ fontSize: '0.875rem', fontWeight: '500', color: 'var(--gray-600)', marginBottom: '0.5rem', display: 'block' }}>
                        Budsjett
                      </label>
                      <p style={{ fontSize: '1rem', color: 'var(--text-color)', margin: 0 }}>
                        {selectedDepartmentItem.budget.toLocaleString()} kr
                      </p>
                    </div>
                  )}
                </div>
                <div>
                  <label style={{ fontSize: '0.875rem', fontWeight: '500', color: 'var(--gray-600)', marginBottom: '0.5rem', display: 'block' }}>
                    Opprettet
                  </label>
                  <p style={{ fontSize: '1rem', color: 'var(--text-color)', margin: 0 }}>
                    {new Date(selectedDepartmentItem.createdAt).toLocaleDateString('no-NO', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => {
                    setShowDepartmentViewModal(false);
                    handleEditDepartment(selectedDepartmentItem);
                  }}
                  className="btn btn-primary"
                  style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                >
                  <Edit size={16} />
                        Rediger
                      </button>
                <button
                  onClick={() => setShowDepartmentViewModal(false)}
                  className="btn btn-secondary"
                >
                  Lukk
                      </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Department Edit Modal */}
      {showDepartmentEditModal && selectedDepartmentItem && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '1rem'
        }}
        onClick={() => setShowDepartmentEditModal(false)}
        >
          <div style={{
            background: 'var(--card-background)',
            borderRadius: '12px',
            maxWidth: '600px',
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto',
            boxShadow: 'var(--shadow-xl)'
          }}
          onClick={(e) => e.stopPropagation()}
          >
            <div style={{
              padding: '1.5rem',
              borderBottom: '1px solid var(--border-color)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: '600', color: 'var(--text-color)', margin: 0 }}>
                Rediger avdeling
              </h2>
              <button
                onClick={() => setShowDepartmentEditModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '0.5rem',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'background 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'var(--gray-100)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              >
                <X size={24} />
                      </button>
            </div>
            <div style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-color)', marginBottom: '0.5rem', display: 'block' }}>
                    Avdelingsnavn *
                  </label>
                  <input
                    type="text"
                    value={editDepartment.name}
                    onChange={(e) => setEditDepartment({ ...editDepartment, name: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid var(--border-color)',
                      borderRadius: '8px',
                      fontSize: '1rem',
                      background: 'var(--card-background)',
                      color: 'var(--text-color)'
                    }}
                    placeholder="F.eks. Produksjon"
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-color)', marginBottom: '0.5rem', display: 'block' }}>
                    Beskrivelse
                  </label>
                  <textarea
                    value={editDepartment.description}
                    onChange={(e) => setEditDepartment({ ...editDepartment, description: e.target.value })}
                    rows={4}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid var(--border-color)',
                      borderRadius: '8px',
                      fontSize: '1rem',
                      background: 'var(--card-background)',
                      color: 'var(--text-color)',
                      resize: 'vertical',
                      fontFamily: 'inherit'
                    }}
                    placeholder="Beskriv avdelingen..."
                  />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-color)', marginBottom: '0.5rem', display: 'block' }}>
                      Lokasjon
                    </label>
                    <input
                      type="text"
                      value={editDepartment.location}
                      onChange={(e) => setEditDepartment({ ...editDepartment, location: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid var(--border-color)',
                        borderRadius: '8px',
                        fontSize: '1rem',
                        background: 'var(--card-background)',
                        color: 'var(--text-color)'
                      }}
                      placeholder="F.eks. Bygning A, 2. etasje"
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-color)', marginBottom: '0.5rem', display: 'block' }}>
                      Budsjett (kr)
                    </label>
                    <input
                      type="number"
                      value={editDepartment.budget}
                      onChange={(e) => setEditDepartment({ ...editDepartment, budget: parseFloat(e.target.value) || 0 })}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid var(--border-color)',
                        borderRadius: '8px',
                        fontSize: '1rem',
                        background: 'var(--card-background)',
                        color: 'var(--text-color)'
                      }}
                      placeholder="0"
                    />
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-color)', marginBottom: '0.5rem', display: 'block' }}>
                    Leder
                  </label>
                  <select
                    value={editDepartment.managerId}
                    onChange={(e) => setEditDepartment({ ...editDepartment, managerId: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid var(--border-color)',
                      borderRadius: '8px',
                      fontSize: '1rem',
                      background: 'var(--card-background)',
                      color: 'var(--text-color)'
                    }}
                  >
                    <option value="">Ingen leder</option>
                    {employees.filter(emp => emp.role === 'admin' || emp.role === 'department_leader').map(emp => (
                      <option key={emp.id} value={emp.id}>{emp.displayName}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => setShowDepartmentEditModal(false)}
                  className="btn btn-secondary"
                >
                  Avbryt
                </button>
                <button
                  onClick={handleUpdateDepartment}
                  className="btn btn-primary"
                  style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                >
                  <Save size={16} />
                  Lagre endringer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Department Employees Modal */}
      {showDepartmentEmployeesModal && selectedDepartmentItem && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '1rem'
        }}
        onClick={() => setShowDepartmentEmployeesModal(false)}
        >
          <div style={{
            background: 'var(--card-background)',
            borderRadius: '12px',
            maxWidth: '800px',
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto',
            boxShadow: 'var(--shadow-xl)'
          }}
          onClick={(e) => e.stopPropagation()}
          >
            <div style={{
              padding: '1.5rem',
              borderBottom: '1px solid var(--border-color)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: '600', color: 'var(--text-color)', margin: 0 }}>
                Ansatte i {selectedDepartmentItem.name}
              </h2>
              <button
                onClick={() => setShowDepartmentEmployeesModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '0.5rem',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'background 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'var(--gray-100)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              >
                <X size={24} />
              </button>
            </div>
            <div style={{ padding: '1.5rem' }}>
              {employees.filter(emp => emp.departmentId === selectedDepartmentItem.id).length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
                  <Users size={48} style={{ color: 'var(--gray-400)', margin: '0 auto 1rem' }} />
                  <p style={{ color: 'var(--gray-600)', fontSize: '1rem' }}>
                    Ingen ansatte i denne avdelingen
                  </p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {employees.filter(emp => emp.departmentId === selectedDepartmentItem.id).map(employee => (
                    <div
                      key={employee.id}
                      style={{
                        padding: '1rem',
                        border: '1px solid var(--border-color)',
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '1rem',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'var(--gray-50)';
                        e.currentTarget.style.borderColor = 'var(--primary)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'var(--card-background)';
                        e.currentTarget.style.borderColor = 'var(--border-color)';
                      }}
                    >
                      <div style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        background: 'var(--primary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontWeight: '600',
                        flexShrink: 0
                      }}>
                        {employee.displayName?.charAt(0).toUpperCase() || '?'}
                      </div>
                      <div style={{ flex: 1 }}>
                        <h3 style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--text-color)', margin: '0 0 0.25rem 0' }}>
                          {employee.displayName}
                        </h3>
                        <p style={{ fontSize: '0.875rem', color: 'var(--gray-600)', margin: 0 }}>
                          {employee.position || 'Ingen stilling'} • {employee.email}
                        </p>
                      </div>
                      <div style={{
                        padding: '0.25rem 0.75rem',
                        borderRadius: '9999px',
                        fontSize: '0.75rem', 
                        fontWeight: '600',
                        background: employee.status === 'active' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                        color: employee.status === 'active' ? 'var(--success)' : 'var(--danger)',
                        border: `1px solid ${employee.status === 'active' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`
                      }}>
                        {employee.status === 'active' ? 'Aktiv' : employee.status === 'inactive' ? 'Inaktiv' : 'Permisjon'}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => setShowDepartmentEmployeesModal(false)}
                  className="btn btn-secondary"
                >
                  Lukk
                      </button>
                    </div>
                  </div>
          </div>
        </div>
      )}

      {/* Department Settings Modal */}
      {showDepartmentSettingsModal && selectedDepartmentItem && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '1rem'
        }}
        onClick={() => setShowDepartmentSettingsModal(false)}
        >
          <div style={{
            background: 'var(--card-background)',
            borderRadius: '12px',
            maxWidth: '600px',
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto',
            boxShadow: 'var(--shadow-xl)'
          }}
          onClick={(e) => e.stopPropagation()}
          >
            <div style={{
              padding: '1.5rem',
              borderBottom: '1px solid var(--border-color)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: '600', color: 'var(--text-color)', margin: 0 }}>
                Innstillinger - {selectedDepartmentItem.name}
              </h2>
              <button
                onClick={() => setShowDepartmentSettingsModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '0.5rem',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'background 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'var(--gray-100)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              >
                <X size={24} />
              </button>
            </div>
            <div style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div>
                  <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: 'var(--text-color)', marginBottom: '1rem' }}>
                    Avdelingsopplysninger
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div>
                      <label style={{ fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-color)', marginBottom: '0.5rem', display: 'block' }}>
                        Status
                      </label>
                      <select
                        value={selectedDepartmentItem.status || 'active'}
                        onChange={async (e) => {
                          if (selectedDepartmentItem) {
                            try {
                              await firebaseService.updateDepartment(selectedDepartmentItem.id, {
                                status: e.target.value as 'active' | 'inactive'
                              });
                              await loadAllData();
                              alert('Status oppdatert');
                            } catch (error) {
                              console.error('Error updating status:', error);
                              alert('Feil ved oppdatering av status');
                            }
                          }
                        }}
                        style={{
                          width: '100%',
                          padding: '0.75rem',
                          border: '1px solid var(--border-color)',
                          borderRadius: '8px',
                          fontSize: '1rem',
                          background: 'var(--card-background)',
                          color: 'var(--text-color)'
                        }}
                      >
                        <option value="active">Aktiv</option>
                        <option value="inactive">Inaktiv</option>
                      </select>
                    </div>
                  </div>
                </div>
                <div>
                  <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: 'var(--text-color)', marginBottom: '1rem' }}>
                    Statistikk
                  </h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div style={{
                      padding: '1rem',
                      background: 'var(--gray-50)',
                      borderRadius: '8px',
                      border: '1px solid var(--border-color)'
                    }}>
                      <div style={{ fontSize: '0.875rem', color: 'var(--gray-600)', marginBottom: '0.25rem' }}>
                        Antall ansatte
                      </div>
                      <div style={{ fontSize: '1.5rem', fontWeight: '600', color: 'var(--text-color)' }}>
                        {selectedDepartmentItem.employeeCount || 0}
                      </div>
                    </div>
                    {selectedDepartmentItem.budget && (
                      <div style={{
                        padding: '1rem',
                        background: 'var(--gray-50)',
                        borderRadius: '8px',
                        border: '1px solid var(--border-color)'
                      }}>
                        <div style={{ fontSize: '0.875rem', color: 'var(--gray-600)', marginBottom: '0.25rem' }}>
                          Budsjett
                        </div>
                        <div style={{ fontSize: '1.5rem', fontWeight: '600', color: 'var(--text-color)' }}>
                          {selectedDepartmentItem.budget.toLocaleString()} kr
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => setShowDepartmentSettingsModal(false)}
                  className="btn btn-secondary"
                >
                  Lukk
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirmModal && selectedDepartmentItem && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '1rem'
        }}
        onClick={() => setShowDeleteConfirmModal(false)}
        >
          <div style={{
            background: 'var(--card-background)',
            borderRadius: '12px',
            maxWidth: '500px',
            width: '100%',
            boxShadow: 'var(--shadow-xl)'
          }}
          onClick={(e) => e.stopPropagation()}
          >
            <div style={{
              padding: '1.5rem',
              borderBottom: '1px solid var(--border-color)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: '600', color: 'var(--text-color)', margin: 0 }}>
                Bekreft sletting
              </h2>
              <button
                onClick={() => setShowDeleteConfirmModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '0.5rem',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'background 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'var(--gray-100)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              >
                <X size={24} />
              </button>
            </div>
            <div style={{ padding: '1.5rem' }}>
              <p style={{ fontSize: '1rem', color: 'var(--text-color)', marginBottom: '1.5rem', lineHeight: '1.6' }}>
                Er du sikker på at du vil slette avdelingen <strong>{selectedDepartmentItem.name}</strong>?
                {employees.filter(emp => emp.departmentId === selectedDepartmentItem.id).length > 0 && (
                  <span style={{ display: 'block', marginTop: '0.5rem', color: 'var(--danger)', fontWeight: '600' }}>
                    Advarsel: Denne avdelingen har {employees.filter(emp => emp.departmentId === selectedDepartmentItem.id).length} ansatte. 
                    Du må flytte ansatte først før du kan slette avdelingen.
                  </span>
                )}
              </p>
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => setShowDeleteConfirmModal(false)}
                  className="btn btn-secondary"
                >
                  Avbryt
                </button>
                <button
                  onClick={() => handleDeleteDepartment(selectedDepartmentItem)}
                  className="btn btn-danger"
                  disabled={employees.filter(emp => emp.departmentId === selectedDepartmentItem.id).length > 0}
                  style={{
                    opacity: employees.filter(emp => emp.departmentId === selectedDepartmentItem.id).length > 0 ? 0.5 : 1,
                    cursor: employees.filter(emp => emp.departmentId === selectedDepartmentItem.id).length > 0 ? 'not-allowed' : 'pointer'
                  }}
                >
                  <Trash2 size={16} style={{ marginRight: '0.5rem' }} />
                  Slett avdeling
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Click outside to close menu */}
      {showDepartmentMenu && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 999
          }}
          onClick={() => setShowDepartmentMenu(null)}
        />
      )}

      {/* Add Employee/Department Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content" style={{ maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">
                Legg til {activeTab === 'employees' ? 'ansatt' : activeTab === 'departments' ? 'avdeling' : 'ny'}
              </h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="modal-close"
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              {activeTab === 'employees' ? (
                // Add Employee Form
                <>
                <div className="form-grid">
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
                    <label className="form-label">Rolle *</label>
                    <select
                      value={newEmployee.role}
                      onChange={(e) => {
                        const newRole = e.target.value as "admin" | "department_leader" | "employee";
                        setNewEmployee({
                          ...newEmployee, 
                          role: newRole,
                          // Nullstill avdeling-relaterte felt når rolle endres
                          departmentId: newRole === 'employee' ? newEmployee.departmentId : '',
                          leadership: {
                            ...newEmployee.leadership,
                            managesDepartments: newRole === 'department_leader' ? newEmployee.leadership.managesDepartments : []
                          }
                        });
                      }}
                      className="form-input"
                      required
                    >
                      <option value="employee">Ansatt</option>
                      <option value="department_leader">Avdelingsleder</option>
                      <option value="admin">Administrator</option>
                    </select>
                  </div>
                  {newEmployee.role === 'employee' && (
                    <div className="form-group">
                      <label className="form-label">Avdeling *</label>
                      <select
                        value={newEmployee.departmentId}
                        onChange={(e) => setNewEmployee({...newEmployee, departmentId: e.target.value})}
                        className="form-input"
                        required
                      >
                        <option value="">Velg avdeling</option>
                        {departments.map(dept => (
                          <option key={dept.id} value={dept.id}>
                            {dept.name}
                          </option>
                        ))}
                      </select>
                      <small style={{ color: 'var(--gray-500)', fontSize: '0.75rem', marginTop: '0.25rem', display: 'block' }}>
                        Velg hvilken avdeling denne ansatte tilhører
                      </small>
              </div>
                  )}
                  {newEmployee.role === 'department_leader' && (
                    <div className="form-group">
                      <label className="form-label">Leder for avdeling *</label>
                      <select
                        value={newEmployee.leadership.managesDepartments[0] || ''}
                        onChange={(e) => {
                          const selectedDeptId = e.target.value;
                          setNewEmployee({
                            ...newEmployee,
                            leadership: {
                              ...newEmployee.leadership,
                              managesDepartments: selectedDeptId ? [selectedDeptId] : [],
                              isManager: true
                            },
                            // Sett også departmentId til den avdelingen de leder
                            departmentId: selectedDeptId
                          });
                        }}
                        className="form-input"
                        required
                      >
                        <option value="">Velg avdeling</option>
                        {departments.map(dept => (
                          <option key={dept.id} value={dept.id}>
                            {dept.name}
                          </option>
                        ))}
                      </select>
                      <small style={{ color: 'var(--gray-500)', fontSize: '0.75rem', marginTop: '0.25rem', display: 'block' }}>
                        Velg hvilken avdeling denne personen skal være leder for
                      </small>
            </div>
          )}
        </div>
                </>
              ) : activeTab === 'departments' ? (
                // Add Department Form
                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">Avdelingsnavn *</label>
                    <input
                      type="text"
                      value={newDepartment.name}
                      onChange={(e) => setNewDepartment({ ...newDepartment, name: e.target.value })}
                      className="form-input"
                      placeholder="Avdelingsnavn"
                      required
                    />
      </div>
                  <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                    <label className="form-label">Beskrivelse</label>
                    <textarea
                      value={newDepartment.description}
                      onChange={(e) => setNewDepartment({ ...newDepartment, description: e.target.value })}
                      className="form-input"
                      placeholder="Beskrivelse av avdelingen"
                      rows={3}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Lokasjon</label>
                    <input
                      type="text"
                      value={newDepartment.location}
                      onChange={(e) => setNewDepartment({ ...newDepartment, location: e.target.value })}
                      className="form-input"
                      placeholder="F.eks. 2. etasje, bygg A"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Budsjett (kr)</label>
                    <input
                      type="number"
                      value={newDepartment.budget}
                      onChange={(e) => setNewDepartment({ ...newDepartment, budget: Number(e.target.value) })}
                      className="form-input"
                      placeholder="0"
                      min="0"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Avdelingsleder</label>
                    <select
                      value={newDepartment.managerId}
                      onChange={(e) => setNewDepartment({ ...newDepartment, managerId: e.target.value })}
                      className="form-input"
                    >
                      <option value="">Velg avdelingsleder (valgfritt)</option>
                      {employees.filter(emp => emp.role === 'admin' || emp.role === 'department_leader').map(employee => (
                        <option key={employee.id} value={employee.id}>
                          {employee.displayName} - {employee.position || 'Ingen stilling'}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              ) : null}
            </div>
            <div className="modal-footer">
              <button
                onClick={() => setShowAddModal(false)}
                className="btn btn-secondary"
              >
                Avbryt
              </button>
              <button
                onClick={activeTab === 'employees' ? handleAddEmployee : activeTab === 'departments' ? handleAddDepartment : () => {}}
                className="btn btn-primary"
              >
                {activeTab === 'employees' ? 'Legg til ansatt' : activeTab === 'departments' ? 'Opprett avdeling' : 'Lagre'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Employee Modal */}
      {showViewModal && selectedEmployee && (
        <div className="modal-overlay" onClick={() => setShowViewModal(false)}>
          <div className="modal-content" style={{ maxWidth: '900px', maxHeight: '90vh', overflowY: 'auto' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Ansatt Detaljer</h2>
              <button onClick={() => setShowViewModal(false)} className="modal-close">×</button>
            </div>
            <div className="modal-body">
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'var(--blue-100)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', fontWeight: '600', color: 'var(--blue-700)' }}>
                  {(selectedEmployee.displayName?.charAt(0) || 'U').toUpperCase()}
                </div>
                <div>
                  <h3 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '0.5rem' }}>
                    {selectedEmployee.displayName}
                  </h3>
                  <p style={{ color: 'var(--gray-600)', marginBottom: '0.25rem' }}>
                    {selectedEmployee.email}
                  </p>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <span style={{ padding: '0.25rem 0.75rem', borderRadius: '0.375rem', fontSize: '0.875rem', fontWeight: '500', background: 'var(--blue-100)', color: 'var(--blue-700)' }}>
                      {selectedEmployee.role === 'admin' ? 'Administrator' : 
                       selectedEmployee.role === 'department_leader' ? 'Avdelingsleder' : 'Ansatt'}
                    </span>
                    <span style={{ padding: '0.25rem 0.75rem', borderRadius: '0.375rem', fontSize: '0.875rem', fontWeight: '500', 
                      background: selectedEmployee.status === 'active' ? 'var(--green-100)' : 
                                 selectedEmployee.status === 'inactive' ? 'var(--red-100)' : 'var(--orange-100)',
                      color: selectedEmployee.status === 'active' ? 'var(--green-700)' : 
                             selectedEmployee.status === 'inactive' ? 'var(--red-700)' : 'var(--orange-700)' }}>
                      {selectedEmployee.status === 'active' ? 'Aktiv' : 
                       selectedEmployee.status === 'inactive' ? 'Inaktiv' : 'Permisjon'}
                    </span>
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.5rem' }}>
                <div>
                  <h4 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '1rem' }}>Grunnleggende informasjon</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <div><strong>Telefon:</strong> {selectedEmployee.phone || 'Ikke registrert'}</div>
                    <div><strong>Stilling:</strong> {selectedEmployee.position || 'Ikke registrert'}</div>
                    <div><strong>Avdeling:</strong> {getDepartmentName(selectedEmployee.departmentId || '')}</div>
                    <div><strong>Ansattnummer:</strong> {(selectedEmployee as any).employeeNumber || 'Ikke registrert'}</div>
                  </div>
                </div>
                <div>
                  <h4 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '1rem' }}>Arbeidsinformasjon</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <div><strong>Ansettelsesdato:</strong> {selectedEmployee.hireDate ? new Date(selectedEmployee.hireDate).toLocaleDateString('no-NO') : 'Ikke registrert'}</div>
                    <div><strong>Lønn:</strong> {(selectedEmployee as any).salary ? `${Number((selectedEmployee as any).salary).toLocaleString('no-NO')} kr` : 'Ikke registrert'}</div>
                    <div><strong>Fødselsdato:</strong> {(selectedEmployee as any).birthDate ? new Date((selectedEmployee as any).birthDate).toLocaleDateString('no-NO') : 'Ikke registrert'}</div>
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button onClick={() => setShowViewModal(false)} className="btn btn-secondary">Lukk</button>
              <button onClick={() => { setShowViewModal(false); handleEditEmployee(selectedEmployee); }} className="btn btn-primary">
                <Edit size={16} style={{ marginRight: '0.5rem' }} />
                Rediger
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Employee Modal */}
      {showEditModal && selectedEmployee && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal-content" style={{ maxWidth: '1200px', maxHeight: '90vh', overflowY: 'auto' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Rediger ansatt</h2>
              <button onClick={() => setShowEditModal(false)} className="modal-close">×</button>
            </div>
            <div className="modal-body">
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Navn *</label>
                  <input
                    type="text"
                    value={selectedEmployee.displayName || ''}
                    onChange={(e) => setSelectedEmployee({...selectedEmployee, displayName: e.target.value})}
                    className="form-input"
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">E-post *</label>
                  <input
                    type="email"
                    value={selectedEmployee.email || ''}
                    onChange={(e) => setSelectedEmployee({...selectedEmployee, email: e.target.value})}
                    className="form-input"
                    required
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
                  <label className="form-label">Rolle *</label>
                  <select
                    value={selectedEmployee.role}
                    onChange={(e) => {
                      const newRole = e.target.value as "admin" | "department_leader" | "employee";
                      const currentLeadership = (selectedEmployee as any).leadership || {
                        isManager: false,
                        managesDepartments: [] as string[],
                        managesEmployees: [] as string[],
                        reportsTo: '',
                        canApproveExpenses: false,
                        canApprovePurchases: false,
                        budgetLimit: 0,
                      };
                      setSelectedEmployee({
                        ...selectedEmployee, 
                        role: newRole,
                        departmentId: newRole === 'employee' ? selectedEmployee.departmentId : '',
                        leadership: {
                          ...currentLeadership,
                          managesDepartments: newRole === 'department_leader' ? currentLeadership.managesDepartments : []
                        }
                      } as any);
                    }}
                    className="form-input"
                    required
                  >
                    <option value="employee">Ansatt</option>
                    <option value="department_leader">Avdelingsleder</option>
                    <option value="admin">Administrator</option>
                  </select>
                </div>
                {selectedEmployee.role === 'employee' && (
                  <div className="form-group">
                    <label className="form-label">Avdeling *</label>
                    <select
                      value={selectedEmployee.departmentId || ''}
                      onChange={(e) => setSelectedEmployee({...selectedEmployee, departmentId: e.target.value})}
                      className="form-input"
                      required
                    >
                      <option value="">Velg avdeling</option>
                      {departments.map(dept => (
                        <option key={dept.id} value={dept.id}>
                          {dept.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                {selectedEmployee.role === 'department_leader' && (
                  <div className="form-group">
                    <label className="form-label">Leder for avdeling *</label>
                    <select
                      value={((selectedEmployee as any).leadership?.managesDepartments?.[0] || selectedEmployee.departmentId || '')}
                      onChange={(e) => {
                        const selectedDeptId = e.target.value;
                        const currentLeadership = (selectedEmployee as any).leadership || {
                          isManager: false,
                          managesDepartments: [] as string[],
                          managesEmployees: [] as string[],
                          reportsTo: '',
                          canApproveExpenses: false,
                          canApprovePurchases: false,
                          budgetLimit: 0,
                        };
                        setSelectedEmployee({
                          ...selectedEmployee,
                          leadership: {
                            ...currentLeadership,
                            managesDepartments: selectedDeptId ? [selectedDeptId] : [],
                            isManager: true
                          },
                          departmentId: selectedDeptId
                        } as any);
                      }}
                      className="form-input"
                      required
                    >
                      <option value="">Velg avdeling</option>
                      {departments.map(dept => (
                        <option key={dept.id} value={dept.id}>
                          {dept.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                <div className="form-group">
                  <label className="form-label">Status</label>
                  <select
                    value={selectedEmployee.status || 'active'}
                    onChange={(e) => setSelectedEmployee({...selectedEmployee, status: e.target.value as "active" | "inactive" | "on_leave"})}
                    className="form-input"
                  >
                    <option value="active">Aktiv</option>
                    <option value="inactive">Inaktiv</option>
                    <option value="on_leave">Permisjon</option>
                  </select>
                </div>
              </div>

              {/* Tilgangskontroll-seksjon */}
              <div style={{ marginTop: '2rem', padding: '1.5rem', background: 'var(--card-background)', borderRadius: '0.5rem', border: '1px solid var(--border-color)' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1.5rem', color: 'var(--text-color)' }}>
                  🔐 Tilgangskontroll og rettigheter
                </h3>
                
                {/* Kategoriserte side-tilganger */}
                {[
                  {
                    category: 'Hovedside',
                    icon: '🏠',
                    permissions: [
                      { key: 'dashboard', label: 'Dashboard', icon: '🏠' },
                    ]
                  },
                  {
                    category: 'Internkontroll og Samsvar',
                    icon: '📋',
                    permissions: [
                      { key: 'internrevisjon', label: 'Internrevisjon', icon: '📊' },
                      { key: 'avvik', label: 'Avvik', icon: '⚠️' },
                      { key: 'risikovurdering', label: 'Risikovurdering', icon: '🛡️' },
                      { key: 'oppfølgingstiltak', label: 'Oppfølgingstiltak', icon: '✅' },
                      { key: 'kontrollpunkter', label: 'Kontrollpunkter', icon: '✓' },
                      { key: 'internkontrollRapporter', label: 'Rapporter', icon: '📈' },
                    ]
                  },
                  {
                    category: 'HR & Personal - Faner',
                    icon: '👥',
                    permissions: [
                      { key: 'hrAnsatte', label: 'Ansatte', icon: '👤' },
                      { key: 'hrVakter', label: 'Vakter', icon: '📅' },
                      { key: 'hrFravær', label: 'Fravær', icon: '🤒' },
                      { key: 'hrFerie', label: 'Ferie', icon: '🏖️' },
                      { key: 'hrAvdelinger', label: 'Avdelinger', icon: '🏢' },
                    ]
                  },
                  {
                    category: 'Logistikk System - Faner',
                    icon: '🚚',
                    permissions: [
                      { key: 'logistikkBudPriser', label: 'BUD Priser', icon: '💰' },
                      { key: 'logistikkLevering', label: 'Levering', icon: '🚛' },
                      { key: 'logistikkPlanlegging', label: 'Planlegging', icon: '🗺️' },
                      { key: 'logistikkKunder', label: 'Kunder', icon: '👥' },
                      { key: 'logistikkLeverandorer', label: 'Leverandører', icon: '📦' },
                      { key: 'logistikkProdukter', label: 'Produkter', icon: '🛍️' },
                      { key: 'logistikkLager', label: 'Lager', icon: '📦' },
                      { key: 'logistikkFakturering', label: 'Fakturering', icon: '🧾' },
                      { key: 'logistikkFinans', label: 'Finans', icon: '💵' },
                    ]
                  },
                  {
                    category: 'Kommunikasjon',
                    icon: '💬',
                    permissions: [
                      { key: 'chat', label: 'Chat', icon: '💬' },
                      { key: 'emailSystem', label: 'E-post System', icon: '📧' },
                      { key: 'smsLogs', label: 'SMS Logg & Telefonbok', icon: '📱' },
                    ]
                  },
                  {
                    category: 'Samarbeid og dokumenter',
                    icon: '🤝',
                    permissions: [
                      { key: 'partners', label: 'Samarbeidspartnere', icon: '🤝' },
                      { key: 'documents', label: 'Dokumenter', icon: '📄' },
                    ]
                  },
                  {
                    category: 'Kjernefunksjoner',
                    icon: '⚙️',
                    permissions: [
                      { key: 'employees', label: 'Ansatte', icon: '👥' },
                      { key: 'departments', label: 'Avdelinger', icon: '🏢' },
                      { key: 'calendar', label: 'Kalender', icon: '📅' },
                      { key: 'notifications', label: 'Varsler', icon: '🔔' },
                    ]
                  },
                  {
                    category: 'Prosjekt og oppgaver',
                    icon: '📋',
                    permissions: [
                      { key: 'projects', label: 'Prosjekter', icon: '📋' },
                      { key: 'tasks', label: 'Oppgaver', icon: '✅' },
                    ]
                  },
                  {
                    category: 'Økonomi og finans',
                    icon: '💰',
                    permissions: [
                      { key: 'finance', label: 'Økonomi', icon: '💰' },
                      { key: 'invoicing', label: 'Fakturering', icon: '🧾' },
                      { key: 'payments', label: 'Betalinger', icon: '💳' },
                      { key: 'procurement', label: 'Innkjøp', icon: '🛒' },
                    ]
                  },
                  {
                    category: 'Lager og logistikk',
                    icon: '📦',
                    permissions: [
                      { key: 'inventory', label: 'Lager', icon: '📦' },
                      { key: 'suppliers', label: 'Leverandører', icon: '🚚' },
                      { key: 'logistics', label: 'Logistikk', icon: '📦' },
                      { key: 'delivery', label: 'Levering', icon: '🚛' },
                    ]
                  },
                  {
                    category: 'HR og personal',
                    icon: '👤',
                    permissions: [
                      { key: 'hr', label: 'HR', icon: '👤' },
                      { key: 'training', label: 'Opplæring', icon: '🎓' },
                    ]
                  },
                  {
                    category: 'Salg og markedsføring',
                    icon: '💼',
                    permissions: [
                      { key: 'crm', label: 'CRM', icon: '🤝' },
                      { key: 'sales', label: 'Salg', icon: '💼' },
                      { key: 'marketing', label: 'Markedsføring', icon: '📢' },
                      { key: 'customerService', label: 'Kundeservice', icon: '🎧' },
                    ]
                  },
                  {
                    category: 'Produksjon og kvalitet',
                    icon: '🏭',
                    permissions: [
                      { key: 'production', label: 'Produksjon', icon: '🏭' },
                      { key: 'quality', label: 'Kvalitet', icon: '⭐' },
                      { key: 'maintenance', label: 'Vedlikehold', icon: '🔧' },
                    ]
                  },
                  {
                    category: 'Sikkerhet og compliance',
                    icon: '🛡️',
                    permissions: [
                      { key: 'safety', label: 'Sikkerhet', icon: '🛡️' },
                      { key: 'compliance', label: 'Compliance', icon: '⚖️' },
                      { key: 'legal', label: 'Juridisk', icon: '⚖️' },
                      { key: 'audit', label: 'Revisjon', icon: '🔍' },
                    ]
                  },
                  {
                    category: 'IT og dokumenter',
                    icon: '💻',
                    permissions: [
                      { key: 'it', label: 'IT', icon: '💻' },
                      { key: 'mail', label: 'E-post', icon: '📧' },
                    ]
                  },
                  {
                    category: 'Rapporter og analyser',
                    icon: '📊',
                    permissions: [
                      { key: 'reports', label: 'Rapporter', icon: '📊' },
                      { key: 'analytics', label: 'Analyser', icon: '📈' },
                    ]
                  },
                  {
                    category: 'System',
                    icon: '⚙️',
                    permissions: [
                      { key: 'settings', label: 'Innstillinger', icon: '⚙️' },
                    ]
                  },
                ].map((category) => (
                  <div key={category.category} style={{ marginBottom: '1.5rem', padding: '1rem', background: 'var(--background-color)', borderRadius: '0.5rem', border: '1px solid var(--border-color)' }}>
                    <h4 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '0.75rem', color: 'var(--text-color)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span>{category.icon}</span>
                      {category.category}
                    </h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.75rem' }}>
                      {category.permissions.map(({ key, label, icon }) => (
                        <label key={key} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', cursor: 'pointer', padding: '0.5rem', borderRadius: '0.375rem', transition: 'background 0.2s', background: (selectedEmployee as any)?.permissions?.[key] ? 'rgba(56, 189, 248, 0.15)' : 'transparent' }}>
                          <input
                            type="checkbox"
                            checked={(selectedEmployee as any)?.permissions?.[key] || false}
                            onChange={(e) => {
                              const currentPermissions = (selectedEmployee as any)?.permissions || {};
                              setSelectedEmployee({
                                ...selectedEmployee,
                                permissions: {
                                  ...currentPermissions,
                                  [key]: e.target.checked
                                }
                              } as any);
                            }}
                            style={{ margin: 0, width: '16px', height: '16px', cursor: 'pointer' }}
                          />
                          <span style={{ color: (selectedEmployee as any)?.permissions?.[key] ? 'var(--primary)' : 'var(--text-color)' }}>
                            {icon} {label}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}

                {/* Ferie og fravær-tilgang */}
                <div style={{ marginBottom: '1.5rem' }}>
                  <h4 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '0.75rem', color: 'var(--text-color)' }}>
                    🏖️ Ferie og fravær-tilgang
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
                    <div>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', cursor: 'pointer', marginBottom: '0.5rem' }}>
                        <input
                          type="checkbox"
                          checked={(selectedEmployee as any)?.vacationAccess?.canRequestVacation || false}
                          onChange={(e) => {
                            const currentVacationAccess = (selectedEmployee as any)?.vacationAccess || {};
                            setSelectedEmployee({
                              ...selectedEmployee,
                              vacationAccess: {
                                ...currentVacationAccess,
                                canRequestVacation: e.target.checked
                              }
                            } as any);
                          }}
                          style={{ margin: 0, width: '16px', height: '16px', cursor: 'pointer' }}
                        />
                        <span>Kan be om ferie/fravær</span>
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', cursor: 'pointer', marginBottom: '0.5rem' }}>
                        <input
                          type="checkbox"
                          checked={(selectedEmployee as any)?.vacationAccess?.canApproveVacation || false}
                          onChange={(e) => {
                            const currentVacationAccess = (selectedEmployee as any)?.vacationAccess || {};
                            setSelectedEmployee({
                              ...selectedEmployee,
                              vacationAccess: {
                                ...currentVacationAccess,
                                canApproveVacation: e.target.checked
                              }
                            } as any);
                          }}
                          style={{ margin: 0, width: '16px', height: '16px', cursor: 'pointer' }}
                        />
                        <span>Kan godkjenne ferie/fravær</span>
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={(selectedEmployee as any)?.vacationAccess?.canViewAllVacations || false}
                          onChange={(e) => {
                            const currentVacationAccess = (selectedEmployee as any)?.vacationAccess || {};
                            setSelectedEmployee({
                              ...selectedEmployee,
                              vacationAccess: {
                                ...currentVacationAccess,
                                canViewAllVacations: e.target.checked
                              }
                            } as any);
                          }}
                          style={{ margin: 0, width: '16px', height: '16px', cursor: 'pointer' }}
                        />
                        <span>Kan se alle ferier/fravær</span>
                      </label>
                    </div>
                    <div>
                      <div style={{ marginBottom: '0.75rem' }}>
                        <label style={{ fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-color)', marginBottom: '0.25rem', display: 'block' }}>
                          Feriedager per år
                        </label>
                        <input
                          type="number"
                          value={(selectedEmployee as any)?.vacationAccess?.vacationDaysPerYear || 25}
                          onChange={(e) => {
                            const currentVacationAccess = (selectedEmployee as any)?.vacationAccess || {};
                            setSelectedEmployee({
                              ...selectedEmployee,
                              vacationAccess: {
                                ...currentVacationAccess,
                                vacationDaysPerYear: parseInt(e.target.value) || 25
                              }
                            } as any);
                          }}
                          className="form-input"
                          style={{ width: '100%', padding: '0.5rem' }}
                          min="0"
                          max="50"
                        />
                      </div>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={(selectedEmployee as any)?.vacationAccess?.managerApprovalRequired || false}
                          onChange={(e) => {
                            const currentVacationAccess = (selectedEmployee as any)?.vacationAccess || {};
                            setSelectedEmployee({
                              ...selectedEmployee,
                              vacationAccess: {
                                ...currentVacationAccess,
                                managerApprovalRequired: e.target.checked
                              }
                            } as any);
                          }}
                          style={{ margin: 0, width: '16px', height: '16px', cursor: 'pointer' }}
                        />
                        <span>Leder-godkjenning påkrevd</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Password Management Section */}
            <div style={{ 
              marginTop: '2rem', 
              padding: '1.5rem', 
              background: 'var(--gray-50)', 
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border-color)'
            }}>
              <h3 style={{ 
                fontSize: '1rem', 
                fontWeight: '600', 
                marginBottom: '1rem',
                color: 'var(--text-color)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <Key style={{ width: '18px', height: '18px' }} />
                Passordhåndtering
              </h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {/* Option 1: Set password directly */}
                <div>
                  <label style={{ 
                    display: 'block', 
                    fontSize: '0.875rem', 
                    fontWeight: '500', 
                    color: 'var(--gray-700)',
                    marginBottom: '0.5rem'
                  }}>
                    Sett nytt passord direkte
                  </label>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <input
                      type="password"
                      id="hrNewPasswordInput"
                      placeholder="Skriv inn nytt passord (min. 6 tegn)"
                      className="form-input"
                      style={{ flex: 1 }}
                      minLength={6}
                    />
                    <button
                      onClick={async () => {
                        const passwordInput = document.getElementById('hrNewPasswordInput') as HTMLInputElement;
                        const newPassword = passwordInput?.value;
                        
                        if (!newPassword || newPassword.length < 6) {
                          alert('Passordet må være minst 6 tegn langt');
                          return;
                        }

                        if (!selectedEmployee?.id) {
                          alert('Ingen ansatt valgt');
                          return;
                        }

                        try {
                          const response = await fetch('/api/admin/update-employee-password', {
                            method: 'POST',
                            headers: {
                              'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({
                              employeeId: selectedEmployee.id,
                              newPassword: newPassword,
                            }),
                          });

                          const data = await response.json();

                          if (response.ok) {
                            if (data.message && data.message.includes('link sent')) {
                              alert('✅ Passordoppsett-link sendt på e-post! Ansatt kan bruke linken for å sette passordet.');
                            } else {
                              alert('✅ Passord oppdatert! Ansatt kan nå logge inn med det nye passordet.');
                            }
                            if (passwordInput) passwordInput.value = '';
                          } else {
                            alert(`❌ Feil: ${data.error || 'Kunne ikke oppdatere passord'}`);
                          }
                        } catch (error) {
                          console.error('Error updating password:', error);
                          alert('❌ Feil ved oppdatering av passord');
                        }
                      }}
                      className="btn btn-primary"
                      style={{ whiteSpace: 'nowrap' }}
                    >
                      Sett passord
                    </button>
                  </div>
                  <small style={{ 
                    display: 'block', 
                    color: 'var(--gray-500)', 
                    fontSize: '0.75rem', 
                    marginTop: '0.25rem' 
                  }}>
                    {selectedEmployee?.uid 
                      ? 'Ansatt får en e-post med link for å sette passordet (brukeren har allerede en konto)'
                      : 'Ansatt kan logge inn med dette passordet med en gang'}
                  </small>
                </div>

                {/* Option 2: Send password setup link */}
                <div style={{ 
                  paddingTop: '1rem', 
                  borderTop: '1px solid var(--border-color)' 
                }}>
                  <label style={{ 
                    display: 'block', 
                    fontSize: '0.875rem', 
                    fontWeight: '500', 
                    color: 'var(--gray-700)',
                    marginBottom: '0.5rem'
                  }}>
                    Send link for passordoppsett
                  </label>
                  <button
                    onClick={async () => {
                      if (!selectedEmployee?.id || !selectedEmployee?.email) {
                        alert('Ansatt mangler ID eller e-post');
                        return;
                      }

                      if (!confirm(`Send passordoppsett-link til ${selectedEmployee.email}?`)) {
                        return;
                      }

                      try {
                        const response = await fetch('/api/send-password-setup', {
                          method: 'POST',
                          headers: {
                            'Content-Type': 'application/json',
                          },
                          body: JSON.stringify({
                            employeeId: selectedEmployee.id,
                            employeeEmail: selectedEmployee.email,
                          }),
                        });

                        const data = await response.json();

                        if (response.ok) {
                          alert('✅ Passordoppsett-link sendt på e-post!');
                        } else {
                          alert(`❌ Feil: ${data.error || 'Kunne ikke sende e-post'}`);
                        }
                      } catch (error) {
                        console.error('Error sending password setup email:', error);
                        alert('❌ Feil ved sending av e-post');
                      }
                    }}
                    className="btn btn-secondary"
                    style={{ width: '100%' }}
                  >
                    <Key style={{ width: '16px', height: '16px', marginRight: '0.5rem' }} />
                    Send passordoppsett-link på e-post
                  </button>
                  <small style={{ 
                    display: 'block', 
                    color: 'var(--gray-500)', 
                    fontSize: '0.75rem', 
                    marginTop: '0.25rem' 
                  }}>
                    Ansatt får en e-post med unikt passord som de kan endre selv
                  </small>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button onClick={() => setShowEditModal(false)} className="btn btn-secondary">Avbryt</button>
              <button onClick={handleUpdateEmployee} className="btn btn-primary">Lagre endringer</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Employee Confirmation Modal */}
      {showDeleteEmployeeConfirm && (
        <div className="modal-overlay" onClick={() => setShowDeleteEmployeeConfirm(null)}>
          <div className="modal-content" style={{ maxWidth: '500px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Bekreft sletting</h2>
              <button onClick={() => setShowDeleteEmployeeConfirm(null)} className="modal-close">×</button>
            </div>
            <div className="modal-body">
              <p>Er du sikker på at du vil slette denne ansatten? Denne handlingen kan ikke angres.</p>
              {employees.find(emp => emp.id === showDeleteEmployeeConfirm) && (
                <div style={{ marginTop: '1rem', padding: '1rem', background: 'var(--gray-50)', borderRadius: '0.5rem' }}>
                  <strong>{employees.find(emp => emp.id === showDeleteEmployeeConfirm)?.displayName}</strong>
                  <br />
                  <span style={{ color: 'var(--gray-600)', fontSize: '0.875rem' }}>
                    {employees.find(emp => emp.id === showDeleteEmployeeConfirm)?.email}
                  </span>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button onClick={() => setShowDeleteEmployeeConfirm(null)} className="btn btn-secondary">Avbryt</button>
              <button onClick={confirmDeleteEmployee} className="btn btn-danger" disabled={deletingEmployeeId === showDeleteEmployeeConfirm}>
                {deletingEmployeeId === showDeleteEmployeeConfirm ? (
                  <>
                    <Loader2 size={16} className="animate-spin" style={{ marginRight: '0.5rem' }} />
                    Sletter...
                  </>
                ) : (
                  'Slett ansatt'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}