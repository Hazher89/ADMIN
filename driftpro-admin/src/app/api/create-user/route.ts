import { NextRequest, NextResponse } from 'next/server';
import { collection, addDoc, doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import { createUserWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { getFirebaseAuth, getFirebaseDb, isFirebaseAvailable } from '@/lib/firebase-admin';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: NextRequest) {
  try {
    // Check if Firebase is available
    const auth = getFirebaseAuth();
    const db = getFirebaseDb();
    
    if (!isFirebaseAvailable() || !auth || !db) {
      return NextResponse.json(
        { error: 'Firebase is not configured. Please set Firebase environment variables.' },
        { status: 500 }
      );
    }

    const { email, displayName, role = 'employee', companyName } = await request.json();

    if (!email || !displayName) {
      return NextResponse.json(
        { error: 'Missing required fields: email, displayName' },
        { status: 400 }
      );
    }

    // Generate a random password
    const tempPassword = uuidv4();
    
    // Create user in Firebase Auth with temporary password
    const userCredential = await createUserWithEmailAndPassword(auth, email, tempPassword);
    const user = userCredential.user;

    // Create user profile in Firestore
    const userProfile = {
      id: user.uid,
      email: user.email,
      displayName,
      role,
      companyName: companyName || 'Mavi Logistikk',
      status: 'pending',
      passwordSet: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await setDoc(doc(db, 'users', user.uid), userProfile);

    // Generate password reset link
    const actionCodeSettings = {
      url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/login`,
      handleCodeInApp: true
    };

    // Send password reset email from Firebase Auth (contains the reset link)
    try {
      await sendPasswordResetEmail(auth, email, actionCodeSettings);
      console.log('✅ Password reset email sent from Firebase Auth');
    } catch (emailError) {
      console.error('⚠️ Failed to send password reset email from Firebase Auth:', emailError);
      // Continue anyway - we'll send welcome email via Microsoft Graph
    }

    // Also send a proper welcome email via Microsoft Graph with instructions
    try {
      const { globalEmailService } = await import('@/lib/global-email-service');
      const forgotPasswordUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/forgot-password`;
      
      const welcomeHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #2563eb;">Velkommen til ${companyName || 'Mavi Logistikk'}!</h2>
          <p>Hei ${displayName},</p>
          <p>Vi er glade for å informere deg om at du nå har blitt registrert i DriftPro-systemet.</p>
          <p>Du kan nå logge inn på systemet med din e-postadresse: <strong>${email}</strong></p>
          <p><strong>For å sette opp passordet ditt:</strong></p>
          <ol>
            <li>Gå til innloggingssiden: <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/login">${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/login</a></li>
            <li>Klikk på "Glemt passord?"</li>
            <li>Skriv inn din e-postadresse: <strong>${email}</strong></li>
            <li>Du vil motta en e-post med en lenke for å sette opp passordet ditt</li>
            <li>Klikk på lenken i e-posten og sett opp ditt nye passord</li>
          </ol>
          <p>Alternativt kan du bruke denne direkte lenken: <a href="${forgotPasswordUrl}">${forgotPasswordUrl}</a></p>
          <p><strong>Viktig:</strong> Du må sette opp passordet ditt før du kan logge inn første gang.</p>
          <p>Hvis du har spørsmål eller trenger hjelp, ikke nøl med å ta kontakt med systemadministratoren.</p>
          <br>
          <p>Med vennlig hilsen,<br>${companyName || 'Mavi Logistikk'}-teamet</p>
        </div>
      `;

      const welcomeText = `
Velkommen til ${companyName || 'Mavi Logistikk'}!

Hei ${displayName},

Vi er glade for å informere deg om at du nå har blitt registrert i DriftPro-systemet.

Du kan nå logge inn på systemet med din e-postadresse: ${email}

FOR Å SETTE OPP PASSORDET DITT:
1. Gå til innloggingssiden: ${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/login
2. Klikk på "Glemt passord?"
3. Skriv inn din e-postadresse: ${email}
4. Du vil motta en e-post med en lenke for å sette opp passordet ditt
5. Klikk på lenken i e-posten og sett opp ditt nye passord

Alternativt kan du bruke denne direkte lenken: ${forgotPasswordUrl}

VIKTIG: Du må sette opp passordet ditt før du kan logge inn første gang.

Hvis du har spørsmål eller trenger hjelp, ikke nøl med å ta kontakt med systemadministratoren.

Med vennlig hilsen,
${companyName || 'Mavi Logistikk'}-teamet
      `;

      const emailResult = await globalEmailService.sendEmail({
        to: email,
        subject: `Velkommen til ${companyName || 'Mavi Logistikk'} - Sett opp passordet ditt`,
        html: welcomeHtml,
        text: welcomeText
      });

      if (emailResult.success) {
        console.log('✅ Welcome email sent successfully via Microsoft Graph');
      } else {
        console.error('⚠️ Failed to send welcome email via Microsoft Graph:', emailResult.error);
      }
    } catch (welcomeEmailError) {
      console.error('⚠️ Error sending welcome email:', welcomeEmailError);
      // Don't fail - password reset email from Firebase Auth should still work
    }

    return NextResponse.json({
      success: true,
      userId: user.uid,
      message: 'User created successfully and welcome email sent'
    });

  } catch (error: any) {
    console.error('Error creating user:', error);
    
    if (error.code === 'auth/email-already-in-use') {
      // If user exists, try to find their UID in Firestore
      try {
        // Try to find user by email in Firestore
        const usersRef = collection(db, 'users');
        const { query: firestoreQuery, where: firestoreWhere, getDocs } = await import('firebase/firestore');
        const emailQuery = firestoreQuery(usersRef, firestoreWhere('email', '==', email));
        const emailSnapshot = await getDocs(emailQuery);
        
        let existingUserId: string | null = null;
        if (!emailSnapshot.empty) {
          const existingUserDoc = emailSnapshot.docs[0];
          const existingData = existingUserDoc.data();
          existingUserId = existingData.uid || existingUserDoc.id;
        }
        
        // Send password reset email
        try {
          await sendPasswordResetEmail(auth, email);
          console.log('✅ Password reset email sent from Firebase Auth');
        } catch (resetEmailError) {
          console.error('⚠️ Failed to send password reset email from Firebase Auth:', resetEmailError);
        }

        // Also send welcome email with instructions
        try {
          const { globalEmailService } = await import('@/lib/global-email-service');
          const forgotPasswordUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/forgot-password`;
          const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
          
          const welcomeHtml = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h2 style="color: #2563eb;">Velkommen til ${companyName || 'Mavi Logistikk'}!</h2>
              <p>Hei ${displayName},</p>
              <p>Din bruker eksisterer allerede i systemet. For å logge inn må du sette opp passordet ditt.</p>
              <p>Du kan nå logge inn på systemet med din e-postadresse: <strong>${email}</strong></p>
              <div style="background-color: #f0f9ff; border-left: 4px solid #2563eb; padding: 15px; margin: 20px 0;">
                <h3 style="color: #2563eb; margin-top: 0;">Slik setter du opp passordet ditt:</h3>
                <ol style="margin: 10px 0; padding-left: 20px;">
                  <li>Gå til innloggingssiden: <a href="${appUrl}/login">${appUrl}/login</a></li>
                  <li>Klikk på <strong>"Glemt passord?"</strong> eller bruk denne direkte lenken: <a href="${forgotPasswordUrl}">${forgotPasswordUrl}</a></li>
                  <li>Skriv inn din e-postadresse: <strong>${email}</strong></li>
                  <li>Du vil motta en e-post med en lenke for å sette opp passordet ditt</li>
                  <li>Klikk på lenken i e-posten og sett opp ditt nye passord</li>
                </ol>
              </div>
              <p><strong>Viktig:</strong> Du må sette opp passordet ditt før du kan logge inn.</p>
              <p>Hvis du har spørsmål eller trenger hjelp, ikke nøl med å ta kontakt med systemadministratoren.</p>
              <br>
              <p>Med vennlig hilsen,<br>${companyName || 'Mavi Logistikk'}-teamet</p>
            </div>
          `;

          await globalEmailService.sendEmail({
            to: email,
            subject: `Velkommen til ${companyName || 'Mavi Logistikk'} - Sett opp passordet ditt`,
            html: welcomeHtml,
            text: `Velkommen til ${companyName || 'Mavi Logistikk'}!\n\nHei ${displayName},\n\nDin bruker eksisterer allerede i systemet. For å logge inn må du sette opp passordet ditt.\n\nGå til: ${forgotPasswordUrl}\n\nMed vennlig hilsen,\n${companyName || 'Mavi Logistikk'}-teamet`
          });
          console.log('✅ Welcome email sent via Microsoft Graph');
        } catch (welcomeEmailError) {
          console.error('⚠️ Error sending welcome email:', welcomeEmailError);
        }
        
        return NextResponse.json(
          { 
            success: true,
            userId: existingUserId,
            message: 'User already exists. Password reset email and welcome email sent.',
            alreadyExists: true
          },
          { status: 200 }
        );
      } catch (resetError) {
        console.error('Error sending password reset email:', resetError);
        return NextResponse.json(
          { 
            error: 'User already exists. Failed to send password reset email.',
            message: resetError instanceof Error ? resetError.message : 'Unknown error'
          },
          { status: 400 }
        );
      }
    }

    return NextResponse.json(
      { 
        error: 'Failed to create user',
        message: error.message 
      },
      { status: 500 }
    );
  }
}
