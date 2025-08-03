import { NextRequest, NextResponse } from 'next/server';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, where, getFirestore } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { adminEmailService } from '@/lib/admin-email-service';

/**
 * Get Firebase database instance with fallback
 */
function getDb() {
  if (db) {
    return db;
  }
  
  // Try to get Firestore directly if db is not available
  try {
    const { getApps, initializeApp } = require('firebase/app');
    const apps = getApps();
    
    if (apps.length === 0) {
      // Initialize Firebase if not already done
      const firebaseConfig = {
        apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
        authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
        messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
        appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
      };
      initializeApp(firebaseConfig);
    }
    
    return getFirestore();
  } catch (error) {
    console.error('Error getting Firestore instance:', error);
    throw new Error('Firebase database not available. Please check Firebase configuration.');
  }
}

// GET /api/admins - Get all admins for a company
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId');

    if (!companyId) {
      return NextResponse.json({ error: 'Company ID is required' }, { status: 400 });
    }

    const firestoreDb = getDb();

    // Get admins from Firebase
    const adminsQuery = query(
      collection(firestoreDb, 'users'), 
      where('companyId', '==', companyId),
      where('role', 'in', ['admin', 'super_admin'])
    );
    
    const snapshot = await getDocs(adminsQuery);
    const admins = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return NextResponse.json(admins);
  } catch (error) {
    console.error('Error fetching admins:', error);
    return NextResponse.json(
      { error: `Failed to fetch admins: ${error instanceof Error ? error.message : 'Unknown error'}` }, 
      { status: 500 }
    );
  }
}

// POST /api/admins - Add a new admin
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, name, role, companyId, permissions, companyName } = body;

    if (!email || !name || !role || !companyId) {
      return NextResponse.json(
        { error: 'Email, name, role, and companyId are required' }, 
        { status: 400 }
      );
    }

    const firestoreDb = getDb();

    // Check if user already exists with this email
    const existingUserQuery = query(
      collection(firestoreDb, 'users'), 
      where('email', '==', email.toLowerCase().trim())
    );
    const existingUserSnapshot = await getDocs(existingUserQuery);

    if (!existingUserSnapshot.empty) {
      // Check if user is already an admin for this company
      const existingUser = existingUserSnapshot.docs[0];
      const userData = existingUser.data();
      
      if (userData.companyId === companyId && (userData.role === 'admin' || userData.role === 'super_admin')) {
        return NextResponse.json(
          { error: 'Bruker er allerede admin for denne bedriften' }, 
          { status: 409 }
        );
      }

      // Update existing user to admin for this company
      await updateDoc(doc(firestoreDb, 'users', existingUser.id), {
        role: role,
        companyId: companyId,
        companyName: companyName || '',
        updatedAt: new Date().toISOString(),
        permissions: permissions || []
      });

      const updatedUser = {
        id: existingUser.id,
        ...userData,
        role: role,
        companyId: companyId,
        companyName: companyName || '',
        updatedAt: new Date().toISOString(),
        permissions: permissions || []
      };

      // Send welcome email to existing user
      try {
        await adminEmailService.sendPasswordSetupEmail(
          email,
          name,
          companyName || 'DriftPro',
          await adminEmailService.createSetupToken(email, name, companyName || 'DriftPro', companyId)
        );
      } catch (emailError) {
        console.error('Error sending welcome email:', emailError);
        // Don't fail the request if email fails
      }

      return NextResponse.json(updatedUser);
    } else {
      // Create new admin user
      const newAdmin = {
        email: email.toLowerCase().trim(),
        displayName: name,
        role: role,
        companyId: companyId,
        companyName: companyName || '',
        permissions: permissions || [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: 'pending' // Will be set to 'active' after password setup
      };

      const docRef = await addDoc(collection(firestoreDb, 'users'), newAdmin);
      
      const createdAdmin = {
        id: docRef.id,
        ...newAdmin
      };

      // Send password setup email to new admin
      try {
        const setupToken = await adminEmailService.createSetupToken(
          email,
          name,
          companyName || 'DriftPro',
          companyId
        );
        
        await adminEmailService.sendPasswordSetupEmail(
          email,
          name,
          companyName || 'DriftPro',
          setupToken
        );
      } catch (emailError) {
        console.error('Error sending password setup email:', emailError);
        // Don't fail the request if email fails, but log it
      }

      return NextResponse.json(createdAdmin, { status: 201 });
    }
  } catch (error) {
    console.error('Error adding admin:', error);
    return NextResponse.json(
      { error: `Failed to add admin: ${error instanceof Error ? error.message : 'Unknown error'}` }, 
      { status: 500 }
    );
  }
}

// PATCH /api/admins/[id] - Update admin
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { role, permissions, name } = body;

    const firestoreDb = getDb();

    const updates: any = {
      updatedAt: new Date().toISOString()
    };

    if (role) updates.role = role;
    if (permissions) updates.permissions = permissions;
    if (name) updates.displayName = name;

    await updateDoc(doc(firestoreDb, 'users', params.id), updates);

    // Get updated user
    const userDoc = await getDocs(query(collection(firestoreDb, 'users'), where('__name__', '==', params.id)));
    const updatedUser = {
      id: params.id,
      ...userDoc.docs[0]?.data()
    };

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error('Error updating admin:', error);
    return NextResponse.json(
      { error: `Failed to update admin: ${error instanceof Error ? error.message : 'Unknown error'}` }, 
      { status: 500 }
    );
  }
}

// DELETE /api/admins/[id] - Remove admin
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const firestoreDb = getDb();

    await deleteDoc(doc(firestoreDb, 'users', params.id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error removing admin:', error);
    return NextResponse.json(
      { error: `Failed to remove admin: ${error instanceof Error ? error.message : 'Unknown error'}` }, 
      { status: 500 }
    );
  }
} 