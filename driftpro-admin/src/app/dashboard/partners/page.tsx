'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Eye, 
  X, 
  Save, 
  ExternalLink,
  Upload,
  Image as ImageIcon,
  FileText,
  Car,
  Building,
  MapPin,
  Phone,
  Mail,
  Users
} from 'lucide-react';
import { 
  collection, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  serverTimestamp 
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '@/lib/firebase';

// Clean interfaces
interface Partner {
  id: string;
  name: string;
  organizationNumber: string;
  internalName: string;
  phone: string;
  contactPerson: string;
  email: string;
  website: string;
  industry: string;
  employees: number;
  revenue: number;
  description: string;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
  // Address fields as separate properties
  street?: string;
  city?: string;
  postalCode?: string;
  // Brreg data as separate properties
  brregAntallAnsatte?: string;
  brregDagligLeder?: string;
  brregForretningsadresse?: string;
  brregNaeringskode?: string;
  brregOrganisasjonsform?: string;
  brregPostadresse?: string;
  brregRegistreringsdato?: string;
  brregRegnskapsforer?: string;
  // Arrays
  vehicles: Vehicle[];
  images: string[];
  documents: Document[];
}

interface Vehicle {
  id: string;
  regNumber: string;
  manufacturer: string;
  brand: string;
  model: string;
  variant: string;
  bodyType: string;
  vehicleGroup: string;
  firstRegistered: string;
  lastEUApproved: string;
  nextEUInspection: string;
  maxPayload: string;
  fetchedAt: string;
  description?: string;
}

interface Document {
  id: string;
  name: string;
  type: 'image' | 'document';
  url: string;
  uploadedAt: string;
  description?: string;
}

interface PartnerFormData {
  name: string;
  organizationNumber: string;
  internalName: string;
  phone: string;
  contactPerson: string;
  email: string;
  website: string;
  industry: string;
  employees: number;
  revenue: number;
  description: string;
  status: 'active' | 'inactive';
  street: string;
  city: string;
  postalCode: string;
}

interface VehicleFormData {
  regNumber: string;
  description?: string;
}

export default function PartnersPage() {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showVehicleModal, setShowVehicleModal] = useState(false);
  const [showFileUploadModal, setShowFileUploadModal] = useState(false);
  const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null);
  const [selectedPartnerForVehicle, setSelectedPartnerForVehicle] = useState<Partner | null>(null);
  const [selectedPartnerForFiles, setSelectedPartnerForFiles] = useState<Partner | null>(null);
  const [uploadingVehicle, setUploadingVehicle] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const [vehicleFormData, setVehicleFormData] = useState<VehicleFormData>({
    regNumber: '',
    description: ''
  });
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [fileDescriptions, setFileDescriptions] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState<PartnerFormData>({
    name: '',
    organizationNumber: '',
    internalName: '',
    phone: '',
    contactPerson: '',
    email: '',
    website: '',
    industry: '',
    employees: 0,
    revenue: 0,
    description: '',
    status: 'active',
    street: '',
    city: '',
    postalCode: ''
  });

  // Load partners from Firebase
  const loadPartners = useCallback(async () => {
    setLoading(true);
    try {
      if (!db) {
        console.error('Firebase not initialized');
        return;
      }

      const partnersSnapshot = await getDocs(collection(db, 'partners'));
      const partnersData: Partner[] = [];

      partnersSnapshot.forEach((doc) => {
        const data = doc.data();
        
        try {
          // Handle timestamps
          let createdAt = new Date().toISOString();
          if (data.createdAt?.toDate) {
            createdAt = data.createdAt.toDate().toISOString();
          } else if (data.createdAt instanceof Date) {
            createdAt = data.createdAt.toISOString();
          } else if (typeof data.createdAt === 'string') {
            createdAt = data.createdAt;
          }

          let updatedAt = new Date().toISOString();
          if (data.updatedAt?.toDate) {
            updatedAt = data.updatedAt.toDate().toISOString();
          } else if (data.updatedAt instanceof Date) {
            updatedAt = data.updatedAt.toISOString();
          } else if (typeof data.updatedAt === 'string') {
            updatedAt = data.updatedAt;
          }

          // Handle address - extract from object or use separate fields
          let street = '';
          let city = '';
          let postalCode = '';

          if (data.address && typeof data.address === 'object') {
            street = data.address.street || '';
            city = data.address.city || '';
            postalCode = data.address.postalCode || '';
          } else {
            street = data.street || '';
            city = data.city || '';
            postalCode = data.postalCode || '';
          }

          // Handle brreg data - extract from object or use separate fields
          let brregAntallAnsatte = '';
          let brregDagligLeder = '';
          let brregForretningsadresse = '';
          let brregNaeringskode = '';
          let brregOrganisasjonsform = '';
          let brregPostadresse = '';
          let brregRegistreringsdato = '';
          let brregRegnskapsforer = '';

          if (data.brregData && typeof data.brregData === 'object') {
            brregAntallAnsatte = data.brregData.antallAnsatte || '';
            brregDagligLeder = data.brregData.dagligLeder || '';
            brregForretningsadresse = data.brregData.forretningsadresse || '';
            brregNaeringskode = data.brregData.naeringskode || '';
            brregOrganisasjonsform = data.brregData.organisasjonsform || '';
            brregPostadresse = data.brregData.postadresse || '';
            brregRegistreringsdato = data.brregData.registreringsdato || '';
            brregRegnskapsforer = data.brregData.regnskapsforer || '';
          }

          // Handle contactPerson - extract from object or use as string
          let contactPerson = '';
          if (data.contactPerson && typeof data.contactPerson === 'object') {
            contactPerson = data.contactPerson.name || data.contactPerson.email || '';
          } else {
            contactPerson = data.contactPerson || '';
          }

          const partner: Partner = {
            id: doc.id,
            name: data.name || '',
            organizationNumber: data.organizationNumber || '',
            internalName: data.internalName || '',
            phone: data.phone || '',
            contactPerson: contactPerson,
            email: data.email || '',
            website: data.website || '',
            industry: data.industry || '',
            employees: data.employees || 0,
            revenue: data.revenue || 0,
            description: data.description || '',
            status: data.status || 'active',
            createdAt,
            updatedAt,
            street,
            city,
            postalCode,
            brregAntallAnsatte,
            brregDagligLeder,
            brregForretningsadresse,
            brregNaeringskode,
            brregOrganisasjonsform,
            brregPostadresse,
            brregRegistreringsdato,
            brregRegnskapsforer,
            vehicles: Array.isArray(data.vehicles) ? data.vehicles.map((v: Vehicle) => ({
              id: v.id || '',
              regNumber: v.regNumber || '',
              manufacturer: v.manufacturer || '',
              brand: v.brand || '',
              model: v.model || '',
              variant: v.variant || '',
              bodyType: v.bodyType || '',
              vehicleGroup: v.vehicleGroup || '',
              firstRegistered: v.firstRegistered || '',
              lastEUApproved: v.lastEUApproved || '',
              nextEUInspection: v.nextEUInspection || '',
              maxPayload: v.maxPayload || '',
              fetchedAt: v.fetchedAt || '',
              description: v.description || ''
            })) : [],
            images: Array.isArray(data.images) ? data.images.filter((img: string) => typeof img === 'string') : [],
            documents: Array.isArray(data.documents) ? data.documents.map((doc: Document) => ({
              id: doc.id || '',
              name: doc.name || '',
              type: doc.type || 'document',
              url: doc.url || '',
              uploadedAt: doc.uploadedAt || new Date().toISOString(),
              description: doc.description || ''
            })) : []
          };

          partnersData.push(partner);
        } catch (error) {
          console.error('Error processing partner data:', error);
          console.error('Partner ID:', doc.id);
          console.error('Raw data:', data);
        }
      });

      setPartners(partnersData);
    } catch (error) {
      console.error('Error loading partners:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPartners();
  }, [loadPartners]);

  // Filter partners
  const filteredPartners = partners.filter(partner => {
    const matchesSearch = partner.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         partner.organizationNumber.includes(searchTerm) ||
                         partner.internalName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || partner.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Fetch data from brreg.no
  const fetchBrregData = async (orgNumber: string) => {
    try {
      const response = await fetch(`https://data.brreg.no/enhetsregisteret/api/enheter/${orgNumber}`);
      if (response.ok) {
        const data = await response.json();
        return {
          antallAnsatte: data.antall_ansatte || '',
          dagligLeder: data.daglig_leder?.navn || '',
          forretningsadresse: data.forretningsadresse?.adresse?.join(', ') || '',
          naeringskode: data.naeringskoder?.[0]?.kode || '',
          organisasjonsform: data.organisasjonsform?.beskrivelse || '',
          postadresse: data.postadresse?.adresse?.join(', ') || '',
          registreringsdato: data.stiftelsesdato || '',
          regnskapsforer: data.regnskapsforer?.navn || ''
        };
      }
    } catch (error) {
      console.error('Error fetching brreg data:', error);
    }
    return null;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (!db) {
        console.error('Firebase not initialized');
        return;
      }

      // Fetch brreg data if organization number is provided
      let brregData = null;
      if (formData.organizationNumber) {
        brregData = await fetchBrregData(formData.organizationNumber);
      }

      const partnerData = {
        ...formData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        vehicles: [],
        images: [],
        documents: [],
        ...(brregData && {
          brregAntallAnsatte: brregData.antallAnsatte,
          brregDagligLeder: brregData.dagligLeder,
          brregForretningsadresse: brregData.forretningsadresse,
          brregNaeringskode: brregData.naeringskode,
          brregOrganisasjonsform: brregData.organisasjonsform,
          brregPostadresse: brregData.postadresse,
          brregRegistreringsdato: brregData.registreringsdato,
          brregRegnskapsforer: brregData.regnskapsforer
        })
      };

      await addDoc(collection(db, 'partners'), partnerData);
      
      setShowAddModal(false);
      setFormData({
        name: '',
        organizationNumber: '',
        internalName: '',
        phone: '',
        contactPerson: '',
        email: '',
        website: '',
        industry: '',
        employees: 0,
        revenue: 0,
        description: '',
        status: 'active',
        street: '',
        city: '',
        postalCode: ''
      });
      
      loadPartners();
    } catch (error) {
      console.error('Error adding partner:', error);
    }
  };

  // Delete partner
  const deletePartner = async (partnerId: string) => {
    if (!confirm('Er du sikker på at du vil slette denne samarbeidspartneren?')) return;
    
    try {
      if (!db) return;

      await deleteDoc(doc(db, 'partners', partnerId));
      loadPartners();
    } catch (error) {
      console.error('Error deleting partner:', error);
    }
  };

  // Fetch vehicle data from regnr.info
  const fetchVehicleData = async (regNumber: string) => {
    try {
      const response = await fetch(`https://regnr.info/api/v1/vehicle/${regNumber}`);
      if (response.ok) {
        const data = await response.json();
        return {
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
      }
    } catch (error) {
      console.error('Error fetching vehicle data:', error);
    }
    return null;
  };

  // Add vehicle to partner
  const addVehicleToPartner = async (partnerId: string, vehicleData: VehicleFormData) => {
    setUploadingVehicle(true);
    try {
      if (!db) return;

      // Fetch vehicle data from regnr.info
      const regnrData = await fetchVehicleData(vehicleData.regNumber);
      if (!regnrData) {
        throw new Error('Kunne ikke hente kjøretøydata fra regnr.info');
      }

      const newVehicle: Vehicle = {
        id: Date.now().toString(),
        regNumber: vehicleData.regNumber.toUpperCase(),
        ...regnrData,
        description: vehicleData.description || ''
      };

      // Update partner with new vehicle
      const partnerRef = doc(db, 'partners', partnerId);
      await updateDoc(partnerRef, {
        vehicles: [...(selectedPartnerForVehicle?.vehicles || []), newVehicle],
        updatedAt: serverTimestamp()
      });

      // Refresh partners data
      await loadPartners();
      setShowVehicleModal(false);
      setVehicleFormData({ regNumber: '', description: '' });
      setSelectedPartnerForVehicle(null);
    } catch (error) {
      console.error('Error adding vehicle:', error);
      alert('Feil ved registrering av kjøretøy: ' + (error as Error).message);
    } finally {
      setUploadingVehicle(false);
    }
  };

  // Handle file upload
  const handleFileUpload = async () => {
    setUploadingFiles(true);
    try {
      if (!db || !storage || !selectedPartnerForFiles) return;

      const uploadedFiles: Document[] = [];

      for (const file of selectedFiles) {
        const fileName = `${selectedPartnerForFiles.id}/${Date.now()}_${file.name}`;
        const storageRef = ref(storage, `partner-files/${fileName}`);
        
        await uploadBytes(storageRef, file);
        const downloadURL = await getDownloadURL(storageRef);

        const document: Document = {
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          name: file.name,
          type: file.type.startsWith('image/') ? 'image' : 'document',
          url: downloadURL,
          uploadedAt: new Date().toISOString(),
          description: fileDescriptions[file.name] || ''
        };

        uploadedFiles.push(document);
      }

      // Update partner with new files
      const partnerRef = doc(db, 'partners', selectedPartnerForFiles.id);
      const currentImages = selectedPartnerForFiles.images || [];
      const currentDocuments = selectedPartnerForFiles.documents || [];

      const newImages = uploadedFiles.filter(f => f.type === 'image').map(f => f.url);
      const newDocuments = uploadedFiles.filter(f => f.type === 'document');

      await updateDoc(partnerRef, {
        images: [...currentImages, ...newImages],
        documents: [...currentDocuments, ...newDocuments],
        updatedAt: serverTimestamp()
      });

      // Refresh partners data
      await loadPartners();
      setShowFileUploadModal(false);
      setSelectedFiles([]);
      setFileDescriptions({});
      setSelectedPartnerForFiles(null);
    } catch (error) {
      console.error('Error uploading files:', error);
      alert('Feil ved opplasting av filer: ' + (error as Error).message);
    } finally {
      setUploadingFiles(false);
    }
  };

  // Handle file selection
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setSelectedFiles(files);
    
    // Initialize descriptions for new files
    const newDescriptions: Record<string, string> = {};
    files.forEach(file => {
      if (!fileDescriptions[file.name]) {
        newDescriptions[file.name] = '';
      }
    });
    setFileDescriptions(prev => ({ ...prev, ...newDescriptions }));
  };

  // Remove vehicle from partner
  const removeVehicleFromPartner = async (partnerId: string, vehicleId: string) => {
    try {
      if (!db) return;

      const partner = partners.find(p => p.id === partnerId);
      if (!partner) return;

      const updatedVehicles = partner.vehicles.filter(v => v.id !== vehicleId);
      
      const partnerRef = doc(db, 'partners', partnerId);
      await updateDoc(partnerRef, {
        vehicles: updatedVehicles,
        updatedAt: serverTimestamp()
      });

      await loadPartners();
    } catch (error) {
      console.error('Error removing vehicle:', error);
      alert('Feil ved sletting av kjøretøy');
    }
  };

  // Remove file from partner
  const removeFileFromPartner = async (partnerId: string, fileId: string, fileType: 'image' | 'document') => {
    try {
      if (!db) return;

      const partner = partners.find(p => p.id === partnerId);
      if (!partner) return;

      if (fileType === 'image') {
        const updatedImages = partner.images.filter((_, index) => index.toString() !== fileId);
        const partnerRef = doc(db, 'partners', partnerId);
        await updateDoc(partnerRef, {
          images: updatedImages,
          updatedAt: serverTimestamp()
        });
      } else {
        const updatedDocuments = partner.documents.filter(d => d.id !== fileId);
        const partnerRef = doc(db, 'partners', partnerId);
        await updateDoc(partnerRef, {
          documents: updatedDocuments,
          updatedAt: serverTimestamp()
        });
      }

      await loadPartners();
    } catch (error) {
      console.error('Error removing file:', error);
      alert('Feil ved sletting av fil');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-6 p-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Samarbeidspartnere</h1>
          <p className="text-gray-600">Administrer samarbeidspartnere og deres kjøretøy</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          <span>Legg til partner</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow mb-6 mx-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Søk etter navn, organisasjonsnummer..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
            />
          </div>
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'inactive')}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
            >
              <option value="all">Alle statuser</option>
              <option value="active">Aktive</option>
              <option value="inactive">Inaktive</option>
            </select>
          </div>
        </div>
      </div>

      {/* Partners Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 px-6">
        {filteredPartners.map((partner) => (
          <div key={partner.id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{partner.name}</h3>
                <p className="text-sm text-gray-600">{partner.internalName}</p>
              </div>
              <span className={`px-2 py-1 text-xs rounded-full ${
                partner.status === 'active' 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                {partner.status === 'active' ? 'Aktiv' : 'Inaktiv'}
              </span>
            </div>

            <div className="space-y-2 mb-4">
              <div className="flex items-center space-x-2">
                <Building className="h-4 w-4 text-gray-400" />
                <span className="text-sm text-gray-600">Org.nr:</span>
                <span className="text-sm font-medium text-gray-900">{partner.organizationNumber}</span>
              </div>
              
              {partner.street && (
                <div className="flex items-center space-x-2">
                  <MapPin className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-600">Adresse:</span>
                  <span className="text-sm font-medium text-gray-900">
                    {partner.street}, {partner.city} {partner.postalCode}
                  </span>
                </div>
              )}

              {partner.phone && (
                <div className="flex items-center space-x-2">
                  <Phone className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-600">Telefon:</span>
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

              {partner.brregAntallAnsatte && (
                <div className="flex items-center space-x-2">
                  <Users className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-600">Ansatte:</span>
                  <span className="text-sm font-medium text-gray-900">{partner.brregAntallAnsatte}</span>
                </div>
              )}

              {partner.vehicles.length > 0 && (
                <div className="flex items-center space-x-2">
                  <Car className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-600">Kjøretøy:</span>
                  <span className="text-sm font-medium text-gray-900">{partner.vehicles.length}</span>
                </div>
              )}
            </div>

            <div className="flex justify-between items-center">
              <button
                onClick={() => {
                  setSelectedPartner(partner);
                  setShowDetailModal(true);
                }}
                className="text-blue-600 hover:text-blue-800 flex items-center space-x-1"
              >
                <Eye className="h-4 w-4" />
                <span>Se detaljer</span>
              </button>
              
              <div className="flex space-x-2">
                <button
                  onClick={() => {
                    setSelectedPartnerForVehicle(partner);
                    setShowVehicleModal(true);
                  }}
                  className="text-green-600 hover:text-green-800 flex items-center space-x-1"
                >
                  <Car className="h-4 w-4" />
                  <span>Legg til kjøretøy</span>
                </button>
                <button
                  onClick={() => {
                    setSelectedPartnerForFiles(partner);
                    setShowFileUploadModal(true);
                  }}
                  className="text-purple-600 hover:text-purple-800 flex items-center space-x-1"
                >
                  <Upload className="h-4 w-4" />
                  <span>Last opp filer</span>
                </button>
                <button
                  onClick={() => deletePartner(partner.id)}
                  className="text-red-600 hover:text-red-800"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add Partner Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Legg til samarbeidspartner</h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Bedriftsnavn *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Organisasjonsnummer
                  </label>
                  <input
                    type="text"
                    value={formData.organizationNumber}
                    onChange={(e) => setFormData({...formData, organizationNumber: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                    placeholder="123456789"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Intern navn
                  </label>
                  <input
                    type="text"
                    value={formData.internalName}
                    onChange={(e) => setFormData({...formData, internalName: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Telefon
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Kontaktperson
                  </label>
                  <input
                    type="text"
                    value={formData.contactPerson}
                    onChange={(e) => setFormData({...formData, contactPerson: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    E-post
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nettsted
                  </label>
                  <input
                    type="url"
                    value={formData.website}
                    onChange={(e) => setFormData({...formData, website: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Bransje
                  </label>
                  <input
                    type="text"
                    value={formData.industry}
                    onChange={(e) => setFormData({...formData, industry: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Antall ansatte
                  </label>
                  <input
                    type="number"
                    value={formData.employees}
                    onChange={(e) => setFormData({...formData, employees: parseInt(e.target.value) || 0})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Omsetning (NOK)
                  </label>
                  <input
                    type="number"
                    value={formData.revenue}
                    onChange={(e) => setFormData({...formData, revenue: parseInt(e.target.value) || 0})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({...formData, status: e.target.value as 'active' | 'inactive'})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                  >
                    <option value="active">Aktiv</option>
                    <option value="inactive">Inaktiv</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Gateadresse
                </label>
                <input
                  type="text"
                  value={formData.street}
                  onChange={(e) => setFormData({...formData, street: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Poststed
                  </label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({...formData, city: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Postnummer
                  </label>
                  <input
                    type="text"
                    value={formData.postalCode}
                    onChange={(e) => setFormData({...formData, postalCode: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Beskrivelse
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                />
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300"
                >
                  Avbryt
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2"
                >
                  <Save className="h-4 w-4" />
                  <span>Lagre partner</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Partner Detail Modal */}
      {showDetailModal && selectedPartner && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">{selectedPartner.name}</h2>
              <button
                onClick={() => setShowDetailModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Basic Information */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Grunnleggende informasjon</h3>
                <div className="space-y-2">
                  <div>
                    <span className="text-sm text-gray-600">Intern navn:</span>
                    <p className="font-medium">{selectedPartner.internalName || 'Ikke tilgjengelig'}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">Organisasjonsnummer:</span>
                    <p className="font-medium">{selectedPartner.organizationNumber || 'Ikke tilgjengelig'}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">Status:</span>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      selectedPartner.status === 'active' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {selectedPartner.status === 'active' ? 'Aktiv' : 'Inaktiv'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Kontaktinformasjon</h3>
                <div className="space-y-2">
                  {selectedPartner.contactPerson && (
                    <div>
                      <span className="text-sm text-gray-600">Kontaktperson:</span>
                      <p className="font-medium">{selectedPartner.contactPerson}</p>
                    </div>
                  )}
                  {selectedPartner.phone && (
                    <div>
                      <span className="text-sm text-gray-600">Telefon:</span>
                      <p className="font-medium">{selectedPartner.phone}</p>
                    </div>
                  )}
                  {selectedPartner.email && (
                    <div>
                      <span className="text-sm text-gray-600">E-post:</span>
                      <p className="font-medium">{selectedPartner.email}</p>
                    </div>
                  )}
                  {selectedPartner.website && (
                    <div>
                      <span className="text-sm text-gray-600">Nettsted:</span>
                      <p className="font-medium">{selectedPartner.website}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Address */}
              {(selectedPartner.street || selectedPartner.city || selectedPartner.postalCode) && (
                <div>
                  <h3 className="text-lg font-semibold mb-3">Adresse</h3>
                  <div className="space-y-2">
                    {selectedPartner.street && (
                      <div>
                        <span className="text-sm text-gray-600">Gateadresse:</span>
                        <p className="font-medium">{selectedPartner.street}</p>
                      </div>
                    )}
                    {(selectedPartner.city || selectedPartner.postalCode) && (
                      <div>
                        <span className="text-sm text-gray-600">Poststed:</span>
                        <p className="font-medium">{selectedPartner.city || ''} {selectedPartner.postalCode || ''}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Brreg Data */}
              {(selectedPartner.brregAntallAnsatte || selectedPartner.brregDagligLeder || selectedPartner.brregOrganisasjonsform) && (
                <div>
                  <h3 className="text-lg font-semibold mb-3">Brreg data</h3>
                  <div className="space-y-2">
                    {selectedPartner.brregAntallAnsatte && (
                      <div>
                        <span className="text-sm text-gray-600">Antall ansatte:</span>
                        <p className="font-medium">{selectedPartner.brregAntallAnsatte}</p>
                      </div>
                    )}
                    {selectedPartner.brregDagligLeder && (
                      <div>
                        <span className="text-sm text-gray-600">Daglig leder:</span>
                        <p className="font-medium">{selectedPartner.brregDagligLeder}</p>
                      </div>
                    )}
                    {selectedPartner.brregOrganisasjonsform && (
                      <div>
                        <span className="text-sm text-gray-600">Organisasjonsform:</span>
                        <p className="font-medium">{selectedPartner.brregOrganisasjonsform}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Vehicles */}
              {selectedPartner.vehicles && selectedPartner.vehicles.length > 0 && (
                <div className="md:col-span-2">
                  <h3 className="text-lg font-semibold mb-3">Kjøretøy ({selectedPartner.vehicles.length})</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedPartner.vehicles.map((vehicle) => (
                      <div key={vehicle.id} className="border rounded-lg p-3">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-medium">{vehicle.regNumber || 'Ukjent'}</h4>
                          <button
                            onClick={() => removeVehicleFromPartner(selectedPartner.id, vehicle.id)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                        <div className="text-sm text-gray-600 space-y-1">
                          <p>Merke: {vehicle.brand || 'Ikke tilgjengelig'}</p>
                          <p>Modell: {vehicle.model || 'Ikke tilgjengelig'}</p>
                          <p>Type: {vehicle.bodyType || 'Ikke tilgjengelig'}</p>
                          <p>Først registrert: {vehicle.firstRegistered || 'Ikke tilgjengelig'}</p>
                          <p>Neste EU-kontroll: {vehicle.nextEUInspection || 'Ikke tilgjengelig'}</p>
                          {vehicle.description && (
                            <p className="text-xs text-gray-500 mt-2">Beskrivelse: {vehicle.description}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Documents and Images */}
              {((selectedPartner.documents && selectedPartner.documents.length > 0) || (selectedPartner.images && selectedPartner.images.length > 0)) && (
                <div className="md:col-span-2">
                  <h3 className="text-lg font-semibold mb-3">Dokumenter og bilder</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {selectedPartner.documents && selectedPartner.documents.map((doc) => (
                      <div key={doc.id} className="border rounded-lg p-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <FileText className="h-4 w-4 text-gray-400" />
                            <span className="text-sm font-medium">{doc.name || 'Ukjent dokument'}</span>
                          </div>
                          <button
                            onClick={() => removeFileFromPartner(selectedPartner.id, doc.id, 'document')}
                            className="text-red-600 hover:text-red-800"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                        {doc.description && (
                          <p className="text-xs text-gray-500 mt-1">{doc.description}</p>
                        )}
                        <a
                          href={doc.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-600 hover:text-blue-800 mt-2 inline-block"
                        >
                          Åpne fil
                        </a>
                      </div>
                    ))}
                    {selectedPartner.images && selectedPartner.images.map((image, index) => (
                      <div key={index} className="border rounded-lg p-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <ImageIcon className="h-4 w-4 text-gray-400" />
                            <span className="text-sm font-medium">Bilde {index + 1}</span>
                          </div>
                          <button
                            onClick={() => removeFileFromPartner(selectedPartner.id, index.toString(), 'image')}
                            className="text-red-600 hover:text-red-800"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                        <a
                          href={image}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-600 hover:text-blue-800 mt-2 inline-block"
                        >
                          Åpne bilde
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Vehicle Registration Modal */}
      {showVehicleModal && selectedPartnerForVehicle && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Registrer kjøretøy</h2>
              <button
                onClick={() => {
                  setShowVehicleModal(false);
                  setSelectedPartnerForVehicle(null);
                  setVehicleFormData({ regNumber: '', description: '' });
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={(e) => {
              e.preventDefault();
              addVehicleToPartner(selectedPartnerForVehicle.id, vehicleFormData);
            }}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Registreringsnummer *
                  </label>
                  <input
                    type="text"
                    value={vehicleFormData.regNumber}
                    onChange={(e) => setVehicleFormData({...vehicleFormData, regNumber: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                    placeholder="AB12345"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Data vil automatisk hentes fra regnr.info
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Beskrivelse (valgfritt)
                  </label>
                  <textarea
                    value={vehicleFormData.description}
                    onChange={(e) => setVehicleFormData({...vehicleFormData, description: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                    rows={3}
                    placeholder="Ekstra informasjon om kjøretøyet..."
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowVehicleModal(false);
                    setSelectedPartnerForVehicle(null);
                    setVehicleFormData({ regNumber: '', description: '' });
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300"
                >
                  Avbryt
                </button>
                <button
                  type="submit"
                  disabled={uploadingVehicle}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center space-x-2"
                >
                  {uploadingVehicle ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Registrerer...</span>
                    </>
                  ) : (
                    <>
                      <Car className="h-4 w-4" />
                      <span>Registrer kjøretøy</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* File Upload Modal */}
      {showFileUploadModal && selectedPartnerForFiles && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Last opp filer</h2>
              <button
                onClick={() => {
                  setShowFileUploadModal(false);
                  setSelectedPartnerForFiles(null);
                  setSelectedFiles([]);
                  setFileDescriptions({});
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Velg filer
                </label>
                <input
                  type="file"
                  multiple
                  onChange={handleFileSelect}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Støttede formater: Bilder, PDF, Word, Excel, tekstfiler
                </p>
              </div>

              {selectedFiles.length > 0 && (
                <div>
                  <h3 className="text-lg font-medium mb-3">Valgte filer</h3>
                  <div className="space-y-3">
                    {selectedFiles.map((file, index) => (
                      <div key={index} className="flex items-center space-x-3 p-3 border rounded-lg">
                        <div className="flex-shrink-0">
                          {file.type.startsWith('image/') ? (
                            <ImageIcon className="h-6 w-6 text-blue-600" />
                          ) : (
                            <FileText className="h-6 w-6 text-gray-600" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
                          <p className="text-xs text-gray-500">
                            {(file.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                        <div className="flex-shrink-0">
                          <input
                            type="text"
                            placeholder="Beskrivelse (valgfritt)"
                            value={fileDescriptions[file.name] || ''}
                            onChange={(e) => setFileDescriptions(prev => ({
                              ...prev,
                              [file.name]: e.target.value
                            }))}
                            className="px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowFileUploadModal(false);
                    setSelectedPartnerForFiles(null);
                    setSelectedFiles([]);
                    setFileDescriptions({});
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300"
                >
                  Avbryt
                </button>
                <button
                  onClick={handleFileUpload}
                  disabled={uploadingFiles || selectedFiles.length === 0}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center space-x-2"
                >
                  {uploadingFiles ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Laster opp...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4" />
                      <span>Last opp filer</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 