import { 
  getDatabase, 
  ref, 
  get, 
  set, 
  update, 
  remove, 
  child, 
  query as dbQuery,
  equalTo, 
  orderByChild,
  push,
  Database,
  DatabaseReference
} from 'firebase/database';
import { app } from '../../lib/firebase';

// Base class for all Firebase repositories
export class FirebaseBaseRepository {
  protected db: Database;

  constructor() {
    this.db = getDatabase(app);
  }

  // Helper method to get data from a path
  protected async getData<T>(path: string): Promise<T | null> {
    try {
      const snapshot = await get(ref(this.db, path));
      if (snapshot.exists()) {
        return snapshot.val();
      }
      return null;
    } catch (error) {
      console.error(`Error fetching data from ${path}:`, error);
      throw error;
    }
  }

  // Helper method to set data at a path
  protected async setData<T>(path: string, data: T): Promise<void> {
    try {
      await set(ref(this.db, path), data);
    } catch (error) {
      console.error(`Error setting data at ${path}:`, error);
      throw error;
    }
  }

  // Helper method to update data at a path
  protected async updateData(path: string, updates: any): Promise<void> {
    try {
      await update(ref(this.db, path), updates);
    } catch (error) {
      console.error(`Error updating data at ${path}:`, error);
      throw error;
    }
  }

  // Helper method to delete data at a path
  protected async deleteData(path: string): Promise<void> {
    try {
      await remove(ref(this.db, path));
    } catch (error) {
      console.error(`Error deleting data at ${path}:`, error);
      throw error;
    }
  }

  // Helper method to create entity with auto-generated ID
  protected async pushData<T>(path: string, data: any): Promise<string> {
    try {
      const newRef = push(ref(this.db, path));
      await set(newRef, data);
      return newRef.key || '';
    } catch (error) {
      console.error(`Error pushing data to ${path}:`, error);
      throw error;
    }
  }

  /**
   * Convert Firebase data with keys to array of objects with IDs
   * Optionally accepts a mapping function to transform each object
   */
  protected objectToArray<T, R = T & { id: string }>(
    obj: any, 
    mapFn?: (data: any, id: string) => R
  ): R[] {
    if (!obj) return [];
    
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
