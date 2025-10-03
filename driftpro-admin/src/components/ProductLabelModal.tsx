'use client';

import React from 'react';
import { X, QrCode, Package, User, MapPin } from 'lucide-react';

interface ProductLabel {
  id: string;
  orderNumber: string;
  documentNumber: string;
  productIndex: number;
  qrCode: string;
  customerName: string;
  customerAddress: string;
  serviceName: string;
}

interface ProductLabelModalProps {
  isOpen: boolean;
  onClose: () => void;
  labels: ProductLabel[];
}

export default function ProductLabelModal({ isOpen, onClose, labels }: ProductLabelModalProps) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '800px', maxHeight: '90vh' }}>
        <div className="modal-header">
          <h2 className="modal-title">Skannelapper generert</h2>
          <button onClick={onClose} className="modal-close">
            ×
          </button>
        </div>
        
        <div className="modal-body" style={{ overflowY: 'auto', maxHeight: 'calc(90vh - 120px)' }}>
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center space-x-2">
              <Package className="w-5 h-5 text-green-600" />
              <span className="text-sm font-medium text-green-800">
                ✅ {labels.length} skannelapper generert for ordre {labels[0]?.orderNumber}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {labels.map((label) => (
              <div key={label.id} className="border border-gray-200 rounded-lg p-4 bg-white">
                <div className="text-center mb-4">
                  <div className="text-xs text-gray-500 uppercase tracking-wide mb-2">
                    Produkt {label.productIndex} av {labels.length}
                  </div>
                  
                  {/* QR Code Placeholder */}
                  <div className="w-32 h-32 mx-auto bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center mb-3">
                    <div className="text-center">
                      <QrCode className="w-8 h-8 text-gray-400 mx-auto mb-1" />
                      <div className="text-xs text-gray-500 font-mono">
                        {label.qrCode}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center space-x-2">
                    <User className="w-4 h-4 text-gray-400" />
                    <span className="font-medium">{label.customerName}</span>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-600">{label.customerAddress}</span>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Package className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-600">{label.serviceName}</span>
                  </div>
                  
                  <div className="pt-2 border-t border-gray-100">
                    <div className="text-xs text-gray-500">
                      Ordre: {label.orderNumber}
                    </div>
                    <div className="text-xs text-gray-500">
                      Bilag: {label.documentNumber}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="text-sm text-blue-800">
              <strong>Instruksjoner:</strong>
              <ul className="mt-2 space-y-1 text-xs">
                <li>• Skriv ut hver skannelapp på egen side</li>
                <li>• Lim QR-koden på hvert produkt</li>
                <li>• QR-koden inneholder all nødvendig informasjon</li>
                <li>• Skannelappene er permanent registrert i systemet</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button onClick={onClose} className="btn btn-primary">
            Lukk
          </button>
        </div>
      </div>
    </div>
  );
}
