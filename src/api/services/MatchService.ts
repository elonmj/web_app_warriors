import {
  Match,
  MatchScore,
  MatchResult,
  CreateMatchInput,
  UpdateMatchResultInput
} from '../../types/Match';
import { Player, PlayerMatch } from '../../types/Player';
import { MatchStatusType, ValidationStatusType, PlayerCategoryType } from '../../types/Enums';
import { RatingSystem } from '../../lib/RatingSystem';
import { CategoryManager } from '../../lib/CategoryManager';
import { StatisticsCalculator } from '../../lib/Statistics';
import { FirebasePlayerRepository } from '../repository/FirebasePlayerRepository';
import { FirebaseEventRepository } from '../repository/FirebaseEventRepository';

export class MatchService {
  private ratingSystem: RatingSystem;
  private playerRepository: FirebasePlayerRepository;
  private eventRepository: FirebaseEventRepository;

  constructor(ratingSystemConfig = {}) {
    this.ratingSystem = new RatingSystem(ratingSystemConfig);
    this.playerRepository = new FirebasePlayerRepository();
    this.eventRepository = new FirebaseEventRepository();

    // Initialize repositories
    this.initializeRepositories().catch(error => {
      console.error('Failed to initialize repositories:', error);
    });
  }

  private async initializeRepositories() {
    // This will ensure the players file exists and is properly structured
    await this.playerRepository.getAllPlayers();
  }

