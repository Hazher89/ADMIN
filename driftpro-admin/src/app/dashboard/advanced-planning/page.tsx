'use client';

import React, { useState, useEffect } from 'react';
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
  Wifi,
  WifiOff,
  ChevronRight,
  Users,
  TrendingUp,
  Building2
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export default function AdvancedPlanningPage() {
  const { userProfile } = useAuth();
  
  // UI state
  const [activeView, setActiveView] = useState<'map' | 'timeline' | 'gantt' | 'analytics'>('map');
  const [selectedDate, setSelectedDate] = useState('');
  const [isInitialized, setIsInitialized] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [realTimeEnabled, setRealTimeEnabled] = useState(true);
  
  // Initialize date on client-side
  useEffect(() => {
    if (typeof window !== 'undefined' && !selectedDate) {
      setSelectedDate(new Date().toISOString().split('T')[0]);
      setIsInitialized(true);
    }
  }, [selectedDate]);

  // Show loading state until initialized
  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-6"></div>
          <p className="text-white text-lg">Loading Advanced Planning System...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 flex">
      {/* Left Sidebar */}
      <div className={`${sidebarCollapsed ? 'w-16' : 'w-80'} bg-gray-800 transition-all duration-300 flex flex-col border-r border-gray-700`}>
        {/* Header */}
        <div className="p-4 border-b border-gray-700">
          <div className="flex items-center justify-between">
            {!sidebarCollapsed && (
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <Navigation className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-bold text-white">Advanced Planning</h1>
                  <p className="text-xs text-gray-400">eLogii Platform</p>
                </div>
              </div>
            )}
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
            >
              <ChevronRight className={`w-4 h-4 text-gray-400 transition-transform ${sidebarCollapsed ? 'rotate-180' : ''}`} />
            </button>
          </div>
        </div>

        {/* Quick Stats */}
        {!sidebarCollapsed && (
          <div className="p-4 border-b border-gray-700">
            <h3 className="text-sm font-semibold text-gray-300 mb-3">Live Statistics</h3>
            <div className="space-y-3">
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-3 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-blue-100">Total Tasks</p>
                    <p className="text-xl font-bold text-white">24</p>
                  </div>
                  <Package className="w-6 h-6 text-blue-200" />
                </div>
              </div>
              <div className="bg-gradient-to-r from-green-600 to-green-700 p-3 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-green-100">Active Routes</p>
                    <p className="text-xl font-bold text-white">8</p>
                  </div>
                  <Route className="w-6 h-6 text-green-200" />
                </div>
              </div>
              <div className="bg-gradient-to-r from-purple-600 to-purple-700 p-3 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-purple-100">Drivers Online</p>
                    <p className="text-xl font-bold text-white">12</p>
                  </div>
                  <Truck className="w-6 h-6 text-purple-200" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* View Mode */}
        {!sidebarCollapsed && (
          <div className="p-4 border-b border-gray-700">
            <h3 className="text-sm font-semibold text-gray-300 mb-3">View Mode</h3>
            <div className="space-y-2">
              <button
                onClick={() => setActiveView('map')}
                className={`w-full flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeView === 'map' 
                    ? 'bg-blue-600 text-white shadow-lg' 
                    : 'text-gray-400 hover:text-white hover:bg-gray-700'
                }`}
              >
                <Map className="w-4 h-4 mr-3" />
                Map View
              </button>
              <button
                onClick={() => setActiveView('timeline')}
                className={`w-full flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeView === 'timeline' 
                    ? 'bg-green-600 text-white shadow-lg' 
                    : 'text-gray-400 hover:text-white hover:bg-gray-700'
                }`}
              >
                <Clock className="w-4 h-4 mr-3" />
                Timeline
              </button>
              <button
                onClick={() => setActiveView('gantt')}
                className={`w-full flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeView === 'gantt' 
                    ? 'bg-purple-600 text-white shadow-lg' 
                    : 'text-gray-400 hover:text-white hover:bg-gray-700'
                }`}
              >
                <GanttChart className="w-4 h-4 mr-3" />
                Gantt Chart
              </button>
              <button
                onClick={() => setActiveView('analytics')}
                className={`w-full flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeView === 'analytics' 
                    ? 'bg-orange-600 text-white shadow-lg' 
                    : 'text-gray-400 hover:text-white hover:bg-gray-700'
                }`}
              >
                <BarChart3 className="w-4 h-4 mr-3" />
                Analytics
              </button>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        {!sidebarCollapsed && (
          <div className="p-4 border-b border-gray-700">
            <h3 className="text-sm font-semibold text-gray-300 mb-3">Quick Actions</h3>
            <div className="space-y-2">
              <button className="w-full flex items-center px-3 py-2 text-sm text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors">
                <Plus className="w-4 h-4 mr-3" />
                Add Task
              </button>
              <button className="w-full flex items-center px-3 py-2 text-sm text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors">
                <User className="w-4 h-4 mr-3" />
                Add Driver
              </button>
              <button className="w-full flex items-center px-3 py-2 text-sm text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors">
                <Building2 className="w-4 h-4 mr-3" />
                Add Depot
              </button>
            </div>
          </div>
        )}

        {/* Filters */}
        {!sidebarCollapsed && (
          <div className="p-4 flex-1">
            <h3 className="text-sm font-semibold text-gray-300 mb-3">Filters</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-gray-400 mb-1">Status</label>
                <select className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="assigned">Assigned</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Priority</label>
                <select className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="all">All Priority</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Collapsed Icons */}
        {sidebarCollapsed && (
          <div className="flex-1 flex flex-col items-center py-4 space-y-4">
            <button
              onClick={() => setActiveView('map')}
              className={`p-3 rounded-lg transition-colors ${
                activeView === 'map' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-700'
              }`}
            >
              <Map className="w-5 h-5" />
            </button>
            <button
              onClick={() => setActiveView('timeline')}
              className={`p-3 rounded-lg transition-colors ${
                activeView === 'timeline' ? 'bg-green-600 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-700'
              }`}
            >
              <Clock className="w-5 h-5" />
            </button>
            <button
              onClick={() => setActiveView('gantt')}
              className={`p-3 rounded-lg transition-colors ${
                activeView === 'gantt' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-700'
              }`}
            >
              <GanttChart className="w-5 h-5" />
            </button>
            <button
              onClick={() => setActiveView('analytics')}
              className={`p-3 rounded-lg transition-colors ${
                activeView === 'analytics' ? 'bg-orange-600 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-700'
              }`}
            >
              <BarChart3 className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Top Header */}
        <div className="bg-gray-800 border-b border-gray-700 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search tasks, customers, addresses..."
                  className="pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 w-80"
                />
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              </div>
              <select 
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Date</option>
                <option value={new Date().toISOString().split('T')[0]}>Today</option>
                <option value={new Date(Date.now() + 86400000).toISOString().split('T')[0]}>Tomorrow</option>
              </select>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 bg-gray-700 px-4 py-2 rounded-lg">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-sm text-gray-300">
                  {realTimeEnabled ? 'Real-time' : 'Offline'}
                </span>
              </div>
              <button className="flex items-center px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all">
                <Zap className="w-4 h-4 mr-2" />
                Optimize Routes
              </button>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 relative overflow-hidden">
          {activeView === 'map' && (
            <div className="h-full bg-gradient-to-br from-blue-900 via-blue-800 to-purple-900 relative">
              {/* Map Header Overlay */}
              <div className="absolute top-0 left-0 right-0 bg-gray-800/90 backdrop-blur-sm border-b border-gray-700 z-10 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-white">Interactive Map View</h2>
                    <p className="text-gray-300">Real-time route visualization with live driver tracking</p>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="bg-green-600 px-4 py-2 rounded-lg">
                      <span className="text-white font-semibold text-sm">Live Tracking</span>
                    </div>
                    <div className="bg-blue-600 px-4 py-2 rounded-lg">
                      <span className="text-white font-semibold text-sm">12 Drivers Active</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Map Content */}
              <div className="pt-20 h-full relative">
                {/* Simulated Map Elements */}
                <div className="absolute inset-0 opacity-30">
                  <div className="absolute top-10 left-10 w-6 h-6 bg-green-400 rounded-full animate-pulse shadow-lg"></div>
                  <div className="absolute top-32 left-24 w-6 h-6 bg-red-400 rounded-full animate-pulse shadow-lg"></div>
                  <div className="absolute top-48 left-16 w-6 h-6 bg-yellow-400 rounded-full animate-pulse shadow-lg"></div>
                  <div className="absolute top-64 left-40 w-6 h-6 bg-blue-400 rounded-full animate-pulse shadow-lg"></div>
                  <div className="absolute top-20 right-20 w-6 h-6 bg-purple-400 rounded-full animate-pulse shadow-lg"></div>
                  <div className="absolute top-40 right-32 w-6 h-6 bg-pink-400 rounded-full animate-pulse shadow-lg"></div>
                  
                  {/* Route Lines */}
                  <svg className="absolute inset-0 w-full h-full">
                    <line x1="40" y1="40" x2="160" y2="128" stroke="#10B981" strokeWidth="4" strokeDasharray="8,4" className="animate-pulse"/>
                    <line x1="96" y2="192" x2="320" y2="80" stroke="#EF4444" strokeWidth="4" strokeDasharray="8,4" className="animate-pulse"/>
                    <line x2="64" y1="192" x2="160" y2="256" stroke="#F59E0B" strokeWidth="4" strokeDasharray="8,4" className="animate-pulse"/>
                  </svg>
                </div>

                {/* Map Controls */}
                <div className="absolute top-6 right-6 bg-gray-800/90 backdrop-blur-sm rounded-xl p-4 shadow-xl">
                  <div className="space-y-3">
                    <button className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors text-sm">
                      <Navigation className="w-4 h-4 inline mr-2" />
                      Center Map
                    </button>
                    <button className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors text-sm">
                      <Users className="w-4 h-4 inline mr-2" />
                      Show Drivers
                    </button>
                    <button className="w-full bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors text-sm">
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
                      <div className="text-2xl font-bold text-blue-400">24</div>
                      <div className="text-xs text-gray-300">Active Tasks</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-400">8</div>
                      <div className="text-xs text-gray-300">Active Routes</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-400">12</div>
                      <div className="text-xs text-gray-300">Online Drivers</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-orange-400">94.5%</div>
                      <div className="text-xs text-gray-300">Optimization</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeView === 'timeline' && (
            <div className="h-full bg-gradient-to-br from-gray-800 to-gray-900">
              {/* Timeline Header */}
              <div className="bg-gray-800/90 backdrop-blur-sm border-b border-gray-700 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-white">Timeline View</h2>
                    <p className="text-gray-300">Schedule optimization with time-window constraints</p>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="bg-green-600 px-4 py-2 rounded-lg">
                      <span className="text-white font-semibold text-sm">Live Schedule</span>
                    </div>
                    <div className="bg-blue-600 px-4 py-2 rounded-lg">
                      <span className="text-white font-semibold text-sm">Auto-Optimized</span>
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
                      <h3 className="text-lg font-bold text-white">Morning Routes</h3>
                      <span className="bg-blue-600 text-white px-3 py-1 rounded-lg text-sm font-semibold">08:00 - 12:00</span>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="bg-blue-700/50 p-4 rounded-lg">
                        <div className="text-xl font-bold text-blue-200">15</div>
                        <div className="text-xs text-blue-100">Tasks</div>
                      </div>
                      <div className="bg-blue-700/50 p-4 rounded-lg">
                        <div className="text-xl font-bold text-blue-200">3</div>
                        <div className="text-xs text-blue-100">Routes</div>
                      </div>
                      <div className="bg-blue-700/50 p-4 rounded-lg">
                        <div className="text-xl font-bold text-blue-200">92%</div>
                        <div className="text-xs text-blue-100">Efficiency</div>
                      </div>
                    </div>
                  </div>

                  {/* Afternoon Routes */}
                  <div className="bg-gradient-to-r from-green-900 to-green-800 rounded-xl p-6 shadow-xl">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-bold text-white">Afternoon Routes</h3>
                      <span className="bg-green-600 text-white px-3 py-1 rounded-lg text-sm font-semibold">13:00 - 17:00</span>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="bg-green-700/50 p-4 rounded-lg">
                        <div className="text-xl font-bold text-green-200">22</div>
                        <div className="text-xs text-green-100">Tasks</div>
                      </div>
                      <div className="bg-green-700/50 p-4 rounded-lg">
                        <div className="text-xl font-bold text-green-200">4</div>
                        <div className="text-xs text-green-100">Routes</div>
                      </div>
                      <div className="bg-green-700/50 p-4 rounded-lg">
                        <div className="text-xl font-bold text-green-200">88%</div>
                        <div className="text-xs text-green-100">Efficiency</div>
                      </div>
                    </div>
                  </div>

                  {/* Evening Routes */}
                  <div className="bg-gradient-to-r from-purple-900 to-purple-800 rounded-xl p-6 shadow-xl">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-bold text-white">Evening Routes</h3>
                      <span className="bg-purple-600 text-white px-3 py-1 rounded-lg text-sm font-semibold">17:00 - 20:00</span>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="bg-purple-700/50 p-4 rounded-lg">
                        <div className="text-xl font-bold text-purple-200">8</div>
                        <div className="text-xs text-purple-100">Tasks</div>
                      </div>
                      <div className="bg-purple-700/50 p-4 rounded-lg">
                        <div className="text-xl font-bold text-purple-200">2</div>
                        <div className="text-xs text-purple-100">Routes</div>
                      </div>
                      <div className="bg-purple-700/50 p-4 rounded-lg">
                        <div className="text-xl font-bold text-purple-200">95%</div>
                        <div className="text-xs text-purple-100">Efficiency</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeView === 'gantt' && (
            <div className="h-full bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
              <div className="text-center">
                <GanttChart className="w-24 h-24 text-gray-400 mx-auto mb-6" />
                <h3 className="text-2xl font-bold text-white mb-4">Gantt Chart View</h3>
                <p className="text-gray-400 mb-6">Visual route planning with drag & drop scheduling</p>
                <div className="grid grid-cols-2 gap-6 max-w-md mx-auto">
                  <div className="bg-blue-600/20 p-6 rounded-xl border border-blue-500/30">
                    <div className="text-lg font-bold text-blue-400">Parallel Optimization</div>
                    <div className="text-sm text-gray-300">Multi-depot routing</div>
                  </div>
                  <div className="bg-green-600/20 p-6 rounded-xl border border-green-500/30">
                    <div className="text-lg font-bold text-green-400">Real-time Updates</div>
                    <div className="text-sm text-gray-300">Live synchronization</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeView === 'analytics' && (
            <div className="h-full bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
              <div className="text-center">
                <BarChart3 className="w-24 h-24 text-gray-400 mx-auto mb-6" />
                <h3 className="text-2xl font-bold text-white mb-4">Analytics Dashboard</h3>
                <p className="text-gray-400 mb-6">Performance metrics and optimization insights</p>
                <div className="grid grid-cols-2 gap-6 max-w-md mx-auto">
                  <div className="bg-blue-600/20 p-6 rounded-xl border border-blue-500/30">
                    <div className="text-2xl font-bold text-blue-400">94.5%</div>
                    <div className="text-sm text-gray-300">Optimization Score</div>
                  </div>
                  <div className="bg-green-600/20 p-6 rounded-xl border border-green-500/30">
                    <div className="text-2xl font-bold text-green-400">87%</div>
                    <div className="text-sm text-gray-300">On-time Delivery</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
