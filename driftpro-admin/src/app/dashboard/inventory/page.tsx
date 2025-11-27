'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Package, Box, Truck, ShoppingCart, Home, 
  Plus, Search, Filter, Download, Eye, Edit, Trash2,
  CheckCircle, XCircle, AlertTriangle, TrendingUp,
  AlertCircle, Minus, RotateCcw
} from 'lucide-react';

export default function InventoryPage() {
  const { user, userProfile } = useAuth();
  const [activeTab, setActiveTab] = useState('inventory');
  const [inventory, setInventory] = useState([]);
  const [products, setProducts] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    // Simulate loading data
    setTimeout(() => {
      setIsLoading(false);
    }, 1000);
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Laster lager...</span>
      </div>
    );
  }

  return (
    <div style={{ 
      background: 'var(--background-color)', 
      minHeight: '100vh', 
      padding: isMobile ? '0' : 'var(--space-6)',
      width: '100%',
      overflowX: 'hidden'
    }}>
      {/* Mobile Header */}
      {isMobile && (
        <div style={{
          padding: '0.625rem 0.75rem 0.5rem',
          marginBottom: '0.5rem',
          borderBottom: '0.5px solid var(--border-color)',
          background: 'var(--card-background)'
        }}>
          <h1 style={{
            fontSize: '1.125rem',
            fontWeight: 600,
            color: 'var(--text-color)',
            margin: 0,
            lineHeight: '1.3'
          }}>
            Lager & Inventar
          </h1>
        </div>
      )}

      {/* Desktop Header */}
      {!isMobile && (
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
          <div className="card-icon">
            <Package />
          </div>
          <div>
            <h1 className="page-title">Lager & Inventar</h1>
            <p className="page-subtitle">Administrer produkter, lager og leverandører</p>
          </div>
        </div>
      </div>
      )}

      {/* Quick Stats */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(auto-fit, minmax(250px, 1fr))', 
        gap: isMobile ? '0.625rem' : 'var(--space-4)', 
        marginBottom: isMobile ? '0.75rem' : 'var(--space-6)',
        padding: isMobile ? '0 0.75rem' : undefined
      }}>
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <p style={{ color: 'var(--gray-600)', fontSize: 'var(--font-size-sm)', marginBottom: '0.5rem' }}>Totalt Produkter</p>
              <p style={{ fontSize: 'var(--font-size-2xl)', fontWeight: '600', color: 'var(--blue-600)' }}>1,247</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.5rem' }}>
                <TrendingUp className="w-4 h-4 text-green-600" />
                <span style={{ color: 'var(--green-600)', fontSize: 'var(--font-size-sm)' }}>+23 denne måneden</span>
              </div>
            </div>
            <div className="card-icon" style={{ background: 'var(--blue-100)' }}>
              <Box className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <p style={{ color: 'var(--gray-600)', fontSize: 'var(--font-size-sm)', marginBottom: '0.5rem' }}>Lavt Lager</p>
              <p style={{ fontSize: 'var(--font-size-2xl)', fontWeight: '600', color: 'var(--red-600)' }}>12</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.5rem' }}>
                <AlertCircle className="w-4 h-4 text-red-600" />
                <span style={{ color: 'var(--red-600)', fontSize: 'var(--font-size-sm)' }}>Trenger oppfylling</span>
              </div>
            </div>
            <div className="card-icon" style={{ background: 'var(--red-100)' }}>
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>

        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <p style={{ color: 'var(--gray-600)', fontSize: 'var(--font-size-sm)', marginBottom: '0.5rem' }}>Aktive Leverandører</p>
              <p style={{ fontSize: 'var(--font-size-2xl)', fontWeight: '600', color: 'var(--green-600)' }}>28</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.5rem' }}>
                <Truck className="w-4 h-4 text-green-600" />
                <span style={{ color: 'var(--green-600)', fontSize: 'var(--font-size-sm)' }}>Alle aktive</span>
              </div>
            </div>
            <div className="card-icon" style={{ background: 'var(--green-100)' }}>
              <Truck className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <p style={{ color: 'var(--gray-600)', fontSize: 'var(--font-size-sm)', marginBottom: '0.5rem' }}>Månedlige Bestillinger</p>
              <p style={{ fontSize: 'var(--font-size-2xl)', fontWeight: '600', color: 'var(--purple-600)' }}>156</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.5rem' }}>
                <ShoppingCart className="w-4 h-4 text-purple-600" />
                <span style={{ color: 'var(--purple-600)', fontSize: 'var(--font-size-sm)' }}>Gjennomsnitt: 5.2/dag</span>
              </div>
            </div>
            <div className="card-icon" style={{ background: 'var(--purple-100)' }}>
              <ShoppingCart className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', borderBottom: '1px solid var(--gray-200)' }}>
          {[
            { id: 'inventory', name: 'Lager', icon: Package },
            { id: 'products', name: 'Produkter', icon: Box },
            { id: 'suppliers', name: 'Leverandører', icon: Truck },
            { id: 'orders', name: 'Bestillinger', icon: ShoppingCart },
            { id: 'warehouse', name: 'Varehus', icon: Home },
            { id: 'reports', name: 'Rapporter', icon: Download },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`btn ${activeTab === tab.id ? 'btn-primary' : 'btn-secondary'}`}
              style={{ borderRadius: 0, borderBottom: activeTab === tab.id ? '2px solid var(--blue-600)' : '2px solid transparent' }}
            >
              <tab.icon size={16} />
              {tab.name}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div style={{ padding: 'var(--space-6)' }}>
          {activeTab === 'inventory' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-6)' }}>
                <h2 style={{ fontSize: 'var(--font-size-xl)', fontWeight: '600', color: 'var(--gray-900)' }}>
                  Lagerbeholdning
                </h2>
                <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
                  <button className="btn btn-secondary">
                    <Search size={16} />
                    Søk
                  </button>
                  <button className="btn btn-secondary">
                    <Filter size={16} />
                    Filter
                  </button>
                  <button className="btn btn-warning">
                    <RotateCcw size={16} />
                    Oppdater
                  </button>
                </div>
              </div>
              <div className="card" style={{ padding: 0 }}>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ background: 'var(--gray-50)', borderBottom: '1px solid var(--gray-200)' }}>
                        <th style={{ padding: 'var(--space-4)', textAlign: 'left', fontWeight: '600', color: 'var(--gray-900)' }}>Produkt</th>
                        <th style={{ padding: 'var(--space-4)', textAlign: 'left', fontWeight: '600', color: 'var(--gray-900)' }}>SKU</th>
                        <th style={{ padding: 'var(--space-4)', textAlign: 'left', fontWeight: '600', color: 'var(--gray-900)' }}>Lager</th>
                        <th style={{ padding: 'var(--space-4)', textAlign: 'left', fontWeight: '600', color: 'var(--gray-900)' }}>Min. Lager</th>
                        <th style={{ padding: 'var(--space-4)', textAlign: 'left', fontWeight: '600', color: 'var(--gray-900)' }}>Status</th>
                        <th style={{ padding: 'var(--space-4)', textAlign: 'left', fontWeight: '600', color: 'var(--gray-900)' }}>Handlinger</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { product: 'Laptop Dell XPS 13', sku: 'DELL-XPS13-001', stock: 15, minStock: 5, status: 'good' },
                        { product: 'Mus Logitech MX Master', sku: 'LOG-MX-001', stock: 2, minStock: 10, status: 'low' },
                        { product: 'Skjerm Samsung 27"', sku: 'SAM-27-001', stock: 8, minStock: 3, status: 'good' },
                        { product: 'Tastatur Mechanisk', sku: 'KEY-MECH-001', stock: 0, minStock: 5, status: 'out' },
                      ].map((item, index) => (
                        <tr key={index} style={{ borderBottom: '1px solid var(--gray-200)' }}>
                          <td style={{ padding: 'var(--space-4)', color: 'var(--gray-900)' }}>{item.product}</td>
                          <td style={{ padding: 'var(--space-4)', color: 'var(--gray-600)', fontFamily: 'monospace' }}>{item.sku}</td>
                          <td style={{ padding: 'var(--space-4)', fontWeight: '600', color: 'var(--gray-900)' }}>{item.stock}</td>
                          <td style={{ padding: 'var(--space-4)', color: 'var(--gray-600)' }}>{item.minStock}</td>
                          <td style={{ padding: 'var(--space-4)' }}>
                            <span style={{
                              padding: '0.25rem 0.75rem',
                              borderRadius: 'var(--border-radius)',
                              fontSize: 'var(--font-size-sm)',
                              fontWeight: '500',
                              background: item.status === 'good' ? 'var(--green-100)' : item.status === 'low' ? 'var(--yellow-100)' : 'var(--red-100)',
                              color: item.status === 'good' ? 'var(--green-700)' : item.status === 'low' ? 'var(--yellow-700)' : 'var(--red-700)'
                            }}>
                              {item.status === 'good' ? 'OK' : item.status === 'low' ? 'Lavt' : 'Tomt'}
                            </span>
                          </td>
                          <td style={{ padding: 'var(--space-4)' }}>
                            <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                              <button className="btn btn-sm btn-secondary">
                                <Eye size={14} />
                              </button>
                              <button className="btn btn-sm btn-primary">
                                <Edit size={14} />
                              </button>
                              <button className="btn btn-sm btn-success">
                                <Plus size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'products' && (
            <div>
              <h2 style={{ fontSize: 'var(--font-size-xl)', fontWeight: '600', color: 'var(--gray-900)', marginBottom: 'var(--space-6)' }}>
                Produkter
              </h2>
              <div className="card" style={{ padding: 'var(--space-6)' }}>
                <p style={{ color: 'var(--gray-600)' }}>Produktkatalog funksjonalitet kommer snart!</p>
              </div>
            </div>
          )}

          {activeTab === 'suppliers' && (
            <div>
              <h2 style={{ fontSize: 'var(--font-size-xl)', fontWeight: '600', color: 'var(--gray-900)', marginBottom: 'var(--space-6)' }}>
                Leverandører
              </h2>
              <div className="card" style={{ padding: 'var(--space-6)' }}>
                <p style={{ color: 'var(--gray-600)' }}>Leverandører funksjonalitet kommer snart!</p>
              </div>
            </div>
          )}

          {activeTab === 'orders' && (
            <div>
              <h2 style={{ fontSize: 'var(--font-size-xl)', fontWeight: '600', color: 'var(--gray-900)', marginBottom: 'var(--space-6)' }}>
                Bestillinger
              </h2>
              <div className="card" style={{ padding: 'var(--space-6)' }}>
                <p style={{ color: 'var(--gray-600)' }}>Bestillinger funksjonalitet kommer snart!</p>
              </div>
            </div>
          )}

          {activeTab === 'warehouse' && (
            <div>
              <h2 style={{ fontSize: 'var(--font-size-xl)', fontWeight: '600', color: 'var(--gray-900)', marginBottom: 'var(--space-6)' }}>
                Varehus
              </h2>
              <div className="card" style={{ padding: 'var(--space-6)' }}>
                <p style={{ color: 'var(--gray-600)' }}>Varehus funksjonalitet kommer snart!</p>
              </div>
            </div>
          )}

          {activeTab === 'reports' && (
            <div>
              <h2 style={{ fontSize: 'var(--font-size-xl)', fontWeight: '600', color: 'var(--gray-900)', marginBottom: 'var(--space-6)' }}>
                Rapporter
              </h2>
              <div className="card" style={{ padding: 'var(--space-6)' }}>
                <p style={{ color: 'var(--gray-600)' }}>Rapport funksjonalitet kommer snart!</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}




















