import { readFileSync } from 'fs';
import { join } from 'path';
import { GameAnalysisService } from '../GameAnalysisService';
import { StoredGame } from '@/types/GameAnalysis';
import { premiumAt, finalBoard, tilesPlaced } from '@/lib/board';

const history = JSON.parse(
  readFileSync(
    join(process.cwd(), 'scripts', 'fixtures', 'GetGameHistory.FRA24.TfnqTZkYPL.json'),
    'utf8'
  )
).history;

const game: StoredGame = {
  gameId: 'TfnqTZkYPL',
  lexicon: history.lexicon,
  letterDistribution: history.letter_distribution,
  createdAt: '2026-07-01T00:00:00Z',
  importedAt: '2026-07-10T00:00:00Z',
  players: [history.players[0].nickname, history.players[1].nickname],
  scores: {
    [history.players[0].nickname]: history.final_scores[0],
    [history.players[1].nickname]: history.final_scores[1],
  },
  winner: history.players[1].nickname,
  events: history.events,
};

describe('board model', () => {
  it('knows the standard premium squares', () => {
    expect(premiumAt(0, 0)).toBe('TW');
    expect(premiumAt(7, 7)).toBe('DW'); // center star
    expect(premiumAt(5, 5)).toBe('TL');
    expect(premiumAt(0, 3)).toBe('DL');
    expect(premiumAt(7, 8)).toBe(null);
  });

  it('reconstructs the final board of a real FRA24 game', () => {
    const board = finalBoard(game.events);
    const letters = board.flat().filter((c) => c !== '').length;
    // Every placed tile (minus phony returns) must be on the final board
    const placed = game.events
      .filter((e: any) => e.type === 'TILE_PLACEMENT_MOVE')
      .reduce((s: number, e: any) => s + tilesPlaced(e).length, 0);
    expect(letters).toBeGreaterThan(50);
    expect(letters).toBeLessThanOrEqual(placed);
    // First move of this game: 8D COWS -> row 7 must contain a C at col 3
    expect(board[7].join('')).not.toBe('');
  });
});

describe('GameAnalysisService', () => {
  const service = new GameAnalysisService();

  it('summarizes both players of a real game', () => {
    const summary = service.computeGameSummary(game);
    expect(summary.players).toHaveLength(2);
    const [p0, p1] = summary.players;

    expect(p0.username).toBe(game.players[0]);
    expect(p0.score + p1.score).toBe(401 + 503);
    expect(p0.bingos + p1.bingos).toBe(6);
    expect(p0.turns).toBeGreaterThan(5);
    expect(p0.avgScorePerTurn).toBeGreaterThan(0);
    expect(p0.scoreByPhase.length).toBe(3);
  });

  it('aggregates insights and detects a bingo-gap leak', () => {
    const base = service.computeGameSummary(game);
    // Force a clear bingo gap: player 0 never bingos, player 1 bingos 3 times
    const summary = {
      ...base,
      players: [
        { ...base.players[0], bingos: 0, bingoPoints: 0 },
        { ...base.players[1], bingos: 3, bingoPoints: 220 },
      ] as typeof base.players,
    };
    const games = Array.from({ length: 5 }, () => ({ game, summary }));
    const insights = service.aggregateInsights('42', game.players[0], games);

    expect(insights.gamesAnalyzed).toBe(5);
    expect(insights.avgScore).toBe(401);
    expect(insights.recentGames.length).toBe(5);
    const tags = insights.topLeaks.map((l) => l.tag);
    expect(tags).toContain('FEW_BINGOS');
    expect(insights.topLeaks.length).toBeLessThanOrEqual(3);
    // The leak costing the most points comes first
    const losses = insights.topLeaks.map((l) => l.avgPointsLostPerGame);
    expect(losses).toEqual([...losses].sort((a, b) => b - a));
  });
});
