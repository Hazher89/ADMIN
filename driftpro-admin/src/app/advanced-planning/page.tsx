'use client';

import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  User, 
  ArrowRight, 
  Map, 
  Clock, 
  GanttChart, 
  BarChart3, 
  Plus, 
  Users, 
  Building2, 
  ChevronDown, 
  Search, 
  Zap, 
  MapPin, 
  Navigation, 
  Eye, 
  Route,
  Activity,
  Target,
  TrendingUp,
  Settings,
  Globe,
  Menu,
  X,
  Play,
  Pause,
  RotateCcw
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export default function AdvancedPlanningPage() {
  const { userProfile } = useAuth();
  
  // UI state
  const [isInitialized, setIsInitialized] = useState(false);
  const [activeView, setActiveView] = useState('map');
  const [statusFilter, setStatusFilter] = useState('All Status');
  const [priorityFilter, setPriorityFilter] = useState('All Priority');
  const [dateFilter, setDateFilter] = useState('Today');
  const [timeFilter, setTimeFilter] = useState('Real-time');
  const [searchQuery, setSearchQuery] = useState('');
  const [showDrivers, setShowDrivers] = useState(true);
  const [showRoutes, setShowRoutes] = useState(true);
  const [isOptimizing, setIsOptimizing] = useState(false);
  
  // Sample data
  const liveStats = {
    totalTasks: 24,
    activeRoutes: 8,
    driversOnline: 12,
    optimization: 94.5
  };

  // Initialize
  useEffect(() => {
    setIsInitialized(true);
  }, []);

  const handleOptimizeRoutes = () => {
    setIsOptimizing(true);
    setTimeout(() => {
      setIsOptimizing(false);
    }, 2000);
  };

  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-6"></div>
          <p className="text-gray-700 text-lg">Loading Advanced Planning System...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Left Sidebar */}
      <div className="w-64 bg-gray-800 text-white flex flex-col">
        {/* Logo */}
        <div className="p-6 border-b border-gray-700">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">eL</span>
            </div>
            <div>
              <div className="font-semibold text-sm">eLogi Platform</div>
              <ArrowRight className="w-4 h-4 text-gray-400 mt-1" />
            </div>
          </div>
        </div>

        {/* Live Statistics */}
        <div className="p-6 border-b border-gray-700">
          <h3 className="text-sm font-semibold text-gray-300 mb-4">Live Statistics</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-300">Total Tasks</span>
              <span className="text-lg font-bold text-white">{liveStats.totalTasks}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-300">Active Routes</span>
              <span className="text-lg font-bold text-white">{liveStats.activeRoutes}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-300">Drivers Online</span>
              <span className="text-lg font-bold text-white">{liveStats.driversOnline}</span>
            </div>
          </div>
        </div>

        {/* View Mode */}
        <div className="p-6 border-b border-gray-700">
          <h3 className="text-sm font-semibold text-gray-300 mb-4">View Mode</h3>
          <div className="space-y-2">
            <button 
              onClick={() => setActiveView('map')}
              className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                activeView === 'map' ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-700'
              }`}
            >
              <Map className="w-4 h-4" />
              <span>Map View</span>
            </button>
            <button 
              onClick={() => setActiveView('timeline')}
              className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                activeView === 'timeline' ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-700'
              }`}
            >
              <Clock className="w-4 h-4" />
              <span>Timeline</span>
            </button>
            <button 
              onClick={() => setActiveView('gantt')}
              className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                activeView === 'gantt' ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-700'
              }`}
            >
              <GanttChart className="w-4 h-4" />
              <span>Gantt Chart</span>
            </button>
            <button className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-sm text-gray-300 hover:bg-gray-700 transition-colors">
              <BarChart3 className="w-4 h-4" />
              <span>Analytics</span>
            </button>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="p-6 border-b border-gray-700">
          <h3 className="text-sm font-semibold text-gray-300 mb-4">Quick Actions</h3>
          <div className="space-y-2">
            <button className="w-full flex items-center space-x-3 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition-colors">
              <Plus className="w-4 h-4" />
              <span>Add Task</span>
            </button>
            <button className="w-full flex items-center space-x-3 px-3 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm transition-colors">
              <Users className="w-4 h-4" />
              <span>Add Driver</span>
            </button>
            <button className="w-full flex items-center space-x-3 px-3 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm transition-colors">
              <Building2 className="w-4 h-4" />
              <span>Add Depot</span>
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="p-6 flex-1">
          <h3 className="text-sm font-semibold text-gray-300 mb-4">Filters</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-xs text-gray-400 mb-1">Status</label>
              <select 
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full bg-gray-700 border border-gray-600 text-white px-3 py-2 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="All Status">All Status</option>
                <option value="Active">Active</option>
                <option value="Completed">Completed</option>
                <option value="Pending">Pending</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Priority</label>
              <select 
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="w-full bg-gray-700 border border-gray-600 text-white px-3 py-2 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="All Priority">All Priority</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>
          </div>
        </div>

        {/* Bottom Navigation */}
        <div className="p-6 border-t border-gray-700">
          <div className="flex flex-col space-y-3">
            <button className="flex items-center space-x-3 text-gray-300 hover:text-white transition-colors">
              <Settings className="w-5 h-5" />
            </button>
            <button className="flex items-center space-x-3 text-gray-300 hover:text-white transition-colors">
              <Users className="w-5 h-5" />
            </button>
            <button className="flex items-center space-x-3 text-gray-300 hover:text-white transition-colors">
              <Globe className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Advanced Planning</h1>
            </div>
            <div className="flex items-center space-x-4">
              <button className="relative p-2 text-gray-500 hover:text-gray-700">
                <Bell className="w-6 h-6" />
                <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>
              <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                <span className="text-white font-semibold">D</span>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Controls */}
        <div className="bg-white px-8 py-6 border-b border-gray-200">
          <div className="flex items-center space-x-4">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search tasks, customer"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Date Filter */}
            <select 
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="Today">Today</option>
              <option value="This Week">This Week</option>
              <option value="This Month">This Month</option>
            </select>

            {/* Time Filter */}
            <select 
              value={timeFilter}
              onChange={(e) => setTimeFilter(e.target.value)}
              className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="Real-time">Real-time</option>
              <option value="Historical">Historical</option>
            </select>

            {/* Optimize Routes Button */}
            <button 
              onClick={handleOptimizeRoutes}
              disabled={isOptimizing}
              className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              {isOptimizing ? (
                <>
                  <RotateCcw className="w-5 h-5 animate-spin" />
                  <span>Optimizing...</span>
                </>
              ) : (
                <>
                  <Zap className="w-5 h-5" />
                  <span>Optimize Routes</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-8">
          {/* Interactive Map View */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Interactive Map View</h2>
              <p className="text-gray-600">Real-time route visualization with live driver tracking.</p>
            </div>

            {/* Live Tracking Status */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium text-gray-700">Live Tracking</span>
              </div>
              <div className="text-sm text-gray-600">
                <span className="font-semibold text-green-600">{liveStats.driversOnline}</span> Drivers Active
              </div>
            </div>

            {/* Map Visualization */}
            <div className="relative h-96 bg-gray-100 rounded-lg overflow-hidden">
              {/* Route Lines */}
              <svg className="absolute inset-0 w-full h-full">
                <defs>
                  <pattern id="dashed" patternUnits="userSpaceOnUse" width="10" height="10">
                    <path d="M 0,5 l 10,0" stroke="#ef4444" strokeWidth="2" fill="none"/>
                  </pattern>
                  <pattern id="dashed-green" patternUnits="userSpaceOnUse" width="10" height="10">
                    <path d="M 0,5 l 10,0" stroke="#10b981" strokeWidth="2" fill="none"/>
                  </pattern>
                </defs>
                
                {/* Red Route Line */}
                <line 
                  x1="50" 
                  y1="100" 
                  x2="350" 
                  y2="250" 
                  stroke="url(#dashed)" 
                  strokeWidth="4"
                  className="animate-pulse"
                />
                
                {/* Green Route Line */}
                <line 
                  x1="100" 
                  y1="300" 
                  x2="400" 
                  y2="150" 
                  stroke="url(#dashed-green)" 
                  strokeWidth="4"
                  className="animate-pulse"
                  style={{ animationDelay: '0.5s' }}
                />

                {/* Driver Markers */}
                <circle cx="150" cy="150" r="8" fill="#3b82f6" stroke="white" strokeWidth="2">
                  <animate attributeName="r" values="8;12;8" dur="2s" repeatCount="indefinite"/>
                </circle>
                <circle cx="250" cy="200" r="8" fill="#10b981" stroke="white" strokeWidth="2">
                  <animate attributeName="r" values="8;12;8" dur="2s" repeatCount="indefinite" begin="0.5s"/>
                </circle>
                <circle cx="320" cy="120" r="8" fill="#ef4444" stroke="white" strokeWidth="2">
                  <animate attributeName="r" values="8;12;8" dur="2s" repeatCount="indefinite" begin="1s"/>
                </circle>
              </svg>

              {/* Map Controls */}
              <div className="absolute bottom-4 left-4 flex space-x-2">
                <button 
                  onClick={() => {}}
                  className="flex items-center space-x-2 bg-white hover:bg-gray-50 text-gray-700 px-3 py-2 rounded-lg shadow-sm border border-gray-200 transition-colors"
                >
                  <MapPin className="w-4 h-4" />
                  <span className="text-sm">Center Map</span>
                </button>
                <button 
                  onClick={() => setShowDrivers(!showDrivers)}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg shadow-sm border transition-colors ${
                    showDrivers 
                      ? 'bg-blue-600 text-white border-blue-600' 
                      : 'bg-white hover:bg-gray-50 text-gray-700 border-gray-200'
                  }`}
                >
                  <Users className="w-4 h-4" />
                  <span className="text-sm">Show Drivers</span>
                </button>
                <button 
                  onClick={() => setShowRoutes(!showRoutes)}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg shadow-sm border transition-colors ${
                    showRoutes 
                      ? 'bg-green-600 text-white border-green-600' 
                      : 'bg-white hover:bg-gray-50 text-gray-700 border-gray-200'
                  }`}
                >
                  <Route className="w-4 h-4" />
                  <span className="text-sm">Show Routes</span>
                </button>
              </div>
            </div>
          </div>

          {/* Live Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Tasks</p>
                  <p className="text-3xl font-bold text-gray-900">{liveStats.totalTasks}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Target className="w-6 h-6 text-blue-600" />
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm">
                <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                <span className="text-green-600 font-medium">+12%</span>
                <span className="text-gray-500 ml-1">from last week</span>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Online Drivers</p>
                  <p className="text-3xl font-bold text-gray-900">{liveStats.driversOnline}</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <Users className="w-6 h-6 text-green-600" />
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm">
                <Activity className="w-4 h-4 text-green-500 mr-1" />
                <span className="text-green-600 font-medium">All Active</span>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Routes</p>
                  <p className="text-3xl font-bold text-gray-900">{liveStats.activeRoutes}</p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Navigation className="w-6 h-6 text-purple-600" />
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm">
                <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                <span className="text-green-600 font-medium">+8%</span>
                <span className="text-gray-500 ml-1">efficiency</span>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Optimization</p>
                  <p className="text-3xl font-bold text-gray-900">{liveStats.optimization}%</p>
                </div>
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <Zap className="w-6 h-6 text-orange-600" />
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm">
                <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                <span className="text-green-600 font-medium">+2.3%</span>
                <span className="text-gray-500 ml-1">this week</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}