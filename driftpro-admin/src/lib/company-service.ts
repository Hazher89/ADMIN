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
  writeBatch,
  onSnapshot,
  arrayUnion,
  arrayRemove
} from 'firebase/firestore';
import { db } from './firebase';

// SUPER AVANSERTE TYPER MED KOMPLEXE FUNKSJONER
export interface Protocol {
  id?: string;
  name: string;
  category: 'Sikkerhet' | 'Miljø' | 'Kvalitet' | 'HMS' | 'Prosess' | 'IT' | 'Finans' | 'HR' | 'Logistikk';
  status: 'draft' | 'review' | 'approved' | 'active' | 'inactive' | 'archived' | 'expired';
  version: string;
  versionHistory: VersionHistory[];
  description: string;
  content: string;
  responsiblePerson: string;
  department: string;
  lastUpdated: Date;
  nextReview: Date;
  attachments: Attachment[];
  tags: string[];
  companyId: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  approvalWorkflow: ApprovalWorkflow;
  riskAssessment: RiskAssessment;
  complianceRequirements: ComplianceRequirement[];
  trainingRequirements: TrainingRequirement[];
  auditTrail: AuditEntry[];
  metadata: {
    complexity: 'low' | 'medium' | 'high';
    priority: 'low' | 'medium' | 'high' | 'critical';
    impact: 'department' | 'company' | 'external';
    estimatedTime: number; // hours
    cost: number;
    stakeholders: string[];
  };
}

export interface ManagementReview {
  id?: string;
  title: string;
  type: 'quarterly' | 'annual' | 'special' | 'compliance' | 'risk' | 'performance';
  status: 'planned' | 'in_progress' | 'completed' | 'cancelled' | 'overdue';
  scheduledDate: Date;
  actualDate?: Date;
  participants: Participant[];
  agenda: AgendaItem[];
  decisions: Decision[];
  actionItems: ActionItem[];
  attachments: Attachment[];
  companyId: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  meetingMinutes: string;
  followUpDate?: Date;
  effectiveness: 'excellent' | 'good' | 'satisfactory' | 'needs_improvement';
  recommendations: string[];
  budget: number;
  costSavings?: number;
  riskMitigation: RiskMitigation[];
}

export interface Compliance {
  id?: string;
  title: string;
  type: 'regulatory' | 'internal' | 'industry' | 'certification' | 'contractual';
  status: 'compliant' | 'non_compliant' | 'at_risk' | 'under_review' | 'pending_audit';
  regulation: string;
  requirement: string;
  description: string;
  applicableTo: string[];
  lastAssessment: Date;
  nextAssessment: Date;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  impact: 'financial' | 'operational' | 'reputational' | 'legal';
  controls: Control[];
  evidence: Evidence[];
  findings: Finding[];
  correctiveActions: CorrectiveAction[];
  attachments: Attachment[];
  companyId: string;
  responsiblePerson: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  auditHistory: AuditHistory[];
  penalties: Penalty[];
  certifications: Certification[];
}

export interface JSA {
  id?: string;
  title: string;
  jobType: string;
  location: string;
  department: string;
  status: 'draft' | 'review' | 'approved' | 'active' | 'completed' | 'archived';
  version: string;
  hazards: Hazard[];
  controls: Control[];
  riskMatrix: RiskMatrix;
  participants: Participant[];
  equipment: string[];
  materials: string[];
  environmentalFactors: EnvironmentalFactor[];
  weatherConditions: WeatherCondition[];
  timeConstraints: TimeConstraint[];
  emergencyProcedures: EmergencyProcedure[];
  trainingRequirements: TrainingRequirement[];
  permits: Permit[];
  attachments: Attachment[];
  companyId: string;
  createdBy: string;
  approvedBy?: string;
  createdAt: Date;
  updatedAt: Date;
  lastReview: Date;
  nextReview: Date;
  effectiveness: 'excellent' | 'good' | 'satisfactory' | 'needs_improvement';
  incidents: Incident[];
  lessonsLearned: LessonLearned[];
}

