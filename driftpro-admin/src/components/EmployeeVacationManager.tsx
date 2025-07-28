'use client';

import React, { useState, useEffect } from 'react';
import { 
  Users,
  Calendar,
  Plus,
  Minus,
  Save,
  X,
  Download,
  Upload,
  AlertTriangle,
  CheckCircle,
  Clock,
  RefreshCw,
  Edit
} from 'lucide-react';
import { collection, addDoc, updateDoc, deleteDoc, doc, getDocs, query, where, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  department: string;
  role: string;
  vacationDays: {
    total: number;
    used: number;
    remaining: number;
    carriedOver: number;
  };
}

interface EmployeeVacationManagerProps {
  employees: Employee[];
  onClose: () => void;
  onUpdate: (employeeId: string, vacationDays: any) => void;
}

export default function EmployeeVacationManager({ employees, onClose, onUpdate }: EmployeeVacationManagerProps) {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [showAllocationModal, setShowAllocationModal] = useState(false);
  const [showCarryOverModal, setShowCarryOverModal] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Form states
  const [allocationForm, setAllocationForm] = useState({
    year: new Date().getFullYear(),
    totalDays: 25,
    carriedOverDays: 0
  });
  
  const [carryOverForm, setCarryOverForm] = useState({
    fromYear: new Date().getFullYear() - 1,
    toYear: new Date().getFullYear(),
    daysToCarry: 0
  });

  const handleAllocateDays = async (employeeId: string) => {
    try {
      setLoading(true);
      
      if (db) {
        await updateDoc(doc(db, 'employees', employeeId), {
          [`vacationDays.${allocationForm.year}`]: {
            total: allocationForm.totalDays,
            used: 0,
            remaining: allocationForm.totalDays,
            carriedOver: allocationForm.carriedOverDays
          }
        });
      }
      
      onUpdate(employeeId, {
        [allocationForm.year]: {
          total: allocationForm.totalDays,
          used: 0,
          remaining: allocationForm.totalDays,
          carriedOver: allocationForm.carriedOverDays
        }
      });
      
      setShowAllocationModal(false);
      setAllocationForm({
        year: new Date().getFullYear(),
        totalDays: 25,
        carriedOverDays: 0
      });
    } catch (error) {
      console.error('Error allocating days:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCarryOver = async (employeeId: string) => {
    try {
      setLoading(true);
      
      const employee = employees.find(emp => emp.id === employeeId);
      if (!employee) return;
      
      const currentYearDays = employee.vacationDays;
      const newTotal = currentYearDays.total + carryOverForm.daysToCarry;
      const newRemaining = currentYearDays.remaining + carryOverForm.daysToCarry;
      
      if (db) {
        await updateDoc(doc(db, 'employees', employeeId), {
          [`vacationDays.${carryOverForm.toYear}`]: {
            ...currentYearDays,
            total: newTotal,
            remaining: newRemaining,
            carriedOver: carryOverForm.daysToCarry
          }
        });
      }
      
      onUpdate(employeeId, {
        ...currentYearDays,
        total: newTotal,
        remaining: newRemaining,
        carriedOver: carryOverForm.daysToCarry
      });
      
      setShowCarryOverModal(false);
      setCarryOverForm({
        fromYear: new Date().getFullYear() - 1,
        toYear: new Date().getFullYear(),
        daysToCarry: 0
      });
    } catch (error) {
      console.error('Error carrying over days:', error);
    } finally {
      setLoading(false);
    }
  };

  const getVacationDaysForYear = (employee: Employee, year: number) => {
    // This would normally come from Firebase with year-specific data
    // For now, using the current vacationDays structure
    return employee.vacationDays;
  };

  const exportVacationData = () => {
    const data = employees.map(emp => ({
      'Ansatt ID': emp.id,
      'Navn': `${emp.firstName} ${emp.lastName}`,
      'Avdeling': emp.department,
      'Rolle': emp.role,
      'Totalt feriedager': emp.vacationDays.total,
      'Brukte dager': emp.vacationDays.used,
      'Gjenstående dager': emp.vacationDays.remaining,
      'Overførte dager': emp.vacationDays.carriedOver
    }));
    
    const csv = [
      Object.keys(data[0]).join(','),
      ...data.map(row => Object.values(row).join(','))
    ].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `feriedager_${selectedYear}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-6xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">Administrer feriedager</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Year Selector */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center space-x-4">
            <label className="text-sm font-medium text-gray-700">Velg år:</label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
            >
              {Array.from({ length: 11 }, (_, i) => {
                const year = new Date().getFullYear() - 5 + i;
                return (
                  <option key={year} value={year}>
                    {year}
                  </option>
                );
              })}
            </select>
          </div>
          
          <div className="flex space-x-3">
            <button
              onClick={exportVacationData}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center space-x-2"
            >
              <Download className="h-4 w-4" />
              <span>Eksporter</span>
            </button>
            <button
              onClick={() => setShowAllocationModal(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2"
            >
              <Plus className="h-4 w-4" />
              <span>Tildel dager</span>
            </button>
          </div>
        </div>

        {/* Employees Table */}
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ansatt
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Avdeling
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Totalt
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Brukt
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Gjenstående
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Overført
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Handlinger
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {employees.map((employee) => {
                  const vacationDays = getVacationDaysForYear(employee, selectedYear);
                  return (
                    <tr key={employee.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                            <span className="text-white font-medium text-sm">
                              {employee.firstName.charAt(0)}{employee.lastName.charAt(0)}
                            </span>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {employee.firstName} {employee.lastName}
                            </div>
                            <div className="text-sm text-gray-500">{employee.role}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{employee.department}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-medium text-gray-900">
                          {vacationDays.total} dager
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-900">
                          {vacationDays.used} dager
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`text-sm font-medium ${
                          vacationDays.remaining > 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {vacationDays.remaining} dager
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-900">
                          {vacationDays.carriedOver} dager
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => {
                              setSelectedEmployee(employee);
                              setAllocationForm({
                                year: selectedYear,
                                totalDays: vacationDays.total,
                                carriedOverDays: vacationDays.carriedOver
                              });
                              setShowAllocationModal(true);
                            }}
                            className="text-blue-600 hover:text-blue-900"
                            title="Rediger tildeling"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedEmployee(employee);
                              setCarryOverForm({
                                fromYear: selectedYear - 1,
                                toYear: selectedYear,
                                daysToCarry: Math.max(0, vacationDays.remaining)
                              });
                              setShowCarryOverModal(true);
                            }}
                            className="text-green-600 hover:text-green-900"
                            title="Overfør dager"
                          >
                            <RefreshCw className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Summary */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">Totalt tildelt</h4>
            <p className="text-2xl font-bold text-blue-600">
              {employees.reduce((sum, emp) => sum + emp.vacationDays.total, 0)} dager
            </p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <h4 className="font-medium text-green-900 mb-2">Gjenstående</h4>
            <p className="text-2xl font-bold text-green-600">
              {employees.reduce((sum, emp) => sum + emp.vacationDays.remaining, 0)} dager
            </p>
          </div>
          <div className="bg-yellow-50 p-4 rounded-lg">
            <h4 className="font-medium text-yellow-900 mb-2">Brukt</h4>
            <p className="text-2xl font-bold text-yellow-600">
              {employees.reduce((sum, emp) => sum + emp.vacationDays.used, 0)} dager
            </p>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg">
            <h4 className="font-medium text-purple-900 mb-2">Overført</h4>
            <p className="text-2xl font-bold text-purple-600">
              {employees.reduce((sum, emp) => sum + emp.vacationDays.carriedOver, 0)} dager
            </p>
          </div>
        </div>

        {/* Allocation Modal */}
        {showAllocationModal && selectedEmployee && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold">Tildel feriedager</h3>
                <button
                  onClick={() => setShowAllocationModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ansatt
                  </label>
                  <p className="text-sm text-gray-900">
                    {selectedEmployee.firstName} {selectedEmployee.lastName}
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    År
                  </label>
                  <input
                    type="number"
                    value={allocationForm.year}
                    onChange={(e) => setAllocationForm(prev => ({ ...prev, year: Number(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Totalt antall dager
                  </label>
                  <input
                    type="number"
                    value={allocationForm.totalDays}
                    onChange={(e) => setAllocationForm(prev => ({ ...prev, totalDays: Number(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Overførte dager fra forrige år
                  </label>
                  <input
                    type="number"
                    value={allocationForm.carriedOverDays}
                    onChange={(e) => setAllocationForm(prev => ({ ...prev, carriedOverDays: Number(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                  />
                </div>
              </div>
              
              <div className="flex justify-end space-x-4 mt-6">
                <button
                  onClick={() => setShowAllocationModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Avbryt
                </button>
                <button
                  onClick={() => handleAllocateDays(selectedEmployee.id)}
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? 'Lagrer...' : 'Tildel dager'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Carry Over Modal */}
        {showCarryOverModal && selectedEmployee && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold">Overfør feriedager</h3>
                <button
                  onClick={() => setShowCarryOverModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ansatt
                  </label>
                  <p className="text-sm text-gray-900">
                    {selectedEmployee.firstName} {selectedEmployee.lastName}
                  </p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Fra år
                    </label>
                    <input
                      type="number"
                      value={carryOverForm.fromYear}
                      onChange={(e) => setCarryOverForm(prev => ({ ...prev, fromYear: Number(e.target.value) }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Til år
                    </label>
                    <input
                      type="number"
                      value={carryOverForm.toYear}
                      onChange={(e) => setCarryOverForm(prev => ({ ...prev, toYear: Number(e.target.value) }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Antall dager å overføre
                  </label>
                  <input
                    type="number"
                    value={carryOverForm.daysToCarry}
                    onChange={(e) => setCarryOverForm(prev => ({ ...prev, daysToCarry: Number(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                  />
                </div>
                
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    <strong>Merk:</strong> Dager som overføres legges til i det nye året og kan brukes sammen med de nye feriedagene.
                  </p>
                </div>
              </div>
              
              <div className="flex justify-end space-x-4 mt-6">
                <button
                  onClick={() => setShowCarryOverModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Avbryt
                </button>
                <button
                  onClick={() => handleCarryOver(selectedEmployee.id)}
                  disabled={loading}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  {loading ? 'Overfører...' : 'Overfør dager'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 