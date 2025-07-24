'use client';

import React, { createContext, useContext, useState } from 'react';
import { Company, User } from '@/types';

interface AuthContextType {
  currentUser: User | null;
  adminUser: User | null;
  selectedCompany: Company | null;
  setSelectedCompany: (company: Company | null) => void;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [adminUser, setAdminUser] = useState<User | null>(null);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(false);

  const login = async (email: string, password: string) => {
    setLoading(true);
    
    // Mock user data
    const mockUser: User = {
      id: 'admin1',
      email: email,
      firstName: 'Admin',
      lastName: 'Bruker',
      role: 'admin',
      companyId: selectedCompany?.id || '1',
      departmentId: 'dept1',
      isActive: true,
      permissions: ['read', 'write', 'admin'],
      createdAt: new Date(),
      updatedAt: new Date(),
      lastLoginAt: new Date(),
      profileImageURL: null,
      phoneNumber: '+47 123 45 678',
      position: 'System Administrator'
    };

    setCurrentUser(mockUser);
    setAdminUser(mockUser);
    setLoading(false);
  };

  const logout = async () => {
    setCurrentUser(null);
    setAdminUser(null);
    setSelectedCompany(null);
  };

  const value = {
    currentUser,
    adminUser,
    selectedCompany,
    setSelectedCompany,
    login,
    logout,
    loading
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
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 