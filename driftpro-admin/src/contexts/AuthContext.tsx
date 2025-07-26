'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { FirebaseService, User, Company } from '../lib/firebase-service';

interface AuthContextType {
  currentUser: User | null;
  adminUser: User | null;
  selectedCompany: Company | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  setSelectedCompany: (company: Company) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [adminUser, setAdminUser] = useState<User | null>(null);
  const [selectedCompany, setSelectedCompanyState] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);

  // Listen for Firebase auth state changes
  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        try {
          // Only try to get user data if we have a selected company
          if (selectedCompany?.id) {
            const users = await FirebaseService.getUsersByCompany(selectedCompany.id);
            const user = users.find(u => u.email === firebaseUser.email);
            
            if (user) {
              setCurrentUser(user);
              setAdminUser(user);
            } else {
              console.log('User not found in current company');
              setCurrentUser(null);
              setAdminUser(null);
            }
                     } else {
             // No company selected yet, just set the Firebase user
             const displayName = firebaseUser.displayName || '';
             const nameParts = displayName.split(' ');
             
             setCurrentUser({ 
               id: firebaseUser.uid, 
               email: firebaseUser.email || '', 
               firstName: nameParts[0] || '',
               lastName: nameParts.slice(1).join(' ') || '',
               role: 'admin',
               companyId: '',
               isActive: true,
               createdAt: new Date()
             } as User);
             setAdminUser({ 
               id: firebaseUser.uid, 
               email: firebaseUser.email || '', 
               firstName: nameParts[0] || '',
               lastName: nameParts.slice(1).join(' ') || '',
               role: 'admin',
               companyId: '',
               isActive: true,
               createdAt: new Date()
             } as User);
           }
        } catch (error) {
          console.error('Error getting user data:', error);
          setCurrentUser(null);
          setAdminUser(null);
        }
      } else {
        setCurrentUser(null);
        setAdminUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [selectedCompany]);

  // Check for existing session on mount
  useEffect(() => {
    // Check localStorage for existing company selection
    const savedCompany = localStorage.getItem('driftpro_company');
    
    if (savedCompany) {
      try {
        const company = JSON.parse(savedCompany);
        setSelectedCompanyState(company);
      } catch (error) {
        console.error('Error parsing saved company:', error);
      }
    }
  }, []);

  const login = async (email: string, password: string) => {
    try {
      await FirebaseService.login(email, password);
      // The auth state listener will handle setting the user
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await FirebaseService.logout();
      setCurrentUser(null);
      setAdminUser(null);
      setSelectedCompanyState(null);
      localStorage.removeItem('driftpro_company');
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  };

  const setSelectedCompany = (company: Company) => {
    setSelectedCompanyState(company);
    localStorage.setItem('driftpro_company', JSON.stringify(company));
  };

  // Save to localStorage when state changes
  useEffect(() => {
    if (selectedCompany) {
      localStorage.setItem('driftpro_company', JSON.stringify(selectedCompany));
    } else {
      localStorage.removeItem('driftpro_company');
    }
  }, [selectedCompany]);

  const value = {
    currentUser,
    adminUser,
    selectedCompany,
    login,
    logout,
    setSelectedCompany
  };

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        color: '#3c8dbc'
      }}>
        <div style={{ textAlign: 'center' }}>
          <i className="fas fa-spinner fa-spin" style={{ fontSize: '48px', marginBottom: '20px' }}></i>
          <p>Laster...</p>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 