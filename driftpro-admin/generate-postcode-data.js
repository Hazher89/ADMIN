const XLSX = require('xlsx');

// Read the BUD-PRIS Excel file
const workbook = XLSX.readFile('Copy of BUD PRIS.xlsx');
const sheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[sheetName];
const data = XLSX.utils.sheet_to_json(worksheet);

console.log('Generating postcode data from Excel...');
console.log('Total postcodes found:', data.length);

// Convert Excel data to our format
const postcodeData = data.map(row => ({
  postcode: row.Postnummer,
  place: row.Sted,
  price: parseInt(row.Pris.replace(/[^\d]/g, '')), // Extract number from "700,-"
  zone: `Zone ${row.Sone}`
}));

// Show first 10 entries
console.log('\nFirst 10 entries:');
postcodeData.slice(0, 10).forEach(entry => {
  console.log(`${entry.postcode} - ${entry.place} (${entry.zone} - ${entry.price} kr)`);
});

// Show postcode 1475 specifically
const postcode1475 = postcodeData.find(p => p.postcode === '1475');
if (postcode1475) {
  console.log(`\nPostcode 1475: ${postcode1475.postcode} - ${postcode1475.place} (${postcode1475.zone} - ${postcode1475.price} kr)`);
}

// Generate the data structure for bud-priser-data.ts
console.log('\n// Generated postcode data:');
console.log('export const postcodeData: PostcodeData[] = [');
postcodeData.forEach((entry, index) => {
  const comma = index < postcodeData.length - 1 ? ',' : '';
  console.log(`  { postcode: '${entry.postcode}', place: '${entry.place}', price: ${entry.price}, zone: '${entry.zone}' }${comma}`);
});
console.log('];');

