'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { firebaseService, Employee, Vacation, VacationAllocation, createUserAccessContext } from '@/lib/firebase-services';
import { 
  Calendar, CalendarDays, ChevronLeft, ChevronRight, 
  User, Plane, CheckCircle, XCircle, Clock, Plus,
  Settings, Info, AlertCircle, Save, X, Edit, Trash2
} from 'lucide-react';

interface VacationCalendarProps {
  employees: Employee[];
  absences?: any[]; // For conflict detection
}

// Norwegian holiday data (simplified - in production, fetch from arbeidstilsynet API)
const NORWEGIAN_HOLIDAYS: Record<number, Array<{ month: number; day: number; name: string }>> = {
  2021: [
    { month: 0, day: 1, name: 'Nyttårsdag' },
    { month: 3, day: 1, name: 'Palmesøndag' },
    { month: 3, day: 2, name: 'Skjærtorsdag' },
    { month: 3, day: 3, name: 'Langfredag' },
    { month: 3, day: 5, name: 'Påskedag' },
    { month: 3, day: 6, name: 'Andre påskedag' },
    { month: 4, day: 1, name: 'Arbeidernes dag' },
    { month: 4, day: 13, name: 'Kristi himmelfartsdag' },
    { month: 4, day: 17, name: 'Grunnlovsdag' },
    { month: 4, day: 23, name: 'Pinsedag' },
    { month: 4, day: 24, name: 'Andre pinsedag' },
    { month: 11, day: 25, name: 'Juledag' },
    { month: 11, day: 26, name: 'Andre juledag' }
  ],
  2022: [
    { month: 0, day: 1, name: 'Nyttårsdag' },
    { month: 3, day: 14, name: 'Palmesøndag' },
    { month: 3, day: 15, name: 'Skjærtorsdag' },
    { month: 3, day: 16, name: 'Langfredag' },
    { month: 3, day: 18, name: 'Påskedag' },
    { month: 3, day: 19, name: 'Andre påskedag' },
    { month: 4, day: 1, name: 'Arbeidernes dag' },
    { month: 4, day: 17, name: 'Grunnlovsdag' },
    { month: 4, day: 26, name: 'Kristi himmelfartsdag' },
    { month: 4, day: 5, name: 'Pinsedag' },
    { month: 4, day: 6, name: 'Andre pinsedag' },
    { month: 11, day: 25, name: 'Juledag' },
    { month: 11, day: 26, name: 'Andre juledag' }
  ],
  2023: [
    { month: 0, day: 1, name: 'Nyttårsdag' },
    { month: 3, day: 6, name: 'Palmesøndag' },
    { month: 3, day: 7, name: 'Skjærtorsdag' },
    { month: 3, day: 8, name: 'Langfredag' },
    { month: 3, day: 10, name: 'Påskedag' },
    { month: 3, day: 11, name: 'Andre påskedag' },
    { month: 4, day: 1, name: 'Arbeidernes dag' },
    { month: 4, day: 17, name: 'Grunnlovsdag' },
    { month: 4, day: 18, name: 'Kristi himmelfartsdag' },
    { month: 4, day: 28, name: 'Pinsedag' },
    { month: 4, day: 29, name: 'Andre pinsedag' },
    { month: 11, day: 25, name: 'Juledag' },
    { month: 11, day: 26, name: 'Andre juledag' }
  ],
  2024: [
    { month: 0, day: 1, name: 'Nyttårsdag' },
    { month: 2, day: 28, name: 'Palmesøndag' },
    { month: 2, day: 29, name: 'Skjærtorsdag' },
    { month: 2, day: 30, name: 'Langfredag' },
    { month: 3, day: 1, name: 'Påskedag' },
    { month: 3, day: 2, name: 'Andre påskedag' },
    { month: 4, day: 1, name: 'Arbeidernes dag' },
    { month: 4, day: 9, name: 'Kristi himmelfartsdag' },
    { month: 4, day: 17, name: 'Grunnlovsdag' },
    { month: 4, day: 19, name: 'Pinsedag' },
    { month: 4, day: 20, name: 'Andre pinsedag' },
    { month: 11, day: 25, name: 'Juledag' },
    { month: 11, day: 26, name: 'Andre juledag' }
  ],
  2025: [
    { month: 0, day: 1, name: 'Nyttårsdag' },
    { month: 3, day: 13, name: 'Palmesøndag' },
    { month: 3, day: 14, name: 'Skjærtorsdag' },
    { month: 3, day: 15, name: 'Langfredag' },
    { month: 3, day: 17, name: 'Påskedag' },
    { month: 3, day: 18, name: 'Andre påskedag' },
    { month: 4, day: 1, name: 'Arbeidernes dag' },
    { month: 4, day: 17, name: 'Grunnlovsdag' },
    { month: 4, day: 29, name: 'Kristi himmelfartsdag' },
    { month: 5, day: 8, name: 'Pinsedag' },
    { month: 5, day: 9, name: 'Andre pinsedag' },
    { month: 11, day: 25, name: 'Juledag' },
    { month: 11, day: 26, name: 'Andre juledag' }
  ],
  2026: [
    { month: 0, day: 1, name: 'Nyttårsdag' },
    { month: 3, day: 2, name: 'Palmesøndag' },
    { month: 3, day: 3, name: 'Skjærtorsdag' },
    { month: 3, day: 4, name: 'Langfredag' },
    { month: 3, day: 6, name: 'Påskedag' },
    { month: 3, day: 7, name: 'Andre påskedag' },
    { month: 4, day: 1, name: 'Arbeidernes dag' },
    { month: 4, day: 14, name: 'Kristi himmelfartsdag' },
    { month: 4, day: 17, name: 'Grunnlovsdag' },
    { month: 4, day: 24, name: 'Pinsedag' },
    { month: 4, day: 25, name: 'Andre pinsedag' },
    { month: 11, day: 25, name: 'Juledag' },
    { month: 11, day: 26, name: 'Andre juledag' }
  ],
  2027: [
    { month: 0, day: 1, name: 'Nyttårsdag' },
    { month: 3, day: 21, name: 'Palmesøndag' },
    { month: 3, day: 22, name: 'Skjærtorsdag' },
    { month: 3, day: 23, name: 'Langfredag' },
    { month: 3, day: 25, name: 'Påskedag' },
    { month: 3, day: 26, name: 'Andre påskedag' },
    { month: 4, day: 1, name: 'Arbeidernes dag' },
    { month: 4, day: 6, name: 'Kristi himmelfartsdag' },
    { month: 4, day: 17, name: 'Grunnlovsdag' },
    { month: 4, day: 16, name: 'Pinsedag' },
    { month: 4, day: 17, name: 'Andre pinsedag' },
    { month: 11, day: 25, name: 'Juledag' },
    { month: 11, day: 26, name: 'Andre juledag' }
  ],
  2028: [
    { month: 0, day: 1, name: 'Nyttårsdag' },
    { month: 3, day: 9, name: 'Palmesøndag' },
    { month: 3, day: 10, name: 'Skjærtorsdag' },
    { month: 3, day: 11, name: 'Langfredag' },
    { month: 3, day: 13, name: 'Påskedag' },
    { month: 3, day: 14, name: 'Andre påskedag' },
    { month: 4, day: 1, name: 'Arbeidernes dag' },
    { month: 4, day: 18, name: 'Kristi himmelfartsdag' },
    { month: 4, day: 17, name: 'Grunnlovsdag' },
    { month: 4, day: 28, name: 'Pinsedag' },
    { month: 4, day: 29, name: 'Andre pinsedag' },
    { month: 11, day: 25, name: 'Juledag' },
    { month: 11, day: 26, name: 'Andre juledag' }
  ],
  2029: [
    { month: 0, day: 1, name: 'Nyttårsdag' },
    { month: 3, day: 25, name: 'Palmesøndag' },
    { month: 3, day: 26, name: 'Skjærtorsdag' },
    { month: 3, day: 27, name: 'Langfredag' },
    { month: 3, day: 29, name: 'Påskedag' },
    { month: 3, day: 30, name: 'Andre påskedag' },
    { month: 4, day: 1, name: 'Arbeidernes dag' },
    { month: 4, day: 10, name: 'Kristi himmelfartsdag' },
    { month: 4, day: 17, name: 'Grunnlovsdag' },
    { month: 4, day: 20, name: 'Pinsedag' },
    { month: 4, day: 21, name: 'Andre pinsedag' },
    { month: 11, day: 25, name: 'Juledag' },
    { month: 11, day: 26, name: 'Andre juledag' }
  ]
};

