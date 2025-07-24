'use client';

import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { AdminStats } from '@/types';
import {
  ChartBarIcon,
  UsersIcon,
  ChatBubbleLeftRightIcon,
  ExclamationTriangleIcon,
  DocumentTextIcon,
  CalendarIcon,
} from '@heroicons/react/24/outline';

export default function ReportsPage() {
  const { selectedCompany } = useAuth();
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    activeUsers: 0,
    totalCompanies: 0,
    activeCompanies: 0,
    totalDepartments: 0,
    totalChats: 0,
    totalMessages: 0,
    totalDeviations: 0,
    totalDocuments: 0,
    recentActivity: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      if (!selectedCompany) return;

      try {
        // Fetch users
        const usersRef = collection(db, 'users');
        const usersQuery = query(usersRef, where('companyId', '==', selectedCompany));
        const usersSnapshot = await getDocs(usersQuery);
        const totalUsers = usersSnapshot.size;
        const activeUsers = usersSnapshot.docs.filter(doc => doc.data().isActive).length;

        // Fetch departments
        const departmentsRef = collection(db, 'departments');
        const departmentsQuery = query(departmentsRef, where('companyId', '==', selectedCompany));
        const departmentsSnapshot = await getDocs(departmentsQuery);
        const totalDepartments = departmentsSnapshot.size;

        // Fetch chats
        const chatsRef = collection(db, 'chats');
        const chatsQuery = query(chatsRef, where('companyId', '==', selectedCompany));
        const chatsSnapshot = await getDocs(chatsQuery);
        const totalChats = chatsSnapshot.size;

        // Fetch messages
        const messagesRef = collection(db, 'messages');
        const messagesQuery = query(messagesRef, where('companyId', '==', selectedCompany));
        const messagesSnapshot = await getDocs(messagesQuery);
        const totalMessages = messagesSnapshot.size;

        // Fetch deviations
        const deviationsRef = collection(db, 'deviations');
        const deviationsQuery = query(deviationsRef, where('companyId', '==', selectedCompany));
        const deviationsSnapshot = await getDocs(deviationsQuery);
        const totalDeviations = deviationsSnapshot.size;

        // Fetch documents
        const documentsRef = collection(db, 'documents');
        const documentsQuery = query(documentsRef, where('companyId', '==', selectedCompany));
        const documentsSnapshot = await getDocs(documentsQuery);
        const totalDocuments = documentsSnapshot.size;

        setStats({
          totalUsers,
          activeUsers,
          totalCompanies: 1,
          activeCompanies: 1,
          totalDepartments,
          totalChats,
          totalMessages,
          totalDeviations,
          totalDocuments,
          recentActivity: [],
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [selectedCompany]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Rapporter</h1>
        <p className="text-gray-600">Oversikt og analyser av bedriftsaktivitet</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-blue-500">
              <UsersIcon className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Totale Brukere</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalUsers}</p>
              <p className="text-sm text-green-600">{stats.activeUsers} aktive</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-green-500">
              <ChatBubbleLeftRightIcon className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Chats</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalChats}</p>
              <p className="text-sm text-blue-600">{stats.totalMessages} meldinger</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-red-500">
              <ExclamationTriangleIcon className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Avvik</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalDeviations}</p>
              <p className="text-sm text-red-600">Rapportert</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-yellow-500">
              <DocumentTextIcon className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Dokumenter</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalDocuments}</p>
              <p className="text-sm text-yellow-600">Opplastet</p>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Reports */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Activity Report */}
        <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Brukeraktivitet</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Aktive brukere</span>
              <span className="text-sm font-medium">{stats.activeUsers}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Inaktive brukere</span>
              <span className="text-sm font-medium">{stats.totalUsers - stats.activeUsers}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Avdelinger</span>
              <span className="text-sm font-medium">{stats.totalDepartments}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full" 
                style={{ width: `${(stats.activeUsers / stats.totalUsers) * 100}%` }}
              ></div>
            </div>
            <p className="text-xs text-gray-500">
              {Math.round((stats.activeUsers / stats.totalUsers) * 100)}% aktive brukere
            </p>
          </div>
        </div>

        {/* Communication Report */}
        <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Kommunikasjon</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Totale chats</span>
              <span className="text-sm font-medium">{stats.totalChats}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Totale meldinger</span>
              <span className="text-sm font-medium">{stats.totalMessages}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Gjennomsnitt per chat</span>
              <span className="text-sm font-medium">
                {stats.totalChats > 0 ? Math.round(stats.totalMessages / stats.totalChats) : 0}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-green-600 h-2 rounded-full" 
                style={{ width: `${Math.min((stats.totalMessages / 1000) * 100, 100)}%` }}
              ></div>
            </div>
            <p className="text-xs text-gray-500">
              {stats.totalMessages} meldinger totalt
            </p>
          </div>
        </div>

        {/* Deviations Report */}
        <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Avvikshåndtering</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Totale avvik</span>
              <span className="text-sm font-medium">{stats.totalDeviations}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Per måned (est.)</span>
              <span className="text-sm font-medium">{Math.round(stats.totalDeviations / 12)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Per avdeling (est.)</span>
              <span className="text-sm font-medium">
                {stats.totalDepartments > 0 ? Math.round(stats.totalDeviations / stats.totalDepartments) : 0}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-red-600 h-2 rounded-full" 
                style={{ width: `${Math.min((stats.totalDeviations / 100) * 100, 100)}%` }}
              ></div>
            </div>
            <p className="text-xs text-gray-500">
              Avvik per avdeling
            </p>
          </div>
        </div>

        {/* Documents Report */}
        <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Dokumenthåndtering</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Totale dokumenter</span>
              <span className="text-sm font-medium">{stats.totalDocuments}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Per bruker (est.)</span>
              <span className="text-sm font-medium">
                {stats.totalUsers > 0 ? Math.round(stats.totalDocuments / stats.totalUsers) : 0}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Per avdeling (est.)</span>
              <span className="text-sm font-medium">
                {stats.totalDepartments > 0 ? Math.round(stats.totalDocuments / stats.totalDepartments) : 0}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-yellow-600 h-2 rounded-full" 
                style={{ width: `${Math.min((stats.totalDocuments / 500) * 100, 100)}%` }}
              ></div>
            </div>
            <p className="text-xs text-gray-500">
              Dokumenter per avdeling
            </p>
          </div>
        </div>
      </div>

      {/* Export Options */}
      <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Eksporter Rapporter</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="flex items-center justify-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <CalendarIcon className="h-5 w-5 text-blue-500 mr-2" />
            <span>Månedsrapport</span>
          </button>
          <button className="flex items-center justify-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <UsersIcon className="h-5 w-5 text-green-500 mr-2" />
            <span>Brukerrapport</span>
          </button>
          <button className="flex items-center justify-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <ExclamationTriangleIcon className="h-5 w-5 text-red-500 mr-2" />
            <span>Avviksrapport</span>
          </button>
        </div>
      </div>
    </div>
  );
} 