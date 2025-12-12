'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { firebaseService, Document } from '@/lib/firebase-services';
import { 
  FileText, 
  Plus, 
  Search, 
  Download, 
  Trash2,
  Eye,
  Edit,
  Filter,
  File,
  FileImage,
  FileSpreadsheet,
  Archive,
  Calendar,
  User,
  Tag,
  Share2,
  MoreVertical,
  Upload,
  CheckCircle,
  AlertCircle,
  Clock,
  Star,
  BookOpen,
  Shield,
  FileCheck,
  FileX,
  FilePlus,
  FolderOpen,
  Grid,
  List,
  SortAsc,
  SortDesc,
  FolderPlus
} from 'lucide-react';

export default function DocumentsPage() {
  const { userProfile } = useAuth();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [sortBy, setSortBy] = useState<'date' | 'name' | 'size' | 'category'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showFolderModal, setShowFolderModal] = useState(false);
  const [uploadMode, setUploadMode] = useState<'single' | 'bulk'>('single');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [folders, setFolders] = useState<Array<{id: string, name: string, parentId?: string}>>([]);
  const [currentFolder, setCurrentFolder] = useState<string | null>(null);
  const [newDocument, setNewDocument] = useState({
    title: '',
    description: '',
    category: 'other' as 'policy' | 'procedure' | 'form' | 'report' | 'other',
    isPublic: false,
    tags: '',
    departmentId: '',
    folderId: null as string | null,
    expiryDate: '',
    priority: 'normal' as 'low' | 'normal' | 'high' | 'urgent',
    version: '1.0',
    author: '',
    language: 'no',
    requiresSignature: false,
    notifyUsers: false,
    notifyUserIds: [] as string[]
  });
  const [newFolder, setNewFolder] = useState({
    name: '',
    description: '',
    parentId: null as string | null,
    isPublic: false
  });

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (userProfile) {
      loadData();
    }
  }, [userProfile?.companyId]);

  const loadData = async () => {
    if (!userProfile) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      // Load real data from Firebase
      const documentsData = await firebaseService.getDocuments(userProfile.companyId);
      setDocuments(documentsData);
    } catch (error) {
      console.error('Error loading documents:', error);
      setError('Feil ved lasting av dokumenter: ' + (error instanceof Error ? error.message : 'Ukjent feil'));
      setDocuments([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) {
      return;
    }

    if (uploadMode === 'single') {
      setSelectedFiles([files[0]]);
      // Auto-fill title from filename if empty
      if (!newDocument.title.trim()) {
        const fileName = files[0].name.replace(/\.[^/.]+$/, '');
        setNewDocument({...newDocument, title: fileName});
      }
    } else {
      // Bulk upload
      setSelectedFiles(Array.from(files));
    }
  };

  const handleSingleUpload = async () => {
    if (selectedFiles.length === 0 || ! !userProfile?.id) {
      setError('Vennligst velg en fil');
      return;
    }

    const file = selectedFiles[0];
    if (!newDocument.title.trim()) {
      setError('Tittel er påkrevd');
      return;
    }

    try {
      setUploading(true);
      setUploadProgress(0);
      setError(null);

      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      const documentData = {
        ...newDocument,
        uploadedBy: userProfile.id,
                tags: newDocument.tags ? newDocument.tags.split(',').map(tag => tag.trim()) : [],
        folderId: newDocument.folderId || null,
        expiryDate: newDocument.expiryDate || null,
        priority: newDocument.priority,
        version: newDocument.version,
        author: newDocument.author || userProfile.displayName || userProfile.email || '',
        language: newDocument.language,
        requiresSignature: newDocument.requiresSignature,
        notifyUsers: newDocument.notifyUsers,
        notifyUserIds: newDocument.notifyUserIds
      };

      await firebaseService.uploadDocument(file, documentData);
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      setTimeout(() => {
        setShowAddModal(false);
        resetDocumentForm();
        setUploading(false);
        setUploadProgress(0);
        setSuccess('Dokument lastet opp vellykket!');
        loadData();
        
        setTimeout(() => setSuccess(null), 3000);
      }, 500);
    } catch (error) {
      console.error('Error uploading document:', error);
      setError('Feil ved opplasting av dokument: ' + (error instanceof Error ? error.message : 'Ukjent feil'));
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleBulkUpload = async () => {
    if (selectedFiles.length === 0 || ! !userProfile?.id) {
      setError('Ingen filer valgt');
      return;
    }

    try {
      setUploading(true);
      setUploadProgress(0);
      setError(null);

      let uploaded = 0;
      const total = selectedFiles.length;

      for (const file of selectedFiles) {
        const documentData = {
          title: file.name.replace(/\.[^/.]+$/, ''),
          description: newDocument.description,
          category: newDocument.category,
          isPublic: newDocument.isPublic,
          tags: newDocument.tags ? newDocument.tags.split(',').map(tag => tag.trim()) : [],
          departmentId: newDocument.departmentId,
          folderId: newDocument.folderId || null,
          uploadedBy: userProfile.id,
                    priority: newDocument.priority,
          version: '1.0',
          author: newDocument.author || userProfile.displayName || userProfile.email || '',
          language: newDocument.language
        };

        await firebaseService.uploadDocument(file, documentData);
        uploaded++;
        setUploadProgress(Math.round((uploaded / total) * 100));
      }

      setShowAddModal(false);
      resetDocumentForm();
      setSelectedFiles([]);
      setUploading(false);
      setUploadProgress(0);
      setSuccess(`${uploaded} dokumenter lastet opp vellykket!`);
      loadData();
      
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      console.error('Error uploading documents:', error);
      setError('Feil ved opplasting av dokumenter: ' + (error instanceof Error ? error.message : 'Ukjent feil'));
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleCreateFolder = async () => {
    if (!newFolder.name.trim() || ! !userProfile?.id) {
      setError('Mappnavn er påkrevd');
      return;
    }

    try {
      setError(null);
      // Create folder in Firestore
      const folderData = {
        name: newFolder.name,
        description: newFolder.description,
        parentId: newFolder.parentId,
        isPublic: newFolder.isPublic,
                createdBy: userProfile.id,
        createdAt: new Date().toISOString()
      };

      // Add folder to Firestore (you'll need to implement this in firebaseService)
      // await firebaseService.createFolder(folderData);
      
      // For now, add to local state
      const newFolderItem = {
        id: `folder-${Date.now()}`,
        name: newFolder.name,
        parentId: newFolder.parentId || undefined
      };
      setFolders([...folders, newFolderItem]);
      
      setShowFolderModal(false);
      setNewFolder({
        name: '',
        description: '',
        parentId: null,
        isPublic: false
      });
      setSuccess('Mappe opprettet vellykket!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      console.error('Error creating folder:', error);
      setError('Feil ved opprettelse av mappe: ' + (error instanceof Error ? error.message : 'Ukjent feil'));
    }
  };

  const resetDocumentForm = () => {
    setNewDocument({
      title: '',
      description: '',
      category: 'other',
      isPublic: false,
      tags: '',
      departmentId: '',
      folderId: null,
      expiryDate: '',
      priority: 'normal',
      version: '1.0',
      author: '',
      language: 'no',
      requiresSignature: false,
      notifyUsers: false,
      notifyUserIds: []
    });
    setSelectedFiles([]);
    setUploadMode('single');
  };

  const handleDeleteDocument = async (doc: Document) => {
    if (confirm(`Er du sikker på at du vil slette "${doc.title}"? Dette kan ikke angres.`)) {
      try {
        setError(null);
        await firebaseService.deleteDocument(doc.id, doc.fileUrl);
        setSuccess(`Dokument "${doc.title}" ble slettet`);
        loadData();
        setTimeout(() => setSuccess(null), 3000);
      } catch (error) {
        console.error('Error deleting document:', error);
        setError('Feil ved sletting av dokument: ' + (error instanceof Error ? error.message : 'Ukjent feil'));
      }
    }
  };

  const downloadDocument = async (doc: Document) => {
    try {
      setError(null);
      const response = await fetch(doc.fileUrl);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = window.document.createElement('a');
      a.href = url;
      a.download = doc.fileName;
      window.document.body.appendChild(a);
      a.click();
      window.document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      setSuccess(`Dokument "${doc.title}" lastet ned`);
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      console.error('Error downloading document:', error);
      setError('Feil ved nedlasting av dokument: ' + (error instanceof Error ? error.message : 'Ukjent feil'));
    }
  };

  const getFileIcon = (fileType: string) => {
    if (!fileType) return <File style={{ width: '24px', height: '24px', color: 'var(--gray-600)' }} />;
    if (fileType.includes('pdf')) return <FileText style={{ width: '24px', height: '24px', color: 'var(--red-600)' }} />;
    if (fileType.includes('image')) return <FileImage style={{ width: '24px', height: '24px', color: 'var(--blue-600)' }} />;
    if (fileType.includes('spreadsheet') || fileType.includes('excel')) return <FileSpreadsheet style={{ width: '24px', height: '24px', color: 'var(--green-600)' }} />;
    if (fileType.includes('word') || fileType.includes('document')) return <FileText style={{ width: '24px', height: '24px', color: 'var(--blue-600)' }} />;
    if (fileType.includes('presentation') || fileType.includes('powerpoint')) return <FileText style={{ width: '24px', height: '24px', color: 'var(--orange-600)' }} />;
    return <File style={{ width: '24px', height: '24px', color: 'var(--gray-600)' }} />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('nb-NO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = (doc.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (doc.description || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (doc.fileName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (doc.tags || []).some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = selectedCategory === 'all' || doc.category === selectedCategory;
    return matchesSearch && matchesCategory;
  }).sort((a, b) => {
    let comparison = 0;
    switch (sortBy) {
      case 'name':
        comparison = (a.title || '').localeCompare(b.title || '');
        break;
      case 'size':
        comparison = (a.fileSize || 0) - (b.fileSize || 0);
        break;
      case 'category':
        comparison = (a.category || '').localeCompare(b.category || '');
        break;
      case 'date':
      default:
        comparison = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        break;
    }
    return sortOrder === 'asc' ? comparison : -comparison;
  });

  const stats = {
    total: documents.length,
    pdf: documents.filter(d => d.fileType && d.fileType.includes('pdf')).length,
    images: documents.filter(d => d.fileType && d.fileType.includes('image')).length,
    documents: documents.filter(d => d.fileType && (d.fileType.includes('word') || d.fileType.includes('document'))).length,
    spreadsheets: documents.filter(d => d.fileType && (d.fileType.includes('spreadsheet') || d.fileType.includes('excel'))).length,
    recent: documents.filter(d => {
      const docDate = new Date(d.createdAt);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return docDate > weekAgo;
    }).length,
    public: documents.filter(d => d.isPublic).length,
    private: documents.filter(d => !d.isPublic).length
  };

  const categoryStats = {
    policy: documents.filter(d => d.category === 'policy').length,
    procedure: documents.filter(d => d.category === 'procedure').length,
    form: documents.filter(d => d.category === 'form').length,
    report: documents.filter(d => d.category === 'report').length,
    other: documents.filter(d => d.category === 'other').length
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--gray-50)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ 
            width: '48px', 
            height: '48px', 
            border: '2px solid var(--blue-600)', 
            borderTop: '2px solid transparent', 
            borderRadius: '50%', 
            animation: 'spin 1s linear infinite',
            margin: '0 auto'
          }}></div>
          <p style={{ marginTop: '1rem', color: 'var(--gray-600)' }}>Laster dokumenter...</p>
        </div>
      </div>
    );
  }

  if (!userProfile) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--gray-50)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ background: 'var(--red-100)', padding: '2rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--red-200)' }}>
            <AlertCircle style={{ width: '48px', height: '48px', color: 'var(--red-600)', margin: '0 auto 1rem' }} />
            <h2 style={{ fontSize: 'var(--font-size-lg)', fontWeight: '600', color: 'var(--red-800)', marginBottom: '0.5rem' }}>
              Ingen brukerinformasjon
            </h2>
            <p style={{ color: 'var(--red-700)' }}>
              Vennligst logg inn på nytt for å få tilgang til dokumenter.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'var(--background-color)',
      width: '100%',
      overflowX: 'hidden',
      padding: isMobile ? '0' : undefined
    }}>
      {/* Mobile Header */}
      {isMobile && (
        <div style={{
          padding: '0.625rem 0.75rem 0.5rem',
          marginBottom: '0.5rem',
          borderBottom: '0.5px solid var(--border-color)',
          background: 'var(--card-background)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <h1 style={{
                fontSize: '1.125rem',
                fontWeight: 600,
                color: 'var(--text-color)',
                margin: '0 0 0.125rem 0',
                lineHeight: '1.3'
              }}>
                Dokumenter
              </h1>
              <p style={{
                fontSize: '0.8125rem',
                color: 'var(--gray-500)',
                margin: 0
              }}>
                {documents.length} dokumenter
              </p>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              style={{
                padding: '0.625rem',
                borderRadius: '0.625rem',
                background: 'var(--primary)',
                color: 'white',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minWidth: '44px',
                minHeight: '44px'
              }}
            >
              <Plus size={20} />
            </button>
          </div>
        </div>
      )}

      {/* Desktop Header */}
      {!isMobile && (
        <div style={{ background: 'var(--card-background)', boxShadow: 'var(--shadow-sm)', borderBottom: '1px solid var(--border-color)', padding: '1.5rem 2rem' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
              <h1 style={{ fontSize: 'var(--font-size-2xl)', fontWeight: '700', color: 'var(--text-color)' }}>Dokumenter</h1>
              <p style={{ color: 'var(--gray-500)', marginTop: '0.25rem', fontSize: 'var(--font-size-base)' }}>
              {documents.length} dokumenter • {formatFileSize(documents.reduce((sum, doc) => sum + (doc.fileSize || 0), 0))} total størrelse
            </p>
          </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <button
                onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                style={{ 
                  padding: '0.5rem', 
                  borderRadius: 'var(--radius-md)', 
                  border: '1px solid var(--border-color)',
                  background: 'var(--card-background)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                  color: 'var(--text-color)'
                }}
                title={viewMode === 'grid' ? 'Listevisning' : 'Rutenettvisning'}
              >
                {viewMode === 'grid' ? <List style={{ width: '16px', height: '16px', color: 'var(--text-color)' }} /> : <Grid style={{ width: '16px', height: '16px', color: 'var(--text-color)' }} />}
              </button>
            <button
              onClick={() => setShowAddModal(true)}
              className="btn btn-primary"
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.5rem',
                  fontSize: 'var(--font-size-base)',
                  padding: '0.75rem 1rem'
              }}
            >
                <Plus style={{ width: '16px', height: '16px' }} />
                Last opp dokument
            </button>
          </div>
        </div>
      </div>
      )}

      <div style={{ 
        maxWidth: '1280px', 
        margin: '0 auto', 
        padding: isMobile ? '0.5rem 0.75rem' : '2rem 1rem',
        width: '100%'
      }}>
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
            <AlertCircle style={{ width: '20px', height: '20px', color: 'var(--red-600)' }} />
            <p style={{ color: 'var(--red-700)', fontSize: 'var(--font-size-sm)' }}>{error}</p>
          </div>
        )}
        {/* Stats Overview */}
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(auto-fit, minmax(200px, 1fr))', gap: isMobile ? '0.5rem' : '1rem', marginBottom: isMobile ? '1rem' : '2rem' }}>
          <div className="card" style={{ padding: isMobile ? '0.75rem' : '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <div style={{ padding: isMobile ? '0.5rem' : '0.75rem', background: 'var(--blue-100)', borderRadius: 'var(--radius-lg)' }}>
                <FileText style={{ width: isMobile ? '20px' : '24px', height: isMobile ? '20px' : '24px', color: 'var(--blue-600)' }} />
              </div>
              <div style={{ marginLeft: isMobile ? '0.5rem' : '1rem' }}>
                <p style={{ fontSize: isMobile ? 'var(--font-size-xs)' : 'var(--font-size-sm)', fontWeight: '500', color: 'var(--gray-600)' }}>Totalt</p>
                <p style={{ fontSize: isMobile ? 'var(--font-size-lg)' : 'var(--font-size-2xl)', fontWeight: '600', color: 'var(--gray-900)' }}>{stats.total}</p>
              </div>
            </div>
          </div>
          <div className="card" style={{ padding: isMobile ? '0.75rem' : '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <div style={{ padding: isMobile ? '0.5rem' : '0.75rem', background: 'var(--red-100)', borderRadius: 'var(--radius-lg)' }}>
                <FileText style={{ width: isMobile ? '20px' : '24px', height: isMobile ? '20px' : '24px', color: 'var(--red-600)' }} />
              </div>
              <div style={{ marginLeft: isMobile ? '0.5rem' : '1rem' }}>
                <p style={{ fontSize: isMobile ? 'var(--font-size-xs)' : 'var(--font-size-sm)', fontWeight: '500', color: 'var(--gray-600)' }}>PDF</p>
                <p style={{ fontSize: isMobile ? 'var(--font-size-lg)' : 'var(--font-size-2xl)', fontWeight: '600', color: 'var(--gray-900)' }}>{stats.pdf}</p>
              </div>
            </div>
          </div>
          {!isMobile && (
            <>
              <div className="card">
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <div style={{ padding: '0.75rem', background: 'var(--blue-100)', borderRadius: 'var(--radius-lg)' }}>
                    <FileImage style={{ width: '24px', height: '24px', color: 'var(--blue-600)' }} />
                  </div>
                  <div style={{ marginLeft: '1rem' }}>
                    <p style={{ fontSize: 'var(--font-size-sm)', fontWeight: '500', color: 'var(--gray-600)' }}>Bilder</p>
                    <p style={{ fontSize: 'var(--font-size-2xl)', fontWeight: '600', color: 'var(--gray-900)' }}>{stats.images}</p>
                  </div>
                </div>
              </div>
              <div className="card">
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <div style={{ padding: '0.75rem', background: 'var(--green-100)', borderRadius: 'var(--radius-lg)' }}>
                    <FileSpreadsheet style={{ width: '24px', height: '24px', color: 'var(--green-600)' }} />
                  </div>
                  <div style={{ marginLeft: '1rem' }}>
                    <p style={{ fontSize: 'var(--font-size-sm)', fontWeight: '500', color: 'var(--gray-600)' }}>Regneark</p>
                    <p style={{ fontSize: 'var(--font-size-2xl)', fontWeight: '600', color: 'var(--gray-900)' }}>{stats.spreadsheets}</p>
                  </div>
                </div>
              </div>
              <div className="card">
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <div style={{ padding: '0.75rem', background: 'var(--orange-100)', borderRadius: 'var(--radius-lg)' }}>
                    <Clock style={{ width: '24px', height: '24px', color: 'var(--orange-600)' }} />
                  </div>
                  <div style={{ marginLeft: '1rem' }}>
                    <p style={{ fontSize: 'var(--font-size-sm)', fontWeight: '500', color: 'var(--gray-600)' }}>Nye (7 dager)</p>
                    <p style={{ fontSize: 'var(--font-size-2xl)', fontWeight: '600', color: 'var(--gray-900)' }}>{stats.recent}</p>
                  </div>
                </div>
              </div>
              <div className="card">
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <div style={{ padding: '0.75rem', background: 'var(--purple-100)', borderRadius: 'var(--radius-lg)' }}>
                    <Shield style={{ width: '24px', height: '24px', color: 'var(--purple-600)' }} />
                  </div>
                  <div style={{ marginLeft: '1rem' }}>
                    <p style={{ fontSize: 'var(--font-size-sm)', fontWeight: '500', color: 'var(--gray-600)' }}>Offentlige</p>
                    <p style={{ fontSize: 'var(--font-size-2xl)', fontWeight: '600', color: 'var(--gray-900)' }}>{stats.public}</p>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Category Stats */}
        <div className="card" style={{ marginBottom: '2rem' }}>
          <h3 style={{ fontSize: 'var(--font-size-lg)', fontWeight: '600', color: 'var(--gray-900)', marginBottom: '1rem' }}>
            Kategorier
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem', background: 'var(--gray-50)', borderRadius: 'var(--radius-lg)' }}>
              <div style={{ width: '8px', height: '8px', background: 'var(--blue-500)', borderRadius: '50%' }}></div>
              <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--gray-700)' }}>Policy</span>
              <span style={{ marginLeft: 'auto', fontSize: 'var(--font-size-sm)', fontWeight: '600', color: 'var(--gray-900)' }}>{categoryStats.policy}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem', background: 'var(--gray-50)', borderRadius: 'var(--radius-lg)' }}>
              <div style={{ width: '8px', height: '8px', background: 'var(--green-500)', borderRadius: '50%' }}></div>
              <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--gray-700)' }}>Prosedyre</span>
              <span style={{ marginLeft: 'auto', fontSize: 'var(--font-size-sm)', fontWeight: '600', color: 'var(--gray-900)' }}>{categoryStats.procedure}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem', background: 'var(--gray-50)', borderRadius: 'var(--radius-lg)' }}>
              <div style={{ width: '8px', height: '8px', background: 'var(--orange-500)', borderRadius: '50%' }}></div>
              <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--gray-700)' }}>Skjema</span>
              <span style={{ marginLeft: 'auto', fontSize: 'var(--font-size-sm)', fontWeight: '600', color: 'var(--gray-900)' }}>{categoryStats.form}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem', background: 'var(--gray-50)', borderRadius: 'var(--radius-lg)' }}>
              <div style={{ width: '8px', height: '8px', background: 'var(--red-500)', borderRadius: '50%' }}></div>
              <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--gray-700)' }}>Rapport</span>
              <span style={{ marginLeft: 'auto', fontSize: 'var(--font-size-sm)', fontWeight: '600', color: 'var(--gray-900)' }}>{categoryStats.report}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem', background: 'var(--gray-50)', borderRadius: 'var(--radius-lg)' }}>
              <div style={{ width: '8px', height: '8px', background: 'var(--gray-500)', borderRadius: '50%' }}></div>
              <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--gray-700)' }}>Annet</span>
              <span style={{ marginLeft: 'auto', fontSize: 'var(--font-size-sm)', fontWeight: '600', color: 'var(--gray-900)' }}>{categoryStats.other}</span>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="card" style={{ marginBottom: isMobile ? '1rem' : '2rem' }}>
          <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: isMobile ? '0.5rem' : '1rem', alignItems: isMobile ? 'stretch' : 'center' }}>
            <div style={{ flex: '1' }}>
              <div style={{ position: 'relative' }}>
                <Search style={{ 
                  position: 'absolute', 
                  left: '12px', 
                  top: '50%', 
                  transform: 'translateY(-50%)', 
                  color: 'var(--gray-400)', 
                  width: '16px', 
                  height: '16px' 
                }} />
                <input
                  type="text"
                  placeholder="Søk i dokumenter..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{ 
                    width: '100%', 
                    padding: isMobile ? '0.5rem 0.5rem 0.5rem 2rem' : '0.75rem 0.75rem 0.75rem 2.5rem', 
                    border: '1px solid var(--border-color)', 
                    borderRadius: 'var(--radius-lg)', 
                    outline: 'none',
                    fontSize: isMobile ? 'var(--font-size-sm)' : 'var(--font-size-base)',
                    background: 'var(--card-background)',
                    color: 'var(--text-color)'
                  }}
                />
              </div>
            </div>
            <div style={{ display: 'flex', gap: isMobile ? '0.5rem' : '0.75rem', flexDirection: isMobile ? 'row' : 'row' }}>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                style={{ 
                  padding: isMobile ? '0.5rem' : '0.75rem', 
                  border: '1px solid var(--border-color)', 
                  borderRadius: 'var(--radius-lg)', 
                  outline: 'none',
                  minWidth: isMobile ? '120px' : '150px',
                  fontSize: isMobile ? 'var(--font-size-sm)' : 'var(--font-size-base)',
                  background: 'var(--card-background)',
                  color: 'var(--text-color)'
                }}
              >
                <option value="all">Alle kategorier</option>
                <option value="policy">Policy</option>
                <option value="procedure">Prosedyre</option>
                <option value="form">Skjema</option>
                <option value="report">Rapport</option>
                <option value="other">Annet</option>
              </select>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'date' | 'name' | 'size' | 'category')}
                style={{ 
                  padding: isMobile ? '0.5rem' : '0.75rem', 
                  border: '1px solid var(--border-color)', 
                  borderRadius: 'var(--radius-lg)', 
                  outline: 'none',
                  minWidth: isMobile ? '100px' : '120px',
                  fontSize: isMobile ? 'var(--font-size-sm)' : 'var(--font-size-base)',
                  background: 'var(--card-background)',
                  color: 'var(--text-color)'
                }}
              >
                <option value="date">Dato</option>
                <option value="name">Navn</option>
                <option value="size">Størrelse</option>
                <option value="category">Kategori</option>
              </select>
              <button
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                style={{ 
                  padding: isMobile ? '0.5rem' : '0.75rem', 
                  border: '1px solid var(--border-color)', 
                  borderRadius: 'var(--radius-lg)', 
                  background: 'var(--card-background)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                  color: 'var(--text-color)'
                }}
                title={sortOrder === 'asc' ? 'Synkende rekkefølge' : 'Stigende rekkefølge'}
              >
                {sortOrder === 'asc' ? <SortDesc style={{ width: '16px', height: '16px', color: 'var(--text-color)' }} /> : <SortAsc style={{ width: '16px', height: '16px', color: 'var(--text-color)' }} />}
              </button>
            </div>
          </div>
          {searchTerm && (
            <div style={{ marginTop: isMobile ? '0.5rem' : '1rem', padding: isMobile ? '0.5rem' : '0.75rem', background: 'var(--blue-50)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--blue-200)' }}>
              <p style={{ fontSize: isMobile ? 'var(--font-size-xs)' : 'var(--font-size-sm)', color: 'var(--blue-700)' }}>
                {filteredDocuments.length} dokumenter funnet for "{searchTerm}"
              </p>
            </div>
          )}
        </div>

        {/* Documents List */}
        <div className="card">
          {filteredDocuments.length === 0 ? (
            <div style={{ padding: isMobile ? '2rem 1rem' : '3rem', textAlign: 'center' }}>
              <FileText style={{ width: isMobile ? '32px' : '48px', height: isMobile ? '32px' : '48px', color: 'var(--gray-400)', margin: '0 auto 1rem' }} />
              <h3 style={{ fontSize: isMobile ? 'var(--font-size-base)' : 'var(--font-size-lg)', fontWeight: '600', color: 'var(--gray-900)', marginBottom: '0.5rem' }}>
                {searchTerm ? 'Ingen dokumenter funnet' : 'Ingen dokumenter'}
              </h3>
              <p style={{ color: 'var(--gray-600)', marginBottom: '1rem', fontSize: isMobile ? 'var(--font-size-sm)' : 'var(--font-size-base)' }}>
                {searchTerm 
                  ? 'Prøv å endre søkekriteriene dine eller legg til nye dokumenter.'
                  : 'Start med å laste opp ditt første dokument.'
                }
              </p>
              {!searchTerm && (
                <button
                  onClick={() => setShowAddModal(true)}
                  className="btn btn-primary"
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '0.5rem', 
                    margin: '0 auto',
                    fontSize: isMobile ? 'var(--font-size-sm)' : 'var(--font-size-base)',
                    padding: isMobile ? '0.5rem 1rem' : '0.75rem 1.5rem'
                  }}
                >
                  <Plus style={{ width: isMobile ? '14px' : '16px', height: isMobile ? '14px' : '16px' }} />
                  {isMobile ? 'Last opp' : 'Last opp første dokument'}
                </button>
              )}
            </div>
          ) : viewMode === 'grid' ? (
            /* Grid View */
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: isMobile ? 'repeat(auto-fill, minmax(150px, 1fr))' : 'repeat(auto-fill, minmax(200px, 1fr))', 
              gap: isMobile ? '0.75rem' : '1rem' 
            }}>
              {filteredDocuments.map((doc) => (
                <div
                  key={doc.id}
                  onClick={() => {
                    setSelectedDocument(doc);
                    setShowDetailModal(true);
                  }}
                  style={{
                    padding: '1rem',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-lg)',
                    background: 'var(--card-background)',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.75rem',
                    transition: 'all 0.2s',
                    minHeight: '180px'
                  }}
                  onMouseEnter={(e) => {
                    if (!isMobile) {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = 'var(--shadow-md)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isMobile) {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = 'none';
                    }
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', background: 'var(--gray-50)', borderRadius: 'var(--radius-lg)' }}>
                    {getFileIcon(doc.fileType)}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                      <p style={{
                        fontWeight: '500',
                        color: 'var(--text-color)',
                        fontSize: 'var(--font-size-sm)',
                        margin: 0,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        lineHeight: '1.4'
                      }}>
                        {doc.title}
                      </p>
                      {doc.isPublic && (
                        <Shield style={{ width: '14px', height: '14px', color: 'var(--green-600)', flexShrink: 0 }} />
                      )}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', marginBottom: '0.5rem' }}>
                      <span style={{
                        padding: '0.125rem 0.5rem',
                        borderRadius: 'var(--radius-full)',
                        background: 'var(--gray-100)',
                        fontSize: 'var(--font-size-xs)',
                        fontWeight: '500',
                        color: 'var(--gray-700)',
                        textTransform: 'capitalize',
                        width: 'fit-content'
                      }}>
                        {doc.category}
                      </span>
                      <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--gray-500)' }}>
                        {formatFileSize(doc.fileSize)}
                      </span>
                      <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--gray-500)' }}>
                        {formatDate(doc.createdAt)}
                      </span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        downloadDocument(doc);
                      }}
                      style={{
                        padding: '0.5rem',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--border-color)',
                        background: 'var(--card-background)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                      title="Last ned"
                    >
                      <Download style={{ width: '16px', height: '16px', color: 'var(--text-color)' }} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedDocument(doc);
                        setShowDetailModal(true);
                      }}
                      style={{
                        padding: '0.5rem',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--border-color)',
                        background: 'var(--card-background)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                      title="Se detaljer"
                    >
                      <Eye style={{ width: '16px', height: '16px', color: 'var(--text-color)' }} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : isMobile ? (
            /* Mobile Card View */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {filteredDocuments.map((doc) => (
                <div 
                  key={doc.id} 
                  style={{ 
                    padding: '0.75rem', 
                    border: '1px solid var(--border-color)', 
                    borderRadius: 'var(--radius-lg)', 
                    background: 'var(--card-background)',
                    cursor: 'pointer'
                  }}
                  onClick={() => {
                    setSelectedDocument(doc);
                    setShowDetailModal(true);
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                    <div style={{ flexShrink: 0 }}>
                      {getFileIcon(doc.fileType)}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                        <p style={{ 
                          fontWeight: '500', 
                          color: 'var(--gray-900)', 
                          fontSize: 'var(--font-size-sm)',
                          margin: 0,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}>
                          {doc.title}
                        </p>
                        {doc.isPublic && (
                          <Shield style={{ width: '12px', height: '12px', color: 'var(--green-600)', flexShrink: 0 }} />
                        )}
                      </div>
                      <p style={{ 
                        fontSize: 'var(--font-size-xs)', 
                        color: 'var(--gray-600)', 
                        margin: '0 0 0.25rem 0',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        {doc.fileName}
                      </p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
                        <span style={{ 
                          padding: '0.125rem 0.5rem',
                          borderRadius: 'var(--radius-full)',
                          background: 'var(--gray-100)',
                          fontSize: 'var(--font-size-xs)',
                          fontWeight: '500',
                          color: 'var(--gray-700)',
                          textTransform: 'capitalize'
                        }}>
                          {doc.category}
                        </span>
                        <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--gray-500)' }}>
                          {formatFileSize(doc.fileSize)}
                        </span>
                        <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--gray-500)' }}>
                          {formatDate(doc.createdAt)}
                        </span>
                      </div>
                      {doc.description && (
                        <p style={{ 
                          fontSize: 'var(--font-size-xs)', 
                          color: 'var(--gray-500)', 
                          margin: '0 0 0.5rem 0',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden'
                        }}>
                          {doc.description}
                        </p>
                      )}
                      {doc.tags && doc.tags.length > 0 && (
                        <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
                          {doc.tags.slice(0, 2).map((tag, index) => (
                            <span key={index} style={{
                              padding: '0.125rem 0.375rem',
                              background: 'var(--blue-100)',
                              color: 'var(--blue-700)',
                              borderRadius: 'var(--radius-full)',
                              fontSize: 'var(--font-size-xs)',
                              fontWeight: '500'
                            }}>
                              {tag}
                            </span>
                          ))}
                          {doc.tags.length > 2 && (
                            <span style={{
                              padding: '0.125rem 0.375rem',
                              background: 'var(--gray-100)',
                              color: 'var(--gray-600)',
                              borderRadius: 'var(--radius-full)',
                              fontSize: 'var(--font-size-xs)',
                              fontWeight: '500'
                            }}>
                              +{doc.tags.length - 2}
                            </span>
                          )}
                        </div>
                      )}
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            downloadDocument(doc);
                          }}
                          style={{ 
                            padding: '0.375rem', 
                            borderRadius: 'var(--radius-md)', 
                            border: '1px solid var(--border-color)',
                            background: 'var(--card-background)',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.25rem'
                          }}
                          title="Last ned"
                        >
                          <Download style={{ width: '12px', height: '12px', color: 'var(--text-color)' }} />
                          <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-color)' }}>Last ned</span>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedDocument(doc);
                            setShowDetailModal(true);
                          }}
                          style={{ 
                            padding: '0.375rem', 
                            borderRadius: 'var(--radius-md)', 
                            border: '1px solid var(--border-color)',
                            background: 'var(--card-background)',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.25rem'
                          }}
                          title="Se detaljer"
                        >
                          <Eye style={{ width: '12px', height: '12px', color: 'var(--text-color)' }} />
                          <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-color)' }}>Se</span>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteDocument(doc);
                          }}
                          style={{ 
                            padding: '0.375rem', 
                            borderRadius: 'var(--radius-md)', 
                            border: '1px solid var(--border-color)',
                            background: 'var(--card-background)',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.25rem'
                          }}
                          title="Slett"
                        >
                          <Trash2 style={{ width: '12px', height: '12px', color: 'var(--red-600)' }} />
                          <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--red-600)' }}>Slett</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* Desktop Table View */
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead style={{ background: 'var(--gray-50)' }}>
                  <tr>
                    <th style={{ padding: '1rem', textAlign: 'left', fontSize: 'var(--font-size-xs)', fontWeight: '500', color: 'var(--gray-500)', textTransform: 'uppercase' }}>
                      Dokument
                    </th>
                    <th style={{ padding: '1rem', textAlign: 'left', fontSize: 'var(--font-size-xs)', fontWeight: '500', color: 'var(--gray-500)', textTransform: 'uppercase' }}>
                      Kategori
                    </th>
                    <th style={{ padding: '1rem', textAlign: 'left', fontSize: 'var(--font-size-xs)', fontWeight: '500', color: 'var(--gray-500)', textTransform: 'uppercase' }}>
                      Størrelse
                    </th>
                    <th style={{ padding: '1rem', textAlign: 'left', fontSize: 'var(--font-size-xs)', fontWeight: '500', color: 'var(--gray-500)', textTransform: 'uppercase' }}>
                      Opplastet
                    </th>
                    <th style={{ padding: '1rem', textAlign: 'left', fontSize: 'var(--font-size-xs)', fontWeight: '500', color: 'var(--gray-500)', textTransform: 'uppercase' }}>
                      Handlinger
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDocuments.map((doc) => (
                    <tr key={doc.id} style={{ borderBottom: '1px solid var(--gray-100)', cursor: 'pointer' }} 
                        onClick={() => {
                          setSelectedDocument(doc);
                          setShowDetailModal(true);
                        }}>
                      <td style={{ padding: '1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                          {getFileIcon(doc.fileType)}
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <p style={{ fontWeight: '500', color: 'var(--gray-900)' }}>{doc.title}</p>
                              {doc.isPublic && (
                                <Shield style={{ width: '14px', height: '14px', color: 'var(--green-600)' }} />
                              )}
                            </div>
                            <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--gray-600)' }}>{doc.fileName}</p>
                            {doc.description && (
                              <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--gray-500)', marginTop: '0.25rem' }}>
                                {doc.description.length > 100 ? doc.description.substring(0, 100) + '...' : doc.description}
                              </p>
                            )}
                            {doc.tags && doc.tags.length > 0 && (
                              <div style={{ display: 'flex', gap: '0.25rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                                {doc.tags.slice(0, 3).map((tag, index) => (
                                  <span key={index} style={{
                                    padding: '0.125rem 0.5rem',
                                    background: 'var(--blue-100)',
                                    color: 'var(--blue-700)',
                                    borderRadius: 'var(--radius-full)',
                                    fontSize: 'var(--font-size-xs)',
                                    fontWeight: '500'
                                  }}>
                                    {tag}
                                  </span>
                                ))}
                                {doc.tags.length > 3 && (
                                  <span style={{
                                    padding: '0.125rem 0.5rem',
                                    background: 'var(--gray-100)',
                                    color: 'var(--gray-600)',
                                    borderRadius: 'var(--radius-full)',
                                    fontSize: 'var(--font-size-xs)',
                                    fontWeight: '500'
                                  }}>
                                    +{doc.tags.length - 3}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <span style={{ 
                          padding: '0.25rem 0.75rem',
                          borderRadius: 'var(--radius-full)',
                          background: 'var(--gray-100)',
                          fontSize: 'var(--font-size-sm)',
                          fontWeight: '500',
                          color: 'var(--gray-700)',
                          textTransform: 'capitalize'
                        }}>
                          {doc.category}
                        </span>
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <p style={{ color: 'var(--gray-900)' }}>{formatFileSize(doc.fileSize)}</p>
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <div>
                          <p style={{ color: 'var(--gray-900)' }}>{formatDate(doc.createdAt)}</p>
                          <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--gray-500)' }}>
                            {new Date(doc.createdAt).toLocaleTimeString('nb-NO', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              downloadDocument(doc);
                            }}
                            style={{ 
                              padding: '0.5rem', 
                              borderRadius: 'var(--radius-md)', 
                              border: '1px solid var(--border-color)',
                              background: 'var(--card-background)',
                              cursor: 'pointer',
                              color: 'var(--text-color)'
                            }}
                            title="Last ned"
                          >
                            <Download style={{ width: '16px', height: '16px', color: 'var(--text-color)' }} />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedDocument(doc);
                              setShowDetailModal(true);
                            }}
                            style={{ 
                              padding: '0.5rem', 
                              borderRadius: 'var(--radius-md)', 
                              border: '1px solid var(--border-color)',
                              background: 'var(--card-background)',
                              cursor: 'pointer',
                              color: 'var(--text-color)'
                            }}
                            title="Se detaljer"
                          >
                            <Eye style={{ width: '16px', height: '16px', color: 'var(--text-color)' }} />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteDocument(doc);
                            }}
                            style={{ 
                              padding: '0.5rem', 
                              borderRadius: 'var(--radius-md)', 
                              border: '1px solid var(--border-color)',
                              background: 'var(--card-background)',
                              cursor: 'pointer',
                              color: 'var(--red-600)'
                            }}
                            title="Slett"
                          >
                            <Trash2 style={{ width: '16px', height: '16px', color: 'var(--red-600)' }} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Add Modal - Advanced Upload */}
      {showAddModal && (
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
          <div className="card" style={{ width: '90%', maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: 'var(--font-size-xl)', fontWeight: '600', color: 'var(--text-color)' }}>Last opp dokument</h2>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  resetDocumentForm();
                }}
                style={{ 
                  padding: '0.5rem', 
                  borderRadius: 'var(--radius-md)', 
                  border: 'none',
                  background: 'var(--card-background)',
                  cursor: 'pointer',
                  color: 'var(--text-color)'
                }}
              >
                ✕
              </button>
            </div>
            
            {error && (
              <div style={{ 
                padding: '0.75rem', 
                background: 'var(--red-50)', 
                border: '1px solid var(--red-200)', 
                borderRadius: 'var(--radius-lg)', 
                marginBottom: '1rem' 
              }}>
                <p style={{ color: 'var(--red-700)', fontSize: 'var(--font-size-sm)' }}>{error}</p>
              </div>
            )}

            {uploading && (
              <div style={{ marginBottom: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-color)' }}>Laster opp...</span>
                  <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-color)' }}>{uploadProgress}%</span>
                </div>
                <div style={{ 
                  width: '100%', 
                  height: '8px', 
                  background: 'var(--gray-200)', 
                  borderRadius: 'var(--radius-full)',
                  overflow: 'hidden'
                }}>
                  <div style={{ 
                    width: `${uploadProgress}%`, 
                    height: '100%', 
                    background: 'var(--blue-600)', 
                    transition: 'width 0.3s ease'
                  }}></div>
                </div>
              </div>
            )}

            {/* Upload Mode Toggle */}
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', padding: '0.5rem', background: 'var(--gray-50)', borderRadius: 'var(--radius-lg)' }}>
              <button
                onClick={() => setUploadMode('single')}
                style={{
                  flex: 1,
                  padding: '0.5rem',
                  borderRadius: 'var(--radius-md)',
                  border: 'none',
                  background: uploadMode === 'single' ? 'var(--primary)' : 'transparent',
                  color: uploadMode === 'single' ? 'white' : 'var(--text-color)',
                  cursor: 'pointer',
                  fontWeight: '500'
                }}
              >
                Enkelt dokument
              </button>
              <button
                onClick={() => setUploadMode('bulk')}
                style={{
                  flex: 1,
                  padding: '0.5rem',
                  borderRadius: 'var(--radius-md)',
                  border: 'none',
                  background: uploadMode === 'bulk' ? 'var(--primary)' : 'transparent',
                  color: uploadMode === 'bulk' ? 'white' : 'var(--text-color)',
                  cursor: 'pointer',
                  fontWeight: '500'
                }}
              >
                Flere dokumenter
              </button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* File Upload */}
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: 'var(--text-color)' }}>
                  {uploadMode === 'bulk' ? 'Filer *' : 'Fil *'}
                </label>
                <input
                  type="file"
                  multiple={uploadMode === 'bulk'}
                  onChange={handleFileSelect}
                  disabled={uploading}
                  style={{ 
                    width: '100%', 
                    padding: '0.75rem', 
                    border: '1px solid var(--border-color)', 
                    borderRadius: 'var(--radius-lg)', 
                    outline: 'none',
                    opacity: uploading ? 0.5 : 1,
                    background: 'var(--card-background)',
                    color: 'var(--text-color)'
                  }}
                />
                {selectedFiles.length > 0 && (
                  <div style={{ marginTop: '0.5rem', padding: '0.75rem', background: 'var(--gray-50)', borderRadius: 'var(--radius-lg)' }}>
                    <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-color)', marginBottom: '0.5rem', fontWeight: '500' }}>
                      Valgte filer ({selectedFiles.length}):
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                      {selectedFiles.map((file, index) => (
                        <div key={index} style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-color)' }}>
                          • {file.name} ({(file.size / 1024).toFixed(2)} KB)
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--gray-500)', marginTop: '0.25rem' }}>
                  Støttede formater: PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, JPG, PNG, GIF (maks 10MB per fil)
                </p>
              </div>

              {/* Folder Selection */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <label style={{ fontWeight: '500', color: 'var(--text-color)' }}>
                    Mappe
                  </label>
                  <button
                    onClick={() => setShowFolderModal(true)}
                    style={{
                      padding: '0.375rem 0.75rem',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-color)',
                      background: 'var(--card-background)',
                      color: 'var(--text-color)',
                      cursor: 'pointer',
                      fontSize: 'var(--font-size-sm)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.25rem'
                    }}
                  >
                    <FolderPlus style={{ width: '14px', height: '14px' }} />
                    Opprett mappe
                  </button>
                </div>
                <select
                  value={newDocument.folderId || ''}
                  onChange={(e) => setNewDocument({...newDocument, folderId: e.target.value || null})}
                  disabled={uploading}
                  style={{ 
                    width: '100%', 
                    padding: '0.75rem', 
                    border: '1px solid var(--border-color)', 
                    borderRadius: 'var(--radius-lg)', 
                    outline: 'none',
                    opacity: uploading ? 0.5 : 1,
                    background: 'var(--card-background)',
                    color: 'var(--text-color)'
                  }}
                >
                  <option value="">Ingen mappe (rot)</option>
                  {folders.map((folder) => (
                    <option key={folder.id} value={folder.id}>{folder.name}</option>
                  ))}
                </select>
              </div>
              
              {/* Basic Information */}
              {uploadMode === 'single' && (
                <>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: 'var(--text-color)' }}>
                      Tittel *
                    </label>
                    <input
                      type="text"
                      value={newDocument.title}
                      onChange={(e) => setNewDocument({...newDocument, title: e.target.value})}
                      disabled={uploading}
                      style={{ 
                        width: '100%', 
                        padding: '0.75rem', 
                        border: '1px solid var(--border-color)', 
                        borderRadius: 'var(--radius-lg)', 
                        outline: 'none',
                        opacity: uploading ? 0.5 : 1,
                        background: 'var(--card-background)',
                        color: 'var(--text-color)'
                      }}
                      placeholder="Dokument tittel"
                    />
                  </div>
                  
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: 'var(--text-color)' }}>
                      Beskrivelse
                    </label>
                    <textarea
                      value={newDocument.description}
                      onChange={(e) => setNewDocument({...newDocument, description: e.target.value})}
                      disabled={uploading}
                      style={{ 
                        width: '100%', 
                        padding: '0.75rem', 
                        border: '1px solid var(--border-color)', 
                        borderRadius: 'var(--radius-lg)', 
                        outline: 'none',
                        minHeight: '100px',
                        resize: 'vertical',
                        opacity: uploading ? 0.5 : 1,
                        background: 'var(--card-background)',
                        color: 'var(--text-color)'
                      }}
                      placeholder="Beskrivelse av dokumentet"
                    />
                  </div>
                </>
              )}

              {/* Advanced Options - Collapsible */}
              <details style={{ border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', padding: '1rem' }}>
                <summary style={{ cursor: 'pointer', fontWeight: '500', color: 'var(--text-color)', marginBottom: '1rem' }}>
                  Avanserte innstillinger
                </summary>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: 'var(--text-color)' }}>
                      Kategori
                    </label>
                    <select
                      value={newDocument.category}
                      onChange={(e) => setNewDocument({...newDocument, category: e.target.value as "policy" | "procedure" | "form" | "report" | "other"})}
                      disabled={uploading}
                      style={{ 
                        width: '100%', 
                        padding: '0.75rem', 
                        border: '1px solid var(--border-color)', 
                        borderRadius: 'var(--radius-lg)', 
                        outline: 'none',
                        opacity: uploading ? 0.5 : 1,
                        background: 'var(--card-background)',
                        color: 'var(--text-color)'
                      }}
                    >
                      <option value="policy">Policy</option>
                      <option value="procedure">Prosedyre</option>
                      <option value="form">Skjema</option>
                      <option value="report">Rapport</option>
                      <option value="other">Annet</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: 'var(--text-color)' }}>
                      Prioritet
                    </label>
                    <select
                      value={newDocument.priority}
                      onChange={(e) => setNewDocument({...newDocument, priority: e.target.value as 'low' | 'normal' | 'high' | 'urgent'})}
                      disabled={uploading}
                      style={{ 
                        width: '100%', 
                        padding: '0.75rem', 
                        border: '1px solid var(--border-color)', 
                        borderRadius: 'var(--radius-lg)', 
                        outline: 'none',
                        opacity: uploading ? 0.5 : 1,
                        background: 'var(--card-background)',
                        color: 'var(--text-color)'
                      }}
                    >
                      <option value="low">Lav</option>
                      <option value="normal">Normal</option>
                      <option value="high">Høy</option>
                      <option value="urgent">Haster</option>
                    </select>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div>
                      <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: 'var(--text-color)' }}>
                        Versjon
                      </label>
                      <input
                        type="text"
                        value={newDocument.version}
                        onChange={(e) => setNewDocument({...newDocument, version: e.target.value})}
                        disabled={uploading}
                        style={{ 
                          width: '100%', 
                          padding: '0.75rem', 
                          border: '1px solid var(--border-color)', 
                          borderRadius: 'var(--radius-lg)', 
                          outline: 'none',
                          opacity: uploading ? 0.5 : 1,
                          background: 'var(--card-background)',
                          color: 'var(--text-color)'
                        }}
                        placeholder="1.0"
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: 'var(--text-color)' }}>
                        Språk
                      </label>
                      <select
                        value={newDocument.language}
                        onChange={(e) => setNewDocument({...newDocument, language: e.target.value})}
                        disabled={uploading}
                        style={{ 
                          width: '100%', 
                          padding: '0.75rem', 
                          border: '1px solid var(--border-color)', 
                          borderRadius: 'var(--radius-lg)', 
                          outline: 'none',
                          opacity: uploading ? 0.5 : 1,
                          background: 'var(--card-background)',
                          color: 'var(--text-color)'
                        }}
                      >
                        <option value="no">Norsk</option>
                        <option value="en">Engelsk</option>
                        <option value="sv">Svensk</option>
                        <option value="da">Dansk</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: 'var(--text-color)' }}>
                      Forfatter
                    </label>
                    <input
                      type="text"
                      value={newDocument.author}
                      onChange={(e) => setNewDocument({...newDocument, author: e.target.value})}
                      disabled={uploading}
                      style={{ 
                        width: '100%', 
                        padding: '0.75rem', 
                        border: '1px solid var(--border-color)', 
                        borderRadius: 'var(--radius-lg)', 
                        outline: 'none',
                        opacity: uploading ? 0.5 : 1,
                        background: 'var(--card-background)',
                        color: 'var(--text-color)'
                      }}
                      placeholder={userProfile?.displayName || userProfile?.email || 'Forfatter'}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: 'var(--text-color)' }}>
                      Utløpsdato (valgfritt)
                    </label>
                    <input
                      type="date"
                      value={newDocument.expiryDate}
                      onChange={(e) => setNewDocument({...newDocument, expiryDate: e.target.value})}
                      disabled={uploading}
                      style={{ 
                        width: '100%', 
                        padding: '0.75rem', 
                        border: '1px solid var(--border-color)', 
                        borderRadius: 'var(--radius-lg)', 
                        outline: 'none',
                        opacity: uploading ? 0.5 : 1,
                        background: 'var(--card-background)',
                        color: 'var(--text-color)'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: 'var(--text-color)' }}>
                      Tags (kommaseparert)
                    </label>
                    <input
                      type="text"
                      value={newDocument.tags}
                      onChange={(e) => setNewDocument({...newDocument, tags: e.target.value})}
                      disabled={uploading}
                      style={{ 
                        width: '100%', 
                        padding: '0.75rem', 
                        border: '1px solid var(--border-color)', 
                        borderRadius: 'var(--radius-lg)', 
                        outline: 'none',
                        opacity: uploading ? 0.5 : 1,
                        background: 'var(--card-background)',
                        color: 'var(--text-color)'
                      }}
                      placeholder="viktig, prosjekt, 2024, q1"
                    />
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <input
                        type="checkbox"
                        id="isPublic"
                        checked={newDocument.isPublic}
                        onChange={(e) => setNewDocument({...newDocument, isPublic: e.target.checked})}
                        disabled={uploading}
                        style={{ width: '16px', height: '16px', opacity: uploading ? 0.5 : 1 }}
                      />
                      <label htmlFor="isPublic" style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-color)' }}>
                        Offentlig dokument (synlig for alle ansatte)
                      </label>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <input
                        type="checkbox"
                        id="requiresSignature"
                        checked={newDocument.requiresSignature}
                        onChange={(e) => setNewDocument({...newDocument, requiresSignature: e.target.checked})}
                        disabled={uploading}
                        style={{ width: '16px', height: '16px', opacity: uploading ? 0.5 : 1 }}
                      />
                      <label htmlFor="requiresSignature" style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-color)' }}>
                        Krever signatur
                      </label>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <input
                        type="checkbox"
                        id="notifyUsers"
                        checked={newDocument.notifyUsers}
                        onChange={(e) => setNewDocument({...newDocument, notifyUsers: e.target.checked})}
                        disabled={uploading}
                        style={{ width: '16px', height: '16px', opacity: uploading ? 0.5 : 1 }}
                      />
                      <label htmlFor="notifyUsers" style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-color)' }}>
                        Varsle brukere ved opplasting
                      </label>
                    </div>
                  </div>
                </div>
              </details>
            </div>
            
            <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  resetDocumentForm();
                }}
                disabled={uploading}
                style={{ 
                  flex: '1',
                  padding: '0.75rem', 
                  border: '1px solid var(--border-color)', 
                  borderRadius: 'var(--radius-lg)', 
                  background: 'var(--card-background)',
                  color: 'var(--text-color)',
                  cursor: uploading ? 'not-allowed' : 'pointer',
                  opacity: uploading ? 0.5 : 1
                }}
              >
                Avbryt
              </button>
              {uploadMode === 'single' && selectedFiles.length > 0 && (
                <button
                  onClick={handleSingleUpload}
                  disabled={uploading || !newDocument.title.trim()}
                  className="btn btn-primary"
                  style={{ 
                    flex: '1',
                    padding: '0.75rem', 
                    cursor: (uploading || !newDocument.title.trim()) ? 'not-allowed' : 'pointer',
                    opacity: (uploading || !newDocument.title.trim()) ? 0.5 : 1
                  }}
                >
                  Last opp dokument
                </button>
              )}
              {uploadMode === 'bulk' && selectedFiles.length > 0 && (
                <button
                  onClick={handleBulkUpload}
                  disabled={uploading}
                  className="btn btn-primary"
                  style={{ 
                    flex: '1',
                    padding: '0.75rem', 
                    cursor: uploading ? 'not-allowed' : 'pointer',
                    opacity: uploading ? 0.5 : 1
                  }}
                >
                  Last opp {selectedFiles.length} {selectedFiles.length === 1 ? 'dokument' : 'dokumenter'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Create Folder Modal */}
      {showFolderModal && (
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
          zIndex: 1001
        }}>
          <div className="card" style={{ width: '90%', maxWidth: '500px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: 'var(--font-size-xl)', fontWeight: '600', color: 'var(--text-color)' }}>Opprett mappe</h2>
              <button
                onClick={() => {
                  setShowFolderModal(false);
                  setNewFolder({ name: '', description: '', parentId: null, isPublic: false });
                }}
                style={{ 
                  padding: '0.5rem', 
                  borderRadius: 'var(--radius-md)', 
                  border: 'none',
                  background: 'var(--card-background)',
                  cursor: 'pointer',
                  color: 'var(--text-color)'
                }}
              >
                ✕
              </button>
            </div>
            
            {error && (
              <div style={{ 
                padding: '0.75rem', 
                background: 'var(--red-50)', 
                border: '1px solid var(--red-200)', 
                borderRadius: 'var(--radius-lg)', 
                marginBottom: '1rem' 
              }}>
                <p style={{ color: 'var(--red-700)', fontSize: 'var(--font-size-sm)' }}>{error}</p>
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: 'var(--text-color)' }}>
                  Mappenavn *
                </label>
                <input
                  type="text"
                  value={newFolder.name}
                  onChange={(e) => setNewFolder({...newFolder, name: e.target.value})}
                  style={{ 
                    width: '100%', 
                    padding: '0.75rem', 
                    border: '1px solid var(--border-color)', 
                    borderRadius: 'var(--radius-lg)', 
                    outline: 'none',
                    background: 'var(--card-background)',
                    color: 'var(--text-color)'
                  }}
                  placeholder="Mappenavn"
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: 'var(--text-color)' }}>
                  Beskrivelse
                </label>
                <textarea
                  value={newFolder.description}
                  onChange={(e) => setNewFolder({...newFolder, description: e.target.value})}
                  style={{ 
                    width: '100%', 
                    padding: '0.75rem', 
                    border: '1px solid var(--border-color)', 
                    borderRadius: 'var(--radius-lg)', 
                    outline: 'none',
                    minHeight: '80px',
                    resize: 'vertical',
                    background: 'var(--card-background)',
                    color: 'var(--text-color)'
                  }}
                  placeholder="Beskrivelse av mappen"
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: 'var(--text-color)' }}>
                  Overordnet mappe
                </label>
                <select
                  value={newFolder.parentId || ''}
                  onChange={(e) => setNewFolder({...newFolder, parentId: e.target.value || null})}
                  style={{ 
                    width: '100%', 
                    padding: '0.75rem', 
                    border: '1px solid var(--border-color)', 
                    borderRadius: 'var(--radius-lg)', 
                    outline: 'none',
                    background: 'var(--card-background)',
                    color: 'var(--text-color)'
                  }}
                >
                  <option value="">Ingen (rot)</option>
                  {folders.map((folder) => (
                    <option key={folder.id} value={folder.id}>{folder.name}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <input
                  type="checkbox"
                  id="folderIsPublic"
                  checked={newFolder.isPublic}
                  onChange={(e) => setNewFolder({...newFolder, isPublic: e.target.checked})}
                  style={{ width: '16px', height: '16px' }}
                />
                <label htmlFor="folderIsPublic" style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-color)' }}>
                  Offentlig mappe (synlig for alle ansatte)
                </label>
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
              <button
                onClick={() => {
                  setShowFolderModal(false);
                  setNewFolder({ name: '', description: '', parentId: null, isPublic: false });
                }}
                style={{ 
                  flex: '1',
                  padding: '0.75rem', 
                  border: '1px solid var(--border-color)', 
                  borderRadius: 'var(--radius-lg)', 
                  background: 'var(--card-background)',
                  color: 'var(--text-color)',
                  cursor: 'pointer'
                }}
              >
                Avbryt
              </button>
              <button
                onClick={handleCreateFolder}
                className="btn btn-primary"
                style={{ 
                  flex: '1',
                  padding: '0.75rem'
                }}
              >
                Opprett mappe
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Document Detail Modal */}
      {showDetailModal && selectedDocument && (
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
          <div className="card" style={{ width: '90%', maxWidth: '700px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: 'var(--font-size-xl)', fontWeight: '600', color: 'var(--gray-900)' }}>Dokumentdetaljer</h2>
              <button
                onClick={() => setShowDetailModal(false)}
                style={{ 
                  padding: '0.5rem', 
                  borderRadius: 'var(--radius-md)', 
                  border: 'none',
                  background: 'var(--card-background)',
                  cursor: 'pointer',
                  color: 'var(--text-color)'
                }}
              >
                ✕
              </button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {/* Document Header */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', padding: '1rem', background: 'var(--gray-50)', borderRadius: 'var(--radius-lg)' }}>
                {getFileIcon(selectedDocument.fileType)}
                <div style={{ flex: '1' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <h3 style={{ fontSize: 'var(--font-size-lg)', fontWeight: '600', color: 'var(--gray-900)' }}>
                      {selectedDocument.title}
                    </h3>
                    {selectedDocument.isPublic && (
                      <Shield style={{ width: '16px', height: '16px', color: 'var(--green-600)' }} />
                    )}
                  </div>
                  <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--gray-600)', marginBottom: '0.5rem' }}>
                    {selectedDocument.fileName}
                  </p>
                  <div style={{ display: 'flex', gap: '1rem', fontSize: 'var(--font-size-sm)', color: 'var(--gray-500)' }}>
                    <span>{formatFileSize(selectedDocument.fileSize)}</span>
                    <span>•</span>
                    <span>{selectedDocument.fileType}</span>
                    <span>•</span>
                    <span>Opplastet {formatDate(selectedDocument.createdAt)}</span>
                  </div>
                </div>
              </div>

              {/* Description */}
              {selectedDocument.description && (
                <div>
                  <h4 style={{ fontSize: 'var(--font-size-base)', fontWeight: '600', color: 'var(--gray-900)', marginBottom: '0.5rem' }}>
                    Beskrivelse
                  </h4>
                  <p style={{ color: 'var(--gray-700)', lineHeight: '1.6' }}>
                    {selectedDocument.description}
                  </p>
                </div>
              )}

              {/* Tags */}
              {selectedDocument.tags && selectedDocument.tags.length > 0 && (
                <div>
                  <h4 style={{ fontSize: 'var(--font-size-base)', fontWeight: '600', color: 'var(--gray-900)', marginBottom: '0.5rem' }}>
                    Tags
                  </h4>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {selectedDocument.tags.map((tag, index) => (
                      <span key={index} style={{
                        padding: '0.25rem 0.75rem',
                        background: 'var(--blue-100)',
                        color: 'var(--blue-700)',
                        borderRadius: 'var(--radius-full)',
                        fontSize: 'var(--font-size-sm)',
                        fontWeight: '500'
                      }}>
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Metadata */}
              <div>
                <h4 style={{ fontSize: 'var(--font-size-base)', fontWeight: '600', color: 'var(--gray-900)', marginBottom: '0.5rem' }}>
                  Metadata
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                  <div>
                    <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--gray-500)', marginBottom: '0.25rem' }}>Kategori</p>
                    <p style={{ fontSize: 'var(--font-size-sm)', fontWeight: '500', color: 'var(--gray-900)', textTransform: 'capitalize' }}>
                      {selectedDocument.category}
                    </p>
                  </div>
                  <div>
                    <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--gray-500)', marginBottom: '0.25rem' }}>Synlighet</p>
                    <p style={{ fontSize: 'var(--font-size-sm)', fontWeight: '500', color: 'var(--gray-900)' }}>
                      {selectedDocument.isPublic ? 'Offentlig' : 'Privat'}
                    </p>
                  </div>
                  <div>
                    <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--gray-500)', marginBottom: '0.25rem' }}>Opplastet av</p>
                    <p style={{ fontSize: 'var(--font-size-sm)', fontWeight: '500', color: 'var(--gray-900)' }}>
                      {selectedDocument.uploadedBy}
                    </p>
                  </div>
                  <div>
                    <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--gray-500)', marginBottom: '0.25rem' }}>Sist oppdatert</p>
                    <p style={{ fontSize: 'var(--font-size-sm)', fontWeight: '500', color: 'var(--gray-900)' }}>
                      {formatDate(selectedDocument.updatedAt)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--gray-200)' }}>
                <button
                  onClick={() => downloadDocument(selectedDocument)}
                  className="btn btn-primary"
                  style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                >
                  <Download style={{ width: '16px', height: '16px' }} />
                  Last ned
                </button>
                <button
                  onClick={() => {
                    setShowDetailModal(false);
                    handleDeleteDocument(selectedDocument);
                  }}
                  style={{ 
                    padding: '0.75rem 1.5rem', 
                    border: '1px solid var(--border-color)', 
                    borderRadius: 'var(--radius-lg)', 
                    background: 'var(--card-background)',
                    color: 'var(--red-600)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}
                >
                  <Trash2 style={{ width: '16px', height: '16px' }} />
                  Slett
                </button>
                <button
                  onClick={() => setShowDetailModal(false)}
                  style={{ 
                    padding: '0.75rem 1.5rem', 
                    border: '1px solid var(--border-color)', 
                    borderRadius: 'var(--radius-lg)', 
                    background: 'var(--card-background)',
                    color: 'var(--text-color)',
                    cursor: 'pointer'
                  }}
                >
                  Lukk
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 