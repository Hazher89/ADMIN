'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { firebaseService, InternalAudit, Deviation as FirestoreDeviation, Employee, Department, AuditDocument, AuditComment, RiskAssessment, FollowUpAction, Checkpoint } from '@/lib/firebase-services';
import { 
  Shield, 
  Plus, 
  Search, 
  Filter, 
  Eye, 
  Edit, 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  Calendar,
  FileText,
  Users,
  Target,
  Activity,
  BarChart3,
  Download,
  X,
  ChevronDown,
  TrendingUp,
  AlertTriangle,
  CheckSquare,
  Upload,
  MessageSquare,
  Trash2,
  MapPin,
  User,
  Save
} from 'lucide-react';

interface Audit {
  id: string;
  title: string;
  type: string;
  scope: string;
  status: string;
  plannedDate: string;
  completedDate?: string;
  responsiblePerson: string;
  department: string;
  findings: string[];
  recommendations: string[];
  priority: 'Høy' | 'Middels' | 'Lav';
  nextReview: string;
}

// Helper component for multi-select responsible persons
const ResponsiblePersonMultiSelect = ({ 
  selectedIds, 
  onChange, 
  employees, 
  label = 'Ansvarlige ansatte *' 
}: { 
  selectedIds: string[]; 
  onChange: (ids: string[]) => void; 
  employees: Employee[];
  label?: string;
}) => (
  <div>
    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-color)', marginBottom: '0.5rem' }}>
      {label}
    </label>
    <div style={{
      border: '1px solid var(--border-color)',
      borderRadius: '8px',
      padding: '0.5rem',
      maxHeight: '200px',
      overflowY: 'auto',
      background: 'var(--card-background)'
    }}>
      {employees.map(emp => (
        <label key={emp.id} style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.5rem',
          cursor: 'pointer',
          borderRadius: '4px',
          transition: 'background 0.2s'
        }}
        onMouseEnter={(e) => e.currentTarget.style.background = 'var(--gray-100)'}
        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
        >
          <input
            type="checkbox"
            checked={selectedIds.includes(emp.id)}
            onChange={(e) => {
              if (e.target.checked) {
                onChange([...selectedIds, emp.id]);
              } else {
                onChange(selectedIds.filter(id => id !== emp.id));
              }
            }}
            style={{ cursor: 'pointer' }}
          />
          <span style={{ fontSize: '0.875rem', color: 'var(--text-color)' }}>
            {emp.displayName}
          </span>
        </label>
      ))}
    </div>
    {selectedIds.length === 0 && (
      <p style={{ fontSize: '0.75rem', color: 'var(--danger)', marginTop: '0.25rem' }}>
        Velg minst én ansvarlig ansatt
      </p>
    )}
  </div>
);

