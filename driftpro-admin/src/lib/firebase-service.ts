import { 
  collection, 
  query, 
  where, 
  getDocs, 
  doc, 
  getDoc, 
  addDoc, 
  updateDoc,
  deleteDoc,
  orderBy,
  limit,
  startAfter,
  Timestamp,
  writeBatch,
  onSnapshot,
  Unsubscribe
} from 'firebase/firestore';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut,
  User as FirebaseUser,
  sendPasswordResetEmail
} from 'firebase/auth';
import { 
  ref, 
  uploadBytes, 
  getDownloadURL, 
  deleteObject,
  listAll
} from 'firebase/storage';
import { db, auth, storage } from './firebase';

export interface Company {
  id: string;
  name: string;
  industry: string;
  employees: number;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  isActive: boolean;
  createdAt: Date;
  settings?: {
    enableDeviationReporting?: boolean;
    enableRiskAnalysis?: boolean;
    enableDocumentArchive?: boolean;
    enableInternalControl?: boolean;
    enableChat?: boolean;
    enableBirthdayCalendar?: boolean;
    maxFileSizeMB?: number;
    allowedFileTypes?: string[];
  };
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'admin' | 'manager' | 'employee';
  companyId: string;
  department?: string;
  phoneNumber?: string;
  profileImageURL?: string;
  isActive: boolean;
  createdAt: Date;
  lastLoginAt?: Date;
  birthday?: Date;
  employeeId?: string;
}

export interface Department {
  id: string;
  name: string;
  description: string;
  manager: string;
  managerId: string;
  employeeCount: number;
  isActive: boolean;
  createdAt: Date;
  companyId: string;
  color?: string;
  budget?: number;
}

export interface Absence {
  id: string;
  employeeId: string;
  employeeName: string;
  type: 'sykdom' | 'ferie' | 'permisjon' | 'andre';
  startDate: Date;
  endDate: Date;
  status: 'pending' | 'approved' | 'rejected';
  description: string;
  createdAt: Date;
  approvedBy?: string;
  approvedAt?: Date;
  companyId: string;
  department?: string;
  attachmentURL?: string;
}

export interface TimeEntry {
  id: string;
  employeeId: string;
  employeeName: string;
  type: 'clock-in' | 'clock-out';
  timestamp: Date;
  location?: string;
  notes?: string;
  companyId: string;
  department?: string;
  deviceInfo?: {
    userAgent: string;
    ipAddress?: string;
  };
}

export interface Document {
  id: string;
  title: string;
  description: string;
  category: string;
  fileName: string;
  fileURL: string;
  fileSize: number;
  fileType: string;
  uploadedBy: string;
  uploadedById: string;
  createdAt: Date;
  updatedAt: Date;
  companyId: string;
  department?: string;
  tags: string[];
  isPublic: boolean;
  version: number;
  downloads: number;
}

export interface Deviation {
  id: string;
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'in-progress' | 'resolved' | 'closed';
  category: string;
  reportedBy: string;
  reportedById: string;
  assignedTo?: string;
  assignedToId?: string;
  createdAt: Date;
  updatedAt: Date;
  resolvedAt?: Date;
  companyId: string;
  department?: string;
  location?: string;
  attachments: string[];
  priority: 'low' | 'medium' | 'high';
  estimatedHours?: number;
  actualHours?: number;
}

export interface ChatMessage {
  id: string;
  content: string;
  senderId: string;
  senderName: string;
  timestamp: Date;
  companyId: string;
  department?: string;
  isSystemMessage: boolean;
  attachments?: string[];
  replyTo?: string;
}

export interface ChatRoom {
  id: string;
  name: string;
  type: 'general' | 'department' | 'private';
  participants: string[];
  lastMessage?: ChatMessage;
  createdAt: Date;
  companyId: string;
  department?: string;
}

export interface Shift {
  id: string;
  employeeId: string;
  employeeName: string;
  startTime: Date;
  endTime: Date;
  type: 'day' | 'night' | 'weekend' | 'holiday';
  status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled';
  notes?: string;
  companyId: string;
  department?: string;
  location?: string;
  breakTime?: number; // minutes
}

