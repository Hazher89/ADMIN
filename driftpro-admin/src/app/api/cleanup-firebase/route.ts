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
    // Try to initialize with service account credentials first
    try {
      if (process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL) {
        adminApp = admin.initializeApp({
          credential: admin.credential.cert({
            projectId: process.env.FIREBASE_PROJECT_ID || firebaseConfig.projectId,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
          }),
        });
        console.log('✅ Firebase Admin SDK initialized with service account');
      } else {
        // Try default credentials
        adminApp = admin.initializeApp({
          credential: admin.credential.applicationDefault(),
          projectId: firebaseConfig.projectId,
        });
        console.log('✅ Firebase Admin SDK initialized with default credentials');
      }
    } catch (adminError) {
      console.log('⚠️ Firebase Admin SDK initialization failed (may need service account key):', adminError);
      // Will fall back to client SDK only
    }
  } else {
    adminApp = admin.apps[0] as admin.app.App;
    console.log('✅ Using existing Firebase Admin SDK instance');
  }
} catch (error) {
  console.log('⚠️ Firebase Admin SDK not available:', error);
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
      
      case 'delete_all_users_except_superadmin':
        return await deleteAllUsersExceptSuperAdmin();
      
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
    
    // Also delete related tokens (setup tokens, password reset tokens)
    try {
      // Delete setup tokens
      const setupTokensQuery = query(collection(db, 'setupTokens'), where('email', '==', userData.email));
      const setupTokensSnapshot = await getDocs(setupTokensQuery);
      for (const tokenDoc of setupTokensSnapshot.docs) {
        await deleteDoc(tokenDoc.ref);
        console.log(`🗑️ Deleted setup token for: ${userData.email}`);
      }
      
      // Delete password reset tokens
      const resetTokensQuery = query(collection(db, 'passwordResetTokens'), where('email', '==', userData.email));
      const resetTokensSnapshot = await getDocs(resetTokensQuery);
      for (const tokenDoc of resetTokensSnapshot.docs) {
        await deleteDoc(tokenDoc.ref);
        console.log(`🗑️ Deleted password reset token for: ${userData.email}`);
      }
    } catch (tokenError) {
      console.warn('⚠️ Error deleting tokens (non-critical):', tokenError);
    }
    
    // Delete from Firestore
    await deleteDoc(userDoc.ref);
    console.log(`🗑️ Deleted user from Firestore: ${userData.email}`);
    
    // Try to delete from Firebase Auth using Admin SDK
    let authDeleted = false;
    let authError = null;
    
    if (!adminApp) {
      console.warn('⚠️ Firebase Admin SDK not available, cannot delete from Firebase Auth');
      authError = 'Admin SDK not configured';
    } else {
      const adminAuth = admin.auth();
      
      // Try by UID first
      if (userData.uid) {
        try {
          await adminAuth.deleteUser(userData.uid);
          authDeleted = true;
          console.log(`🗑️ Deleted user from Firebase Auth: ${userData.email} (UID: ${userData.uid})`);
        } catch (error: any) {
          if (error.code === 'auth/user-not-found') {
            console.log(`ℹ️ User ${userData.email} not found in Firebase Auth (already deleted)`);
            authDeleted = true; // Consider it deleted if not found
          } else {
            authError = error.message;
            console.error('Error deleting user from Firebase Auth by UID:', error);
            // Try by email as fallback
            try {
              const userRecord = await adminAuth.getUserByEmail(userData.email);
              await adminAuth.deleteUser(userRecord.uid);
              authDeleted = true;
              console.log(`🗑️ Deleted user from Firebase Auth by email: ${userData.email}`);
              authError = null; // Clear error if email method worked
            } catch (emailError: any) {
              if (emailError.code === 'auth/user-not-found') {
                console.log(`ℹ️ User ${userData.email} not found in Firebase Auth (already deleted)`);
                authDeleted = true;
                authError = null;
              } else {
                authError = emailError.message;
                console.error('Error deleting user from Firebase Auth by email:', emailError);
              }
            }
          }
        }
      } else {
        // No UID, try by email - ALWAYS try to delete by email even if no UID
        try {
          const userRecord = await adminAuth.getUserByEmail(userData.email);
          await adminAuth.deleteUser(userRecord.uid);
          authDeleted = true;
          console.log(`🗑️ Deleted user from Firebase Auth by email: ${userData.email} (UID: ${userRecord.uid})`);
        } catch (error: any) {
          if (error.code === 'auth/user-not-found') {
            console.log(`ℹ️ User ${userData.email} not found in Firebase Auth (already deleted)`);
            authDeleted = true;
          } else {
            authError = error.message;
            console.error('Error deleting user from Firebase Auth by email:', error);
            // Try to list all users and find by email as last resort
            try {
              const listUsersResult = await adminAuth.listUsers(1000);
              const foundUser = listUsersResult.users.find(u => u.email === userData.email);
              if (foundUser) {
                await adminAuth.deleteUser(foundUser.uid);
                authDeleted = true;
                console.log(`🗑️ Deleted user from Firebase Auth via listUsers: ${userData.email} (UID: ${foundUser.uid})`);
                authError = null;
              }
            } catch (listError) {
              console.error('Error listing users for deletion:', listError);
            }
          }
        }
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

// Delete all users except super admin
async function deleteAllUsersExceptSuperAdmin() {
  try {
    const SUPER_ADMIN_EMAIL = 'baxigshti@hotmail.de';
    console.log('🗑️ Deleting all users except super admin:', SUPER_ADMIN_EMAIL);
    
    if (!adminApp) {
      return NextResponse.json(
        { 
          error: 'Firebase Admin SDK not available. Cannot delete users from Firebase Auth.',
          details: 'Please configure FIREBASE_PRIVATE_KEY environment variable.'
        },
        { status: 500 }
      );
    }
    
    const adminAuth = admin.auth();
    const deletedUsers: string[] = [];
    const errors: string[] = [];
    
    // Get all users from Firestore
    const usersSnapshot = await getDocs(collection(db, 'users'));
    console.log(`📊 Found ${usersSnapshot.docs.length} users in Firestore`);
    
    // Delete from Firestore and Firebase Auth
    for (const userDoc of usersSnapshot.docs) {
      const userData = userDoc.data();
      const userEmail = userData.email;
      
      // Skip super admin
      if (userEmail === SUPER_ADMIN_EMAIL) {
        console.log(`⏭️ Skipping super admin: ${userEmail}`);
        continue;
      }
      
      try {
        // Delete from Firestore
        await deleteDoc(userDoc.ref);
        console.log(`🗑️ Deleted from Firestore: ${userEmail}`);
        
        // Delete from Firebase Auth
        if (userData.uid) {
          try {
            await adminAuth.deleteUser(userData.uid);
            console.log(`🗑️ Deleted from Firebase Auth (by UID): ${userEmail}`);
            deletedUsers.push(userEmail);
          } catch (authError: any) {
            // Try by email if UID fails
            try {
              const userRecord = await adminAuth.getUserByEmail(userEmail);
              await adminAuth.deleteUser(userRecord.uid);
              console.log(`🗑️ Deleted from Firebase Auth (by email): ${userEmail}`);
              deletedUsers.push(userEmail);
            } catch (emailError: any) {
              if (emailError.code === 'auth/user-not-found') {
                console.log(`ℹ️ User ${userEmail} not found in Firebase Auth (already deleted)`);
                deletedUsers.push(userEmail);
              } else {
                console.error(`❌ Error deleting ${userEmail} from Auth:`, emailError);
                errors.push(`${userEmail}: ${emailError.message}`);
              }
            }
          }
        } else {
          // Try to find by email
          try {
            const userRecord = await adminAuth.getUserByEmail(userEmail);
            await adminAuth.deleteUser(userRecord.uid);
            console.log(`🗑️ Deleted from Firebase Auth (by email, no UID): ${userEmail}`);
            deletedUsers.push(userEmail);
          } catch (emailError: any) {
            if (emailError.code === 'auth/user-not-found') {
              console.log(`ℹ️ User ${userEmail} not found in Firebase Auth (already deleted or never existed)`);
              deletedUsers.push(userEmail);
            } else {
              console.error(`❌ Error deleting ${userEmail} from Auth:`, emailError);
              errors.push(`${userEmail}: ${emailError.message}`);
            }
          }
        }
      } catch (error: any) {
        console.error(`❌ Error deleting ${userEmail}:`, error);
        errors.push(`${userEmail}: ${error.message}`);
      }
    }
    
    // Also check Firebase Auth for any users not in Firestore
    try {
      let listUsersResult = await adminAuth.listUsers(1000);
      for (const userRecord of listUsersResult.users) {
        if (userRecord.email === SUPER_ADMIN_EMAIL) {
          continue;
        }
        
        // Check if user exists in Firestore
        const usersQuery = query(collection(db, 'users'), where('email', '==', userRecord.email));
        const usersSnapshot = await getDocs(usersQuery);
        
        if (usersSnapshot.empty) {
          // User exists in Auth but not in Firestore - delete from Auth
          try {
            await adminAuth.deleteUser(userRecord.uid);
            console.log(`🗑️ Deleted orphaned Auth user: ${userRecord.email}`);
            deletedUsers.push(userRecord.email || userRecord.uid);
          } catch (error: any) {
            console.error(`❌ Error deleting orphaned Auth user ${userRecord.email}:`, error);
            errors.push(`${userRecord.email}: ${error.message}`);
          }
        }
      }
    } catch (listError: any) {
      console.error('❌ Error listing Auth users:', listError);
      errors.push(`List users error: ${listError.message}`);
    }
    
    return NextResponse.json({
      success: true,
      message: `Deleted ${deletedUsers.length} users. ${errors.length} errors.`,
      deletedCount: deletedUsers.length,
      deletedUsers: deletedUsers.slice(0, 50), // Limit to first 50 for response size
      errors: errors.length > 0 ? errors : undefined,
      superAdminPreserved: SUPER_ADMIN_EMAIL
    });
    
  } catch (error) {
    console.error('❌ Error deleting all users:', error);
    return NextResponse.json(
      { 
        error: 'Failed to delete all users',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
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
