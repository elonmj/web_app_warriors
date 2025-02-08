import {
  Match,
  MatchScore,
  MatchResult,
  CreateMatchInput,
  UpdateMatchResultInput
} from '../../types/Match';
import { Player } from '../../types/Player';
import { MatchStatusType, ValidationStatusType, PlayerCategoryType } from '../../types/Enums';
import { RatingSystem } from '../../lib/RatingSystem';
import { CategoryManager } from '../../lib/CategoryManager';
import { StatisticsCalculator } from '../../lib/Statistics';
import { PlayerRepository } from '../repository/playerRepository';

export class MatchService {
  private ratingSystem: RatingSystem;
  private playerRepository: PlayerRepository;

  constructor(ratingSystemConfig = {}) {
    this.ratingSystem = new RatingSystem(ratingSystemConfig);
    this.playerRepository = new PlayerRepository();
  }

  async createMatch(input: CreateMatchInput): Promise<Match> {
    const { player1Id, player2Id, eventId, isRandom = false, round = 1 } = input;
    const now = new Date().toISOString();

    const player1 = await this.playerRepository.getPlayer(player1Id);
    const player2 = await this.playerRepository.getPlayer(player2Id);

    if (!player1 || !player2) {
      throw new Error("Players not found");
    }

    const match: Match = {
      id: `${Date.now()}-${player1Id}-${player2Id}`,
      eventId: eventId,
      date: now.split('T')[0],
      player1: {
        id: player1.id,
        ratingBefore: player1.currentRating,
        ratingAfter: player1.currentRating,
        categoryBefore: player1.category as PlayerCategoryType,
        categoryAfter: player1.category as PlayerCategoryType
      },
      player2: {
        id: player2.id,
        ratingBefore: player2.currentRating,
        ratingAfter: player2.currentRating,
        categoryBefore: player2.category as PlayerCategoryType,
        categoryAfter: player2.category as PlayerCategoryType
      },
      status: "pending" as MatchStatusType,
      metadata: {
        round: round,
        isRandom: isRandom,
        createdAt: now,
        updatedAt: now
      }
    };

    return match;
  }

  private calculatePDI(score1: number, score2: number): number {
    const totalPoints = score1 + score2;
    if (totalPoints === 0) return 0;
    return Math.abs(score1 - score2) / totalPoints;
  }

  private calculateDS(score1: number, score2: number): number {
    const pdi = this.calculatePDI(score1, score2);
    const threshold = 0.8; // configurable
    return pdi >= threshold ? 100 : Math.floor(pdi * 100);
  }

  private calculatePR(score1: number, score2: number): number {
    if (score1 > score2) return 3; // win
    if (score1 === score2) return 1; // draw
    return 0; // loss
  }

  async processMatchResult(match: Match, input: UpdateMatchResultInput): Promise<{ updatedMatch: Match; player1Update: Partial<Player>; player2Update: Partial<Player>; }> {
    const { score } = input;
    const now = new Date().toISOString();

    if (score.player1Score < 0 || score.player2Score < 0) {
      throw new Error("Scores cannot be negative");
    }

    const isDraw = score.player1Score === score.player2Score;
    const winnerId = isDraw ? null : score.player1Score > score.player2Score ? match.player1.id : match.player2.id;

    const result: MatchResult = {
      score: [score.player1Score, score.player2Score],
      pr: this.calculatePR(score.player1Score, score.player2Score),
      pdi: this.calculatePDI(score.player1Score, score.player2Score),
      ds: this.calculateDS(score.player1Score, score.player2Score),
      validation: {
        player1Approved: false,
        player2Approved: false,
        status: "pending" as ValidationStatusType,
        timestamp: now
      }
    };

    // Create temporary match object with old structure for rating calculation
    const ratingMatch = {
      ...match,
      player1Rating: match.player1.ratingBefore,
      player2Rating: match.player2.ratingBefore,
      player1Category: match.player1.categoryBefore,
      player2Category: match.player2.categoryBefore,
      isRandom: match.metadata.isRandom,
      result
    } as any; // Use type assertion since we're adapting to old interface

    const [newRating1, newRating2] = this.ratingSystem.processMatchRatings(ratingMatch);

    const newCategory1 = CategoryManager.determineCategory(newRating1);
    const newCategory2 = CategoryManager.determineCategory(newRating2);

    const updatedPlayer1 = { 
      ...match.player1,
      ratingAfter: newRating1,
      categoryAfter: newCategory1 
    };
    const updatedPlayer2 = { 
      ...match.player2,
      ratingAfter: newRating2,
      categoryAfter: newCategory2 
    };

    const updatedMatch: Match = {
      ...match,
      result: result,
      status: "completed" as MatchStatusType,
      player1: updatedPlayer1,
      player2: updatedPlayer2,
      metadata: { ...match.metadata, updatedAt: now }
    };

    return {
      updatedMatch,
      player1Update: { 
        id: match.player1.id,
        currentRating: newRating1, 
        category: newCategory1 
      },
      player2Update: { 
        id: match.player2.id,
        currentRating: newRating2, 
        category: newCategory2 
      }
    };
  }

  processForfeit(match: Match, winnerId: string, reason: string): { 
    updatedMatch: Match; 
    player1Update: Partial<Player>; 
    player2Update: Partial<Player>; 
  } {
    const now = new Date().toISOString();
    const isPlayer1Winner = match.player1.id === winnerId;

    const result: MatchResult = {
      score: isPlayer1Winner ? [1, 0] : [0, 1],
      pr: isPlayer1Winner ? 3 : 0,
      pdi: 1, // Maximum PDI for forfeit
      ds: 100, // Maximum DS for forfeit
      validation: {
        player1Approved: false,
        player2Approved: false,
        status: "pending" as ValidationStatusType,
        timestamp: now
      }
    };

    // Calculate rating changes (simplified for forfeits)
    const ratingMatch = {
      ...match,
      player1Rating: match.player1.ratingBefore,
      player2Rating: match.player2.ratingBefore,
      player1Category: match.player1.categoryBefore,
      player2Category: match.player2.categoryBefore,
      isRandom: match.metadata.isRandom,
      result
    } as any;

    const [newRating1, newRating2] = this.ratingSystem.processMatchRatings(ratingMatch);

    // Determine new categories
    const newCategory1 = CategoryManager.determineCategory(newRating1);
    const newCategory2 = CategoryManager.determineCategory(newRating2);

    const updatedPlayer1 = {
      ...match.player1,
      ratingAfter: newRating1,
      categoryAfter: newCategory1
    };

    const updatedPlayer2 = {
      ...match.player2,
      ratingAfter: newRating2,
      categoryAfter: newCategory2
    };

    return {
      updatedMatch: {
        ...match,
        status: "forfeit" as MatchStatusType,
        result: result,
        player1: updatedPlayer1,
        player2: updatedPlayer2,
        metadata: { ...match.metadata, updatedAt: now }
      },
      player1Update: {
        id: match.player1.id,
        currentRating: newRating1,
        category: newCategory1
      },
      player2Update: {
        id: match.player2.id,
        currentRating: newRating2,
        category: newCategory2
      }
    };
  }
}
