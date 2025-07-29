'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Building,
  Phone,
  Mail,
  MapPin,
  Users,
  Download,
  Upload,
  FileSpreadsheet,
  ChevronDown,
  Save,
  X,
  Check,
  ExternalLink,
  AlertCircle
} from 'lucide-react';
import { collection, addDoc, updateDoc, deleteDoc, doc, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import * as XLSX from 'xlsx';

interface Partner {
  id: string;
  name: string;
  orgNumber: string;
  internalName: string;
  phone: string;
  email: string;
  address: {
    street: string;
    city: string;
    postalCode: string;
  };
  contactPerson: {
    name: string;
    phone: string;
    email: string;
    role: string;
  };
  brregData: {
    dagligLeder?: string;
    styreleder?: string;
    regnskapsforer?: string;
    [key: string]: string | undefined;
  };
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

export default function PartnersPage() {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [filteredPartners, setFilteredPartners] = useState<Partner[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [brregLoading, setBrregLoading] = useState(false);
  const [orgNumbers, setOrgNumbers] = useState('');
  const [brregResults, setBrregResults] = useState<any[]>([]);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    orgNumber: '',
    internalName: '',
    phone: '',
    email: '',
    address: {
      street: '',
      city: '',
      postalCode: ''
    },
    contactPerson: {
      name: '',
      phone: '',
      email: '',
      role: ''
    },
    brregData: {},
    status: 'active' as 'active' | 'inactive'
  });

  useEffect(() => {
    loadPartners();
  }, []);

  useEffect(() => {
    filterPartners();
  }, [partners, searchTerm]);

  const filterPartners = useCallback(() => {
    let filtered = partners;

    if (searchTerm) {
      filtered = filtered.filter(partner => 
        partner.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        partner.internalName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        partner.orgNumber.includes(searchTerm) ||
        partner.contactPerson.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredPartners(filtered);
  }, [partners, searchTerm]);

  const loadPartners = async () => {
    try {
      setLoading(true);
      if (db) {
        const partnersQuery = collection(db, 'partners');
        const snapshot = await getDocs(partnersQuery);
        const partnersData = snapshot.docs.map(doc => ({
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

  const fetchBrregData = async (orgNumber: string) => {
    try {
      setBrregLoading(true);
      const response = await fetch(`https://data.brreg.no/enhetsregisteret/api/enheter/${orgNumber}`);
      
      if (!response.ok) {
        throw new Error('Kunne ikke hente data fra Brønnøysundregistrene');
      }

      const data = await response.json();
      
      // Extract relevant data
      const brregData: any = {
        dagligLeder: data.daglig_leder?.navn || '',
        styreleder: data.styre?.map((member: any) => member.navn).join(', ') || '',
        regnskapsforer: data.regnskapsforer?.navn || '',
        forretningsadresse: data.forretningsadresse?.adresse?.join(', ') || '',
        postadresse: data.postadresse?.adresse?.join(', ') || '',
        organisasjonsform: data.organisasjonsform?.beskrivelse || '',
        naeringskode: data.naeringskoder?.[0]?.beskrivelse || '',
        registreringsdato: data.registreringsdato || '',
        antallAnsatte: data.antall_ansatte || ''
      };

      return {
        name: data.navn || '',
        orgNumber: data.organisasjonsnummer || orgNumber,
        address: {
          street: data.forretningsadresse?.adresse?.[0] || '',
          city: data.forretningsadresse?.adresse?.[1] || '',
          postalCode: data.forretningsadresse?.postnummer || ''
        },
        brregData
      };
    } catch (error) {
      console.error('Error fetching Brreg data:', error);
      throw error;
    } finally {
      setBrregLoading(false);
    }
  };

  const handleBulkImport = async () => {
    if (!orgNumbers.trim()) {
      alert('Vennligst fyll inn organisasjonsnumre');
      return;
    }

    const orgNumberList = orgNumbers
      .split('\n')
      .map(num => num.trim())
      .filter(num => num.length > 0);

    if (orgNumberList.length === 0) {
      alert('Ingen gyldige organisasjonsnumre funnet');
      return;
    }

    try {
      setBrregLoading(true);
      const results = [];

      for (const orgNumber of orgNumberList) {
        try {
          const data = await fetchBrregData(orgNumber);
          results.push({ orgNumber, data, success: true });
        } catch (error) {
          results.push({ 
            orgNumber, 
            data: null, 
            success: false, 
            error: error instanceof Error ? error.message : 'Ukjent feil' 
          });
        }
      }

      setBrregResults(results);
    } catch (error) {
      console.error('Error in bulk import:', error);
      alert('Feil ved bulk import: ' + (error instanceof Error ? error.message : 'Ukjent feil'));
    } finally {
      setBrregLoading(false);
    }
  };

  const saveBrregResults = async () => {
    if (brregResults.length === 0) return;

    try {
      setSaving(true);
      let successCount = 0;
      let errorCount = 0;

      for (const result of brregResults) {
        if (result.success && result.data) {
          try {
            if (db) {
              await addDoc(collection(db, 'partners'), {
                ...result.data,
                internalName: result.data.name,
                phone: '',
                email: '',
                contactPerson: {
                  name: '',
                  phone: '',
                  email: '',
                  role: ''
                },
                status: 'active',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
              });
              successCount++;
            }
          } catch (error) {
            console.error('Error saving partner:', error);
            errorCount++;
          }
        } else {
          errorCount++;
        }
      }

      await loadPartners();
      setBrregResults([]);
      setOrgNumbers('');
      
      alert(`✅ Bulk import fullført!\n\n✅ ${successCount} samarbeidspartnere lagret\n❌ ${errorCount} feil`);
    } catch (error) {
      console.error('Error saving results:', error);
      alert('Feil ved lagring: ' + (error instanceof Error ? error.message : 'Ukjent feil'));
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const partnerData = {
        ...formData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      if (db) {
        await addDoc(collection(db, 'partners'), partnerData);
        await loadPartners();
        setShowAddModal(false);
        resetForm();
        alert('✅ Samarbeidspartner lagt til!');
      }
    } catch (error) {
      console.error('Error adding partner:', error);
      alert('Feil ved lagring: ' + (error instanceof Error ? error.message : 'Ukjent feil'));
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPartner) return;

    setSaving(true);

    try {
      const partnerData = {
        ...formData,
        updatedAt: new Date().toISOString()
      };

      if (db) {
        await updateDoc(doc(db, 'partners', selectedPartner.id), partnerData);
        await loadPartners();
        setShowEditModal(false);
        setSelectedPartner(null);
        resetForm();
        alert('✅ Samarbeidspartner oppdatert!');
      }
    } catch (error) {
      console.error('Error updating partner:', error);
      alert('Feil ved oppdatering: ' + (error instanceof Error ? error.message : 'Ukjent feil'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (partnerId: string) => {
    if (!confirm('Er du sikker på at du vil slette denne samarbeidspartneren?')) return;

    try {
      if (db) {
        await deleteDoc(doc(db, 'partners', partnerId));
        await loadPartners();
        alert('✅ Samarbeidspartner slettet!');
      }
    } catch (error) {
      console.error('Error deleting partner:', error);
      alert('Feil ved sletting: ' + (error instanceof Error ? error.message : 'Ukjent feil'));
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      orgNumber: '',
      internalName: '',
      phone: '',
      email: '',
      address: {
        street: '',
        city: '',
        postalCode: ''
      },
      contactPerson: {
        name: '',
        phone: '',
        email: '',
        role: ''
      },
      brregData: {},
      status: 'active'
    });
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
      brregData: partner.brregData,
      status: partner.status
    });
    setShowEditModal(true);
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
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Samarbeidspartnere</h1>
          <p className="text-gray-600">Administrer samarbeidspartnere og deres informasjon</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
        >
          <Plus className="h-5 w-5" />
          <span>Legg til samarbeidspartner</span>
        </button>
      </div>

      {/* Bulk Import Section */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Bulk Import fra Brønnøysundregistrene</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Organisasjonsnumre (ett per linje)
            </label>
            <textarea
              value={orgNumbers}
              onChange={(e) => setOrgNumbers(e.target.value)}
              className="w-full h-32 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="123456789&#10;987654321&#10;456789123"
            />
          </div>
          <div className="flex space-x-2">
            <button
              onClick={handleBulkImport}
              disabled={brregLoading || !orgNumbers.trim()}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center space-x-2 disabled:opacity-50"
            >
              {brregLoading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <ExternalLink className="h-4 w-4" />
              )}
              <span>Hent data fra Brreg</span>
            </button>
            {brregResults.length > 0 && (
              <button
                onClick={saveBrregResults}
                disabled={saving}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2 disabled:opacity-50"
              >
                <Save className="h-4 w-4" />
                <span>Lagre alle ({brregResults.filter(r => r.success).length})</span>
              </button>
            )}
          </div>
        </div>

        {/* Brreg Results */}
        {brregResults.length > 0 && (
          <div className="mt-6">
            <h3 className="text-md font-medium text-gray-900 mb-3">Resultater:</h3>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {brregResults.map((result, index) => (
                <div key={index} className={`p-3 rounded-lg border ${result.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-medium">{result.orgNumber}</span>
                      {result.success ? (
                        <span className="text-green-700 ml-2">✅ {result.data?.name}</span>
                      ) : (
                        <span className="text-red-700 ml-2">❌ {result.error}</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Search */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Søk etter samarbeidspartner..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      {/* Partners List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Navn
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Intern navn
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Org.nr
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Kontaktperson
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Handlinger
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredPartners.map((partner) => (
                <tr key={partner.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{partner.name}</div>
                    <div className="text-sm text-gray-500">{partner.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {partner.internalName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {partner.orgNumber}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{partner.contactPerson.name}</div>
                    <div className="text-sm text-gray-500">{partner.contactPerson.role}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      partner.status === 'active' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {partner.status === 'active' ? 'Aktiv' : 'Inaktiv'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => openEditModal(partner)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(partner.id)}
                        className="text-red-600 hover:text-red-900"
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
      </div>

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
                    Telefon
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                      Gate
                    </label>
                    <input
                      type="text"
                      value={formData.address.street}
                      onChange={(e) => setFormData({
                        ...formData, 
                        address: {...formData.address, street: e.target.value}
                      })}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      By
                    </label>
                    <input
                      type="text"
                      value={formData.address.city}
                      onChange={(e) => setFormData({
                        ...formData, 
                        address: {...formData.address, city: e.target.value}
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
                      value={formData.address.postalCode}
                      onChange={(e) => setFormData({
                        ...formData, 
                        address: {...formData.address, postalCode: e.target.value}
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
                      value={formData.contactPerson.name}
                      onChange={(e) => setFormData({
                        ...formData, 
                        contactPerson: {...formData.contactPerson, name: e.target.value}
                      })}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Rolle
                    </label>
                    <input
                      type="text"
                      value={formData.contactPerson.role}
                      onChange={(e) => setFormData({
                        ...formData, 
                        contactPerson: {...formData.contactPerson, role: e.target.value}
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
                      value={formData.contactPerson.phone}
                      onChange={(e) => setFormData({
                        ...formData, 
                        contactPerson: {...formData.contactPerson, phone: e.target.value}
                      })}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      E-post
                    </label>
                    <input
                      type="email"
                      value={formData.contactPerson.email}
                      onChange={(e) => setFormData({
                        ...formData, 
                        contactPerson: {...formData.contactPerson, email: e.target.value}
                      })}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900">Rediger samarbeidspartner</h2>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleUpdate} className="space-y-6">
              {/* Same form fields as Add Modal */}
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
                    Telefon
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                      Gate
                    </label>
                    <input
                      type="text"
                      value={formData.address.street}
                      onChange={(e) => setFormData({
                        ...formData, 
                        address: {...formData.address, street: e.target.value}
                      })}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      By
                    </label>
                    <input
                      type="text"
                      value={formData.address.city}
                      onChange={(e) => setFormData({
                        ...formData, 
                        address: {...formData.address, city: e.target.value}
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
                      value={formData.address.postalCode}
                      onChange={(e) => setFormData({
                        ...formData, 
                        address: {...formData.address, postalCode: e.target.value}
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
                      value={formData.contactPerson.name}
                      onChange={(e) => setFormData({
                        ...formData, 
                        contactPerson: {...formData.contactPerson, name: e.target.value}
                      })}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Rolle
                    </label>
                    <input
                      type="text"
                      value={formData.contactPerson.role}
                      onChange={(e) => setFormData({
                        ...formData, 
                        contactPerson: {...formData.contactPerson, role: e.target.value}
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
                      value={formData.contactPerson.phone}
                      onChange={(e) => setFormData({
                        ...formData, 
                        contactPerson: {...formData.contactPerson, phone: e.target.value}
                      })}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      E-post
                    </label>
                    <input
                      type="email"
                      value={formData.contactPerson.email}
                      onChange={(e) => setFormData({
                        ...formData, 
                        contactPerson: {...formData.contactPerson, email: e.target.value}
                      })}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
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
      )}
    </div>
  );
}