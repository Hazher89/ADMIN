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
  companyName?: string; // Add company information
  companyId?: string; // Add company ID for isolation
}

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isDepartmentLeader: boolean;
  loading: boolean;
  login: (email: string, password: string, companyId?: string) => Promise<void>;
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

  // Debug logging for state changes
  useEffect(() => {
    console.log('AuthContext: State changed - user:', user);
    console.log('AuthContext: State changed - userProfile:', userProfile);
    console.log('AuthContext: State changed - loading:', loading);
  }, [user, userProfile, loading]);

  useEffect(() => {
    console.log('AuthContext useEffect triggered');
    console.log('Window check:', typeof window !== 'undefined');
    console.log('Auth check:', !!auth);
    console.log('DB check:', !!db);
    
    // Only run on client side and if Firebase is available
    if (typeof window === 'undefined' || !auth) {
      console.log('AuthContext: Skipping initialization - window or auth not available');
      setLoading(false);
      return;
    }

    console.log('AuthContext: Setting up auth state listener');
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log('AuthContext: Auth state changed, user:', user);
      setUser(user);
      
      if (user && db) {
        console.log('AuthContext: User and DB available, fetching profile');
        // Fetch user profile from Firestore
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          console.log('AuthContext: User doc exists:', userDoc.exists());
          if (userDoc.exists()) {
            const data = userDoc.data();
            console.log('AuthContext: User data from Firestore:', data);
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
              emergencyContact: data.emergencyContact || undefined,
              companyName: data.companyName || undefined, // Add company information
              companyId: data.companyId || undefined
            };
            console.log('AuthContext: Created userProfile:', userProfile);
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

  const login = async (email: string, password: string, companyId?: string) => {
    if (!auth) throw new Error('Firebase not initialized');
    
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      
      // If companyId is provided, validate that user belongs to this company
      if (companyId && db) {
        const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          
          // Check if user has a companyId and if it matches the selected company
          if (!userData.companyId) {
            // User has no companyId - this is a GDPR violation
            await signOut(auth);
            throw new Error('Brukeren har ikke tilknytning til noen bedrift. Kontakt administrator.');
          }
          
          if (userData.companyId !== companyId) {
            // User doesn't belong to this company - sign out and throw error
            await signOut(auth);
            throw new Error('Du har ikke tilgang til denne bedriften. Kontakt administrator.');
          }
        } else {
          // User document doesn't exist - this is also a GDPR violation
          await signOut(auth);
          throw new Error('Brukerprofil ikke funnet. Kontakt administrator.');
        }
      }
    } catch (error: unknown) {
      throw new Error(error instanceof Error ? error.message : 'En feil oppstod');
    }
  };

  const logout = async () => {
    try {
      if (auth) {
        await signOut(auth);
      }
      setUser(null);
      setUserProfile(null);
    } catch (error) {
      console.error('Error logging out:', error);
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
      login: async (email: string, password: string, companyId?: string) => { throw new Error('Auth not initialized'); },
      logout: async () => { throw new Error('Auth not initialized'); },
      register: async () => { throw new Error('Auth not initialized'); },
      updateUserProfile: async () => { throw new Error('Auth not initialized'); },
      resetPassword: async () => { throw new Error('Auth not initialized'); },
    };
  }
  return context;
} 