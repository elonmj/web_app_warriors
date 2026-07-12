import { RatingSystem } from '../RatingSystem';
import { Player } from '@/types/Player';

const system = new RatingSystem();

const noHistory = { matchesPlayed: 20, isReturning: false };

function playerWithMatchDates(dates: string[], totalMatches = dates.length): Player {
  return {
    id: 'p1',
    name: 'Test',
    currentRating: 1500,
    category: 'AMÉTHYSTE',
    matches: dates.map((date) => ({ date })) as Player['matches'],
    statistics: { ...system.initializeStatistics(), totalMatches }
  } as Player;
}

describe('RatingSystem V2', () => {
  describe('calculateExpectedScore', () => {
    it('gives ~24% win probability to a 1000 player against 1200', () => {
      expect(system.calculateExpectedScore(1000, 1200)).toBeCloseTo(0.24, 2);
    });

    it('gives 50% between equal ratings', () => {
      expect(system.calculateExpectedScore(1500, 1500)).toBe(0.5);
    });
  });

  describe('determineKFactor (Règlement V2 §V.B)', () => {
    it('uses K=40 during the provisional period (<15 matches)', () => {
      expect(system.determineKFactor({ matchesPlayed: 0, isReturning: false }, 1000)).toBe(40);
      expect(system.determineKFactor({ matchesPlayed: 14, isReturning: false }, 1000)).toBe(40);
    });

    it('uses K=20 in the standard regime', () => {
      expect(system.determineKFactor({ matchesPlayed: 15, isReturning: false }, 1500)).toBe(20);
    });

    it('uses K=10 for elite ratings (>=1900)', () => {
      expect(system.determineKFactor({ matchesPlayed: 100, isReturning: false }, 1900)).toBe(10);
    });

    it('uses K=30 for a returning player, even elite', () => {
      expect(system.determineKFactor({ matchesPlayed: 50, isReturning: true }, 1950)).toBe(30);
    });

    it('provisional takes precedence over returning', () => {
      expect(system.determineKFactor({ matchesPlayed: 5, isReturning: true }, 1000)).toBe(40);
    });
  });

  describe('buildContext', () => {
    const week = 7 * 24 * 60 * 60 * 1000;
    const now = new Date('2026-07-12T12:00:00Z');
    const weeksAgo = (n: number) => new Date(now.getTime() - n * week).toISOString();

    it('is not returning without any inactivity gap', () => {
      const player = playerWithMatchDates([weeksAgo(1), weeksAgo(2), weeksAgo(3)], 20);
      const ctx = system.buildContext(player, now.toISOString());
      expect(ctx).toEqual({ matchesPlayed: 20, isReturning: false });
    });

    it('is returning when the last match was 6+ weeks ago', () => {
      const player = playerWithMatchDates([weeksAgo(7), weeksAgo(8)], 20);
      expect(system.buildContext(player, now.toISOString()).isReturning).toBe(true);
    });

    it('stays returning while fewer than 5 matches were played since the gap', () => {
      const player = playerWithMatchDates(
        [weeksAgo(1), weeksAgo(2), weeksAgo(10), weeksAgo(11)],
        20
      );
      expect(system.buildContext(player, now.toISOString()).isReturning).toBe(true);
    });

    it('stops returning after 5 matches since the gap', () => {
      const player = playerWithMatchDates(
        [weeksAgo(0.5), weeksAgo(1), weeksAgo(2), weeksAgo(3), weeksAgo(4), weeksAgo(15)],
        20
      );
      expect(system.buildContext(player, now.toISOString()).isReturning).toBe(false);
    });

    it('is not returning for a player with no history (provisional covers it)', () => {
      const player = playerWithMatchDates([], 0);
      expect(system.buildContext(player, now.toISOString())).toEqual({
        matchesPlayed: 0,
        isReturning: false
      });
    });
  });

  describe('calculateNewRating', () => {
    it('is zero-sum between equal players at the same K — no DS bonus', () => {
      const winner = system.calculateNewRating(1500, 1500, 1, noHistory);
      const loser = system.calculateNewRating(1500, 1500, 0, noHistory);
      expect(winner - 1500).toBe(10); // K=20 × (1 − 0.5)
      expect(1500 - loser).toBe(10);
    });

    it('gives no points for a draw between equal players', () => {
      expect(system.calculateNewRating(1500, 1500, 0.5, noHistory)).toBe(1500);
    });

    it('enforces the 800 floor (not the old 1000)', () => {
      // K=40 loss between equals costs 20 points; 810 → 790 is clamped to 800
      const rating = system.calculateNewRating(810, 810, 0, { matchesPlayed: 0, isReturning: false });
      expect(rating).toBe(800);
    });

    it('lets a 1000-rated newcomer lose points below 1000', () => {
      const rating = system.calculateNewRating(1000, 1000, 0, { matchesPlayed: 0, isReturning: false });
      expect(rating).toBe(980); // K=40 × (0 − 0.5)
    });
  });

  describe('processMatchRatings', () => {
    const baseMatch = (score: [number, number], rating1 = 1500, rating2 = 1500) =>
      ({
        result: { score, pr: 3, pdi: 0, ds: 0 },
        player1: { id: 'a', ratingBefore: rating1, categoryBefore: 'AMÉTHYSTE' },
        player2: { id: 'b', ratingBefore: rating2, categoryBefore: 'AMÉTHYSTE' }
      }) as any;

    it('derives win/loss from the score and stays symmetric', () => {
      const [r1, r2] = system.processMatchRatings(baseMatch([450, 380]), noHistory, noHistory);
      expect(r1).toBe(1510);
      expect(r2).toBe(1490);
    });

    it('handles draws', () => {
      const [r1, r2] = system.processMatchRatings(baseMatch([400, 400]), noHistory, noHistory);
      expect(r1).toBe(1500);
      expect(r2).toBe(1500);
    });

    it('the margin of victory does not change the rating (spread is a tiebreaker, not Elo input)', () => {
      const [narrow] = system.processMatchRatings(baseMatch([401, 400]), noHistory, noHistory);
      const [blowout] = system.processMatchRatings(
        { ...baseMatch([600, 200]), result: { score: [600, 200], pr: 3, pdi: 0, ds: 100 } },
        noHistory,
        noHistory
      );
      expect(narrow).toBe(blowout);
    });

    it('applies each player own K (provisional vs standard)', () => {
      const [r1, r2] = system.processMatchRatings(
        baseMatch([450, 380], 1000, 1000),
        { matchesPlayed: 0, isReturning: false }, // K=40
        noHistory // K=20
      );
      expect(r1 - 1000).toBe(20);
      expect(1000 - r2).toBe(10);
    });
  });
});
