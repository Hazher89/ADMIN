'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  X, 
  Copy, 
  ExternalLink, 
  Building, 
  MapPin, 
  Users, 
  Calendar, 
  FileText, 
  ChevronDown, 
  ChevronRight,
  Globe,
  User,
  Shield,
  Activity,
  TrendingUp,
  AlertCircle
} from 'lucide-react';

interface CompanyDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  orgNumber: string;
  companyName: string;
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
  const [expandedSections, setExpandedSections] = useState<string[]>(['basic', 'roles']);

  const fetchBrregData = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`https://data.brreg.no/enhetsregisteret/api/enheter/${orgNumber}`);
      
      if (!response.ok) {
        throw new Error('Kunne ikke hente data fra Brønnøysundregistrene');
      }

      const data = await response.json();
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
                    {brregData.vedtektsdato && (
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <span className="text-sm font-medium text-gray-700">Vedtektsdato:</span>
                        <span className="text-sm text-gray-900">{formatDate(brregData.vedtektsdato)}</span>
                      </div>
                    )}

                    {brregData.vedtektsfestet_formaal && (
                      <div className="flex items-start space-x-2">
                        <FileText className="h-4 w-4 text-gray-400 mt-0.5" />
                        <div className="flex-1">
                          <span className="text-sm font-medium text-gray-700">Vedtektsfestet formål:</span>
                          <p className="text-sm text-gray-900">{brregData.vedtektsfestet_formaal}</p>
                        </div>
                      </div>
                    )}

                    {brregData.aktivitet && (
                      <div className="flex items-start space-x-2">
                        <Activity className="h-4 w-4 text-gray-400 mt-0.5" />
                        <div className="flex-1">
                          <span className="text-sm font-medium text-gray-700">Aktivitet:</span>
                          <p className="text-sm text-gray-900">{brregData.aktivitet}</p>
                        </div>
                      </div>
                    )}

                    {brregData.institusjonell_sektorkode && (
                      <div className="flex items-center space-x-2">
                        <TrendingUp className="h-4 w-4 text-gray-400" />
                        <span className="text-sm font-medium text-gray-700">Institusjonell sektorkode:</span>
                        <span className="text-sm text-gray-900">
                          {brregData.institusjonell_sektorkode.kode} {brregData.institusjonell_sektorkode.beskrivelse}
                        </span>
                      </div>
                    )}

                    {brregData.sist_innsendt_aarsregnskap && (
                      <div className="flex items-center space-x-2">
                        <FileText className="h-4 w-4 text-gray-400" />
                        <span className="text-sm font-medium text-gray-700">Sist innsendt årsregnskap:</span>
                        <span className="text-sm text-gray-900">{brregData.sist_innsendt_aarsregnskap}</span>
                      </div>
                    )}

                    {brregData.maalform && (
                      <div className="flex items-center space-x-2">
                        <Globe className="h-4 w-4 text-gray-400" />
                        <span className="text-sm font-medium text-gray-700">Målform:</span>
                        <span className="text-sm text-gray-900">{brregData.maalform}</span>
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
                    <span className="text-sm font-medium text-gray-700">Registrert i:</span>
                    {brregData.registreringer && brregData.registreringer.map((reg, index) => (
                      <div key={index} className="ml-4">
                        <p className="text-sm text-gray-900">
                          {reg.register} ({formatDate(reg.registreringsdato || '')})
                        </p>
                      </div>
                    ))}
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
    </div>
  );
}