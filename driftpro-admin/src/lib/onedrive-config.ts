import { Configuration, PublicClientApplication } from '@azure/msal-browser';

// OneDrive/MS Graph konfigurasjon
export const msalConfig: Configuration = {
  auth: {
    clientId: process.env.NEXT_PUBLIC_ONEDRIVE_CLIENT_ID || 'your-client-id-here',
    authority: 'https://login.microsoftonline.com/common',
    redirectUri: typeof window !== 'undefined' ? window.location.origin : 'https://admin.driftpro.no',
  },
  cache: {
    cacheLocation: 'sessionStorage',
    storeAuthStateInCookie: false,
  },
};

// Microsoft Graph API scopes
export const graphScopes = [
  'https://graph.microsoft.com/User.Read',
  'https://graph.microsoft.com/Files.ReadWrite',
  'https://graph.microsoft.com/Files.ReadWrite.All',
  'https://graph.microsoft.com/Sites.ReadWrite.All'
];

// OneDrive mappestruktur
export const ONEDRIVE_FOLDERS = {
  SAMARBEIDSPARTNERE: 'Samarbeidspartnere',
  KJORELISTER: 'Kjørelister',
  SKANNELAPPER: 'Skannelapper',
  ARKIV: 'Arkiv'
} as const;

// Mappestruktur for organisering
export const FOLDER_STRUCTURE = {
  [ONEDRIVE_FOLDERS.SAMARBEIDSPARTNERE]: {
    description: 'Mapper for hver samarbeidspartner',
    subfolders: ['Bedrift A', 'Bedrift B', 'Bedrift C'] // Dynamisk basert på registrerte partnere
  },
  [ONEDRIVE_FOLDERS.KJORELISTER]: {
    description: 'Kjørelister organisert etter dato og rute',
    subfolders: ['2024', '2025'] // Årlige mapper
  },
  [ONEDRIVE_FOLDERS.SKANNELAPPER]: {
    description: 'Skannelapper for produkter',
    subfolders: ['Ordre', 'Retur'] // Type mapper
  },
  [ONEDRIVE_FOLDERS.ARKIV]: {
    description: 'Generelt arkiv for søk',
    subfolders: ['Dokumenter', 'Rapporter', 'Backup']
  }
} as const;

// MSAL instance
export const msalInstance = new PublicClientApplication(msalConfig);

// OneDrive API base URL
export const ONEDRIVE_API_BASE = 'https://graph.microsoft.com/v1.0/me/drive';
