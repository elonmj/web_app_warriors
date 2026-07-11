import { readFileSync } from 'fs';
import { join } from 'path';
import { WooglesService } from '../WooglesService';

const fixturesDir = join(process.cwd(), 'scripts', 'fixtures');
const historyFixture = JSON.parse(
  readFileSync(join(fixturesDir, 'GetGameHistory.FRA24.TfnqTZkYPL.json'), 'utf8')
);
const gcgFixture = JSON.parse(
  readFileSync(join(fixturesDir, 'GetGCG.FRA24.TfnqTZkYPL.json'), 'utf8')
);
const recentFixture = JSON.parse(
  readFileSync(join(fixturesDir, 'GetRecentGames.json'), 'utf8')
);

function mockFetchByMethod() {
  return jest.fn(async (url: RequestInfo | URL) => {
    const u = String(url);
    const body = u.endsWith('/GetGameHistory')
      ? historyFixture
      : u.endsWith('/GetGCG')
        ? gcgFixture
        : recentFixture;
    return {
      ok: true,
      json: async () => body,
      text: async () => JSON.stringify(body),
    } as Response;
  });
}

describe('WooglesService', () => {
  let service: WooglesService;

  beforeEach(() => {
    global.fetch = mockFetchByMethod() as unknown as typeof fetch;
    service = new WooglesService();
  });

  it('normalizes a real FRA24 game history into WooglesGameData', async () => {
    const game = await service.getGameData('TfnqTZkYPL');

    expect(game.gameId).toBe('TfnqTZkYPL');
    expect(game.lexicon).toBe('FRA24');
    expect(game.letterDistribution).toBe('french');
    expect(game.players).toEqual(['Hannibal9', 'HastyBot']);
    expect(game.scores).toEqual({ Hannibal9: 401, HastyBot: 503 });
    expect(game.winner).toBe('HastyBot');
    expect(game.gcg).toContain('#lexicon FRA24');

    // Bingos present in this game (blanks are lowercase in Woogles notation)
    const bingos = game.move_history.filter((m) => m.isBingo);
    expect(bingos.map((b) => b.word)).toContain('HALERAI');
    expect(bingos.length).toBe(6);

    // Full per-move events kept for analysis
    expect(game.events.length).toBe(25);
    expect(game.events[0].rack).toBeTruthy();
  });

  it('resolves scores case-insensitively', async () => {
    const game = await service.getGameData('TfnqTZkYPL');
    expect(service.scoreFor(game, 'hannibal9')).toBe(401);
    expect(service.scoreFor(game, 'HASTYBOT')).toBe(503);
    expect(Number.isNaN(service.scoreFor(game, 'unknown'))).toBe(true);
  });

  it('validates a submitted score against the Woogles result', async () => {
    // findMatchBetween uses GetRecentGames (fixture is HastyBot's games, not
    // containing Hannibal9) — so stub it to return our normalized game.
    const game = await service.getGameData('TfnqTZkYPL');
    jest.spyOn(service, 'findMatchBetween').mockResolvedValue(game);

    const ok = await service.validateSubmittedScore('Hannibal9', 'HastyBot', 401, 503);
    expect(ok.valid).toBe(true);

    const bad = await service.validateSubmittedScore('Hannibal9', 'HastyBot', 400, 503);
    expect(bad.valid).toBe(false);
    expect(bad.reason).toContain('401');
  });

  it('rejects malformed usernames', () => {
    expect(service.validateUsername('Hannibal9')).toBe(true);
    expect(service.validateUsername('bad name!')).toBe(false);
    expect(service.validateUsername('')).toBe(false);
  });
});
