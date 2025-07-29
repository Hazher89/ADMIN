'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
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
  X 
} from 'lucide-react';
import { collection, query, where, getDocs } from 'firebase/firestore';
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
  const [hasSearched, setHasSearched] = useState(false);

  const loadCompanies = async () => {
    try {
      setLoading(true);
      if (db) {
        // Fetch ALL companies from Firebase (no status filter)
        const companiesQuery = query(collection(db, 'companies'));
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
        setCompanies(companiesData);
        console.log('Loaded companies from Firebase:', companiesData);
        console.log('Total companies loaded:', companiesData.length);
        companiesData.forEach(company => {
          console.log(`Company: ${company.name} (${company.status}) - Admin: ${company.adminEmail}`);
        });
        
        // Check specifically for DriftPro AS
        const driftPro = companiesData.find(company => company.name === 'DriftPro AS');
        if (driftPro) {
          console.log('🚨 DriftPro AS found in Firebase:');
          console.log('   Name:', driftPro.name);
          console.log('   Admin Email:', driftPro.adminEmail);
          console.log('   Expected Admin Email: baxigshti@hotmail.de');
          console.log('   Match:', driftPro.adminEmail === 'baxigshti@hotmail.de');
        } else {
          console.log('❌ DriftPro AS not found in Firebase');
        }
      } else {
        // Fallback to mock data if Firebase is not available
        setCompanies([
          {
            id: 'company-1',
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
          }
        ]);
      }
    } catch (error) {
      console.error('Error loading companies:', error);
      // Fallback to mock data on error
      setCompanies([
        {
          id: 'company-1',
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
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCompanies();
  }, []);

  useEffect(() => {
    if (searchTerm.trim()) {
      handleSearch();
    } else {
      setFilteredCompanies(companies);
      setHasSearched(false);
    }
  }, [searchTerm, companies]);

  const handleCompanySelect = (company: Company) => {
    // Store selected company in localStorage
    localStorage.setItem('selectedCompany', JSON.stringify(company));
    // Redirect to login page
    router.push('/login');
  };

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      setFilteredCompanies(companies);
      setHasSearched(false);
      return;
    }

    setSearching(true);
    setHasSearched(true);

    try {
      // Filter companies based on search term
      const filtered = companies.filter(company =>
        company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        company.orgNumber.includes(searchTerm) ||
        company.industry.toLowerCase().includes(searchTerm.toLowerCase()) ||
        company.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
        company.status.toLowerCase().includes(searchTerm.toLowerCase())
      );
      
      setFilteredCompanies(filtered);
    } catch (error) {
      console.error('Error searching companies:', error);
      setFilteredCompanies([]);
    } finally {
      setSearching(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse">
              <Building className="h-8 w-8 text-white" />
            </div>
            <div className="absolute inset-0 w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-2xl animate-spin mx-auto"></div>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Laster bedrifter...</h3>
          <p className="text-gray-600">Henter bedriftsinformasjon fra databasen</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-lg border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                {/* Zap icon removed */}
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">DriftPro</h1>
                <p className="text-sm text-gray-500">Admin Panel</p>
              </div>
            </div>
            
                         <div className="flex items-center space-x-4">
               <Link
                 href="/"
                 className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
               >
                 Hjem
               </Link>
               <Link
                 href="/help"
                 className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
               >
                 Hjelp
               </Link>
             </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Finn din bedrift
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Søk etter din bedrift for å få tilgang til DriftPro Admin-panelet
          </p>
        </div>

        {/* Search Section */}
        <div className="max-w-2xl mx-auto mb-12">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="flex space-x-4">
              <div className="flex-1">
                <div className="relative">
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Søk etter bedriftsnavn, domene eller bransje..."
                    className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm text-gray-900"
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  />
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                </div>
              </div>
              <button
                onClick={handleSearch}
                disabled={searching}
                className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 transition-colors"
              >
                {searching ? (
                  'Søk'
                ) : (
                  'Søk'
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Companies List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCompanies.map((company) => (
            <div
              key={company.id}
              className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-200 cursor-pointer group"
              onClick={() => handleCompanySelect(company)}
            >
              <div className="p-6">
                {/* Company Header */}
                <div className="flex items-center space-x-4 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
                    <Building className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                      {company.name}
                    </h3>
                    <div className="flex items-center space-x-2">
                      <p className="text-sm text-gray-500">Org.nr: {company.orgNumber}</p>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        company.status === 'active' ? 'bg-green-100 text-green-800' :
                        company.status === 'inactive' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {company.status === 'active' ? 'Aktiv' :
                         company.status === 'inactive' ? 'Inaktiv' : 'Venter'}
                      </span>
                    </div>
                  </div>
                  {/* ArrowRight icon removed */}
                </div>

                {/* Company Details */}
                <div className="space-y-2 mb-4">
                  {company.address && (
                    <div className="flex items-center text-sm text-gray-600">
                      <MapPin className="h-4 w-4 mr-2" />
                      {company.address}
                    </div>
                  )}
                  {company.employeeCount && (
                    <div className="flex items-center text-sm text-gray-600">
                      <Users className="h-4 w-4 mr-2" />
                      {company.employeeCount} ansatte
                    </div>
                  )}
                  {company.industry && (
                    <div className="text-sm text-gray-600">
                      {company.industry}
                    </div>
                  )}
                </div>

                {/* Contact Info */}
                <div className="space-y-1">
                  {company.phone && (
                    <div className="flex items-center text-sm text-gray-500">
                      <Phone className="h-4 w-4 mr-2" />
                      {company.phone}
                    </div>
                  )}
                  {company.email && (
                    <div className="flex items-center text-sm text-gray-500">
                      <Mail className="h-4 w-4 mr-2" />
                      {company.email}
                    </div>
                  )}
                  {company.contactPerson?.name && (
                    <div className="flex items-center text-sm text-gray-500">
                      <Users className="h-4 w-4 mr-2" />
                      Kontakt: {company.contactPerson.name}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* No Results */}
        {filteredCompanies.length === 0 && searchTerm && (
          <div className="text-center py-12">
            <Building className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Ingen bedrifter funnet
            </h3>
            <p className="text-gray-600">
              Prøv å søke med et annet navn eller kontakt oss for hjelp.
            </p>
          </div>
        )}

        {/* Footer */}
        <div className="text-center mt-12 pt-8 border-t border-gray-200">
          <p className="text-sm text-gray-500">
            Kan du ikke finne din bedrift?{' '}
            <a href="/contact" className="text-blue-600 hover:text-blue-700 font-medium">
              Kontakt oss
            </a>
          </p>
        </div>
      </div>
    </div>
  );
} 