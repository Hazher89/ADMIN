import { NextRequest, NextResponse } from 'next/server';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, where, setDoc, Timestamp, serverTimestamp } from 'firebase/firestore';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { getFirebaseDb, isFirebaseAvailable } from '@/lib/firebase-admin';
import { initializeApp, getApps } from 'firebase/app';
// Generate random UUID v4
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/**
 * Get Firebase database instance with fallback
 */
function getDb() {
  try {
    const db = getFirebaseDb();
    if (!db) {
      console.warn('Firebase database not available - environment variables may not be set');
    }
    return db;
  } catch (error) {
    console.error('Error getting Firebase database:', error);
    return null;
  }
}

/**
 * Get Firebase Auth instance
 */
function getAuthInstance() {
  try {
    const firebaseConfig = {
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyCyE4S4B5q2JLdtaTtr8kVVvg8y-3Zm7ZE",
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "driftpro-40ccd.firebaseapp.com",
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "driftpro-40ccd",
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "driftpro-40ccd.appspot.com",
      messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "123456789",
      appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:123456789:web:abcdef123456"
    };

    let app;
    if (getApps().length === 0) {
      app = initializeApp(firebaseConfig);
    } else {
      app = getApps()[0];
    }

    return getAuth(app);
  } catch (error) {
    console.error('Error getting Firebase Auth:', error);
    return null;
  }
}

/**
 * Get all permissions set to true for admin users
 */
