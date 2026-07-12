import { getAdminDatabase } from '@/lib/firebaseAdmin';

/**
 * Unlike the mock JSON store this replaces, real RTDB rejects `undefined`
 * values outright. Strip them recursively (RTDB has no concept of "key
 * present with no value" anyway — omitting the key is the correct encoding).
 */
function stripUndefined<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map(stripUndefined) as unknown as T;
  }
  if (value !== null && typeof value === 'object' && !(value instanceof Date)) {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (v !== undefined) out[k] = stripUndefined(v);
    }
    return out as T;
  }
  return value;
}

/**
 * Base repository backed by the real Firebase Realtime Database via
 * firebase-admin (server-only, bypasses security rules using the runtime's
 * credentials). All subclasses call the methods below with RTDB paths.
 */
export class FirebaseBaseRepository {
  protected async getData<T>(pathStr: string): Promise<T | null> {
    const snapshot = await getAdminDatabase().ref(pathStr).get();
    return snapshot.exists() ? (snapshot.val() as T) : null;
  }

  protected async setData<T>(pathStr: string, data: T): Promise<void> {
    await getAdminDatabase().ref(pathStr).set(stripUndefined(data));
  }

  protected async updateData(pathStr: string, updates: any): Promise<void> {
    await getAdminDatabase().ref(pathStr).update(stripUndefined(updates));
  }

  protected async deleteData(pathStr: string): Promise<void> {
    await getAdminDatabase().ref(pathStr).remove();
  }

  protected async pushData<T>(pathStr: string, data: any): Promise<string> {
    const newRef = getAdminDatabase().ref(pathStr).push();
    const id = newRef.key as string;
    await newRef.set(stripUndefined({ ...data, id }));
    return id;
  }

  protected objectToArray<T, R = T & { id: string }>(
    obj: any,
    mapFn?: (data: any, id: string) => R
  ): R[] {
    if (!obj) {
      return [];
    }

    return Object.entries(obj).map(([id, data]) => {
      if (mapFn) {
        return mapFn(data, id);
      }

      return {
        id,
        ...data as any
      } as R;
    });
  }
}
