'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Mail, 
  Settings, 
  TestTube, 
  Save, 
  RefreshCw, 
  CheckCircle, 
  AlertCircle,
  Eye,
  EyeOff
} from 'lucide-react';

export default function EmailSettingsPage() {
  const { userProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [testEmail, setTestEmail] = useState('');
  const [testResult, setTestResult] = useState<any>(null);

  const [emailSettings, setEmailSettings] = useState({
    smtpHost: 'smtp.cloudflare.com',
    smtpPort: 587,
    smtpUser: 'noreplay@driftpro.no',
    smtpPassword: '',
    smtpSecure: false,
    fromEmail: 'noreplay@driftpro.no',
    fromName: 'DriftPro System',
    connectionTimeout: 60000,
    greetingTimeout: 30000,
    socketTimeout: 60000
  });

  useEffect(() => {
    if (userProfile?.companyId) {
      loadEmailSettings();
    }
  }, [userProfile?.companyId]);

  const loadEmailSettings = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/email-settings');
      if (response.ok) {
        const data = await response.json();
        if (data.settings) {
          setEmailSettings(prev => ({
            ...prev,
            ...data.settings,
            smtpPassword: data.settings.smtpPassword ? '••••••••' : ''
          }));
        }
      }
    } catch (error) {
      console.error('Error loading email settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveEmailSettings = async () => {
    try {
      setSaving(true);
      const response = await fetch('/api/email-settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          settings: emailSettings
        }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Email settings saved:', data);
        alert('E-post-innstillinger lagret!');
      } else {
        const error = await response.json();
        console.error('Error saving email settings:', error);
        alert('Feil ved lagring av e-post-innstillinger');
      }
    } catch (error) {
      console.error('Error saving email settings:', error);
      alert('Feil ved lagring av e-post-innstillinger');
    } finally {
      setSaving(false);
    }
  };

  const testEmailConfiguration = async () => {
    if (!testEmail) {
      alert('Vennligst skriv inn en test e-post-adresse');
      return;
    }

    try {
      setTesting(true);
      setTestResult(null);
      
      const response = await fetch('/api/test-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          testEmail: testEmail
        }),
      });

      const data = await response.json();
      setTestResult(data);
      
      if (data.success) {
        alert('Test e-post sendt! Sjekk innboksen din.');
      } else {
        alert(`Feil ved sending av test e-post: ${data.details}`);
      }
    } catch (error) {
      console.error('Error testing email:', error);
      alert('Feil ved testing av e-post-konfigurasjon');
    } finally {
      setTesting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--gray-50)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Laster e-post-innstillinger...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--gray-50)' }}>
      {/* Header */}
      <div style={{ background: 'var(--white)', boxShadow: 'var(--shadow-sm)', borderBottom: '1px solid var(--gray-200)', padding: '1.5rem 2rem' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h1 style={{ fontSize: 'var(--font-size-2xl)', fontWeight: '700', color: 'var(--gray-900)' }}>E-post-innstillinger</h1>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button 
              className="btn btn-secondary" 
              onClick={loadEmailSettings}
              disabled={loading}
            >
              <RefreshCw style={{ width: '16px', height: '16px', marginRight: '0.5rem' }} />
              Oppdater
            </button>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '2rem 1rem' }}>
        <div style={{ display: 'grid', gap: '2rem' }}>
          {/* Cloudflare Email Routing Configuration */}
          <div className="card">
            <div style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                <div style={{ background: 'var(--blue-100)', padding: '0.75rem', borderRadius: 'var(--radius-lg)' }}>
                  <Mail style={{ width: '24px', height: '24px', color: 'var(--blue-600)' }} />
                </div>
                <div>
                  <h2 style={{ fontSize: 'var(--font-size-lg)', fontWeight: '600', color: 'var(--gray-900)' }}>
                    Cloudflare Email Routing
                  </h2>
                  <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--gray-600)' }}>
                    Konfigurer e-post-innstillinger for Cloudflare Email Routing
                  </p>
                </div>
              </div>

              <div style={{ display: 'grid', gap: '1.5rem' }}>
                {/* SMTP Configuration */}
                <div>
                  <h3 style={{ fontSize: 'var(--font-size-base)', fontWeight: '600', color: 'var(--gray-900)', marginBottom: '1rem' }}>
                    SMTP-konfigurasjon
                  </h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: 'var(--font-size-sm)', fontWeight: '500', color: 'var(--gray-700)', marginBottom: '0.5rem' }}>
                        SMTP Host
                      </label>
                      <input
                        type="text"
                        value={emailSettings.smtpHost}
                        onChange={(e) => setEmailSettings(prev => ({ ...prev, smtpHost: e.target.value }))}
                        style={{
                          width: '100%',
                          padding: '0.75rem',
                          border: '1px solid var(--gray-300)',
                          borderRadius: 'var(--radius-lg)',
                          fontSize: 'var(--font-size-base)'
                        }}
                        placeholder="smtp.cloudflare.com"
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: 'var(--font-size-sm)', fontWeight: '500', color: 'var(--gray-700)', marginBottom: '0.5rem' }}>
                        SMTP Port
                      </label>
                      <input
                        type="number"
                        value={emailSettings.smtpPort}
                        onChange={(e) => setEmailSettings(prev => ({ ...prev, smtpPort: parseInt(e.target.value) }))}
                        style={{
                          width: '100%',
                          padding: '0.75rem',
                          border: '1px solid var(--gray-300)',
                          borderRadius: 'var(--radius-lg)',
                          fontSize: 'var(--font-size-base)'
                        }}
                        placeholder="587"
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: 'var(--font-size-sm)', fontWeight: '500', color: 'var(--gray-700)', marginBottom: '0.5rem' }}>
                        SMTP Brukernavn
                      </label>
                      <input
                        type="text"
                        value={emailSettings.smtpUser}
                        onChange={(e) => setEmailSettings(prev => ({ ...prev, smtpUser: e.target.value }))}
                        style={{
                          width: '100%',
                          padding: '0.75rem',
                          border: '1px solid var(--gray-300)',
                          borderRadius: 'var(--radius-lg)',
                          fontSize: 'var(--font-size-base)'
                        }}
                        placeholder="noreplay@driftpro.no"
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: 'var(--font-size-sm)', fontWeight: '500', color: 'var(--gray-700)', marginBottom: '0.5rem' }}>
                        SMTP Passord/API-nøkkel
                      </label>
                      <div style={{ position: 'relative' }}>
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={emailSettings.smtpPassword}
                          onChange={(e) => setEmailSettings(prev => ({ ...prev, smtpPassword: e.target.value }))}
                          style={{
                            width: '100%',
                            padding: '0.75rem',
                            paddingRight: '3rem',
                            border: '1px solid var(--gray-300)',
                            borderRadius: 'var(--radius-lg)',
                            fontSize: 'var(--font-size-base)'
                          }}
                          placeholder="Cloudflare API-nøkkel"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          style={{
                            position: 'absolute',
                            right: '0.75rem',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            padding: '0.25rem'
                          }}
                        >
                          {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* From Configuration */}
                <div>
                  <h3 style={{ fontSize: 'var(--font-size-base)', fontWeight: '600', color: 'var(--gray-900)', marginBottom: '1rem' }}>
                    Avsender-konfigurasjon
                  </h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: 'var(--font-size-sm)', fontWeight: '500', color: 'var(--gray-700)', marginBottom: '0.5rem' }}>
                        Fra E-post
                      </label>
                      <input
                        type="email"
                        value={emailSettings.fromEmail}
                        onChange={(e) => setEmailSettings(prev => ({ ...prev, fromEmail: e.target.value }))}
                        style={{
                          width: '100%',
                          padding: '0.75rem',
                          border: '1px solid var(--gray-300)',
                          borderRadius: 'var(--radius-lg)',
                          fontSize: 'var(--font-size-base)'
                        }}
                        placeholder="noreplay@driftpro.no"
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: 'var(--font-size-sm)', fontWeight: '500', color: 'var(--gray-700)', marginBottom: '0.5rem' }}>
                        Fra Navn
                      </label>
                      <input
                        type="text"
                        value={emailSettings.fromName}
                        onChange={(e) => setEmailSettings(prev => ({ ...prev, fromName: e.target.value }))}
                        style={{
                          width: '100%',
                          padding: '0.75rem',
                          border: '1px solid var(--gray-300)',
                          borderRadius: 'var(--radius-lg)',
                          fontSize: 'var(--font-size-base)'
                        }}
                        placeholder="DriftPro System"
                      />
                    </div>
                  </div>
                </div>

                {/* Save Button */}
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button
                    className="btn btn-primary"
                    onClick={saveEmailSettings}
                    disabled={saving}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                  >
                    {saving ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Lagrer...
                      </>
                    ) : (
                      <>
                        <Save size={16} />
                        Lagre innstillinger
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Test Email Configuration */}
          <div className="card">
            <div style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                <div style={{ background: 'var(--green-100)', padding: '0.75rem', borderRadius: 'var(--radius-lg)' }}>
                  <TestTube style={{ width: '24px', height: '24px', color: 'var(--green-600)' }} />
                </div>
                <div>
                  <h2 style={{ fontSize: 'var(--font-size-lg)', fontWeight: '600', color: 'var(--gray-900)' }}>
                    Test E-post-konfigurasjon
                  </h2>
                  <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--gray-600)' }}>
                    Send en test e-post for å verifisere at konfigurasjonen fungerer
                  </p>
                </div>
              </div>

              <div style={{ display: 'grid', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: 'var(--font-size-sm)', fontWeight: '500', color: 'var(--gray-700)', marginBottom: '0.5rem' }}>
                    Test E-post-adresse
                  </label>
                  <input
                    type="email"
                    value={testEmail}
                    onChange={(e) => setTestEmail(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid var(--gray-300)',
                      borderRadius: 'var(--radius-lg)',
                      fontSize: 'var(--font-size-base)'
                    }}
                    placeholder="test@example.com"
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button
                    className="btn btn-secondary"
                    onClick={testEmailConfiguration}
                    disabled={testing || !testEmail}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                  >
                    {testing ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                        Sender test...
                      </>
                    ) : (
                      <>
                        <TestTube size={16} />
                        Send test e-post
                      </>
                    )}
                  </button>
                </div>

                {/* Test Result */}
                {testResult && (
                  <div style={{
                    padding: '1rem',
                    borderRadius: 'var(--radius-lg)',
                    background: testResult.success ? 'var(--green-50)' : 'var(--red-50)',
                    border: `1px solid ${testResult.success ? 'var(--green-200)' : 'var(--red-200)'}`
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                      {testResult.success ? (
                        <CheckCircle size={16} color="var(--green-600)" />
                      ) : (
                        <AlertCircle size={16} color="var(--red-600)" />
                      )}
                      <span style={{
                        fontSize: 'var(--font-size-sm)',
                        fontWeight: '600',
                        color: testResult.success ? 'var(--green-800)' : 'var(--red-800)'
                      }}>
                        {testResult.success ? 'Test vellykket!' : 'Test feilet'}
                      </span>
                    </div>
                    <p style={{
                      fontSize: 'var(--font-size-sm)',
                      color: testResult.success ? 'var(--green-700)' : 'var(--red-700)',
                      marginBottom: '0.5rem'
                    }}>
                      {testResult.message || testResult.error}
                    </p>
                    {testResult.details && (
                      <p style={{
                        fontSize: 'var(--font-size-xs)',
                        color: 'var(--gray-600)',
                        fontFamily: 'monospace'
                      }}>
                        {testResult.details}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Instructions */}
          <div className="card">
            <div style={{ padding: '1.5rem' }}>
              <h3 style={{ fontSize: 'var(--font-size-base)', fontWeight: '600', color: 'var(--gray-900)', marginBottom: '1rem' }}>
                📧 Cloudflare Email Routing Instruksjoner
              </h3>
              <div style={{ display: 'grid', gap: '1rem' }}>
                <div>
                  <h4 style={{ fontSize: 'var(--font-size-sm)', fontWeight: '600', color: 'var(--gray-800)', marginBottom: '0.5rem' }}>
                    1. Cloudflare Email Routing Setup
                  </h4>
                  <ul style={{ fontSize: 'var(--font-size-sm)', color: 'var(--gray-700)', paddingLeft: '1.5rem' }}>
                    <li>Gå til Cloudflare Dashboard → Email → Email Routing</li>
                    <li>Aktiver Email Routing for domenet driftpro.no</li>
                    <li>Opprett en e-post-adresse: noreplay@driftpro.no</li>
                    <li>Konfigurer SMTP-innstillinger</li>
                  </ul>
                </div>

                <div>
                  <h4 style={{ fontSize: 'var(--font-size-sm)', fontWeight: '600', color: 'var(--gray-800)', marginBottom: '0.5rem' }}>
                    2. API-nøkkel
                  </h4>
                  <ul style={{ fontSize: 'var(--font-size-sm)', color: 'var(--gray-700)', paddingLeft: '1.5rem' }}>
                    <li>Gå til Cloudflare Dashboard → My Profile → API Tokens</li>
                    <li>Opprett en ny API-nøkkel med Email Routing tillatelser</li>
                    <li>Kopier API-nøkkelen og lim den inn i SMTP Passord-feltet</li>
                  </ul>
                </div>

                <div>
                  <h4 style={{ fontSize: 'var(--font-size-sm)', fontWeight: '600', color: 'var(--gray-800)', marginBottom: '0.5rem' }}>
                    3. Test konfigurasjonen
                  </h4>
                  <ul style={{ fontSize: 'var(--font-size-sm)', color: 'var(--gray-700)', paddingLeft: '1.5rem' }}>
                    <li>Fyll ut alle feltene ovenfor</li>
                    <li>Lagre innstillingene</li>
                    <li>Send en test e-post for å verifisere at alt fungerer</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 