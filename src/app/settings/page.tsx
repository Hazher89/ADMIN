'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Settings,
  Bell,
  Shield,
  Database,
  Users,
  Building,
  Globe,
  Palette,
  Key,
  Eye,
  EyeOff,
  Save,
  RefreshCw,
  Download,
  Upload,
  Trash2,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Info,
  Zap,
  Clock,
  Calendar,
  FileText,
  Mail,
  Phone,
  MapPin,
  Wifi,
  Lock,
  Unlock,
  User,
  Crown,
  Star
} from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function SettingsPage() {
  const { userProfile, isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState<'general' | 'notifications' | 'security' | 'appearance' | 'system' | 'backup'>('general');
  const [loading, setLoading] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showBackupModal, setShowBackupModal] = useState(false);

  // General settings
  const [generalSettings, setGeneralSettings] = useState({
    companyName: 'DriftPro AS',
    timezone: 'Europe/Oslo',
    language: 'no',
    dateFormat: 'DD.MM.YYYY',
    timeFormat: '24h',
    currency: 'NOK',
    workWeekStart: 'monday',
    defaultWorkHours: 7.5
  });

  // Notification settings
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    pushNotifications: true,
    smsNotifications: false,
    shiftReminders: true,
    vacationApprovals: true,
    deviationAlerts: true,
    systemUpdates: false,
    marketingEmails: false
  });

  // Security settings
  const [securitySettings, setSecuritySettings] = useState({
    twoFactorAuth: false,
    sessionTimeout: 30,
    passwordExpiry: 90,
    minPasswordLength: 8,
    requireSpecialChars: true,
    loginAttempts: 5,
    ipWhitelist: '',
    auditLogging: true
  });

  // Appearance settings
  const [appearanceSettings, setAppearanceSettings] = useState({
    theme: 'light',
    primaryColor: 'blue',
    fontSize: 'medium',
    compactMode: false,
    showAnimations: true,
    highContrast: false
  });

  // System settings
  const [systemSettings, setSystemSettings] = useState({
    autoBackup: true,
    backupFrequency: 'daily',
    retentionPeriod: 30,
    dataEncryption: true,
    apiRateLimit: 1000,
    maintenanceMode: false,
    debugMode: false
  });

  const handleSaveSettings = async (settingsType: string) => {
    setLoading(true);
    try {
      // Save settings logic would go here
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      toast.success('Innstillinger lagret');
    } catch (error) {
      toast.error('Kunne ikke lagre innstillinger');
    } finally {
      setLoading(false);
    }
  };

  const handleBackup = async () => {
    try {
      // Backup logic would go here
      toast.success('Backup startet');
      setShowBackupModal(false);
    } catch (error) {
      toast.error('Kunne ikke starte backup');
    }
  };

  const handleRestore = async () => {
    try {
      // Restore logic would go here
      toast.success('Gjenoppretting startet');
    } catch (error) {
      toast.error('Kunne ikke starte gjenoppretting');
    }
  };

  const getThemeColors = () => [
    { name: 'Blå', value: 'blue', color: '#3B82F6' },
    { name: 'Grønn', value: 'green', color: '#10B981' },
    { name: 'Lilla', value: 'purple', color: '#8B5CF6' },
    { name: 'Rød', value: 'red', color: '#EF4444' },
    { name: 'Oransje', value: 'orange', color: '#F97316' },
    { name: 'Teal', value: 'teal', color: '#14B8A6' }
  ];

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Ingen tilgang</h3>
          <p className="text-gray-500">Du har ikke tilgang til systeminnstillinger.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Systeminnstillinger</h1>
          <p className="mt-1 text-sm text-gray-500">
            Administrer systemkonfigurasjon og innstillinger
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowBackupModal(true)}
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Download className="h-4 w-4 mr-2" />
            Backup
          </button>
          <button
            onClick={() => handleSaveSettings('all')}
            disabled={loading}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {loading ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Lagre alle
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white shadow-lg rounded-xl border border-gray-100">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6" aria-label="Tabs">
            {[
              { id: 'general', name: 'Generelt', icon: Settings },
              { id: 'notifications', name: 'Varsler', icon: Bell },
              { id: 'security', name: 'Sikkerhet', icon: Shield },
              { id: 'appearance', name: 'Utseende', icon: Palette },
              { id: 'system', name: 'System', icon: Database },
              { id: 'backup', name: 'Backup', icon: Download }
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
          {/* General Settings */}
          {activeTab === 'general' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Firma navn
                  </label>
                  <input
                    type="text"
                    value={generalSettings.companyName}
                    onChange={(e) => setGeneralSettings({...generalSettings, companyName: e.target.value})}
                    className="block w-full border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tidssone
                  </label>
                  <select
                    value={generalSettings.timezone}
                    onChange={(e) => setGeneralSettings({...generalSettings, timezone: e.target.value})}
                    className="block w-full border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  >
                    <option value="Europe/Oslo">Oslo (GMT+1)</option>
                    <option value="Europe/Stockholm">Stockholm (GMT+1)</option>
                    <option value="Europe/Copenhagen">København (GMT+1)</option>
                    <option value="Europe/London">London (GMT+0)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Språk
                  </label>
                  <select
                    value={generalSettings.language}
                    onChange={(e) => setGeneralSettings({...generalSettings, language: e.target.value})}
                    className="block w-full border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  >
                    <option value="no">Norsk</option>
                    <option value="en">English</option>
                    <option value="sv">Svenska</option>
                    <option value="da">Dansk</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Valuta
                  </label>
                  <select
                    value={generalSettings.currency}
                    onChange={(e) => setGeneralSettings({...generalSettings, currency: e.target.value})}
                    className="block w-full border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  >
                    <option value="NOK">Norske kroner (NOK)</option>
                    <option value="SEK">Svenske kroner (SEK)</option>
                    <option value="DKK">Danske kroner (DKK)</option>
                    <option value="EUR">Euro (EUR)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Arbeidsuke starter
                  </label>
                  <select
                    value={generalSettings.workWeekStart}
                    onChange={(e) => setGeneralSettings({...generalSettings, workWeekStart: e.target.value})}
                    className="block w-full border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  >
                    <option value="monday">Mandag</option>
                    <option value="sunday">Søndag</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Standard arbeidstimer per dag
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={generalSettings.defaultWorkHours}
                    onChange={(e) => setGeneralSettings({...generalSettings, defaultWorkHours: parseFloat(e.target.value)})}
                    className="block w-full border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={() => handleSaveSettings('general')}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Lagre generelle innstillinger
                </button>
              </div>
            </div>
          )}

          {/* Notification Settings */}
          {activeTab === 'notifications' && (
            <div className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">E-postvarsler</h3>
                    <p className="text-sm text-gray-500">Motta varsler på e-post</p>
                  </div>
                  <button
                    onClick={() => setNotificationSettings({...notificationSettings, emailNotifications: !notificationSettings.emailNotifications})}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      notificationSettings.emailNotifications ? 'bg-blue-600' : 'bg-gray-200'
                    }`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      notificationSettings.emailNotifications ? 'translate-x-6' : 'translate-x-1'
                    }`} />
                  </button>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">Push-varsler</h3>
                    <p className="text-sm text-gray-500">Motta varsler på enheten</p>
                  </div>
                  <button
                    onClick={() => setNotificationSettings({...notificationSettings, pushNotifications: !notificationSettings.pushNotifications})}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      notificationSettings.pushNotifications ? 'bg-blue-600' : 'bg-gray-200'
                    }`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      notificationSettings.pushNotifications ? 'translate-x-6' : 'translate-x-1'
                    }`} />
                  </button>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">SMS-varsler</h3>
                    <p className="text-sm text-gray-500">Motta varsler på SMS</p>
                  </div>
                  <button
                    onClick={() => setNotificationSettings({...notificationSettings, smsNotifications: !notificationSettings.smsNotifications})}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      notificationSettings.smsNotifications ? 'bg-blue-600' : 'bg-gray-200'
                    }`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      notificationSettings.smsNotifications ? 'translate-x-6' : 'translate-x-1'
                    }`} />
                  </button>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">Skiftpåminnelser</h3>
                    <p className="text-sm text-gray-500">Få påminnelser om kommende skift</p>
                  </div>
                  <button
                    onClick={() => setNotificationSettings({...notificationSettings, shiftReminders: !notificationSettings.shiftReminders})}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      notificationSettings.shiftReminders ? 'bg-blue-600' : 'bg-gray-200'
                    }`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      notificationSettings.shiftReminders ? 'translate-x-6' : 'translate-x-1'
                    }`} />
                  </button>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">Feriegodkjenninger</h3>
                    <p className="text-sm text-gray-500">Varsler om feriesøknader</p>
                  </div>
                  <button
                    onClick={() => setNotificationSettings({...notificationSettings, vacationApprovals: !notificationSettings.vacationApprovals})}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      notificationSettings.vacationApprovals ? 'bg-blue-600' : 'bg-gray-200'
                    }`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      notificationSettings.vacationApprovals ? 'translate-x-6' : 'translate-x-1'
                    }`} />
                  </button>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">Avviksvarsler</h3>
                    <p className="text-sm text-gray-500">Varsler om nye avvik</p>
                  </div>
                  <button
                    onClick={() => setNotificationSettings({...notificationSettings, deviationAlerts: !notificationSettings.deviationAlerts})}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      notificationSettings.deviationAlerts ? 'bg-blue-600' : 'bg-gray-200'
                    }`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      notificationSettings.deviationAlerts ? 'translate-x-6' : 'translate-x-1'
                    }`} />
                  </button>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={() => handleSaveSettings('notifications')}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Lagre varslingsinnstillinger
                </button>
              </div>
            </div>
          )}

          {/* Security Settings */}
          {activeTab === 'security' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Sesjon timeout (minutter)
                  </label>
                  <input
                    type="number"
                    value={securitySettings.sessionTimeout}
                    onChange={(e) => setSecuritySettings({...securitySettings, sessionTimeout: parseInt(e.target.value)})}
                    className="block w-full border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Passord utløp (dager)
                  </label>
                  <input
                    type="number"
                    value={securitySettings.passwordExpiry}
                    onChange={(e) => setSecuritySettings({...securitySettings, passwordExpiry: parseInt(e.target.value)})}
                    className="block w-full border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Minimum passordlengde
                  </label>
                  <input
                    type="number"
                    value={securitySettings.minPasswordLength}
                    onChange={(e) => setSecuritySettings({...securitySettings, minPasswordLength: parseInt(e.target.value)})}
                    className="block w-full border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Maksimum innloggingsforsøk
                  </label>
                  <input
                    type="number"
                    value={securitySettings.loginAttempts}
                    onChange={(e) => setSecuritySettings({...securitySettings, loginAttempts: parseInt(e.target.value)})}
                    className="block w-full border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">To-faktor autentisering</h3>
                    <p className="text-sm text-gray-500">Krev 2FA for alle brukere</p>
                  </div>
                  <button
                    onClick={() => setSecuritySettings({...securitySettings, twoFactorAuth: !securitySettings.twoFactorAuth})}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      securitySettings.twoFactorAuth ? 'bg-blue-600' : 'bg-gray-200'
                    }`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      securitySettings.twoFactorAuth ? 'translate-x-6' : 'translate-x-1'
                    }`} />
                  </button>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">Krev spesialtegn i passord</h3>
                    <p className="text-sm text-gray-500">Passord må inneholde spesialtegn</p>
                  </div>
                  <button
                    onClick={() => setSecuritySettings({...securitySettings, requireSpecialChars: !securitySettings.requireSpecialChars})}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      securitySettings.requireSpecialChars ? 'bg-blue-600' : 'bg-gray-200'
                    }`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      securitySettings.requireSpecialChars ? 'translate-x-6' : 'translate-x-1'
                    }`} />
                  </button>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">Audit logging</h3>
                    <p className="text-sm text-gray-500">Logg alle systemhandlinger</p>
                  </div>
                  <button
                    onClick={() => setSecuritySettings({...securitySettings, auditLogging: !securitySettings.auditLogging})}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      securitySettings.auditLogging ? 'bg-blue-600' : 'bg-gray-200'
                    }`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      securitySettings.auditLogging ? 'translate-x-6' : 'translate-x-1'
                    }`} />
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  IP-whitelist (valgfritt)
                </label>
                <textarea
                  value={securitySettings.ipWhitelist}
                  onChange={(e) => setSecuritySettings({...securitySettings, ipWhitelist: e.target.value})}
                  rows={3}
                  placeholder="En IP-adresse per linje"
                  className="block w-full border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>

              <div className="flex justify-end">
                <button
                  onClick={() => handleSaveSettings('security')}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Lagre sikkerhetsinnstillinger
                </button>
              </div>
            </div>
          )}

          {/* Appearance Settings */}
          {activeTab === 'appearance' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tema
                  </label>
                  <select
                    value={appearanceSettings.theme}
                    onChange={(e) => setAppearanceSettings({...appearanceSettings, theme: e.target.value})}
                    className="block w-full border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  >
                    <option value="light">Lyst</option>
                    <option value="dark">Mørkt</option>
                    <option value="auto">Automatisk</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Skriftstørrelse
                  </label>
                  <select
                    value={appearanceSettings.fontSize}
                    onChange={(e) => setAppearanceSettings({...appearanceSettings, fontSize: e.target.value})}
                    className="block w-full border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  >
                    <option value="small">Liten</option>
                    <option value="medium">Medium</option>
                    <option value="large">Stor</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Primærfarge
                </label>
                <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                  {getThemeColors().map((color) => (
                    <button
                      key={color.value}
                      onClick={() => setAppearanceSettings({...appearanceSettings, primaryColor: color.value})}
                      className={`p-3 rounded-lg border-2 transition-all ${
                        appearanceSettings.primaryColor === color.value
                          ? 'border-gray-900'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div
                        className="w-full h-8 rounded"
                        style={{ backgroundColor: color.color }}
                      />
                      <p className="text-xs mt-2 text-gray-600">{color.name}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">Kompakt modus</h3>
                    <p className="text-sm text-gray-500">Reduser avstander og padding</p>
                  </div>
                  <button
                    onClick={() => setAppearanceSettings({...appearanceSettings, compactMode: !appearanceSettings.compactMode})}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      appearanceSettings.compactMode ? 'bg-blue-600' : 'bg-gray-200'
                    }`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      appearanceSettings.compactMode ? 'translate-x-6' : 'translate-x-1'
                    }`} />
                  </button>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">Vis animasjoner</h3>
                    <p className="text-sm text-gray-500">Aktiver overganger og animasjoner</p>
                  </div>
                  <button
                    onClick={() => setAppearanceSettings({...appearanceSettings, showAnimations: !appearanceSettings.showAnimations})}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      appearanceSettings.showAnimations ? 'bg-blue-600' : 'bg-gray-200'
                    }`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      appearanceSettings.showAnimations ? 'translate-x-6' : 'translate-x-1'
                    }`} />
                  </button>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">Høy kontrast</h3>
                    <p className="text-sm text-gray-500">Øk kontrast for bedre lesbarhet</p>
                  </div>
                  <button
                    onClick={() => setAppearanceSettings({...appearanceSettings, highContrast: !appearanceSettings.highContrast})}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      appearanceSettings.highContrast ? 'bg-blue-600' : 'bg-gray-200'
                    }`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      appearanceSettings.highContrast ? 'translate-x-6' : 'translate-x-1'
                    }`} />
                  </button>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={() => handleSaveSettings('appearance')}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Lagre utseendeinnstillinger
                </button>
              </div>
            </div>
          )}

          {/* System Settings */}
          {activeTab === 'system' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Backup frekvens
                  </label>
                  <select
                    value={systemSettings.backupFrequency}
                    onChange={(e) => setSystemSettings({...systemSettings, backupFrequency: e.target.value})}
                    className="block w-full border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  >
                    <option value="hourly">Hver time</option>
                    <option value="daily">Daglig</option>
                    <option value="weekly">Ukentlig</option>
                    <option value="monthly">Månedlig</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Oppbevaringsperiode (dager)
                  </label>
                  <input
                    type="number"
                    value={systemSettings.retentionPeriod}
                    onChange={(e) => setSystemSettings({...systemSettings, retentionPeriod: parseInt(e.target.value)})}
                    className="block w-full border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    API rate limit
                  </label>
                  <input
                    type="number"
                    value={systemSettings.apiRateLimit}
                    onChange={(e) => setSystemSettings({...systemSettings, apiRateLimit: parseInt(e.target.value)})}
                    className="block w-full border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">Automatisk backup</h3>
                    <p className="text-sm text-gray-500">Utfør automatiske backups</p>
                  </div>
                  <button
                    onClick={() => setSystemSettings({...systemSettings, autoBackup: !systemSettings.autoBackup})}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      systemSettings.autoBackup ? 'bg-blue-600' : 'bg-gray-200'
                    }`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      systemSettings.autoBackup ? 'translate-x-6' : 'translate-x-1'
                    }`} />
                  </button>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">Datakryptering</h3>
                    <p className="text-sm text-gray-500">Krypter alle data</p>
                  </div>
                  <button
                    onClick={() => setSystemSettings({...systemSettings, dataEncryption: !systemSettings.dataEncryption})}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      systemSettings.dataEncryption ? 'bg-blue-600' : 'bg-gray-200'
                    }`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      systemSettings.dataEncryption ? 'translate-x-6' : 'translate-x-1'
                    }`} />
                  </button>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">Vedlikeholdsmodus</h3>
                    <p className="text-sm text-gray-500">Midlertidig steng systemet</p>
                  </div>
                  <button
                    onClick={() => setSystemSettings({...systemSettings, maintenanceMode: !systemSettings.maintenanceMode})}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      systemSettings.maintenanceMode ? 'bg-blue-600' : 'bg-gray-200'
                    }`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      systemSettings.maintenanceMode ? 'translate-x-6' : 'translate-x-1'
                    }`} />
                  </button>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">Debug modus</h3>
                    <p className="text-sm text-gray-500">Aktiver debugging (kun for utviklere)</p>
                  </div>
                  <button
                    onClick={() => setSystemSettings({...systemSettings, debugMode: !systemSettings.debugMode})}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      systemSettings.debugMode ? 'bg-blue-600' : 'bg-gray-200'
                    }`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      systemSettings.debugMode ? 'translate-x-6' : 'translate-x-1'
                    }`} />
                  </button>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={() => handleSaveSettings('system')}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Lagre systeminnstillinger
                </button>
              </div>
            </div>
          )}

          {/* Backup Settings */}
          {activeTab === 'backup' && (
            <div className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start">
                  <Info className="h-5 w-5 text-blue-600 mt-0.5 mr-3" />
                  <div>
                    <h3 className="text-sm font-medium text-blue-900">Backup informasjon</h3>
                    <p className="text-sm text-blue-700 mt-1">
                      Backups utføres automatisk basert på dine innstillinger. Du kan også utføre manuelle backups når som helst.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-gray-900">Siste backup</h3>
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Dato:</span>
                      <span className="text-sm font-medium">15. januar 2024</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Tid:</span>
                      <span className="text-sm font-medium">02:00</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Størrelse:</span>
                      <span className="text-sm font-medium">245 MB</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Status:</span>
                      <span className="text-sm font-medium text-green-600">Fullført</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-gray-900">Neste backup</h3>
                    <Clock className="h-5 w-5 text-blue-500" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Dato:</span>
                      <span className="text-sm font-medium">16. januar 2024</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Tid:</span>
                      <span className="text-sm font-medium">02:00</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Type:</span>
                      <span className="text-sm font-medium">Automatisk</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Frekvens:</span>
                      <span className="text-sm font-medium">Daglig</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-center space-x-4">
                <button
                  onClick={() => setShowBackupModal(true)}
                  className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-lg shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <Download className="h-5 w-5 mr-2" />
                  Start backup
                </button>
                <button
                  onClick={handleRestore}
                  className="inline-flex items-center px-6 py-3 border border-gray-300 text-base font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <Upload className="h-5 w-5 mr-2" />
                  Gjenopprett
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Backup Modal */}
      {showBackupModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Start backup</h3>
            <p className="text-sm text-gray-600 mb-6">
              Dette vil opprette en komplett backup av alle systemdata. Prosessen kan ta flere minutter.
            </p>
            <div className="flex items-center justify-end space-x-3">
              <button
                onClick={() => setShowBackupModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Avbryt
              </button>
              <button
                onClick={handleBackup}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Start backup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 