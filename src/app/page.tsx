'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { Company } from '@/types';
import CompanySelector from '@/components/CompanySelector';
import LoginForm from '@/components/LoginForm';

export default function HomePage() {
  const { currentUser, adminUser, selectedCompany } = useAuth();
  const [tempSelectedCompany, setTempSelectedCompany] = useState<Company | null>(null);

  // If user is authenticated and company is selected, show dashboard
  if (currentUser && adminUser && selectedCompany) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Du er logget inn!</h1>
          <p className="text-gray-600 mb-4">Velkommen til {selectedCompany.name}</p>
          <Link
            href="/dashboard/"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            Gå til Dashboard
          </Link>
        </div>
      </div>
    );
  }

  // If company is selected but not logged in, show login form
  if (tempSelectedCompany) {
    return (
      <LoginForm
        selectedCompany={tempSelectedCompany}
        onBack={() => setTempSelectedCompany(null)}
      />
    );
  }

  // Show company selector
  return (
    <CompanySelector onCompanySelect={setTempSelectedCompany} />
  );
}
