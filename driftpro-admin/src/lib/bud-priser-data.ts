// Auto-generated from Excel file: prisliste-sjoforer.xlsx
// Generated on: 2025-08-27T10:45:42.951Z
// Total services: 43

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

// Postcode data (existing)
export const postcodeData: PostcodeData[] = [
  // Oslo postcodes (Zone 1)
  { postcode: '0001', place: 'Oslo', price: 500, zone: 'Zone 1' },
  { postcode: '0002', place: 'Oslo', price: 500, zone: 'Zone 1' },
  { postcode: '0003', place: 'Oslo', price: 500, zone: 'Zone 1' },
  { postcode: '0004', place: 'Oslo', price: 500, zone: 'Zone 1' },
  { postcode: '0005', place: 'Oslo', price: 500, zone: 'Zone 1' },
  { postcode: '0006', place: 'Oslo', price: 500, zone: 'Zone 1' },
  { postcode: '0007', place: 'Oslo', price: 500, zone: 'Zone 1' },
  { postcode: '0008', place: 'Oslo', price: 500, zone: 'Zone 1' },
  { postcode: '0009', place: 'Oslo', price: 500, zone: 'Zone 1' },
  { postcode: '0010', place: 'Oslo', price: 500, zone: 'Zone 1' },
  { postcode: '0011', place: 'Oslo', price: 500, zone: 'Zone 1' },
  { postcode: '0012', place: 'Oslo', price: 500, zone: 'Zone 1' },
  { postcode: '0013', place: 'Oslo', price: 500, zone: 'Zone 1' },
  { postcode: '0014', place: 'Oslo', price: 500, zone: 'Zone 1' },
  { postcode: '0015', place: 'Oslo', price: 500, zone: 'Zone 1' },
  { postcode: '0016', place: 'Oslo', price: 500, zone: 'Zone 1' },
  { postcode: '0017', place: 'Oslo', price: 500, zone: 'Zone 1' },
  { postcode: '0018', place: 'Oslo', price: 500, zone: 'Zone 1' },
  { postcode: '0019', place: 'Oslo', price: 500, zone: 'Zone 1' },
  { postcode: '0020', place: 'Oslo', price: 500, zone: 'Zone 1' },
  { postcode: '0021', place: 'Oslo', price: 500, zone: 'Zone 1' },
  { postcode: '0022', place: 'Oslo', price: 500, zone: 'Zone 1' },
  { postcode: '0023', place: 'Oslo', price: 500, zone: 'Zone 1' },
  { postcode: '0024', place: 'Oslo', price: 500, zone: 'Zone 1' },
  { postcode: '0025', place: 'Oslo', price: 500, zone: 'Zone 1' },
  { postcode: '0026', place: 'Oslo', price: 500, zone: 'Zone 1' },
  { postcode: '0027', place: 'Oslo', price: 500, zone: 'Zone 1' },
  { postcode: '0028', place: 'Oslo', price: 500, zone: 'Zone 1' },
  { postcode: '0029', place: 'Oslo', price: 500, zone: 'Zone 1' },
  { postcode: '0030', place: 'Oslo', price: 500, zone: 'Zone 1' },
  { postcode: '0031', place: 'Oslo', price: 500, zone: 'Zone 1' },
  { postcode: '0032', place: 'Oslo', price: 500, zone: 'Zone 1' },
  { postcode: '0033', place: 'Oslo', price: 500, zone: 'Zone 1' },
  { postcode: '0034', place: 'Oslo', price: 500, zone: 'Zone 1' },
  { postcode: '0035', place: 'Oslo', price: 500, zone: 'Zone 1' },
  { postcode: '0036', place: 'Oslo', price: 500, zone: 'Zone 1' },
  { postcode: '0037', place: 'Oslo', price: 500, zone: 'Zone 1' },
  { postcode: '0038', place: 'Oslo', price: 500, zone: 'Zone 1' },
  { postcode: '0039', place: 'Oslo', price: 500, zone: 'Zone 1' },
  { postcode: '0040', place: 'Oslo', price: 500, zone: 'Zone 1' },
  { postcode: '0041', place: 'Oslo', price: 500, zone: 'Zone 1' },
  { postcode: '0042', place: 'Oslo', price: 500, zone: 'Zone 1' },
  { postcode: '0043', place: 'Oslo', price: 500, zone: 'Zone 1' },
  { postcode: '0044', place: 'Oslo', price: 500, zone: 'Zone 1' },
  { postcode: '0045', place: 'Oslo', price: 500, zone: 'Zone 1' },
  { postcode: '0046', place: 'Oslo', price: 500, zone: 'Zone 1' },
  { postcode: '0047', place: 'Oslo', price: 500, zone: 'Zone 1' },
  { postcode: '0048', place: 'Oslo', price: 500, zone: 'Zone 1' },
  { postcode: '0049', place: 'Oslo', price: 500, zone: 'Zone 1' },
  { postcode: '0050', place: 'Oslo', price: 500, zone: 'Zone 1' },
  { postcode: '0051', place: 'Oslo', price: 500, zone: 'Zone 1' },
  { postcode: '0052', place: 'Oslo', price: 500, zone: 'Zone 1' },
  { postcode: '0053', place: 'Oslo', price: 500, zone: 'Zone 1' },
  { postcode: '0054', place: 'Oslo', price: 500, zone: 'Zone 1' },
  { postcode: '0055', place: 'Oslo', price: 500, zone: 'Zone 1' },
  { postcode: '0056', place: 'Oslo', price: 500, zone: 'Zone 1' },
  { postcode: '0057', place: 'Oslo', price: 500, zone: 'Zone 1' },
  { postcode: '0058', place: 'Oslo', price: 500, zone: 'Zone 1' },
  { postcode: '0059', place: 'Oslo', price: 500, zone: 'Zone 1' },
  { postcode: '0060', place: 'Oslo', price: 500, zone: 'Zone 1' },
  { postcode: '0061', place: 'Oslo', price: 500, zone: 'Zone 1' },
  { postcode: '0062', place: 'Oslo', price: 500, zone: 'Zone 1' },
  { postcode: '0063', place: 'Oslo', price: 500, zone: 'Zone 1' },
  { postcode: '0064', place: 'Oslo', price: 500, zone: 'Zone 1' },
  { postcode: '0065', place: 'Oslo', price: 500, zone: 'Zone 1' },
  { postcode: '0066', place: 'Oslo', price: 500, zone: 'Zone 1' },
  { postcode: '0067', place: 'Oslo', price: 500, zone: 'Zone 1' },
  { postcode: '0068', place: 'Oslo', price: 500, zone: 'Zone 1' },
  { postcode: '0069', place: 'Oslo', price: 500, zone: 'Zone 1' },
  { postcode: '0070', place: 'Oslo', price: 500, zone: 'Zone 1' },
  { postcode: '0071', place: 'Oslo', price: 500, zone: 'Zone 1' },
  { postcode: '0072', place: 'Oslo', price: 500, zone: 'Zone 1' },
  { postcode: '0073', place: 'Oslo', price: 500, zone: 'Zone 1' },
  { postcode: '0074', place: 'Oslo', price: 500, zone: 'Zone 1' },
  { postcode: '0075', place: 'Oslo', price: 500, zone: 'Zone 1' },
  { postcode: '0076', place: 'Oslo', price: 500, zone: 'Zone 1' },
  { postcode: '0077', place: 'Oslo', price: 500, zone: 'Zone 1' },
  { postcode: '0078', place: 'Oslo', price: 500, zone: 'Zone 1' },
  { postcode: '0079', place: 'Oslo', price: 500, zone: 'Zone 1' },
  { postcode: '0080', place: 'Oslo', price: 500, zone: 'Zone 1' },
  { postcode: '0081', place: 'Oslo', price: 500, zone: 'Zone 1' },
  { postcode: '0082', place: 'Oslo', price: 500, zone: 'Zone 1' },
  { postcode: '0083', place: 'Oslo', price: 500, zone: 'Zone 1' },
  { postcode: '0084', place: 'Oslo', price: 500, zone: 'Zone 1' },
  { postcode: '0085', place: 'Oslo', price: 500, zone: 'Zone 1' },
  { postcode: '0086', place: 'Oslo', price: 500, zone: 'Zone 1' },
  { postcode: '0087', place: 'Oslo', price: 500, zone: 'Zone 1' },
  { postcode: '0088', place: 'Oslo', price: 500, zone: 'Zone 1' },
  { postcode: '0089', place: 'Oslo', price: 500, zone: 'Zone 1' },
  { postcode: '0090', place: 'Oslo', price: 500, zone: 'Zone 1' },
  { postcode: '0091', place: 'Oslo', price: 500, zone: 'Zone 1' },
  { postcode: '0092', place: 'Oslo', price: 500, zone: 'Zone 1' },
  { postcode: '0093', place: 'Oslo', price: 500, zone: 'Zone 1' },
  { postcode: '0094', place: 'Oslo', price: 500, zone: 'Zone 1' },
  { postcode: '0095', place: 'Oslo', price: 500, zone: 'Zone 1' },
  { postcode: '0096', place: 'Oslo', price: 500, zone: 'Zone 1' },
  { postcode: '0097', place: 'Oslo', price: 500, zone: 'Zone 1' },
  { postcode: '0098', place: 'Oslo', price: 500, zone: 'Zone 1' },
  { postcode: '0099', place: 'Oslo', price: 500, zone: 'Zone 1' },
  { postcode: '0100', place: 'Oslo', price: 500, zone: 'Zone 1' },
  { postcode: '0101', place: 'Oslo', price: 500, zone: 'Zone 1' },
  { postcode: '0102', place: 'Oslo', price: 500, zone: 'Zone 1' },
  { postcode: '0103', place: 'Oslo', price: 500, zone: 'Zone 1' },
  { postcode: '0104', place: 'Oslo', price: 500, zone: 'Zone 1' },
  { postcode: '0105', place: 'Oslo', price: 500, zone: 'Zone 1' },
  { postcode: '0106', place: 'Oslo', price: 500, zone: 'Zone 1' },
  { postcode: '0107', place: 'Oslo', price: 500, zone: 'Zone 1' },
  { postcode: '0108', place: 'Oslo', price: 500, zone: 'Zone 1' },
  { postcode: '0109', place: 'Oslo', price: 500, zone: 'Zone 1' },
  { postcode: '0110', place: 'Oslo', price: 500, zone: 'Zone 1' },
  { postcode: '0111', place: 'Oslo', price: 500, zone: 'Zone 1' },
  { postcode: '0112', place: 'Oslo', price: 500, zone: 'Zone 1' },
  { postcode: '0113', place: 'Oslo', price: 500, zone: 'Zone 1' },
  { postcode: '0114', place: 'Oslo', price: 500, zone: 'Zone 1' },
  { postcode: '0115', place: 'Oslo', price: 500, zone: 'Zone 1' },
  { postcode: '0116', place: 'Oslo', price: 500, zone: 'Zone 1' },
  { postcode: '0117', place: 'Oslo', price: 500, zone: 'Zone 1' },
  { postcode: '0118', place: 'Oslo', price: 500, zone: 'Zone 1' },
  { postcode: '0119', place: 'Oslo', price: 500, zone: 'Zone 1' },
  { postcode: '0120', place: 'Oslo', price: 500, zone: 'Zone 1' },
  { postcode: '0121', place: 'Oslo', price: 500, zone: 'Zone 1' },
  { postcode: '0122', place: 'Oslo', price: 500, zone: 'Zone 1' },
  { postcode: '0123', place: 'Oslo', price: 500, zone: 'Zone 1' },
  { postcode: '0124', place: 'Oslo', price: 500, zone: 'Zone 1' },
  { postcode: '0125', place: 'Oslo', price: 500, zone: 'Zone 1' },
  { postcode: '0126', place: 'Oslo', price: 500, zone: 'Zone 1' },
  { postcode: '0127', place: 'Oslo', price: 500, zone: 'Zone 1' },
  { postcode: '0128', place: 'Oslo', price: 500, zone: 'Zone 1' },
  { postcode: '0129', place: 'Oslo', price: 500, zone: 'Zone 1' },
  { postcode: '0130', place: 'Oslo', price: 500, zone: 'Zone 1' },
  { postcode: '0131', place: 'Oslo', price: 500, zone: 'Zone 1' },
  { postcode: '0132', place: 'Oslo', price: 500, zone: 'Zone 1' },
  { postcode: '0133', place: 'Oslo', price: 500, zone: 'Zone 1' },
  { postcode: '0134', place: 'Oslo', price: 500, zone: 'Zone 1' },
  { postcode: '0135', place: 'Oslo', price: 500, zone: 'Zone 1' },
  { postcode: '0136', place: 'Oslo', price: 500, zone: 'Zone 1' },
  { postcode: '0137', place: 'Oslo', price: 500, zone: 'Zone 1' },
  { postcode: '0138', place: 'Oslo', price: 500, zone: 'Zone 1' },
  { postcode: '0139', place: 'Oslo', price: 500, zone: 'Zone 1' },
  { postcode: '0140', place: 'Oslo', price: 500, zone: 'Zone 1' },
  { postcode: '0141', place: 'Oslo', price: 500, zone: 'Zone 1' },
  { postcode: '0142', place: 'Oslo', price: 500, zone: 'Zone 1' },
  { postcode: '0143', place: 'Oslo', price: 500, zone: 'Zone 1' },
  { postcode: '0144', place: 'Oslo', price: 500, zone: 'Zone 1' },
  { postcode: '0145', place: 'Oslo', price: 500, zone: 'Zone 1' },
  { postcode: '0146', place: 'Oslo', price: 500, zone: 'Zone 1' },
  { postcode: '0147', place: 'Oslo', price: 500, zone: 'Zone 1' },
  { postcode: '0148', place: 'Oslo', price: 500, zone: 'Zone 1' },
  { postcode: '0149', place: 'Oslo', price: 500, zone: 'Zone 1' },
  { postcode: '0150', place: 'Oslo', price: 500, zone: 'Zone 1' },
  { postcode: '0151', place: 'Oslo', price: 500, zone: 'Zone 1' },
  { postcode: '0152', place: 'Oslo', price: 500, zone: 'Zone 1' },
  { postcode: '0153', place: 'Oslo', price: 500, zone: 'Zone 1' },
  { postcode: '0154', place: 'Oslo', price: 500, zone: 'Zone 1' },
  { postcode: '0155', place: 'Oslo', price: 500, zone: 'Zone 1' },
  { postcode: '0156', place: 'Oslo', price: 500, zone: 'Zone 1' },
  { postcode: '0157', place: 'Oslo', price: 500, zone: 'Zone 1' },
  { postcode: '0158', place: 'Oslo', price: 500, zone: 'Zone 1' },
  { postcode: '0159', place: 'Oslo', price: 500, zone: 'Zone 1' },
  { postcode: '0160', place: 'Oslo', price: 500, zone: 'Zone 1' },
  { postcode: '0161', place: 'Oslo', price: 500, zone: 'Zone 1' },
  { postcode: '0162', place: 'Oslo', price: 500, zone: 'Zone 1' },
  { postcode: '0163', place: 'Oslo', price: 500, zone: 'Zone 1' },
  { postcode: '0164', place: 'Oslo', price: 500, zone: 'Zone 1' },
  { postcode: '0165', place: 'Oslo', price: 500, zone: 'Zone 1' },
  { postcode: '0166', place: 'Oslo', price: 500, zone: 'Zone 1' },
  { postcode: '0167', place: 'Oslo', price: 500, zone: 'Zone 1' },
  { postcode: '0168', place: 'Oslo', price: 500, zone: 'Zone 1' },
  { postcode: '0169', place: 'Oslo', price: 500, zone: 'Zone 1' },
  { postcode: '0170', place: 'Oslo', price: 500, zone: 'Zone 1' },
  { postcode: '0171', place: 'Oslo', price: 500, zone: 'Zone 1' },
  { postcode: '0172', place: 'Oslo', price: 500, zone: 'Zone 1' },
  { postcode: '0173', place: 'Oslo', price: 500, zone: 'Zone 1' },
  { postcode: '0174', place: 'Oslo', price: 500, zone: 'Zone 1' },
  { postcode: '0175', place: 'Oslo', price: 500, zone: 'Zone 1' },
  { postcode: '0176', place: 'Oslo', price: 500, zone: 'Zone 1' },
  { postcode: '0177', place: 'Oslo', price: 500, zone: 'Zone 1' },
  { postcode: '0178', place: 'Oslo', price: 500, zone: 'Zone 1' },
  { postcode: '0179', place: 'Oslo', price: 500, zone: 'Zone 1' },
  { postcode: '0180', place: 'Oslo', price: 500, zone: 'Zone 1' },
  { postcode: '0181', place: 'Oslo', price: 500, zone: 'Zone 1' },
  { postcode: '0182', place: 'Oslo', price: 500, zone: 'Zone 1' },
  { postcode: '0183', place: 'Oslo', price: 500, zone: 'Zone 1' },
  { postcode: '0184', place: 'Oslo', price: 500, zone: 'Zone 1' },
  { postcode: '0185', place: 'Oslo', price: 500, zone: 'Zone 1' },
  { postcode: '0186', place: 'Oslo', price: 500, zone: 'Zone 1' },
  { postcode: '0187', place: 'Oslo', price: 500, zone: 'Zone 1' },
  { postcode: '0188', place: 'Oslo', price: 500, zone: 'Zone 1' },
  { postcode: '0189', place: 'Oslo', price: 500, zone: 'Zone 1' },
  { postcode: '0190', place: 'Oslo', price: 500, zone: 'Zone 1' },
  { postcode: '0191', place: 'Oslo', price: 500, zone: 'Zone 1' },
  { postcode: '0192', place: 'Oslo', price: 500, zone: 'Zone 1' },
  { postcode: '0193', place: 'Oslo', price: 500, zone: 'Zone 1' },
  { postcode: '0194', place: 'Oslo', price: 500, zone: 'Zone 1' },
  { postcode: '0195', place: 'Oslo', price: 500, zone: 'Zone 1' },
  { postcode: '0196', place: 'Oslo', price: 500, zone: 'Zone 1' },
  { postcode: '0197', place: 'Oslo', price: 500, zone: 'Zone 1' },
  { postcode: '0198', place: 'Oslo', price: 500, zone: 'Zone 1' },
  { postcode: '0199', place: 'Oslo', price: 500, zone: 'Zone 1' },
  
  // Other cities
  { postcode: '1475', place: 'Lørenskog', price: 709, zone: 'Zone 2' },
  { postcode: '5000', place: 'Bergen', price: 850, zone: 'Zone 3' },
  { postcode: '4000', place: 'Stavanger', price: 920, zone: 'Zone 4' },
  { postcode: '7000', place: 'Trondheim', price: 1100, zone: 'Zone 5' },
  { postcode: '9000', place: 'Tromsø', price: 1500, zone: 'Zone 6' }
];

