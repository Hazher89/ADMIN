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
  role: 'admin' | 'department_leader' | 'employee' | 'super_admin' | 'driver';
  avatar?: string;
  createdAt: string;
  bio?: string;
  address?: string;
  emergencyContact?: string;
  companyName?: string; // Add company information
  companyId?: string; // Add company ID for isolation
  passwordSet?: boolean; // Track if password has been set
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
  forgotPassword: (email: string) => Promise<any>;
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
              companyId: data.companyId || undefined,
              passwordSet: data.passwordSet || false
            };
            setUserProfile(userProfile);
          } else {
            // Don't create a default profile without companyId
            // This should not happen for properly created employees
            console.error('🚨 User profile not found in Firestore:', user.uid);
            console.log('This usually means the employee was not properly created in the system');
            setUserProfile(null);
          }
        } catch (error) {
          console.error('Error fetching user profile:', error);
          // Don't create a fallback profile without companyId
          console.error('🚨 Failed to load user profile, setting to null');
          setUserProfile(null);
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
      
      let userDoc;
      let userData;
      
      if (userSnapshot.empty) {
        // Special handling for superadmin - try to authenticate first and then create profile
        if (email === 'baxigsti@hotmail.de' && companyId === 'driftpro_main') {
          console.log('Attempting superadmin login...');
          const userCredential = await signInWithEmailAndPassword(auth, email, password);
          const user = userCredential.user;
          
          // Create superadmin profile if it doesn't exist
          const userRef = doc(db, 'users', user.uid);
          const userDocSnap = await getDoc(userRef);
          
          if (!userDocSnap.exists()) {
            // Create DriftPro main company if it doesn't exist
            const companyRef = doc(db, 'companies', 'driftpro_main');
            const companyDoc = await getDoc(companyRef);
            
            if (!companyDoc.exists()) {
              await setDoc(companyRef, {
                id: 'driftpro_main',
                name: 'DriftPro Administrasjon',
                industry: 'Software',
                employees: 1,
                location: 'Norge',
                phone: '+47 12345678',
                email: 'admin@driftpro.no',
                website: 'https://admin.driftpro.no',
                status: 'active',
                joinedDate: new Date().toISOString(),
                revenue: 'N/A',
                description: 'Hovedadministrasjon for DriftPro systemet',
                adminUserId: user.uid,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                orgNumber: '123456789',
                address: {
                  street: 'DriftPro Gate 1',
                  city: 'Oslo',
                  postalCode: '0001',
                  country: 'Norge'
                },
                contactPerson: {
                  name: 'Super Administrator',
                  email: email,
                  phone: '+47 12345678',
                  position: 'Super Administrator'
                }
              });
            }
            
            // Create superadmin user profile
            await setDoc(userRef, {
              id: user.uid,
              displayName: 'Super Administrator',
              email: email,
              role: 'super_admin',
              companyId: 'driftpro_main',
              status: 'active',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              hireDate: new Date().toISOString(),
              position: 'Super Administrator',
              departmentId: 'admin',
              bio: 'Super Administrator for DriftPro systemet',
              avatar: '',
              phone: '',
              address: '',
              emergencyContact: '',
              birthDate: '',
              salary: 0,
              managerId: '',
              employeeNumber: 'SA001',
              taxId: '',
              bankAccount: '',
              insuranceNumber: '',
              skills: ['Administration', 'System Management', 'User Management'],
              certifications: ['Super Admin Certification'],
              education: 'System Administration',
              workExperience: 'DriftPro Super Administrator'
            });
          }
          
          return; // Superadmin login successful
        } else {
          throw new Error('Bruker ikke funnet. Kontakt administrator.');
        }
      }
      
      userDoc = userSnapshot.docs[0];
      userData = userDoc.data();
      
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

  const forgotPassword = async (email: string) => {
    try {
      // Use our custom forgot password API instead of Firebase's built-in function
      const response = await fetch('/api/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Kunne ikke sende e-post for tilbakestilling av passord');
      }

      return result;
    } catch (error) {
      console.error('Error sending password reset email:', error);
      throw error;
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
    isAdmin: userProfile?.role === 'admin' || userProfile?.role === 'super_admin',
    isDepartmentLeader: userProfile?.role === 'department_leader',
    loading,
    login,
    logout,
    register,
    updateUserProfile,
    resetPassword,
    forgotPassword,
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
      forgotPassword: async () => { throw new Error('Auth not initialized'); },
    };
  }
  return context;
} 