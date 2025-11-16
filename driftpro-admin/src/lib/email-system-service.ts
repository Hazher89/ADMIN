/**
 * MAVI Smart Email Handling System - Service Layer
 * 
 * This service handles all business logic for email case management:
 * - Entity extraction
 * - Case classification
 * - Rule engine
 * - Template processing
 * - Case linking
 */

import { firebaseService } from './firebase-services';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export type CaseType = 
  | 'leveringsstatus' 
  | 'endring_kundeinfo' 
  | 'retur' 
  | 'montering' 
  | 'firemann' 
  | 'kansellering' 
  | 'butikkhenting_pp' 
  | 'utlevering' 
  | 'nextday' 
  | 'hub_ruter' 
  | 'utenfor_sortiment' 
  | 'skade_avvik'
  | 'other';

export interface ExtractedEntity {
  key: string;
  value: string;
  confidence: number;
  startIndex?: number;
  endIndex?: number;
}

export interface RuleDefinition {
  name: string;
  priority: number;
  if: {
    any?: Array<{ subject_regex?: string; body_regex?: string }>;
    all?: Array<{ subject_regex?: string; body_regex?: string }>;
  };
  then: string[];
}

export interface RuleResult {
  rule: RuleDefinition;
  matched: boolean;
  actions: string[];
}

export interface Template {
  id: string;
  name: string;
  subject: string;
  body: string;
  caseTypes: CaseType[];
  variables: string[];
}

// ============================================================================
// ENTITY PATTERNS
// ============================================================================

export const ENTITY_PATTERNS = {
  SA: /\bSA[-\s:]?\d{4,}\b/gi,
  FU: /\bFU[-\s:]?\d{4,}\b/gi,
  HU: /\bHU[-\s:]?\d{4,}\b/gi,
  Returnstore: /\b(3900\d{2})\b/g,
  OrderId: /\b(\d{6,12})\b/g,
  Phone: /\b(\+?47[-\s]?)?\d{8}\b/g,
  PostalCode: /\b\d{4}\b/g,
  DeliveryWindow: /\b([01]?\d|2[0-3])[:.]?\d{0,2}\s?[-–]\s?([01]?\d|2[0-3])[:.]?\d{0,2}\b/g,
  Email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/gi,
};

// ============================================================================
// CASE TYPE KEYWORDS
// ============================================================================

export const CASE_TYPE_KEYWORDS: Record<CaseType, string[]> = {
  leveringsstatus: ['forsink', 'sen', 'lever.* i dag', 'blir den levert', 'leveringsvindu', 'lever.* i dag', 'leveringsstatus'],
  endring_kundeinfo: ['endre adresse', 'endre telefon', 'endre tlf', 'endre navn', 'adresseendring', 'endring.* kunde'],
  retur: ['retur', 'returnstore', 'bomtur', 'gjenvinning', 'returskjema', 'returner'],
  montering: ['montering', 'SA', 'stand alone', 'tilleggsarbeid', 'ekstra tjeneste', 'servicearbeid'],
  firemann: ['4 mann', 'fire personer', 'tung.* bæring', 'ekstra bemanning'],
  kansellering: ['kanseller', 'avbestill', 'skal ikke utføres', 'ønsker å avbestille', 'kansellering'],
  butikkhenting_pp: ['pick.?&.?pack', 'p&p', 'HU has been assigned to FU', 'feil profil', 'Milkrun', 'butikkhenting'],
  utlevering: ['utlever', 'skann levert', 'sjåførproblem', 'PDA', 'levert'],
  nextday: ['NextDay', 'kveldsruter', 'oppmøte', 'next day'],
  hub_ruter: ['HUB', 'ruter', 'kontakt', 'rutevarsler', 'Gol', 'Geilo', 'Kongsvinger', 'regional'],
  utenfor_sortiment: ['lydplanke', 'kjøkkenmontering', 'rør', 'ledningsskjulere', 'lydsystem', 'utenfor sortiment'],
  skade_avvik: ['skade', 'avvik', 'emballasje', 'produkt-skade', 'HMS', 'skadet'],
  other: []
};

// ============================================================================
// SLA POLICIES
// ============================================================================

