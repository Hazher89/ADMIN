'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { firebaseService, PartnerUser } from '@/lib/firebase-services';
import { sveveSMS } from '@/lib/sveve-sms-service';
import { 
  Handshake, 
  Plus, 
  Search, 
  Building,
  Phone,
  Mail,
  MapPin,
  Globe,
  Users,
  BarChart3,
  Eye,
  Edit,
  Trash2,
  MoreHorizontal,
  CheckCircle,
  Clock,
  AlertTriangle,
  ExternalLink,
  Star,
  Upload,
  Download,
  FileText,
  Calendar,
  Tag,
  User,
  Hash,
  Briefcase,
  Target,
  TrendingUp,
  Filter,
  SortAsc,
  SortDesc,
  Grid,
  List,
  CheckCircle2,
  XCircle,
  Info,
  Database,
  RefreshCw,
  Save,
  Loader2,
  X,
  Link,
  Key
} from 'lucide-react';

interface Partner {
  id: string;
  name: string;
  description: string;
  type: 'supplier' | 'customer' | 'vendor' | 'consultant';
  status: 'active' | 'inactive' | 'pending';
  orgNumber?: string;
  vatNumber?: string;
  industry?: string;
  companySize?: 'micro' | 'small' | 'medium' | 'large';
  foundedYear?: number;
  address: {
    street: string;
    city: string;
    postalCode: string;
    country: string;
  };
  contactPerson: {
    name: string;
    email: string;
    phone: string;
    position: string;
    department?: string;
    mobile?: string;
  };
  website?: string;
  rating: number;
  projects: number;
  revenue: number;
  notes?: string;
  tags?: string[];
  lastContact?: string;
  nextFollowUp?: string;
  contractStart?: string;
  contractEnd?: string;
  paymentTerms?: string;
  creditLimit?: number;
  createdAt: string;
  updatedAt: string;
}

interface PartnerAssignment {
  id: string;
  partnerId: string;
  partnerName: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  location: string;
  type: 'delivery' | 'installation' | 'service' | 'maintenance' | 'consultation';
  status: 'pending' | 'accepted' | 'declined' | 'completed' | 'cancelled';
  assignedBy: string;
  assignedTo: string;
  hourlyRate?: number;
  totalHours?: number;
  notes?: string;
  attachments?: string[];
  pdfFiles?: string[];
  emailSent: boolean;
  emailSentAt?: string;
  createdAt: string;
  updatedAt: string;
}

