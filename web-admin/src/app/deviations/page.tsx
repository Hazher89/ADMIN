'use client';

import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { Deviation, User, Department } from '@/types';
import {
  MagnifyingGlassIcon,
  EyeIcon,
  ExclamationTriangleIcon,
  UserIcon,
  BuildingOffice2Icon,
  ClockIcon,
} from '@heroicons/react/24/outline';

export default function DeviationsPage() {
  const { selectedCompany } = useAuth();
  const [deviations, setDeviations] = useState<Deviation[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');

  useEffect(() => {
    const fetchData = async () => {
      if (!selectedCompany) return;

      try {
        // Fetch deviations
        const deviationsRef = collection(db, 'deviations');
        const deviationsQuery = query(
          deviationsRef,
          where('companyId', '==', selectedCompany),
          orderBy('createdAt', 'desc')
        );
        const deviationsSnapshot = await getDocs(deviationsQuery);
        
        const deviationsData = deviationsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate(),
          updatedAt: doc.data().updatedAt?.toDate(),
          resolvedAt: doc.data().resolvedAt?.toDate(),
        })) as Deviation[];

        setDeviations(deviationsData);

        // Fetch users
        const usersRef = collection(db, 'users');
        const usersQuery = query(usersRef, where('companyId', '==', selectedCompany));
        const usersSnapshot = await getDocs(usersQuery);
        
        const usersData = usersSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate(),
          lastLoginAt: doc.data().lastLoginAt?.toDate(),
        })) as User[];

        setUsers(usersData);

        // Fetch departments
        const departmentsRef = collection(db, 'departments');
        const departmentsQuery = query(departmentsRef, where('companyId', '==', selectedCompany));
        const departmentsSnapshot = await getDocs(departmentsQuery);
        
        const departmentsData = departmentsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate(),
        })) as Department[];

        setDepartments(departmentsData);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedCompany]);

  const filteredDeviations = deviations.filter(deviation => {
    const matchesSearch = deviation.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         deviation.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || deviation.status === filterStatus;
    const matchesPriority = filterPriority === 'all' || deviation.priority === filterPriority;
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'open': return 'Åpen';
      case 'in_progress': return 'Under arbeid';
      case 'resolved': return 'Løst';
      case 'closed': return 'Lukket';
      default: return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-red-100 text-red-800';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800';
      case 'resolved': return 'bg-green-100 text-green-800';
      case 'closed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'low': return 'Lav';
      case 'medium': return 'Medium';
      case 'high': return 'Høy';
      case 'critical': return 'Kritisk';
      default: return priority;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-blue-100 text-blue-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'critical': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getUserName = (userId: string) => {
    const user = users.find(u => u.id === userId);
    return user?.name || 'Ukjent bruker';
  };

  const getDepartmentName = (departmentId?: string) => {
    if (!departmentId) return 'Ingen avdeling';
    const department = departments.find(d => d.id === departmentId);
    return department?.name || 'Ukjent avdeling';
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('no-NO');
  };

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
        <h1 className="text-2xl font-bold text-gray-900">Avvik</h1>
        <p className="text-gray-600">Oversikt over alle rapporterte avvik</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Søk etter avvik..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">Alle statuser</option>
            <option value="open">Åpen</option>
            <option value="in_progress">Under arbeid</option>
            <option value="resolved">Løst</option>
            <option value="closed">Lukket</option>
          </select>
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">Alle prioriteringer</option>
            <option value="low">Lav</option>
            <option value="medium">Medium</option>
            <option value="high">Høy</option>
            <option value="critical">Kritisk</option>
          </select>
        </div>
      </div>

      {/* Deviations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredDeviations.map((deviation) => (
          <div
            key={deviation.id}
            className="bg-white rounded-lg shadow border border-gray-200 p-6 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center">
                <ExclamationTriangleIcon className="h-6 w-6 text-red-500 mr-3" />
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{deviation.title}</h3>
                  <div className="flex space-x-2 mt-1">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(deviation.status)}`}>
                      {getStatusLabel(deviation.status)}
                    </span>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(deviation.priority)}`}>
                      {getPriorityLabel(deviation.priority)}
                    </span>
                  </div>
                </div>
              </div>
              <button className="text-blue-600 hover:text-blue-900">
                <EyeIcon className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3">
              <p className="text-sm text-gray-600 line-clamp-3">{deviation.description}</p>

              <div className="space-y-2 text-sm text-gray-500">
                <div className="flex items-center">
                  <UserIcon className="h-4 w-4 mr-2" />
                  <span>Rapportert av: {getUserName(deviation.reportedBy)}</span>
                </div>

                {deviation.assignedTo && (
                  <div className="flex items-center">
                    <UserIcon className="h-4 w-4 mr-2" />
                    <span>Tildelt til: {getUserName(deviation.assignedTo)}</span>
                  </div>
                )}

                <div className="flex items-center">
                  <BuildingOffice2Icon className="h-4 w-4 mr-2" />
                  <span>Avdeling: {getDepartmentName(deviation.departmentId)}</span>
                </div>

                <div className="flex items-center">
                  <ClockIcon className="h-4 w-4 mr-2" />
                  <span>Opprettet: {formatDate(deviation.createdAt)}</span>
                </div>
              </div>

              {deviation.location && (
                <div className="text-sm text-gray-500">
                  <span className="font-medium">Lokasjon:</span> {deviation.location}
                </div>
              )}

              {deviation.attachments.length > 0 && (
                <div className="text-sm text-gray-500">
                  <span className="font-medium">Vedlegg:</span> {deviation.attachments.length} fil(er)
                </div>
              )}

              {deviation.comments.length > 0 && (
                <div className="text-sm text-gray-500">
                  <span className="font-medium">Kommentarer:</span> {deviation.comments.length} kommentar(er)
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {filteredDeviations.length === 0 && (
        <div className="text-center py-12">
          <ExclamationTriangleIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">
            {searchTerm ? 'Ingen avvik funnet' : 'Ingen avvik rapportert ennå'}
          </p>
        </div>
      )}
    </div>
  );
} 