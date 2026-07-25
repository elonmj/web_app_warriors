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

/** Ronde du 25/07 20 h au 28/07 20 h (heure du Bénin). */
const WINDOW = {
  startsAt: new Date('2026-07-25T19:00:00.000Z'),
  endsAt: new Date('2026-07-28T19:00:00.000Z'),
};

/** Entrée GetRecentGames minimale entre les deux joueurs du fixture. */
function fakeGame(gameId: string, createdAt?: string, endReason = 'STANDARD') {
  return {
    game_id: gameId,
    players: [{ nickname: 'Hannibal9' }, { nickname: 'HastyBot' }],
    scores: [401, 503],
    winner: 1,
    created_at: createdAt,
    game_end_reason: endReason,
    game_request: {},
    type: 'NATIVE',
  };
}

/** Mock où GetRecentGames renvoie la liste fournie (ordre Woogles : récent → ancien). */
function mockFetchWithRecent(recent: ReturnType<typeof fakeGame>[]) {
  return jest.fn(async (url: RequestInfo | URL) => {
    const u = String(url);
    const body = u.endsWith('/GetGameHistory')
      ? historyFixture
      : u.endsWith('/GetGCG')
        ? gcgFixture
        : { game_info: recent };
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
    // findMatchInWindow uses GetRecentGames (fixture is HastyBot's games, not
    // containing Hannibal9) — so stub it to return our normalized game.
    const game = await service.getGameData('TfnqTZkYPL');
    jest.spyOn(service, 'findMatchInWindow').mockResolvedValue(game);

    const ok = await service.validateSubmittedScore('Hannibal9', 'HastyBot', 401, 503, WINDOW);
    expect(ok.valid).toBe(true);

    const bad = await service.validateSubmittedScore('Hannibal9', 'HastyBot', 400, 503, WINDOW);
    expect(bad.valid).toBe(false);
    expect(bad.reason).toContain('401');
  });

  it('rejects malformed usernames', () => {
    expect(service.validateUsername('Hannibal9')).toBe(true);
    expect(service.validateUsername('bad name!')).toBe(false);
    expect(service.validateUsername('')).toBe(false);
  });
});

describe('WooglesService.findMatchInWindow — fenêtre de ronde (Règlement V3 §III.B)', () => {
  let service: WooglesService;

  const withRecent = (games: ReturnType<typeof fakeGame>[]) => {
    global.fetch = mockFetchWithRecent(games) as unknown as typeof fetch;
    service = new WooglesService();
  };

  it('rejette une partie sans date au lieu de l’accepter', async () => {
    // Défaut V2 : le test de date était sauté quand created_at manquait, si
    // bien qu’une partie de n’importe quel âge validait la ronde.
    withRecent([fakeGame('nodate', undefined)]);
    expect(await service.findMatchInWindow('Hannibal9', 'HastyBot', WINDOW)).toBeNull();
  });

  it('rejette une partie antérieure à la ronde', async () => {
    withRecent([fakeGame('vieille', '2026-05-01T12:00:00Z')]);
    expect(await service.findMatchInWindow('Hannibal9', 'HastyBot', WINDOW)).toBeNull();
  });

  it('rejette une partie postérieure à la ronde', async () => {
    // Défaut V2 : aucune borne haute n’était appliquée.
    withRecent([fakeGame('tardive', '2026-07-29T12:00:00Z')]);
    expect(await service.findMatchInWindow('Hannibal9', 'HastyBot', WINDOW)).toBeNull();
  });

  it('retient la PREMIÈRE partie de la ronde, pas la plus récente', async () => {
    // Woogles liste du plus récent au plus ancien : l’ancien `find()` retenait
    // donc la dernière partie, ce qui permettait de rejouer jusqu’à ce que le
    // résultat convienne.
    withRecent([
      fakeGame('troisieme', '2026-07-27T18:00:00Z'),
      fakeGame('deuxieme', '2026-07-26T18:00:00Z'),
      fakeGame('premiere', '2026-07-26T09:00:00Z'),
    ]);

    const game = await service.findMatchInWindow('Hannibal9', 'HastyBot', WINDOW);
    expect(game?.createdAt).toBe('2026-07-26T09:00:00Z');
  });

  it('ignore les parties annulées ou abandonnées', async () => {
    withRecent([
      fakeGame('annulee', '2026-07-26T09:00:00Z', 'ABORTED'),
      fakeGame('valide', '2026-07-26T18:00:00Z'),
    ]);

    const game = await service.findMatchInWindow('Hannibal9', 'HastyBot', WINDOW);
    expect(game?.createdAt).toBe('2026-07-26T18:00:00Z');
  });

  it('ignore les parties contre un autre adversaire', async () => {
    const other = {
      ...fakeGame('autre', '2026-07-26T09:00:00Z'),
      players: [{ nickname: 'Hannibal9' }, { nickname: 'QuelquUnDautre' }],
    };
    withRecent([other, fakeGame('bonne', '2026-07-26T18:00:00Z')]);

    const game = await service.findMatchInWindow('Hannibal9', 'HastyBot', WINDOW);
    expect(game?.createdAt).toBe('2026-07-26T18:00:00Z');
  });
});
