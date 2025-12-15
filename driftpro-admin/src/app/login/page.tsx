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

// Prevent pre-rendering since this page uses useRouter and localStorage
export const dynamic = 'force-dynamic';

export default function LoginPage() {
  const { login, isAuthenticated } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Force dark mode on login page and detect mobile
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', 'dark');
    setMounted(true);
    
    // Detect mobile
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, router]);

  if (isAuthenticated) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await login(email, password);
      router.push('/dashboard');
    } catch (error) {
      console.error('Login error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Feil e-post eller passord. Prøv igjen.';
      setError(errorMessage);
      setLoading(false);
    }
  };

  if (!mounted) {
    return null;
  }

  return (
      <div 
      style={{
        position: isMobile ? 'relative' : 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100vw',
        minHeight: '100vh',
        height: isMobile ? 'auto' : '100vh',
        display: 'flex',
        alignItems: isMobile ? 'flex-start' : 'center',
        justifyContent: 'center',
        background: 'var(--background-color)',
        color: 'var(--text-color)',
        padding: isMobile ? '0' : '1rem',
        overflow: isMobile ? 'auto' : 'hidden',
        WebkitOverflowScrolling: 'touch',
        overscrollBehavior: 'contain'
      }}
    >
      {/* Premium Animated Background */}
      <div 
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          pointerEvents: 'none',
          overflow: 'hidden',
          zIndex: 0
        }}
      >
        {/* Floating gradient orbs */}
        <div 
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '600px',
            height: '600px',
            borderRadius: '50%',
            filter: 'blur(80px)',
            opacity: 0.2,
            background: 'radial-gradient(circle, var(--primary) 0%, transparent 70%)',
            animation: 'float-orb-1 20s ease-in-out infinite'
          }}
        ></div>
        <div 
          style={{
            position: 'absolute',
            bottom: 0,
            right: 0,
            width: '700px',
            height: '700px',
            borderRadius: '50%',
            filter: 'blur(80px)',
            opacity: 0.2,
            background: 'radial-gradient(circle, var(--secondary) 0%, transparent 70%)',
            animation: 'float-orb-2 25s ease-in-out infinite reverse',
            animationDelay: '2s'
          }}
        ></div>
        <div 
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '500px',
            height: '500px',
            borderRadius: '50%',
            filter: 'blur(80px)',
            opacity: 0.15,
            background: 'radial-gradient(circle, var(--primary-light) 0%, transparent 70%)',
            animation: 'float-orb-3 30s ease-in-out infinite',
            animationDelay: '4s'
          }}
        ></div>
        
        {/* Subtle grid pattern */}
        <div 
          style={{
            position: 'absolute',
            inset: 0,
            opacity: 0.02,
            backgroundImage: `
              linear-gradient(var(--primary) 1px, transparent 1px),
              linear-gradient(90deg, var(--primary) 1px, transparent 1px)
            `,
            backgroundSize: '60px 60px'
          }}
        ></div>
      </div>

      {/* Main Content - Perfectly Centered */}
      <div 
        style={{
          position: 'relative',
          zIndex: 10,
          width: '100%',
          maxWidth: '520px',
          minHeight: isMobile ? '100vh' : 'auto',
          margin: isMobile ? '0' : 'auto',
          display: 'flex',
          alignItems: isMobile ? 'flex-start' : 'center',
          justifyContent: 'center',
          padding: isMobile ? '1rem' : '0'
        }}
      >
        <div 
          style={{
            width: '100%',
            position: 'relative',
            background: 'var(--card-background)',
            backdropFilter: 'blur(20px) saturate(180%)',
            WebkitBackdropFilter: 'blur(20px) saturate(180%)',
            borderRadius: isMobile ? '0' : 'var(--radius-2xl)',
            padding: isMobile ? '2rem 1.5rem' : '2rem 2rem',
            boxShadow: isMobile ? 'none' : 'var(--shadow-xl), 0 0 0 1px var(--border-color)',
            border: isMobile ? 'none' : '1px solid var(--border-color)',
            overflow: 'visible',
            minHeight: isMobile ? '100vh' : 'auto',
            display: 'flex',
            flexDirection: 'column'
          }}
        >

          {/* Subtle shine overlay */}
          <div 
            style={{
              position: 'absolute',
              inset: 0,
              opacity: 0.05,
              pointerEvents: 'none',
              background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, transparent 50%)'
            }}
          ></div>

          {/* Logo & Brand Section */}
          <div style={{ textAlign: 'center', marginBottom: '1.5rem', position: 'relative', zIndex: 10 }}>
            {/* Logo with advanced glow effects */}
            <div 
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '1rem',
                position: 'relative',
                filter: 'drop-shadow(0 0 40px rgba(6, 182, 212, 0.4))'
              }}
            >
              {/* Outer glow ring */}
              <div 
                style={{
                  position: 'absolute',
                  inset: '-20px',
                  borderRadius: 'var(--radius-2xl)',
                  opacity: 0.6,
                  filter: 'blur(50px)',
                  background: 'var(--gradient-primary)',
                  animation: 'pulse-glow 3s ease-in-out infinite',
                  transform: 'scale(1.4)'
                }}
              ></div>
              
              {/* Middle glow ring */}
              <div 
                style={{
                  position: 'absolute',
                  inset: '-10px',
                  borderRadius: 'var(--radius-xl)',
                  opacity: 0.4,
                  filter: 'blur(30px)',
                  background: 'var(--gradient-primary)',
                  animation: 'pulse-glow 2.5s ease-in-out infinite',
                  animationDelay: '0.5s',
                  transform: 'scale(1.2)'
                }}
              ></div>
              
              {/* Inner glow */}
              <div 
                style={{
                  position: 'absolute',
                  inset: 0,
                  borderRadius: 'var(--radius-xl)',
                  opacity: 0.3,
                  filter: 'blur(20px)',
                  background: 'var(--gradient-primary)',
                  animation: 'pulse-glow 2s ease-in-out infinite',
                  animationDelay: '1s'
                }}
              ></div>
              
              {/* Logo container with border glow - MOBIL OPTIMALISERT */}
              <div 
                style={{
                  position: 'relative',
                  zIndex: 10,
                  padding: isMobile ? '0.5rem' : '1rem',
                  borderRadius: 'var(--radius-xl)',
                  background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.1) 0%, rgba(14, 165, 233, 0.1) 100%)',
                  border: '2px solid',
                  borderImage: 'linear-gradient(135deg, rgba(6, 182, 212, 0.3), rgba(14, 165, 233, 0.3)) 1',
                  boxShadow: `
                    0 0 30px rgba(6, 182, 212, 0.3),
                    inset 0 0 20px rgba(6, 182, 212, 0.1),
                    0 0 0 1px rgba(255, 255, 255, 0.05)
                  `,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: isMobile ? '140px' : '280px',
                  height: isMobile ? '140px' : '280px',
                  overflow: 'visible',
                  margin: '0 auto'
                }}
              >
                {/* DriftPro Logo */}
                <div style={{
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  filter: 'drop-shadow(0 0 20px rgba(6, 182, 212, 0.5))'
                }}>
                  <div 
                    className="animated-logo-container"
                    style={{ 
                      width: isMobile ? '120px' : '260px', 
                      height: isMobile ? '120px' : '260px', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center'
                    }}
                  >
                    <DriftProLogo 
                      variant="icon" 
                      size={isMobile ? 120 : 260}
                      className="driftpro-login-logo"
                    />
                  </div>
                </div>
              </div>
              
              {/* Animated corner accents */}
              <div 
                style={{
                  position: 'absolute',
                  top: '-5px',
                  left: '-5px',
                  width: '20px',
                  height: '20px',
                  borderTop: '2px solid var(--primary)',
                  borderLeft: '2px solid var(--primary)',
                  borderRadius: 'var(--radius-md) 0 0 0',
                  opacity: 0.6,
                  animation: 'corner-pulse 2s ease-in-out infinite'
                }}
              ></div>
              <div 
                style={{
                  position: 'absolute',
                  top: '-5px',
                  right: '-5px',
                  width: '20px',
                  height: '20px',
                  borderTop: '2px solid var(--primary)',
                  borderRight: '2px solid var(--primary)',
                  borderRadius: '0 var(--radius-md) 0 0',
                  opacity: 0.6,
                  animation: 'corner-pulse 2s ease-in-out infinite',
                  animationDelay: '0.5s'
                }}
              ></div>
              <div 
                style={{
                  position: 'absolute',
                  bottom: '-5px',
                  left: '-5px',
                  width: '20px',
                  height: '20px',
                  borderBottom: '2px solid var(--primary)',
                  borderLeft: '2px solid var(--primary)',
                  borderRadius: '0 0 0 var(--radius-md)',
                  opacity: 0.6,
                  animation: 'corner-pulse 2s ease-in-out infinite',
                  animationDelay: '1s'
                }}
              ></div>
              <div 
                style={{
                  position: 'absolute',
                  bottom: '-5px',
                  right: '-5px',
                  width: '20px',
                  height: '20px',
                  borderBottom: '2px solid var(--primary)',
                  borderRight: '2px solid var(--primary)',
                  borderRadius: '0 0 var(--radius-md) 0',
                  opacity: 0.6,
                  animation: 'corner-pulse 2s ease-in-out infinite',
                  animationDelay: '1.5s'
                }}
              ></div>
          </div>
            
            {/* Brand name */}
            <h1 
              style={{ 
                fontSize: isMobile ? '1.75rem' : '2.5rem',
                fontWeight: 800,
                marginBottom: '0.75rem',
                letterSpacing: '-0.02em',
                background: 'var(--gradient-primary)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                filter: 'drop-shadow(0 2px 10px rgba(6, 182, 212, 0.3))'
              }}
            >
              DriftPro
          </h1>
            
            {/* Divider */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', margin: '1rem 0' }}>
              <div 
                style={{ 
                  height: '1px',
                  flex: 1,
                  maxWidth: '60px',
                  background: 'linear-gradient(90deg, transparent, var(--border-color))'
                }}
              ></div>
              <div 
                style={{ 
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  background: 'var(--primary)',
                  boxShadow: '0 0 10px rgba(6, 182, 212, 0.5)',
                  animation: 'pulse-dot 2s ease-in-out infinite'
                }}
              ></div>
              <div 
                style={{ 
                  height: '1px',
                  flex: 1,
                  maxWidth: '60px',
                  background: 'linear-gradient(90deg, var(--border-color), transparent)'
                }}
              ></div>
            </div>
            
            {/* Subtitle */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <p 
                style={{ 
                  fontSize: '0.7rem',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.2em',
                  color: 'var(--gray-400)'
                }}
              >
                Bedriftsstyring og Operasjonsplattform
              </p>
              <p 
                style={{ 
                  fontSize: '0.7rem',
                  fontWeight: 300,
                  textTransform: 'uppercase',
                  letterSpacing: '0.25em',
                  color: 'var(--gray-500)',
                  marginTop: '0.75rem'
                }}
              >
                Utviklet for
              </p>
              <p 
                style={{ 
                  fontSize: '1rem',
                  fontWeight: 700,
                  letterSpacing: '0.05em',
                  color: 'var(--text-color)',
                  marginTop: '0.25rem'
                }}
              >
                MAVI LOGISTIKK AS
              </p>
            </div>
        </div>

        {/* Error message */}
        {error && (
            <div 
              style={{
                marginBottom: '1rem',
                padding: '0.875rem',
                borderRadius: 'var(--radius-xl)',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.75rem',
                position: 'relative',
                overflow: 'hidden',
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.2)',
                backdropFilter: 'blur(8px)'
              }}
            >
              <AlertCircle size={18} style={{ color: 'var(--danger)', flexShrink: 0, marginTop: '2px' }} />
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.25rem', color: 'var(--danger)' }}>Innlogging feilet</p>
                <p style={{ fontSize: '0.8125rem', lineHeight: '1.5', color: 'var(--danger)' }}>{error}</p>
              </div>
          </div>
        )}

        {/* Login Form */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', position: 'relative', zIndex: 10 }}>
            {/* Email Field - STOR */}
          <div>
            <label 
              htmlFor="email" 
                style={{ 
                  display: 'block',
                  marginBottom: '0.5rem',
                  fontSize: '0.875rem',
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
                    left: isMobile ? '1.5rem' : '1rem',
                    top: '50%',
                    transform: `translateY(-50%) ${focusedField === 'email' ? 'scale(1.1)' : 'scale(1)'}`,
                    transition: 'all 0.2s',
                    zIndex: 10,
                    color: focusedField === 'email' ? 'var(--primary)' : 'var(--gray-400)'
                  }}
                >
                  <Mail size={isMobile ? 28 : 20} />
              </div>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                  onFocus={() => setFocusedField('email')}
                  onBlur={() => setFocusedField(null)}
                required
                  style={{
                    width: '100%',
                    paddingLeft: isMobile ? '4rem' : '3.5rem',
                    paddingRight: isMobile ? '2rem' : '1.5rem',
                    paddingTop: isMobile ? '1.75rem' : '1.25rem',
                    paddingBottom: isMobile ? '1.75rem' : '1.25rem',
                    minHeight: isMobile ? '72px' : '56px', // Even larger on mobile
                    borderRadius: isMobile ? '16px' : 'var(--radius-xl)',
                    transition: 'all 0.2s',
                    outline: 'none',
                    fontSize: isMobile ? '20px' : '16px', // Even larger font on mobile
                    WebkitAppearance: 'none',
                    appearance: 'none',
                    background: 'var(--gray-200)',
                    border: isMobile ? `4px solid ${focusedField === 'email' ? 'var(--primary)' : 'var(--border-color)'}` : `3px solid ${focusedField === 'email' ? 'var(--primary)' : 'var(--border-color)'}`,
                    marginBottom: isMobile ? '1.5rem' : '1rem'
                    color: 'var(--text-color)',
                    boxShadow: focusedField === 'email' 
                      ? '0 0 0 4px rgba(6, 182, 212, 0.15), 0 4px 12px rgba(6, 182, 212, 0.15)' 
                      : '0 2px 4px rgba(0, 0, 0, 0.05)',
                    transform: focusedField === 'email' ? 'translateY(-2px)' : 'translateY(0)',
                    touchAction: 'manipulation',
                    WebkitTapHighlightColor: 'transparent',
                    WebkitUserSelect: 'text',
                    userSelect: 'text'
                  }}
                  placeholder="navn@bedrift.no"
                  autoComplete="email"
                  inputMode="email"
                />
                {email && !error && (
                  <div style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)' }}>
                    <CheckCircle size={18} style={{ color: 'var(--success)' }} />
                  </div>
                )}
              </div>
          </div>

            {/* Password Field - STOR */}
          <div>
            <label 
              htmlFor="password" 
                style={{ 
                  display: 'block',
                  marginBottom: '0.5rem',
                  fontSize: '0.875rem',
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
                    left: isMobile ? '1.5rem' : '1rem',
                    top: '50%',
                    transform: `translateY(-50%) ${focusedField === 'password' ? 'scale(1.1)' : 'scale(1)'}`,
                    transition: 'all 0.2s',
                    zIndex: 10,
                    color: focusedField === 'password' ? 'var(--primary)' : 'var(--gray-400)'
                  }}
                >
                  <Lock size={isMobile ? 28 : 20} />
              </div>
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setFocusedField('password')}
                  onBlur={() => setFocusedField(null)}
                required
                  style={{
                    width: '100%',
                    paddingLeft: isMobile ? '4rem' : '3.5rem',
                    paddingRight: isMobile ? '4rem' : '3.5rem',
                    paddingTop: isMobile ? '1.75rem' : '1.25rem',
                    paddingBottom: isMobile ? '1.75rem' : '1.25rem',
                    minHeight: isMobile ? '72px' : '56px', // Even larger on mobile
                    borderRadius: isMobile ? '16px' : 'var(--radius-xl)',
                    transition: 'all 0.2s',
                    outline: 'none',
                    fontSize: isMobile ? '20px' : '16px', // Even larger font on mobile
                    WebkitAppearance: 'none',
                    appearance: 'none',
                    background: 'var(--gray-200)',
                    border: isMobile ? `4px solid ${focusedField === 'password' ? 'var(--primary)' : 'var(--border-color)'}` : `3px solid ${focusedField === 'password' ? 'var(--primary)' : 'var(--border-color)'}`,
                    color: 'var(--text-color)',
                    boxShadow: focusedField === 'password' 
                      ? '0 0 0 4px rgba(6, 182, 212, 0.15), 0 4px 12px rgba(6, 182, 212, 0.15)' 
                      : '0 2px 4px rgba(0, 0, 0, 0.05)',
                    transform: focusedField === 'password' ? 'translateY(-2px)' : 'translateY(0)',
                    touchAction: 'manipulation',
                    WebkitTapHighlightColor: 'transparent',
                    WebkitUserSelect: 'text',
                    userSelect: 'text',
                    marginBottom: isMobile ? '1.5rem' : '1rem'
                  }}
                placeholder="••••••••"
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: isMobile ? '1.25rem' : '0.75rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    padding: isMobile ? '1.25rem' : '0.75rem',
                    minWidth: isMobile ? '64px' : '44px',
                    minHeight: isMobile ? '64px' : '44px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.2s',
                    borderRadius: 'var(--radius-md)',
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--gray-400)',
                    touchAction: 'manipulation',
                    WebkitTapHighlightColor: 'rgba(6, 182, 212, 0.2)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = 'var(--primary)';
                    e.currentTarget.style.background = 'rgba(6, 182, 212, 0.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = 'var(--gray-400)';
                    e.currentTarget.style.background = 'transparent';
                  }}
                  onTouchStart={(e) => {
                    e.currentTarget.style.color = 'var(--primary)';
                    e.currentTarget.style.background = 'rgba(6, 182, 212, 0.1)';
                  }}
                  onTouchEnd={(e) => {
                    setTimeout(() => {
                      e.currentTarget.style.color = 'var(--gray-400)';
                      e.currentTarget.style.background = 'transparent';
                    }, 200);
                  }}
                >
                  {showPassword ? <EyeOff size={isMobile ? 30 : 22} /> : <Eye size={isMobile ? 30 : 22} />}
              </button>
            </div>
          </div>

            {/* Forgot Password */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '0.125rem' }}>
            <a 
              href="/forgot-password" 
                style={{
                  fontSize: '0.9375rem',
                  fontWeight: 500,
                  transition: 'color 0.2s',
                  color: 'var(--primary)',
                  textDecoration: 'none',
                  padding: '0.5rem',
                  minHeight: '44px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  touchAction: 'manipulation',
                  WebkitTapHighlightColor: 'rgba(6, 182, 212, 0.2)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = 'var(--primary-light)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = 'var(--primary)';
                }}
            >
              Glemt passord?
            </a>
          </div>

            {/* Submit Button - AVANSERT - MOBIL OPTIMALISERT */}
          <button
            type="submit"
            disabled={loading}
            style={{
                width: '100%',
                paddingTop: isMobile ? '2rem' : '1.5rem',
                paddingBottom: isMobile ? '2rem' : '1.5rem',
                paddingLeft: isMobile ? '2rem' : '1.5rem',
                paddingRight: isMobile ? '2rem' : '1.5rem',
                minHeight: isMobile ? '72px' : '56px', // Even larger on mobile
                borderRadius: isMobile ? '16px' : 'var(--radius-xl)',
                color: '#ffffff',
                fontWeight: 700,
                fontSize: isMobile ? '1.375rem' : '1.125rem', // Even larger font on mobile
                marginTop: isMobile ? '2rem' : '1rem',
                boxShadow: loading 
                  ? 'none' 
                  : '0 10px 25px -5px rgba(6, 182, 212, 0.4), 0 0 0 1px rgba(6, 182, 212, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
                transition: 'all 0.3s',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.75rem',
                position: 'relative',
                overflow: 'hidden',
                background: loading ? 'var(--gray-400)' : 'var(--gradient-primary)',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.7 : 1,
                border: 'none',
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'rgba(6, 182, 212, 0.3)',
                userSelect: 'none'
              }}
              onMouseEnter={(e) => {
                if (!loading) {
                  e.currentTarget.style.transform = 'translateY(-3px) scale(1.01)';
                  e.currentTarget.style.boxShadow = '0 15px 35px -5px rgba(6, 182, 212, 0.5), 0 0 0 1px rgba(6, 182, 212, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.3)';
                }
              }}
              onMouseLeave={(e) => {
                if (!loading) {
                  e.currentTarget.style.transform = 'translateY(0) scale(1)';
                  e.currentTarget.style.boxShadow = '0 10px 25px -5px rgba(6, 182, 212, 0.4), 0 0 0 1px rgba(6, 182, 212, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.2)';
                }
              }}
              onMouseDown={(e) => {
                if (!loading) {
                  e.currentTarget.style.transform = 'translateY(-1px) scale(0.99)';
                }
              }}
            >
              {/* Shine effect */}
              <div 
                style={{
                  position: 'absolute',
                  inset: 0,
                  opacity: 0,
                  transition: 'opacity 0.5s',
                  background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)',
                  transform: 'translateX(-100%)',
                  animation: 'shimmer 2.5s infinite'
                }}
                className="button-shine"
              ></div>
              
              {/* Glow effect */}
              <div 
                style={{
                  position: 'absolute',
                  inset: 0,
                  opacity: 0,
                  transition: 'opacity 0.5s',
                  filter: 'blur(20px)',
                  background: 'var(--gradient-primary)'
                }}
                className="button-glow"
              ></div>
              
              {loading ? (
                <>
                  <Loader2 size={20} style={{ position: 'relative', zIndex: 10, animation: 'spin 1s linear infinite' }} />
                  <span style={{ position: 'relative', zIndex: 10 }}>Logger inn...</span>
                </>
              ) : (
                <>
                  <span style={{ position: 'relative', zIndex: 10 }}>Logg inn</span>
                  <ArrowRight size={20} style={{ position: 'relative', zIndex: 10, transition: 'transform 0.3s' }} className="arrow-icon" />
                </>
              )}
          </button>
          </form>
        </div>
      </div>

      <style jsx global>{`
        @keyframes float-orb-1 {
          0%, 100% {
            transform: translate(0, 0) scale(1);
            opacity: 0.2;
          }
          50% {
            transform: translate(30px, -30px) scale(1.1);
            opacity: 0.25;
          }
        }
        
        @keyframes float-orb-2 {
          0%, 100% {
            transform: translate(0, 0) scale(1);
            opacity: 0.2;
          }
          50% {
            transform: translate(-40px, 40px) scale(1.15);
            opacity: 0.25;
          }
        }
        
        @keyframes float-orb-3 {
          0%, 100% {
            transform: translate(-50%, -50%) scale(1) rotate(0deg);
            opacity: 0.15;
          }
          50% {
            transform: translate(-50%, -50%) scale(1.1) rotate(180deg);
            opacity: 0.2;
          }
        }
        
        @keyframes pulse-glow {
          0%, 100% {
            opacity: 0.5;
            transform: scale(1.3);
          }
          50% {
            opacity: 0.7;
            transform: scale(1.4);
          }
        }
        
        @keyframes pulse-dot {
          0%, 100% {
            opacity: 1;
            transform: scale(1);
          }
          50% {
            opacity: 0.7;
            transform: scale(1.2);
          }
        }
        
        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(200%);
          }
        }

          @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        @keyframes corner-pulse {
          0%, 100% {
            opacity: 0.6;
            transform: scale(1);
          }
          50% {
            opacity: 1;
            transform: scale(1.2);
          }
        }

        /* ===== DRIFTPRO LOGO ANIMATIONS - Ultra Advanced & Professional ===== */
        
        /* Main rotation */
        /* ===== DRIFTPRO LOGO ANIMATIONS - Fun & Advanced ===== */
        
        /* Main container - faster rotation with bounce */
        @keyframes dp-logo-rotate {
          0% { transform: rotate(0deg) scale(1); }
          25% { transform: rotate(90deg) scale(1.02); }
          50% { transform: rotate(180deg) scale(1); }
          75% { transform: rotate(270deg) scale(1.02); }
          100% { transform: rotate(360deg) scale(1); }
        }
        
        /* Background active pulse with ripple */
        @keyframes dp-bg-pulse {
          0%, 100% {
            opacity: 0.1;
            transform: scale(1);
          }
          50% {
            opacity: 0.2;
            transform: scale(1.05);
          }
        }
        
        /* Ripple effect - expanding circles */
        @keyframes dp-ripple-expand {
          0% {
            transform: scale(0.8);
            opacity: 0.3;
            stroke-width: 2;
          }
          50% {
            transform: scale(1.2);
            opacity: 0.1;
            stroke-width: 1;
          }
          100% {
            transform: scale(1.6);
            opacity: 0;
            stroke-width: 0.5;
          }
        }
        
        /* Energy burst - spring effect */
        @keyframes dp-burst-spring {
          0%, 100% {
            transform: scale(1);
            opacity: 0.3;
          }
          25% {
            transform: scale(1.3);
            opacity: 0.6;
          }
          50% {
            transform: scale(0.9);
            opacity: 0.4;
          }
          75% {
            transform: scale(1.2);
            opacity: 0.7;
          }
        }
        
        /* Burst dot - bounce */
        @keyframes dp-burst-dot-bounce {
          0%, 100% {
            transform: scale(1);
            opacity: 0.8;
          }
          50% {
            transform: scale(1.5);
            opacity: 1;
          }
        }
        
        /* Outer ring - faster rotation */
        @keyframes dp-ring-outer-rotate {
          from {
            stroke-dashoffset: 0;
            transform: rotate(0deg);
          }
          to {
            stroke-dashoffset: -14;
            transform: rotate(360deg);
          }
        }
        
        /* Middle ring - counter rotation */
        @keyframes dp-ring-middle-rotate {
          from {
            stroke-dashoffset: 0;
            transform: rotate(0deg);
          }
          to {
            stroke-dashoffset: -10;
            transform: rotate(-360deg);
          }
        }
        
        /* Core outer - bounce pulse */
        @keyframes dp-core-outer-pulse {
          0%, 100% {
            transform: scale(1);
            opacity: 0.95;
            filter: drop-shadow(0 0 4px rgba(255, 255, 255, 0.4));
          }
          25% {
            transform: scale(1.08);
            opacity: 1;
            filter: drop-shadow(0 0 8px rgba(255, 255, 255, 0.6));
          }
          50% {
            transform: scale(1.12);
            opacity: 1;
            filter: drop-shadow(0 0 12px rgba(255, 255, 255, 0.8));
          }
          75% {
            transform: scale(1.05);
            opacity: 0.98;
            filter: drop-shadow(0 0 6px rgba(255, 255, 255, 0.5));
          }
        }
        
        /* Core inner - elastic pulse */
        @keyframes dp-core-inner-pulse {
          0%, 100% {
            transform: scale(1);
            opacity: 1;
          }
          25% {
            transform: scale(1.12);
            opacity: 0.98;
          }
          50% {
            transform: scale(1.18);
            opacity: 0.95;
          }
          75% {
            transform: scale(1.08);
            opacity: 0.97;
          }
        }
        
        /* Core center - intense bounce */
        @keyframes dp-core-pulse {
          0%, 100% {
            transform: scale(1);
            opacity: 0.95;
          }
          25% {
            transform: scale(1.3);
            opacity: 0.9;
          }
          50% {
            transform: scale(1.5);
            opacity: 0.8;
          }
          75% {
            transform: scale(1.2);
            opacity: 0.85;
          }
        }
        
        /* Floating elements - playful bounce */
        @keyframes dp-element-float {
          0%, 100% {
            transform: translateY(0px) translateX(0px) scale(1) rotate(0deg);
            opacity: 0.9;
          }
          20% {
            transform: translateY(-4px) translateX(2px) scale(1.06) rotate(2deg);
            opacity: 1;
          }
          40% {
            transform: translateY(-6px) translateX(0px) scale(1.1) rotate(0deg);
            opacity: 1;
          }
          60% {
            transform: translateY(-3px) translateX(-2px) scale(1.05) rotate(-2deg);
            opacity: 0.95;
          }
          80% {
            transform: translateY(-1px) translateX(1px) scale(1.02) rotate(1deg);
            opacity: 0.92;
          }
        }
        
        /* Element glow - wave pulse */
        @keyframes dp-element-glow-pulse {
          0%, 100% {
            opacity: 0.2;
            transform: scale(1);
          }
          33% {
            opacity: 0.35;
            transform: scale(1.15);
          }
          66% {
            opacity: 0.45;
            transform: scale(1.25);
          }
        }
        
        /* Element dot - bounce pulse */
        @keyframes dp-element-dot-pulse {
          0%, 100% {
            transform: scale(1);
            opacity: 0.9;
            filter: drop-shadow(0 0 2px rgba(255, 255, 255, 0.3));
          }
          25% {
            transform: scale(1.15);
            opacity: 1;
            filter: drop-shadow(0 0 4px rgba(255, 255, 255, 0.5));
          }
          50% {
            transform: scale(1.25);
            opacity: 1;
            filter: drop-shadow(0 0 8px rgba(255, 255, 255, 0.7));
          }
          75% {
            transform: scale(1.1);
            opacity: 0.95;
            filter: drop-shadow(0 0 5px rgba(255, 255, 255, 0.6));
          }
        }
        
        /* Element core - elastic bounce */
        @keyframes dp-element-core-pulse {
          0%, 100% {
            transform: scale(1);
            opacity: 1;
          }
          25% {
            transform: scale(1.4);
            opacity: 0.95;
          }
          50% {
            transform: scale(1.6);
            opacity: 0.9;
          }
          75% {
            transform: scale(1.3);
            opacity: 0.92;
          }
        }
        
        /* Element indicator - playful orbit */
        @keyframes dp-element-indicator-orbit {
          0% {
            transform: rotate(0deg) translateX(2.5px) rotate(0deg) scale(1);
            opacity: 0.7;
          }
          25% {
            transform: rotate(90deg) translateX(2.5px) rotate(-90deg) scale(1.2);
            opacity: 1;
          }
          50% {
            transform: rotate(180deg) translateX(2.5px) rotate(-180deg) scale(1);
            opacity: 0.9;
          }
          75% {
            transform: rotate(270deg) translateX(2.5px) rotate(-270deg) scale(1.15);
            opacity: 1;
          }
          100% {
            transform: rotate(360deg) translateX(2.5px) rotate(-360deg) scale(1);
            opacity: 0.7;
          }
        }
        
        /* Data particle - bouncy movement */
        @keyframes dp-data-particle-move {
          0% {
            transform: translate(0, 0) scale(0.8);
            opacity: 0.6;
          }
          20% {
            transform: translate(calc(cos(var(--angle, 0) * 3.14159 / 180) * -4px), calc(sin(var(--angle, 0) * 3.14159 / 180) * -4px)) scale(1.1);
            opacity: 0.9;
          }
          40% {
            transform: translate(calc(cos(var(--angle, 0) * 3.14159 / 180) * -8px), calc(sin(var(--angle, 0) * 3.14159 / 180) * -8px)) scale(1.3);
            opacity: 1;
          }
          60% {
            transform: translate(calc(cos(var(--angle, 0) * 3.14159 / 180) * -12px), calc(sin(var(--angle, 0) * 3.14159 / 180) * -12px)) scale(1.2);
            opacity: 0.95;
          }
          80% {
            transform: translate(calc(cos(var(--angle, 0) * 3.14159 / 180) * -16px), calc(sin(var(--angle, 0) * 3.14159 / 180) * -16px)) scale(1);
            opacity: 0.8;
          }
          100% {
            transform: translate(calc(cos(var(--angle, 0) * 3.14159 / 180) * -20px), calc(sin(var(--angle, 0) * 3.14159 / 180) * -20px)) scale(0.7);
            opacity: 0.4;
          }
        }
        
        /* Element connection - active flow */
        @keyframes dp-element-connection-flow {
          0% {
            stroke-dashoffset: 0;
            opacity: 0.15;
          }
          50% {
            stroke-dashoffset: -6;
            opacity: 0.3;
          }
          100% {
            stroke-dashoffset: -12;
            opacity: 0.15;
          }
        }
        
        /* Flow path - wave pulse */
        @keyframes dp-flow-path-pulse {
          0%, 100% {
            stroke-opacity: 0.2;
            stroke-width: 0.6;
          }
          33% {
            stroke-opacity: 0.35;
            stroke-width: 0.75;
          }
          66% {
            stroke-opacity: 0.45;
            stroke-width: 0.9;
          }
        }
        
        /* Flow particle - playful movement */
        @keyframes dp-flow-particle-move {
          0% {
            transform: translate(0, 0) scale(0.7);
            opacity: 0.5;
          }
          20% {
            transform: translate(calc(cos(var(--flow-angle, 0) * 3.14159 / 180) * 3px), calc(sin(var(--flow-angle, 0) * 3.14159 / 180) * 3px)) scale(1);
            opacity: 0.9;
          }
          40% {
            transform: translate(calc(cos(var(--flow-angle, 0) * 3.14159 / 180) * 6px), calc(sin(var(--flow-angle, 0) * 3.14159 / 180) * 6px)) scale(1.2);
            opacity: 1;
          }
          60% {
            transform: translate(calc(cos(var(--flow-angle, 0) * 3.14159 / 180) * 9px), calc(sin(var(--flow-angle, 0) * 3.14159 / 180) * 9px)) scale(1.1);
            opacity: 0.95;
          }
          80% {
            transform: translate(calc(cos(var(--flow-angle, 0) * 3.14159 / 180) * 12px), calc(sin(var(--flow-angle, 0) * 3.14159 / 180) * 12px)) scale(0.9);
            opacity: 0.7;
          }
          100% {
            transform: translate(calc(cos(var(--flow-angle, 0) * 3.14159 / 180) * 16px), calc(sin(var(--flow-angle, 0) * 3.14159 / 180) * 16px)) scale(0.6);
            opacity: 0.3;
          }
        }
        
        /* Sparkle - playful orbit with bounce */
        @keyframes dp-sparkle-orbit {
          0% {
            transform: rotate(0deg) translateX(7px) rotate(0deg) scale(1);
            opacity: 0.7;
          }
          25% {
            transform: rotate(90deg) translateX(7px) rotate(-90deg) scale(1.4);
            opacity: 1;
          }
          50% {
            transform: rotate(180deg) translateX(7px) rotate(-180deg) scale(1);
            opacity: 0.9;
          }
          75% {
            transform: rotate(270deg) translateX(7px) rotate(-270deg) scale(1.3);
            opacity: 1;
          }
          100% {
            transform: rotate(360deg) translateX(7px) rotate(-360deg) scale(1);
            opacity: 0.7;
          }
        }
        
        /* Apply animations */
        .dp-logo-container {
          animation: dp-logo-rotate 20s linear infinite;
          transform-origin: 32px 32px;
        }
        
        .dp-bg {
          animation: dp-bg-pulse 3s ease-in-out infinite;
          transform-origin: 32px 32px;
        }
        
        .dp-ring-outer {
          animation: dp-ring-outer-rotate 8s linear infinite;
          transform-origin: 32px 32px;
        }
        
        .dp-ring-middle {
          animation: dp-ring-middle-rotate 6s linear infinite;
          transform-origin: 32px 32px;
        }
        
        .dp-core-outer {
          animation: dp-core-outer-pulse 2s ease-in-out infinite;
          transform-origin: 32px 32px;
        }
        
        .dp-core-inner {
          animation: dp-core-inner-pulse 1.5s ease-in-out infinite;
          transform-origin: 32px 32px;
        }
        
        .dp-core-pulse {
          animation: dp-core-pulse 1.2s ease-in-out infinite;
          transform-origin: 32px 32px;
        }
        
        .dp-floating-element {
          animation: dp-element-float 2.5s ease-in-out infinite;
        }
        
        .dp-element-glow {
          animation: dp-element-glow-pulse 2s ease-in-out infinite;
        }
        
        .dp-element-dot {
          animation: dp-element-dot-pulse 1.8s ease-in-out infinite;
        }
        
        .dp-element-core {
          animation: dp-element-core-pulse 1.5s ease-in-out infinite;
        }
        
        .dp-element-indicator {
          animation: dp-element-indicator-orbit 3s linear infinite;
        }
        
        .dp-data-particle {
          animation: dp-data-particle-move 2s ease-in-out infinite;
        }
        
        .dp-element-connection {
          animation: dp-element-connection-flow 2s linear infinite;
        }
        
        .dp-flow-path {
          animation: dp-flow-path-pulse 2s ease-in-out infinite;
        }
        
        .dp-flow-particle {
          animation: dp-flow-particle-move 2.5s ease-in-out infinite;
        }
        
        .dp-sparkle {
          animation: dp-sparkle-orbit 4s linear infinite;
          transform-origin: 32px 32px;
        }
        
        .dp-ripple {
          animation: dp-ripple-expand 2s ease-out infinite;
          transform-origin: 32px 32px;
        }
        
        .dp-burst-line {
          animation: dp-burst-spring 1.5s ease-in-out infinite;
          transform-origin: 32px 32px;
        }
        
        .dp-burst-dot {
          animation: dp-burst-dot-bounce 1.2s ease-in-out infinite;
        }
        
        /* ============================================
           ADVANCED LOGO ANIMATIONS - Quantum System
           ============================================ */
        
        /* Quantum Field Pulse */
        @keyframes quantum-field-pulse {
          0%, 100% {
            opacity: 0.15;
            transform: scale(1);
          }
          50% {
            opacity: 0.25;
            transform: scale(1.1);
          }
        }
        
        /* Orbital Ring Rotations - Complex Elliptical */
        @keyframes orbital-ring-1-rotate {
          from {
            transform: rotate(0deg) scaleX(1) scaleY(1);
          }
          25% {
            transform: rotate(90deg) scaleX(1.2) scaleY(0.8);
          }
          50% {
            transform: rotate(180deg) scaleX(1) scaleY(1);
          }
          75% {
            transform: rotate(270deg) scaleX(0.8) scaleY(1.2);
          }
          to {
            transform: rotate(360deg) scaleX(1) scaleY(1);
          }
        }
        
        @keyframes orbital-ring-2-rotate {
          from {
            transform: rotate(0deg) scaleX(1) scaleY(1);
          }
          25% {
            transform: rotate(-90deg) scaleX(0.8) scaleY(1.2);
          }
          50% {
            transform: rotate(-180deg) scaleX(1) scaleY(1);
          }
          75% {
            transform: rotate(-270deg) scaleX(1.2) scaleY(0.8);
          }
          to {
            transform: rotate(-360deg) scaleX(1) scaleY(1);
          }
        }
        
        @keyframes orbital-ring-3-rotate {
          from {
            transform: rotate(0deg) scaleX(1) scaleY(1);
          }
          33% {
            transform: rotate(120deg) scaleX(1.15) scaleY(0.85);
          }
          66% {
            transform: rotate(240deg) scaleX(0.85) scaleY(1.15);
          }
          to {
            transform: rotate(360deg) scaleX(1) scaleY(1);
          }
        }
        
        /* Hexagonal Core Animations */
        @keyframes hex-outer-rotate {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
        
        @keyframes hex-middle-rotate {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(-360deg);
          }
        }
        
        @keyframes hex-inner-pulse {
          0%, 100% {
            transform: scale(1) rotate(0deg);
            opacity: 0.6;
          }
          25% {
            transform: scale(1.1) rotate(60deg);
            opacity: 0.8;
          }
          50% {
            transform: scale(1.15) rotate(120deg);
            opacity: 1;
          }
          75% {
            transform: scale(1.1) rotate(180deg);
            opacity: 0.8;
          }
        }
        
        /* Quantum Core Morphing */
        @keyframes morph-hex-morph {
          0%, 100% {
            transform: scale(1) rotate(0deg);
            opacity: 0.9;
          }
          16.66% {
            transform: scale(1.1) rotate(60deg);
            opacity: 1;
          }
          33.33% {
            transform: scale(1.15) rotate(120deg);
            opacity: 1;
          }
          50% {
            transform: scale(1.1) rotate(180deg);
            opacity: 1;
          }
          66.66% {
            transform: scale(1.15) rotate(240deg);
            opacity: 1;
          }
          83.33% {
            transform: scale(1.1) rotate(300deg);
            opacity: 1;
          }
        }
        
        @keyframes core-glow-pulse {
          0%, 100% {
            opacity: 0.8;
            transform: scale(1);
          }
          50% {
            opacity: 1;
            transform: scale(1.2);
          }
        }
        
        @keyframes core-pulse-intense {
          0%, 100% {
            transform: scale(1);
            opacity: 0.95;
          }
          25% {
            transform: scale(1.3);
            opacity: 0.9;
          }
          50% {
            transform: scale(1.5);
            opacity: 0.85;
          }
          75% {
            transform: scale(1.2);
            opacity: 0.9;
          }
        }
        
        @keyframes core-center-rotate {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
        
        /* Quantum Particle Orbital */
        @keyframes quantum-particle-orbit {
          0% {
            transform: rotate(0deg) translateX(22px) rotate(0deg) scale(1);
            opacity: 0.9;
          }
          25% {
            transform: rotate(90deg) translateX(22px) rotate(-90deg) scale(1.1);
            opacity: 1;
          }
          50% {
            transform: rotate(180deg) translateX(22px) rotate(-180deg) scale(1);
            opacity: 0.95;
          }
          75% {
            transform: rotate(270deg) translateX(22px) rotate(-270deg) scale(1.1);
            opacity: 1;
          }
          100% {
            transform: rotate(360deg) translateX(22px) rotate(-360deg) scale(1);
            opacity: 0.9;
          }
        }
        
        @keyframes orbital-particle-rotate {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
        
        @keyframes particle-connection-flow {
          0% {
            stroke-dashoffset: 0;
            opacity: 0.15;
          }
          50% {
            stroke-dashoffset: -8;
            opacity: 0.3;
          }
          100% {
            stroke-dashoffset: -16;
            opacity: 0.15;
          }
        }
        
        /* Wave Ring Expansion */
        @keyframes wave-ring-expand {
          0% {
            transform: scale(0.8);
            opacity: 0.2;
            stroke-width: 1;
          }
          50% {
            transform: scale(1.5);
            opacity: 0.1;
            stroke-width: 0.8;
          }
          100% {
            transform: scale(2.2);
            opacity: 0;
            stroke-width: 0.5;
          }
        }
        
        /* Energy Beam Pulse */
        @keyframes energy-beam-pulse {
          0%, 100% {
            stroke-opacity: 0.4;
            stroke-width: 1.5;
          }
          50% {
            stroke-opacity: 0.8;
            stroke-width: 2.5;
          }
        }
        
        @keyframes beam-node-pulse {
          0%, 100% {
            transform: scale(1);
            opacity: 0.8;
          }
          50% {
            transform: scale(1.3);
            opacity: 1;
          }
        }
        
        /* Data Particle Float */
        @keyframes data-particle-float {
          0%, 100% {
            transform: translate(0, 0) scale(1);
            opacity: 0.9;
          }
          25% {
            transform: translate(2px, -3px) scale(1.2);
            opacity: 1;
          }
          50% {
            transform: translate(-2px, -4px) scale(1.1);
            opacity: 0.95;
          }
          75% {
            transform: translate(1px, -2px) scale(1.15);
            opacity: 1;
          }
        }
        
        /* Morphing Triangle */
        @keyframes morph-triangle-morph {
          0%, 100% {
            transform: scale(1) rotate(0deg);
            opacity: 0.5;
          }
          33% {
            transform: scale(1.2) rotate(120deg);
            opacity: 0.7;
          }
          66% {
            transform: scale(1.1) rotate(240deg);
            opacity: 0.6;
          }
        }
        
        /* Additional Animations for New Elements */
        @keyframes circular-ring-rotate {
          from {
            transform: rotate(0deg);
            stroke-dashoffset: 0;
          }
          to {
            transform: rotate(360deg);
            stroke-dashoffset: -20;
          }
        }
        
        @keyframes secondary-wave-expand {
          0% {
            transform: scale(0.9);
            opacity: 0.15;
          }
          50% {
            transform: scale(1.3);
            opacity: 0.08;
          }
          100% {
            transform: scale(1.8);
            opacity: 0;
          }
        }
        
        @keyframes secondary-particle-float {
          0%, 100% {
            transform: translate(0, 0) scale(1);
            opacity: 0.7;
          }
          25% {
            transform: translate(1.5px, -2px) scale(1.3);
            opacity: 0.9;
          }
          50% {
            transform: translate(-1.5px, -3px) scale(1.1);
            opacity: 0.8;
          }
          75% {
            transform: translate(1px, -1.5px) scale(1.2);
            opacity: 0.85;
          }
        }
        
        @keyframes morph-square-rotate {
          from {
            transform: rotate(0deg) scale(1);
            opacity: 0.4;
          }
          50% {
            transform: rotate(180deg) scale(1.2);
            opacity: 0.6;
          }
          to {
            transform: rotate(360deg) scale(1);
            opacity: 0.4;
          }
        }
        
        @keyframes morph-diamond-morph {
          0%, 100% {
            transform: rotate(0deg) scale(1);
            opacity: 0.45;
          }
          25% {
            transform: rotate(90deg) scale(1.15);
            opacity: 0.6;
          }
          50% {
            transform: rotate(180deg) scale(1.1);
            opacity: 0.55;
          }
          75% {
            transform: rotate(270deg) scale(1.15);
            opacity: 0.6;
          }
        }
        
        @keyframes connection-line-flow {
          0% {
            stroke-dashoffset: 0;
            opacity: 0.1;
          }
          50% {
            stroke-dashoffset: -5;
            opacity: 0.2;
          }
          100% {
            stroke-dashoffset: -10;
            opacity: 0.1;
          }
        }
        
        @keyframes glow-particle-pulse {
          0%, 100% {
            transform: scale(1);
            opacity: 0.6;
          }
          50% {
            transform: scale(1.5);
            opacity: 0.9;
          }
        }
        
        /* Apply Advanced Animations - Faster speeds for more movement */
        .quantum-field {
          animation: quantum-field-pulse 3s ease-in-out infinite;
          transform-origin: 32px 32px;
        }
        
        .orbital-ring-1 {
          animation: orbital-ring-1-rotate 15s linear infinite;
          transform-origin: 32px 32px;
        }
        
        .orbital-ring-2 {
          animation: orbital-ring-2-rotate 18s linear infinite;
          transform-origin: 32px 32px;
        }
        
        .orbital-ring-3 {
          animation: orbital-ring-3-rotate 22s linear infinite;
          transform-origin: 32px 32px;
        }
        
        .circular-ring-1 {
          animation: circular-ring-rotate 12s linear infinite;
          transform-origin: 32px 32px;
        }
        
        .circular-ring-2 {
          animation: circular-ring-rotate 10s linear infinite reverse;
          transform-origin: 32px 32px;
        }
        
        .hex-outer {
          animation: hex-outer-rotate 12s linear infinite;
          transform-origin: 32px 32px;
        }
        
        .hex-middle {
          animation: hex-middle-rotate 10s linear infinite;
          transform-origin: 32px 32px;
        }
        
        .hex-inner {
          animation: hex-inner-pulse 2.5s ease-in-out infinite;
          transform-origin: 32px 32px;
        }
        
        .morph-hex {
          animation: morph-hex-morph 3s ease-in-out infinite;
          transform-origin: 32px 32px;
        }
        
        .core-glow {
          animation: core-glow-pulse 1.5s ease-in-out infinite;
          transform-origin: 32px 32px;
        }
        
        .core-pulse {
          animation: core-pulse-intense 1.2s ease-in-out infinite;
          transform-origin: 32px 32px;
        }
        
        .core-center {
          animation: core-center-rotate 2.5s linear infinite;
          transform-origin: 32px 32px;
        }
        
        .quantum-particle-group {
          animation: quantum-particle-orbit 6s linear infinite;
          transform-origin: 32px 32px;
        }
        
        .orbital-particle {
          animation: orbital-particle-rotate 3s linear infinite;
          transform-origin: 0 0;
        }
        
        .particle-connection {
          animation: particle-connection-flow 2.5s linear infinite;
        }
        
        .wave-ring {
          animation: wave-ring-expand 2.5s ease-out infinite;
          transform-origin: 32px 32px;
        }
        
        .secondary-wave {
          animation: secondary-wave-expand 2s ease-out infinite;
          transform-origin: 32px 32px;
        }
        
        .energy-beam {
          animation: energy-beam-pulse 1.5s ease-in-out infinite;
          transform-origin: 32px 32px;
        }
        
        .beam-node {
          animation: beam-node-pulse 1.2s ease-in-out infinite;
          transform-origin: 0 0;
        }
        
        .data-particle {
          animation: data-particle-float 2.5s ease-in-out infinite;
        }
        
        .secondary-particle {
          animation: secondary-particle-float 2s ease-in-out infinite;
        }
        
        .morph-triangle {
          animation: morph-triangle-morph 3s ease-in-out infinite;
        }
        
        .morph-square {
          animation: morph-square-rotate 4s linear infinite;
        }
        
        .morph-diamond {
          animation: morph-diamond-morph 3.5s ease-in-out infinite;
        }
        
        .connection-line {
          animation: connection-line-flow 2s linear infinite;
        }
        
        .glow-particle {
          animation: glow-particle-pulse 2s ease-in-out infinite;
        }
        
        /* Advanced Logo Container - More movement */
        .advanced-logo-container {
          transform-origin: 32px 32px;
          animation: logo-container-float 8s ease-in-out infinite;
        }
        
        @keyframes logo-container-float {
          0%, 100% {
            transform: translate(0, 0) scale(1);
          }
          25% {
            transform: translate(1px, -1px) scale(1.01);
          }
          50% {
            transform: translate(0, -1.5px) scale(1);
          }
          75% {
            transform: translate(-1px, -1px) scale(1.01);
          }
        }
        
        .advanced-logo:hover .quantum-field {
          animation-duration: 1.5s;
        }
        
        .advanced-logo:hover .orbital-particle {
          animation-duration: 1.5s;
        }
        
        .advanced-logo:hover .morph-hex {
          animation-duration: 1.5s;
        }
        
        .advanced-logo:hover .quantum-particle-group {
          animation-duration: 4s;
        }
        
        .advanced-logo:hover .hex-outer {
          animation-duration: 8s;
        }
        
        .advanced-logo:hover .hex-middle {
          animation-duration: 7s;
        }

        /* Company name overlay animation - ultra advanced reveal */
        @keyframes driftpro-company-name-show {
          0%, 57.14% {
            opacity: 0;
            transform: scale(0.5) rotateZ(180deg);
            filter: blur(15px) brightness(0.5);
          }
          57.15% {
            opacity: 0;
            transform: scale(0.5) rotateZ(180deg);
            filter: blur(15px) brightness(0.5);
          }
          58% {
            opacity: 0.2;
            transform: scale(0.7) rotateZ(135deg);
            filter: blur(10px) brightness(0.7);
          }
          59% {
            opacity: 0.5;
            transform: scale(0.85) rotateZ(90deg);
            filter: blur(6px) brightness(0.85);
          }
          60% {
            opacity: 0.8;
            transform: scale(0.95) rotateZ(45deg);
            filter: blur(3px) brightness(0.95);
          }
          61% {
            opacity: 1;
            transform: scale(1) rotateZ(0deg);
            filter: blur(0px) brightness(1);
          }
          93% {
            opacity: 1;
            transform: scale(1) rotateZ(0deg);
            filter: blur(0px) brightness(1);
          }
          95% {
            opacity: 0.9;
            transform: scale(0.98) rotateZ(-10deg);
            filter: blur(1px) brightness(0.95);
          }
          97% {
            opacity: 0.6;
            transform: scale(0.9) rotateZ(-30deg);
            filter: blur(4px) brightness(0.8);
          }
          100% {
            opacity: 0;
            transform: scale(0.5) rotateZ(-180deg);
            filter: blur(15px) brightness(0.5);
          }
        }

        /* Name background base - smooth fade */
        @keyframes driftpro-name-background-base-fade {
          0%, 57.14% {
            opacity: 0;
          }
          57.15% {
            opacity: 0;
          }
          59% {
            opacity: 0.9;
          }
          94% {
            opacity: 0.9;
          }
          100% {
            opacity: 0;
          }
        }

        /* Name background radial - pulsing effect */
        @keyframes driftpro-name-background-radial-pulse {
          0%, 57.14% {
            opacity: 0;
            transform: scale(0.8);
          }
          57.15% {
            opacity: 0;
            transform: scale(0.8);
          }
          60% {
            opacity: 0.6;
            transform: scale(1);
          }
          70% {
            opacity: 0.7;
            transform: scale(1.05);
          }
          80% {
            opacity: 0.65;
            transform: scale(1.02);
          }
          93% {
            opacity: 0.6;
            transform: scale(1);
          }
          100% {
            opacity: 0;
            transform: scale(0.8);
          }
        }

        /* Pattern overlay animation */
        @keyframes driftpro-name-pattern-rotate {
          0%, 57.14% {
            opacity: 0;
            transform: rotate(0deg);
          }
          57.15% {
            opacity: 0;
            transform: rotate(0deg);
          }
          60% {
            opacity: 0.1;
            transform: rotate(0deg);
          }
          93% {
            opacity: 0.1;
            transform: rotate(360deg);
          }
          100% {
            opacity: 0;
            transform: rotate(360deg);
          }
        }

        /* Glow rings animation */
        @keyframes driftpro-name-glow-ring-pulse {
          0%, 57.14% {
            opacity: 0;
            transform: scale(0.8);
          }
          57.15% {
            opacity: 0;
            transform: scale(0.8);
          }
          60% {
            opacity: 0.3;
            transform: scale(1);
          }
          94% {
            opacity: 0.3;
            transform: scale(1);
          }
          100% {
            opacity: 0;
            transform: scale(0.8);
          }
        }

        /* Shimmer effect */
        @keyframes driftpro-name-shimmer {
          0%, 57.14% {
            opacity: 0;
            transform: translateX(-100%);
          }
          57.15% {
            opacity: 0;
            transform: translateX(-100%);
          }
          60% {
            opacity: 0.3;
            transform: translateX(0%);
          }
          70% {
            opacity: 0.4;
            transform: translateX(20%);
          }
          80% {
            opacity: 0.3;
            transform: translateX(40%);
          }
          94% {
            opacity: 0.3;
            transform: translateX(100%);
          }
          100% {
            opacity: 0;
            transform: translateX(100%);
          }
        }

        /* Company name main text - advanced reveal */
        @keyframes driftpro-company-name-main-fade {
          0%, 57.14% {
            opacity: 0;
            transform: translateY(-15px) scale(0.5);
            filter: blur(8px);
          }
          57.15% {
            opacity: 0;
            transform: translateY(-15px) scale(0.5);
            filter: blur(8px);
          }
          59% {
            opacity: 0.5;
            transform: translateY(-8px) scale(0.8);
            filter: blur(4px);
          }
          61% {
            opacity: 1;
            transform: translateY(0) scale(1);
            filter: blur(0px);
          }
          93% {
            opacity: 1;
            transform: translateY(0) scale(1);
            filter: blur(0px);
          }
          96% {
            opacity: 0.7;
            transform: translateY(5px) scale(0.95);
            filter: blur(2px);
          }
          100% {
            opacity: 0;
            transform: translateY(15px) scale(0.5);
            filter: blur(8px);
          }
        }

        /* Main text animation - Utviklet for MAVI Logistikk */
        @keyframes driftpro-main-text-fade {
          0%, 57.14% {
            opacity: 0;
            transform: translateY(-15px) scale(0.6);
            filter: blur(10px);
          }
          57.15% {
            opacity: 0;
            transform: translateY(-15px) scale(0.6);
            filter: blur(10px);
          }
          59% {
            opacity: 0.4;
            transform: translateY(-8px) scale(0.8);
            filter: blur(5px);
          }
          61% {
            opacity: 1;
            transform: translateY(0) scale(1);
            filter: blur(0px);
          }
          93% {
            opacity: 1;
            transform: translateY(0) scale(1);
            filter: blur(0px);
          }
          96% {
            opacity: 0.7;
            transform: translateY(8px) scale(0.95);
            filter: blur(3px);
          }
          100% {
            opacity: 0;
            transform: translateY(15px) scale(0.6);
            filter: blur(10px);
          }
        }

        /* Main text shadow */
        @keyframes driftpro-main-text-shadow-fade {
          0%, 57.14% {
            opacity: 0;
            transform: translateY(-12px) translateX(1px);
          }
          57.15% {
            opacity: 0;
            transform: translateY(-12px) translateX(1px);
          }
          61% {
            opacity: 0.4;
            transform: translateY(-1px) translateX(1px);
          }
          93% {
            opacity: 0.4;
            transform: translateY(-1px) translateX(1px);
          }
          100% {
            opacity: 0;
            transform: translateY(12px) translateX(1px);
          }
        }

        /* Main text highlight */
        @keyframes driftpro-main-text-highlight {
          0%, 57.14% {
            opacity: 0;
          }
          57.15% {
            opacity: 0;
          }
          61% {
            opacity: 0.7;
          }
          93% {
            opacity: 0.7;
          }
          100% {
            opacity: 0;
          }
        }

        /* Individual letter animation - MAVI - ultra advanced */
        @keyframes driftpro-letter-mavi-pop {
          0%, 57.14% {
            opacity: 0;
            transform: translateY(-30px) translateX(0) scale(0.2) rotateX(90deg) rotateY(90deg);
            filter: blur(10px);
          }
          57.15% {
            opacity: 0;
            transform: translateY(-30px) translateX(0) scale(0.2) rotateX(90deg) rotateY(90deg);
            filter: blur(10px);
          }
          60% {
            opacity: 0;
            transform: translateY(-30px) translateX(0) scale(0.2) rotateX(90deg) rotateY(90deg);
            filter: blur(10px);
          }
          61% {
            opacity: 0.3;
            transform: translateY(-15px) translateX(0) scale(0.5) rotateX(45deg) rotateY(45deg);
            filter: blur(6px);
          }
          62% {
            opacity: 0.7;
            transform: translateY(-5px) translateX(0) scale(0.9) rotateX(15deg) rotateY(15deg);
            filter: blur(2px);
          }
          63% {
            opacity: 1;
            transform: translateY(0) translateX(0) scale(1.15) rotateX(0deg) rotateY(0deg);
            filter: blur(0px);
          }
          64% {
            opacity: 1;
            transform: translateY(0) translateX(0) scale(1) rotateX(0deg) rotateY(0deg);
            filter: blur(0px);
          }
          93% {
            opacity: 1;
            transform: translateY(0) translateX(0) scale(1) rotateX(0deg) rotateY(0deg);
            filter: blur(0px);
          }
          95% {
            opacity: 0.9;
            transform: translateY(3px) translateX(0) scale(0.95) rotateX(-10deg) rotateY(-10deg);
            filter: blur(1px);
          }
          97% {
            opacity: 0.6;
            transform: translateY(10px) translateX(0) scale(0.8) rotateX(-30deg) rotateY(-30deg);
            filter: blur(4px);
          }
          100% {
            opacity: 0;
            transform: translateY(30px) translateX(0) scale(0.2) rotateX(-90deg) rotateY(-90deg);
            filter: blur(10px);
          }
        }

        /* Letter glow animation */
        @keyframes driftpro-letter-mavi-glow-pulse {
          0%, 57.14% {
            opacity: 0;
            transform: scale(0.5);
          }
          57.15% {
            opacity: 0;
            transform: scale(0.5);
          }
          62% {
            opacity: 0.6;
            transform: scale(1.1);
          }
          93% {
            opacity: 0.6;
            transform: scale(1.1);
          }
          100% {
            opacity: 0;
            transform: scale(0.5);
          }
        }

        /* Letter highlight animation */
        @keyframes driftpro-letter-mavi-highlight {
          0%, 57.14% {
            opacity: 0;
          }
          57.15% {
            opacity: 0;
          }
          63% {
            opacity: 0.7;
          }
          93% {
            opacity: 0.7;
          }
          100% {
            opacity: 0;
          }
        }

        /* Company name sub text - LOGISTIKK */
        @keyframes driftpro-company-name-sub-fade {
          0%, 57.14% {
            opacity: 0;
            transform: translateY(15px) scale(0.5);
            filter: blur(8px);
          }
          57.15% {
            opacity: 0;
            transform: translateY(15px) scale(0.5);
            filter: blur(8px);
          }
          62% {
            opacity: 0.5;
            transform: translateY(8px) scale(0.8);
            filter: blur(4px);
          }
          64% {
            opacity: 0.95;
            transform: translateY(0) scale(1);
            filter: blur(0px);
          }
          91% {
            opacity: 0.95;
            transform: translateY(0) scale(1);
            filter: blur(0px);
          }
          94% {
            opacity: 0.7;
            transform: translateY(-5px) scale(0.95);
            filter: blur(2px);
          }
          100% {
            opacity: 0;
            transform: translateY(-15px) scale(0.5);
            filter: blur(8px);
          }
        }

        /* Sub text shadow */
        @keyframes driftpro-company-name-sub-shadow-fade {
          0%, 57.14% {
            opacity: 0;
            transform: translateY(12px) translateX(1px);
          }
          57.15% {
            opacity: 0;
            transform: translateY(12px) translateX(1px);
          }
          64% {
            opacity: 0.2;
            transform: translateY(2px) translateX(1px);
          }
          91% {
            opacity: 0.2;
            transform: translateY(2px) translateX(1px);
          }
          100% {
            opacity: 0;
            transform: translateY(-12px) translateX(1px);
          }
        }

        /* Advanced decoration animations */
        @keyframes driftpro-name-decoration-expand-left {
          0%, 57.14% {
            opacity: 0;
            transform: translateX(-20px) scaleX(0);
          }
          57.15% {
            opacity: 0;
            transform: translateX(-20px) scaleX(0);
          }
          61% {
            opacity: 0.6;
            transform: translateX(0) scaleX(1);
          }
          93% {
            opacity: 0.6;
            transform: translateX(0) scaleX(1);
          }
          100% {
            opacity: 0;
            transform: translateX(-20px) scaleX(0);
          }
        }

        @keyframes driftpro-name-decoration-expand-right {
          0%, 57.14% {
            opacity: 0;
            transform: translateX(20px) scaleX(0);
          }
          57.15% {
            opacity: 0;
            transform: translateX(20px) scaleX(0);
          }
          61% {
            opacity: 0.6;
            transform: translateX(0) scaleX(1);
          }
          93% {
            opacity: 0.6;
            transform: translateX(0) scaleX(1);
          }
          100% {
            opacity: 0;
            transform: translateX(20px) scaleX(0);
          }
        }

        @keyframes driftpro-name-decoration-secondary {
          0%, 57.14% {
            opacity: 0;
            transform: scaleX(0);
          }
          57.15% {
            opacity: 0;
            transform: scaleX(0);
          }
          63% {
            opacity: 0.4;
            transform: scaleX(1);
          }
          92% {
            opacity: 0.4;
            transform: scaleX(1);
          }
          100% {
            opacity: 0;
            transform: scaleX(0);
          }
        }

        @keyframes driftpro-name-dot-pulse {
          0%, 57.14% {
            opacity: 0;
            transform: scale(0);
          }
          57.15% {
            opacity: 0;
            transform: scale(0);
          }
          62% {
            opacity: 0.5;
            transform: scale(1.5);
          }
          64% {
            opacity: 0.5;
            transform: scale(1);
          }
          93% {
            opacity: 0.5;
            transform: scale(1);
          }
          100% {
            opacity: 0;
            transform: scale(0);
          }
        }

        /* Advanced glow particles */
        @keyframes driftpro-name-glow-particle-pulse {
          0%, 57.14% {
            opacity: 0;
            transform: scale(0) rotate(0deg);
          }
          57.15% {
            opacity: 0;
            transform: scale(0) rotate(0deg);
          }
          60% {
            opacity: 0.7;
            transform: scale(1.2) rotate(180deg);
          }
          93% {
            opacity: 0.7;
            transform: scale(1.2) rotate(180deg);
          }
          100% {
            opacity: 0;
            transform: scale(0) rotate(360deg);
          }
        }

        @keyframes driftpro-name-glow-particle-outer-pulse {
          0%, 57.14% {
            opacity: 0;
            transform: scale(0);
          }
          57.15% {
            opacity: 0;
            transform: scale(0);
          }
          60% {
            opacity: 0.4;
            transform: scale(1.5);
          }
          93% {
            opacity: 0.4;
            transform: scale(1.5);
          }
          100% {
            opacity: 0;
            transform: scale(0);
          }
        }

        /* Energy waves */
        @keyframes driftpro-name-energy-wave-expand {
          0%, 57.14% {
            opacity: 0;
            transform: scale(0.8);
          }
          57.15% {
            opacity: 0;
            transform: scale(0.8);
          }
          60% {
            opacity: 0.2;
            transform: scale(1);
          }
          93% {
            opacity: 0.2;
            transform: scale(1);
          }
          100% {
            opacity: 0;
            transform: scale(1.2);
          }
        }

        /* Apply main rotation - smooth continuous */
        .driftpro-rotating-logo-container {
          animation: driftpro-logo-rotate 15s linear infinite;
          transform-origin: 32px 32px;
        }

        /* Energy field */
        .driftpro-energy-field {
          animation: driftpro-energy-field-pulse 4s ease-in-out infinite;
          transform-origin: 32px 32px;
        }

        /* Apply company name overlay */
        .driftpro-company-name-overlay {
          animation: driftpro-company-name-show 7s ease-in-out infinite;
          transform-origin: 32px 32px;
          transform-style: preserve-3d;
        }

        /* Background layers */
        .driftpro-name-background-base {
          animation: driftpro-name-background-base-fade 7s ease-in-out infinite;
        }

        .driftpro-name-background-radial {
          animation: driftpro-name-background-radial-pulse 7s ease-in-out infinite;
          transform-origin: 32px 32px;
        }

        /* Pattern overlay */
        .driftpro-name-pattern-1 {
          animation: driftpro-name-pattern-rotate 7s linear infinite;
          transform-origin: 32px 32px;
        }

        .driftpro-name-pattern-2 {
          animation: driftpro-name-pattern-rotate 7s linear infinite reverse;
          transform-origin: 32px 32px;
        }

        /* Glow rings */
        .driftpro-name-glow-ring-1 {
          animation: driftpro-name-glow-ring-pulse 7s ease-in-out infinite;
          transform-origin: 32px 32px;
        }

        .driftpro-name-glow-ring-2 {
          animation: driftpro-name-glow-ring-pulse 7s ease-in-out infinite;
          animation-delay: 0.15s;
          transform-origin: 32px 32px;
        }

        .driftpro-name-glow-ring-3 {
          animation: driftpro-name-glow-ring-pulse 7s ease-in-out infinite;
          animation-delay: 0.3s;
          transform-origin: 32px 32px;
        }

        /* Corner accents */
        @keyframes driftpro-corner-accent-fade {
          0%, 57.14% {
            opacity: 0;
            transform: scale(0);
          }
          57.15% {
            opacity: 0;
            transform: scale(0);
          }
          61% {
            opacity: 0.3;
            transform: scale(1);
          }
          93% {
            opacity: 0.3;
            transform: scale(1);
          }
          100% {
            opacity: 0;
            transform: scale(0);
          }
        }

        .driftpro-corner-top-left-1,
        .driftpro-corner-top-left-2,
        .driftpro-corner-top-right-1,
        .driftpro-corner-top-right-2,
        .driftpro-corner-bottom-left-1,
        .driftpro-corner-bottom-left-2,
        .driftpro-corner-bottom-right-1,
        .driftpro-corner-bottom-right-2 {
          animation: driftpro-corner-accent-fade 7s ease-in-out infinite;
        }

        .driftpro-corner-top-left-2 { animation-delay: 0.1s; }
        .driftpro-corner-top-right-1 { animation-delay: 0.05s; }
        .driftpro-corner-top-right-2 { animation-delay: 0.15s; }
        .driftpro-corner-bottom-left-1 { animation-delay: 0.1s; }
        .driftpro-corner-bottom-left-2 { animation-delay: 0.2s; }
        .driftpro-corner-bottom-right-1 { animation-delay: 0.15s; }
        .driftpro-corner-bottom-right-2 { animation-delay: 0.25s; }

        /* Shimmer effects */
        .driftpro-name-shimmer-1 {
          animation: driftpro-name-shimmer 7s ease-in-out infinite;
          transform-origin: 0 0;
        }

        .driftpro-name-shimmer-2 {
          animation: driftpro-name-shimmer 7s ease-in-out infinite;
          animation-delay: 0.5s;
          transform-origin: 64px 64px;
        }

        /* Light rays */
        @keyframes driftpro-light-ray-pulse {
          0%, 57.14% {
            opacity: 0;
            transform: scale(0.5);
          }
          57.15% {
            opacity: 0;
            transform: scale(0.5);
          }
          61% {
            opacity: 0.2;
            transform: scale(1);
          }
          93% {
            opacity: 0.2;
            transform: scale(1);
          }
          100% {
            opacity: 0;
            transform: scale(0.5);
          }
        }

        .driftpro-light-ray {
          animation: driftpro-light-ray-pulse 7s ease-in-out infinite;
          transform-origin: 32px 32px;
        }

        /* Main text group */
        .driftpro-main-text-group {
          transform-origin: 32px 26px;
        }

        .driftpro-main-text-shadow-1 {
          animation: driftpro-main-text-shadow-fade 7s ease-in-out infinite;
          transform: translateX(1px) translateY(1px);
        }

        .driftpro-main-text-shadow-2 {
          animation: driftpro-main-text-shadow-fade 7s ease-in-out infinite;
          transform: translateX(-1px) translateY(-1px);
          animation-delay: 0.05s;
        }

        .driftpro-main-text {
          animation: driftpro-main-text-fade 7s ease-in-out infinite;
        }

        .driftpro-main-text-highlight {
          animation: driftpro-main-text-highlight 7s ease-in-out infinite;
        }

        /* Sub company name group */
        .driftpro-company-name-sub-group {
          transform-origin: 32px 38px;
        }

        .driftpro-company-name-sub-shadow-1 {
          animation: driftpro-company-name-sub-shadow-fade 7s ease-in-out infinite;
          transform: translateX(0.5px) translateY(0.5px);
        }

        .driftpro-company-name-sub-shadow-2 {
          animation: driftpro-company-name-sub-shadow-fade 7s ease-in-out infinite;
          transform: translateX(-0.5px) translateY(-0.5px);
          animation-delay: 0.05s;
        }

        .driftpro-company-name-sub {
          animation: driftpro-company-name-sub-fade 7s ease-in-out infinite;
        }

        .driftpro-company-name-sub-highlight {
          animation: driftpro-letter-mavi-highlight 7s ease-in-out infinite;
          animation-delay: 0.1s;
        }

        /* Decorative elements */
        .driftpro-name-decoration-left-1 {
          transform-origin: 14px 32px;
          animation: driftpro-name-decoration-expand-left 7s ease-in-out infinite;
        }

        .driftpro-name-decoration-left-2,
        .driftpro-name-decoration-left-3 {
          transform-origin: 14px center;
          animation: driftpro-name-decoration-secondary 7s ease-in-out infinite;
        }

        .driftpro-name-decoration-left-2 {
          animation-delay: 0.1s;
        }

        .driftpro-name-decoration-left-3 {
          animation-delay: 0.15s;
        }

        .driftpro-name-decoration-right-1 {
          transform-origin: 50px 32px;
          animation: driftpro-name-decoration-expand-right 7s ease-in-out infinite;
        }

        .driftpro-name-decoration-right-2,
        .driftpro-name-decoration-right-3 {
          transform-origin: 50px center;
          animation: driftpro-name-decoration-secondary 7s ease-in-out infinite;
        }

        .driftpro-name-decoration-right-2 {
          animation-delay: 0.1s;
        }

        .driftpro-name-decoration-right-3 {
          animation-delay: 0.15s;
        }

        .driftpro-name-dot-left,
        .driftpro-name-dot-right {
          animation: driftpro-name-dot-pulse 7s ease-in-out infinite;
        }

        .driftpro-name-dot-right {
          animation-delay: 0.05s;
        }

        /* Glow particles */
        .driftpro-name-glow-particle-outer {
          animation: driftpro-name-glow-particle-outer-pulse 7s ease-in-out infinite;
        }

        .driftpro-name-glow-particle {
          animation: driftpro-name-glow-particle-pulse 7s ease-in-out infinite;
        }

        /* Energy waves */
        .driftpro-name-energy-wave-1 {
          animation: driftpro-name-energy-wave-expand 7s ease-in-out infinite;
          transform-origin: 32px 32px;
        }

        .driftpro-name-energy-wave-2 {
          animation: driftpro-name-energy-wave-expand 7s ease-in-out infinite;
          animation-delay: 0.2s;
          transform-origin: 32px 32px;
        }
        
        /* Growth rings - showing expansion and growth potential */
        @keyframes driftpro-growth-ring-expand {
          0% {
            transform: scale(1);
            opacity: 0.3;
          }
          33% {
            transform: scale(1.08);
            opacity: 0.5;
          }
          66% {
            transform: scale(1.15);
            opacity: 0.3;
          }
          100% {
            transform: scale(1.25);
            opacity: 0;
          }
        }

        /* Energy field pulse */
        @keyframes driftpro-energy-field-pulse {
          0%, 100% {
            opacity: 0.15;
            transform: scale(1);
          }
          50% {
            opacity: 0.3;
            transform: scale(1.05);
          }
        }

        /* Command hub - sophisticated animations */
        @keyframes driftpro-hub-energy-ring-rotate {
          from {
            transform: rotate(0deg);
            stroke-dashoffset: 0;
          }
          to {
            transform: rotate(360deg);
            stroke-dashoffset: -20;
          }
        }

        @keyframes driftpro-hub-glow-pulse {
          0%, 100% {
            opacity: 0.3;
            transform: scale(1);
          }
          50% {
            opacity: 0.5;
            transform: scale(1.08);
          }
        }

        @keyframes driftpro-hub-main-pulse {
          0%, 100% {
            transform: scale(1);
            opacity: 0.95;
            filter: drop-shadow(0 0 6px rgba(255, 255, 255, 0.4));
          }
          50% {
            transform: scale(1.06);
            opacity: 1;
            filter: drop-shadow(0 0 10px rgba(255, 255, 255, 0.6));
          }
        }

        @keyframes driftpro-hub-core-pulse {
          0%, 100% {
            transform: scale(1);
            opacity: 1;
          }
          50% {
            transform: scale(1.15);
            opacity: 0.95;
          }
        }

        @keyframes driftpro-hub-pulse-indicator {
          0%, 100% {
            transform: scale(1);
            opacity: 0.95;
          }
          50% {
            transform: scale(1.2);
            opacity: 0.85;
          }
        }

        @keyframes driftpro-hub-rotating-particle-orbit {
          from {
            transform: rotate(0deg) translateX(5px) rotate(0deg);
            opacity: 0.7;
          }
          50% {
            opacity: 1;
          }
          to {
            transform: rotate(360deg) translateX(5px) rotate(-360deg);
            opacity: 0.7;
          }
        }

        /* Department nodes - sophisticated animations */
        @keyframes driftpro-dept-glow-pulse {
          0%, 100% {
            opacity: 0.15;
            transform: scale(1);
          }
          50% {
            opacity: 0.3;
            transform: scale(1.15);
          }
        }

        @keyframes driftpro-dept-circle-pulse {
          0%, 100% {
            transform: scale(1);
            opacity: 0.9;
            filter: drop-shadow(0 0 3px rgba(255, 255, 255, 0.4));
          }
          50% {
            transform: scale(1.2);
            opacity: 1;
            filter: drop-shadow(0 0 6px rgba(255, 255, 255, 0.6));
          }
        }

        @keyframes driftpro-dept-core-pulse {
          0%, 100% {
            transform: scale(1);
            opacity: 1;
          }
          50% {
            transform: scale(1.3);
            opacity: 0.9;
          }
        }

        /* Connection lines - sophisticated flow animation */
        @keyframes driftpro-dept-connection-flow {
          0% {
            stroke-dashoffset: 0;
            opacity: 0.15;
          }
          50% {
            stroke-dashoffset: -8;
            opacity: 0.3;
          }
          100% {
            stroke-dashoffset: -16;
            opacity: 0.15;
          }
        }

        /* Data flow particles - elegant movement along connections */
        @keyframes driftpro-data-flow-particle-move {
          0% {
            transform: translate(0, 0) scale(1);
            opacity: 0.7;
          }
          20% {
            transform: translate(calc(cos(var(--angle, 0) * 3.14159 / 180) * -3px), calc(sin(var(--angle, 0) * 3.14159 / 180) * -3px)) scale(1.05);
            opacity: 0.85;
          }
          40% {
            transform: translate(calc(cos(var(--angle, 0) * 3.14159 / 180) * -6px), calc(sin(var(--angle, 0) * 3.14159 / 180) * -6px)) scale(1.1);
            opacity: 0.95;
          }
          60% {
            transform: translate(calc(cos(var(--angle, 0) * 3.14159 / 180) * -9px), calc(sin(var(--angle, 0) * 3.14159 / 180) * -9px)) scale(1.15);
            opacity: 1;
          }
          80% {
            transform: translate(calc(cos(var(--angle, 0) * 3.14159 / 180) * -12px), calc(sin(var(--angle, 0) * 3.14159 / 180) * -12px)) scale(1.1);
            opacity: 0.9;
          }
          100% {
            transform: translate(calc(cos(var(--angle, 0) * 3.14159 / 180) * -17px), calc(sin(var(--angle, 0) * 3.14159 / 180) * -17px)) scale(0.9);
            opacity: 0.6;
          }
        }

        /* Circular flow - continuous operations */
        @keyframes driftpro-circular-flow-rotate {
          from {
            stroke-dashoffset: 0;
            transform: rotate(0deg);
          }
          to {
            stroke-dashoffset: -20;
            transform: rotate(360deg);
          }
        }

        /* Activity indicators - showing real-time activity */
        @keyframes driftpro-activity-indicator-pulse {
          0%, 100% {
            opacity: 0.5;
            transform: scale(1);
          }
          50% {
            opacity: 1;
            transform: scale(2);
          }
        }

        /* Activity core pulse */
        @keyframes driftpro-activity-core-pulse {
          0%, 100% {
            opacity: 0.8;
            transform: scale(1);
          }
          50% {
            opacity: 1;
            transform: scale(1.5);
          }
        }

        /* Growth particles - showing expansion potential */
        @keyframes driftpro-growth-particle-expand {
          0% {
            transform: translate(0, 0) scale(1);
            opacity: 0.4;
          }
          33% {
            transform: translate(calc(cos(var(--angle, 0) * 3.14159 / 180) * 3px), calc(sin(var(--angle, 0) * 3.14159 / 180) * 3px)) scale(1.3);
            opacity: 0.7;
          }
          66% {
            transform: translate(calc(cos(var(--angle, 0) * 3.14159 / 180) * 6px), calc(sin(var(--angle, 0) * 3.14159 / 180) * 6px)) scale(1.8);
            opacity: 0.5;
          }
          100% {
            transform: translate(calc(cos(var(--angle, 0) * 3.14159 / 180) * 10px), calc(sin(var(--angle, 0) * 3.14159 / 180) * 10px)) scale(2.5);
            opacity: 0;
          }
        }

        /* Growth core pulse */
        @keyframes driftpro-growth-core-pulse {
          0%, 100% {
            opacity: 0.7;
            transform: scale(1);
          }
          50% {
            opacity: 1;
            transform: scale(1.4);
          }
        }

        /* Speed particles - fast processing */
        @keyframes driftpro-speed-particle-orbit {
          from {
            transform: rotate(0deg) translateX(19px) rotate(0deg);
            opacity: 0.5;
          }
          50% {
            opacity: 0.9;
          }
          to {
            transform: rotate(360deg) translateX(19px) rotate(-360deg);
            opacity: 0.5;
          }
        }

        /* Energy sparks */
        @keyframes driftpro-energy-spark-pulse {
          0%, 100% {
            opacity: 0.7;
            transform: scale(1);
          }
          25% {
            opacity: 1;
            transform: scale(1.3);
          }
          50% {
            opacity: 0.9;
            transform: scale(1.1);
          }
          75% {
            opacity: 1;
            transform: scale(1.4);
          }
        }

        @keyframes driftpro-spark-core-pulse {
          0%, 100% {
            opacity: 0.9;
            transform: scale(1);
          }
          50% {
            opacity: 1;
            transform: scale(1.5);
          }
        }

        /* Efficiency waves - showing optimization */
        @keyframes driftpro-wave-pulse {
          0%, 100% {
            opacity: 0.15;
            transform: scale(1);
          }
          50% {
            opacity: 0.3;
            transform: scale(1.1);
          }
        }

        /* Hub animations */
        .driftpro-hub-energy-ring {
          animation: driftpro-hub-energy-ring-rotate 10s linear infinite;
          transform-origin: 32px 32px;
        }

        .driftpro-hub-glow {
          animation: driftpro-hub-glow-pulse 3s ease-in-out infinite;
          transform-origin: 32px 32px;
        }

        .driftpro-hub-main {
          animation: driftpro-hub-main-pulse 2.5s ease-in-out infinite;
          transform-origin: 32px 32px;
        }

        .driftpro-hub-core {
          animation: driftpro-hub-core-pulse 2s ease-in-out infinite;
          transform-origin: 32px 32px;
        }

        .driftpro-hub-pulse {
          animation: driftpro-hub-pulse-indicator 1.8s ease-in-out infinite;
          transform-origin: 32px 32px;
        }

        .driftpro-hub-rotating-particle {
          animation: driftpro-hub-rotating-particle-orbit 6s linear infinite;
          transform-origin: 32px 32px;
        }

        /* Department node animations */
        .driftpro-dept-glow {
          animation: driftpro-dept-glow-pulse 2.5s ease-in-out infinite;
        }

        .driftpro-dept-circle {
          animation: driftpro-dept-circle-pulse 2.3s ease-in-out infinite;
        }

        .driftpro-dept-core {
          animation: driftpro-dept-core-pulse 2s ease-in-out infinite;
        }

        .driftpro-dept-connection {
          animation: driftpro-dept-connection-flow 3s linear infinite;
        }

        .driftpro-data-flow-particle {
          animation: driftpro-data-flow-particle-move 2.5s ease-in-out infinite;
        }

        /* Circular flow */
        .driftpro-circular-flow {
          animation: driftpro-circular-flow-rotate 10s linear infinite;
          transform-origin: 32px 32px;
        }

        /* Wave */
        @keyframes driftpro-wave-pulse {
          0%, 100% {
            opacity: 0.1;
            transform: scale(1);
          }
          50% {
            opacity: 0.2;
            transform: scale(1.05);
          }
        }

        .driftpro-wave {
          animation: driftpro-wave-pulse 4s ease-in-out infinite;
          transform-origin: 32px 32px;
        }

        .animated-logo-container {
          /* Container stays still, only inner elements animate */
        }

        button:hover .button-shine {
          opacity: 0.3 !important;
        }

        button:hover .button-glow {
          opacity: 0.5 !important;
        }

        button:hover .arrow-icon {
          transform: translateX(4px) !important;
          }
        `}</style>
    </div>
  );
}
