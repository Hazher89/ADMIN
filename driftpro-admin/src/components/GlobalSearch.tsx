'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { firebaseService } from '@/lib/firebase-services';
import { Search, X, User, Building, Calendar, FileText, Clock, AlertTriangle, Users, Mail, Truck, Activity, BarChart3, Settings, Navigation, Phone } from 'lucide-react';

interface SearchResult {
  id: string;
  type: 'employee' | 'company' | 'vacation' | 'absence' | 'document' | 'shift' | 'deviation' | 'department' | 'page' | 'email';
  title: string;
  subtitle: string;
  href: string;
  relevance: number; // Higher = more relevant
}

// Page mappings with keywords for intelligent search
const PAGE_MAPPINGS: Array<{ 
  name: string; 
  href: string; 
  keywords: string[]; 
  icon: React.ReactNode;
  category: string;
}> = [
  { name: 'Dashboard', href: '/dashboard', keywords: ['oversikt', 'hjem', 'dashboard', 'hjemmeside'], icon: <BarChart3 size={16} />, category: 'side' },
  { name: 'Ferie', href: '/dashboard/vacation', keywords: ['ferie', 'feriedager', 'ferieforespørsel', 'ferieplanlegging', 'permisjon'], icon: <Calendar size={16} />, category: 'side' },
  { name: 'Fravær', href: '/dashboard/absence', keywords: ['fravær', 'fraværsmelding', 'sykdom', 'syk', 'sykemelding', 'egenmelding'], icon: <Clock size={16} />, category: 'side' },
  { name: 'HR & Personal', href: '/dashboard/hr', keywords: ['hr', 'personal', 'human resources', 'ansatt', 'ansatte'], icon: <Users size={16} />, category: 'side' },
  { name: 'Ansatte', href: '/dashboard/employees', keywords: ['ansatt', 'ansatte', 'medarbeider', 'medarbeidere', 'personale'], icon: <Users size={16} />, category: 'side' },
  { name: 'Rutepanlegger', href: '/dashboard/advanced-planning', keywords: ['rute', 'rutepanlegger', 'rutepanlegging', 'planlegging', 'ruteplan', 'route', 'planning', 'kjøreplan'], icon: <Navigation size={16} />, category: 'side' },
  { name: 'E-post', href: '/dashboard/mail', keywords: ['epost', 'e-post', 'mail', 'email', 'brev', 'melding', 'send epost'], icon: <Mail size={16} />, category: 'side' },
  { name: 'Dokumenter', href: '/dashboard/documents', keywords: ['dokument', 'dokumenter', 'fil', 'filer', 'arkiv', 'dokumentasjon'], icon: <FileText size={16} />, category: 'side' },
  { name: 'HMS', href: '/dashboard/deviations', keywords: ['hms', 'avvik', 'sikkerhet', 'helse', 'miljø', 'sikkerhetsavvik'], icon: <AlertTriangle size={16} />, category: 'side' },
  { name: 'Avvik', href: '/dashboard/deviations', keywords: ['avvik', 'avviksmelding', 'rapporter avvik'], icon: <AlertTriangle size={16} />, category: 'side' },
  { name: 'Skift', href: '/dashboard/shifts', keywords: ['skift', 'skiftplan', 'skiftplanlegging', 'vakt', 'vakter'], icon: <Clock size={16} />, category: 'side' },
  { name: 'Logistikk System', href: '/dashboard/logistikk-system', keywords: ['logistikk', 'transport', 'levering', 'forsendelse', 'varelevering'], icon: <Truck size={16} />, category: 'side' },
  { name: 'Chat', href: '/dashboard/chat', keywords: ['chat', 'melding', 'meldinger', 'kommunikasjon'], icon: <Mail size={16} />, category: 'side' },
  { name: 'Rapporter', href: '/dashboard/reports', keywords: ['rapport', 'rapporter', 'statistikk', 'analyse', 'statistikk'], icon: <BarChart3 size={16} />, category: 'side' },
  { name: 'Internrevisjon', href: '/dashboard/audit', keywords: ['audit', 'internrevisjon', 'revisjon', 'kontroll'], icon: <Activity size={16} />, category: 'side' },
  { name: 'Innstillinger', href: '/dashboard/settings', keywords: ['innstillinger', 'settings', 'konfigurasjon', 'oppsett'], icon: <Settings size={16} />, category: 'side' },
  { name: 'Partnere', href: '/dashboard/partners', keywords: ['partner', 'partnere', 'leverandør', 'leverandører', 'kunde', 'kunder'], icon: <Building size={16} />, category: 'side' },
  { name: 'Bedrifter', href: '/dashboard/companies', keywords: ['bedrift', 'bedrifter', 'selskap', 'virksomhet'], icon: <Building size={16} />, category: 'side' },
];

