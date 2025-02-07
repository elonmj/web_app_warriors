import { Match, MatchScore, UpdateMatchResultInput } from '../../lib/Match';
import { Player } from '../../lib/Player';
import { MatchManager } from '../../lib/MatchManager';
import { RatingService } from './RatingService';
import { StatisticsService } from './StatisticsService';
import { determineCategory } from '../../lib/Category';

export class MatchService {
  private matchManager: MatchManager;
  private ratingService: RatingService;
  private statisticsService: StatisticsService;

  constructor() {
    this.matchManager = new MatchManager();
    this.ratingService = new RatingService();
    this.statisticsService = new StatisticsService();
  }

  /**
   * Create a new match between players
   */
  async createMatch(
    player1: Player,
    player2: Player,
    category?: string
  ): Promise<Match> {
    // Use highest category if not specified
    const matchCategory = category || determineCategory(Math.max(
      player1.currentRating,
      player2.currentRating
    ));

    return this.matchManager.createMatch(player1, player2, matchCategory);
  }

  /**
   * Process a match result
   */
  async processMatchResult(
    input: UpdateMatchResultInput,
    match: Match,
    player1: Player,
    player2: Player,
    previousMatches: Match[] = []
  ): Promise<{
    updatedMatch: Match;
    updatedPlayer1: Player;
    updatedPlayer2: Player;
  }> {
    // Process forfeit if specified
    if (input.forfeit) {
      const result = this.matchManager.processForfeitMatch(
        match,
        input.forfeit.winner,
        input.forfeit.reason
      );

      // Update player objects with new data
      const updatedPlayer1: Player = {
        ...player1,
        currentRating: result.player1Update.currentRating!,
        category: result.player1Update.category!,
        matches: [...player1.matches, result.player1Update.matches![0]],
        statistics: result.player1Update.statistics!
      };

      const updatedPlayer2: Player = {
        ...player2,
        currentRating: result.player2Update.currentRating!,
        category: result.player2Update.category!,
        matches: [...player2.matches, result.player2Update.matches![0]],
        statistics: result.player2Update.statistics!
      };

      return {
        updatedMatch: result.updatedMatch,
        updatedPlayer1,
        updatedPlayer2
      };
    }

    // Process normal match
    const result = this.matchManager.processMatch(
      match,
      input.score,
      previousMatches
    );

    // Update player objects with new data
    const updatedPlayer1: Player = {
      ...player1,
      currentRating: result.player1Update.currentRating!,
      category: result.player1Update.category!,
      matches: [...player1.matches, result.player1Update.matches![0]],
      statistics: result.player1Update.statistics!
    };

    const updatedPlayer2: Player = {
      ...player2,
      currentRating: result.player2Update.currentRating!,
      category: result.player2Update.category!,
      matches: [...player2.matches, result.player2Update.matches![0]],
      statistics: result.player2Update.statistics!
    };

    return {
      updatedMatch: result.updatedMatch,
      updatedPlayer1,
      updatedPlayer2
    };
  }

  /**
   * Get match by ID
   */
  async getMatch(matchId: string, matches: Match[]): Promise<Match | null> {
    return matches.find(m => m.id === matchId) || null;
  }

  /**
   * Get matches for a specific player
   */
  async getPlayerMatches(
    playerId: string,
    matches: Match[],
    limit?: number
  ): Promise<Match[]> {
    const playerMatches = matches.filter(
      m => m.player1 === playerId || m.player2 === playerId
    );
    
    // Sort by date descending
    playerMatches.sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    return limit ? playerMatches.slice(0, limit) : playerMatches;
  }

  /**
   * Get preview of potential match outcome
   */
  async getMatchPreview(
    player1: Player,
    player2: Player
  ): Promise<{
    estimatedWinProbability: number;
    potentialRatingChanges: {
      win: { player1: number; player2: number };
      draw: { player1: number; player2: number };
      loss: { player1: number; player2: number };
    };
  }> {
    const winProb = await this.ratingService.calculateWinProbability(
      player1.currentRating,
      player2.currentRating
    );

    // Simulate win scenario
    const winMatch: Match = {
      id: 'preview',
      date: new Date().toISOString().split('T')[0],
      player1: player1.id,
      player2: player2.id,
      player1Rating: player1.currentRating,
      player2Rating: player2.currentRating,
      category: player1.category,
      status: 'completed',
      isRandom: false,
      result: {
        score: [3, 0] as [number, number],
        pr: 3,
        pdi: 3,
        ds: 100
      }
    };

    // Simulate draw scenario
    const drawMatch: Match = {
      ...winMatch,
      result: {
        score: [2, 2] as [number, number],
        pr: 2,
        pdi: 2,
        ds: 0
      }
    };

    // Simulate loss scenario
    const lossMatch: Match = {
      ...winMatch,
      result: {
        score: [0, 3] as [number, number],
        pr: 1,
        pdi: 1,
        ds: 100
      }
    };

    const [winRating1, winRating2] = await this.ratingService.calculateNewRatings(winMatch);
    const [drawRating1, drawRating2] = await this.ratingService.calculateNewRatings(drawMatch);
    const [lossRating1, lossRating2] = await this.ratingService.calculateNewRatings(lossMatch);

    return {
      estimatedWinProbability: winProb,
      potentialRatingChanges: {
        win: {
          player1: winRating1 - player1.currentRating,
          player2: winRating2 - player2.currentRating
        },
        draw: {
          player1: drawRating1 - player1.currentRating,
          player2: drawRating2 - player2.currentRating
        },
        loss: {
          player1: lossRating1 - player1.currentRating,
          player2: lossRating2 - player2.currentRating
        }
      }
    };
  }
}