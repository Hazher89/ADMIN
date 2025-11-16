'use client';

import React from 'react';
import { useState, useEffect } from 'react';
import {
  Package, Truck, MapPin, Settings, X, Save, Download, Zap,
  RefreshCw, Route, CheckCircle, AlertTriangle, Clock, Weight,
  Navigation, BarChart3, Plus, Filter, Calendar, Star, TrendingUp
} from 'lucide-react';

interface FreightUnit {
  id: string;
  orderNumber: string;
  customer: string;
  address: string;
  weight: number;
  volume: number;
  deliveryDate: string;
  deliveryTimeFrom: string;
  deliveryTimeTo: string;
  zone: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'unassigned' | 'assigned' | 'in_transit' | 'delivered';
  price: number;
  specialRequirements?: string;
  products?: {
    serviceId: string;
    serviceName: string;
    serviceDescription: string;
    serviceCategory: string;
    price: number;
    quantity: number;
  }[];
  totalProducts?: number;
  returnType?: 'none' | 'old_item' | 'disposal';
  returnDescription?: string;
  returnOrderId?: string;
  customerPhone?: string;
  customerEmail?: string;
}

interface FreightOrder {
  id: string;
  name: string;
  routeNumber?: string; // Added route number field
  vehicle?: string;
  driver?: string;
  freightUnits: FreightUnit[];
  totalWeight: number;
  totalVolume: number;
  maxWeight: number;
  maxVolume: number;
  distance: number;
  status: 'planned' | 'released' | 'in_progress' | 'completed';
  startTime: string;
  endTime: string;
  cost: number;
  warnings: string[];
  savedAt?: string; // Added for persistent storage
}

interface Resource {
  id: string;
  name: string;
  type: 'vehicle' | 'driver';
  capacity?: number;
  volumeCapacity?: number;
  available: boolean;
  currentLocation?: string;
  vehicleType?: 'company_car' | 'one_man' | 'two_man';
  vehicleNumber?: string;
  driverName?: string;
  typeEmoji?: string;
  vehicleAssignment?: string;
}

interface CockpitInterfaceProps {
  freightUnits: FreightUnit[];
  freightOrders: FreightOrder[];
  resources: Resource[];
  selectedProfile: string;
  searchFilter: string;
  showGantt: boolean;
  showMap: boolean;
  viewMode: 'day' | 'week';
  editMode: boolean;
  draggedFU: FreightUnit | null;
  selectedFUs: string[];
  visibleColumns: string[];
  onSetSelectedProfile: (profile: string) => void;
  onSetSearchFilter: (filter: string) => void;
  onSetShowGantt: (show: boolean) => void;
  onSetShowMap: (show: boolean) => void;
  onSetViewMode: (mode: 'day' | 'week') => void;
  onDragFUStart: (fu: FreightUnit | null) => void;
  onDropFUOnFO: (foId: string) => void;
  onRemoveFUFromFO: (foId: string, fuId: string) => void;
  onCreateNewFO: () => void;
  onAutoAssign: () => void;
  onOptimizeFO: (foId: string) => void;
  onReleaseFO: (foId: string) => void;
  onRefresh: () => void;
  onExport: () => void;
  onCloseCockpit: () => void;
  onOpenSettings: () => void;
  onSaveLayout?: () => void;
  onCancelEdit?: () => void;
  onToggleFUSelection: (fuId: string) => void;
  onRecalculateCharges: (foId: string) => void;
  onChangeFUDate: (fuId: string, newDate: string) => void;
  onAddNoteToFO: (foId: string, note: string) => void;
  onAssignResourceToFO?: (foId: string, resourceId: string) => void;
  onDropFUOnResource?: (resourceId: string) => void;
  onDownloadDocument: (type: string, fo: FreightOrder) => void;
  onSendToDriver: (fo: FreightOrder) => void;
  onRemoveRouteAssignment: (fo: FreightOrder) => void;
  onSaveRoutes: () => void;
  onSetRouteNumber: (fo: FreightOrder, routeNumber: string) => void;
  showRouteNumberModal: FreightOrder | null;
  setShowRouteNumberModal: (fo: FreightOrder | null) => void;
  routeNumberInput: string;
  setRouteNumberInput: (value: string) => void;
}

