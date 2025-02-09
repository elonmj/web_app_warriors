import { BaseRepository } from '../repository/BaseRepository';
import { MatchRepository } from '../repository/MatchRepository';
import { PlayerRepository } from '../repository/playerRepository';
import { EventRanking, PlayerRanking } from '@/types/Ranking';
import { Match } from '@/types/Match';
import { ValidationStatus } from '@/types/ValidationStatus';
import { MatchStatus } from '@/types/MatchStatus';
import path from 'path';
import fs from 'fs/promises';

export class RankingService {
  private matchRepository: MatchRepository;
  private playerRepository: PlayerRepository;
  private baseRepo: BaseRepository;

  constructor() {
    this.matchRepository = new MatchRepository();
    this.playerRepository = new PlayerRepository();
    this.baseRepo = new BaseRepository();
  }

  public async getGlobalRankings(): Promise<EventRanking> {
    try {
      // Get all players
      const players = await this.playerRepository.getAllPlayers();
      
      // Map players to ranking format
      const rankings: PlayerRanking[] = players.map(player => ({
          playerId: player.id,
          rank: 0, // Will be calculated after sorting
          points: 0, // Not used in global rankings
          matches: player.statistics.totalMatches || 0,
          wins: player.statistics.wins || 0,
          draws: player.statistics.draws || 0,
          losses: player.statistics.losses || 0,
          rating: player.currentRating || 1000,
          ratingChange: player.statistics.bestRating
            ? player.currentRating - player.statistics.bestRating
            : 0,
          category: player.category,
          playerDetails: {
            name: player.name,
            currentRating: player.currentRating,
            category: player.category
          }
        }));

      // Sort rankings by rating and secondary criteria
      rankings.sort((a, b) => {
        // First by rating (descending)
        if (b.rating !== a.rating) return b.rating - a.rating;

        // Then by win ratio (descending)
        const aWinRatio = a.wins / (a.matches || 1);
        const bWinRatio = b.wins / (b.matches || 1);
        if (bWinRatio !== aWinRatio) return bWinRatio - aWinRatio;

        // Finally by total matches (descending)
        return b.matches - a.matches;
      });

      // Assign ranks considering all criteria
      let currentRank = 1;
      let currentRating = -1;
      let currentWinRatio = -1;
      let currentMatches = -1;

      rankings.forEach((ranking, index) => {
        const winRatio = ranking.wins / (ranking.matches || 1);
        
        // Check if tied with previous player on all criteria
        const isTied = ranking.rating === currentRating &&
                      winRatio === currentWinRatio &&
                      ranking.matches === currentMatches;
        
        if (isTied) {
          // Same rank for tied players
          ranking.rank = currentRank;
        } else {
          // New rank when any criteria differs
          currentRank = index + 1;
          ranking.rank = currentRank;
          currentRating = ranking.rating;
          currentWinRatio = winRatio;
          currentMatches = ranking.matches;
        }
      });

      const globalRanking: EventRanking = {
        eventId: 'global', // Special ID for global rankings
        lastUpdated: new Date().toISOString(),
        rankings
      };

      return globalRanking;
    } catch (error) {
      console.error('Error generating global rankings:', error);
      throw new Error('Failed to generate global rankings');
    }
  }

