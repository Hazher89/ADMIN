'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Settings, 
  Users, 
  Building, 
  Bell, 
  Shield, 
  Database, 
  Globe, 
  Palette, 
  Key, 
  BarChart3,
  Plus,
  Search,
  MoreHorizontal,
  CheckCircle,
  Clock,
  Eye,
  Edit,
  Trash2,
  Save,
  X,
  ChevronDown,
  ChevronRight,
  ToggleLeft,
  ToggleRight,
  Mail,
  Phone,
  MapPin,
  Calendar,
  FileText,
  Lock,
  Unlock,
  AlertTriangle,
  Info,
  Zap,
  Monitor,
  Smartphone,
  Tablet,
  Sun,
  Moon,
  Languages,
  CreditCard,
  Shield as ShieldIcon,
  Activity,
  TrendingUp,
  Users as UsersIcon,
  Briefcase,
  Home,
  Settings as SettingsIcon,
  ChevronUp,
  RotateCcw,
  LogOut
} from 'lucide-react';

interface SystemSetting {
  id: string;
  category: string;
  name: string;
  description: string;
  type: 'toggle' | 'text' | 'number' | 'select' | 'textarea' | 'color' | 'file';
  value: string | number | boolean | null;
  defaultValue: string | number | boolean | null;
  options?: string[];
  required?: boolean;
  validation?: string;
  updatedAt: string;
}

