import { NextRequest, NextResponse } from 'next/server';
import { FirebaseGameRepository } from '@/api/repository/FirebaseGameRepository';

const gameRepository = new FirebaseGameRepository();

/**
 * GET /api/games/[gameId]
 * Full stored game (events + gcg) with its statistical analysis —
 * powers the game replayer page.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: { gameId: string } }
) {
  try {
    const [game, analysis] = await Promise.all([
      gameRepository.getGame(params.gameId),
      gameRepository.getAnalysis(params.gameId),
    ]);

    if (!game) {
      return NextResponse.json({ error: 'Game not found' }, { status: 404 });
    }

    return NextResponse.json({ game, analysis });
  } catch (error) {
    console.error('[API] Failed to get game:', error);
    return NextResponse.json({ error: 'Failed to get game' }, { status: 500 });
  }
}
