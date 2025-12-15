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
          className="driftpro-logo-icon advanced-logo"
          style={{ width: `${iconSize}px`, height: `${iconSize}px`, maxWidth: 'none', maxHeight: 'none' }}
        >
          <defs>
            {/* Advanced Multi-Layer Gradients */}
            <linearGradient id="dp-primary" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#22d3ee" />
              <stop offset="50%" stopColor="#0ea5e9" />
              <stop offset="100%" stopColor="#06b6d4" />
            </linearGradient>
            
            <linearGradient id="dp-energy" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.9" />
              <stop offset="33%" stopColor="#0ea5e9" stopOpacity="0.8" />
              <stop offset="66%" stopColor="#06b6d4" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#22d3ee" stopOpacity="0.8" />
            </linearGradient>
            
            <radialGradient id="dp-core-glow" cx="50%" cy="50%">
              <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.6" />
              <stop offset="50%" stopColor="#0ea5e9" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#06b6d4" stopOpacity="0" />
            </radialGradient>
            
            <radialGradient id="dp-orbital-glow" cx="50%" cy="50%">
              <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#06b6d4" stopOpacity="0" />
            </radialGradient>
            
            <linearGradient id="dp-particle" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#22d3ee" stopOpacity="1" />
              <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.8" />
            </linearGradient>
            
            {/* Advanced Filters */}
            <filter id="dp-glow-filter">
              <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
            
            <filter id="dp-strong-glow">
              <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
            
            <filter id="dp-intense-glow">
              <feGaussianBlur stdDeviation="6" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
            
            <filter id="dp-quantum-blur">
              <feGaussianBlur stdDeviation="1.5" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>
          
          {/* Main Container */}
          <g className="advanced-logo-container">
            {/* Quantum Energy Field Background */}
            <circle cx="32" cy="32" r="30" fill="url(#dp-orbital-glow)" className="quantum-field" opacity="0.25" />
            
            {/* Outer Orbital Rings - Complex Elliptical Orbits - More rings */}
            {[0, 30, 60, 90, 120, 150].map((offset, i) => (
              <ellipse
                key={`outer-orbit-${i}`}
                cx="32"
                cy="32"
                rx={24 - i * 2}
                ry={18 - i * 1.5}
                fill="none"
                stroke="url(#dp-primary)"
                strokeWidth="1"
                strokeOpacity={0.35 - i * 0.02}
                strokeDasharray="2 4"
                className={`orbital-ring-${(i % 3) + 1}`}
                transform={`rotate(${offset} 32 32)`}
              />
            ))}
            
            {/* Additional Circular Rings */}
            {[26, 28].map((radius, i) => (
              <circle
                key={`circular-ring-${i}`}
                cx="32"
                cy="32"
                r={radius}
                fill="none"
                stroke="url(#dp-energy)"
                strokeWidth="0.8"
                strokeOpacity="0.25"
                strokeDasharray="1 3"
                className={`circular-ring-${i + 1}`}
              />
            ))}
            
            {/* Middle Orbital System - Hexagonal Pattern */}
            <g className="hexagonal-core">
              {/* Hexagonal Outer Ring */}
              <polygon
                points="32,8 44,16 44,28 32,36 20,28 20,16"
                fill="none"
                stroke="url(#dp-primary)"
                strokeWidth="1.5"
                strokeOpacity="0.5"
                className="hex-outer"
              />
              
              {/* Hexagonal Middle Ring */}
              <polygon
                points="32,14 40,18 40,26 32,30 24,26 24,18"
                fill="none"
                stroke="url(#dp-energy)"
                strokeWidth="1.2"
                strokeOpacity="0.6"
                className="hex-middle"
              />
              
              {/* Hexagonal Inner Core */}
              <polygon
                points="32,18 36,20 36,24 32,26 28,24 28,20"
                fill="url(#dp-core-glow)"
                stroke="url(#dp-primary)"
                strokeWidth="1.8"
                strokeOpacity="0.8"
                className="hex-inner"
                filter="url(#dp-glow-filter)"
              />
            </g>
            
            {/* Central Quantum Core - Morphing Shape */}
            <g className="quantum-core">
              {/* Core Glow */}
              <circle cx="32" cy="32" r="5" fill="url(#dp-core-glow)" className="core-glow" opacity="0.95" />
              
              {/* Morphing Hexagon */}
              <polygon
                points="32,28 35,30 35,34 32,36 29,34 29,30"
                fill="url(#dp-energy)"
                className="morph-hex"
                filter="url(#dp-strong-glow)"
                opacity="0.95"
              />
              
              {/* Inner Pulse */}
              <circle cx="32" cy="32" r="2.5" fill="white" className="core-pulse" opacity="1" />
              <circle cx="32" cy="32" r="1.5" fill="url(#dp-primary)" className="core-center" opacity="1" />
            </g>
            
            {/* Quantum Particles - Orbital System - More particles */}
            {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((angle, i) => {
              const rad = (angle * Math.PI) / 180;
              const radius = 22;
              const x = 32 + Math.cos(rad) * radius;
              const y = 32 + Math.sin(rad) * radius;
              
              return (
                <g key={`quantum-particle-${i}`} className="quantum-particle-group">
                  {/* Connection Energy Line */}
                  <line
                    x1="32"
                    y1="32"
                    x2={x}
                    y2={y}
                    stroke="url(#dp-primary)"
                    strokeWidth="0.6"
                    strokeOpacity="0.25"
                    strokeDasharray="1 2"
                    className="particle-connection"
                    style={{ animationDelay: `${i * 0.1}s` }}
                  />
                  
                  {/* Orbital Particle - Mini Logo */}
                  <g
                    className="orbital-particle"
                    transform={`translate(${x}, ${y})`}
                    style={{ animationDelay: `${i * 0.1}s` }}
                  >
                    {/* Mini DriftPro Logo */}
                    <circle cx="0" cy="0" r="2.5" fill="url(#dp-primary)" opacity="1" filter="url(#dp-glow-filter)" />
                    <circle cx="0" cy="0" r="1.5" fill="white" opacity="1" />
                    <circle cx="0" cy="0" r="0.75" fill="url(#dp-energy)" opacity="1" />
                    {/* Small rays */}
                    {[0, 90, 180, 270].map((rayAngle) => {
                      const rayRad = (rayAngle * Math.PI) / 180;
                      return (
                        <line
                          key={`ray-${rayAngle}`}
                          x1={Math.cos(rayRad) * 1.5}
                          y1={Math.sin(rayRad) * 1.5}
                          x2={Math.cos(rayRad) * 2.2}
                          y2={Math.sin(rayRad) * 2.2}
                          stroke="url(#dp-primary)"
                          strokeWidth="0.4"
                          strokeOpacity="0.85"
                          strokeLinecap="round"
                        />
                      );
                    })}
                  </g>
                </g>
              );
            })}
            
            {/* Energy Wave Rings - Expanding - More waves */}
            {[0, 1, 2, 3, 4].map((i) => (
              <circle
                key={`wave-ring-${i}`}
                cx="32"
                cy="32"
                r={10 + i * 2}
                fill="none"
                stroke="url(#dp-energy)"
                strokeWidth="1"
                strokeOpacity={0.25 - i * 0.03}
                className="wave-ring"
                style={{ animationDelay: `${i * 0.25}s` }}
              />
            ))}
            
            {/* Secondary Wave Rings */}
            {[0, 1, 2].map((i) => (
              <circle
                key={`secondary-wave-${i}`}
                cx="32"
                cy="32"
                r={8 + i * 1.5}
                fill="none"
                stroke="url(#dp-primary)"
                strokeWidth="0.8"
                strokeOpacity={0.15 - i * 0.02}
                className="secondary-wave"
                style={{ animationDelay: `${i * 0.2}s` }}
              />
            ))}
            
            {/* Quantum Energy Beams - More beams */}
            {[0, 40, 80, 120, 160, 200, 240, 280, 320].map((angle, i) => {
              const rad = (angle * Math.PI) / 180;
              return (
                <g key={`energy-beam-${i}`} className="energy-beam-group">
                  <line
                    x1="32"
                    y1="32"
                    x2={32 + Math.cos(rad) * 10}
                    y2={32 + Math.sin(rad) * 10}
                    stroke="url(#dp-energy)"
                    strokeWidth="1.5"
                    strokeOpacity="0.4"
                    strokeLinecap="round"
                    className="energy-beam"
                    style={{ animationDelay: `${i * 0.2}s` }}
                  />
                  <g
                    transform={`translate(${32 + Math.cos(rad) * 10}, ${32 + Math.sin(rad) * 10})`}
                    className="beam-node"
                    style={{ animationDelay: `${i * 0.2}s` }}
                  >
                    <circle cx="0" cy="0" r="1.8" fill="url(#dp-primary)" opacity="0.8" filter="url(#dp-glow-filter)" />
                    <circle cx="0" cy="0" r="1" fill="white" opacity="0.9" />
                    <circle cx="0" cy="0" r="0.5" fill="url(#dp-energy)" opacity="0.9" />
                  </g>
                </g>
              );
            })}
            
            {/* Floating Data Particles - More particles */}
            {[0, 20, 40, 60, 80, 100, 120, 140, 160, 180, 200, 220, 240, 260, 280, 300, 320, 340].map((angle, i) => {
              const rad = (angle * Math.PI) / 180;
              const radius = 12 + (i % 3) * 2;
              const x = 32 + Math.cos(rad) * radius;
              const y = 32 + Math.sin(rad) * radius;
              
              return (
                <g key={`data-particle-${i}`} className="data-particle-group">
                  <circle
                    cx={x}
                    cy={y}
                    r={0.8 + (i % 2) * 0.3}
                    fill="url(#dp-particle)"
                    className="data-particle"
                    style={{ animationDelay: `${i * 0.1}s` }}
                    opacity={0.85 + (i % 3) * 0.05}
                    filter="url(#dp-quantum-blur)"
                  />
                </g>
              );
            })}
            
            {/* Secondary Data Particles */}
            {[15, 45, 75, 105, 135, 165, 195, 225, 255, 285, 315, 345].map((angle, i) => {
              const rad = (angle * Math.PI) / 180;
              const radius = 19;
              const x = 32 + Math.cos(rad) * radius;
              const y = 32 + Math.sin(rad) * radius;
              
              return (
                <g key={`secondary-particle-${i}`} className="secondary-particle-group">
                  <circle
                    cx={x}
                    cy={y}
                    r="0.6"
                    fill="url(#dp-energy)"
                    className="secondary-particle"
                    style={{ animationDelay: `${i * 0.12}s` }}
                    opacity="0.7"
                    filter="url(#dp-quantum-blur)"
                  />
                </g>
              );
            })}
            
            {/* Morphing Geometric Shapes - More shapes */}
            <g className="morphing-shapes">
              {/* Rotating Triangles */}
              {[0, 60, 120, 180, 240, 300].map((angle, i) => {
                const rad = (angle * Math.PI) / 180;
                const radius = 18;
                const x = 32 + Math.cos(rad) * radius;
                const y = 32 + Math.sin(rad) * radius;
                
                return (
                  <polygon
                    key={`morph-triangle-${i}`}
                    points={`${x},${y - 2} ${x + 2},${y + 1.5} ${x - 2},${y + 1.5}`}
                    fill="url(#dp-primary)"
                    className="morph-triangle"
                    opacity="0.5"
                    filter="url(#dp-glow-filter)"
                    style={{ animationDelay: `${i * 0.15}s` }}
                  />
                );
              })}
              
              {/* Rotating Squares */}
              {[30, 90, 150, 210, 270, 330].map((angle, i) => {
                const rad = (angle * Math.PI) / 180;
                const radius = 20;
                const x = 32 + Math.cos(rad) * radius;
                const y = 32 + Math.sin(rad) * radius;
                
                return (
                  <rect
                    key={`morph-square-${i}`}
                    x={x - 1.5}
                    y={y - 1.5}
                    width="3"
                    height="3"
                    fill="url(#dp-energy)"
                    className="morph-square"
                    opacity="0.4"
                    filter="url(#dp-glow-filter)"
                    style={{ animationDelay: `${i * 0.18}s` }}
                  />
                );
              })}
              
              {/* Rotating Diamonds */}
              {[15, 75, 135, 195, 255, 315].map((angle, i) => {
                const rad = (angle * Math.PI) / 180;
                const radius = 16;
                const x = 32 + Math.cos(rad) * radius;
                const y = 32 + Math.sin(rad) * radius;
                
                return (
                  <polygon
                    key={`morph-diamond-${i}`}
                    points={`${x},${y - 1.5} ${x + 1.5},${y} ${x},${y + 1.5} ${x - 1.5},${y}`}
                    fill="url(#dp-primary)"
                    className="morph-diamond"
                    opacity="0.45"
                    filter="url(#dp-glow-filter)"
                    style={{ animationDelay: `${i * 0.2}s` }}
                  />
                );
              })}
            </g>
            
            {/* Additional Connection Lines */}
            {[22.5, 67.5, 112.5, 157.5, 202.5, 247.5, 292.5, 337.5].map((angle, i) => {
              const rad = (angle * Math.PI) / 180;
              const radius = 25;
              const x = 32 + Math.cos(rad) * radius;
              const y = 32 + Math.sin(rad) * radius;
              
              return (
                <line
                  key={`connection-line-${i}`}
                  x1="32"
                  y1="32"
                  x2={x}
                  y2={y}
                  stroke="url(#dp-energy)"
                  strokeWidth="0.3"
                  strokeOpacity="0.1"
                  strokeDasharray="0.5 2"
                  className="connection-line"
                  style={{ animationDelay: `${i * 0.08}s` }}
                />
              );
            })}
            
            {/* Outer Glow Particles */}
            {[10, 50, 90, 130, 170, 210, 250, 290, 330].map((angle, i) => {
              const rad = (angle * Math.PI) / 180;
              const radius = 27;
              const x = 32 + Math.cos(rad) * radius;
              const y = 32 + Math.sin(rad) * radius;
              
              return (
                <circle
                  key={`glow-particle-${i}`}
                  cx={x}
                  cy={y}
                  r="0.5"
                  fill="url(#dp-particle)"
                  className="glow-particle"
                  opacity="0.6"
                  filter="url(#dp-glow-filter)"
                  style={{ animationDelay: `${i * 0.11}s` }}
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
        className="driftpro-logo-icon advanced-logo"
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
