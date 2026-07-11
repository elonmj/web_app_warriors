import { NextResponse } from 'next/server';
import { FirebasePlayerRepository } from '@/api/repository/FirebasePlayerRepository';
import { FirebaseGameRepository } from '@/api/repository/FirebaseGameRepository';
import { aggregateClubLeaks } from '@/api/services/GameAnalysisService';

const playerRepo = new FirebasePlayerRepository();
const gameRepo = new FirebaseGameRepository();

const MS_PER_WEEK = 7 * 24 * 60 * 60 * 1000;

/**
 * GET /api/club/overview
 * Coach-level, club-wide aggregation: activity (who hasn't played recently),
 * category progression (who's climbing), and shared training leaks —
 * built entirely from data already computed per player (no new storage).
 */
export async function GET() {
  try {
    const players = await playerRepo.getAllPlayers();
    const insightsByPlayer = await Promise.all(
      players.map(async (p) => ({
        player: p,
        insights: await gameRepo.getPlayerInsights(p.id),
      }))
    );

    const now = Date.now();

    // Activity — most recent of last league match / last analyzed Woogles game
    const activity = insightsByPlayer
      .map(({ player, insights }) => {
        const lastMatchDate = (player.matches ?? [])
          .map((m) => new Date(m.date).getTime())
          .filter((t) => !Number.isNaN(t))
          .sort((a, b) => b - a)[0];
        const lastGameDate = insights?.recentGames[0]?.date
          ? new Date(insights.recentGames[0].date).getTime()
          : undefined;
        const lastActivity = Math.max(lastMatchDate ?? 0, lastGameDate ?? 0);
        if (lastActivity === 0) return null;
        return {
          playerId: player.id,
          name: player.name,
          lastActivityDate: new Date(lastActivity).toISOString(),
          weeksSinceLastActivity: Math.floor((now - lastActivity) / MS_PER_WEEK),
        };
      })
      .filter((x): x is NonNullable<typeof x> => x !== null)
      .sort((a, b) => b.weeksSinceLastActivity - a.weeksSinceLastActivity);

    // Category progression — most recent category change first
    const categoryProgress = players
      .map((player) => {
        const history = player.statistics?.categoryHistory ?? [];
        const last = [...history].sort(
          (a, b) => new Date(b.from).getTime() - new Date(a.from).getTime()
        )[0];
        if (!last) return null;
        return {
          playerId: player.id,
          name: player.name,
          category: player.category,
          changedAt: last.from,
        };
      })
      .filter((x): x is NonNullable<typeof x> => x !== null)
      .sort((a, b) => new Date(b.changedAt).getTime() - new Date(a.changedAt).getTime());

    // Shared training leaks across all players with analyzed games
    const leaksInput = insightsByPlayer
      .filter((x): x is { player: (typeof players)[number]; insights: NonNullable<typeof x.insights> } =>
        !!x.insights && x.insights.gamesAnalyzed > 0
      )
      .map((x) => ({ playerId: x.player.id, insights: x.insights }));
    const leaks = aggregateClubLeaks(leaksInput).map((leak) => ({
      ...leak,
      players: leak.players.map((p) => ({
        ...p,
        name: players.find((pl) => pl.id === p.playerId)?.name ?? p.wooglesUsername,
      })),
    }));

    return NextResponse.json({
      totalPlayers: players.length,
      playersWithAnalyzedGames: leaksInput.length,
      activity,
      categoryProgress,
      leaks,
    });
  } catch (error) {
    console.error('[API] Failed to build club overview:', error);
    return NextResponse.json({ error: 'Failed to build club overview' }, { status: 500 });
  }
}
