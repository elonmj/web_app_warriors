/**
 * Resets the real Firebase RTDB to a clean state and creates the club's
 * actual active roster (names only for now — Woogles usernames to be
 * added later via /admin/players).
 *
 * Usage: npx tsx scripts/seed-real-roster.ts
 */
import { getAdminDatabase } from '../src/lib/firebaseAdmin';
import { PlayerService } from '../src/api/services/PlayerService';

const ROSTER = [
  'Oslie',
  'Lorinda',
  'Tobi_Senin',
  'Gerse Assiba',
  'Orex Kady',
  'Bado',
  'Charbel',
  'Divin',
  'William',
  'Joselonm',
  'Mithrandir',
  'Naofal',
];

async function main() {
  const db = getAdminDatabase();

  console.log('Clearing players, events, matches, rankings...');
  await Promise.all([
    db.ref('players').remove(),
    db.ref('events').remove(),
    db.ref('matches').remove(),
    db.ref('rankings').remove(),
  ]);

  const playerService = new PlayerService();
  console.log(`Creating ${ROSTER.length} players...`);
  for (const name of ROSTER) {
    const player = await playerService.createPlayer({ name });
    console.log(`  + ${player.name} (id ${player.id})`);
  }

  console.log('\nDone. Add Woogles usernames via /admin/players when ready.');
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
