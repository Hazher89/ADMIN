import { NextRequest, NextResponse } from 'next/server';
import { getFirebaseAuth, getFirebaseDb, isFirebaseAvailable } from '@/lib/firebase-admin';
import { collection, getDocs, query, where, updateDoc, doc } from 'firebase/firestore';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { v4 as uuidv4 } from 'uuid';

/**
 * Migration endpoint to create Firebase Auth users for employees without UID
 * GET /api/migrate-employees-to-auth?companyId=xxx
 */
export async function GET(request: NextRequest) {
  try {
    const auth = getFirebaseAuth();
    const db = getFirebaseDb();
    
    if (!isFirebaseAvailable() || !auth || !db) {
      return NextResponse.json(
        { error: 'Firebase is not configured.' },
        { status: 500 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const companyId = searchParams.get('companyId');

    if (!companyId) {
      return NextResponse.json(
        { error: '' },
        { status: 400 }
      );
    }

    // Find all users without uid
    const usersQuery = query(
      collection(db, 'users'),
      where('companyId', '==', companyId)
    );
    
    const usersSnapshot = await getDocs(usersQuery);
    const users = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    const usersWithoutUid = users.filter(user => !user.uid);
    
    console.log(`Found ${usersWithoutUid.length} users without Firebase Auth UID`);

    const results = {
      total: usersWithoutUid.length,
      created: 0,
      failed: 0,
      errors: [] as string[]
    };

    for (const user of usersWithoutUid) {
      try {
        // Generate temporary password
        const tempPassword = uuidv4();
        
        // Create Firebase Auth user
        const userCredential = await createUserWithEmailAndPassword(auth, user.email, tempPassword);
        const firebaseUid = userCredential.user.uid;
        
        // Update Firestore document with UID
        await updateDoc(doc(db, 'users', user.id), {
          uid: firebaseUid,
          id: firebaseUid,
          updatedAt: new Date().toISOString()
        });
        
        results.created++;
        console.log(`✅ Created Auth user for ${user.email} (${firebaseUid})`);
      } catch (error: any) {
        results.failed++;
        const errorMsg = `${user.email}: ${error.message || 'Unknown error'}`;
        results.errors.push(errorMsg);
        console.error(`❌ Failed to create Auth user for ${user.email}:`, error);
        
        // If user already exists in Auth, try to find their UID
        if (error.code === 'auth/email-already-in-use') {
          console.log(`⚠️ User ${user.email} already exists in Firebase Auth - skipping`);
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `Migration complete: ${results.created} created, ${results.failed} failed`,
      results
    });
  } catch (error) {
    console.error('Migration error:', error);
    return NextResponse.json(
      { 
        error: 'Migration failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

