// GDPR COMPLIANCE: All queries are filtered by companyId to prevent cross-company data access
// This ensures complete data isolation between companies

import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  getDocs,
  getDoc,
  writeBatch,
  onSnapshot,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from './firebase';

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

export interface Vacation {
  id: string;
  employeeId: string;
  companyId: string;
  startDate: string;
  endDate: string;
  type: 'vacation' | 'sick' | 'personal' | 'other';
  status: 'pending' | 'approved' | 'rejected';
  requestedBy: string;
  approvedBy?: string;
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
  contactPerson: string;
  email: string;
  phone: string;
  address: string;
  website?: string;
  rating: number;
  projects: number;
  revenue: number;
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

class FirebaseService {
  // Employee Management
  async getEmployees(companyId: string): Promise<Employee[]> {
    if (!db) {
      console.error('Database not initialized in getEmployees');
      return [];
    }

    console.log('Fetching employees for company:', companyId);

    try {
      // First, let's check what's in the users collection without any filters
      const allUsersSnapshot = await getDocs(collection(db, 'users'));
      console.log('All users in collection:', allUsersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      
      const q = query(
        collection(db, 'users'),
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
    if (!db) return null;

    try {
      const docSnap = await getDoc(doc(db, 'users', id));
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as Employee;
      }
      return null;
    } catch (error) {
      console.error('Error fetching employee:', error);
      return null;
    }
  }

  async createEmployee(employeeData: Omit<Employee, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    if (!db) throw new Error('Database not initialized');

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
      
      const docRef = await addDoc(collection(db, 'users'), employeeDoc);
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
    if (!db) throw new Error('Database not initialized');

    try {
      await updateDoc(doc(db, 'users', id), {
        ...data,
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error updating employee:', error);
      throw error;
    }
  }

  async deleteEmployee(id: string): Promise<void> {
    if (!db) throw new Error('Database not initialized');

    try {
      await deleteDoc(doc(db, 'users', id));
    } catch (error) {
      console.error('Error deleting employee:', error);
      throw error;
    }
  }

  // Department Management
  async getDepartments(companyId: string): Promise<Department[]> {
    if (!db) return [];

    try {
      const q = query(
        collection(db, 'departments'),
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
    if (!db) throw new Error('Database not initialized');

    try {
      const now = new Date().toISOString();
      const docRef = await addDoc(collection(db, 'departments'), {
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
    if (!db) throw new Error('Database not initialized');

    try {
      await updateDoc(doc(db, 'departments', id), {
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
    if (!db) return [];

    try {
      let q = query(
        collection(db, 'shifts'),
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
    if (!db) throw new Error('Database not initialized');

    try {
      const now = new Date().toISOString();
      const docRef = await addDoc(collection(db, 'shifts'), {
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
    if (!db) throw new Error('Database not initialized');

    try {
      await updateDoc(doc(db, 'shifts', id), {
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
    if (!db) return [];

    try {
      let q = query(
        collection(db, 'deviations'),
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
    if (!db) throw new Error('Database not initialized');

    try {
      const now = new Date().toISOString();
      const docRef = await addDoc(collection(db, 'deviations'), {
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
    if (!db) throw new Error('Database not initialized');

    try {
      await updateDoc(doc(db, 'deviations', id), {
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
    if (!db) return [];

    try {
      let q = query(
        collection(db, 'documents'),
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
    if (!db || !storage) throw new Error('Firebase not initialized');

    try {
      // Upload file to storage
      const fileName = `${Date.now()}_${file.name}`;
      const storageRef = ref(storage, `documents/${documentData.companyId}/${fileName}`);
      await uploadBytes(storageRef, file);
      const fileUrl = await getDownloadURL(storageRef);

      // Create document record
      const now = new Date().toISOString();
      const docRef = await addDoc(collection(db, 'documents'), {
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
    if (!db || !storage) throw new Error('Firebase not initialized');

    try {
      // Delete from storage
      const storageRef = ref(storage, fileUrl);
      await deleteObject(storageRef);

      // Delete from database
      await deleteDoc(doc(db, 'documents', id));
    } catch (error) {
      console.error('Error deleting document:', error);
      throw error;
    }
  }

  // Time Clock Management
  async getTimeClocks(companyId: string, filters?: { employeeId?: string; date?: string }): Promise<TimeClock[]> {
    if (!db) return [];

    try {
      let q = query(
        collection(db, 'timeclocks'),
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
    if (!db) throw new Error('Database not initialized');

    try {
      const now = new Date().toISOString();
      const docRef = await addDoc(collection(db, 'timeclocks'), {
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
    if (!db) throw new Error('Database not initialized');

    try {
      const now = new Date().toISOString();
      await updateDoc(doc(db, 'timeclocks', timeClockId), {
        clockOutTime: now,
        updatedAt: now
      });
    } catch (error) {
      console.error('Error clocking out:', error);
      throw error;
    }
  }

  // Vacation Management
  async getVacations(companyId: string, filters?: { employeeId?: string; status?: string }): Promise<Vacation[]> {
    if (!db) return [];

    try {
      let q = query(
        collection(db, 'vacations'),
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
    if (!db) throw new Error('Database not initialized');

    try {
      const now = new Date().toISOString();
      const docRef = await addDoc(collection(db, 'vacations'), {
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
    if (!db) throw new Error('Database not initialized');

    try {
      await updateDoc(doc(db, 'vacations', id), {
        ...data,
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error updating vacation:', error);
      throw error;
    }
  }

  // Dashboard Statistics
  async getDashboardStats(companyId: string): Promise<DashboardStats> {
    if (!db) {
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
        getDocs(query(collection(db, 'users'), where('companyId', '==', companyId))),
        getDocs(query(collection(db, 'shifts'), where('companyId', '==', companyId), where('status', '==', 'in_progress'))),
        getDocs(query(collection(db, 'vacations'), where('companyId', '==', companyId), where('status', '==', 'pending'))),
        getDocs(query(collection(db, 'departments'), where('companyId', '==', companyId))),
        getDocs(query(collection(db, 'deviations'), where('companyId', '==', companyId))),
        getDocs(query(collection(db, 'deviations'), where('companyId', '==', companyId), where('status', 'in', ['reported', 'investigating']))),
        getDocs(query(collection(db, 'documents'), where('companyId', '==', companyId))),
        getDocs(query(collection(db, 'timeclocks'), where('companyId', '==', companyId), where('clockOutTime', '==', null)))
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
    if (!db) return [];

    try {
      const q = query(
        collection(db, 'activities'),
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
    if (!db) return;

    try {
      await addDoc(collection(db, 'activities'), {
        ...activityData,
        createdAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error creating activity:', error);
    }
  }

  // Real-time listeners
  subscribeToDashboardStats(companyId: string, callback: (stats: DashboardStats) => void) {
    if (!db) return () => {};

    // For real-time stats, we'll use a combination of listeners
    const unsubscribe = onSnapshot(
      query(collection(db, 'users'), where('companyId', '==', companyId)),
      async () => {
        const stats = await this.getDashboardStats(companyId);
        callback(stats);
      }
    );

    return unsubscribe;
  }

  subscribeToActivities(companyId: string, callback: (activities: Activity[]) => void) {
    if (!db) return () => {};

    const q = query(
      collection(db, 'activities'),
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
    if (!db) return [];

    try {
      const q = query(collection(db, 'companies'));
      const snapshot = await getDocs(q);
      const companies = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Company[];
      
      // Sort by createdAt in memory
      companies.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      return companies;
    } catch (error) {
      console.error('Error fetching companies:', error);
      return [];
    }
  }

  async getCompany(id: string): Promise<Company | null> {
    if (!db) return null;

    try {
      const docRef = doc(db, 'companies', id);
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
    if (!db) throw new Error('Database not initialized');

    try {
      // Check if company with same name already exists
      const existingCompaniesQuery = query(
        collection(db, 'companies'),
        where('name', '==', companyData.name)
      );
      const existingSnapshot = await getDocs(existingCompaniesQuery);
      
      if (!existingSnapshot.empty) {
        throw new Error(`En bedrift med navnet "${companyData.name}" eksisterer allerede. Vennligst velg et annet navn.`);
      }

      const docRef = await addDoc(collection(db, 'companies'), {
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

  async updateCompany(id: string, data: Partial<Company>): Promise<void> {
    if (!db) throw new Error('Database not initialized');

    try {
      // If name is being updated, check for duplicates
      if (data.name) {
        const existingCompaniesQuery = query(
          collection(db, 'companies'),
          where('name', '==', data.name)
        );
        const existingSnapshot = await getDocs(existingCompaniesQuery);
        
        // Check if any company with this name exists (excluding the current company being updated)
        const duplicateExists = existingSnapshot.docs.some(doc => doc.id !== id);
        
        if (duplicateExists) {
          throw new Error(`En bedrift med navnet "${data.name}" eksisterer allerede. Vennligst velg et annet navn.`);
        }
      }

      const docRef = doc(db, 'companies', id);
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
    if (!db) throw new Error('Database not initialized');

    try {
      // Delete all users associated with this company
      const usersQuery = query(collection(db, 'users'), where('companyId', '==', id));
      const usersSnapshot = await getDocs(usersQuery);
      const userDeletePromises = usersSnapshot.docs.map(async (userDoc) => {
        return deleteDoc(doc(db, 'users', userDoc.id));
      });

      // Delete all documents associated with this company
      const documentsQuery = query(collection(db, 'documents'), where('companyId', '==', id));
      const documentsSnapshot = await getDocs(documentsQuery);
      const documentDeletePromises = documentsSnapshot.docs.map(async (docDoc) => {
        return deleteDoc(doc(db, 'documents', docDoc.id));
      });

      // Delete all deviations associated with this company
      const deviationsQuery = query(collection(db, 'deviations'), where('companyId', '==', id));
      const deviationsSnapshot = await getDocs(deviationsQuery);
      const deviationDeletePromises = deviationsSnapshot.docs.map(async (deviationDoc) => {
        return deleteDoc(doc(db, 'deviations', deviationDoc.id));
      });

      // Delete all shifts associated with this company
      const shiftsQuery = query(collection(db, 'shifts'), where('companyId', '==', id));
      const shiftsSnapshot = await getDocs(shiftsQuery);
      const shiftDeletePromises = shiftsSnapshot.docs.map(async (shiftDoc) => {
        return deleteDoc(doc(db, 'shifts', shiftDoc.id));
      });

      // Delete all timeclock records associated with this company
      const timeclockQuery = query(collection(db, 'timeclock'), where('companyId', '==', id));
      const timeclockSnapshot = await getDocs(timeclockQuery);
      const timeclockDeletePromises = timeclockSnapshot.docs.map(async (timeclockDoc) => {
        return deleteDoc(doc(db, 'timeclock', timeclockDoc.id));
      });

      // Delete all vacations associated with this company
      const vacationsQuery = query(collection(db, 'vacations'), where('companyId', '==', id));
      const vacationsSnapshot = await getDocs(vacationsQuery);
      const vacationDeletePromises = vacationsSnapshot.docs.map(async (vacationDoc) => {
        return deleteDoc(doc(db, 'vacations', vacationDoc.id));
      });

      // Delete all departments associated with this company
      const departmentsQuery = query(collection(db, 'departments'), where('companyId', '==', id));
      const departmentsSnapshot = await getDocs(departmentsQuery);
      const departmentDeletePromises = departmentsSnapshot.docs.map(async (departmentDoc) => {
        return deleteDoc(doc(db, 'departments', departmentDoc.id));
      });

      // Delete all surveys associated with this company
      const surveysQuery = query(collection(db, 'surveys'), where('companyId', '==', id));
      const surveysSnapshot = await getDocs(surveysQuery);
      const surveyDeletePromises = surveysSnapshot.docs.map(async (surveyDoc) => {
        return deleteDoc(doc(db, 'surveys', surveyDoc.id));
      });

      // Delete all partners associated with this company
      const partnersQuery = query(collection(db, 'partners'), where('companyId', '==', id));
      const partnersSnapshot = await getDocs(partnersQuery);
      const partnerDeletePromises = partnersSnapshot.docs.map(async (partnerDoc) => {
        return deleteDoc(doc(db, 'partners', partnerDoc.id));
      });

      // Delete all settings associated with this company
      const settingsQuery = query(collection(db, 'settings'), where('companyId', '==', id));
      const settingsSnapshot = await getDocs(settingsQuery);
      const settingDeletePromises = settingsSnapshot.docs.map(async (settingDoc) => {
        return deleteDoc(doc(db, 'settings', settingDoc.id));
      });

      // Delete all activities associated with this company
      const activitiesQuery = query(collection(db, 'activities'), where('companyId', '==', id));
      const activitiesSnapshot = await getDocs(activitiesQuery);
      const activityDeletePromises = activitiesSnapshot.docs.map(async (activityDoc) => {
        return deleteDoc(doc(db, 'activities', activityDoc.id));
      });

      // Delete all chats associated with this company
      const chatsQuery = query(collection(db, 'chats'), where('companyId', '==', id));
      const chatsSnapshot = await getDocs(chatsQuery);
      const chatDeletePromises = chatsSnapshot.docs.map(async (chatDoc) => {
        // Delete all messages in this chat first
        const messagesQuery = query(collection(db, `chats/${chatDoc.id}/messages`));
        const messagesSnapshot = await getDocs(messagesQuery);
        const messageDeletePromises = messagesSnapshot.docs.map(async (messageDoc) => {
          return deleteDoc(doc(db, `chats/${chatDoc.id}/messages`, messageDoc.id));
        });
        await Promise.all(messageDeletePromises);
        
        // Then delete the chat itself
        return deleteDoc(doc(db, 'chats', chatDoc.id));
      });

      // Delete all survey responses associated with this company
      const surveyResponsesQuery = query(collection(db, 'surveyResponses'), where('companyId', '==', id));
      const surveyResponsesSnapshot = await getDocs(surveyResponsesQuery);
      const surveyResponseDeletePromises = surveyResponsesSnapshot.docs.map(async (responseDoc) => {
        return deleteDoc(doc(db, 'surveyResponses', responseDoc.id));
      });

      // Delete all admin setup tokens associated with this company
      const adminSetupTokensQuery = query(collection(db, 'adminSetupTokens'), where('companyId', '==', id));
      const adminSetupTokensSnapshot = await getDocs(adminSetupTokensQuery);
      const adminSetupTokenDeletePromises = adminSetupTokensSnapshot.docs.map(async (tokenDoc) => {
        return deleteDoc(doc(db, 'adminSetupTokens', tokenDoc.id));
      });

      // Delete all absences associated with this company
      const absencesQuery = query(collection(db, 'absences'), where('companyId', '==', id));
      const absencesSnapshot = await getDocs(absencesQuery);
      const absenceDeletePromises = absencesSnapshot.docs.map(async (absenceDoc) => {
        return deleteDoc(doc(db, 'absences', absenceDoc.id));
      });

      // Delete all notifications associated with this company
      const notificationsQuery = query(collection(db, 'notifications'), where('companyId', '==', id));
      const notificationsSnapshot = await getDocs(notificationsQuery);
      const notificationDeletePromises = notificationsSnapshot.docs.map(async (notificationDoc) => {
        return deleteDoc(doc(db, 'notifications', notificationDoc.id));
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
      const docRef = doc(db, 'companies', id);
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
    if (!db) return {
      totalEmployees: 0,
      totalDepartments: 0,
      totalDocuments: 0,
      totalDeviations: 0,
      activeShifts: 0
    };

    try {
      const [employeesSnapshot, departmentsSnapshot, documentsSnapshot, deviationsSnapshot, shiftsSnapshot] = await Promise.all([
        getDocs(query(collection(db, 'users'), where('companyId', '==', companyId))),
        getDocs(query(collection(db, 'departments'), where('companyId', '==', companyId))),
        getDocs(query(collection(db, 'documents'), where('companyId', '==', companyId))),
        getDocs(query(collection(db, 'deviations'), where('companyId', '==', companyId))),
        getDocs(query(collection(db, 'shifts'), where('companyId', '==', companyId), where('status', '==', 'in_progress')))
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
    if (!db) return [];

    try {
      const surveysQuery = query(
        collection(db, 'surveys'),
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
    if (!db) throw new Error('Firebase not initialized');

    try {
      const docRef = await addDoc(collection(db, 'surveys'), {
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
    if (!db) throw new Error('Firebase not initialized');

    try {
      await updateDoc(doc(db, 'surveys', id), {
        ...data,
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error updating survey:', error);
      throw error;
    }
  }

  async deleteSurvey(id: string): Promise<void> {
    if (!db) throw new Error('Firebase not initialized');

    try {
      await deleteDoc(doc(db, 'surveys', id));
    } catch (error) {
      console.error('Error deleting survey:', error);
      throw error;
    }
  }

  async getSurveyResponses(surveyId: string): Promise<SurveyResponse[]> {
    if (!db) return [];

    try {
      const responsesQuery = query(
        collection(db, 'surveyResponses'),
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
    if (!db) throw new Error('Firebase not initialized');

    try {
      const docRef = await addDoc(collection(db, 'surveyResponses'), {
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
    if (!db) return [];

    try {
      const partnersQuery = query(
        collection(db, 'partners'),
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
    if (!db) throw new Error('Firebase not initialized');

    try {
      const docRef = await addDoc(collection(db, 'partners'), {
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

  async updatePartner(id: string, data: Partial<Partner>): Promise<void> {
    if (!db) throw new Error('Firebase not initialized');

    try {
      await updateDoc(doc(db, 'partners', id), {
        ...data,
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error updating partner:', error);
      throw error;
    }
  }

  async deletePartner(id: string): Promise<void> {
    if (!db) throw new Error('Firebase not initialized');

    try {
      await deleteDoc(doc(db, 'partners', id));
    } catch (error) {
      console.error('Error deleting partner:', error);
      throw error;
    }
  }

  // Settings methods
  async getSettings(companyId: string): Promise<Setting[]> {
    if (!db) return [];

    try {
      const settingsQuery = query(
        collection(db, 'settings'),
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
    if (!db) throw new Error('Firebase not initialized');

    try {
      const docRef = await addDoc(collection(db, 'settings'), {
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
    if (!db) throw new Error('Firebase not initialized');

    try {
      await updateDoc(doc(db, 'settings', id), {
        ...data,
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error updating setting:', error);
      throw error;
    }
  }

  async deleteSetting(id: string): Promise<void> {
    if (!db) throw new Error('Firebase not initialized');

    try {
      await deleteDoc(doc(db, 'settings', id));
    } catch (error) {
      console.error('Error deleting setting:', error);
      throw error;
    }
  }
}

export const firebaseService = new FirebaseService();
export default firebaseService; 