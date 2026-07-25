import {
  WooglesGameData,
  WooglesGameEvent,
  WooglesGameHistory,
  WooglesGameInfo,
  PlayerWooglesStats,
} from '@/types/Woogles';
import { Move } from '@/types/ISC';
import { FirebasePlayerRepository } from '@/api/repository/FirebasePlayerRepository';
import { RoundWindow, isGameWithinWindow } from '@/lib/roundWindow';

const WOOGLES_API_BASE =
  'https://woogles.io/api/game_service.GameMetadataService';

/** Game end reasons that mean no valid result exists for league purposes */
const VOID_END_REASONS = new Set(['NONE', 'ABORTED', 'CANCELLED', 'FORCE_FORFEIT']);

export class WooglesService {
  private playerRepo = new FirebasePlayerRepository();

  private async rpc<T>(method: string, body: unknown): Promise<T> {
    const res = await fetch(`${WOOGLES_API_BASE}/${method}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      // Results must reflect the live Woogles state, never a cached page
      cache: 'no-store',
    });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`Woogles ${method} failed (HTTP ${res.status}): ${text.slice(0, 200)}`);
    }
    return (await res.json()) as T;
  }

  validateUsername(username: string): boolean {
    // Woogles usernames: letters, digits, underscore, dash and dot
    return /^[A-Za-z0-9_.-]{1,30}$/.test(username);
  }

  async getRecentGames(
    username: string,
    numGames = 20,
    offset = 0
  ): Promise<WooglesGameInfo[]> {
    const data = await this.rpc<{ game_info?: WooglesGameInfo[] }>(
      'GetRecentGames',
      { username, numGames, offset }
    );
    return data.game_info ?? [];
  }

  async getGCG(gameId: string): Promise<string> {
    const data = await this.rpc<{ gcg: string }>('GetGCG', { game_id: gameId });
    return data.gcg;
  }

  async getGameHistory(gameId: string): Promise<WooglesGameHistory> {
    const data = await this.rpc<{ history: WooglesGameHistory }>(
      'GetGameHistory',
      { game_id: gameId }
    );
    return data.history;
  }

  /**
   * Fetch a game and normalize it into WooglesGameData
   * (structurally compatible with the legacy ISCGameData used by the UI).
   */
  async getGameData(gameId: string, includeGCG = true): Promise<WooglesGameData> {
    const [history, gcg] = await Promise.all([
      this.getGameHistory(gameId),
      includeGCG ? this.getGCG(gameId).catch(() => undefined) : Promise.resolve(undefined),
    ]);
    return this.normalizeHistory(gameId, history, gcg);
  }

  private normalizeHistory(
    gameId: string,
    history: WooglesGameHistory,
    gcg?: string,
    createdAt?: string
  ): WooglesGameData {
    const nick0 = history.players[0]?.nickname ?? 'player1';
    const nick1 = history.players[1]?.nickname ?? 'player2';
    const finalScores = history.final_scores ?? [0, 0];

    const move_history: Move[] = (history.events ?? [])
      .filter((e) => e.type === 'TILE_PLACEMENT_MOVE' || e.type === 'EXCHANGE' || e.type === 'PASS')
      .map((e) => ({
        player: e.player_index === 0 ? nick0 : nick1,
        word: this.describeEvent(e),
        score: e.score,
        position: e.position || '',
        isBingo: !!e.is_bingo,
      }));

    const winner =
      finalScores[0] === finalScores[1]
        ? ''
        : finalScores[0] > finalScores[1]
          ? nick0
          : nick1;

    return {
      gameId,
      lexicon: history.lexicon,
      letterDistribution: history.letter_distribution,
      createdAt,
      players: [nick0, nick1],
      scores: { [nick0]: finalScores[0], [nick1]: finalScores[1] },
      move_history,
      winner,
      events: history.events ?? [],
      gcg,
    };
  }

  private describeEvent(e: WooglesGameEvent): string {
    if (e.type === 'EXCHANGE') return `(exch ${e.exchanged || '?'})`;
    if (e.type === 'PASS') return '(pass)';
    return e.played_tiles;
  }

  /** Parties terminées entre deux joueurs, sans aucun filtre de date. */
  private async candidatesBetween(
    username1: string,
    username2: string,
    searchDepth: number
  ): Promise<WooglesGameInfo[]> {
    const u1 = username1.toLowerCase();
    const u2 = username2.toLowerCase();
    const games = await this.getRecentGames(username1, searchDepth, 0);

    return games.filter((g) => {
      const nicks = g.players.map((p) => p.nickname.toLowerCase());
      if (!nicks.includes(u1) || !nicks.includes(u2)) return false;
      return !VOID_END_REASONS.has(g.game_end_reason);
    });
  }

  /**
   * La partie qui compte pour une ronde (Règlement V3 §III.B).
   *
   * Trois garanties, chacune corrigeant un défaut de l'implémentation V2 :
   *   - une partie sans `created_at` est rejetée (elle était acceptée quel que
   *     soit son âge, le test de date étant sauté quand la date manquait) ;
   *   - les DEUX bornes de la fenêtre sont appliquées (seule la borne basse
   *     l'était, et uniquement si un `sinceISO` avait été fourni) ;
   *   - si plusieurs parties tombent dans la fenêtre, c'est la PREMIÈRE qui
   *     fait foi, jamais la plus récente — sinon deux joueurs peuvent rejouer
   *     jusqu'à ce que le résultat leur convienne.
   */
  async findMatchInWindow(
    username1: string,
    username2: string,
    window: RoundWindow,
    searchDepth = 50
  ): Promise<WooglesGameData | null> {
    const inWindow = (await this.candidatesBetween(username1, username2, searchDepth)).filter(
      (g) => isGameWithinWindow(g.created_at, window)
    );

    if (inWindow.length === 0) return null;

    // Woogles liste du plus récent au plus ancien : prendre le premier élément
    // renverrait la dernière partie de la ronde.
    const first = inWindow.reduce((earliest, g) =>
      new Date(g.created_at).getTime() < new Date(earliest.created_at).getTime() ? g : earliest
    );

    const data = await this.getGameData(first.game_id);
    data.createdAt = first.created_at;
    return data;
  }

  /**
   * Dernière partie entre deux joueurs — outil de consultation manuelle.
   *
   * NE PAS utiliser pour valider un résultat de ligue : sans fenêtre de ronde,
   * rien ne garantit que la partie trouvée appartienne à la ronde en cours.
   * Utiliser `findMatchInWindow`.
   */
  async findLatestBetween(
    username1: string,
    username2: string,
    sinceISO?: string,
    searchDepth = 50
  ): Promise<WooglesGameData | null> {
    const candidates = await this.candidatesBetween(username1, username2, searchDepth);
    const since = sinceISO ? new Date(sinceISO).getTime() : null;

    const inRange =
      since === null
        ? candidates
        : candidates.filter((g) => {
            if (!g.created_at) return false;
            const t = new Date(g.created_at).getTime();
            return !Number.isNaN(t) && t >= since;
          });

    if (inRange.length === 0) return null;

    const dated = inRange.filter((g) => g.created_at && !Number.isNaN(new Date(g.created_at).getTime()));
    const latest = dated.length
      ? dated.reduce((newest, g) =>
          new Date(g.created_at).getTime() > new Date(newest.created_at).getTime() ? g : newest
        )
      : inRange[0];

    const data = await this.getGameData(latest.game_id);
    data.createdAt = latest.created_at;
    return data;
  }

  /**
   * Compare des scores saisis à la main au résultat Woogles de la ronde.
   * La fenêtre est obligatoire : sans elle, un score peut être « validé »
   * contre une partie vieille de plusieurs mois.
   */
  async validateSubmittedScore(
    username1: string,
    username2: string,
    player1Score: number,
    player2Score: number,
    window: RoundWindow
  ): Promise<{ valid: boolean; game?: WooglesGameData; reason?: string }> {
    const game = await this.findMatchInWindow(username1, username2, window);
    if (!game) {
      return { valid: false, reason: 'NOT_FOUND' };
    }
    const s1 = this.scoreFor(game, username1);
    const s2 = this.scoreFor(game, username2);
    if (s1 === player1Score && s2 === player2Score) {
      return { valid: true, game };
    }
    return {
      valid: false,
      game,
      reason: `Woogles reports ${s1}–${s2}`,
    };
  }

  /** Score for a username inside a normalized game (case-insensitive). */
  scoreFor(game: WooglesGameData, username: string): number {
    const key = Object.keys(game.scores).find(
      (k) => k.toLowerCase() === username.toLowerCase()
    );
    return key !== undefined ? game.scores[key] : NaN;
  }

  /**
   * Compute and persist aggregate Woogles stats for a league player,
   * based on their recent games on the platform.
   */
  async calculateAndStorePlayerStats(
    wooglesUsername: string,
    games: WooglesGameData[]
  ): Promise<void> {
    try {
      if (games.length === 0) return;
      const stats = this.computeStats(wooglesUsername, games);

      const players = await this.playerRepo.getAllPlayers();
      const player = players.find(
        (p) =>
          (p.wooglesUsername ?? p.iscUsername)?.toLowerCase() ===
          wooglesUsername.toLowerCase()
      );
      if (!player) {
        console.warn(`[WooglesService] No league player with username ${wooglesUsername}`);
        return;
      }

      await this.playerRepo.updatePlayer(player.id, {
        statistics: { ...player.statistics, wooglesData: stats },
      });
    } catch (error) {
      // Stats are best-effort; never block result processing on them
      console.error(`[WooglesService] Failed to store stats for ${wooglesUsername}:`, error);
    }
  }

  private computeStats(
    wooglesUsername: string,
    games: WooglesGameData[]
  ): PlayerWooglesStats {
    const stats: PlayerWooglesStats = {
      wooglesUsername,
      totalGames: games.length,
      totalWins: 0,
      totalBingos: 0,
      averageScore: 0,
      highestScore: 0,
      highestScoringMove: { word: '', score: 0 },
      lastUpdated: new Date().toISOString(),
    };

    let totalScore = 0;
    for (const game of games) {
      const score = this.scoreFor(game, wooglesUsername);
      if (!Number.isNaN(score)) {
        totalScore += score;
        if (score > stats.highestScore) stats.highestScore = score;
      }
      if (game.winner.toLowerCase() === wooglesUsername.toLowerCase()) {
        stats.totalWins++;
      }
      for (const move of game.move_history) {
        if (move.player.toLowerCase() !== wooglesUsername.toLowerCase()) continue;
        if (move.isBingo) stats.totalBingos++;
        if (move.score > stats.highestScoringMove.score) {
          stats.highestScoringMove = { word: move.word, score: move.score };
        }
      }
    }
    stats.averageScore = Math.round(totalScore / games.length);
    return stats;
  }
}

export const wooglesService = new WooglesService();
