'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  User,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  updateProfile,
  sendPasswordResetEmail
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';

interface UserProfile {
  id: string;
  displayName: string;
  email: string;
  phone?: string;
  departmentId?: string;
  position?: string;
  role: 'admin' | 'department_leader' | 'employee';
  avatar?: string;
  createdAt: string;
  bio?: string;
  address?: string;
  emergencyContact?: string;
}

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isDepartmentLeader: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (email: string, password: string, displayName: string) => Promise<void>;
  updateUserProfile: (data: Partial<UserProfile>) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Only run on client side and if Firebase is available
    if (typeof window === 'undefined' || !auth) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      
      if (user && db) {
        // Fetch user profile from Firestore
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            const data = userDoc.data();
            const userProfile: UserProfile = {
              id: user.uid,
              displayName: data.displayName || user.displayName || 'Ny bruker',
              email: data.email || user.email || '',
              phone: data.phone || undefined,
              departmentId: data.departmentId || undefined,
              position: data.position || undefined,
              role: data.role || 'employee',
              avatar: data.avatar || undefined,
              createdAt: data.createdAt || new Date().toISOString(),
              bio: data.bio || undefined,
              address: data.address || undefined,
              emergencyContact: data.emergencyContact || undefined
            };
            setUserProfile(userProfile);
          } else {
            // Create default profile if it doesn't exist
            const defaultProfile: UserProfile = {
              id: user.uid,
              displayName: user.displayName || 'Ny bruker',
              email: user.email || '',
              role: 'employee',
              createdAt: new Date().toISOString(),
            };
            await setDoc(doc(db, 'users', user.uid), defaultProfile);
            setUserProfile(defaultProfile);
          }
        } catch (error) {
          console.error('Error fetching user profile:', error);
          // Set a minimal profile to prevent errors
          const fallbackProfile: UserProfile = {
            id: user.uid,
            displayName: user.displayName || 'Ny bruker',
            email: user.email || '',
            role: 'employee',
            createdAt: new Date().toISOString(),
          };
          setUserProfile(fallbackProfile);
        }
      } else {
        setUserProfile(null);
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const login = async (email: string, password: string) => {
    if (!auth) throw new Error('Firebase not initialized');
    
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error: unknown) {
      throw new Error(error instanceof Error ? error.message : 'En feil oppstod');
    }
  };

  const logout = async () => {
    if (!auth) throw new Error('Firebase not initialized');
    
    try {
      await signOut(auth);
    } catch (error: unknown) {
      throw new Error(error instanceof Error ? error.message : 'En feil oppstod');
    }
  };

  const register = async (email: string, password: string, displayName: string) => {
    if (!auth || !db) throw new Error('Firebase not initialized');
    
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Update display name
      await updateProfile(user, { displayName });
      
      // Create user profile in Firestore
      const userProfile: UserProfile = {
        id: user.uid,
        displayName,
        email,
        role: 'employee',
        createdAt: new Date().toISOString(),
      };
      
      await setDoc(doc(db, 'users', user.uid), userProfile);
    } catch (error: unknown) {
      throw new Error(error instanceof Error ? error.message : 'En feil oppstod');
    }
  };

  const updateUserProfile = async (data: Partial<UserProfile>) => {
    if (!user || !db) throw new Error('No user logged in or Firebase not initialized');
    
    try {
      await updateDoc(doc(db, 'users', user.uid), data);
      setUserProfile(prev => prev ? { ...prev, ...data } : null);
    } catch (error: unknown) {
      throw new Error(error instanceof Error ? error.message : 'En feil oppstod');
    }
  };

  const resetPassword = async (email: string) => {
    if (!auth) throw new Error('Firebase not initialized');
    
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error: unknown) {
      throw new Error(error instanceof Error ? error.message : 'En feil oppstod');
    }
  };

  const value = {
    user,
    userProfile,
    isAuthenticated: !!user,
    isAdmin: userProfile?.role === 'admin',
    isDepartmentLeader: userProfile?.role === 'department_leader',
    loading,
    login,
    logout,
    register,
    updateUserProfile,
    resetPassword,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    // Return a safe default instead of throwing an error
    return {
      user: null,
      userProfile: null,
      isAuthenticated: false,
      isAdmin: false,
      isDepartmentLeader: false,
      loading: true,
      login: async () => { throw new Error('Auth not initialized'); },
      logout: async () => { throw new Error('Auth not initialized'); },
      register: async () => { throw new Error('Auth not initialized'); },
      updateUserProfile: async () => { throw new Error('Auth not initialized'); },
      resetPassword: async () => { throw new Error('Auth not initialized'); },
    };
  }
  return context;
} 