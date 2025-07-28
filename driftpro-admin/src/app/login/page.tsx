'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Zap,
  Eye,
  EyeOff,
  Mail,
  Lock,
  AlertCircle,
  ArrowRight,
  Loader2,
  Building
} from 'lucide-react';

interface Company {
  id: string;
  name: string;
  orgNumber: string;
  adminEmail: string;
}

export default function LoginPage() {
  const router = useRouter();
  const { login, isAuthenticated } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);

  useEffect(() => {
    // Get selected company from localStorage
    const companyData = localStorage.getItem('selectedCompany');
    if (companyData) {
      try {
        const company = JSON.parse(companyData);
        setSelectedCompany(company);
      } catch (error) {
        console.error('Error parsing company data:', error);
        router.push('/companies');
      }
    } else {
      // No company selected, redirect to company selection
      router.push('/companies');
    }
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Check if user is trying to login with the correct company admin email
      if (selectedCompany && email !== selectedCompany.adminEmail) {
        setError(`Du må logge inn med admin-e-posten for ${selectedCompany.name}: ${selectedCompany.adminEmail}`);
        setLoading(false);
        return;
      }

      await login(email, password);
      router.push('/dashboard');
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : 'En feil oppstod');
    } finally {
      setLoading(false);
    }
  };

  // Redirect if already authenticated
  if (isAuthenticated) {
    router.push('/dashboard');
    return null;
  }

  // Show loading while getting company data
  if (!selectedCompany) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Laster bedriftsinformasjon...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center">
              <Zap className="h-8 w-8 text-white" />
            </div>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Logg inn på {selectedCompany.name}
          </h2>
          <div className="flex items-center justify-center space-x-2 mb-2">
            <Building className="h-4 w-4 text-gray-500" />
            <p className="text-sm text-gray-500">
              Org.nr: {selectedCompany.orgNumber}
            </p>
          </div>
          <p className="text-gray-600">
            Bruk admin-e-posten: <span className="font-medium text-blue-600">{selectedCompany.adminEmail}</span>
          </p>
        </div>

        {/* Login Form */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <form onSubmit={handleLogin} className="space-y-6">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Admin e-postadresse
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  placeholder={selectedCompany.adminEmail}
                  defaultValue={selectedCompany.adminEmail}
                  required
                />
                <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Admin-e-post for {selectedCompany.name}
              </p>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Passord
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-12 pr-12 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  placeholder="Ditt passord"
                  required
                />
                <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="flex items-center space-x-2 p-3 bg-red-50 border border-red-200 rounded-xl">
                <AlertCircle className="h-5 w-5 text-red-500" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            {/* Login Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center px-4 py-3 border border-transparent text-sm font-medium rounded-xl text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Logger inn...
                </>
              ) : (
                <>
                  Logg inn
                  <ArrowRight className="h-5 w-5 ml-2" />
                </>
              )}
            </button>
          </form>

          {/* Additional Options */}
          <div className="mt-6 space-y-4">
            <div className="text-center">
              <button
                type="button"
                onClick={() => {
                  localStorage.removeItem('selectedCompany');
                  router.push('/companies');
                }}
                className="text-sm text-gray-600 hover:text-gray-700 font-medium"
              >
                ← Velg annen bedrift
              </button>
            </div>

            <div className="text-center">
              <a
                href="/forgot-password"
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                Glemt passord?
              </a>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Eller</span>
              </div>
            </div>

            <div className="text-center">
              <a
                href="/register"
                className="text-sm text-gray-600 hover:text-gray-700 font-medium"
              >
                Ny bruker? Opprett konto
              </a>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-sm text-gray-500">
          <p>© 2024 DriftPro. Alle rettigheter forbeholdt.</p>
          <p className="mt-1">
            Sikker tilkobling til Firebase-prosjekt: driftpro-40ccd
          </p>
        </div>
      </div>
    </div>
  );
} 