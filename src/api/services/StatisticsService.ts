import { StatisticsCalculator, EventStatisticsCalculator, EventStatistics } from '../../lib/Statistics';
import { Match } from '@/types/Match';
import { Event } from '@/types/Event';
import { Player, PlayerMatch } from '@/types/Player';
import { FirebasePlayerRepository } from '@/api/repository/FirebasePlayerRepository';
import { FirebaseEventRepository } from '@/api/repository/FirebaseEventRepository';
import { EventTypeType, EventStatusType } from '@/types/Enums';

export class StatisticsService {
  private playerRepo: FirebasePlayerRepository;
  private eventRepo: FirebaseEventRepository;

  constructor() {
    this.playerRepo = new FirebasePlayerRepository();
    this.eventRepo = new FirebaseEventRepository();
  }

  /**
   * Calculate and update player statistics
   */
  async updatePlayerStatistics(player: Player, newMatch: Match): Promise<Player> {
    if (!newMatch.result) {
      throw new Error('Match result required for statistics update');
    }

    // Get opponent data
    const isPlayer1 = newMatch.player1.id === player.id;
    const opponent = isPlayer1 ? newMatch.player2 : newMatch.player1;
    const [playerScore, opponentScore] = isPlayer1 ?
      newMatch.result.score :
      [newMatch.result.score[1], newMatch.result.score[0]];

    // Create PlayerMatch object
    const playerMatch: PlayerMatch = {
      date: newMatch.date,
      eventId: newMatch.eventId,
      matchId: newMatch.id,
      opponent: {
        id: opponent.id,
        ratingAtTime: opponent.ratingBefore,
        categoryAtTime: opponent.categoryBefore
      },
      result: {
        score: [playerScore, opponentScore],
        pr: newMatch.result.pr,
        pdi: newMatch.result.pdi,
        ds: newMatch.result.ds
      },
      ratingChange: {
        before: player.currentRating,
        after: isPlayer1 ? newMatch.player1.ratingAfter : newMatch.player2.ratingAfter,
        change: (isPlayer1 ? newMatch.player1.ratingAfter : newMatch.player2.ratingAfter) - player.currentRating
      },
      categoryAtTime: isPlayer1 ? newMatch.player1.categoryBefore : newMatch.player2.categoryBefore
    };

    // Update player's matches and statistics
    const updatedPlayer: Player = {
      ...player,
      matches: [...(player.matches || []), playerMatch], // Add null check with default empty array
      statistics: player.statistics
    };

    return updatedPlayer;
  }

  /**
   * Calculate event statistics
   */
  async calculateEventStats(eventId: string): Promise<EventStatistics> {
    // Get event and validate
    const event = await this.eventRepo.getEvent(eventId);
    if (!event || !event.metadata) {
      throw new Error('Event not found or invalid');
    }

    // Get all matches from all rounds
    const matches: Match[] = [];
    for (let round = 1; round <= event.metadata.totalRounds; round++) {
      const roundMatches = await this.eventRepo.getRoundMatches(eventId, round);
      matches.push(...roundMatches);
    }

    // Get all players involved in the event
    const players = await this.eventRepo.getPlayers();

    return EventStatisticsCalculator.calculate(event, matches, players);
  }

  /**
   * Calculate performance metrics for a player
   */
  async calculatePlayerPerformance(player: Player): Promise<{
    winRate: number;
    averageDS: number;
    prPerMatch: number;
    consistency: number;
  }> {
    const { statistics, matches = [] } = player;
    
    // Calculate win rate
    const totalGames = statistics.wins + statistics.draws + statistics.losses;
    const winRate = totalGames > 0 ? 
      Number(((statistics.wins / totalGames) * 100).toFixed(1)) : 0;

    // Calculate PR per match
    const prPerMatch = totalGames > 0 ?
      Number((statistics.totalPR / totalGames).toFixed(1)) : 0;

    // Calculate consistency (standard deviation of DS)
    const dsValues = matches.map((m: PlayerMatch) => m.result.ds);
    const avgDS = statistics.averageDS;
    const variance = dsValues.length > 0 ?
      dsValues.reduce((acc: number, ds: number) => 
        acc + Math.pow(ds - avgDS, 2), 0) / dsValues.length : 0;
    const consistency = 100 - Number((Math.sqrt(variance)).toFixed(1));

    return {
      winRate,
      averageDS: statistics.averageDS,
      prPerMatch,
      consistency: Math.max(0, Math.min(100, consistency))
    };
  }

