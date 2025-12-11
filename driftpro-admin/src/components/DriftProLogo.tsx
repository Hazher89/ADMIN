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
      <div className={`inline-flex items-center justify-center relative ${className}`}>
        <svg
          width={iconSize}
          height={iconSize}
          viewBox="0 0 64 64"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="driftpro-logo-icon"
          style={{ width: `${iconSize}px`, height: `${iconSize}px`, maxWidth: 'none', maxHeight: 'none' }}
        >
          <defs>
            {/* Advanced gradients */}
            <linearGradient id="dp-primary" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#22d3ee" />
              <stop offset="50%" stopColor="#0ea5e9" />
              <stop offset="100%" stopColor="#06b6d4" />
            </linearGradient>
            <radialGradient id="dp-glow" cx="50%" cy="50%">
              <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#06b6d4" stopOpacity="0" />
            </radialGradient>
            <filter id="dp-glow-filter">
              <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
            <filter id="dp-strong-glow">
              <feGaussianBlur stdDeviation="3.5" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>
          
          {/* Main container */}
          <g className="dp-logo-container">
            {/* Subtle background */}
            <circle cx="32" cy="32" r="28" fill="url(#dp-glow)" className="dp-bg" opacity="0.1" />
            
            {/* Central platform - modern geometric design */}
            <g className="dp-platform">
              {/* Ripple effects */}
              {[0, 1, 2].map((i) => (
                <circle
                  key={`ripple-${i}`}
                  cx="32"
                  cy="32"
                  r="14"
                  fill="none"
                  stroke="url(#dp-primary)"
                  strokeWidth="1"
                  strokeOpacity="0.1"
                  className="dp-ripple"
                  style={{ animationDelay: `${i * 0.4}s` }}
                />
              ))}
              
              {/* Outer rotating ring */}
              <circle
                cx="32"
                cy="32"
                r="12"
                fill="none"
                stroke="url(#dp-primary)"
                strokeWidth="1.5"
                strokeOpacity="0.3"
                strokeDasharray="3 4"
                className="dp-ring-outer"
              />
              
              {/* Middle ring */}
              <circle
                cx="32"
                cy="32"
                r="9"
                fill="none"
                stroke="url(#dp-primary)"
                strokeWidth="1"
                strokeOpacity="0.4"
                strokeDasharray="2 3"
                className="dp-ring-middle"
              />
              
              {/* Inner core */}
              <circle
                cx="32"
                cy="32"
                r="6"
                fill="white"
                opacity="0.95"
                className="dp-core-outer"
                filter="url(#dp-glow-filter)"
              />
              
              {/* Center gradient */}
              <circle
                cx="32"
                cy="32"
                r="4"
                fill="url(#dp-primary)"
                className="dp-core-inner"
                filter="url(#dp-strong-glow)"
              />
              
              {/* Center pulse */}
              <circle
                cx="32"
                cy="32"
                r="2"
                fill="white"
                opacity="0.95"
                className="dp-core-pulse"
              />
              
              {/* Energy bursts */}
              {[0, 120, 240].map((angle, i) => {
                const rad = (angle * Math.PI) / 180;
                return (
                  <g key={`burst-${i}`} className="dp-energy-burst">
                    <line
                      x1="32"
                      y1="32"
                      x2={32 + Math.cos(rad) * 8}
                      y2={32 + Math.sin(rad) * 8}
                      stroke="url(#dp-primary)"
                      strokeWidth="1.5"
                      strokeOpacity="0.4"
                      strokeLinecap="round"
                      className="dp-burst-line"
                      style={{ animationDelay: `${i * 0.33}s` }}
                    />
                    <circle
                      cx={32 + Math.cos(rad) * 8}
                      cy={32 + Math.sin(rad) * 8}
                      r="1"
                      fill="#22d3ee"
                      className="dp-burst-dot"
                      style={{ animationDelay: `${i * 0.33}s` }}
                      opacity="0.8"
                    />
                  </g>
                );
              })}
            </g>
            
            {/* Floating elements - representing connected systems */}
            {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => {
              const rad = (angle * Math.PI) / 180;
              const radius = 20;
              const x = 32 + Math.cos(rad) * radius;
              const y = 32 + Math.sin(rad) * radius;
              
              return (
                <g key={`element-${i}`} className="dp-floating-element">
                  {/* Connection line */}
                  <line
                    x1="32"
                    y1="32"
                    x2={x}
                    y2={y}
                    stroke="url(#dp-primary)"
                    strokeWidth="0.6"
                    strokeOpacity="0.15"
                    strokeDasharray="1 3"
                    className="dp-element-connection"
                    style={{ animationDelay: `${i * 0.1}s` }}
                  />
                  
                  {/* Data particles moving along connection */}
                  {[0, 1].map((p) => (
                    <circle
                      key={`particle-${p}`}
                      cx={x}
                      cy={y}
                      r="0.4"
                      fill="#22d3ee"
                      className="dp-data-particle"
                      style={{ 
                        animationDelay: `${i * 0.1 + p * 0.5}s`,
                        '--angle': `${angle}deg`
                      } as React.CSSProperties}
                      opacity="0.9"
                    />
                  ))}
                  
                  {/* Element glow */}
                  <circle
                    cx={x}
                    cy={y}
                    r="2.5"
                    fill="url(#dp-glow)"
                    className="dp-element-glow"
                    style={{ animationDelay: `${i * 0.1}s` }}
                    opacity="0.2"
                  />
                  
                  {/* Element dot */}
                  <circle
                    cx={x}
                    cy={y}
                    r="1.5"
                    fill="white"
                    opacity="0.9"
                    className="dp-element-dot"
                    style={{ animationDelay: `${i * 0.1}s` }}
                    filter="url(#dp-glow-filter)"
                  />
                  
                  {/* Element core */}
                  <circle
                    cx={x}
                    cy={y}
                    r="0.8"
                    fill="url(#dp-primary)"
                    className="dp-element-core"
                    style={{ animationDelay: `${i * 0.1}s` }}
                    filter="url(#dp-glow-filter)"
                  />
                  
                  {/* Rotating indicator */}
                  <circle
                    cx={x + Math.cos(rad) * 2.5}
                    cy={y + Math.sin(rad) * 2.5}
                    r="0.3"
                    fill="#22d3ee"
                    className="dp-element-indicator"
                    style={{ animationDelay: `${i * 0.1}s` }}
                    opacity="0.8"
                  />
                </g>
              );
            })}
            
            {/* Data flow paths - curved elegant lines */}
            {[22.5, 67.5, 112.5, 157.5, 202.5, 247.5, 292.5, 337.5].map((angle, i) => {
              const rad = (angle * Math.PI) / 180;
              const startRadius = 8;
              const midRadius = 16;
              const endRadius = 24;
              const x1 = 32 + Math.cos(rad) * startRadius;
              const y1 = 32 + Math.sin(rad) * startRadius;
              const x2 = 32 + Math.cos(rad) * midRadius;
              const y2 = 32 + Math.sin(rad) * midRadius;
              const x3 = 32 + Math.cos(rad) * endRadius;
              const y3 = 32 + Math.sin(rad) * endRadius;
              
              return (
                <g key={`flow-${i}`}>
                  <path
                    d={`M ${x1},${y1} Q ${x2},${y2} ${x3},${y3}`}
                    fill="none"
                    stroke="url(#dp-primary)"
                    strokeWidth="0.6"
                    strokeOpacity="0.2"
                    className="dp-flow-path"
                    style={{ animationDelay: `${i * 0.08}s` }}
                  />
                  {/* Flow particles */}
                  {[0, 1, 2].map((p) => (
                    <circle
                      key={`flow-particle-${p}`}
                      cx={x1}
                      cy={y1}
                      r="0.35"
                      fill="#22d3ee"
                      className="dp-flow-particle"
                      style={{ 
                        animationDelay: `${i * 0.08 + p * 0.4}s`,
                        '--flow-angle': `${angle}deg`
                      } as React.CSSProperties}
                      opacity="0.8"
                    />
                  ))}
                </g>
              );
            })}
            
            {/* Rotating sparkles around core */}
            {[0, 72, 144, 216, 288].map((angle, i) => {
              const rad = (angle * Math.PI) / 180;
              const radius = 7;
              const x = 32 + Math.cos(rad) * radius;
              const y = 32 + Math.sin(rad) * radius;
              
              return (
                <circle
                  key={`sparkle-${i}`}
                  cx={x}
                  cy={y}
                  r="0.5"
                  fill="#22d3ee"
                  className="dp-sparkle"
                  style={{ animationDelay: `${i * 0.2}s` }}
                  opacity="0.9"
                />
              );
            })}
          </g>
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
        style={{ width: `${iconSize}px`, height: `${iconSize}px`, maxWidth: 'none', maxHeight: 'none' }}
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
