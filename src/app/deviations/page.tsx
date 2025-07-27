'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { deviationService } from '@/lib/firebase-services';
import { Deviation, DeviationStatus, Priority, DeviationCategory } from '@/types';
import { 
  AlertTriangle, 
  Search, 
  Filter, 
  Plus, 
  Eye, 
  Edit, 
  MessageSquare,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  TrendingUp,
  Calendar,
  User
} from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function DeviationsPage() {
  const { userProfile, isAdmin, isDepartmentLeader } = useAuth();
  const [deviations, setDeviations] = useState<Deviation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedPriority, setSelectedPriority] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedDeviation, setSelectedDeviation] = useState<Deviation | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  useEffect(() => {
    loadDeviations();
  }, []);

  const loadDeviations = async () => {
    try {
      setLoading(true);
      let deviations: Deviation[] = [];

      if (isAdmin) {
        // Admin sees all deviations
        // This would need to be implemented in the service
        deviations = await deviationService.getDeviationsByDepartment('all');
      } else if (isDepartmentLeader && userProfile?.departmentId) {
        // Department leader sees department deviations
        deviations = await deviationService.getDeviationsByDepartment(userProfile.departmentId);
      } else {
        // Employee sees their own deviations
        deviations = await deviationService.getDeviationsByEmployee(userProfile?.id || '');
      }

      setDeviations(deviations);
    } catch (error) {
      console.error('Error loading deviations:', error);
      toast.error('Kunne ikke laste avvik');
    } finally {
      setLoading(false);
    }
  };

  const filteredDeviations = deviations.filter(deviation => {
    const matchesSearch = deviation.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         deviation.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         deviation.uniqueId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         deviation.employeeName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = !selectedStatus || deviation.status === selectedStatus;
    const matchesPriority = !selectedPriority || deviation.priority === selectedPriority;
    const matchesCategory = !selectedCategory || deviation.category === selectedCategory;
    
    return matchesSearch && matchesStatus && matchesPriority && matchesCategory;
  });

  const getStatusBadge = (status: DeviationStatus) => {
    const badges = {
      [DeviationStatus.PENDING]: { color: 'bg-yellow-100 text-yellow-800', icon: Clock, text: 'Venter' },
      [DeviationStatus.IN_PROGRESS]: { color: 'bg-blue-100 text-blue-800', icon: TrendingUp, text: 'Behandles' },
      [DeviationStatus.RESOLVED]: { color: 'bg-green-100 text-green-800', icon: CheckCircle, text: 'Løst' },
      [DeviationStatus.REJECTED]: { color: 'bg-red-100 text-red-800', icon: XCircle, text: 'Avvist' }
    };
    
    const badge = badges[status];
    const Icon = badge.icon;
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badge.color}`}>
        <Icon className="h-3 w-3 mr-1" />
        {badge.text}
      </span>
    );
  };

  const getPriorityBadge = (priority: Priority) => {
    const badges = {
      [Priority.LOW]: { color: 'bg-gray-100 text-gray-800', text: 'Lav' },
      [Priority.MEDIUM]: { color: 'bg-yellow-100 text-yellow-800', text: 'Medium' },
      [Priority.HIGH]: { color: 'bg-orange-100 text-orange-800', text: 'Høy' },
      [Priority.CRITICAL]: { color: 'bg-red-100 text-red-800', text: 'Kritisk' }
    };
    
    const badge = badges[priority];
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badge.color}`}>
        {badge.text}
      </span>
    );
  };

  const getCategoryBadge = (category: DeviationCategory) => {
    const badges = {
      [DeviationCategory.SAFETY]: { color: 'bg-red-100 text-red-800', text: 'Sikkerhet' },
      [DeviationCategory.QUALITY]: { color: 'bg-blue-100 text-blue-800', text: 'Kvalitet' },
      [DeviationCategory.EQUIPMENT]: { color: 'bg-purple-100 text-purple-800', text: 'Utstyr' },
      [DeviationCategory.PROCESS]: { color: 'bg-green-100 text-green-800', text: 'Prosess' },
      [DeviationCategory.OTHER]: { color: 'bg-gray-100 text-gray-800', text: 'Annet' }
    };
    
    const badge = badges[category];
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badge.color}`}>
        {badge.text}
      </span>
    );
  };

  const handleStatusChange = async (deviationId: string, newStatus: DeviationStatus) => {
    try {
      await deviationService.updateDeviationStatus(deviationId, newStatus, userProfile?.id || '', 'Status endret');
      toast.success('Status oppdatert');
      loadDeviations();
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Kunne ikke oppdatere status');
    }
  };

  const getDaysSinceCreated = (createdAt: Date) => {
    const now = new Date();
    const created = new Date(createdAt);
    const diffTime = Math.abs(now.getTime() - created.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Avvik</h1>
          <p className="mt-1 text-sm text-gray-500">
            Håndter og spore avvik i systemet
          </p>
        </div>
        <button
          onClick={() => setShowDetailsModal(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
        >
          <Plus className="h-4 w-4 mr-2" />
          Rapporter avvik
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <AlertTriangle className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Venter</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {deviations.filter(d => d.status === DeviationStatus.PENDING).length}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <TrendingUp className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Behandles</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {deviations.filter(d => d.status === DeviationStatus.IN_PROGRESS).length}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Løst</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {deviations.filter(d => d.status === DeviationStatus.RESOLVED).length}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <AlertCircle className="h-6 w-6 text-red-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Kritiske</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {deviations.filter(d => d.priority === Priority.CRITICAL).length}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Søk
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Søk etter ID, tittel, beskrivelse..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 block w-full border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="block w-full border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            >
              <option value="">Alle statuser</option>
              <option value={DeviationStatus.PENDING}>Venter</option>
              <option value={DeviationStatus.IN_PROGRESS}>Behandles</option>
              <option value={DeviationStatus.RESOLVED}>Løst</option>
              <option value={DeviationStatus.REJECTED}>Avvist</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Prioritet
            </label>
            <select
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value)}
              className="block w-full border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            >
              <option value="">Alle prioriter</option>
              <option value={Priority.LOW}>Lav</option>
              <option value={Priority.MEDIUM}>Medium</option>
              <option value={Priority.HIGH}>Høy</option>
              <option value={Priority.CRITICAL}>Kritisk</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Kategori
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="block w-full border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            >
              <option value="">Alle kategorier</option>
              <option value={DeviationCategory.SAFETY}>Sikkerhet</option>
              <option value={DeviationCategory.QUALITY}>Kvalitet</option>
              <option value={DeviationCategory.EQUIPMENT}>Utstyr</option>
              <option value={DeviationCategory.PROCESS}>Prosess</option>
              <option value={DeviationCategory.OTHER}>Annet</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedStatus('');
                setSelectedPriority('');
                setSelectedCategory('');
              }}
              className="w-full inline-flex justify-center items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Filter className="h-4 w-4 mr-2" />
              Nullstill
            </button>
          </div>
        </div>
      </div>

      {/* Deviations List */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            Avvik ({filteredDeviations.length})
          </h3>
        </div>
        
        <div className="divide-y divide-gray-200">
          {filteredDeviations.map((deviation) => (
            <div key={deviation.id} className="p-6 hover:bg-gray-50 transition-colors">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <span className="text-sm font-mono text-gray-500 bg-gray-100 px-2 py-1 rounded">
                      {deviation.uniqueId}
                    </span>
                    {getStatusBadge(deviation.status)}
                    {getPriorityBadge(deviation.priority)}
                    {getCategoryBadge(deviation.category)}
                  </div>
                  
                  <h4 className="text-lg font-medium text-gray-900 mb-2">
                    {deviation.title}
                  </h4>
                  
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                    {deviation.description}
                  </p>
                  
                  <div className="flex items-center space-x-6 text-sm text-gray-500">
                    <div className="flex items-center">
                      <User className="h-4 w-4 mr-1" />
                      {deviation.employeeName}
                    </div>
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-1" />
                      {new Date(deviation.createdAt).toLocaleDateString('no-NO')}
                    </div>
                    <div className="flex items-center">
                      <MessageSquare className="h-4 w-4 mr-1" />
                      {deviation.comments.length} kommentarer
                    </div>
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-1" />
                      {getDaysSinceCreated(deviation.createdAt)} dager siden
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2 ml-4">
                  <button
                    onClick={() => {
                      setSelectedDeviation(deviation);
                      setShowDetailsModal(true);
                    }}
                    className="text-blue-600 hover:text-blue-900"
                    title="Se detaljer"
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                  
                  {(isAdmin || isDepartmentLeader) && deviation.status === DeviationStatus.PENDING && (
                    <button
                      onClick={() => handleStatusChange(deviation.id, DeviationStatus.IN_PROGRESS)}
                      className="text-green-600 hover:text-green-900"
                      title="Start behandling"
                    >
                      <TrendingUp className="h-4 w-4" />
                    </button>
                  )}
                  
                  {(isAdmin || isDepartmentLeader) && deviation.status === DeviationStatus.IN_PROGRESS && (
                    <button
                      onClick={() => handleStatusChange(deviation.id, DeviationStatus.RESOLVED)}
                      className="text-green-600 hover:text-green-900"
                      title="Merk som løst"
                    >
                      <CheckCircle className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredDeviations.length === 0 && (
          <div className="text-center py-12">
            <AlertTriangle className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Ingen avvik funnet</h3>
            <p className="mt-1 text-sm text-gray-500">
              Prøv å endre søkekriteriene eller rapporter et nytt avvik.
            </p>
          </div>
        )}
      </div>

      {/* Deviation Details Modal would go here */}
      {/* This is a placeholder for the modal component */}
    </div>
  );
} 