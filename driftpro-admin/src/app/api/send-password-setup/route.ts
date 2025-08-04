import { NextRequest, NextResponse } from 'next/server';
import { getApps, initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { adminEmailService } from '@/lib/admin-email-service';

function getDb() {
  try {
    let apps = getApps();
    
    if (apps.length === 0) {
      console.log('Initializing Firebase...');
      const firebaseConfig = {
        apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyCyE4S4B5q2JLdtaTtr8kVVvg8y-3Zm7ZE",
        authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "driftpro-40ccd.firebaseapp.com",
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "driftpro-40ccd",
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "driftpro-40ccd.appspot.com",
        messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "123456789",
        appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:123456789:web:abcdef123456"
      };
      
      try {
        initializeApp(firebaseConfig);
        console.log('Firebase initialized successfully');
      } catch (initError) {
        console.error('Error initializing Firebase:', initError);
        apps = getApps();
        if (apps.length === 0) {
          throw new Error('Failed to initialize Firebase and no existing apps found');
        }
      }
    }
    
    const firestoreDb = getFirestore();
    if (!firestoreDb) {
      throw new Error('Failed to get Firestore instance');
    }
    
    console.log('Firestore instance obtained successfully');
    return firestoreDb;
  } catch (error) {
    console.error('Error getting Firestore instance:', error);
    throw new Error('Firebase database not available. Please check Firebase configuration.');
  }
}

export async function POST(request: NextRequest) {
  try {
    const { companyId, adminUserId, employeeId, employeeEmail } = await request.json();
    
    const firestoreDb = getDb();
    
    if (companyId && adminUserId) {
      // Handle company admin password setup
      if (!companyId || !adminUserId) {
        return NextResponse.json(
          { error: 'Company ID and admin user ID are required' },
          { status: 400 }
        );
      }

      // Get company details
      const companyDoc = await getDoc(doc(firestoreDb, 'companies', companyId));
      if (!companyDoc.exists()) {
        return NextResponse.json(
          { error: 'Company not found' },
          { status: 404 }
        );
      }

      const company = companyDoc.data();
      
      // Get admin user details
      const adminDoc = await getDoc(doc(firestoreDb, 'users', adminUserId));
      if (!adminDoc.exists()) {
        return NextResponse.json(
          { error: 'Admin user not found' },
          { status: 404 }
        );
      }

      const admin = adminDoc.data();
      
      // Send password setup email
      await adminEmailService.sendPasswordSetupEmail(admin.email, company.name);
      
      return NextResponse.json(
        { message: 'Password setup email sent successfully' },
        { status: 200 }
      );
    } else if (employeeId && employeeEmail) {
      // Handle employee password setup
      if (!employeeId || !employeeEmail) {
        return NextResponse.json(
          { error: 'Employee ID and email are required' },
          { status: 400 }
        );
      }

      // Get employee details
      const employeeDoc = await getDoc(doc(firestoreDb, 'employees', employeeId));
      if (!employeeDoc.exists()) {
        return NextResponse.json(
          { error: 'Employee not found' },
          { status: 404 }
        );
      }

      const employee = employeeDoc.data();
      
      // Send password setup email for employee
      await adminEmailService.sendPasswordSetupEmail(employeeEmail, employee.displayName || 'Employee');
      
      return NextResponse.json(
        { message: 'Password setup email sent successfully' },
        { status: 200 }
      );
    } else {
      return NextResponse.json(
        { error: 'Either companyId/adminEmail or employeeId/employeeEmail are required' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error sending password setup email:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 