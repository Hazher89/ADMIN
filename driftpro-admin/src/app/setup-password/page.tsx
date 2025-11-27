'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Eye, EyeOff, CheckCircle, AlertCircle, Lock } from 'lucide-react';

// Prevent pre-rendering since this page uses search parameters
export const dynamic = 'force-dynamic';

interface TokenData {
  valid: boolean;
  email: string;
  adminName: string;
  companyName: string;
}

function SetupPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [token, setToken] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [tokenData, setTokenData] = useState<TokenData | null>(null);
  const [loading, setLoading] = useState(true);
  const [validating, setValidating] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    const tokenParam = searchParams.get('token');
    const emailParam = searchParams.get('email');
    
    if (tokenParam) {
      setToken(tokenParam);
      validateToken(tokenParam);
    }
    
    if (emailParam) {
      setEmail(emailParam);
    }
  }, [searchParams]);

  const validateToken = async (tokenToValidate: string) => {
    try {
      setValidating(true);
      const response = await fetch(`/api/setup-password?token=${tokenToValidate}`);
      const data = await response.json();

      if (response.ok && data.valid) {
        setTokenData(data);
        setEmail(data.email);
      } else {
        setError(data.error || 'Ugyldig eller utløpt token');
      }
    } catch (error) {
      console.error('Error validating token:', error);
      setError('Feil ved validering av token');
    } finally {
      setLoading(false);
      setValidating(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validate passwords (GDPR / sikkerhet)
    if (password.length < 8) {
      setError('Passordet må være minst 8 tegn langt');
      return;
    }

    // Må inneholde bokstaver
    if (!/[A-Za-zÆØÅæøå]/.test(password)) {
      setError('Passordet må inneholde minst én bokstav');
      return;
    }

    // Må inneholde tall
    if (!/[0-9]/.test(password)) {
      setError('Passordet må inneholde minst ett tall');
      return;
    }

    // Må inneholde spesialtegn
    if (!/[!@#$%^&*()[\]{}_\-+=,.?;:|<>]/.test(password)) {
      setError('Passordet må inneholde minst ett spesialtegn (f.eks. !, #, ?, %)');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passordene matcher ikke');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch('/api/setup-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          password
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(true);
        setTimeout(() => {
          router.push('/login');
        }, 3000);
      } else {
        // Show detailed error message
        const errorMsg = data.error || data.message || 'Feil ved oppsett av passord';
        const details = data.details ? `\n\nDetaljer: ${data.details}` : '';
        setError(errorMsg + details);
        console.error('Password setup error:', data);
      }
    } catch (error) {
      console.error('Error setting up password:', error);
      const errorMsg = error instanceof Error ? error.message : 'Feil ved oppsett av passord';
      setError(`Feil ved oppsett av passord: ${errorMsg}`);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'var(--gray-50)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div className="loading" style={{ margin: '0 auto 2rem' }}></div>
          <h3 style={{ 
            fontSize: 'var(--font-size-xl)', 
            fontWeight: '600', 
            color: 'var(--gray-900)', 
            marginBottom: '0.5rem' 
          }}>
            {validating ? 'Validerer token...' : 'Laster...'}
          </h3>
          <p style={{ 
            color: 'var(--gray-600)',
            fontSize: 'var(--font-size-base)'
          }}>
            {validating ? 'Sjekker gyldighet av lenken' : 'Forbereder passordoppsett'}
          </p>
        </div>
      </div>
    );
  }

  if (error && !tokenData) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'var(--gray-50)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{
          maxWidth: '500px',
          width: '90%',
          background: 'var(--white)',
          borderRadius: 'var(--radius-lg)',
          padding: isMobile ? '1.5rem 1rem' : '3rem',
          textAlign: 'center',
          boxShadow: 'var(--shadow-lg)'
        }}>
          <div style={{
            width: isMobile ? '56px' : '64px',
            height: isMobile ? '56px' : '64px',
            background: 'var(--danger)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.5rem'
          }}>
            <AlertCircle style={{ width: isMobile ? '28px' : '32px', height: isMobile ? '28px' : '32px', color: 'var(--white)' }} />
          </div>
          <h1 style={{
            fontSize: isMobile ? '1.25rem' : 'var(--font-size-2xl)',
            fontWeight: '700',
            color: 'var(--gray-900)',
            marginBottom: '1rem'
          }}>
            Ugyldig lenke
          </h1>
          <p style={{
            color: 'var(--gray-600)',
            fontSize: isMobile ? '0.875rem' : 'var(--font-size-base)',
            marginBottom: isMobile ? '1.5rem' : '2rem',
            lineHeight: '1.6'
          }}>
            {error}
          </p>
          <button
            onClick={() => router.push('/login')}
            style={{
              padding: isMobile ? '0.875rem 1.25rem' : '0.75rem 1.5rem',
              background: 'var(--primary)',
              color: 'var(--white)',
              border: 'none',
              borderRadius: 'var(--radius-lg)',
              fontSize: isMobile ? '16px' : 'var(--font-size-base)',
              fontWeight: '500',
              cursor: 'pointer',
              minHeight: isMobile ? '48px' : 'auto',
              width: isMobile ? '100%' : 'auto',
              touchAction: 'manipulation'
            }}
          >
            Gå til innlogging
          </button>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'var(--gray-50)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{
          maxWidth: '500px',
          width: '90%',
          background: 'var(--white)',
          borderRadius: 'var(--radius-lg)',
          padding: isMobile ? '1.5rem 1rem' : '3rem',
          textAlign: 'center',
          boxShadow: 'var(--shadow-lg)'
        }}>
          <div style={{
            width: isMobile ? '56px' : '64px',
            height: isMobile ? '56px' : '64px',
            background: 'var(--success)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.5rem'
          }}>
            <CheckCircle style={{ width: isMobile ? '28px' : '32px', height: isMobile ? '28px' : '32px', color: 'var(--white)' }} />
          </div>
          <h1 style={{
            fontSize: isMobile ? '1.25rem' : 'var(--font-size-2xl)',
            fontWeight: '700',
            color: 'var(--gray-900)',
            marginBottom: '1rem'
          }}>
            Passord satt opp!
          </h1>
          <p style={{
            color: 'var(--gray-600)',
            fontSize: isMobile ? '0.875rem' : 'var(--font-size-base)',
            marginBottom: isMobile ? '1.5rem' : '2rem',
            lineHeight: '1.6'
          }}>
            Ditt passord er nå satt opp. Du vil bli omdirigert til innloggingssiden om noen sekunder.
          </p>
          <div style={{
            background: 'var(--success)',
            color: 'var(--white)',
            padding: isMobile ? '0.875rem' : '1rem',
            borderRadius: 'var(--radius-md)',
            marginBottom: isMobile ? '1.5rem' : '2rem'
          }}>
            <p style={{ margin: 0, fontWeight: '500', fontSize: isMobile ? '0.875rem' : 'var(--font-size-base)' }}>
              Du kan nå logge inn med din e-postadresse og det nye passordet.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--gray-50)',
      display: 'flex',
      alignItems: isMobile ? 'flex-start' : 'center',
      justifyContent: 'center',
      padding: isMobile ? '1rem 0.75rem' : '1rem',
      paddingTop: isMobile ? '2rem' : '1rem',
      paddingBottom: isMobile ? '2rem' : '1rem',
      overflowY: 'auto',
      WebkitOverflowScrolling: 'touch'
    }}>
      <div style={{
        maxWidth: '500px',
        width: '100%',
        background: 'var(--white)',
        borderRadius: isMobile ? 'var(--radius-lg)' : 'var(--radius-lg)',
        padding: isMobile ? '1.5rem 1rem' : '3rem',
        boxShadow: 'var(--shadow-lg)'
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            width: '64px',
            height: '64px',
            background: 'var(--primary)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.5rem'
          }}>
            <Lock style={{ width: '32px', height: '32px', color: 'var(--white)' }} />
          </div>
          <h1 style={{
            fontSize: isMobile ? '1.5rem' : 'var(--font-size-2xl)',
            fontWeight: '700',
            color: 'var(--gray-900)',
            marginBottom: '0.5rem'
          }}>
            Sett opp passord
          </h1>
          <p style={{
            color: 'var(--gray-600)',
            fontSize: isMobile ? '0.875rem' : 'var(--font-size-base)'
          }}>
            Velkommen til DriftPro, {tokenData?.adminName}
          </p>
        </div>

        {/* User Info */}
        <div style={{
          background: 'var(--gray-50)',
          padding: isMobile ? '1rem' : '1.5rem',
          borderRadius: 'var(--radius-lg)',
          marginBottom: isMobile ? '1.5rem' : '2rem',
          border: '1px solid var(--gray-200)'
        }}>
          <h3 style={{
            fontSize: isMobile ? '1rem' : 'var(--font-size-lg)',
            fontWeight: '600',
            color: 'var(--gray-900)',
            marginBottom: isMobile ? '0.75rem' : '1rem'
          }}>
            Kontoinformasjon
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div>
              <strong>Navn:</strong> {tokenData?.adminName}
            </div>
            <div>
              <strong>E-post:</strong> {tokenData?.email}
            </div>
            <div>
              <strong>Bedrift:</strong> {tokenData?.companyName}
            </div>
            <div>
              <strong>Rolle:</strong> Administrator
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div style={{
            background: 'var(--danger)',
            color: 'var(--white)',
            padding: isMobile ? '0.875rem' : '1rem',
            borderRadius: 'var(--radius-md)',
            marginBottom: isMobile ? '1.25rem' : '1.5rem',
            display: 'flex',
            alignItems: 'flex-start',
            gap: isMobile ? '0.625rem' : '0.5rem',
            fontSize: isMobile ? '0.875rem' : 'var(--font-size-base)',
            lineHeight: '1.5'
          }}>
            <AlertCircle style={{ width: isMobile ? '18px' : '20px', height: isMobile ? '18px' : '20px', flexShrink: 0, marginTop: '2px' }} />
            <span style={{ flex: 1 }}>{error}</span>
          </div>
        )}

        {/* Password Setup Form */}
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: isMobile ? '1.25rem' : '1.5rem' }}>
            <label style={{
              display: 'block',
              marginBottom: isMobile ? '0.625rem' : '0.5rem',
              fontWeight: '500',
              color: 'var(--gray-700)',
              fontSize: isMobile ? '0.875rem' : 'var(--font-size-base)'
            }}>
              Nytt passord *
            </label>
            <div style={{ position: 'relative', width: '100%' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{
                  width: '100%',
                  padding: isMobile ? '0.875rem' : '0.75rem',
                  paddingRight: isMobile ? '3.5rem' : '3rem',
                  paddingLeft: isMobile ? '0.875rem' : '0.75rem',
                  border: '1px solid var(--gray-300)',
                  borderRadius: isMobile ? 'var(--radius-md)' : 'var(--radius-md)',
                  fontSize: isMobile ? '16px' : 'var(--font-size-base)',
                  WebkitAppearance: 'none',
                  appearance: 'none',
                  minHeight: isMobile ? '48px' : 'auto',
                  boxSizing: 'border-box',
                  position: 'relative',
                  zIndex: 1,
                  pointerEvents: 'auto',
                  touchAction: 'manipulation'
                }}
                placeholder="Minst 8 tegn"
                required
              />
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowPassword(!showPassword);
                }}
                onMouseDown={(e) => e.preventDefault()}
                style={{
                  position: 'absolute',
                  right: isMobile ? '0.5rem' : '0.625rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--gray-400)',
                  padding: isMobile ? '0.5rem' : '0.375rem',
                  minWidth: isMobile ? '44px' : 'auto',
                  minHeight: isMobile ? '44px' : 'auto',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 2,
                  pointerEvents: 'auto',
                  touchAction: 'manipulation'
                }}
                aria-label={showPassword ? 'Skjul passord' : 'Vis passord'}
              >
                {showPassword ? <EyeOff style={{ width: isMobile ? '22px' : '20px', height: isMobile ? '22px' : '20px', pointerEvents: 'none' }} /> : <Eye style={{ width: isMobile ? '22px' : '20px', height: isMobile ? '22px' : '20px', pointerEvents: 'none' }} />}
              </button>
            </div>
            <p style={{
              fontSize: isMobile ? '0.75rem' : 'var(--font-size-sm)',
              color: 'var(--gray-500)',
              marginTop: isMobile ? '0.375rem' : '0.5rem',
              lineHeight: '1.4'
            }}>
              Passordet må være minst 8 tegn langt
            </p>
          </div>

          <div style={{ marginBottom: isMobile ? '1.5rem' : '2rem' }}>
            <label style={{
              display: 'block',
              marginBottom: isMobile ? '0.625rem' : '0.5rem',
              fontWeight: '500',
              color: 'var(--gray-700)',
              fontSize: isMobile ? '0.875rem' : 'var(--font-size-base)'
            }}>
              Bekreft passord *
            </label>
            <div style={{ position: 'relative', width: '100%' }}>
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                style={{
                  width: '100%',
                  padding: isMobile ? '0.875rem' : '0.75rem',
                  paddingRight: isMobile ? '3.5rem' : '3rem',
                  paddingLeft: isMobile ? '0.875rem' : '0.75rem',
                  border: '1px solid var(--gray-300)',
                  borderRadius: isMobile ? 'var(--radius-md)' : 'var(--radius-md)',
                  fontSize: isMobile ? '16px' : 'var(--font-size-base)',
                  WebkitAppearance: 'none',
                  appearance: 'none',
                  minHeight: isMobile ? '48px' : 'auto',
                  boxSizing: 'border-box',
                  position: 'relative',
                  zIndex: 1,
                  pointerEvents: 'auto',
                  touchAction: 'manipulation'
                }}
                placeholder="Skriv passordet igjen"
                required
              />
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowConfirmPassword(!showConfirmPassword);
                }}
                onMouseDown={(e) => e.preventDefault()}
                style={{
                  position: 'absolute',
                  right: isMobile ? '0.5rem' : '0.625rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--gray-400)',
                  padding: isMobile ? '0.5rem' : '0.375rem',
                  minWidth: isMobile ? '44px' : 'auto',
                  minHeight: isMobile ? '44px' : 'auto',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 2,
                  pointerEvents: 'auto',
                  touchAction: 'manipulation'
                }}
                aria-label={showConfirmPassword ? 'Skjul passord' : 'Vis passord'}
              >
                {showConfirmPassword ? <EyeOff style={{ width: isMobile ? '22px' : '20px', height: isMobile ? '22px' : '20px', pointerEvents: 'none' }} /> : <Eye style={{ width: isMobile ? '22px' : '20px', height: isMobile ? '22px' : '20px', pointerEvents: 'none' }} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: isMobile ? '1rem' : '0.75rem',
              background: loading ? 'var(--gray-400)' : 'var(--primary)',
              color: 'var(--white)',
              border: 'none',
              borderRadius: isMobile ? 'var(--radius-md)' : 'var(--radius-md)',
              fontSize: isMobile ? '16px' : 'var(--font-size-base)',
              fontWeight: '500',
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              minHeight: isMobile ? '48px' : 'auto',
              touchAction: 'manipulation'
            }}
          >
            {loading ? (
              <>
                <div className="loading" style={{ width: '20px', height: '20px' }}></div>
                Setter opp passord...
              </>
            ) : (
              <>
                <Lock style={{ width: '20px', height: '20px' }} />
                Sett opp passord
              </>
            )}
          </button>
        </form>

        {/* Footer */}
        <div style={{
          textAlign: 'center',
          marginTop: isMobile ? '1.5rem' : '2rem',
          paddingTop: isMobile ? '1.5rem' : '2rem',
          borderTop: '1px solid var(--gray-200)'
        }}>
          <p style={{
            fontSize: isMobile ? '0.75rem' : 'var(--font-size-sm)',
            color: 'var(--gray-500)'
          }}>
            Har du problemer? Kontakt systemadministrator
          </p>
        </div>
      </div>
    </div>
  );
}

export default function SetupPasswordPage() {
  return (
    <Suspense fallback={
      <div style={{
        minHeight: '100vh',
        background: 'var(--gray-50)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div className="loading" style={{ margin: '0 auto 2rem' }}></div>
          <h3 style={{ 
            fontSize: 'var(--font-size-xl)', 
            fontWeight: '600', 
            color: 'var(--gray-900)', 
            marginBottom: '0.5rem' 
          }}>
            Laster...
          </h3>
          <p style={{ 
            color: 'var(--gray-600)',
            fontSize: 'var(--font-size-base)'
          }}>
            Forbereder passordoppsett
          </p>
        </div>
      </div>
    }>
      <SetupPasswordContent />
    </Suspense>
  );
} 