import { WooglesGameData } from '@/types/Woogles';
import { StoredGame } from '@/types/GameAnalysis';
import { FirebaseGameRepository } from '@/api/repository/FirebaseGameRepository';
import { FirebasePlayerRepository } from '@/api/repository/FirebasePlayerRepository';
import { gameAnalysisService } from './GameAnalysisService';

/**
 * Glue layer: persist a fetched Woogles game, run the statistical analysis,
 * and refresh the insights of every league player involved.
 * All methods are best-effort — persistence must never block result flow.
 */
export class GamePersistenceService {
  private gameRepo = new FirebaseGameRepository();
  private playerRepo = new FirebasePlayerRepository();

  /**
   * Persist a game (optionally linked to a league match), analyze it and
   * update insights for the involved players.
   */
  async persistAndAnalyze(
    gameData: WooglesGameData,
    link?: { matchId?: string; eventId?: string }
  ): Promise<StoredGame | null> {
    try {
      const stored: StoredGame = {
        gameId: gameData.gameId,
        lexicon: gameData.lexicon,
        letterDistribution: gameData.letterDistribution,
        createdAt: gameData.createdAt,
        importedAt: new Date().toISOString(),
        players: gameData.players,
        scores: gameData.scores,
        winner: gameData.winner,
        events: gameData.events,
        gcg: gameData.gcg,
        matchId: link?.matchId,
        eventId: link?.eventId,
      };
      await this.gameRepo.saveGame(stored);

      const analysis = gameAnalysisService.computeGameSummary(stored);
      await this.gameRepo.saveAnalysis(analysis);

      // Link + refresh insights for every league player in this game
      const players = await this.playerRepo.getAllPlayers();
      for (const nickname of stored.players) {
        const player = players.find(
          (p) =>
            (p.wooglesUsername ?? p.iscUsername)?.toLowerCase() ===
            nickname.toLowerCase()
        );
        if (!player) continue;
        await this.gameRepo.linkGameToPlayer(player.id, stored.gameId);
        await this.refreshPlayerInsights(player.id, nickname);
      }

      return stored;
    } catch (error) {
      console.error('[GamePersistence] Failed to persist/analyze game:', error);
      return null;
    }
  }

  async refreshPlayerInsights(
    playerId: string,
    wooglesUsername: string
  ): Promise<void> {
    try {
      const games = await this.gameRepo.getPlayerGames(playerId);
      const withSummaries = await Promise.all(
        games.map(async (game) => {
          let summary = await this.gameRepo.getAnalysis(game.gameId);
          if (!summary) {
            summary = gameAnalysisService.computeGameSummary(game);
            await this.gameRepo.saveAnalysis(summary);
          }
          return { game, summary };
        })
      );

      const insights = gameAnalysisService.aggregateInsights(
        playerId,
        wooglesUsername,
        withSummaries
      );
      await this.gameRepo.savePlayerInsights(insights);
    } catch (error) {
      console.error(
        `[GamePersistence] Failed to refresh insights for ${playerId}:`,
        error
      );
    }
  }
}

export const gamePersistenceService = new GamePersistenceService();
