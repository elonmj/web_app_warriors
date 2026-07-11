import { aggregateClubLeaks } from '../GameAnalysisService';
import { PlayerInsights } from '@/types/GameAnalysis';

function makeInsights(wooglesUsername: string, leaks: PlayerInsights['topLeaks']): PlayerInsights {
  return {
    playerId: wooglesUsername,
    wooglesUsername,
    updatedAt: new Date().toISOString(),
    gamesAnalyzed: 10,
    wins: 4,
    avgScore: 300,
    avgScorePerTurn: 25,
    bingosPerGame: 1,
    avgOpponentScore: 320,
    topLeaks: leaks,
    recentGames: [],
  };
}

describe('aggregateClubLeaks', () => {
  it('counts how many players share each leak tag, most common first', () => {
    const input = [
      {
        playerId: 'p1',
        insights: makeInsights('alice', [
          { tag: 'FEW_BINGOS', label: 'Missed Bingos', detail: '', avgPointsLostPerGame: 20, occurrences: 5 },
          { tag: 'WEAK_ENDGAME', label: 'Endgame', detail: '', avgPointsLostPerGame: 10, occurrences: 3 },
        ]),
      },
      {
        playerId: 'p2',
        insights: makeInsights('bob', [
          { tag: 'FEW_BINGOS', label: 'Missed Bingos', detail: '', avgPointsLostPerGame: 30, occurrences: 6 },
        ]),
      },
      {
        playerId: 'p3',
        insights: makeInsights('carol', [
          { tag: 'WEAK_ENDGAME', label: 'Endgame', detail: '', avgPointsLostPerGame: 15, occurrences: 4 },
        ]),
      },
    ];

    const result = aggregateClubLeaks(input);

    expect(result[0].tag).toBe('FEW_BINGOS');
    expect(result[0].playersAffected).toBe(2);
    expect(result[0].totalPlayers).toBe(3);
    expect(result[0].avgPointsLostAcrossPlayers).toBe(25); // (20+30)/2
    expect(result[0].players.map((p) => p.wooglesUsername)).toEqual(['bob', 'alice']); // sorted desc by points lost

    expect(result[1].tag).toBe('WEAK_ENDGAME');
    expect(result[1].playersAffected).toBe(2);
  });

  it('returns an empty array when nobody has leaks', () => {
    expect(aggregateClubLeaks([])).toEqual([]);
    expect(aggregateClubLeaks([{ playerId: 'p1', insights: makeInsights('alice', []) }])).toEqual([]);
  });
});
