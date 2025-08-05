'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Lock, Eye, EyeOff, CheckCircle, AlertCircle, Shield, Zap, Users, Building } from 'lucide-react';

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const token = searchParams.get('token');
  const email = searchParams.get('email');

  // Password strength validation
  const passwordStrength = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /\d/.test(password),
    special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
  };

  const strengthScore = Object.values(passwordStrength).filter(Boolean).length;
  const strengthColor = strengthScore <= 2 ? 'red' : strengthScore <= 3 ? 'yellow' : strengthScore <= 4 ? 'blue' : 'green';
  const strengthText = strengthScore <= 2 ? 'Svakt' : strengthScore <= 3 ? 'Middels' : strengthScore <= 4 ? 'Godt' : 'Sterkt';

  useEffect(() => {
    if (!token || !email) {
      setError('Ugyldig lenke. Token eller e-post mangler.');
    }
  }, [token, email]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!token || !email) {
      setError('Ugyldig lenke. Token eller e-post mangler.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passordene matcher ikke.');
      return;
    }

    if (password.length < 8) {
      setError('Passordet må være minst 8 tegn langt.');
      return;
    }

    if (strengthScore < 3) {
      setError('Passordet er for svakt. Bruk minst 3 av følgende: store bokstaver, små bokstaver, tall, spesialtegn.');
      return;
    }

    setLoading(true);
    setError('');
    setMessage('');

    try {
      const response = await fetch('/api/setup-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          password,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(true);
        setMessage('Passordet ditt er satt opp! Du kan nå logge inn.');
        setTimeout(() => {
          router.push('/login');
        }, 3000);
      } else {
        setError(data.error || 'Feil ved oppsett av passord.');
      }
    } catch (err) {
      setError('Feil ved tilkobling til serveren.');
    } finally {
      setLoading(false);
    }
  };

  if (!token || !email) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-2xl p-8 border border-gray-100">
          <div className="text-center">
            <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-6">
              <AlertCircle className="h-8 w-8 text-red-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-3">Ugyldig lenke</h1>
            <p className="text-gray-600 mb-8 leading-relaxed">
              Denne lenken er ugyldig eller har utløpt. Vennligst be om en ny lenke fra innloggingssiden.
            </p>
            <button
              onClick={() => router.push('/login')}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 px-6 rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              Gå til innlogging
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-2xl p-8 border border-gray-100">
        {success ? (
          <div className="text-center">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-6">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-3">Passord satt opp!</h1>
            <p className="text-gray-600 mb-8 leading-relaxed">{message}</p>
            <div className="animate-pulse">
              <p className="text-sm text-gray-500">Omdirigerer til innlogging...</p>
            </div>
          </div>
        ) : (
          <>
            <div className="text-center mb-8">
              <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mb-6 shadow-lg">
                <Lock className="h-8 w-8 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-3">Sett opp passord</h1>
              <p className="text-gray-600 mb-2">
                Velg et sterkt passord for din konto
              </p>
              <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
                <Building className="h-4 w-4" />
                <span>{email}</span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex">
                    <AlertCircle className="h-5 w-5 text-red-400 mr-3 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-red-600">{error}</p>
                  </div>
                </div>
              )}

              {message && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex">
                    <CheckCircle className="h-5 w-5 text-blue-400 mr-3 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-blue-600">{message}</p>
                  </div>
                </div>
              )}

              <div>
                <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-3">
                  Nytt passord
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    placeholder="Minst 8 tegn"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
                
                {/* Password strength indicator */}
                {password && (
                  <div className="mt-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-gray-600">Passordstyrke:</span>
                      <span className={`text-xs font-semibold ${
                        strengthColor === 'red' ? 'text-red-600' :
                        strengthColor === 'yellow' ? 'text-yellow-600' :
                        strengthColor === 'blue' ? 'text-blue-600' : 'text-green-600'
                      }`}>
                        {strengthText}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all duration-300 ${
                          strengthColor === 'red' ? 'bg-red-500' :
                          strengthColor === 'yellow' ? 'bg-yellow-500' :
                          strengthColor === 'blue' ? 'bg-blue-500' : 'bg-green-500'
                        }`}
                        style={{ width: `${(strengthScore / 5) * 100}%` }}
                      ></div>
                    </div>
                    
                    {/* Password requirements */}
                    <div className="mt-3 space-y-1">
                      <div className={`flex items-center text-xs ${passwordStrength.length ? 'text-green-600' : 'text-gray-500'}`}>
                        <CheckCircle className="h-3 w-3 mr-2" />
                        Minst 8 tegn
                      </div>
                      <div className={`flex items-center text-xs ${passwordStrength.uppercase ? 'text-green-600' : 'text-gray-500'}`}>
                        <CheckCircle className="h-3 w-3 mr-2" />
                        Minst én stor bokstav
                      </div>
                      <div className={`flex items-center text-xs ${passwordStrength.lowercase ? 'text-green-600' : 'text-gray-500'}`}>
                        <CheckCircle className="h-3 w-3 mr-2" />
                        Minst én liten bokstav
                      </div>
                      <div className={`flex items-center text-xs ${passwordStrength.number ? 'text-green-600' : 'text-gray-500'}`}>
                        <CheckCircle className="h-3 w-3 mr-2" />
                        Minst ett tall
                      </div>
                      <div className={`flex items-center text-xs ${passwordStrength.special ? 'text-green-600' : 'text-gray-500'}`}>
                        <CheckCircle className="h-3 w-3 mr-2" />
                        Minst ett spesialtegn
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-semibold text-gray-700 mb-3">
                  Bekreft passord
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    id="confirmPassword"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    placeholder="Gjenta passordet"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
                {confirmPassword && password !== confirmPassword && (
                  <p className="mt-2 text-xs text-red-600">Passordene matcher ikke</p>
                )}
                {confirmPassword && password === confirmPassword && password && (
                  <p className="mt-2 text-xs text-green-600">✓ Passordene matcher</p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading || !password || !confirmPassword || password !== confirmPassword || strengthScore < 3}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 px-6 rounded-lg hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:transform-none disabled:shadow-lg"
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Setter opp passord...
                  </div>
                ) : (
                  'Sett opp passord'
                )}
              </button>
            </form>

            <div className="mt-8 text-center">
              <button
                onClick={() => router.push('/login')}
                className="text-sm text-blue-600 hover:text-blue-500 font-medium transition-colors"
              >
                ← Tilbake til innlogging
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-2xl p-8 border border-gray-100">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Laster...</h1>
            <p className="text-gray-600">Venter på lenke-parametere...</p>
          </div>
        </div>
      </div>
    }>
      <ResetPasswordContent />
    </Suspense>
  );
} 