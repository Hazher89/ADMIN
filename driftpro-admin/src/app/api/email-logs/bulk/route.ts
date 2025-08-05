import { NextRequest, NextResponse } from 'next/server';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, query, where, getDocs, updateDoc, doc, deleteDoc } from 'firebase/firestore';

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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, days } = body;

    console.log('📧 Processing bulk email logs action for Cloudflare Email Routing:', {
      action,
      days,
      provider: 'cloudflare_email_routing'
    });

    if (action === 'retry_failed') {
      // Get failed emails
      const failedEmailsQuery = query(
        collection(db, 'emailLogs'),
        where('status', '==', 'failed')
      );

      const failedEmailsSnapshot = await getDocs(failedEmailsQuery);
      const failedEmails = failedEmailsSnapshot.docs;

      console.log(`📧 Found ${failedEmails.length} failed emails for Cloudflare Email Routing`);

      let retried = 0;
      for (const emailDoc of failedEmails) {
        try {
          // Update status to pending for retry
          await updateDoc(doc(db, 'emailLogs', emailDoc.id), {
            status: 'pending',
            retryCount: (emailDoc.data().retryCount || 0) + 1,
            retryAt: new Date().toISOString(),
            provider: 'cloudflare_email_routing'
          });
          retried++;
        } catch (error) {
          console.error('Error retrying email:', error);
        }
      }

      return NextResponse.json({
        success: true,
        message: `Retried ${retried} failed emails via Cloudflare Email Routing`,
        retried,
        total: failedEmails.length,
        provider: 'cloudflare_email_routing'
      });

    } else if (action === 'clear_old') {
      // Calculate cutoff date
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - (days || 30));

      console.log(`📧 Clearing emails older than ${days || 30} days for Cloudflare Email Routing`);

      // Get old emails
      const oldEmailsQuery = query(
        collection(db, 'emailLogs'),
        where('sentAt', '<', cutoffDate)
      );

      const oldEmailsSnapshot = await getDocs(oldEmailsQuery);
      const oldEmails = oldEmailsSnapshot.docs;

      let deleted = 0;
      for (const emailDoc of oldEmails) {
        try {
          await deleteDoc(doc(db, 'emailLogs', emailDoc.id));
          deleted++;
        } catch (error) {
          console.error('Error deleting email:', error);
        }
      }

      return NextResponse.json({
        success: true,
        message: `Deleted ${deleted} old emails via Cloudflare Email Routing`,
        deleted,
        total: oldEmails.length,
        provider: 'cloudflare_email_routing'
      });

    } else {
      return NextResponse.json({
        error: 'Invalid action',
        provider: 'cloudflare_email_routing'
      }, { status: 400 });
    }

  } catch (error) {
    console.error('❌ Error in bulk email logs API:', error);
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error',
      provider: 'cloudflare_email_routing'
    }, { status: 500 });
  }
} 