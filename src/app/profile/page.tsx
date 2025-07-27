'use client';

import React, { useState, useEffect } from 'react';
import { 
  User as UserIcon,
  Settings,
  Bell,
  Shield,
  Key,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Clock,
  Award,
  Target,
  Activity,
  Edit,
  Save,
  Camera,
  Upload,
  Download,
  Trash2,
  Eye,
  EyeOff,
  CheckCircle,
  XCircle,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  BarChart3,
  PieChart,
  FileText,
  Building,
  Users,
  Crown,
  Star,
  Zap,
  Heart,
  Gift,
  Trophy,
  Medal,
  Badge,
} from 'lucide-react';

export default function ProfilePage() {
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showNotificationsModal, setShowNotificationsModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'settings' | 'activity' | 'security'>('overview');
  
  // Mock user data
  const userProfile = {
    id: '1',
    displayName: 'Ola Nordmann',
    email: 'ola.nordmann@bedrift.no',
    phone: '+47 123 45 678',
    departmentId: 'dept-1',
    position: 'Avdelingsleder',
    bio: 'Erfaren leder med fokus på teamutvikling og effektivitet.',
    address: 'Storgata 123, 0001 Oslo',
    emergencyContact: 'Kari Nordmann (+47 987 65 432)',
    role: 'department_leader' as const,
    createdAt: '2023-01-15T10:00:00Z',
    avatar: null
  };

  // Mock departments data
  const departments = [
    { id: 'dept-1', name: 'Produksjon', leaderId: '1' },
    { id: 'dept-2', name: 'Kvalitet', leaderId: '2' },
    { id: 'dept-3', name: 'Logistikk', leaderId: '3' }
  ];
  
  // Form states
  const [formData, setFormData] = useState({
    displayName: userProfile.displayName,
    email: userProfile.email,
    phone: userProfile.phone,
    departmentId: userProfile.departmentId,
    position: userProfile.position,
    bio: userProfile.bio,
    address: userProfile.address,
    emergencyContact: userProfile.emergencyContact
  });

  // Settings states
  const [settings, setSettings] = useState({
    emailNotifications: true,
    pushNotifications: true,
    smsNotifications: false,
    twoFactorAuth: false,
    darkMode: false,
    language: 'no',
    timezone: 'Europe/Oslo'
  });

  useEffect(() => {
    // Simulate loading
    setTimeout(() => {
      setLoading(false);
    }, 1000);
  }, []);

  const handleSaveProfile = async () => {
    // Mock save functionality
    console.log('Saving profile:', formData);
    setEditing(false);
    // In a real app, you would call an API here
  };

  const handleChangePassword = async (currentPassword: string, newPassword: string) => {
    // Mock password change
    console.log('Changing password');
    setShowPasswordModal(false);
    // In a real app, you would call an API here
  };

  const getRoleBadge = (role: string) => {
    const badges = {
      admin: { color: 'bg-red-100 text-red-800', icon: Crown, text: 'Administrator' },
      department_leader: { color: 'bg-blue-100 text-blue-800', icon: Star, text: 'Avdelingsleder' },
      employee: { color: 'bg-green-100 text-green-800', icon: UserIcon, text: 'Ansatt' }
    };
    
    const badge = badges[role as keyof typeof badges];
    const Icon = badge.icon;
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badge.color}`}>
        <Icon className="h-3 w-3 mr-1" />
        {badge.text}
      </span>
    );
  };

  const getDepartmentName = (departmentId: string) => {
    return departments.find(d => d.id === departmentId)?.name || 'Ukjent avdeling';
  };

  const getActivityStats = () => {
    return {
      totalShifts: 156,
      completedShifts: 152,
      totalHours: 1248,
      averageRating: 4.8,
      efficiency: 94,
      attendanceRate: 97.5,
      overtimeHours: 12.5,
      vacationDaysUsed: 18,
      vacationDaysRemaining: 7
    };
  };

  const getRecentActivity = () => {
    return [
      { id: 1, type: 'shift', action: 'Stemplet inn', time: '08:00', date: '2024-01-15', status: 'completed' },
      { id: 2, type: 'vacation', action: 'Ferie godkjent', time: '14:30', date: '2024-01-14', status: 'approved' },
      { id: 3, type: 'deviation', action: 'Avvik rapportert', time: '11:15', date: '2024-01-13', status: 'pending' },
      { id: 4, type: 'shift', action: 'Stemplet ut', time: '17:00', date: '2024-01-12', status: 'completed' },
      { id: 5, type: 'document', action: 'Dokument lastet opp', time: '09:45', date: '2024-01-11', status: 'completed' }
    ];
  };

  const getAchievements = () => {
    return [
      { id: 1, name: 'Perfekt oppmøte', icon: Award, description: '100% oppmøte i 3 måneder', earned: true, date: '2024-01-10' },
      { id: 2, name: 'Team Player', icon: Users, description: 'Hjelpet 10 kollegaer', earned: true, date: '2024-01-05' },
      { id: 3, name: 'Efficiency Master', icon: Target, description: '95%+ effektivitet i 1 måned', earned: false },
      { id: 4, name: 'Safety First', icon: Shield, description: 'Ingen sikkerhetsavvik i 6 måneder', earned: false },
      { id: 5, name: 'Mentor', icon: Star, description: 'Veiledet 5 nye ansatte', earned: false }
    ];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const stats = getActivityStats();
  const recentActivity = getRecentActivity();
  const achievements = getAchievements();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Min Profil</h1>
          <p className="mt-1 text-sm text-gray-500">
            Administrer din profil og innstillinger
          </p>
        </div>
        <div className="flex items-center space-x-3">
          {editing ? (
            <>
              <button
                onClick={() => setEditing(false)}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <XCircle className="h-4 w-4 mr-2" />
                Avbryt
              </button>
              <button
                onClick={handleSaveProfile}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <Save className="h-4 w-4 mr-2" />
                Lagre
              </button>
            </>
          ) : (
            <button
              onClick={() => setEditing(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Edit className="h-4 w-4 mr-2" />
              Rediger profil
            </button>
          )}
        </div>
      </div>

      {/* Profile Overview Card */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl shadow-xl p-8 text-white">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-6">
            <div className="relative">
              <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center">
                <UserIcon className="h-12 w-12 text-white" />
              </div>
              {editing && (
                <button className="absolute -bottom-1 -right-1 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-lg">
                  <Camera className="h-4 w-4 text-blue-600" />
                </button>
              )}
            </div>
            <div>
              <h2 className="text-2xl font-bold mb-2">{userProfile.displayName}</h2>
              <div className="flex items-center space-x-3 mb-2">
                {getRoleBadge(userProfile.role)}
                <span className="text-blue-100">•</span>
                <span className="text-blue-100">{getDepartmentName(userProfile.departmentId)}</span>
              </div>
              <p className="text-blue-100">{userProfile.position}</p>
            </div>
          </div>
          
          <div className="text-right">
            <div className="text-sm text-blue-100 mb-1">Medlem siden</div>
            <div className="font-medium">
              {new Date(userProfile.createdAt).toLocaleDateString('no-NO')}
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white shadow-lg rounded-xl border border-gray-100">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6" aria-label="Tabs">
            {[
              { id: 'overview', name: 'Oversikt', icon: UserIcon },
              { id: 'settings', name: 'Innstillinger', icon: Settings },
              { id: 'activity', name: 'Aktivitet', icon: Activity },
              { id: 'security', name: 'Sikkerhet', icon: Shield }
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{tab.name}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-blue-600">Totale skift</p>
                      <p className="text-2xl font-bold text-blue-900">{stats.totalShifts}</p>
                    </div>
                    <Clock className="h-8 w-8 text-blue-600" />
                  </div>
                </div>

                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-green-600">Oppmøte</p>
                      <p className="text-2xl font-bold text-green-900">{stats.attendanceRate}%</p>
                    </div>
                    <CheckCircle className="h-8 w-8 text-green-600" />
                  </div>
                </div>

                <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-purple-600">Effektivitet</p>
                      <p className="text-2xl font-bold text-purple-900">{stats.efficiency}%</p>
                    </div>
                    <Target className="h-8 w-8 text-purple-600" />
                  </div>
                </div>

                <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-orange-600">Vurdering</p>
                      <p className="text-2xl font-bold text-orange-900">{stats.averageRating}/5</p>
                    </div>
                    <Star className="h-8 w-8 text-orange-600" />
                  </div>
                </div>
              </div>

              {/* Profile Information */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white border border-gray-200 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Personlig informasjon</h3>
                  <div className="space-y-4">
                    <div className="flex items-center">
                      <Mail className="h-4 w-4 text-gray-400 mr-3" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">E-post</p>
                        <p className="text-sm text-gray-500">{userProfile.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <Phone className="h-4 w-4 text-gray-400 mr-3" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">Telefon</p>
                        <p className="text-sm text-gray-500">{userProfile.phone}</p>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <MapPin className="h-4 w-4 text-gray-400 mr-3" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">Adresse</p>
                        <p className="text-sm text-gray-500">{userProfile.address}</p>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <Building className="h-4 w-4 text-gray-400 mr-3" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">Avdeling</p>
                        <p className="text-sm text-gray-500">{getDepartmentName(userProfile.departmentId)}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white border border-gray-200 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Arbeidsstatistikk</h3>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Totale timer</span>
                      <span className="text-sm font-medium text-gray-900">{stats.totalHours}h</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Overtid</span>
                      <span className="text-sm font-medium text-gray-900">{stats.overtimeHours}h</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Ferie brukt</span>
                      <span className="text-sm font-medium text-gray-900">{stats.vacationDaysUsed} dager</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Ferie gjenstående</span>
                      <span className="text-sm font-medium text-gray-900">{stats.vacationDaysRemaining} dager</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Achievements */}
              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Prestasjoner</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {achievements.map((achievement) => {
                    const Icon = achievement.icon;
                    return (
                      <div
                        key={achievement.id}
                        className={`p-4 rounded-lg border ${
                          achievement.earned
                            ? 'bg-green-50 border-green-200'
                            : 'bg-gray-50 border-gray-200'
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                            achievement.earned ? 'bg-green-100' : 'bg-gray-100'
                          }`}>
                            <Icon className={`h-5 w-5 ${
                              achievement.earned ? 'text-green-600' : 'text-gray-400'
                            }`} />
                          </div>
                          <div className="flex-1">
                            <h4 className={`text-sm font-medium ${
                              achievement.earned ? 'text-green-900' : 'text-gray-500'
                            }`}>
                              {achievement.name}
                            </h4>
                            <p className="text-xs text-gray-500">{achievement.description}</p>
                            {achievement.earned && achievement.date && (
                              <p className="text-xs text-green-600 mt-1">
                                Oppnådd {new Date(achievement.date).toLocaleDateString('no-NO')}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Settings Tab */}
          {activeTab === 'settings' && (
            <div className="space-y-6">
              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Varsler</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">E-postvarsler</p>
                      <p className="text-sm text-gray-500">Motta varsler på e-post</p>
                    </div>
                    <button
                      onClick={() => setSettings({...settings, emailNotifications: !settings.emailNotifications})}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        settings.emailNotifications ? 'bg-blue-600' : 'bg-gray-200'
                      }`}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        settings.emailNotifications ? 'translate-x-6' : 'translate-x-1'
                      }`} />
                    </button>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">Push-varsler</p>
                      <p className="text-sm text-gray-500">Motta varsler på enheten</p>
                    </div>
                    <button
                      onClick={() => setSettings({...settings, pushNotifications: !settings.pushNotifications})}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        settings.pushNotifications ? 'bg-blue-600' : 'bg-gray-200'
                      }`}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        settings.pushNotifications ? 'translate-x-6' : 'translate-x-1'
                      }`} />
                    </button>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">SMS-varsler</p>
                      <p className="text-sm text-gray-500">Motta varsler på SMS</p>
                    </div>
                    <button
                      onClick={() => setSettings({...settings, smsNotifications: !settings.smsNotifications})}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        settings.smsNotifications ? 'bg-blue-600' : 'bg-gray-200'
                      }`}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        settings.smsNotifications ? 'translate-x-6' : 'translate-x-1'
                      }`} />
                    </button>
                  </div>
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Viser</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">Mørk modus</p>
                      <p className="text-sm text-gray-500">Bruk mørk bakgrunn</p>
                    </div>
                    <button
                      onClick={() => setSettings({...settings, darkMode: !settings.darkMode})}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        settings.darkMode ? 'bg-blue-600' : 'bg-gray-200'
                      }`}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        settings.darkMode ? 'translate-x-6' : 'translate-x-1'
                      }`} />
                    </button>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Språk
                    </label>
                    <select
                      value={settings.language}
                      onChange={(e) => setSettings({...settings, language: e.target.value})}
                      className="block w-full border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    >
                      <option value="no">Norsk</option>
                      <option value="en">English</option>
                      <option value="sv">Svenska</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tidssone
                    </label>
                    <select
                      value={settings.timezone}
                      onChange={(e) => setSettings({...settings, timezone: e.target.value})}
                      className="block w-full border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    >
                      <option value="Europe/Oslo">Oslo (GMT+1)</option>
                      <option value="Europe/Stockholm">Stockholm (GMT+1)</option>
                      <option value="Europe/Copenhagen">København (GMT+1)</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Activity Tab */}
          {activeTab === 'activity' && (
            <div className="space-y-6">
              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Siste aktivitet</h3>
                <div className="space-y-4">
                  {recentActivity.map((activity) => (
                    <div key={activity.id} className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        activity.status === 'completed' ? 'bg-green-100' :
                        activity.status === 'approved' ? 'bg-blue-100' :
                        activity.status === 'pending' ? 'bg-yellow-100' : 'bg-gray-100'
                      }`}>
                        {activity.type === 'shift' && <Clock className="h-4 w-4 text-gray-600" />}
                        {activity.type === 'vacation' && <Calendar className="h-4 w-4 text-gray-600" />}
                        {activity.type === 'deviation' && <AlertTriangle className="h-4 w-4 text-gray-600" />}
                        {activity.type === 'document' && <FileText className="h-4 w-4 text-gray-600" />}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{activity.action}</p>
                        <p className="text-xs text-gray-500">{activity.date} • {activity.time}</p>
                      </div>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        activity.status === 'completed' ? 'bg-green-100 text-green-800' :
                        activity.status === 'approved' ? 'bg-blue-100 text-blue-800' :
                        activity.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {activity.status === 'completed' ? 'Fullført' :
                         activity.status === 'approved' ? 'Godkjent' :
                         activity.status === 'pending' ? 'Venter' : 'Ukjent'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Security Tab */}
          {activeTab === 'security' && (
            <div className="space-y-6">
              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Sikkerhet</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">To-faktor autentisering</p>
                      <p className="text-sm text-gray-500">Øk sikkerheten med 2FA</p>
                    </div>
                    <button
                      onClick={() => setSettings({...settings, twoFactorAuth: !settings.twoFactorAuth})}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        settings.twoFactorAuth ? 'bg-blue-600' : 'bg-gray-200'
                      }`}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        settings.twoFactorAuth ? 'translate-x-6' : 'translate-x-1'
                      }`} />
                    </button>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">Endre passord</p>
                      <p className="text-sm text-gray-500">Oppdater ditt passord</p>
                    </div>
                    <button
                      onClick={() => setShowPasswordModal(true)}
                      className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      <Key className="h-4 w-4 mr-2" />
                      Endre
                    </button>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">Sesjoner</p>
                      <p className="text-sm text-gray-500">Se aktive innlogginger</p>
                    </div>
                    <button className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                      <Eye className="h-4 w-4 mr-2" />
                      Se alle
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Password Change Modal would go here */}
      {/* This is a placeholder for the modal component */}
    </div>
  );
} 