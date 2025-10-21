'use client';

import React, { useState } from 'react';
import { 
  Box, 
  Plus, 
  Edit, 
  Trash2, 
  Eye,
  Search,
  Filter,
  MoreHorizontal,
  X,
  Check,
  AlertTriangle,
  Package,
  TrendingUp,
  TrendingDown,
  DollarSign
} from 'lucide-react';

export default function ProductsPage() {
  const [products, setProducts] = useState([
    {
      id: 'PROD-001',
      name: 'Premium Laptop',
      sku: 'LAPTOP-001',
      category: 'Elektronikk',
      price: 15000,
      cost: 12000,
      stock: 25,
      minStock: 5,
      status: 'active',
      supplier: 'ABC Leverandør AS',
      description: 'Høyytelses laptop for profesjonell bruk',
      lastRestock: '2024-01-10'
    },
    {
      id: 'PROD-002',
      name: 'Office Chair',
      sku: 'CHAIR-001',
      category: 'Møbler',
      price: 3500,
      cost: 2800,
      stock: 12,
      minStock: 3,
      status: 'active',
      supplier: 'Nordic Materials',
      description: 'Ergonomisk kontorstol med lårrygg',
      lastRestock: '2024-01-05'
    },
    {
      id: 'PROD-003',
      name: 'Wireless Mouse',
      sku: 'MOUSE-001',
      category: 'Elektronikk',
      price: 299,
      cost: 150,
      stock: 2,
      minStock: 10,
      status: 'low_stock',
      supplier: 'Tech Solutions Ltd',
      description: 'Trådløs mus med optisk sensor',
      lastRestock: '2023-12-20'
    },
    {
      id: 'PROD-004',
      name: 'Standing Desk',
      sku: 'DESK-001',
      category: 'Møbler',
      price: 8500,
      cost: 6500,
      stock: 0,
      minStock: 2,
      status: 'out_of_stock',
      supplier: 'Nordic Materials',
      description: 'Høydejusterbar skrivebord',
      lastRestock: '2023-11-15'
    }
  ]);

  const [showAddModal, setShowAddModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.sku.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'all' || product.category === filterCategory;
    const matchesStatus = filterStatus === 'all' || product.status === filterStatus;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-50';
      case 'low_stock': return 'text-yellow-600 bg-yellow-50';
      case 'out_of_stock': return 'text-red-600 bg-red-50';
      case 'inactive': return 'text-gray-600 bg-gray-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'Aktiv';
      case 'low_stock': return 'Lavt lager';
      case 'out_of_stock': return 'Utsolgt';
      case 'inactive': return 'Inaktiv';
      default: return status;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('nb-NO', {
      style: 'currency',
      currency: 'NOK'
    }).format(amount);
  };

  const totalProducts = products.length;
  const activeProducts = products.filter(p => p.status === 'active').length;
  const lowStockProducts = products.filter(p => p.stock <= p.minStock).length;
  const outOfStockProducts = products.filter(p => p.stock === 0).length;

  const totalValue = products.reduce((sum, product) => sum + (product.stock * product.cost), 0);

  return (
    <div className="page-header">
      <div className="flex items-center space-x-3">
        <div className="card-icon">
          <Box className="w-6 h-6" />
        </div>
        <div>
          <h1 className="page-title">Produkter</h1>
          <p className="page-subtitle">Administrer produktkatalog og lagerbeholdning</p>
        </div>
      </div>

      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <Search className="w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="Søk produkter..."
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
            <option value="Møbler">Møbler</option>
            <option value="Kontorartikler">Kontorartikler</option>
            <option value="Annet">Annet</option>
          </select>
          <select 
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">Alle status</option>
            <option value="active">Aktiv</option>
            <option value="low_stock">Lavt lager</option>
            <option value="out_of_stock">Utsolgt</option>
            <option value="inactive">Inaktiv</option>
          </select>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="btn btn-primary"
        >
          <Plus className="w-4 h-4" />
          Nytt produkt
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mt-6">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Totalt produkter</p>
              <p className="text-2xl font-bold text-gray-900">{totalProducts}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <Package className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Aktive</p>
              <p className="text-2xl font-bold text-green-600">{activeProducts}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <Check className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Lavt lager</p>
              <p className="text-2xl font-bold text-yellow-600">{lowStockProducts}</p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Utsolgt</p>
              <p className="text-2xl font-bold text-red-600">{outOfStockProducts}</p>
            </div>
            <div className="p-3 bg-red-100 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Lagerverdi</p>
              <p className="text-2xl font-bold text-blue-600">{formatCurrency(totalValue)}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <DollarSign className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>
      </div>

      <div className="card mt-6">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-medium text-gray-900">Produkt</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">SKU</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Kategori</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Pris</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Lager</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Status</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Leverandør</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Handlinger</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((product) => (
                <tr key={product.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <div>
                      <div className="font-medium text-gray-900">{product.name}</div>
                      <div className="text-sm text-gray-600">{product.description}</div>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className="font-mono text-sm text-gray-600">{product.sku}</span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-sm text-gray-600">{product.category}</span>
                  </td>
                  <td className="py-3 px-4">
                    <div>
                      <div className="font-medium text-gray-900">{formatCurrency(product.price)}</div>
                      <div className="text-sm text-gray-500">Kostnad: {formatCurrency(product.cost)}</div>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div>
                      <div className="font-medium text-gray-900">{product.stock}</div>
                      <div className="text-sm text-gray-500">Min: {product.minStock}</div>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(product.status)}`}>
                      {getStatusText(product.status)}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-sm text-gray-600">{product.supplier}</span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center space-x-2">
                      <button className="p-1 hover:bg-gray-100 rounded" title="Vis">
                        <Eye className="w-4 h-4 text-gray-500" />
                      </button>
                      <button className="p-1 hover:bg-gray-100 rounded" title="Rediger">
                        <Edit className="w-4 h-4 text-gray-500" />
                      </button>
                      <button className="p-1 hover:bg-gray-100 rounded" title="Mer">
                        <MoreHorizontal className="w-4 h-4 text-gray-500" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Product Modal */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-content max-w-lg">
            <div className="modal-header">
              <h2 className="modal-title">Nytt produkt</h2>
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">Produktnavn</label>
                  <input 
                    type="text" 
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Produktnavn"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">SKU</label>
                    <input 
                      type="text" 
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="PROD-001"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Kategori</label>
                    <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                      <option>Elektronikk</option>
                      <option>Møbler</option>
                      <option>Kontorartikler</option>
                      <option>Annet</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Beskrivelse</label>
                  <textarea 
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows={3}
                    placeholder="Produktbeskrivelse"
                  />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Pris</label>
                    <input 
                      type="number" 
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Kostnad</label>
                    <input 
                      type="number" 
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Lager</label>
                    <input 
                      type="number" 
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="0"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Minimum lager</label>
                    <input 
                      type="number" 
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Leverandør</label>
                    <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                      <option>ABC Leverandør AS</option>
                      <option>Nordic Materials</option>
                      <option>Tech Solutions Ltd</option>
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
                    Opprett produkt
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










