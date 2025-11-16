'use client';

import React, { useState, useEffect } from 'react';
import { 
  Truck, 
  QrCode, 
  Camera,
  CheckCircle,
  XCircle,
  Clock,
  MapPin,
  Phone,
  Mail,
  Package,
  Navigation,
  Activity,
  AlertTriangle,
  RefreshCw,
  Download,
  Upload,
  Eye,
  Edit,
  MoreHorizontal,
  Search,
  Filter,
  Plus,
  X,
  Check,
  ArrowRight,
  ArrowLeft,
  RotateCcw,
  Play,
  Pause,
  Square
} from 'lucide-react';

export default function DeliverySystemPage() {
  const [isMobile, setIsMobile] = useState(false);
  const [deliveries, setDeliveries] = useState([
    {
      id: 'DEL-2024-001',
      orderId: 'ORD-2024-001',
      customer: 'Acme Corporation',
      customerPhone: '+47 123 45 678',
      deliveryAddress: 'Leveringsadresse 456, 0123 Oslo',
      deliveryDate: '2024-01-20',
      scheduledTime: '10:00',
      actualTime: null,
      driver: 'Lars Andersen',
      driverPhone: '+47 555 66 777',
      vehicle: 'Mercedes Sprinter - ABC123',
      status: 'assigned',
      items: [
        { name: 'Premium Laptop', quantity: 5, scanned: false },
        { name: 'Office Chair', quantity: 10, scanned: false }
      ],
      specialInstructions: 'Ring før levering',
      coordinates: { lat: 59.9139, lng: 10.7522 },
      qrCode: 'QR-DEL-2024-001-ABC123',
      signature: null,
      photo: null,
      notes: ''
    },
    {
      id: 'DEL-2024-002',
      orderId: 'ORD-2024-002',
      customer: 'Tech Solutions AS',
      customerPhone: '+47 987 65 432',
      deliveryAddress: 'Leveringsadresse 789, 5432 Bergen',
      deliveryDate: '2024-01-22',
      scheduledTime: '14:00',
      actualTime: null,
      driver: 'Maria Berg',
      driverPhone: '+47 444 55 666',
      vehicle: 'Volvo FL - DEF456',
      status: 'in_transit',
      items: [
        { name: 'Wireless Mouse', quantity: 20, scanned: true }
      ],
      specialInstructions: 'Lever på kontoret',
      coordinates: { lat: 60.3913, lng: 5.3221 },
      qrCode: 'QR-DEL-2024-002-DEF456',
      signature: null,
      photo: null,
      notes: ''
    }
  ]);

  const [currentDelivery, setCurrentDelivery] = useState(null);
  const [showScanner, setShowScanner] = useState(false);
  const [showSignature, setShowSignature] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [scanResult, setScanResult] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showMap, setShowMap] = useState(true);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const filteredDeliveries = deliveries.filter(delivery => {
    const matchesSearch = delivery.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         delivery.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         delivery.orderId.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || delivery.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'assigned': return 'text-blue-600 bg-blue-50';
      case 'in_transit': return 'text-purple-600 bg-purple-50';
      case 'delivered': return 'text-green-600 bg-green-50';
      case 'failed': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'assigned': return 'Tildelt';
      case 'in_transit': return 'Under transport';
      case 'delivered': return 'Levert';
      case 'failed': return 'Feilet';
      default: return status;
    }
  };

  const scanQRCode = () => {
    setShowScanner(true);
    // Simuler QR-scanning
    setTimeout(() => {
      const delivery = deliveries.find(d => d.qrCode === 'QR-DEL-2024-001-ABC123');
      if (delivery) {
        setCurrentDelivery(delivery);
        setScanResult(delivery.qrCode);
        setShowScanner(false);
      }
    }, 2000);
  };

  const markAsDelivered = (deliveryId: string) => {
    setDeliveries(deliveries.map(delivery => 
      delivery.id === deliveryId 
        ? { 
            ...delivery, 
            status: 'delivered', 
            actualTime: new Date().toLocaleTimeString('nb-NO', { hour: '2-digit', minute: '2-digit' }),
            signature: 'signature_data_here',
            photo: 'photo_data_here'
          }
        : delivery
    ));
  };

  const totalDeliveries = deliveries.length;
  const assignedDeliveries = deliveries.filter(d => d.status === 'assigned').length;
  const inTransitDeliveries = deliveries.filter(d => d.status === 'in_transit').length;
  const deliveredToday = deliveries.filter(d => d.status === 'delivered' && new Date(d.deliveryDate).toDateString() === new Date().toDateString()).length;

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'var(--background-color)',
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
          <h1 style={{
            fontSize: '1.125rem',
            fontWeight: 600,
            color: 'var(--text-color)',
            margin: 0,
            lineHeight: '1.3'
          }}>
            Leveringssystem
          </h1>
        </div>
      )}

      {/* Desktop Header */}
      {!isMobile && (
        <div className="page-header">
          <div className="flex items-center space-x-3">
            <div className="card-icon">
              <Truck className="w-6 h-6" />
            </div>
            <div>
              <h1 className="page-title">Leveringssystem for Samarbeidspartnere</h1>
              <p className="page-subtitle">Live tracking, scanning og leveringsbekreftelse</p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Search className="w-4 h-4 text-gray-500" />
              <input
                type="text"
                placeholder="Søk leveringer..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <select 
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">Alle status</option>
                <option value="assigned">Tildelt</option>
                <option value="in_transit">Under transport</option>
                <option value="delivered">Levert</option>
                <option value="failed">Feilet</option>
              </select>
            </div>
            <button
          onClick={scanQRCode}
          className="btn btn-primary"
        >
          <QrCode className="w-4 h-4" />
          Skann QR-kode
        </button>
        <button 
          onClick={() => setShowMap(!showMap)}
          className="btn btn-secondary"
        >
          <MapPin className="w-4 h-4" />
              {showMap ? 'Liste' : 'Kart'}
            </button>
            <button 
              onClick={() => window.location.reload()}
              className="btn btn-warning"
            >
              <RefreshCw className="w-4 h-4" />
              Oppdater
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
          <div style={{
            display: 'flex',
            gap: '0.5rem',
            alignItems: 'center'
          }}>
            <div style={{
              flex: 1,
              position: 'relative',
              display: 'flex',
              alignItems: 'center'
            }}>
              <Search size={18} style={{ position: 'absolute', left: '0.75rem', color: 'var(--gray-500)' }} />
              <input
                type="text"
                placeholder="Søk leveringer..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem 0.75rem 0.75rem 2.5rem',
                  border: '1px solid var(--border-color)',
                  borderRadius: '0.5rem',
                  fontSize: '16px',
                  background: 'var(--card-background)',
                  color: 'var(--text-color)'
                }}
              />
            </div>
            <button
              onClick={scanQRCode}
              className="btn btn-primary"
              style={{
                minHeight: '44px',
                minWidth: '44px',
                padding: '0.75rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <QrCode size={20} />
            </button>
          </div>
          <select 
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            style={{
              width: '100%',
              padding: '0.75rem',
              border: '1px solid var(--border-color)',
              borderRadius: '0.5rem',
              fontSize: '16px',
              background: 'var(--card-background)',
              color: 'var(--text-color)'
            }}
          >
            <option value="all">Alle status</option>
            <option value="assigned">Tildelt</option>
            <option value="in_transit">Under transport</option>
            <option value="delivered">Levert</option>
            <option value="failed">Feilet</option>
          </select>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-6">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Totalt leveringer</p>
              <p className="text-2xl font-bold text-gray-900">{totalDeliveries}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <Package className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Tildelt</p>
              <p className="text-2xl font-bold text-blue-600">{assignedDeliveries}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <Clock className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Under transport</p>
              <p className="text-2xl font-bold text-purple-600">{inTransitDeliveries}</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-lg">
              <Truck className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Levert i dag</p>
              <p className="text-2xl font-bold text-green-600">{deliveredToday}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Current Delivery Card */}
      {currentDelivery && (
        <div className="card mt-6 bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Aktiv levering</h3>
              <p className="text-sm text-gray-600">{currentDelivery.id} - {currentDelivery.customer}</p>
            </div>
            <div className="flex items-center space-x-2">
              <button 
                onClick={() => setShowSignature(true)}
                className="btn btn-success"
              >
                <CheckCircle className="w-4 h-4" />
                Bekreft levering
              </button>
              <button 
                onClick={() => setShowCamera(true)}
                className="btn btn-secondary"
              >
                <Camera className="w-4 h-4" />
                Ta bilde
              </button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Kundeinfo</h4>
              <div className="space-y-1 text-sm text-gray-600">
                <div className="flex items-center space-x-2">
                  <Phone className="w-4 h-4" />
                  <span>{currentDelivery.customerPhone}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <MapPin className="w-4 h-4" />
                  <span>{currentDelivery.deliveryAddress}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4" />
                  <span>Planlagt: {currentDelivery.scheduledTime}</span>
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Produkter</h4>
              <div className="space-y-2">
                {currentDelivery.items.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-white rounded border">
                    <span className="text-sm font-medium">{item.name}</span>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-600">x{item.quantity}</span>
                      {item.scanned ? (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      ) : (
                        <XCircle className="w-4 h-4 text-gray-400" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Instruksjoner</h4>
              <p className="text-sm text-gray-600 mb-3">{currentDelivery.specialInstructions}</p>
              <div className="text-xs text-gray-500">
                QR-kode: {currentDelivery.qrCode}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Map View */}
      {showMap && (
        <div className="card mt-6">
          <div className="h-96 bg-gray-100 rounded-lg flex items-center justify-center">
            <div className="text-center">
              <MapPin className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-700 mb-2">Live Tracking Kart</h3>
              <p className="text-gray-500 mb-4">Integrer med GPS for sanntids tracking av leveringer</p>
              <div className="flex items-center justify-center space-x-4">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <span className="text-sm text-gray-600">Tildelt</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                  <span className="text-sm text-gray-600">Under transport</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-gray-600">Levert</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Deliveries List */}
      <div className="card mt-6">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-medium text-gray-900">Levering-ID</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Ordre</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Kunde</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Adresse</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Tid</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Sjåfør</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Status</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Handlinger</th>
              </tr>
            </thead>
            <tbody>
              {filteredDeliveries.map((delivery) => (
                <tr key={delivery.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <div>
                      <span className="font-medium text-blue-600">{delivery.id}</span>
                      <div className="text-sm text-gray-500">{delivery.qrCode}</div>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className="font-medium text-gray-900">{delivery.orderId}</span>
                  </td>
                  <td className="py-3 px-4">
                    <div>
                      <div className="font-medium text-gray-900">{delivery.customer}</div>
                      <div className="text-sm text-gray-600">{delivery.customerPhone}</div>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="max-w-xs">
                      <div className="text-sm text-gray-900">{delivery.deliveryAddress}</div>
                      <div className="text-xs text-gray-500 mt-1">
                        📍 {delivery.coordinates.lat.toFixed(4)}, {delivery.coordinates.lng.toFixed(4)}
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        Planlagt: {delivery.scheduledTime}
                      </div>
                      {delivery.actualTime && (
                        <div className="text-sm text-green-600">
                          Faktisk: {delivery.actualTime}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{delivery.driver}</div>
                      <div className="text-xs text-gray-500">{delivery.vehicle}</div>
                      <div className="text-xs text-gray-500">{delivery.driverPhone}</div>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(delivery.status)}`}>
                      {getStatusText(delivery.status)}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center space-x-2">
                      <button 
                        onClick={() => setCurrentDelivery(delivery)}
                        className="p-1 hover:bg-gray-100 rounded" 
                        title="Start levering"
                      >
                        <Play className="w-4 h-4 text-blue-500" />
                      </button>
                      <button className="p-1 hover:bg-gray-100 rounded" title="Naviger">
                        <Navigation className="w-4 h-4 text-gray-500" />
                      </button>
                      <button 
                        onClick={() => markAsDelivered(delivery.id)}
                        className="p-1 hover:bg-gray-100 rounded" 
                        title="Marker som levert"
                      >
                        <CheckCircle className="w-4 h-4 text-green-500" />
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

      {/* QR Scanner Modal */}
      {showScanner && (
        <div className="modal-overlay">
          <div className="modal-content max-w-md">
            <div className="modal-header">
              <h2 className="modal-title">QR-kode skanner</h2>
              <button 
                onClick={() => setShowScanner(false)}
                className="modal-close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="modal-body text-center">
              <div className="w-64 h-64 bg-gray-100 rounded-lg mx-auto mb-4 flex items-center justify-center">
                <QrCode className="w-16 h-16 text-gray-400" />
              </div>
              <p className="text-gray-600 mb-4">Hold kameraet over QR-koden</p>
              <div className="animate-pulse">
                <div className="text-sm text-blue-600">Skanner...</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Signature Modal */}
      {showSignature && (
        <div className="modal-overlay">
          <div className="modal-content max-w-lg">
            <div className="modal-header">
              <h2 className="modal-title">Leveringsbekreftelse</h2>
              <button 
                onClick={() => setShowSignature(false)}
                className="modal-close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="modal-body">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Mottakers signatur</label>
                  <div className="w-full h-32 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
                    <div className="text-center">
                      <Edit className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-500">Tegn signatur her</p>
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notater</label>
                  <textarea 
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows={3}
                    placeholder="Legg til notater om leveringen..."
                  />
                </div>
                <div className="flex items-center justify-end space-x-3 pt-4">
                  <button 
                    type="button"
                    onClick={() => setShowSignature(false)}
                    className="btn btn-secondary"
                  >
                    Avbryt
                  </button>
                  <button 
                    type="submit"
                    className="btn btn-success"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Bekreft levering
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Camera Modal */}
      {showCamera && (
        <div className="modal-overlay">
          <div className="modal-content max-w-md">
            <div className="modal-header">
              <h2 className="modal-title">Ta bilde</h2>
              <button 
                onClick={() => setShowCamera(false)}
                className="modal-close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="modal-body text-center">
              <div className="w-full h-64 bg-gray-100 rounded-lg mb-4 flex items-center justify-center">
                <Camera className="w-16 h-16 text-gray-400" />
              </div>
              <p className="text-gray-600 mb-4">Ta bilde av leveringen</p>
              <div className="flex items-center justify-center space-x-3">
                <button className="btn btn-secondary">
                  <RotateCcw className="w-4 h-4" />
                  Flip
                </button>
                <button className="btn btn-primary">
                  <Camera className="w-4 h-4" />
                  Ta bilde
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}




