function getAllAdminPermissions() {
  return {
    dashboard: true,
    employees: true,
    departments: true,
    projects: true,
    tasks: true,
    inventory: true,
    suppliers: true,
    finance: true,
    invoicing: true,
    payments: true,
    hr: true,
    crm: true,
    delivery: true,
    settings: true,
    mail: true,
    reports: true,
    analytics: true,
    notifications: true,
    calendar: true,
    documents: true,
    training: true,
    compliance: true,
    maintenance: true,
    quality: true,
    safety: true,
    procurement: true,
    logistics: true,
    production: true,
    sales: true,
    marketing: true,
    customerService: true,
    it: true,
    legal: true,
    audit: true,
    internkontrollOgSamsvar: true,
    internrevisjon: true,
    avvik: true,
    risikovurdering: true,
    oppfølgingstiltak: true,
    kontrollpunkter: true,
    internkontrollRapporter: true,
    chat: true,
    emailSystem: true,
    smsLogs: true,
    partners: true,
    logistikkBudPriser: true,
    logistikkLevering: true,
    logistikkPlanlegging: true,
    logistikkKunder: true,
    logistikkLeverandorer: true,
    logistikkProdukter: true,
    logistikkLager: true,
    logistikkFakturering: true,
    logistikkFinans: true,
    hrAnsatte: true,
    hrVakter: true,
    hrFravær: true,
    hrFerie: true,
    hrAvdelinger: true
  };
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
    if (!firestoreDb) {
      console.error('Firestore database not available');
      return NextResponse.json(
        { error: 'Database not available. Please check Firebase configuration.' }, 
        { status: 500 }
      );
    }

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
    const auth = getAuthInstance();
    
    if (!firestoreDb || !auth) {
      console.error('Firebase not available');
      return NextResponse.json(
        { error: 'Database not available. Please check Firebase configuration.' }, 
        { status: 500 }
      );
    }

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
      // Set ALL permissions to true for admin
      const allPermissions = getAllAdminPermissions();
      
      await updateDoc(doc(firestoreDb, 'users', existingUser.id), {
        role: role,
        companyName: companyName || '',
        companyId: companyId,
        permissions: allPermissions, // Full access for admin
        updatedAt: new Date().toISOString(),
        status: 'active'
      });

      const updatedUser = {
        id: existingUser.id,
        ...userData,
        role: role,
        companyName: companyName || '',
        companyId: companyId,
        permissions: allPermissions,
        updatedAt: new Date().toISOString(),
        status: 'active'
      };

      // Send welcome email with password setup link
      try {
        // Generate setup token
        const setupToken = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 72); // Token valid for 72 hours

        // Store setup token
        await addDoc(collection(firestoreDb, 'setupTokens'), {
          token: setupToken,
          userId: existingUser.id,
          email: email.toLowerCase().trim(),
          expiresAt: Timestamp.fromDate(expiresAt),
          used: false,
          createdAt: serverTimestamp(),
          type: 'admin_welcome',
          companyName: companyName || 'Mavi Logistikk',
          adminName: 'System Administrator'
        });

        const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://admin.driftpro.no';
        const setupPasswordUrl = `${appUrl}/setup-password?token=${setupToken}`;

        // Send welcome email
        const emailResponse = await fetch(`${appUrl}/api/send-welcome-email`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: email.toLowerCase().trim(),
            displayName: name,
            adminName: 'System Administrator',
            companyName: companyName || 'Mavi Logistikk',
            resetLink: setupPasswordUrl
          })
        });

        if (emailResponse.ok) {
          console.log('✅ Welcome email sent successfully to existing admin');
        } else {
          console.error('⚠️ Failed to send welcome email:', await emailResponse.text());
        }
      } catch (emailError) {
        console.error('Error sending welcome email:', emailError);
        // Don't fail the request if email fails
      }

      return NextResponse.json(updatedUser);
    } else {
      // Create new admin user
      // First create Firebase Auth user
      const tempPassword = generateUUID();
      let firebaseUser;
      
      try {
        const userCredential = await createUserWithEmailAndPassword(auth, email.toLowerCase().trim(), tempPassword);
        firebaseUser = userCredential.user;
        console.log('✅ Firebase Auth user created:', firebaseUser.uid);
      } catch (authError: any) {
        console.error('Error creating Firebase Auth user:', authError);
        if (authError.code === 'auth/email-already-in-use') {
          return NextResponse.json(
            { error: 'E-postadressen er allerede i bruk i Firebase Auth. Kontakt administrator.' }, 
            { status: 409 }
          );
        }
        throw authError;
      }

      // Set ALL permissions to true for admin
      const allPermissions = getAllAdminPermissions();

      // Create user profile in Firestore with Firebase UID
      const newAdmin = {
        id: firebaseUser.uid,
        uid: firebaseUser.uid, // CRITICAL: Always set uid field
        email: email.toLowerCase().trim(),
        displayName: name,
        role: role,
        companyName: companyName || '',
        companyId: companyId,
        permissions: allPermissions, // Full access for admin
        status: 'pending', // Will be set to 'active' after password setup
        passwordSet: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await setDoc(doc(firestoreDb, 'users', firebaseUser.uid), newAdmin);
      console.log('✅ Admin user created in Firestore:', firebaseUser.uid);
      
      const createdAdmin = {
        id: firebaseUser.uid,
        ...newAdmin
      };

      // Generate password setup token
      const setupToken = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 72); // Token valid for 72 hours

      // Store setup token
      await addDoc(collection(firestoreDb, 'setupTokens'), {
        token: setupToken,
        userId: firebaseUser.uid,
        email: email.toLowerCase().trim(),
        expiresAt: Timestamp.fromDate(expiresAt),
        used: false,
        createdAt: serverTimestamp(),
        type: 'admin_welcome',
        companyName: companyName || 'Mavi Logistikk',
        adminName: 'System Administrator'
      });

      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://admin.driftpro.no';
      const setupPasswordUrl = `${appUrl}/setup-password?token=${setupToken}`;

      // Send welcome email with password setup link
      try {
        const emailResponse = await fetch(`${appUrl}/api/send-welcome-email`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: email.toLowerCase().trim(),
            displayName: name,
            adminName: 'System Administrator',
            companyName: companyName || 'Mavi Logistikk',
            resetLink: setupPasswordUrl
          })
        });

        if (emailResponse.ok) {
          const result = await emailResponse.json();
          if (result.success) {
            console.log('✅ Welcome email sent successfully to new admin');
          } else {
            console.error('⚠️ Failed to send welcome email:', result.error);
          }
        } else {
          console.error('⚠️ Failed to send welcome email:', await emailResponse.text());
        }
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
    if (!firestoreDb) {
      console.error('Firestore database not available');
      return NextResponse.json(
        { error: 'Database not available. Please check Firebase configuration.' }, 
        { status: 500 }
      );
    }

    const updates: any = {
      updatedAt: new Date().toISOString()
    };

    if (role) updates.role = role;
    // If updating permissions and user is admin, ensure they get full access
    if (permissions) {
      if (role === 'admin' || role === 'super_admin') {
        updates.permissions = getAllAdminPermissions(); // Full access for admin
      } else {
        updates.permissions = permissions;
      }
    }
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
    if (!firestoreDb) {
      console.error('Firestore database not available');
      return NextResponse.json(
        { error: 'Database not available. Please check Firebase configuration.' }, 
        { status: 500 }
      );
    }

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
