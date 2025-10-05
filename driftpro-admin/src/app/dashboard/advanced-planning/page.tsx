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
  X
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { firebaseService } from '@/lib/firebase-services';

// eLogii-inspired interfaces
interface Task {
  id: string;
  customerName: string;
  address: string;
  phone?: string;
  email?: string;
  timeWindow: {
    from: string;
    to: string;
  };
  serviceDuration: number; // minutes
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'assigned' | 'in_progress' | 'completed' | 'failed';
  vehicleType: 'van' | 'truck' | 'car' | 'bike';
  requiredSkills: string[];
  weight: number;
  volume: number;
  specialInstructions?: string;
  proofOfDelivery: {
    photo: boolean;
    signature: boolean;
    barcode: boolean;
    customDialog?: string;
  };
  location: {
    lat: number;
    lng: number;
    geocoded: boolean;
    accessPoint?: {
      lat: number;
      lng: number;
    };
  };
  tags: string[];
  customFields: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

interface Driver {
  id: string;
  name: string;
  phone: string;
  email: string;
  skills: string[];
  vehicleType: 'van' | 'truck' | 'car' | 'bike';
  maxCapacity: {
    weight: number;
    volume: number;
  };
  workingHours: {
    start: string;
    end: string;
    days: number[];
  };
  startLocation: {
    lat: number;
    lng: number;
    address: string;
  };
  endLocation?: {
    lat: number;
    lng: number;
    address: string;
  };
  status: 'available' | 'busy' | 'offline';
  currentLocation?: {
    lat: number;
    lng: number;
    timestamp: string;
  };
  autonomyLevel: 'full' | 'partial' | 'none';
}

interface Route {
  id: string;
  driverId: string;
  driverName: string;
  tasks: Task[];
  status: 'planned' | 'active' | 'completed' | 'cancelled';
  startTime: string;
  endTime: string;
  totalDistance: number;
  totalDuration: number;
  totalCost: number;
  optimizationScore: number;
  constraints: {
    maxDistance: number;
    maxDuration: number;
    maxStops: number;
    timeWindows: boolean;
    capacity: boolean;
    skills: boolean;
  };
  waypoints: Array<{
    taskId: string;
    order: number;
    estimatedArrival: string;
    estimatedDeparture: string;
  }>;
  realTime: {
    currentLocation?: {
      lat: number;
      lng: number;
      timestamp: string;
    };
    progress: number; // percentage
    eta: string;
    delays: number; // minutes
  };
}

interface Depot {
  id: string;
  name: string;
  address: string;
  location: {
    lat: number;
    lng: number;
  };
  capacity: {
    vehicles: number;
    drivers: number;
  };
  operatingHours: {
    start: string;
    end: string;
    days: number[];
  };
  services: string[];
}

interface Zone {
  id: string;
  name: string;
  type: 'service' | 'exclusion' | 'restriction';
  geometry: Array<{
    lat: number;
    lng: number;
  }>;
  rules: {
    allowedVehicleTypes: string[];
    allowedDrivers: string[];
    maxSpeed: number;
    restrictions: string[];
  };
}

interface OptimizationConfig {
  objectives: {
    minimizeDistance: number;
    minimizeTime: number;
    minimizeCost: number;
    balanceWorkload: number;
    maximizeUtilization: number;
  };
  constraints: {
    timeWindows: boolean;
    capacity: boolean;
    skills: boolean;
    vehicleType: boolean;
    zones: boolean;
    traffic: boolean;
  };
  algorithms: {
    primary: 'genetic' | 'simulated_annealing' | 'tabu_search' | 'vns';
    clustering: 'kmeans' | 'dbscan' | 'hierarchical';
    parallel: boolean;
  };
  traffic: {
    enabled: boolean;
    provider: 'google' | 'tomtom' | 'here' | 'custom';
    realTime: boolean;
    historical: boolean;
  };
}

export default function AdvancedPlanningPage() {
  const { userProfile } = useAuth();
  
  // Core state management
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
    objectives: {
      minimizeDistance: 30,
      minimizeTime: 25,
      minimizeCost: 20,
      balanceWorkload: 15,
      maximizeUtilization: 10
    },
    constraints: {
      timeWindows: true,
      capacity: true,
      skills: true,
      vehicleType: true,
      zones: true,
      traffic: true
    },
    algorithms: {
      primary: 'genetic',
      clustering: 'kmeans',
      parallel: true
    },
    traffic: {
      enabled: true,
      provider: 'google',
      realTime: true,
      historical: true
    }
  });
  
  // Filter and search state
  const [filters, setFilters] = useState({
    status: 'all',
    priority: 'all',
    vehicleType: 'all',
    timeWindow: 'all',
    zone: 'all',
    tags: [] as string[]
  });
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal and panel state
  const [showOptimizationPanel, setShowOptimizationPanel] = useState(false);
  const [showDriverPanel, setShowDriverPanel] = useState(false);
  const [showTaskPanel, setShowTaskPanel] = useState(false);
  const [showZonePanel, setShowZonePanel] = useState(false);
  const [showAnalyticsPanel, setShowAnalyticsPanel] = useState(false);
  
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
          phone: '+47 123 45 678',
          email: 'post@oslosentrum.no',
          timeWindow: { from: '09:00', to: '12:00' },
          serviceDuration: 30,
          priority: 'high',
          status: 'pending',
          vehicleType: 'truck',
          requiredSkills: ['delivery', 'heavy_lifting'],
          weight: 150,
          volume: 2.5,
          specialInstructions: 'Ring på dørtelefon før levering',
          proofOfDelivery: {
            photo: true,
            signature: true,
            barcode: false
          },
          location: {
            lat: 59.9139,
            lng: 10.7522,
            geocoded: true
          },
          tags: ['urgent', 'downtown'],
          customFields: {
            orderNumber: 'ORD-2024-001',
            customerType: 'business'
          },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: 'T002',
          customerName: 'Lars Hansen',
          address: 'Frognerveien 15, 0263 Oslo',
          phone: '+47 987 65 432',
          email: 'lars@email.no',
          timeWindow: { from: '14:00', to: '17:00' },
          serviceDuration: 15,
          priority: 'medium',
          status: 'pending',
          vehicleType: 'van',
          requiredSkills: ['delivery'],
          weight: 25,
          volume: 0.8,
          proofOfDelivery: {
            photo: true,
            signature: true,
            barcode: true
          },
          location: {
            lat: 59.9167,
            lng: 10.7167,
            geocoded: true
          },
          tags: ['residential'],
          customFields: {
            orderNumber: 'ORD-2024-002',
            customerType: 'private'
          },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ];

      const sampleDrivers: Driver[] = [
        {
          id: 'D001',
          name: 'Erik Johansen',
          phone: '+47 111 22 333',
          email: 'erik@driftpro.no',
          skills: ['delivery', 'heavy_lifting', 'customer_service'],
          vehicleType: 'truck',
          maxCapacity: { weight: 3000, volume: 15 },
          workingHours: {
            start: '08:00',
            end: '17:00',
            days: [1, 2, 3, 4, 5]
          },
          startLocation: {
            lat: 59.9500,
            lng: 10.7500,
            address: 'DriftPro Depot, Oslo'
          },
          status: 'available',
          autonomyLevel: 'full'
        },
        {
          id: 'D002',
          name: 'Anna Svendsen',
          phone: '+47 444 55 666',
          email: 'anna@driftpro.no',
          skills: ['delivery', 'customer_service'],
          vehicleType: 'van',
          maxCapacity: { weight: 1000, volume: 8 },
          workingHours: {
            start: '09:00',
            end: '18:00',
            days: [1, 2, 3, 4, 5]
          },
          startLocation: {
            lat: 59.9500,
            lng: 10.7500,
            address: 'DriftPro Depot, Oslo'
          },
          status: 'available',
          autonomyLevel: 'partial'
        }
      ];

      setTasks(sampleTasks);
      setDrivers(sampleDrivers);
      setRoutes([]);
      
    } catch (error) {
      console.error('Error loading initial data:', error);
    }
  };

  const startOptimization = async () => {
    setIsOptimizing(true);
    setOptimizationProgress(0);
    
    // Simulate optimization process
    for (let i = 0; i <= 100; i += 10) {
      await new Promise(resolve => setTimeout(resolve, 200));
      setOptimizationProgress(i);
    }
    
    // Generate optimized routes
    const optimizedRoutes: Route[] = [
      {
        id: 'R001',
        driverId: 'D001',
        driverName: 'Erik Johansen',
        tasks: [tasks[0]],
        status: 'planned',
        startTime: '08:00',
        endTime: '12:30',
        totalDistance: 15.5,
        totalDuration: 270,
        totalCost: 450,
        optimizationScore: 92,
        constraints: {
          maxDistance: 100,
          maxDuration: 480,
          maxStops: 20,
          timeWindows: true,
          capacity: true,
          skills: true
        },
        waypoints: [
          {
            taskId: 'T001',
            order: 1,
            estimatedArrival: '09:15',
            estimatedDeparture: '09:45'
          }
        ],
        realTime: {
          progress: 0,
          eta: '12:30',
          delays: 0
        }
      }
    ];
    
    setRoutes(optimizedRoutes);
    setIsOptimizing(false);
    setLastUpdate(new Date());
  };

  const filteredTasks = tasks.filter(task => {
    if (filters.status !== 'all' && task.status !== filters.status) return false;
    if (filters.priority !== 'all' && task.priority !== filters.priority) return false;
    if (filters.vehicleType !== 'all' && task.vehicleType !== filters.vehicleType) return false;
    if (searchQuery && !task.customerName.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'assigned': return 'bg-blue-100 text-blue-800';
      case 'in_progress': return 'bg-purple-100 text-purple-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <Navigation className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Advanced Route Planning</h1>
                <p className="text-sm text-gray-500">eLogii-inspired optimization platform</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-gray-600">
                  {realTimeEnabled ? 'Real-time' : 'Offline'}
                </span>
              </div>
              <button
                onClick={() => setRealTimeEnabled(!realTimeEnabled)}
                className="p-2 text-gray-400 hover:text-gray-600"
              >
                {realTimeEnabled ? <Wifi className="w-5 h-5" /> : <WifiOff className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex h-[calc(100vh-80px)]">
        {/* Left Sidebar */}
        <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
          {/* Date and Filters */}
          <div className="p-4 border-b border-gray-200">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Planning Date
                </label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Depot
                </label>
                <select
                  value={selectedDepot}
                  onChange={(e) => setSelectedDepot(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Depots</option>
                  <option value="main">Main Depot</option>
                  <option value="north">North Depot</option>
                  <option value="south">South Depot</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Driver
                </label>
                <select
                  value={selectedDriver}
                  onChange={(e) => setSelectedDriver(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Drivers</option>
                  {drivers.map(driver => (
                    <option key={driver.id} value={driver.id}>
                      {driver.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="p-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Quick Stats</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-blue-50 rounded-lg p-3">
                <div className="text-2xl font-bold text-blue-600">{tasks.length}</div>
                <div className="text-sm text-blue-600">Total Tasks</div>
              </div>
              <div className="bg-green-50 rounded-lg p-3">
                <div className="text-2xl font-bold text-green-600">{routes.length}</div>
                <div className="text-sm text-green-600">Routes</div>
              </div>
              <div className="bg-purple-50 rounded-lg p-3">
                <div className="text-2xl font-bold text-purple-600">{drivers.length}</div>
                <div className="text-sm text-purple-600">Drivers</div>
              </div>
              <div className="bg-orange-50 rounded-lg p-3">
                <div className="text-2xl font-bold text-orange-600">
                  {tasks.filter(t => t.status === 'pending').length}
                </div>
                <div className="text-sm text-orange-600">Pending</div>
              </div>
            </div>
          </div>

          {/* Tasks List */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold text-gray-900">Tasks</h3>
                <button className="text-blue-600 hover:text-blue-700">
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              
              <div className="space-y-2">
                {filteredTasks.map(task => (
                  <div
                    key={task.id}
                    className="bg-white border border-gray-200 rounded-lg p-3 hover:shadow-md transition-shadow cursor-pointer"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 text-sm">{task.customerName}</h4>
                        <p className="text-xs text-gray-500">{task.address}</p>
                      </div>
                      <div className="flex space-x-1">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}>
                          {task.status}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}>
                          {task.priority}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>{task.timeWindow.from} - {task.timeWindow.to}</span>
                      <span>{task.serviceDuration}min</span>
                    </div>
                    
                    <div className="flex items-center justify-between text-xs text-gray-500 mt-1">
                      <span>{task.weight}kg</span>
                      <span>{task.volume}m³</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col">
          {/* Toolbar */}
          <div className="bg-white border-b border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="flex bg-gray-100 rounded-lg p-1">
                  <button
                    onClick={() => setActiveView('map')}
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      activeView === 'map' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <Map className="w-4 h-4 inline mr-2" />
                    Map
                  </button>
                  <button
                    onClick={() => setActiveView('timeline')}
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      activeView === 'timeline' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <Clock className="w-4 h-4 inline mr-2" />
                    Timeline
                  </button>
                  <button
                    onClick={() => setActiveView('gantt')}
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      activeView === 'gantt' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <GanttChart className="w-4 h-4 inline mr-2" />
                    Gantt
                  </button>
                  <button
                    onClick={() => setActiveView('analytics')}
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      activeView === 'analytics' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <BarChart3 className="w-4 h-4 inline mr-2" />
                    Analytics
                  </button>
                </div>
                
                <div className="flex items-center space-x-2">
                  <button
                    onClick={startOptimization}
                    disabled={isOptimizing}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center space-x-2"
                  >
                    {isOptimizing ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Optimizing...</span>
                      </>
                    ) : (
                      <>
                        <Zap className="w-4 h-4" />
                        <span>Optimize Routes</span>
                      </>
                    )}
                  </button>
                  
                  <button
                    onClick={() => setShowOptimizationPanel(true)}
                    className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 flex items-center space-x-2"
                  >
                    <Settings className="w-4 h-4" />
                    <span>Settings</span>
                  </button>
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search tasks..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <button
                  onClick={() => setShowAnalyticsPanel(true)}
                  className="p-2 text-gray-400 hover:text-gray-600"
                >
                  <Activity className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Content Area */}
          <div className="flex-1 p-6">
            {activeView === 'map' && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 h-full">
                <div className="p-4 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900">Route Map</h3>
                  <p className="text-sm text-gray-500">Interactive map view with real-time tracking</p>
                </div>
                <div className="p-4 h-[calc(100%-80px)]">
                  <div className="w-full h-full bg-gray-100 rounded-lg flex items-center justify-center">
                    <div className="text-center">
                      <Map className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                      <h4 className="text-lg font-medium text-gray-900 mb-2">Interactive Map</h4>
                      <p className="text-gray-500">
                        Map integration would show real-time driver locations,<br />
                        optimized routes, and task waypoints
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {activeView === 'timeline' && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 h-full">
                <div className="p-4 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900">Timeline View</h3>
                  <p className="text-sm text-gray-500">Chronological view of all tasks and routes</p>
                </div>
                <div className="p-4 h-[calc(100%-80px)] overflow-y-auto">
                  <div className="space-y-4">
                    {routes.map(route => (
                      <div key={route.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-semibold text-gray-900">{route.driverName}</h4>
                          <span className="text-sm text-gray-500">{route.startTime} - {route.endTime}</span>
                        </div>
                        <div className="grid grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="text-gray-500">Distance:</span>
                            <span className="ml-2 font-medium">{route.totalDistance}km</span>
                          </div>
                          <div>
                            <span className="text-gray-500">Duration:</span>
                            <span className="ml-2 font-medium">{route.totalDuration}min</span>
                          </div>
                          <div>
                            <span className="text-gray-500">Tasks:</span>
                            <span className="ml-2 font-medium">{route.tasks.length}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">Score:</span>
                            <span className="ml-2 font-medium">{route.optimizationScore}%</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
            
            {activeView === 'gantt' && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 h-full">
                <div className="p-4 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900">Gantt Chart</h3>
                  <p className="text-sm text-gray-500">Visual timeline of routes and tasks</p>
                </div>
                <div className="p-4 h-[calc(100%-80px)]">
                  <div className="w-full h-full bg-gray-100 rounded-lg flex items-center justify-center">
                    <div className="text-center">
                      <GanttChart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                      <h4 className="text-lg font-medium text-gray-900 mb-2">Gantt Chart</h4>
                      <p className="text-gray-500">
                        Interactive Gantt chart showing route timelines,<br />
                        task dependencies, and resource allocation
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {activeView === 'analytics' && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 h-full">
                <div className="p-4 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900">Analytics Dashboard</h3>
                  <p className="text-sm text-gray-500">Performance metrics and insights</p>
                </div>
                <div className="p-4 h-[calc(100%-80px)]">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    <div className="bg-blue-50 rounded-lg p-4">
                      <div className="text-2xl font-bold text-blue-600">92%</div>
                      <div className="text-sm text-blue-600">Optimization Score</div>
                    </div>
                    <div className="bg-green-50 rounded-lg p-4">
                      <div className="text-2xl font-bold text-green-600">15.5km</div>
                      <div className="text-sm text-green-600">Avg Distance</div>
                    </div>
                    <div className="bg-purple-50 rounded-lg p-4">
                      <div className="text-2xl font-bold text-purple-600">4.5hrs</div>
                      <div className="text-sm text-purple-600">Avg Duration</div>
                    </div>
                    <div className="bg-orange-50 rounded-lg p-4">
                      <div className="text-2xl font-bold text-orange-600">€450</div>
                      <div className="text-sm text-orange-600">Avg Cost</div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="font-semibold text-gray-900 mb-3">Route Performance</h4>
                      <div className="space-y-2">
                        {routes.map(route => (
                          <div key={route.id} className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">{route.driverName}</span>
                            <div className="flex items-center space-x-2">
                              <div className="w-20 bg-gray-200 rounded-full h-2">
                                <div 
                                  className="bg-blue-600 h-2 rounded-full"
                                  style={{ width: `${route.optimizationScore}%` }}
                                ></div>
                              </div>
                              <span className="text-sm font-medium">{route.optimizationScore}%</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="font-semibold text-gray-900 mb-3">Task Distribution</h4>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Pending</span>
                          <span className="text-sm font-medium">{tasks.filter(t => t.status === 'pending').length}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Assigned</span>
                          <span className="text-sm font-medium">{tasks.filter(t => t.status === 'assigned').length}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">In Progress</span>
                          <span className="text-sm font-medium">{tasks.filter(t => t.status === 'in_progress').length}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Completed</span>
                          <span className="text-sm font-medium">{tasks.filter(t => t.status === 'completed').length}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Optimization Progress Modal */}
      {isOptimizing && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Optimizing Routes</h3>
            <div className="mb-4">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${optimizationProgress}%` }}
                ></div>
              </div>
              <div className="text-sm text-gray-600 mt-2">{optimizationProgress}% complete</div>
            </div>
            <div className="text-sm text-gray-500">
              {optimizationProgress < 30 && "Analyzing constraints and objectives..."}
              {optimizationProgress >= 30 && optimizationProgress < 60 && "Generating initial solutions..."}
              {optimizationProgress >= 60 && optimizationProgress < 90 && "Optimizing routes with AI algorithms..."}
              {optimizationProgress >= 90 && "Finalizing optimal routes..."}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
