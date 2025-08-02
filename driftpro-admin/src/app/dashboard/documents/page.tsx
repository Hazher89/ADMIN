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
  Archive
} from 'lucide-react';

export default function DocumentsPage() {
  const { userProfile } = useAuth();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [newDocument, setNewDocument] = useState({
    title: '',
    description: '',
    category: 'other' as 'policy' | 'procedure' | 'form' | 'report' | 'other',
    isPublic: false,
    tags: ''
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
      const data = await firebaseService.getDocuments(userProfile.companyId);
      setDocuments(data);
    } catch (error) {
      console.error('Error loading documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !userProfile?.companyId) return;

    try {
      const documentData = {
        ...newDocument,
        uploadedBy: userProfile.id,
        companyId: userProfile.companyId,
        tags: newDocument.tags ? newDocument.tags.split(',').map(tag => tag.trim()) : []
      };

      await firebaseService.uploadDocument(file, documentData);
      setShowAddModal(false);
      setNewDocument({
        title: '',
        description: '',
        category: 'other',
        isPublic: false,
        tags: ''
      });
      loadData();
    } catch (error) {
      console.error('Error uploading document:', error);
    }
  };

  const handleDeleteDocument = async (doc: Document) => {
    if (confirm('Er du sikker på at du vil slette dette dokumentet?')) {
      try {
        await firebaseService.deleteDocument(doc.id, doc.fileUrl);
        loadData();
      } catch (error) {
        console.error('Error deleting document:', error);
      }
    }
  };

  const downloadDocument = async (doc: Document) => {
    try {
      const response = await fetch(doc.fileUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = window.document.createElement('a');
      a.href = url;
      a.download = doc.fileName;
      window.document.body.appendChild(a);
      a.click();
      window.document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading document:', error);
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
                         (doc.fileName || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || doc.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const stats = {
    total: documents.length,
    pdf: documents.filter(d => d.fileType.includes('pdf')).length,
    images: documents.filter(d => d.fileType.includes('image')).length,
    recent: documents.filter(d => {
      const docDate = new Date(d.createdAt);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return docDate > weekAgo;
    }).length
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
            <p style={{ color: 'var(--gray-600)', marginTop: '0.25rem' }}>Administrer bedriftens dokumenter og filer</p>
          </div>
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

      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '2rem 1rem' }}>
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
                <Archive style={{ width: '24px', height: '24px', color: 'var(--green-600)' }} />
              </div>
              <div style={{ marginLeft: '1rem' }}>
                <p style={{ fontSize: 'var(--font-size-sm)', fontWeight: '500', color: 'var(--gray-600)' }}>Nye</p>
                <p style={{ fontSize: 'var(--font-size-2xl)', fontWeight: '600', color: 'var(--gray-900)' }}>{stats.recent}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="card" style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: '1rem' }}>
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
          </div>
        </div>

        {/* Documents List */}
        <div className="card">
          {filteredDocuments.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center' }}>
              <FileText style={{ width: '48px', height: '48px', color: 'var(--gray-400)', margin: '0 auto 1rem' }} />
              <h3 style={{ fontSize: 'var(--font-size-lg)', fontWeight: '600', color: 'var(--gray-900)', marginBottom: '0.5rem' }}>
                Ingen dokumenter
              </h3>
              <p style={{ color: 'var(--gray-600)' }}>
                Det er ingen dokumenter som matcher søkekriteriene dine.
              </p>
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
                    <tr key={doc.id} style={{ borderBottom: '1px solid var(--gray-100)' }}>
                      <td style={{ padding: '1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                          {getFileIcon(doc.fileType)}
                          <div>
                            <p style={{ fontWeight: '500', color: 'var(--gray-900)' }}>{doc.title}</p>
                            <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--gray-600)' }}>{doc.fileName}</p>
                            {doc.description && (
                              <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--gray-500)', marginTop: '0.25rem' }}>
                                {doc.description}
                              </p>
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
                        <p style={{ color: 'var(--gray-900)' }}>{formatDate(doc.createdAt)}</p>
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button
                            onClick={() => downloadDocument(doc)}
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
                            onClick={() => handleDeleteDocument(doc)}
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
          <div className="card" style={{ width: '90%', maxWidth: '500px', maxHeight: '90vh', overflowY: 'auto' }}>
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
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: 'var(--gray-700)' }}>
                  Fil *
                </label>
                <input
                  type="file"
                  onChange={handleFileUpload}
                  style={{ 
                    width: '100%', 
                    padding: '0.75rem', 
                    border: '1px solid var(--gray-300)', 
                    borderRadius: 'var(--radius-lg)', 
                    outline: 'none'
                  }}
                />
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: 'var(--gray-700)' }}>
                  Tittel *
                </label>
                <input
                  type="text"
                  value={newDocument.title}
                  onChange={(e) => setNewDocument({...newDocument, title: e.target.value})}
                  style={{ 
                    width: '100%', 
                    padding: '0.75rem', 
                    border: '1px solid var(--gray-300)', 
                    borderRadius: 'var(--radius-lg)', 
                    outline: 'none'
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
                  style={{ 
                    width: '100%', 
                    padding: '0.75rem', 
                    border: '1px solid var(--gray-300)', 
                    borderRadius: 'var(--radius-lg)', 
                    outline: 'none',
                    minHeight: '100px',
                    resize: 'vertical'
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
                  style={{ 
                    width: '100%', 
                    padding: '0.75rem', 
                    border: '1px solid var(--gray-300)', 
                    borderRadius: 'var(--radius-lg)', 
                    outline: 'none'
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
                  style={{ 
                    width: '100%', 
                    padding: '0.75rem', 
                    border: '1px solid var(--gray-300)', 
                    borderRadius: 'var(--radius-lg)', 
                    outline: 'none'
                  }}
                  placeholder="tag1, tag2, tag3"
                />
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <input
                  type="checkbox"
                  id="isPublic"
                  checked={newDocument.isPublic}
                  onChange={(e) => setNewDocument({...newDocument, isPublic: e.target.checked})}
                  style={{ width: '16px', height: '16px' }}
                />
                <label htmlFor="isPublic" style={{ fontSize: 'var(--font-size-sm)', color: 'var(--gray-700)' }}>
                  Offentlig dokument
                </label>
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
              <button
                onClick={() => setShowAddModal(false)}
                style={{ 
                  flex: '1',
                  padding: '0.75rem', 
                  border: '1px solid var(--gray-300)', 
                  borderRadius: 'var(--radius-lg)', 
                  background: 'var(--white)',
                  color: 'var(--gray-700)',
                  cursor: 'pointer'
                }}
              >
                Avbryt
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 