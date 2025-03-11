import { Match, MatchScore, PlayerMatchInfo, MatchResult } from '../types/Match';
import { Player } from '../types/Player';
import { RatingSystem } from './RatingSystem';
import { CategoryManager } from './CategoryManager';
import { v4 as uuidv4 } from 'uuid';
import { PlayerStatistics } from '../types/Player';
import { ValidationStatusType } from '../types/Enums';

interface MatchUpdateResult {
  updatedMatch: Match;
  player1Update: Partial<Player>;
  player2Update: Partial<Player>;
}

export class MatchManager {
  private ratingSystem: RatingSystem;

  constructor() {
    this.ratingSystem = new RatingSystem();
  }

  createMatch(player1: Player, player2: Player): Match {
    const player1Info: PlayerMatchInfo = {
      id: player1.id,
      ratingBefore: player1.currentRating,
      ratingAfter: player1.currentRating,
      categoryBefore: player1.category,
      categoryAfter: player1.category
    };

    const player2Info: PlayerMatchInfo = {
      id: player2.id,
      ratingBefore: player2.currentRating,
      ratingAfter: player2.currentRating,
      categoryBefore: player2.category,
      categoryAfter: player2.category
    };

    return {
      id: uuidv4(),
      eventId: '', // Will be set by the event system
      date: new Date().toISOString().split('T')[0],
      player1: player1Info,
      player2: player2Info,
      status: 'pending',
      metadata: {
        round: 1,
        isRandom: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    };
  }

  processMatch(match: Match, scores: { player1Score: number; player2Score: number }): MatchUpdateResult {
    if (scores.player1Score < 0 || scores.player2Score < 0) {
      throw new Error('Scores cannot be negative');
    }

    const { player1Score, player2Score } = scores;
    const scoreDifference = Math.abs(player1Score - player2Score);
    const ds = this.calculateDS(scoreDifference);
    
    // Calculate PR (Performance Rating) based on score difference
    const pr = this.calculatePR(scoreDifference);
    
    // Calculate PDI (Player Dominance Index)
    const pdi = this.calculatePDI(player1Score, player2Score);

    // Create temp players for rating calculation
    const tempPlayer1: Player = {
      id: match.player1.id,
      name: '',
      currentRating: match.player1.ratingBefore,
      category: match.player1.categoryBefore,
      matches: [],
      statistics: { 
        totalMatches: 0, wins: 0, draws: 0, losses: 0, 
        forfeits: { given: 0, received: 0 },
        totalPR: 0, averageDS: 0, inactivityWeeks: 0,
        bestRating: 0, worstRating: 0,
        categoryHistory: [],
        eventParticipation: []
      }
    };

    const tempPlayer2: Player = {
      id: match.player2.id,
      name: '',
      currentRating: match.player2.ratingBefore,
      category: match.player2.categoryBefore,
      matches: [],
      statistics: {
        totalMatches: 0, wins: 0, draws: 0, losses: 0,
        forfeits: { given: 0, received: 0 },
        totalPR: 0, averageDS: 0, inactivityWeeks: 0,
        bestRating: 0, worstRating: 0,
        categoryHistory: [],
        eventParticipation: []
      }
    };

    // Calculate result with ratings
    const result: MatchResult = {
      score: [player1Score, player2Score],
      pr,
      pdi,
      ds,
     
    };

    const [newRating1, newRating2] = this.ratingSystem.processMatchRatings({
      ...match,
      player1Rating: match.player1.ratingBefore,
      player2Rating: match.player2.ratingBefore,
      result
    } as any);

    // Determine category changes
    const player1NewCategory = CategoryManager.determineCategory(newRating1);
    const player2NewCategory = CategoryManager.determineCategory(newRating2);

    // Update player info
    const updatedPlayer1Info: PlayerMatchInfo = {
      ...match.player1,
      ratingAfter: newRating1,
      categoryAfter: player1NewCategory
    };

    const updatedPlayer2Info: PlayerMatchInfo = {
      ...match.player2,
      ratingAfter: newRating2,
      categoryAfter: player2NewCategory
    };

    const updatedMatch: Match = {
      ...match,
      status: 'completed',
      player1: updatedPlayer1Info,
      player2: updatedPlayer2Info,
      result,
      metadata: {
        ...match.metadata,
        updatedAt: new Date().toISOString()
      }
    };

    return {
      updatedMatch,
      player1Update: {
        currentRating: newRating1,
        category: player1NewCategory
      },
      player2Update: {
        currentRating: newRating2,
        category: player2NewCategory
      }
    };
  }

  processForfeitMatch(match: Match, forfeitingPlayerId: string, reason: string): MatchUpdateResult {
    const isPlayer1Forfeiting = forfeitingPlayerId === match.player1.id;
    const ds = 100; // Maximum DS for forfeits

    // Set forfeit scores
    const player1Score = isPlayer1Forfeiting ? 0 : 400;
    const player2Score = isPlayer1Forfeiting ? 400 : 0;

    // Create result with ratings
    const result: MatchResult = {
      score: [player1Score, player2Score],
      pr: 0,
      pdi: 5,
      ds,
      
    };

    const [newRating1, newRating2] = this.ratingSystem.processMatchRatings({
      ...match,
      player1Rating: match.player1.ratingBefore,
      player2Rating: match.player2.ratingBefore,
      result
    } as any);

    // Determine category changes
    const player1NewCategory = CategoryManager.determineCategory(newRating1);
    const player2NewCategory = CategoryManager.determineCategory(newRating2);

    // Update player info
    const updatedPlayer1Info: PlayerMatchInfo = {
      ...match.player1,
      ratingAfter: newRating1,
      categoryAfter: player1NewCategory
    };

    const updatedPlayer2Info: PlayerMatchInfo = {
      ...match.player2,
      ratingAfter: newRating2,
      categoryAfter: player2NewCategory
    };

    const updatedMatch: Match = {
      ...match,
      status: 'forfeit',
      player1: updatedPlayer1Info,
      player2: updatedPlayer2Info,
      result,
      metadata: {
        ...match.metadata,
        updatedAt: new Date().toISOString()
      }
    };

    return {
      updatedMatch,
      player1Update: {
        currentRating: newRating1,
        category: player1NewCategory
      },
      player2Update: {
        currentRating: newRating2,
        category: player2NewCategory
      }
    };
  }

  private calculateDS(scoreDifference: number): number {
    // DS (Dominance Score) calculation
    // Base formula: DS = (scoreDifference / 10) ^ 1.5
    return Math.min(100, Math.pow(scoreDifference / 10, 1.5));
  }

  private calculatePR(scoreDifference: number): number {
    // PR (Performance Rating) calculation
    if (scoreDifference <= 20) return 1;
    if (scoreDifference <= 50) return 2;
    if (scoreDifference <= 100) return 3;
    return 4;
  }

  private calculatePDI(score1: number, score2: number): number {
    // PDI (Player Dominance Index) calculation
    const ratio = Math.max(score1, score2) / Math.min(score1, score2);
    if (ratio <= 1.1) return 1;
    if (ratio <= 1.25) return 2;
    if (ratio <= 1.5) return 3;
    return 4;
  }
}

export type { MatchUpdateResult };