'use client';

import React, { useState } from 'react';
import { Company } from '@/types';

interface CompanySelectorProps {
  onCompanySelect: (company: Company) => void;
}

export default function CompanySelector({ onCompanySelect }: CompanySelectorProps) {
  const [searchTerm, setSearchTerm] = useState('');

  // Mock data for testing
  const mockCompanies: Company[] = [
    {
      id: '1',
      name: 'DriftPro AS',
      email: 'kontakt@driftpro.no',
      logoURL: null,
      primaryColor: '#3B82F6',
      secondaryColor: '#1E40AF',
      address: 'Storgata 1, 0001 Oslo',
      phoneNumber: '+47 123 45 678',
      website: 'https://driftpro.no',
      description: 'Ledende leverandør av drift og vedlikehold',
      adminUserId: 'admin1',
      isActive: true,
      subscriptionPlan: 'enterprise',
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: '2',
      name: 'Teknisk Service Norge',
      email: 'info@tsn.no',
      logoURL: null,
      primaryColor: '#10B981',
      secondaryColor: '#059669',
      address: 'Industriveien 15, 5000 Bergen',
      phoneNumber: '+47 987 65 432',
      website: 'https://tsn.no',
      description: 'Spesialister på teknisk service og vedlikehold',
      adminUserId: 'admin2',
      isActive: true,
      subscriptionPlan: 'premium',
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ];

  const filteredCompanies = mockCompanies.filter(company =>
    company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    company.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-blue-100">
            <svg className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Velg din bedrift
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Velg bedriften du vil logge inn på
          </p>
        </div>

        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            placeholder="Søk etter bedrift..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="space-y-3 max-h-96 overflow-y-auto">
          {filteredCompanies.map((company) => (
            <button
              key={company.id}
              onClick={() => onCompanySelect(company)}
              className="w-full bg-white rounded-lg border border-gray-200 p-4 hover:border-blue-300 hover:shadow-md transition-all duration-200 text-left"
            >
              <div className="flex items-center space-x-3">
                <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {company.name}
                  </p>
                  {company.email && (
                    <p className="text-sm text-gray-500 truncate">
                      {company.email}
                    </p>
                  )}
                  {company.subscriptionPlan && (
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      company.subscriptionPlan === 'enterprise' ? 'bg-purple-100 text-purple-800' :
                      company.subscriptionPlan === 'premium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {company.subscriptionPlan}
                    </span>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
} 