'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { 
  X, 
  Copy, 
  Download, 
  Upload, 
  File, 
  FileText, 
  Image as ImageIcon, 
  Trash2, 
  ExternalLink, 
  Building, 
  Users, 
  Calendar, 
  MapPin, 
  Globe, 
  ChevronDown,
  ChevronRight,
  Shield,
  Activity,
  User,
  AlertCircle
} from 'lucide-react';

interface CompanyDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  orgNumber: string;
  companyName: string;
}

interface CompanyFile {
  id: string;
  name: string;
  type: 'image' | 'document';
  url: string;
  uploadedAt: string;
  description?: string;
}

interface BrregData {
  organisasjonsnummer: string;
  navn: string;
  forretningsadresse?: {
    adresse?: string[];
    postnummer?: string;
    poststed?: string;
    kommune?: string;
    land?: string;
  };
  postadresse?: {
    adresse?: string[];
    postnummer?: string;
    poststed?: string;
    kommune?: string;
    land?: string;
  };
  organisasjonsform?: {
    kode?: string;
    beskrivelse?: string;
  };
  naeringskoder?: Array<{
    kode?: string;
    beskrivelse?: string;
  }>;
  stiftelsesdato?: string;
  vedtektsdato?: string;
  vedtektsfestet_formaal?: string;
  aktivitet?: string;
  institusjonell_sektorkode?: {
    kode?: string;
    beskrivelse?: string;
  };
  sist_innsendt_aarsregnskap?: string;
  maalform?: string;
  antall_ansatte?: string;
  daglig_leder?: {
    navn?: string;
    fodselsdato?: string;
  };
  styre?: Array<{
    navn?: string;
    fodselsdato?: string;
    rolle?: string;
  }>;
  regnskapsforer?: {
    navn?: string;
    organisasjonsnummer?: string;
    forretningsadresse?: {
      adresse?: string[];
      postnummer?: string;
      poststed?: string;
    };
  };
  registreringer?: Array<{
    register?: string;
    registreringsdato?: string;
  }>;
  underenheter?: Array<{
    navn?: string;
    organisasjonsnummer?: string;
  }>;
}

