import { auth, ensureAnonymousAuth } from './firebase';

export class RoomApiError extends Error {
  constructor(message: string, public status: number, public code?: string) {
    super(message);
  }
}

/** Calls /api/room as the signed-in user. Throws RoomApiError with a user-presentable message. */
export async function roomAction<T = { ok: true }>(
  action: string,
  payload: Record<string, unknown> = {}
): Promise<T> {
  await ensureAnonymousAuth();
  const token = await auth.currentUser?.getIdToken();
  if (!token) throw new RoomApiError('Could not sign in. Please reload the page.', 401);

  let res: Response;
  try {
    res = await fetch('/api/room', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ action, ...payload }),
    });
  } catch {
    throw new RoomApiError('Network error. Check your connection and try again.', 0);
  }

  const data = (await res.json().catch(() => ({}))) as { error?: string; code?: string };
  if (!res.ok) throw new RoomApiError(data.error || 'Something went wrong. Please try again.', res.status, data.code);
  return data as T;
}
