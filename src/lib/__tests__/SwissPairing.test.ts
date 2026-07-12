import { generateSwissPairings, computeSeasonPoints } from '../SwissPairing';
import { Match } from '@/types/Match';
import { Player } from '@/types/Player';

function player(id: string, rating: number): Player {
  return {
    id,
    name: id,
    currentRating: rating,
    category: 'ONYX',
    matches: [],
    statistics: {} as Player['statistics']
  } as Player;
}

function playedMatch(
  p1: string,
  p2: string,
  round: number,
  score: [number, number] = [400, 300],
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
    id: `${p1}-${p2}-r${round}`,
    eventId: 'e',
    date: '2026-07-01',
    player1: info(p1),
    player2: info(p2),
    status,
    result: { score, pr: 0, ds: 0 },
    metadata: { round, isRandom: false, createdAt: '', updatedAt: '' }
  } as Match;
}

describe('computeSeasonPoints', () => {
  it('applies the 3/1/0 scale, byes and forfeits', () => {
    const points = computeSeasonPoints([
      playedMatch('a', 'b', 1, [450, 300]), // a gagne
      playedMatch('c', 'd', 1, [350, 350]), // nul
      playedMatch('e', 'BYE', 1, [0, 0]),   // bye
      playedMatch('f', 'g', 2, [400, 0], 'forfeit'), // forfait de g
      playedMatch('h', 'i', 2, [0, 0], 'forfeit')    // double forfait
    ]);
    expect(points.get('a')).toBe(3);
    expect(points.get('b')).toBe(0);
    expect(points.get('c')).toBe(1);
    expect(points.get('d')).toBe(1);
    expect(points.get('e')).toBe(3);
    expect(points.get('f')).toBe(3);
    expect(points.get('g')).toBeUndefined();
    expect(points.get('h')).toBeUndefined();
  });
});

describe('generateSwissPairings — Règlement V2 §IV', () => {
  it('pairs everyone exactly once, no bye on even pools', () => {
    const pool = [player('a', 1500), player('b', 1400), player('c', 1300), player('d', 1200)];
    const pairings = generateSwissPairings(pool, [], 1);
    expect(pairings).toHaveLength(2);
    const ids = pairings.flatMap((p) => [p.player1.id, p.player2?.id]);
    expect(new Set(ids).size).toBe(4);
    expect(pairings.every((p) => p.player2 !== undefined)).toBe(true);
  });

  it('avoids a rematch from the last 4 rounds', () => {
    const pool = [player('a', 1500), player('b', 1400), player('c', 1300), player('d', 1200)];
    // a vs b et c vs d viennent d'être joués en ronde 1
    const previous = [playedMatch('a', 'b', 1), playedMatch('c', 'd', 1)];
    const pairings = generateSwissPairings(pool, previous, 2);
    for (const p of pairings) {
      const pair = new Set([p.player1.id, p.player2?.id]);
      expect(pair.has('a') && pair.has('b')).toBe(false);
      expect(pair.has('c') && pair.has('d')).toBe(false);
    }
  });

  it('relaxes the rematch constraint when the pool makes it unsatisfiable', () => {
    // 2 joueurs qui se sont déjà rencontrés : la contrainte doit céder
    const pool = [player('a', 1500), player('b', 1400)];
    const previous = [playedMatch('a', 'b', 1)];
    const pairings = generateSwissPairings(pool, previous, 2);
    expect(pairings).toHaveLength(1);
    expect(pairings[0].player2).toBeDefined();
  });

  it('gives the bye to the lowest-ranked player without a recent bye', () => {
    const pool = [player('a', 1500), player('b', 1400), player('c', 1300)];
    const pairings = generateSwissPairings(pool, [], 1);
    const bye = pairings.find((p) => !p.player2);
    expect(bye?.player1.id).toBe('c');
  });

  it('does not give two byes in the bye window', () => {
    const pool = [player('a', 1500), player('b', 1400), player('c', 1300)];
    // c a déjà eu un bye en ronde 1 → en ronde 2 le bye va à b
    const previous = [playedMatch('c', 'BYE', 1), playedMatch('a', 'b', 1)];
    const pairings = generateSwissPairings(pool, previous, 2);
    const bye = pairings.find((p) => !p.player2);
    expect(bye?.player1.id).toBe('b');
  });

  it('pairs within points groups (leaders play each other)', () => {
    // a et b ont 3 PR, c et d en ont 0 → a-b et c-d attendus
    const pool = [player('a', 1200), player('b', 1600), player('c', 1700), player('d', 1100)];
    const previous = [
      playedMatch('a', 'c', 1, [450, 300]),
      playedMatch('b', 'd', 1, [450, 300])
    ];
    // fenêtre anti re-match : a-c et b-d interdits de toute façon
    const pairings = generateSwissPairings(pool, previous, 2);
    const asSets = pairings.map((p) => new Set([p.player1.id, p.player2?.id]));
    expect(asSets.some((s) => s.has('a') && s.has('b'))).toBe(true);
    expect(asSets.some((s) => s.has('c') && s.has('d'))).toBe(true);
  });

  it('handles a single-player pool with a bye', () => {
    const pairings = generateSwissPairings([player('a', 1200)], [], 1);
    expect(pairings).toHaveLength(1);
    expect(pairings[0].player2).toBeUndefined();
  });
});