export interface Equipment {
  id?: string;
  name: string;
  type: 'machinery' | 'vehicle' | 'tool' | 'safety' | 'it' | 'office' | 'specialized';
  category: string;
  model: string;
  serialNumber: string;
  manufacturer: string;
  status: 'operational' | 'maintenance' | 'repair' | 'out_of_service' | 'retired';
  location: string;
  department: string;
  responsiblePerson: string;
  purchaseDate: Date;
  warrantyExpiry: Date;
  lastMaintenance: Date;
  nextMaintenance: Date;
  maintenanceSchedule: MaintenanceSchedule;
  specifications: EquipmentSpecification;
  operatingInstructions: string;
  safetyInstructions: string;
  riskAssessment: RiskAssessment;
  certifications: Certification[];
  inspections: Inspection[];
  repairs: Repair[];
  costs: Cost[];
  attachments: Attachment[];
  companyId: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  utilization: Utilization;
  performance: Performance;
  lifecycle: Lifecycle;
}

export interface WorkProcess {
  id?: string;
  name: string;
  category: 'operational' | 'administrative' | 'quality' | 'safety' | 'maintenance' | 'logistics';
  status: 'draft' | 'active' | 'under_review' | 'archived' | 'obsolete';
  version: string;
  description: string;
  objectives: string[];
  scope: string;
  inputs: ProcessInput[];
  outputs: ProcessOutput[];
  steps: ProcessStep[];
  roles: ProcessRole[];
  resources: Resource[];
  metrics: Metric[];
  risks: Risk[];
  controls: Control[];
  improvements: Improvement[];
  attachments: Attachment[];
  companyId: string;
  owner: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  lastReview: Date;
  nextReview: Date;
  effectiveness: 'excellent' | 'good' | 'satisfactory' | 'needs_improvement';
  efficiency: number; // percentage
  costSavings: number;
  timeSavings: number;
  qualityImprovement: number;
  customerSatisfaction: number;
}

export interface OrgChart {
  id?: string;
  name: string;
  position: string;
  department: string;
  level: number;
  managerId?: string;
  subordinates: string[];
  responsibilities: string[];
  skills: Skill[];
  certifications: Certification[];
  performance: Performance;
  salary: number;
  startDate: Date;
  contactInfo: ContactInfo;
  emergencyContact: EmergencyContact;
  companyId: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  reportingStructure: ReportingStructure;
  successionPlan: SuccessionPlan;
  developmentPlan: DevelopmentPlan;
}

// AVANSERTE UNDERTYPER
export interface VersionHistory {
  version: string;
  date: Date;
  author: string;
  changes: string[];
  approvalStatus: 'pending' | 'approved' | 'rejected';
  comments: string;
}

export interface Attachment {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
  uploadedBy: string;
  uploadedAt: Date;
  description?: string;
}

export interface ApprovalWorkflow {
  steps: ApprovalStep[];
  currentStep: number;
  status: 'pending' | 'in_progress' | 'approved' | 'rejected';
  approvers: string[];
  deadline: Date;
  comments: Comment[];
}

export interface ApprovalStep {
  step: number;
  approver: string;
  role: string;
  status: 'pending' | 'approved' | 'rejected';
  date?: Date;
  comments: string;
}

export interface RiskAssessment {
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  probability: number;
  impact: number;
  riskScore: number;
  mitigation: string[];
  controls: string[];
  residualRisk: 'low' | 'medium' | 'high' | 'critical';
}

export interface ComplianceRequirement {
  regulation: string;
  requirement: string;
  status: 'compliant' | 'non_compliant' | 'at_risk';
  lastCheck: Date;
  nextCheck: Date;
  responsible: string;
}

export interface TrainingRequirement {
  training: string;
  frequency: string;
  lastCompleted?: Date;
  nextDue: Date;
  participants: string[];
  provider: string;
  cost: number;
}

export interface AuditEntry {
  date: Date;
  user: string;
  action: string;
  details: string;
  ipAddress: string;
}

export interface Participant {
  id: string;
  name: string;
  role: string;
  department: string;
  email: string;
  phone: string;
  attendance: 'confirmed' | 'pending' | 'declined';
}

export interface AgendaItem {
  id: string;
  title: string;
  description: string;
  duration: number;
  presenter: string;
  attachments: Attachment[];
  status: 'pending' | 'completed' | 'skipped';
}

export interface Decision {
  id: string;
  title: string;
  description: string;
  decision: string;
  rationale: string;
  impact: string;
  responsible: string;
  deadline: Date;
  status: 'pending' | 'in_progress' | 'completed';
}

export interface ActionItem {
  id: string;
  title: string;
  description: string;
  responsible: string;
  deadline: Date;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'pending' | 'in_progress' | 'completed' | 'overdue';
  progress: number;
  comments: Comment[];
}

