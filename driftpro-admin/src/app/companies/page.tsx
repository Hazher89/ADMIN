'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Search, 
  Building, 
  Users, 
  MapPin,
  Phone,
  Mail,
  ArrowRight,
  Shield,
  Trash2,
  Plus,
  X,
  Save
} from 'lucide-react';
import { collection, getDocs, addDoc, deleteDoc, doc, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface Company {
  id: string;
  name: string;
  orgNumber: string;
  phone: string;
  email: string;
  adminEmail: string;
  address: string;
  industry: string;
  employeeCount: number;
  status: 'active' | 'inactive' | 'pending';
  createdAt: string;
  updatedAt: string;
  subscriptionPlan: 'basic' | 'premium' | 'enterprise';
  contactPerson: {
    name: string;
    phone: string;
    email: string;
  };
}

export default function CompaniesPage() {
  const router = useRouter();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [companyToDelete, setCompanyToDelete] = useState<Company | null>(null);
  const [deletingCompany, setDeletingCompany] = useState<string | null>(null);
  const [newCompany, setNewCompany] = useState({
    name: '',
    orgNumber: '',
    phone: '',
    email: '',
    adminEmail: '',
    address: '',
    industry: '',
    employeeCount: 0,
    status: 'active' as const,
    subscriptionPlan: 'basic' as const,
    contactPerson: {
      name: '',
      phone: '',
      email: ''
    }
  });

  const loadCompanies = async () => {
    try {
      setLoading(true);
      if (db) {
        const companiesQuery = collection(db, 'companies');
        const snapshot = await getDocs(companiesQuery);
        const companiesData = snapshot.docs.map(doc => ({
          id: doc.id,
          name: doc.data().name || '',
          orgNumber: doc.data().orgNumber || '',
          phone: doc.data().phone || '',
          email: doc.data().email || '',
          adminEmail: doc.data().adminEmail || '',
          address: doc.data().address || '',
          industry: doc.data().industry || '',
          employeeCount: doc.data().employeeCount || 0,
          status: doc.data().status || 'active',
          createdAt: doc.data().createdAt || new Date().toISOString(),
          updatedAt: doc.data().updatedAt || new Date().toISOString(),
          subscriptionPlan: doc.data().subscriptionPlan || 'basic',
          contactPerson: {
            name: doc.data().contactPerson?.name || '',
            phone: doc.data().contactPerson?.phone || '',
            email: doc.data().contactPerson?.email || ''
          }
        })) as Company[];
        
        setCompanies(companiesData);
      } else {
        setCompanies([]);
      }
    } catch (error) {
      console.error('Error loading companies:', error);
      setCompanies([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCompanies();
  }, []);

  const handleCompanySelect = (company: Company) => {
    // Store selected company in localStorage for login page
    localStorage.setItem('selectedCompany', JSON.stringify(company));
    // Redirect to login page
    router.push('/login');
  };

  const handleAddCompany = async () => {
    if (!newCompany.name.trim()) {
      alert('Bedriftsnavn er påkrevd');
      return;
    }

    if (!db) {
      alert('Database ikke tilgjengelig');
      return;
    }

    try {
      // Check if company with same name already exists
      const existingCompanyQuery = query(
        collection(db, 'companies'),
        where('name', '==', newCompany.name.trim())
      );
      const existingCompanySnapshot = await getDocs(existingCompanyQuery);

      if (!existingCompanySnapshot.empty) {
        alert('En bedrift med dette navnet eksisterer allerede');
        return;
      }

      // Create new company
      const companyData = {
        ...newCompany,
        name: newCompany.name.trim(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const docRef = await addDoc(collection(db, 'companies'), companyData);
      
      const createdCompany = {
        id: docRef.id,
        ...companyData
      };

      setCompanies([...companies, createdCompany]);
      setShowAddModal(false);
      setNewCompany({
        name: '',
        orgNumber: '',
        phone: '',
        email: '',
        adminEmail: '',
        address: '',
        industry: '',
        employeeCount: 0,
        status: 'active',
        subscriptionPlan: 'basic',
        contactPerson: {
          name: '',
          phone: '',
          email: ''
        }
      });
      
      alert('Bedrift opprettet!');
    } catch (error) {
      console.error('Error adding company:', error);
      alert('Feil ved opprettelse av bedrift');
    }
  };

  const handleDeleteCompany = (company: Company) => {
    setCompanyToDelete(company);
    setShowDeleteModal(true);
  };

  const confirmDeleteCompany = async () => {
    if (!companyToDelete || !db) {
      return;
    }

    try {
      setDeletingCompany(companyToDelete.id);

      // Delete all users associated with this company
      const usersQuery = query(collection(db, 'users'), where('companyId', '==', companyToDelete.id));
      const usersSnapshot = await getDocs(usersQuery);

      const userDeletePromises = usersSnapshot.docs.map(async (userDoc) => {
        return deleteDoc(doc(db!, 'users', userDoc.id));
      });

      // Delete all documents associated with this company
      const documentsQuery = query(collection(db, 'documents'), where('companyId', '==', companyToDelete.id));
      const documentsSnapshot = await getDocs(documentsQuery);

      const documentDeletePromises = documentsSnapshot.docs.map(async (docDoc) => {
        return deleteDoc(doc(db!, 'documents', docDoc.id));
      });

      // Delete all deviations associated with this company
      const deviationsQuery = query(collection(db, 'deviations'), where('companyId', '==', companyToDelete.id));
      const deviationsSnapshot = await getDocs(deviationsQuery);

      const deviationDeletePromises = deviationsSnapshot.docs.map(async (deviationDoc) => {
        return deleteDoc(doc(db!, 'deviations', deviationDoc.id));
      });

      // Delete all chats associated with this company
      const chatsQuery = query(collection(db, 'chats'), where('companyId', '==', companyToDelete.id));
      const chatsSnapshot = await getDocs(chatsQuery);

      const chatDeletePromises = chatsSnapshot.docs.map(async (chatDoc) => {
        return deleteDoc(doc(db!, 'chats', chatDoc.id));
      });

      // Delete all messages associated with this company
      const messagesQuery = query(collection(db, 'messages'), where('companyId', '==', companyToDelete.id));
      const messagesSnapshot = await getDocs(messagesQuery);

      const messageDeletePromises = messagesSnapshot.docs.map(async (messageDoc) => {
        return deleteDoc(doc(db!, 'messages', messageDoc.id));
      });

      // Delete all absences associated with this company
      const absencesQuery = query(collection(db, 'absences'), where('companyId', '==', companyToDelete.id));
      const absencesSnapshot = await getDocs(absencesQuery);

      const absenceDeletePromises = absencesSnapshot.docs.map(async (absenceDoc) => {
        return deleteDoc(doc(db!, 'absences', absenceDoc.id));
      });

      // Delete all timeclock records associated with this company
      const timeclockQuery = query(collection(db, 'timeclock'), where('companyId', '==', companyToDelete.id));
      const timeclockSnapshot = await getDocs(timeclockQuery);

      const timeclockDeletePromises = timeclockSnapshot.docs.map(async (timeclockDoc) => {
        return deleteDoc(doc(db!, 'timeclock', timeclockDoc.id));
      });

      // Delete all departments associated with this company
      const departmentsQuery = query(collection(db, 'departments'), where('companyId', '==', companyToDelete.id));
      const departmentsSnapshot = await getDocs(departmentsQuery);

      const departmentDeletePromises = departmentsSnapshot.docs.map(async (departmentDoc) => {
        return deleteDoc(doc(db!, 'departments', departmentDoc.id));
      });

      // Execute all delete operations
      await Promise.all([
        ...userDeletePromises,
        ...documentDeletePromises,
        ...deviationDeletePromises,
        ...chatDeletePromises,
        ...messageDeletePromises,
        ...absenceDeletePromises,
        ...timeclockDeletePromises,
        ...departmentDeletePromises
      ]);

      // Finally, delete the company itself
      await deleteDoc(doc(db!, 'companies', companyToDelete.id));
      
      // Update local state
      setCompanies(companies.filter(c => c.id !== companyToDelete.id));
      
      // Close modal and reset state
      setShowDeleteModal(false);
      setCompanyToDelete(null);
      setDeletingCompany(null);
      
      alert(`✅ Bedriften "${companyToDelete.name}" og all tilknyttet data er slettet.`);

    } catch (error) {
      console.error('Error deleting company:', error);
      alert('❌ Feil ved sletting av bedrift: ' + (error instanceof Error ? error.message : 'Ukjent feil'));
    } finally {
      setDeletingCompany(null);
    }
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
            Laster bedrifter...
          </h3>
          <p style={{ 
            color: 'var(--gray-600)',
            fontSize: 'var(--font-size-base)'
          }}>
            Henter bedriftsinformasjon fra databasen
          </p>
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
              <div style={{
                width: '40px',
                height: '40px',
                background: 'var(--gradient-primary)',
                borderRadius: 'var(--radius-lg)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Building style={{ width: '20px', height: '20px', color: 'var(--white)' }} />
              </div>
              <div>
                <h1 style={{ 
                  fontSize: 'var(--font-size-xl)', 
                  fontWeight: '700', 
                  color: 'var(--gray-900)'
                }}>
                  DriftPro
                </h1>
                <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--gray-600)' }}>
                  Admin Panel
                </p>
              </div>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <Link
                href="/"
                style={{
                  color: 'var(--gray-600)',
                  padding: 'var(--space-2) var(--space-4)',
                  borderRadius: 'var(--radius-md)',
                  fontSize: 'var(--font-size-sm)',
                  fontWeight: '500',
                  textDecoration: 'none',
                  transition: 'all var(--transition-normal)'
                }}
              >
                Hjem
              </Link>
              <Link
                href="/brrg-integration"
                style={{
                  color: 'var(--gray-600)',
                  padding: 'var(--space-2) var(--space-4)',
                  borderRadius: 'var(--radius-md)',
                  fontSize: 'var(--font-size-sm)',
                  fontWeight: '500',
                  textDecoration: 'none',
                  transition: 'all var(--transition-normal)'
                }}
              >
                BRRG-integrasjon
              </Link>
              <Link
                href="/help"
                style={{
                  color: 'var(--gray-600)',
                  padding: 'var(--space-2) var(--space-4)',
                  borderRadius: 'var(--radius-md)',
                  fontSize: 'var(--font-size-sm)',
                  fontWeight: '500',
                  textDecoration: 'none',
                  transition: 'all var(--transition-normal)'
                }}
              >
                Hjelp
              </Link>
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
          marginBottom: '3rem' 
        }}>
          <div>
            <h1 style={{
              fontSize: 'var(--font-size-5xl)',
              fontWeight: '700',
              color: 'var(--gray-900)',
              marginBottom: '1rem',
              lineHeight: '1.2'
            }}>
              Bedrifter
            </h1>
            <p style={{
              fontSize: 'var(--font-size-xl)',
              color: 'var(--gray-600)',
              lineHeight: '1.6'
            }}>
              Administrer bedrifter og få tilgang til DriftPro Admin-panelet
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
            <Plus style={{ width: '16px', height: '16px' }} />
            Legg til bedrift
          </button>
        </div>

        {/* Companies List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {companies.map((company) => (
            <div
              key={company.id}
              className="card"
              style={{ 
                transition: 'all var(--transition-normal)',
                cursor: 'pointer'
              }}
              onClick={() => handleCompanySelect(company)}
            >
              {/* Company Header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                <div className="card-icon">
                  <Building />
                </div>
                <div style={{ flex: '1' }}>
                  <h3 style={{
                    fontSize: 'var(--font-size-lg)',
                    fontWeight: '600',
                    color: 'var(--gray-900)',
                    marginBottom: '0.25rem'
                  }}>
                    {company.name}
                  </h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--gray-600)' }}>
                      Org.nr: {company.orgNumber}
                    </span>
                    <span className={`badge ${
                      company.status === 'active' ? 'badge-success' :
                      company.status === 'inactive' ? 'badge-danger' :
                      'badge-warning'
                    }`}>
                      {company.status === 'active' ? 'Aktiv' :
                       company.status === 'inactive' ? 'Inaktiv' : 'Venter'}
                    </span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <Link
                    href="/admin-management"
                    style={{
                      padding: '0.5rem',
                      background: '#8b5cf6',
                      border: 'none',
                      borderRadius: '6px',
                      color: 'white',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.2s ease',
                      textDecoration: 'none',
                      fontSize: 'var(--font-size-sm)'
                    }}
                    title="Administrer admins"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Shield style={{ width: '16px', height: '16px' }} />
                  </Link>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteCompany(company);
                    }}
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
                    title="Slett bedrift"
                  >
                    <Trash2 style={{ width: '16px', height: '16px' }} />
                  </button>
                  <div style={{
                    padding: '0.75rem',
                    background: '#10b981',
                    border: 'none',
                    borderRadius: '8px',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.2s ease'
                  }}>
                    <ArrowRight style={{ width: '20px', height: '20px' }} />
                  </div>
                </div>
              </div>

              {/* Company Details */}
              <div style={{ marginBottom: '1rem' }}>
                {company.address && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <MapPin style={{ width: '16px', height: '16px', color: 'var(--gray-400)' }} />
                    <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--gray-600)' }}>
                      {company.address}
                    </span>
                  </div>
                )}
                {company.employeeCount && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <Users style={{ width: '16px', height: '16px', color: 'var(--gray-400)' }} />
                    <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--gray-600)' }}>
                      {company.employeeCount} ansatte
                    </span>
                  </div>
                )}
                {company.industry && (
                  <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--gray-600)', marginBottom: '0.5rem' }}>
                    {company.industry}
                  </div>
                )}
              </div>

              {/* Contact Info */}
              <div style={{ 
                marginBottom: '1rem',
                padding: '1rem',
                background: 'var(--gray-50)',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--gray-200)'
              }}>
                {company.phone && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <Phone style={{ width: '16px', height: '16px', color: 'var(--primary)' }} />
                    <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--gray-700)', fontWeight: '500' }}>
                      {company.phone}
                    </span>
                  </div>
                )}
                {company.email && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <Mail style={{ width: '16px', height: '16px', color: 'var(--primary)' }} />
                    <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--gray-700)', fontWeight: '500' }}>
                      {company.email}
                    </span>
                  </div>
                )}
                {company.contactPerson?.name && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Users style={{ width: '16px', height: '16px', color: 'var(--primary)' }} />
                    <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--gray-700)', fontWeight: '500' }}>
                      Kontakt: {company.contactPerson.name}
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}

          {companies.length === 0 && (
            <div style={{
              textAlign: 'center',
              padding: '3rem',
              background: 'var(--white)',
              border: '1px solid var(--gray-200)',
              borderRadius: 'var(--radius-lg)'
            }}>
              <Building style={{ 
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
                Ingen bedrifter
              </h3>
              <p style={{ 
                color: 'var(--gray-600)',
                fontSize: 'var(--font-size-base)',
                marginBottom: '1.5rem'
              }}>
                Legg til din første bedrift for å komme i gang
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
                <Plus style={{ width: '16px', height: '16px' }} />
                Legg til bedrift
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ 
          textAlign: 'center', 
          marginTop: '3rem', 
          paddingTop: '2rem', 
          borderTop: '1px solid var(--gray-200)' 
        }}>
          <p style={{ 
            fontSize: 'var(--font-size-base)', 
            color: 'var(--gray-600)',
            marginBottom: '1rem'
          }}>
            Trenger du hjelp?
          </p>
          <a href="/contact" style={{
            color: 'var(--primary)',
            fontWeight: '600',
            textDecoration: 'none',
            padding: 'var(--space-3) var(--space-6)',
            background: 'var(--white)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--gray-300)',
            transition: 'all var(--transition-normal)',
            display: 'inline-block'
          }}>
            Kontakt oss
          </a>
        </div>
      </div>

      {/* Add Company Modal */}
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
                Legg til bedrift
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
                  Bedriftsnavn *
                </label>
                <input
                  type="text"
                  value={newCompany.name}
                  onChange={(e) => setNewCompany({ ...newCompany, name: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid var(--gray-300)',
                    borderRadius: 'var(--radius-md)',
                    fontSize: 'var(--font-size-base)'
                  }}
                  placeholder="Bedriftsnavn"
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: 'var(--gray-700)' }}>
                  Organisasjonsnummer
                </label>
                <input
                  type="text"
                  value={newCompany.orgNumber}
                  onChange={(e) => setNewCompany({ ...newCompany, orgNumber: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid var(--gray-300)',
                    borderRadius: 'var(--radius-md)',
                    fontSize: 'var(--font-size-base)'
                  }}
                  placeholder="123456789"
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: 'var(--gray-700)' }}>
                  Telefon
                </label>
                <input
                  type="text"
                  value={newCompany.phone}
                  onChange={(e) => setNewCompany({ ...newCompany, phone: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid var(--gray-300)',
                    borderRadius: 'var(--radius-md)',
                    fontSize: 'var(--font-size-base)'
                  }}
                  placeholder="+47 123 45 678"
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: 'var(--gray-700)' }}>
                  E-post
                </label>
                <input
                  type="email"
                  value={newCompany.email}
                  onChange={(e) => setNewCompany({ ...newCompany, email: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid var(--gray-300)',
                    borderRadius: 'var(--radius-md)',
                    fontSize: 'var(--font-size-base)'
                  }}
                  placeholder="kontakt@bedrift.no"
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: 'var(--gray-700)' }}>
                  Admin E-post
                </label>
                <input
                  type="email"
                  value={newCompany.adminEmail}
                  onChange={(e) => setNewCompany({ ...newCompany, adminEmail: e.target.value })}
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
                  Adresse
                </label>
                <input
                  type="text"
                  value={newCompany.address}
                  onChange={(e) => setNewCompany({ ...newCompany, address: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid var(--gray-300)',
                    borderRadius: 'var(--radius-md)',
                    fontSize: 'var(--font-size-base)'
                  }}
                  placeholder="Bedriftsadresse"
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: 'var(--gray-700)' }}>
                  Bransje
                </label>
                <input
                  type="text"
                  value={newCompany.industry}
                  onChange={(e) => setNewCompany({ ...newCompany, industry: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid var(--gray-300)',
                    borderRadius: 'var(--radius-md)',
                    fontSize: 'var(--font-size-base)'
                  }}
                  placeholder="Bransje"
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: 'var(--gray-700)' }}>
                  Antall ansatte
                </label>
                <input
                  type="number"
                  value={newCompany.employeeCount}
                  onChange={(e) => setNewCompany({ ...newCompany, employeeCount: parseInt(e.target.value) || 0 })}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid var(--gray-300)',
                    borderRadius: 'var(--radius-md)',
                    fontSize: 'var(--font-size-base)'
                  }}
                  placeholder="0"
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
              <button
                onClick={handleAddCompany}
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
                <Plus style={{ width: '16px', height: '16px', marginRight: '0.5rem' }} />
                Legg til bedrift
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

      {/* Delete Company Modal */}
      {showDeleteModal && companyToDelete && (
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
                <Trash2 style={{ width: '32px', height: '32px', color: 'var(--white)' }} />
              </div>
              <h2 style={{ fontSize: 'var(--font-size-xl)', fontWeight: '600', color: 'var(--gray-900)', marginBottom: '1rem' }}>
                Slett bedrift
              </h2>
              <p style={{ color: 'var(--gray-600)', fontSize: 'var(--font-size-base)', lineHeight: '1.5' }}>
                Er du sikker på at du vil slette <strong>{companyToDelete.name}</strong>?
              </p>
              <p style={{ color: 'var(--danger)', fontSize: 'var(--font-size-sm)', marginTop: '1rem', fontWeight: '500' }}>
                ⚠️ Dette vil også slette alle brukere, dokumenter, avvik, chat-meldinger og annen data tilknyttet denne bedriften.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '1rem' }}>
              <button
                onClick={confirmDeleteCompany}
                disabled={deletingCompany === companyToDelete.id}
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  background: 'var(--danger)',
                  color: 'var(--white)',
                  border: 'none',
                  borderRadius: 'var(--radius-md)',
                  fontSize: 'var(--font-size-base)',
                  fontWeight: '500',
                  cursor: deletingCompany === companyToDelete.id ? 'not-allowed' : 'pointer',
                  opacity: deletingCompany === companyToDelete.id ? 0.6 : 1
                }}
              >
                {deletingCompany === companyToDelete.id ? (
                  <>
                    <div className="loading" style={{ width: '16px', height: '16px', marginRight: '0.5rem' }}></div>
                    Sletter...
                  </>
                ) : (
                  <>
                    <Trash2 style={{ width: '16px', height: '16px', marginRight: '0.5rem' }} />
                    Ja, slett bedrift
                  </>
                )}
              </button>
              <button
                onClick={() => setShowDeleteModal(false)}
                disabled={deletingCompany === companyToDelete.id}
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  background: 'var(--gray-200)',
                  color: 'var(--gray-700)',
                  border: 'none',
                  borderRadius: 'var(--radius-md)',
                  fontSize: 'var(--font-size-base)',
                  fontWeight: '500',
                  cursor: deletingCompany === companyToDelete.id ? 'not-allowed' : 'pointer'
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