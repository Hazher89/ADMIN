'use client';

import React, { useState, useEffect } from 'react';
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
  Filter,
  X,
  Save,
  Loader2
} from 'lucide-react';
import { Employee, Absence as AbsenceType, createUserAccessContext } from '@/lib/firebase-services';
import { globalEmailService } from '@/lib/global-email-service';
import { firebaseService } from '@/lib/firebase-services';

// Lovdata rules for absence
const ABSENCE_RULES = {
  sickChild: {
    daysPerYear: 10, // 10 dager per år for barn under 12 år
    daysPerYearMultipleChildren: 15, // 15 dager hvis flere barn
    daysPerYearChronicIllness: 20, // 20 dager hvis kronisk sykdom
    ageLimit: 12, // Barn under 12 år
    extendedAgeLimit: 18, // Utvidet til 18 år ved kronisk sykdom
    documentation: 'Legeerklæring kreves fra fjerde fraværsdag'
  },
  sickSelf: {
    selfCertificationDays: 3, // Egenmelding i opptil 3 dager
    selfCertificationPeriodsPerYear: 4, // 4 egenmeldingsperioder per år
    extendedSelfCertification: 8, // IA-bedrifter: 8 dager per periode
    extendedPeriodsPerYear: 24, // IA-bedrifter: 24 dager totalt per år
    documentation: 'Legeerklæring kreves fra fjerde fraværsdag'
  },
  personal: {
    welfareLeave: 12, // Velferdspermisjon, typisk inntil 12 dager per år
    documentation: 'Dokumentasjon kan kreves av arbeidsgiver'
  }
};

// Calculate days between two dates
const calculateDaysBetween = (startDate: string, endDate: string) => {
  if (!startDate || !endDate) return 0;
  
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  // Reset time part to ensure we're only counting days
  start.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);
  
  // Calculate difference in days
  const diffTime = Math.abs(end.getTime() - start.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 to include both start and end days
  
  return diffDays;
};

// Calculate rolling year period (from date to same date next year)
// Uses the day and month of the reference date, not calendar year
const getRollingYearPeriod = (referenceDate: Date = new Date()) => {
  const today = new Date(referenceDate);
  const day = today.getDate();
  const month = today.getMonth();
  const year = today.getFullYear();
  
  const startDate = new Date(year, month, day);
  startDate.setHours(0, 0, 0, 0);
  
  const endDate = new Date(year + 1, month, day);
  endDate.setHours(23, 59, 59, 999);
  
  return { startDate, endDate };
};

// Check if a date is within rolling year period
const isWithinRollingYear = (absenceDate: Date, referenceDate: Date) => {
  const { startDate, endDate } = getRollingYearPeriod(referenceDate);
  return absenceDate >= startDate && absenceDate < endDate;
};

// Calculate used days for an employee in rolling year period
// Rolling year is calculated from today's date (day/month) to same date next year
const calculateUsedDaysInRollingYear = (employeeId: string, absences: AbsenceType[], referenceDate: Date = new Date()) => {
  const { startDate, endDate } = getRollingYearPeriod(referenceDate);
  
  return absences
    .filter(absence => {
      if (absence.employeeId !== employeeId) return false;
      if (absence.status === 'rejected') return false;
      
      const absenceStart = new Date(absence.startDate);
      absenceStart.setHours(0, 0, 0, 0);
      const absenceEnd = new Date(absence.endDate);
      absenceEnd.setHours(23, 59, 59, 999);
      
      // Check if absence overlaps with rolling year period
      return (absenceStart >= startDate && absenceStart <= endDate) ||
             (absenceEnd >= startDate && absenceEnd <= endDate) ||
             (absenceStart < startDate && absenceEnd > endDate);
    })
    .reduce((total, absence) => {
      const absenceStart = new Date(absence.startDate);
      absenceStart.setHours(0, 0, 0, 0);
      const absenceEnd = new Date(absence.endDate);
      absenceEnd.setHours(23, 59, 59, 999);
      
      // Calculate overlap days within rolling year period
      const overlapStart = absenceStart < startDate ? startDate : absenceStart;
      const overlapEnd = absenceEnd > endDate ? endDate : absenceEnd;
      
      // Only count if there's actual overlap
      if (overlapStart > overlapEnd) return total;
      
      const overlapDays = calculateDaysBetween(
        overlapStart.toISOString().split('T')[0],
        overlapEnd.toISOString().split('T')[0]
      );
      
      return total + overlapDays;
    }, 0);
};

// Get absence limits based on type
const getAbsenceLimit = (type: string) => {
  switch (type) {
    case 'sick':
      return ABSENCE_RULES.sickSelf.selfCertificationPeriodsPerYear * ABSENCE_RULES.sickSelf.selfCertificationDays; // Max 12 days per year
    case 'sickChild':
      return ABSENCE_RULES.sickChild.daysPerYear;
    case 'personal':
      return 1; // Flyttedag - 1 day
    default:
      return 0;
  }
};

// Check if two date ranges overlap
const datesOverlap = (start1: string, end1: string, start2: string, end2: string): boolean => {
  const s1 = new Date(start1);
  const e1 = new Date(end1);
  const s2 = new Date(start2);
  const e2 = new Date(end2);
  
  return (s1 <= e2 && e1 >= s2);
};

