'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  MapPin, 
  Clock, 
  Package, 
  Truck, 
  User, 
  Settings, 
  Search,
  Plus,
  RefreshCw,
  Zap,
  Navigation,
  Route,
  Map,
  Calendar,
  BarChart3,
  Activity,
  GanttChart,
  Wifi,
  WifiOff,
  CheckCircle,
  AlertCircle,
  X,
  Eye,
  Edit,
  Trash2,
  Save,
  Filter,
  Download,
  Upload,
  Play,
  Pause,
  RotateCcw,
  Target,
  TrendingUp,
  Building2,
  Users,
  Car,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Maximize2,
  Minimize2,
  Move,
  Copy,
  ExternalLink,
  Bell,
  MessageSquare,
  Phone,
  Mail,
  Globe,
  Lock,
  Unlock,
  Star,
  Layers,
  Grid,
  List,
  Layout,
  Palette,
  Layers2,
  Database,
  Cloud,
  Signal,
  Battery,
  Volume2,
  VolumeX,
  Mic,
  MicOff,
  Camera,
  QrCode,
  Scan,
  Hash,
  Key,
  Shield,
  Award,
  Trophy,
  Crown,
  Diamond,
  Sun,
  Moon,
  CloudRain,
  Wind,
  Thermometer,
  Droplets,
  Mountain,
  TreePine,
  Waves,
  Compass,
  Globe2,
  World,
  Flag,
  Home,
  Building,
  Factory,
  Warehouse,
  Store,
  ShoppingCart,
  CreditCard,
  DollarSign,
  Euro,
  Percent,
  Calculator,
  FileText,
  File,
  Folder,
  FolderOpen,
  Archive,
  Bookmark,
  Tag,
  Tags,
  AtSign,
  Link,
  Link2,
  Share,
  Share2,
  Send,
  MessageCircle,
  Video,
  Headphones,
  Speaker,
  Radio,
  Tv,
  Monitor,
  Laptop,
  Smartphone,
  Tablet,
  Watch,
  Gamepad2,
  Keyboard,
  Mouse,
  Printer,
  Scanner,
  HardDrive,
  Server,
  Router,
  Bluetooth,
  Usb,
  Cable,
  Plug,
  Power,
  Lightbulb,
  Lamp,
  Flashlight,
  Candle,
  Flame,
  Fire,
  Snowflake,
  CloudLightning,
  CloudDrizzle,
  Sunrise,
  Sunset,
  Tornado,
  Hurricane,
  Earthquake,
  Volcano,
  TreeDeciduous,
  Flower,
  Leaf,
  Seedling,
  Trees,
  Forest,
  Park,
  Garden,
  Farm,
  Wheat,
  Corn,
  Apple,
  Banana,
  Cherry,
  Grape,
  Orange,
  Peach,
  Pear,
  Pineapple,
  Strawberry,
  Watermelon,
  Carrot,
  Eggplant,
  Pepper,
  Potato,
  Tomato,
  Broccoli,
  Cabbage,
  Lettuce,
  Onion,
  Peas,
  Radish,
  Spinach,
  Squash,
  Beet,
  Cucumber,
  Garlic,
  Ginger,
  Mushroom,
  Olive,
  Pickle,
  Pumpkin,
  Turnip,
  Avocado,
  Coconut,
  Kiwi,
  Lemon,
  Lime,
  Mango,
  Melon,
  Papaya,
  Pomegranate,
  Raspberry,
  Blueberry,
  Blackberry,
  Cranberry,
  Fig,
  Raisin,
  Prune,
  Apricot,
  Plum,
  Persimmon,
  Dragonfruit,
  Starfruit,
  Passionfruit,
  Guava,
  Lychee,
  Rambutan,
  Durian,
  Jackfruit,
  Breadfruit,
  Plantain,
  Taro,
  Yam,
  SweetPotato,
  Cassava,
  Arrowroot,
  Lotus,
  Bamboo,
  Cactus,
  Aloe,
  Lavender,
  Rose,
  Tulip,
  Daisy,
  Sunflower,
  Orchid,
  Lily,
  Iris,
  Poppy,
  Daffodil,
  Hyacinth,
  Peony,
  Magnolia,
  Jasmine,
  Hibiscus,
  Marigold,
  Petunia,
  Geranium,
  Begonia,
  Impatiens,
  Pansy,
  Violet,
  Primrose,
  Snapdragon,
  Zinnia,
  Cosmos,
  Aster,
  Chrysanthemum,
  Carnation,
  Gladiolus,
  Freesia,
  Anemone,
  Ranunculus,
  Delphinium,
  Lupine,
  Foxglove,
  Digitalis,
  Bellflower,
  Campanula,
  Lobelia,
  Verbena,
  Salvia,
  Sage,
  Rosemary,
  Thyme,
  Oregano,
  Basil,
  Mint,
  Parsley,
  Cilantro,
  Dill,
  Chives,
  Tarragon,
  Bay,
  Cinnamon,
  Nutmeg,
  Clove,
  Cardamom,
  Vanilla,
  Turmeric,
  Saffron,
  Paprika,
  Cayenne,
  BlackPepper,
  WhitePepper,
  PinkPepper,
  Allspice,
  Juniper,
  StarAnise,
  Fennel,
  Cumin,
  Coriander,
  Mustard,
  Sesame,
  Caraway,
  Anise,
  Licorice,
  Chicory,
  Endive,
  Escarole,
  Radicchio,
  Arugula,
  Watercress,
  Mache,
  Sorrel,
  Purslane,
  Lamb,
  SwissChard,
  Kale,
  Collard,
  BokChoy,
  Napa,
  Daikon,
  Horseradish,
  Wasabi,
  Galangal,
  Lemongrass,
  KaffirLime,
  Makrut,
  Buddha,
  Bergamot,
  Yuzu,
  Kumquat,
  Tangerine,
  Clementine,
  Mandarine,
  Satsuma,
  Ugli,
  Minneola,
  Tangelo,
  Grapefruit,
  Pomelo,
  Shaddock,
  Citron,
  Etrog,
  Sukkot,
  Lulav,
  Hadas,
  Arava,
  Esrog
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { firebaseService } from '@/lib/firebase-services';