export default function AuditPage() {
  const { userProfile } = useAuth();
  
  // Shared state
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [activeTab, setActiveTab] = useState('audits');
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  
  // Tab: Internrevisjon
  const [audits, setAudits] = useState<InternalAudit[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedPriority, setSelectedPriority] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedAudit, setSelectedAudit] = useState<InternalAudit | null>(null);
  const [uploadingDocument, setUploadingDocument] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadingFiles, setUploadingFiles] = useState<{ [key: string]: boolean }>({});
  const [uploadProgressFiles, setUploadProgressFiles] = useState<{ [key: string]: number }>({});
  const [selectedFiles, setSelectedFiles] = useState<{ [key: string]: File[] }>({});
  
  // Tab: Avvik
  const [deviations, setDeviations] = useState<FirestoreDeviation[]>([]);
  const [deviationSearchTerm, setDeviationSearchTerm] = useState('');
  const [deviationStatus, setDeviationStatus] = useState('all');
  const [deviationType, setDeviationType] = useState('all');
  const [deviationSeverity, setDeviationSeverity] = useState('all');
  const [showAddDeviationModal, setShowAddDeviationModal] = useState(false);
  const [showEditDeviationModal, setShowEditDeviationModal] = useState(false);
  const [showDeviationDetailModal, setShowDeviationDetailModal] = useState(false);
  const [selectedDeviation, setSelectedDeviation] = useState<FirestoreDeviation | null>(null);
  
  // Tab: Risikovurdering
  const [riskAssessments, setRiskAssessments] = useState<any[]>([]);
  const [showAddRiskModal, setShowAddRiskModal] = useState(false);
  const [showEditRiskModal, setShowEditRiskModal] = useState(false);
  const [selectedRisk, setSelectedRisk] = useState<any>(null);
  
  // Tab: Oppfølgingstiltak
  const [followUpActions, setFollowUpActions] = useState<any[]>([]);
  const [showAddFollowUpModal, setShowAddFollowUpModal] = useState(false);
  const [showEditFollowUpModal, setShowEditFollowUpModal] = useState(false);
  const [selectedFollowUp, setSelectedFollowUp] = useState<any>(null);
  
  // Tab: Kontrollpunkter
  const [checkpoints, setCheckpoints] = useState<any[]>([]);
  const [showAddCheckpointModal, setShowAddCheckpointModal] = useState(false);
  const [showEditCheckpointModal, setShowEditCheckpointModal] = useState(false);
  const [selectedCheckpoint, setSelectedCheckpoint] = useState<any>(null);
  
  // Form states
  const [newAudit, setNewAudit] = useState({
    title: '',
    type: 'Internrevisjon' as 'Internrevisjon' | 'Eksternrevisjon' | 'Regulatorisk' | 'Kvalitetsrevisjon' | 'Sikkerhetsrevisjon' | 'Finansiell',
    scope: '',
    plannedDate: '',
    responsiblePerson: '',
    responsiblePersonId: '',
    responsiblePersonIds: [] as string[],
    department: '',
    departmentId: '',
    priority: 'Middels' as 'Høy' | 'Middels' | 'Lav',
    nextReview: '',
    description: '',
    objectives: [] as string[],
    standards: [] as string[],
    estimatedHours: 0,
    assignedAuditors: [] as string[],
    status: 'Planlagt' as 'Planlagt' | 'Pågående' | 'Fullført' | 'Avbrutt' | 'Overdue'
  });
  
  const [newDeviation, setNewDeviation] = useState({
    title: '',
    description: '',
    type: 'safety' as 'safety' | 'quality' | 'security' | 'process' | 'environmental' | 'health' | 'other',
    severity: 'medium' as 'low' | 'medium' | 'high' | 'critical',
    status: 'reported' as 'reported' | 'investigating' | 'in_progress' | 'resolved' | 'closed',
    departmentId: '',
    location: '',
    equipment: '',
    cost: 0,
    riskAssessment: '',
    immediateActions: '',
    rootCause: '',
    correctiveActions: '',
    preventiveActions: '',
    attachments: [] as string[],
    witnesses: [] as string[],
    investigationRequired: false,
    regulatoryReport: false,
    assignedToIds: [] as string[]
  });
  
  const [newRiskAssessment, setNewRiskAssessment] = useState({
    title: '',
    description: '',
    departmentId: '',
    location: '',
    activity: '',
    hazard: '',
    riskLevel: 'medium' as 'low' | 'medium' | 'high' | 'critical',
    probability: '0' as string,
    probabilityValue: 0,
    probabilityLabel: 'Skjer aldri' as string,
    consequence: 'medium' as 'low' | 'medium' | 'high' | 'critical',
    existingControls: '',
    existingControlsProbability: '',
    existingControlsConsequence: '',
    additionalControls: '',
    whatCanHappen: '',
    eventDescriptionAndConsequence: '',
    eventCauseDescription: '',
    mappedDate: new Date().toISOString().split('T')[0],
    responsiblePerson: '',
    responsiblePersonIds: [] as string[],
    reviewDate: '',
    attachments: [] as string[],
    status: 'draft' as 'draft' | 'pending_approval' | 'approved' | 'rejected',
    // New fields from the form
    area: '',
    cause: '',
    processes: '',
    reference2: '',
    reference3: '',
    reference4: '',
    notes: '',
    timestampSignature: '',
    // Risk categories
    riskPerson: { enabled: false, value: '0', level: 0 },
    riskEconomy: { enabled: false, value: '0', level: 0 },
    riskEnvironment: { enabled: false, value: '0', level: 0 },
    riskReputation: { enabled: false, value: '0', level: 0 },
    riskDelivery: { enabled: false, value: '0', level: 0 },
    riskSecurity: { enabled: false, value: '0', level: 0 }
  });
  
  const [newFollowUpAction, setNewFollowUpAction] = useState({
    title: '',
    description: '',
    relatedAuditId: '',
    relatedDeviationId: '',
    responsiblePerson: '',
    responsiblePersonId: '',
    responsiblePersonIds: [] as string[],
    departmentId: '',
    dueDate: '',
    status: 'not_started' as 'not_started' | 'in_progress' | 'completed' | 'overdue',
    priority: 'Middels' as 'Høy' | 'Middels' | 'Lav',
    completedDate: '',
    completedBy: '',
    verificationRequired: false
  });
  
  const [newCheckpoint, setNewCheckpoint] = useState({
    title: '',
    description: '',
    departmentId: '',
    category: 'safety' as 'safety' | 'quality' | 'environmental' | 'process' | 'regulatory',
    frequency: 'monthly' as 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly',
    responsiblePerson: '',
    responsiblePersonId: '',
    responsiblePersonIds: [] as string[],
    lastChecked: '',
    nextCheck: '',
    status: 'pending' as 'pending' | 'completed' | 'failed' | 'overdue',
    checklist: [] as { item: string; checked: boolean; notes?: string }[]
  });

  // Load data
  useEffect(() => {
    if (userProfile?.companyId) {
      loadAllData();
    }
  }, [userProfile?.companyId, activeTab]);

  const loadAllData = async () => {
    if (!userProfile?.companyId) return;
    
    setLoading(true);
    try {
      await Promise.all([
        loadEmployees(),
        loadDepartments(),
        loadAudits(),
        loadDeviations(),
        loadRiskAssessments(),
        loadFollowUpActions(),
        loadCheckpoints()
      ]);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadEmployees = async () => {
    if (!userProfile?.companyId) return;
    try {
      const data = await firebaseService.getEmployees(userProfile.companyId);
      setEmployees(data);
    } catch (error) {
      console.error('Error loading employees:', error);
    }
  };

  const loadDepartments = async () => {
    if (!userProfile?.companyId) return;
    try {
      const data = await firebaseService.getDepartments(userProfile.companyId);
      setDepartments(data);
    } catch (error) {
      console.error('Error loading departments:', error);
    }
  };

  const loadAudits = async () => {
    if (!userProfile?.companyId || activeTab !== 'audits') return;
    try {
      const data = await firebaseService.getInternalAudits(userProfile.companyId, {
        status: selectedStatus !== 'all' ? selectedStatus : undefined,
        type: selectedType !== 'all' ? selectedType : undefined,
        priority: selectedPriority !== 'all' ? selectedPriority : undefined
      });
      setAudits(data);
    } catch (error) {
      console.error('Error loading audits:', error);
      setAudits([]);
    }
  };

  const loadDeviations = async () => {
    if (!userProfile?.companyId || activeTab !== 'deviations') return;
    try {
      const userContext = userProfile ? {
        userId: userProfile.id,
        role: (userProfile.role === 'driver' ? 'employee' : userProfile.role) as 'admin' | 'super_admin' | 'department_leader' | 'employee',
        departmentId: userProfile.departmentId,
        companyId: userProfile.companyId
      } : undefined;
      const data = await firebaseService.getDeviations(userProfile.companyId, userContext, {
        status: deviationStatus !== 'all' ? deviationStatus : undefined,
        type: deviationType !== 'all' ? deviationType : undefined,
        severity: deviationSeverity !== 'all' ? deviationSeverity : undefined
      });
      setDeviations(data);
    } catch (error) {
      console.error('Error loading deviations:', error);
      setDeviations([]);
    }
  };

  const loadRiskAssessments = async () => {
    if (!userProfile?.companyId || activeTab !== 'risk-assessment') return;
    try {
      const data = await firebaseService.getRiskAssessments(userProfile.companyId);
      setRiskAssessments(data);
    } catch (error) {
      console.error('Error loading risk assessments:', error);
    setRiskAssessments([]);
    }
  };

  const loadFollowUpActions = async () => {
    if (!userProfile?.companyId || activeTab !== 'follow-up') return;
    try {
      const data = await firebaseService.getFollowUpActions(userProfile.companyId);
      setFollowUpActions(data);
    } catch (error) {
      console.error('Error loading follow-up actions:', error);
    setFollowUpActions([]);
    }
  };

  const loadCheckpoints = async () => {
    if (!userProfile?.companyId || activeTab !== 'checkpoints') return;
    try {
      const data = await firebaseService.getCheckpoints(userProfile.companyId);
      setCheckpoints(data);
    } catch (error) {
      console.error('Error loading checkpoints:', error);
    setCheckpoints([]);
    }
  };

  // Check if mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Filter functions
  const filteredAudits = audits.filter(audit => {
    const matchesSearch = audit.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         audit.responsiblePerson.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         audit.department.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = selectedStatus === 'all' || audit.status === selectedStatus;
    const matchesType = selectedType === 'all' || audit.type === selectedType;
    const matchesPriority = selectedPriority === 'all' || audit.priority === selectedPriority;
    return matchesSearch && matchesStatus && matchesType && matchesPriority;
  });

  const filteredDeviations = deviations.filter(dev => {
    const matchesSearch = dev.title?.toLowerCase().includes(deviationSearchTerm.toLowerCase()) ||
                         dev.description?.toLowerCase().includes(deviationSearchTerm.toLowerCase()) ||
                         dev.location?.toLowerCase().includes(deviationSearchTerm.toLowerCase());
    const matchesStatus = deviationStatus === 'all' || dev.status === deviationStatus;
    const matchesType = deviationType === 'all' || dev.type === deviationType;
    const matchesSeverity = deviationSeverity === 'all' || dev.severity === deviationSeverity;
    return matchesSearch && matchesStatus && matchesType && matchesSeverity;
  });

  // Handler functions for Audits
  const handleAddAudit = async () => {
    if (!newAudit.title || !newAudit.plannedDate || !newAudit.responsiblePersonIds || newAudit.responsiblePersonIds.length === 0 || !userProfile?.companyId) {
      alert('Vennligst fyll ut alle påkrevde felt, inkludert minst én ansvarlig ansatt');
      return;
    }

    try {
      setUploadingFiles(prev => ({ ...prev, 'audit-add': true }));
      const selectedEmployees = employees.filter(e => newAudit.responsiblePersonIds.includes(e.id));
      const responsiblePersonNames = selectedEmployees.map(e => e.displayName).join(', ');
      const dept = departments.find(d => d.id === newAudit.departmentId);
      
      const auditId = await firebaseService.createInternalAudit({
        ...newAudit,
        responsiblePerson: responsiblePersonNames,
        responsiblePersonId: newAudit.responsiblePersonIds[0], // Keep for backward compatibility
        responsiblePersonIds: newAudit.responsiblePersonIds,
        department: dept?.name || newAudit.department,
        findings: [],
        recommendations: [],
        status: 'Planlagt',
        companyId: userProfile.companyId,
        createdBy: userProfile.id
      });
      
      // Upload files if any
      const filesToUpload = selectedFiles['audit-add'] || [];
      if (filesToUpload.length > 0 && userProfile.id) {
        for (let i = 0; i < filesToUpload.length; i++) {
          const file = filesToUpload[i];
          setUploadProgressFiles(prev => ({ ...prev, 'audit-add': ((i + 1) / filesToUpload.length) * 100 }));
          try {
            await firebaseService.uploadAuditDocument(file, auditId, userProfile.companyId, userProfile.id, `Vedlegg: ${file.name}`);
          } catch (fileError) {
            console.error(`Error uploading file ${file.name}:`, fileError);
          }
        }
      }
      
      await loadAudits();
      setNewAudit({
        title: '',
        type: 'Internrevisjon',
        scope: '',
        plannedDate: '',
        responsiblePerson: '',
        responsiblePersonId: '',
        responsiblePersonIds: [],
        department: '',
        departmentId: '',
        priority: 'Middels',
        nextReview: '',
        description: '',
        objectives: [],
        standards: [],
        estimatedHours: 0,
        assignedAuditors: [],
        status: 'Planlagt'
      });
      setSelectedFiles(prev => ({ ...prev, 'audit-add': [] }));
      setUploadProgressFiles(prev => ({ ...prev, 'audit-add': 0 }));
      setShowAddModal(false);
    } catch (error) {
      console.error('Error creating audit:', error);
      alert('Feil ved opprettelse av revisjon');
    } finally {
      setUploadingFiles(prev => ({ ...prev, 'audit-add': false }));
    }
  };

  // Helper function to send status update email
  const sendStatusUpdateEmail = async (caseType: string, caseTitle: string, oldStatus: string, newStatus: string, createdBy: string, companyId: string) => {
    try {
      const creator = await firebaseService.getEmployee(createdBy);
      if (!creator || !creator.email) return;

      const { globalEmailService } = await import('@/lib/global-email-service');
      
      const statusLabels: Record<string, string> = {
        'Planlagt': 'Planlagt',
        'Pågående': 'Pågående',
        'Fullført': 'Fullført',
        'Avbrutt': 'Avbrutt',
        'Overdue': 'Forfalt',
        'reported': 'Rapportert',
        'investigating': 'Undersøkes',
        'in_progress': 'Pågår',
        'resolved': 'Løst',
        'closed': 'Lukket',
        'draft': 'Utkast',
        'pending_approval': 'Venter godkjenning',
        'approved': 'Godkjent',
        'rejected': 'Avvist',
        'not_started': 'Ikke startet',
        'completed': 'Fullført',
        'overdue': 'Forfalt',
        'pending': 'Venter',
        'failed': 'Feilet'
      };

      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #2563eb;">Statusoppdatering - ${caseType}</h2>
          <p>Hei ${creator.displayName},</p>
          <p>Statusen på din sak har blitt oppdatert:</p>
          <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 5px 0;"><strong>Sak:</strong> ${caseTitle}</p>
            <p style="margin: 5px 0;"><strong>Type:</strong> ${caseType}</p>
            <p style="margin: 5px 0;"><strong>Gammel status:</strong> ${statusLabels[oldStatus] || oldStatus}</p>
            <p style="margin: 5px 0;"><strong>Ny status:</strong> ${statusLabels[newStatus] || newStatus}</p>
          </div>
          <p>Du kan logge inn på DriftPro-systemet for å se mer informasjon.</p>
          <br>
          <p>Med vennlig hilsen,<br>DriftPro-systemet</p>
        </div>
      `;

      await globalEmailService.sendEmail({
        to: creator.email,
        subject: `Statusoppdatering: ${caseTitle} - ${statusLabels[newStatus] || newStatus}`,
        html
      });
    } catch (error) {
      console.error('Error sending status update email:', error);
      // Don't throw - email failure shouldn't block status update
    }
  };

  const handleUpdateAudit = async () => {
    if (!selectedAudit || !newAudit.title || !newAudit.plannedDate || !newAudit.responsiblePersonIds || newAudit.responsiblePersonIds.length === 0) {
      alert('Vennligst velg minst én ansvarlig ansatt');
      return;
    }
    
    try {
      const oldStatus = selectedAudit.status;
      const newStatus = newAudit.status || selectedAudit.status;
      const selectedEmployees = employees.filter(e => newAudit.responsiblePersonIds.includes(e.id));
      const responsiblePersonNames = selectedEmployees.map(e => e.displayName).join(', ');
      
      await firebaseService.updateInternalAudit(selectedAudit.id, {
        ...newAudit,
        responsiblePerson: responsiblePersonNames,
        responsiblePersonId: newAudit.responsiblePersonIds[0], // Keep for backward compatibility
        responsiblePersonIds: newAudit.responsiblePersonIds,
        status: newStatus,
        findings: selectedAudit.findings,
        recommendations: selectedAudit.recommendations
      });
      
      // Send email if status changed
      if (oldStatus !== newStatus && selectedAudit.createdBy) {
        await sendStatusUpdateEmail('Internrevisjon', newAudit.title, oldStatus, newStatus, selectedAudit.createdBy, userProfile?.companyId || '');
      }
      
      await loadAudits();
      setShowEditModal(false);
      setSelectedAudit(null);
    } catch (error) {
      console.error('Error updating audit:', error);
      alert('Feil ved oppdatering av revisjon');
    }
  };

  const handleDeleteAudit = async (auditId: string) => {
    if (!confirm('Er du sikker på at du vil slette denne revisjonen?')) return;
    
    try {
      await firebaseService.deleteInternalAudit(auditId);
      await loadAudits();
    } catch (error) {
      console.error('Error deleting audit:', error);
      alert('Feil ved sletting av revisjon');
    }
  };

  const handleEditAudit = (audit: InternalAudit) => {
    setSelectedAudit(audit);
    setNewAudit({
      title: audit.title,
      type: audit.type,
      scope: audit.scope,
      plannedDate: audit.plannedDate,
      responsiblePerson: audit.responsiblePerson,
      responsiblePersonId: audit.responsiblePersonId || '',
      responsiblePersonIds: audit.responsiblePersonIds || (audit.responsiblePersonId ? [audit.responsiblePersonId] : []),
      department: audit.department,
      departmentId: audit.departmentId || '',
      priority: audit.priority,
      nextReview: audit.nextReview,
      description: audit.description || '',
      objectives: audit.objectives || [],
      standards: audit.standards || [],
      estimatedHours: audit.estimatedHours || 0,
      assignedAuditors: audit.assignedAuditors || [],
      status: audit.status
    });
    setShowEditModal(true);
  };

  const handleViewAudit = (audit: InternalAudit) => {
    setSelectedAudit(audit);
    setShowDetailModal(true);
  };

  const handleUploadAuditDocument = async (file: File, auditId: string, description?: string, category?: string) => {
    if (!userProfile?.companyId || !userProfile?.id) return;
    
    setUploadingDocument(true);
    setUploadProgress(0);
    
    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 200);
      
      await firebaseService.uploadAuditDocument(file, auditId, userProfile.companyId, userProfile.id, description, category);
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      setTimeout(async () => {
        setUploadingDocument(false);
        setUploadProgress(0);
        if (selectedAudit) {
          const updated = await firebaseService.getInternalAudit(auditId);
          if (updated) setSelectedAudit(updated);
        }
      }, 500);
    } catch (error) {
      console.error('Error uploading document:', error);
      alert('Feil ved opplasting av dokument');
      setUploadingDocument(false);
      setUploadProgress(0);
    }
  };

  // Handler functions for Deviations
  const handleAddDeviation = async () => {
    if (!newDeviation.title || !newDeviation.description || !userProfile?.companyId) {
      alert('Vennligst fyll ut alle påkrevde felt');
      return;
    }

    try {
      setUploadingFiles(prev => ({ ...prev, 'deviation-add': true }));
      let assignedTo: string | undefined;
      let assignedToIds: string[] = [];
      
      // If employee, send to nearest leader
      if (userProfile?.role === 'employee' && userProfile?.id) {
        const leader = await firebaseService.getNearestLeader(userProfile.id, userProfile.companyId);
        if (leader) {
          assignedTo = leader.id;
          assignedToIds = [leader.id];
        }
      } else if (newDeviation.assignedToIds && newDeviation.assignedToIds.length > 0) {
        // Admin/leader can assign to multiple people
        assignedToIds = newDeviation.assignedToIds;
        assignedTo = assignedToIds[0]; // Keep for backward compatibility
      }

      const deviationId = await firebaseService.createDeviation({
        ...newDeviation,
        companyId: userProfile.companyId,
        reportedBy: userProfile.id,
        status: 'reported',
        assignedTo,
        assignedToIds: assignedToIds.length > 0 ? assignedToIds : undefined
      });
      
      // Upload files if any
      const filesToUpload = selectedFiles['deviation-add'] || [];
      if (filesToUpload.length > 0 && userProfile.id) {
        for (let i = 0; i < filesToUpload.length; i++) {
          const file = filesToUpload[i];
          setUploadProgressFiles(prev => ({ ...prev, 'deviation-add': ((i + 1) / filesToUpload.length) * 100 }));
          try {
            await firebaseService.uploadDeviationFile(file, deviationId, userProfile.companyId, userProfile.id, `Vedlegg: ${file.name}`);
          } catch (fileError) {
            console.error(`Error uploading file ${file.name}:`, fileError);
          }
        }
      }
      
      await loadDeviations();
      setNewDeviation({
        title: '',
        description: '',
        type: 'safety',
        severity: 'medium',
        status: 'reported',
        departmentId: '',
        location: '',
        equipment: '',
        cost: 0,
        riskAssessment: '',
        immediateActions: '',
        rootCause: '',
        correctiveActions: '',
        preventiveActions: '',
        attachments: [],
        witnesses: [],
        investigationRequired: false,
        regulatoryReport: false,
        assignedToIds: []
      });
      setSelectedFiles(prev => ({ ...prev, 'deviation-add': [] }));
      setUploadProgressFiles(prev => ({ ...prev, 'deviation-add': 0 }));
      setShowAddDeviationModal(false);
      if (assignedTo) {
        alert('Avvik rapportert og sendt til din nærmeste leder');
      }
    } catch (error) {
      console.error('Error creating deviation:', error);
      alert('Feil ved opprettelse av avvik');
    } finally {
      setUploadingFiles(prev => ({ ...prev, 'deviation-add': false }));
    }
  };

  const handleUpdateDeviation = async () => {
    if (!selectedDeviation) return;
    
    try {
      const oldStatus = selectedDeviation.status;
      const assignedToIds = newDeviation.assignedToIds && newDeviation.assignedToIds.length > 0 
        ? newDeviation.assignedToIds 
        : (selectedDeviation.assignedTo ? [selectedDeviation.assignedTo] : []);
      
      await firebaseService.updateDeviation(selectedDeviation.id, {
        ...newDeviation,
        assignedTo: assignedToIds[0] || userProfile?.id || selectedDeviation.assignedTo,
        assignedToIds: assignedToIds.length > 0 ? assignedToIds : undefined,
        updatedAt: new Date().toISOString()
      });
      
      // Send email if status changed
      if (oldStatus !== newDeviation.status && selectedDeviation.reportedBy) {
        await sendStatusUpdateEmail('Avvik', newDeviation.title || 'Avvik', oldStatus, newDeviation.status, selectedDeviation.reportedBy, userProfile?.companyId || '');
      }
      
      await loadDeviations();
      setShowEditDeviationModal(false);
      setSelectedDeviation(null);
    } catch (error) {
      console.error('Error updating deviation:', error);
      alert('Feil ved oppdatering av avvik');
    }
  };

  const handleEditDeviation = (deviation: FirestoreDeviation) => {
    setSelectedDeviation(deviation);
      setNewDeviation({
        title: deviation.title || '',
        description: deviation.description || '',
        type: deviation.type || 'safety',
        severity: deviation.severity || 'medium',
        status: deviation.status || 'reported',
        departmentId: deviation.departmentId || '',
        location: deviation.location || '',
        equipment: deviation.equipment || '',
        cost: deviation.cost || 0,
        riskAssessment: deviation.riskAssessment || '',
        immediateActions: deviation.immediateActions || '',
        rootCause: deviation.rootCause || '',
        correctiveActions: deviation.correctiveActions || '',
        preventiveActions: deviation.preventiveActions || '',
        attachments: deviation.attachments || [],
        witnesses: deviation.witnesses || [],
        investigationRequired: deviation.investigationRequired || false,
      regulatoryReport: deviation.regulatoryReport || false,
      assignedToIds: (deviation as any).assignedToIds || (deviation.assignedTo ? [deviation.assignedTo] : [])
      });
    setShowEditDeviationModal(true);
  };

  const handleViewDeviation = (deviation: FirestoreDeviation) => {
    setSelectedDeviation(deviation);
    setShowDeviationDetailModal(true);
  };

  // Handler functions for Risk Assessments
  const handleAddRiskAssessment = async () => {
    // Use "Hva kan skje?" as title if title is not set
    const finalTitle = newRiskAssessment.title || newRiskAssessment.whatCanHappen || 'Ny risikovurdering';
    
    if (!finalTitle || !userProfile?.companyId || !newRiskAssessment.responsiblePersonIds || newRiskAssessment.responsiblePersonIds.length === 0) {
      alert('Vennligst fyll ut alle påkrevde felt, inkludert minst én ansvarlig ansatt');
      return;
    }

    try {
      setUploadingFiles(prev => ({ ...prev, 'risk-add': true }));
      const dept = departments.find(d => d.id === newRiskAssessment.departmentId);
      const selectedEmployees = employees.filter(e => newRiskAssessment.responsiblePersonIds.includes(e.id));
      const responsiblePersonNames = selectedEmployees.map(e => e.displayName).join(', ');
      
      let leaderId: string | undefined;
      let sentToLeader = false;
      
      // If employee, send to nearest leader
      if (userProfile?.role === 'employee' && userProfile?.id) {
        const leader = await firebaseService.getNearestLeader(userProfile.id, userProfile.companyId);
        if (leader) {
          leaderId = leader.id;
          sentToLeader = true;
        }
      }

      // Build risk data object, only including defined values
      const riskData: any = {
        title: finalTitle,
        description: newRiskAssessment.description || newRiskAssessment.eventDescriptionAndConsequence || '',
        departmentId: newRiskAssessment.departmentId || '',
        location: newRiskAssessment.location || '',
        activity: newRiskAssessment.activity || '',
        hazard: newRiskAssessment.hazard || '',
        riskLevel: newRiskAssessment.riskLevel,
        probability: newRiskAssessment.probability,
        probabilityValue: newRiskAssessment.probabilityValue,
        probabilityLabel: newRiskAssessment.probabilityLabel,
        consequence: newRiskAssessment.consequence,
        existingControls: newRiskAssessment.existingControls || '',
        existingControlsProbability: newRiskAssessment.existingControlsProbability || '',
        existingControlsConsequence: newRiskAssessment.existingControlsConsequence || '',
        additionalControls: newRiskAssessment.additionalControls || '',
        whatCanHappen: newRiskAssessment.whatCanHappen || '',
        eventDescriptionAndConsequence: newRiskAssessment.eventDescriptionAndConsequence || '',
        eventCauseDescription: newRiskAssessment.eventCauseDescription || '',
        mappedDate: newRiskAssessment.mappedDate || new Date().toISOString().split('T')[0],
        responsiblePerson: responsiblePersonNames,
        responsiblePersonId: newRiskAssessment.responsiblePersonIds[0],
        responsiblePersonIds: newRiskAssessment.responsiblePersonIds,
        reviewDate: newRiskAssessment.reviewDate || '',
        companyId: userProfile.companyId,
        createdBy: userProfile.id,
        status: sentToLeader ? 'pending_approval' : 'draft',
        sentToLeader,
        area: newRiskAssessment.area || '',
        cause: newRiskAssessment.cause || '',
        processes: newRiskAssessment.processes || '',
        reference2: newRiskAssessment.reference2 || '',
        reference3: newRiskAssessment.reference3 || '',
        reference4: newRiskAssessment.reference4 || '',
        notes: newRiskAssessment.notes || '',
        timestampSignature: newRiskAssessment.timestampSignature || '',
        riskPerson: newRiskAssessment.riskPerson,
        riskEconomy: newRiskAssessment.riskEconomy,
        riskEnvironment: newRiskAssessment.riskEnvironment,
        riskReputation: newRiskAssessment.riskReputation,
        riskDelivery: newRiskAssessment.riskDelivery,
        riskSecurity: newRiskAssessment.riskSecurity
      };
      
      // Only include leaderId if it's defined
      if (leaderId) {
        riskData.leaderId = leaderId;
      }
      
      const riskId = await firebaseService.createRiskAssessment(riskData);
      
      // Upload files if any
      const filesToUpload = selectedFiles['risk-add'] || [];
      if (filesToUpload.length > 0 && userProfile.id) {
        for (let i = 0; i < filesToUpload.length; i++) {
          const file = filesToUpload[i];
          setUploadProgressFiles(prev => ({ ...prev, 'risk-add': ((i + 1) / filesToUpload.length) * 100 }));
          try {
            await firebaseService.uploadRiskAssessmentFile(file, riskId, userProfile.companyId, userProfile.id, `Vedlegg: ${file.name}`);
          } catch (fileError) {
            console.error(`Error uploading file ${file.name}:`, fileError);
          }
        }
      }
      
      await loadRiskAssessments();
      // Reset form with all new fields
      setNewRiskAssessment({
        title: '',
        description: '',
        departmentId: '',
        location: '',
        activity: '',
        hazard: '',
        riskLevel: 'medium',
        probability: '0',
        probabilityValue: 0,
        probabilityLabel: 'Skjer aldri',
        consequence: 'medium',
        existingControls: '',
        existingControlsProbability: '',
        existingControlsConsequence: '',
        additionalControls: '',
        whatCanHappen: '',
        eventDescriptionAndConsequence: '',
        eventCauseDescription: '',
        mappedDate: new Date().toISOString().split('T')[0],
        responsiblePerson: '',
        responsiblePersonIds: [],
        reviewDate: '',
        attachments: [],
        status: 'draft',
        area: '',
        cause: '',
        processes: '',
        reference2: '',
        reference3: '',
        reference4: '',
        notes: '',
        timestampSignature: '',
        riskPerson: { enabled: false, value: '0', level: 0 },
        riskEconomy: { enabled: false, value: '0', level: 0 },
        riskEnvironment: { enabled: false, value: '0', level: 0 },
        riskReputation: { enabled: false, value: '0', level: 0 },
        riskDelivery: { enabled: false, value: '0', level: 0 },
        riskSecurity: { enabled: false, value: '0', level: 0 }
      });
      setSelectedFiles(prev => ({ ...prev, 'risk-add': [] }));
      setUploadProgressFiles(prev => ({ ...prev, 'risk-add': 0 }));
      setShowAddRiskModal(false);
      if (sentToLeader) {
        alert('Risikovurdering opprettet og sendt til din nærmeste leder for godkjenning');
      } else {
        alert('Risikovurdering opprettet med unik ID');
      }
    } catch (error) {
      console.error('Error creating risk assessment:', error);
      alert('Feil ved opprettelse av risikovurdering');
    } finally {
      setUploadingFiles(prev => ({ ...prev, 'risk-add': false }));
    }
  };

  const handleUpdateRiskAssessment = async () => {
    if (!selectedRisk || !newRiskAssessment.responsiblePersonIds || newRiskAssessment.responsiblePersonIds.length === 0) {
      alert('Vennligst velg minst én ansvarlig ansatt');
      return;
    }
    
    try {
      const oldStatus = selectedRisk.status;
      const selectedEmployees = employees.filter(e => newRiskAssessment.responsiblePersonIds.includes(e.id));
      const responsiblePersonNames = selectedEmployees.map(e => e.displayName).join(', ');
      
      await firebaseService.updateRiskAssessment(selectedRisk.id, {
        ...newRiskAssessment,
        responsiblePerson: responsiblePersonNames,
        responsiblePersonId: newRiskAssessment.responsiblePersonIds[0], // Keep for backward compatibility
        responsiblePersonIds: newRiskAssessment.responsiblePersonIds,
        status: newRiskAssessment.status || selectedRisk.status
      });
      
      // Send email if status changed
      if (oldStatus !== (newRiskAssessment.status || selectedRisk.status) && selectedRisk.createdBy) {
        await sendStatusUpdateEmail('Risikovurdering', newRiskAssessment.title, oldStatus, newRiskAssessment.status || selectedRisk.status, selectedRisk.createdBy, userProfile?.companyId || '');
      }
      
      await loadRiskAssessments();
      setShowEditRiskModal(false);
      setSelectedRisk(null);
    } catch (error) {
      console.error('Error updating risk assessment:', error);
      alert('Feil ved oppdatering av risikovurdering');
    }
  };

  const handleEditRiskAssessment = (risk: RiskAssessment) => {
    setSelectedRisk(risk);
    setNewRiskAssessment({
      title: risk.title,
      description: risk.description,
      departmentId: risk.departmentId,
      location: risk.location || '',
      activity: risk.activity,
      hazard: risk.hazard,
      riskLevel: risk.riskLevel,
      probability: typeof risk.probability === 'string' ? risk.probability : '0',
      probabilityValue: risk.probabilityValue || 0,
      probabilityLabel: risk.probabilityLabel || 'Skjer aldri',
      consequence: risk.consequence,
      existingControls: risk.existingControls,
      existingControlsProbability: risk.existingControlsProbability || '',
      existingControlsConsequence: risk.existingControlsConsequence || '',
      additionalControls: risk.additionalControls || '',
      whatCanHappen: risk.whatCanHappen || '',
      eventDescriptionAndConsequence: risk.eventDescriptionAndConsequence || '',
      eventCauseDescription: risk.eventCauseDescription || '',
      mappedDate: risk.mappedDate || new Date().toISOString().split('T')[0],
      responsiblePerson: risk.responsiblePersonId || '',
      responsiblePersonIds: risk.responsiblePersonIds || (risk.responsiblePersonId ? [risk.responsiblePersonId] : []),
      reviewDate: risk.reviewDate,
      attachments: risk.attachments || [],
      status: risk.status,
      area: risk.area || '',
      cause: risk.cause || '',
      processes: risk.processes || '',
      reference2: risk.reference2 || '',
      reference3: risk.reference3 || '',
      reference4: risk.reference4 || '',
      notes: risk.notes || '',
      timestampSignature: risk.timestampSignature || '',
      riskPerson: risk.riskPerson || { enabled: false, value: '0', level: 0 },
      riskEconomy: risk.riskEconomy || { enabled: false, value: '0', level: 0 },
      riskEnvironment: risk.riskEnvironment || { enabled: false, value: '0', level: 0 },
      riskReputation: risk.riskReputation || { enabled: false, value: '0', level: 0 },
      riskDelivery: risk.riskDelivery || { enabled: false, value: '0', level: 0 },
      riskSecurity: risk.riskSecurity || { enabled: false, value: '0', level: 0 }
    });
    setShowEditRiskModal(true);
  };

  // Handler functions for Follow-up Actions
  const handleAddFollowUpAction = async () => {
    if (!newFollowUpAction.title || !newFollowUpAction.description || !userProfile?.companyId || !newFollowUpAction.responsiblePersonIds || newFollowUpAction.responsiblePersonIds.length === 0) {
      alert('Vennligst fyll ut alle påkrevde felt, inkludert minst én ansvarlig ansatt');
      return;
    }

    try {
      setUploadingFiles(prev => ({ ...prev, 'followup-add': true }));
      const dept = departments.find(d => d.id === newFollowUpAction.departmentId);
      const selectedEmployees = employees.filter(e => newFollowUpAction.responsiblePersonIds.includes(e.id));
      const responsiblePersonNames = selectedEmployees.map(e => e.displayName).join(', ');
      
      let leaderId: string | undefined;
      let sentToLeader = false;
      
      // If employee, send to nearest leader
      if (userProfile?.role === 'employee' && userProfile?.id) {
        const leader = await firebaseService.getNearestLeader(userProfile.id, userProfile.companyId);
        if (leader) {
          leaderId = leader.id;
          sentToLeader = true;
        }
      }

      const actionId = await firebaseService.createFollowUpAction({
        ...newFollowUpAction,
        responsiblePerson: responsiblePersonNames,
        responsiblePersonId: newFollowUpAction.responsiblePersonIds[0], // Keep for backward compatibility
        responsiblePersonIds: newFollowUpAction.responsiblePersonIds,
        companyId: userProfile.companyId,
        createdBy: userProfile.id,
        sentToLeader,
        leaderId
      });
      
      // Upload files if any
      const filesToUpload = selectedFiles['followup-add'] || [];
      if (filesToUpload.length > 0 && userProfile.id) {
        for (let i = 0; i < filesToUpload.length; i++) {
          const file = filesToUpload[i];
          setUploadProgressFiles(prev => ({ ...prev, 'followup-add': ((i + 1) / filesToUpload.length) * 100 }));
          try {
            await firebaseService.uploadFollowUpActionFile(file, actionId, userProfile.companyId, userProfile.id, `Vedlegg: ${file.name}`);
          } catch (fileError) {
            console.error(`Error uploading file ${file.name}:`, fileError);
          }
        }
      }
      
      await loadFollowUpActions();
      setNewFollowUpAction({
        title: '',
        description: '',
        relatedAuditId: '',
        relatedDeviationId: '',
        responsiblePerson: '',
        responsiblePersonId: '',
        responsiblePersonIds: [],
        departmentId: '',
        dueDate: '',
        status: 'not_started',
        priority: 'Middels',
        completedDate: '',
        completedBy: '',
        verificationRequired: false
      });
      setSelectedFiles(prev => ({ ...prev, 'followup-add': [] }));
      setUploadProgressFiles(prev => ({ ...prev, 'followup-add': 0 }));
      setShowAddFollowUpModal(false);
      if (sentToLeader) {
        alert('Oppfølgingstiltak opprettet og sendt til din nærmeste leder');
      }
    } catch (error) {
      console.error('Error creating follow-up action:', error);
      alert('Feil ved opprettelse av oppfølgingstiltak');
    } finally {
      setUploadingFiles(prev => ({ ...prev, 'followup-add': false }));
    }
  };

  const handleUpdateFollowUpAction = async () => {
    if (!selectedFollowUp || !newFollowUpAction.responsiblePersonIds || newFollowUpAction.responsiblePersonIds.length === 0) {
      alert('Vennligst velg minst én ansvarlig ansatt');
      return;
    }
    
    try {
      const oldStatus = selectedFollowUp.status;
      const selectedEmployees = employees.filter(e => newFollowUpAction.responsiblePersonIds.includes(e.id));
      const responsiblePersonNames = selectedEmployees.map(e => e.displayName).join(', ');
      
      await firebaseService.updateFollowUpAction(selectedFollowUp.id, {
        ...newFollowUpAction,
        responsiblePerson: responsiblePersonNames,
        responsiblePersonId: newFollowUpAction.responsiblePersonIds[0], // Keep for backward compatibility
        responsiblePersonIds: newFollowUpAction.responsiblePersonIds
      });
      
      // Send email if status changed
      if (oldStatus !== newFollowUpAction.status && selectedFollowUp.createdBy) {
        await sendStatusUpdateEmail('Oppfølgingstiltak', newFollowUpAction.title, oldStatus, newFollowUpAction.status, selectedFollowUp.createdBy, userProfile?.companyId || '');
      }
      
      await loadFollowUpActions();
      setShowEditFollowUpModal(false);
      setSelectedFollowUp(null);
    } catch (error) {
      console.error('Error updating follow-up action:', error);
      alert('Feil ved oppdatering av oppfølgingstiltak');
    }
  };

  const handleEditFollowUpAction = (action: FollowUpAction) => {
    setSelectedFollowUp(action);
    setNewFollowUpAction({
      title: action.title,
      description: action.description,
      relatedAuditId: action.relatedAuditId || '',
      relatedDeviationId: action.relatedDeviationId || '',
      responsiblePerson: action.responsiblePerson,
      responsiblePersonId: action.responsiblePersonId || '',
      responsiblePersonIds: action.responsiblePersonIds || (action.responsiblePersonId ? [action.responsiblePersonId] : []),
      departmentId: action.departmentId,
      dueDate: action.dueDate,
      status: action.status,
      priority: action.priority,
      completedDate: action.completedDate || '',
      completedBy: action.completedBy || '',
      verificationRequired: action.verificationRequired
    });
    setShowEditFollowUpModal(true);
  };

  // Handler functions for Checkpoints
  const handleAddCheckpoint = async () => {
    if (!newCheckpoint.title || !newCheckpoint.description || !userProfile?.companyId || !newCheckpoint.responsiblePersonIds || newCheckpoint.responsiblePersonIds.length === 0) {
      alert('Vennligst fyll ut alle påkrevde felt, inkludert minst én ansvarlig ansatt');
      return;
    }

    try {
      setUploadingFiles(prev => ({ ...prev, 'checkpoint-add': true }));
      const dept = departments.find(d => d.id === newCheckpoint.departmentId);
      const selectedEmployees = employees.filter(e => newCheckpoint.responsiblePersonIds.includes(e.id));
      const responsiblePersonNames = selectedEmployees.map(e => e.displayName).join(', ');
      
      let leaderId: string | undefined;
      let sentToLeader = false;
      
      // If employee, send to nearest leader
      if (userProfile?.role === 'employee' && userProfile?.id) {
        const leader = await firebaseService.getNearestLeader(userProfile.id, userProfile.companyId);
        if (leader) {
          leaderId = leader.id;
          sentToLeader = true;
        }
      }

      const checkpointId = await firebaseService.createCheckpoint({
        ...newCheckpoint,
        responsiblePerson: responsiblePersonNames,
        responsiblePersonId: newCheckpoint.responsiblePersonIds[0], // Keep for backward compatibility
        responsiblePersonIds: newCheckpoint.responsiblePersonIds,
        companyId: userProfile.companyId,
        createdBy: userProfile.id,
        sentToLeader,
        leaderId
      });
      
      // Upload files if any
      const filesToUpload = selectedFiles['checkpoint-add'] || [];
      if (filesToUpload.length > 0 && userProfile.id) {
        for (let i = 0; i < filesToUpload.length; i++) {
          const file = filesToUpload[i];
          setUploadProgressFiles(prev => ({ ...prev, 'checkpoint-add': ((i + 1) / filesToUpload.length) * 100 }));
          try {
            await firebaseService.uploadCheckpointFile(file, checkpointId, userProfile.companyId, userProfile.id, `Vedlegg: ${file.name}`);
          } catch (fileError) {
            console.error(`Error uploading file ${file.name}:`, fileError);
          }
        }
      }
      
      await loadCheckpoints();
      setNewCheckpoint({
        title: '',
        description: '',
        departmentId: '',
        category: 'safety',
        frequency: 'monthly',
        responsiblePerson: '',
        responsiblePersonId: '',
        responsiblePersonIds: [],
        lastChecked: '',
        nextCheck: '',
        status: 'pending',
        checklist: []
      });
      setSelectedFiles(prev => ({ ...prev, 'checkpoint-add': [] }));
      setUploadProgressFiles(prev => ({ ...prev, 'checkpoint-add': 0 }));
      setShowAddCheckpointModal(false);
      if (sentToLeader) {
        alert('Kontrollpunkt opprettet og sendt til din nærmeste leder');
      }
    } catch (error) {
      console.error('Error creating checkpoint:', error);
      alert('Feil ved opprettelse av kontrollpunkt');
    } finally {
      setUploadingFiles(prev => ({ ...prev, 'checkpoint-add': false }));
    }
  };

  const handleUpdateCheckpoint = async () => {
    if (!selectedCheckpoint || !newCheckpoint.responsiblePersonIds || newCheckpoint.responsiblePersonIds.length === 0) {
      alert('Vennligst velg minst én ansvarlig ansatt');
      return;
    }
    
    try {
      const oldStatus = selectedCheckpoint.status;
      const selectedEmployees = employees.filter(e => newCheckpoint.responsiblePersonIds.includes(e.id));
      const responsiblePersonNames = selectedEmployees.map(e => e.displayName).join(', ');
      
      await firebaseService.updateCheckpoint(selectedCheckpoint.id, {
        ...newCheckpoint,
        responsiblePerson: responsiblePersonNames,
        responsiblePersonId: newCheckpoint.responsiblePersonIds[0], // Keep for backward compatibility
        responsiblePersonIds: newCheckpoint.responsiblePersonIds
      });
      
      // Send email if status changed
      if (oldStatus !== newCheckpoint.status && selectedCheckpoint.createdBy) {
        await sendStatusUpdateEmail('Kontrollpunkt', newCheckpoint.title, oldStatus, newCheckpoint.status, selectedCheckpoint.createdBy, userProfile?.companyId || '');
      }
      
      await loadCheckpoints();
      setShowEditCheckpointModal(false);
      setSelectedCheckpoint(null);
    } catch (error) {
      console.error('Error updating checkpoint:', error);
      alert('Feil ved oppdatering av kontrollpunkt');
    }
  };

  const handleEditCheckpoint = (checkpoint: Checkpoint) => {
    setSelectedCheckpoint(checkpoint);
    setNewCheckpoint({
      title: checkpoint.title,
      description: checkpoint.description,
      departmentId: checkpoint.departmentId,
      category: checkpoint.category,
      frequency: checkpoint.frequency,
      responsiblePerson: checkpoint.responsiblePerson,
      responsiblePersonId: checkpoint.responsiblePersonId || '',
      responsiblePersonIds: checkpoint.responsiblePersonIds || (checkpoint.responsiblePersonId ? [checkpoint.responsiblePersonId] : []),
      lastChecked: checkpoint.lastChecked || '',
      nextCheck: checkpoint.nextCheck,
      status: checkpoint.status,
      checklist: checkpoint.checklist || []
    });
    setShowEditCheckpointModal(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Fullført': return '#dcfce7';
      case 'Pågående': return '#fef3c7';
      case 'Planlagt': return '#dbeafe';
      case 'Avbrutt': return '#fee2e2';
      case 'Overdue': return '#fee2e2';
      // Deviation statuses
      case 'reported': return '#fef3c7';
      case 'investigating': return '#dbeafe';
      case 'in_progress': return '#dbeafe';
      case 'resolved': return '#dcfce7';
      case 'closed': return '#f3f4f6';
      default: return '#f3f4f6';
    }
  };

  const getStatusTextColor = (status: string) => {
    switch (status) {
      case 'Fullført': return '#166534';
      case 'Pågående': return '#d97706';
      case 'Planlagt': return '#1d4ed8';
      case 'Avbrutt': return '#dc2626';
      case 'Overdue': return '#dc2626';
      // Deviation statuses
      case 'reported': return '#d97706';
      case 'investigating': return '#1d4ed8';
      case 'in_progress': return '#1d4ed8';
      case 'resolved': return '#166534';
      case 'closed': return '#6b7280';
      default: return '#6b7280';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Høy': return '#fecaca';
      case 'Middels': return '#fef3c7';
      case 'Lav': return '#d1fae5';
      default: return '#f3f4f6';
    }
  };

  const getPriorityTextColor = (priority: string) => {
    switch (priority) {
      case 'Høy': return '#dc2626';
      case 'Middels': return '#d97706';
      case 'Lav': return '#059669';
      default: return '#6b7280';
    }
  };

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '50vh' 
      }}>
        <div style={{ fontSize: '1.125rem', color: 'var(--gray-500)' }}>Laster...</div>
      </div>
    );
  }

  return (
    <div style={{ 
      maxWidth: isMobile ? '100%' : '1200px', 
      margin: '0 auto',
      width: '100%',
      overflowX: 'hidden',
      padding: isMobile ? '0' : undefined
    }}>
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
            Internkontroll og Samsvar
          </h1>
        </div>
      )}

      {/* Desktop Header */}
      {!isMobile && (
      <div style={{ 
        marginBottom: '2rem',
        display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
        justifyContent: 'space-between',
        gap: '1rem'
      }}>
        <div>
          <h1 style={{ 
            fontSize: '2rem', 
            fontWeight: '700', 
              color: 'var(--text-color)',
            margin: 0,
            marginBottom: '0.5rem'
          }}>
            Internkontroll og Samsvar
          </h1>
          <p style={{ 
            color: 'var(--gray-500)', 
            fontSize: '1rem',
            margin: 0
          }}>
            Administrer internkontroll, avvik, risikovurderinger og oppfølgingstiltak
          </p>
        </div>
        
        {activeTab === 'audits' && (userProfile?.permissions?.internrevisjon || userProfile?.permissions?.internkontrollOgSamsvar || userProfile?.role === 'admin' || userProfile?.role === 'super_admin') && (
          <button
            onClick={() => setShowAddModal(true)}
            style={{
              background: 'var(--primary)',
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
              transition: 'all 0.2s',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
            }}
          >
            <Plus size={20} />
            Ny revisjon
          </button>
        )}
        {activeTab === 'deviations' && (userProfile?.permissions?.avvik || userProfile?.permissions?.internkontrollOgSamsvar || userProfile?.role === 'admin' || userProfile?.role === 'super_admin') && (
          <button
            onClick={() => setShowAddDeviationModal(true)}
            style={{
              background: 'var(--primary)',
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
              transition: 'all 0.2s',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
            }}
          >
            <Plus size={20} />
            Rapporter avvik
          </button>
        )}
        {activeTab === 'risk-assessment' && (userProfile?.permissions?.risikovurdering || userProfile?.permissions?.internkontrollOgSamsvar || userProfile?.role === 'admin' || userProfile?.role === 'super_admin') && (
          <button
            onClick={() => setShowAddRiskModal(true)}
            style={{
              background: 'var(--primary)',
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
              transition: 'all 0.2s',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
            }}
          >
            <Plus size={20} />
            Ny risikovurdering
          </button>
        )}
        {activeTab === 'follow-up' && (userProfile?.permissions?.oppfølgingstiltak || userProfile?.permissions?.internkontrollOgSamsvar || userProfile?.role === 'admin' || userProfile?.role === 'super_admin') && (
          <button
            onClick={() => setShowAddFollowUpModal(true)}
            style={{
              background: 'var(--primary)',
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
              transition: 'all 0.2s',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
            }}
          >
            <Plus size={20} />
            Nytt oppfølgingstiltak
          </button>
        )}
        {activeTab === 'checkpoints' && (userProfile?.permissions?.kontrollpunkter || userProfile?.permissions?.internkontrollOgSamsvar || userProfile?.role === 'admin' || userProfile?.role === 'super_admin') && (
          <button
            onClick={() => setShowAddCheckpointModal(true)}
            style={{
              background: 'var(--primary)',
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
              transition: 'all 0.2s',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
            }}
          >
            <Plus size={20} />
            Nytt kontrollpunkt
          </button>
        )}
      </div>
      )}

      {/* Mobile Action Button */}
      {isMobile && (
        <div style={{
          padding: '0 0.75rem 0.75rem',
          display: 'flex',
          justifyContent: 'flex-end'
        }}>
          {activeTab === 'audits' && (userProfile?.permissions?.internrevisjon || userProfile?.permissions?.internkontrollOgSamsvar || userProfile?.role === 'admin' || userProfile?.role === 'super_admin') && (
            <button
              onClick={() => setShowAddModal(true)}
              style={{
                background: 'var(--primary)',
                color: 'white',
                border: 'none',
                borderRadius: '0.625rem',
                padding: '0.75rem 1rem',
                fontSize: '0.875rem',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                minHeight: '44px',
                minWidth: '44px'
              }}
            >
              <Plus size={18} />
              Ny revisjon
            </button>
          )}
          {activeTab === 'deviations' && (userProfile?.permissions?.avvik || userProfile?.permissions?.internkontrollOgSamsvar || userProfile?.role === 'admin' || userProfile?.role === 'super_admin') && (
            <button
              onClick={() => setShowAddDeviationModal(true)}
              style={{
                background: 'var(--primary)',
                color: 'white',
                border: 'none',
                borderRadius: '0.625rem',
                padding: '0.75rem 1rem',
                fontSize: '0.875rem',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                minHeight: '44px',
                minWidth: '44px'
              }}
            >
              <Plus size={18} />
              Rapporter avvik
            </button>
          )}
          {activeTab === 'risk-assessment' && (userProfile?.permissions?.risikovurdering || userProfile?.permissions?.internkontrollOgSamsvar || userProfile?.role === 'admin' || userProfile?.role === 'super_admin') && (
            <button
              onClick={() => setShowAddRiskModal(true)}
              style={{
                background: 'var(--primary)',
                color: 'white',
                border: 'none',
                borderRadius: '0.625rem',
                padding: '0.75rem 1rem',
                fontSize: '0.875rem',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                minHeight: '44px',
                minWidth: '44px'
              }}
            >
              <Plus size={18} />
              Ny risikovurdering
            </button>
          )}
          {activeTab === 'follow-up' && (userProfile?.permissions?.oppfølgingstiltak || userProfile?.permissions?.internkontrollOgSamsvar || userProfile?.role === 'admin' || userProfile?.role === 'super_admin') && (
            <button
              onClick={() => setShowAddFollowUpModal(true)}
              style={{
                background: 'var(--primary)',
                color: 'white',
                border: 'none',
                borderRadius: '0.625rem',
                padding: '0.75rem 1rem',
                fontSize: '0.875rem',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                minHeight: '44px',
                minWidth: '44px'
              }}
            >
              <Plus size={18} />
              Nytt oppfølgingstiltak
            </button>
          )}
          {activeTab === 'checkpoints' && (userProfile?.permissions?.kontrollpunkter || userProfile?.permissions?.internkontrollOgSamsvar || userProfile?.role === 'admin' || userProfile?.role === 'super_admin') && (
            <button
              onClick={() => setShowAddCheckpointModal(true)}
              style={{
                background: 'var(--primary)',
                color: 'white',
                border: 'none',
                borderRadius: '0.625rem',
                padding: '0.75rem 1rem',
                fontSize: '0.875rem',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                minHeight: '44px',
                minWidth: '44px'
              }}
            >
              <Plus size={18} />
              Nytt kontrollpunkt
            </button>
          )}
        </div>
      )}

      {/* Tab Navigation */}
      <div style={{ 
        marginBottom: isMobile ? '0.75rem' : '2rem',
        borderBottom: isMobile ? '0.5px solid var(--border-color)' : '2px solid var(--border-color)',
        padding: isMobile ? '0 0.75rem' : undefined,
        overflowX: isMobile ? 'auto' : undefined,
        WebkitOverflowScrolling: isMobile ? 'touch' : undefined
      }}>
        <div style={{ 
          display: 'flex', 
          gap: '0', 
          flexWrap: isMobile ? 'nowrap' : 'wrap',
          overflowX: isMobile ? 'auto' : 'auto',
          WebkitOverflowScrolling: isMobile ? 'touch' : undefined
        }}>
          {/* Check permissions for each tab - only show tabs user has access to */}
          {(userProfile?.permissions?.internrevisjon || userProfile?.permissions?.internkontrollOgSamsvar || userProfile?.role === 'admin' || userProfile?.role === 'super_admin') && (
          <button
            onClick={() => setActiveTab('audits')}
            style={{
              padding: isMobile ? '0.75rem 1rem' : '1rem 1.5rem',
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              borderBottom: activeTab === 'audits' ? (isMobile ? '2px solid var(--primary)' : '2px solid var(--primary)') : '2px solid transparent',
              color: activeTab === 'audits' ? 'var(--primary)' : 'var(--gray-600)',
              fontWeight: activeTab === 'audits' ? '600' : '500',
              fontSize: isMobile ? '0.875rem' : 'var(--font-size-base)',
              whiteSpace: 'nowrap',
              display: 'flex',
              alignItems: 'center',
              gap: isMobile ? '0.375rem' : '0.5rem',
              flexShrink: 0,
              minHeight: isMobile ? '44px' : undefined
            }}
          >
            <Activity size={isMobile ? 16 : 18} />
            Internrevisjon
          </button>
          )}
          {(userProfile?.permissions?.avvik || userProfile?.permissions?.internkontrollOgSamsvar || userProfile?.role === 'admin' || userProfile?.role === 'super_admin') && (
          <button
            onClick={() => setActiveTab('deviations')}
            style={{
              padding: isMobile ? '0.75rem 1rem' : '1rem 1.5rem',
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              borderBottom: activeTab === 'deviations' ? '2px solid var(--primary)' : '2px solid transparent',
              color: activeTab === 'deviations' ? 'var(--primary)' : 'var(--gray-600)',
              fontWeight: activeTab === 'deviations' ? '600' : '500',
              fontSize: isMobile ? '0.875rem' : 'var(--font-size-base)',
              whiteSpace: 'nowrap',
              display: 'flex',
              alignItems: 'center',
              gap: isMobile ? '0.375rem' : '0.5rem',
              flexShrink: 0,
              minHeight: isMobile ? '44px' : undefined
            }}
          >
            <AlertTriangle size={isMobile ? 16 : 18} />
            Avvik
          </button>
          )}
          {(userProfile?.permissions?.risikovurdering || userProfile?.permissions?.internkontrollOgSamsvar || userProfile?.role === 'admin' || userProfile?.role === 'super_admin') && (
          <button
            onClick={() => setActiveTab('risk-assessment')}
            style={{
              padding: isMobile ? '0.75rem 1rem' : '1rem 1.5rem',
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              borderBottom: activeTab === 'risk-assessment' ? '2px solid var(--primary)' : '2px solid transparent',
              color: activeTab === 'risk-assessment' ? 'var(--primary)' : 'var(--gray-600)',
              fontWeight: activeTab === 'risk-assessment' ? '600' : '500',
              fontSize: isMobile ? '0.875rem' : 'var(--font-size-base)',
              whiteSpace: 'nowrap',
              display: 'flex',
              alignItems: 'center',
              gap: isMobile ? '0.375rem' : '0.5rem',
              flexShrink: 0,
              minHeight: isMobile ? '44px' : undefined
            }}
          >
            <Shield size={isMobile ? 16 : 18} />
            Risikovurdering
          </button>
          )}
          {(userProfile?.permissions?.oppfølgingstiltak || userProfile?.permissions?.internkontrollOgSamsvar || userProfile?.role === 'admin' || userProfile?.role === 'super_admin') && (
          <button
            onClick={() => setActiveTab('follow-up')}
            style={{
              padding: isMobile ? '0.75rem 1rem' : '1rem 1.5rem',
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              borderBottom: activeTab === 'follow-up' ? '2px solid var(--primary)' : '2px solid transparent',
              color: activeTab === 'follow-up' ? 'var(--primary)' : 'var(--gray-600)',
              fontWeight: activeTab === 'follow-up' ? '600' : '500',
              fontSize: isMobile ? '0.875rem' : 'var(--font-size-base)',
              whiteSpace: 'nowrap',
              display: 'flex',
              alignItems: 'center',
              gap: isMobile ? '0.375rem' : '0.5rem',
              flexShrink: 0,
              minHeight: isMobile ? '44px' : undefined
            }}
          >
            <CheckSquare size={isMobile ? 16 : 18} />
            Oppfølgingstiltak
          </button>
          )}
          {(userProfile?.permissions?.kontrollpunkter || userProfile?.permissions?.internkontrollOgSamsvar || userProfile?.role === 'admin' || userProfile?.role === 'super_admin') && (
          <button
            onClick={() => setActiveTab('checkpoints')}
            style={{
              padding: isMobile ? '0.75rem 1rem' : '1rem 1.5rem',
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              borderBottom: activeTab === 'checkpoints' ? '2px solid var(--primary)' : '2px solid transparent',
              color: activeTab === 'checkpoints' ? 'var(--primary)' : 'var(--gray-600)',
              fontWeight: activeTab === 'checkpoints' ? '600' : '500',
              fontSize: isMobile ? '0.875rem' : 'var(--font-size-base)',
              whiteSpace: 'nowrap',
              display: 'flex',
              alignItems: 'center',
              gap: isMobile ? '0.375rem' : '0.5rem',
              flexShrink: 0,
              minHeight: isMobile ? '44px' : undefined
            }}
          >
            <CheckCircle size={isMobile ? 16 : 18} />
            Kontrollpunkter
          </button>
          )}
          {(userProfile?.permissions?.internkontrollRapporter || userProfile?.permissions?.internkontrollOgSamsvar || userProfile?.role === 'admin' || userProfile?.role === 'super_admin') && (
          <button
            onClick={() => setActiveTab('reports')}
            style={{
              padding: isMobile ? '0.75rem 1rem' : '1rem 1.5rem',
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              borderBottom: activeTab === 'reports' ? '2px solid var(--primary)' : '2px solid transparent',
              color: activeTab === 'reports' ? 'var(--primary)' : 'var(--gray-600)',
              fontWeight: activeTab === 'reports' ? '600' : '500',
              fontSize: isMobile ? '0.875rem' : 'var(--font-size-base)',
              whiteSpace: 'nowrap',
              display: 'flex',
              alignItems: 'center',
              gap: isMobile ? '0.375rem' : '0.5rem',
              flexShrink: 0,
              minHeight: isMobile ? '44px' : undefined
            }}
          >
            <BarChart3 size={isMobile ? 16 : 18} />
            Rapportering
          </button>
          )}
        </div>
      </div>

      {/* Stats Cards - Dynamic based on active tab */}
      {activeTab === 'audits' && (userProfile?.permissions?.internrevisjon || userProfile?.permissions?.internkontrollOgSamsvar || userProfile?.role === 'admin' || userProfile?.role === 'super_admin') && (
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: isMobile ? '1fr' : 'repeat(4, 1fr)', 
          gap: isMobile ? '0.625rem' : '1rem', 
          marginBottom: isMobile ? '0.75rem' : '2rem',
          padding: isMobile ? '0 0.75rem' : undefined
        }}>
          <div style={{
            background: 'var(--card-background)',
            padding: isMobile ? '1rem' : '1.5rem',
            borderRadius: isMobile ? '0.875rem' : '12px',
            border: '1px solid var(--border-color)',
            boxShadow: isMobile ? '0 1px 3px rgba(0, 0, 0, 0.1)' : 'var(--shadow-md)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ flex: 1 }}>
                <p style={{ 
                  color: 'var(--gray-500)', 
                  fontSize: isMobile ? '0.75rem' : '0.875rem', 
                  margin: 0,
                  marginBottom: isMobile ? '0.375rem' : '0.5rem',
                  fontWeight: 500
                }}>Totalt revisjoner</p>
                <p style={{ 
                  fontSize: isMobile ? '1.625rem' : '2rem', 
                  fontWeight: '700', 
                  color: 'var(--text-color)', 
                  margin: 0,
                  lineHeight: '1.2'
                }}>
                  {audits.length}
                </p>
              </div>
              <Shield size={isMobile ? 24 : 32} color="#3b82f6" style={{ flexShrink: 0 }} />
            </div>
          </div>

          <div style={{
            background: 'var(--card-background)',
            padding: '1.5rem',
            borderRadius: '12px',
            border: '1px solid var(--border-color)',
            boxShadow: 'var(--shadow-md)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <p style={{ color: 'var(--gray-500)', fontSize: '0.875rem', margin: 0 }}>Fullført</p>
                <p style={{ fontSize: '2rem', fontWeight: '700', color: '#059669', margin: 0 }}>
                  {audits.filter(a => a.status === 'Fullført').length}
                </p>
              </div>
              <CheckCircle size={32} color="#059669" />
            </div>
          </div>

          <div style={{
            background: 'var(--card-background)',
            padding: '1.5rem',
            borderRadius: '12px',
            border: '1px solid var(--border-color)',
            boxShadow: 'var(--shadow-md)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <p style={{ color: 'var(--gray-500)', fontSize: '0.875rem', margin: 0 }}>Pågående</p>
                <p style={{ fontSize: '2rem', fontWeight: '700', color: '#d97706', margin: 0 }}>
                  {audits.filter(a => a.status === 'Pågående').length}
                </p>
              </div>
              <Clock size={32} color="#d97706" />
            </div>
          </div>

          <div style={{
            background: 'var(--card-background)',
            padding: '1.5rem',
            borderRadius: '12px',
            border: '1px solid var(--border-color)',
            boxShadow: 'var(--shadow-md)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <p style={{ color: 'var(--gray-500)', fontSize: '0.875rem', margin: 0 }}>Planlagt</p>
                <p style={{ fontSize: '2rem', fontWeight: '700', color: '#1d4ed8', margin: 0 }}>
                  {audits.filter(a => a.status === 'Planlagt').length}
                </p>
              </div>
              <Calendar size={32} color="#1d4ed8" />
            </div>
          </div>
        </div>
      )}

      {activeTab === 'deviations' && (userProfile?.permissions?.avvik || userProfile?.permissions?.internkontrollOgSamsvar || userProfile?.role === 'admin' || userProfile?.role === 'super_admin') && (
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: isMobile ? '1fr' : 'repeat(4, 1fr)', 
          gap: '1rem', 
          marginBottom: '2rem' 
        }}>
          <div style={{
            background: 'var(--card-background)',
            padding: '1.5rem',
            borderRadius: '12px',
            border: '1px solid var(--border-color)',
            boxShadow: 'var(--shadow-md)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <p style={{ color: 'var(--gray-500)', fontSize: '0.875rem', margin: 0 }}>Totalt avvik</p>
                <p style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--text-color)', margin: 0 }}>
                  {deviations.length}
                </p>
              </div>
              <AlertTriangle size={32} color="#ef4444" />
            </div>
          </div>

          <div style={{
            background: 'var(--card-background)',
            padding: '1.5rem',
            borderRadius: '12px',
            border: '1px solid var(--border-color)',
            boxShadow: 'var(--shadow-md)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <p style={{ color: 'var(--gray-500)', fontSize: '0.875rem', margin: 0 }}>Kritiske</p>
                <p style={{ fontSize: '2rem', fontWeight: '700', color: '#dc2626', margin: 0 }}>
                  {deviations.filter(d => d.severity === 'critical').length}
                </p>
              </div>
              <AlertCircle size={32} color="#dc2626" />
            </div>
          </div>

          <div style={{
            background: 'var(--card-background)',
            padding: '1.5rem',
            borderRadius: '12px',
            border: '1px solid var(--border-color)',
            boxShadow: 'var(--shadow-md)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <p style={{ color: 'var(--gray-500)', fontSize: '0.875rem', margin: 0 }}>Åpne</p>
                <p style={{ fontSize: '2rem', fontWeight: '700', color: '#d97706', margin: 0 }}>
                  {deviations.filter(d => d.status === 'reported' || d.status === 'investigating').length}
                </p>
              </div>
              <Clock size={32} color="#d97706" />
            </div>
          </div>

          <div style={{
            background: 'var(--card-background)',
            padding: '1.5rem',
            borderRadius: '12px',
            border: '1px solid var(--border-color)',
            boxShadow: 'var(--shadow-md)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <p style={{ color: 'var(--gray-500)', fontSize: '0.875rem', margin: 0 }}>Lukket</p>
                <p style={{ fontSize: '2rem', fontWeight: '700', color: '#059669', margin: 0 }}>
                  {deviations.filter(d => d.status === 'resolved' || d.status === 'closed').length}
                </p>
              </div>
              <CheckCircle size={32} color="#059669" />
            </div>
          </div>
        </div>
      )}

      {/* Search and Filters - Dynamic based on active tab */}
      {activeTab === 'audits' && (
        <div style={{
          background: 'var(--card-background)',
          padding: '1.5rem',
          borderRadius: '12px',
          border: '1px solid var(--border-color)',
          marginBottom: '1.5rem',
          boxShadow: 'var(--shadow-md)'
        }}>
          <div style={{ 
            display: 'flex', 
            flexDirection: isMobile ? 'column' : 'row',
            gap: '1rem',
            alignItems: isMobile ? 'stretch' : 'center'
          }}>
            <div style={{ flex: 1, position: 'relative' }}>
              <Search size={20} style={{ 
                position: 'absolute', 
                left: '0.75rem', 
                top: '50%', 
                transform: 'translateY(-50%)', 
                color: 'var(--gray-500)' 
              }} />
              <input
                type="text"
                placeholder="Søk i revisjoner..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem 0.75rem 0.75rem 2.5rem',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  fontSize: '0.875rem',
                  background: 'var(--card-background)',
                  color: 'var(--text-color)'
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                style={{
                  padding: '0.75rem',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  fontSize: '0.875rem',
                  background: 'var(--card-background)',
                  color: 'var(--text-color)',
                  minWidth: '120px'
                }}
              >
                <option value="all">Alle statuser</option>
                <option value="Planlagt">Planlagt</option>
                <option value="Pågående">Pågående</option>
                <option value="Fullført">Fullført</option>
                <option value="Avbrutt">Avbrutt</option>
                <option value="Overdue">Overdue</option>
              </select>

              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                style={{
                  padding: '0.75rem',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  fontSize: '0.875rem',
                  background: 'var(--card-background)',
                  color: 'var(--text-color)',
                  minWidth: '120px'
                }}
              >
                <option value="all">Alle typer</option>
                <option value="Internrevisjon">Internrevisjon</option>
                <option value="Eksternrevisjon">Eksternrevisjon</option>
                <option value="Regulatorisk">Regulatorisk</option>
                <option value="Kvalitetsrevisjon">Kvalitetsrevisjon</option>
                <option value="Sikkerhetsrevisjon">Sikkerhetsrevisjon</option>
                <option value="Finansiell">Finansiell</option>
              </select>

              <select
                value={selectedPriority}
                onChange={(e) => setSelectedPriority(e.target.value)}
                style={{
                  padding: '0.75rem',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  fontSize: '0.875rem',
                  background: 'var(--card-background)',
                  color: 'var(--text-color)',
                  minWidth: '120px'
                }}
              >
                <option value="all">Alle prioriteter</option>
                <option value="Høy">Høy</option>
                <option value="Middels">Middels</option>
                <option value="Lav">Lav</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'deviations' && (userProfile?.permissions?.avvik || userProfile?.permissions?.internkontrollOgSamsvar || userProfile?.role === 'admin' || userProfile?.role === 'super_admin') && (
        <div style={{
          background: 'var(--card-background)',
          padding: '1.5rem',
          borderRadius: '12px',
          border: '1px solid var(--border-color)',
          marginBottom: '1.5rem',
          boxShadow: 'var(--shadow-md)'
        }}>
          <div style={{ 
            display: 'flex', 
            flexDirection: isMobile ? 'column' : 'row',
            gap: '1rem',
            alignItems: isMobile ? 'stretch' : 'center'
          }}>
            <div style={{ flex: 1, position: 'relative' }}>
              <Search size={20} style={{ 
                position: 'absolute', 
                left: '0.75rem', 
                top: '50%', 
                transform: 'translateY(-50%)', 
                color: 'var(--gray-500)' 
              }} />
              <input
                type="text"
                placeholder="Søk i avvik..."
                value={deviationSearchTerm}
                onChange={(e) => setDeviationSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem 0.75rem 0.75rem 2.5rem',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  fontSize: '0.875rem',
                  background: 'var(--card-background)',
                  color: 'var(--text-color)'
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <select
                value={deviationStatus}
                onChange={(e) => setDeviationStatus(e.target.value)}
                style={{
                  padding: '0.75rem',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  fontSize: '0.875rem',
                  background: 'var(--card-background)',
                  color: 'var(--text-color)',
                  minWidth: '120px'
                }}
              >
                <option value="all">Alle statuser</option>
                <option value="reported">Rapportert</option>
                <option value="investigating">Undersøkes</option>
                <option value="in_progress">Pågår</option>
                <option value="resolved">Løst</option>
                <option value="closed">Lukket</option>
              </select>

              <select
                value={deviationType}
                onChange={(e) => setDeviationType(e.target.value)}
                style={{
                  padding: '0.75rem',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  fontSize: '0.875rem',
                  background: 'var(--card-background)',
                  color: 'var(--text-color)',
                  minWidth: '120px'
                }}
              >
                <option value="all">Alle typer</option>
                <option value="safety">Sikkerhet</option>
                <option value="quality">Kvalitet</option>
                <option value="security">Sikkerhet (IT)</option>
                <option value="process">Prosess</option>
                <option value="environmental">Miljø</option>
                <option value="health">Helse</option>
                <option value="other">Annet</option>
              </select>

              <select
                value={deviationSeverity}
                onChange={(e) => setDeviationSeverity(e.target.value)}
                style={{
                  padding: '0.75rem',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  fontSize: '0.875rem',
                  background: 'var(--card-background)',
                  color: 'var(--text-color)',
                  minWidth: '120px'
                }}
              >
                <option value="all">Alle alvorlighetsgrader</option>
                <option value="low">Lav</option>
                <option value="medium">Middels</option>
                <option value="high">Høy</option>
                <option value="critical">Kritisk</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Tab Content */}
      {activeTab === 'audits' && (
      <div>
        {/* Audits List */}
        <div style={{
        background: 'var(--card-background)',
        borderRadius: '12px',
        border: '1px solid var(--border-color)',
        overflow: 'hidden',
        boxShadow: 'var(--shadow-md)'
      }}>
        <div style={{ 
          padding: '1.5rem', 
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: 'var(--text-color)', margin: 0 }}>
            Alle Internrevisjoner ({filteredAudits.length})
          </h3>
        </div>

        <div>
          {filteredAudits.length === 0 ? (
            <div style={{ 
              padding: '3rem', 
              textAlign: 'center', 
              color: 'var(--gray-500)' 
            }}>
              <Shield size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
              <p style={{ fontSize: '1rem', margin: 0 }}>Ingen revisjoner funnet</p>
            </div>
          ) : (
            filteredAudits.map((audit) => (
              <div key={audit.id} style={{ 
                padding: '1.5rem', 
                borderBottom: '1px solid var(--border-color)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                transition: 'background-color 0.2s'
              }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                    <h4 style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--text-color)', margin: 0 }}>
                      {audit.title}
                    </h4>
                    <span style={{ 
                      padding: '0.25rem 0.5rem', 
                      borderRadius: '4px', 
                      fontSize: '0.75rem', 
                      fontWeight: '500',
                      background: getStatusColor(audit.status),
                      color: getStatusTextColor(audit.status)
                    }}>
                      {audit.status}
                    </span>
                    <span style={{ 
                      padding: '0.25rem 0.5rem', 
                      borderRadius: '4px', 
                      fontSize: '0.75rem', 
                      fontWeight: '500',
                      background: getPriorityColor(audit.priority),
                      color: getPriorityTextColor(audit.priority)
                    }}>
                      {audit.priority}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: '1rem', fontSize: '0.875rem', color: 'var(--gray-500)', flexWrap: 'wrap' }}>
                    <span>Type: {audit.type}</span>
                    <span>Omfang: {audit.scope}</span>
                    <span>Planlagt: {audit.plannedDate}</span>
                    <span>Ansvarlig: {audit.responsiblePerson}</span>
                    <span>Avdeling: {audit.department}</span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    onClick={() => handleViewAudit(audit)}
                    style={{
                      padding: '0.5rem',
                      background: '#f3f4f6',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <Eye size={16} style={{ color: 'var(--gray-500)' }} />
                  </button>
                  <button
                    onClick={() => handleEditAudit(audit)}
                    style={{
                      padding: '0.5rem',
                      background: '#f3f4f6',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <Edit size={16} style={{ color: 'var(--gray-500)' }} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
      </div>
      )}

      {/* Deviations Tab Content */}
      {activeTab === 'deviations' && (userProfile?.permissions?.avvik || userProfile?.permissions?.internkontrollOgSamsvar || userProfile?.role === 'admin' || userProfile?.role === 'super_admin') && (
        <div>
          <div style={{
            background: 'var(--card-background)',
            borderRadius: '12px',
            border: '1px solid var(--border-color)',
            overflow: 'hidden',
            boxShadow: 'var(--shadow-md)'
          }}>
            <div style={{ 
              padding: '1.5rem', 
              borderBottom: '1px solid var(--border-color)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: 'var(--text-color)', margin: 0 }}>
                Alle Avvik ({filteredDeviations.length})
              </h3>
            </div>

            <div>
              {filteredDeviations.length === 0 ? (
                <div style={{ 
                  padding: '3rem', 
                  textAlign: 'center', 
                  color: 'var(--gray-500)' 
                }}>
                  <AlertTriangle size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
                  <p style={{ fontSize: '1rem', margin: 0 }}>Ingen avvik funnet</p>
                </div>
              ) : (
                filteredDeviations.map((deviation) => (
                  <div key={deviation.id} style={{ 
                    padding: '1.5rem', 
                    borderBottom: '1px solid var(--border-color)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    transition: 'background-color 0.2s'
                  }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                        <h4 style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--text-color)', margin: 0 }}>
                          {deviation.title}
                        </h4>
                        <span style={{ 
                          padding: '0.25rem 0.5rem', 
                          borderRadius: '4px', 
                          fontSize: '0.75rem', 
                          fontWeight: '500',
                          background: deviation.severity === 'critical' ? '#fee2e2' : deviation.severity === 'high' ? '#fef3c7' : '#d1fae5',
                          color: deviation.severity === 'critical' ? '#dc2626' : deviation.severity === 'high' ? '#d97706' : '#059669'
                        }}>
                          {deviation.severity === 'critical' ? 'Kritisk' : deviation.severity === 'high' ? 'Høy' : deviation.severity === 'medium' ? 'Middels' : 'Lav'}
                        </span>
                        <span style={{ 
                          padding: '0.25rem 0.5rem', 
                          borderRadius: '4px', 
                          fontSize: '0.75rem', 
                          fontWeight: '500',
                          background: getStatusColor(deviation.status),
                          color: getStatusTextColor(deviation.status)
                        }}>
                          {deviation.status}
                        </span>
                      </div>
                      <div style={{ display: 'flex', gap: '1rem', fontSize: '0.875rem', color: 'var(--gray-500)', flexWrap: 'wrap' }}>
                        <span>Type: {deviation.type}</span>
                        {deviation.location && <span>Lokasjon: {deviation.location}</span>}
                        {deviation.departmentId && <span>Avdeling: {departments.find(d => d.id === deviation.departmentId)?.name || 'Ukjent'}</span>}
                      </div>
                      {deviation.description && (
                        <p style={{ fontSize: '0.875rem', color: 'var(--gray-600)', marginTop: '0.5rem', margin: 0 }}>
                          {deviation.description.substring(0, 100)}{deviation.description.length > 100 ? '...' : ''}
                        </p>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        onClick={() => handleViewDeviation(deviation)}
                        style={{
                          padding: '0.5rem',
                          background: 'var(--gray-100)',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        <Eye size={16} style={{ color: 'var(--gray-500)' }} />
                      </button>
                      <button
                        onClick={() => handleEditDeviation(deviation)}
                        style={{
                          padding: '0.5rem',
                          background: 'var(--gray-100)',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        <Edit size={16} style={{ color: 'var(--gray-500)' }} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Risk Assessment Tab Content */}
      {activeTab === 'risk-assessment' && (userProfile?.permissions?.risikovurdering || userProfile?.permissions?.internkontrollOgSamsvar || userProfile?.role === 'admin' || userProfile?.role === 'super_admin') && (
        <div>
          <div style={{
            background: 'var(--card-background)',
            borderRadius: '12px',
            border: '1px solid var(--border-color)',
            overflow: 'hidden',
            boxShadow: 'var(--shadow-md)'
          }}>
            <div style={{ 
              padding: '1.5rem', 
              borderBottom: '1px solid var(--border-color)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: 'var(--text-color)', margin: 0 }}>
                Alle Risikovurderinger ({riskAssessments.length})
            </h3>
            </div>

            <div>
              {riskAssessments.length === 0 ? (
                <div style={{ 
                  padding: '3rem', 
                  textAlign: 'center', 
                  color: 'var(--gray-500)' 
                }}>
                  <Shield size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
                  <p style={{ fontSize: '1rem', margin: 0 }}>Ingen risikovurderinger funnet</p>
                </div>
              ) : (
                riskAssessments.map((risk) => (
                  <div key={risk.id} style={{ 
                    padding: '1.5rem', 
                    borderBottom: '1px solid var(--border-color)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    transition: 'background-color 0.2s'
                  }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                        <h4 style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--text-color)', margin: 0 }}>
                          {risk.title}
                        </h4>
                        <span style={{ 
                          padding: '0.25rem 0.5rem', 
                          borderRadius: '4px', 
                          fontSize: '0.75rem', 
                          fontWeight: '500',
                          background: risk.riskLevel === 'critical' ? '#fee2e2' : risk.riskLevel === 'high' ? '#fef3c7' : '#d1fae5',
                          color: risk.riskLevel === 'critical' ? '#dc2626' : risk.riskLevel === 'high' ? '#d97706' : '#059669'
                        }}>
                          {risk.riskLevel === 'critical' ? 'Kritisk' : risk.riskLevel === 'high' ? 'Høy' : risk.riskLevel === 'medium' ? 'Middels' : 'Lav'}
                        </span>
                        <span style={{ 
                          padding: '0.25rem 0.5rem', 
                          borderRadius: '4px', 
                          fontSize: '0.75rem', 
                          fontWeight: '500',
                          background: risk.status === 'approved' ? '#dcfce7' : risk.status === 'pending_approval' ? '#fef3c7' : '#f3f4f6',
                          color: risk.status === 'approved' ? '#166534' : risk.status === 'pending_approval' ? '#d97706' : '#6b7280'
                        }}>
                          {risk.status === 'approved' ? 'Godkjent' : risk.status === 'pending_approval' ? 'Venter godkjenning' : risk.status === 'rejected' ? 'Avvist' : 'Utkast'}
                        </span>
                      </div>
                      <div style={{ display: 'flex', gap: '1rem', fontSize: '0.875rem', color: 'var(--gray-500)', flexWrap: 'wrap' }}>
                        <span>Aktivitet: {risk.activity}</span>
                        <span>Fare: {risk.hazard}</span>
                        {risk.location && <span>Lokasjon: {risk.location}</span>}
                        {risk.departmentId && <span>Avdeling: {departments.find(d => d.id === risk.departmentId)?.name || 'Ukjent'}</span>}
                        <span>Gjennomgang: {risk.reviewDate}</span>
                      </div>
                      {risk.description && (
                        <p style={{ fontSize: '0.875rem', color: 'var(--gray-600)', marginTop: '0.5rem', margin: 0 }}>
                          {risk.description.substring(0, 100)}{risk.description.length > 100 ? '...' : ''}
            </p>
                      )}
          </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        onClick={() => handleEditRiskAssessment(risk)}
                        style={{
                          padding: '0.5rem 1rem',
                          background: 'var(--primary)',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '0.5rem',
                          fontSize: '0.875rem',
                          fontWeight: '500'
                        }}
                      >
                        <Edit size={16} />
                        Behandle
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Follow-up Actions Tab Content */}
      {activeTab === 'follow-up' && (userProfile?.permissions?.oppfølgingstiltak || userProfile?.permissions?.internkontrollOgSamsvar || userProfile?.role === 'admin' || userProfile?.role === 'super_admin') && (
        <div>
          <div style={{
            background: 'var(--card-background)',
            borderRadius: '12px',
            border: '1px solid var(--border-color)',
            overflow: 'hidden',
            boxShadow: 'var(--shadow-md)'
          }}>
            <div style={{ 
              padding: '1.5rem', 
              borderBottom: '1px solid var(--border-color)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: 'var(--text-color)', margin: 0 }}>
                Alle Oppfølgingstiltak ({followUpActions.length})
            </h3>
            </div>

            <div>
              {followUpActions.length === 0 ? (
                <div style={{ 
                  padding: '3rem', 
                  textAlign: 'center', 
                  color: 'var(--gray-500)' 
                }}>
                  <CheckSquare size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
                  <p style={{ fontSize: '1rem', margin: 0 }}>Ingen oppfølgingstiltak funnet</p>
                </div>
              ) : (
                followUpActions.map((action) => (
                  <div key={action.id} style={{ 
                    padding: '1.5rem', 
                    borderBottom: '1px solid var(--border-color)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    transition: 'background-color 0.2s'
                  }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                        <h4 style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--text-color)', margin: 0 }}>
                          {action.title}
                        </h4>
                        <span style={{ 
                          padding: '0.25rem 0.5rem', 
                          borderRadius: '4px', 
                          fontSize: '0.75rem', 
                          fontWeight: '500',
                          background: getPriorityColor(action.priority),
                          color: getPriorityTextColor(action.priority)
                        }}>
                          {action.priority}
                        </span>
                        <span style={{ 
                          padding: '0.25rem 0.5rem', 
                          borderRadius: '4px', 
                          fontSize: '0.75rem', 
                          fontWeight: '500',
                          background: action.status === 'completed' ? '#dcfce7' : action.status === 'in_progress' ? '#dbeafe' : action.status === 'overdue' ? '#fee2e2' : '#f3f4f6',
                          color: action.status === 'completed' ? '#166534' : action.status === 'in_progress' ? '#1d4ed8' : action.status === 'overdue' ? '#dc2626' : '#6b7280'
                        }}>
                          {action.status === 'completed' ? 'Fullført' : action.status === 'in_progress' ? 'Pågår' : action.status === 'overdue' ? 'Forfalt' : 'Ikke startet'}
                        </span>
                      </div>
                      <div style={{ display: 'flex', gap: '1rem', fontSize: '0.875rem', color: 'var(--gray-500)', flexWrap: 'wrap' }}>
                        <span>Ansvarlig: {action.responsiblePerson}</span>
                        {action.departmentId && <span>Avdeling: {departments.find(d => d.id === action.departmentId)?.name || 'Ukjent'}</span>}
                        <span>Frist: {action.dueDate}</span>
                      </div>
                      {action.description && (
                        <p style={{ fontSize: '0.875rem', color: 'var(--gray-600)', marginTop: '0.5rem', margin: 0 }}>
                          {action.description.substring(0, 100)}{action.description.length > 100 ? '...' : ''}
                        </p>
                      )}
          </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        onClick={() => handleEditFollowUpAction(action)}
                        style={{
                          padding: '0.5rem 1rem',
                          background: 'var(--primary)',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '0.5rem',
                          fontSize: '0.875rem',
                          fontWeight: '500'
                        }}
                      >
                        <Edit size={16} />
                        Behandle
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Checkpoints Tab Content */}
      {activeTab === 'checkpoints' && (userProfile?.permissions?.kontrollpunkter || userProfile?.permissions?.internkontrollOgSamsvar || userProfile?.role === 'admin' || userProfile?.role === 'super_admin') && (
        <div>
          <div style={{
            background: 'var(--card-background)',
            borderRadius: '12px',
            border: '1px solid var(--border-color)',
            overflow: 'hidden',
            boxShadow: 'var(--shadow-md)'
          }}>
            <div style={{ 
              padding: '1.5rem', 
              borderBottom: '1px solid var(--border-color)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: 'var(--text-color)', margin: 0 }}>
                Alle Kontrollpunkter ({checkpoints.length})
            </h3>
            </div>

            <div>
              {checkpoints.length === 0 ? (
                <div style={{ 
                  padding: '3rem', 
                  textAlign: 'center', 
                  color: 'var(--gray-500)' 
                }}>
                  <CheckCircle size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
                  <p style={{ fontSize: '1rem', margin: 0 }}>Ingen kontrollpunkter funnet</p>
                </div>
              ) : (
                checkpoints.map((checkpoint) => (
                  <div key={checkpoint.id} style={{ 
                    padding: '1.5rem', 
                    borderBottom: '1px solid var(--border-color)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    transition: 'background-color 0.2s'
                  }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                        <h4 style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--text-color)', margin: 0 }}>
                          {checkpoint.title}
                        </h4>
                        <span style={{ 
                          padding: '0.25rem 0.5rem', 
                          borderRadius: '4px', 
                          fontSize: '0.75rem', 
                          fontWeight: '500',
                          background: checkpoint.status === 'completed' ? '#dcfce7' : checkpoint.status === 'failed' ? '#fee2e2' : checkpoint.status === 'overdue' ? '#fee2e2' : '#fef3c7',
                          color: checkpoint.status === 'completed' ? '#166534' : checkpoint.status === 'failed' ? '#dc2626' : checkpoint.status === 'overdue' ? '#dc2626' : '#d97706'
                        }}>
                          {checkpoint.status === 'completed' ? 'Fullført' : checkpoint.status === 'failed' ? 'Feilet' : checkpoint.status === 'overdue' ? 'Forfalt' : 'Venter'}
                        </span>
                        <span style={{ 
                          padding: '0.25rem 0.5rem', 
                          borderRadius: '4px', 
                          fontSize: '0.75rem', 
                          fontWeight: '500',
                          background: '#e0e7ff',
                          color: '#4338ca'
                        }}>
                          {checkpoint.category === 'safety' ? 'Sikkerhet' : checkpoint.category === 'quality' ? 'Kvalitet' : checkpoint.category === 'environmental' ? 'Miljø' : checkpoint.category === 'process' ? 'Prosess' : 'Regulatorisk'}
                        </span>
                      </div>
                      <div style={{ display: 'flex', gap: '1rem', fontSize: '0.875rem', color: 'var(--gray-500)', flexWrap: 'wrap' }}>
                        <span>Frekvens: {checkpoint.frequency === 'daily' ? 'Daglig' : checkpoint.frequency === 'weekly' ? 'Ukentlig' : checkpoint.frequency === 'monthly' ? 'Månedlig' : checkpoint.frequency === 'quarterly' ? 'Kvartalsvis' : 'Årlig'}</span>
                        <span>Ansvarlig: {checkpoint.responsiblePerson}</span>
                        {checkpoint.departmentId && <span>Avdeling: {departments.find(d => d.id === checkpoint.departmentId)?.name || 'Ukjent'}</span>}
                        <span>Neste sjekk: {checkpoint.nextCheck}</span>
                      </div>
                      {checkpoint.description && (
                        <p style={{ fontSize: '0.875rem', color: 'var(--gray-600)', marginTop: '0.5rem', margin: 0 }}>
                          {checkpoint.description.substring(0, 100)}{checkpoint.description.length > 100 ? '...' : ''}
                        </p>
                      )}
          </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        onClick={() => handleEditCheckpoint(checkpoint)}
                        style={{
                          padding: '0.5rem 1rem',
                          background: 'var(--primary)',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '0.5rem',
                          fontSize: '0.875rem',
                          fontWeight: '500'
                        }}
                      >
                        <Edit size={16} />
                        Behandle
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Reports Tab Content */}
      {activeTab === 'reports' && (userProfile?.permissions?.internkontrollRapporter || userProfile?.permissions?.internkontrollOgSamsvar || userProfile?.role === 'admin' || userProfile?.role === 'super_admin') && (
        <div>
          <div style={{
            background: 'var(--card-background)',
            borderRadius: '12px',
            border: '1px solid var(--border-color)',
            padding: '2rem',
            textAlign: 'center',
            boxShadow: 'var(--shadow-md)'
          }}>
            <BarChart3 size={64} style={{ marginBottom: '1rem', opacity: 0.5, color: 'var(--gray-400)' }} />
            <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: 'var(--text-color)', marginBottom: '0.5rem' }}>
              Rapportering
            </h3>
            <p style={{ color: 'var(--gray-500)', marginBottom: '1.5rem' }}>
              Generer rapporter og analyser for internkontroll og compliance
            </p>
            <p style={{ color: 'var(--gray-400)', fontSize: '0.875rem' }}>
              Funksjonalitet under utvikling...
            </p>
          </div>
        </div>
      )}

      {/* Add Audit Modal */}
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
          zIndex: 1000,
          padding: '1rem'
        }}>
          <div style={{
            background: 'var(--card-background)',
            borderRadius: '12px',
            width: '100%',
            maxWidth: '500px',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <div style={{
              padding: '1.5rem',
              borderBottom: '1px solid var(--border-color)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: 'var(--text-color)', margin: 0 }}>
                Ny Internrevisjon
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '1.5rem',
                  color: 'var(--gray-500)',
                  cursor: 'pointer',
                  padding: '0.25rem'
                }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-color)', marginBottom: '0.5rem' }}>
                    Tittel *
                  </label>
                  <input
                    type="text"
                    value={newAudit.title}
                    onChange={(e) => setNewAudit({ ...newAudit, title: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid var(--border-color)',
                      background: 'var(--card-background)',
                      color: 'var(--text-color)',
                      borderRadius: '8px',
                      fontSize: '0.875rem'
                    }}
                    placeholder="F.eks. Sikkerhetsrevisjon Q1 2024"
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-color)', marginBottom: '0.5rem' }}>
                      Type
                    </label>
                    <select
                      value={newAudit.type}
                      onChange={(e) => setNewAudit({ ...newAudit, type: e.target.value as 'Internrevisjon' | 'Eksternrevisjon' | 'Regulatorisk' | 'Kvalitetsrevisjon' | 'Sikkerhetsrevisjon' | 'Finansiell' })}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid var(--border-color)',
                      background: 'var(--card-background)',
                      color: 'var(--text-color)',
                        borderRadius: '8px',
                        fontSize: '0.875rem'
                      }}
                    >
                      <option value="Internrevisjon">Internrevisjon</option>
                      <option value="Eksternrevisjon">Eksternrevisjon</option>
                      <option value="Regulatorisk">Regulatorisk</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-color)', marginBottom: '0.5rem' }}>
                      Prioritet
                    </label>
                    <select
                      value={newAudit.priority}
                      onChange={(e) => setNewAudit({ ...newAudit, priority: e.target.value as 'Høy' | 'Middels' | 'Lav' })}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid var(--border-color)',
                      background: 'var(--card-background)',
                      color: 'var(--text-color)',
                        borderRadius: '8px',
                        fontSize: '0.875rem'
                      }}
                    >
                      <option value="Høy">Høy</option>
                      <option value="Middels">Middels</option>
                      <option value="Lav">Lav</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-color)', marginBottom: '0.5rem' }}>
                    Omfang
                  </label>
                  <input
                    type="text"
                    value={newAudit.scope}
                    onChange={(e) => setNewAudit({ ...newAudit, scope: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid var(--border-color)',
                      background: 'var(--card-background)',
                      color: 'var(--text-color)',
                      borderRadius: '8px',
                      fontSize: '0.875rem'
                    }}
                    placeholder="F.eks. Alle avdelinger, Produksjonsavdeling"
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-color)', marginBottom: '0.5rem' }}>
                      Planlagt dato *
                    </label>
                    <input
                      type="date"
                      value={newAudit.plannedDate}
                      onChange={(e) => setNewAudit({ ...newAudit, plannedDate: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid var(--border-color)',
                      background: 'var(--card-background)',
                      color: 'var(--text-color)',
                        borderRadius: '8px',
                        fontSize: '0.875rem'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-color)', marginBottom: '0.5rem' }}>
                      Neste gjennomgang
                    </label>
                    <input
                      type="date"
                      value={newAudit.nextReview}
                      onChange={(e) => setNewAudit({ ...newAudit, nextReview: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid var(--border-color)',
                      background: 'var(--card-background)',
                      color: 'var(--text-color)',
                        borderRadius: '8px',
                        fontSize: '0.875rem'
                      }}
                    />
                  </div>
                </div>

                <ResponsiblePersonMultiSelect
                  selectedIds={newAudit.responsiblePersonIds}
                  onChange={(ids) => {
                    const selectedEmployees = employees.filter(e => ids.includes(e.id));
                    setNewAudit({
                      ...newAudit,
                      responsiblePersonIds: ids,
                      responsiblePerson: selectedEmployees.map(e => e.displayName).join(', ')
                    });
                  }}
                  employees={employees}
                />

                  <div>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-color)', marginBottom: '0.5rem' }}>
                    Avdeling
                    </label>
                  <select
                    value={newAudit.departmentId}
                    onChange={(e) => setNewAudit({ ...newAudit, departmentId: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid var(--border-color)',
                      background: 'var(--card-background)',
                      color: 'var(--text-color)',
                        borderRadius: '8px',
                        fontSize: '0.875rem'
                      }}
                  >
                    <option value="">Velg avdeling</option>
                    {departments.map(dept => (
                      <option key={dept.id} value={dept.id}>{dept.name}</option>
                    ))}
                  </select>
                  </div>

                {/* File Upload Section */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-color)', marginBottom: '0.5rem' }}>
                    Vedlegg (Bilder, Video, Dokumenter)
                    </label>
                    <input
                    type="file"
                    multiple
                    accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.csv"
                    onChange={(e) => {
                      const files = Array.from(e.target.files || []);
                      setSelectedFiles(prev => ({
                        ...prev,
                        'audit-add': files
                      }));
                    }}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid var(--border-color)',
                      background: 'var(--card-background)',
                      color: 'var(--text-color)',
                        borderRadius: '8px',
                      fontSize: '0.875rem',
                      cursor: 'pointer'
                    }}
                  />
                  {selectedFiles['audit-add'] && selectedFiles['audit-add'].length > 0 && (
                    <div style={{ marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {selectedFiles['audit-add'].map((file, index) => (
                        <div key={index} style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '0.5rem',
                          background: 'var(--gray-50)',
                          borderRadius: '6px',
                          fontSize: '0.875rem'
                        }}>
                          <span style={{ color: 'var(--text-color)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                          </span>
                          <button
                            onClick={() => {
                              setSelectedFiles(prev => ({
                                ...prev,
                                'audit-add': prev['audit-add']?.filter((_, i) => i !== index) || []
                              }));
                            }}
                            style={{
                              padding: '0.25rem 0.5rem',
                              background: 'var(--danger)',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '0.75rem',
                              marginLeft: '0.5rem'
                            }}
                          >
                            <X size={14} />
                          </button>
                  </div>
                      ))}
                    </div>
                  )}
                  <p style={{ fontSize: '0.75rem', color: 'var(--gray-500)', marginTop: '0.25rem' }}>
                    Du kan laste opp bilder, video og dokumenter. Filene vil bli lastet opp etter at revisjonen er opprettet.
                  </p>
                </div>
              </div>

              <div style={{ 
                display: 'flex', 
                gap: '1rem', 
                justifyContent: 'flex-end', 
                marginTop: '2rem',
                paddingTop: '1rem',
                borderTop: '1px solid var(--border-color)'
              }}>
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    setSelectedFiles(prev => ({ ...prev, 'audit-add': [] }));
                  }}
                  style={{
                    padding: '0.75rem 1.5rem',
                    background: 'var(--gray-100)',
                    color: 'var(--text-color)',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    cursor: 'pointer'
                  }}
                >
                  Avbryt
                </button>
                <button
                  onClick={handleAddAudit}
                  disabled={uploadingFiles['audit-add']}
                  style={{
                    padding: '0.75rem 1.5rem',
                    background: uploadingFiles['audit-add'] ? 'var(--gray-400)' : 'var(--primary)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    cursor: uploadingFiles['audit-add'] ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}
                >
                  {uploadingFiles['audit-add'] ? (
                    <>
                      <div style={{
                        width: '16px',
                        height: '16px',
                        border: '2px solid white',
                        borderTopColor: 'transparent',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite'
                      }}></div>
                      Laster opp...
                    </>
                  ) : (
                    'Opprett revisjon'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Audit Detail Modal */}
      {showDetailModal && selectedAudit && (
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
            background: 'var(--card-background)',
            borderRadius: '12px',
            width: '100%',
            maxWidth: '600px',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <div style={{
              padding: '1.5rem',
              borderBottom: '1px solid var(--border-color)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: 'var(--text-color)', margin: 0 }}>
                {selectedAudit.title}
              </h3>
              <button
                onClick={() => setShowDetailModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '1.5rem',
                  color: 'var(--gray-500)',
                  cursor: 'pointer',
                  padding: '0.25rem'
                }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div>
                  <h4 style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--text-color)', marginBottom: '0.5rem' }}>
                    Grunnleggende informasjon
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', fontSize: '0.875rem' }}>
                    <div>
                      <span style={{ color: 'var(--gray-500)' }}>Type:</span>
                      <span style={{ color: 'var(--text-color)', marginLeft: '0.5rem' }}>{selectedAudit.type}</span>
                    </div>
                    <div>
                      <span style={{ color: 'var(--gray-500)' }}>Status:</span>
                      <span style={{ 
                        color: getStatusTextColor(selectedAudit.status), 
                        marginLeft: '0.5rem',
                        padding: '0.25rem 0.5rem',
                        borderRadius: '4px',
                        background: getStatusColor(selectedAudit.status),
                        fontSize: '0.75rem'
                      }}>
                        {selectedAudit.status}
                      </span>
                    </div>
                    <div>
                      <span style={{ color: 'var(--gray-500)' }}>Prioritet:</span>
                      <span style={{ 
                        color: getPriorityTextColor(selectedAudit.priority), 
                        marginLeft: '0.5rem',
                        padding: '0.25rem 0.5rem',
                        borderRadius: '4px',
                        background: getPriorityColor(selectedAudit.priority),
                        fontSize: '0.75rem'
                      }}>
                        {selectedAudit.priority}
                      </span>
                    </div>
                    <div>
                      <span style={{ color: 'var(--gray-500)' }}>Omfang:</span>
                      <span style={{ color: 'var(--text-color)', marginLeft: '0.5rem' }}>{selectedAudit.scope}</span>
                    </div>
                    <div>
                      <span style={{ color: 'var(--gray-500)' }}>Planlagt:</span>
                      <span style={{ color: 'var(--text-color)', marginLeft: '0.5rem' }}>{selectedAudit.plannedDate}</span>
                    </div>
                    <div>
                      <span style={{ color: 'var(--gray-500)' }}>Ansvarlig:</span>
                      <span style={{ color: 'var(--text-color)', marginLeft: '0.5rem' }}>{selectedAudit.responsiblePerson}</span>
                    </div>
                    <div>
                      <span style={{ color: 'var(--gray-500)' }}>Avdeling:</span>
                      <span style={{ color: 'var(--text-color)', marginLeft: '0.5rem' }}>{selectedAudit.department}</span>
                    </div>
                    <div>
                      <span style={{ color: 'var(--gray-500)' }}>Neste gjennomgang:</span>
                      <span style={{ color: 'var(--text-color)', marginLeft: '0.5rem' }}>{selectedAudit.nextReview}</span>
                    </div>
                  </div>
                </div>

                {selectedAudit.findings.length > 0 && (
                  <div>
                    <h4 style={{ fontSize: '1rem', fontWeight: '600', color: '#111827', marginBottom: '0.5rem' }}>
                      Funn
                    </h4>
                    <ul style={{ margin: 0, paddingLeft: '1.5rem' }}>
                      {selectedAudit.findings.map((finding, index) => (
                        <li key={index} style={{ color: 'var(--text-color)', marginBottom: '0.25rem' }}>
                          {finding}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {selectedAudit.recommendations.length > 0 && (
                  <div>
                    <h4 style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--text-color)', marginBottom: '0.5rem' }}>
                      Anbefalinger
                    </h4>
                    <ul style={{ margin: 0, paddingLeft: '1.5rem' }}>
                      {selectedAudit.recommendations.map((recommendation, index) => (
                        <li key={index} style={{ color: 'var(--text-color)', marginBottom: '0.25rem' }}>
                          {recommendation}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Documents/Attachments Section */}
                {((selectedAudit.documents && selectedAudit.documents.length > 0) || ((selectedAudit as any).attachments && (selectedAudit as any).attachments.length > 0)) && (
                  <div>
                    <h4 style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--text-color)', marginBottom: '0.5rem' }}>
                      Vedlegg
                    </h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {/* Show documents if available (new format) */}
                      {selectedAudit.documents && selectedAudit.documents.length > 0 && selectedAudit.documents.map((doc: AuditDocument) => (
                        <div key={doc.id} style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '0.75rem',
                          background: 'var(--gray-50)',
                          borderRadius: '8px',
                          border: '1px solid var(--border-color)'
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, minWidth: 0 }}>
                            <FileText size={20} style={{ color: 'var(--primary)', flexShrink: 0 }} />
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-color)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {doc.fileName}
              </div>
                              {doc.description && (
                                <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)', marginTop: '0.25rem' }}>
                                  {doc.description}
            </div>
                              )}
                              <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)', marginTop: '0.25rem' }}>
                                {(doc.fileSize / 1024 / 1024).toFixed(2)} MB • {new Date(doc.uploadedAt).toLocaleDateString('no-NO')}
                              </div>
                            </div>
                          </div>
                          <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
                            <a
                              href={doc.fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              download={doc.fileName}
                              style={{
                                padding: '0.5rem',
                                background: 'var(--primary)',
                                color: 'white',
                                border: 'none',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                textDecoration: 'none'
                              }}
                              title="Last ned"
                            >
                              <Download size={16} />
                            </a>
                            {(userProfile?.role === 'admin' || userProfile?.role === 'super_admin' || userProfile?.role === 'department_leader') && (
                              <button
                                onClick={async () => {
                                  if (confirm('Er du sikker på at du vil slette dette vedlegget?')) {
                                    try {
                                      await firebaseService.deleteAuditDocument(selectedAudit.id, doc.id);
                                      const updated = await firebaseService.getInternalAudit(selectedAudit.id);
                                      if (updated) setSelectedAudit(updated);
                                    } catch (error) {
                                      console.error('Error deleting document:', error);
                                      alert('Feil ved sletting av vedlegg');
                                    }
                                  }
                                }}
                                style={{
                                  padding: '0.5rem',
                                  background: 'var(--danger)',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '6px',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center'
                                }}
                                title="Slett"
                              >
                                <Trash2 size={16} />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                      {/* Show legacy attachments if documents array is empty but attachments exist */}
                      {(!selectedAudit.documents || selectedAudit.documents.length === 0) && (selectedAudit as any).attachments && (selectedAudit as any).attachments.length > 0 && (selectedAudit as any).attachments.map((url: string, index: number) => (
                        <div key={index} style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '0.75rem',
                          background: 'var(--gray-50)',
                          borderRadius: '8px',
                          border: '1px solid var(--border-color)'
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, minWidth: 0 }}>
                            <FileText size={20} style={{ color: 'var(--primary)', flexShrink: 0 }} />
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-color)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                Vedlegg {index + 1}
                              </div>
                              <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)', marginTop: '0.25rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {url}
                              </div>
                            </div>
                          </div>
                          <a
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            download
                            style={{
                              padding: '0.5rem',
                              background: 'var(--primary)',
                              color: 'white',
                              border: 'none',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              textDecoration: 'none'
                            }}
                            title="Last ned"
                          >
                            <Download size={16} />
                          </a>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {(userProfile?.role === 'admin' || userProfile?.role === 'super_admin' || userProfile?.role === 'department_leader') && (
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                    <button
                      onClick={() => {
                        setShowDetailModal(false);
                        handleEditAudit(selectedAudit);
                      }}
                      style={{
                        flex: 1,
                        background: 'var(--primary)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        padding: '0.75rem',
                        fontSize: '0.875rem',
                        fontWeight: '600',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem'
                      }}
                    >
                      <Edit size={16} />
                      Behandle revisjon
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Audit Modal */}
      {showEditModal && selectedAudit && (
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
            background: 'var(--card-background)',
            borderRadius: '12px',
            width: '100%',
            maxWidth: '800px',
            maxHeight: '90vh',
            overflowY: 'auto',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
          }}>
            <div style={{
              padding: '1.5rem',
              borderBottom: '1px solid var(--border-color)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: 'var(--text-color)', margin: 0 }}>
                Behandle revisjon
              </h3>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setSelectedAudit(null);
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '1.5rem',
                  color: 'var(--gray-500)',
                  cursor: 'pointer',
                  padding: '0.25rem'
                }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-color)', marginBottom: '0.5rem' }}>
                    Tittel *
                  </label>
                  <input
                    type="text"
                    value={newAudit.title}
                    onChange={(e) => setNewAudit({ ...newAudit, title: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid var(--border-color)',
                      background: 'var(--card-background)',
                      color: 'var(--text-color)',
                      borderRadius: '8px',
                      fontSize: '0.875rem'
                    }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-color)', marginBottom: '0.5rem' }}>
                      Status *
                    </label>
                    <select
                      value={newAudit.status}
                      onChange={(e) => setNewAudit({ ...newAudit, status: e.target.value as 'Planlagt' | 'Pågående' | 'Fullført' | 'Avbrutt' | 'Overdue' })}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid var(--border-color)',
                        background: 'var(--card-background)',
                        color: 'var(--text-color)',
                        borderRadius: '8px',
                        fontSize: '0.875rem'
                      }}
                    >
                      <option value="Planlagt">Planlagt</option>
                      <option value="Pågående">Pågående</option>
                      <option value="Fullført">Fullført</option>
                      <option value="Avbrutt">Avbrutt</option>
                      <option value="Overdue">Forfalt</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-color)', marginBottom: '0.5rem' }}>
                      Prioritet
                    </label>
                    <select
                      value={newAudit.priority}
                      onChange={(e) => setNewAudit({ ...newAudit, priority: e.target.value as 'Høy' | 'Middels' | 'Lav' })}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid var(--border-color)',
                        background: 'var(--card-background)',
                        color: 'var(--text-color)',
                        borderRadius: '8px',
                        fontSize: '0.875rem'
                      }}
                    >
                      <option value="Høy">Høy</option>
                      <option value="Middels">Middels</option>
                      <option value="Lav">Lav</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-color)', marginBottom: '0.5rem' }}>
                    Beskrivelse
                  </label>
                  <textarea
                    value={newAudit.description}
                    onChange={(e) => setNewAudit({ ...newAudit, description: e.target.value })}
                    rows={4}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid var(--border-color)',
                      background: 'var(--card-background)',
                      color: 'var(--text-color)',
                      borderRadius: '8px',
                      fontSize: '0.875rem',
                      resize: 'vertical'
                    }}
                    placeholder="Beskriv revisjonen..."
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-color)', marginBottom: '0.5rem' }}>
                      Planlagt dato
                    </label>
                    <input
                      type="date"
                      value={newAudit.plannedDate}
                      onChange={(e) => setNewAudit({ ...newAudit, plannedDate: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid var(--border-color)',
                        background: 'var(--card-background)',
                        color: 'var(--text-color)',
                        borderRadius: '8px',
                        fontSize: '0.875rem'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-color)', marginBottom: '0.5rem' }}>
                      Neste gjennomgang
                    </label>
                    <input
                      type="date"
                      value={newAudit.nextReview}
                      onChange={(e) => setNewAudit({ ...newAudit, nextReview: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid var(--border-color)',
                        background: 'var(--card-background)',
                        color: 'var(--text-color)',
                        borderRadius: '8px',
                        fontSize: '0.875rem'
                      }}
                    />
                  </div>
                </div>

                <ResponsiblePersonMultiSelect
                  selectedIds={newAudit.responsiblePersonIds}
                  onChange={(ids) => {
                    const selectedEmployees = employees.filter(e => ids.includes(e.id));
                    setNewAudit({
                      ...newAudit,
                      responsiblePersonIds: ids,
                      responsiblePerson: selectedEmployees.map(e => e.displayName).join(', ')
                    });
                  }}
                  employees={employees}
                />

                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-color)', marginBottom: '0.5rem' }}>
                    Avdeling
                  </label>
                  <select
                    value={newAudit.departmentId}
                    onChange={(e) => setNewAudit({ ...newAudit, departmentId: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid var(--border-color)',
                      background: 'var(--card-background)',
                      color: 'var(--text-color)',
                      borderRadius: '8px',
                      fontSize: '0.875rem'
                    }}
                  >
                    <option value="">Velg avdeling</option>
                    {departments.map(dept => (
                      <option key={dept.id} value={dept.id}>{dept.name}</option>
                    ))}
                  </select>
                </div>

                <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                  <button
                    onClick={handleUpdateAudit}
                    style={{
                      flex: 1,
                      background: 'var(--primary)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '0.75rem',
                      fontSize: '0.875rem',
                      fontWeight: '600',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem'
                    }}
                  >
                    <Save size={16} />
                    Lagre endringer
                  </button>
                  <button
                    onClick={() => {
                      setShowEditModal(false);
                      setSelectedAudit(null);
                    }}
                    style={{
                      flex: 1,
                      background: 'var(--gray-100)',
                      color: 'var(--text-color)',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '0.75rem',
                      fontSize: '0.875rem',
                      fontWeight: '600',
                      cursor: 'pointer'
                    }}
                  >
                    Avbryt
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Deviation Modal */}
      {showAddDeviationModal && (
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
            background: 'var(--card-background)',
            borderRadius: '12px',
            width: '100%',
            maxWidth: '600px',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <div style={{
              padding: '1.5rem',
              borderBottom: '1px solid var(--border-color)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: 'var(--text-color)', margin: 0 }}>
                Rapporter nytt avvik
              </h3>
              <button
                onClick={() => setShowAddDeviationModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '1.5rem',
                  color: 'var(--gray-500)',
                  cursor: 'pointer',
                  padding: '0.25rem'
                }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-color)', marginBottom: '0.5rem' }}>
                    Tittel *
                  </label>
                  <input
                    type="text"
                    value={newDeviation.title}
                    onChange={(e) => setNewDeviation({ ...newDeviation, title: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid var(--border-color)',
                      background: 'var(--card-background)',
                      color: 'var(--text-color)',
                      borderRadius: '8px',
                      fontSize: '0.875rem'
                    }}
                    placeholder="Beskriv avviket kort"
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-color)', marginBottom: '0.5rem' }}>
                    Beskrivelse *
                  </label>
                  <textarea
                    value={newDeviation.description}
                    onChange={(e) => setNewDeviation({ ...newDeviation, description: e.target.value })}
                    rows={4}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid var(--border-color)',
                      background: 'var(--card-background)',
                      color: 'var(--text-color)',
                      borderRadius: '8px',
                      fontSize: '0.875rem',
                      resize: 'vertical'
                    }}
                    placeholder="Beskriv avviket i detalj..."
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-color)', marginBottom: '0.5rem' }}>
                      Type *
                    </label>
                    <select
                      value={newDeviation.type}
                      onChange={(e) => setNewDeviation({ ...newDeviation, type: e.target.value as any })}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid var(--border-color)',
                        background: 'var(--card-background)',
                        color: 'var(--text-color)',
                        borderRadius: '8px',
                        fontSize: '0.875rem'
                      }}
                    >
                      <option value="safety">Sikkerhet</option>
                      <option value="quality">Kvalitet</option>
                      <option value="security">Sikkerhet (IT)</option>
                      <option value="process">Prosess</option>
                      <option value="environmental">Miljø</option>
                      <option value="health">Helse</option>
                      <option value="other">Annet</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-color)', marginBottom: '0.5rem' }}>
                      Alvorlighetsgrad *
                    </label>
                    <select
                      value={newDeviation.severity}
                      onChange={(e) => setNewDeviation({ ...newDeviation, severity: e.target.value as any })}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid var(--border-color)',
                        background: 'var(--card-background)',
                        color: 'var(--text-color)',
                        borderRadius: '8px',
                        fontSize: '0.875rem'
                      }}
                    >
                      <option value="low">Lav</option>
                      <option value="medium">Middels</option>
                      <option value="high">Høy</option>
                      <option value="critical">Kritisk</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-color)', marginBottom: '0.5rem' }}>
                    Avdeling
                  </label>
                  <select
                    value={newDeviation.departmentId}
                    onChange={(e) => setNewDeviation({ ...newDeviation, departmentId: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid var(--border-color)',
                      background: 'var(--card-background)',
                      color: 'var(--text-color)',
                      borderRadius: '8px',
                      fontSize: '0.875rem'
                    }}
                  >
                    <option value="">Velg avdeling</option>
                    {departments.map(dept => (
                      <option key={dept.id} value={dept.id}>{dept.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-color)', marginBottom: '0.5rem' }}>
                    Lokasjon
                  </label>
                  <input
                    type="text"
                    value={newDeviation.location}
                    onChange={(e) => setNewDeviation({ ...newDeviation, location: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid var(--border-color)',
                      background: 'var(--card-background)',
                      color: 'var(--text-color)',
                      borderRadius: '8px',
                      fontSize: '0.875rem'
                    }}
                    placeholder="F.eks. Lager A, Produksjonslinje 2"
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-color)', marginBottom: '0.5rem' }}>
                    Utstyr (hvis relevant)
                  </label>
                  <input
                    type="text"
                    value={newDeviation.equipment}
                    onChange={(e) => setNewDeviation({ ...newDeviation, equipment: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid var(--border-color)',
                      background: 'var(--card-background)',
                      color: 'var(--text-color)',
                      borderRadius: '8px',
                      fontSize: '0.875rem'
                    }}
                    placeholder="F.eks. Maskin X, Utstyr Y"
                  />
                </div>

                {/* File Upload Section */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-color)', marginBottom: '0.5rem' }}>
                    Vedlegg (Bilder, Video, Dokumenter)
                  </label>
                  <input
                    type="file"
                    multiple
                    accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.csv"
                    onChange={(e) => {
                      const files = Array.from(e.target.files || []);
                      setSelectedFiles(prev => ({
                        ...prev,
                        'deviation-add': files
                      }));
                    }}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid var(--border-color)',
                      background: 'var(--card-background)',
                      color: 'var(--text-color)',
                      borderRadius: '8px',
                      fontSize: '0.875rem',
                      cursor: 'pointer'
                    }}
                  />
                  {selectedFiles['deviation-add'] && selectedFiles['deviation-add'].length > 0 && (
                    <div style={{ marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {selectedFiles['deviation-add'].map((file, index) => (
                        <div key={index} style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '0.5rem',
                          background: 'var(--gray-50)',
                          borderRadius: '6px',
                          fontSize: '0.875rem'
                        }}>
                          <span style={{ color: 'var(--text-color)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                          </span>
                          <button
                            onClick={() => {
                              setSelectedFiles(prev => ({
                                ...prev,
                                'deviation-add': prev['deviation-add']?.filter((_, i) => i !== index) || []
                              }));
                            }}
                            style={{
                              padding: '0.25rem 0.5rem',
                              background: 'var(--danger)',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '0.75rem',
                              marginLeft: '0.5rem'
                            }}
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  <p style={{ fontSize: '0.75rem', color: 'var(--gray-500)', marginTop: '0.25rem' }}>
                    Du kan laste opp bilder, video og dokumenter. Filene vil bli lastet opp etter at avviket er rapportert.
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
                <button
                  onClick={handleAddDeviation}
                  disabled={uploadingFiles['deviation-add']}
                  style={{
                    flex: 1,
                    background: uploadingFiles['deviation-add'] ? 'var(--gray-400)' : 'var(--primary)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '0.75rem',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    cursor: uploadingFiles['deviation-add'] ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem'
                  }}
                >
                  {uploadingFiles['deviation-add'] ? (
                    <>
                      <div style={{
                        width: '16px',
                        height: '16px',
                        border: '2px solid white',
                        borderTopColor: 'transparent',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite'
                      }}></div>
                      Laster opp...
                    </>
                  ) : (
                    'Rapporter avvik'
                  )}
                </button>
                <button
                  onClick={() => {
                    setShowAddDeviationModal(false);
                    setSelectedFiles(prev => ({ ...prev, 'deviation-add': [] }));
                  }}
                  style={{
                    flex: 1,
                    background: 'var(--gray-100)',
                    color: 'var(--text-color)',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '0.75rem',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  Avbryt
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Deviation Detail/Edit Modal */}
      {showDeviationDetailModal && selectedDeviation && (
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
            background: 'var(--card-background)',
            borderRadius: '12px',
            width: '100%',
            maxWidth: '800px',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <div style={{
              padding: '1.5rem',
              borderBottom: '1px solid var(--border-color)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: 'var(--text-color)', margin: 0 }}>
                  {selectedDeviation.title}
                </h3>
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                  <span style={{ 
                    padding: '0.25rem 0.5rem', 
                    borderRadius: '4px', 
                    fontSize: '0.75rem', 
                    fontWeight: '500',
                    background: selectedDeviation.severity === 'critical' ? '#fee2e2' : selectedDeviation.severity === 'high' ? '#fef3c7' : '#d1fae5',
                    color: selectedDeviation.severity === 'critical' ? '#dc2626' : selectedDeviation.severity === 'high' ? '#d97706' : '#059669'
                  }}>
                    {selectedDeviation.severity === 'critical' ? 'Kritisk' : selectedDeviation.severity === 'high' ? 'Høy' : selectedDeviation.severity === 'medium' ? 'Middels' : 'Lav'}
                  </span>
                  <span style={{ 
                    padding: '0.25rem 0.5rem', 
                    borderRadius: '4px', 
                    fontSize: '0.75rem', 
                    fontWeight: '500',
                    background: getStatusColor(selectedDeviation.status),
                    color: getStatusTextColor(selectedDeviation.status)
                  }}>
                    {selectedDeviation.status}
                  </span>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowDeviationDetailModal(false);
                  setShowEditDeviationModal(false);
                  setSelectedDeviation(null);
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '1.5rem',
                  color: 'var(--gray-500)',
                  cursor: 'pointer',
                  padding: '0.25rem'
                }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ padding: '1.5rem' }}>
              {!showEditDeviationModal ? (
                // View Mode
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  <div>
                    <h4 style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--text-color)', marginBottom: '0.5rem' }}>
                      Beskrivelse
                    </h4>
                    <p style={{ color: 'var(--gray-700)', fontSize: '0.875rem', lineHeight: '1.6' }}>
                      {selectedDeviation.description}
                    </p>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div>
                      <span style={{ color: 'var(--gray-500)', fontSize: '0.875rem' }}>Type:</span>
                      <span style={{ color: 'var(--text-color)', marginLeft: '0.5rem' }}>{selectedDeviation.type}</span>
                    </div>
                    {selectedDeviation.location && (
                      <div>
                        <span style={{ color: 'var(--gray-500)', fontSize: '0.875rem' }}>Lokasjon:</span>
                        <span style={{ color: 'var(--text-color)', marginLeft: '0.5rem' }}>{selectedDeviation.location}</span>
                      </div>
                    )}
                    {selectedDeviation.departmentId && (
                      <div>
                        <span style={{ color: 'var(--gray-500)', fontSize: '0.875rem' }}>Avdeling:</span>
                        <span style={{ color: 'var(--text-color)', marginLeft: '0.5rem' }}>
                          {departments.find(d => d.id === selectedDeviation.departmentId)?.name || 'Ukjent'}
                        </span>
                      </div>
                    )}
                    {selectedDeviation.equipment && (
                      <div>
                        <span style={{ color: 'var(--gray-500)', fontSize: '0.875rem' }}>Utstyr:</span>
                        <span style={{ color: 'var(--text-color)', marginLeft: '0.5rem' }}>{selectedDeviation.equipment}</span>
                      </div>
                    )}
                  </div>

                  {selectedDeviation.immediateActions && (
                    <div>
                      <h4 style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--text-color)', marginBottom: '0.5rem' }}>
                        Umiddelbare tiltak
                      </h4>
                      <p style={{ color: 'var(--gray-700)', fontSize: '0.875rem', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>
                        {selectedDeviation.immediateActions}
                      </p>
                    </div>
                  )}

                  {selectedDeviation.rootCause && (
                    <div>
                      <h4 style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--text-color)', marginBottom: '0.5rem' }}>
                        Rotårsak
                      </h4>
                      <p style={{ color: 'var(--gray-700)', fontSize: '0.875rem', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>
                        {selectedDeviation.rootCause}
                      </p>
                    </div>
                  )}

                  {selectedDeviation.correctiveActions && (
                    <div>
                      <h4 style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--text-color)', marginBottom: '0.5rem' }}>
                        Korrigerende tiltak
                      </h4>
                      <p style={{ color: 'var(--gray-700)', fontSize: '0.875rem', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>
                        {selectedDeviation.correctiveActions}
                      </p>
                    </div>
                  )}

                  {selectedDeviation.preventiveActions && (
                    <div>
                      <h4 style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--text-color)', marginBottom: '0.5rem' }}>
                        Forebyggende tiltak
                      </h4>
                      <p style={{ color: 'var(--gray-700)', fontSize: '0.875rem', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>
                        {selectedDeviation.preventiveActions}
                      </p>
                    </div>
                  )}

                  {/* Documents/Attachments Section */}
                  {((selectedDeviation.documents && selectedDeviation.documents.length > 0) || (selectedDeviation.attachments && selectedDeviation.attachments.length > 0)) && (
                    <div>
                      <h4 style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--text-color)', marginBottom: '0.5rem' }}>
                        Vedlegg
                      </h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {/* Show documents if available (new format) */}
                        {selectedDeviation.documents && selectedDeviation.documents.length > 0 && selectedDeviation.documents.map((doc: AuditDocument) => (
                          <div key={doc.id} style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '0.75rem',
                            background: 'var(--gray-50)',
                            borderRadius: '8px',
                            border: '1px solid var(--border-color)'
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, minWidth: 0 }}>
                              <FileText size={20} style={{ color: 'var(--primary)', flexShrink: 0 }} />
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-color)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                  {doc.fileName}
                                </div>
                                {doc.description && (
                                  <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)', marginTop: '0.25rem' }}>
                                    {doc.description}
                                  </div>
                                )}
                                <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)', marginTop: '0.25rem' }}>
                                  {(doc.fileSize / 1024 / 1024).toFixed(2)} MB • {new Date(doc.uploadedAt).toLocaleDateString('no-NO')}
                                </div>
                              </div>
                            </div>
                            <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
                              <a
                                href={doc.fileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                download={doc.fileName}
                                style={{
                                  padding: '0.5rem',
                                  background: 'var(--primary)',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '6px',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  textDecoration: 'none'
                                }}
                                title="Last ned"
                              >
                                <Download size={16} />
                              </a>
                              {(userProfile?.role === 'admin' || userProfile?.role === 'super_admin' || userProfile?.role === 'department_leader') && (
                                <button
                                  onClick={async () => {
                                    if (confirm('Er du sikker på at du vil slette dette vedlegget?')) {
                                      try {
                                        await firebaseService.deleteDeviationFile(selectedDeviation.id, doc.id);
                                        const updated = await firebaseService.getDeviations(userProfile?.companyId || '', undefined, {});
                                        const found = updated.find(d => d.id === selectedDeviation.id);
                                        if (found) setSelectedDeviation(found);
                                      } catch (error) {
                                        console.error('Error deleting document:', error);
                                        alert('Feil ved sletting av vedlegg');
                                      }
                                    }
                                  }}
                                  style={{
                                    padding: '0.5rem',
                                    background: 'var(--danger)',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                  }}
                                  title="Slett"
                                >
                                  <Trash2 size={16} />
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                        {/* Show legacy attachments if documents array is empty but attachments exist */}
                        {(!selectedDeviation.documents || selectedDeviation.documents.length === 0) && selectedDeviation.attachments && selectedDeviation.attachments.length > 0 && selectedDeviation.attachments.map((url: string, index: number) => (
                          <div key={index} style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '0.75rem',
                            background: 'var(--gray-50)',
                            borderRadius: '8px',
                            border: '1px solid var(--border-color)'
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, minWidth: 0 }}>
                              <FileText size={20} style={{ color: 'var(--primary)', flexShrink: 0 }} />
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-color)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                  Vedlegg {index + 1}
                                </div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)', marginTop: '0.25rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                  {url}
                                </div>
                              </div>
                            </div>
                            <a
                              href={url}
                              target="_blank"
                              rel="noopener noreferrer"
                              download
                              style={{
                                padding: '0.5rem',
                                background: 'var(--primary)',
                                color: 'white',
                                border: 'none',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                textDecoration: 'none'
                              }}
                              title="Last ned"
                            >
                              <Download size={16} />
                            </a>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {(userProfile?.role === 'admin' || userProfile?.role === 'super_admin' || selectedDeviation.assignedTo === userProfile?.id) && (
                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                      <button
                        onClick={() => setShowEditDeviationModal(true)}
                        style={{
                          flex: 1,
                          background: 'var(--primary)',
                          color: 'white',
                          border: 'none',
                          borderRadius: '8px',
                          padding: '0.75rem',
                          fontSize: '0.875rem',
                          fontWeight: '600',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '0.5rem'
                        }}
                      >
                        <Edit size={16} />
                        Behandle avvik
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                // Edit/Behandling Mode
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-color)', marginBottom: '0.5rem' }}>
                      Status *
                    </label>
                    <select
                      value={newDeviation.status}
                      onChange={(e) => setNewDeviation({ ...newDeviation, status: e.target.value as any })}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid var(--border-color)',
                        background: 'var(--card-background)',
                        color: 'var(--text-color)',
                        borderRadius: '8px',
                        fontSize: '0.875rem'
                      }}
                    >
                      <option value="reported">Rapportert</option>
                      <option value="investigating">Undersøkes</option>
                      <option value="in_progress">Pågår</option>
                      <option value="resolved">Løst</option>
                      <option value="closed">Lukket</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-color)', marginBottom: '0.5rem' }}>
                      Umiddelbare tiltak
                    </label>
                    <textarea
                      value={newDeviation.immediateActions}
                      onChange={(e) => setNewDeviation({ ...newDeviation, immediateActions: e.target.value })}
                      rows={3}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid var(--border-color)',
                        background: 'var(--card-background)',
                        color: 'var(--text-color)',
                        borderRadius: '8px',
                        fontSize: '0.875rem',
                        resize: 'vertical'
                      }}
                      placeholder="Beskriv umiddelbare tiltak som er tatt..."
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-color)', marginBottom: '0.5rem' }}>
                      Rotårsak
                    </label>
                    <textarea
                      value={newDeviation.rootCause}
                      onChange={(e) => setNewDeviation({ ...newDeviation, rootCause: e.target.value })}
                      rows={3}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid var(--border-color)',
                        background: 'var(--card-background)',
                        color: 'var(--text-color)',
                        borderRadius: '8px',
                        fontSize: '0.875rem',
                        resize: 'vertical'
                      }}
                      placeholder="Beskriv identifisert rotårsak..."
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-color)', marginBottom: '0.5rem' }}>
                      Korrigerende tiltak
                    </label>
                    <textarea
                      value={newDeviation.correctiveActions}
                      onChange={(e) => setNewDeviation({ ...newDeviation, correctiveActions: e.target.value })}
                      rows={3}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid var(--border-color)',
                        background: 'var(--card-background)',
                        color: 'var(--text-color)',
                        borderRadius: '8px',
                        fontSize: '0.875rem',
                        resize: 'vertical'
                      }}
                      placeholder="Beskriv korrigerende tiltak som er eller skal tas..."
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-color)', marginBottom: '0.5rem' }}>
                      Forebyggende tiltak
                    </label>
                    <textarea
                      value={newDeviation.preventiveActions}
                      onChange={(e) => setNewDeviation({ ...newDeviation, preventiveActions: e.target.value })}
                      rows={3}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid var(--border-color)',
                        background: 'var(--card-background)',
                        color: 'var(--text-color)',
                        borderRadius: '8px',
                        fontSize: '0.875rem',
                        resize: 'vertical'
                      }}
                      placeholder="Beskriv forebyggende tiltak for å unngå gjentakelse..."
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-color)', marginBottom: '0.5rem' }}>
                      Risikovurdering
                    </label>
                    <textarea
                      value={newDeviation.riskAssessment}
                      onChange={(e) => setNewDeviation({ ...newDeviation, riskAssessment: e.target.value })}
                      rows={2}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid var(--border-color)',
                        background: 'var(--card-background)',
                        color: 'var(--text-color)',
                        borderRadius: '8px',
                        fontSize: '0.875rem',
                        resize: 'vertical'
                      }}
                      placeholder="Risikovurdering..."
                    />
                  </div>

                  {(userProfile?.role === 'admin' || userProfile?.role === 'department_leader') && (
                    <ResponsiblePersonMultiSelect
                      selectedIds={newDeviation.assignedToIds}
                      onChange={(ids) => {
                        setNewDeviation({
                          ...newDeviation,
                          assignedToIds: ids
                        });
                      }}
                      employees={employees}
                      label="Tildel til ansatte"
                    />
                  )}

                  <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                    <button
                      onClick={async () => {
                        await handleUpdateDeviation();
                        // Send email notification to reporter
                        if (selectedDeviation.reportedBy && employees.find(e => e.id === selectedDeviation.reportedBy)) {
                          const reporter = employees.find(e => e.id === selectedDeviation.reportedBy);
                          if (reporter?.email) {
                            try {
                              const { GlobalEmailService } = await import('@/lib/global-email-service');
                              const emailService = GlobalEmailService.getInstance();
                              await emailService.sendEmail({
                                to: reporter.email,
                                subject: `Avvik behandlet: ${selectedDeviation.title}`,
                                html: `
                                  <h2>Avvik behandlet</h2>
                                  <p>Hei ${reporter.displayName || reporter.name},</p>
                                  <p>Avviket "${selectedDeviation.title}" har blitt behandlet av ${userProfile?.displayName || userProfile?.name || userProfile?.email || 'en bruker'}.</p>
                                  ${newDeviation.immediateActions ? `<h3>Umiddelbare tiltak:</h3><p>${newDeviation.immediateActions.replace(/\n/g, '<br>')}</p>` : ''}
                                  ${newDeviation.rootCause ? `<h3>Rotårsak:</h3><p>${newDeviation.rootCause.replace(/\n/g, '<br>')}</p>` : ''}
                                  ${newDeviation.correctiveActions ? `<h3>Korrigerende tiltak:</h3><p>${newDeviation.correctiveActions.replace(/\n/g, '<br>')}</p>` : ''}
                                  ${newDeviation.preventiveActions ? `<h3>Forebyggende tiltak:</h3><p>${newDeviation.preventiveActions.replace(/\n/g, '<br>')}</p>` : ''}
                                  <p><strong>Status:</strong> ${newDeviation.status === 'reported' ? 'Rapportert' : newDeviation.status === 'investigating' ? 'Undersøkes' : newDeviation.status === 'in_progress' ? 'Pågår' : newDeviation.status === 'resolved' ? 'Løst' : 'Lukket'}</p>
                                  <p>Med vennlig hilsen,<br>DriftPro System</p>
                                `
                              });
                            } catch (error) {
                              console.error('Error sending email:', error);
                            }
                          }
                        }
                        setShowEditDeviationModal(false);
                      }}
                      style={{
                        flex: 1,
                        background: 'var(--primary)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        padding: '0.75rem',
                        fontSize: '0.875rem',
                        fontWeight: '600',
                        cursor: 'pointer'
                      }}
                    >
                      Lagre behandling
                    </button>
                    <button
                      onClick={() => {
                        setShowEditDeviationModal(false);
                        setNewDeviation({
                          title: selectedDeviation.title || '',
                          description: selectedDeviation.description || '',
                          type: selectedDeviation.type || 'safety',
                          severity: selectedDeviation.severity || 'medium',
                          status: selectedDeviation.status || 'reported',
                          departmentId: selectedDeviation.departmentId || '',
                          location: selectedDeviation.location || '',
                          equipment: selectedDeviation.equipment || '',
                          cost: selectedDeviation.cost || 0,
                          riskAssessment: selectedDeviation.riskAssessment || '',
                          immediateActions: selectedDeviation.immediateActions || '',
                          rootCause: selectedDeviation.rootCause || '',
                          correctiveActions: selectedDeviation.correctiveActions || '',
                          preventiveActions: selectedDeviation.preventiveActions || '',
                          attachments: selectedDeviation.attachments || [],
                          witnesses: selectedDeviation.witnesses || [],
                          investigationRequired: selectedDeviation.investigationRequired || false,
                          regulatoryReport: selectedDeviation.regulatoryReport || false,
                          assignedToIds: (selectedDeviation as any).assignedToIds || (selectedDeviation.assignedTo ? [selectedDeviation.assignedTo] : [])
                        });
                      }}
                      style={{
                        flex: 1,
                        background: 'var(--gray-100)',
                        color: 'var(--text-color)',
                        border: 'none',
                        borderRadius: '8px',
                        padding: '0.75rem',
                        fontSize: '0.875rem',
                        fontWeight: '600',
                        cursor: 'pointer'
                      }}
                    >
                      Avbryt
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Edit Deviation Modal - Separate modal if needed */}
      {showEditDeviationModal && !showDeviationDetailModal && selectedDeviation && (
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
          {/* Same content as edit mode in detail modal */}
        </div>
      )}

      {/* Risk Assessment Modal - Comprehensive Form */}
      {showAddRiskModal && (
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
            background: 'var(--card-background)',
            borderRadius: '12px',
            width: '100%',
            maxWidth: '1400px',
            maxHeight: '95vh',
            overflow: 'auto',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
            display: 'flex',
            flexDirection: 'column'
          }}>
            {/* Header */}
            <div style={{
              padding: '1.5rem',
              borderBottom: '1px solid var(--border-color)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: 'var(--card-background)',
              position: 'sticky',
              top: 0,
              zIndex: 10
            }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: 'var(--text-color)', margin: 0 }}>
                  Ny Risikovurdering
                </h3>
                <p style={{ fontSize: '0.875rem', color: 'var(--gray-500)', margin: '0.25rem 0 0 0' }}>
                  Alle saker får automatisk egen unik ID
                </p>
              </div>
              <button
                onClick={() => {
                  setShowAddRiskModal(false);
                  setSelectedFiles(prev => ({ ...prev, 'risk-add': [] }));
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '1.5rem',
                  color: 'var(--gray-500)',
                  cursor: 'pointer',
                  padding: '0.25rem'
                }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Main Content - Two Column Layout */}
            <div style={{ padding: '1.5rem', display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem', flex: 1 }}>
              {/* Left Column - KARTLEGGING AV HENDELSE */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <h4 style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--text-color)', marginBottom: '0.5rem', borderBottom: '2px solid var(--primary)', paddingBottom: '0.5rem' }}>
                  KARTLEGGING AV HENDELSE
                </h4>

                {/* Tittel (Title) - Auto-filled from "Hva kan skje?" if not set */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-color)', marginBottom: '0.5rem' }}>
                    Tittel (automatisk fylt fra "Hva kan skje?" hvis tom)
                  </label>
                  <input
                    type="text"
                    value={newRiskAssessment.title}
                    onChange={(e) => setNewRiskAssessment({ ...newRiskAssessment, title: e.target.value })}
                    onBlur={(e) => {
                      // Auto-fill from "Hva kan skje?" if title is empty
                      if (!e.target.value && newRiskAssessment.whatCanHappen) {
                        setNewRiskAssessment({ ...newRiskAssessment, title: newRiskAssessment.whatCanHappen });
                      }
                    }}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid var(--border-color)',
                      background: 'var(--card-background)',
                      color: 'var(--text-color)',
                      borderRadius: '8px',
                      fontSize: '0.875rem'
                    }}
                    placeholder="Tittel (fylles automatisk fra 'Hva kan skje?' hvis tom)"
                  />
                </div>

                {/* Risikovurdering (Risk Assessment Category) */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-color)', marginBottom: '0.5rem' }}>
                    Risikovurdering <span style={{ color: 'var(--danger)' }}>*</span>
                  </label>
                  <select
                    value={newRiskAssessment.departmentId}
                    onChange={(e) => setNewRiskAssessment({ ...newRiskAssessment, departmentId: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid var(--border-color)',
                      background: 'var(--card-background)',
                      color: 'var(--text-color)',
                      borderRadius: '8px',
                      fontSize: '0.875rem'
                    }}
                  >
                    <option value="">Velg risikovurdering</option>
                    {departments.map(dept => (
                      <option key={dept.id} value={dept.id}>{dept.name}</option>
                    ))}
                  </select>
                </div>

                {/* Ansvarlig */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-color)', marginBottom: '0.5rem' }}>
                    Ansvarlig
                  </label>
                  <ResponsiblePersonMultiSelect
                    selectedIds={newRiskAssessment.responsiblePersonIds}
                    onChange={(ids) => {
                      const selectedEmployees = employees.filter(e => ids.includes(e.id));
                      setNewRiskAssessment({
                        ...newRiskAssessment,
                        responsiblePersonIds: ids,
                        responsiblePerson: selectedEmployees.map(e => e.displayName).join(', ')
                      });
                    }}
                    employees={employees}
                  />
                </div>

                {/* Kartlagt dato */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-color)', marginBottom: '0.5rem' }}>
                    Kartlagt dato
                  </label>
                  <input
                    type="date"
                    value={newRiskAssessment.mappedDate}
                    onChange={(e) => setNewRiskAssessment({ ...newRiskAssessment, mappedDate: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid var(--border-color)',
                      background: 'var(--card-background)',
                      color: 'var(--text-color)',
                      borderRadius: '8px',
                      fontSize: '0.875rem'
                    }}
                  />
                </div>

                {/* Hva kan skje? */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-color)', marginBottom: '0.5rem' }}>
                    Hva kan skje?
                  </label>
                  <textarea
                    value={newRiskAssessment.whatCanHappen}
                    onChange={(e) => setNewRiskAssessment({ ...newRiskAssessment, whatCanHappen: e.target.value })}
                    rows={4}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid var(--border-color)',
                      background: 'var(--card-background)',
                      color: 'var(--text-color)',
                      borderRadius: '8px',
                      fontSize: '0.875rem',
                      resize: 'vertical'
                    }}
                    placeholder="Beskriv hva som kan skje..."
                  />
                </div>

                {/* Beskrivelse av hendelsen og konsekvens */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-color)', marginBottom: '0.5rem' }}>
                    Beskrivelse av hendelsen og konsekvens
                  </label>
                  <textarea
                    value={newRiskAssessment.eventDescriptionAndConsequence}
                    onChange={(e) => setNewRiskAssessment({ ...newRiskAssessment, eventDescriptionAndConsequence: e.target.value })}
                    rows={5}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid var(--border-color)',
                      background: 'var(--card-background)',
                      color: 'var(--text-color)',
                      borderRadius: '8px',
                      fontSize: '0.875rem',
                      resize: 'vertical'
                    }}
                    placeholder="Beskriv hendelsen og konsekvensene..."
                  />
                </div>

                {/* Beskrivelse av årsaken til hendelsen */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-color)', marginBottom: '0.5rem' }}>
                    Beskrivelse av årsaken til hendelsen
                  </label>
                  <textarea
                    value={newRiskAssessment.eventCauseDescription}
                    onChange={(e) => setNewRiskAssessment({ ...newRiskAssessment, eventCauseDescription: e.target.value })}
                    rows={4}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid var(--border-color)',
                      background: 'var(--card-background)',
                      color: 'var(--text-color)',
                      borderRadius: '8px',
                      fontSize: '0.875rem',
                      resize: 'vertical'
                    }}
                    placeholder="Beskriv årsaken til hendelsen..."
                  />
                </div>

                {/* Eksisterende tiltak for å redusere sannsynligheten */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-color)', marginBottom: '0.5rem' }}>
                    Eksisterende tiltak for å redusere sannsynligheten for at hendelsen oppstår
                  </label>
                  <textarea
                    value={newRiskAssessment.existingControlsProbability}
                    onChange={(e) => setNewRiskAssessment({ ...newRiskAssessment, existingControlsProbability: e.target.value })}
                    rows={4}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid var(--border-color)',
                      background: 'var(--card-background)',
                      color: 'var(--text-color)',
                      borderRadius: '8px',
                      fontSize: '0.875rem',
                      resize: 'vertical'
                    }}
                    placeholder="Beskriv eksisterende tiltak..."
                  />
                </div>

                {/* Eksisterende tiltak for å redusere konsekvensen */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-color)', marginBottom: '0.5rem' }}>
                    Eksisterende tiltak for å redusere konsekvensen av hendelsen
                  </label>
                  <textarea
                    value={newRiskAssessment.existingControlsConsequence}
                    onChange={(e) => setNewRiskAssessment({ ...newRiskAssessment, existingControlsConsequence: e.target.value })}
                    rows={4}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid var(--border-color)',
                      background: 'var(--card-background)',
                      color: 'var(--text-color)',
                      borderRadius: '8px',
                      fontSize: '0.875rem',
                      resize: 'vertical'
                    }}
                    placeholder="Beskriv eksisterende tiltak..."
                  />
                </div>

                {/* Forslag til ytterligere tiltak */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-color)', marginBottom: '0.5rem' }}>
                    Forslag til ytterligere tiltak (Følges eventuelt opp som Oppgave)
                  </label>
                  <div style={{ position: 'relative' }}>
                    <textarea
                      value={newRiskAssessment.additionalControls}
                      onChange={(e) => setNewRiskAssessment({ ...newRiskAssessment, additionalControls: e.target.value })}
                      rows={5}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        paddingBottom: '3rem',
                        border: '1px solid var(--border-color)',
                        background: 'var(--card-background)',
                        color: 'var(--text-color)',
                        borderRadius: '8px',
                        fontSize: '0.875rem',
                        resize: 'vertical'
                      }}
                      placeholder="Beskriv forslag til ytterligere tiltak..."
                    />
                    <div style={{
                      position: 'absolute',
                      bottom: '0.5rem',
                      right: '0.5rem',
                      fontSize: '0.75rem',
                      color: 'var(--gray-500)'
                    }}>
                      (Tidsstempel / Signatur)
                    </div>
                  </div>
                </div>

                {/* File Upload Section */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-color)', marginBottom: '0.5rem' }}>
                    Vedlegg (Bilder, Video, Dokumenter)
                  </label>
                  <input
                    type="file"
                    multiple
                    accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.csv"
                    onChange={(e) => {
                      const files = Array.from(e.target.files || []);
                      setSelectedFiles(prev => ({
                        ...prev,
                        'risk-add': files
                      }));
                    }}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid var(--border-color)',
                      background: 'var(--card-background)',
                      color: 'var(--text-color)',
                      borderRadius: '8px',
                      fontSize: '0.875rem',
                      cursor: 'pointer'
                    }}
                  />
                  {selectedFiles['risk-add'] && selectedFiles['risk-add'].length > 0 && (
                    <div style={{ marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {selectedFiles['risk-add'].map((file, index) => (
                        <div key={index} style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '0.5rem',
                          background: 'var(--gray-50)',
                          borderRadius: '6px',
                          fontSize: '0.875rem'
                        }}>
                          <span style={{ color: 'var(--text-color)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                          </span>
                          <button
                            onClick={() => {
                              setSelectedFiles(prev => ({
                                ...prev,
                                'risk-add': prev['risk-add']?.filter((_, i) => i !== index) || []
                              }));
                            }}
                            style={{
                              padding: '0.25rem 0.5rem',
                              background: 'var(--danger)',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '0.75rem',
                              marginLeft: '0.5rem'
                            }}
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column - VALG */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <h4 style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--text-color)', marginBottom: '0.5rem', borderBottom: '2px solid var(--primary)', paddingBottom: '0.5rem' }}>
                  VALG
                </h4>

                {/* Område */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-color)', marginBottom: '0.5rem' }}>
                    Område
                  </label>
                  <select
                    value={newRiskAssessment.area}
                    onChange={(e) => setNewRiskAssessment({ ...newRiskAssessment, area: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid var(--border-color)',
                      background: 'var(--card-background)',
                      color: 'var(--text-color)',
                      borderRadius: '8px',
                      fontSize: '0.875rem'
                    }}
                  >
                    <option value="">Velg område</option>
                    <option value="1.1 Ledelsesprosesser">1.1 Ledelsesprosesser</option>
                    <option value="1.1.7 Beredskap og innsats">1.1.7 Beredskap og innsats</option>
                  </select>
                </div>

                {/* Fare */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-color)', marginBottom: '0.5rem' }}>
                    Fare
                  </label>
                  <input
                    type="text"
                    value={newRiskAssessment.hazard}
                    onChange={(e) => setNewRiskAssessment({ ...newRiskAssessment, hazard: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid var(--border-color)',
                      background: 'var(--card-background)',
                      color: 'var(--text-color)',
                      borderRadius: '8px',
                      fontSize: '0.875rem'
                    }}
                    placeholder="Beskriv faren"
                  />
                </div>

                {/* Årsak */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-color)', marginBottom: '0.5rem' }}>
                    Årsak
                  </label>
                  <input
                    type="text"
                    value={newRiskAssessment.cause}
                    onChange={(e) => setNewRiskAssessment({ ...newRiskAssessment, cause: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid var(--border-color)',
                      background: 'var(--card-background)',
                      color: 'var(--text-color)',
                      borderRadius: '8px',
                      fontSize: '0.875rem'
                    }}
                    placeholder="Beskriv årsaken"
                  />
                </div>

                {/* Lokasjon */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-color)', marginBottom: '0.5rem' }}>
                    Lokasjon
                  </label>
                  <input
                    type="text"
                    value={newRiskAssessment.location}
                    onChange={(e) => setNewRiskAssessment({ ...newRiskAssessment, location: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid var(--border-color)',
                      background: 'var(--card-background)',
                      color: 'var(--text-color)',
                      borderRadius: '8px',
                      fontSize: '0.875rem'
                    }}
                    placeholder="F.eks. MAVI Logistikk AS"
                  />
                </div>

                {/* Prosesser */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-color)', marginBottom: '0.5rem' }}>
                    Prosesser
                  </label>
                  <input
                    type="text"
                    value={newRiskAssessment.processes}
                    onChange={(e) => setNewRiskAssessment({ ...newRiskAssessment, processes: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid var(--border-color)',
                      background: 'var(--card-background)',
                      color: 'var(--text-color)',
                      borderRadius: '8px',
                      fontSize: '0.875rem'
                    }}
                    placeholder="Beskriv prosesser"
                  />
                </div>

                {/* Referanse 2, 3, 4 */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-color)', marginBottom: '0.5rem' }}>
                    Referanse 2
                  </label>
                  <input
                    type="text"
                    value={newRiskAssessment.reference2}
                    onChange={(e) => setNewRiskAssessment({ ...newRiskAssessment, reference2: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid var(--border-color)',
                      background: 'var(--card-background)',
                      color: 'var(--text-color)',
                      borderRadius: '8px',
                      fontSize: '0.875rem'
                    }}
                    placeholder="Referanse 2"
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-color)', marginBottom: '0.5rem' }}>
                    Referanse 3
                  </label>
                  <input
                    type="text"
                    value={newRiskAssessment.reference3}
                    onChange={(e) => setNewRiskAssessment({ ...newRiskAssessment, reference3: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid var(--border-color)',
                      background: 'var(--card-background)',
                      color: 'var(--text-color)',
                      borderRadius: '8px',
                      fontSize: '0.875rem'
                    }}
                    placeholder="Referanse 3"
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-color)', marginBottom: '0.5rem' }}>
                    Referanse 4
                  </label>
                  <input
                    type="text"
                    value={newRiskAssessment.reference4}
                    onChange={(e) => setNewRiskAssessment({ ...newRiskAssessment, reference4: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid var(--border-color)',
                      background: 'var(--card-background)',
                      color: 'var(--text-color)',
                      borderRadius: '8px',
                      fontSize: '0.875rem'
                    }}
                    placeholder="Referanse 4"
                  />
                </div>

                {/* NOTATER */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-color)', marginBottom: '0.5rem' }}>
                    NOTATER
                  </label>
                  <div style={{ position: 'relative' }}>
                    <textarea
                      value={newRiskAssessment.notes}
                      onChange={(e) => setNewRiskAssessment({ ...newRiskAssessment, notes: e.target.value })}
                      rows={6}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        paddingBottom: '3rem',
                        border: '1px solid var(--border-color)',
                        background: 'var(--card-background)',
                        color: 'var(--text-color)',
                        borderRadius: '8px',
                        fontSize: '0.875rem',
                        resize: 'vertical'
                      }}
                      placeholder="Notater..."
                    />
                    <div style={{
                      position: 'absolute',
                      bottom: '0.5rem',
                      right: '0.5rem',
                      fontSize: '0.75rem',
                      color: 'var(--gray-500)'
                    }}>
                      (Tidsstempel / Signatur)
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* SANNSYNLIGHET og RISIKO Section */}
            <div style={{ padding: '1.5rem', borderTop: '1px solid var(--border-color)', background: 'var(--gray-50)' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem' }}>
                {/* SANNSYNLIGHET */}
                <div>
                  <h4 style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--text-color)', marginBottom: '1rem', textTransform: 'uppercase' }}>
                    SANNSYNLIGHET
                  </h4>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-color)', marginBottom: '0.5rem' }}>
                      Sannsynlighet
                    </label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <input
                        type="checkbox"
                        checked={newRiskAssessment.probability !== '0'}
                        onChange={(e) => {
                          if (!e.target.checked) {
                            setNewRiskAssessment({ ...newRiskAssessment, probability: '0', probabilityValue: 0, probabilityLabel: 'Skjer aldri' });
                          }
                        }}
                        style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                      />
                      <select
                        value={newRiskAssessment.probability}
                        onChange={(e) => {
                          const value = e.target.value;
                          const labels: { [key: string]: string } = {
                            '0': 'Skjer aldri',
                            '1': 'Lite sannsynlig',
                            '2': 'Sannsynlig',
                            '3': 'Meget sannsynlig',
                            '4': 'Nesten sikkert'
                          };
                          setNewRiskAssessment({
                            ...newRiskAssessment,
                            probability: value,
                            probabilityValue: parseInt(value),
                            probabilityLabel: labels[value] || ''
                          });
                        }}
                        style={{
                          flex: 1,
                          padding: '0.75rem',
                          border: '1px solid var(--border-color)',
                          background: 'var(--card-background)',
                          color: 'var(--text-color)',
                          borderRadius: '8px',
                          fontSize: '0.875rem'
                        }}
                      >
                        <option value="0">0 Skjer aldri</option>
                        <option value="1">1 Lite sannsynlig</option>
                        <option value="2">2 Sannsynlig</option>
                        <option value="3">3 Meget sannsynlig</option>
                        <option value="4">4 Nesten sikkert</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* RISIKO */}
                <div>
                  <h4 style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--text-color)', marginBottom: '1rem', textTransform: 'uppercase' }}>
                    RISIKO
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {/* Risk Categories */}
                    {[
                      { key: 'riskPerson', label: 'Person (Safety)', state: newRiskAssessment.riskPerson, setState: (val: any) => setNewRiskAssessment({ ...newRiskAssessment, riskPerson: val }) },
                      { key: 'riskEconomy', label: 'Økonomi', state: newRiskAssessment.riskEconomy, setState: (val: any) => setNewRiskAssessment({ ...newRiskAssessment, riskEconomy: val }) },
                      { key: 'riskEnvironment', label: 'Ytre Miljø', state: newRiskAssessment.riskEnvironment, setState: (val: any) => setNewRiskAssessment({ ...newRiskAssessment, riskEnvironment: val }) },
                      { key: 'riskReputation', label: 'Omdømme', state: newRiskAssessment.riskReputation, setState: (val: any) => setNewRiskAssessment({ ...newRiskAssessment, riskReputation: val }) },
                      { key: 'riskDelivery', label: 'Leveringsevne', state: newRiskAssessment.riskDelivery, setState: (val: any) => setNewRiskAssessment({ ...newRiskAssessment, riskDelivery: val }) },
                      { key: 'riskSecurity', label: 'Sikkerhet (Security)', state: newRiskAssessment.riskSecurity, setState: (val: any) => setNewRiskAssessment({ ...newRiskAssessment, riskSecurity: val }) }
                    ].map(({ key, label, state, setState }) => {
                      const riskState = state || { enabled: false, value: '0', level: 0 };
                      const getStatusText = (level: number) => {
                        if (level === 0) return 'Ingen risiko';
                        if (level <= 2) return 'Innenfor akseptgrense';
                        if (level <= 4) return 'Moderat risiko';
                        return 'Høy risiko';
                      };
                      const getStatusColor = (level: number) => {
                        // Light colors that work well in dark mode
                        if (level === 0) return 'rgba(16, 185, 129, 0.2)'; // Light green background
                        if (level <= 2) return 'rgba(59, 130, 246, 0.2)'; // Light blue background
                        if (level <= 4) return 'rgba(245, 158, 11, 0.2)'; // Light orange background
                        return 'rgba(239, 68, 68, 0.2)'; // Light red background
                      };
                      
                      const getTextColor = (level: number) => {
                        // Bright colors for text in dark mode
                        if (level === 0) return '#10b981'; // Bright green
                        if (level <= 2) return '#60a5fa'; // Bright blue
                        if (level <= 4) return '#fbbf24'; // Bright yellow
                        return '#f87171'; // Bright red
                      };
                      
                      return (
                        <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <input
                            type="checkbox"
                            checked={riskState.enabled}
                            onChange={(e) => setState({ ...riskState, enabled: e.target.checked, value: e.target.checked ? riskState.value : '0', level: e.target.checked ? riskState.level : 0 })}
                            style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                          />
                          <label style={{ minWidth: '150px', fontSize: '0.875rem', color: 'var(--text-color)' }}>
                            {label}
                          </label>
                          <select
                            value={riskState.value}
                            onChange={(e) => {
                              const val = e.target.value;
                              const level = parseInt(val);
                              setState({ ...riskState, enabled: true, value: val, level, status: getStatusText(level) });
                            }}
                            disabled={!riskState.enabled}
                            style={{
                              flex: 1,
                              padding: '0.5rem',
                              border: '1px solid var(--border-color)',
                              background: riskState.enabled ? 'var(--card-background)' : 'var(--gray-100)',
                              color: 'var(--text-color)',
                              borderRadius: '6px',
                              fontSize: '0.875rem',
                              cursor: riskState.enabled ? 'pointer' : 'not-allowed'
                            }}
                          >
                            <option value="0">0 Ikke aktuelt/Ufarlig</option>
                            <option value="1">1 Svært lav</option>
                            <option value="2">2 Lav</option>
                            <option value="3">3 Moderat</option>
                            <option value="4">4 Høy</option>
                            <option value="5">5 Svært høy</option>
                          </select>
                          <div style={{
                            minWidth: '40px',
                            height: '32px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: getStatusColor(riskState.level),
                            borderRadius: '6px',
                            fontSize: '0.875rem',
                            fontWeight: '700',
                            color: getTextColor(riskState.level),
                            border: `2px solid ${getTextColor(riskState.level)}`
                          }}>
                            {riskState.level}
                          </div>
                          <span style={{ 
                            minWidth: '150px', 
                            fontSize: '0.75rem', 
                            color: getTextColor(riskState.level),
                            fontWeight: '500'
                          }}>
                            {getStatusText(riskState.level)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Buttons */}
            <div style={{
              padding: '1.5rem',
              borderTop: '1px solid var(--border-color)',
              display: 'flex',
              gap: '1rem',
              justifyContent: 'flex-end',
              background: 'var(--card-background)',
              position: 'sticky',
              bottom: 0,
              zIndex: 10
            }}>
              <button
                onClick={() => {
                  setShowAddRiskModal(false);
                  setSelectedFiles(prev => ({ ...prev, 'risk-add': [] }));
                }}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: 'var(--gray-100)',
                  color: 'var(--text-color)',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Avbryt
              </button>
              <button
                onClick={handleAddRiskAssessment}
                disabled={uploadingFiles['risk-add']}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: uploadingFiles['risk-add'] ? 'var(--gray-400)' : 'var(--primary)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  cursor: uploadingFiles['risk-add'] ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                {uploadingFiles['risk-add'] ? (
                  <>
                    <div style={{
                      width: '16px',
                      height: '16px',
                      border: '2px solid white',
                      borderTopColor: 'transparent',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite'
                    }}></div>
                    Laster opp...
                  </>
                ) : (
                  userProfile?.role === 'employee' ? 'Send til leder' : 'Opprett risikovurdering'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Follow-up Action Modal */}
      {showAddFollowUpModal && (
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
            background: 'var(--card-background)',
            borderRadius: '12px',
            width: '100%',
            maxWidth: '600px',
            maxHeight: '90vh',
            overflow: 'auto',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
          }}>
            <div style={{
              padding: '1.5rem',
              borderBottom: '1px solid var(--border-color)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: 'var(--text-color)', margin: 0 }}>
                Nytt Oppfølgingstiltak
              </h3>
              <button
                onClick={() => setShowAddFollowUpModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '1.5rem',
                  color: 'var(--gray-500)',
                  cursor: 'pointer',
                  padding: '0.25rem'
                }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-color)', marginBottom: '0.5rem' }}>
                    Tittel *
                  </label>
                  <input
                    type="text"
                    value={newFollowUpAction.title}
                    onChange={(e) => setNewFollowUpAction({ ...newFollowUpAction, title: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid var(--border-color)',
                      background: 'var(--card-background)',
                      color: 'var(--text-color)',
                      borderRadius: '8px',
                      fontSize: '0.875rem'
                    }}
                    placeholder="Beskriv tiltaket"
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-color)', marginBottom: '0.5rem' }}>
                    Beskrivelse *
                  </label>
                  <textarea
                    value={newFollowUpAction.description}
                    onChange={(e) => setNewFollowUpAction({ ...newFollowUpAction, description: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid var(--border-color)',
                      background: 'var(--card-background)',
                      color: 'var(--text-color)',
                      borderRadius: '8px',
                      fontSize: '0.875rem',
                      minHeight: '100px',
                      resize: 'vertical'
                    }}
                    placeholder="Beskriv tiltaket i detalj"
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-color)', marginBottom: '0.5rem' }}>
                      Avdeling
                    </label>
                    <select
                      value={newFollowUpAction.departmentId}
                      onChange={(e) => setNewFollowUpAction({ ...newFollowUpAction, departmentId: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid var(--border-color)',
                        background: 'var(--card-background)',
                        color: 'var(--text-color)',
                        borderRadius: '8px',
                        fontSize: '0.875rem'
                      }}
                    >
                      <option value="">Velg avdeling</option>
                      {departments.map(dept => (
                        <option key={dept.id} value={dept.id}>{dept.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-color)', marginBottom: '0.5rem' }}>
                      Prioritet
                    </label>
                    <select
                      value={newFollowUpAction.priority}
                      onChange={(e) => setNewFollowUpAction({ ...newFollowUpAction, priority: e.target.value as 'Høy' | 'Middels' | 'Lav' })}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid var(--border-color)',
                        background: 'var(--card-background)',
                        color: 'var(--text-color)',
                        borderRadius: '8px',
                        fontSize: '0.875rem'
                      }}
                    >
                      <option value="Høy">Høy</option>
                      <option value="Middels">Middels</option>
                      <option value="Lav">Lav</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-color)', marginBottom: '0.5rem' }}>
                    Frist
                  </label>
                  <input
                    type="date"
                    value={newFollowUpAction.dueDate}
                    onChange={(e) => setNewFollowUpAction({ ...newFollowUpAction, dueDate: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid var(--border-color)',
                      background: 'var(--card-background)',
                      color: 'var(--text-color)',
                      borderRadius: '8px',
                      fontSize: '0.875rem'
                    }}
                  />
                </div>

                <ResponsiblePersonMultiSelect
                  selectedIds={newFollowUpAction.responsiblePersonIds}
                  onChange={(ids) => {
                    const selectedEmployees = employees.filter(e => ids.includes(e.id));
                    setNewFollowUpAction({
                      ...newFollowUpAction,
                      responsiblePersonIds: ids,
                      responsiblePersonId: ids[0] || '',
                      responsiblePerson: selectedEmployees.map(e => e.displayName).join(', ')
                    });
                  }}
                  employees={employees}
                />

                {(userProfile?.role === 'admin' || userProfile?.role === 'department_leader') && (
                  <div>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-color)', marginBottom: '0.5rem' }}>
                      Status
                    </label>
                    <select
                      value={newFollowUpAction.status}
                      onChange={(e) => setNewFollowUpAction({ ...newFollowUpAction, status: e.target.value as 'not_started' | 'in_progress' | 'completed' | 'overdue' })}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid var(--border-color)',
                        background: 'var(--card-background)',
                        color: 'var(--text-color)',
                        borderRadius: '8px',
                        fontSize: '0.875rem'
                      }}
                    >
                      <option value="not_started">Ikke startet</option>
                      <option value="in_progress">Pågår</option>
                      <option value="completed">Fullført</option>
                      <option value="overdue">Forfalt</option>
                    </select>
                  </div>
                )}

                {/* File Upload Section */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-color)', marginBottom: '0.5rem' }}>
                    Vedlegg (Bilder, Video, Dokumenter)
                  </label>
                  <input
                    type="file"
                    multiple
                    accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.csv"
                    onChange={(e) => {
                      const files = Array.from(e.target.files || []);
                      setSelectedFiles(prev => ({
                        ...prev,
                        'followup-add': files
                      }));
                    }}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid var(--border-color)',
                      background: 'var(--card-background)',
                      color: 'var(--text-color)',
                      borderRadius: '8px',
                      fontSize: '0.875rem',
                      cursor: 'pointer'
                    }}
                  />
                  {selectedFiles['followup-add'] && selectedFiles['followup-add'].length > 0 && (
                    <div style={{ marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {selectedFiles['followup-add'].map((file, index) => (
                        <div key={index} style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '0.5rem',
                          background: 'var(--gray-50)',
                          borderRadius: '6px',
                          fontSize: '0.875rem'
                        }}>
                          <span style={{ color: 'var(--text-color)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                          </span>
                          <button
                            onClick={() => {
                              setSelectedFiles(prev => ({
                                ...prev,
                                'followup-add': prev['followup-add']?.filter((_, i) => i !== index) || []
                              }));
                            }}
                            style={{
                              padding: '0.25rem 0.5rem',
                              background: 'var(--danger)',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '0.75rem',
                              marginLeft: '0.5rem'
                            }}
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  <p style={{ fontSize: '0.75rem', color: 'var(--gray-500)', marginTop: '0.25rem' }}>
                    Du kan laste opp bilder, video og dokumenter. Filene vil bli lastet opp etter at oppfølgingstiltaket er opprettet.
                  </p>
                </div>

                <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
                  <button
                    onClick={handleAddFollowUpAction}
                    disabled={uploadingFiles['followup-add']}
                    style={{
                      flex: 1,
                      background: uploadingFiles['followup-add'] ? 'var(--gray-400)' : 'var(--primary)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '0.75rem',
                      fontSize: '0.875rem',
                      fontWeight: '600',
                      cursor: uploadingFiles['followup-add'] ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem'
                    }}
                  >
                    {uploadingFiles['followup-add'] ? (
                      <>
                        <div style={{
                          width: '16px',
                          height: '16px',
                          border: '2px solid white',
                          borderTopColor: 'transparent',
                          borderRadius: '50%',
                          animation: 'spin 1s linear infinite'
                        }}></div>
                        Laster opp...
                      </>
                    ) : (
                      userProfile?.role === 'employee' ? 'Send til leder' : 'Opprett'
                    )}
                  </button>
                  <button
                    onClick={() => {
                      setShowAddFollowUpModal(false);
                      setSelectedFiles(prev => ({ ...prev, 'followup-add': [] }));
                    }}
                    style={{
                      flex: 1,
                      background: 'var(--gray-100)',
                      color: 'var(--text-color)',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '0.75rem',
                      fontSize: '0.875rem',
                      fontWeight: '600',
                      cursor: 'pointer'
                    }}
                  >
                    Avbryt
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Checkpoint Modal */}
      {showAddCheckpointModal && (
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
            background: 'var(--card-background)',
            borderRadius: '12px',
            width: '100%',
            maxWidth: '600px',
            maxHeight: '90vh',
            overflow: 'auto',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
          }}>
            <div style={{
              padding: '1.5rem',
              borderBottom: '1px solid var(--border-color)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: 'var(--text-color)', margin: 0 }}>
                Nytt Kontrollpunkt
              </h3>
              <button
                onClick={() => setShowAddCheckpointModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '1.5rem',
                  color: 'var(--gray-500)',
                  cursor: 'pointer',
                  padding: '0.25rem'
                }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-color)', marginBottom: '0.5rem' }}>
                    Tittel *
                  </label>
                  <input
                    type="text"
                    value={newCheckpoint.title}
                    onChange={(e) => setNewCheckpoint({ ...newCheckpoint, title: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid var(--border-color)',
                      background: 'var(--card-background)',
                      color: 'var(--text-color)',
                      borderRadius: '8px',
                      fontSize: '0.875rem'
                    }}
                    placeholder="Beskriv kontrollpunktet"
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-color)', marginBottom: '0.5rem' }}>
                    Beskrivelse *
                  </label>
                  <textarea
                    value={newCheckpoint.description}
                    onChange={(e) => setNewCheckpoint({ ...newCheckpoint, description: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid var(--border-color)',
                      background: 'var(--card-background)',
                      color: 'var(--text-color)',
                      borderRadius: '8px',
                      fontSize: '0.875rem',
                      minHeight: '100px',
                      resize: 'vertical'
                    }}
                    placeholder="Beskriv kontrollpunktet i detalj"
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-color)', marginBottom: '0.5rem' }}>
                      Kategori
                    </label>
                    <select
                      value={newCheckpoint.category}
                      onChange={(e) => setNewCheckpoint({ ...newCheckpoint, category: e.target.value as 'safety' | 'quality' | 'environmental' | 'process' | 'regulatory' })}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid var(--border-color)',
                        background: 'var(--card-background)',
                        color: 'var(--text-color)',
                        borderRadius: '8px',
                        fontSize: '0.875rem'
                      }}
                    >
                      <option value="safety">Sikkerhet</option>
                      <option value="quality">Kvalitet</option>
                      <option value="environmental">Miljø</option>
                      <option value="process">Prosess</option>
                      <option value="regulatory">Regulatorisk</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-color)', marginBottom: '0.5rem' }}>
                      Frekvens
                    </label>
                    <select
                      value={newCheckpoint.frequency}
                      onChange={(e) => setNewCheckpoint({ ...newCheckpoint, frequency: e.target.value as 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly' })}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid var(--border-color)',
                        background: 'var(--card-background)',
                        color: 'var(--text-color)',
                        borderRadius: '8px',
                        fontSize: '0.875rem'
                      }}
                    >
                      <option value="daily">Daglig</option>
                      <option value="weekly">Ukentlig</option>
                      <option value="monthly">Månedlig</option>
                      <option value="quarterly">Kvartalsvis</option>
                      <option value="yearly">Årlig</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-color)', marginBottom: '0.5rem' }}>
                    Avdeling
                  </label>
                  <select
                    value={newCheckpoint.departmentId}
                    onChange={(e) => setNewCheckpoint({ ...newCheckpoint, departmentId: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid var(--border-color)',
                      background: 'var(--card-background)',
                      color: 'var(--text-color)',
                      borderRadius: '8px',
                      fontSize: '0.875rem'
                    }}
                  >
                    <option value="">Velg avdeling</option>
                    {departments.map(dept => (
                      <option key={dept.id} value={dept.id}>{dept.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-color)', marginBottom: '0.5rem' }}>
                    Neste sjekk
                  </label>
                  <input
                    type="date"
                    value={newCheckpoint.nextCheck}
                    onChange={(e) => setNewCheckpoint({ ...newCheckpoint, nextCheck: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid var(--border-color)',
                      background: 'var(--card-background)',
                      color: 'var(--text-color)',
                      borderRadius: '8px',
                      fontSize: '0.875rem'
                    }}
                  />
                </div>

                {userProfile?.role === 'admin' && (
                  <div>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-color)', marginBottom: '0.5rem' }}>
                      Ansvarlig
                    </label>
                    <select
                      value={newCheckpoint.responsiblePersonId}
                      onChange={(e) => setNewCheckpoint({ ...newCheckpoint, responsiblePersonId: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid var(--border-color)',
                        background: 'var(--card-background)',
                        color: 'var(--text-color)',
                        borderRadius: '8px',
                        fontSize: '0.875rem'
                      }}
                    >
                      <option value="">Velg ansvarlig</option>
                      {employees.map(emp => (
                        <option key={emp.id} value={emp.id}>{emp.displayName}</option>
                      ))}
                    </select>
                  </div>
                )}

                {(userProfile?.role === 'admin' || userProfile?.role === 'department_leader') && (
                  <div>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-color)', marginBottom: '0.5rem' }}>
                      Status
                    </label>
                    <select
                      value={newCheckpoint.status}
                      onChange={(e) => setNewCheckpoint({ ...newCheckpoint, status: e.target.value as 'pending' | 'completed' | 'failed' | 'overdue' })}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid var(--border-color)',
                        background: 'var(--card-background)',
                        color: 'var(--text-color)',
                        borderRadius: '8px',
                        fontSize: '0.875rem'
                      }}
                    >
                      <option value="pending">Venter</option>
                      <option value="completed">Fullført</option>
                      <option value="failed">Feilet</option>
                      <option value="overdue">Forfalt</option>
                    </select>
                  </div>
                )}

                {/* File Upload Section */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-color)', marginBottom: '0.5rem' }}>
                    Vedlegg (Bilder, Video, Dokumenter)
                  </label>
                  <input
                    type="file"
                    multiple
                    accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.csv"
                    onChange={(e) => {
                      const files = Array.from(e.target.files || []);
                      setSelectedFiles(prev => ({
                        ...prev,
                        'checkpoint-add': files
                      }));
                    }}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid var(--border-color)',
                      background: 'var(--card-background)',
                      color: 'var(--text-color)',
                      borderRadius: '8px',
                      fontSize: '0.875rem',
                      cursor: 'pointer'
                    }}
                  />
                  {selectedFiles['checkpoint-add'] && selectedFiles['checkpoint-add'].length > 0 && (
                    <div style={{ marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {selectedFiles['checkpoint-add'].map((file, index) => (
                        <div key={index} style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '0.5rem',
                          background: 'var(--gray-50)',
                          borderRadius: '6px',
                          fontSize: '0.875rem'
                        }}>
                          <span style={{ color: 'var(--text-color)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                          </span>
                          <button
                            onClick={() => {
                              setSelectedFiles(prev => ({
                                ...prev,
                                'checkpoint-add': prev['checkpoint-add']?.filter((_, i) => i !== index) || []
                              }));
                            }}
                            style={{
                              padding: '0.25rem 0.5rem',
                              background: 'var(--danger)',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '0.75rem',
                              marginLeft: '0.5rem'
                            }}
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  <p style={{ fontSize: '0.75rem', color: 'var(--gray-500)', marginTop: '0.25rem' }}>
                    Du kan laste opp bilder, video og dokumenter. Filene vil bli lastet opp etter at kontrollpunktet er opprettet.
                  </p>
                </div>

                <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
                  <button
                    onClick={handleAddCheckpoint}
                    disabled={uploadingFiles['checkpoint-add']}
                    style={{
                      flex: 1,
                      background: uploadingFiles['checkpoint-add'] ? 'var(--gray-400)' : 'var(--primary)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '0.75rem',
                      fontSize: '0.875rem',
                      fontWeight: '600',
                      cursor: uploadingFiles['checkpoint-add'] ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem'
                    }}
                  >
                    {uploadingFiles['checkpoint-add'] ? (
                      <>
                        <div style={{
                          width: '16px',
                          height: '16px',
                          border: '2px solid white',
                          borderTopColor: 'transparent',
                          borderRadius: '50%',
                          animation: 'spin 1s linear infinite'
                        }}></div>
                        Laster opp...
                      </>
                    ) : (
                      userProfile?.role === 'employee' ? 'Send til leder' : 'Opprett'
                    )}
                  </button>
                  <button
                    onClick={() => {
                      setShowAddCheckpointModal(false);
                      setSelectedFiles(prev => ({ ...prev, 'checkpoint-add': [] }));
                    }}
                    style={{
                      flex: 1,
                      background: 'var(--gray-100)',
                      color: 'var(--text-color)',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '0.75rem',
                      fontSize: '0.875rem',
                      fontWeight: '600',
                      cursor: 'pointer'
                    }}
                  >
                    Avbryt
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Risk Assessment Modal */}
      {showEditRiskModal && selectedRisk && (
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
            background: 'var(--card-background)',
            borderRadius: '12px',
            width: '100%',
            maxWidth: '800px',
            maxHeight: '90vh',
            overflowY: 'auto',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
          }}>
            <div style={{
              padding: '1.5rem',
              borderBottom: '1px solid var(--border-color)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: 'var(--text-color)', margin: 0 }}>
                Behandle risikovurdering
              </h3>
              <button
                onClick={() => {
                  setShowEditRiskModal(false);
                  setSelectedRisk(null);
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '1.5rem',
                  color: 'var(--gray-500)',
                  cursor: 'pointer',
                  padding: '0.25rem'
                }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-color)', marginBottom: '0.5rem' }}>
                    Tittel *
                  </label>
                  <input
                    type="text"
                    value={newRiskAssessment.title}
                    onChange={(e) => setNewRiskAssessment({ ...newRiskAssessment, title: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid var(--border-color)',
                      background: 'var(--card-background)',
                      color: 'var(--text-color)',
                      borderRadius: '8px',
                      fontSize: '0.875rem'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-color)', marginBottom: '0.5rem' }}>
                    Beskrivelse *
                  </label>
                  <textarea
                    value={newRiskAssessment.description}
                    onChange={(e) => setNewRiskAssessment({ ...newRiskAssessment, description: e.target.value })}
                    rows={4}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid var(--border-color)',
                      background: 'var(--card-background)',
                      color: 'var(--text-color)',
                      borderRadius: '8px',
                      fontSize: '0.875rem',
                      resize: 'vertical'
                    }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-color)', marginBottom: '0.5rem' }}>
                      Status
                    </label>
                    <select
                      value={newRiskAssessment.status}
                      onChange={(e) => setNewRiskAssessment({ ...newRiskAssessment, status: e.target.value as 'draft' | 'pending_approval' | 'approved' | 'rejected' })}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid var(--border-color)',
                        background: 'var(--card-background)',
                        color: 'var(--text-color)',
                        borderRadius: '8px',
                        fontSize: '0.875rem'
                      }}
                    >
                      <option value="draft">Utkast</option>
                      <option value="pending_approval">Venter godkjenning</option>
                      <option value="approved">Godkjent</option>
                      <option value="rejected">Avvist</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-color)', marginBottom: '0.5rem' }}>
                      Risikonivå
                    </label>
                    <select
                      value={newRiskAssessment.riskLevel}
                      onChange={(e) => setNewRiskAssessment({ ...newRiskAssessment, riskLevel: e.target.value as 'low' | 'medium' | 'high' | 'critical' })}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid var(--border-color)',
                        background: 'var(--card-background)',
                        color: 'var(--text-color)',
                        borderRadius: '8px',
                        fontSize: '0.875rem'
                      }}
                    >
                      <option value="low">Lav</option>
                      <option value="medium">Middels</option>
                      <option value="high">Høy</option>
                      <option value="critical">Kritisk</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-color)', marginBottom: '0.5rem' }}>
                    Aktivitet
                  </label>
                  <input
                    type="text"
                    value={newRiskAssessment.activity}
                    onChange={(e) => setNewRiskAssessment({ ...newRiskAssessment, activity: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid var(--border-color)',
                      background: 'var(--card-background)',
                      color: 'var(--text-color)',
                      borderRadius: '8px',
                      fontSize: '0.875rem'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-color)', marginBottom: '0.5rem' }}>
                    Fare
                  </label>
                  <input
                    type="text"
                    value={newRiskAssessment.hazard}
                    onChange={(e) => setNewRiskAssessment({ ...newRiskAssessment, hazard: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid var(--border-color)',
                      background: 'var(--card-background)',
                      color: 'var(--text-color)',
                      borderRadius: '8px',
                      fontSize: '0.875rem'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-color)', marginBottom: '0.5rem' }}>
                    Eksisterende tiltak
                  </label>
                  <textarea
                    value={newRiskAssessment.existingControls}
                    onChange={(e) => setNewRiskAssessment({ ...newRiskAssessment, existingControls: e.target.value })}
                    rows={3}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid var(--border-color)',
                      background: 'var(--card-background)',
                      color: 'var(--text-color)',
                      borderRadius: '8px',
                      fontSize: '0.875rem',
                      resize: 'vertical'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-color)', marginBottom: '0.5rem' }}>
                    Tilleggstiltak
                  </label>
                  <textarea
                    value={newRiskAssessment.additionalControls}
                    onChange={(e) => setNewRiskAssessment({ ...newRiskAssessment, additionalControls: e.target.value })}
                    rows={3}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid var(--border-color)',
                      background: 'var(--card-background)',
                      color: 'var(--text-color)',
                      borderRadius: '8px',
                      fontSize: '0.875rem',
                      resize: 'vertical'
                    }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-color)', marginBottom: '0.5rem' }}>
                      Avdeling
                    </label>
                    <select
                      value={newRiskAssessment.departmentId}
                      onChange={(e) => setNewRiskAssessment({ ...newRiskAssessment, departmentId: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid var(--border-color)',
                        background: 'var(--card-background)',
                        color: 'var(--text-color)',
                        borderRadius: '8px',
                        fontSize: '0.875rem'
                      }}
                    >
                      <option value="">Velg avdeling</option>
                      {departments.map(dept => (
                        <option key={dept.id} value={dept.id}>{dept.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-color)', marginBottom: '0.5rem' }}>
                      Gjennomgangsdato
                    </label>
                    <input
                      type="date"
                      value={newRiskAssessment.reviewDate}
                      onChange={(e) => setNewRiskAssessment({ ...newRiskAssessment, reviewDate: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid var(--border-color)',
                        background: 'var(--card-background)',
                        color: 'var(--text-color)',
                        borderRadius: '8px',
                        fontSize: '0.875rem'
                      }}
                    />
                  </div>
                </div>

                <ResponsiblePersonMultiSelect
                  selectedIds={newRiskAssessment.responsiblePersonIds}
                  onChange={(ids) => {
                    const selectedEmployees = employees.filter(e => ids.includes(e.id));
                    setNewRiskAssessment({
                      ...newRiskAssessment,
                      responsiblePersonIds: ids,
                      responsiblePerson: selectedEmployees.map(e => e.displayName).join(', ')
                    });
                  }}
                  employees={employees}
                />

                <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                  <button
                    onClick={handleUpdateRiskAssessment}
                    style={{
                      flex: 1,
                      background: 'var(--primary)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '0.75rem',
                      fontSize: '0.875rem',
                      fontWeight: '600',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem'
                    }}
                  >
                    <Save size={16} />
                    Lagre endringer
                  </button>
                  <button
                    onClick={() => {
                      setShowEditRiskModal(false);
                      setSelectedRisk(null);
                    }}
                    style={{
                      flex: 1,
                      background: 'var(--gray-100)',
                      color: 'var(--text-color)',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '0.75rem',
                      fontSize: '0.875rem',
                      fontWeight: '600',
                      cursor: 'pointer'
                    }}
                  >
                    Avbryt
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Follow-up Action Modal */}
      {showEditFollowUpModal && selectedFollowUp && (
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
            background: 'var(--card-background)',
            borderRadius: '12px',
            width: '100%',
            maxWidth: '800px',
            maxHeight: '90vh',
            overflowY: 'auto',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
          }}>
            <div style={{
              padding: '1.5rem',
              borderBottom: '1px solid var(--border-color)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: 'var(--text-color)', margin: 0 }}>
                Behandle oppfølgingstiltak
              </h3>
              <button
                onClick={() => {
                  setShowEditFollowUpModal(false);
                  setSelectedFollowUp(null);
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '1.5rem',
                  color: 'var(--gray-500)',
                  cursor: 'pointer',
                  padding: '0.25rem'
                }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-color)', marginBottom: '0.5rem' }}>
                    Tittel *
                  </label>
                  <input
                    type="text"
                    value={newFollowUpAction.title}
                    onChange={(e) => setNewFollowUpAction({ ...newFollowUpAction, title: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid var(--border-color)',
                      background: 'var(--card-background)',
                      color: 'var(--text-color)',
                      borderRadius: '8px',
                      fontSize: '0.875rem'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-color)', marginBottom: '0.5rem' }}>
                    Beskrivelse *
                  </label>
                  <textarea
                    value={newFollowUpAction.description}
                    onChange={(e) => setNewFollowUpAction({ ...newFollowUpAction, description: e.target.value })}
                    rows={4}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid var(--border-color)',
                      background: 'var(--card-background)',
                      color: 'var(--text-color)',
                      borderRadius: '8px',
                      fontSize: '0.875rem',
                      resize: 'vertical'
                    }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-color)', marginBottom: '0.5rem' }}>
                      Status
                    </label>
                    <select
                      value={newFollowUpAction.status}
                      onChange={(e) => setNewFollowUpAction({ ...newFollowUpAction, status: e.target.value as 'not_started' | 'in_progress' | 'completed' | 'overdue' })}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid var(--border-color)',
                        background: 'var(--card-background)',
                        color: 'var(--text-color)',
                        borderRadius: '8px',
                        fontSize: '0.875rem'
                      }}
                    >
                      <option value="not_started">Ikke startet</option>
                      <option value="in_progress">Pågår</option>
                      <option value="completed">Fullført</option>
                      <option value="overdue">Forfalt</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-color)', marginBottom: '0.5rem' }}>
                      Prioritet
                    </label>
                    <select
                      value={newFollowUpAction.priority}
                      onChange={(e) => setNewFollowUpAction({ ...newFollowUpAction, priority: e.target.value as 'Høy' | 'Middels' | 'Lav' })}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid var(--border-color)',
                        background: 'var(--card-background)',
                        color: 'var(--text-color)',
                        borderRadius: '8px',
                        fontSize: '0.875rem'
                      }}
                    >
                      <option value="Høy">Høy</option>
                      <option value="Middels">Middels</option>
                      <option value="Lav">Lav</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-color)', marginBottom: '0.5rem' }}>
                      Avdeling
                    </label>
                    <select
                      value={newFollowUpAction.departmentId}
                      onChange={(e) => setNewFollowUpAction({ ...newFollowUpAction, departmentId: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid var(--border-color)',
                        background: 'var(--card-background)',
                        color: 'var(--text-color)',
                        borderRadius: '8px',
                        fontSize: '0.875rem'
                      }}
                    >
                      <option value="">Velg avdeling</option>
                      {departments.map(dept => (
                        <option key={dept.id} value={dept.id}>{dept.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-color)', marginBottom: '0.5rem' }}>
                      Frist
                    </label>
                    <input
                      type="date"
                      value={newFollowUpAction.dueDate}
                      onChange={(e) => setNewFollowUpAction({ ...newFollowUpAction, dueDate: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid var(--border-color)',
                        background: 'var(--card-background)',
                        color: 'var(--text-color)',
                        borderRadius: '8px',
                        fontSize: '0.875rem'
                      }}
                    />
                  </div>
                </div>

                <ResponsiblePersonMultiSelect
                  selectedIds={newFollowUpAction.responsiblePersonIds}
                  onChange={(ids) => {
                    const selectedEmployees = employees.filter(e => ids.includes(e.id));
                    setNewFollowUpAction({
                      ...newFollowUpAction,
                      responsiblePersonIds: ids,
                      responsiblePersonId: ids[0] || '',
                      responsiblePerson: selectedEmployees.map(e => e.displayName).join(', ')
                    });
                  }}
                  employees={employees}
                />

                {newFollowUpAction.status === 'completed' && (
                  <div>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-color)', marginBottom: '0.5rem' }}>
                      Fullført dato
                    </label>
                    <input
                      type="date"
                      value={newFollowUpAction.completedDate}
                      onChange={(e) => setNewFollowUpAction({ ...newFollowUpAction, completedDate: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid var(--border-color)',
                        background: 'var(--card-background)',
                        color: 'var(--text-color)',
                        borderRadius: '8px',
                        fontSize: '0.875rem'
                      }}
                    />
                  </div>
                )}

                <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                  <button
                    onClick={handleUpdateFollowUpAction}
                    style={{
                      flex: 1,
                      background: 'var(--primary)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '0.75rem',
                      fontSize: '0.875rem',
                      fontWeight: '600',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem'
                    }}
                  >
                    <Save size={16} />
                    Lagre endringer
                  </button>
                  <button
                    onClick={() => {
                      setShowEditFollowUpModal(false);
                      setSelectedFollowUp(null);
                    }}
                    style={{
                      flex: 1,
                      background: 'var(--gray-100)',
                      color: 'var(--text-color)',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '0.75rem',
                      fontSize: '0.875rem',
                      fontWeight: '600',
                      cursor: 'pointer'
                    }}
                  >
                    Avbryt
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Checkpoint Modal */}
      {showEditCheckpointModal && selectedCheckpoint && (
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
            background: 'var(--card-background)',
            borderRadius: '12px',
            width: '100%',
            maxWidth: '800px',
            maxHeight: '90vh',
            overflowY: 'auto',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
          }}>
            <div style={{
              padding: '1.5rem',
              borderBottom: '1px solid var(--border-color)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: 'var(--text-color)', margin: 0 }}>
                Behandle kontrollpunkt
              </h3>
              <button
                onClick={() => {
                  setShowEditCheckpointModal(false);
                  setSelectedCheckpoint(null);
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '1.5rem',
                  color: 'var(--gray-500)',
                  cursor: 'pointer',
                  padding: '0.25rem'
                }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-color)', marginBottom: '0.5rem' }}>
                    Tittel *
                  </label>
                  <input
                    type="text"
                    value={newCheckpoint.title}
                    onChange={(e) => setNewCheckpoint({ ...newCheckpoint, title: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid var(--border-color)',
                      background: 'var(--card-background)',
                      color: 'var(--text-color)',
                      borderRadius: '8px',
                      fontSize: '0.875rem'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-color)', marginBottom: '0.5rem' }}>
                    Beskrivelse *
                  </label>
                  <textarea
                    value={newCheckpoint.description}
                    onChange={(e) => setNewCheckpoint({ ...newCheckpoint, description: e.target.value })}
                    rows={4}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid var(--border-color)',
                      background: 'var(--card-background)',
                      color: 'var(--text-color)',
                      borderRadius: '8px',
                      fontSize: '0.875rem',
                      resize: 'vertical'
                    }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-color)', marginBottom: '0.5rem' }}>
                      Status
                    </label>
                    <select
                      value={newCheckpoint.status}
                      onChange={(e) => setNewCheckpoint({ ...newCheckpoint, status: e.target.value as 'pending' | 'completed' | 'failed' | 'overdue' })}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid var(--border-color)',
                        background: 'var(--card-background)',
                        color: 'var(--text-color)',
                        borderRadius: '8px',
                        fontSize: '0.875rem'
                      }}
                    >
                      <option value="pending">Venter</option>
                      <option value="completed">Fullført</option>
                      <option value="failed">Feilet</option>
                      <option value="overdue">Forfalt</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-color)', marginBottom: '0.5rem' }}>
                      Kategori
                    </label>
                    <select
                      value={newCheckpoint.category}
                      onChange={(e) => setNewCheckpoint({ ...newCheckpoint, category: e.target.value as 'safety' | 'quality' | 'environmental' | 'process' | 'regulatory' })}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid var(--border-color)',
                        background: 'var(--card-background)',
                        color: 'var(--text-color)',
                        borderRadius: '8px',
                        fontSize: '0.875rem'
                      }}
                    >
                      <option value="safety">Sikkerhet</option>
                      <option value="quality">Kvalitet</option>
                      <option value="environmental">Miljø</option>
                      <option value="process">Prosess</option>
                      <option value="regulatory">Regulatorisk</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-color)', marginBottom: '0.5rem' }}>
                      Frekvens
                    </label>
                    <select
                      value={newCheckpoint.frequency}
                      onChange={(e) => setNewCheckpoint({ ...newCheckpoint, frequency: e.target.value as 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly' })}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid var(--border-color)',
                        background: 'var(--card-background)',
                        color: 'var(--text-color)',
                        borderRadius: '8px',
                        fontSize: '0.875rem'
                      }}
                    >
                      <option value="daily">Daglig</option>
                      <option value="weekly">Ukentlig</option>
                      <option value="monthly">Månedlig</option>
                      <option value="quarterly">Kvartalsvis</option>
                      <option value="yearly">Årlig</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-color)', marginBottom: '0.5rem' }}>
                      Neste sjekk
                    </label>
                    <input
                      type="date"
                      value={newCheckpoint.nextCheck}
                      onChange={(e) => setNewCheckpoint({ ...newCheckpoint, nextCheck: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid var(--border-color)',
                        background: 'var(--card-background)',
                        color: 'var(--text-color)',
                        borderRadius: '8px',
                        fontSize: '0.875rem'
                      }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-color)', marginBottom: '0.5rem' }}>
                      Avdeling
                    </label>
                    <select
                      value={newCheckpoint.departmentId}
                      onChange={(e) => setNewCheckpoint({ ...newCheckpoint, departmentId: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid var(--border-color)',
                        background: 'var(--card-background)',
                        color: 'var(--text-color)',
                        borderRadius: '8px',
                        fontSize: '0.875rem'
                      }}
                    >
                      <option value="">Velg avdeling</option>
                      {departments.map(dept => (
                        <option key={dept.id} value={dept.id}>{dept.name}</option>
                      ))}
                    </select>
                  </div>

                  <ResponsiblePersonMultiSelect
                    selectedIds={newCheckpoint.responsiblePersonIds}
                    onChange={(ids) => {
                      const selectedEmployees = employees.filter(e => ids.includes(e.id));
                      setNewCheckpoint({
                        ...newCheckpoint,
                        responsiblePersonIds: ids,
                        responsiblePersonId: ids[0] || '',
                        responsiblePerson: selectedEmployees.map(e => e.displayName).join(', ')
                      });
                    }}
                    employees={employees}
                  />
                </div>

                {newCheckpoint.status === 'completed' && (
                  <div>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-color)', marginBottom: '0.5rem' }}>
                      Sjekket dato
                    </label>
                    <input
                      type="date"
                      value={newCheckpoint.lastChecked}
                      onChange={(e) => setNewCheckpoint({ ...newCheckpoint, lastChecked: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid var(--border-color)',
                        background: 'var(--card-background)',
                        color: 'var(--text-color)',
                        borderRadius: '8px',
                        fontSize: '0.875rem'
                      }}
                    />
                  </div>
                )}

                <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                  <button
                    onClick={handleUpdateCheckpoint}
                    style={{
                      flex: 1,
                      background: 'var(--primary)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '0.75rem',
                      fontSize: '0.875rem',
                      fontWeight: '600',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem'
                    }}
                  >
                    <Save size={16} />
                    Lagre endringer
                  </button>
                  <button
                    onClick={() => {
                      setShowEditCheckpointModal(false);
                      setSelectedCheckpoint(null);
                    }}
                    style={{
                      flex: 1,
                      background: 'var(--gray-100)',
                      color: 'var(--text-color)',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '0.75rem',
                      fontSize: '0.875rem',
                      fontWeight: '600',
                      cursor: 'pointer'
                    }}
                  >
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


