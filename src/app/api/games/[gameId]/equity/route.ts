import { NextRequest, NextResponse } from 'next/server';
import { FirebaseGameRepository } from '@/api/repository/FirebaseGameRepository';
import { gameAnalysisService } from '@/api/services/GameAnalysisService';

const gameRepository = new FirebaseGameRepository();

/**
 * POST /api/games/[gameId]/equity
 * Persist a client-computed wolges equity analysis alongside the
 * statistical summary at analyses/{gameId}.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { gameId: string } }
) {
  try {
    const equity = await request.json();
    if (!equity || equity.engine !== 'wolges-wasm' || !Array.isArray(equity.perMove)) {
      return NextResponse.json({ error: 'Invalid equity payload' }, { status: 400 });
    }

    const game = await gameRepository.getGame(params.gameId);
    if (!game) {
      return NextResponse.json({ error: 'Game not found' }, { status: 404 });
    }

    let analysis = await gameRepository.getAnalysis(params.gameId);
    if (!analysis) {
      analysis = gameAnalysisService.computeGameSummary(game);
    }

    await gameRepository.saveAnalysis({ ...analysis, equity } as typeof analysis & {
      equity: unknown;
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[API] Failed to save equity analysis:', error);
    return NextResponse.json(
      { error: 'Failed to save equity analysis' },
      { status: 500 }
    );
  }
}
