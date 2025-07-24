'use client';

import React, { useState } from 'react';
import {
  PlusIcon,
  MagnifyingGlassIcon,
  EllipsisVerticalIcon,
  UsersIcon
} from '@heroicons/react/24/outline';

const mockDepartments = [
  {
    id: '1',
    name: 'IT',
    description: 'Informasjonsteknologi og systemadministrasjon',
    manager: 'John Doe',
    employeeCount: 8,
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z'
  },
  {
    id: '2',
    name: 'Vedlikehold',
    description: 'Teknisk vedlikehold og reparasjoner',
    manager: 'Jane Smith',
    employeeCount: 12,
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z'
  },
  {
    id: '3',
    name: 'Produksjon',
    description: 'Produksjon og kvalitetskontroll',
    manager: 'Bob Johnson',
    employeeCount: 25,
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z'
  },
  {
    id: '4',
    name: 'Kvalitet',
    description: 'Kvalitetssikring og testing',
    manager: 'Alice Brown',
    employeeCount: 6,
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z'
  },
  {
    id: '5',
    name: 'Logistikk',
    description: 'Lager og transport',
    manager: 'Charlie Wilson',
    employeeCount: 10,
    isActive: false,
    createdAt: '2024-01-01T00:00:00Z'
  }
];

export default function DepartmentsPage() {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredDepartments = mockDepartments.filter(department =>
    department.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    department.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    department.manager.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Avdelinger</h1>
          <p className="text-gray-600">Administrer avdelinger og organisasjonsstruktur</p>
        </div>
        <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700">
          <PlusIcon className="h-4 w-4 mr-2" />
          Ny avdeling
        </button>
      </div>

      {/* Search */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Søk etter avdeling..."
            className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Departments Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredDepartments.map((department) => (
          <div
            key={department.id}
            className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{department.name}</h3>
                <p className="text-sm text-gray-600 mt-1">{department.description}</p>
              </div>
              <button className="text-gray-400 hover:text-gray-600">
                <EllipsisVerticalIcon className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Manager:</span>
                <span className="text-sm font-medium text-gray-900">{department.manager}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Ansatte:</span>
                <div className="flex items-center">
                  <UsersIcon className="h-4 w-4 text-gray-400 mr-1" />
                  <span className="text-sm font-medium text-gray-900">{department.employeeCount}</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Status:</span>
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                  department.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {department.isActive ? 'Aktiv' : 'Inaktiv'}
                </span>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex space-x-2">
                <button className="flex-1 px-3 py-2 text-sm font-medium text-blue-600 border border-blue-600 rounded-md hover:bg-blue-50">
                  Rediger
                </button>
                <button className="flex-1 px-3 py-2 text-sm font-medium text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50">
                  Se ansatte
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredDepartments.length === 0 && (
        <div className="text-center py-12">
          <div className="mx-auto h-12 w-12 text-gray-400">
            <MagnifyingGlassIcon className="h-12 w-12" />
          </div>
          <h3 className="mt-2 text-sm font-medium text-gray-900">Ingen avdelinger funnet</h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchTerm ? 'Prøv å endre søkeordet' : 'Ingen avdelinger opprettet ennå'}
          </p>
        </div>
      )}
    </div>
  );
} 