export interface RiskMitigation {
  risk: string;
  mitigation: string;
  responsible: string;
  deadline: Date;
  status: 'pending' | 'in_progress' | 'completed';
  effectiveness: number;
}

export interface Control {
  id: string;
  name: string;
  type: 'preventive' | 'detective' | 'corrective';
  description: string;
  effectiveness: number;
  cost: number;
  responsible: string;
  lastReview: Date;
  nextReview: Date;
  status: 'active' | 'inactive' | 'under_review';
}

export interface Evidence {
  id: string;
  type: 'document' | 'photo' | 'video' | 'test' | 'inspection';
  description: string;
  date: Date;
  responsible: string;
  attachments: Attachment[];
  validity: Date;
}

export interface Finding {
  id: string;
  type: 'observation' | 'non_conformity' | 'opportunity';
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  impact: string;
  recommendations: string[];
  responsible: string;
  deadline: Date;
  status: 'open' | 'in_progress' | 'closed';
}

export interface CorrectiveAction {
  id: string;
  finding: string;
  action: string;
  responsible: string;
  deadline: Date;
  cost: number;
  status: 'pending' | 'in_progress' | 'completed' | 'verified';
  verification: string;
  effectiveness: number;
}

export interface AuditHistory {
  date: Date;
  auditor: string;
  type: 'internal' | 'external' | 'regulatory';
  findings: Finding[];
  status: 'passed' | 'failed' | 'conditional';
  followUp: string;
}

export interface Penalty {
  type: string;
  amount: number;
  date: Date;
  reason: string;
  status: 'pending' | 'paid' | 'appealed';
}

export interface Certification {
  name: string;
  issuer: string;
  issueDate: Date;
  expiryDate: Date;
  status: 'active' | 'expired' | 'suspended';
  renewalDate: Date;
  cost: number;
}

export interface Hazard {
  id: string;
  description: string;
  category: 'physical' | 'chemical' | 'biological' | 'ergonomic' | 'psychological';
  probability: number;
  severity: number;
  riskScore: number;
  controls: string[];
  responsible: string;
  status: 'identified' | 'controlled' | 'eliminated';
}

export interface RiskMatrix {
  probability: number;
  severity: number;
  riskScore: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  tolerance: 'acceptable' | 'unacceptable';
}

export interface EnvironmentalFactor {
  factor: string;
  impact: 'positive' | 'negative' | 'neutral';
  mitigation: string;
}

export interface WeatherCondition {
  condition: string;
  impact: string;
  precautions: string[];
}

export interface TimeConstraint {
  constraint: string;
  impact: string;
  mitigation: string;
}

export interface EmergencyProcedure {
  type: 'fire' | 'medical' | 'evacuation' | 'spill' | 'injury';
  procedure: string;
  contacts: string[];
  equipment: string[];
}

export interface Permit {
  type: string;
  issuer: string;
  issueDate: Date;
  expiryDate: Date;
  conditions: string[];
  status: 'active' | 'expired' | 'suspended';
}

export interface Incident {
  date: Date;
  type: string;
  description: string;
  severity: 'minor' | 'moderate' | 'major' | 'critical';
  investigation: string;
  lessons: string[];
}

export interface LessonLearned {
  date: Date;
  lesson: string;
  category: string;
  impact: string;
  recommendations: string[];
}

export interface MaintenanceSchedule {
  frequency: string;
  lastMaintenance: Date;
  nextMaintenance: Date;
  checklist: MaintenanceItem[];
  responsible: string;
  cost: number;
}

export interface MaintenanceItem {
  item: string;
  frequency: string;
  lastDone?: Date;
  nextDue: Date;
  status: 'pending' | 'completed' | 'overdue';
}

export interface EquipmentSpecification {
  capacity: string;
  power: string;
  dimensions: string;
  weight: string;
  operatingConditions: string;
  safetyFeatures: string[];
}

export interface Inspection {
  date: Date;
  inspector: string;
  type: string;
  findings: string[];
  status: 'passed' | 'failed' | 'conditional';
  recommendations: string[];
}

export interface Repair {
  date: Date;
  type: string;
  description: string;
  cost: number;
  technician: string;
  warranty: boolean;
  status: 'pending' | 'in_progress' | 'completed';
}

export interface Cost {
  type: 'purchase' | 'maintenance' | 'repair' | 'operation';
  amount: number;
  date: Date;
  description: string;
  approvedBy: string;
}

