import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit, 
  serverTimestamp,
  Timestamp,
  writeBatch
} from 'firebase/firestore';
import { db } from './firebase';

// Types for all HMS modules
export interface Protocol {
  id?: string;
  name: string;
  category: 'Sikkerhet' | 'Miljø' | 'Kvalitet' | 'HMS' | 'Prosess';
  status: 'active' | 'draft' | 'inactive' | 'archived';
  version: string;
  description: string;
  content: string;
  responsiblePerson: string;
  department: string;
  lastUpdated: Date;
  nextReview: Date;
  attachments: string[];
  tags: string[];
  companyId: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ManagementReview {
  id?: string;
  title: string;
  date: Date;
  status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled';
  participants: string[];
  agenda: string[];
  findings: Finding[];
  actions: Action[];
  companyId: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Finding {
  id: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: string;
  responsiblePerson: string;
  dueDate: Date;
  status: 'open' | 'in-progress' | 'resolved' | 'closed';
}

export interface Action {
  id: string;
  description: string;
  responsiblePerson: string;
  dueDate: Date;
  status: 'pending' | 'in-progress' | 'completed' | 'overdue';
  priority: 'low' | 'medium' | 'high' | 'critical';
}

export interface Compliance {
  id?: string;
  regulation: string;
  description: string;
  status: 'compliant' | 'non-compliant' | 'review' | 'pending';
  risk: 'low' | 'medium' | 'high' | 'critical';
  lastCheck: Date;
  nextCheck: Date;
  requirements: Requirement[];
  documents: string[];
  responsiblePerson: string;
  department: string;
  companyId: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Requirement {
  id: string;
  description: string;
  status: 'met' | 'not-met' | 'partial' | 'not-applicable';
  evidence: string;
  notes: string;
}

export interface JSA {
  id?: string;
  activity: string;
  department: string;
  location: string;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  status: 'active' | 'inactive' | 'archived';
  hazards: Hazard[];
  controls: Control[];
  responsiblePerson: string;
  lastUpdated: Date;
  nextReview: Date;
  companyId: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Hazard {
  id: string;
  description: string;
  probability: 'low' | 'medium' | 'high';
  consequence: 'low' | 'medium' | 'high' | 'critical';
  riskScore: number;
  existingControls: string[];
  additionalControls: string[];
}

export interface Control {
  id: string;
  description: string;
  type: 'elimination' | 'substitution' | 'engineering' | 'administrative' | 'ppe';
  effectiveness: 'low' | 'medium' | 'high';
  status: 'implemented' | 'planned' | 'not-implemented';
}

export interface Equipment {
  id?: string;
  name: string;
  type: string;
  model: string;
  serialNumber: string;
  status: 'operational' | 'maintenance' | 'out-of-service' | 'retired';
  location: string;
  department: string;
  responsiblePerson: string;
  lastInspection: Date;
  nextInspection: Date;
  maintenanceHistory: MaintenanceRecord[];
  documents: string[];
  specifications: Record<string, any>;
  companyId: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface MaintenanceRecord {
  id: string;
  date: Date;
  type: 'inspection' | 'maintenance' | 'repair' | 'calibration';
  description: string;
  performedBy: string;
  cost: number;
  nextDate: Date;
  status: 'completed' | 'scheduled' | 'overdue';
}

export interface WorkProcess {
  id?: string;
  name: string;
  department: string;
  status: 'active' | 'draft' | 'inactive' | 'archived';
  version: string;
  description: string;
  steps: ProcessStep[];
  responsiblePerson: string;
  lastUpdated: Date;
  nextReview: Date;
  attachments: string[];
  companyId: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProcessStep {
  id: string;
  stepNumber: number;
  description: string;
  responsibleRole: string;
  estimatedTime: number;
  requirements: string[];
  risks: string[];
}

export interface OrgChart {
  id?: string;
  name: string;
  position: string;
  department: string;
  email: string;
  phone: string;
  reportsTo: string | null;
  employees: string[];
  startDate: Date;
  status: 'active' | 'inactive' | 'vacant';
  skills: string[];
  certifications: string[];
  companyId: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

// Company Service Class
export class CompanyService {
  private companyId: string;

  constructor(companyId: string) {
    this.companyId = companyId;
  }

  // Protocol Management
  async getProtocols(): Promise<Protocol[]> {
    const q = query(
      collection(db, 'protocols'),
      where('companyId', '==', this.companyId),
      orderBy('lastUpdated', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      lastUpdated: doc.data().lastUpdated?.toDate(),
      nextReview: doc.data().nextReview?.toDate(),
      createdAt: doc.data().createdAt?.toDate(),
      updatedAt: doc.data().updatedAt?.toDate()
    })) as Protocol[];
  }

  async getProtocol(id: string): Promise<Protocol | null> {
    const docRef = doc(db, 'protocols', id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        ...data,
        lastUpdated: data.lastUpdated?.toDate(),
        nextReview: data.nextReview?.toDate(),
        createdAt: data.createdAt?.toDate(),
        updatedAt: data.updatedAt?.toDate()
      } as Protocol;
    }
    return null;
  }

  async createProtocol(protocol: Omit<Protocol, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const docRef = await addDoc(collection(db, 'protocols'), {
      ...protocol,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return docRef.id;
  }

  async updateProtocol(id: string, updates: Partial<Protocol>): Promise<void> {
    const docRef = doc(db, 'protocols', id);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: serverTimestamp()
    });
  }

  async deleteProtocol(id: string): Promise<void> {
    const docRef = doc(db, 'protocols', id);
    await deleteDoc(docRef);
  }

  // Management Review Management
  async getManagementReviews(): Promise<ManagementReview[]> {
    const q = query(
      collection(db, 'managementReviews'),
      where('companyId', '==', this.companyId),
      orderBy('date', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      date: doc.data().date?.toDate(),
      createdAt: doc.data().createdAt?.toDate(),
      updatedAt: doc.data().updatedAt?.toDate()
    })) as ManagementReview[];
  }

  async createManagementReview(review: Omit<ManagementReview, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const docRef = await addDoc(collection(db, 'managementReviews'), {
      ...review,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return docRef.id;
  }

  async updateManagementReview(id: string, updates: Partial<ManagementReview>): Promise<void> {
    const docRef = doc(db, 'managementReviews', id);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: serverTimestamp()
    });
  }

  // Compliance Management
  async getCompliance(): Promise<Compliance[]> {
    const q = query(
      collection(db, 'compliance'),
      where('companyId', '==', this.companyId),
      orderBy('nextCheck', 'asc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      lastCheck: doc.data().lastCheck?.toDate(),
      nextCheck: doc.data().nextCheck?.toDate(),
      createdAt: doc.data().createdAt?.toDate(),
      updatedAt: doc.data().updatedAt?.toDate()
    })) as Compliance[];
  }

  async createCompliance(compliance: Omit<Compliance, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const docRef = await addDoc(collection(db, 'compliance'), {
      ...compliance,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return docRef.id;
  }

  async updateCompliance(id: string, updates: Partial<Compliance>): Promise<void> {
    const docRef = doc(db, 'compliance', id);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: serverTimestamp()
    });
  }

  // JSA Management
  async getJSAs(): Promise<JSA[]> {
    const q = query(
      collection(db, 'jsa'),
      where('companyId', '==', this.companyId),
      orderBy('lastUpdated', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      lastUpdated: doc.data().lastUpdated?.toDate(),
      nextReview: doc.data().nextReview?.toDate(),
      createdAt: doc.data().createdAt?.toDate(),
      updatedAt: doc.data().updatedAt?.toDate()
    })) as JSA[];
  }

  async createJSA(jsa: Omit<JSA, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const docRef = await addDoc(collection(db, 'jsa'), {
      ...jsa,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return docRef.id;
  }

  async updateJSA(id: string, updates: Partial<JSA>): Promise<void> {
    const docRef = doc(db, 'jsa', id);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: serverTimestamp()
    });
  }

  // Equipment Management
  async getEquipment(): Promise<Equipment[]> {
    const q = query(
      collection(db, 'equipment'),
      where('companyId', '==', this.companyId),
      orderBy('nextInspection', 'asc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      lastInspection: doc.data().lastInspection?.toDate(),
      nextInspection: doc.data().nextInspection?.toDate(),
      createdAt: doc.data().createdAt?.toDate(),
      updatedAt: doc.data().updatedAt?.toDate()
    })) as Equipment[];
  }

  async createEquipment(equipment: Omit<Equipment, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const docRef = await addDoc(collection(db, 'equipment'), {
      ...equipment,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return docRef.id;
  }

  async updateEquipment(id: string, updates: Partial<Equipment>): Promise<void> {
    const docRef = doc(db, 'equipment', id);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: serverTimestamp()
    });
  }

  // Work Process Management
  async getWorkProcesses(): Promise<WorkProcess[]> {
    const q = query(
      collection(db, 'workProcesses'),
      where('companyId', '==', this.companyId),
      orderBy('lastUpdated', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      lastUpdated: doc.data().lastUpdated?.toDate(),
      nextReview: doc.data().nextReview?.toDate(),
      createdAt: doc.data().createdAt?.toDate(),
      updatedAt: doc.data().updatedAt?.toDate()
    })) as WorkProcess[];
  }

