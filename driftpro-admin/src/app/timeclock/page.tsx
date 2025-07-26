'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { FirebaseService } from '../../lib/firebase-service';

interface TimeEntry {
  id: string;
  employeeId: string;
  employeeName: string;
  type: 'clock-in' | 'clock-out';
  timestamp: Date;
  location?: string;
  notes?: string;
}

interface Employee {
  id: string;
  name: string;
  isClockedIn: boolean;
  lastClockIn?: Date;
  lastClockOut?: Date;
}

export default function TimeClockPage() {
  const { selectedCompany } = useAuth();
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEmployee, setSelectedEmployee] = useState<string>('');
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');
  const [search, setSearch] = useState('');
  const [dateFilter, setDateFilter] = useState('');

  useEffect(() => {
    if (selectedCompany) {
      fetchData();
    }
  }, [selectedCompany]);

  async function fetchData() {
    setLoading(true);
    try {
      // Mock data for now - replace with real Firebase call
      const mockEmployees: Employee[] = [
        {
          id: 'EMP001',
          name: 'Admin DriftPro',
          isClockedIn: true,
          lastClockIn: new Date('2024-07-26T08:00:00'),
          lastClockOut: new Date('2024-07-25T17:00:00')
        },
        {
          id: 'EMP002',
          name: 'Manager DriftPro',
          isClockedIn: false,
          lastClockIn: new Date('2024-07-25T08:30:00'),
          lastClockOut: new Date('2024-07-25T16:30:00')
        },
        {
          id: 'EMP003',
          name: 'Employee DriftPro',
          isClockedIn: true,
          lastClockIn: new Date('2024-07-26T07:45:00'),
          lastClockOut: new Date('2024-07-25T16:15:00')
        }
      ];

      const mockTimeEntries: TimeEntry[] = [
        {
          id: '1',
          employeeId: 'EMP001',
          employeeName: 'Admin DriftPro',
          type: 'clock-in',
          timestamp: new Date('2024-07-26T08:00:00'),
          location: 'Hovedkontor',
          notes: 'På jobb'
        },
        {
          id: '2',
          employeeId: 'EMP001',
          employeeName: 'Admin DriftPro',
          type: 'clock-out',
          timestamp: new Date('2024-07-25T17:00:00'),
          location: 'Hovedkontor',
          notes: 'Ferdig for dagen'
        },
        {
          id: '3',
          employeeId: 'EMP002',
          employeeName: 'Manager DriftPro',
          type: 'clock-in',
          timestamp: new Date('2024-07-25T08:30:00'),
          location: 'Hovedkontor'
        },
        {
          id: '4',
          employeeId: 'EMP002',
          employeeName: 'Manager DriftPro',
          type: 'clock-out',
          timestamp: new Date('2024-07-25T16:30:00'),
          location: 'Hovedkontor'
        },
        {
          id: '5',
          employeeId: 'EMP003',
          employeeName: 'Employee DriftPro',
          type: 'clock-in',
          timestamp: new Date('2024-07-26T07:45:00'),
          location: 'Produksjon'
        }
      ];

      setEmployees(mockEmployees);
      setTimeEntries(mockTimeEntries);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
    setLoading(false);
  }

  async function handleClockInOut(employeeId: string, type: 'clock-in' | 'clock-out') {
    try {
      const employee = employees.find(emp => emp.id === employeeId);
      if (!employee) return;

      const newEntry: TimeEntry = {
        id: Date.now().toString(),
        employeeId,
        employeeName: employee.name,
        type,
        timestamp: new Date(),
        location: location || 'Hovedkontor',
        notes: notes || undefined
      };

      setTimeEntries([newEntry, ...timeEntries]);

      // Update employee status
      setEmployees(employees.map(emp => 
        emp.id === employeeId 
          ? { 
              ...emp, 
              isClockedIn: type === 'clock-in',
              lastClockIn: type === 'clock-in' ? new Date() : emp.lastClockIn,
              lastClockOut: type === 'clock-out' ? new Date() : emp.lastClockOut
            }
          : emp
      ));

      setLocation('');
      setNotes('');
      alert(`${type === 'clock-in' ? 'Innstempling' : 'Utstempling'} registrert for ${employee.name}`);
    } catch (error) {
      alert('Feil ved registrering av stempling');
    }
  }

  const filteredEmployees = employees.filter(emp =>
    emp.name.toLowerCase().includes(search.toLowerCase())
  );

  const filteredTimeEntries = timeEntries.filter(entry => {
    const matchesSearch = entry.employeeName.toLowerCase().includes(search.toLowerCase());
    const matchesDate = !dateFilter || entry.timestamp.toDateString() === new Date(dateFilter).toDateString();
    return matchesSearch && matchesDate;
  });

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '20px' 
      }}>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#3c8dbc' }}>
          <i className="fas fa-clock" style={{ marginRight: '10px' }}></i>
          Stemple Inn/Ut
        </h1>
      </div>

      {/* Quick Clock In/Out Section */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        padding: '20px',
        marginBottom: '20px'
      }}>
        <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '15px' }}>Rask Stempling</h2>
        
        <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div style={{ minWidth: '200px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Ansatt</label>
            <select
              value={selectedEmployee}
              onChange={(e) => setSelectedEmployee(e.target.value)}
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #ddd',
                borderRadius: '4px'
              }}
            >
              <option value="">Velg ansatt</option>
              {employees.map(emp => (
                <option key={emp.id} value={emp.id}>
                  {emp.name} ({emp.isClockedIn ? 'Innstemplet' : 'Utstemplet'})
                </option>
              ))}
            </select>
          </div>

          <div style={{ minWidth: '150px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Lokasjon</label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Hovedkontor"
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #ddd',
                borderRadius: '4px'
              }}
            />
          </div>

          <div style={{ minWidth: '200px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Notater</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Valgfritt"
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #ddd',
                borderRadius: '4px'
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={() => selectedEmployee && handleClockInOut(selectedEmployee, 'clock-in')}
              disabled={!selectedEmployee}
              style={{
                padding: '10px 20px',
                backgroundColor: '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: selectedEmployee ? 'pointer' : 'not-allowed',
                opacity: selectedEmployee ? 1 : 0.6,
                fontWeight: 'bold'
              }}
            >
              <i className="fas fa-sign-in-alt" style={{ marginRight: '8px' }}></i>
              Stemple Inn
            </button>
            <button
              onClick={() => selectedEmployee && handleClockInOut(selectedEmployee, 'clock-out')}
              disabled={!selectedEmployee}
              style={{
                padding: '10px 20px',
                backgroundColor: '#dc3545',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: selectedEmployee ? 'pointer' : 'not-allowed',
                opacity: selectedEmployee ? 1 : 0.6,
                fontWeight: 'bold'
              }}
            >
              <i className="fas fa-sign-out-alt" style={{ marginRight: '8px' }}></i>
              Stemple Ut
            </button>
          </div>
        </div>
      </div>

      {/* Employee Status */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        padding: '20px',
        marginBottom: '20px'
      }}>
        <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '15px' }}>Ansatte Status</h2>
        
        <div style={{ marginBottom: '15px' }}>
          <input
            type="text"
            placeholder="Søk etter ansatt..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              padding: '8px 12px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              width: '300px'
            }}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '15px' }}>
          {filteredEmployees.map(employee => (
            <div key={employee.id} style={{
              border: '1px solid #ddd',
              borderRadius: '6px',
              padding: '15px',
              backgroundColor: employee.isClockedIn ? '#d4edda' : '#f8f9fa'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <h3 style={{ fontWeight: 'bold', fontSize: '16px' }}>{employee.name}</h3>
                <span style={{
                  padding: '4px 8px',
                  borderRadius: '4px',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  backgroundColor: employee.isClockedIn ? '#28a745' : '#6c757d',
                  color: 'white'
                }}>
                  {employee.isClockedIn ? 'Innstemplet' : 'Utstemplet'}
                </span>
              </div>
              
              <div style={{ fontSize: '14px', color: '#666' }}>
                <div>ID: {employee.id}</div>
                {employee.lastClockIn && (
                  <div>Sist inn: {employee.lastClockIn.toLocaleString('nb-NO')}</div>
                )}
                {employee.lastClockOut && (
                  <div>Sist ut: {employee.lastClockOut.toLocaleString('nb-NO')}</div>
                )}
              </div>

              <div style={{ marginTop: '10px', display: 'flex', gap: '5px' }}>
                <button
                  onClick={() => handleClockInOut(employee.id, 'clock-in')}
                  disabled={employee.isClockedIn}
                  style={{
                    padding: '6px 12px',
                    backgroundColor: employee.isClockedIn ? '#6c757d' : '#28a745',
                    color: 'white',
                    border: 'none',
                    borderRadius: '3px',
                    cursor: employee.isClockedIn ? 'not-allowed' : 'pointer',
                    fontSize: '12px',
                    opacity: employee.isClockedIn ? 0.6 : 1
                  }}
                >
                  Inn
                </button>
                <button
                  onClick={() => handleClockInOut(employee.id, 'clock-out')}
                  disabled={!employee.isClockedIn}
                  style={{
                    padding: '6px 12px',
                    backgroundColor: !employee.isClockedIn ? '#6c757d' : '#dc3545',
                    color: 'white',
                    border: 'none',
                    borderRadius: '3px',
                    cursor: !employee.isClockedIn ? 'not-allowed' : 'pointer',
                    fontSize: '12px',
                    opacity: !employee.isClockedIn ? 0.6 : 1
                  }}
                >
                  Ut
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Time Entries History */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        padding: '20px'
      }}>
        <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '15px' }}>Stemplehistorikk</h2>
        
        <div style={{ marginBottom: '15px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
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
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            style={{
              padding: '8px 12px',
              border: '1px solid #ddd',
              borderRadius: '4px'
            }}
          />
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#f4f6f9' }}>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Ansatt</th>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Type</th>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Tidspunkt</th>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Lokasjon</th>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Notater</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
                    Laster data...
                  </td>
                </tr>
              ) : filteredTimeEntries.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
                    Ingen stemplinger funnet
                  </td>
                </tr>
              ) : filteredTimeEntries.map((entry) => (
                <tr key={entry.id} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '12px', fontWeight: 'bold' }}>{entry.employeeName}</td>
                  <td style={{ padding: '12px' }}>
                    <span style={{
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '12px',
                      fontWeight: 'bold',
                      backgroundColor: entry.type === 'clock-in' ? '#d4edda' : '#f8d7da',
                      color: entry.type === 'clock-in' ? '#155724' : '#721c24'
                    }}>
                      {entry.type === 'clock-in' ? 'Inn' : 'Ut'}
                    </span>
                  </td>
                  <td style={{ padding: '12px' }}>{entry.timestamp.toLocaleString('nb-NO')}</td>
                  <td style={{ padding: '12px' }}>{entry.location || '-'}</td>
                  <td style={{ padding: '12px' }}>{entry.notes || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
} 