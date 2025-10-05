'use client';

import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  ArrowRight, 
  Map, 
  Clock, 
  GanttChart, 
  BarChart3, 
  Plus, 
  Users, 
  Building2, 
  Search, 
  Zap, 
  MapPin, 
  Navigation, 
  Route,
  Activity,
  Target,
  TrendingUp,
  Settings,
  Globe,
  RotateCcw
} from 'lucide-react';

export default function AdvancedPlanningPage() {
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
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: '#f3f4f6', 
      display: 'flex',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      {/* Left Sidebar */}
      <div style={{ 
        width: '256px', 
        backgroundColor: '#1f2937', 
        color: 'white', 
        display: 'flex', 
        flexDirection: 'column' 
      }}>
        {/* Logo */}
        <div style={{ padding: '24px', borderBottom: '1px solid #374151' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ 
              width: '32px', 
              height: '32px', 
              backgroundColor: '#3b82f6', 
              borderRadius: '8px', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center' 
            }}>
              <span style={{ color: 'white', fontWeight: 'bold', fontSize: '14px' }}>eL</span>
            </div>
            <div>
              <div style={{ fontWeight: '600', fontSize: '14px' }}>eLogi Platform</div>
              <ArrowRight style={{ width: '16px', height: '16px', color: '#9ca3af', marginTop: '4px' }} />
            </div>
          </div>
        </div>

        {/* Live Statistics */}
        <div style={{ padding: '24px', borderBottom: '1px solid #374151' }}>
          <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#d1d5db', marginBottom: '16px' }}>Live Statistics</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '14px', color: '#d1d5db' }}>Total Tasks</span>
              <span style={{ fontSize: '18px', fontWeight: 'bold', color: 'white' }}>{liveStats.totalTasks}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '14px', color: '#d1d5db' }}>Active Routes</span>
              <span style={{ fontSize: '18px', fontWeight: 'bold', color: 'white' }}>{liveStats.activeRoutes}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '14px', color: '#d1d5db' }}>Drivers Online</span>
              <span style={{ fontSize: '18px', fontWeight: 'bold', color: 'white' }}>{liveStats.driversOnline}</span>
            </div>
          </div>
        </div>

        {/* View Mode */}
        <div style={{ padding: '24px', borderBottom: '1px solid #374151' }}>
          <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#d1d5db', marginBottom: '16px' }}>View Mode</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <button 
              onClick={() => setActiveView('map')}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '8px 12px',
                borderRadius: '8px',
                fontSize: '14px',
                backgroundColor: activeView === 'map' ? '#2563eb' : 'transparent',
                color: activeView === 'map' ? 'white' : '#d1d5db',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              <Map style={{ width: '16px', height: '16px' }} />
              <span>Map View</span>
            </button>
            <button 
              onClick={() => setActiveView('timeline')}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '8px 12px',
                borderRadius: '8px',
                fontSize: '14px',
                backgroundColor: activeView === 'timeline' ? '#2563eb' : 'transparent',
                color: activeView === 'timeline' ? 'white' : '#d1d5db',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              <Clock style={{ width: '16px', height: '16px' }} />
              <span>Timeline</span>
            </button>
            <button 
              onClick={() => setActiveView('gantt')}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '8px 12px',
                borderRadius: '8px',
                fontSize: '14px',
                backgroundColor: activeView === 'gantt' ? '#2563eb' : 'transparent',
                color: activeView === 'gantt' ? 'white' : '#d1d5db',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              <GanttChart style={{ width: '16px', height: '16px' }} />
              <span>Gantt Chart</span>
            </button>
            <button style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '8px 12px',
              borderRadius: '8px',
              fontSize: '14px',
              backgroundColor: 'transparent',
              color: '#d1d5db',
              border: 'none',
              cursor: 'pointer'
            }}>
              <BarChart3 style={{ width: '16px', height: '16px' }} />
              <span>Analytics</span>
            </button>
          </div>
        </div>

        {/* Quick Actions */}
        <div style={{ padding: '24px', borderBottom: '1px solid #374151' }}>
          <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#d1d5db', marginBottom: '16px' }}>Quick Actions</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <button style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '8px 12px',
              backgroundColor: '#2563eb',
              color: 'white',
              borderRadius: '8px',
              fontSize: '14px',
              border: 'none',
              cursor: 'pointer'
            }}>
              <Plus style={{ width: '16px', height: '16px' }} />
              <span>Add Task</span>
            </button>
            <button style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '8px 12px',
              backgroundColor: '#374151',
              color: 'white',
              borderRadius: '8px',
              fontSize: '14px',
              border: 'none',
              cursor: 'pointer'
            }}>
              <Users style={{ width: '16px', height: '16px' }} />
              <span>Add Driver</span>
            </button>
            <button style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '8px 12px',
              backgroundColor: '#374151',
              color: 'white',
              borderRadius: '8px',
              fontSize: '14px',
              border: 'none',
              cursor: 'pointer'
            }}>
              <Building2 style={{ width: '16px', height: '16px' }} />
              <span>Add Depot</span>
            </button>
          </div>
        </div>

        {/* Filters */}
        <div style={{ padding: '24px', flex: 1 }}>
          <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#d1d5db', marginBottom: '16px' }}>Filters</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', color: '#9ca3af', marginBottom: '4px' }}>Status</label>
              <select 
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={{
                  width: '100%',
                  backgroundColor: '#374151',
                  border: '1px solid #4b5563',
                  color: 'white',
                  padding: '8px 12px',
                  borderRadius: '4px',
                  fontSize: '14px'
                }}
              >
                <option value="All Status">All Status</option>
                <option value="Active">Active</option>
                <option value="Completed">Completed</option>
                <option value="Pending">Pending</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', color: '#9ca3af', marginBottom: '4px' }}>Priority</label>
              <select 
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                style={{
                  width: '100%',
                  backgroundColor: '#374151',
                  border: '1px solid #4b5563',
                  color: 'white',
                  padding: '8px 12px',
                  borderRadius: '4px',
                  fontSize: '14px'
                }}
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
        <div style={{ padding: '24px', borderTop: '1px solid #374151' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <button style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#d1d5db', border: 'none', background: 'none', cursor: 'pointer' }}>
              <Settings style={{ width: '20px', height: '20px' }} />
            </button>
            <button style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#d1d5db', border: 'none', background: 'none', cursor: 'pointer' }}>
              <Users style={{ width: '20px', height: '20px' }} />
            </button>
            <button style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#d1d5db', border: 'none', background: 'none', cursor: 'pointer' }}>
              <Globe style={{ width: '20px', height: '20px' }} />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <div style={{ backgroundColor: 'white', borderBottom: '1px solid #e5e7eb', padding: '24px 32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#111827' }}>Advanced Planning</h1>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <button style={{ position: 'relative', padding: '8px', color: '#6b7280' }}>
                <Bell style={{ width: '24px', height: '24px' }} />
                <span style={{ position: 'absolute', top: '0', right: '0', width: '8px', height: '8px', backgroundColor: '#ef4444', borderRadius: '50%' }}></span>
              </button>
              <div style={{ width: '40px', height: '40px', backgroundColor: '#3b82f6', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ color: 'white', fontWeight: '600' }}>D</span>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Controls */}
        <div style={{ backgroundColor: 'white', padding: '24px 32px', borderBottom: '1px solid #e5e7eb' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            {/* Search */}
            <div style={{ position: 'relative', flex: 1, maxWidth: '384px' }}>
              <Search style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', width: '20px', height: '20px', color: '#9ca3af' }} />
              <input
                type="text"
                placeholder="Search tasks, customer"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  paddingLeft: '40px',
                  paddingRight: '16px',
                  paddingTop: '12px',
                  paddingBottom: '12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '16px'
                }}
              />
            </div>

            {/* Date Filter */}
            <select 
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              style={{
                padding: '12px 16px',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '16px'
              }}
            >
              <option value="Today">Today</option>
              <option value="This Week">This Week</option>
              <option value="This Month">This Month</option>
            </select>

            {/* Time Filter */}
            <select 
              value={timeFilter}
              onChange={(e) => setTimeFilter(e.target.value)}
              style={{
                padding: '12px 16px',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '16px'
              }}
            >
              <option value="Real-time">Real-time</option>
              <option value="Historical">Historical</option>
            </select>

            {/* Optimize Routes Button */}
            <button 
              onClick={handleOptimizeRoutes}
              disabled={isOptimizing}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                backgroundColor: isOptimizing ? '#9ca3af' : '#2563eb',
                color: 'white',
                padding: '12px 24px',
                borderRadius: '8px',
                fontWeight: '500',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              {isOptimizing ? (
                <>
                  <RotateCcw style={{ width: '20px', height: '20px', animation: 'spin 1s linear infinite' }} />
                  <span>Optimizing...</span>
                </>
              ) : (
                <>
                  <Zap style={{ width: '20px', height: '20px' }} />
                  <span>Optimize Routes</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div style={{ flex: 1, padding: '32px' }}>
          {/* Interactive Map View */}
          <div style={{ backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)', border: '1px solid #e5e7eb', padding: '24px', marginBottom: '24px' }}>
            <div style={{ marginBottom: '24px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: '600', color: '#111827', marginBottom: '8px' }}>Interactive Map View</h2>
              <p style={{ color: '#6b7280' }}>Real-time route visualization with live driver tracking.</p>
            </div>

            {/* Live Tracking Status */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '12px', height: '12px', backgroundColor: '#10b981', borderRadius: '50%', animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' }}></div>
                <span style={{ fontSize: '14px', fontWeight: '500', color: '#374151' }}>Live Tracking</span>
              </div>
              <div style={{ fontSize: '14px', color: '#6b7280' }}>
                <span style={{ fontWeight: '600', color: '#10b981' }}>{liveStats.driversOnline}</span> Drivers Active
              </div>
            </div>

            {/* Map Visualization */}
            <div style={{ position: 'relative', height: '384px', backgroundColor: '#f3f4f6', borderRadius: '8px', overflow: 'hidden' }}>
              {/* Route Lines */}
              <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
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
                  style={{ animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' }}
                />
                
                {/* Green Route Line */}
                <line 
                  x1="100" 
                  y1="300" 
                  x2="400" 
                  y2="150" 
                  stroke="url(#dashed-green)" 
                  strokeWidth="4"
                  style={{ animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite', animationDelay: '0.5s' }}
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
              <div style={{ position: 'absolute', bottom: '16px', left: '16px', display: 'flex', gap: '8px' }}>
                <button style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  backgroundColor: 'white',
                  color: '#374151',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                  border: '1px solid #e5e7eb',
                  cursor: 'pointer'
                }}>
                  <MapPin style={{ width: '16px', height: '16px' }} />
                  <span style={{ fontSize: '14px' }}>Center Map</span>
                </button>
                <button 
                  onClick={() => setShowDrivers(!showDrivers)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                    border: '1px solid #e5e7eb',
                    cursor: 'pointer',
                    backgroundColor: showDrivers ? '#2563eb' : 'white',
                    color: showDrivers ? 'white' : '#374151'
                  }}
                >
                  <Users style={{ width: '16px', height: '16px' }} />
                  <span style={{ fontSize: '14px' }}>Show Drivers</span>
                </button>
                <button 
                  onClick={() => setShowRoutes(!showRoutes)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                    border: '1px solid #e5e7eb',
                    cursor: 'pointer',
                    backgroundColor: showRoutes ? '#10b981' : 'white',
                    color: showRoutes ? 'white' : '#374151'
                  }}
                >
                  <Route style={{ width: '16px', height: '16px' }} />
                  <span style={{ fontSize: '14px' }}>Show Routes</span>
                </button>
              </div>
            </div>
          </div>

          {/* Live Statistics */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '24px' }}>
            <div style={{ backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)', border: '1px solid #e5e7eb', padding: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <p style={{ fontSize: '14px', fontWeight: '500', color: '#6b7280' }}>Active Tasks</p>
                  <p style={{ fontSize: '30px', fontWeight: 'bold', color: '#111827' }}>{liveStats.totalTasks}</p>
                </div>
                <div style={{ width: '48px', height: '48px', backgroundColor: '#dbeafe', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Target style={{ width: '24px', height: '24px', color: '#2563eb' }} />
                </div>
              </div>
              <div style={{ marginTop: '16px', display: 'flex', alignItems: 'center', fontSize: '14px' }}>
                <TrendingUp style={{ width: '16px', height: '16px', color: '#10b981', marginRight: '4px' }} />
                <span style={{ color: '#10b981', fontWeight: '500' }}>+12%</span>
                <span style={{ color: '#6b7280', marginLeft: '4px' }}>from last week</span>
              </div>
            </div>

            <div style={{ backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)', border: '1px solid #e5e7eb', padding: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <p style={{ fontSize: '14px', fontWeight: '500', color: '#6b7280' }}>Online Drivers</p>
                  <p style={{ fontSize: '30px', fontWeight: 'bold', color: '#111827' }}>{liveStats.driversOnline}</p>
                </div>
                <div style={{ width: '48px', height: '48px', backgroundColor: '#dcfce7', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Users style={{ width: '24px', height: '24px', color: '#10b981' }} />
                </div>
              </div>
              <div style={{ marginTop: '16px', display: 'flex', alignItems: 'center', fontSize: '14px' }}>
                <Activity style={{ width: '16px', height: '16px', color: '#10b981', marginRight: '4px' }} />
                <span style={{ color: '#10b981', fontWeight: '500' }}>All Active</span>
              </div>
            </div>

            <div style={{ backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)', border: '1px solid #e5e7eb', padding: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <p style={{ fontSize: '14px', fontWeight: '500', color: '#6b7280' }}>Active Routes</p>
                  <p style={{ fontSize: '30px', fontWeight: 'bold', color: '#111827' }}>{liveStats.activeRoutes}</p>
                </div>
                <div style={{ width: '48px', height: '48px', backgroundColor: '#f3e8ff', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Navigation style={{ width: '24px', height: '24px', color: '#8b5cf6' }} />
                </div>
              </div>
              <div style={{ marginTop: '16px', display: 'flex', alignItems: 'center', fontSize: '14px' }}>
                <TrendingUp style={{ width: '16px', height: '16px', color: '#10b981', marginRight: '4px' }} />
                <span style={{ color: '#10b981', fontWeight: '500' }}>+8%</span>
                <span style={{ color: '#6b7280', marginLeft: '4px' }}>efficiency</span>
              </div>
            </div>

            <div style={{ backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)', border: '1px solid #e5e7eb', padding: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <p style={{ fontSize: '14px', fontWeight: '500', color: '#6b7280' }}>Optimization</p>
                  <p style={{ fontSize: '30px', fontWeight: 'bold', color: '#111827' }}>{liveStats.optimization}%</p>
                </div>
                <div style={{ width: '48px', height: '48px', backgroundColor: '#fed7aa', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Zap style={{ width: '24px', height: '24px', color: '#ea580c' }} />
                </div>
              </div>
              <div style={{ marginTop: '16px', display: 'flex', alignItems: 'center', fontSize: '14px' }}>
                <TrendingUp style={{ width: '16px', height: '16px', color: '#10b981', marginRight: '4px' }} />
                <span style={{ color: '#10b981', fontWeight: '500' }}>+2.3%</span>
                <span style={{ color: '#6b7280', marginLeft: '4px' }}>this week</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: .5; }
        }
      `}</style>
    </div>
  );
}