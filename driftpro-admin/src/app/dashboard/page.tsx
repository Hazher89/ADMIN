'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { FirebaseService } from '../../lib/firebase-service';

interface DashboardStats {
  totalEmployees: number;
  activeEmployees: number;
  departments: number;
  companyName: string;
  recentActivity: number;
}

export default function Dashboard() {
  const { selectedCompany, currentUser } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadDashboardData = async () => {
      if (!selectedCompany?.id) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        const dashboardStats = await FirebaseService.getDashboardStats(selectedCompany.id);
        setStats(dashboardStats);
      } catch (err) {
        console.error('Error loading dashboard data:', err);
        setError('Kunne ikke laste dashboard-data');
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, [selectedCompany]);

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '400px',
        color: '#3c8dbc'
      }}>
        <div style={{ textAlign: 'center' }}>
          <i className="fas fa-spinner fa-spin" style={{ fontSize: '48px', marginBottom: '20px' }}></i>
          <p>Laster dashboard-data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '400px',
        color: '#dc3545'
      }}>
        <div style={{ textAlign: 'center' }}>
          <i className="fas fa-exclamation-triangle" style={{ fontSize: '48px', marginBottom: '20px' }}></i>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px' }}>
      {/* Welcome Section */}
      <div style={{ marginBottom: '30px' }}>
        <h1 style={{ 
          fontSize: '28px', 
          fontWeight: '700', 
          color: '#333',
          marginBottom: '10px'
        }}>
          Velkommen tilbake, {currentUser?.firstName || 'Admin'}!
        </h1>
        <p style={{ 
          fontSize: '16px', 
          color: '#6c757d',
          marginBottom: '20px'
        }}>
          Her er oversikten over {selectedCompany?.name || 'din bedrift'}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        <div className="stat-card success">
          <div className="stat-icon">
            <i className="fas fa-users"></i>
          </div>
          <div className="stat-content">
            <div className="stat-number">{stats?.totalEmployees || 0}</div>
            <div className="stat-label">Totalt ansatte</div>
          </div>
        </div>

        <div className="stat-card info">
          <div className="stat-icon">
            <i className="fas fa-user-check"></i>
          </div>
          <div className="stat-content">
            <div className="stat-number">{stats?.activeEmployees || 0}</div>
            <div className="stat-label">Aktive ansatte</div>
          </div>
        </div>

        <div className="stat-card warning">
          <div className="stat-icon">
            <i className="fas fa-building"></i>
          </div>
          <div className="stat-content">
            <div className="stat-number">{stats?.departments || 0}</div>
            <div className="stat-label">Avdelinger</div>
          </div>
        </div>

        <div className="stat-card danger">
          <div className="stat-icon">
            <i className="fas fa-chart-line"></i>
          </div>
          <div className="stat-content">
            <div className="stat-number">{stats?.recentActivity || 0}</div>
            <div className="stat-label">Aktive denne uken</div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="chart-container">
        <div style={{ 
          background: 'white', 
          borderRadius: '8px', 
          padding: '20px',
          marginBottom: '20px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ 
            fontSize: '18px', 
            fontWeight: '600', 
            color: '#333',
            marginBottom: '15px'
          }}>
            Månedlig rapport
          </h3>
          <div style={{ 
            height: '200px', 
            background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
            borderRadius: '6px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#6c757d'
          }}>
            <div style={{ textAlign: 'center' }}>
              <i className="fas fa-chart-bar" style={{ fontSize: '48px', marginBottom: '10px' }}></i>
              <p>Graf kommer snart</p>
            </div>
          </div>
        </div>

        <div style={{ 
          background: 'white', 
          borderRadius: '8px', 
          padding: '20px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ 
            fontSize: '18px', 
            fontWeight: '600', 
            color: '#333',
            marginBottom: '15px'
          }}>
            Mål oppfyllelse
          </h3>
          <div style={{ marginBottom: '15px' }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              marginBottom: '5px',
              fontSize: '14px'
            }}>
              <span>Ansatte registrering</span>
              <span>85%</span>
            </div>
            <div style={{ 
              width: '100%', 
              height: '8px', 
              backgroundColor: '#e9ecef', 
              borderRadius: '4px',
              overflow: 'hidden'
            }}>
              <div style={{ 
                width: '85%', 
                height: '100%', 
                backgroundColor: '#28a745',
                borderRadius: '4px'
              }}></div>
            </div>
          </div>
          <div style={{ marginBottom: '15px' }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              marginBottom: '5px',
              fontSize: '14px'
            }}>
              <span>Avviksrapportering</span>
              <span>92%</span>
            </div>
            <div style={{ 
              width: '100%', 
              height: '8px', 
              backgroundColor: '#e9ecef', 
              borderRadius: '4px',
              overflow: 'hidden'
            }}>
              <div style={{ 
                width: '92%', 
                height: '100%', 
                backgroundColor: '#17a2b8',
                borderRadius: '4px'
              }}></div>
            </div>
          </div>
          <div>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              marginBottom: '5px',
              fontSize: '14px'
            }}>
              <span>Dokumentopplasting</span>
              <span>78%</span>
            </div>
            <div style={{ 
              width: '100%', 
              height: '8px', 
              backgroundColor: '#e9ecef', 
              borderRadius: '4px',
              overflow: 'hidden'
            }}>
              <div style={{ 
                width: '78%', 
                height: '100%', 
                backgroundColor: '#ffc107',
                borderRadius: '4px'
              }}></div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div style={{ 
        background: 'white', 
        borderRadius: '8px', 
        padding: '20px',
        marginTop: '20px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <h3 style={{ 
          fontSize: '18px', 
          fontWeight: '600', 
          color: '#333',
          marginBottom: '15px'
        }}>
          Siste aktivitet
        </h3>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          height: '100px',
          color: '#6c757d'
        }}>
          <div style={{ textAlign: 'center' }}>
            <i className="fas fa-clock" style={{ fontSize: '32px', marginBottom: '10px' }}></i>
            <p>Ingen aktivitet å vise</p>
          </div>
        </div>
      </div>
    </div>
  );
} 