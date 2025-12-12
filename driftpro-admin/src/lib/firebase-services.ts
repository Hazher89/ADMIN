// All data is for Mavi Logistikk only - no multi-company support
// This ensures complete data isolation between companies

import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  setDoc,
  query,
  where,
  orderBy,
  getDocs,
  getDoc,
  writeBatch,
  onSnapshot,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from './firebase';
import { microsoftGraphService } from './microsoft-graph-service';
import type {
  EmailCase,
  EmailCaseLink,
  EmailCaseMessage,
  EmailEntity,
  EmailAttachment,
  EmailCaseSLA,
  EmailRule
} from './email-system-types';

// Helper function to check if db is available
const ensureDb = () => {
  if (!db) {
    throw new Error('Firebase Firestore is not initialized. Make sure you are running this on the client side.');
  }
  return db;
};

// Types
export interface Employee {
  id: string;
  displayName: string;
  name?: string; // Alias for displayName for backward compatibility
  email: string;
  phone?: string;
  departmentId?: string;
  department?: string; // For backward compatibility
  position?: string;
  role: 'admin' | 'super_admin' | 'department_leader' | 'employee';
  avatar?: string;
  createdAt: string;
  updatedAt: string;
  bio?: string;
  address?: string;
  emergencyContact?: string;
  status: 'active' | 'inactive' | 'on_leave';
  hireDate: string;
  birthDate?: string;
  salary?: number;
  managerId?: string;
  employeeNumber?: string;
  taxId?: string;
  bankAccount?: string;
  insuranceNumber?: string;
  skills?: string[];
  certifications?: string[];
  education?: string;
  workExperience?: string;
  // Tilgangskontroll og rettigheter
  permissions?: {
    dashboard: boolean;
    employees: boolean;
    departments: boolean;
    projects: boolean;
    tasks: boolean;
    inventory: boolean;
    suppliers: boolean;
    finance: boolean;
    invoicing: boolean;
    payments: boolean;
    hr: boolean;
    crm: boolean;
    delivery: boolean;
    settings: boolean;
    mail: boolean;
    reports: boolean;
    analytics: boolean;
    notifications: boolean;
    calendar: boolean;
    documents: boolean;
    training: boolean;
    compliance: boolean;
    maintenance: boolean;
    quality: boolean;
    safety: boolean;
    procurement: boolean;
    logistics: boolean;
    production: boolean;
    sales: boolean;
    marketing: boolean;
    customerService: boolean;
    it: boolean;
    legal: boolean;
    audit: boolean;
    internkontrollOgSamsvar: boolean; // Internkontroll og Samsvar (audit page) - Legacy, kept for backward compatibility
    internrevisjon: boolean; // Internrevisjon fane
    avvik: boolean; // Avvik fane
    risikovurdering: boolean; // Risikovurdering fane
    oppfølgingstiltak: boolean; // Oppfølgingstiltak fane
    kontrollpunkter: boolean; // Kontrollpunkter fane
    internkontrollRapporter: boolean; // Rapporter fane i Internkontroll og Samsvar
    // Sidebar sider
    chat: boolean; // Chat
    emailSystem: boolean; // E-post System
    smsLogs: boolean; // SMS Logg & Telefonbok
    partners: boolean; // Samarbeidspartnere
    // Logistikk System faner
    logistikkBudPriser: boolean; // BUD Priser fane
    logistikkLevering: boolean; // Levering fane
    logistikkPlanlegging: boolean; // Planlegging fane
    logistikkKunder: boolean; // Kunder fane
    logistikkLeverandorer: boolean; // Leverandører fane
    logistikkProdukter: boolean; // Produkter fane
    logistikkLager: boolean; // Lager fane
    logistikkFakturering: boolean; // Fakturering fane
    logistikkFinans: boolean; // Finans fane
    // HR faner
    hrAnsatte: boolean; // Ansatte fane i HR
    hrVakter: boolean; // Vakter fane i HR
    hrFravær: boolean; // Fravær fane i HR
    hrFerie: boolean; // Ferie fane i HR
    hrAvdelinger: boolean; // Avdelinger fane i HR
  };
  // Ferie og fravær-tilgang
  vacationAccess?: {
    canRequestVacation: boolean;
    canApproveVacation: boolean;
    canViewAllVacations: boolean;
    vacationDaysPerYear: number;
    managerApprovalRequired: boolean;
  };
  // Lederskap og hierarki
  leadership?: {
    isManager: boolean;
    managesDepartments: string[];
    managesEmployees: string[];
    reportsTo: string;
    canApproveExpenses: boolean;
    canApprovePurchases: boolean;
    budgetLimit: number;
  };
}

export interface Department {
  id: string;
  name: string;
  description?: string;
  managerId?: string;
  createdAt: string;
  updatedAt: string;
  employeeCount: number;
  budget?: number;
  location?: string;
  status?: 'active' | 'inactive';
}

export interface Shift {
  id: string;
  employeeId: string;
  departmentId: string;
  startTime: string;
  endTime: string;
  breakStart?: string;
  breakEnd?: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  type: 'regular' | 'overtime' | 'night' | 'weekend';
  notes?: string;
  createdAt: string;
  updatedAt: string;
  clockInTime?: string;
  clockOutTime?: string;
  totalHours?: number;
}

export interface Deviation {
  id: string;
  title: string;
  description: string;
  type: 'safety' | 'quality' | 'security' | 'process' | 'environmental' | 'health' | 'other';
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'reported' | 'investigating' | 'resolved' | 'closed' | 'in_progress';
  reportedBy: string;
  assignedTo?: string;
  assignedToIds?: string[]; // Multiple assigned persons
  departmentId: string;
  location?: string;
  equipment?: string;
  cost?: number;
  riskAssessment?: string;
  immediateActions?: string;
  rootCause?: string;
  correctiveActions?: string;
  preventiveActions?: string;
  witnesses?: string[];
  investigationRequired?: boolean;
  regulatoryReport?: boolean;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
  attachments?: string[]; // Legacy - kept for backward compatibility
  documents?: AuditDocument[]; // New - full document objects with metadata
  comments?: DeviationComment[];
}

export interface DeviationComment {
  id: string;
  content: string;
  authorId: string;
  authorName: string;
  createdAt: string;
}

export interface Document {
  id: string;
  title: string;
  name?: string; // Alias for title
  type?: string; // Alias for fileType
  description?: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  fileType: string;
  category: 'policy' | 'procedure' | 'form' | 'report' | 'other';
  uploadedBy: string;
  departmentId?: string;
  createdAt: string;
  updatedAt: string;
  isPublic: boolean;
  tags?: string[];
  version?: string;
  storageType?: 'onedrive' | 'firebase'; // Track which storage was used
  oneDriveItemId?: string; // OneDrive item ID if stored in OneDrive
}

