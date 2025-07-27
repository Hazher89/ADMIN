import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
  Timestamp,
  writeBatch,
  arrayUnion,
  arrayRemove,
  increment
} from 'firebase/firestore';
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject
} from 'firebase/storage';
import { db, storage } from './firebase';
import {
  User,
  UserRole,
  Department,
  Absence,
  Vacation,
  VacationBalance,
  Deviation,
  Chat,
  Message,
  Document,
  Shift,
  ShiftPlan,
  TimeEntry,
  Notification,
  RequestStatus,
  DeviationStatus,
  ShiftStatus,
  NotificationType,
  AuditLog
} from '@/types';

// User Services
export const userService = {
  async createUser(userData: Partial<User>): Promise<string> {
    const docRef = await addDoc(collection(db, 'users'), {
      ...userData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      isActive: true
    });
    return docRef.id;
  },

  async getUser(userId: string): Promise<User | null> {
    const docRef = doc(db, 'users', userId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as User;
    }
    return null;
  },

  async updateUser(userId: string, updates: Partial<User>): Promise<void> {
    const docRef = doc(db, 'users', userId);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: serverTimestamp()
    });
  },

  async getUsersByDepartment(departmentId: string): Promise<User[]> {
    const q = query(
      collection(db, 'users'),
      where('departmentId', '==', departmentId),
      where('isActive', '==', true)
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as User);
  },

  async getUsersByRole(role: UserRole): Promise<User[]> {
    const q = query(
      collection(db, 'users'),
      where('role', '==', role),
      where('isActive', '==', true)
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as User);
  }
};

// Department Services
export const departmentService = {
  async createDepartment(departmentData: Partial<Department>): Promise<string> {
    const docRef = await addDoc(collection(db, 'departments'), {
      ...departmentData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      isActive: true
    });
    return docRef.id;
  },

  async getDepartment(departmentId: string): Promise<Department | null> {
    const docRef = doc(db, 'departments', departmentId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as Department;
    }
    return null;
  },

  async getAllDepartments(): Promise<Department[]> {
    const q = query(
      collection(db, 'departments'),
      where('isActive', '==', true),
      orderBy('name')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Department);
  },

  async updateDepartment(departmentId: string, updates: Partial<Department>): Promise<void> {
    const docRef = doc(db, 'departments', departmentId);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: serverTimestamp()
    });
  },

  async addEmployeeToDepartment(departmentId: string, employeeId: string): Promise<void> {
    const docRef = doc(db, 'departments', departmentId);
    await updateDoc(docRef, {
      employeeIds: arrayUnion(employeeId),
      updatedAt: serverTimestamp()
    });
  },

  async removeEmployeeFromDepartment(departmentId: string, employeeId: string): Promise<void> {
    const docRef = doc(db, 'departments', departmentId);
    await updateDoc(docRef, {
      employeeIds: arrayRemove(employeeId),
      updatedAt: serverTimestamp()
    });
  }
};

