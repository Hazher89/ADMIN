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
import { doc, getDoc, setDoc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
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
              emergencyContact: data.emergencyContact || undefined,
              companyName: data.companyName || undefined, // Add company information
              companyId: data.companyId || undefined
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

  const login = async (email: string, password: string, companyId?: string) => {
    if (!auth) throw new Error('Firebase not initialized');
    if (!companyId) throw new Error('Ingen bedrift valgt. Vennligst velg en bedrift først.');
    if (!db) throw new Error('Database ikke tilgjengelig.');
    
    try {
      // FIRST: Check if user exists and validate company access BEFORE authentication
      const usersQuery = query(collection(db, 'users'), where('email', '==', email));
      const userSnapshot = await getDocs(usersQuery);
      
      if (userSnapshot.empty) {
        throw new Error('Bruker ikke funnet. Kontakt administrator.');
      }
      
      const userDoc = userSnapshot.docs[0];
      const userData = userDoc.data();
      
      // Check if user has a companyId
      if (!userData.companyId) {
        throw new Error('Brukeren har ikke tilknytning til noen bedrift. Kontakt administrator.');
      }
      
      // Check if user belongs to the selected company
      if (userData.companyId !== companyId) {
        throw new Error(`Sikkerhetsbrudd: Du har ikke tilgang til ${companyId}. Du blir logget ut umiddelbart.`);
      }
      
      // Check if user has been set up with Firebase Authentication
      if (!userData.uid) {
        // For DriftPro admin, we'll create the Firebase user if it doesn't exist
        if (userData.companyId === 'driftpro_main' && userData.role === 'admin') {
          console.log('Creating Firebase user for DriftPro admin');
          // Update the user document with the Firebase UID after authentication
          const userCredential = await signInWithEmailAndPassword(auth, email, password);
          await updateDoc(doc(db, 'users', userDoc.id), {
            uid: userCredential.user.uid,
            updatedAt: new Date().toISOString()
          });
          return;
        } else {
          throw new Error('Brukeren er ikke fullstendig satt opp (mangler Firebase UID). Kontakt administrator for å få nytt passord.');
        }
      }
      
      if (userData.status !== 'active') {
        throw new Error(`Brukeren er ikke aktivert (status: ${userData.status || 'unknown'}). Kontakt administrator for å få nytt passord.`);
      }
      
      // ONLY NOW: Proceed with Firebase authentication
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      
    } catch (error: unknown) {
      console.error('🚨 LOGIN ERROR:', error);
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