export default function CompanyDetailModal({ isOpen, onClose, orgNumber, companyName }: CompanyDetailModalProps) {
  const [brregData, setBrregData] = useState<BrregData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<string[]>(['basic', 'roles', 'files']);

  // File management states
  const [files, setFiles] = useState<CompanyFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileDescription, setFileDescription] = useState('');

  const fetchBrregData = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('Fetching Brreg data for org number:', orgNumber);
      const response = await fetch(`https://data.brreg.no/enhetsregisteret/api/enheter/${orgNumber}`);
      
      if (!response.ok) {
        throw new Error('Kunne ikke hente data fra Brønnøysundregistrene');
      }

      const data = await response.json();
      console.log('Brreg data received:', data);
      setBrregData(data);
    } catch (error) {
      console.error('Error fetching Brreg data:', error);
      setError(error instanceof Error ? error.message : 'Ukjent feil');
    } finally {
      setLoading(false);
    }
  }, [orgNumber]);

  useEffect(() => {
    if (isOpen && orgNumber) {
      fetchBrregData();
    }
  }, [isOpen, orgNumber, fetchBrregData]);

  const toggleSection = (section: string) => {
    setExpandedSections(prev => 
      prev.includes(section) 
        ? prev.filter(s => s !== section)
        : [...prev, section]
    );
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('nb-NO', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const formatAddress = (address: {
    adresse?: string[];
    postnummer?: string;
    poststed?: string;
    kommune?: string;
    land?: string;
  }) => {
    if (!address) return '';
    const parts = [
      address.adresse?.join(', '),
      address.postnummer,
      address.poststed,
      address.kommune,
      address.land
    ].filter(Boolean);
    return parts.join(', ');
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setFileDescription('');
      setUploadError(null);
    }
  };

  const uploadFile = async () => {
    if (!selectedFile) return;

    setUploading(true);
    setUploadError(null);

    try {
      // Simulate file upload - in real implementation, upload to Firebase Storage
      const fileType = selectedFile.type.startsWith('image/') ? 'image' : 'document';
      const newFile: CompanyFile = {
        id: Date.now().toString(),
        name: selectedFile.name,
        type: fileType,
        url: URL.createObjectURL(selectedFile), // Temporary URL for demo
        uploadedAt: new Date().toISOString(),
        description: fileDescription
      };

      setFiles(prev => [...prev, newFile]);
      setSelectedFile(null);
      setFileDescription('');
      setShowUploadModal(false);
    } catch (error) {
      setUploadError('Kunne ikke laste opp filen');
      console.error('Upload error:', error);
    } finally {
      setUploading(false);
    }
  };

  const deleteFile = (fileId: string) => {
    setFiles(prev => prev.filter(file => file.id !== fileId));
  };

  const downloadFile = (file: CompanyFile) => {
    // In real implementation, download from Firebase Storage
    const link = document.createElement('a');
    link.href = file.url;
    link.download = file.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getFileIcon = (type: 'image' | 'document') => {
    return type === 'image' ? <ImageIcon className="h-4 w-4" /> : <File className="h-4 w-4" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <Building className="h-6 w-6 text-blue-600" />
            <div>
              <h2 className="text-xl font-bold text-gray-900">{companyName}</h2>
              <p className="text-sm text-gray-600">Detaljert bedriftsinformasjon</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600">Henter bedriftsinformasjon...</span>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <AlertCircle className="h-5 w-5 text-red-600" />
                <span className="text-red-800">Feil: {error}</span>
              </div>
            </div>
          )}

          {brregData && (
            <>
              {/* Basic Information */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Grunnleggende informasjon</h3>
                  <button
                    onClick={() => toggleSection('basic')}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    {expandedSections.includes('basic') ? (
                      <ChevronDown className="h-5 w-5" />
                    ) : (
                      <ChevronRight className="h-5 w-5" />
                    )}
                  </button>
                </div>
                
                {expandedSections.includes('basic') && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Building className="h-4 w-4 text-gray-400" />
                        <span className="text-sm font-medium text-gray-700">Organisasjonsnummer:</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-900 font-mono">{brregData.organisasjonsnummer}</span>
                        <button
                          onClick={() => copyToClipboard(brregData.organisasjonsnummer)}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          <Copy className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    {brregData.forretningsadresse && (
                      <div className="flex items-start space-x-2">
                        <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
                        <div className="flex-1">
                          <span className="text-sm font-medium text-gray-700">Forretningsadresse:</span>
                          <p className="text-sm text-gray-900">{formatAddress(brregData.forretningsadresse)}</p>
                        </div>
                      </div>
                    )}

                    {brregData.organisasjonsform && (
                      <div className="flex items-center space-x-2">
                        <Shield className="h-4 w-4 text-gray-400" />
                        <span className="text-sm font-medium text-gray-700">Organisasjonsform:</span>
                        <span className="text-sm text-gray-900">{brregData.organisasjonsform.beskrivelse}</span>
                      </div>
                    )}

                    {brregData.naeringskoder && brregData.naeringskoder.length > 0 && (
                      <div className="flex items-start space-x-2">
                        <Activity className="h-4 w-4 text-gray-400 mt-0.5" />
                        <div className="flex-1">
                          <span className="text-sm font-medium text-gray-700">Næringskode:</span>
                          <p className="text-sm text-gray-900">
                            {brregData.naeringskoder[0].kode} {brregData.naeringskoder[0].beskrivelse}
                          </p>
                        </div>
                      </div>
                    )}

                    {brregData.stiftelsesdato && (
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <span className="text-sm font-medium text-gray-700">Stiftelsesdato:</span>
                        <span className="text-sm text-gray-900">{formatDate(brregData.stiftelsesdato)}</span>
                      </div>
                    )}

                    {brregData.antall_ansatte && (
                      <div className="flex items-center space-x-2">
                        <Users className="h-4 w-4 text-gray-400" />
                        <span className="text-sm font-medium text-gray-700">Antall ansatte:</span>
                        <span className="text-sm text-gray-900">{brregData.antall_ansatte}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Business Information */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Flere virksomhetsopplysninger</h3>
                  <button
                    onClick={() => toggleSection('business')}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    {expandedSections.includes('business') ? (
                      <ChevronDown className="h-5 w-5" />
                    ) : (
                      <ChevronRight className="h-5 w-5" />
                    )}
                  </button>
                </div>
                
                {expandedSections.includes('business') && (
                  <div className="space-y-3">
                    {brregData.aktivitet && (
                      <div className="flex items-start space-x-2">
                        <Activity className="h-4 w-4 text-gray-400 mt-0.5" />
                        <div className="flex-1">
                          <span className="text-sm font-medium text-gray-700">Aktivitet:</span>
                          <p className="text-sm text-gray-900">{brregData.aktivitet}</p>
                        </div>
                      </div>
                    )}

                    {brregData.maalform && (
                      <div className="flex items-center space-x-2">
                        <Globe className="h-4 w-4 text-gray-400" />
                        <span className="text-sm font-medium text-gray-700">Målform:</span>
                        <span className="text-sm text-gray-900">{brregData.maalform}</span>
                      </div>
                    )}

                    {brregData.postadresse && (
                      <div className="flex items-start space-x-2">
                        <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
                        <div className="flex-1">
                          <span className="text-sm font-medium text-gray-700">Postadresse:</span>
                          <p className="text-sm text-gray-900">{formatAddress(brregData.postadresse)}</p>
                        </div>
                      </div>
                    )}

                    {brregData.naeringskoder && brregData.naeringskoder.length > 1 && (
                      <div className="flex items-start space-x-2">
                        <Activity className="h-4 w-4 text-gray-400 mt-0.5" />
                        <div className="flex-1">
                          <span className="text-sm font-medium text-gray-700">Alle næringskoder:</span>
                          <div className="space-y-1 mt-1">
                            {brregData.naeringskoder.map((kode, index) => (
                              <p key={index} className="text-sm text-gray-900">
                                {kode.kode} - {kode.beskrivelse}
                              </p>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Roles */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Roller</h3>
                  <button
                    onClick={() => toggleSection('roles')}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    {expandedSections.includes('roles') ? (
                      <ChevronDown className="h-5 w-5" />
                    ) : (
                      <ChevronRight className="h-5 w-5" />
                    )}
                  </button>
                </div>
                
                {expandedSections.includes('roles') && (
                  <div className="space-y-4">
                    {brregData.daglig_leder && (
                      <div className="flex items-start space-x-2">
                        <User className="h-4 w-4 text-gray-400 mt-0.5" />
                        <div className="flex-1">
                          <span className="text-sm font-medium text-gray-700">Daglig leder:</span>
                          <p className="text-sm text-gray-900">
                            {brregData.daglig_leder.navn}
                            {brregData.daglig_leder.fodselsdato && ` (f. ${brregData.daglig_leder.fodselsdato})`}
                          </p>
                        </div>
                      </div>
                    )}

                    {brregData.styre && brregData.styre.length > 0 && (
                      <div className="flex items-start space-x-2">
                        <Shield className="h-4 w-4 text-gray-400 mt-0.5" />
                        <div className="flex-1">
                          <span className="text-sm font-medium text-gray-700">Styrets leder:</span>
                          {brregData.styre.map((member, index) => (
                            <div key={index} className="ml-4 mt-1">
                              <p className="text-sm text-gray-900">
                                {member.navn}
                                {member.fodselsdato && ` (f. ${member.fodselsdato})`}
                              </p>
                              {member.rolle && (
                                <p className="text-xs text-gray-600 ml-4">Representant for de ansatte</p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {brregData.regnskapsforer && (
                      <div className="flex items-start space-x-2">
                        <FileText className="h-4 w-4 text-gray-400 mt-0.5" />
                        <div className="flex-1">
                          <span className="text-sm font-medium text-gray-700">Regnskapsfører:</span>
                          <p className="text-sm text-gray-900">{brregData.regnskapsforer.navn}</p>
                          {brregData.regnskapsforer.organisasjonsnummer && (
                            <p className="text-sm text-gray-600">
                              Organisasjonsnummer: {brregData.regnskapsforer.organisasjonsnummer}
                            </p>
                          )}
                          {brregData.regnskapsforer.forretningsadresse && (
                            <p className="text-sm text-gray-600">
                              Forretningsadresse: {formatAddress(brregData.regnskapsforer.forretningsadresse)}
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Annual Reports */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Årsregnskap</h3>
                  <button
                    onClick={() => toggleSection('reports')}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    {expandedSections.includes('reports') ? (
                      <ChevronDown className="h-5 w-5" />
                    ) : (
                      <ChevronRight className="h-5 w-5" />
                    )}
                  </button>
                </div>
                
                {expandedSections.includes('reports') && (
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <FileText className="h-4 w-4 text-gray-400" />
                      <span className="text-sm font-medium text-gray-700">Kilde:</span>
                      <span className="text-sm text-gray-900">Regnskapsregisteret</span>
                    </div>
                    
                    {brregData.sist_innsendt_aarsregnskap && (
                      <div className="ml-6">
                        <p className="text-sm text-gray-700 mb-2">Hent dokumenter:</p>
                        <div className="space-y-1">
                          {['2024', '2023', '2022'].map(year => (
                            <div key={year} className="flex items-center space-x-2">
                              <span className="text-sm text-gray-600">{year}:</span>
                              <button className="text-blue-600 hover:text-blue-800 text-sm underline">
                                Årsregnskap
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Registrations */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Registre</h3>
                  <button
                    onClick={() => toggleSection('registrations')}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    {expandedSections.includes('registrations') ? (
                      <ChevronDown className="h-5 w-5" />
                    ) : (
                      <ChevronRight className="h-5 w-5" />
                    )}
                  </button>
                </div>
                
                {expandedSections.includes('registrations') && (
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Shield className="h-4 w-4 text-gray-400" />
                      <span className="text-sm font-medium text-gray-700">Registrert i:</span>
                    </div>
                    
                    {brregData.registreringer && brregData.registreringer.length > 0 ? (
                      <div className="ml-6 space-y-2">
                        {brregData.registreringer.map((reg, index) => (
                          <div key={index} className="flex items-center space-x-2">
                            <span className="text-sm text-gray-900 font-medium">{reg.register}</span>
                            {reg.registreringsdato && (
                              <span className="text-sm text-gray-600">
                                ({formatDate(reg.registreringsdato)})
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="ml-6">
                        <p className="text-sm text-gray-600">Ingen registreringer funnet</p>
                      </div>
                    )}

                    {brregData.stiftelsesdato && (
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <span className="text-sm font-medium text-gray-700">Stiftelsesdato:</span>
                        <span className="text-sm text-gray-900">{formatDate(brregData.stiftelsesdato)}</span>
                      </div>
                    )}

                    {brregData.vedtektsdato && (
                      <div className="flex items-center space-x-2">
                        <FileText className="h-4 w-4 text-gray-400" />
                        <span className="text-sm font-medium text-gray-700">Vedtektsdato:</span>
                        <span className="text-sm text-gray-900">{formatDate(brregData.vedtektsdato)}</span>
                      </div>
                    )}

                    {brregData.vedtektsfestet_formaal && (
                      <div className="flex items-start space-x-2">
                        <Activity className="h-4 w-4 text-gray-400 mt-0.5" />
                        <div className="flex-1">
                          <span className="text-sm font-medium text-gray-700">Vedtektsfestet formål:</span>
                          <p className="text-sm text-gray-900">{brregData.vedtektsfestet_formaal}</p>
                        </div>
                      </div>
                    )}

                    {brregData.institusjonell_sektorkode && (
                      <div className="flex items-center space-x-2">
                        <Building className="h-4 w-4 text-gray-400" />
                        <span className="text-sm font-medium text-gray-700">Institusjonell sektorkode:</span>
                        <span className="text-sm text-gray-900">
                          {brregData.institusjonell_sektorkode.kode} - {brregData.institusjonell_sektorkode.beskrivelse}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Affiliated Businesses */}
              {brregData.underenheter && brregData.underenheter.length > 0 && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Tilknyttede virksomheter</h3>
                    <button
                      onClick={() => toggleSection('affiliated')}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      {expandedSections.includes('affiliated') ? (
                        <ChevronDown className="h-5 w-5" />
                      ) : (
                        <ChevronRight className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                  
                  {expandedSections.includes('affiliated') && (
                    <div className="space-y-3">
                      <span className="text-sm font-medium text-gray-700">Underenhet:</span>
                      {brregData.underenheter.map((unit, index) => (
                        <div key={index} className="ml-4">
                          <p className="text-sm text-gray-900">
                            {unit.navn}, organisasjonsnummer {unit.organisasjonsnummer}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Files Section */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Bilder og dokumenter</h3>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setShowUploadModal(true)}
                      className="px-3 py-1 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 flex items-center space-x-1"
                    >
                      <Upload className="h-4 w-4" />
                      <span>Last opp</span>
                    </button>
                    <button
                      onClick={() => toggleSection('files')}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      {expandedSections.includes('files') ? (
                        <ChevronDown className="h-5 w-5" />
                      ) : (
                        <ChevronRight className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </div>
                
                {expandedSections.includes('files') && (
                  <div className="space-y-4">
                    {files.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {files.map((file) => (
                          <div key={file.id} className="bg-white border border-gray-200 rounded-lg p-4">
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex items-center space-x-2">
                                {getFileIcon(file.type)}
                                <span className="text-sm font-medium text-gray-900 truncate">{file.name}</span>
                              </div>
                              <button
                                onClick={() => deleteFile(file.id)}
                                className="text-red-600 hover:text-red-800"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                            
                            {file.type === 'image' && (
                              <div className="relative">
                                <Image
                                  src={file.url}
                                  alt={file.name}
                                  width={200}
                                  height={200}
                                  className="w-full h-32 object-cover rounded"
                                />
                              </div>
                            )}
                            
                            {file.description && (
                              <p className="text-sm text-gray-600 mb-3">{file.description}</p>
                            )}
                            
                            <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                              <span>Opplastet: {new Date(file.uploadedAt).toLocaleDateString('no-NO')}</span>
                            </div>
                            
                            <button
                              onClick={() => downloadFile(file)}
                              className="w-full px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center justify-center space-x-2"
                            >
                              <Download className="h-4 w-4" />
                              <span>Last ned</span>
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 bg-white rounded-lg border-2 border-dashed border-gray-300">
                        <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                        <p className="text-gray-600 mb-2">Ingen filer lastet opp</p>
                        <p className="text-sm text-gray-500 mb-4">Last opp bilder og dokumenter for denne bedriften</p>
                        <button
                          onClick={() => setShowUploadModal(true)}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                          Last opp fil
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <ExternalLink className="h-4 w-4" />
            <span>Data hentet fra Brønnøysundregistrene</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
          >
            Lukk
          </button>
        </div>
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Last opp fil</h3>
                <button
                  onClick={() => {
                    setShowUploadModal(false);
                    setSelectedFile(null);
                    setFileDescription('');
                    setUploadError(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-4">
                {/* File Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Velg fil
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                    <input
                      type="file"
                      onChange={handleFileSelect}
                      accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
                      className="hidden"
                      id="file-upload"
                    />
                    <label htmlFor="file-upload" className="cursor-pointer">
                      <Upload className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                      <p className="text-sm text-gray-600">
                        Klikk for å velge fil eller dra og slipp
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Støtter: Bilder, PDF, Word, Excel, tekstfiler
                      </p>
                    </label>
                  </div>
                  {selectedFile && (
                    <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                      <div className="flex items-center space-x-2">
                        {getFileIcon(selectedFile.type.startsWith('image/') ? 'image' : 'document')}
                        <span className="text-sm font-medium text-gray-900">{selectedFile.name}</span>
                      </div>
                      <p className="text-xs text-gray-600 mt-1">
                        Størrelse: {formatFileSize(selectedFile.size)}
                      </p>
                    </div>
                  )}
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Beskrivelse (valgfritt)
                  </label>
                  <textarea
                    value={fileDescription}
                    onChange={(e) => setFileDescription(e.target.value)}
                    placeholder="Beskriv filen eller legg til merknader..."
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows={3}
                  />
                </div>

                {/* Error Message */}
                {uploadError && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <p className="text-sm text-red-800">{uploadError}</p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex space-x-3 pt-4">
                  <button
                    onClick={() => {
                      setShowUploadModal(false);
                      setSelectedFile(null);
                      setFileDescription('');
                      setUploadError(null);
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                  >
                    Avbryt
                  </button>
                  <button
                    onClick={uploadFile}
                    disabled={!selectedFile || uploading}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center space-x-2"
                  >
                    {uploading ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    ) : (
                      <Upload className="h-4 w-4" />
                    )}
                    <span>{uploading ? 'Laster opp...' : 'Last opp'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}