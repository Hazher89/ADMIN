import { db } from './firebase';
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  doc, 
  where, 
  getDocs, 
  serverTimestamp,
  writeBatch,
  getDoc,
  setDoc
} from 'firebase/firestore';

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  priority: 'low' | 'medium' | 'high';
  status: 'unread' | 'read' | 'archived';
  metadata: Record<string, string | number | boolean>;
  readAt?: string;
  archivedAt?: string;
  createdAt: string;
}

export interface NotificationSettings {
  userId: string;
  email: boolean;
  push: boolean;
  inApp: boolean;
  types: Record<NotificationType, boolean>;
  updatedAt: string;
}

class NotificationService {
  // Create notification
  async createNotification(notificationData: {
    userId: string;
    title: string;
    message: string;
    type: string;
    priority: 'urgent' | 'high' | 'medium' | 'low';
    actionUrl?: string;
    actionText?: string;
    metadata?: Record<string, unknown>;
  }): Promise<void> {
    if (!db) return;
    
    try {
      await addDoc(collection(db, 'notifications'), {
        ...notificationData,
        status: 'unread',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error creating notification:', error);
    }
  }

  // Load notifications for user
  async loadNotifications(userId: string, callback: (notifications: Notification[]) => void): Promise<() => void> {
    if (!db) return () => {};
    
    const unsubscribe = onSnapshot(
      query(
        collection(db, 'notifications'),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      ),
      (snapshot) => {
        const notificationsData: Notification[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          notificationsData.push({
            id: doc.id,
            userId: data.userId || '',
            title: data.title || '',
            message: data.message || '',
            type: data.type || 'system',
            priority: data.priority || 'medium',
            status: data.status || 'unread',
            actionUrl: data.actionUrl || '',
            actionText: data.actionText || '',
            metadata: data.metadata || {},
            createdAt: data.createdAt?.toDate() || new Date(),
            updatedAt: data.updatedAt?.toDate() || new Date()
          });
        });
        callback(notificationsData);
      }
    );
    
    return unsubscribe;
  }

  // Mark notification as read
  async markAsRead(notificationId: string): Promise<void> {
    if (!db) return;

    try {
      await updateDoc(doc(db, 'notifications', notificationId), {
        status: 'read',
        readAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }

  // Mark all notifications as read
  async markAllAsRead(userId: string): Promise<void> {
    if (!db) return;

    try {
      const notificationsQuery = query(
        collection(db, 'notifications'),
        where('recipientId', '==', userId),
        where('status', '==', 'unread')
      );

      const snapshot = await getDocs(notificationsQuery);
      const batch = writeBatch(db);

      snapshot.forEach((doc) => {
        batch.update(doc.ref, {
          status: 'read',
          readAt: serverTimestamp()
        });
      });

      await batch.commit();
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  }

  // Archive notification
  async archiveNotification(notificationId: string): Promise<void> {
    if (!db) return;

    try {
      await updateDoc(doc(db, 'notifications', notificationId), {
        status: 'archived'
      });
    } catch (error) {
      console.error('Error archiving notification:', error);
    }
  }

  // Delete notification
  async deleteNotification(notificationId: string): Promise<void> {
    if (!db) return;

    try {
      await updateDoc(doc(db, 'notifications', notificationId), {
        status: 'deleted'
      });
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  }

  // Get unread count
  async getUnreadCount(userId: string): Promise<number> {
    if (!db) return 0;

    try {
      const notificationsQuery = query(
        collection(db, 'notifications'),
        where('recipientId', '==', userId),
        where('status', '==', 'unread')
      );

      const snapshot = await getDocs(notificationsQuery);
      return snapshot.size;
    } catch (error) {
      console.error('Error getting unread count:', error);
      return 0;
    }
  }

  // Create deviation notification
  async createDeviationNotification(
    deviationId: string,
    deviationTitle: string,
    reporterName: string,
    department: string,
    companyId: string,
    recipientIds: string[]
  ): Promise<void> {
    const notificationData = {
      type: 'deviation' as const,
      title: 'Nytt avvik rapportert',
      message: `${reporterName} har rapportert et nytt avvik: "${deviationTitle}"`,
      priority: 'high' as const,
      recipientId: '', // Will be set for each recipient
      recipientRole: 'admin' as const,
      senderName: reporterName,
      relatedId: deviationId,
      relatedType: 'deviation',
      actionUrl: `/dashboard/deviations?id=${deviationId}`,
      actionText: 'Se avvik',
      metadata: {
        department,
        companyId,
        deviationTitle
      }
    };

    // Create notification for each recipient
    for (const recipientId of recipientIds) {
      await this.createNotification({
        ...notificationData,
        recipientId
      });
    }
  }

  // Create vacation request notification
  async createVacationNotification(
    vacationId: string,
    employeeName: string,
    startDate: string,
    endDate: string,
    department: string,
    companyId: string,
    recipientIds: string[]
  ): Promise<void> {
    const notificationData = {
      type: 'vacation' as const,
      title: 'Ny ferieforespørsel',
      message: `${employeeName} har søkt om ferie fra ${startDate} til ${endDate}`,
      priority: 'medium' as const,
      recipientId: '',
      recipientRole: 'department_leader' as const,
      senderName: employeeName,
      relatedId: vacationId,
      relatedType: 'vacation',
      actionUrl: `/dashboard/vacation?id=${vacationId}`,
      actionText: 'Godkjenn/Avvis',
      metadata: {
        department,
        companyId,
        startDate,
        endDate
      }
    };

    for (const recipientId of recipientIds) {
      await this.createNotification({
        ...notificationData,
        recipientId
      });
    }
  }

  // Create absence notification
  async createAbsenceNotification(
    absenceId: string,
    employeeName: string,
    absenceType: string,
    date: string,
    department: string,
    companyId: string,
    recipientIds: string[]
  ): Promise<void> {
    const notificationData = {
      type: 'absence' as const,
      title: 'Ny fraværsmelding',
      message: `${employeeName} har meldt fravær: ${absenceType} den ${date}`,
      priority: 'medium' as const,
      recipientId: '',
      recipientRole: 'department_leader' as const,
      senderName: employeeName,
      relatedId: absenceId,
      relatedType: 'absence',
      actionUrl: `/dashboard/absence?id=${absenceId}`,
      actionText: 'Se fravær',
      metadata: {
        department,
        companyId,
        absenceType,
        date
      }
    };

    for (const recipientId of recipientIds) {
      await this.createNotification({
        ...notificationData,
        recipientId
      });
    }
  }

  // Create shift assignment notification
  async createShiftNotification(
    shiftId: string,
    employeeName: string,
    shiftDate: string,
    shiftTime: string,
    assignedBy: string,
    department: string,
    companyId: string,
    recipientId: string
  ): Promise<void> {
    await this.createNotification({
      type: 'shift',
      title: 'Ny vakt tildelt',
      message: `${assignedBy} har tildelt deg en vakt: ${shiftDate} ${shiftTime}`,
      priority: 'medium',
      recipientId,
      recipientRole: 'employee',
      senderName: assignedBy,
      relatedId: shiftId,
      relatedType: 'shift',
      actionUrl: `/dashboard/shifts?id=${shiftId}`,
      actionText: 'Godkjenn/Avvis',
      metadata: {
        department,
        companyId,
        shiftDate,
        shiftTime
      }
    });
  }

  // Create document shared notification
  async createDocumentNotification(
    documentId: string,
    documentName: string,
    sharedBy: string,
    department: string,
    companyId: string,
    recipientIds: string[]
  ): Promise<void> {
    const notificationData = {
      type: 'document' as const,
      title: 'Nytt dokument delt',
      message: `${sharedBy} har delt dokumentet "${documentName}"`,
      priority: 'low' as const,
      recipientId: '',
      recipientRole: 'employee' as const,
      senderName: sharedBy,
      relatedId: documentId,
      relatedType: 'document',
      actionUrl: `/dashboard/documents?id=${documentId}`,
      actionText: 'Se dokument',
      metadata: {
        department,
        companyId,
        documentName
      }
    };

    for (const recipientId of recipientIds) {
      await this.createNotification({
        ...notificationData,
        recipientId
      });
    }
  }

  // Create chat notification
  async createChatNotification(
    chatId: string,
    chatName: string,
    senderName: string,
    message: string,
    recipientId: string
  ): Promise<void> {
    await this.createNotification({
      type: 'chat',
      title: `Ny melding i ${chatName}`,
      message: `${senderName}: ${message}`,
      priority: 'low',
      recipientId,
      recipientRole: 'employee',
      senderName,
      relatedId: chatId,
      relatedType: 'chat',
      actionUrl: `/dashboard/chat?id=${chatId}`,
      actionText: 'Svar',
      metadata: {
        chatName,
        message
      }
    });
  }

  // Create employee notification
  async createEmployeeNotification(
    employeeId: string,
    employeeName: string,
    action: 'added' | 'updated' | 'deleted',
    performedBy: string,
    companyId: string,
    recipientIds: string[]
  ): Promise<void> {
    const actionText = {
      added: 'lagt til',
      updated: 'oppdatert',
      deleted: 'slettet'
    };

    const notificationData = {
      type: 'employee' as const,
      title: 'Ansatt oppdatert',
      message: `${performedBy} har ${actionText[action]} ansatt: ${employeeName}`,
      priority: 'medium' as const,
      recipientId: '',
      recipientRole: 'admin' as const,
      senderName: performedBy,
      relatedId: employeeId,
      relatedType: 'employee',
      actionUrl: `/dashboard/employees?id=${employeeId}`,
      actionText: 'Se ansatt',
      metadata: {
        companyId,
        action,
        employeeName
      }
    };

    for (const recipientId of recipientIds) {
      await this.createNotification({
        ...notificationData,
        recipientId
      });
    }
  }

  // Create system notification
  async createSystemNotification(
    title: string,
    message: string,
    priority: 'low' | 'medium' | 'high' | 'urgent',
    recipientIds: string[],
    actionUrl?: string,
    actionText?: string
  ): Promise<void> {
    const notificationData = {
      type: 'system' as const,
      title,
      message,
      priority,
      recipientId: '',
      recipientRole: 'admin' as const,
      relatedType: 'system',
      actionUrl,
      actionText
    };

    for (const recipientId of recipientIds) {
      await this.createNotification({
        ...notificationData,
        recipientId
      });
    }
  }

  // Get notification settings
  async getNotificationSettings(userId: string): Promise<NotificationSettings> {
    if (!db) return this.getDefaultSettings();
    
    try {
      const doc = await getDoc(doc(db, 'notificationSettings', userId));
      if (doc.exists()) {
        return { ...this.getDefaultSettings(), ...doc.data() };
      }
      return this.getDefaultSettings();
    } catch (error) {
      console.error('Error getting notification settings:', error);
      return this.getDefaultSettings();
    }
  }

  // Update notification settings
  async updateNotificationSettings(userId: string, settings: Partial<NotificationSettings>): Promise<void> {
    if (!db) return;
    
    try {
      await setDoc(doc(db, 'notificationSettings', userId), {
        ...settings,
        updatedAt: serverTimestamp()
      }, { merge: true });
    } catch (error) {
      console.error('Error updating notification settings:', error);
    }
  }

  private getDefaultSettings(): NotificationSettings {
    return {
      userId: '',
      email: true,
      push: true,
      inApp: true,
      types: {
        deviation: true,
        vacation: true,
        absence: true,
        shift: true,
        document: true,
        chat: true,
        employee: true,
        system: true
      },
      quietHours: {
        enabled: false,
        start: '22:00',
        end: '08:00'
      }
    };
  }
}

export const notificationService = new NotificationService();