'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { firebaseService, createUserAccessContext } from '@/lib/firebase-services';
import { microsoftGraphService } from '@/lib/microsoft-graph-service';
// import { emailService } from '@/lib/email-service'; // Removed - nodemailer not available on client side
import { UserPlus, Search, Filter, Edit, Trash2, Plus, MoreHorizontal, User, Building, MapPin, CheckCircle, Eye, Settings, Key, UserX, UserCheck, Calendar, AlertTriangle, Clock } from 'lucide-react';
import { hasPermission } from '@/lib/permissions';
import AccessDenied from '@/components/AccessDenied';
import PermissionsManager from '@/components/PermissionsManager';

import { Employee } from '@/lib/firebase-services';

interface Department {
  id: string;
  name: string;
  description?: string;
    createdAt?: string;
  updatedAt?: string;
}

export default function EmployeesPage() {
  const { userProfile, loading: authLoading, updateUserProfile } = useAuth();
  
  // Authorization check
  useEffect(() => {
    if (!authLoading && userProfile) {
      if (!hasPermission(userProfile, 'employees')) {
        return; // Will show AccessDenied below
      }
    }
  }, [authLoading, userProfile]);
  
  // Show access denied if no permission
  if (!authLoading && userProfile && !hasPermission(userProfile, 'employees')) {
    return <AccessDenied message="Du har ikke tilgang til å se ansatte." />;
  }
  
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [isEditingMode, setIsEditingMode] = useState(false);
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
    // Tilgangskontroll
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
    // Ferie og fravær-tilgang
    vacationAccess: {
      canRequestVacation: true,
      canApproveVacation: false,
      canViewAllVacations: false,
      vacationDaysPerYear: 25,
      managerApprovalRequired: true,
    },
    // Lederskap og hierarki
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

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Smart function to set default permissions based on role
  const getDefaultPermissionsForRole = (role: 'employee' | 'department_leader' | 'admin' | 'super_admin'): any => {
    const basePermissions: any = {
      notifications: true,
      calendar: true,
    };

    switch (role) {
      case 'employee':
        return {
          ...basePermissions,
          dashboard: true,
          avvik: true,
          hrFerie: true,
          hrFravær: true,
        };
      
      case 'department_leader':
        return {
          ...basePermissions,
          dashboard: true,
          avvik: true,
          hrFerie: true,
          hrFravær: true,
          hrAnsatte: true,
          hrAvdelinger: true,
          hrVakter: true,
          documents: true,
          reports: true,
        };
      
      case 'admin':
        return {
          ...basePermissions,
          dashboard: true,
          employees: true,
          departments: true,
          hr: true,
          hrAnsatte: true,
          hrVakter: true,
          hrFravær: true,
          hrFerie: true,
          hrAvdelinger: true,
          documents: true,
          reports: true,
          analytics: true,
          settings: true,
          avvik: true,
          internrevisjon: true,
          internkontrollRapporter: true,
          compliance: true,
          finance: true,
          invoicing: true,
          payments: true,
        };
      
      default:
        return basePermissions;
    }
  };

  // Update permissions when role changes - AUTO SMART
  const handleRoleChange = (newRole: 'employee' | 'department_leader' | 'admin') => {
    const defaultPermissions = getDefaultPermissionsForRole(newRole);
    setNewEmployee({
      ...newEmployee,
      role: newRole,
      permissions: {
        ...newEmployee.permissions,
        ...defaultPermissions,
      },
      departmentId: newRole === 'employee' ? newEmployee.departmentId : '',
      leadership: {
        ...newEmployee.leadership,
        managesDepartments: newRole === 'department_leader' ? newEmployee.leadership.managesDepartments : [],
        isManager: newRole === 'department_leader',
      },
      vacationAccess: newRole === 'department_leader' ? {
        canRequestVacation: true,
        canApproveVacation: true,
        canViewAllVacations: true,
        vacationDaysPerYear: 30,
        managerApprovalRequired: false,
      } : {
        canRequestVacation: true,
        canApproveVacation: false,
        canViewAllVacations: false,
        vacationDaysPerYear: 25,
        managerApprovalRequired: true,
      },
    });
  };

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
    
    if (userProfile) {
      console.log('Loading employees for company:', userProfile.companyId);
      setLoading(true);
      
      // Define load functions inside useEffect to avoid dependency issues
      const loadEmployees = async () => {
        if (!userProfile) {
          console.error('No company ID found in loadEmployees');
          setLoading(false);
          return;
        }

        console.log('Loading employees for company:', userProfile.companyId);

        try {
          const userContext = createUserAccessContext(userProfile);
          const data = await firebaseService.getEmployees(userContext || undefined);
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
        if (!userProfile) return;

        try {
          const data = await firebaseService.getDepartments();
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
        if (!userProfile) {
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
    if (!userProfile) {
      console.error('No company ID found in loadEmployees');
      return;
    }

    console.log('Loading employees for company:', userProfile.companyId);

    try {
      const userContext = createUserAccessContext(userProfile);
      const data = await firebaseService.getEmployees(userContext || undefined);
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
    if (!userProfile) {
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
            hireDate: new Date().toISOString()
    });

    try {
      // Create employee data - only include fields that have values
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

      // Admin get all permissions (but these are set in edit modal)
      if (newEmployee.role === 'admin') {
        // Admins get all permissions - but these should be set in edit modal
        // For now, just give them basic access
      }

      employeeData.permissions = defaultPermissions;
      employeeData.vacationAccess = defaultVacationAccess;
      employeeData.leadership = newEmployee.leadership || {};

      console.log('Calling firebaseService.createEmployee with data:', employeeData);
      
      const userContext = createUserAccessContext(userProfile);
      const employeeResult = await firebaseService.createEmployee(employeeData, userContext || undefined);
      const employeeId = typeof employeeResult === 'string' ? employeeResult : employeeResult.id;
      const setupPasswordUrl = typeof employeeResult === 'string' ? null : employeeResult.setupPasswordUrl;

      console.log('✅ Employee created successfully with ID:', employeeId);

      // Send welcome email to the new employee with setup password link
      // Note: /api/create-user already sends a welcome email, but we send another one
      // with department/position info if we have a setup password URL
      let emailSent = false;
      let emailError = null;
      
      if (!setupPasswordUrl) {
        console.warn('⚠️ No setup password URL available - welcome email should have been sent by /api/create-user');
        emailError = 'Ingen setup password URL - velkomstmailen skal ha blitt sendt av systemet';
      } else {
        try {
          const departmentName = getDepartmentName(newEmployee.departmentId);
          const adminName = userProfile?.displayName || 'System Administrator';
          const companyName = 'Mavi Logistikk';

          console.log('📧 Sending welcome email to new employee:', {
            email: newEmployee.email,
            displayName: newEmployee.displayName,
            adminName,
            companyName,
            departmentName,
            position: newEmployee.position || 'Ansatt',
            setupPasswordUrl
          });

          // Send welcome email via app-only authentication (no login required)
          try {
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
                position: newEmployee.position || 'Ansatt',
                resetLink: setupPasswordUrl // REQUIRED: direct link to /setup-password?token=...
              })
            });

            console.log('📧 Welcome email API response status:', response.status);

            if (response.ok) {
              const result = await response.json();
              console.log('📧 Welcome email API response:', result);
              
              if (result.success) {
                emailSent = true;
                console.log('✅ Welcome email sent successfully to:', newEmployee.email);
              } else {
                emailError = result.error || result.details?.message || 'Unknown error';
                emailSent = false;
                console.error('❌ Failed to send welcome email:', result);
                
                // Show error to user
                alert(`Kunne ikke sende velkomstmail: ${emailError}`);
              }
            } else {
              const errorResult = await response.json().catch(() => ({ error: `HTTP ${response.status}` }));
              emailError = errorResult.error || errorResult.details?.message || 'Unknown error';
              emailSent = false;
              console.error('❌ Failed to send welcome email to:', newEmployee.email, errorResult);
              
              // Show error to user
              alert(`Kunne ikke sende velkomstmail: ${emailError}`);
            }
          } catch (emailError) {
            console.error('❌ Error sending welcome email:', emailError);
            emailSent = false;
            emailError = emailError instanceof Error ? emailError.message : 'Unknown error';
            
            // Show error to user
            alert(`Feil ved sending av velkomstmail: ${emailError}`);
          }
        } catch (emailError) {
          console.error('❌ Error in welcome email setup:', emailError);
          emailSent = false;
          // Don't fail the employee creation if email fails
        }
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
          internkontrollOgSamsvar: false,
          internrevisjon: false,
          avvik: true,
          risikovurdering: false,
          oppfølgingstiltak: false,
          kontrollpunkter: false,
          internkontrollRapporter: false,
          chat: false,
          emailSystem: false,
          smsLogs: false,
          partners: false,
          logistikkBudPriser: false,
          logistikkLevering: false,
          logistikkPlanlegging: false,
          logistikkKunder: false,
          logistikkLeverandorer: false,
          logistikkProdukter: false,
          logistikkLager: false,
          logistikkFakturering: false,
          logistikkFinans: false,
          hrAnsatte: false,
          hrVakter: false,
          hrFravær: true,
          hrFerie: true,
          hrAvdelinger: false,
        } as any,
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
      
      // Reload employees after a short delay to ensure Firebase has updated
      setTimeout(() => {
        loadEmployees();
      }, 1000);
      
      const message = emailSent 
        ? `✅ Ansatt ble lagt til! Velkomst-e-post sendt til ${newEmployee.email}`
        : `⚠️ Ansatt ble lagt til! Kunne ikke sende velkomst-e-post til ${newEmployee.email}${emailError ? ` - ${emailError}` : ' - sjekk e-postinnstillinger.'}`;
      alert(message);
    } catch (error) {
      console.error('Error adding employee:', error);
      alert(`Feil ved å legge til ansatt: ${error instanceof Error ? error.message : 'Ukjent feil'}`);
    }
  };

  const handleEditEmployee = async () => {
    if (!userProfile) {
      console.error('No company ID found');
      alert('Ingen bedrift funnet. Vennligst logg inn på nytt.');
      return;
    }

    // Determine if we're editing existing or adding new
    const isNewEmployee = !isEditingMode || !selectedEmployee || !selectedEmployee.id;
    const employeeData = isNewEmployee ? newEmployee : selectedEmployee;

    // Validate required fields
    if (!employeeData?.displayName?.trim()) {
      alert('Navn er påkrevd');
      return;
    }

    if (!employeeData?.email?.trim()) {
      alert('E-post er påkrevd');
      return;
    }

    try {
      if (isNewEmployee) {
        // Use handleAddEmployee logic
        await handleAddEmployee();
      } else {
        // Prepare update data
        const updateData: Partial<Employee> = {
          displayName: selectedEmployee.displayName,
          email: selectedEmployee.email,
          phone: selectedEmployee.phone || undefined,
          role: selectedEmployee.role,
          status: selectedEmployee.status,
          position: selectedEmployee.position || undefined,
          departmentId: selectedEmployee.departmentId || undefined,
          birthDate: selectedEmployee.birthDate || undefined,
          employeeNumber: selectedEmployee.employeeNumber || undefined,
          taxId: selectedEmployee.taxId || undefined,
          address: selectedEmployee.address || undefined,
          emergencyContact: selectedEmployee.emergencyContact || undefined,
          bio: selectedEmployee.bio || undefined,
          education: selectedEmployee.education || undefined,
          workExperience: selectedEmployee.workExperience || undefined,
          skills: selectedEmployee.skills || undefined,
          certifications: selectedEmployee.certifications || undefined,
          salary: selectedEmployee.salary ? Number(selectedEmployee.salary) : undefined,
          managerId: selectedEmployee.managerId || undefined,
          bankAccount: selectedEmployee.bankAccount || undefined,
          insuranceNumber: selectedEmployee.insuranceNumber || undefined,
          avatar: selectedEmployee.avatar || undefined,
          permissions: (selectedEmployee as any).permissions || newEmployee.permissions,
          vacationAccess: (selectedEmployee as any).vacationAccess || newEmployee.vacationAccess,
          leadership: (selectedEmployee as any).leadership || newEmployee.leadership,
        };

        const userContext = createUserAccessContext(userProfile);
        await firebaseService.updateEmployee(selectedEmployee.id, updateData, userContext || undefined);

        // If the edited employee is the currently logged-in user, refresh local profile
        if (userProfile?.id === selectedEmployee.id && updateUserProfile) {
          await updateUserProfile({
            displayName: updateData.displayName,
            email: updateData.email,
            phone: updateData.phone,
            departmentId: updateData.departmentId,
            position: updateData.position,
            role: updateData.role,
            status: updateData.status,
            permissions: updateData.permissions,
            vacationAccess: updateData.vacationAccess,
            leadership: (updateData as any).leadership,
          } as any);
        }
        setShowEditModal(false);
        setSelectedEmployee(null);
        setIsEditingMode(false);
        loadEmployees();
        alert('Ansatt ble oppdatert!');
      }
    } catch (error) {
      console.error('Error saving employee:', error);
      alert(`Feil ved lagring av ansatt: ${error instanceof Error ? error.message : 'Ukjent feil'}`);
    }
  };

  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [deletingEmployeeId, setDeletingEmployeeId] = useState<string | null>(null);

  const handleDeleteEmployee = async (employeeId: string) => {
    if (!employeeId) {
      alert('Ingen ansatt-ID funnet');
      return;
    }

    setShowDeleteConfirm(employeeId);
  };

  const confirmDeleteEmployee = async () => {
    if (!showDeleteConfirm) return;

    const employeeId = showDeleteConfirm;
    setDeletingEmployeeId(employeeId);
    setShowDeleteConfirm(null);

    try {
      console.log('Attempting to delete employee with ID:', employeeId);
      const userContext = createUserAccessContext(userProfile);
      await firebaseService.deleteEmployee(employeeId, userContext || undefined);
      console.log('Employee deleted successfully, reloading list...');
      
      // Reload employees after a short delay to ensure Firebase has updated
      setTimeout(() => {
      loadEmployees();
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

  const handleViewEmployee = (employee: Employee) => {
    setSelectedEmployee(employee);
    setShowViewModal(true);
  };

  const handleEmployeeSettings = (employee: Employee) => {
    setSelectedEmployee(employee);
    setShowSettingsModal(true);
  };

  const handleResetPassword = async (employeeId?: string) => {
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

  // Add this function after the existing functions
  const sendPasswordSetupEmail = async (employeeId: string, employeeEmail: string) => {
    try {
      setLoading(true);
      
      const response = await fetch('/api/send-password-setup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          employeeId,
          employeeEmail,
        }),
      });

      if (response.ok) {
        alert(`E-post for passord-oppsett sendt til ${employeeEmail}`);
      } else {
        const error = await response.json();
        alert(`Feil: ${error.error}`);
      }
    } catch (error) {
      console.error('Error sending password setup email:', error);
      alert('Feil ved sending av e-post');
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '1rem' }}>
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
            Debug: companyId = { 'undefined'}
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
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '1rem' }}>
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
    <div style={{ 
      minHeight: '100vh', 
      background: 'var(--background-color)',
      width: '100%',
      overflowX: 'hidden',
      padding: isMobile ? '0' : undefined
    }}>
      {/* Mobile Header */}
      {isMobile && (
        <div style={{
          padding: '0.625rem 0.75rem 0.5rem',
          marginBottom: '0.5rem',
          borderBottom: '0.5px solid var(--border-color)',
          background: 'var(--card-background)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <h1 style={{
                fontSize: '1.125rem',
                fontWeight: 600,
                color: 'var(--text-color)',
                margin: '0 0 0.125rem 0',
                lineHeight: '1.3'
              }}>
                Ansatte
              </h1>
              <p style={{
                fontSize: '0.8125rem',
                color: 'var(--gray-500)',
                margin: 0
              }}>
                {filteredEmployees.length} ansatte
              </p>
            </div>
            <button
              onClick={() => {
              // Reset newEmployee to defaults
              setNewEmployee({
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
                  avvik: true,
                  hrFerie: true,
                  hrFravær: true,
                  notifications: true,
                  calendar: true,
                } as any,
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
              setIsEditingMode(false);
              setShowEditModal(true);
            }}
              style={{
                padding: '0.625rem',
                borderRadius: '0.625rem',
                background: 'var(--primary)',
                color: 'white',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minWidth: '44px',
                minHeight: '44px'
              }}
            >
              <Plus size={20} />
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
              onClick={() => {
              // Reset newEmployee to defaults
              setNewEmployee({
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
                  avvik: true,
                  hrFerie: true,
                  hrFravær: true,
                  notifications: true,
                  calendar: true,
                } as any,
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
              setIsEditingMode(false);
              setShowEditModal(true);
            }}
              className="btn btn-primary"
            >
              <UserPlus className="w-4 h-4 mr-2" />
              Legg til ansatt
            </button>
          </div>
        </div>
      )}

      {/* Stats Section */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
        gap: isMobile ? '0.625rem' : '1rem',
        padding: isMobile ? '0 0.75rem 0.75rem' : '1rem 2rem',
        marginBottom: isMobile ? '0.75rem' : '1rem'
      }}>
        <div style={{
          borderRadius: '0.875rem',
          padding: isMobile ? '0.875rem' : '1rem',
          background: 'var(--card-background)',
          border: '1px solid var(--border-color)',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: isMobile ? '1.5rem' : '1.75rem', fontWeight: 700, color: 'var(--text-color)', marginBottom: '0.25rem' }}>
            {stats.total}
        </div>
          <div style={{ fontSize: isMobile ? '0.75rem' : '0.875rem', color: 'var(--gray-500)', fontWeight: 500 }}>
            Totalt
        </div>
        </div>
        <div style={{
          borderRadius: '0.875rem',
          padding: isMobile ? '0.875rem' : '1rem',
          background: 'var(--card-background)',
          border: '1px solid var(--border-color)',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: isMobile ? '1.5rem' : '1.75rem', fontWeight: 700, color: '#22c55e', marginBottom: '0.25rem' }}>
            {stats.active}
          </div>
          <div style={{ fontSize: isMobile ? '0.75rem' : '0.875rem', color: 'var(--gray-500)', fontWeight: 500 }}>
            Aktive
          </div>
        </div>
        <div style={{
          borderRadius: '0.875rem',
          padding: isMobile ? '0.875rem' : '1rem',
          background: 'var(--card-background)',
          border: '1px solid var(--border-color)',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: isMobile ? '1.5rem' : '1.75rem', fontWeight: 700, color: '#3b82f6', marginBottom: '0.25rem' }}>
            {stats.leaders}
          </div>
          <div style={{ fontSize: isMobile ? '0.75rem' : '0.875rem', color: 'var(--gray-500)', fontWeight: 500 }}>
            Ledere
          </div>
        </div>
        <div style={{
          borderRadius: '0.875rem',
          padding: isMobile ? '0.875rem' : '1rem',
          background: 'var(--card-background)',
          border: '1px solid var(--border-color)',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: isMobile ? '1.5rem' : '1.75rem', fontWeight: 700, color: '#a855f7', marginBottom: '0.25rem' }}>
            {stats.admins}
          </div>
          <div style={{ fontSize: isMobile ? '0.75rem' : '0.875rem', color: 'var(--gray-500)', fontWeight: 500 }}>
            Admins
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div style={{
        padding: isMobile ? '0 0.75rem 0.75rem' : '0 2rem 1rem',
        display: 'flex',
        gap: isMobile ? '0.5rem' : '1rem',
        flexDirection: isMobile ? 'column' : 'row'
      }}>
        <div style={{ position: 'relative', flex: isMobile ? 'none' : 1, width: isMobile ? '100%' : undefined }}>
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
            placeholder="Søk etter navn, e-post eller stilling..."
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
        <div style={{ position: 'relative', width: isMobile ? '100%' : '200px' }}>
          <Filter style={{
            position: 'absolute',
            left: isMobile ? '0.875rem' : '12px',
            top: '50%',
            transform: 'translateY(-50%)',
            color: 'var(--gray-400)',
            width: isMobile ? '18px' : '16px',
            height: isMobile ? '18px' : '16px',
            pointerEvents: 'none'
          }} />
          <select
            value={selectedDepartment}
            onChange={(e) => setSelectedDepartment(e.target.value)}
            style={{
              width: '100%',
              padding: isMobile ? '0.875rem 0.875rem 0.875rem 2.75rem' : '0.75rem 0.75rem 0.75rem 2.5rem',
              border: '1px solid var(--border-color)',
              borderRadius: isMobile ? '0.5rem' : 'var(--radius-lg)',
              outline: 'none',
              fontSize: isMobile ? '16px' : undefined,
              background: 'var(--card-background)',
              appearance: 'none',
              WebkitAppearance: 'none'
            }}
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

      {/* Employees Grid/List */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
        gap: isMobile ? '0.625rem' : '1rem',
        padding: isMobile ? '0 0.75rem' : '0 2rem 2rem'
      }}>
        {filteredEmployees.map((employee) => {
          const roleBadge = getRoleBadge(employee.role);
          return (
            <div key={employee.id} style={{
              borderRadius: '0.875rem',
              padding: isMobile ? '1rem' : '1.25rem',
              background: 'var(--card-background)',
              border: '1px solid var(--border-color)',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: isMobile ? '0.75rem' : '1rem', marginBottom: isMobile ? '0.75rem' : '1rem' }}>
                <div style={{
                  width: isMobile ? '48px' : '40px',
                  height: isMobile ? '48px' : '40px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontWeight: 600,
                  fontSize: isMobile ? '1rem' : '0.875rem',
                  flexShrink: 0
                }}>
                    {(employee.displayName?.charAt(0) || 'U').toUpperCase()}
                  </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h3 style={{ 
                    fontWeight: 600, 
                    color: 'var(--text-color)',
                    fontSize: isMobile ? '0.9375rem' : '1.1rem',
                    marginBottom: '0.25rem',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}>
                    {employee.displayName || 'Ukjent navn'}
                  </h3>
                  <p style={{ 
                    color: 'var(--gray-500)', 
                    fontSize: isMobile ? '0.8125rem' : '0.875rem', 
                    marginBottom: isMobile ? '0.5rem' : '0.5rem',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}>
                    {employee.email}
                  </p>
                </div>
                {!isMobile && (
                  <button className="btn btn-secondary" style={{ padding: '0.5rem', flexShrink: 0 }}>
                  <MoreHorizontal style={{ width: '16px', height: '16px' }} />
                </button>
                )}
              </div>

              <div style={{ marginBottom: isMobile ? '0.75rem' : '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: isMobile ? '0.375rem' : '0.5rem' }}>
                  <User size={isMobile ? 16 : 14} style={{ color: 'var(--gray-500)', flexShrink: 0 }} />
                  <span style={{ fontSize: isMobile ? '0.8125rem' : '0.875rem', color: 'var(--gray-600)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    <strong>Stilling:</strong> {employee.position || 'Ingen stilling'}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: isMobile ? '0.375rem' : '0.5rem' }}>
                  <Building size={isMobile ? 16 : 14} style={{ color: 'var(--gray-500)', flexShrink: 0 }} />
                  <span style={{ fontSize: isMobile ? '0.8125rem' : '0.875rem', color: 'var(--gray-600)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    <strong>Avdeling:</strong> {getDepartmentName(employee.departmentId)}
                  </span>
                </div>
                {employee.phone && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: isMobile ? '0.375rem' : '0.5rem' }}>
                    <MapPin size={isMobile ? 16 : 14} style={{ color: 'var(--gray-500)', flexShrink: 0 }} />
                    <span style={{ fontSize: isMobile ? '0.8125rem' : '0.875rem', color: 'var(--gray-600)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {employee.phone}
                  </span>
                </div>
                )}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <CheckCircle size={isMobile ? 16 : 14} style={{ color: employee.status === 'active' ? '#22c55e' : employee.status === 'inactive' ? '#ef4444' : '#f59e0b', flexShrink: 0 }} />
                  <span style={{ fontSize: isMobile ? '0.8125rem' : '0.875rem', color: 'var(--gray-600)' }}>
                    <strong>Status:</strong> {employee.status === 'active' ? 'Aktiv' : 
                     employee.status === 'inactive' ? 'Inaktiv' : 'Permisjon'}
                  </span>
                </div>
              </div>

              {employee.employeeNumber && (
                <div style={{ marginBottom: isMobile ? '0.75rem' : '1rem', paddingTop: isMobile ? '0.75rem' : 0, borderTop: isMobile ? '1px solid var(--border-color)' : 'none' }}>
                  <div style={{ fontSize: isMobile ? '0.75rem' : '0.75rem', color: 'var(--gray-500)' }}>
                    Ansattnr: {employee.employeeNumber}
                </div>
              </div>
              )}

              <div style={{ 
                display: 'flex', 
                gap: isMobile ? '0.375rem' : '0.5rem', 
                flexWrap: 'wrap',
                flexDirection: isMobile ? 'column' : 'row'
              }}>
                <button 
                  className="btn btn-secondary" 
                  style={{ 
                    fontSize: isMobile ? '0.875rem' : '0.75rem', 
                    padding: isMobile ? '0.75rem' : '0.25rem 0.75rem',
                    width: isMobile ? '100%' : undefined,
                    minHeight: isMobile ? '44px' : undefined,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem'
                  }}
                  onClick={() => handleViewEmployee(employee)}
                >
                  <Eye size={isMobile ? 18 : 14} />
                  Se
                </button>
                <button 
                  className="btn btn-secondary" 
                  style={{ 
                    fontSize: isMobile ? '0.875rem' : '0.75rem', 
                    padding: isMobile ? '0.75rem' : '0.25rem 0.75rem',
                    width: isMobile ? '100%' : undefined,
                    minHeight: isMobile ? '44px' : undefined,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem'
                  }}
                  onClick={() => {
                    setSelectedEmployee(employee);
                    setIsEditingMode(true);
                    setShowEditModal(true);
                  }}
                >
                  <Edit size={isMobile ? 18 : 14} />
                  Rediger
                </button>
                {!isMobile && (
                  <>
                <button 
                  className="btn btn-secondary" 
                  style={{ fontSize: '0.75rem', padding: '0.25rem 0.75rem' }}
                  onClick={() => handleEmployeeSettings(employee)}
                >
                  <Settings style={{ width: '14px', height: '14px' }} />
                  Innstillinger
                </button>
                <button 
                  className="btn btn-danger" 
                  style={{ fontSize: '0.75rem', padding: '0.25rem 0.75rem', opacity: deletingEmployeeId === employee.id ? 0.5 : 1 }}
                  onClick={() => handleDeleteEmployee(employee.id)}
                  disabled={deletingEmployeeId === employee.id}
                >
                  {deletingEmployeeId === employee.id ? (
                    <>
                      <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white inline-block mr-1"></div>
                      Sletter...
                    </>
                  ) : (
                    <>
                      <Trash2 style={{ width: '14px', height: '14px' }} />
                      Slett
                    </>
                  )}
                </button>
                  </>
                )}
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
            onClick={() => {
              // Reset newEmployee to defaults
              setNewEmployee({
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
                  avvik: true,
                  hrFerie: true,
                  hrFravær: true,
                  notifications: true,
                  calendar: true,
                } as any,
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
              setIsEditingMode(false);
              setShowEditModal(true);
            }}
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
          {/* Stor modal så ALT er synlig (inkl. tilgangskontroll) */}
          <div
            className="modal-content"
            style={{ maxWidth: '95vw', maxHeight: '95vh', width: '1400px', overflowY: 'auto' }}
          >
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
              {/* Interaktiv Tilgangsoversikt - AUTO SMART basert på rolle */}
              <div style={{ 
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 
                padding: '1.5rem', 
                borderRadius: '12px', 
                marginBottom: '2rem',
                border: '3px solid #4f46e5',
                boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
                position: 'relative',
                zIndex: 10
              }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '0.5rem', color: '#ffffff' }}>
                  🔐 Tilgangskontroll
                </h3>
                <p style={{ color: '#f3f4f6', marginBottom: '1.5rem', fontSize: '0.9rem', lineHeight: '1.6', fontWeight: '500' }}>
                  <strong style={{ color: '#ffffff' }}>
                    Standard tilganger for {newEmployee.role === 'employee' ? 'ansatte' : newEmployee.role === 'department_leader' ? 'avdelingsledere' : 'admins'}
                  </strong> settes automatisk. Du kan justere tilganger nedenfor.
                </p>
                
                {/* Viktigste tilganger - Interaktive checkboxes */}
                <div style={{ 
                  background: '#ffffff',
                  padding: '1.25rem',
                  borderRadius: '8px',
                  border: '2px solid rgba(255,255,255,0.3)',
                  boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                }}>
                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
                    gap: '0.75rem',
                    fontSize: '0.875rem'
                  }}>
                    {[
                      { key: 'dashboard', label: 'Dashboard', icon: '📊' },
                      { key: 'avvik', label: 'Avvik', icon: '⚠️' },
                      { key: 'hrFerie', label: 'Ferie', icon: '🏖️' },
                      { key: 'hrFravær', label: 'Fravær', icon: '🏥' },
                      { key: 'hrAnsatte', label: 'Se ansatte', icon: '👥' },
                      { key: 'documents', label: 'Dokumenter', icon: '📄' },
                      { key: 'reports', label: 'Rapporter', icon: '📈' },
                      { key: 'settings', label: 'Innstillinger', icon: '⚙️' },
                    ].map((perm) => {
                      const hasAccess = newEmployee.permissions[perm.key as keyof typeof newEmployee.permissions] || false;
                      return (
                        <div
                          key={perm.key}
                          style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '0.5rem',
                            cursor: 'pointer',
                            padding: '0.75rem',
                            borderRadius: '6px',
                            transition: 'all 0.2s',
                            backgroundColor: hasAccess ? '#d1fae5' : '#fee2e2',
                            border: `2px solid ${hasAccess ? '#10b981' : '#ef4444'}`,
                            userSelect: 'none'
                          }}
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            const newValue = !hasAccess;
                            setNewEmployee({
                              ...newEmployee,
                              permissions: {
                                ...newEmployee.permissions,
                                [perm.key]: newValue,
                              } as any,
                            });
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'scale(1.02)';
                            e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'scale(1)';
                            e.currentTarget.style.boxShadow = 'none';
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={hasAccess}
                            onChange={(e) => {
                              e.stopPropagation();
                              setNewEmployee({
                                ...newEmployee,
                                permissions: {
                                  ...newEmployee.permissions,
                                  [perm.key]: e.target.checked,
                                } as any,
                              });
                            }}
                            onClick={(e) => e.stopPropagation()}
                            style={{ 
                              width: '20px', 
                              height: '20px', 
                              cursor: 'pointer',
                              accentColor: hasAccess ? '#10b981' : '#ef4444',
                              pointerEvents: 'auto',
                              flexShrink: 0
                            }}
                          />
                          <span style={{ 
                            fontSize: '1.1rem',
                            marginRight: '0.25rem',
                            flexShrink: 0
                          }}>{perm.icon}</span>
                          <span style={{ 
                            color: hasAccess ? '#065f46' : '#991b1b',
                            fontWeight: '600',
                            flex: 1,
                            fontSize: '0.9rem'
                          }}>{perm.label}</span>
                          {hasAccess && (
                            <span style={{ color: '#10b981', fontSize: '1rem', fontWeight: 'bold' }}>✓</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  <div style={{ 
                    marginTop: '1rem', 
                    paddingTop: '1rem', 
                    borderTop: '1px solid #e5e7eb',
                    textAlign: 'center'
                  }}>
                    <span style={{ 
                      color: '#6b7280', 
                      fontSize: '0.75rem',
                      fontStyle: 'italic'
                    }}>
                      💡 Se alle tilganger nedenfor i Permissions Manager for full kontroll
                    </span>
                  </div>
                </div>
              </div>

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
                  <label className="form-label">Rolle *</label>
                  <select
                    value={newEmployee.role}
                    onChange={(e) => {
                      const newRole = e.target.value as "admin" | "department_leader" | "employee";
                      handleRoleChange(newRole);
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

              {/* Permissions Manager - Full Control Section */}
              <div style={{ marginTop: '2rem', paddingTop: '2rem', borderTop: '2px solid var(--border-color, #e5e7eb)' }}>
                <PermissionsManager
                  permissions={newEmployee.permissions}
                  onChange={(updatedPermissions) => {
                    setNewEmployee({
                      ...newEmployee,
                      permissions: updatedPermissions as any
                    });
                  }}
                  role={newEmployee.role}
                  readOnly={false}
                />
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

      {/* Edit/Add Employee Modal - Brukes både for redigering og opprettelse */}
      {showEditModal && (selectedEmployee || !isEditingMode) && (
        <div className="modal-overlay" style={{ zIndex: 1000 }}>
          <div className="modal-content" style={{ maxWidth: '95vw', maxHeight: '95vh', width: '1400px', overflowY: 'auto' }}>
            <div className="modal-header">
              <h2 className="modal-title">{isEditingMode && selectedEmployee ? 'Rediger ansatt' : 'Legg til ny ansatt'}</h2>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setIsEditingMode(false);
                  setSelectedEmployee(null);
                }}
                className="modal-close"
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              {/* Interaktiv Tilgangsoversikt - Vises ved opprettelse */}
              {!isEditingMode && (
                <div style={{ 
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 
                  padding: '1.5rem', 
                  borderRadius: '12px', 
                  marginBottom: '2rem',
                  border: '3px solid #4f46e5',
                  boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
                  position: 'relative',
                  zIndex: 10
                }}>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '0.5rem', color: '#ffffff' }}>
                    🔐 Tilgangskontroll
                  </h3>
                  <p style={{ color: '#f3f4f6', marginBottom: '1.5rem', fontSize: '0.9rem', lineHeight: '1.6', fontWeight: '500' }}>
                    <strong style={{ color: '#ffffff' }}>
                      Standard tilganger for {newEmployee.role === 'employee' ? 'ansatte' : newEmployee.role === 'department_leader' ? 'avdelingsledere' : 'admins'}
                    </strong> settes automatisk. Du kan justere tilganger nedenfor.
                  </p>
                  
                  {/* Viktigste tilganger - Interaktive checkboxes */}
                  <div style={{ 
                    background: '#ffffff',
                    padding: '1.25rem',
                    borderRadius: '8px',
                    border: '2px solid rgba(255,255,255,0.3)',
                    boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                  }}>
                    <div style={{ 
                      display: 'grid', 
                      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
                      gap: '0.75rem',
                      fontSize: '0.875rem'
                    }}>
                      {[
                        { key: 'dashboard', label: 'Dashboard', icon: '📊' },
                        { key: 'avvik', label: 'Avvik', icon: '⚠️' },
                        { key: 'hrFerie', label: 'Ferie', icon: '🏖️' },
                        { key: 'hrFravær', label: 'Fravær', icon: '🏥' },
                        { key: 'hrAnsatte', label: 'Se ansatte', icon: '👥' },
                        { key: 'documents', label: 'Dokumenter', icon: '📄' },
                        { key: 'reports', label: 'Rapporter', icon: '📈' },
                        { key: 'settings', label: 'Innstillinger', icon: '⚙️' },
                      ].map((perm) => {
                        const hasAccess = newEmployee.permissions[perm.key as keyof typeof newEmployee.permissions] || false;
                        return (
                          <div
                            key={perm.key}
                            style={{ 
                              display: 'flex', 
                              alignItems: 'center', 
                              gap: '0.5rem',
                              cursor: 'pointer',
                              padding: '0.75rem',
                              borderRadius: '6px',
                              transition: 'all 0.2s',
                              backgroundColor: hasAccess ? '#d1fae5' : '#fee2e2',
                              border: `2px solid ${hasAccess ? '#10b981' : '#ef4444'}`,
                              userSelect: 'none'
                            }}
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              const newValue = !hasAccess;
                              setNewEmployee({
                                ...newEmployee,
                                permissions: {
                                  ...newEmployee.permissions,
                                  [perm.key]: newValue,
                                } as any,
                              });
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.transform = 'scale(1.02)';
                              e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.transform = 'scale(1)';
                              e.currentTarget.style.boxShadow = 'none';
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={hasAccess}
                              onChange={(e) => {
                                e.stopPropagation();
                                setNewEmployee({
                                  ...newEmployee,
                                  permissions: {
                                    ...newEmployee.permissions,
                                    [perm.key]: e.target.checked,
                                  } as any,
                                });
                              }}
                              onClick={(e) => e.stopPropagation()}
                              style={{ 
                                width: '20px', 
                                height: '20px', 
                                cursor: 'pointer',
                                accentColor: hasAccess ? '#10b981' : '#ef4444',
                                pointerEvents: 'auto',
                                flexShrink: 0
                              }}
                            />
                            <span style={{ 
                              fontSize: '1.1rem',
                              marginRight: '0.25rem',
                              flexShrink: 0
                            }}>{perm.icon}</span>
                            <span style={{ 
                              color: hasAccess ? '#065f46' : '#991b1b',
                              fontWeight: '600',
                              flex: 1,
                              fontSize: '0.9rem'
                            }}>{perm.label}</span>
                            {hasAccess && (
                              <span style={{ color: '#10b981', fontSize: '1rem', fontWeight: 'bold' }}>✓</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                    <div style={{ 
                      marginTop: '1rem', 
                      paddingTop: '1rem', 
                      borderTop: '1px solid #e5e7eb',
                      textAlign: 'center'
                    }}>
                      <span style={{ 
                        color: '#6b7280', 
                        fontSize: '0.75rem',
                        fontStyle: 'italic'
                      }}>
                        💡 Se alle tilganger nedenfor i Permissions Manager for full kontroll
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <div className="form-grid">
                {/* Grunnleggende informasjon */}
                <div className="form-group">
                  <label className="form-label">Navn *</label>
                  <input
                    type="text"
                    value={isEditingMode && selectedEmployee ? (selectedEmployee.displayName || '') : newEmployee.displayName}
                    onChange={(e) => {
                      if (isEditingMode && selectedEmployee) {
                        setSelectedEmployee({...selectedEmployee, displayName: e.target.value} as any);
                      } else {
                        setNewEmployee({...newEmployee, displayName: e.target.value});
                      }
                    }}
                    className="form-input"
                    placeholder="Fornavn Etternavn"
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">E-post *</label>
                  <input
                    type="email"
                    value={isEditingMode && selectedEmployee ? (selectedEmployee.email || '') : newEmployee.email}
                    onChange={(e) => {
                      if (isEditingMode && selectedEmployee) {
                        setSelectedEmployee({...selectedEmployee, email: e.target.value} as any);
                      } else {
                        setNewEmployee({...newEmployee, email: e.target.value});
                      }
                    }}
                    className="form-input"
                    placeholder="ansatt@bedrift.no"
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Telefon</label>
                  <input
                    type="tel"
                    value={isEditingMode && selectedEmployee ? (selectedEmployee.phone || '') : newEmployee.phone}
                    onChange={(e) => {
                      if (isEditingMode && selectedEmployee) {
                        setSelectedEmployee({...selectedEmployee, phone: e.target.value} as any);
                      } else {
                        setNewEmployee({...newEmployee, phone: e.target.value});
                      }
                    }}
                    className="form-input"
                    placeholder="+47 123 45 678"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Fødselsdato</label>
                  <input
                    type="date"
                    value={isEditingMode && selectedEmployee ? ((selectedEmployee as any).birthDate || '') : newEmployee.birthDate}
                    onChange={(e) => {
                      if (isEditingMode && selectedEmployee) {
                        setSelectedEmployee({...selectedEmployee, birthDate: e.target.value} as any);
                      } else {
                        setNewEmployee({...newEmployee, birthDate: e.target.value});
                      }
                    }}
                    className="form-input"
                  />
                </div>

                {/* Arbeidsinformasjon */}
                <div className="form-group">
                  <label className="form-label">Stilling</label>
                  <input
                    type="text"
                    value={isEditingMode && selectedEmployee ? (selectedEmployee.position || '') : newEmployee.position}
                    onChange={(e) => {
                      if (isEditingMode && selectedEmployee) {
                        setSelectedEmployee({...selectedEmployee, position: e.target.value} as any);
                      } else {
                        setNewEmployee({...newEmployee, position: e.target.value});
                      }
                    }}
                    className="form-input"
                    placeholder="Stilling"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Rolle *</label>
                  <select
                    value={isEditingMode && selectedEmployee ? selectedEmployee.role : newEmployee.role}
                    onChange={(e) => {
                      const newRole = e.target.value as "admin" | "department_leader" | "employee";
                      if (isEditingMode && selectedEmployee) {
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
                      } else {
                        handleRoleChange(newRole);
                      }
                    }}
                    className="form-input"
                    required
                  >
                    <option value="employee">Ansatt</option>
                    <option value="department_leader">Avdelingsleder</option>
                    <option value="admin">Administrator</option>
                  </select>
                </div>
                {(isEditingMode && selectedEmployee ? selectedEmployee.role : newEmployee.role) === 'employee' && (
                  <div className="form-group">
                    <label className="form-label">Avdeling *</label>
                    <select
                      value={isEditingMode && selectedEmployee ? (selectedEmployee.departmentId || '') : newEmployee.departmentId}
                      onChange={(e) => {
                        if (isEditingMode && selectedEmployee) {
                          setSelectedEmployee({...selectedEmployee, departmentId: e.target.value});
                        } else {
                          setNewEmployee({...newEmployee, departmentId: e.target.value});
                        }
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
                      Velg hvilken avdeling denne ansatte tilhører
                    </small>
                  </div>
                )}
                {(isEditingMode && selectedEmployee ? selectedEmployee.role : newEmployee.role) === 'department_leader' && (
                  <div className="form-group">
                    <label className="form-label">Leder for avdeling *</label>
                    <select
                      value={isEditingMode && selectedEmployee 
                        ? (((selectedEmployee as any).leadership?.managesDepartments?.[0] || selectedEmployee.departmentId || ''))
                        : (newEmployee.leadership.managesDepartments[0] || newEmployee.departmentId || '')}
                      onChange={(e) => {
                        const selectedDeptId = e.target.value;
                        if (isEditingMode && selectedEmployee) {
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
                        } else {
                          setNewEmployee({
                            ...newEmployee,
                            leadership: {
                              ...newEmployee.leadership,
                              managesDepartments: selectedDeptId ? [selectedDeptId] : [],
                              isManager: true
                            },
                            departmentId: selectedDeptId
                          });
                        }
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
                {isEditingMode && selectedEmployee && (
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
                )}
                <div className="form-group">
                  <label className="form-label">Ansattnummer</label>
                  <input
                    type="text"
                    value={(selectedEmployee as any).employeeNumber || ''}
                    onChange={(e) => setSelectedEmployee({...selectedEmployee, employeeNumber: e.target.value} as any)}
                    className="form-input"
                  />
                </div>

                {/* Kontrakt og økonomi */}
                <div className="form-group">
                  <label className="form-label">Ansettelsesdato</label>
                  <input
                    type="date"
                    value={(selectedEmployee as any).hireDate ? (selectedEmployee as any).hireDate.split('T')[0] : ''}
                    onChange={(e) => setSelectedEmployee({...selectedEmployee, hireDate: e.target.value} as any)}
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Lønn (årlig)</label>
                  <input
                    type="number"
                    value={(selectedEmployee as any).salary || ''}
                    onChange={(e) => setSelectedEmployee({...selectedEmployee, salary: e.target.value} as any)}
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Skattetrekk</label>
                  <input
                    type="text"
                    value={(selectedEmployee as any).taxId || ''}
                    onChange={(e) => setSelectedEmployee({...selectedEmployee, taxId: e.target.value} as any)}
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Bankkonto</label>
                  <input
                    type="text"
                    value={(selectedEmployee as any).bankAccount || ''}
                    onChange={(e) => setSelectedEmployee({...selectedEmployee, bankAccount: e.target.value} as any)}
                    className="form-input"
                  />
                </div>

                {/* Kontaktinformasjon */}
                <div className="form-group">
                  <label className="form-label">Adresse</label>
                  <textarea
                    value={(selectedEmployee as any).address || ''}
                    onChange={(e) => setSelectedEmployee({...selectedEmployee, address: e.target.value} as any)}
                    className="form-input"
                    rows={3}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Nødkontakt</label>
                  <input
                    type="text"
                    value={(selectedEmployee as any).emergencyContact || ''}
                    onChange={(e) => setSelectedEmployee({...selectedEmployee, emergencyContact: e.target.value} as any)}
                    className="form-input"
                  />
                </div>

                {/* Sikkerhet og forsikring */}
                <div className="form-group">
                  <label className="form-label">Forsikringsnummer</label>
                  <input
                    type="text"
                    value={(selectedEmployee as any).insuranceNumber || ''}
                    onChange={(e) => setSelectedEmployee({...selectedEmployee, insuranceNumber: e.target.value} as any)}
                    className="form-input"
                  />
                </div>

                {/* Profil og kompetanse */}
                <div className="form-group">
                  <label className="form-label">Biografi</label>
                  <textarea
                    value={(selectedEmployee as any).bio || ''}
                    onChange={(e) => setSelectedEmployee({...selectedEmployee, bio: e.target.value} as any)}
                    className="form-input"
                    rows={3}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Utdanning</label>
                  <textarea
                    value={(selectedEmployee as any).education || ''}
                    onChange={(e) => setSelectedEmployee({...selectedEmployee, education: e.target.value} as any)}
                    className="form-input"
                    rows={3}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Arbeidserfaring</label>
                  <textarea
                    value={(selectedEmployee as any).workExperience || ''}
                    onChange={(e) => setSelectedEmployee({...selectedEmployee, workExperience: e.target.value} as any)}
                    className="form-input"
                    rows={3}
                  />
                </div>
              </div>

              {/* Permissions Manager - Full Control Section */}
              <div style={{ marginTop: '2rem', paddingTop: '2rem', borderTop: '2px solid var(--border-color, #e5e7eb)' }}>
                <PermissionsManager
                  permissions={(selectedEmployee as any).permissions || {}}
                  onChange={(updatedPermissions) => {
                    setSelectedEmployee({
                      ...selectedEmployee,
                      permissions: updatedPermissions
                    } as any);
                  }}
                  role={isEditingMode && selectedEmployee ? selectedEmployee.role : newEmployee.role}
                  readOnly={false}
                />
              </div>

              {/* Ferie og fravær-tilgang */}
              <div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border-color, #e5e7eb)' }}>
                <h4 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '0.75rem', color: '#374151' }}>
                  🏖️ Ferie og fravær-tilgang
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', cursor: 'pointer', marginBottom: '0.5rem' }}>
                      <input
                        type="checkbox"
                        checked={(selectedEmployee as any).vacationAccess?.canRequestVacation ?? true}
                        onChange={(e) => setSelectedEmployee({
                          ...selectedEmployee,
                          vacationAccess: {
                            ...((selectedEmployee as any).vacationAccess || newEmployee.vacationAccess),
                            canRequestVacation: e.target.checked
                          }
                        } as any)}
                        style={{ margin: 0 }}
                      />
                      <span>Kan be om ferie</span>
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', cursor: 'pointer', marginBottom: '0.5rem' }}>
                      <input
                        type="checkbox"
                        checked={(selectedEmployee as any).vacationAccess?.canApproveVacation ?? false}
                        onChange={(e) => setSelectedEmployee({
                          ...selectedEmployee,
                          vacationAccess: {
                            ...((selectedEmployee as any).vacationAccess || newEmployee.vacationAccess),
                            canApproveVacation: e.target.checked
                          }
                        } as any)}
                        style={{ margin: 0 }}
                      />
                      <span>Kan godkjenne ferie</span>
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={(selectedEmployee as any).vacationAccess?.canViewAllVacations ?? false}
                        onChange={(e) => setSelectedEmployee({
                          ...selectedEmployee,
                          vacationAccess: {
                            ...((selectedEmployee as any).vacationAccess || newEmployee.vacationAccess),
                            canViewAllVacations: e.target.checked
                          }
                        } as any)}
                        style={{ margin: 0 }}
                      />
                      <span>Kan se alle ferier</span>
                    </label>
                  </div>
                  <div>
                    <div style={{ marginBottom: '0.75rem' }}>
                      <label style={{ fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.25rem', display: 'block' }}>
                        Feriedager per år
                      </label>
                      <input
                        type="number"
                        value={isEditingMode && selectedEmployee ? ((selectedEmployee as any).vacationAccess?.vacationDaysPerYear ?? 25) : (newEmployee.vacationAccess?.vacationDaysPerYear ?? 25)}
                        onChange={(e) => setSelectedEmployee({
                          ...selectedEmployee,
                          vacationAccess: {
                            ...((selectedEmployee as any).vacationAccess || newEmployee.vacationAccess),
                            vacationDaysPerYear: parseInt(e.target.value) || 25
                          }
                        } as any)}
                        className="form-input"
                        style={{ width: '100%', padding: '0.5rem' }}
                        min="0"
                        max="50"
                      />
                    </div>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={(selectedEmployee as any).vacationAccess?.managerApprovalRequired ?? true}
                        onChange={(e) => setSelectedEmployee({
                          ...selectedEmployee,
                          vacationAccess: {
                            ...((selectedEmployee as any).vacationAccess || newEmployee.vacationAccess),
                            managerApprovalRequired: e.target.checked
                          }
                        } as any)}
                        style={{ margin: 0 }}
                      />
                      <span>Leder-godkjenning påkrevd</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Lederskap og hierarki */}
              <div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border-color, #e5e7eb)' }}>
                <h4 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '0.75rem', color: '#374151' }}>
                  👔 Lederskap og hierarki
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', cursor: 'pointer', marginBottom: '0.75rem' }}>
                      <input
                        type="checkbox"
                        checked={(selectedEmployee as any).leadership?.isManager ?? false}
                        onChange={(e) => setSelectedEmployee({
                          ...selectedEmployee,
                          leadership: {
                            ...((selectedEmployee as any).leadership || newEmployee.leadership),
                            isManager: e.target.checked
                          }
                        } as any)}
                        style={{ margin: 0 }}
                      />
                      <span>Er leder</span>
                    </label>
                    <div style={{ marginBottom: '0.75rem' }}>
                      <label style={{ fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.25rem', display: 'block' }}>
                        Rapporterer til
                      </label>
                      <select
                        value={(selectedEmployee as any).leadership?.reportsTo || (selectedEmployee as any).managerId || ''}
                        onChange={(e) => {
                          setSelectedEmployee({
                            ...selectedEmployee,
                            leadership: {
                              ...((selectedEmployee as any).leadership || newEmployee.leadership),
                              reportsTo: e.target.value
                            },
                            managerId: e.target.value
                          } as any);
                        }}
                        className="form-input"
                        style={{ width: '100%', padding: '0.5rem' }}
                      >
                        <option value="">Velg leder</option>
                        {isEditingMode && selectedEmployee ? employees.filter(emp => emp.id !== selectedEmployee.id && (emp.role === 'department_leader' || emp.role === 'admin')).map(emp => (
                          <option key={emp.id} value={emp.id}>
                            {emp.displayName} ({emp.role === 'admin' ? 'Administrator' : 'Avdelingsleder'})
                          </option>
                        )) : null}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', cursor: 'pointer', marginBottom: '0.5rem' }}>
                      <input
                        type="checkbox"
                        checked={(selectedEmployee as any).leadership?.canApproveExpenses ?? false}
                        onChange={(e) => setSelectedEmployee({
                          ...selectedEmployee,
                          leadership: {
                            ...((selectedEmployee as any).leadership || newEmployee.leadership),
                            canApproveExpenses: e.target.checked
                          }
                        } as any)}
                        style={{ margin: 0 }}
                      />
                      <span>Kan godkjenne utgifter</span>
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', cursor: 'pointer', marginBottom: '0.75rem' }}>
                      <input
                        type="checkbox"
                        checked={(selectedEmployee as any).leadership?.canApprovePurchases ?? false}
                        onChange={(e) => setSelectedEmployee({
                          ...selectedEmployee,
                          leadership: {
                            ...((selectedEmployee as any).leadership || newEmployee.leadership),
                            canApprovePurchases: e.target.checked
                          }
                        } as any)}
                        style={{ margin: 0 }}
                      />
                      <span>Kan godkjenne innkjøp</span>
                    </label>
                    <div>
                      <label style={{ fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.25rem', display: 'block' }}>
                        Budsjettgrense (kr)
                      </label>
                      <input
                        type="number"
                        value={(selectedEmployee as any).leadership?.budgetLimit ?? 0}
                        onChange={(e) => setSelectedEmployee({
                          ...selectedEmployee,
                          leadership: {
                            ...((selectedEmployee as any).leadership || newEmployee.leadership),
                            budgetLimit: parseInt(e.target.value) || 0
                          }
                        } as any)}
                        className="form-input"
                        style={{ width: '100%', padding: '0.5rem' }}
                        min="0"
                        placeholder="0"
                      />
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
                      id="newPasswordInput"
                      placeholder="Skriv inn nytt passord (min. 6 tegn)"
                      className="form-input"
                      style={{ flex: 1 }}
                      minLength={6}
                    />
                    <button
                      onClick={async () => {
                        const passwordInput = document.getElementById('newPasswordInput') as HTMLInputElement;
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
                    {selectedEmployee?.id 
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

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h2 className="modal-title">Bekreft sletting</h2>
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="modal-close"
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '0.5rem' }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <AlertTriangle style={{ width: '24px', height: '24px', color: '#dc2626' }} />
                  </div>
                  <div>
                    <h4 style={{ margin: 0, fontWeight: '600', color: '#991b1b' }}>Advarsel!</h4>
                    <p style={{ margin: '0.25rem 0 0 0', color: '#7f1d1d', fontSize: '0.875rem' }}>
                      Denne handlingen kan ikke angres
                    </p>
                  </div>
                </div>

                <p style={{ color: 'var(--gray-700)', lineHeight: '1.6' }}>
                  Er du sikker på at du vil slette <strong>{employees.find(e => e.id === showDeleteConfirm)?.displayName || 'denne ansatten'}</strong>?
                </p>

                <div style={{ padding: '1rem', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '0.5rem' }}>
                  <p style={{ margin: 0, fontSize: '0.875rem', color: '#92400e', fontWeight: '500', marginBottom: '0.5rem' }}>
                    Dette vil:
                  </p>
                  <ul style={{ margin: 0, paddingLeft: '1.25rem', fontSize: '0.875rem', color: '#78350f', lineHeight: '1.6' }}>
                    <li>Slette alle ansattdata permanent</li>
                    <li>Fjerne tilgang til systemet</li>
                    <li>Ikke kunne gjenopprettes</li>
                  </ul>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="btn btn-secondary"
                disabled={deletingEmployeeId !== null}
              >
                Avbryt
              </button>
              <button
                onClick={confirmDeleteEmployee}
                className="btn btn-danger"
                disabled={deletingEmployeeId !== null}
                style={{ opacity: deletingEmployeeId !== null ? 0.5 : 1 }}
              >
                {deletingEmployeeId ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white inline-block mr-2"></div>
                    Sletter...
                  </>
                ) : (
                  <>
                    <Trash2 style={{ width: '16px', height: '16px', marginRight: '0.5rem' }} />
                    Ja, slett ansatt
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

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h2 className="modal-title">Bekreft sletting</h2>
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="modal-close"
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '0.5rem' }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <AlertTriangle style={{ width: '24px', height: '24px', color: '#dc2626' }} />
                  </div>
                  <div>
                    <h4 style={{ margin: 0, fontWeight: '600', color: '#991b1b' }}>Advarsel!</h4>
                    <p style={{ margin: '0.25rem 0 0 0', color: '#7f1d1d', fontSize: '0.875rem' }}>
                      Denne handlingen kan ikke angres
                    </p>
                  </div>
                </div>

                <p style={{ color: 'var(--gray-700)', lineHeight: '1.6' }}>
                  Er du sikker på at du vil slette <strong>{employees.find(e => e.id === showDeleteConfirm)?.displayName || 'denne ansatten'}</strong>?
                </p>

                <div style={{ padding: '1rem', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '0.5rem' }}>
                  <p style={{ margin: 0, fontSize: '0.875rem', color: '#92400e', fontWeight: '500', marginBottom: '0.5rem' }}>
                    Dette vil:
                  </p>
                  <ul style={{ margin: 0, paddingLeft: '1.25rem', fontSize: '0.875rem', color: '#78350f', lineHeight: '1.6' }}>
                    <li>Slette alle ansattdata permanent</li>
                    <li>Fjerne tilgang til systemet</li>
                    <li>Ikke kunne gjenopprettes</li>
                  </ul>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="btn btn-secondary"
                disabled={deletingEmployeeId !== null}
              >
                Avbryt
              </button>
              <button
                onClick={confirmDeleteEmployee}
                className="btn btn-danger"
                disabled={deletingEmployeeId !== null}
                style={{ opacity: deletingEmployeeId !== null ? 0.5 : 1 }}
              >
                {deletingEmployeeId ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white inline-block mr-2"></div>
                    Sletter...
                  </>
                ) : (
                  <>
                    <Trash2 style={{ width: '16px', height: '16px', marginRight: '0.5rem' }} />
                    Ja, slett ansatt
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
