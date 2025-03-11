// Adjust import path to correctly reference Player types
import { Player, PlayerMatch } from '../../../types/Player';

export interface PlayerRepositoryInterface {
  getAllPlayers(): Promise<Player[]>;
  getPlayer(id: string): Promise<Player | null>;
  createPlayer(player: Omit<Player, 'id'>): Promise<Player>;
  updatePlayer(id: string, updates: Partial<Player>): Promise<Player>;
  addMatchToPlayer(playerId: string, match: PlayerMatch): Promise<void>;
  getPlayerMatchHistory(playerId: string): Promise<PlayerMatch[]>;
  getPlayerStats(playerId: string): Promise<any>;
}
