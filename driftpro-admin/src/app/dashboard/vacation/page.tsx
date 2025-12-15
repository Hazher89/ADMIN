'use client';

/**
 * ADVANCED VACATION MANAGEMENT SYSTEM WITH INTERACTIVE CALENDAR
 * 
 * Features:
 * - Interactive calendar with clickable days
 * - Select employee first, then click days to select date range
 * - Register vacation button
 * - Click existing vacations to edit/delete
 * - 3 action buttons:
 *   1. Allocate vacation days for new year
 *   2. Transfer days from this year to next year
 *   3. Overview of all vacation requests by department
 * - Multi-level approval workflow
 * - Real-time notifications
 * - Comprehensive statistics
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { firebaseService, createUserAccessContext, Employee, Vacation, VacationAllocation } from '@/lib/firebase-services';
import { notificationService } from '@/lib/notification-service';
import { 
  Calendar, 
  Plus, 
  Search, 
  Users, 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  ChevronDown, 
  Download,
  X,
  Filter,
  BarChart3,
  Edit,
  Eye,
  CheckCircle2,
  XCircle,
  Clock4,
  Target,
  FileText,
  Info,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Save,
  Gift,
  ArrowRight,
  Building2,
  List,
  Calendar as CalendarIcon
} from 'lucide-react';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot, orderBy, doc, updateDoc, deleteDoc, addDoc, getDocs, writeBatch, getDoc, setDoc } from 'firebase/firestore';

interface ExtendedVacation extends Vacation {
  department?: string;
  departmentId?: string;
  remainingQuota?: number;
}

interface VacationStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  byMonth: Record<string, number>;
  byDepartment: Record<string, number>;
  averageDays: number;
  totalDays: number;
  upcoming: number;
  totalAllocated: number;
  totalUsed: number;
  totalRemaining: number;
}

const calculateDaysBetween = (startDate: string, endDate: string): number => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = Math.abs(end.getTime() - start.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
};

const formatDate = (date: string | Date): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('no-NO', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

const getDaysInMonth = (date: Date) => {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
};

const getFirstDayOfMonth = (date: Date) => {
  return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
};

const isSameDay = (date1: Date, date2: Date): boolean => {
  return date1.getFullYear() === date2.getFullYear() &&
         date1.getMonth() === date2.getMonth() &&
         date1.getDate() === date2.getDate();
};

const isDateInRange = (date: Date, start: Date, end: Date): boolean => {
  return date >= start && date <= end;
};

export default function AdvancedVacationPage() {
  const { userProfile } = useAuth();
  const [vacations, setVacations] = useState<ExtendedVacation[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [allocations, setAllocations] = useState<VacationAllocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  
  // View states
  const [viewMode, setViewMode] = useState<'list' | 'calendar' | 'stats' | 'overview'>('calendar');
  const [selectedVacation, setSelectedVacation] = useState<ExtendedVacation | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  // Calendar states
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [selectedEmployee, setSelectedEmployee] = useState<string>('');
  const [selectedStartDate, setSelectedStartDate] = useState<Date | null>(null);
  const [selectedEndDate, setSelectedEndDate] = useState<Date | null>(null);
  const [isSelectingRange, setIsSelectingRange] = useState(false);
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');
  
  // Form states
  const [newVacation, setNewVacation] = useState({
    startDate: '',
    endDate: '',
    notes: '',
    employeeId: ''
  });
  
  const [editVacation, setEditVacation] = useState<ExtendedVacation | null>(null);
  
  // Modal states for 3 action buttons
  const [showAllocateModal, setShowAllocateModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showOverviewModal, setShowOverviewModal] = useState(false);
  const [allocateYear, setAllocateYear] = useState(new Date().getFullYear() + 1);
  const [transferDays, setTransferDays] = useState<Record<string, number>>({});
  
  // Stats
  const [stats, setStats] = useState<VacationStats>({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    byMonth: {},
    byDepartment: {},
    averageDays: 0,
    totalDays: 0,
    upcoming: 0,
    totalAllocated: 0,
    totalUsed: 0,
    totalRemaining: 0
  });
  
  // User role and permissions
  const userRole = userProfile?.role || 'employee';
  const isAdmin = userRole === 'admin' || userRole === 'super_admin';
  const isDepartmentLeader = userRole === 'department_leader';
  const isEmployee = userRole === 'employee';
  const canApprove = isAdmin || isDepartmentLeader;
  const canViewAll = isAdmin;
  const canViewDepartment = isAdmin || isDepartmentLeader;

  // Load data
  const loadData = useCallback(async () => {
    if (!userProfile) return;

    try {
      setLoading(true);
      const userContext = createUserAccessContext(userProfile);
      
      // Load employees
      const employeeData = await firebaseService.getEmployees(userContext);
      setEmployees(employeeData);
      
      // Load vacations
      const vacationData = await firebaseService.getVacations(userContext);
      
      // Load allocations
      try {
        const allocationsQuery = query(collection(db, 'vacationAllocations'));
        const allocationsSnapshot = await getDocs(allocationsQuery);
        const allocationsData = allocationsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as VacationAllocation[];
        setAllocations(allocationsData);
      } catch (err) {
        console.warn('Could not load allocations:', err);
      }
      
      // Enhance vacations
      const enhanced: ExtendedVacation[] = vacationData.map(vacation => {
        const employee = employeeData.find(e => e.id === vacation.employeeId);
        const days = vacation.days || calculateDaysBetween(vacation.startDate, vacation.endDate);
        
        // Calculate remaining quota
        const currentYear = new Date().getFullYear();
        const yearVacations = vacationData.filter(v => 
          v.employeeId === vacation.employeeId &&
          new Date(v.startDate).getFullYear() === currentYear &&
          v.status === 'approved'
        );
        
        const usedDays = yearVacations.reduce((sum, v) => sum + (v.days || 0), 0);
        const allocation = allocations.find(a => a.employeeId === vacation.employeeId && a.year === currentYear);
        const allocatedDays = allocation?.allocatedDays || 25;
        const remainingQuota = allocatedDays - usedDays;
        
        return {
          ...vacation,
          id: vacation.id || '',
          department: employee?.department || '',
          departmentId: employee?.departmentId || '',
          days,
          remainingQuota
        };
      });
      
      setVacations(enhanced);
      calculateStats(enhanced);
      
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  }, [userProfile, isAdmin, isDepartmentLeader, allocations]);

  const calculateStats = (vacationList: ExtendedVacation[]) => {
    const currentYear = new Date().getFullYear();
    const yearVacations = vacationList.filter(v => 
      new Date(v.startDate).getFullYear() === currentYear
    );
    
    const newStats: VacationStats = {
      total: yearVacations.length,
      pending: yearVacations.filter(v => v.status === 'pending').length,
      approved: yearVacations.filter(v => v.status === 'approved').length,
      rejected: yearVacations.filter(v => v.status === 'rejected').length,
      byMonth: {},
      byDepartment: {},
      averageDays: 0,
      totalDays: 0,
      upcoming: 0,
      totalAllocated: 0,
      totalUsed: 0,
      totalRemaining: 0
    };
    
    let totalDays = 0;
    const now = new Date();
    
    yearVacations.forEach(v => {
      const month = new Date(v.startDate).toLocaleDateString('no-NO', { month: 'long' });
      newStats.byMonth[month] = (newStats.byMonth[month] || 0) + 1;
      
      const dept = v.department || 'Ukjent';
      newStats.byDepartment[dept] = (newStats.byDepartment[dept] || 0) + 1;
      
      if (v.days) {
        totalDays += v.days;
      }
      
      if (v.status === 'approved' && new Date(v.startDate) > now) {
        newStats.upcoming++;
      }
    });
    
    newStats.totalDays = totalDays;
    newStats.averageDays = yearVacations.length > 0 ? totalDays / yearVacations.length : 0;
    
    // Calculate allocation stats
    const currentAllocations = allocations.filter(a => a.year === currentYear);
    newStats.totalAllocated = currentAllocations.reduce((sum, a) => sum + a.allocatedDays, 0);
    newStats.totalUsed = totalDays;
    newStats.totalRemaining = newStats.totalAllocated - newStats.totalUsed;
    
    setStats(newStats);
  };

  // Real-time subscription
  useEffect(() => {
    if (!userProfile || !db) return;
    
    const userContext = createUserAccessContext(userProfile);
    let q;
    
    if (isAdmin) {
      q = query(
        collection(db, 'vacations'),
        orderBy('createdAt', 'desc')
      );
    } else if (isDepartmentLeader && userProfile.departmentId) {
      const employeeIds: string[] = [];
      employees.forEach(emp => {
        if (emp.departmentId === userProfile.departmentId) {
          employeeIds.push(emp.id);
        }
      });
      
      if (employeeIds.length > 0 && employeeIds.length <= 10) {
        q = query(
          collection(db, 'vacations'),
          where('employeeId', 'in', employeeIds),
          orderBy('createdAt', 'desc')
        );
      } else {
        q = query(
          collection(db, 'vacations'),
          orderBy('createdAt', 'desc')
        );
      }
    } else {
      q = query(
        collection(db, 'vacations'),
        where('employeeId', '==', userProfile.id),
        orderBy('createdAt', 'desc')
      );
    }
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      loadData();
    });
    
    return () => unsubscribe();
  }, [userProfile, employees, isAdmin, isDepartmentLeader, loadData]);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (userProfile) {
      loadData();
    }
  }, [userProfile, loadData]);

  // Handle calendar day click
  const handleDayClick = (date: Date) => {
    if (!selectedEmployee) {
      alert('Vennligst velg en ansatt først');
      return;
    }

    // Check if there's an existing vacation on this date
    const existingVacation = vacations.find(v => {
      if (v.employeeId !== selectedEmployee || v.status !== 'approved') return false;
      const start = new Date(v.startDate);
      const end = new Date(v.endDate);
      return isDateInRange(date, start, end);
    });

    if (existingVacation) {
      // Click on existing vacation - show edit/delete options
      setEditVacation(existingVacation);
      setSelectedStartDate(new Date(existingVacation.startDate));
      setSelectedEndDate(new Date(existingVacation.endDate));
      setShowEditModal(true);
      return;
    }

    // Start or continue date range selection
    if (!selectedStartDate) {
      // Start new selection
      setSelectedStartDate(date);
      setSelectedEndDate(date);
      setIsSelectingRange(true);
    } else if (isSelectingRange) {
      // Set end date
      if (date < selectedStartDate) {
        // If clicked date is before start, swap them
        setSelectedEndDate(selectedStartDate);
        setSelectedStartDate(date);
      } else {
        setSelectedEndDate(date);
      }
      setIsSelectingRange(false);
    } else {
      // Start new selection
      setSelectedStartDate(date);
      setSelectedEndDate(date);
      setIsSelectingRange(true);
    }
  };

  // Register vacation from calendar selection
  const handleRegisterVacation = async () => {
    if (!userProfile || !selectedEmployee || !selectedStartDate || !selectedEndDate) {
      alert('Vennligst velg ansatt og datoer');
      return;
    }

    try {
      const userContext = createUserAccessContext(userProfile);
      const employee = employees.find(e => e.id === selectedEmployee);
      const days = calculateDaysBetween(
        selectedStartDate.toISOString().split('T')[0],
        selectedEndDate.toISOString().split('T')[0]
      );

      const vacationData: Omit<Vacation, 'id' | 'createdAt' | 'updatedAt'> = {
        employeeId: selectedEmployee,
        employeeName: employee?.name || employee?.displayName || 'Ukjent',
        startDate: selectedStartDate.toISOString().split('T')[0],
        endDate: selectedEndDate.toISOString().split('T')[0],
        type: 'vacation',
        days,
        notes: '',
        status: canApprove ? 'approved' : 'pending',
        requestedBy: userProfile.id
      };

      const vacationId = await firebaseService.createVacation(vacationData, userContext);

      // Send notifications if pending
      if (!canApprove) {
        await sendVacationNotifications(vacationId, vacationData, 'created');
      }

      // Reset selection
      setSelectedStartDate(null);
      setSelectedEndDate(null);
      setIsSelectingRange(false);

      alert('Ferie registrert!');
    } catch (error) {
      console.error('Error creating vacation:', error);
      alert('Feil ved registrering av ferie');
    }
  };

  // Handle edit vacation
  const handleEditVacation = async () => {
    if (!editVacation || !selectedStartDate || !selectedEndDate) return;

    try {
      const userContext = createUserAccessContext(userProfile!);
      const days = calculateDaysBetween(
        selectedStartDate.toISOString().split('T')[0],
        selectedEndDate.toISOString().split('T')[0]
      );

      await firebaseService.updateVacation(editVacation.id, {
        startDate: selectedStartDate.toISOString().split('T')[0],
        endDate: selectedEndDate.toISOString().split('T')[0],
        days
      }, userContext);

      setShowEditModal(false);
      setEditVacation(null);
      setSelectedStartDate(null);
      setSelectedEndDate(null);
      alert('Ferie oppdatert!');
    } catch (error) {
      console.error('Error updating vacation:', error);
      alert('Feil ved oppdatering av ferie');
    }
  };

  // Handle delete vacation
  const handleDeleteVacation = async () => {
    if (!editVacation) return;

    if (!confirm('Er du sikker på at du vil slette denne ferien?')) {
      return;
    }

    try {
      const userContext = createUserAccessContext(userProfile!);
      await firebaseService.deleteVacation(editVacation.id, userContext);

      setShowDeleteConfirm(false);
      setShowEditModal(false);
      setEditVacation(null);
      setSelectedStartDate(null);
      setSelectedEndDate(null);
      alert('Ferie slettet!');
    } catch (error) {
      console.error('Error deleting vacation:', error);
      alert('Feil ved sletting av ferie');
    }
  };

  // Allocate vacation days for new year
  const handleAllocateNewYear = async () => {
    if (!userProfile || !isAdmin) return;

    const daysPerEmployee = 25; // Standard 25 days
    const targetYear = allocateYear;

    try {
      const userContext = createUserAccessContext(userProfile);
      const batch = writeBatch(db);

      for (const employee of employees) {
        // Check if allocation already exists
        const existingAlloc = allocations.find(
          a => a.employeeId === employee.id && a.year === targetYear
        );

        if (!existingAlloc) {
          const allocRef = doc(collection(db, 'vacationAllocations'));
          batch.set(allocRef, {
            employeeId: employee.id,
            year: targetYear,
            allocatedDays: daysPerEmployee,
            usedDays: 0,
            transferredDays: 0,
            remainingDays: daysPerEmployee,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          });
        }
      }

      await batch.commit();
      setShowAllocateModal(false);
      alert(`Ferie dager tildelt for ${targetYear}!`);
      loadData();
    } catch (error) {
      console.error('Error allocating days:', error);
      alert('Feil ved tildeling av feriedager');
    }
  };

  // Transfer days from this year to next year
  const handleTransferDays = async () => {
    if (!userProfile || !isAdmin) return;

    const currentYear = new Date().getFullYear();
    const nextYear = currentYear + 1;

    try {
      const userContext = createUserAccessContext(userProfile);
      const batch = writeBatch(db);

      for (const employee of employees) {
        const currentAlloc = allocations.find(
          a => a.employeeId === employee.id && a.year === currentYear
        );
        const daysToTransfer = transferDays[employee.id] || 0;

        if (daysToTransfer > 0 && currentAlloc && currentAlloc.remainingDays >= daysToTransfer) {
          // Update current year allocation
          const currentRef = doc(db, 'vacationAllocations', currentAlloc.id);
          batch.update(currentRef, {
            remainingDays: currentAlloc.remainingDays - daysToTransfer,
            updatedAt: new Date().toISOString()
          });

          // Update or create next year allocation
          const nextAlloc = allocations.find(
            a => a.employeeId === employee.id && a.year === nextYear
          );

          if (nextAlloc) {
            const nextRef = doc(db, 'vacationAllocations', nextAlloc.id);
            batch.update(nextRef, {
              allocatedDays: nextAlloc.allocatedDays + daysToTransfer,
              transferredDays: (nextAlloc.transferredDays || 0) + daysToTransfer,
              remainingDays: nextAlloc.remainingDays + daysToTransfer,
              updatedAt: new Date().toISOString()
            });
          } else {
            const nextRef = doc(collection(db, 'vacationAllocations'));
            batch.set(nextRef, {
              employeeId: employee.id,
              year: nextYear,
              allocatedDays: 25 + daysToTransfer,
              usedDays: 0,
              transferredDays: daysToTransfer,
              remainingDays: 25 + daysToTransfer,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            });
          }
        }
      }

      await batch.commit();
      setShowTransferModal(false);
      setTransferDays({});
      alert('Dager overført!');
      loadData();
    } catch (error) {
      console.error('Error transferring days:', error);
      alert('Feil ved overføring av dager');
    }
  };

  // Send notifications
  const sendVacationNotifications = async (
    vacationId: string,
    vacation: Vacation | ExtendedVacation,
    event: 'created' | 'approved' | 'rejected' | 'updated'
  ) => {
    if (!userProfile) return;
    
    const employee = employees.find(e => e.id === vacation.employeeId);
    if (!employee) return;
    
    const departmentLeaders = employees.filter(e => 
      e.role === 'department_leader' && 
      e.departmentId === employee.departmentId
    );
    const admins = employees.filter(e => 
      e.role === 'admin' || e.role === 'super_admin'
    );
    
    let title = '';
    let message = '';
    let recipients: string[] = [];
    
    switch (event) {
      case 'created':
        title = 'Ny ferie forespørsel';
        message = `${employee.name || employee.displayName} har sendt inn en ferie forespørsel fra ${formatDate(vacation.startDate)} til ${formatDate(vacation.endDate)}`;
        recipients = [
          ...departmentLeaders.map(l => l.id),
          ...admins.map(a => a.id)
        ];
        
        // Send email to all admins
        for (const admin of admins) {
          if (admin.email) {
            try {
              await globalEmailService.sendEmail({
                to: admin.email,
                subject: `🔔 ${title} - ${employee.name || employee.displayName}`,
                html: `
                  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <h2 style="color: #2563eb;">${title}</h2>
                    <p>Hei ${admin.name || admin.displayName || 'Admin'},</p>
                    <p><strong>${employee.name || employee.displayName}</strong> har sendt inn en ferieansøkning:</p>
                    <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #2563eb;">
                      <p><strong>Fra dato:</strong> ${formatDate(vacation.startDate)}</p>
                      <p><strong>Til dato:</strong> ${formatDate(vacation.endDate)}</p>
                      <p><strong>Antall dager:</strong> ${vacation.days || calculateDaysBetween(vacation.startDate, vacation.endDate)}</p>
                      ${vacation.notes ? `<p><strong>Notater:</strong> ${vacation.notes}</p>` : ''}
                    </div>
                    <p><a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://driftpro.no'}/dashboard/vacation?vacationId=${vacationId}" style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin-top: 20px;">Se detaljer i DriftPro</a></p>
                    <br>
                    <p>Med vennlig hilsen,<br>DriftPro-systemet</p>
                  </div>
                `
              });
            } catch (emailError) {
              console.error('Error sending email to admin:', emailError);
            }
          }
        }
        break;
      case 'approved':
        title = 'Ferie forespørsel godkjent';
        message = `Din ferie forespørsel fra ${formatDate(vacation.startDate)} til ${formatDate(vacation.endDate)} er godkjent`;
        recipients = [vacation.employeeId];
        break;
      case 'rejected':
        title = 'Ferie forespørsel avslått';
        message = `Din ferie forespørsel fra ${formatDate(vacation.startDate)} til ${formatDate(vacation.endDate)} er avslått`;
        recipients = [vacation.employeeId];
        break;
    }
    
    for (const recipientId of recipients) {
      if (recipientId === userProfile.id) continue;
      
      await notificationService.createNotification({
        userId: recipientId,
        title,
        message,
        type: 'vacation',
        priority: event === 'created' ? 'high' : 'medium',
        actionUrl: `/dashboard/vacation?vacationId=${vacationId}`,
        actionText: 'Se detaljer',
        metadata: {
          vacationId,
          event,
          employeeId: vacation.employeeId,
          type: vacation.type
        }
      });
    }
  };

  // Get vacations for a specific date
  const getVacationsForDate = (date: Date): ExtendedVacation[] => {
    const dateStr = date.toISOString().split('T')[0];
    return vacations.filter(v => {
      if (v.status !== 'approved') return false;
      const start = new Date(v.startDate);
      const end = new Date(v.endDate);
      return isDateInRange(date, start, end);
    });
  };

  // Check if date is in selected range
  const isDateInSelectedRange = (date: Date): boolean => {
    if (!selectedStartDate || !selectedEndDate) return false;
    return isDateInRange(date, selectedStartDate, selectedEndDate);
  };

  // Get departments
  const departments = useMemo(() => {
    const deptSet = new Set<string>();
    employees.forEach(emp => {
      if (emp.department) deptSet.add(emp.department);
    });
    return Array.from(deptSet).sort();
  }, [employees]);

  // Get overview data by department
  const overviewByDepartment = useMemo(() => {
    const overview: Record<string, {
      employees: Employee[];
      vacations: ExtendedVacation[];
      totalDays: number;
      pending: number;
      approved: number;
    }> = {};

    departments.forEach(dept => {
      const deptEmployees = employees.filter(e => e.department === dept);
      const deptVacations = vacations.filter(v => v.department === dept);
      
      overview[dept] = {
        employees: deptEmployees,
        vacations: deptVacations,
        totalDays: deptVacations.filter(v => v.status === 'approved').reduce((sum, v) => sum + (v.days || 0), 0),
        pending: deptVacations.filter(v => v.status === 'pending').length,
        approved: deptVacations.filter(v => v.status === 'approved').length
      };
    });

    return overview;
  }, [departments, employees, vacations]);

  // Render calendar
  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(calendarDate);
    const firstDay = getFirstDayOfMonth(calendarDate);
    const days: (Date | null)[] = [];

    // Add empty cells for days before month starts
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(calendarDate.getFullYear(), calendarDate.getMonth(), day));
    }

    return (
      <div style={{
        background: 'white',
        borderRadius: '16px',
        padding: isMobile ? '1rem' : '1.5rem',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
      }}>
        {/* Calendar Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button
              onClick={() => {
                const newDate = new Date(calendarDate);
                newDate.setMonth(newDate.getMonth() - 1);
                setCalendarDate(newDate);
              }}
              style={{
                padding: isMobile ? '0.75rem' : '0.5rem',
                background: '#f3f4f6',
                border: 'none',
                borderRadius: isMobile ? '12px' : '8px',
                cursor: 'pointer',
                minWidth: isMobile ? '48px' : 'auto',
                minHeight: isMobile ? '48px' : 'auto',
                touchAction: 'manipulation'
              }}
            >
              <ChevronLeft size={isMobile ? 22 : 20} />
            </button>
            <h2 style={{ fontSize: isMobile ? '1.125rem' : '1.25rem', fontWeight: 700, margin: 0 }}>
              {calendarDate.toLocaleDateString('no-NO', { month: 'long', year: 'numeric' })}
            </h2>
            <button
              onClick={() => {
                const newDate = new Date(calendarDate);
                newDate.setMonth(newDate.getMonth() + 1);
                setCalendarDate(newDate);
              }}
              style={{
                padding: isMobile ? '0.75rem' : '0.5rem',
                background: '#f3f4f6',
                border: 'none',
                borderRadius: isMobile ? '12px' : '8px',
                cursor: 'pointer',
                minWidth: isMobile ? '48px' : 'auto',
                minHeight: isMobile ? '48px' : 'auto',
                touchAction: 'manipulation'
              }}
            >
              <ChevronRight size={isMobile ? 22 : 20} />
            </button>
          </div>
          <button
            onClick={() => setCalendarDate(new Date())}
            style={{
              padding: isMobile ? '1rem 1.25rem' : '0.5rem 1rem',
              background: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: isMobile ? '12px' : '8px',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: isMobile ? '1rem' : 'var(--font-size-base)',
              minHeight: isMobile ? '56px' : 'auto',
              touchAction: 'manipulation'
            }}
          >
            I dag
          </button>
        </div>

        {/* Employee Selection */}
        <div style={{ marginBottom: '1.5rem', padding: '1rem', background: '#f9fafb', borderRadius: '8px' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: '#1f2937' }}>
            Velg ansatt
          </label>
          <select
            value={selectedEmployee}
            onChange={(e) => {
              setSelectedEmployee(e.target.value);
              setSelectedStartDate(null);
              setSelectedEndDate(null);
            }}
            style={{
              width: '100%',
              padding: isMobile ? '1.25rem 1.5rem' : '0.75rem',
              border: '3px solid #e5e7eb',
              borderRadius: isMobile ? '16px' : '8px',
              fontSize: isMobile ? '18px' : '0.875rem',
              minHeight: isMobile ? '64px' : 'auto',
              outline: 'none',
              touchAction: 'manipulation',
              WebkitAppearance: 'none',
              appearance: 'none'
            }}
          >
            <option value="">-- Velg ansatt --</option>
            {employees.map(emp => (
              <option key={emp.id} value={emp.id}>
                {emp.name || emp.displayName} {emp.department ? `(${emp.department})` : ''}
              </option>
            ))}
          </select>
        </div>

        {/* Selected Range Display */}
        {selectedStartDate && selectedEndDate && (
          <div style={{
            marginBottom: '1.5rem',
            padding: '1rem',
            background: '#eff6ff',
            border: '2px solid #3b82f6',
            borderRadius: '8px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1rem'
          }}>
            <div>
              <strong>Valgt periode:</strong> {formatDate(selectedStartDate)} - {formatDate(selectedEndDate)}
              <br />
              <strong>Antall dager:</strong> {calculateDaysBetween(
                selectedStartDate.toISOString().split('T')[0],
                selectedEndDate.toISOString().split('T')[0]
              )}
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                onClick={handleRegisterVacation}
                style={{
                  padding: isMobile ? '1.25rem 1.5rem' : '0.75rem 1.5rem',
                  background: '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: isMobile ? '12px' : '8px',
                  cursor: 'pointer',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  minHeight: isMobile ? '56px' : 'auto',
                  fontSize: isMobile ? '1rem' : 'var(--font-size-base)',
                  touchAction: 'manipulation'
                }}
              >
                <Save size={isMobile ? 22 : 18} />
                Registrer ferie
              </button>
              <button
                onClick={() => {
                  setSelectedStartDate(null);
                  setSelectedEndDate(null);
                }}
                style={{
                  padding: isMobile ? '1.25rem 1.5rem' : '0.75rem 1.5rem',
                  background: '#6b7280',
                  color: 'white',
                  border: 'none',
                  borderRadius: isMobile ? '12px' : '8px',
                  cursor: 'pointer',
                  fontWeight: 600,
                  minHeight: isMobile ? '56px' : 'auto',
                  fontSize: isMobile ? '1rem' : 'var(--font-size-base)',
                  touchAction: 'manipulation'
                }}
              >
                Avbryt
              </button>
            </div>
          </div>
        )}

        {/* Calendar Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.5rem' }}>
          {/* Day headers */}
          {['Man', 'Tir', 'Ons', 'Tor', 'Fre', 'Lør', 'Søn'].map(day => (
            <div key={day} style={{
              padding: '0.75rem',
              textAlign: 'center',
              fontWeight: 600,
              color: '#6b7280',
              fontSize: '0.875rem'
            }}>
              {day}
            </div>
          ))}

          {/* Calendar days */}
          {days.map((date, index) => {
            if (!date) {
              return <div key={`empty-${index}`} style={{ aspectRatio: '1', padding: '0.5rem' }} />;
            }

            const isToday = isSameDay(date, new Date());
            const isSelected = isDateInSelectedRange(date);
            const dayVacations = getVacationsForDate(date);
            const isPast = date < new Date() && !isToday;

            return (
              <div
                key={date.toISOString()}
                onClick={() => handleDayClick(date)}
                style={{
                  aspectRatio: '1',
                  padding: '0.5rem',
                  border: isToday ? '2px solid #3b82f6' : '1px solid #e5e7eb',
                  borderRadius: '8px',
                  cursor: selectedEmployee ? 'pointer' : 'not-allowed',
                  background: isSelected ? 'rgba(59, 130, 246, 0.1)' :
                               dayVacations.length > 0 ? 'rgba(16, 185, 129, 0.1)' :
                               isPast ? '#f9fafb' : 'white',
                  position: 'relative',
                  transition: 'all 0.2s',
                  opacity: !selectedEmployee ? 0.5 : 1
                }}
                onMouseEnter={(e) => {
                  if (selectedEmployee) {
                    e.currentTarget.style.background = isSelected ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.05)';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = isSelected ? 'rgba(59, 130, 246, 0.1)' :
                                                     dayVacations.length > 0 ? 'rgba(16, 185, 129, 0.1)' :
                                                     isPast ? '#f9fafb' : 'white';
                }}
              >
                <div style={{
                  fontSize: '0.875rem',
                  fontWeight: isToday ? 700 : 500,
                  color: isToday ? '#3b82f6' : isPast ? '#9ca3af' : '#1f2937',
                  marginBottom: '0.25rem'
                }}>
                  {date.getDate()}
                </div>
                {dayVacations.length > 0 && (
                  <div style={{ fontSize: '0.625rem', color: '#059669' }}>
                    {dayVacations.length} ferie{dayVacations.length > 1 ? 'r' : ''}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
      padding: isMobile ? '1rem' : '2rem'
    }}>
      {/* Header with 3 Action Buttons */}
      <div style={{
        background: 'white',
        borderRadius: '16px',
        padding: isMobile ? '1rem' : '2rem',
        marginBottom: '2rem',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
          <div>
            <h1 style={{ fontSize: isMobile ? '1.5rem' : '2rem', fontWeight: 700, margin: 0, color: '#1f2937' }}>
              Ferieadministrasjon
            </h1>
            <p style={{ color: '#6b7280', margin: '0.5rem 0 0 0' }}>
              Interaktiv kalender for ferieplanlegging
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button
              onClick={() => setViewMode('stats')}
              style={{
                padding: isMobile ? '1.25rem 1.5rem' : '0.75rem 1.5rem',
                background: viewMode === 'stats' ? '#3b82f6' : 'white',
                color: viewMode === 'stats' ? 'white' : '#3b82f6',
                border: '2px solid #3b82f6',
                borderRadius: isMobile ? '12px' : '8px',
                cursor: 'pointer',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                minHeight: isMobile ? '56px' : 'auto',
                fontSize: isMobile ? '1rem' : 'var(--font-size-base)',
                touchAction: 'manipulation'
              }}
            >
              <BarChart3 size={isMobile ? 22 : 20} />
              Statistikk
            </button>
            <button
              onClick={() => setViewMode('list')}
              style={{
                padding: isMobile ? '1.25rem 1.5rem' : '0.75rem 1.5rem',
                background: viewMode === 'list' ? '#3b82f6' : 'white',
                color: viewMode === 'list' ? 'white' : '#3b82f6',
                border: '2px solid #3b82f6',
                borderRadius: isMobile ? '12px' : '8px',
                cursor: 'pointer',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                minHeight: isMobile ? '56px' : 'auto',
                fontSize: isMobile ? '1rem' : 'var(--font-size-base)',
                touchAction: 'manipulation'
              }}
            >
              <List size={isMobile ? 22 : 20} />
              Liste
            </button>
          </div>
        </div>

        {/* 3 Action Buttons */}
        {isAdmin && (
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <button
              onClick={() => setShowAllocateModal(true)}
              style={{
                padding: isMobile ? '1.25rem 1.5rem' : '0.75rem 1.5rem',
                background: '#10b981',
                color: 'white',
                border: 'none',
                borderRadius: isMobile ? '12px' : '8px',
                cursor: 'pointer',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                minHeight: isMobile ? '56px' : 'auto',
                fontSize: isMobile ? '1rem' : 'var(--font-size-base)',
                touchAction: 'manipulation'
              }}
            >
              <Gift size={isMobile ? 22 : 20} />
              {isMobile ? 'Tildel feriedager' : 'Tildel feriedager for nytt år'}
            </button>
            <button
              onClick={() => {
                // Initialize transfer days for each employee
                const currentYear = new Date().getFullYear();
                const transferData: Record<string, number> = {};
                employees.forEach(emp => {
                  const alloc = allocations.find(a => a.employeeId === emp.id && a.year === currentYear);
                  if (alloc && alloc.remainingDays > 0) {
                    transferData[emp.id] = 0;
                  }
                });
                setTransferDays(transferData);
                setShowTransferModal(true);
              }}
              style={{
                padding: isMobile ? '1.25rem 1.5rem' : '0.75rem 1.5rem',
                background: '#f59e0b',
                color: 'white',
                border: 'none',
                borderRadius: isMobile ? '12px' : '8px',
                cursor: 'pointer',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                minHeight: isMobile ? '56px' : 'auto',
                fontSize: isMobile ? '1rem' : 'var(--font-size-base)',
                touchAction: 'manipulation'
              }}
            >
              <ArrowRight size={isMobile ? 22 : 20} />
              {isMobile ? 'Overfør dager' : 'Overfør dager fra i år til neste år'}
            </button>
            <button
              onClick={() => setShowOverviewModal(true)}
              style={{
                padding: isMobile ? '1.25rem 1.5rem' : '0.75rem 1.5rem',
                background: '#8b5cf6',
                color: 'white',
                border: 'none',
                borderRadius: isMobile ? '12px' : '8px',
                cursor: 'pointer',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                minHeight: isMobile ? '56px' : 'auto',
                fontSize: isMobile ? '1rem' : 'var(--font-size-base)',
                touchAction: 'manipulation'
              }}
            >
              <Building2 size={isMobile ? 22 : 20} />
              {isMobile ? 'Avdelingsoversikt' : 'Oversikt over alle avdelinger'}
            </button>
          </div>
        )}
      </div>

      {/* Calendar View */}
      {viewMode === 'calendar' && renderCalendar()}

      {/* Stats View */}
      {viewMode === 'stats' && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '1.5rem',
          marginBottom: '2rem'
        }}>
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '1.5rem',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p style={{ color: '#6b7280', margin: 0, fontSize: '0.875rem' }}>Totalt</p>
                <h2 style={{ fontSize: '2rem', fontWeight: 700, margin: '0.5rem 0 0 0', color: '#1f2937' }}>
                  {stats.total}
                </h2>
              </div>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                background: 'rgba(59, 130, 246, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <FileText size={24} color="#3b82f6" />
              </div>
            </div>
          </div>

          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '1.5rem',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p style={{ color: '#6b7280', margin: 0, fontSize: '0.875rem' }}>Venter på godkjenning</p>
                <h2 style={{ fontSize: '2rem', fontWeight: 700, margin: '0.5rem 0 0 0', color: '#f59e0b' }}>
                  {stats.pending}
                </h2>
              </div>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                background: 'rgba(245, 158, 11, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Clock size={24} color="#f59e0b" />
              </div>
            </div>
          </div>

          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '1.5rem',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p style={{ color: '#6b7280', margin: 0, fontSize: '0.875rem' }}>Gjenstående dager</p>
                <h2 style={{ fontSize: '2rem', fontWeight: 700, margin: '0.5rem 0 0 0', color: '#10b981' }}>
                  {stats.totalRemaining}
                </h2>
              </div>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                background: 'rgba(16, 185, 129, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Target size={24} color="#10b981" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* List View */}
      {viewMode === 'list' && (
        <div style={{
          background: 'white',
          borderRadius: '16px',
          padding: isMobile ? '1rem' : '1.5rem',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
        }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
            <div style={{ position: 'relative', flex: '1', minWidth: '200px' }}>
              <Search size={20} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
              <input
                type="text"
                placeholder="Søk..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem 0.75rem 0.75rem 2.5rem',
                  border: '2px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '0.875rem'
                }}
              />
            </div>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value as any)}
              style={{
                padding: '0.75rem 1rem',
                border: '2px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '0.875rem',
                minWidth: '150px'
              }}
            >
              <option value="all">Alle statuser</option>
              <option value="pending">Venter</option>
              <option value="approved">Godkjent</option>
              <option value="rejected">Avslått</option>
            </select>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e5e7eb' }}>
                  <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600, color: '#6b7280' }}>Ansatt</th>
                  <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600, color: '#6b7280' }}>Periode</th>
                  <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600, color: '#6b7280' }}>Dager</th>
                  <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600, color: '#6b7280' }}>Status</th>
                  <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600, color: '#6b7280' }}>Handlinger</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={5} style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>
                      Laster...
                    </td>
                  </tr>
                ) : vacations.filter(v => {
                  if (selectedStatus !== 'all' && v.status !== selectedStatus) return false;
                  if (searchTerm && !v.employeeName?.toLowerCase().includes(searchTerm.toLowerCase())) return false;
                  return true;
                }).length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>
                      Ingen ferie funnet
                    </td>
                  </tr>
                ) : (
                  vacations.filter(v => {
                    if (selectedStatus !== 'all' && v.status !== selectedStatus) return false;
                    if (searchTerm && !v.employeeName?.toLowerCase().includes(searchTerm.toLowerCase())) return false;
                    return true;
                  }).map(vacation => (
                    <tr 
                      key={vacation.id}
                      style={{ 
                        borderBottom: '1px solid #e5e7eb',
                        cursor: 'pointer'
                      }}
                      onClick={() => {
                        setSelectedVacation(vacation);
                        setShowDetailsModal(true);
                      }}
                    >
                      <td style={{ padding: '1rem' }}>{vacation.employeeName}</td>
                      <td style={{ padding: '1rem' }}>
                        {formatDate(vacation.startDate)} - {formatDate(vacation.endDate)}
                      </td>
                      <td style={{ padding: '1rem' }}>{vacation.days}</td>
                      <td style={{ padding: '1rem' }}>
                        <span style={{
                          padding: '0.25rem 0.75rem',
                          borderRadius: '6px',
                          fontSize: '0.875rem',
                          fontWeight: 600,
                          background: vacation.status === 'approved' ? 'rgba(16, 185, 129, 0.1)' :
                                     vacation.status === 'rejected' ? 'rgba(239, 68, 68, 0.1)' :
                                     'rgba(245, 158, 11, 0.1)',
                          color: vacation.status === 'approved' ? '#059669' :
                                 vacation.status === 'rejected' ? '#dc2626' :
                                 '#d97706'
                        }}>
                          {vacation.status === 'approved' ? 'Godkjent' :
                           vacation.status === 'rejected' ? 'Avslått' :
                           'Venter'}
                        </span>
                      </td>
                      <td style={{ padding: '1rem' }} onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => {
                            setSelectedVacation(vacation);
                            setShowDetailsModal(true);
                          }}
                          style={{
                            padding: '0.5rem',
                            background: '#3b82f6',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer'
                          }}
                        >
                          <Eye size={18} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Allocate Modal */}
      {showAllocateModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '1rem'
        }}>
          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '2rem',
            maxWidth: '500px',
            width: '100%'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>Tildel feriedager for nytt år</h2>
              <button
                onClick={() => setShowAllocateModal(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '0.5rem'
                }}
              >
                <X size={24} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>
                  År
                </label>
                <input
                  type="number"
                  value={allocateYear}
                  onChange={(e) => setAllocateYear(parseInt(e.target.value))}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '2px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '0.875rem'
                  }}
                />
              </div>

              <div style={{
                padding: '1rem',
                background: '#eff6ff',
                borderRadius: '8px',
                border: '1px solid #3b82f6'
              }}>
                <strong>Standard tildeling:</strong> 25 dager per ansatt
                <br />
                <strong>Antall ansatte:</strong> {employees.length}
                <br />
                <strong>Totalt:</strong> {employees.length * 25} dager
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <button
                  onClick={handleAllocateNewYear}
                  style={{
                    flex: 1,
                    padding: '0.75rem',
                    background: '#10b981',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: 600
                  }}
                >
                  Tildel
                </button>
                <button
                  onClick={() => setShowAllocateModal(false)}
                  style={{
                    flex: 1,
                    padding: '0.75rem',
                    background: '#6b7280',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: 600
                  }}
                >
                  Avbryt
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Transfer Modal */}
      {showTransferModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '1rem'
        }}>
          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '2rem',
            maxWidth: '700px',
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>Overfør dager fra i år til neste år</h2>
              <button
                onClick={() => setShowTransferModal(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '0.5rem'
                }}
              >
                <X size={24} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
              {employees.map(employee => {
                const currentYear = new Date().getFullYear();
                const alloc = allocations.find(a => a.employeeId === employee.id && a.year === currentYear);
                const remaining = alloc?.remainingDays || 0;

                if (remaining <= 0) return null;

                return (
                  <div key={employee.id} style={{
                    padding: '1rem',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '1rem'
                  }}>
                    <div>
                      <strong>{employee.name || employee.displayName}</strong>
                      <br />
                      <span style={{ color: '#6b7280', fontSize: '0.875rem' }}>
                        Gjenstående: {remaining} dager
                      </span>
                    </div>
                    <input
                      type="number"
                      min="0"
                      max={remaining}
                      value={transferDays[employee.id] || 0}
                      onChange={(e) => {
                        const days = parseInt(e.target.value) || 0;
                        setTransferDays({
                          ...transferDays,
                          [employee.id]: Math.min(days, remaining)
                        });
                      }}
                      style={{
                        width: '100px',
                        padding: '0.5rem',
                        border: '2px solid #e5e7eb',
                        borderRadius: '8px',
                        fontSize: '0.875rem'
                      }}
                    />
                  </div>
                );
              })}
            </div>

            <div style={{ display: 'flex', gap: '1rem' }}>
              <button
                onClick={handleTransferDays}
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  background: '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: 600
                }}
              >
                Overfør
              </button>
              <button
                onClick={() => setShowTransferModal(false)}
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  background: '#6b7280',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: 600
                }}
              >
                Avbryt
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Overview Modal */}
      {showOverviewModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '1rem'
        }}>
          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '2rem',
            maxWidth: '900px',
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>Oversikt over alle avdelinger</h2>
              <button
                onClick={() => setShowOverviewModal(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '0.5rem'
                }}
              >
                <X size={24} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {Object.entries(overviewByDepartment).map(([dept, data]) => (
                <div key={dept} style={{
                  padding: '1.5rem',
                  border: '1px solid #e5e7eb',
                  borderRadius: '12px',
                  background: '#f9fafb'
                }}>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: '0 0 1rem 0', color: '#1f2937' }}>
                    {dept}
                  </h3>
                  <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1rem' }}>
                    <div>
                      <strong>Ansatte:</strong> {data.employees.length}
                    </div>
                    <div>
                      <strong>Totale feriedager:</strong> {data.totalDays}
                    </div>
                    <div>
                      <strong>Venter:</strong> {data.pending} | <strong>Godkjent:</strong> {data.approved}
                    </div>
                  </div>
                  <div style={{ marginTop: '1rem' }}>
                    <strong>Ferieoversikt:</strong>
                    <div style={{ marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {data.vacations.filter(v => v.status === 'approved').map(v => (
                        <div key={v.id} style={{
                          padding: '0.75rem',
                          background: 'white',
                          borderRadius: '6px',
                          border: '1px solid #e5e7eb',
                          fontSize: '0.875rem'
                        }}>
                          <strong>{v.employeeName}</strong>: {formatDate(v.startDate)} - {formatDate(v.endDate)} ({v.days} dager)
                        </div>
                      ))}
                      {data.vacations.filter(v => v.status === 'approved').length === 0 && (
                        <div style={{ color: '#6b7280', fontStyle: 'italic' }}>
                          Ingen godkjente ferier
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Edit Vacation Modal */}
      {showEditModal && editVacation && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '1rem'
        }}>
          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '2rem',
            maxWidth: '600px',
            width: '100%'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>Rediger eller slett ferie</h2>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditVacation(null);
                }}
                style={{
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '0.5rem'
                }}
              >
                <X size={24} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
              <div>
                <strong>Ansatt:</strong> {editVacation.employeeName}
              </div>
              <div>
                <strong>Nåværende periode:</strong> {formatDate(editVacation.startDate)} - {formatDate(editVacation.endDate)}
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>
                  Ny startdato
                </label>
                <input
                  type="date"
                  value={selectedStartDate ? selectedStartDate.toISOString().split('T')[0] : editVacation.startDate}
                  onChange={(e) => setSelectedStartDate(new Date(e.target.value))}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '2px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '0.875rem'
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>
                  Ny sluttdato
                </label>
                <input
                  type="date"
                  value={selectedEndDate ? selectedEndDate.toISOString().split('T')[0] : editVacation.endDate}
                  onChange={(e) => setSelectedEndDate(new Date(e.target.value))}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '2px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '0.875rem'
                  }}
                />
              </div>
              {selectedStartDate && selectedEndDate && (
                <div style={{
                  padding: '1rem',
                  background: '#eff6ff',
                  borderRadius: '8px',
                  border: '1px solid #3b82f6'
                }}>
                  <strong>Nye dager:</strong> {calculateDaysBetween(
                    selectedStartDate.toISOString().split('T')[0],
                    selectedEndDate.toISOString().split('T')[0]
                  )}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: '1rem' }}>
              <button
                onClick={handleEditVacation}
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  background: '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem'
                }}
              >
                <Save size={18} />
                Lagre endringer
              </button>
              <button
                onClick={() => {
                  setShowDeleteConfirm(true);
                }}
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  background: '#ef4444',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem'
                }}
              >
                <Trash2 size={18} />
                Slett
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1001,
          padding: '1rem'
        }}>
          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '2rem',
            maxWidth: '400px',
            width: '100%'
          }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: '0 0 1rem 0' }}>
              Bekreft sletting
            </h3>
            <p style={{ marginBottom: '1.5rem', color: '#6b7280' }}>
              Er du sikker på at du vil slette denne ferien? Denne handlingen kan ikke angres.
            </p>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button
                onClick={handleDeleteVacation}
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  background: '#ef4444',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: 600
                }}
              >
                Slett
              </button>
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                }}
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  background: '#6b7280',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: 600
                }}
              >
                Avbryt
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
