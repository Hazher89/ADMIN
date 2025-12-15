// Centralized permission checking system for DriftPro
// Ensures strict access control across the entire application

import { UserProfile } from '@/contexts/AuthContext';

/**
 * Check if user has permission to access a resource
 * STRICT: Only returns true if user has explicit permission
 */
export function hasPermission(userProfile: UserProfile | null, permissionKey: string): boolean {
  if (!userProfile) return false;
  
  // Super admin has full access
  if (userProfile.role === 'super_admin') return true;
  
  // Admin has access to most things, but check specific permissions for sensitive areas
  if (userProfile.role === 'admin') {
    // Admins need explicit permission for sensitive areas
    const sensitivePermissions = ['audit', 'internkontrollOgSamsvar', 'reports', 'emailSystem', 'smsLogs'];
    if (sensitivePermissions.includes(permissionKey)) {
      return userProfile.permissions?.[permissionKey as keyof typeof userProfile.permissions] === true;
    }
    return true; // Admin has default access to most areas
  }
  
  // Department leaders - check specific permissions
  if (userProfile.role === 'department_leader') {
    // Department leaders can see their own department data
    // But need explicit permission for cross-department or admin functions
    const adminOnlyPermissions = ['audit', 'internkontrollOgSamsvar', 'reports', 'emailSystem', 'smsLogs', 'partners'];
    if (adminOnlyPermissions.includes(permissionKey)) {
      return userProfile.permissions?.[permissionKey as keyof typeof userProfile.permissions] === true;
    }
    // Default permissions for department leaders
    return userProfile.permissions?.[permissionKey as keyof typeof userProfile.permissions] === true || false;
  }
  
  // Employees - STRICT: only what they have explicit permission for
  if (userProfile.role === 'employee') {
    // Employees need explicit permission for everything except dashboard
    if (permissionKey === 'dashboard') return true;
    return userProfile.permissions?.[permissionKey as keyof typeof userProfile.permissions] === true || false;
  }
  
  return false;
}

/**
 * Check if user can view data for another user
 * STRICT: Users can only see their own data unless they have admin permissions
 */
export function canViewUserData(
  userProfile: UserProfile | null,
  targetUserId: string,
  targetDepartmentId?: string
): boolean {
  if (!userProfile) return false;
  
  // Super admin can see everything
  if (userProfile.role === 'super_admin') return true;
  
  // Admin can see all users
  if (userProfile.role === 'admin') return true;
  
  // Users can always see their own data
  if (userProfile.id === targetUserId) return true;
  
  // Department leaders can see users in their department
  if (userProfile.role === 'department_leader' && userProfile.departmentId) {
    if (targetDepartmentId && userProfile.departmentId === targetDepartmentId) {
      return userProfile.permissions?.employees === true;
    }
  }
  
  // Employees can only see their own data
  return false;
}

/**
 * Check if user can edit data
 */
export function canEdit(
  userProfile: UserProfile | null,
  resourceType: string,
  resourceOwnerId?: string
): boolean {
  if (!userProfile) return false;
  
  // Super admin can edit everything
  if (userProfile.role === 'super_admin') return true;
  
  // Admin can edit most things
  if (userProfile.role === 'admin') {
    // Check if specific permission is required for this resource type
    const permissionMap: Record<string, string> = {
      employee: 'employees',
      department: 'departments',
      document: 'documents',
      audit: 'internkontrollOgSamsvar',
      deviation: 'avvik',
      vacation: 'hrFerie',
      absence: 'hrFravær'
    };
    
    const requiredPermission = permissionMap[resourceType];
    if (requiredPermission) {
      return userProfile.permissions?.[requiredPermission as keyof typeof userProfile.permissions] === true;
    }
    return true;
  }
  
  // Department leaders can edit their department's data
  if (userProfile.role === 'department_leader') {
    // Can edit if they own it or have permission
    if (resourceOwnerId && resourceOwnerId === userProfile.id) return true;
    
    const permissionMap: Record<string, string> = {
      employee: 'employees',
      department: 'departments',
      document: 'documents'
    };
    
    const requiredPermission = permissionMap[resourceType];
    return userProfile.permissions?.[requiredPermission as keyof typeof userProfile.permissions] === true || false;
  }
  
  // Employees can only edit their own data
  if (resourceOwnerId && resourceOwnerId === userProfile.id) return true;
  
  return false;
}

/**
 * Check if user can delete data
 */
export function canDelete(
  userProfile: UserProfile | null,
  resourceType: string,
  resourceOwnerId?: string
): boolean {
  if (!userProfile) return false;
  
  // Only admin and super_admin can delete
  if (userProfile.role === 'super_admin') return true;
  if (userProfile.role === 'admin') {
    // Check specific permission for sensitive deletions
    if (resourceType === 'employee' || resourceType === 'department') {
      return userProfile.permissions?.employees === true;
    }
    return true;
  }
  
  return false;
}




