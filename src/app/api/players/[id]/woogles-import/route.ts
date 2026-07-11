import { NextRequest, NextResponse } from 'next/server';
import { FirebasePlayerRepository } from '@/api/repository/FirebasePlayerRepository';
import { wooglesService } from '@/api/services/WooglesService';
import { gamePersistenceService } from '@/api/services/GamePersistenceService';

const playerRepository = new FirebasePlayerRepository();

/**
 * POST /api/players/[playerId]/woogles-import?count=50
 * Self-service: any player can (re)import their own recent Woogles games
 * (training games included, not just league matches) and analyze them.
 * No admin gate — this is a read-only fetch of public Woogles data, and the
 * import count is capped to keep it a bounded, low-cost operation.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const player = await playerRepository.getPlayer(params.id);
    if (!player) {
      return NextResponse.json({ error: 'Player not found' }, { status: 404 });
    }

    const username = player.wooglesUsername ?? player.iscUsername;
    if (!username) {
      return NextResponse.json(
        { error: 'Player has no Woogles username configured' },
        { status: 400 }
      );
    }

    const url = new URL(request.url);
    const count = Math.min(Number(url.searchParams.get('count') || '50'), 200);

    // Page through recent games (Woogles caps page size; 20 is safe)
    const pageSize = 20;
    let imported = 0;
    let skipped = 0;
    const errors: string[] = [];

    for (let offset = 0; offset < count; offset += pageSize) {
      const page = await wooglesService.getRecentGames(
        username,
        Math.min(pageSize, count - offset),
        offset
      );
      if (page.length === 0) break;

      for (const info of page) {
        try {
          // Skip unfinished/cancelled games
          if (['NONE', 'ABORTED', 'CANCELLED'].includes(info.game_end_reason)) {
            skipped++;
            continue;
          }
          const gameData = await wooglesService.getGameData(info.game_id);
          gameData.createdAt = info.created_at;
          const stored = await gamePersistenceService.persistAndAnalyze(gameData);
          if (stored) imported++;
          else skipped++;
        } catch (e) {
          errors.push(`${info.game_id}: ${e instanceof Error ? e.message : 'unknown error'}`);
        }
      }
    }

    return NextResponse.json({
      success: true,
      username,
      imported,
      skipped,
      errors,
    });
  } catch (error) {
    console.error('[API] Woogles import failed:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Import failed' },
      { status: 500 }
    );
  }
}
