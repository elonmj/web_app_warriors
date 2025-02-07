import {
  MatchManager,
  StatisticsCalculator,
  Player,
  Match,
  PlayerMatch
} from '../';

describe('Scrabble Rating System', () => {
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
        inactivityWeeks: 0
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
        inactivityWeeks: 0
      }
    };
  });

  describe('Match Creation', () => {
    it('should create a valid match', () => {
      const match = matchManager.createMatch(player1, player2);
      
      expect(match).toMatchObject({
        player1: player1.id,
        player2: player2.id,
        player1Rating: player1.currentRating,
        player2Rating: player2.currentRating,
        player1Category: player1.category,
        player2Category: player2.category,
        status: 'pending',
        isRandom: false
      });
    });

    it('should create match between players of different categories', () => {
      player1.category = 'ONYX';
      player2.category = 'AMÉTHYSTE';
      const match = matchManager.createMatch(player1, player2);
      
      expect(match).toMatchObject({
        player1Category: 'ONYX',
        player2Category: 'AMÉTHYSTE'
      });
    });

    // Removed category validation test as it's now handled at Player level
  });

  describe('Match Processing', () => {
    it('should process a normal match result', () => {
      const match = matchManager.createMatch(player1, player2);
      const result = matchManager.processMatch(match, {
        player1Score: 450,
        player2Score: 380
      });

      expect(result.updatedMatch.status).toBe('completed');
      expect(result.updatedMatch.result).toBeDefined();
      expect(result.player1Update.currentRating).toBeGreaterThan(player1.currentRating);
      expect(result.player2Update.currentRating).toBeLessThan(player2.currentRating);
    });

    it('should handle a forfeit match', () => {
      const match = matchManager.createMatch(player1, player2);
      const result = matchManager.processForfeitMatch(match, player1.id, 'No show');

      expect(result.updatedMatch.status).toBe('forfeit');
      expect(result.updatedMatch.result?.ds).toBe(100);
      expect(result.player1Update.currentRating).toBeGreaterThan(player1.currentRating);
    });

    it('should process a draw match', () => {
      const match = matchManager.createMatch(player1, player2);
      const result = matchManager.processMatch(match, {
        player1Score: 400,
        player2Score: 400
      });

      expect(result.updatedMatch.result?.ds).toBe(0);
      expect(Math.abs(result.player1Update.currentRating! - player1.currentRating)).toBeLessThan(5);
      expect(Math.abs(result.player2Update.currentRating! - player2.currentRating)).toBeLessThan(5);
    });

    it('should reject invalid match scores', () => {
      const match = matchManager.createMatch(player1, player2);
      expect(() => {
        matchManager.processMatch(match, {
          player1Score: -100,
          player2Score: 400
        });
      }).toThrow('Scores cannot be negative');
    });

    it('should handle extreme score differences', () => {
      const match = matchManager.createMatch(player1, player2);
      const result = matchManager.processMatch(match, {
        player1Score: 600,
        player2Score: 200
      });

      expect(result.updatedMatch.result?.ds).toBeGreaterThan(50);
      expect(Math.abs(result.player1Update.currentRating! - player1.currentRating))
        .toBeGreaterThan(15);
    });
  });

  describe('Rating Changes', () => {
    it('should apply larger rating changes for beginners', () => {
      const match = matchManager.createMatch(player1, player2);
      const result = matchManager.processMatch(match, {
        player1Score: 500,
        player2Score: 300
      });

      const ratingChange = result.player1Update.currentRating! - player1.currentRating;
      expect(Math.abs(ratingChange)).toBeGreaterThanOrEqual(15);
    });

    it('should consider DS in rating calculations', () => {
      const match = matchManager.createMatch(player1, player2);
      
      const resultLargeDiff = matchManager.processMatch(match, {
        player1Score: 500,
        player2Score: 200
      });

      const resultSmallDiff = matchManager.processMatch(match, {
        player1Score: 400,
        player2Score: 380
      });

      const ratingChangeLargeDiff = resultLargeDiff.player1Update.currentRating! - player1.currentRating;
      const ratingChangeSmallDiff = resultSmallDiff.player1Update.currentRating! - player1.currentRating;

      expect(ratingChangeLargeDiff).toBeGreaterThan(ratingChangeSmallDiff);
    });

    it('should apply rating protection for new players', () => {
      player2.currentRating = 1800;
      player2.statistics.totalMatches = 100;
      
      const match = matchManager.createMatch(player1, player2);
      const result = matchManager.processMatch(match, {
        player1Score: 300,
        player2Score: 500
      });

      expect(result.player1Update.currentRating).toBeGreaterThan(player1.currentRating - 30);
    });

    it('should handle large rating differences', () => {
      player1.currentRating = 1800;
      player2.currentRating = 1200;
      
      const match = matchManager.createMatch(player1, player2);
      const result = matchManager.processMatch(match, {
        player1Score: 450,
        player2Score: 400
      });

      expect(result.player1Update.currentRating! - player1.currentRating).toBeLessThan(10);
      expect(player2.currentRating - result.player2Update.currentRating!).toBeLessThan(10);
    });
  });

  describe('Category Changes', () => {
    it('should promote player when rating exceeds category threshold', () => {
      player1.currentRating = 1390;
      player1.category = 'ONYX';
      
      const match = matchManager.createMatch(player1, player2);
      const result = matchManager.processMatch(match, {
        player1Score: 500,
        player2Score: 300
      });

      expect(result.player1Update.category).toBe('AMÉTHYSTE');
    });

    it('should demote player when rating falls below category threshold', () => {
      player1.currentRating = 1410;
      player1.category = 'AMÉTHYSTE';
      
      const match = matchManager.createMatch(player1, player2);
      const result = matchManager.processMatch(match, {
        player1Score: 300,
        player2Score: 500
      });

      expect(result.player1Update.category).toBe('ONYX');
    });

    it('should handle rating increases near category threshold', () => {
      player1.currentRating = 1380;
      player1.category = 'ONYX';
      
      const match = matchManager.createMatch(player1, player2);
      const result = matchManager.processMatch(match, {
        player1Score: 600,
        player2Score: 200
      });

      expect(result.player1Update.category).toBe('ONYX');
      expect(result.player1Update.currentRating).toBeGreaterThan(player1.currentRating + 10);
    });

    it('should maintain category until clear threshold breach', () => {
      player1.category = 'AMÉTHYSTE';
      player1.currentRating = 1405;
      player1.statistics.totalMatches = 50;
      
      const match = matchManager.createMatch(player1, player2);
      const result = matchManager.processMatch(match, {
        player1Score: 350,
        player2Score: 400
      });

      expect(result.player1Update.category).toBe('ONYX');
    });
  });

  describe('Statistics Calculation', () => {
    it('should calculate correct statistics after match', () => {
      const matchResult: PlayerMatch = {
        date: '2024-02-06',
        opponent: player2.id,
        opponentRating: player2.currentRating,
        result: {
          score: [450, 380],
          pr: 3,
          pdi: 3,
          ds: 18.4
        },
        ratingChange: 15,
        categoryAtTime: 'ONYX'
      };

      const stats = StatisticsCalculator.updatePlayerStatistics(
        player1.statistics,
        matchResult
      );

      expect(stats).toMatchObject({
        totalMatches: 1,
        wins: 1,
        draws: 0,
        losses: 0,
        totalPR: 3,
        averageDS: 18.4,
        inactivityWeeks: 0
      });
    });

    it('should track inactivity correctly', () => {
      const oldMatch: PlayerMatch = {
        date: '2024-01-01',
        opponent: player2.id,
        opponentRating: player2.currentRating,
        result: {
          score: [450, 380],
          pr: 3,
          pdi: 3,
          ds: 18.4
        },
        ratingChange: 15,
        categoryAtTime: 'ONYX'
      };

      const stats = StatisticsCalculator.calculatePlayerStatistics({
        ...player1,
        matches: [oldMatch]
      });

      expect(stats.inactivityWeeks).toBeGreaterThan(2);
    });

    it('should calculate correct draw statistics', () => {
      const drawMatch: PlayerMatch = {
        date: '2024-02-06',
        opponent: player2.id,
        opponentRating: player2.currentRating,
        result: {
          score: [400, 400],
          pr: 2,
          pdi: 2,
          ds: 0
        },
        ratingChange: 0,
        categoryAtTime: 'ONYX'
      };

      const stats = StatisticsCalculator.updatePlayerStatistics(
        player1.statistics,
        drawMatch
      );

      expect(stats.draws).toBe(1);
      expect(stats.totalMatches).toBe(1);
      expect(stats.wins).toBe(0);
      expect(stats.losses).toBe(0);
    });

    it('should calculate performance rating (PR) correctly', () => {
      const match1: PlayerMatch = {
        date: '2024-02-06',
        opponent: player2.id,
        opponentRating: 1200,
        result: {
          score: [500, 300],
          pr: 4,
          pdi: 3,
          ds: 40
        },
        ratingChange: 20,
        categoryAtTime: 'ONYX'
      };

      const match2: PlayerMatch = {
        date: '2024-02-06',
        opponent: 'player3',
        opponentRating: 1300,
        result: {
          score: [450, 350],
          pr: 2,
          pdi: 2,
          ds: 25
        },
        ratingChange: 15,
        categoryAtTime: 'ONYX'
      };

      let stats = StatisticsCalculator.updatePlayerStatistics(
        player1.statistics,
        match1
      );
      stats = StatisticsCalculator.updatePlayerStatistics(stats, match2);

      expect(stats.totalPR).toBe(6);
      expect(stats.averageDS).toBe(32.5);
    });
  });
});