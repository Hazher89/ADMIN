'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Users, 
  UserPlus, 
  UserMinus, 
  Edit, 
  Trash2, 
  Shield, 
  Building,
  ArrowLeft,
  Plus,
  X,
  Save,
  Check,
  AlertCircle
} from 'lucide-react';
import { brrgService, BRRGAdmin } from '@/lib/brrg-service';

interface AdminFormData {
  email: string;
  name: string;
  role: 'admin' | 'super_admin';
  permissions: string[];
}

const availablePermissions = [
  'manage_users',
  'manage_documents',
  'manage_deviations',
  'manage_reports',
  'manage_settings',
  'view_analytics',
  'manage_admins'
];

export default function AdminManagementPage() {
  const router = useRouter();
  const [admins, setAdmins] = useState<BRRGAdmin[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState<BRRGAdmin | null>(null);
  const [formData, setFormData] = useState<AdminFormData>({
    email: '',
    name: '',
    role: 'admin',
    permissions: []
  });
  const [companyId, setCompanyId] = useState<string>('');
  const [companyName, setCompanyName] = useState<string>(''); // Add company name state

  useEffect(() => {
    // Get company ID from localStorage
    const selectedCompany = localStorage.getItem('selectedCompany');
    if (selectedCompany) {
      const company = JSON.parse(selectedCompany);
      setCompanyId(company.id);
      setCompanyName(company.name); // Set company name
      loadAdmins(company.id);
    }
  }, []);

  const loadAdmins = async (companyId: string) => {
    try {
      setLoading(true);
      const adminsData = await brrgService.getAdmins(companyId);
      setAdmins(adminsData);
    } catch (error: any) {
      console.error('Error loading admins:', error);
      alert('Feil ved lasting av admins: ' + (error.message || 'Ukjent feil'));
      setAdmins([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddAdmin = async () => {
    if (!formData.email || !formData.name) {
      alert('Vennligst fyll ut alle påkrevde felter');
      return;
    }

    try {
      const newAdmin = await brrgService.addAdmin({
        email: formData.email,
        name: formData.name,
        role: formData.role,
        companyId: companyId,
        companyName: companyName, // Add company name
        permissions: formData.permissions
      });

      if (newAdmin) {
        setAdmins([...admins, newAdmin]);
        setShowAddModal(false);
        setFormData({ email: '', name: '', role: 'admin', permissions: [] });
        alert('Admin lagt til! En e-post med passordoppsett er sendt.');
      } else {
        alert('Feil ved å legge til admin');
      }
    } catch (error: any) {
      console.error('Error adding admin:', error);
      
      // Handle specific error messages from the API
      if (error.message && error.message.includes('allerede admin')) {
        alert('Bruker er allerede admin for denne bedriften');
      } else if (error.message && error.message.includes('duplicate')) {
        alert('En bruker med denne e-postadressen eksisterer allerede');
      } else {
        alert('Feil ved å legge til admin: ' + (error.message || 'Ukjent feil'));
      }
    }
  };

  const handleUpdateAdmin = async () => {
    if (!selectedAdmin) return;

    try {
      const updatedAdmin = await brrgService.updateAdmin(selectedAdmin.id, {
        name: formData.name,
        role: formData.role,
        permissions: formData.permissions
      });

      if (updatedAdmin) {
        setAdmins(admins.map(admin => 
          admin.id === selectedAdmin.id ? updatedAdmin : admin
        ));
        setShowEditModal(false);
        setSelectedAdmin(null);
        setFormData({ email: '', name: '', role: 'admin', permissions: [] });
        alert('Admin oppdatert!');
      } else {
        alert('Feil ved å oppdatere admin');
      }
    } catch (error: any) {
      console.error('Error updating admin:', error);
      alert('Feil ved å oppdatere admin: ' + (error.message || 'Ukjent feil'));
    }
  };

  const handleDeleteAdmin = async () => {
    if (!selectedAdmin) return;

    try {
      const success = await brrgService.removeAdmin(selectedAdmin.id);
      
      if (success) {
        setAdmins(admins.filter(admin => admin.id !== selectedAdmin.id));
        setShowDeleteModal(false);
        setSelectedAdmin(null);
        alert('Admin fjernet!');
      } else {
        alert('Feil ved å fjerne admin');
      }
    } catch (error: any) {
      console.error('Error removing admin:', error);
      alert('Feil ved å fjerne admin: ' + (error.message || 'Ukjent feil'));
    }
  };

  const openEditModal = (admin: BRRGAdmin) => {
    setSelectedAdmin(admin);
    setFormData({
      email: admin.email,
      name: admin.name,
      role: admin.role,
      permissions: admin.permissions
    });
    setShowEditModal(true);
  };

  const openDeleteModal = (admin: BRRGAdmin) => {
    setSelectedAdmin(admin);
    setShowDeleteModal(true);
  };

  const togglePermission = (permission: string) => {
    setFormData(prev => ({
      ...prev,
      permissions: prev.permissions.includes(permission)
        ? prev.permissions.filter(p => p !== permission)
        : [...prev.permissions, permission]
    }));
  };

  const getPermissionLabel = (permission: string) => {
    const labels: { [key: string]: string } = {
      'manage_users': 'Administrer brukere',
      'manage_documents': 'Administrer dokumenter',
      'manage_deviations': 'Administrer avvik',
      'manage_reports': 'Administrer rapporter',
      'manage_settings': 'Administrer innstillinger',
      'view_analytics': 'Se analyser',
      'manage_admins': 'Administrer admins'
    };
    return labels[permission] || permission;
  };

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'var(--gray-50)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div className="loading" style={{ margin: '0 auto 2rem' }}></div>
          <h3 style={{ 
            fontSize: 'var(--font-size-xl)', 
            fontWeight: '600', 
            color: 'var(--gray-900)', 
            marginBottom: '0.5rem' 
          }}>
            Laster admins...
          </h3>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--gray-50)'
    }}>
      {/* Navigation */}
      <nav style={{
        background: 'var(--white)',
        borderBottom: '1px solid var(--gray-200)',
        position: 'sticky',
        top: 0,
        zIndex: 50,
        boxShadow: 'var(--shadow-sm)'
      }}>
        <div style={{
          maxWidth: '1280px',
          margin: '0 auto',
          padding: '0 var(--space-6)'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            height: '4rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <Link href="/companies" style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                color: 'var(--gray-600)',
                textDecoration: 'none',
                fontSize: 'var(--font-size-sm)',
                fontWeight: '500'
              }}>
                <ArrowLeft style={{ width: '16px', height: '16px' }} />
                Tilbake
              </Link>
              <div style={{
                width: '40px',
                height: '40px',
                background: 'var(--gradient-primary)',
                borderRadius: 'var(--radius-lg)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Shield style={{ width: '20px', height: '20px', color: 'var(--white)' }} />
              </div>
              <div>
                <h1 style={{ 
                  fontSize: 'var(--font-size-xl)', 
                  fontWeight: '700', 
                  color: 'var(--gray-900)'
                }}>
                  Admin-administrasjon
                </h1>
                <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--gray-600)' }}>
                  Administrer admin-brukere for bedriften
                </p>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div style={{
        maxWidth: '1280px',
        margin: '0 auto',
        padding: '3rem 1.5rem'
      }}>
        {/* Header */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          marginBottom: '2rem' 
        }}>
          <div>
            <h2 style={{
              fontSize: 'var(--font-size-2xl)',
              fontWeight: '600',
              color: 'var(--gray-900)',
              marginBottom: '0.5rem'
            }}>
              Admin-brukere
            </h2>
            <p style={{
              fontSize: 'var(--font-size-base)',
              color: 'var(--gray-600)'
            }}>
              Administrer hvem som har admin-tilgang til systemet
            </p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.75rem 1.5rem',
              background: 'var(--primary)',
              color: 'var(--white)',
              border: 'none',
              borderRadius: 'var(--radius-lg)',
              fontSize: 'var(--font-size-base)',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all var(--transition-normal)'
            }}
          >
            <UserPlus style={{ width: '16px', height: '16px' }} />
            Legg til admin
          </button>
        </div>

        {/* Admins List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {admins.map((admin) => (
            <div
              key={admin.id}
              style={{
                background: 'var(--white)',
                border: '1px solid var(--gray-200)',
                borderRadius: 'var(--radius-lg)',
                padding: '1.5rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <div style={{ flex: '1' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    background: admin.role === 'super_admin' ? '#dc2626' : '#3b82f6',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Shield style={{ width: '20px', height: '20px', color: 'var(--white)' }} />
                  </div>
                  <div>
                    <h3 style={{
                      fontSize: 'var(--font-size-lg)',
                      fontWeight: '600',
                      color: 'var(--gray-900)',
                      marginBottom: '0.25rem'
                    }}>
                      {admin.name}
                    </h3>
                    <p style={{
                      fontSize: 'var(--font-size-sm)',
                      color: 'var(--gray-600)',
                      marginBottom: '0.25rem'
                    }}>
                      {admin.email}
                    </p>
                    <span style={{
                      fontSize: 'var(--font-size-xs)',
                      padding: '0.25rem 0.5rem',
                      background: admin.role === 'super_admin' ? '#fef2f2' : '#eff6ff',
                      color: admin.role === 'super_admin' ? '#dc2626' : '#3b82f6',
                      borderRadius: 'var(--radius-md)',
                      fontWeight: '500'
                    }}>
                      {admin.role === 'super_admin' ? 'Super Admin' : 'Admin'}
                    </span>
                  </div>
                </div>
                
                {/* Permissions */}
                <div style={{ marginTop: '1rem' }}>
                  <p style={{
                    fontSize: 'var(--font-size-sm)',
                    color: 'var(--gray-600)',
                    marginBottom: '0.5rem'
                  }}>
                    Tillatelser:
                  </p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                    {admin.permissions.map((permission) => (
                      <span
                        key={permission}
                        style={{
                          fontSize: 'var(--font-size-xs)',
                          padding: '0.25rem 0.5rem',
                          background: 'var(--gray-100)',
                          color: 'var(--gray-700)',
                          borderRadius: 'var(--radius-md)',
                          border: '1px solid var(--gray-200)'
                        }}
                      >
                        {getPermissionLabel(permission)}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  onClick={() => openEditModal(admin)}
                  style={{
                    padding: '0.5rem',
                    background: '#3b82f6',
                    border: 'none',
                    borderRadius: '6px',
                    color: 'white',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.2s ease'
                  }}
                  title="Rediger admin"
                >
                  <Edit style={{ width: '16px', height: '16px' }} />
                </button>
                <button
                  onClick={() => openDeleteModal(admin)}
                  style={{
                    padding: '0.5rem',
                    background: '#dc2626',
                    border: 'none',
                    borderRadius: '6px',
                    color: 'white',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.2s ease'
                  }}
                  title="Fjern admin"
                >
                  <Trash2 style={{ width: '16px', height: '16px' }} />
                </button>
              </div>
            </div>
          ))}

          {admins.length === 0 && (
            <div style={{
              textAlign: 'center',
              padding: '3rem',
              background: 'var(--white)',
              border: '1px solid var(--gray-200)',
              borderRadius: 'var(--radius-lg)'
            }}>
              <Users style={{ 
                width: '64px', 
                height: '64px', 
                color: 'var(--gray-300)', 
                margin: '0 auto 1rem' 
              }} />
              <h3 style={{ 
                fontSize: 'var(--font-size-lg)', 
                fontWeight: '600', 
                color: 'var(--gray-900)', 
                marginBottom: '0.5rem' 
              }}>
                Ingen admin-brukere
              </h3>
              <p style={{ 
                color: 'var(--gray-600)',
                fontSize: 'var(--font-size-base)',
                marginBottom: '1.5rem'
              }}>
                Legg til din første admin-bruker for å komme i gang
              </p>
              <button
                onClick={() => setShowAddModal(true)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.75rem 1.5rem',
                  background: 'var(--primary)',
                  color: 'var(--white)',
                  border: 'none',
                  borderRadius: 'var(--radius-lg)',
                  fontSize: 'var(--font-size-base)',
                  fontWeight: '500',
                  cursor: 'pointer',
                  margin: '0 auto'
                }}
              >
                <UserPlus style={{ width: '16px', height: '16px' }} />
                Legg til admin
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Add Admin Modal */}
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
          zIndex: 1000
        }}>
          <div style={{
            background: 'var(--white)',
            borderRadius: 'var(--radius-lg)',
            padding: '2rem',
            maxWidth: '600px',
            width: '90%',
            maxHeight: '90vh',
            overflow: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: 'var(--font-size-xl)', fontWeight: '600', color: 'var(--gray-900)' }}>
                Legg til admin
              </h2>
              <button
                onClick={() => setShowAddModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '0.5rem'
                }}
              >
                <X style={{ width: '20px', height: '20px', color: 'var(--gray-400)' }} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: 'var(--gray-700)' }}>
                  E-post *
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid var(--gray-300)',
                    borderRadius: 'var(--radius-md)',
                    fontSize: 'var(--font-size-base)'
                  }}
                  placeholder="admin@bedrift.no"
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: 'var(--gray-700)' }}>
                  Navn *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid var(--gray-300)',
                    borderRadius: 'var(--radius-md)',
                    fontSize: 'var(--font-size-base)'
                  }}
                  placeholder="Admin Navn"
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: 'var(--gray-700)' }}>
                  Rolle
                </label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as 'admin' | 'super_admin' })}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid var(--gray-300)',
                    borderRadius: 'var(--radius-md)',
                    fontSize: 'var(--font-size-base)'
                  }}
                >
                  <option value="admin">Admin</option>
                  <option value="super_admin">Super Admin</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: 'var(--gray-700)' }}>
                  Tillatelser
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {availablePermissions.map((permission) => (
                    <label key={permission} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <input
                        type="checkbox"
                        checked={formData.permissions.includes(permission)}
                        onChange={() => togglePermission(permission)}
                        style={{ width: '16px', height: '16px' }}
                      />
                      <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--gray-700)' }}>
                        {getPermissionLabel(permission)}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
              <button
                onClick={handleAddAdmin}
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  background: 'var(--primary)',
                  color: 'var(--white)',
                  border: 'none',
                  borderRadius: 'var(--radius-md)',
                  fontSize: 'var(--font-size-base)',
                  fontWeight: '500',
                  cursor: 'pointer'
                }}
              >
                <UserPlus style={{ width: '16px', height: '16px', marginRight: '0.5rem' }} />
                Legg til admin
              </button>
              <button
                onClick={() => setShowAddModal(false)}
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  background: 'var(--gray-200)',
                  color: 'var(--gray-700)',
                  border: 'none',
                  borderRadius: 'var(--radius-md)',
                  fontSize: 'var(--font-size-base)',
                  fontWeight: '500',
                  cursor: 'pointer'
                }}
              >
                Avbryt
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Admin Modal */}
      {showEditModal && selectedAdmin && (
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
            borderRadius: 'var(--radius-lg)',
            padding: '2rem',
            maxWidth: '600px',
            width: '90%',
            maxHeight: '90vh',
            overflow: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: 'var(--font-size-xl)', fontWeight: '600', color: 'var(--gray-900)' }}>
                Rediger admin
              </h2>
              <button
                onClick={() => setShowEditModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '0.5rem'
                }}
              >
                <X style={{ width: '20px', height: '20px', color: 'var(--gray-400)' }} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: 'var(--gray-700)' }}>
                  E-post
                </label>
                <input
                  type="email"
                  value={formData.email}
                  disabled
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid var(--gray-300)',
                    borderRadius: 'var(--radius-md)',
                    fontSize: 'var(--font-size-base)',
                    background: 'var(--gray-100)',
                    color: 'var(--gray-500)'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: 'var(--gray-700)' }}>
                  Navn *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid var(--gray-300)',
                    borderRadius: 'var(--radius-md)',
                    fontSize: 'var(--font-size-base)'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: 'var(--gray-700)' }}>
                  Rolle
                </label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as 'admin' | 'super_admin' })}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid var(--gray-300)',
                    borderRadius: 'var(--radius-md)',
                    fontSize: 'var(--font-size-base)'
                  }}
                >
                  <option value="admin">Admin</option>
                  <option value="super_admin">Super Admin</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: 'var(--gray-700)' }}>
                  Tillatelser
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {availablePermissions.map((permission) => (
                    <label key={permission} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <input
                        type="checkbox"
                        checked={formData.permissions.includes(permission)}
                        onChange={() => togglePermission(permission)}
                        style={{ width: '16px', height: '16px' }}
                      />
                      <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--gray-700)' }}>
                        {getPermissionLabel(permission)}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
              <button
                onClick={handleUpdateAdmin}
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  background: 'var(--primary)',
                  color: 'var(--white)',
                  border: 'none',
                  borderRadius: 'var(--radius-md)',
                  fontSize: 'var(--font-size-base)',
                  fontWeight: '500',
                  cursor: 'pointer'
                }}
              >
                <Save style={{ width: '16px', height: '16px', marginRight: '0.5rem' }} />
                Lagre endringer
              </button>
              <button
                onClick={() => setShowEditModal(false)}
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  background: 'var(--gray-200)',
                  color: 'var(--gray-700)',
                  border: 'none',
                  borderRadius: 'var(--radius-md)',
                  fontSize: 'var(--font-size-base)',
                  fontWeight: '500',
                  cursor: 'pointer'
                }}
              >
                Avbryt
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Admin Modal */}
      {showDeleteModal && selectedAdmin && (
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
            borderRadius: 'var(--radius-lg)',
            padding: '2rem',
            maxWidth: '500px',
            width: '90%'
          }}>
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
              <div style={{
                width: '64px',
                height: '64px',
                background: 'var(--danger)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1rem'
              }}>
                <UserMinus style={{ width: '32px', height: '32px', color: 'var(--white)' }} />
              </div>
              <h2 style={{ fontSize: 'var(--font-size-xl)', fontWeight: '600', color: 'var(--gray-900)', marginBottom: '1rem' }}>
                Fjern admin
              </h2>
              <p style={{ color: 'var(--gray-600)', fontSize: 'var(--font-size-base)', lineHeight: '1.5' }}>
                Er du sikker på at du vil fjerne <strong>{selectedAdmin.name}</strong> som admin?
              </p>
              <p style={{ color: 'var(--danger)', fontSize: 'var(--font-size-sm)', marginTop: '1rem', fontWeight: '500' }}>
                ⚠️ Dette vil fjerne alle admin-tillatelser for denne brukeren.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '1rem' }}>
              <button
                onClick={handleDeleteAdmin}
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  background: 'var(--danger)',
                  color: 'var(--white)',
                  border: 'none',
                  borderRadius: 'var(--radius-md)',
                  fontSize: 'var(--font-size-base)',
                  fontWeight: '500',
                  cursor: 'pointer'
                }}
              >
                <UserMinus style={{ width: '16px', height: '16px', marginRight: '0.5rem' }} />
                Ja, fjern admin
              </button>
              <button
                onClick={() => setShowDeleteModal(false)}
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  background: 'var(--gray-200)',
                  color: 'var(--gray-700)',
                  border: 'none',
                  borderRadius: 'var(--radius-md)',
                  fontSize: 'var(--font-size-base)',
                  fontWeight: '500',
                  cursor: 'pointer'
                }}
              >
                Avbryt
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 