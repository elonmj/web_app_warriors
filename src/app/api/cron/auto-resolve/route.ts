import { NextRequest, NextResponse } from 'next/server';
import { FirebaseEventRepository } from '@/api/repository/FirebaseEventRepository';
import { FirebasePlayerRepository } from '@/api/repository/FirebasePlayerRepository';
import { MatchService } from '@/api/services/MatchService';
import { RankingService } from '@/api/services/RankingService';
import { wooglesService } from '@/api/services/WooglesService';
import { gamePersistenceService } from '@/api/services/GamePersistenceService';
import { resolveRoundWindow, isRoundOver, formatLeagueTime } from '@/lib/roundWindow';
import { EventService } from '@/api/services/EventService';
import { attendanceService } from '@/api/services/AttendanceService';

const eventRepository = new FirebaseEventRepository();
const playerRepository = new FirebasePlayerRepository();
const matchService = new MatchService();
const rankingService = new RankingService();
const eventService = new EventService();

/**
 * Tick quotidien de la ligue (Règlement V3 §III.A).
 *
 * Programmé à 19 h UTC = 20 h au Bénin. Il tourne tous les jours mais n'agit
 * qu'aux échéances : entre deux bascules il se contente de récupérer sur
 * Woogles les parties déjà jouées. Quand la fenêtre de la ronde est écoulée,
 * il tranche les matchs non joués, clôt la ronde, applique l'assiduité et
 * ouvre la ronde suivante — sans aucune intervention humaine.
 */
