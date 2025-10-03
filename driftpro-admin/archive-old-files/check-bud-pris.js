const XLSX = require('xlsx');

// Read the new Excel file with all services
const workbook = XLSX.readFile('Prisliste sjåfører 05.05.2025 conv.xlsx');

// Get the first sheet
const sheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[sheetName];

// Convert to JSON
const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

console.log('Excel file structure:');
console.log('Sheet name:', sheetName);
console.log('Total rows:', data.length);

// Find all service sections
let fraktkodeStart = -1;
let servicekoderStart = -1;
let avanserteStart = -1;

for (let i = 0; i < data.length; i++) {
  const row = data[i];
  if (row && row.length > 0) {
    if (row[0] === 'Fraktkode:') fraktkodeStart = i;
    if (row[0] === 'Servicekoder:') servicekoderStart = i;
    if (row[0] === 'Avanserte servicekoder:') avanserteStart = i;
  }
}

console.log('Section starts:');
console.log('- Fraktkode:', fraktkodeStart);
console.log('- Servicekoder:', servicekoderStart);
console.log('- Avanserte servicekoder:', avanserteStart);

// Extract services from all sections
const services = [];

// Extract from Fraktkode section
if (fraktkodeStart !== -1) {
  for (let i = fraktkodeStart + 1; i < (servicekoderStart !== -1 ? servicekoderStart : data.length); i++) {
    const row = data[i];
    if (row && row.length >= 2 && row[0] && row[1] && row[0] !== 'Servicekoder:') {
      const fraktkode = row[0];
      const beskrivelse = row[1];
      
      // Handle different price formats (comma vs dot)
      let dagPris = 0, kveldPris = 0, helgPris = 0;
      
      if (row[2]) {
        const priceStr = row[2].toString().replace(',', '.');
        dagPris = parseFloat(priceStr) || 0;
      }
      if (row[3]) {
        const priceStr = row[3].toString().replace(',', '.');
        kveldPris = parseFloat(priceStr) || 0;
      }
      if (row[4]) {
        const priceStr = row[4].toString().replace(',', '.');
        helgPris = parseFloat(priceStr) || 0;
      }
      
      // Include services even if they have no prices (like ADHOC)
      services.push({
        fraktkode,
        beskrivelse,
        dagPris,
        kveldPris,
        helgPris,
        section: 'Fraktkode'
      });
    }
  }
}

// Extract from Servicekoder section
if (servicekoderStart !== -1) {
  for (let i = servicekoderStart + 1; i < (avanserteStart !== -1 ? avanserteStart : data.length); i++) {
    const row = data[i];
    if (row && row.length >= 2 && row[0] && row[1] && row[0] !== 'Avanserte servicekoder:') {
      const fraktkode = row[0];
      const beskrivelse = row[1];
      
      // Handle different price formats (comma vs dot)
      let dagPris = 0, kveldPris = 0, helgPris = 0;
      
      if (row[2]) {
        const priceStr = row[2].toString().replace(',', '.');
        dagPris = parseFloat(priceStr) || 0;
      }
      if (row[3]) {
        const priceStr = row[3].toString().replace(',', '.');
        kveldPris = parseFloat(priceStr) || 0;
      }
      if (row[4]) {
        const priceStr = row[4].toString().replace(',', '.');
        helgPris = parseFloat(priceStr) || 0;
      }
      
      services.push({
        fraktkode,
        beskrivelse,
        dagPris,
        kveldPris,
        helgPris,
        section: 'Servicekoder'
      });
    }
  }
}

// Extract from Avanserte servicekoder section
if (avanserteStart !== -1) {
  for (let i = avanserteStart + 1; i < data.length; i++) {
    const row = data[i];
    if (row && row.length >= 2 && row[0] && row[1]) {
      const fraktkode = row[0];
      const beskrivelse = row[1];
      
      // Handle different price formats (comma vs dot)
      let dagPris = 0, kveldPris = 0, helgPris = 0;
      
      if (row[2]) {
        const priceStr = row[2].toString().replace(',', '.');
        dagPris = parseFloat(priceStr) || 0;
      }
      if (row[3]) {
        const priceStr = row[3].toString().replace(',', '.');
        kveldPris = parseFloat(priceStr) || 0;
      }
      if (row[4]) {
        const priceStr = row[4].toString().replace(',', '.');
        helgPris = parseFloat(priceStr) || 0;
      }
      
      services.push({
        fraktkode,
        beskrivelse,
        dagPris,
        kveldPris,
        helgPris,
        section: 'Avanserte servicekoder'
      });
    }
  }
}

