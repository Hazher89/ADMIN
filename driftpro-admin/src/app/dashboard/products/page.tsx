'use client';

import React, { useState, useEffect } from 'react';
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
  const [isMobile, setIsMobile] = useState(false);
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

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

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
    <div style={{ 
      width: '100%',
      overflowX: 'hidden',
      padding: isMobile ? '0' : undefined
    }}>
      {/* Mobile Header */}
      {isMobile && (
        <div style={{
          padding: '0.625rem 0.75rem 0.5rem',
          marginBottom: '0.5rem',
          borderBottom: '0.5px solid var(--border-color)',
          background: 'var(--card-background)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <h1 style={{
                fontSize: '1.125rem',
                fontWeight: 600,
                color: 'var(--text-color)',
                margin: '0 0 0.125rem 0',
                lineHeight: '1.3'
              }}>
                Produkter
              </h1>
              <p style={{
                fontSize: '0.8125rem',
                color: 'var(--gray-500)',
                margin: 0
              }}>
                {products.length} produkter
              </p>
            </div>
            <button 
              onClick={() => setShowAddModal(true)}
              style={{
                padding: '0.625rem',
                borderRadius: '0.625rem',
                background: 'var(--primary)',
                color: 'white',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minWidth: '44px',
                minHeight: '44px'
              }}
            >
              <Plus size={20} />
            </button>
          </div>
        </div>
      )}

      {/* Desktop Header */}
      {!isMobile && (
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
        </div>
      )}

      {/* Mobile Search and Filters */}
      {isMobile && (
        <div style={{
          padding: '0 0.75rem 0.75rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.5rem'
        }}>
          <div style={{ position: 'relative' }}>
            <Search style={{
              position: 'absolute',
              left: '0.875rem',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--gray-400)',
              width: '18px',
              height: '18px'
            }} />
            <input
              type="text"
              placeholder="Søk produkter..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: isMobile ? '1rem 1rem 1rem 3rem' : '0.875rem 0.875rem 0.875rem 2.75rem',
                border: '1px solid var(--border-color)',
                borderRadius: isMobile ? '12px' : '0.5rem',
                outline: 'none',
                fontSize: '16px',
                minHeight: isMobile ? '56px' : 'auto',
                background: 'var(--card-background)'
              }}
            />
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <select 
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              style={{
                flex: 1,
                padding: isMobile ? '1rem 1.25rem' : '0.875rem',
                border: '1px solid var(--border-color)',
                borderRadius: isMobile ? '12px' : '0.5rem',
                fontSize: '16px',
                background: 'var(--card-background)',
                minHeight: isMobile ? '56px' : '44px',
                outline: 'none'
              }}
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
              style={{
                flex: 1,
                padding: isMobile ? '1rem 1.25rem' : '0.875rem',
                border: '1px solid var(--border-color)',
                borderRadius: isMobile ? '12px' : '0.5rem',
                fontSize: '16px',
                background: 'var(--card-background)',
                minHeight: isMobile ? '56px' : '44px',
                outline: 'none'
              }}
            >
              <option value="all">Alle status</option>
              <option value="active">Aktiv</option>
              <option value="low_stock">Lavt lager</option>
              <option value="out_of_stock">Utsolgt</option>
              <option value="inactive">Inaktiv</option>
            </select>
          </div>
        </div>
      )}

      {/* Summary Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(5, 1fr)',
        gap: isMobile ? '0.625rem' : '1.5rem',
        marginTop: isMobile ? '0' : '1.5rem',
        marginBottom: isMobile ? '0.75rem' : '1.5rem',
        padding: isMobile ? '0 0.75rem' : undefined
      }}>
        <div style={{
          borderRadius: '0.875rem',
          padding: isMobile ? '0.875rem' : '1rem',
          background: 'var(--card-background)',
          border: '1px solid var(--border-color)',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
          display: 'flex',
          alignItems: 'center',
          gap: isMobile ? '0.75rem' : '1rem'
        }}>
          <div style={{ 
            padding: isMobile ? '0.625rem' : '0.75rem', 
            background: 'rgba(59, 130, 246, 0.1)', 
            borderRadius: '0.625rem',
            flexShrink: 0
          }}>
            <Package size={isMobile ? 20 : 24} style={{ color: '#3b82f6' }} />
            </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ 
              fontSize: isMobile ? '0.75rem' : '0.875rem', 
              fontWeight: 500, 
              color: 'var(--gray-500)',
              margin: 0,
              marginBottom: '0.25rem'
            }}>Totalt produkter</p>
            <p style={{ 
              fontSize: isMobile ? '1.5rem' : '1.5rem', 
              fontWeight: 700, 
              color: 'var(--text-color)',
              margin: 0
            }}>{totalProducts}</p>
          </div>
        </div>
        <div style={{
          borderRadius: '0.875rem',
          padding: isMobile ? '0.875rem' : '1rem',
          background: 'var(--card-background)',
          border: '1px solid var(--border-color)',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
          display: 'flex',
          alignItems: 'center',
          gap: isMobile ? '0.75rem' : '1rem'
        }}>
          <div style={{ 
            padding: isMobile ? '0.625rem' : '0.75rem', 
            background: 'rgba(34, 197, 94, 0.1)', 
            borderRadius: '0.625rem',
            flexShrink: 0
          }}>
            <Check size={isMobile ? 20 : 24} style={{ color: '#22c55e' }} />
            </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ 
              fontSize: isMobile ? '0.75rem' : '0.875rem', 
              fontWeight: 500, 
              color: 'var(--gray-500)',
              margin: 0,
              marginBottom: '0.25rem'
            }}>Aktive</p>
            <p style={{ 
              fontSize: isMobile ? '1.5rem' : '1.5rem', 
              fontWeight: 700, 
              color: '#22c55e',
              margin: 0
            }}>{activeProducts}</p>
          </div>
        </div>
        <div style={{
          borderRadius: '0.875rem',
          padding: isMobile ? '0.875rem' : '1rem',
          background: 'var(--card-background)',
          border: '1px solid var(--border-color)',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
          display: 'flex',
          alignItems: 'center',
          gap: isMobile ? '0.75rem' : '1rem'
        }}>
          <div style={{ 
            padding: isMobile ? '0.625rem' : '0.75rem', 
            background: 'rgba(245, 158, 11, 0.1)', 
            borderRadius: '0.625rem',
            flexShrink: 0
          }}>
            <AlertTriangle size={isMobile ? 20 : 24} style={{ color: '#f59e0b' }} />
            </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ 
              fontSize: isMobile ? '0.75rem' : '0.875rem', 
              fontWeight: 500, 
              color: 'var(--gray-500)',
              margin: 0,
              marginBottom: '0.25rem'
            }}>Lavt lager</p>
            <p style={{ 
              fontSize: isMobile ? '1.5rem' : '1.5rem', 
              fontWeight: 700, 
              color: '#f59e0b',
              margin: 0
            }}>{lowStockProducts}</p>
          </div>
        </div>
        <div style={{
          borderRadius: '0.875rem',
          padding: isMobile ? '0.875rem' : '1rem',
          background: 'var(--card-background)',
          border: '1px solid var(--border-color)',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
          display: 'flex',
          alignItems: 'center',
          gap: isMobile ? '0.75rem' : '1rem'
        }}>
          <div style={{ 
            padding: isMobile ? '0.625rem' : '0.75rem', 
            background: 'rgba(239, 68, 68, 0.1)', 
            borderRadius: '0.625rem',
            flexShrink: 0
          }}>
            <AlertTriangle size={isMobile ? 20 : 24} style={{ color: '#ef4444' }} />
            </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ 
              fontSize: isMobile ? '0.75rem' : '0.875rem', 
              fontWeight: 500, 
              color: 'var(--gray-500)',
              margin: 0,
              marginBottom: '0.25rem'
            }}>Utsolgt</p>
            <p style={{ 
              fontSize: isMobile ? '1.5rem' : '1.5rem', 
              fontWeight: 700, 
              color: '#ef4444',
              margin: 0
            }}>{outOfStockProducts}</p>
          </div>
        </div>
        {!isMobile && (
          <div style={{
            borderRadius: '0.875rem',
            padding: '1rem',
            background: 'var(--card-background)',
            border: '1px solid var(--border-color)',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem'
          }}>
            <div style={{ 
              padding: '0.75rem', 
              background: 'rgba(59, 130, 246, 0.1)', 
              borderRadius: '0.625rem',
              flexShrink: 0
            }}>
              <DollarSign size={24} style={{ color: '#3b82f6' }} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ 
                fontSize: '0.875rem', 
                fontWeight: 500, 
                color: 'var(--gray-500)',
                margin: 0,
                marginBottom: '0.25rem'
              }}>Lagerverdi</p>
              <p style={{ 
                fontSize: '1.5rem', 
                fontWeight: 700, 
                color: '#3b82f6',
                margin: 0
              }}>{formatCurrency(totalValue)}</p>
            </div>
          </div>
        )}
      </div>

      {isMobile ? (
        <div style={{ padding: '0 0.75rem', display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
          {filteredProducts.map((product) => (
            <div key={product.id} style={{
              borderRadius: '0.875rem',
              padding: '1rem',
              background: 'var(--card-background)',
              border: '1px solid var(--border-color)',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                <div style={{ flex: 1 }}>
                  <h3 style={{ 
                    fontSize: '0.9375rem', 
                    fontWeight: 600, 
                    color: 'var(--text-color)',
                    margin: '0 0 0.25rem 0'
                  }}>
                    {product.name}
                  </h3>
                  <p style={{ 
                    fontSize: '0.8125rem', 
                    color: 'var(--gray-500)',
                    margin: 0
                  }}>
                    {product.sku}
                  </p>
                </div>
                <span style={{
                  padding: '0.25rem 0.625rem',
                  borderRadius: '0.375rem',
                  fontSize: '0.75rem',
                  fontWeight: 500,
                  ...(getStatusColor(product.status).includes('green') ? { background: 'rgba(34, 197, 94, 0.1)', color: '#22c55e' } :
                      getStatusColor(product.status).includes('yellow') ? { background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' } :
                      getStatusColor(product.status).includes('red') ? { background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' } :
                      { background: 'rgba(107, 114, 128, 0.1)', color: '#6b7280' })
                }}>
                  {getStatusText(product.status)}
                </span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.8125rem', color: 'var(--gray-600)' }}>
                <div>
                  <span style={{ color: 'var(--gray-500)' }}>Kategori: </span>
                  {product.category}
                </div>
                <div>
                  <span style={{ color: 'var(--gray-500)' }}>Lager: </span>
                  {product.stock}
                </div>
                <div>
                  <span style={{ color: 'var(--gray-500)' }}>Pris: </span>
                  {formatCurrency(product.price)}
                </div>
                <div>
                  <span style={{ color: 'var(--gray-500)' }}>Leverandør: </span>
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>
                    {product.supplier}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
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
      )}

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




















