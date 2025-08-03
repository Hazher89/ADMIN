// BRRG Service for fetching company information and managing admins

export interface BRRGCompany {
  organisasjonsnummer: string;
  navn: string;
  organisasjonsform: {
    kode: string;
    beskrivelse: string;
  };
  registreringsdatoEnhetsregisteret: string;
  registrertIMvaregisteret: boolean;
  naeringskode1: {
    kode: string;
    beskrivelse: string;
  };
  antallAnsatte: number;
  forretningsadresse: {
    adresse: string;
    postnummer: string;
    poststed: string;
    land: string;
  };
  kontaktinformasjon?: {
    telefon?: string;
    epost?: string;
  };
}

export interface BRRGAdmin {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'super_admin';
  companyId: string;
  companyName: string;
  createdAt: string;
  updatedAt: string;
  permissions: string[];
}

class BRRGService {
  private baseUrl = 'https://data.brreg.no/enhetsregisteret/api/enheter';
  private adminApiUrl = '/api/admins'; // For managing admins

  /**
   * Fetch company information from BRRG
   */
  async getCompanyInfo(orgNumber: string): Promise<BRRGCompany | null> {
    try {
      const response = await fetch(`${this.baseUrl}/${orgNumber}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          console.warn(`Company with org number ${orgNumber} not found in BRRG`);
          return null;
        }
        throw new Error(`BRRG API error: ${response.status}`);
      }

      const data = await response.json();
      return this.transformBRRGData(data);
    } catch (error) {
      console.error('Error fetching company from BRRG:', error);
      return null;
    }
  }

  /**
   * Transform BRRG data to our format
   */
  private transformBRRGData(data: any): BRRGCompany {
    return {
      organisasjonsnummer: data.organisasjonsnummer,
      navn: data.navn,
      organisasjonsform: {
        kode: data.organisasjonsform?.kode || '',
        beskrivelse: data.organisasjonsform?.beskrivelse || ''
      },
      registreringsdatoEnhetsregisteret: data.registreringsdatoEnhetsregisteret,
      registrertIMvaregisteret: data.registrertIMvaregisteret || false,
      naeringskode1: {
        kode: data.naeringskode1?.kode || '',
        beskrivelse: data.naeringskode1?.beskrivelse || ''
      },
      antallAnsatte: data.antallAnsatte || 0,
      forretningsadresse: {
        adresse: data.forretningsadresse?.adresse || '',
        postnummer: data.forretningsadresse?.postnummer || '',
        poststed: data.forretningsadresse?.poststed || '',
        land: data.forretningsadresse?.land || 'Norge'
      },
      kontaktinformasjon: {
        telefon: data.kontaktinformasjon?.telefon || '',
        epost: data.kontaktinformasjon?.epost || ''
      }
    };
  }

  /**
   * Search companies in BRRG
   */
  async searchCompanies(query: string): Promise<BRRGCompany[]> {
    try {
      const response = await fetch(`${this.baseUrl}?navn=${encodeURIComponent(query)}`);
      
      if (!response.ok) {
        throw new Error(`BRRG search error: ${response.status}`);
      }

      const data = await response.json();
      return data._embedded?.enheter?.map((company: any) => this.transformBRRGData(company)) || [];
    } catch (error) {
      console.error('Error searching companies in BRRG:', error);
      return [];
    }
  }

  /**
   * Get all admins for a company
   */
  async getAdmins(companyId: string): Promise<BRRGAdmin[]> {
    try {
      const response = await fetch(`${this.adminApiUrl}?companyId=${companyId}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to fetch admins: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching admins:', error);
      throw error; // Re-throw to let the calling code handle it
    }
  }

  /**
   * Add a new admin
   */
  async addAdmin(adminData: Omit<BRRGAdmin, 'id' | 'createdAt' | 'updatedAt'>): Promise<BRRGAdmin | null> {
    try {
      const response = await fetch(this.adminApiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...adminData,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to add admin: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error adding admin:', error);
      throw error; // Re-throw to let the calling code handle it
    }
  }

  /**
   * Update admin permissions
   */
  async updateAdmin(adminId: string, updates: Partial<BRRGAdmin>): Promise<BRRGAdmin | null> {
    try {
      const response = await fetch(`${this.adminApiUrl}/${adminId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...updates,
          updatedAt: new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to update admin: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error updating admin:', error);
      throw error; // Re-throw to let the calling code handle it
    }
  }

  /**
   * Remove admin
   */
  async removeAdmin(adminId: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.adminApiUrl}/${adminId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to remove admin: ${response.status}`);
      }

      return response.ok;
    } catch (error) {
      console.error('Error removing admin:', error);
      throw error; // Re-throw to let the calling code handle it
    }
  }

  /**
   * Sync company data from BRRG to our system
   */
  async syncCompanyData(orgNumber: string): Promise<BRRGCompany | null> {
    const brrgData = await this.getCompanyInfo(orgNumber);
    
    if (!brrgData) {
      return null;
    }

    // Here you would typically save this data to your database
    // For now, we'll just return the transformed data
    return brrgData;
  }

  /**
   * Validate organization number format
   */
  validateOrgNumber(orgNumber: string): boolean {
    // Norwegian organization number validation
    const cleanOrgNumber = orgNumber.replace(/\s/g, '');
    
    if (cleanOrgNumber.length !== 9) {
      return false;
    }

    // Check if it's all digits
    if (!/^\d{9}$/.test(cleanOrgNumber)) {
      return false;
    }

    // Validate checksum (simplified validation)
    const digits = cleanOrgNumber.split('').map(Number);
    const weights = [3, 2, 7, 6, 5, 4, 3, 2];
    
    let sum = 0;
    for (let i = 0; i < 8; i++) {
      sum += digits[i] * weights[i];
    }
    
    const remainder = sum % 11;
    const checksum = remainder === 0 ? 0 : 11 - remainder;
    
    return digits[8] === checksum;
  }
}

export const brrgService = new BRRGService(); 