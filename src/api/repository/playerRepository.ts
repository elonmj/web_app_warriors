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

  async updatePlayer(id: string, input: Partial<Player>): Promise<Player> {
    await this.ensurePlayersFile();
    
    return await this.withLock('players', async () => {
      console.log(`Updating player ${id} with:`, input);
      const players = await this.getAllPlayers();
      const playerIndex = players.findIndex(p => p.id === id);
      
      if (playerIndex === -1) {
        throw new Error(`Player not found: ${id}`);
      }

      const currentPlayer = players[playerIndex];
      
      // Special handling for matches array
      const matches = input.matches || currentPlayer.matches || [];
      console.log(`Player ${id} - Setting ${matches.length} matches`);

      const updatedPlayer = {
        ...currentPlayer,
        ...input,
        matches, // Ensure matches array is included
        statistics: input.statistics || currentPlayer.statistics || {
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
      } as Player;

      players[playerIndex] = updatedPlayer;
      console.log(`Saving updated player ${id} with ${updatedPlayer.matches.length} matches`);
      await this.writeJsonFile(this.PLAYERS_FILE, { players });

      return updatedPlayer;
    });
  }

  async recalculatePlayerStatistics(playerId: string, createBackup: boolean = true): Promise<void> {
    return await this.withLock('players', async () => {
      console.log(`Recalculating statistics for player ${playerId}`);
      const players = await this.getAllPlayers();
      const playerIndex = players.findIndex(p => p.id === playerId);
      
      if (playerIndex === -1) {
        throw new Error(`Player not found: ${playerId}`);
      }

      const player = players[playerIndex];
      console.log(`Found player ${player.name} with ${player.matches?.length || 0} matches`);

      // Initialize matches array if missing
      if (!player.matches) {
        player.matches = [];
      }
      
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

      console.log(`Processing ${player.matches.length} matches for ${player.name}`);

      // Clear event participation data
      const eventParticipationMap = new Map<string, {
        matchesPlayed: number;
        performance: { wins: number; draws: number; losses: number; pointsEarned: number; };
      }>();

      // Recalculate all statistics from match history
      for (const match of player.matches) {
        console.log(`Processing match ${match.matchId} for ${player.name}`);
        // Update basic match stats
        player.statistics.totalMatches++;
        player.statistics.totalPR += match.result.pr;

        const [playerScore, opponentScore] = match.result.score;

        // Check for forfeit (score 0-1 or 1-0)
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

      console.log(`Finished processing statistics for ${player.name}:`, {
        totalMatches: player.statistics.totalMatches,
        wins: player.statistics.wins,
        draws: player.statistics.draws,
        losses: player.statistics.losses
      });

      // Update in database
      players[playerIndex] = player;
      await this.writeJsonFile(this.PLAYERS_FILE, { players }, createBackup);
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
}