export interface Report {
  id: string;
  title: string;
  type: 'absence' | 'time' | 'deviation' | 'performance' | 'custom';
  description: string;
  data: any;
  generatedBy: string;
  generatedById: string;
  createdAt: Date;
  companyId: string;
  dateRange: {
    start: Date;
    end: Date;
  };
  format: 'pdf' | 'excel' | 'csv';
  status: 'generating' | 'completed' | 'failed';
  downloadURL?: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  recipientId: string;
  senderId?: string;
  createdAt: Date;
  readAt?: Date;
  companyId: string;
  actionURL?: string;
  priority: 'low' | 'medium' | 'high';
}

export interface AuditLog {
  id: string;
  action: string;
  entityType: 'user' | 'department' | 'absence' | 'document' | 'deviation';
  entityId: string;
  userId: string;
  userName: string;
  timestamp: Date;
  companyId: string;
  details: any;
  ipAddress?: string;
  userAgent?: string;
}

export class FirebaseService {
  // Company methods
  static async searchCompanies(searchTerm: string): Promise<Company[]> {
    if (!db) {
      console.error('Firebase not initialized - db is null');
      console.log('Firebase config check:', {
        apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ? 'SET' : 'MISSING',
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ? 'SET' : 'MISSING'
      });
      return [];
    }

    try {
      const companiesRef = collection(db, 'companies');
      const q = query(companiesRef);
      
      const querySnapshot = await getDocs(q);
      const companies: Company[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            data.industry?.toLowerCase().includes(searchTerm.toLowerCase())) {
          companies.push({
            id: doc.id,
            name: data.name || 'Ukjent bedrift',
            industry: data.industry || 'Generell',
            employees: data.employees || 0,
            address: data.address || '',
            phone: data.phone || '',
            email: data.email || '',
            website: data.website || '',
            isActive: data.isActive !== false,
            createdAt: data.createdAt?.toDate() || new Date(),
            settings: data.settings || {
              enableDeviationReporting: true,
              enableRiskAnalysis: true,
              enableDocumentArchive: true,
              enableInternalControl: true,
              enableChat: true,
              enableBirthdayCalendar: true,
              maxFileSizeMB: 10,
              allowedFileTypes: ['pdf', 'doc', 'docx', 'jpg', 'png']
            }
          } as Company);
        }
      });
      
      if (companies.length === 0) {
        console.log('No companies found in database, adding test data...');
        await this.addTestCompanies();
        
        const newQuerySnapshot = await getDocs(q);
        newQuerySnapshot.forEach((doc) => {
          const data = doc.data();
          if (data.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
              data.industry?.toLowerCase().includes(searchTerm.toLowerCase())) {
            companies.push({
              id: doc.id,
              name: data.name || 'Ukjent bedrift',
              industry: data.industry || 'Generell',
              employees: data.employees || 0,
              address: data.address || '',
              phone: data.phone || '',
              email: data.email || '',
              website: data.website || '',
              isActive: data.isActive !== false,
              createdAt: data.createdAt?.toDate() || new Date(),
              settings: data.settings || {
                enableDeviationReporting: true,
                enableRiskAnalysis: true,
                enableDocumentArchive: true,
                enableInternalControl: true,
                enableChat: true,
                enableBirthdayCalendar: true,
                maxFileSizeMB: 10,
                allowedFileTypes: ['pdf', 'doc', 'docx', 'jpg', 'png']
              }
            } as Company);
          }
        });
      }
      
