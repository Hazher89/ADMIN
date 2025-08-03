import { NextRequest, NextResponse } from 'next/server';
import { updateDoc, deleteDoc, doc, getDocs, query, where, collection } from 'firebase/firestore';
import { db } from '@/lib/firebase';

// PATCH /api/admins/[id] - Update admin
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { role, permissions, name } = body;

    if (!db) {
      return NextResponse.json({ error: 'Database not available' }, { status: 500 });
    }

    const updates: any = {
      updatedAt: new Date().toISOString()
    };

    if (role) updates.role = role;
    if (permissions) updates.permissions = permissions;
    if (name) updates.displayName = name;

    await updateDoc(doc(db, 'users', params.id), updates);

    // Get updated user
    const userDoc = await getDocs(query(collection(db, 'users'), where('__name__', '==', params.id)));
    const updatedUser = {
      id: params.id,
      ...userDoc.docs[0]?.data()
    };

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error('Error updating admin:', error);
    return NextResponse.json(
      { error: 'Failed to update admin' }, 
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
    if (!db) {
      return NextResponse.json({ error: 'Database not available' }, { status: 500 });
    }

    await deleteDoc(doc(db, 'users', params.id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error removing admin:', error);
    return NextResponse.json(
      { error: 'Failed to remove admin' }, 
      { status: 500 }
    );
  }
} 