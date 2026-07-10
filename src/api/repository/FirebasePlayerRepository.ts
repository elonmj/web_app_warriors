import { FirebaseBaseRepository } from './FirebaseBaseRepository';
import { Player, PlayerMatch } from '@/types/Player';

export class FirebasePlayerRepository extends FirebaseBaseRepository {
  /**
   * Get a player by ID
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
   * Get multiple players by their IDs
   */
  async getPlayersByIds(ids: string[]): Promise<Player[]> {
    try {
      const players: Player[] = [];
      // Use Promise.all to fetch all players in parallel
      const playerPromises = ids.map(id => this.getPlayer(id));
      const results = await Promise.all(playerPromises);
      
      // Filter out null results and add valid players
      results.forEach((player, index) => {
        if (player) {
          players.push(player);
        } else {
          console.warn(`Player with ID ${ids[index]} not found`);
        }
      });
      
      return players;
    } catch (error) {
      console.error('Error getting players by IDs:', error);
      return []; // Return empty array on error to be resilient
    }
  }

  /**
   * Get all players
   */
  async getAllPlayers(): Promise<Player[]> {
    try {
      const data = await this.getData<Record<string, Player>>('players');
      return this.objectToArray<Player>(data);
    } catch (error) {
      console.error('Error getting all players:', error);
      return []; // Return empty array on error
    }
  }

  /**
   * Search players by name or iscusername (case-insensitive)
   * Note: This fetches all players and filters locally.
   * For large datasets, consider a dedicated search solution (e.g., Algolia) or database structure optimization.
   */
  async searchPlayers(query: string): Promise<Player[]> {
    console.log('[Search] Starting player search:', { query });

    if (!query) {
      console.log('[Search] Empty query, returning empty results');
      return [];
    }

    const lowerCaseQuery = query.toLowerCase();
    console.log('[Search] Normalized query:', { original: query, lowercase: lowerCaseQuery });

    try {
      // Fetch all players
      console.log('[Search] Fetching all players...');
      const allPlayers = await this.getAllPlayers();
      console.log('[Search] Retrieved players:', {
        count: allPlayers.length,
        samplePlayer: allPlayers[0],
        hasIscUsernames: allPlayers.some(p => p.iscUsername)
      });

      // Filter players
      const filteredResults = allPlayers.filter(player => {
        // Detailed check of each field
        const nameCheck = {
          exists: !!player.name,
          value: player.name,
          lowercase: player.name?.toLowerCase(),
          matches: player.name?.toLowerCase().includes(lowerCaseQuery)
        };

        const iscCheck = {
          exists: !!player.iscUsername,
          value: player.iscUsername,
          lowercase: player.iscUsername?.toLowerCase(),
          matches: player.iscUsername?.toLowerCase().includes(lowerCaseQuery)
        };

        console.log('[Search] Checking player:', {
          id: player.id,
          nameCheck,
          iscCheck,
          player // Full player object for reference
        });

        return nameCheck.matches || iscCheck.matches;
      });

      console.log('[Search] Search complete:', {
        query,
        totalPlayers: allPlayers.length,
        matchesFound: filteredResults.length,
        results: filteredResults
      });

      return filteredResults;
    } catch (error) {
      console.error('Error searching players:', error);
      return []; // Return empty array on error
    }
  }

  /**
   * Create new player
   */
  async createPlayer(playerData: Omit<Player, 'id'>): Promise<Player> {
    try {
      const playerId = await this.pushData('players', playerData);
      return { ...playerData, id: playerId };
    } catch (error) {
      console.error('Error creating player:', error);
      throw error;
    }
  }

  /**
   * Update player
   */
  async updatePlayer(id: string, updates: Partial<Player>): Promise<void> {
    try {
      await this.updateData(`players/${id}`, updates);
    } catch (error) {
      console.error(`Error updating player ${id}:`, error);
      throw error;
    }
  }

  /**
   * Delete player
   */
  async deletePlayer(id: string): Promise<void> {
    try {
      await this.deleteData(`players/${id}`);
    } catch (error) {
      console.error(`Error deleting player ${id}:`, error);
      throw error;
    }
  }

  /**
   * Add a match record to a player's history
   */
  async addMatchToPlayer(playerId: string, playerMatch: PlayerMatch): Promise<void> {
    try {
      const player = await this.getPlayer(playerId);
      if (!player) {
        throw new Error(`Player ${playerId} not found`);
      }
      const matches = player.matches ? [...player.matches, playerMatch] : [playerMatch];
      await this.updatePlayer(playerId, { matches });
    } catch (error) {
      console.error(`Error adding match to player ${playerId}:`, error);
      throw error;
    }
  }
}
