'use client';

import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { hasPermission } from '@/lib/permissions';
import AccessDenied from './AccessDenied';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

interface WithAuthOptions {
  requiredPermission?: string;
  allowedRoles?: string[];
  redirectTo?: string;
  showAccessDenied?: boolean;
}

/**
 * Higher-order component to protect pages with authentication and authorization
 * Usage: export default withAuth(MyComponent, { requiredPermission: 'employees' });
 */
export function withAuth<P extends object>(
  Component: React.ComponentType<P>,
  options: WithAuthOptions = {}
) {
  return function AuthenticatedComponent(props: P) {
    const { userProfile, loading, isAuthenticated } = useAuth();
    const router = useRouter();
    const {
      requiredPermission,
      allowedRoles,
      redirectTo = '/dashboard',
      showAccessDenied = true
    } = options;

    useEffect(() => {
      // Wait for auth to load
      if (loading) return;

      // Check authentication
      if (!isAuthenticated || !userProfile) {
        router.push('/login');
        return;
      }

      // Check role-based access
      if (allowedRoles && allowedRoles.length > 0) {
        if (!allowedRoles.includes(userProfile.role)) {
          if (showAccessDenied) {
            // Show access denied, don't redirect
            return;
          }
          router.push(redirectTo);
          return;
        }
      }

      // Check permission-based access
      if (requiredPermission) {
        if (!hasPermission(userProfile, requiredPermission)) {
          if (showAccessDenied) {
            // Show access denied, don't redirect
            return;
          }
          router.push(redirectTo);
          return;
        }
      }
    }, [loading, isAuthenticated, userProfile, router, requiredPermission, allowedRoles, redirectTo, showAccessDenied]);

    // Show loading state
    if (loading) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Laster...</p>
          </div>
        </div>
      );
    }

    // Check authentication
    if (!isAuthenticated || !userProfile) {
      return null; // Will redirect in useEffect
    }

    // Check role-based access
    if (allowedRoles && allowedRoles.length > 0) {
      if (!allowedRoles.includes(userProfile.role)) {
        if (showAccessDenied) {
          return <AccessDenied message="Du har ikke tilgang til denne siden basert på din rolle." />;
        }
        return null; // Will redirect in useEffect
      }
    }

    // Check permission-based access
    if (requiredPermission) {
      if (!hasPermission(userProfile, requiredPermission)) {
        if (showAccessDenied) {
          return (
            <AccessDenied 
              message={`Du har ikke tilgang til denne siden. Nødvendig tilgang: ${requiredPermission}`}
            />
          );
        }
        return null; // Will redirect in useEffect
      }
    }

    // User has access, render component
    return <Component {...props} />;
  };
}

/**
 * Hook to check if user has permission
 */
export function usePermission(permission: string): boolean {
  const { userProfile } = useAuth();
  return hasPermission(userProfile, permission);
}
