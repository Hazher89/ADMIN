'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { firebaseService } from '@/lib/firebase-services';
import type { Employee } from '@/lib/firebase-services';
import { 
  Clock, 
  Search, 
  Calendar, 
  BarChart3,
  Download,
  Edit,
  TrendingUp,
  TrendingDown,
  MapPin,
  Building,
  Zap,
  Activity,
  Timer,
  Award,
  Clock4,
  CalendarDays,
  UserX,
  UserCheck,
  RotateCcw,
  Settings,
  Bell,
  Camera,
  QrCode,
  Fingerprint,
  Coffee,
  Target,
  Play,
  Pause,
  Shield,
  Eye
} from 'lucide-react';

interface StempelEntry {
  id: string;
  employeeId: string;
  employeeName: string;
  date: string;
  punchIn: string;
  punchOut?: string;
  breakStart?: string;
  breakEnd?: string;
  totalWorkHours?: number;
  totalBreakHours?: number;
  status: 'active' | 'break' | 'completed' | 'overtime' | 'late' | 'early';
  workType: 'normal' | 'overtime' | 'vacation' | 'sick' | 'absence' | 'meeting' | 'travel' | 'training' | 'other';
  location: {
    type: 'office' | 'remote' | 'field' | 'travel';
    address?: string;
    coordinates?: { lat: number; lng: number };
    accuracy?: number;
  };
  device: {
    type: 'mobile' | 'desktop' | 'tablet' | 'kiosk';
    browser?: string;
    os?: string;
    ip?: string;
  };
  verification: {
    method: 'pin' | 'fingerprint' | 'qr' | 'face' | 'card' | 'manual';
    verified: boolean;
    adminOverride?: boolean;
  };
  notes?: string;
  overtime?: number;
  lateMinutes?: number;
  earlyMinutes?: number;
  department: string;
  shift: 'morning' | 'afternoon' | 'night' | 'flexible';
  project?: string;
  task?: string;
  isManualEntry?: boolean;
  seriesId?: string; // For serieregistrering
  approvedBy?: string;
  approvedAt?: string;
}

interface StempelStats {
  totalEmployees: number;
  activeEmployees: number;
  onBreak: number;
  lateToday: number;
  overtimeToday: number;
  averageWorkHours: number;
  totalWorkHours: number;
  productivity: number;
}

