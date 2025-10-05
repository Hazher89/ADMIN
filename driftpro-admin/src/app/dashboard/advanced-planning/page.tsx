'use client';

import React, { useState, useEffect } from 'react';
import { 
  Package, 
  Truck, 
  CheckCircle, 
  Route, 
  MapPin, 
  Settings, 
  X, 
  RefreshCw, 
  Download, 
  Zap, 
  Save, 
  Weight,
  Navigation,
  Map,
} from 'lucide-react';
import { collection, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import CockpitInterface from './cockpit-interface';
import { firebaseService, Partner as FirebasePartner } from '@/lib/firebase-services';
import { useAuth } from '@/contexts/AuthContext';
import { oneDriveService } from '@/lib/onedrive-service';

interface Order {
  id: string;
  orderNumber?: string;
  documentNumber?: string;
  customerName?: string;
  customerPhone?: string;
  customerAddress?: string;
  customerEmail?: string;
  address?: string;
  weight?: number;
  deliveryTimeFrom?: string;
  deliveryTimeTo?: string;
  deliveryDate?: string;
  products?: {
    serviceId: string;
    serviceName: string;
    serviceDescription: string;
    serviceCategory: string;
    price: number;
    quantity: number;
  }[];
  service?: {
    id: string;
    name: string;
    description: string;
    category: string;
    price: number;
  };
  priority?: 'low' | 'medium' | 'high';
  note?: string;
  noteToPlanner?: string;
  returnType?: 'none' | 'old_item' | 'disposal';
  returnDescription?: string;
  returnOrderId?: string;
  totalProducts?: number;
  status?: 'pending' | 'assigned' | 'in_progress' | 'completed' | 'cancelled';
  createdAt?: any;
  companyId?: string;
}

interface Partner {
  id: string;
  name: string;
  contactPerson: string;
  phone: string;
  vehicles: number;
  maxWeight: number;
  workingHours: string;
  status: string;
  rating: number;
}

interface PlannedRoute {
  id: string;
  orders: Order[];
  distance: number;
  duration: number;
}

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
  vehicleAssignment?: string; // For drivers: which vehicle they're assigned to
  partnerId?: string;
  partnerName?: string;
}

