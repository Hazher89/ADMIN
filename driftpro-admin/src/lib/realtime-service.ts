// Real-time Update Service - Broadcasts changes from super admin to all connected clients
// Uses Firebase Realtime Database for efficient real-time synchronization

import { db } from './firebase';
import { collection, doc, setDoc, onSnapshot, query, where, orderBy, limit, Timestamp, getDocs } from 'firebase/firestore';

export interface RealtimeUpdate {
  id: string;
  type: 'employee_update' | 'permission_change' | 'department_update' | 'settings_update' | 'bulk_update' | 'system_announcement';
  resourceType: string;
  resourceId: string;
  companyId: string;
  triggeredBy: string;
  triggeredByName?: string;
  changes: Record<string, any>;
  timestamp: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  requiresRefresh?: boolean; // If true, client should refresh entire page/section
  affectedUsers?: string[]; // User IDs that should be notified
  message?: string; // Human-readable message
}

class RealtimeService {
  private listeners: Map<string, () => void> = new Map();

  // Broadcast an update to all connected clients
  async broadcastUpdate(
    companyId: string,
    update: Omit<RealtimeUpdate, 'id' | 'timestamp' | 'companyId'>
  ): Promise<string> {
    if (!db) throw new Error('Database not initialized');
    const updateRef = doc(collection(db, 'realtime_updates'));
    const updateData: RealtimeUpdate = {
      id: updateRef.id,
      companyId,
      ...update,
      timestamp: new Date().toISOString(),
    };

    await setDoc(updateRef, {
      ...updateData,
      createdAt: Timestamp.now(),
    });

    // Clean up old updates (keep only last 1000 per company)
    this.cleanupOldUpdates(companyId);

    return updateRef.id;
  }

  // Subscribe to real-time updates for a company
  subscribeToUpdates(
    companyId: string,
    callback: (updates: RealtimeUpdate[]) => void,
    options?: {
      types?: RealtimeUpdate['type'][];
      limit?: number;
      userId?: string; // Only get updates relevant to this user
    }
  ): () => void {
    if (!db) {
      console.error('Database not initialized');
      return () => {};
    }
    let q: any = query(
      collection(db, 'realtime_updates'),
      where('companyId', '==', companyId),
      orderBy('timestamp', 'desc'),
      limit(options?.limit || 100)
    );

    // Filter by types if provided
    // Note: Firestore doesn't support OR queries easily, so we'll filter in memory
    // For better performance with many types, use separate subscriptions

    const unsubscribe = onSnapshot(q, (snapshot: any) => {
      let updates = snapshot.docs.map((doc: any) => doc.data() as RealtimeUpdate);

      // Filter by types if specified
      if (options?.types && options.types.length > 0) {
        updates = updates.filter((u: RealtimeUpdate) => options.types!.includes(u.type));
      }

      // Filter by affected users if userId specified
      if (options?.userId) {
        updates = updates.filter((u: RealtimeUpdate) => 
          !u.affectedUsers || 
          u.affectedUsers.length === 0 || 
          u.affectedUsers.includes(options.userId!)
        );
      }

      // Sort by timestamp (most recent first)
      updates.sort((a: RealtimeUpdate, b: RealtimeUpdate) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );

      callback(updates);
    });

    // Store unsubscribe function
    const key = `${companyId}-${Date.now()}`;
    this.listeners.set(key, unsubscribe);

    // Return unsubscribe function
    return () => {
      unsubscribe();
      this.listeners.delete(key);
    };
  }

  // Subscribe to a specific resource type
  subscribeToResource(
    companyId: string,
    resourceType: string,
    resourceId: string,
    callback: (update: RealtimeUpdate | null) => void
  ): () => void {
    if (!db) {
      console.error('Database not initialized');
      return () => {};
    }
    const q = query(
      collection(db, 'realtime_updates'),
      where('companyId', '==', companyId),
      where('resourceType', '==', resourceType),
      where('resourceId', '==', resourceId),
      orderBy('timestamp', 'desc'),
      limit(1)
    );

    const unsubscribe = onSnapshot(q, (snapshot: any) => {
      if (snapshot.empty) {
        callback(null);
        return;
      }
      callback(snapshot.docs[0].data() as RealtimeUpdate);
    });

    const key = `${companyId}-${resourceType}-${resourceId}`;
    this.listeners.set(key, unsubscribe);

    return () => {
      unsubscribe();
      this.listeners.delete(key);
    };
  }

