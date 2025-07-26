'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { FirebaseService } from '../../lib/firebase-service';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { currentUser, adminUser, selectedCompany } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const userDropdownRef = useRef<HTMLDivElement>(null);

  const handleLogout = async () => {
    try {
      await FirebaseService.logout();
      window.location.href = '/';
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target as Node)) {
        setUserDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  if (!currentUser || !adminUser || !selectedCompany) {
    return (
      <div className="d-flex align-center justify-center h-full">
        <div className="text-center">
          <h2>Laster...</h2>
          <p>Henter brukerdata...</p>
        </div>
      </div>
    );
  }

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  return (
    <div className={sidebarCollapsed ? 'sidebar-collapsed' : ''}>
      {/* Header */}
      <header className="admin-header">
        <div className="header-left">
          <button className="hamburger-menu" onClick={toggleSidebar}>
            <i className="fas fa-bars"></i>
          </button>
          <div className="logo">DriftPro Admin</div>
        </div>
        
        <div className="header-right">
          <div className="header-icons">
            <button className="icon-button">
              <i className="fas fa-envelope"></i>
              <span className="badge">4</span>
            </button>
            <button className="icon-button">
              <i className="fas fa-bell"></i>
              <span className="badge badge-warning">15</span>
            </button>
            <button className="icon-button">
              <i className="fas fa-flag"></i>
              <span className="badge badge-info">9</span>
            </button>
          </div>
          
          <div className="user-profile" style={{ position: 'relative' }} ref={userDropdownRef}>
            <button 
              className="user-profile-button" 
              onClick={() => setUserDropdownOpen(!userDropdownOpen)}
              style={{ 
                background: 'none', 
                border: 'none', 
                cursor: 'pointer', 
                display: 'flex', 
                alignItems: 'center', 
                gap: '10px',
                padding: '5px',
                borderRadius: '5px',
                transition: 'background-color 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8f9fa'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <div className="user-avatar">
                {adminUser.firstName?.charAt(0) || 'A'}
              </div>
              <div className="user-info">
                <div className="user-name">{adminUser.firstName} {adminUser.lastName}</div>
                <div className="user-status">Online</div>
              </div>
              <i className="fas fa-chevron-down" style={{ fontSize: '12px', color: '#6c757d' }}></i>
            </button>
            
            {userDropdownOpen && (
              <div className="user-dropdown" style={{
                position: 'absolute',
                top: '100%',
                right: '0',
                backgroundColor: 'white',
                border: '1px solid #dee2e6',
                borderRadius: '8px',
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                minWidth: '200px',
                zIndex: 1000,
                marginTop: '5px'
              }}>
                <div style={{ padding: '15px', borderBottom: '1px solid #dee2e6' }}>
                  <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>
                    {adminUser.firstName} {adminUser.lastName}
                  </div>
                  <div style={{ fontSize: '14px', color: '#6c757d' }}>
                    {adminUser.email}
                  </div>
                  <div style={{ fontSize: '12px', color: '#28a745', marginTop: '5px' }}>
                    {adminUser.role} • {selectedCompany.name}
                  </div>
                </div>
                <div style={{ padding: '10px 0' }}>
                  <button 
                    onClick={handleLogout}
                    style={{
                      width: '100%',
                      padding: '10px 15px',
                      background: 'none',
                      border: 'none',
                      textAlign: 'left',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      color: '#dc3545',
                      fontSize: '14px',
                      transition: 'background-color 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8f9fa'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <i className="fas fa-sign-out-alt"></i>
                    Logg ut
                  </button>
                </div>
              </div>
            )}
          </div>
          
          <div className="breadcrumb">
            <span>Hjem</span>
            <span className="breadcrumb-separator">/</span>
            <span>Dashboard</span>
          </div>
        </div>
      </header>

      {/* Sidebar */}
      <aside className="admin-sidebar">
        <div className="sidebar-header">
          <div className="sidebar-user">
            <div className="sidebar-avatar">
              {adminUser.firstName?.charAt(0) || 'A'}
            </div>
            <div className="sidebar-user-info">
              <h4>{adminUser.firstName} {adminUser.lastName}</h4>
              <p>Online</p>
            </div>
          </div>
          <div className="sidebar-search">
            <i className="fas fa-search"></i>
            <input type="text" placeholder="Søk..." />
          </div>
        </div>

        <nav className="sidebar-menu">
          <div className="menu-section">
            <div className="menu-section-title">Hovedmeny</div>
            <a href="/dashboard" className="menu-item active">
              <i className="fas fa-tachometer-alt"></i>
              <span className="menu-item-text">Dashboard</span>
            </a>
            <a href="/users" className="menu-item">
              <i className="fas fa-users"></i>
              <span className="menu-item-text">Brukere</span>
              <span className="menu-badge">4</span>
            </a>
            <a href="/departments" className="menu-item">
              <i className="fas fa-building"></i>
              <span className="menu-item-text">Avdelinger</span>
              <span className="menu-badge success">NEW</span>
            </a>
            <a href="/absence" className="menu-item">
              <i className="fas fa-calendar-times"></i>
              <span className="menu-item-text">Fravær & Ferie</span>
            </a>
            <a href="/timeclock" className="menu-item">
              <i className="fas fa-clock"></i>
              <span className="menu-item-text">Stemple Inn/Ut</span>
            </a>
            <a href="/chat" className="menu-item">
              <i className="fas fa-comments"></i>
              <span className="menu-item-text">Chat</span>
            </a>
            <a href="/deviations" className="menu-item">
              <i className="fas fa-exclamation-triangle"></i>
              <span className="menu-item-text">Avvik</span>
            </a>
            <a href="/documents" className="menu-item">
              <i className="fas fa-file-alt"></i>
              <span className="menu-item-text">Dokumenter</span>
            </a>
            <a href="/shifts" className="menu-item">
              <i className="fas fa-calendar-alt"></i>
              <span className="menu-item-text">Skiftplan</span>
              <span className="menu-badge warning">17</span>
            </a>
          </div>

          <div className="menu-section">
            <div className="menu-section-title">Administrasjon</div>
            <a href="/reports" className="menu-item">
              <i className="fas fa-chart-bar"></i>
              <span className="menu-item-text">Rapporter</span>
            </a>
            <a href="/settings" className="menu-item">
              <i className="fas fa-cog"></i>
              <span className="menu-item-text">Innstillinger</span>
            </a>
          </div>

          <div className="menu-section">
            <div className="menu-section-title">Labels</div>
            <div className="menu-item">
              <i className="fas fa-circle" style={{color: '#dc3545'}}></i>
              <span className="menu-item-text">Viktig</span>
            </div>
            <div className="menu-item">
              <i className="fas fa-circle" style={{color: '#ffc107'}}></i>
              <span className="menu-item-text">Advarsel</span>
            </div>
            <div className="menu-item">
              <i className="fas fa-circle" style={{color: '#17a2b8'}}></i>
              <span className="menu-item-text">Informasjon</span>
            </div>
          </div>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="admin-main">
        {children}
      </main>
    </div>
  );
} 