// Fuzzy match function - checks if query matches any part of text
const fuzzyMatch = (query: string, text: string): boolean => {
  if (!text) return false;
  const lowerQuery = query.toLowerCase();
  const lowerText = text.toLowerCase();
  
  // Exact match
  if (lowerText.includes(lowerQuery)) return true;
  
  // Word boundary match
  const words = lowerText.split(/\s+/);
  for (const word of words) {
    if (word.startsWith(lowerQuery) || lowerQuery.startsWith(word)) return true;
  }
  
  // Character sequence match (fuzzy)
  let queryIndex = 0;
  for (let i = 0; i < lowerText.length && queryIndex < lowerQuery.length; i++) {
    if (lowerText[i] === lowerQuery[queryIndex]) {
      queryIndex++;
    }
  }
  
  return queryIndex === lowerQuery.length;
};

// Calculate relevance score
const calculateRelevance = (query: string, text: string, keywords: string[] = []): number => {
  const lowerQuery = query.toLowerCase();
  const lowerText = text.toLowerCase();
  
  let score = 0;
  
  // Exact match gets highest score
  if (lowerText === lowerQuery) score += 100;
  // Starts with query
  else if (lowerText.startsWith(lowerQuery)) score += 80;
  // Contains query
  else if (lowerText.includes(lowerQuery)) score += 60;
  // Fuzzy match
  else if (fuzzyMatch(query, text)) score += 40;
  
  // Keyword matches
  keywords.forEach(keyword => {
    if (lowerQuery.includes(keyword.toLowerCase()) || keyword.toLowerCase().includes(lowerQuery)) {
      score += 50;
    }
  });
  
  return score;
};

// Helper function to check if user can view vacation/absence
const canViewVacation = (vacation: any, userProfile: any, employeeId?: string): boolean => {
  if (userProfile?.role === 'super_admin' || userProfile?.role === 'admin') return true;
  if (userProfile?.vacationAccess?.canViewAllVacations) return true;
  if (userProfile?.role === 'employee') return vacation.employeeId === userProfile.id;
  if (userProfile?.role === 'department_leader') {
    return vacation.employeeId === userProfile.id || employeeId === userProfile.id;
  }
  return false;
};

// Helper function to check permissions
const hasPermission = (userProfile: any, permission: string): boolean => {
  if (!userProfile) return false;
  if (userProfile.role === 'super_admin') return true;
  if (userProfile.role === 'admin') return true;
  return userProfile.permissions?.[permission as keyof typeof userProfile.permissions] === true;
};

