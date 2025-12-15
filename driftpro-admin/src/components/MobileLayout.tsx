'use client';

import React, { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Home, 
  Calendar, 
  AlertTriangle, 
  User,
  LogOut,
  Menu,
  X,
  ChevronRight
} from 'lucide-react';
import DriftProLogo from '@/components/DriftProLogo';

interface MobileLayoutProps {
  children: React.ReactNode;
}

export default function MobileLayout({ children }: MobileLayoutProps) {
  const { userProfile, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Determine available menu items based on role and permissions
  const getMenuItems = () => {
    const items = [
      {
        name: 'Hjem',
        href: '/dashboard',
        icon: <Home size={24} />,
        show: hasPermission(userProfile, 'dashboard')
      }
    ];

    // Add role-specific items based on permissions
    // Employees and department leaders always have access to these
    const isEmployeeOrLeader = userProfile?.role === 'employee' || userProfile?.role === 'department_leader';
    
    if (hasPermission(userProfile, 'hrFerie') || isEmployeeOrLeader) {
      items.push({
        name: 'Ferie',
        href: '/dashboard/vacation',
        icon: <Calendar size={24} />,
        show: true
      });
    }

    if (hasPermission(userProfile, 'hrFravær') || isEmployeeOrLeader) {
      items.push({
        name: 'Fravær',
        href: '/dashboard/absence',
        icon: <AlertTriangle size={24} />,
        show: true
      });
    }

    if (hasPermission(userProfile, 'avvik') || isEmployeeOrLeader) {
      items.push({
        name: 'Avvik',
        href: '/dashboard/deviations',
        icon: <AlertTriangle size={24} />,
        show: true
      });
    }

    return items.filter(item => item.show);
  };

  const menuItems = getMenuItems();

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--background-color)',
      display: 'flex',
      flexDirection: 'column',
      paddingBottom: '80px' // Space for bottom navigation
    }}>
      {/* Mobile Header */}
      <header style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        background: 'var(--card-background)',
        borderBottom: '1px solid var(--border-color)',
        padding: '0.75rem 1rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            style={{
              padding: '0.5rem',
              background: 'transparent',
              border: 'none',
              borderRadius: 'var(--radius-md)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              minWidth: '44px',
              minHeight: '44px',
              touchAction: 'manipulation'
            }}
          >
            {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
          <DriftProLogo variant="icon" size={32} />
          <span style={{
            fontSize: '1.125rem',
            fontWeight: '600',
            color: 'var(--text-color)'
          }}>
            DriftPro
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            background: 'var(--gradient-primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontSize: '0.875rem',
            fontWeight: '600'
          }}>
            {userProfile?.firstName?.[0] || userProfile?.email?.[0] || 'U'}
          </div>
        </div>
      </header>

      {/* Sidebar Overlay */}
      {sidebarOpen && (
        <>
          <div
            onClick={() => setSidebarOpen(false)}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0, 0, 0, 0.5)',
              zIndex: 200,
              animation: 'fadeIn 0.2s ease'
            }}
          />
          <aside style={{
            position: 'fixed',
            top: 0,
            left: 0,
            height: '100vh',
            width: '280px',
            background: 'var(--card-background)',
            zIndex: 201,
            boxShadow: '2px 0 20px rgba(0, 0, 0, 0.1)',
            transform: sidebarOpen ? 'translateX(0)' : 'translateX(-100%)',
            transition: 'transform 0.3s ease',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column'
          }}>
            {/* Sidebar Header */}
            <div style={{
              padding: '1.5rem',
              borderBottom: '1px solid var(--border-color)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div>
                <div style={{
                  fontSize: '1rem',
                  fontWeight: '600',
                  color: 'var(--text-color)',
                  marginBottom: '0.25rem'
                }}>
                  {userProfile?.firstName} {userProfile?.lastName}
                </div>
                <div style={{
                  fontSize: '0.875rem',
                  color: 'var(--gray-500)'
                }}>
                  {userProfile?.email}
                </div>
              </div>
            </div>

            {/* Menu Items */}
            <nav style={{ flex: 1, padding: '1rem 0' }}>
              {menuItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <a
                    key={item.href}
                    href={item.href}
                    onClick={(e) => {
                      e.preventDefault();
                      router.push(item.href);
                      setSidebarOpen(false);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '1rem',
                      padding: '1rem 1.5rem',
                      color: isActive ? 'var(--primary)' : 'var(--text-color)',
                      background: isActive ? 'rgba(6, 182, 212, 0.1)' : 'transparent',
                      borderLeft: isActive ? '3px solid var(--primary)' : '3px solid transparent',
                      textDecoration: 'none',
                      transition: 'all 0.2s',
                      minHeight: '56px',
                      touchAction: 'manipulation'
                    }}
                  >
                    <div style={{
                      color: isActive ? 'var(--primary)' : 'var(--gray-600)'
                    }}>
                      {item.icon}
                    </div>
                    <span style={{
                      fontSize: '1rem',
                      fontWeight: isActive ? '600' : '500',
                      flex: 1
                    }}>
                      {item.name}
                    </span>
                    <ChevronRight size={20} style={{
                      color: 'var(--gray-400)',
                      opacity: isActive ? 1 : 0.5
                    }} />
                  </a>
                );
              })}
            </nav>

            {/* Logout Button */}
            <div style={{
              padding: '1rem 1.5rem',
              borderTop: '1px solid var(--border-color)'
            }}>
              <button
                onClick={handleLogout}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                  padding: '1rem',
                  background: 'transparent',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-lg)',
                  color: 'var(--danger)',
                  fontSize: '1rem',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  minHeight: '56px',
                  touchAction: 'manipulation'
                }}
              >
                <LogOut size={24} />
                <span>Logg ut</span>
              </button>
            </div>
          </aside>
        </>
      )}

      {/* Main Content */}
      <main style={{
        flex: 1,
        width: '100%',
        maxWidth: '100%',
        overflowX: 'hidden'
      }}>
        {children}
      </main>

      {/* Bottom Navigation - Mobile Only */}
      {isMobile && (
        <nav style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          background: 'var(--card-background)',
          borderTop: '1px solid var(--border-color)',
          padding: '0.5rem',
          display: 'flex',
          justifyContent: 'space-around',
          alignItems: 'center',
          zIndex: 100,
          boxShadow: '0 -2px 10px rgba(0, 0, 0, 0.05)',
          backdropFilter: 'blur(10px)'
        }}>
          {menuItems.slice(0, 4).map((item) => {
            const isActive = pathname === item.href;
            return (
              <a
                key={item.href}
                href={item.href}
                onClick={(e) => {
                  e.preventDefault();
                  router.push(item.href);
                }}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '0.25rem',
                  padding: '0.5rem',
                  minWidth: '60px',
                  minHeight: '56px',
                  borderRadius: 'var(--radius-md)',
                  color: isActive ? 'var(--primary)' : 'var(--gray-600)',
                  background: isActive ? 'rgba(6, 182, 212, 0.1)' : 'transparent',
                  textDecoration: 'none',
                  transition: 'all 0.2s',
                  touchAction: 'manipulation',
                  WebkitTapHighlightColor: 'transparent'
                }}
              >
                <div style={{
                  color: isActive ? 'var(--primary)' : 'var(--gray-600)'
                }}>
                  {item.icon}
                </div>
                <span style={{
                  fontSize: '0.75rem',
                  fontWeight: isActive ? '600' : '500'
                }}>
                  {item.name}
                </span>
              </a>
            );
          })}
        </nav>
      )}

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </div>
  );
}

