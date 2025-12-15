import { db } from './firebase';
import { 
  collection, 
  query, 
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
import { globalEmailService } from './global-email-service';

export interface Employee {
  id: string;
  email?: string;
  role?: string;
  departmentId?: string;
  companyId?: string;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'deviation' | 'vacation' | 'absence' | 'shift' | 'document' | 'chat' | 'employee' | 'system';
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
  types: Record<'deviation' | 'vacation' | 'absence' | 'shift' | 'document' | 'chat' | 'employee' | 'system', boolean>;
  updatedAt: string;
}

class NotificationService {
  // Helper function to get user email
  private async getUserEmail(userId: string): Promise<string | null> {
    try {
      const userDoc = await getDoc(doc(db!, 'users', userId));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        return userData.email || null;
      }
      return null;
    } catch (error) {
      console.error('Error getting user email:', error);
      return null;
    }
  }

  // Helper function to get all admins
  private async getAllAdmins(companyId?: string): Promise<Employee[]> {
    if (!db) return [];
    try {
      const q = query(
        collection(db, 'users'),
        where('role', 'in', ['admin', 'super_admin'])
      );
      const snapshot = await getDocs(q);
      const admins = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Employee)).filter(emp => 
        !companyId || emp.companyId === companyId
      );
      return admins;
    } catch (error) {
      console.error('Error getting admins:', error);
      return [];
    }
  }

  // Helper function to get department leaders for a specific department
  private async getDepartmentLeaders(departmentId: string, companyId?: string): Promise<Employee[]> {
    if (!db) return [];
    try {
      const q = query(
        collection(db, 'users'),
        where('role', '==', 'department_leader'),
        where('departmentId', '==', departmentId)
      );
      const snapshot = await getDocs(q);
      const leaders = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Employee)).filter(emp => 
        !companyId || emp.companyId === companyId
      );
      return leaders;
    } catch (error) {
      console.error('Error getting department leaders:', error);
      return [];
    }
  }

  // Create notification with email
  async createNotification(notificationData: {
    userId: string;
    title: string;
    message: string;
    type: string;
    priority: 'urgent' | 'high' | 'medium' | 'low';
    actionUrl?: string;
    actionText?: string;
    metadata?: Record<string, unknown>;
    sendEmail?: boolean;
    departmentId?: string;
    companyId?: string;
  }): Promise<void> {
    if (!db) return;
    
    try {
      // Create in-app notification
      await addDoc(collection(db, 'notifications'), {
        userId: notificationData.userId,
        title: notificationData.title,
        message: notificationData.message,
        type: notificationData.type,
        priority: notificationData.priority,
        status: 'unread',
        actionUrl: notificationData.actionUrl,
        actionText: notificationData.actionText,
        metadata: {
          ...notificationData.metadata,
          departmentId: notificationData.departmentId,
          companyId: notificationData.companyId
        },
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      // Send email if requested
      if (notificationData.sendEmail !== false) {
        try {
          const userEmail = await this.getUserEmail(notificationData.userId);
          if (userEmail) {
            const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://admin.driftpro.no';
            const emailHtml = `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2 style="color: #2563eb;">${notificationData.title}</h2>
                <p>${notificationData.message}</p>
                ${notificationData.actionUrl ? `
                  <div style="margin: 20px 0;">
                    <a href="${baseUrl}${notificationData.actionUrl}" 
                       style="display: inline-block; padding: 12px 24px; background: #2563eb; color: white; text-decoration: none; border-radius: 8px; font-weight: 600;">
                      ${notificationData.actionText || 'Se detaljer'}
                    </a>
                  </div>
                ` : ''}
                <p style="color: #6b7280; font-size: 0.875rem; margin-top: 30px;">
                  Dette er en automatisk varsel fra DriftPro-systemet.
                </p>
              </div>
            `;
            
            await globalEmailService.sendEmail({
              to: userEmail,
              subject: notificationData.title,
              html: emailHtml
            });
          }
        } catch (emailError) {
          console.error('Error sending notification email:', emailError);
          // Don't fail notification creation if email fails
        }
      }
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
        where('userId', '==', userId)
      ),
      (snapshot) => {
        const notificationsData: Notification[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          let createdAt: string;
          
          // Handle different createdAt formats
          if (data.createdAt?.toDate) {
            createdAt = data.createdAt.toDate().toISOString();
          } else if (data.createdAt instanceof Date) {
            createdAt = data.createdAt.toISOString();
          } else if (typeof data.createdAt === 'string') {
            createdAt = data.createdAt;
          } else {
            createdAt = new Date().toISOString();
          }
          
          notificationsData.push({
            id: doc.id,
            userId: data.userId || '',
            title: data.title || '',
            message: data.message || '',
            type: data.type || 'system',
            priority: data.priority || 'medium',
            status: data.status || 'unread',
            metadata: data.metadata || {},
            createdAt: createdAt,
            readAt: data.readAt,
            archivedAt: data.archivedAt
          });
        });
        // Sort by createdAt in descending order in memory
        notificationsData.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
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
        where('userId', '==', userId),
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
        where('userId', '==', userId),
        where('status', '==', 'unread')
      );

      const snapshot = await getDocs(notificationsQuery);
      return snapshot.size;
    } catch (error) {
      console.error('Error getting unread count:', error);
      return 0;
    }
  }

  // Create deviation notification - sends to admin and department leaders
  async createDeviationNotification(
    deviationId: string,
    deviationTitle: string,
    reporterName: string,
    reporterId: string,
    departmentId: string,
    companyId: string
  ): Promise<void> {
    try {
      // Get all admins
      const admins = await this.getAllAdmins(companyId);
      
      // Get department leaders for this department
      const departmentLeaders = await this.getDepartmentLeaders(departmentId, companyId);
      
      // Combine all recipients (admins + department leaders)
      const allRecipients = [...admins, ...departmentLeaders];
      const uniqueRecipients = Array.from(new Map(allRecipients.map(emp => [emp.id, emp])).values());
      
      const notificationData = {
        type: 'deviation' as const,
        title: 'Nytt avvik rapportert',
        message: `${reporterName} har rapportert et nytt avvik: "${deviationTitle}"`,
        priority: 'high' as const,
        actionUrl: `/dashboard/deviations?id=${deviationId}`,
        actionText: 'Se avvik',
        metadata: {
          departmentId,
          companyId,
          deviationTitle,
          reporterId,
          reporterName
        }
      };

      // Create notification for each recipient (admin and department leaders)
      for (const recipient of uniqueRecipients) {
        await this.createNotification({
          userId: recipient.id,
          title: notificationData.title,
          message: notificationData.message,
          type: notificationData.type,
          priority: notificationData.priority,
          actionUrl: notificationData.actionUrl,
          actionText: notificationData.actionText,
          metadata: notificationData.metadata,
          departmentId,
          companyId,
          sendEmail: true
        });
      }
    } catch (error) {
      console.error('Error creating deviation notification:', error);
    }
  }

  // Create vacation request notification - sends to admin and department leaders
  async createVacationNotification(
    vacationId: string,
    employeeName: string,
    employeeId: string,
    startDate: string,
    endDate: string,
    departmentId: string,
    companyId: string
  ): Promise<void> {
    try {
      // Get all admins
      const admins = await this.getAllAdmins(companyId);
      
      // Get department leaders for this department
      const departmentLeaders = await this.getDepartmentLeaders(departmentId, companyId);
      
      // Combine all recipients (admins + department leaders)
      const allRecipients = [...admins, ...departmentLeaders];
      const uniqueRecipients = Array.from(new Map(allRecipients.map(emp => [emp.id, emp])).values());
      
      const notificationData = {
        type: 'vacation' as const,
        title: 'Ny ferieforespørsel',
        message: `${employeeName} har søkt om ferie fra ${startDate} til ${endDate}`,
        priority: 'medium' as const,
        actionUrl: `/dashboard/hr?vacationId=${vacationId}`,
        actionText: 'Godkjenn/Avvis',
        metadata: {
          departmentId,
          companyId,
          startDate,
          endDate,
          employeeId,
          employeeName,
          vacationId
        }
      };

      // Create notification for each recipient (admin and department leaders)
      for (const recipient of uniqueRecipients) {
        await this.createNotification({
          userId: recipient.id,
          title: notificationData.title,
          message: notificationData.message,
          type: notificationData.type,
          priority: notificationData.priority,
          actionUrl: notificationData.actionUrl,
          actionText: notificationData.actionText,
          metadata: notificationData.metadata,
          departmentId,
          companyId,
          sendEmail: true
        });
      }
    } catch (error) {
      console.error('Error creating vacation notification:', error);
    }
  }

  // Create vacation approval/rejection notification - sends to employee
  async createVacationStatusNotification(
    vacationId: string,
    employeeId: string,
    employeeName: string,
    status: 'approved' | 'rejected',
    approvedBy: string,
    startDate: string,
    endDate: string,
    companyId: string
  ): Promise<void> {
    try {
      const statusText = status === 'approved' ? 'godkjent' : 'avslått';
      const statusColor = status === 'approved' ? '#10b981' : '#ef4444';
      
      await this.createNotification({
        userId: employeeId,
        title: `Ferie ${statusText}`,
        message: `Din ferieforespørsel fra ${startDate} til ${endDate} har blitt ${statusText} av ${approvedBy}`,
        type: 'vacation',
        priority: status === 'approved' ? 'medium' : 'high',
        actionUrl: `/dashboard/hr?vacationId=${vacationId}`,
        actionText: 'Se detaljer',
        metadata: {
          vacationId,
          status,
          approvedBy,
          startDate,
          endDate,
          companyId
        },
        companyId,
        sendEmail: true
      });
    } catch (error) {
      console.error('Error creating vacation status notification:', error);
    }
  }

  // Create absence notification - sends to admin and department leaders
  async createAbsenceNotification(
    absenceId: string,
    employeeName: string,
    employeeId: string,
    absenceType: string,
    startDate: string,
    endDate: string,
    departmentId: string,
    companyId: string
  ): Promise<void> {
    try {
      // Get all admins
      const admins = await this.getAllAdmins(companyId);
      
      // Get department leaders for this department
      const departmentLeaders = await this.getDepartmentLeaders(departmentId, companyId);
      
      // Combine all recipients (admins + department leaders)
      const allRecipients = [...admins, ...departmentLeaders];
      const uniqueRecipients = Array.from(new Map(allRecipients.map(emp => [emp.id, emp])).values());
      
      const dateRange = startDate === endDate ? startDate : `${startDate} - ${endDate}`;
      const notificationData = {
        type: 'absence' as const,
        title: 'Ny fraværsmelding',
        message: `${employeeName} har meldt fravær: ${absenceType} fra ${dateRange}`,
        priority: 'medium' as const,
        actionUrl: `/dashboard/hr?absenceId=${absenceId}`,
        actionText: 'Se fravær',
        metadata: {
          departmentId,
          companyId,
          absenceType,
          startDate,
          endDate,
          employeeId,
          employeeName,
          absenceId
        }
      };

      // Create notification for each recipient (admin and department leaders)
      for (const recipient of uniqueRecipients) {
        await this.createNotification({
          userId: recipient.id,
          title: notificationData.title,
          message: notificationData.message,
          type: notificationData.type,
          priority: notificationData.priority,
          actionUrl: notificationData.actionUrl,
          actionText: notificationData.actionText,
          metadata: notificationData.metadata,
          departmentId,
          companyId,
          sendEmail: true
        });
      }
    } catch (error) {
      console.error('Error creating absence notification:', error);
    }
  }

  // Create absence approval/rejection notification - sends to employee
  async createAbsenceStatusNotification(
    absenceId: string,
    employeeId: string,
    employeeName: string,
    status: 'approved' | 'rejected',
    approvedBy: string,
    absenceType: string,
    startDate: string,
    endDate: string,
    companyId: string
  ): Promise<void> {
    try {
      const statusText = status === 'approved' ? 'godkjent' : 'avslått';
      const dateRange = startDate === endDate ? startDate : `${startDate} - ${endDate}`;
      
      await this.createNotification({
        userId: employeeId,
        title: `Fravær ${statusText}`,
        message: `Din fraværsmelding (${absenceType}) for ${dateRange} har blitt ${statusText} av ${approvedBy}`,
        type: 'absence',
        priority: status === 'approved' ? 'medium' : 'high',
        actionUrl: `/dashboard/hr?absenceId=${absenceId}`,
        actionText: 'Se detaljer',
        metadata: {
          absenceId,
          status,
          approvedBy,
          absenceType,
          startDate,
          endDate,
          companyId
        },
        companyId,
        sendEmail: true
      });
    } catch (error) {
      console.error('Error creating absence status notification:', error);
    }
  }

  // Create shift assignment notification - sends to employee
  async createShiftNotification(
    shiftId: string,
    employeeId: string,
    employeeName: string,
    shiftDate: string,
    shiftTime: string,
    assignedBy: string,
    departmentId: string,
    companyId: string
  ): Promise<void> {
    try {
      await this.createNotification({
        userId: employeeId,
        title: 'Ny vakt tildelt',
        message: `${assignedBy} har tildelt deg en vakt: ${shiftDate} ${shiftTime}`,
        type: 'shift',
        priority: 'medium',
        actionUrl: `/dashboard/shifts?id=${shiftId}`,
        actionText: 'Se vakt',
        metadata: {
          shiftId,
          employeeName,
          shiftDate,
          shiftTime,
          assignedBy,
          departmentId,
          companyId
        },
        departmentId,
        companyId,
        sendEmail: true
      });
    } catch (error) {
      console.error('Error creating shift notification:', error);
    }
  }

  // Create document shared notification
  async createDocumentNotification(
    documentId: string,
    documentName: string,
    sharedBy: string,
    department: string,
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
        userId: recipientId,
        title: notificationData.title,
        message: notificationData.message,
        type: notificationData.type,
        priority: notificationData.priority,
        actionUrl: notificationData.actionUrl,
        actionText: notificationData.actionText,
        metadata: notificationData.metadata
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
    const notificationData = {
      title: `Ny melding i ${chatName}`,
      message: `${senderName}: ${message}`,
      priority: 'low' as const,
      type: 'chat' as const,
      metadata: {
        chatId,
        chatName,
        senderName,
        message
      }
    };

    await this.createNotification({
      userId: recipientId,
      title: notificationData.title,
      message: notificationData.message,
      type: notificationData.type,
      priority: notificationData.priority,
      metadata: notificationData.metadata
    });
  }

  // Create employee notification
  async createEmployeeNotification(
    employeeId: string,
    employeeName: string,
    action: 'added' | 'updated' | 'deleted',
    performedBy: string,
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
        userId: recipientId,
        title: notificationData.title,
        message: notificationData.message,
        type: notificationData.type,
        priority: notificationData.priority,
        actionUrl: notificationData.actionUrl,
        actionText: notificationData.actionText,
        metadata: notificationData.metadata
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
      title,
      message,
      priority,
      type: 'system' as const,
      metadata: {
        actionUrl,
        actionText
      }
    };

    for (const recipientId of recipientIds) {
      await this.createNotification({
        userId: recipientId,
        title: notificationData.title,
        message: notificationData.message,
        type: notificationData.type,
        priority: notificationData.priority,
        metadata: notificationData.metadata
      });
    }
  }

  // Get notification settings
  async getNotificationSettings(userId: string): Promise<NotificationSettings> {
    if (!db) return this.getDefaultSettings();
    
    try {
      const docSnapshot = await getDoc(doc(db, 'notificationSettings', userId));
      if (docSnapshot.exists()) {
        return { ...this.getDefaultSettings(), ...docSnapshot.data() };
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
      updatedAt: new Date().toISOString()
    };
  }
}

export const notificationService = new NotificationService();