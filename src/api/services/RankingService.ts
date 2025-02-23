import { EventRepository } from '../repository/eventRepository';
import { PlayerRepository } from '../repository/playerRepository';
import { EventRanking, PlayerRanking } from '@/types/Ranking';
import { Match } from '@/types/Match';
import { ValidationStatus } from '@/types/ValidationStatus';

export class RankingService {
  private eventRepository: EventRepository;
  private playerRepository: PlayerRepository;

  constructor(
    eventRepo?: EventRepository,
    playerRepo?: PlayerRepository
  ) {
    this.eventRepository = eventRepo || new EventRepository();
    this.playerRepository = playerRepo || new PlayerRepository();
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

      // Sort and assign ranks
      this.sortAndAssignRanks(rankings, 'rating');

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

  public async updateRoundRankings(eventId: string, round: number): Promise<EventRanking> {
    try {
      // Get event and validate round
      const event = await this.eventRepository.getEvent(eventId);
      if (!event || !event.metadata) {
        throw new Error('Event not found');
      }
      if (round > event.metadata.totalRounds) {
        throw new Error('Invalid round number');
      }

      // Get matches for this round
      const matches = await this.eventRepository.getRoundMatches(eventId, round);

      // Filter for completed and forfeit matches that are validated
      const completedMatches = matches.filter(match => {
        return (match.status === 'completed' || match.status === 'forfeit') &&
               match.result !== undefined &&
               ['validated', 'valid', 'admin_validated', 'auto_validated']
                 .includes(match.result.validation.status);
      });

      const playerPerformance = await this.calculatePlayerPerformance(completedMatches);
      const rankings = await this.createRankings(playerPerformance);

      // Sort rankings by points and assign ranks
      this.sortAndAssignRanks(rankings, 'points');

      const eventRanking: EventRanking = {
        eventId,
        lastUpdated: new Date().toISOString(),
        rankings
      };

      // Save round-specific rankings
      await this.eventRepository.saveRoundRankings(eventId, round, eventRanking);

      return eventRanking;
    } catch (error) {
      console.error('Error updating round rankings:', error);
      throw new Error('Failed to update round rankings');
    }
  }

  public async getRoundRankings(eventId: string, round: number): Promise<EventRanking> {
    try {
      const ranking = await this.eventRepository.getRoundRankings(eventId, round);
      if (!ranking) {
        // Generate rankings if they don't exist
        return await this.updateRoundRankings(eventId, round);
      }
      return ranking;
    } catch (error) {
      console.error('Error getting round rankings:', error);
      throw new Error('Failed to get round rankings');
    }
  }

  private async calculatePlayerPerformance(matches: Match[]): Promise<Map<string, {
    points: number;
    wins: number;
    draws: number;
    losses: number;
    matches: number;
    rating: number;
    ratingChange: number;
    category: string;
  }>> {
    const playerPerformance = new Map();

    // Process each match to calculate points and statistics
    for (const match of matches) {
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
        p2Stats.points += Math.floor(result.pr * 0.3); // Partial points for good performance
      } else if (p1Score < p2Score) {
        p1Stats.losses++;
        p2Stats.wins++;
        p2Stats.points += result.pr;
        p1Stats.points += Math.floor(result.pr * 0.3); // Partial points for good performance
      } else {
        p1Stats.draws++;
        p2Stats.draws++;
        p1Stats.points += Math.floor(result.pr * 0.5); // Split points for draws
        p2Stats.points += Math.floor(result.pr * 0.5);
      }
    }

    return playerPerformance;
  }

  private async createRankings(playerPerformance: Map<string, any>): Promise<PlayerRanking[]> {
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

    return rankings;
  }

  private sortAndAssignRanks(rankings: PlayerRanking[], primaryCriteria: 'points' | 'rating'): void {
    // Sort rankings
    rankings.sort((a, b) => {
      // First by primary criteria
      if (b[primaryCriteria] !== a[primaryCriteria]) {
        return b[primaryCriteria] - a[primaryCriteria];
      }
      // Then by win ratio
      const aWinRatio = a.wins / (a.matches || 1);
      const bWinRatio = b.wins / (b.matches || 1);
      if (bWinRatio !== aWinRatio) {
        return bWinRatio - aWinRatio;
      }
      // Then by secondary criteria (rating for points, points for rating)
      return primaryCriteria === 'points' 
        ? b.rating - a.rating
        : b.points - a.points;
    });

    // Assign ranks with proper tie handling
    let currentRank = 1;
    let currentPrimary = -1;
    let currentWinRatio = -1;
    let currentSecondary = -1;

    rankings.forEach((ranking, index) => {
      const winRatio = ranking.wins / (ranking.matches || 1);
      const primary = ranking[primaryCriteria];
      const secondary = primaryCriteria === 'points' ? ranking.rating : ranking.points;
      
      if (primary === currentPrimary && 
          winRatio === currentWinRatio && 
          secondary === currentSecondary) {
        // Same rank for tied players
        ranking.rank = currentRank;
      } else {
        // New rank
        currentRank = index + 1;
        ranking.rank = currentRank;
        currentPrimary = primary;
        currentWinRatio = winRatio;
        currentSecondary = secondary;
      }
    });
  }
}