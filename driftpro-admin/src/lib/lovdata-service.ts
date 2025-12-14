// Lovdata Service - Integration with Lovdata API for Norwegian legal updates
// Fetches and displays relevant laws and regulations

export interface LovdataDocument {
  id: string;
  title: string;
  type: 'law' | 'regulation' | 'directive' | 'guideline';
  identifier: string; // e.g., "LOV-2018-06-15-44" for GDPR
  description: string;
  publishedDate: string;
  lastUpdated?: string;
  relevance: 'high' | 'medium' | 'low';
  categories: string[]; // e.g., ["Personvern", "Arbeidsrett", "Sikkerhet"]
  url: string;
  summary?: string;
  relevantForCompany?: boolean;
}

export interface LegalUpdate {
  id: string;
  documentId: string;
  title: string;
  changeType: 'new' | 'amended' | 'repealed' | 'guidance_added';
  changeDate: string;
  summary: string;
  impact: 'critical' | 'high' | 'medium' | 'low';
  actionRequired: boolean;
  actionDescription?: string;
  affectedAreas: string[]; // e.g., ["HR", "Sikkerhet", "Personvern"]
  url: string;
}

class LovdataService {
  private baseUrl = 'https://lovdata.no/api/v2'; // Example API endpoint
  private cache: Map<string, { data: any; timestamp: number }> = new Map();
  private cacheDuration = 3600000; // 1 hour in milliseconds

  // Note: Lovdata.no doesn't have a public API, so this is a simulated service
  // In production, you would:
  // 1. Use web scraping (with permission)
  // 2. Use RSS feeds
  // 3. Partner with Lovdata for API access
  // 4. Use a legal information service provider

  // Get relevant laws and regulations for a company
  async getRelevantLaws(categories?: string[]): Promise<LovdataDocument[]> {
    // Simulated data - replace with actual API calls
    const relevantLaws: LovdataDocument[] = [
      {
        id: 'gdpr',
        title: 'Personvernforordningen (GDPR)',
        type: 'regulation',
        identifier: 'EU 2016/679',
        description: 'Generell databeskyttelsesforordning',
        publishedDate: '2018-05-25',
        relevance: 'high',
        categories: ['Personvern', 'GDPR', 'Compliance'],
        url: 'https://lovdata.no/lov/2018-06-15-44',
        summary: 'EU-forordning om beskyttelse av fysiske personer i forbindelse med behandling av personopplysninger.',
        relevantForCompany: true,
      },
      {
        id: 'arbeidsmiljoloven',
        title: 'Arbeidsmiljøloven',
        type: 'law',
        identifier: 'LOV-2005-06-17-62',
        description: 'Lov om arbeidsmiljø, arbeidstid og stillingsvern m.m.',
        publishedDate: '2005-06-17',
        relevance: 'high',
        categories: ['Arbeidsrett', 'HR', 'Sikkerhet'],
        url: 'https://lovdata.no/lov/2005-06-17-62',
        summary: 'Lov som regulerer arbeidsmiljø, arbeidstid, helse, miljø og sikkerhet i arbeidslivet.',
        relevantForCompany: true,
      },
      {
        id: 'personopplysningsloven',
        title: 'Personopplysningsloven',
        type: 'law',
        identifier: 'LOV-2018-06-15-38',
        description: 'Lov om behandling av personopplysninger',
        publishedDate: '2018-06-15',
        relevance: 'high',
        categories: ['Personvern', 'GDPR', 'Compliance'],
        url: 'https://lovdata.no/lov/2018-06-15-38',
        summary: 'Norsk lov som kompletterer GDPR og regulerer behandling av personopplysninger.',
        relevantForCompany: true,
      },
      {
        id: 'sikkerhetsloven',
        title: 'Sikkerhetsloven',
        type: 'law',
        identifier: 'LOV-2018-06-01-24',
        description: 'Lov om nasjonal sikkerhet',
        publishedDate: '2018-06-01',
        relevance: 'medium',
        categories: ['Sikkerhet', 'Compliance'],
        url: 'https://lovdata.no/lov/2018-06-01-24',
        summary: 'Lov som sikrer nasjonal sikkerhet og informasjonssikkerhet.',
        relevantForCompany: false,
      },
      {
        id: 'arbeidsgiveransvarloven',
        title: 'Arbeidsgiveransvarloven',
        type: 'law',
        identifier: 'LOV-2005-06-10-41',
        description: 'Lov om arbeidsgiveransvar',
        publishedDate: '2005-06-10',
        relevance: 'high',
        categories: ['Arbeidsrett', 'HR'],
        url: 'https://lovdata.no/lov/2005-06-10-41',
        summary: 'Lov om arbeidsgiverens ansvar ved sykdom, skade og dødsfall.',
        relevantForCompany: true,
      },
    ];

    // Filter by categories if provided
    if (categories && categories.length > 0) {
      return relevantLaws.filter(law =>
        law.categories.some(cat => categories.includes(cat))
      );
    }

    return relevantLaws;
  }