export const SLA_POLICIES: Record<CaseType, number> = {
  leveringsstatus: 2 * 60 * 60 * 1000, // 2 hours
  endring_kundeinfo: 4 * 60 * 60 * 1000, // 4 hours
  retur: 4 * 60 * 60 * 1000,
  montering: 8 * 60 * 60 * 1000,
  firemann: 8 * 60 * 60 * 1000,
  kansellering: 4 * 60 * 60 * 1000,
  butikkhenting_pp: 4 * 60 * 60 * 1000,
  utlevering: 2 * 60 * 60 * 1000,
  nextday: 60 * 60 * 1000, // 1 hour
  hub_ruter: 4 * 60 * 60 * 1000,
  utenfor_sortiment: 8 * 60 * 60 * 1000,
  skade_avvik: 2 * 60 * 60 * 1000,
  other: 4 * 60 * 60 * 1000
};

// ============================================================================
// RESPONSE TEMPLATES
// ============================================================================

export const RESPONSE_TEMPLATES: Template[] = [
  {
    id: 'endring_ma_via_ccc',
    name: 'Endring må via CCC',
    subject: '[{Saks-ID}] Endring av kundeinformasjon',
    body: `Hei {customer_name},

Takk for henvendelsen. Endring av adresse, telefonnummer og kundenavn må gjøres via Elkjøp (CCC/butikk). 
Hvis leveringen er i dag eller i morgen på dagtid, kan vi notere korrekt telefon på kjøreliste til sjåfør for oppfølging.

Vennlig hilsen
MAVI kjørekontor

—
MAVI saks-ID: {Saks-ID}
Kontakt kjørekontor: 40175012 (07:00–20:30, lør 09:00–14:00)`,
    caseTypes: ['endring_kundeinfo'],
    variables: ['customer_name', 'Saks-ID']
  },
  {
    id: 'forsinkelse_oppfølging',
    name: 'Forsinkelse oppfølging',
    subject: '[{Saks-ID}] Leveringsstatus for ordre {order_id}',
    body: `Hei {customer_name},

Vi undersøker leveringsstatus på din ordre {order_id}. Sjåfør kontakter deg senest 30 minutter før leveringsvinduet utløper. 
Dersom levering ikke lar seg gjennomføre i dag, hjelper vi med ombooking via Elkjøp.

Mvh
MAVI

—
MAVI saks-ID: {Saks-ID}
Kontakt kjørekontor: 40175012 (07:00–20:30, lør 09:00–14:00)`,
    caseTypes: ['leveringsstatus'],
    variables: ['customer_name', 'order_id', 'Saks-ID', 'window']
  },
  {
    id: 'firemann_planlegging',
    name: '4-mann planlegging',
    subject: '[{Saks-ID}] Ekstra bemanning for levering',
    body: `Hei,

Oppdraget krever ekstra mannskap (4 mann). Vi planlegger dette og estimerer tillegg mellom 1100–1500 NOK, avhengig av forhold hos kunde. 
Detaljer legges i kjøreliste, og tid bekreftes.

Mvh
MAVI

—
MAVI saks-ID: {Saks-ID}
Kontakt kjørekontor: 40175012 (07:00–20:30, lør 09:00–14:00)`,
    caseTypes: ['firemann'],
    variables: ['Saks-ID']
  },
  {
    id: 'kansellering_block_only',
    name: 'Kansellering (blokker)',
    subject: '[{Saks-ID}] Bestilling satt på blokkering',
    body: `Hei,

Vi har blokkert ordren i vårt system (planlegging/utførelse). For å kansellere må henvendelsen registreres via Elkjøp (CCC/butikk).

Mvh
MAVI

—
MAVI saks-ID: {Saks-ID}
Kontakt kjørekontor: 40175012 (07:00–20:30, lør 09:00–14:00)`,
    caseTypes: ['kansellering'],
    variables: ['Saks-ID']
  },
  {
    id: 'butikk_pp_info',
    name: 'Butikkhenting/P&P',
    subject: '[{Saks-ID}] Butikkhenting/klargjøring (P&P)',
    body: `Hei,

Vi ser at butikkens pick & pack-status kan påvirke planleggingen. Om "HU has been assigned to FU" er gjort for sent, kan oppdraget falle ut av internkjøring. 
Vi følger opp og gir beskjed dersom ny plan er nødvendig.

Mvh
MAVI

—
MAVI saks-ID: {Saks-ID}
Kontakt kjørekontor: 40175012 (07:00–20:30, lør 09:00–14:00)`,
    caseTypes: ['butikkhenting_pp'],
    variables: ['Saks-ID']
  },
  {
    id: 'utenfor_sortiment_standard',
    name: 'Utenfor sortiment',
    subject: '[{Saks-ID}] Tjenesten er utenfor sortiment',
    body: `Hei,

Forespurt tjeneste er ikke i vårt sortiment (f.eks. lydplanke, kjøkkenmontering, rør-inngrep, ledningsskjulere, lydsystem-kalibrering). 
Vi kan gjerne levere alternativer eller henvise til riktig leverandør.

Mvh
MAVI

—
MAVI saks-ID: {Saks-ID}
Kontakt kjørekontor: 40175012 (07:00–20:30, lør 09:00–14:00)`,
    caseTypes: ['utenfor_sortiment'],
    variables: ['Saks-ID']
  },
  {
    id: 'region_plan_info',
    name: 'Regional plan',
    subject: '[{Saks-ID}] Regional plan',
    body: `Hei,

Merk at vi leverer til Gol/Geilo mandag, onsdag og fredag. Kongsvinger tirsdag og torsdag. 
Dette kan påvirke tidligste leveringsdato.

Mvh
MAVI

—
MAVI saks-ID: {Saks-ID}
Kontakt kjørekontor: 40175012 (07:00–20:30, lør 09:00–14:00)`,
    caseTypes: ['hub_ruter'],
    variables: ['Saks-ID']
  }
];

