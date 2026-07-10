import { NextRequest, NextResponse } from 'next/server';
import { FirebaseEventRepository } from '@/api/repository/FirebaseEventRepository';
import { FirebasePlayerRepository } from '@/api/repository/FirebasePlayerRepository';
import { MatchService } from '@/api/services/MatchService';
import { RankingService } from '@/api/services/RankingService';
import { iscService } from '@/api/services/ISCService';

const eventRepository = new FirebaseEventRepository();
const playerRepository = new FirebasePlayerRepository();
const matchService = new MatchService();
const rankingService = new RankingService();

export async function GET(request: NextRequest) {
  console.log('[CRON] Starting weekly match auto-resolve job');

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
    const credentials = {
      username: process.env.ISC_USERNAME!,
      password: process.env.ISC_PASSWORD!
    };
    const hasCredentials = !!(credentials.username && credentials.password);

    // Default deadline of 7 days
    const url = new URL(request.url);
    const deadlineDays = Number(url.searchParams.get('days') || '7');

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

      const roundStartDate = new Date(roundStats.date || event.startDate);
      const now = new Date();
      const diffMs = now.getTime() - roundStartDate.getTime();
      const diffDays = diffMs / (1000 * 60 * 60 * 24);
      const isPastDeadline = diffDays > deadlineDays;

      console.log(`[CRON] Processing Event ${eventId} (Round ${round})`);
      console.log(`[CRON] Round start date: ${roundStartDate.toISOString()}. Days elapsed: ${diffDays.toFixed(2)}. Past deadline: ${isPastDeadline}`);

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

          let iscSucceeded = false;

          // Try to fetch from ISC if usernames are registered
          if (hasCredentials && player1.iscUsername && player2.iscUsername) {
            try {
              console.log(`[CRON] Scraping ISC for match ${match.id} between ${player1.iscUsername} and ${player2.iscUsername}`);
              const iscResult = await iscService.fetchMatchResult(
                { iscUsername: player1.iscUsername },
                { iscUsername: player2.iscUsername },
                credentials
              );

              if (iscResult && typeof iscResult.player1Score === 'number' && typeof iscResult.player2Score === 'number') {
                console.log(`[CRON] Found result for match ${match.id}: ${iscResult.player1Score} - ${iscResult.player2Score}`);
                await matchService.processMatchResult(match, {
                  matchId: match.id,
                  eventId: match.eventId,
                  score: {
                    player1Score: iscResult.player1Score,
                    player2Score: iscResult.player2Score
                  }
                });
                syncedCount++;
                iscSucceeded = true;
              }
            } catch (iscError) {
              console.error(`[CRON] ISC fetch failed for match ${match.id}:`, iscError instanceof Error ? iscError.message : iscError);
              errors.push(`Match ${player1.name} vs ${player2.name}: ISC fetch failed.`);
            }
          }

          // Double forfeit if past deadline and ISC sync did not succeed
          if (!iscSucceeded && isPastDeadline) {
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

      results.push({
        eventId,
        eventName: event.name,
        round,
        syncedCount,
        forfeitCount,
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
