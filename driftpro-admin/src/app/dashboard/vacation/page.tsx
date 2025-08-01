'use client';

import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  User, 
  CheckCircle,
  XCircle,
  Clock,
  Download,
  Filter,
  RefreshCw
} from 'lucide-react';
import { collection, addDoc, updateDoc, doc, deleteDoc, getDocs, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';

interface VacationRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  department: string;
  startDate: string;
  endDate: string;
  reason: string;
  type: 'vacation' | 'sick_leave' | 'other';
  status: 'pending' | 'approved' | 'rejected';
  days: number;
  submittedAt: string;
  companyId: string;
}

interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  department: string;
  role: string;
  phone: string;
}

export default function VacationPage() {
  const { user, userProfile } = useAuth();
  const [vacationRequests, setVacationRequests] = useState<VacationRequest[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<VacationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  
  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<VacationRequest | null>(null);
  
  // Form data
  const [formData, setFormData] = useState({
    employeeId: '',
    startDate: '',
    endDate: '',
    reason: '',
    type: 'vacation' as 'vacation' | 'sick_leave' | 'other'
  });

  // Load data
  useEffect(() => {
    if (!userProfile?.companyName) {
      setLoading(false);
      setVacationRequests([]);
      return;
    }

    const timeoutId = setTimeout(() => {
      if (loading) {
        console.log('Loading timeout - setting loading to false');
        setLoading(false);
        setVacationRequests([]);
      }
    }, 3000);

    loadData();

    return () => clearTimeout(timeoutId);
  }, [userProfile?.companyName]);

  const loadData = async () => {
    try {
      if (!db || !userProfile?.companyName) return;

      // Load vacation requests
      const requestsSnapshot = await getDocs(collection(db, 'vacationRequests'));
      const requestsData: VacationRequest[] = [];

      requestsSnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.companyId === userProfile.companyName) {
          const request: VacationRequest = {
            id: doc.id,
            employeeId: data.employeeId || '',
            employeeName: data.employeeName || '',
            department: data.department || '',
            startDate: data.startDate || '',
            endDate: data.endDate || '',
            reason: data.reason || '',
            type: data.type || 'vacation',
            status: data.status || 'pending',
            days: data.days || 0,
            submittedAt: data.submittedAt || new Date().toISOString(),
            companyId: userProfile.companyName || ''
          };
          requestsData.push(request);
        }
      });

      // Load employees
      const employeesSnapshot = await getDocs(collection(db, 'users'));
      const employeesData: Employee[] = [];

      employeesSnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.companyId === userProfile.companyName && data.status === 'active') {
          const employee: Employee = {
            id: doc.id,
            firstName: data.firstName || '',
            lastName: data.lastName || '',
            department: data.department || '',
            role: data.role || 'employee',
            phone: data.phone || ''
          };
          employeesData.push(employee);
        }
      });

      // Sort by submittedAt descending
      requestsData.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());

      setVacationRequests(requestsData);
      setEmployees(employeesData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter requests
  useEffect(() => {
    const filtered = vacationRequests.filter(request => {
      const matchesSearch = request.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           request.department.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || request.status === statusFilter;
      const matchesType = typeFilter === 'all' || request.type === typeFilter;

      return matchesSearch && matchesStatus && matchesType;
    });

    setFilteredRequests(filtered);
  }, [vacationRequests, searchTerm, statusFilter, typeFilter]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      if (!userProfile?.companyName) {
        throw new Error('Company not found');
      }

      const employee = employees.find(emp => emp.id === formData.employeeId);
      if (!employee) {
        throw new Error('Employee not found');
      }

      const startDate = new Date(formData.startDate);
      const endDate = new Date(formData.endDate);
      const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;

      const requestData = {
        employeeId: formData.employeeId,
        employeeName: `${employee.firstName} ${employee.lastName}`,
        department: employee.department,
        startDate: formData.startDate,
        endDate: formData.endDate,
        reason: formData.reason,
        type: formData.type,
        status: 'pending' as const,
        days,
        submittedAt: new Date().toISOString(),
        companyId: userProfile.companyName,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      if (!db) throw new Error('Firebase not initialized');
      const docRef = await addDoc(collection(db, 'vacationRequests'), requestData);
      
      const newRequest: VacationRequest = { 
        id: docRef.id, 
        ...requestData,
        status: 'pending'
      };
      setVacationRequests(prev => [newRequest, ...prev]);
      
      setShowAddModal(false);
      resetForm();
    } catch (error) {
      console.error('Error adding vacation request:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleStatusUpdate = async (requestId: string, newStatus: 'approved' | 'rejected') => {
    try {
      if (!db) throw new Error('Firebase not initialized');

      await updateDoc(doc(db, 'vacationRequests', requestId), {
        status: newStatus,
        updatedAt: serverTimestamp()
      });
      
      setVacationRequests(prev => prev.map(request => 
        request.id === requestId 
          ? { ...request, status: newStatus }
          : request
      ));
    } catch (error) {
      console.error('Error updating vacation request:', error);
    }
  };

  const handleDelete = async (requestId: string) => {
    if (!confirm('Er du sikker på at du vil slette denne ferieforespørselen?')) return;

    try {
      if (!db) throw new Error('Firebase not initialized');
      await deleteDoc(doc(db, 'vacationRequests', requestId));
      
      setVacationRequests(prev => prev.filter(request => request.id !== requestId));
    } catch (error) {
      console.error('Error deleting vacation request:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      employeeId: '',
      startDate: '',
      endDate: '',
      reason: '',
      type: 'vacation'
    });
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
      case 'vacation': return 'badge-primary';
      case 'sick_leave': return 'badge-danger';
      case 'other': return 'badge-secondary';
      default: return 'badge-secondary';
    }
  };

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div className="loading" style={{ margin: '0 auto 1rem' }}></div>
          <p style={{ color: '#666' }}>Laster feriesystem...</p>
          <p style={{ fontSize: '0.875rem', color: '#999', marginTop: '0.5rem' }}>
            Hvis dette tar for lang tid, prøv å oppdatere siden
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem' }}>
      {/* Header */}
      <div className="page-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 className="page-title">Ferie</h1>
            <p className="page-subtitle">Administrer ferieforespørsler</p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="btn btn-primary"
          >
            <Plus style={{ width: '16px', height: '16px' }} />
            <span>Legg til forespørsel</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <div className="grid grid-cols-4" style={{ gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#333', marginBottom: '0.25rem' }}>
              Søk
            </label>
            <div style={{ position: 'relative' }}>
              <Search style={{
                position: 'absolute',
                left: '0.75rem',
                top: '50%',
                transform: 'translateY(-50%)',
                width: '16px',
                height: '16px',
                color: '#666'
              }} />
              <input
                type="text"
                placeholder="Søk ansatte..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
                style={{ paddingLeft: '2.5rem' }}
              />
            </div>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#333', marginBottom: '0.25rem' }}>
              Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'all' | 'pending' | 'approved' | 'rejected')}
              className="form-input"
            >
              <option value="all">Alle</option>
              <option value="pending">Venter</option>
              <option value="approved">Godkjent</option>
              <option value="rejected">Avvist</option>
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#333', marginBottom: '0.25rem' }}>
              Type
            </label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="form-input"
            >
              <option value="all">Alle typer</option>
              <option value="vacation">Ferie</option>
              <option value="sick_leave">Sykefravær</option>
              <option value="other">Annet</option>
            </select>
          </div>
          <div style={{ display: 'flex', alignItems: 'end' }}>
            <button
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('all');
                setTypeFilter('all');
              }}
              className="btn btn-secondary"
              style={{ width: '100%' }}
            >
              <RefreshCw style={{ width: '16px', height: '16px' }} />
              <span>Nullstill</span>
            </button>
          </div>
        </div>
      </div>

      {/* Vacation Requests Table */}
      <div className="card">
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(0, 0, 0, 0.1)' }}>
                <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: '600', color: '#666', textTransform: 'uppercase' }}>
                  Ansatt
                </th>
                <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: '600', color: '#666', textTransform: 'uppercase' }}>
                  Periode
                </th>
                <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: '600', color: '#666', textTransform: 'uppercase' }}>
                  Type
                </th>
                <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: '600', color: '#666', textTransform: 'uppercase' }}>
                  Dager
                </th>
                <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: '600', color: '#666', textTransform: 'uppercase' }}>
                  Status
                </th>
                <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: '600', color: '#666', textTransform: 'uppercase' }}>
                  Handlinger
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredRequests.map((request) => (
                <tr key={request.id} style={{ borderBottom: '1px solid rgba(0, 0, 0, 0.05)' }}>
                  <td style={{ padding: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <div className="user-avatar" style={{ width: '40px', height: '40px', marginRight: '1rem' }}>
                        <User style={{ width: '20px', height: '20px' }} />
                      </div>
                      <div>
                        <div style={{ fontSize: '0.875rem', fontWeight: '600', color: '#333' }}>
                          {request.employeeName}
                        </div>
                        <div style={{ fontSize: '0.875rem', color: '#666' }}>
                          {request.department}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '1rem', fontSize: '0.875rem', color: '#333' }}>
                    <div>
                      <div>{new Date(request.startDate).toLocaleDateString('nb-NO')}</div>
                      <div style={{ color: '#666' }}>til</div>
                      <div>{new Date(request.endDate).toLocaleDateString('nb-NO')}</div>
                    </div>
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <span className={`badge ${getTypeColor(request.type)}`}>
                      {request.type === 'vacation' ? 'Ferie' : 
                       request.type === 'sick_leave' ? 'Sykefravær' : 'Annet'}
                    </span>
                  </td>
                  <td style={{ padding: '1rem', fontSize: '0.875rem', color: '#333' }}>
                    {request.days} dager
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <span className={`badge ${getStatusColor(request.status)}`}>
                      {request.status === 'pending' ? 'Venter' : 
                       request.status === 'approved' ? 'Godkjent' : 'Avvist'}
                    </span>
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      {request.status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleStatusUpdate(request.id, 'approved')}
                            style={{ color: '#10b981', cursor: 'pointer' }}
                            title="Godkjenn"
                          >
                            <CheckCircle style={{ width: '16px', height: '16px' }} />
                          </button>
                          <button
                            onClick={() => handleStatusUpdate(request.id, 'rejected')}
                            style={{ color: '#ef4444', cursor: 'pointer' }}
                            title="Avvis"
                          >
                            <XCircle style={{ width: '16px', height: '16px' }} />
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => handleDelete(request.id)}
                        style={{ color: '#ef4444', cursor: 'pointer' }}
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
        
        {filteredRequests.length === 0 && (
          <div style={{ textAlign: 'center', padding: '3rem' }}>
            <Calendar style={{ width: '48px', height: '48px', color: '#ccc', margin: '0 auto 1rem' }} />
            <h3 style={{ fontSize: '0.875rem', fontWeight: '600', color: '#333', marginBottom: '0.5rem' }}>
              Ingen ferieforespørsler
            </h3>
            <p style={{ fontSize: '0.875rem', color: '#666' }}>
              {searchTerm || statusFilter !== 'all' || typeFilter !== 'all'
                ? 'Ingen forespørsler matcher filterkriteriene.'
                : 'Ingen ferieforespørsler funnet. Legg til en ny forespørsel for å komme i gang.'}
            </p>
          </div>
        )}
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div style={{ padding: '2rem' }}>
              <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#333', marginBottom: '1rem' }}>
                Legg til ferieforespørsel
              </h3>
              <form onSubmit={handleSubmit}>
                <div style={{ display: 'grid', gap: '1rem', marginBottom: '1.5rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#333', marginBottom: '0.25rem' }}>
                      Ansatt
                    </label>
                    <select
                      required
                      value={formData.employeeId}
                      onChange={(e) => setFormData({...formData, employeeId: e.target.value})}
                      className="form-input"
                    >
                      <option value="">Velg ansatt</option>
                      {employees.map(employee => (
                        <option key={employee.id} value={employee.id}>
                          {employee.firstName} {employee.lastName} - {employee.department}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#333', marginBottom: '0.25rem' }}>
                      Startdato
                    </label>
                    <input
                      type="date"
                      required
                      value={formData.startDate}
                      onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                      className="form-input"
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#333', marginBottom: '0.25rem' }}>
                      Sluttdato
                    </label>
                    <input
                      type="date"
                      required
                      value={formData.endDate}
                      onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                      className="form-input"
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#333', marginBottom: '0.25rem' }}>
                      Type
                    </label>
                    <select
                      required
                      value={formData.type}
                      onChange={(e) => setFormData({...formData, type: e.target.value as any})}
                      className="form-input"
                    >
                      <option value="vacation">Ferie</option>
                      <option value="sick_leave">Sykefravær</option>
                      <option value="other">Annet</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#333', marginBottom: '0.25rem' }}>
                      Årsak
                    </label>
                    <textarea
                      required
                      value={formData.reason}
                      onChange={(e) => setFormData({...formData, reason: e.target.value})}
                      rows={3}
                      placeholder="Beskriv årsaken til ferien..."
                      className="form-input"
                    />
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'end', gap: '0.75rem' }}>
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="btn btn-secondary"
                  >
                    Avbryt
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="btn btn-primary"
                  >
                    {saving ? 'Lagrer...' : 'Legg til'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 