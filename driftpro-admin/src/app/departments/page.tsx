'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { FirebaseService, Department, User } from '../../lib/firebase-service';

export default function DepartmentsPage() {
  const { selectedCompany } = useAuth();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newDepartment, setNewDepartment] = useState({
    name: '',
    description: '',
    manager: '',
    managerId: '',
    color: '#3c8dbc',
    budget: 0
  });
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Department | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [creating, setCreating] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!selectedCompany) return;
    
    setLoading(true);
    setError(null);
    try {
      const [fetchedDepartments, fetchedUsers] = await Promise.all([
        FirebaseService.getDepartmentsByCompany(selectedCompany.id),
        FirebaseService.getUsersByCompany(selectedCompany.id)
      ]);
      setDepartments(fetchedDepartments);
      setUsers(fetchedUsers);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Kunne ikke hente data. Prøv igjen senere.');
    } finally {
      setLoading(false);
    }
  }, [selectedCompany]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  async function handleCreate() {
    if (!selectedCompany || !newDepartment.name || !newDepartment.description || !newDepartment.managerId) {
      setError('Vennligst fyll ut alle påkrevde felter');
      return;
    }

    setCreating(true);
    setError(null);
    try {
      const manager = users.find(u => u.id === newDepartment.managerId);
      if (!manager) {
        setError('Valgt manager finnes ikke');
        return;
      }

      const departmentData: Omit<Department, 'id'> = {
        name: newDepartment.name,
        description: newDepartment.description,
        manager: `${manager.firstName} ${manager.lastName}`,
        managerId: newDepartment.managerId,
        employeeCount: 0,
        isActive: true,
        createdAt: new Date(),
        companyId: selectedCompany.id,
        color: newDepartment.color,
        budget: newDepartment.budget
      };

      await FirebaseService.createDepartment(departmentData);
      
      setShowCreate(false);
      setNewDepartment({
        name: '',
        description: '',
        manager: '',
        managerId: '',
        color: '#3c8dbc',
        budget: 0
      });
      
      // Refresh data
      await fetchData();
      
      alert('Avdeling opprettet');
    } catch (err) {
      console.error('Error creating department:', err);
      setError('Feil ved opprettelse av avdeling. Prøv igjen.');
    } finally {
      setCreating(false);
    }
  }

  async function handleEdit() {
    if (!selected) return;
    
    setUpdating(true);
    setError(null);
    try {
      const manager = users.find(u => u.id === selected.managerId);
      if (!manager) {
        setError('Valgt manager finnes ikke');
        return;
      }

      await FirebaseService.updateDepartment(selected.id, {
        name: selected.name,
        description: selected.description,
        manager: `${manager.firstName} ${manager.lastName}`,
        managerId: selected.managerId,
        employeeCount: selected.employeeCount,
        isActive: selected.isActive,
        color: selected.color,
        budget: selected.budget
      });
      
      setEditMode(false);
      
      // Refresh data
      await fetchData();
      
      alert('Avdeling oppdatert');
    } catch (err) {
      console.error('Error updating department:', err);
      setError('Feil ved oppdatering av avdeling. Prøv igjen.');
    } finally {
      setUpdating(false);
    }
  }

  async function handleDelete() {
    if (!selected) return;
    
    if (!confirm(`Er du sikker på at du vil slette avdelingen "${selected.name}"?`)) {
      return;
    }
    
    setDeleting(true);
    setError(null);
    try {
      await FirebaseService.deleteDepartment(selected.id);
      setSelected(null);
      
      // Refresh data
      await fetchData();
      
      alert('Avdeling slettet');
    } catch (err) {
      console.error('Error deleting department:', err);
      setError('Feil ved sletting av avdeling. Prøv igjen.');
    } finally {
      setDeleting(false);
    }
  }

  const filteredDepartments = departments.filter(department =>
    department.name.toLowerCase().includes(search.toLowerCase()) ||
    department.description.toLowerCase().includes(search.toLowerCase()) ||
    department.manager.toLowerCase().includes(search.toLowerCase())
  );

  const managerOptions = users.filter(user => 
    user.role === 'manager' || user.role === 'admin'
  );

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '20px' 
      }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#3c8dbc' }}>
            <i className="fas fa-building" style={{ marginRight: '10px' }}></i>
            Avdelinger ({departments.length})
          </h1>
          <p style={{ color: '#666', marginTop: '5px' }}>Administrer avdelinger og organisasjonsstruktur</p>
        </div>
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
          Ny avdeling
        </button>
      </div>

      {error && (
        <div style={{
          backgroundColor: '#f8d7da',
          color: '#721c24',
          padding: '12px',
          borderRadius: '4px',
          marginBottom: '20px',
          border: '1px solid #f5c6cb'
        }}>
          <i className="fas fa-exclamation-triangle" style={{ marginRight: '8px' }}></i>
          {error}
        </div>
      )}

      <div style={{ 
        display: 'flex', 
        gap: '10px', 
        marginBottom: '20px',
        flexWrap: 'wrap'
      }}>
        <input
          type="text"
          placeholder="Søk etter avdeling..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            padding: '8px 12px',
            border: '1px solid #ddd',
            borderRadius: '4px',
            minWidth: '300px'
          }}
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '20px' }}>
        {loading ? (
          <div style={{ 
            gridColumn: '1 / -1', 
            textAlign: 'center', 
            padding: '40px', 
            color: '#666' 
          }}>
            <i className="fas fa-spinner fa-spin" style={{ marginRight: '8px' }}></i>
            Laster avdelinger...
          </div>
        ) : filteredDepartments.length === 0 ? (
          <div style={{ 
            gridColumn: '1 / -1', 
            textAlign: 'center', 
            padding: '40px', 
            color: '#666' 
          }}>
            {search ? 'Ingen avdelinger funnet med søkeordet' : 'Ingen avdelinger funnet'}
          </div>
        ) : filteredDepartments.map((department) => (
          <div
            key={department.id}
            style={{
              backgroundColor: 'white',
              borderRadius: '8px',
              border: '1px solid #ddd',
              padding: '20px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              transition: 'box-shadow 0.2s',
              cursor: 'pointer'
            }}
            onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.15)'}
            onMouseLeave={(e) => e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)'}
            onClick={() => { setSelected(department); setEditMode(false); }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' }}>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '5px' }}>{department.name}</h3>
                <p style={{ fontSize: '14px', color: '#666', margin: 0 }}>{department.description}</p>
              </div>
              <button
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#666',
                  cursor: 'pointer',
                  fontSize: '16px'
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelected(department);
                  setEditMode(false);
                }}
              >
                <i className="fas fa-ellipsis-v"></i>
              </button>
            </div>

            <div style={{ marginBottom: '15px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '14px', color: '#666' }}>Manager:</span>
                <span style={{ fontSize: '14px', fontWeight: 'bold' }}>{department.manager}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '14px', color: '#666' }}>Ansatte:</span>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <i className="fas fa-users" style={{ fontSize: '12px', color: '#666', marginRight: '5px' }}></i>
                  <span style={{ fontSize: '14px', fontWeight: 'bold' }}>{department.employeeCount}</span>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '14px', color: '#666' }}>Budsjett:</span>
                <span style={{ fontSize: '14px', fontWeight: 'bold' }}>
                  {department.budget ? `kr ${department.budget.toLocaleString('nb-NO')}` : 'Ikke satt'}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '14px', color: '#666' }}>Status:</span>
                <span style={{
                  padding: '4px 8px',
                  borderRadius: '4px',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  backgroundColor: department.isActive ? '#d4edda' : '#f8d7da',
                  color: department.isActive ? '#155724' : '#721c24'
                }}>
                  {department.isActive ? 'Aktiv' : 'Inaktiv'}
                </span>
              </div>
            </div>

            <div style={{ borderTop: '1px solid #eee', paddingTop: '15px' }}>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    color: '#3c8dbc',
                    border: '1px solid #3c8dbc',
                    backgroundColor: 'white',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8f9fa'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelected(department);
                    setEditMode(true);
                  }}
                >
                  Rediger
                </button>
                <button
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    color: '#666',
                    border: '1px solid #ddd',
                    backgroundColor: 'white',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8f9fa'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
                  onClick={(e) => {
                    e.stopPropagation();
                    const departmentUsers = users.filter(u => u.department === department.name);
                    alert(`${department.name} har ${departmentUsers.length} ansatte:\n${departmentUsers.map(u => `• ${u.firstName} ${u.lastName}`).join('\n')}`);
                  }}
                >
                  Se ansatte
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Create Department Modal */}
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
              <h2 style={{ fontSize: '20px', fontWeight: 'bold' }}>Ny avdeling</h2>
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
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Navn *</label>
              <input
                type="text"
                value={newDepartment.name}
                onChange={(e) => setNewDepartment({ ...newDepartment, name: e.target.value })}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ddd',
                  borderRadius: '4px'
                }}
                placeholder="Avdelingsnavn"
              />
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Beskrivelse *</label>
              <textarea
                value={newDepartment.description}
                onChange={(e) => setNewDepartment({ ...newDepartment, description: e.target.value })}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  minHeight: '80px',
                  resize: 'vertical'
                }}
                placeholder="Beskrivelse av avdelingen..."
              />
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Manager *</label>
              <select
                value={newDepartment.managerId}
                onChange={(e) => setNewDepartment({ ...newDepartment, managerId: e.target.value })}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ddd',
                  borderRadius: '4px'
                }}
              >
                <option value="">Velg manager</option>
                {managerOptions.map(user => (
                  <option key={user.id} value={user.id}>
                    {user.firstName} {user.lastName} ({user.role})
                  </option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Farge</label>
              <input
                type="color"
                value={newDepartment.color}
                onChange={(e) => setNewDepartment({ ...newDepartment, color: e.target.value })}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  height: '40px'
                }}
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Budsjett (kr)</label>
              <input
                type="number"
                value={newDepartment.budget}
                onChange={(e) => setNewDepartment({ ...newDepartment, budget: parseInt(e.target.value) || 0 })}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ddd',
                  borderRadius: '4px'
                }}
                placeholder="0"
              />
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowCreate(false)}
                disabled={creating}
                style={{
                  padding: '10px 20px',
                  border: '1px solid #ddd',
                  backgroundColor: 'white',
                  borderRadius: '4px',
                  cursor: creating ? 'not-allowed' : 'pointer',
                  opacity: creating ? 0.6 : 1
                }}
              >
                Avbryt
              </button>
              <button
                onClick={handleCreate}
                disabled={creating}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#3c8dbc',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: creating ? 'not-allowed' : 'pointer',
                  fontWeight: 'bold',
                  opacity: creating ? 0.6 : 1
                }}
              >
                {creating ? (
                  <>
                    <i className="fas fa-spinner fa-spin" style={{ marginRight: '8px' }}></i>
                    Oppretter...
                  </>
                ) : (
                  'Opprett'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Department Modal */}
      {selected && (
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
              <h2 style={{ fontSize: '20px', fontWeight: 'bold' }}>
                {editMode ? 'Rediger avdeling' : 'Avdelingsdetaljer'}
              </h2>
              <button
                onClick={() => setSelected(null)}
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
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Navn</label>
              <input
                type="text"
                value={selected.name}
                disabled={!editMode}
                onChange={(e) => setSelected({ ...selected, name: e.target.value })}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  backgroundColor: editMode ? 'white' : '#f8f9fa'
                }}
              />
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Beskrivelse</label>
              <textarea
                value={selected.description}
                disabled={!editMode}
                onChange={(e) => setSelected({ ...selected, description: e.target.value })}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  minHeight: '80px',
                  resize: 'vertical',
                  backgroundColor: editMode ? 'white' : '#f8f9fa'
                }}
              />
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Manager</label>
              <select
                value={selected.managerId}
                disabled={!editMode}
                onChange={(e) => setSelected({ ...selected, managerId: e.target.value })}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  backgroundColor: editMode ? 'white' : '#f8f9fa'
                }}
              >
                {managerOptions.map(user => (
                  <option key={user.id} value={user.id}>
                    {user.firstName} {user.lastName} ({user.role})
                  </option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Farge</label>
              <input
                type="color"
                value={selected.color || '#3c8dbc'}
                disabled={!editMode}
                onChange={(e) => setSelected({ ...selected, color: e.target.value })}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  height: '40px',
                  backgroundColor: editMode ? 'white' : '#f8f9fa'
                }}
              />
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Status</label>
              <select
                value={selected.isActive ? 'active' : 'inactive'}
                disabled={!editMode}
                onChange={(e) => setSelected({ ...selected, isActive: e.target.value === 'active' })}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  backgroundColor: editMode ? 'white' : '#f8f9fa'
                }}
              >
                <option value="active">Aktiv</option>
                <option value="inactive">Inaktiv</option>
              </select>
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Antall ansatte</label>
              <input
                type="number"
                value={selected.employeeCount}
                disabled={!editMode}
                onChange={(e) => setSelected({ ...selected, employeeCount: parseInt(e.target.value) || 0 })}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  backgroundColor: editMode ? 'white' : '#f8f9fa'
                }}
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Budsjett (kr)</label>
              <input
                type="number"
                value={selected.budget || 0}
                disabled={!editMode}
                onChange={(e) => setSelected({ ...selected, budget: parseInt(e.target.value) || 0 })}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  backgroundColor: editMode ? 'white' : '#f8f9fa'
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              {editMode ? (
                <>
                  <button
                    onClick={() => setEditMode(false)}
                    disabled={updating}
                    style={{
                      padding: '10px 20px',
                      border: '1px solid #ddd',
                      backgroundColor: 'white',
                      borderRadius: '4px',
                      cursor: updating ? 'not-allowed' : 'pointer',
                      opacity: updating ? 0.6 : 1
                    }}
                  >
                    Avbryt
                  </button>
                  <button
                    onClick={handleEdit}
                    disabled={updating}
                    style={{
                      padding: '10px 20px',
                      backgroundColor: '#3c8dbc',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: updating ? 'not-allowed' : 'pointer',
                      fontWeight: 'bold',
                      opacity: updating ? 0.6 : 1
                    }}
                  >
                    {updating ? (
                      <>
                        <i className="fas fa-spinner fa-spin" style={{ marginRight: '8px' }}></i>
                        Lagrer...
                      </>
                    ) : (
                      'Lagre'
                    )}
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setEditMode(true)}
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
                  Rediger
                </button>
              )}
              <button
                onClick={handleDelete}
                disabled={deleting}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#dc3545',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: deleting ? 'not-allowed' : 'pointer',
                  fontWeight: 'bold',
                  opacity: deleting ? 0.6 : 1
                }}
              >
                {deleting ? (
                  <>
                    <i className="fas fa-spinner fa-spin" style={{ marginRight: '8px' }}></i>
                    Sletter...
                  </>
                ) : (
                  'Slett'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 