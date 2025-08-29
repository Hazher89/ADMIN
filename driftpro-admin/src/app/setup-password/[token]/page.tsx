'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { firebaseService } from '@/lib/firebase-services';
import { sveveSMS } from '@/lib/sveve-sms-service';

interface SetupPasswordData {
  password: string;
  confirmPassword: string;
}

export default function SetupPasswordPage() {
  const router = useRouter();
  const params = useParams();
  const token = params.token as string;
  
  const [setupData, setSetupData] = useState<SetupPasswordData>({
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [userInfo, setUserInfo] = useState<any>(null);

  useEffect(() => {
    // TODO: Validate token and get user info
    // For now, we'll simulate this
    setUserInfo({
      email: 'test@example.com',
      fullName: 'Test User'
    });
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (setupData.password !== setupData.confirmPassword) {
      setError('Passordene matcher ikke');
      return;
    }

    if (setupData.password.length < 6) {
      setError('Passordet må være minst 6 tegn');
      return;
    }

    try {
      setLoading(true);
      setError('');

      // TODO: Update user password in Firebase
      // For now, we'll simulate success
      await new Promise(resolve => setTimeout(resolve, 1000));

      setSuccess('Passordet ditt er nå satt! Du kan logge inn.');
      
      // Redirect to login after 2 seconds
      setTimeout(() => {
        router.push('/partner-login');
      }, 2000);

    } catch (err: any) {
      setError(err.message || 'Kunne ikke sette passord');
    } finally {
      setLoading(false);
    }
  };

  if (!userInfo) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full space-y-8 p-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900">Laster...</h2>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900">Velkommen til DriftPro!</h2>
          <p className="mt-2 text-sm text-gray-600">
            Hei {userInfo.fullName}, sett passordet ditt for å komme i gang
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Nytt passord
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Minst 6 tegn"
                value={setupData.password}
                onChange={(e) => setSetupData({ ...setupData, password: e.target.value })}
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                Bekreft passord
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Skriv passordet igjen"
                value={setupData.confirmPassword}
                onChange={(e) => setSetupData({ ...setupData, confirmPassword: e.target.value })}
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
              {success}
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Setter passord...' : 'Sett passord og logg inn'}
            </button>
          </div>
        </form>

        <div className="text-center">
          <p className="text-sm text-gray-600">
            Har du allerede et passord?{' '}
            <button
              onClick={() => router.push('/partner-login')}
              className="font-medium text-blue-600 hover:text-blue-500"
            >
              Logg inn her
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