  // Get recent legal updates
  async getRecentLegalUpdates(days: number = 30): Promise<LegalUpdate[]> {
    // Simulated data - replace with actual API/RSS parsing
    const updates: LegalUpdate[] = [
      {
        id: 'update-1',
        documentId: 'gdpr',
        title: 'Oppdatert veiledning om GDPR og databehandleravtaler',
        changeType: 'guidance_added',
        changeDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        summary: 'Datatilsynet har publisert oppdatert veiledning om krav til databehandleravtaler.',
        impact: 'high',
        actionRequired: true,
        actionDescription: 'Gjennomgå eksisterende databehandleravtaler og oppdater hvis nødvendig.',
        affectedAreas: ['Personvern', 'Compliance', 'Legal'],
        url: 'https://lovdata.no/...',
      },
      {
        id: 'update-2',
        documentId: 'arbeidsmiljoloven',
        title: 'Endringer i krav til arbeidsmiljø',
        changeType: 'amended',
        changeDate: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
        summary: 'Nye krav til dokumentasjon av arbeidsmiljøtiltak.',
        impact: 'medium',
        actionRequired: true,
        actionDescription: 'Oppdater dokumentasjon av arbeidsmiljøtiltak.',
        affectedAreas: ['HR', 'Sikkerhet'],
        url: 'https://lovdata.no/...',
      },
    ];

    // Filter by date
    const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    return updates.filter(update => new Date(update.changeDate) >= cutoffDate);
  }

  // Check for new updates (to be called periodically)
  async checkForUpdates(): Promise<LegalUpdate[]> {
    return this.getRecentLegalUpdates(7); // Check last 7 days
  }

  // Get law details by identifier
  async getLawDetails(identifier: string): Promise<LovdataDocument | null> {
    const laws = await this.getRelevantLaws();
    return laws.find(law => law.identifier === identifier) || null;
  }

  // Search laws
  async searchLaws(query: string): Promise<LovdataDocument[]> {
    const laws = await this.getRelevantLaws();
    const lowerQuery = query.toLowerCase();
    
    return laws.filter(law =>
      law.title.toLowerCase().includes(lowerQuery) ||
      law.description.toLowerCase().includes(lowerQuery) ||
      law.summary?.toLowerCase().includes(lowerQuery) ||
      law.categories.some(cat => cat.toLowerCase().includes(lowerQuery))
    );
  }

  // Get compliance checklist based on relevant laws
  async getComplianceChecklist(categories?: string[]): Promise<Array<{
    id: string;
    lawId: string;
    lawTitle: string;
    requirement: string;
    category: string;
    status: 'compliant' | 'non_compliant' | 'unknown';
    notes?: string;
  }>> {
    const laws = await this.getRelevantLaws(categories);
    
    // Generate compliance checklist items
    const checklist: Array<{
      id: string;
      lawId: string;
      lawTitle: string;
      requirement: string;
      category: string;
      status: 'compliant' | 'non_compliant' | 'unknown';
      notes?: string;
    }> = [];

    laws.forEach(law => {
      if (law.id === 'gdpr') {
        checklist.push(
          {
            id: 'gdpr-1',
            lawId: law.id,
            lawTitle: law.title,
            requirement: 'Samtykke fra brukere innhentet og dokumentert',
            category: 'Personvern',
            status: 'unknown',
          },
          {
            id: 'gdpr-2',
            lawId: law.id,
            lawTitle: law.title,
            requirement: 'Databehandleravtaler er på plass',
            category: 'Personvern',
            status: 'unknown',
          },
          {
            id: 'gdpr-3',
            lawId: law.id,
            lawTitle: law.title,
            requirement: 'Mulighet for sletting av personopplysninger',
            category: 'Personvern',
            status: 'unknown',
          },
          {
            id: 'gdpr-4',
            lawId: law.id,
            lawTitle: law.title,
            requirement: 'Dataportabilitet implementert',
            category: 'Personvern',
            status: 'unknown',
          }
        );
      }
      
      if (law.id === 'arbeidsmiljoloven') {
        checklist.push(
          {
            id: 'aml-1',
            lawId: law.id,
            lawTitle: law.title,
            requirement: 'Arbeidsmiljøkartlegging gjennomført',
            category: 'Arbeidsrett',
            status: 'unknown',
          },
          {
            id: 'aml-2',
            lawId: law.id,
            lawTitle: law.title,
            requirement: 'Arbeidsmiljøtiltak dokumentert',
            category: 'Arbeidsrett',
            status: 'unknown',
          }
        );
      }
    });

    return checklist;
  }
}

