
import { FirebaseBaseRepository } from './FirebaseBaseRepository';
import { Player, PlayerMatch } from '@/types/Player';
import { PlayerRepositoryInterface } from './interfaces/PlayerRepositoryInterface';

export class FirebasePlayerRepository extends FirebaseBaseRepository implements PlayerRepositoryInterface {
  /**
   * Get all players
   */
  async getAllPlayers(): Promise<Player[]> {
    try {
      const data = await this.getData<Record<string, Player>>('players');
      return this.objectToArray<Player>(data);
    } catch (error) {
      console.error('Error getting all players:', error);
      throw error;
    }
  }

  /**
   * Get player by ID
   */
  async getPlayer(id: string): Promise<Player | null> {
    try {
      return await this.getData<Player>(`players/${id}`);
    } catch (error) {
      console.error(`Error getting player ${id}:`, error);
      throw error;
    }
  }

  /**
   * Create new player
   */
  async createPlayer(player: Omit<Player, 'id'>): Promise<Player> {
    try {
      const newPlayerId = await this.pushData('players', player);
      const createdPlayer = { ...player, id: newPlayerId };
      return createdPlayer;
    } catch (error) {
      console.error('Error creating player:', error);
      throw error;
    }
  }

  /**
   * Update player
   */
  async updatePlayer(id: string, updates: Partial<Player>): Promise<Player> {
    try {
      await this.updateData(`players/${id}`, updates);
      const updatedPlayer = await this.getPlayer(id);
      if (!updatedPlayer) {
        throw new Error(`Player ${id} not found after update`);
      }
      return updatedPlayer;
    } catch (error) {
      console.error(`Error updating player ${id}:`, error);
      throw error;
    }
  }

  /**
   * Add match to player's history
   */
  async addMatchToPlayer(playerId: string, match: PlayerMatch): Promise<void> {
    try {
      const player = await this.getPlayer(playerId);
      if (!player) {
        throw new Error(`Player ${playerId} not found`);
      }
      
      // Add match to player's matches array or create it if it doesn't exist
      const matches = player.matches || [];
      matches.push(match);
      
      // Update player
      await this.updateData(`players/${playerId}/matches`, matches);
    } catch (error) {
      console.error(`Error adding match to player ${playerId}:`, error);
      throw error;
    }
  }

  /**
   * Get player's match history
   */
  async getPlayerMatchHistory(playerId: string): Promise<PlayerMatch[]> {
    try {
      const player = await this.getPlayer(playerId);
      return player?.matches || [];
    } catch (error) {
      console.error(`Error getting match history for player ${playerId}:`, error);
      throw error;
    }
  }

  /**
   * Get player's statistics
   */
  async getPlayerStats(playerId: string): Promise<any> {
    try {
      const player = await this.getPlayer(playerId);
      return player?.statistics || {};
    } catch (error) {
      console.error(`Error getting statistics for player ${playerId}:`, error);
      throw error;
    }
  }
}
