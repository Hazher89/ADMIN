const XLSX = require('xlsx');
const fs = require('fs');

// Read the BUD-PRIS Excel file
const workbook = XLSX.readFile('Copy of BUD PRIS.xlsx');
const sheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[sheetName];
const data = XLSX.utils.sheet_to_json(worksheet);

console.log('Updating bud-priser-data.ts with correct postcode data...');
console.log('Total postcodes found:', data.length);

// Convert Excel data to our format
const postcodeData = data.map(row => ({
  postcode: row.Postnummer,
  place: row.Sted,
  price: parseInt(row.Pris.replace(/[^\d]/g, '')), // Extract number from "700,-"
  zone: `Zone ${row.Sone}`
}));

// Generate the complete updated file content
const fileContent = `// Auto-generated from Excel file: Copy of BUD PRIS.xlsx
// Generated on: ${new Date().toISOString()}
// Total postcodes: ${postcodeData.length}

export interface PostcodeData {
  postcode: string;
  place: string;
  price: number;
  zone: string;
}

export interface Service {
  id: string;
  name: string;
  description: string;
  category: string;
  prices: {
    dag: number;
    kveld: number;
    helg: number;
  };
  basePrice: number;
}

export interface SelectedService {
  id: string;
  name: string;
  price: number;
  description: string;
}

// Postcode data from Excel file
export const postcodeData: PostcodeData[] = [
${postcodeData.map((entry, index) => {
  const comma = index < postcodeData.length - 1 ? ',' : '';
  return `  { postcode: '${entry.postcode}', place: '${entry.place}', price: ${entry.price}, zone: '${entry.zone}' }${comma}`;
}).join('\n')}
];

// Services data (keeping existing)
export const services: Service[] = [
  {
    id: 'home-delivery-double-indoor',
    name: 'Home delivery double indoor (SITE)',
    description: 'Levering til anvist plass',
    category: 'Levering',
    prices: { dag: 445.07, kveld: 492.70, helg: 504.61 },
    basePrice: 445.07
  },
  {
    id: 'home-delivery-curbside',
    name: 'Home delivery curbside (CURBSIDE)',
    description: 'Levering til trapp',
    category: 'Levering',
    prices: { dag: 256.89, kveld: 305.23, helg: 317.31 },
    basePrice: 256.89
  }
];

// Helper functions
export const searchPostcodes = (searchTerm: string): PostcodeData[] => {
  if (!searchTerm) return [];
  return postcodeData.filter(postcode => 
    postcode.postcode.includes(searchTerm) || 
    postcode.place.toLowerCase().includes(searchTerm.toLowerCase())
  );
};

export const getPostcodeByCode = (code: string): PostcodeData | undefined => {
  return postcodeData.find(postcode => postcode.postcode === code);
};

export const getServicesByCategory = (category: string): Service[] => {
  return services.filter(service => service.category === category);
};

export const getServiceById = (id: string): Service | undefined => {
  return services.find(service => service.id === id);
};

export const getCategories = (): string[] => {
  return Array.from(new Set(services.map(service => service.category)));
};
`;

// Write the updated file
fs.writeFileSync('src/lib/bud-priser-data.ts', fileContent);

console.log('✅ bud-priser-data.ts has been updated with correct postcode data!');
console.log(`📊 Total postcodes: ${postcodeData.length}`);
console.log(`🎯 Postcode 1475: ${postcodeData.find(p => p.postcode === '1475')?.place} - ${postcodeData.find(p => p.postcode === '1475')?.price} kr`);

