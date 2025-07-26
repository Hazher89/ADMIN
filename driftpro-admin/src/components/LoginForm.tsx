'use client';

import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { FirebaseService } from '../lib/firebase-service';

interface FirebaseError {
  code: string;
  message: string;
}

export default function LoginForm() {
  const { selectedCompany } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      setError('Vennligst fyll ut alle feltene');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Use Firebase authentication
      await FirebaseService.login(email, password);
      
      // Get user data from Firestore
      // Note: In a real app, you'd get the user ID from the auth result
      // For now, we'll use the email to find the user
      const users = await FirebaseService.getUsersByCompany(selectedCompany?.id || '');
      const user = users.find(u => u.email === email);
      
      if (user) {
        // Update the auth context with the user data
        // This would typically be handled in the AuthContext
        console.log('User logged in:', user);
      }
      
    } catch (err: unknown) {
      console.error('Login error:', err);
      
      // Handle specific Firebase auth errors
      const firebaseError = err as FirebaseError;
      if (firebaseError.code === 'auth/user-not-found') {
        setError('Bruker ikke funnet. Sjekk e-postadressen.');
      } else if (firebaseError.code === 'auth/wrong-password') {
        setError('Feil passord. Prøv igjen.');
      } else if (firebaseError.code === 'auth/invalid-email') {
        setError('Ugyldig e-postadresse.');
      } else if (firebaseError.code === 'auth/too-many-requests') {
        setError('For mange mislykkede forsøk. Prøv igjen senere.');
      } else {
        setError('Kunne ikke logge inn. Prøv igjen.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '400px', margin: '0 auto', padding: '20px' }}>
      <div style={{ textAlign: 'center', marginBottom: '30px' }}>
        <h1 style={{ 
          fontSize: '28px', 
          fontWeight: '700', 
          color: '#3c8dbc',
          marginBottom: '10px'
        }}>
          Logg inn
        </h1>
      </div>

      <form onSubmit={handleSubmit} style={{ marginBottom: '20px' }}>
        <div style={{ marginBottom: '20px' }}>
          <div style={{ position: 'relative' }}>
            <i className="fas fa-envelope" style={{
              position: 'absolute',
              left: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#6c757d',
              fontSize: '14px'
            }}></i>
            <input
              type="email"
              placeholder="E-postadresse"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 12px 12px 40px',
                border: '1px solid #dee2e6',
                borderRadius: '6px',
                fontSize: '14px',
                outline: 'none',
                transition: 'border-color 0.3s',
                backgroundColor: 'white'
              }}
              onFocus={(e) => e.target.style.borderColor = '#3c8dbc'}
              onBlur={(e) => e.target.style.borderColor = '#dee2e6'}
              disabled={loading}
            />
          </div>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <div style={{ position: 'relative' }}>
            <i className="fas fa-lock" style={{
              position: 'absolute',
              left: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#6c757d',
              fontSize: '14px'
            }}></i>
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Passord"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 12px 12px 40px',
                border: '1px solid #dee2e6',
                borderRadius: '6px',
                fontSize: '14px',
                outline: 'none',
                transition: 'border-color 0.3s',
                backgroundColor: 'white'
              }}
              onFocus={(e) => e.target.style.borderColor = '#3c8dbc'}
              onBlur={(e) => e.target.style.borderColor = '#dee2e6'}
              disabled={loading}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              style={{
                position: 'absolute',
                right: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                color: '#6c757d',
                cursor: 'pointer',
                fontSize: '14px'
              }}
              disabled={loading}
            >
              <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
            </button>
          </div>
        </div>

        {error && (
          <div style={{ 
            padding: '12px', 
            backgroundColor: '#f8d7da', 
            color: '#721c24', 
            borderRadius: '6px', 
            marginBottom: '20px',
            border: '1px solid #f5c6cb',
            fontSize: '14px'
          }}>
            <i className="fas fa-exclamation-triangle" style={{ marginRight: '8px' }}></i>
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          style={{
            width: '100%',
            padding: '12px',
            backgroundColor: '#3c8dbc',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            fontSize: '16px',
            fontWeight: '600',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.7 : 1,
            transition: 'background-color 0.3s'
          }}
          onMouseEnter={(e) => {
            if (!loading) e.currentTarget.style.backgroundColor = '#367fa9';
          }}
          onMouseLeave={(e) => {
            if (!loading) e.currentTarget.style.backgroundColor = '#3c8dbc';
          }}
        >
          {loading ? (
            <>
              <i className="fas fa-spinner fa-spin" style={{ marginRight: '8px' }}></i>
              Logger inn...
            </>
          ) : (
            <>
              <i className="fas fa-sign-in-alt" style={{ marginRight: '8px' }}></i>
              Logg inn
            </>
          )}
        </button>
      </form>

      <div style={{ 
        textAlign: 'center', 
        marginTop: '20px'
      }}>
        <button
          type="button"
          onClick={() => {
            // TODO: Implement forgot password functionality
            alert('Glemt passord funksjonalitet kommer snart!');
          }}
          style={{
            background: 'none',
            border: 'none',
            color: '#3c8dbc',
            fontSize: '14px',
            cursor: 'pointer',
            textDecoration: 'underline',
            transition: 'color 0.3s'
          }}
          onMouseEnter={(e) => e.currentTarget.style.color = '#367fa9'}
          onMouseLeave={(e) => e.currentTarget.style.color = '#3c8dbc'}
        >
          Glemt passord?
        </button>
      </div>
    </div>
  );
} 