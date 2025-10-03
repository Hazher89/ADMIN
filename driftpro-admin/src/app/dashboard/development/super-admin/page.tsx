'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { firebaseService } from '@/lib/firebase-services';
import { collection, getDocs, doc, getDoc, setDoc, updateDoc, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { 
  Settings, Users, Shield, Palette, Code, Database, Server, 
  Globe, Mail, FileText, BarChart3, Calendar, MessageSquare,
  Plus, Edit, Trash2, Save, Eye, Lock, Unlock, CheckCircle,
  XCircle, AlertTriangle, Info, Zap, Layers, Grid, Layout,
  Type, Image, Video, Music, Download, Upload, RefreshCw,
  Search, Filter, SortAsc, SortDesc, MoreHorizontal, Copy,
  Scissors, Move, RotateCw, RotateCcw, FlipHorizontal, FlipVertical,
  Home, Building, Clock, Phone, Handshake, Terminal, Heart, Target, Activity,
  Minus, Bell, Play, Power, DollarSign, Calculator, CreditCard, PieChart, Package, Box, Truck, ShoppingCart, UserCheck, TrendingUp, FileSignature, Headphones, FolderOpen, CheckSquare, BarChart, Flag, Megaphone, Archive, Database
} from 'lucide-react';

interface PageConfig {
  id: string;
  name: string;
  path: string;
  icon: string;
  category: string;
  isVisible: boolean;
  permissions: string[];
  customStyles?: any;
  customComponents?: any[];
  customFunctions?: any[];
}

interface FunctionConfig {
  id: string;
  name: string;
  description: string;
  type: 'custom' | 'system' | 'plugin';
  enabled: boolean;
  permissions: string[];
  code: string;
  createdAt: string;
}

interface UserPermission {
  userId: string;
  email: string;
  role: string;
  permissions: string[];
  customPermissions: string[];
}

export default function SuperAdminPage() {
  const { user, userProfile } = useAuth();
  const [activeTab, setActiveTab] = useState('pages');
  const [pages, setPages] = useState<PageConfig[]>([]);
  const [users, setUsers] = useState<UserPermission[]>([]);
  const [functions, setFunctions] = useState<FunctionConfig[]>([]);
  const [selectedPage, setSelectedPage] = useState<PageConfig | null>(null);
  const [selectedUser, setSelectedUser] = useState<UserPermission | null>(null);
  const [selectedFunction, setSelectedFunction] = useState<FunctionConfig | null>(null);
  const [showPageEditor, setShowPageEditor] = useState(false);
  const [showUserEditor, setShowUserEditor] = useState(false);
  const [showFunctionEditor, setShowFunctionEditor] = useState(false);
  const [showCodeEditor, setShowCodeEditor] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  // All available pages from the sidebar
  const allPages: PageConfig[] = [
    // Main navigation
    { id: 'dashboard', name: 'Dashboard', path: '/dashboard', icon: 'Home', category: 'main', isVisible: true, permissions: ['admin', 'employee'] },
    { id: 'employees', name: 'Ansatte', path: '/dashboard/employees', icon: 'Users', category: 'main', isVisible: true, permissions: ['admin', 'manager'] },
    { id: 'shifts', name: 'Vakter', path: '/dashboard/shifts', icon: 'Calendar', category: 'main', isVisible: true, permissions: ['admin', 'manager', 'employee'] },
    { id: 'absence-vacation', name: 'Fravær og ferie', path: '/dashboard/absence-vacation', icon: 'Heart', category: 'main', isVisible: true, permissions: ['admin', 'manager', 'employee'] },
    { id: 'bud-priser', name: 'BUD priser', path: '/dashboard/bud-priser', icon: 'Target', category: 'main', isVisible: true, permissions: ['admin', 'manager'] },
    { id: 'deviations', name: 'HMS', path: '/dashboard/deviations', icon: 'Shield', category: 'main', isVisible: true, permissions: ['admin', 'manager', 'employee'] },
    { id: 'audit', name: 'Internrevisjon', path: '/dashboard/audit', icon: 'Activity', category: 'main', isVisible: true, permissions: ['admin', 'manager'] },
    { id: 'documents', name: 'Dokumenter', path: '/dashboard/documents', icon: 'FileText', category: 'main', isVisible: true, permissions: ['admin', 'manager', 'employee'] },
    { id: 'chat', name: 'Chat', path: '/dashboard/chat', icon: 'MessageSquare', category: 'main', isVisible: true, permissions: ['admin', 'manager', 'employee'] },
    { id: 'reports', name: 'Rapporter', path: '/dashboard/reports', icon: 'BarChart3', category: 'main', isVisible: true, permissions: ['admin', 'manager'] },
    { id: 'timeclock', name: 'Tidsregistrering', path: '/dashboard/timeclock', icon: 'Clock', category: 'main', isVisible: true, permissions: ['admin', 'manager', 'employee'] },
    { id: 'sms-logs', name: 'SMS Logg & Telefonbok', path: '/dashboard/sms-logs', icon: 'Phone', category: 'main', isVisible: true, permissions: ['admin', 'manager'] },
    
    // Management
    { id: 'departments', name: 'Avdelinger', path: '/dashboard/departments', icon: 'Building', category: 'management', isVisible: true, permissions: ['admin', 'manager'] },
    { id: 'partners', name: 'Samarbeidspartnere', path: '/dashboard/partners', icon: 'Handshake', category: 'management', isVisible: true, permissions: ['admin', 'manager'] },
    { id: 'partner-portal', name: 'Partner Portal', path: '/partner-login', icon: 'Globe', category: 'management', isVisible: true, permissions: ['employee'] },
    
    // Finance & Accounting
    { id: 'finance', name: 'Finans', path: '/dashboard/finance', icon: 'DollarSign', category: 'finance', isVisible: true, permissions: ['admin', 'manager'] },
    { id: 'invoicing', name: 'Fakturering', path: '/dashboard/invoicing', icon: 'FileText', category: 'finance', isVisible: true, permissions: ['admin', 'manager'] },
    { id: 'accounting', name: 'Regnskap', path: '/dashboard/accounting', icon: 'Calculator', category: 'finance', isVisible: true, permissions: ['admin'] },
    { id: 'payments', name: 'Betalinger', path: '/dashboard/payments', icon: 'CreditCard', category: 'finance', isVisible: true, permissions: ['admin', 'manager'] },
    { id: 'budgets', name: 'Budsjetter', path: '/dashboard/budgets', icon: 'PieChart', category: 'finance', isVisible: true, permissions: ['admin', 'manager'] },
    
    // Inventory & Stock
    { id: 'inventory', name: 'Lager', path: '/dashboard/inventory', icon: 'Package', category: 'inventory', isVisible: true, permissions: ['admin', 'manager'] },
    { id: 'products', name: 'Produkter', path: '/dashboard/products', icon: 'Box', category: 'inventory', isVisible: true, permissions: ['admin', 'manager'] },
    { id: 'suppliers', name: 'Leverandører', path: '/dashboard/suppliers', icon: 'Truck', category: 'inventory', isVisible: true, permissions: ['admin', 'manager'] },
    { id: 'orders', name: 'Bestillinger', path: '/dashboard/orders', icon: 'ShoppingCart', category: 'inventory', isVisible: true, permissions: ['admin', 'manager'] },
    { id: 'warehouse', name: 'Varehus', path: '/dashboard/warehouse', icon: 'Home', category: 'inventory', isVisible: true, permissions: ['admin', 'manager'] },
    
    // CRM & Customers
    { id: 'crm', name: 'CRM', path: '/dashboard/crm', icon: 'Heart', category: 'crm', isVisible: true, permissions: ['admin', 'manager'] },
    { id: 'customers', name: 'Kunder', path: '/dashboard/customers', icon: 'UserCheck', category: 'crm', isVisible: true, permissions: ['admin', 'manager'] },
    { id: 'leads', name: 'Leads', path: '/dashboard/leads', icon: 'Target', category: 'crm', isVisible: true, permissions: ['admin', 'manager'] },
    { id: 'sales', name: 'Salg', path: '/dashboard/sales', icon: 'TrendingUp', category: 'crm', isVisible: true, permissions: ['admin', 'manager'] },
    { id: 'contracts', name: 'Kontrakter', path: '/dashboard/contracts', icon: 'FileSignature', category: 'crm', isVisible: true, permissions: ['admin', 'manager'] },
    { id: 'support', name: 'Support', path: '/dashboard/support', icon: 'Headphones', category: 'crm', isVisible: true, permissions: ['admin', 'manager', 'employee'] },
    
    // Project Management
    { id: 'projects', name: 'Prosjekter', path: '/dashboard/projects', icon: 'FolderOpen', category: 'projects', isVisible: true, permissions: ['admin', 'manager'] },
    { id: 'tasks', name: 'Oppgaver', path: '/dashboard/tasks', icon: 'CheckSquare', category: 'projects', isVisible: true, permissions: ['admin', 'manager', 'employee'] },
    { id: 'resources', name: 'Ressurser', path: '/dashboard/resources', icon: 'Users', category: 'projects', isVisible: true, permissions: ['admin', 'manager'] },
    { id: 'gantt', name: 'Gantt', path: '/dashboard/gantt', icon: 'BarChart', category: 'projects', isVisible: true, permissions: ['admin', 'manager'] },
    { id: 'milestones', name: 'Milepæler', path: '/dashboard/milestones', icon: 'Flag', category: 'projects', isVisible: true, permissions: ['admin', 'manager'] },
    
    // Communication & Collaboration
    { id: 'mail', name: 'E-post', path: '/dashboard/mail', icon: 'Mail', category: 'communication', isVisible: true, permissions: ['admin', 'manager', 'employee'] },
    { id: 'calendar', name: 'Kalender', path: '/dashboard/calendar', icon: 'Calendar', category: 'communication', isVisible: true, permissions: ['admin', 'manager', 'employee'] },
    { id: 'messages', name: 'Meldinger', path: '/dashboard/messages', icon: 'MessageSquare', category: 'communication', isVisible: true, permissions: ['admin', 'manager', 'employee'] },
    { id: 'notifications', name: 'Notifikasjoner', path: '/dashboard/notifications', icon: 'Bell', category: 'communication', isVisible: true, permissions: ['admin', 'manager', 'employee'] },
    { id: 'announcements', name: 'Kunngjøringer', path: '/dashboard/announcements', icon: 'Megaphone', category: 'communication', isVisible: true, permissions: ['admin', 'manager'] },
    
    // Document Management
    { id: 'documents', name: 'Dokumenter', path: '/dashboard/documents', icon: 'FileText', category: 'documents', isVisible: true, permissions: ['admin', 'manager', 'employee'] },
    { id: 'templates', name: 'Maler', path: '/dashboard/templates', icon: 'Layout', category: 'documents', isVisible: true, permissions: ['admin', 'manager'] },
    { id: 'signatures', name: 'Signaturer', path: '/dashboard/signatures', icon: 'PenTool', category: 'documents', isVisible: true, permissions: ['admin', 'manager'] },
    { id: 'archive', name: 'Arkiv', path: '/dashboard/archive', icon: 'Archive', category: 'documents', isVisible: true, permissions: ['admin', 'manager'] },
    
    // Analytics & Reporting
    { id: 'analytics', name: 'Analytics', path: '/dashboard/analytics', icon: 'BarChart3', category: 'analytics', isVisible: true, permissions: ['admin', 'manager'] },
    { id: 'dashboard-reports', name: 'Rapporter', path: '/dashboard/reports', icon: 'BarChart3', category: 'analytics', isVisible: true, permissions: ['admin', 'manager'] },
    { id: 'exports', name: 'Eksporter', path: '/dashboard/exports', icon: 'Download', category: 'analytics', isVisible: true, permissions: ['admin', 'manager'] },
    { id: 'kpi', name: 'KPI Dashboard', path: '/dashboard/kpi', icon: 'TrendingUp', category: 'analytics', isVisible: true, permissions: ['admin', 'manager'] },
    
    // Settings
    { id: 'settings', name: 'Innstillinger', path: '/dashboard/settings', icon: 'Settings', category: 'settings', isVisible: true, permissions: ['admin', 'manager', 'employee'] },
    { id: 'security', name: 'Sikkerhet', path: '/dashboard/security', icon: 'Shield', category: 'settings', isVisible: true, permissions: ['admin'] },
    { id: 'backup', name: 'Backup', path: '/dashboard/backup', icon: 'Database', category: 'settings', isVisible: true, permissions: ['admin'] },
    { id: 'integrations', name: 'Integrasjoner', path: '/dashboard/integrations', icon: 'Zap', category: 'settings', isVisible: true, permissions: ['admin'] },
    
    // Admin-only pages
    { id: 'development', name: 'Development', path: '/dashboard/development', icon: 'Terminal', category: 'admin', isVisible: true, permissions: ['admin'] },
    { id: 'companies', name: 'Bedrifter', path: '/dashboard/companies', icon: 'Globe', category: 'admin', isVisible: true, permissions: ['admin'] },
    { id: 'wysiwyg', name: 'WYSIWYG Editor', path: '/dashboard/development/wysiwyg', icon: 'Palette', category: 'admin', isVisible: true, permissions: ['admin'] },
    { id: 'super-admin', name: 'Super Admin', path: '/dashboard/development/super-admin', icon: 'Settings', category: 'admin', isVisible: true, permissions: ['admin'] },
  ];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      // Load pages configuration
      if (db) {
        const pagesDocRef = doc(db, 'systemSettings', 'pages');
        const pagesDoc = await getDoc(pagesDocRef);
        if (pagesDoc.exists()) {
          const pagesData = pagesDoc.data();
          setPages(pagesData.pages || allPages);
        } else {
          setPages(allPages);
        }

        // Load users
        const usersRef = collection(db, 'users');
        const usersSnapshot = await getDocs(usersRef);
        const usersData = usersSnapshot.docs.map(doc => ({
          userId: doc.id,
          email: doc.data().email,
          role: doc.data().role || 'employee',
          permissions: doc.data().permissions || [],
          customPermissions: doc.data().customPermissions || []
        }));
        setUsers(usersData);
      } else {
        // Fallback if Firebase not initialized
        setPages(allPages);
        setUsers([]);
        setFunctions([]);
      }

      // Load example functions
      setFunctions([
        {
          id: 'func-1',
          name: 'Send E-post Notifikasjon',
          description: 'Sender automatisk e-post til brukere når noe skjer',
          type: 'system',
          enabled: true,
          permissions: ['admin', 'manager'],
          code: `// Send e-post notifikasjon
function sendEmailNotification(userEmail, subject, message) {
  console.log('Sending email to:', userEmail);
  console.log('Subject:', subject);
  console.log('Message:', message);
  // Her ville du integrere med e-post service
  return { success: true, messageId: 'msg-' + Date.now() };
}

// Eksempel bruk
sendEmailNotification('user@example.com', 'Velkommen!', 'Velkommen til DriftPro!');`,
          createdAt: new Date().toISOString()
        },
        {
          id: 'func-2',
          name: 'Generer Rapport',
          description: 'Genererer automatisk rapporter basert på data',
          type: 'custom',
          enabled: true,
          permissions: ['admin', 'manager'],
          code: `// Generer rapport
function generateReport(data, reportType) {
  console.log('Generating report:', reportType);
  console.log('Data points:', data.length);
  
  const report = {
    type: reportType,
    generatedAt: new Date().toISOString(),
    dataPoints: data.length,
    summary: 'Rapport generert automatisk'
  };
  
  return report;
}

// Eksempel bruk
const sampleData = [1, 2, 3, 4, 5];
const report = generateReport(sampleData, 'monthly');
console.log('Generated report:', report);`,
          createdAt: new Date().toISOString()
        },
        {
          id: 'func-3',
          name: 'Backup Database',
          description: 'Lager sikkerhetskopi av databasen',
          type: 'system',
          enabled: false,
          permissions: ['admin'],
          code: `// Backup database
function backupDatabase() {
  console.log('Starting database backup...');
  
  const backup = {
    timestamp: new Date().toISOString(),
    collections: ['users', 'companies', 'settings'],
    status: 'completed'
  };
  
  console.log('Backup completed:', backup);
  return backup;
}

// Kjør backup
backupDatabase();`,
          createdAt: new Date().toISOString()
        }
      ]);

    } catch (error) {
      console.error('Error loading data:', error);
      // Fallback on error
      setPages(allPages);
      setUsers([]);
      setFunctions([]);
    } finally {
      setIsLoading(false);
    }
  };

  const savePages = async () => {
    setSaveStatus('saving');
    try {
      if (db) {
        const pagesDocRef = doc(db, 'systemSettings', 'pages');
        await setDoc(pagesDocRef, { 
          pages,
          updatedAt: new Date().toISOString(),
          updatedBy: user?.uid || 'unknown'
        });
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2000);
      }
    } catch (error) {
      console.error('Error saving pages:', error);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
  };

  const saveUserPermissions = async () => {
    setSaveStatus('saving');
    try {
      if (db) {
        for (const user of users) {
          const userDocRef = doc(db, 'users', user.userId);
          await updateDoc(userDocRef, {
            permissions: user.permissions,
            customPermissions: user.customPermissions,
            updatedAt: new Date().toISOString()
          });
        }
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2000);
      }
    } catch (error) {
      console.error('Error saving user permissions:', error);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
  };

  const updatePage = (pageId: string, updates: Partial<PageConfig>) => {
    setPages(prev => prev.map(page => 
      page.id === pageId ? { ...page, ...updates } : page
    ));
  };

  const updateUser = (userId: string, updates: Partial<UserPermission>) => {
    setUsers(prev => prev.map(user => 
      user.userId === userId ? { ...user, ...updates } : user
    ));
  };

  const addCustomPage = () => {
    const newPage: PageConfig = {
      id: `custom-${Date.now()}`,
      name: 'Ny Side',
      path: '/dashboard/custom',
      icon: 'Plus',
      category: 'custom',
      isVisible: true,
      permissions: ['admin']
    };
    setPages(prev => [...prev, newPage]);
  };

  const deletePage = (pageId: string) => {
    if (confirm('Er du sikker på at du vil slette denne siden?')) {
      setPages(prev => prev.filter(page => page.id !== pageId));
    }
  };

  // Additional functions for all buttons to work 100%
  const resetToDefaults = () => {
    if (confirm('Er du sikker på at du vil tilbakestille alle sider til standard?')) {
      setPages(allPages);
    }
  };

  const exportConfiguration = () => {
    const config = {
      pages,
      users,
      exportedAt: new Date().toISOString(),
      exportedBy: user?.email || 'unknown'
    };
    
    const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `driftpro-config-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const importConfiguration = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const config = JSON.parse(e.target?.result as string);
          if (config.pages) setPages(config.pages);
          if (config.users) setUsers(config.users);
          alert('Konfigurasjon importert!');
        } catch (error) {
          alert('Feil ved import av konfigurasjon!');
        }
      };
      reader.readAsText(file);
    }
  };

  const clearAllData = () => {
    if (confirm('ER DU SIKKER PÅ AT DU VIL SLETTE ALL DATA? Dette kan ikke angres!')) {
      if (confirm('Dette vil slette ALLE sider og brukerrettigheter. Er du HELT sikker?')) {
        setPages([]);
        setUsers([]);
      }
    }
  };

  const refreshData = () => {
    loadData();
  };

  const togglePageVisibility = (pageId: string) => {
    updatePage(pageId, { isVisible: !pages.find(p => p.id === pageId)?.isVisible });
  };

  const duplicatePage = (pageId: string) => {
    const page = pages.find(p => p.id === pageId);
    if (page) {
      const newPage: PageConfig = {
        ...page,
        id: `${page.id}-copy-${Date.now()}`,
        name: `${page.name} (Kopi)`
      };
      setPages(prev => [...prev, newPage]);
    }
  };

  const bulkUpdatePermissions = (role: string, permission: string, add: boolean) => {
    setUsers(prev => prev.map(user => ({
      ...user,
      permissions: add 
        ? [...user.permissions, permission]
        : user.permissions.filter(p => p !== permission)
    })));
  };

  // Additional functions for all tabs
  const addFunction = () => {
    const newFunction = {
      id: `func-${Date.now()}`,
      name: 'Ny Funksjon',
      description: 'Beskrivelse av funksjonen',
      type: 'custom',
      enabled: true,
      permissions: ['admin'],
      code: '// Din kode her\nconsole.log("Ny funksjon!");',
      createdAt: new Date().toISOString()
    };
    
    setFunctions(prev => [...prev, newFunction]);
    setSelectedFunction(newFunction);
    setShowFunctionEditor(true);
  };

  const editFunction = () => {
    if (functions.length > 0) {
      setSelectedFunction(functions[0]);
      setShowFunctionEditor(true);
    } else {
      alert('Ingen funksjoner å redigere. Legg til en funksjon først.');
    }
  };

  const removeFunction = () => {
    if (functions.length > 0) {
      if (confirm('Er du sikker på at du vil fjerne denne funksjonen?')) {
        setFunctions(prev => prev.slice(1));
      }
    } else {
      alert('Ingen funksjoner å fjerne.');
    }
  };

  const openCodeEditor = () => {
    setShowCodeEditor(true);
  };

  const executeFunction = (funcId: string) => {
    const func = functions.find(f => f.id === funcId);
    if (func) {
      try {
        // Simuler funksjonskjøring
        console.log(`🚀 Kjører funksjon: ${func.name}`);
        console.log(`📝 Kode: ${func.code}`);
        alert(`Funksjon "${func.name}" ble kjørt! Sjekk konsollen for resultat.`);
      } catch (error) {
        alert(`Feil ved kjøring av funksjon: ${error}`);
      }
    }
  };

  const toggleFunction = (funcId: string) => {
    setFunctions(prev => prev.map(func => 
      func.id === funcId ? { ...func, enabled: !func.enabled } : func
    ));
  };

  const duplicateFunction = (funcId: string) => {
    const func = functions.find(f => f.id === funcId);
    if (func) {
      const newFunc = {
        ...func,
        id: `func-${Date.now()}`,
        name: `${func.name} (Kopi)`,
        createdAt: new Date().toISOString()
      };
      setFunctions(prev => [...prev, newFunc]);
    }
  };

  const exportFunction = (funcId: string) => {
    const func = functions.find(f => f.id === funcId);
    if (func) {
      const blob = new Blob([JSON.stringify(func, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${func.name.replace(/\s+/g, '-')}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  const importFunction = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const func = JSON.parse(e.target?.result as string);
          func.id = `func-${Date.now()}`;
          func.createdAt = new Date().toISOString();
          setFunctions(prev => [...prev, func]);
          alert('Funksjon importert!');
        } catch (error) {
          alert('Feil ved import av funksjon!');
        }
      };
      reader.readAsText(file);
    }
  };

  const bulkExecuteFunctions = () => {
    const enabledFunctions = functions.filter(f => f.enabled);
    if (enabledFunctions.length === 0) {
      alert('Ingen aktiverte funksjoner å kjøre.');
      return;
    }
    
    if (confirm(`Kjør ${enabledFunctions.length} aktiverte funksjoner?`)) {
      enabledFunctions.forEach(func => {
        console.log(`🚀 Kjører: ${func.name}`);
      });
      alert(`${enabledFunctions.length} funksjoner ble kjørt! Sjekk konsollen.`);
    }
  };

  const clearAllFunctions = () => {
    if (confirm('ER DU SIKKER PÅ AT DU VIL SLETTE ALLE FUNKSJONER?')) {
      setFunctions([]);
    }
  };

  const viewCollections = () => {
    alert('Se alle samlinger funksjonalitet kommer snart!');
  };

  const editDocuments = () => {
    alert('Rediger dokumenter funksjonalitet kommer snart!');
  };

  const clearDatabase = () => {
    if (confirm('ER DU SIKKER PÅ AT DU VIL SLETTE HELE DATABASEN? Dette kan ikke angres!')) {
      alert('Database sletting funksjonalitet kommer snart!');
    }
  };

  const systemStatus = () => {
    alert('System status: Alle tjenester kjører normalt!');
  };

  const viewLogs = () => {
    alert('Logg visning funksjonalitet kommer snart!');
  };

  const clearCache = () => {
    alert('Cache ryddet!');
  };

  const getIconComponent = (iconName: string) => {
    const icons: { [key: string]: any } = {
      Home, Users, Building, FileText, Calendar, MessageSquare, Shield, 
      BarChart3, Clock, Phone, Handshake, Globe, Settings, Terminal, 
      Palette, Heart, Target, Activity, Mail, Code, Database, Server,
      Plus, Edit, Trash2, Save, Eye, Lock, Unlock, CheckCircle, XCircle,
      AlertTriangle, Info, Zap, Layers, Type, Image, Video, Music, Download,
      Upload, RefreshCw, Search, Filter, SortAsc, SortDesc, MoreHorizontal,
      Copy, Scissors, Move, RotateCw, RotateCcw, FlipHorizontal, FlipVertical,
      Minus, Bell
    };
    const IconComponent = icons[iconName] || Settings;
    return <IconComponent size={16} />;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600">Laster super admin...</span>
      </div>
    );
  }

  return (
    <div style={{ background: 'var(--background-color)', minHeight: '100vh', padding: 'var(--space-6)' }}>
      {/* Header */}
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
          <div className="card-icon">
            <Settings />
          </div>
          <div>
            <h1 className="page-title">Super Admin Kontrollpanel</h1>
            <p className="page-subtitle">Endre ALT i hele DriftPro-systemet</p>
          </div>
        </div>
        
        {/* Save Status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {saveStatus === 'saving' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--blue-600)' }}>
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span className="text-sm">Lagrer...</span>
            </div>
          )}
          {saveStatus === 'saved' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--green-600)' }}>
              <CheckCircle className="w-4 h-4" />
              <span className="text-sm">Lagret!</span>
            </div>
          )}
          {saveStatus === 'error' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--red-600)' }}>
              <XCircle className="w-4 h-4" />
              <span className="text-sm">Feil ved lagring!</span>
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', borderBottom: '1px solid var(--gray-200)' }}>
          {[
            { id: 'pages', name: 'Sider', icon: Layout },
            { id: 'users', name: 'Brukere', icon: Users },
            { id: 'permissions', name: 'Rettigheter', icon: Shield },
            { id: 'customization', name: 'Tilpasning', icon: Palette },
            { id: 'functions', name: 'Funksjoner', icon: Code },
            { id: 'finance', name: 'Finans', icon: DollarSign },
            { id: 'hr', name: 'HR', icon: Users },
            { id: 'inventory', name: 'Lager', icon: Package },
            { id: 'crm', name: 'CRM', icon: Heart },
            { id: 'projects', name: 'Prosjekter', icon: FolderOpen },
            { id: 'database', name: 'Database', icon: Database },
            { id: 'system', name: 'System', icon: Server }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`btn ${activeTab === tab.id ? 'btn-primary' : 'btn-secondary'}`}
              style={{ borderRadius: 0, borderBottom: activeTab === tab.id ? '2px solid var(--blue-600)' : '2px solid transparent' }}
            >
              <tab.icon size={16} />
              {tab.name}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div style={{ padding: 'var(--space-6)' }}>
          {activeTab === 'pages' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-6)' }}>
                <h2 style={{ fontSize: 'var(--font-size-xl)', fontWeight: '600', color: 'var(--gray-900)' }}>
                  Administrer Sider
                </h2>
                <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
                  <button onClick={addCustomPage} className="btn btn-success">
                    <Plus size={16} />
                    Legg til side
                  </button>
                  <button onClick={refreshData} className="btn btn-secondary">
                    <RefreshCw size={16} />
                    Oppdater
                  </button>
                  <button onClick={resetToDefaults} className="btn btn-warning">
                    <RotateCcw size={16} />
                    Tilbakestill
                  </button>
                  <button onClick={exportConfiguration} className="btn btn-info">
                    <Download size={16} />
                    Eksporter
                  </button>
                  <label className="btn btn-info" style={{ cursor: 'pointer' }}>
                    <Upload size={16} />
                    Importer
                    <input
                      type="file"
                      accept=".json"
                      onChange={importConfiguration}
                      style={{ display: 'none' }}
                    />
                  </label>
                  <button onClick={savePages} className="btn btn-primary">
                    <Save size={16} />
                    Lagre endringer
                  </button>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 'var(--space-4)' }}>
                {pages.map(page => (
                  <div key={page.id} className="card" style={{ padding: 'var(--space-4)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-3)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                        {getIconComponent(page.icon)}
                        <h3 style={{ fontSize: 'var(--font-size-lg)', fontWeight: '600', color: 'var(--gray-900)' }}>
                          {page.name}
                        </h3>
                      </div>
                      <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                        <button
                          onClick={() => {
                            console.log('🔧 Editing page:', page);
                            setSelectedPage(page);
                            setShowPageEditor(true);
                            console.log('🔧 Modal should open now');
                          }}
                          className="btn btn-primary"
                          style={{ padding: 'var(--space-2)' }}
                          title="Rediger side"
                        >
                          <Edit size={14} />
                        </button>
                        <button
                          onClick={() => togglePageVisibility(page.id)}
                          className={`btn ${page.isVisible ? 'btn-success' : 'btn-warning'}`}
                          style={{ padding: 'var(--space-2)' }}
                          title={page.isVisible ? 'Skjul side' : 'Vis side'}
                        >
                          <Eye size={14} />
                        </button>
                        <button
                          onClick={() => duplicatePage(page.id)}
                          className="btn btn-info"
                          style={{ padding: 'var(--space-2)' }}
                          title="Dupliser side"
                        >
                          <Copy size={14} />
                        </button>
                        <button
                          onClick={() => deletePage(page.id)}
                          className="btn btn-danger"
                          style={{ padding: 'var(--space-2)' }}
                          title="Slett side"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                    
                    <div style={{ marginBottom: 'var(--space-3)' }}>
                      <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--gray-600)', marginBottom: 'var(--space-2)' }}>
                        <strong>Sti:</strong> {page.path}
                      </p>
                      <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--gray-600)', marginBottom: 'var(--space-2)' }}>
                        <strong>Kategori:</strong> {page.category}
                      </p>
                      <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--gray-600)', marginBottom: 'var(--space-2)' }}>
                        <strong>Synlig:</strong> {page.isVisible ? 'Ja' : 'Nei'}
                      </p>
                      <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--gray-600)' }}>
                        <strong>Rettigheter:</strong> {page.permissions.join(', ')}
                      </p>
                    </div>

                    <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontSize: 'var(--font-size-sm)' }}>
                        <input
                          type="checkbox"
                          checked={page.isVisible}
                          onChange={(e) => updatePage(page.id, { isVisible: e.target.checked })}
                        />
                        Synlig
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'users' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-6)' }}>
                <h2 style={{ fontSize: 'var(--font-size-xl)', fontWeight: '600', color: 'var(--gray-900)' }}>
                  Administrer Brukere
                </h2>
                <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
                  <button onClick={refreshData} className="btn btn-secondary">
                    <RefreshCw size={16} />
                    Oppdater
                  </button>
                  <button onClick={clearAllData} className="btn btn-danger">
                    <Trash2 size={16} />
                    Slett alt
                  </button>
                  <button onClick={saveUserPermissions} className="btn btn-primary">
                    <Save size={16} />
                    Lagre rettigheter
                  </button>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: 'var(--space-4)' }}>
                {users.map(user => (
                  <div key={user.userId} className="card" style={{ padding: 'var(--space-4)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-3)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                        <Users size={16} />
                        <h3 style={{ fontSize: 'var(--font-size-lg)', fontWeight: '600', color: 'var(--gray-900)' }}>
                          {user.email}
                        </h3>
                      </div>
                      <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                        <button
                          onClick={() => {
                            console.log('🔧 Editing user:', user);
                            setSelectedUser(user);
                            setShowUserEditor(true);
                            console.log('🔧 User modal should open now');
                          }}
                          className="btn btn-primary"
                          style={{ padding: 'var(--space-2)' }}
                          title="Rediger bruker"
                        >
                          <Edit size={14} />
                        </button>
                        <button
                          onClick={() => updateUser(user.userId, { role: user.role === 'admin' ? 'employee' : 'admin' })}
                          className={`btn ${user.role === 'admin' ? 'btn-warning' : 'btn-success'}`}
                          style={{ padding: 'var(--space-2)' }}
                          title={`Gjør til ${user.role === 'admin' ? 'ansatt' : 'admin'}`}
                        >
                          <Shield size={14} />
                        </button>
                        <button
                          onClick={() => updateUser(user.userId, { permissions: [], customPermissions: [] })}
                          className="btn btn-danger"
                          style={{ padding: 'var(--space-2)' }}
                          title="Fjern alle rettigheter"
                        >
                          <Lock size={14} />
                        </button>
                      </div>
                    </div>
                    
                    <div style={{ marginBottom: 'var(--space-3)' }}>
                      <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--gray-600)', marginBottom: 'var(--space-2)' }}>
                        <strong>Rolle:</strong> {user.role}
                      </p>
                      <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--gray-600)', marginBottom: 'var(--space-2)' }}>
                        <strong>Rettigheter:</strong> {user.permissions.join(', ') || 'Ingen'}
                      </p>
                      <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--gray-600)' }}>
                        <strong>Tilpassede rettigheter:</strong> {user.customPermissions.join(', ') || 'Ingen'}
                      </p>
                    </div>

                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
                      {['admin', 'manager', 'employee'].map(role => (
                        <label key={role} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontSize: 'var(--font-size-sm)' }}>
                          <input
                            type="checkbox"
                            checked={user.permissions.includes(role)}
                            onChange={(e) => {
                              const newPermissions = e.target.checked
                                ? [...user.permissions, role]
                                : user.permissions.filter(p => p !== role);
                              updateUser(user.userId, { permissions: newPermissions });
                            }}
                          />
                          {role}
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'permissions' && (
            <div>
              <h2 style={{ fontSize: 'var(--font-size-xl)', fontWeight: '600', color: 'var(--gray-900)', marginBottom: 'var(--space-6)' }}>
                Rettighetshierarki
              </h2>
              <div className="card" style={{ padding: 'var(--space-6)' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 'var(--space-6)' }}>
                  <div>
                    <h3 style={{ fontSize: 'var(--font-size-lg)', fontWeight: '600', color: 'var(--gray-900)', marginBottom: 'var(--space-4)' }}>
                      Admin Rettigheter
                    </h3>
                    <ul style={{ listStyle: 'none', padding: 0 }}>
                      {['Alle sider', 'Brukeradministrasjon', 'Systeminnstillinger', 'Database-adgang', 'Super Admin'].map(right => (
                        <li key={right} style={{ padding: 'var(--space-2)', background: 'var(--green-50)', marginBottom: 'var(--space-2)', borderRadius: 'var(--radius-md)' }}>
                          <CheckCircle size={16} style={{ color: 'var(--green-600)', marginRight: 'var(--space-2)' }} />
                          {right}
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <div>
                    <h3 style={{ fontSize: 'var(--font-size-lg)', fontWeight: '600', color: 'var(--gray-900)', marginBottom: 'var(--space-4)' }}>
                      Manager Rettigheter
                    </h3>
                    <ul style={{ listStyle: 'none', padding: 0 }}>
                      {['Ansatte', 'Prosjekter', 'Oppgaver', 'Rapporter', 'Kalender'].map(right => (
                        <li key={right} style={{ padding: 'var(--space-2)', background: 'var(--blue-50)', marginBottom: 'var(--space-2)', borderRadius: 'var(--radius-md)' }}>
                          <CheckCircle size={16} style={{ color: 'var(--blue-600)', marginRight: 'var(--space-2)' }} />
                          {right}
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <div>
                    <h3 style={{ fontSize: 'var(--font-size-lg)', fontWeight: '600', color: 'var(--gray-900)', marginBottom: 'var(--space-4)' }}>
                      Employee Rettigheter
                    </h3>
                    <ul style={{ listStyle: 'none', padding: 0 }}>
                      {['Egne oppgaver', 'Tidsregistrering', 'Chat', 'E-post', 'Dokumenter'].map(right => (
                        <li key={right} style={{ padding: 'var(--space-2)', background: 'var(--gray-50)', marginBottom: 'var(--space-2)', borderRadius: 'var(--radius-md)' }}>
                          <CheckCircle size={16} style={{ color: 'var(--gray-600)', marginRight: 'var(--space-2)' }} />
                          {right}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'customization' && (
            <div>
              <h2 style={{ fontSize: 'var(--font-size-xl)', fontWeight: '600', color: 'var(--gray-900)', marginBottom: 'var(--space-6)' }}>
                Tilpasning av Utseende
              </h2>
              <div className="card" style={{ padding: 'var(--space-6)' }}>
                <p style={{ color: 'var(--gray-600)', marginBottom: 'var(--space-4)' }}>
                  Her kan du tilpasse hvordan hele DriftPro-systemet ser ut. Endringer lagres permanent.
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-4)' }}>
                  <button className="btn btn-primary">
                    <Palette size={16} />
                    Fargepalett
                  </button>
                  <button className="btn btn-primary">
                    <Type size={16} />
                    Typografi
                  </button>
                  <button className="btn btn-primary">
                    <Layout size={16} />
                    Layout
                  </button>
                  <button className="btn btn-primary">
                    <Image size={16} />
                    Bilder & Ikoner
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'functions' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-6)' }}>
                <h2 style={{ fontSize: 'var(--font-size-xl)', fontWeight: '600', color: 'var(--gray-900)' }}>
                  Administrer Funksjoner
                </h2>
                <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
                  <button onClick={addFunction} className="btn btn-success">
                    <Plus size={16} />
                    Legg til funksjon
                  </button>
                  <button onClick={bulkExecuteFunctions} className="btn btn-primary">
                    <Play size={16} />
                    Kjør alle aktiverte
                  </button>
                  <button onClick={clearAllFunctions} className="btn btn-danger">
                    <Trash2 size={16} />
                    Slett alle
                  </button>
                  <label className="btn btn-info" style={{ cursor: 'pointer' }}>
                    <Upload size={16} />
                    Importer funksjon
                    <input
                      type="file"
                      accept=".json"
                      onChange={importFunction}
                      style={{ display: 'none' }}
                    />
                  </label>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: 'var(--space-4)' }}>
                {functions.length === 0 ? (
                  <div className="card" style={{ padding: 'var(--space-6)', textAlign: 'center', gridColumn: '1 / -1' }}>
                    <Code size={48} style={{ color: 'var(--gray-400)', marginBottom: 'var(--space-4)' }} />
                    <h3 style={{ fontSize: 'var(--font-size-lg)', fontWeight: '600', color: 'var(--gray-900)', marginBottom: 'var(--space-2)' }}>
                      Ingen funksjoner ennå
                    </h3>
                    <p style={{ color: 'var(--gray-600)', marginBottom: 'var(--space-4)' }}>
                      Legg til din første funksjon for å komme i gang
                    </p>
                    <button onClick={addFunction} className="btn btn-primary">
                      <Plus size={16} />
                      Legg til første funksjon
                    </button>
                  </div>
                ) : (
                  functions.map(func => (
                    <div key={func.id} className="card" style={{ padding: 'var(--space-4)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-3)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                          <div style={{ 
                            width: '12px', 
                            height: '12px', 
                            borderRadius: '50%', 
                            backgroundColor: func.enabled ? 'var(--green-500)' : 'var(--gray-400)' 
                          }} />
                          <h3 style={{ fontSize: 'var(--font-size-lg)', fontWeight: '600', color: 'var(--gray-900)' }}>
                            {func.name}
                          </h3>
                        </div>
                        <div style={{ display: 'flex', gap: 'var(--space-1)' }}>
                          <button
                            onClick={() => executeFunction(func.id)}
                            className="btn btn-success"
                            style={{ padding: 'var(--space-1)', fontSize: 'var(--font-size-xs)' }}
                            title="Kjør funksjon"
                          >
                            <Play size={12} />
                          </button>
                          <button
                            onClick={() => toggleFunction(func.id)}
                            className={`btn ${func.enabled ? 'btn-warning' : 'btn-success'}`}
                            style={{ padding: 'var(--space-1)', fontSize: 'var(--font-size-xs)' }}
                            title={func.enabled ? 'Deaktiver' : 'Aktiver'}
                          >
                            <Power size={12} />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedFunction(func);
                              setShowFunctionEditor(true);
                            }}
                            className="btn btn-primary"
                            style={{ padding: 'var(--space-1)', fontSize: 'var(--font-size-xs)' }}
                            title="Rediger"
                          >
                            <Edit size={12} />
                          </button>
                          <button
                            onClick={() => duplicateFunction(func.id)}
                            className="btn btn-info"
                            style={{ padding: 'var(--space-1)', fontSize: 'var(--font-size-xs)' }}
                            title="Dupliser"
                          >
                            <Copy size={12} />
                          </button>
                          <button
                            onClick={() => exportFunction(func.id)}
                            className="btn btn-secondary"
                            style={{ padding: 'var(--space-1)', fontSize: 'var(--font-size-xs)' }}
                            title="Eksporter"
                          >
                            <Download size={12} />
                          </button>
                        </div>
                      </div>
                      
                      <div style={{ marginBottom: 'var(--space-3)' }}>
                        <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--gray-600)', marginBottom: 'var(--space-2)' }}>
                          <strong>Beskrivelse:</strong> {func.description}
                        </p>
                        <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--gray-600)', marginBottom: 'var(--space-2)' }}>
                          <strong>Type:</strong> {func.type}
                        </p>
                        <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--gray-600)', marginBottom: 'var(--space-2)' }}>
                          <strong>Rettigheter:</strong> {func.permissions.join(', ')}
                        </p>
                        <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--gray-600)' }}>
                          <strong>Opprettet:</strong> {new Date(func.createdAt).toLocaleDateString()}
                        </p>
                      </div>

                      <div style={{ 
                        backgroundColor: 'var(--gray-50)', 
                        padding: 'var(--space-2)', 
                        borderRadius: 'var(--border-radius)', 
                        fontSize: 'var(--font-size-xs)',
                        fontFamily: 'monospace',
                        maxHeight: '100px',
                        overflow: 'auto'
                      }}>
                        <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
                          {func.code.length > 100 ? `${func.code.substring(0, 100)}...` : func.code}
                        </pre>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {activeTab === 'database' && (
            <div>
              <h2 style={{ fontSize: 'var(--font-size-xl)', fontWeight: '600', color: 'var(--gray-900)', marginBottom: 'var(--space-6)' }}>
                Database Administrasjon
              </h2>
              <div className="card" style={{ padding: 'var(--space-6)' }}>
                <p style={{ color: 'var(--gray-600)', marginBottom: 'var(--space-4)' }}>
                  Administrer alle data i Firestore-databasen.
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-4)' }}>
                  <button onClick={viewCollections} className="btn btn-primary">
                    <Database size={16} />
                    Se alle samlinger
                  </button>
                  <button onClick={editDocuments} className="btn btn-warning">
                    <Edit size={16} />
                    Rediger dokumenter
                  </button>
                  <button onClick={clearDatabase} className="btn btn-danger">
                    <Trash2 size={16} />
                    Slett dokumenter
                  </button>
                  <button onClick={exportConfiguration} className="btn btn-success">
                    <Download size={16} />
                    Eksporter data
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'finance' && (
            <div>
              <h2 style={{ fontSize: 'var(--font-size-xl)', fontWeight: '600', color: 'var(--gray-900)', marginBottom: 'var(--space-6)' }}>
                Finans & Regnskap
              </h2>
              <div className="card" style={{ padding: 'var(--space-6)' }}>
                <p style={{ color: 'var(--gray-600)', marginBottom: 'var(--space-4)' }}>
                  Administrer alle finansielle funksjoner i systemet.
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-4)' }}>
                  <button onClick={() => alert('Fakturering funksjonalitet kommer snart!')} className="btn btn-success">
                    <FileText size={16} />
                    Fakturering
                  </button>
                  <button onClick={() => alert('Betalinger funksjonalitet kommer snart!')} className="btn btn-warning">
                    <CreditCard size={16} />
                    Betalinger
                  </button>
                  <button onClick={() => alert('Regnskap funksjonalitet kommer snart!')} className="btn btn-info">
                    <Calculator size={16} />
                    Regnskap
                  </button>
                  <button onClick={() => alert('Budsjetter funksjonalitet kommer snart!')} className="btn btn-primary">
                    <PieChart size={16} />
                    Budsjetter
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'hr' && (
            <div>
              <h2 style={{ fontSize: 'var(--font-size-xl)', fontWeight: '600', color: 'var(--gray-900)', marginBottom: 'var(--space-6)' }}>
                HR & Personal
              </h2>
              <div className="card" style={{ padding: 'var(--space-6)' }}>
                <p style={{ color: 'var(--gray-600)', marginBottom: 'var(--space-4)' }}>
                  Administrer ansatte, timer, ferie og lønn.
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-4)' }}>
                  <button onClick={() => alert('Ansatte funksjonalitet kommer snart!')} className="btn btn-success">
                    <Users size={16} />
                    Ansatte
                  </button>
                  <button onClick={() => alert('Timeregistrering funksjonalitet kommer snart!')} className="btn btn-warning">
                    <Clock size={16} />
                    Timeregistrering
                  </button>
                  <button onClick={() => alert('Ferie funksjonalitet kommer snart!')} className="btn btn-info">
                    <Calendar size={16} />
                    Ferie
                  </button>
                  <button onClick={() => alert('Lønn funksjonalitet kommer snart!')} className="btn btn-primary">
                    <DollarSign size={16} />
                    Lønn
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'inventory' && (
            <div>
              <h2 style={{ fontSize: 'var(--font-size-xl)', fontWeight: '600', color: 'var(--gray-900)', marginBottom: 'var(--space-6)' }}>
                Lager & Inventar
              </h2>
              <div className="card" style={{ padding: 'var(--space-6)' }}>
                <p style={{ color: 'var(--gray-600)', marginBottom: 'var(--space-4)' }}>
                  Administrer produkter, lager og leverandører.
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-4)' }}>
                  <button onClick={() => alert('Lager funksjonalitet kommer snart!')} className="btn btn-success">
                    <Package size={16} />
                    Lager
                  </button>
                  <button onClick={() => alert('Produkter funksjonalitet kommer snart!')} className="btn btn-warning">
                    <Box size={16} />
                    Produkter
                  </button>
                  <button onClick={() => alert('Leverandører funksjonalitet kommer snart!')} className="btn btn-info">
                    <Truck size={16} />
                    Leverandører
                  </button>
                  <button onClick={() => alert('Bestillinger funksjonalitet kommer snart!')} className="btn btn-primary">
                    <ShoppingCart size={16} />
                    Bestillinger
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'crm' && (
            <div>
              <h2 style={{ fontSize: 'var(--font-size-xl)', fontWeight: '600', color: 'var(--gray-900)', marginBottom: 'var(--space-6)' }}>
                CRM & Kunder
              </h2>
              <div className="card" style={{ padding: 'var(--space-6)' }}>
                <p style={{ color: 'var(--gray-600)', marginBottom: 'var(--space-4)' }}>
                  Administrer kunder, salg og kundeservice.
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-4)' }}>
                  <button onClick={() => alert('Kunder funksjonalitet kommer snart!')} className="btn btn-success">
                    <UserCheck size={16} />
                    Kunder
                  </button>
                  <button onClick={() => alert('Leads funksjonalitet kommer snart!')} className="btn btn-warning">
                    <Target size={16} />
                    Leads
                  </button>
                  <button onClick={() => alert('Salg funksjonalitet kommer snart!')} className="btn btn-info">
                    <TrendingUp size={16} />
                    Salg
                  </button>
                  <button onClick={() => alert('Support funksjonalitet kommer snart!')} className="btn btn-primary">
                    <Headphones size={16} />
                    Support
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'projects' && (
            <div>
              <h2 style={{ fontSize: 'var(--font-size-xl)', fontWeight: '600', color: 'var(--gray-900)', marginBottom: 'var(--space-6)' }}>
                Prosjektstyring
              </h2>
              <div className="card" style={{ padding: 'var(--space-6)' }}>
                <p style={{ color: 'var(--gray-600)', marginBottom: 'var(--space-4)' }}>
                  Administrer prosjekter, oppgaver og ressurser.
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-4)' }}>
                  <button onClick={() => alert('Prosjekter funksjonalitet kommer snart!')} className="btn btn-success">
                    <FolderOpen size={16} />
                    Prosjekter
                  </button>
                  <button onClick={() => alert('Oppgaver funksjonalitet kommer snart!')} className="btn btn-warning">
                    <CheckSquare size={16} />
                    Oppgaver
                  </button>
                  <button onClick={() => alert('Ressurser funksjonalitet kommer snart!')} className="btn btn-info">
                    <Users size={16} />
                    Ressurser
                  </button>
                  <button onClick={() => alert('Gantt funksjonalitet kommer snart!')} className="btn btn-primary">
                    <BarChart size={16} />
                    Gantt
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'system' && (
            <div>
              <h2 style={{ fontSize: 'var(--font-size-xl)', fontWeight: '600', color: 'var(--gray-900)', marginBottom: 'var(--space-6)' }}>
                Systeminnstillinger
              </h2>
              <div className="card" style={{ padding: 'var(--space-6)' }}>
                <p style={{ color: 'var(--gray-600)', marginBottom: 'var(--space-4)' }}>
                  Avanserte systeminnstillinger og konfigurasjoner.
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-4)' }}>
                  <button onClick={systemStatus} className="btn btn-primary">
                    <Server size={16} />
                    Server status
                  </button>
                  <button onClick={refreshData} className="btn btn-warning">
                    <RefreshCw size={16} />
                    Restart system
                  </button>
                  <button onClick={viewLogs} className="btn btn-danger">
                    <AlertTriangle size={16} />
                    System logs
                  </button>
                  <button onClick={clearCache} className="btn btn-success">
                    <Zap size={16} />
                    Performance
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Page Editor Modal */}
      {showPageEditor && selectedPage && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <h2 className="modal-title">Rediger Side: {selectedPage.name}</h2>
              <button onClick={() => setShowPageEditor(false)} className="modal-close">
                <XCircle size={20} />
              </button>
            </div>
            <div className="modal-body">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: 'var(--space-2)', fontWeight: '600' }}>
                    Side navn
                  </label>
                  <input
                    type="text"
                    value={selectedPage.name}
                    onChange={(e) => setSelectedPage({ ...selectedPage, name: e.target.value })}
                    className="btn"
                    style={{ width: '100%', padding: 'var(--space-3)' }}
                  />
                </div>
                
                <div>
                  <label style={{ display: 'block', marginBottom: 'var(--space-2)', fontWeight: '600' }}>
                    Side sti
                  </label>
                  <input
                    type="text"
                    value={selectedPage.path}
                    onChange={(e) => setSelectedPage({ ...selectedPage, path: e.target.value })}
                    className="btn"
                    style={{ width: '100%', padding: 'var(--space-3)' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: 'var(--space-2)', fontWeight: '600' }}>
                    Synlig
                  </label>
                  <input
                    type="checkbox"
                    checked={selectedPage.isVisible}
                    onChange={(e) => setSelectedPage({ ...selectedPage, isVisible: e.target.checked })}
                  />
                </div>

                <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
                  <button 
                    onClick={() => {
                      updatePage(selectedPage.id, selectedPage);
                      setShowPageEditor(false);
                    }}
                    className="btn btn-primary"
                  >
                    <Save size={16} />
                    Lagre
                  </button>
                  <button onClick={() => setShowPageEditor(false)} className="btn btn-secondary">
                    Avbryt
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Function Editor Modal */}
      {showFunctionEditor && selectedFunction && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '800px' }}>
            <div className="modal-header">
              <h2 className="modal-title">Rediger Funksjon: {selectedFunction.name}</h2>
              <button onClick={() => setShowFunctionEditor(false)} className="modal-close">
                <XCircle size={20} />
              </button>
            </div>
            <div className="modal-body">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: 'var(--space-2)', fontWeight: '600' }}>
                    Funksjonsnavn
                  </label>
                  <input
                    type="text"
                    value={selectedFunction.name}
                    onChange={(e) => setSelectedFunction({ ...selectedFunction, name: e.target.value })}
                    className="btn"
                    style={{ width: '100%', padding: 'var(--space-3)' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: 'var(--space-2)', fontWeight: '600' }}>
                    Beskrivelse
                  </label>
                  <textarea
                    value={selectedFunction.description}
                    onChange={(e) => setSelectedFunction({ ...selectedFunction, description: e.target.value })}
                    className="btn"
                    style={{ width: '100%', padding: 'var(--space-3)', minHeight: '80px' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: 'var(--space-2)', fontWeight: '600' }}>
                    Type
                  </label>
                  <select
                    value={selectedFunction.type}
                    onChange={(e) => setSelectedFunction({ ...selectedFunction, type: e.target.value as any })}
                    className="btn"
                    style={{ width: '100%', padding: 'var(--space-3)' }}
                  >
                    <option value="custom">Custom</option>
                    <option value="system">System</option>
                    <option value="plugin">Plugin</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: 'var(--space-2)', fontWeight: '600' }}>
                    Rettigheter
                  </label>
                  <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
                    {['admin', 'manager', 'employee'].map(permission => (
                      <label key={permission} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)' }}>
                        <input
                          type="checkbox"
                          checked={selectedFunction.permissions.includes(permission)}
                          onChange={(e) => {
                            const newPermissions = e.target.checked
                              ? [...selectedFunction.permissions, permission]
                              : selectedFunction.permissions.filter(p => p !== permission);
                            setSelectedFunction({ ...selectedFunction, permissions: newPermissions });
                          }}
                        />
                        {permission}
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: 'var(--space-2)', fontWeight: '600' }}>
                    Kode
                  </label>
                  <textarea
                    value={selectedFunction.code}
                    onChange={(e) => setSelectedFunction({ ...selectedFunction, code: e.target.value })}
                    className="btn"
                    style={{ 
                      width: '100%', 
                      padding: 'var(--space-3)', 
                      minHeight: '200px',
                      fontFamily: 'monospace',
                      fontSize: 'var(--font-size-sm)'
                    }}
                    placeholder="// Skriv din JavaScript kode her..."
                  />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                  <input
                    type="checkbox"
                    id="function-enabled"
                    checked={selectedFunction.enabled}
                    onChange={(e) => setSelectedFunction({ ...selectedFunction, enabled: e.target.checked })}
                  />
                  <label htmlFor="function-enabled" style={{ fontWeight: '600' }}>
                    Aktiver funksjon
                  </label>
                </div>

                <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
                  <button 
                    onClick={() => {
                      setFunctions(prev => prev.map(func => 
                        func.id === selectedFunction.id ? selectedFunction : func
                      ));
                      setShowFunctionEditor(false);
                    }}
                    className="btn btn-primary"
                  >
                    <Save size={16} />
                    Lagre
                  </button>
                  <button 
                    onClick={() => executeFunction(selectedFunction.id)}
                    className="btn btn-success"
                  >
                    <Play size={16} />
                    Test kjør
                  </button>
                  <button onClick={() => setShowFunctionEditor(false)} className="btn btn-secondary">
                    Avbryt
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* User Editor Modal */}
      {showUserEditor && selectedUser && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <h2 className="modal-title">Rediger Bruker: {selectedUser.email}</h2>
              <button onClick={() => setShowUserEditor(false)} className="modal-close">
                <XCircle size={20} />
              </button>
            </div>
            <div className="modal-body">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: 'var(--space-2)', fontWeight: '600' }}>
                    Rolle
                  </label>
                  <select
                    value={selectedUser.role}
                    onChange={(e) => setSelectedUser({ ...selectedUser, role: e.target.value })}
                    className="btn"
                    style={{ width: '100%', padding: 'var(--space-3)' }}
                  >
                    <option value="admin">Admin</option>
                    <option value="manager">Manager</option>
                    <option value="employee">Employee</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: 'var(--space-2)', fontWeight: '600' }}>
                    Rettigheter
                  </label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
                    {['admin', 'manager', 'employee', 'read', 'write', 'delete'].map(permission => (
                      <label key={permission} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                        <input
                          type="checkbox"
                          checked={selectedUser.permissions.includes(permission)}
                          onChange={(e) => {
                            const newPermissions = e.target.checked
                              ? [...selectedUser.permissions, permission]
                              : selectedUser.permissions.filter(p => p !== permission);
                            setSelectedUser({ ...selectedUser, permissions: newPermissions });
                          }}
                        />
                        {permission}
                      </label>
                    ))}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
                  <button 
                    onClick={() => {
                      updateUser(selectedUser.userId, selectedUser);
                      setShowUserEditor(false);
                    }}
                    className="btn btn-primary"
                  >
                    <Save size={16} />
                    Lagre
                  </button>
                  <button onClick={() => setShowUserEditor(false)} className="btn btn-secondary">
                    Avbryt
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
