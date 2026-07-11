import { FirebaseBaseRepository } from './FirebaseBaseRepository';
import { StoredGame, GameAnalysisSummary, PlayerInsights } from '@/types/GameAnalysis';

/**
 * Persistence for Woogles games and their analyses.
 *
 * Paths:
 *   games/{gameId}            full game (meta + events + gcg)
 *   gamesByPlayer/{playerId}  { [gameId]: true }
 *   gamesByMatch/{matchId}    gameId
 *   analyses/{gameId}         statistical summary (versioned)
 *   playerInsights/{playerId} aggregates + topLeaks
 */
export class FirebaseGameRepository extends FirebaseBaseRepository {
  /** Idempotent by gameId: importing the same game twice just overwrites. */
  async saveGame(game: StoredGame): Promise<void> {
    await this.setData(`games/${game.gameId}`, game);
    if (game.matchId) {
      await this.setData(`gamesByMatch/${game.matchId}`, game.gameId);
    }
  }

  async getGame(gameId: string): Promise<StoredGame | null> {
    return this.getData<StoredGame>(`games/${gameId}`);
  }

  async linkGameToPlayer(playerId: string, gameId: string): Promise<void> {
    await this.setData(`gamesByPlayer/${playerId}/${gameId}`, true);
  }

  async getPlayerGameIds(playerId: string): Promise<string[]> {
    const data = await this.getData<Record<string, true>>(
      `gamesByPlayer/${playerId}`
    );
    return data ? Object.keys(data) : [];
  }

  async getPlayerGames(playerId: string): Promise<StoredGame[]> {
    const ids = await this.getPlayerGameIds(playerId);
    const games = await Promise.all(ids.map((id) => this.getGame(id)));
    return games
      .filter((g): g is StoredGame => g !== null)
      .sort((a, b) =>
        (b.createdAt ?? b.importedAt).localeCompare(a.createdAt ?? a.importedAt)
      );
  }

  async getGameIdForMatch(matchId: string): Promise<string | null> {
    return this.getData<string>(`gamesByMatch/${matchId}`);
  }

  async saveAnalysis(analysis: GameAnalysisSummary): Promise<void> {
    await this.setData(`analyses/${analysis.gameId}`, analysis);
  }

  async getAnalysis(gameId: string): Promise<GameAnalysisSummary | null> {
    return this.getData<GameAnalysisSummary>(`analyses/${gameId}`);
  }

  async savePlayerInsights(insights: PlayerInsights): Promise<void> {
    await this.setData(`playerInsights/${insights.playerId}`, insights);
  }

  async getPlayerInsights(playerId: string): Promise<PlayerInsights | null> {
    return this.getData<PlayerInsights>(`playerInsights/${playerId}`);
  }
}
