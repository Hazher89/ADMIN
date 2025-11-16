'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function HomePage() {
  const router = useRouter();
  const { isAuthenticated, loading } = useAuth();

  useEffect(() => {
    // Check authentication status
    if (!loading) {
      if (isAuthenticated) {
        router.push('/dashboard');
      } else {
        router.push('/login');
      }
    }
  }, [isAuthenticated, loading, router]);

  // Show modern loading screen while redirecting
  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-indigo-600 to-purple-700 relative overflow-hidden">
      <div className="absolute inset-0 bg-grid-white/[0.05] bg-[length:20px_20px]"></div>
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/80 to-purple-700/80 backdrop-blur-sm"></div>
      
      <div className="relative z-10 flex flex-col items-center">
        <div className="w-24 h-24 mb-8 relative">
          <div className="absolute inset-0 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center">
            <svg className="text-white" style={{ width: '48px', height: '48px', maxWidth: '48px', maxHeight: '48px' }} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        </div>
        
        <h1 className="text-3xl font-bold text-white mb-2">DriftPro Admin</h1>
        <p className="text-indigo-200 mb-8">Laster inn systemet...</p>
        
        <div className="flex space-x-2">
          <div className="w-3 h-3 rounded-full bg-white/80 animate-pulse" style={{ animationDelay: '0ms' }}></div>
          <div className="w-3 h-3 rounded-full bg-white/80 animate-pulse" style={{ animationDelay: '300ms' }}></div>
          <div className="w-3 h-3 rounded-full bg-white/80 animate-pulse" style={{ animationDelay: '600ms' }}></div>
        </div>
      </div>
    </div>
  );
}