// ============================================================================
// DEFAULT RULES
// ============================================================================

export const DEFAULT_RULES: RuleDefinition[] = [
  {
    name: 'Forsinkelse/levering i dag',
    priority: 90,
    if: {
      any: [
        { subject_regex: '(forsink|sen|lever.* i dag)' },
        { body_regex: '(lever.* i dag|sen.* ankomst|blir den levert)' }
      ]
    },
    then: [
      'classify:leveringsstatus',
      'set_sla:PT2H',
      'suggest_template:FORSINKELSE_OPPFØLGING',
      'extract_entities',
      'link_similar:order_id;customer;address;window'
    ]
  },
  {
    name: 'Endre adresse/telefon/kundenavn',
    priority: 85,
    if: {
      any: [
        { body_regex: '(endre (adresse|telefon|tlf|navn))' },
        { subject_regex: '(adresseendring|tlf)' }
      ]
    },
    then: [
      'classify:endring_kundeinfo',
      'suggest_template:ENDRING_MA_VIA_CCC',
      'note:Kan notere midlertidig på kjøreliste hvis levering er i dag/i morgen',
      'link_similar:order_id;customer'
    ]
  },
  {
    name: '4-mann behov',
    priority: 88,
    if: {
      any: [
        { body_regex: '(4\\s?mann|fire\\s?personer|tung.* bæring)' }
      ]
    },
    then: [
      'classify:firemann',
      'set_price_range:1100-1500',
      'route_to_queue:Planlegging',
      'suggest_template:4MANN_PLANLEGGING',
      'create_task:Print FU og registrer pris i ad hoc-fil',
      'link_similar:address;order_id'
    ]
  },
  {
    name: 'Kansellering (blokker i SAP)',
    priority: 80,
    if: {
      any: [
        { subject_regex: '(kanseller|avbestill)' },
        { body_regex: '(skal ikke utføres|ønsker å avbestille)' }
      ]
    },
    then: [
      'classify:kansellering',
      'suggest_template:KANSELLERING_BLOCK_ONLY',
      'action:SAP_block_planning_execution',
      'note:Informer at kunde må kansellere hos CCC/butikk',
      'link_similar:order_id'
    ]
  },
  {
    name: 'Butikkhenting/P&P',
    priority: 75,
    if: {
      any: [
        { body_regex: '(pick.?&.?pack|p&p|HU has been assigned to FU)' },
        { body_regex: '(feil profil|Milkrun|ikke planlagt for internkjøring)' }
      ]
    },
    then: [
      'classify:butikkhenting_pp',
      'suggest_template:BUTIKK_PP_INFO',
      'link_similar:store_id;order_id'
    ]
  },
  {
    name: 'Utenfor sortiment',
    priority: 70,
    if: {
      any: [
        { body_regex: '(lydplanke|kjøkkenmontering|rør(arbeid|inngrep)|ledningsskjulere|lydsystem)' }
      ]
    },
    then: [
      'classify:utenfor_sortiment',
      'suggest_template:UTENFOR_SORTIMENT_STANDARD',
      'link_similar:customer;address'
    ]
  },
  {
    name: 'Regiondag Gol/Geilo/Kongsvinger',
    priority: 60,
    if: {
      any: [
        { body_regex: '(Gol|Geilo|Kongsvinger)' }
      ]
    },
    then: [
      'classify:hub_ruter',
      'note:Gol/Geilo: man/ons/fre — Kongsvinger: tir/tor',
      'suggest_template:REGION_PLAN_INFO'
    ]
  }
];

