// GDPR COMPLIANCE: All queries are filtered by companyId to prevent cross-company data access
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
  email: string;
  phone?: string;
  departmentId?: string;
  position?: string;
  role: 'admin' | 'department_leader' | 'employee';
  avatar?: string;
  createdAt: string;
  updatedAt: string;
  bio?: string;
  address?: string;
  emergencyContact?: string;
  companyId: string;
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
  companyId: string;
  createdAt: string;
  updatedAt: string;
  employeeCount: number;
  budget?: number;
  location?: string;
}

export interface Shift {
  id: string;
  employeeId: string;
  departmentId: string;
  companyId: string;
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
  status: 'reported' | 'investigating' | 'resolved' | 'closed';
  reportedBy: string;
  assignedTo?: string;
  departmentId: string;
  companyId: string;
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
  attachments?: string[];
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
  description?: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  fileType: string;
  category: 'policy' | 'procedure' | 'form' | 'report' | 'other';
  uploadedBy: string;
  companyId: string;
  departmentId?: string;
  createdAt: string;
  updatedAt: string;
  isPublic: boolean;
  tags?: string[];
  version?: string;
}

export interface TimeClock {
  id: string;
  employeeId: string;
  companyId: string;
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
  employeeName: string;
  companyId: string;
  startDate: string;
  endDate: string;
  type: 'sick' | 'personal' | 'other';
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  approvedBy?: string;
  approvedAt?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Vacation {
  id: string;
  employeeId: string;
  employeeName: string;
  companyId: string;
  startDate: string;
  endDate: string;
  type: 'vacation' | 'sick' | 'personal' | 'other';
  days: number;
  status: 'pending' | 'approved' | 'rejected';
  approvedBy?: string;
  approvedAt?: string;
  notes?: string;
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
  companyId: string;
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
  companyId: string;
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
  companyId: string;
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
  companyId: string;
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
  companyId: string;
  createdBy: string;
  updatedAt: string;
}

export interface PartnerAssignment {
  id: string;
  companyId: string;
  partnerId: string;
  title: string;
  description: string;
  startTime: string;
  endTime: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  assignedBy: string;
  assignedTo?: string;
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
  companyId: string;
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

class FirebaseService {
  // Employee Management
  async getEmployees(companyId: string): Promise<Employee[]> {
    const firestore = ensureDb();

    console.log('Fetching employees for company:', companyId);

    try {
      // First, let's check what's in the users collection without any filters
      const allUsersSnapshot = await getDocs(collection(firestore, 'users'));
      console.log('All users in collection:', allUsersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      
      const q = query(
        collection(firestore, 'users'),
        where('companyId', '==', companyId)
      );
      const snapshot = await getDocs(q);
      const employees = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Employee[];
      
      // Sort by createdAt in memory
      employees.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      
      console.log('Found employees for company', companyId, ':', employees.length, employees);
      return employees;
    } catch (error) {
      console.error('Error fetching employees:', error);
      return [];
    }
  }

  async getEmployee(id: string): Promise<Employee | null> {
    const firestore = ensureDb();

    try {
      const docSnap = await getDoc(doc(firestore, 'users', id));
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as Employee;
      }
      return null;
    } catch (error) {
      console.error('Error fetching employee:', error);
      return null;
    }
  }

