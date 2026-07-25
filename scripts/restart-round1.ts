/**
 * One-time fixup: wipe the unplayed round 1 of "Tournoi Woogles #1" and open a
 * fresh one whose window starts at 20:00 Benin time on 2026-07-25.
 *
 * The round generated on 2026-07-20 closed on the 23rd without a single game
 * being played, so there is nothing to preserve. Backdating the start to
 * tonight's 20:00 switch keeps the league on its 20:00 grid: the round closes
 * on 2026-07-28 at 20:00 instead of drifting to the 29th.
 *
 * Refuses to run if any match carries a result — this deletes matches outright.
 *
 * Usage: npx tsx scripts/restart-round1.ts
 */
import { getAdminDatabase } from '../src/lib/firebaseAdmin';
import { EventService } from '../src/api/services/EventService';
import { FirebaseEventRepository } from '../src/api/repository/FirebaseEventRepository';
import { formatLeagueTime, resolveRoundWindow } from '../src/lib/roundWindow';

const EVENT_ID = '-OxQqdRdjMkEgUGWXKRC';

/** 25/07/2026 20:00 au Bénin (UTC+1). */
const ROUND_START = '2026-07-25T19:00:00.000Z';

async function main() {
  const eventRepo = new FirebaseEventRepository();
  const eventService = new EventService();
  const db = getAdminDatabase();

  const event = await eventRepo.getEvent(EVENT_ID);
  if (!event?.metadata) throw new Error(`Event ${EVENT_ID} introuvable`);

  const existing = await eventRepo.getEventMatches(EVENT_ID);
  const played = existing.filter((m) => m.result || m.status === 'completed');
  if (played.length > 0) {
    throw new Error(
      `Refus : ${played.length} match(s) ont un résultat. ` +
        `Ce script supprime les matchs, il ne doit tourner que sur une ronde vierge.`
    );
  }
  console.log(`${existing.length} match(s) en attente, aucun résultat — on peut effacer.`);

  console.log('Suppression des matchs...');
  await db.ref(`matches/${EVENT_ID}`).remove();

  console.log('Remise à zéro de l\'état de ronde...');
  await eventRepo.updateEvent(EVENT_ID, {
    metadata: {
      ...event.metadata,
      currentRound: 1,
      totalMatches: 0,
      roundHistory: {},
      byeHistory: [],
      lastCompletedRound: undefined,
      completionHistory: [],
    },
  });
  // updateEvent fusionne : les clés remises à {} doivent être effacées à la main.
  await db.ref(`events/${EVENT_ID}/metadata/roundHistory`).remove();
  await db.ref(`events/${EVENT_ID}/metadata/byeHistory`).remove();

  console.log('Génération de la ronde 1...');
  const matches = await eventService.generatePairingsForRound(EVENT_ID, 1);

  // generatePairingsForRound ouvre la fenêtre à l'instant présent ; on la recale
  // sur la bascule de 20 h pour que la ronde dure 3 jours pile.
  console.log('Recalage de la fenêtre sur 20:00...');
  const startsAt = new Date(ROUND_START);
  const { endsAt } = resolveRoundWindow({ startsAt: ROUND_START }, 'ronde 1');
  await db.ref(`events/${EVENT_ID}/metadata/roundHistory/1`).update({
    date: startsAt.toISOString(),
    startsAt: startsAt.toISOString(),
    endsAt: endsAt.toISOString(),
  });

  console.log(`\nRonde 1 ouverte : ${formatLeagueTime(startsAt)} -> ${formatLeagueTime(endsAt)} (heure du club)`);
  console.log(`${matches.length} appariements :`);
  for (const m of matches) {
    console.log(`  ${m.player1.name} vs ${m.player2.id === 'BYE' ? 'BYE' : m.player2.name}`);
  }
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
