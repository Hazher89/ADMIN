'use client';

import React, { useState } from 'react';
import {
  Calendar,
  AlertTriangle,
  Upload,
  X,
  Check
} from 'lucide-react';

interface SelfDeclarationFormProps {
  onSubmit: (data: SelfDeclarationData) => void;
  onCancel: () => void;
  employee?: {
    id: string;
    firstName: string;
    lastName: string;
    department: string;
    email: string;
    phone: string;
  };
}

interface SelfDeclarationData {
  employeeId: string;
  startDate: string;
  endDate: string;
  reason: string;
  symptoms: string[];
  hasSeenDoctor: boolean;
  doctorInfo: {
    name: string;
    clinic?: string;
    phone?: string;
    date?: string;
  };
  emergencyContact: {
    name: string;
    phone: string;
    relationship: string;
    address: string;
  };
  additionalInfo: string;
  attachments: File[];
}

export default function SelfDeclarationForm({ onSubmit, onCancel, employee }: SelfDeclarationFormProps) {
  const [formData, setFormData] = useState<SelfDeclarationData>({
    employeeId: employee?.id || '',
    startDate: '',
    endDate: '',
    reason: '',
    symptoms: [],
    hasSeenDoctor: false,
    doctorInfo: {
      name: '',
      clinic: '',
      phone: '',
      date: ''
    },
    emergencyContact: {
      name: '',
      phone: '',
      relationship: '',
      address: ''
    },
    additionalInfo: '',
    attachments: []
  });

  const [currentStep, setCurrentStep] = useState(1);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const symptomOptions = [
    'Feber',
    'Hoste',
    'Snufse',
    'Hodepine',
    'Magesmerter',
    'Kvalme',
    'Trøtthet',
    'Muskelsmerter',
    'Halsverk',
    'Andre symptomer'
  ];

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    switch (step) {
      case 1:
        if (!formData.startDate) newErrors.startDate = 'Startdato er påkrevd';
        if (!formData.endDate) newErrors.endDate = 'Sluttdato er påkrevd';
        if (new Date(formData.endDate) < new Date(formData.startDate)) {
          newErrors.endDate = 'Sluttdato kan ikke være før startdato';
        }
        if (!formData.reason) newErrors.reason = 'Grunn til fravær er påkrevd';
        break;
      
      case 2:
        if (formData.symptoms.length === 0) newErrors.symptoms = 'Velg minst ett symptom';
        if (!formData.emergencyContact.name) newErrors.emergencyName = 'Pårørende navn er påkrevd';
        if (!formData.emergencyContact.phone) newErrors.emergencyPhone = 'Pårørende telefon er påkrevd';
        break;
      
      case 3:
        if (formData.hasSeenDoctor && !formData.doctorInfo?.name) {
          newErrors.doctorName = 'Lege navn er påkrevd hvis du har vært hos lege';
        }
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 4));
    }
  };

  const handlePrevious = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = () => {
    if (validateStep(currentStep)) {
      onSubmit(formData);
    }
  };

  const handleSymptomToggle = (symptom: string) => {
    setFormData(prev => ({
      ...prev,
      symptoms: prev.symptoms.includes(symptom)
        ? prev.symptoms.filter(s => s !== symptom)
        : [...prev.symptoms, symptom]
    }));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setFormData(prev => ({
      ...prev,
      attachments: [...prev.attachments, ...files]
    }));
  };

  const removeFile = (index: number) => {
    setFormData(prev => ({
      ...prev,
      attachments: prev.attachments.filter((_, i) => i !== index)
    }));
  };

  const calculateDays = () => {
    if (formData.startDate && formData.endDate) {
      const start = new Date(formData.startDate);
      const end = new Date(formData.endDate);
      return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    }
    return 0;
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
            <AlertTriangle className="h-6 w-6 text-orange-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Egenmelding</h2>
            <p className="text-sm text-gray-600">Fyll ut informasjon om fraværet ditt</p>
          </div>
        </div>
        <button
          onClick={onCancel}
          className="text-gray-400 hover:text-gray-600"
        >
          <X className="h-6 w-6" />
        </button>
      </div>

      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {[1, 2, 3, 4].map((step) => (
            <div key={step} className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                step <= currentStep 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-200 text-gray-600'
              }`}>
                {step}
              </div>
              {step < 4 && (
                <div className={`w-16 h-1 mx-2 ${
                  step < currentStep ? 'bg-blue-600' : 'bg-gray-200'
                }`} />
              )}
            </div>
          ))}
        </div>
        <div className="flex justify-between mt-2 text-xs text-gray-500">
          <span>Grunnleggende info</span>
          <span>Symptomer & kontakt</span>
          <span>Legeinfo</span>
          <span>Bekreftelse</span>
        </div>
      </div>

      {/* Step Content */}
      <div className="min-h-96">
        {currentStep === 1 && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Startdato *
                </label>
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 ${
                    errors.startDate ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.startDate && (
                  <p className="text-red-500 text-sm mt-1">{errors.startDate}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sluttdato *
                </label>
                <input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 ${
                    errors.endDate ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.endDate && (
                  <p className="text-red-500 text-sm mt-1">{errors.endDate}</p>
                )}
              </div>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <Calendar className="h-4 w-4 text-blue-600" />
                <span className="font-medium text-blue-900">Fraværsperiode</span>
              </div>
              <p className="text-sm text-blue-700">
                {calculateDays()} dager fra {formData.startDate} til {formData.endDate}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Grunn til fravær *
              </label>
              <textarea
                value={formData.reason}
                onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
                rows={4}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 ${
                  errors.reason ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Beskriv grunnen til fraværet ditt..."
              />
              {errors.reason && (
                <p className="text-red-500 text-sm mt-1">{errors.reason}</p>
              )}
            </div>
          </div>
        )}

        {currentStep === 2 && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Symptomer (velg alle som passer) *
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {symptomOptions.map((symptom) => (
                  <label key={symptom} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formData.symptoms.includes(symptom)}
                      onChange={() => handleSymptomToggle(symptom)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="text-sm text-gray-700">{symptom}</span>
                  </label>
                ))}
              </div>
              {errors.symptoms && (
                <p className="text-red-500 text-sm mt-1">{errors.symptoms}</p>
              )}
            </div>

            <div className="border-t pt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Pårørende kontakt</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Navn *
                  </label>
                  <input
                    type="text"
                    value={formData.emergencyContact.name}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      emergencyContact: { ...prev.emergencyContact, name: e.target.value }
                    }))}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 ${
                      errors.emergencyName ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Navn på pårørende"
                  />
                  {errors.emergencyName && (
                    <p className="text-red-500 text-sm mt-1">{errors.emergencyName}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Telefon *
                  </label>
                  <input
                    type="tel"
                    value={formData.emergencyContact.phone}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      emergencyContact: { ...prev.emergencyContact, phone: e.target.value }
                    }))}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 ${
                      errors.emergencyPhone ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Telefonnummer"
                  />
                  {errors.emergencyPhone && (
                    <p className="text-red-500 text-sm mt-1">{errors.emergencyPhone}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Forhold
                  </label>
                  <input
                    type="text"
                    value={formData.emergencyContact.relationship}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      emergencyContact: { ...prev.emergencyContact, relationship: e.target.value }
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                    placeholder="f.eks. Ektefelle, Forelder"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Adresse
                  </label>
                  <input
                    type="text"
                    value={formData.emergencyContact.address}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      emergencyContact: { ...prev.emergencyContact, address: e.target.value }
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                    placeholder="Adresse"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {currentStep === 3 && (
          <div className="space-y-6">
            <div>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.hasSeenDoctor}
                  onChange={(e) => setFormData(prev => ({ ...prev, hasSeenDoctor: e.target.checked }))}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="text-sm font-medium text-gray-700">Jeg har vært hos lege</span>
              </label>
            </div>

            {formData.hasSeenDoctor && (
              <div className="bg-blue-50 p-4 rounded-lg space-y-4">
                <h3 className="font-medium text-blue-900">Legeinformasjon</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Lege navn
                    </label>
                    <input
                      type="text"
                      value={formData.doctorInfo?.name || ''}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        doctorInfo: { ...prev.doctorInfo, name: e.target.value }
                      }))}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 ${
                        errors.doctorName ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Lege navn"
                    />
                    {errors.doctorName && (
                      <p className="text-red-500 text-sm mt-1">{errors.doctorName}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Klinikk
                    </label>
                    <input
                      type="text"
                      value={formData.doctorInfo?.clinic || ''}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        doctorInfo: { ...prev.doctorInfo, clinic: e.target.value }
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                      placeholder="Klinikk navn"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Lege telefon
                    </label>
                    <input
                      type="tel"
                      value={formData.doctorInfo?.phone || ''}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        doctorInfo: { ...prev.doctorInfo, phone: e.target.value }
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                      placeholder="Telefonnummer"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Konsultasjonsdato
                    </label>
                    <input
                      type="date"
                      value={formData.doctorInfo?.date || ''}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        doctorInfo: { ...prev.doctorInfo, date: e.target.value }
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                    />
                  </div>
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tilleggsinformasjon
              </label>
              <textarea
                value={formData.additionalInfo}
                onChange={(e) => setFormData(prev => ({ ...prev, additionalInfo: e.target.value }))}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                placeholder="Andre relevante opplysninger..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Vedlegg (valgfritt)
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <input
                  type="file"
                  multiple
                  onChange={handleFileUpload}
                  className="hidden"
                  id="file-upload"
                />
                <label htmlFor="file-upload" className="cursor-pointer text-blue-600 hover:text-blue-700">
                  Velg filer
                </label>
                <p className="text-sm text-gray-500 mt-1">eller dra og slipp filer hit</p>
              </div>
              
              {formData.attachments.length > 0 && (
                <div className="mt-4 space-y-2">
                  {formData.attachments.map((file, index) => (
                    <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                      <span className="text-sm text-gray-700">{file.name}</span>
                      <button
                        onClick={() => removeFile(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {currentStep === 4 && (
          <div className="space-y-6">
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <Check className="h-5 w-5 text-green-600" />
                <span className="font-medium text-green-900">Bekreftelse</span>
              </div>
              <p className="text-sm text-green-700">
                Kontroller at all informasjon er korrekt før du sender inn egenmeldingen.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="font-medium text-gray-900">Fraværsinformasjon</h3>
                <div className="space-y-2 text-sm">
                  <p><span className="font-medium">Periode:</span> {formData.startDate} - {formData.endDate}</p>
                  <p><span className="font-medium">Dager:</span> {calculateDays()}</p>
                  <p><span className="font-medium">Grunn:</span> {formData.reason}</p>
                  <p><span className="font-medium">Symptomer:</span> {formData.symptoms.join(', ')}</p>
                </div>
              </div>
              
              <div className="space-y-4">
                <h3 className="font-medium text-gray-900">Pårørende</h3>
                <div className="space-y-2 text-sm">
                  <p><span className="font-medium">Navn:</span> {formData.emergencyContact.name}</p>
                  <p><span className="font-medium">Telefon:</span> {formData.emergencyContact.phone}</p>
                  <p><span className="font-medium">Forhold:</span> {formData.emergencyContact.relationship}</p>
                </div>
              </div>
            </div>

            {formData.hasSeenDoctor && formData.doctorInfo && (
              <div className="space-y-4">
                <h3 className="font-medium text-gray-900">Legeinformasjon</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <p><span className="font-medium">Lege:</span> {formData.doctorInfo.name}</p>
                  <p><span className="font-medium">Klinikk:</span> {formData.doctorInfo.clinic}</p>
                  <p><span className="font-medium">Telefon:</span> {formData.doctorInfo.phone}</p>
                  <p><span className="font-medium">Dato:</span> {formData.doctorInfo.date}</p>
                </div>
              </div>
            )}

            <div className="bg-yellow-50 p-4 rounded-lg">
              <div className="flex items-start space-x-2">
                <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-yellow-900">Viktig informasjon</p>
                  <p className="text-sm text-yellow-700 mt-1">
                    Ved å sende inn denne egenmeldingen bekrefter du at all informasjon er korrekt. 
                    Egenmelding kan brukes i opptil 3 dager per sykdomsforløp.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex justify-between mt-8">
        <button
          onClick={handlePrevious}
          disabled={currentStep === 1}
          className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Forrige
        </button>
        
        <div className="flex space-x-4">
          <button
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
          >
            Avbryt
          </button>
          
          {currentStep < 4 ? (
            <button
              onClick={handleNext}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Neste
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center space-x-2"
            >
              <Check className="h-4 w-4" />
              <span>Send egenmelding</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
} 