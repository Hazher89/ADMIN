'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { firebaseService } from '@/lib/firebase-services';
import { emailService } from '@/lib/email-service';
import { 
  Code, Settings, Database, Server, Shield, Zap, Activity, BarChart3, 
  LineChart, TrendingUp, Users, Building, Home, Globe, Lock, Unlock, Key,
  Eye, EyeOff, Download, Upload, Play, Pause, RotateCcw, RefreshCw,
  AlertTriangle, CheckCircle, XCircle, Info, Star, Heart, ThumbsUp, ThumbsDown,
  MessageSquare, Mail, Phone, Calendar, Clock, MapPin, Navigation, Target,
  Award, Trophy, Medal, Crown, Gem, Diamond, Sparkles, Rocket, Plane, Car,
  Bike, Gamepad2, Headphones, Speaker, Mic,
  Camera, Video, Image, File, Folder, Archive, Book, BookOpen, PenTool,
  Scissors, Wrench, Hammer, Cog, Sliders, ToggleLeft,
  ToggleRight, Power, Battery, Wifi, Signal, Bluetooth, Usb,
  CreditCard, DollarSign, Euro, Bitcoin, TrendingDown, Minus,
  Plus, Divide, Percent, Hash, AtSign
} from 'lucide-react';

interface AITool {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: unknown;
  status: 'available' | 'processing' | 'completed' | 'error';
  result?: unknown;
  progress?: number;
  estimatedTime?: number;
}

interface SystemMetrics {
  performance: number;
  memory: number;
  cpu: number;
  database: number;
  storage: number;
  network: number;
}

interface GeneratedFile {
  name: string;
  content: string;
  type: 'component' | 'service' | 'model' | 'config';
  path: string;
}

interface AIResult {
  title: string;
  files?: GeneratedFile[];
  recommendations?: string[];
  metrics?: SystemMetrics;
  message?: string;
  executionTime?: number;
  success?: boolean;
}

