'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  AlertCircle,
  CheckCircle,
  ArrowRight,
  Loader2
} from 'lucide-react';
import DriftProLogo from '@/components/DriftProLogo';

export default function MobileLogin() {
  const { login, isAuthenticated, loading: authLoading } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [loginSuccess, setLoginSuccess] = useState(false);
  const emailInputRef = React.useRef<HTMLInputElement>(null);

  // Force dark mode on login page and optimize for mobile
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', 'dark');
    setMounted(true);
    
    // Prevent body scroll when keyboard is open
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    
    // Prevent zoom on input focus (iOS) - handled by 16px font size
    // Add safe area insets for notched devices
    const root = document.documentElement;
    const safeAreaTop = getComputedStyle(root).getPropertyValue('env(safe-area-inset-top)') || '0px';
    const safeAreaBottom = getComputedStyle(root).getPropertyValue('env(safe-area-inset-bottom)') || '0px';
    
    root.style.setProperty('--safe-area-top', safeAreaTop);
    root.style.setProperty('--safe-area-bottom', safeAreaBottom);
    
    // Auto-focus email field after a short delay (better UX)
    const timer = setTimeout(() => {
      if (emailInputRef.current && !email) {
        emailInputRef.current.focus();
      }
    }, 300);
    
    return () => {
      document.body.style.overflow = originalOverflow;
      clearTimeout(timer);
    };
  }, [email]);

  // Redirect if already authenticated or after successful login
  useEffect(() => {
    if (isAuthenticated && (loginSuccess || !authLoading)) {
      // Small delay to ensure all state is updated
      const timer = setTimeout(() => {
        router.push('/dashboard');
        // Refresh router to ensure all components re-render with new auth state
        setTimeout(() => {
          router.refresh();
        }, 200);
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, loginSuccess, authLoading, router]);

  if (isAuthenticated) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setLoginSuccess(false);

    try {
      await login(email, password);
      // Mark login as successful - useEffect will handle redirect when isAuthenticated becomes true
      setLoginSuccess(true);
      // Don't set loading to false here - let the redirect happen
    } catch (error) {
      console.error('Login error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Feil e-post eller passord. Prøv igjen.';
      setError(errorMessage);
      setLoading(false);
      setLoginSuccess(false);
    }
  };

  if (!mounted) {
    return null;
  }

  return (
    <div 
      className="mobile-login-container"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100vw',
        overflowY: 'auto',
        overflowX: 'hidden',
        WebkitOverflowScrolling: 'touch',
        background: 'var(--background-color)',
        color: 'var(--text-color)',
        padding: 0,
        paddingTop: 'env(safe-area-inset-top, 0px)',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        margin: 0,
        display: 'flex',
        flexDirection: 'column',
        overscrollBehavior: 'contain',
        touchAction: 'pan-y'
      }}
    >
      {/* Simple gradient background */}
      <div 
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.1) 0%, rgba(14, 165, 233, 0.05) 50%, rgba(6, 182, 212, 0.1) 100%)',
          zIndex: 0,
          pointerEvents: 'none'
        }}
      />

        {/* Main Content Container */}
      <div 
        style={{
          position: 'relative',
          zIndex: 10,
          width: '100%',
          maxWidth: '100%',
          minHeight: 'calc(100vh - env(safe-area-inset-top, 0px) - env(safe-area-inset-bottom, 0px))',
          display: 'flex',
          flexDirection: 'column',
          padding: '2rem 1.5rem',
          paddingTop: 'max(3rem, env(safe-area-inset-top, 0px) + 2rem)',
          paddingBottom: 'max(2rem, env(safe-area-inset-bottom, 0px) + 1rem)',
          gap: '2rem',
          justifyContent: 'center'
        }}
      >
        {/* Logo Section - Compact */}
        <div 
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '1rem',
            marginBottom: '1rem'
          }}
        >
          <div 
            style={{
              width: '80px',
              height: '80px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '20px',
              background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.2) 0%, rgba(14, 165, 233, 0.2) 100%)',
              border: '2px solid rgba(6, 182, 212, 0.3)',
              boxShadow: '0 4px 12px rgba(6, 182, 212, 0.2)'
            }}
          >
            <DriftProLogo 
              variant="icon" 
              size={60}
              className="driftpro-login-logo"
            />
          </div>
          
          <h1 
            style={{
              fontSize: '1.75rem',
              fontWeight: 800,
              letterSpacing: '-0.02em',
              background: 'var(--gradient-primary)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              textAlign: 'center',
              margin: 0
            }}
          >
            DriftPro
          </h1>
          
          <p 
            style={{
              fontSize: '0.875rem',
              color: 'var(--gray-400)',
              textAlign: 'center',
              margin: 0,
              fontWeight: 500
            }}
          >
            Logg inn for å fortsette
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div 
            style={{
              padding: '1rem',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.75rem',
              background: 'rgba(239, 68, 68, 0.1)',
              border: '2px solid rgba(239, 68, 68, 0.3)',
              marginBottom: '0.5rem'
            }}
          >
            <AlertCircle size={20} style={{ color: 'var(--danger)', flexShrink: 0, marginTop: '2px' }} />
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: '0.9375rem', fontWeight: 600, marginBottom: '0.25rem', color: 'var(--danger)' }}>
                Innlogging feilet
              </p>
              <p style={{ fontSize: '0.875rem', lineHeight: '1.5', color: 'var(--danger)' }}>
                {error}
              </p>
            </div>
          </div>
        )}

        {/* Login Form */}
        <form 
          onSubmit={handleSubmit}
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '1.5rem',
            width: '100%',
            maxWidth: '100%'
          }}
        >
          {/* Email Field */}
          <div>
            <label 
              htmlFor="mobile-email" 
              style={{
                display: 'block',
                marginBottom: '0.75rem',
                fontSize: '1rem',
                fontWeight: 600,
                color: 'var(--text-color)'
              }}
            >
              E-postadresse
            </label>
            <div style={{ position: 'relative' }}>
              <div 
                style={{
                  position: 'absolute',
                  left: '1.25rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  zIndex: 10,
                  color: focusedField === 'email' ? 'var(--primary)' : 'var(--gray-400)',
                  transition: 'color 0.2s'
                }}
              >
                <Mail size={22} />
              </div>
              <input
                ref={emailInputRef}
                id="mobile-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onFocus={() => setFocusedField('email')}
                onBlur={() => setFocusedField(null)}
                required
                autoComplete="email"
                inputMode="email"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck="false"
                style={{
                  width: '100%',
                  paddingLeft: '3.5rem',
                  paddingRight: email ? '3rem' : '1.25rem',
                  paddingTop: '1.25rem',
                  paddingBottom: '1.25rem',
                  minHeight: '56px',
                  borderRadius: '14px',
                  fontSize: '16px', // Prevents zoom on iOS
                  WebkitAppearance: 'none',
                  appearance: 'none',
                  background: 'var(--gray-200)',
                  border: `3px solid ${focusedField === 'email' ? 'var(--primary)' : 'var(--border-color)'}`,
                  color: 'var(--text-color)',
                  boxShadow: focusedField === 'email' 
                    ? '0 0 0 4px rgba(6, 182, 212, 0.15), 0 4px 12px rgba(6, 182, 212, 0.15)' 
                    : '0 2px 4px rgba(0, 0, 0, 0.05)',
                  transition: 'all 0.2s ease',
                  outline: 'none',
                  touchAction: 'manipulation',
                  WebkitTapHighlightColor: 'transparent',
                  caretColor: 'var(--primary)'
                }}
                placeholder="navn@bedrift.no"
              />
              {email && !error && (
                <div 
                  style={{
                    position: 'absolute',
                    right: '1rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    zIndex: 10
                  }}
                >
                  <CheckCircle size={18} style={{ color: 'var(--success)' }} />
                </div>
              )}
            </div>
          </div>

          {/* Password Field */}
          <div>
            <label 
              htmlFor="mobile-password" 
              style={{
                display: 'block',
                marginBottom: '0.75rem',
                fontSize: '1rem',
                fontWeight: 600,
                color: 'var(--text-color)'
              }}
            >
              Passord
            </label>
            <div style={{ position: 'relative' }}>
              <div 
                style={{
                  position: 'absolute',
                  left: '1.25rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  zIndex: 10,
                  color: focusedField === 'password' ? 'var(--primary)' : 'var(--gray-400)',
                  transition: 'color 0.2s'
                }}
              >
                <Lock size={22} />
              </div>
              <input
                id="mobile-password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onFocus={() => setFocusedField('password')}
                onBlur={() => setFocusedField(null)}
                required
                autoComplete="current-password"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck="false"
                style={{
                  width: '100%',
                  paddingLeft: '3.5rem',
                  paddingRight: '3.5rem',
                  paddingTop: '1.25rem',
                  paddingBottom: '1.25rem',
                  minHeight: '56px',
                  borderRadius: '14px',
                  fontSize: '16px', // Prevents zoom on iOS
                  WebkitAppearance: 'none',
                  appearance: 'none',
                  background: 'var(--gray-200)',
                  border: `3px solid ${focusedField === 'password' ? 'var(--primary)' : 'var(--border-color)'}`,
                  color: 'var(--text-color)',
                  boxShadow: focusedField === 'password' 
                    ? '0 0 0 4px rgba(6, 182, 212, 0.15), 0 4px 12px rgba(6, 182, 212, 0.15)' 
                    : '0 2px 4px rgba(0, 0, 0, 0.05)',
                  transition: 'all 0.2s ease',
                  outline: 'none',
                  touchAction: 'manipulation',
                  WebkitTapHighlightColor: 'transparent',
                  caretColor: 'var(--primary)'
                }}
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '0.75rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  padding: '0.75rem',
                  minWidth: '48px',
                  minHeight: '48px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '10px',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--gray-400)',
                  touchAction: 'manipulation',
                  WebkitTapHighlightColor: 'rgba(6, 182, 212, 0.2)',
                  transition: 'all 0.2s'
                }}
                onTouchStart={(e) => {
                  e.currentTarget.style.background = 'rgba(6, 182, 212, 0.1)';
                  e.currentTarget.style.color = 'var(--primary)';
                }}
                onTouchEnd={(e) => {
                  setTimeout(() => {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = 'var(--gray-400)';
                  }, 200);
                }}
              >
                {showPassword ? <EyeOff size={22} /> : <Eye size={22} />}
              </button>
            </div>
          </div>

          {/* Forgot Password Link */}
          <div 
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              paddingTop: '0.5rem',
              marginBottom: '0.5rem'
            }}
          >
            <a 
              href="/forgot-password"
              style={{
                fontSize: '0.9375rem',
                fontWeight: 500,
                color: 'var(--primary)',
                textDecoration: 'none',
                padding: '0.75rem',
                minHeight: '44px',
                display: 'inline-flex',
                alignItems: 'center',
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'rgba(6, 182, 212, 0.2)',
                transition: 'color 0.2s'
              }}
              onTouchStart={(e) => {
                e.currentTarget.style.color = 'var(--primary-light)';
              }}
              onTouchEnd={(e) => {
                setTimeout(() => {
                  e.currentTarget.style.color = 'var(--primary)';
                }, 200);
              }}
            >
              Glemt passord?
            </a>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading || !email || !password}
            style={{
              width: '100%',
              paddingTop: '1.5rem',
              paddingBottom: '1.5rem',
              paddingLeft: '1.5rem',
              paddingRight: '1.5rem',
              minHeight: '56px',
              borderRadius: '14px',
              color: '#ffffff',
              fontWeight: 700,
              fontSize: '1.125rem',
              marginTop: '1rem',
              boxShadow: loading 
                ? 'none' 
                : '0 8px 20px -5px rgba(6, 182, 212, 0.4), 0 0 0 1px rgba(6, 182, 212, 0.2)',
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.75rem',
              position: 'relative',
              overflow: 'hidden',
              background: (loading || !email || !password) ? 'var(--gray-400)' : 'var(--gradient-primary)',
              cursor: (loading || !email || !password) ? 'not-allowed' : 'pointer',
              opacity: (loading || !email || !password) ? 0.7 : 1,
              border: 'none',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'rgba(6, 182, 212, 0.3)',
              userSelect: 'none'
            }}
            onTouchStart={(e) => {
              if (!loading && email && password) {
                e.currentTarget.style.transform = 'scale(0.98)';
                e.currentTarget.style.opacity = '0.9';
              }
            }}
            onTouchEnd={(e) => {
              if (!loading && email && password) {
                setTimeout(() => {
                  e.currentTarget.style.transform = 'scale(1)';
                  e.currentTarget.style.opacity = '1';
                }, 100);
              }
            }}
          >
            {loading ? (
              <>
                <Loader2 size={20} style={{ animation: 'spin 1s linear infinite' }} />
                <span>Logger inn...</span>
              </>
            ) : (
              <>
                <span>Logg inn</span>
                <ArrowRight size={20} />
              </>
            )}
          </button>
        </form>

          {/* Footer Spacing */}
        <div style={{ height: '2rem' }} />
      </div>

      <style jsx global>{`
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
        
        /* Mobile login container - iOS Safari fix */
        .mobile-login-container {
          min-height: 100vh;
          height: 100vh;
        }
        
        @supports (-webkit-touch-callout: none) {
          .mobile-login-container {
            min-height: -webkit-fill-available;
            height: -webkit-fill-available;
          }
        }
        
        /* Mobile-specific optimizations */
        @supports (-webkit-touch-callout: none) {
          /* iOS Safari specific */
          input[type="email"],
          input[type="password"],
          input[type="text"] {
            font-size: 16px !important;
          }
        }
        
        /* Prevent double-tap zoom on buttons */
        button {
          touch-action: manipulation;
        }
        
        /* Smooth scrolling */
        * {
          -webkit-overflow-scrolling: touch;
        }
        
        /* Safe area support */
        @supports (padding: env(safe-area-inset-top)) {
          .mobile-login-container {
            padding-top: env(safe-area-inset-top);
            padding-bottom: env(safe-area-inset-bottom);
          }
        }
      `}</style>
    </div>
  );
}

