'use client';

import React, { useState, useEffect } from 'react';
import {
  Plus,
  Calendar,
  Clock,
  Users,
  Edit,
  Trash2,
  Eye
} from 'lucide-react';
import { toast } from 'react-hot-toast';

interface Shift {
  id: string;
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  department: string;
  assignedEmployees: string[];
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  notes?: string;
}

export default function ShiftsPage() {
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    loadShifts();
  }, []);

  const loadShifts = async () => {
    const mockShifts: Shift[] = [
      {
        id: '1',
        title: 'Morgenskift IT',
        date: '2024-07-28',
        startTime: '08:00',
        endTime: '16:00',
        department: 'IT',
        assignedEmployees: ['John Doe', 'Jane Smith'],
        status: 'scheduled',
        notes: 'Vanlig morgenskift for IT-avdelingen'
      },
      {
        id: '2',
        title: 'Kveldsvakt Salg',
        date: '2024-07-28',
        startTime: '16:00',
        endTime: '00:00',
        department: 'Sales',
        assignedEmployees: ['Mike Johnson', 'Sarah Wilson'],
        status: 'in_progress',
        notes: 'Kveldsvakt for salgsavdelingen'
      },
      {
        id: '3',
        title: 'Weekendvakt HR',
        date: '2024-07-29',
        startTime: '10:00',
        endTime: '18:00',
        department: 'HR',
        assignedEmployees: ['David Brown'],
        status: 'scheduled',
        notes: 'Weekendvakt for HR-avdelingen'
      }
    ];

    setShifts(mockShifts);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'scheduled':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">Planlagt</span>;
      case 'in_progress':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">Pågår</span>;
      case 'completed':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Fullført</span>;
      case 'cancelled':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">Kansellert</span>;
      default:
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">Ukjent</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Skiftplan</h1>
            <p className="text-gray-600">Administrer skiftplaner og arbeidstider</p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
          >
            <Plus className="h-4 w-4" />
            <span>Opprett skift</span>
          </button>
        </div>
      </div>

      {/* Shifts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {shifts.map((shift) => (
          <div key={shift.id} className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-blue-500 rounded-lg flex items-center justify-center">
                    <Clock className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{shift.title}</h3>
                    <p className="text-sm text-gray-500">{shift.department}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button className="text-blue-600 hover:text-blue-900 p-1" title="Rediger">
                    <Edit className="h-4 w-4" />
                  </button>
                  <button className="text-gray-600 hover:text-gray-900 p-1" title="Se detaljer">
                    <Eye className="h-4 w-4" />
                  </button>
                  <button className="text-red-600 hover:text-red-900 p-1" title="Slett">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-900">
                    {new Date(shift.date).toLocaleDateString('no-NO')}
                  </span>
                </div>

                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-900">
                    {shift.startTime} - {shift.endTime}
                  </span>
                </div>

                <div className="flex items-center space-x-2">
                  <Users className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-600">
                    {shift.assignedEmployees.length} ansatte tildelt
                  </span>
                </div>

                {shift.notes && (
                  <div className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                    {shift.notes}
                  </div>
                )}
              </div>

              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Status</span>
                  {getStatusBadge(shift.status)}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add Shift Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Opprett nytt skift</h2>
            
            <form className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Skifttittel</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Dato</label>
                <input
                  type="date"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Starttid</label>
                  <input
                    type="time"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Sluttid</label>
                  <input
                    type="time"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Avdeling</label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                  <option value="IT">IT</option>
                  <option value="HR">HR</option>
                  <option value="Sales">Salg</option>
                  <option value="Marketing">Markedsføring</option>
                  <option value="Finance">Økonomi</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notater</label>
                <textarea
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 transition-colors"
                >
                  Avbryt
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Opprett
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
} 