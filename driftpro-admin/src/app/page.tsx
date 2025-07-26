'use client';

import { useAuth } from '../contexts/AuthContext';
import CompanySelector from '../components/CompanySelector';
import LoginForm from '../components/LoginForm';

export default function HomePage() {
  const { selectedCompany, currentUser } = useAuth();

  if (!selectedCompany) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}>
        <div style={{
          background: 'white',
          borderRadius: '10px',
          boxShadow: '0 15px 35px rgba(0,0,0,0.1)',
          padding: '40px',
          maxWidth: '500px',
          width: '100%'
        }}>
          <div style={{ textAlign: 'center', marginBottom: '30px' }}>
            <h1 style={{ 
              color: '#3c8dbc', 
              fontSize: '32px', 
              fontWeight: '700',
              margin: '0 0 10px 0'
            }}>
              DriftPro Admin
            </h1>
            <p style={{ 
              color: '#6c757d', 
              fontSize: '16px',
              margin: '0'
            }}>
              Velg bedrift for å komme i gang
            </p>
          </div>
          <CompanySelector />
        </div>
      </div>
    );
  }

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div style={{
        background: 'white',
        borderRadius: '10px',
        boxShadow: '0 15px 35px rgba(0,0,0,0.1)',
        padding: '40px',
        maxWidth: '400px',
        width: '100%'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <h1 style={{ 
            color: '#3c8dbc', 
            fontSize: '28px', 
            fontWeight: '700',
            margin: '0 0 10px 0'
          }}>
            DriftPro Admin
          </h1>
          <p style={{ 
            color: '#6c757d', 
            fontSize: '14px',
            margin: '0 0 5px 0'
          }}>
            Logg inn på
          </p>
          <p style={{ 
            color: '#3c8dbc', 
            fontSize: '18px',
            fontWeight: '600',
            margin: '0'
          }}>
            {selectedCompany.name}
          </p>
        </div>
        {currentUser ? (
          <div style={{ textAlign: 'center' }}>
            <p style={{ color: '#28a745', marginBottom: '20px' }}>
              Du er logget inn som {currentUser.email}
            </p>
            <button 
              onClick={() => window.location.href = '/dashboard'}
              style={{
                background: '#3c8dbc',
                color: 'white',
                border: 'none',
                padding: '12px 24px',
                borderRadius: '5px',
                cursor: 'pointer',
                fontSize: '16px'
              }}
            >
              Gå til Dashboard
            </button>
          </div>
        ) : (
          <LoginForm />
        )}
      </div>
    </div>
  );
}
