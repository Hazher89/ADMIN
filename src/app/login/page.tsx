'use client';

import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Zap,
  Eye,
  EyeOff,
  Lock,
  Mail,
  User,
  Building,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  Shield,
  Database,
  Globe,
  Palette,
  Download,
  Crown,
  Star,
  Target,
  Award,
  Play,
  Book,
  Video,
  MessageCircle,
  Phone,
  FileText,
  Calendar,
  Clock,
  AlertTriangle,
  MessageSquare,
  TrendingUp,
  HelpCircle,
  Settings,
  LogOut,
  Menu,
  X,
  Bell,
  Search,
  ChevronDown,
  Activity,
  BarChart3,
  PieChart,
  LineChart,
  Plus,
  Filter,
  RefreshCw,
  MapPin,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  DollarSign,
  CalendarDays,
  XCircle,
  ChevronRight,
  ExternalLink,
  ThumbsUp,
  ThumbsDown,
  Send,
  User as UserIcon,
  Settings as SettingsIcon,
  Shield as ShieldIcon,
  Calendar as CalendarIcon,
  AlertTriangle as AlertTriangleIcon,
  CheckCircle as CheckCircleIcon,
  Info,
  Zap as ZapIcon,
  Target as TargetIcon,
  Award as AwardIcon,
  Users as UsersIcon,
  Building as BuildingIcon,
  Search as SearchIcon,
  Download as DownloadIcon,
  Play as PlayIcon,
  ChevronDown as ChevronDownIcon,
  Star as StarIcon,
  ThumbsUp as ThumbsUpIcon,
  ThumbsDown as ThumbsDownIcon,
  Send as SendIcon,
  Clock as ClockIcon,
  Shield as ShieldIcon2,
  Calendar as CalendarIcon2,
  AlertTriangle as AlertTriangleIcon2,
  CheckCircle as CheckCircleIcon2,
  Info as InfoIcon,
  Zap as ZapIcon2,
  Target as TargetIcon2,
  Award as AwardIcon2,
  Users as UsersIcon2,
  Building as BuildingIcon2,
  XCircle as XCircleIcon,
  Search as SearchIcon2,
  Bell as BellIcon,
  Menu as MenuIcon,
  X as XIcon,
  LogOut as LogOutIcon,
  ChevronDown as ChevronDownIcon2,
  Activity as ActivityIcon,
  BarChart3 as BarChart3Icon,
  PieChart as PieChartIcon,
  LineChart as LineChartIcon,
  Eye as EyeIcon,
  Plus as PlusIcon,
  Filter as FilterIcon,
  Search as SearchIcon3,
  Download as DownloadIcon2,
  RefreshCw as RefreshCwIcon,
  Bell as BellIcon2,
  Star as StarIcon2,
  Crown as CrownIcon,
  User as UserIcon2,
  MapPin as MapPinIcon,
  Phone as PhoneIcon,
  Mail as MailIcon,
  ArrowUpRight as ArrowUpRightIcon,
  ArrowDownRight as ArrowDownRightIcon,
  Minus as MinusIcon,
  DollarSign as DollarSignIcon,
  CalendarDays as CalendarDaysIcon,
  FileText as FileTextIcon,
  MessageSquare as MessageSquareIcon,
  Settings as SettingsIcon2,
  HelpCircle as HelpCircleIcon,
  Shield as ShieldIcon3,
  Database as DatabaseIcon,
  Globe as GlobeIcon,
  Palette as PaletteIcon,
  Download as DownloadIcon3,
  Upload,
  Trash2,
  Edit,
  Save,
  Camera,
  Eye as EyeIcon2,
  EyeOff as EyeOffIcon,
  Key,
  Lock as LockIcon,
  Unlock,
  Wifi,
  Battery,
  Signal,
  Wifi as WifiIcon,
  Battery as BatteryIcon,
  Signal as SignalIcon,
  Wifi as WifiIcon2,
  Battery as BatteryIcon2,
  Signal as SignalIcon2,
  Wifi as WifiIcon3,
  Battery as BatteryIcon3,
  Signal as SignalIcon3,
  Wifi as WifiIcon4,
  Battery as BatteryIcon4,
  Signal as SignalIcon4,
  Wifi as WifiIcon5,
  Battery as BatteryIcon5,
  Signal as SignalIcon5,
  Wifi as WifiIcon6,
  Battery as BatteryIcon6,
  Signal as SignalIcon6,
  Wifi as WifiIcon7,
  Battery as BatteryIcon7,
  Signal as SignalIcon7,
  Wifi as WifiIcon8,
  Battery as BatteryIcon8,
  Signal as SignalIcon8,
  Wifi as WifiIcon9,
  Battery as BatteryIcon9,
  Signal as SignalIcon9,
  Wifi as WifiIcon10,
  Battery as BatteryIcon10,
  Signal as SignalIcon10
} from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState('');

  const companies = [
    { id: 'company1', name: 'DriftPro AS', logo: '🏢' },
    { id: 'company2', name: 'TechCorp Norge', logo: '⚡' },
    { id: 'company3', name: 'Innovation Labs', logo: '🔬' },
    { id: 'company4', name: 'Digital Solutions', logo: '💻' }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast.error('Vennligst fyll ut alle feltene');
      return;
    }

    if (!selectedCompany) {
      toast.error('Vennligst velg et selskap');
      return;
    }

    setIsLoading(true);
    
    try {
      await login(email, password);
      toast.success('Innlogget!');
      router.push('/dashboard');
    } catch (error) {
      console.error('Login error:', error);
      toast.error('Innlogging mislyktes. Sjekk dine påloggingsdetaljer.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 flex">
      {/* Left side - Login form */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          {/* Header */}
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-xl">
                <Zap className="h-8 w-8 text-white" />
              </div>
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Velkommen tilbake
            </h2>
            <p className="text-gray-600">
              Logg inn på din DriftPro konto
            </p>
          </div>

          {/* Company Selection */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Velg selskap
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {companies.map((company) => (
                <button
                  key={company.id}
                  onClick={() => setSelectedCompany(company.id)}
                  className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                    selectedCompany === company.id
                      ? 'border-blue-500 bg-blue-50 shadow-md transform scale-105'
                      : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                  }`}
                >
                  <div className="text-2xl mb-2">{company.logo}</div>
                  <div className="text-sm font-medium text-gray-900">
                    {company.name}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Login Form */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  E-postadresse
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm transition-all duration-200"
                    placeholder="din@email.com"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  Passord
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full pl-10 pr-12 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm transition-all duration-200"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                    )}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    id="remember-me"
                    name="remember-me"
                    type="checkbox"
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
                    Husk meg
                  </label>
                </div>

                <div className="text-sm">
                  <Link
                    href="/help"
                    className="font-medium text-blue-600 hover:text-blue-500 transition-colors"
                  >
                    Glemt passord?
                  </Link>
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-xl text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105 disabled:transform-none"
                >
                  {isLoading ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Logger inn...
                    </div>
                  ) : (
                    <div className="flex items-center">
                      <span>Logg inn</span>
                      <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                  )}
                </button>
              </div>
            </form>

            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">Eller</span>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-3">
                <button className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-xl shadow-sm bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 transition-colors">
                  <svg className="h-5 w-5" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  <span className="ml-2">Google</span>
                </button>

                <button className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-xl shadow-sm bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 transition-colors">
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/>
                  </svg>
                  <span className="ml-2">Microsoft</span>
                </button>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center">
            <p className="text-sm text-gray-600">
              Ny bruker?{' '}
              <Link
                href="/help"
                className="font-medium text-blue-600 hover:text-blue-500 transition-colors"
              >
                Kontakt administrator
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* Right side - Features showcase */}
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-blue-600 to-purple-600 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/4 w-72 h-72 bg-blue-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
          <div className="absolute top-0 right-1/4 w-72 h-72 bg-purple-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
          <div className="absolute -bottom-8 left-1/3 w-72 h-72 bg-pink-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
        </div>

        <div className="relative z-10 flex items-center justify-center w-full">
          <div className="max-w-lg text-center text-white px-8">
            <h1 className="text-4xl font-bold mb-6">
              DriftPro Admin
            </h1>
            <p className="text-xl text-blue-100 mb-8">
              Den avanserte administrasjonsplattformen for moderne bedrifter
            </p>

            {/* Feature highlights */}
            <div className="space-y-6">
              <div className="flex items-center space-x-4 p-4 bg-white/10 rounded-xl backdrop-blur-sm">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                  <Users className="h-6 w-6 text-white" />
                </div>
                <div className="text-left">
                  <h3 className="font-semibold">Ansattadministrasjon</h3>
                  <p className="text-blue-100 text-sm">Administrer ansatte og roller enkelt</p>
                </div>
              </div>

              <div className="flex items-center space-x-4 p-4 bg-white/10 rounded-xl backdrop-blur-sm">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                  <Clock className="h-6 w-6 text-white" />
                </div>
                <div className="text-left">
                  <h3 className="font-semibold">Tidsregistrering</h3>
                  <p className="text-blue-100 text-sm">Spor arbeidstid og overtid</p>
                </div>
              </div>

              <div className="flex items-center space-x-4 p-4 bg-white/10 rounded-xl backdrop-blur-sm">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                  <AlertTriangle className="h-6 w-6 text-white" />
                </div>
                <div className="text-left">
                  <h3 className="font-semibold">Avvikshåndtering</h3>
                  <p className="text-blue-100 text-sm">Rapporter og håndter avvik</p>
                </div>
              </div>

              <div className="flex items-center space-x-4 p-4 bg-white/10 rounded-xl backdrop-blur-sm">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                  <BarChart3 className="h-6 w-6 text-white" />
                </div>
                <div className="text-left">
                  <h3 className="font-semibold">Rapporter & Analyse</h3>
                  <p className="text-blue-100 text-sm">Få innsikt i bedriftsdata</p>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="mt-12 grid grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold">500+</div>
                <div className="text-blue-100 text-sm">Bedrifter</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">50K+</div>
                <div className="text-blue-100 text-sm">Brukere</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">99.9%</div>
                <div className="text-blue-100 text-sm">Oppetid</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 