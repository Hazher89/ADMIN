'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Save,
  X,
  ExternalLink,
  Building,
  Users,
  Phone,
  Mail,
  MapPin
} from 'lucide-react';
import { collection, addDoc, updateDoc, deleteDoc, doc, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import CompanyDetailModal from '@/components/CompanyDetailModal';
import { emailService } from '@/lib/email-service';

interface Partner {
  id: string;
  name: string;
  orgNumber: string;
  internalName: string;
  phone: string;
  email: string;
  address: string;
  contactPerson: string;
  status: 'active' | 'inactive';
  vehicles?: Vehicle[];
  createdAt: string;
  updatedAt: string;
}

interface Vehicle {
  id: string;
  regNumber: string;
  manufacturer?: string;
  brand?: string;
  model?: string;
  variant?: string;
  bodyType?: string;
  vehicleGroup?: string;
  firstRegistered?: string;
  lastEUApproved?: string;
  nextEUInspection?: string;
  maxPayload?: string;
  fetchedAt?: string;
}

interface BrregResult {
  orgNumber: string;
  data: {
    name: string;
    orgNumber: string;
    address: {
      street: string;
      city: string;
      postalCode: string;
    };
    brregData: Record<string, string | undefined>;
  } | null;
  success: boolean;
  error?: string;
}

export default function PartnersPage() {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [filteredPartners, setFilteredPartners] = useState<Partner[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedPartnerForDetail, setSelectedPartnerForDetail] = useState<Partner | null>(null);
  
  // Bulk import states
  const [orgNumbers, setOrgNumbers] = useState('');
  const [brregResults, setBrregResults] = useState<BrregResult[]>([]);
  const [isLoadingBrreg, setIsLoadingBrreg] = useState(false);
  const [brregError, setBrregError] = useState<string | null>(null);
  
  // Form data
  const [formData, setFormData] = useState({
    name: '',
    orgNumber: '',
    internalName: '',
    phone: '',
    email: '',
    address: '',
    contactPerson: '',
    status: 'active' as 'active' | 'inactive'
  });

  // Vehicle states
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [newRegNumber, setNewRegNumber] = useState('');
  const [isLoadingVehicle, setIsLoadingVehicle] = useState(false);
  const [vehicleError, setVehicleError] = useState<string | null>(null);
  const [showVehicleModal, setShowVehicleModal] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);

  const loadPartners = async () => {
    try {
      setLoading(true);
      if (db) {
        const partnersSnapshot = await getDocs(collection(db, 'partners'));
        const partnersData = partnersSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Partner[];
        setPartners(partnersData);
      }
    } catch (error) {
      console.error('Error loading partners:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterPartners = useCallback(() => {
    const filtered = partners.filter(partner =>
      partner.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      partner.internalName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      partner.orgNumber.includes(searchTerm) ||
      partner.contactPerson.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredPartners(filtered);
  }, [partners, searchTerm]);

  useEffect(() => {
    loadPartners();
  }, []);

  useEffect(() => {
    filterPartners();
  }, [filterPartners]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      if (db) {
        await addDoc(collection(db, 'partners'), {
          ...formData,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
        
        setShowAddModal(false);
        resetForm();
        loadPartners();
      }
    } catch (error) {
      console.error('Error adding partner:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPartner) return;
    
    try {
      setSaving(true);
      if (db) {
        await updateDoc(doc(db, 'partners', selectedPartner.id), {
          ...formData,
          vehicles: vehicles,
          updatedAt: new Date().toISOString()
        });
        setShowEditModal(false);
        resetForm();
        setVehicles([]);
        loadPartners();
      }
    } catch (error) {
      console.error('Error updating partner:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedPartner) return;
    
    try {
      setSaving(true);
      if (db) {
        await deleteDoc(doc(db, 'partners', selectedPartner.id));
        setShowDeleteModal(false);
        loadPartners();
      }
    } catch (error) {
      console.error('Error deleting partner:', error);
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      orgNumber: '',
      internalName: '',
      phone: '',
      email: '',
      address: '',
      contactPerson: '',
      status: 'active'
    });
    setVehicles([]);
    setNewRegNumber('');
    setVehicleError(null);
  };

  const openEditModal = (partner: Partner) => {
    setSelectedPartner(partner);
    setFormData({
      name: partner.name,
      orgNumber: partner.orgNumber,
      internalName: partner.internalName,
      phone: partner.phone,
      email: partner.email,
      address: partner.address,
      contactPerson: partner.contactPerson,
      status: partner.status
    });
    setVehicles(partner.vehicles || []);
    setShowEditModal(true);
  };

  const openPartnerDetail = (partner: Partner) => {
    setSelectedPartnerForDetail(partner);
    setShowDetailModal(true);
  };

  const openDeleteModal = (partner: Partner) => {
    setSelectedPartner(partner);
    setShowDeleteModal(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'Aktiv';
      case 'inactive': return 'Inaktiv';
      default: return 'Ukjent';
    }
  };

  const fetchVehicleData = async (regNumber: string) => {
    setIsLoadingVehicle(true);
    setVehicleError(null);
    
    try {
      console.log('Fetching vehicle data for reg number:', regNumber);
      const response = await fetch(`https://regnr.info/api/v1/vehicle/${regNumber}`);
      
      if (!response.ok) {
        throw new Error('Kunne ikke hente data fra regnr.info');
      }

      const data = await response.json();
      console.log('Vehicle data received:', data);
      
      const vehicle: Vehicle = {
        id: Date.now().toString(),
        regNumber: regNumber.toUpperCase(),
        manufacturer: data.manufacturer || '',
        brand: data.brand || '',
        model: data.model || '',
        variant: data.variant || '',
        bodyType: data.bodyType || '',
        vehicleGroup: data.vehicleGroup || '',
        firstRegistered: data.firstRegistered || '',
        lastEUApproved: data.lastEUApproved || '',
        nextEUInspection: data.nextEUInspection || '',
        maxPayload: data.maxPayload || '',
        fetchedAt: new Date().toISOString()
      };
      
      return vehicle;
    } catch (error) {
      console.error('Error fetching vehicle data:', error);
      throw new Error(error instanceof Error ? error.message : 'Ukjent feil');
    } finally {
      setIsLoadingVehicle(false);
    }
  };

  const addVehicle = async () => {
    if (!newRegNumber.trim()) {
      setVehicleError('Vennligst fyll inn registreringsnummer');
      return;
    }

    try {
      const vehicle = await fetchVehicleData(newRegNumber.trim());
      setVehicles(prev => [...prev, vehicle]);
      
      setNewRegNumber('');
      setVehicleError(null);
    } catch (error) {
      setVehicleError(error instanceof Error ? error.message : 'Kunne ikke hente kjøretøydata');
    }
  };

  const removeVehicle = (vehicleId: string) => {
    setVehicles(prev => prev.filter(v => v.id !== vehicleId));
  };

  const openVehicleModal = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
    setShowVehicleModal(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Samarbeidspartnere</h1>
          <p className="text-gray-600">Administrer samarbeidspartnere og leverandører</p>
        </div>
        
        <div className="flex space-x-2">
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 flex items-center space-x-2"
          >
            <Plus className="h-5 w-5" />
            <span>Legg til samarbeidspartner</span>
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Søk etter navn, intern navn, org.nr eller kontaktperson..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Partners Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPartners.map((partner) => (
          <div
            key={partner.id}
            className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
          >
            <div className="p-6">
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">
                    <button
                      onClick={() => openPartnerDetail(partner)}
                      className="text-left hover:text-blue-600 transition-colors"
                    >
                      {partner.name}
                    </button>
                  </h3>
                  {partner.internalName && (
                    <p className="text-sm text-gray-600 mb-2">({partner.internalName})</p>
                  )}
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(partner.status)}`}>
                    {getStatusText(partner.status)}
                  </span>
                </div>
              </div>

              {/* Company Info */}
              <div className="space-y-3 mb-4">
                <div className="flex items-center space-x-2">
                  <Building className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-600">Org.nr:</span>
                  <span className="text-sm font-medium text-gray-900">{partner.orgNumber}</span>
                </div>

                {partner.contactPerson && (
                  <div className="flex items-center space-x-2">
                    <Users className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-600">Kontakt:</span>
                    <span className="text-sm font-medium text-gray-900">{partner.contactPerson}</span>
                  </div>
                )}

                {partner.phone && (
                  <div className="flex items-center space-x-2">
                    <Phone className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-600">Tlf:</span>
                    <span className="text-sm font-medium text-gray-900">{partner.phone}</span>
                  </div>
                )}

                {partner.email && (
                  <div className="flex items-center space-x-2">
                    <Mail className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-600">E-post:</span>
                    <span className="text-sm font-medium text-gray-900">{partner.email}</span>
                  </div>
                )}

                {partner.address && (
                  <div className="flex items-start space-x-2">
                    <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
                    <span className="text-sm text-gray-600">Adresse:</span>
                    <span className="text-sm font-medium text-gray-900">{partner.address}</span>
                  </div>
                )}

                {partner.vehicles && partner.vehicles.length > 0 && (
                  <div className="flex items-center space-x-2">
                    <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                    <span className="text-sm text-gray-600">Kjøretøy:</span>
                    <span className="text-sm font-medium text-gray-900">{partner.vehicles.length} registrert</span>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex space-x-2 pt-4 border-t border-gray-200">
                <button
                  onClick={() => openPartnerDetail(partner)}
                  className="flex-1 bg-blue-50 text-blue-700 px-3 py-2 rounded-md text-sm font-medium hover:bg-blue-100 transition-colors"
                >
                  Se detaljer
                </button>
                <button
                  onClick={() => openEditModal(partner)}
                  className="flex-1 bg-gray-50 text-gray-700 px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-100 transition-colors"
                >
                  Rediger
                </button>
                <button
                  onClick={() => openDeleteModal(partner)}
                  className="flex-1 bg-red-50 text-red-700 px-3 py-2 rounded-md text-sm font-medium hover:bg-red-100 transition-colors"
                >
                  Slett
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredPartners.length === 0 && !loading && (
        <div className="text-center py-12">
          <Building className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Ingen samarbeidspartnere</h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchTerm ? 'Ingen samarbeidspartnere matcher søket ditt.' : 'Kom i gang ved å legge til en samarbeidspartner.'}
          </p>
          {!searchTerm && (
            <div className="mt-6">
              <button
                onClick={() => setShowAddModal(true)}
                className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 flex items-center space-x-2 mx-auto"
              >
                <Plus className="h-5 w-5" />
                <span>Legg til samarbeidspartner</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Add Partner Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900">Legg til samarbeidspartner</h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Bedriftsnavn *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Organisasjonsnummer *
                  </label>
                  <input
                    type="text"
                    value={formData.orgNumber}
                    onChange={(e) => setFormData({...formData, orgNumber: e.target.value})}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Intern navn *
                  </label>
                  <input
                    type="text"
                    value={formData.internalName}
                    onChange={(e) => setFormData({...formData, internalName: e.target.value})}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({...formData, status: e.target.value as 'active' | 'inactive'})}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="active">Aktiv</option>
                    <option value="inactive">Inaktiv</option>
                  </select>
                </div>
              </div>

              <div className="border-t pt-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Adresse</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Adresse
                    </label>
                    <input
                      type="text"
                      value={formData.address}
                      onChange={(e) => setFormData({
                        ...formData, 
                        address: e.target.value
                      })}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Fyll inn adresse"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      By
                    </label>
                    <input
                      type="text"
                      value={formData.address}
                      onChange={(e) => setFormData({
                        ...formData, 
                        address: e.target.value
                      })}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Postnummer
                    </label>
                    <input
                      type="text"
                      value={formData.address}
                      onChange={(e) => setFormData({
                        ...formData, 
                        address: e.target.value
                      })}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>

              <div className="border-t pt-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Kontaktperson</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Navn
                    </label>
                    <input
                      type="text"
                      value={formData.contactPerson}
                      onChange={(e) => setFormData({
                        ...formData, 
                        contactPerson: e.target.value
                      })}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Fyll inn kontaktperson"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Rolle
                    </label>
                    <input
                      type="text"
                      value={formData.contactPerson}
                      onChange={(e) => setFormData({
                        ...formData, 
                        contactPerson: e.target.value
                      })}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Telefon
                    </label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({
                        ...formData, 
                        phone: e.target.value
                      })}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Fyll inn telefonnummer"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      E-post
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({
                        ...formData, 
                        email: e.target.value
                      })}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Fyll inn e-postadresse"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-6">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
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
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  <span>{saving ? 'Lagrer...' : 'Lagre'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Partner Modal */}
      {showEditModal && selectedPartner && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Rediger samarbeidspartner</h2>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <form onSubmit={handleUpdate} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Bedriftsnavn *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Fyll inn bedriftsnavn"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Organisasjonsnummer *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.orgNumber}
                      onChange={(e) => setFormData({...formData, orgNumber: e.target.value})}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Fyll inn organisasjonsnummer"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Intern navn
                    </label>
                    <input
                      type="text"
                      value={formData.internalName}
                      onChange={(e) => setFormData({...formData, internalName: e.target.value})}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Fyll inn intern navn"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Status
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({...formData, status: e.target.value as 'active' | 'inactive'})}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="active">Aktiv</option>
                      <option value="inactive">Inaktiv</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Adresse
                    </label>
                    <input
                      type="text"
                      value={formData.address}
                      onChange={(e) => setFormData({...formData, address: e.target.value})}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Fyll inn adresse"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Kontaktperson
                    </label>
                    <input
                      type="text"
                      value={formData.contactPerson}
                      onChange={(e) => setFormData({...formData, contactPerson: e.target.value})}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Fyll inn kontaktperson"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Telefon
                    </label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Fyll inn telefonnummer"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      E-post
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Fyll inn e-postadresse"
                    />
                  </div>
                </div>

                {/* Vehicle Section */}
                <div className="border-t pt-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-gray-900">Registrerte kjøretøy</h3>
                    <span className="text-sm text-gray-500">{vehicles.length} kjøretøy</span>
                  </div>

                  {/* Add Vehicle */}
                  <div className="bg-gray-50 rounded-lg p-4 mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="flex-1">
                        <input
                          type="text"
                          value={newRegNumber}
                          onChange={(e) => setNewRegNumber(e.target.value.toUpperCase())}
                          placeholder="Skriv inn registreringsnummer (f.eks. AB12345)"
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          disabled={isLoadingVehicle}
                        />
                      </div>
                      <button
                        type="button"
                        onClick={addVehicle}
                        disabled={isLoadingVehicle || !newRegNumber.trim()}
                        className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center space-x-2"
                      >
                        {isLoadingVehicle ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        ) : (
                          <Plus className="h-4 w-4" />
                        )}
                        <span>{isLoadingVehicle ? 'Henter...' : 'Legg til'}</span>
                      </button>
                    </div>
                    {vehicleError && (
                      <p className="text-red-600 text-sm mt-2">{vehicleError}</p>
                    )}
                  </div>

                  {/* Vehicle List */}
                  {vehicles.length > 0 && (
                    <div className="space-y-3">
                      {vehicles.map((vehicle) => (
                        <div key={vehicle.id} className="bg-white border border-gray-200 rounded-lg p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-3 mb-2">
                                <h4 className="text-lg font-semibold text-gray-900">{vehicle.regNumber}</h4>
                                <button
                                  type="button"
                                  onClick={() => openVehicleModal(vehicle)}
                                  className="text-blue-600 hover:text-blue-800 text-sm underline"
                                >
                                  Se detaljer
                                </button>
                              </div>
                              
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                                {vehicle.manufacturer && (
                                  <div className="flex items-center space-x-2">
                                    <span className="text-gray-600">Produsent:</span>
                                    <span className="font-medium">{vehicle.manufacturer}</span>
                                  </div>
                                )}
                                {vehicle.brand && (
                                  <div className="flex items-center space-x-2">
                                    <span className="text-gray-600">Merke:</span>
                                    <span className="font-medium">{vehicle.brand}</span>
                                  </div>
                                )}
                                {vehicle.model && (
                                  <div className="flex items-center space-x-2">
                                    <span className="text-gray-600">Modell:</span>
                                    <span className="font-medium">{vehicle.model}</span>
                                  </div>
                                )}
                                {vehicle.bodyType && (
                                  <div className="flex items-center space-x-2">
                                    <span className="text-gray-600">Karosseri:</span>
                                    <span className="font-medium">{vehicle.bodyType}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                            
                            <button
                              type="button"
                              onClick={() => removeVehicle(vehicle.id)}
                              className="text-red-600 hover:text-red-800 ml-4"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {vehicles.length === 0 && (
                    <div className="text-center py-8 bg-gray-50 rounded-lg">
                      <div className="text-gray-400 mb-2">
                        <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                        </svg>
                      </div>
                      <p className="text-gray-600">Ingen kjøretøy registrert</p>
                      <p className="text-sm text-gray-500">Legg til kjøretøy ved å skrive inn registreringsnummer</p>
                    </div>
                  )}
                </div>

                <div className="flex justify-end space-x-3 pt-6">
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
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
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                    <span>{saving ? 'Lagrer...' : 'Oppdater'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedPartner && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <Trash2 className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Slett samarbeidspartner</h3>
                <p className="text-sm text-gray-600">Denne handlingen kan ikke angres</p>
              </div>
            </div>
            
            <p className="text-gray-700 mb-6">
              Er du sikker på at du vil slette <strong>{selectedPartner.name}</strong>? 
              Dette vil permanent fjerne all informasjon om denne samarbeidspartneren.
            </p>
            
            <div className="flex space-x-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Avbryt
              </button>
              <button
                onClick={handleDelete}
                disabled={saving}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {saving ? 'Sletter...' : 'Slett'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Company Detail Modal */}
      {showDetailModal && selectedPartnerForDetail && (
        <CompanyDetailModal
          isOpen={showDetailModal}
          onClose={() => setShowDetailModal(false)}
          orgNumber={selectedPartnerForDetail.orgNumber}
          companyName={selectedPartnerForDetail.name}
        />
      )}

      {/* Vehicle Detail Modal */}
      {showVehicleModal && selectedVehicle && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <svg className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">Kjøretøydetaljer</h2>
                    <p className="text-sm text-gray-600">Registreringsnummer: {selectedVehicle.regNumber}</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowVehicleModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-6">
                {/* Basic Information */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Grunnleggende informasjon</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedVehicle.manufacturer && (
                      <div>
                        <span className="text-sm font-medium text-gray-700">Produsent:</span>
                        <p className="text-sm text-gray-900">{selectedVehicle.manufacturer}</p>
                      </div>
                    )}
                    {selectedVehicle.brand && (
                      <div>
                        <span className="text-sm font-medium text-gray-700">Merke:</span>
                        <p className="text-sm text-gray-900">{selectedVehicle.brand}</p>
                      </div>
                    )}
                    {selectedVehicle.model && (
                      <div>
                        <span className="text-sm font-medium text-gray-700">Modellbetegnelse:</span>
                        <p className="text-sm text-gray-900">{selectedVehicle.model}</p>
                      </div>
                    )}
                    {selectedVehicle.variant && (
                      <div>
                        <span className="text-sm font-medium text-gray-700">Variant:</span>
                        <p className="text-sm text-gray-900">{selectedVehicle.variant}</p>
                      </div>
                    )}
                    {selectedVehicle.bodyType && (
                      <div>
                        <span className="text-sm font-medium text-gray-700">Ramme/karosseri:</span>
                        <p className="text-sm text-gray-900">{selectedVehicle.bodyType}</p>
                      </div>
                    )}
                    {selectedVehicle.vehicleGroup && (
                      <div>
                        <span className="text-sm font-medium text-gray-700">Kjøretøygruppe:</span>
                        <p className="text-sm text-gray-900">{selectedVehicle.vehicleGroup}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Registration Information */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Registreringsinformasjon</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedVehicle.firstRegistered && (
                      <div>
                        <span className="text-sm font-medium text-gray-700">Førstegangsregistrert:</span>
                        <p className="text-sm text-gray-900">{selectedVehicle.firstRegistered}</p>
                      </div>
                    )}
                    {selectedVehicle.lastEUApproved && (
                      <div>
                        <span className="text-sm font-medium text-gray-700">Sist EU-godkjent:</span>
                        <p className="text-sm text-gray-900">{selectedVehicle.lastEUApproved}</p>
                      </div>
                    )}
                    {selectedVehicle.nextEUInspection && (
                      <div>
                        <span className="text-sm font-medium text-gray-700">Neste EU-kontroll:</span>
                        <p className="text-sm text-gray-900">{selectedVehicle.nextEUInspection}</p>
                      </div>
                    )}
                    {selectedVehicle.maxPayload && (
                      <div>
                        <span className="text-sm font-medium text-gray-700">Maks nyttelast:</span>
                        <p className="text-sm text-gray-900">{selectedVehicle.maxPayload}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Data Source */}
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="flex items-center space-x-2">
                    <ExternalLink className="h-4 w-4 text-blue-600" />
                    <span className="text-sm text-blue-800">Data hentet fra regnr.info</span>
                  </div>
                  {selectedVehicle.fetchedAt && (
                    <p className="text-xs text-blue-600 mt-1">
                      Hentet: {new Date(selectedVehicle.fetchedAt).toLocaleString('no-NO')}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex justify-end pt-6">
                <button
                  onClick={() => setShowVehicleModal(false)}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                >
                  Lukk
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}