import { MatchManager, Player } from '../';

// Only testing core business logic - no MSW/HTTP required
describe('Scrabble Rating System Core Tests', () => {
  let matchManager: MatchManager;
  let player1: Player;
  let player2: Player;

  beforeEach(() => {
    matchManager = new MatchManager();

    // Create test players
    player1 = {
      id: 'player1',
      name: 'Test Player 1',
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
        inactivityWeeks: 0,
        forfeits: { given: 0, received: 0 },
        bestRating: 1200,
        worstRating: 1200,
        categoryHistory: [],
        eventParticipation: []
      }
    };

    player2 = {
      id: 'player2',
      name: 'Test Player 2',
      currentRating: 1100,
      category: 'ONYX',
      matches: [],
      statistics: {
        totalMatches: 0,
        wins: 0,
        draws: 0,
        losses: 0,
        totalPR: 0,
        averageDS: 0,
        inactivityWeeks: 0,
        forfeits: { given: 0, received: 0 },
        bestRating: 1100,
        worstRating: 1100,
        categoryHistory: [],
        eventParticipation: []
      }
    };
  });

  describe('1. Match Creation', () => {
    test('creates a match with correct initial state', () => {
      const match = matchManager.createMatch(player1, player2);
      
      // Test player 1 data
      expect(match.player1.id).toBe('player1');
      expect(match.player1.categoryBefore).toBe('ONYX');
      expect(match.player1.ratingBefore).toBe(1200);

      // Test player 2 data
      expect(match.player2.id).toBe('player2');
      expect(match.player2.categoryBefore).toBe('ONYX');
      expect(match.player2.ratingBefore).toBe(1100);

      // Test match state
      expect(match.status).toBe('pending');
    });
  });

  describe('2. Match Processing', () => {
    test('processes a normal match result correctly', () => {
      const match = matchManager.createMatch(player1, player2);
      const result = matchManager.processMatch(match, {
        player1Score: 450,
        player2Score: 380
      });

      // Check match completion
      expect(result.updatedMatch.status).toBe('completed');
      
      // Verify scores
      expect(result.updatedMatch.result?.score).toEqual([450, 380]);
      
      // Check rating changes
      expect(result.player1Update.currentRating).toBeGreaterThan(1200);
      expect(result.player2Update.currentRating).toBeLessThan(1100);
    });

    test('rejects invalid match scores', () => {
      const match = matchManager.createMatch(player1, player2);
      
      expect(() => {
        matchManager.processMatch(match, {
          player1Score: -100,
          player2Score: 400
        });
      }).toThrow();
    });
  });

  describe('3. Rating Changes', () => {
    test('applies larger rating changes for bigger score differences', () => {
      // Close match
      const closeMatch = matchManager.createMatch(player1, player2);
      const closeResult = matchManager.processMatch(closeMatch, {
        player1Score: 400,
        player2Score: 390
      });

      const smallChange = closeResult.player1Update.currentRating! - 1200;

      // One-sided match
      const bigMatch = matchManager.createMatch(player1, player2);
      const bigResult = matchManager.processMatch(bigMatch, {
        player1Score: 500,
        player2Score: 250
      });

      const largeChange = bigResult.player1Update.currentRating! - 1200;

      expect(Math.abs(largeChange)).toBeGreaterThan(Math.abs(smallChange));
    });

    test('considers rating difference between players', () => {
      player1.currentRating = 1500; // Much higher rated player
      player2.currentRating = 1100;

      const match = matchManager.createMatch(player1, player2);
      const result = matchManager.processMatch(match, {
        player1Score: 450,
        player2Score: 400
      });

      // Higher rated player should gain less for winning
      const ratingChange = result.player1Update.currentRating! - 1500;
      expect(Math.abs(ratingChange)).toBeLessThan(15);
    });
  });

  describe('4. Category Changes', () => {
    test('promotes player when crossing rating threshold', () => {
      player1.currentRating = 1390; // Just below AMÉTHYSTE threshold
      
      const match = matchManager.createMatch(player1, player2);
      const result = matchManager.processMatch(match, {
        player1Score: 500,
        player2Score: 300
      });

      expect(result.player1Update.currentRating).toBeGreaterThan(1400);
      expect(result.player1Update.category).toBe('AMÉTHYSTE');
    });

    test('demotes player when falling below threshold', () => {
      player1.currentRating = 1410; // Just above ONYX threshold
      player1.category = 'AMÉTHYSTE';
      
      const match = matchManager.createMatch(player1, player2);
      const result = matchManager.processMatch(match, {
        player1Score: 300,
        player2Score: 500
      });

      expect(result.player1Update.currentRating).toBeLessThan(1400);
      expect(result.player1Update.category).toBe('ONYX');
    });
  });
});