// ============================================================================
// EMAIL SYSTEM SERVICE CLASS
// ============================================================================

export class EmailSystemService {
  /**
   * Extract entities from text
   */
  static extractEntities(text: string, messageId: string): ExtractedEntity[] {
    const entities: ExtractedEntity[] = [];
    const lowerText = text.toLowerCase();
    
    // Extract SA, FU, HU
    ['SA', 'FU', 'HU'].forEach(key => {
      const pattern = ENTITY_PATTERNS[key as keyof typeof ENTITY_PATTERNS];
      const matches = text.matchAll(pattern);
      for (const match of matches) {
        entities.push({
          key: key.toLowerCase(),
          value: match[0].trim(),
          confidence: 0.95,
          startIndex: match.index,
          endIndex: (match.index || 0) + match[0].length
        });
      }
    });
    
    // Extract order IDs (6-12 digits)
    const orderMatches = text.matchAll(ENTITY_PATTERNS.OrderId);
    for (const match of orderMatches) {
      // Check context for validation
      const context = text.substring(Math.max(0, (match.index || 0) - 20), Math.min(text.length, (match.index || 0) + match[0].length + 20));
      if (/ordre|order|ordrenr|ref|referanse/i.test(context)) {
        entities.push({
          key: 'order_id',
          value: match[0].trim(),
          confidence: 0.85,
          startIndex: match.index,
          endIndex: (match.index || 0) + match[0].length
        });
      }
    }
    
    // Extract phone numbers
    const phoneMatches = text.matchAll(ENTITY_PATTERNS.Phone);
    for (const match of phoneMatches) {
      const phone = match[0].trim();
      if (phone.replace(/\D/g, '').length >= 8) {
        entities.push({
          key: 'phone',
          value: phone,
          confidence: 0.8,
          startIndex: match.index,
          endIndex: (match.index || 0) + match[0].length
        });
      }
    }
    
    // Extract postal codes
    const postalMatches = text.matchAll(ENTITY_PATTERNS.PostalCode);
    for (const match of postalMatches) {
      const postal = match[0];
      const num = parseInt(postal);
      if (num >= 1000 && num <= 9999) {
        entities.push({
          key: 'postal_code',
          value: postal,
          confidence: 0.7,
          startIndex: match.index,
          endIndex: (match.index || 0) + match[0].length
        });
      }
    }
    
    // Extract delivery windows
    const windowMatches = text.matchAll(ENTITY_PATTERNS.DeliveryWindow);
    for (const match of windowMatches) {
      entities.push({
        key: 'delivery_window',
        value: match[0].trim(),
        confidence: 0.8,
        startIndex: match.index,
        endIndex: (match.index || 0) + match[0].length
      });
    }
    
    // Extract email addresses
    const emailMatches = text.matchAll(ENTITY_PATTERNS.Email);
    for (const match of emailMatches) {
      entities.push({
        key: 'email',
        value: match[0].toLowerCase(),
        confidence: 0.95,
        startIndex: match.index,
        endIndex: (match.index || 0) + match[0].length
      });
    }
    
    return entities;
  }
  
  /**
   * Classify case type from text
   */
  static classifyCaseType(text: string): CaseType {
    const lowerText = text.toLowerCase();
    
    for (const [type, keywords] of Object.entries(CASE_TYPE_KEYWORDS)) {
      for (const keyword of keywords) {
        const regex = new RegExp(keyword, 'i');
        if (regex.test(lowerText)) {
          return type as CaseType;
        }
      }
    }
    
    return 'other';
  }
  
