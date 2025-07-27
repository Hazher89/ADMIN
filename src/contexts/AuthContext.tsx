'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  User as FirebaseUser,
  updateProfile,
  sendPasswordResetEmail
} from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { userService } from '@/lib/firebase-services';
import { User, UserRole } from '@/types';
import { toast } from 'react-hot-toast';

interface AuthContextType {
  currentUser: FirebaseUser | null;
  userProfile: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUserProfile: (updates: Partial<User>) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  hasPermission: (permission: string) => boolean;
  hasRole: (role: UserRole) => boolean;
  isAdmin: boolean;
  isDepartmentLeader: boolean;
  isEmployee: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      
      if (user) {
        try {
          const profile = await userService.getUser(user.uid);
          setUserProfile(profile);
        } catch (error) {
          console.error('Error fetching user profile:', error);
          toast.error('Kunne ikke hente brukerprofil');
        }
      } else {
        setUserProfile(null);
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const login = async (email: string, password: string) => {
    try {
      setLoading(true);
      await signInWithEmailAndPassword(auth, email, password);
      toast.success('Innlogget!');
    } catch (error: any) {
      console.error('Login error:', error);
      let errorMessage = 'Innlogging mislyktes';
      
      switch (error.code) {
        case 'auth/user-not-found':
          errorMessage = 'Bruker ikke funnet';
          break;
        case 'auth/wrong-password':
          errorMessage = 'Feil passord';
          break;
        case 'auth/invalid-email':
          errorMessage = 'Ugyldig e-post';
          break;
        case 'auth/user-disabled':
          errorMessage = 'Brukerkonto er deaktivert';
          break;
        case 'auth/too-many-requests':
          errorMessage = 'For mange forsøk. Prøv igjen senere';
          break;
      }
      
      toast.error(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      setLoading(true);
      await signOut(auth);
      toast.success('Utlogget!');
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Utlogging mislyktes');
    } finally {
      setLoading(false);
    }
  };

  const updateUserProfile = async (updates: Partial<User>) => {
    if (!currentUser) {
      throw new Error('Ingen bruker er innlogget');
    }

    try {
      await userService.updateUser(currentUser.uid, updates);
      
      // Update local state
      setUserProfile(prev => prev ? { ...prev, ...updates } : null);
      
      // Update Firebase Auth profile if displayName or photoURL changed
      const authUpdates: any = {};
      if (updates.displayName) authUpdates.displayName = updates.displayName;
      if (updates.photoURL) authUpdates.photoURL = updates.photoURL;
      
      if (Object.keys(authUpdates).length > 0) {
        await updateProfile(currentUser, authUpdates);
      }
      
      toast.success('Profil oppdatert!');
    } catch (error) {
      console.error('Profile update error:', error);
      toast.error('Kunne ikke oppdatere profil');
      throw error;
    }
  };

  const resetPassword = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email);
      toast.success('Passord tilbakestillingslenke sendt!');
    } catch (error: any) {
      console.error('Password reset error:', error);
      let errorMessage = 'Kunne ikke sende tilbakestillingslenke';
      
      switch (error.code) {
        case 'auth/user-not-found':
          errorMessage = 'Bruker ikke funnet';
          break;
        case 'auth/invalid-email':
          errorMessage = 'Ugyldig e-post';
          break;
      }
      
      toast.error(errorMessage);
      throw error;
    }
  };

  const hasPermission = (permission: string): boolean => {
    if (!userProfile) return false;
    
    // Admin har alle tillatelser
    if (userProfile.role === UserRole.ADMIN) return true;
    
    // Sjekk spesifikke tillatelser
    return userProfile.permissions.some(p => p.name === permission);
  };

  const hasRole = (role: UserRole): boolean => {
    return userProfile?.role === role;
  };

  const isAdmin = userProfile?.role === UserRole.ADMIN;
  const isDepartmentLeader = userProfile?.role === UserRole.DEPARTMENT_LEADER;
  const isEmployee = userProfile?.role === UserRole.EMPLOYEE;

  const value: AuthContextType = {
    currentUser,
    userProfile,
    loading,
    login,
    logout,
    updateUserProfile,
    resetPassword,
    hasPermission,
    hasRole,
    isAdmin,
    isDepartmentLeader,
    isEmployee
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 