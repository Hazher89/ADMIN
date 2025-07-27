'use client';

import React, { useState, useEffect } from 'react';
import { 
  Zap,
  Users,
  Building,
  Calendar,
  Clock,
  FileText,
  AlertTriangle,
  MessageSquare,
  TrendingUp,
  Shield,
  Database,
  Globe,
  Palette,
  Download,
  Crown,
  Star,
  Target,
  Award,
  ArrowRight,
  Play,
  Book,
  Video,
  MessageCircle,
  Phone,
  Mail,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  ThumbsUp,
  ThumbsDown,
  Send,
  User,
  Settings,
  Info,
  XCircle,
  Search,
  Bell,
  Menu,
  X,
  LogOut,
  Activity,
  BarChart3,
  PieChart,
  LineChart,
  Eye,
  Plus,
  Filter,
  RefreshCw,
  Upload,
  Trash2,
  Edit,
  Save,
  Camera,
  Key,
  Unlock,
  Wifi,
  Battery,
  Signal
} from 'lucide-react';

export default function HomePage() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate loading time
    setTimeout(() => {
      setIsLoading(false);
    }, 1000);
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50">
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-lg border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                <Zap className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">DriftPro</h1>
                <p className="text-sm text-gray-500">Admin Panel</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <a
                href="/help"
                className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                Hjelp
              </a>
              <a
                href="/login"
                className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                Logg inn
              </a>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
              Velkommen til{' '}
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                DriftPro
              </span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Den avanserte administrasjonsplattformen for moderne bedrifter. 
              Administrer ansatte, skift, fravær, avvik og mye mer på en enkelt plass.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="/login"
                className="inline-flex items-center px-8 py-4 border border-transparent text-lg font-medium rounded-xl shadow-lg text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transition-all duration-200 transform hover:scale-105"
              >
                Kom i gang
                <ArrowRight className="ml-2 h-5 w-5" />
              </a>
              <a
                href="/help"
                className="inline-flex items-center px-8 py-4 border border-gray-300 text-lg font-medium rounded-xl text-gray-700 bg-white hover:bg-gray-50 transition-all duration-200"
              >
                Lær mer
              </a>
            </div>
          </div>
        </div>

        {/* Background decoration */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 left-1/4 w-72 h-72 bg-blue-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
          <div className="absolute top-0 right-1/4 w-72 h-72 bg-purple-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
          <div className="absolute -bottom-8 left-1/3 w-72 h-72 bg-pink-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Alt du trenger for bedriftsadministrasjon
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              DriftPro gir deg alle verktøyene du trenger for å administrere din bedrift effektivt og sikker.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Employee Management */}
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-8 hover:transform hover:scale-105 transition-all duration-200">
              <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center mb-6">
                <Users className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Ansattadministrasjon</h3>
              <p className="text-gray-600 mb-6">
                Administrer ansatte, roller, avdelinger og tilganger på en enkelt plass.
              </p>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                  Brukerregistrering og profilhåndtering
                </li>
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                  Rollebasert tilgangskontroll
                </li>
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                  Avdelingsadministrasjon
                </li>
              </ul>
            </div>

            {/* Time Tracking */}
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-8 hover:transform hover:scale-105 transition-all duration-200">
              <div className="w-12 h-12 bg-green-600 rounded-xl flex items-center justify-center mb-6">
                <Clock className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Tidsregistrering</h3>
              <p className="text-gray-600 mb-6">
                Spor arbeidstid, overtid og fravær med avanserte stempel-funksjoner.
              </p>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                  Digital stempling med lokasjon
                </li>
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                  Overtidsberegning automatisk
                </li>
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                  Fraværsrapportering
                </li>
              </ul>
            </div>

            {/* Shift Planning */}
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-8 hover:transform hover:scale-105 transition-all duration-200">
              <div className="w-12 h-12 bg-purple-600 rounded-xl flex items-center justify-center mb-6">
                <Calendar className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Skiftplanlegging</h3>
              <p className="text-gray-600 mb-6">
                Planlegg og administrer skift med avanserte planleggingsverktøy.
              </p>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                  Visuell skiftplanlegger
                </li>
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                  Automatisk varsling
                </li>
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                  Kapasitetsplanlegging
                </li>
              </ul>
            </div>

            {/* Document Management */}
            <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-2xl p-8 hover:transform hover:scale-105 transition-all duration-200">
              <div className="w-12 h-12 bg-yellow-600 rounded-xl flex items-center justify-center mb-6">
                <FileText className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Dokumentadministrasjon</h3>
              <p className="text-gray-600 mb-6">
                Organiser og del dokumenter med avansert tilgangskontroll.
              </p>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                  Sikker fillagring
                </li>
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                  Versjonskontroll
                </li>
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                  Tilgangsrettigheter
                </li>
              </ul>
            </div>

            {/* Deviation Management */}
            <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-2xl p-8 hover:transform hover:scale-105 transition-all duration-200">
              <div className="w-12 h-12 bg-red-600 rounded-xl flex items-center justify-center mb-6">
                <AlertTriangle className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Avvikshåndtering</h3>
              <p className="text-gray-600 mb-6">
                Rapporter og håndter avvik systematisk med full sporbarhet.
              </p>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                  Avviksrapportering
                </li>
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                  Workflow-håndtering
                </li>
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                  Analyse og rapportering
                </li>
              </ul>
            </div>

            {/* Communication */}
            <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-2xl p-8 hover:transform hover:scale-105 transition-all duration-200">
              <div className="w-12 h-12 bg-emerald-600 rounded-xl flex items-center justify-center mb-6">
                <MessageSquare className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Kommunikasjon</h3>
              <p className="text-gray-600 mb-6">
                Hold teamet ditt informert med avanserte kommunikasjonsverktøy.
              </p>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                  Intern chat-system
                </li>
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                  Varsling og påminnelser
                </li>
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                  Gruppemeldinger
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="py-24 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-white mb-4">
              Betrodd av ledende bedrifter
            </h2>
            <p className="text-xl text-blue-100">
              DriftPro hjelper bedrifter over hele landet med å effektivisere sin administrasjon.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-white mb-2">500+</div>
              <div className="text-blue-100">Aktive bedrifter</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-white mb-2">50,000+</div>
              <div className="text-blue-100">Registrerte brukere</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-white mb-2">99.9%</div>
              <div className="text-blue-100">Oppetid</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-white mb-2">24/7</div>
              <div className="text-blue-100">Support</div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-24 bg-white">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Klar til å komme i gang?
          </h2>
          <p className="text-lg text-gray-600 mb-8">
            Bli med hundrevis av bedrifter som allerede bruker DriftPro for å effektivisere sin administrasjon.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/login"
              className="inline-flex items-center px-8 py-4 border border-transparent text-lg font-medium rounded-xl shadow-lg text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transition-all duration-200 transform hover:scale-105"
            >
              Start gratis prøveperiode
              <ArrowRight className="ml-2 h-5 w-5" />
            </a>
            <a
              href="/help"
              className="inline-flex items-center px-8 py-4 border border-gray-300 text-lg font-medium rounded-xl text-gray-700 bg-white hover:bg-gray-50 transition-all duration-200"
            >
              Kontakt oss
            </a>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                  <Zap className="h-4 w-4 text-white" />
                </div>
                <span className="text-xl font-bold">DriftPro</span>
              </div>
              <p className="text-gray-400">
                Den avanserte administrasjonsplattformen for moderne bedrifter.
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Produkt</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="/help" className="hover:text-white transition-colors">Funksjoner</a></li>
                <li><a href="/help" className="hover:text-white transition-colors">Priser</a></li>
                <li><a href="/help" className="hover:text-white transition-colors">Integrasjoner</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Support</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="/help" className="hover:text-white transition-colors">Hjelp</a></li>
                <li><a href="/help" className="hover:text-white transition-colors">Dokumentasjon</a></li>
                <li><a href="/help" className="hover:text-white transition-colors">Kontakt</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Selskap</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="/help" className="hover:text-white transition-colors">Om oss</a></li>
                <li><a href="/help" className="hover:text-white transition-colors">Karriere</a></li>
                <li><a href="/help" className="hover:text-white transition-colors">Personvern</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 DriftPro. Alle rettigheter forbeholdt.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
