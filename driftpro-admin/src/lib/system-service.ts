import { db } from './firebase';
import { collection, getDocs, addDoc, updateDoc, doc, query, where, serverTimestamp } from 'firebase/firestore';

export interface SystemStatus {
  id: string;
  status: 'online' | 'offline' | 'maintenance';
  lastCheck: string;
  uptime: number;
  version: string;
  companyId: string; // Added for company isolation
}

export interface SystemLog {
  id: string;
  level: 'info' | 'warning' | 'error';
  message: string;
  timestamp: string;
  userId?: string;
  companyId: string; // Added for company isolation
}

export interface FeatureRequest {
  id: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'approved' | 'rejected' | 'implemented';
  submittedBy: string;
  submittedAt: string;
  companyId: string; // Added for company isolation
}

export const systemService = {
  // Get system status
  async getSystemStatus(companyName: string): Promise<SystemStatus | null> {
    if (!db) return null;
    
    try {
      const statusQuery = query(
        collection(db, 'systemStatus'),
        where('companyId', '==', companyName)
      );
      const snapshot = await getDocs(statusQuery);
      
      if (!snapshot.empty) {
        const data = snapshot.docs[0].data();
        return {
          id: snapshot.docs[0].id,
          status: data.status || 'online',
          lastCheck: data.lastCheck || new Date().toISOString(),
          uptime: data.uptime || 0,
          version: data.version || '1.0.0',
          companyId: companyName
        };
      }
      return null;
    } catch (error) {
      console.error('Error getting system status:', error);
      return null;
    }
  },

  // Update system status
  async updateSystemStatus(companyName: string, status: Partial<SystemStatus>): Promise<void> {
    if (!db) return;
    
    try {
      const statusQuery = query(
        collection(db, 'systemStatus'),
        where('companyId', '==', companyName)
      );
      const snapshot = await getDocs(statusQuery);
      
      if (!snapshot.empty) {
        await updateDoc(doc(db, 'systemStatus', snapshot.docs[0].id), {
          ...status,
          updatedAt: serverTimestamp()
        });
      } else {
        await addDoc(collection(db, 'systemStatus'), {
          ...status,
          companyId: companyName,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      }
    } catch (error) {
      console.error('Error updating system status:', error);
    }
  },

  // Get system logs
  async getSystemLogs(companyName: string, limit: number = 100): Promise<SystemLog[]> {
    if (!db) return [];
    
    try {
      const logsQuery = query(
        collection(db, 'systemLogs'),
        where('companyId', '==', companyName)
      );
      const snapshot = await getDocs(logsQuery);
      
      return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          level: data.level || 'info',
          message: data.message || '',
          timestamp: data.timestamp || new Date().toISOString(),
          userId: data.userId || undefined,
          companyId: companyName
        };
      }).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, limit);
    } catch (error) {
      console.error('Error getting system logs:', error);
      return [];
    }
  },

  // Create system log
  async createSystemLog(companyName: string, log: Omit<SystemLog, 'id' | 'companyId'>): Promise<void> {
    if (!db) return;
    
    try {
      await addDoc(collection(db, 'systemLogs'), {
        ...log,
        companyId: companyName,
        timestamp: serverTimestamp()
      });
    } catch (error) {
      console.error('Error creating system log:', error);
    }
  },

  // Get feature requests
  async getFeatureRequests(companyName: string): Promise<FeatureRequest[]> {
    if (!db) return [];
    
    try {
      const requestsQuery = query(
        collection(db, 'featureRequests'),
        where('companyId', '==', companyName)
      );
      const snapshot = await getDocs(requestsQuery);
      
      return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          title: data.title || '',
          description: data.description || '',
          priority: data.priority || 'medium',
          status: data.status || 'pending',
          submittedBy: data.submittedBy || '',
          submittedAt: data.submittedAt || new Date().toISOString(),
          companyId: companyName
        };
      }).sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
    } catch (error) {
      console.error('Error getting feature requests:', error);
      return [];
    }
  },

  // Create feature request
  async createFeatureRequest(companyName: string, request: Omit<FeatureRequest, 'id' | 'companyId' | 'submittedAt'>): Promise<void> {
    if (!db) return;
    
    try {
      await addDoc(collection(db, 'featureRequests'), {
        ...request,
        companyId: companyName,
        submittedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error creating feature request:', error);
    }
  },

  // Update feature request status
  async updateFeatureRequestStatus(requestId: string, status: FeatureRequest['status']): Promise<void> {
    if (!db) return;
    
    try {
      await updateDoc(doc(db, 'featureRequests', requestId), {
        status,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating feature request status:', error);
    }
  }
}; 