// Detect conflicts: 2+ employees from same department with overlapping absence/vacation
const detectConflicts = (
  absences: AbsenceType[], 
  vacations: any[], 
  employees: Employee[]
): Array<{
  date: string;
  department: string;
  employees: Array<{ id: string; name: string; type: 'absence' | 'vacation' }>;
}> => {
  const conflicts: Array<{
    date: string;
    department: string;
    employees: Array<{ id: string; name: string; type: 'absence' | 'vacation' }>;
  }> = [];
  
  // Group by department
  const byDepartment: Record<string, Array<{ employeeId: string; employeeName: string; startDate: string; endDate: string; type: 'absence' | 'vacation' }>> = {};
  
  // Process absences
  absences.forEach(absence => {
    if (absence.status === 'rejected') return;
    const employee = employees.find(e => e.id === absence.employeeId);
    const department = employee?.department || employee?.departmentId || 'Ukjent avdeling';
    
    if (!byDepartment[department]) {
      byDepartment[department] = [];
    }
    
    byDepartment[department].push({
      employeeId: absence.employeeId,
      employeeName: absence.employeeName || employee?.displayName || 'Ukjent',
      startDate: absence.startDate,
      endDate: absence.endDate,
      type: 'absence'
    });
  });
  
  // Process vacations
  vacations.forEach(vacation => {
    if (vacation.status === 'rejected') return;
    const employee = employees.find(e => e.id === vacation.employeeId);
    const department = employee?.department || employee?.departmentId || 'Ukjent avdeling';
    
    if (!byDepartment[department]) {
      byDepartment[department] = [];
    }
    
    byDepartment[department].push({
      employeeId: vacation.employeeId,
      employeeName: vacation.employeeName || employee?.displayName || 'Ukjent',
      startDate: vacation.startDate,
      endDate: vacation.endDate,
      type: 'vacation'
    });
  });
  
  // Check for conflicts within each department
  Object.keys(byDepartment).forEach(department => {
    const entries = byDepartment[department];
    
    // Check all pairs
    for (let i = 0; i < entries.length; i++) {
      for (let j = i + 1; j < entries.length; j++) {
        const entry1 = entries[i];
        const entry2 = entries[j];
        
        if (datesOverlap(entry1.startDate, entry1.endDate, entry2.startDate, entry2.endDate)) {
          // Find all overlapping dates
          const start = new Date(Math.max(new Date(entry1.startDate).getTime(), new Date(entry2.startDate).getTime()));
          const end = new Date(Math.min(new Date(entry1.endDate).getTime(), new Date(entry2.endDate).getTime()));
          
          // Add conflict for each overlapping day
          const currentDate = new Date(start);
          while (currentDate <= end) {
            const dateStr = currentDate.toISOString().split('T')[0];
            
            // Check if conflict already exists for this date and department
            const existingConflict = conflicts.find(
              c => c.date === dateStr && c.department === department
            );
            
            if (existingConflict) {
              // Add employees if not already in conflict
              if (!existingConflict.employees.find(e => e.id === entry1.employeeId)) {
                existingConflict.employees.push({
                  id: entry1.employeeId,
                  name: entry1.employeeName,
                  type: entry1.type
                });
              }
              if (!existingConflict.employees.find(e => e.id === entry2.employeeId)) {
                existingConflict.employees.push({
                  id: entry2.employeeId,
                  name: entry2.employeeName,
                  type: entry2.type
                });
              }
            } else {
              conflicts.push({
                date: dateStr,
                department,
                employees: [
                  { id: entry1.employeeId, name: entry1.employeeName, type: entry1.type },
                  { id: entry2.employeeId, name: entry2.employeeName, type: entry2.type }
                ]
              });
            }
            
            currentDate.setDate(currentDate.getDate() + 1);
          }
        }
      }
    }
  });
  
  // Filter to only show conflicts with 2+ employees
  return conflicts.filter(c => c.employees.length >= 2);
};

interface AbsenceTabProps {
  employees: Employee[];
  absences: AbsenceType[];
  setAbsences: (absences: AbsenceType[]) => void;
  userProfile: any;
  firebaseService: typeof firebaseService;
  onAbsenceChange?: () => void; // Callback to reload data from Firebase
  vacations?: any[]; // For conflict detection
}