  /**
   * Generate activity report for player
   */
  async generateActivityReport(player: Player): Promise<{
    totalMatches: number;
    activeWeeks: number;
    matchesPerWeek: number;
    inactivityPeriods: number;
  }> {
    const matches = player.matches || [];
    if (matches.length === 0) {
      return {
        totalMatches: 0,
        activeWeeks: 0,
        matchesPerWeek: 0,
        inactivityPeriods: 0
      };
    }

    // Sort matches by date
    const sortedMatches = [...matches].sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    // Calculate active weeks
    const firstMatch = new Date(sortedMatches[0].date);
    const lastMatch = new Date(sortedMatches[sortedMatches.length - 1].date);
    const totalWeeks = Math.ceil((lastMatch.getTime() - firstMatch.getTime()) / (7 * 24 * 60 * 60 * 1000));

    // Calculate inactivity periods (gaps > 2 weeks)
    let inactivityPeriods = 0;
    for (let i = 1; i < sortedMatches.length; i++) {
      const gap = (new Date(sortedMatches[i].date).getTime() - 
                  new Date(sortedMatches[i-1].date).getTime()) / (7 * 24 * 60 * 60 * 1000);
      if (gap > 2) inactivityPeriods++;
    }

    return {
      totalMatches: matches.length,
      activeWeeks: totalWeeks,
      matchesPerWeek: Number((matches.length / totalWeeks).toFixed(1)),
      inactivityPeriods
    };
  }

  /**
   * Get detailed player statistics including performance metrics,
   * activity data, and historical trends
   */
  async getDetailedPlayerStatistics(playerId: string): Promise<{
    performance: {
      winRate: number;
      averageDS: number;
      prPerMatch: number;
      consistency: number;
    };
    activity: {
      totalMatches: number;
      activeWeeks: number;
      matchesPerWeek: number;
      inactivityPeriods: number;
    };
    trends: {
      ratingProgression: {
        minRating: number;
        maxRating: number;
        averageRating: number;
        volatility: number;
      };
      performanceByCategory: {
        [category: string]: {
          matches: number;
          wins: number;
          draws: number;
          losses: number;
          averageRatingChange: number;
        };
      };
    };
  }> {
    const player = await this.playerRepo.getPlayer(playerId);
    if (!player) {
      throw new Error('Player not found');
    }

    const performance = await this.calculatePlayerPerformance(player);
    const activity = await this.generateActivityReport(player);
    
    // Calculate rating trends
    const matches = player.matches || [];
    const ratingChanges = matches.map((m: PlayerMatch) => m.ratingChange);
    const ratings = ratingChanges.map((r: { after: number }) => r.after);
    
    const ratingProgression = {
      minRating: ratings.length > 0 ? Math.min(...ratings) : player.currentRating,
      maxRating: ratings.length > 0 ? Math.max(...ratings) : player.currentRating,
      averageRating: ratings.length > 0 ? ratings.reduce((a: number, b: number) => a + b, 0) / ratings.length : player.currentRating,
      volatility: ratingChanges.length > 0 ? this.calculateRatingVolatility(ratingChanges) : 0
    };

    // Calculate performance by category
    const performanceByCategory = (player.matches || []).reduce((acc: Record<string, any>, match: PlayerMatch) => {
      const category = match.categoryAtTime;
      if (!acc[category]) {
        acc[category] = {
          matches: 0,
          wins: 0,
          draws: 0,
          losses: 0,
          totalRatingChange: 0,
        };
      }

      acc[category].matches++;
      if (match.result.score[0] > match.result.score[1]) acc[category].wins++;
      else if (match.result.score[0] < match.result.score[1]) acc[category].losses++;
      else acc[category].draws++;
      
      acc[category].totalRatingChange += match.ratingChange.change;

      return acc;
    }, {});

    // Calculate averages for each category
    Object.keys(performanceByCategory).forEach(category => {
      performanceByCategory[category].averageRatingChange = 
        performanceByCategory[category].totalRatingChange / 
        performanceByCategory[category].matches;
      delete performanceByCategory[category].totalRatingChange;
    });

    return {
      performance,
      activity,
      trends: {
        ratingProgression,
        performanceByCategory
      }
    };
  }

  private calculateRatingVolatility(ratingChanges: Array<{change: number}>): number {
    const changes = ratingChanges.map(r => r.change);
    const mean = changes.reduce((a, b) => a + b, 0) / changes.length;
    const variance = changes.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / changes.length;
    return Math.sqrt(variance);
  }
}