'use client';

import React, { useState } from 'react';
import { 
  X, 
  Save, 
  AlertTriangle, 
  Shield, 
  User, 
  MapPin, 
  Plus,
  Trash2,
  Info,
  CheckCircle,
  Clock,
  Target
} from 'lucide-react';

interface JSAModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  loading?: boolean;
}

interface Hazard {
  id: string;
  description: string;
  probability: 'low' | 'medium' | 'high';
  consequence: 'low' | 'medium' | 'high' | 'critical';
  riskScore: number;
  existingControls: string[];
  additionalControls: string[];
}

interface Control {
  id: string;
  description: string;
  type: 'elimination' | 'substitution' | 'engineering' | 'administrative' | 'ppe';
  effectiveness: 'low' | 'medium' | 'high';
  status: 'implemented' | 'planned' | 'not-implemented';
}

export default function JSAModal({ isOpen, onClose, onSubmit, loading = false }: JSAModalProps) {
  const [formData, setFormData] = useState({
    activity: '',
    department: '',
    location: '',
    riskLevel: 'medium' as 'low' | 'medium' | 'high' | 'critical',
    responsiblePerson: '',
    nextReview: '',
    hazards: [] as Hazard[],
    controls: [] as Control[],
    status: 'active' as 'active' | 'inactive' | 'archived'
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [newHazard, setNewHazard] = useState({
    description: '',
    probability: 'medium' as 'low' | 'medium' | 'high',
    consequence: 'medium' as 'low' | 'medium' | 'high' | 'critical',
    existingControls: '',
    additionalControls: ''
  });

  const [newControl, setNewControl] = useState({
    description: '',
    type: 'engineering' as 'elimination' | 'substitution' | 'engineering' | 'administrative' | 'ppe',
    effectiveness: 'medium' as 'low' | 'medium' | 'high',
    status: 'planned' as 'implemented' | 'planned' | 'not-implemented'
  });

  const calculateRiskScore = (probability: string, consequence: string) => {
    const probScores = { low: 1, medium: 2, high: 3 };
    const consScores = { low: 1, medium: 2, high: 3, critical: 4 };
    return probScores[probability as keyof typeof probScores] * consScores[consequence as keyof typeof consScores];
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    const newErrors: Record<string, string> = {};
    if (!formData.activity.trim()) newErrors.activity = 'Aktivitet er påkrevd';
    if (!formData.department.trim()) newErrors.department = 'Avdeling er påkrevd';
    if (!formData.location.trim()) newErrors.location = 'Lokasjon er påkrevd';
    if (!formData.responsiblePerson.trim()) newErrors.responsiblePerson = 'Ansvarlig person er påkrevd';
    if (!formData.nextReview) newErrors.nextReview = 'Neste gjennomgang er påkrevd';
    if (formData.hazards.length === 0) newErrors.hazards = 'Minst én fare må identifiseres';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onSubmit({
      ...formData,
      nextReview: new Date(formData.nextReview),
      lastUpdated: new Date()
    });
  };

  const addHazard = () => {
    if (newHazard.description.trim()) {
      const hazard: Hazard = {
        id: Date.now().toString(),
        description: newHazard.description,
        probability: newHazard.probability,
        consequence: newHazard.consequence,
        riskScore: calculateRiskScore(newHazard.probability, newHazard.consequence),
        existingControls: newHazard.existingControls ? [newHazard.existingControls] : [],
        additionalControls: newHazard.additionalControls ? [newHazard.additionalControls] : []
      };

      setFormData(prev => ({
        ...prev,
        hazards: [...prev.hazards, hazard]
      }));

      setNewHazard({
        description: '',
        probability: 'medium',
        consequence: 'medium',
        existingControls: '',
        additionalControls: ''
      });
    }
  };

  const removeHazard = (id: string) => {
    setFormData(prev => ({
      ...prev,
      hazards: prev.hazards.filter(h => h.id !== id)
    }));
  };

  const addControl = () => {
    if (newControl.description.trim()) {
      const control: Control = {
        id: Date.now().toString(),
        description: newControl.description,
        type: newControl.type,
        effectiveness: newControl.effectiveness,
        status: newControl.status
      };

      setFormData(prev => ({
        ...prev,
        controls: [...prev.controls, control]
      }));

      setNewControl({
        description: '',
        type: 'engineering',
        effectiveness: 'medium',
        status: 'planned'
      });
    }
  };

  const removeControl = (id: string) => {
    setFormData(prev => ({
      ...prev,
      controls: prev.controls.filter(c => c.id !== id)
    }));
  };

  const getRiskLevelColor = (score: number) => {
    if (score <= 2) return 'var(--green-100)';
    if (score <= 4) return 'var(--yellow-100)';
    if (score <= 6) return 'var(--orange-100)';
    return 'var(--red-100)';
  };

  const getRiskLevelText = (score: number) => {
    if (score <= 2) return 'Lav';
    if (score <= 4) return 'Medium';
    if (score <= 6) return 'Høy';
    return 'Kritisk';
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '900px', maxHeight: '90vh', overflowY: 'auto' }}>
        {/* Header */}
        <div style={{
          padding: '1.5rem',
          borderBottom: '1px solid var(--gray-200)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ background: 'var(--orange-100)', padding: '0.75rem', borderRadius: 'var(--radius-lg)' }}>
              <AlertTriangle style={{ width: '24px', height: '24px', color: 'var(--orange-600)' }} />
            </div>
            <div>
              <h3 style={{ fontSize: 'var(--font-size-lg)', fontWeight: '600', color: 'var(--gray-900)' }}>
                Ny SJA - Sikker Jobb Analyse
              </h3>
              <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--gray-600)' }}>
                Identifiser farer og kontrolltiltak for aktiviteten
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '1.5rem',
              color: 'var(--gray-400)',
              cursor: 'pointer',
              padding: '0.25rem'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ padding: '1.5rem' }}>
          <div style={{ display: 'grid', gap: '1.5rem' }}>
            {/* Basic Information */}
            <div>
              <h4 style={{ fontSize: 'var(--font-size-base)', fontWeight: '600', color: 'var(--gray-900)', marginBottom: '1rem' }}>
                Grunnleggende informasjon
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: 'var(--font-size-sm)', fontWeight: '500', color: 'var(--gray-700)', marginBottom: '0.5rem' }}>
                    Aktivitet *
                  </label>
                  <input
                    type="text"
                    value={formData.activity}
                    onChange={(e) => setFormData(prev => ({ ...prev, activity: e.target.value }))}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: errors.activity ? '1px solid var(--red-500)' : '1px solid var(--gray-300)',
                      borderRadius: 'var(--radius-lg)',
                      fontSize: 'var(--font-size-base)'
                    }}
                    placeholder="F.eks. Høydearbeid, Kjemisk håndtering"
                  />
                  {errors.activity && (
                    <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--red-500)', marginTop: '0.25rem' }}>
                      {errors.activity}
                    </p>
                  )}
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 'var(--font-size-sm)', fontWeight: '500', color: 'var(--gray-700)', marginBottom: '0.5rem' }}>
                    Avdeling *
                  </label>
                  <input
                    type="text"
                    value={formData.department}
                    onChange={(e) => setFormData(prev => ({ ...prev, department: e.target.value }))}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: errors.department ? '1px solid var(--red-500)' : '1px solid var(--gray-300)',
                      borderRadius: 'var(--radius-lg)',
                      fontSize: 'var(--font-size-base)'
                    }}
                    placeholder="F.eks. Produksjon, Laboratorium"
                  />
                  {errors.department && (
                    <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--red-500)', marginTop: '0.25rem' }}>
                      {errors.department}
                    </p>
                  )}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: 'var(--font-size-sm)', fontWeight: '500', color: 'var(--gray-700)', marginBottom: '0.5rem' }}>
                    Lokasjon *
                  </label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: errors.location ? '1px solid var(--red-500)' : '1px solid var(--gray-300)',
                      borderRadius: 'var(--radius-lg)',
                      fontSize: 'var(--font-size-base)'
                    }}
                    placeholder="F.eks. Bygning A, Etasje 2"
                  />
                  {errors.location && (
                    <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--red-500)', marginTop: '0.25rem' }}>
                      {errors.location}
                    </p>
                  )}
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 'var(--font-size-sm)', fontWeight: '500', color: 'var(--gray-700)', marginBottom: '0.5rem' }}>
                    Ansvarlig person *
                  </label>
                  <input
                    type="text"
                    value={formData.responsiblePerson}
                    onChange={(e) => setFormData(prev => ({ ...prev, responsiblePerson: e.target.value }))}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: errors.responsiblePerson ? '1px solid var(--red-500)' : '1px solid var(--gray-300)',
                      borderRadius: 'var(--radius-lg)',
                      fontSize: 'var(--font-size-base)'
                    }}
                    placeholder="Navn på ansvarlig person"
                  />
                  {errors.responsiblePerson && (
                    <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--red-500)', marginTop: '0.25rem' }}>
                      {errors.responsiblePerson}
                    </p>
                  )}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: 'var(--font-size-sm)', fontWeight: '500', color: 'var(--gray-700)', marginBottom: '0.5rem' }}>
                    Risikonivå
                  </label>
                  <select
                    value={formData.riskLevel}
                    onChange={(e) => setFormData(prev => ({ ...prev, riskLevel: e.target.value as any }))}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid var(--gray-300)',
                      borderRadius: 'var(--radius-lg)',
                      fontSize: 'var(--font-size-base)'
                    }}
                  >
                    <option value="low">Lav</option>
                    <option value="medium">Medium</option>
                    <option value="high">Høy</option>
                    <option value="critical">Kritisk</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 'var(--font-size-sm)', fontWeight: '500', color: 'var(--gray-700)', marginBottom: '0.5rem' }}>
                    Neste gjennomgang *
                  </label>
                  <input
                    type="date"
                    value={formData.nextReview}
                    onChange={(e) => setFormData(prev => ({ ...prev, nextReview: e.target.value }))}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: errors.nextReview ? '1px solid var(--red-500)' : '1px solid var(--gray-300)',
                      borderRadius: 'var(--radius-lg)',
                      fontSize: 'var(--font-size-base)'
                    }}
                  />
                  {errors.nextReview && (
                    <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--red-500)', marginTop: '0.25rem' }}>
                      {errors.nextReview}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Hazard Identification */}
            <div>
              <h4 style={{ fontSize: 'var(--font-size-base)', fontWeight: '600', color: 'var(--gray-900)', marginBottom: '1rem' }}>
                Fareidentifikasjon
              </h4>
              
              {/* Add New Hazard */}
              <div style={{ border: '1px solid var(--gray-200)', borderRadius: 'var(--radius-lg)', padding: '1rem', marginBottom: '1rem' }}>
                <h5 style={{ fontSize: 'var(--font-size-sm)', fontWeight: '600', color: 'var(--gray-900)', marginBottom: '1rem' }}>
                  Legg til ny fare
                </h5>
                <div style={{ display: 'grid', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 'var(--font-size-sm)', fontWeight: '500', color: 'var(--gray-700)', marginBottom: '0.5rem' }}>
                      Beskrivelse av fare
                    </label>
                    <textarea
                      value={newHazard.description}
                      onChange={(e) => setNewHazard(prev => ({ ...prev, description: e.target.value }))}
                      rows={3}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid var(--gray-300)',
                        borderRadius: 'var(--radius-lg)',
                        fontSize: 'var(--font-size-base)',
                        resize: 'vertical'
                      }}
                      placeholder="Beskriv faren i detalj..."
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: 'var(--font-size-sm)', fontWeight: '500', color: 'var(--gray-700)', marginBottom: '0.5rem' }}>
                        Sannsynlighet
                      </label>
                      <select
                        value={newHazard.probability}
                        onChange={(e) => setNewHazard(prev => ({ ...prev, probability: e.target.value as any }))}
                        style={{
                          width: '100%',
                          padding: '0.75rem',
                          border: '1px solid var(--gray-300)',
                          borderRadius: 'var(--radius-lg)',
                          fontSize: 'var(--font-size-base)'
                        }}
                      >
                        <option value="low">Lav</option>
                        <option value="medium">Medium</option>
                        <option value="high">Høy</option>
                      </select>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: 'var(--font-size-sm)', fontWeight: '500', color: 'var(--gray-700)', marginBottom: '0.5rem' }}>
                        Konsekvens
                      </label>
                      <select
                        value={newHazard.consequence}
                        onChange={(e) => setNewHazard(prev => ({ ...prev, consequence: e.target.value as any }))}
                        style={{
                          width: '100%',
                          padding: '0.75rem',
                          border: '1px solid var(--gray-300)',
                          borderRadius: 'var(--radius-lg)',
                          fontSize: 'var(--font-size-base)'
                        }}
                      >
                        <option value="low">Lav</option>
                        <option value="medium">Medium</option>
                        <option value="high">Høy</option>
                        <option value="critical">Kritisk</option>
                      </select>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: 'var(--font-size-sm)', fontWeight: '500', color: 'var(--gray-700)', marginBottom: '0.5rem' }}>
                        Eksisterende kontrolltiltak
                      </label>
                      <textarea
                        value={newHazard.existingControls}
                        onChange={(e) => setNewHazard(prev => ({ ...prev, existingControls: e.target.value }))}
                        rows={2}
                        style={{
                          width: '100%',
                          padding: '0.75rem',
                          border: '1px solid var(--gray-300)',
                          borderRadius: 'var(--radius-lg)',
                          fontSize: 'var(--font-size-base)',
                          resize: 'vertical'
                        }}
                        placeholder="Beskriv eksisterende tiltak..."
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: 'var(--font-size-sm)', fontWeight: '500', color: 'var(--gray-700)', marginBottom: '0.5rem' }}>
                        Ytterligere tiltak
                      </label>
                      <textarea
                        value={newHazard.additionalControls}
                        onChange={(e) => setNewHazard(prev => ({ ...prev, additionalControls: e.target.value }))}
                        rows={2}
                        style={{
                          width: '100%',
                          padding: '0.75rem',
                          border: '1px solid var(--gray-300)',
                          borderRadius: 'var(--radius-lg)',
                          fontSize: 'var(--font-size-base)',
                          resize: 'vertical'
                        }}
                        placeholder="Beskriv ytterligere tiltak..."
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={addHazard}
                    className="btn btn-secondary"
                    style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', alignSelf: 'flex-start' }}
                  >
                    <Plus size={16} />
                    Legg til fare
                  </button>
                </div>
              </div>

              {/* Existing Hazards */}
              {formData.hazards.length > 0 && (
                <div style={{ display: 'grid', gap: '1rem' }}>
                  {formData.hazards.map((hazard) => (
                    <div key={hazard.id} style={{ border: '1px solid var(--gray-200)', borderRadius: 'var(--radius-lg)', padding: '1rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                        <div style={{ flex: '1' }}>
                          <h6 style={{ fontSize: 'var(--font-size-sm)', fontWeight: '600', color: 'var(--gray-900)', marginBottom: '0.5rem' }}>
                            {hazard.description}
                          </h6>
                          <div style={{ display: 'flex', gap: '1rem', marginBottom: '0.5rem' }}>
                            <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--gray-600)' }}>
                              Sannsynlighet: {hazard.probability}
                            </span>
                            <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--gray-600)' }}>
                              Konsekvens: {hazard.consequence}
                            </span>
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{
                            background: getRiskLevelColor(hazard.riskScore),
                            color: 'var(--gray-800)',
                            padding: '0.25rem 0.75rem',
                            borderRadius: 'var(--radius-full)',
                            fontSize: 'var(--font-size-xs)',
                            fontWeight: '600'
                          }}>
                            {getRiskLevelText(hazard.riskScore)} (Score: {hazard.riskScore})
                          </span>
                          <button
                            type="button"
                            onClick={() => removeHazard(hazard.id)}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.25rem' }}
                          >
                            <Trash2 size={16} color="var(--red-500)" />
                          </button>
                        </div>
                      </div>
                      
                      {hazard.existingControls.length > 0 && (
                        <div style={{ marginBottom: '0.5rem' }}>
                          <p style={{ fontSize: 'var(--font-size-xs)', fontWeight: '500', color: 'var(--gray-700)', marginBottom: '0.25rem' }}>
                            Eksisterende tiltak:
                          </p>
                          <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--gray-600)' }}>
                            {hazard.existingControls.join(', ')}
                          </p>
                        </div>
                      )}
                      
                      {hazard.additionalControls.length > 0 && (
                        <div>
                          <p style={{ fontSize: 'var(--font-size-xs)', fontWeight: '500', color: 'var(--gray-700)', marginBottom: '0.25rem' }}>
                            Ytterligere tiltak:
                          </p>
                          <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--gray-600)' }}>
                            {hazard.additionalControls.join(', ')}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {errors.hazards && (
                <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--red-500)', marginTop: '0.5rem' }}>
                  {errors.hazards}
                </p>
              )}
            </div>

            {/* Control Measures */}
            <div>
              <h4 style={{ fontSize: 'var(--font-size-base)', fontWeight: '600', color: 'var(--gray-900)', marginBottom: '1rem' }}>
                Kontrolltiltak
              </h4>
              
              {/* Add New Control */}
              <div style={{ border: '1px solid var(--gray-200)', borderRadius: 'var(--radius-lg)', padding: '1rem', marginBottom: '1rem' }}>
                <h5 style={{ fontSize: 'var(--font-size-sm)', fontWeight: '600', color: 'var(--gray-900)', marginBottom: '1rem' }}>
                  Legg til kontrolltiltak
                </h5>
                <div style={{ display: 'grid', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 'var(--font-size-sm)', fontWeight: '500', color: 'var(--gray-700)', marginBottom: '0.5rem' }}>
                      Beskrivelse av tiltak
                    </label>
                    <textarea
                      value={newControl.description}
                      onChange={(e) => setNewControl(prev => ({ ...prev, description: e.target.value }))}
                      rows={3}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid var(--gray-300)',
                        borderRadius: 'var(--radius-lg)',
                        fontSize: 'var(--font-size-base)',
                        resize: 'vertical'
                      }}
                      placeholder="Beskriv kontrolltiltaket i detalj..."
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: 'var(--font-size-sm)', fontWeight: '500', color: 'var(--gray-700)', marginBottom: '0.5rem' }}>
                        Type
                      </label>
                      <select
                        value={newControl.type}
                        onChange={(e) => setNewControl(prev => ({ ...prev, type: e.target.value as any }))}
                        style={{
                          width: '100%',
                          padding: '0.75rem',
                          border: '1px solid var(--gray-300)',
                          borderRadius: 'var(--radius-lg)',
                          fontSize: 'var(--font-size-base)'
                        }}
                      >
                        <option value="elimination">Eliminering</option>
                        <option value="substitution">Substitusjon</option>
                        <option value="engineering">Tekniske tiltak</option>
                        <option value="administrative">Administrative tiltak</option>
                        <option value="ppe">Personlig verneutstyr</option>
                      </select>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: 'var(--font-size-sm)', fontWeight: '500', color: 'var(--gray-700)', marginBottom: '0.5rem' }}>
                        Effektivitet
                      </label>
                      <select
                        value={newControl.effectiveness}
                        onChange={(e) => setNewControl(prev => ({ ...prev, effectiveness: e.target.value as any }))}
                        style={{
                          width: '100%',
                          padding: '0.75rem',
                          border: '1px solid var(--gray-300)',
                          borderRadius: 'var(--radius-lg)',
                          fontSize: 'var(--font-size-base)'
                        }}
                      >
                        <option value="low">Lav</option>
                        <option value="medium">Medium</option>
                        <option value="high">Høy</option>
                      </select>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: 'var(--font-size-sm)', fontWeight: '500', color: 'var(--gray-700)', marginBottom: '0.5rem' }}>
                        Status
                      </label>
                      <select
                        value={newControl.status}
                        onChange={(e) => setNewControl(prev => ({ ...prev, status: e.target.value as any }))}
                        style={{
                          width: '100%',
                          padding: '0.75rem',
                          border: '1px solid var(--gray-300)',
                          borderRadius: 'var(--radius-lg)',
                          fontSize: 'var(--font-size-base)'
                        }}
                      >
                        <option value="implemented">Implementert</option>
                        <option value="planned">Planlagt</option>
                        <option value="not-implemented">Ikke implementert</option>
                      </select>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={addControl}
                    className="btn btn-secondary"
                    style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', alignSelf: 'flex-start' }}
                  >
                    <Plus size={16} />
                    Legg til tiltak
                  </button>
                </div>
              </div>

              {/* Existing Controls */}
              {formData.controls.length > 0 && (
                <div style={{ display: 'grid', gap: '1rem' }}>
                  {formData.controls.map((control) => (
                    <div key={control.id} style={{ border: '1px solid var(--gray-200)', borderRadius: 'var(--radius-lg)', padding: '1rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div style={{ flex: '1' }}>
                          <h6 style={{ fontSize: 'var(--font-size-sm)', fontWeight: '600', color: 'var(--gray-900)', marginBottom: '0.5rem' }}>
                            {control.description}
                          </h6>
                          <div style={{ display: 'flex', gap: '1rem' }}>
                            <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--gray-600)' }}>
                              Type: {control.type}
                            </span>
                            <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--gray-600)' }}>
                              Effektivitet: {control.effectiveness}
                            </span>
                            <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--gray-600)' }}>
                              Status: {control.status}
                            </span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeControl(control.id)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.25rem' }}
                        >
                          <Trash2 size={16} color="var(--red-500)" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div style={{
            paddingTop: '1.5rem',
            borderTop: '1px solid var(--gray-200)',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '1rem'
          }}>
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary"
            >
              Avbryt
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Oppretter...
                </>
              ) : (
                <>
                  <Save size={16} />
                  Opprett SJA
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 