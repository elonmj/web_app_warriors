import { NextRequest, NextResponse } from 'next/server';
import { FirebaseEventRepository } from '@/api/repository/FirebaseEventRepository';
import { FirebasePlayerRepository } from '@/api/repository/FirebasePlayerRepository';
import { MatchService } from '@/api/services/MatchService';
import { RankingService } from '@/api/services/RankingService';
import { wooglesService } from '@/api/services/WooglesService';
import { gamePersistenceService } from '@/api/services/GamePersistenceService';
import { verifyPassword } from '@/lib/auth';
import { Match } from '@/types/Match';
import { Player } from '@/types/Player';

const eventRepository = new FirebaseEventRepository();
const playerRepository = new FirebasePlayerRepository();
const matchService = new MatchService();
const rankingService = new RankingService();

export async function POST(
  request: NextRequest,
  { params }: { params: { eventId: string } }
) {
  const { eventId } = params;
  console.log(`[API] Received manual sync request for event: ${eventId}`);

  // 1. Verify Admin Password
  const password = request.headers.get('X-Admin-Password');
  if (!password) {
    console.log(`[API] Missing X-Admin-Password header for event sync: ${eventId}`);
    return NextResponse.json({ error: 'Admin password required' }, { status: 401 });
  }

  const isPasswordValid = await verifyPassword(password);
  if (!isPasswordValid) {
    console.log(`[API] Invalid admin password for event sync: ${eventId}`);
    return NextResponse.json({ error: 'Invalid admin password' }, { status: 403 });
  }
  console.log(`[API] Admin password verified for event sync: ${eventId}`);

  try {
    // 2. Fetch the event
    const event = await eventRepository.getEvent(eventId);
    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    if (event.status !== 'in_progress') {
      return NextResponse.json({ error: 'Event is not active (in progress)' }, { status: 400 });
    }

    if (!event.metadata) {
      return NextResponse.json({ error: 'Event metadata is missing' }, { status: 400 });
    }

    const round = event.metadata.currentRound;
    if (!round) {
      return NextResponse.json({ error: 'No active round found for this event' }, { status: 400 });
    }

    const roundStats = event.metadata.roundHistory[round];
    if (!roundStats) {
      return NextResponse.json({ error: `Metadata for round ${round} is missing` }, { status: 400 });
    }

    // 3. Determine deadline threshold (default 7 days)
    const url = new URL(request.url);
    const deadlineDays = Number(url.searchParams.get('days') || '7');
    const roundStartDate = new Date(roundStats.date || event.startDate);
    const now = new Date();
    const diffMs = now.getTime() - roundStartDate.getTime();
    const diffDays = diffMs / (1000 * 60 * 60 * 24);
    const isPastDeadline = diffDays > deadlineDays;

    console.log(`[API] Round start date: ${roundStartDate.toISOString()}, current date: ${now.toISOString()}`);
    console.log(`[API] Days elapsed: ${diffDays.toFixed(2)}, threshold: ${deadlineDays} days. Past deadline: ${isPastDeadline}`);

    // 4. Fetch round matches
    const matches = await eventRepository.getRoundMatches(eventId, round);
    const pendingMatches = matches.filter(m => m.status === 'pending');

    console.log(`[API] Total matches in round ${round}: ${matches.length}, pending: ${pendingMatches.length}`);

    if (pendingMatches.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No pending matches to resolve for this round.',
        syncedCount: 0,
        forfeitCount: 0,
        errors: []
      });
    }

    let syncedCount = 0;
    let forfeitCount = 0;
    const errors: string[] = [];

    // 5. Process each pending match
    for (const match of pendingMatches) {
      try {
        const player1 = await playerRepository.getPlayer(match.player1.id);
        const player2 = await playerRepository.getPlayer(match.player2.id);

        if (!player1 || !player2) {
          console.warn(`[API] Players not found for match ${match.id}`);
          continue;
        }

        let wooglesSucceeded = false;
        const u1 = player1.wooglesUsername ?? player1.iscUsername;
        const u2 = player2.wooglesUsername ?? player2.iscUsername;

        // Try to fetch the game from Woogles if usernames are available
        if (u1 && u2) {
          try {
            console.log(`[API] Fetching Woogles game for match ${match.id} (${u1} vs ${u2})`);
            const game = await wooglesService.findMatchBetween(
              u1,
              u2,
              roundStartDate.toISOString()
            );

            if (game) {
              const s1 = wooglesService.scoreFor(game, u1);
              const s2 = wooglesService.scoreFor(game, u2);
              console.log(`[API] Found Woogles result for match ${match.id}: ${s1} - ${s2}`);
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
            console.error(`[API] Woogles fetch failed for match ${match.id}:`, wooglesError instanceof Error ? wooglesError.message : wooglesError);
            errors.push(`Match ${player1.name} vs ${player2.name}: Woogles fetch failed.`);
          }
        } else {
          console.log(`[API] Missing Woogles usernames for match ${match.id} (p1: ${u1 || 'none'}, p2: ${u2 || 'none'})`);
        }

        // If the Woogles search failed/was skipped, and we are past the round deadline, auto double forfeit
        if (!wooglesSucceeded && isPastDeadline) {
          console.log(`[API] Declaring double forfeit for match ${match.id} past deadline`);
          await matchService.processDoubleForfeit(match);
          forfeitCount++;
        }
      } catch (matchError) {
        console.error(`[API] Error processing match ${match.id}:`, matchError);
        errors.push(`Match ID ${match.id}: ${matchError instanceof Error ? matchError.message : 'Unknown error'}`);
      }
    }

    // 6. Update round rankings if updates occurred
    if (syncedCount > 0 || forfeitCount > 0) {
      console.log(`[API] Updating rankings for event ${eventId}, round ${round}`);
      await rankingService.updateRoundRankings(eventId, round);

      // Re-calculate the completed matches count in roundHistory
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

    return NextResponse.json({
      success: true,
      message: `Sync complete. Synced ${syncedCount} matches from Woogles. Double-forfeited ${forfeitCount} matches.`,
      syncedCount,
      forfeitCount,
      errors
    });

  } catch (error) {
    console.error(`[API] Error during manual sync for event ${eventId}:`, error);
    const message = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ error: 'Failed to sync event', details: message }, { status: 500 });
  }
}
