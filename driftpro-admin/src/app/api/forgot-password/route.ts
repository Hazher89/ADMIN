import { NextRequest, NextResponse } from 'next/server';
import { getFirestore, collection, query, where, getDocs } from 'firebase/firestore';
import { getApps, initializeApp } from 'firebase/app';
import { emailService } from '@/lib/email-service';

// Initialize Firebase if not already initialized
function initializeFirebase() {
  if (getApps().length === 0) {
    initializeApp({
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    });
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('🔧 FORGOT PASSWORD: Processing request...');
    
    initializeFirebase();
    const firestoreDb = getFirestore();
    
    const { email } = await request.json();
    
    if (!email) {
      return NextResponse.json({ error: 'E-postadresse er påkrevd' }, { status: 400 });
    }
    
    console.log('🔧 FORGOT PASSWORD: Looking for user with email:', email);
    
    // Find user in Firestore
    const usersQuery = query(collection(firestoreDb, 'users'), where('email', '==', email));
    const userDocs = await getDocs(usersQuery);
    
    if (userDocs.empty) {
      console.log('🔧 FORGOT PASSWORD: No user found with email:', email);
      return NextResponse.json({ 
        success: true, 
        message: 'Hvis e-postadressen eksisterer i systemet, vil du motta en lenke for å tilbakestille passordet.' 
      });
    }
    
    const userDoc = userDocs.docs[0];
    const userData = userDoc.data();
    
    console.log('🔧 FORGOT PASSWORD: User found:', {
      userId: userDoc.id,
      email: userData.email,
      companyId: userData.companyId,
      status: userData.status
    });
    
    // Generate reset token
    const resetToken = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    
    // Store reset token in Firestore
    await firestoreDb.collection('passwordResetTokens').add({
      token: resetToken,
      email: email,
      userId: userDoc.id,
      companyId: userData.companyId,
      expiresAt: expiresAt,
      createdAt: new Date().toISOString(),
      used: false
    });
    
    console.log('🔧 FORGOT PASSWORD: Reset token created for:', email);
    
    // Send reset email
    const resetUrl = `https://driftpro-admin.netlify.app/reset-password?token=${resetToken}&email=${encodeURIComponent(email)}`;
    
    const emailResult = await emailService.sendPasswordResetEmail(email, resetUrl);
    
    if (emailResult.success) {
      console.log('🔧 FORGOT PASSWORD: Reset email sent successfully to:', email);
      return NextResponse.json({ 
        success: true, 
        message: 'Hvis e-postadressen eksisterer i systemet, vil du motta en lenke for å tilbakestille passordet.' 
      });
    } else {
      console.error('🔧 FORGOT PASSWORD: Failed to send reset email:', emailResult.error);
      return NextResponse.json({ 
        success: true, 
        message: 'Hvis e-postadressen eksisterer i systemet, vil du motta en lenke for å tilbakestille passordet.' 
      });
    }
    
  } catch (error) {
    console.error('🔧 FORGOT PASSWORD: Error:', error);
    return NextResponse.json({ 
      success: true, 
      message: 'Hvis e-postadressen eksisterer i systemet, vil du motta en lenke for å tilbakestille passordet.' 
    });
  }
} 