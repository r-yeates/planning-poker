// Superseded by /api/room (create/join). Kept as an inert stub so the old
// unauthenticated endpoint can no longer overwrite room passwords. Safe to delete.
import { NextResponse } from 'next/server';

export function POST() {
  return NextResponse.json({ error: 'Gone' }, { status: 410 });
}