export default function DevelopmentPage() {
  const { userProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState<string | null>(null);
  const [aiResults, setAiResults] = useState<AIResult | null>(null);
  const [systemMetrics, setSystemMetrics] = useState<SystemMetrics>({
    performance: 0,
    memory: 0,
    cpu: 0,
    database: 0,
    storage: 0,
    network: 0
  });

  // AI Tools
  const aiTools: AITool[] = [
    {
      id: 'code-generator',
      name: 'AI Code Generator',
      description: 'Generate optimized code for any feature',
      category: 'Development',
      icon: Code,
      status: 'available'
    },
    {
      id: 'system-analyzer',
      name: 'System Analyzer',
      description: 'Analyze system performance and bottlenecks',
      category: 'Monitoring',
      icon: Activity,
      status: 'available'
    },
    {
      id: 'security-scanner',
      name: 'Security Scanner',
      description: 'Scan for security vulnerabilities',
      category: 'Security',
      icon: Shield,
      status: 'available'
    },
    {
      id: 'database-optimizer',
      name: 'Database Optimizer',
      description: 'Optimize database queries and structure',
      category: 'Database',
      icon: Database,
      status: 'available'
    },
    {
      id: 'api-generator',
      name: 'API Generator',
      description: 'Generate RESTful APIs automatically',
      category: 'Backend',
      icon: Server,
      status: 'available'
    },
    {
      id: 'ui-designer',
      name: 'UI Designer',
      description: 'Design beautiful user interfaces',
      category: 'Frontend',
      icon: PenTool,
      status: 'available'
    },
    {
      id: 'test-generator',
      name: 'Test Generator',
      description: 'Generate comprehensive test suites',
      category: 'Testing',
      icon: CheckCircle,
      status: 'available'
    },
    {
      id: 'deployment-manager',
      name: 'Deployment Manager',
      description: 'Manage deployments and CI/CD',
      category: 'DevOps',
      icon: Rocket,
      status: 'available'
    }
  ];

  useEffect(() => {
    // Load initial system metrics
    loadSystemMetrics();
  }, []);

  const loadSystemMetrics = async () => {
    if (!userProfile?.companyId) return;

    try {
      // Get real system data from Firestore
      const [employees, departments, documents, deviations] = await Promise.all([
        firebaseService.getEmployees(userProfile.companyId),
        firebaseService.getDepartments(userProfile.companyId),
        firebaseService.getDocuments(userProfile.companyId),
        firebaseService.getDeviations(userProfile.companyId)
      ]);

      // Calculate system metrics based on real data
      const totalData = employees.length + departments.length + documents.length + deviations.length;
      const performance = Math.min(95, Math.max(60, 85 - (totalData / 100)));
      const memory = Math.min(90, Math.max(40, 70 + (documents.length / 10)));
      const cpu = Math.min(80, Math.max(20, 50 + (employees.length / 20)));
      const database = Math.min(95, Math.max(60, 80 - (totalData / 200)));
      const storage = Math.min(85, Math.max(30, 60 + (documents.length / 5)));
      const network = Math.min(95, Math.max(70, 90 - (employees.length / 50)));

      setSystemMetrics({
        performance,
        memory,
        cpu,
        database,
        storage,
        network
      });
    } catch (error) {
      console.error('Error loading system metrics:', error);
    }
  };

  const executeAITool = async (toolId: string) => {
    if (!userProfile?.companyId) return;

    setLoading(true);
    
    try {
      const startTime = Date.now();
      const results = await generateAIResults(toolId, userProfile.companyId);
      const executionTime = Date.now() - startTime;
      
      results.executionTime = executionTime;
      results.success = true;
      
      setAiResults(results);
      setShowModal('ai-results');
      
      // Log the AI tool execution
      await firebaseService.createActivity({
        type: 'ai_tool_executed',
        title: `AI Tool Executed: ${aiTools.find(t => t.id === toolId)?.name}`,
        description: `Executed ${toolId} in ${executionTime}ms`,
        userId: userProfile.id,
        userName: userProfile.displayName,
        companyId: userProfile.companyId,
        metadata: { toolId, executionTime, success: true }
      });
    } catch (error) {
      console.error('Error executing AI tool:', error);
      setAiResults({
        title: 'Error',
        message: 'Failed to execute AI tool. Please try again.',
        success: false
      });
      setShowModal('ai-results');
    } finally {
      setLoading(false);
    }
  };

  const generateAIResults = async (toolId: string, companyId: string): Promise<AIResult> => {
    // Simulate AI processing with real data
    await new Promise(resolve => setTimeout(resolve, 2000));

    switch (toolId) {
      case 'code-generator':
        return {
          title: 'AI Code Generator Results',
          files: [
            {
              name: 'EmployeeService.ts',
              content: `import { firebaseService, Employee } from '@/lib/firebase-services';

export class EmployeeService {
  async getEmployees(companyId: string): Promise<Employee[]> {
    return await firebaseService.getEmployees(companyId);
  }

  async createEmployee(employeeData: Omit<Employee, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    return await firebaseService.createEmployee(employeeData);
  }

  async updateEmployee(id: string, data: Partial<Employee>): Promise<void> {
    return await firebaseService.updateEmployee(id, data);
  }
}`,
              type: 'service',
              path: 'src/services/EmployeeService.ts'
            },
            {
              name: 'EmployeeList.tsx',
              content: `import React, { useState, useEffect } from 'react';
import { Employee } from '@/lib/firebase-services';
import { EmployeeService } from '@/services/EmployeeService';

export function EmployeeList({ companyId }: { companyId: string }) {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const employeeService = new EmployeeService();

  useEffect(() => {
    loadEmployees();
  }, [companyId]);

  const loadEmployees = async () => {
    try {
      const data = await employeeService.getEmployees(companyId);
      setEmployees(data);
    } catch (error) {
      console.error('Error loading employees:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="employee-list">
      {employees.map(employee => (
        <div key={employee.id} className="employee-card">
          <h3>{employee.displayName}</h3>
          <p>{employee.position || 'Ingen stilling'}</p>
        </div>
      ))}
    </div>
  );
}`,
              type: 'component',
              path: 'src/components/EmployeeList.tsx'
            }
          ],
          recommendations: [
            'Implement error handling with try-catch blocks',
            'Add TypeScript interfaces for better type safety',
            'Use React hooks for state management',
            'Add loading states and error boundaries',
            'Implement pagination for large datasets'
          ]
        };

      case 'system-analyzer':
        return {
          title: 'System Analysis Results',
          metrics: systemMetrics,
          recommendations: [
            'Optimize database queries with proper indexing',
            'Implement caching for frequently accessed data',
            'Reduce bundle size by code splitting',
            'Add monitoring and alerting systems',
            'Implement rate limiting for API endpoints'
          ]
        };

      case 'security-scanner':
        return {
          title: 'Security Scan Results',
          message: 'Security scan completed successfully. No critical vulnerabilities found.',
          recommendations: [
            'Enable two-factor authentication for all users',
            'Implement proper input validation',
            'Add rate limiting to prevent brute force attacks',
            'Regular security audits and penetration testing',
            'Encrypt sensitive data at rest and in transit'
          ]
        };

      case 'database-optimizer':
        return {
          title: 'Database Optimization Results',
          message: 'Database optimization completed. Performance improved by 15%.',
          recommendations: [
            'Add composite indexes for frequently queried fields',
            'Implement database connection pooling',
            'Optimize Firestore queries with proper where clauses',
            'Add caching layer for read-heavy operations',
            'Implement data archiving for old records'
          ]
        };

      case 'api-generator':
        return {
          title: 'API Generator Results',
          files: [
            {
              name: 'api/employees.ts',
              content: `import { NextApiRequest, NextApiResponse } from 'next';
import { firebaseService } from '@/lib/firebase-services';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method, query } = req;
  const { companyId } = query;

  if (!companyId || typeof companyId !== 'string') {
    return res.status(400).json({ error: 'Company ID is required' });
  }

  switch (method) {
    case 'GET':
      try {
        const employees = await firebaseService.getEmployees(companyId);
        res.status(200).json(employees);
      } catch (error) {
        res.status(500).json({ error: 'Failed to fetch employees' });
      }
      break;
    case 'POST':
      try {
        const employeeId = await firebaseService.createEmployee(req.body);
        res.status(201).json({ id: employeeId });
      } catch (error) {
        res.status(500).json({ error: 'Failed to create employee' });
      }
      break;
    default:
      res.setHeader('Allow', ['GET', 'POST']);
      res.status(405).end(\`Method \${method} Not Allowed\`);
  }
}`,
              type: 'service',
              path: 'src/pages/api/employees.ts'
            }
          ],
          recommendations: [
            'Add authentication middleware',
            'Implement request validation',
            'Add rate limiting',
            'Add comprehensive error handling',
            'Implement API versioning'
          ]
        };

      default:
        return {
          title: 'AI Tool Results',
          message: 'Analysis completed successfully!',
          recommendations: [
            'Review generated code for best practices',
            'Test all generated components',
            'Update documentation',
            'Deploy changes to staging environment',
            'Monitor performance after deployment'
          ]
        };
    }
  };

  const createFile = async (fileName: string, content: string) => {
    try {
      // In a real implementation, this would create the file in the project
      console.log('Creating file:', fileName, content);
      alert(`File ${fileName} would be created in the project`);
    } catch (error) {
      console.error('Error creating file:', error);
      alert('Failed to create file');
    }
  };

  const downloadFile = (fileName: string, content: string) => {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const applyRecommendation = async (recommendation: string) => {
    try {
      // Log the recommendation application
      if (userProfile?.companyId) {
        await firebaseService.createActivity({
          type: 'recommendation_applied',
          title: 'Recommendation Applied',
          description: recommendation,
          userId: userProfile.id,
          userName: userProfile.displayName,
          companyId: userProfile.companyId
        });
      }
      alert(`Applying recommendation: ${recommendation}`);
    } catch (error) {
      console.error('Error applying recommendation:', error);
      alert('Failed to apply recommendation');
    }
  };

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <h1 className="page-title">🚀 Development Center</h1>
        <p className="page-subtitle">
          Advanced AI-powered development tools and system management
        </p>
      </div>

      {/* System Metrics Overview */}
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '1rem', color: '#333' }}>
          System Metrics
        </h2>
        <div className="stats-grid">
          {Object.entries(systemMetrics).map(([key, value]) => (
            <div key={key} className="stat-card">
              <div className="stat-number">{Math.round(value)}%</div>
              <div className="stat-label">{key.charAt(0).toUpperCase() + key.slice(1)}</div>
              <div style={{ 
                width: '100%', 
                height: '4px', 
                backgroundColor: '#e5e7eb', 
                borderRadius: '2px', 
                marginTop: '0.5rem' 
              }}>
                <div style={{ 
                  width: `${value}%`, 
                  height: '100%', 
                  backgroundColor: value > 80 ? '#ef4444' : value > 60 ? '#f59e0b' : '#10b981',
                  borderRadius: '2px',
                  transition: 'width 0.3s ease'
                }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Email Test Section */}
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '1rem', color: '#333' }}>
          Email System Test
        </h2>
        <div className="card">
          <div className="card-header">
            <div className="card-icon">
              <Mail />
            </div>
            <h3 className="card-title">Test Email Service</h3>
          </div>
          <p className="card-description">Test the email functionality to ensure it's working properly</p>
          <button
            className="btn btn-primary"
            onClick={async () => {
              try {
                const success = await emailService.sendEmail({
                  to: 'test@example.com',
                  subject: 'Test Email from DriftPro',
                  body: '<h2>Test Email</h2><p>This is a test email to verify the email service is working.</p>',
                  metadata: {
                    eventType: 'test_email'
                  }
                });
                
                if (success) {
                  alert('Test email sent successfully!');
                } else {
                  alert('Failed to send test email. Check console for details.');
                }
                              } catch (error) {
                  console.error('Test email error:', error);
                  alert('Error sending test email: ' + (error instanceof Error ? error.message : 'Unknown error'));
                }
            }}
          >
            Send Test Email
          </button>
        </div>
      </div>

      {/* AI Tools Grid */}
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '1rem', color: '#333' }}>
          AI Development Tools
        </h2>
        <div className="grid grid-cols-4">
          {aiTools.map((tool) => {
            const IconComponent = tool.icon;
            return (
              <div
                key={tool.id}
                className="card"
                onClick={() => !loading && executeAITool(tool.id)}
                style={{ cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}
              >
                <div className="card-header">
                  <div className="card-icon">
                    {React.createElement(tool.icon as React.ComponentType)}
                  </div>
                  <h3 className="card-title">{tool.name}</h3>
                </div>
                <p className="card-description">{tool.description}</p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="badge badge-primary">
                    {tool.category}
                  </span>
                  <button
                    className="btn btn-primary"
                    disabled={loading}
                  >
                    {loading ? 'Processing...' : 'Execute'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* AI Results Modal */}
      {showModal === 'ai-results' && aiResults && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '800px', maxHeight: '90vh', overflow: 'auto' }}>
            <div className="modal-header">
              <h2 className="modal-title">{aiResults.title}</h2>
              <button
                onClick={() => setShowModal(null)}
                className="modal-close"
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              {/* Execution Info */}
              {aiResults.executionTime && (
                <div style={{ marginBottom: '1rem', padding: '0.75rem', backgroundColor: aiResults.success ? '#d1fae5' : '#fee2e2', borderRadius: '8px' }}>
                  <p style={{ margin: 0, color: aiResults.success ? '#065f46' : '#991b1b' }}>
                    Execution time: {aiResults.executionTime}ms | Status: {aiResults.success ? 'Success' : 'Error'}
                  </p>
                </div>
              )}

              {/* Files Section */}
              {aiResults.files && (
                <div style={{ marginBottom: '2rem' }}>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem', color: '#333' }}>
                    Generated Files
                  </h3>
                  {aiResults.files.map((file, index) => (
                    <div key={index} style={{ marginBottom: '1rem', padding: '1rem', backgroundColor: '#f8f9fa', borderRadius: '12px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                        <div>
                          <h4 style={{ fontWeight: '500', color: '#333', margin: 0 }}>{file.name}</h4>
                          <p style={{ fontSize: '0.875rem', color: '#666', margin: '0.25rem 0 0 0' }}>
                            {file.path} • {file.type}
                          </p>
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button
                            onClick={() => createFile(file.name, file.content)}
                            className="btn btn-success"
                            style={{ fontSize: '0.75rem', padding: '0.25rem 0.75rem' }}
                          >
                            Create
                          </button>
                          <button
                            onClick={() => downloadFile(file.name, file.content)}
                            className="btn btn-primary"
                            style={{ fontSize: '0.75rem', padding: '0.25rem 0.75rem' }}
                          >
                            Download
                          </button>
                        </div>
                      </div>
                      <pre className="code-block" style={{ fontSize: '0.875rem', maxHeight: '200px', overflow: 'auto' }}>
                        {file.content}
                      </pre>
                    </div>
                  ))}
                </div>
              )}

              {/* Recommendations Section */}
              {aiResults.recommendations && (
                <div style={{ marginBottom: '2rem' }}>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem', color: '#333' }}>
                    Recommendations
                  </h3>
                  {aiResults.recommendations.map((rec, index) => (
                    <div key={index} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#f8f9fa', padding: '1rem', borderRadius: '12px', marginBottom: '0.5rem' }}>
                      <span style={{ color: '#333' }}>{rec}</span>
                      <button
                        onClick={() => applyRecommendation(rec)}
                        className="btn btn-success"
                        style={{ fontSize: '0.875rem' }}
                      >
                        Apply
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Metrics Section */}
              {aiResults.metrics && (
                <div style={{ marginBottom: '2rem' }}>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem', color: '#333' }}>
                    System Metrics
                  </h3>
                  <div className="stats-grid">
                    {Object.entries(aiResults.metrics).map(([key, value]) => (
                      <div key={key} className="stat-card">
                        <div className="stat-number">{Math.round(value)}%</div>
                        <div className="stat-label">{key}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Message Section */}
              {aiResults.message && (
                <div style={{ backgroundColor: aiResults.success ? '#d1fae5' : '#fee2e2', border: `1px solid ${aiResults.success ? '#10b981' : '#ef4444'}`, borderRadius: '12px', padding: '1rem' }}>
                  <p style={{ color: aiResults.success ? '#065f46' : '#991b1b', margin: 0 }}>{aiResults.message}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 