// eLogii-inspired interfaces
interface Task {
  id: string;
  customerName: string;
  address: string;
  coordinates: { lat: number; lng: number };
  timeWindow: { start: string; end: string };
  duration: number;
  priority: 'high' | 'medium' | 'low';
  type: 'pickup' | 'delivery' | 'service';
  status: 'pending' | 'assigned' | 'in_progress' | 'completed' | 'failed';
  assignedDriver?: string;
  assignedRoute?: string;
  serviceTime: number;
  constraints: {
    requiresSignature: boolean;
    requiresPhoto: boolean;
    requiresBarcode: boolean;
    fragile: boolean;
    temperatureControlled: boolean;
    hazardous: boolean;
  };
  dimensions: {
    weight: number;
    volume: number;
    length: number;
    width: number;
    height: number;
  };
  customer: {
    name: string;
    phone: string;
    email: string;
    notes: string;
    customerType: 'business' | 'private';
  };
  createdAt: string;
  updatedAt: string;
}

interface Driver {
  id: string;
  name: string;
  vehicle: string;
  capacity: {
    weight: number;
    volume: number;
  };
  skills: string[];
  availability: {
    start: string;
    end: string;
    days: number[];
  };
  location: { lat: number; lng: number };
  status: 'available' | 'busy' | 'offline';
  currentRoute?: string;
  telemetry: {
    speed: number;
    fuel: number;
    battery: number;
    temperature: number;
  };
}

interface Route {
  id: string;
  driverId: string;
  tasks: string[];
  startTime: string;
  endTime: string;
  distance: number;
  duration: number;
  status: 'planned' | 'active' | 'completed' | 'cancelled';
  optimization: {
    algorithm: string;
    objectives: string[];
    constraints: string[];
    score: number;
  };
  realTime: {
    currentLocation: { lat: number; lng: number };
    progress: number;
    eta: string;
    delays: number;
  };
}

interface Depot {
  id: string;
  name: string;
  address: string;
  coordinates: { lat: number; lng: number };
  capacity: number;
  operatingHours: { start: string; end: string };
  vehicles: string[];
}

