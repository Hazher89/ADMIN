'use client';

import React, { useState } from 'react';
import { 
  X, 
  Save, 
  FileText, 
  User, 
  Calendar, 
  Tag, 
  AlertCircle,
  CheckCircle,
  Clock,
  Download,
  Upload,
  Plus,
  Trash2
} from 'lucide-react';

interface ProtocolModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  loading?: boolean;
}

export default function ProtocolModal({ isOpen, onClose, onSubmit, loading = false }: ProtocolModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    category: 'Sikkerhet' as 'Sikkerhet' | 'Miljø' | 'Kvalitet' | 'HMS' | 'Prosess',
    version: '1.0',
    description: '',
    content: '',
    responsiblePerson: '',
    department: '',
    nextReview: '',
    tags: [] as string[],
    attachments: [] as string[],
    status: 'draft' as 'active' | 'draft' | 'inactive' | 'archived'
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [newTag, setNewTag] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = 'Protokollnavn er påkrevd';
    if (!formData.description.trim()) newErrors.description = 'Beskrivelse er påkrevd';
    if (!formData.responsiblePerson.trim()) newErrors.responsiblePerson = 'Ansvarlig person er påkrevd';
    if (!formData.department.trim()) newErrors.department = 'Avdeling er påkrevd';
    if (!formData.nextReview) newErrors.nextReview = 'Neste gjennomgang er påkrevd';

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

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto' }}>
        {/* Header */}
        <div style={{
          padding: '1.5rem',
          borderBottom: '1px solid var(--gray-200)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ background: 'var(--blue-100)', padding: '0.75rem', borderRadius: 'var(--radius-lg)' }}>
              <FileText style={{ width: '24px', height: '24px', color: 'var(--blue-600)' }} />
            </div>
            <div>
              <h3 style={{ fontSize: 'var(--font-size-lg)', fontWeight: '600', color: 'var(--gray-900)' }}>
                Ny protokoll
              </h3>
              <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--gray-600)' }}>
                Opprett en ny HMS-protokoll
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
                    Protokollnavn *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: errors.name ? '1px solid var(--red-500)' : '1px solid var(--gray-300)',
                      borderRadius: 'var(--radius-lg)',
                      fontSize: 'var(--font-size-base)'
                    }}
                    placeholder="F.eks. Sikkerhetsprotokoll for høydearbeid"
                  />
                  {errors.name && (
                    <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--red-500)', marginTop: '0.25rem' }}>
                      {errors.name}
                    </p>
                  )}
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 'var(--font-size-sm)', fontWeight: '500', color: 'var(--gray-700)', marginBottom: '0.5rem' }}>
                    Kategori *
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value as any }))}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid var(--gray-300)',
                      borderRadius: 'var(--radius-lg)',
                      fontSize: 'var(--font-size-base)'
                    }}
                  >
                    <option value="Sikkerhet">Sikkerhet</option>
                    <option value="Miljø">Miljø</option>
                    <option value="Kvalitet">Kvalitet</option>
                    <option value="HMS">HMS</option>
                    <option value="Prosess">Prosess</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: 'var(--font-size-sm)', fontWeight: '500', color: 'var(--gray-700)', marginBottom: '0.5rem' }}>
                    Versjon
                  </label>
                  <input
                    type="text"
                    value={formData.version}
                    onChange={(e) => setFormData(prev => ({ ...prev, version: e.target.value }))}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid var(--gray-300)',
                      borderRadius: 'var(--radius-lg)',
                      fontSize: 'var(--font-size-base)'
                    }}
                    placeholder="1.0"
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 'var(--font-size-sm)', fontWeight: '500', color: 'var(--gray-700)', marginBottom: '0.5rem' }}>
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as any }))}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid var(--gray-300)',
                      borderRadius: 'var(--radius-lg)',
                      fontSize: 'var(--font-size-base)'
                    }}
                  >
                    <option value="draft">Utkast</option>
                    <option value="active">Aktiv</option>
                    <option value="inactive">Inaktiv</option>
                    <option value="archived">Arkivert</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Description */}
            <div>
              <label style={{ display: 'block', fontSize: 'var(--font-size-sm)', fontWeight: '500', color: 'var(--gray-700)', marginBottom: '0.5rem' }}>
                Beskrivelse *
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={4}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: errors.description ? '1px solid var(--red-500)' : '1px solid var(--gray-300)',
                  borderRadius: 'var(--radius-lg)',
                  fontSize: 'var(--font-size-base)',
                  resize: 'vertical'
                }}
                placeholder="Beskriv formålet og omfanget av protokollen..."
              />
              {errors.description && (
                <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--red-500)', marginTop: '0.25rem' }}>
                  {errors.description}
                </p>
              )}
            </div>

            {/* Content */}
            <div>
              <label style={{ display: 'block', fontSize: 'var(--font-size-sm)', fontWeight: '500', color: 'var(--gray-700)', marginBottom: '0.5rem' }}>
                Protokollinnhold
              </label>
              <textarea
                value={formData.content}
                onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                rows={8}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid var(--gray-300)',
                  borderRadius: 'var(--radius-lg)',
                  fontSize: 'var(--font-size-base)',
                  resize: 'vertical'
                }}
                placeholder="Skriv inn det detaljerte innholdet i protokollen..."
              />
            </div>

            {/* Responsibility */}
            <div>
              <h4 style={{ fontSize: 'var(--font-size-base)', fontWeight: '600', color: 'var(--gray-900)', marginBottom: '1rem' }}>
                Ansvar og organisering
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
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
                    placeholder="F.eks. Produksjon, Kvalitet"
                  />
                  {errors.department && (
                    <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--red-500)', marginTop: '0.25rem' }}>
                      {errors.department}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Review Schedule */}
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

            {/* Tags */}
            <div>
              <label style={{ display: 'block', fontSize: 'var(--font-size-sm)', fontWeight: '500', color: 'var(--gray-700)', marginBottom: '0.5rem' }}>
                Tagger
              </label>
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <input
                  type="text"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  style={{
                    flex: '1',
                    padding: '0.75rem',
                    border: '1px solid var(--gray-300)',
                    borderRadius: 'var(--radius-lg)',
                    fontSize: 'var(--font-size-base)'
                  }}
                  placeholder="Legg til tag..."
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                />
                <button
                  type="button"
                  onClick={addTag}
                  className="btn btn-secondary"
                  style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                >
                  <Plus size={16} />
                  Legg til
                </button>
              </div>
              {formData.tags.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {formData.tags.map((tag, index) => (
                    <span
                      key={index}
                      style={{
                        background: 'var(--blue-100)',
                        color: 'var(--blue-800)',
                        padding: '0.25rem 0.75rem',
                        borderRadius: 'var(--radius-full)',
                        fontSize: 'var(--font-size-sm)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                      }}
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0' }}
                      >
                        <X size={12} />
                      </button>
                    </span>
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
                  Opprett protokoll
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 