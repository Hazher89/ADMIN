'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { departmentService, userService } from '@/lib/firebase-services';
import { Department, User, UserRole } from '@/types';
import { 
  Building, 
  Search, 
  Filter, 
  Plus, 
  Eye, 
  Edit, 
  Trash2,
  Users,
  UserCheck,
  Crown,
  Settings,
  ArrowRight,
  UserPlus,
  UserMinus
} from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function DepartmentsPage() {
  const { userProfile, isAdmin } = useAuth();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load departments
      const deps = await departmentService.getAllDepartments();
      setDepartments(deps);

      // Load all users for assignment
      const allUsers = await userService.getUsersByRole('employee');
      const leaders = await userService.getUsersByRole('department_leader');
      setUsers([...allUsers, ...leaders]);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Kunne ikke laste data');
    } finally {
      setLoading(false);
    }
  };

  const filteredDepartments = departments.filter(department => {
    const searchLower = searchTerm.toLowerCase();
    return department.name.toLowerCase().includes(searchLower) ||
           department.description?.toLowerCase().includes(searchLower);
  });

  const getDepartmentStats = (department: Department) => {
    const departmentUsers = users.filter(user => user.departmentId === department.id);
    const employees = departmentUsers.filter(user => user.role === UserRole.EMPLOYEE);
    const leaders = departmentUsers.filter(user => user.role === UserRole.DEPARTMENT_LEADER);
    
    return {
      totalUsers: departmentUsers.length,
      employees: employees.length,
      leaders: leaders.length
    };
  };

  const handleDeleteDepartment = async (departmentId: string) => {
    if (!confirm('Er du sikker på at du vil slette denne avdelingen? Dette vil flytte alle ansatte til "Ikke tildelt".')) return;
    
    try {
      // First, move all users to unassigned
      const departmentUsers = users.filter(user => user.departmentId === departmentId);
      for (const user of departmentUsers) {
        await userService.updateUser(user.id, { departmentId: null, departmentName: null });
      }
      
      // Then delete the department
      await departmentService.deleteDepartment(departmentId);
      toast.success('Avdeling slettet');
      loadData();
    } catch (error) {
      console.error('Error deleting department:', error);
      toast.error('Kunne ikke slette avdeling');
    }
  };

  const handleRemoveLeader = async (departmentId: string, leaderId: string) => {
    try {
      await userService.updateUser(leaderId, { role: UserRole.EMPLOYEE });
      toast.success('Avdelingsleder fjernet');
      loadData();
    } catch (error) {
      console.error('Error removing leader:', error);
      toast.error('Kunne ikke fjerne avdelingsleder');
    }
  };

  const handleAddLeader = async (departmentId: string, userId: string) => {
    try {
      await userService.updateUser(userId, { 
        role: UserRole.DEPARTMENT_LEADER,
        departmentId: departmentId,
        departmentName: departments.find(d => d.id === departmentId)?.name
      });
      toast.success('Avdelingsleder lagt til');
      loadData();
    } catch (error) {
      console.error('Error adding leader:', error);
      toast.error('Kunne ikke legge til avdelingsleder');
    }
  };

  const handleMoveEmployee = async (userId: string, newDepartmentId: string) => {
    try {
      const newDepartment = departments.find(d => d.id === newDepartmentId);
      await userService.updateUser(userId, { 
        departmentId: newDepartmentId,
        departmentName: newDepartment?.name
      });
      toast.success('Ansatt flyttet');
      loadData();
    } catch (error) {
      console.error('Error moving employee:', error);
      toast.error('Kunne ikke flytte ansatt');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="text-center py-12">
        <Building className="mx-auto h-16 w-16 text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Ingen tilgang</h3>
        <p className="text-sm text-gray-500">
          Du har ikke tilgang til å administrere avdelinger.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Avdelinger</h1>
          <p className="mt-1 text-sm text-gray-500">
            Administrer avdelinger og avdelingsledere
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <Plus className="h-4 w-4 mr-2" />
          Legg til avdeling
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Building className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Totalt avdelinger</dt>
                  <dd className="text-lg font-medium text-gray-900">{departments.length}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Users className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Totalt ansatte</dt>
                  <dd className="text-lg font-medium text-gray-900">{users.length}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Crown className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Avdelingsledere</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {users.filter(u => u.role === UserRole.DEPARTMENT_LEADER).length}
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
                <UserCheck className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Ikke tildelt</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {users.filter(u => !u.departmentId).length}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Søk etter avdeling..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 block w-full border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          />
        </div>
      </div>

      {/* Departments Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredDepartments.map((department) => {
          const stats = getDepartmentStats(department);
          const departmentUsers = users.filter(user => user.departmentId === department.id);
          const leaders = departmentUsers.filter(user => user.role === UserRole.DEPARTMENT_LEADER);
          const employees = departmentUsers.filter(user => user.role === UserRole.EMPLOYEE);
          
          return (
            <div key={department.id} className="bg-white shadow rounded-lg overflow-hidden">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center">
                      <Building className="h-5 w-5 text-white" />
                    </div>
                    <div className="ml-3">
                      <h3 className="text-lg font-medium text-gray-900">{department.name}</h3>
                      <p className="text-sm text-gray-500">{department.description}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => {
                        setSelectedDepartment(department);
                        setShowDetailsModal(true);
                      }}
                      className="text-blue-600 hover:text-blue-900"
                      title="Se detaljer"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => {
                        setSelectedDepartment(department);
                        setShowAddModal(true);
                      }}
                      className="text-indigo-600 hover:text-indigo-900"
                      title="Rediger"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteDepartment(department.id)}
                      className="text-red-600 hover:text-red-900"
                      title="Slett"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="text-center">
                    <div className="text-lg font-semibold text-gray-900">{stats.totalUsers}</div>
                    <div className="text-xs text-gray-500">Totalt</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-semibold text-yellow-600">{stats.leaders}</div>
                    <div className="text-xs text-gray-500">Ledere</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-semibold text-green-600">{stats.employees}</div>
                    <div className="text-xs text-gray-500">Ansatte</div>
                  </div>
                </div>

                {/* Leaders */}
                {leaders.length > 0 && (
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-900 mb-2 flex items-center">
                      <Crown className="h-4 w-4 mr-1 text-yellow-600" />
                      Avdelingsledere
                    </h4>
                    <div className="space-y-1">
                      {leaders.map((leader) => (
                        <div key={leader.id} className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">{leader.displayName}</span>
                          <button
                            onClick={() => handleRemoveLeader(department.id, leader.id)}
                            className="text-red-600 hover:text-red-900"
                            title="Fjern som leder"
                          >
                            <UserMinus className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Quick Actions */}
                <div className="border-t border-gray-200 pt-4">
                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => {
                        setSelectedDepartment(department);
                        setShowDetailsModal(true);
                      }}
                      className="text-sm text-blue-600 hover:text-blue-900 flex items-center"
                    >
                      Se alle ansatte
                      <ArrowRight className="h-3 w-3 ml-1" />
                    </button>
                    
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => {
                          setSelectedDepartment(department);
                          setShowAddModal(true);
                        }}
                        className="text-sm text-green-600 hover:text-green-900 flex items-center"
                        title="Legg til leder"
                      >
                        <UserPlus className="h-3 w-3 mr-1" />
                        Leder
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Unassigned Users */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            Ikke tildelt ({users.filter(u => !u.departmentId).length})
          </h3>
        </div>
        
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {users.filter(u => !u.departmentId).map((user) => (
              <div key={user.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                <div className="flex items-center">
                  <div className="h-8 w-8 rounded-full bg-gray-600 flex items-center justify-center">
                    <span className="text-white text-sm font-medium">
                      {user.displayName.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="ml-3">
                    <div className="text-sm font-medium text-gray-900">{user.displayName}</div>
                    <div className="text-xs text-gray-500">{user.email}</div>
                  </div>
                </div>
                
                <select
                  value=""
                  onChange={(e) => {
                    if (e.target.value) {
                      handleMoveEmployee(user.id, e.target.value);
                    }
                  }}
                  className="text-xs border border-gray-300 rounded px-2 py-1 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Tildel til...</option>
                  {departments.map(dept => (
                    <option key={dept.id} value={dept.id}>{dept.name}</option>
                  ))}
                </select>
              </div>
            ))}
          </div>
          
          {users.filter(u => !u.departmentId).length === 0 && (
            <div className="text-center py-8">
              <UserCheck className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-sm text-gray-500">Alle ansatte er tildelt til avdelinger</p>
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Department Modal would go here */}
      {/* Department Details Modal would go here */}
      {/* These are placeholders for the modal components */}
    </div>
  );
} 