'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { timeTrackingService, userService, departmentService } from '@/lib/firebase-services';
import { TimeEntry, User, Department, TimeEntryType } from '@/types';
import { 
  Clock, 
  Search, 
  Filter, 
  Plus, 
  Eye, 
  Edit, 
  Download,
  Calendar,
  Users,
  Building,
  TrendingUp,
  TrendingDown,
  Play,
  Pause,
  Stop,
  Fingerprint,
  Camera,
  MapPin,
  Wifi,
  Battery,
  Activity,
  BarChart3,
  PieChart,
  Clock as ClockIcon,
  Zap,
  Target,
  Award
} from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function TimeClockPage() {
  const { userProfile, isAdmin, isDepartmentLeader } = useAuth();
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<TimeEntry | null>(null);
  const [isClockingIn, setIsClockingIn] = useState(false);
  const [currentSession, setCurrentSession] = useState<TimeEntry | null>(null);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [locationEnabled, setLocationEnabled] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    loadData();
    checkCurrentSession();
    setupBiometric();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load departments
      const deps = await departmentService.getAllDepartments();
      setDepartments(deps);

      // Load users based on role
      let allUsers: User[] = [];
      if (isAdmin) {
        const employees = await userService.getUsersByRole('employee');
        const leaders = await userService.getUsersByRole('department_leader');
        allUsers = [...employees, ...leaders];
      } else if (isDepartmentLeader && userProfile?.departmentId) {
        allUsers = await userService.getUsersByDepartment(userProfile.departmentId);
      }
      setUsers(allUsers);

      // Load time entries based on role
      let entryData: TimeEntry[] = [];
      if (isAdmin) {
        entryData = await timeTrackingService.getAllTimeEntries();
      } else if (isDepartmentLeader && userProfile?.departmentId) {
        entryData = await timeTrackingService.getTimeEntriesByDepartment(userProfile.departmentId);
      } else {
        entryData = await timeTrackingService.getTimeEntriesByEmployee(userProfile?.id || '');
      }

      setTimeEntries(entryData);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Kunne ikke laste data');
    } finally {
      setLoading(false);
    }
  };

  const checkCurrentSession = async () => {
    if (!userProfile?.id) return;
    
    try {
      const current = await timeTrackingService.getCurrentSession(userProfile.id);
      setCurrentSession(current);
    } catch (error) {
      console.error('Error checking current session:', error);
    }
  };

  const setupBiometric = async () => {
    try {
      // Check if biometric authentication is available
      if ('credentials' in navigator) {
        setBiometricEnabled(true);
      }
      
      // Check if geolocation is available
      if ('geolocation' in navigator) {
        setLocationEnabled(true);
      }
    } catch (error) {
      console.error('Error setting up biometric:', error);
    }
  };

  const handleClockIn = async () => {
    if (!userProfile?.id) return;
    
    setIsClockingIn(true);
    try {
      const location = locationEnabled ? await getCurrentLocation() : null;
      const biometric = biometricEnabled ? await captureBiometric() : null;
      
      const entryData = {
        employeeId: userProfile.id,
        employeeName: userProfile.displayName,
        type: TimeEntryType.CLOCK_IN,
        timestamp: new Date(),
        location: location,
        biometricData: biometric,
        deviceInfo: {
          userAgent: navigator.userAgent,
          platform: navigator.platform,
          language: navigator.language
        }
      };

      await timeTrackingService.createTimeEntry(entryData);
      toast.success('Stemplet inn!');
      await checkCurrentSession();
      await loadData();
    } catch (error) {
      console.error('Error clocking in:', error);
      toast.error('Kunne ikke stemple inn');
    } finally {
      setIsClockingIn(false);
    }
  };

  const handleClockOut = async () => {
    if (!userProfile?.id || !currentSession) return;
    
    try {
      const location = locationEnabled ? await getCurrentLocation() : null;
      const biometric = biometricEnabled ? await captureBiometric() : null;
      
      const entryData = {
        employeeId: userProfile.id,
        employeeName: userProfile.displayName,
        type: TimeEntryType.CLOCK_OUT,
        timestamp: new Date(),
        location: location,
        biometricData: biometric,
        sessionId: currentSession.id,
        deviceInfo: {
          userAgent: navigator.userAgent,
          platform: navigator.platform,
          language: navigator.language
        }
      };

      await timeTrackingService.createTimeEntry(entryData);
      toast.success('Stemplet ut!');
      setCurrentSession(null);
      await loadData();
    } catch (error) {
      console.error('Error clocking out:', error);
      toast.error('Kunne ikke stemple ut');
    }
  };

  const getCurrentLocation = (): Promise<{lat: number, lng: number}> => {
    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          reject(error);
        }
      );
    });
  };

  const captureBiometric = async (): Promise<string | null> => {
    try {
      if (videoRef.current && canvasRef.current) {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');
        
        if (context) {
          context.drawImage(video, 0, 0, canvas.width, canvas.height);
          return canvas.toDataURL('image/jpeg', 0.8);
        }
      }
      return null;
    } catch (error) {
      console.error('Error capturing biometric:', error);
      return null;
    }
  };

  const filteredTimeEntries = timeEntries.filter(entry => {
    const matchesSearch = entry.employeeName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDepartment = !selectedDepartment || 
                             users.find(u => u.id === entry.employeeId)?.departmentId === selectedDepartment;
    const matchesEmployee = !selectedEmployee || entry.employeeId === selectedEmployee;
    const matchesDate = !selectedDate || 
                       new Date(entry.timestamp).toISOString().split('T')[0] === selectedDate;
    
    return matchesSearch && matchesDepartment && matchesEmployee && matchesDate;
  });

  const getTimeEntryStats = () => {
    const today = new Date().toISOString().split('T')[0];
    const todayEntries = timeEntries.filter(entry => 
      new Date(entry.timestamp).toISOString().split('T')[0] === today
    );
    
    const clockIns = todayEntries.filter(entry => entry.type === TimeEntryType.CLOCK_IN).length;
    const clockOuts = todayEntries.filter(entry => entry.type === TimeEntryType.CLOCK_OUT).length;
    const activeUsers = new Set(todayEntries.map(entry => entry.employeeId)).size;
    
    const totalHours = todayEntries.reduce((total, entry) => {
      if (entry.type === TimeEntryType.CLOCK_OUT && entry.sessionId) {
        const clockIn = todayEntries.find(e => e.id === entry.sessionId);
        if (clockIn) {
          const duration = new Date(entry.timestamp).getTime() - new Date(clockIn.timestamp).getTime();
          return total + (duration / (1000 * 60 * 60));
        }
      }
      return total;
    }, 0);
    
    return { clockIns, clockOuts, activeUsers, totalHours: Math.round(totalHours * 100) / 100 };
  };

  const formatDuration = (startTime: Date, endTime: Date) => {
    const duration = endTime.getTime() - startTime.getTime();
    const hours = Math.floor(duration / (1000 * 60 * 60));
    const minutes = Math.floor((duration % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}t ${minutes}m`;
  };

  const getCurrentTime = () => {
    return new Date().toLocaleTimeString('no-NO', { 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit' 
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const stats = getTimeEntryStats();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Stemple System</h1>
          <p className="mt-1 text-sm text-gray-500">
            Avansert tidsregistrering med biometrisk autentisering
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <div className="text-right">
            <div className="text-sm text-gray-500">Nåværende tid</div>
            <div className="text-lg font-mono font-bold text-blue-600">
              {getCurrentTime()}
            </div>
          </div>
        </div>
      </div>

      {/* Clock In/Out Panel */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl shadow-xl p-8 text-white">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h2 className="text-2xl font-bold mb-2">Velkommen, {userProfile?.displayName}</h2>
            <p className="text-blue-100 mb-4">
              {currentSession ? 'Du er stemplet inn' : 'Du er stemplet ut'}
            </p>
            
            {currentSession && (
              <div className="bg-white/10 rounded-lg p-4 mb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-blue-100">Stemplet inn:</div>
                    <div className="font-mono text-lg">
                      {new Date(currentSession.timestamp).toLocaleTimeString('no-NO')}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-blue-100">Varighet:</div>
                    <div className="font-mono text-lg">
                      {formatDuration(new Date(currentSession.timestamp), new Date())}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          <div className="flex items-center space-x-4">
            {biometricEnabled && (
              <div className="text-center">
                <Fingerprint className="h-8 w-8 mx-auto mb-2 text-green-300" />
                <div className="text-xs text-blue-100">Biometrisk</div>
              </div>
            )}
            
            {locationEnabled && (
              <div className="text-center">
                <MapPin className="h-8 w-8 mx-auto mb-2 text-green-300" />
                <div className="text-xs text-blue-100">Lokasjon</div>
              </div>
            )}
            
            <div className="text-center">
              <Wifi className="h-8 w-8 mx-auto mb-2 text-green-300" />
              <div className="text-xs text-blue-100">Online</div>
            </div>
          </div>
        </div>
        
        <div className="flex items-center justify-center space-x-6 mt-6">
          {!currentSession ? (
            <button
              onClick={handleClockIn}
              disabled={isClockingIn}
              className="flex items-center space-x-3 bg-green-500 hover:bg-green-600 disabled:bg-green-400 px-8 py-4 rounded-lg font-semibold text-lg transition-all duration-200 transform hover:scale-105 disabled:transform-none"
            >
              <Play className="h-6 w-6" />
              <span>{isClockingIn ? 'Stempler inn...' : 'Stemple inn'}</span>
            </button>
          ) : (
            <button
              onClick={handleClockOut}
              className="flex items-center space-x-3 bg-red-500 hover:bg-red-600 px-8 py-4 rounded-lg font-semibold text-lg transition-all duration-200 transform hover:scale-105"
            >
              <Stop className="h-6 w-6" />
              <span>Stemple ut</span>
            </button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white overflow-hidden shadow-lg rounded-xl border border-gray-100">
          <div className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <Play className="h-6 w-6 text-green-600" />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Stemplet inn i dag</p>
                <p className="text-2xl font-bold text-gray-900">{stats.clockIns}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow-lg rounded-xl border border-gray-100">
          <div className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                  <Stop className="h-6 w-6 text-red-600" />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Stemplet ut i dag</p>
                <p className="text-2xl font-bold text-gray-900">{stats.clockOuts}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow-lg rounded-xl border border-gray-100">
          <div className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Aktive brukere</p>
                <p className="text-2xl font-bold text-gray-900">{stats.activeUsers}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow-lg rounded-xl border border-gray-100">
          <div className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Clock className="h-6 w-6 text-purple-600" />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total timer i dag</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalHours}h</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white shadow-lg rounded-xl border border-gray-100 p-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Søk
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Søk etter ansatt..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 block w-full border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Dato
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="block w-full border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>

          {(isAdmin || isDepartmentLeader) && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Avdeling
              </label>
              <select
                value={selectedDepartment}
                onChange={(e) => setSelectedDepartment(e.target.value)}
                className="block w-full border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              >
                <option value="">Alle avdelinger</option>
                {departments.map(dept => (
                  <option key={dept.id} value={dept.id}>{dept.name}</option>
                ))}
              </select>
            </div>
          )}

          {(isAdmin || isDepartmentLeader) && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ansatt
              </label>
              <select
                value={selectedEmployee}
                onChange={(e) => setSelectedEmployee(e.target.value)}
                className="block w-full border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              >
                <option value="">Alle ansatte</option>
                {users.map(user => (
                  <option key={user.id} value={user.id}>{user.displayName}</option>
                ))}
              </select>
            </div>
          )}

          <div className="flex items-end">
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedDate(new Date().toISOString().split('T')[0]);
                setSelectedDepartment('');
                setSelectedEmployee('');
              }}
              className="w-full inline-flex justify-center items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Filter className="h-4 w-4 mr-2" />
              Nullstill
            </button>
          </div>
        </div>
      </div>

      {/* Time Entries Table */}
      <div className="bg-white shadow-lg rounded-xl border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">
              Tidsregistreringer ({filteredTimeEntries.length})
            </h3>
            <button
              onClick={() => {/* Export functionality */}}
              className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Download className="h-4 w-4 mr-2" />
              Eksporter
            </button>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ansatt
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tidspunkt
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Varighet
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Lokasjon
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Enhet
                </th>
                <th className="px-6 py-3 relative">
                  <span className="sr-only">Handlinger</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredTimeEntries.map((entry) => (
                <tr key={entry.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center">
                        <span className="text-white font-medium">
                          {entry.employeeName.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {entry.employeeName}
                        </div>
                        <div className="text-sm text-gray-500">
                          {users.find(u => u.id === entry.employeeId)?.departmentName || 'Ukjent avdeling'}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      entry.type === TimeEntryType.CLOCK_IN 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {entry.type === TimeEntryType.CLOCK_IN ? (
                        <>
                          <Play className="h-3 w-3 mr-1" />
                          Inn
                        </>
                      ) : (
                        <>
                          <Stop className="h-3 w-3 mr-1" />
                          Ut
                        </>
                      )}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="font-mono">
                      {new Date(entry.timestamp).toLocaleTimeString('no-NO')}
                    </div>
                    <div className="text-gray-500">
                      {new Date(entry.timestamp).toLocaleDateString('no-NO')}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {entry.sessionId ? (
                      <span className="font-mono">
                        {formatDuration(new Date(entry.timestamp), new Date())}
                      </span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {entry.location ? (
                      <div className="flex items-center">
                        <MapPin className="h-3 w-3 mr-1" />
                        <span>Registrert</span>
                      </div>
                    ) : (
                      <span className="text-gray-400">Ikke tilgjengelig</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex items-center space-x-1">
                      {entry.biometricData && <Fingerprint className="h-3 w-3 text-green-500" />}
                      <Wifi className="h-3 w-3 text-blue-500" />
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => {
                        setSelectedEntry(entry);
                        setShowAddModal(true);
                      }}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredTimeEntries.length === 0 && (
          <div className="text-center py-12">
            <Clock className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Ingen tidsregistreringer funnet</h3>
            <p className="mt-1 text-sm text-gray-500">
              Prøv å endre søkekriteriene eller vent på nye registreringer.
            </p>
          </div>
        )}
      </div>

      {/* Hidden video and canvas for biometric capture */}
      <video
        ref={videoRef}
        style={{ display: 'none' }}
        autoPlay
        playsInline
        muted
      />
      <canvas
        ref={canvasRef}
        style={{ display: 'none' }}
        width="640"
        height="480"
      />

      {/* Add/Edit Time Entry Modal would go here */}
      {/* This is a placeholder for the modal component */}
    </div>
  );
} 