export default function PartnersPage() {
  const { userProfile } = useAuth();
  
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [sortBy, setSortBy] = useState<'name' | 'revenue' | 'rating' | 'createdAt'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  // Tab state
  const [activeTab, setActiveTab] = useState<'partners' | 'assignments' | 'users'>('partners');
  
  // Assignment states
  const [assignments, setAssignments] = useState<PartnerAssignment[]>([]);
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  const [showDayAssignmentModal, setShowDayAssignmentModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedPartnerForAssignment, setSelectedPartnerForAssignment] = useState<string>('');
  const [calendarView, setCalendarView] = useState<'week' | 'month'>('week');
  const [currentWeek, setCurrentWeek] = useState(new Date('2025-08-04'));
  const [newAssignment, setNewAssignment] = useState<Partial<PartnerAssignment>>({
    title: '',
    description: '',
    startDate: '',
    endDate: '',
    startTime: '',
    endTime: '',
    location: '',
    partnerId: '',
    assignedTo: '',
    hourlyRate: 0,
    notes: '',
    type: 'delivery',
    pdfFiles: []
  });

  const [showAddModal, setShowAddModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showEditPartnerModal, setShowEditPartnerModal] = useState(false);
  const [showBRRGSearchModal, setShowBRRGSearchModal] = useState(false);
  const [showCreateUserModal, setShowCreateUserModal] = useState(false);
  const [brrgSearchResults, setBrrgSearchResults] = useState<any[]>([]);
  const [brrgSearchQuery, setBrrgSearchQuery] = useState('');
  const [brrgSearchLoading, setBrrgSearchLoading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState<{[key: string]: number}>({});
  const [showEditUserModal, setShowEditUserModal] = useState(false);
  const [showDeleteUserModal, setShowDeleteUserModal] = useState(false);
  const [showResetPasswordModal, setShowResetPasswordModal] = useState(false);
  const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [newPartner, setNewPartner] = useState({
    name: '',
    description: '',
    type: 'supplier' as 'supplier' | 'customer' | 'vendor' | 'consultant',
    status: 'active' as 'active' | 'inactive' | 'pending',
    orgNumber: '',
    vatNumber: '',
    industry: '',
    companySize: 'small' as 'micro' | 'small' | 'medium' | 'large',
    foundedYear: new Date().getFullYear(),
    address: {
      street: '',
      city: '',
      postalCode: '',
      country: 'Norge'
    },
    contactPerson: {
      name: '',
      email: '',
      phone: '',
      position: '',
      department: '',
      mobile: ''
    },
    website: '',
    rating: 0,
    projects: 0,
    revenue: 0,
    notes: '',
    tags: '',
    lastContact: '',
    nextFollowUp: '',
    contractStart: '',
    contractEnd: '',
    paymentTerms: '',
    creditLimit: 0
  });



  const [editPartner, setEditPartner] = useState({
    name: '',
    description: '',
    type: 'supplier' as 'supplier' | 'customer' | 'vendor' | 'consultant',
    status: 'active' as 'active' | 'inactive' | 'pending',
    orgNumber: '',
    vatNumber: '',
    industry: '',
    companySize: 'small' as 'micro' | 'small' | 'medium' | 'large',
    foundedYear: new Date().getFullYear(),
    address: {
      street: '',
      city: '',
      postalCode: '',
      country: 'Norge'
    },
    contactPerson: {
      name: '',
      email: '',
      phone: '',
      position: '',
      department: '',
      mobile: ''
    },
    website: '',
    rating: 5,
    projects: 0,
    revenue: 0,
    notes: '',
    tags: [],
    paymentTerms: '',
    creditLimit: 0
  });

  const [newPartnerUser, setNewPartnerUser] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    phoneNumber: '',
    role: 'user' as 'user' | 'admin'
  });

  const [editPartnerUser, setEditPartnerUser] = useState({
    email: '',
    fullName: '',
    role: 'user' as 'user' | 'admin'
  });

  const [resetPasswordData, setResetPasswordData] = useState({
    newPassword: '',
    confirmPassword: ''
  });

  // Partner users data from Firebase
  const [partnerUsers, setPartnerUsers] = useState<PartnerUser[]>([]);

  // Calendar functions
  const getWeekDays = () => {
    const days = [];
    const startOfWeek = new Date(currentWeek);
    startOfWeek.setDate(currentWeek.getDate() - currentWeek.getDay() + 1); // Monday start
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      days.push({
        date: date.toISOString().split('T')[0],
        day: date.getDate(),
        month: date.getMonth() + 1,
        shortName: ['Man', 'Tir', 'Ons', 'Tor', 'Fre', 'Lør', 'Søn'][i]
      });
    }
    return days;
  };

  const navigateWeek = (direction: number) => {
    const newWeek = new Date(currentWeek);
    newWeek.setDate(currentWeek.getDate() + (direction * 7));
    setCurrentWeek(newWeek);
  };

  const formatWeekRange = () => {
    const days = getWeekDays();
    const start = new Date(days[0].date);
    const end = new Date(days[6].date);
    return `${start.getDate()}/${start.getMonth() + 1} - ${end.getDate()}/${end.getMonth() + 1}`;
  };

  const getPartnerAssignments = (partnerId: string) => {
    return assignments.filter(a => a.partnerId === partnerId);
  };

  const getPartnerAssignmentsForDay = (partnerId: string, date: string) => {
    return assignments.filter(a => a.partnerId === partnerId && a.startDate === date);
  };

  const getAssignmentColor = (title: string) => {
    if (title.includes('Dagrute')) return '#f59e0b';      // Orange
    if (title.includes('Kveldsrute')) return '#3b82f6';   // Blue
    if (title.includes('Dobbel')) return '#10b981';       // Green
    if (title.includes('Intern')) return '#6b7280';       // Gray
    if (title.includes('LEDIG')) return '#10b981';        // Green
    if (title === 'Fri') return '#ef4444';               // Red
    if (title === 'Syk') return '#8b5cf6';               // Purple
    if (title === 'Gitt bort') return '#374151';         // Dark gray
    if (title === 'Geilo') return '#10b981';             // Green
    if (title === 'ADAM' || title === 'DAWID') return '#ec4899'; // Pink
    return '#6b7280'; // Default gray
  };

  const openDayAssignmentModal = (date: string, partnerId?: string) => {
    setSelectedDate(date);
    setSelectedPartnerForAssignment(partnerId || '');
    setShowDayAssignmentModal(true);
  };

  const openAssignmentModal = (assignment: PartnerAssignment) => {
    setNewAssignment(assignment);
    setShowAssignmentModal(true);
  };

  const loadPartners = async () => {
    if (!userProfile?.companyId) {
      setLoading(false);
      return;
    }

    try {
      setError(null);
      const partnersData = await firebaseService.getPartners(userProfile.companyId);
      setPartners(partnersData);
    } catch (error) {
      console.error('Error loading partners:', error);
      setError('Feil ved lasting av partnere');
      setPartners([]);
    } finally {
      setLoading(false);
    }
  };

  const loadPartnerUsers = async () => {
    if (!userProfile?.companyId) return;

    try {
      const usersData = await firebaseService.getPartnerUsers(userProfile.companyId);
      setPartnerUsers(usersData);
    } catch (error) {
      console.error('Error loading partner users:', error);
      setError('Feil ved lasting av partner-brukere');
    }
  };

  const handleCreatePartner = async () => {
    if (!userProfile?.companyId) {
      setError('Mangler bedrifts-ID');
      return;
    }

    try {
      setLoading(true);
      
      const partnerData = {
        ...newPartner,
        companyId: userProfile.companyId,
        createdBy: userProfile.uid || 'unknown'
      };
      
      const partnerId = await firebaseService.createPartner(partnerData);
      
      // Refresh partners list
      const updatedPartners = await firebaseService.getPartners(userProfile.companyId);
      setPartners(updatedPartners);
      setFilteredPartners(updatedPartners);
      
      setSuccess('Partner opprettet!');
      setShowAddModal(false);
      setNewPartner({
        name: '',
        description: '',
        type: 'supplier',
        status: 'active',
        orgNumber: '',
        vatNumber: '',
        industry: '',
        companySize: 'small',
        foundedYear: new Date().getFullYear(),
        address: {
          street: '',
          city: '',
          postalCode: '',
          country: 'Norge'
        },
        contactPerson: {
          name: '',
          email: '',
          phone: '',
          position: '',
          department: '',
          mobile: ''
        },
        website: '',
        rating: 5,
        projects: 0,
        revenue: 0,
        notes: '',
        tags: [],
        paymentTerms: '',
        creditLimit: 0
      });
      
    } catch (err: any) {
      setError(err.message || 'Kunne ikke opprette partner');
    } finally {
      setLoading(false);
    }
  };

  const handleEditPartner = async () => {
    if (!selectedPartner || !userProfile?.companyId) {
      setError('Ingen partner valgt eller mangler bedrifts-ID');
      return;
    }

    try {
      setLoading(true);
      
      await firebaseService.updatePartner(selectedPartner.id, editPartner);
      
      // Refresh partners list
      const updatedPartners = await firebaseService.getPartners(userProfile.companyId);
      setPartners(updatedPartners);
      setFilteredPartners(updatedPartners);
      
      setSuccess('Partner oppdatert!');
      setShowEditPartnerModal(false);
      setSelectedPartner(null);
      
    } catch (err: any) {
      setError(err.message || 'Kunne ikke oppdatere partner');
    } finally {
      setLoading(false);
    }
  };

  const handleBRRGSearch = async () => {
    if (!brrgSearchQuery.trim()) return;

    try {
      setBrrgSearchLoading(true);
      const results = await firebaseService.searchBRRGCompany(brrgSearchQuery);
      setBrrgSearchResults(results);
    } catch (error) {
      console.error('BRRG search error:', error);
      setError('Kunne ikke søke i BRRG');
    } finally {
      setBrrgSearchLoading(false);
    }
  };

  const handleBRRGSelect = (brrgData: any) => {
    setNewPartner(prev => ({
      ...prev,
      name: brrgData.companyName || brrgData.name || prev.name,
      orgNumber: brrgData.orgNumber || prev.orgNumber,
      industry: brrgData.industry || prev.industry,
      address: {
        ...prev.address,
        street: brrgData.address || prev.address.street,
        city: brrgData.city || prev.address.city,
        postalCode: brrgData.postalCode || prev.address.postalCode
      },
      brrgData: brrgData
    }));
    
    setShowBRRGSearchModal(false);
    setBrrgSearchResults([]);
    setBrrgSearchQuery('');
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setSelectedFiles(prev => [...prev, ...files]);
    }
  };

  const handleFileRemove = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleFileUpload = async () => {
    if (selectedFiles.length === 0) return;

    try {
      setLoading(true);
      
      // TODO: Implement Firebase Storage upload
      // For now, just simulate upload
      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        setUploadProgress(prev => ({ ...prev, [file.name]: 0 }));
        
        // Simulate upload progress
        for (let progress = 0; progress <= 100; progress += 10) {
          await new Promise(resolve => setTimeout(resolve, 100));
          setUploadProgress(prev => ({ ...prev, [file.name]: progress }));
        }
      }
      
      setSuccess('Filer opplastet!');
      setSelectedFiles([]);
      setUploadProgress({});
      
    } catch (error) {
      setError('Kunne ikke laste opp filer');
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePartnerUser = async () => {
    if (!selectedPartner || !userProfile?.companyId) {
      setError('Ingen partner valgt eller mangler bedrifts-ID');
      return;
    }

    if (newPartnerUser.password !== newPartnerUser.confirmPassword) {
      setError('Passordene matcher ikke');
      return;
    }

    if (newPartnerUser.password.length < 6) {
      setError('Passordet må være minst 6 tegn');
      return;
    }

    try {
      setLoading(true);
      
      // Create user in Firebase
      const userData = {
        partnerId: selectedPartner.id,
        partnerName: selectedPartner.name,
        companyId: userProfile.companyId,
        email: newPartnerUser.email,
        fullName: newPartnerUser.fullName,
        phoneNumber: newPartnerUser.phoneNumber || undefined,
        role: newPartnerUser.role,
        status: 'active' as const
      };
      
      const userId = await firebaseService.createPartnerUser(userData);
      
      // Refresh the users list
      const updatedUsers = await firebaseService.getPartnerUsers(userProfile.companyId);
      setPartnerUsers(updatedUsers);
      
      setSuccess('Partner-bruker opprettet!');
      
      // Send welcome SMS if phone number is provided
      if (newPartnerUser.phoneNumber && sveveSMS.validatePhoneNumber(newPartnerUser.phoneNumber)) {
        try {
          const welcomeMessage = `Velkommen til DriftPro, ${newPartnerUser.fullName}! Sett passordet ditt på: ${window.location.origin}/setup-password/welcome med e-post: ${newPartnerUser.email}`;
          
          // Use server-side API to avoid CORS issues
          const response = await fetch('/api/sms/send', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              to: newPartnerUser.phoneNumber,
              message: welcomeMessage,
              priority: 'normal'
            })
          });

          if (response.ok) {
            const result = await response.json();
          } else {
            console.error('❌ Failed to send welcome SMS:', response.status);
          }
        } catch (error) {
          console.error('❌ Failed to send welcome SMS:', error);
          // Don't show error to user, SMS failure shouldn't break user creation
        }
      }
      
      setNewPartnerUser({
        email: '',
        password: '',
        confirmPassword: '',
        fullName: '',
        phoneNumber: '',
        role: 'user'
      });
      setShowCreateUserModal(false);
      
      // TODO: Create Firebase Auth user with password
      // This would require additional Firebase Auth setup
      
    } catch (err: any) {
      setError(err.message || 'Kunne ikke opprette partner-bruker');
    } finally {
      setLoading(false);
    }
  };

  const handleEditPartnerUser = async () => {
    if (!selectedUser || !userProfile?.companyId) {
      setError('Ingen bruker valgt eller mangler bedrifts-ID');
      return;
    }

    try {
      setLoading(true);
      
      // Update user in Firebase
      await firebaseService.updatePartnerUser(selectedUser.id, editPartnerUser);
      
      // Refresh the users list
      const updatedUsers = await firebaseService.getPartnerUsers(userProfile.companyId);
      setPartnerUsers(updatedUsers);
      
      setSuccess('Bruker oppdatert!');
      setShowEditUserModal(false);
      setSelectedUser(null);
      
    } catch (err: any) {
      setError(err.message || 'Kunne ikke oppdatere bruker');
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePartnerUser = async () => {
    if (!selectedUser) {
      setError('Ingen bruker valgt');
      return;
    }

    try {
      setLoading(true);
      
      // Delete user from Firebase
      await firebaseService.deletePartnerUser(selectedUser.id);
      
      // Remove user from the list
      setPartnerUsers(prev => prev.filter(user => user.id !== selectedUser.id));
      
      setSuccess('Bruker slettet!');
      setShowDeleteUserModal(false);
      setSelectedUser(null);
      
    } catch (err: any) {
      setError(err.message || 'Kunne ikke slette bruker');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!selectedUser) {
      setError('Ingen bruker valgt');
      return;
    }

    if (resetPasswordData.newPassword !== resetPasswordData.confirmPassword) {
      setError('Passordene matcher ikke');
      return;
    }

    if (resetPasswordData.newPassword.length < 6) {
      setError('Passordet må være minst 6 tegn');
      return;
    }

    try {
      setLoading(true);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setSuccess('Passord tilbakestilt!');
      setShowResetPasswordModal(false);
      setSelectedUser(null);
      setResetPasswordData({
        newPassword: '',
        confirmPassword: ''
      });
      
      // In a real app, you would update the password in Firebase Auth
      
    } catch (err: any) {
      setError(err.message || 'Kunne ikke tilbakestille passord');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    loadPartners();
    loadPartnerUsers();
  }, [userProfile?.companyId]);

  // Load sample assignments after partners are loaded
  useEffect(() => {
    if (partners.length > 0) {
      const sampleAssignments: PartnerAssignment[] = [
        {
          id: '1',
          partnerId: partners[0].id,
          partnerName: partners[0].name,
          title: 'Dagrute - Østfold',
          description: 'Levering til Østfold området',
          startDate: '2025-08-04',
          endDate: '2025-08-04',
          startTime: '08:00',
          endTime: '15:00',
          location: 'Østfold',
          type: 'delivery',
          status: 'pending',
          assignedBy: 'admin',
          assignedTo: 'driver1',
          hourlyRate: 250,
          totalHours: 7,
          notes: 'Standard dagrute',
          attachments: [],
          pdfFiles: [],
          emailSent: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: '2',
          partnerId: partners[0].id,
          partnerName: partners[0].name,
          title: 'Kveldsrute - Jessheim',
          description: 'Kveldslevering til Jessheim',
          startDate: '2025-08-04',
          endDate: '2025-08-04',
          startTime: '16:00',
          endTime: '22:00',
          location: 'Jessheim',
          type: 'delivery',
          status: 'pending',
          assignedBy: 'admin',
          assignedTo: 'driver1',
          hourlyRate: 300,
          totalHours: 6,
          notes: 'Kveldsrute med høyere tariff',
          attachments: [],
          pdfFiles: [],
          emailSent: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ];
      
      setAssignments(sampleAssignments);
    }
  }, [partners]);

  const filteredPartners = partners.filter(partner => {
    const matchesSearch = partner.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = selectedType === 'all' || partner.type === selectedType;
    const matchesStatus = selectedStatus === 'all' || partner.status === selectedStatus;
    return matchesSearch && matchesType && matchesStatus;
  });

  const stats = {
    total: partners.length,
    active: partners.filter(p => p.status === 'active').length,
    customers: partners.filter(p => p.type === 'customer').length,
    suppliers: partners.filter(p => p.type === 'supplier').length,
    totalRevenue: partners.reduce((sum, p) => sum + p.revenue, 0)
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('no-NO', {
      style: 'currency',
      currency: 'NOK'
    }).format(amount);
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <Loader2 style={{ width: '32px', height: '32px', animation: 'spin 1s linear infinite' }} />
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
          <Handshake style={{ width: '32px', height: '32px', color: 'var(--primary)' }} />
          <h1 style={{ fontSize: 'var(--font-size-3xl)', fontWeight: '700', color: 'var(--gray-900)' }}>
            Samarbeidspartnere
          </h1>
          </div>
        <p style={{ color: 'var(--gray-600)', fontSize: 'var(--font-size-lg)' }}>
          Administrer samarbeidspartnere og tildelte oppdrag
            </p>
          </div>



      {/* Success/Error Messages */}
      {success && (
        <div style={{ 
          padding: '1rem', 
          background: 'var(--green-50)', 
          border: '1px solid var(--green-200)', 
          borderRadius: 'var(--radius-lg)', 
          marginBottom: '2rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <CheckCircle style={{ width: '20px', height: '20px', color: 'var(--green-600)' }} />
          <p style={{ color: 'var(--green-700)', fontSize: 'var(--font-size-sm)' }}>{success}</p>
          <button
            onClick={() => setSuccess(null)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              marginLeft: 'auto'
            }}
          >
            <X style={{ width: '16px', height: '16px', color: 'var(--green-600)' }} />
          </button>
        </div>
      )}

      {error && (
        <div style={{ 
          padding: '1rem', 
          background: 'var(--red-50)', 
          border: '1px solid var(--red-200)', 
          borderRadius: 'var(--radius-lg)', 
          marginBottom: '2rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <AlertTriangle style={{ width: '20px', height: '20px', color: 'var(--red-600)' }} />
          <p style={{ color: 'var(--red-700)', fontSize: 'var(--font-size-sm)' }}>{error}</p>
          <button
            onClick={() => setError(null)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              marginLeft: 'auto'
            }}
          >
            <X style={{ width: '16px', height: '16px', color: 'var(--red-600)' }} />
          </button>
        </div>
      )}

      {/* Tabs */}
      <div style={{ 
        display: 'flex', 
        borderBottom: '1px solid var(--gray-200)', 
        marginBottom: '2rem',
        gap: '0'
      }}>
            <button
              onClick={() => setActiveTab('partners')}
              style={{
                padding: isMobile ? '0.75rem 1rem' : '1rem 2rem',
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                borderBottom: activeTab === 'partners' ? '2px solid var(--primary)' : '2px solid transparent',
                color: activeTab === 'partners' ? 'var(--primary)' : 'var(--gray-600)',
                fontWeight: activeTab === 'partners' ? '600' : '500',
                fontSize: isMobile ? '0.9rem' : 'var(--font-size-base)'
              }}
            >
          <Building style={{ width: '16px', height: '16px', marginRight: '0.5rem', display: 'inline' }} />
          Partnere
            </button>
            <button
              onClick={() => setActiveTab('assignments')}
              style={{
                padding: isMobile ? '0.75rem 1rem' : '1rem 2rem',
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                borderBottom: activeTab === 'assignments' ? '2px solid var(--primary)' : '2px solid transparent',
                color: activeTab === 'assignments' ? 'var(--primary)' : 'var(--gray-600)',
                fontWeight: activeTab === 'assignments' ? '600' : '500',
                fontSize: isMobile ? '0.9rem' : 'var(--font-size-base)'
              }}
            >
              <Calendar style={{ width: '16px', height: '16px', marginRight: '0.5rem', display: 'inline' }} />
              Tildelt oppdrag
            </button>
        <button
          onClick={() => setActiveTab('users')}
          style={{
            padding: isMobile ? '0.75rem 1rem' : '1rem 2rem',
            border: 'none',
            background: 'transparent',
            cursor: 'pointer',
            borderBottom: activeTab === 'users' ? '2px solid var(--primary)' : '2px solid transparent',
            color: activeTab === 'users' ? 'var(--primary)' : 'var(--gray-600)',
            fontWeight: activeTab === 'users' ? '600' : '500',
            fontSize: isMobile ? '0.9rem' : 'var(--font-size-base)'
          }}
        >
          <Users style={{ width: '16px', height: '16px', marginRight: '0.5rem', display: 'inline' }} />
          Brukere
        </button>
        </div>
        
      {/* Main Content */}
      {activeTab === 'partners' && (
        <div>
          {/* Stats and Actions */}
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between', 
            marginBottom: '2rem',
            flexWrap: 'wrap',
            gap: '1rem'
          }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
              <span style={{
                padding: '0.5rem 1rem',
                background: 'var(--primary)',
                color: 'white',
                borderRadius: 'var(--radius-lg)',
                fontSize: 'var(--font-size-sm)',
                fontWeight: '600'
              }}>
            {partners.length} partnere
          </span>
              <span style={{
                padding: '0.5rem 1rem',
                background: 'var(--gray-100)',
                color: 'var(--gray-700)',
                borderRadius: 'var(--radius-lg)',
                fontSize: 'var(--font-size-sm)',
                fontWeight: '600'
              }}>
            {formatCurrency(stats.totalRevenue)} omsetning
          </span>
            </div>
            
          <button 
            onClick={() => setShowAddModal(true)}
              style={{
                padding: '0.75rem 1.5rem',
                background: 'var(--primary)',
                color: 'white',
                border: 'none',
                borderRadius: 'var(--radius-lg)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontWeight: '600'
              }}
          >
            <Plus style={{ width: '16px', height: '16px' }} />
            Legg til partner
          </button>
      </div>

          {/* Partners Grid */}
          {filteredPartners.length === 0 ? (
        <div style={{ 
              textAlign: 'center', 
              padding: '3rem', 
              color: 'var(--gray-500)',
              background: 'white',
          borderRadius: 'var(--radius-lg)', 
              border: '1px solid var(--gray-200)'
            }}>
              <Building style={{ width: '64px', height: '64px', margin: '0 auto 1rem', opacity: 0.5 }} />
              <h3 style={{ fontSize: 'var(--font-size-lg)', fontWeight: '600', marginBottom: '0.5rem' }}>
                Ingen samarbeidspartnere
              </h3>
              <p style={{ marginBottom: '1.5rem' }}>
                Du har ikke lagt til noen samarbeidspartnere ennå.
              </p>
              <button 
                onClick={() => setShowAddModal(true)}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: 'var(--primary)',
                  color: 'white',
                  border: 'none',
                  borderRadius: 'var(--radius-lg)',
                  cursor: 'pointer',
                  fontWeight: '600'
                }}
              >
                <Plus style={{ width: '16px', height: '16px', marginRight: '0.5rem', display: 'inline' }} />
                Legg til første partner
              </button>
        </div>
          ) : (
        <div style={{ 
              display: 'grid', 
              gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(300px, 1fr))',
              gap: '1.5rem'
            }}>
              {filteredPartners.map((partner) => (
                <div key={partner.id} style={{
                  background: 'white',
          borderRadius: 'var(--radius-lg)', 
                  padding: '1.5rem',
                  border: '1px solid var(--gray-200)',
                  boxShadow: 'var(--shadow-sm)',
                  transition: 'all var(--transition-normal)',
                  cursor: 'pointer'
                }}
                onClick={() => {
                  setSelectedPartner(partner);
                  setShowDetailModal(true);
                }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                    <div style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '50%',
                      background: 'var(--gradient-primary)',
          display: 'flex',
          alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontSize: '1.25rem',
                      fontWeight: '600'
        }}>
                      {partner.name.split(' ').map(n => n[0]).join('').toUpperCase()}
        </div>
                    <div>
                      <h3 style={{ fontSize: 'var(--font-size-lg)', fontWeight: '600', color: 'var(--gray-900)' }}>
                        {partner.name}
                      </h3>
                      <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--gray-500)' }}>
                        {partner.type}
                      </p>
                    </div>
                  </div>
                  
                  <p style={{ 
                    color: 'var(--gray-600)', 
                    marginBottom: '1rem',
                    lineHeight: '1.5'
                  }}>
                    {partner.description}
                  </p>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: 'var(--font-size-sm)' }}>
                    <span style={{ color: 'var(--gray-500)' }}>
                      Rating: {partner.rating}/5
                    </span>
                    <span style={{ color: 'var(--gray-500)' }}>
                      {partner.projects} prosjekter
                    </span>
            </div>
                  
                  <div style={{ 
                    display: 'flex', 
                    gap: '0.5rem', 
                    marginTop: '1rem',
                    justifyContent: 'flex-end'
                  }}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedPartner(partner);
                        setEditPartner({
                          name: partner.name,
                          description: partner.description,
                          type: partner.type,
                          status: partner.status,
                          orgNumber: partner.orgNumber || '',
                          vatNumber: partner.vatNumber || '',
                          industry: partner.industry || '',
                          companySize: partner.companySize || 'small',
                          foundedYear: partner.foundedYear || new Date().getFullYear(),
                          address: partner.address,
                          contactPerson: partner.contactPerson,
                          website: partner.website || '',
                          rating: partner.rating,
                          projects: partner.projects,
                          revenue: partner.revenue,
                          notes: partner.notes || '',
                          tags: partner.tags || [],
                          paymentTerms: partner.paymentTerms || '',
                          creditLimit: partner.creditLimit || 0
                        });
                        setShowEditPartnerModal(true);
                      }}
                      style={{
                        padding: '0.5rem 1rem',
                        background: 'var(--gray-100)',
                        color: 'var(--gray-700)',
                        border: 'none',
                        borderRadius: 'var(--radius-md)',
                        cursor: 'pointer',
                        fontSize: 'var(--font-size-sm)',
                        fontWeight: '500',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                      }}
                    >
                      <Edit style={{ width: '14px', height: '14px' }} />
                      Rediger
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedPartner(partner);
                        setShowCreateUserModal(true);
                      }}
                      style={{
                        padding: '0.5rem 1rem',
                        background: 'var(--primary)',
                        color: 'white',
                        border: 'none',
                        borderRadius: 'var(--radius-md)',
                        cursor: 'pointer',
                        fontSize: 'var(--font-size-sm)',
                        fontWeight: '500',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                      }}
                    >
                      <User style={{ width: '14px', height: '14px' }} />
                      Opprett bruker
                    </button>
            </div>
            </div>
              ))}
            </div>
          )}
          </div>
      )}

      {activeTab === 'assignments' && (
        <div style={{ background: 'white', borderRadius: 'var(--radius-lg)', padding: '2rem' }}>
          {/* Calendar Header */}
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between', 
            marginBottom: '2rem',
            flexWrap: 'wrap',
            gap: '1rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
              <select
                value={calendarView}
                onChange={(e) => setCalendarView(e.target.value as 'week' | 'month')}
                style={{
                  padding: '0.5rem',
                  border: '1px solid var(--gray-300)',
                  borderRadius: 'var(--radius-md)',
                  background: 'white'
                }}
              >
                <option value="week">Uke</option>
                <option value="month">Måned</option>
              </select>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <button
                  onClick={() => navigateWeek(-1)}
                  style={{
                    padding: '0.5rem',
                    border: 'none',
                    background: 'var(--gray-100)',
                    borderRadius: 'var(--radius-md)',
                    cursor: 'pointer'
                  }}
                >
                  ‹
                </button>
                <span style={{ fontWeight: '600', minWidth: '120px', textAlign: 'center' }}>
                  {formatWeekRange()}
                </span>
                <button
                  onClick={() => navigateWeek(1)}
                  style={{
                    padding: '0.5rem',
                    border: 'none',
                    background: 'var(--gray-100)',
                    borderRadius: 'var(--radius-md)',
                    cursor: 'pointer'
                  }}
                >
                  ›
                </button>
            </div>
          </div>

              <button 
              onClick={() => setShowAssignmentModal(true)}
              style={{
                padding: '0.75rem 1.5rem',
                background: 'var(--primary)',
                color: 'white',
                border: 'none',
                borderRadius: 'var(--radius-lg)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontWeight: '600'
              }}
              >
                <Plus style={{ width: '16px', height: '16px' }} />
              Legg til oppdrag
              </button>
            </div>

          {/* Calendar Grid */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: '200px repeat(7, 1fr)',
            gap: '1px',
            background: 'var(--gray-200)',
            border: '1px solid var(--gray-200)',
            borderRadius: 'var(--radius-lg)',
            overflow: 'hidden'
          }}>
            {/* Header Row */}
            <div style={{ 
              background: 'var(--gray-50)', 
              padding: '1rem', 
              fontWeight: '600',
              borderBottom: '1px solid var(--gray-200)'
            }}>
              Samarbeidspartnere
                    </div>
            {getWeekDays().map((day, index) => (
              <div key={index} style={{ 
                background: 'var(--gray-50)', 
                padding: '1rem', 
                        fontWeight: '600', 
                textAlign: 'center',
                borderBottom: '1px solid var(--gray-200)',
                cursor: 'pointer'
              }}
              onClick={() => openDayAssignmentModal(day.date)}
              >
                <div style={{ fontSize: '0.875rem', color: 'var(--gray-600)' }}>
                  {day.shortName}
                </div>
                <div style={{ fontSize: '1.125rem', fontWeight: '700' }}>
                  {day.day}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)' }}>
                  {day.month}
                </div>
              </div>
            ))}

            {/* Partner Rows */}
            {partners.length === 0 ? (
              <div style={{ 
                gridColumn: '1 / -1', 
                padding: '2rem', 
                textAlign: 'center', 
                color: 'var(--gray-500)',
                background: 'white'
              }}>
                <Building style={{ width: '48px', height: '48px', margin: '0 auto 1rem', opacity: 0.5 }} />
                <p>Ingen samarbeidspartnere funnet</p>
                <p style={{ fontSize: 'var(--font-size-sm)' }}>
                  Legg til samarbeidspartnere for å se dem i kalenderen
                </p>
              </div>
            ) : (
              partners.map((partner) => (
                <React.Fragment key={partner.id}>
                  {/* Partner Name */}
                  <div style={{ 
                    background: 'white', 
                    padding: '1rem',
                    borderRight: '1px solid var(--gray-200)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem'
                  }}>
                    <div style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      background: 'var(--gradient-primary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontSize: '0.75rem',
                      fontWeight: '600'
                    }}>
                      {partner.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontWeight: '500', fontSize: '0.875rem' }}>
                        {partner.name}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)' }}>
                        {getPartnerAssignments(partner.id).length} oppdrag
                      </div>
                    </div>
                  </div>

                  {/* Day Columns */}
                  {getWeekDays().map((day, dayIndex) => (
                    <div key={dayIndex} style={{ 
                      background: 'white', 
                      padding: '0.5rem',
                      minHeight: '80px',
                      position: 'relative',
                      cursor: 'pointer'
                    }}
                    onClick={() => openDayAssignmentModal(day.date, partner.id)}
                    >
                      {getPartnerAssignmentsForDay(partner.id, day.date).map((assignment, index) => (
                        <div key={index} style={{
                          background: getAssignmentColor(assignment.title),
                          color: 'white',
                          padding: '0.25rem 0.5rem',
                          borderRadius: 'var(--radius-sm)',
                          fontSize: '0.75rem',
                          marginBottom: '0.25rem',
                          cursor: 'pointer'
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          openAssignmentModal(assignment);
                        }}
                        >
                          <div style={{ fontWeight: '600' }}>
                            {assignment.title}
                    </div>
                          <div style={{ fontSize: '0.7rem', opacity: 0.9 }}>
                            {assignment.startTime} - {assignment.endTime}
                    </div>
                    </div>
                      ))}
                    </div>
                  ))}
                </React.Fragment>
              ))
            )}
          </div>
                      </div>
                    )}

      {activeTab === 'users' && (
        <div>
          {/* Users Header */}
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between', 
            marginBottom: '2rem',
            flexWrap: 'wrap',
            gap: '1rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
              <span style={{
                padding: '0.5rem 1rem',
                background: 'var(--primary)',
                color: 'white',
                borderRadius: 'var(--radius-lg)',
                fontSize: 'var(--font-size-sm)',
                fontWeight: '600'
              }}>
                {partnerUsers.length} brukere
              </span>
              <span style={{
                padding: '0.5rem 1rem',
                background: 'var(--gray-100)',
                color: 'var(--gray-700)',
                borderRadius: 'var(--radius-lg)',
                fontSize: 'var(--font-size-sm)',
                fontWeight: '600'
              }}>
                {partners.length} partnere
                      </span>
                    </div>
            
            <button 
              onClick={() => {
                setSelectedPartner(null);
                setShowCreateUserModal(true);
              }}
              style={{
                padding: '0.75rem 1.5rem',
                background: 'var(--primary)',
                color: 'white',
                border: 'none',
                borderRadius: 'var(--radius-lg)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontWeight: '600'
              }}
            >
              <Plus style={{ width: '16px', height: '16px' }} />
              Opprett bruker
            </button>
                  </div>

          {/* Users Grid */}
          {partnerUsers.length === 0 ? (
            <div style={{ 
              textAlign: 'center', 
              padding: '3rem', 
              color: 'var(--gray-500)',
              background: 'white',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--gray-200)'
            }}>
              <Users style={{ width: '64px', height: '64px', margin: '0 auto 1rem', opacity: '0.5' }} />
              <h3 style={{ fontSize: 'var(--font-size-lg)', fontWeight: '600', marginBottom: '0.5rem' }}>
                Ingen brukere funnet
              </h3>
              <p style={{ marginBottom: '1.5rem' }}>
                Du har ikke opprettet noen partner-brukere ennå.
              </p>
                    <button 
                onClick={() => setShowCreateUserModal(true)}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: 'var(--primary)',
                  color: 'white',
                  border: 'none',
                  borderRadius: 'var(--radius-lg)',
                  cursor: 'pointer',
                  fontWeight: '600'
                }}
              >
                <Plus style={{ width: '16px', height: '16px', marginRight: '0.5rem', display: 'inline' }} />
                Opprett bruker
                    </button>
            </div>
          ) : (
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(350px, 1fr))',
              gap: '1.5rem'
            }}>
              {partnerUsers.map((user) => (
                <div key={user.id} style={{
                  background: 'white',
                  borderRadius: 'var(--radius-lg)',
                  padding: '1.5rem',
                  border: '1px solid var(--gray-200)',
                  boxShadow: 'var(--shadow-sm)',
                  transition: 'all var(--transition-normal)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = 'var(--shadow-md)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <div style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '50%',
                        background: 'var(--gradient-primary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontSize: '1.25rem',
                        fontWeight: '600'
                      }}>
                        {user.fullName.split(' ').map(n => n[0]).join('').toUpperCase()}
                      </div>
                      <div>
                        <h3 style={{ fontSize: 'var(--font-size-lg)', fontWeight: '600', color: 'var(--gray-900)' }}>
                          {user.fullName}
                        </h3>
                        <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--gray-500)' }}>
                          {user.email}
                        </p>
                      </div>
                    </div>
                    
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.5rem 0.75rem',
                      background: user.role === 'admin' ? '#dc2626' + '15' : '#2563eb' + '15',
                      color: user.role === 'admin' ? '#dc2626' : '#2563eb',
                      borderRadius: 'var(--radius-md)',
                      fontSize: 'var(--font-size-sm)',
                      fontWeight: '500'
                    }}>
                      {user.role === 'admin' ? 'Administrator' : 'Bruker'}
                    </div>
                  </div>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                    <div>
                      <label style={{ fontSize: '0.75rem', color: 'var(--gray-500)', marginBottom: '0.25rem', display: 'block' }}>
                        Partner
                      </label>
                      <p style={{ fontSize: '0.875rem', color: 'var(--gray-900)', fontWeight: '500' }}>
                        {user.partnerName}
                      </p>
                    </div>
                    
                    <div>
                      <label style={{ fontSize: '0.75rem', color: 'var(--gray-500)', marginBottom: '0.25rem', display: 'block' }}>
                        Status
                      </label>
                      <p style={{ fontSize: '0.875rem', color: 'var(--gray-900)', fontWeight: '500' }}>
                        {user.status === 'active' ? 'Aktiv' : 'Inaktiv'}
                      </p>
                    </div>
                    
                    <div>
                      <label style={{ fontSize: '0.75rem', color: 'var(--gray-500)', marginBottom: '0.25rem', display: 'block' }}>
                        Sist innlogget
                      </label>
                      <p style={{ fontSize: '0.875rem', color: 'var(--gray-900)', fontWeight: '500' }}>
                        {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString('nb-NO') : 'Aldri'}
                      </p>
                    </div>
                    
                    <div>
                      <label style={{ fontSize: '0.75rem', color: 'var(--gray-500)', marginBottom: '0.25rem', display: 'block' }}>
                        Opprettet
                      </label>
                      <p style={{ fontSize: '0.875rem', color: 'var(--gray-900)', fontWeight: '500' }}>
                        {new Date(user.createdAt).toLocaleDateString('nb-NO')}
                      </p>
                    </div>
                  </div>
                  
                  <div style={{ 
                    display: 'flex', 
                    gap: '0.5rem', 
                    justifyContent: 'flex-end',
                    borderTop: '1px solid var(--gray-100)',
                    paddingTop: '1rem'
                  }}>
                    <button 
                      onClick={() => {
                        setSelectedUser(user);
                        setEditPartnerUser({
                          email: user.email,
                          fullName: user.fullName,
                          role: user.role
                        });
                        setShowEditUserModal(true);
                      }}
                      style={{
                        padding: '0.5rem 0.75rem',
                        background: 'var(--gray-100)',
                        color: 'var(--gray-700)',
                        border: 'none',
                        borderRadius: 'var(--radius-md)',
                        cursor: 'pointer',
                        fontSize: 'var(--font-size-sm)',
                        fontWeight: '500',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                      }}
                    >
                      <Edit style={{ width: '14px', height: '14px' }} />
                      Rediger
                    </button>
                    
                    <button 
                      onClick={() => {
                        setSelectedUser(user);
                        setShowResetPasswordModal(true);
                      }}
                      style={{ 
                        padding: '0.5rem 0.75rem',
                        background: 'var(--blue-100)',
                        color: 'var(--blue-700)',
                        border: 'none',
                        borderRadius: 'var(--radius-md)',
                        cursor: 'pointer',
                        fontSize: 'var(--font-size-sm)',
                        fontWeight: '500',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                      }}
                    >
                      <Key style={{ width: '14px', height: '14px' }} />
                      Nytt passord
                    </button>
                    
                    <button
                      onClick={() => {
                        setSelectedUser(user);
                        setShowDeleteUserModal(true);
                      }}
                      style={{
                        padding: '0.5rem 0.75rem',
                        background: 'var(--red-100)',
                        color: 'var(--red-700)',
                        border: 'none',
                        borderRadius: 'var(--radius-md)',
                        cursor: 'pointer',
                        fontSize: 'var(--font-size-sm)',
                        fontWeight: '500',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                      }}
                    >
                      <Trash2 style={{ width: '14px', height: '14px' }} />
                      Slett
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Edit Partner User Modal */}
      {showEditUserModal && selectedUser && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'white',
            borderRadius: 'var(--radius-lg)',
            padding: '2rem',
            maxWidth: '500px',
            width: '95%',
            maxHeight: '95vh',
            overflow: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
              <h2 style={{ fontSize: 'var(--font-size-xl)', fontWeight: '600', color: 'var(--gray-900)' }}>
                Rediger bruker: {selectedUser.fullName}
              </h2>
              <button
                onClick={() => setShowEditUserModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '0.5rem'
                }}
              >
                <X style={{ width: '20px', height: '20px', color: 'var(--gray-400)' }} />
              </button>
            </div>

            <div style={{ display: 'grid', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: 'var(--gray-700)' }}>
                  Fullt navn *
                </label>
                <input
                  type="text"
                  value={editPartnerUser.fullName}
                  onChange={(e) => setEditPartnerUser({...editPartnerUser, fullName: e.target.value})}
                  placeholder="Skriv fullt navn"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid var(--gray-300)',
                    borderRadius: 'var(--radius-lg)',
                    outline: 'none'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: 'var(--gray-700)' }}>
                  E-post *
                </label>
                <input
                  type="email"
                  value={editPartnerUser.email}
                  onChange={(e) => setEditPartnerUser({...editPartnerUser, email: e.target.value})}
                  placeholder="bruker@email.com"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid var(--gray-300)',
                    borderRadius: 'var(--radius-lg)',
                    outline: 'none'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: 'var(--gray-700)' }}>
                  Rolle
                </label>
                <select
                  value={editPartnerUser.role}
                  onChange={(e) => setEditPartnerUser({...editPartnerUser, role: e.target.value as 'user' | 'admin'})}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid var(--gray-300)',
                    borderRadius: 'var(--radius-lg)',
                    outline: 'none'
                  }}
                >
                  <option value="user">Bruker</option>
                  <option value="admin">Administrator</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
                <button
                  onClick={() => setShowEditUserModal(false)}
                  style={{
                    padding: '0.75rem 1.5rem',
                    border: '1px solid var(--gray-300)',
                    borderRadius: 'var(--radius-lg)',
                    background: 'white',
                    cursor: 'pointer'
                  }}
                >
                  Avbryt
                </button>
                <button
                  onClick={handleEditPartnerUser}
                  disabled={loading}
                  style={{
                    padding: '0.75rem 1.5rem',
                    border: 'none',
                    borderRadius: 'var(--radius-lg)',
                    background: loading ? 'var(--gray-400)' : 'var(--primary)',
                    color: 'white',
                    cursor: loading ? 'not-allowed' : 'pointer'
                  }}
                >
                  {loading ? 'Oppdaterer...' : 'Oppdater bruker'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete User Confirmation Modal */}
      {showDeleteUserModal && selectedUser && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'white',
            borderRadius: 'var(--radius-lg)',
            padding: '2rem',
            maxWidth: '500px',
            width: '95%',
            maxHeight: '95vh',
            overflow: 'auto'
          }}>
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
              <div style={{
                width: '64px',
                height: '64px',
                background: '#fef2f2',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1rem'
              }}>
                <AlertTriangle style={{ width: '32px', height: '32px', color: '#dc2626' }} />
              </div>
              <h2 style={{ fontSize: 'var(--font-size-xl)', fontWeight: '600', color: 'var(--gray-900)', marginBottom: '0.5rem' }}>
                Slett bruker
              </h2>
              <p style={{ color: 'var(--gray-600)' }}>
                Er du sikker på at du vil slette brukeren <strong>{selectedUser.fullName}</strong>?
              </p>
              <p style={{ color: 'var(--gray-500)', fontSize: 'var(--font-size-sm)', marginTop: '0.5rem' }}>
                Denne handlingen kan ikke angres.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <button
                onClick={() => setShowDeleteUserModal(false)}
                style={{
                  padding: '0.75rem 1.5rem',
                  border: '1px solid var(--gray-300)',
                  borderRadius: 'var(--radius-lg)',
                  background: 'white',
                  cursor: 'pointer'
                }}
              >
                Avbryt
              </button>
              <button
                onClick={handleDeletePartnerUser}
                disabled={loading}
                style={{
                  padding: '0.75rem 1.5rem',
                  border: 'none',
                  borderRadius: 'var(--radius-lg)',
                  background: loading ? 'var(--gray-400)' : '#dc2626',
                  color: 'white',
                  cursor: loading ? 'not-allowed' : 'pointer'
                }}
              >
                {loading ? 'Sletter...' : 'Ja, slett bruker'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {showResetPasswordModal && selectedUser && (
        <div style={{ 
          position: 'fixed', 
          top: 0, 
          left: 0, 
          right: 0, 
          bottom: 0, 
          background: 'rgba(0, 0, 0, 0.5)', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'white',
            borderRadius: 'var(--radius-lg)',
            padding: '2rem',
            maxWidth: '500px',
            width: '95%',
            maxHeight: '95vh',
            overflow: 'auto'
          }}>
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
              <div style={{
                width: '64px',
                height: '64px',
                background: '#eff6ff',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1rem'
              }}>
                <Key style={{ width: '32px', height: '32px', color: '#2563eb' }} />
              </div>
              <h2 style={{ fontSize: 'var(--font-size-xl)', fontWeight: '600', color: 'var(--gray-900)', marginBottom: '0.5rem' }}>
                Tilbakestill passord
              </h2>
              <p style={{ color: 'var(--gray-600)' }}>
                Sett nytt passord for <strong>{selectedUser.fullName}</strong>
              </p>
            </div>

            <div style={{ display: 'grid', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: 'var(--gray-700)' }}>
                  Nytt passord *
                </label>
                <input
                  type="password"
                  value={resetPasswordData.newPassword}
                  onChange={(e) => setResetPasswordData({...resetPasswordData, newPassword: e.target.value})}
                  placeholder="Minst 6 tegn"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid var(--gray-300)',
                    borderRadius: 'var(--radius-lg)',
                    outline: 'none'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: 'var(--gray-700)' }}>
                  Bekreft nytt passord *
                </label>
                <input
                  type="password"
                  value={resetPasswordData.confirmPassword}
                  onChange={(e) => setResetPasswordData({...resetPasswordData, confirmPassword: e.target.value})}
                  placeholder="Skriv passordet igjen"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid var(--gray-300)',
                    borderRadius: 'var(--radius-lg)',
                    outline: 'none'
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
                <button
                  onClick={() => setShowResetPasswordModal(false)}
                  style={{
                    padding: '0.75rem 1.5rem',
                    border: '1px solid var(--gray-300)',
                    borderRadius: 'var(--radius-lg)',
                    background: 'white',
                    cursor: 'pointer'
                  }}
                >
                  Avbryt
                </button>
                <button
                  onClick={handleResetPassword}
                  disabled={loading}
                  style={{
                    padding: '0.75rem 1.5rem',
                    border: 'none',
                    borderRadius: 'var(--radius-lg)',
                    background: loading ? 'var(--gray-400)' : 'var(--primary)',
                    color: 'white',
                    cursor: loading ? 'not-allowed' : 'pointer'
                  }}
                >
                  {loading ? 'Tilbakestiller...' : 'Tilbakestill passord'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Partner Detail Modal */}
      {showDetailModal && selectedPartner && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'white',
            borderRadius: 'var(--radius-lg)',
            padding: '2rem',
            maxWidth: '800px',
            width: '95%',
            maxHeight: '95vh',
            overflow: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
              <h2 style={{ fontSize: 'var(--font-size-xl)', fontWeight: '600', color: 'var(--gray-900)' }}>
                {selectedPartner.name}
              </h2>
              <button
                onClick={() => setShowDetailModal(false)}
                style={{ 
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '0.5rem'
                }}
              >
                <X style={{ width: '20px', height: '20px', color: 'var(--gray-400)' }} />
              </button>
            </div>

            <div style={{ display: 'grid', gap: '2rem' }}>
              {/* Company Information */}
              <div>
                <h3 style={{ fontSize: 'var(--font-size-lg)', fontWeight: '600', color: 'var(--gray-800)', marginBottom: '1rem' }}>
                  Bedriftsinformasjon
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
                  <div>
                    <label style={{ fontSize: '0.875rem', color: 'var(--gray-600)', marginBottom: '0.25rem', display: 'block' }}>
                      Bedriftstype
                    </label>
                    <p style={{ fontSize: '1rem', color: 'var(--gray-900)', fontWeight: '500' }}>
                      {selectedPartner.type === 'supplier' && 'Leverandør'}
                      {selectedPartner.type === 'customer' && 'Kunde'}
                      {selectedPartner.type === 'vendor' && 'Selger'}
                      {selectedPartner.type === 'consultant' && 'Konsulent'}
                    </p>
                  </div>
                  
                  <div>
                    <label style={{ fontSize: '0.875rem', color: 'var(--gray-600)', marginBottom: '0.25rem', display: 'block' }}>
                      Status
                    </label>
                    <p style={{ fontSize: '1rem', color: 'var(--gray-900)', fontWeight: '500' }}>
                      {selectedPartner.status === 'active' && 'Aktiv'}
                      {selectedPartner.status === 'inactive' && 'Inaktiv'}
                      {selectedPartner.status === 'pending' && 'Ventende'}
                    </p>
                  </div>

                  <div>
                    <label style={{ fontSize: '0.875rem', color: 'var(--gray-600)', marginBottom: '0.25rem', display: 'block' }}>
                      Organisasjonsnummer
                    </label>
                    <p style={{ fontSize: '1rem', color: 'var(--gray-900)', fontWeight: '500' }}>
                      {selectedPartner.orgNumber || 'Ikke registrert'}
                    </p>
                  </div>

                  <div>
                    <label style={{ fontSize: '0.875rem', color: 'var(--gray-600)', marginBottom: '0.25rem', display: 'block' }}>
                      MVA-nummer
                    </label>
                    <p style={{ fontSize: '1rem', color: 'var(--gray-900)', fontWeight: '500' }}>
                      {selectedPartner.vatNumber || 'Ikke registrert'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div>
                <h3 style={{ fontSize: 'var(--font-size-lg)', fontWeight: '600', color: 'var(--gray-800)', marginBottom: '1rem' }}>
                  Kontaktinformasjon
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
                  <div>
                    <label style={{ fontSize: '0.875rem', color: 'var(--gray-600)', marginBottom: '0.25rem', display: 'block' }}>
                      Kontaktperson
                    </label>
                    <p style={{ fontSize: '1rem', color: 'var(--gray-900)', fontWeight: '500' }}>
                      {selectedPartner.contactPerson.name}
                    </p>
                  </div>

                  <div>
                    <label style={{ fontSize: '0.875rem', color: 'var(--gray-600)', marginBottom: '0.25rem', display: 'block' }}>
                      E-post
                    </label>
                    <p style={{ fontSize: '1rem', color: 'var(--gray-900)', fontWeight: '500' }}>
                      {selectedPartner.contactPerson.email}
                    </p>
                  </div>

                  <div>
                    <label style={{ fontSize: '0.875rem', color: 'var(--gray-600)', marginBottom: '0.25rem', display: 'block' }}>
                      Telefon
                    </label>
                    <p style={{ fontSize: '1rem', color: 'var(--gray-900)', fontWeight: '500' }}>
                      {selectedPartner.contactPerson.phone}
                    </p>
                  </div>

                  <div>
                    <label style={{ fontSize: '0.875rem', color: 'var(--gray-600)', marginBottom: '0.25rem', display: 'block' }}>
                      Stilling
                    </label>
                    <p style={{ fontSize: '1rem', color: 'var(--gray-900)', fontWeight: '500' }}>
                      {selectedPartner.contactPerson.position}
                    </p>
                  </div>
                </div>
              </div>

              {/* Address */}
              <div>
                <h3 style={{ fontSize: 'var(--font-size-lg)', fontWeight: '600', color: 'var(--gray-800)', marginBottom: '1rem' }}>
                  Adresse
                </h3>
                <p style={{ fontSize: '1rem', color: 'var(--gray-900)' }}>
                  {selectedPartner.address.street}<br />
                  {selectedPartner.address.postalCode} {selectedPartner.address.city}<br />
                  {selectedPartner.address.country}
                </p>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', paddingTop: '1rem', borderTop: '1px solid var(--gray-200)' }}>
                <button
                  onClick={() => {
                    setShowDetailModal(false);
                    setShowCreateUserModal(true);
                  }}
                  style={{
                    padding: '0.75rem 1.5rem',
                    background: 'var(--primary)',
                    color: 'white',
                    border: 'none',
                    borderRadius: 'var(--radius-lg)',
                    cursor: 'pointer',
                    fontWeight: '500',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}
                >
                  <User style={{ width: '16px', height: '16px' }} />
                  Opprett bruker
                </button>
                
                <button
                  onClick={() => setShowDetailModal(false)}
                  style={{
                    padding: '0.75rem 1.5rem',
                    border: '1px solid var(--gray-300)',
                    borderRadius: 'var(--radius-lg)',
                    background: 'white',
                  cursor: 'pointer'
                }}
              >
                  Lukk
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Partner User Modal */}
      {showCreateUserModal && selectedPartner && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'white',
            borderRadius: 'var(--radius-lg)',
            padding: '2rem',
            maxWidth: '500px',
            width: '95%',
            maxHeight: '95vh',
            overflow: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
              <h2 style={{ fontSize: 'var(--font-size-xl)', fontWeight: '600', color: 'var(--gray-900)' }}>
                Opprett bruker for {selectedPartner.name}
              </h2>
              <button
                onClick={() => setShowCreateUserModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '0.5rem'
                }}
              >
                <X style={{ width: '20px', height: '20px', color: 'var(--gray-400)' }} />
              </button>
            </div>

            <div style={{ display: 'grid', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: 'var(--gray-700)' }}>
                  Fullt navn *
                </label>
                <input
                  type="text"
                  value={newPartnerUser.fullName}
                  onChange={(e) => setNewPartnerUser({...newPartnerUser, fullName: e.target.value})}
                  placeholder="Skriv fullt navn"
                  style={{ 
                    width: '100%', 
                    padding: '0.75rem', 
                    border: '1px solid var(--gray-300)', 
                    borderRadius: 'var(--radius-lg)', 
                    outline: 'none'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: 'var(--gray-700)' }}>
                  E-post *
                </label>
                <input
                  type="email"
                  value={newPartnerUser.email}
                  onChange={(e) => setNewPartnerUser({...newPartnerUser, email: e.target.value})}
                  placeholder="bruker@email.com"
                  style={{ 
                    width: '100%', 
                    padding: '0.75rem', 
                    border: '1px solid var(--gray-300)', 
                    borderRadius: 'var(--radius-lg)', 
                    outline: 'none'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: 'var(--gray-700)' }}>
                  Telefonnummer (for SMS-varsler)
                </label>
                <input
                  type="tel"
                  value={newPartnerUser.phoneNumber}
                  onChange={(e) => setNewPartnerUser({...newPartnerUser, phoneNumber: e.target.value})}
                  placeholder="+47 123 45 678"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid var(--gray-300)',
                    borderRadius: 'var(--radius-lg)',
                    outline: 'none'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: 'var(--gray-700)' }}>
                  Passord *
                </label>
                <input
                  type="password"
                  value={newPartnerUser.password}
                  onChange={(e) => setNewPartnerUser({...newPartnerUser, password: e.target.value})}
                  placeholder="Minst 6 tegn"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid var(--gray-300)',
                    borderRadius: 'var(--radius-lg)',
                    outline: 'none'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: 'var(--gray-700)' }}>
                  Bekreft passord *
                </label>
                <input
                  type="password"
                  value={newPartnerUser.confirmPassword}
                  onChange={(e) => setNewPartnerUser({...newPartnerUser, confirmPassword: e.target.value})}
                  placeholder="Skriv passordet igjen"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid var(--gray-300)',
                    borderRadius: 'var(--radius-lg)',
                    outline: 'none'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: 'var(--gray-700)' }}>
                  Rolle
                </label>
                <select
                  value={newPartnerUser.role}
                  onChange={(e) => setNewPartnerUser({...newPartnerUser, role: e.target.value as 'user' | 'admin'})}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid var(--gray-300)',
                    borderRadius: 'var(--radius-lg)',
                    outline: 'none'
                  }}
                >
                  <option value="user">Bruker</option>
                  <option value="admin">Administrator</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
                <button
                  onClick={() => setShowCreateUserModal(false)}
                  style={{
                    padding: '0.75rem 1.5rem',
                    border: '1px solid var(--gray-300)',
                    borderRadius: 'var(--radius-lg)',
                    background: 'white',
                    cursor: 'pointer'
                  }}
                >
                  Avbryt
                </button>
                <button
                  onClick={handleCreatePartnerUser}
                  disabled={loading}
                  style={{
                    padding: '0.75rem 1.5rem',
                    border: 'none',
                    borderRadius: 'var(--radius-lg)',
                    background: loading ? 'var(--gray-400)' : 'var(--primary)',
                    color: 'white',
                    cursor: loading ? 'not-allowed' : 'pointer'
                  }}
                >
                  {loading ? 'Oppretter...' : 'Opprett bruker'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Partner Modal */}
      {showAddModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'white',
            borderRadius: 'var(--radius-lg)',
            padding: '2rem',
            maxWidth: '800px',
            width: '95%',
            maxHeight: '95vh',
            overflow: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
              <h2 style={{ fontSize: 'var(--font-size-xl)', fontWeight: '600', color: 'var(--gray-900)' }}>
                Legg til ny samarbeidspartner
              </h2>
              <button
                onClick={() => setShowAddModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '0.5rem'
                }}
              >
                <X style={{ width: '20px', height: '20px', color: 'var(--gray-400)' }} />
              </button>
            </div>

            <div style={{ display: 'grid', gap: '1.5rem' }}>
              {/* BRRG Search Section */}
              <div style={{ 
                background: 'var(--gray-50)', 
                padding: '1rem', 
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--gray-200)'
              }}>
                <h3 style={{ fontSize: 'var(--font-size-lg)', fontWeight: '600', marginBottom: '1rem' }}>
                  🔍 Søk i BRRG.no
                </h3>
                <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                  <input
                    type="text"
                    value={brrgSearchQuery}
                    onChange={(e) => setBrrgSearchQuery(e.target.value)}
                    placeholder="Søk etter bedriftsnavn eller org.nummer"
                    style={{
                      flex: 1,
                      padding: '0.75rem',
                      border: '1px solid var(--gray-300)',
                      borderRadius: 'var(--radius-lg)',
                      outline: 'none'
                    }}
                  />
                  <button
                    onClick={handleBRRGSearch}
                    disabled={brrgSearchLoading}
                    style={{
                      padding: '0.75rem 1.5rem',
                      background: 'var(--primary)',
                      color: 'white',
                      border: 'none',
                      borderRadius: 'var(--radius-lg)',
                      cursor: brrgSearchLoading ? 'not-allowed' : 'pointer',
                      opacity: brrgSearchLoading ? 0.7 : 1
                    }}
                  >
                    {brrgSearchLoading ? 'Søker...' : 'Søk'}
                  </button>
                </div>
                
                {brrgSearchResults.length > 0 && (
                  <div style={{ marginTop: '1rem' }}>
                    <h4 style={{ fontSize: 'var(--font-size-base)', fontWeight: '600', marginBottom: '0.5rem' }}>
                      Søkeresultater:
                    </h4>
                    {brrgSearchResults.map((result, index) => (
                      <div
                        key={index}
                        onClick={() => handleBRRGSelect(result)}
                        style={{
                          padding: '0.75rem',
                          border: '1px solid var(--gray-200)',
                          borderRadius: 'var(--radius-md)',
                          cursor: 'pointer',
                          marginBottom: '0.5rem',
                          background: 'white',
                          transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = 'var(--gray-100)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'white';
                        }}
                      >
                        <div style={{ fontWeight: '600', marginBottom: '0.25rem' }}>
                          {result.companyName || result.name}
                        </div>
                        <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--gray-600)' }}>
                          Org.nr: {result.orgNumber} • {result.address}, {result.postalCode} {result.city}
                        </div>
                        <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--gray-500)' }}>
                          {result.industry} • {result.employees || 'Ukjent'} ansatte
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Basic Information */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: 'var(--gray-700)' }}>
                    Bedriftsnavn *
                  </label>
                  <input
                    type="text"
                    value={newPartner.name}
                    onChange={(e) => setNewPartner({...newPartner, name: e.target.value})}
                    placeholder="Bedriftsnavn"
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid var(--gray-300)',
                      borderRadius: 'var(--radius-lg)',
                      outline: 'none'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: 'var(--gray-700)' }}>
                    Type
                  </label>
                  <select
                    value={newPartner.type}
                    onChange={(e) => setNewPartner({...newPartner, type: e.target.value as any})}
                    style={{ 
                      width: '100%', 
                      padding: '0.75rem', 
                      border: '1px solid var(--gray-300)', 
                      borderRadius: 'var(--radius-lg)', 
                      outline: 'none'
                    }}
                  >
                    <option value="supplier">Leverandør</option>
                    <option value="customer">Kunde</option>
                    <option value="vendor">Selger</option>
                    <option value="consultant">Konsulent</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: 'var(--gray-700)' }}>
                    Organisasjonsnummer
                  </label>
                  <input
                    type="text"
                    value={newPartner.orgNumber}
                    onChange={(e) => setNewPartner({...newPartner, orgNumber: e.target.value})}
                    placeholder="123 456 789"
                    style={{ 
                      width: '100%', 
                      padding: '0.75rem', 
                      border: '1px solid var(--gray-300)', 
                      borderRadius: 'var(--radius-lg)', 
                      outline: 'none'
                    }}
                  />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: 'var(--gray-700)' }}>
                    MVA-nummer
                </label>
                <input
                  type="text"
                    value={newPartner.vatNumber}
                    onChange={(e) => setNewPartner({...newPartner, vatNumber: e.target.value})}
                    placeholder="MVA 123 456 789"
                  style={{ 
                    width: '100%', 
                    padding: '0.75rem', 
                    border: '1px solid var(--gray-300)', 
                    borderRadius: 'var(--radius-lg)', 
                    outline: 'none'
                  }}
                />
                </div>
              </div>

              {/* Description */}
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: 'var(--gray-700)' }}>
                  Beskrivelse
                </label>
                <textarea
                  value={newPartner.description}
                  onChange={(e) => setNewPartner({...newPartner, description: e.target.value})}
                  placeholder="Beskriv samarbeidspartneren..."
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid var(--gray-300)',
                    borderRadius: 'var(--radius-lg)',
                    outline: 'none',
                    resize: 'vertical'
                  }}
                />
              </div>

              {/* Contact Person */}
              <div>
                <h3 style={{ fontSize: 'var(--font-size-lg)', fontWeight: '600', marginBottom: '1rem' }}>
                  Kontaktperson
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: 'var(--gray-700)' }}>
                      Navn
                </label>
                <input
                  type="text"
                  value={newPartner.contactPerson.name}
                  onChange={(e) => setNewPartner({
                    ...newPartner, 
                    contactPerson: {...newPartner.contactPerson, name: e.target.value}
                  })}
                      placeholder="Kontaktperson navn"
                  style={{ 
                    width: '100%', 
                    padding: '0.75rem', 
                    border: '1px solid var(--gray-300)', 
                    borderRadius: 'var(--radius-lg)', 
                    outline: 'none'
                  }}
                />
              </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: 'var(--gray-700)' }}>
                    E-post
                  </label>
                  <input
                    type="email"
                    value={newPartner.contactPerson.email}
                    onChange={(e) => setNewPartner({
                      ...newPartner, 
                      contactPerson: {...newPartner.contactPerson, email: e.target.value}
                    })}
                      placeholder="kontakt@bedrift.no"
                    style={{ 
                      width: '100%', 
                      padding: '0.75rem', 
                      border: '1px solid var(--gray-300)', 
                      borderRadius: 'var(--radius-lg)', 
                      outline: 'none'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: 'var(--gray-700)' }}>
                    Telefon
                  </label>
                  <input
                    type="tel"
                    value={newPartner.contactPerson.phone}
                    onChange={(e) => setNewPartner({
                      ...newPartner, 
                      contactPerson: {...newPartner.contactPerson, phone: e.target.value}
                    })}
                      placeholder="+47 123 45 678"
                    style={{ 
                      width: '100%', 
                      padding: '0.75rem', 
                      border: '1px solid var(--gray-300)', 
                      borderRadius: 'var(--radius-lg)', 
                      outline: 'none'
                    }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: 'var(--gray-700)' }}>
                      Stilling
                    </label>
                    <input
                      type="text"
                      value={newPartner.contactPerson.position}
                      onChange={(e) => setNewPartner({
                        ...newPartner, 
                        contactPerson: {...newPartner.contactPerson, position: e.target.value}
                      })}
                      placeholder="Stilling"
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid var(--gray-300)',
                        borderRadius: 'var(--radius-lg)',
                        outline: 'none'
                      }}
                  />
                </div>
              </div>
            </div>

              {/* Address */}
              <div>
                <h3 style={{ fontSize: 'var(--font-size-lg)', fontWeight: '600', marginBottom: '1rem' }}>
                  Adresse
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: 'var(--gray-700)' }}>
                      Gate
                    </label>
                    <input
                      type="text"
                      value={newPartner.address.street}
                      onChange={(e) => setNewPartner({
                        ...newPartner, 
                        address: {...newPartner.address, street: e.target.value}
                      })}
                      placeholder="Gateadresse"
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid var(--gray-300)',
                        borderRadius: 'var(--radius-lg)',
                        outline: 'none'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: 'var(--gray-700)' }}>
                      Postnummer
                    </label>
                    <input
                      type="text"
                      value={newPartner.address.postalCode}
                      onChange={(e) => setNewPartner({
                        ...newPartner, 
                        address: {...newPartner.address, postalCode: e.target.value}
                      })}
                      placeholder="0001"
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid var(--gray-300)',
                        borderRadius: 'var(--radius-lg)',
                        outline: 'none'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: 'var(--gray-700)' }}>
                      By
                    </label>
                    <input
                      type="text"
                      value={newPartner.address.city}
                      onChange={(e) => setNewPartner({
                        ...newPartner, 
                        address: {...newPartner.address, city: e.target.value}
                      })}
                      placeholder="Oslo"
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid var(--gray-300)',
                        borderRadius: 'var(--radius-lg)',
                        outline: 'none'
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* File Upload */}
              <div>
                <h3 style={{ fontSize: 'var(--font-size-lg)', fontWeight: '600', marginBottom: '1rem' }}>
                  📎 Last opp dokumenter
                </h3>
                <div style={{ 
                  border: '2px dashed var(--gray-300)', 
                  borderRadius: 'var(--radius-lg)', 
                  padding: '2rem',
                  textAlign: 'center',
                  background: 'var(--gray-50)'
                }}>
                  <input
                    type="file"
                    multiple
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.txt"
                    onChange={handleFileSelect}
                    style={{ display: 'none' }}
                    id="file-upload"
                  />
                  <label
                    htmlFor="file-upload"
                    style={{
                      cursor: 'pointer',
                      color: 'var(--primary)',
                      fontWeight: '600'
                    }}
                  >
                    📁 Klikk for å velge filer
                  </label>
                  <p style={{ marginTop: '0.5rem', color: 'var(--gray-600)', fontSize: 'var(--font-size-sm)' }}>
                    Støtter PDF, Word, bilder og tekstfiler
                  </p>
                </div>

                {selectedFiles.length > 0 && (
                  <div style={{ marginTop: '1rem' }}>
                    <h4 style={{ fontSize: 'var(--font-size-base)', fontWeight: '600', marginBottom: '0.5rem' }}>
                      Valgte filer ({selectedFiles.length}):
                    </h4>
                    {selectedFiles.map((file, index) => (
                      <div key={index} style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0.75rem',
                        background: 'white',
                        border: '1px solid var(--gray-200)',
                        borderRadius: 'var(--radius-md)',
                        marginBottom: '0.5rem'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <FileText style={{ width: '16px', height: '16px', color: 'var(--gray-500)' }} />
                          <span style={{ fontSize: 'var(--font-size-sm)' }}>{file.name}</span>
                          <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--gray-500)' }}>
                            ({(file.size / 1024 / 1024).toFixed(2)} MB)
                          </span>
                        </div>
                        <button
                          onClick={() => handleFileRemove(index)}
                          style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            color: 'var(--red-500)',
                            padding: '0.25rem'
                          }}
                        >
                          <X style={{ width: '16px', height: '16px' }} />
                        </button>
                      </div>
                    ))}
                    
                    <button
                      onClick={handleFileUpload}
                      disabled={loading}
                      style={{
                        padding: '0.75rem 1.5rem',
                        background: 'var(--primary)',
                        color: 'white',
                        border: 'none',
                        borderRadius: 'var(--radius-lg)',
                        cursor: loading ? 'not-allowed' : 'pointer',
                        marginTop: '1rem'
                      }}
                    >
                      {loading ? 'Laster opp...' : 'Last opp filer'}
                    </button>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
              <button
                onClick={() => setShowAddModal(false)}
                style={{ 
                  padding: '0.75rem 1.5rem', 
                  border: '1px solid var(--gray-300)', 
                  borderRadius: 'var(--radius-lg)', 
                    background: 'white',
                  cursor: 'pointer'
                }}
              >
                Avbryt
              </button>
              <button
                onClick={handleCreatePartner}
                  disabled={loading || !newPartner.name.trim()}
                  style={{
                    padding: '0.75rem 1.5rem',
                    border: 'none',
                    borderRadius: 'var(--radius-lg)',
                    background: loading || !newPartner.name.trim() ? 'var(--gray-400)' : 'var(--primary)',
                    color: 'white',
                    cursor: loading || !newPartner.name.trim() ? 'not-allowed' : 'pointer'
                  }}
                >
                  {loading ? 'Oppretter...' : 'Opprett partner'}
              </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Assignment Modal */}
      {showAssignmentModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'white',
            borderRadius: 'var(--radius-lg)',
            padding: '2rem',
            maxWidth: '600px',
            width: '95%',
            maxHeight: '95vh',
            overflow: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h2 style={{ fontSize: 'var(--font-size-xl)', fontWeight: '600', color: 'var(--gray-900)' }}>
                {newAssignment.id ? 'Rediger oppdrag' : 'Nytt oppdrag'}
                </h2>
              <button
                onClick={() => setShowAssignmentModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '0.5rem'
                }}
              >
                <X style={{ width: '20px', height: '20px', color: 'var(--gray-400)' }} />
              </button>
            </div>

            <div style={{ display: 'grid', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: 'var(--gray-700)' }}>
                  Tittel *
                </label>
                <select
                  value={newAssignment.title}
                  onChange={(e) => setNewAssignment({...newAssignment, title: e.target.value})}
                  style={{ 
                    width: '100%', 
                    padding: '0.75rem', 
                    border: '1px solid var(--gray-300)', 
                    borderRadius: 'var(--radius-lg)', 
                    outline: 'none'
                  }}
                >
                  <option value="">Velg oppdragstype</option>
                  <option value="Dagrute - Oslo">Dagrute - Oslo</option>
                  <option value="Dagrute - Hønefoss">Dagrute - Hønefoss</option>
                  <option value="Dagrute - Kongsvinger">Dagrute - Kongsvinger</option>
                  <option value="Dagrute - Ski">Dagrute - Ski</option>
                  <option value="Dagrute - Drammen">Dagrute - Drammen</option>
                  <option value="Dagrute - Jessheim">Dagrute - Jessheim</option>
                  <option value="Dagrute - Indre">Dagrute - Indre</option>
                  <option value="Dagrute - Nesodden">Dagrute - Nesodden</option>
                  <option value="Dagrute - Bærum">Dagrute - Bærum</option>
                  <option value="Dagrute - Nittedal">Dagrute - Nittedal</option>
                  <option value="Dagrute - Østfold">Dagrute - Østfold</option>
                  <option value="Dagrute - Hadeland">Dagrute - Hadeland</option>
                  <option value="Kveldsrute - Oslo">Kveldsrute - Oslo</option>
                  <option value="Kveldsrute - Jessheim">Kveldsrute - Jessheim</option>
                  <option value="Kveldsrute - Nittedal">Kveldsrute - Nittedal</option>
                  <option value="Kveldsrute - Nesodden">Kveldsrute - Nesodden</option>
                  <option value="Kveldsrute - Indre">Kveldsrute - Indre</option>
                  <option value="Kveldsrute - Østfold">Kveldsrute - Østfold</option>
                  <option value="Kveldsrute - Bærum">Kveldsrute - Bærum</option>
                  <option value="Kveldsrute - Drammen">Kveldsrute - Drammen</option>
                  <option value="Kveldsrute - Hønefoss">Kveldsrute - Hønefoss</option>
                  <option value="Kveldsrute - Ski">Kveldsrute - Ski</option>
                  <option value="Kveldsrute - Kongsvinger">Kveldsrute - Kongsvinger</option>
                  <option value="Kveldsrute - Hadeland">Kveldsrute - Hadeland</option>
                  <option value="Dobbel">Dobbel</option>
                  <option value="Intern">Intern</option>
                  <option value="LEDIG HELE DAG">LEDIG HELE DAG</option>
                  <option value="LEDIG DAG">LEDIG DAG</option>
                  <option value="LEDIG KVELD">LEDIG KVELD</option>
                  <option value="Fri">Fri</option>
                  <option value="Syk">Syk</option>
                  <option value="Gitt bort">Gitt bort</option>
                  <option value="Geilo">Geilo</option>
                  <option value="ADAM">ADAM</option>
                  <option value="DAWID">DAWID</option>
                </select>
              </div>

                  <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: 'var(--gray-700)' }}>
                  Beskrivelse
                </label>
                <textarea
                  value={newAssignment.description}
                  onChange={(e) => setNewAssignment({...newAssignment, description: e.target.value})}
                  style={{ 
                    width: '100%', 
                    padding: '0.75rem', 
                    border: '1px solid var(--gray-300)', 
                    borderRadius: 'var(--radius-lg)', 
                    outline: 'none',
                    minHeight: '80px',
                    resize: 'vertical'
                  }}
                  placeholder="Beskrivelse av oppdraget"
                />
                  </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: 'var(--gray-700)' }}>
                    Startdato *
                  </label>
                  <input
                    type="date"
                    value={newAssignment.startDate}
                    onChange={(e) => setNewAssignment({...newAssignment, startDate: e.target.value})}
                    style={{ 
                      width: '100%', 
                      padding: '0.75rem', 
                      border: '1px solid var(--gray-300)', 
                      borderRadius: 'var(--radius-lg)', 
                      outline: 'none'
                    }}
                  />
                  </div>

                  <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: 'var(--gray-700)' }}>
                    Sluttdato
                  </label>
                  <input
                    type="date"
                    value={newAssignment.endDate}
                    onChange={(e) => setNewAssignment({...newAssignment, endDate: e.target.value})}
                    style={{ 
                      width: '100%', 
                      padding: '0.75rem', 
                      border: '1px solid var(--gray-300)', 
                      borderRadius: 'var(--radius-lg)', 
                      outline: 'none'
                    }}
                  />
                  </div>
                  </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: 'var(--gray-700)' }}>
                    Starttid *
                  </label>
                  <input
                    type="time"
                    value={newAssignment.startTime}
                    onChange={(e) => setNewAssignment({...newAssignment, startTime: e.target.value})}
                    style={{ 
                      width: '100%', 
                      padding: '0.75rem', 
                      border: '1px solid var(--gray-300)', 
                      borderRadius: 'var(--radius-lg)', 
                      outline: 'none'
                    }}
                  />
                    </div>

                    <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: 'var(--gray-700)' }}>
                    Sluttid
                  </label>
                  <input
                    type="time"
                    value={newAssignment.endTime}
                    onChange={(e) => setNewAssignment({...newAssignment, endTime: e.target.value})}
                    style={{ 
                      width: '100%', 
                      padding: '0.75rem', 
                      border: '1px solid var(--gray-300)', 
                      borderRadius: 'var(--radius-lg)', 
                      outline: 'none'
                    }}
                  />
                    </div>
                </div>

                  <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: 'var(--gray-700)' }}>
                  Lokasjon
                </label>
                <input
                  type="text"
                  value={newAssignment.location}
                  onChange={(e) => setNewAssignment({...newAssignment, location: e.target.value})}
                  style={{ 
                    width: '100%', 
                    padding: '0.75rem', 
                    border: '1px solid var(--gray-300)', 
                    borderRadius: 'var(--radius-lg)', 
                    outline: 'none'
                  }}
                  placeholder="Lokasjon for oppdraget"
                />
                  </div>

                  <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: 'var(--gray-700)' }}>
                  PDF-filer
                </label>
                <div style={{
                  border: '2px dashed var(--gray-300)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '2rem',
                  textAlign: 'center',
                  cursor: 'pointer',
                  transition: 'all var(--transition-normal)'
                }}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  // Handle file drop
                }}
                >
                  <Upload style={{ width: '32px', height: '32px', color: 'var(--gray-400)', marginBottom: '1rem' }} />
                  <p style={{ color: 'var(--gray-600)', marginBottom: '0.5rem' }}>
                    Dra og slipp PDF-filer hit, eller klikk for å velge
                  </p>
                  <input
                    type="file"
                    multiple
                    accept=".pdf"
                    onChange={(e) => {
                      const files = Array.from(e.target.files || []);
                      // Handle file upload
                    }}
                    style={{ display: 'none' }}
                    id="pdf-upload"
                  />
                  <label htmlFor="pdf-upload" style={{
                    background: 'var(--primary)',
                    color: 'white',
                    padding: '0.5rem 1rem',
                    borderRadius: 'var(--radius-md)',
                    cursor: 'pointer',
                    display: 'inline-block'
                  }}>
                    Velg filer
                  </label>
                  </div>
                  </div>

                  <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: 'var(--gray-700)' }}>
                  Notater
                </label>
                <textarea
                  value={newAssignment.notes}
                  onChange={(e) => setNewAssignment({...newAssignment, notes: e.target.value})}
                  style={{ 
                    width: '100%', 
                    padding: '0.75rem', 
                    border: '1px solid var(--gray-300)', 
                    borderRadius: 'var(--radius-lg)', 
                    outline: 'none',
                    minHeight: '80px',
                    resize: 'vertical'
                  }}
                  placeholder="Ekstra notater om oppdraget"
                />
              </div>

              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
                <button
                  onClick={() => setShowAssignmentModal(false)}
                  style={{
                    padding: '0.75rem 1.5rem',
                    border: '1px solid var(--gray-300)',
                    borderRadius: 'var(--radius-lg)',
                    background: 'white',
                    cursor: 'pointer'
                  }}
                >
                  Avbryt
                </button>
                <button
                  onClick={async () => {
                    // Handle save assignment
                    if (newAssignment.title && newAssignment.startDate && newAssignment.startTime && newAssignment.partnerId) {
                      const partner = partners.find(p => p.id === newAssignment.partnerId);
                      const newAssignmentData: PartnerAssignment = {
                        id: Date.now().toString(),
                        partnerId: newAssignment.partnerId,
                        partnerName: partner?.name || 'Ukjent partner',
                        title: newAssignment.title,
                        description: newAssignment.description || '',
                        startDate: newAssignment.startDate,
                        endDate: newAssignment.endDate || newAssignment.startDate,
                        startTime: newAssignment.startTime,
                        endTime: newAssignment.endTime || newAssignment.startTime,
                        location: newAssignment.location || '',
                        type: 'delivery', // Default type
                        status: 'pending',
                        assignedBy: userProfile?.id || 'admin',
                        assignedTo: newAssignment.assignedTo || '',
                        hourlyRate: newAssignment.hourlyRate || 0,
                        totalHours: 0,
                        notes: newAssignment.notes || '',
                        attachments: [],
                        pdfFiles: newAssignment.pdfFiles || [],
                        emailSent: false,
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString()
                      };
                      
                      setAssignments([...assignments, newAssignmentData]);
                      setShowAssignmentModal(false);
                      setSuccess(`Oppdrag "${newAssignment.title}" lagt til for ${partner?.name}`);
                      
                      // Send SMS notification to partner users
                      try {
                        const partnerUsers = await firebaseService.getPartnerUsers(userProfile?.companyId || '', newAssignment.partnerId);
                        const partner = partners.find(p => p.id === newAssignment.partnerId);
                        
                        for (const user of partnerUsers) {
                          if (user.phoneNumber && sveveSMS.validatePhoneNumber(user.phoneNumber)) {
                            await sveveSMS.sendNewAssignment(
                              user.phoneNumber,
                              partner?.name || 'Ukjent partner',
                              newAssignment.title,
                              `${newAssignment.startDate} ${newAssignment.startTime}`
                            );
                          }
                        }
                      } catch (error) {
                        console.error('Failed to send SMS notifications:', error);
                        // Don't show error to user, SMS failure shouldn't break assignment creation
                      }
                      setNewAssignment({
                        title: '',
                        description: '',
                        startDate: '',
                        endDate: '',
                        startTime: '',
                        endTime: '',
                        location: '',
                        partnerId: '',
                        assignedTo: '',
                        hourlyRate: 0,
                        notes: '',
                        type: 'delivery',
                        pdfFiles: []
                      });
                    }
                  }}
                  style={{
                    padding: '0.75rem 1.5rem',
                    border: 'none',
                    borderRadius: 'var(--radius-lg)',
                    background: 'var(--primary)',
                    color: 'white',
                    cursor: 'pointer'
                  }}
                >
                  Lagre oppdrag
                </button>
                  </div>
                  </div>
                  </div>
                  </div>
      )}

      {/* Day Assignment Modal */}
      {showDayAssignmentModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'white',
            borderRadius: 'var(--radius-lg)',
            padding: '2rem',
            maxWidth: '500px',
            width: '95%',
            maxHeight: '95vh',
            overflow: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
              <h2 style={{ fontSize: 'var(--font-size-xl)', fontWeight: '600', color: 'var(--gray-900)' }}>
                Legg til oppdrag for {new Date(selectedDate).toLocaleDateString('no-NO')}
              </h2>
              <button
                onClick={() => setShowDayAssignmentModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '0.5rem'
                }}
              >
                <X style={{ width: '20px', height: '20px', color: 'var(--gray-400)' }} />
              </button>
                </div>

            <div style={{ display: 'grid', gap: '1rem' }}>
                  <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: 'var(--gray-700)' }}>
                  Samarbeidspartner
                </label>
                <select
                  value={selectedPartnerForAssignment}
                  onChange={(e) => setSelectedPartnerForAssignment(e.target.value)}
                  style={{ 
                    width: '100%', 
                    padding: '0.75rem', 
                    border: '1px solid var(--gray-300)', 
                    borderRadius: 'var(--radius-lg)', 
                    outline: 'none'
                  }}
                >
                  <option value="">Velg partner</option>
                  {partners.map(partner => (
                    <option key={partner.id} value={partner.id}>
                      {partner.name}
                    </option>
                  ))}
                </select>
            </div>

              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
              <button
                  onClick={() => setShowDayAssignmentModal(false)}
                style={{
                  padding: '0.75rem 1.5rem',
                  border: '1px solid var(--gray-300)',
                  borderRadius: 'var(--radius-lg)',
                    background: 'white',
                  cursor: 'pointer'
                }}
              >
                  Avbryt
              </button>
              <button
                onClick={() => {
                    if (selectedPartnerForAssignment) {
                      setNewAssignment({
                        ...newAssignment,
                        startDate: selectedDate,
                        partnerId: selectedPartnerForAssignment
                      });
                      setShowDayAssignmentModal(false);
                      setShowAssignmentModal(true);
                    }
                  }}
                  style={{
                    padding: '0.75rem 1.5rem',
                    border: 'none',
                    borderRadius: 'var(--radius-lg)',
                    background: 'var(--primary)',
                    color: 'white',
                    cursor: 'pointer'
                  }}
                >
                  Fortsett
              </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
