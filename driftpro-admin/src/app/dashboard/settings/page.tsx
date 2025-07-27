'use client';

import React from 'react';
import { Settings } from 'lucide-react';

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Innstillinger</h1>
            <p className="text-gray-600">Administrer systeminnstillinger og preferanser</p>
          </div>
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="text-center py-12">
          <Settings className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Systeminnstillinger</h3>
          <p className="text-gray-600">Kommer snart - avansert innstillinger og konfigurasjon</p>
        </div>
      </div>
    </div>
  );
} 