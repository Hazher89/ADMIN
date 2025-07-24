'use client';

import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { Document, User, Department } from '@/types';
import {
  MagnifyingGlassIcon,
  EyeIcon,
  DocumentTextIcon,
  UserIcon,
  BuildingOffice2Icon,
  ClockIcon,
  ArrowDownTrayIcon,
} from '@heroicons/react/24/outline';

export default function DocumentsPage() {
  const { selectedCompany } = useAuth();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');

  useEffect(() => {
    const fetchData = async () => {
      if (!selectedCompany) return;

      try {
        // Fetch documents
        const documentsRef = collection(db, 'documents');
        const documentsQuery = query(
          documentsRef,
          where('companyId', '==', selectedCompany),
          orderBy('createdAt', 'desc')
        );
        const documentsSnapshot = await getDocs(documentsQuery);
        
        const documentsData = documentsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate(),
          updatedAt: doc.data().updatedAt?.toDate(),
        })) as Document[];

        setDocuments(documentsData);

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

  const filteredDocuments = documents.filter(document => {
    const matchesSearch = document.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         document.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'all' || document.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const getUserName = (userId: string) => {
    const user = users.find(u => u.id === userId);
    return user?.name || 'Ukjent bruker';
  };

  const getDepartmentName = (departmentId?: string) => {
    if (!departmentId) return 'Ingen avdeling';
    const department = departments.find(d => d.id === departmentId);
    return department?.name || 'Ukjent avdeling';
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('no-NO');
  };

  const getFileTypeIcon = (fileType: string) => {
    if (fileType.includes('pdf')) return '📄';
    if (fileType.includes('image')) return '🖼️';
    if (fileType.includes('video')) return '🎥';
    if (fileType.includes('audio')) return '🎵';
    return '📎';
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
        <h1 className="text-2xl font-bold text-gray-900">Dokumenter</h1>
        <p className="text-gray-600">Oversikt over alle opplastede dokumenter</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Søk etter dokument..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">Alle kategorier</option>
            <option value="manual">Manual</option>
            <option value="procedure">Prosedyre</option>
            <option value="policy">Policy</option>
            <option value="report">Rapport</option>
            <option value="other">Annet</option>
          </select>
        </div>
      </div>

      {/* Documents Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredDocuments.map((document) => (
          <div
            key={document.id}
            className="bg-white rounded-lg shadow border border-gray-200 p-6 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center">
                <DocumentTextIcon className="h-6 w-6 text-blue-500 mr-3" />
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{document.title}</h3>
                  <div className="flex items-center mt-1">
                    <span className="text-2xl mr-2">{getFileTypeIcon(document.fileType)}</span>
                    <span className="text-sm text-gray-500">{document.fileName}</span>
                  </div>
                </div>
              </div>
              <button className="text-blue-600 hover:text-blue-900">
                <EyeIcon className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3">
              {document.description && (
                <p className="text-sm text-gray-600 line-clamp-3">{document.description}</p>
              )}

              <div className="space-y-2 text-sm text-gray-500">
                <div className="flex items-center">
                  <UserIcon className="h-4 w-4 mr-2" />
                  <span>Opplastet av: {getUserName(document.uploadedBy)}</span>
                </div>

                <div className="flex items-center">
                  <BuildingOffice2Icon className="h-4 w-4 mr-2" />
                  <span>Avdeling: {getDepartmentName(document.departmentId)}</span>
                </div>

                <div className="flex items-center">
                  <ClockIcon className="h-4 w-4 mr-2" />
                  <span>Opprettet: {formatDate(document.createdAt)}</span>
                </div>

                <div className="flex items-center">
                  <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
                  <span>Nedlastinger: {document.downloads}</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">
                  {formatFileSize(document.fileSize)}
                </span>
                <span className="text-sm text-gray-500">
                  v{document.version}
                </span>
              </div>

              <div className="flex flex-wrap gap-1">
                {document.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="inline-flex px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              <div className="flex items-center justify-between">
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                  document.isPublic ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {document.isPublic ? 'Offentlig' : 'Privat'}
                </span>
                <span className="text-sm text-gray-500">
                  {document.category}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredDocuments.length === 0 && (
        <div className="text-center py-12">
          <DocumentTextIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">
            {searchTerm ? 'Ingen dokumenter funnet' : 'Ingen dokumenter opplastet ennå'}
          </p>
        </div>
      )}
    </div>
  );
} 