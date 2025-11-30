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
        minHeight: '100vh',
        width: '100%',
        display: 'flex',
        alignItems: isMobile ? 'flex-start' : 'center',
        justifyContent: 'center',
        background: 'var(--background-color)',
        color: 'var(--text-color)',
        padding: isMobile ? '1rem 0.75rem' : '1rem',
        paddingTop: isMobile ? '2rem' : '1rem',
        paddingBottom: isMobile ? '2rem' : '1rem',
        overflowY: 'auto',
        overflowX: 'hidden',
        WebkitOverflowScrolling: 'touch',
        position: 'relative'
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

      {/* Main Content - Mobile Optimized */}
      <div 
        style={{
          position: 'relative',
          zIndex: 10,
          width: '100%',
          maxWidth: isMobile ? '100%' : '520px',
          margin: 'auto',
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'center',
          paddingTop: isMobile ? '0' : '0'
        }}
      >
        <div 
          style={{
            width: '100%',
            position: 'relative',
            background: 'var(--card-background)',
            backdropFilter: 'blur(20px) saturate(180%)',
            WebkitBackdropFilter: 'blur(20px) saturate(180%)',
            borderRadius: isMobile ? 'var(--radius-xl)' : 'var(--radius-2xl)',
            padding: isMobile ? '1.5rem 1rem' : '2rem 2rem',
            boxShadow: 'var(--shadow-xl), 0 0 0 1px var(--border-color)',
            border: '1px solid var(--border-color)',
            overflow: 'hidden'
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
          <div style={{ textAlign: 'center', marginBottom: isMobile ? '1rem' : '1.5rem', position: 'relative', zIndex: 10 }}>
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
              
              {/* Logo container with border glow */}
              <div 
                style={{
                  position: 'relative',
                  zIndex: 10,
                  padding: '0.25rem',
                  borderRadius: isMobile ? 'var(--radius-lg)' : 'var(--radius-xl)',
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
                  width: isMobile ? '140px' : '220px',
                  height: isMobile ? '140px' : '220px',
                  overflow: 'hidden',
                  margin: '0 auto'
                }}
              >
                {/* Advanced Animated Icon */}
                <svg
                  viewBox="0 0 64 64"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  style={{
                    width: '100%',
                    height: '100%',
                    filter: 'drop-shadow(0 0 20px rgba(6, 182, 212, 0.5))'
                  }}
                >
                  <defs>
                    <linearGradient id="iconGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#22d3ee" />
                      <stop offset="50%" stopColor="#0ea5e9" />
                      <stop offset="100%" stopColor="#06b6d4" />
                    </linearGradient>
                    <linearGradient id="innerGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#06b6d4" />
                      <stop offset="100%" stopColor="#0891b2" />
                    </linearGradient>
                  </defs>
                  
                  {/* Outer rotating ring */}
                  <circle
                    cx="32"
                    cy="32"
                    r="28"
                    fill="none"
                    stroke="url(#iconGradient)"
                    strokeWidth="1.5"
                    strokeDasharray="4 4"
                    opacity="0.6"
                    style={{
                      animation: 'rotate-ring 8s linear infinite',
                      transformOrigin: '32px 32px'
                    }}
                  />
                  
                  {/* Middle rotating ring - reverse */}
                  <circle
                    cx="32"
                    cy="32"
                    r="24"
                    fill="none"
                    stroke="url(#iconGradient)"
                    strokeWidth="1"
                    strokeDasharray="3 3"
                    opacity="0.4"
                    style={{
                      animation: 'rotate-ring-reverse 6s linear infinite',
                      transformOrigin: '32px 32px'
                    }}
                  />
                  
                  {/* Rounded square background with pulse */}
                  <rect
                    x="8"
                    y="8"
                    width="48"
                    height="48"
                    rx="12"
                    ry="12"
                    fill="url(#iconGradient)"
                    opacity="0.95"
                    style={{
                      animation: 'pulse-icon 3s ease-in-out infinite'
                    }}
                  />
                  
                  {/* Inner operations gear - rotating */}
                  <g style={{
                    animation: 'rotate-gear 10s linear infinite',
                    transformOrigin: '32px 32px'
                  }}>
                    <circle cx="32" cy="32" r="18" fill="white" opacity="0.95" />
                    <circle cx="32" cy="32" r="8" fill="url(#innerGradient)" />
                    
                    {/* Gear teeth - 8 directional points with animation */}
                    {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => {
                      const rad = (angle * Math.PI) / 180;
                      const x1 = 32 + Math.cos(rad) * 14;
                      const y1 = 32 + Math.sin(rad) * 14;
                      const x2 = 32 + Math.cos(rad) * 18;
                      const y2 = 32 + Math.sin(rad) * 18;
                      
                      return (
                        <line
                          key={i}
                          x1={x1}
                          y1={y1}
                          x2={x2}
                          y2={y2}
                          stroke="url(#iconGradient)"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          style={{
                            animation: `pulse-tooth 2s ease-in-out infinite`,
                            animationDelay: `${i * 0.1}s`
                          }}
                        />
                      );
                    })}
                  </g>
                  
                  {/* Operations flow lines - animated */}
                  <line
                    x1="4"
                    y1="32"
                    x2="20"
                    y2="32"
                    stroke="white"
                    strokeWidth="2"
                    strokeLinecap="round"
                    opacity="0.8"
                    style={{
                      animation: 'flow-line 2s ease-in-out infinite'
                    }}
                  />
                  <line
                    x1="44"
                    y1="32"
                    x2="60"
                    y2="32"
                    stroke="white"
                    strokeWidth="2"
                    strokeLinecap="round"
                    opacity="0.8"
                    style={{
                      animation: 'flow-line 2s ease-in-out infinite',
                      animationDelay: '0.5s'
                    }}
                  />
                  
                  {/* Floating particles */}
                  {[0, 60, 120, 180, 240, 300].map((angle, i) => {
                    const rad = (angle * Math.PI) / 180;
                    const radius = 26;
                    const x = 32 + Math.cos(rad) * radius;
                    const y = 32 + Math.sin(rad) * radius;
                    
                    return (
                      <circle
                        key={i}
                        cx={x}
                        cy={y}
                        r="1.5"
                        fill="url(#iconGradient)"
                        opacity="0.6"
                        style={{
                          animation: `float-particle 4s ease-in-out infinite`,
                          animationDelay: `${i * 0.3}s`
                        }}
                      />
                    );
                  })}
                </svg>
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
                fontSize: isMobile ? '1.875rem' : '2.5rem',
                fontWeight: 800,
                marginBottom: isMobile ? '0.5rem' : '0.75rem',
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
            <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? '0.375rem' : '0.5rem' }}>
              <p 
                style={{ 
                  fontSize: isMobile ? '0.625rem' : '0.7rem',
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
                  fontSize: isMobile ? '0.625rem' : '0.7rem',
                  fontWeight: 300,
                  textTransform: 'uppercase',
                  letterSpacing: '0.25em',
                  color: 'var(--gray-500)',
                  marginTop: isMobile ? '0.5rem' : '0.75rem'
                }}
              >
                Utviklet for
              </p>
              <p 
                style={{ 
                  fontSize: isMobile ? '0.875rem' : '1rem',
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
                    left: '1rem',
                    top: '50%',
                    transform: `translateY(-50%) ${focusedField === 'email' ? 'scale(1.1)' : 'scale(1)'}`,
                    transition: 'all 0.2s',
                    zIndex: 10,
                    color: focusedField === 'email' ? 'var(--primary)' : 'var(--gray-400)'
                  }}
                >
                  <Mail size={20} />
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
                    paddingLeft: '3rem',
                    paddingRight: '1rem',
                    paddingTop: isMobile ? '0.875rem' : '1rem',
                    paddingBottom: isMobile ? '0.875rem' : '1rem',
                    borderRadius: isMobile ? 'var(--radius-lg)' : 'var(--radius-xl)',
                    transition: 'all 0.2s',
                    outline: 'none',
                    fontSize: isMobile ? '16px' : '0.9375rem',
                    background: 'var(--gray-200)',
                    border: `2px solid ${focusedField === 'email' ? 'var(--primary)' : 'var(--border-color)'}`,
                    color: 'var(--text-color)',
                    boxShadow: focusedField === 'email' 
                      ? '0 0 0 4px rgba(6, 182, 212, 0.1), 0 4px 12px rgba(6, 182, 212, 0.1)' 
                      : '0 2px 4px rgba(0, 0, 0, 0.05)',
                    transform: focusedField === 'email' ? 'translateY(-2px)' : 'translateY(0)'
                  }}
                  placeholder="navn@bedrift.no"
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
                    left: '1rem',
                    top: '50%',
                    transform: `translateY(-50%) ${focusedField === 'password' ? 'scale(1.1)' : 'scale(1)'}`,
                    transition: 'all 0.2s',
                    zIndex: 10,
                    color: focusedField === 'password' ? 'var(--primary)' : 'var(--gray-400)'
                  }}
                >
                  <Lock size={20} />
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
                    paddingLeft: '3rem',
                    paddingRight: '3rem',
                    paddingTop: isMobile ? '0.875rem' : '1rem',
                    paddingBottom: isMobile ? '0.875rem' : '1rem',
                    borderRadius: isMobile ? 'var(--radius-lg)' : 'var(--radius-xl)',
                    transition: 'all 0.2s',
                    outline: 'none',
                    fontSize: isMobile ? '16px' : '0.9375rem',
                    background: 'var(--gray-200)',
                    border: `2px solid ${focusedField === 'password' ? 'var(--primary)' : 'var(--border-color)'}`,
                    color: 'var(--text-color)',
                    boxShadow: focusedField === 'password' 
                      ? '0 0 0 4px rgba(6, 182, 212, 0.1), 0 4px 12px rgba(6, 182, 212, 0.1)' 
                      : '0 2px 4px rgba(0, 0, 0, 0.05)',
                    transform: focusedField === 'password' ? 'translateY(-2px)' : 'translateY(0)'
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
                    padding: '0.5rem',
                    transition: 'all 0.2s',
                    borderRadius: 'var(--radius-md)',
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--gray-400)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = 'var(--primary)';
                    e.currentTarget.style.background = 'rgba(6, 182, 212, 0.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = 'var(--gray-400)';
                    e.currentTarget.style.background = 'transparent';
                  }}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

            {/* Forgot Password */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '0.125rem' }}>
            <a 
              href="/forgot-password" 
                style={{
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  transition: 'color 0.2s',
                  color: 'var(--primary)',
                  textDecoration: 'none'
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

            {/* Submit Button - AVANSERT */}
          <button
            type="submit"
            disabled={loading}
            style={{
                width: '100%',
                paddingTop: isMobile ? '1rem' : '1.25rem',
                paddingBottom: isMobile ? '1rem' : '1.25rem',
                paddingLeft: '1.25rem',
                paddingRight: '1.25rem',
                borderRadius: isMobile ? 'var(--radius-lg)' : 'var(--radius-xl)',
                minHeight: isMobile ? '48px' : 'auto',
                color: '#ffffff',
                fontWeight: 700,
                fontSize: '1rem',
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
                border: 'none'
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

        @keyframes rotate-ring {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        @keyframes rotate-ring-reverse {
          from {
            transform: rotate(360deg);
          }
          to {
            transform: rotate(0deg);
          }
        }

        @keyframes rotate-gear {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        @keyframes pulse-icon {
          0%, 100% {
            opacity: 0.95;
            transform: scale(1);
          }
          50% {
            opacity: 1;
            transform: scale(1.02);
          }
        }

        @keyframes pulse-tooth {
          0%, 100% {
            opacity: 1;
            strokeWidth: 2.5;
          }
          50% {
            opacity: 0.7;
            strokeWidth: 3;
          }
        }

        @keyframes flow-line {
          0%, 100% {
            opacity: 0.6;
            strokeDasharray: 0 20;
          }
          50% {
            opacity: 1;
            strokeDasharray: 20 0;
          }
        }

        @keyframes float-particle {
          0%, 100% {
            transform: translate(0, 0) scale(1);
            opacity: 0.6;
          }
          50% {
            transform: translate(2px, -2px) scale(1.3);
            opacity: 1;
          }
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