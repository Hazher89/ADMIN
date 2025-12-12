'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { PostcodeData, searchPostcodes, getServicesByCategory, getCategories } from '../../../lib/bud-priser-data';
import { firebaseService } from '@/lib/firebase-services';
import { collection, getDocs, query, orderBy, where, addDoc, updateDoc, serverTimestamp, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
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
  CheckCircle2, ShoppingCart, Navigation, Archive,
  MapPin as MapPinIcon, Calculator, History, FileText as FileTextIcon2,
  // Advanced Planning imports
  Map, Zap, Route, Calendar, GanttChart, TrendingUp as TrendingUpIcon,
  Building2, RotateCcw, Maximize, Minimize, Layers, Satellite,
  ArrowRight, RotateCcw as RotateCcwIcon, Weight,
  // Delivery imports
  QrCode, Camera, Activity, ArrowLeft, Square,
  // Customer imports
  UserCheck as UserCheckIcon, Star as StarIcon,
  // Supplier imports
  Truck as TruckIcon,
  // Product imports
  Box, TrendingDown, DollarSign as DollarSignIcon,
  // Inventory imports
  Package as PackageIcon, AlertCircle, Minus,
  // Invoicing imports
  Clock as ClockIcon2, AlertCircle as AlertCircleIcon,
  // Finance imports
  CreditCard, PieChart, ArrowUpRight, ArrowDownRight
} from 'lucide-react';

// Interfaces
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
    assignedDriver?: string;
  assignedVehicle?: string;
  routeId?: string;
}

interface Customer {
  id?: string;
  name: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: string;
  type: 'privat' | 'bedrift';
  status: 'active' | 'inactive' | 'prospect';
  totalOrders: number;
  totalValue: number;
  lastOrder: string;
  customerSince: string;
  rating: number;
    orders: string[];
  createdAt?: any;
  updatedAt?: any;
}

interface Supplier {
  id: string;
  name: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: string;
  category: string;
  rating: number;
  status: string;
  lastOrder: string;
  totalOrders: number;
  }

interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  price: number;
  cost: number;
  stock: number;
  minStock: number;
  status: string;
  supplier: string;
  description: string;
  lastRestock: string;
  }

interface Invoice {
  id: string;
  customer: string;
  amount: number;
  status: string;
  dueDate: string;
  createdDate: string;
  description: string;
  paidDate: string | null;
  }

interface Payment {
  id: string;
  invoiceId: string;
  amount: number;
  method: string;
  status: string;
  date: string;
  }

