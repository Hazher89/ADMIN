// Mock data for local development when Firebase is not configured
export interface MockCompany {
  id: string;
  name: string;
  orgNumber: string;
  phone: string;
  email: string;
  adminEmail: string;
  address: string;
  industry: string;
  employeeCount: number;
  status: 'active' | 'inactive' | 'pending';
  createdAt: string;
  updatedAt: string;
  subscriptionPlan: 'basic' | 'premium' | 'enterprise';
  contactPerson: {
    name: string;
    phone: string;
    email: string;
  };
}

export const mockCompanies: MockCompany[] = [
  {
    id: 'mock-company-1',
    name: 'DriftPro AS',
    orgNumber: '123456789',
    phone: '+47 123 45 678',
    email: 'info@driftpro.no',
    adminEmail: 'admin@driftpro.no',
    address: 'Storgata 1, 0001 Oslo',
    industry: 'Teknologi',
    employeeCount: 25,
    status: 'active',
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-08-12T14:30:00Z',
    subscriptionPlan: 'premium',
    contactPerson: {
      name: 'Ola Nordmann',
      phone: '+47 123 45 679',
      email: 'ola@driftpro.no'
    }
  },
  {
    id: 'mock-company-2',
    name: 'Innovasjon Norge',
    orgNumber: '987654321',
    phone: '+47 987 65 432',
    email: 'kontakt@innovasjon.no',
    adminEmail: 'admin@innovasjon.no',
    address: 'Innovasjonsveien 42, 5000 Bergen',
    industry: 'Forskning og Utvikling',
    employeeCount: 15,
    status: 'active',
    createdAt: '2024-02-20T09:00:00Z',
    updatedAt: '2024-08-10T16:45:00Z',
    subscriptionPlan: 'basic',
    contactPerson: {
      name: 'Kari Hansen',
      phone: '+47 987 65 433',
      email: 'kari@innovasjon.no'
    }
  },
  {
    id: 'mock-company-3',
    name: 'Fremtid Bedrift',
    orgNumber: '456789123',
    phone: '+47 456 78 912',
    email: 'post@fremtid.no',
    adminEmail: 'admin@fremtid.no',
    address: 'Fremtidsgata 15, 7000 Trondheim',
    industry: 'Konsulent',
    employeeCount: 8,
    status: 'pending',
    createdAt: '2024-07-01T11:00:00Z',
    updatedAt: '2024-08-11T10:15:00Z',
    subscriptionPlan: 'basic',
    contactPerson: {
      name: 'Per Olsen',
      phone: '+47 456 78 913',
      email: 'per@fremtid.no'
    }
  }
];

export interface MockEmployee {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  position: string;
  department: string;
  startDate: string;
  status: 'active' | 'inactive' | 'on_leave';
  avatar?: string;
}

export const mockEmployees: MockEmployee[] = [
  {
    id: 'mock-employee-1',
    firstName: 'Anna',
    lastName: 'Berg',
    email: 'anna.berg@driftpro.no',
    phone: '+47 111 22 333',
    position: 'Utvikler',
    department: 'IT',
    startDate: '2023-03-15',
    status: 'active'
  },
  {
    id: 'mock-employee-2',
    firstName: 'Erik',
    lastName: 'Sørensen',
    email: 'erik.sorensen@driftpro.no',
    phone: '+47 222 33 444',
    position: 'Prosjektleder',
    department: 'Ledelse',
    startDate: '2022-09-01',
    status: 'active'
  },
  {
    id: 'mock-employee-3',
    firstName: 'Maria',
    lastName: 'Johansen',
    email: 'maria.johansen@driftpro.no',
    phone: '+47 333 44 555',
    position: 'Designer',
    department: 'Design',
    startDate: '2024-01-10',
    status: 'active'
  }
];

export interface MockDepartment {
  id: string;
  name: string;
  description: string;
  managerId: string;
  employeeCount: number;
  status: 'active' | 'inactive';
}

export const mockDepartments: MockDepartment[] = [
  {
    id: 'mock-dept-1',
    name: 'IT',
    description: 'Informasjonsteknologi og systemutvikling',
    managerId: 'mock-employee-2',
    employeeCount: 8,
    status: 'active'
  },
  {
    id: 'mock-dept-2',
    name: 'Design',
    description: 'Grafisk design og brukeropplevelse',
    managerId: 'mock-employee-3',
    employeeCount: 4,
    status: 'active'
  },
  {
    id: 'mock-dept-3',
    name: 'Ledelse',
    description: 'Strategisk ledelse og prosjektstyring',
    managerId: 'mock-employee-2',
    employeeCount: 3,
    status: 'active'
  }
];