export default function GlobalSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { userProfile } = useAuth();
  const router = useRouter();

  // Search pages first (instant, no API call)
  const searchPages = useCallback((searchQuery: string): SearchResult[] => {
    if (!searchQuery.trim()) return [];
    
    const pageResults: SearchResult[] = [];
    
    PAGE_MAPPINGS.forEach(page => {
      // Check if query matches page name or keywords
      const nameMatch = fuzzyMatch(searchQuery, page.name) || page.name.toLowerCase().includes(searchQuery.toLowerCase());
      const keywordMatch = page.keywords.some(keyword => 
        fuzzyMatch(searchQuery, keyword) || 
        keyword.toLowerCase().includes(searchQuery.toLowerCase()) ||
        searchQuery.toLowerCase().includes(keyword.toLowerCase())
      );
      
      if (nameMatch || keywordMatch) {
        const relevance = calculateRelevance(searchQuery, page.name, page.keywords);
        pageResults.push({
          id: `page-${page.href}`,
          type: 'page',
          title: page.name,
          subtitle: page.category === 'side' ? 'Side' : 'Funksjon',
          href: page.href,
          relevance,
        });
      }
    });
    
    return pageResults.sort((a, b) => b.relevance - a.relevance);
  }, []);

  const performSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim() || !userProfile?.companyId) {
      setResults([]);
      return;
    }

    setLoading(true);
    const searchResults: SearchResult[] = [];
    const lowerQuery = searchQuery.toLowerCase();

    // Always search pages first (instant results)
    const pageResults = searchPages(searchQuery);
    searchResults.push(...pageResults);

    try {
      // Get all employees for reference
      const employees = await firebaseService.getEmployees(userProfile.companyId);
      
      // Search employees with fuzzy matching
      employees.forEach((emp) => {
        const searchFields = [
          emp.displayName,
          emp.name,
          emp.email,
          emp.position,
          emp.employeeNumber,
          emp.departmentId,
        ].filter(Boolean).join(' ');
        
        if (fuzzyMatch(searchQuery, searchFields)) {
          if (hasPermission(userProfile, 'employees') || emp.id === userProfile?.id) {
            const relevance = calculateRelevance(searchQuery, emp.displayName || emp.name || '');
            searchResults.push({
              id: `emp-${emp.id}`,
              type: 'employee',
              title: emp.displayName || emp.name || 'Ukjent',
              subtitle: `${emp.position || ''} • ${emp.email || ''}`,
              href: `/dashboard/employees`,
              relevance,
            });
          }
        }
      });

      // Search vacations
      if (hasPermission(userProfile, 'hr') || userProfile?.vacationAccess?.canViewAllVacations || userProfile?.role === 'employee') {
        try {
          const vacations = await firebaseService.getVacations(userProfile.companyId);
          vacations
            .filter((v) => v.type === 'vacation')
            .forEach((vac) => {
              const emp = employees.find((e) => e.id === vac.employeeId);
              const searchFields = [
                emp?.displayName || emp?.name,
                vac.type,
                vac.status,
                vac.startDate,
                vac.endDate,
                'ferie',
              ].filter(Boolean).join(' ');
              
              if (fuzzyMatch(searchQuery, searchFields) && canViewVacation(vac, userProfile, vac.employeeId)) {
                const relevance = calculateRelevance(searchQuery, `ferie ${emp?.displayName || emp?.name || ''}`);
                searchResults.push({
                  id: `vac-${vac.id}`,
                  type: 'vacation',
                  title: `${emp?.displayName || emp?.name || 'Ukjent'} - Ferie`,
                  subtitle: `Fra ${vac.startDate} til ${vac.endDate} • ${vac.status}`,
                  href: `/dashboard/vacation`,
                  relevance,
                });
              }
            });
        } catch (error) {
          console.error('Error searching vacations:', error);
        }
      }

      // Search absences
      if (hasPermission(userProfile, 'hr') || userProfile?.vacationAccess?.canViewAllVacations || userProfile?.role === 'employee') {
        try {
          const vacations = await firebaseService.getVacations(userProfile.companyId);
          vacations
            .filter((v) => {
              const type = v.type;
              return type === 'sick' || type === 'personal' || (type as any) === 'sickChild';
            })
            .forEach((abs) => {
              const emp = employees.find((e) => e.id === abs.employeeId);
              const searchFields = [
                emp?.displayName || emp?.name,
                abs.type,
                abs.status,
                abs.startDate,
                'fravær',
                'sykdom',
                'syk',
              ].filter(Boolean).join(' ');
              
              if (fuzzyMatch(searchQuery, searchFields) && canViewVacation(abs, userProfile, abs.employeeId)) {
                const typeLabel = abs.type === 'sick' ? 'Sykdom' : (abs.type as any) === 'sickChild' ? 'Sykt barn' : 'Personlig';
                const relevance = calculateRelevance(searchQuery, `fravær ${emp?.displayName || emp?.name || ''}`);
                searchResults.push({
                  id: `abs-${abs.id}`,
                  type: 'absence',
                  title: `${emp?.displayName || emp?.name || 'Ukjent'} - ${typeLabel}`,
                  subtitle: `Fra ${abs.startDate} til ${abs.endDate} • ${abs.status}`,
                  href: `/dashboard/absence`,
                  relevance,
                });
              }
            });
        } catch (error) {
          console.error('Error searching absences:', error);
        }
      }

      // Search documents
      if (hasPermission(userProfile, 'documents')) {
        try {
          const documents = await firebaseService.getDocuments(userProfile.companyId);
          documents.forEach((doc) => {
            const searchFields = [
              doc.name || doc.title,
              doc.type || doc.fileType,
              doc.category,
              doc.description,
              'dokument',
            ].filter(Boolean).join(' ');
            
            if (fuzzyMatch(searchQuery, searchFields)) {
              const relevance = calculateRelevance(searchQuery, doc.name || doc.title || '');
              searchResults.push({
                id: `doc-${doc.id}`,
                type: 'document',
                title: doc.name || doc.title || 'Ukjent dokument',
                subtitle: `${doc.type || doc.fileType || ''} • ${doc.category || ''}`,
                href: `/dashboard/documents`,
                relevance,
              });
            }
          });
        } catch (error) {
          console.error('Error searching documents:', error);
        }
      }

      // Search deviations
      if (hasPermission(userProfile, 'safety') || hasPermission(userProfile, 'compliance')) {
        try {
          const deviations = await firebaseService.getDeviations(userProfile.companyId);
          deviations.forEach((dev) => {
            const emp = employees.find((e) => e.id === dev.reportedBy);
            const searchFields = [
              dev.title,
              dev.description,
              dev.type,
              dev.status,
              emp?.displayName || emp?.name,
              'avvik',
              'hms',
            ].filter(Boolean).join(' ');
            
            if (fuzzyMatch(searchQuery, searchFields)) {
              const relevance = calculateRelevance(searchQuery, dev.title || '');
              searchResults.push({
                id: `dev-${dev.id}`,
                type: 'deviation',
                title: dev.title || 'Avvik',
                subtitle: `${dev.type || ''} • ${dev.status || ''} • ${emp?.displayName || emp?.name || 'Ukjent'}`,
                href: `/dashboard/deviations`,
                relevance,
              });
            }
          });
        } catch (error) {
          console.error('Error searching deviations:', error);
        }
      }

      // Search shifts
      if (hasPermission(userProfile, 'hr') || userProfile?.role === 'employee') {
        try {
          const shifts = await firebaseService.getShifts(userProfile.companyId);
          shifts.forEach((shift) => {
            const emp = employees.find((e) => e.id === shift.employeeId);
            const shouldShow = 
              userProfile?.role === 'admin' || 
              userProfile?.role === 'super_admin' || 
              shift.employeeId === userProfile?.id ||
              hasPermission(userProfile, 'hr');
            
            if (shouldShow) {
              const searchFields = [
                emp?.displayName || emp?.name,
                shift.type,
                shift.status,
                shift.startTime,
                'skift',
                'vakt',
              ].filter(Boolean).join(' ');
              
              if (fuzzyMatch(searchQuery, searchFields)) {
                const relevance = calculateRelevance(searchQuery, `skift ${emp?.displayName || emp?.name || ''}`);
                searchResults.push({
                  id: `shift-${shift.id}`,
                  type: 'shift',
                  title: `${emp?.displayName || emp?.name || 'Ukjent'} - Skift`,
                  subtitle: `${shift.startTime} - ${shift.endTime} • ${shift.status}`,
                  href: `/dashboard`,
                  relevance,
                });
              }
            }
          });
        } catch (error) {
          console.error('Error searching shifts:', error);
        }
      }

      // Search departments
      if (hasPermission(userProfile, 'departments')) {
        try {
          const departments = await firebaseService.getDepartments(userProfile.companyId);
          departments.forEach((dept) => {
            const searchFields = [
              dept.name,
              dept.description,
              dept.location,
              'avdeling',
              'departement',
            ].filter(Boolean).join(' ');
            
            if (fuzzyMatch(searchQuery, searchFields)) {
              const relevance = calculateRelevance(searchQuery, dept.name || '');
              searchResults.push({
                id: `dept-${dept.id}`,
                type: 'department',
                title: dept.name || 'Ukjent avdeling',
                subtitle: `${dept.employeeCount || 0} ansatte • ${dept.location || ''}`,
                href: `/dashboard/employees`,
                relevance,
              });
            }
          });
        } catch (error) {
          console.error('Error searching departments:', error);
        }
      }

      // Search companies (only for super_admin or admin)
      if (userProfile?.role === 'super_admin' || userProfile?.role === 'admin') {
        try {
          const companies = await firebaseService.getCompanies();
          companies.forEach((comp) => {
            const searchFields = [
              comp.name,
              comp.industry,
              comp.orgNumber,
              'bedrift',
              'selskap',
            ].filter(Boolean).join(' ');
            
            if (fuzzyMatch(searchQuery, searchFields)) {
              const relevance = calculateRelevance(searchQuery, comp.name || '');
              searchResults.push({
                id: `comp-${comp.id}`,
                type: 'company',
                title: comp.name || 'Ukjent',
                subtitle: `${comp.industry || ''} • ${comp.employees || 0} ansatte`,
                href: `/dashboard/companies`,
                relevance,
              });
            }
          });
        } catch (error) {
          console.error('Error searching companies:', error);
        }
      }
    } catch (error) {
      console.error('Search error:', error);
    }

    // Sort by relevance and limit results
    const sortedResults = searchResults
      .sort((a, b) => b.relevance - a.relevance)
      .slice(0, 20);
    
    setResults(sortedResults);
    setLoading(false);
  }, [userProfile, searchPages]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (query.trim()) {
        performSearch(query);
      } else {
        setResults([]);
      }
    }, 200); // Reduced delay for faster results

    return () => clearTimeout(timer);
  }, [query, performSearch]);

  const handleSelect = (result: SearchResult) => {
    router.push(result.href);
    setIsOpen(false);
    setQuery('');
  };

  const getIcon = (type: SearchResult['type']) => {
    switch (type) {
      case 'employee':
        return <User size={16} />;
      case 'company':
        return <Building size={16} />;
      case 'vacation':
        return <Calendar size={16} />;
      case 'absence':
        return <Clock size={16} />;
      case 'document':
        return <FileText size={16} />;
      case 'shift':
        return <Clock size={16} />;
      case 'deviation':
        return <AlertTriangle size={16} />;
      case 'department':
        return <Users size={16} />;
      case 'page':
        return <Search size={16} />;
      case 'email':
        return <Mail size={16} />;
      default:
        return <Search size={16} />;
    }
  };

  return (
    <div className="search-container" style={{ position: 'relative', maxWidth: 520, flex: 1 }}>
      <div style={{ position: 'relative' }}>
        <Search
          style={{
            position: 'absolute',
            left: '12px',
            top: '50%',
            transform: 'translateY(-50%)',
            color: 'var(--gray-400)',
            width: '20px',
            height: '20px',
            zIndex: 10,
          }}
        />
        <input
          className="search-input"
          placeholder="Søk i systemet"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onBlur={() => {
            // Delay closing to allow click on results
            setTimeout(() => setIsOpen(false), 200);
          }}
          style={{
            width: '100%',
            padding: 'var(--space-3) var(--space-4) var(--space-3) 3rem',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-lg)',
            fontSize: 'var(--font-size-base)',
            background: 'var(--card-background)',
            transition: 'all var(--transition-normal)',
            color: 'var(--text-color)',
          }}
        />
        {query && (
          <button
            onClick={() => {
              setQuery('');
              setResults([]);
              setIsOpen(false);
            }}
            style={{
              position: 'absolute',
              right: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--gray-400)',
              padding: '4px',
            }}
          >
            <X size={16} />
          </button>
        )}
      </div>

      {isOpen && (query.trim() || results.length > 0) && (
        <div
          className="card"
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            marginTop: '8px',
            maxHeight: '500px',
            overflowY: 'auto',
            zIndex: 1000,
            padding: '8px',
          }}
        >
          {loading && (
            <div style={{ padding: '12px', textAlign: 'center', color: 'var(--gray-500)' }}>
              Søker...
            </div>
          )}
          {!loading && results.length === 0 && query.trim() && (
            <div style={{ padding: '12px', textAlign: 'center', color: 'var(--gray-500)' }}>
              Ingen resultater funnet for "{query}"
            </div>
          )}
          {!loading && results.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {results.map((result, index) => (
                <button
                  key={`${result.type}-${result.id}-${index}`}
                  onClick={() => handleSelect(result)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '12px',
                    border: 'none',
                    background: 'transparent',
                    cursor: 'pointer',
                    borderRadius: 'var(--radius-md)',
                    color: 'var(--text-color)',
                    textAlign: 'left',
                    transition: 'background var(--transition-fast)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'var(--gray-100)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                  }}
                >
                  <div
                    style={{
                      color: 'var(--primary)',
                      display: 'flex',
                      alignItems: 'center',
                    }}
                  >
                    {getIcon(result.type)}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 'var(--font-size-sm)' }}>
                      {result.title}
                    </div>
                    <div
                      style={{
                        fontSize: 'var(--font-size-xs)',
                        color: 'var(--gray-500)',
                        marginTop: '2px',
                      }}
                    >
                      {result.subtitle}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
