/**
 * One-time migration: push the local mock_db.json (the club's real data,
 * accumulated while the app ran on a local JSON file) into the real
 * Firebase Realtime Database, now that repositories talk to it for real.
 *
 * This OVERWRITES /players, /events, /matches, /rankings on the real DB —
 * safe here because those nodes currently only hold stale test data
 * (1 test event, 2 test players) confirmed via a prior read.
 *
 * Usage: npx tsx scripts/migrate-to-real-firebase.ts [--dry-run]
 */
import { readFileSync } from 'fs';
import { join } from 'path';
import { getAdminDatabase } from '../src/lib/firebaseAdmin';

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  const dbFile = join(process.cwd(), 'data', 'mock_db.json');
  const mockDb = JSON.parse(readFileSync(dbFile, 'utf8'));

  const nodes: Record<string, unknown> = {
    players: mockDb.players ?? {},
    events: mockDb.events ?? {},
    matches: mockDb.matches ?? {},
    rankings: mockDb.rankings ?? {},
  };

  for (const [key, value] of Object.entries(nodes)) {
    const count = Object.keys(value as object).length;
    console.log(`${key}: ${count} top-level entries`);
  }

  if (dryRun) {
    console.log('\nDry run — nothing written.');
    return;
  }

  const db = getAdminDatabase();
  for (const [key, value] of Object.entries(nodes)) {
    await db.ref(key).set(value);
    console.log(`Wrote /${key}`);
  }

  console.log('\nMigration complete.');
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