export default function LogistikkSystemPage() {
  const { user, userProfile, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState('bud-priser');
  const [isMobile, setIsMobile] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // Search and filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedType, setSelectedType] = useState('all');

  // Advanced Planning states
  const [orders, setOrders] = useState<Order[]>([]);
  const [drivers, setDrivers] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [planningTab, setPlanningTab] = useState('orders');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [showRouteModal, setShowRouteModal] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);

  // Delivery states
  const [deliveries, setDeliveries] = useState<any[]>([]);
  const [currentDelivery, setCurrentDelivery] = useState(null);
  const [showScanner, setShowScanner] = useState(false);
  const [showSignature, setShowSignature] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [scanResult, setScanResult] = useState('');
  const [showMap, setShowMap] = useState(true);

  // Customer states
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  // Supplier states
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [showSupplierModal, setShowSupplierModal] = useState(false);
  const [filterCategory, setFilterCategory] = useState('all');

  // Product states
  const [products, setProducts] = useState<Product[]>([]);
  const [showProductModal, setShowProductModal] = useState(false);
  const [filterProductCategory, setFilterProductCategory] = useState('all');
  const [filterProductStatus, setFilterProductStatus] = useState('all');

  // Inventory states
  const [inventory, setInventory] = useState([]);
  const [inventoryTab, setInventoryTab] = useState('inventory');

  // Invoicing states
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [filterInvoiceStatus, setFilterInvoiceStatus] = useState('all');

  // Finance states
  const [payments, setPayments] = useState<Payment[]>([]);
  const [budgets, setBudgets] = useState([]);
  const [financeTab, setFinanceTab] = useState('overview');

  // BUD Priser states
  const [postcode, setPostcode] = useState('');
  const [address, setAddress] = useState('');
  const [selectedZone, setSelectedZone] = useState<PostcodeData | null>(null);
  const [totalPrice, setTotalPrice] = useState(0);
  const [addressSuggestions, setAddressSuggestions] = useState<Array<{
    display: string;
    postcode: string;
    fullAddress: string;
  }>>([]);
  const [showAddressSuggestions, setShowAddressSuggestions] = useState(false);
  const [isLoadingBudPriser, setIsLoadingBudPriser] = useState(false);
  const [searchHistory, setSearchHistory] = useState<Array<{
    timestamp: Date;
    address: string;
    postcode: string;
    price: number;
    place: string;
  }>>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('budPriserSearchHistory');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          return parsed.map((entry: any) => ({
            ...entry,
            timestamp: new Date(entry.timestamp)
          }));
        } catch (error) {
          console.error('Error parsing saved search history:', error);
        }
      }
    }
    return [];
  });
  
  // Extra services search states
  const [extraServiceSearch, setExtraServiceSearch] = useState('');
  const [serviceSuggestions, setServiceSuggestions] = useState<Array<{
    id: string;
    name: string;
    category: string;
    price: number;
    description: string;
  }>>([]);
  const [showServiceSuggestions, setShowServiceSuggestions] = useState(false);
  const [selectedServices, setSelectedServices] = useState<Array<{
    id: string;
    name: string;
    price: number;
    description: string;
  }>>([]);
  
  // Advanced pricing states
  const [weatherImpact, setWeatherImpact] = useState(0);
  const [trafficImpact, setTrafficImpact] = useState(0);
  const [distanceImpact, setDistanceImpact] = useState(0);
  const [isCalculating, setIsCalculating] = useState(false);
  const [budPriserTab, setBudPriserTab] = useState('search'); // 'search', 'history', or 'registered'
  
  // Registration states
  const [registeredEntries, setRegisteredEntries] = useState<Array<{
    id: string;
    timestamp: Date;
    bilnummer: string;
    kjoredato: string;
    freightOrder: string;
    freightUnit: string;
    soNummer: string;
    kommentarer: string;
    adHoc1: string;
    adHoc2: string;
    totalpris: number;
    address: string;
    postcode: string;
    place: string;
    selectedServices: Array<{
      id: string;
      name: string;
      price: number;
      description: string;
    }>;
  }>>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('budPriserRegisteredEntries');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          return parsed.map((entry: any) => ({
            ...entry,
            timestamp: new Date(entry.timestamp)
          }));
        } catch (error) {
          console.error('Error parsing saved registered entries:', error);
        }
      }
    }
    return [];
  });

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

  // Data loading functions
  const loadOrders = async () => {
    if (!db || !userProfile?.companyId) return;
    
    try {
      const ordersQuery = query(
        collection(db, 'orders'),
        where('companyId', '==', userProfile.companyId)
      );
      const ordersSnapshot = await getDocs(ordersQuery);
      const ordersData = ordersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Order[];
      
      // Sort in memory by createdAt descending
      ordersData.sort((a, b) => {
        const aTime = a.createdAt?.toDate?.() || new Date(a.createdAt || 0);
        const bTime = b.createdAt?.toDate?.() || new Date(b.createdAt || 0);
        return bTime.getTime() - aTime.getTime();
      });
      
      setOrders(ordersData);
    } catch (error) {
      console.error('Error loading orders:', error);
    }
  };

  const loadCustomers = async () => {
    if (!db || !userProfile?.companyId) return;
    
    try {
      const customersQuery = query(
        collection(db, 'customers'),
        where('companyId', '==', userProfile.companyId)
      );
      const customersSnapshot = await getDocs(customersQuery);
      const customersData = customersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Customer[];
      
      setCustomers(customersData);
    } catch (error) {
      console.error('Error loading customers:', error);
    }
  };

  const loadDeliveries = async () => {
    if (!db || !userProfile?.companyId) return;
    
    try {
      const deliveriesQuery = query(
        collection(db, 'deliveries'),
        where('companyId', '==', userProfile.companyId)
      );
      const deliveriesSnapshot = await getDocs(deliveriesQuery);
      const deliveriesData = deliveriesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as any[];
      
      // Sort in memory by createdAt descending
      deliveriesData.sort((a: any, b: any) => {
        const aTime = a.createdAt?.toDate?.() || new Date(a.createdAt || 0);
        const bTime = b.createdAt?.toDate?.() || new Date(b.createdAt || 0);
        return bTime.getTime() - aTime.getTime();
      });
      
      setDeliveries(deliveriesData as any[]);
    } catch (error) {
      console.error('Error loading deliveries:', error);
    }
  };

  const loadSuppliers = async () => {
    if (!db || !userProfile?.companyId) return;
    
    try {
      const suppliersQuery = query(
        collection(db, 'suppliers'),
        where('companyId', '==', userProfile.companyId)
      );
      const suppliersSnapshot = await getDocs(suppliersQuery);
      const suppliersData = suppliersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Supplier[];
      
      setSuppliers(suppliersData);
    } catch (error) {
      console.error('Error loading suppliers:', error);
    }
  };

  const loadProducts = async () => {
    if (!db || !userProfile?.companyId) return;
    
    try {
      const productsQuery = query(
        collection(db, 'products'),
        where('companyId', '==', userProfile.companyId)
      );
      const productsSnapshot = await getDocs(productsQuery);
      const productsData = productsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Product[];
      
      setProducts(productsData);
    } catch (error) {
      console.error('Error loading products:', error);
    }
  };

  const loadInvoices = async () => {
    if (!db || !userProfile?.companyId) return;
    
    try {
      const invoicesQuery = query(
        collection(db, 'invoices'),
        where('companyId', '==', userProfile.companyId)
      );
      const invoicesSnapshot = await getDocs(invoicesQuery);
      const invoicesData = invoicesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Invoice[];
      
      // Sort in memory by createdAt descending
      invoicesData.sort((a: any, b: any) => {
        const aTime = a.createdAt?.toDate?.() || new Date(a.createdAt || a.createdDate || 0);
        const bTime = b.createdAt?.toDate?.() || new Date(b.createdAt || b.createdDate || 0);
        return bTime.getTime() - aTime.getTime();
      });
      
      setInvoices(invoicesData);
    } catch (error) {
      console.error('Error loading invoices:', error);
    }
  };

  const loadPayments = async () => {
    if (!db || !userProfile?.companyId) return;
    
    try {
      const paymentsQuery = query(
        collection(db, 'payments'),
        where('companyId', '==', userProfile.companyId)
      );
      const paymentsSnapshot = await getDocs(paymentsQuery);
      const paymentsData = paymentsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Payment[];
      
      // Sort in memory by createdAt descending
      paymentsData.sort((a: any, b: any) => {
        const aTime = a.createdAt?.toDate?.() || new Date(a.createdAt || a.date || 0);
        const bTime = b.createdAt?.toDate?.() || new Date(b.createdAt || b.date || 0);
        return bTime.getTime() - aTime.getTime();
      });
      
      setPayments(paymentsData);
    } catch (error) {
      console.error('Error loading payments:', error);
    }
  };

  const loadAllData = async () => {
    if (!userProfile) return;
    
    try {
      setIsLoading(true);
      await Promise.all([
        loadOrders(),
        loadCustomers(),
        loadDeliveries(),
        loadSuppliers(),
        loadProducts(),
        loadInvoices(),
        loadPayments()
      ]);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Load data on component mount
  useEffect(() => {
    if (!authLoading && userProfile) {
      loadAllData();
    }
  }, [authLoading, userProfile]);

  // BUD Priser functions
  const handlePostcodeSearch = useCallback(async (postcodeValue: string) => {
    if (!postcodeValue || postcodeValue.length < 4) return;
    
    setIsLoadingBudPriser(true);
    try {
      const results = await searchPostcodes(postcodeValue);
      setAddressSuggestions(results.map(r => ({
        display: `${r.postcode} ${r.place}`,
        postcode: r.postcode,
        fullAddress: r.place
      })));
      setShowAddressSuggestions(true);
    } catch (error) {
      console.error('Error searching postcodes:', error);
    } finally {
      setIsLoadingBudPriser(false);
    }
  }, []);

  const handleAddressSelect = (suggestion: any) => {
    setAddress(suggestion.fullAddress);
    setPostcode(suggestion.postcode);
    setSelectedZone(suggestion);
    setShowAddressSuggestions(false);
    calculatePrice();
  };

  const calculatePrice = () => {
    if (!selectedZone) return;
    
    let basePrice = selectedZone.price || 0;
    let servicePrice = selectedServices.reduce((sum, service) => sum + service.price, 0);
    let total = basePrice + servicePrice;
    
    // Apply weather impact
    if (weatherImpact > 0) {
      total += (total * weatherImpact) / 100;
    }
    
    // Apply traffic impact
    if (trafficImpact > 0) {
      total += (total * trafficImpact) / 100;
    }
    
    // Apply distance impact
    if (distanceImpact > 0) {
      total += (total * distanceImpact) / 100;
    }
    
    setTotalPrice(Math.round(total));
  };

  const handleServiceSearch = useCallback(async (searchValue: string) => {
    if (!searchValue || searchValue.length < 2) return;
    
    try {
      const categories = await getCategories();
      const allServices = [];
      
      for (const category of categories) {
        const services = await getServicesByCategory(category);
        allServices.push(...services);
      }
      
      const filtered = allServices.filter((service: any) =>
        service.name?.toLowerCase().includes(searchValue.toLowerCase()) ||
        service.description?.toLowerCase().includes(searchValue.toLowerCase())
      );
      
      setServiceSuggestions(filtered.slice(0, 10).map((s: any) => ({
        id: s.id || s.name,
        name: s.name,
        category: s.category || '',
        price: s.price || 0,
        description: s.description || ''
      })));
      setShowServiceSuggestions(true);
    } catch (error) {
      console.error('Error searching services:', error);
    }
  }, []);

  const addService = (service: any) => {
    if (!selectedServices.find(s => s.id === service.id)) {
      setSelectedServices([...selectedServices, {
        id: service.id,
        name: service.name,
        price: service.price,
        description: service.description
      }]);
      calculatePrice();
    }
    setExtraServiceSearch('');
    setShowServiceSuggestions(false);
  };

  const removeService = (serviceId: string) => {
    setSelectedServices(selectedServices.filter(s => s.id !== serviceId));
    calculatePrice();
  };

  const saveToHistory = () => {
    if (!selectedZone || !address) return;
    
    const newEntry = {
      timestamp: new Date(),
      address,
      postcode,
      price: totalPrice,
      place: selectedZone.place || ''
    };
    
    const updatedHistory = [newEntry, ...searchHistory.slice(0, 49)];
    setSearchHistory(updatedHistory);
    
    if (typeof window !== 'undefined') {
      localStorage.setItem('budPriserSearchHistory', JSON.stringify(updatedHistory));
    }
  };

  const registerEntry = () => {
    if (!selectedZone || !address) return;
    
    const newEntry = {
      id: Date.now().toString(),
      timestamp: new Date(),
      bilnummer: '',
      kjoredato: '',
      freightOrder: '',
      freightUnit: '',
      soNummer: '',
      kommentarer: '',
      adHoc1: '',
      adHoc2: '',
      totalpris: totalPrice,
      address,
      postcode,
      place: selectedZone.place || '',
      selectedServices
    };
    
    const updatedEntries = [newEntry, ...registeredEntries];
    setRegisteredEntries(updatedEntries);
    
    if (typeof window !== 'undefined') {
      localStorage.setItem('budPriserRegisteredEntries', JSON.stringify(updatedEntries));
    }
  };

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
    { id: 'bud-priser', name: 'BUD Priser', icon: Target },
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
      totalBudPriser: searchHistory.length,
      totalDeliveries: deliveries.length,
      activeDeliveries: deliveries.filter((d: any) => d.status === 'in_transit' || d.status === 'assigned').length,
      totalCustomers: customers.length,
      totalSuppliers: suppliers.length,
      totalProducts: products.length,
      inventoryValue: products.reduce((sum, p) => sum + (p.price * p.stock), 0),
      pendingInvoices: invoices.filter(i => i.status === 'sent' || i.status === 'overdue').length,
      monthlyRevenue: invoices.filter(i => i.status === 'paid').reduce((sum, i) => sum + i.amount, 0),
    };
  };

  const stats = getStats();

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--background-color)',
      width: '100%',
      overflowX: 'hidden',
      padding: isMobile ? '0' : '2rem'
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
            Logistikk System
          </h1>
        </div>
      )}

      {/* Desktop Page Header */}
      {!isMobile && (
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{
            fontSize: 'var(--font-size-3xl)',
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
      )}

      {/* Statistics Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
        gap: '1rem',
        marginBottom: '2rem'
      }}>
        {[
          { label: 'BUD Priser', value: stats.totalBudPriser, icon: Target, color: '#ef4444' },
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

        {/* Tab Content */}
        <div style={{ padding: '1.5rem' }}>
          {/* BUD Priser Tab - Complete implementation */}
          {activeTab === 'bud-priser' && (
            <div>
              <h2 style={{ fontSize: 'var(--font-size-xl)', fontWeight: '600', color: 'var(--gray-900)', marginBottom: '1rem' }}>
                BUD Priser
              </h2>
              <p style={{ color: 'var(--gray-600)', marginBottom: '2rem' }}>
                Beregn leveringspriser basert på postnummer og tjenester. Søk etter adresser og få øyeblikkelige prisestimater.
              </p>

              {/* BUD Priser Tabs */}
              <div style={{ display: 'flex', borderBottom: '1px solid var(--gray-200)', marginBottom: '2rem' }}>
                {[
                  { id: 'search', name: 'Søk Priser', icon: Search },
                  { id: 'history', name: 'Søkehistorikk', icon: History },
                  { id: 'registered', name: 'Registrerte', icon: FileTextIcon2 }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setBudPriserTab(tab.id)}
                    className={`btn ${budPriserTab === tab.id ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ 
                      borderRadius: 0,
                      borderBottom: budPriserTab === tab.id ? '2px solid var(--primary)' : '2px solid transparent',
                      whiteSpace: 'nowrap',
                      minWidth: '120px'
                    }}
                  >
                    <tab.icon size={16} style={{ marginRight: '0.5rem' }} />
                    {tab.name}
                  </button>
                ))}
              </div>

              {/* Search Tab */}
              {budPriserTab === 'search' && (
                <div>
                  {/* Address Search */}
                  <div className="card" style={{ marginBottom: '2rem' }}>
                    <h3 style={{ fontSize: 'var(--font-size-lg)', fontWeight: '600', color: 'var(--gray-900)', marginBottom: '1rem' }}>
                      Adressesøk
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                      <div style={{ position: 'relative' }}>
                        <label style={{ display: 'block', fontSize: 'var(--font-size-sm)', fontWeight: '500', color: 'var(--gray-700)', marginBottom: '0.5rem' }}>
                          Postnummer
                        </label>
                        <input
                          type="text"
                          value={postcode}
                          onChange={(e) => {
                            setPostcode(e.target.value);
                            handlePostcodeSearch(e.target.value);
                          }}
                          placeholder="Søk postnummer..."
                          style={{
                            width: '100%',
                            padding: '0.75rem',
                            border: '1px solid var(--gray-300)',
                            borderRadius: 'var(--radius-md)',
                            fontSize: 'var(--font-size-base)',
                            outline: 'none'
                          }}
                        />
                        {isLoadingBudPriser && (
                          <div style={{ position: 'absolute', right: '0.75rem', top: '2.5rem' }}>
                            <Loader2 size={16} className="animate-spin" />
                          </div>
                        )}
                      </div>
                      <div style={{ position: 'relative' }}>
                        <label style={{ display: 'block', fontSize: 'var(--font-size-sm)', fontWeight: '500', color: 'var(--gray-700)', marginBottom: '0.5rem' }}>
                          Adresse
                        </label>
                        <input
                          type="text"
                          value={address}
                          onChange={(e) => setAddress(e.target.value)}
                          placeholder="Velg adresse..."
                          style={{
                            width: '100%',
                            padding: '0.75rem',
                            border: '1px solid var(--gray-300)',
                            borderRadius: 'var(--radius-md)',
                            fontSize: 'var(--font-size-base)',
                            outline: 'none'
                          }}
                        />
                      </div>
                    </div>

                    {/* Address Suggestions */}
                    {showAddressSuggestions && addressSuggestions.length > 0 && (
                      <div style={{
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        right: 0,
                        background: 'white',
                        border: '1px solid var(--gray-300)',
                        borderRadius: 'var(--radius-md)',
                        boxShadow: 'var(--shadow-lg)',
                        zIndex: 1000,
                        maxHeight: '200px',
                        overflowY: 'auto'
                      }}>
                        {addressSuggestions.map((suggestion, index) => (
                          <button
                            key={index}
                            onClick={() => handleAddressSelect(suggestion)}
                            style={{
                              width: '100%',
                              padding: '0.75rem',
                              textAlign: 'left',
                              border: 'none',
                              background: 'transparent',
                              cursor: 'pointer',
                              borderBottom: index < addressSuggestions.length - 1 ? '1px solid var(--gray-200)' : 'none'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = 'var(--gray-50)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = 'transparent';
                            }}
                          >
                            <div style={{ fontWeight: '500', color: 'var(--gray-900)' }}>
                              {suggestion.display}
                            </div>
                            <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--gray-600)' }}>
                              {suggestion.postcode} {suggestion.fullAddress}
                            </div>
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Selected Zone Info */}
                    {selectedZone && (
                      <div style={{
                        padding: '1rem',
                        background: 'var(--blue-50)',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--blue-200)',
                        marginTop: '1rem'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                          <MapPinIcon size={16} style={{ color: 'var(--blue-600)' }} />
                          <span style={{ fontWeight: '600', color: 'var(--blue-900)' }}>
                            {selectedZone.place}
                          </span>
                        </div>
                        <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--blue-700)' }}>
                          Sone: {selectedZone.zone || 'N/A'} | Grunnpris: kr {selectedZone.price || 0}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Extra Services */}
                  <div className="card" style={{ marginBottom: '2rem' }}>
                    <h3 style={{ fontSize: 'var(--font-size-lg)', fontWeight: '600', color: 'var(--gray-900)', marginBottom: '1rem' }}>
                      Ekstratjenester
                    </h3>
                    <div style={{ position: 'relative', marginBottom: '1rem' }}>
                      <input
                        type="text"
                        value={extraServiceSearch}
                        onChange={(e) => {
                          setExtraServiceSearch(e.target.value);
                          handleServiceSearch(e.target.value);
                        }}
                        placeholder="Søk etter tjenester..."
                        style={{
                          width: '100%',
                          padding: '0.75rem',
                          border: '1px solid var(--gray-300)',
                          borderRadius: 'var(--radius-md)',
                          fontSize: 'var(--font-size-base)',
                          outline: 'none'
                        }}
                      />
                      {showServiceSuggestions && serviceSuggestions.length > 0 && (
                        <div style={{
                          position: 'absolute',
                          top: '100%',
                          left: 0,
                          right: 0,
                          background: 'white',
                          border: '1px solid var(--gray-300)',
                          borderRadius: 'var(--radius-md)',
                          boxShadow: 'var(--shadow-lg)',
                          zIndex: 1000,
                          maxHeight: '200px',
                          overflowY: 'auto'
                        }}>
                          {serviceSuggestions.map((service, index) => (
                            <button
                              key={index}
                              onClick={() => addService(service)}
                              style={{
                                width: '100%',
                                padding: '0.75rem',
                                textAlign: 'left',
                                border: 'none',
                                background: 'transparent',
                                cursor: 'pointer',
                                borderBottom: index < serviceSuggestions.length - 1 ? '1px solid var(--gray-200)' : 'none'
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.background = 'var(--gray-50)';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.background = 'transparent';
                              }}
                            >
                              <div style={{ fontWeight: '500', color: 'var(--gray-900)' }}>
                                {service.name}
                              </div>
                              <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--gray-600)' }}>
                                {service.description} - kr {service.price}
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Selected Services */}
                    {selectedServices.length > 0 && (
                      <div>
                        <h4 style={{ fontSize: 'var(--font-size-base)', fontWeight: '600', color: 'var(--gray-900)', marginBottom: '0.5rem' }}>
                          Valgte tjenester:
                        </h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                          {selectedServices.map((service) => (
                            <div key={service.id} style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              padding: '0.75rem',
                              background: 'var(--gray-50)',
                              borderRadius: 'var(--radius-md)',
                              border: '1px solid var(--gray-200)'
                            }}>
                              <div>
                                <div style={{ fontWeight: '500', color: 'var(--gray-900)' }}>
                                  {service.name}
                                </div>
                                <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--gray-600)' }}>
                                  {service.description}
                                </div>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <span style={{ fontWeight: '600', color: 'var(--gray-900)' }}>
                                  kr {service.price}
                                </span>
                                <button
                                  onClick={() => removeService(service.id)}
                                  style={{
                                    padding: '0.25rem',
                                    background: 'var(--red-100)',
                                    border: 'none',
                                    borderRadius: 'var(--radius-sm)',
                                    cursor: 'pointer',
                                    color: 'var(--red-600)'
                                  }}
                                >
                                  <X size={14} />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Price Calculation */}
                  <div className="card" style={{ marginBottom: '2rem' }}>
                    <h3 style={{ fontSize: 'var(--font-size-lg)', fontWeight: '600', color: 'var(--gray-900)', marginBottom: '1rem' }}>
                      Prisberegning
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: 'var(--font-size-sm)', fontWeight: '500', color: 'var(--gray-700)', marginBottom: '0.5rem' }}>
                          Værpåvirkning (%)
                        </label>
                        <input
                          type="number"
                          value={weatherImpact}
                          onChange={(e) => setWeatherImpact(Number(e.target.value))}
                          placeholder="0"
                          style={{
                            width: '100%',
                            padding: '0.75rem',
                            border: '1px solid var(--gray-300)',
                            borderRadius: 'var(--radius-md)',
                            fontSize: 'var(--font-size-base)',
                            outline: 'none'
                          }}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: 'var(--font-size-sm)', fontWeight: '500', color: 'var(--gray-700)', marginBottom: '0.5rem' }}>
                          Trafikkpåvirkning (%)
                        </label>
                        <input
                          type="number"
                          value={trafficImpact}
                          onChange={(e) => setTrafficImpact(Number(e.target.value))}
                          placeholder="0"
                          style={{
                            width: '100%',
                            padding: '0.75rem',
                            border: '1px solid var(--gray-300)',
                            borderRadius: 'var(--radius-md)',
                            fontSize: 'var(--font-size-base)',
                            outline: 'none'
                          }}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: 'var(--font-size-sm)', fontWeight: '500', color: 'var(--gray-700)', marginBottom: '0.5rem' }}>
                          Avstandspåvirkning (%)
                        </label>
                        <input
                          type="number"
                          value={distanceImpact}
                          onChange={(e) => setDistanceImpact(Number(e.target.value))}
                          placeholder="0"
                          style={{
                            width: '100%',
                            padding: '0.75rem',
                            border: '1px solid var(--gray-300)',
                            borderRadius: 'var(--radius-md)',
                            fontSize: 'var(--font-size-base)',
                            outline: 'none'
                          }}
                        />
                      </div>
                    </div>

                    {/* Total Price */}
                    <div style={{
                      padding: '1.5rem',
                      background: 'var(--green-50)',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--green-200)',
                      textAlign: 'center'
                    }}>
                      <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--green-700)', marginBottom: '0.5rem' }}>
                        Total pris
                      </div>
                      <div style={{ fontSize: 'var(--font-size-3xl)', fontWeight: '700', color: 'var(--green-900)' }}>
                        kr {totalPrice}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                      <button
                        onClick={saveToHistory}
                        className="btn btn-primary"
                        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                      >
                        <Save size={16} />
                        Lagre til historikk
                      </button>
                      <button
                        onClick={registerEntry}
                        className="btn btn-secondary"
                        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                      >
                        <FileTextIcon2 size={16} />
                        Registrer
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* History Tab */}
              {budPriserTab === 'history' && (
                <div>
                  <h3 style={{ fontSize: 'var(--font-size-lg)', fontWeight: '600', color: 'var(--gray-900)', marginBottom: '1rem' }}>
                    Søkehistorikk
                  </h3>
                  {searchHistory.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--gray-500)' }}>
                      <History size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
                      <p>Ingen søkehistorikk funnet</p>
                    </div>
                  ) : (
                    <div className="card" style={{ padding: 0 }}>
                      <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                          <thead>
                            <tr style={{ background: 'var(--gray-50)', borderBottom: '1px solid var(--gray-200)' }}>
                              <th style={{ padding: 'var(--space-4)', textAlign: 'left', fontWeight: '600', color: 'var(--gray-900)' }}>Tid</th>
                              <th style={{ padding: 'var(--space-4)', textAlign: 'left', fontWeight: '600', color: 'var(--gray-900)' }}>Adresse</th>
                              <th style={{ padding: 'var(--space-4)', textAlign: 'left', fontWeight: '600', color: 'var(--gray-900)' }}>Postnummer</th>
                              <th style={{ padding: 'var(--space-4)', textAlign: 'left', fontWeight: '600', color: 'var(--gray-900)' }}>Sted</th>
                              <th style={{ padding: 'var(--space-4)', textAlign: 'left', fontWeight: '600', color: 'var(--gray-900)' }}>Pris</th>
                            </tr>
                          </thead>
                          <tbody>
                            {searchHistory.map((entry, index) => (
                              <tr key={index} style={{ borderBottom: '1px solid var(--gray-200)' }}>
                                <td style={{ padding: 'var(--space-4)', color: 'var(--gray-600)' }}>
                                  {entry.timestamp.toLocaleString()}
                                </td>
                                <td style={{ padding: 'var(--space-4)', color: 'var(--gray-900)' }}>
                                  {entry.address}
                                </td>
                                <td style={{ padding: 'var(--space-4)', color: 'var(--gray-600)' }}>
                                  {entry.postcode}
                                </td>
                                <td style={{ padding: 'var(--space-4)', color: 'var(--gray-600)' }}>
                                  {entry.place}
                                </td>
                                <td style={{ padding: 'var(--space-4)', fontWeight: '600', color: 'var(--green-600)' }}>
                                  kr {entry.price}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Registered Tab */}
              {budPriserTab === 'registered' && (
                <div>
                  <h3 style={{ fontSize: 'var(--font-size-lg)', fontWeight: '600', color: 'var(--gray-900)', marginBottom: '1rem' }}>
                    Registrerte oppføringer
                  </h3>
                  {registeredEntries.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--gray-500)' }}>
                      <FileTextIcon2 size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
                      <p>Ingen registrerte oppføringer funnet</p>
                    </div>
                  ) : (
                    <div className="card" style={{ padding: 0 }}>
                      <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                          <thead>
                            <tr style={{ background: 'var(--gray-50)', borderBottom: '1px solid var(--gray-200)' }}>
                              <th style={{ padding: 'var(--space-4)', textAlign: 'left', fontWeight: '600', color: 'var(--gray-900)' }}>Tid</th>
                              <th style={{ padding: 'var(--space-4)', textAlign: 'left', fontWeight: '600', color: 'var(--gray-900)' }}>Adresse</th>
                              <th style={{ padding: 'var(--space-4)', textAlign: 'left', fontWeight: '600', color: 'var(--gray-900)' }}>Postnummer</th>
                              <th style={{ padding: 'var(--space-4)', textAlign: 'left', fontWeight: '600', color: 'var(--gray-900)' }}>Sted</th>
                              <th style={{ padding: 'var(--space-4)', textAlign: 'left', fontWeight: '600', color: 'var(--gray-900)' }}>Tjenester</th>
                              <th style={{ padding: 'var(--space-4)', textAlign: 'left', fontWeight: '600', color: 'var(--gray-900)' }}>Totalpris</th>
                            </tr>
                          </thead>
                          <tbody>
                            {registeredEntries.map((entry) => (
                              <tr key={entry.id} style={{ borderBottom: '1px solid var(--gray-200)' }}>
                                <td style={{ padding: 'var(--space-4)', color: 'var(--gray-600)' }}>
                                  {entry.timestamp.toLocaleString()}
                                </td>
                                <td style={{ padding: 'var(--space-4)', color: 'var(--gray-900)' }}>
                                  {entry.address}
                                </td>
                                <td style={{ padding: 'var(--space-4)', color: 'var(--gray-600)' }}>
                                  {entry.postcode}
                                </td>
                                <td style={{ padding: 'var(--space-4)', color: 'var(--gray-600)' }}>
                                  {entry.place}
                                </td>
                                <td style={{ padding: 'var(--space-4)', color: 'var(--gray-600)' }}>
                                  {entry.selectedServices.length} tjenester
                                </td>
                                <td style={{ padding: 'var(--space-4)', fontWeight: '600', color: 'var(--green-600)' }}>
                                  kr {entry.totalpris}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Planning Tab - Advanced Cockpit Interface */}
          {activeTab === 'planning' && (
            <div>
              <h2 style={{ fontSize: 'var(--font-size-xl)', fontWeight: '600', color: 'var(--text-color)', marginBottom: '1rem' }}>
                Avansert Ruteplanlegging
              </h2>
              <p style={{ color: 'var(--gray-500)', marginBottom: '2rem' }}>
                Bruk det avanserte cockpit-systemet for å planlegge og optimalisere leveringsruter.
              </p>
              
              <div style={{ 
                border: '2px solid var(--border-color)', 
                borderRadius: 'var(--radius-lg)',
                padding: '1rem',
                background: 'var(--card-background)',
                textAlign: 'center'
              }}>
                <Navigation size={48} style={{ margin: '0 auto 1rem', color: 'var(--primary)', opacity: 0.7 }} />
                <h3 style={{ fontSize: 'var(--font-size-lg)', fontWeight: '600', color: 'var(--text-color)', marginBottom: '0.5rem' }}>
                  Avansert Planleggingssystem
                </h3>
                <p style={{ color: 'var(--gray-500)', marginBottom: '1.5rem' }}>
                  Gå til Ruteplanlegging for å bruke det avanserte cockpit-systemet med 4-panel visning
                </p>
                <a 
                  href="/dashboard/advanced-planning"
                  className="btn btn-primary"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
                >
                  <Navigation size={16} />
                  Åpne Ruteplanlegging
                </a>
              </div>
            </div>
          )}

          {/* Delivery Tab */}
          {activeTab === 'delivery' && (
            <div>
              <h2 style={{ fontSize: 'var(--font-size-xl)', fontWeight: '600', color: 'var(--text-color)', marginBottom: '1rem' }}>
                Leveringer
              </h2>
              <p style={{ color: 'var(--gray-500)', marginBottom: '2rem' }}>
                Administrer og spore leveringer i sanntid.
              </p>
              
              {deliveries.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--gray-500)' }}>
                  <Truck size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
                  <p>Ingen leveringer funnet</p>
                </div>
              ) : (
                <div className="card" style={{ padding: 0 }}>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ background: 'var(--gray-50)', borderBottom: '1px solid var(--border-color)' }}>
                          <th style={{ padding: 'var(--space-4)', textAlign: 'left', fontWeight: '600', color: 'var(--text-color)' }}>Ordrenummer</th>
                          <th style={{ padding: 'var(--space-4)', textAlign: 'left', fontWeight: '600', color: 'var(--text-color)' }}>Kunde</th>
                          <th style={{ padding: 'var(--space-4)', textAlign: 'left', fontWeight: '600', color: 'var(--text-color)' }}>Adresse</th>
                          <th style={{ padding: 'var(--space-4)', textAlign: 'left', fontWeight: '600', color: 'var(--text-color)' }}>Status</th>
                          <th style={{ padding: 'var(--space-4)', textAlign: 'left', fontWeight: '600', color: 'var(--text-color)' }}>Dato</th>
                        </tr>
                      </thead>
                      <tbody>
                        {deliveries.map((delivery: any) => (
                          <tr key={delivery.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                            <td style={{ padding: 'var(--space-4)', color: 'var(--text-color)' }}>{delivery.orderNumber || 'N/A'}</td>
                            <td style={{ padding: 'var(--space-4)', color: 'var(--text-color)' }}>{delivery.customerName || 'N/A'}</td>
                            <td style={{ padding: 'var(--space-4)', color: 'var(--gray-500)' }}>{delivery.address || 'N/A'}</td>
                            <td style={{ padding: 'var(--space-4)' }}>
                              <span style={{
                                padding: '0.25rem 0.75rem',
                                borderRadius: 'var(--radius-full)',
                                fontSize: 'var(--font-size-sm)',
                                fontWeight: '500',
                                background: delivery.status === 'completed' ? 'var(--success)' : delivery.status === 'in_transit' ? 'var(--warning)' : 'var(--gray-100)',
                                color: delivery.status === 'completed' ? 'white' : delivery.status === 'in_transit' ? 'var(--text-color)' : 'var(--gray-600)'
                              }}>
                                {delivery.status || 'pending'}
                              </span>
                            </td>
                            <td style={{ padding: 'var(--space-4)', color: 'var(--gray-500)' }}>
                              {delivery.createdAt?.toDate?.()?.toLocaleDateString() || 'N/A'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Customers Tab */}
          {activeTab === 'customers' && (
            <div>
              <h2 style={{ fontSize: 'var(--font-size-xl)', fontWeight: '600', color: 'var(--text-color)', marginBottom: '1rem' }}>
                Kunder
              </h2>
              <p style={{ color: 'var(--gray-500)', marginBottom: '2rem' }}>
                Administrer kunder og deres ordrehistorikk.
              </p>
              
              {customers.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--gray-500)' }}>
                  <Users size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
                  <p>Ingen kunder funnet</p>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
                  {customers.map((customer) => (
                    <div key={customer.id} className="card">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
                        <div>
                          <h3 style={{ fontSize: 'var(--font-size-lg)', fontWeight: '600', color: 'var(--text-color)', marginBottom: '0.25rem' }}>
                            {customer.name}
                          </h3>
                          <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--gray-500)' }}>
                            {customer.type === 'bedrift' ? 'Bedrift' : 'Privat'}
                          </p>
                        </div>
                        <span style={{
                          padding: '0.25rem 0.75rem',
                          borderRadius: 'var(--radius-full)',
                          fontSize: 'var(--font-size-sm)',
                          fontWeight: '500',
                          background: customer.status === 'active' ? 'var(--success)' : 'var(--gray-100)',
                          color: customer.status === 'active' ? 'white' : 'var(--gray-600)'
                        }}>
                          {customer.status}
                        </span>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: 'var(--font-size-sm)', color: 'var(--gray-500)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <Mail size={14} />
                          {customer.email}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <Phone size={14} />
                          {customer.phone}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <MapPin size={14} />
                          {customer.address}
                        </div>
                      </div>
                      <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between' }}>
                        <div>
                          <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--gray-500)' }}>Totale ordre</div>
                          <div style={{ fontSize: 'var(--font-size-lg)', fontWeight: '600', color: 'var(--text-color)' }}>{customer.totalOrders}</div>
                        </div>
                        <div>
                          <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--gray-500)' }}>Totalverdi</div>
                          <div style={{ fontSize: 'var(--font-size-lg)', fontWeight: '600', color: 'var(--text-color)' }}>kr {customer.totalValue.toLocaleString()}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Suppliers Tab */}
          {activeTab === 'suppliers' && (
            <div>
              <h2 style={{ fontSize: 'var(--font-size-xl)', fontWeight: '600', color: 'var(--text-color)', marginBottom: '1rem' }}>
                Leverandører
              </h2>
              <p style={{ color: 'var(--gray-500)', marginBottom: '2rem' }}>
                Administrer leverandører og deres produkter.
              </p>
              
              {suppliers.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--gray-500)' }}>
                  <Package size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
                  <p>Ingen leverandører funnet</p>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
                  {suppliers.map((supplier) => (
                    <div key={supplier.id} className="card">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
                        <div>
                          <h3 style={{ fontSize: 'var(--font-size-lg)', fontWeight: '600', color: 'var(--text-color)', marginBottom: '0.25rem' }}>
                            {supplier.name}
                          </h3>
                          <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--gray-500)' }}>
                            {supplier.category}
                          </p>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <Star size={14} style={{ color: '#fbbf24' }} />
                          <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: '600', color: 'var(--text-color)' }}>
                            {supplier.rating}
                          </span>
                        </div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: 'var(--font-size-sm)', color: 'var(--gray-500)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <Mail size={14} />
                          {supplier.email}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <Phone size={14} />
                          {supplier.phone}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <MapPin size={14} />
                          {supplier.address}
                        </div>
                      </div>
                      <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
                        <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--gray-500)' }}>Totale ordre</div>
                        <div style={{ fontSize: 'var(--font-size-lg)', fontWeight: '600', color: 'var(--text-color)' }}>{supplier.totalOrders}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Products Tab */}
          {activeTab === 'products' && (
            <div>
              <h2 style={{ fontSize: 'var(--font-size-xl)', fontWeight: '600', color: 'var(--text-color)', marginBottom: '1rem' }}>
                Produkter
              </h2>
              <p style={{ color: 'var(--gray-500)', marginBottom: '2rem' }}>
                Administrer produkter og lagerbeholdning.
              </p>
              
              {products.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--gray-500)' }}>
                  <ShoppingCart size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
                  <p>Ingen produkter funnet</p>
                </div>
              ) : (
                <div className="card" style={{ padding: 0 }}>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ background: 'var(--gray-50)', borderBottom: '1px solid var(--border-color)' }}>
                          <th style={{ padding: 'var(--space-4)', textAlign: 'left', fontWeight: '600', color: 'var(--text-color)' }}>Navn</th>
                          <th style={{ padding: 'var(--space-4)', textAlign: 'left', fontWeight: '600', color: 'var(--text-color)' }}>SKU</th>
                          <th style={{ padding: 'var(--space-4)', textAlign: 'left', fontWeight: '600', color: 'var(--text-color)' }}>Kategori</th>
                          <th style={{ padding: 'var(--space-4)', textAlign: 'left', fontWeight: '600', color: 'var(--text-color)' }}>Lager</th>
                          <th style={{ padding: 'var(--space-4)', textAlign: 'left', fontWeight: '600', color: 'var(--text-color)' }}>Pris</th>
                          <th style={{ padding: 'var(--space-4)', textAlign: 'left', fontWeight: '600', color: 'var(--text-color)' }}>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {products.map((product) => (
                          <tr key={product.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                            <td style={{ padding: 'var(--space-4)', color: 'var(--text-color)' }}>{product.name}</td>
                            <td style={{ padding: 'var(--space-4)', color: 'var(--gray-500)' }}>{product.sku}</td>
                            <td style={{ padding: 'var(--space-4)', color: 'var(--gray-500)' }}>{product.category}</td>
                            <td style={{ padding: 'var(--space-4)', color: product.stock < product.minStock ? 'var(--danger)' : 'var(--text-color)' }}>
                              {product.stock} {product.stock < product.minStock && <AlertCircle size={14} style={{ display: 'inline', marginLeft: '0.25rem' }} />}
                            </td>
                            <td style={{ padding: 'var(--space-4)', color: 'var(--text-color)' }}>kr {product.price}</td>
                            <td style={{ padding: 'var(--space-4)' }}>
                              <span style={{
                                padding: '0.25rem 0.75rem',
                                borderRadius: 'var(--radius-full)',
                                fontSize: 'var(--font-size-sm)',
                                fontWeight: '500',
                                background: product.status === 'active' ? 'var(--success)' : 'var(--gray-100)',
                                color: product.status === 'active' ? 'white' : 'var(--gray-600)'
                              }}>
                                {product.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Inventory Tab */}
          {activeTab === 'inventory' && (
            <div>
              <h2 style={{ fontSize: 'var(--font-size-xl)', fontWeight: '600', color: 'var(--text-color)', marginBottom: '1rem' }}>
                Lager
              </h2>
              <p style={{ color: 'var(--gray-500)', marginBottom: '2rem' }}>
                Oversikt over lagerbeholdning og lagerverdi.
              </p>
              
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
                <div className="card">
                  <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--gray-500)', marginBottom: '0.5rem' }}>Total lagerverdi</div>
                  <div style={{ fontSize: 'var(--font-size-2xl)', fontWeight: '700', color: 'var(--text-color)' }}>
                    kr {stats.inventoryValue.toLocaleString()}
                  </div>
                </div>
                <div className="card">
                  <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--gray-500)', marginBottom: '0.5rem' }}>Totale produkter</div>
                  <div style={{ fontSize: 'var(--font-size-2xl)', fontWeight: '700', color: 'var(--text-color)' }}>
                    {products.length}
                  </div>
                </div>
                <div className="card">
                  <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--gray-500)', marginBottom: '0.5rem' }}>Lavt lager</div>
                  <div style={{ fontSize: 'var(--font-size-2xl)', fontWeight: '700', color: 'var(--danger)' }}>
                    {products.filter(p => p.stock < p.minStock).length}
                  </div>
                </div>
              </div>

              {products.filter(p => p.stock < p.minStock).length > 0 && (
                <div className="card" style={{ background: 'var(--warning)', color: 'white', marginBottom: '2rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <AlertTriangle size={20} />
                    <strong>Advarsel: {products.filter(p => p.stock < p.minStock).length} produkter har lavt lager</strong>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Invoicing Tab */}
          {activeTab === 'invoicing' && (
            <div>
              <h2 style={{ fontSize: 'var(--font-size-xl)', fontWeight: '600', color: 'var(--text-color)', marginBottom: '1rem' }}>
                Fakturering
              </h2>
              <p style={{ color: 'var(--gray-500)', marginBottom: '2rem' }}>
                Administrer fakturaer og betalingsstatus.
              </p>
              
              {invoices.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--gray-500)' }}>
                  <FileText size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
                  <p>Ingen fakturaer funnet</p>
                </div>
              ) : (
                <div className="card" style={{ padding: 0 }}>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ background: 'var(--gray-50)', borderBottom: '1px solid var(--border-color)' }}>
                          <th style={{ padding: 'var(--space-4)', textAlign: 'left', fontWeight: '600', color: 'var(--text-color)' }}>Fakturanummer</th>
                          <th style={{ padding: 'var(--space-4)', textAlign: 'left', fontWeight: '600', color: 'var(--text-color)' }}>Kunde</th>
                          <th style={{ padding: 'var(--space-4)', textAlign: 'left', fontWeight: '600', color: 'var(--text-color)' }}>Beløp</th>
                          <th style={{ padding: 'var(--space-4)', textAlign: 'left', fontWeight: '600', color: 'var(--text-color)' }}>Status</th>
                          <th style={{ padding: 'var(--space-4)', textAlign: 'left', fontWeight: '600', color: 'var(--text-color)' }}>Forfallsdato</th>
                        </tr>
                      </thead>
                      <tbody>
                        {invoices.map((invoice) => (
                          <tr key={invoice.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                            <td style={{ padding: 'var(--space-4)', color: 'var(--text-color)' }}>{invoice.id}</td>
                            <td style={{ padding: 'var(--space-4)', color: 'var(--text-color)' }}>{invoice.customer}</td>
                            <td style={{ padding: 'var(--space-4)', color: 'var(--text-color)' }}>kr {invoice.amount.toLocaleString()}</td>
                            <td style={{ padding: 'var(--space-4)' }}>
                              <span style={{
                                padding: '0.25rem 0.75rem',
                                borderRadius: 'var(--radius-full)',
                                fontSize: 'var(--font-size-sm)',
                                fontWeight: '500',
                                background: invoice.status === 'paid' ? 'var(--success)' : invoice.status === 'overdue' ? 'var(--danger)' : 'var(--warning)',
                                color: 'white'
                              }}>
                                {invoice.status}
                              </span>
                            </td>
                            <td style={{ padding: 'var(--space-4)', color: 'var(--gray-500)' }}>
                              {invoice.dueDate}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Finance Tab */}
          {activeTab === 'finance' && (
            <div>
              <h2 style={{ fontSize: 'var(--font-size-xl)', fontWeight: '600', color: 'var(--text-color)', marginBottom: '1rem' }}>
                Finans
              </h2>
              <p style={{ color: 'var(--gray-500)', marginBottom: '2rem' }}>
                Oversikt over finansielle nøkkeltall og betalinger.
              </p>
              
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
                <div className="card">
                  <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--gray-500)', marginBottom: '0.5rem' }}>Månedlig omsetning</div>
                  <div style={{ fontSize: 'var(--font-size-2xl)', fontWeight: '700', color: 'var(--success)' }}>
                    kr {stats.monthlyRevenue.toLocaleString()}
                  </div>
                </div>
                <div className="card">
                  <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--gray-500)', marginBottom: '0.5rem' }}>Ventende fakturaer</div>
                  <div style={{ fontSize: 'var(--font-size-2xl)', fontWeight: '700', color: 'var(--warning)' }}>
                    {stats.pendingInvoices}
                  </div>
                </div>
              </div>

              {payments.length > 0 && (
                <div className="card" style={{ padding: 0 }}>
                  <h3 style={{ padding: '1rem', fontSize: 'var(--font-size-lg)', fontWeight: '600', color: 'var(--text-color)', borderBottom: '1px solid var(--border-color)' }}>
                    Siste betalinger
                  </h3>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ background: 'var(--gray-50)', borderBottom: '1px solid var(--border-color)' }}>
                          <th style={{ padding: 'var(--space-4)', textAlign: 'left', fontWeight: '600', color: 'var(--text-color)' }}>Dato</th>
                          <th style={{ padding: 'var(--space-4)', textAlign: 'left', fontWeight: '600', color: 'var(--text-color)' }}>Faktura</th>
                          <th style={{ padding: 'var(--space-4)', textAlign: 'left', fontWeight: '600', color: 'var(--text-color)' }}>Beløp</th>
                          <th style={{ padding: 'var(--space-4)', textAlign: 'left', fontWeight: '600', color: 'var(--text-color)' }}>Metode</th>
                          <th style={{ padding: 'var(--space-4)', textAlign: 'left', fontWeight: '600', color: 'var(--text-color)' }}>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {payments.slice(0, 10).map((payment: any) => (
                          <tr key={payment.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                            <td style={{ padding: 'var(--space-4)', color: 'var(--gray-500)' }}>
                              {payment.date || payment.createdAt?.toDate?.()?.toLocaleDateString() || 'N/A'}
                            </td>
                            <td style={{ padding: 'var(--space-4)', color: 'var(--text-color)' }}>{payment.invoiceId}</td>
                            <td style={{ padding: 'var(--space-4)', color: 'var(--text-color)' }}>kr {payment.amount.toLocaleString()}</td>
                            <td style={{ padding: 'var(--space-4)', color: 'var(--gray-500)' }}>{payment.method}</td>
                            <td style={{ padding: 'var(--space-4)' }}>
                              <span style={{
                                padding: '0.25rem 0.75rem',
                                borderRadius: 'var(--radius-full)',
                                fontSize: 'var(--font-size-sm)',
                                fontWeight: '500',
                                background: payment.status === 'completed' ? 'var(--success)' : 'var(--gray-100)',
                                color: payment.status === 'completed' ? 'white' : 'var(--gray-600)'
                              }}>
                                {payment.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}