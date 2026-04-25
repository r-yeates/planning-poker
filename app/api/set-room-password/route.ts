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
    const { roomId, password } = body as { roomId?: string; password?: string };

    if (!roomId || typeof roomId !== 'string') {
      return NextResponse.json({ error: 'roomId is required' }, { status: 400 });
    }
    if (!password || typeof password !== 'string') {
      return NextResponse.json({ error: 'password is required' }, { status: 400 });
    }
    if (password.length > 100) {
      return NextResponse.json({ error: 'Password too long' }, { status: 400 });
    }

    const hash = await sha256(password.trim());
    const db = adminDb();
    await db
      .collection('rooms')
      .doc(roomId)
      .collection('private')
      .doc('access')
      .set({ passwordHash: hash });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('set-room-password error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
