'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Truck, Package, Users, FileText, DollarSign, 
  Plus, Search, Filter, Download, Eye, Edit, Trash2,
  CheckCircle, XCircle, AlertTriangle, TrendingUp,
  Building, Mail, Phone, MapPin, Briefcase, Heart,
  Play, Pause, StopCircle, MoreHorizontal, Settings,
  BarChart3, UserPlus, UserX, UserCheck, Key, Plane,
  Home, Briefcase as BriefcaseIcon, Clock as ClockIcon,
  CalendarDays, Hash, Target, Info, Database, RefreshCw,
  Save, Loader2, X, Link, SortAsc, SortDesc, Grid, List,
  ExternalLink, Star, Upload, FileText as FileTextIcon,
  CheckCircle2, ShoppingCart, Navigation, Archive
} from 'lucide-react';

export default function LogistikkSystemPage() {
  const { user, userProfile, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState('delivery');
  const [isMobile, setIsMobile] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // Search and filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedType, setSelectedType] = useState('all');

  // Check for mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Loading effect
  useEffect(() => {
    if (!authLoading) {
      setIsLoading(false);
    }
  }, [authLoading]);

  if (isLoading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        background: 'var(--gray-50)'
      }}>
        <div className="loading"></div>
      </div>
    );
  }

  const tabs = [
    { id: 'delivery', name: 'Levering', icon: Truck },
    { id: 'planning', name: 'Planlegging', icon: Navigation },
    { id: 'customers', name: 'Kunder', icon: Users },
    { id: 'suppliers', name: 'Leverandører', icon: Package },
    { id: 'products', name: 'Produkter', icon: ShoppingCart },
    { id: 'inventory', name: 'Lager', icon: Archive },
    { id: 'invoicing', name: 'Fakturering', icon: FileText },
    { id: 'finance', name: 'Finans', icon: DollarSign },
  ];

  const getStats = () => {
    return {
      totalDeliveries: 0,
      activeDeliveries: 0,
      totalCustomers: 0,
      totalSuppliers: 0,
      totalProducts: 0,
      inventoryValue: 0,
      pendingInvoices: 0,
      monthlyRevenue: 0,
    };
  };

  const stats = getStats();

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--gray-50)',
      padding: isMobile ? '1rem' : '2rem'
    }}>
      {/* Page Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{
          fontSize: isMobile ? 'var(--font-size-2xl)' : 'var(--font-size-3xl)',
          fontWeight: '700',
          color: 'var(--gray-900)',
          marginBottom: '0.5rem'
        }}>
          Logistikk System
        </h1>
        <p style={{
          fontSize: 'var(--font-size-lg)',
          color: 'var(--gray-600)',
          maxWidth: '600px'
        }}>
          Administrer levering, planlegging, kunder, leverandører, produkter, lager, fakturering og finans
        </p>
      </div>

      {/* Statistics Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
        gap: '1rem',
        marginBottom: '2rem'
      }}>
        {[
          { label: 'Totale leveringer', value: stats.totalDeliveries, icon: Truck, color: '#3b82f6' },
          { label: 'Aktive leveringer', value: stats.activeDeliveries, icon: Play, color: '#10b981' },
          { label: 'Kunder', value: stats.totalCustomers, icon: Users, color: '#8b5cf6' },
          { label: 'Leverandører', value: stats.totalSuppliers, icon: Package, color: '#f59e0b' },
          { label: 'Produkter', value: stats.totalProducts, icon: ShoppingCart, color: '#ef4444' },
          { label: 'Lagerverdi', value: `kr ${stats.inventoryValue.toLocaleString()}`, icon: Archive, color: '#06b6d4' },
          { label: 'Ventende fakturaer', value: stats.pendingInvoices, icon: FileText, color: '#84cc16' },
          { label: 'Månedlig omsetning', value: `kr ${stats.monthlyRevenue.toLocaleString()}`, icon: DollarSign, color: '#f97316' },
        ].map((stat, index) => (
          <div key={index} className="card" style={{
            padding: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem'
          }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              background: `${stat.color}20`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <stat.icon size={24} style={{ color: stat.color }} />
            </div>
            <div>
              <p style={{
                fontSize: 'var(--font-size-sm)',
                color: 'var(--gray-600)',
                marginBottom: '0.25rem'
              }}>
                {stat.label}
              </p>
              <p style={{
                fontSize: 'var(--font-size-xl)',
                fontWeight: '700',
                color: 'var(--gray-900)'
              }}>
                {stat.value}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', borderBottom: '1px solid var(--gray-200)', overflowX: 'auto' }}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`btn ${activeTab === tab.id ? 'btn-primary' : 'btn-secondary'}`}
              style={{ 
                borderRadius: 0,
                borderBottom: activeTab === tab.id ? '2px solid var(--primary)' : '2px solid transparent',
                whiteSpace: 'nowrap',
                minWidth: '120px'
              }}
            >
              <tab.icon size={16} style={{ marginRight: '0.5rem' }} />
              {tab.name}
            </button>
          ))}
        </div>

        {/* Search and Filter Controls */}
        <div style={{
          padding: '1.5rem',
          borderBottom: '1px solid var(--gray-200)',
          display: 'flex',
          gap: '1rem',
          flexWrap: 'wrap',
          alignItems: 'center'
        }}>
          <div style={{ position: 'relative', flex: '1', minWidth: '200px' }}>
            <Search style={{
              position: 'absolute',
              left: '0.75rem',
              top: '50%',
              transform: 'translateY(-50%)',
              width: '16px',
              height: '16px',
              color: 'var(--gray-400)'
            }} />
            <input
              type="text"
              placeholder="Søk..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem 0.75rem 0.75rem 2.5rem',
                border: '1px solid var(--gray-300)',
                borderRadius: 'var(--radius-md)',
                fontSize: 'var(--font-size-base)',
                outline: 'none'
              }}
            />
          </div>
          
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            style={{ 
              padding: '0.75rem', 
              border: '1px solid var(--gray-300)', 
              borderRadius: 'var(--radius-md)',
              fontSize: 'var(--font-size-base)',
              outline: 'none'
            }}
          >
            <option value="all">Alle statuser</option>
            <option value="active">Aktiv</option>
            <option value="pending">Venter</option>
            <option value="completed">Fullført</option>
            <option value="cancelled">Avbrutt</option>
          </select>

          <button
            onClick={() => {/* Add new item logic */}}
            className="btn btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <Plus size={16} />
            Legg til {tabs.find(t => t.id === activeTab)?.name.toLowerCase()}
          </button>
        </div>

        {/* Tab Content */}
        <div style={{ padding: '1.5rem' }}>
          {activeTab === 'delivery' && (
            <div>
              <h2 style={{ fontSize: 'var(--font-size-xl)', fontWeight: '600', color: 'var(--gray-900)', marginBottom: '1rem' }}>
                Levering
              </h2>
              <p style={{ color: 'var(--gray-600)' }}>
                Administrer leveringer og transport. Her kan du spore leveringer, planlegge ruter og håndtere transportlogistikk.
              </p>
            </div>
          )}

          {activeTab === 'planning' && (
            <div>
              <h2 style={{ fontSize: 'var(--font-size-xl)', fontWeight: '600', color: 'var(--gray-900)', marginBottom: '1rem' }}>
                Planlegging
              </h2>
              <p style={{ color: 'var(--gray-600)' }}>
                Avansert planlegging og optimalisering av logistikkoperasjoner. Planlegg ruter, tidsplaner og ressurser.
              </p>
            </div>
          )}

          {activeTab === 'customers' && (
            <div>
              <h2 style={{ fontSize: 'var(--font-size-xl)', fontWeight: '600', color: 'var(--gray-900)', marginBottom: '1rem' }}>
                Kunder
              </h2>
              <p style={{ color: 'var(--gray-600)' }}>
                Administrer kundedatabase, kontaktinformasjon og kundeforhold. Spor kundehistorikk og preferanser.
              </p>
            </div>
          )}

          {activeTab === 'suppliers' && (
            <div>
              <h2 style={{ fontSize: 'var(--font-size-xl)', fontWeight: '600', color: 'var(--gray-900)', marginBottom: '1rem' }}>
                Leverandører
              </h2>
              <p style={{ color: 'var(--gray-600)' }}>
                Håndter leverandørrelasjoner, kontrakter og leveranseavtaler. Spor leverandørprestasjoner og kvalitet.
              </p>
            </div>
          )}

          {activeTab === 'products' && (
            <div>
              <h2 style={{ fontSize: 'var(--font-size-xl)', fontWeight: '600', color: 'var(--gray-900)', marginBottom: '1rem' }}>
                Produkter
              </h2>
              <p style={{ color: 'var(--gray-600)' }}>
                Administrer produktkatalog, priser og spesifikasjoner. Håndter produktinformasjon og kategorisering.
              </p>
            </div>
          )}

          {activeTab === 'inventory' && (
            <div>
              <h2 style={{ fontSize: 'var(--font-size-xl)', fontWeight: '600', color: 'var(--gray-900)', marginBottom: '1rem' }}>
                Lager
              </h2>
              <p style={{ color: 'var(--gray-600)' }}>
                Spor lagerbeholdning, lagerbevegelser og lagerstatus. Håndter lageroperasjoner og inventar.
              </p>
            </div>
          )}

          {activeTab === 'invoicing' && (
            <div>
              <h2 style={{ fontSize: 'var(--font-size-xl)', fontWeight: '600', color: 'var(--gray-900)', marginBottom: '1rem' }}>
                Fakturering
              </h2>
              <p style={{ color: 'var(--gray-600)' }}>
                Generer fakturaer, håndter betalinger og spor utestående beløp. Administrer faktureringsprosesser.
              </p>
            </div>
          )}

          {activeTab === 'finance' && (
            <div>
              <h2 style={{ fontSize: 'var(--font-size-xl)', fontWeight: '600', color: 'var(--gray-900)', marginBottom: '1rem' }}>
                Finans
              </h2>
              <p style={{ color: 'var(--gray-600)' }}>
                Finansiell oversikt, rapporter og analyse. Spor inntekter, utgifter og lønnsomhet.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
