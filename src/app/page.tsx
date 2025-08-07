'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Zap, Users, Building, Calendar, Clock, FileText, AlertTriangle, MessageSquare,
  TrendingUp, Shield, Database, Globe, Palette, Download, Crown, Star, Target,
  Award, ArrowRight, CheckCircle, Play, Book, Video, MessageCircle, Phone, Mail,
  ChevronDown, ChevronRight, ExternalLink, ThumbsUp, ThumbsDown, Send, User,
  Settings, Info, XCircle, Search, Bell, Menu, X, LogOut, Activity, BarChart3,
  PieChart, LineChart, Eye, Plus, Filter, RefreshCw, Upload, Trash2, Edit, Save,
  Camera, Key, Unlock, Wifi, Battery, Signal, Rocket, Code, Cpu, Server, Cloud,
  Lock, EyeOff, Maximize2, Minimize2, RotateCcw, Layers, GitBranch, GitCommit, 
  GitPullRequest, GitMerge, GitCompare, GitFork, Terminal, Command, HardDrive, 
  Network, WifiOff, Bluetooth, Smartphone, Tablet, Monitor, Laptop, Watch, 
  Headphones, Speaker, VideoOff, CameraOff, Volume2, VolumeX, SkipBack, SkipForward,
  Rewind, FastForward, Pause, Square, Circle, Triangle, Hexagon, Octagon,
  Diamond, Heart, Coffee, Beer, Wine, Pizza, Hamburger, IceCream, Cake, Apple, 
  Carrot, Leaf, Flower, Sun, Moon, CloudRain, CloudSnow, Wind, Umbrella,
  Snowflake, Droplets, Flame, Sparkles, Mountain, Waves, Fish, Bird, Cat, Dog, 
  Bug, Worm, Turtle, Shell
} from 'lucide-react';

// Advanced Particle System Component
const ParticleSystem = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    const particles: Array<{
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      opacity: number;
      color: string;
    }> = [];
    
    const colors = ['#3B82F6', '#8B5CF6', '#06B6D4', '#10B981', '#F59E0B'];
    
    // Create particles
    for (let i = 0; i < 100; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        size: Math.random() * 3 + 1,
        opacity: Math.random() * 0.5 + 0.1,
        color: colors[Math.floor(Math.random() * colors.length)]
      });
    }
    
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      particles.forEach((particle, index) => {
        particle.x += particle.vx;
        particle.y += particle.vy;
        
        if (particle.x < 0 || particle.x > canvas.width) particle.vx *= -1;
        if (particle.y < 0 || particle.y > canvas.height) particle.vy *= -1;
        
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fillStyle = particle.color;
        ctx.globalAlpha = particle.opacity;
        ctx.fill();
        
        // Connect nearby particles
        particles.forEach((otherParticle, otherIndex) => {
          if (index !== otherIndex) {
            const dx = particle.x - otherParticle.x;
            const dy = particle.y - otherParticle.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < 100) {
              ctx.beginPath();
              ctx.moveTo(particle.x, particle.y);
              ctx.lineTo(otherParticle.x, otherParticle.y);
              ctx.strokeStyle = particle.color;
              ctx.globalAlpha = (100 - distance) / 100 * 0.1;
              ctx.lineWidth = 1;
              ctx.stroke();
            }
          }
        });
      });
      
      requestAnimationFrame(animate);
    };
    
    animate();
    
    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);
  
  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: -1 }}
    />
  );
};

