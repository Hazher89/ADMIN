'use client';

import React from 'react';

interface DriftProLogoProps {
  size?: number;
  variant?: 'full' | 'icon' | 'text';
  className?: string;
  showText?: boolean;
}

export default function DriftProLogo({ 
  size = 48, 
  variant = 'full',
  className = '',
  showText = true 
}: DriftProLogoProps) {
  const iconSize = size;
  const textSize = size * 0.6;

  if (variant === 'icon') {
    return (
      <div className={`inline-flex items-center justify-center ${className}`}>
        <svg
          width={iconSize}
          height={iconSize}
          viewBox="0 0 64 64"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="driftpro-logo-icon"
        >
          {/* Outer rounded square with gradient */}
          <defs>
            <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#22d3ee" />
              <stop offset="50%" stopColor="#0ea5e9" />
              <stop offset="100%" stopColor="#06b6d4" />
            </linearGradient>
            <linearGradient id="logoGradientDark" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#06b6d4" />
              <stop offset="50%" stopColor="#0891b2" />
              <stop offset="100%" stopColor="#0ea5e9" />
            </linearGradient>
          </defs>
          
          {/* Rounded square background */}
          <rect
            x="4"
            y="4"
            width="56"
            height="56"
            rx="12"
            ry="12"
            fill="url(#logoGradient)"
            className="dark:fill-[url(#logoGradientDark)]"
          />
          
          {/* Inner operations gear - Modern design */}
          <circle cx="32" cy="32" r="18" fill="white" opacity="0.95" />
          
          {/* Gear center */}
          <circle cx="32" cy="32" r="8" fill="url(#logoGradient)" />
          
          {/* Gear teeth - 8 directional points */}
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
                stroke="url(#logoGradient)"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            );
          })}
          
          {/* Operations flow line - horizontal */}
          <line
            x1="8"
            y1="32"
            x2="24"
            y2="32"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            opacity="0.8"
          />
          <line
            x1="40"
            y1="32"
            x2="56"
            y2="32"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            opacity="0.8"
          />
        </svg>
      </div>
    );
  }

  if (variant === 'text') {
    return (
      <div className={`inline-flex items-center ${className}`}>
        <span
          className="font-bold tracking-tight"
          style={{
            fontSize: `${textSize}px`,
            background: 'var(--gradient-primary)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          DriftPro
        </span>
      </div>
    );
  }

  // Full logo (icon + text)
  return (
    <div className={`inline-flex items-center gap-3 ${className}`}>
      <svg
        width={iconSize}
        height={iconSize}
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="driftpro-logo-icon"
      >
        <defs>
          <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#22d3ee" />
            <stop offset="50%" stopColor="#0ea5e9" />
            <stop offset="100%" stopColor="#06b6d4" />
          </linearGradient>
          <linearGradient id="logoGradientDark" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#06b6d4" />
            <stop offset="50%" stopColor="#0891b2" />
            <stop offset="100%" stopColor="#0ea5e9" />
          </linearGradient>
        </defs>
        
        <rect
          x="4"
          y="4"
          width="56"
          height="56"
          rx="12"
          ry="12"
          fill="url(#logoGradient)"
          className="dark:fill-[url(#logoGradientDark)]"
        />
        
        <circle cx="32" cy="32" r="18" fill="white" opacity="0.95" />
        <circle cx="32" cy="32" r="8" fill="url(#logoGradient)" />
        
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
              stroke="url(#logoGradient)"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
          );
        })}
        
        <line
          x1="8"
          y1="32"
          x2="24"
          y2="32"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
          opacity="0.8"
        />
        <line
          x1="40"
          y1="32"
          x2="56"
          y2="32"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
          opacity="0.8"
        />
      </svg>
      
      {showText && (
        <span
          className="font-bold tracking-tight"
          style={{
            fontSize: `${textSize}px`,
            background: 'var(--gradient-primary)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          DriftPro
        </span>
      )}
    </div>
  );
}

