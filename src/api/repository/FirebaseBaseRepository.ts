import fs from 'fs';
import path from 'path';

// Helper to get database path
const DB_FILE = path.join(process.cwd(), 'data', 'mock_db.json');

// Initialize database if it doesn't exist
function initializeMockDb() {
  const dir = path.dirname(DB_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  if (fs.existsSync(DB_FILE)) {
    return;
  }

  console.log('[MockDB] Initializing mock_db.json from backup data...');
  const db: any = {
    players: {},
    events: {},
    matches: {},
    rankings: {}
  };

  // 1. Load players
  const playersPath = path.join(process.cwd(), 'data', 'players.json');
  if (fs.existsSync(playersPath)) {
    try {
      const playersData = JSON.parse(fs.readFileSync(playersPath, 'utf8'));
      const playersList = playersData.players || [];
      for (const p of playersList) {
        db.players[String(p.id)] = p;
      }
    } catch (e) {
      console.error('Error loading players backup:', e);
    }
  }

  // 2. Load events
  const eventsPath = path.join(process.cwd(), 'data', 'events.json');
  if (fs.existsSync(eventsPath)) {
    try {
      const eventsData = JSON.parse(fs.readFileSync(eventsPath, 'utf8'));
      const eventsList = eventsData.events || [];
      for (const e of eventsList) {
        db.events[String(e.id)] = {
          ...e,
          startDate: e.startDate,
          endDate: e.endDate
        };
      }
    } catch (err) {
      console.error('Error loading events backup:', err);
    }
  }

  // 3. Load matches
  const matchesRound1Path = path.join(process.cwd(), 'data', 'matches', 'mentoring-league-2025-02', '1.json');
  if (fs.existsSync(matchesRound1Path)) {
    try {
      const round1Data = JSON.parse(fs.readFileSync(matchesRound1Path, 'utf8'));
      const eventId = round1Data.eventId || 'mentoring-league-2025-02';
      db.matches[eventId] = {};
      const matchesList = round1Data.matches || [];
      for (const m of matchesList) {
        db.matches[eventId][m.id] = m;
      }
    } catch (err) {
      console.error('Error loading matches backup:', err);
    }
  }

  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf8');
  console.log('[MockDB] mock_db.json successfully initialized.');
}

// Call initialization immediately
initializeMockDb();

function readDb(): any {
  try {
    if (!fs.existsSync(DB_FILE)) {
      initializeMockDb();
    }
    const data = fs.readFileSync(DB_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('[MockDB] Error reading mock_db.json:', error);
    return { players: {}, events: {}, matches: {}, rankings: {} };
  }
}

function writeDb(db: any): void {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf8');
  } catch (error) {
    console.error('[MockDB] Error writing mock_db.json:', error);
  }
}

export class FirebaseBaseRepository {
  protected db: any;

  constructor() {
    this.db = null; // Bypassed
  }

  protected async getData<T>(pathStr: string): Promise<T | null> {
    try {
      console.log('[MockDB] Fetching data from path:', pathStr);
      const db = readDb();
      const parts = pathStr.split('/').filter(Boolean);
      
      let current = db;
      for (const part of parts) {
        if (current === null || current === undefined) {
          return null;
        }
        current = current[part];
      }
      
      const rawData = current !== undefined ? current : null;
      console.log('[MockDB] Raw data from path:', {
        path: pathStr,
        exists: rawData !== null,
        type: typeof rawData,
        isArray: Array.isArray(rawData),
        keys: rawData && typeof rawData === 'object' ? Object.keys(rawData) : []
      });
      return rawData as T;
    } catch (error) {
      console.error(`[MockDB] Error fetching data from ${pathStr}:`, error);
      throw error;
    }
  }

  protected async setData<T>(pathStr: string, data: T): Promise<void> {
    try {
      console.log('[MockDB] Setting data at path:', pathStr);
      const db = readDb();
      const parts = pathStr.split('/').filter(Boolean);
      
      let current = db;
      for (let i = 0; i < parts.length - 1; i++) {
        const part = parts[i];
        if (current[part] === undefined || current[part] === null) {
          current[part] = {};
        }
        current = current[part];
      }
      current[parts[parts.length - 1]] = data;
      
      writeDb(db);
    } catch (error) {
      console.error(`Error setting data at ${pathStr}:`, error);
      throw error;
    }
  }

  protected async updateData(pathStr: string, updates: any): Promise<void> {
    try {
      console.log('[MockDB] Updating data at path:', pathStr, updates);
      const db = readDb();
      const parts = pathStr.split('/').filter(Boolean);
      
      let current = db;
      for (let i = 0; i < parts.length - 1; i++) {
        const part = parts[i];
        if (current[part] === undefined || current[part] === null) {
          current[part] = {};
        }
        current = current[part];
      }
      
      const lastPart = parts[parts.length - 1];
      if (current[lastPart] === undefined || current[lastPart] === null || typeof current[lastPart] !== 'object') {
        current[lastPart] = {};
      }
      current[lastPart] = { ...current[lastPart], ...updates };
      
      writeDb(db);
    } catch (error) {
      console.error(`Error updating data at ${pathStr}:`, error);
      throw error;
    }
  }

  protected async deleteData(pathStr: string): Promise<void> {
    try {
      console.log('[MockDB] Deleting data at path:', pathStr);
      const db = readDb();
      const parts = pathStr.split('/').filter(Boolean);
      
      let current = db;
      for (let i = 0; i < parts.length - 1; i++) {
        const part = parts[i];
        if (current[part] === undefined || current[part] === null) {
          return;
        }
        current = current[part];
      }
      delete current[parts[parts.length - 1]];
      
      writeDb(db);
    } catch (error) {
      console.error(`Error deleting data at ${pathStr}:`, error);
      throw error;
    }
  }

  protected async pushData<T>(pathStr: string, data: any): Promise<string> {
    try {
      console.log('[MockDB] Pushing data to path:', pathStr);
      const db = readDb();
      const parts = pathStr.split('/').filter(Boolean);
      
      let current = db;
      for (const part of parts) {
        if (current[part] === undefined || current[part] === null) {
          current[part] = {};
        }
        current = current[part];
      }
      
      const newKey = 'id_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      current[newKey] = { ...data, id: newKey };
      
      writeDb(db);
      return newKey;
    } catch (error) {
      console.error(`Error pushing data to ${pathStr}:`, error);
      throw error;
    }
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
