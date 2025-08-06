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
  
  // Debug logging for layout
  console.log('DashboardLayout: user:', user);
  console.log('DashboardLayout: userProfile:', userProfile);
  console.log('DashboardLayout: logout function:', !!logout);

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
      if (selectedCompany) {
        try {
          const company = JSON.parse(selectedCompany);
          console.log('🔒 IMMEDIATE GDPR CHECK: Selected company:', company);
          console.log('🔒 IMMEDIATE GDPR CHECK: User companyId:', userProfile.companyId);
          
          if (userProfile.companyId !== company.id) {
            console.error('🚨 IMMEDIATE GDPR VIOLATION: User companyId does not match selected company:', {
              userEmail: user.email,
              userCompanyId: userProfile.companyId,
              selectedCompanyId: company.id,
              selectedCompanyName: company.name
            });
            alert(`Sikkerhetsbrudd: Du har ikke tilgang til ${company.name}. Du blir logget ut umiddelbart.`);
            logout();
            router.push('/companies');
            return;
          }
          
          console.log('✅ IMMEDIATE GDPR CHECK: User company matches selected company');
        } catch (error) {
          console.error('Error parsing selected company:', error);
        }
      }
    }
  }, [user, userProfile, logout, router]);
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });

  // Check if user is from DriftPro AS (has access to admin pages)
  const isDriftProAdmin = userProfile?.companyName === 'DriftPro AS';
  
  // Additional GDPR check: Validate against selected company from localStorage
  useEffect(() => {
    if (user && userProfile) {
      const selectedCompany = localStorage.getItem('selectedCompany');
      if (selectedCompany) {
        try {
          const company = JSON.parse(selectedCompany);
          console.log('🔒 COMPANY VALIDATION: Selected company:', company);
          console.log('🔒 COMPANY VALIDATION: User companyId:', userProfile.companyId);
          
          // Strict GDPR validation - no exceptions
          if (userProfile.companyId !== company.id) {
            console.error('🚨 GDPR VIOLATION: User companyId does not match selected company:', {
              userEmail: user.email,
              userCompanyId: userProfile.companyId,
              selectedCompanyId: company.id,
              selectedCompanyName: company.name
            });
            alert(`Sikkerhetsbrudd: Du har ikke tilgang til ${company.name}. Du blir logget ut.`);
            logout();
            router.push('/companies');
            return;
          }
          
          console.log('✅ COMPANY VALIDATION: User company matches selected company');
        } catch (error) {
          console.error('Error parsing selected company:', error);
        }
      }
    }
  }, [user, userProfile, logout, router]);

  // Function to calculate tooltip position
  const calculateTooltipPosition = (event: React.MouseEvent, itemHref: string) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const sidebarWidth = 80;
    const tooltipOffset = 10;
    
    setTooltipPosition({
      top: rect.top + rect.height / 2,
      left: sidebarWidth + tooltipOffset
    });
    setHoveredItem(itemHref);
  };

  // Function to handle mouse leave
  const handleMouseLeave = () => {
    setHoveredItem(null);
  };

  // Load unread notification count
  useEffect(() => {
    if (!user?.uid) return;

    const loadUnreadCount = async () => {
      const count = await notificationService.getUnreadCount(user.uid);
      setUnreadCount(count);
    };

    loadUnreadCount();
    
    // Set up real-time listener for unread count
    const setupNotifications = async () => {
      const unsubscribe = await notificationService.loadNotifications(user.uid, (notifications) => {
        const unread = notifications.filter(n => n.status === 'unread').length;
        setUnreadCount(unread);
      });

      return unsubscribe;
    };

    setupNotifications();

    return () => {
      // Cleanup will be handled by the service
    };
  }, [user]);

  const sidebarItems: SidebarItem[] = [
    // Main Navigation
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
      name: 'Avdelinger',
      href: '/dashboard/departments',
      icon: <Building size={20} />,
      category: 'main'
    },
    
    // Time Management
    {
      name: 'Fravær og ferie',
      href: '/dashboard/absence-vacation',
      icon: <Calendar size={20} />,
      category: 'time'
    },
    {
      name: 'Stemple-system',
      href: '/dashboard/stempel',
      icon: <Clock size={20} />,
      category: 'time'
    },
    {
      name: 'Skiftplan',
      href: '/dashboard/shifts',
      icon: <Calendar size={20} />,
      category: 'time'
    },
    
    // Communication & Documents
    {
      name: 'Chat',
      href: '/dashboard/chat',
      icon: <MessageSquare size={20} />,
      category: 'communication'
    },
    {
      name: 'Dokumenter',
      href: '/dashboard/documents',
      icon: <FileText size={20} />,
      category: 'communication'
    },
    {
      name: 'Varsler',
      href: '/dashboard/notifications',
      icon: <Bell size={20} />,
      category: 'communication'
    },
    
    // Management
    {
      name: 'HMS',
      href: '/dashboard/deviations',
      icon: <AlertTriangle size={20} />,
      category: 'management'
    },
    {
      name: 'Min Bedrift',
      href: '/dashboard/my-company',
      icon: <Building size={20} />,
      category: 'management'
    },
    {
      name: 'Undersøkelser',
      href: '/dashboard/surveys',
      icon: <Target size={20} />,
      category: 'management'
    },
    {
      name: 'Rapporter',
      href: '/dashboard/reports',
      icon: <BarChart3 size={20} />,
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

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            zIndex: 999,
            display: 'none'
          }}
          className="mobile-overlay"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      
      {/* Opera-Inspired Sidebar */}
      <div 
        className={`sidebar ${sidebarOpen ? 'open' : ''}`}
        style={{
          width: '80px',
          background: 'var(--gray-900)',
          borderRight: '1px solid var(--gray-800)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: '1rem 0',
          position: 'fixed',
          left: 0,
          top: 0,
          height: '100vh',
          zIndex: 1000,
          transition: 'all var(--transition-normal)',
          overflowY: 'auto',
          overflowX: 'hidden'
        }}
      >
        {/* Logo */}
        <div style={{
          width: '48px',
          height: '48px',
          background: 'var(--gradient-primary)',
          borderRadius: '12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '2rem',
          boxShadow: 'var(--shadow-md)',
          flexShrink: 0
        }}>
          <Zap size={24} color="white" />
        </div>

        {/* Navigation Icons */}
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
              {items.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <div
                    key={item.href}
                    style={{
                      position: 'relative',
                      width: '100%',
                      display: 'flex',
                      justifyContent: 'center',
                      marginBottom: '0.5rem'
                    }}
                    onMouseEnter={(e) => calculateTooltipPosition(e, item.href)}
                    onMouseLeave={handleMouseLeave}
                  >
                    <Link
                      href={item.href}
                      style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: isActive ? 'var(--primary)' : 'transparent',
                        color: isActive ? 'white' : 'var(--gray-400)',
                        textDecoration: 'none',
                        transition: 'all var(--transition-normal)',
                        position: 'relative',
                        border: isActive ? 'none' : '1px solid transparent'
                      }}
                      onClick={() => setSidebarOpen(false)}
                    >
                      {item.icon}
                      
                      {/* Admin Star */}
                      {item.isAdmin && (
                        <div style={{
                          position: 'absolute',
                          top: '-2px',
                          right: '-2px',
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
                          right: '-4px',
                          background: item.badgeColor === 'badge-danger' ? 'var(--danger)' : 'var(--primary)',
                          color: 'white',
                          fontSize: '10px',
                          fontWeight: '600',
                          padding: '2px 6px',
                          borderRadius: '8px',
                          border: '2px solid var(--gray-900)',
                          minWidth: '16px',
                          height: '16px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          {item.badge}
                        </div>
                      )}
                    </Link>


                  </div>
                );
              })}
              
              {/* Category Separator */}
              {category !== Object.keys(groupedItems)[Object.keys(groupedItems).length - 1] && (
                <div style={{
                  width: '32px',
                  height: '1px',
                  background: 'var(--gray-700)',
                  margin: '1rem auto',
                  opacity: 0.5
                }}></div>
              )}
            </div>
          ))}
        </div>



        {/* Debug logging */}
        {(() => {
          console.log('DashboardLayout: About to render logout button, user:', user);
          return null;
        })()}


      </div>

      {/* Main Content */}
      <div 
        className="main-content"
        style={{
          marginLeft: '80px',
          flex: 1,
          background: 'var(--gray-50)',
          minHeight: '100vh',
          transition: 'margin-left var(--transition-normal)'
        }}
      >
        {/* Mobile Menu Button */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="mobile-menu-btn"
        >
          {sidebarOpen ? <X size={16} /> : <Menu size={16} />}
        </button>

        {/* Page Content */}
        {children}
      </div>

      {/* Global Tooltip */}
      {hoveredItem && (
        <div style={{
          position: 'fixed',
          left: `${tooltipPosition.left}px`,
          top: `${tooltipPosition.top}px`,
          transform: 'translateY(-50%)',
          background: 'var(--gray-800)',
          color: 'white',
          padding: '0.5rem 0.75rem',
          borderRadius: '8px',
          fontSize: 'var(--font-size-sm)',
          fontWeight: '500',
          whiteSpace: 'nowrap',
          zIndex: 1001,
          boxShadow: 'var(--shadow-lg)',
          border: '1px solid var(--gray-700)',
          animation: 'fadeIn 0.2s ease',
          pointerEvents: 'none'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span>
              {sidebarItems.find(item => item.href === hoveredItem)?.name || ''}
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
      `}</style>
    </div>
  );
} 