// Absence Services
export const absenceService = {
  async createAbsence(absenceData: Partial<Absence>): Promise<string> {
    const docRef = await addDoc(collection(db, 'absences'), {
      ...absenceData,
      status: RequestStatus.PENDING,
      comments: [],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return docRef.id;
  },

  async getAbsence(absenceId: string): Promise<Absence | null> {
    const docRef = doc(db, 'absences', absenceId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as Absence;
    }
    return null;
  },

  async getAbsencesByEmployee(employeeId: string): Promise<Absence[]> {
    const q = query(
      collection(db, 'absences'),
      where('employeeId', '==', employeeId),
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Absence);
  },

  async getAbsencesByDepartment(departmentId: string): Promise<Absence[]> {
    const q = query(
      collection(db, 'absences'),
      where('departmentId', '==', departmentId),
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Absence);
  },

  async approveAbsence(absenceId: string, approvedBy: string): Promise<void> {
    const docRef = doc(db, 'absences', absenceId);
    await updateDoc(docRef, {
      status: RequestStatus.APPROVED,
      approvedBy,
      approvedAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
  },

  async rejectAbsence(absenceId: string, rejectedBy: string, rejectionReason: string): Promise<void> {
    const docRef = doc(db, 'absences', absenceId);
    await updateDoc(docRef, {
      status: RequestStatus.REJECTED,
      rejectedBy,
      rejectedAt: serverTimestamp(),
      rejectionReason,
      updatedAt: serverTimestamp()
    });
  },

  async addComment(absenceId: string, comment: any): Promise<void> {
    const docRef = doc(db, 'absences', absenceId);
    await updateDoc(docRef, {
      comments: arrayUnion(comment),
      updatedAt: serverTimestamp()
    });
  }
};

// Vacation Services
export const vacationService = {
  async createVacation(vacationData: Partial<Vacation>): Promise<string> {
    const docRef = await addDoc(collection(db, 'vacations'), {
      ...vacationData,
      status: RequestStatus.PENDING,
      comments: [],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return docRef.id;
  },

  async getVacation(vacationId: string): Promise<Vacation | null> {
    const docRef = doc(db, 'vacations', vacationId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as Vacation;
    }
    return null;
  },

  async getVacationsByEmployee(employeeId: string): Promise<Vacation[]> {
    const q = query(
      collection(db, 'vacations'),
      where('employeeId', '==', employeeId),
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Vacation);
  },

  async getVacationsByDepartment(departmentId: string): Promise<Vacation[]> {
    const q = query(
      collection(db, 'vacations'),
      where('departmentId', '==', departmentId),
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Vacation);
  },

  async approveVacation(vacationId: string, approvedBy: string): Promise<void> {
    const docRef = doc(db, 'vacations', vacationId);
    await updateDoc(docRef, {
      status: RequestStatus.APPROVED,
      approvedBy,
      approvedAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
  },

  async rejectVacation(vacationId: string, rejectedBy: string, rejectionReason: string): Promise<void> {
    const docRef = doc(db, 'vacations', vacationId);
    await updateDoc(docRef, {
      status: RequestStatus.REJECTED,
      rejectedBy,
      rejectedAt: serverTimestamp(),
      rejectionReason,
      updatedAt: serverTimestamp()
    });
  },

  async getVacationBalance(employeeId: string, year: number): Promise<VacationBalance | null> {
    const q = query(
      collection(db, 'vacationBalances'),
      where('employeeId', '==', employeeId),
      where('year', '==', year)
    );
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      const doc = querySnapshot.docs[0];
      return { id: doc.id, ...doc.data() } as VacationBalance;
    }
    return null;
  },

  async updateVacationBalance(balanceId: string, updates: Partial<VacationBalance>): Promise<void> {
    const docRef = doc(db, 'vacationBalances', balanceId);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: serverTimestamp()
    });
  }
};

// Deviation Services
export const deviationService = {
  async createDeviation(deviationData: Partial<Deviation>): Promise<string> {
    const uniqueId = `DEV-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const docRef = await addDoc(collection(db, 'deviations'), {
      ...deviationData,
      uniqueId,
      status: DeviationStatus.PENDING,
      comments: [],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return docRef.id;
  },

  async getDeviation(deviationId: string): Promise<Deviation | null> {
    const docRef = doc(db, 'deviations', deviationId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as Deviation;
    }
    return null;
  },

  async getDeviationsByEmployee(employeeId: string): Promise<Deviation[]> {
    const q = query(
      collection(db, 'deviations'),
      where('employeeId', '==', employeeId),
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Deviation);
  },

  async getDeviationsByDepartment(departmentId: string): Promise<Deviation[]> {
    const q = query(
      collection(db, 'deviations'),
      where('departmentId', '==', departmentId),
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Deviation);
  },

  async updateDeviationStatus(deviationId: string, status: DeviationStatus, updatedBy: string, resolution?: string): Promise<void> {
    const docRef = doc(db, 'deviations', deviationId);
    const updates: any = {
      status,
      updatedAt: serverTimestamp()
    };

    if (status === DeviationStatus.IN_PROGRESS) {
      updates.assignedTo = updatedBy;
      updates.assignedAt = serverTimestamp();
    } else if (status === DeviationStatus.RESOLVED) {
      updates.resolvedBy = updatedBy;
      updates.resolvedAt = serverTimestamp();
      updates.resolution = resolution;
    }

    await updateDoc(docRef, updates);
  },

  async addComment(deviationId: string, comment: any): Promise<void> {
    const docRef = doc(db, 'deviations', deviationId);
    await updateDoc(docRef, {
      comments: arrayUnion(comment),
      updatedAt: serverTimestamp()
    });
  }
};

// Chat Services
export const chatService = {
  async createChat(chatData: Partial<Chat>): Promise<string> {
    const docRef = await addDoc(collection(db, 'chats'), {
      ...chatData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      isActive: true
    });
    return docRef.id;
  },

  async getChat(chatId: string): Promise<Chat | null> {
    const docRef = doc(db, 'chats', chatId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as Chat;
    }
    return null;
  },

  async getChatsByUser(userId: string): Promise<Chat[]> {
    const q = query(
      collection(db, 'chats'),
      where('participants', 'array-contains', userId),
      where('isActive', '==', true),
      orderBy('updatedAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Chat);
  },

  async sendMessage(chatId: string, messageData: Partial<Message>): Promise<string> {
    const messageRef = await addDoc(collection(db, 'messages'), {
      ...messageData,
      chatId,
      readBy: [messageData.senderId],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    // Update chat's last message
    const chatRef = doc(db, 'chats', chatId);
    await updateDoc(chatRef, {
      lastMessage: {
        id: messageRef.id,
        content: messageData.content,
        senderId: messageData.senderId,
        senderName: messageData.senderName,
        createdAt: serverTimestamp()
      },
      updatedAt: serverTimestamp()
    });

    return messageRef.id;
  },

  async getMessages(chatId: string): Promise<Message[]> {
    const q = query(
      collection(db, 'messages'),
      where('chatId', '==', chatId),
      orderBy('createdAt', 'asc')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Message);
  },

  async markMessageAsRead(messageId: string, userId: string): Promise<void> {
    const docRef = doc(db, 'messages', messageId);
    await updateDoc(docRef, {
      readBy: arrayUnion(userId),
      updatedAt: serverTimestamp()
    });
  }
};

// Document Services
export const documentService = {
  async uploadFile(file: File, path: string): Promise<string> {
    const storageRef = ref(storage, path);
    await uploadBytes(storageRef, file);
    return await getDownloadURL(storageRef);
  },

  async createDocument(documentData: Partial<Document>): Promise<string> {
    const docRef = await addDoc(collection(db, 'documents'), {
      ...documentData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return docRef.id;
  },

  async getDocument(documentId: string): Promise<Document | null> {
    const docRef = doc(db, 'documents', documentId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as Document;
    }
    return null;
  },

  async getDocumentsByUser(userId: string): Promise<Document[]> {
    const q = query(
      collection(db, 'documents'),
      where('permissions', 'array-contains', { userId, canView: true }),
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Document);
  },

  async deleteDocument(documentId: string): Promise<void> {
    const docRef = doc(db, 'documents', documentId);
    await deleteDoc(docRef);
  }
};

// Shift Services
export const shiftService = {
  async createShift(shiftData: Partial<Shift>): Promise<string> {
    const docRef = await addDoc(collection(db, 'shifts'), {
      ...shiftData,
      status: ShiftStatus.PENDING,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return docRef.id;
  },

  async getShift(shiftId: string): Promise<Shift | null> {
    const docRef = doc(db, 'shifts', shiftId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as Shift;
    }
    return null;
  },

  async getShiftsByEmployee(employeeId: string): Promise<Shift[]> {
    const q = query(
      collection(db, 'shifts'),
      where('employeeId', '==', employeeId),
      orderBy('startTime', 'desc')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Shift);
  },

  async approveShift(shiftId: string, approvedBy: string): Promise<void> {
    const docRef = doc(db, 'shifts', shiftId);
    await updateDoc(docRef, {
      status: ShiftStatus.APPROVED,
      approvedBy,
      approvedAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
  },

  async rejectShift(shiftId: string, rejectedBy: string, rejectionReason: string): Promise<void> {
    const docRef = doc(db, 'shifts', shiftId);
    await updateDoc(docRef, {
      status: ShiftStatus.REJECTED,
      rejectedBy,
      rejectedAt: serverTimestamp(),
      rejectionReason,
      updatedAt: serverTimestamp()
    });
  }
};

// Time Tracking Services
export const timeTrackingService = {
  async clockIn(employeeId: string, employeeName: string, departmentId: string, departmentName: string, location?: any): Promise<string> {
    const docRef = await addDoc(collection(db, 'timeEntries'), {
      employeeId,
      employeeName,
      departmentId,
      departmentName,
      clockIn: serverTimestamp(),
      breakTime: 0,
      location,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return docRef.id;
  },

  async clockOut(timeEntryId: string): Promise<void> {
    const docRef = doc(db, 'timeEntries', timeEntryId);
    await updateDoc(docRef, {
      clockOut: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
  },

  async getTimeEntriesByEmployee(employeeId: string): Promise<TimeEntry[]> {
    const q = query(
      collection(db, 'timeEntries'),
      where('employeeId', '==', employeeId),
      orderBy('clockIn', 'desc')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as TimeEntry);
  }
};

// Notification Services
export const notificationService = {
  async createNotification(notificationData: Partial<Notification>): Promise<string> {
    const docRef = await addDoc(collection(db, 'notifications'), {
      ...notificationData,
      read: false,
      createdAt: serverTimestamp()
    });
    return docRef.id;
  },

  async getNotificationsByUser(userId: string): Promise<Notification[]> {
    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(50)
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Notification);
  },

  async markAsRead(notificationId: string): Promise<void> {
    const docRef = doc(db, 'notifications', notificationId);
    await updateDoc(docRef, { read: true });
  },

  async markAllAsRead(userId: string): Promise<void> {
    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', userId),
      where('read', '==', false)
    );
    const querySnapshot = await getDocs(q);
    const batch = writeBatch(db);
    querySnapshot.docs.forEach(doc => {
      batch.update(doc.ref, { read: true });
    });
    await batch.commit();
  }
};

// Audit Log Services
export const auditService = {
  async logAction(auditData: Partial<AuditLog>): Promise<void> {
    await addDoc(collection(db, 'auditLogs'), {
      ...auditData,
      createdAt: serverTimestamp()
    });
  },

  async getAuditLogsByUser(userId: string): Promise<AuditLog[]> {
    const q = query(
      collection(db, 'auditLogs'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(100)
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as AuditLog);
  }
};

// Real-time listeners
export const createRealtimeListener = (collectionName: string, callback: (data: any[]) => void) => {
  return onSnapshot(collection(db, collectionName), (snapshot) => {
    const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    callback(data);
  });
}; 