console.log('\nExtracted services by section:');
const bySection = {};
services.forEach(service => {
  if (!bySection[service.section]) bySection[service.section] = [];
  bySection[service.section].push(service);
});

Object.keys(bySection).forEach(section => {
  console.log(`\n${section} (${bySection[section].length} services):`);
  bySection[section].forEach((service, index) => {
    console.log(`${index + 1}. ${service.fraktkode}`);
    console.log(`   Beskrivelse: ${service.beskrivelse}`);
    console.log(`   Dag: ${service.dagPris} kr, Kveld: ${service.kveldPris} kr, Helg: ${service.helgPris} kr`);
  });
});

// Generate unique IDs and categorize services
const categorizedServices = [];
const usedIds = new Set();

services.forEach((service, index) => {
  let baseId = service.fraktkode.toLowerCase()
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  
  // Handle duplicates by adding description info
  let uniqueId = baseId;
  let counter = 1;
  while (usedIds.has(uniqueId)) {
    uniqueId = `${baseId}-${counter}`;
    counter++;
  }
  usedIds.add(uniqueId);
  
  // Determine category based on service type and section
  let category = 'Levering';
  if (service.section === 'Servicekoder' || service.section === 'Avanserte servicekoder') {
    if (service.fraktkode.toLowerCase().includes('installation') || 
        service.fraktkode.toLowerCase().includes('iwash') ||
        service.fraktkode.toLowerCase().includes('idry') ||
        service.fraktkode.toLowerCase().includes('icoo') ||
        service.fraktkode.toLowerCase().includes('ifrid') ||
        service.fraktkode.toLowerCase().includes('idish') ||
        service.fraktkode.toLowerCase().includes('idisi') ||
        service.fraktkode.toLowerCase().includes('idryca') ||
        service.fraktkode.toLowerCase().includes('ioven') ||
        service.fraktkode.toLowerCase().includes('ihob') ||
        service.fraktkode.toLowerCase().includes('ihoos') ||
        service.fraktkode.toLowerCase().includes('ihoom') ||
        service.fraktkode.toLowerCase().includes('ihool') ||
        service.fraktkode.toLowerCase().includes('imic') ||
        service.fraktkode.toLowerCase().includes('isbs') ||
        service.fraktkode.toLowerCase().includes('turn') ||
        service.fraktkode.toLowerCase().includes('itv') ||
        service.fraktkode.toLowerCase().includes('ibbg') ||
        service.fraktkode.toLowerCase().includes('ifrdi') ||
        service.fraktkode.toLowerCase().includes('install')) {
      category = 'Installasjon';
    } else if (service.fraktkode.toLowerCase().includes('recycling') ||
               service.fraktkode.toLowerCase().includes('retgreen') ||
               service.fraktkode.toLowerCase().includes('devun')) {
      category = 'Miljø & Retur';
    } else if (service.fraktkode.toLowerCase().includes('delcarryin') ||
               service.fraktkode.toLowerCase().includes('extra time')) {
      category = 'Ekstra Tjenester';
    }
  } else if (service.section === 'Fraktkode') {
    if (service.fraktkode.toLowerCase().includes('rebooking') ||
        service.fraktkode.toLowerCase().includes('adhoc')) {
      category = 'Administrasjon';
    } else if (service.fraktkode.toLowerCase().includes('recycling') ||
               service.fraktkode.toLowerCase().includes('retgreen') ||
               service.fraktkode.toLowerCase().includes('devun')) {
      category = 'Miljø & Retur';
    }
  }
  
  categorizedServices.push({
    ...service,
    id: uniqueId,
    category
  });
});

// Generate the services array for bud-priser-data.ts
console.log('\n// Generated services array for bud-priser-data.ts:');
console.log('export const services: Service[] = [');
categorizedServices.forEach((service, index) => {
  console.log(`  {`);
  console.log(`    id: '${service.id}',`);
  console.log(`    name: '${service.fraktkode}',`);
  console.log(`    description: '${service.beskrivelse}',`);
  console.log(`    category: '${service.category}',`);
  console.log(`    prices: { dag: ${service.dagPris}, kveld: ${service.kveldPris}, helg: ${service.helgPris} },`);
  console.log(`    basePrice: ${service.dagPris} // Using dag price as base`);
  console.log(`  }${index < categorizedServices.length - 1 ? ',' : ''}`);
});
console.log('];');

console.log(`\nTotal services extracted: ${categorizedServices.length}`);
console.log('\nCategories found:');
const categories = [...new Set(categorizedServices.map(s => s.category))];
categories.forEach(category => {
  const count = categorizedServices.filter(s => s.category === category).length;
  console.log(`- ${category}: ${count} services`);
});
