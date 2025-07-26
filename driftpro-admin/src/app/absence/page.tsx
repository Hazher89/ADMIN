'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { FirebaseService } from '../../lib/firebase-service';

interface Absence {
  id: string;
  employeeId: string;
  employeeName: string;
  type: 'sykdom' | 'ferie' | 'permisjon' | 'andre';
  startDate: string;
  endDate: string;
  status: 'pending' | 'approved' | 'rejected';
  description: string;
  createdAt: Date;
}

export default function AbsencePage() {
  const { selectedCompany } = useAuth();
  const [absences, setAbsences] = useState<Absence[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newAbsence, setNewAbsence] = useState({
    employeeId: '',
    employeeName: '',
    type: 'ferie' as 'sykdom' | 'ferie' | 'permisjon' | 'andre',
    startDate: '',
    endDate: '',
    description: ''
  });
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selected, setSelected] = useState<Absence | null>(null);
  const [editMode, setEditMode] = useState(false);

  useEffect(() => {
    if (selectedCompany) {
      fetchAbsences();
    }
  }, [selectedCompany]);

  async function fetchAbsences() {
    setLoading(true);
    try {
      // Mock data for now - replace with real Firebase call
      const mockAbsences: Absence[] = [
        {
          id: '1',
          employeeId: 'EMP001',
          employeeName: 'Admin DriftPro',
          type: 'ferie',
          startDate: '2024-07-15',
          endDate: '2024-07-22',
          status: 'approved',
          description: 'Sommerferie',
          createdAt: new Date('2024-07-01')
        },
        {
          id: '2',
          employeeId: 'EMP002',
          employeeName: 'Manager DriftPro',
          type: 'sykdom',
          startDate: '2024-07-20',
          endDate: '2024-07-25',
          status: 'approved',
          description: 'Forkjølelse',
          createdAt: new Date('2024-07-19')
        },
        {
          id: '3',
          employeeId: 'EMP003',
          employeeName: 'Employee DriftPro',
          type: 'permisjon',
          startDate: '2024-08-01',
          endDate: '2024-08-03',
          status: 'pending',
          description: 'Doktorbesøk',
          createdAt: new Date('2024-07-25')
        }
      ];
      setAbsences(mockAbsences);
    } catch (error) {
      console.error('Error fetching absences:', error);
    }
    setLoading(false);
  }

  async function handleCreate() {
    if (!newAbsence.employeeId || !newAbsence.startDate || !newAbsence.endDate) {
      alert('Vennligst fyll ut alle påkrevde felter');
      return;
    }

    try {
      const absence: Omit<Absence, 'id' | 'createdAt'> = {
        employeeId: newAbsence.employeeId,
        employeeName: newAbsence.employeeName,
        type: newAbsence.type,
        startDate: newAbsence.startDate,
        endDate: newAbsence.endDate,
        status: 'pending',
        description: newAbsence.description
      };

      // Mock creation - replace with real Firebase call
      const newAbsenceWithId: Absence = {
        ...absence,
        id: Date.now().toString(),
        createdAt: new Date()
      };

      setAbsences([...absences, newAbsenceWithId]);
      setShowCreate(false);
      setNewAbsence({
        employeeId: '',
        employeeName: '',
        type: 'ferie',
        startDate: '',
        endDate: '',
        description: ''
      });
      alert('Fravær registrert');
    } catch (error) {
      alert('Feil ved registrering av fravær');
    }
  }

  async function handleUpdateStatus(absenceId: string, status: 'approved' | 'rejected') {
    try {
      setAbsences(absences.map(absence => 
        absence.id === absenceId ? { ...absence, status } : absence
      ));
      alert(`Fravær ${status === 'approved' ? 'godkjent' : 'avvist'}`);
    } catch (error) {
      alert('Feil ved oppdatering av status');
    }
  }

  const filtered = absences.filter(
    (a) =>
      (!search || a.employeeName.toLowerCase().includes(search.toLowerCase())) &&
      (!typeFilter || a.type === typeFilter) &&
      (!statusFilter || a.status === statusFilter)
  );

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '20px' 
      }}>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#3c8dbc' }}>
          <i className="fas fa-calendar-times" style={{ marginRight: '10px' }}></i>
          Fravær & Ferie
        </h1>
        <button
          onClick={() => setShowCreate(true)}
          style={{
            backgroundColor: '#3c8dbc',
            color: 'white',
            border: 'none',
            padding: '10px 20px',
            borderRadius: '5px',
            cursor: 'pointer',
            fontWeight: 'bold'
          }}
        >
          <i className="fas fa-plus" style={{ marginRight: '8px' }}></i>
          Ny fraværsregistrering
        </button>
      </div>

      <div style={{ 
        display: 'flex', 
        gap: '10px', 
        marginBottom: '20px',
        flexWrap: 'wrap'
      }}>
        <input
          type="text"
          placeholder="Søk etter ansatt..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            padding: '8px 12px',
            border: '1px solid #ddd',
            borderRadius: '4px',
            minWidth: '200px'
          }}
        />
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          style={{
            padding: '8px 12px',
            border: '1px solid #ddd',
            borderRadius: '4px'
          }}
        >
          <option value="">Alle typer</option>
          <option value="ferie">Ferie</option>
          <option value="sykdom">Sykdom</option>
          <option value="permisjon">Permisjon</option>
          <option value="andre">Andre</option>
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{
            padding: '8px 12px',
            border: '1px solid #ddd',
            borderRadius: '4px'
          }}
        >
          <option value="">Alle statuser</option>
          <option value="pending">Venter</option>
          <option value="approved">Godkjent</option>
          <option value="rejected">Avvist</option>
        </select>
      </div>

      <div style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        overflow: 'hidden'
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: '#f4f6f9' }}>
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Ansatt</th>
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Type</th>
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Fra</th>
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Til</th>
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Status</th>
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Handlinger</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
                  Laster fravær...
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
                  Ingen fravær funnet
                </td>
              </tr>
            ) : filtered.map((absence) => (
              <tr key={absence.id} style={{ borderBottom: '1px solid #eee' }}>
                <td style={{ padding: '12px' }}>
                  <div>
                    <div style={{ fontWeight: 'bold' }}>{absence.employeeName}</div>
                    <div style={{ fontSize: '12px', color: '#666' }}>{absence.employeeId}</div>
                  </div>
                </td>
                <td style={{ padding: '12px' }}>
                  <span style={{
                    padding: '4px 8px',
                    borderRadius: '4px',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    backgroundColor: 
                      absence.type === 'ferie' ? '#d4edda' :
                      absence.type === 'sykdom' ? '#f8d7da' :
                      absence.type === 'permisjon' ? '#d1ecf1' : '#fff3cd',
                    color: 
                      absence.type === 'ferie' ? '#155724' :
                      absence.type === 'sykdom' ? '#721c24' :
                      absence.type === 'permisjon' ? '#0c5460' : '#856404'
                  }}>
                    {absence.type === 'ferie' ? 'Ferie' :
                     absence.type === 'sykdom' ? 'Sykdom' :
                     absence.type === 'permisjon' ? 'Permisjon' : 'Andre'}
                  </span>
                </td>
                <td style={{ padding: '12px' }}>{new Date(absence.startDate).toLocaleDateString('nb-NO')}</td>
                <td style={{ padding: '12px' }}>{new Date(absence.endDate).toLocaleDateString('nb-NO')}</td>
                <td style={{ padding: '12px' }}>
                  <span style={{
                    padding: '4px 8px',
                    borderRadius: '4px',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    backgroundColor: 
                      absence.status === 'approved' ? '#d4edda' :
                      absence.status === 'rejected' ? '#f8d7da' : '#fff3cd',
                    color: 
                      absence.status === 'approved' ? '#155724' :
                      absence.status === 'rejected' ? '#721c24' : '#856404'
                  }}>
                    {absence.status === 'pending' ? 'Venter' :
                     absence.status === 'approved' ? 'Godkjent' : 'Avvist'}
                  </span>
                </td>
                <td style={{ padding: '12px' }}>
                  {absence.status === 'pending' && (
                    <div style={{ display: 'flex', gap: '5px' }}>
                      <button
                        onClick={() => handleUpdateStatus(absence.id, 'approved')}
                        style={{
                          padding: '4px 8px',
                          backgroundColor: '#28a745',
                          color: 'white',
                          border: 'none',
                          borderRadius: '3px',
                          cursor: 'pointer',
                          fontSize: '12px'
                        }}
                      >
                        Godkjenn
                      </button>
                      <button
                        onClick={() => handleUpdateStatus(absence.id, 'rejected')}
                        style={{
                          padding: '4px 8px',
                          backgroundColor: '#dc3545',
                          color: 'white',
                          border: 'none',
                          borderRadius: '3px',
                          cursor: 'pointer',
                          fontSize: '12px'
                        }}
                      >
                        Avvis
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Create Modal */}
      {showCreate && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '20px',
            borderRadius: '8px',
            width: '90%',
            maxWidth: '500px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 'bold' }}>Ny fraværsregistrering</h2>
              <button
                onClick={() => setShowCreate(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  color: '#666'
                }}
              >
                ×
              </button>
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Ansatt ID</label>
              <input
                type="text"
                value={newAbsence.employeeId}
                onChange={(e) => setNewAbsence({ ...newAbsence, employeeId: e.target.value })}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ddd',
                  borderRadius: '4px'
                }}
                placeholder="EMP001"
              />
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Ansatt navn</label>
              <input
                type="text"
                value={newAbsence.employeeName}
                onChange={(e) => setNewAbsence({ ...newAbsence, employeeName: e.target.value })}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ddd',
                  borderRadius: '4px'
                }}
                placeholder="Navn på ansatt"
              />
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Type</label>
              <select
                value={newAbsence.type}
                onChange={(e) => setNewAbsence({ ...newAbsence, type: e.target.value as 'sykdom' | 'ferie' | 'permisjon' | 'andre' })}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ddd',
                  borderRadius: '4px'
                }}
              >
                <option value="ferie">Ferie</option>
                <option value="sykdom">Sykdom</option>
                <option value="permisjon">Permisjon</option>
                <option value="andre">Andre</option>
              </select>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Fra dato</label>
                <input
                  type="date"
                  value={newAbsence.startDate}
                  onChange={(e) => setNewAbsence({ ...newAbsence, startDate: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: '1px solid #ddd',
                    borderRadius: '4px'
                  }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Til dato</label>
                <input
                  type="date"
                  value={newAbsence.endDate}
                  onChange={(e) => setNewAbsence({ ...newAbsence, endDate: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: '1px solid #ddd',
                    borderRadius: '4px'
                  }}
                />
              </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Beskrivelse</label>
              <textarea
                value={newAbsence.description}
                onChange={(e) => setNewAbsence({ ...newAbsence, description: e.target.value })}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  minHeight: '80px',
                  resize: 'vertical'
                }}
                placeholder="Beskrivelse av fraværet..."
              />
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowCreate(false)}
                style={{
                  padding: '10px 20px',
                  border: '1px solid #ddd',
                  backgroundColor: 'white',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Avbryt
              </button>
              <button
                onClick={handleCreate}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#3c8dbc',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontWeight: 'bold'
                }}
              >
                Registrer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 