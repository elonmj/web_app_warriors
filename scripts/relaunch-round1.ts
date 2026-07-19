/**
 * One-time fixup: apply the confirmed Woogles usernames, swap Orex Kady
 * for Joaïda in the roster, and regenerate round 1 of "Tournoi Woogles #1"
 * dated for 2026-07-20 (nobody has played round 1 yet — all matches were
 * still pending).
 *
 * Usage: npx tsx scripts/relaunch-round1.ts
 */
import { getAdminDatabase } from '../src/lib/firebaseAdmin';
import { PlayerService } from '../src/api/services/PlayerService';
import { EventService } from '../src/api/services/EventService';
import { FirebasePlayerRepository } from '../src/api/repository/FirebasePlayerRepository';
import { FirebaseEventRepository } from '../src/api/repository/FirebaseEventRepository';

const EVENT_ID = '-OxQqdRdjMkEgUGWXKRC';
const ROUND_DATE = '2026-07-20T00:00:00.000Z';

const USERNAME_UPDATES: Record<string, string> = {
  Oslie: 'Oslie',
  Lorinda: 'Fofolle24',
  'Gerse Assiba': 'Sunny15',
  Charbel: 'Klenz',
  Divin: 'Divino',
  William: 'Escanor',
  Joselonm: 'joselonm',
  Mithrandir: 'Mithrandir',
  Naofal: 'Naofal',
};

async function main() {
  const playerRepo = new FirebasePlayerRepository();
  const eventRepo = new FirebaseEventRepository();
  const playerService = new PlayerService();
  const eventService = new EventService();
  const db = getAdminDatabase();

  const players = await playerRepo.getAllPlayers();

  console.log('Updating Woogles usernames...');
  for (const [name, wooglesUsername] of Object.entries(USERNAME_UPDATES)) {
    const player = players.find((p) => p.name === name);
    if (!player) {
      console.warn(`  ! Player "${name}" not found, skipping`);
      continue;
    }
    await playerService.updatePlayer(player.id, { wooglesUsername });
    console.log(`  + ${name} -> ${wooglesUsername}`);
  }

  console.log('Fixing Tobi_Senin -> Foréol...');
  const tobi = players.find((p) => p.name === 'Tobi_Senin');
  if (!tobi) throw new Error('Player "Tobi_Senin" not found');
  await playerService.updatePlayer(tobi.id, {
    name: 'Foréol',
    wooglesUsername: 'Tobi_Senin',
  });
  console.log(`  + ${tobi.id}: name -> Foréol, wooglesUsername -> Tobi_Senin`);

  console.log('Creating Joaïda...');
  const joaida = await playerService.createPlayer({
    name: 'Joaïda',
    wooglesUsername: 'Val-kyrie',
  });
  console.log(`  + Joaïda (id ${joaida.id})`);

  const orexKady = players.find((p) => p.name === 'Orex Kady');
  if (!orexKady) throw new Error('Player "Orex Kady" not found');

  console.log('Updating event roster (swap Orex Kady -> Joaïda)...');
  await eventService.removeParticipant(EVENT_ID, orexKady.id);
  await eventService.addParticipant(EVENT_ID, joaida.id);

  console.log('Clearing round 1 matches...');
  await db.ref(`matches/${EVENT_ID}`).remove();

  console.log('Resetting event round state...');
  await eventRepo.updateEvent(EVENT_ID, {
    startDate: new Date(ROUND_DATE),
    metadata: {
      ...(await eventRepo.getEvent(EVENT_ID))!.metadata,
      currentRound: 1,
      totalMatches: 0,
      roundHistory: [null as any],
    },
  });

  console.log('Regenerating round 1 pairings...');
  const matches = await eventService.generatePairingsForRound(EVENT_ID, 1);
  console.log(`  + ${matches.length} matches created`);

  console.log('Setting round 1 date to 2026-07-20...');
  await db.ref(`events/${EVENT_ID}/metadata/roundHistory/1/date`).set(ROUND_DATE);

  console.log('\nDone.');
  for (const m of matches) {
    console.log(`  ${m.player1.name} vs ${m.player2.name}`);
  }
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