const MONTH_NAMES = [
  'Januar', 'Februar', 'Mars', 'April', 'Mai', 'Juni',
  'Juli', 'August', 'September', 'Oktober', 'November', 'Desember'
];

const WEEKDAY_NAMES = ['Man', 'Tir', 'Ons', 'Tor', 'Fre', 'Lør', 'Søn'];

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
  absences: any[], 
  vacations: Vacation[], 
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
  (absences || []).forEach(absence => {
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
  (vacations || []).forEach(vacation => {
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

export default function VacationCalendar({ employees, absences = [] }: VacationCalendarProps) {
  const { userProfile } = useAuth();
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth();

  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('all');
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [selectedMonth, setSelectedMonth] = useState<number>(currentMonth);
  const [vacations, setVacations] = useState<Vacation[]>([]);
  const [allocations, setAllocations] = useState<VacationAllocation[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Detect conflicts
  const conflicts = detectConflicts(absences, vacations, employees);
  const conflictsByDate = conflicts.reduce((acc, conflict) => {
    if (!acc[conflict.date]) {
      acc[conflict.date] = [];
    }
    acc[conflict.date].push(conflict);
    return acc;
  }, {} as Record<string, typeof conflicts>);
  const [showAllocationModal, setShowAllocationModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showAddVacationModal, setShowAddVacationModal] = useState(false);
  const [showEditVacationModal, setShowEditVacationModal] = useState(false);
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [selectedAllocation, setSelectedAllocation] = useState<VacationAllocation | null>(null);
  const [selectedVacation, setSelectedVacation] = useState<Vacation | null>(null);
  const [vacationToDelete, setVacationToDelete] = useState<Vacation | null>(null);
  const [transferDays, setTransferDays] = useState<number>(0);
  const [transferToYear, setTransferToYear] = useState<number>(currentYear + 1);
  const [newVacation, setNewVacation] = useState({
    employeeId: '',
    startDate: '',
    endDate: '',
    days: 0,
    notes: ''
  });
  const [editVacation, setEditVacation] = useState({
    id: '',
    employeeId: '',
    startDate: '',
    endDate: '',
    days: 0,
    notes: ''
  });

  useEffect(() => {
    if (userProfile) {
      loadVacationData();
    }
  }, [userProfile?.companyId, selectedEmployeeId, selectedYear]);

  const loadVacationData = async () => {
    if (!userProfile) return;
    
    try {
      setLoading(true);
      const filters: { employeeId?: string; status?: string } = {};
      if (selectedEmployeeId !== 'all') {
        filters.employeeId = selectedEmployeeId;
      }

      const userContext = createUserAccessContext(userProfile);
      const [vacationsData, allocationsData] = await Promise.all([
        firebaseService.getVacations(userContext || undefined, filters),
        firebaseService.getVacationAllocations(userProfile.companyId, {
          // Load all allocations for settings modal
          employeeId: undefined,
          year: undefined
        })
      ]);

      setVacations(vacationsData);
      setAllocations(allocationsData);
    } catch (error) {
      console.error('Error loading vacation data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
  };

  const isHoliday = (year: number, month: number, day: number) => {
    const holidays = NORWEGIAN_HOLIDAYS[year] || [];
    return holidays.some(h => h.month === month && h.day === day);
  };

  const getHolidayName = (year: number, month: number, day: number) => {
    const holidays = NORWEGIAN_HOLIDAYS[year] || [];
    const holiday = holidays.find(h => h.month === month && h.day === day);
    return holiday?.name || null;
  };

  const getVacationsForDate = (year: number, month: number, day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const date = new Date(year, month, day);
    
    return vacations.filter(vacation => {
      const startDate = new Date(vacation.startDate);
      const endDate = new Date(vacation.endDate);
      return date >= startDate && date <= endDate;
    });
  };

  const getVacationDayNumber = (vacation: Vacation, date: Date): number | null => {
    // Normalize dates to midnight in local timezone for accurate comparison
    const startDate = new Date(vacation.startDate);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(vacation.endDate);
    endDate.setHours(23, 59, 59, 999); // Include the entire end date
    const currentDate = new Date(date);
    currentDate.setHours(0, 0, 0, 0);
    
    if (currentDate < startDate || currentDate > endDate) return null;
    
    // Calculate difference in days
    const diffTime = currentDate.getTime() - startDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    return diffDays + 1; // Day 1, 2, 3, etc. (first day is day 1)
  };

  const calendarDays = useMemo(() => {
    const days: Array<{ day: number; isCurrentMonth: boolean; date: Date; vacations: Vacation[]; isHoliday: boolean; holidayName: string | null }> = [];
    const daysInMonth = getDaysInMonth(selectedYear, selectedMonth);
    const firstDay = getFirstDayOfMonth(selectedYear, selectedMonth);
    
    // Previous month days
    const prevMonth = selectedMonth === 0 ? 11 : selectedMonth - 1;
    const prevYear = selectedMonth === 0 ? selectedYear - 1 : selectedYear;
    const daysInPrevMonth = getDaysInMonth(prevYear, prevMonth);
    
    for (let i = firstDay - 1; i >= 0; i--) {
      const day = daysInPrevMonth - i;
      const date = new Date(prevYear, prevMonth, day);
      days.push({
        day,
        isCurrentMonth: false,
        date,
        vacations: getVacationsForDate(prevYear, prevMonth, day),
        isHoliday: isHoliday(prevYear, prevMonth, day),
        holidayName: getHolidayName(prevYear, prevMonth, day)
      });
    }
    
    // Current month days
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(selectedYear, selectedMonth, day);
      days.push({
        day,
        isCurrentMonth: true,
        date,
        vacations: getVacationsForDate(selectedYear, selectedMonth, day),
        isHoliday: isHoliday(selectedYear, selectedMonth, day),
        holidayName: getHolidayName(selectedYear, selectedMonth, day)
      });
    }
    
    // Next month days to fill the grid
    const remainingDays = 42 - days.length; // 6 weeks * 7 days
    const nextMonth = selectedMonth === 11 ? 0 : selectedMonth + 1;
    const nextYear = selectedMonth === 11 ? selectedYear + 1 : selectedYear;
    
    for (let day = 1; day <= remainingDays; day++) {
      const date = new Date(nextYear, nextMonth, day);
      days.push({
        day,
        isCurrentMonth: false,
        date,
        vacations: getVacationsForDate(nextYear, nextMonth, day),
        isHoliday: isHoliday(nextYear, nextMonth, day),
        holidayName: getHolidayName(nextYear, nextMonth, day)
      });
    }
    
    return days;
  }, [selectedYear, selectedMonth, vacations]);

  const navigateMonth = (direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      if (selectedMonth === 0) {
        setSelectedMonth(11);
        setSelectedYear(selectedYear - 1);
      } else {
        setSelectedMonth(selectedMonth - 1);
      }
    } else {
      if (selectedMonth === 11) {
        setSelectedMonth(0);
        setSelectedYear(selectedYear + 1);
      } else {
        setSelectedMonth(selectedMonth + 1);
      }
    }
  };

  const navigateYear = (direction: 'prev' | 'next') => {
    setSelectedYear(selectedYear + (direction === 'next' ? 1 : -1));
  };

  const getCurrentAllocation = () => {
    if (selectedEmployeeId === 'all') return null;
    return allocations.find(a => a.employeeId === selectedEmployeeId && a.year === selectedYear);
  };

  const handleAllocateVacation = async (employeeId: string, year: number) => {
    if (!userProfile) return;
    
    try {
      await firebaseService.createOrUpdateVacationAllocation({
        employeeId,
                year,
        allocatedDays: 25, // 5 weeks
        usedDays: 0,
        transferredDays: 0,
        remainingDays: 25
      });
      await loadVacationData();
      setShowAllocationModal(false);
      alert('Ferie allokert');
    } catch (error) {
      console.error('Error allocating vacation:', error);
      alert('Feil ved allokering av ferie');
    }
  };

  const handleTransferDays = async () => {
    if (!selectedAllocation || !userProfile?.companyId) return;
    if (transferDays <= 0 || transferDays > selectedAllocation.remainingDays) {
      alert('Ugyldig antall dager');
      return;
    }

    try {
      await firebaseService.transferVacationDays(
        selectedAllocation.employeeId,
        userProfile.companyId,
        selectedAllocation.year,
        transferToYear,
        transferDays
      );
      await loadVacationData();
      setShowTransferModal(false);
      setSelectedAllocation(null);
      setTransferDays(0);
      alert('Feriedager overført');
    } catch (error) {
      console.error('Error transferring days:', error);
      alert('Feil ved overføring av feriedager');
    }
  };

  const currentAllocation = getCurrentAllocation();
  const isAdmin = userProfile?.role === 'admin';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header with employee selector and year navigation */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1rem',
        padding: '1.5rem',
        background: 'var(--card-background)',
        borderRadius: '12px',
        border: '1px solid var(--border-color)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1, minWidth: '300px' }}>
          <User size={20} style={{ color: 'var(--gray-600)' }} />
          <select
            value={selectedEmployeeId}
            onChange={(e) => setSelectedEmployeeId(e.target.value)}
            style={{
              padding: '0.75rem 1rem',
              border: '1px solid var(--border-color)',
              borderRadius: '8px',
              fontSize: '1rem',
              background: 'var(--card-background)',
              color: 'var(--text-color)',
              minWidth: '200px',
              cursor: 'pointer'
            }}
          >
            <option value="all">Alle ansatte</option>
            {employees.map(emp => (
              <option key={emp.id} value={emp.id}>{emp.displayName}</option>
            ))}
          </select>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button
            onClick={() => navigateYear('prev')}
            disabled={selectedYear <= currentYear - 4}
            className="btn btn-secondary"
            style={{
              padding: '0.5rem',
              border: '1px solid var(--border-color)',
              borderRadius: '8px',
              background: selectedYear <= currentYear - 4 ? 'var(--gray-100)' : 'var(--card-background)',
              color: 'var(--text-color)',
              cursor: selectedYear <= currentYear - 4 ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: selectedYear <= currentYear - 4 ? 0.5 : 1
            }}
          >
            <ChevronLeft size={20} style={{ color: 'var(--text-color)' }} />
          </button>
          <span style={{ fontSize: '1.25rem', fontWeight: '600', color: 'var(--text-color)', minWidth: '80px', textAlign: 'center' }}>
            {selectedYear}
          </span>
          <button
            onClick={() => navigateYear('next')}
            disabled={selectedYear >= currentYear + 4}
            className="btn btn-secondary"
            style={{
              padding: '0.5rem',
              border: '1px solid var(--border-color)',
              borderRadius: '8px',
              background: selectedYear >= currentYear + 4 ? 'var(--gray-100)' : 'var(--card-background)',
              color: 'var(--text-color)',
              cursor: selectedYear >= currentYear + 4 ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: selectedYear >= currentYear + 4 ? 0.5 : 1
            }}
          >
            <ChevronRight size={20} style={{ color: 'var(--text-color)' }} />
          </button>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {isAdmin && (
            <button
              onClick={() => {
                setNewVacation({
                  employeeId: selectedEmployeeId !== 'all' ? selectedEmployeeId : '',
                  startDate: '',
                  endDate: '',
                  days: 0,
                  notes: ''
                });
                setShowAddVacationModal(true);
              }}
              className="btn btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              <Plus size={16} />
              Legg til ferie
            </button>
          )}
          {isAdmin && (
            <button
              onClick={() => {
                setShowSettingsModal(true);
              }}
              className="btn btn-secondary"
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              <Settings size={16} />
              Innstillinger
            </button>
          )}
        </div>
      </div>

      {/* Vacation allocation info */}
      {currentAllocation && selectedEmployeeId !== 'all' && (
        <div style={{
          padding: '1.5rem',
          background: 'var(--card-background)',
          borderRadius: '12px',
          border: '1px solid var(--border-color)',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1rem'
        }}>
          <div>
            <div style={{ fontSize: '0.875rem', color: 'var(--gray-600)', marginBottom: '0.25rem' }}>Tildelt</div>
            <div style={{ fontSize: '1.5rem', fontWeight: '600', color: 'var(--text-color)' }}>
              {currentAllocation.allocatedDays} dager
            </div>
          </div>
          <div>
            <div style={{ fontSize: '0.875rem', color: 'var(--gray-600)', marginBottom: '0.25rem' }}>Brukt</div>
            <div style={{ fontSize: '1.5rem', fontWeight: '600', color: 'var(--danger)' }}>
              {currentAllocation.usedDays} dager
            </div>
          </div>
          <div>
            <div style={{ fontSize: '0.875rem', color: 'var(--gray-600)', marginBottom: '0.25rem' }}>Overført</div>
            <div style={{ fontSize: '1.5rem', fontWeight: '600', color: 'var(--secondary)' }}>
              {currentAllocation.transferredDays || 0} dager
            </div>
          </div>
          <div>
            <div style={{ fontSize: '0.875rem', color: 'var(--gray-600)', marginBottom: '0.25rem' }}>Gjenstående</div>
            <div style={{ fontSize: '1.5rem', fontWeight: '600', color: 'var(--success)' }}>
              {currentAllocation.remainingDays} dager
            </div>
          </div>
        </div>
      )}

      {/* Calendar */}
      <div style={{
        background: 'var(--card-background)',
        borderRadius: '12px',
        border: '1px solid var(--border-color)',
        padding: '1.5rem',
        overflowX: 'auto'
      }}>
        {/* Month navigation */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1.5rem'
        }}>
          <button
            onClick={() => navigateMonth('prev')}
            className="btn btn-secondary"
            style={{
              padding: '0.5rem 1rem',
              border: '1px solid var(--border-color)',
              borderRadius: '8px',
              background: 'var(--card-background)',
              color: 'var(--text-color)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            <ChevronLeft size={20} style={{ color: 'var(--text-color)' }} />
            Forrige
          </button>
          <h2 style={{
            fontSize: '1.5rem',
            fontWeight: '600',
            color: 'var(--text-color)',
            margin: 0
          }}>
            {MONTH_NAMES[selectedMonth]} {selectedYear}
          </h2>
          <button
            onClick={() => navigateMonth('next')}
            className="btn btn-secondary"
            style={{
              padding: '0.5rem 1rem',
              border: '1px solid var(--border-color)',
              borderRadius: '8px',
              background: 'var(--card-background)',
              color: 'var(--text-color)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            Neste
            <ChevronRight size={20} style={{ color: 'var(--text-color)' }} />
          </button>
        </div>

        {/* Calendar grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          gap: '0.5rem'
        }}>
          {/* Weekday headers */}
          {WEEKDAY_NAMES.map(day => (
            <div
              key={day}
              style={{
                padding: '0.75rem',
                textAlign: 'center',
                fontWeight: '600',
                color: 'var(--gray-600)',
                fontSize: '0.875rem'
              }}
            >
              {day}
            </div>
          ))}

          {/* Calendar days */}
          {calendarDays.map((calendarDay, index) => {
            const isToday = calendarDay.date.toDateString() === new Date().toDateString();
            const dayVacations = calendarDay.vacations;
            
            return (
              <div
                key={index}
                onClick={() => {
                  if (isAdmin && selectedEmployeeId !== 'all' && calendarDay.isCurrentMonth) {
                    const dateStr = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-${String(calendarDay.day).padStart(2, '0')}`;
                    setNewVacation({
                      employeeId: selectedEmployeeId,
                      startDate: dateStr,
                      endDate: dateStr,
                      days: 1,
                      notes: ''
                    });
                    setShowAddVacationModal(true);
                  }
                }}
                style={{
                  minHeight: '100px',
                  padding: '0.5rem',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                    background: calendarDay.isCurrentMonth
                    ? (isToday ? 'rgba(6, 182, 212, 0.1)' : 'var(--card-background)')
                    : 'var(--gray-50)',
                  opacity: calendarDay.isCurrentMonth ? 1 : 0.5,
                  cursor: (isAdmin && selectedEmployeeId !== 'all' && calendarDay.isCurrentMonth) ? 'pointer' : 'default',
                  transition: 'all 0.2s',
                  position: 'relative'
                }}
                onMouseEnter={(e) => {
                  if (calendarDay.isCurrentMonth) {
                    if (isAdmin && selectedEmployeeId !== 'all') {
                      e.currentTarget.style.background = isToday ? 'rgba(6, 182, 212, 0.2)' : 'rgba(6, 182, 212, 0.1)';
                      e.currentTarget.style.borderColor = 'var(--primary)';
                    } else {
                      e.currentTarget.style.background = isToday ? 'rgba(6, 182, 212, 0.15)' : 'var(--gray-50)';
                    }
                    e.currentTarget.style.transform = 'scale(1.02)';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = calendarDay.isCurrentMonth
                    ? (isToday ? 'rgba(6, 182, 212, 0.1)' : 'var(--card-background)')
                    : 'var(--gray-50)';
                  e.currentTarget.style.borderColor = 'var(--border-color)';
                  e.currentTarget.style.transform = 'scale(1)';
                }}
              >
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: '0.25rem'
                }}>
                  <span style={{
                    fontSize: '0.875rem',
                    fontWeight: isToday ? '700' : '500',
                    color: calendarDay.isHoliday
                      ? 'var(--danger)'
                      : isToday
                      ? 'var(--primary)'
                      : calendarDay.isCurrentMonth
                      ? 'var(--text-color)'
                      : 'var(--gray-400)'
                  }}>
                    {calendarDay.day}
                  </span>
                  {calendarDay.isHoliday && (
                    <span style={{
                      fontSize: '0.625rem',
                      color: 'var(--danger)',
                      fontWeight: '600'
                    }}>
                      Rød dag
                    </span>
                  )}
                </div>
                
                {calendarDay.holidayName && (
                  <div style={{
                    fontSize: '0.625rem',
                    color: 'var(--danger)',
                    marginBottom: '0.25rem',
                    fontWeight: '500'
                  }}>
                    {calendarDay.holidayName}
                  </div>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  {dayVacations.slice(0, 2).map(vacation => {
                    const employee = employees.find(e => e.id === vacation.employeeId);
                    const statusColor = vacation.status === 'approved' ? 'var(--success)' : vacation.status === 'rejected' ? 'var(--danger)' : 'var(--warning)';
                    const dayNumber = getVacationDayNumber(vacation, calendarDay.date);
                    const isFirstDay = dayNumber === 1;
                    const isLastDay = dayNumber === vacation.days;
                    
                    return (
                      <div
                        key={vacation.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (isAdmin) {
                            setSelectedVacation(vacation);
                            setEditVacation({
                              id: vacation.id,
                              employeeId: vacation.employeeId,
                              startDate: vacation.startDate,
                              endDate: vacation.endDate,
                              days: vacation.days,
                              notes: vacation.notes || ''
                            });
                            setShowEditVacationModal(true);
                          }
                        }}
                        style={{
                          fontSize: '0.625rem',
                          padding: '0.125rem 0.375rem',
                          borderRadius: '4px',
                          background: vacation.status === 'approved' 
                            ? 'rgba(16, 185, 129, 0.2)' 
                            : vacation.status === 'rejected' 
                            ? 'rgba(239, 68, 68, 0.2)' 
                            : 'rgba(245, 158, 11, 0.2)',
                          color: statusColor,
                          fontWeight: '500',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          border: `1px solid ${vacation.status === 'approved' 
                            ? 'rgba(16, 185, 129, 0.3)' 
                            : vacation.status === 'rejected' 
                            ? 'rgba(239, 68, 68, 0.3)' 
                            : 'rgba(245, 158, 11, 0.3)'}`,
                          cursor: isAdmin ? 'pointer' : 'default',
                          transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => {
                          if (isAdmin) {
                            e.currentTarget.style.transform = 'scale(1.05)';
                            e.currentTarget.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.2)';
                          }
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'scale(1)';
                          e.currentTarget.style.boxShadow = 'none';
                        }}
                        title={`${employee?.displayName || vacation.employeeName}: Dag ${dayNumber} av ${vacation.days} - ${vacation.status === 'approved' ? 'Godkjent' : vacation.status === 'rejected' ? 'Avvist' : 'Venter'}${isAdmin ? ' (Klikk for å redigere)' : ''}`}
                      >
                        {selectedEmployeeId === 'all' ? `${employee?.displayName || vacation.employeeName} ` : ''}
                        {isFirstDay ? `Dag 1` : isLastDay ? `Dag ${dayNumber}` : `Dag ${dayNumber}`}
                        {isFirstDay && `/${vacation.days}`}
                      </div>
                    );
                  })}
                  {dayVacations.length > 2 && (
                    <div style={{
                      fontSize: '0.625rem',
                      color: 'var(--gray-600)',
                      fontWeight: '500'
                    }}>
                      +{dayVacations.length - 2} mer
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Edit Vacation Modal */}
      {showEditVacationModal && selectedVacation && (
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
        onClick={() => setShowEditVacationModal(false)}
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
            <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: 'var(--text-color)', marginBottom: '1.5rem' }}>
              Rediger ferie
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-color)', marginBottom: '0.5rem', display: 'block' }}>
                  Ansatt *
                </label>
                <select
                  value={editVacation.employeeId}
                  onChange={(e) => setEditVacation({ ...editVacation, employeeId: e.target.value })}
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
                    <option key={emp.id} value={emp.id}>{emp.displayName}</option>
                  ))}
                </select>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-color)', marginBottom: '0.5rem', display: 'block' }}>
                    Startdato *
                  </label>
                  <input
                    type="date"
                    value={editVacation.startDate}
                    onChange={(e) => {
                      const startDate = e.target.value;
                      const endDate = editVacation.endDate;
                      let days = 0;
                      if (startDate && endDate) {
                        const start = new Date(startDate);
                        const end = new Date(endDate);
                        const diffTime = Math.abs(end.getTime() - start.getTime());
                        days = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
                      }
                      setEditVacation({ ...editVacation, startDate, days });
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
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-color)', marginBottom: '0.5rem', display: 'block' }}>
                    Sluttdato *
                  </label>
                  <input
                    type="date"
                    value={editVacation.endDate}
                    onChange={(e) => {
                      const endDate = e.target.value;
                      const startDate = editVacation.startDate;
                      let days = 0;
                      if (startDate && endDate) {
                        const start = new Date(startDate);
                        const end = new Date(endDate);
                        const diffTime = Math.abs(end.getTime() - start.getTime());
                        days = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
                      }
                      setEditVacation({ ...editVacation, endDate, days });
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
                  />
                </div>
              </div>
              <div>
                <label style={{ fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-color)', marginBottom: '0.5rem', display: 'block' }}>
                  Antall dager
                </label>
                <input
                  type="number"
                  value={editVacation.days}
                  readOnly
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    fontSize: '1rem',
                    background: 'var(--gray-50)',
                    color: 'var(--text-color)'
                  }}
                />
              </div>
              <div>
                <label style={{ fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-color)', marginBottom: '0.5rem', display: 'block' }}>
                  Notater
                </label>
                <textarea
                  value={editVacation.notes}
                  onChange={(e) => setEditVacation({ ...editVacation, notes: e.target.value })}
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
                  placeholder="Valgfrie notater..."
                />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem', justifyContent: 'space-between' }}>
              <button
                onClick={() => {
                  if (selectedVacation) {
                    setVacationToDelete(selectedVacation);
                    setShowDeleteConfirmModal(true);
                  }
                }}
                className="btn btn-danger"
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
              >
                <Trash2 size={16} />
                Slett ferie
              </button>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button
                  onClick={() => {
                    setShowEditVacationModal(false);
                    setSelectedVacation(null);
                  }}
                  className="btn btn-secondary"
                >
                  Avbryt
                </button>
                <button
                  onClick={async () => {
                    if (!editVacation.employeeId || !editVacation.startDate || !editVacation.endDate || !userProfile?.companyId) {
                      alert('Vennligst fyll ut alle påkrevde felt');
                      return;
                    }
                    const employee = employees.find(e => e.id === editVacation.employeeId);
                    if (!employee) {
                      alert('Ansatt ikke funnet');
                      return;
                    }
                    try {
                      const oldVacation = selectedVacation;
                      const oldYear = new Date(oldVacation.startDate).getFullYear();
                      const newYear = new Date(editVacation.startDate).getFullYear();
                      
                      // Update vacation
                      await firebaseService.updateVacation(editVacation.id, {
                        employeeId: editVacation.employeeId,
                        employeeName: employee.displayName,
                        startDate: editVacation.startDate,
                        endDate: editVacation.endDate,
                        days: editVacation.days,
                        notes: editVacation.notes || undefined,
                        year: newYear
                      });
                      
                      // Update allocations - remove old days, add new days
                      if (oldYear === newYear) {
                        // Same year - adjust allocation
                        const allocation = allocations.find(
                          a => a.employeeId === editVacation.employeeId && a.year === newYear
                        );
                        if (allocation) {
                          const dayDifference = editVacation.days - oldVacation.days;
                          await firebaseService.createOrUpdateVacationAllocation({
                            employeeId: editVacation.employeeId,
                                                        year: newYear,
                            allocatedDays: allocation.allocatedDays,
                            usedDays: allocation.usedDays + dayDifference,
                            transferredDays: allocation.transferredDays || 0,
                            remainingDays: allocation.remainingDays - dayDifference
                          });
                        }
                      } else {
                        // Different year - update both years
                        const oldAllocation = allocations.find(
                          a => a.employeeId === editVacation.employeeId && a.year === oldYear
                        );
                        const newAllocation = allocations.find(
                          a => a.employeeId === editVacation.employeeId && a.year === newYear
                        );
                        
                        if (oldAllocation) {
                          await firebaseService.createOrUpdateVacationAllocation({
                            employeeId: editVacation.employeeId,
                                                        year: oldYear,
                            allocatedDays: oldAllocation.allocatedDays,
                            usedDays: oldAllocation.usedDays - oldVacation.days,
                            transferredDays: oldAllocation.transferredDays || 0,
                            remainingDays: oldAllocation.remainingDays + oldVacation.days
                          });
                        }
                        
                        if (newAllocation) {
                          await firebaseService.createOrUpdateVacationAllocation({
                            employeeId: editVacation.employeeId,
                                                        year: newYear,
                            allocatedDays: newAllocation.allocatedDays,
                            usedDays: newAllocation.usedDays + editVacation.days,
                            transferredDays: newAllocation.transferredDays || 0,
                            remainingDays: newAllocation.remainingDays - editVacation.days
                          });
                        } else {
                          await firebaseService.createOrUpdateVacationAllocation({
                            employeeId: editVacation.employeeId,
                                                        year: newYear,
                            allocatedDays: 25,
                            usedDays: editVacation.days,
                            transferredDays: 0,
                            remainingDays: 25 - editVacation.days
                          });
                        }
                      }
                      
                      await loadVacationData();
                      setShowEditVacationModal(false);
                      setSelectedVacation(null);
                      alert('Ferie oppdatert');
                    } catch (error) {
                      console.error('Error updating vacation:', error);
                      alert('Feil ved oppdatering av ferie');
                    }
                  }}
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

      {/* Delete Confirmation Modal */}
      {showDeleteConfirmModal && vacationToDelete && (
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
          zIndex: 1001,
          padding: '1rem'
        }}
        onClick={() => {
          setShowDeleteConfirmModal(false);
          setVacationToDelete(null);
        }}
        >
          <div style={{
            background: 'var(--card-background)',
            borderRadius: '12px',
            maxWidth: '500px',
            width: '100%',
            padding: '1.5rem',
            boxShadow: 'var(--shadow-xl)'
          }}
          onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: 'var(--text-color)', marginBottom: '1rem' }}>
              Bekreft sletting
            </h3>
            <p style={{ fontSize: '1rem', color: 'var(--text-color)', marginBottom: '1.5rem', lineHeight: '1.6' }}>
              Er du sikker på at du vil slette ferien for <strong>{vacationToDelete.employeeName}</strong> fra {new Date(vacationToDelete.startDate).toLocaleDateString('nb-NO')} til {new Date(vacationToDelete.endDate).toLocaleDateString('nb-NO')} ({vacationToDelete.days} dager)?
            </p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  setShowDeleteConfirmModal(false);
                  setVacationToDelete(null);
                }}
                className="btn btn-secondary"
              >
                Avbryt
              </button>
              <button
                onClick={async () => {
                  if (!vacationToDelete || !userProfile?.companyId) return;
                  
                  try {
                    const vacationYear = new Date(vacationToDelete.startDate).getFullYear();
                    
                    // Delete vacation
                    await firebaseService.deleteVacation(vacationToDelete.id);
                    
                    // Update allocation - add back the days
                    const allocation = allocations.find(
                      a => a.employeeId === vacationToDelete.employeeId && a.year === vacationYear
                    );
                    
                    if (allocation) {
                      await firebaseService.createOrUpdateVacationAllocation({
                        employeeId: vacationToDelete.employeeId,
                                                year: vacationYear,
                        allocatedDays: allocation.allocatedDays,
                        usedDays: allocation.usedDays - vacationToDelete.days,
                        transferredDays: allocation.transferredDays || 0,
                        remainingDays: allocation.remainingDays + vacationToDelete.days
                      });
                    }
                    
                    await loadVacationData();
                    setShowDeleteConfirmModal(false);
                    setShowEditVacationModal(false);
                    setVacationToDelete(null);
                    setSelectedVacation(null);
                    alert('Ferie slettet');
                  } catch (error) {
                    console.error('Error deleting vacation:', error);
                    alert('Feil ved sletting av ferie');
                  }
                }}
                className="btn btn-danger"
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
              >
                <Trash2 size={16} />
                Slett
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Vacation Rules Tips */}
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
          <strong style={{ fontSize: '0.6875rem', color: 'var(--text-color)', display: 'block', marginBottom: '0.25rem' }}>Ferieregler (Arbeidsmiljøloven § 12-2):</strong> 
          Alle ansatte har rett til 25 feriedager (5 uker) per år. Ferie må tas i løpet av ferieåret (1. april - 31. mars) eller innen 30. september året etter. 
          Opptil 5 dager kan overføres til neste år. Ferie må godkjennes av arbeidsgiver minst 2 måneder før ferien starter. 
          Hovedferie (minimum 3 sammenhengende uker) skal tas i perioden 1. juni - 30. september. 
          Ferie kan ikke tas i permisjonsperioder. Feriepenger utbetales før ferien starter.
        </div>
      </div>

      {/* Add Vacation Modal */}
      {showAddVacationModal && (
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
        onClick={() => setShowAddVacationModal(false)}
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
            <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: 'var(--text-color)', marginBottom: '1.5rem' }}>
              Legg til ferie
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-color)', marginBottom: '0.5rem', display: 'block' }}>
                  Ansatt *
                </label>
                <select
                  value={newVacation.employeeId}
                  onChange={(e) => setNewVacation({ ...newVacation, employeeId: e.target.value })}
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
                    <option key={emp.id} value={emp.id}>{emp.displayName}</option>
                  ))}
                </select>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-color)', marginBottom: '0.5rem', display: 'block' }}>
                    Startdato *
                  </label>
                  <input
                    type="date"
                    value={newVacation.startDate}
                    onChange={(e) => {
                      const startDate = e.target.value;
                      const endDate = newVacation.endDate;
                      let days = 0;
                      if (startDate && endDate) {
                        const start = new Date(startDate);
                        const end = new Date(endDate);
                        const diffTime = Math.abs(end.getTime() - start.getTime());
                        days = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
                      }
                      setNewVacation({ ...newVacation, startDate, days });
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
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-color)', marginBottom: '0.5rem', display: 'block' }}>
                    Sluttdato *
                  </label>
                  <input
                    type="date"
                    value={newVacation.endDate}
                    onChange={(e) => {
                      const endDate = e.target.value;
                      const startDate = newVacation.startDate;
                      let days = 0;
                      if (startDate && endDate) {
                        const start = new Date(startDate);
                        const end = new Date(endDate);
                        const diffTime = Math.abs(end.getTime() - start.getTime());
                        days = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
                      }
                      setNewVacation({ ...newVacation, endDate, days });
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
                  />
                </div>
              </div>
              <div>
                <label style={{ fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-color)', marginBottom: '0.5rem', display: 'block' }}>
                  Antall dager
                </label>
                <input
                  type="number"
                  value={newVacation.days}
                  readOnly
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    fontSize: '1rem',
                    background: 'var(--gray-50)',
                    color: 'var(--text-color)'
                  }}
                />
              </div>
              <div>
                <label style={{ fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-color)', marginBottom: '0.5rem', display: 'block' }}>
                  Notater
                </label>
                <textarea
                  value={newVacation.notes}
                  onChange={(e) => setNewVacation({ ...newVacation, notes: e.target.value })}
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
                  placeholder="Valgfrie notater..."
                />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowAddVacationModal(false)}
                className="btn btn-secondary"
              >
                Avbryt
              </button>
              <button
                onClick={async () => {
                  if (!newVacation.employeeId || !newVacation.startDate || !newVacation.endDate || !userProfile?.companyId) {
                    alert('Vennligst fyll ut alle påkrevde felt');
                    return;
                  }
                  const employee = employees.find(e => e.id === newVacation.employeeId);
                  if (!employee) {
                    alert('Ansatt ikke funnet');
                    return;
                  }
                  try {
                    const vacationYear = new Date(newVacation.startDate).getFullYear();
                    await firebaseService.createVacation({
                      employeeId: newVacation.employeeId,
                      employeeName: employee.displayName,
                                            startDate: newVacation.startDate,
                      endDate: newVacation.endDate,
                      type: 'vacation',
                      days: newVacation.days,
                      status: 'approved',
                      notes: newVacation.notes || undefined,
                      year: vacationYear
                    });
                    
                    // Update allocation
                    const existingAllocation = allocations.find(
                      a => a.employeeId === newVacation.employeeId && a.year === vacationYear
                    );
                    
                    if (existingAllocation) {
                      await firebaseService.createOrUpdateVacationAllocation({
                        employeeId: newVacation.employeeId,
                                                year: vacationYear,
                        allocatedDays: existingAllocation.allocatedDays,
                        usedDays: existingAllocation.usedDays + newVacation.days,
                        transferredDays: existingAllocation.transferredDays || 0,
                        remainingDays: existingAllocation.remainingDays - newVacation.days
                      });
                    } else {
                      // Create new allocation if it doesn't exist
                      await firebaseService.createOrUpdateVacationAllocation({
                        employeeId: newVacation.employeeId,
                                                year: vacationYear,
                        allocatedDays: 25,
                        usedDays: newVacation.days,
                        transferredDays: 0,
                        remainingDays: 25 - newVacation.days
                      });
                    }
                    
                    await loadVacationData();
                    setShowAddVacationModal(false);
                    setNewVacation({ employeeId: '', startDate: '', endDate: '', days: 0, notes: '' });
                    alert('Ferie lagt til');
                  } catch (error) {
                    console.error('Error creating vacation:', error);
                    alert('Feil ved opprettelse av ferie');
                  }
                }}
                className="btn btn-primary"
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
              >
                <Save size={16} />
                Lagre ferie
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {showSettingsModal && (
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
        onClick={() => setShowSettingsModal(false)}
        >
          <div style={{
            background: 'var(--card-background)',
            borderRadius: '16px',
            maxWidth: '1000px',
            width: '100%',
            padding: 0,
            boxShadow: 'var(--shadow-xl)',
            maxHeight: '90vh',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column'
          }}
          onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{
              padding: '1.5rem 2rem',
              borderBottom: '1px solid var(--border-color)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white'
            }}>
              <div>
                <h3 style={{ fontSize: '1.5rem', fontWeight: '700', margin: 0, marginBottom: '0.25rem' }}>
                  Ferieinnstillinger
                </h3>
                <p style={{ fontSize: '0.875rem', opacity: 0.9, margin: 0 }}>
                  Administrer ferieallokeringer og overføringer
                </p>
              </div>
              <button
                onClick={() => setShowSettingsModal(false)}
                style={{
                  background: 'rgba(255, 255, 255, 0.2)',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '0.5rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'background 0.2s',
                  color: 'white'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)'}
              >
                <X size={24} />
              </button>
            </div>

            {/* Content */}
            <div style={{ padding: '2rem', overflowY: 'auto', flex: 1 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                {/* Year Selector */}
                <div>
                  <label style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-color)', marginBottom: '0.75rem', display: 'block' }}>
                    Velg år for visning
                  </label>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <button
                      onClick={() => setSelectedYear(selectedYear - 1)}
                      disabled={selectedYear <= currentYear - 4}
                      style={{
                        padding: '0.5rem 1rem',
                        border: '1px solid var(--border-color)',
                        borderRadius: '8px',
                        background: selectedYear <= currentYear - 4 ? 'var(--gray-100)' : 'var(--card-background)',
                        cursor: selectedYear <= currentYear - 4 ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                      }}
                    >
                      <ChevronLeft size={18} />
                    </button>
                    <div style={{
                      padding: '0.75rem 1.5rem',
                      border: '2px solid var(--primary)',
                      borderRadius: '8px',
                      background: 'var(--primary)',
                      color: 'white',
                      fontSize: '1.125rem',
                      fontWeight: '600',
                      minWidth: '100px',
                      textAlign: 'center'
                    }}>
                      {selectedYear}
                    </div>
                    <button
                      onClick={() => setSelectedYear(selectedYear + 1)}
                      disabled={selectedYear >= currentYear + 4}
                      style={{
                        padding: '0.5rem 1rem',
                        border: '1px solid var(--border-color)',
                        borderRadius: '8px',
                        background: selectedYear >= currentYear + 4 ? 'var(--gray-100)' : 'var(--card-background)',
                        cursor: selectedYear >= currentYear + 4 ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                      }}
                    >
                      <ChevronRight size={18} />
                    </button>
                  </div>
                </div>

                {/* Statistics Summary */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '1rem',
                  padding: '1.5rem',
                  background: 'var(--gray-50)',
                  borderRadius: '12px',
                  border: '1px solid var(--border-color)'
                }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '0.875rem', color: 'var(--gray-600)', marginBottom: '0.5rem' }}>
                      Totalt ansatte
                    </div>
                    <div style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--text-color)' }}>
                      {employees.length}
                    </div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '0.875rem', color: 'var(--gray-600)', marginBottom: '0.5rem' }}>
                      Med gjenstående dager
                    </div>
                    <div style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--success)' }}>
                      {employees.filter(emp => {
                        const empAllocations = allocations.filter(a => a.employeeId === emp.id);
                        const currentYearAlloc = empAllocations.find(a => a.year === selectedYear);
                        return currentYearAlloc && currentYearAlloc.remainingDays > 0;
                      }).length}
                    </div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '0.875rem', color: 'var(--gray-600)', marginBottom: '0.5rem' }}>
                      Totalt gjenstående
                    </div>
                    <div style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--secondary)' }}>
                      {allocations
                        .filter(a => a.year === selectedYear)
                        .reduce((sum, a) => sum + a.remainingDays, 0)} dager
                    </div>
                  </div>
                </div>

                {/* Employees with Remaining Days */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h4 style={{ fontSize: '1.125rem', fontWeight: '600', color: 'var(--text-color)', margin: 0 }}>
                      Ansatte med gjenstående feriedager
                    </h4>
                    <div style={{
                      padding: '0.25rem 0.75rem',
                      borderRadius: '9999px',
                      background: 'rgba(16, 185, 129, 0.2)',
                      color: 'var(--success)',
                      fontSize: '0.875rem',
                      fontWeight: '600',
                      border: '1px solid rgba(16, 185, 129, 0.3)'
                    }}>
                      {employees.filter(emp => {
                        const empAllocations = allocations.filter(a => a.employeeId === emp.id);
                        const currentYearAlloc = empAllocations.find(a => a.year === selectedYear);
                        return currentYearAlloc && currentYearAlloc.remainingDays > 0;
                      }).length} ansatte
                    </div>
                  </div>
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.75rem',
                    maxHeight: '400px',
                    overflowY: 'auto',
                    paddingRight: '0.5rem'
                  }}>
                    {employees.map(employee => {
                      const employeeAllocations = allocations.filter(a => a.employeeId === employee.id);
                      const currentYearAllocation = employeeAllocations.find(a => a.year === selectedYear);
                      const hasRemainingDays = currentYearAllocation && currentYearAllocation.remainingDays > 0;
                      
                      if (!hasRemainingDays) return null;
                      
                      const usedPercentage = currentYearAllocation 
                        ? (currentYearAllocation.usedDays / (currentYearAllocation.allocatedDays + (currentYearAllocation.transferredDays || 0))) * 100 
                        : 0;
                      
                      return (
                        <div
                          key={employee.id}
                          style={{
                            padding: '1.25rem',
                            border: '2px solid var(--border-color)',
                            borderRadius: '12px',
                            background: 'var(--card-background)',
                            transition: 'all 0.2s',
                            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.borderColor = 'var(--primary)';
                            e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
                            e.currentTarget.style.transform = 'translateY(-2px)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor = 'var(--border-color)';
                            e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)';
                            e.currentTarget.style.transform = 'translateY(0)';
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                            <div style={{ flex: 1 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                                <div style={{
                                  width: '40px',
                                  height: '40px',
                                  borderRadius: '50%',
                                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  color: 'white',
                                  fontWeight: '700',
                                  fontSize: '1.125rem',
                                  flexShrink: 0
                                }}>
                                  {employee.displayName?.charAt(0).toUpperCase() || '?'}
                                </div>
                                <div>
                                  <div style={{ fontSize: '1.125rem', fontWeight: '600', color: 'var(--text-color)', marginBottom: '0.125rem' }}>
                                    {employee.displayName}
                                  </div>
                                  {employee.position && (
                                    <div style={{ fontSize: '0.875rem', color: 'var(--gray-600)' }}>
                                      {employee.position}
                                    </div>
                                  )}
                                </div>
                              </div>
                              
                              {/* Progress Bar */}
                              <div style={{ marginTop: '0.75rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                                  <span style={{ fontSize: '0.75rem', color: 'var(--gray-600)', fontWeight: '500' }}>
                                    Feriebruk
                                  </span>
                                  <span style={{ fontSize: '0.75rem', color: 'var(--gray-600)', fontWeight: '600' }}>
                                    {usedPercentage.toFixed(0)}%
                                  </span>
                                </div>
                                <div style={{
                                  width: '100%',
                                  height: '8px',
                                  background: 'var(--gray-200)',
                                  borderRadius: '9999px',
                                  overflow: 'hidden'
                                }}>
                                  <div style={{
                                    width: `${usedPercentage}%`,
                                    height: '100%',
                                    background: usedPercentage > 80 ? 'var(--danger)' : usedPercentage > 60 ? 'var(--warning)' : 'var(--success)',
                                    borderRadius: '9999px',
                                    transition: 'width 0.3s ease'
                                  }} />
                                </div>
                              </div>
                            </div>
                            
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem', marginLeft: '1rem' }}>
                              <div style={{
                                padding: '0.5rem 1rem',
                                background: 'rgba(16, 185, 129, 0.2)',
                                borderRadius: '8px',
                                border: '1px solid rgba(16, 185, 129, 0.3)'
                              }}>
                                <div style={{ fontSize: '0.75rem', color: 'var(--gray-600)', marginBottom: '0.125rem' }}>
                                  Gjenstående
                                </div>
                                <div style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--success)' }}>
                                  {currentYearAllocation?.remainingDays || 0}
                                </div>
                                <div style={{ fontSize: '0.625rem', color: 'var(--gray-600)' }}>
                                  dager
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Detailed Stats */}
                          <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(3, 1fr)',
                            gap: '0.75rem',
                            padding: '0.75rem',
                            background: 'var(--gray-50)',
                            borderRadius: '8px',
                            marginBottom: '1rem'
                          }}>
                            <div>
                              <div style={{ fontSize: '0.75rem', color: 'var(--gray-600)', marginBottom: '0.25rem' }}>
                                Tildelt
                              </div>
                              <div style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--text-color)' }}>
                                {currentYearAllocation?.allocatedDays || 0} dager
                              </div>
                            </div>
                            <div>
                              <div style={{ fontSize: '0.75rem', color: 'var(--gray-600)', marginBottom: '0.25rem' }}>
                                Brukt
                              </div>
                              <div style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--danger)' }}>
                                {currentYearAllocation?.usedDays || 0} dager
                              </div>
                            </div>
                            <div>
                              <div style={{ fontSize: '0.75rem', color: 'var(--gray-600)', marginBottom: '0.25rem' }}>
                                Overført
                              </div>
                              <div style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--secondary)' }}>
                                {currentYearAllocation?.transferredDays || 0} dager
                              </div>
                            </div>
                          </div>

                          {/* Employee Vacations List */}
                          <div style={{ marginTop: '1rem', marginBottom: '1rem' }}>
                            <div style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-color)', marginBottom: '0.75rem' }}>
                              Ferier ({selectedYear})
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '200px', overflowY: 'auto' }}>
                              {vacations
                                .filter(v => v.employeeId === employee.id && new Date(v.startDate).getFullYear() === selectedYear)
                                .map(vacation => (
                                  <div
                                    key={vacation.id}
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
                                      <div style={{ fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-color)' }}>
                                        {new Date(vacation.startDate).toLocaleDateString('nb-NO')} - {new Date(vacation.endDate).toLocaleDateString('nb-NO')}
                                      </div>
                                      <div style={{ fontSize: '0.75rem', color: 'var(--gray-600)' }}>
                                        {vacation.days} dager • {vacation.status === 'approved' ? 'Godkjent' : vacation.status === 'rejected' ? 'Avvist' : 'Venter'}
                                      </div>
                                    </div>
                                    <button
                                      onClick={async () => {
                                        if (confirm(`Er du sikker på at du vil slette ferien fra ${new Date(vacation.startDate).toLocaleDateString('nb-NO')} til ${new Date(vacation.endDate).toLocaleDateString('nb-NO')}?`)) {
                                          try {
                                            const vacationYear = new Date(vacation.startDate).getFullYear();
                                            await firebaseService.deleteVacation(vacation.id);
                                            
                                            const allocation = allocations.find(
                                              a => a.employeeId === vacation.employeeId && a.year === vacationYear
                                            );
                                            
                                            if (allocation && userProfile?.companyId) {
                                              await firebaseService.createOrUpdateVacationAllocation({
                                                employeeId: vacation.employeeId,
                                                                                                year: vacationYear,
                                                allocatedDays: allocation.allocatedDays,
                                                usedDays: allocation.usedDays - vacation.days,
                                                transferredDays: allocation.transferredDays || 0,
                                                remainingDays: allocation.remainingDays + vacation.days
                                              });
                                            }
                                            
                                            await loadVacationData();
                                            alert('Ferie slettet');
                                          } catch (error) {
                                            console.error('Error deleting vacation:', error);
                                            alert('Feil ved sletting av ferie');
                                          }
                                        }
                                      }}
                                      className="btn btn-danger"
                                      style={{
                                        padding: '0.5rem',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.25rem',
                                        fontSize: '0.75rem'
                                      }}
                                    >
                                      <Trash2 size={14} />
                                    </button>
                                  </div>
                                ))}
                              {vacations.filter(v => v.employeeId === employee.id && new Date(v.startDate).getFullYear() === selectedYear).length === 0 && (
                                <div style={{ fontSize: '0.875rem', color: 'var(--gray-600)', textAlign: 'center', padding: '1rem' }}>
                                  Ingen ferier registrert for {selectedYear}
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Actions */}
                          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                            {currentYearAllocation && currentYearAllocation.remainingDays > 0 && (
                              <button
                                onClick={() => {
                                  setSelectedAllocation(currentYearAllocation);
                                  setTransferToYear(selectedYear + 1);
                                  setTransferDays(Math.min(currentYearAllocation.remainingDays, 5));
                                  setShowTransferModal(true);
                                  setShowSettingsModal(false);
                                }}
                                className="btn btn-primary"
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '0.5rem',
                                  padding: '0.625rem 1.25rem',
                                  fontSize: '0.875rem',
                                  fontWeight: '600'
                                }}
                              >
                                <Plane size={16} />
                                Overfør til {selectedYear + 1}
                              </button>
                            )}
                            <button
                              onClick={async () => {
                                if (!userProfile) return;
                                try {
                                  await handleAllocateVacation(employee.id, selectedYear);
                                  await loadVacationData();
                                } catch (error) {
                                  console.error('Error allocating vacation:', error);
                                }
                              }}
                              className="btn btn-secondary"
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                padding: '0.625rem 1.25rem',
                                fontSize: '0.875rem'
                              }}
                            >
                              <Settings size={16} />
                              Alloker ferie
                            </button>
                          </div>
                        </div>
                      );
                    })}
                    {employees.filter(emp => {
                      const empAllocations = allocations.filter(a => a.employeeId === emp.id);
                      const currentYearAlloc = empAllocations.find(a => a.year === selectedYear);
                      return currentYearAlloc && currentYearAlloc.remainingDays > 0;
                    }).length === 0 && (
                      <div style={{
                        textAlign: 'center',
                        padding: '3rem 2rem',
                        background: 'var(--gray-50)',
                        borderRadius: '12px',
                        border: '2px dashed var(--border-color)'
                      }}>
                        <CalendarDays size={48} style={{ color: 'var(--gray-400)', margin: '0 auto 1rem' }} />
                        <div style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--text-color)', marginBottom: '0.5rem' }}>
                          Ingen ansatte med gjenstående feriedager
                        </div>
                        <div style={{ fontSize: '0.875rem', color: 'var(--gray-600)' }}>
                          Alle ansatte har brukt opp feriedagene sine for {selectedYear}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div style={{
              padding: '1.5rem 2rem',
              borderTop: '1px solid var(--border-color)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: 'var(--gray-50)'
            }}>
              <div style={{ fontSize: '0.875rem', color: 'var(--gray-600)' }}>
                <Info size={16} style={{ display: 'inline', marginRight: '0.5rem', verticalAlign: 'middle' }} />
                Du kan overføre opptil 5 dager per ansatt til neste år
              </div>
              <button
                onClick={() => setShowSettingsModal(false)}
                className="btn btn-secondary"
                style={{ padding: '0.75rem 1.5rem' }}
              >
                Lukk
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Transfer Modal */}
      {showTransferModal && selectedAllocation && (
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
        onClick={() => setShowTransferModal(false)}
        >
          <div style={{
            background: 'var(--card-background)',
            borderRadius: '12px',
            maxWidth: '500px',
            width: '100%',
            padding: '1.5rem',
            boxShadow: 'var(--shadow-xl)'
          }}
          onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: 'var(--text-color)', marginBottom: '1rem' }}>
              Overfør feriedager
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
              <div>
                <label style={{ fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-color)', marginBottom: '0.5rem', display: 'block' }}>
                  Fra år: {selectedAllocation.year}
                </label>
                <div style={{ fontSize: '0.875rem', color: 'var(--gray-600)' }}>
                  Gjenstående dager: {selectedAllocation.remainingDays}
                </div>
              </div>
              <div>
                <label style={{ fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-color)', marginBottom: '0.5rem', display: 'block' }}>
                  Til år
                </label>
                <input
                  type="number"
                  value={transferToYear}
                  onChange={(e) => setTransferToYear(parseInt(e.target.value) || selectedYear + 1)}
                  min={selectedYear + 1}
                  max={selectedYear + 4}
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
                  Antall dager
                </label>
                <input
                  type="number"
                  value={transferDays}
                  onChange={(e) => setTransferDays(parseInt(e.target.value) || 0)}
                  min={1}
                  max={selectedAllocation.remainingDays}
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
                <div style={{ fontSize: '0.75rem', color: 'var(--gray-600)', marginTop: '0.25rem' }}>
                  Maks: {selectedAllocation.remainingDays} dager
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowTransferModal(false)}
                className="btn btn-secondary"
              >
                Avbryt
              </button>
              <button
                onClick={handleTransferDays}
                className="btn btn-primary"
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
              >
                <Save size={16} />
                Overfør
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Allocation Modal */}
      {showAllocationModal && selectedAllocation && (
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
        onClick={() => setShowAllocationModal(false)}
        >
          <div style={{
            background: 'var(--card-background)',
            borderRadius: '12px',
            maxWidth: '600px',
            width: '100%',
            padding: '1.5rem',
            boxShadow: 'var(--shadow-xl)'
          }}
          onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: 'var(--text-color)', marginBottom: '1rem' }}>
              Administrer ferieallokering
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{
                padding: '1rem',
                background: 'var(--gray-50)',
                borderRadius: '8px',
                border: '1px solid var(--border-color)'
              }}>
                <div style={{ fontSize: '0.875rem', color: 'var(--gray-600)', marginBottom: '0.5rem' }}>
                  År: {selectedAllocation.year}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--gray-600)' }}>Tildelt</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: '600', color: 'var(--text-color)' }}>
                      {selectedAllocation.allocatedDays} dager
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--gray-600)' }}>Gjenstående</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: '600', color: 'var(--success)' }}>
                      {selectedAllocation.remainingDays} dager
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowAllocationModal(false)}
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

