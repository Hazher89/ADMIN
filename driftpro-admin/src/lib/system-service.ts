import { 
  collection, 
  doc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit, 
  serverTimestamp,
  writeBatch,
  getDoc
} from 'firebase/firestore';
import { db } from './firebase';

export interface SystemStatus {
  status: 'online' | 'offline' | 'maintenance';
  uptime: string;
  activeUsers: number;
  totalCompanies: number;
  totalEmployees: number;
  lastBackup: string;
  systemLoad: number;
  memoryUsage: number;
  databaseConnections: number;
}

export interface Company {
  id: string;
  name: string;
  orgNumber: string;
  adminEmail: string;
  status: 'active' | 'inactive' | 'suspended' | 'maintenance';
  subscriptionPlan: 'basic' | 'premium' | 'enterprise';
  createdAt: string;
  lastLogin: string;
  employeeCount: number;
  issues: string[];
  customFeatures: string[];
  settings: Record<string, string | number | boolean>;
}

export interface SystemLog {
  id: string;
  timestamp: string;
  level: 'info' | 'warning' | 'error' | 'debug';
  category: 'system' | 'user' | 'company' | 'security' | 'database';
  message: string;
  details?: Record<string, string | number | boolean>;
  userId?: string;
  companyId?: string;
}

export interface FeatureRequest {
  id: string;
  companyId: string;
  companyName: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'pending' | 'in_progress' | 'completed' | 'rejected';
  createdAt: string;
  requestedBy: string;
  estimatedTime?: string;
  assignedTo?: string;
  progress?: number;
  comments?: string[];
}

export interface SystemBackup {
  id: string;
  timestamp: string;
  type: 'full' | 'incremental';
  size: number;
  status: 'completed' | 'failed' | 'in_progress';
  description: string;
  downloadUrl?: string;
}

class SystemService {
  // System Status Management
  async getSystemStatus(): Promise<SystemStatus> {
    try {
      if (!db) {
        throw new Error('Firebase not initialized');
      }
      const statusDoc = await getDoc(doc(db, 'system', 'status'));
      if (statusDoc.exists()) {
        return statusDoc.data() as SystemStatus;
      }
      
      // Return default status if not exists
      return {
        status: 'online',
        uptime: '0 days 0 hours',
        activeUsers: 0,
        totalCompanies: 0,
        totalEmployees: 0,
        lastBackup: new Date().toISOString(),
        systemLoad: 0,
        memoryUsage: 0,
        databaseConnections: 0
      };
    } catch (error) {
      console.error('Error getting system status:', error);
      throw error;
    }
  }

