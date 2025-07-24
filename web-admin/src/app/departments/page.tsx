'use client';

import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, where, addDoc, updateDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { Department, User } from '@/types';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  MagnifyingGlassIcon,
  UsersIcon,
  BuildingOffice2Icon,
} from '@heroicons/react/24/outline';

export default function DepartmentsPage() {
  const { selectedCompany } = useAuth();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!selectedCompany) return;

      try {
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

        // Fetch users for manager info
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
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedCompany]);

  const filteredDepartments = departments.filter(department =>
    department.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    department.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getManagerName = (managerId?: string) => {
    if (!managerId) return 'Ingen manager';
    const manager = users.find(u => u.id === managerId);
    return manager?.name || 'Ukjent manager';
  };

  const getUserCount = (departmentId: string) => {
    return users.filter(user => user.departmentId === departmentId).length;
  };

  const getDepartmentColor = (color: string) => {
    return color || '#3B82F6'; // Default blue
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
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Avdelinger</h1>
          <p className="text-gray-600">Administrer bedriftsavdelinger</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Opprett avdeling
        </button>
      </div>

      {/* Search */}
      <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Søk etter avdeling..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Departments Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredDepartments.map((department) => (
          <div
            key={department.id}
            className="bg-white rounded-lg shadow border border-gray-200 p-6 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center">
                <div
                  className="w-4 h-4 rounded-full mr-3"
                  style={{ backgroundColor: getDepartmentColor(department.color) }}
                ></div>
                <h3 className="text-lg font-semibold text-gray-900">{department.name}</h3>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => setEditingDepartment(department)}
                  className="text-blue-600 hover:text-blue-900"
                >
                  <PencilIcon className="h-4 w-4" />
                </button>
                <button
                  onClick={() => {/* Handle delete */}}
                  className="text-red-600 hover:text-red-900"
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              </div>
            </div>

            {department.description && (
              <p className="text-gray-600 text-sm mb-4">{department.description}</p>
            )}

            <div className="space-y-2">
              <div className="flex items-center text-sm text-gray-500">
                <UsersIcon className="h-4 w-4 mr-2" />
                <span>{getUserCount(department.id)} brukere</span>
              </div>
              
              <div className="text-sm text-gray-500">
                <span className="font-medium">Manager:</span> {getManagerName(department.managerId)}
              </div>

              <div className="text-sm text-gray-500">
                <span className="font-medium">Opprettet:</span> {department.createdAt.toLocaleDateString('no-NO')}
              </div>

              <div className="flex items-center">
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                  department.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {department.isActive ? 'Aktiv' : 'Inaktiv'}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredDepartments.length === 0 && (
        <div className="text-center py-12">
          <BuildingOffice2Icon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">
            {searchTerm ? 'Ingen avdelinger funnet' : 'Ingen avdelinger opprettet ennå'}
          </p>
          {!searchTerm && (
            <button
              onClick={() => setShowAddModal(true)}
              className="mt-4 text-blue-600 hover:text-blue-800 font-medium"
            >
              Opprett din første avdeling
            </button>
          )}
        </div>
      )}

      {/* Add/Edit Department Modal would go here */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Opprett avdeling</h3>
            {/* Form would go here */}
            <div className="flex justify-end space-x-2 mt-6">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Avbryt
              </button>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                Lagre
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 