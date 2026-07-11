import { NextResponse } from 'next/server';
import { wooglesService } from '@/api/services/WooglesService';

/**
 * POST /api/matches/woogles/fetch
 * Body: { player1: { wooglesUsername }, player2: { wooglesUsername }, since?: ISO date }
 * Finds the most recent finished game between the two usernames on Woogles.io.
 * No credentials needed — public games are readable via the public API.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { player1, player2, since } = body as {
      player1?: { wooglesUsername?: string };
      player2?: { wooglesUsername?: string };
      since?: string;
    };

    const u1 = player1?.wooglesUsername?.trim();
    const u2 = player2?.wooglesUsername?.trim();

    if (!u1 || !u2) {
      return NextResponse.json(
        { success: false, error: 'Woogles usernames required for both players' },
        { status: 400 }
      );
    }

    if (!wooglesService.validateUsername(u1) || !wooglesService.validateUsername(u2)) {
      return NextResponse.json(
        { success: false, error: 'Invalid Woogles username format' },
        { status: 400 }
      );
    }

    const gameData = await wooglesService.findMatchBetween(u1, u2, since);

    if (!gameData) {
      return NextResponse.json({
        success: true,
        gameData: null,
        message: `No finished game found between ${u1} and ${u2} on Woogles.`,
      });
    }

    // Best-effort aggregate stats update; never blocks the response
    void Promise.allSettled([
      wooglesService.calculateAndStorePlayerStats(u1, [gameData]),
      wooglesService.calculateAndStorePlayerStats(u2, [gameData]),
    ]);

    return NextResponse.json({ success: true, gameData });
  } catch (error) {
    const err = error as Error;
    console.error('[API] Woogles fetch error:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
