'use client';

import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { AdminStats } from '@/types';
import {
  UsersIcon,
  BuildingOffice2Icon,
  ChatBubbleLeftRightIcon,
  ExclamationTriangleIcon,
  DocumentTextIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';

export default function DashboardPage() {
  const { adminUser, selectedCompany } = useAuth();
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
          totalCompanies: 1, // Current company
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

  const statCards = [
    {
      name: 'Totale Brukere',
      value: stats.totalUsers,
      icon: UsersIcon,
      color: 'bg-blue-500',
    },
    {
      name: 'Aktive Brukere',
      value: stats.activeUsers,
      icon: UsersIcon,
      color: 'bg-green-500',
    },
    {
      name: 'Avdelinger',
      value: stats.totalDepartments,
      icon: BuildingOffice2Icon,
      color: 'bg-purple-500',
    },
    {
      name: 'Chats',
      value: stats.totalChats,
      icon: ChatBubbleLeftRightIcon,
      color: 'bg-indigo-500',
    },
    {
      name: 'Meldinger',
      value: stats.totalMessages,
      icon: ChatBubbleLeftRightIcon,
      color: 'bg-pink-500',
    },
    {
      name: 'Avvik',
      value: stats.totalDeviations,
      icon: ExclamationTriangleIcon,
      color: 'bg-red-500',
    },
    {
      name: 'Dokumenter',
      value: stats.totalDocuments,
      icon: DocumentTextIcon,
      color: 'bg-yellow-500',
    },
  ];

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
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Oversikt over bedriftsaktivitet</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat) => (
          <div
            key={stat.name}
            className="bg-white rounded-lg shadow p-6 border border-gray-200"
          >
            <div className="flex items-center">
              <div className={`p-3 rounded-lg ${stat.color}`}>
                <stat.icon className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Hurtighandlinger</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <UsersIcon className="h-6 w-6 text-blue-500 mr-3" />
            <span className="font-medium">Legg til bruker</span>
          </button>
          <button className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <BuildingOffice2Icon className="h-6 w-6 text-purple-500 mr-3" />
            <span className="font-medium">Opprett avdeling</span>
          </button>
          <button className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <ChartBarIcon className="h-6 w-6 text-green-500 mr-3" />
            <span className="font-medium">Se rapporter</span>
          </button>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Siste Aktivitet</h2>
        {stats.recentActivity.length === 0 ? (
          <p className="text-gray-500 text-center py-8">Ingen aktivitet å vise</p>
        ) : (
          <div className="space-y-4">
            {stats.recentActivity.map((activity, index) => (
              <div key={index} className="flex items-center p-3 border border-gray-100 rounded-lg">
                <div className="flex-shrink-0">
                  <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                    <UsersIcon className="h-4 w-4 text-blue-600" />
                  </div>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-900">{activity.userName}</p>
                  <p className="text-sm text-gray-500">{activity.type}</p>
                </div>
                <div className="ml-auto">
                  <p className="text-sm text-gray-500">
                    {activity.timestamp.toLocaleDateString('no-NO')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 