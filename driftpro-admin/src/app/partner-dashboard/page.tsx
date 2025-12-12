'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { firebaseService } from '@/lib/firebase-services';
import { 
  FileText, 
  Calendar, 
  CheckCircle, 
  XCircle, 
  Download,
  LogOut
} from 'lucide-react';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';

export default function PartnerDashboard() {
  const { userProfile, user } = useAuth();
  const [activeTab, setActiveTab] = useState<'routes' | 'documents'>('routes');
  const [routes, setRoutes] = useState<any[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (userProfile?.partnerId) {
      loadPartnerData();
    }
  }, [userProfile?.partnerId]);

  const loadPartnerData = async () => {
    try {
      setLoading(true);
      
      // Load routes assigned to this partner
      const partnerRoutes = await firebaseService.getRouteAssignments(
         '', 
        undefined, 
        undefined
      );
      
      // Filter routes for this partner
      const myRoutes = partnerRoutes.filter(route => 
        route.partnerId === userProfile?.partnerId
      );
      
      setRoutes(myRoutes);
      
      // Load documents (files from routes)
      const allDocuments = myRoutes.flatMap(route => 
        route.files?.map((file: any) => ({
          ...file,
          routeTitle: route.title,
          routeDate: route.date,
          routeId: route.id
        })) || []
      );
      
      setDocuments(allDocuments);
    } catch (error) {
      console.error('Error loading partner data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptRoute = async (routeId: string) => {
    try {
      await firebaseService.updateRouteAssignment(routeId, { 
        status: 'accepted',
        acceptedAt: new Date().toISOString()
      });
      
      setSuccess('Rute akseptert!');
      loadPartnerData(); // Reload data
    } catch (error) {
      console.error('Error accepting route:', error);
      setError('Feil ved aksept av rute');
    }
  };

  const handleRejectRoute = async (routeId: string) => {
    try {
      await firebaseService.updateRouteAssignment(routeId, { 
        status: 'rejected',
        rejectedAt: new Date().toISOString()
      });
      
      setSuccess('Rute avvist');
      loadPartnerData(); // Reload data
    } catch (error) {
      console.error('Error rejecting route:', error);
      setError('Feil ved avvisning av rute');
    }
  };

  const handleDownloadFile = (file: any) => {
    const link = document.createElement('a');
    link.href = file.url;
    link.download = file.name;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
      }}>
        <div style={{
          background: 'white',
          padding: '2rem',
          borderRadius: '12px',
          boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
          textAlign: 'center'
        }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '4px solid #f3f3f3',
            borderTop: '4px solid #667eea',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 1rem'
          }} />
          <p style={{ color: '#666', margin: 0 }}>Laster data...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '1rem'
    }}>
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>

      {/* Header */}
      <div style={{
        background: 'white',
        borderRadius: '12px',
        padding: '1.5rem',
        marginBottom: '1rem',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <h1 style={{
              fontSize: '1.5rem',
              fontWeight: '600',
              margin: '0 0 0.5rem 0',
              color: '#1f2937'
            }}>
              Velkommen, {userProfile?.name}
            </h1>
            <p style={{
              color: '#6b7280',
              margin: 0,
              fontSize: '0.875rem'
            }}>
              {userProfile?.partnerName} - Partner Dashboard
            </p>
          </div>
          <button
            onClick={handleLogout}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.5rem 1rem',
              background: '#ef4444',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '0.875rem',
              fontWeight: '500'
            }}
          >
            <LogOut style={{ width: '16px', height: '16px' }} />
            Logg ut
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{
        background: 'white',
        borderRadius: '12px',
        padding: '1rem',
        marginBottom: '1rem',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
      }}>
        <div style={{
          display: 'flex',
          gap: '0.5rem',
          borderBottom: '1px solid #e5e7eb'
        }}>
          <button
            onClick={() => setActiveTab('routes')}
            style={{
              padding: '0.75rem 1.5rem',
              background: activeTab === 'routes' ? '#667eea' : 'transparent',
              color: activeTab === 'routes' ? 'white' : '#6b7280',
              border: 'none',
              borderRadius: '8px 8px 0 0',
              cursor: 'pointer',
              fontSize: '0.875rem',
              fontWeight: '500',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            <Calendar style={{ width: '16px', height: '16px' }} />
            Mine Ruter
          </button>
          <button
            onClick={() => setActiveTab('documents')}
            style={{
              padding: '0.75rem 1.5rem',
              background: activeTab === 'documents' ? '#667eea' : 'transparent',
              color: activeTab === 'documents' ? 'white' : '#6b7280',
              border: 'none',
              borderRadius: '8px 8px 0 0',
              cursor: 'pointer',
              fontSize: '0.875rem',
              fontWeight: '500',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            <FileText style={{ width: '16px', height: '16px' }} />
            Dokumenter
          </button>
        </div>
      </div>

      {/* Content */}
      <div style={{
        background: 'white',
        borderRadius: '12px',
        padding: '1.5rem',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
      }}>
        {activeTab === 'routes' ? (
          <div>
            <h2 style={{
              fontSize: '1.25rem',
              fontWeight: '600',
              margin: '0 0 1rem 0',
              color: '#1f2937'
            }}>
              Mine Tildelte Ruter
            </h2>
            
            {routes.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '3rem',
                color: '#6b7280'
              }}>
                <Calendar style={{ width: '48px', height: '48px', margin: '0 auto 1rem', opacity: 0.5 }} />
                <p style={{ margin: 0, fontSize: '1rem' }}>Ingen ruter tildelt ennå</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {routes.map((route) => (
                  <div
                    key={route.id}
                    style={{
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      padding: '1rem',
                      background: route.status === 'accepted' ? '#f0fdf4' : 
                                 route.status === 'rejected' ? '#fef2f2' : '#f9fafb'
                    }}
                  >
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      marginBottom: '0.5rem'
                    }}>
                      <div>
                        <h3 style={{
                          fontSize: '1rem',
                          fontWeight: '600',
                          margin: '0 0 0.25rem 0',
                          color: '#1f2937'
                        }}>
                          {route.title}
                        </h3>
                        <p style={{
                          color: '#6b7280',
                          fontSize: '0.875rem',
                          margin: '0 0 0.5rem 0'
                        }}>
                          {new Date(route.date).toLocaleDateString('no-NO')} • {route.job || 'Ingen jobb spesifisert'}
                        </p>
                      </div>
                      <div style={{
                        display: 'flex',
                        gap: '0.5rem'
                      }}>
                        {route.status === 'accepted' ? (
                          <span style={{
                            background: '#10b981',
                            color: 'white',
                            padding: '0.25rem 0.75rem',
                            borderRadius: '20px',
                            fontSize: '0.75rem',
                            fontWeight: '500',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.25rem'
                          }}>
                            <CheckCircle style={{ width: '12px', height: '12px' }} />
                            Akseptert
                          </span>
                        ) : route.status === 'rejected' ? (
                          <span style={{
                            background: '#ef4444',
                            color: 'white',
                            padding: '0.25rem 0.75rem',
                            borderRadius: '20px',
                            fontSize: '0.75rem',
                            fontWeight: '500',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.25rem'
                          }}>
                            <XCircle style={{ width: '12px', height: '12px' }} />
                            Avvist
                          </span>
                        ) : (
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button
                              onClick={() => handleAcceptRoute(route.id)}
                              style={{
                                background: '#10b981',
                                color: 'white',
                                border: 'none',
                                padding: '0.5rem 1rem',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontSize: '0.75rem',
                                fontWeight: '500',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.25rem'
                              }}
                            >
                              <CheckCircle style={{ width: '12px', height: '12px' }} />
                              Aksepter
                            </button>
                            <button
                              onClick={() => handleRejectRoute(route.id)}
                              style={{
                                background: '#ef4444',
                                color: 'white',
                                border: 'none',
                                padding: '0.5rem 1rem',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontSize: '0.75rem',
                                fontWeight: '500',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.25rem'
                              }}
                            >
                              <XCircle style={{ width: '12px', height: '12px' }} />
                              Avvis
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {route.files && route.files.length > 0 && (
                      <div style={{
                        borderTop: '1px solid #e5e7eb',
                        paddingTop: '0.75rem',
                        marginTop: '0.75rem'
                      }}>
                        <p style={{
                          fontSize: '0.875rem',
                          fontWeight: '500',
                          color: '#374151',
                          margin: '0 0 0.5rem 0'
                        }}>
                          Vedlegg ({route.files.length}):
                        </p>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                          {route.files.map((file: any, index: number) => (
                            <button
                              key={index}
                              onClick={() => handleDownloadFile(file)}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                padding: '0.5rem 0.75rem',
                                background: '#f3f4f6',
                                border: '1px solid #d1d5db',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontSize: '0.75rem',
                                color: '#374151'
                              }}
                            >
                              <FileText style={{ width: '12px', height: '12px' }} />
                              {file.name}
                              <Download style={{ width: '12px', height: '12px' }} />
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div>
            <h2 style={{
              fontSize: '1.25rem',
              fontWeight: '600',
              margin: '0 0 1rem 0',
              color: '#1f2937'
            }}>
              Alle Dokumenter
            </h2>
            
            {documents.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '3rem',
                color: '#6b7280'
              }}>
                <FileText style={{ width: '48px', height: '48px', margin: '0 auto 1rem', opacity: 0.5 }} />
                <p style={{ margin: 0, fontSize: '1rem' }}>Ingen dokumenter tilgjengelig</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {documents.map((doc, index) => (
                  <div
                    key={index}
                    style={{
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      padding: '1rem',
                      background: '#f9fafb'
                    }}
                  >
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <div>
                        <h3 style={{
                          fontSize: '1rem',
                          fontWeight: '600',
                          margin: '0 0 0.25rem 0',
                          color: '#1f2937'
                        }}>
                          {doc.name}
                        </h3>
                        <p style={{
                          color: '#6b7280',
                          fontSize: '0.875rem',
                          margin: '0 0 0.5rem 0'
                        }}>
                          Fra rute: {doc.routeTitle} • {new Date(doc.routeDate).toLocaleDateString('no-NO')}
                        </p>
                        <p style={{
                          color: '#9ca3af',
                          fontSize: '0.75rem',
                          margin: 0
                        }}>
                          {(doc.size / 1024).toFixed(1)} KB • {doc.type}
                        </p>
                      </div>
                      <button
                        onClick={() => handleDownloadFile(doc)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          padding: '0.75rem 1rem',
                          background: '#667eea',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '0.875rem',
                          fontWeight: '500'
                        }}
                      >
                        <Download style={{ width: '16px', height: '16px' }} />
                        Last ned
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}