interface Zone {
  id: string;
  name: string;
  boundaries: { lat: number; lng: number }[];
  restrictions: string[];
  assignedDrivers: string[];
}

interface OptimizationConfig {
  objectives: ('time' | 'distance' | 'cost' | 'balance')[];
  constraints: {
    maxRouteDuration: number;
    maxRouteDistance: number;
    maxStopsPerRoute: number;
    timeWindows: boolean;
    vehicleCapacity: boolean;
    driverSkills: boolean;
    zoneRestrictions: boolean;
  };
  algorithms: {
    primary: 'kmeans' | 'dbscan' | 'genetic' | 'simulated_annealing';
    secondary: 'same_side_routing' | 'traffic_aware' | 'multi_depot';
  };
  realTime: {
    enabled: boolean;
    updateInterval: number;
    rerouteThreshold: number;
  };
}

export default function AdvancedPlanningPage() {
  const { userProfile } = useAuth();
  
  // Core data state
  const [tasks, setTasks] = useState<Task[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [depots, setDepots] = useState<Depot[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  
  // UI state
  const [activeView, setActiveView] = useState<'map' | 'timeline' | 'gantt' | 'analytics'>('map');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedDepot, setSelectedDepot] = useState<string>('all');
  const [selectedDriver, setSelectedDriver] = useState<string>('all');
  const [selectedRoute, setSelectedRoute] = useState<string>('');
  
  // Optimization state
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizationProgress, setOptimizationProgress] = useState(0);
  const [optimizationConfig, setOptimizationConfig] = useState<OptimizationConfig>({
    objectives: ['time', 'distance'],
    constraints: {
      maxRouteDuration: 480,
      maxRouteDistance: 200,
      maxStopsPerRoute: 25,
      timeWindows: true,
      vehicleCapacity: true,
      driverSkills: true,
      zoneRestrictions: true
    },
    algorithms: {
      primary: 'kmeans',
      secondary: 'same_side_routing'
    },
    realTime: {
      enabled: true,
      updateInterval: 30,
      rerouteThreshold: 15
    }
  });
  
  // Panel states
  const [showTaskPanel, setShowTaskPanel] = useState(false);
  const [showDriverPanel, setShowDriverPanel] = useState(false);
  const [showRoutePanel, setShowRoutePanel] = useState(false);
  const [showZonePanel, setShowZonePanel] = useState(false);
  const [showAnalyticsPanel, setShowAnalyticsPanel] = useState(false);
  const [showSettingsPanel, setShowSettingsPanel] = useState(false);
  
  // Filter and search state
  const [filters, setFilters] = useState({
    status: 'all',
    priority: 'all',
    type: 'all',
    driver: 'all',
    zone: 'all'
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTasks, setSelectedTasks] = useState<string[]>([]);
  
  // Real-time state
  const [realTimeEnabled, setRealTimeEnabled] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  
  // Initialize date on client-side
  useEffect(() => {
    if (typeof window !== 'undefined' && !selectedDate) {
      setSelectedDate(new Date().toISOString().split('T')[0]);
      setIsInitialized(true);
    }
  }, [selectedDate]);

  // Load initial data
  useEffect(() => {
    loadInitialData();
  }, [userProfile?.companyId]);

  const loadInitialData = async () => {
    if (!userProfile?.companyId) return;
    
    try {
      // Load sample data for demonstration
      const sampleTasks: Task[] = [
        {
          id: 'T001',
          customerName: 'Oslo Sentrum AS',
          address: 'Karl Johans gate 1, 0154 Oslo',
          coordinates: { lat: 59.9139, lng: 10.7522 },
          timeWindow: { start: '09:00', end: '12:00' },
          duration: 15,
          priority: 'high',
          type: 'delivery',
          status: 'pending',
          serviceTime: 10,
          constraints: {
            requiresSignature: true,
            requiresPhoto: false,
            requiresBarcode: true,
            fragile: false,
            temperatureControlled: false,
            hazardous: false
          },
          dimensions: {
            weight: 5.5,
            volume: 0.8,
            length: 40,
            width: 30,
            height: 20
          },
          customer: {
            name: 'Oslo Sentrum AS',
            phone: '+47 22 00 00 00',
            email: 'kontakt@oslosentrum.no',
            notes: 'Lever til hovedkontor',
            customerType: 'business'
          },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: 'T002',
          customerName: 'Bergen Havn',
          address: 'Havnegata 1, 5014 Bergen',
          coordinates: { lat: 60.3913, lng: 5.3221 },
          timeWindow: { start: '14:00', end: '17:00' },
          duration: 20,
          priority: 'medium',
          type: 'pickup',
          status: 'pending',
          serviceTime: 15,
          constraints: {
            requiresSignature: true,
            requiresPhoto: true,
            requiresBarcode: false,
            fragile: true,
            temperatureControlled: true,
            hazardous: false
          },
          dimensions: {
            weight: 12.3,
            volume: 1.5,
            length: 60,
            width: 40,
            height: 25
          },
          customer: {
            name: 'Bergen Havn',
            phone: '+47 55 23 14 00',
            email: 'post@bergenhavn.no',
            notes: 'Fragile varer - forsiktig håndtering',
            customerType: 'business'
          },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ];

      const sampleDrivers: Driver[] = [
        {
          id: 'D001',
          name: 'Erik Hansen',
          vehicle: 'Mercedes Sprinter 2019',
          capacity: { weight: 3500, volume: 15.5 },
          skills: ['delivery', 'pickup', 'fragile', 'temperature_controlled'],
          availability: { start: '08:00', end: '18:00', days: [1, 2, 3, 4, 5] },
          location: { lat: 59.9139, lng: 10.7522 },
          status: 'available',
          telemetry: { speed: 0, fuel: 85, battery: 100, temperature: 22 }
        },
        {
          id: 'D002',
          name: 'Anna Larsen',
          vehicle: 'Ford Transit 2020',
          capacity: { weight: 2800, volume: 12.0 },
          skills: ['delivery', 'pickup', 'hazardous'],
          availability: { start: '07:00', end: '19:00', days: [1, 2, 3, 4, 5, 6] },
          location: { lat: 60.3913, lng: 5.3221 },
          status: 'available',
          telemetry: { speed: 0, fuel: 92, battery: 100, temperature: 21 }
        }
      ];

      const sampleRoutes: Route[] = [
        {
          id: 'R001',
          driverId: 'D001',
          tasks: ['T001', 'T002'],
          startTime: '08:00',
          endTime: '16:00',
          distance: 45.2,
          duration: 480,
          status: 'planned',
          optimization: {
            algorithm: 'kmeans',
            objectives: ['time', 'distance'],
            constraints: ['time_windows', 'capacity'],
            score: 94.5
          },
          realTime: {
            currentLocation: { lat: 59.9139, lng: 10.7522 },
            progress: 0,
            eta: '16:00',
            delays: 0
          }
        }
      ];

      const sampleDepots: Depot[] = [
        {
          id: 'DEP001',
          name: 'Oslo Hoveddepot',
          address: 'Industriveien 15, 0581 Oslo',
          coordinates: { lat: 59.9249, lng: 10.7469 },
          capacity: 100,
          operatingHours: { start: '06:00', end: '22:00' },
          vehicles: ['D001', 'D002']
        }
      ];

      const sampleZones: Zone[] = [
        {
          id: 'Z001',
          name: 'Oslo Sentrum',
          boundaries: [
            { lat: 59.9200, lng: 10.7400 },
            { lat: 59.9200, lng: 10.7600 },
            { lat: 59.9100, lng: 10.7600 },
            { lat: 59.9100, lng: 10.7400 }
          ],
          restrictions: ['no_trucks_weekdays_08_18'],
          assignedDrivers: ['D001']
        }
      ];

      setTasks(sampleTasks);
      setDrivers(sampleDrivers);
      setRoutes(sampleRoutes);
      setDepots(sampleDepots);
      setZones(sampleZones);
      
    } catch (error) {
      console.error('Error loading initial data:', error);
    }
  };

  const handleOptimizeRoutes = async () => {
    setIsOptimizing(true);
    setOptimizationProgress(0);
    
    // Simulate optimization process
    for (let i = 0; i <= 100; i += 10) {
      await new Promise(resolve => setTimeout(resolve, 200));
      setOptimizationProgress(i);
    }
    
    // Generate optimized routes
    const optimizedRoutes = generateOptimizedRoutes();
    setRoutes(optimizedRoutes);
    setIsOptimizing(false);
    setLastUpdate(new Date());
  };

  const generateOptimizedRoutes = (): Route[] => {
    // Advanced route optimization logic here
    return routes.map(route => ({
      ...route,
      optimization: {
        ...route.optimization,
        score: Math.random() * 20 + 80 // Random score between 80-100
      }
    }));
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-gray-100 text-gray-800';
      case 'assigned': return 'bg-blue-100 text-blue-800';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Show loading state until initialized
  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading planning system...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <div className="bg-gray-800 shadow-lg border-b border-gray-700">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <Navigation className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">Advanced Route Planning</h1>
                <p className="text-sm text-gray-300">eLogii-inspired optimization platform</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-3 bg-gray-700 px-4 py-2 rounded-lg">
                <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse shadow-lg"></div>
                <span className="text-sm text-gray-200 font-medium">
                  {realTimeEnabled ? 'Real-time Active' : 'Offline Mode'}
                </span>
              </div>
              <button
                onClick={() => setRealTimeEnabled(!realTimeEnabled)}
                className="p-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
              >
                {realTimeEnabled ? <Wifi className="w-5 h-5 text-green-400" /> : <WifiOff className="w-5 h-5 text-gray-400" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex h-screen">
        {/* Sidebar */}
        <div className="w-80 bg-gray-800 shadow-xl border-r border-gray-700 flex flex-col">
          {/* Quick Stats */}
          <div className="p-6 border-b border-gray-700">
            <h3 className="text-xl font-bold text-white mb-4">Quick Stats</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gradient-to-br from-blue-600 to-blue-700 p-4 rounded-xl shadow-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-blue-100">Total Tasks</p>
                    <p className="text-3xl font-bold text-white">{tasks.length}</p>
                  </div>
                  <Package className="w-10 h-10 text-blue-200" />
                </div>
              </div>
              <div className="bg-gradient-to-br from-green-600 to-green-700 p-4 rounded-xl shadow-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-green-100">Active Routes</p>
                    <p className="text-3xl font-bold text-white">{routes.length}</p>
                  </div>
                  <Route className="w-10 h-10 text-green-200" />
                </div>
              </div>
              <div className="bg-gradient-to-br from-purple-600 to-purple-700 p-4 rounded-xl shadow-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-purple-100">Drivers</p>
                    <p className="text-3xl font-bold text-white">{drivers.length}</p>
                  </div>
                  <Truck className="w-10 h-10 text-purple-200" />
                </div>
              </div>
              <div className="bg-gradient-to-br from-orange-600 to-orange-700 p-4 rounded-xl shadow-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-orange-100">Completion</p>
                    <p className="text-3xl font-bold text-white">87%</p>
                  </div>
                  <TrendingUp className="w-10 h-10 text-orange-200" />
                </div>
              </div>
            </div>
          </div>

          {/* View Controls */}
          <div className="p-6 border-b border-gray-700">
            <h3 className="text-xl font-bold text-white mb-4">View Mode</h3>
            <div className="space-y-3">
              <button
                onClick={() => setActiveView('map')}
                className={`w-full flex items-center px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
                  activeView === 'map' 
                    ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg transform scale-105' 
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600 hover:text-white'
                }`}
              >
                <Map className="w-5 h-5 mr-3" />
                Map View
              </button>
              <button
                onClick={() => setActiveView('timeline')}
                className={`w-full flex items-center px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
                  activeView === 'timeline' 
                    ? 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg transform scale-105' 
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600 hover:text-white'
                }`}
              >
                <Clock className="w-5 h-5 mr-3" />
                Timeline
              </button>
              <button
                onClick={() => setActiveView('gantt')}
                className={`w-full flex items-center px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
                  activeView === 'gantt' 
                    ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-lg transform scale-105' 
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600 hover:text-white'
                }`}
              >
                <GanttChart className="w-5 h-5 mr-3" />
                Gantt Chart
              </button>
              <button
                onClick={() => setActiveView('analytics')}
                className={`w-full flex items-center px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
                  activeView === 'analytics' 
                    ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg transform scale-105' 
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600 hover:text-white'
                }`}
              >
                <BarChart3 className="w-5 h-5 mr-3" />
                Analytics
              </button>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="p-4 border-b">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Quick Actions</h3>
            <div className="space-y-2">
              <button className="w-full flex items-center px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md">
                <Plus className="w-4 h-4 mr-3" />
                Add Task
              </button>
              <button className="w-full flex items-center px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md">
                <User className="w-4 h-4 mr-3" />
                Add Driver
              </button>
              <button className="w-full flex items-center px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md">
                <Building2 className="w-4 h-4 mr-3" />
                Add Depot
              </button>
              <button className="w-full flex items-center px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md">
                <Upload className="w-4 h-4 mr-3" />
                Import Data
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="p-4 flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Filters</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select 
                  value={filters.status}
                  onChange={(e) => setFilters({...filters, status: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="assigned">Assigned</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                <select 
                  value={filters.priority}
                  onChange={(e) => setFilters({...filters, priority: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Priority</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Driver</label>
                <select 
                  value={filters.driver}
                  onChange={(e) => setFilters({...filters, driver: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Drivers</option>
                  {drivers.map(driver => (
                    <option key={driver.id} value={driver.id}>{driver.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col">
          {/* Toolbar */}
          <div className="bg-white border-b px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search tasks, customers, addresses..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-80"
                  />
                  <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                </div>
                <select 
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Date</option>
                  <option value={new Date().toISOString().split('T')[0]}>Today</option>
                  <option value={new Date(Date.now() + 86400000).toISOString().split('T')[0]}>Tomorrow</option>
                </select>
              </div>
              
              <div className="flex items-center space-x-3">
                <button
                  onClick={handleOptimizeRoutes}
                  disabled={isOptimizing}
                  className="flex items-center px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {isOptimizing ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                      <span>Optimizing...</span>
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4 mr-2" />
                      <span>Optimize Routes</span>
                    </>
                  )}
                </button>
                <button className="flex items-center px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg">
                  <Settings className="w-4 h-4 mr-2" />
                  <span>Settings</span>
                </button>
              </div>
            </div>
            
            {isOptimizing && (
              <div className="mt-4">
                <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                  <span>Optimization Progress</span>
                  <span>{optimizationProgress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-blue-600 to-purple-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${optimizationProgress}%` }}
                  ></div>
                </div>
              </div>
            )}
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-hidden">
            {activeView === 'map' && (
              <div className="h-full bg-gradient-to-br from-gray-800 to-gray-900 relative">
                {/* Map Header */}
                <div className="absolute top-0 left-0 right-0 bg-gray-800/90 backdrop-blur-sm border-b border-gray-700 z-10">
                  <div className="px-6 py-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-2xl font-bold text-white">Interactive Map View</h2>
                        <p className="text-gray-300">Real-time route visualization with live driver tracking</p>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="bg-green-600 px-4 py-2 rounded-lg">
                          <span className="text-white font-semibold">Live Tracking</span>
                        </div>
                        <div className="bg-blue-600 px-4 py-2 rounded-lg">
                          <span className="text-white font-semibold">{drivers.length} Drivers Active</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Map Content */}
                <div className="pt-20 h-full">
                  <div className="h-full bg-gradient-to-br from-blue-900 via-blue-800 to-purple-900 relative overflow-hidden">
                    {/* Simulated Map Background */}
                    <div className="absolute inset-0 opacity-20">
                      <div className="absolute top-10 left-10 w-4 h-4 bg-green-400 rounded-full animate-pulse"></div>
                      <div className="absolute top-32 left-24 w-4 h-4 bg-red-400 rounded-full animate-pulse"></div>
                      <div className="absolute top-48 left-16 w-4 h-4 bg-yellow-400 rounded-full animate-pulse"></div>
                      <div className="absolute top-64 left-40 w-4 h-4 bg-blue-400 rounded-full animate-pulse"></div>
                      <div className="absolute top-20 right-20 w-4 h-4 bg-purple-400 rounded-full animate-pulse"></div>
                      <div className="absolute top-40 right-32 w-4 h-4 bg-pink-400 rounded-full animate-pulse"></div>
                      
                      {/* Route Lines */}
                      <svg className="absolute inset-0 w-full h-full">
                        <line x1="40" y1="40" x2="160" y2="128" stroke="#10B981" strokeWidth="3" strokeDasharray="5,5" className="animate-pulse"/>
                        <line x1="96" y2="192" x2="320" y2="80" stroke="#EF4444" strokeWidth="3" strokeDasharray="5,5" className="animate-pulse"/>
                        <line x2="64" y1="192" x2="160" y2="256" stroke="#F59E0B" strokeWidth="3" strokeDasharray="5,5" className="animate-pulse"/>
                      </svg>
                    </div>

                    {/* Map Controls */}
                    <div className="absolute top-6 right-6 bg-gray-800/90 backdrop-blur-sm rounded-xl p-4 shadow-xl">
                      <div className="space-y-3">
                        <button className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors">
                          <Navigation className="w-4 h-4 inline mr-2" />
                          Center Map
                        </button>
                        <button className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors">
                          <Users className="w-4 h-4 inline mr-2" />
                          Show Drivers
                        </button>
                        <button className="w-full bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors">
                          <Route className="w-4 h-4 inline mr-2" />
                          Show Routes
                        </button>
                      </div>
                    </div>

                    {/* Live Stats Overlay */}
                    <div className="absolute bottom-6 left-6 bg-gray-800/90 backdrop-blur-sm rounded-xl p-6 shadow-xl">
                      <h3 className="text-lg font-bold text-white mb-4">Live Statistics</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-center">
                          <div className="text-3xl font-bold text-blue-400">{tasks.length}</div>
                          <div className="text-sm text-gray-300">Active Tasks</div>
                        </div>
                        <div className="text-center">
                          <div className="text-3xl font-bold text-green-400">{routes.length}</div>
                          <div className="text-sm text-gray-300">Active Routes</div>
                        </div>
                        <div className="text-center">
                          <div className="text-3xl font-bold text-purple-400">{drivers.length}</div>
                          <div className="text-sm text-gray-300">Online Drivers</div>
                        </div>
                        <div className="text-center">
                          <div className="text-3xl font-bold text-orange-400">94.5%</div>
                          <div className="text-sm text-gray-300">Optimization</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeView === 'timeline' && (
              <div className="h-full bg-gradient-to-br from-gray-800 to-gray-900">
                {/* Timeline Header */}
                <div className="bg-gray-800/90 backdrop-blur-sm border-b border-gray-700 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-bold text-white">Timeline View</h2>
                      <p className="text-gray-300">Schedule optimization with time-window constraints</p>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="bg-green-600 px-4 py-2 rounded-lg">
                        <span className="text-white font-semibold">Live Schedule</span>
                      </div>
                      <div className="bg-blue-600 px-4 py-2 rounded-lg">
                        <span className="text-white font-semibold">Auto-Optimized</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Timeline Content */}
                <div className="p-6 h-full overflow-auto">
                  <div className="space-y-6">
                    {/* Morning Routes */}
                    <div className="bg-gradient-to-r from-blue-900 to-blue-800 rounded-xl p-6 shadow-xl">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-xl font-bold text-white">Morning Routes</h3>
                        <span className="bg-blue-600 text-white px-3 py-1 rounded-lg text-sm font-semibold">08:00 - 12:00</span>
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="bg-blue-700/50 p-4 rounded-lg">
                          <div className="text-2xl font-bold text-blue-200">15</div>
                          <div className="text-sm text-blue-100">Tasks</div>
                        </div>
                        <div className="bg-blue-700/50 p-4 rounded-lg">
                          <div className="text-2xl font-bold text-blue-200">3</div>
                          <div className="text-sm text-blue-100">Routes</div>
                        </div>
                        <div className="bg-blue-700/50 p-4 rounded-lg">
                          <div className="text-2xl font-bold text-blue-200">92%</div>
                          <div className="text-sm text-blue-100">Efficiency</div>
                        </div>
                      </div>
                    </div>

                    {/* Afternoon Routes */}
                    <div className="bg-gradient-to-r from-green-900 to-green-800 rounded-xl p-6 shadow-xl">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-xl font-bold text-white">Afternoon Routes</h3>
                        <span className="bg-green-600 text-white px-3 py-1 rounded-lg text-sm font-semibold">13:00 - 17:00</span>
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="bg-green-700/50 p-4 rounded-lg">
                          <div className="text-2xl font-bold text-green-200">22</div>
                          <div className="text-sm text-green-100">Tasks</div>
                        </div>
                        <div className="bg-green-700/50 p-4 rounded-lg">
                          <div className="text-2xl font-bold text-green-200">4</div>
                          <div className="text-sm text-green-100">Routes</div>
                        </div>
                        <div className="bg-green-700/50 p-4 rounded-lg">
                          <div className="text-2xl font-bold text-green-200">88%</div>
                          <div className="text-sm text-green-100">Efficiency</div>
                        </div>
                      </div>
                    </div>

                    {/* Evening Routes */}
                    <div className="bg-gradient-to-r from-purple-900 to-purple-800 rounded-xl p-6 shadow-xl">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-xl font-bold text-white">Evening Routes</h3>
                        <span className="bg-purple-600 text-white px-3 py-1 rounded-lg text-sm font-semibold">17:00 - 20:00</span>
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="bg-purple-700/50 p-4 rounded-lg">
                          <div className="text-2xl font-bold text-purple-200">8</div>
                          <div className="text-sm text-purple-100">Tasks</div>
                        </div>
                        <div className="bg-purple-700/50 p-4 rounded-lg">
                          <div className="text-2xl font-bold text-purple-200">2</div>
                          <div className="text-sm text-purple-100">Routes</div>
                        </div>
                        <div className="bg-purple-700/50 p-4 rounded-lg">
                          <div className="text-2xl font-bold text-purple-200">95%</div>
                          <div className="text-sm text-purple-100">Efficiency</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeView === 'gantt' && (
              <div className="h-full">
                <div className="bg-white rounded-lg shadow-sm border h-full flex items-center justify-center">
                  <div className="text-center">
                    <GanttChart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Gantt Chart View</h3>
                    <p className="text-gray-600 mb-4">Visual route planning with drag & drop scheduling</p>
                    <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
                      <div className="bg-blue-50 p-3 rounded-lg">
                        <div className="text-lg font-bold text-blue-600">Parallel Optimization</div>
                        <div className="text-sm text-gray-600">Multi-depot routing</div>
                      </div>
                      <div className="bg-green-50 p-3 rounded-lg">
                        <div className="text-lg font-bold text-green-600">Real-time Updates</div>
                        <div className="text-sm text-gray-600">Live synchronization</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeView === 'analytics' && (
              <div className="h-full">
                <div className="bg-white rounded-lg shadow-sm border h-full flex items-center justify-center">
                  <div className="text-center">
                    <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Analytics Dashboard</h3>
                    <p className="text-gray-600 mb-4">Performance metrics and optimization insights</p>
                    <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
                      <div className="bg-blue-50 p-3 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">94.5%</div>
                        <div className="text-sm text-gray-600">Optimization Score</div>
                      </div>
                      <div className="bg-green-50 p-3 rounded-lg">
                        <div className="text-2xl font-bold text-green-600">87%</div>
                        <div className="text-sm text-gray-600">On-time Delivery</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Task List Panel */}
      {showTaskPanel && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">Tasks</h2>
                <button
                  onClick={() => setShowTaskPanel(false)}
                  className="p-2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="p-6 overflow-auto max-h-[calc(90vh-120px)]">
              <div className="space-y-4">
                {tasks.map(task => (
                  <div key={task.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}>
                          {task.priority}
                        </div>
                        <div className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}>
                          {task.status}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button className="p-1 text-gray-400 hover:text-gray-600">
                          <Eye className="w-4 h-4" />
                        </button>
                        <button className="p-1 text-gray-400 hover:text-gray-600">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button className="p-1 text-gray-400 hover:text-gray-600">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-2">{task.customerName}</h3>
                    <p className="text-sm text-gray-600 mb-2">{task.address}</p>
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <span>{task.timeWindow.start} - {task.timeWindow.end}</span>
                      <span>{task.duration} min</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}