  // Cleanup old updates (keep only last 1000 per company)
  private async cleanupOldUpdates(companyId: string): Promise<void> {
    // This is a simplified version - in production, use a Cloud Function
    // to periodically clean up old updates
    if (!db) return;
    try {
      const q = query(
        collection(db, 'realtime_updates'),
        where('companyId', '==', companyId),
        orderBy('timestamp', 'desc')
      );
      
      // We'll handle cleanup in a Cloud Function for better performance
      // This is just a placeholder
    } catch (error) {
      console.warn('Cleanup failed (this is expected in some cases):', error);
    }
  }

  // Get latest updates (one-time fetch)
  async getLatestUpdates(
    companyId: string,
    limitCount: number = 50
  ): Promise<RealtimeUpdate[]> {
    if (!db) throw new Error('Database not initialized');
    const q = query(
      collection(db, 'realtime_updates'),
      where('companyId', '==', companyId),
      orderBy('timestamp', 'desc'),
      limit(limitCount)
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc: any) => doc.data() as RealtimeUpdate);
  }

  // Broadcast employee update (triggered by super admin)
  async broadcastEmployeeUpdate(
    companyId: string,
    employeeId: string,
    changes: Record<string, any>,
    triggeredBy: string,
    triggeredByName?: string,
    affectedUsers?: string[]
  ): Promise<string> {
    return this.broadcastUpdate(companyId, {
      type: 'employee_update',
      resourceType: 'employee',
      resourceId: employeeId,
      triggeredBy,
      triggeredByName,
      changes,
      priority: 'high',
      requiresRefresh: true,
      affectedUsers,
      message: `Ansatt oppdatert: ${changes.displayName || employeeId}`,
    });
  }

  // Broadcast permission change
  async broadcastPermissionChange(
    companyId: string,
    userId: string,
    changes: Record<string, any>,
    triggeredBy: string,
    triggeredByName?: string
  ): Promise<string> {
    return this.broadcastUpdate(companyId, {
      type: 'permission_change',
      resourceType: 'user',
      resourceId: userId,
      triggeredBy,
      triggeredByName,
      changes,
      priority: 'critical',
      requiresRefresh: true,
      affectedUsers: [userId],
      message: `Tillatelser endret for bruker`,
    });
  }

  // Broadcast bulk update (e.g., when super admin updates multiple employees)
  async broadcastBulkUpdate(
    companyId: string,
    resourceType: string,
    resourceIds: string[],
    changes: Record<string, any>,
    triggeredBy: string,
    triggeredByName?: string
  ): Promise<string> {
    return this.broadcastUpdate(companyId, {
      type: 'bulk_update',
      resourceType,
      resourceId: resourceIds.join(','),
      triggeredBy,
      triggeredByName,
      changes,
      priority: 'critical',
      requiresRefresh: true,
      message: `${resourceIds.length} ${resourceType}(er) oppdatert`,
    });
  }

  // Broadcast system announcement
  async broadcastSystemAnnouncement(
    companyId: string,
    message: string,
    priority: RealtimeUpdate['priority'] = 'medium',
    triggeredBy: string,
    triggeredByName?: string
  ): Promise<string> {
    return this.broadcastUpdate(companyId, {
      type: 'system_announcement',
      resourceType: 'system',
      resourceId: 'announcement',
      triggeredBy,
      triggeredByName,
      changes: { message },
      priority,
      requiresRefresh: false,
      message,
    });
  }

  // Cleanup all listeners
  cleanup(): void {
    this.listeners.forEach(unsubscribe => unsubscribe());
    this.listeners.clear();
  }
}

export const realtimeService = new RealtimeService();
