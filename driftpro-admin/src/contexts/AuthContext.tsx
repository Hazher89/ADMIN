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
  name?: string; // Alias for displayName
  email: string;
  phone?: string;
  departmentId?: string;
  position?: string;
  role: 'admin' | 'department_leader' | 'employee' | 'super_admin' | 'driver' | 'partner_user';
  partnerId?: string; // For partner portal users
  avatar?: string;
  createdAt: string;
  bio?: string;
  address?: string;
  emergencyContact?: string;
  companyName?: string; // Add company information
  companyId?: string; // Company ID for GDPR compliance
  passwordSet?: boolean; // Track if password has been set
  permissions?: {
    dashboard?: boolean;
    employees?: boolean;
    departments?: boolean;
    projects?: boolean;
    tasks?: boolean;
    inventory?: boolean;
    suppliers?: boolean;
    finance?: boolean;
    invoicing?: boolean;
    payments?: boolean;
    hr?: boolean;
    crm?: boolean;
    delivery?: boolean;
    settings?: boolean;
    mail?: boolean;
    reports?: boolean;
    analytics?: boolean;
    notifications?: boolean;
    calendar?: boolean;
    documents?: boolean;
    training?: boolean;
    compliance?: boolean;
    maintenance?: boolean;
    quality?: boolean;
    safety?: boolean;
    procurement?: boolean;
    logistics?: boolean;
    production?: boolean;
    sales?: boolean;
    marketing?: boolean;
    customerService?: boolean;
    it?: boolean;
    legal?: boolean;
    audit?: boolean;
    internkontrollOgSamsvar?: boolean;
    internrevisjon?: boolean;
    avvik?: boolean;
    risikovurdering?: boolean;
    oppfølgingstiltak?: boolean;
    kontrollpunkter?: boolean;
    internkontrollRapporter?: boolean;
    // Sidebar sider
    chat?: boolean;
    emailSystem?: boolean;
    smsLogs?: boolean;
    partners?: boolean;
    // Logistikk System faner
    logistikkBudPriser?: boolean;
    logistikkLevering?: boolean;
    logistikkPlanlegging?: boolean;
    logistikkKunder?: boolean;
    logistikkLeverandorer?: boolean;
    logistikkProdukter?: boolean;
    logistikkLager?: boolean;
    logistikkFakturering?: boolean;
    logistikkFinans?: boolean;
    // HR faner
    hrAnsatte?: boolean;
    hrVakter?: boolean;
    hrFravær?: boolean;
    hrFerie?: boolean;
    hrAvdelinger?: boolean;
  };
  vacationAccess?: {
    canRequestVacation?: boolean;
    canApproveVacation?: boolean;
    canViewAllVacations?: boolean;
    vacationDaysPerYear?: number;
    managerApprovalRequired?: boolean;
  };
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
  forgotPassword: (email: string) => Promise<any>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);



  useEffect(() => {
    // Set a timeout to ensure loading is set to false after max 5 seconds
    const timeoutId = setTimeout(() => {
      console.warn('⚠️ Auth loading timeout - setting loading to false');
      setLoading(false);
    }, 5000);

    // Only run on client side
    if (typeof window === 'undefined') {
      clearTimeout(timeoutId);
      setLoading(false);
      return;
    }

    let unsubscribe: (() => void) | null = null;
    let hasSetLoading = false;
    let checkTimeout: NodeJS.Timeout | null = null;

    const initializeAuth = () => {
      // Check if Firebase is available
      if (!auth) {
        console.error('⚠️ Firebase auth not initialized');
        clearTimeout(timeoutId);
        setLoading(false);
        return;
      }

      try {
        // Set up auth state listener
        unsubscribe = onAuthStateChanged(auth, async (user) => {
          if (hasSetLoading) return; // Prevent multiple calls
          
          clearTimeout(timeoutId);
          if (checkTimeout) clearTimeout(checkTimeout);
          hasSetLoading = true;
          setUser(user);
          
          if (user && db) {
            try {
              // Try to fetch by UID first
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
                  companyName: data.companyName || undefined, // Optional legacy field
                  passwordSet: data.passwordSet || false,
                  permissions: data.permissions || undefined,
                  vacationAccess: data.vacationAccess || undefined
                };
                setUserProfile(userProfile);
              } else {
                // Auto-fix: try to find by email and migrate to uid-based doc
                console.warn('⚠️ User doc not found by UID, trying email lookup for', user.email);
                const emailQuery = query(collection(db, 'users'), where('email', '==', user.email));
                const emailSnapshot = await getDocs(emailQuery);

                if (!emailSnapshot.empty) {
                  const fallbackDoc = emailSnapshot.docs[0];
                  const data = fallbackDoc.data() || {};
                  const mergedData: any = {
                    ...data,
                    id: user.uid,
                    uid: user.uid,
                    email: data.email || user.email || '',
                    displayName: data.displayName || user.displayName || 'Ny bruker',
                    role: data.role || 'employee',
                    updatedAt: new Date().toISOString(),
                  };

                  // Write to the correct UID-based document
                  await setDoc(doc(db, 'users', user.uid), mergedData, { merge: true });

                  const userProfile: UserProfile = {
                    id: user.uid,
                    displayName: mergedData.displayName,
                    email: mergedData.email,
                    phone: mergedData.phone || undefined,
                    departmentId: mergedData.departmentId || undefined,
                    position: mergedData.position || undefined,
                    role: mergedData.role || 'employee',
                    avatar: mergedData.avatar || undefined,
                    createdAt: mergedData.createdAt || new Date().toISOString(),
                    bio: mergedData.bio || undefined,
                    address: mergedData.address || undefined,
                    emergencyContact: mergedData.emergencyContact || undefined,
                    companyName: mergedData.companyName || undefined,
                    passwordSet: mergedData.passwordSet || false,
                    permissions: mergedData.permissions || undefined,
                    vacationAccess: mergedData.vacationAccess || undefined
                  };
                  
                  setUserProfile(userProfile);
                  console.log('✅ Auto-fixed missing UID document for user via email lookup');
                } else {
                  console.error('🚨 User profile not found in Firestore by UID or email. Creating minimal profile...');
                  const minimalProfile = {
                    id: user.uid,
                    uid: user.uid,
                    email: user.email || '',
                    displayName: user.displayName || 'Ny bruker',
                    role: 'employee',
                    status: 'active',
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                    passwordSet: true,
                    permissions: {
                      dashboard: true,
                      notifications: true,
                      calendar: true,
                      internkontrollOgSamsvar: false,
                    }
                  };

                  await setDoc(doc(db, 'users', user.uid), minimalProfile, { merge: true });

                  const userProfile: UserProfile = {
                    id: user.uid,
                    displayName: minimalProfile.displayName,
                    email: minimalProfile.email,
                    role: 'employee',
                    createdAt: minimalProfile.createdAt,
                    avatar: undefined,
                    permissions: minimalProfile.permissions,
                    vacationAccess: undefined,
                  };

                  setUserProfile(userProfile);
                  console.log('✅ Created minimal profile for user:', user.uid);
                }
              }
            } catch (error) {
              console.error('Error fetching user profile:', error);
              console.error('🚨 Failed to load user profile, setting to null');
              setUserProfile(null);
            }
          } else {
            setUserProfile(null);
          }
          
          setLoading(false);
        });

        // If no user is logged in, set loading to false after a short delay
        // This handles the case where onAuthStateChanged doesn't fire immediately
        if (!auth.currentUser) {
          checkTimeout = setTimeout(() => {
            if (!hasSetLoading && !auth?.currentUser) {
              console.log('No user logged in, setting loading to false');
              clearTimeout(timeoutId);
              hasSetLoading = true;
              setLoading(false);
            }
          }, 1000);
        }
      } catch (error) {
        console.error('Error setting up auth state listener:', error);
        clearTimeout(timeoutId);
        setLoading(false);
      }
    };

    // Try to initialize immediately
    if (auth) {
      initializeAuth();
    } else {
      // Wait a bit for Firebase to initialize, but not too long
      const initTimeout = setTimeout(() => {
        initializeAuth();
      }, 200);
      
      return () => {
        clearTimeout(timeoutId);
        clearTimeout(initTimeout);
        if (unsubscribe) unsubscribe();
      };
    }

    return () => {
      clearTimeout(timeoutId);
      if (checkTimeout) clearTimeout(checkTimeout);
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string) => {
    if (!auth) throw new Error('Firebase not initialized');
    if (!db) throw new Error('Database ikke tilgjengelig.');
    
    try {
      // Special handling for superadmin - check FIRST before anything else
      if (email === 'baxigshti@hotmail.de') {
          console.log('Attempting superadmin login...');
          const userCredential = await signInWithEmailAndPassword(auth, email, password);
          const user = userCredential.user;
          
        // Create or update superadmin profile
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
            uid: user.uid, // Make sure uid is set
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
        } else {
          // Update existing profile to ensure uid is set
          const existingData = userDocSnap.data();
          if (!existingData.uid || existingData.uid !== user.uid) {
            await updateDoc(userRef, {
              uid: user.uid,
              id: user.uid,
              updatedAt: new Date().toISOString()
            });
          }
          }
          
          return; // Superadmin login successful
      }
      
      // For all other users, check if user exists and get their companyId
      const usersQuery = query(collection(db, 'users'), where('email', '==', email));
      const userSnapshot = await getDocs(usersQuery);
      
      if (userSnapshot.empty) {
          throw new Error('Bruker ikke funnet. Kontakt administrator.');
      }
      
      const userDoc = userSnapshot.docs[0];
      const userData = userDoc.data();

      // Ensure companyId exists (DriftPro is single-company: Mavi)
      if (!userData.companyId) {
        console.warn('⚠️ companyId mangler på bruker, setter til "mavi"');
        await updateDoc(userDoc.ref, { companyId: 'mavi', updatedAt: new Date().toISOString() });
        userData.companyId = 'mavi';
      }
      
      // Note: companyId check removed - DriftPro is now only for Mavi Logistikk
      // All users automatically belong to Mavi Logistikk
      
      // AUTO-FIX: If uid is missing, try to get it from Firebase Auth and update Firestore
      if (!userData.uid) {
        console.warn('⚠️ User missing uid field, attempting auto-fix...');
        
        try {
          // Try to sign in to get Firebase Auth user
          const userCredential = await signInWithEmailAndPassword(auth, email, password);
          const firebaseUser = userCredential.user;
          
          // Update Firestore with the uid
          await updateDoc(userDoc.ref, {
            uid: firebaseUser.uid,
            id: firebaseUser.uid, // Also ensure id matches
            updatedAt: new Date().toISOString()
          });
          
          console.log('✅ Auto-fixed missing uid field for user:', email);
          // Continue with login - uid is now set
        } catch (autoFixError) {
          // If we can't sign in, uid fix failed
          console.error('❌ Could not auto-fix missing uid:', autoFixError);
          throw new Error('Brukeren er ikke fullstendig satt opp (mangler Firebase UID). Kontakt administrator for å få nytt passord.');
        }
      }
      
      // SECONDARY CHECK: Ensure uid matches the document ID if id exists
      if (userData.id && userData.uid && userData.uid !== userData.id) {
        console.warn('⚠️ User uid does not match id field, attempting auto-fix...');
        try {
          await updateDoc(userDoc.ref, {
            uid: userData.id, // Use id as source of truth if they differ
            updatedAt: new Date().toISOString()
          });
          console.log('✅ Auto-fixed uid/id mismatch for user:', email);
        } catch (fixError) {
          console.error('❌ Could not auto-fix uid/id mismatch:', fixError);
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
      login: async (email: string, password: string) => { throw new Error('Auth not initialized'); },
      logout: async () => { throw new Error('Auth not initialized'); },
      register: async () => { throw new Error('Auth not initialized'); },
      updateUserProfile: async () => { throw new Error('Auth not initialized'); },
      resetPassword: async () => { throw new Error('Auth not initialized'); },
      forgotPassword: async () => { throw new Error('Auth not initialized'); },
    };
  }
  return context;
}