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
  SortDesc
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
  const [newDocument, setNewDocument] = useState({
    title: '',
    description: '',
    category: 'other' as 'policy' | 'procedure' | 'form' | 'report' | 'other',
    isPublic: false,
    tags: '',
    departmentId: ''
  });

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (userProfile?.companyId) {
      loadData();
    }
  }, [userProfile?.companyId]);

  const loadData = async () => {
    if (!userProfile?.companyId) return;

    try {
      setLoading(true);
      setError(null);
      const data = await firebaseService.getDocuments(userProfile.companyId);
      setDocuments(data);
    } catch (error) {
      console.error('Error loading documents:', error);
      setError('Feil ved lasting av dokumenter: ' + (error instanceof Error ? error.message : 'Ukjent feil'));
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !userProfile?.companyId) return;

    if (!newDocument.title.trim()) {
      setError('Tittel er påkrevd');
      return;
    }

    try {
      setUploading(true);
      setUploadProgress(0);
      setError(null);

      // Simulate upload progress
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
        companyId: userProfile.companyId,
        tags: newDocument.tags ? newDocument.tags.split(',').map(tag => tag.trim()) : []
      };

      await firebaseService.uploadDocument(file, documentData);
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      setTimeout(() => {
        setShowAddModal(false);
        setNewDocument({
          title: '',
          description: '',
          category: 'other',
          isPublic: false,
          tags: '',
          departmentId: ''
        });
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
    pdf: documents.filter(d => d.fileType.includes('pdf')).length,
    images: documents.filter(d => d.fileType.includes('image')).length,
    documents: documents.filter(d => d.fileType.includes('word') || d.fileType.includes('document')).length,
    spreadsheets: documents.filter(d => d.fileType.includes('spreadsheet') || d.fileType.includes('excel')).length,
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

  return (
    <div style={{ minHeight: '100vh', background: 'var(--gray-50)' }}>
      {/* Header */}
      <div style={{ background: 'var(--white)', boxShadow: 'var(--shadow-sm)', borderBottom: '1px solid var(--gray-200)', padding: '1.5rem 2rem' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1 style={{ fontSize: 'var(--font-size-2xl)', fontWeight: '700', color: 'var(--gray-900)' }}>Dokumenter</h1>
            <p style={{ color: 'var(--gray-600)', marginTop: '0.25rem' }}>
              {documents.length} dokumenter • {formatFileSize(documents.reduce((sum, doc) => sum + (doc.fileSize || 0), 0))} total størrelse
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button
              onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
              style={{ 
                padding: '0.5rem', 
                borderRadius: 'var(--radius-md)', 
                border: '1px solid var(--gray-300)',
                background: 'var(--white)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem'
              }}
              title={viewMode === 'grid' ? 'Listevisning' : 'Rutenettvisning'}
            >
              {viewMode === 'grid' ? <List style={{ width: '16px', height: '16px' }} /> : <Grid style={{ width: '16px', height: '16px' }} />}
            </button>
            <button
              onClick={() => setShowAddModal(true)}
              className="btn btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              <Plus style={{ width: '16px', height: '16px' }} />
              Last opp dokument
            </button>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '2rem 1rem' }}>
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
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <div style={{ padding: '0.75rem', background: 'var(--blue-100)', borderRadius: 'var(--radius-lg)' }}>
                <FileText style={{ width: '24px', height: '24px', color: 'var(--blue-600)' }} />
              </div>
              <div style={{ marginLeft: '1rem' }}>
                <p style={{ fontSize: 'var(--font-size-sm)', fontWeight: '500', color: 'var(--gray-600)' }}>Totalt</p>
                <p style={{ fontSize: 'var(--font-size-2xl)', fontWeight: '600', color: 'var(--gray-900)' }}>{stats.total}</p>
              </div>
            </div>
          </div>
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <div style={{ padding: '0.75rem', background: 'var(--red-100)', borderRadius: 'var(--radius-lg)' }}>
                <FileText style={{ width: '24px', height: '24px', color: 'var(--red-600)' }} />
              </div>
              <div style={{ marginLeft: '1rem' }}>
                <p style={{ fontSize: 'var(--font-size-sm)', fontWeight: '500', color: 'var(--gray-600)' }}>PDF</p>
                <p style={{ fontSize: 'var(--font-size-2xl)', fontWeight: '600', color: 'var(--gray-900)' }}>{stats.pdf}</p>
              </div>
            </div>
          </div>
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
        <div className="card" style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: '1rem', alignItems: 'center' }}>
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
                  placeholder="Søk i dokumenter, beskrivelser eller tags..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{ 
                    width: '100%', 
                    padding: '0.75rem 0.75rem 0.75rem 2.5rem', 
                    border: '1px solid var(--gray-300)', 
                    borderRadius: 'var(--radius-lg)', 
                    outline: 'none'
                  }}
                />
              </div>
            </div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              style={{ 
                padding: '0.75rem', 
                border: '1px solid var(--gray-300)', 
                borderRadius: 'var(--radius-lg)', 
                outline: 'none',
                minWidth: isMobile ? '100%' : '150px'
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
                padding: '0.75rem', 
                border: '1px solid var(--gray-300)', 
                borderRadius: 'var(--radius-lg)', 
                outline: 'none',
                minWidth: isMobile ? '100%' : '120px'
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
                padding: '0.75rem', 
                border: '1px solid var(--gray-300)', 
                borderRadius: 'var(--radius-lg)', 
                background: 'var(--white)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem'
              }}
              title={sortOrder === 'asc' ? 'Synkende rekkefølge' : 'Stigende rekkefølge'}
            >
              {sortOrder === 'asc' ? <SortDesc style={{ width: '16px', height: '16px' }} /> : <SortAsc style={{ width: '16px', height: '16px' }} />}
            </button>
          </div>
          {searchTerm && (
            <div style={{ marginTop: '1rem', padding: '0.75rem', background: 'var(--blue-50)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--blue-200)' }}>
              <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--blue-700)' }}>
                {filteredDocuments.length} dokumenter funnet for "{searchTerm}"
              </p>
            </div>
          )}
        </div>

        {/* Documents List */}
        <div className="card">
          {filteredDocuments.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center' }}>
              <FileText style={{ width: '48px', height: '48px', color: 'var(--gray-400)', margin: '0 auto 1rem' }} />
              <h3 style={{ fontSize: 'var(--font-size-lg)', fontWeight: '600', color: 'var(--gray-900)', marginBottom: '0.5rem' }}>
                {searchTerm ? 'Ingen dokumenter funnet' : 'Ingen dokumenter'}
              </h3>
              <p style={{ color: 'var(--gray-600)', marginBottom: '1rem' }}>
                {searchTerm 
                  ? 'Prøv å endre søkekriteriene dine eller legg til nye dokumenter.'
                  : 'Start med å laste opp ditt første dokument.'
                }
              </p>
              {!searchTerm && (
                <button
                  onClick={() => setShowAddModal(true)}
                  className="btn btn-primary"
                  style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: '0 auto' }}
                >
                  <Plus style={{ width: '16px', height: '16px' }} />
                  Last opp første dokument
                </button>
              )}
            </div>
          ) : (
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
                              border: '1px solid var(--gray-300)',
                              background: 'var(--white)',
                              cursor: 'pointer'
                            }}
                            title="Last ned"
                          >
                            <Download style={{ width: '16px', height: '16px', color: 'var(--gray-600)' }} />
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
                              border: '1px solid var(--blue-300)',
                              background: 'var(--white)',
                              cursor: 'pointer'
                            }}
                            title="Se detaljer"
                          >
                            <Eye style={{ width: '16px', height: '16px', color: 'var(--blue-600)' }} />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteDocument(doc);
                            }}
                            style={{ 
                              padding: '0.5rem', 
                              borderRadius: 'var(--radius-md)', 
                              border: '1px solid var(--red-300)',
                              background: 'var(--white)',
                              cursor: 'pointer'
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

      {/* Add Modal */}
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
          <div className="card" style={{ width: '90%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: 'var(--font-size-xl)', fontWeight: '600', color: 'var(--gray-900)' }}>Last opp dokument</h2>
              <button
                onClick={() => setShowAddModal(false)}
                style={{ 
                  padding: '0.5rem', 
                  borderRadius: 'var(--radius-md)', 
                  border: 'none',
                  background: 'var(--gray-100)',
                  cursor: 'pointer'
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
                  <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--gray-600)' }}>Laster opp...</span>
                  <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--gray-600)' }}>{uploadProgress}%</span>
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
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: 'var(--gray-700)' }}>
                  Fil *
                </label>
                <input
                  type="file"
                  onChange={handleFileUpload}
                  disabled={uploading}
                  style={{ 
                    width: '100%', 
                    padding: '0.75rem', 
                    border: '1px solid var(--gray-300)', 
                    borderRadius: 'var(--radius-lg)', 
                    outline: 'none',
                    opacity: uploading ? 0.5 : 1
                  }}
                />
                <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--gray-500)', marginTop: '0.25rem' }}>
                  Støttede formater: PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, JPG, PNG, GIF (maks 10MB)
                </p>
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: 'var(--gray-700)' }}>
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
                    border: '1px solid var(--gray-300)', 
                    borderRadius: 'var(--radius-lg)', 
                    outline: 'none',
                    opacity: uploading ? 0.5 : 1
                  }}
                  placeholder="Dokument tittel"
                />
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: 'var(--gray-700)' }}>
                  Beskrivelse
                </label>
                <textarea
                  value={newDocument.description}
                  onChange={(e) => setNewDocument({...newDocument, description: e.target.value})}
                  disabled={uploading}
                  style={{ 
                    width: '100%', 
                    padding: '0.75rem', 
                    border: '1px solid var(--gray-300)', 
                    borderRadius: 'var(--radius-lg)', 
                    outline: 'none',
                    minHeight: '100px',
                    resize: 'vertical',
                    opacity: uploading ? 0.5 : 1
                  }}
                  placeholder="Beskrivelse av dokumentet"
                />
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: 'var(--gray-700)' }}>
                  Kategori
                </label>
                <select
                  value={newDocument.category}
                  onChange={(e) => setNewDocument({...newDocument, category: e.target.value as "policy" | "procedure" | "form" | "report" | "other"})}
                  disabled={uploading}
                  style={{ 
                    width: '100%', 
                    padding: '0.75rem', 
                    border: '1px solid var(--gray-300)', 
                    borderRadius: 'var(--radius-lg)', 
                    outline: 'none',
                    opacity: uploading ? 0.5 : 1
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
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: 'var(--gray-700)' }}>
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
                    border: '1px solid var(--gray-300)', 
                    borderRadius: 'var(--radius-lg)', 
                    outline: 'none',
                    opacity: uploading ? 0.5 : 1
                  }}
                  placeholder="viktig, prosjekt, 2024, q1"
                />
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <input
                  type="checkbox"
                  id="isPublic"
                  checked={newDocument.isPublic}
                  onChange={(e) => setNewDocument({...newDocument, isPublic: e.target.checked})}
                  disabled={uploading}
                  style={{ width: '16px', height: '16px', opacity: uploading ? 0.5 : 1 }}
                />
                <label htmlFor="isPublic" style={{ fontSize: 'var(--font-size-sm)', color: 'var(--gray-700)' }}>
                  Offentlig dokument (synlig for alle ansatte)
                </label>
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
              <button
                onClick={() => setShowAddModal(false)}
                disabled={uploading}
                style={{ 
                  flex: '1',
                  padding: '0.75rem', 
                  border: '1px solid var(--gray-300)', 
                  borderRadius: 'var(--radius-lg)', 
                  background: 'var(--white)',
                  color: 'var(--gray-700)',
                  cursor: uploading ? 'not-allowed' : 'pointer',
                  opacity: uploading ? 0.5 : 1
                }}
              >
                Avbryt
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
                  background: 'var(--gray-100)',
                  cursor: 'pointer'
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
                    border: '1px solid var(--red-300)', 
                    borderRadius: 'var(--radius-lg)', 
                    background: 'var(--white)',
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
                    border: '1px solid var(--gray-300)', 
                    borderRadius: 'var(--radius-lg)', 
                    background: 'var(--white)',
                    color: 'var(--gray-700)',
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