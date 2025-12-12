'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { firebaseService, Vacation } from '@/lib/firebase-services';
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
  Info
} from 'lucide-react';

// Interface for employee data
interface Employee {
  id: string;
  name: string;
  email: string;
  position: string;
  department: string;
  imageUrl?: string;
}

// Interface for absence data with extended fields
interface Absence {
  id?: string;
  employeeId: string;
  employeeName?: string;
    startDate: string;
  endDate: string;
  type: 'sick' | 'personal' | 'sickChild' | 'other' | 'vacation';
  reason?: string;
  status: 'pending' | 'approved' | 'rejected';
  approvedBy?: string;
  approvedAt?: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
  requestedBy?: string;
  remainingDays?: {
    sickChild: number;
    sickSelf: number;
    personal: number;
  };
}

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

// Funksjon for å beregne antall dager mellom to datoer
const calculateDaysBetween = (startDate: string, endDate: string) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = Math.abs(end.getTime() - start.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
};

export default function AbsencePage() {
  const { userProfile } = useAuth();
  const [absences, setAbsences] = useState<Absence[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedEmployee, setSelectedEmployee] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showRulesModal, setShowRulesModal] = useState(false);
  const [selectedAbsence, setSelectedAbsence] = useState<Absence | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'employee'>('list');
  const [newAbsence, setNewAbsence] = useState({
    type: 'sick' as 'sick' | 'personal' | 'sickChild' | 'other',
    startDate: '',
    endDate: '',
    reason: '',
    notes: '',
    employeeId: ''
  });

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
  }, [userProfile?.companyId]);

  const loadData = useCallback(async () => {
    if (!userProfile) return;

    try {
      setLoading(true);
      
      // Hent fraværsdata
      const absenceData = await firebaseService.getVacations(userProfile.companyId);
      
      // Hent ansattdata
      const employeeData = await firebaseService.getEmployees(userProfile.companyId);
      // Map to local Employee interface
      const mappedEmployees: Employee[] = employeeData.map(emp => ({
        id: emp.id,
        name: emp.name || emp.displayName || '',
        email: emp.email || '',
        position: emp.position || '',
        department: emp.department || ''
      }));
      setEmployees(mappedEmployees);
      
      // Beregn gjenværende fraværsdager for hver ansatt
      const currentYear = new Date().getFullYear();
      const enhancedAbsences = absenceData.map(absence => {
        const employee = employeeData.find(emp => emp.id === absence.employeeId);
        
        // Tell opp brukte fraværsdager per type for denne ansatte i år
        const usedDays = {
          sickChild: 0,
          sickSelf: 0,
          personal: 0
        };
        
        absenceData.forEach(a => {
          if (a.employeeId === absence.employeeId && 
              a.status === 'approved' && 
              new Date(a.startDate).getFullYear() === currentYear) {
            
            const startDate = new Date(a.startDate);
            const endDate = new Date(a.endDate);
            const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
            
            const absenceType = a.type as string;
            if (absenceType === 'sick') usedDays.sickSelf += days;
            else if (absenceType === 'sickChild') usedDays.sickChild += days;
            else if (absenceType === 'personal') usedDays.personal += days;
          }
        });
        
        // Beregn gjenværende dager
        const remainingDays = {
          sickChild: ABSENCE_RULES.sickChild.daysPerYear - usedDays.sickChild,
          sickSelf: ABSENCE_RULES.sickSelf.extendedPeriodsPerYear - usedDays.sickSelf,
          personal: ABSENCE_RULES.personal.welfareLeave - usedDays.personal
        };
        
        return {
          ...absence,
          employeeName: employee ? employee.name : `Ansatt ${absence.employeeId.slice(0, 8)}`,
          reason: (absence as any).reason || (absence as any).notes || '',
          remainingDays
        };
      });
      
      setAbsences(enhancedAbsences);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  }, [userProfile?.companyId]);

  const handleAddAbsence = async () => {
    if (!userProfile) return;

    try {
      // Calculate days between dates
      const days = calculateDaysBetween(newAbsence.startDate, newAbsence.endDate);
      
      const absenceData: any = {
        ...newAbsence,
        employeeId: userProfile.id,
                status: 'pending' as const,
        requestedBy: userProfile.id,
        days: days,
        employeeName: userProfile.displayName || userProfile.email,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await firebaseService.createAbsence(absenceData);
      setShowAddModal(false);
      setNewAbsence({
        type: 'sick',
        startDate: '',
        endDate: '',
        reason: '',
        notes: '',
        employeeId: userProfile.id
      });
      loadData();
    } catch (error) {
      console.error('Error adding absence:', error);
    }
  };

  const handleUpdateAbsence = async (absenceId: string, status: 'approved' | 'rejected') => {
    try {
      await firebaseService.updateVacation(absenceId, { 
        status,
        approvedBy: userProfile?.id,
        updatedAt: new Date().toISOString()
      });
      loadData();
    } catch (error) {
      console.error('Error updating absence:', error);
    }
  };

  const handleDeleteAbsence = async (absenceId: string) => {
    if (!confirm('Er du sikker på at du vil slette denne fraværsmeldingen?')) return;

    try {
      await firebaseService.updateVacation(absenceId, { status: 'rejected' });
      loadData();
    } catch (error) {
      console.error('Error deleting absence:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'badge-warning';
      case 'approved': return 'badge-success';
      case 'rejected': return 'badge-danger';
      default: return 'badge-secondary';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'sick': return 'badge-danger';
      case 'personal': return 'badge-info';
      case 'other': return 'badge-secondary';
      default: return 'badge-secondary';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('nb-NO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const filteredAbsences = absences.filter(absence => {
    const matchesSearch = 
      (absence.notes?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
      (absence.employeeName?.toLowerCase().includes(searchTerm.toLowerCase()) || false);
    const matchesStatus = selectedStatus === 'all' || absence.status === selectedStatus;
    const matchesType = selectedType === 'all' || absence.type === selectedType;
    const matchesEmployee = selectedEmployee === 'all' || absence.employeeId === selectedEmployee;
    const matchesYear = new Date(absence.startDate).getFullYear() === selectedYear;
    
    return matchesSearch && matchesStatus && matchesType && matchesEmployee && matchesYear;
  });

  const getEmployeeName = (employeeId: string) => {
    return `Ansatt ${employeeId.slice(0, 8)}`;
  };

  const stats = {
    total: absences.length,
    pending: absences.filter(a => a.status === 'pending').length,
    approved: absences.filter(a => a.status === 'approved').length,
    rejected: absences.filter(a => a.status === 'rejected').length
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--gray-50)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ 
            width: '48px', 
            height: '48px', 
            border: '2px solid var(--blue-600)', 
            borderTop: '2px solid transparent', 
            borderRadius: '50%', 
            animation: 'spin 1s linear infinite',
            margin: '0 auto'
          }}></div>
          <p style={{ marginTop: '1rem', color: 'var(--gray-600)' }}>Laster fraværsmeldinger...</p>
        </div>
      
      {/* Modal for å legge til nytt fravær */}
      {showAddModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '0.5rem',
            width: isMobile ? '90%' : '500px',
            maxHeight: '90vh',
            overflowY: 'auto',
            padding: '1.5rem'
          }}>
            <h2 style={{ fontSize: 'var(--font-size-xl)', fontWeight: '600', marginBottom: '1.5rem' }}>
              Legg til nytt fravær
            </h2>
            
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                Ansatt
              </label>
              <select
                value={newAbsence.employeeId}
                onChange={(e) => setNewAbsence({...newAbsence, employeeId: e.target.value})}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: '0.375rem',
                  border: '1px solid var(--gray-300)',
                  backgroundColor: 'var(--white)'
                }}
              >
                <option value="">Velg ansatt</option>
                {userProfile?.role === 'admin' ? (
                  employees.map(employee => (
                    <option key={employee.id} value={employee.id}>{employee.name}</option>
                  ))
                ) : (
                  <option value={userProfile?.id}>{userProfile?.name}</option>
                )}
              </select>
            </div>
            
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                Type fravær
              </label>
              <select
                value={newAbsence.type}
                onChange={(e) => setNewAbsence({...newAbsence, type: e.target.value as any})}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: '0.375rem',
                  border: '1px solid var(--gray-300)',
                  backgroundColor: 'var(--white)'
                }}
              >
                <option value="sick">Sykdom (egen)</option>
                <option value="sickChild">Sykt barn</option>
                <option value="personal">Velferdspermisjon</option>
                <option value="other">Annet</option>
              </select>
            </div>
            
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                  Fra dato
                </label>
                <input
                  type="date"
                  value={newAbsence.startDate}
                  onChange={(e) => setNewAbsence({...newAbsence, startDate: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    borderRadius: '0.375rem',
                    border: '1px solid var(--gray-300)',
                    backgroundColor: 'var(--white)'
                  }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                  Til dato
                </label>
                <input
                  type="date"
                  value={newAbsence.endDate}
                  onChange={(e) => setNewAbsence({...newAbsence, endDate: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    borderRadius: '0.375rem',
                    border: '1px solid var(--gray-300)',
                    backgroundColor: 'var(--white)'
                  }}
                />
              </div>
            </div>
            
            {newAbsence.startDate && newAbsence.endDate && (
              <div style={{ 
                marginBottom: '1rem', 
                padding: '0.75rem', 
                backgroundColor: 'var(--blue-50)', 
                borderRadius: '0.375rem',
                color: 'var(--blue-700)'
              }}>
                <p>Antall dager: {calculateDaysBetween(newAbsence.startDate, newAbsence.endDate)}</p>
              </div>
            )}
            
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                Notat
              </label>
              <textarea
                value={newAbsence.notes}
                onChange={(e) => setNewAbsence({...newAbsence, notes: e.target.value})}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: '0.375rem',
                  border: '1px solid var(--gray-300)',
                  backgroundColor: 'var(--white)',
                  minHeight: '100px',
                  resize: 'vertical'
                }}
                placeholder="Skriv en kort beskrivelse av fraværet..."
              />
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem' }}>
              <button
                onClick={() => setShowAddModal(false)}
                style={{
                  padding: '0.75rem 1rem',
                  borderRadius: '0.375rem',
                  border: '1px solid var(--gray-300)',
                  backgroundColor: 'var(--white)',
                  color: 'var(--gray-700)',
                  fontWeight: '500',
                  cursor: 'pointer'
                }}
              >
                Avbryt
              </button>
              <button
                onClick={handleAddAbsence}
                disabled={!newAbsence.employeeId || !newAbsence.startDate || !newAbsence.endDate}
                style={{
                  padding: '0.75rem 1.5rem',
                  borderRadius: '0.375rem',
                  border: 'none',
                  backgroundColor: !newAbsence.employeeId || !newAbsence.startDate || !newAbsence.endDate ? 'var(--gray-300)' : 'var(--blue-600)',
                  color: 'var(--white)',
                  fontWeight: '500',
                  cursor: !newAbsence.employeeId || !newAbsence.startDate || !newAbsence.endDate ? 'not-allowed' : 'pointer'
                }}
              >
                Legg til fravær
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Modal for å vise fraværsregler */}
      {showRulesModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '0.5rem',
            width: isMobile ? '90%' : '600px',
            maxHeight: '90vh',
            overflowY: 'auto',
            padding: '1.5rem'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h2 style={{ fontSize: 'var(--font-size-xl)', fontWeight: '600' }}>
                Fraværsregler fra Lovdata
              </h2>
              <button
                onClick={() => setShowRulesModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--gray-500)',
                  fontSize: '1.5rem'
                }}
              >
                ×
              </button>
            </div>
            
            <div style={{ marginBottom: '2rem' }}>
              <h3 style={{ fontSize: 'var(--font-size-lg)', fontWeight: '600', color: 'var(--orange-600)', marginBottom: '0.75rem' }}>
                Sykt barn
              </h3>
              <ul style={{ listStyleType: 'disc', paddingLeft: '1.5rem', color: 'var(--gray-700)' }}>
                <li style={{ marginBottom: '0.5rem' }}>Rett til fri ved barns sykdom: {ABSENCE_RULES.sickChild.daysPerYear} dager per år for barn under {ABSENCE_RULES.sickChild.ageLimit} år</li>
                <li style={{ marginBottom: '0.5rem' }}>Ved flere barn: {ABSENCE_RULES.sickChild.daysPerYearMultipleChildren} dager per år</li>
                <li style={{ marginBottom: '0.5rem' }}>Ved kronisk syke barn: {ABSENCE_RULES.sickChild.daysPerYearChronicIllness} dager per år (gjelder barn opp til {ABSENCE_RULES.sickChild.extendedAgeLimit} år)</li>
                <li style={{ marginBottom: '0.5rem' }}>{ABSENCE_RULES.sickChild.documentation}</li>
                <li style={{ marginBottom: '0.5rem', fontStyle: 'italic' }}>Lovhjemmel: Arbeidsmiljøloven § 12-9</li>
              </ul>
            </div>
            
            <div style={{ marginBottom: '2rem' }}>
              <h3 style={{ fontSize: 'var(--font-size-lg)', fontWeight: '600', color: 'var(--red-600)', marginBottom: '0.75rem' }}>
                Egen sykdom
              </h3>
              <ul style={{ listStyleType: 'disc', paddingLeft: '1.5rem', color: 'var(--gray-700)' }}>
                <li style={{ marginBottom: '0.5rem' }}>Egenmelding: {ABSENCE_RULES.sickSelf.selfCertificationDays} dager per fraværstilfelle</li>
                <li style={{ marginBottom: '0.5rem' }}>Antall egenmeldingsperioder: {ABSENCE_RULES.sickSelf.selfCertificationPeriodsPerYear} per år</li>
                <li style={{ marginBottom: '0.5rem' }}>IA-bedrifter: {ABSENCE_RULES.sickSelf.extendedSelfCertification} dager per fraværstilfelle, maks {ABSENCE_RULES.sickSelf.extendedPeriodsPerYear} dager per år</li>
                <li style={{ marginBottom: '0.5rem' }}>{ABSENCE_RULES.sickSelf.documentation}</li>
                <li style={{ marginBottom: '0.5rem', fontStyle: 'italic' }}>Lovhjemmel: Folketrygdloven § 8-24</li>
              </ul>
            </div>
            
            <div>
              <h3 style={{ fontSize: 'var(--font-size-lg)', fontWeight: '600', color: 'var(--blue-600)', marginBottom: '0.75rem' }}>
                Velferdspermisjon
              </h3>
              <ul style={{ listStyleType: 'disc', paddingLeft: '1.5rem', color: 'var(--gray-700)' }}>
                <li style={{ marginBottom: '0.5rem' }}>Velferdspermisjon: Inntil {ABSENCE_RULES.personal.welfareLeave} dager per år (avhengig av tariffavtale)</li>
                <li style={{ marginBottom: '0.5rem' }}>Gjelder ved viktige personlige hendelser som ikke kan planlegges utenfor arbeidstid</li>
                <li style={{ marginBottom: '0.5rem' }}>Eksempler: Dødsfall i nær familie, alvorlig sykdom i familien, flytting, giftemål</li>
                <li style={{ marginBottom: '0.5rem' }}>{ABSENCE_RULES.personal.documentation}</li>
                <li style={{ marginBottom: '0.5rem', fontStyle: 'italic' }}>Lovhjemmel: Reguleres av tariffavtaler og interne retningslinjer</li>
              </ul>
            </div>
            
            <div style={{ marginTop: '2rem', padding: '1rem', backgroundColor: 'var(--gray-50)', borderRadius: '0.5rem' }}>
              <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--gray-600)' }}>
                <strong>Merk:</strong> Disse reglene er generelle retningslinjer. Spesifikke rettigheter kan variere basert på tariffavtaler, 
                bedriftens interne retningslinjer og individuelle arbeidsavtaler. Ved tvil, konsulter HR-avdelingen eller 
                <a href="https://lovdata.no" target="_blank" style={{ color: 'var(--blue-600)', textDecoration: 'underline' }}> Lovdata</a>.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

  
  // Funksjon for å vise gjenværende dager for en ansatt
  const getEmployeeRemainingDays = (employeeId: string) => {
    // Finn alle godkjente fravær for denne ansatte i inneværende år
    const employeeAbsences = absences.filter(a => 
      a.employeeId === employeeId && 
      a.status === 'approved' && 
      new Date(a.startDate).getFullYear() === selectedYear
    );
    
    // Tell opp brukte dager per type
    const usedDays = {
      sickChild: 0,
      sickSelf: 0,
      personal: 0
    };
    
    employeeAbsences.forEach(a => {
      const startDate = new Date(a.startDate);
      const endDate = new Date(a.endDate);
      const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      
      if (a.type === 'sick') usedDays.sickSelf += days;
      else if (a.type === 'sickChild') usedDays.sickChild += days;
      else if (a.type === 'personal') usedDays.personal += days;
    });
    
    // Beregn gjenværende dager
    return {
      sickChild: ABSENCE_RULES.sickChild.daysPerYear - usedDays.sickChild,
      sickSelf: ABSENCE_RULES.sickSelf.extendedPeriodsPerYear - usedDays.sickSelf,
      personal: ABSENCE_RULES.personal.welfareLeave - usedDays.personal
    };
  };

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
          <h1 style={{
            fontSize: '1.125rem',
            fontWeight: 600,
            color: 'var(--text-color)',
            margin: 0,
            lineHeight: '1.3'
          }}>
            Fraværsmeldinger
          </h1>
        </div>
      )}

      {/* Desktop Header */}
      {!isMobile && (
      <div style={{ background: 'var(--card-background)', boxShadow: 'var(--shadow-sm)', borderBottom: '1px solid var(--border-color)', padding: '1.5rem 2rem' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1 style={{ fontSize: 'var(--font-size-2xl)', fontWeight: '700', color: 'var(--text-color)' }}>Fraværsmeldinger</h1>
            <p style={{ color: 'var(--gray-500)', marginTop: '0.25rem' }}>Administrer fraværsmeldinger i bedriften</p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="btn btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <Plus style={{ width: '16px', height: '16px' }} />
            Ny fraværsmelding
          </button>
        </div>
      </div>
      )}

      {/* Mobile Action Buttons */}
      {isMobile && (
        <div style={{
          padding: '0 0.75rem 0.75rem',
          display: 'flex',
          gap: '0.5rem'
        }}>
          <button
            onClick={() => setShowRulesModal(true)}
            className="btn btn-secondary"
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              minHeight: '44px'
            }}
          >
            <Info size={18} />
            Regler
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="btn btn-primary"
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              minHeight: '44px'
            }}
          >
            <Plus size={18} />
            Nytt fravær
          </button>
        </div>
      )}
      
      {/* Lovdata-regelmodal */}
      {showRulesModal && (
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
          zIndex: 1000
        }}>
          <div style={{
            background: 'var(--white)',
            borderRadius: '0.5rem',
            boxShadow: 'var(--shadow-lg)',
            width: '90%',
            maxWidth: '800px',
            maxHeight: '90vh',
            overflow: 'auto',
            padding: '1.5rem'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h2 style={{ fontSize: 'var(--font-size-xl)', fontWeight: '700', color: 'var(--gray-900)' }}>
                Fraværsregler fra Lovdata
              </h2>
              <button 
                onClick={() => setShowRulesModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--gray-500)' }}
              >
                ✕
              </button>
            </div>
            
            <div style={{ marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: 'var(--font-size-lg)', fontWeight: '600', color: 'var(--gray-900)', marginBottom: '0.75rem' }}>
                Sykt barn
              </h3>
              <ul style={{ listStyleType: 'disc', paddingLeft: '1.5rem', color: 'var(--gray-700)' }}>
                <li>Rett til 10 dager per år for barn under 12 år</li>
                <li>Rett til 15 dager per år hvis du har flere barn</li>
                <li>Rett til 20 dager per år hvis barnet har kronisk sykdom eller funksjonshemming</li>
                <li>Aldersgrense er 12 år, men utvidet til 18 år ved kronisk sykdom eller funksjonshemming</li>
                <li>Legeerklæring kreves fra fjerde fraværsdag</li>
                <li><strong>Lovhjemmel:</strong> Arbeidsmiljøloven § 12-9</li>
              </ul>
            </div>
            
            <div style={{ marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: 'var(--font-size-lg)', fontWeight: '600', color: 'var(--gray-900)', marginBottom: '0.75rem' }}>
                Egen sykdom
              </h3>
              <ul style={{ listStyleType: 'disc', paddingLeft: '1.5rem', color: 'var(--gray-700)' }}>
                <li>Rett til egenmelding i opptil 3 dager per fraværstilfelle</li>
                <li>Maksimalt 4 egenmeldingsperioder per år</li>
                <li>IA-bedrifter: Utvidet egenmelding i opptil 8 dager per periode</li>
                <li>IA-bedrifter: Maksimalt 24 egenmeldingsdager per år</li>
                <li>Legeerklæring kreves fra fjerde fraværsdag</li>
                <li><strong>Lovhjemmel:</strong> Folketrygdloven § 8-24 og § 8-27</li>
              </ul>
            </div>
            
            <div>
              <h3 style={{ fontSize: 'var(--font-size-lg)', fontWeight: '600', color: 'var(--gray-900)', marginBottom: '0.75rem' }}>
                Velferdspermisjon
              </h3>
              <ul style={{ listStyleType: 'disc', paddingLeft: '1.5rem', color: 'var(--gray-700)' }}>
                <li>Typisk inntil 12 dager per år, men avhenger av tariffavtale eller bedriftens interne regler</li>
                <li>Gjelder for viktige personlige hendelser som ikke kan planlegges utenfor arbeidstid</li>
                <li>Eksempler: Dødsfall i nær familie, alvorlig sykdom i familien, flytting, giftemål</li>
                <li>Dokumentasjon kan kreves av arbeidsgiver</li>
                <li><strong>Lovhjemmel:</strong> Reguleres primært av tariffavtaler og interne retningslinjer</li>
              </ul>
            </div>
        </div>

        {/* Hovedinnhold - Ansattoversikt eller Fraværsliste */}
        {viewMode === 'employee' ? (
          <div style={{ background: 'var(--white)', borderRadius: '0.5rem', boxShadow: 'var(--shadow-sm)', marginTop: '1.5rem' }}>
            <div style={{ padding: '1rem', borderBottom: '1px solid var(--gray-200)' }}>
              <h2 style={{ fontSize: 'var(--font-size-lg)', fontWeight: '600', color: 'var(--gray-900)' }}>
                Ansattoversikt - Fravær {selectedYear}
              </h2>
            </div>
            
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'var(--gray-50)' }}>
                    <th style={{ padding: '0.75rem 1rem', textAlign: 'left', color: 'var(--gray-700)', fontWeight: '500', borderBottom: '1px solid var(--gray-200)' }}>Ansatt</th>
                    <th style={{ padding: '0.75rem 1rem', textAlign: 'center', color: 'var(--gray-700)', fontWeight: '500', borderBottom: '1px solid var(--gray-200)' }}>Sykt barn dager igjen</th>
                    <th style={{ padding: '0.75rem 1rem', textAlign: 'center', color: 'var(--gray-700)', fontWeight: '500', borderBottom: '1px solid var(--gray-200)' }}>Egenmeldingsdager igjen</th>
                    <th style={{ padding: '0.75rem 1rem', textAlign: 'center', color: 'var(--gray-700)', fontWeight: '500', borderBottom: '1px solid var(--gray-200)' }}>Velferdsdager igjen</th>
                    <th style={{ padding: '0.75rem 1rem', textAlign: 'center', color: 'var(--gray-700)', fontWeight: '500', borderBottom: '1px solid var(--gray-200)' }}>Totalt fravær i år</th>
                    <th style={{ padding: '0.75rem 1rem', textAlign: 'center', color: 'var(--gray-700)', fontWeight: '500', borderBottom: '1px solid var(--gray-200)' }}>Handlinger</th>
                  </tr>
                </thead>
                <tbody>
                  {employees.map(employee => {
                    const remainingDays = getEmployeeRemainingDays(employee.id);
                    const employeeAbsences = absences.filter(a => 
                      a.employeeId === employee.id && 
                      new Date(a.startDate).getFullYear() === selectedYear
                    );
                    
                    const totalAbsenceDays = employeeAbsences.reduce((total, absence) => {
                      const startDate = new Date(absence.startDate);
                      const endDate = new Date(absence.endDate);
                      const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
                      return total + days;
                    }, 0);
                    
                    return (
                      <tr key={employee.id} style={{ borderBottom: '1px solid var(--gray-200)' }}>
                        <td style={{ padding: '1rem', color: 'var(--gray-900)' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <div style={{ 
                              width: '40px', 
                              height: '40px', 
                              borderRadius: '50%', 
                              background: 'var(--gray-100)', 
                              display: 'flex', 
                              alignItems: 'center', 
                              justifyContent: 'center',
                              color: 'var(--gray-600)'
                            }}>
                              <User size={20} />
                            </div>
                            <div>
                              <p style={{ fontWeight: '500' }}>{employee.name}</p>
                              <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--gray-500)' }}>{employee.position || 'Stilling ikke angitt'}</p>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '1rem', textAlign: 'center', color: remainingDays.sickChild > 3 ? 'var(--green-600)' : remainingDays.sickChild > 0 ? 'var(--yellow-600)' : 'var(--red-600)', fontWeight: '500' }}>
                          {remainingDays.sickChild} dager
                        </td>
                        <td style={{ padding: '1rem', textAlign: 'center', color: remainingDays.sickSelf > 5 ? 'var(--green-600)' : remainingDays.sickSelf > 0 ? 'var(--yellow-600)' : 'var(--red-600)', fontWeight: '500' }}>
                          {remainingDays.sickSelf} dager
                        </td>
                        <td style={{ padding: '1rem', textAlign: 'center', color: remainingDays.personal > 3 ? 'var(--green-600)' : remainingDays.personal > 0 ? 'var(--yellow-600)' : 'var(--red-600)', fontWeight: '500' }}>
                          {remainingDays.personal} dager
                        </td>
                        <td style={{ padding: '1rem', textAlign: 'center', color: 'var(--gray-900)', fontWeight: '500' }}>
                          {totalAbsenceDays} dager
                        </td>
                        <td style={{ padding: '1rem', textAlign: 'center' }}>
                          <button
                            onClick={() => {
                              setSelectedEmployee(employee.id);
                              setViewMode('list');
                            }}
                            style={{ 
                              background: 'var(--blue-50)', 
                              color: 'var(--blue-600)', 
                              border: 'none', 
                              borderRadius: '0.375rem', 
                              padding: '0.5rem 0.75rem',
                              fontWeight: '500',
                              cursor: 'pointer'
                            }}
                          >
                            Vis fravær
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div style={{ background: 'var(--white)', borderRadius: '0.5rem', boxShadow: 'var(--shadow-sm)', marginTop: '1.5rem' }}>
            <div style={{ padding: '1rem', borderBottom: '1px solid var(--gray-200)' }}>
              <h2 style={{ fontSize: 'var(--font-size-lg)', fontWeight: '600', color: 'var(--gray-900)' }}>
                Fraværsliste {selectedYear}
              </h2>
            </div>
            
            {filteredAbsences.length === 0 ? (
              <div style={{ padding: '3rem 1rem', textAlign: 'center', color: 'var(--gray-500)' }}>
                <AlertCircle style={{ width: '48px', height: '48px', margin: '0 auto', marginBottom: '1rem', color: 'var(--gray-400)' }} />
                <p>Ingen fraværsmeldinger funnet med de valgte filtrene.</p>
                <p style={{ marginTop: '0.5rem', fontSize: 'var(--font-size-sm)' }}>Prøv å justere filtrene eller legg til nye fraværsmeldinger.</p>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: 'var(--gray-50)' }}>
                      <th style={{ padding: '0.75rem 1rem', textAlign: 'left', color: 'var(--gray-700)', fontWeight: '500', borderBottom: '1px solid var(--gray-200)' }}>Ansatt</th>
                      <th style={{ padding: '0.75rem 1rem', textAlign: 'left', color: 'var(--gray-700)', fontWeight: '500', borderBottom: '1px solid var(--gray-200)' }}>Type</th>
                      <th style={{ padding: '0.75rem 1rem', textAlign: 'left', color: 'var(--gray-700)', fontWeight: '500', borderBottom: '1px solid var(--gray-200)' }}>Fra dato</th>
                      <th style={{ padding: '0.75rem 1rem', textAlign: 'left', color: 'var(--gray-700)', fontWeight: '500', borderBottom: '1px solid var(--gray-200)' }}>Til dato</th>
                      <th style={{ padding: '0.75rem 1rem', textAlign: 'left', color: 'var(--gray-700)', fontWeight: '500', borderBottom: '1px solid var(--gray-200)' }}>Status</th>
                      <th style={{ padding: '0.75rem 1rem', textAlign: 'center', color: 'var(--gray-700)', fontWeight: '500', borderBottom: '1px solid var(--gray-200)' }}>Handlinger</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAbsences.map(absence => {
                      const typeLabel = 
                        absence.type === 'sick' ? 'Sykdom (egen)' : 
                        absence.type === 'sickChild' ? 'Sykt barn' : 
                        absence.type === 'personal' ? 'Personlig' : 'Annet';
                      
                      const typeColor = 
                        absence.type === 'sick' ? 'var(--red-100)' : 
                        absence.type === 'sickChild' ? 'var(--orange-100)' : 
                        absence.type === 'personal' ? 'var(--blue-100)' : 'var(--gray-100)';
                      
                      const typeTextColor = 
                        absence.type === 'sick' ? 'var(--red-700)' : 
                        absence.type === 'sickChild' ? 'var(--orange-700)' : 
                        absence.type === 'personal' ? 'var(--blue-700)' : 'var(--gray-700)';
                      
                      const statusColor = 
                        absence.status === 'pending' ? 'var(--yellow-100)' : 
                        absence.status === 'approved' ? 'var(--green-100)' : 'var(--red-100)';
                      
                      const statusTextColor = 
                        absence.status === 'pending' ? 'var(--yellow-700)' : 
                        absence.status === 'approved' ? 'var(--green-700)' : 'var(--red-700)';
                      
                      const statusLabel = 
                        absence.status === 'pending' ? 'Venter' : 
                        absence.status === 'approved' ? 'Godkjent' : 'Avvist';
                      
                      return (
                        <tr key={absence.id} style={{ borderBottom: '1px solid var(--gray-200)' }}>
                          <td style={{ padding: '1rem', color: 'var(--gray-900)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                              <div style={{ 
                                width: '32px', 
                                height: '32px', 
                                borderRadius: '50%', 
                                background: 'var(--gray-100)', 
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyContent: 'center',
                                color: 'var(--gray-600)'
                              }}>
                                <User size={16} />
                              </div>
                              <span>{absence.employeeName}</span>
                            </div>
                          </td>
                          <td style={{ padding: '1rem' }}>
                            <span style={{ 
                              display: 'inline-block', 
                              padding: '0.25rem 0.5rem', 
                              borderRadius: '0.25rem', 
                              background: typeColor, 
                              color: typeTextColor,
                              fontSize: 'var(--font-size-sm)',
                              fontWeight: '500'
                            }}>
                              {typeLabel}
                            </span>
                          </td>
                          <td style={{ padding: '1rem', color: 'var(--gray-900)' }}>{formatDate(absence.startDate)}</td>
                          <td style={{ padding: '1rem', color: 'var(--gray-900)' }}>{formatDate(absence.endDate)}</td>
                          <td style={{ padding: '1rem' }}>
                            <span style={{ 
                              display: 'inline-block', 
                              padding: '0.25rem 0.5rem', 
                              borderRadius: '0.25rem', 
                              background: statusColor, 
                              color: statusTextColor,
                              fontSize: 'var(--font-size-sm)',
                              fontWeight: '500'
                            }}>
                              {statusLabel}
                            </span>
                          </td>
                          <td style={{ padding: '1rem', textAlign: 'center' }}>
                            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                              {absence.status === 'pending' && userProfile?.role === 'admin' && (
                                <>
                                  <button
                                    onClick={() => absence.id && handleUpdateAbsence(absence.id, 'approved')}
                                    style={{ 
                                      background: 'var(--green-50)', 
                                      color: 'var(--green-600)', 
                                      border: 'none', 
                                      borderRadius: '0.375rem', 
                                      padding: '0.5rem',
                                      cursor: 'pointer'
                                    }}
                                    title="Godkjenn"
                                  >
                                    <CheckCircle size={16} />
                                  </button>
                                  <button
                                    onClick={() => absence.id && handleUpdateAbsence(absence.id, 'rejected')}
                                    style={{ 
                                      background: 'var(--red-50)', 
                                      color: 'var(--red-600)', 
                                      border: 'none', 
                                      borderRadius: '0.375rem', 
                                      padding: '0.5rem',
                                      cursor: 'pointer'
                                    }}
                                    title="Avvis"
                                  >
                                    <AlertTriangle size={16} />
                                  </button>
                                </>
                              )}
                              <button
                                onClick={() => setSelectedAbsence(absence)}
                                style={{ 
                                  background: 'var(--blue-50)', 
                                  color: 'var(--blue-600)', 
                                  border: 'none', 
                                  borderRadius: '0.375rem', 
                                  padding: '0.5rem',
                                  cursor: 'pointer'
                                }}
                                title="Vis detaljer"
                              >
                                <Info size={16} />
                              </button>
                              {(userProfile?.id === absence.employeeId || userProfile?.role === 'admin') && (
                                  <button
                                    onClick={() => absence.id && handleDeleteAbsence(absence.id)}
                                  style={{ 
                                    background: 'var(--gray-50)', 
                                    color: 'var(--gray-600)', 
                                    border: 'none', 
                                    borderRadius: '0.375rem', 
                                    padding: '0.5rem',
                                    cursor: 'pointer'
                                  }}
                                  title="Slett"
                                >
                                  <Trash2 size={16} />
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
            )}
          </div>
        )}
      </div>
      )}

      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '2rem 1rem' }}>
        {/* Stats og Lovdata-knapp */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <div style={{ background: 'var(--white)', borderRadius: '0.5rem', padding: '1rem', boxShadow: 'var(--shadow-sm)', minWidth: '150px' }}>
              <p style={{ color: 'var(--gray-500)', fontSize: 'var(--font-size-sm)' }}>Totalt</p>
              <p style={{ fontSize: 'var(--font-size-xl)', fontWeight: '700', color: 'var(--gray-900)' }}>{stats.total}</p>
            </div>
            <div style={{ background: 'var(--white)', borderRadius: '0.5rem', padding: '1rem', boxShadow: 'var(--shadow-sm)', minWidth: '150px' }}>
              <p style={{ color: 'var(--gray-500)', fontSize: 'var(--font-size-sm)' }}>Venter</p>
              <p style={{ fontSize: 'var(--font-size-xl)', fontWeight: '700', color: 'var(--yellow-600)' }}>{stats.pending}</p>
            </div>
            <div style={{ background: 'var(--white)', borderRadius: '0.5rem', padding: '1rem', boxShadow: 'var(--shadow-sm)', minWidth: '150px' }}>
              <p style={{ color: 'var(--gray-500)', fontSize: 'var(--font-size-sm)' }}>Godkjent</p>
              <p style={{ fontSize: 'var(--font-size-xl)', fontWeight: '700', color: 'var(--green-600)' }}>{stats.approved}</p>
            </div>
          </div>
          <button 
            onClick={() => setShowRulesModal(true)}
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.5rem', 
              background: 'var(--white)', 
              border: '1px solid var(--gray-200)', 
              borderRadius: '0.375rem', 
              padding: '0.5rem 1rem',
              color: 'var(--gray-700)',
              fontWeight: '500'
            }}
          >
            <FileText size={16} />
            Lovdata regler
          </button>
        </div>

        {/* Filtrering og søk */}
        <div style={{ 
          background: 'var(--white)', 
          borderRadius: '0.5rem', 
          padding: '1rem', 
          boxShadow: 'var(--shadow-sm)', 
          marginBottom: '1.5rem',
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          gap: '1rem',
          alignItems: isMobile ? 'stretch' : 'center',
          flexWrap: isMobile ? 'nowrap' : 'wrap'
        }}>
          {/* Søkefelt */}
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.5rem', 
            background: 'var(--gray-50)', 
            borderRadius: '0.375rem', 
            padding: '0.5rem 0.75rem',
            flex: isMobile ? '1' : '0 0 250px'
          }}>
            <Search size={16} style={{ color: 'var(--gray-400)' }} />
            <input 
              type="text" 
              placeholder="Søk etter ansatt eller notat..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ 
                background: 'transparent', 
                border: 'none', 
                outline: 'none', 
                width: '100%',
                color: 'var(--gray-900)'
              }}
            />
          </div>

          {/* Ansattfilter */}
          <div style={{ position: 'relative', flex: isMobile ? '1' : '0 0 200px' }}>
            <select
              value={selectedEmployee}
              onChange={(e) => setSelectedEmployee(e.target.value)}
              style={{ 
                appearance: 'none',
                width: '100%',
                padding: '0.5rem 0.75rem',
                paddingRight: '2rem',
                borderRadius: '0.375rem',
                border: '1px solid var(--gray-200)',
                background: 'var(--white)',
                color: 'var(--gray-900)',
                fontWeight: '500',
                cursor: 'pointer'
              }}
            >
              <option value="all">Alle ansatte</option>
              {employees.map(employee => (
                <option key={employee.id} value={employee.id}>{employee.name}</option>
              ))}
            </select>
            <ChevronDown size={16} style={{ 
              position: 'absolute', 
              right: '0.75rem', 
              top: '50%', 
              transform: 'translateY(-50%)', 
              color: 'var(--gray-400)',
              pointerEvents: 'none'
            }} />
          </div>

          {/* Årsfilter */}
          <div style={{ position: 'relative', flex: isMobile ? '1' : '0 0 150px' }}>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              style={{ 
                appearance: 'none',
                width: '100%',
                padding: '0.5rem 0.75rem',
                paddingRight: '2rem',
                borderRadius: '0.375rem',
                border: '1px solid var(--gray-200)',
                background: 'var(--white)',
                color: 'var(--gray-900)',
                fontWeight: '500',
                cursor: 'pointer'
              }}
            >
              <option value={new Date().getFullYear()}>{new Date().getFullYear()} (i år)</option>
              <option value={new Date().getFullYear() - 1}>{new Date().getFullYear() - 1} (i fjor)</option>
            </select>
            <ChevronDown size={16} style={{ 
              position: 'absolute', 
              right: '0.75rem', 
              top: '50%', 
              transform: 'translateY(-50%)', 
              color: 'var(--gray-400)',
              pointerEvents: 'none'
            }} />
          </div>

          {/* Statusfilter */}
          <div style={{ position: 'relative', flex: isMobile ? '1' : '0 0 150px' }}>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              style={{ 
                appearance: 'none',
                width: '100%',
                padding: '0.5rem 0.75rem',
                paddingRight: '2rem',
                borderRadius: '0.375rem',
                border: '1px solid var(--gray-200)',
                background: 'var(--white)',
                color: 'var(--gray-900)',
                fontWeight: '500',
                cursor: 'pointer'
              }}
            >
              <option value="all">Alle statuser</option>
              <option value="pending">Venter</option>
              <option value="approved">Godkjent</option>
              <option value="rejected">Avvist</option>
            </select>
            <ChevronDown size={16} style={{ 
              position: 'absolute', 
              right: '0.75rem', 
              top: '50%', 
              transform: 'translateY(-50%)', 
              color: 'var(--gray-400)',
              pointerEvents: 'none'
            }} />
          </div>

          {/* Typefilter */}
          <div style={{ position: 'relative', flex: isMobile ? '1' : '0 0 150px' }}>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              style={{ 
                appearance: 'none',
                width: '100%',
                padding: '0.5rem 0.75rem',
                paddingRight: '2rem',
                borderRadius: '0.375rem',
                border: '1px solid var(--gray-200)',
                background: 'var(--white)',
                color: 'var(--gray-900)',
                fontWeight: '500',
                cursor: 'pointer'
              }}
            >
              <option value="all">Alle typer</option>
              <option value="sick">Sykdom (egen)</option>
              <option value="sickChild">Sykt barn</option>
              <option value="personal">Personlig</option>
              <option value="other">Annet</option>
            </select>
            <ChevronDown size={16} style={{ 
              position: 'absolute', 
              right: '0.75rem', 
              top: '50%', 
              transform: 'translateY(-50%)', 
              color: 'var(--gray-400)',
              pointerEvents: 'none'
            }} />
          </div>

          {/* Visningsmodus */}
          <div style={{ 
            display: 'flex', 
            borderRadius: '0.375rem', 
            border: '1px solid var(--gray-200)', 
            overflow: 'hidden',
            marginLeft: isMobile ? '0' : 'auto'
          }}>
            <button
              onClick={() => setViewMode('list')}
              style={{ 
                padding: '0.5rem 0.75rem', 
                background: viewMode === 'list' ? 'var(--blue-50)' : 'var(--white)', 
                borderRight: '1px solid var(--gray-200)',
                color: viewMode === 'list' ? 'var(--blue-600)' : 'var(--gray-700)'
              }}
            >
              <Calendar size={16} />
            </button>
            <button
              onClick={() => setViewMode('employee')}
              style={{ 
                padding: '0.5rem 0.75rem', 
                background: viewMode === 'employee' ? 'var(--blue-50)' : 'var(--white)', 
                color: viewMode === 'employee' ? 'var(--blue-600)' : 'var(--gray-700)'
              }}
            >
              <Users size={16} />
            </button>
          </div>
        </div>
        {/* Stats Overview */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <div style={{ padding: '0.75rem', background: 'var(--blue-100)', borderRadius: 'var(--radius-lg)' }}>
                <AlertTriangle style={{ width: '24px', height: '24px', color: 'var(--blue-600)' }} />
              </div>
              <div style={{ marginLeft: '1rem' }}>
                <p style={{ fontSize: 'var(--font-size-sm)', fontWeight: '500', color: 'var(--gray-600)' }}>Totalt</p>
                <p style={{ fontSize: 'var(--font-size-2xl)', fontWeight: '600', color: 'var(--gray-900)' }}>{stats.total}</p>
              </div>
            </div>
          </div>
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <div style={{ padding: '0.75rem', background: 'var(--yellow-100)', borderRadius: 'var(--radius-lg)' }}>
                <Clock style={{ width: '24px', height: '24px', color: 'var(--yellow-600)' }} />
              </div>
              <div style={{ marginLeft: '1rem' }}>
                <p style={{ fontSize: 'var(--font-size-sm)', fontWeight: '500', color: 'var(--gray-600)' }}>Venter</p>
                <p style={{ fontSize: 'var(--font-size-2xl)', fontWeight: '600', color: 'var(--gray-900)' }}>{stats.pending}</p>
              </div>
            </div>
          </div>
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <div style={{ padding: '0.75rem', background: 'var(--green-100)', borderRadius: 'var(--radius-lg)' }}>
                <CheckCircle style={{ width: '24px', height: '24px', color: 'var(--green-600)' }} />
              </div>
              <div style={{ marginLeft: '1rem' }}>
                <p style={{ fontSize: 'var(--font-size-sm)', fontWeight: '500', color: 'var(--gray-600)' }}>Godkjent</p>
                <p style={{ fontSize: 'var(--font-size-2xl)', fontWeight: '600', color: 'var(--gray-900)' }}>{stats.approved}</p>
              </div>
            </div>
          </div>
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <div style={{ padding: '0.75rem', background: 'var(--red-100)', borderRadius: 'var(--radius-lg)' }}>
                <AlertCircle style={{ width: '24px', height: '24px', color: 'var(--red-600)' }} />
              </div>
              <div style={{ marginLeft: '1rem' }}>
                <p style={{ fontSize: 'var(--font-size-sm)', fontWeight: '500', color: 'var(--gray-600)' }}>Avvist</p>
                <p style={{ fontSize: 'var(--font-size-2xl)', fontWeight: '600', color: 'var(--gray-900)' }}>{stats.rejected}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="card" style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: '1rem' }}>
            <div style={{ flex: '1' }}>
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
                  placeholder="Søk i fraværsmeldinger..."
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
                minWidth: isMobile ? '100%' : '150px'
              }}
            >
              <option value="all">Alle statuser</option>
              <option value="pending">Venter</option>
              <option value="approved">Godkjent</option>
              <option value="rejected">Avvist</option>
            </select>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              style={{ 
                padding: '0.75rem', 
                border: '1px solid var(--gray-300)', 
                borderRadius: 'var(--radius-lg)', 
                outline: 'none',
                minWidth: isMobile ? '100%' : '150px'
              }}
            >
              <option value="all">Alle typer</option>
              <option value="sick">Sykefravær</option>
              <option value="personal">Personlig fravær</option>
              <option value="other">Annet</option>
            </select>
          </div>
        </div>

        {/* Absence List */}
        <div className="card">
          {filteredAbsences.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center' }}>
              <AlertTriangle style={{ width: '48px', height: '48px', color: 'var(--gray-400)', margin: '0 auto 1rem' }} />
              <h3 style={{ fontSize: 'var(--font-size-lg)', fontWeight: '600', color: 'var(--gray-900)', marginBottom: '0.5rem' }}>
                Ingen fraværsmeldinger
              </h3>
              <p style={{ color: 'var(--gray-600)' }}>
                Det er ingen fraværsmeldinger som matcher søkekriteriene dine.
              </p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead style={{ background: 'var(--gray-50)' }}>
                  <tr>
                    <th style={{ padding: '1rem', textAlign: 'left', fontSize: 'var(--font-size-xs)', fontWeight: '500', color: 'var(--gray-500)', textTransform: 'uppercase' }}>
                      Ansatt
                    </th>
                    <th style={{ padding: '1rem', textAlign: 'left', fontSize: 'var(--font-size-xs)', fontWeight: '500', color: 'var(--gray-500)', textTransform: 'uppercase' }}>
                      Type
                    </th>
                    <th style={{ padding: '1rem', textAlign: 'left', fontSize: 'var(--font-size-xs)', fontWeight: '500', color: 'var(--gray-500)', textTransform: 'uppercase' }}>
                      Periode
                    </th>
                    <th style={{ padding: '1rem', textAlign: 'left', fontSize: 'var(--font-size-xs)', fontWeight: '500', color: 'var(--gray-500)', textTransform: 'uppercase' }}>
                      Status
                    </th>
                    <th style={{ padding: '1rem', textAlign: 'left', fontSize: 'var(--font-size-xs)', fontWeight: '500', color: 'var(--gray-500)', textTransform: 'uppercase' }}>
                      Notater
                    </th>
                    <th style={{ padding: '1rem', textAlign: 'left', fontSize: 'var(--font-size-xs)', fontWeight: '500', color: 'var(--gray-500)', textTransform: 'uppercase' }}>
                      Handlinger
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAbsences.map((absence) => (
                    <tr key={absence.id} style={{ borderBottom: '1px solid var(--gray-200)', cursor: 'pointer' }} 
                        onMouseEnter={(e) => e.currentTarget.style.background = 'var(--gray-50)'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'var(--white)'}>
                      <td style={{ padding: '1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                          <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--gray-300)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <User style={{ width: '20px', height: '20px', color: 'var(--gray-600)' }} />
                          </div>
                          <div style={{ marginLeft: '1rem' }}>
                            <div style={{ fontSize: 'var(--font-size-sm)', fontWeight: '500', color: 'var(--gray-900)' }}>
                              {getEmployeeName(absence.employeeId)}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <span className={`badge ${getTypeColor(absence.type)}`}>
                          {absence.type === 'sick' ? 'Sykefravær' : 
                           absence.type === 'personal' ? 'Personlig fravær' : 'Annet'}
                        </span>
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', fontSize: 'var(--font-size-sm)', color: 'var(--gray-900)' }}>
                          <Calendar style={{ width: '16px', height: '16px', color: 'var(--gray-400)', marginRight: '0.5rem' }} />
                          {formatDate(absence.startDate)} - {formatDate(absence.endDate)}
                        </div>
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <span className={`badge ${getStatusColor(absence.status)}`}>
                          {absence.status === 'pending' ? 'Venter' : 
                           absence.status === 'approved' ? 'Godkjent' : 'Avvist'}
                        </span>
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <div style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 'var(--font-size-sm)', color: 'var(--gray-900)' }}>
                          {absence.notes || 'Ingen notater'}
                        </div>
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          {absence.status === 'pending' && (
                            <>
                              <button
                                onClick={() => absence.id && handleUpdateAbsence(absence.id, 'approved')}
                                style={{ color: 'var(--green-600)', padding: '0.25rem' }}
                                title="Godkjenn"
                              >
                                <CheckCircle style={{ width: '16px', height: '16px' }} />
                              </button>
                              <button
                                onClick={() => absence.id && handleUpdateAbsence(absence.id, 'rejected')}
                                style={{ color: 'var(--red-600)', padding: '0.25rem' }}
                                title="Avvis"
                              >
                                <AlertCircle style={{ width: '16px', height: '16px' }} />
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => absence.id && handleDeleteAbsence(absence.id)}
                            style={{ color: 'var(--red-600)', padding: '0.25rem' }}
                            title="Slett"
                          >
                            <Trash2 style={{ width: '16px', height: '16px' }} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Add Absence Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Ny fraværsmelding</h2>
              <button className="modal-close" onClick={() => setShowAddModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="modal-form-grid">
                <div className="form-field">
                  <label className="form-label">Type fravær</label>
                  <select
                    value={newAbsence.type}
                    onChange={(e) => setNewAbsence({...newAbsence, type: e.target.value as 'sick' | 'personal' | 'other'})}
                    className="form-select-modal"
                    required
                  >
                    <option value="sick">Sykefravær</option>
                    <option value="personal">Personlig fravær</option>
                    <option value="other">Annet</option>
                  </select>
                </div>
                <div className="form-field">
                  <label className="form-label">Startdato</label>
                  <input
                    type="date"
                    value={newAbsence.startDate}
                    onChange={(e) => setNewAbsence({...newAbsence, startDate: e.target.value})}
                    className="form-input-modal"
                    required
                  />
                </div>
                <div className="form-field">
                  <label className="form-label">Sluttdato</label>
                  <input
                    type="date"
                    value={newAbsence.endDate}
                    onChange={(e) => setNewAbsence({...newAbsence, endDate: e.target.value})}
                    className="form-input-modal"
                    required
                  />
                </div>
                <div className="form-field">
                  <label className="form-label">Årsak</label>
                  <input
                    type="text"
                    value={newAbsence.reason}
                    onChange={(e) => setNewAbsence({...newAbsence, reason: e.target.value})}
                    className="form-input-modal"
                    placeholder="Oppgi årsak til fravær"
                    required
                  />
                </div>
                <div className="form-field" style={{ gridColumn: '1 / -1' }}>
                  <label className="form-label">Notater</label>
                  <textarea
                    value={newAbsence.notes}
                    onChange={(e) => setNewAbsence({...newAbsence, notes: e.target.value})}
                    className="form-textarea-modal"
                    rows={3}
                    placeholder="Eventuelle notater"
                  />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button
                onClick={() => setShowAddModal(false)}
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
                onClick={handleAddAbsence}
                style={{ 
                  padding: '0.75rem 1.5rem', 
                  background: 'var(--blue-600)', 
                  color: 'var(--white)', 
                  border: 'none', 
                  borderRadius: 'var(--radius-lg)', 
                  cursor: 'pointer' 
                }}
              >
                Send fraværsmelding
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}