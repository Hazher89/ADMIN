'use client';

import React from 'react';
import { AlertTriangle, Home } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface AccessDeniedProps {
  message?: string;
  showHomeButton?: boolean;
}

export default function AccessDenied({ 
  message = 'Du har ikke tilgang til denne siden.', 
  showHomeButton = true 
}: AccessDeniedProps) {
  const router = useRouter();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="flex justify-center mb-4">
          <AlertTriangle className="w-16 h-16 text-red-500" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Tilgang nektet</h1>
        <p className="text-gray-600 mb-6">{message}</p>
        {showHomeButton && (
          <Link
            href="/dashboard"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Home className="w-4 h-4 mr-2" />
            Tilbake til dashboard
          </Link>
        )}
      </div>
    </div>
  );
}




