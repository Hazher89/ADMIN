// seedFirestore.js
const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

// Sett opp Firebase Admin SDK med riktig prosjekt-ID
initializeApp({
  projectId: 'driftpro-40ccd',
  // For testing, bruk service account key eller application default credentials
  credential: cert({
    projectId: 'driftpro-40ccd',
    clientEmail: 'firebase-adminsdk-xxxxx@driftpro-40ccd.iam.gserviceaccount.com',
    privateKey: '-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n'
  })
});
const db = getFirestore();

// Eksempeldata
const data = {
  departments: [
    { id: 'dep1', name: 'Produksjon', companyId: 'company1' },
    { id: 'dep2', name: 'HR', companyId: 'company1' },
  ],
  absence: [
    { id: 'abs1', userId: 'user1', type: 'sykefravær', from: '2024-07-01', to: '2024-07-03', reason: 'Sykdom', status: 'registrert' },
  ],
  vacations: [
    { id: 'vac1', userId: 'user1', from: '2024-07-10', to: '2024-07-20', status: 'godkjent' },
  ],
  users: [
    { id: 'user1', firstName: 'Ola', lastName: 'Nordmann', email: 'ola@firma.no', role: 'ansatt', departmentId: 'dep1', companyId: 'company1' },
  ],
  companies: [
    { id: 'company1', name: 'DriftPro AS', domain: 'driftpro.no' },
  ],
  deviations: [
    { id: 'dev1', title: 'Avvik på maskin', description: 'Maskin stoppet uventet', category: 'Teknisk', severity: 'high', status: 'reported', reportedBy: 'Ola Nordmann', createdAt: new Date('2024-07-01T10:00:00Z'), companyId: 'company1' },
  ],
  shiftplans: [
    { id: 'shift1', userId: 'user1', date: '2024-07-15', shift: 'Dag', companyId: 'company1' },
  ],
  chats: [
    { id: 'chat1', name: 'Generell chat', companyId: 'company1', createdAt: new Date('2024-07-01T12:00:00Z') },
  ],
};

async function seed() {
  for (const [collection, docs] of Object.entries(data)) {
    for (const doc of docs) {
      await db.collection(collection).doc(doc.id).set(doc);
      console.log(`Added to ${collection}: ${doc.id}`);
    }
  }
  console.log('Seeding complete!');
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seeding failed:', err);
  process.exit(1);
});