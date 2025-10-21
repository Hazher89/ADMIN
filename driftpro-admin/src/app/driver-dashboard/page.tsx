'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Truck, 
  MapPin, 
  Clock, 
  Package, 
  CheckCircle, 
  AlertCircle,
  User,
  LogOut,
  Navigation,
  Calendar,
  BarChart3,
  Settings,
  Eye,
  Play,
  Pause,
  RefreshCw,
  Bell,
  Home,
  Route,
  Zap,
  Star
} from 'lucide-react';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { collection, query, where, getDocs, doc, getDoc, orderBy, limit } from 'firebase/firestore';
import { useAuth } from '@/contexts/AuthContext';

interface Driver {
  id: string;
  name: string;
  email: string;
  phone: string;
  companyId: string;
  companyName: string;
  vehicleId: string;
  vehicleName: string;
  role: 'driver';
  status: 'active' | 'inactive';
  createdAt: any;
}

interface AssignedRoute {
  id: string;
  routeNumber: string; // 8-digit code
  name: string;
  driverId: string;
  driverName: string;
  companyId: string;
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
  freightUnits: any[];
  createdAt: any;
  updatedAt: any;
}

export default function DriverDashboardPage() {
  const router = useRouter();
  const { user, userProfile, logout } = useAuth();
  const [assignedRoutes, setAssignedRoutes] = useState<AssignedRoute[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'today' | 'upcoming' | 'completed'>('today');

  // Check authentication and load driver data
  useEffect(() => {
    if (!user || !userProfile) {
      router.push('/driver-login');
      return;
    }

    if (userProfile.role !== 'driver') {
      setError('Denne kontoen er ikke en sjåfør-konto');
      logout();
      router.push('/driver-login');
      return;
    }

    if (userProfile.status === 'inactive') {
      setError('Kontoen er deaktivert');
      logout();
      router.push('/driver-login');
      return;
    }

    // Load assigned routes
    loadAssignedRoutes(userProfile.id);
    setIsLoading(false);
  }, [user, userProfile, router, logout]);

  const loadAssignedRoutes = async (driverId: string) => {
    try {
      // Load routes from plannedRoutes collection
      const routesQuery = query(
        collection(db, 'plannedRoutes'),
        where('driverId', '==', driverId),
        orderBy('createdAt', 'desc'),
        limit(50)
      );

      const routesSnapshot = await getDocs(routesQuery);
      const routes: AssignedRoute[] = [];

      routesSnapshot.forEach((doc) => {
        const data = doc.data();
        routes.push({
          id: doc.id,
          routeNumber: data.routeNumber || data.id || 'N/A',
          name: data.name || `Rute ${doc.id}`,
          driverId: data.driverId || driverId,
          driverName: data.driverName || userProfile?.displayName || 'Ukjent',
          companyId: data.companyId || '',
          companyName: data.companyName || '',
          vehicleId: data.vehicleId || '',
          vehicleName: data.vehicleName || '',
          status: data.status || 'assigned',
          startTime: data.startTime || '08:00',
          endTime: data.endTime || '17:00',
          totalStops: data.freightUnits?.length || 0,
          completedStops: data.completedStops || 0,
          totalDistance: data.totalDistance || 0,
          totalWeight: data.totalWeight || 0,
          totalVolume: data.totalVolume || 0,
          freightUnits: data.freightUnits || [],
          createdAt: data.createdAt,
          updatedAt: data.updatedAt
        });
      });

      setAssignedRoutes(routes);
    } catch (error) {
      console.error('Error loading assigned routes:', error);
      setError('Kunne ikke laste tildelte ruter');
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/driver-login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const startRoute = (routeId: string) => {
    // Navigate to delivery page with route ID
    router.push(`/driver-delivery?routeId=${routeId}`);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'assigned': return 'bg-blue-100 text-blue-800';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'assigned': return 'Tildelt';
      case 'in_progress': return 'Pågår';
      case 'completed': return 'Fullført';
      case 'cancelled': return 'Kansellert';
      default: return 'Ukjent';
    }
  };

  const filteredRoutes = assignedRoutes.filter(route => {
    switch (activeTab) {
      case 'today':
        return route.status === 'assigned' || route.status === 'in_progress';
      case 'upcoming':
        return route.status === 'assigned';
      case 'completed':
        return route.status === 'completed';
      default:
        return true;
    }
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Laster dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => router.push('/driver-login')}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            Logg inn på nytt
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-green-600 rounded-lg flex items-center justify-center">
                <Truck className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">DriftPro Driver</h1>
                <p className="text-sm text-gray-500">Velkommen, {userProfile?.displayName}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <button className="p-2 text-gray-400 hover:text-gray-600">
                <Bell className="w-5 h-5" />
              </button>
              <button className="p-2 text-gray-400 hover:text-gray-600">
                <Settings className="w-5 h-5" />
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
              >
                <LogOut className="w-4 h-4" />
                <span>Logg ut</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6 border">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Route className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Tildelte Ruter</p>
                <p className="text-2xl font-bold text-gray-900">
                  {assignedRoutes.filter(r => r.status === 'assigned').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 border">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Navigation className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pågående Ruter</p>
                <p className="text-2xl font-bold text-gray-900">
                  {assignedRoutes.filter(r => r.status === 'in_progress').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 border">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Fullførte Ruter</p>
                <p className="text-2xl font-bold text-gray-900">
                  {assignedRoutes.filter(r => r.status === 'completed').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 border">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Package className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Totalt Leveringer</p>
                <p className="text-2xl font-bold text-gray-900">
                  {assignedRoutes.reduce((sum, route) => sum + route.totalStops, 0)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm border mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-6">
              {[
                { key: 'today', label: 'I dag', icon: Calendar },
                { key: 'upcoming', label: 'Kommende', icon: Clock },
                { key: 'completed', label: 'Fullført', icon: CheckCircle }
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as any)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                    activeTab === tab.key
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                  <span className={`ml-2 py-0.5 px-2 rounded-full text-xs ${
                    activeTab === tab.key
                      ? 'bg-blue-100 text-blue-600'
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {filteredRoutes.length}
                  </span>
                </button>
              ))}
            </nav>
          </div>

          {/* Routes List */}
          <div className="p-6">
            {filteredRoutes.length === 0 ? (
              <div className="text-center py-12">
                <Route className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Ingen ruter funnet
                </h3>
                <p className="text-gray-500">
                  {activeTab === 'today' && 'Du har ingen ruter for i dag'}
                  {activeTab === 'upcoming' && 'Du har ingen kommende ruter'}
                  {activeTab === 'completed' && 'Du har ikke fullført noen ruter ennå'}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredRoutes.map((route) => (
                  <div key={route.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {route.name}
                          </h3>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(route.status)}`}>
                            {getStatusText(route.status)}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                          <div className="flex items-center space-x-2">
                            <MapPin className="w-4 h-4" />
                            <span>{route.totalStops} stopp</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Package className="w-4 h-4" />
                            <span>{route.totalWeight}kg</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Clock className="w-4 h-4" />
                            <span>{route.startTime} - {route.endTime}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Navigation className="w-4 h-4" />
                            <span>{route.totalDistance}km</span>
                          </div>
                        </div>

                        {route.status === 'in_progress' && (
                          <div className="mt-3">
                            <div className="flex items-center justify-between text-sm mb-1">
                              <span className="text-gray-600">Fremgang</span>
                              <span className="font-medium">{route.completedStops}/{route.totalStops}</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-blue-600 h-2 rounded-full transition-all"
                                style={{ width: `${(route.completedStops / route.totalStops) * 100}%` }}
                              ></div>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center space-x-3 ml-6">
                        {route.status === 'assigned' && (
                          <button
                            onClick={() => startRoute(route.id)}
                            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2 transition-colors"
                          >
                            <Play className="w-4 h-4" />
                            <span>Start Rute</span>
                          </button>
                        )}
                        
                        {route.status === 'in_progress' && (
                          <button
                            onClick={() => startRoute(route.id)}
                            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center space-x-2 transition-colors"
                          >
                            <Navigation className="w-4 h-4" />
                            <span>Fortsett</span>
                          </button>
                        )}

                        <button
                          onClick={() => router.push(`/driver-delivery?routeId=${route.id}&view=true`)}
                          className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 flex items-center space-x-2 transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                          <span>Se Detaljer</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Hurtighandlinger</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => router.push('/driver-delivery')}
              className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left"
            >
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Zap className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">Start Ny Rute</h4>
                  <p className="text-sm text-gray-500">Skann 8-siffer kode</p>
                </div>
              </div>
            </button>

            <button
              onClick={() => loadAssignedRoutes(driver?.id || '')}
              className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left"
            >
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <RefreshCw className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">Oppdater Ruter</h4>
                  <p className="text-sm text-gray-500">Sjekk for nye tildelinger</p>
                </div>
              </div>
            </button>

            <button
              onClick={() => {
                // For now, show driver info in a simple alert
                alert(`Sjåfør: ${userProfile?.displayName}\nE-post: ${userProfile?.email}\nTelefon: ${userProfile?.phone}\nStatus: ${userProfile?.status || 'active'}`);
              }}
              className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left"
            >
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <User className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">Min Profil</h4>
                  <p className="text-sm text-gray-500">Se profilinformasjon</p>
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