export default function StempelPage() {
  const { userProfile } = useAuth();
  const [stempelEntries, setStempelEntries] = useState<StempelEntry[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [viewMode, setViewMode] = useState<'list' | 'calendar' | 'analytics' | 'timeliste'>('list');
  const [showPunchModal, setShowPunchModal] = useState(false);
  const [showManualEntryModal, setShowManualEntryModal] = useState(false);
  const [showSeriesModal, setShowSeriesModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [punchType, setPunchType] = useState<'in' | 'out' | 'break'>('in');
  const [isMobile, setIsMobile] = useState(false);

  // Manual entry state
  const [manualEntry, setManualEntry] = useState({
    employeeId: '',
    date: new Date().toISOString().split('T')[0],
    startTime: '08:00',
    endTime: '16:00',
    workType: 'normal' as StempelEntry['workType'],
    notes: ''
  });

  // Series registration state
  const [seriesEntry, setSeriesEntry] = useState({
    employeeId: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    workType: 'vacation' as StempelEntry['workType'],
    startTime: '08:00',
    endTime: '16:00',
    notes: ''
  });

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const loadStempelData = useCallback(async () => {
    try {
      setLoading(true);
      
      if (!userProfile?.companyId) return;

      // Load real data from Firebase
      const [employeesData, timeClocksData] = await Promise.all([
        firebaseService.getEmployees(userProfile.companyId),
        firebaseService.getTimeClocks(userProfile.companyId)
      ]);

      // Convert TimeClock data to StempelEntry format
      const stempelEntries: StempelEntry[] = timeClocksData.map(clock => {
        const employee = employeesData.find(emp => emp.id === clock.employeeId);
        return {
          id: clock.id,
          employeeId: clock.employeeId,
          employeeName: employee?.displayName || 'Ukjent',
          date: clock.createdAt.split('T')[0],
          punchIn: clock.clockInTime,
          punchOut: clock.clockOutTime,
          breakStart: clock.breakStartTime,
          breakEnd: clock.breakEndTime,
          totalWorkHours: clock.totalHours,
          totalBreakHours: 0, // Calculate from break times if needed
          status: getEntryStatus(clock),
          workType: 'normal',
          location: {
            type: 'office',
            address: clock.location || 'Kontor'
          },
          device: {
            type: 'mobile',
            browser: 'Chrome Mobile'
          },
          verification: {
            method: 'pin',
            verified: true
          },
          department: employee?.departmentId || 'Ukjent',
          shift: 'morning',
          overtime: 0, // Calculate if needed
          lateMinutes: 0, // Calculate if needed
          earlyMinutes: 0, // Calculate if needed
          notes: clock.notes
        };
      });

      setStempelEntries(stempelEntries);
      setEmployees(employeesData);
    } catch (error) {
      console.error('Error loading stempel data:', error);
      setStempelEntries([]);
      setEmployees([]);
    } finally {
      setLoading(false);
    }
  }, [userProfile?.companyId]);

  const createSampleStempelData = () => {
    const currentTime = new Date().toISOString();
    const sampleEmployees: Employee[] = [
      {
        id: 'emp1',
        employeeNumber: 'EMP001',
        displayName: 'Ola Nordmann',
        email: 'ola@driftpro.no',
        phone: '+47 123 45 678',
        departmentId: 'IT',
        position: 'Utvikler',
        hireDate: '2023-01-15',
        status: 'active',
        companyId: userProfile?.companyId || '',
        role: 'employee',
        createdAt: currentTime,
        updatedAt: currentTime
      },
      {
        id: 'emp2',
        employeeNumber: 'EMP002',
        displayName: 'Kari Hansen',
        email: 'kari@driftpro.no',
        phone: '+47 234 56 789',
        departmentId: 'HR',
        position: 'HR Manager',
        hireDate: '2022-06-01',
        status: 'active',
        companyId: userProfile?.companyId || '',
        role: 'department_leader',
        createdAt: currentTime,
        updatedAt: currentTime
      },
      {
        id: 'emp3',
        employeeNumber: 'EMP003',
        displayName: 'Per Olsen',
        email: 'per@driftpro.no',
        phone: '+47 345 67 890',
        departmentId: 'Produksjon',
        position: 'Produksjonsleder',
        hireDate: '2021-09-10',
        status: 'active',
        companyId: userProfile?.companyId || '',
        role: 'department_leader',
        createdAt: currentTime,
        updatedAt: currentTime
      }
    ];

    const today = new Date().toISOString().split('T')[0];
    
    const sampleEntries: StempelEntry[] = [
      {
        id: '1',
        employeeId: 'emp1',
        employeeName: 'Ola Nordmann',
        date: today,
        punchIn: '08:00',
        punchOut: '16:00',
        breakStart: '12:00',
        breakEnd: '12:30',
        totalWorkHours: 7.5,
        totalBreakHours: 0.5,
        status: 'completed',
        workType: 'normal',
        location: { type: 'office', address: 'Hovedkontor, Oslo' },
        device: { type: 'mobile', browser: 'Chrome Mobile' },
        verification: { method: 'pin', verified: true },
        department: 'IT',
        shift: 'morning',
        project: 'Systemutvikling',
        task: 'Frontend-utvikling'
      },
      {
        id: '2',
        employeeId: 'emp2',
        employeeName: 'Kari Hansen',
        date: today,
        punchIn: '07:45',
        status: 'active',
        workType: 'normal',
        location: { type: 'remote', address: 'Hjemmekontor' },
        device: { type: 'desktop', browser: 'Safari' },
        verification: { method: 'qr', verified: true },
        department: 'HR',
        shift: 'flexible',
        project: 'HR-system'
      },
      {
        id: '3',
        employeeId: 'emp3',
        employeeName: 'Per Olsen',
        date: today,
        punchIn: '08:30',
        breakStart: '12:00',
        status: 'break',
        workType: 'normal',
        location: { type: 'office', address: 'Kontorbygning B' },
        device: { type: 'kiosk' },
        verification: { method: 'fingerprint', verified: true },
        department: 'Produksjon',
        shift: 'morning',
        lateMinutes: 30
      }
    ];

    return { entries: sampleEntries, employees: sampleEmployees };
  };

  const getEntryStatus = (clock: any): StempelEntry['status'] => {
    if (!clock.clockOutTime) {
      if (clock.breakStartTime && !clock.breakEndTime) {
        return 'break';
      }
      return 'active';
    }
    
    if (clock.overtimeHours && clock.overtimeHours > 0) {
      return 'overtime';
    }
    
    if (clock.lateMinutes && clock.lateMinutes > 0) {
      return 'late';
    }
    
    return 'completed';
  };

  const loadEmployees = useCallback(async () => {
    try {
      const data = await firebaseService.getEmployees(userProfile?.companyId || '');
      setEmployees(data);
    } catch (error) {
      console.error('Error loading employees:', error);
    }
  }, [userProfile?.companyId]);

  useEffect(() => {
    if (userProfile?.companyId) {
      loadStempelData();
      loadEmployees();
    }
  }, [userProfile?.companyId, selectedDate, loadStempelData, loadEmployees]);

  const handlePunch = async (employeeId: string, type: 'in' | 'out' | 'break') => {
    try {
      const employee = employees.find(emp => emp.id === employeeId);
      if (!employee) return;

      const now = new Date();
      const timeString = now.toTimeString().split(' ')[0];
      const dateString = now.toISOString().split('T')[0];

      // Simulate GPS location
      const mockLocation = {
        type: 'office' as const,
        address: 'Hovedkontor, Oslo',
        coordinates: { lat: 59.9139, lng: 10.7522 },
        accuracy: 5
      };

      const newEntry: StempelEntry = {
        id: Date.now().toString(),
        employeeId,
        employeeName: employee.displayName,
        date: dateString,
        punchIn: type === 'in' ? timeString : '',
        punchOut: type === 'out' ? timeString : undefined,
        breakStart: type === 'break' ? timeString : undefined,
        status: type === 'in' ? 'active' : type === 'break' ? 'break' : 'completed',
        location: mockLocation,
        device: { type: 'mobile', browser: 'Chrome Mobile' },
        verification: { method: 'pin', verified: true },
        department: (employee.departmentId as string) || 'Ukjent',
        workType: 'normal',
        shift: 'morning'
      };

      setStempelEntries(prev => [...prev, newEntry]);
      setShowPunchModal(false);
    } catch (error) {
      console.error('Error processing punch:', error);
    }
  };

  const handleManualEntry = async () => {
    try {
      const employee = employees.find(emp => emp.id === manualEntry.employeeId);
      if (!employee) return;

      const newEntry: StempelEntry = {
        id: Date.now().toString(),
        employeeId: manualEntry.employeeId,
        employeeName: employee.displayName,
        date: manualEntry.date,
        punchIn: manualEntry.startTime,
        punchOut: manualEntry.endTime,
        status: 'completed',
        workType: manualEntry.workType,
        location: { type: 'office', address: 'Manuell registrering' },
        device: { type: 'desktop' },
        verification: { method: 'manual', verified: true, adminOverride: true },
        department: employee.departmentId ? employee.departmentId : 'Ukjent',
        shift: 'morning',
        notes: manualEntry.notes,
        isManualEntry: true,
        approvedBy: userProfile?.displayName || 'Admin'
      };

      setStempelEntries(prev => [...prev, newEntry]);
      setShowManualEntryModal(false);
      setManualEntry({
        employeeId: '',
        date: new Date().toISOString().split('T')[0],
        startTime: '08:00',
        endTime: '16:00',
        workType: 'normal',
        notes: ''
      });
    } catch (error) {
      console.error('Error creating manual entry:', error);
    }
  };

  const handleSeriesRegistration = async () => {
    try {
      const employee = employees.find(emp => emp.id === seriesEntry.employeeId);
      if (!employee) return;

      const startDate = new Date(seriesEntry.startDate);
      const endDate = new Date(seriesEntry.endDate);
      const seriesId = Date.now().toString();

      const entries: StempelEntry[] = [];
      const currentDate = new Date(startDate);

      while (currentDate <= endDate) {
        const dateString = currentDate.toISOString().split('T')[0];
        
        const newEntry: StempelEntry = {
          id: `${seriesId}-${dateString}`,
          employeeId: seriesEntry.employeeId,
          employeeName: employee.displayName,
          date: dateString,
          punchIn: seriesEntry.startTime,
          punchOut: seriesEntry.endTime,
          status: 'completed',
          workType: seriesEntry.workType,
          location: { type: 'office', address: 'Serieregistrering' },
          device: { type: 'desktop' },
          verification: { method: 'manual', verified: true, adminOverride: true },
          department: employee.departmentId ? employee.departmentId : 'Ukjent',
          shift: 'morning',
          notes: seriesEntry.notes,
          isManualEntry: true,
          seriesId,
          approvedBy: userProfile?.displayName || 'Admin'
        };

        entries.push(newEntry);
        currentDate.setDate(currentDate.getDate() + 1);
      }

      setStempelEntries(prev => [...prev, ...entries]);
      setShowSeriesModal(false);
      setSeriesEntry({
        employeeId: '',
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0],
        workType: 'vacation',
        startTime: '08:00',
        endTime: '16:00',
        notes: ''
      });
    } catch (error) {
      console.error('Error creating series registration:', error);
    }
  };

  const getStempelStats = (): StempelStats => {
    const today = selectedDate;
    const todayEntries = stempelEntries.filter(entry => entry.date === today);
    
    return {
      totalEmployees: employees.length,
      activeEmployees: todayEntries.filter(entry => entry.status === 'active').length,
      onBreak: todayEntries.filter(entry => entry.status === 'break').length,
      lateToday: todayEntries.filter(entry => entry.lateMinutes && entry.lateMinutes > 0).length,
      overtimeToday: todayEntries.filter(entry => entry.overtime && entry.overtime > 0).length,
      averageWorkHours: todayEntries.length > 0 ? 
        todayEntries.reduce((sum, entry) => sum + (entry.totalWorkHours || 0), 0) / todayEntries.length : 0,
      totalWorkHours: todayEntries.reduce((sum, entry) => sum + (entry.totalWorkHours || 0), 0),
      productivity: 85 // Mock productivity score
    };
  };

  const filteredEntries = stempelEntries.filter(entry => {
    const matchesSearch = entry.employeeName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = selectedStatus === 'all' || entry.status === selectedStatus;
    const matchesDepartment = selectedDepartment === 'all' || entry.department === selectedDepartment;
    return matchesSearch && matchesStatus && matchesDepartment;
  });

  const stats = getStempelStats();

  const getWorkTypeColor = (workType: StempelEntry['workType']) => {
    switch (workType) {
      case 'normal': return 'badge-info';
      case 'overtime': return 'badge-warning';
      case 'vacation': return 'badge-success';
      case 'sick': return 'badge-danger';
      case 'absence': return 'badge-secondary';
      case 'meeting': return 'badge-primary';
      case 'travel': return 'badge-info';
      case 'training': return 'badge-success';
      default: return 'badge-secondary';
    }
  };

  const getWorkTypeLabel = (workType: StempelEntry['workType']) => {
    switch (workType) {
      case 'normal': return 'Normal';
      case 'overtime': return 'Overtid';
      case 'vacation': return 'Ferie';
      case 'sick': return 'Sykdom';
      case 'absence': return 'Fravær';
      case 'meeting': return 'Møte';
      case 'travel': return 'Reise';
      case 'training': return 'Kurs';
      default: return 'Annet';
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '50vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="loading" style={{ margin: '0 auto 1rem' }}></div>
          <p style={{ color: 'var(--gray-600)' }}>Laster stempel-data...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--gray-50)' }}>
      {/* Header */}
      <div style={{ background: 'var(--white)', boxShadow: 'var(--shadow-sm)', borderBottom: '1px solid var(--gray-200)', padding: '1.5rem 2rem' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1 style={{ fontSize: 'var(--font-size-2xl)', fontWeight: '700', color: 'var(--gray-900)', marginBottom: '0.5rem' }}>
              Avansert Stempel-system
            </h1>
            <p style={{ color: 'var(--gray-600)' }}>
              Moderne time tracking med GPS, break management og avanserte rapporter
            </p>
          </div>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button
              onClick={() => setViewMode('list')}
              style={{ 
                padding: '0.5rem 1rem', 
                border: viewMode === 'list' ? '2px solid var(--primary)' : '1px solid var(--gray-300)',
                borderRadius: 'var(--radius-lg)',
                background: viewMode === 'list' ? 'var(--primary)' : 'var(--white)',
                color: viewMode === 'list' ? 'var(--white)' : 'var(--gray-700)',
                cursor: 'pointer'
              }}
            >
              Liste
            </button>
            <button
              onClick={() => setViewMode('timeliste')}
              style={{ 
                padding: '0.5rem 1rem', 
                border: viewMode === 'timeliste' ? '2px solid var(--primary)' : '1px solid var(--gray-300)',
                borderRadius: 'var(--radius-lg)',
                background: viewMode === 'timeliste' ? 'var(--primary)' : 'var(--white)',
                color: viewMode === 'timeliste' ? 'var(--white)' : 'var(--gray-700)',
                cursor: 'pointer'
              }}
            >
              Timeliste
            </button>
            <button
              onClick={() => setViewMode('calendar')}
              style={{ 
                padding: '0.5rem 1rem', 
                border: viewMode === 'calendar' ? '2px solid var(--primary)' : '1px solid var(--gray-300)',
                borderRadius: 'var(--radius-lg)',
                background: viewMode === 'calendar' ? 'var(--primary)' : 'var(--white)',
                color: viewMode === 'calendar' ? 'var(--white)' : 'var(--gray-700)',
                cursor: 'pointer'
              }}
            >
              Kalender
            </button>
            <button
              onClick={() => setViewMode('analytics')}
              style={{ 
                padding: '0.5rem 1rem', 
                border: viewMode === 'analytics' ? '2px solid var(--primary)' : '1px solid var(--gray-300)',
                borderRadius: 'var(--radius-lg)',
                background: viewMode === 'analytics' ? 'var(--primary)' : 'var(--white)',
                color: viewMode === 'analytics' ? 'var(--white)' : 'var(--gray-700)',
                cursor: 'pointer'
              }}
            >
              Analytics
            </button>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '2rem 1rem' }}>
        {/* Advanced Action Buttons */}
        <div className="card" style={{ marginBottom: '2rem' }}>
          <h3 style={{ fontSize: 'var(--font-size-lg)', fontWeight: '600', color: 'var(--gray-900)', marginBottom: '1rem' }}>
            Avanserte Funksjoner
          </h3>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <button
              onClick={() => setShowManualEntryModal(true)}
              style={{ 
                padding: '0.75rem 1.5rem', 
                background: 'var(--blue-600)', 
                color: 'var(--white)', 
                border: 'none', 
                borderRadius: 'var(--radius-lg)', 
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              <Edit style={{ width: '16px', height: '16px' }} />
              Manuell Registrering
            </button>
            <button
              onClick={() => setShowSeriesModal(true)}
              style={{ 
                padding: '0.75rem 1.5rem', 
                background: 'var(--green-600)', 
                color: 'var(--white)', 
                border: 'none', 
                borderRadius: 'var(--radius-lg)', 
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              <Calendar style={{ width: '16px', height: '16px' }} />
              Serieregistrering
            </button>
            <button
              style={{ 
                padding: '0.75rem 1.5rem', 
                background: 'var(--orange-600)', 
                color: 'var(--white)', 
                border: 'none', 
                borderRadius: 'var(--radius-lg)', 
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              <Download style={{ width: '16px', height: '16px' }} />
              Eksporter Timeliste
            </button>
            <button
              style={{ 
                padding: '0.75rem 1.5rem', 
                background: 'var(--purple-600)', 
                color: 'var(--white)', 
                border: 'none', 
                borderRadius: 'var(--radius-lg)', 
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              <BarChart3 style={{ width: '16px', height: '16px' }} />
              Lønnskjøring
            </button>
          </div>
        </div>

        {/* Stats Overview */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <p style={{ fontSize: 'var(--font-size-sm)', fontWeight: '500', color: 'var(--gray-600)', marginBottom: '0.5rem' }}>Aktive ansatte</p>
                <p style={{ fontSize: 'var(--font-size-2xl)', fontWeight: '700', color: 'var(--green-600)' }}>{stats.activeEmployees}</p>
              </div>
              <div style={{ background: 'var(--green-100)', padding: '0.75rem', borderRadius: 'var(--radius-lg)' }}>
                <UserCheck style={{ width: '24px', height: '24px', color: 'var(--green-600)' }} />
              </div>
            </div>
          </div>
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <p style={{ fontSize: 'var(--font-size-sm)', fontWeight: '500', color: 'var(--gray-600)', marginBottom: '0.5rem' }}>På pause</p>
                <p style={{ fontSize: 'var(--font-size-2xl)', fontWeight: '700', color: 'var(--orange-600)' }}>{stats.onBreak}</p>
              </div>
              <div style={{ background: 'var(--orange-100)', padding: '0.75rem', borderRadius: 'var(--radius-lg)' }}>
                <Coffee style={{ width: '24px', height: '24px', color: 'var(--orange-600)' }} />
              </div>
            </div>
          </div>
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <p style={{ fontSize: 'var(--font-size-sm)', fontWeight: '500', color: 'var(--gray-600)', marginBottom: '0.5rem' }}>Totale timer</p>
                <p style={{ fontSize: 'var(--font-size-2xl)', fontWeight: '700', color: 'var(--blue-600)' }}>{stats.totalWorkHours.toFixed(1)}h</p>
              </div>
              <div style={{ background: 'var(--blue-100)', padding: '0.75rem', borderRadius: 'var(--radius-lg)' }}>
                <Clock style={{ width: '24px', height: '24px', color: 'var(--blue-600)' }} />
              </div>
            </div>
          </div>
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <p style={{ fontSize: 'var(--font-size-sm)', fontWeight: '500', color: 'var(--gray-600)', marginBottom: '0.5rem' }}>Produktivitet</p>
                <p style={{ fontSize: 'var(--font-size-2xl)', fontWeight: '700', color: 'var(--purple-600)' }}>{stats.productivity}%</p>
              </div>
              <div style={{ background: 'var(--purple-100)', padding: '0.75rem', borderRadius: 'var(--radius-lg)' }}>
                <Target style={{ width: '24px', height: '24px', color: 'var(--purple-600)' }} />
              </div>
            </div>
          </div>
        </div>

        {/* Quick Punch Section */}
        <div className="card" style={{ marginBottom: '2rem' }}>
          <h3 style={{ fontSize: 'var(--font-size-lg)', fontWeight: '600', color: 'var(--gray-900)', marginBottom: '1rem' }}>
            Rask Stempling
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
            {employees.slice(0, 6).map(employee => (
              <div key={employee.id} style={{ 
                border: '1px solid var(--gray-200)', 
                borderRadius: 'var(--radius-lg)', 
                padding: '1rem',
                background: 'var(--white)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                  <div>
                    <p style={{ fontWeight: '600', color: 'var(--gray-900)' }}>{employee.displayName}</p>
                    <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--gray-600)' }}>{employee.departmentId}</p>
                  </div>
                  <div style={{ 
                    width: '12px', 
                    height: '12px', 
                    borderRadius: '50%', 
                    background: stempelEntries.some(entry => 
                      entry.employeeId === employee.id && 
                      entry.status === 'active' && 
                      entry.date === selectedDate
                    ) ? 'var(--green-500)' : 'var(--gray-300)' 
                  }} />
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    onClick={() => handlePunch(employee.id, 'in')}
                    style={{ 
                      flex: '1', 
                      padding: '0.5rem', 
                      background: 'var(--green-600)', 
                      color: 'var(--white)', 
                      border: 'none', 
                      borderRadius: 'var(--radius-md)', 
                      cursor: 'pointer',
                      fontSize: 'var(--font-size-sm)'
                    }}
                  >
                    <Play style={{ width: '14px', height: '14px', marginRight: '0.25rem' }} />
                    Inn
                  </button>
                  <button
                    onClick={() => handlePunch(employee.id, 'break')}
                    style={{ 
                      flex: '1', 
                      padding: '0.5rem', 
                      background: 'var(--orange-600)', 
                      color: 'var(--white)', 
                      border: 'none', 
                      borderRadius: 'var(--radius-md)', 
                      cursor: 'pointer',
                      fontSize: 'var(--font-size-sm)'
                    }}
                  >
                    <Coffee style={{ width: '14px', height: '14px', marginRight: '0.25rem' }} />
                    Pause
                  </button>
                  <button
                    onClick={() => handlePunch(employee.id, 'out')}
                    style={{ 
                      flex: '1', 
                      padding: '0.5rem', 
                      background: 'var(--red-600)', 
                      color: 'var(--white)', 
                      border: 'none', 
                      borderRadius: 'var(--radius-md)', 
                      cursor: 'pointer',
                      fontSize: 'var(--font-size-sm)'
                    }}
                  >
                    <Pause style={{ width: '14px', height: '14px', marginRight: '0.25rem' }} />
                    Ut
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Controls */}
        <div className="card" style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <div style={{ position: 'relative', flex: '1' }}>
                <Search style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', width: '20px', height: '20px', color: 'var(--gray-400)' }} />
                <input
                  type="text"
                  placeholder="Søk etter ansatt..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{ width: '100%', padding: '0.75rem 0.75rem 0.75rem 2.5rem', border: '1px solid var(--gray-300)', borderRadius: 'var(--radius-lg)', fontSize: 'var(--font-size-base)' }}
                />
              </div>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                style={{ padding: '0.75rem', border: '1px solid var(--gray-300)', borderRadius: 'var(--radius-lg)', fontSize: 'var(--font-size-base)' }}
              />
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                style={{ padding: '0.75rem 1rem', border: '1px solid var(--gray-300)', borderRadius: 'var(--radius-lg)', fontSize: 'var(--font-size-base)', minWidth: '150px' }}
              >
                <option value="all">Alle statuser</option>
                <option value="active">Aktiv</option>
                <option value="break">Pause</option>
                <option value="completed">Ferdig</option>
                <option value="overtime">Overtid</option>
                <option value="late">Forsinket</option>
              </select>
            </div>
          </div>
        </div>

        {/* Stempel Entries List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {filteredEntries.length === 0 ? (
            <div className="card" style={{ padding: '3rem', textAlign: 'center' }}>
              <Clock style={{ width: '48px', height: '48px', color: 'var(--gray-400)', margin: '0 auto 1rem' }} />
              <h3 style={{ fontSize: 'var(--font-size-lg)', fontWeight: '600', color: 'var(--gray-900)', marginBottom: '0.5rem' }}>Ingen stempel-oppføringer</h3>
              <p style={{ color: 'var(--gray-600)' }}>Ingen stempel-oppføringer matcher søkekriteriene dine.</p>
            </div>
          ) : (
            filteredEntries.map(entry => (
              <div key={entry.id} className="card">
                <div style={{ padding: '1.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1rem' }}>
                    <div style={{ flex: '1' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
                        <h3 style={{ fontSize: 'var(--font-size-lg)', fontWeight: '600', color: 'var(--gray-900)' }}>{entry.employeeName}</h3>
                        <span className={`badge ${entry.status === 'active' ? 'badge-success' : entry.status === 'break' ? 'badge-warning' : 'badge-info'}`}>
                          {entry.status === 'active' ? 'Aktiv' : entry.status === 'break' ? 'Pause' : 'Ferdig'}
                        </span>
                      </div>
                      
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <Clock style={{ width: '16px', height: '16px', color: 'var(--gray-400)' }} />
                          <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--gray-600)' }}>
                            Inn: {entry.punchIn} {entry.punchOut && `| Ut: ${entry.punchOut}`}
                          </span>
                        </div>
                        {entry.breakStart && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Coffee style={{ width: '16px', height: '16px', color: 'var(--gray-400)' }} />
                            <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--gray-600)' }}>
                              Pause: {entry.breakStart} {entry.breakEnd && `- ${entry.breakEnd}`}
                            </span>
                          </div>
                        )}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <MapPin style={{ width: '16px', height: '16px', color: 'var(--gray-400)' }} />
                          <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--gray-600)' }}>
                            {entry.location.type === 'office' ? 'Kontor' : entry.location.type === 'remote' ? 'Hjemmekontor' : 'Felt'}
                          </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <Shield style={{ width: '16px', height: '16px', color: 'var(--gray-400)' }} />
                          <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--gray-600)' }}>
                            {entry.verification.method === 'pin' ? 'PIN' : entry.verification.method === 'fingerprint' ? 'Fingeravtrykk' : 'QR'}
                          </span>
                        </div>
                      </div>

                      {entry.totalWorkHours && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: 'var(--font-size-sm)', color: 'var(--gray-500)' }}>
                          <span>Arbeidstimer: {entry.totalWorkHours}h</span>
                          {entry.totalBreakHours && <span>Pausetimer: {entry.totalBreakHours}h</span>}
                          {entry.overtime && <span style={{ color: 'var(--orange-600)' }}>Overtid: {entry.overtime}h</span>}
                          {entry.lateMinutes && <span style={{ color: 'var(--red-600)' }}>Forsinket: {entry.lateMinutes}min</span>}
                        </div>
                      )}
                    </div>
                    
                    <div style={{ display: 'flex', gap: '0.5rem', marginLeft: '1rem' }}>
                      <button
                        style={{ padding: '0.5rem', color: 'var(--gray-400)', background: 'none', border: 'none', cursor: 'pointer', borderRadius: 'var(--radius-md)' }}
                        title="Se detaljer"
                      >
                        <Eye style={{ width: '16px', height: '16px' }} />
                      </button>
                      <button
                        style={{ padding: '0.5rem', color: 'var(--gray-400)', background: 'none', border: 'none', cursor: 'pointer', borderRadius: 'var(--radius-md)' }}
                        title="Rediger"
                      >
                        <Edit style={{ width: '16px', height: '16px' }} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Manual Entry Modal */}
      {showManualEntryModal && (
        <div className="modal-overlay" onClick={() => setShowManualEntryModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Manuell Registrering</h2>
              <button className="modal-close" onClick={() => setShowManualEntryModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="modal-form-grid">
                <div className="form-field">
                  <label className="form-label">Ansatt</label>
                  <select
                    value={manualEntry.employeeId}
                    onChange={(e) => setManualEntry({ ...manualEntry, employeeId: e.target.value })}
                    className="form-select-modal"
                  >
                    <option value="">Velg ansatt</option>
                    {employees.map(emp => (
                      <option key={emp.id} value={emp.id}>{emp.displayName}</option>
                    ))}
                  </select>
                </div>
                <div className="form-field">
                  <label className="form-label">Dato</label>
                  <input
                    type="date"
                    value={manualEntry.date}
                    onChange={(e) => setManualEntry({ ...manualEntry, date: e.target.value })}
                    className="form-input-modal"
                  />
                </div>
                <div className="form-field">
                  <label className="form-label">Starttid</label>
                  <input
                    type="time"
                    value={manualEntry.startTime}
                    onChange={(e) => setManualEntry({ ...manualEntry, startTime: e.target.value })}
                    className="form-input-modal"
                  />
                </div>
                <div className="form-field">
                  <label className="form-label">Sluttid</label>
                  <input
                    type="time"
                    value={manualEntry.endTime}
                    onChange={(e) => setManualEntry({ ...manualEntry, endTime: e.target.value })}
                    className="form-input-modal"
                  />
                </div>
                <div className="form-field">
                  <label className="form-label">Arbeidstype</label>
                  <select
                    value={manualEntry.workType}
                    onChange={(e) => setManualEntry({ ...manualEntry, workType: e.target.value as StempelEntry['workType'] })}
                    className="form-select-modal"
                  >
                    <option value="normal">Normal arbeidstid</option>
                    <option value="overtime">Overtid</option>
                    <option value="vacation">Ferie</option>
                    <option value="sick">Sykdom</option>
                    <option value="absence">Fravær</option>
                    <option value="meeting">Møte</option>
                    <option value="travel">Reise</option>
                    <option value="training">Kurs/Trening</option>
                    <option value="other">Annet</option>
                  </select>
                </div>
                <div className="form-field" style={{ gridColumn: '1 / -1' }}>
                  <label className="form-label">Notater</label>
                  <textarea
                    value={manualEntry.notes}
                    onChange={(e) => setManualEntry({ ...manualEntry, notes: e.target.value })}
                    className="form-textarea-modal"
                    placeholder="Legg til notater om registreringen..."
                  />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button
                onClick={() => setShowManualEntryModal(false)}
                style={{ 
                  padding: '0.75rem 1.5rem', 
                  background: 'var(--gray-300)', 
                  color: 'var(--gray-700)', 
                  border: 'none', 
                  borderRadius: 'var(--radius-lg)', 
                  cursor: 'pointer' 
                }}
              >
                Avbryt
              </button>
              <button
                onClick={handleManualEntry}
                disabled={!manualEntry.employeeId}
                style={{ 
                  padding: '0.75rem 1.5rem', 
                  background: manualEntry.employeeId ? 'var(--blue-600)' : 'var(--gray-400)', 
                  color: 'var(--white)', 
                  border: 'none', 
                  borderRadius: 'var(--radius-lg)', 
                  cursor: manualEntry.employeeId ? 'pointer' : 'not-allowed' 
                }}
              >
                Registrer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Series Registration Modal */}
      {showSeriesModal && (
        <div className="modal-overlay" onClick={() => setShowSeriesModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Serieregistrering</h2>
              <button className="modal-close" onClick={() => setShowSeriesModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="modal-form-grid">
                <div className="form-field">
                  <label className="form-label">Ansatt</label>
                  <select
                    value={seriesEntry.employeeId}
                    onChange={(e) => setSeriesEntry({ ...seriesEntry, employeeId: e.target.value })}
                    className="form-select-modal"
                  >
                    <option value="">Velg ansatt</option>
                    {employees.map(emp => (
                      <option key={emp.id} value={emp.id}>{emp.displayName}</option>
                    ))}
                  </select>
                </div>
                <div className="form-field">
                  <label className="form-label">Startdato</label>
                  <input
                    type="date"
                    value={seriesEntry.startDate}
                    onChange={(e) => setSeriesEntry({ ...seriesEntry, startDate: e.target.value })}
                    className="form-input-modal"
                  />
                </div>
                <div className="form-field">
                  <label className="form-label">Sluttdato</label>
                  <input
                    type="date"
                    value={seriesEntry.endDate}
                    onChange={(e) => setSeriesEntry({ ...seriesEntry, endDate: e.target.value })}
                    className="form-input-modal"
                  />
                </div>
                <div className="form-field">
                  <label className="form-label">Starttid</label>
                  <input
                    type="time"
                    value={seriesEntry.startTime}
                    onChange={(e) => setSeriesEntry({ ...seriesEntry, startTime: e.target.value })}
                    className="form-input-modal"
                  />
                </div>
                <div className="form-field">
                  <label className="form-label">Sluttid</label>
                  <input
                    type="time"
                    value={seriesEntry.endTime}
                    onChange={(e) => setSeriesEntry({ ...seriesEntry, endTime: e.target.value })}
                    className="form-input-modal"
                  />
                </div>
                <div className="form-field">
                  <label className="form-label">Arbeidstype</label>
                  <select
                    value={seriesEntry.workType}
                    onChange={(e) => setSeriesEntry({ ...seriesEntry, workType: e.target.value as StempelEntry['workType'] })}
                    className="form-select-modal"
                  >
                    <option value="vacation">Ferie</option>
                    <option value="sick">Sykdom</option>
                    <option value="absence">Fravær</option>
                    <option value="training">Kurs/Trening</option>
                    <option value="travel">Reise</option>
                    <option value="normal">Normal arbeidstid</option>
                    <option value="overtime">Overtid</option>
                    <option value="meeting">Møte</option>
                    <option value="other">Annet</option>
                  </select>
                </div>
                <div className="form-field" style={{ gridColumn: '1 / -1' }}>
                  <label className="form-label">Notater</label>
                  <textarea
                    value={seriesEntry.notes}
                    onChange={(e) => setSeriesEntry({ ...seriesEntry, notes: e.target.value })}
                    className="form-textarea-modal"
                    placeholder="Legg til notater om serieregistreringen..."
                  />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button
                onClick={() => setShowSeriesModal(false)}
                style={{ 
                  padding: '0.75rem 1.5rem', 
                  background: 'var(--gray-300)', 
                  color: 'var(--gray-700)', 
                  border: 'none', 
                  borderRadius: 'var(--radius-lg)', 
                  cursor: 'pointer' 
                }}
              >
                Avbryt
              </button>
              <button
                onClick={handleSeriesRegistration}
                disabled={!seriesEntry.employeeId}
                style={{ 
                  padding: '0.75rem 1.5rem', 
                  background: seriesEntry.employeeId ? 'var(--green-600)' : 'var(--gray-400)', 
                  color: 'var(--white)', 
                  border: 'none', 
                  borderRadius: 'var(--radius-lg)', 
                  cursor: seriesEntry.employeeId ? 'pointer' : 'not-allowed' 
                }}
              >
                Registrer Serie
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 