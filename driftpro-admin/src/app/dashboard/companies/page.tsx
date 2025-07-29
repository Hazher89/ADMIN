'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Search, 
  Building, 
  Mail, 
  Phone, 
  MapPin, 
  Users,
  Plus,
  Edit,
  Trash2,
  Save,
  X,
  AlertTriangle,
  CheckCircle,
  Loader2
} from 'lucide-react';
import { collection, query, getDocs, addDoc, updateDoc, deleteDoc, doc, writeBatch, where, setDoc } from 'firebase/firestore';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { db, auth } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import CompanyDetailModal from '@/components/CompanyDetailModal';

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
  const { user, userProfile } = useAuth();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [filteredCompanies, setFilteredCompanies] = useState<Company[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedCompanyForDetail, setSelectedCompanyForDetail] = useState<Company | null>(null);
  
  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  
  // Form data
  const [formData, setFormData] = useState({
    name: '',
    orgNumber: '',
    phone: '',
    email: '',
    adminEmail: '',
    adminPassword: '',
    address: '',
    industry: '',
    employeeCount: 0,
    status: 'active' as 'active' | 'inactive' | 'pending',
    subscriptionPlan: 'basic' as 'basic' | 'premium' | 'enterprise',
    contactPerson: {
      name: '',
      phone: '',
      email: ''
    }
  });

  const [isLoadingBrreg, setIsLoadingBrreg] = useState(false);
  const [brregError, setBrregError] = useState<string | null>(null);

  const industries = [
    'Teknologi',
    'Helse',
    'Finans',
    'Utdanning',
    'Handel',
    'Produksjon',
    'Transport',
    'Bygg og anlegg',
    'Konsulent',
    'Annet'
  ];

  // Brønnøysundregistrene API integration
  const fetchCompanyFromBrreg = async (orgNumber: string) => {
    if (!orgNumber || orgNumber.length < 9) return;
    
    setIsLoadingBrreg(true);
    setBrregError(null);
    
    try {
      // Brønnøysundregistrene API endpoint
      const response = await fetch(`https://data.brreg.no/enhetsregisteret/api/enheter/${orgNumber}`);
      
      if (!response.ok) {
        throw new Error('Bedrift ikke funnet i Brønnøysundregistrene');
      }
      
      const data = await response.json();
      
      // Oppdater form data med informasjon fra Brønnøysundregistrene
      setFormData(prev => ({
        ...prev,
        name: data.navn || prev.name,
        address: data.forretningsadresse?.adresse ? 
          `${data.forretningsadresse.adresse.join(', ')}` : prev.address,
        industry: data.naeringskode1?.beskrivelse || prev.industry,
        phone: data.forretningsadresse?.telefonnummer || prev.phone,
        email: data.forretningsadresse?.epostadresse || prev.email
      }));
      
    } catch (error) {
      console.error('Error fetching from Brønnøysundregistrene:', error);
      setBrregError(error instanceof Error ? error.message : 'Kunne ikke hente bedriftsinformasjon');
    } finally {
      setIsLoadingBrreg(false);
    }
  };

  // Debounced function for org number input
  const debouncedFetchBrreg = useCallback(
    (() => {
      let timeout: NodeJS.Timeout;
      return (orgNumber: string) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => {
          if (orgNumber && orgNumber.length >= 9) {
            fetchCompanyFromBrreg(orgNumber);
          }
        }, 1000);
      };
    })(),
    [fetchCompanyFromBrreg]
  );

  // Handle org number input change
  const handleOrgNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFormData(prev => ({ ...prev, orgNumber: value }));
    
    // Clear error when user starts typing
    if (brregError) setBrregError(null);
    
    // Fetch from Brønnøysundregistrene if org number is complete
    if (value.length >= 9) {
      debouncedFetchBrreg(value);
    }
  };

  // Check if user is DriftPro AS admin
  const isDriftProAdmin = user?.email === 'admin@driftpro.no' || user?.email === 'baxigshti@hotmail.de' || userProfile?.role === 'admin';

  useEffect(() => {
    if (isDriftProAdmin) {
      loadCompanies();
    }
  }, [isDriftProAdmin]);

  const filterCompanies = useCallback(() => {
    const filtered = companies.filter(company =>
      company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      company.orgNumber.includes(searchTerm) ||
      company.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      company.industry.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredCompanies(filtered);
  }, [companies, searchTerm]);

  useEffect(() => {
    filterCompanies();
  }, [filterCompanies]);

  const loadCompanies = async () => {
    try {
      setLoading(true);
      if (db) {
        const companiesQuery = query(collection(db, 'companies'));
        const snapshot = await getDocs(companiesQuery);
        const companiesData = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            name: data.name || '',
            orgNumber: data.orgNumber || '',
            phone: data.phone || '',
            email: data.email || '',
            adminEmail: data.adminEmail || '',
            address: data.address || '',
            industry: data.industry || '',
            employeeCount: data.employeeCount || 0,
            status: data.status || 'active',
            createdAt: data.createdAt || new Date().toISOString(),
            updatedAt: data.updatedAt || new Date().toISOString(),
            subscriptionPlan: data.subscriptionPlan || 'basic',
            contactPerson: {
              name: data.contactPerson?.name || '',
              phone: data.contactPerson?.phone || '',
              email: data.contactPerson?.email || ''
            }
          } as Company;
        });
        setCompanies(companiesData);
      } else {
        // Fallback to mock data
        setCompanies([
          {
            id: 'driftpro-1',
            name: 'DriftPro AS',
            orgNumber: '123456789',
            phone: '+47 123 45 678',
            email: 'kontakt@driftpro.no',
            adminEmail: 'baxigshti@hotmail.de',
            address: 'Oslo, Norge',
            industry: 'Teknologi',
            employeeCount: 25,
            status: 'active',
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-01T00:00:00Z',
            subscriptionPlan: 'premium',
            contactPerson: {
              name: 'Admin',
              phone: '+47 123 45 678',
              email: 'baxigshti@hotmail.de'
            }
          },
          {
            id: '1',
            name: 'TechCorp AS',
            orgNumber: '123456789',
            phone: '+47 123 45 678',
            email: 'info@techcorp.no',
            adminEmail: 'admin@techcorp.no',
            address: 'Storgata 1, 0001 Oslo',
            industry: 'Teknologi',
            employeeCount: 50,
            status: 'active',
            createdAt: '2024-01-15T10:00:00Z',
            updatedAt: '2024-01-15T10:00:00Z',
            subscriptionPlan: 'premium',
            contactPerson: {
              name: 'Ola Nordmann',
              phone: '+47 123 45 679',
              email: 'ola@techcorp.no'
            }
          },
          {
            id: '2',
            name: 'HealthCare Solutions',
            orgNumber: '987654321',
            phone: '+47 987 65 432',
            email: 'kontakt@healthcare.no',
            adminEmail: 'admin@healthcare.no',
            address: 'Helsestien 5, 5000 Bergen',
            industry: 'Helse',
            employeeCount: 120,
            status: 'active',
            createdAt: '2024-02-20T14:30:00Z',
            updatedAt: '2024-02-20T14:30:00Z',
            subscriptionPlan: 'enterprise',
            contactPerson: {
              name: 'Kari Hansen',
              phone: '+47 987 65 433',
              email: 'kari@healthcare.no'
            }
          }
        ]);
      }
    } catch (error) {
      console.error('Error loading companies:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      
      const companyData = {
        ...formData,
        createdAt: selectedCompany ? selectedCompany.createdAt : new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      if (selectedCompany) {
        // Update existing company
        if (db) {
          await updateDoc(doc(db, 'companies', selectedCompany.id), companyData);
        }
        setCompanies(prev =>
          prev.map(company =>
            company.id === selectedCompany.id
              ? { ...company, ...companyData }
              : company
          )
        );
      } else {
        // Add new company and create admin user
        if (db && auth && formData.adminEmail && formData.adminPassword) {
          // Create admin user account in Firebase Auth
          const userCredential = await createUserWithEmailAndPassword(
            auth,
            formData.adminEmail,
            formData.adminPassword
          );
          
          // Create user profile in Firestore (users collection only)
          // NOTE: We do NOT create an employee record for admin users
          const userProfile = {
            id: userCredential.user.uid,
            displayName: formData.contactPerson.name || 'Admin',
            email: formData.adminEmail,
            role: 'admin',
            companyId: '', // Will be set after company creation
            createdAt: new Date().toISOString(),
            phone: formData.contactPerson.phone || '',
            departmentId: '',
            position: 'Administrator',
            avatar: '',
            bio: '',
            address: formData.address || '',
            emergencyContact: '',
            // Admin-specific permissions
            handleDeviations: true,
            manageOwnDepartment: true,
            manageShifts: true,
            readDocuments: true,
            submitAbsence: true,
            submitDeviations: true,
            submitVacation: true,
            useChat: true
          };
          
          // Create user in users collection only (not employees)
          await setDoc(doc(db, 'users', userCredential.user.uid), userProfile);
          
          // Check if there's an existing employee record with the same email and delete it
          // This prevents admin users from appearing in both users and employees collections
          const employeesQuery = query(
            collection(db, 'employees'),
            where('email', '==', formData.adminEmail)
          );
          const employeesSnapshot = await getDocs(employeesQuery);
          if (!employeesSnapshot.empty) {
            // Delete any existing employee records with the same email
            const batch = writeBatch(db);
            employeesSnapshot.docs.forEach(doc => {
              batch.delete(doc.ref);
            });
            await batch.commit();
            console.log('Deleted existing employee records for admin user');
          }
          
          // Create company
          const docRef = await addDoc(collection(db, 'companies'), companyData);
          
          // Update user profile with company ID
          await updateDoc(doc(db, 'users', userCredential.user.uid), {
            companyId: docRef.id
          });
          
          setCompanies(prev => [...prev, { ...companyData, id: docRef.id }]);
        } else {
          // Fallback to local state
          const mockId = Date.now().toString();
          setCompanies(prev => [...prev, { ...companyData, id: mockId }]);
        }
      }

      resetForm();
      setShowAddModal(false);
      setShowEditModal(false);
    } catch (error) {
      console.error('Error saving company:', error);
      alert('Feil ved opprettelse av bedrift: ' + (error instanceof Error ? error.message : 'Ukjent feil'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedCompany) return;
    
    try {
      setSaving(true);
      if (db) {
        await deleteDoc(doc(db, 'companies', selectedCompany.id));
      }
      setCompanies(prev => prev.filter(company => company.id !== selectedCompany.id));
      setShowDeleteModal(false);
      setSelectedCompany(null);
    } catch (error) {
      console.error('Error deleting company:', error);
    } finally {
      setSaving(false);
    }
  };

  const openEditModal = (company: Company) => {
    setSelectedCompany(company);
    setFormData({
      name: company.name,
      orgNumber: company.orgNumber,
      adminEmail: company.adminEmail,
      adminPassword: '',
      phone: company.phone,
      email: company.email,
      address: company.address,
      industry: company.industry,
      employeeCount: company.employeeCount,
      status: company.status,
      subscriptionPlan: company.subscriptionPlan,
      contactPerson: company.contactPerson
    });
    setShowEditModal(true);
  };

  const openCompanyDetail = (company: Company) => {
    setSelectedCompanyForDetail(company);
    setShowDetailModal(true);
  };

  const openDeleteModal = (company: Company) => {
    setSelectedCompany(company);
    setShowDeleteModal(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      orgNumber: '',
      phone: '',
      email: '',
      adminEmail: '',
      adminPassword: '',
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
    setSelectedCompany(null);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-red-100 text-red-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'Aktiv';
      case 'inactive': return 'Inaktiv';
      case 'pending': return 'Venter';
      default: return status;
    }
  };

  const getPlanColor = (plan: string) => {
    switch (plan) {
      case 'enterprise': return 'bg-purple-100 text-purple-800';
      case 'premium': return 'bg-blue-100 text-blue-800';
      case 'basic': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const updateDriftProAdminEmail = async () => {
    try {
      setSaving(true);
      
      // Find DriftPro AS in companies
      const driftProCompany = companies.find(company => company.name === 'DriftPro AS');
      
      console.log('🔍 Searching for DriftPro AS...');
      console.log('All companies:', companies.map(c => ({ name: c.name, adminEmail: c.adminEmail })));
      
      if (driftProCompany) {
        console.log('✅ Found DriftPro AS:', driftProCompany);
        console.log('Current admin email:', driftProCompany.adminEmail);
        console.log('Will update to: baxigshti@hotmail.de');
        
        if (db) {
          // Update DriftPro AS admin email
          await updateDoc(doc(db, 'companies', driftProCompany.id), {
            adminEmail: 'baxigshti@hotmail.de',
            updatedAt: new Date().toISOString()
          });
          
          console.log('✅ Successfully updated DriftPro AS in Firebase');
          
          // Update local state
          setCompanies(prev =>
            prev.map(company =>
              company.name === 'DriftPro AS'
                ? { ...company, adminEmail: 'baxigshti@hotmail.de', updatedAt: new Date().toISOString() }
                : company
            )
          );
          
          alert('✅ DriftPro AS admin-e-post oppdatert til baxigshti@hotmail.de\n\nDu kan nå logge inn med baxigshti@hotmail.de');
        } else {
          alert('❌ Firebase ikke tilgjengelig');
        }
      } else {
        console.log('❌ DriftPro AS not found in companies list');
        alert('❌ DriftPro AS ikke funnet i databasen\n\nSjekk at DriftPro AS eksisterer i Firebase');
      }
    } catch (error) {
      console.error('❌ Error updating DriftPro AS:', error);
      alert('❌ Feil ved oppdatering av DriftPro AS: ' + (error instanceof Error ? error.message : 'Ukjent feil'));
    } finally {
      setSaving(false);
    }
  };

  // If user is not DriftPro admin, show access denied
  if (!isDriftProAdmin) {
    return (
      <div className="p-6">
        <div className="max-w-md mx-auto text-center">
          <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Tilgang nektet</h2>
          <p className="text-gray-600">
            Kun DriftPro AS administratorer har tilgang til bedriftsadministrasjon.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Bedriftsadministrasjon</h1>
        <p className="text-gray-600">Administrer bedrifter som bruker DriftPro-systemet</p>
      </div>

      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Søk etter bedrifter..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
            />
          </div>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={updateDriftProAdminEmail}
            disabled={saving}
            className="flex items-center space-x-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Edit className="h-4 w-4" />
            )}
            <span>Oppdater DriftPro AS</span>
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>Legg til bedrift</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Totalt bedrifter</p>
              <p className="text-2xl font-bold text-gray-900">{companies.length}</p>
            </div>
            <Building className="h-8 w-8 text-blue-600" />
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Aktive</p>
              <p className="text-2xl font-bold text-green-600">
                {companies.filter(c => c.status === 'active').length}
              </p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Venter</p>
              <p className="text-2xl font-bold text-yellow-600">
                {companies.filter(c => c.status === 'pending').length}
              </p>
            </div>
            <AlertTriangle className="h-8 w-8 text-yellow-600" />
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Totalt ansatte</p>
              <p className="text-2xl font-bold text-purple-600">
                {companies.reduce((sum, c) => sum + c.employeeCount, 0)}
              </p>
            </div>
            <Users className="h-8 w-8 text-purple-600" />
          </div>
        </div>
      </div>

      {/* Companies Table */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Laster bedrifter...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Bedrift
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Kontakt
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Plan
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ansatte
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Registrert
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Handlinger
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredCompanies.map((company) => (
                  <tr key={company.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        <button
                          onClick={() => openCompanyDetail(company)}
                          className="text-blue-600 hover:text-blue-900 underline"
                        >
                          {company.name}
                        </button>
                      </div>
                      <div className="text-sm text-gray-500">{company.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{company.contactPerson?.name || 'Ikke spesifisert'}</div>
                      <div className="text-sm text-gray-500">{company.contactPerson?.email || 'Ikke spesifisert'}</div>
                      <div className="text-sm text-gray-500">{company.contactPerson?.phone || 'Ikke spesifisert'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(company.status || 'active')}`}>
                        {getStatusText(company.status || 'active')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPlanColor(company.subscriptionPlan || 'basic')}`}>
                        {company.subscriptionPlan || 'basic'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {company.employeeCount || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {company.createdAt ? new Date(company.createdAt).toLocaleDateString('nb-NO') : 'Ikke registrert'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => openEditModal(company)}
                          className="text-blue-600 hover:text-blue-900 p-1"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => openDeleteModal(company)}
                          className="text-red-600 hover:text-red-900 p-1"
                        >
                          <Trash2 className="h-4 w-4" />
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

      {/* Add/Edit Company Modal */}
      {(showAddModal || showEditModal) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">
                {selectedCompany ? 'Rediger bedrift' : 'Legg til ny bedrift'}
              </h2>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setShowEditModal(false);
                  resetForm();
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Brønnøysundregistrene Integration Info */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    <Building className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-blue-900">
                      Automatisk bedriftsinformasjon
                    </h3>
                    <p className="text-sm text-blue-700 mt-1">
                      Når du skriver inn et gyldig organisasjonsnummer, henter systemet automatisk bedriftsinformasjon fra 
                      <a 
                        href="https://www.brreg.no/" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="underline hover:text-blue-900"
                      >
                        Brønnøysundregistrene
                      </a>
                      . Du kan også klikke &quot;Hent&quot;-knappen for manuell oppdatering.
                    </p>
                  </div>
                </div>
              </div>

              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Bedriftsnavn *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Organisasjonsnummer *
                  </label>
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      required
                      value={formData.orgNumber}
                      onChange={handleOrgNumberChange}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                      placeholder="Eks: 123456789"
                    />
                    <button
                      type="button"
                      onClick={() => formData.orgNumber && fetchCompanyFromBrreg(formData.orgNumber)}
                      disabled={!formData.orgNumber || isLoadingBrreg}
                      className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1"
                    >
                      {isLoadingBrreg ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Search className="h-4 w-4" />
                      )}
                      <span className="hidden sm:inline">Hent</span>
                    </button>
                  </div>
                  {isLoadingBrreg && (
                    <p className="text-sm text-gray-500 mt-1 flex items-center">
                      <Loader2 className="h-3 w-3 animate-spin mr-1" />
                      Henter bedriftsinformasjon fra Brønnøysundregistrene...
                    </p>
                  )}
                  {brregError && (
                    <p className="text-sm text-red-600 mt-1 flex items-center">
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      {brregError}
                    </p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    Automatisk henting skjer når du skriver inn 9-sifret organisasjonsnummer
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Bransje
                  </label>
                  <select
                    value={formData.industry}
                    onChange={(e) => setFormData(prev => ({ ...prev, industry: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                  >
                    <option value="">Velg bransje</option>
                    {industries.map(industry => (
                      <option key={industry} value={industry}>{industry}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Antall ansatte
                  </label>
                  <input
                    type="number"
                    value={formData.employeeCount}
                    onChange={(e) => setFormData(prev => ({ ...prev, employeeCount: parseInt(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                  />
                </div>
              </div>

              {/* Contact Information */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Kontaktinformasjon</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Bedriftsens telefon
                    </label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Bedriftsens e-post
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Admin e-post *
                    </label>
                    <input
                      type="email"
                      required
                      value={formData.adminEmail}
                      onChange={(e) => setFormData(prev => ({ ...prev, adminEmail: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Admin passord *
                    </label>
                    <input
                      type="password"
                      required
                      value={formData.adminPassword}
                      onChange={(e) => setFormData(prev => ({ ...prev, adminPassword: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                      placeholder="Minst 6 tegn"
                      minLength={6}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Dette passordet brukes for å logge inn som admin for bedriften
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Adresse
                    </label>
                    <input
                      type="text"
                      value={formData.address}
                      onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                    />
                  </div>
                </div>
              </div>

              {/* Contact Person */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Kontaktperson</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Navn
                    </label>
                    <input
                      type="text"
                      value={formData.contactPerson.name}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        contactPerson: { ...prev.contactPerson, name: e.target.value }
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Telefon
                    </label>
                    <input
                      type="tel"
                      value={formData.contactPerson.phone}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        contactPerson: { ...prev.contactPerson, phone: e.target.value }
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      E-post
                    </label>
                    <input
                      type="email"
                      value={formData.contactPerson.email}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        contactPerson: { ...prev.contactPerson, email: e.target.value }
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                    />
                  </div>
                </div>
              </div>

              {/* Settings */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Innstillinger</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Status
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        status: e.target.value as 'active' | 'inactive' | 'pending'
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                    >
                      <option value="active">Aktiv</option>
                      <option value="pending">Venter</option>
                      <option value="inactive">Inaktiv</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Abonnement
                    </label>
                    <select
                      value={formData.subscriptionPlan}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        subscriptionPlan: e.target.value as 'basic' | 'premium' | 'enterprise'
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                    >
                      <option value="basic">Basic</option>
                      <option value="premium">Premium</option>
                      <option value="enterprise">Enterprise</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-4 pt-6 border-t">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setShowEditModal(false);
                    resetForm();
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Avbryt
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center space-x-2"
                >
                  {saving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Lagrer...</span>
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      <span>{selectedCompany ? 'Oppdater' : 'Legg til'}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedCompany && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center space-x-3 mb-4">
              <AlertTriangle className="h-6 w-6 text-red-600" />
              <h3 className="text-lg font-bold">Slett bedrift</h3>
            </div>
            <p className="text-gray-600 mb-6">
              Er du sikker på at du vil slette <strong>{selectedCompany.name}</strong>? 
              Denne handlingen kan ikke angres.
            </p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Avbryt
              </button>
              <button
                onClick={handleDelete}
                disabled={saving}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {saving ? 'Sletter...' : 'Slett'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Company Detail Modal */}
      {showDetailModal && selectedCompanyForDetail && (
        <CompanyDetailModal
          isOpen={showDetailModal}
          onClose={() => setShowDetailModal(false)}
          orgNumber={selectedCompanyForDetail.orgNumber}
          companyName={selectedCompanyForDetail.name}
        />
      )}
    </div>
  );
} 