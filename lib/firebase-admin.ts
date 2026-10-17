import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

function getAdminApp() {
  if (getApps().length > 0) return getApps()[0];

  // The emulators need no credentials; the Admin SDK finds them through the *_EMULATOR_HOST variables
  if (process.env.FIRESTORE_EMULATOR_HOST && process.env.FIREBASE_AUTH_EMULATOR_HOST) {
    return initializeApp({ projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID });
  }

  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!serviceAccountJson) {
    throw new Error(
      'FIREBASE_SERVICE_ACCOUNT_JSON environment variable is not set. ' +
      'Generate a service account key from Firebase Console → Project Settings → Service Accounts.'
    );
  }

  return initializeApp({
    credential: cert(JSON.parse(serviceAccountJson)),
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  });
}

export function adminDb() {
  getAdminApp();
  return getFirestore();
}

export function adminAuth() {
  getAdminApp();
  return getAuth();
}
