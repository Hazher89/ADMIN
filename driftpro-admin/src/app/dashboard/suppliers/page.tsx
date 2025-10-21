'use client';

import React, { useState } from 'react';
import { 
  Truck, 
  Plus, 
  Edit, 
  Trash2, 
  Phone, 
  Mail, 
  MapPin, 
  Star,
  Search,
  Filter,
  MoreHorizontal,
  X,
  Check
} from 'lucide-react';

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState([
    {
      id: 1,
      name: 'ABC Leverandør AS',
      contactPerson: 'Lars Andersen',
      email: 'lars@abcleverandor.no',
      phone: '+47 123 45 678',
      address: 'Industriveien 123, 0123 Oslo',
      category: 'Elektronikk',
      rating: 4.5,
      status: 'active',
      lastOrder: '2024-01-05',
      totalOrders: 45
    },
    {
      id: 2,
      name: 'Nordic Materials',
      contactPerson: 'Kari Nordmann',
      email: 'kari@nordicmaterials.no',
      phone: '+47 987 65 432',
      address: 'Materialgata 456, 5432 Bergen',
      category: 'Råvarer',
      rating: 4.2,
      status: 'active',
      lastOrder: '2024-01-08',
      totalOrders: 23
    },
    {
      id: 3,
      name: 'Tech Solutions Ltd',
      contactPerson: 'John Smith',
      email: 'john@techsolutions.com',
      phone: '+44 20 7946 0958',
      address: 'Technology Street 789, London SW1A 1AA',
      category: 'IT-utstyr',
      rating: 4.8,
      status: 'inactive',
      lastOrder: '2023-12-15',
      totalOrders: 12
    }
  ]);

  const [showAddModal, setShowAddModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');

  const filteredSuppliers = suppliers.filter(supplier => {
    const matchesSearch = supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         supplier.contactPerson.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'all' || supplier.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${i < Math.floor(rating) ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
      />
    ));
  };

  return (
    <div className="page-header">
      <div className="flex items-center space-x-3">
        <div className="card-icon">
          <Truck className="w-6 h-6" />
        </div>
        <div>
          <h1 className="page-title">Leverandører</h1>
          <p className="page-subtitle">Administrer leverandører og samarbeidspartnere</p>
        </div>
      </div>

      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <Search className="w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="Søk leverandører..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div className="flex items-center space-x-2">
          <Filter className="w-4 h-4 text-gray-500" />
          <select 
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">Alle kategorier</option>
            <option value="Elektronikk">Elektronikk</option>
            <option value="Råvarer">Råvarer</option>
            <option value="IT-utstyr">IT-utstyr</option>
            <option value="Tjenester">Tjenester</option>
          </select>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="btn btn-primary"
        >
          <Plus className="w-4 h-4" />
          Ny leverandør
        </button>
      </div>

      <div className="card mt-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSuppliers.map((supplier) => (
            <div key={supplier.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">{supplier.name}</h3>
                  <p className="text-sm text-gray-600">{supplier.contactPerson}</p>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    supplier.status === 'active' 
                      ? 'text-green-600 bg-green-50' 
                      : 'text-gray-600 bg-gray-50'
                  }`}>
                    {supplier.status === 'active' ? 'Aktiv' : 'Inaktiv'}
                  </span>
                  <button className="p-1 hover:bg-gray-100 rounded">
                    <MoreHorizontal className="w-4 h-4 text-gray-500" />
                  </button>
                </div>
              </div>

              <div className="space-y-3 mb-4">
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <Mail className="w-4 h-4" />
                  <span>{supplier.email}</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <Phone className="w-4 h-4" />
                  <span>{supplier.phone}</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <MapPin className="w-4 h-4" />
                  <span>{supplier.address}</span>
                </div>
              </div>

              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-1">
                  {renderStars(supplier.rating)}
                  <span className="text-sm text-gray-600 ml-1">({supplier.rating})</span>
                </div>
                <span className="text-sm text-gray-600 bg-gray-100 px-2 py-1 rounded">
                  {supplier.category}
                </span>
              </div>

              <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
                <div>
                  <span className="font-medium">Siste bestilling:</span>
                  <br />
                  {new Date(supplier.lastOrder).toLocaleDateString('nb-NO')}
                </div>
                <div>
                  <span className="font-medium">Totalt bestillinger:</span>
                  <br />
                  {supplier.totalOrders}
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <button className="btn btn-secondary flex-1">
                  <Edit className="w-4 h-4" />
                  Rediger
                </button>
                <button className="btn btn-primary flex-1">
                  <Check className="w-4 h-4" />
                  Bestill
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add Supplier Modal */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-content max-w-lg">
            <div className="modal-header">
              <h2 className="modal-title">Ny leverandør</h2>
              <button 
                onClick={() => setShowAddModal(false)}
                className="modal-close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="modal-body">
              <form className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Firmanavn</label>
                  <input 
                    type="text" 
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Leverandør AS"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Kontaktperson</label>
                  <input 
                    type="text" 
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Navn"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">E-post</label>
                    <input 
                      type="email" 
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="epost@firma.no"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Telefon</label>
                    <input 
                      type="tel" 
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="+47 123 45 678"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Adresse</label>
                  <textarea 
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows={2}
                    placeholder="Gateadresse, postnummer og sted"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Kategori</label>
                    <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                      <option>Elektronikk</option>
                      <option>Råvarer</option>
                      <option>IT-utstyr</option>
                      <option>Tjenester</option>
                      <option>Annet</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                      <option value="active">Aktiv</option>
                      <option value="inactive">Inaktiv</option>
                    </select>
                  </div>
                </div>
                <div className="flex items-center justify-end space-x-3 pt-4">
                  <button 
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="btn btn-secondary"
                  >
                    Avbryt
                  </button>
                  <button 
                    type="submit"
                    className="btn btn-primary"
                  >
                    <Plus className="w-4 h-4" />
                    Opprett leverandør
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}










