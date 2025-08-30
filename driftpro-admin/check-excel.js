const XLSX = require('xlsx');

// Read the Excel file
const workbook = XLSX.readFile('prisliste-sjoforer.xlsx');

// Get the first sheet
const sheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[sheetName];

// Convert to JSON
const data = XLSX.utils.sheet_to_json(worksheet);

console.log('Excel file contents:');
console.log('===================');
console.log('Sheet name:', sheetName);
console.log('Total rows:', data.length);
console.log('');

// Show first few rows to understand structure
console.log('First 5 rows:');
data.slice(0, 5).forEach((row, index) => {
  console.log(`Row ${index + 1}:`, row);
});

console.log('');
console.log('All column names:');
if (data.length > 0) {
  console.log(Object.keys(data[0]));
}

// Search for postcode 1475 specifically
console.log('');
console.log('Searching for postcode 1475...');
const postcode1475 = data.find(row => {
  // Check all columns for postcode 1475
  return Object.values(row).some(value => 
    String(value).includes('1475')
  );
});

if (postcode1475) {
  console.log('Found postcode 1475:', postcode1475);
} else {
  console.log('Postcode 1475 not found in this Excel file');
}

// Check if this is the right file
console.log('');
console.log('This appears to be the services price list, not the postcode price list.');
console.log('We need the BUD-PRIS Excel file with postcodes, places, zones, and prices.');


