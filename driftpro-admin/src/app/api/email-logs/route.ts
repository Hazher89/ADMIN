import { NextResponse } from 'next/server';
import { getFirestore, collection, query, orderBy, limit, getDocs } from 'firebase/firestore';

export const dynamic = 'force-dynamic';

/**
 * Get Firebase database instance with fallback
 */
function getDb() {
  try {
    const { getFirestore } = require('firebase/firestore');
    return getFirestore();
  } catch (error) {
    console.error('Error getting Firestore instance:', error);
    return null;
  }
}

export async function GET() {
  try {
    const firestoreDb = getDb();
    if (!firestoreDb) {
      return NextResponse.json({ error: 'Database not available' }, { status: 500 });
    }

    const logsQuery = query(
      collection(firestoreDb, 'emailLogs'),
      orderBy('sentAt', 'desc'),
      limit(100)
    );

    const logsSnapshot = await getDocs(logsQuery);
    const logs = logsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return NextResponse.json(logs);
  } catch (error) {
    console.error('Error getting email logs:', error);
    return NextResponse.json({ error: 'Failed to get email logs' }, { status: 500 });
  }
} 