import { NextRequest, NextResponse } from 'next/server';
import { FirebaseGameRepository } from '@/api/repository/FirebaseGameRepository';

const gameRepository = new FirebaseGameRepository();

/** GET /api/games/by-match/[matchId] — gameId persisted for a league match */
export async function GET(
  _request: NextRequest,
  { params }: { params: { matchId: string } }
) {
  try {
    const gameId = await gameRepository.getGameIdForMatch(params.matchId);
    return NextResponse.json({ gameId: gameId ?? null });
  } catch (error) {
    console.error('[API] Failed to resolve game for match:', error);
    return NextResponse.json({ gameId: null });
  }
}
