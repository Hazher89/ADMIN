'use client';

import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Folder, 
  FileText, 
  Download, 
  Eye, 
  Calendar,
  User,
  Building,
  Package,
  Truck,
  LogIn,
  LogOut,
  RefreshCw,
  Filter,
  SortAsc,
  SortDesc,
  Grid,
  List,
  AlertCircle,
  Info,
  Globe,
  Plus,
  Star,
  FolderOpen,
  ChevronUp,
  ChevronDown,
  Trash2,
  Paperclip
} from 'lucide-react';
import { oneDriveService } from '@/lib/onedrive-service';
import { ONEDRIVE_FOLDERS } from '@/lib/onedrive-config';

interface MockFile {
  id: string;
  name: string;
  webUrl: string;
  size?: number;
  lastModifiedDateTime: string;
  folder?: any;
  parentReference?: { path: string };
}

interface SearchResult {
  file: MockFile;
  folder: string;
  type: 'folder' | 'pdf' | 'other';
}

export default function ArchivePage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [activeAccount, setActiveAccount] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [folderContents, setFolderContents] = useState<MockFile[]>([]);
  const [currentPath, setCurrentPath] = useState('');
  const [selectedFolder, setSelectedFolder] = useState('all');
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');
  const [viewMode, setViewMode] = useState('list');
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [filters, setFilters] = useState({
    foldersOnly: false,
    pdfOnly: false
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkLoginStatus = async () => {
      setIsLoading(true);
      try {
        const loggedIn = oneDriveService.isLoggedIn();
        setIsLoggedIn(loggedIn);
        if (loggedIn) {
          setActiveAccount(oneDriveService.getActiveAccount());
          await loadFolderContents();
        }
      } catch (error) {
        console.error('Error checking login status:', error);
      } finally {
        setIsLoading(false);
      }
    };
    checkLoginStatus();
  }, []);

  const handleLogin = async () => {
    setIsLoading(true);
    try {
      const account = await oneDriveService.loginWith2FA();
      if (account) {
        setIsLoggedIn(true);
        setActiveAccount(account);
        await oneDriveService.createFolderStructure();
        await loadFolderContents();
      }
    } catch (error) {
      console.error('Login failed:', error);
      let errorMessage = 'Innlogging feilet. Prøv igjen.';
      
      if (error instanceof Error) {
        if (error.message.includes('Client ID er ikke konfigurert')) {
          errorMessage = 'OneDrive Client ID er ikke konfigurert. Se ONEDRIVE_SETUP_GUIDE.md for instruksjoner.';
        } else if (error.message.includes('AADSTS700016')) {
          errorMessage = 'Azure App Registration ikke funnet. Sjekk at Client ID er riktig i .env.local filen.';
        } else if (error.message.includes('AADSTS50020')) {
          errorMessage = 'Ugyldig tenant. Sjekk at du logger inn med riktig konto (driftpro@mavilogistikk.no).';
        } else {
          errorMessage = error.message;
        }
      }
      
      alert(`❌ ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    setIsLoggedIn(false);
    setActiveAccount(null);
    setSearchResults([]);
    setFolderContents([]);
  };

  const loadFolderContents = async (folderPath: string = '') => {
    // Sjekk og forny token først
    const hasValidToken = await oneDriveService.ensureValidToken();
    if (!hasValidToken) {
      setError('❌ Du må være logget inn for å se filer');
      return;
    }

    setIsLoading(true);
    try {
      const files = await oneDriveService.getFilesInFolder(folderPath);
      setFolderContents(files);
      setCurrentPath(folderPath);
    } catch (error) {
      console.error('Error loading folder contents:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    // Sjekk og forny token først
    const hasValidToken = await oneDriveService.ensureValidToken();
    if (!hasValidToken) {
      setError('❌ Du må være logget inn for å søke');
      return;
    }

    setIsLoading(true);
    try {
      const results = await oneDriveService.searchFiles(searchQuery);
      
      const processedResults: SearchResult[] = results.map((file: MockFile) => {
        const folder = file.parentReference?.path || 'Root';
        const type = file.folder ? 'folder' : 
                    file.name.toLowerCase().endsWith('.pdf') ? 'pdf' : 'other';
        
        return {
          file,
          folder,
          type
        };
      });

      const filteredResults = selectedFolder === 'all' 
        ? processedResults 
        : processedResults.filter(result => 
            result.folder.toLowerCase().includes(selectedFolder.toLowerCase())
          );

      const sortedResults = filteredResults.sort((a, b) => {
        let comparison = 0;
        
        switch (sortBy) {
          case 'name':
            comparison = a.file.name.localeCompare(b.file.name);
            break;
          case 'date':
            comparison = new Date(a.file.lastModifiedDateTime).getTime() - 
                        new Date(b.file.lastModifiedDateTime).getTime();
            break;
          case 'size':
            comparison = (a.file.size || 0) - (b.file.size || 0);
            break;
        }
        
        return sortOrder === 'asc' ? comparison : -comparison;
      });

      setSearchResults(sortedResults);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileClick = async (file: MockFile) => {
    if (file.folder) {
      const newPath = currentPath ? `${currentPath}/${file.name}` : file.name;
      await loadFolderContents(newPath);
    } else {
      window.open(file.webUrl, '_blank');
    }
  };

  const handleDownload = async (file: MockFile) => {
    // Sjekk og forny token først
    const hasValidToken = await oneDriveService.ensureValidToken();
    if (!hasValidToken) {
      setError('❌ Du må være logget inn for å laste ned filer');
      return;
    }

    try {
      const blob = await oneDriveService.downloadFile(file.id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.name;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Download failed:', error);
      alert(`❌ Kunne ikke laste ned ${file.name}`);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };


  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('nb-NO', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getFileIcon = (file: MockFile) => {
    if (file.folder) {
      return (
        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white">
          <Folder className="w-6 h-6" />
        </div>
      );
    }
    if (file.name.toLowerCase().endsWith('.pdf')) {
      return (
        <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center text-white">
          <FileText className="w-6 h-6" />
        </div>
      );
    }
    return (
      <div className="w-10 h-10 bg-gradient-to-br from-gray-500 to-gray-600 rounded-full flex items-center justify-center text-white">
        <FileText className="w-6 h-6" />
      </div>
    );
  };

  // Sort files based on current sort settings
  const sortedFiles = [...folderContents].sort((a, b) => {
    let comparison = 0;
    
    switch (sortBy) {
      case 'name':
        comparison = a.name.localeCompare(b.name);
        break;
      case 'date':
        comparison = new Date(a.lastModifiedDateTime).getTime() - new Date(b.lastModifiedDateTime).getTime();
        break;
      case 'size':
        comparison = (a.size || 0) - (b.size || 0);
        break;
      default:
        comparison = 0;
    }

    return sortOrder === 'asc' ? comparison : -comparison;
  });

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-lg w-full">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <FolderOpen className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-3">OneDrive Arkiv</h1>
            <p className="text-gray-600 text-lg">Din sikre skylagring</p>
          </div>

          {/* OneDrive Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
            <div className="flex items-start space-x-3">
              <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">Hva er OneDrive-integrasjon?</p>
                <p>OneDrive er Microsofts skylagring hvor alle dine dokumenter lagres sikkert.</p>
                <p className="mt-1"><strong>Fordeler:</strong></p>
                <ul className="list-disc list-inside mt-1 space-y-1">
                  <li>📁 Automatisk organisering av kjørelister og skannelapper</li>
                  <li>🔍 Søk i alle dokumenter på tvers av mapper</li>
                  <li>☁️ Sikker skylagring (1TB gratis med Office 365)</li>
                  <li>📱 Tilgang fra alle enheter</li>
                  <li>🔄 Automatisk backup og synkronisering</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Ready to Use */}
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
            <div className="flex items-start space-x-3">
              <Info className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-red-800">
                <p className="font-medium mb-1">⚠️ Setup påkrevd!</p>
                <p>Du må først opprette en Azure App Registration for å bruke OneDrive-integrasjonen.</p>
                <p className="mt-1">Se <strong>ONEDRIVE_SETUP_GUIDE.md</strong> for detaljerte instruksjoner.</p>
              </div>
            </div>
          </div>

          {/* Quick Setup Steps */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
            <div className="flex items-start space-x-3">
              <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-2">🚀 Hurtig setup (5 minutter):</p>
                <ol className="list-decimal list-inside space-y-1 text-xs">
                  <li>Gå til <a href="https://portal.azure.com" target="_blank" className="underline">Azure Portal</a></li>
                  <li>Logg inn med <strong>driftpro@mavilogistikk.no</strong></li>
                  <li>Søk etter "App registrations"</li>
                  <li>Klikk "New registration"</li>
                  <li>Navn: "DriftPro OneDrive"</li>
                  <li>Account types: "Single tenant"</li>
                  <li>Redirect URI: <strong>"https://admin.driftpro.no"</strong></li>
                  <li>Kopier "Application (client) ID"</li>
                  <li>Legg Client ID i .env.local filen</li>
                  <li>Deploy til admin.driftpro.no</li>
                </ol>
              </div>
            </div>
          </div>

          {/* Technical Info */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6">
            <div className="flex items-start space-x-3">
              <Info className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-yellow-800">
                <p className="font-medium mb-1">🔧 Teknisk forklaring</p>
                <p><strong>Azure App Registration:</strong> En "nøkkel" som lar appen snakke med Microsoft OneDrive.</p>
                <p className="mt-1"><strong>Client ID:</strong> Unik identifikator for din app (som en brukernavn).</p>
                <p className="mt-1"><strong>Microsoft Graph:</strong> API som lar oss lese/skrive filer i OneDrive.</p>
                <p className="mt-1"><strong>2FA:</strong> Ekstra sikkerhet med engangskode på telefon.</p>
              </div>
            </div>
          </div>
          
          <button
            onClick={handleLogin}
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 disabled:opacity-50 text-white font-medium py-3 px-4 rounded-xl transition-all duration-200 flex items-center justify-center"
          >
            {isLoading ? (
              <>
                <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                Logger inn...
              </>
            ) : (
              <>
                <Globe className="w-5 h-5 mr-2" />
                Logg inn med driftpro@mavilogistikk.no
              </>
            )}
          </button>
        </div>
      </div>
    );
  }

  // Main archive application UI - Standard dashboard layout
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Page Header - Using same CSS classes as employees page */}
      <div className="page-header">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="page-title">📁 OneDrive Arkiv</h1>
            <p className="page-subtitle">
              {activeAccount?.name || activeAccount?.username || 'Microsoft-konto'} • Administrer og arkiver dokumenter
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => loadFolderContents()}
              disabled={isLoading}
              className="btn btn-secondary"
              title="Oppdater"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Oppdater
            </button>
            
            <div className="relative">
              <button className="btn btn-secondary">
                <User className="w-4 h-4 mr-2" />
                Konto
              </button>
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Logg ut</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="stats-section">
        <div className="stat-item">
          <div className="stat-number">{sortedFiles.length}</div>
          <div className="stat-label">Totalt antall filer</div>
        </div>
        <div className="stat-item">
          <div className="stat-number">{sortedFiles.filter(f => f.folder).length}</div>
          <div className="stat-label">Mapper</div>
        </div>
        <div className="stat-item">
          <div className="stat-number">{sortedFiles.filter(f => !f.folder).length}</div>
          <div className="stat-label">Dokumenter</div>
        </div>
        <div className="stat-item">
          <div className="stat-number">{sortedFiles.filter(f => f.name.toLowerCase().endsWith('.pdf')).length}</div>
          <div className="stat-label">PDF-filer</div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="search-filters-section">
        <div className="search-container">
          <Search className="search-icon" />
          <input
            type="text"
            placeholder="Søk i arkivet..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            className="search-input"
          />
        </div>
        <div className="filter-container">
          <Filter className="filter-icon" />
          <select
            value={selectedFolder}
            onChange={(e) => {
              setSelectedFolder(e.target.value);
              if (e.target.value !== 'all') {
                loadFolderContents(e.target.value);
              }
            }}
            className="filter-select"
          >
            <option value="all">Alle mapper</option>
            {Object.values(ONEDRIVE_FOLDERS).map((folder: any) => (
              <option key={folder} value={folder.toLowerCase()}>
                {folder}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Files Grid - Matching employees page structure */}
      <div className="grid grid-cols-3">
        {sortedFiles.map((file) => (
          <div key={file.id} className="card">
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', marginBottom: '1rem' }}>
              <div className="card-icon">
                {getFileIcon(file)}
              </div>
              <div style={{ flex: '1' }}>
                <h3 style={{ 
                  fontWeight: '600', 
                  color: '#333',
                  fontSize: '1.1rem',
                  marginBottom: '0.25rem'
                }}>
                  {file.name}
                </h3>
                <p style={{ color: '#666', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                  {file.size && formatFileSize(file.size)}
                  {file.folder && ' • Mappe'}
                </p>
              </div>
              <button 
                className="btn btn-secondary" 
                style={{ padding: '0.5rem' }}
                onClick={() => handleFileClick(file)}
              >
                <Eye style={{ width: '16px', height: '16px' }} />
              </button>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <Calendar style={{ width: '14px', height: '14px', color: '#666' }} />
                <span style={{ fontSize: '0.875rem', color: '#666' }}>
                  <strong>Endret:</strong> {formatDate(file.lastModifiedDateTime)}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <Folder style={{ width: '14px', height: '14px', color: '#666' }} />
                <span style={{ fontSize: '0.875rem', color: '#666' }}>
                  <strong>Mappe:</strong> {file.parentReference?.path || 'Root'}
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  window.open(file.webUrl, '_blank');
                }}
                className="btn btn-secondary"
                style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}
              >
                <Eye style={{ width: '14px', height: '14px', marginRight: '0.25rem' }} />
                Åpne
              </button>
              {!file.folder && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDownload(file);
                  }}
                  className="btn btn-primary"
                  style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}
                >
                  <Download style={{ width: '14px', height: '14px', marginRight: '0.25rem' }} />
                  Last ned
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {sortedFiles.length === 0 && !isLoading && (
        <div style={{ 
          textAlign: 'center', 
          padding: '3rem', 
          color: '#666',
          background: 'var(--white)',
          borderRadius: 'var(--radius-xl)',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <FolderOpen style={{ width: '4rem', height: '4rem', margin: '0 auto 1rem', color: '#ccc' }} />
          <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem', color: '#333' }}>Ingen filer funnet</h3>
          <p>Ingen filer funnet i denne mappen. Prøv å endre filter eller søkeord.</p>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div style={{ 
          textAlign: 'center', 
          padding: '3rem', 
          color: '#666',
          background: 'var(--white)',
          borderRadius: 'var(--radius-xl)',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <RefreshCw style={{ width: '2rem', height: '2rem', margin: '0 auto 1rem', animation: 'spin 1s linear infinite' }} />
          <p>Laster filer...</p>
        </div>
      )}
    </div>
  );
}