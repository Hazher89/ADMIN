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
  Edit,
  Trash2,
  Plus,
  X,
  Save
} from 'lucide-react';
import { collection, getDocs, deleteDoc, doc, updateDoc, addDoc, query, where } from 'firebase/firestore';
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
  const [searchTerm, setSearchTerm] = useState('');
  const [companies, setCompanies] = useState<Company[]>([]);
  const [filteredCompanies, setFilteredCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [deletingCompany, setDeletingCompany] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [companyToDelete, setCompanyToDelete] = useState<Company | null>(null);

  // Debug state changes
  useEffect(() => {
    console.log('🔍 STATE DEBUG: showDeleteModal:', showDeleteModal);
    console.log('🔍 STATE DEBUG: companyToDelete:', companyToDelete);
  }, [showDeleteModal, companyToDelete]);

  useEffect(() => {
    console.log('🔍 STATE DEBUG: showEditModal:', showEditModal);
    console.log('🔍 STATE DEBUG: editingCompany:', editingCompany);
  }, [showEditModal, editingCompany]);

  const loadCompanies = async () => {
    try {
      setLoading(true);
      if (db) {
        // Fetch ALL companies from Firebase (no status filter)
        const companiesQuery = collection(db, 'companies');
        const snapshot = await getDocs(companiesQuery);
        const companiesData = snapshot.docs.map(doc => ({
          id: doc.id,
          // Ensure all fields have default values to prevent undefined errors
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
        
        // Check for duplicates
        const duplicateNames = companiesData.filter((company, index, self) => 
          self.findIndex(c => c.name === company.name) !== index
        );
        
        if (duplicateNames.length > 0) {
          console.warn('⚠️ DUPLICATE COMPANIES FOUND:', duplicateNames);
          console.warn('Companies with same name:', duplicateNames.map(c => ({ name: c.name, id: c.id, orgNumber: c.orgNumber })));
          
          // Remove duplicates - keep the first occurrence of each company name
          const uniqueCompanies = companiesData.filter((company, index, self) => 
            self.findIndex(c => c.name === company.name) === index
          );
          
          console.log('Removed duplicates, unique companies:', uniqueCompanies.length);
          setCompanies(uniqueCompanies);
        } else {
          setCompanies(companiesData);
        }
        console.log('Loaded companies from Firebase:', companiesData);
        console.log('Total companies loaded:', companiesData.length);
      } else {
        console.log('Firebase not available');
        setCompanies([]);
      }
    } catch (error) {
      console.error('Error loading companies:', error);
      setCompanies([]);
    } finally {
      setLoading(false);
    }
  };

  // Auto-search when searchTerm changes
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredCompanies([]);
      return;
    }

    setSearching(true);
    
    // Simulate a small delay for better UX
    const timeoutId = setTimeout(() => {
      try {
        const filtered = companies.filter(company => 
          company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          company.orgNumber.includes(searchTerm) ||
          company.adminEmail.toLowerCase().includes(searchTerm.toLowerCase())
        );
        setFilteredCompanies(filtered);
      } catch (error) {
        console.error('Error searching companies:', error);
      } finally {
        setSearching(false);
      }
    }, 300); // 300ms delay

    return () => clearTimeout(timeoutId);
  }, [searchTerm, companies]);

  useEffect(() => {
    loadCompanies();
  }, []);

  const handleCompanySelect = (company: Company) => {
    console.log('🎯 COMPANY SELECTED:', company.name, 'ID:', company.id);
    // Store selected company in localStorage for login page
    localStorage.setItem('selectedCompany', JSON.stringify(company));
    // Redirect to login page
    router.push('/login');
  };

  const handleEditCompany = (company: Company, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('✏️ EDIT BUTTON CLICKED for company:', company.name, 'ID:', company.id);
    console.log('✏️ Event details:', e);
    setEditingCompany({ ...company });
    setShowEditModal(true);
    console.log('✏️ Edit modal should now be visible');
  };

  const handleDeleteCompany = (company: Company, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('🗑️ DELETE BUTTON CLICKED for company:', company.name, 'ID:', company.id);
    console.log('🗑️ Event details:', e);
    setCompanyToDelete(company);
    setShowDeleteModal(true);
    console.log('🗑️ Delete modal should now be visible');
  };

  const confirmDeleteCompany = async () => {
    console.log('🗑️ CONFIRM DELETE called');
    console.log('🗑️ companyToDelete:', companyToDelete);
    console.log('🗑️ db available:', !!db);
    
    if (!companyToDelete || !db) {
      console.error('❌ Cannot delete: missing companyToDelete or db');
      return;
    }

    try {
      setDeletingCompany(companyToDelete.id);
      console.log('🗑️ DELETING COMPANY:', companyToDelete.name, 'ID:', companyToDelete.id);

      // 1. Delete all users associated with this company
      const usersQuery = query(collection(db, 'users'), where('companyId', '==', companyToDelete.id));
      const usersSnapshot = await getDocs(usersQuery);
      console.log('🗑️ Found users to delete:', usersSnapshot.size);

      const userDeletePromises = usersSnapshot.docs.map(async (userDoc) => {
        console.log('🗑️ Deleting user:', userDoc.data().email);
        return deleteDoc(doc(db!, 'users', userDoc.id));
      });

      // 2. Delete all documents associated with this company
      const documentsQuery = query(collection(db, 'documents'), where('companyId', '==', companyToDelete.id));
      const documentsSnapshot = await getDocs(documentsQuery);
      console.log('🗑️ Found documents to delete:', documentsSnapshot.size);

      const documentDeletePromises = documentsSnapshot.docs.map(async (docDoc) => {
        console.log('🗑️ Deleting document:', docDoc.data().title);
        return deleteDoc(doc(db!, 'documents', docDoc.id));
      });

      // 3. Delete all deviations associated with this company
      const deviationsQuery = query(collection(db!, 'deviations'), where('companyId', '==', companyToDelete.id));
      const deviationsSnapshot = await getDocs(deviationsQuery);
      console.log('🗑️ Found deviations to delete:', deviationsSnapshot.size);

      const deviationDeletePromises = deviationsSnapshot.docs.map(async (deviationDoc) => {
        console.log('🗑️ Deleting deviation:', deviationDoc.data().title);
        return deleteDoc(doc(db!, 'deviations', deviationDoc.id));
      });

      // 4. Delete all chats associated with this company
      const chatsQuery = query(collection(db!, 'chats'), where('companyId', '==', companyToDelete.id));
      const chatsSnapshot = await getDocs(chatsQuery);
      console.log('🗑️ Found chats to delete:', chatsSnapshot.size);

      const chatDeletePromises = chatsSnapshot.docs.map(async (chatDoc) => {
        console.log('🗑️ Deleting chat:', chatDoc.data().title);
        return deleteDoc(doc(db!, 'chats', chatDoc.id));
      });

      // 5. Delete all messages associated with this company
      const messagesQuery = query(collection(db!, 'messages'), where('companyId', '==', companyToDelete.id));
      const messagesSnapshot = await getDocs(messagesQuery);
      console.log('🗑️ Found messages to delete:', messagesSnapshot.size);

      const messageDeletePromises = messagesSnapshot.docs.map(async (messageDoc) => {
        console.log('🗑️ Deleting message:', messageDoc.id);
        return deleteDoc(doc(db!, 'messages', messageDoc.id));
      });

      // 6. Delete all absences associated with this company
      const absencesQuery = query(collection(db!, 'absences'), where('companyId', '==', companyToDelete.id));
      const absencesSnapshot = await getDocs(absencesQuery);
      console.log('🗑️ Found absences to delete:', absencesSnapshot.size);

      const absenceDeletePromises = absencesSnapshot.docs.map(async (absenceDoc) => {
        console.log('🗑️ Deleting absence:', absenceDoc.id);
        return deleteDoc(doc(db!, 'absences', absenceDoc.id));
      });

      // 7. Delete all timeclock records associated with this company
      const timeclockQuery = query(collection(db!, 'timeclock'), where('companyId', '==', companyToDelete.id));
      const timeclockSnapshot = await getDocs(timeclockQuery);
      console.log('🗑️ Found timeclock records to delete:', timeclockSnapshot.size);

      const timeclockDeletePromises = timeclockSnapshot.docs.map(async (timeclockDoc) => {
        console.log('🗑️ Deleting timeclock record:', timeclockDoc.id);
        return deleteDoc(doc(db!, 'timeclock', timeclockDoc.id));
      });

      // 8. Delete all departments associated with this company
      const departmentsQuery = query(collection(db!, 'departments'), where('companyId', '==', companyToDelete.id));
      const departmentsSnapshot = await getDocs(departmentsQuery);
      console.log('🗑️ Found departments to delete:', departmentsSnapshot.size);

      const departmentDeletePromises = departmentsSnapshot.docs.map(async (departmentDoc) => {
        console.log('🗑️ Deleting department:', departmentDoc.data().name);
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

      // 9. Finally, delete the company itself
      console.log('🗑️ Deleting company:', companyToDelete.name);
      await deleteDoc(doc(db!, 'companies', companyToDelete.id));

      console.log('✅ COMPANY DELETION COMPLETE');
      
      // Update local state
      setCompanies(companies.filter(c => c.id !== companyToDelete.id));
      setFilteredCompanies(filteredCompanies.filter(c => c.id !== companyToDelete.id));
      
      // Close modal and reset state
      setShowDeleteModal(false);
      setCompanyToDelete(null);
      setDeletingCompany(null);
      
      alert(`✅ Bedriften "${companyToDelete.name}" og all tilknyttet data er slettet.`);

    } catch (error) {
      console.error('❌ Error deleting company:', error);
      alert('❌ Feil ved sletting av bedrift: ' + (error instanceof Error ? error.message : 'Ukjent feil'));
    } finally {
      setDeletingCompany(null);
    }
  };

  const handleSaveCompany = async () => {
    if (!editingCompany || !db) return;

    try {
      console.log('💾 SAVING COMPANY:', editingCompany.name);
      
      // Update company in Firebase
      await updateDoc(doc(db!, 'companies', editingCompany.id), {
        name: editingCompany.name,
        orgNumber: editingCompany.orgNumber,
        phone: editingCompany.phone,
        email: editingCompany.email,
        adminEmail: editingCompany.adminEmail,
        address: editingCompany.address,
        industry: editingCompany.industry,
        employeeCount: editingCompany.employeeCount,
        status: editingCompany.status,
        subscriptionPlan: editingCompany.subscriptionPlan,
        contactPerson: editingCompany.contactPerson,
        updatedAt: new Date().toISOString()
      });

      // Update local state
      setCompanies(companies.map(c => 
        c.id === editingCompany.id ? { ...editingCompany, updatedAt: new Date().toISOString() } : c
      ));
      setFilteredCompanies(filteredCompanies.map(c => 
        c.id === editingCompany.id ? { ...editingCompany, updatedAt: new Date().toISOString() } : c
      ));

      // Close modal and reset state
      setShowEditModal(false);
      setEditingCompany(null);
      
      alert('✅ Bedrift oppdatert!');

    } catch (error) {
      console.error('❌ Error updating company:', error);
      alert('❌ Feil ved oppdatering av bedrift: ' + (error instanceof Error ? error.message : 'Ukjent feil'));
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
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <h1 style={{
            fontSize: 'var(--font-size-5xl)',
            fontWeight: '700',
            color: 'var(--gray-900)',
            marginBottom: '1rem',
            lineHeight: '1.2'
          }}>
            Finn din bedrift
          </h1>
          <p style={{
            fontSize: 'var(--font-size-xl)',
            color: 'var(--gray-600)',
            maxWidth: '600px',
            margin: '0 auto',
            lineHeight: '1.6'
          }}>
            Søk etter din bedrift for å få tilgang til DriftPro Admin-panelet
          </p>
        </div>

        {/* Search Section */}
        <div style={{ maxWidth: '600px', margin: '0 auto 3rem' }}>
          <div className="card">
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <div style={{ flex: '1' }}>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Søk etter bedriftsnavn, domene eller bransje..."
                    className="search-input"
                  />
                  <Search className="search-icon" />
                </div>
              </div>
              <button
                disabled={searching}
                className="btn btn-primary"
              >
                {searching ? (
                  <>
                    <div className="loading" style={{ width: '16px', height: '16px' }}></div>
                    Søker...
                  </>
                ) : (
                  <>
                    <Search style={{ width: '16px', height: '16px' }} />
                    Søk
                  </>
                )}
              </button>

            </div>
          </div>
        </div>

        {/* Companies List */}
        <div className="grid grid-cols-3" style={{ gap: '1.5rem' }}>
          {filteredCompanies.map((company) => (
            <div
              key={company.id}
              className="card"
              style={{ 
                transition: 'all var(--transition-normal)'
              }}
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
                  <button
                    onClick={(e) => handleEditCompany(company, e)}
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
                    title="Rediger bedrift"
                  >
                    <Edit style={{ width: '16px', height: '16px' }} />
                  </button>
                  <button
                    onClick={(e) => handleDeleteCompany(company, e)}
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
                  <button
                    onClick={() => {
                      console.log('🎯 SELECT BUTTON CLICKED for company:', company.name);
                      handleCompanySelect(company);
                    }}
                    style={{
                      padding: '0.5rem',
                      background: '#10b981',
                      border: 'none',
                      borderRadius: '6px',
                      color: 'white',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.2s ease'
                    }}
                    title="Velg bedrift"
                  >
                    <ArrowRight style={{ width: '16px', height: '16px' }} />
                  </button>
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
        </div>

        {/* No Results */}
        {filteredCompanies.length === 0 && searchTerm && (
          <div style={{ textAlign: 'center', padding: '3rem' }}>
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
              Ingen bedrifter funnet
            </h3>
            <p style={{ 
              color: 'var(--gray-600)',
              fontSize: 'var(--font-size-base)'
            }}>
              Prøv å søke med et annet navn eller kontakt oss for hjelp.
            </p>
          </div>
        )}

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
            Kan du ikke finne din bedrift?
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

      {/* Edit Company Modal */}
      {showEditModal && editingCompany && (
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
            width: '90%',
            maxHeight: '90vh',
            overflow: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: 'var(--font-size-xl)', fontWeight: '600', color: 'var(--gray-900)' }}>
                Rediger bedrift
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
                  Bedriftsnavn *
                </label>
                <input
                  type="text"
                  value={editingCompany.name}
                  onChange={(e) => setEditingCompany({ ...editingCompany, name: e.target.value })}
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
                  Organisasjonsnummer
                </label>
                <input
                  type="text"
                  value={editingCompany.orgNumber}
                  onChange={(e) => setEditingCompany({ ...editingCompany, orgNumber: e.target.value })}
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
                  Telefon
                </label>
                <input
                  type="text"
                  value={editingCompany.phone}
                  onChange={(e) => setEditingCompany({ ...editingCompany, phone: e.target.value })}
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
                  E-post
                </label>
                <input
                  type="email"
                  value={editingCompany.email}
                  onChange={(e) => setEditingCompany({ ...editingCompany, email: e.target.value })}
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
                  Admin E-post
                </label>
                <input
                  type="email"
                  value={editingCompany.adminEmail}
                  onChange={(e) => setEditingCompany({ ...editingCompany, adminEmail: e.target.value })}
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
                  Adresse
                </label>
                <input
                  type="text"
                  value={editingCompany.address}
                  onChange={(e) => setEditingCompany({ ...editingCompany, address: e.target.value })}
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
                  Bransje
                </label>
                <input
                  type="text"
                  value={editingCompany.industry}
                  onChange={(e) => setEditingCompany({ ...editingCompany, industry: e.target.value })}
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
                  Antall ansatte
                </label>
                <input
                  type="number"
                  value={editingCompany.employeeCount}
                  onChange={(e) => setEditingCompany({ ...editingCompany, employeeCount: parseInt(e.target.value) || 0 })}
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
                  Status
                </label>
                <select
                  value={editingCompany.status}
                  onChange={(e) => setEditingCompany({ ...editingCompany, status: e.target.value as 'active' | 'inactive' | 'pending' })}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid var(--gray-300)',
                    borderRadius: 'var(--radius-md)',
                    fontSize: 'var(--font-size-base)'
                  }}
                >
                  <option value="active">Aktiv</option>
                  <option value="inactive">Inaktiv</option>
                  <option value="pending">Venter</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
              <button
                onClick={handleSaveCompany}
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