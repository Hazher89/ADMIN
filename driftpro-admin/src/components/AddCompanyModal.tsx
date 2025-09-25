'use client';

import React, { useState } from 'react';
import { 
  Building, 
  X, 
  Save, 
  User, 
  Lock, 
  Settings,
  Home,
  Users,
  Calendar,
  Heart,
  Target,
  Shield,
  FileText,
  MessageSquare,
  BarChart3,
  Clock,
  Phone,
  Handshake,
  Globe,
  CheckCircle
} from 'lucide-react';

interface SidebarPermission {
  id: string;
  name: string;
  href: string;
  icon: React.ReactNode;
  category: string;
  enabled: boolean;
}

interface AddCompanyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (companyData: any) => Promise<void>;
}

const sidebarPermissions: SidebarPermission[] = [
  // Main navigation
  { id: 'dashboard', name: 'Dashboard', href: '/dashboard', icon: <Home size={16} />, category: 'main', enabled: true },
  { id: 'employees', name: 'Ansatte', href: '/dashboard/employees', icon: <Users size={16} />, category: 'main', enabled: false },
  { id: 'shifts', name: 'Vakter', href: '/dashboard/shifts', icon: <Calendar size={16} />, category: 'main', enabled: false },
  { id: 'absence-vacation', name: 'Fravær og ferie', href: '/dashboard/absence-vacation', icon: <Heart size={16} />, category: 'main', enabled: false },
  { id: 'bud-priser', name: 'BUD priser', href: '/dashboard/bud-priser', icon: <Target size={16} />, category: 'main', enabled: false },
  { id: 'deviations', name: 'HMS', href: '/dashboard/deviations', icon: <Shield size={16} />, category: 'main', enabled: false },
  { id: 'documents', name: 'Dokumenter', href: '/dashboard/documents', icon: <FileText size={16} />, category: 'main', enabled: false },
  { id: 'chat', name: 'Chat', href: '/dashboard/chat', icon: <MessageSquare size={16} />, category: 'main', enabled: false },
  { id: 'reports', name: 'Rapporter', href: '/dashboard/reports', icon: <BarChart3 size={16} />, category: 'main', enabled: false },
  { id: 'timeclock', name: 'Tidsregistrering', href: '/dashboard/timeclock', icon: <Clock size={16} />, category: 'main', enabled: false },
  { id: 'sms-logs', name: 'SMS Logg & Telefonbok', href: '/dashboard/sms-logs', icon: <Phone size={16} />, category: 'main', enabled: false },
  
  // Management
  { id: 'departments', name: 'Avdelinger', href: '/dashboard/departments', icon: <Building size={16} />, category: 'management', enabled: false },
  { id: 'partners', name: 'Samarbeidspartnere', href: '/dashboard/partners', icon: <Handshake size={16} />, category: 'management', enabled: false },
  
  // Settings
  { id: 'settings', name: 'Innstillinger', href: '/dashboard/settings', icon: <Settings size={16} />, category: 'settings', enabled: true },
];

