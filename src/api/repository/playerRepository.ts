import { BaseRepository } from './BaseRepository';
import { 
  Player,
  CreatePlayerInput,
  UpdatePlayerInput,
  PlayerMatch,
  PlayerStatistics,
  PlayerPreferences 
} from '../../types/Player';
import { PLAYER_CONSTANTS } from '../../types/Player';
import { CategoryManager } from '../../lib/CategoryManager';
import { PlayerCategoryType } from '../../types/Enums';

export class PlayerRepository extends BaseRepository {
  private readonly PLAYERS_FILE = 'players.json';

  async getAllPlayers(): Promise<Player[]> {
    try {
      const data = await this.readJsonFile<{ players: Player[] }>(this.PLAYERS_FILE);
      return data.players;
    } catch (error) {
      if ((error as Error).message.includes('not found')) {
        await this.writeJsonFile(this.PLAYERS_FILE, { players: [] });
        return [];
      }
      throw error;
    }
  }

  async getPlayer(id: string): Promise<Player | null> {
    const players = await this.getAllPlayers();
    return players.find(player => player.id === id) || null;
  }

  async getPlayersByCategory(category: PlayerCategoryType): Promise<Player[]> {
    const players = await this.getAllPlayers();
    return players.filter(player => player.category === category);
  }

  async createPlayer(input: CreatePlayerInput): Promise<Player> {
    return await this.withLock('players', async () => {
      const players = await this.getAllPlayers();
      
      const initialRating = input.initialRating || PLAYER_CONSTANTS.DEFAULT_RATING;
      const initialCategory = input.initialCategory || CategoryManager.determineCategory(initialRating);
      
      const newPlayer: Player = {
        id: `player-${Date.now()}`,
        name: input.name,
        currentRating: initialRating,
        category: initialCategory,
        joinDate: new Date().toISOString(),
        active: true,
        matches: [],
        statistics: {
          totalMatches: 0,
          wins: 0,
          draws: 0,
          losses: 0,
          forfeits: {
            given: 0,
            received: 0
          },
          totalPR: 0,
          averageDS: 0,
          inactivityWeeks: 0,
          bestRating: initialRating,
          worstRating: initialRating,
          categoryHistory: [{
            category: initialCategory,
            from: new Date().toISOString(),
            reason: 'rating_change'
          }],
          eventParticipation: []
        }
      };

      players.push(newPlayer);
      await this.writeJsonFile(this.PLAYERS_FILE, { players });

      return newPlayer;
    });
  }

  async updatePlayer(id: string, input: UpdatePlayerInput): Promise<Player> {
    return await this.withLock('players', async () => {
      const players = await this.getAllPlayers();
      const playerIndex = players.findIndex(p => p.id === id);
      
      if (playerIndex === -1) {
        throw new Error(`Player not found: ${id}`);
      }

      const updatedPlayer = {
        ...players[playerIndex],
        ...input
      };

      players[playerIndex] = updatedPlayer;
      await this.writeJsonFile(this.PLAYERS_FILE, { players });

      return updatedPlayer;
    });
  }

  async addMatchToPlayer(playerId: string, match: PlayerMatch): Promise<void> {
    return await this.withLock('players', async () => {
      const players = await this.getAllPlayers();
      const playerIndex = players.findIndex(p => p.id === playerId);
      
      if (playerIndex === -1) {
        throw new Error(`Player not found: ${playerId}`);
      }

      const player = players[playerIndex];
      
      // Add match to history
      player.matches.push(match);

      // Update statistics
      this.updatePlayerStatistics(player, match);

      // Update rating history
      player.currentRating = match.ratingChange.after;
      player.statistics.bestRating = Math.max(player.statistics.bestRating, match.ratingChange.after);
      player.statistics.worstRating = Math.min(player.statistics.worstRating, match.ratingChange.after);

      // Update category if changed
      const newCategory = CategoryManager.determineCategory(match.ratingChange.after);
      if (newCategory !== player.category) {
        this.updatePlayerCategory(playerId, newCategory as PlayerCategoryType, 'rating_change');
      }

      players[playerIndex] = player;
      await this.writeJsonFile(this.PLAYERS_FILE, { players });
    });
  }

  private updatePlayerStatistics(player: Player, match: PlayerMatch): void {
    const stats = player.statistics;
    const [playerScore, opponentScore] = match.result.score;

    stats.totalMatches++;
    stats.totalPR += match.result.pr;
    
    // Update win/loss record
    if (playerScore > opponentScore) {
      stats.wins++;
    } else if (playerScore === opponentScore) {
      stats.draws++;
    } else {
      stats.losses++;
    }

    // Update average DS
    const totalDS = (stats.averageDS * (stats.totalMatches - 1) + match.result.ds);
    stats.averageDS = totalDS / stats.totalMatches;

    // Reset inactivity counter
    stats.inactivityWeeks = 0;

    // Update event participation
    const eventParticipation = stats.eventParticipation.find(e => e.eventId === match.eventId);
    if (eventParticipation) {
      eventParticipation.matchesPlayed++;
      if (playerScore > opponentScore) eventParticipation.performance.wins++;
      else if (playerScore === opponentScore) eventParticipation.performance.draws++;
      else eventParticipation.performance.losses++;
      eventParticipation.performance.pointsEarned += match.result.pr;
    }
  }

  async updatePlayerCategory(
    playerId: string,
    newCategory: PlayerCategoryType,
    reason: 'rating_change' | 'admin_change' | 'season_reset'
  ): Promise<void> {
    return await this.withLock('players', async () => {
      const players = await this.getAllPlayers();
      const playerIndex = players.findIndex(p => p.id === playerId);
      
      if (playerIndex === -1) {
        throw new Error(`Player not found: ${playerId}`);
      }

      const player = players[playerIndex];
      
      // Close current category period
      const currentCategoryHistory = player.statistics.categoryHistory;
      if (currentCategoryHistory.length > 0) {
        const lastCategory = currentCategoryHistory[currentCategoryHistory.length - 1];
        if (!lastCategory.to) {
          lastCategory.to = new Date().toISOString();
        }
      }

      // Add new category
      player.category = newCategory;
      player.statistics.categoryHistory.push({
        category: newCategory,
        from: new Date().toISOString(),
        reason
      });

      players[playerIndex] = player;
      await this.writeJsonFile(this.PLAYERS_FILE, { players });
    });
  }
}

// Export functions for external use
export const getAllPlayers = (repository: PlayerRepository) => repository.getAllPlayers.bind(repository);
export const updatePlayerCategory = (repository: PlayerRepository) => repository.updatePlayerCategory.bind(repository);