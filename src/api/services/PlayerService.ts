import { Player, CreatePlayerInput, UpdatePlayerInput, PLAYER_CONSTANTS } from '@/types/Player';
import { PlayerCategoryType } from '@/types/Enums';
import { FirebasePlayerRepository } from '@/api/repository/FirebasePlayerRepository';

export class PlayerService {
  private playerRepository: FirebasePlayerRepository;

  constructor(playerRepository?: FirebasePlayerRepository) {
    this.playerRepository = playerRepository || new FirebasePlayerRepository();
  }

  async createPlayer(input: CreatePlayerInput): Promise<Player> {
    // Input validation
    if (!input.name || input.name.trim() === '') {
      throw new Error('Player name is required.');
    }

    // Check name uniqueness
    const existingPlayers = await this.playerRepository.getAllPlayers();
    if (existingPlayers.some(p => p.name.toLowerCase() === input.name.toLowerCase())) {
      throw new Error('A player with this name already exists.');
    }
    
    // Create Player object with default values where necessary
    const newPlayerData: Omit<Player, 'id'> = {
      name: input.name.trim(),
      iscUsername: input.iscUsername?.trim(),
      currentRating: input.initialRating ?? PLAYER_CONSTANTS.DEFAULT_RATING,
      category: input.initialCategory ?? PLAYER_CONSTANTS.DEFAULT_CATEGORY,
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
        bestRating: input.initialRating ?? PLAYER_CONSTANTS.DEFAULT_RATING,
        worstRating: input.initialRating ?? PLAYER_CONSTANTS.DEFAULT_RATING,
        categoryHistory: [{
          category: input.initialCategory ?? PLAYER_CONSTANTS.DEFAULT_CATEGORY,
          from: new Date().toISOString(),
          reason: 'admin_change'
        }],
        eventParticipation: []
      },
      matches: [] // Initialize with empty matches array
    };

    // Save the player - repository will assign the ID
    return await this.playerRepository.createPlayer(newPlayerData);
  }

  async getPlayer(id: string): Promise<Player | null> {
    return this.playerRepository.getPlayer(id);
  }

  async updatePlayer(id: string, data: UpdatePlayerInput): Promise<Player> {
    const existingPlayer = await this.playerRepository.getPlayer(id);
    if (!existingPlayer) {
      throw new Error('Player not found');
    }

    // If name is being updated, check for uniqueness
    if (data.name && data.name !== existingPlayer.name) {
      const allPlayers = await this.playerRepository.getAllPlayers();
      if (allPlayers.some(p => String(p.id) !== String(id) && p.name.toLowerCase() === data.name!.toLowerCase())) {
        throw new Error('A player with this name already exists.');
      }
    }

    // Update player data
    const updatedPlayer: Player = {
      ...existingPlayer,
      ...data,
      // Ensure name is trimmed if provided
      name: data.name ? data.name.trim() : existingPlayer.name,
      // Ensure iscUsername is trimmed if provided
      iscUsername: data.iscUsername ? data.iscUsername.trim() : existingPlayer.iscUsername
    };

    // If category is being updated, add to category history
    if (data.category && data.category !== existingPlayer.category) {
      updatedPlayer.statistics.categoryHistory.push({
        category: data.category,
        from: new Date().toISOString(),
        reason: 'admin_change'
      });
    }

    await this.playerRepository.updatePlayer(id, updatedPlayer);
    return updatedPlayer;
  }
}