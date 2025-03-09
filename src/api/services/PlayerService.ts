import { Player, CreatePlayerInput, UpdatePlayerInput, PLAYER_CONSTANTS } from '@/types/Player';
import { PlayerCategoryType } from '@/types/Enums';
import { PlayerRepository } from '@/api/repository/playerRepository';

export class PlayerService {
  private playerRepository: PlayerRepository;

  constructor(playerRepository: PlayerRepository) {
    this.playerRepository = playerRepository;
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

    // Generate new numeric ID (max existing ID + 1)
    const newId = existingPlayers.length > 0 
      ? Math.max(...existingPlayers.map(p => 
          typeof p.id === 'string' ? parseInt(p.id) : p.id
        )) + 1 
      : 1;
    console.log('Generated new player ID:', newId);

    // Create Player object with default values where necessary
    const newPlayer: Player = {
      id: newId,
      name: input.name.trim(),
      iscUsername: input.iscUsername?.trim(),
      currentRating: input.initialRating ?? PLAYER_CONSTANTS.DEFAULT_RATING,
      category: input.initialCategory ?? PLAYER_CONSTANTS.DEFAULT_CATEGORY,
      joinDate: new Date().toISOString(),
      active: true,
      matches: [], // Initialize with empty matches array
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
      }
    };

    // Save the player
    await this.playerRepository.createPlayer(newPlayer);

    return newPlayer;
  }

  async getPlayer(id: number | string): Promise<Player | null> {
    return this.playerRepository.getPlayer(typeof id === 'string' ? parseInt(id) : id);
  }

  async updatePlayer(id: number | string, data: UpdatePlayerInput): Promise<Player> {
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