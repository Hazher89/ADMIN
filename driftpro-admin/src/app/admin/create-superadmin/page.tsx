'use client';

import React, { useState } from 'react';
import { CheckCircle, AlertCircle, Loader2, Shield, Lock } from 'lucide-react';

export default function CreateSuperAdminPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string; details?: any } | null>(null);
  const [secretKey, setSecretKey] = useState('');

  const handleCreateSuperAdmin = async () => {
    setLoading(true);
    setResult(null);

    try {
      const response = await fetch('/api/create-superadmin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'baxigshti@hotmail.de',
          password: 'HazGada89',
          secretKey: secretKey || 'DRIFTPRO_SUPERADMIN_2024_SECURE' // Default secret key
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setResult({
          success: true,
          message: data.message || 'Superadmin bruker opprettet!',
          details: data
        });
      } else {
        setResult({
          success: false,
          message: data.error || 'Feil ved opprettelse av superadmin',
          details: data.details
        });
      }
    } catch (error: any) {
      setResult({
        success: false,
        message: 'Feil ved opprettelse av superadmin',
        details: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4 sm:p-6 md:p-8"
      style={{
        background: 'var(--background-color)',
        color: 'var(--text-color)'
      }}
    >
      <div 
        className="w-full max-w-2xl"
        style={{
          background: 'var(--card-background)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderRadius: 'var(--radius-2xl)',
          padding: '3rem',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
          border: '1px solid var(--border-color)'
        }}
      >
        {/* Header */}
        <div className="text-center mb-8">
          <div 
            className="inline-flex items-center justify-center w-20 h-20 rounded-2xl mb-6"
            style={{
              background: 'var(--gradient-primary)'
            }}
          >
            <Shield className="w-10 h-10 text-white" />
          </div>
          <h1 
            className="text-4xl font-bold mb-3"
            style={{ color: 'var(--text-color)' }}
          >
            Opprett Superadmin
          </h1>
          <p 
            className="text-base"
            style={{ color: 'var(--gray-400)' }}
          >
            Oppretter superadmin-bruker med full tilgang til systemet
          </p>
        </div>

        {/* User Info */}
        <div 
          className="mb-8 p-6 rounded-xl"
          style={{
            background: 'var(--gray-200)',
            border: '1px solid var(--border-color)'
          }}
        >
          <h2 
            className="text-lg font-semibold mb-4 flex items-center gap-2"
            style={{ color: 'var(--text-color)' }}
          >
            <Lock className="w-5 h-5" />
            Brukerinformasjon
          </h2>
          <div className="space-y-3">
            <div>
              <span 
                className="text-sm font-medium"
                style={{ color: 'var(--gray-500)' }}
              >
                E-post:
              </span>
              <p 
                className="text-base font-semibold mt-1"
                style={{ color: 'var(--text-color)' }}
              >
                baxigshti@hotmail.de
              </p>
            </div>
            <div>
              <span 
                className="text-sm font-medium"
                style={{ color: 'var(--gray-500)' }}
              >
                Passord:
              </span>
              <p 
                className="text-base font-semibold mt-1"
                style={{ color: 'var(--text-color)' }}
              >
                ••••••••
              </p>
            </div>
            <div>
              <span 
                className="text-sm font-medium"
                style={{ color: 'var(--gray-500)' }}
              >
                Rolle:
              </span>
              <p 
                className="text-base font-semibold mt-1"
                style={{ color: 'var(--primary)' }}
              >
                super_admin
              </p>
            </div>
            <div>
              <span 
                className="text-sm font-medium"
                style={{ color: 'var(--gray-500)' }}
              >
                Beskyttelse:
              </span>
              <p 
                className="text-base font-semibold mt-1"
                style={{ color: 'var(--success)' }}
              >
                Kan ikke slettes - Full tilgang til alt
              </p>
            </div>
          </div>
        </div>

        {/* Secret Key Input */}
        <div className="mb-8">
          <label 
            htmlFor="secretKey" 
            className="block mb-3 text-base font-semibold"
            style={{ color: 'var(--text-color)' }}
          >
            Sikkerhetsnøkkel (valgfritt)
          </label>
          <input
            id="secretKey"
            type="password"
            value={secretKey}
            onChange={(e) => setSecretKey(e.target.value)}
            className="w-full px-5 py-4 rounded-xl transition-all duration-300 focus:outline-none text-base"
            style={{
              background: 'var(--gray-200)',
              border: '2px solid var(--border-color)',
              color: 'var(--text-color)'
            }}
            placeholder="La stå tom for standard nøkkel"
          />
        </div>

        {/* Result Message */}
        {result && (
          <div 
            className={`mb-8 p-5 rounded-xl flex items-start gap-4 ${
              result.success ? 'animate-in slide-in-from-top-2' : ''
            }`}
            style={{
              background: result.success 
                ? 'rgba(34, 197, 94, 0.15)' 
                : 'rgba(239, 68, 68, 0.15)',
              border: `1px solid ${result.success ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`
            }}
          >
            {result.success ? (
              <CheckCircle className="w-6 h-6 flex-shrink-0 mt-0.5" style={{ color: 'var(--success)' }} />
            ) : (
              <AlertCircle className="w-6 h-6 flex-shrink-0 mt-0.5" style={{ color: 'var(--danger)' }} />
            )}
            <div className="flex-1">
              <p 
                className={`text-base font-semibold mb-1 ${
                  result.success ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {result.success ? 'Suksess!' : 'Feil'}
              </p>
              <p 
                className="text-sm leading-relaxed mb-2"
                style={{ color: result.success ? 'var(--success)' : 'var(--danger)' }}
              >
                {result.message}
              </p>
              {result.details && (
                <pre 
                  className="text-xs mt-3 p-3 rounded-lg overflow-auto"
                  style={{
                    background: 'rgba(0, 0, 0, 0.2)',
                    color: 'var(--text-color)'
                  }}
                >
                  {JSON.stringify(result.details, null, 2)}
                </pre>
              )}
            </div>
          </div>
        )}

        {/* Create Button */}
        <button
          onClick={handleCreateSuperAdmin}
          disabled={loading}
          className="w-full py-6 px-8 rounded-xl text-white font-bold text-xl shadow-2xl transition-all duration-300 flex items-center justify-center gap-3"
          style={{
            background: loading ? 'var(--gray-400)' : 'var(--gradient-primary)',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.7 : 1,
            boxShadow: loading 
              ? 'none' 
              : '0 10px 25px -5px rgba(6, 182, 212, 0.4)'
          }}
          onMouseEnter={(e) => {
            if (!loading) {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 15px 35px -5px rgba(6, 182, 212, 0.5)';
            }
          }}
          onMouseLeave={(e) => {
            if (!loading) {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 10px 25px -5px rgba(6, 182, 212, 0.4)';
            }
          }}
        >
          {loading ? (
            <>
              <Loader2 className="w-7 h-7 animate-spin" />
              <span>Oppretter superadmin...</span>
            </>
          ) : (
            <>
              <Shield className="w-7 h-7" />
              <span>Opprett Superadmin Bruker</span>
            </>
          )}
        </button>

        {/* Warning */}
        <div 
          className="mt-6 p-4 rounded-xl text-sm text-center"
          style={{
            background: 'rgba(251, 191, 36, 0.1)',
            border: '1px solid rgba(251, 191, 36, 0.3)',
            color: 'var(--warning)'
          }}
        >
          ⚠️ Denne brukeren vil ha full tilgang til hele systemet og kan ikke slettes.
        </div>
      </div>

      <style jsx>{`
        @keyframes slide-in-from-top-2 {
          from {
            opacity: 0;
            transform: translateY(-8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-in {
          animation-duration: 0.3s;
          animation-timing-function: ease-out;
          animation-fill-mode: both;
        }
        
        .slide-in-from-top-2 {
          animation-name: slide-in-from-top-2;
        }
      `}</style>
    </div>
  );
}

