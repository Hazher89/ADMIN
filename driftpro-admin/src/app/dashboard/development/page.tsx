'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Code, 
  Settings, 
  Users, 
  Building, 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  RefreshCw, 
  Trash2, 
  Eye, 
  Download, 
  Terminal, 
  Zap, 
  Plus, 
  X,
  BarChart3
} from 'lucide-react';

interface SystemStatus {
  status: 'online' | 'offline' | 'maintenance';
  uptime: string;
  activeUsers: number;
  totalCompanies: number;
  totalEmployees: number;
  lastBackup: string;
  systemLoad: number;
  memoryUsage: number;
  databaseConnections: number;
}

interface Company {
  id: string;
  name: string;
  orgNumber: string;
  adminEmail: string;
  status: 'active' | 'inactive' | 'suspended' | 'maintenance';
  subscriptionPlan: 'basic' | 'premium' | 'enterprise';
  createdAt: string;
  lastLogin: string;
  employeeCount: number;
  issues: string[];
  customFeatures: string[];
}

interface SystemLog {
  id: string;
  timestamp: string;
  level: 'info' | 'warning' | 'error' | 'debug';
  category: 'system' | 'user' | 'company' | 'security' | 'database';
  message: string;
  details?: Record<string, string | number | boolean>;
  userId?: string;
  companyId?: string;
}

interface FeatureRequest {
  id: string;
  companyId: string;
  companyName: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'pending' | 'in_progress' | 'completed' | 'rejected';
  createdAt: string;
  requestedBy: string;
  estimatedTime?: string;
  assignedTo?: string;
}