  async createMatch(input: CreateMatchInput): Promise<Match> {
    try {
      const { player1Id, player2Id, eventId, isRandom = false, round } = input;
      
      // Verify event and round
      const event = await this.eventRepository.getEvent(eventId);
      if (!event || !event.metadata) {
        throw new Error('Event not found');
      }

      if (!round) {
        throw new Error('Round number is required');
      }

      if (round !== event.metadata.currentRound) {
        throw new Error('Can only create matches in current round');
      }

      const now = new Date().toISOString();
      const [player1, player2] = await Promise.all([
        this.playerRepository.getPlayer(player1Id),
        this.playerRepository.getPlayer(player2Id)
      ]);

      if (!player1 || !player2) {
        throw new Error(`Players not found: ${!player1 ? player1Id : player2Id}`);
      }

      const match: Match = {
        id: `${eventId}-R${round}-${Date.now()}-${player1Id}-${player2Id}`,
        eventId,
        date: now.split('T')[0],
        player1: {
          id: player1.id, // Already a string
          ratingBefore: player1.currentRating,
          ratingAfter: player1.currentRating,
          categoryBefore: player1.category as PlayerCategoryType,
          categoryAfter: player1.category as PlayerCategoryType
        },
        player2: {
          id: player2.id, // Already a string
          ratingBefore: player2.currentRating,
          ratingAfter: player2.currentRating,
          categoryBefore: player2.category as PlayerCategoryType,
          categoryAfter: player2.category as PlayerCategoryType
        },
        status: "pending" as MatchStatusType,
        metadata: {
          round,
          isRandom,
          createdAt: now,
          updatedAt: now
        }
      };

      await this.eventRepository.addEventMatch(eventId, match);
      return match;
    } catch (error) {
      console.error('Error creating match:', error);
      throw new Error('Failed to create match');
    }
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

  async processMatchResult(match: Match, input: UpdateMatchResultInput): Promise<{ 
    updatedMatch: Match; 
    player1Update: Partial<Player>; 
    player2Update: Partial<Player>; 
  }> {
    try {
      // Verify event and round
      const event = await this.eventRepository.getEvent(match.eventId);
      if (!event || !event.metadata) {
        throw new Error('Event not found');
      }

      if (match.metadata.round !== event.metadata.currentRound) {
        throw new Error('Can only update matches in current round');
      }

      const { score } = input;
      const now = new Date().toISOString();

      if (score.player1Score < 0 || score.player2Score < 0) {
        throw new Error("Scores cannot be negative");
      }

      const result: MatchResult = {
        score: [score.player1Score, score.player2Score],
        pr: this.calculatePR(score.player1Score, score.player2Score),
        pdi: this.calculatePDI(score.player1Score, score.player2Score),
        ds: this.calculateDS(score.player1Score, score.player2Score),
     
      };

      // Calculate new ratings
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
      const newCategory1 = CategoryManager.determineCategory(newRating1);
      const newCategory2 = CategoryManager.determineCategory(newRating2);

      // Create player match records
      const playerMatch1: PlayerMatch = {
        date: now,
        eventId: match.eventId,
        matchId: match.id,
        opponent: {
          id: match.player2.id, // Already a string from the Match type
          ratingAtTime: match.player2.ratingBefore,
          categoryAtTime: match.player2.categoryBefore
        },
        result: {
          score: [score.player1Score, score.player2Score],
          pr: result.pr,
          pdi: result.pdi,
          ds: result.ds
        },
        ratingChange: {
          before: match.player1.ratingBefore,
          after: newRating1,
          change: newRating1 - match.player1.ratingBefore
        },
        categoryAtTime: match.player1.categoryBefore
      };

      const playerMatch2: PlayerMatch = {
        date: now,
        eventId: match.eventId,
        matchId: match.id,
        opponent: {
          id: match.player1.id, // Already a string from the Match type
          ratingAtTime: match.player1.ratingBefore,
          categoryAtTime: match.player1.categoryBefore
        },
        result: {
          score: [score.player2Score, score.player1Score],
          pr: score.player2Score > score.player1Score ? 3 : (score.player2Score === score.player1Score ? 1 : 0),
          pdi: result.pdi,
          ds: result.ds
        },
        ratingChange: {
          before: match.player2.ratingBefore,
          after: newRating2,
          change: newRating2 - match.player2.ratingBefore
        },
        categoryAtTime: match.player2.categoryBefore
      };

      // Update the match
      const updatedMatch: Match = {
        ...match,
        result,
        status: "completed" as MatchStatusType,
        player1: {
          ...match.player1,
          ratingAfter: newRating1,
          categoryAfter: newCategory1
        },
        player2: {
          ...match.player2,
          ratingAfter: newRating2,
          categoryAfter: newCategory2
        },
        metadata: { ...match.metadata, updatedAt: now }
      };

      // Save all updates
      await this.eventRepository.updateEventMatch(match.eventId, match.id, updatedMatch);

      const player1Update = { 
        id: match.player1.id,
        currentRating: newRating1,
        category: newCategory1
      };
      const player2Update = {
        id: match.player2.id,
        currentRating: newRating2,
        category: newCategory2
      };

      // Update players
      await Promise.all([
        this.playerRepository.updatePlayer(player1Update.id, player1Update),
        this.playerRepository.updatePlayer(player2Update.id, player2Update),
        this.playerRepository.addMatchToPlayer(match.player1.id, playerMatch1),
        this.playerRepository.addMatchToPlayer(match.player2.id, playerMatch2)
      ]);

      return {
        updatedMatch,
        player1Update,
        player2Update
      };
    } catch (error) {
      console.error('Error processing match result:', error);
      throw new Error('Failed to process match result');
    }
  }

  async getMatchById(eventId: string, matchId: string): Promise<Match | null> {
    try {
      const event = await this.eventRepository.getEvent(eventId);
      if (!event || !event.metadata) {
        throw new Error('Event not found');
      }

      // Check current round first
      const currentRound = event.metadata.currentRound;
      const matches = await this.eventRepository.getRoundMatches(eventId, currentRound);
      const match = matches.find(m => m.id === matchId);
      if (match) return match;

      // If not found, check other rounds
      for (let round = 1; round <= event.metadata.totalRounds; round++) {
        if (round === currentRound) continue;
        const roundMatches = await this.eventRepository.getRoundMatches(eventId, round);
        const match = roundMatches.find(m => m.id === matchId);
        if (match) return match;
      }

      return null;
    } catch (error) {
      console.error('Error getting match:', error);
      return null;
    }
  }
}