  /**
   * Generate unique case ID
   */
  static generateCaseId(subject: string, orderId: string, sender: string, timestamp: string): string {
    const date = new Date(timestamp);
    const dateStr = date.toISOString().split('T')[0].replace(/-/g, '');
    const hub = 'OSL'; // Default hub, can be extracted from address or other logic
    const hashInput = subject + orderId + sender + timestamp;
    const hash = btoa(hashInput).slice(0, 6).replace(/[+/=]/g, '');
    return `MAVI-${dateStr}-${hub}-${hash}`;
  }
  
  /**
   * Process rules against message
   */
  static processRules(subject: string, body: string, rules: RuleDefinition[]): RuleResult[] {
    const results: RuleResult[] = [];
    const combinedText = (subject + ' ' + body).toLowerCase();
    
    for (const rule of rules) {
      let matched = false;
      
      if (rule.if.any) {
        matched = rule.if.any.some(condition => {
          if (condition.subject_regex) {
            const regex = new RegExp(condition.subject_regex, 'i');
            return regex.test(subject);
          }
          if (condition.body_regex) {
            const regex = new RegExp(condition.body_regex, 'i');
            return regex.test(body);
          }
          return false;
        });
      }
      
      if (rule.if.all && !matched) {
        matched = rule.if.all.every(condition => {
          if (condition.subject_regex) {
            const regex = new RegExp(condition.subject_regex, 'i');
            return regex.test(subject);
          }
          if (condition.body_regex) {
            const regex = new RegExp(condition.body_regex, 'i');
            return regex.test(body);
          }
          return false;
        });
      }
      
      if (matched) {
        results.push({
          rule,
          matched: true,
          actions: rule.then
        });
      }
    }
    
    // Sort by priority (highest first)
    return results.sort((a, b) => b.rule.priority - a.rule.priority);
  }
  
  /**
   * Process template with variables
   */
  static processTemplate(template: Template, variables: Record<string, string>): { subject: string; body: string } {
    let subject = template.subject;
    let body = template.body;
    
    // Replace variables
    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`\\{${key}\\}`, 'g');
      subject = subject.replace(regex, value || '');
      body = body.replace(regex, value || '');
    });
    
    return { subject, body };
  }
  
  /**
   * Calculate SHA256 hash (simplified - in production use crypto)
   */
  static async calculateSHA256(data: ArrayBuffer): Promise<string> {
    // In browser, use Web Crypto API
    if (typeof window !== 'undefined' && window.crypto) {
      const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }
    // Fallback for Node.js (would use crypto module)
    throw new Error('SHA256 calculation not available');
  }
  
  /**
   * Normalize date (handle "i dag", "i morgen")
   */
  static normalizeDate(text: string, referenceDate: Date = new Date()): string | null {
    const lowerText = text.toLowerCase();
    const today = new Date(referenceDate);
    today.setHours(0, 0, 0, 0);
    
    if (/i dag|today|dagens/i.test(lowerText)) {
      return today.toISOString().split('T')[0];
    }
    if (/i morgen|tomorrow/i.test(lowerText)) {
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      return tomorrow.toISOString().split('T')[0];
    }
    
    // Try to parse date
    const dateMatch = text.match(/\d{1,2}[.\/-]\d{1,2}[.\/-]\d{2,4}/);
    if (dateMatch) {
      try {
        const parsed = new Date(dateMatch[0]);
        if (!isNaN(parsed.getTime())) {
          return parsed.toISOString().split('T')[0];
        }
      } catch (e) {
        // Ignore
      }
    }
    
    return null;
  }
  
  /**
   * Extract customer name from email
   */
  static extractCustomerName(from: string, body: string): string | null {
    // Try to extract from "from" field
    const fromMatch = from.match(/^(.+?)\s*<.+>$/);
    if (fromMatch) {
      return fromMatch[1].trim();
    }
    
    // Try to extract from body (common patterns)
    const patterns = [
      /hei\s+([A-ZÆØÅ][a-zæøå]+(?:\s+[A-ZÆØÅ][a-zæøå]+)*)/i,
      /hallo\s+([A-ZÆØÅ][a-zæøå]+(?:\s+[A-ZÆØÅ][a-zæøå]+)*)/i,
      /kundenavn[:\s]+([A-ZÆØÅ][a-zæøå]+(?:\s+[A-ZÆØÅ][a-zæøå]+)*)/i
    ];
    
    for (const pattern of patterns) {
      const match = body.match(pattern);
      if (match) {
        return match[1].trim();
      }
    }
    
    return null;
  }
}





