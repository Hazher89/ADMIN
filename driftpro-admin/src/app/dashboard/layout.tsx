'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Home, 
  Users, 
  Building, 
  FileText, 
  Calendar, 
  MessageSquare, 
  AlertTriangle, 
  LogOut, 
  Menu, 
  X, 
  Mail, 
  Bell,
  Code,
  Search,
  Clock,
  BarChart3,
  Settings,
  FolderOpen,
  TrendingUp,
  Shield,
  Zap,
  Heart,
  Star,
  BookOpen,
  Target,
  Activity,
  Database,
  Globe,
  Key,
  Palette,
  Terminal,
  Handshake
} from 'lucide-react';
import { notificationService } from '@/lib/notification-service';
import NotificationBell from '@/components/NotificationBell';

interface SidebarItem {
  name: string;
  href: string;
  icon: React.ReactNode;
  badge?: string;
  badgeColor?: string;
  category?: string;
  isAdmin?: boolean;
}

// Prevent pre-rendering since this layout uses usePathname
export const dynamic = 'force-dynamic';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, logout, userProfile } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  
  // Mobile state
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const [unreadCount, setUnreadCount] = useState(0);
  
  // Debug logging for layout
  console.log('DashboardLayout: user:', user);
  console.log('DashboardLayout: userProfile:', userProfile);
  console.log('DashboardLayout: logout function:', !!logout);

  // Check if mobile on mount and resize
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // GDPR Compliance: Ensure user has a valid companyId
  useEffect(() => {
    if (user && userProfile) {
      console.log('🔒 DASHBOARD GDPR CHECK: User:', user.email);
      console.log('🔒 DASHBOARD GDPR CHECK: UserProfile:', userProfile);
      
      if (!userProfile.companyId) {
        console.error('🚨 GDPR VIOLATION: User without companyId detected:', user.email);
        alert('Sikkerhetsbrudd oppdaget. Du blir logget ut.');
        logout();
        router.push('/companies');
        return;
      }
      
      // Additional check: ensure userProfile is properly loaded
      if (!userProfile.id || !userProfile.email) {
        console.error('🚨 GDPR VIOLATION: Incomplete user profile detected:', user.email);
        alert('Ufullstendig brukerprofil oppdaget. Du blir logget ut.');
        logout();
        router.push('/companies');
        return;
      }
      
      console.log('✅ DASHBOARD GDPR CHECK: User validated successfully');
    }
  }, [user, userProfile, logout, router]);

  // Immediate GDPR validation on mount
  useEffect(() => {
    if (user && userProfile) {
      const selectedCompany = localStorage.getItem('selectedCompany');
      if (!selectedCompany) {
        console.error('🚨 GDPR VIOLATION: No company selected');
        alert('Ingen bedrift valgt. Du blir logget ut.');
        logout();
        router.push('/companies');
        return;
      }
    }
  }, [user, userProfile, logout, router]);

  // Check if user is DriftPro admin
  const isDriftProAdmin = userProfile?.companyId === 'driftpro-as';

  // Sidebar items configuration
  const sidebarItems: SidebarItem[] = [
    // Main navigation
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: <Home size={20} />,
      category: 'main'
    },
    {
      name: 'Ansatte',
      href: '/dashboard/employees',
      icon: <Users size={20} />,
      category: 'main'
    },
    {
      name: 'Vakter',
      href: '/dashboard/shifts',
      icon: <Calendar size={20} />,
      category: 'main'
    },
    {
      name: 'Fravær og ferie',
      href: '/dashboard/absence-vacation',
      icon: <Heart size={20} />,
      category: 'main'
    },
    {
      name: 'HMS',
      href: '/dashboard/deviations',
      icon: <Shield size={20} />,
      category: 'main'
    },
    {
      name: 'Dokumenter',
      href: '/dashboard/documents',
      icon: <FileText size={20} />,
      category: 'main'
    },
    {
      name: 'Chat',
      href: '/dashboard/chat',
      icon: <MessageSquare size={20} />,
      category: 'main'
    },
    {
      name: 'Rapporter',
      href: '/dashboard/reports',
      icon: <BarChart3 size={20} />,
      category: 'main'
    },
    {
      name: 'Tidsregistrering',
      href: '/dashboard/timeclock',
      icon: <Clock size={20} />,
      category: 'main'
    },
    
    // Management
    {
      name: 'Avdelinger',
      href: '/dashboard/departments',
      icon: <Building size={20} />,
      category: 'management'
    },
    {
      name: 'Samarbeidspartnere',
      href: '/dashboard/partners',
      icon: <Handshake size={20} />,
      category: 'management'
    },
    
    // Settings (available for all companies)
    {
      name: 'Innstillinger',
      href: '/dashboard/settings',
      icon: <Settings size={20} />,
      category: 'settings'
    },
    
    // Admin-only pages (only visible for DriftPro AS)
    ...(isDriftProAdmin ? [
      {
        name: 'Development',
        href: '/dashboard/development',
        icon: <Terminal size={20} />,
        badge: 'DEV',
        badgeColor: 'badge-primary',
        category: 'admin',
        isAdmin: true
      },
      {
        name: 'Bedrifter',
        href: '/dashboard/companies',
        icon: <Globe size={20} />,
        category: 'admin',
        isAdmin: true
      },
      {
        name: 'E-postlogger',
        href: '/dashboard/email-logs',
        icon: <Mail size={20} />,
        category: 'admin',
        isAdmin: true
      },
    ] : [])
  ];

  const handleLogout = async () => {
    setShowLogoutModal(true);
  };

  const confirmLogout = async () => {
    try {
      await logout();
      setShowLogoutModal(false);
      window.location.href = '/login';
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  const groupedItems = sidebarItems.reduce((acc, item) => {
    if (!acc[item.category!]) {
      acc[item.category!] = [];
    }
    acc[item.category!].push(item);
    return acc;
  }, {} as Record<string, SidebarItem[]>);

  const calculateTooltipPosition = (event: React.MouseEvent, itemHref: string) => {
    if (isMobile) return;
    
    const rect = event.currentTarget.getBoundingClientRect();
    setTooltipPosition({
      x: rect.right + 10,
      y: rect.top + rect.height / 2
    });
    setHoveredItem(itemHref);
  };

  const handleMouseLeave = () => {
    setHoveredItem(null);
  };

  // Load notifications
  useEffect(() => {
    if (!user?.uid) return;

    const loadUnreadCount = async () => {
      try {
        const count = await notificationService.getUnreadCount(user.uid);
        setUnreadCount(count);
      } catch (error) {
        console.error('Error loading unread count:', error);
      }
    };

    const setupNotifications = async () => {
      try {
        // Set up real-time listener for notifications
        const unsubscribe = await notificationService.loadNotifications(user.uid, (notifications) => {
          const unread = notifications.filter(n => n.status === 'unread').length;
          setUnreadCount(unread);
        });
        
        loadUnreadCount();
        
        return unsubscribe;
      } catch (error) {
        console.error('Error setting up notifications:', error);
      }
    };

    setupNotifications();
  }, [user]);

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Mobile Overlay */}
      {sidebarOpen && isMobile && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            zIndex: 999
          }}
          onClick={() => setSidebarOpen(false)}
        />
      )}
      
      {/* Responsive Sidebar */}
      <div 
        className={`sidebar ${sidebarOpen ? 'open' : ''}`}
        style={{
          width: isMobile ? (sidebarOpen ? '280px' : '0') : '80px',
          background: 'var(--gray-900)',
          borderRight: '1px solid var(--gray-800)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: isMobile ? 'stretch' : 'center',
          padding: isMobile ? '1rem' : '1rem 0',
          position: 'fixed',
          left: 0,
          top: 0,
          height: '100vh',
          zIndex: 1000,
          transition: 'all var(--transition-normal)',
          overflowY: 'auto',
          overflowX: 'hidden',
          transform: isMobile && !sidebarOpen ? 'translateX(-100%)' : 'translateX(0)'
        }}
      >
        {/* Logo */}
        <div style={{
          width: isMobile ? 'auto' : '48px',
          height: '48px',
          background: 'var(--gradient-primary)',
          borderRadius: '12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '2rem',
          boxShadow: 'var(--shadow-md)',
          flexShrink: 0,
          overflow: 'hidden'
        }}>
          <img 
            src="/logo.svg" 
            alt="DriftPro" 
            style={{
              width: '32px',
              height: '32px',
              objectFit: 'contain'
            }}
          />
        </div>

        {/* Navigation Items */}
        <div style={{ 
          flex: 1, 
          display: 'flex', 
          flexDirection: 'column', 
          gap: '0.5rem', 
          width: '100%',
          minHeight: 0
        }}>
          {Object.entries(groupedItems).map(([category, items]) => (
            <div key={category} style={{ width: '100%' }}>
              {/* Category Label for Mobile */}
              {isMobile && (
                <div style={{
                  padding: '0.5rem 0',
                  marginBottom: '0.5rem',
                  borderBottom: '1px solid var(--gray-800)',
                  color: 'var(--gray-400)',
                  fontSize: '0.75rem',
                  fontWeight: '600',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}>
                  {category === 'main' && 'Hovedmeny'}
                  {category === 'management' && 'Ledelse'}
                  {category === 'settings' && 'Innstillinger'}
                  {category === 'admin' && 'Administrasjon'}
                </div>
              )}
              
              {items.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <div
                    key={item.href}
                    style={{
                      position: 'relative',
                      width: '100%',
                      display: 'flex',
                      justifyContent: isMobile ? 'flex-start' : 'center',
                      marginBottom: '0.5rem'
                    }}
                    onMouseEnter={(e) => calculateTooltipPosition(e, item.href)}
                    onMouseLeave={handleMouseLeave}
                  >
                    <Link
                      href={item.href}
                      style={{
                        width: isMobile ? '100%' : '48px',
                        height: '48px',
                        borderRadius: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: isMobile ? 'flex-start' : 'center',
                        background: isActive ? 'var(--primary)' : 'transparent',
                        color: isActive ? 'white' : 'var(--gray-400)',
                        textDecoration: 'none',
                        transition: 'all var(--transition-normal)',
                        position: 'relative',
                        border: isActive ? 'none' : '1px solid transparent',
                        padding: isMobile ? '0 1rem' : '0',
                        gap: isMobile ? '0.75rem' : '0'
                      }}
                      onClick={() => {
                        setSidebarOpen(false);
                        if (isMobile) {
                          // Close sidebar on mobile after navigation
                          setTimeout(() => setSidebarOpen(false), 100);
                        }
                      }}
                    >
                      {item.icon}
                      
                      {/* Item name for mobile */}
                      {isMobile && (
                        <span style={{
                          fontSize: '0.875rem',
                          fontWeight: '500',
                          whiteSpace: 'nowrap'
                        }}>
                          {item.name}
                        </span>
                      )}
                      
                      {/* Admin Star */}
                      {item.isAdmin && (
                        <div style={{
                          position: 'absolute',
                          top: '-2px',
                          right: isMobile ? '1rem' : '-2px',
                          color: '#ef4444',
                          fontSize: '12px'
                        }}>
                          <Star size={12} fill="#ef4444" />
                        </div>
                      )}
                      
                      {/* Badge (only for non-admin items) */}
                      {item.badge && !item.isAdmin && (
                        <div style={{
                          position: 'absolute',
                          top: '-4px',
                          right: isMobile ? '1rem' : '-4px',
                          background: item.badgeColor === 'badge-danger' ? 'var(--danger)' : 'var(--primary)',
                          color: 'white',
                          fontSize: '0.625rem',
                          fontWeight: '600',
                          padding: '0.125rem 0.375rem',
                          borderRadius: '0.75rem',
                          minWidth: '1.25rem',
                          textAlign: 'center',
                          lineHeight: '1'
                        }}>
                          {item.badge}
                        </div>
                      )}
                    </Link>
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        {/* Logout Button */}
        <div style={{
          width: '100%',
          padding: isMobile ? '1rem 0' : '0',
          borderTop: isMobile ? '1px solid var(--gray-800)' : 'none',
          marginTop: 'auto'
        }}>
          <button
            onClick={handleLogout}
            style={{
              width: isMobile ? '100%' : '48px',
              height: '48px',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: isMobile ? 'flex-start' : 'center',
              background: 'transparent',
              color: 'var(--gray-400)',
              border: '1px solid var(--gray-700)',
              cursor: 'pointer',
              transition: 'all var(--transition-normal)',
              padding: isMobile ? '0 1rem' : '0',
              gap: isMobile ? '0.75rem' : '0'
            }}
            onMouseEnter={() => {
              if (!isMobile) {
                setTooltipPosition({ x: 80, y: window.innerHeight - 80 });
                setHoveredItem('logout');
              }
            }}
            onMouseLeave={handleMouseLeave}
          >
            <LogOut size={20} />
            {isMobile && (
              <span style={{
                fontSize: '0.875rem',
                fontWeight: '500'
              }}>
                Logg ut
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div style={{
        flex: 1,
        marginLeft: isMobile ? '0' : '80px',
        minHeight: '100vh',
        background: 'var(--gray-50)',
        transition: 'margin-left var(--transition-normal)'
      }}>
        {/* Mobile Header */}
        {isMobile && (
          <div style={{
            position: 'sticky',
            top: 0,
            background: 'white',
            borderBottom: '1px solid var(--gray-200)',
            padding: '1rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            zIndex: 100
          }}>
            {/* Mobile Menu Button */}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '1.5rem',
                color: 'var(--gray-600)',
                cursor: 'pointer',
                padding: '0.5rem',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
            </button>

            {/* Mobile Logo */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem'
            }}>
              <img 
                src="/logo.svg" 
                alt="DriftPro" 
                style={{
                  width: '32px',
                  height: '32px',
                  objectFit: 'contain'
                }}
              />
              <span style={{
                fontSize: '1.125rem',
                fontWeight: '600',
                color: 'var(--gray-900)'
              }}>
                DriftPro
              </span>
            </div>

            {/* Mobile Actions */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <NotificationBell />
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: 'var(--gradient-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: '0.875rem',
                fontWeight: '600'
              }}>
                {userProfile?.displayName?.charAt(0) || user?.email?.charAt(0) || 'U'}
              </div>
            </div>
          </div>
        )}

        {/* Desktop Header */}
        {!isMobile && (
          <div style={{
            background: 'white',
            borderBottom: '1px solid var(--gray-200)',
            padding: '1rem 2rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '1rem'
            }}>
              <h1 style={{
                fontSize: '1.5rem',
                fontWeight: '600',
                color: 'var(--gray-900)',
                margin: 0
              }}>
                {sidebarItems.find(item => item.href === pathname)?.name || 'Dashboard'}
              </h1>
            </div>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '1rem'
            }}>
              <NotificationBell />
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.5rem 1rem',
                background: 'var(--gray-100)',
                borderRadius: '8px',
                cursor: 'pointer',
                transition: 'all var(--transition-normal)'
              }}>
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: 'var(--gradient-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontSize: '0.875rem',
                  fontWeight: '600'
                }}>
                  {userProfile?.displayName?.charAt(0) || user?.email?.charAt(0) || 'U'}
                </div>
                <div>
                  <div style={{
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    color: 'var(--gray-900)'
                  }}>
                    {userProfile?.displayName || 'Bruker'}
                  </div>
                  <div style={{
                    fontSize: '0.75rem',
                    color: 'var(--gray-500)'
                  }}>
                    {userProfile?.role || 'Bruker'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Page Content */}
        <div style={{
          padding: isMobile ? '1rem' : '2rem',
          minHeight: 'calc(100vh - 80px)'
        }}>
          {children}
        </div>
      </div>

      {/* Desktop Tooltip */}
      {!isMobile && hoveredItem && (
        <div style={{
          position: 'fixed',
          left: tooltipPosition.x,
          top: tooltipPosition.y,
          transform: 'translateY(-50%)',
          background: 'var(--gray-800)',
          color: 'white',
          padding: '0.5rem 0.75rem',
          borderRadius: '6px',
          fontSize: '0.875rem',
          fontWeight: '500',
          zIndex: 1001,
          boxShadow: 'var(--shadow-lg)',
          border: '1px solid var(--gray-700)',
          animation: 'fadeIn 0.2s ease',
          pointerEvents: 'none'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span>
              {hoveredItem === 'logout' ? 'Logg ut' : sidebarItems.find(item => item.href === hoveredItem)?.name || ''}
            </span>
            {sidebarItems.find(item => item.href === hoveredItem)?.isAdmin && (
              <Star size={12} fill="#ef4444" color="#ef4444" />
            )}
          </div>
          <div style={{
            position: 'absolute',
            left: '-4px',
            top: '50%',
            transform: 'translateY(-50%)',
            width: '0',
            height: '0',
            borderTop: '4px solid transparent',
            borderBottom: '4px solid transparent',
            borderRight: '4px solid var(--gray-800)'
          }}></div>
        </div>
      )}

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div style={{
              padding: '1.5rem',
              borderBottom: '1px solid var(--gray-200)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <h3 style={{
                fontSize: 'var(--font-size-lg)',
                fontWeight: '600',
                color: 'var(--gray-900)'
              }}>
                Bekreft utlogging
              </h3>
              <button
                onClick={() => setShowLogoutModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '1.5rem',
                  color: 'var(--gray-400)',
                  cursor: 'pointer',
                  padding: '0.25rem'
                }}
              >
                ×
              </button>
            </div>
            <div style={{ padding: '1.5rem' }}>
              <p style={{ 
                marginBottom: '1.5rem', 
                color: 'var(--gray-600)',
                lineHeight: '1.6'
              }}>
                Er du sikker på at du vil logge ut? Du må logge inn på nytt for å få tilgang til systemet.
              </p>
              <div style={{ 
                display: 'flex', 
                gap: '1rem', 
                justifyContent: 'flex-end' 
              }}>
                <button
                  onClick={() => setShowLogoutModal(false)}
                  className="btn btn-secondary"
                >
                  Avbryt
                </button>
                <button
                  onClick={confirmLogout}
                  className="btn btn-danger"
                >
                  Logg ut
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateX(-10px); }
          to { opacity: 1; transform: translateX(0); }
        }
        
        /* Mobile optimizations */
        @media (max-width: 768px) {
          .sidebar {
            box-shadow: 2px 0 10px rgba(0, 0, 0, 0.1);
          }
          
          .modal-content {
            margin: 1rem;
            max-width: calc(100vw - 2rem);
          }
        }
      `}</style>
    </div>
  );
} 