// Services from Excel file - ALL UNIQUE SERVICES WITH DESCRIPTIONS
export const services: Service[] = [
  {
    "id": "HOME_DELIVERY_DOUBLE_INDOOR_(SITE)_LEVERING_TIL_ANVIST_PLASS",
    "name": "Home delivery double indoor (SITE)",
    "description": "Levering til anvist plass",
    "category": "Frakt",
    "prices": {
      "dag": 445.07,
      "kveld": 492.7,
      "helg": 504.61
    },
    "basePrice": 445.07
  },
  {
    "id": "HOME_DELIVERY_DOUBLE_INDOOR/CARRY_SERVICE_OVERSIZE_(SITES)_LEVERING_TIL_ANVIST_PLASS_-_SBS",
    "name": "Home delivery double indoor/Carry service oversize (SITES)",
    "description": "Levering til anvist plass - SBS",
    "category": "Frakt",
    "prices": {
      "dag": 1151.12,
      "kveld": 1198.75,
      "helg": 1210.66
    },
    "basePrice": 1151.12
  },
  {
    "id": "HOME_DELIVERY_CURBSIDE_(CURBSIDE)_LEVERING_TIL_TRAPP",
    "name": "Home delivery curbside (CURBSIDE)",
    "description": "Levering til trapp",
    "category": "Frakt",
    "prices": {
      "dag": 256.89,
      "kveld": 305.23,
      "helg": 317.31
    },
    "basePrice": 256.89
  },
  {
    "id": "HOME_DELIVERY_CURBSIDE/CARRY_SERVICE_OVERSIZE_(CURBS)_LEVERING_TIL_TRAPP_-_SBS",
    "name": "Home delivery curbside/Carry service oversize (CURBS)",
    "description": "Levering til trapp - SBS",
    "category": "Frakt",
    "prices": {
      "dag": 510.57,
      "kveld": 558.91,
      "helg": 570.99
    },
    "basePrice": 510.57
  },
  {
    "id": "RETURN_INDOOR_LEVERING_TIL_PLASS_OG_HENTING_AV_RETUR_TIL_BUTIKK",
    "name": "Return Indoor",
    "description": "Levering til plass og henting av retur til butikk",
    "category": "Frakt",
    "prices": {
      "dag": 607.43,
      "kveld": 655.06,
      "helg": 666.97
    },
    "basePrice": 607.43
  },
  {
    "id": "EXTRAKOLLI_(INKLUDERT_I_FRAKTPRISER)_EKSTRAKOLLI_(INKLUDERT_I_PRISENE_OVER)",
    "name": "Extrakolli (inkludert I fraktpriser)",
    "description": "ekstrakolli (inkludert i prisene over)",
    "category": "Frakt",
    "prices": {
      "dag": 66.73,
      "kveld": 66.73,
      "helg": 66.73
    },
    "basePrice": 66.73
  },
  {
    "id": "DROP_IN_STORE_INTERNKJØRING_TIL_BUTIKK_I_STOR_OSLO",
    "name": "Drop in store",
    "description": "Internkjøring til butikk i Stor Oslo",
    "category": "Frakt",
    "prices": {
      "dag": 471.24,
      "kveld": 471.24,
      "helg": 471.24
    },
    "basePrice": 471.24
  },
  {
    "id": "DROP_IN_STORE_INTERNKJØRING_TIL_BUTIKK_UTENFOR_STOR_OSLO",
    "name": "Drop in store",
    "description": "Internkjøring til butikk utenfor Stor Oslo",
    "category": "Frakt",
    "prices": {
      "dag": 749.7,
      "kveld": 749.7,
      "helg": 749.7
    },
    "basePrice": 749.7
  },
  {
    "id": "PICKUP_FROM_STORE_INTERNKJØRING_FRA_BUTIKK_I_STOR_OSLO",
    "name": "Pickup from store",
    "description": "Internkjøring fra butikk i Stor Oslo",
    "category": "Frakt",
    "prices": {
      "dag": 510.07,
      "kveld": 510.07,
      "helg": 510.07
    },
    "basePrice": 510.07
  },
  {
    "id": "PICKUP_FROM_STORE_INTERNKJØRING_FRA_BUTIKK_UTENFOR_STOR_OSLO",
    "name": "Pickup from store",
    "description": "Internkjøring fra butikk utenfor Stor Oslo",
    "category": "Frakt",
    "prices": {
      "dag": 811.48,
      "kveld": 811.48,
      "helg": 811.48
    },
    "basePrice": 811.48
  },
  {
    "id": "SERVICE_ONLY_SERVICE_HOS_KUNDEN",
    "name": "Service only",
    "description": "Service hos kunden",
    "category": "Frakt",
    "prices": {
      "dag": 445.07,
      "kveld": 445.07,
      "helg": 445.07
    },
    "basePrice": 445.07
  },
  {
    "id": "DELIVERYEXPRESS_BUDOPPDRAG_LEVERT_TIL_ANVIST_PLASS",
    "name": "Deliveryexpress",
    "description": "Budoppdrag levert til anvist plass",
    "category": "Frakt",
    "prices": {
      "dag": 575.47,
      "kveld": 575.47,
      "helg": 575.47
    },
    "basePrice": 575.47
  },
  {
    "id": "REBOOKING_BOMTUR",
    "name": "Rebooking",
    "description": "Bomtur",
    "category": "Frakt",
    "prices": {
      "dag": 208.13,
      "kveld": 208.13,
      "helg": 208.13
    },
    "basePrice": 208.13
  },
  {
    "id": "RECYCLING_(RETGREEN)_MILJØRETUR",
    "name": "Recycling (RETGREEN)",
    "description": "Miljøretur",
    "category": "Servicekoder",
    "prices": {
      "dag": 54.12,
      "kveld": null,
      "helg": null
    },
    "basePrice": 54.12
  },
  {
    "id": "RECYCLING_SBS_(RETGREENS)_MILJØRETUR_SBS",
    "name": "Recycling SBS (RETGREENS)",
    "description": "Miljøretur SBS",
    "category": "Servicekoder",
    "prices": {
      "dag": 292.95,
      "kveld": null,
      "helg": null
    },
    "basePrice": 292.95
  },
  {
    "id": "RETURN_OF_PACKAGING_–_UNWRAPPING_(DEVUN)_UTPAKKING_(INKLUDERT_I_INSTALLASJONSPRIS)",
    "name": "Return of packaging – unwrapping (DEVUN)",
    "description": "Utpakking (inkludert I installasjonspris)",
    "category": "Servicekoder",
    "prices": {
      "dag": 29.77,
      "kveld": null,
      "helg": null
    },
    "basePrice": 29.77
  },
  {
    "id": "INSTALLATION_WASH_(IWASH)_INSTALLASJON_AV_VASKEMASKIN_PÅ_VÅTROM",
    "name": "Installation wash (IWASH)",
    "description": "Installasjon av vaskemaskin på våtrom",
    "category": "Servicekoder",
    "prices": {
      "dag": 162.36,
      "kveld": null,
      "helg": null
    },
    "basePrice": 162.36
  },
  {
    "id": "INSTALLATION_DRYER_(IDRY)_INSTALLASJON_AV_TØRK",
    "name": "Installation dryer (IDRY)",
    "description": "Installasjon av tørk",
    "category": "Servicekoder",
    "prices": {
      "dag": 162.36,
      "kveld": null,
      "helg": null
    },
    "basePrice": 162.36
  },
  {
    "id": "INSTALLATION_STOVE_(ICOO)_INSTALLASJON_AV_KOMFYR",
    "name": "Installation stove (ICOO)",
    "description": "Installasjon av komfyr",
    "category": "Servicekoder",
    "prices": {
      "dag": 162.36,
      "kveld": null,
      "helg": null
    },
    "basePrice": 162.36
  },
  {
    "id": "INSTALLATION_FRIDGE_(IFRID)_INSTALLASJON_AV_KJØL/FRYS/KOMBISKAP",
    "name": "Installation fridge (IFRID)",
    "description": "Installasjon av kjøl/frys/kombiskap",
    "category": "Servicekoder",
    "prices": {
      "dag": 162.36,
      "kveld": 0,
      "helg": 0
    },
    "basePrice": 162.36
  },
  {
    "id": "INSTALLATION_SBS_(INSTALLSBSNP)_INSTALLATION_AV_SBS,_INGEN_VANNTILKOBLING",
    "name": "Installation SBS (INSTALLSBSNP)",
    "description": "Installation av SBS, INGEN vanntilkobling",
    "category": "Servicekoder",
    "prices": {
      "dag": 162.36,
      "kveld": 0,
      "helg": 0
    },
    "basePrice": 162.36
  },
  {
    "id": "INSTALLATION_STACKING_KIT_(INSTALLSTACKINGKIT)_INSTALLASJON_AV_STABLERAMME",
    "name": "Installation stacking kit (INSTALLSTACKINGKIT)",
    "description": "Installasjon av stableramme",
    "category": "Servicekoder",
    "prices": {
      "dag": 162.36,
      "kveld": 0,
      "helg": 0
    },
    "basePrice": 162.36
  },
  {
    "id": "INSTALLATION_TOWER_(INSTALLTOWER)_INSTALLATION_AV_LG_VASK_OG_TØRK_I_ETT",
    "name": "Installation tower (INSTALLTOWER)",
    "description": "Installation av LG vask og tørk i ett",
    "category": "Servicekoder",
    "prices": {
      "dag": 162.36,
      "kveld": 0,
      "helg": 0
    },
    "basePrice": 162.36
  },
  {
    "id": "INSTALLATION_DRYER_EASY_(INSTALLDRYEREASY)_SETTE_TILBAKE_TØRK_ETTER_MONTERING_AV_VASKEMASKIN",
    "name": "Installation dryer easy (INSTALLDRYEREASY)",
    "description": "Sette tilbake tørk etter montering av vaskemaskin",
    "category": "Servicekoder",
    "prices": {
      "dag": 108.24,
      "kveld": 0,
      "helg": 0
    },
    "basePrice": 108.24
  },
  {
    "id": "INSTALLATION_BBQ_(IBBQ)_INSTALLASJON_AV_GRILL",
    "name": "Installation bbq (IBBQ)",
    "description": "Installasjon av grill",
    "category": "Servicekoder",
    "prices": {
      "dag": 966.04,
      "kveld": 0,
      "helg": 0
    },
    "basePrice": 966.04
  },
  {
    "id": "INSTALLATION_BUILT_IN_FRIDGE_(IFRDI)_INSTALLASJON_AV_INTEGRERT_SKAP",
    "name": "Installation built in fridge (IFRDI)",
    "description": "Installasjon av integrert skap",
    "category": "Servicekoder",
    "prices": {
      "dag": 966.04,
      "kveld": 0,
      "helg": 0
    },
    "basePrice": 966.04
  },
  {
    "id": "INSTALLATION_DISH_(IDISH)_INSTALLASJON_AV_OPPVASK",
    "name": "Installation dish (IDISH)",
    "description": "Installasjon av oppvask",
    "category": "Servicekoder",
    "prices": {
      "dag": 966.04,
      "kveld": null,
      "helg": null
    },
    "basePrice": 966.04
  },
  {
    "id": "INSTALLATION_DISH_INT_(IDISI)_INSTALLASJON_AV_INTEGRERT_OPPVASK",
    "name": "Installation dish int (IDISI)",
    "description": "Installasjon av integrert oppvask",
    "category": "Servicekoder",
    "prices": {
      "dag": 966.04,
      "kveld": null,
      "helg": null
    },
    "basePrice": 966.04
  },
  {
    "id": "INSTALLATION_DRYER_CABINET_(IDRYCA)_INSTALLASJON_AV_TØRKESKAP_UTAN_TILKOBLING_AV_LUFTSLANGE",
    "name": "Installation dryer cabinet (IDRYCA)",
    "description": "Installasjon av tørkeskap utan tilkobling av luftslange",
    "category": "Servicekoder",
    "prices": {
      "dag": 541.2,
      "kveld": null,
      "helg": null
    },
    "basePrice": 541.2
  },
  {
    "id": "INSTALLATION_DRYER_CABINET_(IDRYCAA)_INSTALLASJON_AV_TØRKESKAP_MED_TILKOBLING_AV_LUFTSLANGE",
    "name": "Installation dryer cabinet (IDRYCAA)",
    "description": "Installasjon av tørkeskap med tilkobling av luftslange",
    "category": "Servicekoder",
    "prices": {
      "dag": 920.04,
      "kveld": null,
      "helg": null
    },
    "basePrice": 920.04
  },
  {
    "id": "INSTALLATION_WASH_TJENESTEBIL_(IWASP)_INSTALLASJON_AV_VASKEMASKIN_PÅ_IKKE_GODKJENT_VÅTROM",
    "name": "Installation wash tjenestebil (IWASP)",
    "description": "Installasjon av vaskemaskin på ikke godkjent våtrom",
    "category": "Servicekoder",
    "prices": {
      "dag": 966.04,
      "kveld": null,
      "helg": null
    },
    "basePrice": 966.04
  },
  {
    "id": "INSTALLATION_ELECTRIC_OVEN_(IOVEN)_INSTALLASJON_AV_INNBYGD_OVEN",
    "name": "Installation electric oven (IOVEN)",
    "description": "Installasjon av innbygd oven",
    "category": "Servicekoder",
    "prices": {
      "dag": 568.26,
      "kveld": null,
      "helg": null
    },
    "basePrice": 568.26
  },
  {
    "id": "INSTALLATION_HOB_(IHOB)_INSTALLASJON_AV_PLATETOPP",
    "name": "Installation HOB (IHOB)",
    "description": "Installasjon av platetopp",
    "category": "Servicekoder",
    "prices": {
      "dag": 568.26,
      "kveld": null,
      "helg": null
    },
    "basePrice": 568.26
  },
  {
    "id": "INSTALLATION_FAN_S(IHOOS)_INSTALLASJON_AV_VENTILATOR_-_LITEN",
    "name": "Installation fan S(IHOOS)",
    "description": "Installasjon av ventilator - liten",
    "category": "Servicekoder",
    "prices": {
      "dag": 966.04,
      "kveld": null,
      "helg": null
    },
    "basePrice": 966.04
  },
  {
    "id": "INSTALLATION_FAN_M(IHOOM)_INSTALLASJON_AV_VENTILATOR_-_MEDIUM",
    "name": "Installation fan M(IHOOM)",
    "description": "Installasjon av ventilator - medium",
    "category": "Servicekoder",
    "prices": {
      "dag": 1818.43,
      "kveld": null,
      "helg": null
    },
    "basePrice": 1818.43
  },
  {
    "id": "INSTALLATION_FAN_L(IHOOL)_INSTALLASJON_AV_VENTILATOR_-_STOR",
    "name": "Installation fan L(IHOOL)",
    "description": "Installasjon av ventilator - stor",
    "category": "Servicekoder",
    "prices": {
      "dag": 2159.39,
      "kveld": null,
      "helg": null
    },
    "basePrice": 2159.39
  },
  {
    "id": "INSTALLATION_MICRO_(IMIC)_INSTALLASJON_AV_INTEGRERT_MIKROBØLGEOVN",
    "name": "Installation micro (IMIC)",
    "description": "Installasjon av integrert mikrobølgeovn",
    "category": "Servicekoder",
    "prices": {
      "dag": 966.04,
      "kveld": 0,
      "helg": 0
    },
    "basePrice": 966.04
  },
  {
    "id": "INSTALLATION_SBS_WATER_(ISBS)_VANNTILKOBLING_AV_SBS",
    "name": "Installation SBS water (ISBS)",
    "description": "Vanntilkobling av SBS",
    "category": "Servicekoder",
    "prices": {
      "dag": 1363.82,
      "kveld": 0,
      "helg": 0
    },
    "basePrice": 1363.82
  },
  {
    "id": "INSTALLATION_TURN_DOOR_HOME_(TURNH)_OMHENGSLING_AV_SKAP_HOS_KUNDEN",
    "name": "Installation turn door home (TURNH)",
    "description": "Omhengsling av skap hos kunden",
    "category": "Servicekoder",
    "prices": {
      "dag": 738.74,
      "kveld": 0,
      "helg": 0
    },
    "basePrice": 738.74
  },
  {
    "id": "INSTALLATION_TURN_DOOR_HUB_(TURNU)_OMHENGSLING_AV_SKAP_PÅ_HUB_FØR_UKJØRING",
    "name": "Installation turn door hub (TURNU)",
    "description": "Omhengsling av skap på hub før ukjøring",
    "category": "Servicekoder",
    "prices": {
      "dag": 262.5,
      "kveld": 0,
      "helg": 0
    },
    "basePrice": 262.5
  },
  {
    "id": "INSTALLATION_TV_ON_WALL_XL_(ITVWXL)_MONTERING_AV_TV_PÅ_VEGG_(OVER_70’’)",
    "name": "Installation TV on wall XL (ITVWXL)",
    "description": "Montering av tv på vegg (over 70’’)",
    "category": "Servicekoder",
    "prices": {
      "dag": 1363.82,
      "kveld": 0,
      "helg": 0
    },
    "basePrice": 1363.82
  },
  {
    "id": "DELCARRYIN_INNBÆRING_ØNSKET_AV_KUNDE",
    "name": "Delcarryin",
    "description": "Innbæring ønsket av kunde",
    "category": "Servicekoder",
    "prices": {
      "dag": 188,
      "kveld": 0,
      "helg": 0
    },
    "basePrice": 188
  },
  {
    "id": "EXTRA_TIME_HVER_20_MIN_I_TILLEGG_TIL_DE_FØRSTE_20_MIN_(40_MIN_FOR_HVER_AVANSERTETJENESTE),_MÅ_BEGRUNNES_PÅ_GORAN-APP",
    "name": "Extra time",
    "description": "Hver 20 min I tillegg til de første 20 min (40 min for hver\r\navansertetjeneste), må begrunnes på Goran-app",
    "category": "Servicekoder",
    "prices": {
      "dag": 300,
      "kveld": 0,
      "helg": 0
    },
    "basePrice": 300
  }
];

// Helper functions
export const searchPostcodes = (query: string): PostcodeData[] => {
  const searchTerm = query.toLowerCase();
  return postcodeData.filter(data => 
    data.postcode.toLowerCase().includes(searchTerm) ||
    data.place.toLowerCase().includes(searchTerm)
  );
};

export const getPostcodeByCode = (code: string): PostcodeData | undefined => {
  return postcodeData.find(data => data.postcode === code);
};

export const getServicesByCategory = (category: string): Service[] => {
  return services.filter(service => service.category === category);
};

export const getServiceById = (id: string): Service | undefined => {
  return services.find(service => service.id === id);
};

export const getCategories = (): string[] => {
  return [...new Set(services.map(service => service.category))];
};
