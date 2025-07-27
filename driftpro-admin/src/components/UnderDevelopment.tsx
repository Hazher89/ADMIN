'use client';

import React from 'react';
import { Construction, Code, Database, Shield, Zap, Users, Calendar, AlertTriangle, MessageSquare, FileText, BarChart3 } from 'lucide-react';

export default function UnderDevelopment() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-4xl mx-auto text-center">
        <div className="mb-8">
          <div className="mx-auto h-24 w-24 bg-blue-600 rounded-full flex items-center justify-center mb-6">
            <Construction className="h-12 w-12 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            DriftPro Admin
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Avansert administrasjonssystem under utvikling
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-xl p-8 mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">
            Kommende Funksjoner
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="text-center p-6 border border-gray-200 rounded-lg">
              <div className="mx-auto h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Brukeradministrasjon</h3>
              <p className="text-sm text-gray-600">
                Avansert system for å administrere ansatte, avdelinger og tilganger
              </p>
            </div>

            <div className="text-center p-6 border border-gray-200 rounded-lg">
              <div className="mx-auto h-12 w-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <Calendar className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Fravær & Ferie</h3>
              <p className="text-sm text-gray-600">
                Komplett system med godkjenning, kalender og 5 års oversikt
              </p>
            </div>

            <div className="text-center p-6 border border-gray-200 rounded-lg">
              <div className="mx-auto h-12 w-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Avvikshåndtering</h3>
              <p className="text-sm text-gray-600">
                Unik ID, status tracking og avansert kommentarsystem
              </p>
            </div>

            <div className="text-center p-6 border border-gray-200 rounded-lg">
              <div className="mx-auto h-12 w-12 bg-purple-100 rounded-full flex items-center justify-center mb-4">
                <MessageSquare className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Chat & Kommunikasjon</h3>
              <p className="text-sm text-gray-600">
                WhatsApp-lignende med grupper, filer og read receipts
              </p>
            </div>

            <div className="text-center p-6 border border-gray-200 rounded-lg">
              <div className="mx-auto h-12 w-12 bg-yellow-100 rounded-full flex items-center justify-center mb-4">
                <FileText className="h-6 w-6 text-yellow-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Dokumenter</h3>
              <p className="text-sm text-gray-600">
                Fildeling med granulær tilgangskontroll og versjonering
              </p>
            </div>

            <div className="text-center p-6 border border-gray-200 rounded-lg">
              <div className="mx-auto h-12 w-12 bg-indigo-100 rounded-full flex items-center justify-center mb-4">
                <BarChart3 className="h-6 w-6 text-indigo-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Rapporter & Analytics</h3>
              <p className="text-sm text-gray-600">
                Avanserte diagrammer og lovdata-integrasjon
              </p>
            </div>
          </div>
        </div>

        <div className="bg-blue-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-4">
            Teknisk Stack
          </h3>
          <div className="flex flex-wrap justify-center gap-4 text-sm">
            <div className="flex items-center space-x-2 bg-white px-3 py-2 rounded-full">
              <Code className="h-4 w-4 text-blue-600" />
              <span>Next.js 14</span>
            </div>
            <div className="flex items-center space-x-2 bg-white px-3 py-2 rounded-full">
              <Database className="h-4 w-4 text-green-600" />
              <span>Firebase</span>
            </div>
            <div className="flex items-center space-x-2 bg-white px-3 py-2 rounded-full">
              <Shield className="h-4 w-4 text-red-600" />
              <span>GDPR Compliant</span>
            </div>
            <div className="flex items-center space-x-2 bg-white px-3 py-2 rounded-full">
              <Zap className="h-4 w-4 text-yellow-600" />
              <span>Real-time</span>
            </div>
          </div>
        </div>

        <div className="mt-8 text-sm text-gray-500">
          <p>Systemet er under aktiv utvikling og vil være tilgjengelig snart.</p>
          <p className="mt-2">
            For spørsmål, kontakt: <a href="mailto:support@driftpro.no" className="text-blue-600 hover:underline">support@driftpro.no</a>
          </p>
        </div>
      </div>
    </div>
  );
} 