      return companies;
    } catch (error) {
      console.error('Error searching companies:', error);
      return [];
    }
  }

  static async getCompanyById(companyId: string): Promise<Company | null> {
    if (!db) {
      console.warn('Firebase not initialized');
      return null;
    }

    try {
      const companyDoc = await getDoc(doc(db, 'companies', companyId));
      if (companyDoc.exists()) {
        const data = companyDoc.data();
        return {
          id: companyDoc.id,
          name: data.name || 'Ukjent bedrift',
          industry: data.industry || 'Generell',
          employees: data.employees || 0,
          address: data.address || '',
          phone: data.phone || '',
          email: data.email || '',
          website: data.website || '',
          isActive: data.isActive !== false,
          createdAt: data.createdAt?.toDate() || new Date(),
          settings: data.settings || {
            enableDeviationReporting: true,
            enableRiskAnalysis: true,
            enableDocumentArchive: true,
            enableInternalControl: true,
            enableChat: true,
            enableBirthdayCalendar: true,
            maxFileSizeMB: 10,
            allowedFileTypes: ['pdf', 'doc', 'docx', 'jpg', 'png']
          }
        } as Company;
      }
      return null;
    } catch (error) {
      console.error('Error getting company:', error);
      return null;
    }
  }

  // User methods
  static async getUserById(userId: string): Promise<User | null> {
    if (!db) {
      console.warn('Firebase not initialized');
      return null;
    }

    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (userDoc.exists()) {
        const data = userDoc.data();
        return {
          id: userDoc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          lastLoginAt: data.lastLoginAt?.toDate(),
          birthday: data.birthday?.toDate()
        } as User;
      }
      return null;
    } catch (error) {
      console.error('Error getting user:', error);
      return null;
    }
  }

  static async getUsersByCompany(companyId: string): Promise<User[]> {
    if (!db) {
      console.warn('Firebase not initialized');
      return [];
    }

    try {
      const usersRef = collection(db, 'users');
      const q = query(usersRef);
      
      const querySnapshot = await getDocs(q);
      const users: User[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.companyId === companyId && data.isActive !== false) {
          users.push({
            id: doc.id,
            email: data.email || '',
            firstName: data.firstName || '',
            lastName: data.lastName || '',
            role: data.role || 'employee',
            companyId: data.companyId || '',
            department: data.department || '',
            phoneNumber: data.phoneNumber || '',
            profileImageURL: data.profileImageURL || '',
            isActive: data.isActive !== false,
            createdAt: data.createdAt?.toDate() || new Date(),
            lastLoginAt: data.lastLoginAt?.toDate(),
            birthday: data.birthday?.toDate(),
            employeeId: data.employeeId || ''
          } as User);
        }
      });
      
      return users;
    } catch (error) {
      console.error('Error getting users by company:', error);
      return [];
    }
  }

  static async createUser(userData: Omit<User, 'id'>): Promise<User> {
    if (!db) {
      throw new Error('Firebase not initialized');
    }

    try {
      const userDoc = await addDoc(collection(db, 'users'), {
        ...userData,
        createdAt: Timestamp.now(),
        lastLoginAt: Timestamp.now()
      });
      
      return {
        id: userDoc.id,
        ...userData
      };
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  static async updateUser(userId: string, userData: Partial<User>): Promise<void> {
    if (!db) {
      throw new Error('Firebase not initialized');
    }

    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        ...userData,
        updatedAt: Timestamp.now()
      });
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  }

  static async deleteUser(userId: string): Promise<void> {
    if (!db) {
      throw new Error('Firebase not initialized');
    }

    try {
      await deleteDoc(doc(db, 'users', userId));
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  }

  // Department methods
  static async getDepartmentsByCompany(companyId: string): Promise<Department[]> {
    if (!db) {
      console.warn('Firebase not initialized');
      return [];
    }

    try {
      const departmentsRef = collection(db, 'departments');
      const q = query(departmentsRef);
      
      const querySnapshot = await getDocs(q);
      const departments: Department[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.companyId === companyId) {
          departments.push({
            id: doc.id,
            name: data.name || '',
            description: data.description || '',
            manager: data.manager || '',
            managerId: data.managerId || '',
            employeeCount: data.employeeCount || 0,
            isActive: data.isActive !== false,
            createdAt: data.createdAt?.toDate() || new Date(),
            companyId: data.companyId || '',
            color: data.color || '#3c8dbc',
            budget: data.budget || 0
          } as Department);
        }
      });
      
      return departments;
    } catch (error) {
      console.error('Error getting departments:', error);
      return [];
    }
  }

  static async createDepartment(departmentData: Omit<Department, 'id'>): Promise<Department> {
    if (!db) {
      throw new Error('Firebase not initialized');
    }

    try {
      const departmentDoc = await addDoc(collection(db, 'departments'), {
        ...departmentData,
        createdAt: Timestamp.now()
      });
      
      return {
        id: departmentDoc.id,
        ...departmentData
      };
    } catch (error) {
      console.error('Error creating department:', error);
      throw error;
    }
  }

  static async updateDepartment(departmentId: string, departmentData: Partial<Department>): Promise<void> {
    if (!db) {
      throw new Error('Firebase not initialized');
    }

    try {
      const departmentRef = doc(db, 'departments', departmentId);
      await updateDoc(departmentRef, {
        ...departmentData,
        updatedAt: Timestamp.now()
      });
    } catch (error) {
      console.error('Error updating department:', error);
      throw error;
    }
  }

  static async deleteDepartment(departmentId: string): Promise<void> {
    if (!db) {
      throw new Error('Firebase not initialized');
    }

    try {
      await deleteDoc(doc(db, 'departments', departmentId));
    } catch (error) {
      console.error('Error deleting department:', error);
      throw error;
    }
  }

  // Absence methods
  static async getAbsencesByCompany(companyId: string): Promise<Absence[]> {
    if (!db) {
      console.warn('Firebase not initialized');
      return [];
    }

    try {
      const absencesRef = collection(db, 'absences');
      const q = query(
        absencesRef,
        where('companyId', '==', companyId),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const absences: Absence[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        absences.push({
          id: doc.id,
          employeeId: data.employeeId || '',
          employeeName: data.employeeName || '',
          type: data.type || 'ferie',
          startDate: data.startDate?.toDate() || new Date(),
          endDate: data.endDate?.toDate() || new Date(),
          status: data.status || 'pending',
          description: data.description || '',
          createdAt: data.createdAt?.toDate() || new Date(),
          approvedBy: data.approvedBy || '',
          approvedAt: data.approvedAt?.toDate(),
          companyId: data.companyId || '',
          department: data.department || '',
          attachmentURL: data.attachmentURL || ''
        } as Absence);
      });
      
      return absences;
    } catch (error) {
      console.error('Error getting absences:', error);
      return [];
    }
  }

  static async createAbsence(absenceData: Omit<Absence, 'id'>): Promise<Absence> {
    if (!db) {
      throw new Error('Firebase not initialized');
    }

    try {
      const absenceDoc = await addDoc(collection(db, 'absences'), {
        ...absenceData,
        createdAt: Timestamp.now(),
        startDate: Timestamp.fromDate(absenceData.startDate),
        endDate: Timestamp.fromDate(absenceData.endDate)
      });
      
      return {
        id: absenceDoc.id,
        ...absenceData
      };
    } catch (error) {
      console.error('Error creating absence:', error);
      throw error;
    }
  }

  static async updateAbsenceStatus(absenceId: string, status: 'approved' | 'rejected', approvedBy: string): Promise<void> {
    if (!db) {
      throw new Error('Firebase not initialized');
    }

    try {
      const absenceRef = doc(db, 'absences', absenceId);
      await updateDoc(absenceRef, {
        status,
        approvedBy,
        approvedAt: Timestamp.now()
      });
    } catch (error) {
      console.error('Error updating absence status:', error);
      throw error;
    }
  }

  // Time tracking methods
  static async getTimeEntriesByCompany(companyId: string, limitCount: number = 100): Promise<TimeEntry[]> {
    if (!db) {
      console.warn('Firebase not initialized');
      return [];
    }

    try {
      const timeEntriesRef = collection(db, 'timeEntries');
      const q = query(
        timeEntriesRef,
        where('companyId', '==', companyId),
        orderBy('timestamp', 'desc'),
        limit(limitCount)
      );
      
      const querySnapshot = await getDocs(q);
      const timeEntries: TimeEntry[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        timeEntries.push({
          id: doc.id,
          employeeId: data.employeeId || '',
          employeeName: data.employeeName || '',
          type: data.type || 'clock-in',
          timestamp: data.timestamp?.toDate() || new Date(),
          location: data.location || '',
          notes: data.notes || '',
          companyId: data.companyId || '',
          department: data.department || '',
          deviceInfo: data.deviceInfo || {}
        } as TimeEntry);
      });
      
      return timeEntries;
    } catch (error) {
      console.error('Error getting time entries:', error);
      return [];
    }
  }

  static async createTimeEntry(timeEntryData: Omit<TimeEntry, 'id'>): Promise<TimeEntry> {
    if (!db) {
      throw new Error('Firebase not initialized');
    }

    try {
      const timeEntryDoc = await addDoc(collection(db, 'timeEntries'), {
        ...timeEntryData,
        timestamp: Timestamp.fromDate(timeEntryData.timestamp)
      });
      
      return {
        id: timeEntryDoc.id,
        ...timeEntryData
      };
    } catch (error) {
      console.error('Error creating time entry:', error);
      throw error;
    }
  }

  // Document methods
  static async getDocumentsByCompany(companyId: string): Promise<Document[]> {
    if (!db) {
      console.warn('Firebase not initialized');
      return [];
    }

    try {
      const documentsRef = collection(db, 'documents');
      const q = query(
        documentsRef,
        where('companyId', '==', companyId),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const documents: Document[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        documents.push({
          id: doc.id,
          title: data.title || '',
          description: data.description || '',
          category: data.category || '',
          fileName: data.fileName || '',
          fileURL: data.fileURL || '',
          fileSize: data.fileSize || 0,
          fileType: data.fileType || '',
          uploadedBy: data.uploadedBy || '',
          uploadedById: data.uploadedById || '',
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
          companyId: data.companyId || '',
          department: data.department || '',
          tags: data.tags || [],
          isPublic: data.isPublic || false,
          version: data.version || 1,
          downloads: data.downloads || 0
        } as Document);
      });
      
      return documents;
    } catch (error) {
      console.error('Error getting documents:', error);
      return [];
    }
  }

  static async uploadDocument(file: File, documentData: Omit<Document, 'id' | 'fileURL' | 'createdAt' | 'updatedAt'>): Promise<Document> {
    if (!storage || !db) {
      throw new Error('Firebase not initialized');
    }

    try {
      // Upload file to Firebase Storage
      const fileName = `${Date.now()}_${file.name}`;
      const storageRef = ref(storage, `documents/${documentData.companyId}/${fileName}`);
      const uploadResult = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(uploadResult.ref);

      // Create document record in Firestore
      const documentDoc = await addDoc(collection(db, 'documents'), {
        ...documentData,
        fileName: file.name,
        fileURL: downloadURL,
        fileSize: file.size,
        fileType: file.type,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });

      return {
        id: documentDoc.id,
        ...documentData,
        fileName: file.name,
        fileURL: downloadURL,
        fileSize: file.size,
        fileType: file.type,
        createdAt: new Date(),
        updatedAt: new Date()
      };
    } catch (error) {
      console.error('Error uploading document:', error);
      throw error;
    }
  }

  // Deviation methods
  static async getDeviationsByCompany(companyId: string): Promise<Deviation[]> {
    if (!db) {
      console.warn('Firebase not initialized');
      return [];
    }

    try {
      const deviationsRef = collection(db, 'deviations');
      const q = query(
        deviationsRef,
        where('companyId', '==', companyId),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const deviations: Deviation[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        deviations.push({
          id: doc.id,
          title: data.title || '',
          description: data.description || '',
          severity: data.severity || 'medium',
          status: data.status || 'open',
          category: data.category || '',
          reportedBy: data.reportedBy || '',
          reportedById: data.reportedById || '',
          assignedTo: data.assignedTo || '',
          assignedToId: data.assignedToId || '',
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
          resolvedAt: data.resolvedAt?.toDate(),
          companyId: data.companyId || '',
          department: data.department || '',
          location: data.location || '',
          attachments: data.attachments || [],
          priority: data.priority || 'medium',
          estimatedHours: data.estimatedHours || 0,
          actualHours: data.actualHours || 0
        } as Deviation);
      });
      
      return deviations;
    } catch (error) {
      console.error('Error getting deviations:', error);
      return [];
    }
  }

  static async createDeviation(deviationData: Omit<Deviation, 'id' | 'createdAt' | 'updatedAt'>): Promise<Deviation> {
    if (!db) {
      throw new Error('Firebase not initialized');
    }

    try {
      const deviationDoc = await addDoc(collection(db, 'deviations'), {
        ...deviationData,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });
      
      return {
        id: deviationDoc.id,
        ...deviationData,
        createdAt: new Date(),
        updatedAt: new Date()
      };
    } catch (error) {
      console.error('Error creating deviation:', error);
      throw error;
    }
  }

  // Chat methods
  static async getChatMessages(companyId: string, limitCount: number = 50): Promise<ChatMessage[]> {
    if (!db) {
      console.warn('Firebase not initialized');
      return [];
    }

    try {
      const messagesRef = collection(db, 'chatMessages');
      const q = query(
        messagesRef,
        where('companyId', '==', companyId),
        orderBy('timestamp', 'desc'),
        limit(limitCount)
      );
      
      const querySnapshot = await getDocs(q);
      const messages: ChatMessage[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        messages.push({
          id: doc.id,
          content: data.content || '',
          senderId: data.senderId || '',
          senderName: data.senderName || '',
          timestamp: data.timestamp?.toDate() || new Date(),
          companyId: data.companyId || '',
          department: data.department || '',
          isSystemMessage: data.isSystemMessage || false,
          attachments: data.attachments || [],
          replyTo: data.replyTo || ''
        } as ChatMessage);
      });
      
      return messages.reverse(); // Return in chronological order
    } catch (error) {
      console.error('Error getting chat messages:', error);
      return [];
    }
  }

  static async sendChatMessage(messageData: Omit<ChatMessage, 'id'>): Promise<ChatMessage> {
    if (!db) {
      throw new Error('Firebase not initialized');
    }

    try {
      const messageDoc = await addDoc(collection(db, 'chatMessages'), {
        ...messageData,
        timestamp: Timestamp.now()
      });
      
      return {
        id: messageDoc.id,
        ...messageData
      };
    } catch (error) {
      console.error('Error sending chat message:', error);
      throw error;
    }
  }

  // Authentication methods
  static async login(email: string, password: string): Promise<FirebaseUser | null> {
    if (!auth) {
      throw new Error('Firebase not initialized');
    }

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      return userCredential.user;
    } catch (error) {
      console.error('Error logging in:', error);
      throw error;
    }
  }

  static async logout(): Promise<void> {
    if (!auth) {
      throw new Error('Firebase not initialized');
    }

    try {
      await signOut(auth);
    } catch (error) {
      console.error('Error logging out:', error);
      throw error;
    }
  }

  static async resetPassword(email: string): Promise<void> {
    if (!auth) {
      throw new Error('Firebase not initialized');
    }

    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error) {
      console.error('Error resetting password:', error);
      throw error;
    }
  }

  // Dashboard statistics
  static async getDashboardStats(companyId: string) {
    try {
      const [users, departments, absences, deviations, timeEntries] = await Promise.all([
        this.getUsersByCompany(companyId),
        this.getDepartmentsByCompany(companyId),
        this.getAbsencesByCompany(companyId),
        this.getDeviationsByCompany(companyId),
        this.getTimeEntriesByCompany(companyId, 1000)
      ]);

      const company = await this.getCompanyById(companyId);
      
      // Calculate active employees (clocked in today)
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const activeEmployees = timeEntries
        .filter(entry => entry.type === 'clock-in' && entry.timestamp >= today)
        .map(entry => entry.employeeId)
        .filter((id, index, arr) => arr.indexOf(id) === index).length;

      // Calculate pending absences
      const pendingAbsences = absences.filter(absence => absence.status === 'pending').length;

      // Calculate open deviations
      const openDeviations = deviations.filter(deviation => 
        deviation.status === 'open' || deviation.status === 'in-progress'
      ).length;

      // Calculate recent activity (last 7 days)
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      const recentActivity = users.filter(user => {
        const lastLogin = user.lastLoginAt;
        if (!lastLogin) return false;
        return lastLogin > oneWeekAgo;
      }).length;

      return {
        totalEmployees: users.length,
        activeEmployees,
        departments: departments.length,
        pendingAbsences,
        openDeviations,
        recentActivity,
        companyName: company?.name || 'Unknown Company',
        totalAbsences: absences.length,
        totalDeviations: deviations.length,
        totalTimeEntries: timeEntries.length
      };
    } catch (error) {
      console.error('Error getting dashboard stats:', error);
      return {
        totalEmployees: 0,
        activeEmployees: 0,
        departments: 0,
        pendingAbsences: 0,
        openDeviations: 0,
        recentActivity: 0,
        companyName: 'Unknown Company',
        totalAbsences: 0,
        totalDeviations: 0,
        totalTimeEntries: 0
      };
    }
  }

  // Real-time listeners
  static subscribeToChatMessages(companyId: string, callback: (messages: ChatMessage[]) => void): Unsubscribe {
    if (!db) {
      console.warn('Firebase not initialized');
      return () => {};
    }

    const messagesRef = collection(db, 'chatMessages');
    const q = query(
      messagesRef,
      where('companyId', '==', companyId),
      orderBy('timestamp', 'desc'),
      limit(50)
    );

    return onSnapshot(q, (snapshot) => {
      const messages: ChatMessage[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        messages.push({
          id: doc.id,
          content: data.content || '',
          senderId: data.senderId || '',
          senderName: data.senderName || '',
          timestamp: data.timestamp?.toDate() || new Date(),
          companyId: data.companyId || '',
          department: data.department || '',
          isSystemMessage: data.isSystemMessage || false,
          attachments: data.attachments || [],
          replyTo: data.replyTo || ''
        } as ChatMessage);
      });
      callback(messages.reverse());
    });
  }

  static subscribeToNotifications(userId: string, callback: (notifications: Notification[]) => void): Unsubscribe {
    if (!db) {
      console.warn('Firebase not initialized');
      return () => {};
    }

    const notificationsRef = collection(db, 'notifications');
    const q = query(
      notificationsRef,
      where('recipientId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(20)
    );

    return onSnapshot(q, (snapshot) => {
      const notifications: Notification[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        notifications.push({
          id: doc.id,
          title: data.title || '',
          message: data.message || '',
          type: data.type || 'info',
          recipientId: data.recipientId || '',
          senderId: data.senderId || '',
          createdAt: data.createdAt?.toDate() || new Date(),
          readAt: data.readAt?.toDate(),
          companyId: data.companyId || '',
          actionURL: data.actionURL || '',
          priority: data.priority || 'low'
        } as Notification);
      });
      callback(notifications);
    });
  }

  // Test data methods
  static async addTestCompanies() {
    if (!db) {
      console.warn('Firebase not initialized');
      return;
    }

    try {
      const companiesRef = collection(db, 'companies');
      
      const testCompanies = [
        {
          name: 'DriftPro AS',
          industry: 'Teknologi',
          employees: 50,
          address: 'Storgata 1, 0001 Oslo',
          phone: '+47 123 45 678',
          email: 'kontakt@driftpro.no',
          website: 'https://driftpro.no',
          isActive: true,
          createdAt: Timestamp.now(),
          settings: {
            enableDeviationReporting: true,
            enableRiskAnalysis: true,
            enableDocumentArchive: true,
            enableInternalControl: true,
            enableChat: true,
            enableBirthdayCalendar: true,
            maxFileSizeMB: 10,
            allowedFileTypes: ['pdf', 'doc', 'docx', 'jpg', 'png']
          }
        },
        {
          name: 'Teknisk Service Norge',
          industry: 'Service',
          employees: 25,
          address: 'Industriveien 15, 5000 Bergen',
          phone: '+47 987 65 432',
          email: 'info@tsn.no',
          website: 'https://tsn.no',
          isActive: true,
          createdAt: Timestamp.now(),
          settings: {
            enableDeviationReporting: true,
            enableRiskAnalysis: false,
            enableDocumentArchive: true,
            enableInternalControl: false,
            enableChat: true,
            enableBirthdayCalendar: false,
            maxFileSizeMB: 5,
            allowedFileTypes: ['pdf', 'doc', 'docx']
          }
        },
        {
          name: 'Industri Drift AS',
          industry: 'Industri',
          employees: 100,
          address: 'Fabrikkveien 42, 3000 Drammen',
          phone: '+47 555 12 345',
          email: 'post@industridrift.no',
          website: 'https://industridrift.no',
          isActive: true,
          createdAt: Timestamp.now(),
          settings: {
            enableDeviationReporting: true,
            enableRiskAnalysis: true,
            enableDocumentArchive: true,
            enableInternalControl: true,
            enableChat: true,
            enableBirthdayCalendar: true,
            maxFileSizeMB: 20,
            allowedFileTypes: ['pdf', 'doc', 'docx', 'jpg', 'png', 'xls', 'xlsx']
          }
        }
      ];

      for (const company of testCompanies) {
        await addDoc(companiesRef, company);
        console.log(`Added test company: ${company.name}`);
      }

      console.log('Test companies added successfully');
      
      // Legg til test-brukere for DriftPro AS
      await this.addTestUsers();
    } catch (error) {
      console.error('Error adding test companies:', error);
    }
  }

  static async addTestUsers() {
    if (!db) {
      console.warn('Firebase not initialized');
      return;
    }

    try {
      const usersRef = collection(db, 'users');
      
      // Først finn DriftPro AS company ID
      const companiesRef = collection(db, 'companies');
      const companiesSnapshot = await getDocs(companiesRef);
      let driftproCompanyId = '';
      
      companiesSnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.name === 'DriftPro AS') {
          driftproCompanyId = doc.id;
        }
      });

      if (!driftproCompanyId) {
        console.log('DriftPro AS company not found, skipping test users');
        return;
      }

      const testUsers = [
        {
          email: 'admin@driftpro.no',
          firstName: 'Admin',
          lastName: 'DriftPro',
          role: 'admin' as const,
          companyId: driftproCompanyId,
          department: 'Administrasjon',
          phoneNumber: '+47 123 45 678',
          isActive: true,
          createdAt: Timestamp.now(),
          lastLoginAt: Timestamp.now(),
          employeeId: 'EMP001'
        },
        {
          email: 'manager@driftpro.no',
          firstName: 'Manager',
          lastName: 'DriftPro',
          role: 'manager' as const,
          companyId: driftproCompanyId,
          department: 'Ledelse',
          phoneNumber: '+47 123 45 679',
          isActive: true,
          createdAt: Timestamp.now(),
          lastLoginAt: Timestamp.now(),
          employeeId: 'EMP002'
        },
        {
          email: 'employee@driftpro.no',
          firstName: 'Employee',
          lastName: 'DriftPro',
          role: 'employee' as const,
          companyId: driftproCompanyId,
          department: 'Teknisk',
          phoneNumber: '+47 123 45 680',
          isActive: true,
          createdAt: Timestamp.now(),
          lastLoginAt: Timestamp.now(),
          employeeId: 'EMP003'
        }
      ];

      for (const user of testUsers) {
        await addDoc(usersRef, user);
        console.log(`Added test user: ${user.email}`);
      }

      console.log('Test users added successfully');
      
      // Legg til test-avdelinger
      await this.addTestDepartments(driftproCompanyId);
    } catch (error) {
      console.error('Error adding test users:', error);
    }
  }

  static async addTestDepartments(companyId: string) {
    if (!db) {
      console.warn('Firebase not initialized');
      return;
    }

    try {
      const departmentsRef = collection(db, 'departments');
      
      const testDepartments = [
        {
          name: 'IT',
          description: 'Informasjonsteknologi og systemadministrasjon',
          manager: 'Admin DriftPro',
          managerId: 'admin-user-id', // Dette må oppdateres med faktisk user ID
          employeeCount: 8,
          isActive: true,
          createdAt: Timestamp.now(),
          companyId,
          color: '#3c8dbc',
          budget: 500000
        },
        {
          name: 'Vedlikehold',
          description: 'Teknisk vedlikehold og reparasjoner',
          manager: 'Manager DriftPro',
          managerId: 'manager-user-id', // Dette må oppdateres med faktisk user ID
          employeeCount: 12,
          isActive: true,
          createdAt: Timestamp.now(),
          companyId,
          color: '#28a745',
          budget: 750000
        },
        {
          name: 'Produksjon',
          description: 'Produksjon og kvalitetskontroll',
          manager: 'Employee DriftPro',
          managerId: 'employee-user-id', // Dette må oppdateres med faktisk user ID
          employeeCount: 25,
          isActive: true,
          createdAt: Timestamp.now(),
          companyId,
          color: '#ffc107',
          budget: 1200000
        }
      ];

      for (const department of testDepartments) {
        await addDoc(departmentsRef, department);
        console.log(`Added test department: ${department.name}`);
      }

      console.log('Test departments added successfully');
    } catch (error) {
      console.error('Error adding test departments:', error);
    }
  }
} 