// Interactive Card Component with 3D effects
const InteractiveCard = ({ 
  title, 
  description, 
  icon: Icon, 
  color, 
  features, 
  stats,
  gradient 
}: {
  title: string;
  description: string;
  icon: any;
  color: string;
  features: string[];
  stats?: { label: string; value: string }[];
  gradient: string;
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    const rotateX = (y - centerY) / 10;
    const rotateY = (centerX - x) / 10;
    
    cardRef.current.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.05, 1.05, 1.05)`;
  };
  
  const handleMouseLeave = () => {
    if (cardRef.current) {
      cardRef.current.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';
    }
    setIsHovered(false);
  };
  
  return (
    <div
      ref={cardRef}
      className={`relative overflow-hidden rounded-2xl p-8 cursor-pointer transition-all duration-500 hover:scale-105 ${gradient}`}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
      onClick={() => setIsExpanded(!isExpanded)}
    >
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white rounded-full -translate-y-16 translate-x-16"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white rounded-full translate-y-12 -translate-x-12"></div>
      </div>
      
      {/* Icon */}
      <div className={`relative z-10 w-16 h-16 ${color} rounded-2xl flex items-center justify-center mb-6 transition-transform duration-300 ${isHovered ? 'scale-110 rotate-12' : ''}`}>
        <Icon className="w-8 h-8 text-white" />
      </div>
      
      {/* Content */}
      <div className="relative z-10">
        <h3 className="text-2xl font-bold text-white mb-3">{title}</h3>
        <p className="text-white/80 mb-6 leading-relaxed">{description}</p>
        
        {/* Features */}
        <div className="space-y-2 mb-6">
          {features.map((feature, index) => (
            <div key={index} className="flex items-center text-white/70">
              <CheckCircle className="w-4 h-4 mr-2 text-green-400" />
              <span className="text-sm">{feature}</span>
            </div>
          ))}
        </div>
        
        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 gap-4 mb-6">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-2xl font-bold text-white">{stat.value}</div>
                <div className="text-xs text-white/60">{stat.label}</div>
              </div>
            ))}
          </div>
        )}
        
        {/* Expand Button */}
        <div className="flex items-center justify-between">
          <span className="text-white/80 text-sm font-medium">Les mer</span>
          <ChevronRight className={`w-5 h-5 text-white transition-transform duration-300 ${isExpanded ? 'rotate-90' : ''}`} />
        </div>
      </div>
      
      {/* Hover Effect */}
      <div className={`absolute inset-0 bg-white/10 transition-opacity duration-300 ${isHovered ? 'opacity-100' : 'opacity-0'}`} />
    </div>
  );
};

// Animated Counter Component
const AnimatedCounter = ({ value, label, suffix = '' }: { value: number; label: string; suffix?: string }) => {
  const [count, setCount] = useState(0);
  const [hasAnimated, setHasAnimated] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasAnimated) {
            setHasAnimated(true);
            const duration = 2000;
            const increment = value / (duration / 16);
            let current = 0;
            
            const timer = setInterval(() => {
              current += increment;
              if (current >= value) {
                setCount(value);
                clearInterval(timer);
              } else {
                setCount(Math.floor(current));
              }
            }, 16);
            
            return () => clearInterval(timer);
          }
        });
      },
      { threshold: 0.5 }
    );
    
    if (ref.current) {
      observer.observe(ref.current);
    }
    
    return () => observer.disconnect();
  }, [value, hasAnimated]);
  
  return (
    <div
      ref={ref}
      className="text-center transform transition-all duration-600"
    >
      <div className="text-4xl font-bold text-white mb-2">
        {count.toLocaleString()}{suffix}
      </div>
      <div className="text-white/70">{label}</div>
    </div>
  );
};

// Advanced Navigation Component
const AdvancedNavigation = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  
  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled 
          ? 'bg-black/80 backdrop-blur-md border-b border-white/10' 
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center space-x-2 hover:scale-105 transition-transform duration-300">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
              <Zap className="h-5 w-5 text-white" />
            </div>
            <span className="text-2xl font-bold text-white">DriftPro</span>
          </div>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {['Funksjoner', 'Priser', 'Om oss', 'Kontakt'].map((item) => (
              <a
                key={item}
                href={`#${item.toLowerCase()}`}
                className="text-white/80 hover:text-white transition-all duration-300 relative group hover:-translate-y-0.5"
              >
                {item}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-blue-500 transition-all duration-300 group-hover:w-full"></span>
              </a>
            ))}
          </div>
          
          {/* CTA Button */}
          <button
            className="hidden md:flex items-center px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full font-medium hover:shadow-lg transition-all duration-300 hover:scale-105 hover:-translate-y-0.5"
          >
            Start gratis
            <ArrowRight className="ml-2 w-4 h-4" />
          </button>
          
          {/* Mobile Menu Button */}
          <button
            className="md:hidden text-white"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            <Menu className="w-6 h-6" />
          </button>
        </div>
      </div>
      
      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-black/95 backdrop-blur-md border-t border-white/10 transition-all duration-300">
          <div className="px-4 py-6 space-y-4">
            {['Funksjoner', 'Priser', 'Om oss', 'Kontakt'].map((item) => (
              <a
                key={item}
                href={`#${item.toLowerCase()}`}
                className="block text-white/80 hover:text-white transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {item}
              </a>
            ))}
            <button className="w-full mt-4 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full font-medium">
              Start gratis
            </button>
          </div>
        </div>
      )}
    </nav>
  );
};

