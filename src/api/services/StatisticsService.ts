import { StatisticsCalculator, EventStatisticsCalculator, EventStatistics } from '../../lib/Statistics';
import { Match } from '../../lib/Match';
import { Player, PlayerMatch } from '../../lib/Player';

export class StatisticsService {
  /**
   * Calculate and update player statistics
   */
  async updatePlayerStatistics(player: Player, newMatch: Match): Promise<Player> {
    if (!newMatch.result) {
      throw new Error('Match result required for statistics update');
    }

    // Get opponent data
    const isPlayer1 = newMatch.player1 === player.id;
    const opponentId = isPlayer1 ? newMatch.player2 : newMatch.player1;
    const opponentRating = isPlayer1 ? newMatch.player2Rating : newMatch.player1Rating;
    const [playerScore, opponentScore] = isPlayer1 ? 
      newMatch.result.score : 
      [newMatch.result.score[1], newMatch.result.score[0]];

    // Create PlayerMatch object
    const playerMatch: PlayerMatch = {
      date: newMatch.date,
      opponent: opponentId,
      opponentRating: opponentRating,
      result: {
        score: [playerScore, opponentScore],
        pr: newMatch.result.pr,
        pdi: newMatch.result.pdi,
        ds: newMatch.result.ds
      },
      ratingChange: player.currentRating - (player.matches[player.matches.length - 1]?.opponentRating || player.currentRating),
      categoryAtTime: isPlayer1 ? newMatch.player1Category : newMatch.player2Category
    };

    // Update player's matches and statistics
    const updatedPlayer: Player = {
      ...player,
      matches: [...player.matches, playerMatch],
      statistics: StatisticsCalculator.updatePlayerStatistics(
        player.statistics,
        playerMatch
      )
    };

    return updatedPlayer;
  }

  /**
   * Calculate event statistics
   */
  async calculateEventStats(eventId: string, matches: Match[], players: Player[]): Promise<EventStatistics> {
    // Filter matches for specific event if needed
    const eventMatches = matches.filter(match => match.id.startsWith(eventId));
    
    return EventStatisticsCalculator.calculateEventStatistics(eventMatches, players);
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
    const { statistics, matches } = player;
    
    // Calculate win rate
    const totalGames = statistics.wins + statistics.draws + statistics.losses;
    const winRate = totalGames > 0 ? 
      Number(((statistics.wins / totalGames) * 100).toFixed(1)) : 0;

    // Calculate PR per match
    const prPerMatch = totalGames > 0 ?
      Number((statistics.totalPR / totalGames).toFixed(1)) : 0;

    // Calculate consistency (standard deviation of DS)
    const dsValues = matches.map(m => m.result.ds);
    const avgDS = statistics.averageDS;
    const variance = dsValues.reduce((acc, ds) => acc + Math.pow(ds - avgDS, 2), 0) / dsValues.length;
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
    const matches = player.matches;
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
}