export interface Utilization {
  hoursPerDay: number;
  daysPerWeek: number;
  efficiency: number;
  downtime: number;
  productivity: number;
}

export interface Performance {
  uptime: number;
  efficiency: number;
  quality: number;
  safety: number;
  costPerHour: number;
}

export interface Lifecycle {
  phase: 'planning' | 'acquisition' | 'operation' | 'maintenance' | 'disposal';
  startDate: Date;
  endDate?: Date;
  totalCost: number;
  roi: number;
}

export interface ProcessInput {
  name: string;
  type: string;
  source: string;
  quality: string;
  quantity: string;
}

export interface ProcessOutput {
  name: string;
  type: string;
  destination: string;
  quality: string;
  quantity: string;
}

export interface ProcessStep {
  step: number;
  name: string;
  description: string;
  responsible: string;
  duration: number;
  inputs: string[];
  outputs: string[];
  risks: string[];
  controls: string[];
}

export interface ProcessRole {
  role: string;
  responsibilities: string[];
  skills: string[];
  training: string[];
  authority: string[];
}

export interface Resource {
  type: 'human' | 'equipment' | 'material' | 'financial';
  name: string;
  quantity: number;
  cost: number;
  availability: string;
}

export interface Metric {
  name: string;
  type: 'input' | 'output' | 'process' | 'outcome';
  unit: string;
  target: number;
  actual: number;
  frequency: string;
}

export interface Risk {
  description: string;
  probability: number;
  impact: number;
  riskScore: number;
  mitigation: string[];
  responsible: string;
}

export interface Improvement {
  description: string;
  type: 'efficiency' | 'quality' | 'safety' | 'cost';
  expectedBenefit: string;
  implementation: string;
  responsible: string;
  deadline: Date;
  status: 'proposed' | 'approved' | 'in_progress' | 'completed';
}

export interface Skill {
  name: string;
  level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  certification?: string;
  lastAssessed: Date;
  nextAssessment: Date;
}

export interface Performance {
  rating: number;
  goals: Goal[];
  achievements: Achievement[];
  feedback: Feedback[];
  development: Development[];
}

export interface Goal {
  title: string;
  description: string;
  target: number;
  actual: number;
  deadline: Date;
  status: 'pending' | 'in_progress' | 'completed' | 'overdue';
}

export interface Achievement {
  title: string;
  description: string;
  date: Date;
  impact: string;
  recognition: string;
}

export interface Feedback {
  date: Date;
  from: string;
  type: 'positive' | 'constructive' | 'negative';
  content: string;
  action: string;
}

export interface Development {
  area: string;
  plan: string;
  resources: string[];
  timeline: string;
  progress: number;
}

export interface ContactInfo {
  email: string;
  phone: string;
  mobile: string;
  address: string;
  emergencyContact: string;
}

export interface EmergencyContact {
  name: string;
  relationship: string;
  phone: string;
  email: string;
  address: string;
}

export interface ReportingStructure {
  manager: string;
  subordinates: string[];
  matrix: string[];
  dottedLine: string[];
}

export interface SuccessionPlan {
  position: string;
  candidates: Candidate[];
  timeline: string;
  development: string[];
  risk: 'low' | 'medium' | 'high';
}

export interface Candidate {
  name: string;
  readiness: 'ready' | 'developing' | 'not_ready';
  strengths: string[];
  development: string[];
  timeline: string;
}

export interface DevelopmentPlan {
  goals: string[];
  activities: string[];
  timeline: string;
  resources: string[];
  progress: number;
  mentor: string;
}

export interface Comment {
  id: string;
  author: string;
  content: string;
  date: Date;
  attachments: Attachment[];
}

// SUPER AVANSERT COMPANY SERVICE
export class CompanyService {
  private companyId: string;

  constructor(companyId: string) {
    this.companyId = companyId;
  }

