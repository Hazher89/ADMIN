'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { 
  HelpCircle,
  Search,
  Book,
  Video,
  MessageCircle,
  Phone,
  Mail,
  FileText,
  Download,
  Play,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Star,
  ThumbsUp,
  ThumbsDown,
  Send,
  Clock,
  User,
  Settings,
  Shield,
  Calendar,
  Clock as ClockIcon,
  AlertTriangle,
  CheckCircle,
  Info,
  Zap,
  Target,
  Award,
  Users,
  Building,
  XCircle
} from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function HelpPage() {
  const { userProfile, isAdmin, isDepartmentLeader } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [expandedFaqs, setExpandedFaqs] = useState<number[]>([]);
  const [showContactForm, setShowContactForm] = useState(false);
  const [contactForm, setContactForm] = useState({
    subject: '',
    message: '',
    priority: 'medium'
  });

  const categories = [
    { id: 'all', name: 'Alle kategorier', icon: Book },
    { id: 'getting-started', name: 'Komme i gang', icon: Zap },
    { id: 'timeclock', name: 'Stemple system', icon: ClockIcon },
    { id: 'shifts', name: 'Skiftplan', icon: Calendar },
    { id: 'vacation', name: 'Ferie og fravær', icon: Calendar },
    { id: 'deviations', name: 'Avvik', icon: AlertTriangle },
    { id: 'documents', name: 'Dokumenter', icon: FileText },
    { id: 'reports', name: 'Rapporter', icon: Target },
    { id: 'security', name: 'Sikkerhet', icon: Shield },
    { id: 'account', name: 'Konto', icon: User }
  ];

  const faqs = [
    {
      id: 1,
      category: 'getting-started',
      question: 'Hvordan logger jeg inn for første gang?',
      answer: 'For første innlogging bruker du e-postadressen din og det midlertidige passordet du har mottatt. Du blir bedt om å endre passordet ved første innlogging.',
      helpful: 45,
      notHelpful: 2
    },
    {
      id: 2,
      category: 'timeclock',
      question: 'Hvordan stempler jeg inn og ut?',
      answer: 'Gå til "Stemple" i hovedmenyen. Klikk på "Stemple inn" når du starter arbeidet og "Stemple ut" når du er ferdig. Systemet registrerer automatisk tidspunkt og lokasjon.',
      helpful: 67,
      notHelpful: 1
    },
    {
      id: 3,
      category: 'shifts',
      question: 'Hvordan ser jeg mine skift?',
      answer: 'Under "Skiftplan" kan du se alle dine planlagte skift. Du kan filtrere etter dato, avdeling eller status. Bekreft eller avvis skift som er sendt til deg.',
      helpful: 89,
      notHelpful: 3
    },
    {
      id: 4,
      category: 'vacation',
      question: 'Hvordan søker jeg om ferie?',
      answer: 'Gå til "Ferie" og klikk "Søk om ferie". Fyll ut skjemaet med start- og sluttdato, type ferie og begrunnelse. Søknaden sendes til din leder for godkjenning.',
      helpful: 123,
      notHelpful: 5
    },
    {
      id: 5,
      category: 'deviations',
      question: 'Hvordan rapporterer jeg et avvik?',
      answer: 'Under "Avvik" klikker du "Rapporter avvik". Velg kategori, beskriv problemet og last opp eventuelle bilder eller dokumenter. Avviket sendes til relevant leder.',
      helpful: 78,
      notHelpful: 2
    },
    {
      id: 6,
      category: 'documents',
      question: 'Hvordan laster jeg opp dokumenter?',
      answer: 'I "Dokumenter" klikker du "Last opp". Velg fil, fyll ut beskrivelse og sett tilgangsrettigheter. Dokumentet blir lagret og tilgjengelig for autoriserte brukere.',
      helpful: 56,
      notHelpful: 4
    },
    {
      id: 7,
      category: 'reports',
      question: 'Hvordan genererer jeg rapporter?',
      answer: 'Under "Rapporter" velger du rapporttype, periode og filtreringskriterier. Klikk "Generer" for å opprette rapporten. Du kan eksportere til PDF eller Excel.',
      helpful: 34,
      notHelpful: 1
    },
    {
      id: 8,
      category: 'security',
      question: 'Hvordan aktiverer jeg to-faktor autentisering?',
      answer: 'Gå til "Min profil" > "Sikkerhet" og aktiver to-faktor autentisering. Følg instruksjonene for å koble til en autentiseringsapp som Google Authenticator.',
      helpful: 23,
      notHelpful: 0
    }
  ];

  const tutorials = [
    {
      id: 1,
      title: 'Komme i gang med DriftPro',
      duration: '5 min',
      category: 'getting-started',
      thumbnail: '/tutorials/getting-started.jpg',
      description: 'Lær det grunnleggende om DriftPro og hvordan du navigerer i systemet.'
    },
    {
      id: 2,
      title: 'Stemple system - Komplett guide',
      duration: '8 min',
      category: 'timeclock',
      thumbnail: '/tutorials/timeclock.jpg',
      description: 'Alt du trenger å vite om tidsregistrering og stempel systemet.'
    },
    {
      id: 3,
      title: 'Skiftplanlegging for ledere',
      duration: '12 min',
      category: 'shifts',
      thumbnail: '/tutorials/shifts.jpg',
      description: 'Hvordan planlegge og administrere skift for ditt team.'
    },
    {
      id: 4,
      title: 'Avvikshåndtering',
      duration: '6 min',
      category: 'deviations',
      thumbnail: '/tutorials/deviations.jpg',
      description: 'Riktig prosedyre for å rapportere og håndtere avvik.'
    }
  ];

  const filteredFaqs = faqs.filter(faq => {
    const matchesSearch = faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         faq.answer.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || faq.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const toggleFaq = (faqId: number) => {
    setExpandedFaqs(prev => 
      prev.includes(faqId) 
        ? prev.filter(id => id !== faqId)
        : [...prev, faqId]
    );
  };

  const handleHelpful = (faqId: number, helpful: boolean) => {
    // This would typically update the database
    toast.success(helpful ? 'Takk for tilbakemeldingen!' : 'Takk for tilbakemeldingen!');
  };

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Contact form submission logic would go here
      toast.success('Melding sendt! Vi svarer innen 24 timer.');
      setShowContactForm(false);
      setContactForm({ subject: '', message: '', priority: 'medium' });
    } catch (error) {
      toast.error('Kunne ikke sende melding');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Hjelp & Support</h1>
        <p className="text-lg text-gray-600 mb-8">
          Få hjelp med DriftPro og finn svar på vanlige spørsmål
        </p>
      </div>

      {/* Search Bar */}
      <div className="max-w-2xl mx-auto">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Søk etter hjelp, tutorials eller FAQ..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg"
          />
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl p-6 text-white text-center">
          <MessageCircle className="h-12 w-12 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Live Chat</h3>
          <p className="text-blue-100 mb-4">Få umiddelbar hjelp fra vårt support team</p>
          <button className="bg-white text-blue-600 px-4 py-2 rounded-lg font-medium hover:bg-blue-50 transition-colors">
            Start chat
          </button>
        </div>

        <div className="bg-gradient-to-r from-green-600 to-green-700 rounded-xl p-6 text-white text-center">
          <Phone className="h-12 w-12 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Ring oss</h3>
          <p className="text-green-100 mb-4">Snakk direkte med vårt support team</p>
          <button className="bg-white text-green-600 px-4 py-2 rounded-lg font-medium hover:bg-green-50 transition-colors">
            +47 123 45 678
          </button>
        </div>

        <div className="bg-gradient-to-r from-purple-600 to-purple-700 rounded-xl p-6 text-white text-center">
          <Mail className="h-12 w-12 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">E-post support</h3>
          <p className="text-purple-100 mb-4">Send oss en melding og få svar innen 24 timer</p>
          <button 
            onClick={() => setShowContactForm(true)}
            className="bg-white text-purple-600 px-4 py-2 rounded-lg font-medium hover:bg-purple-50 transition-colors"
          >
            Send melding
          </button>
        </div>
      </div>

      {/* Categories */}
      <div className="bg-white shadow-lg rounded-xl border border-gray-100 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Kategorier</h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {categories.map((category) => {
            const Icon = category.icon;
            return (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`p-4 rounded-lg border-2 transition-all ${
                  selectedCategory === category.id
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <Icon className="h-8 w-8 mx-auto mb-2" />
                <p className="text-sm font-medium">{category.name}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tutorials */}
      <div className="bg-white shadow-lg rounded-xl border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Video tutorials</h2>
          <button className="text-blue-600 hover:text-blue-700 font-medium">
            Se alle tutorials
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {tutorials.map((tutorial) => (
            <div key={tutorial.id} className="bg-gray-50 rounded-lg overflow-hidden hover:shadow-md transition-shadow">
              <div className="h-32 bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center">
                <Play className="h-12 w-12 text-white" />
              </div>
              <div className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-gray-500">{tutorial.duration}</span>
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                    {categories.find(c => c.id === tutorial.category)?.name}
                  </span>
                </div>
                <h3 className="font-medium text-gray-900 mb-2">{tutorial.title}</h3>
                <p className="text-sm text-gray-600">{tutorial.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* FAQs */}
      <div className="bg-white shadow-lg rounded-xl border border-gray-100 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">
          Vanlige spørsmål ({filteredFaqs.length})
        </h2>
        <div className="space-y-4">
          {filteredFaqs.map((faq) => (
            <div key={faq.id} className="border border-gray-200 rounded-lg">
              <button
                onClick={() => toggleFaq(faq.id)}
                className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">
                    {categories.find(c => c.id === faq.category)?.name}
                  </span>
                  <span className="font-medium text-gray-900">{faq.question}</span>
                </div>
                {expandedFaqs.includes(faq.id) ? (
                  <ChevronDown className="h-5 w-5 text-gray-400" />
                ) : (
                  <ChevronRight className="h-5 w-5 text-gray-400" />
                )}
              </button>
              
              {expandedFaqs.includes(faq.id) && (
                <div className="px-6 pb-4">
                  <p className="text-gray-600 mb-4">{faq.answer}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <button
                        onClick={() => handleHelpful(faq.id, true)}
                        className="flex items-center space-x-1 text-sm text-gray-500 hover:text-green-600"
                      >
                        <ThumbsUp className="h-4 w-4" />
                        <span>Hjelpsom ({faq.helpful})</span>
                      </button>
                      <button
                        onClick={() => handleHelpful(faq.id, false)}
                        className="flex items-center space-x-1 text-sm text-gray-500 hover:text-red-600"
                      >
                        <ThumbsDown className="h-4 w-4" />
                        <span>Ikke hjelpsom ({faq.notHelpful})</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {filteredFaqs.length === 0 && (
          <div className="text-center py-12">
            <HelpCircle className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Ingen resultater funnet</h3>
            <p className="text-gray-500">
              Prøv å endre søkekriteriene eller kontakt support for hjelp.
            </p>
          </div>
        )}
      </div>

      {/* Documentation */}
      <div className="bg-white shadow-lg rounded-xl border border-gray-100 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Dokumentasjon</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center space-x-3 mb-3">
              <FileText className="h-8 w-8 text-blue-600" />
              <div>
                <h3 className="font-medium text-gray-900">Brukerhåndbok</h3>
                <p className="text-sm text-gray-500">Komplett guide til DriftPro</p>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">PDF • 2.3 MB</span>
              <button className="text-blue-600 hover:text-blue-700">
                <Download className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center space-x-3 mb-3">
              <Shield className="h-8 w-8 text-green-600" />
              <div>
                <h3 className="font-medium text-gray-900">Sikkerhetsguide</h3>
                <p className="text-sm text-gray-500">Best practices for sikkerhet</p>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">PDF • 1.8 MB</span>
              <button className="text-blue-600 hover:text-blue-700">
                <Download className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center space-x-3 mb-3">
              <Settings className="h-8 w-8 text-purple-600" />
              <div>
                <h3 className="font-medium text-gray-900">Admin guide</h3>
                <p className="text-sm text-gray-500">For systemadministratorer</p>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">PDF • 3.1 MB</span>
              <button className="text-blue-600 hover:text-blue-700">
                <Download className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Contact Form Modal */}
      {showContactForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Kontakt support</h3>
              <button
                onClick={() => setShowContactForm(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle className="h-6 w-6" />
              </button>
            </div>
            
            <form onSubmit={handleContactSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Emne
                </label>
                <input
                  type="text"
                  value={contactForm.subject}
                  onChange={(e) => setContactForm({...contactForm, subject: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Prioritet
                </label>
                <select
                  value={contactForm.priority}
                  onChange={(e) => setContactForm({...contactForm, priority: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="low">Lav</option>
                  <option value="medium">Medium</option>
                  <option value="high">Høy</option>
                  <option value="urgent">Kritisk</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Melding
                </label>
                <textarea
                  value={contactForm.message}
                  onChange={(e) => setContactForm({...contactForm, message: e.target.value})}
                  rows={4}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Beskriv problemet ditt..."
                  required
                />
              </div>
              
              <div className="flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowContactForm(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Avbryt
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <Send className="h-4 w-4 inline mr-2" />
                  Send melding
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
} 