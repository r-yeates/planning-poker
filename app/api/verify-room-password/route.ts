import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

export const runtime = 'nodejs';

async function sha256(text: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { roomCode, password } = body as { roomCode?: string; password?: string };

    if (!roomCode || typeof roomCode !== 'string') {
      return NextResponse.json({ error: 'roomCode is required' }, { status: 400 });
    }
    if (!password || typeof password !== 'string') {
      // No password provided — treat as incorrect
      return NextResponse.json({ valid: false });
    }
    if (password.length > 100) {
      return NextResponse.json({ valid: false });
    }

    const db = adminDb();

    // Look up the room by code
    const roomsSnap = await db
      .collection('rooms')
      .where('roomCode', '==', roomCode.toUpperCase())
      .limit(1)
      .get();

    if (roomsSnap.empty) {
      return NextResponse.json({ valid: false });
    }

    const roomDoc = roomsSnap.docs[0];
    const privateSnap = await roomDoc.ref
      .collection('private')
      .doc('access')
      .get();

    if (!privateSnap.exists) {
      // Room has no password set — allow access
      return NextResponse.json({ valid: true });
    }

    const { passwordHash } = privateSnap.data() as { passwordHash: string };
    const submittedHash = await sha256(password.trim());
    const valid = submittedHash === passwordHash;

    return NextResponse.json({ valid });
  } catch (err) {
    console.error('verify-room-password error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