export async function GET(request: NextRequest) {
  console.log('[CRON] Tick de ligue — résolution des matchs et bascule de ronde');

  // Verify CRON_SECRET if configured
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    console.warn('[CRON] Unauthorized cron execution attempt');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // 1. Get all events
    const allEvents = await eventRepository.getAllEvents();
    const activeEvents = allEvents.filter(e => e.status === 'in_progress');

    console.log(`[CRON] Found ${activeEvents.length} active events to process`);

    if (activeEvents.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No active events to process.',
        results: []
      });
    }

    const results = [];

    // 2. Iterate through active events
    for (const event of activeEvents) {
      const eventId = event.id;
      if (!event.metadata) {
        console.log(`[CRON] Event ${eventId} metadata is missing. Skipping.`);
        continue;
      }
      const round = event.metadata.currentRound;

      if (!round) {
        console.log(`[CRON] Event ${eventId} has no active round. Skipping.`);
        continue;
      }

      const roundStats = event.metadata.roundHistory?.[round];
      if (!roundStats) {
        console.log(`[CRON] Event ${eventId} metadata for round ${round} is missing. Skipping.`);
        continue;
      }

      // Fenêtre de ronde : seule référence pour décider si une partie compte.
      // Aucun repli sur event.startDate — deviner reviendrait à accepter
      // n'importe quelle partie jouée depuis la création de la ligue.
      let window;
      try {
        window = resolveRoundWindow(roundStats, `event ${eventId}, ronde ${round}`);
      } catch (windowError) {
        const message = windowError instanceof Error ? windowError.message : String(windowError);
        console.error(`[CRON] ${message} — événement ignoré.`);
        results.push({
          eventId,
          eventName: event.name,
          round,
          syncedCount: 0,
          forfeitCount: 0,
          errors: [message]
        });
        continue;
      }

      const isPastDeadline = isRoundOver(window);

      console.log(`[CRON] Processing Event ${eventId} (Round ${round})`);
      console.log(
        `[CRON] Fenêtre de ronde : ${formatLeagueTime(window.startsAt)} → ` +
          `${formatLeagueTime(window.endsAt)} (heure Bénin). Ronde terminée : ${isPastDeadline}`
      );

      // Fetch round matches
      const matches = await eventRepository.getRoundMatches(eventId, round);
      const pendingMatches = matches.filter(m => m.status === 'pending');

      if (pendingMatches.length === 0) {
        console.log(`[CRON] Event ${eventId} has no pending matches in round ${round}.`);
        continue;
      }

      let syncedCount = 0;
      let forfeitCount = 0;
      const errors: string[] = [];

      // Process each pending match
      for (const match of pendingMatches) {
        try {
          const player1 = await playerRepository.getPlayer(match.player1.id);
          const player2 = await playerRepository.getPlayer(match.player2.id);

          if (!player1 || !player2) {
            continue;
          }

          let wooglesSucceeded = false;
          const u1 = player1.wooglesUsername ?? player1.iscUsername;
          const u2 = player2.wooglesUsername ?? player2.iscUsername;

          // Try to fetch the game from Woogles if usernames are registered
          if (u1 && u2) {
            try {
              console.log(`[CRON] Fetching Woogles game for match ${match.id} between ${u1} and ${u2}`);
              const game = await wooglesService.findMatchInWindow(u1, u2, window);

              if (game) {
                const s1 = wooglesService.scoreFor(game, u1);
                const s2 = wooglesService.scoreFor(game, u2);
                console.log(`[CRON] Found result for match ${match.id}: ${s1} - ${s2}`);
                await matchService.processMatchResult(match, {
                  matchId: match.id,
                  eventId: match.eventId,
                  score: { player1Score: s1, player2Score: s2 }
                });
                syncedCount++;
                wooglesSucceeded = true;
                // Persist the game + statistical analysis (fire-and-forget)
                void gamePersistenceService.persistAndAnalyze(game, {
                  matchId: match.id,
                  eventId: match.eventId
                });
              }
            } catch (wooglesError) {
              console.error(`[CRON] Woogles fetch failed for match ${match.id}:`, wooglesError instanceof Error ? wooglesError.message : wooglesError);
              errors.push(`Match ${player1.name} vs ${player2.name}: Woogles fetch failed.`);
            }
          }

          // Double forfeit if past deadline and Woogles sync did not succeed
          if (!wooglesSucceeded && isPastDeadline) {
            console.log(`[CRON] Declaring double forfeit for match ${match.id} (past deadline)`);
            await matchService.processDoubleForfeit(match);
            forfeitCount++;
          }
        } catch (matchError) {
          console.error(`[CRON] Error processing match ${match.id}:`, matchError);
          errors.push(`Match ID ${match.id}: ${matchError instanceof Error ? matchError.message : 'Unknown error'}`);
        }
      }

      // Update round rankings and metadata if any match got resolved
      if (syncedCount > 0 || forfeitCount > 0) {
        console.log(`[CRON] Updating rankings for event ${eventId}, round ${round}`);
        await rankingService.updateRoundRankings(eventId, round);

        const updatedMatches = await eventRepository.getRoundMatches(eventId, round);
        const completedCount = updatedMatches.filter(m => m.status === 'completed' || m.status === 'forfeit').length;

        const currentEvent = await eventRepository.getEvent(eventId);
        if (currentEvent && currentEvent.metadata) {
          const metadataUpdates = {
            ...currentEvent.metadata,
            roundHistory: {
              ...currentEvent.metadata.roundHistory,
              [round]: {
                ...currentEvent.metadata.roundHistory[round],
                completedMatches: completedCount
              }
            },
            lastUpdated: new Date().toISOString()
          };
          await eventRepository.updateEvent(eventId, { metadata: metadataUpdates });
        }
      }

      // ---- Bascule de ronde (Règlement V3 §III.A) ----
      // La ronde échue est close, l'assiduité appliquée, puis la suivante est
      // ouverte. Le tick est quotidien mais n'agit qu'aux échéances : entre
      // deux bascules il se contente de récupérer les parties jouées.
      let closedRound = false;
      let nextRound: number | undefined;
      let fellAsleep: string[] = [];
      let wokeUp: string[] = [];

      // `completedAt` sert de garde d'idempotence : sans lui, un échec de
      // génération ferait repasser tout le monde à la caisse au tick suivant.
      const alreadyClosed = !!roundStats.completedAt;

      if (isPastDeadline && !alreadyClosed) {
        try {
          const resolvedMatches = await eventRepository.getRoundMatches(eventId, round);

          const eventToClose = await eventRepository.getEvent(eventId);
          if (eventToClose?.metadata) {
            await eventRepository.updateEvent(eventId, {
              metadata: {
                ...eventToClose.metadata,
                roundHistory: {
                  ...eventToClose.metadata.roundHistory,
                  [round]: {
                    ...eventToClose.metadata.roundHistory[round],
                    completedAt: new Date().toISOString()
                  }
                },
                lastCompletedRound: round,
                lastUpdated: new Date().toISOString()
              }
            });
          }
          closedRound = true;

          const outcome = await attendanceService.applyRoundAttendance(resolvedMatches);
          fellAsleep = outcome.fellAsleep;
          wokeUp = outcome.wokeUp;
          console.log(
            `[CRON] Ronde ${round} close. ${outcome.missed.length} absence(s), ` +
              `${outcome.fellAsleep.length} mise(s) en sommeil, ${outcome.wokeUp.length} réveil(s).`
          );
        } catch (closeError) {
          const message = closeError instanceof Error ? closeError.message : String(closeError);
          console.error(`[CRON] Échec de la clôture de la ronde ${round}:`, message);
          errors.push(`Clôture ronde ${round} : ${message}`);
        }
      }

      // Génération de la ronde suivante — tentée aussi quand la clôture a eu
      // lieu à un tick précédent mais que la génération avait échoué.
      if (isPastDeadline) {
        try {
          const refreshed = await eventRepository.getEvent(eventId);
          if (refreshed?.metadata?.currentRound === round) {
            await eventService.generatePairingsForRound(eventId, round + 1);
            nextRound = round + 1;
            console.log(`[CRON] Ronde ${nextRound} générée pour l'événement ${eventId}.`);
          }
        } catch (pairingError) {
          const message = pairingError instanceof Error ? pairingError.message : String(pairingError);
          console.error(`[CRON] Échec de la génération de la ronde ${round + 1}:`, message);
          errors.push(`Génération ronde ${round + 1} : ${message}`);
        }
      }

      results.push({
        eventId,
        eventName: event.name,
        round,
        syncedCount,
        forfeitCount,
        closedRound,
        nextRound,
        fellAsleep,
        wokeUp,
        errors
      });
    }

    return NextResponse.json({
      success: true,
      message: `Cron job completed. Processed ${results.length} active events.`,
      results
    });

  } catch (error) {
    console.error('[CRON] Error in weekly auto-resolve job:', error);
    const message = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ error: 'Cron job failed', details: message }, { status: 500 });
  }
}
