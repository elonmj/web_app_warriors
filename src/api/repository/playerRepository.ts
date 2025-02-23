import { BaseRepository } from './BaseRepository';
import { Player, PlayerMatch } from '@/types/Player';
import path from 'path';

export class PlayerRepository extends BaseRepository {
  private readonly PLAYERS_FILE = 'players.json';
  private readonly PLAYER_MATCHES_DIR = 'player_matches';

  async getAllPlayers(): Promise<Player[]> {
    try {
      const data = await this.readJsonFile<{ players: Player[] }>(this.PLAYERS_FILE);
      return data.players || [];
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
    return players.find(p => p.id === id) || null;
  }

  async updatePlayer(id: string, updates: Partial<Player>): Promise<Player> {
    return await this.withLock('players', async () => {
      const players = await this.getAllPlayers();
      const index = players.findIndex(p => p.id === id);
      
      if (index === -1) {
        throw new Error(`Player not found: ${id}`);
      }

      const updatedPlayer = {
        ...players[index],
        ...updates,
        lastUpdated: new Date().toISOString()
      };

      players[index] = updatedPlayer;
      await this.writeJsonFile(this.PLAYERS_FILE, { players });

      return updatedPlayer;
    });
  }

  private getPlayerMatchHistoryPath(playerId: string): string {
    return path.join(this.PLAYER_MATCHES_DIR, `${playerId}.json`);
  }

  async getPlayerMatchHistory(playerId: string): Promise<PlayerMatch[]> {
    try {
      const filePath = this.getPlayerMatchHistoryPath(playerId);
      const data = await this.readJsonFile<{ matches: PlayerMatch[] }>(filePath);
      return data.matches || [];
    } catch (error) {
      if ((error as Error).message.includes('not found')) {
        return [];
      }
      throw error;
    }
  }

  async addMatchToPlayer(playerId: string, match: PlayerMatch): Promise<void> {
    return await this.withLock(`player_matches_${playerId}`, async () => {
      const filePath = this.getPlayerMatchHistoryPath(playerId);
      const currentMatches = await this.getPlayerMatchHistory(playerId);

      // Add new match to history
      currentMatches.push(match);

      // Sort by date descending
      currentMatches.sort((a, b) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      );

      // Save updated history
      await this.writeJsonFile(filePath, { 
        playerId,
        lastUpdated: new Date().toISOString(),
        matches: currentMatches
      });
    });
  }

  async getPlayerStats(playerId: string): Promise<{
    totalMatches: number;
    wins: number;
    losses: number;
    draws: number;
    winRate: number;
    averageRatingChange: number;
  }> {
    const matches = await this.getPlayerMatchHistory(playerId);
    
    const stats = matches.reduce((acc, match) => {
      acc.totalMatches++;
      if (match.result.pr === 3) acc.wins++;
      else if (match.result.pr === 1) acc.draws++;
      else acc.losses++;
      acc.totalRatingChange += match.ratingChange.change;
      return acc;
    }, {
      totalMatches: 0,
      wins: 0,
      losses: 0,
      draws: 0,
      totalRatingChange: 0
    });

    return {
      totalMatches: stats.totalMatches,
      wins: stats.wins,
      losses: stats.losses,
      draws: stats.draws,
      winRate: stats.totalMatches > 0 ? stats.wins / stats.totalMatches : 0,
      averageRatingChange: stats.totalMatches > 0 ? stats.totalRatingChange / stats.totalMatches : 0
    };
  }
}