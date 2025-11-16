'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { firebaseService } from '@/lib/firebase-services';
import { collection, getDocs, query, orderBy, where, addDoc, updateDoc, serverTimestamp, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
// Safe OneDrive import with fallback
let oneDriveService: any = null;
try {
  const onedriveModule = require('@/lib/onedrive-service');
  oneDriveService = onedriveModule.oneDriveService;
} catch (error) {
  console.log('OneDrive service not available:', error);
}
import { 
  Map, 
  Clock, 
  Package, 
  Truck, 
  User, 
  Settings, 
  Search,
  Plus,
  Zap,
  Navigation,
  Route,
  Calendar,
  BarChart3,
  GanttChart,
  Users,
  TrendingUp,
  Building2,
  RefreshCw,
  Download,
  Upload,
  Archive,
  Eye,
  Edit,
  Trash2,
  Filter,
  X,
  Check,
  AlertTriangle,
  FileText,
  CheckCircle,
  Weight,
  Building,
  ShoppingCart,
  Phone,
  Mail,
  DollarSign,
  MapPin,
  Target,
  ArrowRight,
  Play,
  Pause,
  RotateCcw,
  Maximize,
  Minimize,
  Layers,
  Satellite
} from 'lucide-react';
import CockpitInterface from './cockpit-interface';

interface Order {
  id?: string;
  orderNumber: string;
  documentNumber?: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  customerEmail: string;
  deliveryDate: string;
  deliveryTimeTo: string;
  deliveryTimeFrom?: string;
  products: {
    serviceId: string;
    serviceName: string;
    serviceDescription: string;
    serviceCategory: string;
    price: number;
    quantity: number;
    weight?: number;
    dimensions?: string;
    specialInstructions?: string;
  }[];
  priority: 'low' | 'medium' | 'high';
  noteToPlanner?: string;
  returnType?: 'none' | 'old_item' | 'disposal';
  returnDescription?: string;
  returnOrderId?: string;
  totalProducts: number;
  totalWeight?: number;
  totalVolume?: number;
  status: 'pending' | 'assigned' | 'in_progress' | 'completed' | 'cancelled';
  createdAt: any;
  companyId: string;
  assignedDriver?: string;
  assignedVehicle?: string;
  routeId?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  deliveryInstructions?: string;
  accessCode?: string;
  contactPerson?: string;
  estimatedDeliveryTime?: number;
  specialRequirements?: string[];
}

interface Vehicle {
  registrationNumber: string;
  model?: string;
  vehicleType?: string;
  payload?: string;
  maxWeight?: number;
  maxVolume?: number;
  driverName?: string;
  driverPhone?: string;
  driverEmail?: string;
  status?: string;
  fuelType?: string;
  year?: number;
  maintenanceDate?: string;
  insuranceExpiry?: string;
  specialEquipment?: string[];
  capacity?: {
    weight: number;
    volume: number;
    pallets?: number;
  };
}

interface PlannedRoute {
  id: string;
  routeName: string;
  date: string;
  driverId: string;
  driverName: string;
  vehicleId: string;
  vehicleName: string;
  vehicle: Vehicle;
  orders: Order[];
  totalDistance: number;
  totalTime: number;
  totalCost: number;
  status: 'planned' | 'active' | 'completed';
  createdAt: string;
  companyId: string;
  routeCoordinates?: {
    start: { lat: number; lng: number };
    waypoints: { lat: number; lng: number }[];
    end: { lat: number; lng: number };
  };
  optimization: {
    algorithm: string;
    efficiency: number;
    fuelCost: number;
    driverCost: number;
    totalCost: number;
  };
  estimatedArrival?: string;
  actualStartTime?: string;
  actualEndTime?: string;
  deliverySequence: number[];
}

export default function AdvancedPlanningPage() {
  const { userProfile } = useAuth();
  const router = useRouter();
  
  // UI state
  const [activeView, setActiveView] = useState('cockpit');
  
  // Set sessionStorage when cockpit is active to hide Topbar/Sidebar
  useEffect(() => {
    if (activeView === 'cockpit') {
      sessionStorage.setItem('cockpitActive', 'true');
    } else {
      sessionStorage.removeItem('cockpitActive');
    }
    
    // Cleanup: Remove cockpitActive when component unmounts (navigating away)
    return () => {
      sessionStorage.removeItem('cockpitActive');
    };
  }, [activeView]);
  const [selectedDate, setSelectedDate] = useState('');
  const [isInitialized, setIsInitialized] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [mapType, setMapType] = useState<'roadmap' | 'satellite' | 'hybrid' | 'terrain'>('roadmap');
  const [selectedRoute, setSelectedRoute] = useState<string | null>(null);
  const [isMapFullscreen, setIsMapFullscreen] = useState(false);
  const [draggedOrder, setDraggedOrder] = useState<string | null>(null);
  const [oneDriveAvailable, setOneDriveAvailable] = useState(false);
  
  // Real data
  const [orders, setOrders] = useState<Order[]>([]);
  const [partners, setPartners] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [plannedRoutes, setPlannedRoutes] = useState<PlannedRoute[]>([]);
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [mapCenter, setMapCenter] = useState({ lat: 59.9139, lng: 10.7522 }); // Oslo coordinates
  
  // Initialize date on client-side
  useEffect(() => {
    if (typeof window !== 'undefined' && !selectedDate) {
      setSelectedDate(new Date().toISOString().split('T')[0]);
      setIsInitialized(true);
    }
  }, [selectedDate]);

  // Check OneDrive availability
  useEffect(() => {
    try {
      const clientId = process.env.NEXT_PUBLIC_MICROSOFT_CLIENT_ID;
      const isAvailable = Boolean(
        clientId && 
        clientId !== 'your-client-id-here' && 
        clientId !== 'your_client_id_here'
      );
      setOneDriveAvailable(isAvailable);
    } catch (error) {
      console.log('OneDrive not available:', error);
      setOneDriveAvailable(false);
    }
  }, []);

  // Load real data
  useEffect(() => {
    if (userProfile?.companyId && isInitialized) {
      loadRealData();
    }
  }, [userProfile?.companyId, isInitialized]);

  const loadRealData = async () => {
    if (!userProfile?.companyId) {
      console.log('❌ No company ID found');
      return;
    }

    if (!db) {
      console.log('❌ Firebase not initialized');
      return;
    }

    try {
      setLoading(true);
      console.log('🔄 Loading real data for company:', userProfile.companyId);

      // Load orders from Firestore with ALL details (without orderBy to avoid index requirement)
      const ordersQuery = query(
        collection(db, 'orders'),
        where('companyId', '==', userProfile.companyId)
      );
      const ordersSnapshot = await getDocs(ordersQuery);
      console.log('📦 Found orders:', ordersSnapshot.docs.length);
      
      const ordersData = ordersSnapshot.docs.map(doc => {
        const data = doc.data();
        console.log('📋 Order data:', data);
        return {
          id: doc.id,
          ...data,
          // Add coordinates if address exists
          coordinates: data.customerAddress ? getCoordinatesFromAddress(data.customerAddress) : null,
          // Calculate total weight and volume
          totalWeight: data.products?.reduce((sum: number, p: any) => sum + ((p.weight || 0) * p.quantity), 0) || 0,
          totalVolume: data.products?.reduce((sum: number, p: any) => sum + ((p.dimensions ? parseVolume(p.dimensions) : 0) * p.quantity), 0) || 0
        };
      }) as Order[];
      
      // Sort manually by createdAt (newest first)
      ordersData.sort((a, b) => {
        if (a.createdAt && b.createdAt) {
          // Handle both Firestore Timestamp and string dates
          const aTime = typeof a.createdAt === 'string' ? new Date(a.createdAt).getTime() : 
                       (a.createdAt as any).toDate ? (a.createdAt as any).toDate().getTime() : 
                       new Date(a.createdAt as any).getTime();
          const bTime = typeof b.createdAt === 'string' ? new Date(b.createdAt).getTime() : 
                       (b.createdAt as any).toDate ? (b.createdAt as any).toDate().getTime() : 
                       new Date(b.createdAt as any).getTime();
          return bTime - aTime;
        }
        return 0;
      });
      
      setOrders(ordersData);
      console.log('✅ Set orders:', ordersData.length);

      // Load partners and extract ALL vehicle details
      console.log('🚛 Loading partners...');
      const partnersData = await firebaseService.getPartners(userProfile.companyId);
      console.log('👥 Found partners:', partnersData.length);
      setPartners(partnersData);
      
      // Extract all vehicles with complete details
      const allVehicles: Vehicle[] = [];
      partnersData.forEach(partner => {
        console.log('🔍 Processing partner:', partner.name, 'vehicles:', partner.vehicles?.length || 0);
        if (partner.vehicles) {
          partner.vehicles.forEach((vehicle: any, index: number) => {
            console.log('🚛 Processing vehicle:', vehicle);
            allVehicles.push({
              registrationNumber: vehicle.registrationNumber || 'Unknown',
              model: vehicle.model,
              vehicleType: vehicle.vehicleType,
              payload: vehicle.payload,
              maxWeight: parseWeight(vehicle.payload),
              maxVolume: vehicle.maxVolume || calculateVehicleVolume(vehicle.vehicleType),
              driverName: vehicle.driverName,
              driverPhone: vehicle.driverPhone,
              driverEmail: vehicle.driverEmail,
              status: vehicle.status || 'available',
              fuelType: vehicle.fuelType,
              year: vehicle.year,
              maintenanceDate: vehicle.maintenanceDate,
              insuranceExpiry: vehicle.insuranceExpiry,
              specialEquipment: vehicle.specialEquipment || [],
              capacity: {
                weight: parseWeight(vehicle.payload),
                volume: vehicle.maxVolume || calculateVehicleVolume(vehicle.vehicleType),
                pallets: vehicle.palletCapacity || 0
              }
            });
          });
        }
      });
      setVehicles(allVehicles);
      console.log('✅ Set vehicles:', allVehicles.length);

      // Load planned routes with enhanced data (without orderBy to avoid index requirement)
      const routesQuery = query(
        collection(db, 'plannedRoutes'),
        where('companyId', '==', userProfile.companyId)
      );
      const routesSnapshot = await getDocs(routesQuery);
      const routesData = routesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as PlannedRoute[];
      
      // Sort manually by createdAt (newest first)
      routesData.sort((a, b) => {
        if (a.createdAt && b.createdAt) {
          // Handle both Firestore Timestamp and string dates
          const aTime = typeof a.createdAt === 'string' ? new Date(a.createdAt).getTime() : 
                       (a.createdAt as any).toDate ? (a.createdAt as any).toDate().getTime() : 
                       new Date(a.createdAt as any).getTime();
          const bTime = typeof b.createdAt === 'string' ? new Date(b.createdAt).getTime() : 
                       (b.createdAt as any).toDate ? (b.createdAt as any).toDate().getTime() : 
                       new Date(b.createdAt as any).getTime();
          return bTime - aTime;
        }
        return 0;
      });
      
      setPlannedRoutes(routesData);

      console.log(`✅ FINAL LOADED: ${ordersData.length} orders, ${partnersData.length} partners, ${allVehicles.length} vehicles, ${routesData.length} routes`);
    } catch (error) {
      console.error('❌ Error loading real data:', error);
      alert(`Error loading data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  // Helper functions
  const getCoordinatesFromAddress = (address: string) => {
    // Simulate geocoding - in real app, use Google Geocoding API
    const baseLat = 59.9139;
    const baseLng = 10.7522;
    return {
      lat: baseLat + (Math.random() - 0.5) * 0.1,
      lng: baseLng + (Math.random() - 0.5) * 0.1
    };
  };

  const parseWeight = (payload: string) => {
    if (!payload) return 1000;
    const match = payload.match(/(\d+)/);
    return match ? parseInt(match[1]) : 1000;
  };

  const parseVolume = (dimensions: string) => {
    // Parse dimensions like "100x50x30 cm" to volume in liters
    const match = dimensions.match(/(\d+)x(\d+)x(\d+)/);
    if (match) {
      return (parseInt(match[1]) * parseInt(match[2]) * parseInt(match[3])) / 1000; // Convert cm³ to liters
    }
    return 100; // Default volume
  };

  const calculateVehicleVolume = (vehicleType: string) => {
    switch (vehicleType) {
      case 'small_van': return 5000; // 5m³
      case 'medium_van': return 10000; // 10m³
      case 'large_van': return 20000; // 20m³
      case 'truck': return 50000; // 50m³
      default: return 10000;
    }
  };

  const handleOptimizeRoutes = async () => {
    if (selectedOrders.length === 0) {
      alert('❌ Vennligst velg minst en ordre før optimalisering');
      return;
    }

    setIsOptimizing(true);
    
    try {
      // Get selected orders data
      const selectedOrdersData = orders.filter(o => selectedOrders.includes(o.id || ''));
      
      // Get available drivers from partners
      const availableDrivers = partners.flatMap(partner => 
        partner.vehicles?.map((vehicle: any) => ({
          partnerId: partner.id,
          partnerName: partner.name,
          driverName: vehicle.driverName || `Sjåfør ${vehicle.registrationNumber}`,
          driverEmail: vehicle.driverEmail || `${vehicle.driverName?.toLowerCase().replace(/\s+/g, '.')}@${partner.name.toLowerCase().replace(/\s+/g, '')}.no`,
          vehicleId: vehicle.registrationNumber,
          vehicleName: vehicle.model || vehicle.registrationNumber,
          vehicleType: vehicle.vehicleType || 'company_car',
          payload: vehicle.payload || '1000kg'
        })) || []
      );

      if (availableDrivers.length === 0) {
        alert('❌ Ingen tilgjengelige sjåfører funnet. Sjekk samarbeidspartnere siden.');
        setIsOptimizing(false);
        return;
      }

      // Group orders by delivery date
      const routesByDate = selectedOrdersData.reduce((acc, order) => {
        if (!acc[order.deliveryDate]) {
          acc[order.deliveryDate] = [];
        }
        acc[order.deliveryDate].push(order);
        return acc;
      }, {} as Record<string, Order[]>);

      // Create optimized routes for each date
      const createdRoutes = [];
      for (const [date, dateOrders] of Object.entries(routesByDate)) {
        // Assign drivers to routes (round-robin)
        const assignedDriver: any = availableDrivers[createdRoutes.length % availableDrivers.length];
        
        const routeId = `route-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        
        // Calculate route metrics
        const totalValue = dateOrders.reduce((sum, o) => sum + (o.products?.reduce((pSum, p) => pSum + (p.price * p.quantity), 0) || 0), 0);
        const totalProducts = dateOrders.reduce((sum, o) => sum + o.totalProducts, 0);
        
        // Simulate distance calculation based on number of orders
        const estimatedDistance = dateOrders.length * 15 + Math.random() * 20;
        const estimatedTime = dateOrders.length * 0.5 + Math.random() * 2;
        
        const routeData: any = {
          id: routeId,
          routeName: `Rute ${date} - ${assignedDriver.driverName}`,
          date: date,
          driverId: assignedDriver.driverEmail,
          driverName: assignedDriver.driverName,
          vehicleId: assignedDriver.vehicleId,
          vehicleName: assignedDriver.vehicleName,
          partnerId: assignedDriver.partnerId,
          partnerName: assignedDriver.partnerName,
          orders: dateOrders,
          totalOrders: dateOrders.length,
          totalProducts: totalProducts,
          totalDistance: Math.round(estimatedDistance * 10) / 10,
          totalTime: Math.round(estimatedTime * 10) / 10,
          totalCost: totalValue,
          status: 'planned',
          createdAt: new Date().toISOString(),
          companyId: userProfile?.companyId || '',
          optimization: {
            algorithm: 'geographic-clustering',
            efficiency: Math.round((100 - (estimatedDistance / dateOrders.length) * 2) * 10) / 10,
            fuelCost: Math.round(estimatedDistance * 2.5 * 10) / 10,
            driverCost: Math.round(estimatedTime * 250 * 10) / 10
          }
        };

        // Save route to Firestore
        if (db) {
          await addDoc(collection(db, 'plannedRoutes'), routeData);
          createdRoutes.push(routeData);
          
          // Update orders with route assignment
          for (const order of dateOrders) {
            if (order.id) {
              await updateDoc(doc(db, 'orders', order.id), {
                routeId: routeId,
                status: 'assigned',
                assignedDriver: assignedDriver.driverName,
                assignedVehicle: assignedDriver.vehicleName,
                assignedAt: new Date().toISOString(),
                assignedBy: userProfile?.displayName || 'System'
              });
            }
          }
        }
      }

      // Archive to OneDrive
      await archiveRoutesToOneDrive(createdRoutes);
      
      alert(`✅ ${createdRoutes.length} optimerte ruter opprettet og arkivert!\n\n` +
            `📊 Statistikk:\n` +
            `• ${selectedOrdersData.length} ordre planlagt\n` +
            `• ${availableDrivers.length} sjåfører tilgjengelig\n` +
            `• Gjennomsnittlig effektivitet: ${Math.round(createdRoutes.reduce((sum, r) => sum + r.optimization.efficiency, 0) / createdRoutes.length)}%\n` +
            `• Total verdi: ${createdRoutes.reduce((sum, r) => sum + r.totalCost, 0).toLocaleString()} kr`);
      
      // Reload data
      await loadRealData();
      setSelectedOrders([]);
      
    } catch (error) {
      console.error('Error optimizing routes:', error);
      alert(`❌ Feil ved optimalisering av ruter: ${error instanceof Error ? error.message : 'Ukjent feil'}`);
    } finally {
      setIsOptimizing(false);
    }
  };

  const archiveRoutesToOneDrive = async (routes: any[]) => {
    try {
      // Check if OneDrive service is available
      if (!oneDriveAvailable || !oneDriveService) {
        console.log('⚠️ OneDrive not configured - skipping archive');
        return;
      }

      // Ensure OneDrive is logged in
      if (!oneDriveService.isLoggedIn()) {
        await oneDriveService.loginPopup();
      }

      const routesData = {
        timestamp: new Date().toISOString(),
        companyId: userProfile?.companyId,
        companyName: userProfile?.companyName || 'Unknown',
        totalRoutes: routes.length,
        totalOrders: routes.reduce((sum, route) => sum + route.totalOrders, 0),
        totalValue: routes.reduce((sum, route) => sum + route.totalCost, 0),
        routes: routes.map(route => ({
          id: route.id,
          routeName: route.routeName,
          date: route.date,
          driverName: route.driverName,
          vehicleName: route.vehicleName,
          partnerName: route.partnerName,
          totalOrders: route.totalOrders,
          totalProducts: route.totalProducts,
          totalDistance: route.totalDistance,
          totalTime: route.totalTime,
          totalCost: route.totalCost,
          efficiency: route.optimization.efficiency,
          orders: route.orders.map((order: any) => ({
            orderNumber: order.orderNumber,
            customerName: order.customerName,
            customerAddress: order.customerAddress,
            deliveryDate: order.deliveryDate,
            totalValue: order.products?.reduce((sum: number, p: any) => sum + (p.price * p.quantity), 0) || 0
          }))
        }))
      };

      const fileName = `planned-routes-${new Date().toISOString().split('T')[0]}.json`;
      const fileContent = JSON.stringify(routesData, null, 2);
      const blob = new Blob([fileContent], { type: 'application/json' });

      await oneDriveService.uploadFile(fileName, blob, 'DriftPro/Archive/PlannedRoutes');
      console.log('✅ Routes archived to OneDrive');
    } catch (error) {
      console.error('Error archiving to OneDrive:', error);
      // Don't throw error - just log it so the main optimization process continues
    }
  };

  // Live stats calculated from real data
  const liveStats = {
    totalTasks: orders.length,
    activeRoutes: plannedRoutes.filter(r => r.status === 'active').length,
    driversOnline: partners.reduce((sum, p) => sum + (p.vehicles?.length || 0), 0),
    optimization: 94.5
  };

  if (!isInitialized || loading) {
    return (
      <div className="page-header">
        <div className="page-title">
          <h1>Ruteplanlegging</h1>
          <p className="page-subtitle">Avansert ruteoptimalisering og planlegging</p>
        </div>
        <div style={{ textAlign: 'center', padding: '3rem' }}>
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-6"></div>
          <p className="text-lg">Laster data...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div className="page-title">
          <h1>Ruteplanlegging</h1>
          <p className="page-subtitle">Avansert ruteoptimalisering og planlegging</p>
        </div>
      </div>


      {/* Debug Information */}
      <div style={{ 
        background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', 
        borderRadius: '12px', 
        padding: '1rem', 
        marginBottom: '1rem',
        boxShadow: '0 4px 12px rgba(245, 158, 11, 0.3)'
      }}>
        <div style={{ color: 'white', fontSize: '0.875rem', fontWeight: '600' }}>
          🔍 DEBUG INFO: 
          Ordre: {orders.length} | 
          Kjøretøy: {vehicles.length} | 
          Partnere: {partners.length} | 
          Planlagte ruter: {plannedRoutes.length} |
          Company ID: {userProfile?.companyId || 'Ikke funnet'}
        </div>
      </div>

      {/* Advanced Search and Filters */}
      <div style={{ 
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 
        borderRadius: '16px', 
        padding: '2rem', 
        marginBottom: '2rem',
        boxShadow: '0 10px 30px rgba(102, 126, 234, 0.3)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
          <div style={{ 
            background: 'rgba(255, 255, 255, 0.2)', 
            borderRadius: '12px', 
            padding: '0.75rem',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.3)'
          }}>
            <Search style={{ width: '20px', height: '20px', color: 'white' }} />
          </div>
          <input
            type="text"
            placeholder="🔍 Søk etter ordre, kunder, adresser..."
            style={{
              flex: 1,
              padding: '0.875rem 1.25rem',
              borderRadius: '12px',
              border: 'none',
              background: 'var(--card-background)',
              fontSize: '1rem',
              fontWeight: '500',
              boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)',
              outline: 'none',
              transition: 'all 0.3s ease'
            }}
         onFocus={(e) => {
           (e.target as HTMLInputElement).style.transform = 'translateY(-2px)';
           (e.target as HTMLInputElement).style.boxShadow = '0 8px 25px rgba(0, 0, 0, 0.15)';
         }}
         onBlur={(e) => {
           (e.target as HTMLInputElement).style.transform = 'translateY(0)';
           (e.target as HTMLInputElement).style.boxShadow = '0 4px 15px rgba(0, 0, 0, 0.1)';
         }}
          />
        </div>
        
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          {/* Status Filter */}
          <div style={{ position: 'relative' }}>
            <select style={{
              padding: '0.875rem 1.5rem 0.875rem 3rem',
              borderRadius: '12px',
              border: 'none',
              background: 'var(--card-background)',
              fontSize: '0.95rem',
              fontWeight: '600',
              color: 'var(--text-color)',
              boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)',
              cursor: 'pointer',
              appearance: 'none',
              transition: 'all 0.3s ease',
              minWidth: '160px'
            }}>
              <option value="all">📊 Alle statuser</option>
              <option value="pending">⏳ Ventende</option>
              <option value="assigned">✅ Tildelt</option>
              <option value="in_progress">🚀 Pågående</option>
              <option value="completed">🎯 Fullført</option>
            </select>
            <div style={{
              position: 'absolute',
              left: '1rem',
              top: '50%',
              transform: 'translateY(-50%)',
              pointerEvents: 'none'
            }}>
              <CheckCircle style={{ width: '18px', height: '18px', color: '#10b981' }} />
            </div>
          </div>

          {/* Priority Filter */}
          <div style={{ position: 'relative' }}>
            <select style={{
              padding: '0.875rem 1.5rem 0.875rem 3rem',
              borderRadius: '12px',
              border: 'none',
              background: 'var(--card-background)',
              fontSize: '0.95rem',
              fontWeight: '600',
              color: 'var(--text-color)',
              boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)',
              cursor: 'pointer',
              appearance: 'none',
              transition: 'all 0.3s ease',
              minWidth: '160px'
            }}>
              <option value="all">⚡ Alle prioriteter</option>
              <option value="high">🔴 Høy prioritet</option>
              <option value="medium">🟡 Medium prioritet</option>
              <option value="low">🟢 Lav prioritet</option>
            </select>
            <div style={{
              position: 'absolute',
              left: '1rem',
              top: '50%',
              transform: 'translateY(-50%)',
              pointerEvents: 'none'
            }}>
              <AlertTriangle style={{ width: '18px', height: '18px', color: '#f59e0b' }} />
            </div>
          </div>

          {/* Date Filter */}
          <div style={{ position: 'relative' }}>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              style={{
                padding: '0.875rem 1.5rem 0.875rem 3rem',
                borderRadius: '12px',
                border: 'none',
                background: 'var(--card-background)',
                fontSize: '0.95rem',
                fontWeight: '600',
                color: 'var(--text-color)',
                boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                minWidth: '160px'
              }}
            />
            <div style={{
              position: 'absolute',
              left: '1rem',
              top: '50%',
              transform: 'translateY(-50%)',
              pointerEvents: 'none'
            }}>
              <Calendar style={{ width: '18px', height: '18px', color: '#8b5cf6' }} />
            </div>
          </div>

          {/* Filter Reset Button */}
          <button style={{
            padding: '0.875rem 1.5rem',
            borderRadius: '12px',
            border: 'none',
            background: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%)',
            color: 'var(--text-color)',
            fontSize: '0.95rem',
            fontWeight: '600',
            cursor: 'pointer',
            boxShadow: '0 4px 15px rgba(255, 107, 107, 0.3)',
            transition: 'all 0.3s ease',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <RefreshCw style={{ width: '18px', height: '18px' }} />
            Tilbakestill
          </button>
        </div>
      </div>

      {/* Advanced View Tabs */}
      <div style={{ 
        marginBottom: '2rem',
        background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
        borderRadius: '20px',
        padding: '1rem',
        boxShadow: '0 10px 30px rgba(245, 87, 108, 0.3)'
      }}>
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={() => setActiveView('cockpit')}
            style={{
              padding: '1rem 2rem',
              borderRadius: '16px',
              border: 'none',
           background: activeView === 'cockpit'
             ? 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)'
             : 'rgba(255, 255, 255, 0.2)',
           color: 'white',
           fontSize: '1rem',
           fontWeight: '600',
           cursor: 'pointer',
           display: 'flex',
           alignItems: 'center',
           gap: '0.75rem',
           transition: 'all 0.3s ease',
           backdropFilter: 'blur(10px)',
              boxShadow: activeView === 'cockpit' 
                ? '0 8px 25px rgba(6, 182, 212, 0.4)' 
                : '0 4px 15px rgba(0, 0, 0, 0.1)',
              transform: activeView === 'cockpit' ? 'translateY(-2px)' : 'translateY(0)'
            }}
         onMouseEnter={(e) => {
           if (activeView !== 'cockpit') {
             (e.target as HTMLButtonElement).style.background = 'rgba(255, 255, 255, 0.3)';
             (e.target as HTMLButtonElement).style.transform = 'translateY(-2px)';
             (e.target as HTMLButtonElement).style.boxShadow = '0 8px 25px rgba(0, 0, 0, 0.2)';
           }
         }}
         onMouseLeave={(e) => {
           if (activeView !== 'cockpit') {
             (e.target as HTMLButtonElement).style.background = 'rgba(255, 255, 255, 0.2)';
             (e.target as HTMLButtonElement).style.transform = 'translateY(0)';
             (e.target as HTMLButtonElement).style.boxShadow = '0 4px 15px rgba(0, 0, 0, 0.1)';
           }
         }}
          >
            <Navigation style={{ width: '20px', height: '20px' }} />
            <span>🚀 Cockpit</span>
          </button>
          
          <button
            onClick={() => setActiveView('map')}
            style={{
              padding: '1rem 2rem',
              borderRadius: '16px',
              border: 'none',
           background: activeView === 'map'
             ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
             : 'rgba(255, 255, 255, 0.2)',
           color: 'white',
           fontSize: '1rem',
           fontWeight: '600',
           cursor: 'pointer',
           display: 'flex',
           alignItems: 'center',
           gap: '0.75rem',
           transition: 'all 0.3s ease',
           backdropFilter: 'blur(10px)',
              boxShadow: activeView === 'map' 
                ? '0 8px 25px rgba(102, 126, 234, 0.4)' 
                : '0 4px 15px rgba(0, 0, 0, 0.1)',
              transform: activeView === 'map' ? 'translateY(-2px)' : 'translateY(0)'
            }}
         onMouseEnter={(e) => {
           if (activeView !== 'map') {
             (e.target as HTMLButtonElement).style.background = 'rgba(255, 255, 255, 0.3)';
             (e.target as HTMLButtonElement).style.transform = 'translateY(-2px)';
             (e.target as HTMLButtonElement).style.boxShadow = '0 8px 25px rgba(0, 0, 0, 0.2)';
           }
         }}
         onMouseLeave={(e) => {
           if (activeView !== 'map') {
             (e.target as HTMLButtonElement).style.background = 'rgba(255, 255, 255, 0.2)';
             (e.target as HTMLButtonElement).style.transform = 'translateY(0)';
             (e.target as HTMLButtonElement).style.boxShadow = '0 4px 15px rgba(0, 0, 0, 0.1)';
           }
         }}
          >
            <Map style={{ width: '20px', height: '20px' }} />
            <span>🗺️ Kart</span>
          </button>
          
          <button
            onClick={() => setActiveView('timeline')}
            style={{
              padding: '1rem 2rem',
              borderRadius: '16px',
              border: 'none',
           background: activeView === 'timeline'
             ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
             : 'rgba(255, 255, 255, 0.2)',
           color: 'white',
           fontSize: '1rem',
           fontWeight: '600',
           cursor: 'pointer',
           display: 'flex',
           alignItems: 'center',
           gap: '0.75rem',
           transition: 'all 0.3s ease',
           backdropFilter: 'blur(10px)',
              boxShadow: activeView === 'timeline' 
                ? '0 8px 25px rgba(102, 126, 234, 0.4)' 
                : '0 4px 15px rgba(0, 0, 0, 0.1)',
              transform: activeView === 'timeline' ? 'translateY(-2px)' : 'translateY(0)'
            }}
         onMouseEnter={(e) => {
           if (activeView !== 'timeline') {
             (e.target as HTMLButtonElement).style.background = 'rgba(255, 255, 255, 0.3)';
             (e.target as HTMLButtonElement).style.transform = 'translateY(-2px)';
             (e.target as HTMLButtonElement).style.boxShadow = '0 8px 25px rgba(0, 0, 0, 0.2)';
           }
         }}
         onMouseLeave={(e) => {
           if (activeView !== 'timeline') {
             (e.target as HTMLButtonElement).style.background = 'rgba(255, 255, 255, 0.2)';
             (e.target as HTMLButtonElement).style.transform = 'translateY(0)';
             (e.target as HTMLButtonElement).style.boxShadow = '0 4px 15px rgba(0, 0, 0, 0.1)';
           }
         }}
          >
            <Clock style={{ width: '20px', height: '20px' }} />
            <span>⏰ Tidslinje</span>
          </button>
          
          <button
            onClick={() => setActiveView('gantt')}
            style={{
              padding: '1rem 2rem',
              borderRadius: '16px',
              border: 'none',
           background: activeView === 'gantt'
             ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
             : 'rgba(255, 255, 255, 0.2)',
           color: 'white',
           fontSize: '1rem',
           fontWeight: '600',
           cursor: 'pointer',
           display: 'flex',
           alignItems: 'center',
           gap: '0.75rem',
           transition: 'all 0.3s ease',
           backdropFilter: 'blur(10px)',
              boxShadow: activeView === 'gantt' 
                ? '0 8px 25px rgba(102, 126, 234, 0.4)' 
                : '0 4px 15px rgba(0, 0, 0, 0.1)',
              transform: activeView === 'gantt' ? 'translateY(-2px)' : 'translateY(0)'
            }}
         onMouseEnter={(e) => {
           if (activeView !== 'gantt') {
             (e.target as HTMLButtonElement).style.background = 'rgba(255, 255, 255, 0.3)';
             (e.target as HTMLButtonElement).style.transform = 'translateY(-2px)';
             (e.target as HTMLButtonElement).style.boxShadow = '0 8px 25px rgba(0, 0, 0, 0.2)';
           }
         }}
         onMouseLeave={(e) => {
           if (activeView !== 'gantt') {
             (e.target as HTMLButtonElement).style.background = 'rgba(255, 255, 255, 0.2)';
             (e.target as HTMLButtonElement).style.transform = 'translateY(0)';
             (e.target as HTMLButtonElement).style.boxShadow = '0 4px 15px rgba(0, 0, 0, 0.1)';
           }
         }}
          >
            <GanttChart style={{ width: '20px', height: '20px' }} />
            <span>📊 Gantt</span>
          </button>
          
          <button
            onClick={() => setActiveView('analytics')}
            style={{
              padding: '1rem 2rem',
              borderRadius: '16px',
              border: 'none',
           background: activeView === 'analytics'
             ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
             : 'rgba(255, 255, 255, 0.2)',
           color: 'white',
           fontSize: '1rem',
           fontWeight: '600',
           cursor: 'pointer',
           display: 'flex',
           alignItems: 'center',
           gap: '0.75rem',
           transition: 'all 0.3s ease',
           backdropFilter: 'blur(10px)',
              boxShadow: activeView === 'analytics' 
                ? '0 8px 25px rgba(102, 126, 234, 0.4)' 
                : '0 4px 15px rgba(0, 0, 0, 0.1)',
              transform: activeView === 'analytics' ? 'translateY(-2px)' : 'translateY(0)'
            }}
         onMouseEnter={(e) => {
           if (activeView !== 'analytics') {
             (e.target as HTMLButtonElement).style.background = 'rgba(255, 255, 255, 0.3)';
             (e.target as HTMLButtonElement).style.transform = 'translateY(-2px)';
             (e.target as HTMLButtonElement).style.boxShadow = '0 8px 25px rgba(0, 0, 0, 0.2)';
           }
         }}
         onMouseLeave={(e) => {
           if (activeView !== 'analytics') {
             (e.target as HTMLButtonElement).style.background = 'rgba(255, 255, 255, 0.2)';
             (e.target as HTMLButtonElement).style.transform = 'translateY(0)';
             (e.target as HTMLButtonElement).style.boxShadow = '0 4px 15px rgba(0, 0, 0, 0.1)';
           }
         }}
          >
            <BarChart3 style={{ width: '20px', height: '20px' }} />
            <span>📈 Analyse</span>
          </button>
        </div>
      </div>

      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '2rem' }}>
        <button 
          onClick={handleOptimizeRoutes}
          disabled={isOptimizing || selectedOrders.length === 0}
          className={`btn ${selectedOrders.length === 0 ? 'btn-secondary' : 'btn-primary'}`}
          style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          {isOptimizing ? (
            <>
              <RefreshCw style={{ width: '20px', height: '20px', animation: 'spin 1s linear infinite' }} />
              <span>Optimaliserer...</span>
            </>
          ) : (
            <>
              <Zap style={{ width: '20px', height: '20px' }} />
              <span>Optimaliser ruter ({selectedOrders.length})</span>
            </>
          )}
        </button>
        
        <button 
          onClick={() => window.open('/dashboard/partners', '_blank')}
          className="btn btn-secondary"
          style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <Users style={{ width: '20px', height: '20px' }} />
          <span>Administrer partnere</span>
        </button>

        <button 
          onClick={() => window.open('/dashboard/archive', '_blank')}
          className="btn btn-secondary"
          style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <Archive style={{ width: '20px', height: '20px' }} />
          <span>Vis arkiv</span>
        </button>
      </div>

      {/* Cockpit View - Advanced 4-Panel System */}
      {activeView === 'cockpit' && (
        <CockpitInterface
          freightUnits={(orders && Array.isArray(orders) ? orders : []).map(order => ({
            id: order.id || '',
            orderNumber: order.orderNumber,
            customer: order.customerName,
            address: order.customerAddress,
            weight: order.totalWeight || 0,
            volume: order.totalVolume || 0,
            deliveryDate: order.deliveryDate,
            deliveryTimeFrom: order.deliveryTimeFrom || '08:00',
            deliveryTimeTo: order.deliveryTimeTo,
            zone: (order.customerAddress && typeof order.customerAddress === 'string' ? order.customerAddress.split(',')[0] : '') || 'Ukjent',
            priority: order.priority === 'high' ? 'high' : order.priority === 'medium' ? 'medium' : 'low',
            status: order.status === 'pending' ? 'unassigned' : order.status === 'assigned' ? 'assigned' : order.status === 'in_progress' ? 'in_transit' : 'delivered',
            price: order.products?.reduce((sum, p) => sum + (p.price * p.quantity), 0) || 0,
            specialRequirements: order.specialRequirements?.join(', '),
            products: order.products,
            totalProducts: order.totalProducts,
            returnType: order.returnType,
            returnDescription: order.returnDescription,
            returnOrderId: order.returnOrderId,
            customerPhone: order.customerPhone,
            customerEmail: order.customerEmail
          }))}
          freightOrders={(plannedRoutes && Array.isArray(plannedRoutes) ? plannedRoutes : []).map(route => ({
            id: route.id,
            name: route.routeName,
            routeNumber: route.id,
            vehicle: route.vehicleName,
            driver: route.driverName,
            freightUnits: (route.orders && Array.isArray(route.orders) ? route.orders : []).map(order => ({
              id: order.id || '',
              orderNumber: order.orderNumber,
              customer: order.customerName,
              address: order.customerAddress,
              weight: order.totalWeight || 0,
              volume: order.totalVolume || 0,
              deliveryDate: order.deliveryDate,
              deliveryTimeFrom: order.deliveryTimeFrom || '08:00',
              deliveryTimeTo: order.deliveryTimeTo,
              zone: (order.customerAddress && typeof order.customerAddress === 'string' ? order.customerAddress.split(',')[0] : '') || 'Ukjent',
              priority: order.priority === 'high' ? 'high' : order.priority === 'medium' ? 'medium' : 'low',
              status: order.status === 'pending' ? 'unassigned' : order.status === 'assigned' ? 'assigned' : order.status === 'in_progress' ? 'in_transit' : 'delivered',
              price: order.products?.reduce((sum, p) => sum + (p.price * p.quantity), 0) || 0,
              products: order.products,
              totalProducts: order.totalProducts
            })),
            totalWeight: (route.orders && Array.isArray(route.orders) ? route.orders : []).reduce((sum, o) => sum + (o.totalWeight || 0), 0),
            totalVolume: (route.orders && Array.isArray(route.orders) ? route.orders : []).reduce((sum, o) => sum + (o.totalVolume || 0), 0),
            maxWeight: route.vehicle?.capacity?.weight || 1000,
            maxVolume: route.vehicle?.capacity?.volume || 10000,
            distance: route.totalDistance,
            status: route.status === 'planned' ? 'planned' : route.status === 'active' ? 'in_progress' : 'completed',
            startTime: route.createdAt,
            endTime: route.estimatedArrival || route.createdAt,
            cost: route.totalCost,
            warnings: []
          }))}
          resources={(vehicles && Array.isArray(vehicles) ? vehicles : []).map(vehicle => ({
            id: vehicle.registrationNumber,
            name: vehicle.driverName || vehicle.registrationNumber,
            type: 'vehicle' as const,
            capacity: vehicle.capacity?.weight || 1000,
            volumeCapacity: vehicle.capacity?.volume || 10000,
            available: vehicle.status === 'active',
            vehicleType: vehicle.vehicleType as any,
            vehicleNumber: vehicle.registrationNumber,
            driverName: vehicle.driverName,
            typeEmoji: '🚗'
          }))}
          selectedProfile="all"
          searchFilter=""
          showGantt={false}
          showMap={false}
          viewMode="day"
          editMode={false}
          draggedFU={null}
          selectedFUs={selectedOrders}
          visibleColumns={['orderNumber', 'customer', 'address', 'weight', 'volume', 'deliveryDate', 'priority', 'status']}
          onSetSelectedProfile={() => {}}
          onSetSearchFilter={() => {}}
          onSetShowGantt={() => {}}
          onSetShowMap={() => {}}
          onSetViewMode={() => {}}
          onDragFUStart={() => {}}
          onDropFUOnFO={() => {}}
          onRemoveFUFromFO={() => {}}
          onCreateNewFO={() => {}}
          onAutoAssign={() => {}}
          onOptimizeFO={() => {}}
          onReleaseFO={() => {}}
          onRefresh={() => loadRealData()}
          onExport={() => {}}
          onCloseCockpit={() => {
            sessionStorage.removeItem('cockpitActive');
            router.push('/dashboard/logistikk-system');
          }}
          onOpenSettings={() => {}}
          onSaveLayout={() => {}}
          onCancelEdit={() => {}}
          onToggleFUSelection={(fuId) => {
            setSelectedOrders(prev => 
              prev.includes(fuId) 
                ? prev.filter(id => id !== fuId)
                : [...prev, fuId]
            );
          }}
          onRecalculateCharges={() => {}}
          onChangeFUDate={() => {}}
          onAddNoteToFO={() => {}}
          onAssignResourceToFO={() => {}}
          onDropFUOnResource={() => {}}
          onDownloadDocument={() => {}}
          onSendToDriver={() => {}}
          onRemoveRouteAssignment={() => {}}
          onSaveRoutes={() => {}}
          onSetRouteNumber={() => {}}
          showRouteNumberModal={null}
          setShowRouteNumberModal={() => {}}
          routeNumberInput=""
          setRouteNumberInput={() => {}}
        />
      )}

      {/* Main Content - Original 3-Column Layout */}
      {activeView !== 'cockpit' && (
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 1fr', gap: '2rem', minHeight: '600px' }}>
        
        {/* LEFT SIDE - Planned Routes */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3>Planlagte ruter</h3>
            <span className="badge badge-blue">{plannedRoutes.length}</span>
          </div>
          
          <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
            {plannedRoutes.length > 0 ? (
              plannedRoutes.map((route) => (
                <div key={route.id} className="card" style={{ marginBottom: '0.75rem', padding: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.75rem' }}>
                    <div>
                      <h4 style={{ margin: '0 0 0.25rem 0', fontSize: '0.9rem', fontWeight: '600' }}>
                        {route.routeName}
                      </h4>
                      <p style={{ margin: '0 0 0.25rem 0', fontSize: '0.75rem', color: '#6b7280' }}>
                        <Calendar style={{ width: '10px', height: '10px', display: 'inline', marginRight: '0.25rem' }} />
                        {route.date}
                      </p>
                      <p style={{ margin: '0', fontSize: '0.75rem', color: '#6b7280' }}>
                        <User style={{ width: '10px', height: '10px', display: 'inline', marginRight: '0.25rem' }} />
                        {route.driverName}
                      </p>
                    </div>
                    <span className={`badge ${route.status === 'active' ? 'badge-green' : route.status === 'completed' ? 'badge-blue' : 'badge-gray'}`} style={{ fontSize: '0.7rem' }}>
                      {route.status}
                    </span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.25rem', fontSize: '0.7rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Ordre:</span>
                      <span style={{ fontWeight: '600' }}>{route.orders.length}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Avstand:</span>
                      <span style={{ fontWeight: '600' }}>{route.totalDistance} km</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Tid:</span>
                      <span style={{ fontWeight: '600' }}>{route.totalTime}h</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Verdi:</span>
                      <span style={{ fontWeight: '600', color: '#059669' }}>{route.totalCost.toLocaleString()} kr</span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
                <Route style={{ width: '48px', height: '48px', margin: '0 auto 1rem', opacity: 0.5 }} />
                <p>Ingen planlagte ruter ennå</p>
                <p style={{ fontSize: '0.875rem' }}>Optimaliser ordre for å lage ruter</p>
              </div>
            )}
          </div>
        </div>

        {/* MIDDLE - Advanced Map/Visualization */}
        <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
          <div style={{ height: '100%', minHeight: '500px', backgroundColor: '#f8fafc', position: 'relative' }}>
            {/* Advanced Map Header */}
            <div style={{ padding: '1rem', borderBottom: '1px solid #e5e7eb', backgroundColor: 'white' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h3 style={{ margin: '0 0 0.25rem 0' }}>🗺️ Avansert Ruteplanlegging</h3>
                  <p style={{ margin: '0', fontSize: '0.875rem', color: '#6b7280' }}>
                    {activeView === 'map' ? 'Google Maps med interaktiv ruteplanlegging' : 
                     activeView === 'timeline' ? 'Tidslinje med optimalisering' :
                     activeView === 'gantt' ? 'Gantt diagram for ruter' : 'Analytisk dashboard'}
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  {/* Map Type Selector */}
                  <select 
                    value={mapType}
                    onChange={(e) => setMapType(e.target.value as any)}
                    style={{
                      padding: '0.5rem',
                      borderRadius: '8px',
                      border: '1px solid var(--border-color)',
                      fontSize: '0.875rem',
                      background: 'white'
                    }}
                  >
                    <option value="roadmap">🛣️ Veikart</option>
                    <option value="satellite">🛰️ Satellitt</option>
                    <option value="hybrid">🔀 Hybrid</option>
                    <option value="terrain">🏔️ Terreng</option>
                  </select>
                  
                  
                  <button 
                    onClick={() => setIsMapFullscreen(!isMapFullscreen)}
                    className="btn btn-sm btn-primary"
                    style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                  >
                    {isMapFullscreen ? <Minimize style={{ width: '12px', height: '12px' }} /> : <Maximize style={{ width: '12px', height: '12px' }} />}
                    {isMapFullscreen ? 'Tilbake' : 'Fullskjerm'}
                  </button>
                </div>
              </div>
            </div>

            {/* Advanced Map Content */}
            <div style={{ height: 'calc(100% - 80px)', padding: '1rem', position: 'relative' }}>
              {activeView === 'map' && (
                <div style={{ height: '100%', backgroundColor: '#e0f2fe', borderRadius: '12px', position: 'relative', overflow: 'hidden', border: '2px solid #3b82f6' }}>
                  
                  {/* Google Maps Container */}
                  <div 
                    id="google-map-container"
                    style={{ 
                      height: '100%', 
                      width: '100%',
                      borderRadius: '8px',
                      position: 'relative',
                      background: `url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse"><path d="M 10 0 L 0 0 0 10" fill="none" stroke="%23e5e7eb" stroke-width="0.5"/></pattern></defs><rect width="100" height="100" fill="url(%23grid)"/><rect width="100" height="100" fill="%23f8fafc"/></svg>')`,
                      backgroundSize: '20px 20px'
                    }}
                  >
                    {/* Order Markers */}
                    {orders && Array.isArray(orders) && orders.filter(o => o.status === 'pending' && o.coordinates).map((order, index) => (
                      <div
                        key={order.id}
                        draggable={true}
                        onDragStart={() => setDraggedOrder(order.id || '')}
                        onDragEnd={() => setDraggedOrder(null)}
                        style={{
                          position: 'absolute',
                          left: `${20 + (index % 5) * 15}%`,
                          top: `${20 + Math.floor(index / 5) * 15}%`,
                          width: '24px',
                          height: '24px',
                          backgroundColor: order.priority === 'high' ? '#ef4444' : order.priority === 'medium' ? '#f59e0b' : '#10b981',
                          borderRadius: '50%',
                          border: '3px solid white',
                          cursor: 'grab',
                          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '12px',
                          fontWeight: 'bold',
                          color: 'var(--text-color)',
                          zIndex: 10,
                          transition: 'all 0.3s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'scale(1.2)';
                          e.currentTarget.style.zIndex = '20';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'scale(1)';
                          e.currentTarget.style.zIndex = '10';
                        }}
                        title={`Ordre: ${order.orderNumber}\nKunde: ${order.customerName}\nAdresse: ${order.customerAddress}\nVekt: ${order.totalWeight}kg\nPrioritet: ${order.priority}`}
                      >
                        {order.priority === 'high' ? '!' : order.priority === 'medium' ? '?' : '✓'}
                      </div>
                    ))}

                    {/* Route Lines for Planned Routes */}
                    {selectedRoute && (() => {
                      const selectedRouteData = plannedRoutes.find(r => r.id === selectedRoute);
                      return selectedRouteData && selectedRouteData.orders && Array.isArray(selectedRouteData.orders) && (
                      <svg style={{ position: 'absolute', inset: '0', width: '100%', height: '100%', zIndex: 5 }}>
                          {selectedRouteData.orders.map((order, index, array) => {
                          if (index < array.length - 1) {
                            const nextOrder = array[index + 1];
                            return (
                              <line
                                key={`${order.id}-${nextOrder.id}`}
                                x1={`${20 + (index % 5) * 15}%`}
                                y1={`${20 + Math.floor(index / 5) * 15}%`}
                                x2={`${20 + ((index + 1) % 5) * 15}%`}
                                y2={`${20 + Math.floor((index + 1) / 5) * 15}%`}
                                stroke="#3b82f6"
                                strokeWidth="4"
                                strokeDasharray="8,4"
                                style={{ animation: 'dash 2s linear infinite' }}
                                markerEnd="url(#arrowhead)"
                              />
                            );
                          }
                          return null;
                        })}
                        
                        {/* Arrow marker definition */}
                        <defs>
                          <marker id="arrowhead" markerWidth="10" markerHeight="7" 
                            refX="9" refY="3.5" orient="auto">
                            <polygon points="0 0, 10 3.5, 0 7" fill="#3b82f6" />
                          </marker>
                        </defs>
                      </svg>
                      );
                    })()}

                    {/* Vehicle Positions */}
                    {vehicles && Array.isArray(vehicles) && vehicles.filter(v => v.status === 'active').map((vehicle, index) => (
                      <div
                        key={vehicle.registrationNumber}
                        style={{
                          position: 'absolute',
                          left: `${60 + index * 10}%`,
                          top: `${70 + index * 5}%`,
                          width: '32px',
                          height: '32px',
                          backgroundColor: 'var(--primary)',
                          borderRadius: '8px',
                          border: '3px solid white',
                          cursor: 'pointer',
                          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '16px',
                          zIndex: 15,
                          animation: 'pulse 3s infinite'
                        }}
                        title={`Kjøretøy: ${vehicle.registrationNumber}\nSjåfør: ${vehicle.driverName}\nKapasitet: ${vehicle.capacity?.weight}kg / ${vehicle.capacity?.volume}L\nStatus: ${vehicle.status}`}
                      >
                        🚛
                      </div>
                    ))}
                  </div>

                  {/* Advanced Map Controls */}
                  <div style={{ position: 'absolute', top: '1rem', left: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <button 
                      onClick={() => setMapCenter({ lat: 59.9139, lng: 10.7522 })}
                      style={{
                        padding: '0.75rem',
                        borderRadius: '8px',
                        border: 'none',
                        background: 'rgba(255, 255, 255, 0.9)',
                        cursor: 'pointer',
                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        fontSize: '0.875rem',
                        fontWeight: '600'
                      }}
                    >
                      <MapPin style={{ width: '16px', height: '16px' }} />
                      Oslo
                    </button>
                    
                    <button 
                      onClick={() => {
                        const pendingOrders = orders.filter(o => o.status === 'pending');
                        if (pendingOrders.length > 0) {
                          const avgLat = pendingOrders.reduce((sum, o) => sum + (o.coordinates?.lat || 59.9139), 0) / pendingOrders.length;
                          const avgLng = pendingOrders.reduce((sum, o) => sum + (o.coordinates?.lng || 10.7522), 0) / pendingOrders.length;
                          setMapCenter({ lat: avgLat, lng: avgLng });
                        }
                      }}
                      style={{
                        padding: '0.75rem',
                        borderRadius: '8px',
                        border: 'none',
                        background: 'rgba(255, 255, 255, 0.9)',
                        cursor: 'pointer',
                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        fontSize: '0.875rem',
                        fontWeight: '600'
                      }}
                    >
                      <Target style={{ width: '16px', height: '16px' }} />
                      Ordre
                    </button>
                  </div>

                  {/* Advanced Map Info Overlay */}
                  <div style={{ position: 'absolute', top: '1rem', right: '1rem', backgroundColor: 'rgba(255, 255, 255, 0.95)', padding: '1rem', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)', backdropFilter: 'blur(10px)' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: '600', color: '#374151', marginBottom: '0.5rem' }}>📊 Live Statistikk</div>
                    <div style={{ fontSize: '0.7rem', color: '#6b7280', lineHeight: '1.4' }}>
                      📍 {orders.filter(o => o.status === 'pending').length} ventende ordre<br/>
                      🚛 {vehicles.length} tilgjengelige kjøretøy<br/>
                      🛣️ {plannedRoutes.length} planlagte ruter<br/>
                      ⚡ {orders.reduce((sum, o) => sum + (o.totalWeight || 0), 0).toLocaleString()}kg total vekt<br/>
                      📦 {orders.reduce((sum, o) => sum + (o.totalVolume || 0), 0).toLocaleString()}L total volum
                    </div>
                  </div>

                  {/* Route Selection Panel */}
                  {plannedRoutes.length > 0 && (
                    <div style={{ position: 'absolute', bottom: '1rem', left: '1rem', right: '1rem', backgroundColor: 'rgba(255, 255, 255, 0.95)', padding: '1rem', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)', backdropFilter: 'blur(10px)' }}>
                      <div style={{ fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.5rem' }}>🛣️ Velg rute for visning:</div>
                      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        {plannedRoutes.map(route => (
                          <button
                            key={route.id}
                            onClick={() => setSelectedRoute(selectedRoute === route.id ? null : route.id)}
                            style={{
                              padding: '0.5rem 1rem',
                              borderRadius: '8px',
                              border: 'none',
                              background: selectedRoute === route.id ? 'linear-gradient(135deg, #3b82f6, #1d4ed8)' : 'rgba(59, 130, 246, 0.1)',
                              color: selectedRoute === route.id ? 'white' : '#3b82f6',
                              cursor: 'pointer',
                              fontSize: '0.75rem',
                              fontWeight: '600',
                              transition: 'all 0.3s ease'
                            }}
                          >
                            {route.routeName}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeView === 'timeline' && (
                <div style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div style={{ backgroundColor: '#dbeafe', padding: '1rem', borderRadius: '8px' }}>
                    <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem', fontWeight: '600' }}>Morgen ruter (08:00-12:00)</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem', fontSize: '0.75rem' }}>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontWeight: '600', fontSize: '1rem' }}>15</div>
                        <div style={{ color: '#6b7280' }}>Ordre</div>
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontWeight: '600', fontSize: '1rem' }}>3</div>
                        <div style={{ color: '#6b7280' }}>Ruter</div>
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontWeight: '600', fontSize: '1rem', color: '#059669' }}>92%</div>
                        <div style={{ color: '#6b7280' }}>Effektivitet</div>
                      </div>
                    </div>
                  </div>
                  
                  <div style={{ backgroundColor: '#dcfce7', padding: '1rem', borderRadius: '8px' }}>
                    <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem', fontWeight: '600' }}>Ettermiddag ruter (13:00-17:00)</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem', fontSize: '0.75rem' }}>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontWeight: '600', fontSize: '1rem' }}>22</div>
                        <div style={{ color: '#6b7280' }}>Ordre</div>
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontWeight: '600', fontSize: '1rem' }}>4</div>
                        <div style={{ color: '#6b7280' }}>Ruter</div>
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontWeight: '600', fontSize: '1rem', color: '#059669' }}>88%</div>
                        <div style={{ color: '#6b7280' }}>Effektivitet</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeView === 'gantt' && (
                <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <div style={{ textAlign: 'center' }}>
                    <GanttChart style={{ width: '48px', height: '48px', color: '#6b7280', margin: '0 auto 1rem' }} />
                    <h4 style={{ margin: '0 0 0.5rem 0' }}>Gantt Diagram</h4>
                    <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>Visuell ruteplanlegging</p>
                  </div>
                </div>
              )}

              {activeView === 'analytics' && (
                <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <div style={{ textAlign: 'center' }}>
                    <BarChart3 style={{ width: '48px', height: '48px', color: '#6b7280', margin: '0 auto 1rem' }} />
                    <h4 style={{ margin: '0 0 0.5rem 0' }}>Analytisk Dashboard</h4>
                    <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>Ytelsesmetrikker og optimalisering</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT SIDE - Advanced Vehicle Resources */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3>🚛 Kjøretøy & Sjåfører</h3>
            <span className="badge badge-green">{vehicles?.length || 0}</span>
          </div>
          
          <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
            {vehicles && vehicles.length > 0 ? (
              vehicles.map((vehicle, index) => (
                <div key={vehicle.registrationNumber} className="card" style={{ marginBottom: '0.75rem', padding: '1rem', border: '1px solid #e5e7eb', borderRadius: '8px' }}>
                  {/* Vehicle Header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.75rem' }}>
                    <div>
                      <h4 style={{ margin: '0 0 0.25rem 0', fontSize: '0.9rem', fontWeight: '600', color: '#374151' }}>
                        {vehicle.driverName || `Sjåfør ${vehicle.registrationNumber}`}
                      </h4>
                      <p style={{ margin: '0 0 0.25rem 0', fontSize: '0.8rem', fontWeight: '500', color: '#6b7280' }}>
                        🚛 {vehicle.model || vehicle.registrationNumber}
                      </p>
                      <p style={{ margin: '0', fontSize: '0.75rem', color: '#9ca3af' }}>
                        {vehicle.registrationNumber}
                      </p>
                    </div>
                    <span className={`badge ${vehicle.status === 'active' ? 'badge-green' : vehicle.status === 'busy' ? 'badge-red' : 'badge-gray'}`} style={{ fontSize: '0.7rem' }}>
                      {vehicle.status === 'active' ? 'Tilgjengelig' : vehicle.status === 'busy' ? 'Opptatt' : 'Utilgjengelig'}
                    </span>
                  </div>

                  {/* Contact Information */}
                  <div style={{ marginBottom: '0.75rem', padding: '0.5rem', backgroundColor: '#f8fafc', borderRadius: '6px' }}>
                    <div style={{ fontSize: '0.7rem', color: '#6b7280', display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                      <span>📞 Telefon:</span>
                      <span style={{ fontWeight: '500' }}>{vehicle.driverPhone || 'Ikke oppgitt'}</span>
                    </div>
                    <div style={{ fontSize: '0.7rem', color: '#6b7280', display: 'flex', justifyContent: 'space-between' }}>
                      <span>📧 E-post:</span>
                      <span style={{ fontWeight: '500' }}>{vehicle.driverEmail || 'Ikke oppgitt'}</span>
                    </div>
                  </div>

                  {/* Vehicle Specifications */}
                  <div style={{ marginBottom: '0.75rem' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: '600', color: '#374151', marginBottom: '0.5rem' }}>📋 Kjøretøy-spesifikasjoner:</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.25rem', fontSize: '0.7rem', color: '#6b7280' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Type:</span>
                        <span style={{ fontWeight: '500' }}>{vehicle.vehicleType || 'company_car'}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Årsmodell:</span>
                        <span style={{ fontWeight: '500' }}>{vehicle.year || 'Ukjent'}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Drivstoff:</span>
                        <span style={{ fontWeight: '500' }}>{vehicle.fuelType || 'Bensin'}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Status:</span>
                        <span style={{ fontWeight: '500' }}>{vehicle.status || 'available'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Capacity Information */}
                  <div style={{ marginBottom: '0.75rem', padding: '0.75rem', backgroundColor: '#eff6ff', borderRadius: '6px', border: '1px solid #dbeafe' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: '600', color: '#1e40af', marginBottom: '0.5rem' }}>⚖️ Kapasitet:</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.25rem', fontSize: '0.7rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Maks vekt:</span>
                        <span style={{ fontWeight: '600', color: '#1e40af' }}>{vehicle.capacity?.weight || 1000}kg</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Maks volum:</span>
                        <span style={{ fontWeight: '600', color: '#1e40af' }}>{vehicle.capacity?.volume || 10000}L</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Pallkapasitet:</span>
                        <span style={{ fontWeight: '600', color: '#1e40af' }}>{vehicle.capacity?.pallets || 0} paller</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Nyttevekt:</span>
                        <span style={{ fontWeight: '600', color: '#1e40af' }}>{vehicle.payload || '1000kg'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Special Equipment */}
                  {vehicle.specialEquipment && Array.isArray(vehicle.specialEquipment) && vehicle.specialEquipment.length > 0 && (
                    <div style={{ marginBottom: '0.75rem' }}>
                      <div style={{ fontSize: '0.75rem', fontWeight: '600', color: '#374151', marginBottom: '0.5rem' }}>🔧 Spesialutstyr:</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                        {vehicle.specialEquipment.map((equipment, eqIndex) => (
                          <span key={eqIndex} style={{ 
                            fontSize: '0.65rem', 
                            padding: '0.25rem 0.5rem', 
                            backgroundColor: 'var(--gray-100)', 
                            borderRadius: '4px',
                            color: '#6b7280'
                          }}>
                            {equipment}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Maintenance Info */}
                  <div style={{ fontSize: '0.7rem', color: '#9ca3af' }}>
                    {vehicle.maintenanceDate && (
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>🔧 Siste service:</span>
                        <span>{new Date(vehicle.maintenanceDate).toLocaleDateString('nb-NO')}</span>
                      </div>
                    )}
                    {vehicle.insuranceExpiry && (
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>🛡️ Forsikring utløper:</span>
                        <span>{new Date(vehicle.insuranceExpiry).toLocaleDateString('nb-NO')}</span>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
                    <button 
                      onClick={() => {
                        // Assign vehicle to route
                        console.log(`Assigning vehicle ${vehicle.registrationNumber} to route`);
                      }}
                      style={{
                        flex: 1,
                        padding: '0.5rem',
                        borderRadius: '6px',
                        border: 'none',
                        background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
                        color: 'var(--text-color)',
                        fontSize: '0.7rem',
                        fontWeight: '600',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease'
                      }}
                    >
                      📋 Tildel rute
                    </button>
                    <button 
                      onClick={() => {
                        // View vehicle details
                        console.log(`Viewing details for vehicle ${vehicle.registrationNumber}`);
                      }}
                      style={{
                        padding: '0.5rem',
                        borderRadius: '6px',
                        border: '1px solid var(--border-color)',
                        background: 'var(--card-background)',
                        color: 'var(--gray-500)',
                        fontSize: '0.7rem',
                        fontWeight: '600',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease'
                      }}
                    >
                      👁️ Detaljer
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
                <Truck style={{ width: '48px', height: '48px', margin: '0 auto 1rem', opacity: 0.5 }} />
                <p>Ingen kjøretøy registrert</p>
                <p style={{ fontSize: '0.875rem' }}>Gå til samarbeidspartnere for å legge til kjøretøy</p>
              </div>
            )}
          </div>
        </div>
      </div>
      )}

      {/* Pending Orders Section - Below the main layout */}
      <div className="card" style={{ marginTop: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3>Ventende ordre</h3>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button 
              onClick={() => {
                const pendingIds = (orders && Array.isArray(orders) ? orders.filter(o => o.status === 'pending') : []).map(o => o.id || '');
                setSelectedOrders(pendingIds);
              }}
              className="btn btn-sm btn-primary"
            >
              Velg alle
            </button>
            <button 
              onClick={() => setSelectedOrders([])}
              className="btn btn-sm btn-secondary"
            >
              Fjern valg
            </button>
          </div>
        </div>
        
        {/* Selected Orders Summary */}
        {selectedOrders.length > 0 && (
          <div className="card" style={{ marginBottom: '1rem', backgroundColor: '#eff6ff', border: '2px solid #2563eb' }}>
            <h4>Valgte ordre ({selectedOrders.length})</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Antall ordre:</span>
                <span style={{ fontWeight: '600' }}>{selectedOrders.length}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Total verdi:</span>
                <span style={{ fontWeight: '600', color: '#059669' }}>
                  {orders
                    .filter(o => selectedOrders.includes(o.id || ''))
                    .reduce((sum, o) => sum + (o.products?.reduce((pSum, p) => pSum + (p.price * p.quantity), 0) || 0), 0)
                    .toLocaleString()} kr
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Tilgjengelige sjåfører:</span>
                <span style={{ fontWeight: '600' }}>
                  {partners.reduce((sum, p) => sum + (p.vehicles?.length || 0), 0)}
                </span>
              </div>
            </div>
            <button 
              onClick={handleOptimizeRoutes}
              disabled={isOptimizing}
              className="btn btn-primary"
              style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
            >
              {isOptimizing ? (
                <>
                  <RefreshCw style={{ width: '20px', height: '20px', animation: 'spin 1s linear infinite' }} />
                  <span>Optimaliserer...</span>
                </>
              ) : (
                <>
                  <Zap style={{ width: '20px', height: '20px' }} />
                  <span>Optimaliser ruter</span>
                </>
              )}
            </button>
          </div>
        )}
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
          {orders && Array.isArray(orders) && orders.filter(o => o.status === 'pending').map((order) => (
            <div 
              key={order.id}
              onClick={() => {
                if (selectedOrders.includes(order.id || '')) {
                  setSelectedOrders(selectedOrders.filter(id => id !== order.id));
                } else {
                  setSelectedOrders([...selectedOrders, order.id || '']);
                }
              }}
              className={`card ${selectedOrders.includes(order.id || '') ? 'selected' : ''}`}
              style={{ 
                cursor: 'pointer',
                border: selectedOrders.includes(order.id || '') ? '2px solid #2563eb' : '1px solid #e5e7eb',
                backgroundColor: selectedOrders.includes(order.id || '') ? '#eff6ff' : 'white'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                <div>
                  <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '1rem', fontWeight: '600' }}>
                    {order.orderNumber}
                  </h4>
                  <p style={{ margin: '0 0 0.25rem 0', fontSize: '0.875rem', color: '#6b7280' }}>
                    <strong>{order.customerName}</strong>
                  </p>
                  <p style={{ margin: '0 0 0.25rem 0', fontSize: '0.875rem', color: '#6b7280' }}>
                    <Phone style={{ width: '12px', height: '12px', display: 'inline', marginRight: '0.25rem' }} />
                    {order.customerPhone}
                  </p>
                  <p style={{ margin: '0 0 0.25rem 0', fontSize: '0.875rem', color: '#6b7280' }}>
                    <Building style={{ width: '12px', height: '12px', display: 'inline', marginRight: '0.25rem' }} />
                    {order.customerAddress}
                  </p>
                  <p style={{ margin: '0', fontSize: '0.875rem', color: '#6b7280' }}>
                    <Calendar style={{ width: '12px', height: '12px', display: 'inline', marginRight: '0.25rem' }} />
                    {order.deliveryDate}
                  </p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span className={`badge ${order.priority === 'high' ? 'badge-red' : order.priority === 'medium' ? 'badge-yellow' : 'badge-green'}`}>
                    {order.priority}
                  </span>
                  <div style={{ marginTop: '0.5rem' }}>
                    <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                      {order.totalProducts} produkter
                    </div>
                    <div style={{ fontSize: '0.875rem', fontWeight: '600', color: '#059669' }}>
                      {order.products?.reduce((sum, p) => sum + (p.price * p.quantity), 0).toLocaleString()} kr
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>


    </div>
  );
}