import { RankingService } from '../RankingService';
import { Match } from '@/types/Match';
import { PlayerRanking } from '@/types/Ranking';

// Repos factices : on ne teste que la logique de classement (pas Firebase)
const service = new RankingService({} as any, {} as any) as any;

function match(
  p1: string,
  p2: string,
  score: [number, number],
  status: 'completed' | 'forfeit' = 'completed'
): Match {
  const info = (id: string) => ({
    id,
    ratingBefore: 1200,
    ratingAfter: 1200,
    categoryBefore: 'ONYX',
    categoryAfter: 'ONYX'
  });
  return {
    id: `${p1}-${p2}`,
    eventId: 'e',
    date: '2026-07-12',
    player1: info(p1),
    player2: info(p2),
    status,
    result: { score, pr: 0, ds: 0 },
    metadata: { round: 1, isRandom: false, createdAt: '', updatedAt: '' }
  } as Match;
}

describe('RankingService — Règlement V2 §III', () => {
  describe('calculatePlayerPerformance', () => {
    it('awards PR 3/1/0 to the right player (the old code gave a player-2 win 0 points)', () => {
      const perf = service.calculatePlayerPerformance([match('a', 'b', [300, 450])]);
      expect(perf.get('b').points).toBe(3);
      expect(perf.get('a').points).toBe(0);
    });

    it('awards 1 point each for a draw', () => {
      const perf = service.calculatePlayerPerformance([match('a', 'b', [400, 400])]);
      expect(perf.get('a').points).toBe(1);
      expect(perf.get('b').points).toBe(1);
    });

    it('accumulates capped spread from both perspectives', () => {
      const perf = service.calculatePlayerPerformance([
        match('a', 'b', [500, 300]), // spread brut 200 → plafonné à 100
        match('a', 'c', [350, 380])
      ]);
      expect(perf.get('a').spread).toBe(100 - 30);
      expect(perf.get('b').spread).toBe(-100);
      expect(perf.get('c').spread).toBe(30);
    });

    it('gives a bye 3 PR, no spread, no opponent', () => {
      const perf = service.calculatePlayerPerformance([match('a', 'BYE', [0, 0])]);
      expect(perf.get('a').points).toBe(3);
      expect(perf.get('a').spread).toBe(0);
      expect(perf.get('a').opponents).toEqual([]);
      expect(perf.has('BYE')).toBe(false);
    });

    it('scores a single forfeit 3/+50 and 0/−50', () => {
      const perf = service.calculatePlayerPerformance([match('a', 'b', [400, 0], 'forfeit')]);
      expect(perf.get('a').points).toBe(3);
      expect(perf.get('a').spread).toBe(50);
      expect(perf.get('b').points).toBe(0);
      expect(perf.get('b').spread).toBe(-50);
    });

    it('scores a double forfeit 0 PR each, no spread', () => {
      const perf = service.calculatePlayerPerformance([match('a', 'b', [0, 0], 'forfeit')]);
      expect(perf.get('a').points).toBe(0);
      expect(perf.get('b').points).toBe(0);
      expect(perf.get('a').spread).toBe(0);
    });
  });

  describe('sortAndAssignRanks (points) — départages V2', () => {
    const ranking = (playerId: string, extra: Partial<PlayerRanking>): PlayerRanking => ({
      playerId,
      rank: 0,
      points: 0,
      matches: 0,
      wins: 0,
      draws: 0,
      losses: 0,
      rating: 1200,
      ratingChange: 0,
      category: 'ONYX' as any,
      buchholz: 0,
      spread: 0,
      ...extra
    });

    it('breaks PR ties with Buchholz, then spread', () => {
      const rankings = [
        ranking('lowBuchholz', { points: 6, buchholz: 4, spread: 90 }),
        ranking('highBuchholz', { points: 6, buchholz: 9, spread: 10 }),
        ranking('highSpread', { points: 6, buchholz: 4, spread: 120 })
      ];
      service.sortAndAssignRanks(rankings, 'points');
      expect(rankings.map((r: PlayerRanking) => r.playerId)).toEqual([
        'highBuchholz',
        'highSpread',
        'lowBuchholz'
      ]);
      expect(rankings.map((r: PlayerRanking) => r.rank)).toEqual([1, 2, 3]);
    });

    it('uses direct confrontation for an isolated two-way tie', () => {
      const rankings = [
        ranking('a', { points: 6, buchholz: 5, spread: 40 }),
        ranking('b', { points: 6, buchholz: 5, spread: 40 })
      ];
      const h2h = new Map<string, number>([
        ['b|a', 1],
        ['a|b', -1]
      ]);
      service.sortAndAssignRanks(rankings, 'points', h2h);
      expect(rankings[0].playerId).toBe('b');
    });

    it('assigns equal ranks on full ties', () => {
      const rankings = [
        ranking('a', { points: 6, buchholz: 5, spread: 40 }),
        ranking('b', { points: 6, buchholz: 5, spread: 40 }),
        ranking('c', { points: 3 })
      ];
      service.sortAndAssignRanks(rankings, 'points');
      expect(rankings[0].rank).toBe(1);
      expect(rankings[1].rank).toBe(1);
      expect(rankings[2].rank).toBe(3);
    });
  });
});
