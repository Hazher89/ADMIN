'use client';

import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import CompanySelector from '@/components/CompanySelector';
import LoginForm from '@/components/LoginForm';
import { Company } from '@/types';

export default function HomePage() {
  const { adminUser, login, loading, selectedCompany, setSelectedCompany } = useAuth();
  const [loginError, setLoginError] = useState<string>('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleCompanySelect = (company: Company) => {
    setSelectedCompany(company.id);
  };

  const handleLogin = async (email: string, password: string) => {
    setIsLoggingIn(true);
    setLoginError('');
    
    try {
      await login(email, password);
    } catch (error: any) {
      setLoginError(
        error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password'
          ? 'Ugyldig e-postadresse eller passord'
          : 'En feil oppstod under innlogging. Prøv igjen.'
      );
    } finally {
      setIsLoggingIn(false);
    }
  };

  // If user is already logged in, redirect to dashboard
  if (adminUser && selectedCompany) {
    window.location.href = '/dashboard';
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {!selectedCompany ? (
          <CompanySelector onCompanySelect={handleCompanySelect} />
        ) : (
          <LoginForm
            onLogin={handleLogin}
            loading={isLoggingIn}
            error={loginError}
          />
        )}
      </div>
    </div>
  );
}