export interface TimeClock {
  id: string;
  employeeId: string;
  clockInTime: string;
  clockOutTime?: string;
  breakStartTime?: string;
  breakEndTime?: string;
  totalHours?: number;
  location?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Absence {
  id: string;
  employeeId: string;
  employeeName?: string; // Made optional for backward compatibility
  startDate: string;
  endDate: string;
  type: 'sick' | 'personal' | 'sickChild' | 'other' | 'vacation';
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  approvedBy?: string;
  approvedAt?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  requestedBy?: string;
}

export interface Vacation {
  id: string;
  employeeId: string;
  employeeName: string;
  startDate: string;
  endDate: string;
  type: 'vacation' | 'sick' | 'personal' | 'other';
  days: number;
  status: 'pending' | 'approved' | 'rejected';
  approvedBy?: string;
  approvedAt?: string;
  notes?: string;
  requestedBy?: string;
  createdAt: string;
  updatedAt: string;
  year?: number; // Year the vacation belongs to
}

export interface VacationAllocation {
  id: string;
  employeeId: string;
  year: number;
  allocatedDays: number; // Standard 25 days (5 weeks)
  usedDays: number;
  transferredDays: number; // Days transferred from previous year
  remainingDays: number;
  createdAt: string;
  updatedAt: string;
}

export interface DashboardStats {
  totalEmployees: number;
  activeShifts: number;
  pendingRequests: number;
  departments: number;
  totalDeviations: number;
  openDeviations: number;
  totalDocuments: number;
  activeTimeClocks: number;
}

export interface Company {
  id: string;
  name: string;
  industry: string;
  employees: number;
  location: string;
  phone: string;
  email: string;
  website: string;
  status: 'active' | 'inactive' | 'pending';
  joinedDate: string;
  revenue: string;
  description: string;
  adminUserId: string;
  createdAt: string;
  updatedAt: string;
  // New optional fields
  avatar?: string;
  logo?: string;
  orgNumber?: string;
  vatNumber?: string;
  address?: {
    street: string;
    city: string;
    postalCode: string;
    country: string;
  };
  contactPerson?: {
    name: string;
    email: string;
    phone: string;
    position: string;
  };
  permissions?: Array<{
    id: string;
    name: string;
    href: string;
    category: string;
  }>;
  businessHours?: {
    monday: string;
    tuesday: string;
    wednesday: string;
    thursday: string;
    friday: string;
    saturday: string;
    sunday: string;
  };
  socialMedia?: {
    linkedin?: string;
    facebook?: string;
    twitter?: string;
    instagram?: string;
  };
  documents?: string[]; // Array of document IDs
  tags?: string[];
  notes?: string;
  foundedYear?: number;
  companySize?: 'micro' | 'small' | 'medium' | 'large';
  sector?: string;
  certifications?: string[];
  insurance?: {
    provider: string;
    policyNumber: string;
    expiryDate: string;
  };
}

export interface Activity {
  id: string;
  type: 'employee_added' | 'shift_created' | 'deviation_reported' | 'document_uploaded' | 'timeclock_event' | 'ai_tool_executed' | 'recommendation_applied';
  title: string;
  description: string;
  userId: string;
  userName: string;
  createdAt: string;
  metadata?: Record<string, unknown>;
}

export interface Survey {
  id: string;
  title: string;
  description: string;
  questions: SurveyQuestion[];
  status: 'draft' | 'active' | 'completed' | 'archived';
  targetAudience: string;
  startDate: string;
  endDate: string;
  responses: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface SurveyQuestion {
  id: string;
  question: string;
  type: 'text' | 'multiple_choice' | 'rating' | 'yes_no';
  options?: string[];
  required: boolean;
}

export interface SurveyResponse {
  id: string;
  surveyId: string;
  employeeId: string;
  employeeName: string;
  answers: SurveyAnswer[];
  submittedAt: string;
}

export interface SurveyAnswer {
  questionId: string;
  answer: string | number | boolean;
}

export interface Partner {
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
  vehicles?: Array<{
    registrationNumber: string;
    year: string;
    model: string;
    euroClass: string;
    payload: string;
    vehicleName?: string;
    vehicleNumber?: string;
    driverName?: string;
    vehicleType?: 'company_car' | 'one_man' | 'two_man';
  }>;
  uploadedFiles?: Array<{
    name: string;
    url: string;
    size: number;
    type: string;
    uploadedAt: string;
  }>;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface Setting {
  id: string;
  name: string;
  description: string;
  category: string;
  status: 'active' | 'inactive' | 'pending';
  icon: string;
  value?: string;
  createdBy: string;
  updatedAt: string;
}

export interface PartnerAssignment {
  id: string;
  partnerId: string;
  title: string;
  description: string;
  startTime: string;
  endTime: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  assignedBy: string;
  assignedTo?: string;
  assignedToIds?: string[]; // Multiple assigned persons
  partnerResponse?: {
    status: 'accepted' | 'rejected' | 'no_response';
    notes?: string;
    responseAt: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface PartnerUser {
  id: string;
  partnerId: string;
  userId: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  status: 'active' | 'inactive';
  role: 'admin' | 'employee';
  createdAt: string;
  updatedAt: string;
}

// Comprehensive Internal Audit System Interfaces
export interface InternalAudit {
  id: string;
  title: string;
  type: 'Internrevisjon' | 'Eksternrevisjon' | 'Regulatorisk' | 'Kvalitetsrevisjon' | 'Sikkerhetsrevisjon' | 'Finansiell';
  scope: string;
  status: 'Planlagt' | 'Pågående' | 'Fullført' | 'Avbrutt' | 'Overdue';
  plannedDate: string;
  completedDate?: string;
  responsiblePerson: string;
  responsiblePersonId?: string;
  responsiblePersons?: string[]; // Multiple responsible persons
  responsiblePersonIds?: string[]; // Multiple responsible person IDs
  department: string;
  departmentId?: string;
  findings: string[];
  recommendations: string[];
  priority: 'Høy' | 'Middels' | 'Lav';
  nextReview: string;
  description?: string;
  objectives?: string[];
  standards?: string[];
  documents?: AuditDocument[];
  comments?: AuditComment[];
  assignedAuditors?: string[];
  estimatedHours?: number;
  actualHours?: number;
  cost?: number;
  complianceScore?: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  completedBy?: string;
  approvedBy?: string;
  approvalDate?: string;
  notes?: string;
}

export interface AuditDocument {
  id: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  fileType: string;
  uploadedBy: string;
  uploadedAt: string;
  description?: string;
  category?: 'planning' | 'execution' | 'findings' | 'report' | 'evidence' | 'other';
  storageType?: 'onedrive' | 'firebase'; // Track which storage was used
  oneDriveItemId?: string; // OneDrive item ID if stored in OneDrive
}

export interface AuditComment {
  id: string;
  text: string;
  authorId: string;
  authorName: string;
  createdAt: string;
}

export interface RiskAssessment {
  id: string;
  riskAssessmentId?: string; // Display ID like "310"
  title: string;
  description: string;
  departmentId: string;
  location?: string;
  activity: string;
  hazard: string;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  probability: string; // Changed to string to support "0", "1", "2", etc.
  probabilityValue?: number;
  probabilityLabel?: string; // e.g., "Lite sannsynlig"
  consequence: 'low' | 'medium' | 'high' | 'critical';
  existingControls: string;
  existingControlsProbability?: string; // Existing measures to reduce probability
  existingControlsConsequence?: string; // Existing measures to reduce consequence
  additionalControls?: string;
  whatCanHappen?: string; // "Hva kan skje?"
  eventDescriptionAndConsequence?: string; // "Beskrivelse av hendelsen og konsekvens"
  eventCauseDescription?: string; // "Beskrivelse av årsaken til hendelsen"
  mappedDate?: string; // "Kartlagt dato"
  responsiblePerson: string;
  responsiblePersonId?: string;
  responsiblePersons?: string[]; // Multiple responsible persons
  responsiblePersonIds?: string[]; // Multiple responsible person IDs
  reviewDate: string;
  attachments?: string[]; // Legacy - kept for backward compatibility
  documents?: AuditDocument[]; // New - full document objects with metadata
  createdBy: string;
  sentToLeader?: boolean;
  leaderId?: string;
  status: 'draft' | 'pending_approval' | 'approved' | 'rejected';
  createdAt: string;
  updatedAt: string;
  // New fields from the detailed form
  area?: string; // Område
  cause?: string; // Årsak
  processes?: string; // Prosesser
  reference2?: string;
  reference3?: string;
  reference4?: string;
  notes?: string; // Notater
  timestampSignature?: string; // Tidsstempel / Signatur
  // Risk categories with detailed values
  riskPerson?: { enabled: boolean; value: string; level: number; status?: string };
  riskEconomy?: { enabled: boolean; value: string; level: number; status?: string };
  riskEnvironment?: { enabled: boolean; value: string; level: number; status?: string };
  riskReputation?: { enabled: boolean; value: string; level: number; status?: string };
  riskDelivery?: { enabled: boolean; value: string; level: number; status?: string };
  riskSecurity?: { enabled: boolean; value: string; level: number; status?: string };
}

export interface FollowUpAction {
  id: string;
  title: string;
  description: string;
  relatedAuditId?: string;
  relatedDeviationId?: string;
  relatedRiskAssessmentId?: string;
  responsiblePerson: string;
  responsiblePersonId?: string;
  responsiblePersons?: string[]; // Multiple responsible persons
  responsiblePersonIds?: string[]; // Multiple responsible person IDs
  departmentId: string;
  dueDate: string;
  status: 'not_started' | 'in_progress' | 'completed' | 'overdue';
  priority: 'Høy' | 'Middels' | 'Lav';
  completedDate?: string;
  completedBy?: string;
  verificationRequired: boolean;
  verifiedBy?: string;
  verifiedAt?: string;
  attachments?: string[]; // Legacy - kept for backward compatibility
  documents?: AuditDocument[]; // New - full document objects with metadata
  createdBy: string;
  sentToLeader?: boolean;
  leaderId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Checkpoint {
  id: string;
  title: string;
  description: string;
  departmentId: string;
  category: 'safety' | 'quality' | 'environmental' | 'process' | 'regulatory';
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  responsiblePerson: string;
  responsiblePersonId?: string;
  responsiblePersons?: string[]; // Multiple responsible persons
  responsiblePersonIds?: string[]; // Multiple responsible person IDs
  lastChecked?: string;
  nextCheck: string;
  status: 'pending' | 'completed' | 'failed' | 'overdue';
  checklist: Array<{ item: string; checked: boolean; notes?: string }>;
  attachments?: string[]; // Legacy - kept for backward compatibility
  documents?: AuditDocument[]; // New - full document objects with metadata
  createdBy: string;
  sentToLeader?: boolean;
  leaderId?: string;
  createdAt: string;
  updatedAt: string;
}

// Access Control Helper
export interface UserAccessContext {
  userId: string;
  role: 'admin' | 'super_admin' | 'department_leader' | 'employee';
  departmentId?: string;
}

// Helper function to create UserAccessContext from userProfile
export function createUserAccessContext(userProfile: any): UserAccessContext | null {
  if (!userProfile || !userProfile.id) {
    return null;
  }
  
  return {
    userId: userProfile.id,
    role: userProfile.role || 'employee',
    departmentId: userProfile.departmentId
  };
}

class FirebaseService {
  // GDPR Helper: Check if user has access to department
  private hasDepartmentAccess(userContext: UserAccessContext, targetDepartmentId?: string): boolean {
    // Superadmin and admin have access to all departments
    if (userContext.role === 'super_admin' || userContext.role === 'admin') {
      return true;
    }
    
    // Department leaders can only access their own department
    if (userContext.role === 'department_leader') {
      return userContext.departmentId === targetDepartmentId;
    }
    
    // Employees can only access their own data
    return false;
  }

  // Helper: Log access for audit trail
  private async logAccess(
    action: string,
    userId: string,
    resourceType: string,
    resourceId: string,
    metadata?: Record<string, unknown>
  ): Promise<void> {
    const firestore = ensureDb();
    try {
      // Clean metadata to remove undefined values
      const cleanMetadata: Record<string, unknown> = {};
      if (metadata) {
        for (const [key, value] of Object.entries(metadata)) {
          if (value !== undefined && value !== null) {
            cleanMetadata[key] = value;
          }
        }
      }

      await addDoc(collection(firestore, 'auditLogs'), {
        action,
        userId,
        resourceType,
        resourceId,
        timestamp: serverTimestamp(),
        metadata: cleanMetadata,
        createdAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error logging access:', error);
      // Don't throw - logging failures shouldn't break the app
    }
  }

  // Employee Management with role-based filtering
  async getEmployees(userContext?: UserAccessContext): Promise<Employee[]> {
    const firestore = ensureDb();

    console.log('Fetching employees with context:', userContext);

    try {
      let q;
      
      // Filter based on role and department
      if (userContext) {
        if (userContext.role === 'super_admin' || userContext.role === 'admin') {
          // Superadmin and admin see all employees
          q = query(collection(firestore, 'users'));
        } else if (userContext.role === 'department_leader' && userContext.departmentId) {
          // Department leaders only see employees in their department
          q = query(
            collection(firestore, 'users'),
            where('departmentId', '==', userContext.departmentId)
          );
        } else if (userContext.role === 'employee') {
          // Employees only see themselves - fetch by document ID
          const employeeDoc = await getDoc(doc(firestore, 'users', userContext.userId));
          if (employeeDoc.exists()) {
            const employee = { id: employeeDoc.id, ...employeeDoc.data() } as Employee;
            await this.logAccess('view_employee', userContext.userId, 'employee', userContext.userId);
            return [employee];
          }
          return [];
        } else {
          // No access
          console.warn('User does not have access to employees');
          return [];
        }
      } else {
        // Fallback: if no context provided, return all
        q = query(collection(firestore, 'users'));
      }

      const snapshot = await getDocs(q);
      const employees = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Employee[];
      
      // Sort by createdAt in memory
      employees.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      
      // Log access
      if (userContext) {
        const logMetadata: Record<string, unknown> = {
          count: employees.length
        };
        if (userContext.departmentId) {
          logMetadata.departmentId = userContext.departmentId;
        }
        await this.logAccess('view_employees', userContext.userId, 'employees', 'list', logMetadata);
      }
      
      console.log('Found employees:', employees.length, employees);
      return employees;
    } catch (error) {
      console.error('Error fetching employees:', error);
      return [];
    }
  }

  async getEmployee(id: string, userContext?: UserAccessContext): Promise<Employee | null> {
    const firestore = ensureDb();

    try {
      const docSnap = await getDoc(doc(firestore, 'users', id));
      if (!docSnap.exists()) {
        return null;
      }

      const employee = { id: docSnap.id, ...docSnap.data() } as Employee;

      // GDPR: Check access
      if (userContext) {
        // Superadmin and admin have access to all
        if (userContext.role === 'super_admin' || userContext.role === 'admin') {
          await this.logAccess('view_employee', userContext.userId, 'employee', id);
          return employee;
        }
        
        // Department leaders can only access employees in their department
        if (userContext.role === 'department_leader') {
          if (employee.departmentId === userContext.departmentId) {
            await this.logAccess('view_employee', userContext.userId, 'employee', id);
            return employee;
          }
          console.warn('Department leader does not have access to this employee');
      return null;
        }
        
        // Employees can only access themselves
        if (userContext.role === 'employee') {
          if (id === userContext.userId) {
            await this.logAccess('view_employee', userContext.userId, 'employee', id);
            return employee;
          }
          console.warn('Employee does not have access to this employee');
          return null;
        }
      }

      // If no context provided, return (for backward compatibility)
      return employee;
    } catch (error) {
      console.error('Error fetching employee:', error);
      return null;
    }
  }

  async getManagersAndAdmins(): Promise<Employee[]> {
    const firestore = ensureDb();

    console.log('Fetching managers and admins');

    try {
      const q = query(
        collection(firestore, 'users'),
        where('role', 'in', ['admin', 'department_leader'])
      );
      const snapshot = await getDocs(q);
      const managers = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Employee[];
      
      // Sort by role (admin first, then department_leader) and then by name
      managers.sort((a, b) => {
        if (a.role === 'admin' && b.role !== 'admin') return -1;
        if (a.role !== 'admin' && b.role === 'admin') return 1;
        return a.displayName.localeCompare(b.displayName);
      });
      
      console.log('Found managers and admins:', managers.length, managers);
      return managers;
    } catch (error) {
      console.error('Error fetching managers and admins:', error);
      return [];
    }
  }

  async createEmployee(employeeData: Omit<Employee, 'id' | 'createdAt' | 'updatedAt'>, userContext?: UserAccessContext): Promise<string> {
    const firestore = ensureDb();

    console.log('Creating employee with data:', employeeData, 'userContext:', userContext);

    try {
      // GDPR: Check if user has permission to create employees
      if (userContext) {
        // Superadmin and admin can create employees in any department
        if (userContext.role === 'super_admin' || userContext.role === 'admin') {
          // Allowed
        } 
        // Department leaders can only create employees in their own department
        else if (userContext.role === 'department_leader' && userContext.departmentId) {
          if (employeeData.departmentId && employeeData.departmentId !== userContext.departmentId) {
            throw new Error('Du kan kun legge til ansatte i din egen avdeling');
          }
          // If no departmentId specified, assign to leader's department
          if (!employeeData.departmentId) {
            employeeData.departmentId = userContext.departmentId;
          }
        }
        // Employees cannot create other employees
        else if (userContext.role === 'employee') {
          throw new Error('Du har ikke tilgang til å legge til ansatte');
        }
      }

      const now = new Date().toISOString();
      
      // Helper function to recursively remove undefined and null values, but keep empty objects and arrays
      const cleanObject = (obj: any): any => {
        if (obj === null || obj === undefined) {
          return undefined;
        }
        if (Array.isArray(obj)) {
          const cleaned = obj.map(cleanObject).filter(item => item !== undefined);
          return cleaned.length > 0 ? cleaned : []; // Keep empty arrays
        }
        if (typeof obj === 'object') {
          const cleaned: any = {};
          for (const [key, value] of Object.entries(obj)) {
            const cleanedValue = cleanObject(value);
            // Keep empty objects for permissions, vacationAccess, leadership
            if (key === 'permissions' || key === 'vacationAccess' || key === 'leadership') {
              cleaned[key] = cleanedValue || {};
            } else if (cleanedValue !== undefined && cleanedValue !== null) {
              cleaned[key] = cleanedValue;
            }
          }
          return cleaned;
        }
        return obj;
      };
      
      // Remove undefined and null values to avoid Firebase errors, but keep required structure
      const cleanEmployeeData = cleanObject(employeeData);
      
      // Ensure required fields are present
      if (!cleanEmployeeData || !cleanEmployeeData.displayName || !cleanEmployeeData.email) {
        throw new Error('Missing required fields: displayName or email');
      }
      
      // Ensure permissions, vacationAccess, and leadership are always present (even if empty)
      if (!cleanEmployeeData.permissions) {
        cleanEmployeeData.permissions = {};
      }
      if (!cleanEmployeeData.vacationAccess) {
        cleanEmployeeData.vacationAccess = {
          canRequestVacation: true,
          canApproveVacation: false,
          canViewAllVacations: false,
          vacationDaysPerYear: 25,
          managerApprovalRequired: true
        };
      }
      if (!cleanEmployeeData.leadership) {
        cleanEmployeeData.leadership = {
          isManager: false,
          managesDepartments: [],
          managesEmployees: [],
          reportsTo: '',
          canApproveExpenses: false,
          canApprovePurchases: false,
          budgetLimit: 0
        };
      }
      
      // First, create Firebase Auth user so they can log in
      let firebaseAuthUid: string | null = null;
      let authError: Error | null = null;
      
      try {
        console.log('🔐 Creating Firebase Auth user for employee:', cleanEmployeeData.email);
        
        // Use base URL for API call - must work on both client and server
        let baseUrl: string;
        if (typeof window !== 'undefined') {
          baseUrl = window.location.origin;
        } else {
          // Server-side: use environment variable or default
          baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL 
            ? `https://${process.env.VERCEL_URL || process.env.NEXT_PUBLIC_APP_URL?.replace(/^https?:\/\//, '')}`
            : 'http://localhost:3000';
        }
        
        console.log('📡 Calling create-user API at:', `${baseUrl}/api/create-user`);
        
        const createUserResponse = await fetch(`${baseUrl}/api/create-user`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: cleanEmployeeData.email,
            displayName: cleanEmployeeData.displayName,
            role: cleanEmployeeData.role || 'employee',
            companyName: 'Mavi Logistikk'
          })
        });

        const createUserResult = await createUserResponse.json().catch(() => ({}));
        
        if (createUserResponse.ok && createUserResult.success) {
          firebaseAuthUid = createUserResult.userId;
          if (firebaseAuthUid) {
            console.log('✅ Firebase Auth user created/found with UID:', firebaseAuthUid);
          } else {
            console.warn('⚠️ API returned success but no userId');
          }
          // Store setupPasswordUrl for later use (if provided by create-user API)
          if (createUserResult.setupPasswordUrl) {
            cleanEmployeeData.setupPasswordUrl = createUserResult.setupPasswordUrl;
          }
        } else {
          // If user already exists, try to find their UID
          if (createUserResult.alreadyExists || createUserResult.error?.includes('already')) {
            console.warn('⚠️ User already exists in Firebase Auth, trying to find UID');
            firebaseAuthUid = createUserResult.userId || null;
            
            // If still no UID, search Firestore
            if (!firebaseAuthUid) {
              const existingUserQuery = query(
                collection(firestore, 'users'),
                where('email', '==', cleanEmployeeData.email)
              );
              const existingUserSnapshot = await getDocs(existingUserQuery);
              if (!existingUserSnapshot.empty) {
                const existingUserDoc = existingUserSnapshot.docs[0];
                const existingData = existingUserDoc.data();
                firebaseAuthUid = existingData.uid || existingUserDoc.id;
                console.log('✅ Found existing Firebase Auth UID in Firestore:', firebaseAuthUid);
              }
            }
          } else {
            authError = new Error(createUserResult.error || createUserResult.message || 'Failed to create Firebase Auth user');
            console.error('❌ Failed to create Firebase Auth user:', authError.message);
            // Don't throw - we'll create the Firestore document anyway
            // User can be linked to Auth account later via password reset
          }
        }
      } catch (authErrorCaught) {
        authError = authErrorCaught instanceof Error ? authErrorCaught : new Error(String(authErrorCaught));
        console.error('❌ Error calling create-user API:', authError.message);
        // Continue anyway - we'll create Firestore document
        // User can be linked to Auth account later via password reset
      }
      
      // If we still don't have a UID, try one more time to find existing user by email
      if (!firebaseAuthUid) {
        try {
          const existingUserQuery = query(
            collection(firestore, 'users'),
            where('email', '==', cleanEmployeeData.email)
          );
          const existingUserSnapshot = await getDocs(existingUserQuery);
          if (!existingUserSnapshot.empty) {
            const existingUserDoc = existingUserSnapshot.docs[0];
            const existingData = existingUserDoc.data();
            firebaseAuthUid = existingData.uid || existingUserDoc.id;
            console.log('✅ Found existing user in Firestore with UID:', firebaseAuthUid);
          }
        } catch (findError) {
          console.warn('Could not find existing user:', findError);
        }
      }

      // Check if employee already exists (by email)
      const existingEmployeeQuery = query(
        collection(firestore, 'users'),
        where('email', '==', cleanEmployeeData.email)
      );
      const existingEmployeeSnapshot = await getDocs(existingEmployeeQuery);
      
      if (!existingEmployeeSnapshot.empty) {
        const existingDoc = existingEmployeeSnapshot.docs[0];
        const existingData = existingDoc.data();
        throw new Error(`Ansatt med e-post ${cleanEmployeeData.email} eksisterer allerede`);
      }
      
      const employeeDoc: any = {
        ...cleanEmployeeData,
        createdAt: now,
        updatedAt: now
      };
      
      // Only add uid and id if we have a Firebase Auth UID
      if (firebaseAuthUid) {
        employeeDoc.uid = firebaseAuthUid;
        employeeDoc.id = firebaseAuthUid;
      }
      
      // Remove any undefined values to avoid Firestore errors
      Object.keys(employeeDoc).forEach(key => {
        if (employeeDoc[key] === undefined) {
          delete employeeDoc[key];
        }
      });
      
      console.log('Employee document to save:', JSON.stringify(employeeDoc, null, 2));
      
      // If we have a Firebase Auth UID, use it as document ID, otherwise let Firestore generate one
      let docRef;
      if (firebaseAuthUid) {
        // Use Firebase Auth UID as document ID for consistency
        await setDoc(doc(firestore, 'users', firebaseAuthUid), employeeDoc);
        docRef = { id: firebaseAuthUid };
        console.log('✅ Employee created with Firebase Auth UID:', firebaseAuthUid);
      } else {
        // Fallback: create document with auto-generated ID
        docRef = await addDoc(collection(firestore, 'users'), employeeDoc);
        console.log('✅ Employee created with auto-generated ID:', docRef.id);
        console.warn('⚠️ Employee created without Firebase Auth UID - they will need password reset to log in');
        
        // Update the document with the generated ID
        await updateDoc(doc(firestore, 'users', docRef.id), {
          id: docRef.id
        });
      }
      
      // If there was an auth error but we created the document, log it as a warning
      if (authError && !firebaseAuthUid) {
        console.warn('⚠️ Employee created in Firestore but Firebase Auth creation failed:', authError.message);
        console.warn('⚠️ User will need to reset password to log in');
      }

      // Log access for audit trail
      if (userContext) {
        const logMetadata: Record<string, unknown> = {
          employeeName: employeeData.displayName,
          role: employeeData.role
        };
        if (employeeData.departmentId) {
          logMetadata.departmentId = employeeData.departmentId;
        }
        await this.logAccess('create_employee', userContext.userId, 'employee', docRef.id, logMetadata);
      }

      // Generate a password setup token for direct password setup (if we have a user)
      // This ensures we have a token even if /api/create-user didn't create one
      let setupPasswordUrl: string | null = null;
      if (docRef.id && cleanEmployeeData.email) {
        try {
          // Check if token already exists for this user (created by /api/create-user)
          const existingTokenQuery = query(
            collection(firestore, 'setupTokens'),
            where('userId', '==', docRef.id),
            where('email', '==', cleanEmployeeData.email),
            where('type', '==', 'employee_welcome')
          );
          const existingTokens = await getDocs(existingTokenQuery);

          if (existingTokens.empty) {
            // Create new setup token
            const setupToken = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
            const expiresAt = new Date();
            expiresAt.setHours(expiresAt.getHours() + 72); // Token valid for 72 hours

            await addDoc(collection(firestore, 'setupTokens'), {
              token: setupToken,
              userId: docRef.id,
              email: cleanEmployeeData.email,
              expiresAt: Timestamp.fromDate(expiresAt),
              used: false,
              createdAt: serverTimestamp(),
              type: 'employee_welcome',
              companyName: 'Mavi Logistikk',
              adminName: 'System Administrator'
            });

            const appUrl = typeof window !== 'undefined' 
              ? window.location.origin 
              : process.env.NEXT_PUBLIC_APP_URL || 'https://admin.driftpro.no';
            setupPasswordUrl = `${appUrl}/setup-password?token=${setupToken}`;
            console.log('✅ Setup password token created in createEmployee:', setupPasswordUrl);
          } else {
            // Use existing token
            const existingToken = existingTokens.docs[0].data();
            const appUrl = typeof window !== 'undefined' 
              ? window.location.origin 
              : process.env.NEXT_PUBLIC_APP_URL || 'https://admin.driftpro.no';
            setupPasswordUrl = `${appUrl}/setup-password?token=${existingToken.token}`;
            console.log('✅ Using existing setup password token');
          }
        } catch (tokenError) {
          console.warn('⚠️ Failed to create setup token (non-critical):', tokenError);
        }
      }

      // Create activity log (don't fail if this fails)
      try {
      await this.createActivity({
        type: 'employee_added',
        title: 'Ny ansatt registrert',
        description: `${employeeData.displayName} ble lagt til i systemet`,
        userId: docRef.id,
        userName: employeeData.displayName,
      });
      console.log('Activity log created for employee:', docRef.id);
      } catch (activityError) {
        console.warn('Failed to create activity log (non-critical):', activityError);
      }

      // Store setupPasswordUrl in the employee document for later retrieval if needed
      // But for now, we'll attach it to the return value
      const returnValue: any = docRef.id;
      (returnValue as any).setupPasswordUrl = setupPasswordUrl;

      return returnValue;
    } catch (error) {
      console.error('❌ Error creating employee:', error);
      throw error;
    }
  }

  async updateEmployee(id: string, data: Partial<Employee>, userContext?: UserAccessContext): Promise<void> {
    const firestore = ensureDb();

    try {
      console.log('Updating employee with ID:', id, 'Data:', data);
      
      // Get employee data before update for audit log
      const employeeDoc = await getDoc(doc(firestore, 'users', id));
      if (!employeeDoc.exists()) {
        throw new Error('Employee not found');
      }
      const employeeData = employeeDoc.data() as Employee;
      
      // Helper function to recursively remove undefined and null values
      const cleanObject = (obj: any): any => {
        if (obj === null || obj === undefined) {
          return undefined;
        }
        if (Array.isArray(obj)) {
          return obj.map(cleanObject).filter(item => item !== undefined);
        }
        if (typeof obj === 'object') {
          const cleaned: any = {};
          for (const [key, value] of Object.entries(obj)) {
            const cleanedValue = cleanObject(value);
            if (cleanedValue !== undefined && cleanedValue !== null) {
              cleaned[key] = cleanedValue;
            }
          }
          return Object.keys(cleaned).length > 0 ? cleaned : undefined;
        }
        return obj;
      };
      
      // Remove undefined and null values to avoid Firebase errors
      const cleanData = cleanObject(data);
      
      console.log('Cleaned data to save:', cleanData);
      
      await updateDoc(doc(firestore, 'users', id), {
        ...cleanData,
        updatedAt: new Date().toISOString()
      });
      
      // Log access for audit trail
      if (userContext) {
        const logMetadata: Record<string, unknown> = {
          employeeName: employeeData.displayName,
          employeeEmail: employeeData.email,
          updatedFields: Object.keys(cleanData || {})
        };
        if (employeeData.departmentId) {
          logMetadata.departmentId = employeeData.departmentId;
        }
        await this.logAccess('update_employee', userContext.userId, 'employee', id, logMetadata);
      }
      
      console.log('✅ Employee updated successfully');
    } catch (error) {
      console.error('❌ Error updating employee:', error);
      throw error;
    }
  }

  async deleteEmployee(id: string, userContext?: UserAccessContext): Promise<void> {
    const firestore = ensureDb();

    try {
      console.log('Deleting employee with ID:', id);
      // Get employee data before deletion
      const employeeDoc = await getDoc(doc(firestore, 'users', id));
      if (!employeeDoc.exists()) {
        throw new Error('Employee not found');
      }

      const employeeData = employeeDoc.data() as Employee;
      
      // PROTECTION: Prevent deletion of superadmin or protected users
      if (employeeData.role === 'super_admin' || 
          (employeeData as any).isProtected === true || 
          (employeeData as any).cannotBeDeleted === true ||
          (employeeData as any).isSuperAdmin === true) {
        throw new Error('Denne brukeren er beskyttet og kan ikke slettes. Superadmin-brukere har permanent tilgang.');
      }
      
      // PROTECTION: Prevent deletion of the specific superadmin email
      if (employeeData.email === 'baxigshti@hotmail.de') {
        throw new Error('Denne superadmin-brukeren kan ikke slettes.');
      }
      
      // Delete from Firestore
      await deleteDoc(doc(firestore, 'users', id));
      
      // Log access for audit trail
      if (userContext) {
        const logMetadata: Record<string, unknown> = {
          employeeName: employeeData.displayName,
          employeeEmail: employeeData.email,
          role: employeeData.role
        };
        if (employeeData.departmentId) {
          logMetadata.departmentId = employeeData.departmentId;
        }
        await this.logAccess('delete_employee', userContext.userId, 'employee', id, logMetadata);
      }
      
      console.log(`✅ Employee deleted from Firestore: ${employeeData.displayName} (${employeeData.email})`);
      
      // Note: Firebase Auth user deletion requires Admin SDK
      // For now, we'll log this information
      console.log(`⚠️ Firebase Auth user for ${employeeData.email} should be deleted manually or via Admin SDK`);
      
    } catch (error) {
      console.error('Error deleting employee:', error);
      throw error;
    }
  }

  // Department Management
  async getDepartments(): Promise<Department[]> {
    const firestore = ensureDb();

    try {
      const q = query(collection(firestore, 'departments'));
      const snapshot = await getDocs(q);
      const departments = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Department[];
      
      // Sort by name in memory
      departments.sort((a, b) => a.name.localeCompare(b.name));
      return departments;
    } catch (error) {
      console.error('Error fetching departments:', error);
      return [];
    }
  }

  async createDepartment(departmentData: Omit<Department, 'id' | 'createdAt' | 'updatedAt' | 'employeeCount'>, userContext?: UserAccessContext): Promise<string> {
    const firestore = ensureDb();

    try {
      // GDPR: Check if user has permission to create departments
      if (userContext) {
        // Only superadmin and admin can create departments
        if (userContext.role !== 'super_admin' && userContext.role !== 'admin') {
          throw new Error('Du har ikke tilgang til å opprette avdelinger. Kun administratorer kan opprette avdelinger.');
        }
      }

      // Helper function to remove undefined and null values
      const cleanObject = (obj: any): any => {
        if (obj === null || obj === undefined) {
          return undefined;
        }
        if (Array.isArray(obj)) {
          const cleaned = obj.map(cleanObject).filter(item => item !== undefined);
          return cleaned.length > 0 ? cleaned : [];
        }
        if (typeof obj === 'object') {
          const cleaned: any = {};
          for (const [key, value] of Object.entries(obj)) {
            const cleanedValue = cleanObject(value);
            if (cleanedValue !== undefined && cleanedValue !== null) {
              cleaned[key] = cleanedValue;
            }
          }
          return cleaned;
        }
        return obj;
      };

      // Remove undefined and null values to avoid Firebase errors
      const cleanDepartmentData = cleanObject({
        ...departmentData,
        employeeCount: 0
      });

      // Ensure required fields are present
      if (!cleanDepartmentData || !cleanDepartmentData.name) {
        throw new Error('Missing required fields: name');
      }

      const now = new Date().toISOString();
      const docRef = await addDoc(collection(firestore, 'departments'), {
        ...cleanDepartmentData,
        createdAt: now,
        updatedAt: now
      });

      // Log access for audit trail
      if (userContext) {
        const logMetadata: Record<string, unknown> = {
          departmentName: departmentData.name
        };
        await this.logAccess('create_department', userContext.userId, 'department', docRef.id, logMetadata);
      }

      return docRef.id;
    } catch (error) {
      console.error('Error creating department:', error);
      throw error;
    }
  }

  async updateDepartment(id: string, data: Partial<Department>, userContext?: UserAccessContext): Promise<void> {
    const firestore = ensureDb();

    try {
      // Get department data before update for audit log
      const departmentDoc = await getDoc(doc(firestore, 'departments', id));
      const departmentData = departmentDoc.exists() ? departmentDoc.data() as Department : null;
      
      // Helper function to remove undefined and null values
      const cleanObject = (obj: any): any => {
        if (obj === null || obj === undefined) {
          return undefined;
        }
        if (Array.isArray(obj)) {
          const cleaned = obj.map(cleanObject).filter(item => item !== undefined);
          return cleaned.length > 0 ? cleaned : [];
        }
        if (typeof obj === 'object') {
          const cleaned: any = {};
          for (const [key, value] of Object.entries(obj)) {
            const cleanedValue = cleanObject(value);
            if (cleanedValue !== undefined && cleanedValue !== null) {
              cleaned[key] = cleanedValue;
            }
          }
          return cleaned;
        }
        return obj;
      };

      // Remove undefined and null values to avoid Firebase errors
      const cleanData = cleanObject(data);

      await updateDoc(doc(firestore, 'departments', id), {
        ...cleanData,
        updatedAt: new Date().toISOString()
      });
      
      // Log access for audit trail
      if (userContext && departmentData) {
        const logMetadata: Record<string, unknown> = {
          departmentName: departmentData.name,
          updatedFields: Object.keys(cleanData || {})
        };
        await this.logAccess('update_department', userContext.userId, 'department', id, logMetadata);
      }
    } catch (error) {
      console.error('Error updating department:', error);
      throw error;
    }
  }

  async deleteDepartment(id: string, userContext?: UserAccessContext): Promise<void> {
    const firestore = ensureDb();

    try {
      // Get department data before deletion for audit log
      const departmentDoc = await getDoc(doc(firestore, 'departments', id));
      const departmentData = departmentDoc.exists() ? departmentDoc.data() as Department : null;
      
      await deleteDoc(doc(firestore, 'departments', id));
      
      // Log access for audit trail
      if (userContext && departmentData) {
        const logMetadata: Record<string, unknown> = {
          departmentName: departmentData.name
        };
        await this.logAccess('delete_department', userContext.userId, 'department', id, logMetadata);
      }
    } catch (error) {
      console.error('Error deleting department:', error);
      throw error;
    }
  }

  // Shift Management
  async getShifts(filters?: { departmentId?: string; status?: string; date?: string }): Promise<Shift[]> {
    const firestore = ensureDb();

    try {
      let q = query(collection(firestore, 'shifts'));

      if (filters?.departmentId) {
        q = query(q, where('departmentId', '==', filters.departmentId));
      }
      if (filters?.status) {
        q = query(q, where('status', '==', filters.status));
      }

      const snapshot = await getDocs(q);
      const shifts = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Shift[];
      
      // Sort by startTime in memory
      shifts.sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
      return shifts;
    } catch (error) {
      console.error('Error fetching shifts:', error);
      return [];
    }
  }

  async createShift(shiftData: Omit<Shift, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const firestore = ensureDb();

    try {
      const now = new Date().toISOString();
      const docRef = await addDoc(collection(firestore, 'shifts'), {
        ...shiftData,
        createdAt: now,
        updatedAt: now
      });

      await this.createActivity({
        type: 'shift_created',
        title: 'Nytt skift opprettet',
        description: `Skift opprettet for ${shiftData.startTime}`,
        userId: shiftData.employeeId,
        userName: 'System',
      });

      return docRef.id;
    } catch (error) {
      console.error('Error creating shift:', error);
      throw error;
    }
  }

  async updateShift(id: string, data: Partial<Shift>): Promise<void> {
    const firestore = ensureDb();

    try {
      await updateDoc(doc(firestore, 'shifts', id), {
        ...data,
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error updating shift:', error);
      throw error;
    }
  }

  // Deviation Management
  async getDeviations(filters?: { status?: string; type?: string; severity?: string }): Promise<Deviation[]> {
    const firestore = ensureDb();

    try {
      let q;
      
      // Filter based on role and department
      if (userContext) {
        if (userContext.role === 'super_admin' || userContext.role === 'admin') {
          // Superadmin and admin see all deviations
          q = query(collection(firestore, 'deviations'));
        } else if (userContext.role === 'department_leader' && userContext.departmentId) {
          // Department leaders only see deviations from their department
          q = query(
            collection(firestore, 'deviations'),
            where('departmentId', '==', userContext.departmentId)
          );
        } else if (userContext.role === 'employee') {
          // Employees only see their own deviations
          q = query(
            collection(firestore, 'deviations'),
            where('reportedBy', '==', userContext.userId)
          );
        } else {
          return [];
        }
      } else {
        // Fallback: if no context provided, return all
        q = query(collection(firestore, 'deviations'));
      }

      if (filters?.status) {
        q = query(q, where('status', '==', filters.status));
      }
      if (filters?.type) {
        q = query(q, where('type', '==', filters.type));
      }
      if (filters?.severity) {
        q = query(q, where('severity', '==', filters.severity));
      }

      const snapshot = await getDocs(q);
      const deviations = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Deviation[];
      
      // Log access
      if (userContext) {
        const logMetadata: Record<string, unknown> = {
          count: deviations.length
        };
        if (userContext.departmentId) {
          logMetadata.departmentId = userContext.departmentId;
        }
        await this.logAccess('view_deviations', userContext.userId, 'deviations', 'list', logMetadata);
      }
      
      // Sort in-memory by createdAt descending
      return deviations.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } catch (error) {
      console.error('Error fetching deviations:', error);
      return [];
    }
  }

  async createDeviation(deviationData: Omit<Deviation, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const firestore = ensureDb();

    try {
      const now = new Date().toISOString();
      const docRef = await addDoc(collection(firestore, 'deviations'), {
        ...deviationData,
        createdAt: now,
        updatedAt: now
      });

      await this.createActivity({
        type: 'deviation_reported',
        title: 'Avvik rapportert',
        description: deviationData.title,
        userId: deviationData.reportedBy,
        userName: 'System',
              });

      return docRef.id;
    } catch (error) {
      console.error('Error creating deviation:', error);
      throw error;
    }
  }

  async updateDeviation(id: string, data: Partial<Deviation>): Promise<void> {
    const firestore = ensureDb();

    try {
      await updateDoc(doc(firestore, 'deviations', id), {
        ...data,
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error updating deviation:', error);
      throw error;
    }
  }

  // Document Management with GDPR filtering
  async getDocuments(filters?: { category?: string; departmentId?: string }): Promise<Document[]> {
    const firestore = ensureDb();

    try {
      let q;
      
      // Filter based on role and department
      if (userContext) {
        if (userContext.role === 'super_admin' || userContext.role === 'admin') {
          // Superadmin and admin see all documents
          q = query(collection(firestore, 'documents'));
        } else if (userContext.role === 'department_leader' && userContext.departmentId) {
          // Department leaders only see documents from their department
          q = query(
            collection(firestore, 'documents'),
            where('departmentId', '==', userContext.departmentId)
          );
        } else if (userContext.role === 'employee') {
          // Employees only see their own documents
          q = query(
            collection(firestore, 'documents'),
            where('uploadedBy', '==', userContext.userId)
          );
        } else {
          return [];
        }
      } else {
        // Fallback: if no context provided, return all
        q = query(collection(firestore, 'documents'));
      }

      if (filters?.category) {
        q = query(q, where('category', '==', filters.category));
      }
      if (filters?.departmentId && (userContext?.role === 'super_admin' || userContext?.role === 'admin')) {
        // Only admins can filter by departmentId (department leaders are already filtered)
        q = query(q, where('departmentId', '==', filters.departmentId));
      }

      const snapshot = await getDocs(q);
      const documents = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Document[];
      
      // Log access
      if (userContext) {
        const logMetadata: Record<string, unknown> = {
          count: documents.length
        };
        if (userContext.departmentId) {
          logMetadata.departmentId = userContext.departmentId;
        }
        await this.logAccess('view_documents', userContext.userId, 'documents', 'list', logMetadata);
      }
      
      // Sort in-memory by createdAt descending
      return documents.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } catch (error) {
      console.error('Error fetching documents:', error);
      return [];
    }
  }

  async uploadDocument(file: File, documentData: Omit<Document, 'id' | 'fileUrl' | 'fileSize' | 'fileType' | 'fileName' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const firestore = ensureDb();

    try {
      let fileUrl: string = '';
      let storageType: 'onedrive' | 'firebase' = 'firebase';
      let oneDriveItemId: string | undefined;

      // Try OneDrive first (app-only authentication - permanent access)
      try {
        // Import app-only service dynamically to avoid SSR issues
        const { oneDriveAppOnlyService } = await import('./onedrive-app-only-service');
        
        // Check if OneDrive is available (app-only configured)
        const isAvailable = await oneDriveAppOnlyService.isAvailable();
        
        if (isAvailable) {
          console.log('📁 Uploading to OneDrive (app-only)...');
          // Generic dokumenter legges under en egen side-mappe i OneDrive
          const folderPath = `DriftPro/Dokumenter/MaviLogistikk`;
          const oneDriveResult = await oneDriveAppOnlyService.uploadFile(
            file,
            folderPath,
            undefined, // Use original filename
            undefined // Use default user from env
          );
          
          if (oneDriveResult.success && oneDriveResult.fileId && oneDriveResult.downloadUrl) {
            fileUrl = oneDriveResult.downloadUrl;
            oneDriveItemId = oneDriveResult.fileId;
            storageType = 'onedrive';
            console.log('✅ File uploaded to OneDrive:', oneDriveResult.fileName);
          } else {
            throw new Error(oneDriveResult.error || 'OneDrive upload failed');
          }
        } else {
          console.log('ℹ️ OneDrive app-only ikke konfigurert, bruker Firebase Storage');
        }
      } catch (onedriveError) {
        console.warn('⚠️ OneDrive upload failed, falling back to Firebase Storage:', onedriveError);
        // Fall back to Firebase Storage
      }

      // Fall back to Firebase Storage if OneDrive failed or not available
      if (storageType === 'firebase' || !fileUrl) {
        if (!storage) throw new Error('Firebase Storage not initialized');
      const fileName = `${Date.now()}_${file.name}`;
      const storageRef = ref(storage, `documents/MaviLogistikk/${fileName}`);
      await uploadBytes(storageRef, file);
        fileUrl = await getDownloadURL(storageRef);
        console.log('✅ File uploaded to Firebase Storage');
      }

      // Create document record
      const now = new Date().toISOString();
      const docRef = await addDoc(collection(firestore, 'documents'), {
        ...documentData,
        fileName: file.name,
        fileUrl,
        fileSize: file.size,
        fileType: file.type,
        storageType, // Track which storage was used
        oneDriveItemId, // Store OneDrive item ID if used
        createdAt: now,
        updatedAt: now
      });

      await this.createActivity({
        type: 'document_uploaded',
        title: 'Dokument lastet opp',
        description: documentData.title,
        userId: documentData.uploadedBy,
        userName: 'System',
              });

      return docRef.id;
    } catch (error) {
      console.error('Error uploading document:', error);
      throw error;
    }
  }

  async deleteDocument(id: string, fileUrl: string): Promise<void> {
    const firestore = ensureDb();

    try {
      // Get document to check storage type
      const docRef = doc(firestore, 'documents', id);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const docData = docSnap.data();
        const storageType = docData.storageType || 'firebase';
        const oneDriveItemId = docData.oneDriveItemId;

        // Delete from appropriate storage
        if (storageType === 'onedrive' && oneDriveItemId) {
          try {
            console.log('🗑️ Deleting from OneDrive (app-only)...');
            // Use app-only service for deletion
            const { oneDriveAppOnlyService } = await import('./onedrive-app-only-service');
            const result = await oneDriveAppOnlyService.deleteFile(oneDriveItemId);
            
            if (result.success) {
              console.log('✅ File deleted from OneDrive');
            } else {
              console.warn('⚠️ OneDrive deletion failed:', result.error);
            }
          } catch (onedriveError) {
            console.warn('⚠️ OneDrive deletion failed:', onedriveError);
            // Continue with database deletion even if storage deletion fails
          }
        } else {
          // Delete from Firebase Storage
          if (!storage) throw new Error('Firebase Storage not initialized');
      const storageRef = ref(storage, fileUrl);
      await deleteObject(storageRef);
          console.log('✅ File deleted from Firebase Storage');
        }
      }

      // Delete from database
      await deleteDoc(docRef);
    } catch (error) {
      console.error('Error deleting document:', error);
      throw error;
    }
  }

  // Time Clock Management
  async getTimeClocks(): Promise<TimeClock[]> {
    const firestore = ensureDb();

    try {
      let q = query(collection(firestore, 'timeclocks'));

      if (filters?.employeeId) {
        q = query(q, where('employeeId', '==', filters.employeeId));
      }

      const snapshot = await getDocs(q);
      const timeClocks = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as TimeClock[];

      // Sort by creation date (newest first) in memory
      return timeClocks.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } catch (error) {
      console.error('Error fetching time clocks:', error);
      return [];
    }
  }

  async clockIn(employeeId: string, location?: string): Promise<string> {
    const firestore = ensureDb();

    try {
      const now = new Date().toISOString();
      const docRef = await addDoc(collection(firestore, 'timeclocks'), {
        employeeId,
        clockInTime: now,
        location,
        createdAt: now,
        updatedAt: now
      });

      await this.createActivity({
        type: 'timeclock_event',
        title: 'Innstempling',
        description: 'Ansatt stempler inn',
        userId: employeeId,
        userName: 'System'
      });

      return docRef.id;
    } catch (error) {
      console.error('Error clocking in:', error);
      throw error;
    }
  }

  async clockOut(timeClockId: string): Promise<void> {
    const firestore = ensureDb();

    try {
      const now = new Date().toISOString();
      await updateDoc(doc(firestore, 'timeclocks', timeClockId), {
        clockOutTime: now,
        updatedAt: now
      });
    } catch (error) {
      console.error('Error clocking out:', error);
      throw error;
    }
  }

  // Absence Management
  async getAbsences(filters?: { employeeId?: string; status?: string }): Promise<Absence[]> {
    const firestore = ensureDb();

    try {
      let q;
      
      // GDPR: Filter based on role and department
      if (userContext) {
        if (userContext.role === 'super_admin' || userContext.role === 'admin') {
          // Superadmin and admin see all absences
          q = query(collection(firestore, 'absences'));
        } else if (userContext.role === 'department_leader' && userContext.departmentId) {
          // Department leaders see absences from their department employees
          // First, get all employees in the department
          const departmentEmployees = await this.getEmployees(userContext);
          const employeeIds = departmentEmployees.map(emp => emp.id);
          
          if (employeeIds.length === 0) {
            return [];
          }
          
          // Firestore 'in' query supports up to 10 items, so we need to batch if more
          if (employeeIds.length <= 10) {
            q = query(
              collection(firestore, 'absences'),
              
              where('employeeId', 'in', employeeIds)
            );
          } else {
            // If more than 10, we need to fetch all and filter in memory
            q = query(collection(firestore, 'absences'));
          }
        } else if (userContext.role === 'employee') {
          // Employees only see their own absences
          q = query(
            collection(firestore, 'absences'),
            where('employeeId', '==', userContext.userId)
          );
        } else {
          return [];
        }
      } else {
        // Fallback: if no context provided, return all (for backward compatibility)
        q = query(collection(firestore, 'absences'));
      }

      if (filters?.employeeId) {
        // Additional filter for specific employee (if user has access)
        if (userContext) {
          if (userContext.role === 'employee' && filters.employeeId !== userContext.userId) {
            // Employee trying to access another employee's absences
            return [];
          }
          if (userContext.role === 'department_leader' && userContext.departmentId) {
            // Check if employee is in leader's department
            const employee = await this.getEmployee(filters.employeeId, userContext);
            if (!employee || employee.departmentId !== userContext.departmentId) {
              return [];
            }
          }
        }
        q = query(q, where('employeeId', '==', filters.employeeId));
      }
      if (filters?.status) {
        q = query(q, where('status', '==', filters.status));
      }

      const snapshot = await getDocs(q);
      let absences = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Absence[];

      // If department leader has more than 10 employees, filter in memory
      if (userContext?.role === 'department_leader' && userContext.departmentId) {
        const departmentEmployees = await this.getEmployees(userContext);
        const employeeIds = new Set(departmentEmployees.map(emp => emp.id));
        absences = absences.filter(absence => employeeIds.has(absence.employeeId));
      }

      // Log access
      if (userContext) {
        const logMetadata: Record<string, unknown> = {
          count: absences.length
        };
        if (userContext.departmentId) {
          logMetadata.departmentId = userContext.departmentId;
        }
        await this.logAccess('view_absences', userContext.userId, 'absences', 'list', logMetadata);
      }

      // Sort by creation date (newest first) in memory
      return absences.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } catch (error) {
      console.error('Error fetching absences:', error);
      return [];
    }
  }

  async createAbsence(absenceData: Omit<Absence, 'id' | 'createdAt' | 'updatedAt'>, userContext?: UserAccessContext): Promise<string> {
    const firestore = ensureDb();

    try {
      const now = new Date().toISOString();
      const docRef = await addDoc(collection(firestore, 'absences'), {
        ...absenceData,
        createdAt: now,
        updatedAt: now
      });
      
      // Log access for audit trail
      if (userContext) {
        const logMetadata: Record<string, unknown> = {
          employeeId: absenceData.employeeId,
          employeeName: absenceData.employeeName,
          type: absenceData.type,
          startDate: absenceData.startDate,
          endDate: absenceData.endDate,
          status: absenceData.status
        };
        // Note: departmentId is not part of Absence interface, but can be derived from employee if needed
        await this.logAccess('create_absence', userContext.userId, 'absence', docRef.id, logMetadata);
      }
      
      return docRef.id;
    } catch (error) {
      console.error('Error creating absence:', error);
      throw error;
    }
  }

  async updateAbsence(id: string, data: Partial<Absence>, userContext?: UserAccessContext): Promise<void> {
    const firestore = ensureDb();

    try {
      // Get absence data before update for audit log
      const absenceDoc = await getDoc(doc(firestore, 'absences', id));
      const absenceData = absenceDoc.exists() ? absenceDoc.data() as Absence : null;
      
      await updateDoc(doc(firestore, 'absences', id), {
        ...data,
        updatedAt: new Date().toISOString()
      });
      
      // Log access for audit trail
      if (userContext && absenceData) {
        const logMetadata: Record<string, unknown> = {
          employeeId: absenceData.employeeId,
          employeeName: absenceData.employeeName,
          type: absenceData.type,
          updatedFields: Object.keys(data)
        };
        // Note: departmentId is not part of Absence interface, but can be derived from employee if needed
        await this.logAccess('update_absence', userContext.userId, 'absence', id, logMetadata);
      }
    } catch (error) {
      console.error('Error updating absence:', error);
      throw error;
    }
  }

  async deleteAbsence(id: string, userContext?: UserAccessContext): Promise<void> {
    const firestore = ensureDb();

    try {
      // Get absence data before deletion for audit log
      const absenceDoc = await getDoc(doc(firestore, 'absences', id));
      const absenceData = absenceDoc.exists() ? absenceDoc.data() as Absence : null;
      
      await deleteDoc(doc(firestore, 'absences', id));
      
      // Log access for audit trail
      if (userContext && absenceData) {
        const logMetadata: Record<string, unknown> = {
          employeeId: absenceData.employeeId,
          employeeName: absenceData.employeeName,
          type: absenceData.type,
          startDate: absenceData.startDate,
          endDate: absenceData.endDate
        };
        // Note: departmentId is not part of Absence interface, but can be derived from employee if needed
        await this.logAccess('delete_absence', userContext.userId, 'absence', id, logMetadata);
      }
    } catch (error) {
      console.error('Error deleting absence:', error);
      throw error;
    }
  }

  // Vacation Management with GDPR filtering
  async getVacations(filters?: { employeeId?: string; status?: string }): Promise<Vacation[]> {
    const firestore = ensureDb();

    try {
      let q;
      
      // GDPR: Filter based on role and department
      if (userContext) {
        if (userContext.role === 'super_admin' || userContext.role === 'admin') {
          // Superadmin and admin see all vacations
          q = query(
        collection(firestore, 'vacations'),
        
      );
        } else if (userContext.role === 'department_leader' && userContext.departmentId) {
          // Department leaders see vacations from their department employees
          // First, get all employees in the department
          const departmentEmployees = await this.getEmployees(userContext);
          const employeeIds = departmentEmployees.map(emp => emp.id);
          
          if (employeeIds.length === 0) {
            return [];
          }
          
          // Firestore 'in' query supports up to 10 items, so we need to batch if more
          if (employeeIds.length <= 10) {
            q = query(
              collection(firestore, 'vacations'),
              
              where('employeeId', 'in', employeeIds)
            );
          } else {
            // If more than 10, we need to fetch all and filter in memory
            q = query(collection(firestore, 'vacations'));
          }
        } else if (userContext.role === 'employee') {
          // Employees only see their own vacations
          q = query(
            collection(firestore, 'vacations'),
            where('employeeId', '==', userContext.userId)
          );
        } else {
          return [];
        }
      } else {
        // Fallback: if no context provided, return all (for backward compatibility)
        q = query(collection(firestore, 'vacations'));
      }

      if (filters?.employeeId) {
        // Additional filter for specific employee (if user has access)
        if (userContext) {
          if (userContext.role === 'employee' && filters.employeeId !== userContext.userId) {
            // Employee trying to access another employee's vacations
            return [];
          }
          if (userContext.role === 'department_leader' && userContext.departmentId) {
            // Check if employee is in leader's department
            const employee = await this.getEmployee(filters.employeeId, userContext);
            if (!employee || employee.departmentId !== userContext.departmentId) {
              return [];
            }
          }
        }
        q = query(q, where('employeeId', '==', filters.employeeId));
      }
      if (filters?.status) {
        q = query(q, where('status', '==', filters.status));
      }

      const snapshot = await getDocs(q);
      let vacations = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Vacation[];

      // If department leader has more than 10 employees, filter in memory
      if (userContext?.role === 'department_leader' && userContext.departmentId) {
        const departmentEmployees = await this.getEmployees(userContext);
        const employeeIds = new Set(departmentEmployees.map(emp => emp.id));
        vacations = vacations.filter(vacation => employeeIds.has(vacation.employeeId));
      }

      // Log access
      if (userContext) {
        const logMetadata: Record<string, unknown> = {
          count: vacations.length
        };
        if (userContext.departmentId) {
          logMetadata.departmentId = userContext.departmentId;
        }
        await this.logAccess('view_vacations', userContext.userId, 'vacations', 'list', logMetadata);
      }

      // Sort by creation date (newest first) in memory
      return vacations.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } catch (error) {
      console.error('Error fetching vacations:', error);
      return [];
    }
  }

  async createVacation(vacationData: Omit<Vacation, 'id' | 'createdAt' | 'updatedAt'>, userContext?: UserAccessContext): Promise<string> {
    const firestore = ensureDb();

    try {
      const now = new Date().toISOString();
      const docRef = await addDoc(collection(firestore, 'vacations'), {
        ...vacationData,
        createdAt: now,
        updatedAt: now
      });
      
      // Log access for audit trail
      if (userContext) {
        const logMetadata: Record<string, unknown> = {
          employeeId: vacationData.employeeId,
          employeeName: vacationData.employeeName,
          startDate: vacationData.startDate,
          endDate: vacationData.endDate,
          days: vacationData.days,
          status: vacationData.status
        };
        await this.logAccess('create_vacation', userContext.userId, 'vacation', docRef.id, logMetadata);
      }
      
      return docRef.id;
    } catch (error) {
      console.error('Error creating vacation:', error);
      throw error;
    }
  }

  async updateVacation(id: string, data: Partial<Vacation>, userContext?: UserAccessContext): Promise<void> {
    const firestore = ensureDb();

    try {
      // Get vacation data before update for audit log
      const vacationDoc = await getDoc(doc(firestore, 'vacations', id));
      const vacationData = vacationDoc.exists() ? vacationDoc.data() as Vacation : null;
      
      await updateDoc(doc(firestore, 'vacations', id), {
        ...data,
        updatedAt: new Date().toISOString()
      });
      
      // Log access for audit trail
      if (userContext && vacationData) {
        const logMetadata: Record<string, unknown> = {
          employeeId: vacationData.employeeId,
          employeeName: vacationData.employeeName,
          updatedFields: Object.keys(data),
          status: data.status || vacationData.status
        };
        await this.logAccess('update_vacation', userContext.userId, 'vacation', id, logMetadata);
      }
    } catch (error) {
      console.error('Error updating vacation:', error);
      throw error;
    }
  }

  async deleteVacation(id: string, userContext?: UserAccessContext): Promise<void> {
    const firestore = ensureDb();

    try {
      // Get vacation data before deletion for audit log
      const vacationDoc = await getDoc(doc(firestore, 'vacations', id));
      const vacationData = vacationDoc.exists() ? vacationDoc.data() as Vacation : null;
      
      await deleteDoc(doc(firestore, 'vacations', id));
      
      // Log access for audit trail
      if (userContext && vacationData) {
        const logMetadata: Record<string, unknown> = {
          employeeId: vacationData.employeeId,
          employeeName: vacationData.employeeName,
          startDate: vacationData.startDate,
          endDate: vacationData.endDate,
          days: vacationData.days
        };
        await this.logAccess('delete_vacation', userContext.userId, 'vacation', id, logMetadata);
      }
    } catch (error) {
      console.error('Error deleting vacation:', error);
      throw error;
    }
  }

  // Vacation Allocation Management
  async getVacationAllocations( filters?: { employeeId?: string; year?: number }): Promise<VacationAllocation[]> {
    const firestore = ensureDb();

    try {
      let q = query(
        collection(firestore, 'vacationAllocations'),
        
      );

      if (filters?.employeeId) {
        q = query(q, where('employeeId', '==', filters.employeeId));
      }
      if (filters?.year) {
        q = query(q, where('year', '==', filters.year));
      }

      const snapshot = await getDocs(q);
      const allocations = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as VacationAllocation[];

      return allocations.sort((a, b) => b.year - a.year);
    } catch (error) {
      console.error('Error fetching vacation allocations:', error);
      return [];
    }
  }

  async createOrUpdateVacationAllocation(allocationData: Omit<VacationAllocation, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const firestore = ensureDb();

    try {
      // Check if allocation already exists
      const existingQuery = query(
        collection(firestore, 'vacationAllocations'),
        where('employeeId', '==', allocationData.employeeId),
        where('year', '==', allocationData.year)
      );
      const existingSnapshot = await getDocs(existingQuery);

      const now = new Date().toISOString();
      const allocationDataWithDates = {
        ...allocationData,
        remainingDays: allocationData.allocatedDays + allocationData.transferredDays - allocationData.usedDays,
        updatedAt: now
      };

      if (existingSnapshot.empty) {
        // Create new allocation
        const docRef = await addDoc(collection(firestore, 'vacationAllocations'), {
          ...allocationDataWithDates,
          createdAt: now
        });
        return docRef.id;
      } else {
        // Update existing allocation
        const existingDoc = existingSnapshot.docs[0];
        await updateDoc(doc(firestore, 'vacationAllocations', existingDoc.id), allocationDataWithDates);
        return existingDoc.id;
      }
    } catch (error) {
      console.error('Error creating/updating vacation allocation:', error);
      throw error;
    }
  }

  async transferVacationDays(employeeId: string, fromYear: number, toYear: number, days: number): Promise<void> {
    const firestore = ensureDb();

    try {
      // Get allocations for both years
      const fromYearQuery = query(
        collection(firestore, 'vacationAllocations'),
        
        where('employeeId', '==', employeeId),
        where('year', '==', fromYear)
      );
      const toYearQuery = query(
        collection(firestore, 'vacationAllocations'),
        
        where('employeeId', '==', employeeId),
        where('year', '==', toYear)
      );

      const [fromSnapshot, toSnapshot] = await Promise.all([
        getDocs(fromYearQuery),
        getDocs(toYearQuery)
      ]);

      const now = new Date().toISOString();

      // Update from year
      if (!fromSnapshot.empty) {
        const fromDoc = fromSnapshot.docs[0];
        const fromData = fromDoc.data() as VacationAllocation;
        await updateDoc(doc(firestore, 'vacationAllocations', fromDoc.id), {
          remainingDays: fromData.remainingDays - days,
          updatedAt: now
        });
      }

      // Update to year
      if (!toSnapshot.empty) {
        const toDoc = toSnapshot.docs[0];
        const toData = toDoc.data() as VacationAllocation;
        await updateDoc(doc(firestore, 'vacationAllocations', toDoc.id), {
          transferredDays: (toData.transferredDays || 0) + days,
          remainingDays: toData.remainingDays + days,
          updatedAt: now
        });
      } else {
        // Create new allocation for to year
        await addDoc(collection(firestore, 'vacationAllocations'), {
          employeeId,
          year: toYear,
          allocatedDays: 25, // Standard 5 weeks
          usedDays: 0,
          transferredDays: days,
          remainingDays: 25 + days,
          createdAt: now,
          updatedAt: now
        });
      }
    } catch (error) {
      console.error('Error transferring vacation days:', error);
      throw error;
    }
  }

  // Dashboard Statistics
  async getDashboardStats(): Promise<DashboardStats> {
    const firestore = ensureDb();

    try {
      const [
        employeesSnapshot,
        activeShiftsSnapshot,
        pendingVacationsSnapshot,
        departmentsSnapshot,
        deviationsSnapshot,
        openDeviationsSnapshot,
        documentsSnapshot,
        activeTimeClocksSnapshot
      ] = await Promise.all([
        getDocs(query(collection(firestore, 'users'))),
        getDocs(query(collection(firestore, 'shifts'),  where('status', '==', 'in_progress'))),
        getDocs(query(collection(firestore, 'vacations'),  where('status', '==', 'pending'))),
        getDocs(query(collection(firestore, 'departments'))),
        getDocs(query(collection(firestore, 'deviations'))),
        getDocs(query(collection(firestore, 'deviations'),  where('status', 'in', ['reported', 'investigating']))),
        getDocs(query(collection(firestore, 'documents'))),
        getDocs(query(collection(firestore, 'timeclocks'),  where('clockOutTime', '==', null)))
      ]);

      return {
        totalEmployees: employeesSnapshot.size,
        activeShifts: activeShiftsSnapshot.size,
        pendingRequests: pendingVacationsSnapshot.size,
        departments: departmentsSnapshot.size,
        totalDeviations: deviationsSnapshot.size,
        openDeviations: openDeviationsSnapshot.size,
        totalDocuments: documentsSnapshot.size,
        activeTimeClocks: activeTimeClocksSnapshot.size
      };
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      return {
        totalEmployees: 0,
        activeShifts: 0,
        pendingRequests: 0,
        departments: 0,
        totalDeviations: 0,
        openDeviations: 0,
        totalDocuments: 0,
        activeTimeClocks: 0
      };
    }
  }

  // Activity Logging
  async getActivities(): Promise<Activity[]> {
    const firestore = ensureDb();

    try {
      const q = query(
        collection(firestore, 'activities'),
        
      );
      const snapshot = await getDocs(q);
      const activities = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Activity[];
      
      // Sort by createdAt in memory and limit
      activities.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      return activities.slice(0, limitCount);
    } catch (error) {
      console.error('Error fetching activities:', error);
      return [];
    }
  }

  async createActivity(activityData: Omit<Activity, 'id' | 'createdAt'>): Promise<void> {
    const firestore = ensureDb();

    try {
      await addDoc(collection(firestore, 'activities'), {
        ...activityData,
        createdAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error creating activity:', error);
    }
  }

  // Real-time listeners
  subscribeToDashboardStats(callback: (stats: DashboardStats) => void) {
    const firestore = ensureDb();

    // For real-time stats, we'll use a combination of listeners
    const unsubscribe = onSnapshot(
      query(collection(firestore, 'users')),
      async () => {
        const stats = await this.getDashboardStats();
        callback(stats);
      }
    );

    return unsubscribe;
  }

  subscribeToActivities(callback: (activities: Activity[]) => void) {
    const firestore = ensureDb();

    const q = query(
      collection(firestore, 'activities'),
      
    );

    return onSnapshot(q, (snapshot) => {
      const activities = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Activity[];
      
      // Sort by createdAt in memory and limit
      activities.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      callback(activities.slice(0, 10));
    });
  }

  // Company Management
  async getCompanies(): Promise<Company[]> {
    if (typeof window === 'undefined') {
      console.log('Server-side rendering, returning empty companies array');
      return [];
    }

    const firestore = ensureDb();

    try {
      console.log('Fetching companies from Firebase...');
      const companiesQuery = collection(firestore, 'companies');
      const snapshot = await getDocs(companiesQuery);
      console.log('Companies snapshot size:', snapshot.docs.length);
      
      const companies = snapshot.docs.map(doc => {
        const data = doc.data();
        console.log('Company data:', doc.id, data.name);
        return {
          id: doc.id,
          ...data
        };
      }) as Company[];
      
      // Sort by createdAt in memory
      companies.sort((a, b) => {
        const dateA = new Date(a.createdAt || 0).getTime();
        const dateB = new Date(b.createdAt || 0).getTime();
        return dateB - dateA;
      });
      
      console.log('Returning companies:', companies.length);
      return companies;
    } catch (error) {
      console.error('Error fetching companies:', error);
      return [];
    }
  }

  async getCompany(id: string): Promise<Company | null> {
    if (typeof window === 'undefined') {
      console.log('Server-side rendering, returning null company');
      return null;
    }

    const firestore = ensureDb();

    try {
      const docRef = doc(firestore, 'companies', id);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return {
          id: docSnap.id,
          ...docSnap.data()
        } as Company;
      }
      return null;
    } catch (error) {
      console.error('Error fetching company:', error);
      return null;
    }
  }

  async createCompany(companyData: Omit<Company, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const firestore = ensureDb();

    try {
      // Check if company with same name already exists
      const existingCompaniesQuery = query(
        collection(firestore, 'companies'),
        where('name', '==', companyData.name)
      );
      const existingSnapshot = await getDocs(existingCompaniesQuery);
      
      if (!existingSnapshot.empty) {
        throw new Error(`En bedrift med navnet "${companyData.name}" eksisterer allerede. Vennligst velg et annet navn.`);
      }

      const docRef = await addDoc(collection(firestore, 'companies'), {
        ...companyData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      return docRef.id;
    } catch (error) {
      console.error('Error creating company:', error);
      throw error;
    }
  }

  async createCompanyWithAdmin(companyData: any): Promise<{ companyId: string; adminUserId: string }> {
    if (typeof window === 'undefined') {
      throw new Error('Cannot create company on server-side');
    }

    const firestore = ensureDb();

    try {
      // Check if company with same name already exists
      const existingCompaniesQuery = query(
        collection(firestore, 'companies'),
        where('name', '==', companyData.name)
      );
      const existingSnapshot = await getDocs(existingCompaniesQuery);
      
      if (!existingSnapshot.empty) {
        throw new Error(`En bedrift med navnet "${companyData.name}" eksisterer allerede.`);
      }

      // Check if admin email already exists
      const existingUsersQuery = query(
        collection(firestore, 'users'),
        where('email', '==', companyData.adminEmail)
      );
      const existingUsersSnapshot = await getDocs(existingUsersQuery);
      
      if (!existingUsersSnapshot.empty) {
        throw new Error(`En bruker med e-post "${companyData.adminEmail}" eksisterer allerede.`);
      }

      // Create company
      const companyRef = await addDoc(collection(firestore, 'companies'), {
        name: companyData.name,
        orgNumber: companyData.orgNumber,
        phone: companyData.phone,
        email: companyData.email,
        address: companyData.address,
        industry: companyData.industry,
        adminEmail: companyData.adminEmail,
        employeeCount: 0,
        status: companyData.status,
        subscriptionPlan: companyData.subscriptionPlan,
        permissions: companyData.permissions || [],
        contactPerson: companyData.contactPerson,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });

      // Create admin user
      const adminUserId = `admin_${companyRef.id}`;
      await setDoc(doc(firestore, 'users', adminUserId), {
        displayName: companyData.adminName,
        email: companyData.adminEmail,
        role: 'admin',
                phone: companyData.adminPhone,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: 'active',
        permissions: companyData.permissions || []
      });

      // Create Firebase Authentication user
      const response = await fetch('/api/create-admin-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: companyData.adminEmail,
          password: companyData.adminPassword,
          displayName: companyData.adminName,
                  }),
      });

      if (!response.ok) {
        throw new Error('Kunne ikke opprette Firebase Authentication bruker');
      }

      const { uid } = await response.json();

      // Update user document with Firebase UID
      await updateDoc(doc(firestore, 'users', adminUserId), {
        uid: uid,
        updatedAt: new Date().toISOString()
      });

      return {
                adminUserId: adminUserId
      };
    } catch (error) {
      console.error('Error creating company with admin:', error);
      throw error;
    }
  }

  async updateCompany(id: string, data: Partial<Company>): Promise<void> {
    const firestore = ensureDb();

    try {
      // If name is being updated, check for duplicates
      if (data.name) {
        const existingCompaniesQuery = query(
          collection(firestore, 'companies'),
          where('name', '==', data.name)
        );
        const existingSnapshot = await getDocs(existingCompaniesQuery);
        
        // Check if any company with this name exists (excluding the current company being updated)
        const duplicateExists = existingSnapshot.docs.some(doc => doc.id !== id);
        
        if (duplicateExists) {
          throw new Error(`En bedrift med navnet "${data.name}" eksisterer allerede. Vennligst velg et annet navn.`);
        }
      }

      const docRef = doc(firestore, 'companies', id);
      await updateDoc(docRef, {
        ...data,
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error updating company:', error);
      throw error;
    }
  }

  async deleteCompany(id: string): Promise<void> {
    const firestore = ensureDb();

    try {
      // Delete all users associated with this company
      const usersQuery = query(collection(firestore, 'users'), where('companyId', '==', id));
      const usersSnapshot = await getDocs(usersQuery);
      const userDeletePromises = usersSnapshot.docs.map(async (userDoc) => {
        return deleteDoc(doc(firestore, 'users', userDoc.id));
      });

      // Delete all documents associated with this company
      const documentsQuery = query(collection(firestore, 'documents'), where('companyId', '==', id));
      const documentsSnapshot = await getDocs(documentsQuery);
      const documentDeletePromises = documentsSnapshot.docs.map(async (docDoc) => {
        return deleteDoc(doc(firestore, 'documents', docDoc.id));
      });

      // Delete all deviations associated with this company
      const deviationsQuery = query(collection(firestore, 'deviations'), where('companyId', '==', id));
      const deviationsSnapshot = await getDocs(deviationsQuery);
      const deviationDeletePromises = deviationsSnapshot.docs.map(async (deviationDoc) => {
        return deleteDoc(doc(firestore, 'deviations', deviationDoc.id));
      });

      // Delete all shifts associated with this company
      const shiftsQuery = query(collection(firestore, 'shifts'), where('companyId', '==', id));
      const shiftsSnapshot = await getDocs(shiftsQuery);
      const shiftDeletePromises = shiftsSnapshot.docs.map(async (shiftDoc) => {
        return deleteDoc(doc(firestore, 'shifts', shiftDoc.id));
      });

      // Delete all timeclock records associated with this company
      const timeclockQuery = query(collection(firestore, 'timeclock'), where('companyId', '==', id));
      const timeclockSnapshot = await getDocs(timeclockQuery);
      const timeclockDeletePromises = timeclockSnapshot.docs.map(async (timeclockDoc) => {
        return deleteDoc(doc(firestore, 'timeclock', timeclockDoc.id));
      });

      // Delete all vacations associated with this company
      const vacationsQuery = query(collection(firestore, 'vacations'), where('companyId', '==', id));
      const vacationsSnapshot = await getDocs(vacationsQuery);
      const vacationDeletePromises = vacationsSnapshot.docs.map(async (vacationDoc) => {
        return deleteDoc(doc(firestore, 'vacations', vacationDoc.id));
      });

      // Delete all departments associated with this company
      const departmentsQuery = query(collection(firestore, 'departments'), where('companyId', '==', id));
      const departmentsSnapshot = await getDocs(departmentsQuery);
      const departmentDeletePromises = departmentsSnapshot.docs.map(async (departmentDoc) => {
        return deleteDoc(doc(firestore, 'departments', departmentDoc.id));
      });

      // Delete all surveys associated with this company
      const surveysQuery = query(collection(firestore, 'surveys'), where('companyId', '==', id));
      const surveysSnapshot = await getDocs(surveysQuery);
      const surveyDeletePromises = surveysSnapshot.docs.map(async (surveyDoc) => {
        return deleteDoc(doc(firestore, 'surveys', surveyDoc.id));
      });

      // Delete all partners associated with this company
      const partnersQuery = query(collection(firestore, 'partners'), where('companyId', '==', id));
      const partnersSnapshot = await getDocs(partnersQuery);
      const partnerDeletePromises = partnersSnapshot.docs.map(async (partnerDoc) => {
        return deleteDoc(doc(firestore, 'partners', partnerDoc.id));
      });

      // Delete all settings associated with this company
      const settingsQuery = query(collection(firestore, 'settings'), where('companyId', '==', id));
      const settingsSnapshot = await getDocs(settingsQuery);
      const settingDeletePromises = settingsSnapshot.docs.map(async (settingDoc) => {
        return deleteDoc(doc(firestore, 'settings', settingDoc.id));
      });

      // Delete all activities associated with this company
      const activitiesQuery = query(collection(firestore, 'activities'), where('companyId', '==', id));
      const activitiesSnapshot = await getDocs(activitiesQuery);
      const activityDeletePromises = activitiesSnapshot.docs.map(async (activityDoc) => {
        return deleteDoc(doc(firestore, 'activities', activityDoc.id));
      });

      // Delete all chats associated with this company
      const chatsQuery = query(collection(firestore, 'chats'), where('companyId', '==', id));
      const chatsSnapshot = await getDocs(chatsQuery);
      const chatDeletePromises = chatsSnapshot.docs.map(async (chatDoc) => {
        // Delete all messages in this chat first
        const messagesQuery = query(collection(firestore, `chats/${chatDoc.id}/messages`));
        const messagesSnapshot = await getDocs(messagesQuery);
        const messageDeletePromises = messagesSnapshot.docs.map(async (messageDoc) => {
          return deleteDoc(doc(firestore, `chats/${chatDoc.id}/messages`, messageDoc.id));
        });
        await Promise.all(messageDeletePromises);
        
        // Then delete the chat itself
        return deleteDoc(doc(firestore, 'chats', chatDoc.id));
      });

      // Delete all survey responses associated with this company
      const surveyResponsesQuery = query(collection(firestore, 'surveyResponses'), where('companyId', '==', id));
      const surveyResponsesSnapshot = await getDocs(surveyResponsesQuery);
      const surveyResponseDeletePromises = surveyResponsesSnapshot.docs.map(async (responseDoc) => {
        return deleteDoc(doc(firestore, 'surveyResponses', responseDoc.id));
      });

      // Delete all admin setup tokens associated with this company
      const adminSetupTokensQuery = query(collection(firestore, 'adminSetupTokens'), where('companyId', '==', id));
      const adminSetupTokensSnapshot = await getDocs(adminSetupTokensQuery);
      const adminSetupTokenDeletePromises = adminSetupTokensSnapshot.docs.map(async (tokenDoc) => {
        return deleteDoc(doc(firestore, 'adminSetupTokens', tokenDoc.id));
      });

      // Delete all absences associated with this company
      const absencesQuery = query(collection(firestore, 'absences'), where('companyId', '==', id));
      const absencesSnapshot = await getDocs(absencesQuery);
      const absenceDeletePromises = absencesSnapshot.docs.map(async (absenceDoc) => {
        return deleteDoc(doc(firestore, 'absences', absenceDoc.id));
      });

      // Delete all notifications associated with this company
      const notificationsQuery = query(collection(firestore, 'notifications'), where('companyId', '==', id));
      const notificationsSnapshot = await getDocs(notificationsQuery);
      const notificationDeletePromises = notificationsSnapshot.docs.map(async (notificationDoc) => {
        return deleteDoc(doc(firestore, 'notifications', notificationDoc.id));
      });

      // Execute all delete operations
      await Promise.all([
        ...userDeletePromises,
        ...documentDeletePromises,
        ...deviationDeletePromises,
        ...shiftDeletePromises,
        ...timeclockDeletePromises,
        ...vacationDeletePromises,
        ...departmentDeletePromises,
        ...surveyDeletePromises,
        ...partnerDeletePromises,
        ...settingDeletePromises,
        ...activityDeletePromises,
        ...chatDeletePromises,
        ...surveyResponseDeletePromises,
        ...adminSetupTokenDeletePromises,
        ...absenceDeletePromises,
        ...notificationDeletePromises
      ]);

      // Finally, delete the company itself
      const docRef = doc(firestore, 'companies', id);
      await deleteDoc(docRef);
    } catch (error) {
      console.error('Error deleting company:', error);
      throw error;
    }
  }

  async getCompanyStats(): Promise<{
    totalEmployees: number;
    totalDepartments: number;
    totalDocuments: number;
    totalDeviations: number;
    activeShifts: number;
  }> {
    const firestore = ensureDb();

    try {
      const [employeesSnapshot, departmentsSnapshot, documentsSnapshot, deviationsSnapshot, shiftsSnapshot] = await Promise.all([
        getDocs(query(collection(firestore, 'users'))),
        getDocs(query(collection(firestore, 'departments'))),
        getDocs(query(collection(firestore, 'documents'))),
        getDocs(query(collection(firestore, 'deviations'))),
        getDocs(query(collection(firestore, 'shifts'),  where('status', '==', 'in_progress')))
      ]);

      return {
        totalEmployees: employeesSnapshot.size,
        totalDepartments: departmentsSnapshot.size,
        totalDocuments: documentsSnapshot.size,
        totalDeviations: deviationsSnapshot.size,
        activeShifts: shiftsSnapshot.size
      };
    } catch (error) {
      console.error('Error fetching company stats:', error);
      return {
        totalEmployees: 0,
        totalDepartments: 0,
        totalDocuments: 0,
        totalDeviations: 0,
        activeShifts: 0
      };
    }
  }

  // Survey methods
  async getSurveys(): Promise<Survey[]> {
    const firestore = ensureDb();

    try {
      const surveysQuery = query(
        collection(firestore, 'surveys'),
        
      );
      
      const snapshot = await getDocs(surveysQuery);
      const surveys = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Survey[];

      // Sort by creation date (newest first)
      return surveys.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } catch (error) {
      console.error('Error getting surveys:', error);
      return [];
    }
  }

  async createSurvey(surveyData: Omit<Survey, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const firestore = ensureDb();

    try {
      const docRef = await addDoc(collection(firestore, 'surveys'), {
        ...surveyData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });

      return docRef.id;
    } catch (error) {
      console.error('Error creating survey:', error);
      throw error;
    }
  }

  async updateSurvey(id: string, data: Partial<Survey>): Promise<void> {
    const firestore = ensureDb();

    try {
      await updateDoc(doc(firestore, 'surveys', id), {
        ...data,
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error updating survey:', error);
      throw error;
    }
  }

  async deleteSurvey(id: string): Promise<void> {
    const firestore = ensureDb();

    try {
      await deleteDoc(doc(firestore, 'surveys', id));
    } catch (error) {
      console.error('Error deleting survey:', error);
      throw error;
    }
  }

  async getSurveyResponses(surveyId: string): Promise<SurveyResponse[]> {
    const firestore = ensureDb();

    try {
      const responsesQuery = query(
        collection(firestore, 'surveyResponses'),
        where('surveyId', '==', surveyId)
      );
      
      const snapshot = await getDocs(responsesQuery);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as SurveyResponse[];
    } catch (error) {
      console.error('Error getting survey responses:', error);
      return [];
    }
  }

  async submitSurveyResponse(responseData: Omit<SurveyResponse, 'id' | 'submittedAt'>): Promise<string> {
    const firestore = ensureDb();

    try {
      const docRef = await addDoc(collection(firestore, 'surveyResponses'), {
        ...responseData,
        submittedAt: new Date().toISOString()
      });

      return docRef.id;
    } catch (error) {
      console.error('Error submitting survey response:', error);
      throw error;
    }
  }

  // Partner methods
  async getPartners(): Promise<Partner[]> {
    const firestore = ensureDb();

    try {
      const partnersQuery = query(
        collection(firestore, 'partners'),
        
      );
      
      const snapshot = await getDocs(partnersQuery);
      const partners = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Partner[];

      // Sort by creation date (newest first)
      return partners.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } catch (error) {
      console.error('Error getting partners:', error);
      return [];
    }
  }

  async createPartner(partnerData: Omit<Partner, 'id' | 'createdAt' | 'updatedAt'>, userContext?: UserAccessContext): Promise<string> {
    const firestore = ensureDb();

    try {
      const docRef = await addDoc(collection(firestore, 'partners'), {
        ...partnerData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });

      // Log access for audit trail
      if (userContext) {
        const logMetadata: Record<string, unknown> = {
          partnerName: partnerData.name,
          type: partnerData.type
        };
        await this.logAccess('create_partner', userContext.userId, 'partner', docRef.id, logMetadata);
      }

      return docRef.id;
    } catch (error) {
      console.error('Error creating partner:', error);
      throw error;
    }
  }

  // Route assignments
  async createRouteAssignment(assignmentData: {
    partnerId: string;
    partnerName: string;
    date: string;
    files: any[];
    title: string;
    job?: string;
    users?: string[];
        routeData?: any; // Added for permanent storage
  }): Promise<string> {
    const firestore = ensureDb();

    try {
      const docRef = await addDoc(collection(firestore, 'routeAssignments'), {
        ...assignmentData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        // Store routeData for permanent storage if provided
        ...(assignmentData.routeData && { routeData: assignmentData.routeData })
      });

      return docRef.id;
    } catch (error) {
      console.error('Error creating route assignment:', error);
      throw error;
    }
  }

  async getRouteAssignments( startDate?: string, endDate?: string): Promise<any[]> {
    const firestore = ensureDb();

    try {
      let q = query(collection(firestore, 'routeAssignments'));
      
      if (startDate && endDate) {
        q = query(
          collection(firestore, 'routeAssignments'), 
          
          where('date', '>=', startDate),
          where('date', '<=', endDate)
        );
      }
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error getting route assignments:', error);
      return [];
    }
  }

  async updateRouteAssignment(assignmentId: string, updateData: Partial<any>): Promise<void> {
    const firestore = ensureDb();

    try {
      await updateDoc(doc(firestore, 'routeAssignments', assignmentId), {
        ...updateData,
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error updating route assignment:', error);
      throw error;
    }
  }

  // Delete route assignment
  async deleteRouteAssignment(assignmentId: string): Promise<void> {
    const firestore = ensureDb();

    try {
      await deleteDoc(doc(firestore, 'routeAssignments', assignmentId));
    } catch (error) {
      console.error('Error deleting route assignment:', error);
      throw error;
    }
  }

  // Save planned routes for persistence
  async savePlannedRoutes( routes: any[]): Promise<void> {
    console.log('🚀 Saving planned routes:', { companyId, routesCount: routes.length });
    
    const firestore = ensureDb();

    if (!companyId) {
      console.error('❌ Company ID is missing');
      throw new Error('Company ID is required');
    }

    if (!routes || routes.length === 0) {
      console.error('❌ No routes to save');
      throw new Error('No routes to save');
    }

    try {
      console.log('🗑️ Deleting existing routes...');
      // Delete existing saved routes for this company
      const existingRoutes = await this.getPlannedRoutes(companyId);
      console.log('📋 Found existing routes:', existingRoutes.length);
      
      if (existingRoutes.length > 0) {
        const batch = writeBatch(firestore);
        existingRoutes.forEach(route => {
          const routeRef = doc(firestore, 'plannedRoutes', route.id);
          batch.delete(routeRef);
        });
        await batch.commit();
        console.log('✅ Deleted existing routes');
      }

      console.log('💾 Saving new routes...');
      // Save new routes
      const batch = writeBatch(firestore);
      routes.forEach((route, index) => {
        if (!route.id) {
          console.error(`❌ Route ${index} missing ID:`, route);
          throw new Error(`Route ${index} is missing ID`);
        }
        
        const routeRef = doc(firestore, 'plannedRoutes', route.id);
        
        // Deep clean route data to remove all undefined values recursively
        const cleanRoute = (obj: any): any => {
          if (obj === null || obj === undefined) {
            return null;
          }
          
          if (Array.isArray(obj)) {
            return obj
              .filter(item => item !== undefined && item !== null)
              .map(item => cleanRoute(item));
          }
          
          if (typeof obj === 'object') {
            const cleaned: any = {};
            for (const [key, value] of Object.entries(obj)) {
              if (value !== undefined && value !== null) {
                const cleanedValue = cleanRoute(value);
                if (cleanedValue !== undefined && cleanedValue !== null) {
                  cleaned[key] = cleanedValue;
                }
              }
            }
            return cleaned;
          }
          
          return obj;
        };

        const cleanedRoute = cleanRoute(route);
        
        // Log what was cleaned
        const originalKeys = Object.keys(route).length;
        const cleanedKeys = Object.keys(cleanedRoute).length;
        if (originalKeys !== cleanedKeys) {
          console.log(`🧹 Cleaned route ${index}: ${originalKeys} → ${cleanedKeys} keys`);
        }
        
        // Additional validation
        if (!cleanedRoute.id) {
          console.error(`❌ Route ${index} missing ID after cleaning:`, cleanedRoute);
          throw new Error(`Route ${index} is missing ID after cleaning`);
        }
        
        // Final validation before Firebase write
        const finalRoute = {
          ...cleanedRoute,
          companyId, // Ensure companyId is set
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        
        // Double-check for any remaining undefined values
        const hasUndefined = JSON.stringify(finalRoute).includes('undefined');
        if (hasUndefined) {
          console.error(`❌ Route ${index} still contains undefined values after cleaning:`, finalRoute);
          throw new Error(`Route ${index} still contains undefined values after cleaning`);
        }
        
        batch.set(routeRef, finalRoute);
      });
      
      await batch.commit();
      console.log('✅ Successfully saved', routes.length, 'routes to Firebase');

    } catch (error) {
      console.error('❌ Error saving planned routes:', error);
      console.error('Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        companyId,
        routesCount: routes?.length || 0
      });
      throw error;
    }
  }

  // Get saved planned routes
  async getPlannedRoutes(): Promise<any[]> {
    console.log('📋 Loading planned routes for company:');
    
    const firestore = ensureDb();

    if (!companyId) {
      console.error('❌ Company ID is missing');
      throw new Error('Company ID is required');
    }

    try {
      const q = query(
        collection(firestore, 'plannedRoutes'),
        
      );
      
      const snapshot = await getDocs(q);
      const routes = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      console.log('✅ Loaded', routes.length, 'planned routes');
      return routes;
    } catch (error) {
      console.error('❌ Error loading planned routes:', error);
      console.error('Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        companyId
      });
      return [];
    }
  }

  async updatePartner(id: string, data: Partial<Partner>, userContext?: UserAccessContext): Promise<void> {
    const firestore = ensureDb();

    try {
      // Get partner data before update for audit log
      const partnerDoc = await getDoc(doc(firestore, 'partners', id));
      const partnerData = partnerDoc.exists() ? partnerDoc.data() as Partner : null;
      
      await updateDoc(doc(firestore, 'partners', id), {
        ...data,
        updatedAt: new Date().toISOString()
      });
      
      // Log access for audit trail
      if (userContext && partnerData) {
        const logMetadata: Record<string, unknown> = {
          partnerName: partnerData.name,
          type: partnerData.type,
          updatedFields: Object.keys(data)
        };
        await this.logAccess('update_partner', userContext.userId, 'partner', id, logMetadata);
      }
    } catch (error) {
      console.error('Error updating partner:', error);
      throw error;
    }
  }

  async deletePartner(id: string, userContext?: UserAccessContext): Promise<void> {
    const firestore = ensureDb();

    try {
      // Get partner data before deletion for audit log
      const partnerDoc = await getDoc(doc(firestore, 'partners', id));
      const partnerData = partnerDoc.exists() ? partnerDoc.data() as Partner : null;
      
      await deleteDoc(doc(firestore, 'partners', id));
      
      // Log access for audit trail
      if (userContext && partnerData) {
        const logMetadata: Record<string, unknown> = {
          partnerName: partnerData.name,
          type: partnerData.type
        };
        await this.logAccess('delete_partner', userContext.userId, 'partner', id, logMetadata);
      }
    } catch (error) {
      console.error('Error deleting partner:', error);
      throw error;
    }
  }

  // Settings methods
  async getSettings(): Promise<Setting[]> {
    const firestore = ensureDb();

    try {
      const settingsQuery = query(
        collection(firestore, 'settings'),
        
      );
      
      const snapshot = await getDocs(settingsQuery);
      const settings = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Setting[];

      // Sort by category and name
      return settings.sort((a, b) => {
        if (a.category !== b.category) {
          return a.category.localeCompare(b.category);
        }
        return a.name.localeCompare(b.name);
      });
    } catch (error) {
      console.error('Error getting settings:', error);
      return [];
    }
  }

  async createSetting(settingData: Omit<Setting, 'id' | 'updatedAt'>): Promise<string> {
    const firestore = ensureDb();

    try {
      const docRef = await addDoc(collection(firestore, 'settings'), {
        ...settingData,
        updatedAt: new Date().toISOString()
      });

      return docRef.id;
    } catch (error) {
      console.error('Error creating setting:', error);
      throw error;
    }
  }

  async updateSetting(id: string, data: Partial<Setting>): Promise<void> {
    const firestore = ensureDb();

    try {
      await updateDoc(doc(firestore, 'settings', id), {
        ...data,
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error updating setting:', error);
      throw error;
    }
  }

  async deleteSetting(id: string): Promise<void> {
    const firestore = ensureDb();

    try {
      await deleteDoc(doc(firestore, 'settings', id));
    } catch (error) {
      console.error('Error deleting setting:', error);
      throw error;
    }
  }

  // Partner Assignment Management
  async createPartnerAssignment(assignmentData: Omit<PartnerAssignment, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const firestore = ensureDb();

    try {
      const now = new Date().toISOString();
      const docRef = await addDoc(collection(firestore, 'partnerAssignments'), {
        ...assignmentData,
        createdAt: now,
        updatedAt: now
      });

      // Send SMS notification to partner users
      await this.notifyPartnerUsersAboutAssignment(assignmentData.partnerId, assignmentData.title, assignmentData.startTime);

      return docRef.id;
    } catch (error) {
      console.error('Error creating partner assignment:', error);
      throw error;
    }
  }

  async getPartnerAssignments( partnerId?: string): Promise<PartnerAssignment[]> {
    const firestore = ensureDb();

    try {
      let q;
      if (partnerId) {
        q = query(
          collection(firestore, 'partnerAssignments'),
          
          where('partnerId', '==', partnerId)
        );
      } else {
        q = query(
          collection(firestore, 'partnerAssignments'),
          
        );
      }

      const snapshot = await getDocs(q);
      const assignments = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as PartnerAssignment[];

      return assignments.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } catch (error) {
      console.error('Error fetching partner assignments:', error);
      return [];
    }
  }

  async getPartnerAssignmentsForUser(partnerId: string): Promise<PartnerAssignment[]> {
    const firestore = ensureDb();

    try {
      const q = query(
        collection(firestore, 'partnerAssignments'),
        where('partnerId', '==', partnerId)
      );

      const snapshot = await getDocs(q);
      const assignments = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as PartnerAssignment[];

      return assignments.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } catch (error) {
      console.error('Error fetching partner assignments for user:', error);
      return [];
    }
  }

  async updatePartnerAssignment(id: string, data: Partial<PartnerAssignment>): Promise<void> {
    const firestore = ensureDb();

    try {
      await updateDoc(doc(firestore, 'partnerAssignments', id), {
        ...data,
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error updating partner assignment:', error);
      throw error;
    }
  }

  async updatePartnerAssignmentResponse(assignmentId: string, response: PartnerAssignment['partnerResponse']): Promise<void> {
    const firestore = ensureDb();

    try {
      await updateDoc(doc(firestore, 'partnerAssignments', assignmentId), {
        partnerResponse: response,
        updatedAt: new Date().toISOString()
      });

      // Send SMS notification to admin about response
      await this.notifyAdminAboutPartnerResponse(assignmentId, response);
    } catch (error) {
      console.error('Error updating partner assignment response:', error);
      throw error;
    }
  }

  // Partner User Management
  async getPartnerUsers( partnerId?: string): Promise<PartnerUser[]> {
    const firestore = ensureDb();

    try {
      let q;
      if (partnerId) {
        q = query(
          collection(firestore, 'partnerUsers'),
          
          where('partnerId', '==', partnerId)
        );
      } else {
        q = query(
          collection(firestore, 'partnerUsers'),
          
        );
      }

      const snapshot = await getDocs(q);
      const users = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as PartnerUser[];

      return users.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } catch (error) {
      console.error('Error fetching partner users:', error);
      return [];
    }
  }

  async createPartnerUser(userData: Omit<PartnerUser, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const firestore = ensureDb();

    try {
      const docRef = await addDoc(collection(firestore, 'partnerUsers'), {
        ...userData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });

      return docRef.id;
    } catch (error) {
      console.error('Error creating partner user:', error);
      throw error;
    }
  }

  // SMS Notifications
  private async notifyPartnerUsersAboutAssignment(partnerId: string, assignmentTitle: string, startTime: string): Promise<void> {
    try {
      // Get partner users with phone numbers
      const partnerUsers = await this.getPartnerUsers('', partnerId);
      const usersWithPhone = partnerUsers.filter(user => user.phoneNumber && user.status === 'active');

      // Send SMS to each user
      for (const user of usersWithPhone) {
        try {
          const message = `Nytt oppdrag: ${assignmentTitle}. Start: ${startTime}. Logg inn på DriftPro for detaljer.`;
          
          const response = await fetch('/api/sms/send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              to: user.phoneNumber,
              message: message,
              priority: 'high'
            })
          });

          if (response.ok) {
            console.log(`✅ SMS sent to ${user.fullName} about assignment: ${assignmentTitle}`);
          }
        } catch (error) {
          console.error(`Failed to send SMS to ${user.fullName}:`, error);
        }
      }
    } catch (error) {
      console.error('Error notifying partner users about assignment:', error);
    }
  }

  private async notifyAdminAboutPartnerResponse(assignmentId: string, response: PartnerAssignment['partnerResponse']): Promise<void> {
    try {
      const firestore = ensureDb();
      
      // Get assignment details
      const assignmentDoc = await getDoc(doc(firestore, 'partnerAssignments', assignmentId));
      if (!assignmentDoc.exists()) return;

      const assignment = assignmentDoc.data() as PartnerAssignment;
      
      // Get partner details
      const partnerDoc = await getDoc(doc(firestore, 'partners', assignment.partnerId));
      const partner = partnerDoc.exists() ? partnerDoc.data() as Partner : null;
      
      // Get admin users for the company
      const adminUsers = await this.getEmployees(assignment.companyId);
      const adminsWithPhone = adminUsers.filter(emp => 
        emp.phone && emp.role === 'admin' && emp.status === 'active'
      );

      // Send SMS to admins
      for (const admin of adminsWithPhone) {
        try {
          const message = `Partner ${partner?.name || 'Ukjent'} har svart på oppdrag "${assignment.title}": ${response?.status}. Logg inn på DriftPro.`;
          
          const smsResponse = await fetch('/api/sms/send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              to: admin.phone,
              message: message,
              priority: 'normal'
            })
          });

          if (smsResponse.ok) {
            console.log(`✅ Admin notification SMS sent to ${admin.displayName}`);
          }
        } catch (error) {
          console.error(`Failed to send admin notification SMS to ${admin.displayName}:`, error);
        }
      }
    } catch (error) {
      console.error('Error notifying admin about partner response:', error);
    }
  }

  // Partner Assignment File Upload
  async uploadPartnerAssignmentFile(file: File, partnerId: string, assignmentId: string): Promise<{ fileUrl: string; fileName: string; fileSize: number }> {
    const firestore = ensureDb();
    if (!storage) throw new Error('Firebase Storage not initialized');

    try {
      // Create organized file path in Firebase Storage
      const timestamp = Date.now();
      const fileName = `${timestamp}_${file.name}`;
      const filePath = `partners/${companyId}/${partnerId}/assignments/${assignmentId}/${fileName}`;
      
      // Upload file to Firebase Storage
      const storageRef = ref(storage, filePath);
      await uploadBytes(storageRef, file);
      const fileUrl = await getDownloadURL(storageRef);

      // Create file record in Firestore
      const fileRecord = {
        fileName: file.name,
        fileUrl,
        fileSize: file.size,
        fileType: file.type,
        filePath,
        partnerId,
        assignmentId,
        companyId,
        uploadedAt: new Date().toISOString(),
        uploadedBy: 'system'
      };

      // Add to partner assignment files collection
      await addDoc(collection(firestore, `partners/${partnerId}/assignments/${assignmentId}/files`), fileRecord);

      return {
        fileUrl,
        fileName: file.name,
        fileSize: file.size
      };

    } catch (error) {
      console.error('Error uploading partner assignment file:', error);
      throw error;
    }
  }

  // Comprehensive Internal Audit System
  async createInternalAudit(auditData: Omit<InternalAudit, 'id' | 'createdAt' | 'updatedAt' | 'documents' | 'comments'>): Promise<string> {
    const firestore = ensureDb();
    const now = new Date().toISOString();
    const docRef = await addDoc(collection(firestore, 'internalAudits'), {
      ...auditData,
      documents: [],
      comments: [],
      createdAt: now,
      updatedAt: now
    });
    
    await this.createActivity({
      type: 'document_uploaded', // Using closest available type
      title: 'Internrevisjon opprettet',
      description: auditData.title,
      userId: auditData.createdBy,
      userName: 'System',
          });

    return docRef.id;
  }

  async getInternalAudits( filters?: { status?: string; type?: string; priority?: string; department?: string }): Promise<InternalAudit[]> {
    const firestore = ensureDb();
    
    let q = query(
      collection(firestore, 'internalAudits'),
      
    );

    const snapshot = await getDocs(q);
    let audits = snapshot.docs.map(doc => ({ 
      id: doc.id, 
      ...doc.data() 
    })) as InternalAudit[];

    // Apply filters in memory
    if (filters?.status && filters.status !== 'all') {
      audits = audits.filter(a => a.status === filters.status);
    }
    if (filters?.type && filters.type !== 'all') {
      audits = audits.filter(a => a.type === filters.type);
    }
    if (filters?.priority && filters.priority !== 'all') {
      audits = audits.filter(a => a.priority === filters.priority);
    }
    if (filters?.department) {
      audits = audits.filter(a => a.departmentId === filters.department);
    }
    
    // Sort by planned date (newest first)
    return audits.sort((a, b) => {
      const dateA = new Date(a.plannedDate).getTime();
      const dateB = new Date(b.plannedDate).getTime();
      return dateB - dateA;
    });
  }

  async getInternalAudit(auditId: string): Promise<InternalAudit | null> {
    const firestore = ensureDb();
    const auditDoc = await getDoc(doc(firestore, 'internalAudits', auditId));
    if (!auditDoc.exists()) return null;
    return { id: auditDoc.id, ...auditDoc.data() } as InternalAudit;
  }

  async updateInternalAudit(auditId: string, updateData: Partial<InternalAudit>): Promise<void> {
    const firestore = ensureDb();
    await updateDoc(doc(firestore, 'internalAudits', auditId), {
      ...updateData,
      updatedAt: new Date().toISOString()
    });
  }

  async deleteInternalAudit(auditId: string): Promise<void> {
    const firestore = ensureDb();
    const audit = await this.getInternalAudit(auditId);
    if (!audit) return;

    // Delete associated documents from storage
    if (audit.documents && audit.documents.length > 0 && storage) {
      for (const doc of audit.documents) {
        try {
          const storageRef = ref(storage, doc.fileUrl);
          await deleteObject(storageRef);
        } catch (error) {
          console.error(`Error deleting document ${doc.id}:`, error);
        }
      }
    }

    await deleteDoc(doc(firestore, 'internalAudits', auditId));
  }

  async uploadAuditDocument(file: File, auditId: string, companyId: string, uploadedBy: string, description?: string, category?: string): Promise<AuditDocument> {
    const firestore = ensureDb();

    try {
      let fileUrl: string = '';
      let storageType: 'onedrive' | 'firebase' = 'firebase';
      let oneDriveItemId: string | undefined;

      // Try OneDrive first if Microsoft Graph is authenticated
      if (microsoftGraphService.isAuthenticated()) {
        try {
          console.log('📁 Uploading audit document to OneDrive...');
          // Egen mappe for Internkontroll og Samsvar → Internrevisjon
          const folderPath = `DriftPro/Internkontroll og Samsvar/Internrevisjon/${companyId}/${auditId}`;
          const oneDriveResult = await microsoftGraphService.uploadFileToOneDrive(file, folderPath);
          fileUrl = oneDriveResult.downloadUrl;
          oneDriveItemId = oneDriveResult.id;
          storageType = 'onedrive';
          console.log('✅ File uploaded to OneDrive:', oneDriveResult.name);
        } catch (onedriveError) {
          console.warn('⚠️ OneDrive upload failed, falling back to Firebase Storage:', onedriveError);
          // Fall back to Firebase Storage
        }
      }

      // Fall back to Firebase Storage if OneDrive failed or not available
      if (storageType === 'firebase' || !fileUrl) {
        if (!storage) throw new Error('Firebase Storage not initialized');
      const fileName = `${Date.now()}_${file.name}`;
      const storageRef = ref(storage, `audits/${companyId}/${auditId}/${fileName}`);
      await uploadBytes(storageRef, file);
        fileUrl = await getDownloadURL(storageRef);
        console.log('✅ File uploaded to Firebase Storage');
      }

      const document: AuditDocument = {
        id: `doc_${Date.now()}`,
        fileName: file.name,
        fileUrl,
        fileSize: file.size,
        fileType: file.type,
        uploadedBy,
        uploadedAt: new Date().toISOString(),
        description,
        category: category as any || 'other',
        storageType,
        oneDriveItemId
      };

      // Add document to audit
      const auditRef = doc(firestore, 'internalAudits', auditId);
      const auditDoc = await getDoc(auditRef);
      if (auditDoc.exists()) {
        const auditData = auditDoc.data();
        const documents = auditData.documents || [];
        documents.push(document);
        await updateDoc(auditRef, {
          documents,
          updatedAt: new Date().toISOString()
        });
      }

      return document;
    } catch (error) {
      console.error('Error uploading audit document:', error);
      throw error;
    }
  }

  async deleteAuditDocument(auditId: string, documentId: string): Promise<void> {
    const firestore = ensureDb();

    const auditRef = doc(firestore, 'internalAudits', auditId);
    const auditDoc = await getDoc(auditRef);
    if (!auditDoc.exists()) return;

    const auditData = auditDoc.data() as InternalAudit;
    const document = auditData.documents?.find(d => d.id === documentId);
    if (!document) return;

    // Delete from appropriate storage
    try {
      if (document.storageType === 'onedrive' && document.oneDriveItemId && microsoftGraphService.isAuthenticated()) {
        console.log('🗑️ Deleting from OneDrive...');
        await microsoftGraphService.deleteOneDriveFile(document.oneDriveItemId);
        console.log('✅ File deleted from OneDrive');
      } else {
        // Delete from Firebase Storage
        if (!storage) throw new Error('Firebase Storage not initialized');
      const storageRef = ref(storage, document.fileUrl);
      await deleteObject(storageRef);
        console.log('✅ File deleted from Firebase Storage');
      }
    } catch (error) {
      console.error('Error deleting document from storage:', error);
      // Continue with database deletion even if storage deletion fails
    }

    // Remove from audit
    const documents = auditData.documents?.filter(d => d.id !== documentId) || [];
    await updateDoc(auditRef, {
      documents,
      updatedAt: new Date().toISOString()
    });
  }

  async addAuditComment(auditId: string, comment: Omit<AuditComment, 'id' | 'createdAt'>): Promise<void> {
    const firestore = ensureDb();
    const auditRef = doc(firestore, 'internalAudits', auditId);
    const auditDoc = await getDoc(auditRef);
    if (!auditDoc.exists()) return;

    const auditData = auditDoc.data();
    const comments = auditData.comments || [];
    comments.push({
      ...comment,
      id: `comment_${Date.now()}`,
      createdAt: new Date().toISOString()
    });

    await updateDoc(auditRef, {
      comments,
      updatedAt: new Date().toISOString()
    });
  }

  // Upload functions for all types (Deviations, Risk Assessments, Follow-up Actions, Checkpoints)
  async uploadDeviationFile(file: File, deviationId: string, companyId: string, uploadedBy: string, description?: string): Promise<AuditDocument> {
    const firestore = ensureDb();

    try {
      let fileUrl: string = '';
      let storageType: 'onedrive' | 'firebase' = 'firebase';
      let oneDriveItemId: string | undefined;

      // Try OneDrive first if Microsoft Graph is authenticated
      if (microsoftGraphService.isAuthenticated()) {
        try {
          console.log('📁 Uploading deviation file to OneDrive...');
          // Egen mappe for Internkontroll og Samsvar → Avvik
          const folderPath = `DriftPro/Internkontroll og Samsvar/Avvik/${companyId}/${deviationId}`;
          const oneDriveResult = await microsoftGraphService.uploadFileToOneDrive(file, folderPath);
          fileUrl = oneDriveResult.downloadUrl;
          oneDriveItemId = oneDriveResult.id;
          storageType = 'onedrive';
          console.log('✅ File uploaded to OneDrive:', oneDriveResult.name);
        } catch (onedriveError) {
          console.warn('⚠️ OneDrive upload failed, falling back to Firebase Storage:', onedriveError);
          // Fall back to Firebase Storage
        }
      }

      // Fall back to Firebase Storage if OneDrive failed or not available
      if (storageType === 'firebase' || !fileUrl) {
        if (!storage) throw new Error('Firebase Storage not initialized');
        const fileName = `${Date.now()}_${file.name}`;
        const storageRef = ref(storage, `deviations/${companyId}/${deviationId}/${fileName}`);
        await uploadBytes(storageRef, file);
        fileUrl = await getDownloadURL(storageRef);
        console.log('✅ File uploaded to Firebase Storage');
      }

      const document: AuditDocument = {
        id: `doc_${Date.now()}`,
        fileName: file.name,
        fileUrl,
        fileSize: file.size,
        fileType: file.type,
        uploadedBy,
        uploadedAt: new Date().toISOString(),
        description,
        category: 'evidence',
        storageType,
        oneDriveItemId
      };

      const deviationRef = doc(firestore, 'deviations', deviationId);
      const deviationDoc = await getDoc(deviationRef);
      if (deviationDoc.exists()) {
        const deviationData = deviationDoc.data();
        const documents = deviationData.documents || [];
        documents.push(document);
        await updateDoc(deviationRef, {
          documents,
          attachments: [...(deviationData.attachments || []), fileUrl], // Keep for backward compatibility
          updatedAt: new Date().toISOString()
        });
      }

      return document;
    } catch (error) {
      console.error('Error uploading deviation file:', error);
      throw error;
    }
  }

  async uploadRiskAssessmentFile(file: File, riskId: string, companyId: string, uploadedBy: string, description?: string): Promise<AuditDocument> {
    const firestore = ensureDb();

    try {
      let fileUrl: string = '';
      let storageType: 'onedrive' | 'firebase' = 'firebase';
      let oneDriveItemId: string | undefined;

      // Try OneDrive first if Microsoft Graph is authenticated
      if (microsoftGraphService.isAuthenticated()) {
        try {
          console.log('📁 Uploading risk assessment file to OneDrive...');
          // Egen mappe for Internkontroll og Samsvar → Risikovurderinger
          const folderPath = `DriftPro/Internkontroll og Samsvar/Risikovurderinger/${companyId}/${riskId}`;
          const oneDriveResult = await microsoftGraphService.uploadFileToOneDrive(file, folderPath);
          fileUrl = oneDriveResult.downloadUrl;
          oneDriveItemId = oneDriveResult.id;
          storageType = 'onedrive';
          console.log('✅ File uploaded to OneDrive:', oneDriveResult.name);
        } catch (onedriveError) {
          console.warn('⚠️ OneDrive upload failed, falling back to Firebase Storage:', onedriveError);
          // Fall back to Firebase Storage
        }
      }

      // Fall back to Firebase Storage if OneDrive failed or not available
      if (storageType === 'firebase' || !fileUrl) {
        if (!storage) throw new Error('Firebase Storage not initialized');
        const fileName = `${Date.now()}_${file.name}`;
        const storageRef = ref(storage, `riskAssessments/${companyId}/${riskId}/${fileName}`);
        await uploadBytes(storageRef, file);
        fileUrl = await getDownloadURL(storageRef);
        console.log('✅ File uploaded to Firebase Storage');
      }

      const document: AuditDocument = {
        id: `doc_${Date.now()}`,
        fileName: file.name,
        fileUrl,
        fileSize: file.size,
        fileType: file.type,
        uploadedBy,
        uploadedAt: new Date().toISOString(),
        description,
        category: 'evidence',
        storageType,
        oneDriveItemId
      };

      const riskRef = doc(firestore, 'riskAssessments', riskId);
      const riskDoc = await getDoc(riskRef);
      if (riskDoc.exists()) {
        const riskData = riskDoc.data();
        const documents = riskData.documents || [];
        documents.push(document);
        await updateDoc(riskRef, {
          documents,
          attachments: [...(riskData.attachments || []), fileUrl], // Keep for backward compatibility
          updatedAt: new Date().toISOString()
        });
      }

      return document;
    } catch (error) {
      console.error('Error uploading risk assessment file:', error);
      throw error;
    }
  }

  async uploadFollowUpActionFile(file: File, actionId: string, companyId: string, uploadedBy: string, description?: string): Promise<AuditDocument> {
    const firestore = ensureDb();

    try {
      let fileUrl: string = '';
      let storageType: 'onedrive' | 'firebase' = 'firebase';
      let oneDriveItemId: string | undefined;

      // Try OneDrive first if Microsoft Graph is authenticated
      if (microsoftGraphService.isAuthenticated()) {
        try {
          console.log('📁 Uploading follow-up action file to OneDrive...');
          // Egen mappe for Internkontroll og Samsvar → Oppfølgingstiltak
          const folderPath = `DriftPro/Internkontroll og Samsvar/Oppfølgingstiltak/${companyId}/${actionId}`;
          const oneDriveResult = await microsoftGraphService.uploadFileToOneDrive(file, folderPath);
          fileUrl = oneDriveResult.downloadUrl;
          oneDriveItemId = oneDriveResult.id;
          storageType = 'onedrive';
          console.log('✅ File uploaded to OneDrive:', oneDriveResult.name);
        } catch (onedriveError) {
          console.warn('⚠️ OneDrive upload failed, falling back to Firebase Storage:', onedriveError);
          // Fall back to Firebase Storage
        }
      }

      // Fall back to Firebase Storage if OneDrive failed or not available
      if (storageType === 'firebase' || !fileUrl) {
        if (!storage) throw new Error('Firebase Storage not initialized');
        const fileName = `${Date.now()}_${file.name}`;
        const storageRef = ref(storage, `followUpActions/${companyId}/${actionId}/${fileName}`);
        await uploadBytes(storageRef, file);
        fileUrl = await getDownloadURL(storageRef);
        console.log('✅ File uploaded to Firebase Storage');
      }

      const document: AuditDocument = {
        id: `doc_${Date.now()}`,
        fileName: file.name,
        fileUrl,
        fileSize: file.size,
        fileType: file.type,
        uploadedBy,
        uploadedAt: new Date().toISOString(),
        description,
        category: 'evidence',
        storageType,
        oneDriveItemId
      };

      const actionRef = doc(firestore, 'followUpActions', actionId);
      const actionDoc = await getDoc(actionRef);
      if (actionDoc.exists()) {
        const actionData = actionDoc.data();
        const documents = actionData.documents || [];
        documents.push(document);
        await updateDoc(actionRef, {
          documents,
          attachments: [...(actionData.attachments || []), fileUrl], // Keep for backward compatibility
          updatedAt: new Date().toISOString()
        });
      }

      return document;
    } catch (error) {
      console.error('Error uploading follow-up action file:', error);
      throw error;
    }
  }

  async uploadCheckpointFile(file: File, checkpointId: string, companyId: string, uploadedBy: string, description?: string): Promise<AuditDocument> {
    const firestore = ensureDb();

    try {
      let fileUrl: string = '';
      let storageType: 'onedrive' | 'firebase' = 'firebase';
      let oneDriveItemId: string | undefined;

      // Try OneDrive first if Microsoft Graph is authenticated
      if (microsoftGraphService.isAuthenticated()) {
        try {
          console.log('📁 Uploading checkpoint file to OneDrive...');
          // Egen mappe for Internkontroll og Samsvar → Kontrollpunkter
          const folderPath = `DriftPro/Internkontroll og Samsvar/Kontrollpunkter/${companyId}/${checkpointId}`;
          const oneDriveResult = await microsoftGraphService.uploadFileToOneDrive(file, folderPath);
          fileUrl = oneDriveResult.downloadUrl;
          oneDriveItemId = oneDriveResult.id;
          storageType = 'onedrive';
          console.log('✅ File uploaded to OneDrive:', oneDriveResult.name);
        } catch (onedriveError) {
          console.warn('⚠️ OneDrive upload failed, falling back to Firebase Storage:', onedriveError);
          // Fall back to Firebase Storage
        }
      }

      // Fall back to Firebase Storage if OneDrive failed or not available
      if (storageType === 'firebase' || !fileUrl) {
        if (!storage) throw new Error('Firebase Storage not initialized');
        const fileName = `${Date.now()}_${file.name}`;
        const storageRef = ref(storage, `checkpoints/${companyId}/${checkpointId}/${fileName}`);
        await uploadBytes(storageRef, file);
        fileUrl = await getDownloadURL(storageRef);
        console.log('✅ File uploaded to Firebase Storage');
      }

      const document: AuditDocument = {
        id: `doc_${Date.now()}`,
        fileName: file.name,
        fileUrl,
        fileSize: file.size,
        fileType: file.type,
        uploadedBy,
        uploadedAt: new Date().toISOString(),
        description,
        category: 'evidence',
        storageType,
        oneDriveItemId
      };

      const checkpointRef = doc(firestore, 'checkpoints', checkpointId);
      const checkpointDoc = await getDoc(checkpointRef);
      if (checkpointDoc.exists()) {
        const checkpointData = checkpointDoc.data();
        const documents = checkpointData.documents || [];
        documents.push(document);
        await updateDoc(checkpointRef, {
          documents,
          attachments: [...(checkpointData.attachments || []), fileUrl], // Keep for backward compatibility
          updatedAt: new Date().toISOString()
        });
      }

      return document;
    } catch (error) {
      console.error('Error uploading checkpoint file:', error);
      throw error;
    }
  }

  // Delete file functions for all types
  async deleteDeviationFile(deviationId: string, documentId: string): Promise<void> {
    const firestore = ensureDb();

    const deviationRef = doc(firestore, 'deviations', deviationId);
    const deviationDoc = await getDoc(deviationRef);
    if (!deviationDoc.exists()) return;

    const deviationData = deviationDoc.data();
    const documents = deviationData.documents || [];
    const document = documents.find((d: AuditDocument) => d.id === documentId);
    if (!document) return;

    try {
      if (document.storageType === 'onedrive' && document.oneDriveItemId && microsoftGraphService.isAuthenticated()) {
        console.log('🗑️ Deleting from OneDrive...');
        await microsoftGraphService.deleteOneDriveFile(document.oneDriveItemId);
        console.log('✅ File deleted from OneDrive');
      } else {
        if (!storage) throw new Error('Firebase Storage not initialized');
        const storageRef = ref(storage, document.fileUrl);
        await deleteObject(storageRef);
        console.log('✅ File deleted from Firebase Storage');
      }
    } catch (error) {
      console.error('Error deleting file from storage:', error);
      // Continue with database deletion even if storage deletion fails
    }

    const updatedDocuments = documents.filter((d: AuditDocument) => d.id !== documentId);
    await updateDoc(deviationRef, {
      documents: updatedDocuments,
      attachments: updatedDocuments.map((d: AuditDocument) => d.fileUrl), // Keep for backward compatibility
      updatedAt: new Date().toISOString()
    });
  }

  async deleteRiskAssessmentFile(riskId: string, documentId: string): Promise<void> {
    const firestore = ensureDb();

    const riskRef = doc(firestore, 'riskAssessments', riskId);
    const riskDoc = await getDoc(riskRef);
    if (!riskDoc.exists()) return;

    const riskData = riskDoc.data();
    const documents = riskData.documents || [];
    const document = documents.find((d: AuditDocument) => d.id === documentId);
    if (!document) return;

    try {
      if (document.storageType === 'onedrive' && document.oneDriveItemId && microsoftGraphService.isAuthenticated()) {
        console.log('🗑️ Deleting from OneDrive...');
        await microsoftGraphService.deleteOneDriveFile(document.oneDriveItemId);
        console.log('✅ File deleted from OneDrive');
      } else {
        if (!storage) throw new Error('Firebase Storage not initialized');
        const storageRef = ref(storage, document.fileUrl);
        await deleteObject(storageRef);
        console.log('✅ File deleted from Firebase Storage');
      }
    } catch (error) {
      console.error('Error deleting file from storage:', error);
      // Continue with database deletion even if storage deletion fails
    }

    const updatedDocuments = documents.filter((d: AuditDocument) => d.id !== documentId);
    await updateDoc(riskRef, {
      documents: updatedDocuments,
      attachments: updatedDocuments.map((d: AuditDocument) => d.fileUrl), // Keep for backward compatibility
      updatedAt: new Date().toISOString()
    });
  }

  async deleteFollowUpActionFile(actionId: string, documentId: string): Promise<void> {
    const firestore = ensureDb();

    const actionRef = doc(firestore, 'followUpActions', actionId);
    const actionDoc = await getDoc(actionRef);
    if (!actionDoc.exists()) return;

    const actionData = actionDoc.data();
    const documents = actionData.documents || [];
    const document = documents.find((d: AuditDocument) => d.id === documentId);
    if (!document) return;

    try {
      if (document.storageType === 'onedrive' && document.oneDriveItemId && microsoftGraphService.isAuthenticated()) {
        console.log('🗑️ Deleting from OneDrive...');
        await microsoftGraphService.deleteOneDriveFile(document.oneDriveItemId);
        console.log('✅ File deleted from OneDrive');
      } else {
        if (!storage) throw new Error('Firebase Storage not initialized');
        const storageRef = ref(storage, document.fileUrl);
        await deleteObject(storageRef);
        console.log('✅ File deleted from Firebase Storage');
      }
    } catch (error) {
      console.error('Error deleting file from storage:', error);
      // Continue with database deletion even if storage deletion fails
    }

    const updatedDocuments = documents.filter((d: AuditDocument) => d.id !== documentId);
    await updateDoc(actionRef, {
      documents: updatedDocuments,
      attachments: updatedDocuments.map((d: AuditDocument) => d.fileUrl), // Keep for backward compatibility
      updatedAt: new Date().toISOString()
    });
  }

  async deleteCheckpointFile(checkpointId: string, documentId: string): Promise<void> {
    const firestore = ensureDb();

    const checkpointRef = doc(firestore, 'checkpoints', checkpointId);
    const checkpointDoc = await getDoc(checkpointRef);
    if (!checkpointDoc.exists()) return;

    const checkpointData = checkpointDoc.data();
    const documents = checkpointData.documents || [];
    const document = documents.find((d: AuditDocument) => d.id === documentId);
    if (!document) return;

    try {
      if (document.storageType === 'onedrive' && document.oneDriveItemId && microsoftGraphService.isAuthenticated()) {
        console.log('🗑️ Deleting from OneDrive...');
        await microsoftGraphService.deleteOneDriveFile(document.oneDriveItemId);
        console.log('✅ File deleted from OneDrive');
      } else {
        if (!storage) throw new Error('Firebase Storage not initialized');
        const storageRef = ref(storage, document.fileUrl);
        await deleteObject(storageRef);
        console.log('✅ File deleted from Firebase Storage');
      }
    } catch (error) {
      console.error('Error deleting file from storage:', error);
      // Continue with database deletion even if storage deletion fails
    }

    const updatedDocuments = documents.filter((d: AuditDocument) => d.id !== documentId);
    await updateDoc(checkpointRef, {
      documents: updatedDocuments,
      attachments: updatedDocuments.map((d: AuditDocument) => d.fileUrl), // Keep for backward compatibility
      updatedAt: new Date().toISOString()
    });
  }

  // Legacy audit functions (for partner audits)
  async createAudit(auditData: {
    partnerId: string;
    partnerName: string;
    scheduledDate: string;
    status: 'scheduled' | 'completed' | 'overdue';
        createdBy: string;
    notes?: string;
  }): Promise<string> {
    const firestore = ensureDb();
    const docRef = await addDoc(collection(firestore, 'audits'), {
      ...auditData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    return docRef.id;
  }

  async getAudits(): Promise<any[]> {
    const firestore = ensureDb();
    
    const q = query(
      collection(firestore, 'audits'),
      
    );
    const snapshot = await getDocs(q);
    const audits = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    // Sort in JavaScript instead of Firestore to avoid index requirement
    return audits.sort((a: any, b: any) => {
      const dateA = new Date(a.scheduledDate).getTime();
      const dateB = new Date(b.scheduledDate).getTime();
      return dateA - dateB;
    });
  }

  async updateAudit(auditId: string, updateData: Partial<any>): Promise<void> {
    const firestore = ensureDb();
    await updateDoc(doc(firestore, 'audits', auditId), {
      ...updateData,
      updatedAt: new Date().toISOString()
    });
  }

  async deleteAudit(auditId: string): Promise<void> {
    const firestore = ensureDb();
    await deleteDoc(doc(firestore, 'audits', auditId));
  }

  // Check for overdue audits and send notifications
  async checkOverdueAudits(): Promise<any[]> {
    const audits = await this.getAudits(companyId);
    const today = new Date();
    const overdueAudits = audits.filter(audit => {
      const scheduledDate = new Date(audit.scheduledDate);
      return scheduledDate < today && audit.status !== 'completed';
    });
    
    // Update status to overdue
    for (const audit of overdueAudits) {
      await this.updateAudit(audit.id, { status: 'overdue' });
    }
    
    return overdueAudits;
  }

  // Schedule next audit (3 months from completion)
  async scheduleNextAudit(completedAuditId: string): Promise<string> {
    const firestore = ensureDb();
    const auditDoc = await getDoc(doc(firestore, 'audits', completedAuditId));
    if (!auditDoc.exists()) {
      throw new Error('Audit not found');
    }
    
    const auditData = auditDoc.data();
    const completedDate = new Date();
    const nextAuditDate = new Date(completedDate);
    nextAuditDate.setMonth(nextAuditDate.getMonth() + 3);
    
    return await this.createAudit({
      partnerId: auditData.partnerId,
      partnerName: auditData.partnerName,
      scheduledDate: nextAuditDate.toISOString(),
      status: 'scheduled',
            createdBy: auditData.createdBy,
      notes: `Neste audit planlagt 3 måneder etter forrige audit (${completedDate.toLocaleDateString('no-NO')})`
    });
  }

  // ============================================================================
  // EMAIL CASE MANAGEMENT SYSTEM (MAVI)
  // ============================================================================

  // Create case
  async createEmailCase(caseData: Omit<EmailCase, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const firestore = ensureDb();
    const now = new Date().toISOString();
    const docRef = await addDoc(collection(firestore, 'emailCases'), {
      ...caseData,
      createdAt: now,
      updatedAt: now
    });
    return docRef.id;
  }

  // Get cases
  async getEmailCases( filters?: { status?: string; caseType?: string; priority?: string }): Promise<EmailCase[]> {
    const firestore = ensureDb();
    let q = query(
      collection(firestore, 'emailCases'),
      
    );
    const snapshot = await getDocs(q);
    let cases = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as EmailCase[];
    
    // Apply filters
    if (filters?.status && filters.status !== 'all') {
      cases = cases.filter(c => c.status === filters.status);
    }
    if (filters?.caseType && filters.caseType !== 'all') {
      cases = cases.filter(c => c.caseType === filters.caseType);
    }
    if (filters?.priority && filters.priority !== 'all') {
      cases = cases.filter(c => c.priority === filters.priority);
    }
    
    // Sort by last activity
    return cases.sort((a, b) => new Date(b.lastActivityAt).getTime() - new Date(a.lastActivityAt).getTime());
  }

  // Get case by ID or caseId
  async getEmailCase(caseIdOrId: string): Promise<EmailCase | null> {
    const firestore = ensureDb();
    // Try by caseId first
    let q = query(
      collection(firestore, 'emailCases'),
      where('caseId', '==', caseIdOrId),
      
    );
    let snapshot = await getDocs(q);
    if (!snapshot.empty) {
      return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as EmailCase;
    }
    // Try by id
    const caseDoc = await getDoc(doc(firestore, 'emailCases', caseIdOrId));
    if (caseDoc.exists() && caseDoc.data().companyId === companyId) {
      return { id: caseDoc.id, ...caseDoc.data() } as EmailCase;
    }
    return null;
  }

  // Update case
  async updateEmailCase(caseId: string, updateData: Partial<EmailCase>): Promise<void> {
    const firestore = ensureDb();
    await updateDoc(doc(firestore, 'emailCases', caseId), {
      ...updateData,
      updatedAt: new Date().toISOString()
    });
  }

  // Add case link
  async addEmailCaseLink(caseId: string, kind: string, value: string): Promise<string> {
    const firestore = ensureDb();
    const now = new Date().toISOString();
    const docRef = await addDoc(collection(firestore, 'emailCaseLinks'), {
      caseId,
      kind,
      value,
      companyId,
      createdAt: now
    });
    return docRef.id;
  }

  // Find case by links
  async findEmailCaseByLinks(kinds: string[], values: string[]): Promise<EmailCase | null> {
    const firestore = ensureDb();
    for (const [index, kind] of kinds.entries()) {
      const value = values[index];
      if (!value) continue;
      
      const q = query(
        collection(firestore, 'emailCaseLinks'),
        where('kind', '==', kind),
        where('value', '==', value),
        
      );
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        const link = snapshot.docs[0].data() as EmailCaseLink;
        return this.getEmailCase(link.caseId);
      }
    }
    return null;
  }

  // Create message
  async createEmailCaseMessage(messageData: Omit<EmailCaseMessage, 'id' | 'createdAt'>): Promise<string> {
    const firestore = ensureDb();
    const now = new Date().toISOString();
    const docRef = await addDoc(collection(firestore, 'emailCaseMessages'), {
      ...messageData,
      createdAt: now
    });
    return docRef.id;
  }

  // Get messages for case
  async getEmailCaseMessages(caseId: string): Promise<EmailCaseMessage[]> {
    const firestore = ensureDb();
    const q = query(
      collection(firestore, 'emailCaseMessages'),
      where('caseId', '==', caseId),
      
    );
    const snapshot = await getDocs(q);
    const messages = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as EmailCaseMessage[];
    return messages.sort((a, b) => new Date(b.receivedAt).getTime() - new Date(a.receivedAt).getTime());
  }

  // Create entity
  async createEmailEntity(entityData: Omit<EmailEntity, 'id' | 'createdAt'>): Promise<string> {
    const firestore = ensureDb();
    const now = new Date().toISOString();
    const docRef = await addDoc(collection(firestore, 'emailEntities'), {
      ...entityData,
      createdAt: now
    });
    return docRef.id;
  }

  // Get entities for message
  async getEmailEntities(messageId: string): Promise<EmailEntity[]> {
    const firestore = ensureDb();
    const q = query(
      collection(firestore, 'emailEntities'),
      where('messageId', '==', messageId)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as EmailEntity[];
  }

  // Create attachment
  async createEmailAttachment(attachmentData: Omit<EmailAttachment, 'id' | 'createdAt'>): Promise<string> {
    const firestore = ensureDb();
    const now = new Date().toISOString();
    const docRef = await addDoc(collection(firestore, 'emailAttachments'), {
      ...attachmentData,
      createdAt: now
    });
    return docRef.id;
  }

  // Find attachments by SHA256
  async findEmailAttachmentsBySHA256(sha256: string): Promise<EmailAttachment[]> {
    const firestore = ensureDb();
    const q = query(
      collection(firestore, 'emailAttachments'),
      where('sha256', '==', sha256),
      
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as EmailAttachment[];
  }

  // Create SLA
  async createEmailCaseSLA(slaData: Omit<EmailCaseSLA, 'id' | 'createdAt'>): Promise<string> {
    const firestore = ensureDb();
    const now = new Date().toISOString();
    const docRef = await addDoc(collection(firestore, 'emailCaseSLAs'), {
      ...slaData,
      createdAt: now
    });
    return docRef.id;
  }

  // Update SLA
  async updateEmailCaseSLA(slaId: string, updateData: Partial<EmailCaseSLA>): Promise<void> {
    const firestore = ensureDb();
    await updateDoc(doc(firestore, 'emailCaseSLAs', slaId), updateData);
  }

  // Get SLA for case
  async getEmailCaseSLA(caseId: string): Promise<EmailCaseSLA | null> {
    const firestore = ensureDb();
    const q = query(
      collection(firestore, 'emailCaseSLAs'),
      where('caseId', '==', caseId)
    );
    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;
    return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as EmailCaseSLA;
  }

  // Create/update rule
  async saveEmailRule(ruleData: Omit<EmailRule, 'id' | 'createdAt' | 'updatedAt'>, ruleId?: string): Promise<string> {
    const firestore = ensureDb();
    const now = new Date().toISOString();
    if (ruleId) {
      await updateDoc(doc(firestore, 'emailRules', ruleId), {
        ...ruleData,
        updatedAt: now
      });
      return ruleId;
    } else {
      const docRef = await addDoc(collection(firestore, 'emailRules'), {
        ...ruleData,
        createdAt: now,
        updatedAt: now
      });
      return docRef.id;
    }
  }

  // Get rules
  async getEmailRules(): Promise<EmailRule[]> {
    const firestore = ensureDb();
    const q = query(
      collection(firestore, 'emailRules'),
      
    );
    const snapshot = await getDocs(q);
    const rules = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as EmailRule[];
    return rules.sort((a, b) => b.priority - a.priority);
  }

  // Delete rule
  async deleteEmailRule(ruleId: string): Promise<void> {
    const firestore = ensureDb();
    await deleteDoc(doc(firestore, 'emailRules', ruleId));
  }

  // Risk Assessment Management
  async createRiskAssessment(riskData: Omit<RiskAssessment, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const firestore = ensureDb();
    const now = new Date().toISOString();
    
    // Generate unique numeric ID
    const allRisks = await this.getRiskAssessments(riskData.companyId);
    const maxId = allRisks.reduce((max, risk) => {
      const riskId = risk.riskAssessmentId ? parseInt(risk.riskAssessmentId) : 0;
      return riskId > max ? riskId : max;
    }, 0);
    const newRiskId = (maxId + 1).toString();
    
    // Clean the data to remove undefined values
    const cleanObject = (obj: any): any => {
      if (obj === null || obj === undefined) return undefined;
      if (Array.isArray(obj)) {
        const cleaned = obj.map(cleanObject).filter(item => item !== undefined);
        return cleaned.length > 0 ? cleaned : undefined;
      }
      if (typeof obj === 'object') {
        const cleaned: any = {};
        for (const [key, value] of Object.entries(obj)) {
          const cleanedValue = cleanObject(value);
          if (cleanedValue !== undefined) {
            cleaned[key] = cleanedValue;
          }
        }
        return Object.keys(cleaned).length > 0 ? cleaned : undefined;
      }
      return obj;
    };
    
    const cleanedRiskData = cleanObject({
      ...riskData,
      riskAssessmentId: newRiskId,
      createdAt: now,
      updatedAt: now
    });
    
    const docRef = await addDoc(collection(firestore, 'riskAssessments'), cleanedRiskData);
    
    await this.createActivity({
      type: 'document_uploaded',
      title: 'Risikovurdering opprettet',
      description: riskData.title,
      userId: riskData.createdBy,
      userName: 'System',
          });

    return docRef.id;
  }

  async getRiskAssessments( filters?: { status?: string; riskLevel?: string; departmentId?: string }): Promise<RiskAssessment[]> {
    const firestore = ensureDb();
    
    let q = query(
      collection(firestore, 'riskAssessments'),
      
    );

    const snapshot = await getDocs(q);
    let risks = snapshot.docs.map(doc => ({ 
      id: doc.id, 
      ...doc.data() 
    })) as RiskAssessment[];

    // Apply filters in memory
    if (filters?.status && filters.status !== 'all') {
      risks = risks.filter(r => r.status === filters.status);
    }
    if (filters?.riskLevel && filters.riskLevel !== 'all') {
      risks = risks.filter(r => r.riskLevel === filters.riskLevel);
    }
    if (filters?.departmentId) {
      risks = risks.filter(r => r.departmentId === filters.departmentId);
    }
    
    // Sort by review date (newest first)
    return risks.sort((a, b) => {
      const dateA = new Date(a.reviewDate).getTime();
      const dateB = new Date(b.reviewDate).getTime();
      return dateB - dateA;
    });
  }

  async getRiskAssessment(riskId: string): Promise<RiskAssessment | null> {
    const firestore = ensureDb();
    const riskDoc = await getDoc(doc(firestore, 'riskAssessments', riskId));
    if (!riskDoc.exists()) return null;
    return { id: riskDoc.id, ...riskDoc.data() } as RiskAssessment;
  }

  async updateRiskAssessment(riskId: string, updateData: Partial<RiskAssessment>): Promise<void> {
    const firestore = ensureDb();
    await updateDoc(doc(firestore, 'riskAssessments', riskId), {
      ...updateData,
      updatedAt: new Date().toISOString()
    });
  }

  async deleteRiskAssessment(riskId: string): Promise<void> {
    const firestore = ensureDb();
    await deleteDoc(doc(firestore, 'riskAssessments', riskId));
  }

  // Follow-up Action Management
  async createFollowUpAction(actionData: Omit<FollowUpAction, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const firestore = ensureDb();
    const now = new Date().toISOString();
    const docRef = await addDoc(collection(firestore, 'followUpActions'), {
      ...actionData,
      createdAt: now,
      updatedAt: now
    });
    
    await this.createActivity({
      type: 'document_uploaded',
      title: 'Oppfølgingstiltak opprettet',
      description: actionData.title,
      userId: actionData.createdBy,
      userName: 'System',
          });

    return docRef.id;
  }

  async getFollowUpActions( filters?: { status?: string; priority?: string; departmentId?: string }): Promise<FollowUpAction[]> {
    const firestore = ensureDb();
    
    let q = query(
      collection(firestore, 'followUpActions'),
      
    );

    const snapshot = await getDocs(q);
    let actions = snapshot.docs.map(doc => ({ 
      id: doc.id, 
      ...doc.data() 
    })) as FollowUpAction[];

    // Apply filters in memory
    if (filters?.status && filters.status !== 'all') {
      actions = actions.filter(a => a.status === filters.status);
    }
    if (filters?.priority && filters.priority !== 'all') {
      actions = actions.filter(a => a.priority === filters.priority);
    }
    if (filters?.departmentId) {
      actions = actions.filter(a => a.departmentId === filters.departmentId);
    }
    
    // Sort by due date (oldest first)
    return actions.sort((a, b) => {
      const dateA = new Date(a.dueDate).getTime();
      const dateB = new Date(b.dueDate).getTime();
      return dateA - dateB;
    });
  }

  async getFollowUpAction(actionId: string): Promise<FollowUpAction | null> {
    const firestore = ensureDb();
    const actionDoc = await getDoc(doc(firestore, 'followUpActions', actionId));
    if (!actionDoc.exists()) return null;
    return { id: actionDoc.id, ...actionDoc.data() } as FollowUpAction;
  }

  async updateFollowUpAction(actionId: string, updateData: Partial<FollowUpAction>): Promise<void> {
    const firestore = ensureDb();
    await updateDoc(doc(firestore, 'followUpActions', actionId), {
      ...updateData,
      updatedAt: new Date().toISOString()
    });
  }

  async deleteFollowUpAction(actionId: string): Promise<void> {
    const firestore = ensureDb();
    await deleteDoc(doc(firestore, 'followUpActions', actionId));
  }

  // Checkpoint Management
  async createCheckpoint(checkpointData: Omit<Checkpoint, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const firestore = ensureDb();
    const now = new Date().toISOString();
    const docRef = await addDoc(collection(firestore, 'checkpoints'), {
      ...checkpointData,
      createdAt: now,
      updatedAt: now
    });
    
    await this.createActivity({
      type: 'document_uploaded',
      title: 'Kontrollpunkt opprettet',
      description: checkpointData.title,
      userId: checkpointData.createdBy,
      userName: 'System',
          });

    return docRef.id;
  }

  async getCheckpoints( filters?: { status?: string; category?: string; departmentId?: string }): Promise<Checkpoint[]> {
    const firestore = ensureDb();
    
    let q = query(
      collection(firestore, 'checkpoints'),
      
    );

    const snapshot = await getDocs(q);
    let checkpoints = snapshot.docs.map(doc => ({ 
      id: doc.id, 
      ...doc.data() 
    })) as Checkpoint[];

    // Apply filters in memory
    if (filters?.status && filters.status !== 'all') {
      checkpoints = checkpoints.filter(c => c.status === filters.status);
    }
    if (filters?.category && filters.category !== 'all') {
      checkpoints = checkpoints.filter(c => c.category === filters.category);
    }
    if (filters?.departmentId) {
      checkpoints = checkpoints.filter(c => c.departmentId === filters.departmentId);
    }
    
    // Sort by next check date (oldest first)
    return checkpoints.sort((a, b) => {
      const dateA = new Date(a.nextCheck).getTime();
      const dateB = new Date(b.nextCheck).getTime();
      return dateA - dateB;
    });
  }

  async getCheckpoint(checkpointId: string): Promise<Checkpoint | null> {
    const firestore = ensureDb();
    const checkpointDoc = await getDoc(doc(firestore, 'checkpoints', checkpointId));
    if (!checkpointDoc.exists()) return null;
    return { id: checkpointDoc.id, ...checkpointDoc.data() } as Checkpoint;
  }

  async updateCheckpoint(checkpointId: string, updateData: Partial<Checkpoint>): Promise<void> {
    const firestore = ensureDb();
    await updateDoc(doc(firestore, 'checkpoints', checkpointId), {
      ...updateData,
      updatedAt: new Date().toISOString()
    });
  }

  async deleteCheckpoint(checkpointId: string): Promise<void> {
    const firestore = ensureDb();
    await deleteDoc(doc(firestore, 'checkpoints', checkpointId));
  }

  // Helper function to get nearest leader for an employee
  async getNearestLeader(employeeId: string): Promise<Employee | null> {
    const firestore = ensureDb();
    
    try {
      // Get employee
      const employeeDoc = await getDoc(doc(firestore, 'users', employeeId));
      if (!employeeDoc.exists()) return null;
      
      const employee = { id: employeeDoc.id, ...employeeDoc.data() } as Employee;
      
      // If employee has a managerId, return that manager
      if (employee.managerId) {
        const managerDoc = await getDoc(doc(firestore, 'users', employee.managerId));
        if (managerDoc.exists()) {
          return { id: managerDoc.id, ...managerDoc.data() } as Employee;
        }
      }
      
      // If employee has a departmentId, get department leader
      if (employee.departmentId) {
        const deptDoc = await getDoc(doc(firestore, 'departments', employee.departmentId));
        if (deptDoc.exists()) {
          const dept = deptDoc.data();
          if (dept.managerId) {
            const leaderDoc = await getDoc(doc(firestore, 'users', dept.managerId));
            if (leaderDoc.exists()) {
              return { id: leaderDoc.id, ...leaderDoc.data() } as Employee;
            }
          }
        }
      }
      
      // Fallback: get first department_leader or admin
      const q = query(
        collection(firestore, 'users'),
        
        where('role', 'in', ['admin', 'department_leader'])
      );
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as Employee;
      }
      
      return null;
    } catch (error) {
      console.error('Error getting nearest leader:', error);
      return null;
    }
  }
}

export const firebaseService = new FirebaseService();
export default firebaseService; 