export default function AdvancedPlanningPage() {
  const { userProfile } = useAuth();
  
  // State management
  const [showPlanningView, setShowPlanningView] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [plannedRoutes, setPlannedRoutes] = useState<PlannedRoute[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [searchOrderTerm, setSearchOrderTerm] = useState('');
  const [searchPartnerTerm, setSearchPartnerTerm] = useState('');
  const [draggedOrder, setDraggedOrder] = useState<string | null>(null);
  
  // Cockpit state
  const [freightUnits, setFreightUnits] = useState<FreightUnit[]>([]);
  const [freightOrders, setFreightOrders] = useState<FreightOrder[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [selectedProfile, setSelectedProfile] = useState('all');
  const [searchFilter, setSearchFilter] = useState('');
  const [selectedFUs, setSelectedFUs] = useState<string[]>([]);
  const [selectedFOs, setSelectedFOs] = useState<string[]>([]);
  const [draggedFU, setDraggedFU] = useState<FreightUnit | null>(null);
  const [showGantt, setShowGantt] = useState(true);
  const [showMap, setShowMap] = useState(false);
  const [viewMode, setViewMode] = useState<'day' | 'week'>('day');
  
  // Advanced features state
  const [showColumnCustomizer, setShowColumnCustomizer] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState(['orderNumber', 'customer', 'weight', 'volume', 'zone', 'time', 'price']);
  const [showMassEdit, setShowMassEdit] = useState(false);
  const [showChargesModal, setShowChargesModal] = useState<string | null>(null);
  const [showDocumentsModal, setShowDocumentsModal] = useState<string | null>(null);
  const [selectedFOForEdit, setSelectedFOForEdit] = useState<FreightOrder | null>(null);
  const [showRouteNumberModal, setShowRouteNumberModal] = useState<FreightOrder | null>(null);
  const [routeNumberInput, setRouteNumberInput] = useState('');
  
  // Layout editing state
  const [editMode, setEditMode] = useState(false);
  const [draggedWindow, setDraggedWindow] = useState<string | null>(null);
  const [resizingWindow, setResizingWindow] = useState<{ windowId: string; direction: string } | null>(null);
  const [windowLayouts, setWindowLayouts] = useState<Record<string, { x: number; y: number; width: number; height: number }>>({
    routes: { x: 0, y: 0, width: 300, height: 200 },
    sites: { x: 0, y: 220, width: 300, height: 200 },
    orders: { x: 0, y: 440, width: 300, height: 200 },
    map: { x: 320, y: 0, width: 600, height: 600 },
    unscheduled: { x: 0, y: 660, width: 920, height: 200 }
  });
  
  // Settings modal state
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [originalLayout, setOriginalLayout] = useState<Record<string, { x: number; y: number; width: number; height: number }> | null>(null);
  
  // Default layout
  const defaultLayout = {
    routes: { x: 0, y: 0, width: 300, height: 200 },
    sites: { x: 0, y: 220, width: 300, height: 200 },
    orders: { x: 0, y: 440, width: 300, height: 200 },
    map: { x: 320, y: 0, width: 600, height: 600 },
    unscheduled: { x: 0, y: 660, width: 920, height: 200 }
  };

  // Load orders from Firestore and convert to Freight Units
  const loadOrdersFromFirestore = async () => {
    if (!db) return;
    setLoadingOrders(true);
    try {
      const ordersSnapshot = await getDocs(collection(db, 'orders'));
      const ordersData = ordersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Order[];
      setOrders(ordersData);
      
      // Convert orders to Freight Units
      const freightUnitsFromOrders: FreightUnit[] = ordersData.map(order => ({
        id: `FU-${order.id}`,
        orderNumber: order.orderNumber || order.documentNumber || order.id,
        customer: order.customerName || 'Ukjent kunde',
        address: order.customerAddress || order.address || 'Ukjent adresse',
        weight: order.weight || 100, // Default weight if not specified
        volume: 1.0, // Default volume
        deliveryDate: order.deliveryDate || new Date().toISOString().split('T')[0],
        deliveryTimeFrom: order.deliveryTimeFrom || '08:00',
        deliveryTimeTo: order.deliveryTimeTo || '16:00',
        zone: 'Oslo', // Default zone
        priority: order.priority || 'medium',
        status: order.status === 'assigned' ? 'assigned' : 'unassigned',
        price: order.products?.reduce((sum, p) => sum + (p.price * p.quantity), 0) || 0,
        specialRequirements: order.noteToPlanner || order.note || undefined,
        products: order.products || [],
        totalProducts: order.totalProducts || order.products?.reduce((sum, p) => sum + p.quantity, 0) || 0,
        returnType: order.returnType || 'none',
        returnDescription: order.returnDescription,
        returnOrderId: order.returnOrderId,
        customerPhone: order.customerPhone,
        customerEmail: order.customerEmail
      }));
      
      setFreightUnits(freightUnitsFromOrders);
      console.log(`✅ Lastet ${ordersData.length} ordrer og konvertert til ${freightUnitsFromOrders.length} Freight Units`);
    } catch (error) {
      console.error('Error loading orders:', error);
    } finally {
      setLoadingOrders(false);
    }
  };

  // Load partners data from Firebase
  const loadPartnersData = async () => {
    if (!userProfile?.companyId) return;
    
    try {
      const partnersData = await firebaseService.getPartners(userProfile.companyId);
      
      // Convert to old format for backward compatibility with null checks
      const convertedPartners = partnersData
        .filter(p => p && p.name) // Filter out invalid partners
        .map(p => ({
          id: p.id || 'unknown',
          name: p.name || 'Ukjent partner',
          contactPerson: p.contactPerson?.name || 'Ukjent',
          phone: p.contactPerson?.phone || 'Ukjent',
          vehicles: Array.isArray(p.vehicles) ? p.vehicles.length : 0,
          maxWeight: Array.isArray(p.vehicles) && p.vehicles.length > 0 
            ? Math.max(...p.vehicles.map(v => parseInt(v?.payload) || 1500)) 
            : 1500,
          workingHours: '06:00-18:00',
          status: p.status === 'active' ? 'LEDIG' : 'OPPTATT',
          rating: p.rating || 4.5
        }));
      
      setPartners(convertedPartners);
      console.log('✅ Lastet', convertedPartners.length, 'partnere fra Firebase');
    } catch (error) {
      console.error('Error loading partners:', error);
      // Fallback to mock data
    const mockPartners = [
      {
        id: 'partner-001',
        name: 'Lars Transport AS',
        contactPerson: 'Lars Andersen',
        phone: '+47 123 45 678',
        vehicles: 3,
        maxWeight: 3500,
        workingHours: '06:00-18:00',
        status: 'LEDIG',
        rating: 4.8
      }
    ];
    setPartners(mockPartners);
    }
  };


  // Load Freight Orders (start with empty array - only show real planned routes)
  const loadFreightOrders = async () => {
    // Start with empty array - routes will be created when user plans them
    setFreightOrders([]);
    console.log('✅ Freight Orders cleared - no mock routes');
  };
  
  // Assign vehicle/driver to FO from resources
  const handleAssignResourceToFO = (foId: string, resourceId: string) => {
    const resource = resources.find(r => r.id === resourceId);
    if (!resource) return;
    
    setFreightOrders(prev => prev.map(fo => {
      if (fo.id === foId) {
        if (resource.type === 'vehicle') {
          return {
            ...fo,
            vehicle: 'M22',
            maxWeight: resource.capacity || 1500,
            maxVolume: resource.volumeCapacity || 12
          };
        } else {
          return { ...fo, driver: resource.name };
        }
      }
      return fo;
    }));
    
    alert(`✅ ${resource.type === 'vehicle' ? 'Bil' : 'Sjåfør'} tildelt: ${resource.name}`);
  };

  // Load Resources from Firebase partners
  const loadResources = async () => {
    if (!userProfile?.companyId) {
      console.warn('⚠️ Ingen companyId - kan ikke laste ressurser');
      return;
    }
    
    console.log('🔄 Laster ressurser for companyId:', userProfile.companyId);
    
    try {
      const partnersData = await firebaseService.getPartners(userProfile.companyId);
      console.log('📦 Hentet partnere:', partnersData.length, 'partnere');
      console.log('📦 Partner data:', partnersData);
      
      const allResources: Resource[] = [];
      
      // Extract vehicles from partners
      partnersData.forEach(partner => {
        if (!partner || !partner.name) {
          console.warn('⚠️ Ugyldig partner-objekt, hopper over:', partner);
          return;
        }
        
        console.log(`🔍 Sjekker partner: ${partner.name} (ID: ${partner.id}), vehicles:`, partner.vehicles);
        
        if (partner.vehicles && Array.isArray(partner.vehicles) && partner.vehicles.length > 0) {
          partner.vehicles.forEach((vehicle, idx) => {
            if (!vehicle) {
              console.warn(`⚠️ Ugyldig vehicle-objekt i partner ${partner.name}, hopper over:`, vehicle);
              return;
            }
            
            try {
              // Build vehicle name using new fields
              let vehicleName = '';
              if (vehicle.vehicleName) {
                vehicleName = vehicle.vehicleName;
              } else if (vehicle.vehicleNumber && vehicle.model) {
                vehicleName = `${vehicle.model} ${vehicle.vehicleNumber}`;
              } else if (vehicle.model && vehicle.registrationNumber) {
                vehicleName = `${vehicle.model} (${vehicle.registrationNumber})`;
              } else {
                vehicleName = vehicle.model || vehicle.registrationNumber || `Bil ${idx + 1}`;
              }
              
              // Add type indicator
              const typeEmoji = vehicle.vehicleType === 'company_car' ? '🏢' : 
                               vehicle.vehicleType === 'two_man' ? '👥' : '👤';
              
              const resource: Resource = {
                id: `VEH-${partner.id}-${idx}`,
                name: vehicleName,
                type: 'vehicle',
                capacity: parseInt(vehicle.payload) || 1500,
                volumeCapacity: Math.round((parseInt(vehicle.payload) || 1500) / 150),
                available: true,
                currentLocation: partner.address?.city || 'Depot',
                vehicleType: vehicle.vehicleType,
                vehicleNumber: vehicle.vehicleNumber,
                driverName: vehicle.driverName,
                typeEmoji,
                partnerId: partner.id,
                partnerName: partner.name
              };
              
              allResources.push(resource);
              console.log(`✅ Lagt til bil: ${vehicleName} (Partner: ${partner.name}, ID: ${partner.id})`, resource);
            } catch (err) {
              console.error(`❌ Feil ved prosessering av vehicle ${idx} fra ${partner.name}:`, err);
            }
          });
        } else {
          console.log(`ℹ️ Partner ${partner.name} har ingen kjøretøy`);
        }
        
        // Add drivers from vehicles (if driverName is specified)
        if (partner.vehicles && Array.isArray(partner.vehicles) && partner.vehicles.length > 0) {
          partner.vehicles.forEach((vehicle, idx) => {
            if (vehicle && vehicle.driverName) {
              try {
                allResources.push({
                  id: `DRV-${partner.id}-${idx}`,
                  name: vehicle.driverName,
                  type: 'driver',
                  available: true,
                  currentLocation: partner.address?.city || 'Depot',
                  vehicleAssignment: vehicle.vehicleName || vehicle.vehicleNumber || vehicle.registrationNumber || 'Ukjent bil',
                  partnerId: partner.id,
                  partnerName: partner.name
                });
                console.log(`✅ Lagt til sjåfør: ${vehicle.driverName} (Partner: ${partner.name})`);
              } catch (err) {
                console.error(`❌ Feil ved prosessering av driver ${idx}:`, err);
              }
            }
          });
        }
        
        // Add partner contact as fallback driver if no specific drivers
        if (partner.contactPerson?.name && !partner.vehicles?.some(v => v && v.driverName)) {
          try {
            allResources.push({
              id: `DRV-${partner.id}`,
              name: partner.contactPerson.name,
              type: 'driver',
              available: true,
              currentLocation: partner.address?.city || 'Depot',
              partnerId: partner.id,
              partnerName: partner.name
            });
            console.log(`✅ Lagt til sjåfør fra kontaktperson: ${partner.contactPerson.name} (Partner: ${partner.name})`);
          } catch (err) {
            console.error(`❌ Feil ved prosessering av kontaktperson:`, err);
          }
        }
      });
      
      // If no resources, add mock data
      if (allResources.length === 0) {
        allResources.push(
          { id: 'VEH001', name: 'Mercedes Sprinter (VAN-101)', type: 'vehicle', capacity: 1500, volumeCapacity: 12, available: true, currentLocation: 'Oslo Depot' },
          { id: 'DRV001', name: 'Sjåfør 1', type: 'driver', available: true, currentLocation: 'Oslo Depot' }
        );
      }
      
      console.log('🚗 Total ressurser funnet:', allResources.length);
      console.log('📋 Ressurs-detaljer:', allResources);
      
      setResources(allResources);
      console.log('✅ Lastet', allResources.length, 'ressurser fra partnere');
      
      // Log result without annoying alerts
      if (allResources.length > 0) {
        console.log(`✅ ${allResources.length} ressurser lastet fra Samarbeidspartnere!`);
      } else {
        console.warn('⚠️ Ingen ressurser funnet. Sjekk at partnere har kjøretøy registrert.');
      }
    } catch (error) {
      console.error('❌ Error loading resources:', error);
      console.error('Feildetaljer:', error);
      // Fallback
      const mockResources: Resource[] = [
        { id: 'VEH001', name: 'Mercedes Sprinter (VAN-101)', type: 'vehicle', capacity: 1500, volumeCapacity: 12, available: true, currentLocation: 'Oslo Depot', typeEmoji: '🚗' }
      ];
      setResources(mockResources);
    }
  };

  // Filter orders
  const filteredOrders = orders.filter(order =>
    !searchOrderTerm ||
    order.orderNumber?.toString().includes(searchOrderTerm) ||
    order.documentNumber?.toString().includes(searchOrderTerm) ||
    order.customerName?.toLowerCase().includes(searchOrderTerm.toLowerCase()) ||
    order.customerPhone?.toLowerCase().includes(searchOrderTerm.toLowerCase()) ||
    order.address?.toLowerCase().includes(searchOrderTerm.toLowerCase()) ||
    order.customerAddress?.toLowerCase().includes(searchOrderTerm.toLowerCase())
  );

  // Filter partners
  const filteredPartners = partners.filter(partner =>
    !searchPartnerTerm ||
    partner.name?.toLowerCase().includes(searchPartnerTerm.toLowerCase()) ||
    partner.contactPerson?.toLowerCase().includes(searchPartnerTerm.toLowerCase())
  );

  // Button handlers
  const handleRefresh = () => {
    loadOrdersFromFirestore();
    loadPartnersData();
    loadFreightOrders(); // This clears any mock routes
    loadSavedRoutes(); // Load saved routes for persistence
    loadResources();
    alert('✅ Data oppdatert! (inkl. ressurser fra Samarbeidspartnere)');
  };

  const handleExport = () => {
    const data = {
      orders: filteredOrders,
      partners: partners,
      routes: plannedRoutes,
      exportDate: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `planning-export-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    alert('✅ Data eksportert!');
  };

  const handleOptimize = () => {
    if (filteredOrders.length === 0) {
      alert('⚠️ Ingen ordre å optimalisere');
      return;
    }
    
    // Simple optimization: Group orders by proximity (mock implementation)
    const optimizedRoutes = [];
    const ordersPerRoute = Math.ceil(filteredOrders.length / Math.max(1, partners.length));
    
    for (let i = 0; i < filteredOrders.length; i += ordersPerRoute) {
      const routeOrders = filteredOrders.slice(i, i + ordersPerRoute);
      optimizedRoutes.push({
        id: `route-${i / ordersPerRoute + 1}`,
        orders: routeOrders,
        distance: Math.random() * 50 + 10,
        duration: Math.random() * 120 + 30
      });
    }
    
    setPlannedRoutes(optimizedRoutes);
    alert(`✅ ${optimizedRoutes.length} ruter optimalisert!`);
  };

  const handleSavePlan = async () => {
    if (plannedRoutes.length === 0) {
      alert('⚠️ Ingen ruter å lagre');
      return;
    }

    if (!db) {
      alert('❌ Database ikke tilgjengelig');
      return;
    }

    try {
      const planData = {
        routes: plannedRoutes,
        orders: filteredOrders,
        createdAt: serverTimestamp(),
        status: 'planned'
      };

      await addDoc(collection(db, 'route_plans'), planData);
      alert('✅ Plan lagret i database!');
      } catch (error) {
      console.error('Error saving plan:', error);
      alert('❌ Feil ved lagring av plan');
    }
  };

  const handleRouting = () => {
    if (filteredOrders.length === 0) {
      alert('⚠️ Ingen ordre å rute');
      return;
    }
    
    alert(`🚀 Starter automatisk ruting for ${filteredOrders.length} ordre...`);
    handleOptimize();
  };

  const handleCalculateETA = () => {
    if (filteredOrders.length === 0) {
      alert('⚠️ Ingen ordre å beregne ETA for');
      return;
    }
    
    const avgTimePerStop = 15; // minutes
    const totalTime = filteredOrders.length * avgTimePerStop;
    const eta = new Date(Date.now() + totalTime * 60000);
    
    alert(`⏰ Estimert ferdig tid: ${eta.toLocaleTimeString('no-NO', { hour: '2-digit', minute: '2-digit' })}\nTotal tid: ${totalTime} minutter`);
  };

  // ============= COCKPIT FUNCTIONS =============
  
  // Drag FU to FO
  const handleDragFUStart = (fu: FreightUnit | null) => {
    setDraggedFU(fu);
  };

  // Download document and upload to OneDrive
  const handleDownloadDocument = async (type: string, fo: FreightOrder) => {
    const documentTypes = {
      'driving-order': 'Kjøreordre',
      'cmr': 'Fraktbrev (CMR)',
      'picking-list': 'Plukkliste',
      'delivery-labels': 'Leveringsetiketter',
      'pod': 'POD (Proof of Delivery)',
      'route-map': 'Rutekart'
    };

    const documentName = documentTypes[type as keyof typeof documentTypes] || type;
    
    // Create PDF content (simplified for now - can be enhanced with proper PDF generation)
    const content = `
${documentName.toUpperCase()}
================================

Rute: ${fo.name}
Dato: ${new Date().toLocaleDateString('no-NO')}
Sjåfør: ${fo.vehicle || 'Ikke tildelt'}
Status: ${fo.status}

STOPP:
${fo.freightUnits.map((fu, index) => `
${index + 1}. ${fu.customer}
   Adresse: ${fu.address}
   Vekt: ${fu.weight}kg
   Volum: ${fu.volume}m³
   Prioritet: ${fu.priority}
   Beskrivelse: ${fu.customer} leveranse
`).join('')}

TOTAL:
- Vekt: ${fo.totalWeight}kg / ${fo.maxWeight}kg
- Volum: ${fo.totalVolume}m³ / ${fo.maxVolume}m³
- Kostnad: ${fo.cost.toFixed(0)},- NOK

Generert: ${new Date().toLocaleString('no-NO')}
    `.trim();

    try {
      // Check if user is logged into OneDrive
      if (!oneDriveService.isLoggedIn()) {
        alert('Du må være logget inn på OneDrive for å lagre dokumenter. Gå til Arkiv-siden for å logge inn.');
        return;
      }

      // Create PDF blob (simplified - in production, use proper PDF generation library)
      const blob = new Blob([content], { type: 'application/pdf' });
      const arrayBuffer = await blob.arrayBuffer();
      
      // Upload to OneDrive
      const date = new Date().toISOString().split('T')[0];
      const partnerName = fo.vehicle || 'Ukjent';
      const oneDriveUrl = await oneDriveService.uploadRoutePDF(arrayBuffer, fo.name, date, partnerName);
      
      // Also create local download
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${documentName}_${fo.name}_${date}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      alert(`📄 ${documentName} lagret til OneDrive og lastet ned lokalt!\n\nOneDrive URL: ${oneDriveUrl}`);
    } catch (error) {
      console.error('Error uploading to OneDrive:', error);
      
      // Fallback to local download only
      const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${documentName}_${fo.name}_${new Date().toISOString().split('T')[0]}.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      alert(`📄 ${documentName} lastet ned lokalt (OneDrive-feil: ${error})`);
    }
  };

  // Send to driver
  const handleSendToDriver = async (fo: FreightOrder) => {
    if (!fo.vehicle) {
      alert('⚠️ Ingen kjøretøy tildelt denne ruten. Tildel et kjøretøy først.');
      return;
    }

    try {
      // Find the vehicle resource and its partner (always M22)
      const vehicleResource = resources.find(r => r.name === 'M22');
      if (!vehicleResource) {
        alert('⚠️ Kunne ikke finne sjåfør for M22.');
        return;
      }

      // Find which partner owns this vehicle
      let partnerId = '';
      let partnerName = '';
      
      console.log('🔍 Debugging vehicle resource:', vehicleResource);
      console.log('🔍 Available partners:', partners);
      
      // First try to get partner info directly from resource
      if (vehicleResource.partnerId && vehicleResource.partnerName) {
        partnerId = vehicleResource.partnerId;
        partnerName = vehicleResource.partnerName;
        console.log('✅ Found partner info directly from resource:', { partnerId, partnerName });
      } else {
        // Fallback: Extract partner info from resource ID (format: VEH-{partnerId}-{vehicleIndex})
        const resourceIdParts = vehicleResource.id.split('-');
        console.log('🔍 Resource ID parts:', resourceIdParts);
        
        if (resourceIdParts.length >= 2) {
          partnerId = resourceIdParts[1];
          console.log('🔍 Extracted partnerId:', partnerId);
          
          // Find partner name from partners data
          const partner = partners.find(p => p.id === partnerId);
          console.log('🔍 Found partner:', partner);
          
          if (partner) {
            partnerName = partner.name;
          }
        }

        // If we still couldn't find partner, try to find by vehicle name
        if (!partnerId || !partnerName) {
          console.log('🔍 Trying to find partner by vehicle name...');
          
          for (const partner of partners) {
            if (partner.vehicles && Array.isArray(partner.vehicles) && partner.vehicles.length > 0) {
              const matchingVehicle = partner.vehicles.find((v: any) => 
                v.vehicleName === fo.vehicle || 
                v.vehicleNumber === fo.vehicle ||
                v.model === fo.vehicle ||
                `${v.model} ${v.vehicleNumber}` === fo.vehicle ||
                `${v.model} (${v.registrationNumber})` === fo.vehicle
              );
              
              if (matchingVehicle) {
                partnerId = partner.id;
                partnerName = partner.name;
                console.log('🔍 Found partner by vehicle match:', { partnerId, partnerName });
                break;
              }
            }
          }
        }
      }

      if (!partnerId || !partnerName) {
        console.error('❌ Could not find partner for vehicle:', fo.vehicle);
        console.error('❌ Available vehicles in partners:', partners.map(p => ({
          partnerName: p.name,
          partnerId: p.id,
          vehicles: Array.isArray(p.vehicles) ? p.vehicles.map((v: any) => ({
            vehicleName: v.vehicleName,
            vehicleNumber: v.vehicleNumber,
            model: v.model,
            registrationNumber: v.registrationNumber
          })) : []
        })));
        alert('⚠️ Kunne ikke finne partner for dette kjøretøyet. Sjekk console for detaljer.');
        return;
      }

      console.log('🚗 Sender rute til:', {
        vehicle: fo.vehicle,
        driver: vehicleResource.name,
        partnerId,
        partnerName,
        routeName: fo.name
      });

      // Create route assignment data
      const routeAssignment = {
        id: `ROUTE-${Date.now()}`,
        routeName: fo.name,
        date: new Date().toISOString().split('T')[0],
        vehicle: fo.vehicle,
        driver: vehicleResource.name,
        partnerId: partnerId,
        partnerName: partnerName,
        stops: fo.freightUnits.map(fu => ({
          customer: fu.customer,
          address: fu.address,
          weight: fu.weight,
          volume: fu.volume,
          priority: fu.priority,
          description: `${fu.customer} leveranse`
        })),
        totalWeight: fo.totalWeight,
        totalVolume: fo.totalVolume,
        cost: fo.cost,
        status: 'assigned' as const,
        assignedAt: new Date().toISOString(),
        companyId: userProfile?.companyId
      };

      // Save to Firebase with correct partner info and full route data
      await firebaseService.createRouteAssignment({
        partnerId: partnerId,
        partnerName: partnerName,
        date: routeAssignment.date,
        files: [],
        title: routeAssignment.routeName,
        companyId: userProfile?.companyId || '',
        routeData: routeAssignment // Store the full route data for permanent storage
      });
      
      alert(`✅ Kjøreliste sendt til ${partnerName} - Sjåfør: ${vehicleResource.name} for rute ${fo.name}`);
      
      // Update FO status
      setFreightOrders(prev => prev.map(f => 
        f.id === fo.id ? { ...f, status: 'in_progress' as const } : f
      ));

    } catch (error) {
      console.error('Error sending to driver:', error);
      alert('❌ Feil ved sending til sjåfør. Prøv igjen.');
    }
  };

  // Remove route assignment (unassign from vehicle)
  const handleRemoveRouteAssignment = async (fo: FreightOrder) => {
    if (!fo.vehicle) {
      alert('⚠️ Ingen kjøretøy tildelt denne ruten.');
      return;
    }

    const confirmed = window.confirm(
      `Er du sikker på at du vil fjerne rute "${fo.name}" fra kjøretøy "${fo.vehicle}"?\n\n` +
      `Dette vil gjøre ruten tilgjengelig for ny planlegging.`
    );

    if (!confirmed) return;

    try {
      // Find the vehicle resource and its partner (always M22)
      const vehicleResource = resources.find(r => r.name === 'M22');
      if (!vehicleResource) {
        alert('⚠️ Kunne ikke finne partner for M22.');
        return;
      }

      // Find which partner owns this vehicle (same logic as in handleSendToDriver)
      let partnerId = '';
      let partnerName = '';
      
      if (vehicleResource.partnerId && vehicleResource.partnerName) {
        partnerId = vehicleResource.partnerId;
        partnerName = vehicleResource.partnerName;
      } else {
        const resourceIdParts = vehicleResource.id.split('-');
        if (resourceIdParts.length >= 2) {
          partnerId = resourceIdParts[1];
          const partner = partners.find(p => p.id === partnerId);
          if (partner) {
            partnerName = partner.name;
          }
        }

        if (!partnerId || !partnerName) {
          for (const partner of partners) {
            if (partner.vehicles && Array.isArray(partner.vehicles) && partner.vehicles.length > 0) {
              const matchingVehicle = partner.vehicles.find((v: any) => 
                v.vehicleName === fo.vehicle || 
                v.vehicleNumber === fo.vehicle ||
                v.model === fo.vehicle ||
                `${v.model} ${v.vehicleNumber}` === fo.vehicle ||
                `${v.model} (${v.registrationNumber})` === fo.vehicle
              );
              
              if (matchingVehicle) {
                partnerId = partner.id;
                partnerName = partner.name;
                break;
              }
            }
          }
        }
      }

      if (!partnerId || !partnerName) {
        alert('⚠️ Kunne ikke finne partner for dette kjøretøyet.');
        return;
      }

      // Remove from Firebase (we'll need to add this method to firebaseService)
      const today = new Date().toISOString().split('T')[0];
      
      // Get all route assignments for this partner today
      const assignments = await firebaseService.getRouteAssignments(userProfile?.companyId || '', today, today);
      
      // Find the assignment to remove
      const assignmentToRemove = assignments.find(assignment => 
        assignment.partnerId === partnerId && 
        assignment.routeName === fo.name &&
        assignment.vehicle === fo.vehicle
      );

      if (assignmentToRemove) {
        // Delete from Firebase
        await firebaseService.deleteRouteAssignment(assignmentToRemove.id);
        console.log('🗑️ Removed assignment from Firebase:', assignmentToRemove.id);
      }

      // Update FO status back to planned and remove vehicle assignment
      setFreightOrders(prev => prev.map(f => 
        f.id === fo.id ? { 
          ...f, 
          status: 'planned' as const,
          vehicle: undefined,
          driver: undefined
        } : f
      ));

      alert(`✅ Rute "${fo.name}" fjernet fra kjøretøy "${fo.vehicle}". Ruten er nå tilgjengelig for ny planlegging.`);

        } catch (error) {
      console.error('Error removing route assignment:', error);
      alert('❌ Feil ved fjerning av rute. Prøv igjen.');
    }
  };

  // Save planned routes to Firebase for persistence
  const handleSaveRoutes = async () => {
    try {
      console.log('🚀 Starting route save process...');
      
      if (freightOrders.length === 0) {
        alert('⚠️ Ingen ruter å lagre.');
        return;
      }

      if (!userProfile?.companyId) {
        console.error('❌ No company ID found in userProfile:', userProfile);
        alert('❌ Ingen bedrift funnet. Logg inn på nytt.');
        return;
      }

      console.log('📋 Saving routes:', { 
        routesCount: freightOrders.length, 
        companyId: userProfile.companyId 
      });

      // Check for capacity warnings
      const routesWithWarnings = freightOrders.filter(fo => fo.warnings && fo.warnings.length > 0);
      
      if (routesWithWarnings.length > 0) {
        const warningText = routesWithWarnings.map(fo => 
          `${fo.name}: ${fo.warnings.join(', ')}`
        ).join('\n');
        
        const confirmMessage = `⚠️ ADVARSEL: Noen ruter har kapasitetsproblemer!\n\n${warningText}\n\nDette kan føre til:\n• Økt drivstofforbruk\n• Forsinkelser\n• Sikkerhetsrisiko\n• Ekstra kostnader\n\nEr du sikker på at du vil lagre likevel?`;
        
        if (!confirm(confirmMessage)) {
          return;
        }
      }

      const routesToSave = freightOrders
        .filter(fo => fo && fo.id) // Filter out invalid routes
        .map(fo => ({
          ...fo,
          savedAt: new Date().toISOString(),
          companyId: userProfile.companyId
        }));

      console.log('💾 Routes prepared for saving:', routesToSave.length);

      // Save to Firebase
      await firebaseService.savePlannedRoutes(userProfile.companyId, routesToSave);
      
      alert(`✅ ${freightOrders.length} ruter lagret permanent!`);
      
      // Update local state with savedAt timestamps
      setFreightOrders(prev => prev.map(fo => ({
        ...fo,
        savedAt: new Date().toISOString()
      })));

    } catch (error) {
      console.error('❌ Error saving routes:', error);
      console.error('Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        userProfile: userProfile ? { id: userProfile.id, companyId: userProfile.companyId } : 'No user profile',
        freightOrdersCount: freightOrders.length
      });
      
      const errorMessage = error instanceof Error ? error.message : 'Ukjent feil';
      alert(`❌ Feil ved lagring av ruter: ${errorMessage}\n\nSjekk konsollen for mer informasjon.`);
    }
  };

  // Auto-save routes when they are created/updated
  const autoSaveRoutes = async () => {
    if (freightOrders.length === 0 || !userProfile?.companyId) return;
    
    try {
      // Only save routes that have freight units (real routes)
      const realRoutes = freightOrders.filter(fo => fo.freightUnits && fo.freightUnits.length > 0);
      
      if (realRoutes.length === 0) {
        console.log('⚠️ Ingen ekte ruter å lagre - hopper over auto-save');
        return;
      }
      
      const routesToSave = realRoutes
        .filter(fo => fo && fo.id) // Filter out invalid routes
        .map(fo => ({
          ...fo,
          savedAt: new Date().toISOString(),
          companyId: userProfile.companyId
        }));

      await firebaseService.savePlannedRoutes(userProfile.companyId, routesToSave);
      console.log('✅ Auto-saved', realRoutes.length, 'ekte ruter to Firebase');
      
      // Update local state with savedAt timestamps
      setFreightOrders(prev => prev.map(fo => ({
        ...fo,
        savedAt: new Date().toISOString()
      })));
    } catch (error) {
      console.error('Error auto-saving routes:', error);
    }
  };

  // Clear all mock routes from Firebase
  const clearMockRoutes = async () => {
    if (!userProfile?.companyId) return;
    
    try {
      // Clear all routes and save empty array
      await firebaseService.savePlannedRoutes(userProfile.companyId, []);
      setFreightOrders([]);
      console.log('✅ Alle mock-ruter fjernet fra Firebase');
      alert('✅ Alle mock-ruter fjernet!');
    } catch (error) {
      console.error('Error clearing mock routes:', error);
      alert('❌ Feil ved fjerning av mock-ruter');
    }
  };

  // Load saved routes from Firebase
  const loadSavedRoutes = async () => {
    if (!userProfile?.companyId) return;
    
    try {
      const savedRoutes = await firebaseService.getPlannedRoutes(userProfile.companyId);
      
      if (savedRoutes && savedRoutes.length > 0) {
        // Filter out mock routes (FO001, FO002, etc. with no freight units)
        const realRoutes = savedRoutes.filter(route => 
          route.freightUnits && route.freightUnits.length > 0
        );
        
        if (realRoutes.length > 0) {
          setFreightOrders(realRoutes);
          
          // Update FU status to 'assigned' for all FUs in saved routes
          const assignedFUIds = new Set<string>();
          realRoutes.forEach(route => {
            route.freightUnits.forEach((fu: any) => {
              assignedFUIds.add(fu.id);
            });
          });
          
          setFreightUnits(prev => prev.map(fu => 
            assignedFUIds.has(fu.id) ? { ...fu, status: 'assigned' as const } : fu
          ));
          
          console.log('✅ Lastet', realRoutes.length, 'ekte lagrede ruter fra Firebase');
          console.log('✅ Oppdatert', assignedFUIds.size, 'FU-er til "assigned" status');
      } else {
          console.log('✅ Kun mock-ruter funnet - starter med tom liste');
          setFreightOrders([]);
        }
      } else {
        console.log('✅ Ingen lagrede ruter funnet - starter med tom liste');
        setFreightOrders([]);
      }
    } catch (error) {
      console.error('Error loading saved routes:', error);
      setFreightOrders([]);
    }
  };

  // Set route number for a specific route
  const handleSetRouteNumber = (fo: FreightOrder, routeNumber: string) => {
    setFreightOrders(prev => prev.map(f => 
      f.id === fo.id ? { ...f, routeNumber: routeNumber } : f
    ));
    setShowRouteNumberModal(null);
    setRouteNumberInput('');
  };

  const handleDropFUOnFO = (foId: string) => {
    if (!draggedFU) return;
    
    const fuToDrop = draggedFU;
    
    // If dropping on existing FO, add to it
    const existingFO = freightOrders.find(fo => fo.id === foId);
    if (existingFO) {
      setFreightOrders(prev => prev.map(fo => {
        if (fo.id === foId) {
          // Check capacity
          const newTotalWeight = fo.totalWeight + fuToDrop.weight;
          const newTotalVolume = fo.totalVolume + fuToDrop.volume;
          
          const warnings = [];
          if (newTotalWeight > fo.maxWeight) {
            warnings.push(`⚠️ Vektkapasitet overskredet: ${newTotalWeight}kg / ${fo.maxWeight}kg`);
          }
          if (newTotalVolume > fo.maxVolume) {
            warnings.push(`⚠️ Volumkapasitet overskredet: ${newTotalVolume}m³ / ${fo.maxVolume}m³`);
          }
          
          return {
            ...fo,
            freightUnits: [...fo.freightUnits, fuToDrop],
            totalWeight: newTotalWeight,
            totalVolume: newTotalVolume,
            warnings: warnings.length > 0 ? warnings : fo.warnings,
            cost: fo.cost + (fuToDrop.price * 0.7), // 70% av pris som kostnad
            // Preserve vehicle and driver info
            vehicle: fo.vehicle,
            driver: fo.driver
          };
        }
        return fo;
      }));
    } else {
      // Create new FO when dropping on empty area
      const newFO: FreightOrder = {
        id: `FO${String(freightOrders.length + 1).padStart(3, '0')}`,
        name: `RT${Math.floor(10000000 + Math.random() * 90000000)}`, // 2 letters + 8 digits
        // routeNumber will be set manually by user
        freightUnits: [fuToDrop],
        totalWeight: fuToDrop.weight,
        totalVolume: fuToDrop.volume,
        maxWeight: 1500,
        maxVolume: 12,
        distance: 0,
        status: 'planned',
        startTime: '08:00',
        endTime: '17:00',
        cost: fuToDrop.price * 0.7,
        warnings: []
      };
      
      setFreightOrders(prev => [...prev, newFO]);
    }
    
    // Update FU status
    setFreightUnits(prev => prev.map(fu => 
      fu.id === fuToDrop.id ? { ...fu, status: 'assigned' as const } : fu
    ));
    
    // Auto-save routes after creating/updating
    setTimeout(() => autoSaveRoutes(), 1000);
    
    // Clear dragged state immediately
    setDraggedFU(null);
  };

  // Handle dropping FU on resource (vehicle/driver) - creates new route
  const handleDropFUOnResource = (resourceId: string) => {
    if (!draggedFU) return;
    
    const fuToDrop = draggedFU;
    const resource = resources.find(r => r.id === resourceId);
    
    if (!resource) return;
    
    // Create new FO with the resource assigned
    const newFO: FreightOrder = {
      id: `FO${String(freightOrders.length + 1).padStart(3, '0')}`,
      name: `RT${Math.floor(10000000 + Math.random() * 90000000)}`, // 2 letters + 8 digits
      // routeNumber will be set manually by user
      freightUnits: [fuToDrop],
      totalWeight: fuToDrop.weight,
      totalVolume: fuToDrop.volume,
      maxWeight: resource.capacity || 1500,
      maxVolume: resource.volumeCapacity || 12,
      distance: 0,
      status: 'planned',
      startTime: '08:00',
      endTime: '17:00',
      cost: fuToDrop.price * 0.7,
      warnings: [],
      vehicle: 'M22', // Always use M22 as vehicle
      driver: resource.name // All resources are drivers from Samarbeidspartnere
    };
    
    console.log('🚗 Creating new FO with resource:', {
      resourceType: resource.type,
      resourceName: resource.name,
      vehicle: newFO.vehicle,
      driver: newFO.driver,
      foId: newFO.id
    });
    
    setFreightOrders(prev => [...prev, newFO]);
    
    // Update FU status
    setFreightUnits(prev => prev.map(fu => 
      fu.id === fuToDrop.id ? { ...fu, status: 'assigned' as const } : fu
    ));
    
    // Auto-save routes after creating/updating
    setTimeout(() => autoSaveRoutes(), 1000);
    
    console.log('✅ Created new FO with driver info:', {
      foId: newFO.id,
      driver: newFO.driver,
      vehicle: newFO.vehicle,
      routeNumber: newFO.routeNumber
    });
    
    // Clear dragged state immediately
    setDraggedFU(null);
  };

  // Remove FU from FO
  const handleRemoveFUFromFO = (foId: string, fuId: string) => {
    let removedFU: FreightUnit | null = null;
    
    setFreightOrders(prev => prev.map(fo => {
      if (fo.id === foId) {
        const fu = fo.freightUnits.find(f => f.id === fuId);
        if (fu) {
          removedFU = fu;
          const newFUs = fo.freightUnits.filter(f => f.id !== fuId);
          const newTotalWeight = newFUs.reduce((sum, f) => sum + f.weight, 0);
          const newTotalVolume = newFUs.reduce((sum, f) => sum + f.volume, 0);
          
          return {
            ...fo,
            freightUnits: newFUs,
            totalWeight: newTotalWeight,
            totalVolume: newTotalVolume,
            warnings: [], // Clear warnings
            cost: newFUs.reduce((sum, f) => sum + (f.price * 0.7), 0)
          };
        }
      }
      return fo;
    }));
    
    if (removedFU) {
      setFreightUnits(prev => prev.map(fu => 
        fu.id === fuId ? { ...fu, status: 'unassigned' as const } : fu
      ));
    }
  };

  // Create new FO (only when user explicitly creates one)
  const handleCreateNewFO = () => {
    const newFO: FreightOrder = {
      id: `FO${String(freightOrders.length + 1).padStart(3, '0')}`,
      name: `RT${Math.floor(10000000 + Math.random() * 90000000)}`, // 2 letters + 8 digits
      // routeNumber will be set manually by user
      freightUnits: [],
      totalWeight: 0,
      totalVolume: 0,
      maxWeight: 1500,
      maxVolume: 12,
      distance: 0,
      status: 'planned',
      startTime: '08:00',
      endTime: '16:00',
      cost: 0,
      warnings: []
    };
    setFreightOrders(prev => [...prev, newFO]);
    console.log('✅ Ny tom rute opprettet:', newFO.name);
  };

  // Auto-assign FUs to FOs (only works if routes already exist)
  const handleAutoAssign = () => {
    const unassignedFUs = freightUnits.filter(fu => fu.status === 'unassigned');
    if (unassignedFUs.length === 0) {
      alert('✅ Alle leveranser er allerede tildelt');
      return;
    }
    
    if (freightOrders.length === 0) {
      alert('⚠️ Ingen ruter å tildele til. Opprett ruter først ved å dra leveranser på kjøretøy.');
      return;
    }
    
    // Simple greedy algorithm - assign to first FO with capacity
    let assigned = 0;
    const updatedFOs = [...freightOrders];
    
    unassignedFUs.forEach(fu => {
      for (let fo of updatedFOs) {
        if (fo.totalWeight + fu.weight <= fo.maxWeight && 
            fo.totalVolume + fu.volume <= fo.maxVolume) {
          fo.freightUnits.push(fu);
          fo.totalWeight += fu.weight;
          fo.totalVolume += fu.volume;
          fo.cost += fu.price * 0.7;
          fu.status = 'assigned';
          assigned++;
          break;
        }
      }
    });
    
    setFreightOrders(updatedFOs);
    setFreightUnits([...freightUnits]);
    alert(`✅ ${assigned} leveranser automatisk tildelt!`);
  };

  // Optimize FO sequence
  const handleOptimizeFO = (foId: string) => {
    setFreightOrders(prev => prev.map(fo => {
      if (fo.id === foId && fo.freightUnits.length > 0) {
        // Simple optimization by zone
        const optimized = [...fo.freightUnits].sort((a, b) => {
          // Sort by priority first, then zone
          if (a.priority !== b.priority) {
            const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
            return priorityOrder[a.priority] - priorityOrder[b.priority];
          }
          return a.zone.localeCompare(b.zone);
        });
        
        return { ...fo, freightUnits: optimized };
      }
      return fo;
    }));
    alert('✅ Stopprekkefølge optimalisert!');
  };

  // Release FO
  const handleReleaseFO = (foId: string) => {
    setFreightOrders(prev => prev.map(fo => 
      fo.id === foId ? { ...fo, status: 'released' as const } : fo
    ));
    alert('✅ Kjøreliste frigitt til sjåfør!');
  };

  // Recalculate charges for FO
  const handleRecalculateCharges = (foId: string) => {
    setFreightOrders(prev => prev.map(fo => {
      if (fo.id === foId) {
        // Recalculate based on distance and weight
        const baseCost = fo.freightUnits.reduce((sum, fu) => sum + (fu.price * 0.7), 0);
        const distanceCost = fo.distance * 15; // 15kr per km
        const weightSurcharge = fo.totalWeight > 1000 ? fo.totalWeight * 0.5 : 0;
        const totalCost = baseCost + distanceCost + weightSurcharge;
        
        return { ...fo, cost: totalCost, distance: fo.freightUnits.length * 8 };
      }
      return fo;
    }));
    alert('✅ Priser rekalkulert!');
  };

  // Change delivery date for FU
  const handleChangeFUDate = (fuId: string, newDate: string) => {
    setFreightUnits(prev => prev.map(fu => 
      fu.id === fuId ? { ...fu, deliveryDate: newDate } : fu
    ));
  };

  // Mass edit selected FUs
  const handleMassEditFUs = (updates: Partial<FreightUnit>) => {
    setFreightUnits(prev => prev.map(fu => 
      selectedFUs.includes(fu.id) ? { ...fu, ...updates } : fu
    ));
    setSelectedFUs([]);
    alert(`✅ ${selectedFUs.length} leveranser oppdatert!`);
  };

  // Toggle FU selection
  const handleToggleFUSelection = (fuId: string) => {
    setSelectedFUs(prev => 
      prev.includes(fuId) ? prev.filter(id => id !== fuId) : [...prev, fuId]
    );
  };

  // Add note to FO
  const handleAddNoteToFO = (foId: string, note: string) => {
    setFreightOrders(prev => prev.map(fo => {
      if (fo.id === foId) {
        return { ...fo, warnings: [...fo.warnings, `📝 ${note}`] };
      }
      return fo;
    }));
  };

  // Filtered FUs based on profile and search
  const filteredFUs = freightUnits.filter(fu => {
    if (selectedProfile !== 'all') {
      if (selectedProfile === 'unassigned' && fu.status !== 'unassigned') return false;
      if (selectedProfile === 'urgent' && fu.priority !== 'urgent') return false;
      if (selectedProfile === 'today' && fu.deliveryDate !== '2025-10-02') return false;
    }
    if (searchFilter) {
      return fu.customer.toLowerCase().includes(searchFilter.toLowerCase()) ||
             fu.orderNumber.toLowerCase().includes(searchFilter.toLowerCase()) ||
             fu.zone.toLowerCase().includes(searchFilter.toLowerCase());
    }
    return true;
  });

  // Auto-load saved layout on mount
  useEffect(() => {
    console.log('🚀 useEffect triggered, userProfile:', userProfile);
    
    loadOrdersFromFirestore();
    loadPartnersData();
    
    // Load saved routes first, then clear if none exist
    loadSavedRoutes().then(() => {
      // Only clear if no routes were loaded
      if (freightOrders.length === 0) {
        loadFreightOrders(); // This clears any mock routes
      }
    });
    
    // Load resources after a small delay to ensure userProfile is set
    setTimeout(() => {
      loadResources();
    }, 500);
    
    // Always load saved layout if it exists
    if (typeof window !== 'undefined') {
      const savedLayout = localStorage.getItem('planningLayout');
      if (savedLayout) {
        try {
          const parsedLayout = JSON.parse(savedLayout);
          setWindowLayouts(parsedLayout);
          console.log('✅ Loaded saved layout from localStorage');
        } catch (error) {
          console.error('Error loading saved layout:', error);
        }
      }
    }
  }, [userProfile]);


  // Snap to grid function (for smooth snapping)
  const snapToGrid = (value: number, gridSize: number = 10): number => {
    return Math.round(value / gridSize) * gridSize;
  };

  // Drag and drop handlers with smooth animations
  const handleMouseDown = (e: React.MouseEvent, windowId: string) => {
    if (!editMode) return;
    e.preventDefault();
    setDraggedWindow(windowId);
    
    const startX = e.clientX;
    const startY = e.clientY;
    const startLayout = windowLayouts[windowId];
    
    // Add cursor style
    document.body.style.cursor = 'move';
    
    const handleMouseMove = (e: MouseEvent) => {
      // Smooth movement calculation
      const deltaX = e.clientX - startX;
      const deltaY = e.clientY - startY;
      
      // Calculate new position with snapping for professional feel
      let newX = Math.max(0, startLayout.x + deltaX);
      let newY = Math.max(0, startLayout.y + deltaY);
      
      // Snap to grid for smooth alignment
      newX = snapToGrid(newX, 20);
      newY = snapToGrid(newY, 20);
      
      setWindowLayouts(prev => {
        const newLayouts = { ...prev };
        newLayouts[windowId] = {
          ...startLayout,
          x: newX,
          y: newY
        };
        
        return newLayouts;
      });
    };
    
    const handleMouseUp = () => {
      setDraggedWindow(null);
      document.body.style.cursor = 'default';
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  // Resize handlers with smooth animations
  const handleResizeStart = (e: React.MouseEvent, windowId: string, direction: string) => {
    if (!editMode) return;
    e.preventDefault();
    e.stopPropagation();
    setResizingWindow({ windowId, direction });
    
    const startX = e.clientX;
    const startY = e.clientY;
    const startLayout = windowLayouts[windowId];
    
    // Set appropriate cursor
    const cursorMap: Record<string, string> = {
      'top': 'ns-resize',
      'bottom': 'ns-resize',
      'left': 'ew-resize',
      'right': 'ew-resize',
      'top-left': 'nwse-resize',
      'top-right': 'nesw-resize',
      'bottom-left': 'nesw-resize',
      'bottom-right': 'nwse-resize'
    };
    document.body.style.cursor = cursorMap[direction] || 'default';
    
    const handleMouseMove = (e: MouseEvent) => {
      // Smooth resize calculation
      const deltaX = e.clientX - startX;
      const deltaY = e.clientY - startY;
      
      setWindowLayouts(prev => {
        let newLayout = { ...startLayout };
        
        if (direction.includes('right')) {
          newLayout.width = Math.max(200, snapToGrid(startLayout.width + deltaX, 20));
        }
        if (direction.includes('left')) {
          const newWidth = Math.max(200, snapToGrid(startLayout.width - deltaX, 20));
          newLayout.width = newWidth;
          newLayout.x = Math.max(0, snapToGrid(startLayout.x + (startLayout.width - newWidth), 20));
        }
        if (direction.includes('bottom')) {
          newLayout.height = Math.max(150, snapToGrid(startLayout.height + deltaY, 20));
        }
        if (direction.includes('top')) {
          const newHeight = Math.max(150, snapToGrid(startLayout.height - deltaY, 20));
          newLayout.height = newHeight;
          newLayout.y = Math.max(0, snapToGrid(startLayout.y + (startLayout.height - newHeight), 20));
        }
        
        return { ...prev, [windowId]: newLayout };
      });
    };
    
    const handleMouseUp = () => {
      setResizingWindow(null);
      document.body.style.cursor = 'default';
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  // Use new Cockpit Interface
  const renderCockpit = () => {
    return (
      <CockpitInterface
        freightUnits={freightUnits}
        freightOrders={freightOrders}
        resources={resources}
        selectedProfile={selectedProfile}
        searchFilter={searchFilter}
        showGantt={showGantt}
        showMap={showMap}
        viewMode={viewMode}
        editMode={editMode}
        draggedFU={draggedFU}
        selectedFUs={selectedFUs}
        visibleColumns={visibleColumns}
        onSetSelectedProfile={setSelectedProfile}
        onSetSearchFilter={setSearchFilter}
        onSetShowGantt={setShowGantt}
        onSetShowMap={setShowMap}
        onSetViewMode={setViewMode}
        onDragFUStart={handleDragFUStart}
        onDropFUOnFO={handleDropFUOnFO}
        onRemoveFUFromFO={handleRemoveFUFromFO}
        onCreateNewFO={handleCreateNewFO}
        onAutoAssign={handleAutoAssign}
        onOptimizeFO={handleOptimizeFO}
        onReleaseFO={handleReleaseFO}
        onRefresh={handleRefresh}
        onExport={handleExport}
        onCloseCockpit={() => setShowPlanningView(false)}
        onOpenSettings={() => setShowSettingsModal(true)}
        onSaveLayout={() => {
          localStorage.setItem('planningLayout', JSON.stringify(windowLayouts));
          setEditMode(false);
          setOriginalLayout(null);
          alert('✅ Layout lagret!');
        }}
        onCancelEdit={() => {
          if (originalLayout) {
            setWindowLayouts(originalLayout);
          }
          setEditMode(false);
          setOriginalLayout(null);
        }}
        onToggleFUSelection={handleToggleFUSelection}
        onRecalculateCharges={handleRecalculateCharges}
        onChangeFUDate={handleChangeFUDate}
        onAddNoteToFO={handleAddNoteToFO}
        onDownloadDocument={handleDownloadDocument}
        onSendToDriver={handleSendToDriver}
        onRemoveRouteAssignment={handleRemoveRouteAssignment}
        onAssignResourceToFO={handleAssignResourceToFO}
        onDropFUOnResource={handleDropFUOnResource}
        onSaveRoutes={handleSaveRoutes}
        onSetRouteNumber={handleSetRouteNumber}
        showRouteNumberModal={showRouteNumberModal}
        setShowRouteNumberModal={setShowRouteNumberModal}
        routeNumberInput={routeNumberInput}
        setRouteNumberInput={setRouteNumberInput}
      />
    );
  };

  // OLD INTERFACE (kept for reference, will be removed)
  const AdvancedPlanningInterface_OLD = () => {
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: '80px',
        right: 0,
        bottom: 0,
        backgroundColor: '#f8fafc',
        fontFamily: 'Inter, system-ui, sans-serif',
        fontSize: '12px',
        zIndex: 50,
        overflow: 'auto'
      }}>
        
        {/* TOP HEADER */}
        <div style={{
          backgroundColor: '#ffffff',
          borderBottom: '1px solid #e2e8f0',
          padding: '8px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{
              backgroundColor: '#3b82f6',
              color: 'white',
              padding: '6px 12px',
              borderRadius: '6px',
              fontWeight: '600',
              fontSize: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              <Navigation className="w-3 h-3" />
              DriftPro
            </div>
            <div>
              <h1 style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: '#1e293b' }}>
                Advanced Route Planning System
              </h1>
              <p style={{ margin: 0, fontSize: '10px', color: '#64748b' }}>
                Professional logistics optimization & fleet management
              </p>
            </div>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', color: '#64748b' }}>
              <div style={{ width: '8px', height: '8px', backgroundColor: '#10b981', borderRadius: '50%' }}></div>
              System Online
            </div>
            
            {editMode && (
              <>
                <button 
                  onClick={() => {
                    localStorage.setItem('planningLayout', JSON.stringify(windowLayouts));
                    setEditMode(false);
                    setOriginalLayout(null);
                    alert('✅ Layout lagret!');
                  }}
                  style={{
                    padding: '6px 12px',
                    backgroundColor: '#10b981',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    fontSize: '10px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}>
                  <Save className="w-3 h-3" />
                  Lagre Layout
                </button>
                <button 
                  onClick={() => {
                    if (originalLayout) {
                      setWindowLayouts(originalLayout);
                    }
                    setEditMode(false);
                    setOriginalLayout(null);
                  }}
                  style={{
                    padding: '6px 12px',
                    backgroundColor: '#ef4444',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    fontSize: '10px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}>
                  <X className="w-3 h-3" />
                  Avbryt
                </button>
              </>
            )}
            
            <button 
              onClick={() => setShowSettingsModal(true)}
              style={{
              padding: '6px 12px',
              backgroundColor: '#f1f5f9',
              border: '1px solid #e2e8f0',
              borderRadius: '4px',
              fontSize: '10px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}>
              <Settings className="w-3 h-3" />
              Innstillinger
            </button>
            <button 
              onClick={() => setShowPlanningView(false)}
              style={{
                padding: '6px 12px',
                backgroundColor: '#ef4444',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                fontSize: '10px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <X className="w-3 h-3" />
              Lukk
            </button>
          </div>
        </div>

        {/* TOOLBAR */}
        <div style={{
          backgroundColor: '#ffffff',
          borderBottom: '1px solid #e2e8f0',
          padding: '6px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button 
              onClick={handleRefresh}
              disabled={loadingOrders}
              style={{
              padding: '4px 8px',
              backgroundColor: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '4px',
              fontSize: '10px',
                cursor: loadingOrders ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
                gap: '3px',
                opacity: loadingOrders ? 0.6 : 1
            }}>
              <RefreshCw className={`w-3 h-3 ${loadingOrders ? 'animate-spin' : ''}`} />
              {loadingOrders ? 'Laster...' : 'Oppdater'}
            </button>
            <button 
              onClick={handleExport}
              style={{
              padding: '4px 8px',
              backgroundColor: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '4px',
              fontSize: '10px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '3px'
            }}>
              <Download className="w-3 h-3" />
              Eksporter
            </button>
            <button 
              onClick={handleOptimize}
              style={{
              padding: '4px 8px',
              backgroundColor: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              fontSize: '10px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '3px'
            }}>
              <Zap className="w-3 h-3" />
              Optimaliser
            </button>
            <button 
              onClick={handleSavePlan}
              style={{
              padding: '4px 8px',
              backgroundColor: '#10b981',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              fontSize: '10px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '3px'
            }}>
              <Save className="w-3 h-3" />
              Lagre Plan
            </button>
            <button 
              onClick={handleRouting}
              style={{
              padding: '4px 8px',
              backgroundColor: '#f59e0b',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              fontSize: '10px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '3px'
            }}>
              <Route className="w-3 h-3" />
              Ruting
            </button>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '10px', color: '#64748b' }}>
            <span>Ordre: <strong>{filteredOrders.length}</strong></span>
            <span>Vekt: <strong>{filteredOrders.reduce((sum, o) => sum + (o.weight || 0), 0).toFixed(0)}kg</strong></span>
            <span>Partnere: <strong>{partners.length}</strong></span>
            <span>Ruter: <strong>{plannedRoutes.length}</strong></span>
            <span>{new Date().toLocaleDateString('no-NO')} {new Date().toLocaleTimeString('no-NO', {hour: '2-digit', minute: '2-digit'})}</span>
          </div>
        </div>

        {/* MAIN CONTENT AREA - DRAGGABLE LAYOUT */}
        <div style={{
          position: 'relative',
          padding: '12px',
          minHeight: 'calc(100vh - 140px)',
          overflow: 'visible',
          backgroundColor: editMode ? '#f0f9ff' : 'transparent'
        }}>
          
          {/* ROUTES PANEL */}
          <div 
            style={{
              position: 'absolute',
              left: `${windowLayouts.routes.x}px`,
              top: `${windowLayouts.routes.y}px`,
              width: `${windowLayouts.routes.width}px`,
              height: `${windowLayouts.routes.height}px`,
              backgroundColor: '#ffffff',
                border: editMode ? '3px solid #3b82f6' : '1px solid #e2e8f0',
                borderRadius: '12px',
              padding: '12px',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              cursor: editMode ? 'move' : 'default',
                boxShadow: editMode 
                  ? draggedWindow === 'routes' 
                    ? '0 20px 40px rgba(59, 130, 246, 0.4), 0 0 0 1px rgba(59, 130, 246, 0.1)'
                    : '0 8px 20px rgba(59, 130, 246, 0.25), 0 0 0 1px rgba(59, 130, 246, 0.1)'
                  : '0 2px 8px rgba(0,0,0,0.08)',
                transition: draggedWindow === 'routes' ? 'none' : 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                transform: draggedWindow === 'routes' ? 'scale(1.02)' : 'scale(1)',
                zIndex: draggedWindow === 'routes' ? 1000 : editMode ? 10 : 1
            }}
            onMouseDown={(e) => handleMouseDown(e, 'routes')}
          >
              {/* Resize handles */}
              {editMode && (
                <>
                  <div 
                    style={{
                      position: 'absolute',
                      top: -2,
                      left: -2,
                      right: -2,
                      height: '8px',
                      cursor: 'ns-resize',
                      backgroundColor: 'transparent',
                      borderTop: '2px solid #3b82f6',
                      opacity: 0.8,
                      transition: 'opacity 0.2s ease'
                    }}
                    onMouseDown={(e) => handleResizeStart(e, 'routes', 'top')}
                  />
                  <div 
                    style={{
                      position: 'absolute',
                      bottom: 0,
                      left: 0,
                      right: 0,
                      height: '4px',
                      cursor: 'ns-resize',
                      backgroundColor: '#3b82f6',
                      opacity: 0.7
                    }}
                    onMouseDown={(e) => handleResizeStart(e, 'routes', 'bottom')}
                  />
                  <div 
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      bottom: 0,
                      width: '4px',
                      cursor: 'ew-resize',
                      backgroundColor: '#3b82f6',
                      opacity: 0.7
                    }}
                    onMouseDown={(e) => handleResizeStart(e, 'routes', 'left')}
                  />
                  <div 
                    style={{
                      position: 'absolute',
                      top: 0,
                      right: 0,
                      bottom: 0,
                      width: '4px',
                      cursor: 'ew-resize',
                      backgroundColor: '#3b82f6',
                      opacity: 0.7
                    }}
                    onMouseDown={(e) => handleResizeStart(e, 'routes', 'right')}
                  />
                </>
              )}
              
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '12px'
              }}>
                <h3 style={{ margin: 0, fontSize: '14px', fontWeight: '600', color: '#1e293b' }}>
                  Routes ({plannedRoutes.length})
                </h3>
                <select style={{
                  fontSize: '11px',
                  border: '1px solid #e2e8f0',
                  borderRadius: '4px',
                  padding: '4px 8px',
                  backgroundColor: '#ffffff'
                }}>
                  <option>Next 7 days</option>
                  <option>Today</option>
                  <option>This week</option>
                </select>
              </div>
              
              <div style={{ marginBottom: '12px' }}>
                <input
                  type="text"
                  placeholder="Filter routes..."
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #e2e8f0',
                    borderRadius: '6px',
                    fontSize: '12px',
                    backgroundColor: '#f8fafc'
                  }}
                />
              </div>
              
              <div style={{
                flex: '1',
                overflow: 'auto',
                border: '1px solid #f1f5f9',
                borderRadius: '6px',
                backgroundColor: '#fafafa',
                maxHeight: '150px'
              }}>
                <table style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  fontSize: '11px',
                  fontFamily: 'Inter, system-ui, sans-serif'
                }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f8fafc', position: 'sticky', top: 0 }}>
                      <th style={{ border: '1px solid #e2e8f0', padding: '8px', textAlign: 'left', fontWeight: '600', color: '#475569' }}>Code</th>
                      <th style={{ border: '1px solid #e2e8f0', padding: '8px', textAlign: 'left', fontWeight: '600', color: '#475569' }}>Date</th>
                      <th style={{ border: '1px solid #e2e8f0', padding: '8px', textAlign: 'left', fontWeight: '600', color: '#475569' }}>Driver</th>
                      <th style={{ border: '1px solid #e2e8f0', padding: '8px', textAlign: 'left', fontWeight: '600', color: '#475569' }}>Status</th>
                      <th style={{ border: '1px solid #e2e8f0', padding: '8px', textAlign: 'left', fontWeight: '600', color: '#475569' }}>Weight %</th>
                      <th style={{ border: '1px solid #e2e8f0', padding: '8px', textAlign: 'left', fontWeight: '600', color: '#475569' }}>Start</th>
                      <th style={{ border: '1px solid #e2e8f0', padding: '8px', textAlign: 'left', fontWeight: '600', color: '#475569' }}>Finish</th>
                      <th style={{ border: '1px solid #e2e8f0', padding: '8px', textAlign: 'left', fontWeight: '600', color: '#475569' }}>Distance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {plannedRoutes.length === 0 ? (
                      <tr>
                        <td colSpan={8} style={{ border: '1px solid #e2e8f0', padding: '24px', textAlign: 'center', color: '#64748b', fontStyle: 'italic' }}>
                          Ingen ruter planlagt ennå
                        </td>
                      </tr>
                    ) : (
                      plannedRoutes.map((route, index) => (
                        <tr key={index} style={{ backgroundColor: '#ffffff' }}>
                          <td style={{ border: '1px solid #e2e8f0', padding: '8px' }}>
                            <input type="checkbox" style={{ marginRight: '8px' }} />
                            R{String(index + 1).padStart(2, '0')}
                          </td>
                          <td style={{ border: '1px solid #e2e8f0', padding: '8px' }}>{new Date().toLocaleDateString('no-NO')}</td>
                          <td style={{ border: '1px solid #e2e8f0', padding: '8px' }}>Driver {index + 1}</td>
                          <td style={{ border: '1px solid #e2e8f0', padding: '8px' }}>
                            <span style={{
                              padding: '4px 8px',
                              backgroundColor: '#dcfce7',
                              color: '#166534',
                              borderRadius: '4px',
                              fontSize: '10px',
                              fontWeight: '500'
                            }}>
                              Planned
                            </span>
                          </td>
                          <td style={{ border: '1px solid #e2e8f0', padding: '8px' }}>85%</td>
                          <td style={{ border: '1px solid #e2e8f0', padding: '8px' }}>08:00</td>
                          <td style={{ border: '1px solid #e2e8f0', padding: '8px' }}>16:00</td>
                          <td style={{ border: '1px solid #e2e8f0', padding: '8px' }}>45 km</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          {/* SITES PANEL */}
          <div 
            style={{
              position: 'absolute',
              left: `${windowLayouts.sites.x}px`,
              top: `${windowLayouts.sites.y}px`,
              width: `${windowLayouts.sites.width}px`,
              height: `${windowLayouts.sites.height}px`,
              backgroundColor: '#ffffff',
              border: editMode ? '3px solid #10b981' : '1px solid #e2e8f0',
              borderRadius: '12px',
              padding: '12px',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              cursor: editMode ? 'move' : 'default',
              boxShadow: editMode 
                ? draggedWindow === 'sites' 
                  ? '0 20px 40px rgba(16, 185, 129, 0.4), 0 0 0 1px rgba(16, 185, 129, 0.1)'
                  : '0 8px 20px rgba(16, 185, 129, 0.25), 0 0 0 1px rgba(16, 185, 129, 0.1)'
                : '0 2px 8px rgba(0,0,0,0.08)',
              transition: draggedWindow === 'sites' ? 'none' : 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              transform: draggedWindow === 'sites' ? 'scale(1.02)' : 'scale(1)',
              zIndex: draggedWindow === 'sites' ? 1000 : editMode ? 10 : 1
            }}
            onMouseDown={(e) => handleMouseDown(e, 'sites')}
          >
              {/* Resize handles */}
              {editMode && (
                <>
                  <div 
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      height: '4px',
                      cursor: 'ns-resize',
                      backgroundColor: '#10b981',
                      opacity: 0.7
                    }}
                    onMouseDown={(e) => handleResizeStart(e, 'sites', 'top')}
                  />
                  <div 
                    style={{
                      position: 'absolute',
                      bottom: 0,
                      left: 0,
                      right: 0,
                      height: '4px',
                      cursor: 'ns-resize',
                      backgroundColor: '#10b981',
                      opacity: 0.7
                    }}
                    onMouseDown={(e) => handleResizeStart(e, 'sites', 'bottom')}
                  />
                  <div 
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      bottom: 0,
                      width: '4px',
                      cursor: 'ew-resize',
                      backgroundColor: '#10b981',
                      opacity: 0.7
                    }}
                    onMouseDown={(e) => handleResizeStart(e, 'sites', 'left')}
                  />
                  <div 
                    style={{
                      position: 'absolute',
                      top: 0,
                      right: 0,
                      bottom: 0,
                      width: '4px',
                      cursor: 'ew-resize',
                      backgroundColor: '#10b981',
                      opacity: 0.7
                    }}
                    onMouseDown={(e) => handleResizeStart(e, 'sites', 'right')}
                  />
                </>
              )}
              
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '12px'
              }}>
                <h3 style={{ margin: 0, fontSize: '14px', fontWeight: '600', color: '#1e293b' }}>
                  Sites ({filteredOrders.length})
                </h3>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button 
                    onClick={handleOptimize}
                    style={{
                    padding: '6px 12px',
                    backgroundColor: '#3b82f6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    fontSize: '11px',
                    cursor: 'pointer'
                  }}>
                    Optimaliser
                  </button>
                  <button 
                    onClick={handleCalculateETA}
                    style={{
                    padding: '6px 12px',
                    backgroundColor: '#10b981',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    fontSize: '11px',
                    cursor: 'pointer'
                  }}>
                    Beregn ETA
                  </button>
                </div>
              </div>
              
              <div style={{
                flex: '1',
                overflow: 'auto',
                border: '1px solid #f1f5f9',
                borderRadius: '6px',
                backgroundColor: '#fafafa',
                maxHeight: '150px'
              }}>
                <table style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  fontSize: '11px',
                  fontFamily: 'Inter, system-ui, sans-serif'
                }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f8fafc', position: 'sticky', top: 0 }}>
                      <th style={{ border: '1px solid #e2e8f0', padding: '8px', textAlign: 'left', fontWeight: '600', color: '#475569' }}>#</th>
                      <th style={{ border: '1px solid #e2e8f0', padding: '8px', textAlign: 'left', fontWeight: '600', color: '#475569' }}>Address</th>
                      <th style={{ border: '1px solid #e2e8f0', padding: '8px', textAlign: 'left', fontWeight: '600', color: '#475569' }}>Client</th>
                      <th style={{ border: '1px solid #e2e8f0', padding: '8px', textAlign: 'left', fontWeight: '600', color: '#475569' }}>Weight</th>
                      <th style={{ border: '1px solid #e2e8f0', padding: '8px', textAlign: 'left', fontWeight: '600', color: '#475569' }}>Arrived</th>
                      <th style={{ border: '1px solid #e2e8f0', padding: '8px', textAlign: 'left', fontWeight: '600', color: '#475569' }}>Departed</th>
                      <th style={{ border: '1px solid #e2e8f0', padding: '8px', textAlign: 'left', fontWeight: '600', color: '#475569' }}>ETA</th>
                      <th style={{ border: '1px solid #e2e8f0', padding: '8px', textAlign: 'left', fontWeight: '600', color: '#475569' }}>🔒</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredOrders.map((order, index) => (
                      <tr key={order.id} style={{ backgroundColor: '#ffffff' }}>
                        <td style={{ border: '1px solid #e2e8f0', padding: '8px' }}>{index + 1}</td>
                        <td style={{ border: '1px solid #e2e8f0', padding: '8px' }}>{order.address}</td>
                        <td style={{ border: '1px solid #e2e8f0', padding: '8px' }}>{order.customerName}</td>
                        <td style={{ border: '1px solid #e2e8f0', padding: '8px' }}>{order.weight || 0}kg</td>
                        <td style={{ border: '1px solid #e2e8f0', padding: '8px' }}>-</td>
                        <td style={{ border: '1px solid #e2e8f0', padding: '8px' }}>-</td>
                        <td style={{ border: '1px solid #e2e8f0', padding: '8px' }}>
                          {order.deliveryTimeFrom && order.deliveryTimeTo 
                            ? `${order.deliveryTimeFrom}-${order.deliveryTimeTo}`
                            : '-'
                          }
                        </td>
                        <td style={{ border: '1px solid #e2e8f0', padding: '8px' }}>🔒</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          {/* ORDERS PANEL */}
          <div 
            style={{
              position: 'absolute',
              left: `${windowLayouts.orders.x}px`,
              top: `${windowLayouts.orders.y}px`,
              width: `${windowLayouts.orders.width}px`,
              height: `${windowLayouts.orders.height}px`,
              backgroundColor: '#ffffff',
              border: editMode ? '3px solid #8b5cf6' : '1px solid #e2e8f0',
              borderRadius: '12px',
              padding: '12px',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              cursor: editMode ? 'move' : 'default',
              boxShadow: editMode 
                ? draggedWindow === 'orders' 
                  ? '0 20px 40px rgba(139, 92, 246, 0.4), 0 0 0 1px rgba(139, 92, 246, 0.1)'
                  : '0 8px 20px rgba(139, 92, 246, 0.25), 0 0 0 1px rgba(139, 92, 246, 0.1)'
                : '0 2px 8px rgba(0,0,0,0.08)',
              transition: draggedWindow === 'orders' ? 'none' : 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              transform: draggedWindow === 'orders' ? 'scale(1.02)' : 'scale(1)',
              zIndex: draggedWindow === 'orders' ? 1000 : editMode ? 10 : 1
            }}
            onMouseDown={(e) => handleMouseDown(e, 'orders')}
          >
              {/* Resize handles */}
              {editMode && (
                <>
                  <div 
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      height: '4px',
                      cursor: 'ns-resize',
                      backgroundColor: '#8b5cf6',
                      opacity: 0.7
                    }}
                    onMouseDown={(e) => handleResizeStart(e, 'orders', 'top')}
                  />
                  <div 
                    style={{
                      position: 'absolute',
                      bottom: 0,
                      left: 0,
                      right: 0,
                      height: '4px',
                      cursor: 'ns-resize',
                      backgroundColor: '#8b5cf6',
                      opacity: 0.7
                    }}
                    onMouseDown={(e) => handleResizeStart(e, 'orders', 'bottom')}
                  />
                  <div 
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      bottom: 0,
                      width: '4px',
                      cursor: 'ew-resize',
                      backgroundColor: '#8b5cf6',
                      opacity: 0.7
                    }}
                    onMouseDown={(e) => handleResizeStart(e, 'orders', 'left')}
                  />
                  <div 
                    style={{
                      position: 'absolute',
                      top: 0,
                      right: 0,
                      bottom: 0,
                      width: '4px',
                      cursor: 'ew-resize',
                      backgroundColor: '#8b5cf6',
                      opacity: 0.7
                    }}
                    onMouseDown={(e) => handleResizeStart(e, 'orders', 'right')}
                  />
                </>
              )}
              
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '12px'
              }}>
                <h3 style={{ margin: 0, fontSize: '14px', fontWeight: '600', color: '#1e293b' }}>
                  Orders ({filteredOrders.length})
                </h3>
              </div>
              
              <div style={{ marginBottom: '12px' }}>
                <input
                  type="text"
                  placeholder="Filter orders..."
                  value={searchOrderTerm}
                  onChange={(e) => setSearchOrderTerm(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #e2e8f0',
                    borderRadius: '6px',
                    fontSize: '12px',
                    backgroundColor: '#f8fafc'
                  }}
                />
              </div>
              
              <div style={{
                flex: '1',
                overflow: 'auto',
                border: '1px solid #f1f5f9',
                borderRadius: '6px',
                backgroundColor: '#fafafa',
                maxHeight: '150px'
              }}>
                <table style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  fontSize: '11px',
                  fontFamily: 'Inter, system-ui, sans-serif'
                }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f8fafc', position: 'sticky', top: 0 }}>
                      <th style={{ border: '1px solid #e2e8f0', padding: '8px', textAlign: 'left', fontWeight: '600', color: '#475569' }}>Ordre</th>
                      <th style={{ border: '1px solid #e2e8f0', padding: '8px', textAlign: 'left', fontWeight: '600', color: '#475569' }}>Bilag</th>
                      <th style={{ border: '1px solid #e2e8f0', padding: '8px', textAlign: 'left', fontWeight: '600', color: '#475569' }}>Kunde</th>
                      <th style={{ border: '1px solid #e2e8f0', padding: '8px', textAlign: 'left', fontWeight: '600', color: '#475569' }}>Tjeneste</th>
                      <th style={{ border: '1px solid #e2e8f0', padding: '8px', textAlign: 'left', fontWeight: '600', color: '#475569' }}>Adresse</th>
                      <th style={{ border: '1px solid #e2e8f0', padding: '8px', textAlign: 'left', fontWeight: '600', color: '#475569' }}>Prioritet</th>
                      <th style={{ border: '1px solid #e2e8f0', padding: '8px', textAlign: 'left', fontWeight: '600', color: '#475569' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredOrders.map((order) => (
                      <tr key={order.id} style={{ backgroundColor: '#ffffff' }}>
                        <td style={{ border: '1px solid #e2e8f0', padding: '8px' }}>{order.orderNumber || 'N/A'}</td>
                        <td style={{ border: '1px solid #e2e8f0', padding: '8px' }}>{order.documentNumber || 'N/A'}</td>
                        <td style={{ border: '1px solid #e2e8f0', padding: '8px' }}>{order.customerName || 'N/A'}</td>
                        <td style={{ border: '1px solid #e2e8f0', padding: '8px' }}>{order.service?.name || 'N/A'}</td>
                        <td style={{ border: '1px solid #e2e8f0', padding: '8px' }}>{order.customerAddress || order.address || 'N/A'}</td>
                        <td style={{ border: '1px solid #e2e8f0', padding: '8px' }}>
                          <span style={{ 
                            padding: '4px 8px', 
                            borderRadius: '4px', 
                            fontSize: '10px',
                            backgroundColor: order.priority === 'high' ? '#fef2f2' : order.priority === 'medium' ? '#fefce8' : '#f0f9ff',
                            color: order.priority === 'high' ? '#dc2626' : order.priority === 'medium' ? '#ca8a04' : '#0369a1'
                          }}>
                            {order.priority === 'high' ? 'Høy' : order.priority === 'medium' ? 'Middels' : 'Lav'}
                          </span>
                        </td>
                        <td style={{ border: '1px solid #e2e8f0', padding: '8px' }}>
                          <span style={{ 
                            padding: '4px 8px', 
                            borderRadius: '4px', 
                            fontSize: '10px',
                            backgroundColor: '#f0f9ff',
                            color: '#0369a1'
                          }}>
                            {order.status === 'pending' ? 'Venter' : order.status === 'assigned' ? 'Tildelt' : order.status === 'in_progress' ? 'Pågår' : order.status === 'completed' ? 'Fullført' : 'Avbrutt'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          {/* MAP PANEL */}
          <div 
            style={{
              position: 'absolute',
              left: `${windowLayouts.map.x}px`,
              top: `${windowLayouts.map.y}px`,
              width: `${windowLayouts.map.width}px`,
              height: `${windowLayouts.map.height}px`,
              backgroundColor: '#ffffff',
              border: editMode ? '3px solid #f59e0b' : '1px solid #e2e8f0',
              borderRadius: '12px',
              padding: '12px',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              cursor: editMode ? 'move' : 'default',
              boxShadow: editMode 
                ? draggedWindow === 'map' 
                  ? '0 20px 40px rgba(245, 158, 11, 0.4), 0 0 0 1px rgba(245, 158, 11, 0.1)'
                  : '0 8px 20px rgba(245, 158, 11, 0.25), 0 0 0 1px rgba(245, 158, 11, 0.1)'
                : '0 2px 8px rgba(0,0,0,0.08)',
              transition: draggedWindow === 'map' ? 'none' : 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              transform: draggedWindow === 'map' ? 'scale(1.02)' : 'scale(1)',
              zIndex: draggedWindow === 'map' ? 1000 : editMode ? 10 : 1
            }}
            onMouseDown={(e) => handleMouseDown(e, 'map')}
          >
              {/* Resize handles */}
              {editMode && (
                <>
                  <div 
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      height: '4px',
                      cursor: 'ns-resize',
                      backgroundColor: '#f59e0b',
                      opacity: 0.7
                    }}
                    onMouseDown={(e) => handleResizeStart(e, 'map', 'top')}
                  />
                  <div 
                    style={{
                      position: 'absolute',
                      bottom: 0,
                      left: 0,
                      right: 0,
                      height: '4px',
                      cursor: 'ns-resize',
                      backgroundColor: '#f59e0b',
                      opacity: 0.7
                    }}
                    onMouseDown={(e) => handleResizeStart(e, 'map', 'bottom')}
                  />
                  <div 
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      bottom: 0,
                      width: '4px',
                      cursor: 'ew-resize',
                      backgroundColor: '#f59e0b',
                      opacity: 0.7
                    }}
                    onMouseDown={(e) => handleResizeStart(e, 'map', 'left')}
                  />
                  <div 
                    style={{
                      position: 'absolute',
                      top: 0,
                      right: 0,
                      bottom: 0,
                      width: '4px',
                      cursor: 'ew-resize',
                      backgroundColor: '#f59e0b',
                      opacity: 0.7
                    }}
                    onMouseDown={(e) => handleResizeStart(e, 'map', 'right')}
                  />
                </>
              )}
              
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '16px'
              }}>
                <h3 style={{ margin: 0, fontSize: '14px', fontWeight: '600', color: '#1e293b' }}>
                  Map View
                </h3>
              <button 
                onClick={handleSavePlan}
                style={{
                padding: '8px 16px',
                backgroundColor: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '12px',
                cursor: 'pointer'
              }}>
                Lagre
              </button>
            </div>
            
            <div style={{
              flex: '1',
              backgroundColor: '#f1f5f9',
              border: '2px dashed #cbd5e1',
              borderRadius: '8px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '24px',
              textAlign: 'center',
              minHeight: '400px'
            }}>
              <Map className="w-16 h-16" style={{ color: '#94a3b8', marginBottom: '16px' }} />
              <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#475569', margin: '0 0 8px 0' }}>
                Interactive Map
              </h3>
              <p style={{ color: '#64748b', margin: '0 0 16px 0', fontSize: '14px' }}>
                {filteredOrders.length} delivery locations marked on map
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '12px', color: '#64748b' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '12px', height: '12px', backgroundColor: '#10b981', borderRadius: '50%' }}></div>
                  Scheduled ({filteredOrders.length})
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '12px', height: '12px', backgroundColor: '#3b82f6', borderRadius: '50%' }}></div>
                  Partners ({partners.length})
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '12px', height: '12px', backgroundColor: '#f59e0b', borderRadius: '50%' }}></div>
                  Routes ({plannedRoutes.length})
                </span>
              </div>
            </div>
          </div>

          {/* UNSCHEDULED PANEL */}
          <div 
            style={{
              position: 'absolute',
              left: `${windowLayouts.unscheduled.x}px`,
              top: `${windowLayouts.unscheduled.y}px`,
              width: `${windowLayouts.unscheduled.width}px`,
              height: `${windowLayouts.unscheduled.height}px`,
              backgroundColor: '#ffffff',
              border: editMode ? '3px solid #ef4444' : '1px solid #e2e8f0',
              borderRadius: '12px',
              padding: '12px',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              cursor: editMode ? 'move' : 'default',
              boxShadow: editMode 
                ? draggedWindow === 'unscheduled' 
                  ? '0 20px 40px rgba(239, 68, 68, 0.4), 0 0 0 1px rgba(239, 68, 68, 0.1)'
                  : '0 8px 20px rgba(239, 68, 68, 0.25), 0 0 0 1px rgba(239, 68, 68, 0.1)'
                : '0 2px 8px rgba(0,0,0,0.08)',
              transition: draggedWindow === 'unscheduled' ? 'none' : 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              transform: draggedWindow === 'unscheduled' ? 'scale(1.02)' : 'scale(1)',
              zIndex: draggedWindow === 'unscheduled' ? 1000 : editMode ? 10 : 1
            }}
            onMouseDown={(e) => handleMouseDown(e, 'unscheduled')}
          >
              {/* Resize handles */}
              {editMode && (
                <>
                  <div 
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      height: '4px',
                      cursor: 'ns-resize',
                      backgroundColor: '#ef4444',
                      opacity: 0.7
                    }}
                    onMouseDown={(e) => handleResizeStart(e, 'unscheduled', 'top')}
                  />
                  <div 
                    style={{
                      position: 'absolute',
                      bottom: 0,
                      left: 0,
                      right: 0,
                      height: '4px',
                      cursor: 'ns-resize',
                      backgroundColor: '#ef4444',
                      opacity: 0.7
                    }}
                    onMouseDown={(e) => handleResizeStart(e, 'unscheduled', 'bottom')}
                  />
                  <div 
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      bottom: 0,
                      width: '4px',
                      cursor: 'ew-resize',
                      backgroundColor: '#ef4444',
                      opacity: 0.7
                    }}
                    onMouseDown={(e) => handleResizeStart(e, 'unscheduled', 'left')}
                  />
                  <div 
                    style={{
                      position: 'absolute',
                      top: 0,
                      right: 0,
                      bottom: 0,
                      width: '4px',
                      cursor: 'ew-resize',
                      backgroundColor: '#ef4444',
                      opacity: 0.7
                    }}
                    onMouseDown={(e) => handleResizeStart(e, 'unscheduled', 'right')}
                  />
                </>
              )}
              
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '12px'
              }}>
                <h3 style={{ margin: 0, fontSize: '14px', fontWeight: '600', color: '#1e293b' }}>
                  Unscheduled ({filteredOrders.length})
                </h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button 
                onClick={handleRouting}
                style={{
                padding: '6px 12px',
                backgroundColor: '#f59e0b',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                fontSize: '11px',
                cursor: 'pointer'
              }}>
                Ruting
              </button>
              <select style={{
                fontSize: '11px',
                border: '1px solid #e2e8f0',
                borderRadius: '4px',
                padding: '4px 8px',
                backgroundColor: '#ffffff'
              }}>
                <option>Type</option>
                <option>Delivery</option>
                <option>Pickup</option>
              </select>
              <select style={{
                fontSize: '11px',
                border: '1px solid #e2e8f0',
                borderRadius: '4px',
                padding: '4px 8px',
                backgroundColor: '#ffffff'
              }}>
                <option>Depot</option>
                <option>Main Depot</option>
                <option>Secondary Depot</option>
              </select>
            </div>
          </div>
          
          <div style={{ marginBottom: '12px' }}>
            <input
              type="text"
              placeholder="Filter orders..."
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #e2e8f0',
                borderRadius: '6px',
                fontSize: '12px',
                backgroundColor: '#f8fafc'
              }}
            />
          </div>
          
          <div style={{
            flex: '1',
            overflow: 'auto',
            border: '1px solid #f1f5f9',
            borderRadius: '6px',
            backgroundColor: '#fafafa',
            maxHeight: '120px'
          }}>
            <table style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: '11px',
              fontFamily: 'Inter, system-ui, sans-serif'
            }}>
              <thead>
                <tr style={{ backgroundColor: '#f8fafc', position: 'sticky', top: 0 }}>
                  <th style={{ border: '1px solid #e2e8f0', padding: '8px', textAlign: 'left', fontWeight: '600', color: '#475569' }}>Ordre</th>
                  <th style={{ border: '1px solid #e2e8f0', padding: '8px', textAlign: 'left', fontWeight: '600', color: '#475569' }}>Bilag</th>
                  <th style={{ border: '1px solid #e2e8f0', padding: '8px', textAlign: 'left', fontWeight: '600', color: '#475569' }}>Kunde</th>
                  <th style={{ border: '1px solid #e2e8f0', padding: '8px', textAlign: 'left', fontWeight: '600', color: '#475569' }}>Tjeneste</th>
                  <th style={{ border: '1px solid #e2e8f0', padding: '8px', textAlign: 'left', fontWeight: '600', color: '#475569' }}>Adresse</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order) => (
                  <tr key={order.id} style={{ backgroundColor: '#ffffff' }}>
                    <td style={{ border: '1px solid #e2e8f0', padding: '8px' }}>{order.orderNumber || 'N/A'}</td>
                    <td style={{ border: '1px solid #e2e8f0', padding: '8px' }}>{order.documentNumber || 'N/A'}</td>
                    <td style={{ border: '1px solid #e2e8f0', padding: '8px' }}>{order.customerName || 'N/A'}</td>
                    <td style={{ border: '1px solid #e2e8f0', padding: '8px' }}>{order.service?.name || 'N/A'}</td>
                    <td style={{ border: '1px solid #e2e8f0', padding: '8px' }}>{order.customerAddress || order.address || 'N/A'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ marginTop: '12px', textAlign: 'center', fontSize: '12px', color: '#64748b' }}>
            Showing 1-{filteredOrders.length} of {filteredOrders.length} items
          </div>
        </div>
      </div>
      </div>
    );
  };

  // Normal Landing View
  return (
    <>
      {showPlanningView ? (
        renderCockpit()
      ) : (
        <div className="min-h-screen bg-gray-50 p-6">
          <div className="page-header mb-8">
            <div className="flex items-center space-x-4 mb-2">
              <div className="card-icon bg-gradient-to-br from-blue-500 to-indigo-600">
                <Navigation className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="page-title">Avansert Ruteplanleggingssystem</h1>
                <p className="page-subtitle">Profesjonell logistikkoptimalisering & flåtestyring</p>
              </div>
            </div>
            <div className="flex items-center space-x-3 mt-6">
              <button 
                onClick={() => {
                  loadOrdersFromFirestore();
                  loadFreightOrders(); // This clears any mock routes
                  loadSavedRoutes(); // Load saved routes for persistence
                  loadResources();
                  setShowPlanningView(true);
                }}
                className="btn btn-primary"
              >
                <Navigation className="w-4 h-4" />
                Åpne Cockpit
              </button>
              <button 
                onClick={handleExport}
                className="btn btn-secondary"
              >
                <Download className="w-4 h-4" />
                Eksporter Data
              </button>
              <button 
                onClick={handleRefresh}
                className="btn btn-secondary"
              >
                <RefreshCw className="w-4 h-4" />
                Oppdater
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <div className="card p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Totale Ordre</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{orders.length}</p>
                </div>
                <div className="p-3 bg-blue-100 rounded-lg">
                  <Package className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>
            <div className="card p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Planlagt</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{plannedRoutes.length}</p>
                </div>
                <div className="p-3 bg-green-100 rounded-lg">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </div>
            <div className="card p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Partnere</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{partners.length}</p>
                </div>
                <div className="p-3 bg-purple-100 rounded-lg">
                  <Truck className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </div>
            <div className="card p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Vekt</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{orders.reduce((sum, o) => sum + (o.weight || 0), 0).toFixed(0)} kg</p>
                </div>
                <div className="p-3 bg-orange-100 rounded-lg">
                  <Weight className="w-6 h-6 text-orange-600" />
                </div>
              </div>
            </div>
          </div>

          <div className="card p-12">
            <div className="text-center">
              <div className="p-6 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl w-24 h-24 mx-auto mb-6 flex items-center justify-center shadow-xl animate-pulse">
                <Navigation className="w-12 h-12 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                🚀 Transportation Cockpit
              </h2>
              <p className="text-gray-600 mb-8 max-w-2xl mx-auto text-lg">
                Profesjonelt planleggingssystem inspirert av SAP TM. Drag-and-drop leveranser mellom ruter, 
                automatisk optimalisering, kapasitetsberegning i sanntid og Gantt chart visualisering.
              </p>

              {/* Feature Grid */}
              <div className="grid grid-cols-3 gap-6 mb-10 max-w-3xl mx-auto">
                <div className="text-center">
                  <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <Package className="w-7 h-7 text-blue-600" />
                  </div>
                  <h4 className="font-semibold text-gray-900 mb-1 text-sm">Freight Units</h4>
                  <p className="text-xs text-gray-600">{freightUnits.length} leveranser klar til planlegging</p>
                </div>
                <div className="text-center">
                  <div className="w-14 h-14 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <Route className="w-7 h-7 text-green-600" />
                  </div>
                  <h4 className="font-semibold text-gray-900 mb-1 text-sm">Freight Orders</h4>
                  <p className="text-xs text-gray-600">{freightOrders.length} aktive kjørelister</p>
                </div>
                <div className="text-center">
                  <div className="w-14 h-14 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <Truck className="w-7 h-7 text-purple-600" />
                  </div>
                  <h4 className="font-semibold text-gray-900 mb-1 text-sm">Ressurser</h4>
                  <p className="text-xs text-gray-600">{resources.filter(r => r.type === 'vehicle').length} biler tilgjengelig</p>
                </div>
              </div>

              <button 
                onClick={() => {
                  loadOrdersFromFirestore();
                  loadFreightOrders(); // This clears any mock routes
                  loadSavedRoutes(); // Load saved routes for persistence
                  loadResources();
                  setShowPlanningView(true);
                }}
                className="btn btn-primary"
                style={{fontSize: '1.1rem', padding: '0.75rem 2.5rem'}}
              >
                <Navigation className="w-5 h-5" />
                Åpne Transportation Cockpit
              </button>
              
              <div className="mt-6 text-sm text-gray-500">
                💡 Tip: Dra leveranser fra venstre panel til kjørelister i midten
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Settings Modal */}
      {showSettingsModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10000
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '2rem',
            maxWidth: '600px',
            width: '90%',
            maxHeight: '80vh',
            overflow: 'auto',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
          }}>
            {/* Modal Header */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '1.5rem'
            }}>
              <h2 style={{
                fontSize: '1.5rem',
                fontWeight: '600',
                color: '#1f2937',
                margin: 0
              }}>
                ⚙️ Planleggingsinnstillinger
              </h2>
              <button
                onClick={() => setShowSettingsModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '1.5rem',
                  color: '#9ca3af',
                  cursor: 'pointer',
                  padding: '0.25rem'
                }}
              >
                ×
              </button>
            </div>

            {/* Modal Content */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {/* Layout Settings */}
              <div>
                <h3 style={{
                  fontSize: '1.125rem',
                  fontWeight: '600',
                  color: '#374151',
                  marginBottom: '1rem'
                }}>
                  Layout
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <div style={{
                    backgroundColor: '#eff6ff',
                    border: '1px solid #bfdbfe',
                    borderRadius: '8px',
                    padding: '12px',
                    marginBottom: '8px'
                  }}>
                    <div style={{ fontSize: '12px', color: '#1e40af', marginBottom: '6px', fontWeight: '600' }}>
                      💡 Redigeringsmodus
                    </div>
                    <div style={{ fontSize: '11px', color: '#475569', lineHeight: '1.5' }}>
                      Når du aktiverer redigeringsmodus kan du ikke flytte vinduer i dette systemet (de er låst). 
                      Men du kan åpne cockpit-innstillinger i fremtiden.
                    </div>
                  </div>
                  
                  <button
                    onClick={() => {
                      if (!editMode) {
                        setOriginalLayout({ ...windowLayouts });
                      }
                      setEditMode(!editMode);
                      setShowSettingsModal(false);
                    }}
                    style={{
                      padding: '0.75rem 1rem',
                      backgroundColor: editMode ? '#8b5cf6' : '#f3f4f6',
                      color: editMode ? 'white' : '#374151',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <span>{editMode ? '✓ Redigeringsmodus Aktiv' : 'Aktiver Redigeringsmodus'}</span>
                    <Settings size={16} />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm('Er du sikker på at du vil tilbakestille layouten til standard? Dette kan ikke angres.')) {
                        setWindowLayouts(defaultLayout);
                        localStorage.setItem('planningLayout', JSON.stringify(defaultLayout));
                        alert('✅ Layout tilbakestilt til standard!');
                        setShowSettingsModal(false);
                      }
                    }}
                    style={{
                      padding: '0.75rem 1rem',
                      backgroundColor: '#fee2e2',
                      color: '#991b1b',
                      border: '1px solid #fecaca',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <span>Tilbakestill Layout</span>
                    <RefreshCw size={16} />
                  </button>
                </div>
              </div>

              {/* Data Management */}
              <div>
                <h3 style={{
                  fontSize: '1.125rem',
                  fontWeight: '600',
                  color: '#374151',
                  marginBottom: '1rem'
                }}>
                  Data
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <button
                    onClick={() => {
                      handleRefresh();
                      setShowSettingsModal(false);
                    }}
                    style={{
                      padding: '0.75rem 1rem',
                      backgroundColor: '#f3f4f6',
                      color: '#374151',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}
                  >
                    <span>Oppdater Alle Data</span>
                    <RefreshCw size={16} />
                  </button>
                  <button
                    onClick={() => {
                      handleExport();
                      setShowSettingsModal(false);
                    }}
                    style={{
                      padding: '0.75rem 1rem',
                      backgroundColor: '#f3f4f6',
                      color: '#374151',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}
                  >
                    <span>Eksporter Data</span>
                    <Download size={16} />
                  </button>
                </div>
              </div>

              {/* Statistics */}
              <div>
                <h3 style={{
                  fontSize: '1.125rem',
                  fontWeight: '600',
                  color: '#374151',
                  marginBottom: '1rem'
                }}>
                  Statistikk
                </h3>
                <div style={{
                  backgroundColor: '#f9fafb',
                  borderRadius: '8px',
                  padding: '1rem',
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: '0.75rem'
                }}>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.25rem' }}>
                      Totale Ordre
                    </div>
                    <div style={{ fontSize: '1.5rem', fontWeight: '600', color: '#1f2937' }}>
                      {orders.length}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.25rem' }}>
                      Planlagte Ruter
                    </div>
                    <div style={{ fontSize: '1.5rem', fontWeight: '600', color: '#1f2937' }}>
                      {plannedRoutes.length}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.25rem' }}>
                      Partnere
                    </div>
                    <div style={{ fontSize: '1.5rem', fontWeight: '600', color: '#1f2937' }}>
                      {partners.length}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.25rem' }}>
                      Total Vekt
                    </div>
                    <div style={{ fontSize: '1.5rem', fontWeight: '600', color: '#1f2937' }}>
                      {orders.reduce((sum, o) => sum + (o.weight || 0), 0).toFixed(0)} kg
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div style={{
              marginTop: '2rem',
              paddingTop: '1rem',
              borderTop: '1px solid #e5e7eb',
              display: 'flex',
              justifyContent: 'flex-end'
            }}>
              <button
                onClick={() => setShowSettingsModal(false)}
                style={{
                  padding: '0.5rem 1.5rem',
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  fontWeight: '500'
                }}
              >
                Lukk
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