export const lovdataService = new LovdataService();


// Fetches and displays relevant laws and regulations

export interface LovdataDocument {
  id: string;
  title: string;
  type: 'law' | 'regulation' | 'directive' | 'guideline';
  identifier: string; // e.g., "LOV-2018-06-15-44" for GDPR
  description: string;
  publishedDate: string;
  lastUpdated?: string;
  relevance: 'high' | 'medium' | 'low';
  categories: string[]; // e.g., ["Personvern", "Arbeidsrett", "Sikkerhet"]
  url: string;
  summary?: string;
  relevantForCompany?: boolean;
}

export interface LegalUpdate {
  id: string;
  documentId: string;
  title: string;
  changeType: 'new' | 'amended' | 'repealed' | 'guidance_added';
  changeDate: string;
  summary: string;
  impact: 'critical' | 'high' | 'medium' | 'low';
  actionRequired: boolean;
  actionDescription?: string;
  affectedAreas: string[]; // e.g., ["HR", "Sikkerhet", "Personvern"]
  url: string;
}

class LovdataService {
  private baseUrl = 'https://lovdata.no/api/v2'; // Example API endpoint
  private cache: Map<string, { data: any; timestamp: number }> = new Map();
  private cacheDuration = 3600000; // 1 hour in milliseconds

  // Note: Lovdata.no doesn't have a public API, so this is a simulated service
  // In production, you would:
  // 1. Use web scraping (with permission)
  // 2. Use RSS feeds
  // 3. Partner with Lovdata for API access
  // 4. Use a legal information service provider

  // Get relevant laws and regulations for a company
  async getRelevantLaws(categories?: string[]): Promise<LovdataDocument[]> {
    // Simulated data - replace with actual API calls
    const relevantLaws: LovdataDocument[] = [
      {
        id: 'gdpr',
        title: 'Personvernforordningen (GDPR)',
        type: 'regulation',
        identifier: 'EU 2016/679',
        description: 'Generell databeskyttelsesforordning',
        publishedDate: '2018-05-25',
        relevance: 'high',
        categories: ['Personvern', 'GDPR', 'Compliance'],
        url: 'https://lovdata.no/lov/2018-06-15-44',
        summary: 'EU-forordning om beskyttelse av fysiske personer i forbindelse med behandling av personopplysninger.',
        relevantForCompany: true,
      },
      {
        id: 'arbeidsmiljoloven',
        title: 'Arbeidsmiljøloven',
        type: 'law',
        identifier: 'LOV-2005-06-17-62',
        description: 'Lov om arbeidsmiljø, arbeidstid og stillingsvern m.m.',
        publishedDate: '2005-06-17',
        relevance: 'high',
        categories: ['Arbeidsrett', 'HR', 'Sikkerhet'],
        url: 'https://lovdata.no/lov/2005-06-17-62',
        summary: 'Lov som regulerer arbeidsmiljø, arbeidstid, helse, miljø og sikkerhet i arbeidslivet.',
        relevantForCompany: true,
      },
      {
        id: 'personopplysningsloven',
        title: 'Personopplysningsloven',
        type: 'law',
        identifier: 'LOV-2018-06-15-38',
        description: 'Lov om behandling av personopplysninger',
        publishedDate: '2018-06-15',
        relevance: 'high',
        categories: ['Personvern', 'GDPR', 'Compliance'],
        url: 'https://lovdata.no/lov/2018-06-15-38',
        summary: 'Norsk lov som kompletterer GDPR og regulerer behandling av personopplysninger.',
        relevantForCompany: true,
      },
      {
        id: 'sikkerhetsloven',
        title: 'Sikkerhetsloven',
        type: 'law',
        identifier: 'LOV-2018-06-01-24',
        description: 'Lov om nasjonal sikkerhet',
        publishedDate: '2018-06-01',
        relevance: 'medium',
        categories: ['Sikkerhet', 'Compliance'],
        url: 'https://lovdata.no/lov/2018-06-01-24',
        summary: 'Lov som sikrer nasjonal sikkerhet og informasjonssikkerhet.',
        relevantForCompany: false,
      },
      {
        id: 'arbeidsgiveransvarloven',
        title: 'Arbeidsgiveransvarloven',
        type: 'law',
        identifier: 'LOV-2005-06-10-41',
        description: 'Lov om arbeidsgiveransvar',
        publishedDate: '2005-06-10',
        relevance: 'high',
        categories: ['Arbeidsrett', 'HR'],
        url: 'https://lovdata.no/lov/2005-06-10-41',
        summary: 'Lov om arbeidsgiverens ansvar ved sykdom, skade og dødsfall.',
        relevantForCompany: true,
      },
    ];

    // Filter by categories if provided
    if (categories && categories.length > 0) {
      return relevantLaws.filter(law =>
        law.categories.some(cat => categories.includes(cat))
      );
    }

    return relevantLaws;
  }

