import { NextRequest } from 'next/server';
import { GET } from '../stats/event/[id]/route';
import { StatisticsService } from '@/api/services/StatisticsService';
import { Match } from '@/lib/Match';
import { Player } from '@/lib/Player';

// Mock repository layer
jest.mock('@/api/repository/eventRepository', () => ({
  getEventMatches: jest.fn(),
  getEventPlayers: jest.fn()
}));

// Mock statistics service
jest.mock('@/api/services/StatisticsService', () => {
  const mockCalculateEventStats = jest.fn();

  return {
    StatisticsService: jest.fn().mockImplementation(() => ({
      calculateEventStats: mockCalculateEventStats
    })),
    mockCalculateEventStats // Export the mock for test usage
  };
});

const { mockCalculateEventStats } = jest.requireMock('@/api/services/StatisticsService');

describe('Event Statistics API Endpoints', () => {
  // Test data
  const mockMatch: Match = {
    id: 'match-1',
    date: '2024-02-06',
    player1: 'player1',
    player2: 'player2',
    player1Rating: 1200,
    player2Rating: 1300,
    player1Category: 'ONYX',
    player2Category: 'ONYX',
    status: 'completed',
    isRandom: false,
    result: {
      score: [450, 380],
      pr: 3,
      pdi: 3,
      ds: 18.42
    }
  };

  const mockPlayer: Player = {
    id: 'player1',
    name: 'Test Player',
    currentRating: 1200,
    category: 'ONYX',
    matches: [],
    statistics: {
      totalMatches: 10,
      wins: 6,
      draws: 2,
      losses: 2,
      totalPR: 20,
      averageDS: 15.5,
      inactivityWeeks: 0
    }
  };

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    
    // Setup default repository mocks
    const { getEventMatches, getEventPlayers } = require('@/api/repository/eventRepository');
    getEventMatches.mockResolvedValue([mockMatch]);
    getEventPlayers.mockResolvedValue([mockPlayer]);
  });

  describe('GET /api/stats/event/[id]', () => {
    it('should return event statistics successfully', async () => {
      // Setup mock statistics response
      const mockStats = {
        eventId: 'event-1',
        totalMatches: 10,
        completedMatches: 8,
        activePlayers: 5,
        matchesPerCategory: {
          'ONYX': 6,
          'AMÉTHYSTE': 4
        },
        categoryDistribution: {
          'ONYX': 3,
          'AMÉTHYSTE': 2
        },
        averageRating: 1250,
        averageDS: 15.5
      };

      mockCalculateEventStats.mockResolvedValue(mockStats);

      // Create request
      const request = new NextRequest(
        new Request('http://localhost/api/stats/event/event-1')
      );

      // Execute
      const response = await GET(request, { params: { id: 'event-1' } });
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data).toEqual(mockStats);
      expect(mockCalculateEventStats).toHaveBeenCalledWith(
        'event-1',
        expect.arrayContaining([mockMatch]),
        expect.arrayContaining([mockPlayer])
      );
    });

    it('should return 404 when no matches found', async () => {
      // Setup mock to return empty matches
      const { getEventMatches } = require('@/api/repository/eventRepository');
      getEventMatches.mockResolvedValue([]);

      // Create request
      const request = new NextRequest(
        new Request('http://localhost/api/stats/event/non-existent')
      );

      // Execute
      const response = await GET(request, { params: { id: 'non-existent' } });
      const data = await response.json();

      // Assert
      expect(response.status).toBe(404);
      expect(data).toEqual({ error: 'No matches found for event' });
    });

    it('should handle service errors gracefully', async () => {
      // Setup mock to throw error
      mockCalculateEventStats.mockRejectedValue(new Error('Service error'));

      // Create request
      const request = new NextRequest(
        new Request('http://localhost/api/stats/event/event-1')
      );

      // Execute
      const response = await GET(request, { params: { id: 'event-1' } });
      const data = await response.json();

      // Assert
      expect(response.status).toBe(500);
      expect(data).toEqual({ error: 'Failed to calculate event statistics' });
    });
  });
});