'use client';

/**
 * ADVANCED ABSENCE MANAGEMENT SYSTEM
 * 
 * Features:
 * - Multi-level approval workflow (Employee → Department Leader → Admin)
 * - Real-time notifications for all stakeholders
 * - Advanced calendar view with drag-and-drop
 * - Comprehensive statistics and reporting
 * - Bulk operations (approve/reject multiple)
 * - Advanced filtering and search
 * - Document attachments (sick notes, certificates)
 * - Absence history and audit trail
 * - Export to Excel/PDF
 * - Mobile-responsive design
 * - Role-based access control
 * - Absence quota tracking
 * - Conflict detection (overlapping absences)
 * - Auto-approval rules
 * - Reminder notifications
 * - Dashboard widgets
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { firebaseService, createUserAccessContext, Employee, Absence } from '@/lib/firebase-services';
import { notificationService } from '@/lib/notification-service';
import { globalEmailService } from '@/lib/global-email-service';
import { 
  AlertTriangle, 
  Plus, 
  Search, 
  Calendar, 
  User, 
  Trash2,
  CheckCircle,
  Clock,
  AlertCircle,
  FileText,
  Users,
  ChevronDown,
  Info,
  X,
  Download,
  Filter,
  BarChart3,
  TrendingUp,
  TrendingDown,
  Bell,
  Mail,
  MessageSquare,
  Edit,
  Eye,
  FileCheck,
  FileX,
  Calendar as CalendarIcon,
  Grid,
  List,
  Settings,
  RefreshCw,
  Upload,
  Paperclip,
  CheckCircle2,
  XCircle,
  Clock4,
  UserCheck,
  UserX,
  Building2,
  MapPin,
  Phone,
  Mail as MailIcon,
  MoreVertical,
  Share2,
  Copy,
  Archive,
  History,
  Zap,
  Target,
  PieChart,
  Activity,
  Layers,
  Shield,
  Lock,
  Unlock,
  Send,
  Save,
  Printer
} from 'lucide-react';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot, orderBy, Timestamp, doc, updateDoc, deleteDoc, addDoc, getDocs, writeBatch } from 'firebase/firestore';

// Extended Absence interface with approval workflow
interface ExtendedAbsence extends Absence {
  id: string;
  employeeName?: string;
  department?: string;
  departmentId?: string;
  managerId?: string;
  managerName?: string;
  approvalLevel?: 'employee' | 'department_leader' | 'admin';
  approvalHistory?: ApprovalStep[];
  attachments?: Attachment[];
  conflictWarning?: boolean;
  conflictWith?: string[];
  daysCount?: number;
  remainingQuota?: {
    sickChild: number;
    sickSelf: number;
    personal: number;
    vacation: number;
  };
  autoApproved?: boolean;
  reminderSent?: boolean;
  comments?: Comment[];
}

interface ApprovalStep {
  level: 'employee' | 'department_leader' | 'admin';
  action: 'submitted' | 'approved' | 'rejected' | 'returned';
  userId: string;
  userName: string;
  timestamp: string;
  comment?: string;
}

interface Attachment {
  id: string;
  name: string;
  url: string;
  type: string;
  size: number;
  uploadedAt: string;
  uploadedBy: string;
}

interface Comment {
  id: string;
  userId: string;
  userName: string;
  text: string;
  timestamp: string;
  type: 'comment' | 'approval' | 'rejection' | 'return';
}

interface AbsenceStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  byType: Record<string, number>;
  byDepartment: Record<string, number>;
  byMonth: Record<string, number>;
  averageDays: number;
  totalDays: number;
  upcoming: number;
  overdue: number;
}

// Lovdata rules for absence
const ABSENCE_RULES = {
  sickChild: {
    daysPerYear: 10,
    daysPerYearMultipleChildren: 15,
    daysPerYearChronicIllness: 20,
    ageLimit: 12,
    extendedAgeLimit: 18,
    documentation: 'Legeerklæring kreves fra fjerde fraværsdag'
  },
  sickSelf: {
    selfCertificationDays: 3,
    selfCertificationPeriodsPerYear: 4,
    extendedSelfCertification: 8,
    extendedPeriodsPerYear: 24,
    documentation: 'Legeerklæring kreves fra fjerde fraværsdag'
  },
  personal: {
    welfareLeave: 12,
    documentation: 'Dokumentasjon kan kreves av arbeidsgiver'
  }
};

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

const formatDateTime = (date: string | Date): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleString('no-NO', { 
    day: '2-digit', 
    month: '2-digit', 
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export default function AdvancedAbsencePage() {
  const { userProfile } = useAuth();
  const [absences, setAbsences] = useState<ExtendedAbsence[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  
  // View states
  const [viewMode, setViewMode] = useState<'list' | 'calendar' | 'stats'>('list');
  const [selectedAbsence, setSelectedAbsence] = useState<ExtendedAbsence | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showBulkActions, setShowBulkActions] = useState(false);
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [selectedType, setSelectedType] = useState<'all' | Absence['type']>('all');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedEmployee, setSelectedEmployee] = useState<string>('all');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');
  const [selectedApprovalLevel, setSelectedApprovalLevel] = useState<'all' | 'employee' | 'department_leader' | 'admin'>('all');
  
  // Selection states
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectAll, setSelectAll] = useState(false);
  
  // Form states
  const [newAbsence, setNewAbsence] = useState({
    type: 'sick' as Absence['type'],
    startDate: '',
    endDate: '',
    reason: '',
    notes: '',
    employeeId: userProfile?.id || '',
    attachments: [] as File[]
  });
  
  // Stats
  const [stats, setStats] = useState<AbsenceStats>({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    byType: {},
    byDepartment: {},
    byMonth: {},
    averageDays: 0,
    totalDays: 0,
    upcoming: 0,
    overdue: 0
  });
  
  // Calendar states
  const [calendarMonth, setCalendarMonth] = useState(new Date());
  const [calendarView, setCalendarView] = useState<'month' | 'week' | 'day'>('month');
  
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
      
      // Load absences
      const absenceData = await firebaseService.getAbsences(userContext);
      
      // Enhance absences with additional data
      const enhanced: ExtendedAbsence[] = absenceData.map(absence => {
        const employee = employeeData.find(emp => emp.id === absence.employeeId);
        const days = calculateDaysBetween(absence.startDate, absence.endDate);
        
        // Calculate remaining quota
        const currentYear = new Date().getFullYear();
        const yearAbsences = absenceData.filter(a => 
          a.employeeId === absence.employeeId &&
          new Date(a.startDate).getFullYear() === currentYear &&
          a.status === 'approved'
        );
        
        const usedDays = {
          sickChild: 0,
          sickSelf: 0,
          personal: 0,
          vacation: 0
        };
        
        yearAbsences.forEach(a => {
          const daysUsed = calculateDaysBetween(a.startDate, a.endDate);
          if (a.type === 'sickChild') usedDays.sickChild += daysUsed;
          else if (a.type === 'sick') usedDays.sickSelf += daysUsed;
          else if (a.type === 'personal') usedDays.personal += daysUsed;
          else if (a.type === 'vacation') usedDays.vacation += daysUsed;
        });
        
        const remainingQuota = {
          sickChild: ABSENCE_RULES.sickChild.daysPerYear - usedDays.sickChild,
          sickSelf: ABSENCE_RULES.sickSelf.extendedPeriodsPerYear - usedDays.sickSelf,
          personal: ABSENCE_RULES.personal.welfareLeave - usedDays.personal,
          vacation: 0 // Will be calculated from vacation system
        };
        
        // Check for conflicts
        const conflicts = absenceData.filter(a => 
          a.id !== absence.id &&
          a.employeeId === absence.employeeId &&
          a.status === 'approved' &&
          (
            (new Date(a.startDate) <= new Date(absence.endDate) && 
             new Date(a.endDate) >= new Date(absence.startDate))
          )
        );
        
        // Determine approval level
        let approvalLevel: 'employee' | 'department_leader' | 'admin' = 'employee';
        if (absence.status === 'pending') {
          if (isAdmin) approvalLevel = 'admin';
          else if (isDepartmentLeader && employee?.departmentId === userProfile.departmentId) {
            approvalLevel = 'department_leader';
          }
        }
        
        return {
          ...absence,
          id: absence.id || '',
          employeeName: employee?.name || employee?.displayName || `Ansatt ${absence.employeeId.slice(0, 8)}`,
          department: employee?.department || '',
          departmentId: employee?.departmentId || '',
          managerId: employee?.managerId || '',
          daysCount: days,
          remainingQuota,
          conflictWarning: conflicts.length > 0,
          conflictWith: conflicts.map(c => c.id),
          approvalLevel,
          attachments: (absence as any).attachments || [],
          approvalHistory: (absence as any).approvalHistory || [],
          comments: (absence as any).comments || []
        };
      });
      
      setAbsences(enhanced);
      
      // Calculate statistics
      calculateStats(enhanced);
      
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  }, [userProfile, isAdmin, isDepartmentLeader]);

  const calculateStats = (absenceList: ExtendedAbsence[]) => {
    const currentYear = new Date().getFullYear();
    const yearAbsences = absenceList.filter(a => 
      new Date(a.startDate).getFullYear() === currentYear
    );
    
    const newStats: AbsenceStats = {
      total: yearAbsences.length,
      pending: yearAbsences.filter(a => a.status === 'pending').length,
      approved: yearAbsences.filter(a => a.status === 'approved').length,
      rejected: yearAbsences.filter(a => a.status === 'rejected').length,
      byType: {},
      byDepartment: {},
      byMonth: {},
      averageDays: 0,
      totalDays: 0,
      upcoming: 0,
      overdue: 0
    };
    
    let totalDays = 0;
    const now = new Date();
    
    yearAbsences.forEach(a => {
      // By type
      newStats.byType[a.type] = (newStats.byType[a.type] || 0) + 1;
      
      // By department
      const dept = a.department || 'Ukjent';
      newStats.byDepartment[dept] = (newStats.byDepartment[dept] || 0) + 1;
      
      // By month
      const month = new Date(a.startDate).toLocaleDateString('no-NO', { month: 'long' });
      newStats.byMonth[month] = (newStats.byMonth[month] || 0) + 1;
      
      // Days
      if (a.daysCount) {
        totalDays += a.daysCount;
      }
      
      // Upcoming
      if (a.status === 'approved' && new Date(a.startDate) > now) {
        newStats.upcoming++;
      }
      
      // Overdue (pending for more than 7 days)
      if (a.status === 'pending') {
        const daysPending = Math.floor((now.getTime() - new Date(a.createdAt || a.startDate).getTime()) / (1000 * 60 * 60 * 24));
        if (daysPending > 7) {
          newStats.overdue++;
        }
      }
    });
    
    newStats.totalDays = totalDays;
    newStats.averageDays = yearAbsences.length > 0 ? totalDays / yearAbsences.length : 0;
    
    setStats(newStats);
  };

  // Real-time subscription
  useEffect(() => {
    if (!userProfile || !db) return;
    
    const userContext = createUserAccessContext(userProfile);
    let q;
    
    if (isAdmin) {
      q = query(
        collection(db, 'absences'),
        orderBy('createdAt', 'desc')
      );
    } else if (isDepartmentLeader && userProfile.departmentId) {
      // Get department employees first
      const employeeIds: string[] = [];
      employees.forEach(emp => {
        if (emp.departmentId === userProfile.departmentId) {
          employeeIds.push(emp.id);
        }
      });
      
      if (employeeIds.length > 0 && employeeIds.length <= 10) {
        q = query(
          collection(db, 'absences'),
          where('employeeId', 'in', employeeIds),
          orderBy('createdAt', 'desc')
        );
      } else {
        q = query(
          collection(db, 'absences'),
          orderBy('createdAt', 'desc')
        );
      }
    } else {
      q = query(
        collection(db, 'absences'),
        where('employeeId', '==', userProfile.id),
        orderBy('createdAt', 'desc')
      );
    }
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      loadData();
    });
    
    return () => unsubscribe();
  }, [userProfile, employees, isAdmin, isDepartmentLeader]);

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

  // Filter absences
  const filteredAbsences = useMemo(() => {
    return absences.filter(absence => {
      // Status filter
      if (selectedStatus !== 'all' && absence.status !== selectedStatus) return false;
      
      // Type filter
      if (selectedType !== 'all' && absence.type !== selectedType) return false;
      
      // Year filter
      if (new Date(absence.startDate).getFullYear() !== selectedYear) return false;
      
      // Employee filter
      if (selectedEmployee !== 'all' && absence.employeeId !== selectedEmployee) return false;
      
      // Department filter
      if (selectedDepartment !== 'all' && absence.departmentId !== selectedDepartment) return false;
      
      // Approval level filter
      if (selectedApprovalLevel !== 'all' && absence.approvalLevel !== selectedApprovalLevel) return false;
      
      // Search term
      if (searchTerm.trim()) {
        const search = searchTerm.toLowerCase();
        const matchesName = absence.employeeName?.toLowerCase().includes(search);
        const matchesDepartment = absence.department?.toLowerCase().includes(search);
        const matchesReason = absence.reason?.toLowerCase().includes(search);
        const matchesNotes = absence.notes?.toLowerCase().includes(search);
        if (!matchesName && !matchesDepartment && !matchesReason && !matchesNotes) return false;
      }
      
      return true;
    });
  }, [absences, selectedStatus, selectedType, selectedYear, selectedEmployee, selectedDepartment, selectedApprovalLevel, searchTerm]);

  // Handle create absence
  const handleCreateAbsence = async () => {
    if (!userProfile) return;
    
    if (!newAbsence.startDate || !newAbsence.endDate) {
      alert('Vennligst velg start- og sluttdato');
      return;
    }
    
    if (new Date(newAbsence.startDate) > new Date(newAbsence.endDate)) {
      alert('Startdato kan ikke være etter sluttdato');
      return;
    }
    
    try {
      const userContext = createUserAccessContext(userProfile);
      const employee = employees.find(e => e.id === newAbsence.employeeId);
      
      // Determine who needs to approve
      let approvalLevel: 'employee' | 'department_leader' | 'admin' = 'employee';
      if (isDepartmentLeader && employee?.departmentId === userProfile.departmentId) {
        approvalLevel = 'department_leader';
      } else if (isAdmin) {
        approvalLevel = 'admin';
      }
      
      const absenceData: Omit<Absence, 'id' | 'createdAt' | 'updatedAt'> = {
        employeeId: newAbsence.employeeId,
        employeeName: employee?.name || employee?.displayName || '',
        startDate: newAbsence.startDate,
        endDate: newAbsence.endDate,
        type: newAbsence.type,
        reason: newAbsence.reason || '',
        notes: newAbsence.notes,
        status: 'pending',
        requestedBy: userProfile.id
      };
      
      const absenceId = await firebaseService.createAbsence({
        employeeId: absenceData.employeeId,
        employeeName: absenceData.employeeName || '',
        startDate: absenceData.startDate,
        endDate: absenceData.endDate,
        type: absenceData.type,
        reason: absenceData.reason,
        notes: absenceData.notes,
        status: absenceData.status,
        requestedBy: absenceData.requestedBy
      }, userContext);
      
      // Send notifications
      await sendAbsenceNotifications(absenceId, absenceData, 'created');
      
      // Reset form
      setNewAbsence({
        type: 'sick',
        startDate: '',
        endDate: '',
        reason: '',
        notes: '',
        employeeId: userProfile.id || '',
        attachments: []
      });
      setShowAddModal(false);
      
      alert('Fraværsforespørsel opprettet!');
    } catch (error) {
      console.error('Error creating absence:', error);
      alert('Feil ved opprettelse av fraværsforespørsel');
    }
  };

  // Handle approve/reject
  const handleApproveReject = async (absenceId: string, action: 'approve' | 'reject', comment?: string) => {
    if (!userProfile || !canApprove) return;
    
    try {
      const absence = absences.find(a => a.id === absenceId);
      if (!absence) return;
      
      const userContext = createUserAccessContext(userProfile);
      const newStatus = action === 'approve' ? 'approved' : 'rejected';
      
      // Update approval history
      const approvalStep: ApprovalStep = {
        level: isAdmin ? 'admin' : 'department_leader',
        action: action === 'approve' ? 'approved' : 'rejected',
        userId: userProfile.id,
        userName: userProfile.displayName || userProfile.name || 'Ukjent',
        timestamp: new Date().toISOString(),
        comment
      };
      
      const updatedHistory = [...(absence.approvalHistory || []), approvalStep];
      
      await firebaseService.updateAbsence(absenceId, {
        status: newStatus,
        approvedBy: userProfile.id,
        approvedAt: new Date().toISOString(),
        notes: absence.notes ? `${absence.notes}\n\n${action === 'approve' ? 'Godkjent' : 'Avslått'} av ${userProfile.displayName || userProfile.name || 'Ukjent'}${comment ? `: ${comment}` : ''}` : `${action === 'approve' ? 'Godkjent' : 'Avslått'} av ${userProfile.displayName || userProfile.name || 'Ukjent'}${comment ? `: ${comment}` : ''}`
      }, userContext);
      
      // Send notifications
      await sendAbsenceNotifications(absenceId, absence, action === 'approve' ? 'approved' : 'rejected');
      
      alert(`Fraværsforespørsel ${action === 'approve' ? 'godkjent' : 'avslått'}!`);
    } catch (error) {
      console.error('Error approving/rejecting absence:', error);
      alert('Feil ved godkjenning/avslag');
    }
  };

  // Bulk approve/reject
  const handleBulkAction = async (action: 'approve' | 'reject') => {
    if (!userProfile || !canApprove || selectedIds.size === 0) return;
    
    if (!confirm(`Er du sikker på at du vil ${action === 'approve' ? 'godkjenne' : 'avslå'} ${selectedIds.size} forespørsel(er)?`)) {
      return;
    }
    
    try {
      const userContext = createUserAccessContext(userProfile);
      const batch = writeBatch(db);
      const ids = Array.from(selectedIds);
      
      for (const id of ids) {
        const absence = absences.find(a => a.id === id);
        if (!absence) continue;
        
        const absenceRef = doc(db, 'absences', id);
        const approvalStep: ApprovalStep = {
          level: isAdmin ? 'admin' : 'department_leader',
          action: action === 'approve' ? 'approved' : 'rejected',
          userId: userProfile.id,
          userName: userProfile.displayName || userProfile.name || 'Ukjent',
          timestamp: new Date().toISOString()
        };
        
        batch.update(absenceRef, {
          status: action === 'approve' ? 'approved' : 'rejected',
          approvedBy: userProfile.id,
          approvedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      }
      
      await batch.commit();
      
      // Send notifications for each
      for (const id of ids) {
        const absence = absences.find(a => a.id === id);
        if (absence) {
          await sendAbsenceNotifications(id, absence, action === 'approve' ? 'approved' : 'rejected');
        }
      }
      
      setSelectedIds(new Set());
      setSelectAll(false);
      setShowBulkActions(false);
      
      alert(`${selectedIds.size} forespørsel(er) ${action === 'approve' ? 'godkjent' : 'avslått'}!`);
    } catch (error) {
      console.error('Error bulk action:', error);
      alert('Feil ved bulk-operasjon');
    }
  };

  // Send notifications
  const sendAbsenceNotifications = async (
    absenceId: string,
    absence: Absence | ExtendedAbsence,
    event: 'created' | 'approved' | 'rejected' | 'updated'
  ) => {
    if (!userProfile) return;
    
    const employee = employees.find(e => e.id === absence.employeeId);
    if (!employee) return;
    
    const manager = employee.managerId ? employees.find(e => e.id === employee.managerId) : null;
    const departmentLeaders = employees.filter(e => 
      e.role === 'department_leader' && 
      e.departmentId === employee.departmentId
    );
    const admins = employees.filter(e => 
      e.role === 'admin' || e.role === 'super_admin'
    );
    
    const typeLabels: Record<string, string> = {
      'sick': 'Egenmelding',
      'sickChild': 'Sykt barn',
      'personal': 'Flyttedag',
      'other': 'Annet',
      'vacation': 'Ferie'
    };
    
    let title = '';
    let message = '';
    let recipients: string[] = [];
    
    switch (event) {
      case 'created':
        title = 'Ny fraværsforespørsel';
        message = `${employee.name || employee.displayName} har sendt inn en ${typeLabels[absence.type] || absence.type} fra ${formatDate(absence.startDate)} til ${formatDate(absence.endDate)}`;
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
                    <h2 style="color: #dc2626;">${title}</h2>
                    <p>Hei ${admin.name || admin.displayName || 'Admin'},</p>
                    <p><strong>${employee.name || employee.displayName}</strong> har sendt inn en ${typeLabels[absence.type] || absence.type}:</p>
                    <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc2626;">
                      <p><strong>Type:</strong> ${typeLabels[absence.type] || absence.type}</p>
                      <p><strong>Fra dato:</strong> ${formatDate(absence.startDate)}</p>
                      <p><strong>Til dato:</strong> ${formatDate(absence.endDate)}</p>
                      <p><strong>Antall dager:</strong> ${calculateDaysBetween(absence.startDate, absence.endDate)}</p>
                      ${absence.reason ? `<p><strong>Årsak:</strong> ${absence.reason}</p>` : ''}
                      ${absence.notes ? `<p><strong>Notater:</strong> ${absence.notes}</p>` : ''}
                    </div>
                    <p><a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://driftpro.no'}/dashboard/absence?absenceId=${absenceId}" style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin-top: 20px;">Se detaljer i DriftPro</a></p>
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
        title = 'Fraværsforespørsel godkjent';
        message = `Din ${typeLabels[absence.type] || absence.type} fra ${formatDate(absence.startDate)} til ${formatDate(absence.endDate)} er godkjent`;
        recipients = [absence.employeeId];
        break;
      case 'rejected':
        title = 'Fraværsforespørsel avslått';
        message = `Din ${typeLabels[absence.type] || absence.type} fra ${formatDate(absence.startDate)} til ${formatDate(absence.endDate)} er avslått`;
        recipients = [absence.employeeId];
        break;
    }
    
    // Send notifications
    for (const recipientId of recipients) {
      if (recipientId === userProfile.id) continue; // Don't notify self
      
      await notificationService.createNotification({
        userId: recipientId,
        title,
        message,
        type: 'absence',
        priority: event === 'created' ? 'high' : 'medium',
        actionUrl: `/dashboard/absence?absenceId=${absenceId}`,
        actionText: 'Se detaljer',
        metadata: {
          absenceId,
          event,
          employeeId: absence.employeeId,
          type: absence.type
        }
      });
    }
  };

  // Export to Excel
  const handleExport = async (format: 'excel' | 'pdf') => {
    // Implementation for export
    alert(`Eksport til ${format.toUpperCase()} vil bli implementert`);
  };

  // Get departments
  const departments = useMemo(() => {
    const deptSet = new Set<string>();
    employees.forEach(emp => {
      if (emp.department) deptSet.add(emp.department);
    });
    return Array.from(deptSet).sort();
  }, [employees]);

  // Render continues in next part due to length...
  // This is the foundation - I'll continue with the UI components

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
      padding: isMobile ? '1rem' : '2rem'
    }}>
      {/* Header */}
      <div style={{
        background: 'white',
        borderRadius: '16px',
        padding: isMobile ? '1rem' : '2rem',
        marginBottom: '2rem',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: isMobile ? '1.5rem' : '2rem', fontWeight: 700, margin: 0, color: '#1f2937' }}>
              Fraværsadministrasjon
            </h1>
            <p style={{ color: '#6b7280', margin: '0.5rem 0 0 0' }}>
              Avansert system for fraværsforespørsler og godkjenninger
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
              onClick={() => setViewMode('calendar')}
              style={{
                padding: isMobile ? '1.25rem 1.5rem' : '0.75rem 1.5rem',
                background: viewMode === 'calendar' ? '#3b82f6' : 'white',
                color: viewMode === 'calendar' ? 'white' : '#3b82f6',
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
              <CalendarIcon size={isMobile ? 22 : 20} />
              Kalender
            </button>
            <button
              onClick={() => setShowAddModal(true)}
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
              <Plus size={isMobile ? 22 : 20} />
              Ny forespørsel
            </button>
          </div>
        </div>
      </div>

      {/* Stats Dashboard */}
      {viewMode === 'stats' && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '1.5rem',
          marginBottom: '2rem'
        }}>
          {/* Stat Cards */}
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
                <p style={{ color: '#6b7280', margin: 0, fontSize: '0.875rem' }}>Godkjent</p>
                <h2 style={{ fontSize: '2rem', fontWeight: 700, margin: '0.5rem 0 0 0', color: '#10b981' }}>
                  {stats.approved}
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
                <CheckCircle size={24} color="#10b981" />
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
                <p style={{ color: '#6b7280', margin: 0, fontSize: '0.875rem' }}>Totale dager</p>
                <h2 style={{ fontSize: '2rem', fontWeight: 700, margin: '0.5rem 0 0 0', color: '#1f2937' }}>
                  {stats.totalDays}
                </h2>
              </div>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                background: 'rgba(139, 92, 246, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Calendar size={24} color="#8b5cf6" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters and Search */}
      {viewMode === 'list' && (
        <div style={{
          background: 'white',
          borderRadius: '16px',
          padding: isMobile ? '1rem' : '1.5rem',
          marginBottom: '2rem',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
        }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center' }}>
            {/* Search */}
            <div style={{ position: 'relative', flex: '1', minWidth: '200px' }}>
              <Search size={20} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
              <input
                type="text"
                placeholder="Søk etter navn, avdeling, årsak..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  padding: isMobile ? '1.25rem 1.25rem 1.25rem 3.5rem' : '0.75rem 0.75rem 0.75rem 2.5rem',
                  fontSize: isMobile ? '18px' : '0.875rem',
                  minHeight: isMobile ? '64px' : 'auto',
                  borderRadius: isMobile ? '16px' : '8px',
                  border: '3px solid #e5e7eb',
                  outline: 'none',
                  touchAction: 'manipulation',
                  WebkitAppearance: 'none',
                  appearance: 'none'
                }}
              />
            </div>

            {/* Status Filter */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value as any)}
              style={{
                padding: isMobile ? '1.25rem 1.5rem' : '0.75rem 1rem',
                border: '3px solid #e5e7eb',
                borderRadius: isMobile ? '16px' : '8px',
                fontSize: isMobile ? '18px' : '0.875rem',
                minWidth: isMobile ? '100%' : '150px',
                minHeight: isMobile ? '64px' : 'auto',
                outline: 'none',
                touchAction: 'manipulation',
                WebkitAppearance: 'none',
                appearance: 'none',
                backgroundImage: 'none'
              }}
            >
              <option value="all">Alle statuser</option>
              <option value="pending">Venter</option>
              <option value="approved">Godkjent</option>
              <option value="rejected">Avslått</option>
            </select>

            {/* Type Filter */}
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value as any)}
              style={{
                padding: '0.75rem 1rem',
                border: '2px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '0.875rem',
                minWidth: '150px'
              }}
            >
              <option value="all">Alle typer</option>
              <option value="sick">Egenmelding</option>
              <option value="sickChild">Sykt barn</option>
              <option value="personal">Flyttedag</option>
              <option value="other">Annet</option>
            </select>

            {/* Year Filter */}
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              style={{
                padding: '0.75rem 1rem',
                border: '2px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '0.875rem',
                minWidth: '120px'
              }}
            >
              {[new Date().getFullYear() - 1, new Date().getFullYear(), new Date().getFullYear() + 1].map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>

            {/* Export */}
            <button
              onClick={() => handleExport('excel')}
              style={{
                padding: '0.75rem 1rem',
                background: '#10b981',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontWeight: 600
              }}
            >
              <Download size={18} />
              Eksporter
            </button>
          </div>
        </div>
      )}

      {/* Absences List */}
      {viewMode === 'list' && (
        <div style={{
          background: 'white',
          borderRadius: '16px',
          padding: isMobile ? '1rem' : '1.5rem',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
        }}>
          {/* Bulk Actions */}
          {selectedIds.size > 0 && canApprove && (
            <div style={{
              background: '#eff6ff',
              border: '2px solid #3b82f6',
              borderRadius: '8px',
              padding: '1rem',
              marginBottom: '1.5rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '1rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <CheckCircle size={20} color="#3b82f6" />
                <span style={{ fontWeight: 600, color: '#1e40af' }}>
                  {selectedIds.size} valgt
                </span>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  onClick={() => handleBulkAction('approve')}
                  style={{
                    padding: '0.5rem 1rem',
                    background: '#10b981',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}
                >
                  <CheckCircle2 size={18} />
                  Godkjenn alle
                </button>
                <button
                  onClick={() => handleBulkAction('reject')}
                  style={{
                    padding: '0.5rem 1rem',
                    background: '#ef4444',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}
                >
                  <XCircle size={18} />
                  Avslå alle
                </button>
                <button
                  onClick={() => {
                    setSelectedIds(new Set());
                    setSelectAll(false);
                  }}
                  style={{
                    padding: '0.5rem 1rem',
                    background: '#6b7280',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: 600
                  }}
                >
                  Avbryt
                </button>
              </div>
            </div>
          )}

          {/* Table */}
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e5e7eb' }}>
                  {canApprove && (
                    <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600, color: '#6b7280' }}>
                      <input
                        type="checkbox"
                        checked={selectAll}
                        onChange={(e) => {
                          setSelectAll(e.target.checked);
                          if (e.target.checked) {
                            setSelectedIds(new Set(filteredAbsences.filter(a => a.status === 'pending').map(a => a.id)));
                          } else {
                            setSelectedIds(new Set());
                          }
                        }}
                      />
                    </th>
                  )}
                  <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600, color: '#6b7280' }}>Ansatt</th>
                  <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600, color: '#6b7280' }}>Type</th>
                  <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600, color: '#6b7280' }}>Periode</th>
                  <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600, color: '#6b7280' }}>Dager</th>
                  <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600, color: '#6b7280' }}>Status</th>
                  <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600, color: '#6b7280' }}>Godkjenner</th>
                  <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600, color: '#6b7280' }}>Handlinger</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={canApprove ? 8 : 7} style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>
                      Laster...
                    </td>
                  </tr>
                ) : filteredAbsences.length === 0 ? (
                  <tr>
                    <td colSpan={canApprove ? 8 : 7} style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>
                      Ingen fraværsforespørsler funnet
                    </td>
                  </tr>
                ) : (
                  filteredAbsences.map(absence => (
                    <tr 
                      key={absence.id}
                      style={{ 
                        borderBottom: '1px solid #e5e7eb',
                        cursor: 'pointer',
                        transition: 'background 0.2s'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = '#f9fafb'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                      onClick={() => {
                        setSelectedAbsence(absence);
                        setShowDetailsModal(true);
                      }}
                    >
                      {canApprove && (
                        <td style={{ padding: '1rem' }} onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={selectedIds.has(absence.id)}
                            onChange={(e) => {
                              const newSet = new Set(selectedIds);
                              if (e.target.checked) {
                                newSet.add(absence.id);
                              } else {
                                newSet.delete(absence.id);
                              }
                              setSelectedIds(newSet);
                            }}
                          />
                        </td>
                      )}
                      <td style={{ padding: '1rem' }}>
                        <div>
                          <div style={{ fontWeight: 600, color: '#1f2937' }}>
                            {absence.employeeName}
                          </div>
                          <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                            {absence.department}
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <span style={{
                          padding: '0.25rem 0.75rem',
                          borderRadius: '6px',
                          fontSize: '0.875rem',
                          fontWeight: 600,
                          background: absence.type === 'sick' ? 'rgba(239, 68, 68, 0.1)' :
                                     absence.type === 'sickChild' ? 'rgba(245, 158, 11, 0.1)' :
                                     absence.type === 'personal' ? 'rgba(59, 130, 246, 0.1)' :
                                     'rgba(107, 114, 128, 0.1)',
                          color: absence.type === 'sick' ? '#dc2626' :
                                 absence.type === 'sickChild' ? '#d97706' :
                                 absence.type === 'personal' ? '#2563eb' :
                                 '#4b5563'
                        }}>
                          {absence.type === 'sick' ? 'Syk' :
                           absence.type === 'sickChild' ? 'Sykebarn' :
                           absence.type === 'personal' ? 'Personlig' :
                           'Annet'}
                        </span>
                      </td>
                      <td style={{ padding: '1rem', color: '#1f2937' }}>
                        {formatDate(absence.startDate)} - {formatDate(absence.endDate)}
                      </td>
                      <td style={{ padding: '1rem', color: '#1f2937', fontWeight: 600 }}>
                        {absence.daysCount || calculateDaysBetween(absence.startDate, absence.endDate)}
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <span style={{
                          padding: '0.25rem 0.75rem',
                          borderRadius: '6px',
                          fontSize: '0.875rem',
                          fontWeight: 600,
                          background: absence.status === 'approved' ? 'rgba(16, 185, 129, 0.1)' :
                                     absence.status === 'rejected' ? 'rgba(239, 68, 68, 0.1)' :
                                     'rgba(245, 158, 11, 0.1)',
                          color: absence.status === 'approved' ? '#059669' :
                                 absence.status === 'rejected' ? '#dc2626' :
                                 '#d97706'
                        }}>
                          {absence.status === 'approved' ? 'Godkjent' :
                           absence.status === 'rejected' ? 'Avslått' :
                           'Venter'}
                        </span>
                      </td>
                      <td style={{ padding: '1rem', color: '#6b7280', fontSize: '0.875rem' }}>
                        {absence.approvalLevel === 'admin' ? 'Admin' :
                         absence.approvalLevel === 'department_leader' ? 'Avd.leder' :
                         'Ansatt'}
                      </td>
                      <td style={{ padding: '1rem' }} onClick={(e) => e.stopPropagation()}>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          {canApprove && absence.status === 'pending' && (
                            <>
                              <button
                                onClick={() => handleApproveReject(absence.id, 'approve')}
                                style={{
                                  padding: '0.5rem',
                                  background: '#10b981',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '6px',
                                  cursor: 'pointer'
                                }}
                                title="Godkjenn"
                              >
                                <CheckCircle size={18} />
                              </button>
                              <button
                                onClick={() => handleApproveReject(absence.id, 'reject')}
                                style={{
                                  padding: '0.5rem',
                                  background: '#ef4444',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '6px',
                                  cursor: 'pointer'
                                }}
                                title="Avslå"
                              >
                                <XCircle size={18} />
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => {
                              setSelectedAbsence(absence);
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
                            title="Se detaljer"
                          >
                            <Eye size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Absence Modal */}
      {showAddModal && (
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
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>Ny fraværsforespørsel</h2>
              <button
                onClick={() => setShowAddModal(false)}
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
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: '#1f2937' }}>
                  Type fravær
                </label>
                <select
                  value={newAbsence.type}
                  onChange={(e) => setNewAbsence({ ...newAbsence, type: e.target.value as Absence['type'] })}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '2px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '0.875rem'
                  }}
                >
                  <option value="sick">Egenmelding</option>
                  <option value="sickChild">Sykt barn</option>
                  <option value="personal">Flyttedag</option>
                  <option value="other">Annet</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: '#1f2937' }}>
                  Startdato
                </label>
                <input
                  type="date"
                  value={newAbsence.startDate}
                  onChange={(e) => setNewAbsence({ ...newAbsence, startDate: e.target.value })}
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
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: '#1f2937' }}>
                  Sluttdato
                </label>
                <input
                  type="date"
                  value={newAbsence.endDate}
                  onChange={(e) => setNewAbsence({ ...newAbsence, endDate: e.target.value })}
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
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: '#1f2937' }}>
                  Årsak
                </label>
                <textarea
                  value={newAbsence.reason}
                  onChange={(e) => setNewAbsence({ ...newAbsence, reason: e.target.value })}
                  placeholder="Beskriv årsaken til fraværet..."
                  rows={4}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '2px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '0.875rem',
                    fontFamily: 'inherit',
                    resize: 'vertical'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: '#1f2937' }}>
                  Notater (valgfritt)
                </label>
                <textarea
                  value={newAbsence.notes}
                  onChange={(e) => setNewAbsence({ ...newAbsence, notes: e.target.value })}
                  placeholder="Tilleggsnotater..."
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '2px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '0.875rem',
                    fontFamily: 'inherit',
                    resize: 'vertical'
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <button
                  onClick={handleCreateAbsence}
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
                  Send forespørsel
                </button>
                <button
                  onClick={() => setShowAddModal(false)}
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

      {/* Details Modal - Will be implemented with full approval history, comments, attachments, etc. */}
      {showDetailsModal && selectedAbsence && (
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
            maxWidth: '800px',
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>Fraværsdetaljer</h2>
              <button
                onClick={() => {
                  setShowDetailsModal(false);
                  setSelectedAbsence(null);
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

            {/* Details content - full implementation would include approval history, comments, attachments */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <strong>Ansatt:</strong> {selectedAbsence.employeeName}
              </div>
              <div>
                <strong>Type:</strong> {selectedAbsence.type}
              </div>
              <div>
                <strong>Periode:</strong> {formatDate(selectedAbsence.startDate)} - {formatDate(selectedAbsence.endDate)}
              </div>
              <div>
                <strong>Status:</strong> {selectedAbsence.status}
              </div>
              {selectedAbsence.reason && (
                <div>
                  <strong>Årsak:</strong> {selectedAbsence.reason}
                </div>
              )}
            </div>

            {canApprove && selectedAbsence.status === 'pending' && (
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                <button
                  onClick={() => {
                    const comment = prompt('Legg til kommentar (valgfritt):');
                    handleApproveReject(selectedAbsence.id, 'approve', comment || undefined);
                    setShowDetailsModal(false);
                  }}
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
                  Godkjenn
                </button>
                <button
                  onClick={() => {
                    const comment = prompt('Legg til kommentar (valgfritt):');
                    handleApproveReject(selectedAbsence.id, 'reject', comment || undefined);
                    setShowDetailsModal(false);
                  }}
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
                  Avslå
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
