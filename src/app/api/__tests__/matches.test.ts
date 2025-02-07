// Mock MatchService module and its instance methods
const mockGetMatch = jest.fn();
const mockProcessMatchResult = jest.fn();
const mockCreateMatch = jest.fn();
const mockGetPlayerMatches = jest.fn();

// Mock the MatchService constructor and its instance methods
jest.mock('@/api/services/MatchService', () => {
  return {
    MatchService: jest.fn().mockImplementation(() => {
      return {
        getMatch: mockGetMatch,
        processMatchResult: mockProcessMatchResult,
        createMatch: mockCreateMatch,
        getPlayerMatches: mockGetPlayerMatches
      };
    })
  };
});

// Imports must come after jest.mock
import { NextRequest } from 'next/server';
import { GET, POST } from '../matches/result/route';
import { Match, MatchResult } from '@/lib/Match';
import { Player } from '@/lib/Player';

// Test data
const mockMatch: Match = {
  id: 'test-match-1',
  date: '2024-02-06',
  player1: 'player1',
  player2: 'player2',
  player1Rating: 1200,
  player2Rating: 1300,
  player1Category: 'ONYX',
  player2Category: 'ONYX',
  status: 'pending',
  isRandom: false
};

const mockMatchResult: MatchResult = {
  score: [450, 380],
  pr: 3,
  pdi: 3,
  ds: 18.42
};

const mockPlayer1: Player = {
  id: 'player1',
  name: 'Player 1',
  currentRating: 1200,
  category: 'ONYX',
  matches: [],
  statistics: {
    totalMatches: 0,
    wins: 0,
    draws: 0,
    losses: 0,
    totalPR: 0,
    averageDS: 0,
    inactivityWeeks: 0
  }
};

const mockPlayer2: Player = {
  id: 'player2',
  name: 'Player 2',
  currentRating: 1300,
  category: 'ONYX',
  matches: [],
  statistics: {
    totalMatches: 0,
    wins: 0,
    draws: 0,
    losses: 0,
    totalPR: 0,
    averageDS: 0,
    inactivityWeeks: 0
  }
};

describe('Match API Endpoints', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  describe('GET /api/matches/result/[id]', () => {
    it('should return match when found', async () => {
      // Setup
      mockGetMatch.mockResolvedValue(mockMatch);

      // Create request
      const request = new NextRequest(
        new Request('http://localhost/api/matches/result/test-match-1')
      );

      // Execute
      const response = await GET(request, { params: { id: 'test-match-1' } });
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data).toEqual(mockMatch);
      expect(mockGetMatch).toHaveBeenCalledWith('test-match-1', expect.any(Array));
    });

    it('should return 404 when match not found', async () => {
      // Setup
      mockGetMatch.mockResolvedValue(null);

      // Create request
      const request = new NextRequest(
        new Request('http://localhost/api/matches/result/non-existent')
      );

      // Execute
      const response = await GET(request, { params: { id: 'non-existent' } });
      const data = await response.json();

      // Assert
      expect(response.status).toBe(404);
      expect(data).toEqual({ error: 'Match not found' });
    });
  });

  describe('POST /api/matches/result', () => {
    it('should process match result successfully', async () => {
      // Setup
      const mockProcessResult = {
        updatedMatch: { ...mockMatch, status: 'completed', result: mockMatchResult },
        updatedPlayer1: { ...mockPlayer1, currentRating: 1215 },
        updatedPlayer2: { ...mockPlayer2, currentRating: 1285 }
      };

      mockGetMatch.mockResolvedValue(mockMatch);
      mockProcessMatchResult.mockResolvedValue(mockProcessResult);

      // Create request
      const request = new NextRequest(
        new Request('http://localhost/api/matches/result', {
          method: 'POST',
          body: JSON.stringify({
            matchId: 'test-match-1',
            score: {
              player1Score: 450,
              player2Score: 380
            }
          })
        })
      );

      // Execute
      const response = await POST(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data).toEqual({
        match: mockProcessResult.updatedMatch,
        updates: {
          player1: {
            id: 'player1',
            newRating: 1215,
            newCategory: 'ONYX',
            ratingChange: 15
          },
          player2: {
            id: 'player2',
            newRating: 1285,
            newCategory: 'ONYX',
            ratingChange: -15
          }
        }
      });
    });

    it('should return 404 when match not found', async () => {
      // Setup
      mockGetMatch.mockResolvedValue(null);

      // Create request
      const request = new NextRequest(
        new Request('http://localhost/api/matches/result', {
          method: 'POST',
          body: JSON.stringify({
            matchId: 'non-existent',
            score: {
              player1Score: 450,
              player2Score: 380
            }
          })
        })
      );

      // Execute
      const response = await POST(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(404);
      expect(data).toEqual({ error: 'Match not found' });
    });

    it('should handle invalid input data', async () => {
      // Create request with invalid JSON
      const request = new NextRequest(
        new Request('http://localhost/api/matches/result', {
          method: 'POST',
          body: JSON.stringify({
            // Missing required fields
            someInvalidField: 'test'
          })
        })
      );

      // Execute
      const response = await POST(request);
      const data = await response.json();

      // Assert - The route handles invalid input with a 500 error
      expect(response.status).toBe(500);
      expect(data).toEqual({ error: 'Failed to process match result' });
    });
  });
});