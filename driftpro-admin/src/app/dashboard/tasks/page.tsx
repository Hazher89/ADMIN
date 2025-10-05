'use client';

import React, { useState } from 'react';
import { 
  CheckSquare, 
  Clock, 
  User, 
  Calendar, 
  AlertCircle, 
  Plus,
  Filter,
  Search,
  MoreHorizontal,
  Edit,
  Trash2,
  Check,
  X
} from 'lucide-react';

export default function TasksPage() {
  const [tasks, setTasks] = useState([
    {
      id: 1,
      title: 'Oppdatere kundedatabase',
      description: 'Legge til nye kunder og oppdatere eksisterende',
      assignee: 'Anna Hansen',
      dueDate: '2024-01-15',
      priority: 'high',
      status: 'in_progress',
      category: 'CRM'
    },
    {
      id: 2,
      title: 'Forberede månedsrapport',
      description: 'Samle data og lage presentasjon for ledelsen',
      assignee: 'Erik Olsen',
      dueDate: '2024-01-10',
      priority: 'medium',
      status: 'pending',
      category: 'Rapportering'
    },
    {
      id: 3,
      title: 'Teste ny funksjonalitet',
      description: 'Kvalitetssikring av oppdateringer',
      assignee: 'Maria Berg',
      dueDate: '2024-01-12',
      priority: 'low',
      status: 'completed',
      category: 'Utvikling'
    }
  ]);

  const [showAddModal, setShowAddModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'low': return 'text-green-600 bg-green-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-50';
      case 'in_progress': return 'text-blue-600 bg-blue-50';
      case 'pending': return 'text-gray-600 bg-gray-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const filteredTasks = tasks.filter(task => 
    filterStatus === 'all' || task.status === filterStatus
  );

  return (
    <div className="page-header">
      <div className="flex items-center space-x-3">
        <div className="card-icon">
          <CheckSquare className="w-6 h-6" />
        </div>
        <div>
          <h1 className="page-title">Oppgaver</h1>
          <p className="page-subtitle">Administrer oppgaver og prosjekter</p>
        </div>
      </div>

      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <Filter className="w-4 h-4 text-gray-500" />
          <select 
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">Alle status</option>
            <option value="pending">Venter</option>
            <option value="in_progress">Pågår</option>
            <option value="completed">Fullført</option>
          </select>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="btn btn-primary"
        >
          <Plus className="w-4 h-4" />
          Ny oppgave
        </button>
      </div>

      <div className="card mt-6">
        <div className="grid grid-cols-1 gap-4">
          {filteredTasks.map((task) => (
            <div key={task.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="font-semibold text-gray-900">{task.title}</h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}>
                      {task.priority === 'high' ? 'Høy' : task.priority === 'medium' ? 'Medium' : 'Lav'}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}>
                      {task.status === 'completed' ? 'Fullført' : task.status === 'in_progress' ? 'Pågår' : 'Venter'}
                    </span>
                  </div>
                  <p className="text-gray-600 text-sm mb-3">{task.description}</p>
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <div className="flex items-center space-x-1">
                      <User className="w-4 h-4" />
                      <span>{task.assignee}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Calendar className="w-4 h-4" />
                      <span>{new Date(task.dueDate).toLocaleDateString('nb-NO')}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <AlertCircle className="w-4 h-4" />
                      <span>{task.category}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button className="p-2 hover:bg-gray-100 rounded-lg">
                    <Edit className="w-4 h-4 text-gray-500" />
                  </button>
                  <button className="p-2 hover:bg-gray-100 rounded-lg">
                    <MoreHorizontal className="w-4 h-4 text-gray-500" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add Task Modal */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-content max-w-md">
            <div className="modal-header">
              <h2 className="modal-title">Ny oppgave</h2>
              <button 
                onClick={() => setShowAddModal(false)}
                className="modal-close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="modal-body">
              <form className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tittel</label>
                  <input 
                    type="text" 
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Oppgavetittel"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Beskrivelse</label>
                  <textarea 
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows={3}
                    placeholder="Oppgavebeskrivelse"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tildelt</label>
                    <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                      <option>Velg bruker</option>
                      <option>Anna Hansen</option>
                      <option>Erik Olsen</option>
                      <option>Maria Berg</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Forfall</label>
                    <input 
                      type="date" 
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Prioritet</label>
                    <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                      <option value="low">Lav</option>
                      <option value="medium">Medium</option>
                      <option value="high">Høy</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Kategori</label>
                    <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                      <option>CRM</option>
                      <option>Rapportering</option>
                      <option>Utvikling</option>
                      <option>Markedsføring</option>
                    </select>
                  </div>
                </div>
                <div className="flex items-center justify-end space-x-3 pt-4">
                  <button 
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="btn btn-secondary"
                  >
                    Avbryt
                  </button>
                  <button 
                    type="submit"
                    className="btn btn-primary"
                  >
                    <Plus className="w-4 h-4" />
                    Opprett oppgave
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}





