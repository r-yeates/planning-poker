// Superseded by /api/room (join), which verifies passwords with rate limiting.
// Kept as an inert stub so the old unthrottled oracle is gone. Safe to delete.
import { NextResponse } from 'next/server';

export function POST() {
  return NextResponse.json({ error: 'Gone' }, { status: 410 });
}