export function AbsenceTab({ 
  employees, 
  absences, 
  setAbsences, 
  userProfile, 
  firebaseService,
  onAbsenceChange,
  vacations = []
}: AbsenceTabProps) {
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedEmployee, setSelectedEmployee] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showRulesModal, setShowRulesModal] = useState(false);
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [selectedAbsence, setSelectedAbsence] = useState<AbsenceType | null>(null);
  const [viewMode, setViewMode] = useState('list');
  const [validationWarning, setValidationWarning] = useState<string | null>(null);
  const [newAbsence, setNewAbsence] = useState({
    type: 'sick',
    startDate: '',
    endDate: '',
    notes: '',
    employeeId: ''
  });

  // Handle delete absence
  const handleDeleteAbsence = async (absenceId: string) => {
    if (!confirm('Er du sikker på at du vil slette dette fraværet?')) {
      return;
    }

    setLoading(true);
    try {
      const userContext = createUserAccessContext(userProfile);
      await firebaseService.deleteAbsence(absenceId, userContext || undefined);
      
      // Reload absences from Firebase to ensure consistency
      if (onAbsenceChange) {
        onAbsenceChange();
      } else {
        // Fallback: Remove from local state if callback not provided
        setAbsences(absences.filter(a => a.id !== absenceId));
      }
      
      setShowDeleteConfirmModal(false);
      setSelectedAbsence(null);
      alert('Fravær slettet');
    } catch (error) {
      console.error('Error deleting absence:', error);
      alert('Feil ved sletting av fravær');
    } finally {
      setLoading(false);
    }
  };

  // Filter absences based on search and filters
  const filteredAbsences = absences.filter(absence => {
    const matchesSearch = 
      absence.employeeName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      absence.reason?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      absence.notes?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = selectedStatus === 'all' || absence.status === selectedStatus;
    const matchesType = selectedType === 'all' || absence.type === selectedType;
    const matchesEmployee = selectedEmployee === 'all' || absence.employeeId === selectedEmployee;
    
    // Check if absence is in selected year (for display purposes, but rolling year is used for calculations)
    const absenceYear = new Date(absence.startDate).getFullYear();
    const matchesYear = absenceYear === selectedYear;
    
    return matchesSearch && matchesStatus && matchesType && matchesEmployee && matchesYear;
  });

  // Validate absence before adding
  const validateAbsence = (): { valid: boolean; warning: string | null } => {
    if (!newAbsence.employeeId || !newAbsence.type || !newAbsence.startDate || !newAbsence.endDate) {
      return { valid: false, warning: 'Vennligst fyll ut alle påkrevde felt' };
    }

    const days = calculateDaysBetween(newAbsence.startDate, newAbsence.endDate);
    const selectedEmployee = employees.find(e => e.id === newAbsence.employeeId);
    const employeeName = selectedEmployee?.displayName || (selectedEmployee as any)?.name || 'ansatt';
    
    // Calculate used days in rolling year for this employee
    const today = new Date();
    const usedDaysForType = calculateUsedDaysInRollingYear(
      newAbsence.employeeId, 
      absences.filter(a => a.type === newAbsence.type && a.status !== 'rejected'), 
      today
    );
    const totalUsedDays = usedDaysForType + days;
    
    // Validate egenmelding (sick type) - max 3 days per period, max 12 days per year
    if (newAbsence.type === 'sick') {
      if (days > 3) {
        return {
          valid: false,
          warning: `Egenmelding kan maksimalt være ${ABSENCE_RULES.sickSelf.selfCertificationDays} dager per fraværstilfelle ifølge norsk lov. Du har valgt ${days} dager. Fra fjerde fraværsdag kreves legeerklæring. Reduser antall dager til maksimum 3.`
        };
      }
      
      const yearlyLimit = ABSENCE_RULES.sickSelf.selfCertificationPeriodsPerYear * ABSENCE_RULES.sickSelf.selfCertificationDays; // 12 days
      if (totalUsedDays > yearlyLimit) {
        return {
          valid: false,
          warning: `${employeeName} har allerede brukt ${usedDaysForType} dager egenmelding i løpet av det siste året. Med ${days} nye dager vil totalen bli ${totalUsedDays} dager, som overstiger den årlige grensen på ${yearlyLimit} dager ifølge norsk lov. Reduser antall dager eller vurder legeerklæring.`
        };
      }
      
      if (totalUsedDays >= yearlyLimit * 0.8) {
        return {
          valid: false,
          warning: `Advarsel: ${employeeName} har allerede brukt ${usedDaysForType} dager egenmelding. Med ${days} nye dager vil totalen bli ${totalUsedDays}/${yearlyLimit} dager (${Math.round((totalUsedDays / yearlyLimit) * 100)}%). Du nærmer deg den årlige grensen på ${yearlyLimit} dager ifølge norsk lov.`
        };
      }
    }

    // Validate sykt barn (sickChild type) - max 10 days per year (15 if multiple children, 20 if chronic)
    if (newAbsence.type === 'sickChild') {
      const yearlyLimit = ABSENCE_RULES.sickChild.daysPerYear; // 10 days (can be extended to 15 or 20)
      if (totalUsedDays > yearlyLimit) {
        return {
          valid: false,
          warning: `${employeeName} har allerede brukt ${usedDaysForType} dager for sykt barn i løpet av det siste året. Med ${days} nye dager vil totalen bli ${totalUsedDays} dager, som overstiger den årlige grensen på ${yearlyLimit} dager ifølge norsk lov (Arbeidsmiljøloven § 12-9). Hvis du har flere barn, kan grensen være ${ABSENCE_RULES.sickChild.daysPerYearMultipleChildren} dager. Ved kronisk sykdom kan grensen være ${ABSENCE_RULES.sickChild.daysPerYearChronicIllness} dager.`
        };
      }
      
      if (totalUsedDays >= yearlyLimit * 0.8) {
        return {
          valid: false,
          warning: `Advarsel: ${employeeName} har allerede brukt ${usedDaysForType} dager for sykt barn. Med ${days} nye dager vil totalen bli ${totalUsedDays}/${yearlyLimit} dager (${Math.round((totalUsedDays / yearlyLimit) * 100)}%). Du nærmer deg den årlige grensen på ${yearlyLimit} dager ifølge norsk lov. ${ABSENCE_RULES.sickChild.documentation}`
        };
      }
    }

    // Validate flyttedag (personal type) - max 1 day
    if (newAbsence.type === 'personal') {
      if (days > 1) {
        return {
          valid: false,
          warning: `Flyttedag er kun 1 dag med lønn ifølge norsk lov. Du har valgt ${days} dager. Reduser til 1 dag.`
        };
      }
      
      if (totalUsedDays > 1) {
        return {
          valid: false,
          warning: `${employeeName} har allerede brukt ${usedDaysForType} flyttedag i løpet av det siste året. Flyttedag er kun 1 dag per år ifølge norsk lov.`
        };
      }
    }

    return { valid: true, warning: null };
  };

  // Handle adding a new absence
  const handleAddAbsence = async () => {
    const validation = validateAbsence();
    
    if (!validation.valid) {
      setValidationWarning(validation.warning);
      return;
    }

    setValidationWarning(null);
    setLoading(true);
    
    try {
      const selectedEmp = employees.find(emp => emp.id === newAbsence.employeeId);
      const isAdminOrLeader = userProfile?.role === 'admin' || userProfile?.role === 'department_leader';
      
      // Determine status based on user role
      const status: 'pending' | 'approved' | 'rejected' = isAdminOrLeader ? 'approved' : 'pending';
      
      const absenceData: Omit<AbsenceType, 'id' | 'createdAt' | 'updatedAt'> = {
        employeeId: newAbsence.employeeId,
        employeeName: selectedEmp?.displayName || (selectedEmp as any)?.name || 'Ukjent ansatt',
                startDate: newAbsence.startDate,
        endDate: newAbsence.endDate,
        type: newAbsence.type as 'sick' | 'personal' | 'sickChild' | 'other' | 'vacation',
        reason: newAbsence.type === 'sick' ? 'Egenmelding' : 
                newAbsence.type === 'sickChild' ? 'Sykt barn' :
                newAbsence.type === 'personal' ? 'Flyttedag' : 'Annet',
        status: status,
        approvedBy: isAdminOrLeader ? userProfile?.email || userProfile?.displayName : undefined,
        approvedAt: isAdminOrLeader ? new Date().toISOString() : undefined,
        requestedBy: userProfile?.email || userProfile?.displayName
      };

      // Only include notes if it's not empty
      if (newAbsence.notes && newAbsence.notes.trim() !== '') {
        absenceData.notes = newAbsence.notes.trim();
      }
      
      const userContext = createUserAccessContext(userProfile);
      const absenceId = await firebaseService.createAbsence(absenceData, userContext || undefined);
      
      // Send email notifications
      const typeLabels: Record<string, string> = {
        'sick': 'Egenmelding',
        'sickChild': 'Sykt barn',
        'personal': 'Flyttedag',
        'other': 'Annet'
      };
      
      if (isAdminOrLeader) {
        // Admin/Leader added absence - send email to employee
        if (selectedEmp?.email) {
          const emailHtml = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h2 style="color: #2563eb;">Fravær registrert</h2>
              <p>Hei ${selectedEmp.displayName || selectedEmp.name},</p>
              <p>Det har blitt registrert fravær på deg:</p>
              <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <p><strong>Type:</strong> ${typeLabels[newAbsence.type] || 'Annet'}</p>
                <p><strong>Fra dato:</strong> ${new Date(newAbsence.startDate).toLocaleDateString('nb-NO', { day: '2-digit', month: '2-digit', year: 'numeric' })}</p>
                <p><strong>Til dato:</strong> ${new Date(newAbsence.endDate).toLocaleDateString('nb-NO', { day: '2-digit', month: '2-digit', year: 'numeric' })}</p>
                <p><strong>Antall dager:</strong> ${calculateDaysBetween(newAbsence.startDate, newAbsence.endDate)}</p>
                <p><strong>Status:</strong> Godkjent</p>
                ${newAbsence.notes ? `<p><strong>Notater:</strong> ${newAbsence.notes}</p>` : ''}
              </div>
              <p>Fraværet er automatisk godkjent.</p>
              <p>Hvis du har spørsmål, ta kontakt med din leder.</p>
              <br>
              <p>Med vennlig hilsen,<br>DriftPro-systemet</p>
            </div>
          `;
          
          try {
            await globalEmailService.sendEmail({
              to: selectedEmp.email,
              subject: `Fravær registrert - ${typeLabels[newAbsence.type] || 'Annet'}`,
              html: emailHtml
            });
          } catch (emailError) {
            console.error('Error sending email to employee:', emailError);
          }
        }
      } else {
        // Employee added absence - send email to nearest leader
        try {
          const nearestLeader = await firebaseService.getNearestLeader(newAbsence.employeeId, userProfile.companyId);
          
          if (nearestLeader?.email) {
            const emailHtml = `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2 style="color: #dc2626;">Ny fraværsmelding</h2>
                <p>Hei ${nearestLeader.displayName || nearestLeader.name},</p>
                <p>${selectedEmp?.displayName || selectedEmp?.name || 'En ansatt'} har sendt inn en fraværsmelding som krever din godkjenning:</p>
                <div style="background: #fef2f2; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc2626;">
                  <p><strong>Ansatt:</strong> ${selectedEmp?.displayName || selectedEmp?.name || 'Ukjent'}</p>
                  <p><strong>Type:</strong> ${typeLabels[newAbsence.type] || 'Annet'}</p>
                  <p><strong>Fra dato:</strong> ${new Date(newAbsence.startDate).toLocaleDateString('nb-NO', { day: '2-digit', month: '2-digit', year: 'numeric' })}</p>
                  <p><strong>Til dato:</strong> ${new Date(newAbsence.endDate).toLocaleDateString('nb-NO', { day: '2-digit', month: '2-digit', year: 'numeric' })}</p>
                  <p><strong>Antall dager:</strong> ${calculateDaysBetween(newAbsence.startDate, newAbsence.endDate)}</p>
                  <p><strong>Status:</strong> <span style="color: #f59e0b; font-weight: bold;">Venter på godkjenning</span></p>
                  ${newAbsence.notes ? `<p><strong>Notater:</strong> ${newAbsence.notes}</p>` : ''}
                </div>
                <p>Vennligst logg inn på DriftPro-systemet for å godkjenne eller avslå fraværsmeldingen.</p>
                <br>
                <p>Med vennlig hilsen,<br>DriftPro-systemet</p>
              </div>
            `;
            
            try {
              await globalEmailService.sendEmail({
                to: nearestLeader.email,
                subject: `Fraværsmelding fra ${selectedEmp?.displayName || selectedEmp?.name || 'ansatt'} - Venter på godkjenning`,
                html: emailHtml
              });
            } catch (emailError) {
              console.error('Error sending email to leader:', emailError);
            }
          }
        } catch (leaderError) {
          console.error('Error finding nearest leader:', leaderError);
        }
      }
      
      // Reload absences from Firebase to ensure consistency
      if (onAbsenceChange) {
        onAbsenceChange();
      } else {
        // Fallback: Add to local state if callback not provided
        const newAbsenceWithId: AbsenceType = {
          id: absenceId,
          ...absenceData,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        setAbsences([...absences, newAbsenceWithId]);
      }
      
      // Reset form and close modal
      setNewAbsence({
        type: 'sick',
        startDate: '',
        endDate: '',
        notes: '',
        employeeId: ''
      });
      setValidationWarning(null);
      setShowAddModal(false);
      
      // Show success notification
      alert(isAdminOrLeader ? 'Fravær lagt til og godkjent. E-post sendt til ansatt.' : 'Fraværsmelding sendt til din leder. Du vil få beskjed når den er behandlet.');
    } catch (error) {
      console.error('Error adding absence:', error);
      alert('Feil ved registrering av fravær');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {/* Header med knapper */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-6)' }}>
        <h2 style={{ fontSize: 'var(--font-size-xl)', fontWeight: '600', color: 'var(--gray-900)' }}>
          Fravær ({filteredAbsences.length})
        </h2>
        <div style={{ display: 'flex', gap: 'var(--space-4)' }}>
          <button 
            className="btn btn-secondary" 
            onClick={() => setShowRulesModal(true)}
          >
            <Info size={16} style={{ marginRight: 'var(--space-2)' }} />
            Lovdata regler
          </button>
          <button 
            className="btn btn-primary" 
            onClick={() => setShowAddModal(true)}
          >
            <Plus size={16} style={{ marginRight: 'var(--space-2)' }} />
            Legg til fravær
          </button>
        </div>
      </div>
      
      {/* Statistikk */}
      <div className="stats-grid" style={{ marginBottom: 'var(--space-6)' }}>
        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: 'var(--blue-50)' }}>
            <Users size={20} color="var(--blue-500)" />
          </div>
          <div className="stat-content">
            <div className="stat-title">Totalt fravær</div>
            <div className="stat-value">{absences.length}</div>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: 'var(--amber-50)' }}>
            <AlertCircle size={20} color="var(--amber-500)" />
          </div>
          <div className="stat-content">
            <div className="stat-title">Ventende</div>
            <div className="stat-value">{absences.filter(a => a.status === 'pending').length}</div>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: 'var(--green-50)' }}>
            <CheckCircle size={20} color="var(--green-500)" />
          </div>
          <div className="stat-content">
            <div className="stat-title">Godkjent</div>
            <div className="stat-value">{absences.filter(a => a.status === 'approved').length}</div>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: 'var(--red-50)' }}>
            <AlertTriangle size={20} color="var(--red-500)" />
          </div>
          <div className="stat-content">
            <div className="stat-title">Avvist</div>
            <div className="stat-value">{absences.filter(a => a.status === 'rejected').length}</div>
          </div>
        </div>
      </div>
      
      {/* Søk og filtrering */}
      <div style={{ display: 'flex', gap: 'var(--space-4)', marginBottom: 'var(--space-6)', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: '1' }}>
          <Search size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--gray-400)' }} />
          <input
            type="text"
            placeholder="Søk etter ansatt, årsak..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ 
              width: '100%', 
              padding: '8px 8px 8px 32px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--gray-200)',
              fontSize: 'var(--font-size-sm)'
            }}
          />
        </div>
        
        <div style={{ minWidth: '150px' }}>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            style={{ 
              width: '100%', 
              padding: '8px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--gray-200)',
              fontSize: 'var(--font-size-sm)'
            }}
          >
            <option value="all">Alle statuser</option>
            <option value="pending">Ventende</option>
            <option value="approved">Godkjent</option>
            <option value="rejected">Avvist</option>
          </select>
        </div>
        
        <div style={{ minWidth: '150px' }}>
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            style={{ 
              width: '100%', 
              padding: '8px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--gray-200)',
              fontSize: 'var(--font-size-sm)'
            }}
          >
            <option value="all">Alle typer</option>
            <option value="sick">Sykdom</option>
            <option value="sickChild">Sykt barn</option>
            <option value="personal">Personlig</option>
            <option value="other">Annet</option>
          </select>
        </div>
        
        <div style={{ minWidth: '150px' }}>
          <select
            value={selectedEmployee}
            onChange={(e) => setSelectedEmployee(e.target.value)}
            style={{ 
              width: '100%', 
              padding: '8px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--gray-200)',
              fontSize: 'var(--font-size-sm)'
            }}
          >
            <option value="all">Alle ansatte</option>
            {employees.map(emp => (
              <option key={emp.id} value={emp.id}>{emp.displayName || emp.name}</option>
            ))}
          </select>
        </div>
        
        <div style={{ minWidth: '120px' }}>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            style={{ 
              width: '100%', 
              padding: '8px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--gray-200)',
              fontSize: 'var(--font-size-sm)'
            }}
          >
            {[...Array(5)].map((_, i) => {
              const year = new Date().getFullYear() - 2 + i;
              return <option key={year} value={year}>{year}</option>;
            })}
          </select>
        </div>
      </div>
      
      {/* Visningsvalg */}
      <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-4)' }}>
        <button 
          className={`btn ${viewMode === 'list' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setViewMode('list')}
          style={{ padding: '6px 12px' }}
        >
          Liste
        </button>
        <button 
          className={`btn ${viewMode === 'employee' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setViewMode('employee')}
          style={{ padding: '6px 12px' }}
        >
          Ansatte oversikt
        </button>
      </div>
      
      {/* Ansatte oversikt */}
      {viewMode === 'employee' && (
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', 
          gap: '1.5rem' 
        }}>
          {employees.map(employee => {
            const today = new Date();
            const employeeAbsences = absences.filter(a => a.employeeId === employee.id && a.status !== 'rejected');
            
            // Calculate used days in rolling year (from today)
            const usedSickDays = calculateUsedDaysInRollingYear(employee.id, absences.filter(a => a.type === 'sick'), today);
            const usedSickChildDays = calculateUsedDaysInRollingYear(employee.id, absences.filter(a => a.type === 'sickChild'), today);
            const usedPersonalDays = calculateUsedDaysInRollingYear(employee.id, absences.filter(a => a.type === 'personal'), today);
            const usedOtherDays = calculateUsedDaysInRollingYear(employee.id, absences.filter(a => a.type === 'other'), today);
            
            const sickLimit = getAbsenceLimit('sick');
            const sickChildLimit = getAbsenceLimit('sickChild');
            const personalLimit = getAbsenceLimit('personal');
            
            const sickUsagePercentage = sickLimit > 0 ? (usedSickDays / sickLimit) * 100 : 0;
            const sickChildUsagePercentage = sickChildLimit > 0 ? (usedSickChildDays / sickChildLimit) * 100 : 0;
            const personalUsagePercentage = personalLimit > 0 ? (usedPersonalDays / personalLimit) * 100 : 0;
            
            const isNearLimit = sickUsagePercentage >= 80 || sickChildUsagePercentage >= 80 || personalUsagePercentage >= 80;
            
            return (
              <div 
                key={employee.id} 
                style={{
                  background: 'var(--card-background)',
                  borderRadius: '12px',
                  padding: '1.5rem',
                  border: isNearLimit ? '2px solid var(--danger)' : '1px solid var(--border-color)',
                  boxShadow: isNearLimit ? '0 4px 12px rgba(239, 68, 68, 0.2)' : 'var(--shadow-sm)',
                  transition: 'all 0.2s'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                  <div style={{
                    width: '50px',
                    height: '50px',
                    borderRadius: '50%',
                    background: isNearLimit ? 'rgba(239, 68, 68, 0.2)' : 'linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: isNearLimit ? 'var(--danger)' : 'white',
                    fontWeight: '700',
                    fontSize: '1.25rem',
                    flexShrink: 0
                  }}>
                    {(employee.displayName || (employee as any).name || '?').charAt(0)}
                      </div>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ 
                      fontSize: '1.125rem', 
                      fontWeight: '600', 
                      color: isNearLimit ? 'var(--danger)' : 'var(--text-color)',
                      margin: 0,
                      marginBottom: '0.25rem'
                    }}>
                      {employee.displayName || (employee as any).name}
                    </h3>
                    <p style={{ fontSize: '0.875rem', color: 'var(--gray-600)', margin: 0 }}>
                      {employee.position} • {employee.department}
                    </p>
                  </div>
                </div>
                
                {isNearLimit && (
                  <div style={{
                    padding: '0.75rem',
                    background: 'rgba(239, 68, 68, 0.1)',
                    borderRadius: '8px',
                    border: '1px solid var(--danger)',
                    marginBottom: '1rem'
                  }}>
                    <div style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--danger)', marginBottom: '0.5rem' }}>
                      ⚠️ Nærmer seg å bruke opp dager
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-color)', lineHeight: '1.6' }}>
                      {sickUsagePercentage >= 80 && (
                        <div>Egenmelding: {usedSickDays}/{sickLimit} dager ({sickUsagePercentage.toFixed(0)}%)</div>
                      )}
                      {sickChildUsagePercentage >= 80 && (
                        <div>Sykt barn: {usedSickChildDays}/{sickChildLimit} dager ({sickChildUsagePercentage.toFixed(0)}%)</div>
                      )}
                      {personalUsagePercentage >= 80 && (
                        <div>Flyttedag: {usedPersonalDays}/{personalLimit} dager ({personalUsagePercentage.toFixed(0)}%)</div>
                    )}
                  </div>
                  </div>
                )}
                
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(2, 1fr)', 
                  gap: '1rem',
                  marginBottom: '1.5rem'
                }}>
                  <div style={{
                    padding: '1rem',
                    background: 'var(--gray-50)',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)'
                  }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--gray-600)', marginBottom: '0.5rem' }}>Egenmelding</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: '700', color: sickUsagePercentage >= 80 ? 'var(--danger)' : 'var(--text-color)' }}>
                      {usedSickDays}/{sickLimit}
                </div>
                    <div style={{ 
                      width: '100%', 
                      height: '6px', 
                      background: 'var(--gray-200)', 
                      borderRadius: '9999px', 
                      marginTop: '0.5rem',
                      overflow: 'hidden'
                    }}>
                      <div style={{
                        width: `${Math.min(sickUsagePercentage, 100)}%`,
                        height: '100%',
                        background: sickUsagePercentage >= 80 ? 'var(--danger)' : 'var(--primary)',
                        borderRadius: '9999px',
                        transition: 'width 0.3s ease'
                      }} />
                  </div>
                  </div>
                  
                  <div style={{
                    padding: '1rem',
                    background: 'var(--gray-50)',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)'
                  }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--gray-600)', marginBottom: '0.5rem' }}>Sykt barn</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: '700', color: sickChildUsagePercentage >= 80 ? 'var(--danger)' : 'var(--text-color)' }}>
                      {usedSickChildDays}/{sickChildLimit}
                  </div>
                    <div style={{ 
                      width: '100%', 
                      height: '6px', 
                      background: 'var(--gray-200)', 
                      borderRadius: '9999px', 
                      marginTop: '0.5rem',
                      overflow: 'hidden'
                    }}>
                      <div style={{
                        width: `${Math.min(sickChildUsagePercentage, 100)}%`,
                        height: '100%',
                        background: sickChildUsagePercentage >= 80 ? 'var(--danger)' : 'var(--warning)',
                        borderRadius: '9999px',
                        transition: 'width 0.3s ease'
                      }} />
                  </div>
                </div>
                  
                  <div style={{
                    padding: '1rem',
                    background: 'var(--gray-50)',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)'
                  }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--gray-600)', marginBottom: '0.5rem' }}>Flyttedag</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: '700', color: personalUsagePercentage >= 80 ? 'var(--danger)' : 'var(--text-color)' }}>
                      {usedPersonalDays}/{personalLimit}
                    </div>
                    <div style={{ 
                      width: '100%', 
                      height: '6px', 
                      background: 'var(--gray-200)', 
                      borderRadius: '9999px', 
                      marginTop: '0.5rem',
                      overflow: 'hidden'
                    }}>
                      <div style={{
                        width: `${Math.min(personalUsagePercentage, 100)}%`,
                        height: '100%',
                        background: personalUsagePercentage >= 80 ? 'var(--danger)' : 'var(--secondary)',
                        borderRadius: '9999px',
                        transition: 'width 0.3s ease'
                      }} />
                    </div>
                  </div>
                  
                  <div style={{
                    padding: '1rem',
                    background: 'var(--gray-50)',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)'
                  }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--gray-600)', marginBottom: '0.5rem' }}>Annet</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--text-color)' }}>
                      {usedOtherDays}
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-color)', marginBottom: '0.75rem' }}>
                    Siste fravær
                  </h4>
                  {employeeAbsences.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {employeeAbsences
                        .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime())
                        .slice(0, 3)
                        .map(absence => (
                          <div 
                            key={absence.id}
                            style={{
                              padding: '0.75rem',
                              background: 'var(--gray-50)',
                              borderRadius: '8px',
                              border: '1px solid var(--border-color)',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center'
                            }}
                          >
                            <div>
                              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.25rem' }}>
                                {absence.type === 'sick' && <span style={{ padding: '0.125rem 0.5rem', borderRadius: '9999px', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', fontSize: '0.625rem', fontWeight: '600' }}>Egenmelding</span>}
                                {absence.type === 'sickChild' && <span style={{ padding: '0.125rem 0.5rem', borderRadius: '9999px', background: 'rgba(245, 158, 11, 0.1)', color: 'var(--warning)', fontSize: '0.625rem', fontWeight: '600' }}>Sykt barn</span>}
                                {absence.type === 'personal' && <span style={{ padding: '0.125rem 0.5rem', borderRadius: '9999px', background: 'rgba(59, 130, 246, 0.1)', color: 'var(--secondary)', fontSize: '0.625rem', fontWeight: '600' }}>Flyttedag</span>}
                                {absence.type === 'other' && <span style={{ padding: '0.125rem 0.5rem', borderRadius: '9999px', background: 'rgba(107, 114, 128, 0.1)', color: 'var(--gray-600)', fontSize: '0.625rem', fontWeight: '600' }}>Annet</span>}
                            </div>
                              <div style={{ fontSize: '0.75rem', color: 'var(--gray-600)' }}>
                              {new Date(absence.startDate).toLocaleDateString('nb-NO')} - {new Date(absence.endDate).toLocaleDateString('nb-NO')}
                            </div>
                            </div>
                            <div style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-color)' }}>
                              {calculateDaysBetween(absence.startDate, absence.endDate)} dager
                            </div>
                          </div>
                        ))}
                    </div>
                  ) : (
                    <p style={{ fontSize: '0.875rem', color: 'var(--gray-600)', textAlign: 'center', padding: '1rem' }}>
                      Ingen fravær registrert
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
      
      {/* Liste visning */}
      {viewMode === 'list' && (
        <div style={{ background: 'var(--card-background)', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
                <tr style={{ background: 'var(--gray-50)', borderBottom: '2px solid var(--border-color)' }}>
                  <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: 'var(--text-color)', fontSize: '0.875rem' }}>Ansatt</th>
                  <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: 'var(--text-color)', fontSize: '0.875rem' }}>Type</th>
                  <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: 'var(--text-color)', fontSize: '0.875rem' }}>Periode</th>
                  <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: 'var(--text-color)', fontSize: '0.875rem' }}>Dager</th>
                  <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: 'var(--text-color)', fontSize: '0.875rem' }}>Status</th>
                  <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: 'var(--text-color)', fontSize: '0.875rem' }}>Handlinger</th>
              </tr>
            </thead>
            <tbody>
              {filteredAbsences.length > 0 ? (
                  filteredAbsences.map(absence => {
                    const employee = employees.find(e => e.id === absence.employeeId);
                    // Calculate used days in rolling year from today (not from absence date)
                    const usedDays = calculateUsedDaysInRollingYear(absence.employeeId, absences.filter(a => a.type === absence.type), new Date());
                    const limit = getAbsenceLimit(absence.type);
                    const usagePercentage = limit > 0 ? (usedDays / limit) * 100 : 0;
                    const isNearLimit = usagePercentage >= 80;
                    
                    return (
                      <tr 
                        key={absence.id}
                        style={{ 
                          borderBottom: '1px solid var(--border-color)',
                          background: isNearLimit ? 'rgba(239, 68, 68, 0.05)' : 'transparent',
                          transition: 'background 0.2s'
                        }}
                        onMouseEnter={(e) => {
                          if (!isNearLimit) {
                            e.currentTarget.style.background = 'var(--gray-50)';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!isNearLimit) {
                            e.currentTarget.style.background = 'transparent';
                          }
                        }}
                      >
                        <td style={{ padding: '1rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <div style={{
                              width: '40px',
                              height: '40px',
                              borderRadius: '50%',
                              background: isNearLimit ? 'rgba(239, 68, 68, 0.2)' : 'var(--primary)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: isNearLimit ? 'var(--danger)' : 'white',
                              fontWeight: '600',
                              fontSize: '0.875rem'
                            }}>
                          {absence.employeeName?.charAt(0) || 'U'}
                        </div>
                            <div>
                              <div style={{ fontWeight: '600', color: isNearLimit ? 'var(--danger)' : 'var(--text-color)', fontSize: '0.875rem' }}>
                                {absence.employeeName}
                              </div>
                              {isNearLimit && (
                                <div style={{ fontSize: '0.75rem', color: 'var(--danger)', marginTop: '0.25rem' }}>
                                  {usedDays}/{limit} dager brukt ({usagePercentage.toFixed(0)}%)
                                </div>
                              )}
                            </div>
                      </div>
                    </td>
                        <td style={{ padding: '1rem' }}>
                          {absence.type === 'sick' && <span style={{ padding: '0.25rem 0.75rem', borderRadius: '9999px', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', fontSize: '0.75rem', fontWeight: '600' }}>Egenmelding</span>}
                          {absence.type === 'sickChild' && <span style={{ padding: '0.25rem 0.75rem', borderRadius: '9999px', background: 'rgba(245, 158, 11, 0.1)', color: 'var(--warning)', fontSize: '0.75rem', fontWeight: '600' }}>Sykt barn</span>}
                          {absence.type === 'personal' && <span style={{ padding: '0.25rem 0.75rem', borderRadius: '9999px', background: 'rgba(59, 130, 246, 0.1)', color: 'var(--secondary)', fontSize: '0.75rem', fontWeight: '600' }}>Flyttedag</span>}
                          {absence.type === 'other' && <span style={{ padding: '0.25rem 0.75rem', borderRadius: '9999px', background: 'rgba(107, 114, 128, 0.1)', color: 'var(--gray-600)', fontSize: '0.75rem', fontWeight: '600' }}>Annet</span>}
                    </td>
                        <td style={{ padding: '1rem', color: 'var(--text-color)', fontSize: '0.875rem' }}>
                          {new Date(absence.startDate).toLocaleDateString('nb-NO', { day: '2-digit', month: '2-digit', year: 'numeric' })} - {new Date(absence.endDate).toLocaleDateString('nb-NO', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                    </td>
                        <td style={{ padding: '1rem', color: 'var(--text-color)', fontSize: '0.875rem', fontWeight: '600' }}>
                          {calculateDaysBetween(absence.startDate, absence.endDate)} dager
                        </td>
                        <td style={{ padding: '1rem' }}>
                          {absence.status === 'pending' && <span style={{ padding: '0.25rem 0.75rem', borderRadius: '9999px', background: 'rgba(245, 158, 11, 0.1)', color: 'var(--warning)', fontSize: '0.75rem', fontWeight: '600' }}>Ventende</span>}
                          {absence.status === 'approved' && <span style={{ padding: '0.25rem 0.75rem', borderRadius: '9999px', background: 'rgba(16, 185, 129, 0.1)', color: 'var(--success)', fontSize: '0.75rem', fontWeight: '600' }}>Godkjent</span>}
                          {absence.status === 'rejected' && <span style={{ padding: '0.25rem 0.75rem', borderRadius: '9999px', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', fontSize: '0.75rem', fontWeight: '600' }}>Avvist</span>}
                        </td>
                        <td style={{ padding: '1rem' }}>
                          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                            <button
                              onClick={() => handleDeleteAbsence(absence.id)}
                              className="btn btn-danger"
                              style={{ 
                                padding: '0.5rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.25rem',
                                fontSize: '0.75rem'
                              }}
                              disabled={loading}
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                    </td>
                  </tr>
                    );
                  })
              ) : (
                <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '3rem', color: 'var(--gray-600)' }}>
                    Ingen fravær funnet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          </div>
        </div>
      )}
      
      {/* Legg til fravær modal */}
      {showAddModal && (
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
        onClick={() => setShowAddModal(false)}
        >
          <div style={{
            background: 'var(--card-background)',
            borderRadius: '12px',
            maxWidth: '600px',
            width: '100%',
            padding: '1.5rem',
            boxShadow: 'var(--shadow-xl)',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}
          onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: 'var(--text-color)', margin: 0 }}>
                Legg til nytt fravær
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '0.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '8px',
                  color: 'var(--text-color)',
                  transition: 'background 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'var(--gray-100)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              >
                <X size={24} />
              </button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-color)', marginBottom: '0.5rem', display: 'block' }}>
                  Ansatt *
                </label>
                <select 
                  value={newAbsence.employeeId} 
                  onChange={(e) => setNewAbsence({...newAbsence, employeeId: e.target.value})}
                  required
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
                  <option value="">Velg ansatt</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.displayName || (emp as any).name}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label style={{ fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-color)', marginBottom: '0.5rem', display: 'block' }}>
                  Type fravær *
                </label>
                <select 
                  value={newAbsence.type} 
                  onChange={(e) => {
                    setNewAbsence({...newAbsence, type: e.target.value as any});
                    setValidationWarning(null); // Clear warning when type changes
                  }}
                  required
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
                  <option value="sick">Egenmelding</option>
                  <option value="sickChild">Sykt barn</option>
                  <option value="personal">Flyttedag</option>
                  <option value="other">Annet</option>
                </select>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-color)', marginBottom: '0.5rem', display: 'block' }}>
                    Fra dato *
                  </label>
                  <input 
                    type="date" 
                    value={newAbsence.startDate} 
                    onChange={(e) => {
                      setNewAbsence({...newAbsence, startDate: e.target.value});
                      setValidationWarning(null); // Clear warning when dates change
                    }}
                    required
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid var(--border-color)',
                      borderRadius: '8px',
                      fontSize: '1rem',
                      background: 'var(--card-background)',
                      color: 'var(--text-color)'
                    }}
                  />
                </div>
                
                <div>
                  <label style={{ fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-color)', marginBottom: '0.5rem', display: 'block' }}>
                    Til dato *
                  </label>
                  <input 
                    type="date" 
                    value={newAbsence.endDate} 
                    onChange={(e) => {
                      setNewAbsence({...newAbsence, endDate: e.target.value});
                      setValidationWarning(null); // Clear warning when dates change
                    }}
                    required
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid var(--border-color)',
                      borderRadius: '8px',
                      fontSize: '1rem',
                      background: 'var(--card-background)',
                      color: 'var(--text-color)'
                    }}
                  />
                </div>
              </div>
              
              {newAbsence.startDate && newAbsence.endDate && (() => {
                const days = calculateDaysBetween(newAbsence.startDate, newAbsence.endDate);
                const validation = validateAbsence();
                const showWarning = validation.warning && !validationWarning;
                
                return (
                  <>
                    <div style={{
                      padding: '0.75rem',
                      background: 'var(--gray-50)',
                      borderRadius: '8px',
                      border: '1px solid var(--border-color)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      color: 'var(--text-color)'
                    }}>
                      <Clock size={16} />
                      <span style={{ fontSize: '0.875rem' }}>
                        {days} dager
                  </span>
                    </div>
                    {showWarning && (
                      <div style={{
                        padding: '1rem',
                        background: 'rgba(245, 158, 11, 0.1)',
                        borderRadius: '8px',
                        border: '1px solid var(--warning)',
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '0.75rem'
                      }}>
                        <AlertTriangle size={20} style={{ color: 'var(--warning)', flexShrink: 0, marginTop: '0.125rem' }} />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--warning)', marginBottom: '0.5rem' }}>
                            Advarsel: Norske regler
                          </div>
                          <div style={{ fontSize: '0.875rem', color: 'var(--text-color)', lineHeight: '1.6' }}>
                            {validation.warning}
                          </div>
                          {newAbsence.type === 'sick' && (
                            <div style={{ fontSize: '0.75rem', color: 'var(--gray-600)', marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid rgba(245, 158, 11, 0.2)' }}>
                              <strong>Lovdata regel:</strong> {ABSENCE_RULES.sickSelf.documentation}
                </div>
              )}
                          {newAbsence.type === 'sickChild' && (
                            <div style={{ fontSize: '0.75rem', color: 'var(--gray-600)', marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid rgba(245, 158, 11, 0.2)' }}>
                              <strong>Lovdata regel (Arbeidsmiljøloven § 12-9):</strong> {ABSENCE_RULES.sickChild.documentation}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </>
                );
              })()}

              {/* Validation Warning */}
              {validationWarning && (
                <div style={{
                  padding: '1rem',
                  background: 'rgba(245, 158, 11, 0.1)',
                  borderRadius: '8px',
                  border: '1px solid var(--warning)',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.75rem'
                }}>
                  <AlertTriangle size={20} style={{ color: 'var(--warning)', flexShrink: 0, marginTop: '0.125rem' }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--warning)', marginBottom: '0.5rem' }}>
                      Advarsel: Norske regler
              </div>
                    <div style={{ fontSize: '0.875rem', color: 'var(--text-color)', lineHeight: '1.6' }}>
                      {validationWarning}
                    </div>
                    {newAbsence.type === 'sick' && (
                      <div style={{ fontSize: '0.75rem', color: 'var(--gray-600)', marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid rgba(245, 158, 11, 0.2)' }}>
                        <strong>Lovdata regel:</strong> {ABSENCE_RULES.sickSelf.documentation}
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              <div>
                <label style={{ fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-color)', marginBottom: '0.5rem', display: 'block' }}>
                  Notater (valgfritt)
                </label>
                <textarea 
                  value={newAbsence.notes} 
                  onChange={(e) => setNewAbsence({...newAbsence, notes: e.target.value})}
                  placeholder="Legg til ytterligere informasjon"
                  rows={3}
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
                />
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem', justifyContent: 'flex-end' }}>
              <button 
                className="btn btn-secondary" 
                onClick={() => setShowAddModal(false)}
              >
                Avbryt
              </button>
              <button 
                className="btn btn-primary" 
                onClick={handleAddAbsence}
                disabled={!newAbsence.employeeId || !newAbsence.type || !newAbsence.startDate || !newAbsence.endDate || loading || !!validationWarning}
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', opacity: validationWarning ? 0.6 : 1 }}
              >
                {loading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Lagrer...
                  </>
                ) : (
                  <>
                    <Save size={16} />
                    Legg til fravær
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Lovdata regler modal */}
      {showRulesModal && (
        <div className="modal-backdrop">
          <div className="modal">
            <div className="modal-header">
              <h3>Lovdata regler for fravær</h3>
              <button className="btn-close" onClick={() => setShowRulesModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="rules-section">
                <h4>Sykt barn</h4>
                <ul>
                  <li>Rett til {ABSENCE_RULES.sickChild.daysPerYear} dager per år for barn under {ABSENCE_RULES.sickChild.ageLimit} år</li>
                  <li>Utvidet til {ABSENCE_RULES.sickChild.daysPerYearMultipleChildren} dager hvis du har flere barn</li>
                  <li>Ved kronisk sykdom eller funksjonshemming: {ABSENCE_RULES.sickChild.daysPerYearChronicIllness} dager og utvidet aldersgrense til {ABSENCE_RULES.sickChild.extendedAgeLimit} år</li>
                  <li>{ABSENCE_RULES.sickChild.documentation}</li>
                </ul>
              </div>
              
              <div className="rules-section">
                <h4>Egenmeldt sykefravær</h4>
                <ul>
                  <li>Egenmelding i opptil {ABSENCE_RULES.sickSelf.selfCertificationDays} dager per fraværstilfelle</li>
                  <li>Maksimalt {ABSENCE_RULES.sickSelf.selfCertificationPeriodsPerYear} egenmeldingsperioder per år</li>
                  <li>IA-bedrifter: Utvidet til {ABSENCE_RULES.sickSelf.extendedSelfCertification} dager per periode, maksimalt {ABSENCE_RULES.sickSelf.extendedPeriodsPerYear} dager totalt per år</li>
                  <li>{ABSENCE_RULES.sickSelf.documentation}</li>
                </ul>
              </div>
              
              <div className="rules-section">
                <h4>Velferdspermisjon</h4>
                <ul>
                  <li>Typisk inntil {ABSENCE_RULES.personal.welfareLeave} dager per år, avhengig av arbeidsgivers retningslinjer</li>
                  <li>{ABSENCE_RULES.personal.documentation}</li>
                </ul>
              </div>
              
              <div className="info-box" style={{ marginTop: '16px' }}>
                <AlertTriangle size={16} style={{ marginRight: '8px' }} />
                <span>Merk at disse reglene er veiledende. Sjekk alltid med din arbeidsgiver for spesifikke retningslinjer.</span>
              </div>
            </div>
            <div className="modal-footer">
              <button 
                className="btn btn-primary" 
                onClick={() => setShowRulesModal(false)}
              >
                Lukk
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Fraværregler Tips */}
      <div style={{
        padding: '0.75rem 1rem',
        background: 'var(--gray-50)',
        borderRadius: '8px',
        border: '1px solid var(--border-color)',
        marginTop: '0.5rem'
      }}>
        <div style={{
          fontSize: '0.625rem',
          color: 'var(--gray-600)',
          lineHeight: '1.6',
          textAlign: 'left'
        }}>
          <strong style={{ fontSize: '0.6875rem', color: 'var(--text-color)', display: 'block', marginBottom: '0.25rem' }}>Fraværregler (Arbeidsmiljøloven og Lovdata):</strong> 
          <strong style={{ fontSize: '0.625rem', color: 'var(--text-color)', display: 'block', marginTop: '0.5rem' }}>Sykt barn:</strong> Rett til {ABSENCE_RULES.sickChild.daysPerYear} dager per år for barn under {ABSENCE_RULES.sickChild.ageLimit} år. Utvidet til {ABSENCE_RULES.sickChild.daysPerYearMultipleChildren} dager hvis flere barn, eller {ABSENCE_RULES.sickChild.daysPerYearChronicIllness} dager ved kronisk sykdom (aldersgrense til {ABSENCE_RULES.sickChild.extendedAgeLimit} år). {ABSENCE_RULES.sickChild.documentation}
          <strong style={{ fontSize: '0.625rem', color: 'var(--text-color)', display: 'block', marginTop: '0.5rem' }}>Egenmeldt sykefravær:</strong> Egenmelding i opptil {ABSENCE_RULES.sickSelf.selfCertificationDays} dager per fraværstilfelle, maksimalt {ABSENCE_RULES.sickSelf.selfCertificationPeriodsPerYear} perioder per år. IA-bedrifter: {ABSENCE_RULES.sickSelf.extendedSelfCertification} dager per periode, maksimalt {ABSENCE_RULES.sickSelf.extendedPeriodsPerYear} dager totalt per år. {ABSENCE_RULES.sickSelf.documentation}
          <strong style={{ fontSize: '0.625rem', color: 'var(--text-color)', display: 'block', marginTop: '0.5rem' }}>Velferdspermisjon:</strong> Typisk inntil {ABSENCE_RULES.personal.welfareLeave} dager per år, avhengig av arbeidsgivers retningslinjer. {ABSENCE_RULES.personal.documentation}
        </div>
      </div>
    </div>
  );
}