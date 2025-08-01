import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  limit,
  getDocs,
  getDoc,
  writeBatch,
  orderBy,
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
  departmentId: string;
  position: string;
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
  salary?: number;
  managerId?: string;
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
  type: 'safety' | 'quality' | 'security' | 'process' | 'other';
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'reported' | 'investigating' | 'resolved' | 'closed';
  reportedBy: string;
  assignedTo?: string;
  departmentId: string;
  companyId: string;
  location?: string;
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

class FirebaseService {
  // Employee Management
  async getEmployees(companyId: string): Promise<Employee[]> {
    if (!db) return [];

    try {
      const q = query(
        collection(db, 'users'),
        where('companyId', '==', companyId),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Employee[];
    } catch (error) {
      console.error('Error fetching employees:', error);
      return [];
    }
  }

  async getEmployee(id: string): Promise<Employee | null> {
    if (!db) return null;

    try {
      const doc = await getDoc(doc(db, 'users', id));
      if (doc.exists()) {
        return { id: doc.id, ...doc.data() } as Employee;
      }
      return null;
    } catch (error) {
      console.error('Error fetching employee:', error);
      return null;
    }
  }

  async createEmployee(employeeData: Omit<Employee, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    if (!db) throw new Error('Database not initialized');

    try {
      const now = new Date().toISOString();
      const docRef = await addDoc(collection(db, 'users'), {
        ...employeeData,
        createdAt: now,
        updatedAt: now
      });

      // Create activity log
      await this.createActivity({
        type: 'employee_added',
        title: 'Ny ansatt registrert',
        description: `${employeeData.displayName} ble lagt til i systemet`,
        userId: employeeData.id,
        userName: employeeData.displayName,
        companyId: employeeData.companyId
      });

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
        where('companyId', '==', companyId),
        orderBy('name')
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Department[];
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

      q = query(q, orderBy('startTime', 'desc'));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Shift[];
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

      q = query(q, orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Deviation[];
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

      q = query(q, orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Document[];
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

      q = query(q, orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as TimeClock[];
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

      q = query(q, orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Vacation[];
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
        where('companyId', '==', companyId),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Activity[];
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
      where('companyId', '==', companyId),
      orderBy('createdAt', 'desc'),
      limit(10)
    );

    return onSnapshot(q, (snapshot) => {
      const activities = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Activity[];
      callback(activities);
    });
  }
}

export const firebaseService = new FirebaseService();
export default firebaseService; 