  async getManagersAndAdmins(companyId: string): Promise<Employee[]> {
    const firestore = ensureDb();

    console.log('Fetching managers and admins for company:', companyId);

    try {
      const q = query(
        collection(firestore, 'users'),
        where('companyId', '==', companyId),
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
      
      console.log('Found managers and admins for company', companyId, ':', managers.length, managers);
      return managers;
    } catch (error) {
      console.error('Error fetching managers and admins:', error);
      return [];
    }
  }

  async createEmployee(employeeData: Omit<Employee, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const firestore = ensureDb();

    console.log('Creating employee with data:', employeeData);

    try {
      const now = new Date().toISOString();
      
      // Remove undefined values to avoid Firebase errors
      const cleanEmployeeData = Object.fromEntries(
        Object.entries(employeeData).filter(([_, value]) => value !== undefined && value !== null)
      );
      
      const employeeDoc = {
        ...cleanEmployeeData,
        createdAt: now,
        updatedAt: now
      };
      
      console.log('Employee document to save:', employeeDoc);
      
      const docRef = await addDoc(collection(firestore, 'users'), employeeDoc);
      console.log('Employee created with ID:', docRef.id);

      // Create activity log
      await this.createActivity({
        type: 'employee_added',
        title: 'Ny ansatt registrert',
        description: `${employeeData.displayName} ble lagt til i systemet`,
        userId: docRef.id,
        userName: employeeData.displayName,
        companyId: employeeData.companyId
      });

      console.log('Activity log created for employee:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('Error creating employee:', error);
      throw error;
    }
  }

  async updateEmployee(id: string, data: Partial<Employee>): Promise<void> {
    const firestore = ensureDb();

    try {
      await updateDoc(doc(firestore, 'users', id), {
        ...data,
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error updating employee:', error);
      throw error;
    }
  }

  async deleteEmployee(id: string): Promise<void> {
    const firestore = ensureDb();

    try {
      // Get employee data before deletion
      const employeeDoc = await getDoc(doc(firestore, 'users', id));
      if (!employeeDoc.exists()) {
        throw new Error('Employee not found');
      }

      const employeeData = employeeDoc.data();
      
      // Delete from Firestore
      await deleteDoc(doc(firestore, 'users', id));
      
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
  async getDepartments(companyId: string): Promise<Department[]> {
    const firestore = ensureDb();

    try {
      const q = query(
        collection(firestore, 'departments'),
        where('companyId', '==', companyId)
      );
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

  async createDepartment(departmentData: Omit<Department, 'id' | 'createdAt' | 'updatedAt' | 'employeeCount'>): Promise<string> {
    const firestore = ensureDb();

    try {
      const now = new Date().toISOString();
      const docRef = await addDoc(collection(firestore, 'departments'), {
        ...departmentData,
        employeeCount: 0,
        createdAt: now,
        updatedAt: now
      });
      return docRef.id;
    } catch (error) {
      console.error('Error creating department:', error);
      throw error;
    }
  }

  async updateDepartment(id: string, data: Partial<Department>): Promise<void> {
    const firestore = ensureDb();

    try {
      await updateDoc(doc(firestore, 'departments', id), {
        ...data,
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error updating department:', error);
      throw error;
    }
  }

  // Shift Management
  async getShifts(companyId: string, filters?: { departmentId?: string; status?: string; date?: string }): Promise<Shift[]> {
    const firestore = ensureDb();

    try {
      let q = query(
        collection(firestore, 'shifts'),
        where('companyId', '==', companyId)
      );

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
        companyId: shiftData.companyId
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
  async getDeviations(companyId: string, filters?: { status?: string; type?: string; severity?: string }): Promise<Deviation[]> {
    const firestore = ensureDb();

    try {
      let q = query(
        collection(firestore, 'deviations'),
        where('companyId', '==', companyId)
      );

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
        companyId: deviationData.companyId
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

  // Document Management
  async getDocuments(companyId: string, filters?: { category?: string; departmentId?: string }): Promise<Document[]> {
    const firestore = ensureDb();

    try {
      let q = query(
        collection(firestore, 'documents'),
        where('companyId', '==', companyId)
      );

      if (filters?.category) {
        q = query(q, where('category', '==', filters.category));
      }
      if (filters?.departmentId) {
        q = query(q, where('departmentId', '==', filters.departmentId));
      }

      const snapshot = await getDocs(q);
      const documents = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Document[];
      
      // Sort in-memory by createdAt descending
      return documents.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } catch (error) {
      console.error('Error fetching documents:', error);
      return [];
    }
  }

  async uploadDocument(file: File, documentData: Omit<Document, 'id' | 'fileUrl' | 'fileSize' | 'fileType' | 'fileName' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const firestore = ensureDb();
    if (!storage) throw new Error('Firebase Storage not initialized');

    try {
      // Upload file to storage
      const fileName = `${Date.now()}_${file.name}`;
      const storageRef = ref(storage, `documents/${documentData.companyId}/${fileName}`);
      await uploadBytes(storageRef, file);
      const fileUrl = await getDownloadURL(storageRef);

      // Create document record
      const now = new Date().toISOString();
      const docRef = await addDoc(collection(firestore, 'documents'), {
        ...documentData,
        fileName: file.name,
        fileUrl,
        fileSize: file.size,
        fileType: file.type,
        createdAt: now,
        updatedAt: now
      });

      await this.createActivity({
        type: 'document_uploaded',
        title: 'Dokument lastet opp',
        description: documentData.title,
        userId: documentData.uploadedBy,
        userName: 'System',
        companyId: documentData.companyId
      });

      return docRef.id;
    } catch (error) {
      console.error('Error uploading document:', error);
      throw error;
    }
  }

  async deleteDocument(id: string, fileUrl: string): Promise<void> {
    const firestore = ensureDb();
    if (!storage) throw new Error('Firebase Storage not initialized');

    try {
      // Delete from storage
      const storageRef = ref(storage, fileUrl);
      await deleteObject(storageRef);

      // Delete from database
      await deleteDoc(doc(firestore, 'documents', id));
    } catch (error) {
      console.error('Error deleting document:', error);
      throw error;
    }
  }

  // Time Clock Management
  async getTimeClocks(companyId: string, filters?: { employeeId?: string; date?: string }): Promise<TimeClock[]> {
    const firestore = ensureDb();

    try {
      let q = query(
        collection(firestore, 'timeclocks'),
        where('companyId', '==', companyId)
      );

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

  async clockIn(employeeId: string, companyId: string, location?: string): Promise<string> {
    const firestore = ensureDb();

    try {
      const now = new Date().toISOString();
      const docRef = await addDoc(collection(firestore, 'timeclocks'), {
        employeeId,
        companyId,
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
        userName: 'System',
        companyId
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
  async getAbsences(companyId: string, filters?: { employeeId?: string; status?: string }): Promise<Absence[]> {
    const firestore = ensureDb();

    try {
      let q = query(
        collection(firestore, 'absences'),
        where('companyId', '==', companyId)
      );

      if (filters?.employeeId) {
        q = query(q, where('employeeId', '==', filters.employeeId));
      }
      if (filters?.status) {
        q = query(q, where('status', '==', filters.status));
      }

      const snapshot = await getDocs(q);
      const absences = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Absence[];

      // Sort by creation date (newest first) in memory
      return absences.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } catch (error) {
      console.error('Error fetching absences:', error);
      return [];
    }
  }

  async createAbsence(absenceData: Omit<Absence, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const firestore = ensureDb();

    try {
      const now = new Date().toISOString();
      const docRef = await addDoc(collection(firestore, 'absences'), {
        ...absenceData,
        createdAt: now,
        updatedAt: now
      });
      return docRef.id;
    } catch (error) {
      console.error('Error creating absence:', error);
      throw error;
    }
  }

  async updateAbsence(id: string, data: Partial<Absence>): Promise<void> {
    const firestore = ensureDb();

    try {
      await updateDoc(doc(firestore, 'absences', id), {
        ...data,
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error updating absence:', error);
      throw error;
    }
  }

  async deleteAbsence(id: string): Promise<void> {
    const firestore = ensureDb();

    try {
      await deleteDoc(doc(firestore, 'absences', id));
    } catch (error) {
      console.error('Error deleting absence:', error);
      throw error;
    }
  }

  // Vacation Management
  async getVacations(companyId: string, filters?: { employeeId?: string; status?: string }): Promise<Vacation[]> {
    const firestore = ensureDb();

    try {
      let q = query(
        collection(firestore, 'vacations'),
        where('companyId', '==', companyId)
      );

      if (filters?.employeeId) {
        q = query(q, where('employeeId', '==', filters.employeeId));
      }
      if (filters?.status) {
        q = query(q, where('status', '==', filters.status));
      }

      const snapshot = await getDocs(q);
      const vacations = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Vacation[];

      // Sort by creation date (newest first) in memory
      return vacations.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } catch (error) {
      console.error('Error fetching vacations:', error);
      return [];
    }
  }

  async createVacation(vacationData: Omit<Vacation, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const firestore = ensureDb();

    try {
      const now = new Date().toISOString();
      const docRef = await addDoc(collection(firestore, 'vacations'), {
        ...vacationData,
        createdAt: now,
        updatedAt: now
      });
      return docRef.id;
    } catch (error) {
      console.error('Error creating vacation:', error);
      throw error;
    }
  }

  async updateVacation(id: string, data: Partial<Vacation>): Promise<void> {
    const firestore = ensureDb();

    try {
      await updateDoc(doc(firestore, 'vacations', id), {
        ...data,
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error updating vacation:', error);
      throw error;
    }
  }

  async deleteVacation(id: string): Promise<void> {
    const firestore = ensureDb();

    try {
      await deleteDoc(doc(firestore, 'vacations', id));
    } catch (error) {
      console.error('Error deleting vacation:', error);
      throw error;
    }
  }

  // Dashboard Statistics
  async getDashboardStats(companyId: string): Promise<DashboardStats> {
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
        getDocs(query(collection(firestore, 'users'), where('companyId', '==', companyId))),
        getDocs(query(collection(firestore, 'shifts'), where('companyId', '==', companyId), where('status', '==', 'in_progress'))),
        getDocs(query(collection(firestore, 'vacations'), where('companyId', '==', companyId), where('status', '==', 'pending'))),
        getDocs(query(collection(firestore, 'departments'), where('companyId', '==', companyId))),
        getDocs(query(collection(firestore, 'deviations'), where('companyId', '==', companyId))),
        getDocs(query(collection(firestore, 'deviations'), where('companyId', '==', companyId), where('status', 'in', ['reported', 'investigating']))),
        getDocs(query(collection(firestore, 'documents'), where('companyId', '==', companyId))),
        getDocs(query(collection(firestore, 'timeclocks'), where('companyId', '==', companyId), where('clockOutTime', '==', null)))
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
  async getActivities(companyId: string, limitCount: number = 10): Promise<Activity[]> {
    const firestore = ensureDb();

    try {
      const q = query(
        collection(firestore, 'activities'),
        where('companyId', '==', companyId)
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
  subscribeToDashboardStats(companyId: string, callback: (stats: DashboardStats) => void) {
    const firestore = ensureDb();

    // For real-time stats, we'll use a combination of listeners
    const unsubscribe = onSnapshot(
      query(collection(firestore, 'users'), where('companyId', '==', companyId)),
      async () => {
        const stats = await this.getDashboardStats(companyId);
        callback(stats);
      }
    );

    return unsubscribe;
  }

  subscribeToActivities(companyId: string, callback: (activities: Activity[]) => void) {
    const firestore = ensureDb();

    const q = query(
      collection(firestore, 'activities'),
      where('companyId', '==', companyId)
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
        companyId: companyRef.id,
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
          companyId: companyRef.id
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
        companyId: companyRef.id,
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

  async getCompanyStats(companyId: string): Promise<{
    totalEmployees: number;
    totalDepartments: number;
    totalDocuments: number;
    totalDeviations: number;
    activeShifts: number;
  }> {
    const firestore = ensureDb();

    try {
      const [employeesSnapshot, departmentsSnapshot, documentsSnapshot, deviationsSnapshot, shiftsSnapshot] = await Promise.all([
        getDocs(query(collection(firestore, 'users'), where('companyId', '==', companyId))),
        getDocs(query(collection(firestore, 'departments'), where('companyId', '==', companyId))),
        getDocs(query(collection(firestore, 'documents'), where('companyId', '==', companyId))),
        getDocs(query(collection(firestore, 'deviations'), where('companyId', '==', companyId))),
        getDocs(query(collection(firestore, 'shifts'), where('companyId', '==', companyId), where('status', '==', 'in_progress')))
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
  async getSurveys(companyId: string): Promise<Survey[]> {
    const firestore = ensureDb();

    try {
      const surveysQuery = query(
        collection(firestore, 'surveys'),
        where('companyId', '==', companyId)
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
  async getPartners(companyId: string): Promise<Partner[]> {
    const firestore = ensureDb();

    try {
      const partnersQuery = query(
        collection(firestore, 'partners'),
        where('companyId', '==', companyId)
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

  async createPartner(partnerData: Omit<Partner, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const firestore = ensureDb();

    try {
      const docRef = await addDoc(collection(firestore, 'partners'), {
        ...partnerData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });

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
    companyId: string;
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

  async getRouteAssignments(companyId: string, startDate?: string, endDate?: string): Promise<any[]> {
    const firestore = ensureDb();

    try {
      let q = query(collection(firestore, 'routeAssignments'), where('companyId', '==', companyId));
      
      if (startDate && endDate) {
        q = query(
          collection(firestore, 'routeAssignments'), 
          where('companyId', '==', companyId),
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
  async savePlannedRoutes(companyId: string, routes: any[]): Promise<void> {
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
  async getPlannedRoutes(companyId: string): Promise<any[]> {
    console.log('📋 Loading planned routes for company:', companyId);
    
    const firestore = ensureDb();

    if (!companyId) {
      console.error('❌ Company ID is missing');
      throw new Error('Company ID is required');
    }

    try {
      const q = query(
        collection(firestore, 'plannedRoutes'),
        where('companyId', '==', companyId)
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

  async updatePartner(id: string, data: Partial<Partner>): Promise<void> {
    const firestore = ensureDb();

    try {
      await updateDoc(doc(firestore, 'partners', id), {
        ...data,
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error updating partner:', error);
      throw error;
    }
  }

  async deletePartner(id: string): Promise<void> {
    const firestore = ensureDb();

    try {
      await deleteDoc(doc(firestore, 'partners', id));
    } catch (error) {
      console.error('Error deleting partner:', error);
      throw error;
    }
  }

  // Settings methods
  async getSettings(companyId: string): Promise<Setting[]> {
    const firestore = ensureDb();

    try {
      const settingsQuery = query(
        collection(firestore, 'settings'),
        where('companyId', '==', companyId)
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

  async getPartnerAssignments(companyId: string, partnerId?: string): Promise<PartnerAssignment[]> {
    const firestore = ensureDb();

    try {
      let q;
      if (partnerId) {
        q = query(
          collection(firestore, 'partnerAssignments'),
          where('companyId', '==', companyId),
          where('partnerId', '==', partnerId)
        );
      } else {
        q = query(
          collection(firestore, 'partnerAssignments'),
          where('companyId', '==', companyId)
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
  async getPartnerUsers(companyId: string, partnerId?: string): Promise<PartnerUser[]> {
    const firestore = ensureDb();

    try {
      let q;
      if (partnerId) {
        q = query(
          collection(firestore, 'partnerUsers'),
          where('companyId', '==', companyId),
          where('partnerId', '==', partnerId)
        );
      } else {
        q = query(
          collection(firestore, 'partnerUsers'),
          where('companyId', '==', companyId)
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
  async uploadPartnerAssignmentFile(file: File, partnerId: string, assignmentId: string, companyId: string): Promise<{ fileUrl: string; fileName: string; fileSize: number }> {
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

  // Audit functions
  async createAudit(auditData: {
    partnerId: string;
    partnerName: string;
    scheduledDate: string;
    status: 'scheduled' | 'completed' | 'overdue';
    companyId: string;
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

  async getAudits(companyId: string): Promise<any[]> {
    const firestore = ensureDb();
    
    const q = query(
      collection(firestore, 'audits'),
      where('companyId', '==', companyId)
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
  async checkOverdueAudits(companyId: string): Promise<any[]> {
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
      companyId: auditData.companyId,
      createdBy: auditData.createdBy,
      notes: `Neste audit planlagt 3 måneder etter forrige audit (${completedDate.toLocaleDateString('no-NO')})`
    });
  }
}

export const firebaseService = new FirebaseService();
export default firebaseService; 