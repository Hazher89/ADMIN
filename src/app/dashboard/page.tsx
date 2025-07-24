'use client';

import React from 'react';
import { useAuth } from '@/contexts/AuthContext';

export default function DashboardPage() {
  const { adminUser, selectedCompany } = useAuth();

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          Velkommen tilbake, {adminUser?.firstName}!
        </h1>
        <p className="text-gray-600">
          Her er oversikten over {selectedCompany?.name}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {[
          { name: 'Totale brukere', value: '156', change: '+12%', changeType: 'positive' },
          { name: 'Aktive avdelinger', value: '8', change: '+2', changeType: 'positive' },
          { name: 'Åpne avvik', value: '23', change: '-5', changeType: 'negative' },
          { name: 'Dokumenter', value: '89', change: '+15', changeType: 'positive' },
          { name: 'Planlagte skift', value: '45', change: '+8', changeType: 'positive' },
          { name: 'Aktive chat', value: '12', change: '+3', changeType: 'positive' },
        ].map((stat) => (
          <div
            key={stat.name}
            className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              </div>
              <div className="flex items-center space-x-2">
                <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <svg className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
                <div className="flex items-center">
                  <svg className={`h-4 w-4 ${stat.changeType === 'positive' ? 'text-green-500' : 'text-red-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={stat.changeType === 'positive' ? 'M5 10l7-7m0 0l7 7m-7-7v18' : 'M19 14l-7 7m0 0l-7-7m7 7V3'} />
                  </svg>
                  <span
                    className={`text-sm font-medium ml-1 ${
                      stat.changeType === 'positive' ? 'text-green-600' : 'text-red-600'
                    }`}
                  >
                    {stat.change}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Siste aktivitet</h2>
        </div>
        <div className="divide-y divide-gray-200">
          {[
            { id: 1, type: 'user', description: 'Ny bruker registrert: John Doe', time: '2 minutter siden' },
            { id: 2, type: 'deviation', description: 'Nytt avvik rapportert: Ventil lekkasje', time: '15 minutter siden' },
            { id: 3, type: 'document', description: 'Dokument lastet opp: Vedlikeholdsmanual', time: '1 time siden' },
            { id: 4, type: 'chat', description: 'Ny gruppechat opprettet: Vedlikeholdsteam', time: '2 timer siden' },
          ].map((activity) => (
            <div key={activity.id} className="px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                    <svg className="h-4 w-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                    </svg>
                  </div>
                  <p className="text-sm text-gray-900">{activity.description}</p>
                </div>
                <span className="text-sm text-gray-500">{activity.time}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 