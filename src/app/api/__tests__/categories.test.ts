import { NextRequest } from 'next/server';
import { POST } from '../categories/recalculate/route';
import { CategoryService } from '@/api/services/CategoryService';
import { StatisticsService } from '@/api/services/StatisticsService';
import { Player } from '@/lib/Player';

// Create mock implementation class
class MockCategoryService {
  shouldChangeCategory = jest.fn();
  validateCategoryTransition = jest.fn();
  getCategoryDistribution = jest.fn();
}

// Create mock instance
const mockCategoryService = new MockCategoryService();

// Mock repository layer
jest.mock('@/api/repository/playerRepository', () => ({
  getAllPlayers: jest.fn(),
  updatePlayerCategory: jest.fn().mockResolvedValue(undefined)
}));

// Mock CategoryService
jest.mock('@/api/services/CategoryService', () => ({
  CategoryService: jest.fn().mockImplementation(() => mockCategoryService)
}));

// Mock StatisticsService
jest.mock('@/api/services/StatisticsService', () => ({
  StatisticsService: jest.fn().mockImplementation(() => ({}))
}));

// Get repository mock functions
const { getAllPlayers, updatePlayerCategory } = jest.requireMock('@/api/repository/playerRepository');

describe('Categories API Endpoints', () => {
  // Test data
  const mockPlayers: Player[] = [
    {
      id: 'player1',
      name: 'Player 1',
      currentRating: 1450,
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
    },
    {
      id: 'player2',
      name: 'Player 2',
      currentRating: 1750,
      category: 'AMÉTHYSTE',
      matches: [],
      statistics: {
        totalMatches: 15,
        wins: 10,
        draws: 2,
        losses: 3,
        totalPR: 32,
        averageDS: 18.2,
        inactivityWeeks: 0
      }
    }
  ];

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    
    // Setup default repository mock
    getAllPlayers.mockResolvedValue(mockPlayers);

    // Reset service mocks to default successful responses
    mockCategoryService.shouldChangeCategory.mockReset();
    mockCategoryService.validateCategoryTransition.mockReset();
    mockCategoryService.getCategoryDistribution.mockReset();

    // Default mock responses
    mockCategoryService.validateCategoryTransition.mockResolvedValue({ isValid: false });
    mockCategoryService.getCategoryDistribution.mockResolvedValue({});
  });

  describe('POST /api/categories/recalculate', () => {
    it('should recalculate categories successfully', async () => {
      // Setup mocks with successful responses
      mockCategoryService.shouldChangeCategory
        .mockResolvedValueOnce({
          shouldChange: true,
          newCategory: 'AMÉTHYSTE',
          isPromotion: true
        })
        .mockResolvedValueOnce({
          shouldChange: true,
          newCategory: 'TOPAZE',
          isPromotion: true
        });

      mockCategoryService.validateCategoryTransition
        .mockResolvedValueOnce({ isValid: true })
        .mockResolvedValueOnce({ isValid: true });

      const distribution = {
        'ONYX': 10,
        'AMÉTHYSTE': 8,
        'TOPAZE': 5,
        'DIAMANT': 2
      };

      mockCategoryService.getCategoryDistribution.mockResolvedValue(distribution);

      // Create request
      const request = new NextRequest(
        new Request('http://localhost/api/categories/recalculate', {
          method: 'POST'
        })
      );

      // Execute
      const response = await POST(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data).toEqual({
        updates: [
          {
            playerId: 'player1',
            oldCategory: 'ONYX',
            newCategory: 'AMÉTHYSTE',
            rating: 1450
          },
          {
            playerId: 'player2',
            oldCategory: 'AMÉTHYSTE',
            newCategory: 'TOPAZE',
            rating: 1750
          }
        ],
        categoryDistribution: distribution,
        totalUpdates: 2
      });

      // Verify mock calls
      expect(mockCategoryService.shouldChangeCategory).toHaveBeenCalledTimes(2);
      expect(mockCategoryService.validateCategoryTransition).toHaveBeenCalledTimes(2);
      expect(mockCategoryService.getCategoryDistribution).toHaveBeenCalledTimes(1);
      expect(updatePlayerCategory).toHaveBeenCalledTimes(2);
    });

    it('should return 404 when no players found', async () => {
      // Setup mock to return empty array
      getAllPlayers.mockResolvedValue([]);

      // Create request
      const request = new NextRequest(
        new Request('http://localhost/api/categories/recalculate', {
          method: 'POST'
        })
      );

      // Execute
      const response = await POST(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(404);
      expect(data).toEqual({ error: 'No players found' });
    });

    it('should handle service errors gracefully', async () => {
      // Setup mock to throw error
      mockCategoryService.shouldChangeCategory.mockRejectedValue(new Error('Service error'));

      // Create request
      const request = new NextRequest(
        new Request('http://localhost/api/categories/recalculate', {
          method: 'POST'
        })
      );

      // Execute
      const response = await POST(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(500);
      expect(data).toEqual({ error: 'Failed to recalculate categories' });
    });
  });
});