  async updateSystemStatus(status: Partial<SystemStatus>): Promise<void> {
    try {
      if (!db) {
        throw new Error('Firebase not initialized');
      }
      await updateDoc(doc(db, 'system', 'status'), {
        ...status,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating system status:', error);
      throw error;
    }
  }

  // Company Management
  async getAllCompanies(): Promise<Company[]> {
    try {
      if (!db) {
        throw new Error('Firebase not initialized');
      }
      const companiesSnapshot = await getDocs(collection(db, 'companies'));
      return companiesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Company[];
    } catch (error) {
      console.error('Error getting companies:', error);
      throw error;
    }
  }

  async getCompanyById(companyId: string): Promise<Company | null> {
    try {
      if (!db) {
        throw new Error('Firebase not initialized');
      }
      const companyDoc = await getDoc(doc(db, 'companies', companyId));
      if (companyDoc.exists()) {
        return { id: companyDoc.id, ...companyDoc.data() } as Company;
      }
      return null;
    } catch (error) {
      console.error('Error getting company:', error);
      throw error;
    }
  }

  async updateCompanyStatus(companyId: string, status: Company['status']): Promise<void> {
    try {
      if (!db) {
        throw new Error('Firebase not initialized');
      }
      await updateDoc(doc(db, 'companies', companyId), {
        status,
        updatedAt: serverTimestamp()
      });
      
      // Log the action
      await this.createSystemLog({
        level: 'info',
        category: 'company',
        message: `Company status updated to ${status}`,
        details: { companyId, status },
        userId: 'admin'
      });
    } catch (error) {
      console.error('Error updating company status:', error);
      throw error;
    }
  }

  async updateCompanySettings(companyId: string, settings: Record<string, string | number | boolean>): Promise<void> {
    try {
      if (!db) {
        throw new Error('Firebase not initialized');
      }
      await updateDoc(doc(db, 'companies', companyId), {
        settings,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating company settings:', error);
      throw error;
    }
  }

  async addCompanyIssue(companyId: string, issue: string): Promise<void> {
    try {
      if (!db) {
        throw new Error('Firebase not initialized');
      }
      const companyRef = doc(db, 'companies', companyId);
      await updateDoc(companyRef, {
        issues: [...(await this.getCompanyById(companyId))?.issues || [], issue],
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error adding company issue:', error);
      throw error;
    }
  }

  async addCompanyFeature(companyId: string, feature: string): Promise<void> {
    try {
      if (!db) {
        throw new Error('Firebase not initialized');
      }
      const companyRef = doc(db, 'companies', companyId);
      await updateDoc(companyRef, {
        customFeatures: [...(await this.getCompanyById(companyId))?.customFeatures || [], feature],
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error adding company feature:', error);
      throw error;
    }
  }

  // System Logs
  async createSystemLog(log: Omit<SystemLog, 'id' | 'timestamp'>): Promise<void> {
    try {
      if (!db) {
        throw new Error('Firebase not initialized');
      }
      await addDoc(collection(db, 'systemLogs'), {
        ...log,
        timestamp: serverTimestamp()
      });
    } catch (error) {
      console.error('Error creating system log:', error);
      throw error;
    }
  }

  async getSystemLogs(limitCount: number = 100): Promise<SystemLog[]> {
    try {
      if (!db) {
        throw new Error('Firebase not initialized');
      }
      const logsQuery = query(
        collection(db, 'systemLogs'),
        orderBy('timestamp', 'desc'),
        limit(limitCount)
      );
      const logsSnapshot = await getDocs(logsQuery);
      return logsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as SystemLog[];
    } catch (error) {
      console.error('Error getting system logs:', error);
      throw error;
    }
  }

  async getSystemLogsByCategory(category: SystemLog['category'], limitCount: number = 50): Promise<SystemLog[]> {
    try {
      if (!db) {
        throw new Error('Firebase not initialized');
      }
      const logsQuery = query(
        collection(db, 'systemLogs'),
        where('category', '==', category),
        orderBy('timestamp', 'desc'),
        limit(limitCount)
      );
      const logsSnapshot = await getDocs(logsQuery);
      return logsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as SystemLog[];
    } catch (error) {
      console.error('Error getting system logs by category:', error);
      throw error;
    }
  }

  async clearOldLogs(daysOld: number = 30): Promise<void> {
    try {
      if (!db) {
        throw new Error('Firebase not initialized');
      }
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);
      
      const logsQuery = query(
        collection(db, 'systemLogs'),
        where('timestamp', '<', cutoffDate)
      );
      const logsSnapshot = await getDocs(logsQuery);
      
      const batch = writeBatch(db);
      logsSnapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });
      await batch.commit();
      
      await this.createSystemLog({
        level: 'info',
        category: 'system',
        message: `Cleared ${logsSnapshot.docs.length} old logs`,
        details: { daysOld, logsCleared: logsSnapshot.docs.length }
      });
    } catch (error) {
      console.error('Error clearing old logs:', error);
      throw error;
    }
  }

  // Feature Requests
  async createFeatureRequest(request: Omit<FeatureRequest, 'id' | 'createdAt'>): Promise<string> {
    try {
      if (!db) {
        throw new Error('Firebase not initialized');
      }
      const docRef = await addDoc(collection(db, 'featureRequests'), {
        ...request,
        createdAt: serverTimestamp()
      });
      return docRef.id;
    } catch (error) {
      console.error('Error creating feature request:', error);
      throw error;
    }
  }

  async getFeatureRequests(): Promise<FeatureRequest[]> {
    try {
      if (!db) {
        throw new Error('Firebase not initialized');
      }
      const requestsSnapshot = await getDocs(collection(db, 'featureRequests'));
      return requestsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as FeatureRequest[];
    } catch (error) {
      console.error('Error getting feature requests:', error);
      throw error;
    }
  }

  async updateFeatureRequest(requestId: string, updates: Partial<FeatureRequest>): Promise<void> {
    try {
      if (!db) {
        throw new Error('Firebase not initialized');
      }
      await updateDoc(doc(db, 'featureRequests', requestId), {
        ...updates,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating feature request:', error);
      throw error;
    }
  }

  async deleteFeatureRequest(requestId: string): Promise<void> {
    try {
      if (!db) {
        throw new Error('Firebase not initialized');
      }
      await deleteDoc(doc(db, 'featureRequests', requestId));
    } catch (error) {
      console.error('Error deleting feature request:', error);
      throw error;
    }
  }

  // System Operations
  async performSystemBackup(type: 'full' | 'incremental' = 'full'): Promise<string> {
    try {
      if (!db) {
        throw new Error('Firebase not initialized');
      }
      const backupId = `backup_${Date.now()}`;
      await addDoc(collection(db, 'systemBackups'), {
        id: backupId,
        timestamp: serverTimestamp(),
        type,
        size: 0, // Will be calculated
        status: 'in_progress',
        description: `${type} backup initiated`
      });
      
      await this.createSystemLog({
        level: 'info',
        category: 'system',
        message: `System backup initiated: ${type}`,
        details: { backupId, type }
      });
      
      return backupId;
    } catch (error) {
      console.error('Error performing system backup:', error);
      throw error;
    }
  }

  async enterMaintenanceMode(reason: string): Promise<void> {
    try {
      if (!db) {
        throw new Error('Firebase not initialized');
      }
      await this.updateSystemStatus({ status: 'maintenance' });
      await this.createSystemLog({
        level: 'warning',
        category: 'system',
        message: 'System entered maintenance mode',
        details: { reason }
      });
    } catch (error) {
      console.error('Error entering maintenance mode:', error);
      throw error;
    }
  }

  async exitMaintenanceMode(): Promise<void> {
    try {
      if (!db) {
        throw new Error('Firebase not initialized');
      }
      await this.updateSystemStatus({ status: 'online' });
      await this.createSystemLog({
        level: 'info',
        category: 'system',
        message: 'System exited maintenance mode'
      });
    } catch (error) {
      console.error('Error exiting maintenance mode:', error);
      throw error;
    }
  }

  // User Management
  async resetUserPassword(userId: string): Promise<void> {
    try {
      if (!db) {
        throw new Error('Firebase not initialized');
      }
      // This would typically integrate with Firebase Auth
      await this.createSystemLog({
        level: 'info',
        category: 'user',
        message: 'User password reset',
        details: { userId },
        userId: 'admin'
      });
    } catch (error) {
      console.error('Error resetting user password:', error);
      throw error;
    }
  }

  async suspendUser(userId: string, reason: string): Promise<void> {
    try {
      if (!db) {
        throw new Error('Firebase not initialized');
      }
      // This would typically integrate with Firebase Auth
      await this.createSystemLog({
        level: 'warning',
        category: 'user',
        message: 'User suspended',
        details: { userId, reason },
        userId: 'admin'
      });
    } catch (error) {
      console.error('Error suspending user:', error);
      throw error;
    }
  }

  // Analytics and Monitoring
  async getSystemMetrics(): Promise<{
    totalUsers: number;
    activeUsers: number;
    totalCompanies: number;
    activeCompanies: number;
    systemLoad: number;
    memoryUsage: number;
    databaseConnections: number;
  }> {
    try {
      if (!db) {
        throw new Error('Firebase not initialized');
      }
      const companies = await this.getAllCompanies();
      const activeCompanies = companies.filter(c => c.status === 'active');
      
      return {
        totalUsers: companies.reduce((sum, c) => sum + c.employeeCount, 0),
        activeUsers: activeCompanies.reduce((sum, c) => sum + c.employeeCount, 0),
        totalCompanies: companies.length,
        activeCompanies: activeCompanies.length,
        systemLoad: Math.random() * 100, // Mock data
        memoryUsage: Math.random() * 100, // Mock data
        databaseConnections: Math.floor(Math.random() * 50) + 10 // Mock data
      };
    } catch (error) {
      console.error('Error getting system metrics:', error);
      throw error;
    }
  }

  // Security and Audit
  async performSecurityAudit(): Promise<{
    vulnerabilities: string[];
    recommendations: string[];
    score: number;
  }> {
    try {
      if (!db) {
        throw new Error('Firebase not initialized');
      }
      // Mock security audit
      const audit = {
        vulnerabilities: [
          'Weak password policies detected',
          'Outdated SSL certificates',
          'Missing 2FA on admin accounts'
        ],
        recommendations: [
          'Implement stronger password requirements',
          'Update SSL certificates',
          'Enable 2FA for all admin accounts'
        ],
        score: 75
      };
      
      await this.createSystemLog({
        level: 'info',
        category: 'security',
        message: 'Security audit completed',
        details: {
          vulnerabilities: audit.vulnerabilities.join(', '),
          recommendations: audit.recommendations.join(', '),
          score: audit.score
        }
      });
      
      return audit;
    } catch (error) {
      console.error('Error performing security audit:', error);
      throw error;
    }
  }
}

export const systemService = new SystemService(); 