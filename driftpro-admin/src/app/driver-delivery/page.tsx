'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  Truck, 
  MapPin, 
  Clock, 
  Package, 
  CheckCircle, 
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Camera,
  QrCode,
  Hash,
  Scan,
  Star,
  Heart,
  Zap,
  Target,
  Navigation,
  Home,
  User,
  Phone,
  Mail,
  Calendar,
  BarChart3,
  Play,
  Pause,
  RotateCcw,
  Eye,
  EyeOff,
  Download,
  Share2,
  MessageCircle,
  Bell,
  Settings,
  LogOut,
  ChevronRight,
  ChevronDown,
  Plus,
  Minus,
  X,
  Search,
  Filter,
  RefreshCw,
  Upload,
  FileText,
  Image,
  Video,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Wifi,
  WifiOff,
  Battery,
  BatteryLow,
  Signal,
  SignalHigh,
  SignalLow,
  SignalOff
} from 'lucide-react';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc, updateDoc, collection, addDoc, serverTimestamp, query, where, getDocs } from 'firebase/firestore';
import BarcodeScanner from '@/components/BarcodeScanner';

interface Driver {
  id: string;
  name: string;
  email: string;
  phone: string;
    companyName: string;
  vehicleId: string;
  vehicleName: string;
  role: 'driver';
  status: 'active' | 'inactive';
}

interface Route {
  id: string;
  routeNumber: string;
  name: string;
  driverId: string;
  driverName: string;
    companyName: string;
  vehicleId: string;
  vehicleName: string;
  status: 'assigned' | 'in_progress' | 'completed' | 'cancelled';
  startTime: string;
  endTime: string;
  totalStops: number;
  completedStops: number;
  totalDistance: number;
  totalWeight: number;
  totalVolume: number;
  freightUnits: FreightUnit[];
  createdAt: any;
  updatedAt: any;
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
  products?: any[];
  hasPhysicalProduct: boolean;
  requiresScanning: boolean;
  scannedProducts: string[];
  deliveryNotes?: string;
  proofOfDelivery?: string;
  completedAt?: string;
}

const motivationalMessages = [
  "🌟 Ha en fantastisk dag! Du er en stjerne!",
  "💪 Du klarer dette! Kom igjen!",
  "🚀 Fly høy og lever perfekt!",
  "⭐ Du er den beste sjåføren!",
  "🎯 Fokuser og gjør det bra!",
  "🔥 Du brenner for levering!",
  "💎 Du er en perle av en sjåfør!",
  "🌈 Spred glede med hver levering!",
  "⚡ Full fart fremover!",
  "🏆 Du er en mester i levering!"
];

const fieldMessages = [
  "🗺️ Felt {fieldNumber} er ditt område i dag!",
  "📍 Du er tilordnet Felt {fieldNumber} - kjenn området!",
  "🎯 Felt {fieldNumber} venter på deg!",
  "🚛 Felt {fieldNumber} er klar for levering!",
  "⭐ Felt {fieldNumber} er din arena i dag!"
];

function DriverDeliveryContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const routeId = searchParams.get('routeId');
  const viewMode = searchParams.get('view') === 'true';

  const [driver, setDriver] = useState<Driver | null>(null);
  const [route, setRoute] = useState<Route | null>(null);
  const [currentStep, setCurrentStep] = useState<'code' | 'welcome' | 'scanning' | 'delivery'>('code');
  const [routeCode, setRouteCode] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [currentStopIndex, setCurrentStopIndex] = useState(0);
  const [scannedProducts, setScannedProducts] = useState<string[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [cameraPermission, setCameraPermission] = useState<boolean | null>(null);
  const [showKeypad, setShowKeypad] = useState(false);
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Check authentication and load driver data
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push('/driver-login');
        return;
      }

      try {
        // Get driver data
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (!userDoc.exists()) {
          throw new Error('Brukerkonto ikke funnet');
        }

        const userData = userDoc.data() as Driver;
        if (userData.role !== 'driver') {
          throw new Error('Denne kontoen er ikke en sjåfør-konto');
        }

        setDriver(userData);

        // If routeId is provided, load that route
        if (routeId) {
          await loadRoute(routeId);
          setCurrentStep('welcome');
        }

      } catch (error: any) {
        console.error('Error loading driver data:', error);
        setError(error.message);
      } finally {
        setIsLoading(false);
      }
    });

    return () => unsubscribe();
  }, [router, routeId]);

  const loadRoute = async (id: string) => {
    try {
      const routeDoc = await getDoc(doc(db, 'plannedRoutes', id));
      if (!routeDoc.exists()) {
        throw new Error('Rute ikke funnet');
      }

      const routeData = routeDoc.data();
      const route: Route = {
        id: routeDoc.id,
        routeNumber: routeData.routeNumber || routeDoc.id,
        name: routeData.name || `Rute ${routeDoc.id}`,
        driverId: routeData.driverId || '',
        driverName: routeData.driverName || driver?.name || 'Ukjent',
                companyName: routeData.companyName || '',
        vehicleId: routeData.vehicleId || '',
        vehicleName: routeData.vehicleName || '',
        status: routeData.status || 'assigned',
        startTime: routeData.startTime || '08:00',
        endTime: routeData.endTime || '17:00',
        totalStops: routeData.freightUnits?.length || 0,
        completedStops: routeData.completedStops || 0,
        totalDistance: routeData.totalDistance || 0,
        totalWeight: routeData.totalWeight || 0,
        totalVolume: routeData.totalVolume || 0,
        freightUnits: routeData.freightUnits || [],
        createdAt: routeData.createdAt,
        updatedAt: routeData.updatedAt
      };

      setRoute(route);
    } catch (error: any) {
      console.error('Error loading route:', error);
      setError(error.message);
    }
  };

  const handleCodeSubmit = async () => {
    if (routeCode.length !== 8 || !/^\d+$/.test(routeCode)) {
      setError('Vennligst skriv inn en gyldig 8-siffer kode');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Search for route with this code
      const routesQuery = query(
        collection(db, 'plannedRoutes'),
        where('routeNumber', '==', routeCode)
      );

      const routesSnapshot = await getDocs(routesQuery);
      
      if (routesSnapshot.empty) {
        throw new Error('Ingen rute funnet med denne koden');
      }

      const routeDoc = routesSnapshot.docs[0];
      const routeData = routeDoc.data();

      // Check if route is assigned to this driver
      if (routeData.driverId !== driver?.id) {
        throw new Error('Denne ruten er ikke tildelt deg');
      }

      await loadRoute(routeDoc.id);
      setCurrentStep('welcome');

    } catch (error: any) {
      console.error('Error finding route:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const startDelivery = () => {
    setCurrentStep('delivery');
    setCurrentStopIndex(0);
  };

  const handleScanProduct = (productId: string) => {
    if (!scannedProducts.includes(productId)) {
      setScannedProducts([...scannedProducts, productId]);
      setSuccess(`Produkt ${productId} skannet!`);
      setTimeout(() => setSuccess(null), 2000);
    }
  };

  const handleBarcodeScan = (code: string) => {
    handleScanProduct(code);
    setShowBarcodeScanner(false);
  };

  const completeStop = async () => {
    if (!route) return;

    const currentStop = route.freightUnits[currentStopIndex];
    if (!currentStop) return;

    try {
      // Update stop status
      const updatedFreightUnits = [...route.freightUnits];
      updatedFreightUnits[currentStopIndex] = {
        ...currentStop,
        status: 'delivered',
        completedAt: new Date().toISOString()
      };

      // Update route in Firebase
      await updateDoc(doc(db, 'plannedRoutes', route.id), {
        freightUnits: updatedFreightUnits,
        completedStops: route.completedStops + 1,
        status: route.completedStops + 1 === route.totalStops ? 'completed' : 'in_progress',
        updatedAt: serverTimestamp()
      });

      // Move to next stop or complete route
      if (currentStopIndex < route.freightUnits.length - 1) {
        setCurrentStopIndex(currentStopIndex + 1);
        setScannedProducts([]);
        setSuccess(`Stopp ${currentStopIndex + 1} fullført!`);
      } else {
        setSuccess('🎉 Alle leveringer fullført! Bra jobba!');
        setTimeout(() => {
          router.push('/driver-dashboard');
        }, 3000);
      }

      setTimeout(() => setSuccess(null), 2000);

    } catch (error) {
      console.error('Error completing stop:', error);
      setError('Kunne ikke fullføre stopp');
    }
  };

  const requestCameraPermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      setCameraPermission(true);
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (error) {
      console.error('Camera permission denied:', error);
      setCameraPermission(false);
    }
  };

  const startScanning = () => {
    setIsScanning(true);
    if (!cameraPermission) {
      requestCameraPermission();
    }
  };

  const stopScanning = () => {
    setIsScanning(false);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
  };

  const getMotivationalMessage = () => {
    return motivationalMessages[Math.floor(Math.random() * motivationalMessages.length)];
  };

  const getFieldMessage = (fieldNumber: string) => {
    const message = fieldMessages[Math.floor(Math.random() * fieldMessages.length)];
    return message.replace('{fieldNumber}', fieldNumber);
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push('/driver-login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Laster...</p>
        </div>
      </div>
    );
  }

  if (error && !route) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => router.push('/driver-dashboard')}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            Tilbake til Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/driver-dashboard')}
                className="p-2 text-gray-400 hover:text-gray-600"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-green-600 rounded-lg flex items-center justify-center">
                <Truck className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-gray-900">
                  {currentStep === 'code' ? 'Start Rute' : 
                   currentStep === 'welcome' ? 'Velkommen' :
                   currentStep === 'scanning' ? 'Skann Produkter' :
                   'Levering'}
                </h1>
                <p className="text-sm text-gray-500">
                  {driver?.name} • {driver?.vehicleName}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-1 text-sm text-gray-500">
                <Battery className="w-4 h-4" />
                <span>85%</span>
              </div>
              <div className="flex items-center space-x-1 text-sm text-gray-500">
                <Signal className="w-4 h-4" />
                <span>4G</span>
              </div>
              <button
                onClick={handleLogout}
                className="p-2 text-gray-400 hover:text-gray-600"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Error/Success Messages */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start">
            <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 mr-3 flex-shrink-0" />
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start">
            <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" />
            <p className="text-green-700 text-sm">{success}</p>
          </div>
        )}

        {/* Code Entry Step */}
        {currentStep === 'code' && (
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <Hash className="w-10 h-10 text-white" />
            </div>
            
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Skriv inn rute-kode
            </h2>
            <p className="text-gray-600 mb-8">
              Skriv inn 8-siffer koden du fikk fra dispatcher
            </p>

            <div className="max-w-md mx-auto">
              <div className="relative mb-6">
                <input
                  type="text"
                  value={routeCode}
                  onChange={(e) => setRouteCode(e.target.value.replace(/\D/g, '').slice(0, 8))}
                  className="w-full text-center text-3xl font-mono tracking-widest py-4 px-6 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="12345678"
                  maxLength={8}
                />
                <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                  <QrCode className="w-6 h-6 text-gray-400" />
                </div>
              </div>

              <div className="flex space-x-4 mb-6">
                <button
                  onClick={() => setShowKeypad(!showKeypad)}
                  className="flex-1 bg-gray-100 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center space-x-2"
                >
                  <Hash className="w-5 h-5" />
                  <span>Numpad</span>
                </button>
                <button
                  onClick={() => setShowBarcodeScanner(true)}
                  className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
                >
                  <Camera className="w-5 h-5" />
                  <span>Skann QR</span>
                </button>
              </div>

              <button
                onClick={handleCodeSubmit}
                disabled={routeCode.length !== 8 || isLoading}
                className="w-full bg-gradient-to-r from-blue-600 to-green-600 text-white py-4 px-6 rounded-xl font-medium hover:from-blue-700 hover:to-green-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>Søker...</span>
                  </>
                ) : (
                  <>
                    <span>Start Rute</span>
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </div>

            {/* Virtual Keypad */}
            {showKeypad && (
              <div className="max-w-xs mx-auto mt-6">
                <div className="grid grid-cols-3 gap-2">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, '⌫', 0, '✓'].map((key) => (
                    <button
                      key={key}
                      onClick={() => {
                        if (key === '⌫') {
                          setRouteCode(prev => prev.slice(0, -1));
                        } else if (key === '✓') {
                          handleCodeSubmit();
                        } else if (typeof key === 'number' && routeCode.length < 8) {
                          setRouteCode(prev => prev + key.toString());
                        }
                      }}
                      className="aspect-square bg-gray-100 hover:bg-gray-200 rounded-lg font-medium text-lg transition-colors"
                    >
                      {key}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Welcome Step */}
        {currentStep === 'welcome' && route && (
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
            <div className="w-24 h-24 bg-gradient-to-br from-green-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <Star className="w-12 h-12 text-white" />
            </div>
            
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Velkommen, {driver?.name}! 👋
            </h2>
            
            <div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-xl p-6 mb-6">
              <p className="text-lg text-gray-700 mb-2">
                {getFieldMessage('21')}
              </p>
              <p className="text-2xl font-bold text-blue-600">
                Felt 21
              </p>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 mb-8">
              <div className="flex items-center justify-center mb-2">
                <Zap className="w-6 h-6 text-yellow-600 mr-2" />
                <span className="text-lg font-semibold text-yellow-800">
                  Motiverende melding
                </span>
              </div>
              <p className="text-yellow-700 text-lg">
                {getMotivationalMessage()}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <div className="bg-blue-50 rounded-lg p-4">
                <MapPin className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                <p className="font-semibold text-blue-800">{route.totalStops}</p>
                <p className="text-sm text-blue-600">Stopp</p>
              </div>
              <div className="bg-green-50 rounded-lg p-4">
                <Package className="w-8 h-8 text-green-600 mx-auto mb-2" />
                <p className="font-semibold text-green-800">{route.totalWeight}kg</p>
                <p className="text-sm text-green-600">Vekt</p>
              </div>
              <div className="bg-purple-50 rounded-lg p-4">
                <Navigation className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                <p className="font-semibold text-purple-800">{route.totalDistance}km</p>
                <p className="text-sm text-purple-600">Distanse</p>
              </div>
            </div>

            <button
              onClick={startDelivery}
              className="w-full bg-gradient-to-r from-green-600 to-blue-600 text-white py-4 px-6 rounded-xl font-medium hover:from-green-700 hover:to-blue-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-all flex items-center justify-center space-x-2"
            >
              <Play className="w-6 h-6" />
              <span>Start Levering</span>
            </button>
          </div>
        )}

        {/* Delivery Step */}
        {currentStep === 'delivery' && route && (
          <div className="space-y-6">
            {/* Progress Header */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Stopp {currentStopIndex + 1} av {route.totalStops}
                </h3>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-gray-600">Pågår</span>
                </div>
              </div>
              
              <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all"
                  style={{ width: `${((currentStopIndex + 1) / route.totalStops) * 100}%` }}
                ></div>
              </div>

              <div className="flex justify-between text-sm text-gray-600">
                <span>{route.completedStops} fullført</span>
                <span>{route.totalStops - currentStopIndex - 1} gjenstår</span>
              </div>
            </div>

            {/* Current Stop Details */}
            {route.freightUnits[currentStopIndex] && (
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-start justify-between mb-6">
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      {route.freightUnits[currentStopIndex].customer}
                    </h3>
                    <div className="flex items-center text-gray-600 mb-2">
                      <MapPin className="w-4 h-4 mr-2" />
                      <span>{route.freightUnits[currentStopIndex].address}</span>
                    </div>
                    <div className="flex items-center text-gray-600">
                      <Clock className="w-4 h-4 mr-2" />
                      <span>
                        {route.freightUnits[currentStopIndex].deliveryTimeFrom} - 
                        {route.freightUnits[currentStopIndex].deliveryTimeTo}
                      </span>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium mb-2">
                      {route.freightUnits[currentStopIndex].priority.toUpperCase()}
                    </div>
                    <div className="text-lg font-bold text-gray-900">
                      {route.freightUnits[currentStopIndex].weight}kg
                    </div>
                  </div>
                </div>

                {/* Product Scanning */}
                {route.freightUnits[currentStopIndex].hasPhysicalProduct && (
                  <div className="border-t pt-6">
                    <h4 className="text-lg font-semibold text-gray-900 mb-4">
                      Skann produkter
                    </h4>
                    
                    {!isScanning ? (
                <button
                  onClick={() => setShowBarcodeScanner(true)}
                  className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
                >
                  <Camera className="w-5 h-5" />
                  <span>Start Skanning</span>
                </button>
                    ) : (
                      <div className="space-y-4">
                        <div className="bg-gray-900 rounded-lg p-4 text-center">
                          <video
                            ref={videoRef}
                            className="w-full h-48 object-cover rounded"
                            playsInline
                          />
                          <canvas ref={canvasRef} className="hidden" />
                        </div>
                        
                        <div className="flex space-x-3">
                          <button
                            onClick={stopScanning}
                            className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors"
                          >
                            Stopp Skanning
                          </button>
                          <button
                            onClick={() => handleScanProduct(`PROD-${Date.now()}`)}
                            className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors"
                          >
                            Simuler Skann
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Scanned Products */}
                    {scannedProducts.length > 0 && (
                      <div className="mt-4">
                        <h5 className="font-medium text-gray-900 mb-2">
                          Skannede produkter ({scannedProducts.length})
                        </h5>
                        <div className="space-y-2">
                          {scannedProducts.map((productId, index) => (
                            <div key={index} className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg p-3">
                              <div className="flex items-center space-x-3">
                                <CheckCircle className="w-5 h-5 text-green-600" />
                                <span className="text-green-800 font-medium">{productId}</span>
                              </div>
                              <button
                                onClick={() => setScannedProducts(prev => prev.filter((_, i) => i !== index))}
                                className="text-red-500 hover:text-red-700"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Non-physical delivery */}
                {!route.freightUnits[currentStopIndex].hasPhysicalProduct && (
                  <div className="border-t pt-6">
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                      <div className="flex items-center space-x-2 mb-2">
                        <AlertCircle className="w-5 h-5 text-yellow-600" />
                        <span className="font-medium text-yellow-800">
                          Ingen fysisk vare
                        </span>
                      </div>
                      <p className="text-yellow-700 text-sm">
                        Dette er en tjeneste/oppdrag uten fysisk vare. Du kan trykke "Klar til å kjøre" når du er ferdig.
                      </p>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="border-t pt-6 flex space-x-4">
                  <button
                    onClick={completeStop}
                    disabled={
                      route.freightUnits[currentStopIndex].hasPhysicalProduct && 
                      scannedProducts.length === 0
                    }
                    className="flex-1 bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                  >
                    <CheckCircle className="w-5 h-5" />
                    <span>
                      {route.freightUnits[currentStopIndex].hasPhysicalProduct 
                        ? 'Levert' 
                        : 'Klar til å kjøre'
                      }
                    </span>
                  </button>
                  
                  <button
                    onClick={() => setCurrentStep('code')}
                    className="bg-gray-100 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center space-x-2"
                  >
                    <RotateCcw className="w-5 h-5" />
                    <span>Avbryt</span>
                  </button>
                </div>
              </div>
            )}

            {/* Route Summary */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">
                Ruteoversikt
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {route.totalStops}
                  </div>
                  <div className="text-sm text-gray-600">Totalt stopp</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {route.completedStops}
                  </div>
                  <div className="text-sm text-gray-600">Fullført</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-600">
                    {route.totalWeight}kg
                  </div>
                  <div className="text-sm text-gray-600">Total vekt</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {route.totalDistance}km
                  </div>
                  <div className="text-sm text-gray-600">Distanse</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Barcode Scanner Modal */}
      <BarcodeScanner
        isOpen={showBarcodeScanner}
        onClose={() => setShowBarcodeScanner(false)}
        onScan={handleBarcodeScan}
      />
    </div>
  );
}

export default function DriverDeliveryPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Laster leveringssiden...</p>
        </div>
      </div>
    }>
      <DriverDeliveryContent />
    </Suspense>
  );
}