export default function AddCompanyModal({ isOpen, onClose, onSave }: AddCompanyModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    orgNumber: '',
    phone: '',
    email: '',
    address: '',
    industry: '',
    adminName: '',
    adminEmail: '',
    adminPassword: '',
    adminPhone: '',
    subscriptionPlan: 'basic' as 'basic' | 'premium' | 'enterprise',
    status: 'active' as 'active' | 'inactive' | 'pending'
  });

  const [permissions, setPermissions] = useState<SidebarPermission[]>(sidebarPermissions);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handlePermissionChange = (id: string, enabled: boolean) => {
    setPermissions(prev => 
      prev.map(permission => 
        permission.id === id ? { ...permission, enabled } : permission
      )
    );
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) newErrors.name = 'Bedriftsnavn er påkrevd';
    if (!formData.orgNumber.trim()) newErrors.orgNumber = 'Organisasjonsnummer er påkrevd';
    if (!formData.email.trim()) newErrors.email = 'E-post er påkrevd';
    if (!formData.adminName.trim()) newErrors.adminName = 'Admin navn er påkrevd';
    if (!formData.adminEmail.trim()) newErrors.adminEmail = 'Admin e-post er påkrevd';
    if (!formData.adminPassword.trim()) newErrors.adminPassword = 'Admin passord er påkrevd';
    if (formData.adminPassword.length < 6) newErrors.adminPassword = 'Passord må være minst 6 tegn';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('Form submitted with data:', formData);
    console.log('Permissions:', permissions.filter(p => p.enabled));
    
    if (!validateForm()) {
      console.log('Form validation failed:', errors);
      return;
    }

    setLoading(true);
    try {
      const companyData = {
        ...formData,
        permissions: permissions.filter(p => p.enabled).map(p => ({
          id: p.id,
          name: p.name,
          href: p.href,
          category: p.category
        })),
        employeeCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        contactPerson: {
          name: formData.adminName,
          phone: formData.adminPhone,
          email: formData.adminEmail
        }
      };

      await onSave(companyData);
      onClose();
      
      // Reset form
      setFormData({
        name: '',
        orgNumber: '',
        phone: '',
        email: '',
        address: '',
        industry: '',
        adminName: '',
        adminEmail: '',
        adminPassword: '',
        adminPhone: '',
        subscriptionPlan: 'basic',
        status: 'active'
      });
      setPermissions(sidebarPermissions);
    } catch (error) {
      console.error('Error saving company:', error);
    } finally {
      setLoading(false);
    }
  };

  const groupedPermissions = permissions.reduce((acc, permission) => {
    if (!acc[permission.category]) {
      acc[permission.category] = [];
    }
    acc[permission.category].push(permission);
    return acc;
  }, {} as Record<string, SidebarPermission[]>);

  if (!isOpen) return null;

  console.log('Modal is opening with isOpen:', isOpen);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl max-h-[90vh] overflow-y-auto w-[90%]">
        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-2xl font-semibold text-gray-900 flex items-center gap-2">
            <Building size={24} />
            Legg til ny bedrift
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl p-1"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* Bedriftsinformasjon */}
            <div>
              <h3 className="text-lg font-semibold mb-4 text-gray-900">
                Bedriftsinformasjon
              </h3>
              
              <div className="mb-4">
                <label className="block mb-2 font-medium text-gray-700">
                  Bedriftsnavn *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.name ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Skriv inn bedriftsnavn"
                />
                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
              </div>

              <div className="mb-4">
                <label className="block mb-2 font-medium text-gray-700">
                  Organisasjonsnummer *
                </label>
                <input
                  type="text"
                  value={formData.orgNumber}
                  onChange={(e) => handleInputChange('orgNumber', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.orgNumber ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="123456789"
                />
                {errors.orgNumber && <p className="text-red-500 text-xs mt-1">{errors.orgNumber}</p>}
              </div>

              <div className="mb-4">
                <label className="block mb-2 font-medium text-gray-700">
                  E-post *
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.email ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="info@bedrift.no"
                />
                {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
              </div>

              <div className="mb-4">
                <label className="block mb-2 font-medium text-gray-700">
                  Telefon
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="+47 123 45 678"
                />
              </div>

              <div className="mb-4">
                <label className="block mb-2 font-medium text-gray-700">
                  Adresse
                </label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Gate 1, 0001 Oslo"
                />
              </div>

              <div className="mb-4">
                <label className="block mb-2 font-medium text-gray-700">
                  Bransje
                </label>
                <select
                  value={formData.industry}
                  onChange={(e) => handleInputChange('industry', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Velg bransje</option>
                  <option value="Teknologi">Teknologi</option>
                  <option value="Produksjon">Produksjon</option>
                  <option value="Helse">Helse</option>
                  <option value="Utdanning">Utdanning</option>
                  <option value="Finans">Finans</option>
                  <option value="Annet">Annet</option>
                </select>
              </div>
            </div>

            {/* Admin-informasjon */}
            <div>
              <h3 className="text-lg font-semibold mb-4 text-gray-900">
                Admin-bruker
              </h3>
              
              <div className="mb-4">
                <label className="block mb-2 font-medium text-gray-700">
                  Admin navn *
                </label>
                <input
                  type="text"
                  value={formData.adminName}
                  onChange={(e) => handleInputChange('adminName', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.adminName ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Admin Navn"
                />
                {errors.adminName && <p className="text-red-500 text-xs mt-1">{errors.adminName}</p>}
              </div>

              <div className="mb-4">
                <label className="block mb-2 font-medium text-gray-700">
                  Admin e-post *
                </label>
                <input
                  type="email"
                  value={formData.adminEmail}
                  onChange={(e) => handleInputChange('adminEmail', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.adminEmail ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="admin@bedrift.no"
                />
                {errors.adminEmail && <p className="text-red-500 text-xs mt-1">{errors.adminEmail}</p>}
              </div>

              <div className="mb-4">
                <label className="block mb-2 font-medium text-gray-700">
                  Admin passord *
                </label>
                <input
                  type="password"
                  value={formData.adminPassword}
                  onChange={(e) => handleInputChange('adminPassword', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.adminPassword ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Minst 6 tegn"
                />
                {errors.adminPassword && <p className="text-red-500 text-xs mt-1">{errors.adminPassword}</p>}
              </div>

              <div className="mb-4">
                <label className="block mb-2 font-medium text-gray-700">
                  Admin telefon
                </label>
                <input
                  type="tel"
                  value={formData.adminPhone}
                  onChange={(e) => handleInputChange('adminPhone', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="+47 123 45 678"
                />
              </div>

              <div className="mb-4">
                <label className="block mb-2 font-medium text-gray-700">
                  Abonnement
                </label>
                <select
                  value={formData.subscriptionPlan}
                  onChange={(e) => handleInputChange('subscriptionPlan', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="basic">Basic</option>
                  <option value="premium">Premium</option>
                  <option value="enterprise">Enterprise</option>
                </select>
              </div>

              <div className="mb-4">
                <label className="block mb-2 font-medium text-gray-700">
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => handleInputChange('status', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="active">Aktiv</option>
                  <option value="inactive">Inaktiv</option>
                  <option value="pending">Venter</option>
                </select>
              </div>
            </div>
          </div>

          {/* Sidepanel-tilganger */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold mb-4 text-gray-900">
              Sidepanel-tilganger
            </h3>
            
            {Object.entries(groupedPermissions).map(([category, categoryPermissions]) => (
              <div key={category} className="mb-6">
                <h4 className="text-base font-semibold mb-3 text-gray-700 capitalize">
                  {category === 'main' && 'Hovedmeny'}
                  {category === 'management' && 'Ledelse'}
                  {category === 'settings' && 'Innstillinger'}
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                  {categoryPermissions.map((permission) => (
                    <label
                      key={permission.id}
                      className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-all ${
                        permission.enabled 
                          ? 'bg-blue-50 border-blue-200' 
                          : 'bg-white border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={permission.enabled}
                        onChange={(e) => handlePermissionChange(permission.id, e.target.checked)}
                        className="rounded"
                      />
                      <div className="flex items-center gap-2">
                        {permission.icon}
                        <span className="text-sm font-medium">
                          {permission.name}
                        </span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Knapper */}
          <div className="flex gap-4 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 rounded-md bg-white text-gray-700 hover:bg-gray-50 text-sm font-medium"
            >
              Avbryt
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`px-6 py-2 rounded-md text-white text-sm font-medium flex items-center gap-2 ${
                loading 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-transparent border-t-white rounded-full animate-spin" />
                  Oppretter...
                </>
              ) : (
                <>
                  <Save size={16} />
                  Opprett bedrift
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}