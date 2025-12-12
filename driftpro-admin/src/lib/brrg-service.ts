interface BrrgCompany {
  organisasjonsnummer: string;
  navn: string;
  organisasjonsform: string;
  registreringsdatoEnhetsregisteret: string;
  registrertIMvaregisteret: boolean;
  naeringskode1: {
    kode: string;
    beskrivelse: string;
  };
  adresse: {
    adresse: string[];
    postnummer: string;
    poststed: string;
    kommune: string;
    landkode: string;
  };
  antallAnsatte: number;
  forretningsadresse?: {
    adresse: string[];
    postnummer: string;
    poststed: string;
    kommune: string;
    landkode: string;
  };
  postadresse?: {
    adresse: string[];
    postnummer: string;
    poststed: string;
    kommune: string;
    landkode: string;
  };
}

interface BrrgSearchResponse {
  _embedded: {
    enheter: BrrgCompany[];
  };
  page: {
    size: number;
    totalElements: number;
    totalPages: number;
    number: number;
  };
}

export class BrrgService {
  private baseUrl = 'https://data.brreg.no/enhetsregisteret/api';

  async searchCompanies(query: string): Promise<BrrgCompany[]> {
    try {
      console.log('🔍 Searching BRRG API for:', query);
      
      // Search by company name
      const nameResponse = await fetch(
        `${this.baseUrl}/enheter?navn=${encodeURIComponent(query)}&size=20`
      );
      
      if (!nameResponse.ok) {
        throw new Error(`HTTP error! status: ${nameResponse.status}`);
      }
      
      const nameData: BrrgSearchResponse = await nameResponse.json();
      console.log('✅ BRRG name search results:', nameData);
      
      let results = nameData._embedded?.enheter || [];
      
      // If query looks like an organization number, also search by that
      if (/^\d{9}$/.test(query.trim())) {
        try {
          const orgResponse = await fetch(
            `${this.baseUrl}/enheter/${query.trim()}`
          );
          
          if (orgResponse.ok) {
            const orgData: BrrgCompany = await orgResponse.json();
            console.log('✅ BRRG org number search result:', orgData);
            // Add to results if not already present
            if (!results.find(r => r.organisasjonsnummer === orgData.organisasjonsnummer)) {
              results.unshift(orgData);
            }
          }
        } catch (orgError) {
          console.log('ℹ️ No org number match found');
        }
      }
      
      console.log('📊 Total BRRG results:', results.length);
      return results;
      
    } catch (error) {
      console.error('❌ Error searching BRRG API:', error);
      throw new Error('Kunne ikke søke i BRRG. Prøv igjen senere.');
    }
  }

  async getCompanyDetails(orgNumber: string): Promise<BrrgCompany | null> {
    try {
      console.log('🔍 Getting BRRG company details for:', orgNumber);
      
      const response = await fetch(`${this.baseUrl}/enheter/${orgNumber}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data: BrrgCompany = await response.json();
      console.log('✅ BRRG company details:', data);
      
      return data;
      
    } catch (error) {
      console.error('❌ Error getting BRRG company details:', error);
      throw new Error('Kunne ikke hente bedriftsdetaljer fra BRRG.');
    }
  }

  // Helper function to format BRRG data for our partner form
  formatCompanyForPartner(brrgCompany: BrrgCompany) {
    const address = brrgCompany.adresse;
    const addressString = address.adresse.join(', ');
    
    return {
      name: brrgCompany.navn,
      orgNumber: brrgCompany.organisasjonsnummer,
      industry: brrgCompany.naeringskode1?.beskrivelse || 'Ukjent',
      address: addressString,
      city: address.poststed,
      postalCode: address.postnummer,
      county: address.kommune,
      employees: brrgCompany.antallAnsatte || 0,
      registrationDate: brrgCompany.registreringsdatoEnhetsregisteret,
      organizationForm: brrgCompany.organisasjonsform,
      description: `${brrgCompany.naeringskode1?.beskrivelse || 'Ukjent bransje'} • ${brrgCompany.organisasjonsform} • Registrert ${new Date(brrgCompany.registreringsdatoEnhetsregisteret).toLocaleDateString('no-NO')}`
    };
  }

  // Add admin user function
  async addAdmin(adminData: {
    email: string;
    name: string;
    companyName: string;
        role?: string;
    permissions?: string[];
  }) {
    try {
      console.log('👤 Adding admin user:', adminData);
      
      // Call the API to add admin
      const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
      const response = await fetch(`${baseUrl}/api/admins`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: adminData.email,
          name: adminData.name,
          role: adminData.role || 'admin',
                    companyName: adminData.companyName,
          permissions: adminData.permissions || []
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add admin');
      }

      const result = await response.json();
      console.log('✅ Admin added successfully:', result);
      
      return result;
    } catch (error) {
      console.error('❌ Error adding admin:', error);
      throw error;
    }
  }

  // Get admins for a company
  async getAdmins(    try {
      console.log('👥 Getting admins for company:', companyId);
      
      const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
      const response = await fetch(`${baseUrl}/api/admins?companyId=${companyId}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to get admins');
      }

      const result = await response.json();
      console.log('✅ Admins retrieved successfully:', result);
      
      return result;
    } catch (error) {
      console.error('❌ Error getting admins:', error);
      throw error;
    }
  }
}

export const brrgService = new BrrgService();