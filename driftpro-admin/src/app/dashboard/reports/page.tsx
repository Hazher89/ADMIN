'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { firebaseService } from '@/lib/firebase-services';
import { 
  BarChart3, 
  Download, 
  Calendar,
  Users,
  TrendingUp,
  TrendingDown,
  Clock,
  AlertTriangle,
  FileText,
  Filter,
  Search,
  RefreshCw,
  Eye,
  Printer,
  Share2,
  Settings,
  ChevronDown,
  ChevronUp,
  Plus,
  X,
  CheckCircle,
  XCircle,
  Info,
  Activity,
  Target,
  DollarSign,
  MapPin,
  Briefcase,
  Star,
  Award,
  Zap,
  Database,
  BarChart,
  PieChart,
  LineChart,
  AreaChart
} from 'lucide-react';

interface ReportData {
  id: string;
  title: string;
  type: 'employee' | 'attendance' | 'performance' | 'financial' | 'hms' | 'custom';
  status: 'draft' | 'generated' | 'scheduled' | 'error';
  createdAt: string;
  updatedAt: string;
  generatedBy: string;
  data?: any;
  filters?: any;
  schedule?: string;
  lastGenerated?: string;
  downloadUrl?: string;
}

interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor?: string[];
    borderColor?: string;
    borderWidth?: number;
  }[];
}

