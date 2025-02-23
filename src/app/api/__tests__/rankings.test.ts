import { describe, expect, test, beforeEach } from '@jest/globals';
import { RankingService } from '@/api/services/RankingService';
import { EventRepository } from '@/api/repository/eventRepository';
import { PlayerRepository } from '@/api/repository/playerRepository';
import { Match } from '@/types/Match';
import { Player } from '@/types/Player';
import { Event } from '@/types/Event';
import { EventRanking } from '@/types/Ranking';
import { 
  EventStatus, 
  EventType,
  PlayerCategory, 
  MatchStatus,
  ValidationStatus
} from '@/types/Enums';

describe('RankingService', () => {
  let rankingService: RankingService;
  const mockEventRepo = {
    getEvent: jest.fn<Promise<Event | null>, [string]>(),
    getRoundMatches: jest.fn<Promise<Match[]>, [string, number]>(),
    saveRoundRankings: jest.fn<Promise<void>, [string, number, EventRanking]>(),
    getRoundRankings: jest.fn<Promise<EventRanking | null>, [string, number]>()
  };

  const mockPlayerRepo = {
    getAllPlayers: jest.fn<Promise<Player[]>, []>()
  };

  // Mock test data
  const mockEvent: Event = {
    id: 'test-event',
    name: 'Test Event',
    type: EventType.ROUND_ROBIN,
    status: EventStatus.OPEN,
    startDate: new Date('2025-01-01'),
    endDate: new Date('2025-12-31'),
    metadata: {
      totalRounds: 3,
      currentRound: 1,
      totalMatches: 2,
      totalPlayers: 4,
      lastUpdated: new Date().toISOString(),
      roundHistory: {},
      byeHistory: []
    }
  };

  const mockPlayers: Player[] = [
    {
      id: 'player1',
      name: 'Player 1',
      currentRating: 1200,
      category: PlayerCategory.DIAMANT,
      statistics: {
        totalMatches: 10,
        wins: 6,
        draws: 2,
        losses: 2,
        forfeits: { given: 0, received: 0 },
        totalPR: 20,
        averageDS: 75,
        inactivityWeeks: 0,
        bestRating: 1250,
        worstRating: 1150,
        categoryHistory: [{
          category: PlayerCategory.DIAMANT,
          from: '2025-01-01',
          reason: 'rating_change'
        }],
        eventParticipation: []
      },
      matches: []
    },
    {
      id: 'player2',
      name: 'Player 2',
      currentRating: 1100,
      category: PlayerCategory.TOPAZE,
      statistics: {
        totalMatches: 8,
        wins: 4,
        draws: 2,
        losses: 2,
        forfeits: { given: 0, received: 0 },
        totalPR: 16,
        averageDS: 70,
        inactivityWeeks: 0,
        bestRating: 1150,
        worstRating: 1050,
        categoryHistory: [{
          category: PlayerCategory.TOPAZE,
          from: '2025-01-01',
          reason: 'rating_change'
        }],
        eventParticipation: []
      },
      matches: []
    }
  ];

  const mockMatches: Match[] = [{
    id: 'match1',
    eventId: 'test-event',
    date: '2025-01-01',
    player1: {
      id: 'player1',
      ratingBefore: 1200,
      ratingAfter: 1210,
      categoryBefore: PlayerCategory.DIAMANT,
      categoryAfter: PlayerCategory.DIAMANT
    },
    player2: {
      id: 'player2',
      ratingBefore: 1100,
      ratingAfter: 1090,
      categoryBefore: PlayerCategory.TOPAZE,
      categoryAfter: PlayerCategory.TOPAZE
    },
    status: MatchStatus.COMPLETED,
    result: {
      score: [2, 1],
      pr: 3,
      pdi: 0.33,
      ds: 33,
      validation: {
        player1Approved: true,
        player2Approved: true,
        timestamp: '2025-01-01T12:00:00Z',
        status: ValidationStatus.VALID
      }
    },
    metadata: {
      round: 1,
      isRandom: false,
      createdAt: '2025-01-01T10:00:00Z',
      updatedAt: '2025-01-01T12:00:00Z'
    }
  }];

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup mock implementations
    mockEventRepo.getEvent.mockResolvedValue(mockEvent);
    mockEventRepo.getRoundMatches.mockResolvedValue(mockMatches);
    mockEventRepo.saveRoundRankings.mockResolvedValue(undefined);
    mockEventRepo.getRoundRankings.mockResolvedValue(null);
    mockPlayerRepo.getAllPlayers.mockResolvedValue(mockPlayers);

    // Initialize service with mocked repositories
    rankingService = new RankingService(
      mockEventRepo as unknown as EventRepository,
      mockPlayerRepo as unknown as PlayerRepository
    );
  });

  describe('getRoundRankings', () => {
    test('should return rankings for a specific round', async () => {
      const rankings = await rankingService.getRoundRankings('test-event', 1);

      expect(rankings).toBeDefined();
      expect(rankings.eventId).toBe('test-event');
      expect(rankings.rankings).toHaveLength(2);
      expect(rankings.rankings[0].playerId).toBe('player1');
      expect(rankings.rankings[0].rank).toBe(1);

      expect(mockEventRepo.getEvent).toHaveBeenCalledWith('test-event');
      expect(mockEventRepo.getRoundMatches).toHaveBeenCalledWith('test-event', 1);
    });

    test('should handle non-existent round', async () => {
      mockEventRepo.getRoundMatches.mockResolvedValue([]);

      const rankings = await rankingService.getRoundRankings('test-event', 2);

      expect(rankings).toBeDefined();
      expect(rankings.rankings).toHaveLength(0);
      expect(mockEventRepo.getRoundMatches).toHaveBeenCalledWith('test-event', 2);
    });

    test('should handle invalid event', async () => {
      mockEventRepo.getEvent.mockResolvedValue(null);

      try {
        await rankingService.getRoundRankings('invalid-event', 1);
        fail('Expected an error to be thrown');
      } catch (err) {
        const error = err as Error;
        expect(error).toBeInstanceOf(Error);
        expect(error.message).toBe('Failed to get round rankings');
      }
      
      expect(mockEventRepo.getEvent).toHaveBeenCalledWith('invalid-event');
    });
  });

  describe('getGlobalRankings', () => {
    test('should return global rankings', async () => {
      const rankings = await rankingService.getGlobalRankings();

      expect(rankings).toBeDefined();
      expect(rankings.eventId).toBe('global');
      expect(rankings.rankings).toHaveLength(2);
      expect(rankings.rankings[0].rating).toBeGreaterThan(rankings.rankings[1].rating);
      expect(mockPlayerRepo.getAllPlayers).toHaveBeenCalled();
    });

    test('should handle empty player list', async () => {
      mockPlayerRepo.getAllPlayers.mockResolvedValue([]);

      const rankings = await rankingService.getGlobalRankings();

      expect(rankings).toBeDefined();
      expect(rankings.rankings).toHaveLength(0);
      expect(mockPlayerRepo.getAllPlayers).toHaveBeenCalled();
    });
  });

  describe('updateRoundRankings', () => {
    test('should calculate and save round rankings', async () => {
      const rankings = await rankingService.updateRoundRankings('test-event', 1);

      expect(rankings).toBeDefined();
      expect(rankings.eventId).toBe('test-event');
      expect(mockEventRepo.saveRoundRankings).toHaveBeenCalledWith(
        'test-event',
        1,
        expect.any(Object)
      );
    });

    test('should handle incomplete matches', async () => {
      const incompleteMatch: Match = {
        ...mockMatches[0],
        status: MatchStatus.PENDING,
        result: undefined
      };
      mockEventRepo.getRoundMatches.mockResolvedValue([incompleteMatch]);

      const rankings = await rankingService.updateRoundRankings('test-event', 1);

      expect(rankings).toBeDefined();
      expect(rankings.rankings).toHaveLength(0);
    });

    test('should handle invalid round number', async () => {
      mockEvent.metadata!.totalRounds = 1;
      mockEventRepo.getEvent.mockResolvedValue(mockEvent);

      try {
        await rankingService.updateRoundRankings('test-event', 2);
        fail('Expected an error to be thrown');
      } catch (err) {
        const error = err as Error;
        expect(error).toBeInstanceOf(Error);
        expect(error.message).toBe('Failed to update round rankings');
      }

      expect(mockEventRepo.getRoundMatches).not.toHaveBeenCalled();
    });
  });
});