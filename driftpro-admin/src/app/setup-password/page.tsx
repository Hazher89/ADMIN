'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Eye, EyeOff, CheckCircle, AlertCircle, Lock } from 'lucide-react';

interface TokenData {
  valid: boolean;
  email: string;
  adminName: string;
  companyName: string;
}

export default function SetupPasswordPage() {
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

    // Validate passwords
    if (password.length < 8) {
      setError('Passordet må være minst 8 tegn langt');
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
        setError(data.error || 'Feil ved oppsett av passord');
      }
    } catch (error) {
      console.error('Error setting up password:', error);
      setError('Feil ved oppsett av passord');
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
          padding: '3rem',
          textAlign: 'center',
          boxShadow: 'var(--shadow-lg)'
        }}>
          <div style={{
            width: '64px',
            height: '64px',
            background: 'var(--danger)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.5rem'
          }}>
            <AlertCircle style={{ width: '32px', height: '32px', color: 'var(--white)' }} />
          </div>
          <h1 style={{
            fontSize: 'var(--font-size-2xl)',
            fontWeight: '700',
            color: 'var(--gray-900)',
            marginBottom: '1rem'
          }}>
            Ugyldig lenke
          </h1>
          <p style={{
            color: 'var(--gray-600)',
            fontSize: 'var(--font-size-base)',
            marginBottom: '2rem',
            lineHeight: '1.6'
          }}>
            {error}
          </p>
          <button
            onClick={() => router.push('/login')}
            style={{
              padding: '0.75rem 1.5rem',
              background: 'var(--primary)',
              color: 'var(--white)',
              border: 'none',
              borderRadius: 'var(--radius-lg)',
              fontSize: 'var(--font-size-base)',
              fontWeight: '500',
              cursor: 'pointer'
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
          padding: '3rem',
          textAlign: 'center',
          boxShadow: 'var(--shadow-lg)'
        }}>
          <div style={{
            width: '64px',
            height: '64px',
            background: 'var(--success)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.5rem'
          }}>
            <CheckCircle style={{ width: '32px', height: '32px', color: 'var(--white)' }} />
          </div>
          <h1 style={{
            fontSize: 'var(--font-size-2xl)',
            fontWeight: '700',
            color: 'var(--gray-900)',
            marginBottom: '1rem'
          }}>
            Passord satt opp!
          </h1>
          <p style={{
            color: 'var(--gray-600)',
            fontSize: 'var(--font-size-base)',
            marginBottom: '2rem',
            lineHeight: '1.6'
          }}>
            Ditt passord er nå satt opp. Du vil bli omdirigert til innloggingssiden om noen sekunder.
          </p>
          <div style={{
            background: 'var(--success)',
            color: 'var(--white)',
            padding: '1rem',
            borderRadius: 'var(--radius-md)',
            marginBottom: '2rem'
          }}>
            <p style={{ margin: 0, fontWeight: '500' }}>
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
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1rem'
    }}>
      <div style={{
        maxWidth: '500px',
        width: '100%',
        background: 'var(--white)',
        borderRadius: 'var(--radius-lg)',
        padding: '3rem',
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
            fontSize: 'var(--font-size-2xl)',
            fontWeight: '700',
            color: 'var(--gray-900)',
            marginBottom: '0.5rem'
          }}>
            Sett opp passord
          </h1>
          <p style={{
            color: 'var(--gray-600)',
            fontSize: 'var(--font-size-base)'
          }}>
            Velkommen til DriftPro, {tokenData?.adminName}
          </p>
        </div>

        {/* User Info */}
        <div style={{
          background: 'var(--gray-50)',
          padding: '1.5rem',
          borderRadius: 'var(--radius-lg)',
          marginBottom: '2rem',
          border: '1px solid var(--gray-200)'
        }}>
          <h3 style={{
            fontSize: 'var(--font-size-lg)',
            fontWeight: '600',
            color: 'var(--gray-900)',
            marginBottom: '1rem'
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
            padding: '1rem',
            borderRadius: 'var(--radius-md)',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <AlertCircle style={{ width: '20px', height: '20px' }} />
            {error}
          </div>
        )}

        {/* Password Setup Form */}
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{
              display: 'block',
              marginBottom: '0.5rem',
              fontWeight: '500',
              color: 'var(--gray-700)'
            }}>
              Nytt passord *
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  paddingRight: '3rem',
                  border: '1px solid var(--gray-300)',
                  borderRadius: 'var(--radius-md)',
                  fontSize: 'var(--font-size-base)'
                }}
                placeholder="Minst 8 tegn"
                required
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
                  color: 'var(--gray-400)'
                }}
              >
                {showPassword ? <EyeOff style={{ width: '20px', height: '20px' }} /> : <Eye style={{ width: '20px', height: '20px' }} />}
              </button>
            </div>
            <p style={{
              fontSize: 'var(--font-size-sm)',
              color: 'var(--gray-500)',
              marginTop: '0.5rem'
            }}>
              Passordet må være minst 8 tegn langt
            </p>
          </div>

          <div style={{ marginBottom: '2rem' }}>
            <label style={{
              display: 'block',
              marginBottom: '0.5rem',
              fontWeight: '500',
              color: 'var(--gray-700)'
            }}>
              Bekreft passord *
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  paddingRight: '3rem',
                  border: '1px solid var(--gray-300)',
                  borderRadius: 'var(--radius-md)',
                  fontSize: 'var(--font-size-base)'
                }}
                placeholder="Skriv passordet igjen"
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                style={{
                  position: 'absolute',
                  right: '0.75rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--gray-400)'
                }}
              >
                {showConfirmPassword ? <EyeOff style={{ width: '20px', height: '20px' }} /> : <Eye style={{ width: '20px', height: '20px' }} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '0.75rem',
              background: loading ? 'var(--gray-400)' : 'var(--primary)',
              color: 'var(--white)',
              border: 'none',
              borderRadius: 'var(--radius-md)',
              fontSize: 'var(--font-size-base)',
              fontWeight: '500',
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem'
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
          marginTop: '2rem',
          paddingTop: '2rem',
          borderTop: '1px solid var(--gray-200)'
        }}>
          <p style={{
            fontSize: 'var(--font-size-sm)',
            color: 'var(--gray-500)'
          }}>
            Har du problemer? Kontakt systemadministrator
          </p>
        </div>
      </div>
    </div>
  );
} 