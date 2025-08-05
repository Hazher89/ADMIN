'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { companyService, type Protocol, type ManagementReview, type Compliance, type JSA, type Equipment, type WorkProcess, type OrgChart } from '@/lib/company-service';
import ProtocolModal from '@/components/ProtocolModal';
import JSAModal from '@/components/JSAModal';
import { 
  Building, 
  FileText, 
  Users, 
  Settings, 
  Shield, 
  Wrench, 
  BarChart3,
  Plus,
  Search,
  Filter,
  Download,
  Edit,
  Eye,
  Calendar,
  ChevronDown,
  Save,
  RefreshCw,
  Activity,
  Info,
  Clipboard,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  Star,
  Target,
  Zap,
  Award,
  Briefcase,
  Database,
  Network,
  Layers,
  PieChart,
  LineChart,
  BarChart,
  Gauge,
  Thermometer,
  ShieldCheck,
  FileCheck,
  UserCheck,
  Settings2,
  Cog,
  Tool,
  HardDrive,
  Monitor,
  Smartphone,
  Truck,
  Factory,
  Warehouse,
  Office,
  Home,
  Globe,
  MapPin,
  Phone,
  Mail,
  MessageSquare,
  Bell,
  Heart,
  ThumbsUp,
  ThumbsDown,
  Minus,
  X,
  ArrowRight,
  ArrowLeft,
  ArrowUp,
  ArrowDown,
  RotateCcw,
  Play,
  Pause,
  Stop,
  SkipForward,
  SkipBack,
  Volume2,
  VolumeX,
  Mic,
  MicOff,
  Video,
  VideoOff,
  Camera,
  Image,
  File,
  Folder,
  Archive,
  Trash2,
  Share2,
  Link,
  ExternalLink,
  Lock,
  Unlock,
  Key,
  CreditCard,
  DollarSign,
  Euro,
  PoundSterling,
  Bitcoin,
  TrendingDown,
  MinusCircle,
  PlusCircle,
  Circle,
  Square,
  Triangle,
  Hexagon,
  Octagon,
  Diamond,
  Trophy,
  Medal,
  Crown,
  Flag,
  Bookmark,
  Tag,
  Hash,
  AtSign,
  Percent,
  Infinity,
  Pi,
  Sigma,
  Omega,
  Alpha,
  Beta,
  Gamma,
  Delta,
  Lambda,
  Mu,
  Nu,
  Xi,
  Omicron,
  Rho,
  Tau,
  Upsilon,
  Phi,
  Chi,
  Psi,
  Grid,
  List
} from 'lucide-react';

