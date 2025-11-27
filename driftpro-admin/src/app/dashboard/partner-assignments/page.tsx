'use client';

import React, { useState, useEffect } from 'react';
import { firebaseService } from '@/lib/firebase-services';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Plus, 
  Send, 
  Users, 
  Calendar,
  Clock,
  AlertCircle,
  CheckCircle,
  XCircle
} from 'lucide-react';

interface Partner {
  id: string;
  name: string;
  contactPerson: {
    name: string;
    email: string;
    phone: string;
  };
}

interface PartnerUser {
  id: string;
  partnerId: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  status: 'active' | 'inactive';
}

interface Assignment {
  id: string;
  partnerId: string;
  companyId: string;
  title: string;
  description: string;
  startTime: string;
  endTime: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  assignedBy: string;
  partnerResponse?: {
    status: 'accepted' | 'rejected' | 'no_response';
    notes?: string;
    responseAt: string;
  };
  createdAt: string;
}

export default function PartnerAssignmentsPage() {
  const { userProfile } = useAuth();
  const [isMobile, setIsMobile] = useState(false);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [partnerUsers, setPartnerUsers] = useState<PartnerUser[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Create assignment form
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newAssignment, setNewAssignment] = useState({
    partnerId: '',
    title: '',
    description: '',
    startTime: '',
    endTime: '',
    assignedBy: userProfile?.displayName || 'Admin'
  });

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (userProfile?.companyId) {
      loadData();
    }
  }, [userProfile?.companyId]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      const [partnersData, usersData, assignmentsData] = await Promise.all([
        firebaseService.getPartners(userProfile!.companyId),
        firebaseService.getPartnerUsers(userProfile!.companyId),
        firebaseService.getPartnerAssignments(userProfile!.companyId)
      ]);

      setPartners(partnersData);
      setPartnerUsers(usersData);
      setAssignments(assignmentsData);
    } catch (error) {
      setError('Kunne ikke laste data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAssignment = async () => {
    if (!userProfile?.companyId) {
      setError('Mangler bedrifts-ID');
      return;
    }

    if (!newAssignment.partnerId || !newAssignment.title || !newAssignment.startTime) {
      setError('Fyll ut alle obligatoriske felt');
      return;
    }

    try {
      setLoading(true);

      const assignmentData = {
        ...newAssignment,
        companyId: userProfile.companyId,
        status: 'pending' as const
      };

      await firebaseService.createPartnerAssignment(assignmentData);
      
      // Refresh assignments
      const updatedAssignments = await firebaseService.getPartnerAssignments(userProfile.companyId);
      setAssignments(updatedAssignments);
      
      setSuccess('Oppdrag opprettet og SMS sendt til partner!');
      setShowCreateModal(false);
      setNewAssignment({
        partnerId: '',
        title: '',
        description: '',
        startTime: '',
        endTime: '',
        assignedBy: userProfile.displayName || 'Admin'
      });

    } catch (err: any) {
      setError(err.message || 'Kunne ikke opprette oppdrag');
    } finally {
      setLoading(false);
    }
  };

  const getPartnerName = (partnerId: string) => {
    const partner = partners.find(p => p.id === partnerId);
    return partner?.name || 'Ukjent partner';
  };

  const getPartnerUsers = (partnerId: string) => {
    return partnerUsers.filter(user => user.partnerId === partnerId && user.status === 'active');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Laster partner-oppdrag...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'var(--background-color)',
      width: '100%',
      overflowX: 'hidden',
      padding: isMobile ? '0' : undefined
    }}>
      {/* Mobile Header */}
      {isMobile && (
        <div style={{
          padding: '0.625rem 0.75rem 0.5rem',
          marginBottom: '0.5rem',
          borderBottom: '0.5px solid var(--border-color)',
          background: 'var(--card-background)'
        }}>
          <h1 style={{
            fontSize: '1.125rem',
            fontWeight: 600,
            color: 'var(--text-color)',
            margin: 0,
            lineHeight: '1.3'
          }}>
            Partner Oppdrag
          </h1>
        </div>
      )}

      {/* Desktop Header */}
      {!isMobile && (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Partner Oppdrag</h1>
          <p className="text-gray-600 mt-2">Administrer og tildel oppdrag til partnere</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Nytt Oppdrag
        </button>
      </div>
        </div>
      )}

      {/* Mobile Action Button */}
      {isMobile && (
        <div style={{ padding: '0 0.75rem 0.75rem' }}>
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn btn-primary"
            style={{
              width: '100%',
              minHeight: '44px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem'
            }}
          >
            <Plus size={18} />
            Nytt Oppdrag
          </button>
        </div>
      )}

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
          <div className="flex items-center gap-3">
            <Users className="w-8 h-8 text-blue-600" />
            <div>
              <h3 className="text-2xl font-bold text-gray-900">{partners.length}</h3>
              <p className="text-gray-600">Partnere</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
          <div className="flex items-center gap-3">
            <Users className="w-8 h-8 text-green-600" />
            <div>
              <h3 className="text-2xl font-bold text-gray-900">{partnerUsers.length}</h3>
              <p className="text-gray-600">Partner-brukere</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
          <div className="flex items-center gap-3">
            <Calendar className="w-8 h-8 text-yellow-600" />
            <div>
              <h3 className="text-2xl font-bold text-gray-900">{assignments.length}</h3>
              <p className="text-gray-600">Totale oppdrag</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
          <div className="flex items-center gap-3">
            <Clock className="w-8 h-8 text-orange-600" />
            <div>
              <h3 className="text-2xl font-bold text-gray-900">
                {assignments.filter(a => a.status === 'pending').length}
              </h3>
              <p className="text-gray-600">Ventende</p>
            </div>
          </div>
        </div>
      </div>

      {/* Assignments List */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Alle Oppdrag</h2>
        </div>

        {assignments.length === 0 ? (
          <div className="p-12 text-center">
            <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Ingen oppdrag</h3>
            <p className="text-gray-500">Opprett ditt første partner-oppdrag</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {assignments.map((assignment) => (
              <div key={assignment.id} className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{assignment.title}</h3>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        assignment.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        assignment.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                        assignment.status === 'completed' ? 'bg-green-100 text-green-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {assignment.status === 'pending' ? 'Venter' :
                         assignment.status === 'in_progress' ? 'Pågår' :
                         assignment.status === 'completed' ? 'Ferdig' : 'Avbrutt'}
                      </span>
                    </div>

                    <p className="text-gray-600 mb-3">{assignment.description}</p>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        <span>Partner: {getPartnerName(assignment.partnerId)}</span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        <span>Start: {new Date(assignment.startTime).toLocaleString('no-NO')}</span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        <span>Slutt: {new Date(assignment.endTime).toLocaleString('no-NO')}</span>
                      </div>
                    </div>

                    {/* Partner Users Info */}
                    <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                      <h4 className="font-medium text-gray-900 mb-2">SMS sendt til:</h4>
                      <div className="space-y-1">
                        {getPartnerUsers(assignment.partnerId).map((user) => (
                          <div key={user.id} className="flex items-center gap-2 text-sm text-gray-600">
                            <Users className="w-4 h-4" />
                            <span>{user.fullName} ({user.phoneNumber})</span>
                          </div>
                        ))}
                        {getPartnerUsers(assignment.partnerId).length === 0 && (
                          <p className="text-sm text-red-600">Ingen aktive brukere med telefonnummer</p>
                        )}
                      </div>
                    </div>

                    {/* Partner Response */}
                    {assignment.partnerResponse && (
                      <div className={`mt-3 p-3 rounded-lg ${
                        assignment.partnerResponse.status === 'accepted' ? 'bg-green-50 border border-green-200' :
                        assignment.partnerResponse.status === 'rejected' ? 'bg-red-50 border border-red-200' :
                        'bg-yellow-50 border border-yellow-200'
                      }`}>
                        <div className="flex items-center gap-2 mb-2">
                          {assignment.partnerResponse.status === 'accepted' ? (
                            <CheckCircle className="w-5 h-5 text-green-600" />
                          ) : assignment.partnerResponse.status === 'rejected' ? (
                            <XCircle className="w-5 h-5 text-red-600" />
                          ) : (
                            <AlertCircle className="w-5 h-5 text-yellow-600" />
                          )}
                          <span className="font-medium text-gray-900">
                            Partner har {assignment.partnerResponse.status === 'accepted' ? 'akseptert' : 
                                        assignment.partnerResponse.status === 'rejected' ? 'avslått' : 'ikke svart på'} oppdraget
                          </span>
                        </div>
                        {assignment.partnerResponse.notes && (
                          <p className="text-sm text-gray-600">{assignment.partnerResponse.notes}</p>
                        )}
                        <p className="text-xs text-gray-500 mt-2">
                          {new Date(assignment.partnerResponse.responseAt).toLocaleString('no-NO')}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Assignment Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Opprett Nytt Oppdrag</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Partner *</label>
                <select
                  value={newAssignment.partnerId}
                  onChange={(e) => setNewAssignment(prev => ({ ...prev, partnerId: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="">Velg partner</option>
                  {partners.map((partner) => (
                    <option key={partner.id} value={partner.id}>{partner.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tittel *</label>
                <input
                  type="text"
                  value={newAssignment.title}
                  onChange={(e) => setNewAssignment(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="F.eks. Levering av vaskemaskin"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Beskrivelse</label>
                <textarea
                  value={newAssignment.description}
                  onChange={(e) => setNewAssignment(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  rows={3}
                  placeholder="Detaljert beskrivelse av oppdraget"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start tid *</label>
                  <input
                    type="datetime-local"
                    value={newAssignment.startTime}
                    onChange={(e) => setNewAssignment(prev => ({ ...prev, startTime: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Slutt tid</label>
                  <input
                    type="datetime-local"
                    value={newAssignment.endTime}
                    onChange={(e) => setNewAssignment(prev => ({ ...prev, endTime: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>

              {/* Show partner users who will receive SMS */}
              {newAssignment.partnerId && (
                <div className="p-3 bg-blue-50 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-2">SMS vil bli sendt til:</h4>
                  <div className="space-y-1">
                    {getPartnerUsers(newAssignment.partnerId).map((user) => (
                      <div key={user.id} className="flex items-center gap-2 text-sm text-blue-800">
                        <Send className="w-4 h-4" />
                        <span>{user.fullName} ({user.phoneNumber})</span>
                      </div>
                    ))}
                    {getPartnerUsers(newAssignment.partnerId).length === 0 && (
                      <p className="text-sm text-red-600">⚠️ Ingen aktive brukere med telefonnummer</p>
                    )}
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex gap-2 mt-6">
              <button
                onClick={handleCreateAssignment}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2"
                disabled={!newAssignment.partnerId || !newAssignment.title || !newAssignment.startTime}
              >
                <Send className="w-4 h-4" />
                Opprett & Send SMS
              </button>
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded-lg"
              >
                Avbryt
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error and Success Messages */}
      {error && (
        <div className="fixed top-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg z-50">
          {error}
        </div>
      )}
      
      {success && (
        <div className="fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50">
          {success}
        </div>
      )}
    </div>
  );
}




