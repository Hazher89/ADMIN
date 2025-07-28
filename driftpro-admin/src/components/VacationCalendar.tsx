'use client';

import React, { useState, useEffect } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar,
  Users,
  CheckCircle,
  Clock,
  XCircle,
  X
} from 'lucide-react';

interface VacationRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  department: string;
  startDate: string;
  endDate: string;
  days: number;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: string;
  reviewedBy?: string;
  reviewedAt?: string;
  comments?: string;
  type: 'vacation' | 'sick_leave' | 'other';
}

interface CalendarProps {
  vacationRequests: VacationRequest[];
  onDateClick: (date: Date, requests: VacationRequest[]) => void;
  onClose: () => void;
}

export default function VacationCalendar({ vacationRequests, onDateClick, onClose }: CalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'month' | 'year'>('month');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const getVacationRequestsForDate = (date: Date): VacationRequest[] => {
    const dateStr = date.toISOString().split('T')[0];
    return vacationRequests.filter(request => {
      const start = new Date(request.startDate);
      const end = new Date(request.endDate);
      const current = new Date(dateStr);
      return current >= start && current <= end;
    });
  };

  const getVacationRequestsForMonth = (year: number, month: number): VacationRequest[] => {
    return vacationRequests.filter(request => {
      const requestDate = new Date(request.startDate);
      return requestDate.getFullYear() === year && requestDate.getMonth() === month;
    });
  };

  const renderMonthView = () => {
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDay = getFirstDayOfMonth(currentDate);
    const days = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="p-2 border border-gray-200 bg-gray-50"></div>);
    }

    // Add cells for each day of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
      const requests = getVacationRequestsForDate(date);
      const approvedRequests = requests.filter(r => r.status === 'approved');
      const pendingRequests = requests.filter(r => r.status === 'pending');
      const rejectedRequests = requests.filter(r => r.status === 'rejected');

      days.push(
        <div
          key={day}
          onClick={() => onDateClick(date, requests)}
          className={`p-2 border border-gray-200 cursor-pointer hover:bg-gray-50 min-h-[80px] ${
            requests.length > 0 ? 'bg-blue-50' : ''
          }`}
        >
          <div className="text-sm font-medium text-gray-900">{day}</div>
          {requests.length > 0 && (
            <div className="mt-1 space-y-1">
              {approvedRequests.slice(0, 2).map((request, index) => (
                <div key={index} className="text-xs bg-green-100 text-green-800 px-1 py-0.5 rounded truncate">
                  {request.employeeName.split(' ')[0]}
                </div>
              ))}
              {pendingRequests.slice(0, 2).map((request, index) => (
                <div key={index} className="text-xs bg-yellow-100 text-yellow-800 px-1 py-0.5 rounded truncate">
                  {request.employeeName.split(' ')[0]} (V)
                </div>
              ))}
              {requests.length > 4 && (
                <div className="text-xs text-gray-500">+{requests.length - 4} flere</div>
              )}
            </div>
          )}
        </div>
      );
    }

    return days;
  };

  const renderYearView = () => {
    const months = [];
    const currentYear = selectedYear;

    for (let month = 0; month < 12; month++) {
      const monthRequests = getVacationRequestsForMonth(currentYear, month);
      const approvedCount = monthRequests.filter(r => r.status === 'approved').length;
      const pendingCount = monthRequests.filter(r => r.status === 'pending').length;

      months.push(
        <div
          key={month}
          onClick={() => {
            setCurrentDate(new Date(currentYear, month, 1));
            setViewMode('month');
          }}
          className="p-4 border border-gray-200 cursor-pointer hover:bg-gray-50 text-center"
        >
          <div className="text-sm font-medium text-gray-900">
            {new Date(currentYear, month, 1).toLocaleDateString('nb-NO', { month: 'short' })}
          </div>
          {monthRequests.length > 0 && (
            <div className="mt-2 space-y-1">
              {approvedCount > 0 && (
                <div className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                  {approvedCount} godkjent
                </div>
              )}
              {pendingCount > 0 && (
                <div className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                  {pendingCount} venter
                </div>
              )}
            </div>
          )}
        </div>
      );
    }

    return months;
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(newDate.getMonth() - 1);
      } else {
        newDate.setMonth(newDate.getMonth() + 1);
      }
      return newDate;
    });
  };

  const navigateYear = (direction: 'prev' | 'next') => {
    setSelectedYear(prev => {
      const newYear = direction === 'prev' ? prev - 1 : prev + 1;
      // Limit to 5 years back and 5 years forward
      const currentYear = new Date().getFullYear();
      const minYear = currentYear - 5;
      const maxYear = currentYear + 5;
      return Math.max(minYear, Math.min(maxYear, newYear));
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-6xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">Feriekalender</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Navigation */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setViewMode('month')}
              className={`px-4 py-2 rounded-lg ${
                viewMode === 'month' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Måned
            </button>
            <button
              onClick={() => setViewMode('year')}
              className={`px-4 py-2 rounded-lg ${
                viewMode === 'year' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              År
            </button>
          </div>

          <div className="flex items-center space-x-4">
            {viewMode === 'month' ? (
              <>
                <button
                  onClick={() => navigateMonth('prev')}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <h3 className="text-lg font-semibold">
                  {currentDate.toLocaleDateString('nb-NO', { 
                    year: 'numeric', 
                    month: 'long' 
                  })}
                </h3>
                <button
                  onClick={() => navigateMonth('next')}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => navigateYear('prev')}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <h3 className="text-lg font-semibold">{selectedYear}</h3>
                <button
                  onClick={() => navigateYear('next')}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </>
            )}
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center space-x-6 mb-6 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-green-100 border border-green-300 rounded"></div>
            <span className="text-sm text-gray-700">Godkjent ferie</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-yellow-100 border border-yellow-300 rounded"></div>
            <span className="text-sm text-gray-700">Venter på godkjenning</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-red-100 border border-red-300 rounded"></div>
            <span className="text-sm text-gray-700">Avvist</span>
          </div>
        </div>

        {/* Calendar Grid */}
        {viewMode === 'month' ? (
          <div className="grid grid-cols-7 gap-1">
            {/* Day headers */}
            {['Man', 'Tir', 'Ons', 'Tor', 'Fre', 'Lør', 'Søn'].map(day => (
              <div key={day} className="p-2 text-center text-sm font-medium text-gray-500 bg-gray-100">
                {day}
              </div>
            ))}
            {renderMonthView()}
          </div>
        ) : (
          <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {renderYearView()}
          </div>
        )}

        {/* Summary */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h4 className="font-medium text-gray-900 mb-2">Sammendrag</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Totalt ferieforespørsler:</span>
              <span className="ml-2 font-medium">{vacationRequests.length}</span>
            </div>
            <div>
              <span className="text-gray-600">Godkjent:</span>
              <span className="ml-2 font-medium text-green-600">
                {vacationRequests.filter(r => r.status === 'approved').length}
              </span>
            </div>
            <div>
              <span className="text-gray-600">Venter:</span>
              <span className="ml-2 font-medium text-yellow-600">
                {vacationRequests.filter(r => r.status === 'pending').length}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 