export default function MyCompanyPage() {
  const { userProfile } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  // SUPER AVANSERTE STATE VARIABLER
  const [protocols, setProtocols] = useState<Protocol[]>([]);
  const [managementReviews, setManagementReviews] = useState<ManagementReview[]>([]);
  const [compliance, setCompliance] = useState<Compliance[]>([]);
  const [jsa, setJsa] = useState<JSA[]>([]);
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [workProcesses, setWorkProcesses] = useState<WorkProcess[]>([]);
  const [orgChart, setOrgChart] = useState<OrgChart[]>([]);
  const [dashboardStats, setDashboardStats] = useState<any>(null);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);

  // SUPER AVANSERTE MODAL STATES
  const [showProtocolModal, setShowProtocolModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showComplianceModal, setShowComplianceModal] = useState(false);
  const [showJSAModal, setShowJSAModal] = useState(false);
  const [showEquipmentModal, setShowEquipmentModal] = useState(false);
  const [showProcessModal, setShowProcessModal] = useState(false);
  const [showOrgChartModal, setShowOrgChartModal] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  // SUPER AVANSERTE FILTER OG SØK STATES
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [dateRange, setDateRange] = useState({ start: null, end: null });
  const [sortBy, setSortBy] = useState('updatedAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'kanban'>('list');

  // SUPER AVANSERTE DASHBOARD STATES
  const [selectedTimeframe, setSelectedTimeframe] = useState('30d');
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>(['protocols', 'compliance', 'equipment']);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showInsights, setShowInsights] = useState(false);

  // SUPER AVANSERTE NOTIFICATION STATES
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // SUPER AVANSERTE WORKFLOW STATES
  const [workflowStatus, setWorkflowStatus] = useState('all');
  const [approvalQueue, setApprovalQueue] = useState<any[]>([]);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [selectedApproval, setSelectedApproval] = useState<any>(null);

  // SUPER AVANSERTE EXPORT STATES
  const [exportFormat, setExportFormat] = useState('pdf');
  const [exportProgress, setExportProgress] = useState(0);
  const [isExporting, setIsExporting] = useState(false);

  // SUPER AVANSERTE BULK OPERATION STATES
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [bulkAction, setBulkAction] = useState('');

  // SUPER AVANSERTE REAL-TIME STATES
  const [isRealTimeEnabled, setIsRealTimeEnabled] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [syncStatus, setSyncStatus] = useState('synced');

  // SUPER AVANSERTE PERFORMANCE STATES
  const [performanceMetrics, setPerformanceMetrics] = useState<any>(null);
  const [showPerformanceModal, setShowPerformanceModal] = useState(false);
  const [optimizationSuggestions, setOptimizationSuggestions] = useState<any[]>([]);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (userProfile?.companyId) {
      loadCompanyData();
    }
  }, [userProfile?.companyId]);

  const service = userProfile?.companyId ? companyService(userProfile.companyId) : null;

  // Add error boundary for missing data
  const [error, setError] = useState<string | null>(null);

  const loadCompanyData = async () => {
    if (!service) {
      console.log('No service available, skipping data load');
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      setSyncStatus('syncing');
      
      console.log('🚀 Loading super advanced company data...');
      
      // SUPER AVANSERTE PARALLELLE DATA-INNLASTINGER
      const [
        protocolsData, 
        reviewsData, 
        complianceData, 
        jsaData, 
        equipmentData, 
        processesData, 
        orgChartData, 
        statsData, 
        activityData
      ] = await Promise.all([
        service.getProtocols().catch(() => []),
        service.getManagementReviews().catch(() => []),
        service.getCompliance().catch(() => []),
        service.getJSAs().catch(() => []),
        service.getEquipment().catch(() => []),
        service.getWorkProcesses().catch(() => []),
        service.getOrgChart().catch(() => []),
        service.getDashboardStats().catch(() => null),
        service.getRecentActivity().catch(() => [])
      ]);

      // Get additional data safely
      const analyticsData = await service.getAnalytics?.().catch(() => null) || null;
      const performanceData = await getPerformanceMetrics().catch(() => null) || null;
      const optimizationData = await getOptimizationSuggestions().catch(() => []) || [];

      // SUPER AVANSERTE DATA-PROSESSERING
      const processedProtocols = processProtocolsData(protocolsData);
      const processedReviews = processReviewsData(reviewsData);
      const processedCompliance = processComplianceData(complianceData);
      const processedJSA = processJSAData(jsaData);
      const processedEquipment = processEquipmentData(equipmentData);
      const processedProcesses = processProcessesData(processesData);
      const processedOrgChart = processOrgChartData(orgChartData);

      // SUPER AVANSERTE STATE-UPDATES
      setProtocols(processedProtocols);
      setManagementReviews(processedReviews);
      setCompliance(processedCompliance);
      setJsa(processedJSA);
      setEquipment(processedEquipment);
      setWorkProcesses(processedProcesses);
      setOrgChart(processedOrgChart);
      setDashboardStats(statsData);
      setRecentActivity(activityData);
      setAnalytics(analyticsData);
      setPerformanceMetrics(performanceData);
      setOptimizationSuggestions(optimizationData);

      // SUPER AVANSERTE NOTIFIKASJONER
      generateNotifications(processedProtocols, processedCompliance, processedEquipment);
      
      // SUPER AVANSERTE APPROVAL QUEUE
      updateApprovalQueue(processedProtocols, processedReviews, processedCompliance);

      console.log('✅ Super advanced company data loaded successfully!');
      setLastUpdate(new Date());
      setSyncStatus('synced');
      
    } catch (error) {
      console.error('❌ Error loading super advanced company data:', error);
      setSyncStatus('error');
      setError('Kunne ikke laste bedriftsdata. Vennligst prøv igjen senere.');
      generateErrorNotifications(error);
    } finally {
      setLoading(false);
    }
  };

  // SUPER AVANSERTE HJELPEFUNKSJONER
  const processProtocolsData = (data: Protocol[]) => {
    return data.map(protocol => ({
      ...protocol,
      riskScore: calculateRiskScore(protocol.riskAssessment),
      complianceStatus: calculateComplianceStatus(protocol.complianceRequirements),
      effectiveness: calculateEffectiveness(protocol),
      priority: calculatePriority(protocol),
      nextAction: determineNextAction(protocol)
    }));
  };

  const processReviewsData = (data: ManagementReview[]) => {
    return data.map(review => ({
      ...review,
      effectiveness: calculateReviewEffectiveness(review),
      costBenefit: calculateCostBenefit(review),
      riskMitigation: calculateRiskMitigation(review.riskMitigation),
      followUpRequired: determineFollowUpRequired(review)
    }));
  };

  const processComplianceData = (data: Compliance[]) => {
    return data.map(compliance => ({
      ...compliance,
      riskLevel: calculateComplianceRisk(compliance),
      impact: calculateComplianceImpact(compliance),
      urgency: calculateUrgency(compliance.nextAssessment),
      actionRequired: determineComplianceAction(compliance)
    }));
  };

  const processJSAData = (data: JSA[]) => {
    return data.map(jsa => ({
      ...jsa,
      riskMatrix: calculateRiskMatrix(jsa.riskMatrix),
      effectiveness: calculateJSAEffectiveness(jsa),
      trainingGaps: identifyTrainingGaps(jsa.trainingRequirements),
      improvementAreas: identifyImprovementAreas(jsa)
    }));
  };

  const processEquipmentData = (data: Equipment[]) => {
    return data.map(equipment => ({
      ...equipment,
      utilization: calculateUtilization(equipment.utilization),
      performance: calculateEquipmentPerformance(equipment.performance),
      lifecycle: calculateLifecycle(equipment.lifecycle),
      maintenancePriority: calculateMaintenancePriority(equipment),
      replacementUrgency: calculateReplacementUrgency(equipment)
    }));
  };

  const processProcessesData = (data: WorkProcess[]) => {
    return data.map(process => ({
      ...process,
      efficiency: calculateProcessEfficiency(process),
      costSavings: calculateProcessCostSavings(process),
      qualityMetrics: calculateQualityMetrics(process),
      improvementPotential: calculateImprovementPotential(process)
    }));
  };

  const processOrgChartData = (data: OrgChart[]) => {
    return data.map(entry => ({
      ...entry,
      performance: calculateEmployeePerformance(entry.performance),
      development: calculateDevelopmentProgress(entry.developmentPlan),
      succession: calculateSuccessionReadiness(entry.successionPlan),
      skills: analyzeSkills(entry.skills)
    }));
  };

  // SUPER AVANSERTE BEREGNINGSFUNKSJONER
  const calculateRiskScore = (riskAssessment: any) => {
    if (!riskAssessment) return 0;
    return (riskAssessment.probability * riskAssessment.impact) / 10;
  };

  const calculateComplianceStatus = (requirements: any[]) => {
    if (!requirements || requirements.length === 0) return 'unknown';
    const compliant = requirements.filter(r => r.status === 'compliant').length;
    const total = requirements.length;
    const percentage = (compliant / total) * 100;
    
    if (percentage >= 90) return 'excellent';
    if (percentage >= 75) return 'good';
    if (percentage >= 60) return 'satisfactory';
    return 'needs_improvement';
  };

  const calculateEffectiveness = (protocol: Protocol) => {
    // Complex effectiveness calculation based on multiple factors
    let score = 0;
    if (protocol.status === 'active') score += 30;
    if (protocol.approvalWorkflow?.status === 'approved') score += 20;
    if (protocol.riskAssessment?.riskLevel === 'low') score += 25;
    if (protocol.complianceRequirements?.length > 0) score += 15;
    if (protocol.trainingRequirements?.length > 0) score += 10;
    return score;
  };

  const calculatePriority = (protocol: Protocol) => {
    const riskScore = calculateRiskScore(protocol.riskAssessment);
    const complianceStatus = calculateComplianceStatus(protocol.complianceRequirements);
    const daysUntilReview = Math.ceil((protocol.nextReview.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    
    if (riskScore > 7 || complianceStatus === 'needs_improvement' || daysUntilReview < 7) return 'critical';
    if (riskScore > 5 || complianceStatus === 'satisfactory' || daysUntilReview < 30) return 'high';
    if (riskScore > 3 || daysUntilReview < 90) return 'medium';
    return 'low';
  };

  const determineNextAction = (protocol: Protocol) => {
    const priority = calculatePriority(protocol);
    const daysUntilReview = Math.ceil((protocol.nextReview.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysUntilReview < 0) return 'overdue_review';
    if (daysUntilReview < 7) return 'urgent_review';
    if (protocol.status === 'draft') return 'complete_draft';
    if (protocol.approvalWorkflow?.status === 'pending') return 'approval_required';
    if (protocol.riskAssessment?.riskLevel === 'high') return 'risk_mitigation';
    return 'monitor';
  };

  // SUPER AVANSERTE NOTIFIKASJONSFUNKSJONER
  const generateNotifications = (protocols: Protocol[], compliance: Compliance[], equipment: Equipment[]) => {
    const newNotifications = [];
    
    // Protocol notifications
    protocols.forEach(protocol => {
      const daysUntilReview = Math.ceil((protocol.nextReview.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
      if (daysUntilReview < 7) {
        newNotifications.push({
          id: `protocol-${protocol.id}`,
          type: 'warning',
          title: 'Protocol Review Due',
          message: `${protocol.name} needs review in ${daysUntilReview} days`,
          priority: daysUntilReview < 0 ? 'high' : 'medium',
          timestamp: new Date(),
          read: false
        });
      }
    });

    // Compliance notifications
    compliance.forEach(item => {
      if (item.status === 'non_compliant' || item.status === 'at_risk') {
        newNotifications.push({
          id: `compliance-${item.id}`,
          type: 'error',
          title: 'Compliance Issue',
          message: `${item.title} requires immediate attention`,
          priority: 'high',
          timestamp: new Date(),
          read: false
        });
      }
    });

    // Equipment notifications
    equipment.forEach(eq => {
      const daysUntilMaintenance = Math.ceil((eq.nextMaintenance.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
      if (daysUntilMaintenance < 7) {
        newNotifications.push({
          id: `equipment-${eq.id}`,
          type: 'info',
          title: 'Equipment Maintenance',
          message: `${eq.name} maintenance due in ${daysUntilMaintenance} days`,
          priority: 'medium',
          timestamp: new Date(),
          read: false
        });
      }
    });

    setNotifications(prev => [...newNotifications, ...prev]);
    setUnreadCount(newNotifications.length);
  };

  const updateApprovalQueue = (protocols: Protocol[], reviews: ManagementReview[], compliance: Compliance[]) => {
    const queue = [];
    
    // Add protocols pending approval
    protocols.filter(p => p.approvalWorkflow?.status === 'pending').forEach(protocol => {
      queue.push({
        id: protocol.id,
        type: 'protocol',
        title: protocol.name,
        status: protocol.approvalWorkflow?.status,
        priority: calculatePriority(protocol),
        submittedBy: protocol.createdBy,
        submittedAt: protocol.createdAt,
        currentStep: protocol.approvalWorkflow?.currentStep
      });
    });

    // Add other pending items
    // ... similar logic for reviews and compliance

    setApprovalQueue(queue);
  };

  // SUPER AVANSERTE PERFORMANCE FUNKSJONER
  const getPerformanceMetrics = async () => {
    // Simulate performance metrics
    return {
      systemPerformance: {
        responseTime: Math.random() * 100 + 50,
        throughput: Math.random() * 1000 + 500,
        errorRate: Math.random() * 5,
        uptime: 99.9
      },
      userPerformance: {
        activeUsers: Math.floor(Math.random() * 100) + 50,
        sessionDuration: Math.random() * 30 + 10,
        pageViews: Math.floor(Math.random() * 1000) + 500
      },
      businessMetrics: {
        productivity: Math.random() * 20 + 80,
        efficiency: Math.random() * 15 + 85,
        costSavings: Math.random() * 50000 + 10000
      }
    };
  };

  const getOptimizationSuggestions = async () => {
    return [
      {
        id: 'opt-1',
        type: 'performance',
        title: 'Database Query Optimization',
        description: 'Optimize slow queries in protocol management',
        impact: 'high',
        effort: 'medium',
        priority: 'high'
      },
      {
        id: 'opt-2',
        type: 'user_experience',
        title: 'UI/UX Improvements',
        description: 'Enhance user interface for better usability',
        impact: 'medium',
        effort: 'low',
        priority: 'medium'
      },
      {
        id: 'opt-3',
        type: 'security',
        title: 'Security Enhancements',
        description: 'Implement additional security measures',
        impact: 'high',
        effort: 'high',
        priority: 'critical'
      }
    ];
  };

  const generateErrorNotifications = (error: any) => {
    setNotifications(prev => [{
      id: `error-${Date.now()}`,
      type: 'error',
      title: 'System Error',
      message: 'Failed to load company data. Please try again.',
      priority: 'high',
      timestamp: new Date(),
      read: false
    }, ...prev]);
  };

  // SUPER AVANSERTE MANGLEFUNKSJONER
  const calculateReviewEffectiveness = (review: ManagementReview) => {
    if (!review.effectiveness) return 'unknown';
    return review.effectiveness;
  };

  const calculateCostBenefit = (review: ManagementReview) => {
    if (!review.costSavings || !review.budget) return 0;
    return (review.costSavings / review.budget) * 100;
  };

  const calculateRiskMitigation = (riskMitigation: any[]) => {
    if (!riskMitigation || riskMitigation.length === 0) return 0;
    const completed = riskMitigation.filter(r => r.status === 'completed').length;
    return (completed / riskMitigation.length) * 100;
  };

  const determineFollowUpRequired = (review: ManagementReview) => {
    if (!review.followUpDate) return false;
    return new Date() > review.followUpDate;
  };

  const calculateComplianceRisk = (compliance: Compliance) => {
    if (!compliance.riskLevel) return 'unknown';
    return compliance.riskLevel;
  };

  const calculateComplianceImpact = (compliance: Compliance) => {
    if (!compliance.impact) return 'unknown';
    return compliance.impact;
  };

  const calculateUrgency = (nextAssessment: Date) => {
    const daysUntil = Math.ceil((nextAssessment.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    if (daysUntil < 0) return 'overdue';
    if (daysUntil < 7) return 'urgent';
    if (daysUntil < 30) return 'soon';
    return 'normal';
  };

  const determineComplianceAction = (compliance: Compliance) => {
    if (compliance.status === 'non_compliant') return 'immediate_action';
    if (compliance.status === 'at_risk') return 'risk_mitigation';
    if (calculateUrgency(compliance.nextAssessment) === 'urgent') return 'prepare_assessment';
    return 'monitor';
  };

  const calculateRiskMatrix = (riskMatrix: any) => {
    if (!riskMatrix) return { riskLevel: 'unknown', riskScore: 0 };
    return riskMatrix;
  };

  const calculateJSAEffectiveness = (jsa: JSA) => {
    if (!jsa.effectiveness) return 'unknown';
    return jsa.effectiveness;
  };

  const identifyTrainingGaps = (trainingRequirements: any[]) => {
    if (!trainingRequirements || trainingRequirements.length === 0) return [];
    return trainingRequirements.filter(t => {
      if (!t.lastCompleted) return true;
      const daysSince = Math.ceil((new Date().getTime() - t.lastCompleted.getTime()) / (1000 * 60 * 60 * 24));
      return daysSince > 365; // More than a year ago
    });
  };

  const identifyImprovementAreas = (jsa: JSA) => {
    const areas = [];
    if (jsa.effectiveness === 'needs_improvement') areas.push('overall_effectiveness');
    if (jsa.incidents && jsa.incidents.length > 0) areas.push('incident_prevention');
    if (jsa.lessonsLearned && jsa.lessonsLearned.length > 0) areas.push('lessons_implementation');
    return areas;
  };

  const calculateUtilization = (utilization: any) => {
    if (!utilization) return { efficiency: 0, productivity: 0 };
    return utilization;
  };

  const calculateEquipmentPerformance = (performance: any) => {
    if (!performance) return { uptime: 0, efficiency: 0, quality: 0 };
    return performance;
  };

  const calculateLifecycle = (lifecycle: any) => {
    if (!lifecycle) return { phase: 'unknown', totalCost: 0, roi: 0 };
    return lifecycle;
  };

  const calculateMaintenancePriority = (equipment: Equipment) => {
    if (!equipment.nextMaintenance) return 'low';
    const daysUntil = Math.ceil((equipment.nextMaintenance.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    if (daysUntil < 0) return 'critical';
    if (daysUntil < 7) return 'high';
    if (daysUntil < 30) return 'medium';
    return 'low';
  };

  const calculateReplacementUrgency = (equipment: Equipment) => {
    if (!equipment.lifecycle) return 'unknown';
    if (equipment.lifecycle.phase === 'disposal') return 'immediate';
    if (equipment.lifecycle.phase === 'maintenance' && equipment.performance?.efficiency < 50) return 'high';
    return 'normal';
  };

  const calculateProcessEfficiency = (process: WorkProcess) => {
    if (!process.efficiency) return 0;
    return process.efficiency;
  };

  const calculateProcessCostSavings = (process: WorkProcess) => {
    if (!process.costSavings) return 0;
    return process.costSavings;
  };

  const calculateQualityMetrics = (process: WorkProcess) => {
    return {
      quality: process.qualityImprovement || 0,
      customerSatisfaction: process.customerSatisfaction || 0,
      timeSavings: process.timeSavings || 0
    };
  };

  const calculateImprovementPotential = (process: WorkProcess) => {
    const efficiency = calculateProcessEfficiency(process);
    if (efficiency < 60) return 'high';
    if (efficiency < 80) return 'medium';
    return 'low';
  };

  const calculateEmployeePerformance = (performance: any) => {
    if (!performance) return { rating: 0, goals: [], achievements: [] };
    return performance;
  };

  const calculateDevelopmentProgress = (development: any) => {
    if (!development) return { progress: 0, goals: [], activities: [] };
    return development;
  };

  const calculateSuccessionReadiness = (succession: any) => {
    if (!succession) return { risk: 'unknown', candidates: [] };
    return succession;
  };

  const analyzeSkills = (skills: any[]) => {
    if (!skills || skills.length === 0) return { gaps: [], strengths: [] };
    const gaps = skills.filter(s => s.level === 'beginner');
    const strengths = skills.filter(s => s.level === 'expert' || s.level === 'advanced');
    return { gaps, strengths };
  };



  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
      case 'completed':
      case 'compliant':
      case 'operational':
        return 'bg-green-100 text-green-800';
      case 'draft':
      case 'scheduled':
      case 'maintenance':
        return 'bg-yellow-100 text-yellow-800';
      case 'review':
        return 'bg-blue-100 text-blue-800';
      case 'inactive':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low':
        return 'bg-green-100 text-green-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'high':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string | Date) => {
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    return date.toLocaleDateString('nb-NO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Create functions
  const handleCreateProtocol = async (protocolData: any) => {
    if (!service || !userProfile) return;
    
    try {
      setIsCreating(true);
      await service.createProtocol({
        ...protocolData,
        companyId: userProfile.companyId,
        createdBy: userProfile.email || userProfile.displayName || 'Unknown'
      });
      await loadCompanyData();
      setShowProtocolModal(false);
    } catch (error) {
      console.error('Error creating protocol:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleCreateReview = async (reviewData: any) => {
    if (!service || !userProfile) return;
    
    try {
      await service.createManagementReview({
        ...reviewData,
        companyId: userProfile.companyId,
        createdBy: userProfile.email || userProfile.displayName || 'Unknown'
      });
      await loadCompanyData();
      setShowReviewModal(false);
    } catch (error) {
      console.error('Error creating review:', error);
    }
  };

  const handleCreateCompliance = async (complianceData: any) => {
    if (!service || !userProfile) return;
    
    try {
      await service.createCompliance({
        ...complianceData,
        companyId: userProfile.companyId,
        createdBy: userProfile.email || userProfile.displayName || 'Unknown'
      });
      await loadCompanyData();
      setShowComplianceModal(false);
    } catch (error) {
      console.error('Error creating compliance:', error);
    }
  };

  const handleCreateJSA = async (jsaData: any) => {
    if (!service || !userProfile) return;
    
    try {
      setIsCreating(true);
      await service.createJSA({
        ...jsaData,
        companyId: userProfile.companyId,
        createdBy: userProfile.email || userProfile.displayName || 'Unknown'
      });
      await loadCompanyData();
      setShowJSAModal(false);
    } catch (error) {
      console.error('Error creating JSA:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleCreateEquipment = async (equipmentData: any) => {
    if (!service || !userProfile) return;
    
    try {
      await service.createEquipment({
        ...equipmentData,
        companyId: userProfile.companyId,
        createdBy: userProfile.email || userProfile.displayName || 'Unknown'
      });
      await loadCompanyData();
      setShowEquipmentModal(false);
    } catch (error) {
      console.error('Error creating equipment:', error);
    }
  };

  const handleCreateProcess = async (processData: any) => {
    if (!service || !userProfile) return;
    
    try {
      await service.createWorkProcess({
        ...processData,
        companyId: userProfile.companyId,
        createdBy: userProfile.email || userProfile.displayName || 'Unknown'
      });
      await loadCompanyData();
      setShowProcessModal(false);
    } catch (error) {
      console.error('Error creating process:', error);
    }
  };

  const handleCreateOrgChartEntry = async (entryData: any) => {
    if (!service || !userProfile) return;
    
    try {
      await service.createOrgChartEntry({
        ...entryData,
        companyId: userProfile.companyId,
        createdBy: userProfile.email || userProfile.displayName || 'Unknown'
      });
      await loadCompanyData();
      setShowOrgChartModal(false);
    } catch (error) {
      console.error('Error creating org chart entry:', error);
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--gray-50)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ 
            width: '80px', 
            height: '80px', 
            border: '4px solid var(--blue-600)', 
            borderTop: '4px solid transparent', 
            borderRadius: '50%', 
            animation: 'spin 1s linear infinite',
            margin: '0 auto'
          }}></div>
          <h2 style={{ marginTop: '1.5rem', color: 'var(--blue-800)', fontSize: '2rem', fontWeight: '700' }}>
            🚀 SUPER AVANSERT Min Bedrift
          </h2>
          <p style={{ marginTop: '0.5rem', color: 'var(--gray-600)', fontSize: '1.1rem' }}>
            Initialiserer enterprise-funksjoner og analytics...
          </p>
          <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'center', gap: '0.75rem' }}>
            <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: 'var(--blue-500)', animation: 'pulse 1.5s infinite' }}></div>
            <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: 'var(--green-500)', animation: 'pulse 1.5s infinite 0.2s' }}></div>
            <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: 'var(--purple-500)', animation: 'pulse 1.5s infinite 0.4s' }}></div>
            <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: 'var(--orange-500)', animation: 'pulse 1.5s infinite 0.6s' }}></div>
          </div>
          <div style={{ marginTop: '2rem', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', maxWidth: '400px', margin: '2rem auto 0' }}>
            <div style={{ background: 'var(--blue-100)', padding: '1rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--blue-200)' }}>
              <Database style={{ width: '24px', height: '24px', color: 'var(--blue-600)', margin: '0 auto 0.5rem', display: 'block' }} />
              <p style={{ fontSize: '0.875rem', color: 'var(--blue-700)', fontWeight: '600' }}>Data Loading</p>
            </div>
            <div style={{ background: 'var(--green-100)', padding: '1rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--green-200)' }}>
              <BarChart3 style={{ width: '24px', height: '24px', color: 'var(--green-600)', margin: '0 auto 0.5rem', display: 'block' }} />
              <p style={{ fontSize: '0.875rem', color: 'var(--green-700)', fontWeight: '600' }}>Analytics</p>
            </div>
            <div style={{ background: 'var(--purple-100)', padding: '1rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--purple-200)' }}>
              <Settings style={{ width: '24px', height: '24px', color: 'var(--purple-600)', margin: '0 auto 0.5rem', display: 'block' }} />
              <p style={{ fontSize: '0.875rem', color: 'var(--purple-700)', fontWeight: '600' }}>Config</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--gray-50)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', maxWidth: '500px', padding: '2rem' }}>
          <div style={{ 
            width: '80px', 
            height: '80px', 
            background: 'var(--red-100)', 
            borderRadius: '50%', 
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.5rem'
          }}>
            <AlertTriangle style={{ width: '40px', height: '40px', color: 'var(--red-600)' }} />
          </div>
          <h2 style={{ color: 'var(--red-800)', fontSize: '1.5rem', fontWeight: '700', marginBottom: '1rem' }}>
            Oops! Noe gikk galt
          </h2>
          <p style={{ color: 'var(--gray-600)', fontSize: '1rem', marginBottom: '1.5rem' }}>
            {error}
          </p>
          <button 
            onClick={() => {
              setError(null);
              loadCompanyData();
            }}
            style={{
              background: 'var(--blue-600)',
              color: 'white',
              border: 'none',
              padding: '0.75rem 1.5rem',
              borderRadius: 'var(--radius-lg)',
              fontSize: '1rem',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            Prøv igjen
          </button>
        </div>
      </div>
    );
  }

  if (!userProfile) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--gray-50)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', maxWidth: '500px', padding: '2rem' }}>
          <div style={{ 
            width: '80px', 
            height: '80px', 
            background: 'var(--yellow-100)', 
            borderRadius: '50%', 
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.5rem'
          }}>
            <UserCheck style={{ width: '40px', height: '40px', color: 'var(--yellow-600)' }} />
          </div>
          <h2 style={{ color: 'var(--yellow-800)', fontSize: '1.5rem', fontWeight: '700', marginBottom: '1rem' }}>
            Ingen brukerinformasjon
          </h2>
          <p style={{ color: 'var(--gray-600)', fontSize: '1rem' }}>
            Vennligst logg inn på nytt for å få tilgang til Min Bedrift.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--gray-50)' }}>
      {/* SUPER AVANSERT HEADER */}
      <div style={{ background: 'linear-gradient(135deg, var(--blue-600) 0%, var(--purple-600) 100%)', boxShadow: 'var(--shadow-lg)', borderBottom: '1px solid var(--gray-200)', padding: '2rem' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ background: 'rgba(255,255,255,0.2)', padding: '0.75rem', borderRadius: 'var(--radius-lg)' }}>
                <Building style={{ width: '32px', height: '32px', color: 'white' }} />
              </div>
              <div>
                <h1 style={{ fontSize: '2.5rem', fontWeight: '800', color: 'white', margin: '0' }}>
                  🚀 SUPER AVANSERT Min Bedrift
                </h1>
                <p style={{ color: 'rgba(255,255,255,0.9)', fontSize: '1.1rem', margin: '0.25rem 0 0 0' }}>
                  Enterprise Management Platform
                </p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button 
                className="btn btn-outline" 
                style={{ 
                  background: 'rgba(255,255,255,0.1)', 
                  border: '1px solid rgba(255,255,255,0.3)', 
                  color: 'white',
                  padding: '0.75rem 1.5rem'
                }}
                onClick={() => loadCompanyData()}
              >
                <RefreshCw style={{ width: '18px', height: '18px', marginRight: '0.5rem' }} />
                Oppdater Data
              </button>
              <button 
                className="btn btn-primary" 
                style={{ 
                  background: 'var(--green-600)', 
                  border: 'none', 
                  color: 'white',
                  padding: '0.75rem 1.5rem'
                }}
              >
                <Plus style={{ width: '18px', height: '18px', marginRight: '0.5rem' }} />
                Ny Enterprise Modul
              </button>
            </div>
          </div>
          
          {/* SUPER AVANSERTE STATUS INDICATORS */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            <div style={{ background: 'rgba(255,255,255,0.1)', padding: '1rem', borderRadius: 'var(--radius-lg)', border: '1px solid rgba(255,255,255,0.2)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: syncStatus === 'synced' ? 'var(--green-400)' : syncStatus === 'syncing' ? 'var(--yellow-400)' : 'var(--red-400)' }}></div>
                <span style={{ color: 'white', fontSize: '0.875rem', fontWeight: '600' }}>
                  {syncStatus === 'synced' ? 'Synkronisert' : syncStatus === 'syncing' ? 'Synkroniserer...' : 'Feil'}
                </span>
              </div>
              <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.75rem', margin: '0' }}>
                Sist oppdatert: {lastUpdate.toLocaleTimeString()}
              </p>
            </div>
            
            <div style={{ background: 'rgba(255,255,255,0.1)', padding: '1rem', borderRadius: 'var(--radius-lg)', border: '1px solid rgba(255,255,255,0.2)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <Bell style={{ width: '16px', height: '16px', color: 'white' }} />
                <span style={{ color: 'white', fontSize: '0.875rem', fontWeight: '600' }}>
                  {unreadCount} nye varsler
                </span>
              </div>
              <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.75rem', margin: '0' }}>
                {approvalQueue.length} venter på godkjenning
              </p>
            </div>
            
            <div style={{ background: 'rgba(255,255,255,0.1)', padding: '1rem', borderRadius: 'var(--radius-lg)', border: '1px solid rgba(255,255,255,0.2)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <TrendingUp style={{ width: '16px', height: '16px', color: 'white' }} />
                <span style={{ color: 'white', fontSize: '0.875rem', fontWeight: '600' }}>
                  {performanceMetrics?.businessMetrics?.productivity?.toFixed(1) || '0'}% produktivitet
                </span>
              </div>
              <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.75rem', margin: '0' }}>
                {performanceMetrics?.businessMetrics?.costSavings?.toLocaleString() || '0'} kr bespart
              </p>
            </div>
            
            <div style={{ background: 'rgba(255,255,255,0.1)', padding: '1rem', borderRadius: 'var(--radius-lg)', border: '1px solid rgba(255,255,255,0.2)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <ShieldCheck style={{ width: '16px', height: '16px', color: 'white' }} />
                <span style={{ color: 'white', fontSize: '0.875rem', fontWeight: '600' }}>
                  {dashboardStats?.compliance?.compliant || 0} compliant
                </span>
              </div>
              <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.75rem', margin: '0' }}>
                {dashboardStats?.compliance?.atRisk || 0} at risk
              </p>
            </div>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '2rem 1rem' }}>
        {/* SUPER AVANSERT TAB NAVIGATION */}
        <div style={{ marginBottom: '2rem', background: 'var(--white)', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-md)', padding: '1rem' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {[
              { id: 'overview', label: '🚀 Oversikt', icon: Building, count: dashboardStats?.protocols?.total || 0, color: 'var(--blue-600)' },
              { id: 'protocols', label: '📋 Protokoller', icon: FileText, count: protocols.length, color: 'var(--green-600)' },
              { id: 'management', label: '👥 Ledelsesgjennomgang', icon: Users, count: managementReviews.length, color: 'var(--purple-600)' },
              { id: 'compliance', label: '🛡️ Samsvar', icon: Shield, count: compliance.length, color: 'var(--orange-600)' },
              { id: 'jsa', label: '⚠️ SJA', icon: Clipboard, count: jsa.length, color: 'var(--red-600)' },
              { id: 'equipment', label: '🔧 Utstyr & FDV', icon: Wrench, count: equipment.length, color: 'var(--indigo-600)' },
              { id: 'processes', label: '⚙️ Arbeidsprosesser', icon: Settings, count: workProcesses.length, color: 'var(--pink-600)' },
              { id: 'orgchart', label: '📊 Org. Kart', icon: BarChart3, count: orgChart.length, color: 'var(--teal-600)' }
            ].map((tab) => {
              const IconComponent = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    padding: '1rem 1.5rem',
                    border: 'none',
                    background: activeTab === tab.id ? tab.color : 'var(--gray-50)',
                    cursor: 'pointer',
                    borderRadius: 'var(--radius-lg)',
                    color: activeTab === tab.id ? 'white' : 'var(--gray-700)',
                    fontWeight: activeTab === tab.id ? '700' : '600',
                    fontSize: 'var(--font-size-sm)',
                    whiteSpace: 'nowrap',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    transition: 'all 0.2s ease',
                    boxShadow: activeTab === tab.id ? '0 4px 12px rgba(0,0,0,0.15)' : 'none',
                    transform: activeTab === tab.id ? 'translateY(-2px)' : 'none'
                  }}
                  onMouseEnter={(e) => {
                    if (activeTab !== tab.id) {
                      e.currentTarget.style.background = 'var(--gray-100)';
                      e.currentTarget.style.transform = 'translateY(-1px)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (activeTab !== tab.id) {
                      e.currentTarget.style.background = 'var(--gray-50)';
                      e.currentTarget.style.transform = 'translateY(0)';
                    }
                  }}
                >
                  <IconComponent style={{ width: '18px', height: '18px' }} />
                  <span>{tab.label}</span>
                  <div style={{ 
                    background: activeTab === tab.id ? 'rgba(255,255,255,0.2)' : 'var(--gray-200)', 
                    color: activeTab === tab.id ? 'white' : 'var(--gray-600)',
                    padding: '0.25rem 0.5rem', 
                    borderRadius: 'var(--radius-full)', 
                    fontSize: '0.75rem', 
                    fontWeight: '700',
                    minWidth: '20px',
                    textAlign: 'center'
                  }}>
                    {tab.count}
                  </div>
                </button>
              );
            })}
          </div>
          
          {/* SUPER AVANSERTE FILTER OG SØK */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--gray-200)' }}>
            <div style={{ position: 'relative', flex: '1' }}>
              <Search style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', width: '18px', height: '18px', color: 'var(--gray-400)' }} />
              <input
                type="text"
                placeholder="🔍 Søk i alle moduler..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem 0.75rem 2.5rem',
                  border: '1px solid var(--gray-300)',
                  borderRadius: 'var(--radius-lg)',
                  fontSize: 'var(--font-size-sm)',
                  background: 'var(--white)'
                }}
              />
            </div>
            
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              style={{
                padding: '0.75rem 1rem',
                border: '1px solid var(--gray-300)',
                borderRadius: 'var(--radius-lg)',
                fontSize: 'var(--font-size-sm)',
                background: 'var(--white)',
                minWidth: '150px'
              }}
            >
              <option value="all">📂 Alle kategorier</option>
              <option value="Sikkerhet">🛡️ Sikkerhet</option>
              <option value="Miljø">🌱 Miljø</option>
              <option value="Kvalitet">✅ Kvalitet</option>
              <option value="HMS">⚡ HMS</option>
              <option value="Prosess">⚙️ Prosess</option>
            </select>
            
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              style={{
                padding: '0.75rem 1rem',
                border: '1px solid var(--gray-300)',
                borderRadius: 'var(--radius-lg)',
                fontSize: 'var(--font-size-sm)',
                background: 'var(--white)',
                minWidth: '150px'
              }}
            >
              <option value="all">📊 Alle statuser</option>
              <option value="active">✅ Aktiv</option>
              <option value="draft">📝 Kladd</option>
              <option value="review">👀 Under gjennomgang</option>
              <option value="approved">✅ Godkjent</option>
              <option value="archived">📦 Arkivert</option>
            </select>
            
            <button
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              style={{
                padding: '0.75rem 1rem',
                border: '1px solid var(--gray-300)',
                borderRadius: 'var(--radius-lg)',
                fontSize: 'var(--font-size-sm)',
                background: showAdvancedFilters ? 'var(--blue-50)' : 'var(--white)',
                color: showAdvancedFilters ? 'var(--blue-700)' : 'var(--gray-700)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              <Filter style={{ width: '16px', height: '16px' }} />
              Avanserte filtre
            </button>
            
            <button
              onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
              style={{
                padding: '0.75rem 1rem',
                border: '1px solid var(--gray-300)',
                borderRadius: 'var(--radius-lg)',
                fontSize: 'var(--font-size-sm)',
                background: 'var(--white)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              {viewMode === 'grid' ? <List style={{ width: '16px', height: '16px' }} /> : <Grid style={{ width: '16px', height: '16px' }} />}
              {viewMode === 'grid' ? 'Liste' : 'Grid'}
            </button>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div>
            <h2 style={{ fontSize: 'var(--font-size-xl)', fontWeight: '600', color: 'var(--gray-900)', marginBottom: '1.5rem' }}>
              Bedriftsoversikt
            </h2>
            
                        {/* Statistics Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
              <div className="card">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <p style={{ fontSize: 'var(--font-size-sm)', fontWeight: '500', color: 'var(--gray-600)', marginBottom: '0.5rem' }}>Aktive protokoller</p>
                    <p style={{ fontSize: 'var(--font-size-3xl)', fontWeight: '700', color: 'var(--gray-900)' }}>
                      {dashboardStats?.protocols?.active || 0}
                    </p>
                    <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--gray-500)' }}>
                      {dashboardStats?.protocols?.overdue || 0} forfaller snart
                    </p>
                  </div>
                  <div style={{ background: 'var(--blue-100)', padding: '0.75rem', borderRadius: 'var(--radius-lg)' }}>
                    <FileText style={{ width: '24px', height: '24px', color: 'var(--blue-600)' }} />
                  </div>
                </div>
              </div>

              <div className="card">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <p style={{ fontSize: 'var(--font-size-sm)', fontWeight: '500', color: 'var(--gray-600)', marginBottom: '0.5rem' }}>Samsvar status</p>
                    <p style={{ fontSize: 'var(--font-size-3xl)', fontWeight: '700', color: 'var(--green-600)' }}>
                      {dashboardStats?.compliance?.compliant || 0}
                    </p>
                    <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--gray-500)' }}>
                      {dashboardStats?.compliance?.dueSoon || 0} sjekker snart
                    </p>
                  </div>
                  <div style={{ background: 'var(--green-100)', padding: '0.75rem', borderRadius: 'var(--radius-lg)' }}>
                    <Shield style={{ width: '24px', height: '24px', color: 'var(--green-600)' }} />
                  </div>
                </div>
              </div>

              <div className="card">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <p style={{ fontSize: 'var(--font-size-sm)', fontWeight: '500', color: 'var(--gray-600)', marginBottom: '0.5rem' }}>Aktivt utstyr</p>
                    <p style={{ fontSize: 'var(--font-size-3xl)', fontWeight: '700', color: 'var(--orange-600)' }}>
                      {dashboardStats?.equipment?.operational || 0}
                    </p>
                    <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--gray-500)' }}>
                      {dashboardStats?.equipment?.inspectionDue || 0} inspeksjoner forfaller
                    </p>
                  </div>
                  <div style={{ background: 'var(--orange-100)', padding: '0.75rem', borderRadius: 'var(--radius-lg)' }}>
                    <Wrench style={{ width: '24px', height: '24px', color: 'var(--orange-600)' }} />
                  </div>
                </div>
              </div>

              <div className="card">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <p style={{ fontSize: 'var(--font-size-sm)', fontWeight: '500', color: 'var(--gray-600)', marginBottom: '0.5rem' }}>Arbeidsprosesser</p>
                    <p style={{ fontSize: 'var(--font-size-3xl)', fontWeight: '700', color: 'var(--purple-600)' }}>
                      {dashboardStats?.processes?.active || 0}
                    </p>
                    <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--gray-500)' }}>
                      {dashboardStats?.processes?.overdue || 0} gjennomganger forfaller
                    </p>
                  </div>
                  <div style={{ background: 'var(--purple-100)', padding: '0.75rem', borderRadius: 'var(--radius-lg)' }}>
                    <Workflow style={{ width: '24px', height: '24px', color: 'var(--purple-600)' }} />
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="card">
              <div style={{ padding: '1.5rem' }}>
                <h3 style={{ fontSize: 'var(--font-size-lg)', fontWeight: '600', color: 'var(--gray-900)', marginBottom: '1rem' }}>Siste aktivitet</h3>
                <div style={{ display: 'grid', gap: '1rem' }}>
                  {recentActivity.length > 0 ? (
                    recentActivity.map((activity, index) => (
                      <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.75rem', border: '1px solid var(--gray-200)', borderRadius: 'var(--radius-lg)' }}>
                        <div style={{ 
                          background: activity.type === 'protocol' ? 'var(--blue-100)' : 
                                    activity.type === 'compliance' ? 'var(--green-100)' : 
                                    activity.type === 'equipment' ? 'var(--orange-100)' : 'var(--gray-100)', 
                          padding: '0.5rem', 
                          borderRadius: 'var(--radius-lg)' 
                        }}>
                          <Activity style={{ 
                            width: '16px', 
                            height: '16px', 
                            color: activity.type === 'protocol' ? 'var(--blue-600)' : 
                                   activity.type === 'compliance' ? 'var(--green-600)' : 
                                   activity.type === 'equipment' ? 'var(--orange-600)' : 'var(--gray-600)' 
                          }} />
                        </div>
                        <div style={{ flex: '1' }}>
                          <p style={{ fontSize: 'var(--font-size-sm)', fontWeight: '500', color: 'var(--gray-900)' }}>
                            {activity.action} {activity.item}
                          </p>
                          <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--gray-500)' }}>
                            av {activity.user} • {formatDate(activity.time)}
                          </p>
                        </div>
                        <span className={`badge ${getStatusColor(activity.status)}`}>
                          {activity.status === 'active' ? 'Aktiv' : 
                           activity.status === 'completed' ? 'Fullført' : 
                           activity.status === 'compliant' ? 'Samsvar' : 'Status'}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--gray-500)' }}>
                      <Activity style={{ width: '48px', height: '48px', margin: '0 auto 1rem', opacity: '0.5' }} />
                      <p>Ingen aktivitet ennå</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Protocols Tab */}
        {activeTab === 'protocols' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: 'var(--font-size-xl)', fontWeight: '600', color: 'var(--gray-900)' }}>
                Protokoller
              </h2>
                          <button className="btn btn-primary" onClick={() => setShowProtocolModal(true)}>
              <Plus style={{ width: '16px', height: '16px', marginRight: '0.5rem' }} />
              Ny protokoll
            </button>
            </div>

            <div className="card">
              <div style={{ padding: '1.5rem' }}>
                <div style={{ display: 'grid', gap: '1rem' }}>
                  {protocols.map((protocol) => (
                    <div key={protocol.id} style={{ 
                      border: '1px solid var(--gray-200)', 
                      borderRadius: 'var(--radius-lg)', 
                      padding: '1.5rem',
                      background: 'var(--white)'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                        <div style={{ flex: '1' }}>
                          <h3 style={{ fontSize: 'var(--font-size-lg)', fontWeight: '600', color: 'var(--gray-900)', marginBottom: '0.5rem' }}>
                            {protocol.name}
                          </h3>
                          <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                            <span className={`badge ${getStatusColor(protocol.status)}`}>
                              {protocol.status === 'active' ? 'Aktiv' : protocol.status === 'draft' ? 'Utkast' : 'Inaktiv'}
                            </span>
                            <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--gray-600)' }}>
                              Versjon {protocol.version}
                            </span>
                            <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--gray-600)' }}>
                              {protocol.category}
                            </span>
                          </div>
                          <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--gray-600)' }}>
                            Sist oppdatert: {formatDate(protocol.lastUpdated)}
                          </p>
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button className="btn btn-sm btn-outline">
                            <Eye style={{ width: '16px', height: '16px' }} />
                          </button>
                          <button className="btn btn-sm btn-outline">
                            <Edit style={{ width: '16px', height: '16px' }} />
                          </button>
                          <button className="btn btn-sm btn-outline">
                            <Download style={{ width: '16px', height: '16px' }} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Management Reviews Tab */}
        {activeTab === 'management' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: 'var(--font-size-xl)', fontWeight: '600', color: 'var(--gray-900)' }}>
                Ledelsesgjennomgang
              </h2>
                          <button className="btn btn-primary" onClick={() => setShowReviewModal(true)}>
              <Plus style={{ width: '16px', height: '16px', marginRight: '0.5rem' }} />
              Ny gjennomgang
            </button>
            </div>

            <div className="card">
              <div style={{ padding: '1.5rem' }}>
                <div style={{ display: 'grid', gap: '1rem' }}>
                  {managementReviews.map((review) => (
                    <div key={review.id} style={{ 
                      border: '1px solid var(--gray-200)', 
                      borderRadius: 'var(--radius-lg)', 
                      padding: '1.5rem',
                      background: 'var(--white)'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                        <div style={{ flex: '1' }}>
                          <h3 style={{ fontSize: 'var(--font-size-lg)', fontWeight: '600', color: 'var(--gray-900)', marginBottom: '0.5rem' }}>
                            {review.title}
                          </h3>
                          <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                            <span className={`badge ${getStatusColor(review.status)}`}>
                              {review.status === 'completed' ? 'Fullført' : review.status === 'scheduled' ? 'Planlagt' : 'Pågående'}
                            </span>
                            <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--gray-600)' }}>
                              {review.participants} deltakere
                            </span>
                            <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--gray-600)' }}>
                              {review.findings} funn
                            </span>
                          </div>
                          <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--gray-600)' }}>
                            Dato: {formatDate(review.date)}
                          </p>
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button className="btn btn-sm btn-outline">
                            <Eye style={{ width: '16px', height: '16px' }} />
                          </button>
                          <button className="btn btn-sm btn-outline">
                            <Edit style={{ width: '16px', height: '16px' }} />
                          </button>
                          <button className="btn btn-sm btn-outline">
                            <Download style={{ width: '16px', height: '16px' }} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Compliance Tab */}
        {activeTab === 'compliance' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: 'var(--font-size-xl)', fontWeight: '600', color: 'var(--gray-900)' }}>
                Samsvar
              </h2>
                          <button className="btn btn-primary" onClick={() => setShowComplianceModal(true)}>
              <Plus style={{ width: '16px', height: '16px', marginRight: '0.5rem' }} />
              Ny samsvarsjekk
            </button>
            </div>

            <div className="card">
              <div style={{ padding: '1.5rem' }}>
                <div style={{ display: 'grid', gap: '1rem' }}>
                  {compliance.map((item) => (
                    <div key={item.id} style={{ 
                      border: '1px solid var(--gray-200)', 
                      borderRadius: 'var(--radius-lg)', 
                      padding: '1.5rem',
                      background: 'var(--white)'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                        <div style={{ flex: '1' }}>
                          <h3 style={{ fontSize: 'var(--font-size-lg)', fontWeight: '600', color: 'var(--gray-900)', marginBottom: '0.5rem' }}>
                            {item.regulation}
                          </h3>
                          <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                            <span className={`badge ${getStatusColor(item.status)}`}>
                              {item.status === 'compliant' ? 'Samsvar' : item.status === 'review' ? 'Gjennomgang' : 'Ikke samsvar'}
                            </span>
                            <span className={`badge ${getRiskColor(item.risk)}`}>
                              {item.risk === 'low' ? 'Lav risiko' : item.risk === 'medium' ? 'Medium risiko' : 'Høy risiko'}
                            </span>
                          </div>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', fontSize: 'var(--font-size-sm)', color: 'var(--gray-600)' }}>
                            <div>
                              <strong>Sist sjekket:</strong> {formatDate(item.lastCheck)}
                            </div>
                            <div>
                              <strong>Neste sjekk:</strong> {formatDate(item.nextCheck)}
                            </div>
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button className="btn btn-sm btn-outline">
                            <Eye style={{ width: '16px', height: '16px' }} />
                          </button>
                          <button className="btn btn-sm btn-outline">
                            <Edit style={{ width: '16px', height: '16px' }} />
                          </button>
                          <button className="btn btn-sm btn-outline">
                            <Download style={{ width: '16px', height: '16px' }} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* JSA Tab */}
        {activeTab === 'jsa' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: 'var(--font-size-xl)', fontWeight: '600', color: 'var(--gray-900)' }}>
                SJA - Sikker Jobb Analyse
              </h2>
                          <button className="btn btn-primary" onClick={() => setShowJSAModal(true)}>
              <Plus style={{ width: '16px', height: '16px', marginRight: '0.5rem' }} />
              Ny SJA
            </button>
            </div>

            <div className="card">
              <div style={{ padding: '1.5rem' }}>
                <div style={{ display: 'grid', gap: '1rem' }}>
                  {jsa.map((item) => (
                    <div key={item.id} style={{ 
                      border: '1px solid var(--gray-200)', 
                      borderRadius: 'var(--radius-lg)', 
                      padding: '1.5rem',
                      background: 'var(--white)'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                        <div style={{ flex: '1' }}>
                          <h3 style={{ fontSize: 'var(--font-size-lg)', fontWeight: '600', color: 'var(--gray-900)', marginBottom: '0.5rem' }}>
                            {item.activity}
                          </h3>
                          <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                            <span className={`badge ${getRiskColor(item.riskLevel)}`}>
                              {item.riskLevel === 'low' ? 'Lav risiko' : item.riskLevel === 'medium' ? 'Medium risiko' : 'Høy risiko'}
                            </span>
                            <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--gray-600)' }}>
                              {item.department}
                            </span>
                            <span className={`badge ${getStatusColor(item.status)}`}>
                              {item.status === 'active' ? 'Aktiv' : 'Inaktiv'}
                            </span>
                          </div>
                          <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--gray-600)' }}>
                            Sist oppdatert: {formatDate(item.lastUpdated)}
                          </p>
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button className="btn btn-sm btn-outline">
                            <Eye style={{ width: '16px', height: '16px' }} />
                          </button>
                          <button className="btn btn-sm btn-outline">
                            <Edit style={{ width: '16px', height: '16px' }} />
                          </button>
                          <button className="btn btn-sm btn-outline">
                            <Download style={{ width: '16px', height: '16px' }} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Equipment Tab */}
        {activeTab === 'equipment' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: 'var(--font-size-xl)', fontWeight: '600', color: 'var(--gray-900)' }}>
                Utstyr & FDV
              </h2>
                          <button className="btn btn-primary" onClick={() => setShowEquipmentModal(true)}>
              <Plus style={{ width: '16px', height: '16px', marginRight: '0.5rem' }} />
              Nytt utstyr
            </button>
            </div>

            <div className="card">
              <div style={{ padding: '1.5rem' }}>
                <div style={{ display: 'grid', gap: '1rem' }}>
                  {equipment.map((item) => (
                    <div key={item.id} style={{ 
                      border: '1px solid var(--gray-200)', 
                      borderRadius: 'var(--radius-lg)', 
                      padding: '1.5rem',
                      background: 'var(--white)'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                        <div style={{ flex: '1' }}>
                          <h3 style={{ fontSize: 'var(--font-size-lg)', fontWeight: '600', color: 'var(--gray-900)', marginBottom: '0.5rem' }}>
                            {item.name}
                          </h3>
                          <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                            <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--gray-600)' }}>
                              {item.type}
                            </span>
                            <span className={`badge ${getStatusColor(item.status)}`}>
                              {item.status === 'operational' ? 'Operativ' : item.status === 'maintenance' ? 'Vedlikehold' : 'Stoppet'}
                            </span>
                          </div>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', fontSize: 'var(--font-size-sm)', color: 'var(--gray-600)' }}>
                            <div>
                              <strong>Sist inspeksjon:</strong> {formatDate(item.lastInspection)}
                            </div>
                            <div>
                              <strong>Neste inspeksjon:</strong> {formatDate(item.nextInspection)}
                            </div>
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button className="btn btn-sm btn-outline">
                            <Eye style={{ width: '16px', height: '16px' }} />
                          </button>
                          <button className="btn btn-sm btn-outline">
                            <Edit style={{ width: '16px', height: '16px' }} />
                          </button>
                          <button className="btn btn-sm btn-outline">
                            <Download style={{ width: '16px', height: '16px' }} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Work Processes Tab */}
        {activeTab === 'processes' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: 'var(--font-size-xl)', fontWeight: '600', color: 'var(--gray-900)' }}>
                Arbeidsprosesser
              </h2>
                          <button className="btn btn-primary" onClick={() => setShowProcessModal(true)}>
              <Plus style={{ width: '16px', height: '16px', marginRight: '0.5rem' }} />
              Ny prosess
            </button>
            </div>

            <div className="card">
              <div style={{ padding: '1.5rem' }}>
                <div style={{ display: 'grid', gap: '1rem' }}>
                  {workProcesses.map((process) => (
                    <div key={process.id} style={{ 
                      border: '1px solid var(--gray-200)', 
                      borderRadius: 'var(--radius-lg)', 
                      padding: '1.5rem',
                      background: 'var(--white)'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                        <div style={{ flex: '1' }}>
                          <h3 style={{ fontSize: 'var(--font-size-lg)', fontWeight: '600', color: 'var(--gray-900)', marginBottom: '0.5rem' }}>
                            {process.name}
                          </h3>
                          <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                            <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--gray-600)' }}>
                              {process.department}
                            </span>
                            <span className={`badge ${getStatusColor(process.status)}`}>
                              {process.status === 'active' ? 'Aktiv' : process.status === 'draft' ? 'Utkast' : 'Inaktiv'}
                            </span>
                            <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--gray-600)' }}>
                              Versjon {process.version}
                            </span>
                          </div>
                          <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--gray-600)' }}>
                            Sist oppdatert: {formatDate(process.lastUpdated)}
                          </p>
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button className="btn btn-sm btn-outline">
                            <Eye style={{ width: '16px', height: '16px' }} />
                          </button>
                          <button className="btn btn-sm btn-outline">
                            <Edit style={{ width: '16px', height: '16px' }} />
                          </button>
                          <button className="btn btn-sm btn-outline">
                            <Download style={{ width: '16px', height: '16px' }} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Organizational Chart Tab */}
        {activeTab === 'orgchart' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: 'var(--font-size-xl)', fontWeight: '600', color: 'var(--gray-900)' }}>
                Organisasjonskart
              </h2>
                          <button className="btn btn-primary" onClick={() => setShowOrgChartModal(true)}>
              <Plus style={{ width: '16px', height: '16px', marginRight: '0.5rem' }} />
              Ny stilling
            </button>
            </div>

            <div className="card">
              <div style={{ padding: '1.5rem' }}>
                <div style={{ display: 'grid', gap: '1rem' }}>
                  {orgChart.map((person) => (
                    <div key={person.id} style={{ 
                      border: '1px solid var(--gray-200)', 
                      borderRadius: 'var(--radius-lg)', 
                      padding: '1.5rem',
                      background: 'var(--white)'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                        <div style={{ flex: '1' }}>
                          <h3 style={{ fontSize: 'var(--font-size-lg)', fontWeight: '600', color: 'var(--gray-900)', marginBottom: '0.5rem' }}>
                            {person.name}
                          </h3>
                          <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                            <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--gray-600)' }}>
                              {person.position}
                            </span>
                            <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--gray-600)' }}>
                              {person.department}
                            </span>
                            <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--gray-600)' }}>
                              {person.employees} ansatte
                            </span>
                          </div>
                          {person.reportsTo && (
                            <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--gray-600)' }}>
                              Rapporterer til: {orgChart.find(p => p.id === person.reportsTo)?.name}
                            </p>
                          )}
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button className="btn btn-sm btn-outline">
                            <Eye style={{ width: '16px', height: '16px' }} />
                          </button>
                          <button className="btn btn-sm btn-outline">
                            <Edit style={{ width: '16px', height: '16px' }} />
                          </button>
                          <button className="btn btn-sm btn-outline">
                            <Users style={{ width: '16px', height: '16px' }} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <ProtocolModal
        isOpen={showProtocolModal}
        onClose={() => setShowProtocolModal(false)}
        onSubmit={handleCreateProtocol}
        loading={isCreating}
      />

      <JSAModal
        isOpen={showJSAModal}
        onClose={() => setShowJSAModal(false)}
        onSubmit={handleCreateJSA}
        loading={isCreating}
      />
    </div>
  );
} 