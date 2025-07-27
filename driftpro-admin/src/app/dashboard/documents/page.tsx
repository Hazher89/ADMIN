'use client';

import React from 'react';
import { FileText, Plus } from 'lucide-react';

export default function DocumentsPage() {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dokumenter</h1>
            <p className="text-gray-600">Administrer og del dokumenter med ansatte</p>
          </div>
          <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2">
            <Plus className="h-4 w-4" />
            <span>Last opp dokument</span>
          </button>
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="text-center py-12">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Dokumentadministrasjon</h3>
          <p className="text-gray-600">Kommer snart - avansert dokumentadministrasjon med deling</p>
        </div>
      </div>
    </div>
  );
} 