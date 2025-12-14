// GDPR Compliance Service - Comprehensive data protection and compliance
// This service ensures strict GDPR compliance across all data operations

import { db } from './firebase';
import { collection, doc, setDoc, getDoc, deleteDoc, query, where, getDocs, updateDoc, Timestamp } from 'firebase/firestore';

export interface GDPRConsent {
  id: string;
  userId: string;
  companyId: string;
  consentType: 'data_processing' | 'marketing' | 'analytics' | 'third_party' | 'data_sharing';
  granted: boolean;
  grantedAt: string | null;
  revokedAt: string | null;
  consentText: string;
  version: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface DataProcessingRecord {
  id: string;
  userId: string;
  companyId: string;
  dataType: string;
  purpose: string;
  legalBasis: 'consent' | 'contract' | 'legal_obligation' | 'vital_interests' | 'public_task' | 'legitimate_interests';
  processedAt: string;
  processedBy: string;
  retentionPeriod: string; // ISO duration string (e.g., "P5Y" for 5 years)
  deletedAt?: string;
}

export interface DataSubjectRequest {
  id: string;
  userId: string;
  companyId: string;
  requestType: 'access' | 'rectification' | 'erasure' | 'restriction' | 'portability' | 'objection';
  status: 'pending' | 'in_progress' | 'completed' | 'rejected';
  requestedAt: string;
  completedAt?: string;
  requestDetails: string;
  responseData?: any;
  handledBy?: string;
  notes?: string;
}

export interface DataBreachRecord {
  id: string;
  companyId: string;
  detectedAt: string;
  reportedAt?: string;
  type: 'unauthorized_access' | 'data_loss' | 'data_leak' | 'malware' | 'phishing' | 'other';
  severity: 'low' | 'medium' | 'high' | 'critical';
  affectedUsers: number;
  affectedDataTypes: string[];
  description: string;
  containmentMeasures: string[];
  notificationStatus: 'not_required' | 'pending' | 'notified' | 'notified_authority';
  authorityNotifiedAt?: string;
  usersNotifiedAt?: string;
  resolvedAt?: string;
}

export interface AuditLogEntry {
  id: string;
  userId: string;
  companyId: string;
  action: string;
  resourceType: string;
  resourceId: string;
  changes: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  timestamp: string;
  gdprRelevant: boolean;
}

class GDPRService {
  // Consent Management
  async recordConsent(userId: string, companyId: string, consent: Omit<GDPRConsent, 'id' | 'userId' | 'companyId'>): Promise<string> {
    if (!db) throw new Error('Database not initialized');
    const consentRef = doc(collection(db, 'gdpr_consents'));
    const consentData: GDPRConsent = {
      id: consentRef.id,
      userId,
      companyId,
      ...consent,
      grantedAt: consent.granted ? new Date().toISOString() : null,
      revokedAt: !consent.granted ? new Date().toISOString() : null,
    };
    
    await setDoc(consentRef, {
      ...consentData,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
    
    // Log the consent change
    await this.logAuditEvent(userId, companyId, {
      action: consent.granted ? 'consent_granted' : 'consent_revoked',
      resourceType: 'consent',
      resourceId: consentRef.id,
      changes: { consentType: consent.consentType, granted: consent.granted },
      gdprRelevant: true,
    });
    
    return consentRef.id;
  }

  async getConsents(userId: string, companyId: string): Promise<GDPRConsent[]> {
    if (!db) throw new Error('Database not initialized');
    const q = query(
      collection(db, 'gdpr_consents'),
      where('userId', '==', userId),
      where('companyId', '==', companyId)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data() as GDPRConsent);
  }

  async revokeConsent(userId: string, companyId: string, consentType: GDPRConsent['consentType']): Promise<void> {
    if (!db) throw new Error('Database not initialized');
    const q = query(
      collection(db, 'gdpr_consents'),
      where('userId', '==', userId),
      where('companyId', '==', companyId),
      where('consentType', '==', consentType),
      where('granted', '==', true)
    );
    const snapshot = await getDocs(q);
    
    const batch = snapshot.docs.map(async (docSnap) => {
      await updateDoc(docSnap.ref, {
        granted: false,
        revokedAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
    });
    
    await Promise.all(batch);
    
    // Log the revocation
    await this.logAuditEvent(userId, companyId, {
      action: 'consent_revoked',
      resourceType: 'consent',
      resourceId: snapshot.docs[0]?.id || '',
      changes: { consentType, granted: false },
      gdprRelevant: true,
    });
  }

  // Data Processing Records
  async recordDataProcessing(
    userId: string,
    companyId: string,
    processing: Omit<DataProcessingRecord, 'id' | 'userId' | 'companyId' | 'processedAt'>
  ): Promise<string> {
    if (!db) throw new Error('Database not initialized');
    const recordRef = doc(collection(db, 'gdpr_data_processing'));
    const recordData: DataProcessingRecord = {
      id: recordRef.id,
      userId,
      companyId,
      ...processing,
      processedAt: new Date().toISOString(),
    };
    
    await setDoc(recordRef, {
      ...recordData,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
    
    return recordRef.id;
  }

  // Data Subject Requests (Right to Access, Rectification, Erasure, etc.)
  async createDataSubjectRequest(
    userId: string,
    companyId: string,
    request: Omit<DataSubjectRequest, 'id' | 'userId' | 'companyId' | 'requestedAt' | 'status'>
  ): Promise<string> {
    if (!db) throw new Error('Database not initialized');
    const requestRef = doc(collection(db, 'gdpr_data_subject_requests'));
    const requestData: DataSubjectRequest = {
      id: requestRef.id,
      userId,
      companyId,
      ...request,
      requestedAt: new Date().toISOString(),
      status: 'pending',
    };
    
    await setDoc(requestRef, {
      ...requestData,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
    
    // Log the request
    await this.logAuditEvent(userId, companyId, {
      action: `data_subject_request_${request.requestType}`,
      resourceType: 'data_subject_request',
      resourceId: requestRef.id,
      changes: { requestType: request.requestType },
      gdprRelevant: true,
    });
    
    return requestRef.id;
  }

  async getDataSubjectRequests(userId: string, companyId: string): Promise<DataSubjectRequest[]> {
    if (!db) throw new Error('Database not initialized');
    const q = query(
      collection(db, 'gdpr_data_subject_requests'),
      where('userId', '==', userId),
      where('companyId', '==', companyId)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data() as DataSubjectRequest);
  }

  async getAllDataSubjectRequests(companyId: string): Promise<DataSubjectRequest[]> {
    if (!db) throw new Error('Database not initialized');
    const q = query(
      collection(db, 'gdpr_data_subject_requests'),
      where('companyId', '==', companyId)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data() as DataSubjectRequest);
  }

  async updateDataSubjectRequest(
    requestId: string,
    updates: Partial<DataSubjectRequest>,
    handledBy: string
  ): Promise<void> {
    if (!db) throw new Error('Database not initialized');
    const requestRef = doc(db, 'gdpr_data_subject_requests', requestId);
    await updateDoc(requestRef, {
      ...updates,
      handledBy,
      updatedAt: Timestamp.now(),
    });
  }

  // Right to Erasure (Right to be Forgotten)
  async requestDataErasure(userId: string, companyId: string, reason?: string): Promise<string> {
    return this.createDataSubjectRequest(userId, companyId, {
      requestType: 'erasure',
      requestDetails: reason || 'User requested data erasure',
      notes: reason,
    });
  }

  // Right to Data Portability
  async exportUserData(userId: string, companyId: string): Promise<any> {
    if (!db) throw new Error('Database not initialized');
    // Collect all user data from various collections
    const userData: any = {
      profile: null,
      consents: [],
      dataProcessing: [],
      auditLogs: [],
      exportDate: new Date().toISOString(),
    };

    // Get user profile
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (userDoc.exists()) {
      userData.profile = userDoc.data();
    }

    // Get consents
    userData.consents = await this.getConsents(userId, companyId);

    // Get data processing records
    const processingQ = query(
      collection(db, 'gdpr_data_processing'),
      where('userId', '==', userId),
      where('companyId', '==', companyId)
    );
    const processingSnapshot = await getDocs(processingQ);
    userData.dataProcessing = processingSnapshot.docs.map(doc => doc.data());

    // Get audit logs
    const auditQ = query(
      collection(db, 'audit_logs'),
      where('userId', '==', userId),
      where('companyId', '==', companyId)
    );
    const auditSnapshot = await getDocs(auditQ);
    userData.auditLogs = auditSnapshot.docs.map(doc => doc.data());

    return userData;
  }

  // Data Breach Management
  async recordDataBreach(
    companyId: string,
    breach: Omit<DataBreachRecord, 'id' | 'companyId' | 'detectedAt' | 'notificationStatus'>
  ): Promise<string> {
    if (!db) throw new Error('Database not initialized');
    const breachRef = doc(collection(db, 'gdpr_data_breaches'));
    const breachData: DataBreachRecord = {
      id: breachRef.id,
      companyId,
      ...breach,
      detectedAt: new Date().toISOString(),
      notificationStatus: 'pending',
    };
    
    await setDoc(breachRef, {
      ...breachData,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
    
    return breachRef.id;
  }

  async getDataBreaches(companyId: string): Promise<DataBreachRecord[]> {
    if (!db) throw new Error('Database not initialized');
    const q = query(
      collection(db, 'gdpr_data_breaches'),
      where('companyId', '==', companyId)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data() as DataBreachRecord);
  }

  // Audit Logging
  async logAuditEvent(
    userId: string,
    companyId: string,
    event: Omit<AuditLogEntry, 'id' | 'userId' | 'companyId' | 'timestamp'>
  ): Promise<string> {
    if (!db) throw new Error('Database not initialized');
    const logRef = doc(collection(db, 'audit_logs'));
    const logData: AuditLogEntry = {
      id: logRef.id,
      userId,
      companyId,
      ...event,
      timestamp: new Date().toISOString(),
    };
    
    await setDoc(logRef, {
      ...logData,
      createdAt: Timestamp.now(),
    });
    
    return logRef.id;
  }

  async getAuditLogs(companyId: string, filters?: { userId?: string; resourceType?: string; limit?: number }): Promise<AuditLogEntry[]> {
    if (!db) throw new Error('Database not initialized');
    let q: any = query(
      collection(db, 'audit_logs'),
      where('companyId', '==', companyId)
    );

    if (filters?.userId) {
      q = query(q, where('userId', '==', filters.userId));
    }

    if (filters?.resourceType) {
      q = query(q, where('resourceType', '==', filters.resourceType));
    }

    const snapshot = await getDocs(q);
    let logs = snapshot.docs.map(doc => doc.data() as AuditLogEntry);
    
    // Sort by timestamp descending
    logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    
    if (filters?.limit) {
      logs = logs.slice(0, filters.limit);
    }
    
    return logs;
  }

  // Data Retention and Automatic Deletion
  async checkDataRetention(companyId: string): Promise<void> {
    if (!db) throw new Error('Database not initialized');
    // Check all data processing records for expired retention periods
    const q = query(
      collection(db, 'gdpr_data_processing'),
      where('companyId', '==', companyId),
      where('deletedAt', '==', null)
    );
    const snapshot = await getDocs(q);
    
    const now = new Date();
    const recordsToDelete: DataProcessingRecord[] = [];
    
    snapshot.docs.forEach(doc => {
      const record = doc.data() as DataProcessingRecord;
      const processedDate = new Date(record.processedAt);
      
      // Parse retention period (simplified - in production, use a proper ISO 8601 duration parser)
      const retentionMatch = record.retentionPeriod.match(/P(\d+)Y/);
      if (retentionMatch) {
        const years = parseInt(retentionMatch[1]);
        const expiryDate = new Date(processedDate);
        expiryDate.setFullYear(expiryDate.getFullYear() + years);
        
        if (now > expiryDate) {
          recordsToDelete.push(record);
        }
      }
    });
    
    // Mark records for deletion (don't delete immediately - mark for review)
    for (const record of recordsToDelete) {
      await updateDoc(doc(db, 'gdpr_data_processing', record.id), {
        deletedAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
    }
  }

  // Privacy Policy and Terms Versioning
  async getLatestPrivacyPolicy(): Promise<string> {
    // In a real implementation, this would fetch from a CMS or document store
    return `# Personvernpolitikk

**Versjon:** 1.0
**Sist oppdatert:** ${new Date().toLocaleDateString('nb-NO')}

## 1. Innledning
DriftPro administrerer personopplysninger i samsvar med personvernforordningen (GDPR).

## 2. Dataansvarlig
DriftPro er dataansvarlig for behandlingen av personopplysninger.

## 3. Hvilke opplysninger vi samler inn
- Navn og kontaktinformasjon
- Organisasjonsnummer og firmainformasjon
- E-postadresse og telefonnummer
- Bruksdata fra systemet

## 4. Hvorfor vi behandler personopplysninger
Vi behandler personopplysninger for å:
- Administrere brukerkontoer
- Levere tjenester
- Følge lovpålagte forpliktelser

## 5. Dine rettigheter
Du har rett til:
- Innsyn i dine personopplysninger
- Rettelse av feilaktige opplysninger
- Sletting av personopplysninger
- Dataportabilitet
- Å motsette deg behandling

## 6. Oppbevaring
Personopplysninger oppbevares så lenge det er nødvendig for formålet de ble innhentet for.

## 7. Kontakt oss
For å utøve dine rettigheter, kontakt oss på: privacy@driftpro.no`;
  }
}

export const gdprService = new GDPRService();
