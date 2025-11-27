import { NextRequest, NextResponse } from 'next/server';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, query, where, getDocs, deleteDoc, doc, getDoc } from 'firebase/firestore';
import { getAuth, deleteUser } from 'firebase/auth';
import * as admin from 'firebase-admin';

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyCyE4S4B5q2JLdtaTtr8kVVvg8y-3Zm7ZE",
  authDomain: "driftpro-40ccd.firebaseapp.com",
  projectId: "driftpro-40ccd",
  storageBucket: "driftpro-40ccd.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef123456"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// Initialize Firebase Admin SDK if not already initialized
let adminApp: admin.app.App | null = null;
try {
  if (admin.apps.length === 0) {
    // Try to initialize with service account or use default credentials
    try {
      adminApp = admin.initializeApp({
        credential: admin.credential.applicationDefault(),
        projectId: firebaseConfig.projectId,
      });
      console.log('Firebase Admin SDK initialized successfully');
    } catch (adminError) {
      console.log('Firebase Admin SDK initialization failed (may need service account key):', adminError);
      // Will fall back to client SDK only
    }
  } else {
    adminApp = admin.apps[0] as admin.app.App;
  }
} catch (error) {
  console.log('Firebase Admin SDK not available:', error);
}

// POST /api/cleanup-firebase - Clean up Firebase data
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, email, userId, companyId } = body;

    if (!action) {
      return NextResponse.json(
        { error: 'Action is required' },
        { status: 400 }
      );
    }

    console.log('🧹 Firebase cleanup action:', action);

    switch (action) {
      case 'cleanup_orphaned_auth_users':
        return await cleanupOrphanedAuthUsers();
      
      case 'cleanup_orphaned_firestore_users':
        return await cleanupOrphanedFirestoreUsers();
      
      case 'cleanup_expired_tokens':
        return await cleanupExpiredTokens();
      
      case 'delete_user_completely':
        if (!email && !userId) {
          return NextResponse.json(
            { error: 'Email or userId is required for complete user deletion' },
            { status: 400 }
          );
        }
        return await deleteUserCompletely(email, userId);
      
      case 'cleanup_company_data':
        if (!companyId) {
          return NextResponse.json(
            { error: 'CompanyId is required for company cleanup' },
            { status: 400 }
          );
        }
        return await cleanupCompanyData(companyId);
      
      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('❌ Error in cleanup API:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Clean up orphaned Firebase Auth users (users without Firestore profiles)
async function cleanupOrphanedAuthUsers() {
  try {
    console.log('🔍 Finding orphaned Firebase Auth users...');
    
    // Get all users from Firestore
    const usersSnapshot = await getDocs(collection(db, 'users'));
    const firestoreUserIds = new Set(usersSnapshot.docs.map(doc => doc.id));
    
    console.log(`📊 Found ${firestoreUserIds.size} users in Firestore`);
    
    // Note: We can't directly list Firebase Auth users from the client side
    // This would require Firebase Admin SDK on the server side
    // For now, we'll return information about what we found
    
    return NextResponse.json({
      success: true,
      message: 'Orphaned Auth users check completed',
      firestoreUsersCount: firestoreUserIds.size,
      note: 'Firebase Auth user listing requires Admin SDK'
    });

  } catch (error) {
    console.error('Error cleaning up orphaned Auth users:', error);
    throw error;
  }
}

// Clean up orphaned Firestore users (profiles without Firebase Auth accounts)
async function cleanupOrphanedFirestoreUsers() {
  try {
    console.log('🔍 Finding orphaned Firestore users...');
    
    const usersSnapshot = await getDocs(collection(db, 'users'));
    const orphanedUsers = [];
    
    for (const userDoc of usersSnapshot.docs) {
      const userData = userDoc.data();
      
      // Check if user has passwordSet flag (indicates Firebase Auth account exists)
      if (!userData.passwordSet && userData.email) {
        orphanedUsers.push({
          id: userDoc.id,
          email: userData.email,
          displayName: userData.displayName,
          companyId: userData.companyId
        });
      }
    }
    
    console.log(`📊 Found ${orphanedUsers.length} potentially orphaned Firestore users`);
    
    return NextResponse.json({
      success: true,
      message: 'Orphaned Firestore users check completed',
      orphanedUsersCount: orphanedUsers.length,
      orphanedUsers: orphanedUsers
    });

  } catch (error) {
    console.error('Error cleaning up orphaned Firestore users:', error);
    throw error;
  }
}

// Clean up expired setup tokens
async function cleanupExpiredTokens() {
  try {
    console.log('🔍 Cleaning up expired setup tokens...');
    
    const tokensSnapshot = await getDocs(collection(db, 'setupTokens'));
    const now = new Date();
    let deletedCount = 0;
    
    for (const tokenDoc of tokensSnapshot.docs) {
      const tokenData = tokenDoc.data();
      
      // Check if token is expired
      if (tokenData.expiresAt && new Date(tokenData.expiresAt.toDate()) < now) {
        await deleteDoc(tokenDoc.ref);
        deletedCount++;
        console.log(`🗑️ Deleted expired token for: ${tokenData.email}`);
      }
    }
    
    console.log(`📊 Deleted ${deletedCount} expired tokens`);
    
    return NextResponse.json({
      success: true,
      message: 'Expired tokens cleanup completed',
      deletedTokensCount: deletedCount
    });

  } catch (error) {
    console.error('Error cleaning up expired tokens:', error);
    throw error;
  }
}

// Delete user completely from both Firebase Auth and Firestore
async function deleteUserCompletely(email?: string, userId?: string) {
  try {
    console.log('🗑️ Deleting user completely:', { email, userId });
    
    let userDoc;
    
    if (email) {
      // Find user by email
      const usersQuery = query(collection(db, 'users'), where('email', '==', email));
      const usersSnapshot = await getDocs(usersQuery);
      
      if (usersSnapshot.empty) {
        return NextResponse.json(
          { error: 'User not found in Firestore' },
          { status: 404 }
        );
      }
      
      userDoc = usersSnapshot.docs[0];
    } else if (userId) {
      // Find user by ID
      const userDocRef = doc(db, 'users', userId);
      const userSnapshot = await getDoc(userDocRef);
      
      if (!userSnapshot.exists()) {
        return NextResponse.json(
          { error: 'User not found in Firestore' },
          { status: 404 }
        );
      }
      
      userDoc = userSnapshot;
    }
    
    if (!userDoc) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    const userData = userDoc.data();
    
    // Delete from Firestore
    await deleteDoc(userDoc.ref);
    console.log(`🗑️ Deleted user from Firestore: ${userData.email}`);
    
    // Try to delete from Firebase Auth using Admin SDK
    let authDeleted = false;
    let authError = null;
    
    if (adminApp && userData.uid) {
      try {
        await admin.auth().deleteUser(userData.uid);
        authDeleted = true;
        console.log(`🗑️ Deleted user from Firebase Auth: ${userData.email} (UID: ${userData.uid})`);
      } catch (error: any) {
        authError = error.message;
        console.error('Error deleting user from Firebase Auth:', error);
        // Continue even if Auth deletion fails
      }
    } else if (userData.uid) {
      // Try to find user by email using Admin SDK
      try {
        if (adminApp) {
          const userRecord = await admin.auth().getUserByEmail(userData.email);
          await admin.auth().deleteUser(userRecord.uid);
          authDeleted = true;
          console.log(`🗑️ Deleted user from Firebase Auth by email: ${userData.email}`);
        }
      } catch (error: any) {
        authError = error.message;
        console.error('Error deleting user from Firebase Auth by email:', error);
      }
    }
    
    return NextResponse.json({
      success: true,
      message: authDeleted 
        ? 'User deleted from both Firestore and Firebase Auth' 
        : 'User deleted from Firestore',
      deletedUser: {
        email: userData.email,
        displayName: userData.displayName,
        companyId: userData.companyId,
        uid: userData.uid
      },
      authDeleted,
      authError: authError || undefined
    });

  } catch (error) {
    console.error('Error deleting user completely:', error);
    throw error;
  }
}

// Clean up all data for a company
async function cleanupCompanyData(companyId: string) {
  try {
    console.log('🧹 Cleaning up company data:', companyId);
    
    const collections = [
      'users',
      'departments', 
      'shifts',
      'deviations',
      'documents',
      'timeclock',
      'vacations',
      'surveys',
      'partners',
      'settings',
      'activities',
      'chats',
      'plannedRoutes',
      'routeAssignments',
      'partnerUsers',
      'partnerAssignments',
      'audits'
    ];
    
    let totalDeleted = 0;
    const results: { [key: string]: number | string } = {};
    
    for (const collectionName of collections) {
      try {
        const collectionQuery = query(collection(db, collectionName), where('companyId', '==', companyId));
        const snapshot = await getDocs(collectionQuery);
        
        let deletedCount = 0;
        for (const docSnapshot of snapshot.docs) {
          await deleteDoc(docSnapshot.ref);
          deletedCount++;
        }
        
        results[collectionName] = deletedCount;
        totalDeleted += deletedCount;
        
        if (deletedCount > 0) {
          console.log(`🗑️ Deleted ${deletedCount} documents from ${collectionName}`);
        }
      } catch (error) {
        console.error(`Error cleaning up ${collectionName}:`, error);
        results[collectionName] = `Error: ${error instanceof Error ? error.message : 'Unknown error'}`;
      }
    }
    
    console.log(`📊 Total deleted: ${totalDeleted} documents`);
    
    return NextResponse.json({
      success: true,
      message: 'Company data cleanup completed',
      totalDeleted,
      results
    });

  } catch (error) {
    console.error('Error cleaning up company data:', error);
    throw error;
  }
}
