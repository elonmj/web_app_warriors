import { Match, MatchResult, MatchScore, calculateMatchResult } from './Match';
import { Player, PlayerMatch } from './Player';
import { RatingSystem } from './RatingSystem';
import { StatisticsCalculator } from './Statistics';
import { determineCategory, isValidCategory } from './Category';

class MatchManager {
  private ratingSystem: RatingSystem;

  constructor(ratingSystemConfig = {}) {
    this.ratingSystem = new RatingSystem(ratingSystemConfig);
  }

  /**
   * Create a new match between two players
   */
  createMatch(
    player1: Player,
    player2: Player
  ): Match {
    // Both categories are validated when set on Player objects
    return {
      id: `${Date.now()}-${player1.id}-${player2.id}`,
      date: new Date().toISOString().split('T')[0],
      player1: player1.id,
      player2: player2.id,
      player1Rating: player1.currentRating,
      player2Rating: player2.currentRating,
      player1Category: player1.category,
      player2Category: player2.category,
      status: 'pending',
      isRandom: false
    };
  }

  /**
   * Process a completed match
   */
  processMatch(
    match: Match,
    score: MatchScore,
    previousMatches: Match[] = []
  ): {
    updatedMatch: Match;
    player1Update: Partial<Player>;
    player2Update: Partial<Player>;
  } {
    // Calculate match result
    const matchResult = calculateMatchResult(match, score, previousMatches);

    // Calculate new ratings
    const [newRating1, newRating2] = this.ratingSystem.processMatchRatings({
      ...match,
      result: matchResult
    });

    // Create player match records
    const player1Match: PlayerMatch = {
      date: match.date,
      opponent: match.player2,
      opponentRating: match.player2Rating,
      result: {
        score: matchResult.score,
        pr: matchResult.pr,
        pdi: matchResult.pdi,
        ds: matchResult.ds
      },
      ratingChange: newRating1 - match.player1Rating,
      categoryAtTime: match.player1Category
    };

    const player2Match: PlayerMatch = {
      date: match.date,
      opponent: match.player1,
      opponentRating: match.player1Rating,
      result: {
        score: [matchResult.score[1], matchResult.score[0]] as [number, number],
        pr: matchResult.score[1] > matchResult.score[0] ? 3 : 1,
        pdi: matchResult.pdi,
        ds: matchResult.ds
      },
      ratingChange: newRating2 - match.player2Rating,
      categoryAtTime: match.player2Category
    };

    // Determine new categories
    const newCategory1 = determineCategory(newRating1);
    const newCategory2 = determineCategory(newRating2);

    // Update player statistics
    const updatedStats1 = StatisticsCalculator.updatePlayerStatistics(
      { totalMatches: 0, wins: 0, draws: 0, losses: 0, totalPR: 0, averageDS: 0, inactivityWeeks: 0 },
      player1Match
    );
    const updatedStats2 = StatisticsCalculator.updatePlayerStatistics(
      { totalMatches: 0, wins: 0, draws: 0, losses: 0, totalPR: 0, averageDS: 0, inactivityWeeks: 0 },
      player2Match
    );

    // Return updated data
    return {
      updatedMatch: {
        ...match,
        status: 'completed',
        result: matchResult
      },
      player1Update: {
        currentRating: newRating1,
        category: newCategory1,
        matches: [player1Match],
        statistics: updatedStats1
      },
      player2Update: {
        currentRating: newRating2,
        category: newCategory2,
        matches: [player2Match],
        statistics: updatedStats2
      }
    };
  }

  /**
   * Process a forfeit match
   */
  processForfeitMatch(
    match: Match,
    winner: string,
    reason: string
  ): {
    updatedMatch: Match;
    player1Update: Partial<Player>;
    player2Update: Partial<Player>;
  } {
    const isPlayer1Winner = match.player1 === winner;
    const matchResult: MatchResult = {
      score: isPlayer1Winner ? [1, 0] : [0, 1] as [number, number],
      pr: isPlayer1Winner ? 3 : 0,
      pdi: isPlayer1Winner ? 3 : 0,
      ds: 100 // Maximum DS for forfeit
    };

    // Calculate rating changes (simplified for forfeits)
    const [newRating1, newRating2] = this.ratingSystem.processMatchRatings({
      ...match,
      result: matchResult
    });

    // Create player match records
    const player1Match: PlayerMatch = {
      date: match.date,
      opponent: match.player2,
      opponentRating: match.player2Rating,
      result: matchResult,
      ratingChange: newRating1 - match.player1Rating,
      categoryAtTime: match.player1Category
    };

    const player2Match: PlayerMatch = {
      date: match.date,
      opponent: match.player1,
      opponentRating: match.player1Rating,
      result: {
        score: [matchResult.score[1], matchResult.score[0]] as [number, number],
        pr: isPlayer1Winner ? 0 : 3,
        pdi: isPlayer1Winner ? 0 : 3,
        ds: 100
      },
      ratingChange: newRating2 - match.player2Rating,
      categoryAtTime: match.player2Category
    };

    // Determine new categories
    const newCategory1 = determineCategory(newRating1);
    const newCategory2 = determineCategory(newRating2);

    // Update statistics
    const updatedStats1 = StatisticsCalculator.updatePlayerStatistics(
      { totalMatches: 0, wins: 0, draws: 0, losses: 0, totalPR: 0, averageDS: 0, inactivityWeeks: 0 },
      player1Match
    );
    const updatedStats2 = StatisticsCalculator.updatePlayerStatistics(
      { totalMatches: 0, wins: 0, draws: 0, losses: 0, totalPR: 0, averageDS: 0, inactivityWeeks: 0 },
      player2Match
    );

    return {
      updatedMatch: {
        ...match,
        status: 'forfeit',
        result: matchResult
      },
      player1Update: {
        currentRating: newRating1,
        category: newCategory1,
        matches: [player1Match],
        statistics: updatedStats1
      },
      player2Update: {
        currentRating: newRating2,
        category: newCategory2,
        matches: [player2Match],
        statistics: updatedStats2
      }
    };
  }
}

export { MatchManager };