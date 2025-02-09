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
      const response = await this.readJsonFile<{ players: Player[] }>(this.PLAYERS_FILE);
      if (!response || !response.players) {
        console.error('Invalid players data structure:', response);
        return [];
      }
      return response.players;
    } catch (error) {
      if ((error as Error).message.includes('not found')) {
        // Initialize players file if it doesn't exist
        const initialData = { players: [] };
        await this.writeJsonFile(this.PLAYERS_FILE, initialData);
        await this.createBackup(this.PLAYERS_FILE, initialData);
        return [];
      }
      console.error('Error reading players:', error);
      return [];
    }
  }

  private async ensurePlayersFile(): Promise<void> {
    const exists = await this.fileExists(this.PLAYERS_FILE);
    if (!exists) {
      await this.writeJsonFile(this.PLAYERS_FILE, { players: [] });
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
      await this.ensurePlayersFile();
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

      const data = await this.readJsonFile<{ players: Player[] }>(this.PLAYERS_FILE);
      const allPlayers = data?.players || [];
      allPlayers.push(newPlayer);
      await this.writeJsonFile(this.PLAYERS_FILE, { players: allPlayers });

      return newPlayer;
    });
  }

  async updatePlayer(id: string, input: UpdatePlayerInput): Promise<Player> {
    await this.ensurePlayersFile();
    
    return await this.withLock('players', async () => {
      const players = await this.getAllPlayers();
      const playerIndex = players.findIndex(p => p.id === id);
      
      if (playerIndex === -1) {
        throw new Error(`Player not found: ${id}`);
      }

      const currentPlayer = players[playerIndex];
      const updatedPlayer = {
        ...currentPlayer,
        ...input,
        matches: currentPlayer.matches || [],
        statistics: currentPlayer.statistics || {
          totalMatches: 0,
          wins: 0,
          draws: 0,
          losses: 0,
          forfeits: { given: 0, received: 0 },
          totalPR: 0,
          averageDS: 0,
          inactivityWeeks: 0,
          bestRating: currentPlayer.currentRating || 1000,
          worstRating: currentPlayer.currentRating || 1000,
          categoryHistory: [],
          eventParticipation: []
        }
      };

      const allPlayers = [...players];
      allPlayers[playerIndex] = updatedPlayer;
      await this.writeJsonFile(this.PLAYERS_FILE, { players: allPlayers });
      await this.createBackup(this.PLAYERS_FILE, { players: allPlayers });

      return updatedPlayer;
    });
  }

  async addMatchToPlayer(playerId: string, match: PlayerMatch): Promise<void> {
    await this.ensurePlayersFile();
    
    return await this.withLock('players', async () => {
      const players = await this.getAllPlayers();
      const playerIndex = players.findIndex(p => p.id === playerId);
      
      if (playerIndex === -1) {
        throw new Error(`Player not found: ${playerId}`);
      }

      const player = players[playerIndex];

      // Initialize and validate player data
      if (!player.matches) player.matches = [];

      // Initialize statistics if missing
      if (!player.statistics) {
        player.statistics = {
          totalMatches: 0,
          wins: 0,
          draws: 0,
          losses: 0,
          forfeits: { given: 0, received: 0 },
          totalPR: 0,
          averageDS: 0,
          inactivityWeeks: 0,
          bestRating: player.currentRating || 1000,
          worstRating: player.currentRating || 1000,
          categoryHistory: [],
          eventParticipation: []
        };
      }

      // Check for forfeit based on score pattern [0-1] or [1-0]
      if (match.result) {
        const [playerScore, opponentScore] = match.result.score;
        const isForfeit = (playerScore === 0 && opponentScore === 1) ||
                         (playerScore === 1 && opponentScore === 0);

        if (isForfeit) {
          if (playerScore === 0) {
            player.statistics.forfeits.given++;
          } else {
            player.statistics.forfeits.received++;
          }
        }
      }
      
      // Add match to history
      player.matches.push(match);

      // Update statistics
      this.updatePlayerStatistics(player, match);

      // Update rating history and check for category change
      const newRating = match.ratingChange.after;
      this.updateRatingHistory(player, newRating);

      // Update category if changed based on new rating
      const newCategory = CategoryManager.determineCategory(newRating);
      if (newCategory !== player.category) {
        await this.updatePlayerCategory(playerId, newCategory as PlayerCategoryType, 'rating_change');
      }

      const allPlayers = [...players];
      allPlayers[playerIndex] = player;
      await this.writeJsonFile(this.PLAYERS_FILE, { players: allPlayers });
      await this.createBackup(this.PLAYERS_FILE, { players: allPlayers });
    });
  }

  private updatePlayerStatistics(player: Player, match: PlayerMatch): void {
    if (!player.statistics) {
      player.statistics = {
        totalMatches: 0,
        wins: 0,
        draws: 0,
        losses: 0,
        forfeits: { given: 0, received: 0 },
        totalPR: 0,
        averageDS: 0,
        inactivityWeeks: 0,
        bestRating: player.currentRating,
        worstRating: player.currentRating,
        categoryHistory: [],
        eventParticipation: []
      };
    }

    const stats = player.statistics;
    const [playerScore, opponentScore] = match.result.score;

    // Update match counts and points
    stats.totalMatches++;
    stats.totalPR += match.result.pr;
    
    // Update win/loss/draw record
    if (playerScore > opponentScore) {
      stats.wins++;
    } else if (playerScore === opponentScore) {
      stats.draws++;
    } else {
      stats.losses++;
    }

    // Update rating history
    this.updateRatingHistory(player, match.ratingChange.after);

    // Update average DS (Différence de Score)
    const totalDS = (stats.averageDS * (stats.totalMatches - 1) + match.result.ds);
    stats.averageDS = totalDS / stats.totalMatches;

    // Reset inactivity counter since player just played
    stats.inactivityWeeks = 0;

    // Initialize event participation if needed
    if (!stats.eventParticipation) {
      stats.eventParticipation = [];
    }

    // Update event participation
    let eventParticipation = stats.eventParticipation.find(e => e.eventId === match.eventId);
    if (!eventParticipation) {
      eventParticipation = {
        eventId: match.eventId,
        finalRank: 0,
        matchesPlayed: 0,
        performance: {
          wins: 0,
          draws: 0,
          losses: 0,
          pointsEarned: 0
        }
      };
      stats.eventParticipation.push(eventParticipation);
    }

    eventParticipation.matchesPlayed++;
    if (playerScore > opponentScore) eventParticipation.performance.wins++;
    else if (playerScore === opponentScore) eventParticipation.performance.draws++;
    else eventParticipation.performance.losses++;
    eventParticipation.performance.pointsEarned += match.result.pr;
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
      
      // Initialize category history if needed
      if (!player.statistics.categoryHistory) {
        player.statistics.categoryHistory = [];
      }

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

  private updateRatingHistory(player: Player, newRating: number): void {
    // Initialize statistics if needed
    if (!player.statistics) {
      player.statistics = {
        totalMatches: 0,
        wins: 0,
        draws: 0,
        losses: 0,
        forfeits: { given: 0, received: 0 },
        totalPR: 0,
        averageDS: 0,
        inactivityWeeks: 0,
        bestRating: newRating,
        worstRating: newRating,
        categoryHistory: [],
        eventParticipation: []
      };
    }

    const stats = player.statistics;

    // Update best/worst ratings
    if (!stats.bestRating || newRating > stats.bestRating) {
      stats.bestRating = newRating;
    }
    if (!stats.worstRating || newRating < stats.worstRating) {
      stats.worstRating = newRating;
    }

    // Update current player rating
    player.currentRating = newRating;
  }
  async recalculatePlayerStatistics(playerId: string): Promise<void> {
    return await this.withLock('players', async () => {
      const players = await this.getAllPlayers();
      const playerIndex = players.findIndex(p => p.id === playerId);
      
      if (playerIndex === -1) {
        throw new Error(`Player not found: ${playerId}`);
      }

      const player = players[playerIndex];
      
      // Reset player statistics
      player.statistics = {
        totalMatches: 0,
        wins: 0,
        draws: 0,
        losses: 0,
        forfeits: { given: 0, received: 0 },
        totalPR: 0,
        averageDS: 0,
        inactivityWeeks: 0,
        bestRating: player.currentRating,
        worstRating: player.currentRating,
        categoryHistory: player.statistics?.categoryHistory || [],
        eventParticipation: []
      };

      // Clear event participation data
      const eventParticipationMap = new Map<string, {
        matchesPlayed: number;
        performance: { wins: number; draws: number; losses: number; pointsEarned: number; };
      }>();

      // Recalculate all statistics from match history
      for (const match of player.matches) {
        // Update basic match stats
        player.statistics.totalMatches++;
        player.statistics.totalPR += match.result.pr;

        const [playerScore, opponentScore] = match.result.score;

        // Check for forfeit
        const isForfeit = (playerScore === 0 && opponentScore === 1) ||
                         (playerScore === 1 && opponentScore === 0);
        if (isForfeit) {
          if (playerScore === 0) {
            player.statistics.forfeits.given++;
          } else {
            player.statistics.forfeits.received++;
          }
        }

        // Update win/loss/draw record
        if (playerScore > opponentScore) {
          player.statistics.wins++;
        } else if (playerScore === opponentScore) {
          player.statistics.draws++;
        } else {
          player.statistics.losses++;
        }

        // Update average DS
        const totalDS = (player.statistics.averageDS * (player.statistics.totalMatches - 1) + match.result.ds);
        player.statistics.averageDS = totalDS / player.statistics.totalMatches;

        // Update rating history
        this.updateRatingHistory(player, match.ratingChange.after);

        // Update event participation
        let eventStats = eventParticipationMap.get(match.eventId);
        if (!eventStats) {
          eventStats = {
            matchesPlayed: 0,
            performance: { wins: 0, draws: 0, losses: 0, pointsEarned: 0 }
          };
          eventParticipationMap.set(match.eventId, eventStats);
        }

        eventStats.matchesPlayed++;
        if (playerScore > opponentScore) eventStats.performance.wins++;
        else if (playerScore === opponentScore) eventStats.performance.draws++;
        else eventStats.performance.losses++;
        eventStats.performance.pointsEarned += match.result.pr;
      }

      // Convert event participation map to array
      player.statistics.eventParticipation = Array.from(eventParticipationMap.entries())
        .map(([eventId, stats]) => ({
          eventId,
          finalRank: 0, // This would need to be set from event results
          ...stats
        }));

      // Update in database
      players[playerIndex] = player;
      await this.writeJsonFile(this.PLAYERS_FILE, { players });
      await this.createBackup(this.PLAYERS_FILE, { players });
    });
  }
}

// Export functions for external use
export const getAllPlayers = (repository: PlayerRepository) => repository.getAllPlayers.bind(repository);
export const updatePlayerCategory = (repository: PlayerRepository) => repository.updatePlayerCategory.bind(repository);
export const recalculatePlayerStatistics = (repository: PlayerRepository) => repository.recalculatePlayerStatistics.bind(repository);