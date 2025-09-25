'use client';

import React, { useState, useEffect } from 'react';
import { firebaseService, Partner } from '@/lib/firebase-services';
import { useAuth } from '@/contexts/AuthContext';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { brrgService } from '@/lib/brrg-service';
import { 
  Plus, 
  Search, 
  UserPlus, 
  Building2,
  Phone,
  Mail,
  MapPin,
  Users,
  FileUp,
  X,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  FileText,
  MoreHorizontal,
  Edit,
  ClipboardCheck,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';


export default function PartnersPage() {
  const { userProfile } = useAuth();
  const [partners, setPartners] = useState<Partner[]>([]);
  const [filteredPartners, setFilteredPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Partner creation
  const [showCreatePartnerModal, setShowCreatePartnerModal] = useState(false);
  const [newPartner, setNewPartner] = useState({
    name: '',
    description: '',
    type: 'supplier' as const,
    orgNumber: '',
    industry: '',
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
      position: ''
    }
  });
  
  // File upload state
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  
  // Vehicle state
  const [vehicles, setVehicles] = useState<Array<{
    registrationNumber: string;
    year: string;
    model: string;
    euroClass: string;
    payload: string;
  }>>([]);
  
  // Modal tabs
  const [activeTab, setActiveTab] = useState<'info' | 'vehicles' | 'files'>('info');
  
  // Routes/Routes tab state
  const [activeView, setActiveView] = useState<'partners' | 'routes' | 'audits'>('partners');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null);
  const [showFileShareModal, setShowFileShareModal] = useState(false);
  const [routeAssignments, setRouteAssignments] = useState<{[key: string]: any}>({});
  const [routeTitle, setRouteTitle] = useState('');
  const [selectedJob, setSelectedJob] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [availableUsers] = useState([
    'M18', '82', '83', '194', '195', '196', '197', '198', '199', '200'
  ]);

  // Job management
  const [showJobManagementModal, setShowJobManagementModal] = useState(false);
  const [jobs, setJobs] = useState<Array<{
    id: string;
    name: string;
    color: string;
    startTime: string;
    endTime: string;
    description: string;
  }>>([
    { id: '1', name: 'Kveldsrute - Hønefoss', color: '#ef4444', startTime: '18:00', endTime: '22:00', description: 'Kveldsrute til Hønefoss' },
    { id: '2', name: 'Fri Dagrute - Østfold', color: '#f97316', startTime: '08:00', endTime: '16:00', description: 'Fri dagrute til Østfold' },
    { id: '3', name: 'Gitt bort Dagrute - Ski', color: '#eab308', startTime: '07:30', endTime: '15:30', description: 'Gitt bort dagrute til Ski' },
    { id: '4', name: 'Syk Dagrute - Drammen', color: '#22c55e', startTime: '09:00', endTime: '17:00', description: 'Syk dagrute til Drammen' },
    { id: '5', name: 'Dagrute - Jessheim', color: '#06b6d4', startTime: '08:30', endTime: '16:30', description: 'Dagrute til Jessheim' },
    { id: '6', name: 'Indre Dagrute - Nesodden', color: '#3b82f6', startTime: '07:00', endTime: '15:00', description: 'Indre dagrute til Nesodden' },
    { id: '7', name: 'Dagrute - Bærum', color: '#8b5cf6', startTime: '08:00', endTime: '16:00', description: 'Dagrute til Bærum' },
    { id: '8', name: 'Dagrute - Nittedal', color: '#ec4899', startTime: '08:15', endTime: '16:15', description: 'Dagrute til Nittedal' },
    { id: '9', name: 'Geilo LEDIG DAG', color: '#6b7280', startTime: '00:00', endTime: '23:59', description: 'Geilo ledig dag' },
    { id: '10', name: 'LEDIG KVELD', color: '#9ca3af', startTime: '18:00', endTime: '23:59', description: 'Ledig kveld' },
    { id: '11', name: 'DAWID ADAM', color: '#10b981', startTime: '08:00', endTime: '16:00', description: 'Dawid Adam rute' },
    { id: '12', name: 'Dag-Hadeland', color: '#f59e0b', startTime: '07:30', endTime: '15:30', description: 'Dag rute til Hadeland' },
    { id: '13', name: 'Kveld-Hadeland', color: '#ef4444', startTime: '18:30', endTime: '22:30', description: 'Kveld rute til Hadeland' },
    { id: '14', name: 'KVELD-KONGSVINGER', color: '#dc2626', startTime: '19:00', endTime: '23:00', description: 'Kveld rute til Kongsvinger' }
  ]);
  const [editingJob, setEditingJob] = useState<{
    id: string;
    name: string;
    color: string;
    startTime: string;
    endTime: string;
    description: string;
  } | null>(null);

  // User creation and partner editing
  const [showCreateUserModal, setShowCreateUserModal] = useState(false);
  const [showEditPartnerModal, setShowEditPartnerModal] = useState(false);
  const [selectedPartnerForAction, setSelectedPartnerForAction] = useState<Partner | null>(null);
  const [showUsersModal, setShowUsersModal] = useState(false);
  const [partnerUsers, setPartnerUsers] = useState<any[]>([]);
  const [newUser, setNewUser] = useState({
    name: '',
    phone: '',
    password: '',
    email: '',
    role: 'user' as 'admin' | 'user'
  });
  const [editingPartner, setEditingPartner] = useState<Partner | null>(null);
  const [editModalActiveTab, setEditModalActiveTab] = useState<'info' | 'vehicles' | 'users' | 'files'>('info');
  const [editingVehicles, setEditingVehicles] = useState<Array<{
    registrationNumber: string;
    year: string;
    model: string;
    euroClass: string;
    payload: string;
  }>>([]);
  const [editingFiles, setEditingFiles] = useState<File[]>([]);
  
  // BRRG integration
  const [brrgSearchResults, setBrrgSearchResults] = useState<any[]>([]);
  const [showBrrgSearch, setShowBrrgSearch] = useState(false);
  const [searchingBrrg, setSearchingBrrg] = useState(false);
  const [brrgSearchQuery, setBrrgSearchQuery] = useState('');
  
  // Audit functionality
  const [audits, setAudits] = useState<any[]>([]);
  const [showAuditModal, setShowAuditModal] = useState(false);
  const [showCreateAuditModal, setShowCreateAuditModal] = useState(false);
  const [selectedAudit, setSelectedAudit] = useState<any>(null);
  const [selectedPartnerForAudit, setSelectedPartnerForAudit] = useState<Partner | null>(null);
  const [auditNotifications, setAuditNotifications] = useState<any[]>([]);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [showDocumentsModal, setShowDocumentsModal] = useState(false);
  const [selectedPartnerForDocuments, setSelectedPartnerForDocuments] = useState<Partner | null>(null);
  const [partnerDocuments, setPartnerDocuments] = useState<any[]>([]);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const [newDocument, setNewDocument] = useState({
    name: '',
    category: 'contract' as 'contract' | 'framework' | 'audit' | 'other',
    description: '',
    file: null as File | null
  });
  const [newAudit, setNewAudit] = useState({
    partnerId: '',
    scheduledDate: '',
    notes: '',
    status: 'scheduled' as 'scheduled' | 'in_progress' | 'completed' | 'overdue',
    auditType: 'quarterly' as 'quarterly' | 'annual' | 'special',
    documents: {
      navRegistration: false,
      timeSheets: false,
      paySlips: false,
      employmentContracts: false
    },
    findings: '',
    recommendations: '',
    nextAuditDate: ''
  });

  useEffect(() => {
    if (userProfile?.companyId) {
      loadPartners();
      loadRouteAssignments();
      loadAudits();
    }
  }, [userProfile?.companyId]);

  // Check for overdue audits when partners or audits change
  useEffect(() => {
    if (partners.length > 0 && audits.length > 0) {
      checkAndNotifyOverdueAudits();
    }
  }, [partners, audits]);

  // Set up interval to check for overdue audits every hour
  useEffect(() => {
    const interval = setInterval(() => {
      if (partners.length > 0 && audits.length > 0) {
        checkAndNotifyOverdueAudits();
      }
    }, 60 * 60 * 1000); // Check every hour

    return () => clearInterval(interval);
  }, [partners, audits]);

  useEffect(() => {
    if (activeView === 'routes') {
      loadRouteAssignments();
    }
  }, [activeView, currentDate]);

  const loadPartners = async () => {
    if (!userProfile?.companyId) return;
    
    try {
      const partnersData = await firebaseService.getPartners(userProfile.companyId);
      setPartners(partnersData);
      setFilteredPartners(partnersData);
    } catch (error) {
      setError('Kunne ikke laste partnere');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setUploadedFiles(prev => [...prev, ...files]);
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const addVehicle = () => {
    setVehicles(prev => [...prev, {
      registrationNumber: '',
      year: '',
      model: '',
      euroClass: '',
      payload: ''
    }]);
  };

  const updateVehicle = (index: number, field: string, value: string) => {
    setVehicles(prev => prev.map((vehicle, i) => 
      i === index ? { ...vehicle, [field]: value } : vehicle
    ));
  };

  const removeVehicle = (index: number) => {
    setVehicles(prev => prev.filter((_, i) => i !== index));
  };

  const uploadFilesToFirebase = async (files: File[], partnerId: string) => {
    const { ref, uploadBytes, getDownloadURL } = await import('firebase/storage');
    const { storage } = await import('@/lib/firebase');
    
    if (!storage) {
      throw new Error('Firebase Storage not initialized');
    }
    
    const uploadPromises = files.map(async (file) => {
      const fileName = `${partnerId}/${Date.now()}_${file.name}`;
      const storageRef = ref(storage, `partner-files/${fileName}`);
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);
      return {
        name: file.name,
        url: downloadURL,
        size: file.size,
        type: file.type,
        uploadedAt: new Date().toISOString()
      };
    });
    
    return Promise.all(uploadPromises);
  };

  const handleCreatePartner = async () => {
    if (!userProfile?.companyId) {
      setError('Mangler bedrifts-ID');
      return;
    }

    if (!newPartner.name.trim()) {
      setError('Bedriftsnavn er påkrevd');
      return;
    }

    try {
      setLoading(true);
      setUploadingFiles(true);
      
      // Create partner first to get ID
      const partnerData = {
        ...newPartner,
        companyId: userProfile.companyId,
        status: 'active' as const,
        rating: 0,
        projects: 0,
        revenue: 0,
        createdBy: userProfile.id,
        vehicles: vehicles,
        uploadedFiles: []
      };
      
      const partnerId = await firebaseService.createPartner(partnerData);
      
      // Upload files if any
      let uploadedFileData: any[] = [];
      if (uploadedFiles.length > 0) {
        try {
          uploadedFileData = await uploadFilesToFirebase(uploadedFiles, partnerId);
          
          // Update partner with file URLs
          await firebaseService.updatePartner(partnerId, {
            uploadedFiles: uploadedFileData
          });
        } catch (fileError) {
          console.error('Error uploading files:', fileError);
          setError('Partner opprettet, men filopplasting feilet');
        }
      }
      
      // Refresh partners list
      const updatedPartners = await firebaseService.getPartners(userProfile.companyId);
      setPartners(updatedPartners);
      setFilteredPartners(updatedPartners);
      
      setSuccess('Partner opprettet!');
      setShowCreatePartnerModal(false);
      setNewPartner({
        name: '',
        description: '',
        type: 'supplier' as const,
        orgNumber: '',
        industry: '',
        address: { street: '', city: '', postalCode: '', country: 'Norge' },
        contactPerson: { name: '', email: '', phone: '', position: '' }
      });
      setUploadedFiles([]);
      setVehicles([]);
      setActiveTab('info');
      
    } catch (err: any) {
      setError(err.message || 'Kunne ikke opprette partner');
    } finally {
      setLoading(false);
      setUploadingFiles(false);
    }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query.trim() === '') {
      setFilteredPartners(partners);
    } else {
      const filtered = partners.filter(partner =>
        partner.name.toLowerCase().includes(query.toLowerCase()) ||
        (partner.orgNumber && partner.orgNumber.includes(query)) ||
        (partner.contactPerson?.name && partner.contactPerson.name.toLowerCase().includes(query.toLowerCase()))
      );
      setFilteredPartners(filtered);
    }
  };

  // Calendar functions
  const getWeekDates = (date: Date) => {
    const startOfWeek = new Date(date);
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1); // Monday start
    startOfWeek.setDate(diff);
    
    const weekDates = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      weekDates.push(date);
    }
    return weekDates;
  };

  const navigateWeek = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() + (direction === 'next' ? 7 : -7));
    setCurrentDate(newDate);
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('no-NO', { 
      weekday: 'short', 
      day: 'numeric', 
      month: 'numeric' 
    });
  };

  const handleDateClick = (date: Date, partner: Partner) => {
    setSelectedDate(date);
    setSelectedPartner(partner);
    setShowFileShareModal(true);
  };

  const getRouteAssignment = (partnerId: string, date: Date) => {
    const key = `${partnerId}_${date.toISOString().split('T')[0]}`;
    return routeAssignments[key] || null;
  };

  // Load users for a specific partner
  const loadPartnerUsers = async (partnerId: string) => {
    try {
      // Here you would typically load from Firebase
      // For now, we'll use mock data
      const mockUsers = [
        {
          id: '1',
          name: 'Ola Nordmann',
          phone: '+47 123 45 678',
          email: 'ola@partner.no',
          role: 'admin',
          createdAt: '2024-01-15',
          lastLogin: '2024-01-20'
        },
        {
          id: '2',
          name: 'Kari Hansen',
          phone: '+47 987 65 432',
          email: 'kari@partner.no',
          role: 'user',
          createdAt: '2024-01-16',
          lastLogin: '2024-01-19'
        }
      ];
      setPartnerUsers(mockUsers);
    } catch (error) {
      console.error('Error loading users:', error);
      setError('Feil ved lasting av brukere');
    }
  };

  const initializeEditModal = (partner: Partner) => {
    setEditingPartner(partner);
    setEditingVehicles(partner.vehicles || []);
    setEditingFiles([]);
    setEditModalActiveTab('info');
    loadPartnerUsers(partner.id || '');
  };

  // BRRG search functions
  const searchBrrg = async (query: string) => {
    console.log('🔍 Searching BRRG API with query:', query);
    
    if (!query.trim()) {
      console.log('❌ Empty query, clearing results');
      setBrrgSearchResults([]);
      return;
    }

    setSearchingBrrg(true);
    console.log('⏳ Set searching to true');
    
    try {
      // Use real BRRG API
      const results = await brrgService.searchCompanies(query);
      console.log('✅ BRRG API results:', results);
      console.log('📊 Results count:', results.length);
      setBrrgSearchResults(results);
      console.log('💾 Set search results in state');
    } catch (error) {
      console.error('❌ Error searching BRRG API:', error);
      setError('Feil ved søk i BRRG. Prøv igjen senere.');
    } finally {
      setSearchingBrrg(false);
      console.log('✅ Set searching to false');
    }
  };

  const selectBrrgCompany = (company: any) => {
    console.log('🎯 Selecting BRRG company:', company);
    
    // Format company data using BRRG service
    const formattedData = brrgService.formatCompanyForPartner(company);
    console.log('📝 Formatted data:', formattedData);

    if (showCreatePartnerModal) {
      setNewPartner(prev => ({
        ...prev,
        name: formattedData.name,
        orgNumber: formattedData.orgNumber,
        industry: formattedData.industry,
        description: formattedData.description,
        address: {
          street: formattedData.address,
          city: formattedData.city,
          postalCode: formattedData.postalCode,
          country: 'Norge'
        },
        contactPerson: {
          name: prev.contactPerson?.name || '',
          email: prev.contactPerson?.email || '',
          phone: prev.contactPerson?.phone || '',
          position: prev.contactPerson?.position || ''
        }
      }));
    } else if (editingPartner) {
      setEditingPartner(prev => prev ? {
        ...prev,
        name: formattedData.name,
        orgNumber: formattedData.orgNumber,
        industry: formattedData.industry,
        description: formattedData.description,
        address: {
          street: formattedData.address,
          city: formattedData.city,
          postalCode: formattedData.postalCode,
          country: 'Norge'
        },
        contactPerson: {
          name: prev.contactPerson?.name || '',
          email: prev.contactPerson?.email || '',
          phone: prev.contactPerson?.phone || '',
          position: prev.contactPerson?.position || ''
        }
      } : null);
    }
    setShowBrrgSearch(false);
    setBrrgSearchResults([]);
    setBrrgSearchQuery('');
  };

  // Close BRRG search when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showBrrgSearch) {
        const target = event.target as HTMLElement;
        if (!target.closest('[data-brrg-search]')) {
          setShowBrrgSearch(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showBrrgSearch]);

  const handleCreateUser = async () => {
    if (!selectedPartnerForAction || !newUser.name || !newUser.phone || !newUser.password) {
      setError('Vennligst fyll ut alle felter');
      return;
    }

    if (!auth || !db) {
      setError('Firebase ikke initialisert');
      return;
    }

    try {
      // Generate username (phone number)
      const username = newUser.phone.replace(/\s/g, '');
      
      // Create user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(
        auth, 
        newUser.email || `${username}@partner.driftpro.no`, 
        newUser.password
      );

      // Create user profile in Firestore
      await setDoc(doc(db, 'users', userCredential.user.uid), {
        id: userCredential.user.uid,
        name: newUser.name,
        phone: newUser.phone,
        email: newUser.email,
        username: username,
        role: 'partner',
        partnerId: selectedPartnerForAction.id,
        partnerName: selectedPartnerForAction.name,
        companyId: userProfile?.companyId,
        createdAt: new Date().toISOString(),
        permissions: {
          canViewDocuments: true,
          canViewRoutes: true,
          canAcceptRoutes: true,
          canViewPDFs: true
        }
      });

      // Send SMS with credentials
      await sendSMS(newUser.phone, 
        `Hei ${newUser.name}! Du har fått tilgang til DriftPro. Brukernavn: ${username}, Passord: ${newUser.password}. Logg inn på: https://partner.driftpro.no`
      );

      setSuccess(`Bruker opprettet og SMS sendt til ${newUser.name}`);
      setShowCreateUserModal(false);
      setNewUser({ name: '', phone: '', password: '', email: '', role: 'user' });
      setSelectedPartnerForAction(null);
      
      // Reload users if users modal is open
      if (showUsersModal) {
        loadPartnerUsers(selectedPartnerForAction.id || '');
      }
    } catch (error) {
      console.error('Error creating user:', error);
      setError('Feil ved opprettelse av bruker');
    }
  };

  const sendSMS = async (phone: string, message: string) => {
    try {
      const response = await fetch('/api/sms/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: phone,
          message: message
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send SMS');
      }
    } catch (error) {
      console.error('Error sending SMS:', error);
      throw error;
    }
  };

  const handleShareFiles = async () => {
    if (!selectedPartner || !selectedDate || !userProfile?.companyId) return;
    
    if (!routeTitle.trim() && uploadedFiles.length === 0) {
      setError('Skriv inn en rute tittel eller last opp filer');
      return;
    }

    try {
      setUploadingFiles(true);
      
      let uploadedFileData: any[] = [];
      if (uploadedFiles.length > 0) {
        uploadedFileData = await uploadFilesToFirebase(uploadedFiles, selectedPartner.id);
      }

      const assignmentId = await firebaseService.createRouteAssignment({
        partnerId: selectedPartner.id,
        partnerName: selectedPartner.name,
        date: selectedDate.toISOString(),
        files: uploadedFileData,
        title: routeTitle.trim() || `Rute ${selectedDate.toLocaleDateString('no-NO')}`,
        job: selectedJob,
        users: selectedUsers,
        companyId: userProfile.companyId
      });

      const assignmentKey = `${selectedPartner.id}_${selectedDate.toISOString().split('T')[0]}`;
      const assignment = {
        id: assignmentId,
        partnerId: selectedPartner.id,
        partnerName: selectedPartner.name,
        date: selectedDate.toISOString(),
        files: uploadedFileData,
        title: routeTitle.trim() || `Rute ${selectedDate.toLocaleDateString('no-NO')}`,
        job: selectedJob,
        users: selectedUsers,
        createdAt: new Date().toISOString()
      };

      setRouteAssignments(prev => ({
        ...prev,
        [assignmentKey]: assignment
      }));

      setSuccess(`Rute delt med ${selectedPartner.name} for ${selectedDate.toLocaleDateString('no-NO')}`);
      setShowFileShareModal(false);
      setUploadedFiles([]);
      setRouteTitle('');
      setSelectedJob('');
      setSelectedUsers([]);
    } catch (error) {
      console.error('Error sharing files:', error);
      setError('Feil ved opplasting av filer');
    } finally {
      setUploadingFiles(false);
    }
  };

  const loadRouteAssignments = async () => {
    if (!userProfile?.companyId) return;
    
    try {
      // Get start and end of current week
      const weekDates = getWeekDates(currentDate);
      const startDate = weekDates[0].toISOString().split('T')[0];
      const endDate = weekDates[6].toISOString().split('T')[0];
      
      const assignments = await firebaseService.getRouteAssignments(
        userProfile.companyId, 
        startDate, 
        endDate
      );
      
      // Convert to key-value format for easy lookup
      const assignmentMap: {[key: string]: any} = {};
      assignments.forEach(assignment => {
        const key = `${assignment.partnerId}_${assignment.date.split('T')[0]}`;
        assignmentMap[key] = assignment;
      });
      
      setRouteAssignments(assignmentMap);
    } catch (error) {
      console.error('Error loading route assignments:', error);
    }
  };

  const loadAudits = async () => {
    if (!userProfile?.companyId) return;
    
    try {
      const auditsData = await firebaseService.getAudits(userProfile.companyId);
      setAudits(auditsData);
      
      // Check for overdue audits
      const overdueAudits = await firebaseService.checkOverdueAudits(userProfile.companyId);
      if (overdueAudits.length > 0) {
        setError(`⚠️ ${overdueAudits.length} audit(er) er forsinket!`);
      }
    } catch (error) {
      console.error('Error loading audits:', error);
    }
  };

  // Get audit status for a specific partner
  const getPartnerAuditStatus = (partnerId: string) => {
    const partnerAudits = audits.filter(audit => audit.partnerId === partnerId);
    if (partnerAudits.length === 0) return null;
    
    // Get the most recent audit
    const latestAudit = partnerAudits.sort((a, b) => 
      new Date(b.scheduledDate).getTime() - new Date(a.scheduledDate).getTime()
    )[0];
    
    return latestAudit;
  };

  // Get audit status display info
  const getAuditStatusInfo = (partnerId: string) => {
    const audit = getPartnerAuditStatus(partnerId);
    if (!audit) {
      return {
        status: 'none',
        text: 'Ingen audit',
        color: '#6b7280',
        bgColor: '#f3f4f6',
        icon: AlertTriangle
      };
    }

    const now = new Date();
    const auditDate = new Date(audit.scheduledDate);
    const isOverdue = audit.status === 'overdue' || (audit.status === 'scheduled' && auditDate < now);

    switch (audit.status) {
      case 'completed':
        return {
          status: 'completed',
          text: 'Fullført',
          color: '#059669',
          bgColor: '#d1fae5',
          icon: CheckCircle
        };
      case 'in_progress':
        return {
          status: 'in_progress',
          text: 'Pågår',
          color: '#d97706',
          bgColor: '#fef3c7',
          icon: Clock
        };
      case 'overdue':
      case 'scheduled':
        if (isOverdue) {
          return {
            status: 'overdue',
            text: 'Forsinket',
            color: '#dc2626',
            bgColor: '#fee2e2',
            icon: AlertTriangle
          };
        }
        return {
          status: 'scheduled',
          text: 'Planlagt',
          color: '#2563eb',
          bgColor: '#dbeafe',
          icon: Calendar
        };
      default:
        return {
          status: 'unknown',
          text: 'Ukjent',
          color: '#6b7280',
          bgColor: '#f3f4f6',
          icon: AlertTriangle
        };
    }
  };

  // Check for overdue audits and upcoming audits, send automatic notifications
  const checkAndNotifyOverdueAudits = async () => {
    if (!userProfile?.companyId) return;
    
    try {
      const now = new Date();
      const overdueAudits = [];
      const upcomingAudits = [];
      
      // Check each partner for audit status
      for (const partner of partners) {
        const audit = getPartnerAuditStatus(partner.id || '');
        if (audit) {
          const auditDate = new Date(audit.scheduledDate);
          const daysDifference = Math.floor((auditDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          
          // Check for overdue audits (past due date and not completed/in progress)
          if (auditDate < now && audit.status !== 'completed' && audit.status !== 'in_progress') {
            const daysOverdue = Math.abs(daysDifference);
            const existingOverdueNotification = auditNotifications.find(
              n => n.partnerId === partner.id && n.auditId === audit.id && n.type === 'overdue'
            );
            
            if (!existingOverdueNotification) {
              const message = `Audit for ${partner.name} er ${daysOverdue} dager forsinket (planlagt: ${auditDate.toLocaleDateString('no-NO')})`;
              overdueAudits.push({ partner, audit, message, daysOverdue });
            }
          }
          
          // Check for upcoming audits (within 7 days and not completed/in progress)
          if (daysDifference >= 0 && daysDifference <= 7 && audit.status === 'scheduled') {
            const existingUpcomingNotification = auditNotifications.find(
              n => n.partnerId === partner.id && n.auditId === audit.id && n.type === 'upcoming'
            );
            
            if (!existingUpcomingNotification) {
              const message = `Audit for ${partner.name} kommer om ${daysDifference} dager (${auditDate.toLocaleDateString('no-NO')})`;
              upcomingAudits.push({ partner, audit, message, daysDifference });
            }
          }
        }
      }
      
      // Send notifications for overdue audits
      if (overdueAudits.length > 0) {
        for (const { partner, audit, message } of overdueAudits) {
          await sendAuditNotification(partner, audit, message, 'overdue');
        }
      }
      
      // Send notifications for upcoming audits
      if (upcomingAudits.length > 0) {
        for (const { partner, audit, message } of upcomingAudits) {
          await sendAuditNotification(partner, audit, message, 'upcoming');
        }
      }
      
      // Show summary message
      if (overdueAudits.length > 0) {
        setError(`⚠️ ${overdueAudits.length} audit(er) er forsinket og admin har blitt varslet!`);
      }
      if (upcomingAudits.length > 0) {
        setSuccess(`📅 ${upcomingAudits.length} audit(er) kommer snart og admin har blitt varslet!`);
      }
    } catch (error) {
      console.error('Error checking audit notifications:', error);
    }
  };

  // Send notification to admin about audit
  const sendAuditNotification = async (partner: Partner, audit: any, message: string, type: string = 'audit') => {
    try {
      const notification = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        type: type,
        partnerId: partner.id,
        partnerName: partner.name,
        auditId: audit.id,
        message: message,
        timestamp: new Date().toISOString(),
        read: false
      };
      
      // Add to local notifications
      setAuditNotifications(prev => [...prev, notification]);
      
      // Here you would typically send to Firebase or your notification service
      console.log('Sending audit notification:', notification);
      
      if (type === 'overdue') {
        console.log(`Automatic notification sent for overdue audit: ${partner.name}`);
      } else {
        setSuccess(`Notifikasjon sendt til admin om ${partner.name}`);
      }
    } catch (error) {
      console.error('Error sending notification:', error);
      setError('Feil ved sending av notifikasjon');
    }
  };

  // Load documents for a specific partner
  const loadPartnerDocuments = async (partnerId: string) => {
    try {
      // Here you would typically load from Firebase
      // For now, we'll use mock data
      const mockDocuments = [
        {
          id: '1',
          name: 'Hovedavtale 2024',
          category: 'contract',
          description: 'Hovedavtale mellom MAVI og partner',
          uploadDate: '2024-01-15',
          fileSize: '2.3 MB',
          fileType: 'PDF'
        },
        {
          id: '2',
          name: 'Rammeavtale Transport',
          category: 'framework',
          description: 'Rammeavtale for transporttjenester',
          uploadDate: '2024-01-10',
          fileSize: '1.8 MB',
          fileType: 'PDF'
        },
        {
          id: '3',
          name: 'Audit Rapport Q1 2024',
          category: 'audit',
          description: 'Kvartalsvis audit rapport',
          uploadDate: '2024-03-31',
          fileSize: '3.1 MB',
          fileType: 'PDF'
        }
      ];
      setPartnerDocuments(mockDocuments);
    } catch (error) {
      console.error('Error loading documents:', error);
      setError('Feil ved lasting av dokumenter');
    }
  };

  // Upload document
  const uploadDocument = async () => {
    if (!selectedPartnerForDocuments || !newDocument.file) return;
    
    setUploadingFiles(true);
    try {
      // Here you would typically upload to Firebase Storage
      const document = {
        id: Date.now().toString(),
        name: newDocument.name,
        category: newDocument.category,
        description: newDocument.description,
        uploadDate: new Date().toISOString().split('T')[0],
        fileSize: (newDocument.file.size / 1024 / 1024).toFixed(1) + ' MB',
        fileType: newDocument.file.name.split('.').pop()?.toUpperCase() || 'UNKNOWN'
      };
      
      setPartnerDocuments(prev => [...prev, document]);
      setNewDocument({
        name: '',
        category: 'contract',
        description: '',
        file: null
      });
      setShowUploadModal(false);
      setSuccess('Dokument lastet opp!');
    } catch (error) {
      console.error('Error uploading document:', error);
      setError('Feil ved opplasting av dokument');
    } finally {
      setUploadingFiles(false);
    }
  };

  // Get category display info
  const getCategoryInfo = (category: string) => {
    switch (category) {
      case 'contract':
        return { label: 'Avtaler', color: '#3b82f6', icon: FileText };
      case 'framework':
        return { label: 'Rammeavtaler', color: '#059669', icon: FileText };
      case 'audit':
        return { label: 'Audit', color: '#d97706', icon: ClipboardCheck };
      case 'other':
        return { label: 'Andre', color: '#6b7280', icon: FileText };
      default:
        return { label: 'Ukjent', color: '#6b7280', icon: FileText };
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Laster partnere...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
          <div className="card-icon">
            <Building2 />
          </div>
          <div>
            <h1 className="page-title">🤝 Samarbeidspartnere</h1>
            <p className="page-subtitle">
              Administrer og oversikt over alle samarbeidspartnere
            </p>
          </div>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <span className="badge badge-primary">
            {partners.length} partnere
          </span>
          
          {/* Tab Navigation */}
          <div style={{ display: 'flex', gap: '0.5rem', marginRight: 'auto' }}>
            <button
              onClick={() => setActiveView('partners')}
              style={{
                padding: '0.5rem 1rem',
                background: activeView === 'partners' ? 'var(--primary)' : 'transparent',
                color: activeView === 'partners' ? 'var(--white)' : 'var(--gray-600)',
                border: '1px solid var(--gray-300)',
                borderRadius: 'var(--radius-md)',
                cursor: 'pointer',
                fontWeight: '500',
                fontSize: 'var(--font-size-sm)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              <Users style={{ width: '16px', height: '16px' }} />
              Samarbeidspartnere
            </button>
            <button
              onClick={() => setActiveView('routes')}
              style={{
                padding: '0.5rem 1rem',
                background: activeView === 'routes' ? 'var(--primary)' : 'transparent',
                color: activeView === 'routes' ? 'var(--white)' : 'var(--gray-600)',
                border: '1px solid var(--gray-300)',
                borderRadius: 'var(--radius-md)',
                cursor: 'pointer',
                fontWeight: '500',
                fontSize: 'var(--font-size-sm)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              <Calendar style={{ width: '16px', height: '16px' }} />
              Ruter Tildelt
            </button>
            <button
              onClick={() => setActiveView('audits')}
              style={{
                padding: '0.5rem 1rem',
                background: activeView === 'audits' ? 'var(--primary)' : 'transparent',
                color: activeView === 'audits' ? 'var(--white)' : 'var(--gray-600)',
                border: '1px solid var(--gray-300)',
                borderRadius: 'var(--radius-md)',
                cursor: 'pointer',
                fontWeight: '500',
                fontSize: 'var(--font-size-sm)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                position: 'relative'
              }}
            >
              <FileText style={{ width: '16px', height: '16px' }} />
              Audit
              {audits.some(audit => audit.status === 'overdue') && (
                <span style={{
                  position: 'absolute',
                  top: '-5px',
                  right: '-5px',
                  width: '12px',
                  height: '12px',
                  background: '#ef4444',
                  borderRadius: '50%',
                  border: '2px solid white'
                }} />
              )}
            </button>
          </div>
          
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              {/* Notification Bell */}
              <button
                onClick={() => setShowNotificationModal(true)}
                style={{
                  position: 'relative',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '0.5rem',
                  borderRadius: '0.5rem',
                  color: '#6b7280',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <AlertTriangle style={{ width: '20px', height: '20px' }} />
                {auditNotifications.length > 0 && (
                  <span style={{
                    position: 'absolute',
                    top: '-2px',
                    right: '-2px',
                    width: '18px',
                    height: '18px',
                    background: '#dc2626',
                    color: 'white',
                    borderRadius: '50%',
                    fontSize: '0.75rem',
                    fontWeight: '600',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    {auditNotifications.length}
                  </span>
                )}
              </button>
              
              <button 
                className="btn"
                onClick={() => setShowJobManagementModal(true)}
                style={{
                  background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
                  border: '1px solid #d1d5db',
                  color: '#374151',
                  fontWeight: '500',
                  fontSize: 'var(--font-size-sm)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                <Clock style={{ width: '16px', height: '16px' }} />
                Administrer Jobber
              </button>
              <button 
                className="btn btn-primary"
                onClick={() => setShowCreatePartnerModal(true)}
              >
                <Plus style={{ width: '16px', height: '16px' }} />
                Ny Partner
              </button>
            </div>
        </div>
      </div>

      {/* Search and Filters */}
      {activeView === 'partners' && (
        <div className="card" style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <div className="search-container" style={{ flex: '1', minWidth: '300px' }}>
              <Search className="search-icon" />
              <input
                type="text"
                placeholder="Søk i partnere..."
                className="search-input"
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
              />
            </div>
          </div>
        </div>
      )}

      {/* Content based on active view */}
      {activeView === 'partners' ? (
        /* Partners Grid */
        <div className="grid grid-cols-3">
          {filteredPartners.map((partner, index) => (
          <div key={partner.id || `partner-${index}`} className="card">
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', marginBottom: '1rem' }}>
              <div className="card-icon">
                <Building2 />
              </div>
              <div style={{ flex: '1' }}>
                <h3 style={{ 
                  fontWeight: '600', 
                  color: '#333',
                  fontSize: '1.1rem',
                  marginBottom: '0.25rem'
                }}>
                  {partner.name}
                </h3>
                <p style={{ 
                  color: '#666',
                  fontSize: '0.875rem',
                  marginBottom: '0.5rem'
                }}>
                  Org.nr: {partner.orgNumber || 'Ikke oppgitt'}
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <span style={{
                    padding: '0.25rem 0.5rem',
                    borderRadius: '0.375rem',
                    fontSize: '0.75rem',
                    fontWeight: '500',
                    backgroundColor: partner.status === 'active' ? '#dcfce7' : '#fef2f2',
                    color: partner.status === 'active' ? '#166534' : '#dc2626'
                  }}>
                    {partner.status === 'active' ? 'Aktiv' : 'Inaktiv'}
                  </span>
                  
                  {/* Audit Status */}
                  {(() => {
                    const auditInfo = getAuditStatusInfo(partner.id || '');
                    const IconComponent = auditInfo.icon;
                    return (
                      <span style={{
                        padding: '0.25rem 0.5rem',
                        borderRadius: '0.375rem',
                        fontSize: '0.75rem',
                        fontWeight: '500',
                        backgroundColor: auditInfo.bgColor,
                        color: auditInfo.color,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.25rem'
                      }}>
                        <IconComponent style={{ width: '12px', height: '12px' }} />
                        {auditInfo.text}
                      </span>
                    );
                  })()}
                </div>
              </div>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', fontSize: '0.875rem', color: '#666' }}>
                <MapPin style={{ width: '16px', height: '16px' }} />
                <span>{partner.address.street}, {partner.address.postalCode} {partner.address.city}</span>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', fontSize: '0.875rem', color: '#666' }}>
                <Users style={{ width: '16px', height: '16px' }} />
                <span>{partner.contactPerson?.name || 'Ikke oppgitt'} - {partner.contactPerson?.position || 'Ikke oppgitt'}</span>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', fontSize: '0.875rem', color: '#666' }}>
                <Mail style={{ width: '16px', height: '16px' }} />
                <span>{partner.contactPerson?.email || 'Ikke oppgitt'}</span>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', fontSize: '0.875rem', color: '#666' }}>
                <Phone style={{ width: '16px', height: '16px' }} />
                <span>{partner.contactPerson?.phone || 'Ikke oppgitt'}</span>
              </div>
              
              {partner.vehicles && partner.vehicles.length > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', fontSize: '0.875rem', color: '#666' }}>
                  <Building2 style={{ width: '16px', height: '16px' }} />
                  <span>{partner.vehicles.length} kjøretøy registrert</span>
                </div>
              )}
              
              {partner.uploadedFiles && partner.uploadedFiles.length > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', color: '#666' }}>
                  <FileUp style={{ width: '16px', height: '16px' }} />
                  <span>{partner.uploadedFiles.length} filer lastet opp</span>
                </div>
              )}
              
              {/* Audit Status Section */}
              {(() => {
                const auditInfo = getAuditStatusInfo(partner.id || '');
                const IconComponent = auditInfo.icon;
                const audit = getPartnerAuditStatus(partner.id || '');
                
                return (
                  <div style={{ 
                    marginTop: '0.75rem',
                    padding: '0.75rem',
                    borderRadius: '8px',
                    backgroundColor: auditInfo.bgColor,
                    border: `1px solid ${auditInfo.color}20`
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                      <IconComponent style={{ width: '16px', height: '16px', color: auditInfo.color }} />
                      <span style={{ 
                        fontSize: '0.875rem', 
                        fontWeight: '600', 
                        color: auditInfo.color 
                      }}>
                        Audit Status: {auditInfo.text}
                      </span>
                    </div>
                    {audit && (
                      <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                        <div>
                          {audit.auditType === 'quarterly' && 'Kvartalsvis'}
                          {audit.auditType === 'annual' && 'Årlig'}
                          {audit.auditType === 'special' && 'Spesial'}
                          {audit.scheduledDate && ` • ${new Date(audit.scheduledDate).toLocaleDateString('no-NO')}`}
                        </div>
                        {audit.nextAuditDate && (
                          <div style={{ marginTop: '0.25rem', fontWeight: '500' }}>
                            Neste: {new Date(audit.nextAuditDate).toLocaleDateString('no-NO')}
                          </div>
                        )}
                      </div>
                    )}
                    {!audit && (
                      <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                        Ingen audit registrert
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <button
                onClick={() => {
                  initializeEditModal(partner);
                  setShowEditPartnerModal(true);
                }}
                className="btn btn-warning"
                style={{ flex: '1', fontSize: '0.875rem', padding: '0.5rem', minWidth: '120px' }}
              >
                <Edit style={{ width: '14px', height: '14px' }} />
                Rediger
              </button>
              <button
                onClick={() => {
                  setSelectedPartnerForAudit(partner);
                  const today = new Date();
                  const nextQuarter = new Date(today);
                  nextQuarter.setMonth(today.getMonth() + 3);
                  
                  setNewAudit({
                    ...newAudit,
                    partnerId: partner.id || '',
                    scheduledDate: today.toISOString().split('T')[0],
                    nextAuditDate: nextQuarter.toISOString().split('T')[0]
                  });
                  setShowCreateAuditModal(true);
                }}
                className="btn btn-info"
                style={{ flex: '1', fontSize: '0.875rem', padding: '0.5rem', minWidth: '120px' }}
              >
                <ClipboardCheck style={{ width: '14px', height: '14px' }} />
                Audit
              </button>
              <button
                onClick={() => {
                  setSelectedPartnerForDocuments(partner);
                  loadPartnerDocuments(partner.id || '');
                  setShowDocumentsModal(true);
                }}
                className="btn btn-primary"
                style={{ flex: '1', fontSize: '0.875rem', padding: '0.5rem', minWidth: '120px' }}
              >
                <FileText style={{ width: '14px', height: '14px' }} />
                Dokumenter
              </button>
            </div>
          </div>
        ))}
        </div>
      ) : (
        /* Routes Calendar View - Calendar Only */
        <div style={{ 
          background: 'white',
          borderRadius: '12px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
          overflow: 'hidden'
        }}>
            {/* Calendar Header */}
            <div style={{ 
              padding: '1.5rem', 
              borderBottom: '1px solid #e2e8f0',
              background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                <h3 style={{ 
                  fontSize: '1.5rem', 
                  fontWeight: '700', 
                  margin: 0,
                  color: '#1e293b',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  <Clock style={{ width: '24px', height: '24px', color: '#667eea' }} />
                  Ukeplan
                </h3>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '0.5rem',
                  background: 'white',
                  padding: '0.5rem',
                  borderRadius: '8px',
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
                }}>
                  <button
                    onClick={() => navigateWeek('prev')}
                    style={{
                      padding: '0.5rem',
                      background: 'transparent',
                      border: '1px solid #e2e8f0',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.2s',
                      color: '#64748b'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#f1f5f9';
                      e.currentTarget.style.borderColor = '#cbd5e1';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent';
                      e.currentTarget.style.borderColor = '#e2e8f0';
                    }}
                  >
                    <ChevronLeft style={{ width: '18px', height: '18px' }} />
                  </button>
                  <span style={{ 
                    fontSize: '0.875rem', 
                    fontWeight: '600',
                    minWidth: '180px',
                    textAlign: 'center',
                    color: '#374151',
                    padding: '0 1rem'
                  }}>
                    {formatDate(getWeekDates(currentDate)[0])} - {formatDate(getWeekDates(currentDate)[6])}
                  </span>
                  <button
                    onClick={() => navigateWeek('next')}
                    style={{
                      padding: '0.5rem',
                      background: 'transparent',
                      border: '1px solid #e2e8f0',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.2s',
                      color: '#64748b'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#f1f5f9';
                      e.currentTarget.style.borderColor = '#cbd5e1';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent';
                      e.currentTarget.style.borderColor = '#e2e8f0';
                    }}
                  >
                    <ChevronRight style={{ width: '18px', height: '18px' }} />
                  </button>
                </div>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <button
                  onClick={() => setCurrentDate(new Date())}
                  style={{
                    padding: '0.75rem 1.5rem',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    transition: 'all 0.2s',
                    boxShadow: '0 2px 4px rgba(102, 126, 234, 0.3)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-1px)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.4)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 2px 4px rgba(102, 126, 234, 0.3)';
                  }}
                >
                  I dag
                </button>
              </div>
            </div>

            {/* Enhanced Calendar Grid */}
            <div style={{ flex: '1', overflow: 'auto', background: '#f8fafc' }}>
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: '250px repeat(7, 1fr)', 
                minHeight: '100%',
                background: 'white'
              }}>
                {/* Partner names column */}
                <div style={{ 
                  borderRight: '2px solid #e2e8f0',
                  background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
                  padding: '1rem 0'
                }}>
                  <div style={{
                    padding: '1rem 1.25rem',
                    fontSize: '0.875rem',
                    fontWeight: '700',
                    color: '#374151',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    borderBottom: '2px solid #e2e8f0'
                  }}>
                    Partnere
                  </div>
                  {filteredPartners.map((partner, index) => (
                    <div 
                      key={partner.id || `partner-row-${index}`}
                      style={{
                        padding: '1rem 1.25rem',
                        borderBottom: '1px solid #f1f5f9',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        minHeight: '80px',
                        background: selectedPartner?.id === partner.id ? '#f0f4ff' : 'transparent',
                        transition: 'all 0.2s'
                      }}
                    >
                      <div style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '10px',
                        background: selectedPartner?.id === partner.id 
                          ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' 
                          : 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontWeight: '700',
                        fontSize: '1rem',
                        flexShrink: 0,
                        boxShadow: '0 3px 6px rgba(0, 0, 0, 0.15)'
                      }}>
                        {partner.name.charAt(0).toUpperCase()}
                      </div>
                      <div style={{ flex: '1', minWidth: 0 }}>
                        <div style={{
                          fontSize: '0.875rem',
                          fontWeight: '600',
                          color: '#374151',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          marginBottom: '0.25rem'
                        }}>
                          {partner.name}
                        </div>
                        <div style={{
                          fontSize: '0.75rem',
                          color: '#64748b',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}>
                          {partner.contactPerson?.name || 'Ikke oppgitt'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Days of the week */}
                {getWeekDates(currentDate).map((date, dayIndex) => {
                  const isToday = date.toDateString() === new Date().toDateString();
                  const isWeekend = dayIndex === 0 || dayIndex === 6;
                  
                  return (
                    <div key={dayIndex} style={{
                      borderRight: dayIndex < 6 ? '1px solid #e2e8f0' : 'none',
                      background: isWeekend ? '#f8fafc' : 'white'
                    }}>
                      {/* Day header */}
                      <div style={{
                        padding: '0.75rem',
                        background: isToday 
                          ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' 
                          : isWeekend 
                            ? 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)'
                            : 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
                        borderBottom: '2px solid #e2e8f0',
                        textAlign: 'center'
                      }}>
                        <div style={{
                          fontSize: '0.875rem',
                          fontWeight: '700',
                          color: isToday ? 'white' : '#64748b',
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                          marginBottom: '0.5rem'
                        }}>
                          {['Søn', 'Man', 'Tir', 'Ons', 'Tor', 'Fre', 'Lør'][dayIndex]}
                        </div>
                        <div style={{
                          fontSize: '1.5rem',
                          fontWeight: '800',
                          color: isToday ? 'white' : '#1e293b'
                        }}>
                          {date.getDate()}
                        </div>
                      </div>

                      {/* Day cells for each partner */}
                      <div style={{ minHeight: '400px' }}>
                        {filteredPartners.map((partner, partnerIndex) => {
                          const assignment = getRouteAssignment(partner.id, date);
                          
                          return (
                            <div 
                              key={`${partner.id}-${dayIndex}`}
                              onClick={() => {
                                setSelectedPartner(partner);
                                setSelectedDate(date);
                                setShowFileShareModal(true);
                              }}
                              style={{
                                minHeight: '80px',
                                padding: '0.75rem',
                                borderBottom: '1px solid #f1f5f9',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                                background: assignment 
                                  ? 'linear-gradient(135deg, #f0f4ff 0%, #e0e7ff 100%)'
                                  : 'transparent',
                                position: 'relative',
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'center',
                                alignItems: 'center'
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.background = assignment 
                                  ? 'linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%)'
                                  : '#f8fafc';
                                e.currentTarget.style.transform = 'scale(1.02)';
                                e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1)';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.background = assignment 
                                  ? 'linear-gradient(135deg, #f0f4ff 0%, #e0e7ff 100%)'
                                  : 'transparent';
                                e.currentTarget.style.transform = 'scale(1)';
                                e.currentTarget.style.boxShadow = 'none';
                              }}
                            >
                              {assignment ? (
                                <div style={{
                                  display: 'flex',
                                  flexDirection: 'column',
                                  alignItems: 'center',
                                  gap: '0.25rem',
                                  width: '100%'
                                }}>
                                  <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    fontSize: '0.75rem',
                                    color: '#667eea',
                                    fontWeight: '700'
                                  }}>
                                    <FileText style={{ width: '12px', height: '12px' }} />
                                    {assignment.files?.length || 0} filer
                                  </div>
                                  <div style={{
                                    fontSize: '0.75rem',
                                    color: '#64748b',
                                    textAlign: 'center',
                                    lineHeight: '1.3',
                                    fontWeight: '500'
                                  }}>
                                    {assignment.title || 'Rute tildelt'}
                                  </div>
                                </div>
                              ) : (
                                <div style={{
                                  fontSize: '0.75rem',
                                  color: '#cbd5e1',
                                  textAlign: 'center',
                                  fontStyle: 'italic',
                                  fontWeight: '500'
                                }}>
                                  Klikk for å tildele
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
        </div>
      )}

      {/* Create Partner Modal */}
      {showCreatePartnerModal && (
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
            background: 'var(--white)',
            borderRadius: 'var(--radius-lg)',
            padding: '2rem',
            maxWidth: '800px',
            width: '90%',
            maxHeight: '90vh',
            overflow: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
              <div>
                <h2 style={{ fontSize: 'var(--font-size-xl)', fontWeight: '600', color: 'var(--gray-900)' }}>
                  <Building2 style={{ width: '24px', height: '24px', marginRight: '0.5rem' }} />
                  Opprett Ny Partner
                </h2>
                <p style={{ color: 'var(--gray-600)', fontSize: 'var(--font-size-sm)' }}>
                  Fyll ut partnerinformasjon og legg til kontaktperson
                </p>
              </div>
              <button
                onClick={() => setShowCreatePartnerModal(false)}
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
            
            {/* Tabs */}
            <div style={{ 
              display: 'flex', 
              borderBottom: '1px solid var(--gray-200)', 
              marginBottom: '2rem',
              gap: '0.5rem'
            }}>
              <button
                onClick={() => setActiveTab('info')}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: activeTab === 'info' ? 'var(--primary)' : 'transparent',
                  color: activeTab === 'info' ? 'var(--white)' : 'var(--gray-600)',
                  border: 'none',
                  borderRadius: 'var(--radius-md) var(--radius-md) 0 0',
                  cursor: 'pointer',
                  fontWeight: '500',
                  fontSize: 'var(--font-size-sm)'
                }}
              >
                📋 Partnerinformasjon
              </button>
              <button
                onClick={() => setActiveTab('vehicles')}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: activeTab === 'vehicles' ? 'var(--primary)' : 'transparent',
                  color: activeTab === 'vehicles' ? 'var(--white)' : 'var(--gray-600)',
                  border: 'none',
                  borderRadius: 'var(--radius-md) var(--radius-md) 0 0',
                  cursor: 'pointer',
                  fontWeight: '500',
                  fontSize: 'var(--font-size-sm)'
                }}
              >
                🚛 Kjøretøy
              </button>
              <button
                onClick={() => setActiveTab('files')}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: activeTab === 'files' ? 'var(--primary)' : 'transparent',
                  color: activeTab === 'files' ? 'var(--white)' : 'var(--gray-600)',
                  border: 'none',
                  borderRadius: 'var(--radius-md) var(--radius-md) 0 0',
                  cursor: 'pointer',
                  fontWeight: '500',
                  fontSize: 'var(--font-size-sm)'
                }}
              >
                📁 Filer
              </button>
            </div>

            {/* Tab Content */}
            {activeTab === 'info' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                <div>
                  <h3 style={{ fontSize: 'var(--font-size-lg)', fontWeight: '600', marginBottom: '1rem', color: 'var(--gray-900)' }}>
                    Bedriftsinformasjon
                  </h3>
                
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: 'var(--gray-700)' }}>
                    Bedriftsnavn * (Søk i BRRG)
                  </label>
                  <div style={{ position: 'relative' }} data-brrg-search>
                  <input
                    type="text"
                      placeholder="Søk bedriftsnavn i BRRG..."
                    value={newPartner.name}
                      onChange={(e) => {
                        const value = e.target.value;
                        console.log('📝 Input changed:', value);
                        console.log('📏 Value length:', value.length);
                        setNewPartner(prev => ({ ...prev, name: value }));
                        setBrrgSearchQuery(value);
                        if (value.length >= 2) {
                          console.log('🚀 Triggering search for:', value);
                          searchBrrg(value);
                          setShowBrrgSearch(true);
                          console.log('👁️ Set showBrrgSearch to true');
                        } else {
                          console.log('❌ Query too short, hiding search');
                          setShowBrrgSearch(false);
                        }
                      }}
                      onFocus={() => {
                        if (brrgSearchQuery.length >= 2) {
                          setShowBrrgSearch(true);
                        }
                      }}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                        paddingRight: '2.5rem',
                      border: '1px solid var(--gray-300)',
                      borderRadius: 'var(--radius-md)',
                      fontSize: 'var(--font-size-sm)',
                      outline: 'none'
                    }}
                  />
                    <button
                      type="button"
                      onClick={() => {
                        setBrrgSearchQuery(newPartner.name);
                        if (newPartner.name.length >= 2) {
                          searchBrrg(newPartner.name);
                          setShowBrrgSearch(true);
                        }
                      }}
                      style={{
                        position: 'absolute',
                        right: '0.5rem',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: '0.25rem',
                        color: 'var(--primary)'
                      }}
                    >
                      <Search style={{ width: '16px', height: '16px' }} />
                    </button>
                  </div>
                  
                  {/* BRRG Search Results */}
                  {showBrrgSearch && (
                    <div style={{
                      position: 'absolute',
                      top: '100%',
                      left: 0,
                      right: 0,
                      background: 'white',
                      border: '1px solid var(--gray-300)',
                      borderRadius: 'var(--radius-md)',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                      zIndex: 1000,
                      maxHeight: '200px',
                      overflowY: 'auto',
                      marginTop: '0.25rem'
                    }}>
                      {brrgSearchResults.length > 0 ? (
                        brrgSearchResults.map((company) => (
                        <div
                          key={company.organisasjonsnummer}
                          onClick={() => selectBrrgCompany(company)}
                          style={{
                            padding: '0.75rem',
                            cursor: 'pointer',
                            borderBottom: '1px solid var(--gray-100)',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = 'var(--gray-50)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'white';
                          }}
                        >
                          <div>
                            <div style={{ fontWeight: '500', color: 'var(--gray-900)' }}>
                              {company.navn}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--gray-600)' }}>
                              Org.nr: {company.organisasjonsnummer} • {company.naeringskode1?.beskrivelse || 'Ukjent bransje'}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)' }}>
                              {company.adresse?.adresse?.join(', ')} • {company.adresse?.postnummer} {company.adresse?.poststed}
                            </div>
                          </div>
                        </div>
                        ))
                      ) : (
                        <div style={{ padding: '1rem', textAlign: 'center', color: '#6b7280' }}>
                          {searchingBrrg ? 'Søker...' : 'Ingen resultater funnet'}
                        </div>
                      )}
                    </div>
                  )}
                </div>
                
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: 'var(--gray-700)' }}>
                    Organisasjonsnummer (Søk i BRRG)
                  </label>
                  <div style={{ position: 'relative' }} data-brrg-search>
                  <input
                    type="text"
                      placeholder="Søk organisasjonsnummer i BRRG..."
                    value={newPartner.orgNumber}
                      onChange={(e) => {
                        setNewPartner(prev => ({ ...prev, orgNumber: e.target.value }));
                        setBrrgSearchQuery(e.target.value);
                        if (e.target.value.length >= 2) {
                          searchBrrg(e.target.value);
                          setShowBrrgSearch(true);
                        } else {
                          setShowBrrgSearch(false);
                        }
                      }}
                      onFocus={() => {
                        if (brrgSearchQuery.length >= 2) {
                          setShowBrrgSearch(true);
                        }
                      }}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                        paddingRight: '2.5rem',
                      border: '1px solid var(--gray-300)',
                      borderRadius: 'var(--radius-md)',
                      fontSize: 'var(--font-size-sm)',
                      outline: 'none'
                    }}
                  />
                    <button
                      type="button"
                      onClick={() => {
                        setBrrgSearchQuery(newPartner.orgNumber);
                        if (newPartner.orgNumber.length >= 2) {
                          searchBrrg(newPartner.orgNumber);
                          setShowBrrgSearch(true);
                        }
                      }}
                      style={{
                        position: 'absolute',
                        right: '0.5rem',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: '0.25rem',
                        color: 'var(--primary)'
                      }}
                    >
                      <Search style={{ width: '16px', height: '16px' }} />
                    </button>
                  </div>
                </div>
                
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: 'var(--gray-700)' }}>
                    Bransje
                  </label>
                  <input
                    type="text"
                    placeholder="Bransje"
                    value={newPartner.industry}
                    onChange={(e) => setNewPartner(prev => ({ ...prev, industry: e.target.value }))}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid var(--gray-300)',
                      borderRadius: 'var(--radius-md)',
                      fontSize: 'var(--font-size-sm)',
                      outline: 'none'
                    }}
                  />
                </div>
                
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: 'var(--gray-700)' }}>
                    Gateadresse
                  </label>
                  <input
                    type="text"
                    placeholder="Gateadresse"
                    value={newPartner.address.street}
                    onChange={(e) => setNewPartner(prev => ({ 
                      ...prev, 
                      address: { ...prev.address, street: e.target.value }
                    }))}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid var(--gray-300)',
                      borderRadius: 'var(--radius-md)',
                      fontSize: 'var(--font-size-sm)',
                      outline: 'none'
                    }}
                  />
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: 'var(--gray-700)' }}>
                      Postnummer
                    </label>
                    <input
                      type="text"
                      placeholder="Postnummer"
                      value={newPartner.address.postalCode}
                      onChange={(e) => setNewPartner(prev => ({ 
                        ...prev, 
                        address: { ...prev.address, postalCode: e.target.value }
                      }))}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid var(--gray-300)',
                        borderRadius: 'var(--radius-md)',
                        fontSize: 'var(--font-size-sm)',
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
                      placeholder="By"
                      value={newPartner.address.city}
                      onChange={(e) => setNewPartner(prev => ({ 
                        ...prev, 
                        address: { ...prev.address, city: e.target.value }
                      }))}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid var(--gray-300)',
                        borderRadius: 'var(--radius-md)',
                        fontSize: 'var(--font-size-sm)',
                        outline: 'none'
                      }}
                    />
                  </div>
                </div>
              </div>
              
              <div>
                <h3 style={{ fontSize: 'var(--font-size-lg)', fontWeight: '600', marginBottom: '1rem', color: 'var(--gray-900)' }}>
                  Kontaktperson
                </h3>
                
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: 'var(--gray-700)' }}>
                    Navn
                  </label>
                  <input
                    type="text"
                    placeholder="Kontaktperson navn"
                    value={newPartner.contactPerson.name}
                    onChange={(e) => setNewPartner(prev => ({ 
                      ...prev, 
                      contactPerson: { ...prev.contactPerson, name: e.target.value }
                    }))}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid var(--gray-300)',
                      borderRadius: 'var(--radius-md)',
                      fontSize: 'var(--font-size-sm)',
                      outline: 'none'
                    }}
                  />
                </div>
              
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: 'var(--gray-700)' }}>
                    Stilling
                  </label>
                  <input
                    type="text"
                    placeholder="Kontaktperson stilling"
                    value={newPartner.contactPerson.position}
                    onChange={(e) => setNewPartner(prev => ({ 
                      ...prev, 
                      contactPerson: { ...prev.contactPerson, position: e.target.value }
                    }))}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid var(--gray-300)',
                      borderRadius: 'var(--radius-md)',
                      fontSize: 'var(--font-size-sm)',
                      outline: 'none'
                    }}
                  />
                </div>
                
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: 'var(--gray-700)' }}>
                    E-post
                  </label>
                  <input
                    type="email"
                    placeholder="E-post"
                    value={newPartner.contactPerson.email}
                    onChange={(e) => setNewPartner(prev => ({ 
                      ...prev, 
                      contactPerson: { ...prev.contactPerson, email: e.target.value }
                    }))}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid var(--gray-300)',
                      borderRadius: 'var(--radius-md)',
                      fontSize: 'var(--font-size-sm)',
                      outline: 'none'
                    }}
                  />
                </div>
                
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: 'var(--gray-700)' }}>
                    Telefon
                  </label>
                  <input
                    type="tel"
                    placeholder="Telefon"
                    value={newPartner.contactPerson.phone}
                    onChange={(e) => setNewPartner(prev => ({ 
                      ...prev, 
                      contactPerson: { ...prev.contactPerson, phone: e.target.value }
                    }))}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid var(--gray-300)',
                      borderRadius: 'var(--radius-md)',
                      fontSize: 'var(--font-size-sm)',
                      outline: 'none'
                    }}
                  />
                </div>
              </div>
            </div>
            )}

            {/* Vehicles Tab */}
            {activeTab === 'vehicles' && (
              <div style={{ marginBottom: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <h3 style={{ fontSize: 'var(--font-size-lg)', fontWeight: '600', color: 'var(--gray-900)' }}>
                    Kjøretøy
                  </h3>
                  <button
                    onClick={addVehicle}
                    style={{
                      padding: '0.5rem 1rem',
                      background: 'var(--primary)',
                      color: 'var(--white)',
                      border: 'none',
                      borderRadius: 'var(--radius-md)',
                      cursor: 'pointer',
                      fontSize: 'var(--font-size-sm)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}
                  >
                    <Plus style={{ width: '16px', height: '16px' }} />
                    Legg til kjøretøy
                  </button>
                </div>
                
                {vehicles.map((vehicle, index) => (
                  <div key={index} style={{
                    border: '1px solid var(--gray-200)',
                    borderRadius: 'var(--radius-md)',
                    padding: '1rem',
                    marginBottom: '1rem',
                    background: 'var(--gray-50)'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                      <h4 style={{ fontSize: 'var(--font-size-md)', fontWeight: '600', color: 'var(--gray-900)' }}>
                        Kjøretøy {index + 1}
                      </h4>
                      <button
                        onClick={() => removeVehicle(index)}
                        style={{
                          background: 'var(--red-500)',
                          color: 'var(--white)',
                          border: 'none',
                          borderRadius: 'var(--radius-sm)',
                          padding: '0.25rem 0.5rem',
                          cursor: 'pointer',
                          fontSize: 'var(--font-size-xs)'
                        }}
                      >
                        Slett
                      </button>
                    </div>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                      <div>
                        <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: '500', color: 'var(--gray-700)', fontSize: 'var(--font-size-sm)' }}>
                          Registreringsnummer
                        </label>
                        <input
                          type="text"
                          placeholder="AB12345"
                          value={vehicle.registrationNumber}
                          onChange={(e) => updateVehicle(index, 'registrationNumber', e.target.value)}
                          style={{
                            width: '100%',
                            padding: '0.5rem',
                            border: '1px solid var(--gray-300)',
                            borderRadius: 'var(--radius-sm)',
                            fontSize: 'var(--font-size-sm)',
                            outline: 'none'
                          }}
                        />
                      </div>
                      
                      <div>
                        <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: '500', color: 'var(--gray-700)', fontSize: 'var(--font-size-sm)' }}>
                          Årsmodell
                        </label>
                        <input
                          type="text"
                          placeholder="2023"
                          value={vehicle.year}
                          onChange={(e) => updateVehicle(index, 'year', e.target.value)}
                          style={{
                            width: '100%',
                            padding: '0.5rem',
                            border: '1px solid var(--gray-300)',
                            borderRadius: 'var(--radius-sm)',
                            fontSize: 'var(--font-size-sm)',
                            outline: 'none'
                          }}
                        />
                      </div>
                      
                      <div>
                        <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: '500', color: 'var(--gray-700)', fontSize: 'var(--font-size-sm)' }}>
                          Modell
                        </label>
                        <input
                          type="text"
                          placeholder="Volvo FH"
                          value={vehicle.model}
                          onChange={(e) => updateVehicle(index, 'model', e.target.value)}
                          style={{
                            width: '100%',
                            padding: '0.5rem',
                            border: '1px solid var(--gray-300)',
                            borderRadius: 'var(--radius-sm)',
                            fontSize: 'var(--font-size-sm)',
                            outline: 'none'
                          }}
                        />
                      </div>
                      
                      <div>
                        <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: '500', color: 'var(--gray-700)', fontSize: 'var(--font-size-sm)' }}>
                          Euroklasse
                        </label>
                        <select
                          value={vehicle.euroClass}
                          onChange={(e) => updateVehicle(index, 'euroClass', e.target.value)}
                          style={{
                            width: '100%',
                            padding: '0.5rem',
                            border: '1px solid var(--gray-300)',
                            borderRadius: 'var(--radius-sm)',
                            fontSize: 'var(--font-size-sm)',
                            outline: 'none'
                          }}
                        >
                          <option value="">Velg euroklasse</option>
                          <option value="Euro 1">Euro 1</option>
                          <option value="Euro 2">Euro 2</option>
                          <option value="Euro 3">Euro 3</option>
                          <option value="Euro 4">Euro 4</option>
                          <option value="Euro 5">Euro 5</option>
                          <option value="Euro 6">Euro 6</option>
                          <option value="Euro 6d">Euro 6d</option>
                        </select>
                      </div>
                      
                      <div>
                        <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: '500', color: 'var(--gray-700)', fontSize: 'var(--font-size-sm)' }}>
                          Nyttevekt (kg)
                        </label>
                        <input
                          type="number"
                          placeholder="25000"
                          value={vehicle.payload}
                          onChange={(e) => updateVehicle(index, 'payload', e.target.value)}
                          style={{
                            width: '100%',
                            padding: '0.5rem',
                            border: '1px solid var(--gray-300)',
                            borderRadius: 'var(--radius-sm)',
                            fontSize: 'var(--font-size-sm)',
                            outline: 'none'
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
                
                {vehicles.length === 0 && (
                  <div style={{
                    textAlign: 'center',
                    padding: '2rem',
                    color: 'var(--gray-500)',
                    background: 'var(--gray-50)',
                    borderRadius: 'var(--radius-md)',
                    border: '2px dashed var(--gray-300)'
                  }}>
                    <p>Ingen kjøretøy lagt til ennå</p>
                    <p style={{ fontSize: 'var(--font-size-sm)', marginTop: '0.5rem' }}>
                      Klikk "Legg til kjøretøy" for å begynne
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Files Tab */}
            {activeTab === 'files' && (
              <div style={{ marginBottom: '2rem' }}>
                <h3 style={{ fontSize: 'var(--font-size-lg)', fontWeight: '600', marginBottom: '1rem', color: 'var(--gray-900)' }}>
                  Filer
                </h3>
                
                <div style={{
                  border: '2px dashed var(--gray-300)',
                  borderRadius: 'var(--radius-md)',
                  padding: '2rem',
                  textAlign: 'center',
                  background: 'var(--gray-50)',
                  marginBottom: '1rem'
                }}>
                  <input
                    type="file"
                    multiple
                    onChange={handleFileUpload}
                    style={{ display: 'none' }}
                    id="file-upload"
                  />
                  <label
                    htmlFor="file-upload"
                    style={{
                      display: 'inline-block',
                      padding: '0.75rem 1.5rem',
                      background: 'var(--primary)',
                      color: 'var(--white)',
                      borderRadius: 'var(--radius-md)',
                      cursor: 'pointer',
                      fontSize: 'var(--font-size-sm)',
                      fontWeight: '500'
                    }}
                  >
                    <FileUp style={{ width: '16px', height: '16px', marginRight: '0.5rem' }} />
                    Velg filer
                  </label>
                  <p style={{ marginTop: '0.5rem', color: 'var(--gray-600)', fontSize: 'var(--font-size-sm)' }}>
                    Du kan laste opp flere filer samtidig
                  </p>
                </div>
                
                {uploadedFiles.length > 0 && (
                  <div>
                    <h4 style={{ fontSize: 'var(--font-size-md)', fontWeight: '600', marginBottom: '0.5rem', color: 'var(--gray-900)' }}>
                      Valgte filer:
                    </h4>
                    {uploadedFiles.map((file, index) => (
                      <div key={index} style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '0.5rem',
                        background: 'var(--white)',
                        border: '1px solid var(--gray-200)',
                        borderRadius: 'var(--radius-sm)',
                        marginBottom: '0.5rem'
                      }}>
                        <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--gray-700)' }}>
                          {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                        </span>
                        <button
                          onClick={() => removeFile(index)}
                          style={{
                            background: 'var(--red-500)',
                            color: 'var(--white)',
                            border: 'none',
                            borderRadius: 'var(--radius-sm)',
                            padding: '0.25rem 0.5rem',
                            cursor: 'pointer',
                            fontSize: 'var(--font-size-xs)'
                          }}
                        >
                          Slett
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '2rem' }}>
              <button
                onClick={() => setShowCreatePartnerModal(false)}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: 'var(--gray-200)',
                  color: 'var(--gray-700)',
                  border: 'none',
                  borderRadius: 'var(--radius-md)',
                  cursor: 'pointer',
                  marginRight: '1rem'
                }}
              >
                Avbryt
              </button>
              <button
                onClick={handleCreatePartner}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: 'var(--primary)',
                  color: 'var(--white)',
                  border: 'none',
                  borderRadius: 'var(--radius-md)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                <Plus style={{ width: '16px', height: '16px' }} />
                Opprett Partner
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Connecteam-Inspired Route Details Modal */}
      {showFileShareModal && selectedDate && selectedPartner && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          backdropFilter: 'blur(4px)'
        }}>
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '0',
            maxWidth: '900px',
            width: '95%',
            maxHeight: '90vh',
            overflow: 'hidden',
            boxShadow: '0 25px 50px rgba(0, 0, 0, 0.25)',
            border: '1px solid #e2e8f0'
          }}>
            {/* Modal Header */}
            <div style={{
              padding: '1.5rem 2rem',
              borderBottom: '1px solid #e2e8f0',
              background: 'white',
              position: 'relative'
            }}>
              <button
                onClick={() => {
                  setShowFileShareModal(false);
                  setSelectedPartner(null);
                  setSelectedDate(null);
                }}
                style={{
                  position: 'absolute',
                  top: '1.5rem',
                  right: '2rem',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '0.5rem',
                  borderRadius: '6px',
                  color: '#64748b',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#f1f5f9';
                  e.currentTarget.style.color = '#374151';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'none';
                  e.currentTarget.style.color = '#64748b';
                }}
              >
                <X style={{ width: '20px', height: '20px' }} />
              </button>
              
              <div style={{ marginBottom: '1.5rem' }}>
                <h2 style={{ 
                  fontSize: '1.25rem', 
                  fontWeight: '600', 
                  margin: '0 0 0.5rem 0',
                  color: '#1e293b'
                }}>
                  {selectedDate.toLocaleDateString('no-NO', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </h2>
                <p style={{ 
                  color: '#64748b', 
                  fontSize: '0.875rem',
                  margin: 0
                }}>
                  Ruteplanlegging med {selectedPartner.name}
                </p>
              </div>

            </div>

            {/* Modal Content */}
            <div style={{ padding: '2rem', maxHeight: '60vh', overflowY: 'auto' }}>
              {/* Date and Time Section */}
              <div style={{ marginBottom: '2rem' }}>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start', marginBottom: '1rem' }}>
                  <div style={{ flex: '1' }}>
                    <label style={{ 
                      display: 'block', 
                      marginBottom: '0.5rem', 
                      fontWeight: '500', 
                      color: '#374151',
                      fontSize: '0.875rem'
                    }}>
                      Dato
                    </label>
                    <input
                      type="date"
                      value={selectedDate.toISOString().split('T')[0]}
                      onChange={(e) => setSelectedDate(new Date(e.target.value))}
                      style={{
                        width: '100%',
                        padding: '0.75rem 1rem',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        fontSize: '0.875rem',
                        background: 'white',
                        color: '#374151',
                        cursor: 'pointer'
                      }}
                      onFocus={(e) => {
                        e.currentTarget.style.borderColor = '#2563eb';
                        e.currentTarget.style.boxShadow = '0 0 0 3px rgba(37, 99, 235, 0.1)';
                      }}
                      onBlur={(e) => {
                        e.currentTarget.style.borderColor = '#d1d5db';
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                    />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', marginTop: '1.75rem' }}>
                    <input
                      type="checkbox"
                      id="all-day"
                      style={{ marginRight: '0.5rem' }}
                    />
                    <label htmlFor="all-day" style={{ 
                      fontSize: '0.875rem', 
                      color: '#374151',
                      cursor: 'pointer'
                    }}>
                      Hele dagen
                    </label>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end', marginBottom: '1rem' }}>
                  <div style={{ flex: '1' }}>
                    <label style={{ 
                      display: 'block', 
                      marginBottom: '0.5rem', 
                      fontWeight: '500', 
                      color: '#374151',
                      fontSize: '0.875rem'
                    }}>
                      Start
                    </label>
                    <input
                      type="time"
                      defaultValue="06:00"
                      style={{
                        width: '100%',
                        padding: '0.75rem 1rem',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        fontSize: '0.875rem'
                      }}
                    />
                  </div>
                  <div style={{ flex: '1' }}>
                    <label style={{ 
                      display: 'block', 
                      marginBottom: '0.5rem', 
                      fontWeight: '500', 
                      color: '#374151',
                      fontSize: '0.875rem'
                    }}>
                      Slutt
                    </label>
                    <input
                      type="time"
                      defaultValue="18:00"
                      style={{
                        width: '100%',
                        padding: '0.75rem 1rem',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        fontSize: '0.875rem'
                      }}
                    />
                  </div>
                  <div style={{ 
                    padding: '0.75rem 1rem',
                    background: '#f3f4f6',
                    borderRadius: '6px',
                    fontSize: '0.875rem',
                    color: '#6b7280',
                    minWidth: '100px',
                    textAlign: 'center'
                  }}>
                    12:00 Timer
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                  <button style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    background: 'none',
                    border: 'none',
                    color: '#6b7280',
                    fontSize: '0.875rem',
                    cursor: 'pointer',
                    padding: '0.5rem 0'
                  }}>
                    ☕ Legg til pause
                  </button>
                  <button style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    background: 'none',
                    border: 'none',
                    color: '#6b7280',
                    fontSize: '0.875rem',
                    cursor: 'pointer',
                    padding: '0.5rem 0'
                  }}>
                    🔄 Gjentar ikke
                  </button>
                  <button style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    background: 'none',
                    border: 'none',
                    color: '#6b7280',
                    fontSize: '0.875rem',
                    cursor: 'pointer',
                    padding: '0.5rem 0'
                  }}>
                    🌍 Europe/Oslo ℹ️
                  </button>
                </div>
              </div>

              {/* Route Information Section */}
              <div style={{ marginBottom: '2rem' }}>
                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: '0.5rem', 
                    fontWeight: '500', 
                    color: '#374151',
                    fontSize: '0.875rem'
                  }}>
                    Rute tittel
                  </label>
                  <input
                    type="text"
                    placeholder="Skriv her..."
                    value={routeTitle}
                    onChange={(e) => setRouteTitle(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '0.875rem',
                      transition: 'all 0.2s'
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = '#2563eb';
                      e.currentTarget.style.boxShadow = '0 0 0 3px rgba(37, 99, 235, 0.1)';
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = '#d1d5db';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  />
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: '0.5rem', 
                    fontWeight: '500', 
                    color: '#374151',
                    fontSize: '0.875rem'
                  }}>
                    Jobb
                  </label>
                  <div style={{ position: 'relative' }}>
                    <select
                      value={selectedJob}
                      onChange={(e) => setSelectedJob(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '0.75rem 1rem',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        fontSize: '0.875rem',
                        background: 'white',
                        color: '#374151',
                        cursor: 'pointer'
                      }}
                      onFocus={(e) => {
                        e.currentTarget.style.borderColor = '#2563eb';
                        e.currentTarget.style.boxShadow = '0 0 0 3px rgba(37, 99, 235, 0.1)';
                      }}
                      onBlur={(e) => {
                        e.currentTarget.style.borderColor = '#d1d5db';
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                    >
                      <option value="">Velg jobb...</option>
                      <option value="kveldsrute-honefoss" style={{ color: '#dc2626' }}>🔴 Kveldsrute - Hønefoss</option>
                      <option value="fri" style={{ color: '#059669' }}>🟢 Fri</option>
                      <option value="dagrute-ostfold" style={{ color: '#2563eb' }}>🔵 Dagrute - Østfold</option>
                      <option value="gitt-bort" style={{ color: '#7c3aed' }}>🟣 Gitt bort</option>
                      <option value="dagrute-ski" style={{ color: '#ea580c' }}>🟠 Dagrute - Ski</option>
                      <option value="syk" style={{ color: '#dc2626' }}>🔴 Syk</option>
                      <option value="dagrute-drammen" style={{ color: '#0891b2' }}>🔵 Dagrute - Drammen</option>
                      <option value="dagrute-jessheim" style={{ color: '#16a34a' }}>🟢 Dagrute - Jessheim</option>
                      <option value="dagrute-indre" style={{ color: '#ca8a04' }}>🟡 Dagrute - Indre</option>
                      <option value="dagrute-nesodden" style={{ color: '#9333ea' }}>🟣 Dagrute - Nesodden</option>
                      <option value="dagrute-baerum" style={{ color: '#0891b2' }}>🔵 Dagrute - Bærum</option>
                      <option value="dagrute-nittedal" style={{ color: '#16a34a' }}>🟢 Dagrute - Nittedal</option>
                      <option value="geilo" style={{ color: '#dc2626' }}>🔴 Geilo</option>
                      <option value="ledig-dag" style={{ color: '#6b7280' }}>⚪ LEDIG DAG</option>
                      <option value="ledig-kveld" style={{ color: '#6b7280' }}>⚪ LEDIG KVELD</option>
                      <option value="dawid" style={{ color: '#2563eb' }}>🔵 DAWID</option>
                      <option value="adam" style={{ color: '#16a34a' }}>🟢 ADAM</option>
                      <option value="dag-hadeland" style={{ color: '#ea580c' }}>🟠 Dag-Hadeland</option>
                      <option value="kveld-hadeland" style={{ color: '#dc2626' }}>🔴 Kveld-Hadeland</option>
                      <option value="kveld-kongsvinger" style={{ color: '#7c3aed' }}>🟣 KVELD-KONGSVINGER</option>
                    </select>
                  </div>
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: '0.5rem', 
                    fontWeight: '500', 
                    color: '#374151',
                    fontSize: '0.875rem'
                  }}>
                    Partner
                  </label>
                  <div style={{ position: 'relative' }}>
                    <select
                      value={selectedPartner?.id || ''}
                      onChange={(e) => {
                        const partner = partners.find(p => p.id === e.target.value);
                        setSelectedPartner(partner || null);
                      }}
                      style={{
                        width: '100%',
                        padding: '0.75rem 1rem',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        fontSize: '0.875rem',
                        background: 'white',
                        color: '#374151',
                        cursor: 'pointer'
                      }}
                      onFocus={(e) => {
                        e.currentTarget.style.borderColor = '#2563eb';
                        e.currentTarget.style.boxShadow = '0 0 0 3px rgba(37, 99, 235, 0.1)';
                      }}
                      onBlur={(e) => {
                        e.currentTarget.style.borderColor = '#d1d5db';
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                    >
                      <option value="">Velg partner...</option>
                      {partners.map(partner => (
                        <option key={partner.id} value={partner.id}>
                          {partner.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: '0.5rem', 
                    fontWeight: '500', 
                    color: '#374151',
                    fontSize: '0.875rem'
                  }}>
                    Brukere
                  </label>
                  
                  {/* Selected Users Display */}
                  {selectedUsers.length > 0 && (
                    <div style={{
                      padding: '0.75rem 1rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      background: '#f9fafb',
                      marginBottom: '0.5rem'
                    }}>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.5rem' }}>
                        {selectedUsers.map((user, index) => (
                          <div key={user} style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.25rem',
                            padding: '0.25rem 0.5rem',
                            background: '#e5e7eb',
                            borderRadius: '4px',
                            fontSize: '0.75rem'
                          }}>
                            <span>{user}</span>
                            <button
                              onClick={() => setSelectedUsers(prev => prev.filter((_, i) => i !== index))}
                              style={{
                                background: 'none',
                                border: 'none',
                                color: '#6b7280',
                                cursor: 'pointer',
                                padding: '0',
                                fontSize: '0.75rem'
                              }}
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                      </div>
                      <button
                        onClick={() => setSelectedUsers([])}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#dc2626',
                          fontSize: '0.75rem',
                          cursor: 'pointer',
                          textDecoration: 'underline'
                        }}
                      >
                        Fjern alle
                      </button>
                    </div>
                  )}

                  {/* Add Users Dropdown */}
                  <div style={{ position: 'relative' }}>
                    <select
                      value=""
                      onChange={(e) => {
                        if (e.target.value && !selectedUsers.includes(e.target.value)) {
                          setSelectedUsers(prev => [...prev, e.target.value]);
                        }
                      }}
                      style={{
                        width: '100%',
                        padding: '0.75rem 1rem',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        fontSize: '0.875rem',
                        background: 'white',
                        color: '#374151',
                        cursor: 'pointer'
                      }}
                    >
                      <option value="">+ Legg til brukere</option>
                      {availableUsers
                        .filter(user => !selectedUsers.includes(user))
                        .map(user => (
                          <option key={user} value={user}>
                            {user}
                          </option>
                        ))}
                    </select>
                  </div>

                  <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: '#6b7280' }}>
                    {selectedUsers.length === 0 ? 'Ingen brukere valgt' : `${selectedUsers.length} brukere valgt`}
                    <button style={{
                      background: 'none',
                      border: 'none',
                      color: '#2563eb',
                      cursor: 'pointer',
                      textDecoration: 'underline',
                      marginLeft: '0.5rem'
                    }}>
                      Rediger
                    </button>
                  </div>
                  <div style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <input type="checkbox" id="enable-claim" />
                    <label htmlFor="enable-claim" style={{ 
                      fontSize: '0.875rem', 
                      color: '#374151',
                      cursor: 'pointer'
                    }}>
                      Aktiver at brukere kan melde seg på denne ruten
                    </label>
                    <span style={{ color: '#6b7280', fontSize: '0.75rem' }}>ℹ️</span>
                  </div>

                  {/* Del rute med alle knapp */}
                  <div style={{ marginTop: '1rem', padding: '1rem', background: '#f0f9ff', borderRadius: '8px', border: '1px solid #bae6fd' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                      <div style={{
                        width: '32px',
                        height: '32px',
                        background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}>
                        <span style={{ fontSize: '1rem' }}>📢</span>
                      </div>
                      <div>
                        <h4 style={{ 
                          fontSize: '0.875rem', 
                          fontWeight: '600', 
                          color: '#1e293b', 
                          margin: '0 0 0.25rem 0' 
                        }}>
                          Sliter du med en rute?
                        </h4>
                        <p style={{ 
                          fontSize: '0.75rem', 
                          color: '#475569', 
                          margin: 0 
                        }}>
                          Del ruten med alle og se hvem som aksepterer den! Good luck! 🍀
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedUsers([...availableUsers]);
                      }}
                      style={{
                        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        padding: '0.75rem 1rem',
                        fontSize: '0.875rem',
                        fontWeight: '600',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        boxShadow: '0 2px 4px rgba(16, 185, 129, 0.2)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        width: '100%',
                        justifyContent: 'center'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-1px)';
                        e.currentTarget.style.boxShadow = '0 4px 8px rgba(16, 185, 129, 0.3)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 2px 4px rgba(16, 185, 129, 0.2)';
                      }}
                    >
                      <span style={{ fontSize: '1rem' }}>📢</span>
                      Del rute med alle
                    </button>
                  </div>
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: '0.5rem', 
                    fontWeight: '500', 
                    color: '#374151',
                    fontSize: '0.875rem'
                  }}>
                    Adresse
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="text"
                      placeholder="Skriv her..."
                      style={{
                        width: '100%',
                        padding: '0.75rem 1rem 0.75rem 2.5rem',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        fontSize: '0.875rem'
                      }}
                    />
                    <div style={{
                      position: 'absolute',
                      left: '0.75rem',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: '#6b7280'
                    }}>
                      📍
                    </div>
                  </div>
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: '0.5rem', 
                    fontWeight: '500', 
                    color: '#374151',
                    fontSize: '0.875rem'
                  }}>
                    Notat
                  </label>
                  <textarea
                    placeholder="Skriv beskrivelse"
                    rows={3}
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '0.875rem',
                      resize: 'vertical',
                      minHeight: '80px'
                    }}
                  />
                  <div style={{ marginTop: '0.5rem' }}>
                    <button style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      background: 'none',
                      border: 'none',
                      color: '#6b7280',
                      fontSize: '0.875rem',
                      cursor: 'pointer',
                      padding: '0.25rem 0'
                    }}>
                      📎 Vedlegg
                    </button>
                  </div>
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                  <button style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    background: 'none',
                    border: 'none',
                    color: '#6b7280',
                    fontSize: '0.875rem',
                    cursor: 'pointer',
                    padding: '0.5rem 0'
                  }}>
                    + Legg til felt ▼
                  </button>
                </div>
              </div>

              {/* File Upload Section */}
              <div style={{ marginBottom: '2rem' }}>
                <div style={{ 
                  border: '2px dashed #d1d5db',
                  borderRadius: '8px',
                  padding: '2rem',
                  textAlign: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  background: '#f9fafb'
                }}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.currentTarget.style.borderColor = '#2563eb';
                  e.currentTarget.style.background = '#f0f4ff';
                }}
                onDragLeave={(e) => {
                  e.currentTarget.style.borderColor = '#d1d5db';
                  e.currentTarget.style.background = '#f9fafb';
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  e.currentTarget.style.borderColor = '#d1d5db';
                  e.currentTarget.style.background = '#f9fafb';
                  const files = Array.from(e.dataTransfer.files);
                  setUploadedFiles(prev => [...prev, ...files]);
                }}
                onClick={() => document.getElementById('file-upload')?.click()}
                >
                  <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '8px',
                    background: '#e5e7eb',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 1rem auto'
                  }}>
                    <FileText style={{ width: '24px', height: '24px', color: '#6b7280' }} />
                  </div>
                  <p style={{ 
                    color: '#6b7280', 
                    margin: '0 0 0.5rem 0',
                    fontSize: '0.875rem'
                  }}>
                    Dra og slipp filer her, eller klikk for å velge
                  </p>
                  <button style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.5rem 1rem',
                    background: 'white',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    color: '#374151',
                    cursor: 'pointer'
                  }}>
                    <FileText style={{ width: '16px', height: '16px' }} />
                    Velg filer
                  </button>
                </div>
                <input
                  id="file-upload"
                  type="file"
                  multiple
                  style={{ display: 'none' }}
                  onChange={(e) => {
                    if (e.target.files) {
                      setUploadedFiles(prev => [...prev, ...Array.from(e.target.files!)]);
                    }
                  }}
                />
              </div>


              {/* File List */}
              {uploadedFiles.length > 0 && (
                <div style={{ marginBottom: '2rem' }}>
                  <h3 style={{ 
                    fontSize: '1rem', 
                    fontWeight: '600', 
                    color: '#374151',
                    margin: '0 0 1rem 0'
                  }}>
                    Vedlegg ({uploadedFiles.length})
                  </h3>
                  <div style={{ 
                    maxHeight: '150px', 
                    overflowY: 'auto',
                    background: '#f9fafb',
                    borderRadius: '6px',
                    padding: '0.5rem'
                  }}>
                    {uploadedFiles.map((file, index) => (
                      <div key={index} style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0.75rem',
                        background: 'white',
                        borderRadius: '6px',
                        marginBottom: '0.5rem',
                        border: '1px solid #e5e7eb'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1 }}>
                          <div style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '6px',
                            background: '#e5e7eb',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0
                          }}>
                            <FileText style={{ width: '16px', height: '16px', color: '#6b7280' }} />
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ 
                              fontSize: '0.875rem', 
                              fontWeight: '500',
                              color: '#374151',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              marginBottom: '0.125rem'
                            }}>
                              {file.name}
                            </div>
                            <div style={{ 
                              fontSize: '0.75rem', 
                              color: '#6b7280' 
                            }}>
                              {(file.size / 1024 / 1024).toFixed(2)} MB
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => removeFile(index)}
                          style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            padding: '0.5rem',
                            borderRadius: '6px',
                            color: '#6b7280',
                            transition: 'all 0.2s',
                            flexShrink: 0
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = '#fee2e2';
                            e.currentTarget.style.color = '#dc2626';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'none';
                            e.currentTarget.style.color = '#6b7280';
                          }}
                        >
                          <X style={{ width: '16px', height: '16px' }} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>

            {/* Footer Actions */}
            <div style={{ 
              padding: '1.5rem 2rem',
              borderTop: '1px solid #e2e8f0',
              background: '#f9fafb',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button
                  onClick={() => {
                    setShowFileShareModal(false);
                    setSelectedPartner(null);
                    setSelectedDate(null);
                    setUploadedFiles([]);
                    setRouteTitle('');
                    setSelectedJob('');
                    setSelectedUsers([]);
                  }}
                  style={{
                    padding: '0.75rem 1.5rem',
                    background: 'white',
                    color: '#6b7280',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#9ca3af';
                    e.currentTarget.style.color = '#374151';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = '#d1d5db';
                    e.currentTarget.style.color = '#6b7280';
                  }}
                >
                  Lagre utkast
                </button>
                <button style={{
                  padding: '0.75rem 1.5rem',
                  background: 'white',
                  color: '#6b7280',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  🗑️
                </button>
                <button style={{
                  padding: '0.75rem 1.5rem',
                  background: 'white',
                  color: '#6b7280',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  🕐 Lagre som mal
                </button>
              </div>
              
              <div style={{ display: 'flex', gap: '1rem' }}>
                {/* Del med alle knapp */}
                <button
                  onClick={() => {
                    setSelectedUsers([...availableUsers]);
                    handleShareFiles();
                  }}
                  disabled={uploadingFiles || (!routeTitle.trim() && uploadedFiles.length === 0)}
                  style={{
                    padding: '0.75rem 1.5rem',
                    background: uploadingFiles || (!routeTitle.trim() && uploadedFiles.length === 0) 
                      ? '#d1d5db' 
                      : '#10b981',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: uploadingFiles || (!routeTitle.trim() && uploadedFiles.length === 0) 
                      ? 'not-allowed' 
                      : 'pointer',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    transition: 'all 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    boxShadow: uploadingFiles || (!routeTitle.trim() && uploadedFiles.length === 0) 
                      ? 'none' 
                      : '0 1px 3px rgba(0, 0, 0, 0.1)'
                  }}
                  onMouseEnter={(e) => {
                    if (!uploadingFiles && (routeTitle.trim() || uploadedFiles.length > 0)) {
                      e.currentTarget.style.background = '#059669';
                      e.currentTarget.style.transform = 'translateY(-1px)';
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.3)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!uploadingFiles && (routeTitle.trim() || uploadedFiles.length > 0)) {
                      e.currentTarget.style.background = '#10b981';
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)';
                    }
                  }}
                >
                  {uploadingFiles ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <div style={{
                        width: '16px',
                        height: '16px',
                        border: '2px solid rgba(255, 255, 255, 0.3)',
                        borderTop: '2px solid white',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite'
                      }} />
                      Laster opp...
                    </div>
                  ) : (
                    <>📢 Del med alle</>
                  )}
                </button>

                {/* Publiser knapp */}
                <button
                  onClick={handleShareFiles}
                  disabled={uploadingFiles || (!routeTitle.trim() && uploadedFiles.length === 0)}
                  style={{
                    padding: '0.75rem 1.5rem',
                    background: uploadingFiles || (!routeTitle.trim() && uploadedFiles.length === 0) 
                      ? '#d1d5db' 
                      : '#2563eb',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: uploadingFiles || (!routeTitle.trim() && uploadedFiles.length === 0) 
                      ? 'not-allowed' 
                      : 'pointer',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    transition: 'all 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    boxShadow: uploadingFiles || (!routeTitle.trim() && uploadedFiles.length === 0) 
                      ? 'none' 
                      : '0 1px 3px rgba(0, 0, 0, 0.1)'
                  }}
                  onMouseEnter={(e) => {
                    if (!uploadingFiles && (routeTitle.trim() || uploadedFiles.length > 0)) {
                      e.currentTarget.style.background = '#1d4ed8';
                      e.currentTarget.style.transform = 'translateY(-1px)';
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(37, 99, 235, 0.3)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!uploadingFiles && (routeTitle.trim() || uploadedFiles.length > 0)) {
                      e.currentTarget.style.background = '#2563eb';
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)';
                    }
                  }}
                >
                  {uploadingFiles ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <div style={{
                        width: '16px',
                        height: '16px',
                        border: '2px solid rgba(255, 255, 255, 0.3)',
                        borderTop: '2px solid white',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite'
                      }} />
                      Laster opp...
                    </div>
                  ) : (
                    <>🔔 Publiser</>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Error and Success Messages */}
      {error && (
        <div className="fixed top-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg z-50">
          {error}
        </div>
      )}
      
      {success && (
        <div className="fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50">
          {success}
        </div>
      )}

      {/* Job Management Modal */}
      {showJobManagementModal && (
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
            borderRadius: '16px',
            width: '90%',
            maxWidth: '1000px',
            maxHeight: '90vh',
            overflow: 'hidden',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
          }}>
            {/* Header */}
            <div style={{
              padding: '2rem',
              borderBottom: '1px solid #e5e7eb',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div>
                <h2 style={{ 
                  fontSize: '1.5rem', 
                  fontWeight: '700', 
                  margin: '0 0 0.5rem 0',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem'
                }}>
                  <Clock style={{ width: '24px', height: '24px' }} />
                  Administrer Jobber og Skift
                </h2>
                <p style={{ 
                  fontSize: '0.875rem', 
                  opacity: 0.9, 
                  margin: 0 
                }}>
                  Rediger navn, farger, datoer og beskrivelser for alle jobber
                </p>
              </div>
              <button
                onClick={() => setShowJobManagementModal(false)}
                style={{
                  background: 'rgba(255, 255, 255, 0.2)',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '0.5rem',
                  color: 'white',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
                }}
              >
                <X style={{ width: '20px', height: '20px' }} />
              </button>
            </div>

            {/* Content */}
            <div style={{ padding: '2rem', maxHeight: '70vh', overflowY: 'auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: '600', margin: 0, color: '#374151' }}>
                  Alle Jobber ({jobs.length})
                </h3>
                <button
                  onClick={() => setEditingJob({
                    id: Date.now().toString(),
                    name: '',
                    color: '#3b82f6',
                    startTime: '08:00',
                    endTime: '16:00',
                    description: ''
                  })}
                  style={{
                    background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '0.75rem 1.5rem',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'linear-gradient(135deg, #1d4ed8 0%, #1e40af 100%)';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  <Plus style={{ width: '16px', height: '16px' }} />
                  Legg til ny jobb
                </button>
              </div>

              {/* Jobs Grid */}
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', 
                gap: '1rem' 
              }}>
                {jobs.map((job) => (
                  <div 
                    key={job.id}
                    style={{
                      background: 'white',
                      border: '1px solid #e5e7eb',
                      borderRadius: '12px',
                      padding: '1.5rem',
                      transition: 'all 0.2s',
                      cursor: 'pointer',
                      position: 'relative',
                      overflow: 'hidden'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = '#3b82f6';
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.15)';
                      e.currentTarget.style.transform = 'translateY(-2px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = '#e5e7eb';
                      e.currentTarget.style.boxShadow = 'none';
                      e.currentTarget.style.transform = 'translateY(0)';
                    }}
                    onClick={() => setEditingJob(job)}
                  >
                    {/* Color indicator */}
                    <div style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      height: '4px',
                      background: job.color
                    }} />
                    
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                      <div style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '10px',
                        background: job.color,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontWeight: '700',
                        fontSize: '1rem',
                        flexShrink: 0
                      }}>
                        {job.name.charAt(0).toUpperCase()}
                      </div>
                      
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <h4 style={{
                          fontSize: '1rem',
                          fontWeight: '600',
                          color: '#374151',
                          margin: '0 0 0.5rem 0',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}>
                          {job.name}
                        </h4>
                        
                        <p style={{
                          fontSize: '0.875rem',
                          color: '#6b7280',
                          margin: '0 0 0.75rem 0',
                          lineHeight: '1.4'
                        }}>
                          {job.description}
                        </p>
                        
                        <div style={{ display: 'flex', gap: '1rem', fontSize: '0.75rem', color: '#6b7280' }}>
                          <span>Start: {job.startTime}</span>
                          <span>Slutt: {job.endTime}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Job Edit Modal */}
      {editingJob && (
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
          zIndex: 1001
        }}>
          <div style={{
            background: 'white',
            borderRadius: '16px',
            width: '90%',
            maxWidth: '500px',
            maxHeight: '90vh',
            overflow: 'hidden',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
          }}>
            {/* Header */}
            <div style={{
              padding: '1.5rem',
              borderBottom: '1px solid #e5e7eb',
              background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '600', margin: 0 }}>
                {editingJob.id === Date.now().toString() ? 'Legg til ny jobb' : 'Rediger jobb'}
              </h3>
              <button
                onClick={() => setEditingJob(null)}
                style={{
                  background: 'rgba(255, 255, 255, 0.2)',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '0.5rem',
                  color: 'white',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <X style={{ width: '20px', height: '20px' }} />
              </button>
            </div>

            {/* Form */}
            <div style={{ padding: '1.5rem' }}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#374151' }}>
                  Navn
                </label>
                <input
                  type="text"
                  value={editingJob.name}
                  onChange={(e) => setEditingJob(prev => prev ? { ...prev, name: e.target.value } : null)}
                  placeholder="Skriv inn jobb-navn"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '0.875rem',
                    outline: 'none'
                  }}
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#374151' }}>
                  Beskrivelse
                </label>
                <textarea
                  value={editingJob.description}
                  onChange={(e) => setEditingJob(prev => prev ? { ...prev, description: e.target.value } : null)}
                  placeholder="Skriv inn beskrivelse"
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '0.875rem',
                    outline: 'none',
                    resize: 'vertical'
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#374151' }}>
                    Start klokkeslett
                  </label>
                  <input
                    type="time"
                    value={editingJob.startTime}
                    onChange={(e) => setEditingJob(prev => prev ? { ...prev, startTime: e.target.value } : null)}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      fontSize: '0.875rem',
                      outline: 'none'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#374151' }}>
                    Slutt klokkeslett
                  </label>
                  <input
                    type="time"
                    value={editingJob.endTime}
                    onChange={(e) => setEditingJob(prev => prev ? { ...prev, endTime: e.target.value } : null)}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      fontSize: '0.875rem',
                      outline: 'none'
                    }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#374151' }}>
                  Farge
                </label>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {['#ef4444', '#f97316', '#eab308', '#22c55e', '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899', '#6b7280', '#9ca3af', '#10b981', '#f59e0b', '#dc2626'].map((color) => (
                    <button
                      key={color}
                      onClick={() => setEditingJob(prev => prev ? { ...prev, color } : null)}
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '8px',
                        background: color,
                        border: editingJob.color === color ? '3px solid #374151' : '2px solid #e5e7eb',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                    />
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => setEditingJob(null)}
                  style={{
                    background: '#f3f4f6',
                    color: '#374151',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    padding: '0.75rem 1.5rem',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  Avbryt
                </button>
                <button
                  onClick={() => {
                    if (editingJob.id === Date.now().toString()) {
                      // Add new job
                      setJobs(prev => [...prev, { ...editingJob, id: Date.now().toString() }]);
                    } else {
                      // Update existing job
                      setJobs(prev => prev.map(job => job.id === editingJob.id ? editingJob : job));
                    }
                    setEditingJob(null);
                  }}
                  disabled={!editingJob.name.trim()}
                  style={{
                    background: editingJob.name.trim() ? 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)' : '#9ca3af',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '0.75rem 1.5rem',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    cursor: editingJob.name.trim() ? 'pointer' : 'not-allowed',
                    transition: 'all 0.2s'
                  }}
                >
                  {editingJob.id === Date.now().toString() ? 'Legg til' : 'Lagre endringer'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create User Modal */}
      {showCreateUserModal && selectedPartnerForAction && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          backdropFilter: 'blur(4px)'
        }}>
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '2rem',
            maxWidth: '500px',
            width: '95%',
            maxHeight: '90vh',
            overflowY: 'auto',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: '600', margin: 0, color: '#1f2937' }}>
                Opprett Bruker
              </h2>
              <button
                onClick={() => {
                  setShowCreateUserModal(false);
                  setSelectedPartnerForAction(null);
                  setNewUser({ name: '', phone: '', password: '', email: '', role: 'user' });
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '1.5rem',
                  cursor: 'pointer',
                  color: '#6b7280'
                }}
              >
                ×
              </button>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <p style={{ color: '#6b7280', fontSize: '0.875rem', margin: '0 0 1rem 0' }}>
                Oppretter bruker for: <strong>{selectedPartnerForAction.name}</strong>
              </p>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#374151' }}>
                Navn
              </label>
              <input
                type="text"
                value={newUser.name}
                onChange={(e) => setNewUser(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Fyll inn navn"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '0.875rem',
                  outline: 'none'
                }}
              />
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#374151' }}>
                Telefonnummer
              </label>
              <input
                type="tel"
                value={newUser.phone}
                onChange={(e) => setNewUser(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="+47 123 45 678"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '0.875rem',
                  outline: 'none'
                }}
              />
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#374151' }}>
                E-post (valgfri)
              </label>
              <input
                type="email"
                value={newUser.email}
                onChange={(e) => setNewUser(prev => ({ ...prev, email: e.target.value }))}
                placeholder="bruker@partner.no"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '0.875rem',
                  outline: 'none'
                }}
              />
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#374151' }}>
                Rolle
              </label>
              <select
                value={newUser.role}
                onChange={(e) => setNewUser(prev => ({ ...prev, role: e.target.value as 'admin' | 'user' }))}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '0.875rem',
                  outline: 'none'
                }}
              >
                <option value="user">Bruker</option>
                <option value="admin">Administrator</option>
              </select>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#374151' }}>
                Passord
              </label>
              <input
                type="password"
                value={newUser.password}
                onChange={(e) => setNewUser(prev => ({ ...prev, password: e.target.value }))}
                placeholder="Fyll inn passord"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '0.875rem',
                  outline: 'none'
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  setShowCreateUserModal(false);
                  setSelectedPartnerForAction(null);
                  setNewUser({ name: '', phone: '', password: '', email: '', role: 'user' });
                }}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: 'white',
                  color: '#6b7280',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  fontWeight: '500'
                }}
              >
                Avbryt
              </button>
              <button
                onClick={handleCreateUser}
                disabled={!newUser.name || !newUser.phone || !newUser.password}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: !newUser.name || !newUser.phone || !newUser.password ? '#d1d5db' : '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: !newUser.name || !newUser.phone || !newUser.password ? 'not-allowed' : 'pointer',
                  fontSize: '0.875rem',
                  fontWeight: '500'
                }}
              >
                Opprett Bruker
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Partner Modal - Extended */}
      {showEditPartnerModal && editingPartner && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '1rem'
        }}>
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '2rem',
            width: '100%',
            maxWidth: '900px',
            maxHeight: '90vh',
            overflowY: 'auto',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
              <h2 style={{ 
                fontSize: '1.5rem', 
                fontWeight: '700', 
                color: '#1e293b',
                margin: 0,
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem'
              }}>
                <Edit style={{ width: '24px', height: '24px', color: '#f59e0b' }} />
                Rediger Partner - {editingPartner.name}
              </h2>
              <button
                onClick={() => {
                  setShowEditPartnerModal(false);
                  setEditingPartner(null);
                  setEditModalActiveTab('info');
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '1.5rem',
                  cursor: 'pointer',
                  color: '#6b7280'
                }}
              >
                ×
              </button>
            </div>

            {/* Tab Navigation */}
            <div style={{ 
              display: 'flex', 
              gap: '0.5rem', 
              marginBottom: '2rem',
              borderBottom: '1px solid #e5e7eb',
              paddingBottom: '1rem'
            }}>
              {[
                { id: 'info', label: 'Informasjon', icon: Building2 },
                { id: 'vehicles', label: 'Kjøretøy', icon: Building2 },
                { id: 'users', label: 'Brukere', icon: Users },
                { id: 'files', label: 'Filer', icon: FileUp }
              ].map((tab) => {
                const IconComponent = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setEditModalActiveTab(tab.id as any)}
                    style={{
                      padding: '0.75rem 1rem',
                      background: editModalActiveTab === tab.id ? '#3b82f6' : 'transparent',
                      color: editModalActiveTab === tab.id ? 'white' : '#6b7280',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      transition: 'all 0.2s'
                    }}
                  >
                    <IconComponent style={{ width: '16px', height: '16px' }} />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Tab Content */}
            {editModalActiveTab === 'info' && (
              <div>
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#374151' }}>
                    Bedriftsnavn (Søk i BRRG)
              </label>
                  <div style={{ position: 'relative' }} data-brrg-search>
              <input
                type="text"
                      placeholder="Søk bedriftsnavn i BRRG..."
                value={editingPartner.name}
                      onChange={(e) => {
                        const value = e.target.value;
                        console.log('📝 Edit modal input changed:', value);
                        console.log('📏 Value length:', value.length);
                        setEditingPartner(prev => prev ? { ...prev, name: value } : null);
                        setBrrgSearchQuery(value);
                        if (value.length >= 2) {
                          console.log('🚀 Edit modal triggering search for:', value);
                          searchBrrg(value);
                          setShowBrrgSearch(true);
                          console.log('👁️ Edit modal set showBrrgSearch to true');
                        } else {
                          console.log('❌ Edit modal query too short, hiding search');
                          setShowBrrgSearch(false);
                        }
                      }}
                      onFocus={() => {
                        if (brrgSearchQuery.length >= 2) {
                          setShowBrrgSearch(true);
                        }
                      }}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                        paddingRight: '2.5rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '0.875rem',
                  outline: 'none'
                }}
              />
                    <button
                      type="button"
                      onClick={() => {
                        setBrrgSearchQuery(editingPartner?.name || '');
                        if ((editingPartner?.name || '').length >= 2) {
                          searchBrrg(editingPartner?.name || '');
                          setShowBrrgSearch(true);
                        }
                      }}
                      style={{
                        position: 'absolute',
                        right: '0.5rem',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: '0.25rem',
                        color: '#3b82f6'
                      }}
                    >
                      <Search style={{ width: '16px', height: '16px' }} />
                    </button>
                  </div>
                  
                  {/* BRRG Search Results */}
                  {showBrrgSearch && (
                    <div style={{
                      position: 'absolute',
                      top: '100%',
                      left: 0,
                      right: 0,
                      background: 'white',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                      zIndex: 1000,
                      maxHeight: '200px',
                      overflowY: 'auto',
                      marginTop: '0.25rem'
                    }}>
                      {brrgSearchResults.length > 0 ? (
                        brrgSearchResults.map((company) => (
                        <div
                          key={company.organisasjonsnummer}
                          onClick={() => selectBrrgCompany(company)}
                          style={{
                            padding: '0.75rem',
                            cursor: 'pointer',
                            borderBottom: '1px solid #f3f4f6',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = '#f9fafb';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'white';
                          }}
                        >
                          <div>
                            <div style={{ fontWeight: '500', color: '#1f2937' }}>
                              {company.navn}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                              Org.nr: {company.organisasjonsnummer} • {company.naeringskode1?.beskrivelse || 'Ukjent bransje'}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>
                              {company.adresse?.adresse?.join(', ')} • {company.adresse?.postnummer} {company.adresse?.poststed}
                            </div>
                          </div>
                        </div>
                        ))
                      ) : (
                        <div style={{ padding: '1rem', textAlign: 'center', color: '#6b7280' }}>
                          {searchingBrrg ? 'Søker...' : 'Ingen resultater funnet'}
                        </div>
                      )}
                    </div>
                  )}
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#374151' }}>
                    Organisasjonsnummer (Søk i BRRG)
              </label>
                  <div style={{ position: 'relative' }} data-brrg-search>
              <input
                type="text"
                      placeholder="Søk organisasjonsnummer i BRRG..."
                value={editingPartner.orgNumber || ''}
                      onChange={(e) => {
                        setEditingPartner(prev => prev ? { ...prev, orgNumber: e.target.value } : null);
                        setBrrgSearchQuery(e.target.value);
                        if (e.target.value.length >= 2) {
                          searchBrrg(e.target.value);
                          setShowBrrgSearch(true);
                        } else {
                          setShowBrrgSearch(false);
                        }
                      }}
                      onFocus={() => {
                        if (brrgSearchQuery.length >= 2) {
                          setShowBrrgSearch(true);
                        }
                      }}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                        paddingRight: '2.5rem',
                        border: '1px solid #d1d5db',
                        borderRadius: '8px',
                        fontSize: '0.875rem',
                        outline: 'none'
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setBrrgSearchQuery(editingPartner?.orgNumber || '');
                        if ((editingPartner?.orgNumber || '').length >= 2) {
                          searchBrrg(editingPartner?.orgNumber || '');
                          setShowBrrgSearch(true);
                        }
                      }}
                      style={{
                        position: 'absolute',
                        right: '0.5rem',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: '0.25rem',
                        color: '#3b82f6'
                      }}
                    >
                      <Search style={{ width: '16px', height: '16px' }} />
                    </button>
                  </div>
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#374151' }}>
                    Bransje
                  </label>
                  <input
                    type="text"
                    value={editingPartner.industry || ''}
                    onChange={(e) => setEditingPartner(prev => prev ? { ...prev, industry: e.target.value } : null)}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '0.875rem',
                  outline: 'none'
                }}
              />
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#374151' }}>
                Kontaktperson navn
              </label>
              <input
                type="text"
                value={editingPartner.contactPerson?.name || ''}
                onChange={(e) => setEditingPartner(prev => prev ? { 
                  ...prev, 
                  contactPerson: { 
                    ...prev.contactPerson, 
                    name: e.target.value 
                  } 
                } : null)}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '0.875rem',
                  outline: 'none'
                }}
              />
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#374151' }}>
                E-post
              </label>
              <input
                type="email"
                value={editingPartner.contactPerson?.email || ''}
                onChange={(e) => setEditingPartner(prev => prev ? { 
                  ...prev, 
                  contactPerson: { 
                    ...prev.contactPerson, 
                    email: e.target.value 
                  } 
                } : null)}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '0.875rem',
                  outline: 'none'
                }}
              />
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#374151' }}>
                Telefonnummer
              </label>
              <input
                type="tel"
                value={editingPartner.contactPerson?.phone || ''}
                onChange={(e) => setEditingPartner(prev => prev ? { 
                  ...prev, 
                  contactPerson: { 
                    ...prev.contactPerson, 
                    phone: e.target.value 
                  } 
                } : null)}
                    placeholder="+47 123 45 678"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '0.875rem',
                  outline: 'none'
                }}
              />
            </div>

                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#374151' }}>
                    Stilling
                  </label>
                  <input
                    type="text"
                    value={editingPartner.contactPerson?.position || ''}
                    onChange={(e) => setEditingPartner(prev => prev ? { 
                      ...prev, 
                      contactPerson: { 
                        ...prev.contactPerson, 
                        position: e.target.value 
                      } 
                    } : null)}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      fontSize: '0.875rem',
                      outline: 'none'
                    }}
                  />
                </div>
              </div>
            )}

            {editModalActiveTab === 'vehicles' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                  <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#374151', margin: 0 }}>
                    Kjøretøy ({editingVehicles.length})
                  </h3>
                  <button
                    onClick={() => {
                      setEditingVehicles(prev => [...prev, {
                        registrationNumber: '',
                        year: new Date().getFullYear().toString(),
                        model: '',
                        euroClass: '',
                        payload: ''
                      }]);
                    }}
                    style={{
                      padding: '0.5rem 1rem',
                      background: '#10b981',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}
                  >
                    <Plus style={{ width: '16px', height: '16px' }} />
                    Legg til kjøretøy
                  </button>
                </div>

                {editingVehicles.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
                    <Building2 style={{ width: '48px', height: '48px', margin: '0 auto 1rem', opacity: 0.5 }} />
                    <p>Ingen kjøretøy registrert</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {editingVehicles.map((vehicle, index) => (
                      <div key={index} style={{
                        padding: '1rem',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        backgroundColor: '#f9fafb'
                      }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                          <div>
                            <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.75rem', fontWeight: '500', color: '#374151' }}>
                              Registreringsnummer
                            </label>
                            <input
                              type="text"
                              value={vehicle.registrationNumber}
                              onChange={(e) => {
                                const newVehicles = [...editingVehicles];
                                newVehicles[index].registrationNumber = e.target.value;
                                setEditingVehicles(newVehicles);
                              }}
                              style={{
                                width: '100%',
                                padding: '0.5rem',
                                border: '1px solid #d1d5db',
                                borderRadius: '6px',
                                fontSize: '0.875rem',
                                outline: 'none'
                              }}
                            />
                          </div>
                          <div>
                            <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.75rem', fontWeight: '500', color: '#374151' }}>
                              Årsmodell
                            </label>
                            <input
                              type="text"
                              value={vehicle.year}
                              onChange={(e) => {
                                const newVehicles = [...editingVehicles];
                                newVehicles[index].year = e.target.value;
                                setEditingVehicles(newVehicles);
                              }}
                              style={{
                                width: '100%',
                                padding: '0.5rem',
                                border: '1px solid #d1d5db',
                                borderRadius: '6px',
                                fontSize: '0.875rem',
                                outline: 'none'
                              }}
                            />
                          </div>
                          <div>
                            <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.75rem', fontWeight: '500', color: '#374151' }}>
                              Modell
                            </label>
                            <input
                              type="text"
                              value={vehicle.model}
                              onChange={(e) => {
                                const newVehicles = [...editingVehicles];
                                newVehicles[index].model = e.target.value;
                                setEditingVehicles(newVehicles);
                              }}
                              style={{
                                width: '100%',
                                padding: '0.5rem',
                                border: '1px solid #d1d5db',
                                borderRadius: '6px',
                                fontSize: '0.875rem',
                                outline: 'none'
                              }}
                            />
                          </div>
                          <div>
                            <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.75rem', fontWeight: '500', color: '#374151' }}>
                              Euroklasse
                            </label>
                            <input
                              type="text"
                              value={vehicle.euroClass}
                              onChange={(e) => {
                                const newVehicles = [...editingVehicles];
                                newVehicles[index].euroClass = e.target.value;
                                setEditingVehicles(newVehicles);
                              }}
                              style={{
                                width: '100%',
                                padding: '0.5rem',
                                border: '1px solid #d1d5db',
                                borderRadius: '6px',
                                fontSize: '0.875rem',
                                outline: 'none'
                              }}
                            />
                          </div>
                          <div>
                            <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.75rem', fontWeight: '500', color: '#374151' }}>
                              Nyttelast
                            </label>
                            <input
                              type="text"
                              value={vehicle.payload}
                              onChange={(e) => {
                                const newVehicles = [...editingVehicles];
                                newVehicles[index].payload = e.target.value;
                                setEditingVehicles(newVehicles);
                              }}
                              style={{
                                width: '100%',
                                padding: '0.5rem',
                                border: '1px solid #d1d5db',
                                borderRadius: '6px',
                                fontSize: '0.875rem',
                                outline: 'none'
                              }}
                            />
                          </div>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                          <button
                            onClick={() => {
                              setEditingVehicles(prev => prev.filter((_, i) => i !== index));
                            }}
                            style={{
                              padding: '0.5rem',
                              background: '#fee2e2',
                              color: '#dc2626',
                              border: '1px solid #fecaca',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              fontSize: '0.75rem'
                            }}
                          >
                            Fjern
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {editModalActiveTab === 'users' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                  <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#374151', margin: 0 }}>
                    Brukere ({partnerUsers.length})
                  </h3>
                  <button
                    onClick={() => setShowCreateUserModal(true)}
                    style={{
                      padding: '0.5rem 1rem',
                      background: '#10b981',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}
                  >
                    <UserPlus style={{ width: '16px', height: '16px' }} />
                    Ny Bruker
                  </button>
                </div>

                {partnerUsers.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
                    <Users style={{ width: '48px', height: '48px', margin: '0 auto 1rem', opacity: 0.5 }} />
                    <p>Ingen brukere registrert ennå</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {partnerUsers.map((user) => (
                      <div
                        key={user.id}
                        style={{
                          padding: '1rem',
                          border: '1px solid #e2e8f0',
                          borderRadius: '8px',
                          backgroundColor: 'white',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                          <div style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '50%',
                            backgroundColor: user.role === 'admin' ? '#3b82f6' : '#6b7280',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                            fontWeight: '600',
                            fontSize: '0.875rem'
                          }}>
                            {user.name.split(' ').map((n: string) => n[0]).join('').toUpperCase()}
                          </div>
                          <div>
                            <h4 style={{ 
                              fontSize: '1rem', 
                              fontWeight: '600', 
                              color: '#1e293b',
                              margin: '0 0 0.25rem 0'
                            }}>
                              {user.name}
                            </h4>
                            <p style={{ 
                              fontSize: '0.875rem', 
                              color: '#6b7280',
                              margin: '0 0 0.25rem 0'
                            }}>
                              {user.email}
                            </p>
                            <div style={{ display: 'flex', gap: '1rem', fontSize: '0.75rem', color: '#6b7280' }}>
                              <span>{user.phone}</span>
                              <span>•</span>
                              <span style={{ 
                                color: user.role === 'admin' ? '#3b82f6' : '#6b7280',
                                fontWeight: '500'
                              }}>
                                {user.role === 'admin' ? 'Administrator' : 'Bruker'}
                              </span>
                              <span>•</span>
                              <span>Sist innlogget: {user.lastLogin}</span>
                            </div>
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button
                            onClick={() => {
                              // Here you would typically edit the user
                              console.log('Edit user:', user.name);
                            }}
                            style={{
                              padding: '0.5rem',
                              background: '#f3f4f6',
                              color: '#374151',
                              border: '1px solid #d1d5db',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              fontSize: '0.75rem'
                            }}
                          >
                            Rediger
                          </button>
                          <button
                            onClick={() => {
                              setPartnerUsers(prev => prev.filter(u => u.id !== user.id));
                              setSuccess('Bruker fjernet');
                            }}
                            style={{
                              padding: '0.5rem',
                              background: '#fee2e2',
                              color: '#dc2626',
                              border: '1px solid #fecaca',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              fontSize: '0.75rem'
                            }}
                          >
                            Fjern
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {editModalActiveTab === 'files' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                  <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#374151', margin: 0 }}>
                    Filer ({editingFiles.length})
                  </h3>
                  <input
                    type="file"
                    multiple
                    onChange={(e) => {
                      if (e.target.files) {
                        setEditingFiles(prev => [...prev, ...Array.from(e.target.files!)]);
                      }
                    }}
                    style={{ display: 'none' }}
                    id="file-upload"
                  />
                  <label
                    htmlFor="file-upload"
                    style={{
                      padding: '0.5rem 1rem',
                      background: '#10b981',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}
                  >
                    <FileUp style={{ width: '16px', height: '16px' }} />
                    Last opp filer
                  </label>
                </div>

                {editingFiles.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
                    <FileUp style={{ width: '48px', height: '48px', margin: '0 auto 1rem', opacity: 0.5 }} />
                    <p>Ingen filer lastet opp</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {editingFiles.map((file, index) => (
                      <div
                        key={index}
                        style={{
                          padding: '1rem',
                          border: '1px solid #e2e8f0',
                          borderRadius: '8px',
                          backgroundColor: 'white',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                          <FileText style={{ width: '24px', height: '24px', color: '#6b7280' }} />
                          <div>
                            <h4 style={{ 
                              fontSize: '0.875rem', 
                              fontWeight: '500', 
                              color: '#1e293b',
                              margin: '0 0 0.25rem 0'
                            }}>
                              {file.name}
                            </h4>
                            <p style={{ 
                              fontSize: '0.75rem', 
                              color: '#6b7280',
                              margin: 0
                            }}>
                              {(file.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            setEditingFiles(prev => prev.filter((_, i) => i !== index));
                          }}
                          style={{
                            padding: '0.5rem',
                            background: '#fee2e2',
                            color: '#dc2626',
                            border: '1px solid #fecaca',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '0.75rem'
                          }}
                        >
                          Fjern
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '2rem', paddingTop: '1rem', borderTop: '1px solid #e5e7eb' }}>
              <button
                onClick={() => {
                  setShowEditPartnerModal(false);
                  setEditingPartner(null);
                  setEditModalActiveTab('info');
                }}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: 'white',
                  color: '#6b7280',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  fontWeight: '500'
                }}
              >
                Avbryt
              </button>
              <button
                onClick={async () => {
                  if (!editingPartner) return;
                  
                  try {
                    const updatedPartner = {
                      ...editingPartner,
                      vehicles: editingVehicles
                    };
                    await firebaseService.updatePartner(editingPartner.id, updatedPartner);
                    setSuccess('Partner oppdatert!');
                    setShowEditPartnerModal(false);
                    setEditingPartner(null);
                    setEditModalActiveTab('info');
                    loadPartners(); // Reload partners
                  } catch (error) {
                    console.error('Error updating partner:', error);
                    setError('Feil ved oppdatering av partner');
                  }
                }}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  fontWeight: '500'
                }}
              >
                Lagre Endringer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Audit Modal */}
      {showCreateAuditModal && selectedPartnerForAudit && (
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
          zIndex: 1000,
          padding: '1rem'
        }}>
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '2rem',
            width: '100%',
            maxWidth: '800px',
            maxHeight: '90vh',
            overflowY: 'auto',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
              <h2 style={{ 
                fontSize: '1.5rem', 
                fontWeight: '700', 
                color: '#1e293b',
                margin: 0,
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem'
              }}>
                <ClipboardCheck style={{ width: '24px', height: '24px', color: '#3b82f6' }} />
                Opprett Audit - {selectedPartnerForAudit.name}
              </h2>
              <button
                onClick={() => {
                  setShowCreateAuditModal(false);
                  setSelectedPartnerForAudit(null);
                  setNewAudit({
                    partnerId: '',
                    scheduledDate: '',
                    notes: '',
                    status: 'scheduled',
                    auditType: 'quarterly',
                    documents: {
                      navRegistration: false,
                      timeSheets: false,
                      paySlips: false,
                      employmentContracts: false
                    },
                    findings: '',
                    recommendations: '',
                    nextAuditDate: ''
                  });
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '0.5rem',
                  borderRadius: '0.5rem',
                  color: '#6b7280',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <X style={{ width: '20px', height: '20px' }} />
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#374151' }}>
                  Audit Type
                </label>
                <select
                  value={newAudit.auditType}
                  onChange={(e) => setNewAudit(prev => ({ ...prev, auditType: e.target.value as any }))}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '0.875rem',
                    outline: 'none'
                  }}
                >
                  <option value="quarterly">Kvartalsvis (3 mnd)</option>
                  <option value="annual">Årlig</option>
                  <option value="special">Spesial</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#374151' }}>
                  Status
                </label>
                <select
                  value={newAudit.status}
                  onChange={(e) => setNewAudit(prev => ({ ...prev, status: e.target.value as any }))}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '0.875rem',
                    outline: 'none'
                  }}
                >
                  <option value="scheduled">Planlagt</option>
                  <option value="in_progress">Pågår</option>
                  <option value="completed">Fullført</option>
                  <option value="overdue">Forsinket</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#374151' }}>
                  Planlagt Dato
                </label>
                <input
                  type="date"
                  value={newAudit.scheduledDate}
                  onChange={(e) => setNewAudit(prev => ({ ...prev, scheduledDate: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '0.875rem',
                    outline: 'none'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#374151' }}>
                  Neste Audit Dato
                </label>
                <input
                  type="date"
                  value={newAudit.nextAuditDate}
                  onChange={(e) => setNewAudit(prev => ({ ...prev, nextAuditDate: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '0.875rem',
                    outline: 'none'
                  }}
                />
              </div>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#374151', marginBottom: '1rem' }}>
                Dokumenter som skal kontrolleres
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={newAudit.documents.navRegistration}
                    onChange={(e) => setNewAudit(prev => ({
                      ...prev,
                      documents: { ...prev.documents, navRegistration: e.target.checked }
                    }))}
                    style={{ width: '16px', height: '16px' }}
                  />
                  <span style={{ fontSize: '0.875rem', color: '#374151' }}>
                    NAV AA-registrering
                  </span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={newAudit.documents.timeSheets}
                    onChange={(e) => setNewAudit(prev => ({
                      ...prev,
                      documents: { ...prev.documents, timeSheets: e.target.checked }
                    }))}
                    style={{ width: '16px', height: '16px' }}
                  />
                  <span style={{ fontSize: '0.875rem', color: '#374151' }}>
                    Timelister (elektronisk stemplingssystem)
                  </span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={newAudit.documents.paySlips}
                    onChange={(e) => setNewAudit(prev => ({
                      ...prev,
                      documents: { ...prev.documents, paySlips: e.target.checked }
                    }))}
                    style={{ width: '16px', height: '16px' }}
                  />
                  <span style={{ fontSize: '0.875rem', color: '#374151' }}>
                    Lønnsslipper
                  </span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={newAudit.documents.employmentContracts}
                    onChange={(e) => setNewAudit(prev => ({
                      ...prev,
                      documents: { ...prev.documents, employmentContracts: e.target.checked }
                    }))}
                    style={{ width: '16px', height: '16px' }}
                  />
                  <span style={{ fontSize: '0.875rem', color: '#374151' }}>
                    Arbeidsavtaler
                  </span>
                </label>
              </div>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#374151' }}>
                Notater
              </label>
              <textarea
                value={newAudit.notes}
                onChange={(e) => setNewAudit(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Legg til notater om audit..."
                rows={3}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '0.875rem',
                  outline: 'none',
                  resize: 'vertical'
                }}
              />
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#374151' }}>
                Funn
              </label>
              <textarea
                value={newAudit.findings}
                onChange={(e) => setNewAudit(prev => ({ ...prev, findings: e.target.value }))}
                placeholder="Beskriv eventuelle funn under audit..."
                rows={3}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '0.875rem',
                  outline: 'none',
                  resize: 'vertical'
                }}
              />
            </div>

            <div style={{ marginBottom: '2rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#374151' }}>
                Anbefalinger
              </label>
              <textarea
                value={newAudit.recommendations}
                onChange={(e) => setNewAudit(prev => ({ ...prev, recommendations: e.target.value }))}
                placeholder="Legg til anbefalinger basert på audit..."
                rows={3}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '0.875rem',
                  outline: 'none',
                  resize: 'vertical'
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  setShowCreateAuditModal(false);
                  setSelectedPartnerForAudit(null);
                  setNewAudit({
                    partnerId: '',
                    scheduledDate: '',
                    notes: '',
                    status: 'scheduled',
                    auditType: 'quarterly',
                    documents: {
                      navRegistration: false,
                      timeSheets: false,
                      paySlips: false,
                      employmentContracts: false
                    },
                    findings: '',
                    recommendations: '',
                    nextAuditDate: ''
                  });
                }}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: 'white',
                  color: '#6b7280',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  fontWeight: '500'
                }}
              >
                Avbryt
              </button>
              <button
                onClick={async () => {
                  try {
                    // Her vil du implementere lagring av audit til Firebase
                    console.log('Creating audit:', newAudit);
                    setSuccess('Audit opprettet!');
                    setShowCreateAuditModal(false);
                    setSelectedPartnerForAudit(null);
                    setNewAudit({
                      partnerId: '',
                      scheduledDate: '',
                      notes: '',
                      status: 'scheduled',
                      auditType: 'quarterly',
                      documents: {
                        navRegistration: false,
                        timeSheets: false,
                        paySlips: false,
                        employmentContracts: false
                      },
                      findings: '',
                      recommendations: '',
                      nextAuditDate: ''
                    });
                  } catch (error) {
                    console.error('Error creating audit:', error);
                    setError('Feil ved opprettelse av audit');
                  }
                }}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  fontWeight: '500'
                }}
              >
                Opprett Audit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notification Modal */}
      {showNotificationModal && (
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
          zIndex: 1000,
          padding: '1rem'
        }}>
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '2rem',
            width: '100%',
            maxWidth: '600px',
            maxHeight: '80vh',
            overflowY: 'auto',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
              <h2 style={{ 
                fontSize: '1.5rem', 
                fontWeight: '700', 
                color: '#1e293b',
                margin: 0,
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem'
              }}>
                <AlertTriangle style={{ width: '24px', height: '24px', color: '#dc2626' }} />
                Audit Varsler
              </h2>
              <button
                onClick={() => setShowNotificationModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '0.5rem',
                  borderRadius: '0.5rem',
                  color: '#6b7280',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <X style={{ width: '20px', height: '20px' }} />
              </button>
            </div>

            {auditNotifications.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
                <AlertTriangle style={{ width: '48px', height: '48px', margin: '0 auto 1rem', opacity: 0.5 }} />
                <p>Ingen audit-varsler for øyeblikket</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {auditNotifications.map((notification, index) => {
                  const getNotificationStyle = (type: string, read: boolean) => {
                    switch (type) {
                      case 'overdue':
                        return {
                          backgroundColor: read ? '#f9fafb' : '#fef2f2',
                          borderLeft: `4px solid ${read ? '#d1d5db' : '#dc2626'}`,
                          icon: AlertTriangle,
                          iconColor: '#dc2626'
                        };
                      case 'upcoming':
                        return {
                          backgroundColor: read ? '#f9fafb' : '#f0f9ff',
                          borderLeft: `4px solid ${read ? '#d1d5db' : '#3b82f6'}`,
                          icon: Calendar,
                          iconColor: '#3b82f6'
                        };
                      default:
                        return {
                          backgroundColor: read ? '#f9fafb' : '#fef2f2',
                          borderLeft: `4px solid ${read ? '#d1d5db' : '#dc2626'}`,
                          icon: AlertTriangle,
                          iconColor: '#dc2626'
                        };
                    }
                  };
                  
                  const style = getNotificationStyle(notification.type, notification.read);
                  const IconComponent = style.icon;
                  
                  return (
                    <div
                      key={notification.id}
                      style={{
                        padding: '1rem',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                        backgroundColor: style.backgroundColor,
                        borderLeft: style.borderLeft
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                          <IconComponent style={{ width: '16px', height: '16px', color: style.iconColor, marginTop: '0.125rem' }} />
                          <div>
                            <h3 style={{ 
                              fontSize: '1rem', 
                              fontWeight: '600', 
                              color: '#1e293b',
                              margin: '0 0 0.25rem 0'
                            }}>
                              {notification.partnerName}
                            </h3>
                            <p style={{ 
                              fontSize: '0.875rem', 
                              color: '#6b7280',
                              margin: 0
                            }}>
                              {notification.message}
                            </p>
                            <span style={{ 
                              fontSize: '0.75rem', 
                              color: style.iconColor,
                              fontWeight: '500'
                            }}>
                              {notification.type === 'overdue' ? 'Forsinket' : notification.type === 'upcoming' ? 'Kommende' : 'Audit'}
                            </span>
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                          <span style={{ 
                            fontSize: '0.75rem', 
                            color: '#6b7280' 
                          }}>
                            {new Date(notification.timestamp).toLocaleDateString('no-NO')}
                          </span>
                          {!notification.read && (
                            <span style={{
                              width: '8px',
                              height: '8px',
                              backgroundColor: style.iconColor,
                              borderRadius: '50%'
                            }} />
                          )}
                        </div>
                      </div>
                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
                      <button
                        onClick={() => {
                          setAuditNotifications(prev => 
                            prev.map(n => n.id === notification.id ? { ...n, read: true } : n)
                          );
                        }}
                        style={{
                          padding: '0.25rem 0.75rem',
                          background: '#f3f4f6',
                          color: '#374151',
                          border: '1px solid #d1d5db',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '0.75rem'
                        }}
                      >
                        Merk som lest
                      </button>
                      <button
                        onClick={() => {
                          setAuditNotifications(prev => prev.filter(n => n.id !== notification.id));
                        }}
                        style={{
                          padding: '0.25rem 0.75rem',
                          background: '#fee2e2',
                          color: '#dc2626',
                          border: '1px solid #fecaca',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '0.75rem'
                        }}
                      >
                        Fjern
                      </button>
                    </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '2rem' }}>
              <button
                onClick={() => setShowNotificationModal(false)}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: 'white',
                  color: '#6b7280',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  fontWeight: '500'
                }}
              >
                Lukk
              </button>
              {auditNotifications.length > 0 && (
                <button
                  onClick={() => {
                    setAuditNotifications([]);
                    setSuccess('Alle varsler fjernet');
                  }}
                  style={{
                    padding: '0.75rem 1.5rem',
                    background: '#dc2626',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                    fontWeight: '500'
                  }}
                >
                  Fjern alle
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Documents Modal */}
      {showDocumentsModal && selectedPartnerForDocuments && (
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
          zIndex: 1000,
          padding: '1rem'
        }}>
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '2rem',
            width: '100%',
            maxWidth: '900px',
            maxHeight: '90vh',
            overflowY: 'auto',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
              <h2 style={{ 
                fontSize: '1.5rem', 
                fontWeight: '700', 
                color: '#1e293b',
                margin: 0,
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem'
              }}>
                <FileText style={{ width: '24px', height: '24px', color: '#3b82f6' }} />
                Dokumenter - {selectedPartnerForDocuments.name}
              </h2>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  onClick={() => setShowUploadModal(true)}
                  style={{
                    padding: '0.5rem 1rem',
                    background: '#3b82f6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}
                >
                  <FileUp style={{ width: '16px', height: '16px' }} />
                  Last Opp
                </button>
                <button
                  onClick={() => {
                    setShowDocumentsModal(false);
                    setSelectedPartnerForDocuments(null);
                    setPartnerDocuments([]);
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '0.5rem',
                    borderRadius: '0.5rem',
                    color: '#6b7280',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <X style={{ width: '20px', height: '20px' }} />
                </button>
              </div>
            </div>

            {/* Document Categories */}
            <div style={{ marginBottom: '2rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                {['contract', 'framework', 'audit', 'other'].map(category => {
                  const categoryInfo = getCategoryInfo(category);
                  const categoryDocs = partnerDocuments.filter(doc => doc.category === category);
                  const IconComponent = categoryInfo.icon;
                  
                  return (
                    <div
                      key={category}
                      style={{
                        padding: '1rem',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                        backgroundColor: '#f9fafb',
                        cursor: 'pointer'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                        <IconComponent style={{ width: '20px', height: '20px', color: categoryInfo.color }} />
                        <span style={{ fontWeight: '600', color: '#1e293b' }}>
                          {categoryInfo.label}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                        {categoryDocs.length} dokumenter
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Documents List */}
            <div style={{ marginBottom: '2rem' }}>
              <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#374151', marginBottom: '1rem' }}>
                Alle Dokumenter ({partnerDocuments.length})
              </h3>
              
              {partnerDocuments.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
                  <FileText style={{ width: '48px', height: '48px', margin: '0 auto 1rem', opacity: 0.5 }} />
                  <p>Ingen dokumenter lastet opp ennå</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {partnerDocuments.map((document) => {
                    const categoryInfo = getCategoryInfo(document.category);
                    const IconComponent = categoryInfo.icon;
                    
                    return (
                      <div
                        key={document.id}
                        style={{
                          padding: '1rem',
                          border: '1px solid #e2e8f0',
                          borderRadius: '8px',
                          backgroundColor: 'white',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                          <div style={{
                            padding: '0.5rem',
                            borderRadius: '8px',
                            backgroundColor: categoryInfo.color + '20',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}>
                            <IconComponent style={{ width: '20px', height: '20px', color: categoryInfo.color }} />
                          </div>
                          <div>
                            <h4 style={{ 
                              fontSize: '1rem', 
                              fontWeight: '600', 
                              color: '#1e293b',
                              margin: '0 0 0.25rem 0'
                            }}>
                              {document.name}
                            </h4>
                            <p style={{ 
                              fontSize: '0.875rem', 
                              color: '#6b7280',
                              margin: '0 0 0.25rem 0'
                            }}>
                              {document.description}
                            </p>
                            <div style={{ display: 'flex', gap: '1rem', fontSize: '0.75rem', color: '#6b7280' }}>
                              <span>{categoryInfo.label}</span>
                              <span>•</span>
                              <span>{document.fileSize}</span>
                              <span>•</span>
                              <span>{document.fileType}</span>
                              <span>•</span>
                              <span>{document.uploadDate}</span>
                            </div>
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button
                            onClick={() => {
                              // Here you would typically download the file
                              console.log('Download document:', document.name);
                            }}
                            style={{
                              padding: '0.5rem',
                              background: '#f3f4f6',
                              color: '#374151',
                              border: '1px solid #d1d5db',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              fontSize: '0.75rem'
                            }}
                          >
                            Last Ned
                          </button>
                          <button
                            onClick={() => {
                              setPartnerDocuments(prev => prev.filter(doc => doc.id !== document.id));
                              setSuccess('Dokument fjernet');
                            }}
                            style={{
                              padding: '0.5rem',
                              background: '#fee2e2',
                              color: '#dc2626',
                              border: '1px solid #fecaca',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              fontSize: '0.75rem'
                            }}
                          >
                            Fjern
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Upload Document Modal */}
      {showUploadModal && selectedPartnerForDocuments && (
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
          zIndex: 1001,
          padding: '1rem'
        }}>
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '2rem',
            width: '100%',
            maxWidth: '500px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
              <h2 style={{ 
                fontSize: '1.5rem', 
                fontWeight: '700', 
                color: '#1e293b',
                margin: 0,
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem'
              }}>
                <FileUp style={{ width: '24px', height: '24px', color: '#3b82f6' }} />
                Last Opp Dokument
              </h2>
              <button
                onClick={() => {
                  setShowUploadModal(false);
                  setNewDocument({
                    name: '',
                    category: 'contract',
                    description: '',
                    file: null
                  });
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '0.5rem',
                  borderRadius: '0.5rem',
                  color: '#6b7280',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <X style={{ width: '20px', height: '20px' }} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#374151' }}>
                  Dokumentnavn
                </label>
                <input
                  type="text"
                  value={newDocument.name}
                  onChange={(e) => setNewDocument(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="F.eks. Hovedavtale 2024"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '0.875rem',
                    outline: 'none'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#374151' }}>
                  Kategori
                </label>
                <select
                  value={newDocument.category}
                  onChange={(e) => setNewDocument(prev => ({ ...prev, category: e.target.value as any }))}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '0.875rem',
                    outline: 'none'
                  }}
                >
                  <option value="contract">Avtaler</option>
                  <option value="framework">Rammeavtaler</option>
                  <option value="audit">Audit</option>
                  <option value="other">Andre</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#374151' }}>
                  Beskrivelse
                </label>
                <textarea
                  value={newDocument.description}
                  onChange={(e) => setNewDocument(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Beskriv dokumentet..."
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '0.875rem',
                    outline: 'none',
                    resize: 'vertical'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#374151' }}>
                  Fil
                </label>
                <input
                  type="file"
                  onChange={(e) => setNewDocument(prev => ({ ...prev, file: e.target.files?.[0] || null }))}
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.txt"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '0.875rem',
                    outline: 'none'
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => {
                    setShowUploadModal(false);
                    setNewDocument({
                      name: '',
                      category: 'contract',
                      description: '',
                      file: null
                    });
                  }}
                  style={{
                    padding: '0.75rem 1.5rem',
                    background: 'white',
                    color: '#6b7280',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                    fontWeight: '500'
                  }}
                >
                  Avbryt
                </button>
                <button
                  onClick={uploadDocument}
                  disabled={!newDocument.name || !newDocument.file || uploadingFiles}
                  style={{
                    padding: '0.75rem 1.5rem',
                    background: uploadingFiles ? '#9ca3af' : '#3b82f6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: uploadingFiles ? 'not-allowed' : 'pointer',
                    fontSize: '0.875rem',
                    fontWeight: '500'
                  }}
                >
                  {uploadingFiles ? 'Laster opp...' : 'Last Opp'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Users Modal */}
      {showUsersModal && selectedPartnerForAction && (
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
          zIndex: 1000,
          padding: '1rem'
        }}>
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '2rem',
            width: '100%',
            maxWidth: '800px',
            maxHeight: '90vh',
            overflowY: 'auto',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
              <h2 style={{ 
                fontSize: '1.5rem', 
                fontWeight: '700', 
                color: '#1e293b',
                margin: 0,
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem'
              }}>
                <Users style={{ width: '24px', height: '24px', color: '#3b82f6' }} />
                Brukere - {selectedPartnerForAction.name}
              </h2>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  onClick={() => setShowCreateUserModal(true)}
                  style={{
                    padding: '0.5rem 1rem',
                    background: '#10b981',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}
                >
                  <UserPlus style={{ width: '16px', height: '16px' }} />
                  Ny Bruker
                </button>
                <button
                  onClick={() => {
                    setShowUsersModal(false);
                    setSelectedPartnerForAction(null);
                    setPartnerUsers([]);
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '0.5rem',
                    borderRadius: '0.5rem',
                    color: '#6b7280',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <X style={{ width: '20px', height: '20px' }} />
                </button>
              </div>
            </div>

            {/* Users List */}
            <div style={{ marginBottom: '2rem' }}>
              <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#374151', marginBottom: '1rem' }}>
                Alle Brukere ({partnerUsers.length})
              </h3>
              
              {partnerUsers.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
                  <Users style={{ width: '48px', height: '48px', margin: '0 auto 1rem', opacity: 0.5 }} />
                  <p>Ingen brukere registrert ennå</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {partnerUsers.map((user) => (
                    <div
                      key={user.id}
                      style={{
                        padding: '1rem',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                        backgroundColor: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '50%',
                          backgroundColor: user.role === 'admin' ? '#3b82f6' : '#6b7280',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'white',
                          fontWeight: '600',
                          fontSize: '0.875rem'
                        }}>
                          {user.name.split(' ').map((n: string) => n[0]).join('').toUpperCase()}
                        </div>
                        <div>
                          <h4 style={{ 
                            fontSize: '1rem', 
                            fontWeight: '600', 
                            color: '#1e293b',
                            margin: '0 0 0.25rem 0'
                          }}>
                            {user.name}
                          </h4>
                          <p style={{ 
                            fontSize: '0.875rem', 
                            color: '#6b7280',
                            margin: '0 0 0.25rem 0'
                          }}>
                            {user.email}
                          </p>
                          <div style={{ display: 'flex', gap: '1rem', fontSize: '0.75rem', color: '#6b7280' }}>
                            <span>{user.phone}</span>
                            <span>•</span>
                            <span style={{ 
                              color: user.role === 'admin' ? '#3b82f6' : '#6b7280',
                              fontWeight: '500'
                            }}>
                              {user.role === 'admin' ? 'Administrator' : 'Bruker'}
                            </span>
                            <span>•</span>
                            <span>Sist innlogget: {user.lastLogin}</span>
                          </div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                          onClick={() => {
                            // Here you would typically edit the user
                            console.log('Edit user:', user.name);
                          }}
                          style={{
                            padding: '0.5rem',
                            background: '#f3f4f6',
                            color: '#374151',
                            border: '1px solid #d1d5db',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '0.75rem'
                          }}
                        >
                          Rediger
                        </button>
                        <button
                          onClick={() => {
                            setPartnerUsers(prev => prev.filter(u => u.id !== user.id));
                            setSuccess('Bruker fjernet');
                          }}
                          style={{
                            padding: '0.5rem',
                            background: '#fee2e2',
                            color: '#dc2626',
                            border: '1px solid #fecaca',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '0.75rem'
                          }}
                        >
                          Fjern
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
