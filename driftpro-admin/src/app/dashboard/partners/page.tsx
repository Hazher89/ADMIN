'use client';

import React, { useState, useEffect } from 'react';
import { firebaseService } from '@/lib/firebase-services';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Plus, 
  Search, 
  UserPlus, 
  Building2,
  Phone,
  Mail,
  MapPin,
  Users,
  FileUp
} from 'lucide-react';

interface Partner {
  id: string;
  name: string;
  orgNumber: string;
  industry: string;
  address: {
    street: string;
    city: string;
    postalCode: string;
    country: string;
  };
  contactPerson: {
    name: string;
    email: string;
    phone: string;
    position: string;
  };
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

export default function PartnersPage() {
  const { userProfile } = useAuth();
  const [partners, setPartners] = useState<Partner[]>([]);
  const [filteredPartners, setFilteredPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Partner creation
  const [showCreatePartnerModal, setShowCreatePartnerModal] = useState(false);
  const [newPartner, setNewPartner] = useState({
    name: '',
    orgNumber: '',
    industry: '',
    address: {
      street: '',
      city: '',
      postalCode: '',
      country: 'Norge'
    },
    contactPerson: {
      name: '',
      email: '',
      phone: '',
      position: ''
    }
  });

  useEffect(() => {
    if (userProfile?.companyId) {
      loadPartners();
    }
  }, [userProfile?.companyId]);

  const loadPartners = async () => {
    try {
      const partnersData = await firebaseService.getPartners(userProfile!.companyId);
      setPartners(partnersData);
      setFilteredPartners(partnersData);
    } catch (error) {
      setError('Kunne ikke laste partnere');
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePartner = async () => {
    if (!userProfile?.companyId) {
      setError('Mangler bedrifts-ID');
      return;
    }

    try {
      setLoading(true);
      
      const partnerData = {
        ...newPartner,
        companyId: userProfile.companyId,
        status: 'active' as const
      };
      
      await firebaseService.createPartner(partnerData);
      
      // Refresh partners list
      const updatedPartners = await firebaseService.getPartners(userProfile.companyId);
      setPartners(updatedPartners);
      setFilteredPartners(updatedPartners);
      
      setSuccess('Partner opprettet!');
      setShowCreatePartnerModal(false);
      setNewPartner({
        name: '',
        orgNumber: '',
        industry: '',
        address: { street: '', city: '', postalCode: '', country: 'Norge' },
        contactPerson: { name: '', email: '', phone: '', position: '' }
      });
      
    } catch (err: any) {
      setError(err.message || 'Kunne ikke opprette partner');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query.trim() === '') {
      setFilteredPartners(partners);
    } else {
      const filtered = partners.filter(partner =>
        partner.name.toLowerCase().includes(query.toLowerCase()) ||
        partner.orgNumber.includes(query) ||
        partner.contactPerson.name.toLowerCase().includes(query.toLowerCase())
      );
      setFilteredPartners(filtered);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Laster partnere...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Samarbeidspartnere</h1>
        <button
          onClick={() => setShowCreatePartnerModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Ny Partner
        </button>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Søk etter partnere..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Partners Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPartners.map((partner) => (
          <div key={partner.id} className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <Building2 className="w-8 h-8 text-blue-600" />
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{partner.name}</h3>
                  <p className="text-sm text-gray-500">Org.nr: {partner.orgNumber}</p>
                </div>
              </div>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                partner.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {partner.status === 'active' ? 'Aktiv' : 'Inaktiv'}
              </span>
            </div>

            <div className="space-y-3 mb-4">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <MapPin className="w-4 h-4" />
                <span>{partner.address.street}, {partner.address.postalCode} {partner.address.city}</span>
              </div>
              
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Users className="w-4 h-4" />
                <span>{partner.contactPerson.name} - {partner.contactPerson.position}</span>
              </div>
              
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Mail className="w-4 h-4" />
                <span>{partner.contactPerson.email}</span>
              </div>
              
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Phone className="w-4 h-4" />
                <span>{partner.contactPerson.phone}</span>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => {
                  // TODO: Show create user modal
                }}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm flex items-center justify-center gap-2"
              >
                <UserPlus className="w-4 h-4" />
                Opprett Bruker
              </button>
              
              <button
                onClick={() => {
                  // TODO: Show file upload modal
                }}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm flex items-center justify-center gap-2"
              >
                <FileUp className="w-4 h-4" />
                Last Opp Filer
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Create Partner Modal */}
      {showCreatePartnerModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Opprett Ny Partner</h2>
            
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Bedriftsnavn"
                value={newPartner.name}
                onChange={(e) => setNewPartner(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
              
              <input
                type="text"
                placeholder="Organisasjonsnummer"
                value={newPartner.orgNumber}
                onChange={(e) => setNewPartner(prev => ({ ...prev, orgNumber: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
              
              <input
                type="text"
                placeholder="Bransje"
                value={newPartner.industry}
                onChange={(e) => setNewPartner(prev => ({ ...prev, industry: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
              
              <input
                type="text"
                placeholder="Gateadresse"
                value={newPartner.address.street}
                onChange={(e) => setNewPartner(prev => ({ 
                  ...prev, 
                  address: { ...prev.address, street: e.target.value }
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
              
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="Postnummer"
                  value={newPartner.address.postalCode}
                  onChange={(e) => setNewPartner(prev => ({ 
                    ...prev, 
                    address: { ...prev.address, postalCode: e.target.value }
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
                
                <input
                  type="text"
                  placeholder="By"
                  value={newPartner.address.city}
                  onChange={(e) => setNewPartner(prev => ({ 
                    ...prev, 
                    address: { ...prev.address, city: e.target.value }
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              
              <input
                type="text"
                placeholder="Kontaktperson navn"
                value={newPartner.contactPerson.name}
                onChange={(e) => setNewPartner(prev => ({ 
                  ...prev, 
                  contactPerson: { ...prev.contactPerson, name: e.target.value }
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
              
              <input
                type="text"
                placeholder="Kontaktperson stilling"
                value={newPartner.contactPerson.position}
                onChange={(e) => setNewPartner(prev => ({ 
                  ...prev, 
                  contactPerson: { ...prev.contactPerson, position: e.target.value }
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
              
              <input
                type="email"
                placeholder="E-post"
                value={newPartner.contactPerson.email}
                onChange={(e) => setNewPartner(prev => ({ 
                  ...prev, 
                  contactPerson: { ...prev.contactPerson, email: e.target.value }
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
              
              <input
                type="tel"
                placeholder="Telefon"
                value={newPartner.contactPerson.phone}
                onChange={(e) => setNewPartner(prev => ({ 
                  ...prev, 
                  contactPerson: { ...prev.contactPerson, phone: e.target.value }
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            
            <div className="flex gap-2 mt-6">
              <button
                onClick={handleCreatePartner}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
              >
                Opprett Partner
              </button>
              <button
                onClick={() => setShowCreatePartnerModal(false)}
                className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded-lg"
              >
                Avbryt
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error and Success Messages */}
      {error && (
        <div className="fixed top-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg z-50">
          {error}
        </div>
      )}
      
      {success && (
        <div className="fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50">
          {success}
        </div>
      )}
    </div>
  );
}