  // PROTOCOL MANAGEMENT - SUPER AVANSERT
  async getProtocols(): Promise<Protocol[]> {
    if (!db) return [];
    
    try {
      const protocolsQuery = query(
        collection(db, 'protocols'),
        where('companyId', '==', this.companyId),
        orderBy('updatedAt', 'desc')
      );
      
      const snapshot = await getDocs(protocolsQuery);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate(),
        lastUpdated: doc.data().lastUpdated?.toDate(),
        nextReview: doc.data().nextReview?.toDate()
      })) as Protocol[];
    } catch (error) {
      console.error('Error getting protocols:', error);
      return [];
    }
  }

  async getProtocol(id: string): Promise<Protocol | null> {
    if (!db) return null;
    
    try {
      const docRef = doc(db, 'protocols', id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          ...data,
          createdAt: data.createdAt?.toDate(),
          updatedAt: data.updatedAt?.toDate(),
          lastUpdated: data.lastUpdated?.toDate(),
          nextReview: data.nextReview?.toDate()
        } as Protocol;
      }
      return null;
    } catch (error) {
      console.error('Error getting protocol:', error);
      return null;
    }
  }

  async createProtocol(protocol: Omit<Protocol, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    if (!db) throw new Error('Firebase not initialized');

    try {
      const docRef = await addDoc(collection(db, 'protocols'), {
        ...protocol,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      // Create audit trail
      await this.createAuditEntry('protocol_created', {
        protocolId: docRef.id,
        protocolName: protocol.name,
        category: protocol.category
      });

      return docRef.id;
    } catch (error) {
      console.error('Error creating protocol:', error);
      throw error;
    }
  }

  async updateProtocol(id: string, updates: Partial<Protocol>): Promise<void> {
    if (!db) throw new Error('Firebase not initialized');

    try {
      await updateDoc(doc(db, 'protocols', id), {
        ...updates,
        updatedAt: serverTimestamp()
      });

      // Create audit trail
      await this.createAuditEntry('protocol_updated', {
        protocolId: id,
        changes: Object.keys(updates)
      });
    } catch (error) {
      console.error('Error updating protocol:', error);
      throw error;
    }
  }

  async deleteProtocol(id: string): Promise<void> {
    if (!db) throw new Error('Firebase not initialized');

    try {
      await deleteDoc(doc(db, 'protocols', id));

      // Create audit trail
      await this.createAuditEntry('protocol_deleted', {
        protocolId: id
      });
    } catch (error) {
      console.error('Error deleting protocol:', error);
      throw error;
    }
  }

  // MANAGEMENT REVIEW MANAGEMENT - SUPER AVANSERT
  async getManagementReviews(): Promise<ManagementReview[]> {
    if (!db) return [];
    
    try {
      const reviewsQuery = query(
        collection(db, 'managementReviews'),
        where('companyId', '==', this.companyId),
        orderBy('scheduledDate', 'desc')
      );
      
      const snapshot = await getDocs(reviewsQuery);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate(),
        scheduledDate: doc.data().scheduledDate?.toDate(),
        actualDate: doc.data().actualDate?.toDate(),
        followUpDate: doc.data().followUpDate?.toDate()
      })) as ManagementReview[];
    } catch (error) {
      console.error('Error getting management reviews:', error);
      return [];
    }
  }

  async createManagementReview(review: Omit<ManagementReview, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    if (!db) throw new Error('Firebase not initialized');

    try {
      const docRef = await addDoc(collection(db, 'managementReviews'), {
        ...review,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      await this.createAuditEntry('management_review_created', {
        reviewId: docRef.id,
        title: review.title,
        type: review.type
      });

      return docRef.id;
    } catch (error) {
      console.error('Error creating management review:', error);
      throw error;
    }
  }

  // COMPLIANCE MANAGEMENT - SUPER AVANSERT
  async getCompliance(): Promise<Compliance[]> {
    if (!db) return [];
    
    try {
      const complianceQuery = query(
        collection(db, 'compliance'),
        where('companyId', '==', this.companyId),
        orderBy('nextAssessment', 'asc')
      );
      
      const snapshot = await getDocs(complianceQuery);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate(),
        lastAssessment: doc.data().lastAssessment?.toDate(),
        nextAssessment: doc.data().nextAssessment?.toDate()
      })) as Compliance[];
    } catch (error) {
      console.error('Error getting compliance:', error);
      return [];
    }
  }

  async createCompliance(compliance: Omit<Compliance, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    if (!db) throw new Error('Firebase not initialized');

    try {
      const docRef = await addDoc(collection(db, 'compliance'), {
        ...compliance,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      await this.createAuditEntry('compliance_created', {
        complianceId: docRef.id,
        title: compliance.title,
        type: compliance.type
      });

      return docRef.id;
    } catch (error) {
      console.error('Error creating compliance:', error);
      throw error;
    }
  }

  // JSA MANAGEMENT - SUPER AVANSERT
  async getJSAs(): Promise<JSA[]> {
    if (!db) return [];
    
    try {
      const jsaQuery = query(
        collection(db, 'jsa'),
        where('companyId', '==', this.companyId),
        orderBy('updatedAt', 'desc')
      );
      
      const snapshot = await getDocs(jsaQuery);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate(),
        lastReview: doc.data().lastReview?.toDate(),
        nextReview: doc.data().nextReview?.toDate()
      })) as JSA[];
    } catch (error) {
      console.error('Error getting JSAs:', error);
      return [];
    }
  }

  async createJSA(jsa: Omit<JSA, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    if (!db) throw new Error('Firebase not initialized');

    try {
      const docRef = await addDoc(collection(db, 'jsa'), {
        ...jsa,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      await this.createAuditEntry('jsa_created', {
        jsaId: docRef.id,
        title: jsa.title,
        jobType: jsa.jobType
      });

      return docRef.id;
    } catch (error) {
      console.error('Error creating JSA:', error);
      throw error;
    }
  }

  // EQUIPMENT MANAGEMENT - SUPER AVANSERT
  async getEquipment(): Promise<Equipment[]> {
    if (!db) return [];
    
    try {
      const equipmentQuery = query(
        collection(db, 'equipment'),
        where('companyId', '==', this.companyId),
        orderBy('updatedAt', 'desc')
      );
      
      const snapshot = await getDocs(equipmentQuery);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate(),
        purchaseDate: doc.data().purchaseDate?.toDate(),
        warrantyExpiry: doc.data().warrantyExpiry?.toDate(),
        lastMaintenance: doc.data().lastMaintenance?.toDate(),
        nextMaintenance: doc.data().nextMaintenance?.toDate()
      })) as Equipment[];
    } catch (error) {
      console.error('Error getting equipment:', error);
      return [];
    }
  }

  async createEquipment(equipment: Omit<Equipment, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    if (!db) throw new Error('Firebase not initialized');

    try {
      const docRef = await addDoc(collection(db, 'equipment'), {
        ...equipment,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      await this.createAuditEntry('equipment_created', {
        equipmentId: docRef.id,
        name: equipment.name,
        type: equipment.type
      });

      return docRef.id;
    } catch (error) {
      console.error('Error creating equipment:', error);
      throw error;
    }
  }

  // WORK PROCESS MANAGEMENT - SUPER AVANSERT
  async getWorkProcesses(): Promise<WorkProcess[]> {
    if (!db) return [];
    
    try {
      const processesQuery = query(
        collection(db, 'workProcesses'),
        where('companyId', '==', this.companyId),
        orderBy('updatedAt', 'desc')
      );
      
      const snapshot = await getDocs(processesQuery);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate(),
        lastReview: doc.data().lastReview?.toDate(),
        nextReview: doc.data().nextReview?.toDate()
      })) as WorkProcess[];
    } catch (error) {
      console.error('Error getting work processes:', error);
      return [];
    }
  }

  async createWorkProcess(process: Omit<WorkProcess, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    if (!db) throw new Error('Firebase not initialized');

    try {
      const docRef = await addDoc(collection(db, 'workProcesses'), {
        ...process,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      await this.createAuditEntry('work_process_created', {
        processId: docRef.id,
        name: process.name,
        category: process.category
      });

      return docRef.id;
    } catch (error) {
      console.error('Error creating work process:', error);
      throw error;
    }
  }

  // ORGANIZATIONAL CHART MANAGEMENT - SUPER AVANSERT
  async getOrgChart(): Promise<OrgChart[]> {
    if (!db) return [];
    
    try {
      const orgChartQuery = query(
        collection(db, 'orgChart'),
        where('companyId', '==', this.companyId),
        orderBy('level', 'asc')
      );
      
      const snapshot = await getDocs(orgChartQuery);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate(),
        startDate: doc.data().startDate?.toDate()
      })) as OrgChart[];
    } catch (error) {
      console.error('Error getting org chart:', error);
      return [];
    }
  }

  async createOrgChartEntry(entry: Omit<OrgChart, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    if (!db) throw new Error('Firebase not initialized');

    try {
      const docRef = await addDoc(collection(db, 'orgChart'), {
        ...entry,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      await this.createAuditEntry('org_chart_entry_created', {
        entryId: docRef.id,
        name: entry.name,
        position: entry.position
      });

      return docRef.id;
    } catch (error) {
      console.error('Error creating org chart entry:', error);
      throw error;
    }
  }

  // SUPER AVANSERTE DASHBOARD FUNKSJONER
  async getDashboardStats() {
    try {
      const [protocols, reviews, compliance, jsa, equipment, processes, orgChart] = await Promise.all([
        this.getProtocols(),
        this.getManagementReviews(),
        this.getCompliance(),
        this.getJSAs(),
        this.getEquipment(),
        this.getWorkProcesses(),
        this.getOrgChart()
      ]);

      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      return {
        protocols: {
          total: protocols.length,
          active: protocols.filter(p => p.status === 'active').length,
          pending: protocols.filter(p => p.status === 'review').length,
          overdue: protocols.filter(p => p.nextReview < now).length,
          recent: protocols.filter(p => p.createdAt > thirtyDaysAgo).length
        },
        reviews: {
          total: reviews.length,
          completed: reviews.filter(r => r.status === 'completed').length,
          upcoming: reviews.filter(r => r.scheduledDate > now && r.status === 'planned').length,
          overdue: reviews.filter(r => r.scheduledDate < now && r.status === 'planned').length
        },
        compliance: {
          total: compliance.length,
          compliant: compliance.filter(c => c.status === 'compliant').length,
          atRisk: compliance.filter(c => c.status === 'at_risk').length,
          nonCompliant: compliance.filter(c => c.status === 'non_compliant').length,
          upcoming: compliance.filter(c => c.nextAssessment > now && c.nextAssessment < new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)).length
        },
        jsa: {
          total: jsa.length,
          active: jsa.filter(j => j.status === 'active').length,
          approved: jsa.filter(j => j.status === 'approved').length,
          pending: jsa.filter(j => j.status === 'review').length,
          overdue: jsa.filter(j => j.nextReview < now).length
        },
        equipment: {
          total: equipment.length,
          operational: equipment.filter(e => e.status === 'operational').length,
          maintenance: equipment.filter(e => e.status === 'maintenance').length,
          repair: equipment.filter(e => e.status === 'repair').length,
          upcoming: equipment.filter(e => e.nextMaintenance > now && e.nextMaintenance < new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)).length
        },
        processes: {
          total: processes.length,
          active: processes.filter(p => p.status === 'active').length,
          underReview: processes.filter(p => p.status === 'under_review').length,
          effective: processes.filter(p => p.effectiveness === 'excellent' || p.effectiveness === 'good').length
        },
        orgChart: {
          total: orgChart.length,
          levels: Math.max(...orgChart.map(o => o.level)),
          departments: [...new Set(orgChart.map(o => o.department))].length
        }
      };
    } catch (error) {
      console.error('Error getting dashboard stats:', error);
      return null;
    }
  }

  async getRecentActivity(limitCount: number = 10) {
    if (!db) return [];
    
    try {
      const activityQuery = query(
        collection(db, 'auditTrail'),
        where('companyId', '==', this.companyId),
        orderBy('timestamp', 'desc'),
        limit(limitCount)
      );
      
      const snapshot = await getDocs(activityQuery);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate()
      }));
    } catch (error) {
      console.error('Error getting recent activity:', error);
      return [];
    }
  }

  // SUPER AVANSERTE HJELEPEFUNKSJONER
  private async createAuditEntry(action: string, details: any) {
    if (!db) return;
    
    try {
      await addDoc(collection(db, 'auditTrail'), {
        action,
        details,
        companyId: this.companyId,
        timestamp: serverTimestamp(),
        userId: 'system' // This should be the actual user ID
      });
    } catch (error) {
      console.error('Error creating audit entry:', error);
    }
  }

  // SUPER AVANSERTE ANALYTICS FUNKSJONER
  async getAnalytics() {
    try {
      const [protocols, reviews, compliance, jsa, equipment, processes] = await Promise.all([
        this.getProtocols(),
        this.getManagementReviews(),
        this.getCompliance(),
        this.getJSAs(),
        this.getEquipment(),
        this.getWorkProcesses()
      ]);

      return {
        trends: {
          protocolsCreated: this.getMonthlyTrend(protocols, 'createdAt'),
          reviewsCompleted: this.getMonthlyTrend(reviews.filter(r => r.status === 'completed'), 'actualDate'),
          complianceStatus: this.getComplianceTrend(compliance),
          equipmentUtilization: this.getEquipmentUtilization(equipment),
          processEfficiency: this.getProcessEfficiency(processes)
        },
        insights: {
          topRisks: this.getTopRisks(protocols, compliance, jsa),
          improvementAreas: this.getImprovementAreas(processes, equipment),
          costSavings: this.getCostSavings(reviews, processes),
          complianceGaps: this.getComplianceGaps(compliance)
        }
      };
    } catch (error) {
      console.error('Error getting analytics:', error);
      return null;
    }
  }

  private getMonthlyTrend(data: any[], dateField: string) {
    const months = Array.from({ length: 12 }, (_, i) => {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      return date.toISOString().slice(0, 7);
    }).reverse();

    return months.map(month => ({
      month,
      count: data.filter(item => {
        const itemDate = item[dateField];
        return itemDate && itemDate.toISOString().slice(0, 7) === month;
      }).length
    }));
  }

  private getComplianceTrend(compliance: Compliance[]) {
    const now = new Date();
    const statuses = ['compliant', 'at_risk', 'non_compliant'];
    
    return statuses.map(status => ({
      status,
      count: compliance.filter(c => c.status === status).length,
      percentage: (compliance.filter(c => c.status === status).length / compliance.length) * 100
    }));
  }

  private getEquipmentUtilization(equipment: Equipment[]) {
    return equipment.map(eq => ({
      name: eq.name,
      utilization: eq.utilization?.efficiency || 0,
      uptime: eq.performance?.uptime || 0,
      costPerHour: eq.performance?.costPerHour || 0
    }));
  }

  private getProcessEfficiency(processes: WorkProcess[]) {
    return processes.map(proc => ({
      name: proc.name,
      efficiency: proc.efficiency || 0,
      costSavings: proc.costSavings || 0,
      timeSavings: proc.timeSavings || 0
    }));
  }

  private getTopRisks(protocols: Protocol[], compliance: Compliance[], jsa: JSA[]) {
    const allRisks = [
      ...protocols.map(p => ({ source: 'protocol', name: p.name, risk: p.riskAssessment?.riskLevel || 'low' })),
      ...compliance.map(c => ({ source: 'compliance', name: c.title, risk: c.riskLevel })),
      ...jsa.map(j => ({ source: 'jsa', name: j.title, risk: j.riskMatrix?.riskLevel || 'low' }))
    ];

    return allRisks
      .filter(r => r.risk === 'high' || r.risk === 'critical')
      .slice(0, 10);
  }

  private getImprovementAreas(processes: WorkProcess[], equipment: Equipment[]) {
    const areas: Array<{
      type: string;
      name: string;
      priority: string;
      potential: number;
    }> = [];
    
    // Process improvements
    processes.forEach(proc => {
      if (proc.effectiveness === 'needs_improvement') {
        areas.push({
          type: 'process',
          name: proc.name,
          priority: 'high',
          potential: proc.costSavings + proc.timeSavings
        });
      }
    });

    // Equipment improvements
    equipment.forEach(eq => {
      if (eq.performance?.efficiency < 80) {
        areas.push({
          type: 'equipment',
          name: eq.name,
          priority: 'medium',
          potential: eq.performance?.costPerHour * 1000
        });
      }
    });

    return areas.sort((a, b) => b.potential - a.potential).slice(0, 10);
  }

  private getCostSavings(reviews: ManagementReview[], processes: WorkProcess[]) {
    const reviewSavings = reviews
      .filter(r => r.costSavings)
      .reduce((sum, r) => sum + (r.costSavings || 0), 0);
    
    const processSavings = processes
      .filter(p => p.costSavings)
      .reduce((sum, p) => sum + (p.costSavings || 0), 0);

    return {
      total: reviewSavings + processSavings,
      reviews: reviewSavings,
      processes: processSavings
    };
  }

  private getComplianceGaps(compliance: Compliance[]) {
    const now = new Date();
    return compliance
      .filter(c => c.status === 'non_compliant' || c.status === 'at_risk')
      .map(c => ({
        title: c.title,
        type: c.type,
        riskLevel: c.riskLevel,
        impact: c.impact,
        nextAssessment: c.nextAssessment,
        daysUntilAssessment: Math.ceil((c.nextAssessment.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      }))
      .sort((a, b) => a.daysUntilAssessment - b.daysUntilAssessment);
  }
}

// Export singleton instance
export const companyService = (companyId: string) => new CompanyService(companyId); 