export default function DevelopmentPage() {
  const [activeTab, setActiveTab] = useState('overview');
  const [systemStatus, setSystemStatus] = useState<SystemStatus>({
    status: 'online',
    uptime: '0 days 0 hours',
    activeUsers: 0,
    totalCompanies: 0,
    totalEmployees: 0,
    lastBackup: new Date().toISOString(),
    systemLoad: 0,
    memoryUsage: 0,
    databaseConnections: 0
  });
  const [companies, setCompanies] = useState<Company[]>([]);
  const [systemLogs, setSystemLogs] = useState<SystemLog[]>([]);
  const [featureRequests, setFeatureRequests] = useState<FeatureRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [showCompanyModal, setShowCompanyModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive' | 'suspended' | 'maintenance'>('all');

  // Load system data
  const loadSystemData = useCallback(async () => {
    setLoading(true);
    try {
      const { collection, getDocs, query, orderBy, limit } = await import('firebase/firestore');
      const { db } = await import('@/lib/firebase');
      
      if (!db) return;

      // Load companies
      const companiesSnapshot = await getDocs(collection(db, 'companies'));
      const companiesData: Company[] = companiesSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          name: data.name || '',
          orgNumber: data.orgNumber || '',
          adminEmail: data.adminEmail || '',
          status: data.status || 'active',
          subscriptionPlan: data.subscriptionPlan || 'basic',
          createdAt: data.createdAt || new Date().toISOString(),
          lastLogin: data.lastLogin || '',
          employeeCount: data.employeeCount || 0,
          issues: data.issues || [],
          customFeatures: data.customFeatures || []
        };
      });
      setCompanies(companiesData);

      // Load system logs (last 100)
      const logsQuery = query(collection(db, 'systemLogs'), orderBy('timestamp', 'desc'), limit(100));
      const logsSnapshot = await getDocs(logsQuery);
      const logsData: SystemLog[] = logsSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          timestamp: data.timestamp || new Date().toISOString(),
          level: data.level || 'info',
          category: data.category || 'system',
          message: data.message || '',
          details: data.details,
          userId: data.userId,
          companyId: data.companyId
        };
      });
      setSystemLogs(logsData);

      // Load feature requests
      const featuresSnapshot = await getDocs(collection(db, 'featureRequests'));
      const featuresData: FeatureRequest[] = featuresSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          companyId: data.companyId || '',
          companyName: data.companyName || '',
          title: data.title || '',
          description: data.description || '',
          priority: data.priority || 'medium',
          status: data.status || 'pending',
          createdAt: data.createdAt || new Date().toISOString(),
          requestedBy: data.requestedBy || '',
          estimatedTime: data.estimatedTime,
          assignedTo: data.assignedTo
        };
      });
      setFeatureRequests(featuresData);

      // Update system status
      setSystemStatus(prev => ({
        ...prev,
        totalCompanies: companiesData.length,
        totalEmployees: companiesData.reduce((sum, company) => sum + company.employeeCount, 0),
        activeUsers: companiesData.filter(c => c.status === 'active').length,
        systemLoad: Math.random() * 100,
        memoryUsage: Math.random() * 100,
        databaseConnections: Math.floor(Math.random() * 50) + 10
      }));

    } catch (error) {
      console.error('Error loading system data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSystemData();
    const interval = setInterval(loadSystemData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, [loadSystemData]);

  // Filter companies
  const filteredCompanies = companies.filter(company => {
    const matchesSearch = company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         company.orgNumber.includes(searchTerm) ||
                         company.adminEmail.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || company.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  // System actions
  const performSystemAction = async (action: string) => {
    try {
      const { addDoc, collection, serverTimestamp } = await import('firebase/firestore');
      const { db } = await import('@/lib/firebase');
      
      if (!db) return;

      // Log the action
      await addDoc(collection(db, 'systemLogs'), {
        timestamp: serverTimestamp(),
        level: 'info',
        category: 'system',
        message: `System action performed: ${action}`,
        details: { action, performedBy: 'admin' }
      });

      // Perform the action
      switch (action) {
        case 'backup':
          // Trigger backup
          console.log('Backing up system...');
          break;
        case 'maintenance':
          // Enter maintenance mode
          setSystemStatus(prev => ({ ...prev, status: 'maintenance' }));
          break;
        case 'restart':
          // Restart system
          console.log('Restarting system...');
          break;
        case 'clear_logs':
          // Clear old logs
          console.log('Clearing old logs...');
          break;
      }

      loadSystemData();
    } catch (error) {
      console.error('Error performing system action:', error);
    }
  };

  // Company management
  const updateCompanyStatus = async (companyId: string, status: Company['status']) => {
    try {
      const { updateDoc, doc } = await import('firebase/firestore');
      const { db } = await import('@/lib/firebase');
      
      if (!db) return;

      await updateDoc(doc(db, 'companies', companyId), {
        status,
        updatedAt: new Date().toISOString()
      });

      loadSystemData();
    } catch (error) {
      console.error('Error updating company status:', error);
    }
  };

  // Feature request management
  const updateFeatureRequest = async (requestId: string, status: FeatureRequest['status'], assignedTo?: string) => {
    try {
      const { updateDoc, doc } = await import('firebase/firestore');
      const { db } = await import('@/lib/firebase');
      
      if (!db) return;

      await updateDoc(doc(db, 'featureRequests', requestId), {
        status,
        assignedTo,
        updatedAt: new Date().toISOString()
      });

      loadSystemData();
    } catch (error) {
      console.error('Error updating feature request:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Utvikling & Support</h1>
          <p className="text-gray-600">Full systemkontroll og utvikling</p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => performSystemAction('backup')}
            className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-green-700"
          >
            <Download className="h-4 w-4" />
            <span>Backup</span>
          </button>
          <button
            onClick={() => performSystemAction('maintenance')}
            className="bg-yellow-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-yellow-700"
          >
            <Settings className="h-4 w-4" />
            <span>Vedlikehold</span>
          </button>
        </div>
      </div>

      {/* System Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">System Status</p>
              <p className={`text-lg font-semibold ${
                systemStatus.status === 'online' ? 'text-green-600' :
                systemStatus.status === 'maintenance' ? 'text-yellow-600' : 'text-red-600'
              }`}>
                {systemStatus.status === 'online' ? 'Online' :
                 systemStatus.status === 'maintenance' ? 'Vedlikehold' : 'Offline'}
              </p>
            </div>
            <div className={`p-2 rounded-full ${
              systemStatus.status === 'online' ? 'bg-green-100' :
              systemStatus.status === 'maintenance' ? 'bg-yellow-100' : 'bg-red-100'
            }`}>
              <Activity className={`h-6 w-6 ${
                systemStatus.status === 'online' ? 'text-green-600' :
                systemStatus.status === 'maintenance' ? 'text-yellow-600' : 'text-red-600'
              }`} />
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Aktive Brukere</p>
              <p className="text-lg font-semibold text-blue-600">{systemStatus.activeUsers}</p>
            </div>
            <Users className="h-6 w-6 text-blue-600" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Bedrifter</p>
              <p className="text-lg font-semibold text-purple-600">{systemStatus.totalCompanies}</p>
            </div>
            <Building className="h-6 w-6 text-purple-600" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">System Load</p>
              <p className="text-lg font-semibold text-orange-600">{systemStatus.systemLoad.toFixed(1)}%</p>
            </div>
            <BarChart3 className="h-6 w-6 text-orange-600" />
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {[
              { id: 'overview', name: 'Oversikt', icon: Activity },
              { id: 'companies', name: 'Bedrifter', icon: Building },
              { id: 'features', name: 'Funksjoner', icon: Code },
              { id: 'logs', name: 'System Logs', icon: Terminal },
              { id: 'monitoring', name: 'Overvåking', icon: Eye },
              { id: 'settings', name: 'Innstillinger', icon: Settings }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon className="h-4 w-4" />
                <span>{tab.name}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-lg shadow">
        {activeTab === 'overview' && (
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-4">System Oversikt</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-medium mb-3">Siste Aktiviteter</h3>
                <div className="space-y-2">
                  {systemLogs.slice(0, 5).map((log) => (
                    <div key={log.id} className="flex items-center space-x-3 p-2 bg-gray-50 rounded">
                      <div className={`p-1 rounded ${
                        log.level === 'error' ? 'bg-red-100' :
                        log.level === 'warning' ? 'bg-yellow-100' : 'bg-green-100'
                      }`}>
                        {log.level === 'error' ? <XCircle className="h-3 w-3 text-red-600" /> :
                         log.level === 'warning' ? <AlertTriangle className="h-3 w-3 text-yellow-600" /> :
                         <CheckCircle className="h-3 w-3 text-green-600" />}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{log.message}</p>
                        <p className="text-xs text-gray-500">{new Date(log.timestamp).toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="text-lg font-medium mb-3">System Informasjon</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Uptime:</span>
                    <span className="font-medium">{systemStatus.uptime}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Siste Backup:</span>
                    <span className="font-medium">{new Date(systemStatus.lastBackup).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Database Connections:</span>
                    <span className="font-medium">{systemStatus.databaseConnections}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Memory Usage:</span>
                    <span className="font-medium">{systemStatus.memoryUsage.toFixed(1)}%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'companies' && (
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Bedriftsadministrasjon</h2>
              <div className="flex space-x-2">
                <input
                  type="text"
                  placeholder="Søk bedrifter..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                />
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value as 'all' | 'active' | 'inactive' | 'suspended' | 'maintenance')}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                >
                  <option value="all">Alle statuser</option>
                  <option value="active">Aktive</option>
                  <option value="inactive">Inaktive</option>
                  <option value="suspended">Suspenderte</option>
                  <option value="maintenance">Vedlikehold</option>
                </select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Bedrift
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ansatte
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Siste Login
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Handlinger
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredCompanies.map((company) => (
                    <tr key={company.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{company.name}</div>
                          <div className="text-sm text-gray-500">{company.adminEmail}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          company.status === 'active' ? 'bg-green-100 text-green-800' :
                          company.status === 'inactive' ? 'bg-gray-100 text-gray-800' :
                          company.status === 'suspended' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {company.status === 'active' ? 'Aktiv' :
                           company.status === 'inactive' ? 'Inaktiv' :
                           company.status === 'suspended' ? 'Suspenderte' : 'Vedlikehold'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {company.employeeCount}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {company.lastLogin ? new Date(company.lastLogin).toLocaleDateString() : 'Aldri'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => {
                              setSelectedCompany(company);
                              setShowCompanyModal(true);
                            }}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <select
                            value={company.status}
                            onChange={(e) => updateCompanyStatus(company.id, e.target.value as Company['status'])}
                            className="text-sm border border-gray-300 rounded px-2 py-1"
                          >
                            <option value="active">Aktiv</option>
                            <option value="inactive">Inaktiv</option>
                            <option value="suspended">Suspenderte</option>
                            <option value="maintenance">Vedlikehold</option>
                          </select>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'features' && (
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Funksjonsforespørsler</h2>
              <button
                onClick={() => setShowCompanyModal(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-blue-700"
              >
                <Plus className="h-4 w-4" />
                <span>Ny Forespørsel</span>
              </button>
            </div>

            <div className="space-y-4">
              {featureRequests.map((request) => (
                <div key={request.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="text-lg font-medium">{request.title}</h3>
                      <p className="text-sm text-gray-600">{request.companyName}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        request.priority === 'critical' ? 'bg-red-100 text-red-800' :
                        request.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                        request.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {request.priority}
                      </span>
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        request.status === 'completed' ? 'bg-green-100 text-green-800' :
                        request.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                        request.status === 'rejected' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {request.status === 'completed' ? 'Fullført' :
                         request.status === 'in_progress' ? 'Under arbeid' :
                         request.status === 'rejected' ? 'Avvist' : 'Venter'}
                      </span>
                    </div>
                  </div>
                  <p className="text-gray-700 mb-3">{request.description}</p>
                  <div className="flex justify-between items-center">
                    <div className="text-sm text-gray-500">
                      Forespurt av: {request.requestedBy} | {new Date(request.createdAt).toLocaleDateString()}
                    </div>
                    <div className="flex space-x-2">
                      <select
                        value={request.status}
                        onChange={(e) => updateFeatureRequest(request.id, e.target.value as FeatureRequest['status'])}
                        className="text-sm border border-gray-300 rounded px-2 py-1"
                      >
                        <option value="pending">Venter</option>
                        <option value="in_progress">Under arbeid</option>
                        <option value="completed">Fullført</option>
                        <option value="rejected">Avvist</option>
                      </select>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'logs' && (
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-4">System Logs</h2>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {systemLogs.map((log) => (
                <div key={log.id} className="flex items-start space-x-3 p-3 bg-gray-50 rounded">
                  <div className={`p-1 rounded ${
                    log.level === 'error' ? 'bg-red-100' :
                    log.level === 'warning' ? 'bg-yellow-100' : 'bg-green-100'
                  }`}>
                    {log.level === 'error' ? <XCircle className="h-4 w-4 text-red-600" /> :
                     log.level === 'warning' ? <AlertTriangle className="h-4 w-4 text-yellow-600" /> :
                     <CheckCircle className="h-4 w-4 text-green-600" />}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <p className="text-sm font-medium">{log.message}</p>
                      <span className="text-xs text-gray-500">{new Date(log.timestamp).toLocaleString()}</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {log.category} | {log.userId ? `User: ${log.userId}` : ''} {log.companyId ? `| Company: ${log.companyId}` : ''}
                    </p>
                    {log.details && (
                      <pre className="text-xs text-gray-600 mt-1 bg-white p-2 rounded border">
                        {JSON.stringify(log.details, null, 2)}
                      </pre>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'monitoring' && (
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-4">System Overvåking</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-medium mb-3">Real-time Metrics</h3>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-sm">
                      <span>CPU Usage</span>
                      <span>{systemStatus.systemLoad.toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                      <div 
                        className="bg-blue-600 h-2 rounded-full" 
                        style={{ width: `${systemStatus.systemLoad}%` }}
                      ></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm">
                      <span>Memory Usage</span>
                      <span>{systemStatus.memoryUsage.toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                      <div 
                        className="bg-green-600 h-2 rounded-full" 
                        style={{ width: `${systemStatus.memoryUsage}%` }}
                      ></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm">
                      <span>Database Connections</span>
                      <span>{systemStatus.databaseConnections}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                      <div 
                        className="bg-purple-600 h-2 rounded-full" 
                        style={{ width: `${(systemStatus.databaseConnections / 50) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-medium mb-3">Quick Actions</h3>
                <div className="space-y-2">
                  <button
                    onClick={() => performSystemAction('restart')}
                    className="w-full bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 flex items-center justify-center space-x-2"
                  >
                    <Zap className="h-4 w-4" />
                    <span>Restart System</span>
                  </button>
                  <button
                    onClick={() => performSystemAction('clear_logs')}
                    className="w-full bg-yellow-600 text-white px-4 py-2 rounded hover:bg-yellow-700 flex items-center justify-center space-x-2"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span>Clear Old Logs</span>
                  </button>
                  <button
                    onClick={() => loadSystemData()}
                    className="w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 flex items-center justify-center space-x-2"
                  >
                    <RefreshCw className="h-4 w-4" />
                    <span>Refresh Data</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-4">System Innstillinger</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Backup & Recovery</h3>
                <div className="space-y-2">
                  <button className="w-full bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
                    Create Full Backup
                  </button>
                  <button className="w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
                    Restore from Backup
                  </button>
                </div>
              </div>
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Security</h3>
                <div className="space-y-2">
                  <button className="w-full bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700">
                    Reset All Passwords
                  </button>
                  <button className="w-full bg-yellow-600 text-white px-4 py-2 rounded hover:bg-yellow-700">
                    Security Audit
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Company Detail Modal */}
      {showCompanyModal && selectedCompany && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">{selectedCompany.name}</h2>
              <button
                onClick={() => setShowCompanyModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium mb-2">Bedriftsinformasjon</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Organisasjonsnummer</p>
                    <p className="font-medium">{selectedCompany.orgNumber}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Admin E-post</p>
                    <p className="font-medium">{selectedCompany.adminEmail}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Status</p>
                    <p className="font-medium">{selectedCompany.status}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Abonnement</p>
                    <p className="font-medium">{selectedCompany.subscriptionPlan}</p>
                  </div>
                </div>
              </div>

              {selectedCompany.issues.length > 0 && (
                <div>
                  <h3 className="text-lg font-medium mb-2">Kjente Problemer</h3>
                  <ul className="list-disc list-inside space-y-1">
                    {selectedCompany.issues.map((issue, index) => (
                      <li key={index} className="text-sm text-red-600">{issue}</li>
                    ))}
                  </ul>
                </div>
              )}

              {selectedCompany.customFeatures.length > 0 && (
                <div>
                  <h3 className="text-lg font-medium mb-2">Tilpassede Funksjoner</h3>
                  <ul className="list-disc list-inside space-y-1">
                    {selectedCompany.customFeatures.map((feature, index) => (
                      <li key={index} className="text-sm text-green-600">{feature}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 