  async createWorkProcess(process: Omit<WorkProcess, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const docRef = await addDoc(collection(db, 'workProcesses'), {
      ...process,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return docRef.id;
  }

  async updateWorkProcess(id: string, updates: Partial<WorkProcess>): Promise<void> {
    const docRef = doc(db, 'workProcesses', id);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: serverTimestamp()
    });
  }

  // Organizational Chart Management
  async getOrgChart(): Promise<OrgChart[]> {
    const q = query(
      collection(db, 'orgChart'),
      where('companyId', '==', this.companyId),
      orderBy('name', 'asc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      startDate: doc.data().startDate?.toDate(),
      createdAt: doc.data().createdAt?.toDate(),
      updatedAt: doc.data().updatedAt?.toDate()
    })) as OrgChart[];
  }

  async createOrgChartEntry(entry: Omit<OrgChart, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const docRef = await addDoc(collection(db, 'orgChart'), {
      ...entry,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return docRef.id;
  }

  async updateOrgChartEntry(id: string, updates: Partial<OrgChart>): Promise<void> {
    const docRef = doc(db, 'orgChart', id);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: serverTimestamp()
    });
  }

  // Dashboard Statistics
  async getDashboardStats() {
    const [protocols, reviews, compliance, jsas, equipment, processes, orgChart] = await Promise.all([
      this.getProtocols(),
      this.getManagementReviews(),
      this.getCompliance(),
      this.getJSAs(),
      this.getEquipment(),
      this.getWorkProcesses(),
      this.getOrgChart()
    ]);

    return {
      protocols: {
        total: protocols.length,
        active: protocols.filter(p => p.status === 'active').length,
        draft: protocols.filter(p => p.status === 'draft').length,
        overdue: protocols.filter(p => p.nextReview < new Date()).length
      },
      reviews: {
        total: reviews.length,
        completed: reviews.filter(r => r.status === 'completed').length,
        scheduled: reviews.filter(r => r.status === 'scheduled').length,
        inProgress: reviews.filter(r => r.status === 'in-progress').length
      },
      compliance: {
        total: compliance.length,
        compliant: compliance.filter(c => c.status === 'compliant').length,
        nonCompliant: compliance.filter(c => c.status === 'non-compliant').length,
        dueSoon: compliance.filter(c => {
          const daysUntilCheck = Math.ceil((c.nextCheck.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
          return daysUntilCheck <= 30 && daysUntilCheck > 0;
        }).length
      },
      jsas: {
        total: jsas.length,
        active: jsas.filter(j => j.status === 'active').length,
        highRisk: jsas.filter(j => j.riskLevel === 'high' || j.riskLevel === 'critical').length,
        overdue: jsas.filter(j => j.nextReview < new Date()).length
      },
      equipment: {
        total: equipment.length,
        operational: equipment.filter(e => e.status === 'operational').length,
        maintenance: equipment.filter(e => e.status === 'maintenance').length,
        inspectionDue: equipment.filter(e => e.nextInspection < new Date()).length
      },
      processes: {
        total: processes.length,
        active: processes.filter(p => p.status === 'active').length,
        draft: processes.filter(p => p.status === 'draft').length,
        overdue: processes.filter(p => p.nextReview < new Date()).length
      },
      orgChart: {
        total: orgChart.length,
        active: orgChart.filter(o => o.status === 'active').length,
        vacant: orgChart.filter(o => o.status === 'vacant').length
      }
    };
  }

  // Recent Activity
  async getRecentActivity(limit: number = 10) {
    const activities: any[] = [];
    
    // Get recent protocols
    const protocols = await this.getProtocols();
    protocols.slice(0, 3).forEach(protocol => {
      activities.push({
        type: 'protocol',
        action: 'Oppdatert',
        item: protocol.name,
        time: protocol.updatedAt,
        user: protocol.createdBy,
        status: protocol.status
      });
    });

    // Get recent compliance checks
    const compliance = await this.getCompliance();
    compliance.slice(0, 3).forEach(item => {
      activities.push({
        type: 'compliance',
        action: 'Sjekket',
        item: item.regulation,
        time: item.updatedAt,
        user: item.createdBy,
        status: item.status
      });
    });

    // Get recent equipment inspections
    const equipment = await this.getEquipment();
    equipment.slice(0, 3).forEach(item => {
      activities.push({
        type: 'equipment',
        action: 'Inspektert',
        item: item.name,
        time: item.updatedAt,
        user: item.createdBy,
        status: item.status
      });
    });

    // Sort by time and return limited results
    return activities
      .sort((a, b) => b.time.getTime() - a.time.getTime())
      .slice(0, limit);
  }
}

// Export singleton instance
export const companyService = (companyId: string) => new CompanyService(companyId); 