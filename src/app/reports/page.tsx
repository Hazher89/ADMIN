'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { reportService, userService, departmentService } from '@/lib/firebase-services';
import { User, Department, Report, ComplianceStatus } from '@/types';
import { 
  BarChart3, 
  PieChart, 
  TrendingUp, 
  TrendingDown,
  Download,
  Filter,
  Calendar,
  Users,
  Building,
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Activity,
  Target,
  Award,
  Zap,
  FileText,
  Settings,
  RefreshCw,
  Eye,
  Share2,
  Printer,
  Mail,
  Database,
  Shield,
  Scale,
  Gavel
} from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function ReportsPage() {
  const { userProfile, isAdmin, isDepartmentLeader } = useAuth();
  const [reports, setReports] = useState<Report[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [selectedReportType, setSelectedReportType] = useState('overview');
  const [showComplianceModal, setShowComplianceModal] = useState(false);

  useEffect(() => {
    loadData();
  }, [selectedPeriod, selectedDepartment]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load departments
      const deps = await departmentService.getAllDepartments();
      setDepartments(deps);

      // Load users based on role
      let allUsers: User[] = [];
      if (isAdmin) {
        const employees = await userService.getUsersByRole('employee');
        const leaders = await userService.getUsersByRole('department_leader');
        allUsers = [...employees, ...leaders];
      } else if (isDepartmentLeader && userProfile?.departmentId) {
        allUsers = await userService.getUsersByDepartment(userProfile.departmentId);
      }
      setUsers(allUsers);

      // Load reports based on role and filters
      let reportData: Report[] = [];
      if (isAdmin) {
        reportData = await reportService.getReports(selectedPeriod, selectedDepartment);
      } else if (isDepartmentLeader && userProfile?.departmentId) {
        reportData = await reportService.getDepartmentReports(userProfile.departmentId, selectedPeriod);
      } else {
        reportData = await reportService.getEmployeeReports(userProfile?.id || '', selectedPeriod);
      }

      setReports(reportData);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Kunne ikke laste data');
    } finally {
      setLoading(false);
    }
  };

  const getComplianceStats = () => {
    const totalReports = reports.length;
    const compliant = reports.filter(r => r.complianceStatus === ComplianceStatus.COMPLIANT).length;
    const nonCompliant = reports.filter(r => r.complianceStatus === ComplianceStatus.NON_COMPLIANT).length;
    const warning = reports.filter(r => r.complianceStatus === ComplianceStatus.WARNING).length;
    
    return { totalReports, compliant, nonCompliant, warning };
  };

  const getAttendanceStats = () => {
    // Mock data for demonstration
    return {
      totalDays: 22,
      presentDays: 20,
      absentDays: 2,
      lateDays: 1,
      overtimeHours: 8.5
    };
  };

  const getVacationStats = () => {
    // Mock data for demonstration
    return {
      totalDays: 25,
      usedDays: 15,
      remainingDays: 10,
      pendingRequests: 3,
      approvedRequests: 12
    };
  };

  const getDeviationStats = () => {
    // Mock data for demonstration
    return {
      totalDeviations: 45,
      resolvedDeviations: 38,
      pendingDeviations: 7,
      criticalDeviations: 3,
      averageResolutionTime: 2.5
    };
  };

  const getProductivityStats = () => {
    // Mock data for demonstration
    return {
      averageHoursPerDay: 7.8,
      totalHoursThisMonth: 156,
      efficiency: 92,
      qualityScore: 88,
      teamCollaboration: 95
    };
  };

  const handleExportReport = async (reportType: string) => {
    try {
      await reportService.exportReport(reportType, selectedPeriod, selectedDepartment);
      toast.success('Rapport eksportert');
    } catch (error) {
      console.error('Error exporting report:', error);
      toast.error('Kunne ikke eksportere rapport');
    }
  };

  const handleGenerateReport = async (reportType: string) => {
    try {
      const newReport = await reportService.generateReport(reportType, selectedPeriod, selectedDepartment);
      toast.success('Rapport generert');
      loadData();
    } catch (error) {
      console.error('Error generating report:', error);
      toast.error('Kunne ikke generere rapport');
    }
  };

  const getComplianceColor = (status: ComplianceStatus) => {
    const colors = {
      [ComplianceStatus.COMPLIANT]: 'text-green-600 bg-green-100',
      [ComplianceStatus.NON_COMPLIANT]: 'text-red-600 bg-red-100',
      [ComplianceStatus.WARNING]: 'text-yellow-600 bg-yellow-100'
    };
    return colors[status] || colors[ComplianceStatus.WARNING];
  };

  const getComplianceIcon = (status: ComplianceStatus) => {
    const icons = {
      [ComplianceStatus.COMPLIANT]: CheckCircle,
      [ComplianceStatus.NON_COMPLIANT]: XCircle,
      [ComplianceStatus.WARNING]: AlertTriangle
    };
    return icons[status] || AlertTriangle;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const complianceStats = getComplianceStats();
  const attendanceStats = getAttendanceStats();
  const vacationStats = getVacationStats();
  const deviationStats = getDeviationStats();
  const productivityStats = getProductivityStats();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Rapporter & Analyse</h1>
          <p className="mt-1 text-sm text-gray-500">
            Avanserte rapporter og lovdata-kompatibilitet
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => loadData()}
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Oppdater
          </button>
          <button
            onClick={() => setShowComplianceModal(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            <Shield className="h-4 w-4 mr-2" />
            Lovdata
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white shadow-lg rounded-xl border border-gray-100 p-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Rapporttype
            </label>
            <select
              value={selectedReportType}
              onChange={(e) => setSelectedReportType(e.target.value)}
              className="block w-full border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            >
              <option value="overview">Oversikt</option>
              <option value="attendance">Fravær</option>
              <option value="vacation">Ferie</option>
              <option value="deviations">Avvik</option>
              <option value="productivity">Produktivitet</option>
              <option value="compliance">Lovdata</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Periode
            </label>
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="block w-full border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            >
              <option value="week">Siste uke</option>
              <option value="month">Siste måned</option>
              <option value="quarter">Siste kvartal</option>
              <option value="year">Siste år</option>
            </select>
          </div>

          {(isAdmin || isDepartmentLeader) && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Avdeling
              </label>
              <select
                value={selectedDepartment}
                onChange={(e) => setSelectedDepartment(e.target.value)}
                className="block w-full border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              >
                <option value="">Alle avdelinger</option>
                {departments.map(dept => (
                  <option key={dept.id} value={dept.id}>{dept.name}</option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Ansatt
            </label>
            <select
              value={selectedEmployee}
              onChange={(e) => setSelectedEmployee(e.target.value)}
              className="block w-full border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            >
              <option value="">Alle ansatte</option>
              {users.map(user => (
                <option key={user.id} value={user.id}>{user.displayName}</option>
              ))}
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={() => handleGenerateReport(selectedReportType)}
              className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <BarChart3 className="h-4 w-4 mr-2" />
              Generer
            </button>
          </div>
        </div>
      </div>

      {/* Compliance Overview */}
      <div className="bg-gradient-to-r from-green-600 to-blue-600 rounded-xl shadow-xl p-8 text-white">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold mb-2">Lovdata-kompatibilitet</h2>
            <p className="text-green-100">
              Overvåking av compliance med norske arbeidsrettslige regler
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-center">
              <Gavel className="h-8 w-8 mx-auto mb-2 text-green-300" />
              <div className="text-xs text-green-100">Arbeidsmiljøloven</div>
            </div>
            <div className="text-center">
              <Scale className="h-8 w-8 mx-auto mb-2 text-green-300" />
              <div className="text-xs text-green-100">Ferie- og permisjonsloven</div>
            </div>
            <div className="text-center">
              <Shield className="h-8 w-8 mx-auto mb-2 text-green-300" />
              <div className="text-xs text-green-100">GDPR</div>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white/10 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm">Kompatible</p>
                <p className="text-2xl font-bold">{complianceStats.compliant}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-300" />
            </div>
          </div>
          
          <div className="bg-white/10 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-yellow-100 text-sm">Advarsler</p>
                <p className="text-2xl font-bold">{complianceStats.warning}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-yellow-300" />
            </div>
          </div>
          
          <div className="bg-white/10 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-red-100 text-sm">Ikke kompatible</p>
                <p className="text-2xl font-bold">{complianceStats.nonCompliant}</p>
              </div>
              <XCircle className="h-8 w-8 text-red-300" />
            </div>
          </div>
          
          <div className="bg-white/10 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm">Totalt</p>
                <p className="text-2xl font-bold">{complianceStats.totalReports}</p>
              </div>
              <Database className="h-8 w-8 text-blue-300" />
            </div>
          </div>
        </div>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Attendance Stats */}
        <div className="bg-white shadow-lg rounded-xl border border-gray-100 overflow-hidden">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Clock className="h-6 w-6 text-blue-600" />
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">Oppmøte</p>
                <p className="text-2xl font-bold text-gray-900">{attendanceStats.presentDays}/{attendanceStats.totalDays}</p>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Fraværsdager:</span>
                <span className="font-medium text-red-600">{attendanceStats.absentDays}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Forsinkelser:</span>
                <span className="font-medium text-yellow-600">{attendanceStats.lateDays}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Overtid:</span>
                <span className="font-medium text-green-600">{attendanceStats.overtimeHours}h</span>
              </div>
            </div>
          </div>
        </div>

        {/* Vacation Stats */}
        <div className="bg-white shadow-lg rounded-xl border border-gray-100 overflow-hidden">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Calendar className="h-6 w-6 text-green-600" />
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">Ferie</p>
                <p className="text-2xl font-bold text-gray-900">{vacationStats.usedDays}/{vacationStats.totalDays}</p>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Gjenstående:</span>
                <span className="font-medium text-blue-600">{vacationStats.remainingDays} dager</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Venter:</span>
                <span className="font-medium text-yellow-600">{vacationStats.pendingRequests}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Godkjent:</span>
                <span className="font-medium text-green-600">{vacationStats.approvedRequests}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Deviation Stats */}
        <div className="bg-white shadow-lg rounded-xl border border-gray-100 overflow-hidden">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">Avvik</p>
                <p className="text-2xl font-bold text-gray-900">{deviationStats.resolvedDeviations}/{deviationStats.totalDeviations}</p>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Kritiske:</span>
                <span className="font-medium text-red-600">{deviationStats.criticalDeviations}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Venter:</span>
                <span className="font-medium text-yellow-600">{deviationStats.pendingDeviations}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Gj.snitt løsning:</span>
                <span className="font-medium text-blue-600">{deviationStats.averageResolutionTime}d</span>
              </div>
            </div>
          </div>
        </div>

        {/* Productivity Stats */}
        <div className="bg-white shadow-lg rounded-xl border border-gray-100 overflow-hidden">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Target className="h-6 w-6 text-purple-600" />
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">Effektivitet</p>
                <p className="text-2xl font-bold text-gray-900">{productivityStats.efficiency}%</p>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Timer/mnd:</span>
                <span className="font-medium text-blue-600">{productivityStats.totalHoursThisMonth}h</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Kvalitet:</span>
                <span className="font-medium text-green-600">{productivityStats.qualityScore}%</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Samarbeid:</span>
                <span className="font-medium text-purple-600">{productivityStats.teamCollaboration}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Attendance Chart */}
        <div className="bg-white shadow-lg rounded-xl border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Oppmøte denne måneden</h3>
            <button
              onClick={() => handleExportReport('attendance')}
              className="text-blue-600 hover:text-blue-900"
            >
              <Download className="h-4 w-4" />
            </button>
          </div>
          <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
            <div className="text-center">
              <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-500">Interaktivt diagram kommer snart</p>
            </div>
          </div>
        </div>

        {/* Vacation Distribution */}
        <div className="bg-white shadow-lg rounded-xl border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Feriefordeling</h3>
            <button
              onClick={() => handleExportReport('vacation')}
              className="text-blue-600 hover:text-blue-900"
            >
              <Download className="h-4 w-4" />
            </button>
          </div>
          <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
            <div className="text-center">
              <PieChart className="h-12 w-12 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-500">Interaktivt diagram kommer snart</p>
            </div>
          </div>
        </div>
      </div>

      {/* Compliance Details */}
      <div className="bg-white shadow-lg rounded-xl border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">
              Lovdata-kompatibilitet detaljer
            </h3>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handleExportReport('compliance')}
                className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <Download className="h-4 w-4 mr-2" />
                Eksporter
              </button>
              <button
                onClick={() => {/* Print functionality */}}
                className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <Printer className="h-4 w-4 mr-2" />
                Skriv ut
              </button>
            </div>
          </div>
        </div>
        
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Arbeidsmiljøloven */}
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-gray-900">Arbeidsmiljøloven</h4>
                <CheckCircle className="h-5 w-5 text-green-500" />
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Arbeidstid:</span>
                  <span className="font-medium text-green-600">Kompatibel</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Pauser:</span>
                  <span className="font-medium text-green-600">Kompatibel</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Helse:</span>
                  <span className="font-medium text-green-600">Kompatibel</span>
                </div>
              </div>
            </div>

            {/* Ferie- og permisjonsloven */}
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-gray-900">Ferie- og permisjonsloven</h4>
                <CheckCircle className="h-5 w-5 text-green-500" />
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Ferie:</span>
                  <span className="font-medium text-green-600">Kompatibel</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Permisjon:</span>
                  <span className="font-medium text-green-600">Kompatibel</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Fravær:</span>
                  <span className="font-medium text-yellow-600">Advarsel</span>
                </div>
              </div>
            </div>

            {/* GDPR */}
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-gray-900">GDPR</h4>
                <CheckCircle className="h-5 w-5 text-green-500" />
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Dataminimering:</span>
                  <span className="font-medium text-green-600">Kompatibel</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Samtykke:</span>
                  <span className="font-medium text-green-600">Kompatibel</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Sletting:</span>
                  <span className="font-medium text-green-600">Kompatibel</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Reports */}
      <div className="bg-white shadow-lg rounded-xl border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Siste rapporter</h3>
        </div>
        
        <div className="divide-y divide-gray-200">
          {reports.slice(0, 5).map((report) => {
            const ComplianceIcon = getComplianceIcon(report.complianceStatus);
            return (
              <div key={report.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${getComplianceColor(report.complianceStatus)}`}>
                      <ComplianceIcon className="h-5 w-5" />
                    </div>
                    <div className="ml-4">
                      <h4 className="text-sm font-medium text-gray-900">{report.title}</h4>
                      <p className="text-sm text-gray-500">{report.description}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-500">
                      {new Date(report.generatedAt).toLocaleDateString('no-NO')}
                    </span>
                    <button
                      onClick={() => handleExportReport(report.type)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      <Download className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {reports.length === 0 && (
          <div className="text-center py-12">
            <FileText className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Ingen rapporter funnet</h3>
            <p className="mt-1 text-sm text-gray-500">
              Generer din første rapport for å komme i gang.
            </p>
          </div>
        )}
      </div>

      {/* Compliance Modal would go here */}
      {/* This is a placeholder for the modal component */}
    </div>
  );
} 