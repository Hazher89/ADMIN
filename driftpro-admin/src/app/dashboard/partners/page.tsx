'use client';
// @ts-nocheck

import React, { useState, useEffect, useMemo } from 'react';
import { firebaseService, Partner } from '@/lib/firebase-services';

interface RouteAssignment {
  id: string;
  routeName: string;
  date: string;
  vehicle: string;
  driver: string;
  partnerId?: string;
  partnerName?: string;
  stops: Array<{
    customer: string;
    address: string;
    weight: number;
    volume: number;
    priority: string;
    description: string;
  }>;
  totalWeight: number;
  totalVolume: number;
  cost: number;
  status: 'assigned' | 'in_progress' | 'completed';
  assignedAt: string;
  }
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
  const [isMobile, setIsMobile] = useState(false);
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
    vehicleName?: string;
    vehicleNumber?: string;
    driverName?: string;
    driverEmail?: string;
    driverPhone?: string;
    vehicleType?: 'company_car' | 'one_man' | 'two_man';
  }>>([]);
  
  // Modal tabs
  const [activeTab, setActiveTab] = useState<'info' | 'vehicles' | 'files'>('info');
  
  // Routes/Routes tab state
  const [activeView, setActiveView] = useState<'partners' | 'routes' | 'audits'>('partners');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null);
  const [showFileShareModal, setShowFileShareModal] = useState(false);
  const [routeAssignments, setRouteAssignments] = useState<RouteAssignment[]>([]);
  const [expandedDriver, setExpandedDriver] = useState<string | null>(null);
  const [routeTitle, setRouteTitle] = useState('');
  const [selectedJob, setSelectedJob] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [availableUsers] = useState([
    'M18', '82', '83', '194', '195', '196', '197', '198', '199', '200'
  ]);

  // Route acceptance overview
  const routeAcceptanceStats = useMemo(() => {
    let accepted = 0;
    let declined = 0;
    let pending = 0;

    (routeAssignments || []).forEach((route) => {
      const status = (route as any)?.status?.toString()?.toLowerCase() || 'pending';
      if (['accepted', 'in_progress', 'completed'].includes(status)) {
        accepted += 1;
      } else if (['declined', 'rejected'].includes(status)) {
        declined += 1;
      } else {
        pending += 1;
      }
    });

    return { accepted, declined, pending };
  }, [routeAssignments]);

  const routeAlertItems = useMemo(() => {
    const lookupPartnerName = (partnerId?: string) => {
      if (!partnerId) return 'Ukjent partner';
      const partner = partners.find((p) => p.id === partnerId);
      return partner?.name || 'Ukjent partner';
    };

    return (routeAssignments || []).map((route) => {
      const statusRaw = (route as any)?.status?.toString()?.toLowerCase() || 'pending';
      const status =
        ['accepted', 'in_progress', 'completed'].includes(statusRaw) ? 'accepted' :
        ['declined', 'rejected'].includes(statusRaw) ? 'declined' :
        'pending';
      return {
        id: route.id || `${route.partnerId}-${route.date}-${route.driver || ''}`,
        routeName: route.routeName || 'Rute',
        partnerName: lookupPartnerName(route.partnerId),
        driver: (route as any)?.driver || 'Ukjent sjåfør',
        vehicle: (route as any)?.vehicle || 'Ukjent bil',
        date: route.date || (route as any)?.scheduledDate || '',
        status,
      };
    });
  }, [routeAssignments, partners]);

  // Mass route assignment from PDFs
  const [showMassAssignModal, setShowMassAssignModal] = useState(false);
  const [massAssignDate, setMassAssignDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [massFiles, setMassFiles] = useState<File[]>([]);
  const [massBusy, setMassBusy] = useState(false);
  const [massResults, setMassResults] = useState<Array<{
    file: File;
    detectedVehicleNumber?: string;
    manualVehicleNumber?: string;
    matchedPartnerId?: string;
    status: 'pending' | 'matched' | 'no_vehicle' | 'no_partner' | 'sent' | 'failed';
    message?: string;
  }>>([]);
  // Inbound SAP
  const [showInboundModal, setShowInboundModal] = useState(false);
  const [inboundItems, setInboundItems] = useState<any[]>([]);
  const [inboundLoading, setInboundLoading] = useState(false);
  const [processingReport, setProcessingReport] = useState<any>(null);

  // Auto-refresh inbound while modal is open (keeps it "instant" without DevTools)
  useEffect(() => {
    if (!showInboundModal) return;
    const id = setInterval(() => {
      loadInbound(true);
    }, 120000); // every 2 min
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showInboundModal]);

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
    email: ''
  });
  const [editingPartner, setEditingPartner] = useState<Partner | null>(null);
  const [editModalActiveTab, setEditModalActiveTab] = useState<'info' | 'vehicles' | 'users' | 'files'>('info');
  const [editingVehicles, setEditingVehicles] = useState<Array<{
    registrationNumber: string;
    year: string;
    model: string;
    euroClass: string;
    payload: string;
    vehicleName?: string;
    vehicleNumber?: string;
    driverName?: string;
    driverEmail?: string;
    driverPhone?: string;
    vehicleType?: 'company_car' | 'one_man' | 'two_man';
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

  // Dark mode variables for modals in this page (scoped by applying this object to modal containers)
  // This lets us reuse existing `var(--gray-*)` / `var(--white)` styles without rewriting every input/label.
  const darkModalVars = {
    '--white': '#0b1220',
    '--gray-900': '#e5e7eb',
    '--gray-800': '#cbd5e1',
    '--gray-700': '#cbd5e1',
    '--gray-600': '#94a3b8',
    '--gray-500': '#64748b',
    '--gray-400': '#64748b',
    '--gray-300': '#243244',
    '--gray-200': '#1f2937',
    '--gray-100': '#0f172a',
    '--gray-50': 'rgba(255,255,255,0.06)',
  } as any;

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    // Important: on hard refresh `userProfile` often arrives before `companyId`,
    // and the old dependency on `userProfile?.companyId` could prevent loading entirely.
    if (!userProfile) return;

    loadPartners();

    // These require companyId
    if (userProfile.companyId) {
      loadRouteAssignmentsData();
      loadAudits();
    }
  }, [userProfile]);

  // Check for overdue audits when partners or audits change
  useEffect(() => {
    if (Array.isArray(partners) && partners.length > 0 && Array.isArray(audits) && audits.length > 0) {
      checkAndNotifyOverdueAudits();
    }
  }, [partners, audits]);

  // Set up interval to check for overdue audits every hour
  useEffect(() => {
    const interval = setInterval(() => {
      if (Array.isArray(partners) && partners.length > 0 && Array.isArray(audits) && audits.length > 0) {
        checkAndNotifyOverdueAudits();
      }
    }, 60 * 60 * 1000); // Check every hour

    return () => clearInterval(interval);
  }, [partners, audits]);

  useEffect(() => {
    if (activeView === 'routes') {
      loadRouteAssignmentsData();
    }
  }, [activeView, currentDate]);

  const loadPartners = async () => {
    if (!userProfile) return;
    
    try {
      const partnersData = await firebaseService.getPartners();
      const validPartners = Array.isArray(partnersData) ? partnersData.filter(p => p && p.name) : [];
      setPartners(validPartners);
      setFilteredPartners(validPartners);
    } catch (error) {
      setError('Kunne ikke laste partnere');
      setPartners([]);
      setFilteredPartners([]);
    } finally {
      setLoading(false);
    }
  };

  const loadInbound = async (syncFirst = false) => {
    setInboundLoading(true);
    try {
      const safeReadJson = async (response: Response) => {
        // Avoid crashing on: "Unexpected end of JSON input"
        const text = await response.text();
        if (!text) return { __empty: true };
        try {
          return JSON.parse(text);
        } catch (err) {
          return { __invalidJson: true, __raw: text.slice(0, 500) };
        }
      };

      // Først synkroniser nye e-poster hvis ønsket
      if (syncFirst) {
        try {
          const syncRes = await fetch('/api/inbound/sap/sync', { method: 'POST' });
          const syncData: any = await safeReadJson(syncRes);
          if (syncData?.success) {
            setSuccess(`Synkronisert! ${syncData.processed} nye e-poster prosessert, ${syncData.skipped} hoppet over.`);
            if (syncData?.report) {
              setProcessingReport(syncData.report);
            }
          } else {
            // VIS feil (tidligere ble dette ofte skjult og det så ut som "tomt")
            console.warn('Sync feilet:', syncData?.error, syncData?.debug, syncData);
            if (!syncRes.ok) {
              setError(`Synk feilet (${syncRes.status}). ${syncData?.error || 'Ukjent feil'}`);
            } else if (syncData?.__empty) {
              setError('Synk feilet: tomt svar fra server (timeout/feil i function).');
            } else if (syncData?.__invalidJson) {
              setError(`Synk feilet: ugyldig svar fra server. (${String(syncData?.__raw || '').slice(0, 120)})`);
            } else {
              setError(syncData?.error || 'Synk feilet. Sjekk Graph/Firebase konfig.');
            }
          }
        } catch (syncError) {
          console.warn('Sync error:', syncError);
          setError('Synk feilet (nettverk/konfig).');
        }
      }

      // Last inn alle innkommende ruter
      const res = await fetch('/api/inbound/sap');
      const data: any = await safeReadJson(res);
      if (data?.success && Array.isArray(data.items)) {
        console.log(`📥 Lastet ${data.items.length} innkommende ruter fra Firestore`);
        // Log første 5 for debugging
        data.items.slice(0, 5).forEach((item: any, idx: number) => {
          console.log(`  ${idx + 1}. "${item.subject}" fra ${item.from} (${item.attachments?.length || 0} vedlegg)`);
        });
        setInboundItems(data.items);
        if (data?.latestReport) {
          setProcessingReport(data.latestReport);
        }
      } else {
        console.error('❌ Feil ved henting av innkommende ruter:', data);
        if (!res.ok) {
          setError(`Kunne ikke hente innkommende ruter (${res.status}). ${data?.error || 'Ukjent feil'}`);
        } else if (data?.__empty) {
          setError('Kunne ikke hente innkommende ruter: tomt svar fra server.');
        } else if (data?.__invalidJson) {
          setError(`Kunne ikke hente innkommende ruter: ugyldig svar fra server. (${String(data?.__raw || '').slice(0, 120)})`);
        } else {
          setError(data?.error || 'Kunne ikke hente innkommende ruter');
        }
      }
    } catch (e) {
      console.error('Inbound fetch error', e);
      setError('Kunne ikke hente innkommende ruter');
    } finally {
      setInboundLoading(false);
    }
  };

  const normalizeVehicleNumber = (value: string): string => {
    const raw = String(value || '').trim();
    if (!raw) return '';

    // Canonical format: 3-digit string, e.g. "018"
    const upper = raw.toUpperCase().replace(/\s+/g, '');

    // Driver style: "018"
    const digitsOnly = upper.match(/^\d{1,6}$/);
    if (digitsOnly) {
      const d = digitsOnly[0];
      if (parseInt(d, 10) === 0) return '';
      const last3 = d.length >= 3 ? d.slice(-3) : d.padStart(3, '0');
      return last3;
    }

    // Resource ID style: "M0018" or "NO_O_M0018"
    const m = upper.match(/M0*(\d{1,6})/);
    if (m?.[1]) {
      const d = m[1];
      if (parseInt(d, 10) === 0) return '';
      const last3 = d.length >= 3 ? d.slice(-3) : d.padStart(3, '0');
      return last3;
    }

    // Fallback: find any 3 digits token
    const three = upper.match(/\b(\d{3})\b/);
    if (three?.[1]) return three[1];

    return upper;
  };

  const extractVehicleNumberFromPdf = async (file: File): Promise<string | null> => {
    // Super smart: try pdfjs text; if not found, OCR fallback with Tesseract.
    const parseFromText = (text: string): string | null => {
      const searchText = text;
      const primary = searchText.slice(0, 20000);
      const pickFromResourceId = (): string | null => {
        const idx = primary.toLowerCase().indexOf('resource id');
        if (idx >= 0) {
          const window = primary.slice(idx, idx + 400);
          const m = window.match(/NO[_A-Z]*_M0*(\d{1,6})/i);
          if (m?.[1]) {
            const norm = normalizeVehicleNumber(m[1]);
            if (norm) return norm; // "018", "023"
          }
        }
        const globalMatch = searchText.match(/NO[_A-Z]*_M0*(\d{1,6})/i);
        if (globalMatch?.[1]) {
          const norm = normalizeVehicleNumber(globalMatch[1]);
          if (norm) return norm;
        }
        const collapsed = searchText.replace(/[\s\r\n]+/g, '');
        const collapsedMatch = collapsed.match(/NO[_A-Z]*_?M0*(\d{1,6})/i) || collapsed.match(/M0*(\d{1,6})/i);
        if (collapsedMatch?.[1]) {
          const norm = normalizeVehicleNumber(collapsedMatch[1]);
          if (norm) return norm;
        }
        return null;
      };

      // If we need Driver Name later, we can add, but Resource ID er fasit.
      const fromResource = pickFromResourceId();
      if (fromResource) return fromResource;
      return null;
    };

    const tryPdfJsText = async (): Promise<string | null> => {
      if (typeof window === 'undefined') return null;
      try {
        const pdfjs = await import('pdfjs-dist');
        // @ts-ignore
        pdfjs.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).toString();
        const data = await file.arrayBuffer();
        const loadingTask = await pdfjs.getDocument({ data });
        const pdf = await loadingTask.promise;
        const page = await pdf.getPage(1);
        const txt = await page.getTextContent();
        const str = txt.items.map((i: any) => i.str || '').join(' ');
        return str || null;
      } catch (err) {
        console.warn('pdfjs text parse failed:', err);
        return null;
      }
    };

    const tryOcr = async (): Promise<string | null> => {
      if (typeof window === 'undefined') return null;
      try {
        const pdfjs = await import('pdfjs-dist');
        // @ts-ignore
        pdfjs.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).toString();
        const data = await file.arrayBuffer();
        const loadingTask = await pdfjs.getDocument({ data });
        const pdf = await loadingTask.promise;
        const page = await pdf.getPage(1);
        const viewport = page.getViewport({ scale: 1.5 });

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) return null;
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        await page.render({ canvasContext: ctx, viewport }).promise;

        const { recognize } = await import('tesseract.js');
        const result = await recognize(canvas, 'eng');
        return result?.data?.text || null;
      } catch (err) {
        console.warn('OCR parse failed:', err);
        return null;
      }
    };

    // 1) pdfjs text
    const text = await tryPdfJsText();
    if (text) {
      const v = parseFromText(text);
      if (v) return v;
    }

    // 2) OCR fallback
    const ocrText = await tryOcr();
    if (ocrText) {
      const v = parseFromText(ocrText);
      if (v) return v;
    }

    return null;
  };

  const findPartnerByVehicleNumber = (vehicleNumber: string): Partner | null => {
    const needle = normalizeVehicleNumber(vehicleNumber);
    for (const p of partners) {
      const vehicles = (p as any)?.vehicles;
      if (!Array.isArray(vehicles)) continue;
      const match = vehicles.some((v: any) => {
        const candidate = v?.vehicleNumber || v?.registrationNumber || v?.vehicleName;
        if (!candidate) return false;
        return normalizeVehicleNumber(String(candidate)) === needle;
      });
      if (match) return p;
    }
    return null;
  };

  const loadRouteAssignmentsData = async () => {
    if (!userProfile?.companyId) return;
    
    try {
      const assignments = await firebaseService.getRouteAssignments(userProfile.companyId);
      console.log('📋 Hentet route assignments:', Array.isArray(assignments) ? assignments.length : 0);
      setRouteAssignments(Array.isArray(assignments) ? assignments as RouteAssignment[] : []);
    } catch (error) {
      console.error('Error loading route assignments:', error);
      setRouteAssignments([]);
    }
  };

  // Get routes for a specific driver
  const getDriverRoutes = (driverName: string) => {
    if (!Array.isArray(routeAssignments)) return [];
    return routeAssignments.filter(route => route && route.driver === driverName);
  };

  // Get routes for a specific partner
  const getPartnerRoutes = (partnerId: string) => {
    if (!Array.isArray(routeAssignments)) return [];
    return routeAssignments.filter(route => route && route.partnerId === partnerId);
  };

  // Group routes by date
  const groupRoutesByDate = (routes: RouteAssignment[]) => {
    if (!Array.isArray(routes)) return {};
    return routes.reduce((groups, route) => {
      if (!route || !route.date) return groups;
      const date = route.date;
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(route);
      return groups;
    }, {} as Record<string, RouteAssignment[]>);
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
      payload: '',
      vehicleName: '',
      vehicleNumber: '',
      driverName: '',
      vehicleType: 'one_man'
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

  const createDriverUser = async (vehicle: any, partnerId: string, partnerName: string) => {
    if (!vehicle.driverName || !vehicle.driverName.trim()) {
      return; // Skip if no driver name provided
    }

    try {
      // Generate email and phone from driver name if not provided
      const driverEmail = vehicle.driverEmail || `${vehicle.driverName.toLowerCase().replace(/\s+/g, '.')}@${partnerName.toLowerCase().replace(/\s+/g, '')}.no`;
      const driverPhone = vehicle.driverPhone || '+47 123 45 678'; // Default phone

      // Generate a temporary password
      const tempPassword = Math.random().toString(36).slice(-8) + '123';

      // Create Firebase Auth user
      const { createUserWithEmailAndPassword } = await import('firebase/auth');
      const { auth } = await import('@/lib/firebase');
      if (!auth) throw new Error('Auth not initialized');
      
      const userCredential = await createUserWithEmailAndPassword(auth, driverEmail, tempPassword);
      const userId = userCredential.user.uid;

      // Create user document in Firestore
      const { doc, setDoc } = await import('firebase/firestore');
      const { db } = await import('@/lib/firebase');
      if (!db) throw new Error('Firestore not initialized');
      
      const userData = {
        id: userId,
        name: vehicle.driverName,
        email: driverEmail,
        phone: driverPhone,
        role: 'driver',
                companyName: partnerName,
        vehicleId: vehicle.registrationNumber || `VEH-${Date.now()}`,
        vehicleName: vehicle.vehicleName || vehicle.model || 'Ukjent kjøretøy',
        status: 'active',
        createdAt: new Date().toISOString(),
        tempPassword: tempPassword, // Store temp password for admin reference
        partnerId: partnerId
      };

      await setDoc(doc(db, 'users', userId), userData);

      console.log(`✅ Driver user created: ${vehicle.driverName} (${driverEmail})`);
      return userData;

    } catch (error) {
      console.error(`❌ Error creating driver user for ${vehicle.driverName}:`, error);
      // Don't throw error to prevent partner creation from failing
      return null;
    }
  };

  const handleCreatePartner = async () => {
    if (!userProfile) {
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
                status: 'active' as const,
        rating: 0,
        projects: 0,
        revenue: 0,
        createdBy: userProfile.id,
        vehicles: vehicles,
        uploadedFiles: []
      };
      
      const partnerId = await firebaseService.createPartner(partnerData);
      
      // Create driver users for vehicles with driver names
      const driverCreationPromises = vehicles
        .filter(vehicle => vehicle.driverName && vehicle.driverName.trim())
        .map(vehicle => createDriverUser(vehicle, partnerId, newPartner.name));
      
      if (driverCreationPromises.length > 0) {
        try {
          const createdDrivers = await Promise.all(driverCreationPromises);
          const successfulDrivers = createdDrivers.filter(driver => driver !== null);
          console.log(`✅ Created ${successfulDrivers.length} driver users for partner ${newPartner.name}`);
        } catch (driverError) {
          console.error('Error creating driver users:', driverError);
          // Don't fail partner creation if driver creation fails
        }
      }
      
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
      const updatedPartners = await firebaseService.getPartners();
      const validPartners = Array.isArray(updatedPartners) ? updatedPartners.filter(p => p && p.name) : [];
      setPartners(validPartners);
      setFilteredPartners(validPartners);
      
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
      setFilteredPartners(Array.isArray(partners) ? partners : []);
    } else {
      const filtered = (Array.isArray(partners) ? partners : []).filter(partner =>
        partner && partner.name && partner.name.toLowerCase().includes(query.toLowerCase()) ||
        (partner && partner.orgNumber && partner.orgNumber.includes(query)) ||
        (partner && partner.contactPerson?.name && partner.contactPerson.name.toLowerCase().includes(query.toLowerCase()))
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
    if (!Array.isArray(routeAssignments)) return null;
    
    const dateString = date.toISOString().split('T')[0];
    
    // Find route assignment for this partner and date
    const assignment = routeAssignments.find(route => 
      route.partnerId === partnerId && route.date === dateString
    );
    
    return assignment || null;
  };

  // Load users for a specific partner
  const loadPartnerUsers = async (partnerId: string) => {
    try {
      // Load from Firebase
      const users = await firebaseService.getPartnerUsers(partnerId);
      setPartnerUsers(users);
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
    if (!selectedPartnerForAction || !newUser.name || !newUser.phone) {
      setError('Vennligst fyll ut navn og telefonnummer');
      return;
    }

    try {
      const response = await fetch('/api/partners/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          partnerId: selectedPartnerForAction.id,
          partnerName: selectedPartnerForAction.name,
          fullName: newUser.name,
          phoneNumber: newUser.phone
        })
      });

      const data = await response.json();
      if (!response.ok || !data?.success) {
        throw new Error(data?.error || 'Feil ved opprettelse av bruker');
      }

      setSuccess(`Invitasjon sendt på SMS til ${newUser.name}`);
      setShowCreateUserModal(false);
      setNewUser({ name: '', phone: '', email: '' });
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

      // Notify partner users by SMS (active users with phone numbers)
      try {
        const partnerUsers = await firebaseService.getPartnerUsers(selectedPartner.id);
        const usersWithPhone = (Array.isArray(partnerUsers) ? partnerUsers : [])
          .filter((u: any) => (u?.status === 'active' || !u?.status) && (u?.phoneNumber || u?.phone));

        const origin =
          typeof window !== 'undefined' && window.location?.origin
            ? window.location.origin
            : (process.env.NEXT_PUBLIC_APP_URL || 'https://admin.driftpro.no');
        const partnerPortalLink = `${origin}/partner/routes?assignmentId=${encodeURIComponent(assignmentId)}`;

        const smsMessage =
          `Ny rute tildelt: ${assignment.title}\n` +
          `Dato: ${selectedDate.toLocaleDateString('no-NO')}\n` +
          `Logg inn for å se PDF og akseptere: ${partnerPortalLink}`;

        await Promise.all(
          usersWithPhone.map(async (u: any) => {
            const to = (u.phoneNumber || u.phone || '').toString();
            if (!to) return;
            await fetch('/api/sms/send', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ to, message: smsMessage, priority: 'high' })
            });
          })
        );
      } catch (smsErr) {
        console.warn('Failed to send partner SMS notifications:', smsErr);
      }

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

  const handleMassFilesSelected = async (files: FileList | null) => {
    if (!files) return;
    const list = Array.from(files).filter(f => f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf'));
    setMassFiles(list);
    setMassResults(list.map(f => ({ file: f, status: 'pending' })));

    // Scan each PDF for vehicle number
    for (const f of list) {
      const detected = await extractVehicleNumberFromPdf(f);
      setMassResults(prev =>
        prev.map(r => {
          if (r.file !== f) return r;
          if (!detected) return { ...r, status: 'no_vehicle', message: 'Fant ikke bilnummer i PDF (kan fylles inn manuelt).' };
          const partner = findPartnerByVehicleNumber(detected);
          if (!partner) return { ...r, detectedVehicleNumber: detected, status: 'no_partner', message: `Fant bilnummer ${detected}, men ingen partner har det registrert.` };
          return { ...r, detectedVehicleNumber: detected, matchedPartnerId: partner.id, status: 'matched', message: `Match: ${partner.name} (${detected})` };
        })
      );
    }
  };

  const runMassAssign = async () => {
    if (!massAssignDate) {
      setError('Velg dato');
      return;
    }
    if (!Array.isArray(massResults) || massResults.length === 0) {
      setError('Last opp minst én PDF');
      return;
    }

    setMassBusy(true);
    try {
      const dateIso = new Date(massAssignDate + 'T12:00:00').toISOString();
      const failures: string[] = [];

      for (const r of massResults) {
        const vehicle = normalizeVehicleNumber(r.manualVehicleNumber || r.detectedVehicleNumber || '');
        if (!vehicle) {
          failures.push(`${r.file.name}: mangler bilnummer`);
          setMassResults(prev => prev.map(x => x.file === r.file ? ({ ...x, status: 'no_vehicle' }) : x));
          continue;
        }

        const partner = findPartnerByVehicleNumber(vehicle);
        if (!partner) {
          failures.push(`${r.file.name}: fant ikke partner for bilnummer ${vehicle}`);
          setMassResults(prev => prev.map(x => x.file === r.file ? ({ ...x, status: 'no_partner', message: `Fant ikke partner for ${vehicle}` }) : x));
          continue;
        }

        try {
          const uploaded = await uploadFilesToFirebase([r.file], partner.id);
          const title = `Rute ${massAssignDate} (${vehicle})`;

          const assignmentId = await firebaseService.createRouteAssignment({
            partnerId: partner.id,
            partnerName: partner.name,
            date: dateIso,
            files: uploaded,
            title,
            job: '',
            users: []
          });

          // SMS notifications to partner users (same endpoint used elsewhere)
          try {
            const partnerUsers = await firebaseService.getPartnerUsers(partner.id);
            const usersWithPhone = (Array.isArray(partnerUsers) ? partnerUsers : [])
              .filter((u: any) => (u?.status === 'active' || !u?.status) && (u?.phoneNumber || u?.phone));

            const origin =
              typeof window !== 'undefined' && window.location?.origin
                ? window.location.origin
                : (process.env.NEXT_PUBLIC_APP_URL || 'https://admin.driftpro.no');
            const partnerPortalLink = `${origin}/partner/routes?assignmentId=${encodeURIComponent(assignmentId)}`;

            const smsMessage =
              `Ny rute tildelt: ${title}\n` +
              `Dato: ${massAssignDate}\n` +
              `Logg inn for å se PDF og akseptere: ${partnerPortalLink}`;

            await Promise.all(
              usersWithPhone.map(async (u: any) => {
                const to = (u.phoneNumber || u.phone || '').toString();
                if (!to) return;
                await fetch('/api/sms/send', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ to, message: smsMessage, priority: 'high' })
                });
              })
            );
          } catch (smsErr) {
            console.warn('Mass assign: failed to send SMS:', smsErr);
          }

          setMassResults(prev => prev.map(x => x.file === r.file ? ({
            ...x,
            detectedVehicleNumber: x.detectedVehicleNumber || vehicle,
            manualVehicleNumber: x.manualVehicleNumber,
            matchedPartnerId: partner.id,
            status: 'sent',
            message: `Sendt til ${partner.name} (${vehicle})`
          }) : x));
        } catch (e: any) {
          failures.push(`${r.file.name}: ${e?.message || 'feil ved sending'}`);
          setMassResults(prev => prev.map(x => x.file === r.file ? ({ ...x, status: 'failed', message: e?.message || 'Feil ved sending' }) : x));
        }
      }

      if (failures.length > 0) {
        setError(`Noen PDF-er ble ikke sendt:\n${failures.join('\n')}`);
      } else {
        setSuccess('Alle PDF-er ble tildelt og sendt ✅');
      }
    } finally {
      setMassBusy(false);
    }
  };

  const loadRouteAssignments = async () => {
    if (!userProfile) return;
    
    try {
      // Get start and end of current week
      const weekDates = getWeekDates(currentDate);
      const startDate = weekDates[0].toISOString().split('T')[0];
      const endDate = weekDates[6].toISOString().split('T')[0];
      
      const assignments = await firebaseService.getRouteAssignments(
        startDate, 
        endDate
      );
      
      // Convert to key-value format for easy lookup
      const assignmentMap: {[key: string]: any} = {};
      assignments.forEach(assignment => {
        const key = `${assignment.partnerId}_${assignment.date.split('T')[0]}`;
        assignmentMap[key] = assignment;
      });
      
      setRouteAssignments(Object.values(assignmentMap) as RouteAssignment[]);
    } catch (error) {
      console.error('Error loading route assignments:', error);
    }
  };

  const loadAudits = async () => {
    if (!userProfile?.companyId) return;
    
    try {
      const auditsData = await firebaseService.getAudits();
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

  const getPartnerNameById = (partnerId: string) => {
    const partner = partners.find(p => p.id === partnerId);
    return partner?.name || 'Ukjent partner';
  };

  // Get audit status for a specific partner
  const getPartnerAuditStatus = (partnerId: string) => {
    if (!Array.isArray(audits)) return null;
    const partnerAudits = audits.filter(audit => audit && audit.partnerId === partnerId);
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
    if (!userProfile) return;
    
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
        fileSize: newDocument.file && newDocument.file.size ? (newDocument.file.size / 1024 / 1024).toFixed(1) + ' MB' : '0 MB',
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
    <div style={{ 
      minHeight: '100vh', 
      background: 'var(--background-color)',
      width: '100%',
      overflowX: 'hidden',
      padding: isMobile ? '0' : undefined
    }}>
      <style jsx global>{`
        /* Scoped dark styling for all modals in Samarbeidspartnere */
        [data-partners-darkmodal] {
          color: var(--gray-900);
        }
        [data-partners-darkmodal] input,
        [data-partners-darkmodal] select,
        [data-partners-darkmodal] textarea {
          background: var(--gray-100) !important;
          color: var(--gray-900) !important;
          border: 1px solid var(--gray-300) !important;
        }
        [data-partners-darkmodal] label {
          color: var(--gray-800) !important;
        }
        [data-partners-darkmodal] ::placeholder {
          color: var(--gray-500) !important;
        }
        [data-partners-darkmodal] option {
          background: var(--gray-100);
          color: var(--gray-900);
        }
      `}</style>

      {/* Mobile Header */}
      {isMobile && (
        <div style={{
          padding: '0.625rem 0.75rem 0.5rem',
          marginBottom: '0.5rem',
          borderBottom: '0.5px solid var(--border-color)',
          background: 'var(--card-background)'
        }}>
          <h1 style={{
            fontSize: '1.125rem',
            fontWeight: 600,
            color: 'var(--text-color)',
            margin: 0,
            lineHeight: '1.3'
          }}>
            Samarbeidspartnere
          </h1>
        </div>
      )}

      {/* Mass Route Assign Modal */}
      {showMassAssignModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.65)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1100,
          padding: '1rem'
        }}>
          <div data-partners-darkmodal style={{
            ...(darkModalVars as any),
            colorScheme: 'dark',
            background: 'var(--white)',
            border: '1px solid var(--gray-200)',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '900px',
            maxHeight: '90vh',
            overflow: 'hidden',
            boxShadow: '0 25px 60px rgba(0,0,0,0.60)'
          }}>
            <div style={{
              padding: '1.25rem 1.5rem',
              borderBottom: '1px solid var(--gray-200)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'linear-gradient(135deg, #111827 0%, #0b1220 100%)'
            }}>
              <div>
                <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--gray-900)' }}>
                  Mass rute tildeling (PDF → Bilnummer → Partner)
                </div>
                <div style={{ marginTop: '0.25rem', fontSize: '0.85rem', color: 'var(--gray-600)' }}>
                  Laster du opp flere PDF’er, scanner vi bilnummer automatisk. Hvis vi ikke finner bilnummer, kan du fylle inn manuelt.
                </div>
              </div>
              <button
                onClick={() => setShowMassAssignModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '0.5rem',
                  borderRadius: '10px',
                  color: 'var(--gray-600)'
                }}
              >
                <X style={{ width: '20px', height: '20px' }} />
              </button>
            </div>

            <div style={{ padding: '1.5rem', overflowY: 'auto', maxHeight: '70vh' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: '1rem', alignItems: 'end' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>
                    Dato for rutene
                  </label>
                  <input
                    type="date"
                    value={massAssignDate}
                    onChange={(e) => setMassAssignDate(e.target.value)}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>
                    Last opp PDF-filer
                  </label>
                  <input
                    type="file"
                    accept="application/pdf,.pdf"
                    multiple
                    onChange={(e) => handleMassFilesSelected(e.target.files)}
                    disabled={massBusy}
                  />
                </div>
              </div>

              <div style={{ marginTop: '1.25rem' }}>
                {massResults.length === 0 ? (
                  <div style={{
                    border: '1px dashed var(--gray-300)',
                    borderRadius: '14px',
                    padding: '1.25rem',
                    color: 'var(--gray-600)'
                  }}>
                    Ingen filer valgt enda.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {massResults.map((r) => (
                      <div key={r.file.name} style={{
                        border: '1px solid var(--gray-200)',
                        background: 'var(--gray-100)',
                        borderRadius: '14px',
                        padding: '0.9rem 1rem',
                        display: 'grid',
                        gridTemplateColumns: '1fr 220px 220px',
                        gap: '0.75rem',
                        alignItems: 'center'
                      }}>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontWeight: 800, color: 'var(--gray-900)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {r.file.name}
                          </div>
                          <div style={{ marginTop: '0.25rem', fontSize: '0.85rem', color: 'var(--gray-600)' }}>
                            {r.message || (r.detectedVehicleNumber ? `Bilnummer funnet: ${r.detectedVehicleNumber}` : 'Venter...')}
                          </div>
                        </div>

                        <div>
                          <label style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.8rem', fontWeight: 700, color: 'var(--gray-700)' }}>
                            Bilnummer (auto/manuell)
                          </label>
                          <input
                            type="text"
                            placeholder={r.detectedVehicleNumber || 'F.eks. M18'}
                            value={r.manualVehicleNumber || ''}
                            onChange={(e) => {
                              const v = e.target.value;
                              setMassResults(prev => prev.map(x => x.file === r.file ? ({ ...x, manualVehicleNumber: v }) : x));
                            }}
                            disabled={massBusy}
                          />
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                          <span style={{
                            padding: '0.35rem 0.65rem',
                            borderRadius: '999px',
                            fontSize: '0.8rem',
                            fontWeight: 800,
                            border: '1px solid var(--gray-300)',
                            color: r.status === 'sent' ? '#10b981' :
                              r.status === 'matched' ? '#60a5fa' :
                              r.status === 'no_partner' ? '#f59e0b' :
                              r.status === 'no_vehicle' ? '#ef4444' :
                              r.status === 'failed' ? '#ef4444' :
                              'var(--gray-600)',
                            background: 'rgba(255,255,255,0.04)'
                          }}>
                            {r.status === 'sent' ? 'Sendt' :
                              r.status === 'matched' ? 'Klar' :
                              r.status === 'no_partner' ? 'Ingen partner' :
                              r.status === 'no_vehicle' ? 'Mangler bilnr' :
                              r.status === 'failed' ? 'Feil' :
                              'Venter'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div style={{
              padding: '1rem 1.5rem',
              borderTop: '1px solid var(--gray-200)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: '#0b1220'
            }}>
              <div style={{ color: 'var(--gray-600)', fontSize: '0.85rem' }}>
                Tips: Bilnummer leses fra “Resource ID” / “Driver Name” i PDF (som i bildet ditt).
              </div>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button
                  className="btn"
                  onClick={() => setShowMassAssignModal(false)}
                  style={{
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid var(--gray-300)',
                    color: 'var(--gray-800)'
                  }}
                  disabled={massBusy}
                >
                  Avbryt
                </button>
                <button
                  className="btn"
                  onClick={runMassAssign}
                  style={{
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    border: '1px solid rgba(16,185,129,0.35)',
                    color: '#fff',
                    fontWeight: 800
                  }}
                  disabled={massBusy || massResults.length === 0}
                >
                  {massBusy ? 'Sender...' : 'Send alle'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Inbound SAP Modal */}
      {showInboundModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.65)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1200,
          padding: '1rem'
        }}>
          <div data-partners-darkmodal style={{
            ...(darkModalVars as any),
            colorScheme: 'dark',
            background: 'var(--white)',
            border: '1px solid var(--gray-200)',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '1100px',
            maxHeight: '90vh',
            overflow: 'hidden',
            boxShadow: '0 25px 60px rgba(0,0,0,0.60)'
          }}>
            <div style={{
              padding: '1.25rem 1.5rem',
              borderBottom: '1px solid var(--gray-200)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'linear-gradient(135deg, #111827 0%, #0b1220 100%)'
            }}>
              <div>
                <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--gray-900)' }}>
                  Innkommende ruter fra SAP (e-post)
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  onClick={() => loadInbound(true)}
                  style={{
                    padding: '0.6rem 0.9rem',
                    background: '#0ea5e9',
                    border: '1px solid rgba(14,165,233,0.35)',
                    color: '#fff',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    fontWeight: 700
                  }}
                  disabled={inboundLoading}
                >
                  {inboundLoading ? 'Laster...' : 'Oppdater'}
                </button>
                <button
                  onClick={() => setShowInboundModal(false)}
                  style={{
                    padding: '0.6rem 0.9rem',
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid var(--gray-300)',
                    color: 'var(--gray-800)',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    fontWeight: 700
                  }}
                >
                  Lukk
                </button>
              </div>
            </div>

            <div style={{ padding: '1rem 1.25rem', overflowY: 'auto', maxHeight: '70vh' }}>
              {/* Rapport (vises alltid hvis den finnes) */}
              {processingReport && (
                <div style={{
                  marginBottom: '1rem',
                  padding: '0.9rem 1rem',
                  borderRadius: '12px',
                  border: '1px solid #243042',
                  background: 'linear-gradient(135deg, rgba(15,23,42,0.9) 0%, rgba(2,6,23,0.9) 100%)'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
                    <div style={{ color: '#e5e7eb', fontWeight: 800 }}>
                      Rapport: Automatisk utsending fra SAP
                    </div>
                    <div style={{ color: '#94a3b8', fontSize: '0.85rem' }}>
                      {processingReport.createdAt ? new Date(processingReport.createdAt).toLocaleString('no-NO') : ''}
                    </div>
                  </div>
                  <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                    <span className="badge" style={{ background: '#1f2937', color: '#e5e7eb', border: '1px solid #334155' }}>
                      Totalt: {processingReport.total ?? 0}
                    </span>
                    <span className="badge" style={{ background: '#064e3b', color: '#10b981', border: '1px solid #065f46' }}>
                      Sendt: {processingReport.sent ?? processingReport.processed ?? 0}
                    </span>
                    <span className="badge" style={{ background: '#7f1d1d', color: '#ef4444', border: '1px solid #991b1b' }}>
                      Feilet: {processingReport.failed ?? 0}
                    </span>
                  </div>
                  {processingReport.byDate && (
                    <div style={{ marginTop: '0.75rem', color: '#cbd5e1', fontSize: '0.9rem' }}>
                      {Object.entries(processingReport.byDate).map(([date, stats]: any) => {
                        const total = stats?.total ?? 0;
                        const sent = stats?.sent ?? 0;
                        const failed = stats?.failed ?? 0;
                        const dateLabel = date !== 'ukjent'
                          ? new Date(date + 'T00:00:00').toLocaleDateString('no-NO', { weekday: 'long', day: '2-digit', month: '2-digit' })
                          : 'Ukjent dato';
                        return (
                          <div key={date} style={{ marginTop: '0.25rem' }}>
                            {`Alle rutene for ${dateLabel}: ${sent}/${total} sendt`}{failed > 0 ? `, ${failed} ikke sendt (se under).` : ', ingen ruter mangler ✅'}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {inboundItems.length === 0 ? (
                <div style={{
                  border: '1px dashed var(--gray-300)',
                  borderRadius: '12px',
                  padding: '1rem',
                  color: 'var(--gray-600)',
                  textAlign: 'center'
                }}>
                  {processingReport && (processingReport.failed ?? 0) === 0
                    ? 'Alt er sendt ✅ (listen blir tom når alt er tildelt)'
                    : 'Ingen innkommende ruter som venter (se rapport over).'}
                </div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--gray-200)', color: '#cbd5e1', textAlign: 'left' }}>
                      <th style={{ padding: '0.5rem' }}>Mottatt</th>
                      <th style={{ padding: '0.5rem' }}>Fra</th>
                      <th style={{ padding: '0.5rem' }}>Emne</th>
                      <th style={{ padding: '0.5rem' }}>Fil(er)</th>
                      <th style={{ padding: '0.5rem' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {inboundItems.map((item) => (
                      <tr key={item.id} style={{ borderBottom: '1px solid #1f2937' }}>
                        <td style={{ padding: '0.5rem', color: '#e5e7eb' }}>
                          {item.receivedAt || item.createdAt?.toDate?.() || item.createdAt || ''}
                        </td>
                        <td style={{ padding: '0.5rem', color: '#e5e7eb' }}>{item.from || ''}</td>
                        <td style={{ padding: '0.5rem', color: '#e5e7eb' }}>{item.subject || ''}</td>
                        <td style={{ padding: '0.5rem', color: '#a5b4fc' }}>
                          {Array.isArray(item.attachments) && item.attachments.length > 0 ? (
                            item.attachments.map((a: any, idx: number) => (
                              <div key={idx} style={{ marginBottom: '0.25rem' }}>
                                {a.fileUrl ? (
                                  <a href={a.fileUrl} target="_blank" rel="noreferrer" style={{ color: '#60a5fa' }}>
                                    {a.fileName || 'Vedlegg'}
                                  </a>
                                ) : (
                                  a.fileName || 'Vedlegg'
                                )}
                              </div>
                            ))
                          ) : (
                            <span style={{ color: '#94a3b8' }}>Ingen vedlegg</span>
                          )}
                        </td>
                        <td style={{ padding: '0.5rem', color: '#22c55e', fontWeight: 700 }}>
                          {item.status || 'pending'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}


      {/* Desktop Page Header */}
      {!isMobile && (
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
            {Array.isArray(partners) ? partners.length : 0} partnere
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
          
          {/* Actions row directly under the tabs when in routes view */}
          {activeView === 'routes' && (
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
              <button
                className="btn"
                onClick={() => setShowJobManagementModal(true)}
                style={{
                  background: 'linear-gradient(135deg, #0f172a 0%, #1f2937 100%)',
                  border: '1px solid #334155',
                  color: '#e5e7eb',
                  fontWeight: '600',
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
                className="btn"
                onClick={() => {
                  setShowInboundModal(true);
                  // Sync + auto-tildel hver gang modalen åpnes (så det føles "automatisk")
                  loadInbound(true);
                }}
                style={{
                  background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                  border: '1px solid rgba(37, 99, 235, 0.35)',
                  color: '#ffffff',
                  fontWeight: '700',
                  fontSize: 'var(--font-size-sm)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                <FileText style={{ width: '16px', height: '16px' }} />
                Innkommende ruter fra SAP
              </button>
              <button
                className="btn"
                onClick={() => {
                  setMassAssignDate(new Date().toISOString().split('T')[0]);
                  setMassFiles([]);
                  setMassResults([]);
                  setShowMassAssignModal(true);
                }}
                style={{
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  border: '1px solid rgba(16,185,129,0.35)',
                  color: '#ffffff',
                  fontWeight: '700',
                  fontSize: 'var(--font-size-sm)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                <FileText style={{ width: '16px', height: '16px' }} />
                Mass rute tildeling
              </button>
            </div>
          )}
          
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
                {(() => {
                  const count = activeView === 'routes'
                    ? (routeAcceptanceStats.pending + routeAcceptanceStats.declined)
                    : (Array.isArray(auditNotifications) ? auditNotifications.length : 0);
                  if (!count) return null;
                  return (
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
                      {count}
                    </span>
                  );
                })()}
              </button>
              
              {activeView === 'partners' && (
                <button 
                  className="btn btn-primary"
                  onClick={() => setShowCreatePartnerModal(true)}
                >
                  <Plus style={{ width: '16px', height: '16px' }} />
                  Ny Partner
                </button>
              )}
            </div>
        </div>
      </div>
      )}

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
                  color: '#f8fafc',
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
                <span>
                  {partner.address?.street || 'Adresse ukjent'}
                  {partner.address?.postalCode ? `, ${partner.address.postalCode}` : ''}
                  {partner.address?.city ? ` ${partner.address.city}` : ''}
                </span>
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
              
              {partner.vehicles && Array.isArray(partner.vehicles) && partner.vehicles.length > 0 && (
                <div style={{ marginBottom: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', fontSize: '0.875rem', color: '#666' }}>
                    <Building2 style={{ width: '16px', height: '16px' }} />
                    <span>
                      {(() => {
                        const vehicleNumbers = (partner.vehicles || [])
                          .map(v => v?.vehicleNumber || v?.registrationNumber || v?.vehicleName)
                          .filter(Boolean) as string[];
                        const shown = vehicleNumbers.slice(0, 3);
                        const more = vehicleNumbers.length - shown.length;
                        return vehicleNumbers.length > 0
                          ? `Bilnummer: ${shown.join(', ')}${more > 0 ? ` +${more}` : ''}`
                          : `${partner.vehicles.length} kjøretøy registrert`;
                      })()}
                    </span>
                  </div>
                  
                  {/* Show assigned routes for this partner */}
                  {(() => {
                    const partnerRoutes = getPartnerRoutes(partner.id);
                    const routesByDate = groupRoutesByDate(partnerRoutes);
                    
                    if (!Array.isArray(partnerRoutes) || partnerRoutes.length === 0) return null;
                    
                    return (
                      <div key={partner.id} style={{
                        marginTop: '0.5rem',
                        padding: '0.75rem',
                        backgroundColor: '#f8fafc',
                        borderRadius: '8px',
                        border: '1px solid #e2e8f0'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                          <Building2 style={{ width: '14px', height: '14px', color: '#3b82f6' }} />
                          <span style={{ fontSize: '0.8rem', fontWeight: '600', color: '#1e40af' }}>
                            Tildelte ruter
                          </span>
                          <span style={{ fontSize: '0.7rem', color: '#64748b' }}>
                            ({partnerRoutes.length} ruter)
                          </span>
                        </div>
                        
                        {Object.entries(routesByDate).map(([date, routes]) => (
                          <div key={date} style={{ marginBottom: '0.5rem' }}>
                            <div style={{ fontSize: '0.7rem', fontWeight: '600', color: '#374151', marginBottom: '0.25rem' }}>
                              {new Date(date).toLocaleDateString('no-NO')}
                            </div>
                            {(routes as RouteAssignment[]).map((route) => (
                              <div key={route.id} style={{
                                padding: '0.5rem',
                                backgroundColor: '#ffffff',
                                borderRadius: '6px',
                                border: '1px solid #d1d5db',
                                marginBottom: '0.25rem'
                              }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                                  <FileText style={{ width: '12px', height: '12px', color: '#10b981' }} />
                                  <span style={{ fontSize: '0.75rem', fontWeight: '600', color: '#0f172a' }}>
                                    {route.routeName}
                                  </span>
                                  <span style={{
                                    fontSize: '0.65rem',
                                    padding: '2px 6px',
                                    backgroundColor: route.status === 'assigned' ? '#dbeafe' : 
                                                   route.status === 'in_progress' ? '#fef3c7' : '#d1fae5',
                                    color: route.status === 'assigned' ? '#1e40af' : 
                                           route.status === 'in_progress' ? '#92400e' : '#065f46',
                                    borderRadius: '4px',
                                    fontWeight: '600'
                                  }}>
                                    {route.status === 'assigned' ? 'Tildelt' : 
                                     route.status === 'in_progress' ? 'Pågår' : 'Fullført'}
                                  </span>
                                </div>
                                <div style={{ fontSize: '0.65rem', color: '#64748b', marginBottom: '0.25rem' }}>
                                  {Array.isArray(route.stops) ? route.stops.length : 0} stopp • {route.totalWeight}kg • {route.cost ? route.cost.toFixed(0) : '0'},- NOK
                                </div>
                                <div style={{ fontSize: '0.6rem', color: '#9ca3af' }}>
                                  🚗 {route.vehicle} • 👤 {route.driver}
                                </div>
                              </div>
                            ))}
                          </div>
                        ))}
                      </div>
                    );
                  })()}
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
        /* Routes Calendar View - Inline panel (not fullscreen) */
        <div style={{ 
          marginTop: '1rem',
          background: '#050a13',
          borderRadius: '16px',
          boxShadow: '0 18px 55px rgba(0,0,0,0.35)',
          overflow: 'hidden',
          border: '1px solid #1f2937',
          display: 'flex',
          flexDirection: 'column',
          minHeight: '70vh'
        }}>
            {/* Calendar Header */}
            <div style={{ 
              padding: '1.5rem', 
              borderBottom: '1px solid #1f2937',
              background: 'linear-gradient(135deg, #111827 0%, #0f172a 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              position: 'sticky',
              top: 0,
              zIndex: 2
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                <h3 style={{ 
                  fontSize: '1.5rem', 
                  fontWeight: '700', 
                  margin: 0,
                  color: '#e5e7eb',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  <Clock style={{ width: '24px', height: '24px', color: '#a5b4fc' }} />
                  Ukeplan
                </h3>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '0.5rem',
                  background: '#0b1220',
                  padding: '0.5rem',
                  borderRadius: '8px',
                  border: '1px solid #1f2937'
                }}>
                  <button
                    onClick={() => navigateWeek('prev')}
                    style={{
                      padding: '0.5rem',
                      background: '#111827',
                      border: '1px solid #1f2937',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.2s',
                      color: '#cbd5e1'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#1f2937';
                      e.currentTarget.style.borderColor = '#334155';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = '#111827';
                      e.currentTarget.style.borderColor = '#1f2937';
                    }}
                  >
                    <ChevronLeft style={{ width: '18px', height: '18px' }} />
                  </button>
                  <span style={{ 
                    fontSize: '0.875rem', 
                    fontWeight: '600',
                    minWidth: '180px',
                    textAlign: 'center',
                    color: '#cbd5e1',
                    padding: '0 1rem'
                  }}>
                    {formatDate(getWeekDates(currentDate)[0])} - {formatDate(getWeekDates(currentDate)[6])}
                  </span>
                  <button
                    onClick={() => navigateWeek('next')}
                    style={{
                      padding: '0.5rem',
                      background: '#111827',
                      border: '1px solid #1f2937',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.2s',
                      color: '#cbd5e1'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#1f2937';
                      e.currentTarget.style.borderColor = '#334155';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = '#111827';
                      e.currentTarget.style.borderColor = '#1f2937';
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
                  background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
                  color: '#f8fafc',
                  border: '1px solid #4338ca',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    transition: 'all 0.2s',
                  boxShadow: '0 6px 20px rgba(79, 70, 229, 0.35)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-1px)';
                  e.currentTarget.style.boxShadow = '0 10px 24px rgba(79, 70, 229, 0.45)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 6px 20px rgba(79, 70, 229, 0.35)';
                  }}
                >
                  I dag
                </button>
              </div>
            </div>

            {/* Enhanced Calendar Grid */}
            <div style={{ flex: 1, overflow: 'auto', background: '#050a13' }}>
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: '320px repeat(7, 1fr)', 
                minHeight: '100%',
                background: '#0f172a'
              }}>
                {/* Partner names column */}
                <div style={{ 
                  borderRight: '2px solid #1f2937',
                  background: 'linear-gradient(135deg, #111827 0%, #0f172a 100%)',
                  padding: '1rem 0'
                }}>
                  <div style={{
                    padding: '1rem 1.25rem',
                    fontSize: '0.875rem',
                    fontWeight: '700',
                    color: '#e5e7eb',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    borderBottom: '2px solid #1f2937'
                  }}>
                    Partnere
                  </div>
                  {filteredPartners.map((partner, index) => (
                    <div 
                      key={partner.id || `partner-row-${index}`}
                      style={{
                        padding: '1rem 1.25rem',
                        borderBottom: '1px solid #1f2937',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        minHeight: '80px',
                        background: selectedPartner?.id === partner.id ? '#111827' : 'transparent',
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
                          color: '#e5e7eb',
                          whiteSpace: 'normal',
                          overflow: 'hidden',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          marginBottom: '0.25rem'
                        }}>
                          {partner.name}
                        </div>
                        {(() => {
                          const vehicleNumbers = Array.isArray((partner as any)?.vehicles)
                            ? (partner as any).vehicles
                                .map((v: any) => v?.vehicleNumber)
                                .filter(Boolean)
                            : [];
                          const pad = (val: string) => {
                            const m = val.match(/\d+/);
                            if (!m) return val;
                            const n = parseInt(m[0], 10);
                            if (Number.isNaN(n) || n <= 0) return val;
                            if (n < 10) return `M00${n}`;
                            if (n < 100) return `M0${n}`;
                            return `M${n}`;
                          };
                          const formatted = vehicleNumbers.map(pad);
                          if (formatted.length === 0) return null;
                          const shown = formatted.slice(0, 3).join(', ');
                          const more = formatted.length - Math.min(formatted.length, 3);
                          return (
                            <div style={{
                              fontSize: '0.75rem',
                              color: '#a5b4fc',
                              fontWeight: '700',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              marginBottom: '0.2rem'
                            }}>
                              Bil: {shown}{more > 0 ? ` +${more}` : ''}
                            </div>
                          );
                        })()}
                        <div style={{
                          fontSize: '0.75rem',
                          color: '#94a3b8',
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
                      borderRight: dayIndex < 6 ? '1px solid #1f2937' : 'none',
                      background: isWeekend ? '#0b1220' : '#0f172a'
                    }}>
                      {/* Day header */}
                      <div style={{
                        padding: '0.75rem',
                        background: isToday 
                          ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' 
                          : isWeekend 
                            ? 'linear-gradient(135deg, #111827 0%, #0b1220 100%)'
                            : 'linear-gradient(135deg, #111827 0%, #0f172a 100%)',
                        borderBottom: '2px solid #1f2937',
                        textAlign: 'center'
                      }}>
                        <div style={{
                          fontSize: '0.875rem',
                          fontWeight: '700',
                          color: isToday ? 'white' : '#94a3b8',
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                          marginBottom: '0.5rem'
                        }}>
                          {['Søn', 'Man', 'Tir', 'Ons', 'Tor', 'Fre', 'Lør'][dayIndex]}
                        </div>
                        <div style={{
                          fontSize: '1.5rem',
                          fontWeight: '800',
                          color: isToday ? 'white' : '#e5e7eb'
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
                                borderBottom: '1px solid #1f2937',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                                background: assignment 
                                  ? 'linear-gradient(135deg, rgba(79,70,229,0.28) 0%, rgba(124,58,237,0.22) 100%)'
                                  : 'rgba(255,255,255,0.02)',
                                position: 'relative',
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'center',
                                alignItems: 'center'
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.background = assignment 
                                  ? 'linear-gradient(135deg, rgba(79,70,229,0.38) 0%, rgba(124,58,237,0.30) 100%)'
                                  : 'rgba(255,255,255,0.04)';
                                e.currentTarget.style.transform = 'scale(1.02)';
                                e.currentTarget.style.boxShadow = '0 10px 25px rgba(0, 0, 0, 0.35)';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.background = assignment 
                                  ? 'linear-gradient(135deg, rgba(79,70,229,0.28) 0%, rgba(124,58,237,0.22) 100%)'
                                  : 'rgba(255,255,255,0.02)';
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
                                    color: '#a5b4fc',
                                    fontWeight: '700'
                                  }}>
                                    <FileText style={{ width: '12px', height: '12px' }} />
                                    {assignment.routeName || 'Rute tildelt'}
                                  </div>
                                  <div style={{
                                    fontSize: '0.65rem',
                                    color: '#cbd5e1',
                                    textAlign: 'center',
                                    lineHeight: '1.3',
                                    fontWeight: '500'
                                  }}>
                                    🚗 {assignment.vehicle} • 👤 {assignment.driver}
                                  </div>
                                  <div style={{
                                    fontSize: '0.6rem',
                                    color: '#94a3b8',
                                    textAlign: 'center'
                                  }}>
                                    {Array.isArray(assignment.stops) ? assignment.stops.length : 0} stopp • {assignment.totalWeight}kg
                                  </div>
                                </div>
                              ) : (
                                <div style={{
                                  fontSize: '0.75rem',
                                  color: '#cbd5e1',
                                  textAlign: 'center',
                                  fontStyle: 'italic',
                                  fontWeight: '600',
                                  opacity: 0.9
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
          background: 'rgba(0, 0, 0, 0.65)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div data-partners-darkmodal style={{
            ...(darkModalVars as any),
            colorScheme: 'dark',
            background: 'var(--white)',
            border: '1px solid var(--gray-200)',
            borderRadius: 'var(--radius-lg)',
            padding: '2rem',
            maxWidth: '800px',
            width: '90%',
            maxHeight: '90vh',
            overflow: 'auto',
            boxShadow: '0 25px 60px rgba(0,0,0,0.60)'
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
                        console.log('📏 Value length:', value ? value.length : 0);
                        setNewPartner(prev => ({ ...prev, name: value }));
                        setBrrgSearchQuery(value);
                        if (value && value.length >= 2) {
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
                        if (brrgSearchQuery && brrgSearchQuery.length >= 2) {
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
                        if (newPartner.name && newPartner.name.length >= 2) {
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
                      background: 'var(--white)',
                      border: '1px solid var(--gray-300)',
                      borderRadius: 'var(--radius-md)',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                      zIndex: 1000,
                      maxHeight: '200px',
                      overflowY: 'auto',
                      marginTop: '0.25rem'
                    }}>
                      {Array.isArray(brrgSearchResults) && brrgSearchResults.length > 0 ? (
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
                            e.currentTarget.style.backgroundColor = 'var(--white)';
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
                        if (e.target.value && e.target.value.length >= 2) {
                          searchBrrg(e.target.value);
                          setShowBrrgSearch(true);
                        } else {
                          setShowBrrgSearch(false);
                        }
                      }}
                      onFocus={() => {
                        if (brrgSearchQuery && brrgSearchQuery.length >= 2) {
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
                        if (newPartner.orgNumber && newPartner.orgNumber.length >= 2) {
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
                    
                    {/* NEW FIELDS - Row 2 */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem', marginTop: '1rem' }}>
                      <div>
                        <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: '500', color: 'var(--gray-700)', fontSize: 'var(--font-size-sm)' }}>
                          Bil navn
                        </label>
                        <input
                          type="text"
                          placeholder="Eks: Vare 1, Lastebil Oslo"
                          value={vehicle.vehicleName || ''}
                          onChange={(e) => updateVehicle(index, 'vehicleName', e.target.value)}
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
                          Bilnummer
                        </label>
                        <input
                          type="text"
                          placeholder="Eks: #101, VAN-5"
                          value={vehicle.vehicleNumber || ''}
                          onChange={(e) => updateVehicle(index, 'vehicleNumber', e.target.value)}
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
                    
                    {/* Row 3 */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem', marginTop: '1rem' }}>
                      <div>
                        <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: '500', color: 'var(--gray-700)', fontSize: 'var(--font-size-sm)' }}>
                          Sjåfør navn *
                        </label>
                        <input
                          type="text"
                          placeholder="Eks: John Hansen"
                          value={vehicle.driverName || ''}
                          onChange={(e) => updateVehicle(index, 'driverName', e.target.value)}
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
                          Type bil
                        </label>
                        <select
                          value={vehicle.vehicleType || 'one_man'}
                          onChange={(e) => updateVehicle(index, 'vehicleType', e.target.value)}
                          style={{
                            width: '100%',
                            padding: '0.5rem',
                            border: '1px solid var(--gray-300)',
                            borderRadius: 'var(--radius-sm)',
                            fontSize: 'var(--font-size-sm)',
                            outline: 'none',
                            backgroundColor: 'white'
                          }}
                        >
                          <option value="company_car">🏢 Tjenstebil</option>
                          <option value="one_man">👤 1-manns bil</option>
                          <option value="two_man">👥 2-manns bil</option>
                        </select>
                      </div>
                    </div>
                    
                    {/* Row 4 - Driver Contact Info */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem', marginTop: '1rem' }}>
                      <div>
                        <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: '500', color: 'var(--gray-700)', fontSize: 'var(--font-size-sm)' }}>
                          Sjåfør e-post
                        </label>
                        <input
                          type="email"
                          placeholder="john.hansen@partner.no"
                          value={vehicle.driverEmail || ''}
                          onChange={(e) => updateVehicle(index, 'driverEmail', e.target.value)}
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
                          Sjåfør telefon
                        </label>
                        <input
                          type="tel"
                          placeholder="+47 123 45 678"
                          value={vehicle.driverPhone || ''}
                          onChange={(e) => updateVehicle(index, 'driverPhone', e.target.value)}
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
                    
                    {/* Driver Creation Info */}
                    {vehicle.driverName && vehicle.driverName.trim() && (
                      <div style={{
                        marginTop: '1rem',
                        padding: '0.75rem',
                        backgroundColor: '#f0f9ff',
                        border: '1px solid #0ea5e9',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: 'var(--font-size-sm)'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                          <div style={{ width: '16px', height: '16px', backgroundColor: '#0ea5e9', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '10px' }}>i</div>
                          <strong style={{ color: '#0369a1' }}>Sjåfør-konto vil bli opprettet automatisk</strong>
                        </div>
                        <p style={{ color: '#0369a1', margin: 0, fontSize: 'var(--font-size-xs)' }}>
                          Når du lagrer partneren, vil en sjåfør-konto bli opprettet for {vehicle.driverName} med tilgang til DriftPro Driver appen.
                        </p>
                      </div>
                    )}
                  </div>
                ))}
                
                {Array.isArray(vehicles) && vehicles.length === 0 && (
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
                
                {Array.isArray(uploadedFiles) && uploadedFiles.length > 0 && (
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
                          {file.name} ({file && file.size ? (file.size / 1024 / 1024).toFixed(2) : '0.00'} MB)
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
            background: '#0b1220',
            borderRadius: '12px',
            padding: '0',
            maxWidth: '900px',
            width: '95%',
            maxHeight: '90vh',
            overflow: 'hidden',
            boxShadow: '0 25px 50px rgba(0, 0, 0, 0.55)',
            border: '1px solid #1f2937'
          }}>
            {/* Modal Header */}
            <div style={{
              padding: '1.5rem 2rem',
              borderBottom: '1px solid #1f2937',
              background: 'linear-gradient(135deg, #111827 0%, #0b1220 100%)',
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
                  color: '#94a3b8',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
                  e.currentTarget.style.color = '#e5e7eb';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'none';
                  e.currentTarget.style.color = '#94a3b8';
                }}
              >
                <X style={{ width: '20px', height: '20px' }} />
              </button>
              
              <div style={{ marginBottom: '1.5rem' }}>
                <h2 style={{ 
                  fontSize: '1.25rem', 
                  fontWeight: '600', 
                  margin: '0 0 0.5rem 0',
                  color: '#e5e7eb'
                }}>
                  {selectedDate.toLocaleDateString('no-NO', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </h2>
                <p style={{ 
                  color: '#94a3b8', 
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
                      color: '#e5e7eb',
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
                        border: '1px solid #243244',
                        borderRadius: '6px',
                        fontSize: '0.875rem',
                        background: '#0f172a',
                        color: '#e5e7eb',
                        cursor: 'pointer'
                      }}
                      onFocus={(e) => {
                        e.currentTarget.style.borderColor = '#3b82f6';
                        e.currentTarget.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.20)';
                      }}
                      onBlur={(e) => {
                        e.currentTarget.style.borderColor = '#243244';
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
                      color: '#e5e7eb',
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
                      color: '#e5e7eb',
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
                        border: '1px solid #243244',
                        borderRadius: '6px',
                        fontSize: '0.875rem',
                        background: '#0f172a',
                        color: '#e5e7eb'
                      }}
                    />
                  </div>
                  <div style={{ flex: '1' }}>
                    <label style={{ 
                      display: 'block', 
                      marginBottom: '0.5rem', 
                      fontWeight: '500', 
                      color: '#e5e7eb',
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
                        border: '1px solid #243244',
                        borderRadius: '6px',
                        fontSize: '0.875rem',
                        background: '#0f172a',
                        color: '#e5e7eb'
                      }}
                    />
                  </div>
                  <div style={{ 
                    padding: '0.75rem 1rem',
                    background: '#0f172a',
                    border: '1px solid #243244',
                    borderRadius: '6px',
                    fontSize: '0.875rem',
                    color: '#cbd5e1',
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
                    color: '#94a3b8',
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
                    color: '#94a3b8',
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
                    color: '#94a3b8',
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
                    color: '#e5e7eb',
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
                      border: '1px solid #243244',
                      borderRadius: '6px',
                      fontSize: '0.875rem',
                      background: '#0f172a',
                      color: '#e5e7eb',
                      transition: 'all 0.2s'
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = '#3b82f6';
                      e.currentTarget.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.20)';
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = '#243244';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  />
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: '0.5rem', 
                    fontWeight: '500', 
                    color: '#e5e7eb',
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
                        border: '1px solid #243244',
                        borderRadius: '6px',
                        fontSize: '0.875rem',
                        background: '#0f172a',
                        color: '#e5e7eb',
                        cursor: 'pointer'
                      }}
                      onFocus={(e) => {
                        e.currentTarget.style.borderColor = '#3b82f6';
                        e.currentTarget.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.20)';
                      }}
                      onBlur={(e) => {
                        e.currentTarget.style.borderColor = '#243244';
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
                    color: '#e5e7eb',
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
                        border: '1px solid #243244',
                        borderRadius: '6px',
                        fontSize: '0.875rem',
                        background: '#0f172a',
                        color: '#e5e7eb',
                        cursor: 'pointer'
                      }}
                      onFocus={(e) => {
                        e.currentTarget.style.borderColor = '#3b82f6';
                        e.currentTarget.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.20)';
                      }}
                      onBlur={(e) => {
                        e.currentTarget.style.borderColor = '#243244';
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
                    color: '#e5e7eb',
                    fontSize: '0.875rem'
                  }}>
                    Brukere
                  </label>
                  
                  {/* Selected Users Display */}
                  {Array.isArray(selectedUsers) && selectedUsers.length > 0 && (
                    <div style={{
                      padding: '0.75rem 1rem',
                      border: '1px solid #243244',
                      borderRadius: '6px',
                      background: '#0f172a',
                      marginBottom: '0.5rem'
                    }}>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.5rem' }}>
                        {selectedUsers.map((user, index) => (
                          <div key={user} style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.25rem',
                            padding: '0.25rem 0.5rem',
                            background: 'rgba(255,255,255,0.06)',
                            borderRadius: '4px',
                            fontSize: '0.75rem',
                            color: '#e5e7eb'
                          }}>
                            <span>{user}</span>
                            <button
                              onClick={() => setSelectedUsers(prev => prev.filter((_, i) => i !== index))}
                              style={{
                                background: 'none',
                                border: 'none',
                                color: '#94a3b8',
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
                        border: '1px solid #243244',
                        borderRadius: '6px',
                        fontSize: '0.875rem',
                        background: '#0f172a',
                        color: '#e5e7eb',
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

                  <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: '#94a3b8' }}>
                    {Array.isArray(selectedUsers) && selectedUsers.length === 0 ? 'Ingen brukere valgt' : `${Array.isArray(selectedUsers) ? selectedUsers.length : 0} brukere valgt`}
                    <button style={{
                      background: 'none',
                      border: 'none',
                      color: '#60a5fa',
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
                      color: '#e5e7eb',
                      cursor: 'pointer'
                    }}>
                      Aktiver at brukere kan melde seg på denne ruten
                    </label>
                    <span style={{ color: '#94a3b8', fontSize: '0.75rem' }}>ℹ️</span>
                  </div>

                  {/* Del rute med alle knapp */}
                  <div style={{ marginTop: '1rem', padding: '1rem', background: '#0f172a', borderRadius: '8px', border: '1px solid #243244' }}>
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
                          color: '#e5e7eb', 
                          margin: '0 0 0.25rem 0' 
                        }}>
                          Sliter du med en rute?
                        </h4>
                        <p style={{ 
                          fontSize: '0.75rem', 
                          color: '#94a3b8', 
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
                    color: '#e5e7eb',
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
                        border: '1px solid #243244',
                        borderRadius: '6px',
                        fontSize: '0.875rem',
                        background: '#0f172a',
                        color: '#e5e7eb'
                      }}
                    />
                    <div style={{
                      position: 'absolute',
                      left: '0.75rem',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: '#94a3b8'
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
                    color: '#e5e7eb',
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
                      border: '1px solid #243244',
                      borderRadius: '6px',
                      fontSize: '0.875rem',
                      resize: 'vertical',
                      minHeight: '80px',
                      background: '#0f172a',
                      color: '#e5e7eb'
                    }}
                  />
                  <div style={{ marginTop: '0.5rem' }}>
                    <button style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      background: 'none',
                      border: 'none',
                      color: '#94a3b8',
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
                  border: '2px dashed #243244',
                  borderRadius: '8px',
                  padding: '2rem',
                  textAlign: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  background: '#0f172a'
                }}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.currentTarget.style.borderColor = '#3b82f6';
                  e.currentTarget.style.background = 'rgba(59, 130, 246, 0.08)';
                }}
                onDragLeave={(e) => {
                  e.currentTarget.style.borderColor = '#243244';
                  e.currentTarget.style.background = '#0f172a';
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  e.currentTarget.style.borderColor = '#243244';
                  e.currentTarget.style.background = '#0f172a';
                  const files = Array.from(e.dataTransfer.files);
                  setUploadedFiles(prev => [...prev, ...files]);
                }}
                onClick={() => document.getElementById('file-upload')?.click()}
                >
                  <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '8px',
                    background: 'rgba(255,255,255,0.06)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 1rem auto'
                  }}>
                    <FileText style={{ width: '24px', height: '24px', color: '#cbd5e1' }} />
                  </div>
                  <p style={{ 
                    color: '#94a3b8', 
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
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid #243244',
                    borderRadius: '6px',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    color: '#e5e7eb',
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
                    color: '#e5e7eb',
                    margin: '0 0 1rem 0'
                  }}>
                    Vedlegg ({uploadedFiles.length})
                  </h3>
                  <div style={{ 
                    maxHeight: '150px', 
                    overflowY: 'auto',
                    background: '#0f172a',
                    borderRadius: '6px',
                    padding: '0.5rem'
                  }}>
                    {uploadedFiles.map((file, index) => (
                      <div key={index} style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0.75rem',
                        background: '#0b1220',
                        borderRadius: '6px',
                        marginBottom: '0.5rem',
                        border: '1px solid #1f2937'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1 }}>
                          <div style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '6px',
                            background: 'rgba(255,255,255,0.06)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0
                          }}>
                            <FileText style={{ width: '16px', height: '16px', color: '#cbd5e1' }} />
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ 
                              fontSize: '0.875rem', 
                              fontWeight: '500',
                              color: '#e5e7eb',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              marginBottom: '0.125rem'
                            }}>
                              {file.name}
                            </div>
                            <div style={{ 
                              fontSize: '0.75rem', 
                              color: '#94a3b8' 
                            }}>
                              {file && file.size ? (file.size / 1024 / 1024).toFixed(2) : '0.00'} MB
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
                            color: '#94a3b8',
                            transition: 'all 0.2s',
                            flexShrink: 0
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'rgba(220,38,38,0.16)';
                            e.currentTarget.style.color = '#dc2626';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'none';
                            e.currentTarget.style.color = '#94a3b8';
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
              borderTop: '1px solid #1f2937',
              background: '#0b1220',
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
                    background: 'rgba(255,255,255,0.06)',
                    color: '#cbd5e1',
                    border: '1px solid #243244',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#334155';
                    e.currentTarget.style.color = '#e5e7eb';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = '#243244';
                    e.currentTarget.style.color = '#cbd5e1';
                  }}
                >
                  Lagre utkast
                </button>
                <button style={{
                  padding: '0.75rem 1.5rem',
                  background: 'rgba(255,255,255,0.06)',
                  color: '#cbd5e1',
                  border: '1px solid #243244',
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
                  background: 'rgba(255,255,255,0.06)',
                  color: '#cbd5e1',
                  border: '1px solid #243244',
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
          background: 'rgba(0, 0, 0, 0.65)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div data-partners-darkmodal style={{
            ...(darkModalVars as any),
            colorScheme: 'dark',
            background: 'var(--white)',
            border: '1px solid var(--gray-200)',
            borderRadius: '16px',
            width: '90%',
            maxWidth: '1000px',
            maxHeight: '90vh',
            overflow: 'hidden',
            boxShadow: '0 25px 60px rgba(0,0,0,0.60)'
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
                <h3 style={{ fontSize: '1.25rem', fontWeight: '600', margin: 0, color: 'var(--gray-900)' }}>
                  Alle Jobber ({Array.isArray(jobs) ? jobs.length : 0})
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
                      background: 'var(--gray-100)',
                      border: '1px solid var(--gray-200)',
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
                      e.currentTarget.style.borderColor = 'var(--gray-200)';
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
          background: 'rgba(0, 0, 0, 0.65)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1001
        }}>
          <div data-partners-darkmodal style={{
            ...(darkModalVars as any),
            colorScheme: 'dark',
            background: 'var(--white)',
            border: '1px solid var(--gray-200)',
            borderRadius: '16px',
            width: '90%',
            maxWidth: '500px',
            maxHeight: '90vh',
            overflow: 'hidden',
            boxShadow: '0 25px 60px rgba(0,0,0,0.60)'
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
          background: 'rgba(0, 0, 0, 0.65)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          backdropFilter: 'blur(4px)'
        }}>
          <div data-partners-darkmodal style={{
            ...(darkModalVars as any),
            colorScheme: 'dark',
            background: 'var(--white)',
            border: '1px solid var(--gray-200)',
            borderRadius: '12px',
            padding: '2rem',
            maxWidth: '500px',
            width: '95%',
            maxHeight: '90vh',
            overflowY: 'auto',
            boxShadow: '0 25px 60px rgba(0,0,0,0.60)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: '600', margin: 0, color: 'var(--gray-900)' }}>
                Opprett Bruker
              </h2>
              <button
                onClick={() => {
                  setShowCreateUserModal(false);
                  setSelectedPartnerForAction(null);
                  setNewUser({ name: '', phone: '', email: '' });
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '1.5rem',
                  cursor: 'pointer',
                  color: 'var(--gray-600)'
                }}
              >
                ×
              </button>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <p style={{ color: 'var(--gray-600)', fontSize: '0.875rem', margin: '0 0 1rem 0' }}>
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

            <div style={{ marginTop: '-0.5rem', marginBottom: '1.25rem' }}>
              <div style={{
                padding: '0.75rem 1rem',
                borderRadius: '10px',
                border: '1px solid var(--gray-200)',
                background: 'var(--gray-100)',
                color: 'var(--gray-600)',
                fontSize: '0.875rem',
                lineHeight: 1.35
              }}>
                Brukeren blir invitert via SMS og oppretter passord selv. Partner-brukere får kun tilgang til <b>sine</b> tildelte ruter, dokumenter og audit.
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  setShowCreateUserModal(false);
                  setSelectedPartnerForAction(null);
                  setNewUser({ name: '', phone: '', email: '' });
                }}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: 'rgba(255,255,255,0.06)',
                  color: 'var(--gray-800)',
                  border: '1px solid var(--gray-300)',
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
                disabled={!newUser.name || !newUser.phone}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: !newUser.name || !newUser.phone ? '#d1d5db' : '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: !newUser.name || !newUser.phone ? 'not-allowed' : 'pointer',
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
          background: 'rgba(0, 0, 0, 0.65)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '1rem'
        }}>
          <div data-partners-darkmodal style={{
            ...(darkModalVars as any),
            colorScheme: 'dark',
            background: 'var(--white)',
            border: '1px solid var(--gray-200)',
            borderRadius: '12px',
            padding: '2rem',
            width: '100%',
            maxWidth: '900px',
            maxHeight: '90vh',
            overflowY: 'auto',
            boxShadow: '0 25px 60px rgba(0,0,0,0.60)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
              <h2 style={{ 
                fontSize: '1.5rem', 
                fontWeight: '700', 
                color: 'var(--gray-900)',
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
                  color: 'var(--gray-600)'
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
              borderBottom: '1px solid var(--gray-200)',
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
                      color: editModalActiveTab === tab.id ? 'white' : 'var(--gray-600)',
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
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: 'var(--gray-800)' }}>
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
                        console.log('📏 Value length:', value ? value.length : 0);
                        setEditingPartner(prev => prev ? { ...prev, name: value } : null);
                        setBrrgSearchQuery(value);
                        if (value && value.length >= 2) {
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
                        if (brrgSearchQuery && brrgSearchQuery.length >= 2) {
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
                      background: 'var(--white)',
                      border: '1px solid var(--gray-300)',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                      zIndex: 1000,
                      maxHeight: '200px',
                      overflowY: 'auto',
                      marginTop: '0.25rem'
                    }}>
                      {Array.isArray(brrgSearchResults) && brrgSearchResults.length > 0 ? (
                        brrgSearchResults.map((company) => (
                        <div
                          key={company.organisasjonsnummer}
                          onClick={() => selectBrrgCompany(company)}
                          style={{
                            padding: '0.75rem',
                            cursor: 'pointer',
                            borderBottom: '1px solid var(--gray-200)',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = 'var(--gray-50)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'var(--white)';
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
                        <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--gray-600)' }}>
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
                        if (e.target.value && e.target.value.length >= 2) {
                          searchBrrg(e.target.value);
                          setShowBrrgSearch(true);
                        } else {
                          setShowBrrgSearch(false);
                        }
                      }}
                      onFocus={() => {
                        if (brrgSearchQuery && brrgSearchQuery.length >= 2) {
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
                      border: '1px solid var(--gray-300)',
                      background: 'var(--gray-100)',
                      color: 'var(--gray-900)',
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
                  <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: 'var(--gray-900)', margin: 0 }}>
                    Kjøretøy ({Array.isArray(editingVehicles) ? editingVehicles.length : 0})
                  </h3>
                  <button
                    onClick={() => {
                      setEditingVehicles(prev => [...prev, {
                        registrationNumber: '',
                        year: new Date().getFullYear().toString(),
                        model: '',
                        euroClass: '',
                        payload: '',
                        vehicleName: '',
                        vehicleNumber: '',
                        driverName: '',
                        vehicleType: 'one_man'
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

                {Array.isArray(editingVehicles) && editingVehicles.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--gray-600)' }}>
                    <Building2 style={{ width: '48px', height: '48px', margin: '0 auto 1rem', opacity: 0.5 }} />
                    <p>Ingen kjøretøy registrert</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {editingVehicles.map((vehicle, index) => (
                      <div key={index} style={{
                        padding: '1rem',
                        border: '1px solid var(--gray-200)',
                        borderRadius: '8px',
                        backgroundColor: 'var(--gray-100)'
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
                        
                        {/* NEW FIELDS - Row 2 */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
                          <div>
                            <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.75rem', fontWeight: '500', color: '#374151' }}>
                              Bil navn
                            </label>
                            <input
                              type="text"
                              placeholder="Eks: Vare 1"
                              value={vehicle.vehicleName || ''}
                              onChange={(e) => {
                                const newVehicles = [...editingVehicles];
                                newVehicles[index].vehicleName = e.target.value;
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
                              Bilnummer
                            </label>
                            <input
                              type="text"
                              placeholder="Eks: #101"
                              value={vehicle.vehicleNumber || ''}
                              onChange={(e) => {
                                const newVehicles = [...editingVehicles];
                                newVehicles[index].vehicleNumber = e.target.value;
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
                        
                        {/* Row 3 */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
                          <div>
                            <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.75rem', fontWeight: '500', color: '#374151' }}>
                              Sjåfør navn
                            </label>
                            <input
                              type="text"
                              placeholder="Eks: John Hansen"
                              value={vehicle.driverName || ''}
                              onChange={(e) => {
                                const newVehicles = [...editingVehicles];
                                newVehicles[index].driverName = e.target.value;
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
                              Type bil
                            </label>
                            <select
                              value={vehicle.vehicleType || 'one_man'}
                              onChange={(e) => {
                                const newVehicles = [...editingVehicles];
                                newVehicles[index].vehicleType = e.target.value as 'company_car' | 'one_man' | 'two_man';
                                setEditingVehicles(newVehicles);
                              }}
                              style={{
                                width: '100%',
                                padding: '0.5rem',
                                border: '1px solid #d1d5db',
                                borderRadius: '6px',
                                fontSize: '0.875rem',
                                outline: 'none',
                                backgroundColor: 'white'
                              }}
                            >
                              <option value="company_car">🏢 Tjenstebil</option>
                              <option value="one_man">👤 1-manns bil</option>
                              <option value="two_man">👥 2-manns bil</option>
                            </select>
                          </div>
                        </div>
                        
                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
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
                    Brukere ({Array.isArray(partnerUsers) ? partnerUsers.length : 0})
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

                {Array.isArray(partnerUsers) && partnerUsers.length === 0 ? (
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
                    Filer ({Array.isArray(editingFiles) ? editingFiles.length : 0})
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

                {Array.isArray(editingFiles) && editingFiles.length === 0 ? (
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
                              {file && file.size ? (file.size / 1024 / 1024).toFixed(2) : '0.00'} MB
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
                  background: 'rgba(255,255,255,0.06)',
                  color: 'var(--gray-800)',
                  border: '1px solid var(--gray-300)',
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
          background: 'rgba(0, 0, 0, 0.65)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '1rem'
        }}>
          <div data-partners-darkmodal style={{
            ...(darkModalVars as any),
            colorScheme: 'dark',
            background: 'var(--white)',
            border: '1px solid var(--gray-200)',
            borderRadius: '12px',
            padding: '2rem',
            width: '100%',
            maxWidth: '800px',
            maxHeight: '90vh',
            overflowY: 'auto',
            boxShadow: '0 25px 60px rgba(0,0,0,0.60)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
              <h2 style={{ 
                fontSize: '1.5rem', 
                fontWeight: '700', 
                color: 'var(--gray-900)',
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
                  color: 'var(--gray-600)',
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
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: 'var(--gray-800)' }}>
                  Audit Type
                </label>
                <select
                  value={newAudit.auditType}
                  onChange={(e) => setNewAudit(prev => ({ ...prev, auditType: e.target.value as any }))}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid var(--gray-300)',
                    background: 'var(--gray-100)',
                    color: 'var(--gray-900)',
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
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: 'var(--gray-800)' }}>
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
                  background: 'rgba(255,255,255,0.06)',
                  color: 'var(--gray-800)',
                  border: '1px solid var(--gray-300)',
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
          background: 'rgba(0, 0, 0, 0.65)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '1rem'
        }}>
          <div data-partners-darkmodal style={{
            ...(darkModalVars as any),
            colorScheme: 'dark',
            background: 'var(--white)',
            border: '1px solid var(--gray-200)',
            borderRadius: '12px',
            padding: '2rem',
            width: '100%',
            maxWidth: '600px',
            maxHeight: '80vh',
            overflowY: 'auto',
            boxShadow: '0 25px 60px rgba(0,0,0,0.60)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
              <h2 style={{ 
                fontSize: '1.5rem', 
                fontWeight: '700', 
                color: 'var(--gray-900)',
                margin: 0,
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem'
              }}>
                <AlertTriangle style={{ width: '24px', height: '24px', color: '#dc2626' }} />
                {activeView === 'routes' ? 'Rutevarsler (aksept / avvist / venter)' : 'Audit Varsler'}
              </h2>
              <button
                onClick={() => setShowNotificationModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '0.5rem',
                  borderRadius: '0.5rem',
                  color: 'var(--gray-600)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <X style={{ width: '20px', height: '20px' }} />
              </button>
            </div>

            {activeView === 'routes' ? (
              <>
                {(!routeAlertItems || routeAlertItems.length === 0) ? (
                  <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--gray-600)' }}>
                    <AlertTriangle style={{ width: '48px', height: '48px', margin: '0 auto 1rem', opacity: 0.5 }} />
                    <p>Ingen rutevarsler akkurat nå</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                      <span style={{ padding: '0.35rem 0.75rem', borderRadius: '999px', background: 'rgba(16,185,129,0.12)', color: '#16a34a', fontWeight: 700 }}>
                        Akseptert: {routeAcceptanceStats.accepted}
                      </span>
                      <span style={{ padding: '0.35rem 0.75rem', borderRadius: '999px', background: 'rgba(37,99,235,0.12)', color: '#2563eb', fontWeight: 700 }}>
                        Venter: {routeAcceptanceStats.pending}
                      </span>
                      <span style={{ padding: '0.35rem 0.75rem', borderRadius: '999px', background: 'rgba(239,68,68,0.12)', color: '#ef4444', fontWeight: 700 }}>
                        Avvist: {routeAcceptanceStats.declined}
                      </span>
                    </div>
                    {routeAlertItems.map((item) => {
                      const pill = item.status === 'accepted'
                        ? { text: 'Akseptert', color: '#16a34a', bg: 'rgba(22,163,74,0.12)' }
                        : item.status === 'declined'
                          ? { text: 'Avvist', color: '#ef4444', bg: 'rgba(239,68,68,0.12)' }
                          : { text: 'Venter', color: '#2563eb', bg: 'rgba(37,99,235,0.12)' };

                      return (
                        <div
                          key={item.id}
                          style={{
                            padding: '1rem',
                            border: '1px solid #e2e8f0',
                            borderRadius: '10px',
                            background: 'var(--white)'
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.75rem' }}>
                            <div>
                              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.25rem' }}>
                                <span style={{ fontWeight: 700, color: '#0f172a' }}>{item.routeName}</span>
                                <span style={{ padding: '0.2rem 0.6rem', borderRadius: '999px', background: pill.bg, color: pill.color, fontSize: '0.75rem', fontWeight: 700 }}>
                                  {pill.text}
                                </span>
                              </div>
                              <div style={{ color: '#475569', fontSize: '0.9rem', marginBottom: '0.2rem' }}>
                                {item.partnerName}
                              </div>
                              <div style={{ color: '#64748b', fontSize: '0.85rem' }}>
                                🚗 {item.vehicle} • 👤 {item.driver}
                              </div>
                            </div>
                            <div style={{ color: '#94a3b8', fontSize: '0.8rem', textAlign: 'right' }}>
                              {item.date ? new Date(item.date).toLocaleDateString('no-NO') : ''}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            ) : (
              <>
                {Array.isArray(auditNotifications) && auditNotifications.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--gray-600)' }}>
                    <AlertTriangle style={{ width: '48px', height: '48px', margin: '0 auto 1rem', opacity: 0.5 }} />
                    <p>Ingen audit-varsler for øyeblikket</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {auditNotifications.map((notification) => {
                      const getNotificationStyle = (type: string, read: boolean) => {
                        switch (type) {
                          case 'overdue':
                            return {
                              backgroundColor: read ? 'var(--gray-100)' : 'rgba(220, 38, 38, 0.12)',
                              borderLeft: `4px solid ${read ? '#334155' : '#dc2626'}`,
                              icon: AlertTriangle,
                              iconColor: '#dc2626'
                            };
                          case 'upcoming':
                            return {
                              backgroundColor: read ? 'var(--gray-100)' : 'rgba(59, 130, 246, 0.12)',
                              borderLeft: `4px solid ${read ? '#334155' : '#3b82f6'}`,
                              icon: Calendar,
                              iconColor: '#3b82f6'
                            };
                          default:
                            return {
                              backgroundColor: read ? 'var(--gray-100)' : 'rgba(220, 38, 38, 0.12)',
                              borderLeft: `4px solid ${read ? '#334155' : '#dc2626'}`,
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
              </>
            )}

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '2rem' }}>
              <button
                onClick={() => setShowNotificationModal(false)}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: 'rgba(255,255,255,0.06)',
                  color: 'var(--gray-800)',
                  border: '1px solid var(--gray-300)',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  fontWeight: '500'
                }}
              >
                Lukk
              </button>
              {activeView !== 'routes' && Array.isArray(auditNotifications) && auditNotifications.length > 0 && (
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
          background: 'rgba(0, 0, 0, 0.65)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '1rem'
        }}>
          <div data-partners-darkmodal style={{
            ...(darkModalVars as any),
            colorScheme: 'dark',
            background: 'var(--white)',
            border: '1px solid var(--gray-200)',
            borderRadius: '12px',
            padding: '2rem',
            width: '100%',
            maxWidth: '900px',
            maxHeight: '90vh',
            overflowY: 'auto',
            boxShadow: '0 25px 60px rgba(0,0,0,0.60)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
              <h2 style={{ 
                fontSize: '1.5rem', 
                fontWeight: '700', 
                color: 'var(--gray-900)',
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
                    color: 'var(--gray-600)',
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
                        border: '1px solid var(--gray-200)',
                        borderRadius: '8px',
                        backgroundColor: 'var(--gray-100)',
                        cursor: 'pointer'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                        <IconComponent style={{ width: '20px', height: '20px', color: categoryInfo.color }} />
                        <span style={{ fontWeight: '600', color: 'var(--gray-900)' }}>
                          {categoryInfo.label}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.875rem', color: 'var(--gray-600)' }}>
                        {Array.isArray(categoryDocs) ? categoryDocs.length : 0} dokumenter
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Documents List */}
            <div style={{ marginBottom: '2rem' }}>
              <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: 'var(--gray-900)', marginBottom: '1rem' }}>
                Alle Dokumenter ({Array.isArray(partnerDocuments) ? partnerDocuments.length : 0})
              </h3>
              
              {Array.isArray(partnerDocuments) && partnerDocuments.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--gray-600)' }}>
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
                          border: '1px solid var(--gray-200)',
                          borderRadius: '8px',
                          backgroundColor: 'var(--gray-100)',
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
                              color: 'var(--gray-900)',
                              margin: '0 0 0.25rem 0'
                            }}>
                              {document.name}
                            </h4>
                            <p style={{ 
                              fontSize: '0.875rem', 
                              color: 'var(--gray-600)',
                              margin: '0 0 0.25rem 0'
                            }}>
                              {document.description}
                            </p>
                            <div style={{ display: 'flex', gap: '1rem', fontSize: '0.75rem', color: 'var(--gray-600)' }}>
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
                              background: 'rgba(255,255,255,0.06)',
                              color: 'var(--gray-900)',
                              border: '1px solid var(--gray-300)',
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
          background: 'rgba(0, 0, 0, 0.65)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1001,
          padding: '1rem'
        }}>
          <div data-partners-darkmodal style={{
            ...(darkModalVars as any),
            colorScheme: 'dark',
            background: 'var(--white)',
            border: '1px solid var(--gray-200)',
            borderRadius: '12px',
            padding: '2rem',
            width: '100%',
            maxWidth: '500px',
            boxShadow: '0 25px 60px rgba(0,0,0,0.60)'
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
                    background: 'rgba(255,255,255,0.06)',
                    color: 'var(--gray-800)',
                    border: '1px solid var(--gray-300)',
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

      {/* Notification Modal */}
      {showNotificationModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.65)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '1rem'
        }}>
          <div data-partners-darkmodal style={{
            ...(darkModalVars as any),
            colorScheme: 'dark',
            background: 'var(--white)',
            border: '1px solid var(--gray-200)',
            borderRadius: '12px',
            padding: '2rem',
            width: '100%',
            maxWidth: '600px',
            maxHeight: '80vh',
            overflowY: 'auto',
            boxShadow: '0 25px 60px rgba(0,0,0,0.60)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
              <h2 style={{ 
                fontSize: '1.5rem', 
                fontWeight: '700', 
                color: 'var(--gray-900)',
                margin: 0,
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem'
              }}>
                <AlertTriangle style={{ width: '24px', height: '24px', color: '#dc2626' }} />
                {activeView === 'routes' ? 'Rutevarsler (aksept / avvist / venter)' : 'Audit Varsler'}
              </h2>
              <button
                onClick={() => setShowNotificationModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '0.5rem',
                  borderRadius: '0.5rem',
                  color: 'var(--gray-600)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <X style={{ width: '20px', height: '20px' }} />
              </button>
            </div>

            {activeView === 'routes' ? (
              <>
                {(!routeAlertItems || routeAlertItems.length === 0) ? (
                  <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--gray-600)' }}>
                    <AlertTriangle style={{ width: '48px', height: '48px', margin: '0 auto 1rem', opacity: 0.5 }} />
                    <p>Ingen rutevarsler akkurat nå</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                      <span style={{ padding: '0.35rem 0.75rem', borderRadius: '999px', background: 'rgba(16,185,129,0.12)', color: '#16a34a', fontWeight: 700 }}>
                        Akseptert: {routeAcceptanceStats.accepted}
                      </span>
                      <span style={{ padding: '0.35rem 0.75rem', borderRadius: '999px', background: 'rgba(37,99,235,0.12)', color: '#2563eb', fontWeight: 700 }}>
                        Venter: {routeAcceptanceStats.pending}
                      </span>
                      <span style={{ padding: '0.35rem 0.75rem', borderRadius: '999px', background: 'rgba(239,68,68,0.12)', color: '#ef4444', fontWeight: 700 }}>
                        Avvist: {routeAcceptanceStats.declined}
                      </span>
                    </div>
                    {routeAlertItems.map((item) => {
                      const pill = item.status === 'accepted'
                        ? { text: 'Akseptert', color: '#16a34a', bg: 'rgba(22,163,74,0.12)' }
                        : item.status === 'declined'
                          ? { text: 'Avvist', color: '#ef4444', bg: 'rgba(239,68,68,0.12)' }
                          : { text: 'Venter', color: '#2563eb', bg: 'rgba(37,99,235,0.12)' };

                      return (
                        <div
                          key={item.id}
                          style={{
                            padding: '1rem',
                            border: '1px solid #e2e8f0',
                            borderRadius: '10px',
                            background: 'var(--white)'
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.75rem' }}>
                            <div>
                              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.25rem' }}>
                                <span style={{ fontWeight: 700, color: '#0f172a' }}>{item.routeName}</span>
                                <span style={{ padding: '0.2rem 0.6rem', borderRadius: '999px', background: pill.bg, color: pill.color, fontSize: '0.75rem', fontWeight: 700 }}>
                                  {pill.text}
                                </span>
                              </div>
                              <div style={{ color: '#475569', fontSize: '0.9rem', marginBottom: '0.2rem' }}>
                                {item.partnerName}
                              </div>
                              <div style={{ color: '#64748b', fontSize: '0.85rem' }}>
                                🚗 {item.vehicle} • 👤 {item.driver}
                              </div>
                            </div>
                            <div style={{ color: '#94a3b8', fontSize: '0.8rem', textAlign: 'right' }}>
                              {item.date ? new Date(item.date).toLocaleDateString('no-NO') : ''}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            ) : (
              <>
                {Array.isArray(auditNotifications) && auditNotifications.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--gray-600)' }}>
                    <AlertTriangle style={{ width: '48px', height: '48px', margin: '0 auto 1rem', opacity: 0.5 }} />
                    <p>Ingen audit-varsler for øyeblikket</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {auditNotifications.map((notification) => {
                      const getNotificationStyle = (type: string, read: boolean) => {
                        switch (type) {
                          case 'overdue':
                            return {
                              backgroundColor: read ? 'var(--gray-100)' : 'rgba(220, 38, 38, 0.12)',
                              borderLeft: `4px solid ${read ? '#334155' : '#dc2626'}`,
                              icon: AlertTriangle,
                              iconColor: '#dc2626'
                            };
                          case 'upcoming':
                            return {
                              backgroundColor: read ? 'var(--gray-100)' : 'rgba(59, 130, 246, 0.12)',
                              borderLeft: `4px solid ${read ? '#334155' : '#3b82f6'}`,
                              icon: Calendar,
                              iconColor: '#3b82f6'
                            };
                          default:
                            return {
                              backgroundColor: read ? 'var(--gray-100)' : 'rgba(220, 38, 38, 0.12)',
                              borderLeft: `4px solid ${read ? '#334155' : '#dc2626'}`,
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
              </>
            )}

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '2rem' }}>
              <button
                onClick={() => setShowNotificationModal(false)}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: 'rgba(255,255,255,0.06)',
                  color: 'var(--gray-800)',
                  border: '1px solid var(--gray-300)',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  fontWeight: '500'
                }}
              >
                Lukk
              </button>
              {activeView !== 'routes' && Array.isArray(auditNotifications) && auditNotifications.length > 0 && (
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
          background: 'rgba(0, 0, 0, 0.65)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '1rem'
        }}>
          <div data-partners-darkmodal style={{
            ...(darkModalVars as any),
            colorScheme: 'dark',
            background: 'var(--white)',
            border: '1px solid var(--gray-200)',
            borderRadius: '12px',
            padding: '2rem',
            width: '100%',
            maxWidth: '900px',
            maxHeight: '90vh',
            overflowY: 'auto',
            boxShadow: '0 25px 60px rgba(0,0,0,0.60)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
              <h2 style={{ 
                fontSize: '1.5rem', 
                fontWeight: '700', 
                color: 'var(--gray-900)',
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
                    color: 'var(--gray-600)',
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
                        border: '1px solid var(--gray-200)',
                        borderRadius: '8px',
                        backgroundColor: 'var(--gray-100)',
                        cursor: 'pointer'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                        <IconComponent style={{ width: '20px', height: '20px', color: categoryInfo.color }} />
                        <span style={{ fontWeight: '600', color: 'var(--gray-900)' }}>
                          {categoryInfo.label}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.875rem', color: 'var(--gray-600)' }}>
                        {Array.isArray(categoryDocs) ? categoryDocs.length : 0} dokumenter
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Documents List */}
            <div style={{ marginBottom: '2rem' }}>
              <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: 'var(--gray-900)', marginBottom: '1rem' }}>
                Alle Dokumenter ({Array.isArray(partnerDocuments) ? partnerDocuments.length : 0})
              </h3>
              
              {Array.isArray(partnerDocuments) && partnerDocuments.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--gray-600)' }}>
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
                          border: '1px solid var(--gray-200)',
                          borderRadius: '8px',
                          backgroundColor: 'var(--gray-100)',
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
                              color: 'var(--gray-900)',
                              margin: '0 0 0.25rem 0'
                            }}>
                              {document.name}
                            </h4>
                            <p style={{ 
                              fontSize: '0.875rem', 
                              color: 'var(--gray-600)',
                              margin: '0 0 0.25rem 0'
                            }}>
                              {document.description}
                            </p>
                            <div style={{ display: 'flex', gap: '1rem', fontSize: '0.75rem', color: 'var(--gray-600)' }}>
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
                              background: 'rgba(255,255,255,0.06)',
                              color: 'var(--gray-900)',
                              border: '1px solid var(--gray-300)',
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
          background: 'rgba(0, 0, 0, 0.65)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1001,
          padding: '1rem'
        }}>
          <div data-partners-darkmodal style={{
            ...(darkModalVars as any),
            colorScheme: 'dark',
            background: 'var(--white)',
            border: '1px solid var(--gray-200)',
            borderRadius: '12px',
            padding: '2rem',
            width: '100%',
            maxWidth: '500px',
            boxShadow: '0 25px 60px rgba(0,0,0,0.60)'
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
                    background: 'rgba(255,255,255,0.06)',
                    color: 'var(--gray-800)',
                    border: '1px solid var(--gray-300)',
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
          background: 'rgba(0, 0, 0, 0.65)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '1rem'
        }}>
          <div data-partners-darkmodal style={{
            ...(darkModalVars as any),
            colorScheme: 'dark',
            background: 'var(--white)',
            border: '1px solid var(--gray-200)',
            borderRadius: '12px',
            padding: '2rem',
            width: '100%',
            maxWidth: '800px',
            maxHeight: '90vh',
            overflowY: 'auto',
            boxShadow: '0 25px 60px rgba(0,0,0,0.60)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
              <h2 style={{ 
                fontSize: '1.5rem', 
                fontWeight: '700', 
                color: 'var(--gray-900)',
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
                Alle Brukere ({Array.isArray(partnerUsers) ? partnerUsers.length : 0})
              </h3>
              
              {Array.isArray(partnerUsers) && partnerUsers.length === 0 ? (
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
