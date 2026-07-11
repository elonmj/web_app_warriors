import { NextRequest, NextResponse } from 'next/server';
import { FirebaseGameRepository } from '@/api/repository/FirebaseGameRepository';

const gameRepository = new FirebaseGameRepository();

/**
 * GET /api/players/[playerId]/games
 * List the player's persisted Woogles games (lightweight: no event log),
 * plus their insights for the Training Insights section.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const [games, insights] = await Promise.all([
      gameRepository.getPlayerGames(params.id),
      gameRepository.getPlayerInsights(params.id),
    ]);

    return NextResponse.json({
      insights,
      games: games.map((g) => ({
        gameId: g.gameId,
        lexicon: g.lexicon,
        date: g.createdAt ?? g.importedAt,
        players: g.players,
        scores: g.scores,
        winner: g.winner,
        matchId: g.matchId ?? null,
      })),
    });
  } catch (error) {
    console.error('[API] Failed to list player games:', error);
    return NextResponse.json(
      { error: 'Failed to list player games' },
      { status: 500 }
    );
  }
}
