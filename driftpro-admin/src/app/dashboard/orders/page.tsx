'use client';

import React, { useState, useEffect } from 'react';
import { 
  ShoppingCart, Plus, Edit, Trash2, Eye, Search, Filter, X, Check,
  Clock, AlertTriangle, Package, User, Phone, Mail, MapPin, Calendar,
  DollarSign, FileText, CheckCircle, Truck, Weight, Building, TrendingUp, BarChart
} from 'lucide-react';
import { collection, addDoc, getDocs, serverTimestamp, query, orderBy, where, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { services } from '@/lib/bud-priser-data';
import { useAuth } from '@/contexts/AuthContext';
import ProductLabelModal from '@/components/ProductLabelModal';

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
  products: {
    serviceId: string;
    serviceName: string;
    serviceDescription: string;
    serviceCategory: string;
    price: number;
    quantity: number;
  }[];
  priority: 'low' | 'medium' | 'high';
  noteToPlanner?: string;
  returnType?: 'none' | 'old_item' | 'disposal';
  returnDescription?: string;
  returnOrderId?: string;
  totalProducts: number;
  status: 'pending' | 'assigned' | 'in_progress' | 'completed' | 'cancelled';
  createdAt: any;
  companyId: string;
}

export default function OrdersPage() {
  const { userProfile } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showLabelModal, setShowLabelModal] = useState(false);
  const [activeTab, setActiveTab] = useState('orders');
  const [isLoading, setIsLoading] = useState(true);
  const [generatedLabels, setGeneratedLabels] = useState<any[]>([]);


  // New order form state
  const [newOrder, setNewOrder] = useState({
    customerName: '',
    customerPhone: '',
    customerAddress: '',
    customerEmail: '',
    deliveryDate: '',
    deliveryTimeTo: '',
    selectedService: '',
    servicePrice: 0,
    noteToPlanner: '',
    priority: 'medium' as 'low' | 'medium' | 'high',
    returnType: 'none' as 'none' | 'old_item' | 'disposal',
    returnDescription: '',
    returnOrderId: '',
    products: [{ service: '', price: 0, quantity: 1 }]
  });

  // Add new product/service
  const addProduct = () => {
    setNewOrder(prev => ({
      ...prev,
      products: [...prev.products, { service: '', price: 0, quantity: 1 }]
    }));
  };

  // Remove product/service
  const removeProduct = (index: number) => {
    if (newOrder.products?.length > 1) {
      setNewOrder(prev => ({
        ...prev,
        products: prev.products.filter((_, i) => i !== index)
      }));
    }
  };

  // Update product/service
  const updateProduct = (index: number, field: string, value: any) => {
    setNewOrder(prev => ({
      ...prev,
      products: prev.products.map((product, i) => 
        i === index ? { ...product, [field]: value } : product
      )
    }));
  };

  // Time interval options (2-hour intervals)
  const timeIntervals = [
    { value: '07:00', label: '07:00' },
    { value: '09:00', label: '09:00' },
    { value: '11:00', label: '11:00' },
    { value: '13:00', label: '13:00' },
    { value: '15:00', label: '15:00' },
    { value: '17:00', label: '17:00' },
    { value: '19:00', label: '19:00' },
    { value: '21:00', label: '21:00' }
  ];

  // Load orders from Firestore
  const loadOrders = async () => {
    if (!db || !userProfile?.companyId) return;
    try {
      setLoading(true);
      const ordersQuery = query(
        collection(db, 'orders'),
        where('companyId', '==', userProfile.companyId)
      );
      const querySnapshot = await getDocs(ordersQuery);
      const loadedOrders: Order[] = [];
      
      querySnapshot.forEach((doc) => {
        loadedOrders.push({ id: doc.id, ...doc.data() } as Order);
      });
      
      // Sort in memory by createdAt descending
      loadedOrders.sort((a, b) => {
        const aTime = a.createdAt?.toDate?.() || new Date(a.createdAt || 0);
        const bTime = b.createdAt?.toDate?.() || new Date(b.createdAt || 0);
        return bTime.getTime() - aTime.getTime();
      });
      
      setOrders(loadedOrders);
      console.log(`✅ Lastet ${loadedOrders.length} ordrer fra Firebase`);
    } catch (error) {
      console.error('Error loading orders:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    loadOrders();
    // Simulate loading data
    setTimeout(() => {
      setIsLoading(false);
    }, 1000);
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Laster ordrer...</span>
      </div>
    );
  }


  // Generate unique order number (8 digits starting with 1 for regular orders)
  const generateOrderNumber = (isReturn: boolean = false) => {
    const prefix = isReturn ? '2' : '1';
    // Generate 7 random digits after the prefix
    const random = Math.floor(Math.random() * 10000000).toString().padStart(7, '0');
    return `${prefix}${random}`;
  };

  // Generate unique 8-digit document number
  const generateDocumentNumber = (isReturn: boolean = false) => {
    const prefix = isReturn ? '2' : '1';
    // Generate 7 random digits after the prefix
    const random = Math.floor(Math.random() * 10000000).toString().padStart(7, '0');
    return `${prefix}${random}`;
  };

  // Generate unique QR code for each product
  const generateQRCode = (orderNumber: string, productIndex: number) => {
    const timestamp = Date.now().toString();
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `QR-${orderNumber}-${productIndex}-${timestamp.slice(-6)}-${random}`;
  };

  // Generate product labels with QR codes
  const generateProductLabels = async (orderData: any) => {
    if (!db) return;
    
    try {
      const labels = [];
      
      for (let i = 1; i <= orderData.totalProducts; i++) {
        const qrCode = generateQRCode(orderData.orderNumber, i);
        
        const labelData = {
          orderNumber: orderData.orderNumber,
          documentNumber: orderData.documentNumber,
          productIndex: i,
          qrCode: qrCode,
          customerName: orderData.customerName,
          customerAddress: orderData.customerAddress,
          serviceName: orderData.products[0]?.serviceName || 'N/A',
          createdAt: serverTimestamp(),
          companyId: userProfile?.companyId || ''
        };
        
        // Save QR code to database
        await addDoc(collection(db, 'productLabels'), labelData);
        
        labels.push({
          ...labelData,
          id: `label-${orderData.orderNumber}-${i}`
        });
      }
      
      console.log(`✅ ${orderData.totalProducts} skannelapper generert for ordre ${orderData.orderNumber}`);
      return labels;
    } catch (error) {
      console.error('Feil ved generering av skannelapper:', error);
    }
  };

  // Create customer automatically from order
  const createCustomerFromOrder = async (orderData: any) => {
    if (!db) return;
    
    try {
      // Check if customer already exists (by name and address)
      const customersQuery = query(
        collection(db, 'customers'),
        where('name', '==', orderData.customerName),
        where('address', '==', orderData.customerAddress),
        where('companyId', '==', userProfile?.companyId || '')
      );
      
      const existingCustomers = await getDocs(customersQuery);
      
      if (existingCustomers.empty) {
        // Create new customer
        const customerData = {
          name: orderData.customerName,
          contactPerson: orderData.customerName,
          email: orderData.customerEmail,
          phone: orderData.customerPhone,
          address: orderData.customerAddress,
          type: 'privat', // Default to private customer
          status: 'active',
          totalOrders: 1,
          totalValue: orderData.products?.reduce((sum: number, p: any) => sum + (p.price * p.quantity), 0) || 0,
          lastOrder: orderData.deliveryDate,
          customerSince: new Date().toISOString().split('T')[0],
          rating: 5.0,
          companyId: userProfile?.companyId || '',
          createdAt: serverTimestamp(),
          orders: [orderData.orderNumber] // Track order numbers
        };
        
        await addDoc(collection(db, 'customers'), customerData);
        console.log(`✅ Ny kunde opprettet: ${orderData.customerName}`);
      } else {
        // Update existing customer
        const existingCustomer = existingCustomers.docs[0];
        const customerRef = existingCustomer.ref;
        const customerData = existingCustomer.data();
        
        const updatedData = {
          totalOrders: (customerData.totalOrders || 0) + 1,
          totalValue: (customerData.totalValue || 0) + (orderData.products?.reduce((sum: number, p: any) => sum + (p.price * p.quantity), 0) || 0),
          lastOrder: orderData.deliveryDate,
          orders: [...(customerData.orders || []), orderData.orderNumber]
        };
        
        await updateDoc(customerRef, updatedData);
        console.log(`✅ Eksisterende kunde oppdatert: ${orderData.customerName}`);
      }
    } catch (error) {
      console.error('Feil ved opprettelse av kunde:', error);
    }
  };

  // Add new order
  const handleAddOrder = async () => {
    if (!newOrder.customerName || !newOrder.customerPhone || !newOrder.customerAddress || 
        !newOrder.customerEmail || !newOrder.deliveryDate || !newOrder.deliveryTimeTo || 
        newOrder.products?.some(p => !p.service)) {
      alert('Vennligst fyll ut alle påkrevde felt');
      return;
    }

    try {
      setLoading(true);
      const isReturn = newOrder.returnType !== 'none';
      const orderNumber = generateOrderNumber(isReturn);
      const documentNumber = generateDocumentNumber(isReturn);
      
      const orderData = {
        orderNumber,
        documentNumber,
        customerName: newOrder.customerName,
        customerPhone: newOrder.customerPhone,
        customerAddress: newOrder.customerAddress,
        customerEmail: newOrder.customerEmail,
        deliveryDate: newOrder.deliveryDate,
        deliveryTimeTo: newOrder.deliveryTimeTo,
        products: newOrder.products.map(p => {
          const selectedServiceData = services.find(s => s.id === p.service);
          return {
            serviceId: p.service,
            serviceName: selectedServiceData?.name || '',
            serviceDescription: selectedServiceData?.description || '',
            serviceCategory: selectedServiceData?.category || '',
            price: p.price,
            quantity: p.quantity
          };
        }),
        noteToPlanner: newOrder.noteToPlanner || '',
        priority: newOrder.priority,
        returnType: newOrder.returnType,
        returnDescription: newOrder.returnDescription,
        returnOrderId: newOrder.returnOrderId,
        totalProducts: newOrder.products?.reduce((sum, p) => sum + p.quantity, 0) || 0,
        status: 'pending',
        companyId: userProfile?.companyId || '',
        createdAt: serverTimestamp()
      };

      if (!db) return;
      await addDoc(collection(db, 'orders'), orderData);
      
      // Generate product labels with QR codes
      const labels = await generateProductLabels(orderData);
      if (labels) {
        setGeneratedLabels(labels);
        setShowLabelModal(true);
      }
      
      // Create customer automatically
      await createCustomerFromOrder(orderData);
      
      // Reset form
      setNewOrder({
        customerName: '',
        customerPhone: '',
        customerAddress: '',
        customerEmail: '',
        deliveryDate: '',
        deliveryTimeTo: '',
        selectedService: '',
        servicePrice: 0,
        noteToPlanner: '',
        priority: 'medium',
        returnType: 'none',
        returnDescription: '',
        returnOrderId: '',
        products: [{ service: '', price: 0, quantity: 1 }]
      });
      
      setShowAddModal(false);
      await loadOrders();
      
      alert(`✅ Ordre ${orderNumber} opprettet!`);
    } catch (error) {
      console.error('Error adding order:', error);
      alert('❌ Feil ved opprettelse av ordre');
    } finally {
      setLoading(false);
    }
  };

  // Filter orders
  const filteredOrders = orders?.filter(order =>
    order.orderNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.customerAddress?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

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
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <h1 style={{
                fontSize: '1.125rem',
                fontWeight: 600,
                color: 'var(--text-color)',
                margin: '0 0 0.125rem 0',
                lineHeight: '1.3'
              }}>
                Ordre
              </h1>
              <p style={{
                fontSize: '0.8125rem',
                color: 'var(--gray-500)',
                margin: 0
              }}>
                {orders?.length || 0} ordre
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
          <div className="card-icon">
            <ShoppingCart />
          </div>
          <div>
            <h1 className="page-title">Ordre</h1>
            <p className="page-subtitle">Administrer ordre som skal planlegges for levering</p>
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
              <p style={{ color: 'var(--gray-600)', fontSize: 'var(--font-size-sm)', marginBottom: '0.5rem' }}>Totalt Ordre</p>
              <p style={{ fontSize: 'var(--font-size-2xl)', fontWeight: '600', color: 'var(--blue-600)' }}>{orders?.length || 0}</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.5rem' }}>
                <TrendingUp className="w-4 h-4 text-green-600" />
                <span style={{ color: 'var(--green-600)', fontSize: 'var(--font-size-sm)' }}>Denne måneden: {orders?.filter(o => new Date(o.createdAt?.toDate?.() || o.createdAt).getMonth() === new Date().getMonth()).length || 0}</span>
              </div>
            </div>
            <div className="card-icon" style={{ background: 'var(--blue-100)' }}>
              <ShoppingCart className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <p style={{ color: 'var(--gray-600)', fontSize: 'var(--font-size-sm)', marginBottom: '0.5rem' }}>Ventende Ordre</p>
              <p style={{ fontSize: 'var(--font-size-2xl)', fontWeight: '600', color: 'var(--orange-600)' }}>{orders?.filter(o => o.status === 'pending').length || 0}</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.5rem' }}>
                <Clock className="w-4 h-4 text-orange-600" />
                <span style={{ color: 'var(--orange-600)', fontSize: 'var(--font-size-sm)' }}>Høy prioritet: {orders?.filter(o => o.priority === 'high').length || 0}</span>
              </div>
            </div>
            <div className="card-icon" style={{ background: 'var(--orange-100)' }}>
              <Clock className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>

        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <p style={{ color: 'var(--gray-600)', fontSize: 'var(--font-size-sm)', marginBottom: '0.5rem' }}>I Gang</p>
              <p style={{ fontSize: 'var(--font-size-2xl)', fontWeight: '600', color: 'var(--green-600)' }}>{orders?.filter(o => o.status === 'in_progress').length || 0}</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.5rem' }}>
                <Truck className="w-4 h-4 text-green-600" />
                <span style={{ color: 'var(--green-600)', fontSize: 'var(--font-size-sm)' }}>Levert: {orders?.filter(o => o.status === 'completed').length || 0}</span>
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
              <p style={{ color: 'var(--gray-600)', fontSize: 'var(--font-size-sm)', marginBottom: '0.5rem' }}>Totalt Verdi</p>
              <p style={{ fontSize: 'var(--font-size-2xl)', fontWeight: '600', color: 'var(--purple-600)' }}>{orders?.reduce((sum, o) => sum + (o.products?.reduce((pSum, p) => pSum + (p.price * p.quantity), 0) || 0), 0).toLocaleString() || '0'} kr</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.5rem' }}>
                <DollarSign className="w-4 h-4 text-purple-600" />
                <span style={{ color: 'var(--purple-600)', fontSize: 'var(--font-size-sm)' }}>Gjennomsnitt: {Math.round((orders?.reduce((sum, o) => sum + (o.products?.reduce((pSum, p) => pSum + (p.price * p.quantity), 0) || 0), 0) || 0) / Math.max(orders?.length || 1, 1))} kr</span>
              </div>
            </div>
            <div className="card-icon" style={{ background: 'var(--purple-100)' }}>
              <DollarSign className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', borderBottom: '1px solid var(--gray-200)' }}>
          {[
            { id: 'orders', name: 'Ordre', icon: ShoppingCart },
            { id: 'reports', name: 'Rapporter', icon: FileText },
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
          {activeTab === 'orders' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-6)' }}>
                <h2 style={{ fontSize: 'var(--font-size-xl)', fontWeight: '600', color: 'var(--gray-900)' }}>
                  Alle Ordre
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
                  <button className="btn btn-success" onClick={() => setShowAddModal(true)}>
                    <Plus size={16} />
                    Ny ordre
                  </button>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 'var(--space-4)' }}>
                {filteredOrders.map((order) => (
                  <div key={order.id} className="card">
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', marginBottom: '1rem' }}>
                      <div className="card-icon">
                        <FileText className="w-6 h-6" />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                          <h3 className="card-title">{order.orderNumber}</h3>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              order.priority === 'high' ? 'bg-red-100 text-red-800' :
                              order.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-blue-100 text-blue-800'
                            }`}>
                              {order.priority === 'high' ? 'Høy' : 
                               order.priority === 'medium' ? 'Middels' : 'Lav'}
                            </span>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              order.status === 'pending' ? 'bg-gray-100 text-gray-800' :
                              order.status === 'assigned' ? 'bg-green-100 text-green-800' :
                              order.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                              'bg-purple-100 text-purple-800'
                            }`}>
                              {order.status === 'pending' ? 'Venter' : 
                               order.status === 'assigned' ? 'Tildelt' : 
                               order.status === 'in_progress' ? 'I gang' : 'Fullført'}
                            </span>
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                          <User className="w-4 h-4 text-gray-400" />
                          <span className="card-text">{order.customerName}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                          <Phone className="w-4 h-4 text-gray-400" />
                          <span className="card-text">{order.customerPhone}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                          <MapPin className="w-4 h-4 text-gray-400" />
                          <span className="card-text">{order.customerAddress}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <span className="card-text">{new Date(order.deliveryDate).toLocaleDateString('nb-NO')}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '1rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Package className="w-4 h-4 text-blue-500" />
                            <span className="card-text">{order.totalProducts} produkter</span>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <div className="card-text font-medium">{order.products?.reduce((sum, p) => sum + (p.price * p.quantity), 0).toLocaleString() || '0'} kr</div>
                            <div className="card-text-sm">{order.deliveryTimeTo}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {!loading && filteredOrders.map((order) => (
            <div key={order.id} className="p-5 border border-gray-200 rounded-xl hover:border-blue-400 hover:shadow-md transition-all">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-orange-100 rounded-lg">
                    <FileText className="w-5 h-5 text-orange-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 text-lg">{order.orderNumber}</h3>
                    <p className="text-sm text-gray-600 mt-0.5">{order.customerName}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    order.priority === 'high' ? 'bg-red-100 text-red-800' :
                    order.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-blue-100 text-blue-800'
                  }`}>
                    {order.priority === 'high' ? 'Høy prioritet' : 
                     order.priority === 'medium' ? 'Middels prioritet' : 'Lav prioritet'}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    order.status === 'pending' ? 'bg-gray-100 text-gray-800' :
                    order.status === 'assigned' ? 'bg-green-100 text-green-800' :
                    order.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                    'bg-purple-100 text-purple-800'
                  }`}>
                    {order.status === 'pending' ? 'Venter' : 
                     order.status === 'assigned' ? 'Tildelt' : 
                     order.status === 'in_progress' ? 'Under levering' : 'Fullført'}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-2 mb-1">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <span className="text-xs text-gray-500 uppercase tracking-wide">Telefon</span>
                  </div>
                  <div className="font-medium text-gray-900">{order.customerPhone}</div>
                </div>
                
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-2 mb-1">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    <span className="text-xs text-gray-500 uppercase tracking-wide">Adresse</span>
                  </div>
                  <div className="font-medium text-gray-900 truncate">{order.customerAddress}</div>
                </div>

                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-2 mb-1">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span className="text-xs text-gray-500 uppercase tracking-wide">Levering</span>
                  </div>
                  <div className="font-medium text-gray-900">{order.deliveryDate}</div>
                  <div className="text-xs text-gray-600">{order.deliveryTimeTo}</div>
                </div>

                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-2 mb-1">
                    <Package className="w-4 h-4 text-gray-400" />
                    <span className="text-xs text-gray-500 uppercase tracking-wide">Produkter</span>
                  </div>
                  <div className="font-medium text-gray-900">{order.totalProducts || 1} stk</div>
                  <div className="text-xs text-gray-600">
                    {order.products?.length > 0 ? 
                      `${order.products?.length} ${order.products?.length === 1 ? 'tjeneste' : 'tjenester'}` : 
                      'Med QR-koder'
                    }
                  </div>
                </div>
              </div>

              {order.noteToPlanner && (
                <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                  <span className="text-xs font-medium text-blue-900">Notat til planlegger:</span>
                  <p className="text-sm text-blue-800 mt-1">{order.noteToPlanner}</p>
                </div>
              )}

              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  Opprettet: {order.createdAt?.toDate?.()?.toLocaleDateString('no-NO') || 'N/A'}
                </div>
                <div className="flex items-center space-x-2">
                  <button className="btn btn-sm btn-secondary">
                    <Eye className="w-4 h-4" />
                    Se Detaljer
                  </button>
                  <button className="btn btn-sm btn-primary">
                    <Edit className="w-4 h-4" />
                    Rediger
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add Order Modal */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2 className="modal-title">Ny Ordre</h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="modal-close"
              >
                ×
              </button>
            </div>

            <div className="modal-body">
              <div className="form-grid">
                {/* Customer Information */}
                <div className="form-group">
                  <label className="form-label">Kundenavn *</label>
                  <input
                    type="text"
                    value={newOrder.customerName}
                    onChange={(e) => setNewOrder({...newOrder, customerName: e.target.value})}
                    className="form-input"
                    placeholder="Skriv inn kundenavn"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Telefonnummer *</label>
                  <input
                    type="tel"
                    value={newOrder.customerPhone}
                    onChange={(e) => setNewOrder({...newOrder, customerPhone: e.target.value})}
                    className="form-input"
                    placeholder="+47 123 45 678"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Full Adresse *</label>
                  <input
                    type="text"
                    value={newOrder.customerAddress}
                    onChange={(e) => setNewOrder({...newOrder, customerAddress: e.target.value})}
                    className="form-input"
                    placeholder="Gateadresse, postnummer, sted"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">E-post *</label>
                  <input
                    type="email"
                    value={newOrder.customerEmail}
                    onChange={(e) => setNewOrder({...newOrder, customerEmail: e.target.value})}
                    className="form-input"
                    placeholder="kunde@example.com"
                    required
                  />
                </div>

                {/* Delivery Information */}
                <div className="form-group">
                  <label className="form-label">Leveringsdato *</label>
                  <input
                    type="date"
                    value={newOrder.deliveryDate}
                    onChange={(e) => setNewOrder({...newOrder, deliveryDate: e.target.value})}
                    className="form-input"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Tid slutt for levering *</label>
                  <select
                    value={newOrder.deliveryTimeTo}
                    onChange={(e) => setNewOrder({...newOrder, deliveryTimeTo: e.target.value})}
                    className="form-input"
                    required
                  >
                    <option value="">Velg tid</option>
                    {timeIntervals.map(interval => (
                      <option key={interval.value} value={interval.value}>
                        {interval.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Services from Bud Pris */}
                <div className="form-group">
                  <label className="form-label">Produkter/Tjenester *</label>
                  <div className="space-y-3">
                    {newOrder.products?.map((product, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-700">
                            Produkt {index + 1}
                          </span>
                          {newOrder.products?.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeProduct(index)}
                              className="text-red-500 hover:text-red-700 text-sm"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                        
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                              Tjeneste
                            </label>
                            <select
                              value={product.service}
                              onChange={(e) => {
                                const selectedService = services.find(s => s.id === e.target.value);
                                updateProduct(index, 'service', e.target.value);
                                updateProduct(index, 'price', selectedService ? selectedService.basePrice : 0);
                              }}
                              className="form-input text-sm"
                              required
                            >
                              <option value="">Velg tjeneste</option>
                              {services.map(service => (
                                <option key={service.id} value={service.id}>
                                  {service.name} - {service.basePrice}kr
                                </option>
                              ))}
                            </select>
                          </div>
                          
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                              Antall
                            </label>
                            <input
                              type="number"
                              min="1"
                              max="100"
                              value={product.quantity}
                              onChange={(e) => updateProduct(index, 'quantity', parseInt(e.target.value) || 1)}
                              className="form-input text-sm"
                              required
                            />
                          </div>
                        </div>
                        
                        {product.price > 0 && (
                          <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded">
                            <span className="text-xs font-medium text-green-800">
                              Pris: {product.price}kr × {product.quantity} = {product.price * product.quantity}kr
                            </span>
                          </div>
                        )}
                      </div>
                    ))}
                    
                    <button
                      type="button"
                      onClick={addProduct}
                      className="w-full p-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-gray-400 hover:text-gray-600 transition-colors text-sm"
                    >
                      <Plus className="w-4 h-4 inline mr-1" />
                      Legg til flere produkter/tjenester
                    </button>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Prioritet</label>
                  <select
                    value={newOrder.priority}
                    onChange={(e) => setNewOrder({...newOrder, priority: e.target.value as 'low' | 'medium' | 'high'})}
                    className="form-input"
                  >
                    <option value="low">Lav</option>
                    <option value="medium">Middels</option>
                    <option value="high">Høy</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Notat til ruteplanlegger</label>
                  <textarea
                    value={newOrder.noteToPlanner}
                    onChange={(e) => setNewOrder({...newOrder, noteToPlanner: e.target.value})}
                    className="form-input"
                    placeholder="Eventuelle spesielle instruksjoner..."
                    rows={3}
                  />
                </div>

                {/* Return Information */}
                <div className="form-group">
                  <label className="form-label">Retur av gammel vare?</label>
                  <select
                    value={newOrder.returnType}
                    onChange={(e) => setNewOrder({...newOrder, returnType: e.target.value as 'none' | 'old_item' | 'disposal'})}
                    className="form-input"
                  >
                    <option value="none">Ingen retur</option>
                    <option value="old_item">Retur av gammel vare</option>
                    <option value="disposal">Retur til kast</option>
                  </select>
                </div>

                {newOrder.returnType !== 'none' && (
                  <>
                    <div className="form-group">
                      <label className="form-label">
                        {newOrder.returnType === 'old_item' ? 'Beskrivelse av gammel vare' : 'Beskrivelse av retur til kast'}
                      </label>
                      <textarea
                        value={newOrder.returnDescription}
                        onChange={(e) => setNewOrder({...newOrder, returnDescription: e.target.value})}
                        className="form-input"
                        placeholder={newOrder.returnType === 'old_item' ? 'Beskriv hvilken gammel vare som skal returneres...' : 'Beskriv hva som skal kastes...'}
                        rows={2}
                      />
                    </div>

                    {newOrder.returnType === 'old_item' && (
                      <div className="form-group">
                        <label className="form-label">Tidligere ordre (valgfritt)</label>
                        <select
                          value={newOrder.returnOrderId}
                          onChange={(e) => setNewOrder({...newOrder, returnOrderId: e.target.value})}
                          className="form-input"
                        >
                          <option value="">Velg tidligere ordre</option>
                          {orders.map(order => (
                            <option key={order.id} value={order.id}>
                              {order.orderNumber} - {order.customerName} ({order.deliveryDate})
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            <div className="modal-footer">
              <button
                onClick={() => setShowAddModal(false)}
                className="btn btn-secondary"
              >
                Avbryt
              </button>
              <button
                onClick={handleAddOrder}
                className="btn btn-primary"
                disabled={loading}
              >
                {loading ? 'Oppretter...' : 'Opprett Ordre'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Product Label Modal */}
      <ProductLabelModal
        isOpen={showLabelModal}
        onClose={() => setShowLabelModal(false)}
        labels={generatedLabels}
      />
    </div>
  );
}
