'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Zap,
  Search,
  Building,
  Users,
  MapPin,
  ArrowRight,
  Loader2,
  Globe,
  Phone,
  Mail,
  ExternalLink
} from 'lucide-react';
// Firebase imports for future use
// import { collection, query, where, getDocs } from 'firebase/firestore';
// import { db } from '@/lib/firebase';

interface Company {
  id: string;
  name: string;
  domain: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  employeeCount?: number;
  industry?: string;
  logo?: string;
}

export default function CompaniesPage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [companies, setCompanies] = useState<Company[]>([]);
  const [filteredCompanies, setFilteredCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // Mock companies data - in real app this would come from Firebase
  const mockCompanies: Company[] = [
    {
      id: 'company-1',
      name: 'DriftPro AS',
      domain: 'driftpro.no',
      address: 'Oslo, Norge',
      phone: '+47 123 45 678',
      email: 'kontakt@driftpro.no',
      website: 'https://driftpro.no',
      employeeCount: 25,
      industry: 'Teknologi',
      logo: '/api/placeholder/60/60'
    },
    {
      id: 'company-2',
      name: 'TechCorp Norge',
      domain: 'techcorp.no',
      address: 'Bergen, Norge',
      phone: '+47 987 65 432',
      email: 'info@techcorp.no',
      website: 'https://techcorp.no',
      employeeCount: 150,
      industry: 'Programvare',
      logo: '/api/placeholder/60/60'
    },
    {
      id: 'company-3',
      name: 'Innovation Labs',
      domain: 'innovationlabs.no',
      address: 'Trondheim, Norge',
      phone: '+47 555 12 34',
      email: 'hello@innovationlabs.no',
      website: 'https://innovationlabs.no',
      employeeCount: 75,
      industry: 'Forskning & Utvikling',
      logo: '/api/placeholder/60/60'
    },
    {
      id: 'company-4',
      name: 'Nordic Solutions',
      domain: 'nordicsolutions.no',
      address: 'Stavanger, Norge',
      phone: '+47 444 56 78',
      email: 'kontakt@nordicsolutions.no',
      website: 'https://nordicsolutions.no',
      employeeCount: 200,
      industry: 'Konsulenttjenester',
      logo: '/api/placeholder/60/60'
    },
    {
      id: 'company-5',
      name: 'Digital Future',
      domain: 'digitalfuture.no',
      address: 'Tromsø, Norge',
      phone: '+47 333 90 12',
      email: 'info@digitalfuture.no',
      website: 'https://digitalfuture.no',
      employeeCount: 45,
      industry: 'Digital Markedsføring',
      logo: '/api/placeholder/60/60'
    }
  ];

  const handleCompanySelect = (company: Company) => {
    // Store selected company in localStorage
    localStorage.setItem('selectedCompany', JSON.stringify(company));
    // Redirect to login page
    router.push('/login');
  };

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      setFilteredCompanies([]);
      setHasSearched(false);
      return;
    }

    setSearching(true);
    setHasSearched(true);

    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));

      // In real app, this would search Firebase
      // const companiesRef = collection(db, 'companies');
      // const q = query(companiesRef, where('name', '>=', searchTerm), where('name', '<=', searchTerm + '\uf8ff'));
      // const snapshot = await getDocs(q);
      // const companiesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      // Filter mock companies based on search term
      const filtered = mockCompanies.filter(company =>
        company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        company.domain.toLowerCase().includes(searchTerm.toLowerCase()) ||
        company.industry?.toLowerCase().includes(searchTerm.toLowerCase())
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
                <Zap className="h-6 w-6 text-white" />
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
                  <Loader2 className="h-5 w-5 animate-spin" />
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
                    <p className="text-sm text-gray-500">{company.domain}</p>
                  </div>
                  <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-blue-600 transition-colors" />
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
                  {company.website && (
                    <div className="flex items-center text-sm text-gray-500">
                      <Globe className="h-4 w-4 mr-2" />
                      <a
                        href={company.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-blue-600 transition-colors"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {company.website.replace(/^https?:\/\//, '')}
                        <ExternalLink className="h-3 w-3 ml-1 inline" />
                      </a>
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