export default function SettingsPage() {
  const { userProfile, logout } = useAuth();
  const [settings, setSettings] = useState<SystemSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('general');
  const [editingSetting, setEditingSetting] = useState<string | null>(null);
  const [tempValues, setTempValues] = useState<{[key: string]: string | number | boolean | null}>({});
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Initialize default system settings
  const defaultSettings: SystemSetting[] = [
    // General Settings
    {
      id: 'site_name',
      category: 'general',
      name: 'Nettstedsnavn',
      description: 'Navnet som vises i nettleser og app',
      type: 'text',
      value: 'DriftPro',
      defaultValue: 'DriftPro',
      required: true,
      updatedAt: new Date().toISOString()
    },
    {
      id: 'site_description',
      category: 'general',
      name: 'Nettstedsbeskrivelse',
      description: 'Beskrivelse av nettstedet for søkemotorer',
      type: 'textarea',
      value: 'DriftPro - Ledelsessystem for bedrifter',
      defaultValue: 'DriftPro - Ledelsessystem for bedrifter',
      updatedAt: new Date().toISOString()
    },
    {
      id: 'timezone',
      category: 'general',
      name: 'Tidssone',
      description: 'Standard tidssone for systemet',
      type: 'select',
      value: 'Europe/Oslo',
      defaultValue: 'Europe/Oslo',
      options: ['Europe/Oslo', 'Europe/Stockholm', 'Europe/Copenhagen', 'UTC'],
      updatedAt: new Date().toISOString()
    },
    {
      id: 'language',
      category: 'general',
      name: 'Språk',
      description: 'Standard språk for systemet',
      type: 'select',
      value: 'no',
      defaultValue: 'no',
      options: ['no', 'en', 'sv', 'da'],
      updatedAt: new Date().toISOString()
    },

    // User Management
    {
      id: 'user_registration',
      category: 'users',
      name: 'Brukerregistrering',
      description: 'Tillat nye brukere å registrere seg',
      type: 'toggle',
      value: false,
      defaultValue: false,
      updatedAt: new Date().toISOString()
    },
    {
      id: 'email_verification',
      category: 'users',
      name: 'E-postverifisering',
      description: 'Krev e-postverifisering for nye brukere',
      type: 'toggle',
      value: true,
      defaultValue: true,
      updatedAt: new Date().toISOString()
    },
    {
      id: 'password_min_length',
      category: 'users',
      name: 'Minimum passordlengde',
      description: 'Minimum antall tegn for passord',
      type: 'number',
      value: 8,
      defaultValue: 8,
      validation: 'min:6,max:20',
      updatedAt: new Date().toISOString()
    },
    {
      id: 'session_timeout',
      category: 'users',
      name: 'Økt timeout',
      description: 'Antall minutter før automatisk utlogging',
      type: 'number',
      value: 60,
      defaultValue: 60,
      validation: 'min:15,max:480',
      updatedAt: new Date().toISOString()
    },

    // Company Settings
    {
      id: 'company_logo',
      category: 'company',
      name: 'Bedriftslogo',
      description: 'Logo som vises på alle sider',
      type: 'file',
      value: null,
      defaultValue: null,
      updatedAt: new Date().toISOString()
    },
    {
      id: 'company_address',
      category: 'company',
      name: 'Bedriftsadresse',
      description: 'Offisiell adresse for bedriften',
      type: 'textarea',
      value: '',
      defaultValue: '',
      updatedAt: new Date().toISOString()
    },
    {
      id: 'company_phone',
      category: 'company',
      name: 'Bedriftstelefon',
      description: 'Hovedtelefonnummer',
      type: 'text',
      value: '',
      defaultValue: '',
      updatedAt: new Date().toISOString()
    },
    {
      id: 'company_email',
      category: 'company',
      name: 'Bedriftse-post',
      description: 'Hovede-postadresse',
      type: 'text',
      value: '',
      defaultValue: '',
      updatedAt: new Date().toISOString()
    },

    // Notifications
    {
      id: 'email_notifications',
      category: 'notifications',
      name: 'E-postvarsler',
      description: 'Send varsler via e-post',
      type: 'toggle',
      value: true,
      defaultValue: true,
      updatedAt: new Date().toISOString()
    },
    {
      id: 'push_notifications',
      category: 'notifications',
      name: 'Push-varsler',
      description: 'Send push-varsler til brukere',
      type: 'toggle',
      value: true,
      defaultValue: true,
      updatedAt: new Date().toISOString()
    },
    {
      id: 'notification_sound',
      category: 'notifications',
      name: 'Varsellyd',
      description: 'Spill lyd ved nye varsler',
      type: 'toggle',
      value: true,
      defaultValue: true,
      updatedAt: new Date().toISOString()
    },

    // Security
    {
      id: 'two_factor_auth',
      category: 'security',
      name: 'To-faktor autentisering',
      description: 'Krev 2FA for alle brukere',
      type: 'toggle',
      value: false,
      defaultValue: false,
      updatedAt: new Date().toISOString()
    },
    {
      id: 'login_attempts',
      category: 'security',
      name: 'Maks innloggingsforsøk',
      description: 'Antall forsøk før konto låses',
      type: 'number',
      value: 5,
      defaultValue: 5,
      validation: 'min:3,max:10',
      updatedAt: new Date().toISOString()
    },
    {
      id: 'ip_whitelist',
      category: 'security',
      name: 'IP-whitelist',
      description: 'Tillat kun tilgang fra spesifikke IP-adresser',
      type: 'toggle',
      value: false,
      defaultValue: false,
      updatedAt: new Date().toISOString()
    },

    // Database
    {
      id: 'backup_frequency',
      category: 'database',
      name: 'Backup-frekvens',
      description: 'Hvor ofte database skal sikkerhetskopieres',
      type: 'select',
      value: 'daily',
      defaultValue: 'daily',
      options: ['hourly', 'daily', 'weekly', 'monthly'],
      updatedAt: new Date().toISOString()
    },
    {
      id: 'data_retention',
      category: 'database',
      name: 'Dataoppbevaring',
      description: 'Antall dager å beholde gamle data',
      type: 'number',
      value: 365,
      defaultValue: 365,
      validation: 'min:30,max:2555',
      updatedAt: new Date().toISOString()
    },

    // Appearance
    {
      id: 'theme',
      category: 'appearance',
      name: 'Tema',
      description: 'Farge-tema for systemet',
      type: 'select',
      value: 'light',
      defaultValue: 'light',
      options: ['light', 'dark', 'auto'],
      updatedAt: new Date().toISOString()
    },
    {
      id: 'primary_color',
      category: 'appearance',
      name: 'Primærfarge',
      description: 'Hovedfarge for systemet',
      type: 'color',
      value: '#3b82f6',
      defaultValue: '#3b82f6',
      updatedAt: new Date().toISOString()
    },
    {
      id: 'sidebar_collapsed',
      category: 'appearance',
      name: 'Kollapset sidebar',
      description: 'Start med kollapset sidebar',
      type: 'toggle',
      value: false,
      defaultValue: false,
      updatedAt: new Date().toISOString()
    },

    // Advanced Settings
    {
      id: 'debug_mode',
      category: 'advanced',
      name: 'Debug-modus',
      description: 'Aktiver debug-informasjon (kun for utviklere)',
      type: 'toggle',
      value: false,
      defaultValue: false,
      updatedAt: new Date().toISOString()
    },
    {
      id: 'api_rate_limit',
      category: 'advanced',
      name: 'API rate limit',
      description: 'Maks API-kall per minutt',
      type: 'number',
      value: 1000,
      defaultValue: 1000,
      validation: 'min:100,max:10000',
      updatedAt: new Date().toISOString()
    },
    {
      id: 'cache_duration',
      category: 'advanced',
      name: 'Cache-varighet',
      description: 'Antall minutter å cache data',
      type: 'number',
      value: 15,
      defaultValue: 15,
      validation: 'min:1,max:1440',
      updatedAt: new Date().toISOString()
    }
  ];

  useEffect(() => {
    const loadSettings = async () => {
      if (!userProfile?.companyId) {
        setLoading(false);
        return;
      }

      try {
        // For now, use default settings
        // In production, load from Firebase
        setSettings(defaultSettings);
      } catch (error) {
        console.error('Error loading settings:', error);
        setSettings(defaultSettings);
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, [userProfile?.companyId]);

  const categories = [
    { id: 'general', name: 'Generelt', icon: Settings },
    { id: 'users', name: 'Brukere', icon: Users },
    { id: 'company', name: 'Bedrift', icon: Building },
    { id: 'notifications', name: 'Varsler', icon: Bell },
    { id: 'security', name: 'Sikkerhet', icon: Shield },
    { id: 'database', name: 'Database', icon: Database },
    { id: 'appearance', name: 'Utseende', icon: Palette },
    { id: 'advanced', name: 'Avansert', icon: Zap }
  ];

  const filteredSettings = settings.filter(setting => {
    const matchesSearch = setting.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         setting.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         setting.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = activeCategory === 'all' || setting.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const handleEdit = (settingId: string) => {
    setEditingSetting(settingId);
    const setting = settings.find(s => s.id === settingId);
    if (setting) {
      setTempValues({ ...tempValues, [settingId]: setting.value });
    }
  };

  const handleSave = (settingId: string) => {
    const newValue = tempValues[settingId];
    setSettings(prev => prev.map(s => 
      s.id === settingId 
        ? { ...s, value: newValue, updatedAt: new Date().toISOString() }
        : s
    ));
    setEditingSetting(null);
    setTempValues(prev => {
      const newTemp = { ...prev };
      delete newTemp[settingId];
      return newTemp;
    });
  };

  const handleCancel = (settingId: string) => {
    setEditingSetting(null);
    setTempValues(prev => {
      const newTemp = { ...prev };
      delete newTemp[settingId];
      return newTemp;
    });
  };

  const handleReset = (settingId: string) => {
    const setting = settings.find(s => s.id === settingId);
    if (setting) {
      setSettings(prev => prev.map(s => 
        s.id === settingId 
          ? { ...s, value: s.defaultValue, updatedAt: new Date().toISOString() }
          : s
      ));
    }
  };

  const renderSettingValue = (setting: SystemSetting) => {
    if (editingSetting === setting.id) {
      const tempValue = tempValues[setting.id];
      
      switch (setting.type) {
        case 'toggle':
          return (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <button
                className={`btn ${tempValue ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setTempValues({ ...tempValues, [setting.id]: !tempValue })}
                style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
              >
                {tempValue ? <ToggleRight size={14} /> : <ToggleLeft size={14} />}
                {tempValue ? 'Aktiv' : 'Inaktiv'}
              </button>
            </div>
          );
        
        case 'text':
          return (
            <input
              type="text"
              value={tempValue || ''}
              onChange={(e) => setTempValues({ ...tempValues, [setting.id]: e.target.value })}
              className="form-input"
              style={{ width: '100%', padding: '0.5rem' }}
            />
          );
        
        case 'number':
          return (
            <input
              type="number"
              value={tempValue || ''}
              onChange={(e) => setTempValues({ ...tempValues, [setting.id]: Number(e.target.value) })}
              className="form-input"
              style={{ width: '100%', padding: '0.5rem' }}
            />
          );
        
        case 'select':
          return (
            <select
              value={tempValue || ''}
              onChange={(e) => setTempValues({ ...tempValues, [setting.id]: e.target.value })}
              className="form-select"
              style={{ width: '100%', padding: '0.5rem' }}
            >
              {setting.options?.map(option => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          );
        
        case 'textarea':
          return (
            <textarea
              value={tempValue || ''}
              onChange={(e) => setTempValues({ ...tempValues, [setting.id]: e.target.value })}
              className="form-textarea"
              style={{ width: '100%', padding: '0.5rem', minHeight: '80px' }}
            />
          );
        
        case 'color':
          return (
            <input
              type="color"
              value={tempValue || '#3b82f6'}
              onChange={(e) => setTempValues({ ...tempValues, [setting.id]: e.target.value })}
              style={{ width: '50px', height: '40px', border: 'none', borderRadius: '4px' }}
            />
          );
        
        case 'file':
          return (
            <input
              type="file"
              onChange={(e) => setTempValues({ ...tempValues, [setting.id]: e.target.files?.[0] })}
              className="form-input"
              style={{ width: '100%', padding: '0.5rem' }}
            />
          );
        
        default:
          return null;
      }
    } else {
      // Display mode
      switch (setting.type) {
        case 'toggle':
          return (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div className={`badge ${setting.value ? 'badge-success' : 'badge-secondary'}`}>
                {setting.value ? 'Aktiv' : 'Inaktiv'}
              </div>
            </div>
          );
        
        case 'color':
          return (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div 
                style={{ 
                  width: '20px', 
                  height: '20px', 
                  backgroundColor: setting.value as string || '#ffffff', 
                  borderRadius: '4px',
                  border: '1px solid #ddd'
                }} 
              />
              <span style={{ fontSize: '0.875rem', color: '#666' }}>
                {setting.value}
              </span>
            </div>
          );
        
        case 'file':
          return (
            <span style={{ fontSize: '0.875rem', color: '#666' }}>
              {setting.value ? 'Fil valgt' : 'Ingen fil'}
            </span>
          );
        
        default:
          return (
            <span style={{ fontSize: '0.875rem', color: '#666' }}>
              {String(setting.value || 'Ikke satt')}
            </span>
          );
      }
    }
  };

  const getCategoryIcon = (categoryId: string) => {
    const category = categories.find(c => c.id === categoryId);
    return category?.icon || Settings;
  };

  if (loading) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
        <div className="loading" style={{ margin: '0 auto 1rem' }}></div>
        <p style={{ color: '#666' }}>Laster systeminnstillinger...</p>
      </div>
    );
  }

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
          <div className="card-icon">
            <Settings />
          </div>
          <div>
            <h1 className="page-title">⚙️ Systeminnstillinger</h1>
            <p className="page-subtitle">
              Kontroller alle aspekter av DriftPro-systemet
            </p>
          </div>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <span className="badge badge-primary">
            {settings.length} innstillinger
          </span>
          <span className="badge badge-secondary">
            {categories.length} kategorier
          </span>
          <button 
            className="btn btn-secondary"
            onClick={() => setShowAdvanced(!showAdvanced)}
          >
            {showAdvanced ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            {showAdvanced ? 'Skjul avanserte' : 'Vis avanserte'}
          </button>
          <button 
            className="btn btn-error"
            onClick={async () => {
              if (confirm('Er du sikker på at du vil logge ut?')) {
                try {
                  await logout();
                  // Redirect to login page after successful logout
                  window.location.href = '/login';
                } catch (error) {
                  console.error('Error during logout:', error);
                  alert('Feil ved utlogging. Prøv igjen.');
                }
              }
            }}
            style={{ marginLeft: 'auto' }}
          >
            <LogOut size={16} />
            Logg ut
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-number">{settings.length}</div>
          <div className="stat-label">Totalt innstillinger</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{settings.filter(s => s.value !== s.defaultValue).length}</div>
          <div className="stat-label">Endret</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{categories.length}</div>
          <div className="stat-label">Kategorier</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{new Date().toLocaleDateString('no-NO')}</div>
          <div className="stat-label">Sist oppdatert</div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '2rem', marginTop: '2rem' }}>
        {/* Categories Sidebar */}
        <div style={{ width: '250px', flexShrink: 0 }}>
          <div className="card">
            <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem', fontWeight: '600' }}>
              Kategorier
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <button
                className={`btn ${activeCategory === 'all' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setActiveCategory('all')}
                style={{ justifyContent: 'flex-start', textAlign: 'left' }}
              >
                <Settings size={16} />
                Alle innstillinger
              </button>
              {categories.map(category => {
                const IconComponent = category.icon;
                const isAdvanced = category.id === 'advanced';
                if (isAdvanced && !showAdvanced) return null;
                
                return (
                  <button
                    key={category.id}
                    className={`btn ${activeCategory === category.id ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setActiveCategory(category.id)}
                    style={{ justifyContent: 'flex-start', textAlign: 'left' }}
                  >
                    <IconComponent size={16} />
                    {category.name}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Settings Content */}
        <div style={{ flex: '1' }}>
          {/* Search */}
          <div className="card" style={{ marginBottom: '2rem' }}>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <div className="search-container" style={{ flex: '1', minWidth: '300px' }}>
                <Search className="search-icon" />
                <input
                  type="text"
                  placeholder="Søk i innstillinger..."
                  className="search-input"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Settings List */}
          {filteredSettings.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
              <div style={{ marginBottom: '1rem' }}>
                <Settings style={{ width: '48px', height: '48px', color: '#ccc', margin: '0 auto' }} />
              </div>
              <h3 style={{ color: '#666', marginBottom: '0.5rem' }}>Ingen innstillinger funnet</h3>
              <p style={{ color: '#999', marginBottom: '1.5rem' }}>
                {searchTerm 
                  ? 'Prøv å endre søkekriteriene' 
                  : 'Ingen innstillinger i denne kategorien'}
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {filteredSettings.map((setting) => {
                const IconComponent = getCategoryIcon(setting.category);
                const isModified = setting.value !== setting.defaultValue;
                
                return (
                  <div key={setting.id} className="card">
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                      <div className="card-icon">
                        <IconComponent />
                      </div>
                      
                      <div style={{ flex: '1' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                          <h3 style={{ 
                            fontWeight: '600', 
                            color: '#333',
                            fontSize: '1.1rem',
                            margin: 0
                          }}>
                            {setting.name}
                          </h3>
                          {isModified && (
                            <span className="badge badge-warning" style={{ fontSize: '0.75rem' }}>
                              Endret
                            </span>
                          )}
                          {setting.required && (
                            <span className="badge badge-error" style={{ fontSize: '0.75rem' }}>
                              Påkrevd
                            </span>
                          )}
                        </div>
                        
                        <p style={{ color: '#666', fontSize: '0.875rem', marginBottom: '1rem' }}>
                          {setting.description}
                        </p>
                        
                        <div style={{ marginBottom: '1rem' }}>
                          {renderSettingValue(setting)}
                        </div>
                        
                        <div style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: '0.5rem',
                          fontSize: '0.75rem',
                          color: '#999'
                        }}>
                          <Clock size={12} />
                          <span>Oppdatert: {new Date(setting.updatedAt).toLocaleDateString('no-NO')}</span>
                        </div>
                      </div>
                      
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {editingSetting === setting.id ? (
                          <>
                            <button
                              className="btn btn-primary"
                              onClick={() => handleSave(setting.id)}
                              style={{ padding: '0.5rem', fontSize: '0.75rem' }}
                            >
                              <Save size={14} />
                              Lagre
                            </button>
                            <button
                              className="btn btn-secondary"
                              onClick={() => handleCancel(setting.id)}
                              style={{ padding: '0.5rem', fontSize: '0.75rem' }}
                            >
                              <X size={14} />
                              Avbryt
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              className="btn btn-secondary"
                              onClick={() => handleEdit(setting.id)}
                              style={{ padding: '0.5rem', fontSize: '0.75rem' }}
                            >
                              <Edit size={14} />
                              Rediger
                            </button>
                            {isModified && (
                              <button
                                className="btn btn-secondary"
                                onClick={() => handleReset(setting.id)}
                                style={{ padding: '0.5rem', fontSize: '0.75rem' }}
                              >
                                <RotateCcw size={14} />
                                Tilbakestill
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 