export default function CockpitInterface({
  freightUnits,
  freightOrders,
  resources,
  selectedProfile,
  searchFilter,
  showGantt,
  showMap,
  viewMode,
  editMode,
  draggedFU,
  selectedFUs,
  visibleColumns,
  onSetSelectedProfile,
  onSetSearchFilter,
  onSetShowGantt,
  onSetShowMap,
  onSetViewMode,
  onDragFUStart,
  onDropFUOnFO,
  onRemoveFUFromFO,
  onCreateNewFO,
  onAutoAssign,
  onOptimizeFO,
  onReleaseFO,
  onRefresh,
  onExport,
  onCloseCockpit,
  onOpenSettings,
  onSaveLayout,
  onCancelEdit,
  onToggleFUSelection,
  onRecalculateCharges,
  onChangeFUDate,
  onAddNoteToFO,
  onAssignResourceToFO,
  onDropFUOnResource,
  onDownloadDocument,
  onSendToDriver,
  onRemoveRouteAssignment,
  onSaveRoutes,
  onSetRouteNumber,
  showRouteNumberModal,
  setShowRouteNumberModal,
  routeNumberInput,
  setRouteNumberInput
}: CockpitInterfaceProps) {
  
  const [expandedFO, setExpandedFO] = useState<string | null>(null);
  const [showChargesModal, setShowChargesModal] = useState<FreightOrder | null>(null);
  const [showDocumentsModal, setShowDocumentsModal] = useState<FreightOrder | null>(null);
  const [showAddNoteModal, setShowAddNoteModal] = useState<FreightOrder | null>(null);
  const [noteText, setNoteText] = useState('');
  const [showGuide, setShowGuide] = useState(false);
  const [draggedResource, setDraggedResource] = useState<Resource | null>(null);
  const [selectedFOForResource, setSelectedFOForResource] = useState<string | null>(null);
  const [showPlanSelectedModal, setShowPlanSelectedModal] = useState(false);
  
  // Check if guide should show (client-side only)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const guideShown = localStorage.getItem('cockpitGuideShown');
      if (!guideShown) {
        setShowGuide(true);
      }
    }
  }, []);

  const filteredFUs = freightUnits.filter(fu => {
    if (selectedProfile !== 'all') {
      if (selectedProfile === 'unassigned' && fu.status !== 'unassigned') return false;
      if (selectedProfile === 'urgent' && fu.priority !== 'urgent') return false;
      if (selectedProfile === 'today' && fu.deliveryDate === '2025-10-02') return true;
    }
    if (searchFilter) {
      return fu.customer.toLowerCase().includes(searchFilter.toLowerCase()) ||
             fu.orderNumber.toLowerCase().includes(searchFilter.toLowerCase()) ||
             fu.zone.toLowerCase().includes(searchFilter.toLowerCase());
    }
    return true;
  });

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return { bg: 'rgba(239, 68, 68, 0.2)', text: 'var(--danger)', border: 'var(--danger)' };
      case 'high': return { bg: 'rgba(245, 158, 11, 0.2)', text: 'var(--warning)', border: 'var(--warning)' };
      case 'medium': return { bg: 'rgba(6, 182, 212, 0.2)', text: 'var(--primary)', border: 'var(--primary)' };
      case 'low': return { bg: 'var(--gray-100)', text: 'var(--gray-600)', border: 'var(--border-color)' };
      default: return { bg: 'var(--gray-100)', text: 'var(--gray-600)', border: 'var(--border-color)' };
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'planned': return { bg: 'rgba(6, 182, 212, 0.2)', text: 'var(--primary)' };
      case 'released': return { bg: 'rgba(16, 185, 129, 0.2)', text: 'var(--success)' };
      case 'in_progress': return { bg: 'rgba(245, 158, 11, 0.2)', text: 'var(--warning)' };
      case 'completed': return { bg: 'rgba(16, 185, 129, 0.2)', text: 'var(--success)' };
      default: return { bg: 'var(--gray-100)', text: 'var(--gray-600)' };
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0, // Full screen when Topbar is hidden
      left: 0, // Full screen when Sidebar is hidden
      right: 0,
      bottom: 0,
      backgroundColor: 'var(--background-color)',
      fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      fontSize: '13px',
      zIndex: 50,
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column'
    }}>
      
      {/* ========== PREMIUM HEADER ========== */}
      <div style={{
        backgroundColor: 'var(--card-background)',
        borderBottom: '2px solid var(--border-color)',
        padding: '12px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        zIndex: 100
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{
            background: 'var(--gradient-primary)',
            color: 'var(--text-color)',
            padding: '8px 16px',
            borderRadius: '8px',
            fontWeight: '700',
            fontSize: '14px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)'
          }}>
            <Navigation size={18} />
            TRANSPORTATION COCKPIT
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: '20px', fontWeight: '700', color: 'var(--text-color)', letterSpacing: '-0.02em' }}>
              DriftPro Logistics Control Center
            </h1>
            <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: 'var(--gray-500)', fontWeight: '500' }}>
              Real-time planning & optimization • {new Date().toLocaleDateString('no-NO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Live Status Indicator */}
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px', 
            fontSize: '12px', 
            color: 'var(--success)',
            backgroundColor: 'rgba(16, 185, 129, 0.2)',
            padding: '6px 12px',
            borderRadius: '6px',
            fontWeight: '600'
          }}>
            <div style={{ 
              width: '8px', 
              height: '8px', 
              backgroundColor: 'var(--success)', 
              borderRadius: '50%',
              animation: 'pulse 2s infinite'
            }}></div>
            System Online
          </div>

          {/* Edit Mode Buttons */}
          {editMode && (
            <>
              <button 
                onClick={onSaveLayout}
                style={{
                  padding: '8px 16px',
                  backgroundColor: 'var(--success)',
                  color: 'var(--text-color)',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--success)';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.4)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--success)';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(16, 185, 129, 0.3)';
                }}
              >
                <Save size={16} />
                Lagre Layout
              </button>
              <button 
                onClick={onCancelEdit}
                style={{
                  padding: '8px 16px',
                  backgroundColor: 'var(--danger)',
                  color: 'var(--text-color)',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: '0 2px 8px rgba(239, 68, 68, 0.3)',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#f87171';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(239, 68, 68, 0.4)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#ef4444';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(239, 68, 68, 0.3)';
                }}
              >
                <X size={16} />
                Avbryt
              </button>
            </>
          )}
          
          <button 
            onClick={onOpenSettings}
            style={{
              padding: '8px 14px',
              backgroundColor: 'var(--gray-50)',
              color: 'var(--gray-500)',
              border: '1px solid var(--border-color)',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: '500',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.2s ease'
            }}>
            <Settings size={16} />
            Innstillinger
          </button>
          <button 
            onClick={onCloseCockpit}
            style={{
              padding: '8px 14px',
              backgroundColor: '#ef4444',
              color: 'var(--text-color)',
              border: 'none',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 2px 8px rgba(239, 68, 68, 0.25)'
            }}>
            <X size={16} />
            Lukk
          </button>
        </div>
      </div>

      {/* ========== KPI DASHBOARD ========== */}
      <div style={{
        backgroundColor: 'var(--gray-200)',
        padding: '16px 24px',
        borderBottom: '1px solid var(--border-color)',
        display: 'grid',
        gridTemplateColumns: 'repeat(6, 1fr)',
        gap: '12px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
      }}>
        {[
          { label: 'Totalt FU', value: freightUnits.length, icon: Package, color: 'var(--primary)', bg: 'rgba(6, 182, 212, 0.2)' },
          { label: 'Ikke tildelt', value: freightUnits.filter(fu => fu.status === 'unassigned').length, icon: AlertTriangle, color: 'var(--danger)', bg: 'rgba(239, 68, 68, 0.2)' },
          { label: 'Aktive FO', value: freightOrders.length, icon: Route, color: 'var(--success)', bg: 'rgba(16, 185, 129, 0.2)' },
          { label: 'Total vekt', value: `${freightUnits.reduce((s, fu) => s + fu.weight, 0)}kg`, icon: Weight, color: 'var(--primary)', bg: 'rgba(139, 92, 246, 0.2)' },
          { label: 'Inntekt', value: `${freightUnits.reduce((s, fu) => s + fu.price, 0)},-`, icon: TrendingUp, color: 'var(--success)', bg: 'rgba(16, 185, 129, 0.2)' },
          { label: 'Kostnad', value: `${(freightOrders.reduce((s, fo) => s + (fo.cost || 0), 0) || 0).toFixed(0)},-`, icon: BarChart3, color: 'var(--danger)', bg: 'rgba(239, 68, 68, 0.2)' }
        ].map((kpi, idx) => (
          <div key={idx} style={{
            backgroundColor: 'var(--card-background)',
            borderRadius: '10px',
            padding: '12px',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
            border: '1px solid var(--border-color)',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.12)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.08)';
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '10px', fontWeight: '600', color: 'var(--gray-500)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {kpi.label}
              </span>
              <div style={{
                width: '28px',
                height: '28px',
                backgroundColor: kpi.bg,
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                {React.createElement(kpi.icon, { size: 14, style: { color: kpi.color } })}
              </div>
            </div>
            <div style={{ fontSize: '20px', fontWeight: '800', color: 'var(--text-color)', letterSpacing: '-0.02em' }}>
              {kpi.value}
            </div>
          </div>
        ))}
      </div>

      {/* ========== ACTION TOOLBAR ========== */}
      <div style={{
        backgroundColor: 'var(--card-background)',
        borderBottom: '1px solid var(--border-color)',
        padding: '10px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '16px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1 }}>
          {/* Profile Selector */}
          <select
            value={selectedProfile}
            onChange={(e) => onSetSelectedProfile(e.target.value)}
            style={{
              padding: '8px 12px',
              backgroundColor: 'var(--gray-50)',
              border: '1px solid var(--border-color)',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: '500',
              cursor: 'pointer',
              color: 'var(--text-color)',
              minWidth: '180px'
            }}
          >
            <option value="all">📋 Alle leveranser</option>
            <option value="unassigned">🔴 Ikke tildelt</option>
            <option value="urgent">⚡ Haster</option>
            <option value="today">📅 I dag</option>
          </select>

          {/* Search Bar */}
          <div style={{ position: 'relative', flex: 1, maxWidth: '400px' }}>
            <input
              type="text"
              placeholder="Søk etter kunde, ordrenummer, sone..."
              value={searchFilter}
              onChange={(e) => onSetSearchFilter(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px 8px 36px',
                border: '1px solid var(--border-color)',
                borderRadius: '6px',
                fontSize: '12px',
                backgroundColor: 'var(--gray-50)'
              }}
            />
            <Filter size={14} style={{ 
              position: 'absolute', 
              left: '12px', 
              top: '50%', 
              transform: 'translateY(-50%)',
              color: 'var(--gray-500)'
            }} />
          </div>

          <button 
            onClick={onRefresh}
            style={{
              padding: '8px 12px',
              backgroundColor: 'var(--gray-50)',
              border: '1px solid var(--border-color)',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: '500',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              color: 'var(--gray-600)',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--gray-200)';
              e.currentTarget.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--gray-50)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}>
            <RefreshCw size={14} />
            Oppdater
          </button>

          <button 
            onClick={onExport}
            style={{
              padding: '8px 12px',
              backgroundColor: 'var(--gray-50)',
              border: '1px solid var(--border-color)',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: '500',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              color: 'var(--gray-600)',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--gray-200)';
              e.currentTarget.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--gray-50)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}>
            <Download size={14} />
            Eksporter
          </button>

          <button 
            onClick={onSaveRoutes}
            style={{
              padding: '8px 12px',
              backgroundColor: 'var(--success)',
              color: 'var(--text-color)',
              border: 'none',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--success)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--success)';
            }}>
            <Save size={14} />
            Lagre ruter
          </button>

          <button 
            onClick={onAutoAssign}
            style={{
              padding: '8px 16px',
              backgroundColor: 'var(--primary)',
              color: 'var(--text-color)',
              border: 'none',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 2px 8px rgba(59, 130, 246, 0.3)',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#2563eb';
              e.currentTarget.style.transform = 'translateY(-1px)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#3b82f6';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 2px 8px rgba(59, 130, 246, 0.3)';
            }}>
            <Zap size={14} />
            Auto-tildel
          </button>

          <button 
            onClick={onCreateNewFO}
            style={{
              padding: '8px 16px',
              backgroundColor: 'var(--success)',
              color: 'var(--text-color)',
              border: 'none',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--success)';
              e.currentTarget.style.transform = 'translateY(-1px)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--success)';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 2px 8px rgba(16, 185, 129, 0.3)';
            }}>
            <Plus size={14} />
            Ny Rute
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '11px', color: 'var(--gray-500)', fontWeight: '600' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Package size={14} />
            FU: <strong style={{ color: 'var(--text-color)' }}>{freightUnits.length}</strong>
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Route size={14} />
            FO: <strong style={{ color: 'var(--text-color)' }}>{freightOrders.length}</strong>
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Truck size={14} />
            Biler: <strong style={{ color: 'var(--text-color)' }}>{resources.filter(r => r.type === 'vehicle').length}</strong>
          </span>
          
          {/* Debug info */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 12px',
            backgroundColor: resources.length > 0 ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
            border: `1px solid ${resources.length > 0 ? 'var(--success)' : 'var(--danger)'}`,
            borderRadius: '6px',
            color: resources.length > 0 ? 'var(--success)' : 'var(--danger)',
            fontSize: '11px',
            fontWeight: '600'
          }}>
            {resources.length > 0 ? '✓' : '⚠️'} {resources.length} ressurser lastet
          </div>
          
          {/* Link to Partners */}
          <a 
            href="/dashboard/partners"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              backgroundColor: 'rgba(245, 158, 11, 0.2)',
              border: '1px solid var(--warning)',
              borderRadius: '6px',
              color: 'var(--warning)',
              textDecoration: 'none',
              fontSize: '11px',
              fontWeight: '600',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(245, 158, 11, 0.3)';
              e.currentTarget.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#fef3c7';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            🔗 Samarbeidspartnere
          </a>
        </div>
      </div>

      {/* ========== MAIN 3-PANEL COCKPIT ========== */}
      <div style={{ 
        display: 'flex', 
        flex: 1, 
        overflow: 'hidden',
        gap: '1px',
          backgroundColor: 'var(--border-color)'
      }}>
        
        {/* LEFT PANEL - FREIGHT UNITS (Leveranser) */}
        <div style={{ 
          width: '350px', 
          backgroundColor: 'var(--card-background)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}>
          <div style={{
            padding: '16px',
            borderBottom: '2px solid var(--border-color)',
            backgroundColor: selectedFUs.length > 0 ? 'rgba(6, 182, 212, 0.2)' : 'var(--gray-50)',
            transition: 'background-color 0.3s ease'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <h3 style={{ 
                margin: 0, 
                fontSize: '15px', 
                fontWeight: '700', 
                color: 'var(--text-color)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <Package size={18} style={{ color: 'var(--primary)' }} />
                Freight Units
                {selectedFUs.length > 0 && (
                  <span style={{
                    backgroundColor: 'var(--primary)',
                    color: 'var(--text-color)',
                    padding: '2px 8px',
                    borderRadius: '12px',
                    fontSize: '11px',
                    fontWeight: '700'
                  }}>
                    {selectedFUs.length} valgt
                  </span>
                )}
              </h3>
              <span style={{
                backgroundColor: freightUnits.filter(fu => fu.status === 'unassigned').length > 0 ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                color: freightUnits.filter(fu => fu.status === 'unassigned').length > 0 ? 'var(--danger)' : 'var(--success)',
                padding: '4px 10px',
                borderRadius: '12px',
                fontSize: '11px',
                fontWeight: '700'
              }}>
                {freightUnits.filter(fu => fu.status === 'unassigned').length} ikke tildelt
              </span>
            </div>
            
            {selectedFUs.length > 0 ? (
              <div style={{ 
                display: 'flex', 
                gap: '8px', 
                alignItems: 'center',
                padding: '8px',
                backgroundColor: 'rgba(6, 182, 212, 0.2)',
                borderRadius: '6px',
                border: '1px solid var(--primary)'
              }}>
                <span style={{ fontSize: '11px', color: 'var(--primary)', fontWeight: '600', flex: 1 }}>
                  ✓ {selectedFUs.length} leveranser valgt
                </span>
                <button
                  onClick={() => setShowPlanSelectedModal(true)}
                  style={{
                    padding: '6px 14px',
                    backgroundColor: 'var(--success)',
                    color: 'var(--text-color)',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--success)';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--success)';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}>
                  <Truck size={14} />
                  Planlegg Valgte
                </button>
                <button
                  onClick={() => {
                    // Clear all selections
                    selectedFUs.forEach(id => onToggleFUSelection(id));
                  }}
                  style={{
                    padding: '6px 10px',
                    backgroundColor: 'var(--card-background)',
                    color: 'var(--gray-500)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '6px',
                    fontSize: '11px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--gray-50)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--card-background)';
                  }}>
                  ✕ Fjern valg
                </button>
              </div>
            ) : (
              <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '500' }}>
                Dra leveranser til kjørelister → Eller velg flere for masseredigering
              </div>
            )}
          </div>

          {/* FU List */}
          <div style={{ flex: 1, overflow: 'auto', padding: '12px' }}>
            {filteredFUs.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '60px 20px',
                color: '#94a3b8'
              }}>
                <Package size={48} style={{ margin: '0 auto 16px', opacity: 0.3 }} />
                <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>
                  Ingen leveranser funnet
                </div>
                <div style={{ fontSize: '12px' }}>
                  Prøv å endre filter eller søk
                </div>
              </div>
            ) : (
              filteredFUs.map(fu => {
                const colors = getPriorityColor(fu.priority);
                
                return (
                  <div
                    key={fu.id}
                    draggable={fu.status === 'unassigned'}
                    onDragStart={(e) => {
                      if (fu.status === 'unassigned') {
                        onDragFUStart(fu);
                      } else {
                        e.preventDefault();
                      }
                    }}
                    onDragEnd={() => {
                      // Clear dragged state when drag ends
                      if (draggedFU) {
                        onDragFUStart(null as any); // Clear by setting to null
                      }
                    }}
                    style={{
                      backgroundColor: draggedFU?.id === fu.id ? 'rgba(6, 182, 212, 0.2)' : 'var(--card-background)',
                      border: `2px solid ${colors.border}`,
                      borderLeft: `4px solid ${colors.border}`,
                      borderRadius: '8px',
                      padding: '12px',
                      marginBottom: '10px',
                      cursor: fu.status === 'unassigned' ? 'grab' : 'not-allowed',
                      opacity: fu.status === 'assigned' ? 0.5 : 1,
                      transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                      boxShadow: draggedFU?.id === fu.id 
                        ? '0 12px 24px rgba(59, 130, 246, 0.3), 0 0 0 2px rgba(59, 130, 246, 0.1)' 
                        : '0 1px 3px rgba(0,0,0,0.08)',
                      transform: draggedFU?.id === fu.id 
                        ? 'scale(1.03) rotate(-1deg)' 
                        : 'scale(1)',
                      position: 'relative'
                    }}
                    onMouseEnter={(e) => {
                      if (fu.status === 'unassigned' && draggedFU?.id !== fu.id) {
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.12)';
                        e.currentTarget.style.transform = 'scale(1.01) translateY(-2px)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (draggedFU?.id !== fu.id) {
                        e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.08)';
                        e.currentTarget.style.transform = 'scale(1)';
                      }
                    }}
                  >
                  {/* Selection Checkbox */}
                  {fu.status === 'unassigned' && (
                    <input
                      type="checkbox"
                      checked={selectedFUs.includes(fu.id)}
                      onChange={() => onToggleFUSelection(fu.id)}
                      onClick={(e) => e.stopPropagation()}
                      style={{
                        position: 'absolute',
                        top: '10px',
                        left: '10px',
                        width: '18px',
                        height: '18px',
                        cursor: 'pointer',
                        accentColor: 'var(--primary)'
                      }}
                    />
                  )}
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', paddingLeft: fu.status === 'unassigned' ? '28px' : '0' }}>
                    <div style={{ fontWeight: '700', fontSize: '13px', color: 'var(--text-color)' }}>
                      {fu.orderNumber}
                    </div>
                    <div style={{
                      backgroundColor: colors.bg,
                      color: colors.text,
                      padding: '2px 8px',
                      borderRadius: '4px',
                      fontSize: '10px',
                      fontWeight: '700',
                      textTransform: 'uppercase'
                    }}>
                      {fu.priority === 'urgent' && '🔥 '}
                      {fu.priority}
                    </div>
                  </div>
                  
                  <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-color)', marginBottom: '6px' }}>
                    {fu.customer}
                  </div>
                  
                  <div style={{ fontSize: '11px', color: 'var(--gray-500)', marginBottom: '8px', display: 'flex', alignItems: 'start', gap: '4px' }}>
                    <MapPin size={12} style={{ flexShrink: 0, marginTop: '2px' }} />
                    <span>{fu.address}</span>
                  </div>

                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(3, 1fr)', 
                    gap: '8px',
                    marginBottom: '8px'
                  }}>
                    <div style={{
                      backgroundColor: '#f1f5f9',
                      padding: '6px',
                      borderRadius: '6px',
                      textAlign: 'center'
                    }}>
                      <div style={{ fontSize: '10px', color: '#64748b', marginBottom: '2px' }}>Vekt</div>
                      <div style={{ fontSize: '12px', fontWeight: '700', color: '#0f172a' }}>{fu.weight}kg</div>
                    </div>
                    <div style={{
                      backgroundColor: '#f1f5f9',
                      padding: '6px',
                      borderRadius: '6px',
                      textAlign: 'center'
                    }}>
                      <div style={{ fontSize: '10px', color: '#64748b', marginBottom: '2px' }}>Produkter</div>
                      <div style={{ fontSize: '12px', fontWeight: '700', color: '#0f172a' }}>
                        {fu.totalProducts || fu.products?.reduce((sum, p) => sum + p.quantity, 0) || 0} stk
                      </div>
                    </div>
                    <div style={{
                      backgroundColor: '#f1f5f9',
                      padding: '6px',
                      borderRadius: '6px',
                      textAlign: 'center'
                    }}>
                      <div style={{ fontSize: '10px', color: '#64748b', marginBottom: '2px' }}>Pris</div>
                      <div style={{ fontSize: '12px', fontWeight: '700', color: 'var(--success)' }}>{fu.price},-</div>
                    </div>
                  </div>

                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    fontSize: '11px',
                    paddingTop: '8px',
                    borderTop: '1px solid #f1f5f9'
                  }}>
                    <span style={{ color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Clock size={11} />
                      {fu.deliveryTimeFrom}-{fu.deliveryTimeTo}
                    </span>
                    <span style={{ 
                      fontWeight: '600', 
                      color: '#6366f1',
                      backgroundColor: '#eef2ff',
                      padding: '2px 8px',
                      borderRadius: '4px'
                    }}>
                      {fu.zone}
                    </span>
                  </div>

                  {/* Status Display */}
                  {fu.status === 'assigned' && (
                    <div style={{
                      marginTop: '8px',
                      backgroundColor: 'rgba(16, 185, 129, 0.2)',
                      border: '1px solid #a7f3d0',
                      borderRadius: '6px',
                      padding: '6px 8px',
                      fontSize: '10px',
                      color: '#065f46',
                      fontWeight: '500',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}>
                      <span>✅</span>
                      <span>Planlagt på {freightOrders.find(fo => fo.freightUnits.some(f => f.id === fu.id))?.driver || freightOrders.find(fo => fo.freightUnits.some(f => f.id === fu.id))?.vehicle || freightOrders.find(fo => fo.freightUnits.some(f => f.id === fu.id))?.name || 'ukjent rute'}</span>
                      {(() => {
                        const assignedFO = freightOrders.find(fo => fo.freightUnits.some(f => f.id === fu.id));
                        console.log('🔍 Debug FU status for', fu.id, ':', {
                          assignedFO: assignedFO?.name,
                          driver: assignedFO?.driver,
                          vehicle: assignedFO?.vehicle,
                          hasDriver: !!assignedFO?.driver
                        });
                        // Show driver info if available, otherwise show "Ingen sjåfør tildelt"
                        return assignedFO?.driver ? (
                          <span> • Sjåfør: {assignedFO.driver}</span>
                        ) : (
                          <span> • Ingen sjåfør tildelt</span>
                        );
                      })()}
                      {freightOrders.find(fo => fo.freightUnits.some(f => f.id === fu.id))?.routeNumber && (
                        <span>• {freightOrders.find(fo => fo.freightUnits.some(f => f.id === fu.id))?.routeNumber}</span>
                      )}
                    </div>
                  )}

                  {/* Product Information */}
                  {fu.products && fu.products.length > 0 && (
                    <div style={{
                      marginTop: '8px',
                      backgroundColor: '#f0f9ff',
                      border: '1px solid #bae6fd',
                      borderRadius: '6px',
                      padding: '8px',
                      fontSize: '10px'
                    }}>
                      <div style={{ fontWeight: '600', color: '#0369a1', marginBottom: '4px' }}>
                        📦 Produkter ({fu.totalProducts || fu.products.reduce((sum, p) => sum + p.quantity, 0)} stk)
                      </div>
                      {fu.products.map((product, idx) => (
                        <div key={idx} style={{ 
                          display: 'flex', 
                          justifyContent: 'space-between', 
                          alignItems: 'center',
                          padding: '2px 0',
                          borderBottom: idx < fu.products!.length - 1 ? '1px solid var(--border-color)' : 'none'
                        }}>
                          <span style={{ color: 'var(--text-color)', fontWeight: '500' }}>
                            {product.serviceName} × {product.quantity}
                          </span>
                          <span style={{ color: 'var(--success)', fontWeight: '600' }}>
                            {product.price * product.quantity},-
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Return Information */}
                  {fu.returnType && fu.returnType !== 'none' && (
                    <div style={{
                      marginTop: '8px',
                      backgroundColor: '#fef2f2',
                      border: '1px solid #fecaca',
                      borderRadius: '6px',
                      padding: '6px 8px',
                      fontSize: '10px',
                      color: '#991b1b',
                      fontWeight: '500',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}>
                      <span>🔄</span>
                      <span>
                        {fu.returnType === 'old_item' ? 'Retur av gammel vare' : 'Retur til kast'}
                        {fu.returnDescription && `: ${fu.returnDescription}`}
                      </span>
                    </div>
                  )}

                  {/* Customer Contact Info */}
                  {(fu.customerPhone || fu.customerEmail) && (
                    <div style={{
                      marginTop: '8px',
                      backgroundColor: 'var(--gray-50)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '6px',
                      padding: '6px 8px',
                      fontSize: '10px',
                      color: '#475569'
                    }}>
                      <div style={{ fontWeight: '600', marginBottom: '2px' }}>📞 Kontaktinfo</div>
                      {fu.customerPhone && <div>Tel: {fu.customerPhone}</div>}
                      {fu.customerEmail && <div>Email: {fu.customerEmail}</div>}
                    </div>
                  )}

                  {fu.specialRequirements && (
                    <div style={{
                      marginTop: '8px',
                      backgroundColor: '#fef3c7',
                      border: '1px solid #fde68a',
                      borderRadius: '6px',
                      padding: '6px 8px',
                      fontSize: '10px',
                      color: '#92400e',
                      fontWeight: '500',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}>
                      <AlertTriangle size={11} />
                      {fu.specialRequirements}
                    </div>
                  )}
                </div>
              );
            })
          )}
          </div>
        </div>

        {/* CENTER PANEL - FREIGHT ORDERS (Kjørelister) */}
        <div style={{ 
          flex: 1,
          backgroundColor: 'var(--card-background)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}>
          <div style={{
            padding: '16px',
            borderBottom: '2px solid var(--border-color)',
            backgroundColor: 'var(--gray-50)'
          }}>
            <h3 style={{ 
              margin: 0, 
              fontSize: '15px', 
              fontWeight: '700', 
              color: 'var(--text-color)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '4px'
            }}>
              <Route size={18} style={{ color: 'var(--success)' }} />
              Kjøreoppdrag
            </h3>
            <div style={{ fontSize: '11px', color: 'var(--gray-500)', fontWeight: '500' }}>
              Slipp leveranser her for å planlegge ruter
            </div>
          </div>

          <div style={{ flex: 1, overflow: 'auto', padding: '16px', backgroundColor: 'var(--gray-50)' }}>
            {freightOrders.map(fo => {
              const statusColors = getStatusColor(fo.status);
              const weightPercentage = (fo.totalWeight / fo.maxWeight) * 100;
              const volumePercentage = (fo.totalVolume / fo.maxVolume) * 100;
              const isOvercapacity = weightPercentage > 100 || volumePercentage > 100;

              return (
                <div
                  key={fo.id}
                  onDragOver={(e) => {
                    e.preventDefault();
                    if (draggedResource) {
                      e.currentTarget.style.backgroundColor = 'rgba(139, 92, 246, 0.2)';
                      e.currentTarget.style.borderColor = '#8b5cf6';
                    } else {
                      e.currentTarget.style.backgroundColor = 'rgba(6, 182, 212, 0.2)';
                      e.currentTarget.style.borderColor = '#3b82f6';
                    }
                  }}
                  onDragLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--card-background)';
                    e.currentTarget.style.borderColor = isOvercapacity ? 'var(--danger)' : 'var(--border-color)';
                  }}
                  onDrop={(e) => {
                    if (draggedResource && onAssignResourceToFO) {
                      onAssignResourceToFO(fo.id, draggedResource.id);
                      setDraggedResource(null);
                    } else {
                      onDropFUOnFO(fo.id);
                    }
                    e.currentTarget.style.backgroundColor = 'var(--card-background)';
                    e.currentTarget.style.borderColor = isOvercapacity ? 'var(--danger)' : 'var(--border-color)';
                  }}
                  style={{
                    backgroundColor: 'var(--card-background)',
                    border: isOvercapacity ? '3px solid var(--danger)' : '2px solid var(--border-color)',
                    borderRadius: '12px',
                    padding: '16px',
                    marginBottom: '16px',
                    boxShadow: isOvercapacity 
                      ? '0 4px 16px rgba(239, 68, 68, 0.2)' 
                      : '0 2px 8px rgba(0,0,0,0.06)',
                    transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                    position: 'relative'
                  }}
                >
                  {/* FO Header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                        <h4 style={{ margin: 0, fontSize: '15px', fontWeight: '700', color: '#0f172a' }}>
                          {fo.name}
                          {fo.driver && (
                            <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '500' }}>
                              • Sjåfør: {fo.driver}
                            </span>
                          )}
                          {fo.routeNumber && (
                            <span style={{ fontSize: '12px', color: 'var(--success)', fontWeight: '600' }}>
                              • Felt: {fo.routeNumber}
                            </span>
                          )}
                        </h4>
                        <span style={{
                          backgroundColor: statusColors.bg,
                          color: statusColors.text,
                          padding: '4px 10px',
                          borderRadius: '6px',
                          fontSize: '11px',
                          fontWeight: '700',
                          textTransform: 'uppercase'
                        }}>
                          {fo.status}
                        </span>
                      </div>
                      <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '500' }}>
                        {fo.vehicle && `🚗 ${fo.vehicle}`} {fo.driver && `• 👤 ${fo.driver}`}
                      </div>
                    </div>
                    
                    <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                      <button
                        onClick={() => onOptimizeFO(fo.id)}
                        disabled={fo.freightUnits.length === 0}
                        title="Optimaliser stopprekkefølge"
                        style={{
                          padding: '6px 10px',
                          backgroundColor: fo.freightUnits.length > 0 ? '#f59e0b' : '#f3f4f6',
                          color: fo.freightUnits.length > 0 ? 'var(--text-color)' : 'var(--gray-400)',
                          border: 'none',
                          borderRadius: '6px',
                          fontSize: '11px',
                          fontWeight: '600',
                          cursor: fo.freightUnits.length > 0 ? 'pointer' : 'not-allowed',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                          if (fo.freightUnits.length > 0) {
                            e.currentTarget.style.backgroundColor = '#ea580c';
                            e.currentTarget.style.transform = 'translateY(-1px)';
                          }
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = fo.freightUnits.length > 0 ? '#f59e0b' : '#f3f4f6';
                          e.currentTarget.style.transform = 'translateY(0)';
                        }}>
                        <Zap size={11} />
                        Optimaliser
                      </button>
                      
                      <button
                        onClick={() => setShowChargesModal(fo)}
                        title="Se og recalculate priser"
                        style={{
                          padding: '6px 10px',
                          backgroundColor: '#8b5cf6',
                          color: 'var(--text-color)',
                          border: 'none',
                          borderRadius: '6px',
                          fontSize: '11px',
                          fontWeight: '600',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#7c3aed';
                          e.currentTarget.style.transform = 'translateY(-1px)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = '#8b5cf6';
                          e.currentTarget.style.transform = 'translateY(0)';
                        }}>
                        💰 Priser
                      </button>
                      
                      <button
                        onClick={() => setShowDocumentsModal(fo)}
                        title="Dokumenter og utskrifter"
                        style={{
                          padding: '6px 10px',
                          backgroundColor: '#06b6d4',
                          color: 'var(--text-color)',
                          border: 'none',
                          borderRadius: '6px',
                          fontSize: '11px',
                          fontWeight: '600',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#0891b2';
                          e.currentTarget.style.transform = 'translateY(-1px)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = '#06b6d4';
                          e.currentTarget.style.transform = 'translateY(0)';
                        }}>
                        📄 Docs
                      </button>
                      
                      <button
                        onClick={() => setShowAddNoteModal(fo)}
                        title="Legg til notat"
                        style={{
                          padding: '6px 10px',
                          backgroundColor: '#64748b',
                          color: 'var(--text-color)',
                          border: 'none',
                          borderRadius: '6px',
                          fontSize: '11px',
                          fontWeight: '600',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#475569';
                          e.currentTarget.style.transform = 'translateY(-1px)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = '#64748b';
                          e.currentTarget.style.transform = 'translateY(0)';
                        }}>
                        📝
                      </button>
                      
                        <button
                          onClick={() => setShowRouteNumberModal(fo)}
                          title="Sett felt"
                          style={{
                            padding: '6px 10px',
                            backgroundColor: 'var(--primary)',
                            color: 'var(--text-color)',
                            border: 'none',
                            borderRadius: '6px',
                            fontSize: '11px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            transition: 'all 0.2s ease'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = '#2563eb';
                            e.currentTarget.style.transform = 'translateY(-1px)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = '#3b82f6';
                            e.currentTarget.style.transform = 'translateY(0)';
                          }}>
                          📍
                        </button>

                      {fo.vehicle && (
                        <button
                          onClick={() => onRemoveRouteAssignment(fo)}
                          title="Fjern rute fra kjøretøy"
                          style={{
                            padding: '6px 10px',
                            backgroundColor: 'var(--danger)',
                            color: 'var(--text-color)',
                            border: 'none',
                            borderRadius: '6px',
                            fontSize: '11px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            transition: 'all 0.2s ease'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = '#f87171';
                            e.currentTarget.style.transform = 'translateY(-1px)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = '#ef4444';
                            e.currentTarget.style.transform = 'translateY(0)';
                          }}>
                          ❌
                        </button>
                      )}
                      
                      <button
                        onClick={() => onReleaseFO(fo.id)}
                        disabled={fo.freightUnits.length === 0 || fo.status === 'released'}
                        title={fo.status === 'released' ? 'Allerede frigitt' : 'Frigjør til sjåfør'}
                        style={{
                          padding: '6px 12px',
                          backgroundColor: fo.freightUnits.length > 0 && fo.status !== 'released' ? 'var(--success)' : 'var(--gray-100)',
                          color: fo.freightUnits.length > 0 && fo.status !== 'released' ? 'var(--text-color)' : 'var(--gray-400)',
                          border: 'none',
                          borderRadius: '6px',
                          fontSize: '11px',
                          fontWeight: '600',
                          cursor: fo.freightUnits.length > 0 && fo.status !== 'released' ? 'pointer' : 'not-allowed',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                          if (fo.freightUnits.length > 0 && fo.status !== 'released') {
                            e.currentTarget.style.backgroundColor = 'var(--success)';
                            e.currentTarget.style.transform = 'translateY(-1px)';
                          }
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = fo.freightUnits.length > 0 && fo.status !== 'released' ? '#10b981' : '#f3f4f6';
                          e.currentTarget.style.transform = 'translateY(0)';
                        }}>
                        <CheckCircle size={12} />
                        {fo.status === 'released' ? '✓ Frigitt' : 'Frigjør'}
                      </button>
                    </div>
                  </div>

                  {/* Capacity Indicators */}
                  <div style={{ marginBottom: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '4px' }}>
                      <span style={{ fontWeight: '600', color: '#475569' }}>
                        Vekt: {fo.totalWeight}/{fo.maxWeight}kg
                      </span>
                      <span style={{ fontWeight: '700', color: weightPercentage > 100 ? '#dc2626' : '#059669' }}>
                        {(weightPercentage || 0).toFixed(0)}%
                      </span>
                    </div>
                    <div style={{
                      width: '100%',
                      height: '8px',
                      backgroundColor: '#f1f5f9',
                      borderRadius: '4px',
                      overflow: 'hidden',
                      border: '1px solid #e2e8f0'
                    }}>
                      <div style={{
                        width: `${Math.min(weightPercentage, 100)}%`,
                        height: '100%',
                        backgroundColor: weightPercentage > 90 
                          ? '#ef4444' 
                          : weightPercentage > 70 
                            ? '#f59e0b' 
                            : '#10b981',
                        transition: 'all 0.3s ease',
                        borderRadius: '3px'
                      }} />
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginTop: '8px', marginBottom: '4px' }}>
                      <span style={{ fontWeight: '600', color: '#475569' }}>
                        Volum: {(fo.totalVolume || 0).toFixed(1)}/{fo.maxVolume || 0}m³
                      </span>
                      <span style={{ fontWeight: '700', color: volumePercentage > 100 ? '#dc2626' : '#059669' }}>
                        {(volumePercentage || 0).toFixed(0)}%
                      </span>
                    </div>
                    <div style={{
                      width: '100%',
                      height: '8px',
                      backgroundColor: '#f1f5f9',
                      borderRadius: '4px',
                      overflow: 'hidden',
                      border: '1px solid #e2e8f0'
                    }}>
                      <div style={{
                        width: `${Math.min(volumePercentage, 100)}%`,
                        height: '100%',
                        backgroundColor: volumePercentage > 90 
                          ? '#ef4444' 
                          : volumePercentage > 70 
                            ? '#f59e0b' 
                            : '#3b82f6',
                        transition: 'all 0.3s ease',
                        borderRadius: '3px'
                      }} />
                    </div>
                  </div>

                  {/* Warnings */}
                  {fo.warnings.length > 0 && (
                    <div style={{
                      backgroundColor: 'rgba(239, 68, 68, 0.2)',
                      border: '1px solid #fca5a5',
                      borderRadius: '6px',
                      padding: '8px',
                      marginBottom: '12px'
                    }}>
                      {fo.warnings.map((warning, idx) => (
                        <div key={idx} style={{ 
                          fontSize: '11px', 
                          color: '#991b1b', 
                          fontWeight: '600',
                          marginBottom: idx < fo.warnings.length - 1 ? '4px' : 0
                        }}>
                          {warning}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* FU Items in FO */}
                  {fo.freightUnits.length > 0 ? (
                    <div style={{ 
                      backgroundColor: 'var(--gray-50)',
                      borderRadius: '8px',
                      padding: '10px',
                      marginTop: '12px'
                    }}>
                      <div 
                        onClick={() => setExpandedFO(expandedFO === fo.id ? null : fo.id)}
                        style={{ 
                          fontSize: '11px', 
                          fontWeight: '700', 
                          color: 'var(--gray-600)', 
                          marginBottom: '8px', 
                          textTransform: 'uppercase', 
                          letterSpacing: '0.05em',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          transition: 'color 0.2s ease'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.color = '#0f172a'}
                        onMouseLeave={(e) => e.currentTarget.style.color = '#475569'}
                      >
                        <span style={{
                          transform: expandedFO === fo.id ? 'rotate(90deg)' : 'rotate(0deg)',
                          transition: 'transform 0.2s ease',
                          display: 'inline-block'
                        }}>
                          ▶
                        </span>
                        Stopp ({fo.freightUnits.length})
                      </div>
                      {(expandedFO === fo.id || fo.freightUnits.length <= 3) && fo.freightUnits.map((fu, index) => (
                        <div
                          key={fu.id}
                          style={{
                            backgroundColor: 'var(--card-background)',
                            border: '1px solid var(--border-color)',
                            borderRadius: '6px',
                            padding: '8px 10px',
                            marginBottom: '6px',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            transition: 'all 0.2s ease',
                            animation: 'slideIn 0.2s ease'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = 'var(--gray-50)';
                            e.currentTarget.style.transform = 'translateX(4px)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'var(--card-background)';
                            e.currentTarget.style.transform = 'translateX(0)';
                          }}
                        >
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: '12px', fontWeight: '600', color: '#0f172a', marginBottom: '2px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span style={{
                                width: '20px',
                                height: '20px',
                                backgroundColor: 'var(--primary)',
                                color: 'var(--text-color)',
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '10px',
                                fontWeight: '700'
                              }}>
                                {index + 1}
                              </span>
                              {fu.customer}
                            </div>
                            <div style={{ fontSize: '10px', color: '#64748b', marginLeft: '26px' }}>
                              {fu.weight}kg • {fu.volume}m³ • {fu.deliveryTimeFrom}-{fu.deliveryTimeTo} • {fu.zone}
                            </div>
                          </div>
                          <button
                            onClick={() => onRemoveFUFromFO(fo.id, fu.id)}
                            style={{
                              padding: '4px 8px',
                              backgroundColor: 'rgba(239, 68, 68, 0.2)',
                              color: '#991b1b',
                              border: 'none',
                              borderRadius: '4px',
                              fontSize: '10px',
                              fontWeight: '600',
                              cursor: 'pointer',
                              transition: 'all 0.2s ease'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = '#fca5a5';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = '#fee2e2';
                            }}
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                      {!expandedFO && fo.freightUnits.length > 3 && (
                        <div style={{
                          textAlign: 'center',
                          fontSize: '11px',
                          color: 'var(--gray-500)',
                          fontWeight: '600',
                          marginTop: '8px',
                          cursor: 'pointer',
                          padding: '6px',
                          borderRadius: '4px',
                          transition: 'all 0.2s ease'
                        }}
                        onClick={() => setExpandedFO(fo.id)}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#f1f5f9';
                          e.currentTarget.style.color = '#3b82f6';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'transparent';
                          e.currentTarget.style.color = '#64748b';
                        }}>
                          + {fo.freightUnits.length - 3} flere stopp
                        </div>
                      )}
                    </div>
                  ) : (
                    <div style={{
                      backgroundColor: 'rgba(6, 182, 212, 0.2)',
                      border: '2px dashed #93c5fd',
                      borderRadius: '8px',
                      padding: '24px',
                      textAlign: 'center',
                      color: '#3b82f6',
                      fontSize: '12px',
                      fontWeight: '600'
                    }}>
                      Dra leveranser hit for å planlegge rute
                    </div>
                  )}

                  {/* FO Statistics */}
                  <div style={{
                    marginTop: '12px',
                    paddingTop: '12px',
                    borderTop: '2px solid #f1f5f9',
                    display: 'grid',
                    gridTemplateColumns: 'repeat(4, 1fr)',
                    gap: '8px'
                  }}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '10px', color: '#64748b', marginBottom: '2px' }}>Stopp</div>
                      <div style={{ fontSize: '14px', fontWeight: '700', color: '#0f172a' }}>{fo.freightUnits.length}</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '10px', color: '#64748b', marginBottom: '2px' }}>Distanse</div>
                      <div style={{ fontSize: '14px', fontWeight: '700', color: '#0f172a' }}>{fo.distance}km</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '10px', color: '#64748b', marginBottom: '2px' }}>Kostnad</div>
                      <div style={{ fontSize: '14px', fontWeight: '700', color: '#dc2626' }}>{(fo.cost || 0).toFixed(0)},-</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '10px', color: '#64748b', marginBottom: '2px' }}>Tid</div>
                      <div style={{ fontSize: '14px', fontWeight: '700', color: '#0f172a' }}>{fo.startTime}-{fo.endTime}</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* RIGHT PANEL - BILER & KJØRETØY INFO */}
        <div style={{ 
          width: '420px',
          backgroundColor: 'var(--card-background)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}>
          {/* Header */}
          <div style={{
            padding: '16px',
            borderBottom: '2px solid var(--border-color)',
            backgroundColor: 'var(--gray-50)'
          }}>
            <div>
              <h3 style={{ 
                margin: 0, 
                fontSize: '14px', 
                fontWeight: '700', 
                color: 'var(--text-color)',
                marginBottom: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <Truck size={16} style={{ color: '#8b5cf6' }} />
                Ressurser
              </h3>
              <div style={{
                backgroundColor: 'rgba(6, 182, 212, 0.2)',
                border: '1px solid var(--primary)',
                borderRadius: '6px',
                padding: '8px 10px',
                fontSize: '10px',
                color: 'var(--primary)',
                fontWeight: '500',
                lineHeight: '1.4',
                marginBottom: '12px'
              }}>
                💡 Dra biler og sjåfører til kjørelister for automatisk tildeling
              </div>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {resources.length === 0 ? (
                <div style={{
                  textAlign: 'center',
                  padding: '20px',
                  fontSize: '12px',
                  color: 'var(--gray-400)'
                }}>
                  <Truck size={32} style={{ margin: '0 auto 8px', opacity: 0.3 }} />
                  <div>Ingen ressurser funnet</div>
                  <div style={{ fontSize: '10px', marginTop: '4px' }}>
                    Legg til partnere med kjøretøy
                  </div>
                </div>
              ) : (
                resources.filter(r => r.type === 'vehicle').map(vehicle => (
                  <div
                    key={vehicle.id}
                    draggable={vehicle.available}
                    onDragOver={(e) => {
                      e.preventDefault();
                      if (draggedFU) {
                        e.currentTarget.style.backgroundColor = '#fef3c7';
                        e.currentTarget.style.borderColor = '#f59e0b';
                      }
                    }}
                    onDragLeave={(e) => {
                      e.currentTarget.style.backgroundColor = draggedResource?.id === vehicle.id ? '#ede9fe' : '#faf5ff';
                      e.currentTarget.style.borderColor = draggedResource?.id === vehicle.id ? '#8b5cf6' : '#e9d5ff';
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      if (draggedFU && onDropFUOnResource) {
                        onDropFUOnResource(vehicle.id);
                      }
                      e.currentTarget.style.backgroundColor = draggedResource?.id === vehicle.id ? '#ede9fe' : '#faf5ff';
                      e.currentTarget.style.borderColor = draggedResource?.id === vehicle.id ? '#8b5cf6' : '#e9d5ff';
                    }}
                    onDragStart={() => {
                      if (vehicle.available) {
                        setDraggedResource(vehicle);
                      }
                    }}
                    onDragEnd={() => setDraggedResource(null)}
                    style={{
                      backgroundColor: draggedResource?.id === vehicle.id ? 'rgba(139, 92, 246, 0.3)' : 'rgba(139, 92, 246, 0.2)',
                      border: `2px solid ${draggedResource?.id === vehicle.id ? '#8b5cf6' : '#e9d5ff'}`,
                      borderRadius: '8px',
                      padding: '10px 12px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      cursor: vehicle.available ? 'grab' : 'not-allowed',
                      transition: 'all 0.2s ease',
                      boxShadow: draggedResource?.id === vehicle.id 
                        ? '0 4px 12px rgba(139, 92, 246, 0.3)' 
                        : '0 1px 3px rgba(0,0,0,0.08)',
                      transform: draggedResource?.id === vehicle.id ? 'scale(1.03)' : 'scale(1)'
                    }}
                    onMouseEnter={(e) => {
                      if (vehicle.available && draggedResource?.id !== vehicle.id) {
                        e.currentTarget.style.transform = 'translateX(2px)';
                        e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (draggedResource?.id !== vehicle.id) {
                        e.currentTarget.style.transform = 'translateX(0)';
                        e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.08)';
                      }
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '12px', fontWeight: '600', color: '#7c3aed', marginBottom: '2px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {vehicle.typeEmoji || '🚗'} {vehicle.name}
                        {vehicle.vehicleType && (
                          <span style={{
                            fontSize: '9px',
                            padding: '2px 6px',
                            backgroundColor: vehicle.vehicleType === 'company_car' ? 'rgba(99, 102, 241, 0.2)' : vehicle.vehicleType === 'two_man' ? 'rgba(6, 182, 212, 0.2)' : 'var(--gray-100)',
                            color: vehicle.vehicleType === 'company_car' ? '#4338ca' : vehicle.vehicleType === 'two_man' ? '#1e40af' : '#4b5563',
                            borderRadius: '4px',
                            fontWeight: '700',
                            textTransform: 'uppercase'
                          }}>
                            {vehicle.vehicleType === 'company_car' ? 'Tjeneste' : vehicle.vehicleType === 'two_man' ? '2-mann' : '1-mann'}
                          </span>
                        )}
                      </div>
                      {vehicle.driverName && (
                        <div style={{ fontSize: '10px', color: '#059669', marginBottom: '2px' }}>
                          👤 {vehicle.driverName}
                        </div>
                      )}
                      <div style={{ fontSize: '10px', color: '#64748b', fontWeight: '500' }}>
                        {vehicle.capacity}kg • {vehicle.volumeCapacity}m³
                        {vehicle.vehicleNumber && ` • ${vehicle.vehicleNumber}`}
                      </div>
                      {vehicle.currentLocation && (
                        <div style={{ fontSize: '9px', color: '#94a3b8', marginTop: '2px' }}>
                          📍 {vehicle.currentLocation}
                        </div>
                      )}
                    </div>
                    <div style={{
                      width: '10px',
                      height: '10px',
                      backgroundColor: vehicle.available ? '#10b981' : '#ef4444',
                      borderRadius: '50%',
                      boxShadow: vehicle.available ? '0 0 8px rgba(16, 185, 129, 0.5)' : 'none'
                    }} />
                  </div>
                ))
              )}
            </div>
            
            {/* Drivers Section */}
            <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '2px solid #f1f5f9' }}>
              <div style={{ fontSize: '12px', fontWeight: '700', color: '#475569', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Sjåfører ({resources.filter(r => r.type === 'driver').length})
              </div>
              {resources.filter(r => r.type === 'driver').map(driver => (
                <div
                  key={driver.id}
                  draggable={driver.available}
                  onDragOver={(e) => {
                    e.preventDefault();
                    if (draggedFU) {
                      e.currentTarget.style.backgroundColor = '#fef3c7';
                      e.currentTarget.style.borderColor = '#f59e0b';
                    }
                  }}
                  onDragLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#f0fdf4';
                    e.currentTarget.style.borderColor = '#bbf7d0';
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    if (draggedFU && onDropFUOnResource) {
                      onDropFUOnResource(driver.id);
                    }
                    e.currentTarget.style.backgroundColor = '#f0fdf4';
                    e.currentTarget.style.borderColor = '#bbf7d0';
                  }}
                  onDragStart={() => {
                    if (driver.available) {
                      setDraggedResource(driver);
                    }
                  }}
                  onDragEnd={() => setDraggedResource(null)}
                  style={{
                    backgroundColor: '#f0fdf4',
                    border: '1px solid #bbf7d0',
                    borderRadius: '6px',
                    padding: '8px 10px',
                    marginBottom: '6px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    cursor: driver.available ? 'grab' : 'not-allowed',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    if (driver.available) {
                      e.currentTarget.style.backgroundColor = '#dcfce7';
                      e.currentTarget.style.transform = 'translateX(2px)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#f0fdf4';
                    e.currentTarget.style.transform = 'translateX(0)';
                  }}
                >
                  <div>
                    <div style={{ fontSize: '12px', fontWeight: '600', color: '#059669', marginBottom: '2px' }}>
                      👤 {driver.name}
                    </div>
                    {driver.vehicleAssignment && (
                      <div style={{ fontSize: '10px', color: '#64748b' }}>
                        🚗 {driver.vehicleAssignment}
                      </div>
                    )}
                    {driver.currentLocation && (
                      <div style={{ fontSize: '9px', color: '#94a3b8', marginTop: '2px' }}>
                        📍 {driver.currentLocation}
                      </div>
                    )}
                  </div>
                  <div style={{
                    width: '8px',
                    height: '8px',
                    backgroundColor: driver.available ? '#10b981' : '#ef4444',
                    borderRadius: '50%'
                  }} />
                </div>
              ))}
            </div>
          </div>

          {/* Biler List med full info */}
          <div style={{ flex: 1, overflow: 'auto', padding: '16px', backgroundColor: 'var(--gray-50)' }}>
            {resources.filter(r => r.type === 'vehicle').length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '60px 20px',
                color: 'var(--gray-400)'
              }}>
                <Truck size={64} style={{ margin: '0 auto 20px', opacity: 0.2 }} />
                <h4 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-color)', margin: '0 0 8px 0' }}>
                  Ingen biler funnet
                </h4>
                <p style={{ fontSize: '13px', marginBottom: '20px', color: 'var(--gray-500)', lineHeight: '1.5' }}>
                  Gå til Samarbeidspartnere og legg til kjøretøy for å starte planlegging
                </p>
                <a
                  href="/dashboard/partners"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '12px 20px',
                    backgroundColor: 'var(--primary)',
                    color: 'var(--text-color)',
                    textDecoration: 'none',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: '600',
                    boxShadow: '0 2px 8px rgba(59, 130, 246, 0.3)',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--primary-dark)';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--primary)';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  <Plus size={16} />
                  Legg til kjøretøy
                </a>
              </div>
            ) : (
              resources.filter(r => r.type === 'vehicle').map((vehicle) => {
                // Find assigned FO for this vehicle
                const assignedFO = freightOrders.find(fo => fo.vehicle === vehicle.name);
                const utilizationPercent = assignedFO ? (assignedFO.totalWeight / vehicle.capacity!) * 100 : 0;
                
                return (
                  <div
                    key={vehicle.id}
                    draggable={vehicle.available}
                    onDragStart={() => {
                      if (vehicle.available) {
                        setDraggedResource(vehicle);
                      }
                    }}
                    onDragEnd={() => setDraggedResource(null)}
                    style={{
                      backgroundColor: draggedResource?.id === vehicle.id ? 'rgba(139, 92, 246, 0.2)' : 'var(--card-background)',
                      border: draggedResource?.id === vehicle.id ? '3px solid #8b5cf6' : '2px solid var(--border-color)',
                      borderRadius: '12px',
                      padding: '20px',
                      marginBottom: '16px',
                      cursor: vehicle.available ? 'grab' : 'not-allowed',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      boxShadow: draggedResource?.id === vehicle.id 
                        ? '0 12px 24px rgba(139, 92, 246, 0.3)' 
                        : '0 2px 8px rgba(0,0,0,0.06)',
                      transform: draggedResource?.id === vehicle.id ? 'scale(1.03) rotate(-1deg)' : 'scale(1)'
                    }}
                    onMouseEnter={(e) => {
                      if (vehicle.available && draggedResource?.id !== vehicle.id) {
                        e.currentTarget.style.boxShadow = '0 6px 16px rgba(0,0,0,0.12)';
                        e.currentTarget.style.transform = 'translateY(-4px)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (draggedResource?.id !== vehicle.id) {
                        e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)';
                        e.currentTarget.style.transform = 'translateY(0)';
                      }
                    }}
                  >
                    {/* Vehicle Header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '16px' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                          <div style={{ fontSize: '20px' }}>{vehicle.typeEmoji || '🚗'}</div>
                          <h4 style={{ margin: 0, fontSize: '15px', fontWeight: '700', color: '#0f172a' }}>
                            {vehicle.name}
                          </h4>
                          {vehicle.vehicleType && (
                            <span style={{
                              fontSize: '10px',
                              padding: '3px 8px',
                              backgroundColor: vehicle.vehicleType === 'company_car' ? 'rgba(99, 102, 241, 0.2)' : vehicle.vehicleType === 'two_man' ? 'rgba(6, 182, 212, 0.2)' : 'var(--gray-100)',
                              color: vehicle.vehicleType === 'company_car' ? '#4338ca' : vehicle.vehicleType === 'two_man' ? '#1e40af' : '#4b5563',
                              borderRadius: '6px',
                              fontWeight: '700',
                              textTransform: 'uppercase',
                              letterSpacing: '0.05em'
                            }}>
                              {vehicle.vehicleType === 'company_car' ? 'Tjeneste' : vehicle.vehicleType === 'two_man' ? '2-mann' : '1-mann'}
                            </span>
                          )}
                        </div>
                        {vehicle.vehicleNumber && (
                          <div style={{ fontSize: '12px', color: '#6366f1', fontWeight: '600', marginBottom: '4px' }}>
                            #{vehicle.vehicleNumber}
                          </div>
                        )}
                        {vehicle.driverName && (
                          <div style={{ fontSize: '12px', color: '#059669', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <span>👤</span> {vehicle.driverName}
                          </div>
                        )}
                      </div>
                      <div style={{
                        width: '12px',
                        height: '12px',
                        backgroundColor: vehicle.available ? '#10b981' : '#ef4444',
                        borderRadius: '50%',
                        boxShadow: vehicle.available ? '0 0 12px rgba(16, 185, 129, 0.6)' : 'none',
                        flexShrink: 0
                      }} />
                    </div>

                    {/* Capacity Info */}
                    <div style={{
                      backgroundColor: 'var(--gray-50)',
                      borderRadius: '8px',
                      padding: '12px',
                      marginBottom: '12px'
                    }}>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', marginBottom: '12px' }}>
                        <div>
                          <div style={{ fontSize: '10px', color: '#64748b', marginBottom: '4px', fontWeight: '600' }}>
                            Kapasitet
                          </div>
                          <div style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a' }}>
                            {vehicle.capacity} kg
                          </div>
                        </div>
                        <div>
                          <div style={{ fontSize: '10px', color: '#64748b', marginBottom: '4px', fontWeight: '600' }}>
                            Volum
                          </div>
                          <div style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a' }}>
                            {vehicle.volumeCapacity} m³
                          </div>
                        </div>
                      </div>
                      
                      {vehicle.currentLocation && (
                        <div style={{
                          fontSize: '11px',
                          color: 'var(--gray-500)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '8px',
                          backgroundColor: 'var(--card-background)',
                          borderRadius: '6px'
                        }}>
                          <MapPin size={12} style={{ color: '#3b82f6' }} />
                          <span>{vehicle.currentLocation}</span>
                        </div>
                      )}
                    </div>

                    {/* Assigned Route Info */}
                    {assignedFO ? (
                      <div style={{
                        backgroundColor: 'rgba(16, 185, 129, 0.2)',
                        border: '2px solid #a7f3d0',
                        borderRadius: '8px',
                        padding: '12px'
                      }}>
                        <div style={{ fontSize: '11px', fontWeight: '700', color: '#065f46', marginBottom: '8px', textTransform: 'uppercase' }}>
                          Tildelt Rute
                        </div>
                        <div style={{ fontSize: '13px', fontWeight: '600', color: '#0f172a', marginBottom: '6px' }}>
                          {assignedFO.name}
                        </div>
                        <div style={{ fontSize: '11px', color: '#047857', marginBottom: '8px' }}>
                          {assignedFO.freightUnits.length} stopp • {assignedFO.totalWeight || 0}kg • {(assignedFO.cost || 0).toFixed(0)},-
                        </div>
                        
                        {/* Utilization Bar */}
                        <div style={{ marginTop: '10px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', marginBottom: '4px' }}>
                            <span style={{ fontWeight: '600', color: '#065f46' }}>Utnyttelse</span>
                            <span style={{ fontWeight: '700', color: utilizationPercent > 90 ? '#dc2626' : '#059669' }}>
                              {(utilizationPercent || 0).toFixed(0)}%
                            </span>
                          </div>
                          <div style={{
                            width: '100%',
                            height: '6px',
                            backgroundColor: '#f0fdf4',
                            borderRadius: '3px',
                            overflow: 'hidden'
                          }}>
                            <div style={{
                              width: `${Math.min(utilizationPercent, 100)}%`,
                              height: '100%',
                              backgroundColor: utilizationPercent > 90 ? '#ef4444' : utilizationPercent > 70 ? '#f59e0b' : '#10b981',
                              borderRadius: '3px',
                              transition: 'all 0.3s ease'
                            }} />
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div style={{
                        backgroundColor: 'rgba(6, 182, 212, 0.2)',
                        border: '2px dashed #93c5fd',
                        borderRadius: '8px',
                        padding: '16px',
                        textAlign: 'center'
                      }}>
                        <div style={{ fontSize: '12px', color: '#3b82f6', fontWeight: '600' }}>
                          💡 Ikke tildelt
                        </div>
                        <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
                          Dra til en kjøreliste for å tildele
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Drag Preview Indicator - Subtle */}
      {draggedFU && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          backgroundColor: 'var(--card-background)',
          border: '2px solid #3b82f6',
          borderRadius: '12px',
          padding: '16px 20px',
          boxShadow: '0 8px 20px rgba(59, 130, 246, 0.3)',
          zIndex: 9999,
          pointerEvents: 'none',
          minWidth: '280px',
          animation: 'slideIn 0.2s ease'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              backgroundColor: '#eff6ff',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '20px'
            }}>
              📦
            </div>
            <div>
              <div style={{ fontSize: '13px', fontWeight: '700', color: '#0f172a', marginBottom: '2px' }}>
                {draggedFU.customer}
              </div>
              <div style={{ fontSize: '11px', color: '#64748b' }}>
                {draggedFU.weight}kg • {draggedFU.volume}m³ • {draggedFU.zone}
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Drag Preview Indicator - Resource - Subtle */}
      {draggedResource && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          backgroundColor: 'var(--card-background)',
          border: '2px solid #8b5cf6',
          borderRadius: '12px',
          padding: '16px 20px',
          boxShadow: '0 8px 20px rgba(139, 92, 246, 0.3)',
          zIndex: 9999,
          pointerEvents: 'none',
          minWidth: '280px',
          animation: 'slideIn 0.2s ease'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              backgroundColor: '#faf5ff',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '20px'
            }}>
              {draggedResource.type === 'vehicle' ? '🚗' : '👤'}
            </div>
            <div>
              <div style={{ fontSize: '13px', fontWeight: '700', color: '#0f172a', marginBottom: '2px' }}>
                {draggedResource.name}
              </div>
              {draggedResource.type === 'vehicle' && (
                <div style={{ fontSize: '11px', color: '#64748b' }}>
                  {draggedResource.capacity}kg • {draggedResource.volumeCapacity}m³
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========== ONBOARDING GUIDE ========== */}
      {showGuide && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.75)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10001,
          backdropFilter: 'blur(8px)'
        }}>
          <div style={{
            backgroundColor: 'var(--card-background)',
            borderRadius: '20px',
            padding: '40px',
            maxWidth: '800px',
            width: '90%',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.4)',
            animation: 'slideIn 0.4s ease'
          }}>
            <div style={{ textAlign: 'center', marginBottom: '32px' }}>
              <div style={{
                width: '80px',
                height: '80px',
                background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 20px',
                boxShadow: '0 10px 25px rgba(59, 130, 246, 0.4)'
              }}>
                <Navigation size={40} style={{ color: 'var(--text-color)' }} />
              </div>
              <h2 style={{ fontSize: '28px', fontWeight: '800', color: 'var(--text-color)', margin: '0 0 12px 0' }}>
                Velkommen til Transportation Cockpit 🚀
              </h2>
              <p style={{ fontSize: '15px', color: 'var(--gray-500)', lineHeight: '1.6' }}>
                Profesjonelt planleggingssystem inspirert av SAP TM
              </p>
            </div>

            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(3, 1fr)', 
              gap: '20px',
              marginBottom: '32px'
            }}>
              {[
                { icon: '📦', title: 'Velg Leveranser', desc: 'Kryss av flere FUs i venstre panel' },
                { icon: '🚗', title: 'Planlegg Valgte', desc: 'Klikk knappen og velg en bil' },
                { icon: '✅', title: 'Bil-info', desc: 'Se full info om hver bil i høyre panel' }
              ].map((step, idx) => (
                <div key={idx} style={{
                  backgroundColor: 'var(--gray-50)',
                  borderRadius: '12px',
                  padding: '20px',
                  border: '2px solid var(--border-color)',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '40px', marginBottom: '12px' }}>{step.icon}</div>
                  <div style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-color)', marginBottom: '6px' }}>
                    {step.title}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--gray-500)', lineHeight: '1.5' }}>
                    {step.desc}
                  </div>
                </div>
              ))}
            </div>

            <div style={{
              backgroundColor: '#eff6ff',
              border: '2px solid #bfdbfe',
              borderRadius: '12px',
              padding: '20px',
              marginBottom: '24px'
            }}>
              <h4 style={{ fontSize: '15px', fontWeight: '700', color: '#1e40af', margin: '0 0 12px 0' }}>
                💡 Nyttige funksjoner
              </h4>
              <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '13px', color: '#475569', lineHeight: '2' }}>
                <li>☑️ <strong>Multi-select:</strong> Kryss av flere FUs → Klikk "Planlegg Valgte"</li>
                <li>🚗 <strong>Velg Bil:</strong> Se kapasitet og tildel automatisk</li>
                <li>⚡ <strong>Auto-tildel:</strong> Automatisk fordeling på alle biler</li>
                <li>🎯 <strong>Optimaliser:</strong> Sorter stopp etter prioritet og sone</li>
                <li>💰 <strong>Priser:</strong> Se kostnader og recalculate charges</li>
                <li>📄 <strong>Dokumenter:</strong> Print kjøreordre, CMR, etiketter</li>
                <li>📝 <strong>Notater:</strong> Legg til beskjeder til sjåfør</li>
              </ul>
            </div>
            
            <div style={{
              backgroundColor: '#fef3c7',
              border: '2px solid #fde68a',
              borderRadius: '12px',
              padding: '16px',
              marginBottom: '24px',
              display: 'flex',
              alignItems: 'start',
              gap: '12px'
            }}>
              <div style={{ fontSize: '24px' }}>🔗</div>
              <div>
                <h4 style={{ fontSize: '14px', fontWeight: '700', color: '#92400e', margin: '0 0 6px 0' }}>
                  Integrert System
                </h4>
                <div style={{ fontSize: '12px', color: '#78350f', lineHeight: '1.5' }}>
                  Biler hentes automatisk fra <strong>Samarbeidspartnere</strong>-siden. 
                  Gå til Samarbeidspartnere → Legg til partner → Vehicles tab for å registrere kjøretøy med:
                  Bil navn, Bilnummer, Sjåfør navn, Type bil (Tjenstebil/1-mann/2-mann), Nyttelast, osv.
                  <br /><br />
                  <strong>💡 Ny funksjon:</strong> Velg flere leveranser og klikk "Planlegg Valgte" for å 
                  automatisk tildele dem til en bil med kapasitetssjekk!
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                localStorage.setItem('cockpitGuideShown', 'true');
                setShowGuide(false);
              }}
              style={{
                width: '100%',
                padding: '16px',
                background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                color: 'var(--text-color)',
                border: 'none',
                borderRadius: '12px',
                fontSize: '16px',
                fontWeight: '700',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(59, 130, 246, 0.4)',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 8px 20px rgba(59, 130, 246, 0.5)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.4)';
              }}>
              Kom i gang! 🚀
            </button>
          </div>
        </div>
      )}

      {/* ========== CHARGES MODAL ========== */}
      {showChargesModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10000,
          backdropFilter: 'blur(4px)'
        }}
        onClick={() => setShowChargesModal(null)}>
          <div 
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: 'var(--card-background)',
              borderRadius: '16px',
              padding: '28px',
              maxWidth: '700px',
              width: '90%',
              maxHeight: '85vh',
              overflow: 'auto',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              animation: 'slideIn 0.3s ease'
            }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h3 style={{ margin: 0, fontSize: '22px', fontWeight: '700', color: '#0f172a' }}>
                💰 Charges & Priser - {showChargesModal.name}
              </h3>
              <button onClick={() => setShowChargesModal(null)} style={{
                background: 'none',
                border: 'none',
                fontSize: '28px',
                color: '#9ca3af',
                cursor: 'pointer',
                lineHeight: 1,
                padding: 0
              }}>×</button>
            </div>

            {/* Charge Breakdown */}
            <div style={{ backgroundColor: '#f8fafc', borderRadius: '12px', padding: '20px', marginBottom: '20px' }}>
              <div style={{ fontSize: '14px', fontWeight: '700', color: '#475569', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Kostnadsfordeling
              </div>
              
              {showChargesModal.freightUnits.map((fu, idx) => (
                <div key={fu.id} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '12px',
                  backgroundColor: 'var(--card-background)',
                  borderRadius: '8px',
                  marginBottom: '8px',
                  border: '1px solid #e2e8f0'
                }}>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: '600', color: '#0f172a' }}>{fu.customer}</div>
                    <div style={{ fontSize: '11px', color: '#64748b' }}>{fu.weight}kg • {fu.volume}m³</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '14px', fontWeight: '700', color: '#059669' }}>{((fu.price || 0) * 0.7).toFixed(0)},-</div>
                    <div style={{ fontSize: '10px', color: '#64748b' }}>Fraktkost</div>
                  </div>
                </div>
              ))}

              <div style={{ 
                borderTop: '2px solid #e2e8f0', 
                marginTop: '16px', 
                paddingTop: '16px',
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '12px'
              }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '4px' }}>Basiskostnad</div>
                  <div style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a' }}>
                    {(showChargesModal.freightUnits?.reduce((s, fu) => s + ((fu.price || 0) * 0.7), 0) || 0).toFixed(0)},-
                  </div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '4px' }}>Distansetillegg</div>
                  <div style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a' }}>
                    {((showChargesModal.distance || 0) * 15).toFixed(0)},-
                  </div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '4px' }}>Totalkostnad</div>
                  <div style={{ fontSize: '18px', fontWeight: '800', color: '#dc2626' }}>
                    {(showChargesModal.cost || 0).toFixed(0)},-
                  </div>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => {
                  onRecalculateCharges(showChargesModal.id);
                  setTimeout(() => {
                    const updated = freightOrders.find(f => f.id === showChargesModal.id);
                    if (updated) setShowChargesModal(updated);
                  }, 100);
                }}
                style={{
                  flex: 1,
                  padding: '12px',
                  backgroundColor: 'var(--primary)',
                  color: 'var(--text-color)',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}>
                <RefreshCw size={16} />
                Recalculate Charges
              </button>
              <button
                onClick={() => setShowChargesModal(null)}
                style={{
                  padding: '12px 24px',
                  backgroundColor: '#f3f4f6',
                  color: '#374151',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}>
                Lukk
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========== DOCUMENTS MODAL ========== */}
      {showDocumentsModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10000,
          backdropFilter: 'blur(4px)'
        }}
        onClick={() => setShowDocumentsModal(null)}>
          <div 
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: 'var(--card-background)',
              borderRadius: '16px',
              padding: '28px',
              maxWidth: '600px',
              width: '90%',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
            }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h3 style={{ margin: 0, fontSize: '22px', fontWeight: '700', color: '#0f172a' }}>
                📄 Dokumenter - {showDocumentsModal.name}
              </h3>
              <button onClick={() => setShowDocumentsModal(null)} style={{
                background: 'none',
                border: 'none',
                fontSize: '28px',
                color: '#9ca3af',
                cursor: 'pointer'
              }}>×</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {/* Kjøreordre med Send til sjåfør knapp */}
              <div style={{
                padding: '16px',
                backgroundColor: 'var(--gray-50)',
                border: '2px solid #e2e8f0',
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                gap: '16px'
              }}>
                <div style={{ fontSize: '32px' }}>🚚</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '14px', fontWeight: '600', color: '#0f172a', marginBottom: '2px' }}>
                    Kjøreordre
                  </div>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>
                    Komplett kjøreliste for sjåfør
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => onDownloadDocument('driving-order', showDocumentsModal)}
                    style={{
                      padding: '8px 12px',
                      backgroundColor: 'var(--primary)',
                      color: 'var(--text-color)',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <Download size={14} />
                    Last ned
                  </button>
                  <button
                    onClick={() => onSendToDriver(showDocumentsModal)}
                    style={{
                      padding: '8px 12px',
                      backgroundColor: 'var(--success)',
                      color: 'var(--text-color)',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    📱 Send til sjåfør
                  </button>
                  {showDocumentsModal?.vehicle && (
                    <button
                      onClick={() => onRemoveRouteAssignment(showDocumentsModal)}
                      style={{
                        padding: '8px 12px',
                        backgroundColor: 'var(--danger)',
                        color: 'var(--text-color)',
                        border: 'none',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      ❌ Fjern rute
                    </button>
                  )}
                </div>
              </div>

              {/* Andre dokumenter */}
              {[
                { name: 'Fraktbrev (CMR)', icon: '📋', desc: 'Internasjonal fraktdokument', type: 'cmr' },
                { name: 'Plukkliste', icon: '📦', desc: 'Liste over alle kolli', type: 'picking-list' },
                { name: 'Leveringsetiketter', icon: '🏷️', desc: 'Etiketter for alle leveranser', type: 'delivery-labels' },
                { name: 'POD (Proof of Delivery)', icon: '✍️', desc: 'Signatur og bekreftelse', type: 'pod' },
                { name: 'Rutekart', icon: '🗺️', desc: 'Visuelt kart med stopp', type: 'route-map' }
              ].map((doc, idx) => (
                <button
                  key={idx}
                  onClick={() => onDownloadDocument(doc.type, showDocumentsModal)}
                  style={{
                    padding: '16px',
                    backgroundColor: 'var(--gray-50)',
                    border: '2px solid var(--border-color)',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px',
                    transition: 'all 0.2s ease',
                    textAlign: 'left'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#eff6ff';
                    e.currentTarget.style.borderColor = '#3b82f6';
                    e.currentTarget.style.transform = 'translateX(4px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--gray-50)';
                    e.currentTarget.style.borderColor = '#e2e8f0';
                    e.currentTarget.style.transform = 'translateX(0)';
                  }}>
                  <div style={{ fontSize: '32px' }}>{doc.icon}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '14px', fontWeight: '600', color: '#0f172a', marginBottom: '2px' }}>
                      {doc.name}
                    </div>
                    <div style={{ fontSize: '12px', color: '#64748b' }}>
                      {doc.desc}
                    </div>
                  </div>
                  <Download size={20} style={{ color: '#3b82f6' }} />
                </button>
              ))}
            </div>

            <button
              onClick={() => setShowDocumentsModal(null)}
              style={{
                width: '100%',
                marginTop: '20px',
                padding: '12px',
                backgroundColor: 'var(--primary)',
                color: 'var(--text-color)',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer'
              }}>
              Lukk
            </button>
          </div>
        </div>
      )}

      {/* ========== ROUTE NUMBER MODAL ========== */}
      {showRouteNumberModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10000,
          backdropFilter: 'blur(4px)'
        }}
        onClick={() => setShowRouteNumberModal(null)}>
          <div 
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: 'var(--card-background)',
              borderRadius: '16px',
              padding: '32px',
              maxWidth: '500px',
              width: '90%',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
            }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h3 style={{ margin: 0, fontSize: '22px', fontWeight: '700', color: '#0f172a' }}>
                📍 Sett felt
              </h3>
              <button onClick={() => setShowRouteNumberModal(null)} style={{
                background: 'none',
                border: 'none',
                fontSize: '28px',
                color: '#9ca3af',
                cursor: 'pointer'
              }}>
                ×
              </button>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <div style={{ fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>
                Rute: {showRouteNumberModal.name}
              </div>
              <input
                type="text"
                value={routeNumberInput}
                onChange={(e) => setRouteNumberInput(e.target.value)}
                placeholder="Skriv inn feltnummer (f.eks. F001, F002...)"
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '2px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '14px',
                  outline: 'none',
                  transition: 'border-color 0.2s ease'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#3b82f6';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#e5e7eb';
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => {
                  if (routeNumberInput.trim()) {
                    onSetRouteNumber(showRouteNumberModal, routeNumberInput.trim());
                  }
                }}
                disabled={!routeNumberInput.trim()}
                style={{
                  flex: 1,
                  padding: '12px',
                  backgroundColor: routeNumberInput.trim() ? '#10b981' : '#9ca3af',
                  color: 'var(--text-color)',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: routeNumberInput.trim() ? 'pointer' : 'not-allowed'
                }}>
                Lagre felt
              </button>
              <button
                onClick={() => setShowRouteNumberModal(null)}
                style={{
                  flex: 1,
                  padding: '12px',
                  backgroundColor: '#6b7280',
                  color: 'var(--text-color)',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}>
                Avbryt
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========== PLANLEGG VALGTE MODAL ========== */}
      {showPlanSelectedModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10000,
          backdropFilter: 'blur(4px)'
        }}
        onClick={() => setShowPlanSelectedModal(false)}>
          <div 
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: 'var(--card-background)',
              borderRadius: '16px',
              padding: '32px',
              maxWidth: '700px',
              width: '90%',
              maxHeight: '85vh',
              overflow: 'auto',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              animation: 'slideIn 0.3s ease'
            }}>
            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ margin: '0 0 8px 0', fontSize: '24px', fontWeight: '800', color: '#0f172a' }}>
                🚗 Planlegg {selectedFUs.length} Valgte Leveranser
              </h3>
              <p style={{ margin: 0, fontSize: '14px', color: '#64748b', lineHeight: '1.5' }}>
                Velg en bil nedenfor for å automatisk planlegge de valgte leveransene på den bilen
              </p>
            </div>

            {/* Selected FUs Summary */}
            <div style={{
              backgroundColor: '#eff6ff',
              border: '2px solid #bfdbfe',
              borderRadius: '12px',
              padding: '16px',
              marginBottom: '24px'
            }}>
              <div style={{ fontSize: '13px', fontWeight: '700', color: '#1e40af', marginBottom: '12px' }}>
                📦 Valgte Leveranser ({selectedFUs.length})
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                {[
                  { label: 'Total vekt', value: `${freightUnits.filter(fu => selectedFUs.includes(fu.id)).reduce((s, fu) => s + fu.weight, 0)}kg`, icon: '⚖️' },
                  { label: 'Total volum', value: `${(freightUnits.filter(fu => selectedFUs.includes(fu.id)).reduce((s, fu) => s + (fu.volume || 0), 0) || 0).toFixed(1)}m³`, icon: '📏' },
                  { label: 'Total verdi', value: `${freightUnits.filter(fu => selectedFUs.includes(fu.id)).reduce((s, fu) => s + fu.price, 0)},-`, icon: '💰' }
                ].map((stat, idx) => (
                  <div key={idx} style={{
                    backgroundColor: 'var(--card-background)',
                    borderRadius: '8px',
                    padding: '10px',
                    textAlign: 'center'
                  }}>
                    <div style={{ fontSize: '18px', marginBottom: '4px' }}>{stat.icon}</div>
                    <div style={{ fontSize: '10px', color: '#64748b', marginBottom: '2px' }}>{stat.label}</div>
                    <div style={{ fontSize: '14px', fontWeight: '700', color: '#0f172a' }}>{stat.value}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Vehicle Selection */}
            <div>
              <div style={{ fontSize: '15px', fontWeight: '700', color: '#0f172a', marginBottom: '16px' }}>
                Velg Bil
              </div>
              {resources.filter(r => r.type === 'vehicle').length === 0 ? (
                <div style={{
                  textAlign: 'center',
                  padding: '40px 20px',
                  backgroundColor: 'var(--gray-50)',
                  borderRadius: '12px',
                  border: '2px dashed #cbd5e1'
                }}>
                  <Truck size={48} style={{ margin: '0 auto 16px', color: '#94a3b8' }} />
                  <p style={{ fontSize: '14px', fontWeight: '600', color: '#475569', margin: '0 0 8px 0' }}>
                    Ingen biler tilgjengelig
                  </p>
                  <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '16px' }}>
                    Legg til kjøretøy i Samarbeidspartnere først
                  </p>
                  <a
                    href="/dashboard/partners"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '10px 16px',
                      backgroundColor: 'var(--primary)',
                      color: 'var(--text-color)',
                      textDecoration: 'none',
                      borderRadius: '8px',
                      fontSize: '13px',
                      fontWeight: '600'
                    }}
                  >
                    <Plus size={14} />
                    Gå til Samarbeidspartnere
                  </a>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {resources.filter(r => r.type === 'vehicle').map(vehicle => {
                    const selectedFUsData = freightUnits.filter(fu => selectedFUs.includes(fu.id));
                    const totalWeight = selectedFUsData.reduce((s, fu) => s + fu.weight, 0);
                    const totalVolume = selectedFUsData.reduce((s, fu) => s + fu.volume, 0);
                    const canFit = totalWeight <= vehicle.capacity! && totalVolume <= vehicle.volumeCapacity!;
                    const assignedFO = freightOrders.find(fo => fo.vehicle === vehicle.name);
                    
                    return (
                      <button
                        key={vehicle.id}
                        disabled={!canFit}
                        onClick={() => {
                          if (canFit) {
                            // Create single FO with all selected FUs and vehicle assignment
                            if (onDropFUOnResource) {
                              // Create FO with first FU, then add others
                              onDragFUStart(selectedFUsData[0]);
                              onDropFUOnResource(vehicle.id);
                              
                              // Add remaining FUs to the same FO
                              setTimeout(() => {
                                selectedFUsData.slice(1).forEach(fu => {
                                  onDragFUStart(fu);
                                  // Find the newly created FO and add FU to it
                                  const newFO = freightOrders[freightOrders.length - 1];
                                  if (newFO) {
                                    onDropFUOnFO(newFO.id);
                                  }
                                });
                              }, 100);
                            }
                            
                            // Clear selections and close modal
                            selectedFUs.forEach(id => onToggleFUSelection(id));
                            setShowPlanSelectedModal(false);
                            alert(`✅ ${selectedFUsData.length} leveranser planlagt på ${vehicle.name}`);
                          }
                        }}
                        style={{
                          padding: '20px',
                          backgroundColor: canFit ? '#ffffff' : '#fef2f2',
                          border: canFit ? '2px solid #e2e8f0' : '2px solid #fca5a5',
                          borderRadius: '12px',
                          cursor: canFit ? 'pointer' : 'not-allowed',
                          textAlign: 'left',
                          transition: 'all 0.2s ease',
                          opacity: canFit ? 1 : 0.6
                        }}
                        onMouseEnter={(e) => {
                          if (canFit) {
                            e.currentTarget.style.backgroundColor = 'var(--gray-50)';
                            e.currentTarget.style.borderColor = '#8b5cf6';
                            e.currentTarget.style.transform = 'translateX(4px)';
                          }
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = canFit ? '#ffffff' : '#fef2f2';
                          e.currentTarget.style.borderColor = canFit ? '#e2e8f0' : '#fca5a5';
                          e.currentTarget.style.transform = 'translateX(0)';
                        }}
                      >
                        {/* Vehicle Header */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '14px' }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                              <div style={{ fontSize: '24px' }}>{vehicle.typeEmoji || '🚗'}</div>
                              <div>
                                <h4 style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: '#0f172a' }}>
                                  {vehicle.name}
                                </h4>
                                {vehicle.vehicleNumber && (
                                  <div style={{ fontSize: '12px', color: '#6366f1', fontWeight: '600' }}>
                                    #{vehicle.vehicleNumber}
                                  </div>
                                )}
                              </div>
                              {vehicle.vehicleType && (
                                <span style={{
                                  fontSize: '10px',
                                  padding: '4px 8px',
                                  backgroundColor: vehicle.vehicleType === 'company_car' ? 'rgba(99, 102, 241, 0.2)' : vehicle.vehicleType === 'two_man' ? 'rgba(6, 182, 212, 0.2)' : 'var(--gray-100)',
                                  color: vehicle.vehicleType === 'company_car' ? '#4338ca' : vehicle.vehicleType === 'two_man' ? '#1e40af' : '#4b5563',
                                  borderRadius: '6px',
                                  fontWeight: '700',
                                  textTransform: 'uppercase'
                                }}>
                                  {vehicle.vehicleType === 'company_car' ? 'Tjeneste' : vehicle.vehicleType === 'two_man' ? '2-mann' : '1-mann'}
                                </span>
                              )}
                            </div>
                            {vehicle.driverName && (
                              <div style={{ fontSize: '13px', color: '#059669', fontWeight: '500', marginLeft: '34px' }}>
                                👤 {vehicle.driverName}
                              </div>
                            )}
                          </div>
                          {canFit ? (
                            <CheckCircle size={24} style={{ color: '#10b981' }} />
                          ) : (
                            <AlertTriangle size={24} style={{ color: '#ef4444' }} />
                          )}
                        </div>

                        {/* Capacity Check */}
                        <div style={{ 
                          display: 'grid', 
                          gridTemplateColumns: 'repeat(2, 1fr)', 
                          gap: '12px',
                          backgroundColor: 'var(--gray-50)',
                          borderRadius: '8px',
                          padding: '12px'
                        }}>
                          <div>
                            <div style={{ fontSize: '10px', color: '#64748b', marginBottom: '4px' }}>Vekt</div>
                            <div style={{ fontSize: '13px', fontWeight: '700', color: totalWeight > vehicle.capacity! ? '#dc2626' : '#059669' }}>
                              {totalWeight}kg / {vehicle.capacity}kg
                            </div>
                          </div>
                          <div>
                            <div style={{ fontSize: '10px', color: '#64748b', marginBottom: '4px' }}>Volum</div>
                            <div style={{ fontSize: '13px', fontWeight: '700', color: totalVolume > vehicle.volumeCapacity! ? '#dc2626' : '#059669' }}>
                              {(totalVolume || 0).toFixed(1)}m³ / {vehicle.volumeCapacity || 0}m³
                            </div>
                          </div>
                        </div>

                        {!canFit && (
                          <div style={{
                            marginTop: '12px',
                            backgroundColor: 'rgba(239, 68, 68, 0.2)',
                            border: '1px solid #fca5a5',
                            borderRadius: '8px',
                            padding: '10px',
                            fontSize: '12px',
                            color: '#991b1b',
                            fontWeight: '600',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px'
                          }}>
                            <AlertTriangle size={14} />
                            Kapasitet overskredet - kan ikke planlegge
                          </div>
                        )}

                        {assignedFO && canFit && (
                          <div style={{
                            marginTop: '12px',
                            backgroundColor: '#fef3c7',
                            border: '1px solid #fde68a',
                            borderRadius: '8px',
                            padding: '10px',
                            fontSize: '11px',
                            color: '#92400e',
                            fontWeight: '500'
                          }}>
                            ℹ️ Bilen har allerede {assignedFO.freightUnits.length} stopp. Nye leveranser vil legges til.
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div style={{ marginTop: '24px', paddingTop: '20px', borderTop: '2px solid #e2e8f0' }}>
              <button
                onClick={() => setShowPlanSelectedModal(false)}
                style={{
                  width: '100%',
                  padding: '12px',
                  backgroundColor: '#f3f4f6',
                  color: '#374151',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}>
                Avbryt
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========== ADD NOTE MODAL ========== */}
      {showAddNoteModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10000,
          backdropFilter: 'blur(4px)'
        }}
        onClick={() => setShowAddNoteModal(null)}>
          <div 
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: 'var(--card-background)',
              borderRadius: '16px',
              padding: '28px',
              maxWidth: '500px',
              width: '90%',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
            }}>
            <h3 style={{ margin: '0 0 20px 0', fontSize: '20px', fontWeight: '700', color: '#0f172a' }}>
              📝 Legg til notat
            </h3>

            <textarea
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder="Eks: Kunden borte, ring før levering..."
              style={{
                width: '100%',
                minHeight: '120px',
                padding: '12px',
                border: '2px solid #e2e8f0',
                borderRadius: '8px',
                fontSize: '13px',
                fontFamily: 'inherit',
                resize: 'vertical',
                marginBottom: '16px'
              }}
            />

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => {
                  if (noteText.trim()) {
                    onAddNoteToFO(showAddNoteModal.id, noteText);
                    setNoteText('');
                    setShowAddNoteModal(null);
                  }
                }}
                disabled={!noteText.trim()}
                style={{
                  flex: 1,
                  padding: '12px',
                  backgroundColor: noteText.trim() ? '#10b981' : '#f3f4f6',
                  color: noteText.trim() ? 'white' : '#9ca3af',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: noteText.trim() ? 'pointer' : 'not-allowed'
                }}>
                Lagre Notat
              </button>
              <button
                onClick={() => {
                  setNoteText('');
                  setShowAddNoteModal(null);
                }}
                style={{
                  padding: '12px 24px',
                  backgroundColor: '#f3f4f6',
                  color: '#374151',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}>
                Avbryt
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Premium Animations */}
      <style jsx>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes float {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-10px);
          }
        }
        
        @keyframes shimmer {
          0% {
            background-position: -1000px 0;
          }
          100% {
            background-position: 1000px 0;
          }
        }
      `}</style>
    </div>
  );
}