export default function HomePage() {
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    setTimeout(() => setIsLoading(false), 1500);
  }, []);
  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <h2 className="text-2xl font-bold text-white mb-2">DriftPro</h2>
          <p className="text-white/60">Laster avansert administrasjonsplattform...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 overflow-hidden">
      {/* Advanced Background Effects */}
      <div className="absolute inset-0 -z-10">
        <ParticleSystem />
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-transparent via-blue-900/20 to-purple-900/20"></div>
      </div>
      
      {/* Navigation */}
      <AdvancedNavigation />
      
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <div className="animate-fade-in">
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
              Enterprise
              <span className="block bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                Administrasjon
              </span>
              Plattform
            </h1>
            
            <p className="text-xl md:text-2xl text-white/80 mb-8 max-w-4xl mx-auto leading-relaxed">
              DriftPro er den avanserte administrasjonsplattformen for moderne bedrifter. 
              Bygget med cutting-edge teknologi for enterprise-level ytelse og sikkerhet.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
              <button className="group relative px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full font-semibold text-lg hover:shadow-2xl transition-all duration-300 overflow-hidden hover:scale-105 hover:-translate-y-1">
                <span className="relative z-10 flex items-center">
                  Ring 450 45 451
                  <Phone className="ml-3 h-6 w-6 group-hover:translate-x-2 transition-transform" />
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </button>
              
              <button className="px-8 py-4 border-2 border-white/20 text-white rounded-full font-semibold text-lg hover:bg-white/10 transition-all duration-300 hover:scale-105 hover:-translate-y-1">
                Se demo
                <Play className="ml-3 h-6 w-6 inline" />
              </button>
            </div>
          </div>
          
          {/* Floating Elements */}
          <div className="absolute top-20 right-10 w-20 h-20 bg-blue-500/20 rounded-full blur-xl animate-bounce"></div>
          <div className="absolute bottom-20 left-10 w-32 h-32 bg-purple-500/20 rounded-full blur-xl animate-pulse"></div>
        </div>
      </section>
      
      {/* Features Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Enterprise-Funksjoner
            </h2>
            <p className="text-xl text-white/70 max-w-3xl mx-auto">
              Alt du trenger for å administrere din bedrift på enterprise-nivå
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <InteractiveCard
              title="AI-Drevet Personaladministrasjon"
              description="Avansert AI-algoritmer for optimal personalplanlegging, fraværsstyring og kompetanseutvikling."
              icon={Users}
              color="bg-gradient-to-br from-blue-500 to-blue-600"
              gradient="bg-gradient-to-br from-blue-600/20 to-blue-800/20 border border-blue-500/30"
              features={[
                "AI-drevet personalplanlegging",
                "Automatisk fraværsstyring",
                "Kompetanseanalyse",
                "Performance tracking"
              ]}
              stats={[
                { label: "AI-algoritmer", value: "50+" },
                { label: "Automatisering", value: "95%" }
              ]}
            />
            
            <InteractiveCard
              title="Real-time Skifteplanlegging"
              description="Avansert skifteplanlegging med real-time oppdateringer, konflikthåndtering og optimalisering."
              icon={Calendar}
              color="bg-gradient-to-br from-purple-500 to-purple-600"
              gradient="bg-gradient-to-br from-purple-600/20 to-purple-800/20 border border-purple-500/30"
              features={[
                "Real-time oppdateringer",
                "Automatisk konflikthåndtering",
                "Optimal skifteplanlegging",
                "Mobile tilgang"
              ]}
              stats={[
                { label: "Real-time", value: "24/7" },
                { label: "Optimalisering", value: "99%" }
              ]}
            />
            
            <InteractiveCard
              title="Enterprise HMS"
              description="Komplett HMS-løsning med avviksbehandling, risikostyring og sikkerhetsanalyser."
              icon={Shield}
              color="bg-gradient-to-br from-green-500 to-green-600"
              gradient="bg-gradient-to-br from-green-600/20 to-green-800/20 border border-green-500/30"
              features={[
                "Avviksbehandling",
                "Risikostyring",
                "Sikkerhetsanalyser",
                "Miljøstyring"
              ]}
              stats={[
                { label: "Sikkerhet", value: "100%" },
                { label: "Compliance", value: "ISO" }
              ]}
            />
            
            <InteractiveCard
              title="Avansert Rapportering"
              description="Enterprise-level rapportering med AI-drevet analyse, prediktive modeller og real-time dashboards."
              icon={BarChart3}
              color="bg-gradient-to-br from-orange-500 to-orange-600"
              gradient="bg-gradient-to-br from-orange-600/20 to-orange-800/20 border border-orange-500/30"
              features={[
                "AI-drevet analyse",
                "Prediktive modeller",
                "Real-time dashboards",
                "Custom rapporter"
              ]}
              stats={[
                { label: "Rapporter", value: "100+" },
                { label: "Analyser", value: "AI" }
              ]}
            />
            
            <InteractiveCard
              title="Enterprise Sikkerhet"
              description="Bank-nivå sikkerhet med end-to-end kryptering, multi-factor autentisering og compliance."
              icon={Lock}
              color="bg-gradient-to-br from-red-500 to-red-600"
              gradient="bg-gradient-to-br from-red-600/20 to-red-800/20 border border-red-500/30"
              features={[
                "End-to-end kryptering",
                "Multi-factor auth",
                "GDPR compliance",
                "SOC 2 Type II"
              ]}
              stats={[
                { label: "Sikkerhet", value: "99.9%" },
                { label: "Uptime", value: "99.99%" }
              ]}
            />
            
            <InteractiveCard
              title="API & Integrasjoner"
              description="Omfattende API-økosystem med 100+ integrasjoner og custom webhooks."
              icon={Code}
              color="bg-gradient-to-br from-indigo-500 to-indigo-600"
              gradient="bg-gradient-to-br from-indigo-600/20 to-indigo-800/20 border border-indigo-500/30"
              features={[
                "100+ integrasjoner",
                "RESTful API",
                "Webhooks",
                "Custom connectors"
              ]}
              stats={[
                { label: "Integrasjoner", value: "100+" },
                { label: "API calls", value: "1M+" }
              ]}
            />
          </div>
        </div>
      </section>
      
      {/* Statistics Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-black/20">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Enterprise Statistikk
            </h2>
            <p className="text-xl text-white/70">
              DriftPro i tall - enterprise-level ytelse
            </p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <AnimatedCounter value={1000} label="Bedrifter" suffix="+" />
            <AnimatedCounter value={50000} label="Ansatte" suffix="+" />
            <AnimatedCounter value={99} label="Uptime" suffix=".99%" />
            <AnimatedCounter value={100} label="Integrasjoner" suffix="+" />
          </div>
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <div>
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Klar til å ta bedriften din til neste nivå?
            </h2>
            <p className="text-xl text-white/70 mb-8">
              Start din gratis prøveperiode i dag og opplev enterprise-level administrasjon
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <button className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full font-semibold text-lg hover:shadow-2xl transition-all duration-300 hover:scale-105 hover:-translate-y-1">
                Start gratis prøveperiode
                <Rocket className="ml-3 h-6 w-6 inline" />
              </button>
              
              <button className="px-8 py-4 border-2 border-white/20 text-white rounded-full font-semibold text-lg hover:bg-white/10 transition-all duration-300 hover:scale-105 hover:-translate-y-1">
                Kontakt oss
                <MessageCircle className="ml-3 h-6 w-6 inline" />
              </button>
            </div>
          </div>
        </div>
      </section>
      
      {/* Footer */}
      <footer className="py-16 px-4 sm:px-6 lg:px-8 bg-black/40 border-t border-white/10">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                  <Zap className="h-5 w-5 text-white" />
                </div>
                <span className="text-2xl font-bold text-white">DriftPro</span>
              </div>
              <p className="text-gray-400 leading-relaxed">
                Den avanserte administrasjonsplattformen for moderne bedrifter. 
                Bygget med cutting-edge teknologi for enterprise-level ytelse.
              </p>
              <div className="mt-6 space-y-3">
                <div className="flex items-center text-gray-400">
                  <Phone className="h-4 w-4 mr-3" />
                  <span>450 45 451</span>
                </div>
                <div className="flex items-center text-gray-400">
                  <Mail className="h-4 w-4 mr-3" />
                  <span>support@driftpro.no</span>
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="text-white font-semibold mb-4">Produkt</h3>
              <ul className="space-y-2">
                {['Funksjoner', 'Priser', 'API', 'Integrasjoner'].map((item) => (
                  <li key={item}>
                    <a href="#" className="text-gray-400 hover:text-white transition-colors">
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            
            <div>
              <h3 className="text-white font-semibold mb-4">Support</h3>
              <ul className="space-y-2">
                {['Dokumentasjon', 'API Docs', 'Status', 'Kontakt'].map((item) => (
                  <li key={item}>
                    <a href="#" className="text-gray-400 hover:text-white transition-colors">
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            
            <div>
              <h3 className="text-white font-semibold mb-4">Selskap</h3>
              <ul className="space-y-2">
                {['Om oss', 'Karriere', 'Blogg', 'Presse'].map((item) => (
                  <li key={item}>
                    <a href="#" className="text-gray-400 hover:text-white transition-colors">
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          
          <div className="mt-12 pt-8 border-t border-white/10 text-center">
            <p className="text-gray-400">
              © 2024 DriftPro. Alle rettigheter forbeholdt. Enterprise-level administrasjonsplattform.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
} 