import { cert, getApps, initializeApp, type App } from 'firebase-admin/app';
import { getDatabase, type Database } from 'firebase-admin/database';

const DATABASE_URL =
  process.env.FIREBASE_DATABASE_URL ??
  'https://wwl-faizers-default-rtdb.europe-west1.firebasedatabase.app';

/**
 * Server-only Firebase Admin client. Never import this from client components.
 *
 * Credentials resolution (no key file needed in either case):
 * - Local dev: Application Default Credentials from `gcloud auth application-default login`.
 * - Deployed on Firebase Hosting (Cloud Functions/Cloud Run backend): the
 *   runtime's attached service account is picked up automatically.
 *
 * If FIREBASE_SERVICE_ACCOUNT_JSON is set (stringified service account key),
 * it takes precedence — useful for hosts outside Google Cloud (e.g. Vercel).
 */
function getAdminApp(): App {
  const existing = getApps();
  if (existing.length > 0) return existing[0];

  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (serviceAccountJson) {
    return initializeApp({
      credential: cert(JSON.parse(serviceAccountJson)),
      databaseURL: DATABASE_URL,
    });
  }

  // Application Default Credentials (gcloud ADC locally, attached service
  // account when deployed on Google Cloud / Firebase Hosting).
  return initializeApp({ databaseURL: DATABASE_URL });
}

let db: Database | null = null;

export function getAdminDatabase(): Database {
  if (!db) {
    db = getDatabase(getAdminApp());
  }
  return db;
}
