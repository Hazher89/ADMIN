'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { gdprService, GDPRConsent } from '@/lib/gdpr-service';
import { CheckCircle, XCircle, Shield, FileText, Download, Trash2 } from 'lucide-react';

interface GDPRConsentManagerProps {
  userId?: string; // If provided, manages consents for this user (admin view)
  readOnly?: boolean;
}

export default function GDPRConsentManager({ userId, readOnly = false }: GDPRConsentManagerProps) {
  const { userProfile } = useAuth();
  const [consents, setConsents] = useState<GDPRConsent[]>([]);
  const [loading, setLoading] = useState(true);
  const [privacyPolicyText, setPrivacyPolicyText] = useState('');

  const currentUserId = userId || userProfile?.id;
  const companyId = userProfile?.companyId || '';

  useEffect(() => {
    if (currentUserId && companyId) {
      loadConsents();
      loadPrivacyPolicy();
    }
  }, [currentUserId, companyId]);

  const loadConsents = async () => {
    if (!currentUserId || !companyId) return;
    
    try {
      setLoading(true);
      const userConsents = await gdprService.getConsents(currentUserId, companyId);
      setConsents(userConsents);
    } catch (error) {
      console.error('Error loading consents:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadPrivacyPolicy = async () => {
    try {
      const policy = await gdprService.getLatestPrivacyPolicy();
      setPrivacyPolicyText(policy);
    } catch (error) {
      console.error('Error loading privacy policy:', error);
    }
  };

  const handleToggleConsent = async (consentType: GDPRConsent['consentType'], granted: boolean) => {
    if (!currentUserId || !companyId || readOnly) return;

    try {
      await gdprService.recordConsent(currentUserId, companyId, {
        consentType,
        granted,
        consentText: privacyPolicyText,
        version: '1.0',
        grantedAt: granted ? new Date().toISOString() : null,
        revokedAt: !granted ? new Date().toISOString() : null,
        ipAddress: undefined, // Would get from request in production
        userAgent: navigator.userAgent,
      });
      await loadConsents();
    } catch (error) {
      console.error('Error updating consent:', error);
      alert('Feil ved oppdatering av samtykke. Prøv igjen.');
    }
  };

  const handleExportData = async () => {
    if (!currentUserId || !companyId) return;

    try {
      const userData = await gdprService.exportUserData(currentUserId, companyId);
      const blob = new Blob([JSON.stringify(userData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `personopplysninger-${currentUserId}-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting data:', error);
      alert('Feil ved eksport av data. Prøv igjen.');
    }
  };

  const handleRequestDeletion = async () => {
    if (!currentUserId || !companyId || readOnly) return;

    if (!confirm('Er du sikker på at du vil be om sletting av alle dine personopplysninger? Dette kan ikke angres.')) {
      return;
    }

    try {
      await gdprService.requestDataErasure(currentUserId, companyId, 'Bruker har bedt om sletting via GDPR-komponent');
      alert('Forespørsel om sletting er sendt. Du vil motta en bekreftelse snart.');
    } catch (error) {
      console.error('Error requesting deletion:', error);
      alert('Feil ved forespørsel om sletting. Prøv igjen.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const consentTypes: Array<{ type: GDPRConsent['consentType']; label: string; description: string }> = [
    {
      type: 'data_processing',
      label: 'Behandling av personopplysninger',
      description: 'Jeg samtykker til at DriftPro behandler mine personopplysninger for å levere tjenesten.',
    },
    {
      type: 'marketing',
      label: 'Markedsføring',
      description: 'Jeg samtykker til å motta markedsføringsmateriell via e-post.',
    },
    {
      type: 'analytics',
      label: 'Analyse og statistikk',
      description: 'Jeg samtykker til at mine data brukes til analyse og forbedring av tjenesten.',
    },
    {
      type: 'third_party',
      label: 'Del data med tredjeparter',
      description: 'Jeg samtykker til at mine data deles med pålitelige tredjepartstjenester.',
    },
    {
      type: 'data_sharing',
      label: 'Deling med samarbeidspartnere',
      description: 'Jeg samtykker til at mine data deles med samarbeidspartnere når det er nødvendig.',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Shield className="w-5 h-5 text-blue-600 mt-0.5" />
          <div>
            <h3 className="font-semibold text-blue-900 mb-1">Dine personvernrettigheter</h3>
            <p className="text-sm text-blue-700">
              Under GDPR har du rett til innsyn, retting, sletting, dataportabilitet og mer. 
              Du kan administrere dine samtykker nedenfor.
            </p>
          </div>
        </div>
      </div>

      {/* Privacy Policy */}
      {privacyPolicyText && (
        <div className="border rounded-lg p-4 max-h-64 overflow-y-auto">
          <div className="flex items-center gap-2 mb-3">
            <FileText className="w-5 h-5 text-gray-600" />
            <h3 className="font-semibold text-gray-900">Personvernpolitikk</h3>
          </div>
          <div className="prose prose-sm max-w-none">
            <div className="whitespace-pre-wrap text-sm text-gray-700">{privacyPolicyText}</div>
          </div>
        </div>
      )}

      {/* Consent Management */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Samtykkeinnstillinger</h3>
        {consentTypes.map(({ type, label, description }) => {
          const consent = consents.find(c => c.consentType === type);
          const isGranted = consent?.granted === true;

          return (
            <div key={type} className="border rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    {isGranted ? (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    ) : (
                      <XCircle className="w-5 h-5 text-gray-400" />
                    )}
                    <h4 className="font-medium text-gray-900">{label}</h4>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">{description}</p>
                  {consent && (
                    <div className="text-xs text-gray-500">
                      {consent.granted ? (
                        <span>Innvilget: {new Date(consent.grantedAt!).toLocaleDateString('nb-NO')}</span>
                      ) : (
                        <span>Tilbakekalt: {new Date(consent.revokedAt!).toLocaleDateString('nb-NO')}</span>
                      )}
                    </div>
                  )}
                </div>
                {!readOnly && (
                  <div className="ml-4">
                    <button
                      onClick={() => handleToggleConsent(type, !isGranted)}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                        isGranted
                          ? 'bg-red-50 text-red-700 hover:bg-red-100'
                          : 'bg-green-50 text-green-700 hover:bg-green-100'
                      }`}
                    >
                      {isGranted ? 'Tilbakekall' : 'Innvilg'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Data Rights Actions */}
      <div className="border-t pt-6 space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Dine rettigheter</h3>
        
        <div className="grid gap-4 md:grid-cols-2">
          <button
            onClick={handleExportData}
            disabled={readOnly}
            className="flex items-center gap-3 p-4 border rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className="w-5 h-5 text-blue-600" />
            <div className="text-left">
              <div className="font-medium text-gray-900">Eksporter mine data</div>
              <div className="text-sm text-gray-600">Last ned alle dine personopplysninger</div>
            </div>
          </button>

          <button
            onClick={handleRequestDeletion}
            disabled={readOnly}
            className="flex items-center gap-3 p-4 border border-red-200 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Trash2 className="w-5 h-5 text-red-600" />
            <div className="text-left">
              <div className="font-medium text-red-900">Be om sletting</div>
              <div className="text-sm text-red-600">Be om sletting av alle personopplysninger</div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}