export default function ReportsPage() {
  const { userProfile } = useAuth();
  const [reports, setReports] = useState<ReportData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState<ReportData | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'reports' | 'templates' | 'scheduled'>('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [dateRange, setDateRange] = useState('30d');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Dashboard stats
  const [stats, setStats] = useState({
    totalEmployees: 0,
    activeEmployees: 0,
    totalDepartments: 0,
    totalShifts: 0,
    activeShifts: 0,
    totalDeviations: 0,
    openDeviations: 0,
    totalDocuments: 0,
    totalVacations: 0,
    pendingVacations: 0,
    totalAbsences: 0,
    totalTimeClocks: 0,
    activeTimeClocks: 0
  });

  // Chart data
  const [attendanceData, setAttendanceData] = useState<ChartData>({
    labels: [],
    datasets: []
  });

  const [performanceData, setPerformanceData] = useState<ChartData>({
    labels: [],
    datasets: []
  });

  const [departmentData, setDepartmentData] = useState<ChartData>({
    labels: [],
    datasets: []
  });

  const loadData = async () => {
    if (!userProfile?.companyId) {
      setLoading(false);
      return;
    }

    try {
      setError(null);
      
      // Load company statistics
      const companyStats = await firebaseService.getCompanyStats(userProfile.companyId);
      setStats({
        totalEmployees: companyStats.totalEmployees,
        activeEmployees: companyStats.totalEmployees, // Simplified
        totalDepartments: companyStats.totalDepartments,
        totalShifts: companyStats.activeShifts,
        activeShifts: companyStats.activeShifts,
        totalDeviations: companyStats.totalDeviations,
        openDeviations: companyStats.totalDeviations, // Simplified
        totalDocuments: companyStats.totalDocuments,
        totalVacations: 0,
        pendingVacations: 0,
        totalAbsences: 0,
        totalTimeClocks: 0,
        activeTimeClocks: 0
      });

      // Load employees for department chart
      const employees = await firebaseService.getEmployees(userProfile.companyId);
      const departments = await firebaseService.getDepartments(userProfile.companyId);
      
      // Generate department chart data
      const deptEmployeeCount = departments.map(dept => {
        const count = employees.filter(emp => emp.departmentId === dept.id).length;
        return { name: dept.name, count };
      });

      setDepartmentData({
        labels: deptEmployeeCount.map(d => d.name),
        datasets: [{
          label: 'Ansatte per avdeling',
          data: deptEmployeeCount.map(d => d.count),
          backgroundColor: [
            '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
            '#06B6D4', '#84CC16', '#F97316', '#EC4899', '#6366F1'
          ]
        }]
      });

      // Generate attendance data (mock for now)
      const last7Days = Array.from({length: 7}, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - i);
        return date.toLocaleDateString('nb-NO', { weekday: 'short' });
      }).reverse();

      setAttendanceData({
        labels: last7Days,
        datasets: [
          {
            label: 'Tilstede',
            data: [95, 92, 88, 94, 96, 90, 93],
            backgroundColor: '#10B981',
            borderColor: '#10B981',
            borderWidth: 2
          },
          {
            label: 'Fravær',
            data: [5, 8, 12, 6, 4, 10, 7],
            backgroundColor: '#EF4444',
            borderColor: '#EF4444',
            borderWidth: 2
          }
        ]
      });

      // Generate performance data
      setPerformanceData({
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'Mai', 'Jun'],
        datasets: [
          {
            label: 'Produktivitet',
            data: [85, 88, 92, 89, 94, 91],
            backgroundColor: '#3B82F6',
            borderColor: '#3B82F6',
            borderWidth: 2
          },
          {
            label: 'Mål',
            data: [90, 90, 90, 90, 90, 90],
            backgroundColor: '#F59E0B',
            borderColor: '#F59E0B',
            borderWidth: 2
          }
        ]
      });

      // Load reports (mock data for now)
      const mockReports: ReportData[] = [
        {
          id: '1',
          title: 'Månedlig personalrapport',
          type: 'employee',
          status: 'generated',
          createdAt: new Date(Date.now() - 86400000).toISOString(),
          updatedAt: new Date().toISOString(),
          generatedBy: userProfile.displayName || 'System',
          lastGenerated: new Date().toISOString()
        },
        {
          id: '2',
          title: 'Fraværsanalyse Q1',
          type: 'attendance',
          status: 'generated',
          createdAt: new Date(Date.now() - 172800000).toISOString(),
          updatedAt: new Date().toISOString(),
          generatedBy: userProfile.displayName || 'System',
          lastGenerated: new Date(Date.now() - 86400000).toISOString()
        },
        {
          id: '3',
          title: 'HMS-rapport Mars',
          type: 'hms',
          status: 'scheduled',
          createdAt: new Date(Date.now() - 259200000).toISOString(),
          updatedAt: new Date().toISOString(),
          generatedBy: userProfile.displayName || 'System',
          schedule: 'monthly'
        },
        {
          id: '4',
          title: 'Skiftplananalyse',
          type: 'performance',
          status: 'draft',
          createdAt: new Date(Date.now() - 345600000).toISOString(),
          updatedAt: new Date().toISOString(),
          generatedBy: userProfile.displayName || 'System'
        }
      ];

      setReports(mockReports);

    } catch (error) {
      console.error('Error loading data:', error);
      setError('Feil ved lasting av data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [userProfile?.companyId]);

  const handleGenerateReport = async (type: string) => {
    try {
      setError(null);
      // Simulate report generation
      await new Promise(resolve => setTimeout(resolve, 2000));
      setSuccess('Rapport generert');
      loadData();
    } catch (error) {
      console.error('Error generating report:', error);
      setError('Feil ved generering av rapport');
    }
  };

  const handleDownloadReport = async (reportId: string) => {
    try {
      setError(null);
      // Simulate download
      await new Promise(resolve => setTimeout(resolve, 1000));
      setSuccess('Rapport lastet ned');
    } catch (error) {
      console.error('Error downloading report:', error);
      setError('Feil ved nedlasting av rapport');
    }
  };

  const handleScheduleReport = async (reportId: string, schedule: string) => {
    try {
      setError(null);
      // Simulate scheduling
      await new Promise(resolve => setTimeout(resolve, 1000));
      setSuccess('Rapport planlagt');
      loadData();
    } catch (error) {
      console.error('Error scheduling report:', error);
      setError('Feil ved planlegging av rapport');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('nb-NO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'generated':
        return { bg: 'var(--green-100)', color: 'var(--green-700)' };
      case 'scheduled':
        return { bg: 'var(--blue-100)', color: 'var(--blue-700)' };
      case 'draft':
        return { bg: 'var(--yellow-100)', color: 'var(--yellow-700)' };
      case 'error':
        return { bg: 'var(--red-100)', color: 'var(--red-700)' };
      default:
        return { bg: 'var(--gray-100)', color: 'var(--gray-700)' };
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'employee':
        return <Users style={{ width: '16px', height: '16px' }} />;
      case 'attendance':
        return <Clock style={{ width: '16px', height: '16px' }} />;
      case 'performance':
        return <TrendingUp style={{ width: '16px', height: '16px' }} />;
      case 'financial':
        return <DollarSign style={{ width: '16px', height: '16px' }} />;
      case 'hms':
        return <AlertTriangle style={{ width: '16px', height: '16px' }} />;
      default:
        return <FileText style={{ width: '16px', height: '16px' }} />;
    }
  };

  if (loading) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
        <div className="loading" style={{ margin: '0 auto 1rem' }}></div>
        <p style={{ color: '#666' }}>Laster rapporter...</p>
      </div>
    );
  }

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
          <div className="card-icon">
            <BarChart3 />
          </div>
          <div>
            <h1 className="page-title">📊 Rapporter</h1>
            <p className="page-subtitle">
              Generer og administrer rapporter og analyser
            </p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'flex', borderBottom: '2px solid var(--gray-200)', gap: '0' }}>
            <button
              onClick={() => setActiveTab('overview')}
              style={{
                padding: '1rem 2rem',
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                borderBottom: activeTab === 'overview' ? '2px solid var(--primary)' : '2px solid transparent',
                color: activeTab === 'overview' ? 'var(--primary)' : 'var(--gray-600)',
                fontWeight: activeTab === 'overview' ? '600' : '500',
                fontSize: 'var(--font-size-base)'
              }}
            >
              <BarChart3 style={{ width: '16px', height: '16px', marginRight: '0.5rem', display: 'inline' }} />
              Oversikt
            </button>
            <button
              onClick={() => setActiveTab('reports')}
              style={{
                padding: '1rem 2rem',
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                borderBottom: activeTab === 'reports' ? '2px solid var(--primary)' : '2px solid transparent',
                color: activeTab === 'reports' ? 'var(--primary)' : 'var(--gray-600)',
                fontWeight: activeTab === 'reports' ? '600' : '500',
                fontSize: 'var(--font-size-base)'
              }}
            >
              <FileText style={{ width: '16px', height: '16px', marginRight: '0.5rem', display: 'inline' }} />
              Rapporter
            </button>
            <button
              onClick={() => setActiveTab('templates')}
              style={{
                padding: '1rem 2rem',
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                borderBottom: activeTab === 'templates' ? '2px solid var(--primary)' : '2px solid transparent',
                color: activeTab === 'templates' ? 'var(--primary)' : 'var(--gray-600)',
                fontWeight: activeTab === 'templates' ? '600' : '500',
                fontSize: 'var(--font-size-base)'
              }}
            >
              <Settings style={{ width: '16px', height: '16px', marginRight: '0.5rem', display: 'inline' }} />
              Maler
            </button>
            <button
              onClick={() => setActiveTab('scheduled')}
              style={{
                padding: '1rem 2rem',
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                borderBottom: activeTab === 'scheduled' ? '2px solid var(--primary)' : '2px solid transparent',
                color: activeTab === 'scheduled' ? 'var(--primary)' : 'var(--gray-600)',
                fontWeight: activeTab === 'scheduled' ? '600' : '500',
                fontSize: 'var(--font-size-base)'
              }}
            >
              <Calendar style={{ width: '16px', height: '16px', marginRight: '0.5rem', display: 'inline' }} />
              Planlagte
            </button>
          </div>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <button 
            onClick={() => setShowCreateModal(true)}
            className="btn btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <Plus style={{ width: '16px', height: '16px' }} />
            Ny rapport
          </button>
          <button 
            onClick={loadData}
            className="btn btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <RefreshCw style={{ width: '16px', height: '16px' }} />
            Oppdater
          </button>
        </div>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <div style={{ 
          padding: '1rem', 
          background: 'var(--green-50)', 
          border: '1px solid var(--green-200)', 
          borderRadius: 'var(--radius-lg)', 
          marginBottom: '2rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <CheckCircle style={{ width: '20px', height: '20px', color: 'var(--green-600)' }} />
          <p style={{ color: 'var(--green-700)', fontSize: 'var(--font-size-sm)' }}>{success}</p>
        </div>
      )}

      {error && (
        <div style={{ 
          padding: '1rem', 
          background: 'var(--red-50)', 
          border: '1px solid var(--red-200)', 
          borderRadius: 'var(--radius-lg)', 
          marginBottom: '2rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <XCircle style={{ width: '20px', height: '20px', color: 'var(--red-600)' }} />
          <p style={{ color: 'var(--red-700)', fontSize: 'var(--font-size-sm)' }}>{error}</p>
        </div>
      )}

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div>
          {/* Stats Grid */}
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-number">{stats.totalEmployees}</div>
              <div className="stat-label">Totalt ansatte</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">{stats.totalDepartments}</div>
              <div className="stat-label">Avdelinger</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">{stats.activeShifts}</div>
              <div className="stat-label">Aktive skift</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">{stats.openDeviations}</div>
              <div className="stat-label">Åpne avvik</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">{stats.totalDocuments}</div>
              <div className="stat-label">Dokumenter</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">{reports.length}</div>
              <div className="stat-label">Rapporter</div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="card" style={{ marginBottom: '2rem' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#333', marginBottom: '1rem' }}>
              Hurtiggenerering
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
              <button 
                onClick={() => handleGenerateReport('employee')}
                className="btn btn-secondary"
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '1rem' }}
              >
                <Users style={{ width: '20px', height: '20px' }} />
                Personalrapport
              </button>
              <button 
                onClick={() => handleGenerateReport('attendance')}
                className="btn btn-secondary"
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '1rem' }}
              >
                <Clock style={{ width: '20px', height: '20px' }} />
                Fraværsrapport
              </button>
              <button 
                onClick={() => handleGenerateReport('performance')}
                className="btn btn-secondary"
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '1rem' }}
              >
                <TrendingUp style={{ width: '20px', height: '20px' }} />
                Ytelsesrapport
              </button>
              <button 
                onClick={() => handleGenerateReport('hms')}
                className="btn btn-secondary"
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '1rem' }}
              >
                <AlertTriangle style={{ width: '20px', height: '20px' }} />
                HMS-rapport
              </button>
            </div>
          </div>

          {/* Charts Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '2rem', marginBottom: '2rem' }}>
            {/* Attendance Chart */}
            <div className="card">
              <h3 style={{ fontSize: '1.1rem', fontWeight: '600', color: '#333', marginBottom: '1rem' }}>
                Fravær siste 7 dager
              </h3>
              <div style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', borderRadius: 'var(--radius-md)' }}>
                <div style={{ textAlign: 'center' }}>
                  <BarChart style={{ width: '64px', height: '64px', color: '#cbd5e1', margin: '0 auto 1rem' }} />
                  <p style={{ color: '#64748b', fontSize: '0.875rem' }}>Diagram kommer snart</p>
                  <p style={{ color: '#94a3b8', fontSize: '0.75rem' }}>Tilstede: 93% | Fravær: 7%</p>
                </div>
              </div>
            </div>

            {/* Performance Chart */}
            <div className="card">
              <h3 style={{ fontSize: '1.1rem', fontWeight: '600', color: '#333', marginBottom: '1rem' }}>
                Ytelse vs. mål
              </h3>
              <div style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', borderRadius: 'var(--radius-md)' }}>
                <div style={{ textAlign: 'center' }}>
                  <LineChart style={{ width: '64px', height: '64px', color: '#cbd5e1', margin: '0 auto 1rem' }} />
                  <p style={{ color: '#64748b', fontSize: '0.875rem' }}>Diagram kommer snart</p>
                  <p style={{ color: '#94a3b8', fontSize: '0.75rem' }}>Gjennomsnitt: 91% | Mål: 90%</p>
                </div>
              </div>
            </div>

            {/* Department Chart */}
            <div className="card">
              <h3 style={{ fontSize: '1.1rem', fontWeight: '600', color: '#333', marginBottom: '1rem' }}>
                Ansatte per avdeling
              </h3>
              <div style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', borderRadius: 'var(--radius-md)' }}>
                <div style={{ textAlign: 'center' }}>
                  <PieChart style={{ width: '64px', height: '64px', color: '#cbd5e1', margin: '0 auto 1rem' }} />
                  <p style={{ color: '#64748b', fontSize: '0.875rem' }}>Diagram kommer snart</p>
                  <p style={{ color: '#94a3b8', fontSize: '0.75rem' }}>Totalt: {stats.totalEmployees} ansatte</p>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="card">
              <h3 style={{ fontSize: '1.1rem', fontWeight: '600', color: '#333', marginBottom: '1rem' }}>
                Siste aktivitet
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {reports.slice(0, 5).map((report) => (
                  <div key={report.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.5rem', background: '#f8fafc', borderRadius: 'var(--radius-sm)' }}>
                    <div className="card-icon" style={{ width: '32px', height: '32px' }}>
                      {getTypeIcon(report.type)}
                    </div>
                    <div style={{ flex: '1' }}>
                      <p style={{ fontSize: '0.875rem', fontWeight: '500', color: '#333' }}>{report.title}</p>
                      <p style={{ fontSize: '0.75rem', color: '#666' }}>{formatDate(report.createdAt)}</p>
                    </div>
                    <span style={{ 
                      padding: '0.25rem 0.5rem', 
                      borderRadius: 'var(--radius-sm)', 
                      fontSize: '0.75rem', 
                      fontWeight: '500',
                      ...getStatusColor(report.status)
                    }}>
                      {report.status === 'generated' ? 'Generert' : 
                       report.status === 'scheduled' ? 'Planlagt' : 
                       report.status === 'draft' ? 'Kladd' : 'Feil'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reports Tab */}
      {activeTab === 'reports' && (
        <div>
          {/* Search and Filters */}
          <div className="card" style={{ marginBottom: '2rem' }}>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <div className="search-container" style={{ flex: '1', minWidth: '300px' }}>
                <Search className="search-icon" />
                <input
                  type="text"
                  placeholder="Søk i rapporter..."
                  className="search-input"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="form-select"
                style={{ minWidth: '150px' }}
              >
                <option value="all">Alle typer</option>
                <option value="employee">Personal</option>
                <option value="attendance">Fravær</option>
                <option value="performance">Ytelse</option>
                <option value="financial">Økonomi</option>
                <option value="hms">HMS</option>
                <option value="custom">Egendefinert</option>
              </select>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="form-select"
                style={{ minWidth: '120px' }}
              >
                <option value="all">Alle status</option>
                <option value="generated">Generert</option>
                <option value="scheduled">Planlagt</option>
                <option value="draft">Kladd</option>
                <option value="error">Feil</option>
              </select>
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="form-select"
                style={{ minWidth: '120px' }}
              >
                <option value="7d">Siste 7 dager</option>
                <option value="30d">Siste 30 dager</option>
                <option value="90d">Siste 90 dager</option>
                <option value="1y">Siste år</option>
              </select>
            </div>
          </div>

          {/* Reports List */}
          <div className="grid grid-cols-1">
            {reports.map((report) => (
              <div key={report.id} className="card">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: '1' }}>
                    <div className="card-icon">
                      {getTypeIcon(report.type)}
                    </div>
                    <div style={{ flex: '1' }}>
                      <h3 style={{ 
                        fontWeight: '600', 
                        color: '#333',
                        fontSize: '1.1rem',
                        marginBottom: '0.25rem'
                      }}>
                        {report.title}
                      </h3>
                      <p style={{ color: '#666', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                        Opprettet: {formatDate(report.createdAt)}
                        {report.lastGenerated && ` | Sist generert: ${formatDate(report.lastGenerated)}`}
                      </p>
                      <p style={{ color: '#666', fontSize: '0.875rem' }}>
                        Generert av: {report.generatedBy}
                      </p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ 
                      padding: '0.25rem 0.75rem', 
                      borderRadius: 'var(--radius-sm)', 
                      fontSize: 'var(--font-size-xs)', 
                      fontWeight: '500',
                      ...getStatusColor(report.status)
                    }}>
                      {report.status === 'generated' ? 'Generert' : 
                       report.status === 'scheduled' ? 'Planlagt' : 
                       report.status === 'draft' ? 'Kladd' : 'Feil'}
                    </span>
                    <button className="btn btn-secondary" style={{ padding: '0.5rem' }}>
                      <ChevronDown style={{ width: '16px', height: '16px' }} />
                    </button>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                  <button 
                    onClick={() => setSelectedReport(report)}
                    className="btn btn-secondary" 
                    style={{ fontSize: '0.75rem', padding: '0.25rem 0.75rem' }}
                  >
                    <Eye style={{ width: '14px', height: '14px' }} />
                    Se
                  </button>
                  {report.status === 'generated' && (
                    <button 
                      onClick={() => handleDownloadReport(report.id)}
                      className="btn btn-secondary" 
                      style={{ fontSize: '0.75rem', padding: '0.25rem 0.75rem' }}
                    >
                      <Download style={{ width: '14px', height: '14px' }} />
                      Last ned
                    </button>
                  )}
                  <button 
                    onClick={() => handleScheduleReport(report.id, 'weekly')}
                    className="btn btn-secondary" 
                    style={{ fontSize: '0.75rem', padding: '0.25rem 0.75rem' }}
                  >
                    <Calendar style={{ width: '14px', height: '14px' }} />
                    Planlegg
                  </button>
                  <button 
                    onClick={() => setShowPreviewModal(true)}
                    className="btn btn-secondary" 
                    style={{ fontSize: '0.75rem', padding: '0.25rem 0.75rem' }}
                  >
                    <Printer style={{ width: '14px', height: '14px' }} />
                    Skriv ut
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Templates Tab */}
      {activeTab === 'templates' && (
        <div>
          <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
            <Settings style={{ width: '64px', height: '64px', color: '#ccc', margin: '0 auto 1rem' }} />
            <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#333', marginBottom: '0.5rem' }}>
              Rapportmaler
            </h3>
            <p style={{ color: '#666', marginBottom: '1.5rem' }}>
              Kommer snart - egendefinerte rapportmaler
            </p>
            <button className="btn btn-primary">
              <Plus style={{ width: '16px', height: '16px' }} />
              Opprett mal
            </button>
          </div>
        </div>
      )}

      {/* Scheduled Tab */}
      {activeTab === 'scheduled' && (
        <div>
          <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
            <Calendar style={{ width: '64px', height: '64px', color: '#ccc', margin: '0 auto 1rem' }} />
            <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#333', marginBottom: '0.5rem' }}>
              Planlagte rapporter
            </h3>
            <p style={{ color: '#666', marginBottom: '1.5rem' }}>
              Kommer snart - automatisk rapportgenerering
            </p>
            <button className="btn btn-primary">
              <Plus style={{ width: '16px', height: '16px' }} />
              Planlegg rapport
            </button>
          </div>
        </div>
      )}

      {/* Create Report Modal */}
      {showCreateModal && (
        <div style={{ 
          position: 'fixed', 
          top: 0, 
          left: 0, 
          right: 0, 
          bottom: 0, 
          background: 'rgba(0, 0, 0, 0.5)', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div className="card" style={{ width: '90%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: 'var(--font-size-xl)', fontWeight: '600', color: 'var(--gray-900)' }}>
                Opprett ny rapport
              </h2>
              <button
                onClick={() => setShowCreateModal(false)}
                style={{ 
                  padding: '0.5rem', 
                  borderRadius: 'var(--radius-md)', 
                  border: 'none',
                  background: 'var(--gray-100)',
                  cursor: 'pointer'
                }}
              >
                <X style={{ width: '20px', height: '20px' }} />
              </button>
            </div>

            <div style={{ display: 'grid', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: 'var(--gray-700)' }}>
                  Rapporttittel
                </label>
                <input
                  type="text"
                  style={{ 
                    width: '100%', 
                    padding: '0.75rem', 
                    border: '1px solid var(--gray-300)', 
                    borderRadius: 'var(--radius-lg)', 
                    outline: 'none'
                  }}
                  placeholder="Eks: Månedlig personalrapport"
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: 'var(--gray-700)' }}>
                  Rapporttype
                </label>
                <select
                  style={{ 
                    width: '100%', 
                    padding: '0.75rem', 
                    border: '1px solid var(--gray-300)', 
                    borderRadius: 'var(--radius-lg)', 
                    outline: 'none'
                  }}
                >
                  <option value="employee">Personalrapport</option>
                  <option value="attendance">Fraværsrapport</option>
                  <option value="performance">Ytelsesrapport</option>
                  <option value="financial">Økonomirapport</option>
                  <option value="hms">HMS-rapport</option>
                  <option value="custom">Egendefinert</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: 'var(--gray-700)' }}>
                  Periode
                </label>
                <select
                  style={{ 
                    width: '100%', 
                    padding: '0.75rem', 
                    border: '1px solid var(--gray-300)', 
                    borderRadius: 'var(--radius-lg)', 
                    outline: 'none'
                  }}
                >
                  <option value="7d">Siste 7 dager</option>
                  <option value="30d">Siste 30 dager</option>
                  <option value="90d">Siste 90 dager</option>
                  <option value="1y">Siste år</option>
                  <option value="custom">Egendefinert periode</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: 'var(--gray-700)' }}>
                  Format
                </label>
                <select
                  style={{ 
                    width: '100%', 
                    padding: '0.75rem', 
                    border: '1px solid var(--gray-300)', 
                    borderRadius: 'var(--radius-lg)', 
                    outline: 'none'
                  }}
                >
                  <option value="pdf">PDF</option>
                  <option value="excel">Excel</option>
                  <option value="csv">CSV</option>
                  <option value="json">JSON</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowCreateModal(false)}
                style={{ 
                  padding: '0.75rem 1.5rem', 
                  border: '1px solid var(--gray-300)', 
                  borderRadius: 'var(--radius-lg)', 
                  background: 'var(--white)',
                  color: 'var(--gray-700)',
                  cursor: 'pointer'
                }}
              >
                Avbryt
              </button>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  handleGenerateReport('custom');
                }}
                className="btn btn-primary"
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
              >
                <BarChart3 style={{ width: '16px', height: '16px' }} />
                Generer rapport
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 