  public async updateEventRankings(eventId: string): Promise<EventRanking> {
    try {
      const matches = await this.matchRepository.getEventMatches(eventId);

      // Filter for completed and forfeit matches that are validated
      const completedMatches = matches.filter(match => {
        return (match.status === 'completed' || match.status === 'forfeit') &&
               match.result !== undefined &&
               ['validated', 'valid', 'admin_validated', 'auto_validated'].includes(match.result.validation.status);
      });

      // Create performance map for each player
      const playerPerformance = new Map<string, {
        points: number;
        wins: number;
        draws: number;
        losses: number;
        matches: number;
        rating: number;
        ratingChange: number;
        category: string;
      }>();

      // Process each match to calculate points and statistics
      for (const match of completedMatches) {
        const { player1, player2, result } = match;
        if (!result) continue;

        const [p1Score, p2Score] = result.score;

        // Initialize player records if not exist
        if (!playerPerformance.has(player1.id)) {
          playerPerformance.set(player1.id, {
            points: 0,
            wins: 0,
            draws: 0,
            losses: 0,
            matches: 0,
            rating: player1.ratingAfter,
            ratingChange: player1.ratingAfter - player1.ratingBefore,
            category: player1.categoryAfter
          });
        }
        if (!playerPerformance.has(player2.id)) {
          playerPerformance.set(player2.id, {
            points: 0,
            wins: 0,
            draws: 0,
            losses: 0,
            matches: 0,
            rating: player2.ratingAfter,
            ratingChange: player2.ratingAfter - player2.ratingBefore,
            category: player2.categoryAfter
          });
        }

        const p1Stats = playerPerformance.get(player1.id)!;
        const p2Stats = playerPerformance.get(player2.id)!;

        // Update match counts
        p1Stats.matches++;
        p2Stats.matches++;

        // Update win/draw/loss stats and points with improved distribution
        if (p1Score > p2Score) {
          p1Stats.wins++;
          p2Stats.losses++;
          p1Stats.points += result.pr;
          // Add partial points for good performance even in loss
          p2Stats.points += Math.floor(result.pr * 0.3);
        } else if (p1Score < p2Score) {
          p1Stats.losses++;
          p2Stats.wins++;
          p2Stats.points += result.pr;
          // Add partial points for good performance even in loss
          p1Stats.points += Math.floor(result.pr * 0.3);
        } else {
          p1Stats.draws++;
          p2Stats.draws++;
          // Split points for draws
          p1Stats.points += Math.floor(result.pr * 0.5);
          p2Stats.points += Math.floor(result.pr * 0.5);
        }
      }

      // Get player details and create rankings array
      const rankings: PlayerRanking[] = [];
      const players = await this.playerRepository.getAllPlayers();

      for (const [playerId, stats] of playerPerformance.entries()) {
        const player = players.find(p => p.id === playerId);
        if (!player) continue;

        rankings.push({
          playerId,
          rank: 0, // Will be calculated after sorting
          points: stats.points,
          matches: stats.matches,
          wins: stats.wins,
          draws: stats.draws,
          losses: stats.losses,
          rating: stats.rating,
          ratingChange: stats.ratingChange,
          category: stats.category,
          playerDetails: {
            name: player.name,
            currentRating: player.currentRating,
            category: player.category
          }
        });
      }

      // Sort rankings by points (descending)
      rankings.sort((a, b) => {
        // First by points
        if (b.points !== a.points) return b.points - a.points;
        // Then by win ratio
        const aWinRatio = a.wins / (a.matches || 1);
        const bWinRatio = b.wins / (b.matches || 1);
        if (bWinRatio !== aWinRatio) return bWinRatio - aWinRatio;
        // Then by rating
        return b.rating - a.rating;
      });

      // Assign ranks with proper tie handling
      let currentRank = 1;
      let currentPoints = -1;
      let currentWinRatio = -1;
      let currentRating = -1;
      let tiedCount = 0;

      rankings.forEach((ranking, index) => {
        const winRatio = ranking.wins / (ranking.matches || 1);
        
        if (ranking.points === currentPoints && 
            winRatio === currentWinRatio && 
            ranking.rating === currentRating) {
          // Same rank for tied players
          ranking.rank = currentRank;
          tiedCount++;
        } else {
          // New rank, accounting for any previous ties
          currentRank = index + 1;
          ranking.rank = currentRank;
          currentPoints = ranking.points;
          currentWinRatio = winRatio;
          currentRating = ranking.rating;
          tiedCount = 0;
        }
      });

      const eventRanking: EventRanking = {
        eventId,
        lastUpdated: new Date().toISOString(),
        rankings
      };

      // Save rankings to file
      await this.saveRankings(eventRanking);

      return eventRanking;
    } catch (error) {
      console.error('Error updating event rankings:', error);
      throw new Error('Failed to update event rankings');
    }
  }

  private async saveRankings(eventRanking: EventRanking): Promise<void> {
    const rankingsDir = path.join(process.cwd(), 'data', 'rankings');
    const filePath = path.join(rankingsDir, `${eventRanking.eventId}.json`);
    
    try {
      // Ensure rankings directory exists
      await fs.mkdir(rankingsDir, { recursive: true });
      
      // Save rankings
      await fs.writeFile(
        filePath,
        JSON.stringify(eventRanking, null, 2),
        'utf-8'
      );
    } catch (error) {
      console.error('Error saving rankings:', error);
      throw new Error('Failed to save rankings');
    }
  }
}