  // Get recent legal updates
  async getRecentLegalUpdates(days: number = 30): Promise<LegalUpdate[]> {
    // Simulated data - replace with actual API/RSS parsing
    const updates: LegalUpdate[] = [
      {
        id: 'update-1',
        documentId: 'gdpr',
        title: 'Oppdatert veiledning om GDPR og databehandleravtaler',
        changeType: 'guidance_added',
        changeDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        summary: 'Datatilsynet har publisert oppdatert veiledning om krav til databehandleravtaler.',
        impact: 'high',
        actionRequired: true,
        actionDescription: 'Gjennomgå eksisterende databehandleravtaler og oppdater hvis nødvendig.',
        affectedAreas: ['Personvern', 'Compliance', 'Legal'],
        url: 'https://lovdata.no/...',
      },
      {
        id: 'update-2',
        documentId: 'arbeidsmiljoloven',
        title: 'Endringer i krav til arbeidsmiljø',
        changeType: 'amended',
        changeDate: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
        summary: 'Nye krav til dokumentasjon av arbeidsmiljøtiltak.',
        impact: 'medium',
        actionRequired: true,
        actionDescription: 'Oppdater dokumentasjon av arbeidsmiljøtiltak.',
        affectedAreas: ['HR', 'Sikkerhet'],
        url: 'https://lovdata.no/...',
      },
    ];

    // Filter by date
    const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    return updates.filter(update => new Date(update.changeDate) >= cutoffDate);
  }

  // Check for new updates (to be called periodically)
  async checkForUpdates(): Promise<LegalUpdate[]> {
    return this.getRecentLegalUpdates(7); // Check last 7 days
  }

  // Get law details by identifier
  async getLawDetails(identifier: string): Promise<LovdataDocument | null> {
    const laws = await this.getRelevantLaws();
    return laws.find(law => law.identifier === identifier) || null;
  }

  // Search laws
  async searchLaws(query: string): Promise<LovdataDocument[]> {
    const laws = await this.getRelevantLaws();
    const lowerQuery = query.toLowerCase();
    
    return laws.filter(law =>
      law.title.toLowerCase().includes(lowerQuery) ||
      law.description.toLowerCase().includes(lowerQuery) ||
      law.summary?.toLowerCase().includes(lowerQuery) ||
      law.categories.some(cat => cat.toLowerCase().includes(lowerQuery))
    );
  }

  // Get compliance checklist based on relevant laws
  async getComplianceChecklist(categories?: string[]): Promise<Array<{
    id: string;
    lawId: string;
    lawTitle: string;
    requirement: string;
    category: string;
    status: 'compliant' | 'non_compliant' | 'unknown';
    notes?: string;
  }>> {
    const laws = await this.getRelevantLaws(categories);
    
    // Generate compliance checklist items
    const checklist: Array<{
      id: string;
      lawId: string;
      lawTitle: string;
      requirement: string;
      category: string;
      status: 'compliant' | 'non_compliant' | 'unknown';
      notes?: string;
    }> = [];

    laws.forEach(law => {
      if (law.id === 'gdpr') {
        checklist.push(
          {
            id: 'gdpr-1',
            lawId: law.id,
            lawTitle: law.title,
            requirement: 'Samtykke fra brukere innhentet og dokumentert',
            category: 'Personvern',
            status: 'unknown',
          },
          {
            id: 'gdpr-2',
            lawId: law.id,
            lawTitle: law.title,
            requirement: 'Databehandleravtaler er på plass',
            category: 'Personvern',
            status: 'unknown',
          },
          {
            id: 'gdpr-3',
            lawId: law.id,
            lawTitle: law.title,
            requirement: 'Mulighet for sletting av personopplysninger',
            category: 'Personvern',
            status: 'unknown',
          },
          {
            id: 'gdpr-4',
            lawId: law.id,
            lawTitle: law.title,
            requirement: 'Dataportabilitet implementert',
            category: 'Personvern',
            status: 'unknown',
          }
        );
      }
      
      if (law.id === 'arbeidsmiljoloven') {
        checklist.push(
          {
            id: 'aml-1',
            lawId: law.id,
            lawTitle: law.title,
            requirement: 'Arbeidsmiljøkartlegging gjennomført',
            category: 'Arbeidsrett',
            status: 'unknown',
          },
          {
            id: 'aml-2',
            lawId: law.id,
            lawTitle: law.title,
            requirement: 'Arbeidsmiljøtiltak dokumentert',
            category: 'Arbeidsrett',
            status: 'unknown',
          }
        );
      }
    });

    return checklist;
  }
}

export const lovdataService = new LovdataService();


