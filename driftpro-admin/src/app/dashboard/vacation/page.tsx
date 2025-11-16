'use client';

import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { firebaseService, Vacation, createUserAccessContext } from '@/lib/firebase-services';
import { 
  Calendar, Plus, Search, Users, CheckCircle, AlertCircle, Clock, ChevronDown, Download,
  Settings as SettingsIcon
} from 'lucide-react';
import VacationCalendar from '@/components/VacationCalendar';
import EmployeeVacationManager from '@/components/EmployeeVacationManager';

interface Employee {
  id: string;
  firstName?: string;
  lastName?: string;
  name?: string;
  department?: string;
  role?: string;
  email?: string;
  vacationDays?: {
    total: number;
    used: number;
    remaining: number;
    carriedOver: number;
  };
}

type VacationWithEmployee = Vacation & { employeeName?: string; department?: string };

export default function VacationPage() {
  const { userProfile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [vacations, setVacations] = useState<VacationWithEmployee[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [selectedEmployee, setSelectedEmployee] = useState<'all' | string>('all');
  const [showCalendar, setShowCalendar] = useState(false);
  const [showManage, setShowManage] = useState(false);

  // Load data
  const loadData = useCallback(async () => {
    if (!userProfile?.companyId) return;
    try {
      setLoading(true);
      // Load data with GDPR filtering
      const userContext = createUserAccessContext(userProfile);
      const [vacationData, employeeData] = await Promise.all([
        firebaseService.getVacations(userProfile.companyId, userContext),
        firebaseService.getEmployees(userProfile.companyId, userContext)
      ]);

      const employeeIndex = new Map<string, Employee>();
      employeeData.forEach(e => employeeIndex.set(e.id, e as Employee));

      const enhanced = vacationData.map(v => {
        const emp = employeeIndex.get(v.employeeId);
        return {
          ...v,
          employeeName: emp?.name || `${emp?.firstName || ''} ${emp?.lastName || ''}`.trim() || `Ansatt ${v.employeeId.slice(0, 6)}`,
          department: emp?.department || ''
        } as VacationWithEmployee;
      });

      setVacations(enhanced);
      setEmployees(employeeData as Employee[]);
    } catch (e) {
      console.error('Failed to load vacation data', e);
    } finally {
      setLoading(false);
    }
  }, [userProfile?.companyId]);

  useEffect(() => { loadData(); }, [loadData]);

  // Filters
  const filtered = useMemo(() => {
    return vacations.filter(v => {
      const inYear = new Date(v.startDate).getFullYear() === selectedYear;
      const searchMatch = searchTerm.trim().length === 0 ||
        (v.employeeName?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false) ||
        (v.notes?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);
      const statusMatch = selectedStatus === 'all' || v.status === selectedStatus;
      const empMatch = selectedEmployee === 'all' || v.employeeId === selectedEmployee;
      return inYear && searchMatch && statusMatch && empMatch;
    });
  }, [vacations, searchTerm, selectedStatus, selectedEmployee, selectedYear]);

  const stats = useMemo(() => ({
    total: vacations.length,
    pending: vacations.filter(v => v.status === 'pending').length,
    approved: vacations.filter(v => v.status === 'approved').length,
    rejected: vacations.filter(v => v.status === 'rejected').length,
  }), [vacations]);

  // Actions
  const addVacation = async (employeeId: string, startDate: string, endDate: string, reason: string) => {
    if (!userProfile?.companyId) return;
    try {
      await firebaseService.createVacation({
        employeeId,
        companyId: userProfile.companyId,
        type: 'vacation',
        startDate,
        endDate,
        notes: reason,
        status: 'pending',
        requestedBy: userProfile.id,
        employeeName: userProfile.displayName || userProfile.email,
        days: Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1
      });
      await loadData();
    } catch (e) {
      console.error('Failed to add vacation', e);
    }
  };

  const updateVacation = async (vacationId: string, startDate: string, endDate: string, reason: string) => {
    try {
      await firebaseService.updateVacation(vacationId, { startDate, endDate, notes: reason, updatedAt: new Date().toISOString() });
      await loadData();
    } catch (e) {
      console.error('Failed to update vacation', e);
    }
  };

  const deleteVacation = async (vacationId: string) => {
    try {
      await firebaseService.updateVacation(vacationId, { status: 'rejected', updatedAt: new Date().toISOString() });
      await loadData();
    } catch (e) {
      console.error('Failed to delete vacation', e);
    }
  };

  const approveVacation = async (vacationId: string) => {
    try {
      await firebaseService.updateVacation(vacationId, { status: 'approved', updatedAt: new Date().toISOString() });
      await loadData();
    } catch (e) {
      console.error('Failed to approve vacation', e);
    }
  };

  const exportCsv = () => {
    const rows = filtered.map(v => ({
      Employee: v.employeeName || v.employeeId,
      From: v.startDate,
      To: v.endDate,
      Status: v.status,
      Notes: v.notes || ''
    }));
    if (rows.length === 0) return;
    const header = Object.keys(rows[0]).join(',');
    const csv = [header, ...rows.map(r => Object.values(r).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ferie_${selectedYear}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        Laster ferie...
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--gray-50)' }}>
      {/* Header */}
      <div style={{ background: 'var(--card-background)', boxShadow: 'var(--shadow-sm)', borderBottom: '1px solid var(--border-color)', padding: '1.5rem 2rem' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1 style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 700, color: 'var(--text-color)' }}>Ferie</h1>
            <p style={{ color: 'var(--gray-500)', marginTop: '0.25rem' }}>Full oversikt over alle ferieforespørsler og feriedager</p>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <div style={{ display: 'inline-flex', border: '1px solid var(--gray-200)', borderRadius: '10px', overflow: 'hidden' }}>
              <button
                onClick={() => setShowCalendar(true)}
                className="btn"
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', borderRight: '1px solid var(--gray-200)', background: 'white' }}
              >
                <Calendar style={{ width: 16, height: 16 }} /> Kalender
              </button>
              <button
                onClick={() => setShowManage(true)}
                className="btn btn-secondary"
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
              >
                <SettingsIcon style={{ width: 16, height: 16 }} /> Administrer
              </button>
            </div>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '2rem 1rem' }}>
        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
          <div className="card" style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{ padding: '0.75rem', background: 'var(--blue-100)', borderRadius: 'var(--radius-lg)' }}>
              <Users style={{ width: 24, height: 24, color: 'var(--blue-600)' }} />
            </div>
            <div style={{ marginLeft: '1rem' }}>
              <p style={{ color: 'var(--gray-600)' }}>Totalt</p>
              <p style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 600 }}>{stats.total}</p>
            </div>
          </div>
          <div className="card" style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{ padding: '0.75rem', background: 'var(--yellow-100)', borderRadius: 'var(--radius-lg)' }}>
              <Clock style={{ width: 24, height: 24, color: 'var(--yellow-600)' }} />
            </div>
            <div style={{ marginLeft: '1rem' }}>
              <p style={{ color: 'var(--gray-600)' }}>Venter</p>
              <p style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 600 }}>{stats.pending}</p>
            </div>
          </div>
          <div className="card" style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{ padding: '0.75rem', background: 'var(--green-100)', borderRadius: 'var(--radius-lg)' }}>
              <CheckCircle style={{ width: 24, height: 24, color: 'var(--green-600)' }} />
            </div>
            <div style={{ marginLeft: '1rem' }}>
              <p style={{ color: 'var(--gray-600)' }}>Godkjent</p>
              <p style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 600 }}>{stats.approved}</p>
            </div>
          </div>
          <div className="card" style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{ padding: '0.75rem', background: 'var(--red-100)', borderRadius: 'var(--radius-lg)' }}>
              <AlertCircle style={{ width: 24, height: 24, color: 'var(--red-600)' }} />
            </div>
            <div style={{ marginLeft: '1rem' }}>
              <p style={{ color: 'var(--gray-600)' }}>Avvist</p>
              <p style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 600 }}>{stats.rejected}</p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="card" style={{ marginBottom: '1.5rem', display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center', padding: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--gray-50)', borderRadius: '0.375rem', padding: '0.5rem 0.75rem', flex: '1 1 250px' }}>
            <Search size={16} style={{ color: 'var(--gray-400)' }} />
            <input
              type="text"
              placeholder="Søk etter ansatt eller notat..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ background: 'transparent', border: 'none', outline: 'none', width: '100%', color: 'var(--gray-900)' }}
            />
          </div>

          <div style={{ position: 'relative' }}>
            <select value={selectedEmployee} onChange={(e) => setSelectedEmployee(e.target.value)}
              style={{ appearance: 'none', padding: '0.5rem 2rem 0.5rem 0.75rem', border: '1px solid var(--gray-200)', borderRadius: '0.375rem' }}>
              <option value="all">Alle ansatte</option>
              {employees.map(e => (
                <option key={e.id} value={e.id}>{e.name || `${e.firstName || ''} ${e.lastName || ''}`.trim() || e.email}</option>
              ))}
            </select>
            <ChevronDown size={16} style={{ position: 'absolute', right: '0.5rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--gray-400)', pointerEvents: 'none' }} />
          </div>

          <div style={{ position: 'relative' }}>
            <select value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value as any)}
              style={{ appearance: 'none', padding: '0.5rem 2rem 0.5rem 0.75rem', border: '1px solid var(--gray-200)', borderRadius: '0.375rem' }}>
              <option value="all">Alle statuser</option>
              <option value="pending">Venter</option>
              <option value="approved">Godkjent</option>
              <option value="rejected">Avvist</option>
            </select>
            <ChevronDown size={16} style={{ position: 'absolute', right: '0.5rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--gray-400)', pointerEvents: 'none' }} />
          </div>

          <div style={{ position: 'relative' }}>
            <select value={selectedYear} onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              style={{ appearance: 'none', padding: '0.5rem 2rem 0.5rem 0.75rem', border: '1px solid var(--gray-200)', borderRadius: '0.375rem' }}>
              <option value={new Date().getFullYear()}>{new Date().getFullYear()} (i år)</option>
              <option value={new Date().getFullYear() - 1}>{new Date().getFullYear() - 1} (i fjor)</option>
            </select>
            <ChevronDown size={16} style={{ position: 'absolute', right: '0.5rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--gray-400)', pointerEvents: 'none' }} />
          </div>

          <button onClick={exportCsv} className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginLeft: 'auto' }}>
            <Download style={{ width: 16, height: 16 }} /> Eksporter CSV
          </button>
        </div>

        {/* List */}
        <div className="card">
          {filtered.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--gray-500)' }}>
              Ingen ferieforespørsler funnet
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead style={{ background: 'var(--gray-50)' }}>
                  <tr>
                    <th style={{ padding: '0.75rem 1rem', textAlign: 'left' }}>Ansatt</th>
                    <th style={{ padding: '0.75rem 1rem', textAlign: 'left' }}>Periode</th>
                    <th style={{ padding: '0.75rem 1rem', textAlign: 'left' }}>Status</th>
                    <th style={{ padding: '0.75rem 1rem', textAlign: 'left' }}>Notater</th>
                    <th style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>Handlinger</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(v => (
                    <tr key={v.id} style={{ borderBottom: '1px solid var(--gray-200)' }}>
                      <td style={{ padding: '0.75rem 1rem' }}>{v.employeeName}</td>
                      <td style={{ padding: '0.75rem 1rem' }}>
                        {new Date(v.startDate).toLocaleDateString('nb-NO')} – {new Date(v.endDate).toLocaleDateString('nb-NO')}
                      </td>
                      <td style={{ padding: '0.75rem 1rem' }}>
                        {v.status === 'approved' ? (
                          <span className="badge badge-success">Godkjent</span>
                        ) : v.status === 'pending' ? (
                          <span className="badge badge-warning">Venter</span>
                        ) : (
                          <span className="badge badge-danger">Avvist</span>
                        )}
                      </td>
                      <td style={{ padding: '0.75rem 1rem', maxWidth: 320, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {v.notes || '—'}
                      </td>
                      <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                        {v.status === 'pending' && (
                          <button onClick={() => approveVacation(v.id)} className="btn btn-secondary">
                            Godkjenn
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Calendar modal */}
      {showCalendar && (
        <VacationCalendar
          vacationRequests={vacations.filter(v => v.type === 'vacation').map(v => ({
            id: v.id,
            employeeId: v.employeeId,
            employeeName: v.employeeName || v.employeeId,
            department: v.department || '',
            startDate: v.startDate,
            endDate: v.endDate,
            days: Math.max(1, Math.ceil((new Date(v.endDate).getTime() - new Date(v.startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1),
            reason: v.notes || '',
            status: v.status,
            submittedAt: v.createdAt || new Date().toISOString(),
            reviewedBy: undefined,
            reviewedAt: undefined,
            comments: undefined,
            type: 'vacation'
          }))}
          employees={employees.map(e => ({
            id: e.id,
            firstName: e.firstName || (e.name ? e.name.split(' ')[0] : ''),
            lastName: e.lastName || (e.name ? e.name.split(' ').slice(1).join(' ') : ''),
            department: e.department || '',
            role: e.role || ''
          }))}
          onDateClick={() => {}}
          onClose={() => setShowCalendar(false)}
          onAddVacation={addVacation}
          onEditVacation={updateVacation}
          onDeleteVacation={deleteVacation}
        />
      )}

      {/* Manage vacation days modal */}
      {showManage && (
        <EmployeeVacationManager
          employees={employees.map(e => ({
            id: e.id,
            firstName: e.firstName || (e.name ? e.name.split(' ')[0] : ''),
            lastName: e.lastName || (e.name ? e.name.split(' ').slice(1).join(' ') : ''),
            department: e.department || '',
            role: e.role || '',
            vacationDays: e.vacationDays || { total: 25, used: 0, remaining: 25, carriedOver: 0 }
          }))}
          onClose={() => setShowManage(false)}
          onUpdate={() => loadData()}
        />
      )}
    </div>
  );
}