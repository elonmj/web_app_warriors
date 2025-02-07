import { Match, MatchResult } from './Match';
import { Player, PlayerMatch, PlayerStatistics } from './Player';

class StatisticsCalculator {
  /**
   * Calculate total Points de Rencontre (PR) from matches
   */
  private static calculateTotalPR(matches: PlayerMatch[]): number {
    return matches.reduce((total, match) => total + match.result.pr, 0);
  }

  /**
   * Calculate average Différence de Score (DS) from matches
   */
  private static calculateAverageDS(matches: PlayerMatch[]): number {
    if (matches.length === 0) return 0;
    const totalDS = matches.reduce((sum, match) => sum + match.result.ds, 0);
    return Math.round((totalDS / matches.length) * 10) / 10; // Round to 1 decimal
  }

  /**
   * Calculate number of weeks since last match
   */
  private static calculateInactivityWeeks(lastMatchDate: string): number {
    const lastMatch = new Date(lastMatchDate);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - lastMatch.getTime());
    const diffWeeks = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 7));
    return diffWeeks;
  }

  /**
   * Calculate win/loss statistics from matches
   */
  private static calculateWinLossStats(matches: PlayerMatch[]): {
    wins: number;
    draws: number;
    losses: number;
  } {
    return matches.reduce((stats, match) => {
      const [playerScore, opponentScore] = match.result.score;
      if (playerScore > opponentScore) {
        stats.wins++;
      } else if (playerScore === opponentScore) {
        stats.draws++;
      } else {
        stats.losses++;
      }
      return stats;
    }, { wins: 0, draws: 0, losses: 0 });
  }

  /**
   * Calculate player statistics from their match history
   */
  static calculatePlayerStatistics(player: Player): PlayerStatistics {
    if (player.matches.length === 0) {
      return {
        totalMatches: 0,
        wins: 0,
        draws: 0,
        losses: 0,
        totalPR: 0,
        averageDS: 0,
        inactivityWeeks: 0
      };
    }

    const winLossStats = this.calculateWinLossStats(player.matches);
    const lastMatch = player.matches[player.matches.length - 1];

    return {
      totalMatches: player.matches.length,
      ...winLossStats,
      totalPR: this.calculateTotalPR(player.matches),
      averageDS: this.calculateAverageDS(player.matches),
      inactivityWeeks: this.calculateInactivityWeeks(lastMatch.date)
    };
  }

  /**
   * Update player statistics based on a new match result
   */
  static updatePlayerStatistics(
    currentStats: PlayerStatistics,
    newMatch: PlayerMatch
  ): PlayerStatistics {
    const [playerScore, opponentScore] = newMatch.result.score;
    
    return {
      totalMatches: currentStats.totalMatches + 1,
      wins: currentStats.wins + (playerScore > opponentScore ? 1 : 0),
      draws: currentStats.draws + (playerScore === opponentScore ? 1 : 0),
      losses: currentStats.losses + (playerScore < opponentScore ? 1 : 0),
      totalPR: currentStats.totalPR + newMatch.result.pr,
      averageDS: (currentStats.averageDS * currentStats.totalMatches + newMatch.result.ds) / (currentStats.totalMatches + 1),
      inactivityWeeks: 0 // Reset on new match
    };
  }
}

interface EventStatistics {
  eventId: string;
  totalMatches: number;
  completedMatches: number;
  activePlayers: number;
  matchesPerCategory: Record<string, number>;
  categoryDistribution: Record<string, number>;
  averageRating: number;
  averageDS: number;
}

class EventStatisticsCalculator {
  /**
   * Calculate event-wide statistics
   */
  static calculateEventStatistics(
    matches: Match[],
    players: Player[]
  ): EventStatistics {
    const completedMatches = matches.filter(m => m.status === 'completed');
    const categoryMatches: Record<string, number> = {};
    const categoryPlayers: Record<string, number> = {};
    
    // Calculate category distributions
    matches.forEach(match => {
      // Count both player categories for the match
      categoryMatches[match.player1Category] = (categoryMatches[match.player1Category] || 0) + 1;
      categoryMatches[match.player2Category] = (categoryMatches[match.player2Category] || 0) + 1;
    });
    
    players.forEach(player => {
      categoryPlayers[player.category] = (categoryPlayers[player.category] || 0) + 1;
    });

    // Calculate averages
    const totalRating = players.reduce((sum, p) => sum + p.currentRating, 0);
    const totalDS = completedMatches.reduce((sum, m) => sum + (m.result?.ds || 0), 0);

    return {
      eventId: matches[0]?.id.split('-')[0] || '', // Assuming event ID is first part of match ID
      totalMatches: matches.length,
      completedMatches: completedMatches.length,
      activePlayers: players.filter(p => p.statistics.inactivityWeeks < 2).length,
      matchesPerCategory: categoryMatches,
      categoryDistribution: categoryPlayers,
      averageRating: Math.round(totalRating / players.length),
      averageDS: Math.round((totalDS / completedMatches.length) * 10) / 10
    };
  }
}

export { StatisticsCalculator, EventStatisticsCalculator };
export type { EventStatistics };