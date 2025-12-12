'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { hasPermission as checkPermission } from '@/lib/permissions';
import { 
  Home, 
  Users, 
  Building, 
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
  Star,
  BookOpen,
  Target,
  Activity,
  Database,
  Globe,
  Key,
  Palette,
  Terminal,
  Handshake,
  Phone,
  DollarSign,
  FileText,
  CreditCard,
  Package,
  Box,
  Truck,
  Heart,
  UserCheck,
  CheckSquare,
  BarChart,
  MapPin,
  ShoppingCart,
  Navigation,
  Trash2
} from 'lucide-react';
import { notificationService } from '@/lib/notification-service';
import { firebaseService } from '@/lib/firebase-services';

interface SidebarItem {
  name: string;
  href: string;
  icon: React.ReactNode;
  badge?: string;
  badgeColor?: string;
  category?: string;
  isAdmin?: boolean;
  id?: string;
  permission?: string; // Permission key required to access this item
}

// Prevent pre-rendering since this layout uses usePathname
export const dynamic = 'force-dynamic';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, logout, userProfile, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  
  // Mobile state
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const [unreadCount, setUnreadCount] = useState(0);
  


  // Check if mobile on mount and resize
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // GDPR Compliance: Ensure user has a valid profile
  // Note: companyId check removed - DriftPro is now only for Mavi Logistikk
  useEffect(() => {
    if (user && userProfile) {
      // Give some time for userProfile to load completely
      const checkProfile = () => {
        // Check if this is a new employee who hasn't set up their password yet
        // But only if they're not already authenticated
        if (userProfile.email && !userProfile.passwordSet && userProfile.role === 'employee') {
          console.log('🔍 New employee detected, but they need to complete password setup first');
          // Don't redirect here, let them complete the setup process
          return;
        }
        
        // Additional check: ensure userProfile is properly loaded
        if (!userProfile.id || !userProfile.email) {
          console.error('🚨 Security breach: Incomplete user profile:', userProfile);
          alert('Ufullstendig brukerprofil oppdaget. Du blir logget ut.');
          logout();
          router.push('/login');
          return;
        }
      };

      // Delay the check to allow profile to load
      const timeoutId = setTimeout(checkProfile, 1000);
      
      return () => clearTimeout(timeoutId);
    } else if (user && !userProfile && !loading) {
      // User is authenticated but no profile found - this is a problem
      // Only show error if we're not still loading
      console.error('🚨 User authenticated but no profile found:', user.uid);
      console.log('This usually means the employee was not properly created in the system');
      alert('Brukerprofil ikke funnet. Kontakt administrator.');
      logout();
      router.push('/login');
    }
  }, [user, userProfile, logout, router]);

  // Icon style helper to prevent large icons before CSS loads
  const iconStyle = { width: '20px', height: '20px', flexShrink: 0, display: 'block' };

  // Permission checking helper
  const hasAccess = (permissionKey: string): boolean => {
    return checkPermission(userProfile, permissionKey);
  };

  // Sidebar items configuration
  const allSidebarItems: SidebarItem[] = [
    // Main navigation
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: <Home size={20} style={iconStyle} />,
      category: 'main',
      id: 'dashboard',
      permission: 'dashboard'
    },
    {
      name: 'HR & Personal',
      href: '/dashboard/hr',
      icon: <Users size={20} style={iconStyle} />,
      category: 'main',
      id: 'hr',
      permission: 'hr'
    },
    {
      name: 'Logistikk System',
      href: '/dashboard/logistikk-system',
      icon: <Truck size={20} style={iconStyle} />,
      category: 'main',
      id: 'logistikk-system',
      permission: 'logistics'
    },
    {
      name: 'Internkontroll og Samsvar',
      href: '/dashboard/audit',
      icon: <Activity size={20} style={iconStyle} />,
      category: 'main',
      id: 'audit',
      permission: 'internkontrollOgSamsvar'
    },
    {
      name: 'Dokumenter',
      href: '/dashboard/documents',
      icon: <FileText size={20} style={iconStyle} />,
      category: 'main',
      id: 'documents',
      permission: 'documents'
    },
    {
      name: 'Chat',
      href: '/dashboard/chat',
      icon: <MessageSquare size={20} style={iconStyle} />,
      category: 'main',
      id: 'chat',
      permission: 'chat'
    },
    {
      name: 'E-post System',
      href: '/dashboard/email-system',
      icon: <Mail size={20} style={iconStyle} />,
      category: 'main',
      id: 'email-system',
      permission: 'emailSystem'
    },
    {
      name: 'Rapporter',
      href: '/dashboard/reports',
      icon: <BarChart3 size={20} style={iconStyle} />,
      category: 'main',
      id: 'reports',
      permission: 'reports'
    },
    {
      name: 'SMS Logg & Telefonbok',
      href: '/dashboard/sms-logs',
      icon: <Phone size={20} style={iconStyle} />,
      category: 'main',
      id: 'sms-logs',
      permission: 'smsLogs'
    },
    
    // Management
    {
      name: 'Samarbeidspartnere',
      href: '/dashboard/partners',
      icon: <Handshake size={20} style={iconStyle} />,
      category: 'management',
      id: 'partners',
      permission: 'partners'
    }
  ];

  // Filter sidebar items based on STRICT permissions
  // Only show items user has explicit permission for
  const sidebarItems = allSidebarItems.filter(item => {
    // If no permission specified, default to requiring admin (legacy items)
    if (!item.permission) {
      return userProfile?.role === 'admin' || userProfile?.role === 'super_admin';
    }
    
    // Check if user has permission for this item
    return hasAccess(item.permission);
  });


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

  // Check if cockpit is active to hide sidebar - only on advanced-planning page
  const [cockpitActive, setCockpitActive] = useState(false);
  
  useEffect(() => {
    const checkCockpit = () => {
      // Only hide Sidebar if we're on advanced-planning page AND cockpit is active
      const isAdvancedPlanning = pathname === '/dashboard/advanced-planning';
      const active = sessionStorage.getItem('cockpitActive') === 'true';
      setCockpitActive(isAdvancedPlanning && active);
    };
    
    checkCockpit();
    // Check periodically in case it changes
    const interval = setInterval(checkCockpit, 100);
    
    return () => clearInterval(interval);
  }, [pathname]);

  const isLogisticsPage = pathname === '/dashboard/logistikk-system';

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
      {!cockpitActive && (
      <div 
        className={`sidebar ${sidebarOpen ? 'open' : ''}`}
        style={{
          width: isMobile ? (sidebarOpen ? '280px' : '0') : '80px',
          background: 'var(--sidebar-bg)',
          borderRight: '1px solid var(--border-color)',
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
          overflowY: 'hidden',
          overflowX: 'hidden',
          transform: isMobile && !sidebarOpen ? 'translateX(-100%)' : 'translateX(0)'
        }}
      >
        {/* Logo */}
        <div 
          onClick={() => router.push('/dashboard')}
          style={{
            width: isMobile ? 'auto' : '48px',
            height: isMobile ? '48px' : '48px',
            background: 'var(--gradient-primary)',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '2rem',
            boxShadow: 'var(--shadow-md)',
            flexShrink: 0,
            overflow: 'hidden',
            padding: isMobile ? '0.5rem' : '0',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.05)';
            e.currentTarget.style.boxShadow = 'var(--shadow-lg)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
            e.currentTarget.style.boxShadow = 'var(--shadow-md)';
          }}
        >
          <img 
            src="/logo.svg?v=5" 
            alt="MAVI Logistikk AS" 
            style={{
              width: isMobile ? '36px' : '32px',
              height: isMobile ? '36px' : '32px',
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
          minHeight: 0,
          overflowY: 'auto',
          paddingBottom: '1rem'
        }}>
          {Object.entries(groupedItems).map(([category, items]) => (
            <div key={category} style={{ width: '100%' }}>
              {/* Category Label for Mobile */}
              {isMobile && (
                <div style={{
                  padding: '0.5rem 0',
                  marginBottom: '0.5rem',
                  borderBottom: '1px solid var(--border-color)',
                  color: 'var(--sidebar-text)',
                  fontSize: '0.75rem',
                  fontWeight: '600',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}>
                  {category === 'main' && 'Hovedmeny'}
                  {category === 'management' && 'Ledelse'}
                  {category === 'finance' && 'Finans & Regnskap'}
                  {category === 'hr' && 'HR & Personal'}
                  {category === 'inventory' && 'Lager & Inventar'}
                  {category === 'crm' && 'CRM & Kunder'}
                  {category === 'projects' && 'Prosjektstyring'}
                  {category === 'logistics' && 'Logistikk & Planlegging'}
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
                        color: isActive ? 'white' : 'var(--sidebar-text)',
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
                          <Star size={12} fill="#ef4444" style={{ width: '12px', height: '12px', flexShrink: 0 }} />
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
        </div>
      )}

      {/* Main Content */}
      <div style={{
        flex: 1,
        marginLeft: cockpitActive ? 0 : (isMobile ? '0' : '80px'),
        minHeight: '100vh',
        background: 'var(--gray-50)',
        transition: 'margin-left var(--transition-normal)'
      }}>
        {/* Mobile Header */}
        {isMobile && (
          <div style={{
            position: 'sticky',
            top: 0,
            background: 'var(--card-background)',
            borderBottom: '1px solid var(--border-color)',
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
            <div 
              onClick={() => router.push('/dashboard')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.opacity = '0.8';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.opacity = '1';
              }}
            >
              <img 
                src="/logo.svg?v=5" 
                alt="MAVI Logistikk AS" 
                style={{
                  width: '32px',
                  height: '32px',
                  objectFit: 'contain'
                }}
              />
              <span style={{
                fontSize: '1.125rem',
                fontWeight: '600',
                color: 'var(--text-color)'
              }}>
                MAVI Logistikk AS
              </span>
            </div>

            {/* Mobile Actions - Removed (now in Topbar) */}
          </div>
        )}

        {/* Desktop Header */}
        {!isMobile && (
          <div style={{
            background: 'var(--card-background)',
            borderBottom: '1px solid var(--border-color)',
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
                color: 'var(--text-color)',
                margin: 0
              }}>
                {sidebarItems.find(item => item.href === pathname)?.name || 'Dashboard'}
              </h1>
            </div>
          </div>
        )}

        {/* Page Content */}
        <div style={{
          padding: isMobile ? '0.5rem 0.75rem' : '2rem',
          // På mobil legger vi inn ekstra bunn-padding for å gi plass til bunnnavigasjonen
          paddingBottom: isMobile && !isLogisticsPage ? '5.5rem' : (isMobile ? '1rem' : '2rem'),
          minHeight: 'calc(100vh - 80px)',
          width: '100%',
          maxWidth: '100%',
          overflowX: 'hidden',
          WebkitOverflowScrolling: 'touch'
        }}>
          {children}
        </div>
      </div>

      {/* Mobil bunnnavigasjon – gjelder alle sider unntatt logistikk-systemet og cockpit */}
      {isMobile && !cockpitActive && !isLogisticsPage && (
        <div
          style={{
            position: 'fixed',
            left: 0,
            right: 0,
            bottom: 0,
            height: '60px',
            background: 'var(--card-background)',
            borderTop: '0.5px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-around',
            zIndex: 1500,
            backdropFilter: 'blur(20px)',
            boxShadow: '0 -2px 10px rgba(0, 0, 0, 0.05)',
            paddingBottom: 'env(safe-area-inset-bottom, 0)'
          }}
        >
          {[
            { id: 'dashboard', href: '/dashboard', icon: <Home size={20} style={iconStyle} />, label: 'Hjem' },
            { id: 'hr', href: '/dashboard/hr', icon: <Users size={20} style={iconStyle} />, label: 'HR' },
            { id: 'audit', href: '/dashboard/audit', icon: <Activity size={20} style={iconStyle} />, label: 'Internkontroll' },
            { id: 'documents', href: '/dashboard/documents', icon: <FileText size={20} style={iconStyle} />, label: 'Dokumenter' },
            { id: 'settings', href: '/dashboard/settings', icon: <Settings size={20} style={iconStyle} />, label: 'Innstillinger' },
          ].map(item => {
            const active = pathname === item.href;
            return (
              <button
                key={item.id}
                onClick={() => router.push(item.href)}
                style={{
                  flex: 1,
                  height: '100%',
                  border: 'none',
                  background: 'none',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: active ? 'var(--primary)' : 'var(--gray-500)',
                  fontSize: '0.6875rem',
                  fontWeight: active ? 600 : 500,
                  gap: '0.125rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  padding: '0.5rem 0.25rem',
                  touchAction: 'manipulation'
                }}
                onTouchStart={(e) => {
                  e.currentTarget.style.opacity = '0.7';
                }}
                onTouchEnd={(e) => {
                  e.currentTarget.style.opacity = '1';
                }}
              >
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '9999px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: active ? 'rgba(6, 182, 212, 0.15)' : 'transparent',
                    transition: 'all 0.2s ease',
                    transform: active ? 'scale(1.05)' : 'scale(1)'
                  }}
                >
                  {item.icon}
                </div>
                <span style={{ 
                  fontSize: '0.6875rem',
                  lineHeight: '1',
                  marginTop: '0.125rem'
                }}>{item.label}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Desktop Tooltip */}
      {!isMobile && hoveredItem && (
        <div style={{
          position: 'fixed',
          left: tooltipPosition.x,
          top: tooltipPosition.y,
          transform: 'translateY(-50%)',
          background: 'var(--card-background)',
          color: 'var(--text-color)',
          padding: '0.5rem 0.75rem',
          borderRadius: '6px',
          fontSize: '0.875rem',
          fontWeight: '500',
          zIndex: 1001,
          boxShadow: 'var(--shadow-lg)',
          border: '1px solid var(--border-color)',
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
            borderRight: '4px solid var(--card-background)'
          }}></div>
        </div>
      )}

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateX(-10px); }
          to { opacity: 1; transform: translateX(0); }
        }

        @keyframes rotate-ring {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        @keyframes rotate-ring-reverse {
          from {
            transform: rotate(360deg);
          }
          to {
            transform: rotate(0deg);
          }
        }

        @keyframes rotate-gear {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        @keyframes pulse-icon {
          0%, 100% {
            opacity: 0.95;
            transform: scale(1);
          }
          50% {
            opacity: 1;
            transform: scale(1.02);
          }
        }

        @keyframes pulse-tooth {
          0%, 100% {
            opacity: 1;
            stroke-width: 2.5;
          }
          50% {
            opacity: 0.7;
            stroke-width: 3;
          }
        }

        @keyframes flow-line {
          0%, 100% {
            opacity: 0.6;
            stroke-dasharray: 0 20;
          }
          50% {
            opacity: 1;
            stroke-dasharray: 20 0;
          }
        }

        @keyframes float-particle {
          0%, 100% {
            transform: translate(0, 0) scale(1);
            opacity: 0.6;
          }
          50% {
            transform: translate(2px, -2px) scale(1.3);
            opacity: 1;
          }
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