'use client';

import React, { useState } from 'react';
import { Trash2, AlertTriangle, CheckCircle, RefreshCw } from 'lucide-react';

export default function FirebaseCleanupPage() {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [error, setError] = useState('');

  const runCleanup = async (action: string, additionalData?: any) => {
    setLoading(true);
    setError('');
    setResults(null);

    try {
      const response = await fetch('/api/cleanup-firebase', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action,
          ...additionalData
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Cleanup failed');
      }

      setResults(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const cleanupActions = [
    {
      id: 'cleanup_expired_tokens',
      title: 'Rydd opp i utløpte tokens',
      description: 'Sletter alle utløpte setup-tokens',
      icon: <Trash2 className="w-5 h-5" />,
      color: 'bg-red-500'
    },
    {
      id: 'cleanup_orphaned_firestore_users',
      title: 'Finn foreldreløse Firestore-brukere',
      description: 'Finner brukere i Firestore uten Firebase Auth-kontoer',
      icon: <AlertTriangle className="w-5 h-5" />,
      color: 'bg-yellow-500'
    },
    {
      id: 'cleanup_orphaned_auth_users',
      title: 'Finn foreldreløse Firebase Auth-brukere',
      description: 'Finner Firebase Auth-kontoer uten Firestore-profiler',
      icon: <AlertTriangle className="w-5 h-5" />,
      color: 'bg-yellow-500'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center gap-3 mb-6">
            <Trash2 className="w-8 h-8 text-red-500" />
            <h1 className="text-2xl font-bold text-gray-900">Firebase Cleanup</h1>
          </div>

          <div className="mb-6">
            <p className="text-gray-600">
              Dette verktøyet hjelper deg med å rydde opp i Firebase-data og løse problemer med duplikate eller foreldreløse brukere.
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-500" />
                <span className="text-red-700 font-medium">Feil:</span>
              </div>
              <p className="text-red-600 mt-1">{error}</p>
            </div>
          )}

          {results && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <span className="text-green-700 font-medium">Resultat:</span>
              </div>
              <pre className="text-green-600 mt-2 text-sm overflow-auto">
                {JSON.stringify(results, null, 2)}
              </pre>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {cleanupActions.map((action) => (
              <div
                key={action.id}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className={`p-2 rounded-lg ${action.color} text-white`}>
                    {action.icon}
                  </div>
                  <h3 className="font-semibold text-gray-900">{action.title}</h3>
                </div>
                
                <p className="text-gray-600 text-sm mb-4">{action.description}</p>
                
                <button
                  onClick={() => runCleanup(action.id)}
                  disabled={loading}
                  className="w-full bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                  {loading ? 'Kjører...' : 'Kjør cleanup'}
                </button>
              </div>
            ))}
          </div>

          <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-5 h-5 text-yellow-500" />
              <span className="text-yellow-700 font-medium">Viktig:</span>
            </div>
            <ul className="text-yellow-600 text-sm space-y-1">
              <li>• Firebase Auth-bruker sletting krever Admin SDK</li>
              <li>• Kjør cleanup-operasjoner forsiktig</li>
              <li>• Ta backup før du sletter store mengder data</li>
              <li>• Kontakt administrator hvis du er usikker</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
