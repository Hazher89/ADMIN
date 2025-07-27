'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { documentService, userService, departmentService } from '@/lib/firebase-services';
import { Document, DocumentPermission, User, Department } from '@/types';
import { 
  FileText, 
  Search, 
  Filter, 
  Plus, 
  Eye, 
  Edit, 
  Trash2,
  Download,
  Share,
  Lock,
  Unlock,
  Users,
  Building,
  Calendar,
  File,
  FileImage,
  FileVideo,
  FileArchive,
  FileCode
} from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function DocumentsPage() {
  const { userProfile, isAdmin, isDepartmentLeader } = useAuth();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [selectedPermission, setSelectedPermission] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);

  useEffect(() => {
    loadData();
  }, []);

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

      // Load documents based on role
      let documentData: Document[] = [];
      if (isAdmin) {
        documentData = await documentService.getAllDocuments();
      } else if (isDepartmentLeader && userProfile?.departmentId) {
        documentData = await documentService.getDocumentsByDepartment(userProfile.departmentId);
      } else {
        documentData = await documentService.getDocumentsByUser(userProfile?.id || '');
      }

      setDocuments(documentData);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Kunne ikke laste data');
    } finally {
      setLoading(false);
    }
  };

  const filteredDocuments = documents.filter(document => {
    const matchesSearch = document.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         document.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         document.uploadedBy.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDepartment = !selectedDepartment || document.sharedWithDepartments.includes(selectedDepartment);
    const matchesPermission = !selectedPermission || document.permission === selectedPermission;
    
    return matchesSearch && matchesDepartment && matchesPermission;
  });

  const getFileIcon = (fileType: string) => {
    const type = fileType.toLowerCase();
    
    if (type.includes('pdf')) return <FileText className="h-5 w-5 text-red-500" />;
    if (type.includes('image')) return <FileImage className="h-5 w-5 text-green-500" />;
    if (type.includes('video')) return <FileVideo className="h-5 w-5 text-purple-500" />;
    if (type.includes('zip') || type.includes('rar')) return <FileArchive className="h-5 w-5 text-orange-500" />;
    if (type.includes('code') || type.includes('json') || type.includes('xml')) return <FileCode className="h-5 w-5 text-blue-500" />;
    
    return <File className="h-5 w-5 text-gray-500" />;
  };

  const getPermissionBadge = (permission: DocumentPermission) => {
    const badges = {
      [DocumentPermission.READ]: { color: 'bg-blue-100 text-blue-800', text: 'Kun lese' },
      [DocumentPermission.EDIT]: { color: 'bg-yellow-100 text-yellow-800', text: 'Redigere' },
      [DocumentPermission.DELETE]: { color: 'bg-red-100 text-red-800', text: 'Slette' },
      [DocumentPermission.ADMIN]: { color: 'bg-purple-100 text-purple-800', text: 'Admin' }
    };
    
    const badge = badges[permission];
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badge.color}`}>
        {badge.text}
      </span>
    );
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleDeleteDocument = async (documentId: string) => {
    if (!confirm('Er du sikker på at du vil slette dette dokumentet?')) return;
    
    try {
      await documentService.deleteDocument(documentId);
      toast.success('Dokument slettet');
      loadData();
    } catch (error) {
      console.error('Error deleting document:', error);
      toast.error('Kunne ikke slette dokument');
    }
  };

  const handleDownload = async (document: Document) => {
    try {
      const url = await documentService.getDownloadURL(document.id);
      const link = document.createElement('a');
      link.href = url;
      link.download = document.title;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('Nedlasting startet');
    } catch (error) {
      console.error('Error downloading document:', error);
      toast.error('Kunne ikke laste ned dokument');
    }
  };

  const getDocumentStats = () => {
    const totalDocs = documents.length;
    const totalSize = documents.reduce((total, doc) => total + doc.fileSize, 0);
    const sharedDocs = documents.filter(doc => doc.sharedWithDepartments.length > 0 || doc.sharedWithUsers.length > 0).length;
    const recentDocs = documents.filter(doc => {
      const uploadDate = new Date(doc.uploadedAt);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return uploadDate > weekAgo;
    }).length;
    
    return { totalDocs, totalSize, sharedDocs, recentDocs };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const stats = getDocumentStats();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dokumenter</h1>
          <p className="mt-1 text-sm text-gray-500">
            Del og administrer dokumenter med ansatte
          </p>
        </div>
        {(isAdmin || isDepartmentLeader) && (
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Plus className="h-4 w-4 mr-2" />
            Last opp dokument
          </button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Totalt dokumenter</dt>
                  <dd className="text-lg font-medium text-gray-900">{stats.totalDocs}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Share className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Delte dokumenter</dt>
                  <dd className="text-lg font-medium text-gray-900">{stats.sharedDocs}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Calendar className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Siste 7 dager</dt>
                  <dd className="text-lg font-medium text-gray-900">{stats.recentDocs}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <File className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total størrelse</dt>
                  <dd className="text-lg font-medium text-gray-900">{formatFileSize(stats.totalSize)}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Søk
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Søk etter tittel eller beskrivelse..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 block w-full border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Avdeling
            </label>
            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="block w-full border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            >
              <option value="">Alle avdelinger</option>
              {departments.map(dept => (
                <option key={dept.id} value={dept.id}>{dept.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tillatelse
            </label>
            <select
              value={selectedPermission}
              onChange={(e) => setSelectedPermission(e.target.value)}
              className="block w-full border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            >
              <option value="">Alle tillatelser</option>
              <option value={DocumentPermission.READ}>Kun lese</option>
              <option value={DocumentPermission.EDIT}>Redigere</option>
              <option value={DocumentPermission.DELETE}>Slette</option>
              <option value={DocumentPermission.ADMIN}>Admin</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedDepartment('');
                setSelectedPermission('');
              }}
              className="w-full inline-flex justify-center items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Filter className="h-4 w-4 mr-2" />
              Nullstill
            </button>
          </div>
        </div>
      </div>

      {/* Documents Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredDocuments.map((document) => (
          <div key={document.id} className="bg-white shadow rounded-lg overflow-hidden">
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center">
                  {getFileIcon(document.fileType)}
                  <div className="ml-3">
                    <h3 className="text-lg font-medium text-gray-900 truncate">{document.title}</h3>
                    <p className="text-sm text-gray-500">{formatFileSize(document.fileSize)}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleDownload(document)}
                    className="text-blue-600 hover:text-blue-900"
                    title="Last ned"
                  >
                    <Download className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => {
                      setSelectedDocument(document);
                      setShowAddModal(true);
                    }}
                    className="text-blue-600 hover:text-blue-900"
                    title="Se detaljer"
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                  {(isAdmin || document.uploadedBy === userProfile?.displayName) && (
                    <>
                      <button
                        onClick={() => {
                          setSelectedDocument(document);
                          setShowAddModal(true);
                        }}
                        className="text-indigo-600 hover:text-indigo-900"
                        title="Rediger"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteDocument(document.id)}
                        className="text-red-600 hover:text-red-900"
                        title="Slett"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>

              {document.description && (
                <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                  {document.description}
                </p>
              )}

              <div className="space-y-2 mb-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Opplastet av:</span>
                  <span className="text-gray-900">{document.uploadedBy}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Dato:</span>
                  <span className="text-gray-900">
                    {new Date(document.uploadedAt).toLocaleDateString('no-NO')}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Tillatelse:</span>
                  {getPermissionBadge(document.permission)}
                </div>
              </div>

              {/* Shared With */}
              <div className="border-t border-gray-200 pt-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Delt med:</span>
                  <div className="flex items-center space-x-1">
                    {document.sharedWithDepartments.length > 0 && (
                      <Building className="h-3 w-3 text-blue-500" title="Avdelinger" />
                    )}
                    {document.sharedWithUsers.length > 0 && (
                      <Users className="h-3 w-3 text-green-500" title="Brukere" />
                    )}
                    {document.sharedWithDepartments.length === 0 && document.sharedWithUsers.length === 0 && (
                      <Lock className="h-3 w-3 text-gray-400" title="Ikke delt" />
                    )}
                  </div>
                </div>
                
                {document.sharedWithDepartments.length > 0 && (
                  <div className="mt-2">
                    <div className="text-xs text-gray-500 mb-1">Avdelinger:</div>
                    <div className="flex flex-wrap gap-1">
                      {document.sharedWithDepartments.slice(0, 2).map(deptId => {
                        const dept = departments.find(d => d.id === deptId);
                        return dept ? (
                          <span key={deptId} className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                            {dept.name}
                          </span>
                        ) : null;
                      })}
                      {document.sharedWithDepartments.length > 2 && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-600">
                          +{document.sharedWithDepartments.length - 2} mer
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredDocuments.length === 0 && (
        <div className="text-center py-12">
          <FileText className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Ingen dokumenter funnet</h3>
          <p className="mt-1 text-sm text-gray-500">
            Prøv å endre søkekriteriene eller last opp et nytt dokument.
          </p>
        </div>
      )}

      {/* Add/Edit Document Modal would go here */}
      {/* This is a placeholder for the modal component */}
    </div>
  );
} 