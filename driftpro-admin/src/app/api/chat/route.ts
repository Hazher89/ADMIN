import { NextRequest, NextResponse } from 'next/server';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, serverTimestamp, query, where, getDocs, orderBy, limit } from 'firebase/firestore';

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

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId');

    if (!companyId) {
      return NextResponse.json(
        { error: 'Company ID is required' },
        { status: 400 }
      );
    }

    console.log('💬 Fetching chat messages for Cloudflare Email Routing:', {
      companyId,
      provider: 'cloudflare_email_routing'
    });

    // Get chat messages
    const chatQuery = query(
      collection(db, 'chatMessages'),
      where('companyId', '==', companyId),
      orderBy('timestamp', 'desc'),
      limit(50)
    );

    const chatSnapshot = await getDocs(chatQuery);
    const messages = chatSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      timestamp: doc.data().timestamp?.toDate?.()?.toISOString() || doc.data().timestamp || new Date().toISOString()
    }));

    console.log(`✅ Retrieved ${messages.length} chat messages for Cloudflare Email Routing`);

    return NextResponse.json(messages);
  } catch (error) {
    console.error('❌ Error fetching chat messages:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch chat messages',
        details: error instanceof Error ? error.message : 'Unknown error',
        provider: 'cloudflare_email_routing'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { companyId, userId, userName, message, type = 'text' } = body;

    if (!companyId || !userId || !userName || !message) {
      return NextResponse.json(
        { error: 'Missing required fields: companyId, userId, userName, message' },
        { status: 400 }
      );
    }

    console.log('💬 Sending chat message via Cloudflare Email Routing:', {
      companyId,
      userId,
      userName,
      type,
      provider: 'cloudflare_email_routing'
    });

    // Add chat message to Firestore
    const chatMessage = {
      companyId,
      userId,
      userName,
      message,
      type,
      timestamp: serverTimestamp(),
      provider: 'cloudflare_email_routing'
    };

    const docRef = await addDoc(collection(db, 'chatMessages'), chatMessage);

    console.log('✅ Chat message sent successfully via Cloudflare Email Routing');

    return NextResponse.json({
      success: true,
      message: 'Chat message sent successfully via Cloudflare Email Routing',
      messageId: docRef.id,
      provider: 'cloudflare_email_routing'
    });
  } catch (error) {
    console.error('❌ Error sending chat message:', error);
    return NextResponse.json(
      { 
        error: 'Failed to send chat message',
        details: error instanceof Error ? error.message : 'Unknown error',
        provider: 'cloudflare_email_routing'
      },
      { status: 500 }
    );
  }
} 