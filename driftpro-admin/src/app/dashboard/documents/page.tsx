'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { 
  FileText, 
  Upload, 
  Download, 
  Search, 
  Filter,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  Calendar,
  User,
  Folder,
  File,
  FileImage,
  FileVideo,
  FileAudio
} from 'lucide-react';

interface Document {
  id: string;
  name: string;
  type: 'pdf' | 'doc' | 'xls' | 'ppt' | 'image' | 'video' | 'audio' | 'other';
  size: string;
  uploadedBy: string;
  uploadDate: string;
  category: string;
  description: string;
  tags: string[];
}

export default function DocumentsPage() {
  const { userProfile } = useAuth();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedType, setSelectedType] = useState('all');

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    try {
      // Mock data for demonstration
      const mockDocuments: Document[] = [
        {
          id: '1',
          name: 'Sikkerhetsmanual v2.1.pdf',
          type: 'pdf',
          size: '2.4 MB',
          uploadedBy: 'John Doe',
          uploadDate: '2024-07-27T10:30:00Z',
          category: 'Sikkerhet',
          description: 'Oppdatert sikkerhetsmanual for alle ansatte',
          tags: ['sikkerhet', 'manual', 'viktig']
        },
        {
          id: '2',
          name: 'Skiftplan uke 32.xlsx',
          type: 'xls',
          size: '156 KB',
          uploadedBy: 'HR-avdelingen',
          uploadDate: '2024-07-27T09:15:00Z',
          category: 'Skiftplan',
          description: 'Skiftplan for uke 32',
          tags: ['skiftplan', 'uke32']
        },
        {
          id: '3',
          name: 'Bedriftslogo.png',
          type: 'image',
          size: '1.2 MB',
          uploadedBy: 'Marketing',
          uploadDate: '2024-07-27T08:45:00Z',
          category: 'Markedsføring',
          description: 'Høyoppløselig bedriftslogo',
          tags: ['logo', 'markedsføring']
        },
        {
          id: '4',
          name: 'Møtereferat 2024-07-26.docx',
          type: 'doc',
          size: '89 KB',
          uploadedBy: 'Jane Smith',
          uploadDate: '2024-07-26T16:00:00Z',
          category: 'Møter',
          description: 'Referat fra ledermøte',
          tags: ['møte', 'referat', 'ledelse']
        },
        {
          id: '5',
          name: 'Produktvideo.mp4',
          type: 'video',
          size: '15.7 MB',
          uploadedBy: 'Produksjon',
          uploadDate: '2024-07-26T14:30:00Z',
          category: 'Produksjon',
          description: 'Instruksjonsvideo for nytt produkt',
          tags: ['video', 'instruksjon', 'produkt']
        }
      ];

      setDocuments(mockDocuments);
    } catch (error) {
      console.error('Error loading documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredDocuments = documents.filter(document => {
    const matchesSearch = document.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         document.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         document.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = selectedCategory === 'all' || document.category === selectedCategory;
    const matchesType = selectedType === 'all' || document.type === selectedType;
    return matchesSearch && matchesCategory && matchesType;
  });

  const categories = ['all', ...Array.from(new Set(documents.map(doc => doc.category)))];
  const types = ['all', ...Array.from(new Set(documents.map(doc => doc.type)))];

  const getFileIcon = (type: Document['type']) => {
    switch (type) {
      case 'pdf': return <FileText style={{ width: '20px', height: '20px', color: '#ef4444' }} />;
      case 'doc': return <FileText style={{ width: '20px', height: '20px', color: '#2563eb' }} />;
      case 'xls': return <FileText style={{ width: '20px', height: '20px', color: '#16a34a' }} />;
      case 'ppt': return <FileText style={{ width: '20px', height: '20px', color: '#dc2626' }} />;
      case 'image': return <FileImage style={{ width: '20px', height: '20px', color: '#7c3aed' }} />;
      case 'video': return <FileVideo style={{ width: '20px', height: '20px', color: '#ea580c' }} />;
      case 'audio': return <FileAudio style={{ width: '20px', height: '20px', color: '#059669' }} />;
      default: return <File style={{ width: '20px', height: '20px', color: '#6b7280' }} />;
    }
  };

  const getTypeLabel = (type: Document['type']) => {
    switch (type) {
      case 'pdf': return 'PDF';
      case 'doc': return 'Word';
      case 'xls': return 'Excel';
      case 'ppt': return 'PowerPoint';
      case 'image': return 'Bilde';
      case 'video': return 'Video';
      case 'audio': return 'Lyd';
      default: return 'Annet';
    }
  };

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
          <div className="card-icon">
            <FileText />
          </div>
          <div>
            <h1 className="page-title">📄 Dokumenter</h1>
            <p className="page-subtitle">
              Administrer og del bedriftsdokumenter
            </p>
          </div>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <span className="badge badge-primary">
            {documents.length} dokumenter
          </span>
          <button className="btn btn-primary">
            <Upload style={{ width: '16px', height: '16px' }} />
            Last opp dokument
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <div className="search-container" style={{ flex: '1', minWidth: '300px' }}>
            <Search className="search-icon" />
            <input
              type="text"
              placeholder="Søk i dokumenter..."
              className="search-input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <select
            className="form-input"
            style={{ width: '150px' }}
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            {categories.map(category => (
              <option key={category} value={category}>
                {category === 'all' ? 'Alle kategorier' : category}
              </option>
            ))}
          </select>

          <select
            className="form-input"
            style={{ width: '150px' }}
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
          >
            {types.map(type => (
              <option key={type} value={type}>
                {type === 'all' ? 'Alle typer' : getTypeLabel(type as Document['type'])}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Documents Grid */}
      <div className="grid grid-cols-3">
        {filteredDocuments.map((document) => (
          <div key={document.id} className="card">
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', marginBottom: '1rem' }}>
              <div style={{ marginTop: '0.25rem' }}>
                {getFileIcon(document.type)}
              </div>
              <div style={{ flex: '1' }}>
                <h3 style={{ 
                  fontWeight: '600', 
                  color: '#333',
                  fontSize: '1rem',
                  marginBottom: '0.25rem',
                  wordBreak: 'break-word'
                }}>
                  {document.name}
                </h3>
                <p style={{ color: '#666', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                  {document.description}
                </p>
              </div>
              <button className="btn btn-secondary" style={{ padding: '0.5rem' }}>
                <MoreHorizontal style={{ width: '16px', height: '16px' }} />
              </button>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <User style={{ width: '14px', height: '14px', color: '#666' }} />
                <span style={{ fontSize: '0.875rem', color: '#666' }}>{document.uploadedBy}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <Calendar style={{ width: '14px', height: '14px', color: '#666' }} />
                <span style={{ fontSize: '0.875rem', color: '#666' }}>
                  {new Date(document.uploadDate).toLocaleDateString('no-NO')}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Folder style={{ width: '14px', height: '14px', color: '#666' }} />
                <span style={{ fontSize: '0.875rem', color: '#666' }}>{document.category}</span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <span className="badge badge-secondary" style={{ fontSize: '0.625rem' }}>
                {document.size}
              </span>
              <span className="badge badge-primary" style={{ fontSize: '0.625rem' }}>
                {getTypeLabel(document.type)}
              </span>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
              {document.tags.slice(0, 3).map((tag, index) => (
                <span 
                  key={index}
                  style={{ 
                    fontSize: '0.625rem',
                    padding: '0.125rem 0.5rem',
                    backgroundColor: 'rgba(102, 126, 234, 0.1)',
                    color: '#667eea',
                    borderRadius: '12px'
                  }}
                >
                  {tag}
                </span>
              ))}
              {document.tags.length > 3 && (
                <span style={{ 
                  fontSize: '0.625rem',
                  padding: '0.125rem 0.5rem',
                  backgroundColor: 'rgba(102, 126, 234, 0.1)',
                  color: '#667eea',
                  borderRadius: '12px'
                }}>
                  +{document.tags.length - 3}
                </span>
              )}
            </div>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button className="btn btn-secondary" style={{ fontSize: '0.75rem', padding: '0.25rem 0.75rem' }}>
                <Eye style={{ width: '14px', height: '14px' }} />
                Se
              </button>
              <button className="btn btn-secondary" style={{ fontSize: '0.75rem', padding: '0.25rem 0.75rem' }}>
                <Download style={{ width: '14px', height: '14px' }} />
                Last ned
              </button>
              <button className="btn btn-secondary" style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}>
                <Edit style={{ width: '14px', height: '14px' }} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredDocuments.length === 0 && !loading && (
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <FileText style={{ width: '64px', height: '64px', color: '#ccc', margin: '0 auto 1rem' }} />
          <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#333', marginBottom: '0.5rem' }}>
            Ingen dokumenter funnet
          </h3>
          <p style={{ color: '#666', marginBottom: '1.5rem' }}>
            {searchTerm || selectedCategory !== 'all' || selectedType !== 'all' 
              ? 'Prøv å endre søkekriteriene' 
              : 'Du har ingen dokumenter for øyeblikket'}
          </p>
          <button className="btn btn-primary">
            <Upload style={{ width: '16px', height: '16px' }} />
            Last opp ditt første dokument
          </button>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <div className="loading" style={{ margin: '0 auto 1rem' }}></div>
          <p style={{ color: '#666' }}>Laster dokumenter...</p>
        </div>
      )}
    </div>
  );
} 